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
const os = require('os');
const execa = require('execa');
const osLocale = require('os-locale');

// Determine system locale
let locale;
if (process.platform === 'darwin') {
    locale = execa.sync('defaults', ['read', '-globalDomain', 'AppleLocale']).stdout.replace(/_/g, '-');
} else {
    locale = osLocale.sync();
}

exports.LOCALE = locale;

exports.EOL = os.EOL;

exports.SLASH = '/';

exports.SERVER_VERSION = '8.5';
exports.BUILD_NUMBER = '20200708-1300';

exports.SP_CMD_LINE_URL = 'https://help.hcltechsw.com/digital-experience/8.5/script-portlet/cmd_line_push_cmd.html';

exports.DEFAULT_CONTENTHANDLER_PATH = '/wps/mycontenthandler';
exports.DEFAULT_AUTO_LOGIN_PATH = '/wps/portal/cxml/04_SD9ePMtCP1I800I_KydQvyHFUBADPmuQy';
exports.DEFAULT_LIST_URI_PATH = 'scriptportletutil:';
exports.DEFAULT_PULL_URI_PATH = exports.DEFAULT_PUSH_URI_PATH = 'scriptportlet:';

exports.PROJECTS_OBJTYPE = 'projects';
exports.VPORTALS_OBJTYPE = 'vportals';
exports.SITEAREAS_OBJTYPE = 'siteareas';

exports.APIObjectTypes = {
    [exports.PROJECTS_OBJTYPE]: 'project',
    [exports.VPORTALS_OBJTYPE]: 'vp',
    [exports.SITEAREAS_OBJTYPE]: 'sitearea',
}
