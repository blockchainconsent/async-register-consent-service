/*
 *
 *
 * (c) Copyright Merative US L.P. and others 2020-2022 
 *
 * SPDX-Licence-Identifier: Apache 2.0
 *
 */
const { REQUEST_HEADERS } = require('../helpers/constants');
const log = require('../helpers/logger').getLogger('request-timeout');

const requestTimeout = (req, res, next) => {
  if (!req.timedout) return next();
  log.error('Response timeout');
  return res.status(500).json({
    status: 500,
    message: 'Response timeout',
    txID: req.headers[REQUEST_HEADERS.TRANSACTION_ID],
  });
};

module.exports = requestTimeout;
