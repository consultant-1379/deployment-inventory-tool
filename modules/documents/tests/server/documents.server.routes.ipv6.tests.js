'use strict';

var fs = require('fs');
var should = require('should'),
  superagentDefaults = require('superagent-defaults'),
  supertest = require('supertest'),
  mongoose = require('mongoose'),
  _ = require('lodash'),
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
  validSchema,
  schema,
  enmSedSchema,
  vnfSedSchema,
  ipv6EnmSedSchema,
  enmSedSchemaObject,
  enmSedSchemaObjectReturned,
  vnfSedSchemaObject,
  vnfSedSchemaObjectReturned,
  validDocument,
  validEnmSedDocument,
  validVnfSedDocument,
  validEnmSedManagedConfig,
  documentResponse,
  documentReturned,
  validPod,
  podObject,
  podObjectReturned,
  validProject,
  validProject3,
  validExclusionProject,
  projectObject,
  projectObjectReturned,
  validDeployment,
  validVnfDeployment,
  deploymentObject,
  autoPopulateContentValuesExpected,
  response,
  validUser,
  validUser2,
  validUser3,
  userObject,
  userObject2,
  userObject3,
  validGroup,
  groupObject;

describe('Documents IPv6', function () {
  before(async function () {
    app = express.init(mongoose);
    agent = superagentDefaults(supertest(app));
  });

  beforeEach(async function () {
    autoPopulateContentValuesExpected = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/autopopulate_content_values_expected.json', 'utf8'));
    validSchema = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/valid_schema.json', 'utf8'));
    validDocument = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/valid_document.json', 'utf8'));
    validEnmSedDocument = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/valid_enm_sed_document.json', 'utf8'));
    validVnfSedDocument = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/valid_vnf_sed_document.json', 'utf8'));
    validEnmSedManagedConfig = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/valid_enm_sed_managed_config.json', 'utf8'));
    validPod = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/valid_pod.json', 'utf8'));
    validDeployment = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/valid_deployment.json', 'utf8'));
    validVnfDeployment = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/valid_vnf_deployment.json', 'utf8'));
    validProject = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/valid_project.json', 'utf8'));
    validProject3 = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/valid_exclusion_true_project.json', 'utf8'));
    validExclusionProject = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/valid_exclusion_project.json', 'utf8'));
    enmSedSchema = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/enm_sed_schema.json', 'utf8'));
    ipv6EnmSedSchema = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/ipv6_enm_sed_schema.json', 'utf8'));
    vnfSedSchema = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/vnf_sed_schema.json', 'utf8'));
    validUser = JSON.parse(fs.readFileSync('/opt/mean.js/modules/deployments/tests/server/test_files/valid_user.json', 'utf8'));
    validUser2 = JSON.parse(fs.readFileSync('/opt/mean.js/modules/deployments/tests/server/test_files/valid_user2.json', 'utf8'));
    validUser3 = JSON.parse(fs.readFileSync('/opt/mean.js/modules/deployments/tests/server/test_files/valid_user3.json', 'utf8'));

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
  });

  describe('PUT', function () {
    it('should remove invalid and incorrect ips during autopopulate', async function () {
      var enmSedSchemaObject = new Schema(enmSedSchema);
      var enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      var documentResponse = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);
      validDeployment.enm.sed_id = documentResponse.body._id;
      var PodObject = new Pod(validPod);
      var podObjectReturned = await PodObject.save();
      validProject.pod_id = podObjectReturned._id;
      var ProjectObject = new Project(validProject);
      var projectObjectReturned = await ProjectObject.save();
      validDeployment.project_id = projectObjectReturned._id;
      var DeploymentObject = new Deployment(validDeployment);
      await DeploymentObject.save();
      validEnmSedDocument.content.parameters.singleip1_ip_external = '1.2.3.4';
      validEnmSedDocument.content.parameters.singleip1_ipv6_external = '::';
      response = await agent.put(`/api/documents/${documentResponse.body._id}`).send(validEnmSedDocument).expect(200);
      response.body.content.should.deepEqual(autoPopulateContentValuesExpected);
    });

    it('should not autopopulate with invalid ips given', async function () {
      var enmSedSchemaObject = new Schema(enmSedSchema);
      var enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      var documentResponse = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);
      validDeployment.enm.sed_id = documentResponse.body._id;
      var PodObject = new Pod(validPod);
      var podObjectReturned = await PodObject.save();
      validProject.pod_id = podObjectReturned._id;
      var ProjectObject = new Project(validProject);
      var projectObjectReturned = await ProjectObject.save();
      validDeployment.project_id = projectObjectReturned._id;
      var DeploymentObject = new Deployment(validDeployment);
      await DeploymentObject.save();
      validEnmSedDocument.content.parameters.singleip1_ip_external = 'x.x.x.x';
      validEnmSedDocument.content.parameters.singleip1_ipv6_external = 'x.x.x.x';
      response = await agent.put(`/api/documents/${documentResponse.body._id}`).send(validEnmSedDocument).expect(422);
      response.body.message.should.equal('The ip address given \'x.x.x.x\' is not a valid address');
    });

    it('should remove duplicate ips during autopopulate even with mix of longer and shorter IPv6 address syntax', async function () {
      var enmSedSchemaObject = new Schema(enmSedSchema);
      var enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      var documentResponse = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);
      validDeployment.enm.sed_id = documentResponse.body._id;
      var PodObject = new Pod(validPod);
      var podObjectReturned = await PodObject.save();
      validProject.pod_id = podObjectReturned._id;
      validProject.network.ipv4_ranges = [
        {
          start: '131.160.202.10',
          end: '131.160.202.15'
        },
        {
          start: '131.160.202.16',
          end: '131.160.202.28'
        }
      ];
      var ProjectObject = new Project(validProject);
      var projectObjectReturned = await ProjectObject.save();
      validDeployment.project_id = projectObjectReturned._id;
      var DeploymentObject = new Deployment(validDeployment);
      await DeploymentObject.save();
      validEnmSedDocument.content.parameters.service1_external_ip_list = '131.160.202.10,131.160.202.11,131.160.202.10,131.160.202.11,131.160.202.13';
      validEnmSedDocument.content.parameters.service2_external_ip_list = validEnmSedDocument.content.parameters.service1_external_ip_list;
      validEnmSedDocument.content.parameters.service1_external_ipv6_list = '2001:1b70:6207:27:00:874:1001:0,2001:1b70:6207:0027:0000:0874:1001:0001,2001:1b70:6207:0027:0000:0874:1001:0000,2001:1b70:6207:0027:0000:0874:1001:0001,2001:1b70:6207:0027:0000:0874:1001:0002';
      validEnmSedDocument.content.parameters.service2_external_ipv6_list = validEnmSedDocument.content.parameters.service1_external_ipv6_list;
      response = await agent.put(`/api/documents/${documentResponse.body._id}`).send(validEnmSedDocument).expect(200);
      autoPopulateContentValuesExpected.parameters.service1_external_ipv6_list = '2001:1b70:6207:27:00:874:1001:0,2001:1b70:6207:0027:0000:0874:1001:0001';
      autoPopulateContentValuesExpected.parameters.COM_INF_LDAP_ROOT_SUFFIX = 'dc=ieatenmpd201-17,dc=com';
      autoPopulateContentValuesExpected.parameters.SSO_COOKIE_DOMAIN = 'ieatenmpd201-17.athtem.eei.ericsson.se';
      autoPopulateContentValuesExpected.parameters.enm_laf_1_ip_external = '131.160.202.25';
      autoPopulateContentValuesExpected.parameters.esmon_external_ip_list = '131.160.202.27';
      autoPopulateContentValuesExpected.parameters.esmon_hostname = 'ieatenmpd201-18';
      autoPopulateContentValuesExpected.parameters.haproxy_external_ip_list = '131.160.202.26';
      autoPopulateContentValuesExpected.parameters.httpd_fqdn = 'ieatenmpd201-17.athtem.eei.ericsson.se';
      autoPopulateContentValuesExpected.parameters.laf_url = 'http://131.160.202.25';
      autoPopulateContentValuesExpected.parameters.service2_external_ip_list = '131.160.202.12,131.160.202.14,131.160.202.15,131.160.202.16,131.160.202.17';
      autoPopulateContentValuesExpected.parameters.service3_external_ip_list = '131.160.202.18';
      autoPopulateContentValuesExpected.parameters.singleip1_ip_external = '131.160.202.19';
      autoPopulateContentValuesExpected.parameters.singleip2_ip_external = '131.160.202.20';
      autoPopulateContentValuesExpected.parameters.singleip3_ip_external = '131.160.202.21';
      autoPopulateContentValuesExpected.parameters.svc_CM_vip_external_ip_address = '131.160.202.22';
      autoPopulateContentValuesExpected.parameters.svc_CM_vip_to_fip = '131.160.202.22';
      autoPopulateContentValuesExpected.parameters.svc_FM_vip_external_ip_address = '131.160.202.23';
      autoPopulateContentValuesExpected.parameters.svc_FM_vip_to_fip = '131.160.202.23';
      autoPopulateContentValuesExpected.parameters.svc_PM_vip_external_ip_address = '131.160.202.24';
      autoPopulateContentValuesExpected.parameters.svc_PM_vip_to_fip = '131.160.202.24';
      autoPopulateContentValuesExpected.parameters.service2_external_ipv6_list = '2001:1b70:6207:0027:0000:0874:1001:0003,2001:1b70:6207:0027:0000:0874:1001:0004,2001:1b70:6207:0027:0000:0874:1001:0005,2001:1b70:6207:0027:0000:0874:1001:0006,2001:1b70:6207:0027:0000:0874:1001:0007';
      autoPopulateContentValuesExpected.parameters.service3_external_ipv6_list = '2001:1b70:6207:0027:0000:0874:1001:0008';
      autoPopulateContentValuesExpected.parameters.singleip1_ipv6_external = '2001:1b70:6207:0027:0000:0874:1001:0009';
      autoPopulateContentValuesExpected.parameters.singleip2_ipv6_external = '2001:1b70:6207:0027:0000:0874:1001:000a';
      autoPopulateContentValuesExpected.parameters.singleip3_ipv6_external = '2001:1b70:6207:0027:0000:0874:1001:000b';
      response.body.content.should.deepEqual(autoPopulateContentValuesExpected);
    });

    it('should remove too many ips during autopopulate', async function () {
      var enmSedSchemaObject = new Schema(enmSedSchema);
      var enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      var documentResponse = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);
      validDeployment.enm.sed_id = documentResponse.body._id;
      var PodObject = new Pod(validPod);
      var podObjectReturned = await PodObject.save();
      validProject.pod_id = podObjectReturned._id;
      validProject.network.ipv4_ranges = [
        {
          start: '131.160.202.10',
          end: '131.160.202.15'
        },
        {
          start: '131.160.202.16',
          end: '131.160.202.28'
        }
      ];
      var ProjectObject = new Project(validProject);
      var projectObjectReturned = await ProjectObject.save();
      validDeployment.project_id = projectObjectReturned._id;
      var DeploymentObject = new Deployment(validDeployment);
      await DeploymentObject.save();
      validEnmSedDocument.content.parameters.service1_external_ip_list = '131.160.202.10,2.2.2.2,131.160.202.11,131.160.202.12,131.160.202.14,131.160.202.10';
      validEnmSedDocument.content.parameters.singleip2_ip_external = '131.160.202.24';
      validEnmSedDocument.content.parameters.singleip3_ip_external = '131.160.202.24';
      validEnmSedDocument.content.parameters.service1_external_ipv6_list = '2001:1b70:6207:0027:0000:0874:1001:0000,4001:1b70:6207:0027:0000:0874:1001:0000,2001:1b70:6207:0027:0000:0874:1001:0001,2001:1b70:6207:0027:0000:0874:1001:0002,2001:1b70:6207:0027:0000:0874:1001:0002,2001:1b70:6207:0027:0000:0874:1001:0000';
      response = await agent.put(`/api/documents/${documentResponse.body._id}`).send(validEnmSedDocument).expect(200);
      autoPopulateContentValuesExpected.parameters.singleip2_ip_external = '131.160.202.24';
      autoPopulateContentValuesExpected.parameters.singleip3_ip_external = '131.160.202.23';
      autoPopulateContentValuesExpected.parameters.COM_INF_LDAP_ROOT_SUFFIX = 'dc=ieatenmpd201-18,dc=com';
      autoPopulateContentValuesExpected.parameters.SSO_COOKIE_DOMAIN = 'ieatenmpd201-18.athtem.eei.ericsson.se';
      autoPopulateContentValuesExpected.parameters.enm_laf_1_ip_external = '131.160.202.26';
      autoPopulateContentValuesExpected.parameters.esmon_external_ip_list = '131.160.202.28';
      autoPopulateContentValuesExpected.parameters.esmon_hostname = 'ieatenmpd201-19';
      autoPopulateContentValuesExpected.parameters.haproxy_external_ip_list = '131.160.202.27';
      autoPopulateContentValuesExpected.parameters.httpd_fqdn = 'ieatenmpd201-18.athtem.eei.ericsson.se';
      autoPopulateContentValuesExpected.parameters.laf_url = 'http://131.160.202.26';
      autoPopulateContentValuesExpected.parameters.service2_external_ip_list = '131.160.202.13,131.160.202.15,131.160.202.16,131.160.202.17,131.160.202.18';
      autoPopulateContentValuesExpected.parameters.service3_external_ip_list = '131.160.202.19';
      autoPopulateContentValuesExpected.parameters.singleip1_ip_external = '131.160.202.20';
      autoPopulateContentValuesExpected.parameters.singleip3_ip_external = '131.160.202.21';
      autoPopulateContentValuesExpected.parameters.svc_CM_vip_external_ip_address = '131.160.202.22';
      autoPopulateContentValuesExpected.parameters.svc_CM_vip_to_fip = '131.160.202.22';
      autoPopulateContentValuesExpected.parameters.svc_FM_vip_external_ip_address = '131.160.202.23';
      autoPopulateContentValuesExpected.parameters.svc_FM_vip_to_fip = '131.160.202.23';
      autoPopulateContentValuesExpected.parameters.svc_PM_vip_external_ip_address = '131.160.202.25';
      autoPopulateContentValuesExpected.parameters.svc_PM_vip_to_fip = '131.160.202.25';
      autoPopulateContentValuesExpected.parameters.service2_external_ipv6_list = '2001:1b70:6207:0027:0000:0874:1001:0003,2001:1b70:6207:0027:0000:0874:1001:0004,2001:1b70:6207:0027:0000:0874:1001:0005,2001:1b70:6207:0027:0000:0874:1001:0006,2001:1b70:6207:0027:0000:0874:1001:0007';
      autoPopulateContentValuesExpected.parameters.service3_external_ipv6_list = '2001:1b70:6207:0027:0000:0874:1001:0008';
      autoPopulateContentValuesExpected.parameters.singleip1_ipv6_external = '2001:1b70:6207:0027:0000:0874:1001:0009';
      autoPopulateContentValuesExpected.parameters.singleip2_ipv6_external = '2001:1b70:6207:0027:0000:0874:1001:000a';
      autoPopulateContentValuesExpected.parameters.singleip3_ipv6_external = '2001:1b70:6207:0027:0000:0874:1001:000b';
      response.body.content.should.deepEqual(autoPopulateContentValuesExpected);
    });

    it('should autopopulate 0 instance counts with temporary ips', async function () {
      var enmSedSchemaObject = new Schema(enmSedSchema);
      var enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      var documentResponse = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);
      validDeployment.enm.sed_id = documentResponse.body._id;
      var PodObject = new Pod(validPod);
      var podObjectReturned = await PodObject.save();
      validProject.pod_id = podObjectReturned._id;
      var ProjectObject = new Project(validProject);
      var projectObjectReturned = await ProjectObject.save();
      validDeployment.project_id = projectObjectReturned._id;
      var DeploymentObject = new Deployment(validDeployment);
      await DeploymentObject.save();
      validEnmSedDocument.content.parameters.service2_instances = '0';
      response = await agent.put(`/api/documents/${documentResponse.body._id}`).send(validEnmSedDocument).expect(200);
      response.body.content.parameters.service2_external_ip_list.should.equal('1.1.1.1');
      response.body.content.parameters.service2_external_ipv6_list.should.equal('::');
    });

    it('should remove IPv4 addresses that are in exclusion list of a Project when autopopulation is on during update', async function () {
      // ENM Doc autopop on
      var enmSedSchemaObject = new Schema(enmSedSchema);
      var enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      var documentResponse = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);

      // Update Doc to turn autopop off and change 2 IPv4 fields
      var validDocCustom = documentResponse.body;
      delete validDocCustom.__v;
      delete validDocCustom.updated_at;
      delete validDocCustom.created_at;
      validDocCustom.autopopulate = false;
      validDocCustom.content.parameters.svc_CM_vip_external_ip_address = '131.160.202.22';
      validDocCustom.content.parameters.svc_FM_vip_external_ip_address = '131.160.202.24';
      documentResponse = await agent.put(`/api/documents/${documentResponse.body._id}`).send(validDocCustom).expect(200);
      documentResponse.body.content.parameters.svc_CM_vip_external_ip_address.should.equal('131.160.202.22');
      documentResponse.body.content.parameters.svc_FM_vip_external_ip_address.should.equal('131.160.202.24');
      validDeployment.enm.sed_id = documentResponse.body._id;
      // Pod, Project with exclusion IPv4 addresses, Deployment
      var PodObject = new Pod(validPod);
      var podObjectReturned = await PodObject.save();

      validProject3.pod_id = podObjectReturned._id;
      validProject3.exclusion_ipv4_addresses = [{ ipv4: '131.160.202.22' }, { ipv4: '131.160.202.24' }];
      projectObject = new Project(validProject3);
      projectObjectReturned = await projectObject.save();
      validDeployment.project_id = projectObjectReturned._id;
      var DeploymentObject = new Deployment(validDeployment);
      await DeploymentObject.save();

      // IPv4 addresses should still not be removed
      documentResponse = await agent.get(`/api/documents/${documentResponse.body._id}`).expect(200);
      documentResponse.body.content.parameters.svc_CM_vip_external_ip_address.should.equal('131.160.202.22');
      documentResponse.body.content.parameters.svc_FM_vip_external_ip_address.should.equal('131.160.202.24');

      // Turn autopop on for document
      validDocCustom = documentResponse.body;
      delete validDocCustom.__v;
      delete validDocCustom.updated_at;
      delete validDocCustom.created_at;
      validDocCustom.autopopulate = true;
      validDocCustom.ipv6 = false;
      var response = await agent.put(`/api/documents/${documentResponse.body._id}`).send(validDocCustom).expect(200);
      response.body.content.parameters.svc_CM_vip_external_ip_address.should.equal('131.160.202.21');
      response.body.content.parameters.svc_FM_vip_external_ip_address.should.equal('131.160.202.23');
    });

    it('should remove IPv6 addresses that are in exclusion list of a Project when autopopulation is on during update', async function () {
      // ENM Doc autopop on
      var enmSedSchemaObject = new Schema(enmSedSchema);
      var enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      var documentResponse = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);
      // Update Doc to turn autopop off and change 3 IPv6 fields
      var validDocCustom = documentResponse.body;
      delete validDocCustom.__v;
      delete validDocCustom.updated_at;
      delete validDocCustom.created_at;
      validDocCustom.autopopulate = false;

      validDocCustom.content.parameters.singleip1_ipv6_external = 'fd5b:1fd5:8295:5339:0000:0000:0000:000e';
      validDocCustom.content.parameters.singleip2_ipv6_external = 'fd5b:1fd5:8295:5339:0000:0000:0000:000f';
      validDocCustom.content.parameters.singleip3_ipv6_external = 'fd5b:1fd5:8295:5339:0000:0000:0000:0010';
      documentResponse = await agent.put(`/api/documents/${documentResponse.body._id}`).send(validDocCustom).expect(200);

      documentResponse.body.content.parameters.singleip1_ipv6_external.should.equal('fd5b:1fd5:8295:5339:0000:0000:0000:000e');
      documentResponse.body.content.parameters.singleip2_ipv6_external.should.equal('fd5b:1fd5:8295:5339:0000:0000:0000:000f');
      documentResponse.body.content.parameters.singleip3_ipv6_external.should.equal('fd5b:1fd5:8295:5339:0000:0000:0000:0010');
      validDeployment.enm.sed_id = documentResponse.body._id;
      // Pod, Project with exclusion IPv6 addresses, Deployment
      var PodObject = new Pod(validPod);
      var podObjectReturned = await PodObject.save();
      validProject3.pod_id = podObjectReturned._id;
      validProject3.exclusion_ipv4_addresses = [{}];
      validProject3.exclusion_ipv6_addresses = [{ ipv6: 'fd5b:1fd5:8295:5339:0000:0000:0000:000e' }, { ipv6: 'fd5b:1fd5:8295:5339:0000:0000:0000:000f' }];

      projectObject = new Project(validProject3);
      projectObjectReturned = await projectObject.save();
      validDeployment.project_id = projectObjectReturned._id;
      var DeploymentObject = new Deployment(validDeployment);
      await DeploymentObject.save();

      // ipv6 addresses should still not be removed
      documentResponse = await agent.get(`/api/documents/${documentResponse.body._id}`).expect(200);
      documentResponse.body.content.parameters.singleip1_ipv6_external.should.equal('fd5b:1fd5:8295:5339:0000:0000:0000:000e');
      documentResponse.body.content.parameters.singleip2_ipv6_external.should.equal('fd5b:1fd5:8295:5339:0000:0000:0000:000f');
      documentResponse.body.content.parameters.singleip3_ipv6_external.should.equal('fd5b:1fd5:8295:5339:0000:0000:0000:0010');

      // Turn autopop on for document
      validDocCustom = documentResponse.body;
      delete validDocCustom.__v;
      delete validDocCustom.updated_at;
      delete validDocCustom.created_at;
      validDocCustom.autopopulate = true;
      var response = await agent.put(`/api/documents/${documentResponse.body._id}`).send(validDocCustom).expect(200);

      response.body.content.parameters.singleip1_ipv6_external.should.equal('fd5b:1fd5:8295:5339:0000:0000:0000:0011');
      response.body.content.parameters.singleip2_ipv6_external.should.equal('fd5b:1fd5:8295:5339:0000:0000:0000:0012');
      response.body.content.parameters.singleip3_ipv6_external.should.equal('fd5b:1fd5:8295:5339:0000:0000:0000:0010');
    });
  });

  describe('POST', function () {
    it('should autopopulate ipv6 keys when ipv6 is true and autopopulate is true and deployment exists', async function () {
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      documentResponse = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);
      validDeployment.enm.sed_id = documentResponse.body._id;
      podObject = new Pod(validPod);
      podObjectReturned = await podObject.save();
      validProject.pod_id = podObjectReturned._id;
      var projectObjectReturned = await agent.post('/api/projects').send(validProject).expect(201);
      validDeployment.project_id = projectObjectReturned.body._id;
      await agent.post('/api/deployments').send(validDeployment).expect(201);
      response = await agent.get(`/api/documents/${documentResponse.body._id}`).expect(200);
      response.body.content.should.deepEqual(autoPopulateContentValuesExpected);
    });

    it('should remove ipv6 keys from sed when ipv6 is false and autopopulate is true and no deployment', async function () {
      enmSedSchemaObject = new Schema(ipv6EnmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      validEnmSedDocument.ipv6 = false;
      validEnmSedDocument.autopopulate = true;
      response = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);
      var parameters = Object.keys(response.body.content.parameters);
      for (var element in parameters) {
        if (Object.prototype.hasOwnProperty.call(parameters, element)) {
          var keyName = parameters[element];
          if (!keyName.startsWith('dynamic_ipv6_range_') && keyName !== 'internal_subnet_ipv6') {
            keyName.includes('ipv6').should.be.false();
          }
        }
      }
      should.exist(response.body.content.parameters.dynamic_ipv6_range_start);
      should.exist(response.body.content.parameters.dynamic_ipv6_range_end);
      should.exist(response.body.content.parameters.internal_subnet_ipv6);
      response.body.ipv6.should.equal(false);
      documentReturned = await Document.findById(response.body._id).exec();
      response.body.ipv6.should.equal(documentReturned.ipv6);
    });

    it('should remove ipv6 keys from sed when ipv6 is false and autopopulate is false and no deployment', async function () {
      enmSedSchemaObject = new Schema(ipv6EnmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      validEnmSedDocument.ipv6 = false;
      validEnmSedDocument.autopopulate = false;
      validEnmSedDocument.content.parameters = _.extend(validEnmSedDocument.content.parameters, autoPopulateContentValuesExpected.parameters);
      response = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);
      var parameters = Object.keys(response.body.content.parameters);
      for (var element in parameters) {
        if (Object.prototype.hasOwnProperty.call(parameters, element)) {
          var keyName = parameters[element];
          if (!keyName.startsWith('dynamic_ipv6_range_') && keyName !== 'internal_subnet_ipv6') {
            keyName.includes('ipv6').should.be.false();
          }
        }
      }
      should.exist(response.body.content.parameters.dynamic_ipv6_range_start);
      should.exist(response.body.content.parameters.dynamic_ipv6_range_end);
      should.exist(response.body.content.parameters.internal_subnet_ipv6);
      response.body.ipv6.should.equal(false);
      documentReturned = await Document.findById(response.body._id).exec();
      response.body.ipv6.should.equal(documentReturned.ipv6);
    });

    it('should gracefully handle when a IPv6 range start is higher than range end and total available IPs becomes a negative number', async function () {
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      validEnmSedDocument.content.parameters.internal_subnet_ipv6 = 'fd5b:1fd5:8295:5330:0000:0000:0000:0000/64';
      documentResponse = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);
      validDeployment.enm.sed_id = documentResponse.body._id;
      podObject = new Pod(validPod);
      podObjectReturned = await podObject.save();
      validProject.pod_id = podObjectReturned._id;
      projectObject = new Project(validProject);
      projectObjectReturned = await projectObject.save();
      validDeployment.project_id = projectObjectReturned._id;
      response = await agent.post('/api/deployments').send(validDeployment).expect(422);
      response.body.message.should.equal('ipv6 Range end cannot be lower than range start. Please review subnet values within SED.');
    });

    it('should gracefully handle when a IPv4 range start is higher than range end and total available IPs becomes a negative number', async function () {
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      validEnmSedDocument.content.parameters.internal_subnet = '10.9.0.0/21';
      documentResponse = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);
      validDeployment.enm.sed_id = documentResponse.body._id;
      podObject = new Pod(validPod);
      podObjectReturned = await podObject.save();
      validProject.pod_id = podObjectReturned._id;
      projectObject = new Project(validProject);
      projectObjectReturned = await projectObject.save();
      validDeployment.project_id = projectObjectReturned._id;
      response = await agent.post('/api/deployments').send(validDeployment).expect(422);
      response.body.message.should.equal('ipv4 Range end cannot be lower than range start. Please review subnet values within SED.');
    });

    it('should set Ipv6 keys to user entered values when ipv6 is true and autopopulate is false and deployment exists', async function () {
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      validEnmSedDocument.autopopulate = false;
      validEnmSedDocument.content.parameters = _.extend(validEnmSedDocument.content.parameters, autoPopulateContentValuesExpected.parameters);
      documentResponse = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);
      validDeployment.enm.sed_id = documentResponse.body._id;
      podObject = new Pod(validPod);
      podObjectReturned = await podObject.save();
      validProject.pod_id = podObjectReturned._id;
      projectObject = new Project(validProject);
      projectObjectReturned = await projectObject.save();
      validDeployment.project_id = projectObjectReturned._id;
      deploymentObject = new Deployment(validDeployment);
      await deploymentObject.save();
      response = await agent.put(`/api/documents/${documentResponse.body._id}`).send().expect(200);
      response.body.content.should.deepEqual(autoPopulateContentValuesExpected);
    });

    it('should not autopopulate enm_sed keys during update when theres not enough IPv6 addresses in the project ranges', async function () {
      var enmSedSchemaObject = new Schema(enmSedSchema);
      var enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      var documentResponse = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);
      validDeployment.enm.sed_id = documentResponse.body._id;
      var PodObject = new Pod(validPod);
      var podObjectReturned = await PodObject.save();
      validProject.pod_id = podObjectReturned._id;
      validProject.network.ipv6_ranges = [
        {
          start: '2001:1b70:6207:0027:0000:0874:1001:0000',
          end: '2001:1b70:6207:0027:0000:0874:1001:0002'
        },
        {
          start: '2001:1b70:6207:0027:0000:0874:1001:0005',
          end: '2001:1b70:6207:0027:0000:0874:1001:0009'
        }
      ];
      var ProjectObject = new Project(validProject);
      var projectObjectReturned = await ProjectObject.save();
      validDeployment.project_id = projectObjectReturned._id;
      response = await agent.post('/api/deployments').send(validDeployment).expect(422);
      response.body.message.should.equal('There are not enough free IPv6 addresses in the project ranges to auto populate. 11 IPv6 addresses are required in total but the project ranges only have 8 IPv6 addresses in total. Please add more and try again.');
    });

    it('should not autopopulate enm_sed keys during update when theres not enough IPv6 addresses in the internal network range', async function () {
      var enmSedSchemaObject = new Schema(enmSedSchema);
      var enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      validEnmSedDocument.content.parameters.dynamic_ipv6_range_end = 'fd5b:1fd5:8295:5339:ffff:ffff:ffff:fffd';
      var documentResponse = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);
      validDeployment.enm.sed_id = documentResponse.body._id;
      var PodObject = new Pod(validPod);
      var podObjectReturned = await PodObject.save();
      validProject.pod_id = podObjectReturned._id;
      var ProjectObject = new Project(validProject);
      var projectObjectReturned = await ProjectObject.save();
      validDeployment.project_id = projectObjectReturned._id;
      response = await agent.post('/api/deployments').send(validDeployment).expect(422);
      response.body.message.should.equal('There are not enough free IPv6 addresses in the internal ranges to auto populate. 3 IPv6 addresses are required in total but the internal ranges only have 2 IPv6 addresses in total. Please add more and try again.');
    });

    it('should not use same ipv6 keys in both ENM SED and VNF SED on a VNF SED update', async function () {
      var validSchemaPlusAKey = _.cloneDeep(vnfSedSchema);
      validSchemaPlusAKey.version = '1.2.4';
      validSchemaPlusAKey.content.properties.parameters.properties.newkey = {
        $ref: '#/definitions/ipv6_external'
      };
      vnfSedSchemaObject = new Schema(validSchemaPlusAKey);
      vnfSedSchemaObjectReturned = await vnfSedSchemaObject.save();
      validVnfSedDocument.schema_id = vnfSedSchemaObjectReturned._id;
      var vnfDocumentResponse = await agent.post('/api/documents').send(validVnfSedDocument).expect(201);
      validVnfDeployment.documents = [
        {
          schema_name: 'vnflcm_sed_schema',
          document_id: vnfDocumentResponse.body._id,
          schema_category: 'vnflcm'
        }
      ];
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
            end: '131.160.202.200'
          }
        ],
        ipv6_ranges: [
          {
            start: '2001:1b70:6207:0027:0000:0874:1001:0000',
            end: '2001:1b70:6207:0027:0000:0874:1001:000a'
          }
        ]
      };
      projectObject = new Project(validProject);
      projectObjectReturned = await projectObject.save();
      validVnfDeployment.project_id = projectObjectReturned._id;
      response = await agent.post('/api/deployments').send(validVnfDeployment).expect(422);
      response.body.message.should.equal('There are not enough free ipv6 addresses in the ranges to auto populate. Please add more and try again.');
    });

    it('should not use same ipv6 keys in both ENM SED and VNF SED on a ENM SED update', async function () {
      var validSchemaPlusAKey = _.cloneDeep(vnfSedSchema);
      validSchemaPlusAKey.version = '1.2.4';
      validSchemaPlusAKey.content.properties.parameters.properties.newkey = {
        $ref: '#/definitions/ipv6_external'
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
            end: '131.160.202.220'
          }
        ],
        ipv6_ranges: [
          {
            start: '2001:1b70:6207:0027:0000:0874:1001:0000',
            end: '2001:1b70:6207:0027:0000:0874:1001:000a'
          }
        ]
      };
      projectObject = new Project(validProject);
      projectObjectReturned = await projectObject.save();
      validVnfDeployment.project_id = projectObjectReturned._id;
      response = await agent.post('/api/deployments').send(validVnfDeployment).expect(422);
      response.body.message.should.equal('There are not enough free ipv6 addresses in the ranges to auto populate. Please add more and try again.');
    });

    it('should not remove ipv6 keys from sed when ipv6 is false and autopopulate is true and no deployment in old sed', async function () {
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      validEnmSedDocument.ipv6 = false;
      validEnmSedDocument.autopopulate = true;
      response = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);
      var sedKeys = sedKeyList(validEnmSedDocument);
      var responseKeys = responseKeyList(response);
      sedKeys.every(function (val) { return responseKeys.indexOf(val) >= 0; }).should.be.true();
    });

    it('should not remove ipv6 keys from sed when ipv6 is false and autopopulate is false and no deployment in old sed', async function () {
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      validEnmSedDocument.ipv6 = false;
      validEnmSedDocument.autopopulate = false;
      validEnmSedDocument.content.parameters = _.extend(validEnmSedDocument.content.parameters, autoPopulateContentValuesExpected.parameters);
      response = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);
      var sedKeys = sedKeyList(validEnmSedDocument);
      var responsekeys = responseKeyList(response);
      sedKeys.every(function (val) { return responsekeys.indexOf(val) >= 0; }).should.be.true();
    });

    it('should not use same IPv6 keys in both ENM SED and Exclusion IP addresses from project on a ENM SED update with deployment', async function () {
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      documentResponse = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);
      validDeployment.enm.sed_id = documentResponse.body._id;
      podObject = new Pod(validPod);
      podObjectReturned = await podObject.save();
      validExclusionProject.pod_id = podObjectReturned._id;
      projectObject = new Project(validExclusionProject);
      projectObjectReturned = await projectObject.save();
      validDeployment.project_id = projectObjectReturned._id;
      response = await agent.post('/api/deployments').send(validDeployment).expect(422);
      response.body.message.should.equal('There are not enough free ipv6 addresses in the ranges to auto populate. Please add more and try again.');
    });

    it('should not use same IPv4 keys in both ENM SED and Exclusion IP addresses from project on a ENM SED update with deployment', async function () {
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      documentResponse = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);
      validDeployment.enm.sed_id = documentResponse.body._id;
      podObject = new Pod(validPod);
      podObjectReturned = await podObject.save();
      validExclusionProject.pod_id = podObjectReturned._id;
      validExclusionProject.exclusion_ipv4_addresses = [
        {
          ipv4: '131.160.202.10'
        },
        {
          ipv4: '131.160.202.11'
        },
        {
          ipv4: '131.160.202.12'
        },
        {
          ipv4: '131.160.202.13'
        },
        {
          ipv4: '131.160.202.14'
        },
        {
          ipv4: '131.160.202.15'
        },
        {
          ipv4: '131.160.202.16'
        },
        {
          ipv4: '131.160.202.17'
        },
        {
          ipv4: '131.160.202.18'
        },
        {
          ipv4: '131.160.202.19'
        },
        {
          ipv4: '131.160.202.20'
        },
        {
          ipv4: '131.160.202.21'
        },
        {
          ipv4: '131.160.202.22'
        },
        {
          ipv4: '131.160.202.23'
        },
        {
          ipv4: '131.160.202.24'
        },
        {
          ipv4: '131.160.202.25'
        },
        {
          ipv4: '131.160.202.26'
        },
        {
          ipv4: '131.160.202.27'
        }
      ];
      validExclusionProject.exclusion_ipv6_addresses = [
        {
          ipv6: 'fd5b:1fd5:8295:5339:0000:0000:0000:0005'
        }
      ];
      projectObject = new Project(validExclusionProject);
      projectObjectReturned = await projectObject.save();
      validDeployment.project_id = projectObjectReturned._id;
      response = await agent.post('/api/deployments').send(validDeployment).expect(422);
      response.body.message.should.equal('There are not enough free ipv4 addresses in the ranges to auto populate. Please add more and try again.');
    });

    it('should not use exclusion IPv4 addresses from Project when Document gets added to a Deployment', async function () {
      // ENM Doc autopop on
      var enmSedSchemaObject = new Schema(enmSedSchema);
      var enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      var documentResponse = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);

      // Pod, Project with exclusion IPv4 addresses, Deployment
      var PodObject = new Pod(validPod);
      var podObjectReturned = await PodObject.save();
      var validProjectCustom = _.cloneDeep(validProject);
      validProjectCustom.network.ipv4_ranges = [
        {
          start: '131.160.202.10',
          end: '131.160.202.15'
        },
        {
          start: '131.160.202.20',
          end: '131.160.202.32'
        }
      ];
      validProjectCustom.pod_id = podObjectReturned._id;
      validProjectCustom.exclusion_ipv4_addresses = [{ ipv4: '131.160.202.22' }, { ipv4: '131.160.202.24' }];
      var ProjectObject = new Project(validProjectCustom);
      var projectObjectReturned = await ProjectObject.save();
      // Add to Deployment
      validDeployment.enm.sed_id = documentResponse.body._id;
      validDeployment.project_id = projectObjectReturned._id;
      // use API so document resave gets triggered
      await agent.post('/api/deployments').send(validDeployment).expect(201);

      // IPv4 addresses should still not be removed
      documentResponse = await agent.get(`/api/documents/${documentResponse.body._id}`).expect(200);
      documentResponse.body.content.parameters.svc_CM_vip_external_ip_address.should.equal('131.160.202.27');
      documentResponse.body.content.parameters.svc_FM_vip_external_ip_address.should.equal('131.160.202.28');
    });

    it('should not use exclusion IPv6 addresses from Project when Document gets added to a Deployment', async function () {
      // ENM Doc autopop on
      var enmSedSchemaObject = new Schema(enmSedSchema);
      var enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      var documentResponse = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);

      // Pod, Project with exclusion IPv6 addresses, Deployment
      var PodObject = new Pod(validPod);
      var podObjectReturned = await PodObject.save();
      validProject3.pod_id = podObjectReturned._id;
      validProject3.exclusion_ipv4_addresses = [{}];
      validProject3.exclusion_ipv6_addresses = [{ ipv6: 'fd5b:1fd5:8295:5339:0000:0000:0000:000e' }, { ipv6: 'fd5b:1fd5:8295:5339:0000:0000:0000:000f' }];

      var ProjectObject = new Project(validProject3);
      var projectObjectReturned = await ProjectObject.save();

      // Add to Deployment
      validDeployment.enm.sed_id = documentResponse.body._id;
      validDeployment.project_id = projectObjectReturned._id;
      // use API so document resave gets triggered
      await agent.post('/api/deployments').send(validDeployment).expect(201);

      // IPv6 addresses should still not be removed
      documentResponse = await agent.get(`/api/documents/${documentResponse.body._id}`).expect(200);
      documentResponse.body.content.parameters.singleip1_ipv6_external.should.equal('fd5b:1fd5:8295:5339:0000:0000:0000:0010');
      documentResponse.body.content.parameters.singleip2_ipv6_external.should.equal('fd5b:1fd5:8295:5339:0000:0000:0000:0011');
      documentResponse.body.content.parameters.singleip3_ipv6_external.should.equal('fd5b:1fd5:8295:5339:0000:0000:0000:0012');
    });

    it('should throw an error if autopopulation is on and Managed Config includes an IP thats in exclusion list of a Project', async function () {
      // ENM Doc autopop on
      var enmSedSchemaObject = new Schema(enmSedSchema);
      var enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      var documentResponse = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);

      // Update Doc to turn autopop off, change 3 IPv6 fields, add managed config
      var validDocCustom = documentResponse.body;
      delete validDocCustom.__v;
      delete validDocCustom.updated_at;
      delete validDocCustom.created_at;
      validDocCustom.autopopulate = false;
      validDocCustom.managedconfigs = [];

      validDocCustom.content.parameters.singleip1_ipv6_external = '2001:1b70:6207:0027:0000:0874:1001:0008';
      validDocCustom.content.parameters.singleip2_ipv6_external = '2001:1b70:6207:0027:0000:0874:1001:0009';
      validDocCustom.content.parameters.singleip3_ipv6_external = '2001:1b70:6207:0027:0000:0874:1001:000a';

      // add Managed Config
      validEnmSedManagedConfig.schema_id = enmSedSchemaObjectReturned._id;
      validEnmSedManagedConfig.content.parameters.singleip3_ipv6_external = '2001:1b70:6207:0027:0000:0874:1001:0033';
      validEnmSedManagedConfig.content.parameters.singleip1_ip_external = '131.160.202.24';
      var managedConfigResponse = await agent.post('/api/documents').send(validEnmSedManagedConfig).expect(201);
      validDocCustom.managedconfigs.push(managedConfigResponse.body._id);

      documentResponse = await agent.put(`/api/documents/${documentResponse.body._id}`).send(validDocCustom).expect(200);
      documentResponse.body.content.parameters.singleip1_ipv6_external.should.equal('2001:1b70:6207:0027:0000:0874:1001:0008');
      documentResponse.body.content.parameters.singleip2_ipv6_external.should.equal('2001:1b70:6207:0027:0000:0874:1001:0009');
      documentResponse.body.content.parameters.singleip3_ipv6_external.should.equal('2001:1b70:6207:0027:0000:0874:1001:0033');
      validDeployment.enm.sed_id = documentResponse.body._id;
      // Pod, Project with exclusion IPv4 IPv6 addresses, Deployment
      var PodObject = new Pod(validPod);
      var podObjectReturned = await PodObject.save();
      var validProjectCustom = _.cloneDeep(validProject);
      validProjectCustom.pod_id = podObjectReturned._id;
      validProjectCustom.network.ipv4_ranges = [
        {
          start: '131.160.202.10',
          end: '131.160.202.15'
        },
        {
          start: '131.160.202.20',
          end: '131.160.202.32'
        }
      ];
      validProjectCustom.exclusion_ipv4_addresses = [{ ipv4: '131.160.202.22' }, { ipv4: '131.160.202.24' }];
      validProjectCustom.exclusion_ipv6_addresses = [{ ipv6: '2001:1b70:6207:0027:0000:0874:1001:0033' }, { ipv6: '2001:1b70:6207:0027:0000:0874:1001:000a' }];
      var ProjectObject = new Project(validProjectCustom);
      var projectObjectReturned = await ProjectObject.save();
      validDeployment.project_id = projectObjectReturned._id;
      var DeploymentObject = new Deployment(validDeployment);
      await DeploymentObject.save();

      documentResponse = await agent.get(`/api/documents/${documentResponse.body._id}`).expect(200);
      documentResponse.body.content.parameters.singleip1_ipv6_external.should.equal('2001:1b70:6207:0027:0000:0874:1001:0008');
      documentResponse.body.content.parameters.singleip2_ipv6_external.should.equal('2001:1b70:6207:0027:0000:0874:1001:0009');
      documentResponse.body.content.parameters.singleip3_ipv6_external.should.equal('2001:1b70:6207:0027:0000:0874:1001:0033');

      // Turn autopop on for document and PUT
      validDocCustom = documentResponse.body;
      delete validDocCustom.__v;
      delete validDocCustom.updated_at;
      delete validDocCustom.created_at;
      validDocCustom.autopopulate = true;
      var response = await agent.put(`/api/documents/${documentResponse.body._id}`).send(validDocCustom).expect(422);
      response.body.message.should.equal('2001:1b70:6207:0027:0000:0874:1001:0033,131.160.202.24 cannot be part of validSedMConfig while autopopulation is on, as its in the exclusion IP list of validProject Project.');
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

function sedKeyList(validEnmSedDocument) {
  var validKeyNameArray = [];
  var parameters = Object.keys(validEnmSedDocument.content.parameters);
  for (var element in parameters) {
    if (Object.prototype.hasOwnProperty.call(parameters, element)) {
      var validKeyName = parameters[element];
      validKeyNameArray.push(validKeyName);
    }
  }
  return validKeyNameArray;
}

function responseKeyList(response) {
  var keyNameArray = [];
  var parameters = Object.keys(response.body.content.parameters);
  for (var element in parameters) {
    if (Object.prototype.hasOwnProperty.call(parameters, element)) {
      var keyName = parameters[element];
      keyNameArray.push(keyName);
    }
  }
  return keyNameArray;
}
