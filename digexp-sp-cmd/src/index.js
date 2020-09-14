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
const fs = require('fs-extra');
const path = require('path');

const config = require('./config');
const Logger = require('./logger');
const { message, errorMessage, equalsIgnoreCase } = require('./utils');
const { SERVER_VERSION, BUILD_NUMBER, SP_CMD_LINE_URL } = require('./constants');

const PullCommand = require('./commands/pull');
const PushCommand = require('./commands/push');
const ListCommand = require('./commands/list');

/**
 * Print help doc.
 * @param {string} doc Help doc name 
 */
function printHelpDoc(doc) {
    const docFile = `${__dirname}/docs/${doc}.txt`;
    fs.createReadStream(docFile).pipe(process.stdout);
}

/**
 * Run command with arguments.
 * @param {string[]} args The arguments
 * @returns command result
 */
exports.run = async function (args) {
    let logger = null;
    try {
        // Print help
        if (!args.length || equalsIgnoreCase(args[0], 'help')) {
            console.log(message('CommandLine.1'));
            console.log(SP_CMD_LINE_URL);
            return { success: true };
        } else if (equalsIgnoreCase(args[0], 'help_en')) {
            printHelpDoc('help');
            return { success: true };
        } else if (equalsIgnoreCase(args[0], 'usage_en')) {
            printHelpDoc('usage');
            return { success: true };
        }

        // Parse command line args
        const cleanArgs = [];
        const commandLineConfig = config.parseCommandLine(args, cleanArgs);
        const contentRoot = path.resolve(commandLineConfig.getString(config.ConfigKeys.CONTENT_ROOT, '.'));
        commandLineConfig.config[config.ConfigKeys.CONTENT_ROOT.toLowerCase()] = contentRoot;

        if (!fs.existsSync(contentRoot)) {
            Logger.defaultLogger.log(errorMessage('WARNING_CMDLN_INVALID_ROOT_FOLDER_0'));
        }

        // Load sp-config.json from home folder and app content root folder
        const homeFolder = config.getHomeFolder();
        const baseConfig = config.loadConfigFile(homeFolder);
        const appConfig = config.loadConfigFile(contentRoot);

        // Merge config
        config.config.merge(baseConfig, appConfig, commandLineConfig.config);

        // Config logger
        Logger.configLogger(contentRoot);
        logger = Logger.getLogger();

        logger.log(message('CommandLine.7', SERVER_VERSION));
        logger.log(message('CommandLine.BuildNumber', BUILD_NUMBER));
        logger.log(message('CommandLine.8', homeFolder));
        logger.logNodeJsEnv(contentRoot);
        logger.logConfig();

        // Create command
        let command;
        if (cleanArgs.length === 1 && equalsIgnoreCase(cleanArgs[0], 'push')) {
            command = new PushCommand(contentRoot);
        } else if (cleanArgs.length === 1 && equalsIgnoreCase(cleanArgs[0], 'pull')) {
            command = new PullCommand(contentRoot);
        } else if (cleanArgs.length === 2 && equalsIgnoreCase(cleanArgs[0], 'list')) {
            command = new ListCommand(cleanArgs[1]);
        } else {
            let msg = errorMessage('ERROR_CMDLN_MALFORMED_COMMAND_1', args.join(' '));
            logger.log(msg);
            console.error(msg);

            if (cleanArgs.length) {
                msg = errorMessage('ERROR_CMDLN_UNRECOGNIZED_OPTIONS_1', cleanArgs.join(' '));
                logger.log(msg);
                console.error(msg);
            }
            return { success: false, msg };
        }

        // Execute command
        await command.loadConfig();
        if (command.validateConfig()) {
            let msg;
            const success = await command.invoke();
            if (success) {
                msg = message('CommandLine.20', logger.getLogPath());
                console.log(msg);
            } else {
                msg = errorMessage('ERROR_CMDLN_CMD_FAILED_1', logger.getLogPath());
                console.error(msg);
            }
            return { success, msg };
        } else {
            const msg = errorMessage('ERROR_CMDLN_BAD_CONFIG_1', logger.getLogPath());
            console.error(msg);
            return { success: false, msg };
        }
    } catch (err) {
        let msg;
        if (err instanceof config.ConfigLoadingIOError) {
            msg = errorMessage('ERROR_CMDLN_ERROR_LOADING_CONFIG_1', err.filePath);
            if (logger) {
                logger.error(msg, err);
                console.error(msg);
            } else {
                console.error(msg);
                console.error(err);
            }
        } else {
            msg = errorMessage('ERROR_CMDLN_CMD_FAILED_0');
            if (logger) {
                logger.error(msg, err);
                console.error(errorMessage('ERROR_CMDLN_CMD_FAILED_LOG_0'));
            } else {
                console.error(msg);
                console.error(err);
            }
        }
        return { success: false, msg };
    } finally {
        if (logger) {
            logger.close();
        }
    }
}
