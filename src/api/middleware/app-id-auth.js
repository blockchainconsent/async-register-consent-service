/*
 *
 *
 * (c) Copyright Merative US L.P. and others 2020-2022 
 *
 * SPDX-Licence-Identifier: Apache 2.0
 *
 */

const passport = require('passport');
const { APIStrategy } = require('ibmcloud-appid');

const appIDUrl = process.env.APP_ID_URL;
const tenantID = process.env.APP_ID_TENANT_ID;

const APP_ID_SCOPES = {
  CONSENT_WRITE: 'consent.write',
};

passport.use(
  new APIStrategy({
    oauthServerUrl: `${appIDUrl}/oauth/v4/${tenantID}`,
  }),
);

const authenticateStandardUser = passport.authenticate(APIStrategy.STRATEGY_NAME, {
  session: false,
});

const authenticateConsentManagerAdmin = passport.authenticate(APIStrategy.STRATEGY_NAME, {
  session: false,
  scope: APP_ID_SCOPES.CONSENT_WRITE,
});

const getAuthStrategy = (scope) => {
  let authStrategy;
  if (scope === APP_ID_SCOPES.CONSENT_WRITE) {
    authStrategy = authenticateConsentManagerAdmin;
  } else {
    authStrategy = authenticateStandardUser;
  }
  return authStrategy;
};

module.exports = {
  APP_ID_SCOPES,
  getAuthStrategy,
};
