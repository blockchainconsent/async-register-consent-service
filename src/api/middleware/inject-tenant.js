/*
 *
 *
 * (c) Copyright Merative US L.P. and others 2020-2022 
 *
 * SPDX-Licence-Identifier: Apache 2.0
 *
 */
const atob = require('atob');

const log = require('../helpers/logger').getLogger('inject-tenantID');

const injectTenantID = (req, _res, next) => {
  if (req.headers && req.headers.authorization && req.headers.authorization.includes('Bearer')) {
    try {
      const authorizationHeader = req.headers.authorization;
      const token = authorizationHeader.split(' ')[1];
      try {
        const encodedPayload = token.split('.')[1];
        const payload = JSON.parse(atob(encodedPayload));
        const { TenantID } = payload;
        req.TenantID = TenantID;
        log.info('Injected TenantID in req');
      } catch (err) {
        log.warn('Failed to parse Authorization header for TenantID');
      }
    } catch (err) {
      log.error(err);
      log.error('Failed to inject TenantID in req');
    }
  }
  next();
};

module.exports = injectTenantID;
