## Test Prerequisities

- Docker (to run portal server locally)
- Node.js 12



## Setup Test Portal Server

This step describes how to setup a local portal server used for unit tests. If you already have a portal server suitable for test, you can skip this step.

Start portal server locally at port 30015, https port at 30005:

```
$ docker run -p 30015:30015 -p 30005:30005 ibmcom/websphere-portal:latest
```



## Testing

At first config the test portal server in `digexp-wcm-design/test/config.js`:

| Property             | Description                                  | Example               |
| -------------------- | -------------------------------------------- | --------------------- |
| TEST_USERNAME        | Username of portal server                    | wpsadmin              |
| TEST_PASSWORD        | Password of portal server                    | wpsadmin              |
| TEST_HOST            | Host of portal server                        | localhost             |
| TEST_PORT            | HTTP port of portal server                   | 30015                 |
| TEST_SECURE_PORT     | HTTPS secure port of portal server           | 30005                 |
| TEST_CONTENT_HANDLER | Content handler path                         | /wps/mycontenthandler |
| LONG_TIMEOUT         | Test timeout in case some test took too long | 300000                |



Then run test from the project's root folder (`digexp-wcm-design`):

```
$ npm test
```