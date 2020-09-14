
# HCL Digital Experience Script Portlets

# Using the digexp-sp-cmd command line utility
Note that all the functionality for push/pull of script portlets is available from the Dashboard user interface. For the command line support, use:
```
$ sp <command> [options]
```

## Configuration

The application uses the following sequence of preference when it processes these options:

### Show help info:

```bash
sp help
sp help_en
sp usage_en
```

### List command:

```bash
sp list projects
sp list vportals
sp list siteareas
```

### Pull command:

```bash
sp pull -contentRoot <src-dir>
```

When you pull you need to specify -wcmContentID argument

```bash
-wcmContentID <value>
    WCM content ID of the Script Application instance.
```

### Push command:

If you are running the sp push command from any other folder than the application folder, you must use the -contentRoot argument to specify your application folder.
If the source is a zip, you must use -prebuiltZip argument to specify your application folder.

```bash
sp push -contentRoot <src-dir> -wcmContentName <content-name> / -wcmContentPath <content-path>
sp push -prebuiltZip <src-zip> -wcmContentName <content-name> / -wcmContentPath <content-path>
```
This command creates the Web Content Manager content item for your application. It gives it the name that you specified by the -wcmContentName argument in the Web Content Manager site area that is identified by the wcmSiteArea setting in that file. We could provide -wcmContentName or -wcmContentPath .The default site area in the sp-config.json is Script Portlet Library/Script Portlet Applications. 

The log file **sp-cmdln.log** is created under current directory when `-contentRoot` option isn't present. When  `-contentRoot` option is given, the **sp-cmdln.log** is created under that content root folder.

## Support

The supported options are same as existing Java application. Refer to https://help.hcltechsw.com/digital-experience/8.5/script-portlet/cmd_line_push_cmd.html#cmd_line_push_cmd__table_gqy_kkr_2s for details.

In case of any more questions or issues please raise via Issues tab in this github repository. HCL Support will make every reasonable effort to assist in problem resolution of any issues found in this software.
