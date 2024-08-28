'use strict';

var fs = require('fs'),
  should = require('should'),
  superagentDefaults = require('superagent-defaults'),
  supertest = require('supertest'),
  mongoose = require('mongoose'),
  _ = require('lodash'),
  Address4 = require('ip-address').Address4,
  Address6 = require('ip-address').Address6,
  History = require('../../../history/server/models/history.server.model').getSchema('documents'),
  Schema = mongoose.model('Schema'),
  Group = mongoose.model('Group'),
  User = mongoose.model('User'),
  Document = mongoose.model('Document'),
  Project = mongoose.model('Project'),
  Pod = mongoose.model('Pod'),
  Deployment = mongoose.model('Deployment'),
  Label = mongoose.model('Label'),
  express = require('../../../../config/lib/express');

var app,
  agent,
  nonAuthAgent,
  validSchema,
  schema,
  enmSedSchema,
  enmSedSchemaWithVnfKeys,
  enmSedSchemaGroupPolicy,
  vnfSedSchemaGroupPolicy,
  validEnmSedDocumentGroupPolicy,
  validVnfSedDocumentGroupPolicy,
  validEnmSedManagedConfig,
  vnfSedSchema,
  enmSedSchemaNonameservers,
  enmSedSchemaObject,
  enmSedSchemaObjectReturned,
  vnfSedSchemaObject,
  vnfSedSchemaObjectReturned,
  validDocument,
  validEnmSedDocument,
  validVnfSedDocument,
  document,
  documentResponse,
  validPod,
  podObject,
  podObjectReturned,
  validProject,
  projectObject,
  projectObjectReturned,
  validVnfDeployment,
  deploymentObject,
  count,
  vnflcmAutoPopulateContentValuesExpected,
  vnflcmAutoPopulateContentValuesExpectedUpdatedKeys,
  response,
  validUser,
  validUser2,
  validUser3,
  userObject,
  userObject2,
  userObject3,
  validGroup,
  groupObject;

const vnflcmAutoPopulateContentTemporaryValuesExpected = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/vnflcm_autopopulate_content_temporary_values_expected.json', 'utf8'));
const vnflcmAutoPopulateContentTemporaryValuesExpectedHaTrue = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/vnflcm_autopopulate_content_temporary_values_expected_hatrue.json', 'utf8'));

var nodeEnv = process.env.NODE_ENV;

