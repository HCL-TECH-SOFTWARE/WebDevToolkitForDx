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
const FormData = require('form-data');
const tmp = require('tmp');
const yazl = require('yazl');
const yauzl = require('yauzl');
const got = require('got');

const GenericCommand = require('./generic');

const { config, ConfigKeys } = require('../config');
const { message, errorMessage, equalsIgnoreCase } = require('../utils');
const { SLASH, DEFAULT_PUSH_URI_PATH } = require('../constants');

const INDEX_HTM = 'index.htm';
const INDEX_HTML = 'index.html';

/**
 * Push command.
 */
class PushCommand extends GenericCommand {

    /**
     * Load prebuilt zip.
     * @private
     */
    async _loadPrebuiltZip() {
        const zipFiles = this.zipFiles = [];

        this.prebuiltZip = config.getString(ConfigKeys.PREBUILT_ZIP);
        if (!this.prebuiltZip) {
            return;
        }

        const zipFilePath = this.prebuiltZip = path.resolve(this.prebuiltZip);

        await new Promise((resolve, reject) => {
            yauzl.open(zipFilePath, { lazyEntries: true }, (err, zipfile) => {
                if (err) return reject(err);

                zipfile.readEntry();
                zipfile.on('error', (err) => reject(err));

                zipfile.on('entry', function (entry) {
                    if (/\/$/.test(entry.fileName)) {
                        // Directory file names end with '/'
                        zipfile.readEntry();
                    } else {
                        zipFiles.push(entry.fileName);
                        zipfile.readEntry();
                    }
                });

                zipfile.on('end', function () {
                    zipfile.close();
                    resolve();
                });
            });
        });
    }

    /**
     * Load main html file.
     * @private
     */
    async _loadMainHtmlFile() {

        this.mainHtmlFile = config.getString(ConfigKeys.MAIN_HTML_FILE);

        if (!this.mainHtmlFile) {
            if (this.prebuiltZip) {
                if (this.zipFiles.indexOf(INDEX_HTM) > -1) {
                    this.mainHtmlFile = INDEX_HTM;
                } else if (this.zipFiles.indexOf(INDEX_HTML) > -1) {
                    this.mainHtmlFile = INDEX_HTML;
                }
            } else {
                if (fs.existsSync(path.resolve(this.contentRoot, INDEX_HTM))) {
                    this.mainHtmlFile = INDEX_HTM;
                } else if (fs.existsSync(path.resolve(this.contentRoot, INDEX_HTML))) {
                    this.mainHtmlFile = INDEX_HTML;
                }
            }

            if (!this.mainHtmlFile) {
                this.mainHtmlFile = await config.getStringOrPrompt(ConfigKeys.MAIN_HTML_FILE, message('PushCommand.3'));
            }
        }
    }

    /**
     * Load config.
     */
    async loadConfig() {
        await super.loadConfig();

        this.excludes = config.getArrayOfStrings(ConfigKeys.EXCLUDES, []);
        this.pushUriPath = config.getString(ConfigKeys.PUSH_URI_PATH, DEFAULT_PUSH_URI_PATH);
        this.pushPostParameters = config.getObject(ConfigKeys.PUSH_POST_PARAMETERS);

        this.wcmContentId = config.getString(ConfigKeys.WCM_CONTENT_ID);
        this.wcmContentName = config.getString(ConfigKeys.WCM_CONTENT_NAME);
        this.wcmContentPath = config.getString(ConfigKeys.WCM_CONTENT_PATH);
        this.wcmContentTitle = config.getString(ConfigKeys.WCM_CONTENT_TITLE);
        this.wcmSiteArea = config.getString(ConfigKeys.WCM_SITE_AREA);

        await this._loadPrebuiltZip();
        await this._loadMainHtmlFile();
    }

    /**
     * Validate config.
     * @returns {boolean} true if config is valid; false otherwise
     */
    validateConfig() {
        if (!this.prebuiltZip) {
            if (!fs.existsSync(this.contentRoot)) {
                this.logger.log(errorMessage('ERROR_CMDLN_PUSH_REQUIRES_APP_0'));
                return false;
            }
            if (!fs.existsSync(path.resolve(this.contentRoot, this.mainHtmlFile))) {
                this.logger.log(errorMessage('ERROR_CMDLN_MISSING_HTML_1', this.mainHtmlFile));
                return false;
            }
        } else {
            if (!fs.existsSync(this.prebuiltZip)) {
                this.logger.log(errorMessage('ERROR_CMDLN_MISSING_ZIP_1', this.prebuiltZip));
                return false;
            }
            if (this.zipFiles.indexOf(this.mainHtmlFile) < 0) {
                this.logger.log(errorMessage('ERROR_CMDLN_NO_HTML_ZIP_1', this.mainHtmlFile));
                return false;
            }
        }

        let count = 0;
        count += this.wcmContentId ? 1 : 0;
        count += this.wcmContentName ? 1 : 0;
        count += this.wcmContentPath ? 1 : 0;

        if (count === 0) {
            this.logger.log(errorMessage('ERROR_CMDLN_MISSING_ARG_3', ConfigKeys.WCM_CONTENT_ID, ConfigKeys.WCM_CONTENT_NAME, ConfigKeys.WCM_CONTENT_PATH));
            return false;
        }
        if (count > 1) {
            this.logger.log(errorMessage('ERROR_CMDLN_CONFLICTING_ARGS_3', ConfigKeys.WCM_CONTENT_ID, ConfigKeys.WCM_CONTENT_NAME, ConfigKeys.WCM_CONTENT_PATH));
            return false;
        }

        if (this.wcmContentName) {
            if (!this.wcmSiteArea) {
                this.logger.log(errorMessage('ERROR_CMDLN_MISSING_ARG_2', ConfigKeys.WCM_CONTENT_NAME, ConfigKeys.WCM_SITE_AREA));
                return false;
            }
            const separator = this.wcmSiteArea.endsWith(SLASH) || this.wcmContentName.startsWith(SLASH) ? '' : SLASH;
            this.wcmContentPath = this.wcmSiteArea + separator + this.wcmContentName;
        }

        return true;
    }

