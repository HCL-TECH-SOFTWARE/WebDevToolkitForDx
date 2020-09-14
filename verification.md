[TOC]

## Prerequisities

- Docker (to run portal server locally)
- Node.js 12



## Run Websphere Portal

```bash
docker run -p 30015:30015 -p 30005:30005 ibmcom/websphere-portal:latest

# When you see log: "Server WebSphere_Portal open for e-business; process id is 118", the HCL portal server is started successfully
```

You can visit http://localhost:30015/wps/myportal/Home, login with `wpsadmin/wpsadmin` to see it's running.



## Build packages

In project root folder, run:

```bash
# Install dependencies
npm install

# Create release zip in `build` folder
npm run grunt build
```



## Install

In project root folder, run:

```bash
npm install -g
```

The install will take several minutes (mainly due to the install of nw.js), be patient.

To uninstall, run `npm uninstall -g`.



## Verify dxwcmdesigns CLI

### Run `dxwcmdesigns init` command

```bash
# Create an empty dir, let's call it "wcms"
mkdir wcms

# Init dxwcmdesigns
dxwcmdesigns init --dir wcms
# Then CLI will prompt several questions
```

Enter following answers for CLI prompt questions:

| Question                            | Answer                |
| ----------------------------------- | --------------------- |
| Hostname                            | localhost             |
| Username                            | wpsadmin              |
| Password                            | wpsadmin              |
| Path to the content handler servlet | /wps/mycontenthandler |
| Secure Connection (https)?          | false                 |
| Port                                | 30015                 |

Then CLI connects to WPS Portal server and get wcm libraries list, like following:

```
loading ...
Available Libraries for localhost:
0: Blog Solo Template v70
1: Blog Template v70
2: Content Hub
3: Portal Site
4: Script Portlet Library
5: Site Builder Template Library
6: Social Lists 1.0
7: Template Page Content 3.0
8: Web Content
9: Web Content Templates 3.0
10: Web Resources v70
11: Wiki Template v70
Choose a number between 0 and 11 (inclusive)   
```

Enter number `2` to select `Content Hub` library, then the CLI will create a folder `Content Hub` and download the library files.

### Run `dxwcmdesigns pull` command

```bash
dxwcmdesigns pull --dir 'wcms/Content Hub'
```

The CLI will pull the files:

```
Pulling from library Content Hub in progress ...
pulling type: LibraryHTMLComponent
pulled: /Users/mac/Desktop/wcms/Content Hub/Components/Attributes/Get Media Type.html
pulled: /Users/mac/Desktop/wcms/Content Hub/Components/Attributes/FileName.html
pulled: /Users/mac/Desktop/wcms/Content Hub/Components/Attributes/GetDescription.html
pulled: /Users/mac/Desktop/wcms/Content Hub/Components/Attributes/Description.html
pulled: /Users/mac/Desktop/wcms/Content Hub/Components/Attributes/Path.html
pulled: /Users/mac/Desktop/wcms/Content Hub/Components/Attributes/mediaType.html
pulled: /Users/mac/Desktop/wcms/Content Hub/Components/JS/ContentHubIntegration.html
pulled: /Users/mac/Desktop/wcms/Content Hub/Components/JS/ErrorMarkup.html
pulled: /Users/mac/Desktop/wcms/Content Hub/Components/Source/Video.html
pulled: /Users/mac/Desktop/wcms/Content Hub/Components/Source/File.html
pulled: /Users/mac/Desktop/wcms/Content Hub/Components/Source/Image.html
pulled: /Users/mac/Desktop/wcms/Content Hub/Components/Design/No asset selected.html
pulled: /Users/mac/Desktop/wcms/Content Hub/Components/Design/Image.html
pulled: /Users/mac/Desktop/wcms/Content Hub/Components/Design/File.html
pulled: /Users/mac/Desktop/wcms/Content Hub/Components/Design/Video.html
pulling type: PresentationTemplate
pulled: /Users/mac/Desktop/wcms/Content Hub/Presentation Templates/Content Hub Pres Template.html
pulling type: LibraryStyleSheetComponent
pulling type: LibraryImageComponent
pulled: /Users/mac/Desktop/wcms/Content Hub/Components/Images/error.png.png
pulled: /Users/mac/Desktop/wcms/Content Hub/Components/Images/close.png.png
pulling type: LibraryTextComponent
pulling type: LibraryFileComponent
pulled: /Users/mac/Desktop/wcms/Content Hub/Components/Images/Content hub Toolbar icon.zip
pulling type: ContentTemplate
pulled: /Users/mac/Desktop/wcms/Content Hub/Authoring Templates/Content Hub Auth Template.ct
pulling type: LibraryReferenceComponent
pulling type: LibraryJSPComponent
pulling type: LibraryDateComponent
pulling type: LibraryNumericComponent
pulling type: LibraryLinkComponent
pulling type: CustomWorkflowAction
pulling type: WorkflowStage
pulling type: LibraryRichTextComponent
 Pulled 20 item(s) from library Content Hub
```

