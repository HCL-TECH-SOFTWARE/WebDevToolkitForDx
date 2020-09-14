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
// This script is used to customize "npm install" to load our pre-compiled binary
// It will be packed into tarball (pathwatcher-${version}.tgz)

var path = require("path"),
	fs = require("fs");

var npmArgv = JSON.parse(process.env.npm_config_argv).cooked

if (npmArgv.indexOf("--from-source") > -1) {
	console.log("Will build pathwatcher from source")
	process.exit(1); // exit, this will trigger build from source
}

var BINARY_LOC = path.resolve("./build/Release/pathwatcher.node");
var PRE_COMPILED = path.resolve(__dirname, "binary/" + process.platform + "/" + process.arch + "/pathwatcher.node");

function warn() {
	console.warn("Unable to watch files due to missing pathwatcher module. Install the module from source with the --from-source flag: npm install -g --from-source");
	console.info("Please provide feedback to the author of this module about the missing pre-compiled dependencies.");
	console.info("Your system information: %s (Platform) / %s (Architecture)\n", process.platform, process.arch);
}

function mkdir(dir) {
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir);
	}
}

if (!fs.existsSync(PRE_COMPILED)) {
	warn();
	return;
}

// Copy pre-compiled native binary
mkdir(path.dirname(path.dirname(BINARY_LOC)))
mkdir(path.dirname(BINARY_LOC))
fs.copyFileSync(PRE_COMPILED, BINARY_LOC);

try {
	var moduleName = "pathwatcher";
	require(moduleName);
} catch (err) {
	console.error(err);
	warn();
	return;
}

console.info("Pre-compiled pathwatcher module installed");
