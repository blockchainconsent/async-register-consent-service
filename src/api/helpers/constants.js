/*
 *
 *
 * (c) Copyright Merative US L.P. and others 2020-2022 
 *
 * SPDX-Licence-Identifier: Apache 2.0
 *
 */
const config = require('../../config');

exports.REQUEST_HEADERS = {
  PATIENT_ID: 'x-cm-patientid',
  TENANT_ID: 'x-cm-tenantid',
  TRANSACTION_ID: 'x-cm-txn-id',
  TIMESTAMP: 'timestamp',
};

exports.SESSIONS = {
  TRANSACTION: 'transaction',
};

exports.BATCH_MESSAGES = {
  LIMIT_SIZE: config.kafkaClient.limitSizeBatchMessages || 30,
  LINGER_TIMEOUT: config.kafkaClient.lingerTimeoutBatchMessages || 150,
  STATE: {
    PENDING: 'pending',
    SUBMITTED: 'submitted',
    FAILED: 'failed',
  },
};
exports.VALID_CONSENT_OPTIONS = ['write','read','deny']