### Run `dxwcmdesigns push` command

```bash
# Edit some file, like "Content Hub/Authoring Templates/Content Hub Auth Template-elements/asset_text.txt", then run:
dxwcmdesigns push --dir 'wcms/Content Hub'
```

The CLI will push the edited file to server:

```
Pushing to library Content Hub in progress ...
pushed: /Users/mac/Desktop/wcms/Content Hub/Authoring Templates/Content Hub Auth Template-elements/asset_text.txt
 Pushed 1 item(s) to library Content Hub
```

You can also push all files:

```bash
# Push all files:
dxwcmdesigns push --dir 'wcms/Content Hub' --all
```

```
Pushing to library Content Hub in progress ...
pushed: /Users/mac/Desktop/wcms/Content Hub/Authoring Templates/Content Hub Auth Template-elements.json
pushed: /Users/mac/Desktop/wcms/Content Hub/Presentation Templates/Content Hub Pres Template.html
pushed: /Users/mac/Desktop/wcms/Content Hub/Authoring Templates/Content Hub Auth Template-elements/Design_reference.txt
pushed: /Users/mac/Desktop/wcms/Content Hub/Authoring Templates/Content Hub Auth Template-elements/Type_short.txt
pushed: /Users/mac/Desktop/wcms/Content Hub/Authoring Templates/Content Hub Auth Template-elements/asset_text.txt
pushed: /Users/mac/Desktop/wcms/Content Hub/Authoring Templates/Content Hub Auth Template-elements/icon_file.txt
pushed: /Users/mac/Desktop/wcms/Content Hub/Components/Attributes/FileName.html
pushed: /Users/mac/Desktop/wcms/Content Hub/Components/Attributes/Get Media Type.html
pushed: /Users/mac/Desktop/wcms/Content Hub/Components/Attributes/Description.html
pushed: /Users/mac/Desktop/wcms/Content Hub/Components/Attributes/Path.html
pushed: /Users/mac/Desktop/wcms/Content Hub/Components/Attributes/mediaType.html
pushed: /Users/mac/Desktop/wcms/Content Hub/Components/Attributes/GetDescription.html
pushed: /Users/mac/Desktop/wcms/Content Hub/Components/Source/File.html
pushed: /Users/mac/Desktop/wcms/Content Hub/Components/Source/Video.html
pushed: /Users/mac/Desktop/wcms/Content Hub/Components/Source/Image.html
pushed: /Users/mac/Desktop/wcms/Content Hub/Components/JS/ContentHubIntegration.html
pushed: /Users/mac/Desktop/wcms/Content Hub/Components/JS/ErrorMarkup.html
pushed: /Users/mac/Desktop/wcms/Content Hub/Components/Images/Content hub Toolbar icon.zip
pushed: /Users/mac/Desktop/wcms/Content Hub/Components/Images/close.png.png
pushed: /Users/mac/Desktop/wcms/Content Hub/Components/Images/error.png.png
pushed: /Users/mac/Desktop/wcms/Content Hub/Components/Design/File.html
pushed: /Users/mac/Desktop/wcms/Content Hub/Components/Design/No asset selected.html
pushed: /Users/mac/Desktop/wcms/Content Hub/Components/Design/Image.html
pushed: /Users/mac/Desktop/wcms/Content Hub/Components/Design/Video.html
 Pushed 24 item(s) to library Content Hub
```



## Verify dxdashboard GUI

Simply run `dxdashboard` will lauch the GUI desktop app.

### Settings tab

First you will need config the settings.

See video: https://youtu.be/M1V4o40gJ94

### WCM Design Libraries tab

You can pull/push/watch wcm library:

See video: https://youtu.be/bSDut4b9wNo

### Themes tab

You can pull/push/watch theme, and create/edit module/profile:

See video: https://youtu.be/8KaI7b4hdUk