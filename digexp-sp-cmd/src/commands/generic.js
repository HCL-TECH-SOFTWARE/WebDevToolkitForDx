/*******************************************************************************
 * Copyright HCL Technologies Ltd. 2020
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *******************************************************************************
 */
const got = require('got');
const contentType = require('content-type');
const { CookieJar } = require('tough-cookie');

const Logger = require('../logger');
const { config, ConfigKeys } = require('../config');
const { message, errorMessage, normalizeSlash, equalsIgnoreCase } = require('../utils');
const { EOL, LOCALE, DEFAULT_CONTENTHANDLER_PATH, DEFAULT_AUTO_LOGIN_PATH } = require('../constants');

/**
 * Basic auth handler.
 */
class BasicAuthHandler {

    /**
     * Config basic auth.
     * @param {URL} server Server URL
     * @param {Object} options Options object
     */
    async config(server, options) {
        const user = await config.getStringOrPrompt(ConfigKeys.PORTAL_USER, message('BasicAuthHandler.0'));
        const password = await config.getStringOrPrompt(ConfigKeys.PORTAL_PASSWORD, message('BasicAuthHandler.1'), true);
        options.username = user;
        options.password = password;
    }
}

/**
 * Auto auth handler.
 */
class AutoAuthHandler {

    /**
     * Build auto login URL.
     * @param {URL} server Server URL
     * @param {string} loginPath Auto login path
     * @param {string} user User name
     * @param {string} password Password
     * @returns {URL} Auto login URL
     */
    _buildURL(server, loginPath, user, password) {
        const url = new URL(`${server.origin}${loginPath}`);
        url.searchParams.set('userid', user);
        url.searchParams.set('password', password);
        return url;
    }

    /**
     * Config auto auth.
     * @param {URL} server Server URL
     * @param {Object} options Options object
     */
    async config(server, options) {
        const user = await config.getStringOrPrompt(ConfigKeys.PORTAL_USER, message('AutoAuthHandler.4'));
        const password = await config.getStringOrPrompt(ConfigKeys.PORTAL_PASSWORD, message('AutoAuthHandler.5'), true);
        const loginPath = normalizeSlash(config.getString(ConfigKeys.AUTO_AUTH_LOGIN_PATH, DEFAULT_AUTO_LOGIN_PATH));

        const url = this._buildURL(server, loginPath, user, password);

        const logger = Logger.getLogger();
        logger.log(message('AutoAuthHandler.6', this._buildURL(server, loginPath, user, '********')));

        const resp = await GenericCommand.executeHTTP(url, options);
        if (resp.statusCode != 200) {
            logger.log(errorMessage('ERROR_CMDLN_AUTHN_FAILURE_0'));
        } else {
            logger.log(message('AutoAuthHandler.8'));
        }
    }
}

/**
 * Generic base command.
 */
class GenericCommand {

    /**
     * Constructor.
     * @param {string} contentRoot The content root
     */
    constructor(contentRoot) {
        this.logger = Logger.getLogger();
        this.contentRoot = contentRoot;
    }

    /**
     * Load config.
     */
    async loadConfig() {
        // Misc settings required by all operations.
        this.performAuth = config.getBoolean(ConfigKeys.PERFORM_AUTH, true);
        this.socketTimeout = config.getInteger(ConfigKeys.SOCKET_TIMEOUT, 15000);
        this.connectTimeout = config.getInteger(ConfigKeys.CONNECT_TIMEOUT, 15000);
        this.laxSSL = config.getBoolean(ConfigKeys.LAX_SSL, false);

        // URL settings required by all operations.
        this.contentHandlerPath = config.getString(ConfigKeys.CONTENTHANDLER_PATH, DEFAULT_CONTENTHANDLER_PATH);
        this.projectContext = config.getString(ConfigKeys.PROJECT_CONTEXT, null);
        this.virtualPortalContext = config.getString(ConfigKeys.VIRTUAL_PORTAL_CONTEXT, config.getString(ConfigKeys.VIRTUAL_PORTAL_ID, null));
        this.scriptPortletServerUri = await config.getUrlOrPrompt(ConfigKeys.SCRIPT_PORTLET_SERVER, message('GenericCommand.2'));
    }

