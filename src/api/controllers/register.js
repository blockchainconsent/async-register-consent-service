/*
 *
 *
 * (c) Copyright Merative US L.P. and others 2020-2022 
 *
 * SPDX-Licence-Identifier: Apache 2.0
 *
 */
const moment = require('moment');
const { kafkaService } = require('../services/kafkaService');
const httpService = require('../services/httpService');
const constants = require('../helpers/constants');
const config = require('../../config');
const log = require('../helpers/logger').getLogger('register');
const batchMessageHelper = require('../helpers/batch-messages-helper');

const isKafkaEnabled = process.env.KAFKA_ENABLED === 'true' || false;

const isUndefined = (parameter) => typeof (parameter) === 'undefined';

let lingerTimeout;

// TODO: revisit batch producer functionality, resetBatchMessages causes message loss
const trySendToKafka = async (batchMessages) => {
  if (lingerTimeout) {
    clearTimeout(lingerTimeout);
  }
  try {
    log.info('Attempting to send messages to topics');
    // send to kafka
    await kafkaService.sendBatchMessages(batchMessages);
    // resolve the messages in successfull case
    // eslint-disable-next-line no-restricted-syntax
    for (const itemMessage of batchMessages) {
      itemMessage.resolve({
        status: 200,
        message: 'Successful request',
        txID: itemMessage.txID,
      });
    }
  } catch (err) {
    log.error(`${err}`);
    // resolve the messages in failure case
    // eslint-disable-next-line no-restricted-syntax
    for (const itemMessage of batchMessages) {
      itemMessage.resolve({
        status: 500,
        message: 'Error adding to queue',
        txID: itemMessage.txID,
      });
    }
  } finally {
    // clean up the array of messages
    batchMessageHelper.resetBatchMessages();
  }
};

