/*
 *
 *
 * (c) Copyright Merative US L.P. and others 2020-2022 
 *
 * SPDX-Licence-Identifier: Apache 2.0
 *
 */
const { v4: uuidv4 } = require('uuid');
const chai = require('chai');

const { expect } = chai;
chai.use(require('chai-like'));
chai.use(require('chai-things'));
const { kafkaService } = require('../api/services/kafkaService');
const batchMessageHelper = require('../api/helpers/batch-messages-helper');
const registerCtrl = require('../api/controllers/register');

const numberConsents = 5;
const batchMessages = new Array(numberConsents);
const promiseMessages = new Array(numberConsents);
for (let i = 0; i < numberConsents; i += 1) {
  batchMessages[i] = {};
  batchMessages[i].txID = uuidv4();
  batchMessages[i].PatientID = 'patient-1';
  batchMessages[i].ServiceID = `service-${Date.now()}-${i}`;
  batchMessages[i].TenantID = '5102';
  batchMessages[i].FHIRPolicy = 'string';
  batchMessages[i].FHIRStatus = 'string';
  batchMessages[i].FHIRProvisionType = 'string';
  batchMessages[i].FHIRProvisionAction = 'string';
  batchMessages[i].DatatypeIDs = ['string'];
  batchMessages[i].ConsentOption = ['write', 'read'];
  batchMessages[i].Expiration = 0;
}

describe('batch-messages', function test1() {
  this.timeout(30000);
  it('should send all messages in to the Kafka topic', async () => {
    await kafkaService.connect();
    for (let i = 0; i < numberConsents; i += 1) {
      const { txID, ...consent } = batchMessages[i];
      promiseMessages[i] = new Promise((resolve) => {
        batchMessageHelper.sendMessageToBatch({ resolve, txID, ...consent });
      });
    }

    const messages = batchMessageHelper.getBatchMessages();
    expect(messages).to.have.lengthOf(numberConsents);
    await kafkaService.sendBatchMessages(messages);
    for (let i = 0; i < numberConsents; i += 1) {
      messages[i].resolve({
        status: 200,
        message: 'Successful request',
        txID: messages[i].txID,
      });
      // eslint-disable-next-line no-await-in-loop
      const response = await promiseMessages[i];
      expect(response).to.have.property('status');
      expect(response).to.have.property('message');
      expect(response).to.have.property('txID');
      expect(response.status).to.equal(200);
      expect(response.message).to.equal('Successful request');
      expect(response.txID).to.equal(messages[i].txID);
    }
    batchMessageHelper.resetBatchMessages();
    await kafkaService.disconnect();
  });

  it('should return the failure by sending message in the Kafka topic', async () => {
    await kafkaService.connect();
    for (let i = 0; i < numberConsents; i += 1) {
      batchMessages[i].ServiceID = `service-${Date.now()}-${i}`;
      batchMessages[i].TenantID = 'invalid-TenantID';
      const { txID, ...consent } = batchMessages[i];
      promiseMessages[i] = new Promise((resolve) => {
        batchMessageHelper.sendMessageToBatch({ resolve, txID, ...consent });
      });
    }

    const messages = batchMessageHelper.getBatchMessages();
    expect(messages).to.have.lengthOf(numberConsents);
    await registerCtrl.trySendToKafka(messages);
    for (let i = 0; i < numberConsents; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      const response = await promiseMessages[i];
      expect(response).to.have.property('status');
      expect(response).to.have.property('message');
      expect(response).to.have.property('txID');
      expect(response.status).to.equal(500);
      expect(response.message).to.equal('Error adding to queue');
      expect(response.txID).to.equal(batchMessages[i].txID);
    }
    await kafkaService.disconnect();
  });
});
