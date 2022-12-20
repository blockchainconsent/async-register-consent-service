# register-api

## Environment Variables

Create a `.env` file in /src with the following required variables

```
APP_ID_URL
APP_ID_TENANT_ID
APP_ID_CLIENT_ID
APP_ID_SECRET
APP_ID_IAM_KEY
APP_ID_TEST_EMAIL - Email address for an AppID user that will be created in the mocha tests.
APP_ID_TEST_PASSWORD - Password for an AppID user that will be created in the mocha tests.
KAFKA_ENABLED
KAFKA_PROXY_ENABLED
USERNAME
PASSWORD
BROKERS
BROKERS_PROXY_PORTS
```

#### Run Cloudant connection through proxy

If you decided to use proxy server in order to connect to the Kafka please configure `KAFKA_PROXY_ENABLED` and `BROKERS_PROXY_PORTS` values.
