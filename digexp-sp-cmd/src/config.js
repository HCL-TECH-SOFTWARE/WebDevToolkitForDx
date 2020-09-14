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
const path = require('path');
const fs = require('fs-extra');
const { prompt } = require('enquirer');

const { EOL } = require('./constants');
const { errorMessage, equalsIgnoreCase } = require('./utils');

const CONFIG_FILE = 'sp-config.json';

exports.ConfigKeys = {
    APPEND_TO_LOG_FILE: 'appendToLogFile',
    DEFAULT_LOG_FILE_CHARSET: 'defaultLogFileCharset',
    DEFAULT_RESPONSE_CHAR_SET: 'defaultResponseCharset',

    CONNECT_TIMEOUT: 'connectTimeout',
    CONTENT_ROOT: 'contentRoot',
    CONTENTHANDLER_PATH: 'contenthandlerPath',
    EXCLUDES: 'excludes',
    LAX_SSL: 'laxSSL',
    MAIN_HTML_FILE: 'mainHtmlFile',
    PERFORM_AUTH: 'performAuth',
    PORTAL_PASSWORD: 'portalPassword',
    PORTAL_USER: 'portalUser',
    PREBUILT_ZIP: 'prebuiltZIP',
    PROJECT_CONTEXT: 'projectContext',
    SCRIPT_PORTLET_SERVER: 'scriptPortletServer',
    SOCKET_TIMEOUT: 'socketTimeout',
    WCM_CONTENT_ID: 'wcmContentId',
    WCM_CONTENT_NAME: 'wcmContentName',
    WCM_CONTENT_PATH: 'wcmContentPath',
    WCM_CONTENT_TITLE: 'wcmContentTitle',
    WCM_SITE_AREA: 'wcmSiteArea',

    // Deprecated, undocumented, here for backward compat with TK and build scripts, but only supports context value not id value
    VIRTUAL_PORTAL_ID: 'virtualPortalID',
    // Use this instead of the old virtualPortalID arg (which also took a vp context)
    VIRTUAL_PORTAL_CONTEXT: 'virtualPortalContext',

    // Options below currently not documented but here as an escape hatch if needed.
    AUTHENTICATION_HANDLER: 'authenticationHandler',
    AUTO_AUTH_LOGIN_PATH: 'autoAuthLoginPath',
    CLIENT_PROVIDER: 'clientProvider',
    PULL_GET_PARAMETERS: 'pullGetParameters',
    PULL_URI_PATH: 'pullUriPath',
    PUSH_POST_PARAMETERS: 'pushPostParameters',
    PUSH_URI_PATH: 'pushUriPath',
}

const lowerCaseKeys = {};
for (const key of Object.keys(exports.ConfigKeys)) {
    const configKey = exports.ConfigKeys[key];
    lowerCaseKeys[configKey.toLowerCase()] = configKey;
}

/**
 * Config class.
 */
class Config {

    /**
     * Constructor.
     * @param {Object} config Plain config object
     */
    constructor(config) {
        this.config = {};
        this.merge(config);
    }

    /**
     * Merge configs.
     * @param {Object[]} configs Plain config objects
     */
    merge(...configs) {
        for (const config of configs) {
            for (const key of Object.keys(config)) {
                this.config[key.toLowerCase()] = config[key];
            }
        }
    }

    /**
     * Convert to string for loggint.
     * @returns {string} string representation.
     */
    toString() {
        let result = EOL;

        for (const key of Object.keys(this.config)) {
            const prettyKey = lowerCaseKeys[key] ? lowerCaseKeys[key] : key;
            result += `${EOL}\t${prettyKey} = `;

            if (equalsIgnoreCase(key, exports.ConfigKeys.PORTAL_PASSWORD)) {
                result += '********';
            } else if (Array.isArray(this.config[key])) {
                result += `[${this.config[key].join(', ')}]`;
            } else {
                result += this.config[key];
            }
        }
        return result;
    }

    /**
     * Get int value.
     * @param {string} key Config key
     * @param {number} defaultValue Default value
     * @returns {number} int value
     */
    getInteger(key, defaultValue) {
        const value = this.config[key.toLowerCase()];
        if (value == null) {
            return defaultValue;
        }

        if (Number.isInteger(value)) {
            return value;
        }

        if (typeof value === 'string') {
            const int = Number.parseInt(value);
            if (Number.isInteger(int)) {
                return int;
            }
        }

        throw new Error(errorMessage('ERROR_CMDLN_CONFIG_INTEGER_1', key));
    }

    /**
     * Get boolean value.
     * @param {string} key Config key 
     * @param {boolean} defaultValue Default value
     * @returns {boolean} boolean value
     */
    getBoolean(key, defaultValue) {
        const value = this.config[key.toLowerCase()];
        if (value == null) {
            return defaultValue;
        }

        if (typeof value === 'boolean') {
            return value;
        }

        if (typeof value === 'string') {
            if (equalsIgnoreCase(value, 'true')) {
                return true;
            }
            if (equalsIgnoreCase(value, 'false')) {
                return false;
            }
        }

        throw new Error(errorMessage('ERROR_CMDLN_CONFIG_BOOLEAN_1', key));
    }