    /**
     * Create zip file.
     * @param {string} folder The folder to add to zip
     * @param {string} rootPath The root folder path
     * @param {yazl.ZipFile} zipFile The zip file
     * @private
     */
    async _createZip() {
        const zipFile = new yazl.ZipFile();
        const tmpZip = tmp.fileSync({ prefix: 'sp-content-', postfix: '.zip', discardDescriptor: true });

        const addFiles = (folder, rootPath) => {

            const zipEntryName = folder.substring(rootPath.length + 1).replace(/\\/g, '/');

            if (GenericCommand.isExcluded(zipEntryName, this.excludes)) {
                return;
            }

            const stat = fs.statSync(folder);
            if (stat.isFile()) {
                this.zipFiles.push(zipEntryName);
                zipFile.addFile(folder, zipEntryName, { mtime: stat.mtime });
            } else if (stat.isDirectory()) {
                const files = fs.readdirSync(folder);
                for (const f of files) {
                    addFiles(path.resolve(folder, f), rootPath);
                }
            }
        }

        const writeStream = zipFile.outputStream.pipe(fs.createWriteStream(tmpZip.name));

        await new Promise((resolve, reject) => {

            writeStream.on('error', (err) => reject(err));
            writeStream.on('close', () => resolve());

            try {
                addFiles(this.contentRoot, this.contentRoot);
            } catch (err) {
                return reject(err);
            }

            zipFile.end();
        });

        return tmpZip.name;
    }

    /**
     * Invoke this command.
     * @returns {Promise<boolean>} true if command is successful; false otherwise
     */
    async invoke() {
        this.logger.log(message('PushCommand.4'));
        let zipFilePath;
        try {

            const options = await this.getOptions();
            const uri = this.getUri(`${this.pushUriPath}${this.wcmContentId ? this.wcmContentId : 'null'}`);

            await got(uri.origin, options);

            this.logger.log(message('PushCommand.5', 'POST ' + uri));
            this.logger.log(message('PushCommand.6', this.virtualPortalContext));
            this.logger.log(message('PushCommand.7', this.projectContext));
            this.logger.log(message('PushCommand.8', this.wcmContentId));
            this.logger.log(message('PushCommand.9', this.wcmContentPath));
            this.logger.log(message('PushCommand.10', this.wcmContentTitle));
            this.logger.log(message('PushCommand.11', this.mainHtmlFile));

            // Create zip file
            zipFilePath = this.prebuiltZip;
            if (!zipFilePath) {
                zipFilePath = await this._createZip();
            }
            this.logger.logZipInfo(zipFilePath, this.zipFiles);

            // Create form data
            const form = new FormData();
            const formOpts = { contentType: 'application/x-www-form-urlencoded' };
            if (this.wcmContentId) {
                form.append(ConfigKeys.WCM_CONTENT_ID, this.wcmContentId, formOpts);
            }
            if (this.wcmContentPath && this.wcmContentPath.length) {
                form.append(ConfigKeys.WCM_CONTENT_PATH, this.wcmContentPath, formOpts);
            }
            if (this.wcmContentTitle && this.wcmContentTitle.length) {
                form.append(ConfigKeys.WCM_CONTENT_TITLE, this.wcmContentTitle, formOpts);
            }
            form.append(ConfigKeys.MAIN_HTML_FILE, this.mainHtmlFile, formOpts);

            form.append('zippedContent', fs.createReadStream(zipFilePath), {
                filename: path.basename(zipFilePath),
                contentType: 'application/zip',
            });

            if (this.pushPostParameters) {
                for (const key of Object.keys(this.pushPostParameters)) {
                    if (this.pushPostParameters[key] != null) {
                        form.append(key, this.pushPostParameters[key] + '', formOpts);
                    }
                }
            }

            // Execute HTTP request
            options.body = form;
            options.method = 'POST';
            const resp = await GenericCommand.executeHTTP(uri, options);

            if (resp.error || resp.statusCode != 200) {
                this.logger.log(errorMessage('ERROR_CMDLN_LIST_FAILED_0'));
                return false;
            }

            let jsonBody;
            try {
                // Parse response body to JSON
                jsonBody = JSON.parse(resp.body);
            } catch (err) {
                this.logger.error(errorMessage('ERROR_CMDLN_BODY_INVALID_JSON_0'), err);
            }

            if (!jsonBody || !jsonBody.results || jsonBody.results.status == null) {
                this.logger.log(errorMessage('ERROR_CMDLN_PUSH_FAIL_RESPONSE_0'));
                return false;
            }

            if (!equalsIgnoreCase(jsonBody.results.status, 'success')) {
                this.logger.log(errorMessage('ERROR_CMDLN_PUSH_FAILED_0'));
                return false;
            }

            this.logger.log(message('PushCommand.31'));
            this.logger.log(message('PushCommand.32'));
        } catch (err) {
            this.logger.error(errorMessage('ERROR_CMDLN_PUSH_FAILED_0'), err);
            return false;
        } finally {
            // Do not delete ZIPs built outside of the tool.
            if (zipFilePath && !this.prebuiltZip) {
                fs.removeSync(zipFilePath);
            }
        }

        return true;
    }
}

module.exports = PushCommand;
