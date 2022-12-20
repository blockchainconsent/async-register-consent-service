/* eslint-disable no-unused-expressions */
/*
 *
 *
 * (c) Copyright Merative US L.P. and others 2020-2022 
 *
 * SPDX-Licence-Identifier: Apache 2.0
 *
 */

const chai = require('chai');
const chaiHttp = require('chai-http');

chai.use(chaiHttp);
const { expect } = chai;
chai.use(require('chai-like'));
const chaiThings = require('chai-things');

chai.use(chaiThings);
const { helperAppID, idGenerator } = require('hcls-common');
const config = require('../ConfigFile');

const constants = require('../constants');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const patientIDHeader = constants.REQUEST_HEADERS.PATIENT_ID;
const patient0ID = `patient0-${idGenerator()}`;
const patient1ID = `patient1-${idGenerator()}`;
const patient2ID = `patient2-${idGenerator()}`;
const patient3ID = `patient3-${idGenerator()}`;
const patient4ID = `patient4-${idGenerator()}`;
const patient5ID = `patient5-${idGenerator()}`;
const patient6ID = `patient6-${idGenerator()}`;
const patient7ID = `patient7-${idGenerator()}`;
const patient8ID = `patient8-${idGenerator()}`;
const patient9ID = `patient9-${idGenerator()}`;

const datatype1IDs = [`datatype1-${idGenerator()}`];
const datatype2IDs = [`datatype2-${idGenerator()}`];
const datatype3IDs = [`datatype3-${idGenerator()}`];
const consentOptionWrite = ['write'];
const consentOptionRead = ['read'];
const consentOptionWriteRead = ['write', 'read'];
const consentOptionWriteDeny = ['write', 'deny'];

const fhirResourceID = 'consent-001';
const fhirResourceVersion = '1';
const fhirPolicy = 'regular';
const fhirStatus = 'active';
const fhirProvisionType = 'permit';
const fhirProvisionAction = 'disclose';
const fhirPerformerIDSystem = 'http://terminology.hl7.org/CodeSystem/v3-ParticipationType';
const fhirPerformerIDValue = '0ba43008-1be2-4034-b50d-b76ff0110eae';
const fhirPerformerDisplay = 'Old Payer';
const fhirRecipientIDSystem = 'http://terminology.hl7.org/CodeSystem/v3-ParticipationType';
const fhirRecipientIDValue = '93a4bb61-4cc7-469b-bf1b-c9cc24f8ace0';
const fhirRecipientDisplay = 'New Payer';
const creation = '2017-01-01T00:00:00Z';

