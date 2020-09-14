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
// Load i18n properties files
require('node-i18n-util');
const messages = require('./messages/messages.properties');
const errorMessages = require('./errors/CommandLineMessages.properties');

const { LOCALE, SLASH } = require('./constants');

/**
 * Get message string from i18n resources.
 * @param {Object} msgs Messages object.
 * @param {string} key Message key.
 * @param {string[]} vars Array of vars to substitute. Optional.
 * @returns {string} message
 */
const getStringMessage = (msgs, key, vars) => vars ? msgs.get(key, vars.map((v) => v == null ? 'null' : v), LOCALE) : msgs.get(key, LOCALE);

/**
 * Get message from i18n resources.
 * @param {string} key Message key.
 * @param {string[]} vars Array of vars to substitute. Optional.
 * @returns {string} message
 */
exports.message = (key, ...vars) => getStringMessage(messages, key, vars);

/**
 * Get error message from i18n resources.
 * @param {string} key Message key.
 * @param {string[]} vars Array of vars to substitute. Optional.
 * @returns {string} message
 */
exports.errorMessage = (key, ...vars) => getStringMessage(errorMessages, key, vars);

/**
 * Compare two strings with case insensitive.
 * @param {string} str1 One string
 * @param {string} str2 Another string
 */
exports.equalsIgnoreCase = (str1, str2) => str1 && str2 && str2.toLowerCase() === str1.toLowerCase();

/**
 * Normalize Uri path by adding lead slash and removing tail slash.
 * @param {string} uriPath Uri path to normalize
 * @returns {string} normalized Uri path
 */
exports.normalizeSlash = (uriPath) => {
    if (!uriPath.startsWith(SLASH)) {
        uriPath = SLASH + uriPath;
    }
    if (uriPath.endsWith(SLASH)) {
        uriPath = uriPath.substr(0, uriPath.length - 1);
    }
    return uriPath;
}