exports.register = async (req, res) => {
  log.info('Entering POST /gateway/api/v1/register-consent controller');

  const errorHandler = (msg) => res.status(400).json({
    msg: `Invalid data: ${msg}`,
    status: 400,
  });

  const txID = req.headers[constants.REQUEST_HEADERS.TRANSACTION_ID];

  const consentObj = Object.assign(req.body);

  const {
    PatientID,
    ServiceID,
    TenantID,
    DatatypeIDs,
    ConsentOption,
    Creation,
    Expiration,
    FHIRResourceID,
    FHIRResourceVersion,
    FHIRPolicy,
    FHIRStatus,
    FHIRProvisionType,
    FHIRProvisionAction,
    FHIRPerformerIDSystem,
    FHIRPerformerIDValue,
    FHIRPerformerDisplay,
    FHIRRecipientIDSystem,
    FHIRRecipientIDValue,
    FHIRRecipientDisplay,
  } = consentObj;

  const creationCheckFormat = moment(Creation, moment.ISO_8601).isValid();

  const convertOrGenerateCreation = () => {
    // If a Creation date string is provided, converts to unix timestamp.
    // Otherwise sets Creation to current unix timestamp.

    if (Creation) {
      log.debug('Creation is in right format, sets to ms.');
      consentObj.Creation = new Date(Creation).getTime();
    } else {
      log.debug('Creation is not set, uses current time.');
      consentObj.Creation = Date.now();
    }
  };

  if (
    isUndefined(PatientID)
      || isUndefined(TenantID)
      || isUndefined(DatatypeIDs)
  ) {
    const errMsg = 'missing required fields';
    log.error(errMsg);
    errorHandler(errMsg);
  } else if (typeof (PatientID) !== 'string') {
    const errMsg = 'PatientID must be string';
    log.error(errMsg);
    errorHandler(errMsg);
  } else if (!PatientID.length) {
    const errMsg = 'PatientID must not be empty';
    log.error(errMsg);
    errorHandler(errMsg);
  } else if (ServiceID && typeof (ServiceID) !== 'string') {
    const errMsg = 'ServiceID must be string';
    log.error(errMsg);
    errorHandler(errMsg);
  } else if (ServiceID && !ServiceID.length) {
    const errMsg = 'ServiceID must not be empty';
    log.error(errMsg);
    errorHandler(errMsg);
  } else if (typeof (TenantID) !== 'string') {
    const errMsg = 'TenantID must be string';
    log.error(errMsg);
    errorHandler(errMsg);
  } else if (!TenantID.length) {
    const errMsg = 'TenantID must not be empty';
    log.error(errMsg);
    errorHandler(errMsg);
  } else if (!Array.isArray(DatatypeIDs)) {
    const errMsg = 'DatatypeIDs must be array';
    log.error(errMsg);
    errorHandler(errMsg);
  } else if (DatatypeIDs.length < 1) {
    const errMsg = 'DatatypeIDs must not be empty';
    log.error(errMsg);
    errorHandler(errMsg);
  } else if (ConsentOption && !Array.isArray(ConsentOption)) {
    const errMsg = 'ConsentOption must be array';
    log.error(errMsg);
    errorHandler(errMsg);
  } else if (ConsentOption && ConsentOption.length > 2) {
    const errMsg = 'too many consent options';
    log.error(errMsg);
    errorHandler(errMsg);
  } else if (ConsentOption && !(ConsentOption.every((elem) => constants.VALID_CONSENT_OPTIONS.indexOf(elem) > -1))) {
    const errMsg = 'invalid consent option';
    log.error(errMsg);
    errorHandler(errMsg);
  } else if (
    ConsentOption && ((ConsentOption.includes('write') && ConsentOption.includes('deny'))
        || (ConsentOption.includes('read') && ConsentOption.includes('deny')))
  ) {
    const errMsg = 'deny cannot be paired with another consent option';
    log.error(errMsg);
    errorHandler(errMsg);
  } else if (Creation && !(new Date(Creation).getTime() > 0)) {
    const errMsg = 'Creation has invalid format (timestamp check), expected format: YYYY-MM-DDThh:mm:ss.sss+zz:zz ';
    log.error(errMsg);
    errorHandler(errMsg);
  } else if (Creation && !creationCheckFormat) {
    const errMsg = 'Creation has invalid format (string check), expected format: YYYY-MM-DDThh:mm:ss.sss+zz:zz ';
    log.error(errMsg);
    errorHandler(errMsg);
  } else if (Expiration && !(new Date(Expiration).getTime() >= 0)) {
    const errMsg = 'Expiration has invalid format (timestamp check)';
    log.error(errMsg);
    errorHandler(errMsg);
  } else if (FHIRResourceID && typeof (FHIRResourceID) !== 'string') {
    const errMsg = 'FHIRResourceID must be string';
    log.error(errMsg);
    errorHandler(errMsg);
  } else if (typeof (FHIRResourceID) === 'string' && !FHIRResourceID.length) {
    const errMsg = 'FHIRResourceID must not be empty';
    log.error(errMsg);
    errorHandler(errMsg);
  } else if (FHIRResourceVersion && typeof (FHIRResourceVersion) !== 'string') {
    const errMsg = 'FHIRResourceVersion must be string';
    log.error(errMsg);
    errorHandler(errMsg);
  } else if (typeof (FHIRResourceVersion) === 'string' && !FHIRResourceVersion.length) {
    const errMsg = 'FHIRResourceVersion must not be empty';
    log.error(errMsg);
    errorHandler(errMsg);
  } else if (FHIRPolicy && typeof (FHIRPolicy) !== 'string') {
    const errMsg = 'FHIRPolicy must be string';
    log.error(errMsg);
    errorHandler(errMsg);
  } else if (typeof (FHIRPolicy) === 'string' && !FHIRPolicy.length) {
    const errMsg = 'FHIRPolicy must not be empty';
    log.error(errMsg);
    errorHandler(errMsg);
  } else if (FHIRStatus && typeof FHIRStatus !== 'string') {
    const errMsg = 'FHIRStatus must be string';
    log.error(errMsg);
    errorHandler(errMsg);
  } else if (typeof FHIRStatus === 'string' && !FHIRStatus.length) {
    const errMsg = 'FHIRStatus must not be empty';
    log.error(errMsg);
    errorHandler(errMsg);
  } else if (FHIRProvisionType && typeof FHIRProvisionType !== 'string') {
    const errMsg = 'FHIRProvisionType must be string';
    log.error(errMsg);
    errorHandler(errMsg);
  } else if (typeof FHIRProvisionType === 'string' && !FHIRProvisionType.length) {
    const errMsg = 'FHIRProvisionType must not be empty';
    log.error(errMsg);
    errorHandler(errMsg);
  } else if (FHIRProvisionAction && typeof FHIRProvisionAction !== 'string') {
    const errMsg = 'FHIRProvisionAction must be string';
    log.error(errMsg);
    errorHandler(errMsg);
  } else if (typeof FHIRProvisionAction === 'string' && !FHIRProvisionAction.length) {
    const errMsg = 'FHIRProvisionAction must not be empty';
    log.error(errMsg);
    errorHandler(errMsg);
  } else if (!(FHIRStatus && FHIRProvisionType && FHIRProvisionAction) && (!ConsentOption || !ConsentOption.length)) {
    const errMsg = 'must specify at least one consent option';
    log.error(errMsg);
    errorHandler(errMsg);
  } else if (FHIRPerformerIDSystem && typeof FHIRPerformerIDSystem !== 'string') {
    const errMsg = 'FHIRPerformerIDSystem must be string';
    log.error(errMsg);
    errorHandler(errMsg);
  } else if (typeof FHIRPerformerIDSystem === 'string' && !FHIRPerformerIDSystem.length) {
    const errMsg = 'FHIRPerformerIDSystem must not be empty';
    log.error(errMsg);
    errorHandler(errMsg);
  } else if (FHIRPerformerIDValue && typeof FHIRPerformerIDValue !== 'string') {
    const errMsg = 'FHIRPerformerIDValue must be string';
    log.error(errMsg);
    errorHandler(errMsg);
  } else if (typeof FHIRPerformerIDValue === 'string' && !FHIRPerformerIDValue.length) {
    const errMsg = 'FHIRPerformerIDValue must not be empty';
    log.error(errMsg);
    errorHandler(errMsg);
  } else if (FHIRPerformerDisplay && typeof FHIRPerformerDisplay !== 'string') {
    const errMsg = 'FHIRPerformerDisplay must be string';
    log.error(errMsg);
    errorHandler(errMsg);
  } else if (typeof FHIRPerformerDisplay === 'string' && !FHIRPerformerDisplay.length) {
    const errMsg = 'FHIRPerformerDisplay must not be empty';
    log.error(errMsg);
    errorHandler(errMsg);
  } else if (FHIRRecipientIDSystem && typeof FHIRRecipientIDSystem !== 'string') {
    const errMsg = 'FHIRRecipientIDSystem must be string';
    log.error(errMsg);
    errorHandler(errMsg);
  } else if (typeof FHIRRecipientIDSystem === 'string' && !FHIRRecipientIDSystem.length) {
    const errMsg = 'FHIRRecipientIDSystem must not be empty';
    log.error(errMsg);
    errorHandler(errMsg);
  } else if (FHIRRecipientIDValue && typeof FHIRRecipientIDValue !== 'string') {
    const errMsg = 'FHIRRecipientIDValue must be string';
    log.error(errMsg);
    errorHandler(errMsg);
  } else if (typeof FHIRRecipientIDValue === 'string' && !FHIRRecipientIDValue.length) {
    const errMsg = 'FHIRRecipientIDValue must not be empty';
    log.error(errMsg);
    errorHandler(errMsg);
  } else if (FHIRRecipientDisplay && typeof FHIRRecipientDisplay !== 'string') {
    const errMsg = 'FHIRRecipientDisplay must be string';
    log.error(errMsg);
    errorHandler(errMsg);
  } else if (typeof FHIRRecipientDisplay === 'string' && !FHIRRecipientDisplay.length) {
    const errMsg = 'FHIRRecipientDisplay must not be empty';
    log.error(errMsg);
    errorHandler(errMsg);
  } else {
    let result;
    convertOrGenerateCreation();

    if (isKafkaEnabled) {
      log.info(`Attempting to send consent to Kafka service. txID: ${txID}. TenantID: ${TenantID}`);

      // check available exist the input-topic
      try {
        const existedTopic = await kafkaService.getExistedTopic(TenantID);

        log.info(`Checking if Kafka topics exist for tenant: ${existedTopic}. txID: ${txID}. TenantID: ${TenantID}`);

        if (!existedTopic) {
          log.info(`Topic "${config.kafkaClient.topicName}-${TenantID}" not found`);
          return res.status(404).json({
            status: 404,
            message: `Kafka topic for tenant ${TenantID} does not exist`,
          });
        }
        result = await kafkaService.send(JSON.stringify(consentObj), existedTopic, txID, TenantID);
        log.info(`Submit consent response: ${result.message}. Status: ${result.status}. txID: ${txID}. TenantID: ${TenantID}`);
      } catch (err) {
        log.error(`${err}`);
        return res.status(503).json({
          status: 503,
          message: 'The service is temporarily unable to handle your request due to maintenance downtime or capacity problems. Please try again later.',
        });
      }
    } else {
      log.info(`Attempting to send consent to Simple Consent API. txID: ${txID}. TenantID: ${TenantID}`);
      const isCheckHttpClient = await httpService.checkConsentEndpoint();
      if (!isCheckHttpClient) {
        log.error('Internal Service Error: Simple Consent API is not available');
        return res.status(500).json({
          status: 500,
          message: 'Internal Service Error: Simple Consent API is not available',
        });
      }
      result = await httpService.sendConsent(consentObj, txID, TenantID);
      log.info(`Response from simple consent register consent endpoint: ${result.message}. Status: ${result.status}. txID: ${txID}. TenantID: ${TenantID}`);
    }

    return res.status(result.status).json(result);
  }

  return res.status(500);
};

exports.trySendToKafka = trySendToKafka;
