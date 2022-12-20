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
const https = require('https');

const config = require('../../config');
const constants = require('../helpers/constants');
const log = require('../helpers/logger').getLogger('HTTPClient');

const baseUrl = `${config.httpClient.apiProtocol}://${config.httpClient.apiHost}:${config.httpClient.apiPort}`;
const registerConsentUrl = `${baseUrl}${config.httpClient.registerConsentEndpoint}`;
const healthConsentUrl = `${baseUrl}${config.httpClient.healthConsentEndpoint}`;

/**
 * Get request config to HTTP service.
 *
 * @param {object} options
 * @returns {AxiosRequestConfig<Object>} axios request config
 */
const setAxiosOptions = (options) => {
  if (config.httpClient.apiProtocol === 'https') {
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false,
    });
    return { httpsAgent, ...options };
  }
  return { ...options };
};

const setConfigHttpClient = () => {
  const httpClient = axios.create({
    baseURL: registerConsentUrl,
    timeout: config.httpClient.timeout,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  const retries = config.httpClient.retries || 1;
  const retryDelay = config.httpClient.retryDelay || 3000;

  // setup retry-axios config
  httpClient.defaults.raxConfig = {
    instance: httpClient,
    retry: retries,
    noResponseRetries: retries, // retry when no response received (such as on ETIMEOUT)
    statusCodesToRetry: [[500, 599]], // retry only on 5xx responses (no retry on 4xx responses)
    httpMethodsToRetry: ['POST', 'GET', 'HEAD', 'PUT'],
    backoffType: 'static', // options are 'exponential' (default), 'static' or 'linear'
    retryDelay,
    onRetryAttempt: (err) => {
      const cfg = rax.getConfig(err);
      log.warn('No response received, retrying request:');
      log.warn(`Retry attempt #${cfg.currentRetryAttempt}`);
    },
  };
  rax.attach(httpClient);
  return httpClient;
};

module.exports = {
  async checkConsentEndpoint() {
    try {
      log.debug(`Sending HTTP(S) request to ${healthConsentUrl}`);
      const axiosOptions = setAxiosOptions();
      await axios.get(healthConsentUrl, axiosOptions);
      log.info('Http service health is OK');
      return true;
    } catch (err) {
      const errResponseMsg = err.response ? err.response.data.msg : err.message;
      log.error(`Http service health is not OK: ${errResponseMsg}`);
      return false;
    }
  },

  async sendConsent(payload, txID, TenantID) {
    try {
      log.debug(`Sending request to ${registerConsentUrl}`);
      const httpClient = setConfigHttpClient();
      const axiosOptions = setAxiosOptions({
        headers: {
          [constants.REQUEST_HEADERS.TRANSACTION_ID]: txID,
          [constants.REQUEST_HEADERS.TENANT_ID]: TenantID,
        },
      });
      await httpClient.post('/', payload, axiosOptions);
      return {
        status: 200,
        message: 'Successful request',
        txID,
      };
    } catch (err) {
      const errResponseMsg = err.response ? err.response.data.msg : err.message;
      const errResponseStatus = err.response ? err.response.data.status : 500;
      log.error(errResponseMsg);
      return {
        status: errResponseStatus,
        message: 'Failed to sending consent',
        txID,
      };
    }
  },
};
