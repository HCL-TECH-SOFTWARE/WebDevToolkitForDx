# HCL Digital Experience WCM Designs

# Using the digexp-wcm-design command line utility
Note that all the functionality for push/pull of WCM design files is available from the Dashboard user interface. For the command line support, use:
```
$ dxwcmdesigns <command> [options]
```

The commands are described below.

## init
Usage:
```
$ dxwcmdesigns init [options]
```
Running this command will display a prompt to select a WCM library. A subdirectory
will be created (in the current working directory) and the selected library will be
downloaded in it.

The available options are:
- `-d`, `--dir`: The directory that will contain the WCM library. By default, it will be
  the current working directory.
- `-h`, `--help`: Displays the help for the init command.

## push
Usage:
```
$ cd <path to the wcm library>
$ dxwcmdesigns push [options]
```
Running this command will push the source files to WCM and update the library on the server.

The available options are:
- `-a`, `--all`: Pushes all files if specified. If it's not specified, then only
  the files that have been modified since the last push/pull will be pushed.
- `-d`, `--dir`: The local directory of the WCM library. By default, it will be
  the current working directory.
- `-v`, `--verbose`: To get verbose output.
- `-h`, `--help`: Displays the help for the push command.

## pull
Usage:
```
$ cd <path to the wcm library>
$ dxwcmdesigns pull [options]
```
This command will download any remote changes to the WCM library. First run `dxwcmdesigns init`
to initialize the WCM library before using `dxwcmdesigns pull`.

The available options are:
- `-d`, `--dir`: The local directory of the WCM library. By default, it will be
  the current working directory.
- `-v`, `--verbose`: To get verbose output.
- `-h`, `--help`: Displays the help for the pull command.

# Notes on WCM design library support
The supported WCM types are:
- HTML Component
- Image Component
- Style Sheet Component
- Text Component
- Rich Text Component
- Presentation Template
- File Component
- Content Template(Authoring Template)
- Date Component (with trial option enabled)
- Reference Component (with trial option enabled)
- Jsp Component (with trial option enabled)
- Link Component  (with trial option enabled)
- Numeric Component (with trial option enabled)
- Custom Workflow Action (with trial option enabled)
- Workflow Stage (with trial option enabled)

Other Component types and Content Items are not supported.

There are some options that can be set to control some of the behavior when downloading from WCM. To do this, open the ".settings" file in the folder for a library and add an "options" object. There are some options that you can set as shown here:
```
"options": {
    "includeMeta": false,
    "filterComponentId": true,
    "pullParallel": true,
    "trial":true,
    "include":[
       "PresentationTemplate",
       "LibraryStyleSheetComponent",
       "LibraryImageComponent"
   	]
},
```
- includeMeta: If set to true, each component will have a corresponding <name>-md.json file containing all the metadata from WCM.
- filterComponentId: If set to true, any Component tags in the downloaded data will include the ID of the referenced Component. By default these IDs are are removed, and the "name" attribute is used to identify the referenced Component.
- pullParallel: If set to true, requests to the server for components are done in parallel wich can speed up the download of large libraries. By default components are synced sequentially.
- trial: if set any new features that have been added but not fully testes are added
- include: This is an array of item types that allows you to limit the types of items that will be included in the pushed/pull actions for this library, this list will only support types that are handled by default. It allows you to limit the types to a subset of the supported types.  i.e. Some one that only works on icons could limit it to "LibraryImageComponent"

To turn on the trial features for all libraries you can set an environment variable DIGEXP_TRIAL=true.

Note that the tool cannot handle empty Content Templates (Authoring Templates) at this time.

## Support

In case of questions or issues please raise via Issues tab in this github repository. HCL Support will make every reasonable effort to assist in problem resolution of any issues found in this software.
