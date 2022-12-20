/*
 *
 *
 * (c) Copyright Merative US L.P. and others 2020-2022 
 *
 * SPDX-Licence-Identifier: Apache 2.0
 *
 */

const { kafkaService } = require('../services/kafkaService');
const { checkConsentEndpoint } = require('../services/httpService');
const helper = require('./app-id-helper');

const isKafkaEnabled = process.env.KAFKA_ENABLED === 'true';

const checkReadiness = async () => {
  const responseHttpClient = await checkConsentEndpoint();
  const responseAppID = await helper.pingAppID();
  const arrServices = [
    { service: 'AppID', isConnection: responseAppID },
    { service: 'HttpClient', isConnection: responseHttpClient },
  ];
  return new Promise((resolve, reject) => {
    const existProblem = arrServices.find((el) => el.isConnection !== true);
    if (existProblem) {
      reject(new Error(`${existProblem.service} service is unhealthy`));
    }
    resolve('Gateway service is healthy');
  });
};

const checkLiveness = async () => {
  // checking the Kafka connection
  const isKafkaConnection = isKafkaEnabled ? await kafkaService.sendHealthCheck() : false;
  return new Promise((resolve, reject) => {
    if (isKafkaConnection) {
      resolve('Gateway service liveness is OK');
    }
    reject(new Error('Gateway service liveness is not OK, Kafka service is unhealthy'));
  });
};

const registerChecks = (health, healthcheck) => {
  const readinessCheck = new health.ReadinessCheck('readinessCheck', () => checkReadiness());
  healthcheck.registerReadinessCheck(readinessCheck);
  const livenessCheck = new health.LivenessCheck('livenessCheck', () => checkLiveness());
  healthcheck.registerLivenessCheck(livenessCheck);
};

module.exports = {
  registerChecks,
};
