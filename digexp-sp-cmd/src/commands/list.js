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
const GenericCommand = require('./generic');

const { message, errorMessage, equalsIgnoreCase } = require('../utils');
const { DEFAULT_LIST_URI_PATH, PROJECTS_OBJTYPE, VPORTALS_OBJTYPE, SITEAREAS_OBJTYPE, APIObjectTypes } = require('../constants');

const LabelTitles = {
    [PROJECTS_OBJTYPE]: message('ListCommand.24'),
    [VPORTALS_OBJTYPE]: message('ListCommand.23'),
    [SITEAREAS_OBJTYPE]: message('ListCommand.27'),
}

const ValueTitles = {
    [PROJECTS_OBJTYPE]: message('ListCommand.26'),
    [VPORTALS_OBJTYPE]: message('ListCommand.25'),
    [SITEAREAS_OBJTYPE]: message('ListCommand.28'),
}

/**
 * List command.
 */
class ListCommand extends GenericCommand {

    /**
     * Constructor.
     * @param {string} objectType Object type to list
     */
    constructor(objectType) {
        super();
        this.objectType = objectType;
    }

    /**
     * Validate config.
     * @returns {boolean} true if config is valid; false otherwise
     */
    validateConfig() {
        if (!APIObjectTypes[this.objectType]) {
            this.logger.log(errorMessage('ERROR_CMDLN_LIST_TYPE_2', VPORTALS_OBJTYPE, PROJECTS_OBJTYPE));
            return false;
        }
        return true;
    }

    /**
     * Invoke this command.
     * @returns {Promise<boolean>} true if command is successful; false otherwise
     */
    async invoke() {
        this.logger.log(message('ListCommand.6'));

        try {
            const options = await this.getOptions();

            const uri = this.getUri(`${DEFAULT_LIST_URI_PATH}${APIObjectTypes[this.objectType]}`);

            this.logger.log(message('ListCommand.7', 'GET ' + uri));

            // Execute HTTP request
            const resp = await GenericCommand.executeHTTP(uri, options);

            if (resp.error || resp.statusCode != 200) {
                this.logger.log(errorMessage('ERROR_CMDLN_LIST_FAILED_0'));
                return false;
            }

            // Parse response body to JSON
            const jsonBody = JSON.parse(resp.body);

            if (!jsonBody || !jsonBody.response || jsonBody.response.status == null) {
                this.logger.log(errorMessage('ERROR_CMDLN_LIST_FAILED_BODY_0'));
                return false;
            }

            if (!equalsIgnoreCase(jsonBody.response.status, 'success')) {
                this.logger.log(errorMessage('ERROR_CMDLN_LIST_FAILED_0'));
                return false;
            }

            // Empty list returned
            if (jsonBody.response.list === '') {
                console.log();
                if (this.objectType === VPORTALS_OBJTYPE) {
                    console.log(errorMessage('ERROR_CMDLN_NO_VPS_0'));
                } else {
                    console.log(errorMessage('ERROR_CMDLN_NO_WCM_PROJECTS_0'));
                }
                return true;
            }

            let entries = jsonBody.response.list.entry;

            // Single object returned
            if (!Array.isArray(entries) && typeof entries === 'object') {
                entries = [entries];
            }

            if (!Array.isArray(entries)) {
                this.logger.log(errorMessage('ERROR_CMDLN_LIST_FAILED_BODY_0'));
                return false;
            }

            // Output to console
            const labelTitle = LabelTitles[this.objectType];
            const valueTitle = ValueTitles[this.objectType];

            let maxLabelSize = labelTitle.length;
            for (const entry of entries) {
                maxLabelSize = Math.max(maxLabelSize, entry.label.length);
            }

            console.log();
            console.log(`${labelTitle.padEnd(maxLabelSize)} : ${valueTitle}`);

            for (const entry of entries) {
                console.log(`${entry.label.padEnd(maxLabelSize)} : ${entry.value}`);
            }

            this.logger.log(message('ListCommand.37'));
            this.logger.log(message('ListCommand.38'));
        } catch (err) {
            this.logger.error(errorMessage('ERROR_CMDLN_LIST_FAILED_0'), err);
            return false;
        }

        return true;
    }
}

module.exports = ListCommand;
