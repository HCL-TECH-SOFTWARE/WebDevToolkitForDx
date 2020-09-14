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

module.exports = function(grunt) {
    "use strict";
    const version = require("./package.json").version;
    grunt.initConfig({
        compress : {
            main : {
                options : {
                    archive : "./build/digexp-toolkit-" + version + ".zip"
                },
                files : [{
                    expand : true,
                    cwd : ".",
                    src : ["README.md", "LICENSE", "NOTICE", "*.json", "packs/splint.tgz", "pathwatcher/pathwatcher-8.1.0.tgz", "bin/**", "images/**"],
                    dest : "/"
                },
                {
                    expand: true,
                    cwd: "./digexp-dashboard",
                    src: ["README.md", "*.json", "dashboard_index.html", "css/**", "data/**", "js/**", "libs/**", "partials/**", "spconfig/**"],
                    dest: "/digexp-dashboard"
                },
                {
                    expand: true,
                    cwd: "./digexp-dxsync",
                    src: ["README.md", "*.json", "*.js", "lib/**"],
                    dest: "/digexp-dxsync"
                },
                {
                    expand: true,
                    cwd: "./digexp-sp-cmd",
                    src: ["README.md", "*.json", "*.js", "src/**"],
                    dest: "/digexp-sp-cmd"
                },
                {
                    expand: true,
                    cwd: "./digexp-sp-server",
                    src: ["README.md", "*.json", "*.js"],
                    dest: "/digexp-sp-server"
                },
                {
                    expand: true,
                    cwd: "./digexp-wcm-design",
                    src: ["README.md", "*.json", "*.js", "lib/**"],
                    dest: "/digexp-wcm-design"
                }]
            }
        }
    });
    grunt.loadNpmTasks("grunt-contrib-compress");
    grunt.registerTask("default", []);
    grunt.registerTask("build", ["compress:main", "_build"]);
    /**
     * Builds the app
     */
    grunt.registerTask("_build", function() {
    });
}; 