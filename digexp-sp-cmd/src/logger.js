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
const winston = require('winston');

const { EOL } = require('./constants');
const { message, errorMessage } = require('./utils');
const { config, ConfigKeys } = require('./config');

const LOG_FILE = 'sp-cmdln.log';

/**
 * Logger class.
 */
class Logger {

    /**
     * Constructor.
     * @param {string} contentRoot Root folder to create sp-cmdln.log file
     */
    constructor(contentRoot) {
        this.contentRoot = contentRoot;

        // transports
        let transports;
        if (contentRoot) {
            const appendLog = config.getBoolean(ConfigKeys.APPEND_TO_LOG_FILE, false);
            const encoding = config.getString(ConfigKeys.DEFAULT_LOG_FILE_CHARSET, 'utf8');

            transports = new winston.transports.File({
                dirname: contentRoot,
                filename: LOG_FILE,
                level: 'info',
                options: { flags: appendLog ? 'a' : 'w', encoding }
            });
        } else {
            transports = new winston.transports.Console({
                level: 'info',
                stderrLevels: ['info', 'error']
            });
        }

        // formats
        const formats = winston.format;
        const format = formats.combine(
            formats.errors({ stack: true }),
            formats.timestamp({ format: 'YYYY-MM-DD HH:mm:ss -- ' }),
            formats.printf((info) => info.stack ? info.stack + EOL + EOL : info.timestamp + info.message),
        );

        // Create logger
        this._log = winston.createLogger({ format, transports });
    }

    /**
     * Get log path.
     * @returns {string} log path
     */
    getLogPath() {
        if (this.contentRoot) {
            return path.resolve(this.contentRoot, LOG_FILE);
        }
        return errorMessage('WARN_CMDLN_LOG_STDERR_0');
    }

    /**
     * Log message.
     * @param {string} message to log
     */
    log(message) {
        this._log.info(message + EOL);
    }

    /**
     * Log error.
     * @param {string} message Message to log
     * @param {Error} error Error to log
     */
    error(message, error) {
        this.log(message);
        this._log.error(error);
    }

    /**
     * Log config.
     */
    logConfig() {
        this.log(message('Logger.10', config.toString()));
    }

    /**
     * Log NodeJS env.
     * @param {string} contentRoot The content root
     */
    logNodeJsEnv(contentRoot) {
        let configs = path.resolve(path.dirname(__dirname), 'sp-config.json');
        const appConfig = path.resolve(contentRoot, 'sp-config.json');
        if (fs.existsSync(appConfig)) {
            configs += EOL + '\t\t\t   ' + appConfig;
        }

        this.log(`NodeJS environment:${EOL}${EOL}\tspConfig = ${configs}${EOL}\tnodePath = ${process.execPath}${EOL}\tversion  = ${process.version}`);
    }

    /**
     * Log auth result.
     * @param {Object} options HTTP options
     * @param {number} statusCode HTTP status code
     */
    logAuth(options, statusCode) {
        if (!options.authHandler) {
            return;
        }

        let authState = {};
        if (statusCode === 401 || statusCode === 403) {
            authState = {
                state: 'FAILURE',
                scheme: 'null',
                credentials: 'null',
            };
        } else {
            const authHandlerName = options.authHandler.constructor.name;
            switch (authHandlerName) {
                case 'BasicAuthHandler':
                    authState = {
                        state: 'SUCCESS',
                        scheme: 'BASIC',
                        credentials: `[principal: ${options.username}]`,
                    };
                    break;
                case 'AutoAuthHandler':
                    authState = {
                        state: 'UNCHALLENGED',
                        scheme: 'null',
                        credentials: 'null',
                    };
                    break;
                default:
                    break;
            }
        }

        this.log(message('PushCommand.18', authState.state));
        this.log(message('PushCommand.19', authState.scheme));
        this.log(message('PushCommand.20', authState.credentials));
    }

    /**
     * Log unzip info.
     * @param {Object} unzippedFiles Info of unzipped files
     */
    logUnzipInfo(unzippedFiles) {
        let numberOfEntries = 0;
        let bytesWritten = 0;
        let entryList = '';

        try {
            for (const name of Object.keys(unzippedFiles)) {
                numberOfEntries += 1;
                bytesWritten += unzippedFiles[name];
                entryList += `${EOL}\t${message('Logger.0', name, unzippedFiles[name].toLocaleString())}`;
            }
        } catch (err) {
            this.error(errorMessage('ERROR_CMDLN_ERROR_LOGGING_ARCHIVE_0'), err);
        }
        this.log(message('Logger.22', bytesWritten.toLocaleString(), numberOfEntries.toLocaleString(), EOL + entryList));
    }

    /**
     * Log zip info.
     * @param {string} zipFilePath Zip file path
     * @param {string[]} zippedFiles Zipped files
     */
    logZipInfo(zipFilePath, zippedFiles) {

        let fileSize = 0;
        let entryList = '';
        let numberOfEntries;

        try {
            fileSize = fs.statSync(zipFilePath).size;
            for (const zf of zippedFiles) {
                entryList += `${EOL}\t${zf}`;
            }
            numberOfEntries = zippedFiles.length;
        } catch (err) {
            numberOfEntries = message('Logger.24');
            entryList = '';
        }

        this.log(message('Logger.26', `${EOL}${EOL}\t${zipFilePath}${EOL}\t`, fileSize, numberOfEntries, `${EOL}${entryList}`));
    }

    /**
     * Close logger.
     */
    close() {
        this._log.close();
    }
}

// The default logger which logs to stderr.
exports.defaultLogger = new Logger();

let logger;

/**
 * Config logger.
 * @param {string} contentRoot Root folder to create sp-cmdln.log file
 */
exports.configLogger = function (contentRoot) {
    if (contentRoot && fs.existsSync(contentRoot) && fs.statSync(contentRoot).isDirectory()) {
        try {
            logger = new Logger(contentRoot);
        } catch (err) {
            logger = exports.defaultLogger;
            logger.error(errorMessage('ERROR_CMDLN_LOG_INIT_FAILED_0'), err);
        }
    } else {
        logger = exports.defaultLogger;
        logger.log(message('Logger.4'));
    }
}

/**
 * Get logger.
 * @returns {Logger} logger
 */
exports.getLogger = function () {
    return logger;
}
