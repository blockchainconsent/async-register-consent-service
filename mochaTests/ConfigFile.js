/*
 *
 *
 * (c) Copyright Merative US L.P. and others 2020-2022 
 *
 * SPDX-Licence-Identifier: Apache 2.0
 *
 */

exports.token1 = '';
exports.token2 = '';

exports.username1 = process.env.APP_ID_TEST_EMAIL1;
exports.password1 = process.env.APP_ID_TEST_PASSWORD1;
exports.tenant1ID = 'tenant1';

exports.username2 = process.env.APP_ID_TEST_EMAIL2;
exports.password2 = process.env.APP_ID_TEST_PASSWORD2;
exports.tenant2ID = '5102';

exports.appID = {
  retries: 1,
  retryDelay: 3000,
  timeout: 10000,
};

exports.log = {
  level: 'debug',
};

const ingress = process.env.GATEWAY_INGRESS;

if (ingress !== null && ingress !== '' && ingress !== undefined) {
  const protocol = 'https';
  exports.server = `${protocol}://${ingress}/`;
  exports.serverSimpleConsent = `${protocol}://${ingress}/`;
} else {
  // eslint-disable-next-line global-require
  exports.app = require('../src/server'); // start the app server

  let protocol = 'http';
  protocol = process.env.MOCHA_CM_PROTOCOL || protocol;
  
  const host = process.env.MOCHA_CM_HOST || 'localhost';
  const port = process.env.MOCHA_CM_PORT || '3000';
  const portSimpleConsentService = process.env.MOCHA_CM_PORT || '3002';
  exports.server = `${protocol}://${host}:${port}/`;
  exports.serverSimpleConsent = `${protocol}://${host}:${portSimpleConsentService}/`;
}

exports.url = process.env.APP_ID_URL;
exports.clientID = process.env.APP_ID_CLIENT_ID;
exports.secret = process.env.APP_ID_SECRET;
exports.apikey = process.env.APP_ID_IAM_KEY;
exports.tenantID = process.env.APP_ID_TENANT_ID;
