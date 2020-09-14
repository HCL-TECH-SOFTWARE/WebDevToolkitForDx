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
const yauzl = require('yauzl');

const GenericCommand = require('./generic');

const { config, ConfigKeys } = require('../config');
const { DEFAULT_PULL_URI_PATH } = require('../constants');

/**
 * Pull command.
 */
class PullCommand extends GenericCommand {

    /**
     * Load config.
     */
    async loadConfig() {
        await super.loadConfig();
        this.pullGetParameters = config.getObject(ConfigKeys.PULL_GET_PARAMETERS);
        this.pullUriPath = config.getString(ConfigKeys.PULL_URI_PATH, DEFAULT_PULL_URI_PATH);
        this.wcmContentId = await config.getStringOrPrompt(ConfigKeys.WCM_CONTENT_ID, 'WCM Content ID: ');
    }

    /**
     * Validate config.
     * @returns {boolean} true always
     */
    validateConfig() {
        return true;
    }

    /**
     * Invoke this command.
     * @returns {Promise<boolean>} true if command is successful; false otherwise
     */
    async invoke() {
        this.logger.log('Begin content pull from Portal.');

        try {
            const options = await this.getOptions();
            options.responseType = 'buffer';

            const uri = this.getUri(`${this.pullUriPath}${this.wcmContentId}`);
            if (this.pullGetParameters) {
                for (const key of Object.keys(this.pullGetParameters)) {
                    uri.searchParams.set(key, this.pullGetParameters[key] + '');
                }
            }

            this.logger.log(`Pull URL: GET ${uri}`);
            this.logger.log(`Virtual Portal Context: ${this.virtualPortalContext}`);
            this.logger.log(`Project Context: ${this.projectContext}`);
            this.logger.log(`WCM content ID: ${this.wcmContentId}`);

            const contentRoot = this.contentRoot;

            // The existing Java code does not exclude when pull zip
            const excludes = null;

            // The handler to unzip response body which represents a zip file
            const unzip = (body) => {
                return new Promise((resolve, reject) => {
                    const result = {};
                    yauzl.fromBuffer(body, { lazyEntries: true }, (err, zipfile) => {
                        if (err) return reject(err);

                        zipfile.readEntry();
                        zipfile.on('error', (err) => reject(err));

                        zipfile.on('entry', function (entry) {
                            if (/\/$/.test(entry.fileName) || GenericCommand.isExcluded(entry.fileName, excludes)) {
                                // Directory file names end with '/'
                                zipfile.readEntry();
                            } else {
                                // File entry
                                zipfile.openReadStream(entry, function (err, readStream) {
                                    if (err) return reject(err);

                                    try {
                                        const filePath = path.resolve(contentRoot, entry.fileName);
                                        fs.ensureDirSync(path.dirname(filePath));

                                        readStream.on('error', (err) => reject(err));

                                        readStream.on('end', function () {
                                            result[entry.fileName] = entry.uncompressedSize;
                                            zipfile.readEntry();
                                        });

                                        const writeStream = fs.createWriteStream(filePath);

                                        writeStream.on('error', (err) => reject(err));

                                        readStream.pipe(writeStream);
                                    } catch (err) {
                                        reject(err);
                                    }
                                });
                            }
                        });

                        zipfile.on('end', function () {
                            zipfile.close();
                            resolve(result);
                        });
                    });
                });
            };

            // Execute HTTP request
            const resp = await GenericCommand.executeHTTP(uri, options, unzip);

            if (resp.error || resp.statusCode != 200) {
                this.logger.log('Application pull failed.');
                return false;
            }

            if (!resp.parsedBody) {
                this.logger.log('Application pull failed.  Did not receive the expected body content.');
                return false;
            }

            this.logger.logUnzipInfo(resp.parsedBody);

            this.logger.log('Content pull was successful.');
            this.logger.log('End content pull from Portal.');

        } catch (err) {
            this.logger.error('Application pull failed.', err);
            return false;
        }

        return true;
    }
}

module.exports = PullCommand;
