/*
 *
 *
 * (c) Copyright Merative US L.P. and others 2020-2022 
 *
 * SPDX-Licence-Identifier: Apache 2.0
 *
 */

exports.KAFKA_CACHED = {
  initialized: false,
  topics: [],
  set tenantTopics(topics) {
    this.topics = topics;
    this.initialized = true;
  },
};
