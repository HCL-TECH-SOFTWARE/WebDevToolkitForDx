/*
 * Copyright HCL Technologies Ltd. 2001, 2020
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 */

var gulp = require("gulp");
var map = require("map-stream");

var tar = require("gulp-tar");
var gzip = require("gulp-gzip");

const WCM_DESIGNS = "./digexp-wcm-design";
const DASHBOARD = "./digexp-dashboard";
const SP_SERVER = "./digexp-sp-server";

var getFileList = function(folder) {
  // todo read gitignore, npmignore
  return [folder + "/**", "!" + folder + "/.git/**", "!" + folder + "/node_modules/**",
          "!" + folder + "/node_modules/", "!" + folder + "/.idea/**", "!" + folder + "/user-settings.json", + "!" + folder + "/**.*~"];
};

var npm_pack = function(folder, dest) {
  return gulp.src(getFileList(folder), { base: folder })
    .pipe(map(function(file, cb) {
	// this makes sure the root folders are not included in the tar
	if(file.stat.isDirectory())
		file.path = "package/";
	else
      file.path = file.path.replace(file.relative, "package/" + file.relative);
      //console.log(file.path);
	      cb(null, file);
    }))
    .pipe(tar(dest + ".tar"))
    .pipe(gzip())
    .pipe(gulp.dest("./packs"));
};


function pack_dashboard() {
  return npm_pack(DASHBOARD, "dashboard");
}
function pack_wcm() {
  return npm_pack(WCM_DESIGNS, "wcm-design");
}
function pack_sp_server() {
  return npm_pack(SP_SERVER, "sp-server");
}
var pack = gulp.parallel(pack_dashboard, pack_wcm, pack_sp_server)

exports.pack_dashboard = pack_dashboard;
exports.pack_wcm = pack_wcm;
exports.pack_sp_server = pack_sp_server;
exports.pack = pack;

function watch_wcm() {
  gulp.watch(getFileList(WCM_DESIGNS), pack_wcm);
}
function watch_dashboard() {
  gulp.watch(getFileList(DASHBOARD), pack_dashboard);
}
function watch_sp_server() {
  gulp.watch(getFileList(SP_SERVER), pack_sp_server);
};

var watch = gulp.parallel(watch_wcm, watch_dashboard, watch_sp_server)

exports.watch_wcm = watch_wcm;
exports.watch_dashboard = watch_dashboard;
exports.watch_sp_server = watch_sp_server;
exports.watch = watch;

exports.default = gulp.series(pack, watch);
