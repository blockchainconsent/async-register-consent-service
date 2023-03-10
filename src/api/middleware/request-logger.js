/*
 *
 *
 * (c) Copyright Merative US L.P. and others 2020-2022 
 *
 * SPDX-Licence-Identifier: Apache 2.0
 *
 */

const { v4: uuidv4 } = require('uuid');
const cls = require('cls-hooked');
const { EventEmitter } = require('events');

const logger = require('../helpers/logger').getLogger('request-info');
const { SESSIONS, REQUEST_HEADERS } = require('../helpers/constants');

const logRequestInfo = (req, res, next) => {
  const ns = cls.createNamespace(SESSIONS.TRANSACTION);
  if (req instanceof EventEmitter) {
    ns.bindEmitter(req);
  }
  if (res instanceof EventEmitter) {
    ns.bindEmitter(res);
  }

  const tenantID = req.body.TenantID;
  let txID = req.headers[REQUEST_HEADERS.TRANSACTION_ID];
  if (!txID) {
    txID = uuidv4();
    req.headers[REQUEST_HEADERS.TRANSACTION_ID] = txID;
  }

  logger.debug(`Incoming request: ${req.method} ${req.originalUrl}; txID: ${txID}`);

  ns.run(() => {
    ns.set('txID', txID);
    ns.set('TenantID', tenantID);
    return next();
  });
};

module.exports = logRequestInfo;
