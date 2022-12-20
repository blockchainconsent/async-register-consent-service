/*
 *
 *
 * (c) Copyright Merative US L.P. and others 2020-2022 
 *
 * SPDX-Licence-Identifier: Apache 2.0
 *
 */

const axios = require('axios');
const rax = require('retry-axios');
const querystring = require('querystring');

const config = require('../../config/config.json');
const log = require('./logger').getLogger('appid-helper');

const url = process.env.APP_ID_URL;
const clientID = process.env.APP_ID_CLIENT_ID;
const tenantID = process.env.APP_ID_TENANT_ID;
const secret = process.env.APP_ID_SECRET;

const oauthServerUrl = `${url}/oauth/v4/${tenantID}`;
const pingServerUrl = `${url}/oauth/v4/${tenantID}/publickeys`;

const validateConfig = () => {
  let missingVar;
  if (!url) {
    missingVar = 'APP_ID_URL';
  } else if (!clientID) {
    missingVar = 'APP_ID_CLIENT_ID';
  } else if (!tenantID) {
    missingVar = 'APP_ID_TENANT_ID';
  } else if (!secret) {
    missingVar = 'APP_ID_SECRET';
  }
  if (missingVar) {
    throw new Error(`Invalid AppID config: missing variable '${missingVar}'`);
  }
};

const pingAppID = async () => {
  const { CancelToken } = axios;
  const source = CancelToken.source();
  const timeout = setTimeout(() => {
    source.cancel(`Request timed out after ${config.appID.timeout} ms`);
  }, config.appID.timeout);

  const pingClient = axios.create({
    baseURL: pingServerUrl,
    timeout: config.appID.timeout,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      accept: 'application/json',
    },
  });

  try {
    await pingClient.get('/', { cancelToken: source.token }).finally(() => clearTimeout(timeout));
    log.info('AppID health is OK');
    return true;
  } catch (error) {
    log.error(`AppID health is not OK: ${error}`);
    return false;
  }
};

const appIdLoginClient = () => {
  const loginClient = axios.create({
    baseURL: `${oauthServerUrl}/token`,
    timeout: config.appID.timeout,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      accept: 'application/json',
    },
    auth: {
      username: clientID,
      password: secret,
    },
  });

  const retries = config.appID.retries || 1;
  const retryDelay = config.appID.retryDelay || 3000;

  // setup retry-axios config
  loginClient.defaults.raxConfig = {
    instance: loginClient,
    retry: retries,
    noResponseRetries: retries, // retry when no response received (such as on ETIMEOUT)
    statusCodesToRetry: [[500, 599]], // retry only on 5xx responses (no retry on 4xx responses)
    httpMethodsToRetry: ['POST', 'GET', 'HEAD', 'PUT'],
    backoffType: 'static', // options are 'exponential' (default), 'static' or 'linear'
    retryDelay,
    onRetryAttempt: (err) => {
      const cfg = rax.getConfig(err);
      log.warn('No response received from AppID, retrying login request:');
      log.warn(`Retry attempt #${cfg.currentRetryAttempt}`);
    },
  };
  rax.attach(loginClient);
  return loginClient;
};

const loginAppID = async (username, password) => {
  try {
    validateConfig();
    const loginClient = appIdLoginClient();
    const requestBody = {
      username,
      password,
      grant_type: 'password',
    };
    log.debug('Calling AppID to retrieve auth token');
    const response = await loginClient.post('/', querystring.stringify(requestBody));
    log.info('Login request to AppID was successful');
    return response.data;
  } catch (error) {
    log.error(`Login request to AppID failed with error ${error}`);
    const errorObj = new Error();
    if (error.response) {
      const errorResponse = error.response;
      errorObj.status = errorResponse.status;
      errorObj.statusText = errorResponse.statusText;
      if ('data' in errorResponse) {
        errorObj.message = errorResponse.data.error_description;
      }
    } else {
      errorObj.status = 503;
      errorObj.statusText = error.code;
      errorObj.message = 'The service is temporarily unable to handle your request due to maintenance downtime or capacity problems. Please try again later.';
    }
    throw errorObj;
  }
};

module.exports = {
  loginAppID,
  pingAppID,
  validateConfig,
};
