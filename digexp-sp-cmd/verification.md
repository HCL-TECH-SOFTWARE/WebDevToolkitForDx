## Prerequisites

- Node.js 12
- Docker (for local verification)


## Verification

### Run Websphere Portal

Simply run:

```bash
docker run -p 30015:30015 -p 30005:30005 ibmcom/websphere-portal:latest
# Wait 1~2 minutes, when the log shows something like: 'Server WebSphere_Portal open for e-business; process id is 118', the portal server is started
```

Note here the port **30015** is the HTTP port, **30005** is the HTTPS port. Username and password are both **wpsadmin**.

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

### Push command:

```bash
sp push -contentRoot ./examples/test -wcmContentName TestName
sp push -prebuiltZip ./examples/prebuilt.zip -wcmContentName TestName
# The files within 'examples/test' folder and 'examples/prebuilt.zip' are mostly same, except 'hello_world.js'
# Since 'prebuilt.zip' is pushed after 'test' folder, the 'hello_world.js' within 'prebuilt.zip' will be stored in portal server
# You can also follow the screencast to verify script application pushed successfully: https://take.ms/3uHbK
```

The log file **sp-cmdln.log** is created under current directory when `-contentRoot` option isn't present. When  `-contentRoot` option is given, the **sp-cmdln.log** is created under that content root folder.

After push, check the **sp-cmdln.log**, near the end of that log file you can find the content id, like following:

```verilog
2020-07-09 02:33:12 -- Body content: 
 {
   "results" : {
      "status" : "success",
      "importedFiles" : {
         "file" : [
            {
               "filename" : "HTML\/index.html"
            }
            ,
            {
               "filename" : "JavaScript\/hello_world.js"
            }
            ,
            {
               "filename" : "Images\/preview-image.png"
            }
         ]
      },
      "skippedFiles" : "",
      "message" : "The file that you selected was imported successfully.",
      "contentId" : "dcea4e05-229b-4f3e-9868-403a2b19203a"
   }
}
```

Record the `contentId` (here it's `dcea4e05-229b-4f3e-9868-403a2b19203a`). Then you can use the content id to pull.

### Pull command:

```bash
sp pull -contentRoot ./examples/test2
# Will prompt user to enter the Content ID 
```

### Verify HTTPS:

```bash
sp list vportals -scriptPortletServer https://127.0.0.1:30005 -laxSSL false
# Should fail since portal server uses an expired certificate. Detailed error log is in 'sp-cmdln.log'
```

```bash
sp list vportals -scriptPortletServer https://127.0.0.1:30005 -laxSSL true
# Should success since 'laxSSL' option is set to true
```