    /**
     * Get object value.
     * @param {string} key Config key 
     * @param {Object} defaultValue Default value
     * @returns {Object} object value
     */
    getObject(key, defaultValue) {
        const value = this.config[key.toLowerCase()];
        if (value == null) {
            return defaultValue;
        }
        if (typeof value === 'object') {
            return value;
        }
        throw new Error(errorMessage('ERROR_CMDLN_CONFIG_JSON_1', key));
    }

    /**
     * Get string value.
     * @param {string} key Config key
     * @param {string} defaultValue Default value
     * @returns {string} string value
     */
    getString(key, defaultValue) {
        const value = this.config[key.toLowerCase()];
        if (value == null) {
            return defaultValue;
        }
        if (typeof value === 'string') {
            return value;
        }
        throw new Error(errorMessage('ERROR_CMDLN_CONFIG_STRING_1', key));
    }

    /**
     * Get string array value.
     * @param {string} key Config key
     * @param {string[]} defaultValue Default value
     * @returns {string[]} string array value
     */
    getArrayOfStrings(key, defaultValue) {
        const value = this.config[key.toLowerCase()];
        if (value == null) {
            return defaultValue;
        }

        if (typeof value === 'string') {
            return value.split(',');
        }

        let valid = false;
        if (Array.isArray(value)) {
            valid = true;
            for (const v of value) {
                if (typeof v !== 'string') {
                    valid = false;
                    break;
                }
            }
        }

        if (valid) {
            return value;
        }
        throw new Error(errorMessage('ERROR_CMDLN_CONFIG_ARRAY_STRINGS_1', key));
    }

    /**
     * Get string value, prompt user input if not present.
     * @param {string} key Config key
     * @param {string} message Prompt message
     * @param {boolean} forPassword Whether for password
     * @returns {Promise<string>} string value
     */
    async getStringOrPrompt(key, message, forPassword) {
        let value = this.config[key.toLowerCase()];

        if (value == null || value === '') {
            value = (await prompt({
                message, type: forPassword ? 'password' : 'input', name: 'value',
                validate: (input) => {
                    return !!input;
                }
            })).value;
        }

        if (typeof value === 'string') {
            return value;
        }

        throw new Error(errorMessage('ERROR_CMDLN_CONFIG_STRING_1', key));
    }

    /**
     * Get URL value, prompt user input if not present.
     * @param {string} key Config key
     * @param {string} message Prompt message
     * @returns {Promise<URL>} URL value
     */
    async getUrlOrPrompt(key, message) {
        let value = this.config[key.toLowerCase()];

        if (value == null || value === '') {
            value = (await prompt({
                message, type: 'input', name: 'value',
                validate: (input) => {
                    try {
                        new URL(input);
                        return true;
                    } catch (e) {
                        return 'Invalid URL';
                    }
                }
            })).value;
        }

        try {
            return new URL(value);
        } catch (e) {
            throw new Error(errorMessage('ERROR_CMDLN_CONFIG_URL_1', key));
        }
    }
}

/**
 * Config file loading IO error.
 */
class ConfigLoadingIOError extends Error {

    /**
     * Constructor.
     * @param {string} filePath Config file path
     * @param {string} message Error message
     */
    constructor(filePath, message) {
        super(message);
        this.filePath = filePath;
    }
}

exports.ConfigLoadingIOError = ConfigLoadingIOError;

exports.config = new Config({});

/**
 * Get home folder.
 * @returns {string} Home folder.
 */
exports.getHomeFolder = function () {
    const home = process.env.SP_CMDLN_HOME;
    return home || path.dirname(__dirname);
}

/**
 * Load sp-config.json from given folder.
 * @param {string} folder Folder to load sp-config.json
 * @returns {Object} Config loaded
 */
exports.loadConfigFile = function (folder) {
    if (!folder) {
        return {};
    }

    const filePath = path.resolve(folder, CONFIG_FILE);

    try {
        if (fs.existsSync(filePath)) {
            return require(filePath);
        }
        return {};
    } catch (err) {
        throw new ConfigLoadingIOError(filePath, err.message);
    }
}

/**
 * Parse command line arguments.
 * @param {string[]} args Arguments to parse
 * @param {string[]} cleanArgs Clean arguments represent command
 * @returns {Config} parsed command line config
 */
exports.parseCommandLine = function (args, cleanArgs) {
    const config = {};

    for (let i = 0; i < args.length; i++) {
        const arg = args[i].trim();
        if (!arg.length) {
            continue;
        }

        const oneMoreArg = i < args.length - 1;

        if (args[i].startsWith('-') && oneMoreArg) {
            const lowerCaseKey = arg.substring(1).toLowerCase();
            if (lowerCaseKeys[lowerCaseKey]) {
                config[lowerCaseKey] = args[++i];
            } else {
                console.error(errorMessage('WARN_CMDLN_IGNORING_UNRECOGNIZED_OPTIONS_2', args[i], args[++i]))
            }
        } else {
            cleanArgs.push(arg);
        }
    }

    return new Config(config);
}
