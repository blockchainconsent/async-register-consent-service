/*
 *
 *
 * (c) Copyright Merative US L.P. and others 2020-2022 
 *
 * SPDX-Licence-Identifier: Apache 2.0
 *
 */

const express = require('express');

const requestLogger = require('../middleware/request-logger');
const appIdAuth = require('../middleware/app-id-auth');

const checkAuthAdmin = appIdAuth.getAuthStrategy(appIdAuth.APP_ID_SCOPES.CONSENT_WRITE);

const registerController = require('../controllers/register');

const router = express.Router();

router.post('/', requestLogger, checkAuthAdmin, registerController.register);
router.post('/internal', requestLogger, registerController.register);

module.exports = router;
