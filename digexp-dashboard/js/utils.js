/*
 * Copyright HCL Technologies Ltd. 2001, 2020
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0 
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an 
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the 
 * specific language governing permissions and limitations under the License.
 */
var tracer = require("tracer"),
    algorithm = "aes-256-ctr",
    password = "U6Jv]H[tf;mxE}6t*PQz?j474A7T@Vx%gcVJA#2cr2GNh96ve+",
    debugEnvironmentVar = process.env.DIGEXP_DEBUG || '',
    debugNames = debugEnvironmentVar.toUpperCase().split(','),
    debugFunctions = {};
    try {
        if(debugEnvironmentVar.length != 0)
            require('nw.gui').Window.get().showDevTools();
    } catch(e) {}

function debugLogger(moduleName) {
    moduleName = moduleName.toUpperCase();
    if (!debugFunctions[moduleName]) {
        var logLevel = 'error';
        if (debugNames.indexOf(moduleName) > -1 || debugNames.indexOf('*') > -1) {
            logLevel = 'log';
        }
        else
            if(debugEnvironmentVar.length != 0)
                logLevel = debugEnvironmentVar;
        debugFunctions[moduleName] = tracer.console({
            level: logLevel,
            // for details on format, see: https://www.npmjs.com/package/tracer
            format: moduleName + ' ' + '{{timestamp}} {{file}}:{{line}} {{message}}',
        });
    }
    return debugFunctions[moduleName];
};

function encrypt( text ) {
	return ":::" + aes256.encrypt(password, text);
}

function decrypt( text ) {
	if ( text.startsWith(":::") ) {
		return aes256.decrypt(password, text.substring(3));
	}
	// Backward compatiblity
    var crypto =  require('crypto');
    var decipher = crypto.createDecipher( algorithm, password );
    var dec = decipher.update( text, "hex", "utf8" );
    dec += decipher.final( "utf8" );
    return dec;
}

var utils = utils || {};

utils.getModified = function(dirName, date, ignore, callback){
    // takes the name of the directory you want to find the modified and a string for a date that is the toLocaleString of a date object
    // 
    var dirs = [];
    var Path = require('path');
    var cDate = date;
    var re = new RegExp('/', 'g');
    ignore = ignore.replace(re, Path.sep);

    var ignores = ignore.split(';');
    var finder = require('findit')(dirName);
    
    finder.on('directory', function (dir, stat, stop) {
        // stop as soon as we find one difference
        if(dirs.length != 0)
            return stop();
        var dirname = Path.dirname(dir);
        // ignore the folders ToDo  done this a better way
        ignores.forEach(function(ignore){
        if(ignore.indexOf('/') > -1 && dirname.indexOf(ignore) > -1) 
               return stop();
        });
   });


    finder.on('file', function (file, stat) {
        // stop as soon as we find one difference
        var ignored = false;
        var base = Path.basename(file);
        // ignore the folders ToDo  done this a better way
        ignores.forEach(function(ignore){
        if (ignore.indexOf('/') == -1 && base.indexOf(ignore) > -1) 
              ignored = true;
        });
        // no date so go back to the start
        if(!cDate)
            cDate = new Date('01/01/1970');
        if(!ignored && (stat.mtime > cDate  || stat.birthtime > cDate)){
            dirs.push(dirName);
           stop();
        };
     });
    
    finder.on('end',function (){
        callback(dirs);
    });
};

var userHome = getUserHome();
var settingsFileName;
// Copy the properties of a onto b
utils.copyProperties = function(a, b) {
  for (var key in a) {
    if (typeof a[key] == "object" && a[key].constructor !== Array) {
      b[key] = b[key] || {};
      utils.copyProperties(a[key], b[key]);
    } else {
      b[key] = a[key];
    }
  }
};

// get the user settings file name
utils.getUserSettingsName = function(){
    if(settingsFileName)
        return settingsFileName;
    if(!userHome.length){
        userHome = '.';
    }
    settingsFileName = path.resolve(userHome, 'user-settings.json');
    return settingsFileName;
};

function getUserHome() {
  return require("os").homedir();
}

utils.parseDate = function(dateStr) {
    if (!dateStr) {
        return null;
    }
    var result = new Date(dateStr);
    return result.getTime() ? result : null;
};

utils.notify = function( notification ) {
	notification.appID = "Digital Experience Dashboard";

	if (process.platform === "win32") {
		notification.wait = true;
	}

	notifier.notify( notification, function( err, response ) {
		// response is response from notification
	} );
}

utils.debugLogger = debugLogger;
utils.encrypt = encrypt;
utils.decrypt = decrypt;

utils.makeServerArgs = function(server) {
    var args = [];
    if (server.host || server.port) {
      args.push("-scriptPortletServer");
      args.push(`${server.secure ? 'https':'http'}://${server.host}:${server.port}`);
    }
    if (server.userName && server.password) {
      args.push("-portalUser");
      args.push(server.userName);
      args.push("-portalPassword");
      args.push(server.password);
    }
    var cPath = server.contenthandlerPath.split('/');
    if (cPath.length > 3){
       args.push("-virtualPortalID");
       args.push(cPath[3]);
    };

    return args;
};

if (typeof module !== 'undefined') {
    module.exports = utils;
}
