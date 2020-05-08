# Building the packages
This information is only needed if you are updating source for this toolkit.

There is a gulp script to automatically package the modules that go into this toolkit. To run the script,
first install dependencies:

```
$ npm install 
```
Then run
```
$ npm run gulp
```
from the root directory of the repo to pack the modules and watch the files for changes.
There are many files to watch so it may take about a minute for gulp to
start watching.

You can use
```
$ npm run gulp pack
```
to just pack the files and
```
$ npm run gulp watch
```
to just watch the files. Running `npm run gulp watch` takes at least a minute to start.
To build individual tarballs, you can use:

```
$ npm run gulp pack_dashboard
$ npm run gulp pack_wcm
$ npm run gulp pack_sp_server
```

The tarballs should be repackaged before running `git commit`
in order to update them. You can run `npm run gulp pack` before pushing or have the gulp
script run in the background.

Also make sure that the gulp repackages the tarballs after
pulling any changes from the git repo. The tarball's will not be committed
after running `$ git pull` but the updated tarballs will be included in the next commit.

To create the release zip in the `build` directory:

```
$ npm run grunt build
```

When you are releasing copy the zip to the release directory


## Note regarding dxsync
The new version of dxsync is included at `packs/dxsync-1.0.3.tgz`. This version of dxsync uses pre-compiled `packs/pathwatcher-8.1.0.tgz` for Node.js 12.

## File Watching
In the dashboard, separate processes are spawned for watching files (to avoid
using the same processes as the UI of the dashboard). The code for those processes
can be found under `digexp-dashboard/js/ch_processes/`. STDIN and STDOUT are
used for IPC due to issues with node-channels on windows. However, in retrospect,
there are more robust options (such as TCP sockets).