describe('Documents VNF-LCM', function () {
  before(async function () {
    app = express.init(mongoose);
    nonAuthAgent = superagentDefaults(supertest(app));
    agent = superagentDefaults(supertest(app));
  });

  beforeEach(async function () {
    vnflcmAutoPopulateContentValuesExpected = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/vnflcm_autopopulate_content_values_expected.json', 'utf8'));
    vnflcmAutoPopulateContentValuesExpectedUpdatedKeys = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/vnflcm_autopopulate_content_values_expected_updated_keys.json', 'utf8'));
    validSchema = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/valid_schema.json', 'utf8'));
    validDocument = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/valid_document.json', 'utf8'));
    validEnmSedDocument = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/valid_enm_sed_document.json', 'utf8'));
    validVnfSedDocument = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/valid_vnf_sed_document.json', 'utf8'));
    validPod = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/valid_pod.json', 'utf8'));
    validVnfDeployment = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/valid_vnf_deployment.json', 'utf8'));
    validProject = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/valid_project.json', 'utf8'));
    enmSedSchema = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/enm_sed_schema.json', 'utf8'));
    enmSedSchemaWithVnfKeys = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/enm_sed_schema_with_all_vnf_keys.json', 'utf8'));
    enmSedSchemaNonameservers = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/enm_sed_schema_no_name_servers.json', 'utf8'));
    vnfSedSchema = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/vnf_sed_schema.json', 'utf8'));
    validUser = JSON.parse(fs.readFileSync('/opt/mean.js/modules/deployments/tests/server/test_files/valid_user.json', 'utf8'));
    validUser2 = JSON.parse(fs.readFileSync('/opt/mean.js/modules/deployments/tests/server/test_files/valid_user2.json', 'utf8'));
    validUser3 = JSON.parse(fs.readFileSync('/opt/mean.js/modules/deployments/tests/server/test_files/valid_user3.json', 'utf8'));
    enmSedSchemaGroupPolicy = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/enm_sed_schema_group_policy.json', 'utf8'));
    vnfSedSchemaGroupPolicy = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/vnf_sed_schema_group_policy.json', 'utf8'));
    validEnmSedDocumentGroupPolicy = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/valid_enm_sed_document_group_policy.json', 'utf8'));
    validVnfSedDocumentGroupPolicy = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/valid_vnf_sed_document_group_policy.json', 'utf8'));
    validEnmSedManagedConfig = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/valid_enm_sed_managed_config.json', 'utf8'));

    schema = new Schema(validSchema);
    await schema.save();
    validDocument.schema_id = schema._id;
    userObject = new User(validUser);
    await userObject.save();
    userObject2 = new User(validUser2);
    await userObject2.save();
    userObject3 = new User(validUser3);
    await userObject3.save();

    validGroup = {
      name: 'groupName',
      admin_IDs: [userObject._id],
      users: [],
      associatedDocuments: []
    };

    groupObject = new Group(validGroup);
    await groupObject.save();

    // Authorise User
    agent.auth(validUser.username, validUser.password);
    process.env.PARAMETER_DEFAULTS_APPLICATION = 'dittest'; // reseting to dittest
  });

  describe('POST', function () {
    it('should autopopulate vnf_sed keys during creation with temporary data', async function () {
      vnfSedSchemaObject = new Schema(vnfSedSchema);
      vnfSedSchemaObjectReturned = await vnfSedSchemaObject.save();
      validVnfSedDocument.schema_id = vnfSedSchemaObjectReturned._id;
      response = await agent.post('/api/documents').send(validVnfSedDocument).expect(201);
      response.body.content.should.deepEqual(vnflcmAutoPopulateContentTemporaryValuesExpected);
    });

    it('should fail to autopopulate vnf_sed keys during creation when autopopulate is off', async function () {
      vnfSedSchemaObject = new Schema(vnfSedSchema);
      vnfSedSchemaObjectReturned = await vnfSedSchemaObject.save();
      validVnfSedDocument.autopopulate = false;
      validVnfSedDocument.schema_id = vnfSedSchemaObjectReturned._id;
      response = await agent.post('/api/documents').send(validVnfSedDocument).expect(422);
      response.body.message.should.containEql('errors found when validating the given document against the schema');
    });
  });

  describe('GET', function () {
    it('should be able to get a vnflcm sed document', async function () {
      vnfSedSchemaObject = new Schema(vnfSedSchema);
      vnfSedSchemaObjectReturned = await vnfSedSchemaObject.save();
      validVnfSedDocument.schema_id = vnfSedSchemaObjectReturned._id;
      documentResponse = await agent.post('/api/documents').send(validVnfSedDocument).expect(201);
      response = await agent.get(`/api/documents/${documentResponse.body._id}`).expect(200);
      var content = Object.keys(response.body.content)[0];
      content.should.equal('parameters');
    });

    it('should be able to get a vnflcm sed document with content key "parameters"', async function () {
      vnfSedSchemaObject = new Schema(vnfSedSchema);
      vnfSedSchemaObjectReturned = await vnfSedSchemaObject.save();
      validVnfSedDocument.schema_id = vnfSedSchemaObjectReturned._id;
      documentResponse = await agent.post('/api/documents').send(validVnfSedDocument).expect(201);
      process.env.NODE_ENV = 'policyCheckEnabled';
      process.env.PARAMETER_DEFAULTS_APPLICATION = 'testuser';
      response = await agent.get(`/api/documents/${documentResponse.body._id}`).auth(validUser2.username, validUser2.password).expect(200);
      var content = Object.keys(response.body.content)[0];
      content.should.equal('parameters');
      process.env.NODE_ENV = nodeEnv;
    });

    it('should be able to get vnflcm sed document with content key "parameter_defaults"', async function () {
      vnfSedSchemaObject = new Schema(vnfSedSchema);
      vnfSedSchemaObjectReturned = await vnfSedSchemaObject.save();
      validVnfSedDocument.schema_id = vnfSedSchemaObjectReturned._id;
      documentResponse = await agent.post('/api/documents').send(validVnfSedDocument).expect(201);
      process.env.NODE_ENV = 'policyCheckEnabled';
      process.env.PARAMETER_DEFAULTS_APPLICATION = 'testuser';
      response = await agent.get(`/api/documents/${documentResponse.body._id}`).auth(validUser.username, validUser.password).expect(200);
      var content = Object.keys(response.body.content)[0];
      content.should.equal('parameter_defaults');
      process.env.NODE_ENV = nodeEnv;
    });
  });

  describe('PUT', function () {
    beforeEach(async function () {
      document = new Document(validDocument);
      await document.save();
    });

    it('should autopopulate vnf_sed keys during update with temporary data when no deployment is associated', async function () {
      vnfSedSchemaObject = new Schema(vnfSedSchema);
      vnfSedSchemaObjectReturned = await vnfSedSchemaObject.save();
      validVnfSedDocument.schema_id = vnfSedSchemaObjectReturned._id;
      documentResponse = await agent.post('/api/documents').send(validVnfSedDocument).expect(201);
      response = await agent.get(`/api/documents/${documentResponse.body._id}`).send(validVnfSedDocument).expect(200);
      response.body.content.should.deepEqual(vnflcmAutoPopulateContentTemporaryValuesExpected);
    });

    it('should autopopulate vnf_sed keys during update with temporary data when no deployment and HA is selected is associated', async function () {
      vnfSedSchemaObject = new Schema(vnfSedSchema);
      vnfSedSchemaObjectReturned = await vnfSedSchemaObject.save();
      validVnfSedDocument.schema_id = vnfSedSchemaObjectReturned._id;
      validVnfSedDocument.ipv6 = false;
      validVnfSedDocument.ha = true;
      documentResponse = await agent.post('/api/documents').send(validVnfSedDocument).expect(201);
      response = await agent.put(`/api/documents/${documentResponse.body._id}`).send(validVnfSedDocument).expect(200);
      response.body.content.should.deepEqual(vnflcmAutoPopulateContentTemporaryValuesExpectedHaTrue);
    });

    it('should autopopulate vnf_sed keys during update with temporary data when a deployment is not associated', async function () {
      vnfSedSchemaObject = new Schema(vnfSedSchema);
      vnfSedSchemaObjectReturned = await vnfSedSchemaObject.save();
      validVnfSedDocument.schema_id = vnfSedSchemaObjectReturned._id;
      var vnfDocumentResponse = await agent.post('/api/documents').send(validVnfSedDocument).expect(201);
      response = await agent.put(`/api/documents/${vnfDocumentResponse.body._id}`).send().expect(200);
      response.body.content.should.deepEqual(vnflcmAutoPopulateContentTemporaryValuesExpected);
    });

    it('should autopopulate vnf_sed keys during update when a deployment is associated with enm_sed without nameservers', async function () {
      vnfSedSchemaObject = new Schema(vnfSedSchema);
      vnfSedSchemaObjectReturned = await vnfSedSchemaObject.save();
      validVnfSedDocument.schema_id = vnfSedSchemaObjectReturned._id;
      var vnfDocumentResponse = await agent.post('/api/documents').send(validVnfSedDocument).expect(201);
      var vnfDeploymentDocuments = _.find(validVnfDeployment.documents, ['schema_name', 'vnflcm_sed_schema']);
      vnfDeploymentDocuments.document_id = vnfDocumentResponse.body._id;

      enmSedSchemaObject = new Schema(enmSedSchemaNonameservers);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      var validEnmSedDocumentWithNoNameservers = _.cloneDeep(validEnmSedDocument);
      validEnmSedDocumentWithNoNameservers.schema_id = enmSedSchemaObjectReturned._id;
      delete validEnmSedDocumentWithNoNameservers.content.parameters.nameserverA;
      delete validEnmSedDocumentWithNoNameservers.content.parameters.nameserverB;
      documentResponse = await agent.post('/api/documents').send(validEnmSedDocumentWithNoNameservers).expect(201);
      validVnfDeployment.enm.sed_id = documentResponse.body._id;

      podObject = new Pod(validPod);
      podObject.authUrl = 'http://cloud4a.athtem.eei.ericsson.se:5000/v2.0';
      podObjectReturned = await podObject.save();

      validProject.pod_id = podObjectReturned._id;
      projectObject = new Project(validProject);
      projectObjectReturned = await projectObject.save();

      validVnfDeployment.project_id = projectObjectReturned._id;
      deploymentObject = new Deployment(validVnfDeployment);
      await deploymentObject.save();
      response = await agent.put(`/api/documents/${vnfDocumentResponse.body._id}`).send().expect(200);
      var vnflcmAutoPopulateContentValuesExpectedDefaultDns = _.cloneDeep(vnflcmAutoPopulateContentValuesExpectedUpdatedKeys);
      vnflcmAutoPopulateContentValuesExpectedDefaultDns.parameters.dns_server_ip = '1.1.1.1,1.1.1.1';
      vnflcmAutoPopulateContentValuesExpectedDefaultDns.parameters.external_ipv6_for_services_vm = '2001:1b70:6207:0027:0000:0874:1001:0000';
      vnflcmAutoPopulateContentValuesExpectedDefaultDns.parameters.ip_version = '4';
      response.body.content.should.deepEqual(vnflcmAutoPopulateContentValuesExpectedDefaultDns);
    });

    it('should autopopulate vnf_sed keys during update when a deployment is associated with enm_sed set ipv6 true', async function () {
      vnfSedSchemaObject = new Schema(vnfSedSchema);
      vnfSedSchemaObjectReturned = await vnfSedSchemaObject.save();
      validVnfSedDocument.schema_id = vnfSedSchemaObjectReturned._id;
      var vnfDocumentResponse = await agent.post('/api/documents').send(validVnfSedDocument).expect(201);
      var vnfDeploymentDocuments = _.find(validVnfDeployment.documents, ['schema_name', 'vnflcm_sed_schema']);
      vnfDeploymentDocuments.document_id = vnfDocumentResponse.body._id;

      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      documentResponse = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);
      validVnfDeployment.enm.sed_id = documentResponse.body._id;

      podObject = new Pod(validPod);
      podObject.authUrl = 'http://cloud4a.athtem.eei.ericsson.se:5000/v2.0';
      podObjectReturned = await podObject.save();

      validProject.pod_id = podObjectReturned._id;
      projectObject = new Project(validProject);
      projectObjectReturned = await projectObject.save();

      validVnfDeployment.project_id = projectObjectReturned._id;
      deploymentObject = new Deployment(validVnfDeployment);
      await deploymentObject.save();
      response = await agent.put(`/api/documents/${vnfDocumentResponse.body._id}`).send().expect(200);
      response.body.content.should.deepEqual(vnflcmAutoPopulateContentValuesExpected);
    });

    it('should autopopulate vnf_sed OSS keys during update when a deployment is associated with enm_sed', async function () {
      vnfSedSchemaObject = new Schema(vnfSedSchema);
      vnfSedSchemaObjectReturned = await vnfSedSchemaObject.save();
      validVnfSedDocument.schema_id = vnfSedSchemaObjectReturned._id;
      var vnfDocumentResponse = await agent.post('/api/documents').send(validVnfSedDocument).expect(201);
      var vnfDeploymentDocuments = _.find(validVnfDeployment.documents, ['schema_name', 'vnflcm_sed_schema']);
      vnfDeploymentDocuments.document_id = vnfDocumentResponse.body._id;

      enmSedSchemaObject = new Schema(enmSedSchemaWithVnfKeys);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      var enmValidEnmSedDocument = _.cloneDeep(validEnmSedDocument);
      enmValidEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      documentResponse = await agent.post('/api/documents').send(enmValidEnmSedDocument).expect(201);
      validVnfDeployment.enm.sed_id = documentResponse.body._id;

      validPod.networks = [{
        name: 'provider_network1',
        vrrp_range: {
          start: '100',
          end: '255'
        },
        ipv6_subnet: {
          cidr: '2001:1b70:6207:21::/64',
          gateway_ip: '2001:1b70:6207:21:0:3212:0:1'
        },
        ipv4_subnet: {
          cidr: '131.160.196.0/24',
          gateway_ip: '131.160.196.1'
        }
      }, {
        name: 'provider_network',
        vrrp_range: {
          start: '100',
          end: '255'
        },
        ipv6_subnet: {
          cidr: '2001:1B70:6207:27::/64',
          gateway_ip: '2001:1B70:6207:27:0:874:0:1'
        },
        ipv4_subnet: {
          cidr: '131.160.202.0/24',
          gateway_ip: '131.160.202.1'
        }
      }
      ];
      podObject = new Pod(validPod);
      podObject.authUrl = 'http://cloud4a.athtem.eei.ericsson.se:5000/v2.0';
      podObjectReturned = await podObject.save();

      validProject.pod_id = podObjectReturned._id;
      validProject.network.ipv4_ranges = [
        {
          start: '131.160.202.10',
          end: '131.160.202.50'
        }
      ];
      projectObject = new Project(validProject);
      projectObjectReturned = await projectObject.save();

      validVnfDeployment.project_id = projectObjectReturned._id;
      deploymentObject = new Deployment(validVnfDeployment);
      await deploymentObject.save();
      documentResponse = await agent.put(`/api/documents/${documentResponse.body._id}`).send().expect(200);
      response = await agent.put(`/api/documents/${vnfDocumentResponse.body._id}`).send().expect(200);
      var enmDocumentResponseContent = documentResponse.body.content.parameters;
      response.body.content.parameters.ossNotificationServiceIP.should.equal(enmDocumentResponseContent.visinamingnb_external_ip_list);
      response.body.content.parameters.ossNbiAlarmIP.should.equal(enmDocumentResponseContent.nbalarmirp_external_ip_list);
      // Save ENM SED Document Again
      var documentResponse2 = await agent.put(`/api/documents/${documentResponse.body._id}`).send().expect(200);
      documentResponse2.body.content.parameters.visinamingnb_external_ip_list.should.equal(enmDocumentResponseContent.visinamingnb_external_ip_list);
      documentResponse2.body.content.parameters.nbalarmirp_external_ip_list.should.equal(enmDocumentResponseContent.nbalarmirp_external_ip_list);
    });

    it('should autopopulate vnf_sed keys during update when a deployment is associated and project network is not first in pod network list', async function () {
      vnfSedSchemaObject = new Schema(vnfSedSchema);
      vnfSedSchemaObjectReturned = await vnfSedSchemaObject.save();
      validVnfSedDocument.schema_id = vnfSedSchemaObjectReturned._id;
      var vnfDocumentResponse = await agent.post('/api/documents').send(validVnfSedDocument).expect(201);
      var vnfDeploymentDocuments = _.find(validVnfDeployment.documents, ['schema_name', 'vnflcm_sed_schema']);
      vnfDeploymentDocuments.document_id = vnfDocumentResponse.body._id;

      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      documentResponse = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);
      validVnfDeployment.enm.sed_id = documentResponse.body._id;
      validPod.networks = [{
        name: 'provider_network1',
        vrrp_range: {
          start: '100',
          end: '255'
        },
        ipv6_subnet: {
          cidr: '2001:1b70:6207:21::/64',
          gateway_ip: '2001:1b70:6207:21:0:3212:0:1'
        },
        ipv4_subnet: {
          cidr: '131.160.196.0/24',
          gateway_ip: '131.160.196.1'
        }
      }, {
        name: 'provider_network',
        vrrp_range: {
          start: '100',
          end: '255'
        },
        ipv6_subnet: {
          cidr: '2001:1B70:6207:27::/64',
          gateway_ip: '2001:1B70:6207:27:0:874:0:1'
        },
        ipv4_subnet: {
          cidr: '131.160.202.0/24',
          gateway_ip: '131.160.202.1'
        }
      }
      ];
      podObject = new Pod(validPod);
      podObject.authUrl = 'http://cloud4a.athtem.eei.ericsson.se:5000/v2.0';
      podObjectReturned = await podObject.save();

      validProject.pod_id = podObjectReturned._id;
      projectObject = new Project(validProject);
      projectObjectReturned = await projectObject.save();

      validVnfDeployment.project_id = projectObjectReturned._id;
      deploymentObject = new Deployment(validVnfDeployment);
      await deploymentObject.save();
      response = await agent.put(`/api/documents/${vnfDocumentResponse.body._id}`).send().expect(200);
      response.body.content.should.deepEqual(vnflcmAutoPopulateContentValuesExpected);
    });

    it('should not autopopulate vnf_sed keys during update when hostname is not valid', async function () {
      vnfSedSchemaObject = new Schema(vnfSedSchema);
      vnfSedSchemaObjectReturned = await vnfSedSchemaObject.save();
      validVnfSedDocument.schema_id = vnfSedSchemaObjectReturned._id;
      var vnfDocumentResponse = await agent.post('/api/documents').send(validVnfSedDocument).expect(201);
      var vnfDeploymentDocuments = _.find(validVnfDeployment.documents, ['schema_name', 'vnflcm_sed_schema']);
      vnfDeploymentDocuments.document_id = vnfDocumentResponse.body._id;

      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      documentResponse = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);
      validVnfDeployment.enm.sed_id = documentResponse.body._id;

      podObject = new Pod(validPod);
      podObject.authUrl = 'http://invalid.ericsson.se:5000/v2.0';
      podObjectReturned = await podObject.save();

      validProject.pod_id = podObjectReturned._id;
      projectObject = new Project(validProject);
      projectObjectReturned = await projectObject.save();

      validVnfDeployment.project_id = projectObjectReturned._id;
      deploymentObject = new Deployment(validVnfDeployment);
      await deploymentObject.save();
      response = await agent.put(`/api/documents/${vnfDocumentResponse.body._id}`).send().expect(422);
      response.body.message.should.deepEqual('Unable to retrieve an ip for hostname \'invalid.ericsson.se\', from DNS');
    });

    it('should autopopulate vnf_sed ips that are linked to keys in the enm sed with the same values', async function () {
      vnfSedSchemaObject = new Schema(vnfSedSchema);
      vnfSedSchemaObjectReturned = await vnfSedSchemaObject.save();
      validVnfSedDocument.schema_id = vnfSedSchemaObjectReturned._id;
      validVnfSedDocument.ha = true;
      var vnfDocumentResponse = await agent.post('/api/documents').send(validVnfSedDocument).expect(201);
      var vnfDeploymentDocuments = _.find(validVnfDeployment.documents, ['schema_name', 'vnflcm_sed_schema']);
      vnfDeploymentDocuments.document_id = vnfDocumentResponse.body._id;

      enmSedSchemaObject = new Schema(enmSedSchemaWithVnfKeys);
      enmSedSchemaObject.version = '1.61.1';
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      documentResponse = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);
      validVnfDeployment.enm.sed_id = documentResponse.body._id;
      podObject = new Pod(validPod);
      podObject.authUrl = 'http://cloud4a.athtem.eei.ericsson.se:5000/v2.0';
      podObjectReturned = await podObject.save();

      validProject.pod_id = podObjectReturned._id;
      validProject.network.ipv4_ranges = [
        {
          start: '131.160.202.10',
          end: '131.160.202.50'
        }
      ];
      projectObject = new Project(validProject);
      projectObjectReturned = await projectObject.save();

      validVnfDeployment.project_id = projectObjectReturned._id;
      deploymentObject = new Deployment(validVnfDeployment);
      await deploymentObject.save();
      var enmDocumentResponse = await agent.put(`/api/documents/${documentResponse.body._id}`).send().expect(200);
      response = await agent.put(`/api/documents/${vnfDocumentResponse.body._id}`).send().expect(200);
      response.body.content.parameters.internal_ipv4_for_services_vm.should.equal(enmDocumentResponse.body.content.parameters.enm_laf_1_ip_internal);
      response.body.content.parameters.internal_ipv4_for_db_vm.should.equal(enmDocumentResponse.body.content.parameters.vnflaf_db_1_ip_internal);
      response.body.content.parameters.external_ipv4_for_services_vm.should.equal(enmDocumentResponse.body.content.parameters.enm_laf_1_ip_external);
    });

    it('should not autopopulate duplicate IP addresses in ENM SED even with regards to common ENM/VNF value keys', async function () {
      vnfSedSchemaObject = new Schema(vnfSedSchema);
      vnfSedSchemaObjectReturned = await vnfSedSchemaObject.save();
      validVnfSedDocument.schema_id = vnfSedSchemaObjectReturned._id;
      validVnfSedDocument.ha = true;
      var vnfDocumentResponse = await agent.post('/api/documents').send(validVnfSedDocument).expect(201);
      var vnfDeploymentDocuments = _.find(validVnfDeployment.documents, ['schema_name', 'vnflcm_sed_schema']);
      vnfDeploymentDocuments.document_id = vnfDocumentResponse.body._id;

      enmSedSchemaObject = new Schema(enmSedSchemaWithVnfKeys);
      enmSedSchemaObject.version = '1.61.1';
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      documentResponse = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);
      validVnfDeployment.enm.sed_id = documentResponse.body._id;
      podObject = new Pod(validPod);
      podObject.authUrl = 'http://cloud4a.athtem.eei.ericsson.se:5000/v2.0';
      podObjectReturned = await podObject.save();

      validProject.pod_id = podObjectReturned._id;
      validProject.network.ipv4_ranges = [
        {
          start: '131.160.202.10',
          end: '131.160.202.50'
        }
      ];
      projectObject = new Project(validProject);
      projectObjectReturned = await projectObject.save();

      validVnfDeployment.project_id = projectObjectReturned._id;
      deploymentObject = new Deployment(validVnfDeployment);
      await deploymentObject.save();
      var enmDocumentResponse = await agent.put(`/api/documents/${documentResponse.body._id}`).send().expect(200);
      await agent.put(`/api/documents/${vnfDocumentResponse.body._id}`).send().expect(200);
      enmDocumentResponse.body.autopopulate = false;
      enmDocumentResponse.body.content.parameters.serviceregistry_internal_ip_list = enmDocumentResponse.body.content.parameters.service1_internal_ip_list.split(',')[0];
      enmDocumentResponse = await agent.put(`/api/documents/${documentResponse.body._id}`).send(enmDocumentResponse.body).expect(200);
      enmDocumentResponse.body.content.parameters.serviceregistry_internal_ip_list.should.equal(enmDocumentResponse.body.content.parameters.service1_internal_ip_list.split(',')[0]);
      enmDocumentResponse.body.autopopulate = true;
      enmDocumentResponse = await agent.put(`/api/documents/${documentResponse.body._id}`).send(enmDocumentResponse.body).expect(200);
      enmDocumentResponse.body.content.parameters.serviceregistry_internal_ip_list.should.not.equal(enmDocumentResponse.body.content.parameters.service1_internal_ip_list.split(',')[0]);
    });

    it('should autopopulate enm_sed ips that are linked to keys in the vnf sed with the same values', async function () {
      vnfSedSchemaObject = new Schema(vnfSedSchema);
      vnfSedSchemaObjectReturned = await vnfSedSchemaObject.save();
      validVnfSedDocument.schema_id = vnfSedSchemaObjectReturned._id;
      validVnfSedDocument.ha = true;
      var vnfDocumentResponse = await agent.post('/api/documents').send(validVnfSedDocument).expect(201);
      var vnfDeploymentDocuments = _.find(validVnfDeployment.documents, ['schema_name', 'vnflcm_sed_schema']);
      vnfDeploymentDocuments.document_id = vnfDocumentResponse.body._id;

      enmSedSchemaObject = new Schema(enmSedSchemaWithVnfKeys);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      documentResponse = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);
      validVnfDeployment.enm.sed_id = documentResponse.body._id;
      podObject = new Pod(validPod);
      podObject.authUrl = 'http://cloud4a.athtem.eei.ericsson.se:5000/v2.0';
      podObjectReturned = await podObject.save();

      validProject.pod_id = podObjectReturned._id;
      validProject.network.ipv4_ranges = [
        {
          start: '131.160.202.10',
          end: '131.160.202.50'
        }
      ];
      projectObject = new Project(validProject);
      projectObjectReturned = await projectObject.save();
      validVnfDeployment.project_id = projectObjectReturned._id;
      deploymentObject = new Deployment(validVnfDeployment);
      await deploymentObject.save();
      response = await agent.put(`/api/documents/${documentResponse.body._id}`).send().expect(200);
      vnfDocumentResponse = await agent.put(`/api/documents/${vnfDocumentResponse.body._id}`).send().expect(200);
      response.body.content.parameters.enm_laf_1_ip_internal.should.equal(vnfDocumentResponse.body.content.parameters.internal_ipv4_for_services_vm);
      response.body.content.parameters.vnflaf_db_1_ip_internal.should.equal(vnfDocumentResponse.body.content.parameters.internal_ipv4_for_db_vm);
      response.body.content.parameters.enm_laf_1_ip_external.should.equal(vnfDocumentResponse.body.content.parameters.external_ipv4_for_services_vm);
      response.body.content.parameters.enm_laf_1_ip_internal = '1.1.1.1';
      response.body.content.parameters.enm_laf_1_ip_external = '';
      response = await agent.put(`/api/documents/${response.body._id}`).send(response.body).expect(200);
      vnfDocumentResponse = await agent.put(`/api/documents/${vnfDocumentResponse.body._id}`).send().expect(200);
      response.body.content.parameters.enm_laf_1_ip_internal.should.equal(vnfDocumentResponse.body.content.parameters.internal_ipv4_for_services_vm);
      response.body.content.parameters.enm_laf_1_ip_external.should.equal(vnfDocumentResponse.body.content.parameters.external_ipv4_for_services_vm);
    });

    it('should autopopulate enm_sed leave ips that are linked to keys in the vnf sed with the same values after resave', async function () {
      vnfSedSchemaObject = new Schema(vnfSedSchema);
      vnfSedSchemaObjectReturned = await vnfSedSchemaObject.save();
      validVnfSedDocument.schema_id = vnfSedSchemaObjectReturned._id;
      validVnfSedDocument.ha = true;
      var vnfDocumentResponse = await agent.post('/api/documents').send(validVnfSedDocument).expect(201);
      var vnfDeploymentDocuments = _.find(validVnfDeployment.documents, ['schema_name', 'vnflcm_sed_schema']);
      vnfDeploymentDocuments.document_id = vnfDocumentResponse.body._id;

      enmSedSchemaObject = new Schema(enmSedSchemaWithVnfKeys);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      documentResponse = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);
      validVnfDeployment.enm.sed_id = documentResponse.body._id;
      podObject = new Pod(validPod);
      podObject.authUrl = 'http://cloud4a.athtem.eei.ericsson.se:5000/v2.0';
      podObjectReturned = await podObject.save();

      validProject.pod_id = podObjectReturned._id;
      validProject.network.ipv4_ranges = [
        {
          start: '131.160.202.10',
          end: '131.160.202.50'
        }
      ];
      projectObject = new Project(validProject);
      projectObjectReturned = await projectObject.save();

      validVnfDeployment.project_id = projectObjectReturned._id;
      deploymentObject = new Deployment(validVnfDeployment);
      await deploymentObject.save();
      var firstResponse = await agent.put(`/api/documents/${documentResponse.body._id}`).send().expect(200);
      var firstResponseParameters = firstResponse.body.content.parameters;
      vnfDocumentResponse = await agent.put(`/api/documents/${vnfDocumentResponse.body._id}`).send().expect(200);
      var vnfDocumentParameters = vnfDocumentResponse.body.content.parameters;
      firstResponseParameters.enm_laf_1_ip_internal.should.equal(vnfDocumentParameters.internal_ipv4_for_services_vm);
      firstResponseParameters.vnflaf_db_1_ip_internal.should.equal(vnfDocumentParameters.internal_ipv4_for_db_vm);
      firstResponseParameters.enm_laf_1_ip_external.should.equal(vnfDocumentParameters.external_ipv4_for_services_vm);
      var secondResponse = await agent.put(`/api/documents/${documentResponse.body._id}`).send().expect(200);
      var secondResponseParameters = firstResponse.body.content.parameters;
      secondResponseParameters.enm_laf_1_ip_internal.should.equal(firstResponseParameters.enm_laf_1_ip_internal);
      secondResponseParameters.vnflaf_db_1_ip_internal.should.equal(firstResponseParameters.vnflaf_db_1_ip_internal);
      secondResponseParameters.enm_laf_1_ip_external.should.equal(firstResponseParameters.enm_laf_1_ip_external);
      secondResponseParameters.enm_laf_1_ip_internal.should.equal(vnfDocumentParameters.internal_ipv4_for_services_vm);
      secondResponseParameters.vnflaf_db_1_ip_internal.should.equal(vnfDocumentParameters.internal_ipv4_for_db_vm);
      secondResponseParameters.enm_laf_1_ip_external.should.equal(vnfDocumentParameters.external_ipv4_for_services_vm);
    });

    it('should not autopopulate vnf_sed keys during update when theres not enough IPv4 addresses in the project ranges', async function () {
      // Need to add key because schema has only 1 external ip so it was not able to get out of range
      var validSchemaPlusAKey = _.cloneDeep(vnfSedSchema);
      validSchemaPlusAKey.version = '1.2.4';
      validSchemaPlusAKey.content.properties.parameters.properties.newkey = {
        $ref: '#/definitions/ipv4_external'
      };
      validSchemaPlusAKey.content.properties.parameters.properties.newkey2 = {
        $ref: '#/definitions/ipv4_external'
      };
      var _validSchemaPlusAKey = new Schema(validSchemaPlusAKey);
      vnfSedSchemaObjectReturned = await _validSchemaPlusAKey.save();

      validVnfSedDocument.schema_id = vnfSedSchemaObjectReturned._id;
      var vnfDocumentResponse = await agent.post('/api/documents').send(validVnfSedDocument).expect(201);
      var vnfDeploymentDocuments = _.find(validVnfDeployment.documents, ['schema_name', 'vnflcm_sed_schema']);
      vnfDeploymentDocuments.document_id = vnfDocumentResponse.body._id;

      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      documentResponse = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);
      validVnfDeployment.enm.sed_id = documentResponse.body._id;

      podObject = new Pod(validPod);
      podObject.authUrl = 'http://cloud4a.athtem.eei.ericsson.se:5000/v2.0';
      podObjectReturned = await podObject.save();

      validProject.pod_id = podObjectReturned._id;
      validProject.network.ipv4_ranges = [
        {
          start: '131.160.202.10',
          end: '131.160.202.10'
        }
      ];
      projectObject = new Project(validProject);
      projectObjectReturned = await projectObject.save();

      validVnfDeployment.project_id = projectObjectReturned._id;
      deploymentObject = new Deployment(validVnfDeployment);
      await deploymentObject.save();
      response = await agent.put(`/api/documents/${vnfDocumentResponse.body._id}`).send().expect(422);
      response.body.message.should.equal('There are not enough free IPv4 addresses in the project ranges to auto populate. 2 IPv4 addresses are required in total but the project ranges only have 1 IPv4 addresses in total. Please add more and try again.');
    });

    it('should autopopulate vnf_sed vrrp keys during update when a deployment is associated and HA true', async function () {
      vnfSedSchemaObject = new Schema(vnfSedSchema);
      vnfSedSchemaObjectReturned = await vnfSedSchemaObject.save();
      validVnfSedDocument.schema_id = vnfSedSchemaObjectReturned._id;
      validVnfSedDocument.ha = true;
      var vnfDocumentResponse = await agent.post('/api/documents').send(validVnfSedDocument).expect(201);
      var vnfDeploymentDocuments = _.find(validVnfDeployment.documents, ['schema_name', 'vnflcm_sed_schema']);
      vnfDeploymentDocuments.document_id = vnfDocumentResponse.body._id;

      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      documentResponse = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);
      validVnfDeployment.enm.sed_id = documentResponse.body._id;
      podObject = new Pod(validPod);
      podObject.authUrl = 'http://cloud4a.athtem.eei.ericsson.se:5000/v2.0';
      podObjectReturned = await podObject.save();

      validProject.pod_id = podObjectReturned._id;
      projectObject = new Project(validProject);
      projectObjectReturned = await projectObject.save();

      validVnfDeployment.project_id = projectObjectReturned._id;
      deploymentObject = new Deployment(validVnfDeployment);
      await deploymentObject.save();
      response = await agent.put(`/api/documents/${vnfDocumentResponse.body._id}`).send().expect(200);
      response.body.content.parameters.db_internal_vrrp_id.should.equal('102');
      response.body.content.parameters.svc_internal_vrrp_id.should.equal('101');
      response.body.content.parameters.svc_external_vrrp_id.should.equal('100');
    });

    it('should autopopulate vnf_sed vrrp keys with values not in use by enm seds in same network', async function () {
      vnfSedSchemaObject = new Schema(vnfSedSchema);
      vnfSedSchemaObjectReturned = await vnfSedSchemaObject.save();
      validVnfSedDocument.schema_id = vnfSedSchemaObjectReturned._id;
      validVnfSedDocument.ha = true;
      var vnfDocumentResponse = await agent.post('/api/documents').send(validVnfSedDocument).expect(201);
      var vnfDeploymentDocuments = _.find(validVnfDeployment.documents, ['schema_name', 'vnflcm_sed_schema']);
      vnfDeploymentDocuments.document_id = vnfDocumentResponse.body._id;

      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      documentResponse = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);
      validVnfDeployment.enm.sed_id = documentResponse.body._id;
      podObject = new Pod(validPod);
      podObject.authUrl = 'http://cloud4a.athtem.eei.ericsson.se:5000/v2.0';
      podObjectReturned = await podObject.save();

      validProject.pod_id = podObjectReturned._id;
      validProject.network.ipv4_ranges = [
        {
          start: '131.160.202.10',
          end: '131.160.202.50'
        }
      ];
      projectObject = new Project(validProject);
      projectObjectReturned = await projectObject.save();

      validVnfDeployment.project_id = projectObjectReturned._id;
      deploymentObject = new Deployment(validVnfDeployment);
      await deploymentObject.save();
      await agent.put(`/api/documents/${documentResponse.body._id}`).send().expect(200);
      response = await agent.get(`/api/documents/${vnfDocumentResponse.body._id}`).send().expect(200);
      response.body.content.parameters.db_internal_vrrp_id.should.equal('105');
      response.body.content.parameters.svc_internal_vrrp_id.should.equal('104');
      response.body.content.parameters.svc_external_vrrp_id.should.equal('103');
    });

    it('should autopopulate vrrp keys with values not in use by another vnf seds in same network', async function () {
      vnfSedSchemaObject = new Schema(vnfSedSchema);
      vnfSedSchemaObjectReturned = await vnfSedSchemaObject.save();
      validVnfSedDocument.schema_id = vnfSedSchemaObjectReturned._id;
      validVnfSedDocument.ha = true;
      var vnfDocumentResponse = await agent.post('/api/documents').send(validVnfSedDocument).expect(201);
      var vnfDeploymentDocuments = _.find(validVnfDeployment.documents, ['schema_name', 'vnflcm_sed_schema']);
      vnfDeploymentDocuments.document_id = vnfDocumentResponse.body._id;
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      documentResponse = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);
      validVnfDeployment.enm.sed_id = documentResponse.body._id;
      podObject = new Pod(validPod);
      podObject.authUrl = 'http://cloud4a.athtem.eei.ericsson.se:5000/v2.0';
      podObjectReturned = await podObject.save();
      validProject.pod_id = podObjectReturned._id;
      validProject.network.ipv4_ranges = [
        {
          start: '131.160.202.10',
          end: '131.160.202.50'
        }
      ];
      projectObject = new Project(validProject);
      projectObjectReturned = await projectObject.save();
      validVnfDeployment.project_id = projectObjectReturned._id;
      deploymentObject = new Deployment(validVnfDeployment);
      await deploymentObject.save();

      var clonedDoc = _.cloneDeep(validEnmSedDocument);
      var clonedValidVnfDeployment = _.cloneDeep(validVnfDeployment);
      var clonedValidProject = _.cloneDeep(validProject);
      clonedDoc.name = 'clonedDoc';
      var clonedDocumentResponse = await agent.post('/api/documents').send(clonedDoc).expect(201);
      clonedValidVnfDeployment.enm.sed_id = clonedDocumentResponse.body._id;
      var validClonedVnfSedDocument = _.cloneDeep(validVnfSedDocument);
      validClonedVnfSedDocument.name = 'clonedValidVnfSed';
      validClonedVnfSedDocument.schema_id = vnfSedSchemaObjectReturned._id;
      validClonedVnfSedDocument.ha = true;
      var clonedVnfDocumentResponse = await agent.post('/api/documents').send(validClonedVnfSedDocument).expect(201);
      var clonedVnfDeploymentDocuments = _.find(clonedValidVnfDeployment.documents, ['schema_name', 'vnflcm_sed_schema']);
      clonedVnfDeploymentDocuments.document_id = clonedVnfDocumentResponse.body._id;

      var clonedProjectObject = new Project(clonedValidProject);
      clonedProjectObject.name = 'clonedValidProject';
      clonedProjectObject.pod_id = podObjectReturned._id;
      validProject.network.ipv4_ranges = [
        {
          start: '131.160.202.10',
          end: '131.160.202.50'
        }
      ];
      var clonedProjectObjectReturned = await clonedProjectObject.save();

      clonedValidVnfDeployment.project_id = clonedProjectObjectReturned._id;
      var clonedDeploymentObject = new Deployment(clonedValidVnfDeployment);
      clonedDeploymentObject.name = 'clonedValidDeployment';
      await clonedDeploymentObject.save();
      response = await agent.put(`/api/documents/${documentResponse.body._id}`).send().expect(200);
      response.body.content.parameters.lvs_external_CM_vrrp_id.should.equal('100');
      response.body.content.parameters.lvs_external_FM_vrrp_id.should.equal('101');
      response.body.content.parameters.lvs_external_PM_vrrp_id.should.equal('102');
      response = await agent.put(`/api/documents/${vnfDocumentResponse.body._id}`).send().expect(200);
      response.body.content.parameters.db_internal_vrrp_id.should.equal('105');
      response.body.content.parameters.svc_internal_vrrp_id.should.equal('104');
      response.body.content.parameters.svc_external_vrrp_id.should.equal('103');
      response = await agent.put(`/api/documents/${clonedDocumentResponse.body._id}`).send().expect(200);
      response.body.content.parameters.lvs_external_CM_vrrp_id.should.equal('106');
      response.body.content.parameters.lvs_external_FM_vrrp_id.should.equal('107');
      response.body.content.parameters.lvs_external_PM_vrrp_id.should.equal('108');
      response = await agent.put(`/api/documents/${clonedVnfDocumentResponse.body._id}`).send().expect(200);
      response.body.content.parameters.db_internal_vrrp_id.should.equal('111');
      response.body.content.parameters.svc_internal_vrrp_id.should.equal('110');
      response.body.content.parameters.svc_external_vrrp_id.should.equal('109');
    });

    it('should not overwrite ENM/VNF common values in VNF doc when keys are removed from ENM Schema', async function () {
      vnfSedSchemaObject = new Schema(vnfSedSchema);
      vnfSedSchemaObjectReturned = await vnfSedSchemaObject.save();
      validVnfSedDocument.schema_id = vnfSedSchemaObjectReturned._id;
      var vnfDocumentResponse = await agent.post('/api/documents').send(validVnfSedDocument).expect(201);
      var vnfDeploymentDocuments = _.find(validVnfDeployment.documents, ['schema_name', 'vnflcm_sed_schema']);
      vnfDeploymentDocuments.document_id = vnfDocumentResponse.body._id;
      enmSedSchema.content.properties.parameters.properties.enm_laf_1_ip_internal = {
        $ref: '#/definitions/ipv4_external'
      };
      enmSedSchema.content.properties.parameters.properties.vnflaf_db_1_ip_internal = {
        $ref: '#/definitions/ipv4_external'
      };
      enmSedSchema.content.properties.parameters.properties.vnflaf_db_1_ip_external = {
        $ref: '#/definitions/ipv4_external'
      };
      enmSedSchema.content.properties.parameters.properties.enm_laf_1_ipv6_external = {
        $ref: '#/definitions/ipv6_external'
      };
      enmSedSchema.content.properties.parameters.properties.vnflaf_db_1_ipv6_external = {
        $ref: '#/definitions/ipv6_external'
      };
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      documentResponse = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);
      validVnfDeployment.enm.sed_id = documentResponse.body._id;
      podObject = new Pod(validPod);
      podObject.authUrl = 'http://cloud4a.athtem.eei.ericsson.se:5000/v2.0';
      podObjectReturned = await podObject.save();
      validProject.network = {
        name: 'provider_network',
        ipv4_ranges: [
          {
            start: '131.160.202.20',
            end: '131.160.202.46'
          }
        ],
        ipv6_ranges: [
          {
            start: '2001:1b70:6207:0027:0000:0874:1001:0000',
            end: '2001:1b70:6207:0027:0000:0874:1001:0020'
          }
        ]
      };
      validProject.pod_id = podObjectReturned._id;
      projectObject = new Project(validProject);
      projectObjectReturned = await projectObject.save();
      validVnfDeployment.project_id = projectObjectReturned._id;
      deploymentObject = new Deployment(validVnfDeployment);
      await deploymentObject.save();

      delete enmSedSchema.content.properties.parameters.properties.enm_laf_1_ip_internal;
      delete enmSedSchema.content.properties.parameters.properties.vnflaf_db_1_ip_internal;
      delete enmSedSchema.content.properties.parameters.properties.vnflaf_db_1_ip_external;
      delete enmSedSchema.content.properties.parameters.properties.enm_laf_1_ipv6_external;
      delete enmSedSchema.content.properties.parameters.properties.vnflaf_db_1_ipv6_external;
      delete enmSedSchema.content.properties.parameters.properties.enm_laf_1_ip_external;
      var required = enmSedSchema.content.properties.parameters.required;
      required = removeKeyFromArray(required, 'enm_laf_1_ip_internal');
      required = removeKeyFromArray(required, 'vnflaf_db_1_ip_internal');
      required = removeKeyFromArray(required, 'vnflaf_db_1_ip_external');
      required = removeKeyFromArray(required, 'enm_laf_1_ipv6_external');
      required = removeKeyFromArray(required, 'vnflaf_db_1_ipv6_external');
      required = removeKeyFromArray(required, 'enm_laf_1_ip_external');
      enmSedSchema.content.properties.parameters.required = required;
      enmSedSchema.version = '1.2.4';
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;

      var ENMResponse = await agent.put(`/api/documents/${documentResponse.body._id}`).send().expect(200);
      should.exist(ENMResponse.body.content.parameters.enm_laf_1_ip_internal);
      should.exist(ENMResponse.body.content.parameters.vnflaf_db_1_ip_internal);
      should.exist(ENMResponse.body.content.parameters.vnflaf_db_1_ip_external);
      should.exist(ENMResponse.body.content.parameters.enm_laf_1_ipv6_external);
      should.exist(ENMResponse.body.content.parameters.vnflaf_db_1_ipv6_external);
      should.exist(ENMResponse.body.content.parameters.enm_laf_1_ip_external);

      var previousVNFresponse = await agent.put(`/api/documents/${vnfDocumentResponse.body._id}`).send().expect(200);
      var previousValueExternalIPv4ForServicesVM = previousVNFresponse.body.content.parameters.external_ipv4_for_services_vm;
      var previousValueInternalIPv4ForDBVM = previousVNFresponse.body.content.parameters.internal_ipv4_for_db_vm;
      var previousValueExternalIPv6ForServicesVM = previousVNFresponse.body.content.parameters.external_ipv6_for_services_vm;
      var previousValueInternalIPv4ForServicesVM = previousVNFresponse.body.content.parameters.internal_ipv4_for_services_vm;

      var ENMResponseAfterNewSchema = await agent.put(`/api/documents/${documentResponse.body._id}`)
        .send({ schema_id: enmSedSchemaObjectReturned._id }).expect(200);
      should.not.exist(ENMResponseAfterNewSchema.body.content.parameters.enm_laf_1_ip_internal);
      should.not.exist(ENMResponseAfterNewSchema.body.content.parameters.vnflaf_db_1_ip_internal);
      should.not.exist(ENMResponseAfterNewSchema.body.content.parameters.vnflaf_db_1_ip_external);
      should.not.exist(ENMResponseAfterNewSchema.body.content.parameters.enm_laf_1_ipv6_external);
      should.not.exist(ENMResponseAfterNewSchema.body.content.parameters.vnflaf_db_1_ipv6_external);
      should.not.exist(ENMResponseAfterNewSchema.body.content.parameters.enm_laf_1_ip_external);

      var currentVNFresponse = await agent.get(`/api/documents/${vnfDocumentResponse.body._id}`).expect(200);
      currentVNFresponse.body.content.parameters.external_ipv4_for_services_vm.should.equal(previousValueExternalIPv4ForServicesVM);
      currentVNFresponse.body.content.parameters.internal_ipv4_for_db_vm.should.equal(previousValueInternalIPv4ForDBVM);
      currentVNFresponse.body.content.parameters.external_ipv6_for_services_vm.should.equal(previousValueExternalIPv6ForServicesVM);
      currentVNFresponse.body.content.parameters.internal_ipv4_for_services_vm.should.equal(previousValueInternalIPv4ForServicesVM);
    });

    it('should update ip preset keys to not use same ip keys in both ENM SED and VNF SED on a VNF SED update', async function () {
      vnfSedSchemaObject = new Schema(vnfSedSchema);
      vnfSedSchemaObjectReturned = await vnfSedSchemaObject.save();
      validVnfSedDocument.schema_id = vnfSedSchemaObjectReturned._id;
      var vnfDocumentResponse = await agent.post('/api/documents').send(validVnfSedDocument).expect(201);
      var vnfDeploymentDocuments = _.find(validVnfDeployment.documents, ['schema_name', 'vnflcm_sed_schema']);
      vnfDeploymentDocuments.document_id = vnfDocumentResponse.body._id;
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      documentResponse = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);
      validVnfDeployment.enm.sed_id = documentResponse.body._id;
      podObject = new Pod(validPod);
      podObject.authUrl = 'http://cloud4a.athtem.eei.ericsson.se:5000/v2.0';
      podObjectReturned = await podObject.save();
      validProject.pod_id = podObjectReturned._id;
      validProject.network = {
        name: 'provider_network',
        ipv4_ranges: [
          {
            start: '131.160.202.20',
            end: '131.160.202.46'
          }
        ],
        ipv6_ranges: [
          {
            start: '2001:1b70:6207:0027:0000:0874:1001:0000',
            end: '2001:1b70:6207:0027:0000:0874:1001:0020'
          }
        ]
      };
      projectObject = new Project(validProject);
      projectObjectReturned = await projectObject.save();
      validVnfDeployment.project_id = projectObjectReturned._id;
      deploymentObject = new Deployment(validVnfDeployment);
      await deploymentObject.save();
      var ENMResponse = await agent.put(`/api/documents/${documentResponse.body._id}`).send().expect(200);
      vnfDocumentResponse.body.autopopulate = false;
      vnfDocumentResponse.body.content.parameters.internal_ipv4_for_services_vm = ENMResponse.body.content.parameters.singleip1_ip_internal;
      vnfDocumentResponse.body.content.parameters.internal_ipv6_for_services_vm = ENMResponse.body.content.parameters.singleip1_ipv6_internal;
      vnfDocumentResponse = await agent.put(`/api/documents/${vnfDocumentResponse.body._id}`).send(vnfDocumentResponse.body).expect(200);
      vnfDocumentResponse.body.autopopulate = true;
      vnfDocumentResponse = await agent.put(`/api/documents/${vnfDocumentResponse.body._id}`).send(vnfDocumentResponse.body).expect(200);

      var responseDocuments = [ENMResponse, vnfDocumentResponse];
      var IPv4Addresses = [];
      var IPv6Addresses = [];
      var IPv4Object;
      var IPv6Object;
      var value;

      for (var i = 0; i < responseDocuments.length; i += 1) {
        for (var key in responseDocuments[i].body.content.parameters) { // eslint-disable-line guard-for-in
          value = responseDocuments[i].body.content.parameters[key];
          if (isKeyValueForTest(key, value)) {
            IPv4Object = new Address4(value);
            IPv6Object = new Address6(value);
            if (IPv4Object.isValid()) {
              if (IPv4Addresses.includes(IPv4Object.address)) {
                throw new Error(`${IPv4Object.address} is already assigned in document.`);
              }
              if (!IPv4Object.address.endsWith(IPv4Object.subnet)) {
                IPv4Addresses.push(IPv4Object.address);
              }
            } else if (IPv6Object.isValid()) {
              if (IPv6Addresses.includes(IPv6Object.address)) {
                throw new Error(`${IPv6Object.address} is already assigned in document.`);
              }
              if (!IPv6Object.address.endsWith(IPv6Object.subnet)) {
                IPv6Addresses.push(IPv6Object.address);
              }
            }
          }
        }
      }
    });

    function isKeyValueForTest(key, value) {
      var commonValuesAcrossENMVNFDocs = [
        'serviceregistry_internal_ip_list',
        'internal_ipv4_for_services_vm',
        'internal_ipv4_for_db_vm',
        'external_ipv4_for_db_vm',
        'external_ipv6_for_services_vm',
        'external_ipv6_for_db_vm',
        'external_ipv4_for_services_vm',
        'serviceregistry_internal_ip_list',
        'enm_laf_1_ip_internal',
        'vnflaf_db_1_ip_internal',
        'vnflaf_db_1_ip_external',
        'enm_laf_1_ipv6_external',
        'vnflaf_db_1_ipv6_external',
        'enm_laf_1_ip_external'
      ];
      return !commonValuesAcrossENMVNFDocs.includes(key) && value !== '1.1.1.1' && value !== '::' && !key.includes('gateway') && !key.includes('M_vip_');
    }

    it('should update ip preset keys to not use same ip keys in both ENM SED and VNF SED on a ENM SED update', async function () {
      vnfSedSchemaObject = new Schema(vnfSedSchema);
      vnfSedSchemaObjectReturned = await vnfSedSchemaObject.save();
      validVnfSedDocument.schema_id = vnfSedSchemaObjectReturned._id;
      var vnfDocumentResponse = await agent.post('/api/documents').send(validVnfSedDocument).expect(201);
      var vnfDeploymentDocuments = _.find(validVnfDeployment.documents, ['schema_name', 'vnflcm_sed_schema']);
      vnfDeploymentDocuments.document_id = vnfDocumentResponse.body._id;
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      documentResponse = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);
      validVnfDeployment.enm.sed_id = documentResponse.body._id;
      podObject = new Pod(validPod);
      podObject.authUrl = 'http://cloud4a.athtem.eei.ericsson.se:5000/v2.0';
      podObjectReturned = await podObject.save();
      validProject.pod_id = podObjectReturned._id;
      validProject.network = {
        name: 'provider_network',
        ipv4_ranges: [
          {
            start: '131.160.202.20',
            end: '131.160.202.46'
          }
        ],
        ipv6_ranges: [
          {
            start: '2001:1b70:6207:0027:0000:0874:1001:0000',
            end: '2001:1b70:6207:0027:0000:0874:1001:0020'
          }
        ]
      };
      projectObject = new Project(validProject);
      projectObjectReturned = await projectObject.save();
      validVnfDeployment.project_id = projectObjectReturned._id;
      deploymentObject = new Deployment(validVnfDeployment);
      await deploymentObject.save();
      vnfDocumentResponse = await agent.put(`/api/documents/${vnfDocumentResponse.body._id}`).send(vnfDocumentResponse.body).expect(200);
      documentResponse.body.autopopulate = false;
      documentResponse.body.content.parameters.singleip1_ip_internal = vnfDocumentResponse.body.content.parameters.internal_ipv4_for_services_vm;
      documentResponse.body.content.parameters.singleip1_ipv6_internal = vnfDocumentResponse.body.content.parameters.internal_ipv6_for_services_vm;
      documentResponse = await agent.put(`/api/documents/${documentResponse.body._id}`).send().expect(200);

      documentResponse.body.autopopulate = true;
      response = await agent.put(`/api/documents/${documentResponse.body._id}`).send(documentResponse.body).expect(200);
      var vnfInternalIpv4ForServicesVm = vnfDocumentResponse.body.content.parameters.internal_ipv4_for_services_vm;
      var vnfInternalIpv6ForServicesVm = vnfDocumentResponse.body.content.parameters.internal_ipv6_for_services_vm;
      response.body.content.parameters.singleip1_ip_internal.should.not.equal(vnfInternalIpv4ForServicesVm);
      response.body.content.parameters.singleip1_ipv6_internal.should.not.equal(vnfInternalIpv6ForServicesVm);
    });

    it('should not use same ip keys in both ENM SED and VNF SED on a VNF SED update', async function () {
      var validSchemaPlusAKey = _.cloneDeep(vnfSedSchema);
      validSchemaPlusAKey.version = '1.2.4';
      validSchemaPlusAKey.content.properties.parameters.properties.newkey = {
        $ref: '#/definitions/ipv4_external'
      };
      vnfSedSchemaObject = new Schema(validSchemaPlusAKey);
      vnfSedSchemaObjectReturned = await vnfSedSchemaObject.save();
      validVnfSedDocument.schema_id = vnfSedSchemaObjectReturned._id;
      var vnfDocumentResponse = await agent.post('/api/documents').send(validVnfSedDocument).expect(201);
      var vnfDeploymentDocuments = _.find(validVnfDeployment.documents, ['schema_name', 'vnflcm_sed_schema']);
      vnfDeploymentDocuments.document_id = vnfDocumentResponse.body._id;
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      documentResponse = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);
      validVnfDeployment.enm.sed_id = documentResponse.body._id;
      podObject = new Pod(validPod);
      podObject.authUrl = 'http://cloud4a.athtem.eei.ericsson.se:5000/v2.0';
      podObjectReturned = await podObject.save();
      validProject.pod_id = podObjectReturned._id;
      validProject.network = {
        name: 'provider_network',
        ipv4_ranges: [
          {
            start: '131.160.202.20',
            end: '131.160.202.36'
          }
        ],
        ipv6_ranges: [
          {
            start: '2001:1b70:6207:0027:0000:0874:1001:0000',
            end: '2001:1b70:6207:0027:0000:0874:1001:0010'
          }
        ]
      };
      projectObject = new Project(validProject);
      projectObjectReturned = await projectObject.save();
      validVnfDeployment.project_id = projectObjectReturned._id;
      deploymentObject = new Deployment(validVnfDeployment);
      await deploymentObject.save();
      documentResponse = await agent.put(`/api/documents/${documentResponse.body._id}`).send().expect(422);
      documentResponse.body.message.should.equal('There are not enough free ipv4 addresses in the ranges to auto populate. Please add more and try again.');
    });

    it('should autopopulate vnf_sed keys during update when a deployment is associated with enm_sed set ipv6 false', async function () {
      vnfSedSchemaObject = new Schema(vnfSedSchema);
      vnfSedSchemaObjectReturned = await vnfSedSchemaObject.save();
      validVnfSedDocument.schema_id = vnfSedSchemaObjectReturned._id;
      var vnfDocumentResponse = await agent.post('/api/documents').send(validVnfSedDocument).expect(201);
      var vnfDeploymentDocuments = _.find(validVnfDeployment.documents, ['schema_name', 'vnflcm_sed_schema']);

      vnfDeploymentDocuments.document_id = vnfDocumentResponse.body._id;
      enmSedSchemaObject = new Schema(enmSedSchemaNonameservers);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      var validEnmSedDocumentWithNoNameservers = _.cloneDeep(validEnmSedDocument);
      validEnmSedDocumentWithNoNameservers.schema_id = enmSedSchemaObjectReturned._id;
      validEnmSedDocumentWithNoNameservers.ipv6 = false;
      delete validEnmSedDocumentWithNoNameservers.content.parameters.nameserverA;
      delete validEnmSedDocumentWithNoNameservers.content.parameters.nameserverB;
      validEnmSedDocumentWithNoNameservers.content.parameters.ip_version = 'v4';
      documentResponse = await agent.post('/api/documents').send(validEnmSedDocumentWithNoNameservers).expect(201);
      validVnfDeployment.enm.sed_id = documentResponse.body._id;

      podObject = new Pod(validPod);
      podObject.authUrl = 'http://cloud4a.athtem.eei.ericsson.se:5000/v2.0';
      podObject.networks[0].ipv6_subnet = {};
      podObjectReturned = await podObject.save();

      validProject.pod_id = podObjectReturned._id;
      projectObject = new Project(validProject);
      projectObjectReturned = await projectObject.save();

      validVnfDeployment.project_id = projectObjectReturned._id;
      deploymentObject = new Deployment(validVnfDeployment);
      await deploymentObject.save();
      response = await agent.put(`/api/documents/${vnfDocumentResponse.body._id}`).send().expect(200);
      var vnflcmAutoPopContentExpectedWithNoIpv6 = _.cloneDeep(vnflcmAutoPopulateContentValuesExpectedUpdatedKeys);
      vnflcmAutoPopContentExpectedWithNoIpv6.parameters.internal_ipv6_for_db_vm = '::';
      vnflcmAutoPopContentExpectedWithNoIpv6.parameters.internal_ipv6_for_services_vm = '::';
      vnflcmAutoPopContentExpectedWithNoIpv6.parameters.internal_ipv6_subnet_cidr = '::/64';
      vnflcmAutoPopContentExpectedWithNoIpv6.parameters.external_ipv6_for_services_vm = '::';
      vnflcmAutoPopContentExpectedWithNoIpv6.parameters.external_ipv6_subnet_cidr = '::/64';
      vnflcmAutoPopContentExpectedWithNoIpv6.parameters.external_ipv6_subnet_gateway = '::';
      vnflcmAutoPopContentExpectedWithNoIpv6.parameters.ip_version = '4';
      vnflcmAutoPopContentExpectedWithNoIpv6.parameters.dns_server_ip = '1.1.1.1,1.1.1.1';
      response.body.content.should.deepEqual(vnflcmAutoPopContentExpectedWithNoIpv6);
    });

    it('should autopopulate vnflcm_sed keys post project id update', async function () {
      vnfSedSchemaObject = new Schema(vnfSedSchema);
      vnfSedSchemaObjectReturned = await vnfSedSchemaObject.save();
      validVnfSedDocument.schema_id = vnfSedSchemaObjectReturned._id;
      var vnfDocumentResponse = await agent.post('/api/documents').send(validVnfSedDocument).expect(201);
      var vnfDeploymentDocuments = _.find(validVnfDeployment.documents, ['schema_name', 'vnflcm_sed_schema']);
      vnfDeploymentDocuments.document_id = vnfDocumentResponse.body._id;

      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      var enmSedDocumentResponse = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);
      validVnfDeployment.enm.sed_id = enmSedDocumentResponse.body._id;

      podObject = new Pod(validPod);
      podObject.authUrl = 'http://cloud4a.athtem.eei.ericsson.se:5000/v2.0';
      podObjectReturned = await podObject.save();

      validProject.pod_id = podObjectReturned._id;
      projectObject = new Project(validProject);
      projectObjectReturned = await projectObject.save();

      validVnfDeployment.project_id = projectObjectReturned._id;
      deploymentObject = new Deployment(validVnfDeployment);
      await deploymentObject.save();

      projectObject.id = 'updatedValidProjectId';
      projectObject.name = 'updatedValidProjectName';
      projectObject.username = 'updatedUsername';
      projectObject.password = 'updatedUserPassword';

      await agent.put(`/api/projects/${projectObjectReturned._id}`).send(projectObject).expect(200);
      var autopopulatedVnfLcmDocument = await agent.get(`/api/documents/${vnfDocumentResponse.body._id}`).expect(200);
      autopopulatedVnfLcmDocument.body.content.parameters.vim_tenant_id.should.equal('updatedValidProjectId');
      autopopulatedVnfLcmDocument.body.content.parameters.vim_tenant_name.should.equal('updatedValidProjectName');
      autopopulatedVnfLcmDocument.body.content.parameters.vim_name.should.equal('vim_updatedValidProjectName');
      autopopulatedVnfLcmDocument.body.content.parameters.vim_tenant_username.should.equal('updatedUsername');
      autopopulatedVnfLcmDocument.body.content.parameters.vim_tenant_user_password.should.equal('updatedUserPassword');
    });

    it('should revert project update on autopopulate failure', async function () {
      vnfSedSchemaObject = new Schema(vnfSedSchema);
      vnfSedSchemaObjectReturned = await vnfSedSchemaObject.save();
      validVnfSedDocument.schema_id = vnfSedSchemaObjectReturned._id;
      var vnfDocumentResponse = await agent.post('/api/documents').send(validVnfSedDocument).expect(201);
      var vnfDeploymentDocuments = _.find(validVnfDeployment.documents, ['schema_name', 'vnflcm_sed_schema']);
      vnfDeploymentDocuments.document_id = vnfDocumentResponse.body._id;

      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      var enmSedDocumentResponse = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);
      validVnfDeployment.enm.sed_id = enmSedDocumentResponse.body._id;

      podObject = new Pod(validPod);
      podObject.authUrl = 'http://cloud4a.athtem.eei.ericsson.se:5000/v2.0';
      podObjectReturned = await podObject.save();

      validProject.pod_id = podObjectReturned._id;
      projectObject = new Project(validProject);
      projectObjectReturned = await projectObject.save();

      validVnfDeployment.project_id = projectObjectReturned._id;
      deploymentObject = new Deployment(validVnfDeployment);
      await deploymentObject.save();
      projectObject.id = 'updatedValidProjectId';
      projectObject.name = 'updatedValidProjectName';
      projectObject.username = 'updatedUsername';
      projectObject.password = 'updatedUserPassword';
      projectObject.network.ipv4_ranges = [
        {
          start: '131.160.202.10',
          end: '131.160.202.11'
        },
        {
          start: '131.160.202.16',
          end: '131.160.202.17'
        }
      ];

      await agent.put(`/api/projects/${projectObjectReturned._id}`).send(projectObject).expect(422);
      await agent.put(`/api/projects/${projectObjectReturned._id}`).send(projectObject).expect(422);
      await agent.put(`/api/projects/${projectObjectReturned._id}`).send(projectObject).expect(422);
      var autopopulatedVnfLcmDocument = await agent.get(`/api/documents/${vnfDocumentResponse.body._id}`).expect(200);
      autopopulatedVnfLcmDocument.body.content.parameters.vim_tenant_id.should.not.equal('updatedValidProjectId');
      autopopulatedVnfLcmDocument.body.content.parameters.vim_tenant_name.should.not.equal('updatedValidProjectName');
      autopopulatedVnfLcmDocument.body.content.parameters.vim_name.should.not.equal('vim_updatedValidProjectName');
      autopopulatedVnfLcmDocument.body.content.parameters.vim_tenant_username.should.not.equal('updatedUsername');
      autopopulatedVnfLcmDocument.body.content.parameters.vim_tenant_user_password.should.not.equal('updatedUserPassword');
    });

    it('should autopopulate vnf_sed keys during update when a deployment is associated with enm_sed set ipv6 false without ip_version key in enm_sed', async function () {
      vnfSedSchemaObject = new Schema(vnfSedSchema);
      vnfSedSchemaObjectReturned = await vnfSedSchemaObject.save();
      validVnfSedDocument.schema_id = vnfSedSchemaObjectReturned._id;
      var vnfDocumentResponse = await agent.post('/api/documents').send(validVnfSedDocument).expect(201);
      var vnfDeploymentDocuments = _.find(validVnfDeployment.documents, ['schema_name', 'vnflcm_sed_schema']);
      vnfDeploymentDocuments.document_id = vnfDocumentResponse.body._id;

      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      validEnmSedDocument.ipv6 = false;
      documentResponse = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);
      validVnfDeployment.enm.sed_id = documentResponse.body._id;

      podObject = new Pod(validPod);
      podObject.authUrl = 'http://cloud4a.athtem.eei.ericsson.se:5000/v2.0';
      podObject.networks[0].ipv6_subnet = {};
      podObjectReturned = await podObject.save();

      validProject.pod_id = podObjectReturned._id;
      projectObject = new Project(validProject);
      projectObject.network.ipv6_ranges = [];
      projectObjectReturned = await projectObject.save();

      validVnfDeployment.project_id = projectObjectReturned._id;
      deploymentObject = new Deployment(validVnfDeployment);
      await deploymentObject.save();
      response = await agent.put(`/api/documents/${vnfDocumentResponse.body._id}`).send().expect(200);
      var vnflcmAutoPopContentExpectedWithNoIpv6 = _.cloneDeep(vnflcmAutoPopulateContentValuesExpected);
      vnflcmAutoPopContentExpectedWithNoIpv6.parameters.internal_ipv4_for_db_vm = '1.1.1.1';
      vnflcmAutoPopContentExpectedWithNoIpv6.parameters.internal_ipv4_for_services_vm = '1.1.1.1';
      vnflcmAutoPopContentExpectedWithNoIpv6.parameters.external_ipv4_for_services_vm = '1.1.1.1';
      vnflcmAutoPopContentExpectedWithNoIpv6.parameters.internal_ipv6_for_db_vm = '::';
      vnflcmAutoPopContentExpectedWithNoIpv6.parameters.internal_ipv6_for_services_vm = '::';
      vnflcmAutoPopContentExpectedWithNoIpv6.parameters.internal_ipv6_subnet_cidr = '::/64';
      vnflcmAutoPopContentExpectedWithNoIpv6.parameters.external_ipv6_for_services_vm = '::';
      vnflcmAutoPopContentExpectedWithNoIpv6.parameters.external_ipv6_subnet_cidr = '::/64';
      vnflcmAutoPopContentExpectedWithNoIpv6.parameters.external_ipv6_subnet_gateway = '::';
      vnflcmAutoPopContentExpectedWithNoIpv6.parameters.ip_version = '4';
      response.body.content.should.deepEqual(vnflcmAutoPopContentExpectedWithNoIpv6);
    });

    it('should not autopopulate vnf_sed keys during update when a deployment is associated with enm_sed set ipv6 true but no ipv6 input', async function () {
      vnfSedSchemaObject = new Schema(vnfSedSchema);
      vnfSedSchemaObjectReturned = await vnfSedSchemaObject.save();
      validVnfSedDocument.schema_id = vnfSedSchemaObjectReturned._id;
      var vnfDocumentResponse = await agent.post('/api/documents').send(validVnfSedDocument).expect(201);
      var vnfDeploymentDocuments = _.find(validVnfDeployment.documents, ['schema_name', 'vnflcm_sed_schema']);
      vnfDeploymentDocuments.document_id = vnfDocumentResponse.body._id;

      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      validEnmSedDocument.ipv6 = true;
      documentResponse = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);
      validVnfDeployment.enm.sed_id = documentResponse.body._id;

      podObject = new Pod(validPod);
      podObject.authUrl = 'http://cloud4a.athtem.eei.ericsson.se:5000/v2.0';
      podObject.networks[0].ipv6_subnet = {};
      podObjectReturned = await podObject.save();

      validProject.pod_id = podObjectReturned._id;
      projectObject = new Project(validProject);
      projectObject.network.ipv6_ranges = [];
      projectObjectReturned = await projectObject.save();

      validVnfDeployment.project_id = projectObjectReturned._id;
      deploymentObject = new Deployment(validVnfDeployment);
      await deploymentObject.save();
      response = await agent.put(`/api/documents/${vnfDocumentResponse.body._id}`).send().expect(422);
    });

    it('should not use same ip keys in both ENM SED and VNF SED on a ENM SED update', async function () {
      var validSchemaPlusAKey = _.cloneDeep(vnfSedSchema);
      validSchemaPlusAKey.version = '1.2.4';
      validSchemaPlusAKey.content.properties.parameters.properties.newkey = {
        $ref: '#/definitions/ipv4_external'
      };
      vnfSedSchemaObject = new Schema(validSchemaPlusAKey);
      vnfSedSchemaObjectReturned = await vnfSedSchemaObject.save();
      validVnfSedDocument.schema_id = vnfSedSchemaObjectReturned._id;
      var vnfDocumentResponse = await agent.post('/api/documents').send(validVnfSedDocument).expect(201);
      var vnfDeploymentDocuments = _.find(validVnfDeployment.documents, ['schema_name', 'vnflcm_sed_schema']);
      vnfDeploymentDocuments.document_id = vnfDocumentResponse.body._id;
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      documentResponse = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);
      validVnfDeployment.enm.sed_id = documentResponse.body._id;
      podObject = new Pod(validPod);
      podObject.authUrl = 'http://cloud4a.athtem.eei.ericsson.se:5000/v2.0';
      podObjectReturned = await podObject.save();
      validProject.pod_id = podObjectReturned._id;
      validProject.network = {
        name: 'provider_network',
        ipv4_ranges: [
          {
            start: '131.160.202.20',
            end: '131.160.202.36'
          }
        ],
        ipv6_ranges: [
          {
            start: '2001:1b70:6207:0027:0000:0874:1001:0000',
            end: '2001:1b70:6207:0027:0000:0874:1001:0010'
          }
        ]
      };
      projectObject = new Project(validProject);
      projectObjectReturned = await projectObject.save();
      validVnfDeployment.project_id = projectObjectReturned._id;
      deploymentObject = new Deployment(validVnfDeployment);
      await deploymentObject.save();
      response = await agent.put(`/api/documents/${vnfDocumentResponse.body._id}`).send().expect(200);
      documentResponse = await agent.put(`/api/documents/${documentResponse.body._id}`).send().expect(422);
      documentResponse.body.message.should.equal('There are not enough free ipv4 addresses in the ranges to auto populate. Please add more and try again.');
    });

    it('should autopopulate vrrp keys with values not in use by enm seds in same network', async function () {
      vnfSedSchemaObject = new Schema(vnfSedSchema);
      vnfSedSchemaObjectReturned = await vnfSedSchemaObject.save();
      validVnfSedDocument.schema_id = vnfSedSchemaObjectReturned._id;
      validVnfSedDocument.ha = true;
      var vnfDocumentResponse = await agent.post('/api/documents').send(validVnfSedDocument).expect(201);
      var vnfDeploymentDocuments = _.find(validVnfDeployment.documents, ['schema_name', 'vnflcm_sed_schema']);
      vnfDeploymentDocuments.document_id = vnfDocumentResponse.body._id;
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      documentResponse = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);
      validVnfDeployment.enm.sed_id = documentResponse.body._id;
      podObject = new Pod(validPod);
      podObject.authUrl = 'http://cloud4a.athtem.eei.ericsson.se:5000/v2.0';
      podObjectReturned = await podObject.save();

      validProject.pod_id = podObjectReturned._id;
      validProject.network.ipv4_ranges = [
        {
          start: '131.160.202.10',
          end: '131.160.202.50'
        }
      ];
      projectObject = new Project(validProject);
      projectObjectReturned = await projectObject.save();
      validVnfDeployment.project_id = projectObjectReturned._id;
      deploymentObject = new Deployment(validVnfDeployment);
      await deploymentObject.save();
      response = await agent.put(`/api/documents/${vnfDocumentResponse.body._id}`).send().expect(200);
      response.body.content.parameters.db_internal_vrrp_id.should.equal('102');
      response.body.content.parameters.svc_internal_vrrp_id.should.equal('101');
      response.body.content.parameters.svc_external_vrrp_id.should.equal('100');
      response = await agent.put(`/api/documents/${documentResponse.body._id}`).send().expect(200);
      response.body.content.parameters.lvs_external_CM_vrrp_id.should.equal('103');
      response.body.content.parameters.lvs_external_FM_vrrp_id.should.equal('104');
      response.body.content.parameters.lvs_external_PM_vrrp_id.should.equal('105');
      response = await agent.put(`/api/documents/${vnfDocumentResponse.body._id}`).send().expect(200);
      response.body.content.parameters.db_internal_vrrp_id.should.equal('102');
      response.body.content.parameters.svc_internal_vrrp_id.should.equal('101');
      response.body.content.parameters.svc_external_vrrp_id.should.equal('100');
      response = await agent.put(`/api/documents/${documentResponse.body._id}`).send().expect(200);
      response.body.content.parameters.lvs_external_CM_vrrp_id.should.equal('103');
      response.body.content.parameters.lvs_external_FM_vrrp_id.should.equal('104');
      response.body.content.parameters.lvs_external_PM_vrrp_id.should.equal('105');
    });

    it('should autopopulate ha ip address values when ha set true', async function () {
      vnfSedSchemaObject = new Schema(vnfSedSchema);
      vnfSedSchemaObjectReturned = await vnfSedSchemaObject.save();
      validVnfSedDocument.schema_id = vnfSedSchemaObjectReturned._id;
      validVnfSedDocument.ha = true;
      var vnfDocumentResponse = await agent.post('/api/documents').send(validVnfSedDocument).expect(201);
      var vnfDeploymentDocuments = _.find(validVnfDeployment.documents, ['schema_name', 'vnflcm_sed_schema']);
      vnfDeploymentDocuments.document_id = vnfDocumentResponse.body._id;
      enmSedSchema.version = '9.9.9';
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      documentResponse = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);
      validVnfDeployment.enm.sed_id = documentResponse.body._id;
      podObject = new Pod(validPod);
      podObject.authUrl = 'http://cloud4a.athtem.eei.ericsson.se:5000/v2.0';
      podObjectReturned = await podObject.save();

      validProject.pod_id = podObjectReturned._id;
      validProject.network = {
        name: 'provider_network',
        ipv4_ranges: [
          {
            start: '131.160.202.26',
            end: '131.160.202.56'
          }
        ],
        ipv6_ranges: [
          {
            start: '2001:1b70:6207:0027:0000:0874:1001:0000',
            end: '2001:1b70:6207:0027:0000:0874:1001:0040'
          }
        ]
      };
      projectObject = new Project(validProject);
      projectObjectReturned = await projectObject.save();
      validVnfDeployment.project_id = projectObjectReturned._id;
      deploymentObject = new Deployment(validVnfDeployment);
      await deploymentObject.save();
      response = await agent.put(`/api/documents/${vnfDocumentResponse.body._id}`).send().expect(200);
      response = await agent.put(`/api/documents/${documentResponse.body._id}`).send().expect(200);
      response.body.content.parameters.lvs_external_CM_vrrp_id.should.equal('103');
      response.body.content.parameters.lvs_external_FM_vrrp_id.should.equal('104');
      response.body.content.parameters.lvs_external_PM_vrrp_id.should.equal('105');
      response = await agent.put(`/api/documents/${vnfDocumentResponse.body._id}`).send().expect(200);
      response.body.content.parameters.db_internal_vrrp_id.should.equal('102');
      response.body.content.parameters.svc_internal_vrrp_id.should.equal('101');
      response.body.content.parameters.svc_external_vrrp_id.should.equal('100');
      response.body.content.parameters.db_vm_count.should.equal('2');
      response.body.content.parameters.services_vm_count.should.equal('2');
      response.body.content.parameters.internal_ipv4_for_services_vm.should.equal('10.10.0.52,10.10.0.53');
      response.body.content.parameters.external_ipv4_for_services_vm.should.equal('131.160.202.26,131.160.202.27');
      response.body.content.parameters.internal_ipv4_for_db_vm.should.equal('10.10.0.50,10.10.0.51');
      response.body.content.parameters.external_ipv6_for_services_vm.should.equal('2001:1b70:6207:0027:0000:0874:1001:0000,2001:1b70:6207:0027:0000:0874:1001:0001');
      response.body.content.parameters.internal_ipv6_for_services_vm.should.equal('fd5b:1fd5:8295:5339:0000:0000:0000:0034,fd5b:1fd5:8295:5339:0000:0000:0000:0035');
      response.body.content.parameters.internal_ipv6_for_services_vm.should.equal('fd5b:1fd5:8295:5339:0000:0000:0000:0034,fd5b:1fd5:8295:5339:0000:0000:0000:0035');
      response.body.content.parameters.availability_rule.should.equal('anti-affinity');
    });

    it('should autopopulate key values as expected when ha is set true and then when ha is set false', async function () {
      vnfSedSchemaObject = new Schema(vnfSedSchema);
      vnfSedSchemaObjectReturned = await vnfSedSchemaObject.save();
      validVnfSedDocument.schema_id = vnfSedSchemaObjectReturned._id;
      validVnfSedDocument.ha = true;
      var vnfDocumentResponse = await agent.post('/api/documents').send(validVnfSedDocument).expect(201);
      var vnfDeploymentDocuments = _.find(validVnfDeployment.documents, ['schema_name', 'vnflcm_sed_schema']);
      vnfDeploymentDocuments.document_id = vnfDocumentResponse.body._id;
      enmSedSchema.version = '9.9.9';
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      documentResponse = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);
      validVnfDeployment.enm.sed_id = documentResponse.body._id;
      podObject = new Pod(validPod);
      podObject.authUrl = 'http://cloud4a.athtem.eei.ericsson.se:5000/v2.0';
      podObjectReturned = await podObject.save();

      validProject.pod_id = podObjectReturned._id;
      validProject.network = {
        name: 'provider_network',
        ipv4_ranges: [
          {
            start: '131.160.202.26',
            end: '131.160.202.56'
          }
        ],
        ipv6_ranges: [
          {
            start: '2001:1b70:6207:0027:0000:0874:1001:0000',
            end: '2001:1b70:6207:0027:0000:0874:1001:0040'
          }
        ]
      };
      projectObject = new Project(validProject);
      projectObjectReturned = await projectObject.save();
      validVnfDeployment.project_id = projectObjectReturned._id;
      deploymentObject = new Deployment(validVnfDeployment);
      await deploymentObject.save();
      response = await agent.put(`/api/documents/${vnfDocumentResponse.body._id}`).send().expect(200);
      response = await agent.put(`/api/documents/${documentResponse.body._id}`).send().expect(200);
      response.body.content.parameters.lvs_external_CM_vrrp_id.should.equal('103');
      response.body.content.parameters.lvs_external_FM_vrrp_id.should.equal('104');
      response.body.content.parameters.lvs_external_PM_vrrp_id.should.equal('105');
      response = await agent.put(`/api/documents/${vnfDocumentResponse.body._id}`).send().expect(200);
      response.body.content.parameters.db_internal_vrrp_id.should.equal('102');
      response.body.content.parameters.svc_internal_vrrp_id.should.equal('101');
      response.body.content.parameters.svc_external_vrrp_id.should.equal('100');
      response.body.content.parameters.db_vm_count.should.equal('2');
      response.body.content.parameters.services_vm_count.should.equal('2');
      response.body.content.parameters.internal_ipv4_for_services_vm.should.equal('10.10.0.52,10.10.0.53');
      response.body.content.parameters.external_ipv4_for_services_vm.should.equal('131.160.202.26,131.160.202.27');
      response.body.content.parameters.internal_ipv4_for_db_vm.should.equal('10.10.0.50,10.10.0.51');
      response.body.content.parameters.external_ipv6_for_services_vm.should.equal('2001:1b70:6207:0027:0000:0874:1001:0000,2001:1b70:6207:0027:0000:0874:1001:0001');
      response.body.content.parameters.internal_ipv6_for_services_vm.should.equal('fd5b:1fd5:8295:5339:0000:0000:0000:0034,fd5b:1fd5:8295:5339:0000:0000:0000:0035');
      response.body.content.parameters.internal_ipv6_for_db_vm.should.equal('fd5b:1fd5:8295:5339:0000:0000:0000:0032,fd5b:1fd5:8295:5339:0000:0000:0000:0033');
      response.body.content.parameters.availability_rule.should.equal('anti-affinity');
      // Set HA as false
      response.body.ha = false;
      response = await agent.put(`/api/documents/${vnfDocumentResponse.body._id}`).send(response.body).expect(200);
      should.not.exist(response.body.content.parameters.lvs_external_CM_vrrp_id);
      should.not.exist(response.body.content.parameters.lvs_external_FM_vrrp_id);
      should.not.exist(response.body.content.parameters.lvs_external_PM_vrrp_id);
      response.body.content.parameters.db_vm_count.should.equal('1');
      response.body.content.parameters.services_vm_count.should.equal('1');
      response.body.content.parameters.internal_ipv4_for_services_vm.should.equal('10.10.0.52');
      response.body.content.parameters.external_ipv4_for_services_vm.should.equal('131.160.202.26');
      response.body.content.parameters.internal_ipv4_for_db_vm.should.equal('10.10.0.50');
      response.body.content.parameters.external_ipv6_for_services_vm.should.equal('2001:1b70:6207:0027:0000:0874:1001:0000');
      response.body.content.parameters.internal_ipv6_for_services_vm.should.equal('fd5b:1fd5:8295:5339:0000:0000:0000:0034');
      response.body.content.parameters.internal_ipv6_for_db_vm.should.equal('fd5b:1fd5:8295:5339:0000:0000:0000:0032');
      response.body.content.parameters.availability_rule.should.equal('affinity');
    });

    it('should autopopulate key group_server_policy in enm sed which then is reflected as availabilty_rule in vnflcm sed document', async function () {
      // create enm sed
      enmSedSchemaObject = new Schema(enmSedSchemaGroupPolicy);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocumentGroupPolicy.schema_id = enmSedSchemaObjectReturned._id;
      documentResponse = await agent.post('/api/documents').send(validEnmSedDocumentGroupPolicy).expect(201);
      validVnfDeployment.enm.sed_id = documentResponse.body._id;

      // create vnf sed
      vnfSedSchemaObject = new Schema(vnfSedSchemaGroupPolicy);
      vnfSedSchemaObjectReturned = await vnfSedSchemaObject.save();
      validVnfSedDocumentGroupPolicy.schema_id = vnfSedSchemaObjectReturned._id;
      var documentResponse2 = await agent.post('/api/documents').send(validVnfSedDocumentGroupPolicy).expect(201);
      validVnfDeployment.documents[0].document_id = documentResponse2.body._id;

      // create pod
      podObject = new Pod(validPod);
      podObject.authUrl = 'http://cloud4a.athtem.eei.ericsson.se:5000/v2.0';
      podObjectReturned = await podObject.save();
      validProject.pod_id = podObjectReturned._id;
      projectObject = new Project(validProject);
      projectObject.network.ipv4_ranges = [
        {
          start: '131.160.202.10',
          end: '131.160.202.18'
        },
        {
          start: '131.160.202.20',
          end: '131.160.202.40'
        }
      ];
      projectObjectReturned = await projectObject.save();
      validVnfDeployment.project_id = projectObjectReturned._id;
      var enmSedManagedConfigServerPolicy = _.cloneDeep(validEnmSedManagedConfig);

      // Create Label for attaching to Managed Config
      var labelObject = new Label({ name: 'validLabel' });
      await labelObject.save();

      // Attach Label and ENM Schema to Managed Config
      enmSedManagedConfigServerPolicy.labels = ['validLabel'];
      enmSedManagedConfigServerPolicy.schema_id = enmSedSchemaObjectReturned._id;
      enmSedManagedConfigServerPolicy.content.parameters.server_group_policy = 'anti-affinity';

      var managedConfigResponse = await agent.post('/api/documents').send(enmSedManagedConfigServerPolicy).expect(201);
      response = await agent.put(`/api/documents/${documentResponse.body._id}`).send({ managedconfigs: [managedConfigResponse.body._id] }).expect(200); // eslint-disable-line max-len

      // check server_group_policy / availability_rule
      response = await agent.get(`/api/documents/${documentResponse.body._id}`).expect(200);
      response.body.content.parameters.server_group_policy.should.deepEqual('anti-affinity');

      response = await agent.get(`/api/documents/${documentResponse2.body._id}`).expect(200);
      response.body.content.parameters.availability_rule.should.deepEqual('affinity');

      // create deployment
      await agent.post('/api/deployments').send(validVnfDeployment).expect(201);

      // check server_group_policy / availability_rule
      response = await agent.get(`/api/documents/${documentResponse.body._id}`).expect(200);
      response.body.content.parameters.server_group_policy.should.deepEqual('anti-affinity');

      response = await agent.get(`/api/documents/${documentResponse2.body._id}`).expect(200);
      response.body.content.parameters.availability_rule.should.deepEqual('anti-affinity');

      // change managed config with afinity
      var labelObject2 = new Label({ name: 'validLabel2' });
      await labelObject2.save();
      enmSedManagedConfigServerPolicy.name = 'validSedMConfig2';
      enmSedManagedConfigServerPolicy.labels = ['validLabel2'];
      enmSedManagedConfigServerPolicy.schema_id = enmSedSchemaObjectReturned._id;
      enmSedManagedConfigServerPolicy.content.parameters.server_group_policy = 'affinity';

      managedConfigResponse = await agent.post('/api/documents').send(enmSedManagedConfigServerPolicy).expect(201);
      response = await agent.put(`/api/documents/${documentResponse.body._id}`).send({ managedconfigs: [managedConfigResponse.body._id] }).expect(200); // eslint-disable-line max-len

      // check server_group_policy / availability_rule
      response = await agent.get(`/api/documents/${documentResponse.body._id}`).expect(200);
      response.body.content.parameters.server_group_policy.should.deepEqual('affinity');

      response = await agent.get(`/api/documents/${documentResponse2.body._id}`).expect(200);
      response.body.content.parameters.availability_rule.should.deepEqual('affinity');
    });
  });

  describe('GET', function () {
    it('should be able to get a vnflcm sed document', async function () {
      vnfSedSchemaObject = new Schema(vnfSedSchema);
      vnfSedSchemaObjectReturned = await vnfSedSchemaObject.save();
      validVnfSedDocument.schema_id = vnfSedSchemaObjectReturned._id;
      documentResponse = await agent.post('/api/documents').send(validVnfSedDocument).expect(201);
      response = await nonAuthAgent.get('/api/documents/' + documentResponse.body._id).expect(200);
      var content = Object.keys(response.body.content)[0];
      content.should.equal('parameters');
    });

    it('should be able to get a vnflcm sed document with content key "parameters"', async function () {
      vnfSedSchemaObject = new Schema(vnfSedSchema);
      vnfSedSchemaObjectReturned = await vnfSedSchemaObject.save();
      validVnfSedDocument.schema_id = vnfSedSchemaObjectReturned._id;
      documentResponse = await agent.post('/api/documents').send(validVnfSedDocument).expect(201);
      process.env.NODE_ENV = 'policyCheckEnabled';
      process.env.PARAMETER_DEFAULTS_APPLICATION = 'testuser2';
      response = await nonAuthAgent.get('/api/documents/' + documentResponse.body._id).expect(200);
      var content = Object.keys(response.body.content)[0];
      content.should.equal('parameters');
      process.env.NODE_ENV = nodeEnv;
    });

    it('should be able to get vnflcm sed document with content key "parameter_defaults"', async function () {
      vnfSedSchemaObject = new Schema(vnfSedSchema);
      vnfSedSchemaObjectReturned = await vnfSedSchemaObject.save();
      validVnfSedDocument.schema_id = vnfSedSchemaObjectReturned._id;
      documentResponse = await agent.post('/api/documents').send(validVnfSedDocument).expect(201);
      process.env.NODE_ENV = 'policyCheckEnabled';
      process.env.PARAMETER_DEFAULTS_APPLICATION = 'testuser';
      response = await agent.get('/api/documents/' + documentResponse.body._id).expect(200);
      var content = Object.keys(response.body.content)[0];
      content.should.equal('parameter_defaults');
      process.env.NODE_ENV = nodeEnv;
    });
  });

  describe('DELETE', function () {
    beforeEach(async function () {
      count = await Document.count({});
      count.should.equal(0);
      validDocument.schema_id = schema._id;
      document = new Document(validDocument);
      await document.save();
    });

    it('should fail to delete VNF document which is attached to a deployment', async function () {
      vnfSedSchemaObject = new Schema(vnfSedSchema);
      vnfSedSchemaObjectReturned = await vnfSedSchemaObject.save();
      validVnfSedDocument.schema_id = vnfSedSchemaObjectReturned._id;
      var vnfDocumentResponse = await agent.post('/api/documents').send(validVnfSedDocument).expect(201);
      var vnfDeploymentDocuments = _.find(validVnfDeployment.documents, ['schema_name', 'vnflcm_sed_schema']);
      vnfDeploymentDocuments.document_id = vnfDocumentResponse.body._id;
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      documentResponse = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);
      validVnfDeployment.enm.sed_id = documentResponse.body._id;
      podObject = new Pod(validPod);
      podObject.authUrl = 'http://cloud4a.athtem.eei.ericsson.se:5000/v2.0';
      podObjectReturned = await podObject.save();
      validProject.pod_id = podObjectReturned._id;
      projectObject = new Project(validProject);
      projectObjectReturned = await projectObject.save();
      validVnfDeployment.project_id = projectObjectReturned._id;
      deploymentObject = new Deployment(validVnfDeployment);
      await deploymentObject.save();
      response = await agent.put(`/api/documents/${vnfDocumentResponse.body._id}`).send().expect(200);
      response = await agent.delete(`/api/documents/${vnfDocumentResponse.body._id}`).expect(422);
      response.body.message.should.equal('Can\'t delete document, it has 1 dependent deployment');
    });
  });

  afterEach(async function () {
    await User.remove().exec();
    await Group.remove().exec();
    await Pod.remove().exec();
    await Schema.remove().exec();
    await Project.remove().exec();
    await Document.remove().exec();
    await History.remove().exec();
    await Deployment.remove().exec();
    await Label.remove().exec();
  });
});

// Helper function
function removeKeyFromArray(array, keyForRemoval) {
  return array.filter(element => element !== keyForRemoval);
}