    /**
     * Get URL to call.
     * @param {string} uriParameter The 'uri' query parameter
     * @returns {URL} url to call
     */
    getUri(uriParameter) {
        let path = normalizeSlash(this.contentHandlerPath);

        if (this.virtualPortalContext && this.virtualPortalContext.length) {
            path += normalizeSlash(this.virtualPortalContext);
        }
        if (this.projectContext && this.projectContext.length) {
            path += '/$project' + normalizeSlash(this.projectContext);
        }

        const uri = new URL(`${this.scriptPortletServerUri.origin}${path}`);
        uri.searchParams.set('uri', uriParameter);

        return uri;
    }

    /**
     * Get HTTP options.
     * @returns {Promise<Object>} HTTP options
     */
    async getOptions() {

        const options = {
            cookieJar: new CookieJar(),
            timeout: {
                connect: this.connectTimeout,
                socket: this.socketTimeout,
            },
            throwHttpErrors: false,
        };

        if (this.laxSSL) {
            options.https = {
                rejectUnauthorized: false,
                checkServerIdentity: () => { },
            };
        }

        if (this.performAuth) {
            const authHandlerClass = config.getString(ConfigKeys.AUTHENTICATION_HANDLER, 'BasicAuthHandler');
            let authHandler;
            if (equalsIgnoreCase(authHandlerClass, 'BasicAuthHandler')
                || equalsIgnoreCase(authHandlerClass, 'com.ibm.wps.scriptportlet.cmdln.BasicAuthHandler')) {
                authHandler = new BasicAuthHandler();
            } else if (equalsIgnoreCase(authHandlerClass, 'AutoAuthHandler')
                || equalsIgnoreCase(authHandlerClass, 'com.ibm.wps.scriptportlet.cmdln.AutoAuthHandler')) {
                authHandler = new AutoAuthHandler();
            } else {
                this.logger.log(errorMessage('ERROR_CMDLN_AUTHN_HANDLER_1', authHandlerClass));
                authHandler = new BasicAuthHandler();
            }

            await authHandler.config(this.scriptPortletServerUri, options);
            options.authHandler = authHandler;
        }

        this._addAcceptedLanguages(options);

        return options;
    }

    /**
     * Add Accept-Language header.
     * @param {Object} options HTTP options
     * @private
     */
    _addAcceptedLanguages(options) {

        const lang = LOCALE.split('-')[0];
        let langs = LOCALE;
        if (lang) {
            langs += ',' + lang;
        }
        if (lang !== 'en') {
            langs += ',en';
        }

        options.headers = options.headers || {};
        options.headers['accept-language'] = langs;
        options.headers['accept'] = 'application/json';

        this.logger.log(`Accept-Language: ${langs}`);
    }

    /**
     * Check whether file should be excluded.
     * @param {string} fileName File name
     * @param {string[]} excludes Exclude regex patterns
     * @returns {boolean} true if file should be excluded; false otherwise
     */
    static isExcluded(fileName, excludes) {
        if (excludes) {
            for (const ex of excludes) {
                if (new RegExp(ex).test(fileName)) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Execute HTTP call.
     * @param {URL} url URL to call
     * @param {Object} options HTTP options
     * @param {Function} bodyParser Response body handler
     * @returns {Promise<Object>} HTTP response
     */
    static async executeHTTP(url, options, bodyParser) {
        const logger = Logger.getLogger();

        const resp = await got(url, options);

        logger.log(message('GenericResponseHandler.11', `HTTP/${resp.httpVersion} ${resp.statusCode} ${resp.statusMessage}`));

        const contentTypeHeader = resp.headers['content-type'];

        if (contentTypeHeader) {
            logger.log(`Content-Type: ${contentTypeHeader}`);

            const defaultResponseCharset = config.getString(ConfigKeys.DEFAULT_RESPONSE_CHAR_SET, 'UTF-8');
            logger.log(message('GenericResponseHandler.12', `${contentType.parse(contentTypeHeader).parameters.charset || defaultResponseCharset}`));

            let body = resp.body;
            if (bodyParser && resp.statusCode === 200) {
                try {
                    body = resp.parsedBody = await bodyParser(resp.body);
                } catch (err) {
                    resp.error = err.message;
                    logger.error(message('GenericResponseHandler.14'), err);
                    return resp;
                }
            }

            logger.log(message('GenericResponseHandler.13', `${EOL}${EOL} ${typeof body === 'string' ? body : JSON.stringify(body)}`));
        }

        logger.logAuth(options, resp.statusCode);

        return resp;
    }
}

module.exports = GenericCommand;
