# Node.js tools for working with WCM design elements

See readme.md for the Web Developer Toolkit for information on using these tools.



## Test Prerequisities

- Docker (to run portal server locally)
- Node.js 12



## Setup Test Portal Server

This step describes how to setup a local portal server used for unit tests. If you already have a portal server suitable for test, you can skip this step.

Start portal server locally at port 30015:

```
$ docker run -p 30015:30015 ibmcom/websphere-portal:latest
```

Then start https proxy at port 30016:

```
$ npm install -g simple-https-proxy
$ simple-https-proxy --target=http://localhost:30015 --host=localhost --port=30016 --rewriteBodyUrls=true
```



## Testing

At first config the test portal server in `digexp-wcm-design/test/config.js`:

| Property             | Description                                  | Example               |
| -------------------- | -------------------------------------------- | --------------------- |
| TEST_USERNAME        | Username of portal server                    | wpsadmin              |
| TEST_PASSWORD        | Password of portal server                    | wpsadmin              |
| TEST_HOST            | Host of portal server                        | localhost             |
| TEST_PORT            | HTTP port of portal server                   | 30015                 |
| TEST_SECURE_PORT     | HTTPS secure port of portal server           | 30016                 |
| TEST_CONTENT_HANDLER | Content handler path                         | /wps/mycontenthandler |
| LONG_TIMEOUT         | Test timeout in case some test took too long | 300000                |



Then run test from the project's root folder (`digexp-wcm-design`):

```
$ npm install
$ npm test
```