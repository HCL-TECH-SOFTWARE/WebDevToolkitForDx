/*
 * Copyright HCL Technologies Ltd. 2001, 2020
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0 
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an 
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the 
 * specific language governing permissions and limitations under the License.
 */
process.title = "digexp-dashboard watch";

var chokidar = require("chokidar");
var exec = require("child_process").exec;
var anymatch = require("anymatch");
var utils = require("../utils");

var directory = process.argv[2];
var buildCommand = process.argv[3] || "";
var server = JSON.parse(process.argv[4] || "{}");
var toIgnore = process.argv[5] || "";
toIgnore = toIgnore.split(";");

var length = toIgnore.length;
for (var i = 0; i < length; i++) {
  if (toIgnore[i].match(/^[\/\\\w]+$/)) {
    toIgnore = toIgnore.concat(toIgnore[i] + "/**");
  }
}
toIgnore = toIgnore.filter(t => t && t.trim().length);

console.log("args: " + process.argv);
console.log("server args:");
console.log(server);
console.log("ignoring:" + toIgnore);

var build = function(cb) {
  exec(buildCommand, { cwd: directory }, function(err, stdout, stderr) {
    if (err)    console.warn("watch build error: " + err);
    if (stdout) console.log("watch build stdout: " + stdout);
    if (stderr) console.warn("watch build stderr: " + stderr);

    cb && cb();
  });
};

var push = function() {
  var spCmd = require('digexp-sp-cmd/src/index');
  var args = ['push', '-contentRoot', directory, ...utils.makeServerArgs(server)];

  spCmd.run(args).then(function(result) {
    if (result.success) {
        console.log('sp_watch_push_successful');
    } else {
        console.warn('sp_watch_push_failed');
    }
  }).catch(function(err) {
    console.warn('sp_watch_push_failed');
    console.error('exec error: ' + err);
  })
};

var run = function(path) {
  if (path.match(/node\-modules|sp-cmdln\.log|\.DS_Store/)
      || (toIgnore && toIgnore.length && anymatch(toIgnore, path))) {
    return;
  }
  console.log("push_starting, " + path + " modified");
  if (buildCommand) {
    build(push);
  } else {
    push();
  }
};

var watcher = chokidar.watch(directory, {
  persistent: true,
  ignoreInitial: true,
  cwd: directory
});
watcher.on("add", run);
watcher.on("change", run);
watcher.on("unlink", run);

process.on("SIGTERM", function() { watcher.close(); });
process.on("exit", function() { watcher.close(); });

