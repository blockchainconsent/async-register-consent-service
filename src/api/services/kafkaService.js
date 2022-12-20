/*
 *
 *
 * (c) Copyright Merative US L.P. and others 2020-2022 
 *
 * SPDX-Licence-Identifier: Apache 2.0
 *
 */

const tls = require('tls');
const { Kafka, logLevel, CompressionTypes } = require('kafkajs');
const { levels } = require('log4js');
const config = require('../../config');
const constants = require('../helpers/constants');
const { KAFKA_CACHED } = require('../helpers/kafka-cached');
const logger = require('../helpers/logger').getLogger('Kafka-service');

const toLog4jsLogLevel = (level) => {
  switch (level) {
    case logLevel.ERROR:
    case logLevel.NOTHING:
      return levels.ERROR;
    case logLevel.WARN:
      return levels.WARN;
    case logLevel.INFO:
      return levels.INFO;
    case logLevel.DEBUG:
      return levels.DEBUG;
    default:
      return levels.ALL;
  }
};

const log4jsCreator = () => {
  logger.level = config.log_level;
  return ({ level, log }) => {
    const { message, ...extra } = log;
    logger.log(toLog4jsLogLevel(level), message, extra);
  };
};

const isKafkaEnabled = process.env.KAFKA_ENABLED === 'true';
const isKafkaProxyEnabled = process.env.KAFKA_PROXY_ENABLED === 'true';
const brokersObj = {};

const customSocketFactory = ({
  host, port, ssl, onConnect,
}) => {
  let targetPort;
  const socket = isKafkaProxyEnabled
    ? (
      targetPort = brokersObj.brokersMap.get(`${host}:${port}`),
      tls.connect({
        host: config.kafkaClient.proxyHost, port: targetPort, servername: host, ...ssl,
      }, onConnect)
    )
    : tls.connect({
      host, port, servername: host, ...ssl,
    }, onConnect);

  socket.setKeepAlive(true, config.kafkaClient.keepAliveDelay); // in ms
  return socket;
};

const getCorrespondenceTopic = (topics, TenantID) => topics.find((topic) => topic.includes(`${config.kafkaClient.topicName}-${TenantID}`));

class KafkaService {
  constructor() {
    if (isKafkaEnabled) {
      brokersObj.brokers = process.env.BROKERS.split(',');
      if (isKafkaProxyEnabled) {
        const BROKERS_PROXY_PORTS = process.env.BROKERS_PROXY_PORTS.split(',');
        brokersObj.brokersMap = new Map();
        brokersObj.brokers.forEach((broker, index) => brokersObj.brokersMap.set(broker, BROKERS_PROXY_PORTS[index]));
      }
      this.init();
    }
  }

  init() {
    this.kafka = new Kafka({
      clientId: config.kafkaClient.clientId,
      brokers: brokersObj.brokers,
      ssl: true,
      sasl: {
        mechanism: 'plain', // scram-sha-256 or scram-sha-512
        username: process.env.USERNAME,
        password: process.env.PASSWORD,
      },
      retry: {
        initialRetryTime: config.kafkaClient.initialRetryTime,
        retries: config.kafkaClient.retries,
      },
      logCreator: log4jsCreator,
      socketFactory: customSocketFactory,
      connectionTimeout: config.kafkaClient.proxyConnectionTimeout,
    });
    this.producer = this.kafka.producer();
    this.admin = this.kafka.admin();
  }

  async initializeTopics() {
    KAFKA_CACHED.tenantTopics = await this.admin.listTopics();
  }

  async connect() {
    if (isKafkaEnabled) {
      try {
        await this.producer.connect();
        logger.info('Producer has been connected');
        return true;
      } catch (e) {
        logger.error(`Producer has not been connected: ${e}`);
        return false;
      }
    }

    return false;
  }

  async connectAdmin() {
    if (isKafkaEnabled) {
      try {
        await this.admin.connect();
        logger.info('Admin has been connected');
        return true;
      } catch (e) {
        logger.error(`Admin has not been connected: ${e}`);
        return false;
      }
    }

    return false;
  }