describe('Gateway Service integration tests', function test() {
  this.timeout(30000);
  before(async () => {
    const appIDDataObj1 = {
      url: config.url,
      tenantID: config.tenantID,
      userTenantID: config.tenant1ID,
      userName: constants.APPID_USER.USER_NAME,
      clientID: config.clientID,
      secret: config.secret,
      apikey: config.apikey,
    };
    helperAppID.setConfig(appIDDataObj1);
    await helperAppID.existUserCheck(config.username1, config.password1);

    const appIDDataObj2 = {
      url: config.url,
      tenantID: config.tenantID,
      userTenantID: config.tenant2ID,
      userName: constants.APPID_USER.USER_NAME,
      clientID: config.clientID,
      secret: config.secret,
      apikey: config.apikey,
    };
    helperAppID.setConfig(appIDDataObj2);
    await helperAppID.existUserCheck(config.username2, config.password2);
  });

  describe('Invalid Login', function validLoginTest() {
    this.timeout(5000);

    it('Should return a 400, invalid email', (done) => {
      const path = 'gateway/api/v1/login';
      const body = {
        email: 'invalid@poc.com',
        password: config.password1,
      };
      chai
        .request(config.server)
        .post(path)
        .send(body)
        .end((err, res) => {
          expect(res.status).to.equal(400);
          expect(res.body).to.have.property('error');
          expect(res.body.error).to.have.property('message');
          expect(res.body.error.message).to.include('The email or password that you entered is incorrect.');
          done();
        });
    });

    it('Should return a 400, invalid password', (done) => {
      const path = 'gateway/api/v1/login';
      const body = {
        email: config.username1,
        password: 'invalid',
      };
      chai
        .request(config.server)
        .post(path)
        .send(body)
        .end((err, res) => {
          expect(res.status).to.equal(400);
          expect(res.body).to.have.property('error');
          expect(res.body.error).to.have.property('message');
          expect(res.body.error.message).to.include('The email or password that you entered is incorrect.');
          done();
        });
    });

    it('Should return a 400, empty email', (done) => {
      const path = 'gateway/api/v1/login';
      const body = {
        email: '',
        password: config.password1,
      };
      chai
        .request(config.server)
        .post(path)
        .send(body)
        .end((err, res) => {
          expect(res.status).to.equal(400);
          expect(res.body).to.have.property('error');
          expect(res.body.error).to.have.property('message');
          expect(res.body.error.message).to.include('The email or password that you entered is incorrect.');
          done();
        });
    });

    it('Should return a 400, empty password', (done) => {
      const path = 'gateway/api/v1/login';
      const body = {
        email: config.username1,
        password: '',
      };
      chai
        .request(config.server)
        .post(path)
        .send(body)
        .end((err, res) => {
          expect(res.status).to.equal(400);
          expect(res.body).to.have.property('error');
          expect(res.body.error).to.have.property('message');
          expect(res.body.error.message).to.include('The email or password that you entered is incorrect.');
          done();
        });
    });

    it('Should return a 400, email is missing', (done) => {
      const path = 'gateway/api/v1/login';
      const body = {
        // email : config.username1,
        password: config.password1,
      };
      chai
        .request(config.server)
        .post(path)
        .send(body)
        .end((err, res) => {
          expect(res.status).to.equal(400);
          expect(res.body).to.have.property('error');
          expect(res.body.error).to.have.property('message');
          expect(res.body.error.message).to.include('The email or password that you entered is incorrect.');
          done();
        });
    });

    it('Should return a 400, password is missing', (done) => {
      const path = 'gateway/api/v1/login';
      const body = {
        email: config.username1,
        // password: config.password1
      };
      chai
        .request(config.server)
        .post(path)
        .send(body)
        .end((err, res) => {
          expect(res.status).to.equal(400);
          expect(res.body).to.have.property('error');
          expect(res.body.error).to.have.property('message');
          expect(res.body.error.message).to.include('The email or password that you entered is incorrect.');
          done();
        });
    });

    it('Should return a 400, invalid field names', (done) => {
      const path = 'gateway/api/v1/login';
      const body = {
        email: config.username1,
        password: config.password1,
        is_admin: true,
        is_sso: true,
        role: 'admin',
      };
      chai
        .request(config.server)
        .post(path)
        .send(body)
        .end((err, res) => {
          expect(res.status).to.equal(400);
          expect(res.body).to.have.property('error');
          expect(res.body.error).to.have.property('message');
          expect(res.body.error.message).to.include('Unexpected fields in request body: is_admin,is_sso,role');
          done();
        });
    });
  });

  describe('Valid Login', () => {
    it('Should return a 200, valid user (tenant1)', (done) => {
      const path = 'gateway/api/v1/login';
      const body = {
        email: config.username1,
        password: config.password1,
      };
      chai
        .request(config.server)
        .post(path)
        .send(body)
        .end((err, res) => {
          if (err) throw err;
          expect(res.status).to.equal(200);
          expect(res.body).to.have.property('access_token');
          expect(res.body.access_token).to.not.be.empty;
          config.token1 = res.body.access_token;
          done();
        });
    });

    it('Should return a 200, valid user (5102)', (done) => {
      const path = 'gateway/api/v1/login';
      const body = {
        email: config.username2,
        password: config.password2,
      };
      chai
        .request(config.server)
        .post(path)
        .send(body)
        .end((err, res) => {
          if (err) throw err;
          expect(res.status).to.equal(200);
          expect(res.body).to.have.property('access_token');
          expect(res.body.access_token).to.not.be.empty;
          config.token2 = res.body.access_token;
          done();
        });
    });
  });

  describe('POST valid consent (generic)', function postTest() {
    this.timeout(10000);
    const path = 'gateway/api/v1/register-consent';

    let consentData = {};

    beforeEach(() => {
      consentData = {
        ServiceID: 'service1',
        TenantID: config.tenant1ID,
        DatatypeIDs: datatype1IDs,
        ConsentOption: consentOptionWrite,
      };
    });

    it('should return 200 on success, consent data submitted, patient1 / datatype1 / write', (done) => {
      consentData.PatientID = patient1ID;

      chai
        .request(config.server)
        .post(path)
        .send(consentData)
        .set({ Authorization: `Bearer ${config.token1}` })
        .end((err, res) => {
          expect(res.status).to.equal(200);
          expect(res.body).to.have.property('message');
          expect(res.body.message).to.equal('Successful request');
          done();
        });
    });

    it('should return 200 on success, consent data submitted, patient2 / datatype2 / read', (done) => {
      consentData.PatientID = patient2ID;
      consentData.ServiceID = 'service2';
      consentData.DatatypeIDs = datatype2IDs;
      consentData.ConsentOption = consentOptionRead;

      chai
        .request(config.server)
        .post(path)
        .send(consentData)
        .set({ Authorization: `Bearer ${config.token1}` })
        .end((err, res) => {
          expect(res.status).to.equal(200);
          expect(res.body).to.have.property('message');
          expect(res.body.message).to.equal('Successful request');
          done();
        });
    });

    it('should return 200 on success, consent data submitted, patient3 / read+write', (done) => {
      consentData.PatientID = patient3ID;
      consentData.ServiceID = 'service3';
      consentData.ConsentOption = consentOptionWriteRead;

      chai
        .request(config.server)
        .post(path)
        .send(consentData)
        .set({ Authorization: `Bearer ${config.token1}` })
        .end((err, res) => {
          expect(res.status).to.equal(200);
          expect(res.body).to.have.property('message');
          expect(res.body.message).to.equal('Successful request');
          done();
        });
    });

    it('should return 200 on success, consent data submitted, patient4 / datatype3 / read+write', (done) => {
      consentData.PatientID = patient4ID;
      consentData.ServiceID = 'service4';
      consentData.DatatypeIDs = datatype3IDs;
      consentData.ConsentOption = consentOptionWriteRead;

      chai
        .request(config.server)
        .post(path)
        .send(consentData)
        .set({ Authorization: `Bearer ${config.token1}` })
        .end((err, res) => {
          expect(res.status).to.equal(200);
          expect(res.body).to.have.property('message');
          expect(res.body.message).to.equal('Successful request');
          done();
        });
    });

    it('should return 200 on success, consent data submitted, patient5 / datatype3 / read+write / creation', (done) => {
      consentData.PatientID = patient5ID;
      consentData.ServiceID = 'service5';
      consentData.DatatypeIDs = datatype3IDs;
      consentData.ConsentOption = consentOptionWriteRead;
      consentData.Creation = creation;

      chai
        .request(config.server)
        .post(path)
        .send(consentData)
        .set({ Authorization: `Bearer ${config.token1}` })
        .end((err, res) => {
          expect(res.status).to.equal(200);
          expect(res.body).to.have.property('message');
          expect(res.body.message).to.equal('Successful request');
          done();
        });
    });

    it('should return 200 on success, consent data submitted, patient6 / tenant2', (done) => {
      consentData.PatientID = patient6ID;
      consentData.TenantID = config.tenant2ID;
      consentData.ServiceID = 'service6';

      chai
        .request(config.server)
        .post(path)
        .send(consentData)
        .set({ Authorization: `Bearer ${config.token1}` })
        .end((err, res) => {
          expect(res.status).to.equal(200);
          expect(res.body).to.have.property('message');
          expect(res.body.message).to.equal('Successful request');
          done();
        });
    });
  });

  describe('POST valid consent (FHIR)', function postTestFHIR() {
    this.timeout(10000);
    const path = 'gateway/api/v1/register-consent';

    let consentData = {};

    beforeEach(() => {
      consentData = {
        TenantID: config.tenant1ID,
        DatatypeIDs: datatype1IDs,
        Creation: creation,
        FHIRResourceID: fhirResourceID,
        FHIRResourceVersion: fhirResourceVersion,
        FHIRPolicy: fhirPolicy,
        FHIRStatus: fhirStatus,
        FHIRProvisionType: fhirProvisionType,
        FHIRProvisionAction: fhirProvisionAction,
        FHIRPerformerIDSystem: fhirPerformerIDSystem,
        FHIRPerformerIDValue: fhirPerformerIDValue,
        FHIRPerformerDisplay: fhirPerformerDisplay,
        FHIRRecipientIDSystem: fhirRecipientIDSystem,
        FHIRRecipientIDValue: fhirRecipientIDValue,
        FHIRRecipientDisplay: fhirRecipientDisplay,
      };
    });

    it('should return 200 on success, consent data submitted, patient7 (fhir)', (done) => {
      consentData.PatientID = patient7ID;
      chai
        .request(config.server)
        .post(path)
        .send(consentData)
        .set({ Authorization: `Bearer ${config.token1}` })
        .end((err, res) => {
          expect(res.status).to.equal(200);
          expect(res.body).to.have.property('message');
          expect(res.body.message).to.equal('Successful request');
          done();
        });
    });

    it('should return 200 on success, consent data submitted, patient8, no policy (fhir)', (done) => {
      consentData.PatientID = patient8ID;
      delete consentData.FHIRPolicy;

      chai
        .request(config.server)
        .post(path)
        .send(consentData)
        .set({ Authorization: `Bearer ${config.token1}` })
        .end((err, res) => {
          expect(res.status).to.equal(200);
          expect(res.body).to.have.property('message');
          expect(res.body.message).to.equal('Successful request');
          done();
        });
    });
  });

  describe('POST valid consent (FHIR, multiple consents per patient)', function postTestFHIR() {
    this.timeout(10000);
    const path = 'gateway/api/v1/register-consent';

    let consentData = {};

    beforeEach(() => {
      consentData = {
        TenantID: config.tenant1ID,
        DatatypeIDs: datatype1IDs,
        Creation: creation,
        FHIRResourceID: fhirResourceID,
        FHIRResourceVersion: fhirResourceVersion,
        FHIRPolicy: fhirPolicy,
        FHIRStatus: fhirStatus,
        FHIRProvisionType: fhirProvisionType,
        FHIRProvisionAction: fhirProvisionAction,
        FHIRPerformerIDSystem: fhirPerformerIDSystem,
        FHIRPerformerIDValue: fhirPerformerIDValue,
        FHIRPerformerDisplay: fhirPerformerDisplay,
        FHIRRecipientIDSystem: fhirRecipientIDSystem,
        FHIRRecipientIDValue: fhirRecipientIDValue,
        FHIRRecipientDisplay: fhirRecipientDisplay,
      };
    });

    it('should return 200 on success, consent data submitted, patient9 (fhir)', (done) => {
      consentData.PatientID = patient9ID;

      chai
        .request(config.server)
        .post(path)
        .send(consentData)
        .set({ Authorization: `Bearer ${config.token1}` })
        .end((err, res) => {
          expect(res.status).to.equal(200);
          expect(res.body).to.have.property('message');
          expect(res.body.message).to.equal('Successful request');
          done();
        });
    });

    it('should return 200 on success, consent data submitted, patient9 (fhir)', (done) => {
      consentData.PatientID = patient9ID;

      chai
        .request(config.server)
        .post(path)
        .send(consentData)
        .set({ Authorization: `Bearer ${config.token1}` })
        .end((err, res) => {
          expect(res.status).to.equal(200);
          expect(res.body).to.have.property('message');
          expect(res.body.message).to.equal('Successful request');
          done();
        });
    });

    it('should return 200 on success, consent data submitted, patient9 (fhir)', (done) => {
      consentData.PatientID = patient9ID;

      chai
        .request(config.server)
        .post(path)
        .send(consentData)
        .set({ Authorization: `Bearer ${config.token1}` })
        .end((err, res) => {
          expect(res.status).to.equal(200);
          expect(res.body).to.have.property('message');
          expect(res.body.message).to.equal('Successful request');
          done();
        });
    });

    it('should return 200 on success, consent data submitted, patient9 (fhir)', (done) => {
      consentData.PatientID = patient9ID;

      chai
        .request(config.server)
        .post(path)
        .send(consentData)
        .set({ Authorization: `Bearer ${config.token1}` })
        .end((err, res) => {
          expect(res.status).to.equal(200);
          expect(res.body).to.have.property('message');
          expect(res.body.message).to.equal('Successful request');
          done();
        });
    });

    it('should return 200 on success, consent data submitted, patient9 (fhir)', (done) => {
      consentData.PatientID = patient9ID;

      chai
        .request(config.server)
        .post(path)
        .send(consentData)
        .set({ Authorization: `Bearer ${config.token1}` })
        .end((err, res) => {
          expect(res.status).to.equal(200);
          expect(res.body).to.have.property('message');
          expect(res.body.message).to.equal('Successful request');
          done();
        });
    });

    it('should return 200 on success, consent data submitted, patient9 (fhir)', (done) => {
      consentData.PatientID = patient9ID;

      chai
        .request(config.server)
        .post(path)
        .send(consentData)
        .set({ Authorization: `Bearer ${config.token1}` })
        .end((err, res) => {
          expect(res.status).to.equal(200);
          expect(res.body).to.have.property('message');
          expect(res.body.message).to.equal('Successful request');
          done();
        });
    });

    it('should return 200 on success, consent data submitted, patient9 (fhir)', (done) => {
      consentData.PatientID = patient9ID;

      chai
        .request(config.server)
        .post(path)
        .send(consentData)
        .set({ Authorization: `Bearer ${config.token1}` })
        .end((err, res) => {
          expect(res.status).to.equal(200);
          expect(res.body).to.have.property('message');
          expect(res.body.message).to.equal('Successful request');
          done();
        });
    });

    it('should return 200 on success, consent data submitted, patient9 (fhir)', (done) => {
      consentData.PatientID = patient9ID;

      chai
        .request(config.server)
        .post(path)
        .send(consentData)
        .set({ Authorization: `Bearer ${config.token1}` })
        .end((err, res) => {
          expect(res.status).to.equal(200);
          expect(res.body).to.have.property('message');
          expect(res.body.message).to.equal('Successful request');
          done();
        });
    });

    it('should return 200 on success, consent data submitted, patient9 (fhir)', (done) => {
      consentData.PatientID = patient9ID;

      chai
        .request(config.server)
        .post(path)
        .send(consentData)
        .set({ Authorization: `Bearer ${config.token1}` })
        .end((err, res) => {
          expect(res.status).to.equal(200);
          expect(res.body).to.have.property('message');
          expect(res.body.message).to.equal('Successful request');
          done();
        });
    });

    it('should return 200 on success, consent data submitted, patient9 (fhir)', (done) => {
      consentData.PatientID = patient9ID;

      chai
        .request(config.server)
        .post(path)
        .send(consentData)
        .set({ Authorization: `Bearer ${config.token1}` })
        .end((err, res) => {
          expect(res.status).to.equal(200);
          expect(res.body).to.have.property('message');
          expect(res.body.message).to.equal('Successful request');
          done();
        });
    });

    it('should return 200 on success, consent data submitted, patient9 (fhir)', (done) => {
      consentData.PatientID = patient9ID;

      chai
        .request(config.server)
        .post(path)
        .send(consentData)
        .set({ Authorization: `Bearer ${config.token1}` })
        .end((err, res) => {
          expect(res.status).to.equal(200);
          expect(res.body).to.have.property('message');
          expect(res.body.message).to.equal('Successful request');
          done();
        });
    });

    it('should return 200 on success, consent data submitted, patient9 (fhir)', (done) => {
      consentData.PatientID = patient9ID;

      chai
        .request(config.server)
        .post(path)
        .send(consentData)
        .set({ Authorization: `Bearer ${config.token1}` })
        .end((err, res) => {
          expect(res.status).to.equal(200);
          expect(res.body).to.have.property('message');
          expect(res.body.message).to.equal('Successful request');
          done();
        });
    });

    it('should return 200 on success, consent data submitted, patient9 (fhir)', (done) => {
      consentData.PatientID = patient9ID;

      chai
        .request(config.server)
        .post(path)
        .send(consentData)
        .set({ Authorization: `Bearer ${config.token1}` })
        .end((err, res) => {
          expect(res.status).to.equal(200);
          expect(res.body).to.have.property('message');
          expect(res.body.message).to.equal('Successful request');
          done();
        });
    });

    it('should return 200 on success, consent data submitted, patient9 (fhir)', (done) => {
      consentData.PatientID = patient9ID;

      chai
        .request(config.server)
        .post(path)
        .send(consentData)
        .set({ Authorization: `Bearer ${config.token1}` })
        .end((err, res) => {
          expect(res.status).to.equal(200);
          expect(res.body).to.have.property('message');
          expect(res.body.message).to.equal('Successful request');
          done();
        });
    });
  });

  describe('POST invalid consent (generic)', function postTest() {
    this.timeout(80000);
    const path = 'gateway/api/v1/register-consent';

    let consentData = {};

    beforeEach(() => {
      consentData = {
        PatientID: patient1ID,
        ServiceID: 'service1',
        TenantID: config.tenant1ID,
        FHIRPolicy: fhirPolicy,
        DatatypeIDs: datatype1IDs,
        ConsentOption: consentOptionWrite,
      };
    });

    it('should return 400 on failure, empty object data', (done) => {
      const invalidInputData = {};

      chai
        .request(config.server)
        .post(path)
        .send(invalidInputData)
        .set({ Authorization: `Bearer ${config.token1}` })
        .end((err, res) => {
          expect(res.status).to.equal(400);
          expect(res.body).to.have.property('msg');
          expect(res.body.msg).to.equal('Invalid data: missing required fields');
          done();
        });
    });

    it('should return 400 on failure, missing PatientID', (done) => {
      delete consentData.PatientID;

      chai
        .request(config.server)
        .post(path)
        .send(consentData)
        .set({ Authorization: `Bearer ${config.token1}` })
        .end((err, res) => {
          expect(res.status).to.equal(400);
          expect(res.body).to.have.property('msg');
          expect(res.body.msg).to.equal('Invalid data: missing required fields');
          done();
        });
    });

    it('should return 400 on failure, empty PatientID', (done) => {
      consentData.PatientID = '';

      chai
        .request(config.server)
        .post(path)
        .send(consentData)
        .set({ Authorization: `Bearer ${config.token1}` })
        .end((err, res) => {
          expect(res.status).to.equal(400);
          expect(res.body).to.have.property('msg');
          expect(res.body.msg).to.equal('Invalid data: PatientID must not be empty');
          done();
        });
    });

    it('should return 400 on failure, invalid PatientID', (done) => {
      consentData.PatientID = ['invalid'];

      chai
        .request(config.server)
        .post(path)
        .send(consentData)
        .set({ Authorization: `Bearer ${config.token1}` })
        .end((err, res) => {
          expect(res.status).to.equal(400);
          expect(res.body).to.have.property('msg');
          expect(res.body.msg).to.equal('Invalid data: PatientID must be string');
          done();
        });
    });

    it('should return 400 on failure, invalid ServiceID', (done) => {
      consentData.ServiceID = ['invalid'];

      chai
        .request(config.server)
        .post(path)
        .send(consentData)
        .set({ Authorization: `Bearer ${config.token1}` })
        .end((err, res) => {
          expect(res.status).to.equal(400);
          expect(res.body).to.have.property('msg');
          expect(res.body.msg).to.equal('Invalid data: ServiceID must be string');
          done();
        });
    });

    it('should return 400 on failure, missing TenantID', (done) => {
      delete consentData.TenantID;

      chai
        .request(config.server)
        .post(path)
        .send(consentData)
        .set({ Authorization: `Bearer ${config.token1}` })
        .end((err, res) => {
          expect(res.status).to.equal(400);
          expect(res.body).to.have.property('msg');
          expect(res.body.msg).to.equal('Invalid data: missing required fields');
          done();
        });
    });

    it('should return 400 on failure, empty TenantID', (done) => {
      consentData.TenantID = '';

      chai
        .request(config.server)
        .post(path)
        .send(consentData)
        .set({ Authorization: `Bearer ${config.token1}` })
        .end((err, res) => {
          expect(res.status).to.equal(400);
          expect(res.body).to.have.property('msg');
          expect(res.body.msg).to.equal('Invalid data: TenantID must not be empty');
          done();
        });
    });

    it('should return 400 on failure, invalid TenantID', (done) => {
      consentData.TenantID = ['invalid'];

      chai
        .request(config.server)
        .post(path)
        .send(consentData)
        .set({ Authorization: `Bearer ${config.token1}` })
        .end((err, res) => {
          expect(res.status).to.equal(400);
          expect(res.body).to.have.property('msg');
          expect(res.body.msg).to.equal('Invalid data: TenantID must be string');
          done();
        });
    });

    it('should return 400 on failure, DatatypeIDs is missing', (done) => {
      delete consentData.DatatypeIDs;

      chai
        .request(config.server)
        .post(path)
        .send(consentData)
        .set({ Authorization: `Bearer ${config.token1}` })
        .end((err, res) => {
          expect(res.status).to.equal(400);
          expect(res.body).to.have.property('msg');
          expect(res.body.msg).to.equal('Invalid data: missing required fields');
          done();
        });
    });

    it('should return 400 on failure, DatatypeIDs not array', (done) => {
      consentData.DatatypeIDs = 'invalid';

      chai
        .request(config.server)
        .post(path)
        .send(consentData)
        .set({ Authorization: `Bearer ${config.token1}` })
        .end((err, res) => {
          expect(res.status).to.equal(400);
          expect(res.body).to.have.property('msg');
          expect(res.body.msg).to.equal('Invalid data: DatatypeIDs must be array');
          done();
        });
    });

    it('should return 400 on failure, empty DatatypeIDs', (done) => {
      consentData.DatatypeIDs = [];

      chai
        .request(config.server)
        .post(path)
        .send(consentData)
        .set({ Authorization: `Bearer ${config.token1}` })
        .end((err, res) => {
          expect(res.status).to.equal(400);
          expect(res.body).to.have.property('msg');
          expect(res.body.msg).to.equal('Invalid data: DatatypeIDs must not be empty');
          done();
        });
    });

    it('should return 400 on failure, missing ConsentOption', (done) => {
      delete consentData.ConsentOption;

      chai
        .request(config.server)
        .post(path)
        .send(consentData)
        .set({ Authorization: `Bearer ${config.token1}` })
        .end((err, res) => {
          expect(res.status).to.equal(400);
          expect(res.body).to.have.property('msg');
          expect(res.body.msg).to.equal('Invalid data: must specify at least one consent option');
          done();
        });
    });

    it('should return 400 on failure, ConsentOption not array', (done) => {
      consentData.ConsentOption = 'invalid';

      chai
        .request(config.server)
        .post(path)
        .send(consentData)
        .set({ Authorization: `Bearer ${config.token1}` })
        .end((err, res) => {
          expect(res.status).to.equal(400);
          expect(res.body).to.have.property('msg');
          expect(res.body.msg).to.equal('Invalid data: ConsentOption must be array'); // Actual: Invalid data: too many consent options
          done();
        });
    });

    it('should return 400 on failure, empty ConsentOption', (done) => {
      consentData.ConsentOption = [];

      chai
        .request(config.server)
        .post(path)
        .send(consentData)
        .set({ Authorization: `Bearer ${config.token1}` })
        .end((err, res) => {
          expect(res.status).to.equal(400);
          expect(res.body).to.have.property('msg');
          expect(res.body.msg).to.equal('Invalid data: must specify at least one consent option');
          done();
        });
    });

    it('should return 400 on failure, invalid ConsentOption', (done) => {
      consentData.ConsentOption = ['invalid'];

      chai
        .request(config.server)
        .post(path)
        .send(consentData)
        .set({ Authorization: `Bearer ${config.token1}` })
        .end((err, res) => {
          expect(res.status).to.equal(400);
          expect(res.body).to.have.property('msg');
          expect(res.body.msg).to.equal('Invalid data: invalid consent option');
          done();
        });
    });

    it('should return 400 on failure, for one valid and one invalid ConsentOption', (done) => {
      consentData.ConsentOption = ['write', 2];

      chai
        .request(config.server)
        .post(path)
        .send(consentData)
        .set({ Authorization: `Bearer ${config.token1}` })
        .end((err, res) => {
          expect(res.status).to.equal(400);
          expect(res.body).to.have.property('msg');
          expect(res.body.msg).to.equal('Invalid data: invalid consent option');
          done();
        });
      });

    it('should return 400 on failure, deny should not be paired with other options', (done) => {
      consentData.ConsentOption = consentOptionWriteDeny;

      chai
        .request(config.server)
        .post(path)
        .send(consentData)
        .set({ Authorization: `Bearer ${config.token1}` })
        .end((err, res) => {
          expect(res.status).to.equal(400);
          expect(res.body).to.have.property('msg');
          expect(res.body.msg).to.equal('Invalid data: deny cannot be paired with another consent option');
          done();
        });
    });

    it('should return 400 on failure, invalid number of ConsentOption', (done) => {
      consentData.ConsentOption = ['write', 'read', 'write'];

      chai
        .request(config.server)
        .post(path)
        .send(consentData)
        .set({ Authorization: `Bearer ${config.token1}` })
        .end((err, res) => {
          expect(res.status).to.equal(400);
          expect(res.body).to.have.property('msg');
          expect(res.body.msg).to.equal('Invalid data: too many consent options');
          done();
        });
    });

    it('should return 400 on failure, Creation has invalid format', (done) => {
      consentData.Creation = '2021-10-05T1';

      chai
        .request(config.server)
        .post(path)
        .send(consentData)
        .set({ Authorization: `Bearer ${config.token1}` })
        .end((err, res) => {
          expect(res.status).to.equal(400);
          expect(res.body).to.have.property('msg');
          expect(res.body.msg).to.equal('Invalid data: Creation has invalid format (timestamp check), expected format: YYYY-MM-DDThh:mm:ss.sss+zz:zz ');
          done();
        });
    });

    it('should return 400 on failure, Creation has invalid format', (done) => {
      consentData.Creation = '05 October 2011 14:48 UTC';

      chai
        .request(config.server)
        .post(path)
        .send(consentData)
        .set({ Authorization: `Bearer ${config.token1}` })
        .end((err, res) => {
          expect(res.status).to.equal(400);
          expect(res.body).to.have.property('msg');
          expect(res.body.msg).to.equal('Invalid data: Creation has invalid format (string check), expected format: YYYY-MM-DDThh:mm:ss.sss+zz:zz ');
          done();
        });
    });
  });

  describe('POST invalid consent (FHIR)', () => {
    const path = 'gateway/api/v1/register-consent';

    let consentData = {};

    beforeEach(() => {
      consentData = {
        PatientID: patient1ID,
        TenantID: config.tenant1ID,
        DatatypeIDs: datatype1IDs,
        FHIRResourceID: fhirResourceID,
        FHIRResourceVersion: fhirResourceVersion,
        FHIRPolicy: fhirPolicy,
        FHIRStatus: fhirStatus,
        FHIRProvisionType: fhirProvisionType,
        FHIRProvisionAction: fhirProvisionAction,
        FHIRPerformerIDSystem: fhirPerformerIDSystem,
        FHIRPerformerIDValue: fhirPerformerIDValue,
        FHIRPerformerDisplay: fhirPerformerDisplay,
        FHIRRecipientIDSystem: fhirRecipientIDSystem,
        FHIRRecipientIDValue: fhirRecipientIDValue,
        FHIRRecipientDisplay: fhirRecipientDisplay,
        Creation: creation,
      };
    });

    it('should return 400 on failure, empty FHIRResourceID', (done) => {
      consentData.FHIRResourceID = '';

      chai
        .request(config.server)
        .post(path)
        .send(consentData)
        .set({ Authorization: `Bearer ${config.token1}` })
        .end((err, res) => {
          expect(res.status).to.equal(400);
          expect(res.body).to.have.property('msg');
          expect(res.body.msg).to.equal('Invalid data: FHIRResourceID must not be empty');
          done();
        });
    });

    it('should return 400 on failure, invalid FHIRResourceID', (done) => {
      consentData.FHIRResourceID = ['invalid'];

      chai
        .request(config.server)
        .post(path)
        .send(consentData)
        .set({ Authorization: `Bearer ${config.token1}` })
        .end((err, res) => {
          expect(res.status).to.equal(400);
          expect(res.body).to.have.property('msg');
          expect(res.body.msg).to.equal('Invalid data: FHIRResourceID must be string');
          done();
        });
    });

    it('should return 400 on failure, empty FHIRResourceVersion', (done) => {
      consentData.FHIRResourceVersion = '';

      chai
        .request(config.server)
        .post(path)
        .send(consentData)
        .set({ Authorization: `Bearer ${config.token1}` })
        .end((err, res) => {
          expect(res.status).to.equal(400);
          expect(res.body).to.have.property('msg');
          expect(res.body.msg).to.equal('Invalid data: FHIRResourceVersion must not be empty');
          done();
        });
    });

    it('should return 400 on failure, invalid FHIRResourceVersion', (done) => {
      consentData.FHIRResourceVersion = ['invalid'];

      chai
        .request(config.server)
        .post(path)
        .send(consentData)
        .set({ Authorization: `Bearer ${config.token1}` })
        .end((err, res) => {
          expect(res.status).to.equal(400);
          expect(res.body).to.have.property('msg');
          expect(res.body.msg).to.equal('Invalid data: FHIRResourceVersion must be string');
          done();
        });
    });

    it('should return 400 on failure, empty FHIRPolicy', (done) => {
      consentData.FHIRPolicy = '';

      chai
        .request(config.server)
        .post(path)
        .send(consentData)
        .set({ Authorization: `Bearer ${config.token1}` })
        .end((err, res) => {
          expect(res.status).to.equal(400);
          expect(res.body).to.have.property('msg');
          expect(res.body.msg).to.equal('Invalid data: FHIRPolicy must not be empty');
          done();
        });
    });

    it('should return 400 on failure, invalid FHIRPolicy', (done) => {
      consentData.FHIRPolicy = ['invalid'];

      chai
        .request(config.server)
        .post(path)
        .send(consentData)
        .set({ Authorization: `Bearer ${config.token1}` })
        .end((err, res) => {
          expect(res.status).to.equal(400);
          expect(res.body).to.have.property('msg');
          expect(res.body.msg).to.equal('Invalid data: FHIRPolicy must be string');
          done();
        });
    });

    it('should return 400 on failure, empty FHIRStatus', (done) => {
      consentData.FHIRStatus = '';

      chai
        .request(config.server)
        .post(path)
        .send(consentData)
        .set({ Authorization: `Bearer ${config.token1}` })
        .end((err, res) => {
          expect(res.status).to.equal(400);
          expect(res.body).to.have.property('msg');
          expect(res.body.msg).to.equal('Invalid data: FHIRStatus must not be empty');
          done();
        });
    });

    it('should return 400 on failure, invalid FHIRStatus', (done) => {
      consentData.FHIRStatus = ['invalid'];

      chai
        .request(config.server)
        .post(path)
        .send(consentData)
        .set({ Authorization: `Bearer ${config.token1}` })
        .end((err, res) => {
          expect(res.status).to.equal(400);
          expect(res.body).to.have.property('msg');
          expect(res.body.msg).to.equal('Invalid data: FHIRStatus must be string');
          done();
        });
    });

    it('should return 400 on failure, empty FHIRProvisionType', (done) => {
      consentData.FHIRProvisionType = '';

      chai
        .request(config.server)
        .post(path)
        .send(consentData)
        .set({ Authorization: `Bearer ${config.token1}` })
        .end((err, res) => {
          expect(res.status).to.equal(400);
          expect(res.body).to.have.property('msg');
          expect(res.body.msg).to.equal('Invalid data: FHIRProvisionType must not be empty');
          done();
        });
    });

    it('should return 400 on failure, invalid FHIRProvisionType', (done) => {
      consentData.FHIRProvisionType = ['invalid'];

      chai
        .request(config.server)
        .post(path)
        .send(consentData)
        .set({ Authorization: `Bearer ${config.token1}` })
        .end((err, res) => {
          expect(res.status).to.equal(400);
          expect(res.body).to.have.property('msg');
          expect(res.body.msg).to.equal('Invalid data: FHIRProvisionType must be string');
          done();
        });
    });

    it('should return 400 on failure, empty FHIRProvisionAction', (done) => {
      consentData.FHIRProvisionAction = '';

      chai
        .request(config.server)
        .post(path)
        .send(consentData)
        .set({ Authorization: `Bearer ${config.token1}` })
        .end((err, res) => {
          expect(res.status).to.equal(400);
          expect(res.body).to.have.property('msg');
          expect(res.body.msg).to.equal('Invalid data: FHIRProvisionAction must not be empty');
          done();
        });
    });

    it('should return 400 on failure, invalid FHIRProvisionAction', (done) => {
      consentData.FHIRProvisionAction = ['invalid'];

      chai
        .request(config.server)
        .post(path)
        .send(consentData)
        .set({ Authorization: `Bearer ${config.token1}` })
        .end((err, res) => {
          expect(res.status).to.equal(400);
          expect(res.body).to.have.property('msg');
          expect(res.body.msg).to.equal('Invalid data: FHIRProvisionAction must be string');
          done();
        });
    });

    it('should return 400 on failure, empty FHIRPerformerIDSystem', (done) => {
      consentData.FHIRPerformerIDSystem = '';

      chai
        .request(config.server)
        .post(path)
        .send(consentData)
        .set({ Authorization: `Bearer ${config.token1}` })
        .end((err, res) => {
          expect(res.status).to.equal(400);
          expect(res.body).to.have.property('msg');
          expect(res.body.msg).to.equal('Invalid data: FHIRPerformerIDSystem must not be empty');
          done();
        });
    });

    it('should return 400 on failure, invalid FHIRPerformerIDSystem', (done) => {
      consentData.FHIRPerformerIDSystem = ['invalid'];

      chai
        .request(config.server)
        .post(path)
        .send(consentData)
        .set({ Authorization: `Bearer ${config.token1}` })
        .end((err, res) => {
          expect(res.status).to.equal(400);
          expect(res.body).to.have.property('msg');
          expect(res.body.msg).to.equal('Invalid data: FHIRPerformerIDSystem must be string');
          done();
        });
    });

    it('should return 400 on failure, empty FHIRPerformerIDValue', (done) => {
      consentData.FHIRPerformerIDValue = '';

      chai
        .request(config.server)
        .post(path)
        .send(consentData)
        .set({ Authorization: `Bearer ${config.token1}` })
        .end((err, res) => {
          expect(res.status).to.equal(400);
          expect(res.body).to.have.property('msg');
          expect(res.body.msg).to.equal('Invalid data: FHIRPerformerIDValue must not be empty');
          done();
        });
    });

    it('should return 400 on failure, invalid FHIRPerformerIDValue', (done) => {
      consentData.FHIRPerformerIDValue = ['invalid'];

      chai
        .request(config.server)
        .post(path)
        .send(consentData)
        .set({ Authorization: `Bearer ${config.token1}` })
        .end((err, res) => {
          expect(res.status).to.equal(400);
          expect(res.body).to.have.property('msg');
          expect(res.body.msg).to.equal('Invalid data: FHIRPerformerIDValue must be string');
          done();
        });
    });

    it('should return 400 on failure, empty FHIRPerformerDisplay', (done) => {
      consentData.FHIRPerformerDisplay = '';

      chai
        .request(config.server)
        .post(path)
        .send(consentData)
        .set({ Authorization: `Bearer ${config.token1}` })
        .end((err, res) => {
          expect(res.status).to.equal(400);
          expect(res.body).to.have.property('msg');
          expect(res.body.msg).to.equal('Invalid data: FHIRPerformerDisplay must not be empty');
          done();
        });
    });

    it('should return 400 on failure, invalid FHIRPerformerDisplay', (done) => {
      consentData.FHIRPerformerDisplay = ['invalid'];

      chai
        .request(config.server)
        .post(path)
        .send(consentData)
        .set({ Authorization: `Bearer ${config.token1}` })
        .end((err, res) => {
          expect(res.status).to.equal(400);
          expect(res.body).to.have.property('msg');
          expect(res.body.msg).to.equal('Invalid data: FHIRPerformerDisplay must be string');
          done();
        });
    });

    it('should return 400 on failure, empty FHIRRecipientIDSystem', (done) => {
      consentData.FHIRRecipientIDSystem = '';

      chai
        .request(config.server)
        .post(path)
        .send(consentData)
        .set({ Authorization: `Bearer ${config.token1}` })
        .end((err, res) => {
          expect(res.status).to.equal(400);
          expect(res.body).to.have.property('msg');
          expect(res.body.msg).to.equal('Invalid data: FHIRRecipientIDSystem must not be empty');
          done();
        });
    });

    it('should return 400 on failure, invalid FHIRRecipientIDSystem', (done) => {
      consentData.FHIRRecipientIDSystem = ['invalid'];

      chai
        .request(config.server)
        .post(path)
        .send(consentData)
        .set({ Authorization: `Bearer ${config.token1}` })
        .end((err, res) => {
          expect(res.status).to.equal(400);
          expect(res.body).to.have.property('msg');
          expect(res.body.msg).to.equal('Invalid data: FHIRRecipientIDSystem must be string');
          done();
        });
    });

    it('should return 400 on failure, empty FHIRRecipientIDValue', (done) => {
      consentData.FHIRRecipientIDValue = '';

      chai
        .request(config.server)
        .post(path)
        .send(consentData)
        .set({ Authorization: `Bearer ${config.token1}` })
        .end((err, res) => {
          expect(res.status).to.equal(400);
          expect(res.body).to.have.property('msg');
          expect(res.body.msg).to.equal('Invalid data: FHIRRecipientIDValue must not be empty');
          done();
        });
    });

    it('should return 400 on failure, invalid FHIRRecipientIDValue', (done) => {
      consentData.FHIRRecipientIDValue = ['invalid'];

      chai
        .request(config.server)
        .post(path)
        .send(consentData)
        .set({ Authorization: `Bearer ${config.token1}` })
        .end((err, res) => {
          expect(res.status).to.equal(400);
          expect(res.body).to.have.property('msg');
          expect(res.body.msg).to.equal('Invalid data: FHIRRecipientIDValue must be string');
          done();
        });
    });

    it('should return 400 on failure, empty FHIRRecipientDisplay', (done) => {
      consentData.FHIRRecipientDisplay = '';

      chai
        .request(config.server)
        .post(path)
        .send(consentData)
        .set({ Authorization: `Bearer ${config.token1}` })
        .end((err, res) => {
          expect(res.status).to.equal(400);
          expect(res.body).to.have.property('msg');
          expect(res.body.msg).to.equal('Invalid data: FHIRRecipientDisplay must not be empty');
          done();
        });
    });

    it('should return 400 on failure, invalid FHIRRecipientDisplay', (done) => {
      consentData.FHIRRecipientDisplay = ['invalid'];

      chai
        .request(config.server)
        .post(path)
        .send(consentData)
        .set({ Authorization: `Bearer ${config.token1}` })
        .end((err, res) => {
          expect(res.status).to.equal(400);
          expect(res.body).to.have.property('msg');
          expect(res.body.msg).to.equal('Invalid data: FHIRRecipientDisplay must be string');
          done();
        });
    });
  });
  describe('GET query consents by patientID', function queryTest() {
    this.timeout(120000);
    const path = 'simple-consent/api/v1/consent/query';

    it('should return 200 on success and empty payload, invalid PatientID', (done) => {
      chai
        .request(config.serverSimpleConsent)
        .get(path)
        .set({ [patientIDHeader]: patient0ID })
        .set({ Authorization: `Bearer ${config.token1}` })
        .end((err, res) => {
          expect(res.status).to.equal(200);
          expect(res.body).to.have.property('msg');
          expect(res.body.msg).to.equal('GET /consent was successful');
          expect(res.body).to.have.property('payload');
          expect(res.body.payload).to.be.an('array');
          expect(res.body.payload).to.have.lengthOf(0);
          done();
        });
    });

    it('should return 200 on success, consent data queried - tenant1, patient1', (done) => {
      const servicePatientPair1 = {
        PatientID: patient1ID,
        ServiceID: 'service1',
        TenantID: config.tenant1ID,
        DatatypeIDs: datatype1IDs,
        ConsentOption: consentOptionWrite,
      };

      // sleep to allow all consents to be registered before querying
      setTimeout(() => {
        chai
          .request(config.serverSimpleConsent)
          .get(path)
          .set({ [patientIDHeader]: patient1ID })
          .set({ Authorization: `Bearer ${config.token1}` })
          .end((err, res) => {
            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('msg');
            expect(res.body.msg).to.equal('GET /consent was successful');
            expect(res.body).to.have.property('payload');
            expect(res.body.payload).to.be.an('array');
            expect(res.body.payload).to.not.be.empty;
            expect(res.body.payload).to.have.lengthOf(1);
            expect(res.body.payload).to.contain.something.like(servicePatientPair1);
            done();
          });
      }, 15000);
    });

    it('should return 200 on success, consent data queried - tenant1, patient2', (done) => {
      const servicePatientPair2 = {
        PatientID: patient2ID,
        ServiceID: 'service2',
        TenantID: config.tenant1ID,
        DatatypeIDs: datatype2IDs,
        ConsentOption: consentOptionRead,
      };

      // sleep to allow all consents to be registered before querying
      setTimeout(() => {
        chai
          .request(config.serverSimpleConsent)
          .get(path)
          .set({ [patientIDHeader]: patient2ID })
          .set({ Authorization: `Bearer ${config.token1}` })
          .end((err, res) => {
            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('msg');
            expect(res.body.msg).to.equal('GET /consent was successful');
            expect(res.body).to.have.property('payload');
            expect(res.body.payload).to.be.an('array');
            expect(res.body.payload).to.not.be.empty;
            expect(res.body.payload).to.have.lengthOf(1);
            expect(res.body.payload).to.contain.something.like(servicePatientPair2);
            done();
          });
      }, 500);
    });

    it('should return 200 on success, consent data queried - tenant1, patient3', (done) => {
      const servicePatientPair3 = {
        PatientID: patient3ID,
        ServiceID: 'service3',
        TenantID: config.tenant1ID,
        DatatypeIDs: datatype1IDs,
        ConsentOption: consentOptionWriteRead,
      };

      setTimeout(() => {
        chai
          .request(config.serverSimpleConsent)
          .get(path)
          .set({ [patientIDHeader]: patient3ID })
          .set({ Authorization: `Bearer ${config.token1}` })
          .end((err, res) => {
            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('msg');
            expect(res.body.msg).to.equal('GET /consent was successful');
            expect(res.body).to.have.property('payload');
            expect(res.body.payload).to.be.an('array');
            expect(res.body.payload).to.not.be.empty;
            expect(res.body.payload).to.have.lengthOf(1);
            expect(res.body.payload).to.contain.something.like(servicePatientPair3);
            done();
          });
      }, 500);
    });

    it('should return 200 on success, consent data queried - tenant1, patient4', (done) => {
      const servicePatientPair4 = {
        PatientID: patient4ID,
        ServiceID: 'service4',
        TenantID: config.tenant1ID,
        DatatypeIDs: datatype3IDs,
        ConsentOption: consentOptionWriteRead,
      };

      setTimeout(() => {
        chai
          .request(config.serverSimpleConsent)
          .get(path)
          .set({ [patientIDHeader]: patient4ID })
          .set({ Authorization: `Bearer ${config.token1}` })
          .end((err, res) => {
            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('msg');
            expect(res.body.msg).to.equal('GET /consent was successful');
            expect(res.body).to.have.property('payload');
            expect(res.body.payload).to.be.an('array');
            expect(res.body.payload).to.not.be.empty;
            expect(res.body.payload).to.have.lengthOf(1);
            expect(res.body.payload).to.contain.something.like(servicePatientPair4);
            done();
          });
      }, 500);
    });

    it('should return 200 on success, consent data queried - tenant1, patient5', (done) => {
      setTimeout(() => {
        chai
          .request(config.serverSimpleConsent)
          .get(path)
          .set({ [patientIDHeader]: patient5ID })
          .set({ Authorization: `Bearer ${config.token1}` })
          .end((err, res) => {
            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('msg');
            expect(res.body.msg).to.equal('GET /consent was successful');
            expect(res.body).to.have.property('payload');
            expect(res.body.payload).to.be.an('array');
            expect(res.body.payload).to.not.be.empty;
            expect(res.body.payload).to.have.lengthOf(1);
            done();
          });
      }, 500);
    });

    it('should return 200 on success, consent data queried - 5102, patient6', (done) => {
      setTimeout(() => {
        chai
          .request(config.serverSimpleConsent)
          .get(path)
          .set({ [patientIDHeader]: patient6ID })
          .set({ Authorization: `Bearer ${config.token2}` })
          .end((err, res) => {
            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('msg');
            expect(res.body.msg).to.equal('GET /consent was successful');
            expect(res.body).to.have.property('payload');
            expect(res.body.payload).to.be.an('array');
            expect(res.body.payload).to.not.be.empty;
            expect(res.body.payload).to.have.lengthOf(1);
            done();
          });
      }, 500);
    });

    it('should return 200 on success, consent data queried - tenant1, patient7', (done) => {
      setTimeout(() => {
        chai
          .request(config.serverSimpleConsent)
          .get(path)
          .set({ [patientIDHeader]: patient7ID })
          .set({ Authorization: `Bearer ${config.token1}` })
          .end((err, res) => {
            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('msg');
            expect(res.body.msg).to.equal('GET /consent was successful');
            expect(res.body).to.have.property('payload');
            expect(res.body.payload).to.be.an('array');
            expect(res.body.payload).to.not.be.empty;
            expect(res.body.payload).to.have.lengthOf(1);
            expect(res.body.payload[0].Creation).to.equal(1483228800000);
            done();
          });
      }, 500);
    });

    it('should return 200 on success, consent data queried - tenant1, patient8', (done) => {
      setTimeout(() => {
        chai
          .request(config.serverSimpleConsent)
          .get(path)
          .set({ [patientIDHeader]: patient8ID })
          .set({ Authorization: `Bearer ${config.token1}` })
          .end((err, res) => {
            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('msg');
            expect(res.body.msg).to.equal('GET /consent was successful');
            expect(res.body).to.have.property('payload');
            expect(res.body.payload).to.be.an('array');
            expect(res.body.payload).to.not.be.empty;
            expect(res.body.payload).to.have.lengthOf(1);
            done();
          });
      }, 500);
    });

    it('should return 200 on success, consent data queried - tenant1, patient9 (14 consents)', (done) => {
      setTimeout(() => {
        chai
          .request(config.serverSimpleConsent)
          .get(path)
          .set({ [patientIDHeader]: patient9ID })
          .set({ Authorization: `Bearer ${config.token1}` })
          .end((err, res) => {
            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('msg');
            expect(res.body.msg).to.equal('GET /consent was successful');
            expect(res.body).to.have.property('payload');
            expect(res.body.payload).to.be.an('array');
            expect(res.body.payload).to.not.be.empty;
            expect(res.body.payload).to.have.lengthOf(14);
            done();
          });
      }, 5000);
    });
  });
});
