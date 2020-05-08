module.exports = function(grunt) {
    "use strict";
    var exec = require("child_process").exec, fs = require("fs");
    grunt.initConfig({
        compress : {
            main : {
                options : {
                    archive : "./build/digexp-toolkit.zip"
                },
                files : [{
                    expand : true,
                    cwd : ".",
                    src : ["install.cmd", "install.sh", "uninstall.cmd", "uninstall.sh", "readme.md", "packs/wcm-design.tar.gz", "packs/dashboard.tar.gz", "packs/sp-server.tar.gz", "packs/splint.tgz", "packs/dxsync-1.0.3.tgz", "packs/pathwatcher-8.1.0.tgz", "LICENSE", "NOTICE"],
                    dest : "/",
                    filter : "isFile"
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