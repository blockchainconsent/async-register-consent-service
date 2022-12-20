/*
 *
 *
 * (c) Copyright Merative US L.P. and others 2020-2022 
 *
 * SPDX-Licence-Identifier: Apache 2.0
 *
 */
const promiseMessages = [];
  
exports.getBatchMessages = () => promiseMessages;

exports.sendMessageToBatch = (body) => {
  promiseMessages.push(body);
};

exports.pushPromiseMessage = (message, txID) => new Promise((resolve, _reject) => {
  promiseMessages.push({ resolve, message, txID });
});

exports.resetBatchMessages = () => {
  promiseMessages.length = 0;
};