  async disconnect() {
    if (isKafkaEnabled) {
      await this.producer.disconnect();
      logger.info('Producer has been disconnected');
    }
  }

  async disconnectAdmin() {
    if (isKafkaEnabled) {
      await this.admin.disconnect();
      logger.info('Admin has been disconnected');
    }
  }

  async getExistedTopic(TenantID) {
    if (isKafkaEnabled) {
      try {
        if (!KAFKA_CACHED.initialized) {
          await this.initializeTopics();
        }
        const correspondenceTopic = getCorrespondenceTopic(KAFKA_CACHED.topics, TenantID);
        if (correspondenceTopic) {
          logger.info(`Successfully got topic "${correspondenceTopic}"`);
          return correspondenceTopic;
        }
        await this.initializeTopics();
        return getCorrespondenceTopic(KAFKA_CACHED.topics, TenantID);
      } catch (e) {
        logger.error(e);
        throw e;
      }
    }

    return false;
  }

  async send(message, topic, txID, TenantID) {
    try {
      await this.producer.send({
        topic,
        messages: [{
          value: message,
          headers: {
            [constants.REQUEST_HEADERS.TRANSACTION_ID]: txID,
            [constants.REQUEST_HEADERS.TENANT_ID]: TenantID,
          },
        }],
      });
      logger.info(`Sending message to topic "${topic}", txID: ${txID}, tenantID: ${TenantID}`);
      return {
        status: 200,
        message: 'Successful request',
        txID,
      };
    } catch (e) {
      logger.error(`Failed to send message to topic "${topic}", txID: ${txID}, tenantID: ${TenantID}: ${e}`);
      setTimeout(() => {
        this.producer.connect();
      }, 1000);
      return {
        status: 500,
        message: 'Error adding to queue',
        txID,
      };
    }
  }

  // producing the messages to multiple topic
  async sendBatchMessages(batchMessages) {
    // creating an array of objects with topic and messages
    const topicMessages = batchMessages
      .reduce((totalTopicMessages, accumTopicMessage) => {
        const topic = `${config.kafkaClient.topicName}-${accumTopicMessage.TenantID}`;
        const existItemIndex = totalTopicMessages.findIndex((item) => item.topic === topic);
        const { resolve, txID, ...consent } = accumTopicMessage;
        if (existItemIndex > -1) {
          totalTopicMessages[existItemIndex].messages.push({
            value: JSON.stringify(consent),
            headers: {
              [constants.REQUEST_HEADERS.TRANSACTION_ID]: txID,
              [constants.REQUEST_HEADERS.TENANT_ID]: accumTopicMessage.TenantID,
            },
          });
        } else {
          totalTopicMessages.push({
            topic,
            messages: [{
              value: JSON.stringify(consent),
              headers: {
                [constants.REQUEST_HEADERS.TRANSACTION_ID]: txID,
                [constants.REQUEST_HEADERS.TENANT_ID]: accumTopicMessage.TenantID,
              },
            }],
          });
        }
        return totalTopicMessages;
      }, []);
    logger.info(JSON.stringify(topicMessages));
    try {
      // send messages to the Kafka topic
      await this.producer.sendBatch({ topicMessages, compression: CompressionTypes.GZIP });
      logger.info(`${batchMessages.length} messages sending to topics`);
    } catch (err) {
      logger.error(`Failed to send messages to topics: ${err}`);
      throw err;
    }
  }

  async sendHealthCheck() {
    const currentTime = new Date().toISOString();
    const message = 'Health check!';

    try {
      await this.producer.send({
        topic: config.kafkaClient.healthTopicName,
        messages: [{
          value: message,
          headers: {
            [constants.REQUEST_HEADERS.TIMESTAMP]: currentTime,
          },
        }],
      });
      logger.info(`Kafka service is healthy in topic "${config.kafkaClient.healthTopicName}"`);
      return true;
    } catch (error) {
      logger.error(`Kafka service is unhealthy in topic "${config.kafkaClient.healthTopicName}": ${error}`);
      setTimeout(() => {
        this.producer.connect();
      }, 1000);
      return false;
    }
  }
}

const kafkaService = new KafkaService();

module.exports = { kafkaService };
