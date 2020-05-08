/*
 * Copyright HCL Technologies Ltd. 2001, 2020
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 */

/**
 * Config for unit tests.
 */
module.exports = {
    TEST_USERNAME: "wpsadmin",
    TEST_PASSWORD: "wpsadmin",
    TEST_HOST: "localhost", // gsager80.rtp.raleigh.hcl.com
    TEST_PORT: 30015, // 10039
    TEST_SECURE_PORT: 30016, // 10042
    TEST_CONTENT_HANDLER: "/wps/mycontenthandler",
    LONG_TIMEOUT: 300000
};