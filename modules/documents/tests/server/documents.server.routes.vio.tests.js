'use strict';

var fs = require('fs');
var should = require('should'),
  superagentDefaults = require('superagent-defaults'),
  supertest = require('supertest'),
  mongoose = require('mongoose'),
  _ = require('lodash'),
  History = require('../../../history/server/models/history.server.model').getSchema('documents'),
  Schema = mongoose.model('Schema'),
  User = mongoose.model('User'),
  Document = mongoose.model('Document'),
  Pod = mongoose.model('Pod'),
  Deployment = mongoose.model('Deployment'),
  Label = mongoose.model('Label'),
  express = require('../../../../config/lib/express');

var app,
  agent,
  validSchema,
  schema,
  vioEnmSedDeploymentTypeSchema,
  vioEnmSedSchema,
  enmSedSchemaObject,
  enmSedSchemaObjectReturned,
  validDocument,
  validVioTrueEnmSedDocument,
  validVioTrueEmptyKeys,
  validVioMultiTechTrueEnmSedDocument,
  validVioTransportOnlyTrueEnmSedDocument,
  validVioOptTransportOnlyTrueEnmSedDocument,
  validVioFalseEnmSedDocument,
  validVioFalseManagedConfig,
  documentReturned,
  response,
  validUser,
  validUser2,
  validUser3,
  userObject,
  userObject2,
  userObject3;

const expectedWhenVioTrue = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/expected_when_vio_true.json', 'utf8'));
const expectedWhenVioFalse = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/expected_when_vio_false.json', 'utf8'));
const expectedWhenVioTransportOnlyTrue = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/expected_when_vio_transport_only_true.json', 'utf8'));
const expectedWhenVioOptTransportOnlyTrue = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/expected_when_vio_optimized_transport_only_true.json', 'utf8'));
const expectedWhenVioMultiTechTrue = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/expected_when_vio_multitech_true.json', 'utf8'));

describe('Documents VIO', function () {
  before(async function () {
    app = express.init(mongoose);
    agent = superagentDefaults(supertest(app));
  });
  beforeEach(async function () {
    validSchema = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/valid_schema.json', 'utf8'));
    validDocument = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/valid_document.json', 'utf8'));
    validVioTrueEnmSedDocument = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/valid_vio_true_enm_sed_document.json', 'utf8'));
    validVioTrueEmptyKeys = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/valid_vio_true_enm_sed_document_remove_empty_keys.json', 'utf8'));
    validVioFalseEnmSedDocument = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/valid_vio_false_enm_sed_document.json', 'utf8'));
    validVioFalseManagedConfig = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/valid_vio_false_managed_config.json', 'utf8'));
    validVioMultiTechTrueEnmSedDocument = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/valid_vio_multitech_true_enm_sed_document.json', 'utf8'));
    validVioTransportOnlyTrueEnmSedDocument = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/valid_vio_transport_only_true_enm_sed_document.json', 'utf8'));
    validVioOptTransportOnlyTrueEnmSedDocument = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/valid_vio_optimized_transport_only_true_enm_sed_document.json', 'utf8'));
    vioEnmSedDeploymentTypeSchema = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/vio_enm_sed_deployment_type_schema.json', 'utf8'));
    vioEnmSedSchema = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/vio_enm_sed_schema.json', 'utf8'));
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

    // Authorise User
    agent.auth(validUser.username, validUser.password);
  });

  describe('POST', function () {
    it('should set enm deployment type key to SIENM_transport_only when vioTransportOnly is True', async function () {
      enmSedSchemaObject = new Schema(vioEnmSedDeploymentTypeSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validVioTransportOnlyTrueEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      validVioTransportOnlyTrueEnmSedDocument.vio = true;
      validVioTransportOnlyTrueEnmSedDocument.vioTransportOnly = true;
      response = await agent.post('/api/documents').send(validVioTransportOnlyTrueEnmSedDocument).expect(201);
      response.body.content.should.deepEqual(expectedWhenVioTransportOnlyTrue);
      response.body.vioTransportOnly.should.equal(true);
      response.body.vioMultiTech.should.equal(false);
      documentReturned = await Document.findById(response.body._id).exec();
      response.body.vioTransportOnly.should.equal(documentReturned.vioTransportOnly);
    });

    it('should set enm deployment type key to OSIENM_transport_only when vioOptimizedTransportOnly is True', async function () {
      enmSedSchemaObject = new Schema(vioEnmSedDeploymentTypeSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validVioOptTransportOnlyTrueEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      validVioOptTransportOnlyTrueEnmSedDocument.vio = true;
      validVioOptTransportOnlyTrueEnmSedDocument.vioOptimizedTransportOnly = true;
      response = await agent.post('/api/documents').send(validVioOptTransportOnlyTrueEnmSedDocument).expect(201);
      response.body.content.should.deepEqual(expectedWhenVioOptTransportOnlyTrue);
      response.body.vioOptimizedTransportOnly.should.equal(true);
      response.body.vioTransportOnly.should.equal(false);
      response.body.vioMultiTech.should.equal(false);
      documentReturned = await Document.findById(response.body._id).exec();
      response.body.vioOptimizedTransportOnly.should.equal(documentReturned.vioOptimizedTransportOnly);
    });

    it('should set enm deployment type key to SIENM_multi_technology when vioMultiTech is True', async function () {
      enmSedSchemaObject = new Schema(vioEnmSedDeploymentTypeSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validVioMultiTechTrueEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      validVioMultiTechTrueEnmSedDocument.vio = true;
      validVioMultiTechTrueEnmSedDocument.vioMultiTech = true;
      response = await agent.post('/api/documents').send(validVioMultiTechTrueEnmSedDocument).expect(201);
      response.body.content.should.deepEqual(expectedWhenVioMultiTechTrue);
      response.body.vioTransportOnly.should.equal(false);
      response.body.vioMultiTech.should.equal(true);
      documentReturned = await Document.findById(response.body._id).exec();
      response.body.vioMultiTech.should.equal(documentReturned.vioMultiTech);
    });

    it('should set vioTransportOnly document option if enm deployment type equal to SIENM_transport_only', async function () {
      enmSedSchemaObject = new Schema(vioEnmSedDeploymentTypeSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validVioTransportOnlyTrueEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      validVioTransportOnlyTrueEnmSedDocument.vioTransportOnly = false;
      validVioTransportOnlyTrueEnmSedDocument.vioMultiTech = false;
      validVioTransportOnlyTrueEnmSedDocument.content.parameters.enm_deployment_type = 'SIENM_transport_only';
      response = await agent.post('/api/documents').send(validVioTransportOnlyTrueEnmSedDocument).expect(201);
      response.body.content.should.deepEqual(expectedWhenVioTransportOnlyTrue);
      response.body.vioTransportOnly.should.equal(true);
      response.body.vioOptimizedTransportOnly.should.equal(false);
      response.body.vioMultiTech.should.equal(false);
      documentReturned = await Document.findById(response.body._id).exec();
      response.body.vioTransportOnly.should.equal(documentReturned.vioTransportOnly);
    });

    it('should set vioOptimizedTransportOnly document option if enm deployment type equal to OSIENM_transport_only', async function () {
      enmSedSchemaObject = new Schema(vioEnmSedDeploymentTypeSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validVioOptTransportOnlyTrueEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      validVioOptTransportOnlyTrueEnmSedDocument.vioTransportOnly = false;
      validVioOptTransportOnlyTrueEnmSedDocument.vioOptimizedTransportOnly = false;
      validVioOptTransportOnlyTrueEnmSedDocument.vioMultiTech = false;
      validVioOptTransportOnlyTrueEnmSedDocument.content.parameters.enm_deployment_type = 'OSIENM_transport_only';
      response = await agent.post('/api/documents').send(validVioOptTransportOnlyTrueEnmSedDocument).expect(201);
      response.body.content.should.deepEqual(expectedWhenVioOptTransportOnlyTrue);
      response.body.vioOptimizedTransportOnly.should.equal(true);
      response.body.vioTransportOnly.should.equal(false);
      response.body.vioMultiTech.should.equal(false);
      documentReturned = await Document.findById(response.body._id).exec();
      response.body.vioOptimizedTransportOnly.should.equal(documentReturned.vioOptimizedTransportOnly);
    });

    it('should set vioMultliTech document option if enm deployment type equal to SIENM_multi_technology', async function () {
      enmSedSchemaObject = new Schema(vioEnmSedDeploymentTypeSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validVioMultiTechTrueEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      validVioMultiTechTrueEnmSedDocument.vioTransportOnly = false;
      validVioMultiTechTrueEnmSedDocument.vioMultiTech = false;
      validVioMultiTechTrueEnmSedDocument.content.parameters.enm_deployment_type = 'SIENM_multi_technology';
      response = await agent.post('/api/documents').send(validVioMultiTechTrueEnmSedDocument).expect(201);
      response.body.content.should.deepEqual(expectedWhenVioMultiTechTrue);
      response.body.vioMultiTech.should.equal(true);
      response.body.vioTransportOnly.should.equal(false);
      documentReturned = await Document.findById(response.body._id).exec();
      response.body.vioMultiTech.should.equal(documentReturned.vioMultiTech);
    });

    it('should set VIO keys to user entered data when VIO is true and autopopulate is true', async function () {
      enmSedSchemaObject = new Schema(vioEnmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validVioTrueEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      validVioTrueEnmSedDocument.vio = true;
      response = await agent.post('/api/documents').send(validVioTrueEnmSedDocument).expect(201);
      response.body.content.should.deepEqual(expectedWhenVioTrue);
      response.body.vio.should.equal(true);
      documentReturned = await Document.findById(response.body._id).exec();
      response.body.vio.should.equal(documentReturned.vio);
    });

    it('should not have VIO key when its removed from required, VIO:true, autopopulate:true', async function () {
      enmSedSchemaObject = new Schema(vioEnmSedSchema);
      var required = removeKeyFromArray(enmSedSchemaObject.content.properties.parameters.required, 'vcenter_system_name');
      enmSedSchemaObject.content.properties.parameters.required = required;
      enmSedSchemaObject.version = '1.2.4';
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validVioTrueEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      delete validVioTrueEnmSedDocument.content.parameters.vcenter_system_name;
      validVioTrueEnmSedDocument.name += 'updated';
      response = await agent.post('/api/documents').send(validVioTrueEnmSedDocument).expect(201);
      should.not.exist(response.body.content.parameters.vcenter_system_name);
    });

    it('should set VIO keys to inactive default values when VIO is false and autopopulate is true', async function () {
      enmSedSchemaObject = new Schema(vioEnmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validVioFalseEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      validVioFalseEnmSedDocument.vio = false;
      response = await agent.post('/api/documents').send(validVioFalseEnmSedDocument).expect(201);
      response.body.content.should.deepEqual(expectedWhenVioFalse);
      response.body.vio.should.equal(false);
      documentReturned = await Document.findById(response.body._id).exec();
      response.body.vio.should.equal(documentReturned.vio);
    });

    it('should not have VIO key when its removed from required, VIO:false, autopopulate:true', async function () {
      enmSedSchemaObject = new Schema(vioEnmSedSchema);
      var required = removeKeyFromArray(enmSedSchemaObject.content.properties.parameters.required, 'vcenter_system_name');
      enmSedSchemaObject.content.properties.parameters.required = required;
      enmSedSchemaObject.version = '1.2.4';
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validVioFalseEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      delete validVioFalseEnmSedDocument.content.parameters.vcenter_system_name;
      validVioFalseEnmSedDocument.name += 'updated';
      response = await agent.post('/api/documents').send(validVioFalseEnmSedDocument).expect(201);
      should.not.exist(response.body.content.parameters.vcenter_system_name);
    });

    it('should set VIO keys to user entered data when VIO is true and autopopulate is false', async function () {
      enmSedSchemaObject = new Schema(vioEnmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validVioTrueEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      validVioTrueEnmSedDocument.vio = true;
      validVioFalseEnmSedDocument.autopopulate = false;
      response = await agent.post('/api/documents').send(validVioTrueEnmSedDocument).expect(201);
      response.body.content.should.deepEqual(expectedWhenVioTrue);
      response.body.vio.should.equal(true);
      documentReturned = await Document.findById(response.body._id).exec();
      response.body.vio.should.equal(documentReturned.vio);
    });

    it('should not have VIO key when its removed from required, VIO:true, autopopulate:false', async function () {
      enmSedSchemaObject = new Schema(vioEnmSedSchema);
      var required = removeKeyFromArray(enmSedSchemaObject.content.properties.parameters.required, 'vcenter_system_name');
      enmSedSchemaObject.content.properties.parameters.required = required;
      enmSedSchemaObject.version = '1.2.4';
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validVioTrueEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      delete validVioTrueEnmSedDocument.content.parameters.vcenter_system_name;
      validVioTrueEnmSedDocument.name += 'updated';
      response = await agent.post('/api/documents').send(validVioTrueEnmSedDocument).expect(201);
      should.not.exist(response.body.content.parameters.vcenter_system_name);
    });

    it('should set VIO keys to inactive default values when VIO is false and autopopulate is false', async function () {
      enmSedSchemaObject = new Schema(vioEnmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validVioFalseEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      validVioFalseEnmSedDocument.vio = false;
      validVioFalseEnmSedDocument.autopopulate = false;
      response = await agent.post('/api/documents').send(validVioFalseEnmSedDocument).expect(201);
      response.body.content.should.deepEqual(expectedWhenVioFalse);
      response.body.vio.should.equal(false);
      documentReturned = await Document.findById(response.body._id).exec();
      response.body.vio.should.equal(documentReturned.vio);
    });

    it('should not have VIO key when its removed from required, VIO:false, autopopulate:false', async function () {
      enmSedSchemaObject = new Schema(vioEnmSedSchema);
      var required = removeKeyFromArray(enmSedSchemaObject.content.properties.parameters.required, 'vcenter_system_name');
      enmSedSchemaObject.content.properties.parameters.required = required;
      enmSedSchemaObject.version = '1.2.4';
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validVioFalseEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      delete validVioFalseEnmSedDocument.content.parameters.vcenter_system_name;
      validVioFalseEnmSedDocument.name += 'updated';
      response = await agent.post('/api/documents').send(validVioFalseEnmSedDocument).expect(201);
      should.not.exist(response.body.content.parameters.vcenter_system_name);
    });

    it('should not introduce vio temp values into managed configs on save', async function () {
      enmSedSchemaObject = new Schema(vioEnmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validVioFalseManagedConfig.schema_id = enmSedSchemaObjectReturned._id;
      response = await agent.post('/api/documents').send(validVioFalseManagedConfig).expect(201);
      should.not.exist(response.body.content.parameters.esxi_host1_ip_vio_mgt);
      should.not.exist(response.body.content.parameters.vcenter_system_name);
      should.not.exist(response.body.content.parameters.vcenter_sso_password);
      should.not.exist(response.body.content.parameters.vcenter_os_password);
      should.not.exist(response.body.content.parameters.vcenter_system_name);
      should.not.exist(response.body.content.parameters.vcenter_object_prefix);
      should.not.exist(response.body.content.parameters.vcenter_drs_username);
    });

    it('should remove empty VIO keys', async function () {
      enmSedSchemaObject = new Schema(vioEnmSedDeploymentTypeSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validVioTransportOnlyTrueEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      validVioTransportOnlyTrueEnmSedDocument.vio = true;
      validVioTransportOnlyTrueEnmSedDocument.vioTransportOnly = true;
      response = await agent.post('/api/documents').send(validVioTransportOnlyTrueEnmSedDocument).expect(201);
      response.body.content.should.deepEqual(expectedWhenVioTransportOnlyTrue);
      response.body.vioTransportOnly.should.equal(true);
      response.body.vioMultiTech.should.equal(false);
      should.exist(response.body.content.parameters.esxi_host1_ip_ilo);
      should.exist(response.body.content.parameters.esxi_host1_ip_vio_mgt);
      should.exist(response.body.content.parameters.esxi_host1_vio_mgt_hostname);
      should.exist(response.body.content.parameters.esxi_host1_mgt_password);
      should.exist(response.body.content.parameters.esxi_host1_ilo_password);
      should.exist(response.body.content.parameters.oms_domain);
      documentReturned = await Document.findById(response.body._id).exec();
      response.body.vioTransportOnly.should.equal(documentReturned.vioTransportOnly);
      validVioTrueEmptyKeys.schema_id = enmSedSchemaObjectReturned._id;
      validVioTrueEmptyKeys.vio = false;
      response = await agent.put(`/api/documents/${response.body._id}`).send(validVioTrueEmptyKeys).expect(200);
      should.exist(response.body.content.parameters.esxi_host1_ip_vsan);
      should.exist(response.body.content.parameters.esxi_host1_ip_vmotion);
      should.not.exist(response.body.content.parameters.esxi_host1_ip_ilo);
      should.not.exist(response.body.content.parameters.esxi_host1_ip_vio_mgt);
      should.not.exist(response.body.content.parameters.esxi_host1_vio_mgt_hostname);
      should.not.exist(response.body.content.parameters.esxi_host1_mgt_password);
      should.not.exist(response.body.content.parameters.esxi_host1_ilo_password);
      should.not.exist(response.body.content.parameters.oms_domain);
    });
  });

  afterEach(async function () {
    await User.remove().exec();
    await Pod.remove().exec();
    await Schema.remove().exec();
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
