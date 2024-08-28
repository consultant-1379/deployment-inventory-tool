'use strict';

var fs = require('fs'),
  should = require('should'),
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
  nonAuthAgent,
  validSchema,
  validcENMSchemaIPv4,
  validcENMSchemaIPv6,
  validSchemaWithDefaults,
  validSchemaMinusAKey,
  _validSchemaMinusAKey,
  validSchemaPlusAKey,
  _validSchemaPlusAKey,
  schema,
  cENMSchemaIPv4,
  cENMScehmaIPv6,
  cenmSedSchema1,
  cenmSedSchema2,
  enmSedSchemaWithNbAlarmIrp,
  ValidENMSedDocumentWithNbAalrmIrp,
  enmSedSchema,
  enmSedSchema2,
  enmSedSchemaWithExtraVrrp,
  enmSedSchemaObject,
  enmSedSchemaObjectReturned,
  cenmSedSchemaObject,
  cenmSchemaObjectReturned,
  validDocument,
  validcENMDocument,
  validcENMDocumentIPv6,
  validEnmSedDocument,
  validEnmSedManagedConfig,
  badDocument,
  _badDocument,
  _documentUpdated,
  partialDocument,
  document,
  validDocumentUpdate,
  documentObject,
  documentResponse,
  documentReturned,
  document2,
  validPod,
  podObject,
  podObjectReturned,
  validProject,
  validProject2,
  validExclusionTrueProject,
  projectObject,
  projectObjectReturned,
  validDeployment,
  deploymentObject,
  count,
  autoPopulateContentValuesExpected,
  autoPopulateCENMContentValuesExpected,
  autoPopulateCENMContentValuesExpectedIPv6,
  labelObject,
  logReturned,
  response,
  vrrpKeys,
  validECNManagedConfigWithOvercommitFlavors,
  validUser,
  validUser2,
  validUser3,
  userObject,
  userObject2,
  userObject3,
  validGroup,
  groupObject,
  groupReturned,
  validVnflcmSchema,
  validVnflcmSchema2,
  validVnflcmDocument,
  vnflcmSchema;

var enmOnlyFields = [
  'dns', 'managedconfigs', 'ipv6', 'overcommit', 'vio', 'vioMultiTech',
  'vioTransportOnly', 'vioOptimizedTransportOnly', 'useexternalnfs'
];

var mcOnlyFields = [
  'labels'
];

var allFields = [...enmOnlyFields, ...mcOnlyFields];

const autoPopulateContentTemporaryValuesExpected = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/autopopulate_content_temporary_values_expected.json', 'utf8'));
const autoPopulateContentTemporarycENMValuesExpected = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/cenm_autopopulate_temporary_values_expected.json', 'utf8'));
const autoPopulateContentTemporarycENMValuesExpectedIPv6 = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/cenm_autopopulate_temporary_values_expected_ipv6.json', 'utf8'));

var nodeEnv = process.env.NODE_ENV;

describe('Documents', function () {
  before(async function () {
    app = express.init(mongoose);
    nonAuthAgent = superagentDefaults(supertest(app));
    agent = superagentDefaults(supertest(app));
  });
  beforeEach(async function () {
    autoPopulateContentValuesExpected = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/autopopulate_content_values_expected.json', 'utf8'));
    autoPopulateCENMContentValuesExpected = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/cenm_autopopulate_values_expected.json', 'utf8'));
    autoPopulateCENMContentValuesExpectedIPv6 = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/cenm_autopopulate_values_expected_ipv6.json', 'utf8'));
    validSchema = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/valid_schema.json', 'utf8'));
    validcENMSchemaIPv4 = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/valid_cENM_schema.json', 'utf8'));
    validcENMSchemaIPv6 = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/valid_cENM_schema_ipv6.json', 'utf8'));
    validSchemaWithDefaults = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/valid_schema_with_defaults.json', 'utf8'));
    validDocument = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/valid_document.json', 'utf8'));
    validcENMDocument = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/valid_cenm_sed_document.json', 'utf8'));
    validcENMDocumentIPv6 = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/valid_cenm_sed_document_ipv6.json', 'utf8'));
    ValidENMSedDocumentWithNbAalrmIrp = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/valid_enm_sed_document_nbalarm.json', 'utf8'));
    validEnmSedDocument = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/valid_enm_sed_document.json', 'utf8'));
    validEnmSedManagedConfig = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/valid_enm_sed_managed_config.json', 'utf8'));
    validECNManagedConfigWithOvercommitFlavors = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/valid_ecn_managedConfig_with_overcommit_flavors.json', 'utf8'));
    validPod = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/valid_pod.json', 'utf8'));
    validDeployment = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/valid_deployment.json', 'utf8'));
    validProject = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/valid_project.json', 'utf8'));
    validProject2 = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/valid_project2.json', 'utf8'));
    validExclusionTrueProject = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/valid_exclusion_true_project.json', 'utf8'));
    enmSedSchema = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/enm_sed_schema.json', 'utf8'));
    enmSedSchema2 = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/enm_sed_schema2.json', 'utf8'));
    enmSedSchemaWithExtraVrrp = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/enm_sed_schema_with_extra_vrrp.json', 'utf8'));
    cenmSedSchema1 = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/cenm_schema_1.json', 'utf8'));
    cenmSedSchema2 = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/cenm_schema_2.json', 'utf8'));
    enmSedSchemaWithNbAlarmIrp = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/enm_sed_schema_nbalarm.json', 'utf8'));
    validUser = JSON.parse(fs.readFileSync('/opt/mean.js/modules/deployments/tests/server/test_files/valid_user.json', 'utf8'));
    validUser2 = JSON.parse(fs.readFileSync('/opt/mean.js/modules/deployments/tests/server/test_files/valid_user2.json', 'utf8'));
    validUser3 = JSON.parse(fs.readFileSync('/opt/mean.js/modules/deployments/tests/server/test_files/valid_user3.json', 'utf8'));

    validVnflcmSchema = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/vnf_sed_schema.json', 'utf8'));
    validVnflcmSchema2 = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/vnf_sed_schema2.json', 'utf8'));
    validVnflcmDocument = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/valid_vnf_sed_document.json', 'utf8'));

    schema = new Schema(validSchema);
    await schema.save();
    cENMSchemaIPv4 = new Schema(validcENMSchemaIPv4);
    await cENMSchemaIPv4.save();
    cENMScehmaIPv6 = new Schema(validcENMSchemaIPv6);
    await cENMScehmaIPv6.save();

    validDocument.schema_id = schema._id;
    validcENMDocument.schema_id = cENMSchemaIPv4._id;
    validcENMDocumentIPv6.schema_id = cENMScehmaIPv6._id;
    vrrpKeys = ['lvs_external_CM_vrrp_id', 'lvs_external_PM_vrrp_id', 'lvs_external_FM_vrrp_id'];

    validDocumentUpdate = { name: '_updatedDocument' };
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
    groupReturned = await groupObject.save();

    // Authorise User
    agent.auth(validUser.username, validUser.password);
  });

  describe('POST', function () {
    it('should not create a new document when user is not authenticated', async function () {
      response = await nonAuthAgent.post('/api/documents').send(validDocument).expect(401);
      response.body.message.should.equal('User must be logged in');
    });

    it('should create a new document and check db', async function () {
      response = await agent.post('/api/documents').send(validDocument).expect(201);
      response.body._id.should.have.length(24);
      response.headers.location.should.equal(`/api/documents/${response.body._id}`);
      response.body.name.should.equal(validDocument.name);
      response.body.content.should.deepEqual(validDocument.content);
      documentReturned = await Document.findById(response.body._id).exec();
      documentReturned.name.should.equal(validDocument.name);
      documentReturned.content.should.deepEqual(validDocument.content);
      var currentDate = new Date();
      var createdAtDate = new Date(documentReturned.created_at);
      var updatedAtDate = new Date(documentReturned.updated_at);
      var createdAtDateDifference = currentDate.getTime() - createdAtDate.getTime();
      var updatedAtDateDifference = currentDate.getTime() - updatedAtDate.getTime();
      createdAtDateDifference.should.be.lessThanOrEqual(2000);
      updatedAtDateDifference.should.be.lessThanOrEqual(2000);
    });

    it('should create a new cenm document and check db', async function () {
      response = await agent.post('/api/documents').send(validcENMDocument).expect(201);
      response.body._id.should.have.length(24);
      response.headers.location.should.equal(`/api/documents/${response.body._id}`);
      response.body.name.should.equal(validcENMDocument.name);
      response.body.content.should.deepEqual(validcENMDocument.content);
      documentReturned = await Document.findById(response.body._id).exec();
      documentReturned.name.should.equal(validcENMDocument.name);
      documentReturned.content.should.deepEqual(validcENMDocument.content);
      var currentDate = new Date();
      var createdAtDate = new Date(documentReturned.created_at);
      var updatedAtDate = new Date(documentReturned.updated_at);
      var createdAtDateDifference = currentDate.getTime() - createdAtDate.getTime();
      var updatedAtDateDifference = currentDate.getTime() - updatedAtDate.getTime();
      createdAtDateDifference.should.be.lessThanOrEqual(2000);
      updatedAtDateDifference.should.be.lessThanOrEqual(2000);
    });

    it('should not be able to create a new document with valid schema_id that doesn\'t exist)', async function () {
      validDocument.schema_id = '000000000000000000000000';
      response = await agent.post('/api/documents').send(validDocument).expect(422);
      response.body.message.should.equal('The given schema id could not be found');
    });

    it('should not be able to create a new document with an invalid schema_id', async function () {
      validDocument.schema_id = 'this_is_so_completely_invalid';
      response = await agent.post('/api/documents').send(validDocument).expect(422);
      response.body.message.should.equal('The given schema id could not be found');
    });

    it('should not allow more than one document with the same name', async function () {
      await agent.post('/api/documents').send(validDocument).expect(201);
      response = await agent.post('/api/documents').send(validDocument).expect(400);
      response.body.message.should.equal('Error, provided name is not unique.');
    });

    it('should allow to add document to a group', async function () {
      process.env.NODE_ENV = 'policyCheckEnabled';
      validDocument.usergroups = [groupReturned._id.toString()];
      response = await agent.post('/api/documents').auth(validUser.username, validUser.password).send(validDocument).expect(201);
      groupReturned = await Group.findById(groupReturned._id).exec();
      groupReturned.associatedDocuments[0].toString().should.deepEqual(response.body._id.toString());
      process.env.NODE_ENV = nodeEnv;
    });

    it('should allow to add document from a group, when user is superAdmin', async function () {
      process.env.NODE_ENV = 'policyCheckEnabled';
      validDocument.usergroups = [groupReturned._id.toString()];
      response = await agent.post('/api/documents').auth(validUser3.username, validUser3.password).send(validDocument).expect(201);
      groupReturned = await Group.findById(groupReturned._id).exec();
      groupReturned.associatedDocuments[0].toString().should.deepEqual(response.body._id.toString());
      process.env.NODE_ENV = nodeEnv;
    });

    it('should not allow to add same group twice', async function () {
      process.env.NODE_ENV = 'policyCheckEnabled';
      validDocument.usergroups = [groupReturned._id.toString(), groupReturned._id.toString()];
      response = await agent.post('/api/documents').auth(validUser.username, validUser.password).send(validDocument).expect(422);
      response.body.message.should.equal('You cannot attach the same group twice');
      process.env.NODE_ENV = nodeEnv;
    });

    it('should not allow to add document to group, when user is not in that group', async function () {
      process.env.NODE_ENV = 'policyCheckEnabled';
      validDocument.usergroups = [groupReturned._id.toString()];
      response = await agent.post('/api/documents').auth(validUser2.username, validUser2.password).send(validDocument).expect(422);
      response.body.message.should.equal(`You cannot attach group ${groupReturned._id.toString()}, you are not in this group`);
      process.env.NODE_ENV = nodeEnv;
    });

    it('should not create a document with extra fields in the content not outlined in associated schema', async function () {
      badDocument = _.cloneDeep(validDocument);
      badDocument.content.newkey = 12123;
      response = await agent.post('/api/documents').send(badDocument).expect(422);
      response.body.message.should.equal('There were 1 errors found when validating the given document against the schema: ' +
        '[{"keyword":"additionalProperties","dataPath":"","schemaPath":"#/additionalProperties","params":{"additionalProperty":"newkey"},' +
        '"message":"should NOT have additional properties"}]');
    });

    it('should not create a document with extra fields not outlined in the mongoose model', async function () {
      badDocument = _.cloneDeep(validDocument);
      badDocument.newkey = 12123;
      response = await agent.post('/api/documents').send(badDocument).expect(400);
      response.body.message.should.equal('Field `newkey` is not in schema and strict mode is set to throw.');
    });

    it('should not allow a document with no content', async function () {
      badDocument = _.cloneDeep(validDocument);
      delete badDocument.content;
      response = await agent.post('/api/documents').send(badDocument).expect(400);
      response.body.message.should.equal('Path `content` is required.');
    });

    it('should not allow document without a name', async function () {
      badDocument = _.cloneDeep(validDocument);
      delete badDocument.name;
      response = await agent.post('/api/documents').send(badDocument).expect(400);
      response.body.message.should.equal('Path `name` is required.');
    });

    it('should not allow document with invalid label', async function () {
      badDocument = _.cloneDeep(validDocument);
      badDocument.labels = ['invalidLabel'];
      response = await agent.post('/api/documents').send(badDocument).expect(422);
      response.body.message.should.equal('Label \'invalidLabel\' does not exist!');
    });

    it('should allow document with valid label', async function () {
      _documentUpdated = _.cloneDeep(validDocument);
      _documentUpdated.labels = ['validLabel'];
      labelObject = new Label({ name: 'validLabel' });
      await labelObject.save();
      response = await agent.post('/api/documents').send(_documentUpdated).expect(201);
    });

    it('should allow document with multiple valid labels', async function () {
      _documentUpdated = _.cloneDeep(validDocument);
      _documentUpdated.labels = ['validLabel', 'validLabel2', 'validLabel3'];
      labelObject = new Label({ name: 'validLabel' });
      await labelObject.save();
      labelObject = new Label({ name: 'validLabel2' });
      await labelObject.save();
      labelObject = new Label({ name: 'validLabel3' });
      await labelObject.save();
      response = await agent.post('/api/documents').send(_documentUpdated).expect(201);
    });

    it('should not allow document with duplicate labels', async function () {
      badDocument = _.cloneDeep(validDocument);
      badDocument.labels = ['invalidLabel', 'invalidLabel'];
      response = await agent.post('/api/documents').send(badDocument).expect(422);
      response.body.message.should.equal('There are duplicate labels assigned to this document.');
    });

    it('should respond with bad request with invalid json', async function () {
      badDocument = '{';
      response = await agent.post('/api/documents').send(badDocument).type('json').expect(400);
      response.body.message.should.equal('There was a syntax error found in your request, please make sure that it is valid and try again');
    });

    it('should not allow document with a name less than 5 characters', async function () {
      badDocument = _.cloneDeep(validDocument);
      badDocument.name = 'xxxx';
      response = await agent.post('/api/documents').send(badDocument).expect(400);
      response.body.message.should.equal(`Path \`name\` (\`${badDocument.name}\`) is shorter than the minimum allowed length (5).`);
    });

    it('should not allow document with a name more than 80 characters', async function () {
      badDocument = _.cloneDeep(validDocument);
      badDocument.name = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
      response = await agent.post('/api/documents').send(badDocument).expect(400);
      response.body.message.should.equal(`Path \`name\` (\`${badDocument.name}\`) is longer than the maximum allowed length (80).`);
    });

    it('should not allow a document with a non-alphanumeric-underscored name', async function () {
      badDocument = _.cloneDeep(validDocument);
      badDocument.name = '!£$%&';
      response = await agent.post('/api/documents').send(badDocument).expect(400);
      response.body.message.should.equal('name is not valid; \'!£$%&\' can only contain letters, numbers, dots, dashes and underscores.');
    });

    it('should autopopulate enm_sed keys during creation with temporary data', async function () {
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      response = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);
      response.body.content.should.deepEqual(autoPopulateContentTemporaryValuesExpected);
    });

    it('should autopopulate cenm_sed ipv4 keys during creation with temporary data', async function () {
      validcENMSchemaIPv4.name = 'cenm_schema_test';
      validcENMSchemaIPv4.version = '2.2.2';
      cenmSedSchemaObject = new Schema(validcENMSchemaIPv4);
      cenmSchemaObjectReturned = await cenmSedSchemaObject.save();
      validcENMDocument.schema_id = cenmSchemaObjectReturned._id;
      response = await agent.post('/api/documents').send(validcENMDocument).expect(201);
      response.body.content.should.deepEqual(autoPopulateContentTemporarycENMValuesExpected);
    });

    it('should autopopulate cenm_sed ipv6 keys during creation with temporary data', async function () {
      validcENMSchemaIPv6.name = 'cenm_schema_test2';
      validcENMSchemaIPv6.version = '3.3.3';
      cenmSedSchemaObject = new Schema(validcENMSchemaIPv6);
      cenmSchemaObjectReturned = await cenmSedSchemaObject.save();
      validcENMDocumentIPv6.schema_id = cenmSchemaObjectReturned._id;
      response = await agent.post('/api/documents').send(validcENMDocumentIPv6).expect(201);
      response.body.content.should.deepEqual(autoPopulateContentTemporarycENMValuesExpectedIPv6);
    });

    it('should fail to autopopulate enm_sed keys during creation when autopopulate is off', async function () {
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.autopopulate = false;
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      response = await agent.post('/api/documents').send(validEnmSedDocument).expect(422);
      response.body.message.should.containEql('errors found when validating the given document against the schema');
    });

    it('should not throw an error when there are sufficient IP addresses in both ENM SED and Exclusion IP addresses from project on a ENM SED update with deployment', async function () {
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      documentResponse = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);
      validDeployment.enm.sed_id = documentResponse.body._id;
      podObject = new Pod(validPod);
      podObjectReturned = await podObject.save();
      validExclusionTrueProject.pod_id = podObjectReturned._id;
      projectObject = new Project(validExclusionTrueProject);
      projectObjectReturned = await projectObject.save();
      validDeployment.project_id = projectObjectReturned._id;
      deploymentObject = new Deployment(validDeployment);
      await deploymentObject.save();
      response = await agent.put(`/api/documents/${documentResponse.body._id}`).send().expect(200);
    });

    it('should allow a managed config to be saved with only some keys populated', async function () {
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedManagedConfig.schema_id = enmSedSchemaObjectReturned._id;
      response = await agent.post('/api/documents').send(validEnmSedManagedConfig).expect(201);
      response.body.content.should.deepEqual(validEnmSedManagedConfig.content);
    });

    it('should not allow 2 managed configs to be saved with the same schema_id and label', async function () {
      // Create Label for attaching to Managed Config
      labelObject = new Label({ name: 'validLabel' });
      await labelObject.save();

      // Create ENM Schema for attaching to Managed Config
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();

      // Attach Label and ENM Schema to Managed Config
      validEnmSedManagedConfig.labels = ['validLabel'];
      validEnmSedManagedConfig.schema_id = enmSedSchemaObjectReturned._id;

      // Try Create Managed Config with attached Label and ENM Schema- Should succeed with response status 201
      response = await agent.post('/api/documents').send(validEnmSedManagedConfig).expect(201);
      response.body.content.should.deepEqual(validEnmSedManagedConfig.content);

      // Clone the Managed Config with same Label and ENM Schema parameters, but different name
      var secondEnmSedManagedConfig = _.clone(validEnmSedManagedConfig);
      secondEnmSedManagedConfig.name = 'secondManagedConfig';

      // Try Create Cloned Managed Config with attached Label and ENM Schema- Should fail with response status 422
      response = await agent.post('/api/documents').send(secondEnmSedManagedConfig).expect(422);
      response.body.message.should.containEql(`No duplicate managed configs allowed. '${validEnmSedManagedConfig.name}' \
already exists with schema_id: '${validEnmSedManagedConfig.schema_id}' and label(s): '${validEnmSedManagedConfig.labels.join(', ')}'.`);
    });

    it('should not allow a managed config to be saved with invalid key', async function () {
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedManagedConfig.schema_id = enmSedSchemaObjectReturned._id;
      validEnmSedManagedConfig.content.parameters.enm_external_network_name = '';
      response = await agent.post('/api/documents').send(validEnmSedManagedConfig).expect(422);
      response.body.message.should.containEql('errors found when validating the given document against the schema');
    });

    it('should not allow a managed config to be saved with managed config and autopopulate enabled', async function () {
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedManagedConfig.schema_id = enmSedSchemaObjectReturned._id;
      validEnmSedManagedConfig.autopopulate = true;
      response = await agent.post('/api/documents').send(validEnmSedManagedConfig).expect(422);
      response.body.message.should.equal('You cannot have both managed config and autopopulate enabled together');
    });

    it('should not allow a managed config to be saved with attached managed configs', async function () {
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedManagedConfig.schema_id = enmSedSchemaObjectReturned._id;
      response = await agent.post('/api/documents').send(validEnmSedManagedConfig).expect(201);
      validEnmSedManagedConfig.name = 'anothername';
      validEnmSedManagedConfig.managedconfigs = [
        response.body._id
      ];
      response = await agent.post('/api/documents').send(validEnmSedManagedConfig).expect(422);
      response.body.message.should.equal('A managed config cannot have managed configs attached to it');
    });

    it('should merge managed configs during save', async function () {
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedManagedConfig.schema_id = enmSedSchemaObjectReturned._id;
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      validEnmSedDocument.managedconfigs = [];
      validEnmSedManagedConfig.content.parameters.service1_instances = '5';
      validEnmSedManagedConfig.content.parameters.neo4j_instances = '6';
      response = await agent.post('/api/documents').send(validEnmSedManagedConfig).expect(201);
      validEnmSedDocument.managedconfigs.push(response.body._id);
      delete validEnmSedManagedConfig.content.parameters.neo4j_instances;
      validEnmSedManagedConfig.content.parameters.service1_instances = '7';
      validEnmSedManagedConfig.content.parameters.service2_instances = '8';
      validEnmSedManagedConfig.name = 'anotherManagedConfig';
      response = await agent.post('/api/documents').send(validEnmSedManagedConfig).expect(201);
      validEnmSedDocument.managedconfigs.push(response.body._id);
      response = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);
      response.body.content.parameters.neo4j_instances.should.deepEqual('6');
      response.body.content.parameters.service1_instances.should.deepEqual('7');
      response.body.content.parameters.service2_instances.should.deepEqual('8');
    });

    it('should save document when autopopulate is on and overcommit is off', async function () {
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedManagedConfig.schema_id = enmSedSchemaObjectReturned._id;
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      validEnmSedDocument.overcommit = false;
      validEnmSedDocument.autopopulate = true;
      response = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);
      response.body.content.parameters.flavor_6vC6M3_1.should.deepEqual('over_commit_flavor_1,flavor_esmon,flavor_said');
      response.body.content.parameters.flavor_2vC4M3_1.should.deepEqual('over_commit_flavor_2,flavor_nbfmsnmp,flavor_elementmanager');
      response.body.content.parameters.flavor_6vC6M.should.deepEqual('under_commit_flavor_3');
      response.body.content.parameters.flavor_2vC4M.should.deepEqual('under_commit_flavor_4');
      response.body.content.parameters.flavor_esmon.should.deepEqual('under_commit_flavor_3');
      response.body.content.parameters.flavor_nbfmsnmp.should.deepEqual('under_commit_flavor_4');
      response.body.content.parameters.flavor_said.should.deepEqual('under_commit_flavor_3');
      response.body.content.parameters.flavor_elementmanager.should.deepEqual('under_commit_flavor_4');
    });

    it('should save document as overcommit false when autopopulate is on and overcommit is null', async function () {
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedManagedConfig.schema_id = enmSedSchemaObjectReturned._id;
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      validEnmSedDocument.overcommit = null;
      validEnmSedDocument.autopopulate = true;
      response = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);
      response.body.content.parameters.flavor_6vC6M3_1.should.deepEqual('over_commit_flavor_1,flavor_esmon,flavor_said');
      response.body.content.parameters.flavor_2vC4M3_1.should.deepEqual('over_commit_flavor_2,flavor_nbfmsnmp,flavor_elementmanager');
      response.body.content.parameters.flavor_6vC6M.should.deepEqual('under_commit_flavor_3');
      response.body.content.parameters.flavor_2vC4M.should.deepEqual('under_commit_flavor_4');
      response.body.content.parameters.flavor_esmon.should.deepEqual('under_commit_flavor_3');
      response.body.content.parameters.flavor_nbfmsnmp.should.deepEqual('under_commit_flavor_4');
      response.body.content.parameters.flavor_said.should.deepEqual('under_commit_flavor_3');
      response.body.content.parameters.flavor_elementmanager.should.deepEqual('under_commit_flavor_4');
    });

    it('should save document when autopopulate is off and overcommit is off', async function () {
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedManagedConfig.schema_id = enmSedSchemaObjectReturned._id;
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      validEnmSedDocument.overcommit = false;
      validEnmSedDocument.autopopulate = false;
      validEnmSedDocument.content.parameters = _.extend(validEnmSedDocument.content.parameters, autoPopulateContentValuesExpected.parameters);
      delete validEnmSedDocument.content.parameters.flavor_6vC6M1_1;
      delete validEnmSedDocument.content.parameters.flavor_6vC6M3_1;
      delete validEnmSedDocument.content.parameters.flavor_2vC4M3_1;
      delete validEnmSedDocument.content.parameters.flavor_6vC6M;
      delete validEnmSedDocument.content.parameters.flavor_2vC4M;
      response = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);
      response.body.content.parameters.flavor_6vC6M1_1.should.deepEqual('not_set');
      response.body.content.parameters.flavor_6vC6M3_1.should.deepEqual('not_set');
      response.body.content.parameters.flavor_2vC4M3_1.should.deepEqual('not_set');
      response.body.content.parameters.flavor_6vC6M.should.deepEqual('not_set');
      response.body.content.parameters.flavor_2vC4M.should.deepEqual('not_set');
    });

    it('should save document when autopopulate is on and overcommit is on', async function () {
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedManagedConfig.schema_id = enmSedSchemaObjectReturned._id;
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      validEnmSedDocument.overcommit = true;
      validEnmSedDocument.autopopulate = true;
      response = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);
      response.body.content.parameters.flavor_6vC6M1_1.should.deepEqual('over_commit_flavor1_1,flavor_esmon');
      response.body.content.parameters.flavor_6vC6M3_1.should.deepEqual('over_commit_flavor_1,flavor_esmon,flavor_said');
      response.body.content.parameters.flavor_2vC4M3_1.should.deepEqual('over_commit_flavor_2,flavor_nbfmsnmp,flavor_elementmanager');
      response.body.content.parameters.flavor_6vC6M.should.deepEqual('under_commit_flavor_3');
      response.body.content.parameters.flavor_2vC4M.should.deepEqual('under_commit_flavor_4');
      response.body.content.parameters.flavor_esmon.should.deepEqual('over_commit_flavor1_1');
      response.body.content.parameters.flavor_nbfmsnmp.should.deepEqual('over_commit_flavor_2');
      response.body.content.parameters.flavor_said.should.deepEqual('over_commit_flavor_1');
      response.body.content.parameters.flavor_elementmanager.should.deepEqual('over_commit_flavor_2');
    });

    it('should merge managed configs during save without overcommit values when overcommit is off', async function () {
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validECNManagedConfigWithOvercommitFlavors.schema_id = enmSedSchemaObjectReturned._id;
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      validEnmSedDocument.overcommit = false;
      validEnmSedDocument.managedconfigs = [];
      response = await agent.post('/api/documents').send(validECNManagedConfigWithOvercommitFlavors).expect(201);
      validEnmSedDocument.managedconfigs.push(response.body._id);
      response = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);
      response.body.content.parameters.flavor_elementmanager.should.deepEqual('ECN_custom_not_overcommit_flavor_4');
      response.body.content.parameters.flavor_esmon.should.deepEqual('ECN_custom_not_overcommit_flavor_3');
      response.body.content.parameters.flavor_said.should.deepEqual('ECN_custom_not_overcommit_flavor_3');
      response.body.content.parameters.flavor_nbfmsnmp.should.deepEqual('ECN_custom_not_overcommit_flavor_4');
    });

    it('should merge managed configs during save with overcommit values when overcommit is on', async function () {
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validECNManagedConfigWithOvercommitFlavors.schema_id = enmSedSchemaObjectReturned._id;
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      validEnmSedDocument.overcommit = true;
      validEnmSedDocument.managedconfigs = [];
      response = await agent.post('/api/documents').send(validECNManagedConfigWithOvercommitFlavors).expect(201);
      validEnmSedDocument.managedconfigs.push(response.body._id);
      response = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);
      response.body.content.parameters.flavor_said.should.deepEqual('ECN_custom_overcommit_flavor_1');
      response.body.content.parameters.flavor_nbfmsnmp.should.deepEqual('ECN_custom_overcommit_flavor_2');
      response.body.content.parameters.flavor_elementmanager.should.deepEqual('ECN_custom_overcommit_flavor_2');
      response.body.content.parameters.flavor_esmon.should.deepEqual('ECN_custom_overcommit_flavor_1');
    });

    it('should have overcommit feature backwards compatiable with older SEDs', async function () {
      delete enmSedSchema.content.definitions.over_commit;
      delete enmSedSchema.content.definitions.not_over_commit;
      delete enmSedSchema.content.properties.parameters.properties.flavor_6vC6M1_1;
      delete enmSedSchema.content.properties.parameters.properties.flavor_6vC6M3_1;
      delete enmSedSchema.content.properties.parameters.properties.flavor_2vC4M3_1;
      delete enmSedSchema.content.properties.parameters.properties.flavor_6vC6M;
      delete enmSedSchema.content.properties.parameters.properties.flavor_2vC4M;
      var required = enmSedSchema.content.properties.parameters.required;
      required = removeKeyFromArray(required, 'flavor_said');
      required = removeKeyFromArray(required, 'flavor_nbfmsnmp');
      required = removeKeyFromArray(required, 'flavor_elementmanager');
      required = removeKeyFromArray(required, 'flavor_esmon');
      required = removeKeyFromArray(required, 'flavor_6vC6M1_1');
      required = removeKeyFromArray(required, 'flavor_6vC6M3_1');
      required = removeKeyFromArray(required, 'flavor_2vC4M3_1');
      required = removeKeyFromArray(required, 'flavor_6vC6M');
      required = removeKeyFromArray(required, 'flavor_2vC4M');
      enmSedSchema.content.properties.parameters.required = required;
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();

      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      validEnmSedDocument.overcommit = true;
      delete validEnmSedDocument.content.parameters.flavor_said;
      delete validEnmSedDocument.content.parameters.flavor_nbfmsnmp;
      delete validEnmSedDocument.content.parameters.flavor_elementmanager;
      delete validEnmSedDocument.content.parameters.flavor_esmon;
      delete validEnmSedDocument.content.parameters.flavor_6vC6M1_1;
      delete validEnmSedDocument.content.parameters.flavor_6vC6M3_1;
      delete validEnmSedDocument.content.parameters.flavor_2vC4M3_1;
      delete validEnmSedDocument.content.parameters.flavor_6vC6M;
      delete validEnmSedDocument.content.parameters.flavor_2vC4M;

      var responseOvercommitOn = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);
      validEnmSedDocument.overcommit = false;
      validEnmSedDocument.name = 'validEnmSedDocumentOvercommitOff';
      var responseOvercommitOff = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);
      responseOvercommitOn.body.content.should.deepEqual(responseOvercommitOff.body.content);
    });

    it('should not allow a managed config to be created with attached managed configs using a different schema', async function () {
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      enmSedSchema.version = '2.3.4';
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedManagedConfig.schema_id = enmSedSchemaObjectReturned._id;
      response = await agent.post('/api/documents').send(validEnmSedManagedConfig).expect(201);
      validEnmSedDocument.managedconfigs = [response.body._id];
      response = await agent.post('/api/documents/').send(validEnmSedDocument).expect(422);
      response.body.message.should.equal('The attached managed config \'validSedMConfig\' is not using the same schema id as the document itself');
    });

    it('should not allow a document to be created with attached managed configs that are not managed configs', async function () {
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      response = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);
      validEnmSedDocument.name = 'another_name';
      validEnmSedDocument.managedconfigs = [response.body._id];
      response = await agent.post('/api/documents/').send(validEnmSedDocument).expect(422);
      response.body.message.should.equal('You cannot attach the document \'validSedDocument\' as a managed config as it is not a managed config');
    });

    it('should not allow a document to be created with duplicate managed configs', async function () {
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedManagedConfig.schema_id = enmSedSchemaObjectReturned._id;
      response = await agent.post('/api/documents').send(validEnmSedManagedConfig).expect(201);
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      validEnmSedDocument.managedconfigs = [response.body._id, response.body._id];
      response = await agent.post('/api/documents').send(validEnmSedDocument).expect(422);
      response.body.message.should.equal('You cannot attach the same managed config twice');
    });

    it('should not use given created_at value', async function () {
      badDocument = _.cloneDeep(validDocument);
      badDocument.created_at = '2017-01-16T09:17:01.441Z';
      response = await agent.post('/api/documents').send(badDocument).expect(201);
      var currentDate = new Date();
      var createdAtDate = new Date(response.body.created_at);
      var createdAtDateDifference = currentDate.getTime() - createdAtDate.getTime();
      createdAtDateDifference.should.be.lessThanOrEqual(2000);
    });

    it('should not use given updated_at value', async function () {
      badDocument = _.cloneDeep(validDocument);
      badDocument.updated_at = '2017-01-16T09:17:01.441Z';
      response = await agent.post('/api/documents').send(badDocument).expect(201);
      var currentDate = new Date();
      var updatedAtDate = new Date(response.body.updated_at);
      var updatedAtDateDifference = currentDate.getTime() - updatedAtDate.getTime();
      updatedAtDateDifference.should.be.lessThanOrEqual(2000);
    });

    it('should post a new log with user-details when a document is created by a logged-in user', async function () {
      response = await agent.post('/api/documents').auth(validUser.username, validUser.password).send(validDocument).expect(201);
      response.body._id.should.have.length(24);
      response.headers.location.should.equal(`/api/documents/${response.body._id}`);
      response.body.name.should.equal(validDocument.name);
      response.body.content.should.deepEqual(validDocument.content);
      documentReturned = await Document.findById(response.body._id).exec();
      documentReturned.name.should.equal(validDocument.name);
      documentReturned.content.should.deepEqual(validDocument.content);
      var currentDate = new Date();
      var createdAtDate = new Date(documentReturned.created_at);
      var updatedAtDate = new Date(documentReturned.updated_at);
      var createdAtDateDifference = currentDate.getTime() - createdAtDate.getTime();
      var updatedAtDateDifference = currentDate.getTime() - updatedAtDate.getTime();
      createdAtDateDifference.should.be.lessThanOrEqual(2000);
      updatedAtDateDifference.should.be.lessThanOrEqual(2000);

      logReturned = await History.findOne({ associated_id: response.body._id }).exec();
      logReturned.originalData.should.not.equal(undefined);
      logReturned.originalData.name.should.equal(validDocument.name);
      logReturned.originalData.content.toString().should.equal(validDocument.content.toString());
      logReturned.createdAt.should.not.equal(undefined);
      logReturned.createdBy.should.not.equal(undefined);
      logReturned.createdBy.username.should.equal(validUser.username);
      logReturned.createdBy.email.should.equal(validUser.email);
      logReturned.updates.should.be.instanceof(Array).and.have.lengthOf(0);
    });

    it('should not post a new log for a document that is created with a name beginning with \'A_Health_\'', async function () {
      var validDocumentHealth = _.cloneDeep(validDocument);
      validDocumentHealth.name = 'A_Health_Document';
      response = await agent.post('/api/documents').send(validDocumentHealth).expect(201);
      response.body._id.should.have.length(24);
      response.headers.location.should.equal(`/api/documents/${response.body._id}`);
      response.body.name.should.equal(validDocumentHealth.name);

      documentReturned = await Document.findById(response.body._id).exec();
      documentReturned.name.should.equal(validDocumentHealth.name);

      logReturned = await History.findOne({ associated_id: response.body._id }).exec();
      should.not.exist(logReturned);
    });

    it('should return populated json object with default keys during creation using /validate api url', async function () {
      response = await agent.post('/api/documents/validate').send(validSchemaWithDefaults).expect(200);
      response.body.parameters.accesscontrol_instances.should.equal('2');
    });

    it('should not post a new log for a document that is created with a name that contains \'SNAPSHOT\'', async function () {
      var validDocumentSnapshot = _.cloneDeep(validDocument);
      validDocumentSnapshot.name = 'SNAPSHOT';
      response = await agent.post('/api/documents').send(validDocumentSnapshot).expect(201);
      response.body._id.should.have.length(24);
      response.headers.location.should.equal(`/api/documents/${response.body._id}`);
      response.body.name.should.equal(validDocumentSnapshot.name);

      documentReturned = await Document.findById(response.body._id).exec();
      documentReturned.name.should.equal(validDocumentSnapshot.name);

      logReturned = await History.findOne({ associated_id: response.body._id }).exec();
      should.not.exist(logReturned);
    });
  });

  describe('PUT', function () {
    beforeEach(async function () {
      document = new Document(validDocument);
      await document.save();
    });

    it('should not update a document when user is not authenticated', async function () {
      partialDocument = { name: 'updated_name' };
      response = await nonAuthAgent.put(`/api/documents/${document._id}`).send(partialDocument).expect(401);
      response.body.message.should.equal('User must be logged in');
    });

    it('should not allow to add same group twice', async function () {
      process.env.NODE_ENV = 'policyCheckEnabled';
      validDocument.usergroups = [groupReturned._id.toString(), groupReturned._id.toString()];
      response = await agent.put(`/api/documents/${document._id}`).auth(validUser.username, validUser.password).send(validDocument).expect(422);
      response.body.message.should.equal('You cannot attach the same group twice');
      process.env.NODE_ENV = nodeEnv;
    });

    it('should not allow to add document to group, when user is not in that group', async function () {
      process.env.NODE_ENV = 'policyCheckEnabled';
      validDocument.usergroups = [groupReturned._id.toString()];
      response = await agent.put(`/api/documents/${document._id}`).auth(validUser2.username, validUser2.password).send(validDocument).expect(422);
      response.body.message.should.equal('You cannot attach group ' + groupReturned._id.toString() + ', you are not in this group');
      process.env.NODE_ENV = nodeEnv;
    });

    it('should allow to add and remove document from a group', async function () {
      process.env.NODE_ENV = 'policyCheckEnabled';
      validDocument.usergroups = [groupReturned._id.toString()];
      documentResponse = await agent.put(`/api/documents/${document._id}`)
        .auth(validUser.username, validUser.password).send(validDocument).expect(200);
      groupReturned = await Group.findById(groupReturned._id).exec();
      groupReturned.associatedDocuments[0].toString().should.deepEqual(documentResponse.body._id.toString());
      validDocument.usergroups = [];
      _documentUpdated = _.cloneDeep(validDocument);
      response = await agent.put(`/api/documents/${documentResponse.body._id}`)
        .auth(validUser.username, validUser.password).send(_documentUpdated).expect(200);
      groupReturned = await Group.findById(groupReturned._id).exec();
      groupReturned.associatedDocuments.length.should.equal(0);
      process.env.NODE_ENV = nodeEnv;
    });

    it('should allow to add and remove document from a group, when user is superAdmin', async function () {
      process.env.NODE_ENV = 'policyCheckEnabled';
      validDocument.usergroups = [groupReturned._id.toString()];
      documentResponse = await agent.put(`/api/documents/${document._id}`)
        .auth(validUser.username, validUser.password).send(validDocument).expect(200);
      groupReturned = await Group.findById(groupReturned._id).exec();
      groupReturned.associatedDocuments[0].toString().should.deepEqual(documentResponse.body._id.toString());
      validDocument.usergroups = [];
      _documentUpdated = _.cloneDeep(validDocument);
      response = await agent.put(`/api/documents/${documentResponse.body._id}`)
        .auth(validUser3.username, validUser3.password).send(_documentUpdated).expect(200);
      groupReturned = await Group.findById(groupReturned._id).exec();
      groupReturned.associatedDocuments.length.should.equal(0);
      process.env.NODE_ENV = nodeEnv;
    });

    it('should not allow to remove document from a group, when user is not in that group', async function () {
      process.env.NODE_ENV = 'policyCheckEnabled';
      validDocument.usergroups = [groupReturned._id.toString()];
      documentResponse = await agent.put(`/api/documents/${document._id}`)
        .auth(validUser.username, validUser.password).send(validDocument).expect(200);
      groupReturned = await Group.findById(groupReturned._id).exec();
      groupReturned.associatedDocuments[0].toString().should.deepEqual(documentResponse.body._id.toString());
      validDocument.usergroups = [];
      _documentUpdated = _.cloneDeep(validDocument);
      response = await agent.put(`/api/documents/${documentResponse.body._id}`)
        .auth(validUser2.username, validUser2.password).send(_documentUpdated).expect(200);
      groupReturned = await Group.findById(groupReturned._id).exec();
      groupReturned.associatedDocuments.length.should.equal(1);
      process.env.NODE_ENV = nodeEnv;
    });

    it('should return the updated document name and content after update and check db', async function () {
      _documentUpdated = _.cloneDeep(validDocument);
      _documentUpdated.name = '3.2.1';
      _documentUpdated.content.testkey = 'newValue';
      response = await agent.put(`/api/documents/${document._id}`).send(_documentUpdated).expect(200);
      response.body._id.should.have.length(24);
      response.body.name.should.equal(_documentUpdated.name);
      response.body.content.should.deepEqual(_documentUpdated.content);
      var response2 = await Document.findById(document._id).lean().exec();
      response2.should.have.properties(_documentUpdated);
      response.body.should.deepEqual(JSON.parse(JSON.stringify(response2)));
    });

    it('should remove additional keys when only a schema version update is within the PUT', async function () {
      validSchemaMinusAKey = _.cloneDeep(validSchema);
      validSchemaMinusAKey.version = '1.2.4';
      delete validSchemaMinusAKey.content.properties.otherkey;
      _validSchemaMinusAKey = new Schema(validSchemaMinusAKey);
      await _validSchemaMinusAKey.save();
      response = await agent.put(`/api/documents/${document._id}`).send({ schema_id: _validSchemaMinusAKey._id }).expect(200);
      should.not.exist(response.body.content.otherkey);
      response = await Document.findById(document._id).exec();
      should.not.exist(response.content.otherkey);
    });

    it('should gracefully process document when keys are removed from schema', async function () {
      delete enmSedSchema.content.properties.parameters.properties.haproxy_external_ip_list;
      delete enmSedSchema.content.properties.parameters.properties.haproxy_instances;
      var required = enmSedSchema.content.properties.parameters.required;
      required = removeKeyFromArray(required, 'haproxy_external_ip_list');
      required = removeKeyFromArray(required, 'haproxy_instances');
      enmSedSchema.content.properties.parameters.required = required;
      var EnmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await EnmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      documentResponse = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);
    });

    it('should add key to document when new schema has an additional key', async function () {
      validSchemaPlusAKey = _.cloneDeep(validSchema);
      validSchemaPlusAKey.version = '1.2.4';
      validSchemaPlusAKey.content.properties.newkey = {
        $ref: '#/definitions/any_string',
        default: 'defaultValue'
      };
      validSchemaPlusAKey.content.required.push('newkey');
      _validSchemaPlusAKey = new Schema(validSchemaPlusAKey);
      await _validSchemaPlusAKey.save();
      response = await agent.put(`/api/documents/${document._id}`).send({ schema_id: _validSchemaPlusAKey._id }).expect(200);
      should.exist(response.body.content.newkey);
      response.body.content.newkey.should.equal('defaultValue');
      response = await Document.findById(document._id).exec();
      should.exist(response.content.newkey);
    });

    it('should add key to cenm document when new schema has an additional key', async function () {
      document = new Document(validcENMDocument);
      await document.save();

      validSchemaPlusAKey = _.cloneDeep(validcENMSchemaIPv4);
      validSchemaPlusAKey.version = '1.2.4';
      validSchemaPlusAKey.content.properties.newkey = {
        $ref: '#/definitions/any_string',
        default: 'defaultValue'
      };
      validSchemaPlusAKey.content.required.push('newkey');
      _validSchemaPlusAKey = new Schema(validSchemaPlusAKey);
      await _validSchemaPlusAKey.save();
      response = await agent.put(`/api/documents/${document._id}`).send({ schema_id: _validSchemaPlusAKey._id }).expect(200);
      should.exist(response.body.content.newkey);
      response.body.content.newkey.should.equal('defaultValue');
      response = await Document.findById(document._id).exec();
      should.exist(response.content.newkey);
    });

    it('should not run document validation when schema version is unchanged', async function () {
      response = await agent.put(`/api/documents/${document._id}`).send({ schema_id: schema._id }).expect(200);
      response.body._id.should.have.length(24);
      response.body.name.should.equal(validDocument.name);
      response.body.content.should.deepEqual(validDocument.content);
    });

    it('should return error when document schema update fails due to new schema key which has no default value', async function () {
      validSchemaPlusAKey = _.cloneDeep(validSchema);
      validSchemaPlusAKey.version = '1.2.4';
      validSchemaPlusAKey.content.properties.newkey = {
        $ref: '#/definitions/any_string'
      };
      validSchemaPlusAKey.content.required.push('newkey');
      _validSchemaPlusAKey = new Schema(validSchemaPlusAKey);
      await _validSchemaPlusAKey.save();
      response = await agent.put(`/api/documents/${document._id}`).send({ schema_id: _validSchemaPlusAKey._id }).expect(422);
      response.body.message.should.equal('There were 1 errors found when validating the given document against the ' +
        'schema: [{"keyword":"required","dataPath":"","schemaPath":"' +
        '#/required","params":{"missingProperty":"newkey"},"message":"should have required property \'newkey\'"}]');
    });

    it('should allow update of just the name field', async function () {
      partialDocument = { name: 'updated_name' };
      response = await agent.put(`/api/documents/${document._id}`).send(partialDocument).expect(200);
      response.body.name.should.equal(partialDocument.name);
      documentReturned = await Document.findById(document._id).exec();
      documentReturned.name.should.equal(partialDocument.name);
    });

    it('should allow update of just the content field', async function () {
      partialDocument = { content: validDocument.content };
      partialDocument.content.testkey = 'updated_value';
      response = await agent.put(`/api/documents/${document._id}`).send(partialDocument).expect(200);
      response.body.content.testkey.should.equal(partialDocument.content.testkey);
      documentReturned = await Document.findById(document._id).exec();
      documentReturned.content.testkey.should.equal(partialDocument.content.testkey);
    });

    it('should allow update of just the name field using document name', async function () {
      partialDocument = { name: 'updated_name' };
      response = await agent.put(`/api/documents/name/${document.name}`).send(partialDocument).expect(200);
      response.body.name.should.equal(partialDocument.name);
      documentReturned = await Document.findById(document._id).exec();
      documentReturned.name.should.equal(partialDocument.name);
    });

    it('should allow update of just the content field using document name', async function () {
      partialDocument = { content: validDocument.content };
      partialDocument.content.testkey = 'updated_value';
      response = await agent.put(`/api/documents/name/${document.name}`).send(partialDocument).expect(200);
      response.body.content.testkey.should.equal(partialDocument.content.testkey);
      documentReturned = await Document.findById(document._id).exec();
      documentReturned.content.testkey.should.equal(partialDocument.content.testkey);
    });

    it('should return a validation error when an update is attempted with invalid key type', async function () {
      _documentUpdated = _.cloneDeep(validDocument);
      _documentUpdated.content.testkey = 12345;
      response = await agent.put(`/api/documents/${document._id}`).send(_documentUpdated).expect(422);
      response.body.message.should.equal('There were 1 errors found when validating the given document against the ' +
        'schema: [{"keyword":"type","dataPath":".testkey","schemaPath":"' +
        '#/definitions/any_string/type","params":{"type":"string"},"message":"should be string"}]');
      response = await Document.findById(document._id).exec();
      response.content.testkey.should.not.equal(12345);
    });

    it('should not allow an update to a document with missing required field testkey', async function () {
      _documentUpdated = _.cloneDeep(validDocument);
      delete _documentUpdated.content.testkey;
      _documentUpdated.content.should.not.have.property('testkey');
      response = await agent.put(`/api/documents/${document._id}`).send(_documentUpdated).expect(422);
      response.body.message.should.equal('There were 1 errors found when validating the given document' +
        ' against the schema: [{"keyword":"required","dataPath":"","schemaPath":"#/required","params"' +
        ':{"missingProperty":"testkey"},"message":"should have required property \'testkey\'"}]');
    });

    it('should not allow additional fields added to the document when schema has additionalProperties = false', async function () {
      _documentUpdated = _.cloneDeep(validDocument);
      _documentUpdated.content.smiley = ':D';
      response = await agent.put(`/api/documents/${document._id}`).send(_documentUpdated).expect(422);
      response.body.message.should.equal('There were 1 errors found when' +
        ' validating the given document against the schema: [{"keyword":"additionalProperties"' +
        ',"dataPath":"","schemaPath":"#/additionalProperties","params":' +
        '{"additionalProperty":"smiley"},"message":"should NOT have additional properties"}]');
    });

    it('should respond with bad update request when using invalid json', async function () {
      badDocument = '{';
      response = await agent.put(`/api/documents/${document._id}`).send(badDocument).type('json').expect(400);
      response.body.message.should.equal('There was a syntax error found in your request, please make sure that it is valid and try again');
    });

    it('should not allow a document to update with a schema that doesnt exist', async function () {
      _documentUpdated = _.cloneDeep(validDocument);
      _documentUpdated.schema_id = '000000000000000000000000';
      response = await agent.put(`/api/documents/${document._id}`).send(_documentUpdated).expect(422);
      response.body.message.should.equal('The given schema id could not be found');
    });

    it('should not allow an update with a name with less than 5 characters', async function () {
      _badDocument = _.cloneDeep(validDocument);
      _badDocument.name = 'xxxx';
      badDocument = new Document(_badDocument);
      response = await agent.put(`/api/documents/${document._id}`).send(badDocument).expect(400);
      response.body.message.should.equal(`Path \`name\` (\`${badDocument.name}\`) is shorter than the minimum allowed length (5).`);
      response = await Document.findById(document._id).exec();
      response.name.should.equal(validDocument.name);
    });

    it('should not allow an update with a name of more than 80 characters', async function () {
      _badDocument = _.cloneDeep(validDocument);
      _badDocument.name = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
      badDocument = new Document(_badDocument);
      response = await agent.put(`/api/documents/${document._id}`).send(badDocument).expect(400);
      response.body.message.should.equal(`Path \`name\` (\`${_badDocument.name}\`) is longer than the maximum allowed length (80).`);
      response = await Document.findById(document._id).exec();
      response.name.should.equal(validDocument.name);
    });

    it('should not allow an update with schema of a different category', async function () {
      var schemaDifferentCategory = _.cloneDeep(validSchema);
      schemaDifferentCategory.name = 'enm_sed';
      schemaDifferentCategory.category = 'enm';
      var schemaDifferentCategoryObject = new Schema(schemaDifferentCategory);
      schemaDifferentCategoryObject = await schemaDifferentCategoryObject.save();
      badDocument = _.cloneDeep(validDocument);
      badDocument.schema_id = schemaDifferentCategoryObject._id;
      response = await agent.put(`/api/documents/${document._id}`).send(badDocument).expect(422);
      response.body.message.should.equal(`You cannot change a documents schema's category from 'other' to '${schemaDifferentCategory.category}'`);
      documentObject = await Document.findById(document._id).exec();
      documentObject.schema_id.toString().should.equal(schema._id.toString());
    });

    it('should autopopulate enm_sed keys during update with temporary data when no deployment is associated', async function () {
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      documentResponse = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);
      response = await agent.put(`/api/documents/${documentResponse.body._id}`).send(validEnmSedDocument).expect(200);
      response.body.content.should.deepEqual(autoPopulateContentTemporaryValuesExpected);
    });

    it('should autopopulate cenm_sed keys during update with temporary data when no deployment is associated', async function () {
      validcENMSchemaIPv4.name = 'cenm_schema_2';
      cenmSedSchemaObject = new Schema(validcENMSchemaIPv4);
      cenmSchemaObjectReturned = await cenmSedSchemaObject.save();
      validcENMDocument.schema_id = cenmSchemaObjectReturned._id;
      documentResponse = await agent.post('/api/documents').send(validcENMDocument).expect(201);
      response = await agent.put(`/api/documents/${documentResponse.body._id}`).send(validcENMDocument).expect(200);
      response.body.content.should.deepEqual(autoPopulateContentTemporarycENMValuesExpected);
    });

    it('should not autopopulate enm_sed keys when deployment project network name is not found in given pod', async function () {
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      documentResponse = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);
      validDeployment.enm.sed_id = documentResponse.body._id;
      podObject = new Pod(validPod);
      podObject.networks[0].name = 'wrongName';
      podObjectReturned = await podObject.save();
      validProject.pod_id = podObjectReturned._id;
      projectObject = new Project(validProject);
      projectObjectReturned = await projectObject.save();
      validDeployment.project_id = projectObjectReturned._id;
      response = await agent.post('/api/deployments').send(validDeployment).expect(422);
      response.body.message.should.equal('The network name given in the project settings \'provider_network\' was not found within the given pod');
    });

    it('should autopopulate enm_sed keys during update with correct data when a deployment is associated', async function () {
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      documentResponse = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);
      validDeployment.enm.sed_id = documentResponse.body._id;
      podObject = new Pod(validPod);
      podObjectReturned = await podObject.save();
      validProject.pod_id = podObjectReturned._id;
      projectObject = new Project(validProject);
      projectObjectReturned = await projectObject.save();
      validDeployment.project_id = projectObjectReturned._id;
      await agent.post('/api/deployments').send(validDeployment).expect(201);
      response = await nonAuthAgent.get(`/api/documents/${documentResponse.body._id}`).expect(200);
      response.body.content.should.deepEqual(autoPopulateContentValuesExpected);
    });

    it('should autopopulate ipv4 cenm_sed keys during update with correct data when a deployment is associated', async function () {
      validcENMSchemaIPv4.name = 'cenm_schema_3';
      cenmSedSchemaObject = new Schema(validcENMSchemaIPv4);
      cenmSchemaObjectReturned = await cenmSedSchemaObject.save();
      validcENMDocument.schema_id = cenmSchemaObjectReturned._id;
      documentResponse = await agent.post('/api/documents').send(validcENMDocument).expect(201);
      validDeployment.enm.sed_id = documentResponse.body._id;
      podObject = new Pod(validPod);
      podObjectReturned = await podObject.save();
      validProject2.pod_id = podObjectReturned._id;
      projectObject = new Project(validProject2);
      projectObjectReturned = await projectObject.save();
      validDeployment.project_id = projectObjectReturned._id;
      await agent.post('/api/deployments').send(validDeployment).expect(201);
      response = await nonAuthAgent.get(`/api/documents/${documentResponse.body._id}`).expect(200);
      response.body.content.should.deepEqual(autoPopulateCENMContentValuesExpected);
    });

    it('should autopopulate enm_sed key nbalarmirp with correct number of ips during update when adding managed config', async function () {
      // Initial creation with 3 instances
      enmSedSchemaObject = new Schema(enmSedSchemaWithNbAlarmIrp);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      ValidENMSedDocumentWithNbAalrmIrp.schema_id = enmSedSchemaObjectReturned._id;
      documentResponse = await agent.post('/api/documents').send(ValidENMSedDocumentWithNbAalrmIrp).expect(201);
      validDeployment.enm.sed_id = documentResponse.body._id;
      podObject = new Pod(validPod);
      podObjectReturned = await podObject.save();
      validProject.pod_id = podObjectReturned._id;
      projectObject = new Project(validProject);
      projectObject.network.ipv4_ranges = [
        {
          start: '131.160.202.10',
          end: '131.160.202.15'
        },
        {
          start: '131.160.202.20',
          end: '131.160.202.33'
        }
      ];
      projectObjectReturned = await projectObject.save();
      validDeployment.project_id = projectObjectReturned._id;
      await agent.post('/api/deployments').send(validDeployment).expect(201);
      response = await nonAuthAgent.get(`/api/documents/${documentResponse.body._id}`).expect(200);
      response.body.content.parameters.nbalarmirp_internal_ip_list.should.deepEqual('10.10.0.50,10.10.0.51,10.10.0.52');
      response.body.content.parameters.nbalarmirp_external_ipv6_list.should.deepEqual('2001:1b70:6207:0027:0000:0874:1001:0000,2001:1b70:6207:0027:0000:0874:1001:0001,2001:1b70:6207:0027:0000:0874:1001:0002');
      response.body.content.parameters.nbalarmirp_external_ip_list.should.deepEqual('131.160.202.10,131.160.202.11,131.160.202.12');
      response.body.content.parameters.nbalarmirp_instances.should.deepEqual('3');

      labelObject = new Label({ name: 'validLabel' });
      await labelObject.save();

      var enmSedManagedConfigMbAlarmIrp = _.cloneDeep(validEnmSedManagedConfig);

      // Attach Label and ENM Schema to Managed Config
      enmSedManagedConfigMbAlarmIrp.labels = ['validLabel'];
      enmSedManagedConfigMbAlarmIrp.schema_id = enmSedSchemaObjectReturned._id;
      enmSedManagedConfigMbAlarmIrp.content.parameters.nbalarmirp_instances = '1';

      response = await agent.post('/api/documents').send(enmSedManagedConfigMbAlarmIrp).expect(201);
      response = await agent.put(`/api/documents/${documentResponse.body._id}`).send({ managedconfigs: [response.body._id] }).expect(200);

      response.body.content.parameters.nbalarmirp_internal_ip_list.should.deepEqual('10.10.0.50');
      response.body.content.parameters.nbalarmirp_external_ipv6_list.should.deepEqual('2001:1b70:6207:0027:0000:0874:1001:0000');
      response.body.content.parameters.nbalarmirp_external_ip_list.should.deepEqual('131.160.202.10');
      response.body.content.parameters.nbalarmirp_instances.should.deepEqual('1');
    });

    it('should autopopulate ipv6 cenm_sed keys during update with correct data when a deployment is associated', async function () {
      validcENMSchemaIPv6.name = 'cenm_schema_3';
      cenmSedSchemaObject = new Schema(validcENMSchemaIPv6);
      cenmSchemaObjectReturned = await cenmSedSchemaObject.save();
      validcENMDocumentIPv6.schema_id = cenmSchemaObjectReturned._id;
      documentResponse = await agent.post('/api/documents').send(validcENMDocumentIPv6).expect(201);
      validDeployment.enm.sed_id = documentResponse.body._id;
      podObject = new Pod(validPod);
      podObjectReturned = await podObject.save();
      validProject2.pod_id = podObjectReturned._id;
      projectObject = new Project(validProject2);
      projectObjectReturned = await projectObject.save();
      validDeployment.project_id = projectObjectReturned._id;
      var response = await agent.post('/api/deployments').send(validDeployment).expect(201);
      response = await agent.get(`/api/documents/${documentResponse.body._id}`).expect(200);
      response.body.content.should.deepEqual(autoPopulateCENMContentValuesExpectedIPv6);
    });

    it('should not autopopulate duplicate IP addresses in ENM SED even with regards to common ENM/VNF value keys', async function () {
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      documentResponse = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);
      validDeployment.enm.sed_id = documentResponse.body._id;
      podObject = new Pod(validPod);
      podObjectReturned = await podObject.save();
      validProject.pod_id = podObjectReturned._id;
      projectObject = new Project(validProject);
      projectObjectReturned = await projectObject.save();
      validDeployment.project_id = projectObjectReturned._id;
      await agent.post('/api/deployments').send(validDeployment).expect(201);
      response = await agent.put(`/api/documents/${documentResponse.body._id}`).send().expect(200);
      response.body.content.should.deepEqual(autoPopulateContentValuesExpected);
      response.body.autopopulate = false;
      response.body.content.parameters.enm_laf_1_ip_external = response.body.content.parameters.service1_external_ip_list.split(',')[0];
      response = await agent.put(`/api/documents/${documentResponse.body._id}`).send(response.body).expect(200);
      response.body.content.parameters.enm_laf_1_ip_external.should.equal(response.body.content.parameters.service1_external_ip_list.split(',')[0]);
      response.body.autopopulate = true;
      response = await agent.put(`/api/documents/${documentResponse.body._id}`).send(response.body).expect(200);
      response.body.content.parameters.enm_laf_1_ip_external.should.not.equal(response.body.content.parameters.service1_external_ip_list.split(',')[0]);
    });

    it('should autopopulate vrrp keys with values not in use by enm seds in same network', async function () {
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
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
      response.body.content.parameters.lvs_external_CM_vrrp_id.should.equal('100');
      response.body.content.parameters.lvs_external_FM_vrrp_id.should.equal('101');
      response.body.content.parameters.lvs_external_PM_vrrp_id.should.equal('102');

      _documentUpdated = _.cloneDeep(validEnmSedDocument);
      _documentUpdated.schema_id = enmSedSchemaObjectReturned._id;
      _documentUpdated.name = 'document2';
      var documentResponse2 = await agent.post('/api/documents').send(_documentUpdated).expect(201);
      validDeployment.enm.sed_id = documentResponse2.body._id;
      podObject = new Pod(validPod);
      podObject.name = 'validPod2';
      podObject.authUrl = 'http://validPod2.com/';
      podObjectReturned = await podObject.save();

      validProject.pod_id = podObjectReturned._id;
      projectObject = new Project(validProject);
      projectObject.name = 'project2';
      projectObjectReturned = await projectObject.save();
      validDeployment.project_id = projectObjectReturned._id;
      deploymentObject = new Deployment(validDeployment);
      deploymentObject.name = 'deployment2';
      await deploymentObject.save();
      response = await agent.put(`/api/documents/${documentResponse2.body._id}`).send().expect(200);
      response.body.content.parameters.lvs_external_CM_vrrp_id.should.equal('100');
      response.body.content.parameters.lvs_external_FM_vrrp_id.should.equal('101');
      response.body.content.parameters.lvs_external_PM_vrrp_id.should.equal('102');
    });

    it('should autopopulate enm_sed keys during update with correct data when a schema has a boolean field (CIP-25166)', async function () {
      enmSedSchema.content.properties.parameters.properties.use_config_drive = {
        default: true,
        description: 'Whether you want to use config_drive or not',
        type: 'boolean'
      };
      enmSedSchema.content.properties.parameters.required.push('use_config_drive');
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      validEnmSedDocument.content.parameters.use_config_drive = true;
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
      autoPopulateContentValuesExpected.parameters.use_config_drive = true;
      response.body.content.should.deepEqual(autoPopulateContentValuesExpected);
    });

    it('should autopopulate temporary values for fqdn when haproxy_instances is set to 0', async function () {
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      _documentUpdated = _.cloneDeep(validEnmSedDocument);
      _documentUpdated.content.parameters.haproxy_instances = '0';
      _documentUpdated.schema_id = enmSedSchemaObjectReturned._id;
      documentResponse = await agent.post('/api/documents').send(_documentUpdated).expect(201);
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
      response.body.content.parameters.httpd_fqdn.should.equal('temporary.com');
      response.body.content.parameters.SSO_COOKIE_DOMAIN.should.equal('temporary.com');
    });

    it('should autopopulate dns fields when DNS is set to true', async function () {
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      _documentUpdated = _.cloneDeep(validEnmSedDocument);
      _documentUpdated.schema_id = enmSedSchemaObjectReturned._id;
      documentResponse = await agent.post('/api/documents').send(_documentUpdated).expect(201);
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
      response.body.content.parameters.httpd_fqdn.should.equal('ieatenmpd201-20.athtem.eei.ericsson.se');
      response.body.content.parameters.esmon_hostname.should.equal('ieatenmpd201-21');
      response.body.content.parameters.SSO_COOKIE_DOMAIN.should.equal('ieatenmpd201-20.athtem.eei.ericsson.se');
    });

    it('should not autopopulate dns fields when DNS is set to false', async function () {
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      _documentUpdated = _.cloneDeep(validEnmSedDocument);
      _documentUpdated.schema_id = enmSedSchemaObjectReturned._id;
      _documentUpdated.dns = false;
      documentResponse = await agent.post('/api/documents').send(_documentUpdated).expect(201);
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
      response.body.content.parameters.httpd_fqdn.should.equal('temporary.com');
      response.body.content.parameters.esmon_hostname.should.equal('temporary');
      response.body.content.parameters.SSO_COOKIE_DOMAIN.should.equal('temporary.com');
    });

    it('should not change vrrp ids when current values are valid', async function () {
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
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
      var vrrpId = 150;

      for (var i = 0; i < vrrpKeys.length; i += 1) {
        validEnmSedDocument.content.parameters[vrrpKeys[i]] = vrrpId.toString();
        vrrpId += 1;
      }

      // PUT doc with vrrp ids in middle of range
      var responseBeforeRangeUpdate = await agent.put(`/api/documents/${documentResponse.body._id}`).send(validEnmSedDocument).expect(200);

      // Update vrrp range
      podObject.networks[0].vrrp_range.start = 100;
      podObject.networks[0].vrrp_range.end = 200;
      await podObject.save();

      // Do PUT to trigger auto populate again
      var responseAfterRangeUpdate = await agent.put(`/api/documents/${documentResponse.body._id}`).send().expect(200);

      // Verify that vrrp ids have not changed as they were valid
      for (var x = 0; x < vrrpKeys.length; x += 1) {
        responseBeforeRangeUpdate.body.content.parameters[vrrpKeys[x]]
          .should.equal(responseAfterRangeUpdate.body.content.parameters[vrrpKeys[x]]);
      }
    });

    it('should auto populate new vrrp ids when they are introduced in a new schema', async function () {
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
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
      await nonAuthAgent.get(`/api/documents/${documentResponse.body._id}`).expect(200);

      enmSedSchemaObject = new Schema(enmSedSchemaWithExtraVrrp);
      enmSedSchemaObject.version = '1.39.1';
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      var response = await agent.put(`/api/documents/${documentResponse.body._id}`).send(validEnmSedDocument).expect(200);

      var vrrpKeyNames = ['lvs_external_CM_vrrp_id', 'lvs_external_PM_vrrp_id', 'lvs_external_FM_vrrp_id', 'lvs_external_UI_vrrp_id'];
      var uniqueAssignedIDs = {};
      for (var i = 0; i < vrrpKeyNames.length; i += 1) {
        // eslint-disable-next-line no-prototype-builtins
        uniqueAssignedIDs.hasOwnProperty(vrrpKeyNames[i]).should.be.false();
        uniqueAssignedIDs[response.body.content.parameters[vrrpKeyNames[i]]] = 'placeholder';
        response.body.content.parameters[vrrpKeyNames[i]].should.aboveOrEqual(podObject.networks[0].vrrp_range.start);
        response.body.content.parameters[vrrpKeyNames[i]].should.belowOrEqual(podObject.networks[0].vrrp_range.end);
      }
    });

    it('should update vrrp ids when current values are outside range', async function () {
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      validEnmSedDocument.content.parameters.lvs_external_CM_vrrp_id = '16';
      validEnmSedDocument.content.parameters.lvs_external_FM_vrrp_id = '17';
      validEnmSedDocument.content.parameters.lvs_external_PM_vrrp_id = '18';
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


      // Update vrrp range
      podObject.networks[0].vrrp_range.start = 150;
      podObject.networks[0].vrrp_range.end = 200;
      await podObject.save();

      // Do PUT to trigger auto populate again
      var responseAfterRangeUpdate = await agent.put(`/api/documents/${documentResponse.body._id}`).send().expect(200);

      // Verify that vrrp ids have updated as they were found to be outside range
      for (var i = 0; i < vrrpKeys.length; i += 1) {
        parseInt(responseAfterRangeUpdate.body.content.parameters[vrrpKeys[i]], 10)
          .should.be.belowOrEqual(podObject.networks[0].vrrp_range.end);
        parseInt(responseAfterRangeUpdate.body.content.parameters[vrrpKeys[i]], 10)
          .should.be.aboveOrEqual(podObject.networks[0].vrrp_range.start);
      }
    });

    it('should replace duplicated vrrp ids with temp values when doc not assigned to deployment', async function () {
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      for (var i = 0; i < vrrpKeys.length; i += 1) {
        validEnmSedDocument.content.parameters[vrrpKeys[i]] = '220';
      }
      documentResponse = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);
      for (var x = 0; x < vrrpKeys.length; x += 1) {
        documentResponse.body.content.parameters[vrrpKeys[x]].should.not.equal(220);
      }
    });

    it('should throw error when not enough vrrp ids are available for autopopulation: Range 1 - 2', async function () {
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      documentResponse = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);
      validDeployment.enm.sed_id = documentResponse.body._id;
      podObject = new Pod(validPod);
      podObject.networks[0].vrrp_range.start = 1;
      podObject.networks[0].vrrp_range.end = 2;
      podObjectReturned = await podObject.save();
      validProject.pod_id = podObjectReturned._id;
      projectObject = new Project(validProject);
      projectObjectReturned = await projectObject.save();
      validDeployment.project_id = projectObjectReturned._id;
      deploymentObject = new Deployment(validDeployment);
      await deploymentObject.save();
      response = await agent.put(`/api/documents/${documentResponse.body._id}`).send().expect(422);
      response.body.message.should.equal('Not enough Vrrp ids available to populate document. 2 available, 3 required.');
    });

    it('should throw error when not enough vrrp ids are available for autopopulation of multiple documents: Range 1 - 4', async function () {
      var validEnmSedDocument2 = _.cloneDeep(validEnmSedDocument);
      var validProject2 = _.cloneDeep(validProject);
      var validDeployment2 = _.cloneDeep(validDeployment);

      // Schema
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();

      // Document 1
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      documentResponse = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);

      // Document 2
      validEnmSedDocument2.name = 'validSedDocument2';
      validEnmSedDocument2.schema_id = enmSedSchemaObjectReturned._id;
      var documentResponse2 = await agent.post('/api/documents').send(validEnmSedDocument2).expect(201);

      // Pod
      podObject = new Pod(validPod);
      podObject.networks[0].vrrp_range.start = 1;
      podObject.networks[0].vrrp_range.end = 4;
      podObjectReturned = await podObject.save();

      // Project 1
      validProject.pod_id = podObjectReturned._id;
      projectObject = new Project(validProject);
      projectObjectReturned = await projectObject.save();

      // Project 2
      validProject2.pod_id = podObjectReturned._id;
      validProject2.name = 'validProject2';
      var projectObject2 = new Project(validProject2);
      var projectObjectReturned2 = await projectObject2.save();

      // Deployment 1
      validDeployment.enm.sed_id = documentResponse.body._id;
      validDeployment.project_id = projectObjectReturned._id;
      deploymentObject = new Deployment(validDeployment);
      await deploymentObject.save();
      response = await agent.put(`/api/documents/${documentResponse.body._id}`).send().expect(200);

      // Deployment 2
      validDeployment2.name = 'validDeployment2';
      validDeployment2.enm.sed_id = documentResponse2.body._id;
      validDeployment2.project_id = projectObjectReturned2._id;
      var deploymentObject2 = new Deployment(validDeployment2);
      await deploymentObject2.save();
      response = await agent.put(`/api/documents/${documentResponse2.body._id}`).send().expect(422);
      response.body.message.should.equal('Not enough Vrrp ids available to populate document. 1 available, 3 required.');
    });

    it('should set unique vrrp ids for multiple documents when enough are available for autopopulation: Range 1 - 6', async function () {
      var validEnmSedDocument2 = _.cloneDeep(validEnmSedDocument);
      var validProject2 = _.cloneDeep(validProject);
      var validDeployment2 = _.cloneDeep(validDeployment);

      // Schema
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();

      // Document 1
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      documentResponse = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);

      // Document 2
      validEnmSedDocument2.name = 'validSedDocument2';
      validEnmSedDocument2.schema_id = enmSedSchemaObjectReturned._id;
      var documentResponse2 = await agent.post('/api/documents').send(validEnmSedDocument2).expect(201);

      // Pod
      podObject = new Pod(validPod);
      podObject.networks[0].vrrp_range.start = 1;
      podObject.networks[0].vrrp_range.end = 6;
      podObjectReturned = await podObject.save();

      // Project 1
      validProject.pod_id = podObjectReturned._id;
      projectObject = new Project(validProject);
      projectObjectReturned = await projectObject.save();

      // Project 2
      validProject2.pod_id = podObjectReturned._id;
      validProject2.name = 'validProject2';
      var projectObject2 = new Project(validProject2);
      var projectObjectReturned2 = await projectObject2.save();

      var vrrpIdsAssigned = [];

      // Deployment 1
      validDeployment.enm.sed_id = documentResponse.body._id;
      validDeployment.project_id = projectObjectReturned._id;
      deploymentObject = new Deployment(validDeployment);
      await deploymentObject.save();
      response = await agent.put(`/api/documents/${documentResponse.body._id}`).send().expect(200);
      response.body.content.parameters.should.not.equal(undefined);
      for (var i = 0; i < vrrpKeys.length; i += 1) {
        vrrpIdsAssigned.push(response.body.content.parameters[vrrpKeys[i]]);
      }

      // Deployment 2
      validDeployment2.name = 'validDeployment2';
      validDeployment2.enm.sed_id = documentResponse2.body._id;
      validDeployment2.project_id = projectObjectReturned2._id;
      var deploymentObject2 = new Deployment(validDeployment2);
      await deploymentObject2.save();
      response = await agent.put(`/api/documents/${documentResponse2.body._id}`).send().expect(200);
      response.body.content.parameters.should.not.equal(undefined);
      for (var j = 0; j < vrrpKeys.length; j += 1) {
        vrrpIdsAssigned.push(response.body.content.parameters[vrrpKeys[j]]);
      }

      vrrpIdsAssigned.should.have.size(6);
      while (vrrpIdsAssigned.length > 0) {
        var vrrpId = vrrpIdsAssigned.pop();
        vrrpIdsAssigned.includes(vrrpId).should.not.be.true();
      }
    });

    it('should modify vrrp ids when duplicates are found during update', async function () {
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
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
      var duplicateValue = '220';
      for (var x = 0; x < vrrpKeys.length; x += 1) {
        validEnmSedDocument.content.parameters[vrrpKeys[x]] = duplicateValue;
      }
      response = await agent.put(`/api/documents/${documentResponse.body._id}`).send(validEnmSedDocument).expect(200);
      var uniqueAssignedIDs = {};
      for (var i = 0; i < vrrpKeys.length; i += 1) {
        // eslint-disable-next-line no-prototype-builtins
        uniqueAssignedIDs.hasOwnProperty(vrrpKeys[i]).should.be.false();
        uniqueAssignedIDs[response.body.content.parameters[vrrpKeys[i]]] = 'placeholder';
        response.body.content.parameters[vrrpKeys[i]].should.aboveOrEqual(podObject.networks[0].vrrp_range.start);
        response.body.content.parameters[vrrpKeys[i]].should.belowOrEqual(podObject.networks[0].vrrp_range.end);
      }
    });

    it('should throw error when not enough vrrp ids are available for autopopulation: Range 59 - 60', async function () {
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      documentResponse = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);
      validDeployment.enm.sed_id = documentResponse.body._id;
      podObject = new Pod(validPod);
      podObject.networks[0].vrrp_range.start = 59;
      podObject.networks[0].vrrp_range.end = 60;
      podObjectReturned = await podObject.save();
      validProject.pod_id = podObjectReturned._id;
      projectObject = new Project(validProject);
      projectObjectReturned = await projectObject.save();
      validDeployment.project_id = projectObjectReturned._id;
      deploymentObject = new Deployment(validDeployment);
      await deploymentObject.save();
      response = await agent.put(`/api/documents/${documentResponse.body._id}`).send().expect(422);
      response.body.message.should.equal('Not enough Vrrp ids available to populate document. 2 available, 3 required.');
    });

    it('should not autopopulate the same vrrp ids in documents which use the same pod network', async function () {
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
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
      await agent.put(`/api/documents/${documentResponse.body._id}`).send().expect(200);

      var clonedDoc = _.cloneDeep(validEnmSedDocument);
      var clonedValidDeployment = _.cloneDeep(validDeployment);
      var clonedValidProject = _.cloneDeep(validProject);
      clonedDoc.name = 'clonedDoc';
      var clonedDocumentResponse = await agent.post('/api/documents').send(clonedDoc).expect(201);
      clonedValidDeployment.enm.sed_id = clonedDocumentResponse.body._id;
      var clonedProjectObject = new Project(clonedValidProject);
      clonedProjectObject.name = 'clonedValidProject';
      clonedProjectObject.pod_id = podObjectReturned._id;
      var clonedProjectObjectReturned = await clonedProjectObject.save();
      clonedValidDeployment.project_id = clonedProjectObjectReturned._id;
      var clonedDeploymentObject = new Deployment(clonedValidDeployment);
      clonedDeploymentObject.name = 'clonedValidDeployment';
      await clonedDeploymentObject.save();
      await agent.put(`/api/documents/${clonedDocumentResponse.body._id}`).send().expect(200);

      response = await nonAuthAgent.get('/api/documents/').send().expect(200);
      var documents = response.body;
      var vrrpIdsAssigned = [];
      for (var doc in documents) {
        if (documents[doc].content.parameters) {
          for (var i = 0; i < vrrpKeys.length; i += 1) {
            vrrpIdsAssigned.push(documents[doc].content.parameters[vrrpKeys[i]]);
          }
        }
      }
      vrrpIdsAssigned.should.have.size(6);
      while (vrrpIdsAssigned.length > 0) {
        var vrrpId = vrrpIdsAssigned.pop();
        vrrpIdsAssigned.includes(vrrpId).should.not.be.true();
      }
    });

    it('should autopopulate esmon_hostname with temporary when esmon_instances is zero', async function () {
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
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
      validEnmSedDocument.content.parameters.esmon_instances = '0';
      response = await agent.put(`/api/documents/${documentResponse.body._id}`).send(validEnmSedDocument).expect(200);
      response.body.content.parameters.esmon_hostname.should.equal('temporary');
    });

    it('should autopopulate extra enm_sed keys during schema update', async function () {
      var enmSedSchemaWithoutCloudManagerTenantName = _.cloneDeep(enmSedSchema);
      enmSedSchemaWithoutCloudManagerTenantName.version = '1.1.1';
      _.unset(enmSedSchemaWithoutCloudManagerTenantName.content, 'properties.parameters.properties.cloudManagerTenantName');
      _.pull(_.get(enmSedSchemaWithoutCloudManagerTenantName.content, 'properties.parameters.required'), 'cloudManagerTenantName');
      var enmSedSchemaObjectWithoutCloudManagerTenantName = new Schema(enmSedSchemaWithoutCloudManagerTenantName);
      var enmSedSchemaObjectWithoutCloudManagerTenantNameReturned = await enmSedSchemaObjectWithoutCloudManagerTenantName.save();

      var validEnmSedDocumentWithoutCloudManagerTenantName = _.cloneDeep(validEnmSedDocument);
      validEnmSedDocumentWithoutCloudManagerTenantName.schema_id = enmSedSchemaObjectWithoutCloudManagerTenantNameReturned._id;
      _.unset(validEnmSedDocumentWithoutCloudManagerTenantName.content, 'parameters.cloudManagerTenantName');
      var documentResponse = await agent.post('/api/documents').send(validEnmSedDocumentWithoutCloudManagerTenantName).expect(201);

      validDeployment.enm.sed_id = documentResponse.body._id;
      var PodObject = new Pod(validPod);
      var podObjectReturned = await PodObject.save();
      validProject.pod_id = podObjectReturned._id;
      var ProjectObject = new Project(validProject);
      var projectObjectReturned = await ProjectObject.save();
      validDeployment.project_id = projectObjectReturned._id;
      var DeploymentObject = new Deployment(validDeployment);
      await DeploymentObject.save();

      var enmSedSchemaObject = new Schema(enmSedSchema);
      var enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      response = await agent.put(`/api/documents/${documentResponse.body._id}`).send({ schema_id: enmSedSchemaObjectReturned._id }).expect(200);
      response.body.content.should.deepEqual(autoPopulateContentValuesExpected);
    });

    it('should auto switch managed configs during schema update', async function () {
      var labels = [
        'small', 'athlone', 'another_label'
      ];
      var labelPromises = [];
      for (var l = 0; l < labels.length; l += 1) {
        var LabelObject = new Label({ name: labels[l] });
        labelPromises.push(LabelObject.save());
      }
      await Promise.all(labelPromises);

      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();

      var smallSizeManagedConfigUsingOldSchema = _.cloneDeep(validEnmSedManagedConfig);
      smallSizeManagedConfigUsingOldSchema.schema_id = enmSedSchemaObjectReturned._id;
      smallSizeManagedConfigUsingOldSchema.name = 'sizeSmallOld';
      smallSizeManagedConfigUsingOldSchema.content.parameters.service1_instances = '10';
      smallSizeManagedConfigUsingOldSchema.labels = ['small'];

      var siteManagedConfigUsingOldSchema = _.cloneDeep(validEnmSedManagedConfig);
      siteManagedConfigUsingOldSchema.schema_id = enmSedSchemaObjectReturned._id;
      siteManagedConfigUsingOldSchema.name = 'siteOld';
      siteManagedConfigUsingOldSchema.content.parameters.notAutopopulatedKey = 'athlone_specific';
      siteManagedConfigUsingOldSchema.content.parameters.enm_external_network_name = 'athlone_network';
      siteManagedConfigUsingOldSchema.labels = ['athlone'];

      validEnmSedDocument.managedconfigs = [];
      response = await agent.post('/api/documents/').send(smallSizeManagedConfigUsingOldSchema).expect(201);
      validEnmSedDocument.managedconfigs.push(response.body._id);
      response = await agent.post('/api/documents/').send(siteManagedConfigUsingOldSchema).expect(201);
      validEnmSedDocument.managedconfigs.push(response.body._id);

      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      var documentResponse = await agent.post('/api/documents/').send(validEnmSedDocument).expect(201);

      enmSedSchema.version = '2.3.4';
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();

      var smallSizeManagedConfigUsingNewSchema = _.cloneDeep(validEnmSedManagedConfig);
      smallSizeManagedConfigUsingNewSchema.schema_id = enmSedSchemaObjectReturned._id;
      smallSizeManagedConfigUsingNewSchema.name = 'sizeSmallNew';
      smallSizeManagedConfigUsingNewSchema.content.parameters.service1_instances = '12';
      smallSizeManagedConfigUsingNewSchema.labels = ['small', 'another_label'];

      var siteManagedConfigUsingNewSchema = _.cloneDeep(validEnmSedManagedConfig);
      siteManagedConfigUsingNewSchema.schema_id = enmSedSchemaObjectReturned._id;
      siteManagedConfigUsingNewSchema.name = 'siteNew';
      siteManagedConfigUsingNewSchema.content.parameters.notAutopopulatedKey = 'athlone_specific_updated';
      siteManagedConfigUsingNewSchema.content.parameters.enm_external_network_name = 'athlone_network_updated';
      siteManagedConfigUsingNewSchema.labels = ['athlone'];

      var expectedManagedConfigIds = [];
      response = await agent.post('/api/documents/').send(smallSizeManagedConfigUsingNewSchema).expect(201);
      expectedManagedConfigIds.push(response.body._id);
      response = await agent.post('/api/documents/').send(siteManagedConfigUsingNewSchema).expect(201);
      expectedManagedConfigIds.push(response.body._id);

      response = await agent.put(`/api/documents/${documentResponse.body._id}`).send({ schema_id: enmSedSchemaObjectReturned._id }).expect(200);
      response.body.managedconfigs.should.deepEqual(expectedManagedConfigIds);
      response.body.content.parameters.service1_instances.should.equal(smallSizeManagedConfigUsingNewSchema.content.parameters.service1_instances);
      response.body.content.parameters.notAutopopulatedKey.should.equal(siteManagedConfigUsingNewSchema.content.parameters.notAutopopulatedKey);
      response.body.content.parameters.enm_external_network_name.should.equal('temporary');

      documentReturned = await Document.findById(documentResponse.body._id).lean().exec();
      JSON.parse(JSON.stringify(documentReturned.managedconfigs)).should.deepEqual(response.body.managedconfigs);
    });

    it('should fail to update when switching managed configs during schema update if there are too few matching managed configs', async function () {
      var labels = [
        'small'
      ];
      var labelPromises = [];
      for (var l = 0; l < labels.length; l += 1) {
        var LabelObject = new Label({ name: labels[l] });
        labelPromises.push(LabelObject.save());
      }
      await Promise.all(labelPromises);

      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();

      var smallSizeManagedConfigUsingOldSchema = _.cloneDeep(validEnmSedManagedConfig);
      smallSizeManagedConfigUsingOldSchema.schema_id = enmSedSchemaObjectReturned._id;
      smallSizeManagedConfigUsingOldSchema.name = 'sizeSmallOld';
      smallSizeManagedConfigUsingOldSchema.content.parameters.service1_instances = '10';
      smallSizeManagedConfigUsingOldSchema.labels = ['small'];

      validEnmSedDocument.managedconfigs = [];
      response = await agent.post('/api/documents/').send(smallSizeManagedConfigUsingOldSchema).expect(201);
      validEnmSedDocument.managedconfigs.push(response.body._id);

      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      var documentResponse = await agent.post('/api/documents/').send(validEnmSedDocument).expect(201);

      enmSedSchema.version = '2.3.4';
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();

      response = await agent.put(`/api/documents/${documentResponse.body._id}`).send({ schema_id: enmSedSchemaObjectReturned._id }).expect(422);
      response.body.message.should.equal('Could not find a managed config matching the requested schema and the labels from managed config \'sizeSmallOld\' (small)');
    });

    it('should not autopopulate enm_sed keys during update when theres not enough IPv4 addresses in the project ranges', async function () {
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
          end: '131.160.202.12'
        },
        {
          start: '131.160.202.15',
          end: '131.160.202.19'
        }
      ];
      var ProjectObject = new Project(validProject);
      var projectObjectReturned = await ProjectObject.save();
      validDeployment.project_id = projectObjectReturned._id;
      var DeploymentObject = new Deployment(validDeployment);
      await DeploymentObject.save();
      response = await agent.put(`/api/documents/${documentResponse.body._id}`).send().expect(422);
      response.body.message.should.equal('There are not enough free IPv4 addresses in the project ranges to auto populate. 17 IPv4 addresses are required in total but the project ranges only have 8 IPv4 addresses in total. Please add more and try again.');
    });

    it('should not autopopulate enm_sed keys during update when theres not enough IPv4 addresses in the internal network range', async function () {
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
      validEnmSedDocument.content.parameters.dynamic_ip_range_end = '10.10.7.250';
      response = await agent.put(`/api/documents/${documentResponse.body._id}`).send(validEnmSedDocument).expect(422);
      response.body.message.should.equal('There are not enough free IPv4 addresses in the internal ranges to auto populate. 6 IPv4 addresses are required in total but the internal ranges only have 5 IPv4 addresses in total. Please add more and try again.');
    });

    it('should not autopopulate if dns lookup of httpd_fqdn fails', async function () {
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
          start: '121.160.202.10',
          end: '121.160.202.100'
        }
      ];
      var ProjectObject = new Project(validProject);
      var projectObjectReturned = await ProjectObject.save();
      validDeployment.project_id = projectObjectReturned._id;
      var DeploymentObject = new Deployment(validDeployment);
      await DeploymentObject.save();
      validEnmSedDocument.content.parameters.haproxy_external_ip_list = '121.160.202.10';
      response = await agent.put(`/api/documents/${documentResponse.body._id}`).send(validEnmSedDocument).expect(422);
      response.body.message.should.equal('Unable to retrieve a hostname for ip \'121.160.202.10\', from dns');
    });

    it('should prevent assignment of valid IPs which are in original document as this fails upgrade', async function () {
      enmSedSchema.content.properties.parameters.properties.ipv4_test_key1 = {
        $ref: '#/definitions/ipv4_external'
      };
      enmSedSchema.content.properties.parameters.properties.ipv4_test_key2 = {
        $ref: '#/definitions/ipv4_external'
      };
      var enmSedSchemaObject = new Schema(enmSedSchema);
      var enmSedSchemaObjectReturned = await enmSedSchemaObject.save();

      delete enmSedSchema.content.properties.parameters.properties.ipv4_test_key1;
      enmSedSchema.content.properties.parameters.properties.ipv4_test_key3 = {
        $ref: '#/definitions/ipv4_external'
      };
      enmSedSchema.version = '9.9.9';
      var enmSedSchemaObjectWithoutKey = new Schema(enmSedSchema);
      var enmSedSchemaObjectReturnedWithoutKey = await enmSedSchemaObjectWithoutKey.save();

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
      documentResponse.body.content.parameters.ipv4_test_key1.should.equal('1.1.1.1');
      documentResponse.body.content.parameters.ipv4_test_key2.should.equal('1.1.1.1');
      should.not.exist(documentResponse.body.content.parameters.ipv4_test_key3);
      response = await agent.put(`/api/documents/${documentResponse.body._id}`).send(validEnmSedDocument).expect(200);
      response.body.content.parameters.ipv4_test_key1.should.equal('131.160.202.27');
      response.body.content.parameters.ipv4_test_key2.should.equal('131.160.202.28');
      should.not.exist(response.body.content.parameters.ipv4_test_key3);
      response = await agent.put(`/api/documents/${documentResponse.body._id}`)
        .send({ schema_id: enmSedSchemaObjectReturnedWithoutKey._id }).expect(422);
      response.body.message.should.equal('There are not enough free ipv4 addresses in the ranges to auto populate. Please add more and try again.');
    });

    it('should save document with auto population not using recently released IP address', async function () {
      enmSedSchema.content.properties.parameters.properties.ipv4_test_key1 = {
        $ref: '#/definitions/ipv4_external'
      };
      enmSedSchema.content.properties.parameters.properties.ipv4_test_key2 = {
        $ref: '#/definitions/ipv4_external'
      };
      var enmSedSchemaObject = new Schema(enmSedSchema);
      var enmSedSchemaObjectReturned = await enmSedSchemaObject.save();

      delete enmSedSchema.content.properties.parameters.properties.ipv4_test_key1;
      enmSedSchema.content.properties.parameters.properties.ipv4_test_key3 = {
        $ref: '#/definitions/ipv4_external'
      };
      enmSedSchema.version = '1.39.1';
      var enmSedSchemaObjectWithoutKey = new Schema(enmSedSchema);
      var enmSedSchemaObjectReturnedWithoutKey = await enmSedSchemaObjectWithoutKey.save();

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
          end: '131.160.202.29'
        }
      ];
      var ProjectObject = new Project(validProject);
      var projectObjectReturned = await ProjectObject.save();
      validDeployment.project_id = projectObjectReturned._id;
      var DeploymentObject = new Deployment(validDeployment);
      await DeploymentObject.save();
      documentResponse.body.content.parameters.ipv4_test_key1.should.equal('1.1.1.1');
      documentResponse.body.content.parameters.ipv4_test_key2.should.equal('1.1.1.1');
      should.not.exist(documentResponse.body.content.parameters.ipv4_test_key3);
      response = await agent.put(`/api/documents/${documentResponse.body._id}`).send(validEnmSedDocument).expect(200);
      response.body.content.parameters.ipv4_test_key1.should.equal('131.160.202.27');
      response.body.content.parameters.ipv4_test_key2.should.equal('131.160.202.28');
      should.not.exist(response.body.content.parameters.ipv4_test_key3);
      response = await agent.put(`/api/documents/${documentResponse.body._id}`)
        .send({ schema_id: enmSedSchemaObjectReturnedWithoutKey._id }).expect(200);
      should.not.exist(response.body.content.parameters.ipv4_test_key1);
      response.body.content.parameters.ipv4_test_key2.should.equal('131.160.202.28');
      response.body.content.parameters.ipv4_test_key3.should.equal('131.160.202.29');
    });

    it('should not autopopulate IPs which are used by static keys', async function () {
      enmSedSchema.content.properties.parameters.properties.ipv4_test_key1 = {
        $ref: '#/definitions/ipv4_external'
      };
      enmSedSchema.content.properties.parameters.properties.ipv4_test_key2 = {
        $ref: '#/definitions/ipv4_external'
      };
      enmSedSchema.content.properties.parameters.properties.ipv4_test_static_key = {
        $ref: '#/definitions/nfs_ipv4_external_list'
      };
      var enmSedSchemaObject = new Schema(enmSedSchema);
      var enmSedSchemaObjectReturned = await enmSedSchemaObject.save();

      delete enmSedSchema.content.properties.parameters.properties.ipv4_test_key1;
      enmSedSchema.content.properties.parameters.properties.ipv4_test_key3 = {
        $ref: '#/definitions/ipv4_external'
      };

      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      validEnmSedDocument.content.parameters.ipv4_test_static_key = '131.160.202.27';
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
          end: '131.160.202.29'
        }
      ];
      var ProjectObject = new Project(validProject);
      var projectObjectReturned = await ProjectObject.save();
      validDeployment.project_id = projectObjectReturned._id;
      var DeploymentObject = new Deployment(validDeployment);
      await DeploymentObject.save();
      documentResponse.body.content.parameters.ipv4_test_key1.should.equal('1.1.1.1');
      documentResponse.body.content.parameters.ipv4_test_key2.should.equal('1.1.1.1');
      response = await agent.put(`/api/documents/${documentResponse.body._id}`).send(validEnmSedDocument).expect(200);
      response.body.content.parameters.ipv4_test_static_key.should.equal('131.160.202.27');
      response.body.content.parameters.ipv4_test_key1.should.equal('131.160.202.28');
      response.body.content.parameters.ipv4_test_key2.should.equal('131.160.202.29');
    });

    it('should autopopulate enm_sed keys post project id update', async function () {
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      var enmSedDocumentResponse = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);
      validDeployment.enm.sed_id = enmSedDocumentResponse.body._id;

      podObject = new Pod(validPod);
      podObject.authUrl = 'http://cloud4a.athtem.eei.ericsson.se:5000/v2.0';
      podObjectReturned = await podObject.save();

      validProject.pod_id = podObjectReturned._id;
      projectObject = new Project(validProject);
      projectObjectReturned = await projectObject.save();

      validDeployment.project_id = projectObjectReturned._id;
      deploymentObject = new Deployment(validDeployment);
      await deploymentObject.save();
      projectObject.id = 'updatedValidProjectId';
      projectObject.name = 'updatedValidProjectName';

      await agent.put(`/api/projects/${projectObjectReturned._id}`).send(projectObject).expect(200);
      var autopopulatedEnmSedDocument = await agent.get(`/api/documents/${enmSedDocumentResponse.body._id}`).expect(200);
      autopopulatedEnmSedDocument.body.content.parameters.vim_tenant_name.should.equal('updatedValidProjectName');
      autopopulatedEnmSedDocument.body.content.parameters.vim_name.should.equal('vim_updatedValidProjectName');
      autopopulatedEnmSedDocument.body.content.parameters.cloudManagerTenantId.should.equal('updatedValidProjectId');
      autopopulatedEnmSedDocument.body.content.parameters.cloudManagerTenantName.should.equal('updatedValidProjectName');
    });

    it('should revert project update on autopopulate failure', async function () {
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      var enmSedDocumentResponse = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);
      validDeployment.enm.sed_id = enmSedDocumentResponse.body._id;

      podObject = new Pod(validPod);
      podObject.authUrl = 'http://cloud4a.athtem.eei.ericsson.se:5000/v2.0';
      podObjectReturned = await podObject.save();

      validProject.pod_id = podObjectReturned._id;
      projectObject = new Project(validProject);
      projectObjectReturned = await projectObject.save();

      validDeployment.project_id = projectObjectReturned._id;
      deploymentObject = new Deployment(validDeployment);
      await deploymentObject.save();
      projectObject.id = 'updatedValidProjectId';
      projectObject.name = 'updatedValidProjectName';
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
      var autopopulatedEnmSedDocument = await agent.get(`/api/documents/${enmSedDocumentResponse.body._id}`).expect(200);
      autopopulatedEnmSedDocument.body.content.parameters.vim_tenant_name.should.not.equal('updatedValidProjectName');
      autopopulatedEnmSedDocument.body.content.parameters.vim_name.should.not.equal('vim_updatedValidProjectName');
      autopopulatedEnmSedDocument.body.content.parameters.cloudManagerTenantId.should.not.equal('updatedValidProjectId');
      autopopulatedEnmSedDocument.body.content.parameters.cloudManagerTenantName.should.not.equal('updatedValidProjectName');
    });

    it('should allow a managed config to be updated with only some keys populated', async function () {
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedManagedConfig.schema_id = enmSedSchemaObjectReturned._id;
      response = await agent.post('/api/documents').send(validEnmSedManagedConfig).expect(201);
      response = await agent.put(`/api/documents/${response.body._id}`).send(validEnmSedManagedConfig).expect(200);
      response.body.content.should.deepEqual(validEnmSedManagedConfig.content);
    });

    it('should not allow a managed config to be updated with invalid keys', async function () {
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedManagedConfig.schema_id = enmSedSchemaObjectReturned._id;
      response = await agent.post('/api/documents').send(validEnmSedManagedConfig).expect(201);
      validEnmSedManagedConfig.content.parameters.invalidKey = 'invalidValue';
      response = await agent.put(`/api/documents/${response.body._id}`).send(validEnmSedManagedConfig).expect(422);
      response.body.message.should.containEql('errors found when validating the given document against the schema');
    });

    it('should allow a managed config to be updated as empty fields are removed', async function () {
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedManagedConfig.schema_id = enmSedSchemaObjectReturned._id;
      response = await agent.post('/api/documents').send(validEnmSedManagedConfig).expect(201);
      validEnmSedManagedConfig.content.parameters.enm_external_network_name = '';
      response = await agent.put(`/api/documents/${response.body._id}`).send(validEnmSedManagedConfig).expect(200);
      should.not.exist(response.body.content.parameters.enm_external_network_name);
    });

    it('should not allow a managed config to be updated with managed config and autopopulate enabled', async function () {
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedManagedConfig.schema_id = enmSedSchemaObjectReturned._id;
      response = await agent.post('/api/documents').send(validEnmSedManagedConfig).expect(201);
      validEnmSedManagedConfig.autopopulate = true;
      response = await agent.put(`/api/documents/${response.body._id}`).send(validEnmSedManagedConfig).expect(422);
      response.body.message.should.equal('You cannot have both managed config and autopopulate enabled together');
    });

    it('should not introduce defaults during schema update only on a managed config', async function () {
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedManagedConfig.schema_id = enmSedSchemaObjectReturned._id;
      response = await agent.post('/api/documents').send(validEnmSedManagedConfig).expect(201);
      enmSedSchema.version = '2.2.2';
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      var schemaUpdateOnly = {
        schema_id: enmSedSchemaObjectReturned._id
      };
      response = await agent.put(`/api/documents/${response.body._id}`).send(schemaUpdateOnly).expect(200);
      response.body.content.should.deepEqual(validEnmSedManagedConfig.content);
    });

    it('should not allow a managed config to be updated with attached managed configs', async function () {
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedManagedConfig.schema_id = enmSedSchemaObjectReturned._id;
      response = await agent.post('/api/documents').send(validEnmSedManagedConfig).expect(201);
      validEnmSedManagedConfig.name = 'anothername';
      validEnmSedManagedConfig.managedconfigs = [
        response.body._id
      ];
      response = await agent.put(`/api/documents/${response.body._id}`).send(validEnmSedManagedConfig).expect(422);
      response.body.message.should.equal('A managed config cannot have managed configs attached to it');
    });

    it('should merge managed configs during update', async function () {
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedManagedConfig.schema_id = enmSedSchemaObjectReturned._id;
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      validEnmSedDocument.managedconfigs = [];
      response = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);
      var documentID = response.body._id;
      validEnmSedManagedConfig.content.parameters.service1_instances = '5';
      validEnmSedManagedConfig.content.parameters.neo4j_instances = '6';
      response = await agent.post('/api/documents').send(validEnmSedManagedConfig).expect(201);
      validEnmSedDocument.managedconfigs.push(response.body._id);
      delete validEnmSedManagedConfig.content.parameters.neo4j_instances;
      validEnmSedManagedConfig.content.parameters.service1_instances = '7';
      validEnmSedManagedConfig.content.parameters.service2_instances = '8';
      validEnmSedManagedConfig.name = 'anotherManagedConfig';
      response = await agent.post('/api/documents').send(validEnmSedManagedConfig).expect(201);
      validEnmSedDocument.managedconfigs.push(response.body._id);
      response = await agent.put(`/api/documents/${documentID}`).send(validEnmSedDocument).expect(200);
      response.body.content.parameters.neo4j_instances.should.deepEqual('6');
      response.body.content.parameters.service1_instances.should.deepEqual('7');
      response.body.content.parameters.service2_instances.should.deepEqual('8');
    });

    it('should merge managed configs before autopopulate runs during update', async function () {
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
      validEnmSedManagedConfig.schema_id = enmSedSchemaObjectReturned._id;
      validEnmSedManagedConfig.content.parameters.service1_instances = '1';
      response = await agent.post('/api/documents').send(validEnmSedManagedConfig).expect(201);
      validEnmSedDocument.managedconfigs = [
        response.body._id
      ];
      response = await agent.put(`/api/documents/${documentResponse.body._id}`).send(validEnmSedDocument).expect(200);
      response.body.content.parameters.service1_external_ip_list.should.deepEqual('131.160.202.10');
    });

    it('should not allow document with invalid label', async function () {
      badDocument = _.cloneDeep(validDocument);
      badDocument.labels = ['invalidLabel'];
      response = await agent.put(`/api/documents/${document._id}`).send(badDocument).expect(422);
      response.body.message.should.equal('Label \'invalidLabel\' does not exist!');
    });

    it('should allow document with valid label', async function () {
      _documentUpdated = _.cloneDeep(validDocument);
      _documentUpdated.labels = ['validLabel'];
      labelObject = new Label({ name: 'validLabel' });
      await labelObject.save();
      response = await agent.put(`/api/documents/${document._id}`).send(_documentUpdated).expect(200);
      _.isEqual(response.body.labels, _documentUpdated.labels).should.be.true();
    });

    it('should allow document with multiple valid labels', async function () {
      labelObject = new Label({ name: 'validLabel' });
      await labelObject.save();
      labelObject = new Label({ name: 'validLabel2' });
      await labelObject.save();
      labelObject = new Label({ name: 'validLabel3' });
      await labelObject.save();
      _documentUpdated = _.cloneDeep(validDocument);
      _documentUpdated.labels = ['validLabel', 'validLabel2', 'validLabel3'];
      response = await agent.put(`/api/documents/${document._id}`).send(_documentUpdated).expect(200);
      _.isEqual(response.body.labels, _documentUpdated.labels).should.be.true();
    });

    it('should not allow document with duplicate labels', async function () {
      badDocument = _.cloneDeep(validDocument);
      badDocument.labels = ['invalidLabel', 'invalidLabel'];
      response = await agent.put(`/api/documents/${document._id}`).send(badDocument).expect(422);
      response.body.message.should.equal('There are duplicate labels assigned to this document.');
    });

    it('should not allow a document to switch managed config modes during update', async function () {
      validDocument.managedconfig = true;
      validDocument.autopopulate = false;
      response = await agent.put(`/api/documents/${document._id}`).send(validDocument).expect(422);
      response.body.message.should.equal('You cannot change a documents managed config mode');
    });

    it('should not allow a managed config to be updated with attached managed configs using a different schema', async function () {
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      enmSedSchema.version = '2.3.4';
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedManagedConfig.schema_id = enmSedSchemaObjectReturned._id;
      var managedConfigResponse = await agent.post('/api/documents').send(validEnmSedManagedConfig).expect(201);
      response = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);
      validEnmSedDocument.managedconfigs = [managedConfigResponse.body._id];
      response = await agent.put(`/api/documents/${response.body._id}`).send(validEnmSedDocument).expect(422);
      response.body.message.should.equal('The attached managed config \'validSedMConfig\' is not using the same schema id as the document itself');
    });

    it('should not allow a document to be updated with attached managed configs that are not managed configs', async function () {
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      response = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);
      validEnmSedDocument.name = 'another_name';
      validEnmSedDocument.managedconfigs = [response.body._id];
      response = await agent.put(`/api/documents/${response.body._id}`).send(validEnmSedDocument).expect(422);
      response.body.message.should.equal('You cannot attach the document \'validSedDocument\' as a managed config as it is not a managed config');
    });

    it('should not allow a document to be updated with duplicate managed configs', async function () {
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedManagedConfig.schema_id = enmSedSchemaObjectReturned._id;
      response = await agent.post('/api/documents').send(validEnmSedManagedConfig).expect(201);
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      response = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);
      validEnmSedDocument.managedconfigs = [response.body._id, response.body._id];
      response = await agent.put(`/api/documents/${response.body._id}`).send(validEnmSedDocument).expect(422);
      response.body.message.should.equal('You cannot attach the same managed config twice');
    });

    it('should not use given created_at value', async function () {
      badDocument = _.cloneDeep(validDocument);
      badDocument.created_at = '2017-01-16T09:17:01.441Z';
      response = await agent.put(`/api/documents/${document._id}`).send(badDocument).expect(200);
      var currentDate = new Date();
      var createdAtDate = new Date(response.body.created_at);
      var createdAtDateDifference = currentDate.getTime() - createdAtDate.getTime();
      createdAtDateDifference.should.be.lessThanOrEqual(2000);
    });

    it('should not use given updated_at value', async function () {
      badDocument = _.cloneDeep(validDocument);
      badDocument.updated_at = '2017-01-16T09:17:01.441Z';
      response = await agent.put(`/api/documents/${document._id}`).send(badDocument).expect(200);
      var currentDate = new Date();
      var updatedAtDate = new Date(response.body.updated_at);
      var updatedAtDateDifference = currentDate.getTime() - updatedAtDate.getTime();
      updatedAtDateDifference.should.be.lessThanOrEqual(2000);
    });

    it('should update an existing log with user-details for a document thats updated by a logged-in user', async function () {
      response = await agent.put(`/api/documents/${document._id}`)
        .send(validDocumentUpdate)
        .auth(validUser.username, validUser.password)
        .expect(200);
      response.body._id.should.have.length(24);
      response.body.name.should.equal(validDocumentUpdate.name);

      logReturned = await History.findOne({ associated_id: response.body._id }).exec();
      logReturned.originalData.should.not.equal(undefined);
      logReturned.originalData.name.should.equal(document.name);

      logReturned.updates.should.be.instanceof(Array).and.have.lengthOf(1);
      logReturned.updates[0].updatedAt.should.not.equal(undefined);
      logReturned.updates[0].updatedBy.username.should.equal(validUser.username);
      logReturned.updates[0].updatedBy.email.should.equal(validUser.email);
      logReturned.updates[0].updateData.name.should.equal(validDocumentUpdate.name);
    });

    it('should create a log with defined user-details for a document that gets updated by a logged-in user', async function () {
      // clear logs and verify
      await History.remove().exec();
      logReturned = await History.findOne({ associated_id: response.body._id }).exec();
      should.not.exist(logReturned);

      response = await agent.put(`/api/documents/${document._id}`)
        .send(validDocumentUpdate)
        .auth(validUser.username, validUser.password)
        .expect(200);
      response.body._id.should.have.length(24);
      response.body.name.should.equal(validDocumentUpdate.name);

      logReturned = await History.findOne({ associated_id: response.body._id }).exec();
      logReturned.originalData.should.not.equal(undefined);
      logReturned.originalData.name.should.equal(document.name);

      logReturned.updates.should.be.instanceof(Array).and.have.lengthOf(1);
      logReturned.updates[0].updatedAt.should.not.equal(undefined);
      logReturned.updates[0].updatedBy.username.should.equal(validUser.username);
      logReturned.updates[0].updatedBy.email.should.equal(validUser.email);
      logReturned.updates[0].updateData.name.should.equal(validDocumentUpdate.name);
    });

    it('should throw error when enm schema version used over version 1.39.14 that requires vnflcm sed in a deployment', async function () {
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
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
      await nonAuthAgent.get(`/api/documents/${documentResponse.body._id}`).expect(200);

      enmSedSchemaObject = new Schema(enmSedSchemaWithExtraVrrp);
      enmSedSchemaObject.version = '1.61.1';
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      response = await agent.put(`/api/documents/${documentResponse.body._id}`).send(validEnmSedDocument).expect(422);
      response.body.message.should.containEql('For this ENM Schema version, a VNF-LCM SED is required.');
    });

    it('should throw error when enm schema snapshot version used over version 1.39.14 that requires vnflcm sed in a deployment', async function () {
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
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
      await nonAuthAgent.get(`/api/documents/${documentResponse.body._id}`).expect(200);

      enmSedSchemaObject = new Schema(enmSedSchemaWithExtraVrrp);
      enmSedSchemaObject.version = '1.61.1-SNAPSHOT20190417154400.noarch';
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      response = await agent.put(`/api/documents/${documentResponse.body._id}`).send(validEnmSedDocument).expect(422);
      response.body.message.should.containEql('For this ENM Schema version, a VNF-LCM SED is required.');
    });

    it('should not throw error when enm schema snapshot version used is lower than version 1.39.14', async function () {
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
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
      await nonAuthAgent.get(`/api/documents/${documentResponse.body._id}`).expect(200);

      enmSedSchemaObject = new Schema(enmSedSchemaWithExtraVrrp);
      enmSedSchemaObject.version = '1.39.1-SNAPSHOT20190417154400.noarch';
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      await agent.put(`/api/documents/${documentResponse.body._id}`).send(validEnmSedDocument).expect(200);
    });

    it('should update document schema and have new key with default definition value', async function () {
      var cenmSiteValuesSchema1 = new Schema(cenmSedSchema1);
      var returnedSchema1 = await cenmSiteValuesSchema1.save();
      var cenmSiteValuesSchema2 = new Schema(cenmSedSchema2);
      var returnedSchema2 = await cenmSiteValuesSchema2.save();
      var cenmSiteValueDocument = new Document({
        name: 'validcENMSedDocument',
        schema_id: returnedSchema1._id,
        content: {
          parameters: {
            log_streaming: 'false',
            key_no_ref_nodefault: 'noRefNoDefault',
            key_no_ref_notype_nodefault: 'noRefNoType'
          }
        }
      });
      var cenmSiteValueDocumentReturned = await cenmSiteValueDocument.save();
      response = await agent.put(`/api/documents/${cenmSiteValueDocumentReturned._id}`).send({ schema_id: returnedSchema2._id }).expect(200);
      response.body._id.should.have.length(24);
      response.body.name.should.equal(cenmSiteValueDocument.name);
      response.body.content.parameters.should.deepEqual({
        new: 'false',
        log_streaming: 'false',
        new_key_default_overwritten: 'true',
        new_key_default_no_ref: 'defaultKeyNoRef'
      });
    });

    it('should update document schema and have key thats not in new schema removed', async function () {
      var cenmSiteValuesSchema1 = new Schema(cenmSedSchema1);
      var returnedSchema1 = await cenmSiteValuesSchema1.save();
      var cenmSiteValuesSchema2 = new Schema(cenmSedSchema2);
      var returnedSchema2 = await cenmSiteValuesSchema2.save();
      var cenmSiteValueDocument = new Document({
        name: 'validcENMSedDocument',
        schema_id: returnedSchema2._id,
        content: {
          parameters: {
            log_streaming: 'false',
            new: 'true'
          }
        }
      });
      var cenmSiteValueDocumentReturned = await cenmSiteValueDocument.save();
      response = await agent.put(`/api/documents/${cenmSiteValueDocumentReturned._id}`).send({ schema_id: returnedSchema1._id }).expect(200);
      response.body._id.should.have.length(24);
      response.body.name.should.equal(cenmSiteValueDocument.name);
      response.body.content.parameters.should.deepEqual({
        log_streaming: 'false',
        key_default_no_ref: 'defaultKeyNoRef',
        key_default_overwritten: 'true'
      });
    });

    it('should autopopulate COM_INF_LDAP_ROOT_SUFFIX and SSO_COOKIE_DOMAIN fields accordingly if Document is FFE', async function () {
      var enmSedSchemaObject = new Schema(enmSedSchema);
      var enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      // regex for SSO_COOKIE_DOMAIN, which gets generated from deployment_id if FFE does not allow capital letters
      validEnmSedDocument.content.parameters.deployment_id = 'testingdeployment';
      // not FFE
      var documentResponse = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);
      validDeployment.enm.sed_id = documentResponse.body._id;
      var PodObject = new Pod(validPod);
      var podObjectReturned = await PodObject.save();
      validProject.pod_id = podObjectReturned._id;
      var ProjectObject = new Project(validProject);
      var projectObjectReturned = await ProjectObject.save();
      validDeployment.project_id = projectObjectReturned._id;

      // use API to create Deployment, so Document resave gets triggered
      await agent.post('/api/deployments').send(validDeployment).expect(201);

      documentResponse = await agent.get(`/api/documents/${documentResponse.body._id}`).expect(200);
      documentResponse.body.content.parameters.COM_INF_LDAP_ROOT_SUFFIX.should.equal('dc=ieatenmpd201-20,dc=com');
      documentResponse.body.content.parameters.SSO_COOKIE_DOMAIN.should.equal('ieatenmpd201-20.athtem.eei.ericsson.se');

      // Change Document to FFE
      documentResponse = await agent.put(`/api/documents/${documentResponse.body._id}`).send({ isFFE: true }).expect(200);
      documentResponse.body.content.parameters.COM_INF_LDAP_ROOT_SUFFIX.should.equal('dc=testingdeployment,dc=com');
      documentResponse.body.content.parameters.SSO_COOKIE_DOMAIN.should.equal('testingdeployment.athtem.eei.ericsson.se');
    });

    it('should not autopopulate httpd_fqdn and esmon_hostname when Document is FFE', async function () {
      var enmSedSchemaObject = new Schema(enmSedSchema);
      var enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      // regex for SSO_COOKIE_DOMAIN, which gets generated from deployment_id if FFE does not allow capital letters
      validEnmSedDocument.content.parameters.deployment_id = 'testingdeployment';
      validEnmSedDocument.content.parameters.esmon_hostname = 'testingdeployment-esmon';
      validEnmSedDocument.content.parameters.httpd_fqdn = 'enmapache.athtem.eei.ericsson.se';
      validEnmSedDocument.isFFE = true;
      var documentResponse = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);
      // If autopop would populate, at this point both would be 'temporay' 'temporary.com'
      documentResponse.body.content.parameters.esmon_hostname.should.equal('testingdeployment-esmon');
      documentResponse.body.content.parameters.httpd_fqdn.should.equal('enmapache.athtem.eei.ericsson.se');

      validDeployment.enm.sed_id = documentResponse.body._id;
      var PodObject = new Pod(validPod);
      var podObjectReturned = await PodObject.save();
      validProject.pod_id = podObjectReturned._id;
      var ProjectObject = new Project(validProject);
      var projectObjectReturned = await ProjectObject.save();
      validDeployment.project_id = projectObjectReturned._id;

      // use API to create Deployment, so Document resave gets triggered
      await agent.post('/api/deployments').send(validDeployment).expect(201);

      // should stil be same as before adding Deployment
      documentResponse = await agent.get(`/api/documents/${documentResponse.body._id}`).expect(200);
      documentResponse.body.content.parameters.esmon_hostname.should.equal('testingdeployment-esmon');
      documentResponse.body.content.parameters.httpd_fqdn.should.equal('enmapache.athtem.eei.ericsson.se');
    });

    it('should autopopulate serviceregistry_internal_ip_list key in VNFLCM SED and reflect that value in ENM SED', async function () {
      // enm sed schema
      var enmSedSchemaObject = new Schema(enmSedSchema2);
      var enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      // enm sed
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      validEnmSedDocument.isFFE = true;
      validEnmSedDocument.name = 'validENMDocument';
      validEnmSedDocument.content.parameters.deployment_id = 'testingdeployment';
      validEnmSedDocument.content.parameters.esmon_hostname = 'testingdeployment-esmon';
      validEnmSedDocument.content.parameters.httpd_fqdn = 'enmapache.athtem.eei.ericsson.se';

      var enmDocumentResponse = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);

      // not part of deployment, value 1.1.1.1
      enmDocumentResponse.body.content.parameters.serviceregistry_internal_ip_list.should.equal('1.1.1.1');

      // add enm sed to deployment object
      validDeployment.enm.sed_id = enmDocumentResponse.body._id;

      // vnflcm schema
      var vnflcmSedSchemaObject = new Schema(validVnflcmSchema2);
      var vnflcmSedSchemaObjectReturned = await vnflcmSedSchemaObject.save();
      // vnflcm sed
      validVnflcmDocument.schema_id = vnflcmSedSchemaObjectReturned._id;
      validVnflcmDocument.autopopulate = true;
      validVnflcmDocument.name = 'validVNFLCMDocument';
      var vnflcmDocumentResponse = await agent.post('/api/documents').send(validVnflcmDocument).expect(201);
      // not part of deployment, value 1.1.1.1
      vnflcmDocumentResponse.body.content.parameters.serviceregistry_internal_ip_list.should.equal('1.1.1.1');

      var PodObject = new Pod(validPod);
      var podObjectReturned = await PodObject.save();
      validProject.pod_id = podObjectReturned._id;
      validProject.network.ipv4_ranges = [
        {
          start: '131.160.202.10',
          end: '131.160.202.15'
        },
        {
          start: '131.160.202.20',
          end: '131.160.202.35'
        }
      ];
      var ProjectObject = new Project(validProject);
      var projectObjectReturned = await ProjectObject.save();
      validDeployment.project_id = projectObjectReturned._id;

      // add vnflcm sed
      validDeployment.documents = [
        {
          schema_name: 'vnflcm_sed_schema',
          document_id: vnflcmDocumentResponse.body._id,
          schema_category: 'other'
        }
      ];
      // use API to create Deployment, so Document resave gets triggered
      await agent.post('/api/deployments').send(validDeployment).expect(201);

      // should stil be same as before adding Deployment
      enmDocumentResponse = await agent.get(`/api/documents/${enmDocumentResponse.body._id}`).expect(200);
      enmDocumentResponse.body.content.parameters.serviceregistry_internal_ip_list.should.equal('10.10.0.58');

      // should stil be same as before adding Deployment
      vnflcmDocumentResponse = await agent.get(`/api/documents/${vnflcmDocumentResponse.body._id}`).expect(200);
      vnflcmDocumentResponse.body.content.parameters.serviceregistry_internal_ip_list.should.equal('10.10.0.58');

      // update vnflcm doc, and check enmsed that its value got updated.
      // disable vnflcm autopop, make serviceregistry_internal_ip_list 4.4.4.4
      partialDocument = { content: vnflcmDocumentResponse.body.content };
      partialDocument.content.parameters.serviceregistry_internal_ip_list = '4.4.4.4';
      // disable autopop so can have custom value
      partialDocument.autopopulate = false;
      // triggers enm sed resave
      await agent.put(`/api/documents/${vnflcmDocumentResponse.body._id}`).send(partialDocument).expect(200);

      // check that value has changed in vnflcm sed
      vnflcmDocumentResponse = await agent.get(`/api/documents/${vnflcmDocumentResponse.body._id}`).expect(200);
      vnflcmDocumentResponse.body.content.parameters.serviceregistry_internal_ip_list.should.equal('4.4.4.4');

      // check that value has changed in enm sed
      enmDocumentResponse = await agent.get(`/api/documents/${enmDocumentResponse.body._id}`).expect(200);
      enmDocumentResponse.body.content.parameters.serviceregistry_internal_ip_list.should.equal('4.4.4.4');

      // autopop off enm sed, custom serviceregistry_internal_ip_list
      partialDocument = { content: enmDocumentResponse.body.content };
      partialDocument.content.parameters.serviceregistry_internal_ip_list = '2.2.2.2';
      partialDocument.autopopulate = false;
      await agent.put(`/api/documents/${enmDocumentResponse.body._id}`).send(partialDocument).expect(200);

      // check that value has not changed in vnflcm sed
      vnflcmDocumentResponse = await agent.get(`/api/documents/${vnflcmDocumentResponse.body._id}`).expect(200);
      vnflcmDocumentResponse.body.content.parameters.serviceregistry_internal_ip_list.should.equal('4.4.4.4');

      // check that value has changed in enm sed
      enmDocumentResponse = await agent.get(`/api/documents/${enmDocumentResponse.body._id}`).expect(200);
      enmDocumentResponse.body.content.parameters.serviceregistry_internal_ip_list.should.equal('2.2.2.2');

      // enable autopop for enm sed again
      partialDocument.autopopulate = true;
      await agent.put(`/api/documents/${enmDocumentResponse.body._id}`).send(partialDocument).expect(200);
      // check that value has not changed in vnflcm sed
      enmDocumentResponse = await agent.get(`/api/documents/${vnflcmDocumentResponse.body._id}`).expect(200);
      enmDocumentResponse.body.content.parameters.serviceregistry_internal_ip_list.should.equal('4.4.4.4');

      // check that value has changed in enm sed from vnflcm
      enmDocumentResponse = await agent.get(`/api/documents/${enmDocumentResponse.body._id}`).expect(200);
      enmDocumentResponse.body.content.parameters.serviceregistry_internal_ip_list.should.equal('4.4.4.4');

      // enable autopop for vnflcm sed
      partialDocument = { content: vnflcmDocumentResponse.body.content };
      partialDocument.autopopulate = true;
      await agent.put(`/api/documents/${vnflcmDocumentResponse.body._id}`).send(partialDocument).expect(200);

      // check that value has changed in vnflcm sed
      vnflcmDocumentResponse = await agent.get(`/api/documents/${vnflcmDocumentResponse.body._id}`).expect(200);
      vnflcmDocumentResponse.body.content.parameters.serviceregistry_internal_ip_list.should.equal('10.10.0.58');

      // check that value has changed in enm sed
      enmDocumentResponse = await agent.get(`/api/documents/${enmDocumentResponse.body._id}`).expect(200);
      enmDocumentResponse.body.content.parameters.serviceregistry_internal_ip_list.should.equal('10.10.0.58');
    });
  });

  describe('GET', function () {
    it('should be able to get documents when user not authenticated', async function () {
      await nonAuthAgent.get('/api/documents').expect(200);
    });

    it('should be able to get empty document list', async function () {
      response = await nonAuthAgent.get('/api/documents').expect(200);
      response.body.should.be.instanceof(Array).and.have.lengthOf(0);
    });

    it('should be able to get document list with one element', async function () {
      document = new Document(validDocument);
      await document.save();
      response = await nonAuthAgent.get('/api/documents').expect(200);
      response.body.should.be.instanceof(Array).and.have.lengthOf(1);
      response.body[0].schema_id.should.be.equal(schema._id.toString());
    });

    it('should be able to get document list with more than one element', async function () {
      document = new Document(validDocument);
      await document.save();
      _documentUpdated = _.cloneDeep(validDocument);
      _documentUpdated.name = '3.2.1';
      document2 = new Document(_documentUpdated);
      await document2.save();
      response = await nonAuthAgent.get('/api/documents').expect(200);
      response.body.should.be.instanceof(Array).and.have.lengthOf(2);
    });

    it('should be able to get a single document', async function () {
      document = new Document(validDocument);
      await document.save();
      response = await nonAuthAgent.get(`/api/documents/${document._id}`).expect(200);
      response.body.name.should.equal(validDocument.name);
      response.body.content.should.deepEqual(validDocument.content);
    });

    it('should be able to get a single document using document name', async function () {
      document = new Document(validDocument);
      await document.save();
      response = await nonAuthAgent.get(`/api/documents/name/${document.name}`).expect(200);
      response.body.name.should.equal(validDocument.name);
      response.body.content.should.deepEqual(validDocument.content);
    });

    it('should be able to get an enm sed document with enm-sed and without managed config fields', async function () {
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;

      documentResponse = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);
      response = await nonAuthAgent.get(`/api/documents/${documentResponse.body._id}`).expect(200);
      var content = Object.keys(response.body.content)[0];
      content.should.equal('parameters');
      enmOnlyFields.forEach(function (enmField) {
        response.body.should.have.property(enmField);
        response.body[enmField].should.not.equal(undefined);
      });
      mcOnlyFields.forEach(function (mcField) {
        response.body.should.not.have.property(mcField);
      });
    });

    it('should be able to get an enm sed document with enm-sed and managed config fields when using a request query', async function () {
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;

      documentResponse = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);
      response = await nonAuthAgent.get(`/api/documents/${documentResponse.body._id}?fields=name,content,${allFields.join(',')}`).expect(200);
      var content = Object.keys(response.body.content)[0];
      content.should.equal('parameters');
      allFields.forEach(function (field) {
        response.body.should.have.property(field);
      });
    });

    it('should be able to get a vnflcm sed document without enm-sed or managed-config fields', async function () {
      vnflcmSchema = new Schema(validVnflcmSchema);
      await vnflcmSchema.save();
      validVnflcmDocument.schema_id = vnflcmSchema._id;
      validVnflcmDocument.autopopulate = true;

      documentResponse = await agent.post('/api/documents').send(validVnflcmDocument).expect(201);
      response = await nonAuthAgent.get(`/api/documents/${documentResponse.body._id}`).expect(200);
      should.exist(response.body.autopopulate);
      response.body.autopopulate.should.equal(true);

      var content = Object.keys(response.body.content)[0];
      content.should.equal('parameters');
      allFields.forEach(function (field) {
        response.body.should.not.have.property(field);
      });
    });

    it('should be able to get a vnflcm sed document with enm-sed and managed-config fields when using a request query', async function () {
      vnflcmSchema = new Schema(validVnflcmSchema);
      await vnflcmSchema.save();
      validVnflcmDocument.schema_id = vnflcmSchema._id;

      documentResponse = await agent.post('/api/documents').send(validVnflcmDocument).expect(201);
      response = await nonAuthAgent.get(`/api/documents/${documentResponse.body._id}?fields=name,content,${allFields.join(',')}`).expect(200);
      var content = Object.keys(response.body.content)[0];
      content.should.equal('parameters');
      allFields.forEach(function (field) {
        response.body.should.have.property(field);
      });
    });

    it('should be able to get a managed config with managed-config and without enm-sed fields', async function () {
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedManagedConfig.schema_id = enmSedSchemaObjectReturned._id;
      documentResponse = await agent.post('/api/documents').send(validEnmSedManagedConfig).expect(201);
      response = await nonAuthAgent.get(`/api/documents/${documentResponse.body._id}`).expect(200);
      var content = Object.keys(response.body.content)[0];
      content.should.equal('parameters');
      mcOnlyFields.forEach(function (mcField) {
        response.body.should.have.property(mcField);
        response.body[mcField].should.not.equal(undefined);
      });
      enmOnlyFields.forEach(function (enmField) {
        response.body.should.not.have.property(enmField);
      });
    });

    it('should be able to get a managed config with managed-config and enm-sed fields when using a request query', async function () {
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedManagedConfig.schema_id = enmSedSchemaObjectReturned._id;
      documentResponse = await agent.post('/api/documents').send(validEnmSedManagedConfig).expect(201);
      response = await nonAuthAgent.get(`/api/documents/${documentResponse.body._id}?fields=name,content,${allFields.join(',')}`).expect(200);
      var content = Object.keys(response.body.content)[0];
      content.should.equal('parameters');
      allFields.forEach(function (field) {
        response.body.should.have.property(field);
      });
    });

    it('should be able to get an other-type document without enm-sed or managed-config fields', async function () {
      document = new Document(validDocument);
      await document.save();
      response = await nonAuthAgent.get(`/api/documents/${document._id}`).expect(200);
      response.body.name.should.equal(validDocument.name);
      response.body.content.should.deepEqual(validDocument.content);
      allFields.forEach(function (field) {
        response.body.should.not.have.property(field);
      });
    });

    it('should be able to get an other-type document with enm-sed and managed-config fields when using a request query', async function () {
      document = new Document(validDocument);
      await document.save();
      response = await nonAuthAgent.get(`/api/documents/${document._id}?fields=name,content,${allFields.join(',')}`).expect(200);
      response.body.name.should.equal(validDocument.name);
      response.body.content.should.deepEqual(validDocument.content);
      allFields.forEach(function (field) {
        response.body.should.have.property(field);
      });
    });

    it('should be able to get a enm sed document with content key "parameters"', async function () {
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      documentResponse = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);
      process.env.NODE_ENV = 'policyCheckEnabled';
      process.env.PARAMETER_DEFAULTS_APPLICATION = 'testuser';
      response = await nonAuthAgent.get(`/api/documents/${documentResponse.body._id}`).auth(validUser2.username, validUser2.password).expect(200);
      var content = Object.keys(response.body.content)[0];
      content.should.equal('parameters');
      process.env.NODE_ENV = nodeEnv;
    });

    it('should be able to get enm sed document with content key "parameter_defaults"', async function () {
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      documentResponse = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);
      process.env.NODE_ENV = 'policyCheckEnabled';
      process.env.PARAMETER_DEFAULTS_APPLICATION = 'testuser,testApp';
      response = await nonAuthAgent.get(`/api/documents/${documentResponse.body._id}`).auth(validUser.username, validUser.password).expect(200);
      var content = Object.keys(response.body.content)[0];
      content.should.equal('parameter_defaults');
      process.env.NODE_ENV = nodeEnv;
    });

    it('should be able to get enm sed document with content key "parameter" with header referer "/documents/view/"', async function () {
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      documentResponse = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);
      process.env.NODE_ENV = 'policyCheckEnabled';
      process.env.PARAMETER_DEFAULTS_APPLICATION = 'testuser';
      response = await nonAuthAgent.get(`/api/documents/${documentResponse.body._id}`)
        .set('referer', '/documents/view/' + documentResponse.body._id)
        .auth(validUser.username, validUser.password).expect(200);
      var content = Object.keys(response.body.content)[0];
      content.should.equal('parameters');
      process.env.NODE_ENV = nodeEnv;
    });

    it('should be able to get enm sed document with content key "parameter" with header referer "/documents/create/"', async function () {
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      documentResponse = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);
      process.env.NODE_ENV = 'policyCheckEnabled';
      process.env.PARAMETER_DEFAULTS_APPLICATION = 'testuser';
      response = await nonAuthAgent.get(`/api/documents/${documentResponse.body._id}`)
        .set('referer', '/documents/create/' + documentResponse.body._id)
        .auth(validUser.username, validUser.password).expect(200);
      var content = Object.keys(response.body.content)[0];
      content.should.equal('parameters');
      process.env.NODE_ENV = nodeEnv;
    });

    it('should be able to get enm sed document with content key "parameter" with header referer "/documents/list/"', async function () {
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      documentResponse = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);
      process.env.NODE_ENV = 'policyCheckEnabled';
      process.env.PARAMETER_DEFAULTS_APPLICATION = 'testuser';
      response = await nonAuthAgent.get(`/api/documents/${documentResponse.body._id}`)
        .set('referer', '/documents/list/' + documentResponse.body._id)
        .auth(validUser.username, validUser.password).expect(200);
      var content = Object.keys(response.body.content)[0];
      content.should.equal('parameters');
      process.env.NODE_ENV = nodeEnv;
    });

    it('should be able to get enm sed document with content key "parameter" with header referer "/documents/edit/"', async function () {
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      documentResponse = await agent.post('/api/documents').send(validEnmSedDocument).expect(201);
      process.env.NODE_ENV = 'policyCheckEnabled';
      process.env.PARAMETER_DEFAULTS_APPLICATION = 'testuser';
      response = await nonAuthAgent.get(`/api/documents/${documentResponse.body._id}`)
        .set('referer', '/documents/edit/' + documentResponse.body._id)
        .auth(validUser.username, validUser.password).expect(200);
      var content = Object.keys(response.body.content)[0];
      content.should.equal('parameters');
      process.env.NODE_ENV = nodeEnv;
    });

    it('should be able to get a managed config with content key "parameters"', async function () {
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedManagedConfig.schema_id = enmSedSchemaObjectReturned._id;
      documentResponse = await agent.post('/api/documents').send(validEnmSedManagedConfig).expect(201);
      process.env.NODE_ENV = 'policyCheckEnabled';
      process.env.PARAMETER_DEFAULTS_APPLICATION = 'testuser';
      response = await nonAuthAgent.get(`/api/documents/${documentResponse.body._id}`).auth(validUser2.username, validUser2.password).expect(200);
      var content = Object.keys(response.body.content)[0];
      content.should.equal('parameters');
      process.env.NODE_ENV = nodeEnv;
    });

    it('should be able to get managed config with content key "parameter_defaults"', async function () {
      enmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedManagedConfig.schema_id = enmSedSchemaObjectReturned._id;
      documentResponse = await agent.post('/api/documents').send(validEnmSedManagedConfig).expect(201);
      process.env.NODE_ENV = 'policyCheckEnabled';
      process.env.PARAMETER_DEFAULTS_APPLICATION = 'testuser';
      response = await nonAuthAgent.get(`/api/documents/${documentResponse.body._id}`).auth(validUser.username, validUser.password).expect(200);
      var content = Object.keys(response.body.content)[0];
      content.should.equal('parameter_defaults');
      process.env.NODE_ENV = nodeEnv;
    });

    it('should throw 404 when id is not in database', async function () {
      response = await nonAuthAgent.get('/api/documents/000000000000000000000000').expect(404);
      response.body.message.should.equal('A document with that id does not exist');
    });

    it('should throw 404 when id is invalid in the database', async function () {
      response = await nonAuthAgent.get('/api/documents/0').expect(404);
      response.body.message.should.equal('A document with that id does not exist');
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

    it('should not delete a document when user is not authenticated', async function () {
      response = await nonAuthAgent.delete(`/api/documents/${document._id}`).send(document).expect(401);
      response.body.message.should.equal('User must be logged in');
    });

    it('should delete a document and check its response', async function () {
      response = await agent.delete(`/api/documents/${document._id}`).send(document).expect(200);
      response.body._id.should.have.length(24);
      response.body.name.should.equal(validDocument.name);
      response.body.content.should.deepEqual(validDocument.content);
      response = await Document.findById(response.body._id).exec();
      should.not.exist(response);
    });

    it('should delete a document using document name and check its response', async function () {
      response = await agent.delete(`/api/documents/name/${document.name}`).send(document).expect(200);
      response.body._id.should.have.length(24);
      response.body.name.should.equal(validDocument.name);
      response.body.content.should.deepEqual(validDocument.content);
      response = await Document.findById(response.body._id).exec();
      should.not.exist(response);
    });

    it('should fail when attempting to delete document that does not exist', async function () {
      response = await agent.delete('/api/documents/000000000000000000000000').expect(404);
      response.body.message.should.equal('A document with that id does not exist');
    });

    it('should fail when attempting to delete document with an invalid _id', async function () {
      response = await agent.delete('/api/documents/ThisIsAInvalidId').expect(404);
      response.body.message.should.equal('A document with that id does not exist');
    });

    it('should fail to delete an enm_sed document if it has a dependent Deployment', async function () {
      validSchema.name = 'enm_sed';
      schema = new Schema(validSchema);
      await schema.save();
      validDocument.schema_id = schema._id;
      validDocument.name = 'anothervalidDocument';
      document2 = new Document(validDocument);
      await document2.save();
      podObject = new Pod(validPod);
      podObjectReturned = await podObject.save();
      validProject.pod_id = podObjectReturned._id;
      projectObject = new Project(validProject);
      projectObjectReturned = await projectObject.save();
      validDeployment.project_id = projectObjectReturned._id;
      validDeployment.enm.sed_id = document2._id;
      deploymentObject = new Deployment(validDeployment);
      await deploymentObject.save();
      response = await agent.delete(`/api/documents/${document2._id}`).expect(422);
      response.body.message.should.equal('Can\'t delete document, it has 1 dependent deployment');
    });

    it('should fail to delete a non enm_sed document if it has a dependent Deployment', async function () {
      validSchema.name = 'enm_sed';
      schema = new Schema(validSchema);
      await schema.save();
      validDocument.schema_id = schema._id;
      validDocument.name = 'anothervalidDocument';
      document2 = new Document(validDocument);
      await document2.save();
      podObject = new Pod(validPod);
      podObjectReturned = await podObject.save();
      validProject.pod_id = podObjectReturned._id;
      projectObject = new Project(validProject);
      projectObjectReturned = await projectObject.save();
      validDeployment.project_id = projectObjectReturned._id;
      validDeployment.enm.sed_id = document2._id;
      validDeployment.documents = [
        {
          schema_name: schema.name,
          document_id: document._id
        }
      ];
      deploymentObject = new Deployment(validDeployment);
      await deploymentObject.save();
      response = await agent.delete(`/api/documents/${document._id}`).expect(422);
      response.body.message.should.equal('Can\'t delete document, it has 1 dependent deployment');
    });

    it('should fail when attempting to delete a managedconfig which has one dependent document', async function () {
      var managedconfig = _.cloneDeep(validDocument);
      managedconfig.managedconfig = true;
      managedconfig.name = 'validMConfig';
      managedconfig.managedconfigs = [];
      managedconfig.autopopulate = false;
      response = await agent.post('/api/documents/').send(managedconfig).expect(201);
      var dependentDoc = _.cloneDeep(validDocument);
      dependentDoc.name = 'dependentDoc';
      dependentDoc.managedconfigs = [response.body._id];
      await agent.post('/api/documents/').send(dependentDoc).expect(201);
      response = await agent.delete(`/api/documents/${response.body._id}`).expect(422);
      response.body.message.should.equal('Can\'t delete document, it has 1 dependent document');
    });

    it('should fail when attempting to delete a managedconfig which has two dependent documents', async function () {
      var managedconfig = _.cloneDeep(validDocument);
      managedconfig.managedconfig = true;
      managedconfig.name = 'validMConfig';
      managedconfig.managedconfigs = [];
      managedconfig.autopopulate = false;
      response = await agent.post('/api/documents/').send(managedconfig).expect(201);
      var dependentDoc = _.cloneDeep(validDocument);
      dependentDoc.name = 'dependentDoc';
      dependentDoc.managedconfigs = [response.body._id];
      await agent.post('/api/documents/').send(dependentDoc).expect(201);
      dependentDoc.name = 'dependentDoc2';
      dependentDoc.managedconfigs = [response.body._id];
      await agent.post('/api/documents/').send(dependentDoc).expect(201);
      response = await agent.delete(`/api/documents/${response.body._id}`).expect(422);
      response.body.message.should.equal('Can\'t delete document, it has 2 dependent documents');
    });

    it('should update an existing log with user-details for a document thats deleted by a logged-in user', async function () {
      response = await agent.delete(`/api/documents/${document._id}`)
        .auth(validUser.username, validUser.password)
        .expect(200);
      response.body._id.should.have.length(24);
      response.body._id.should.equal(document._id.toString());

      logReturned = await History.findOne({ associated_id: response.body._id }).exec();
      logReturned.originalData.should.not.equal(undefined);
      logReturned.originalData.name.should.equal(document.name);

      logReturned.updates.should.be.instanceof(Array).and.have.lengthOf(0);
      logReturned.deletedAt.should.not.equal(undefined);
      logReturned.deletedBy.should.not.equal(undefined);
      logReturned.deletedBy.username.should.equal(validUser.username);
      logReturned.deletedBy.email.should.equal(validUser.email);
    });

    it('should create a log with defined user-details for a document that gets deleted by a logged-in user', async function () {
      // clear logs and verify
      await History.remove().exec();
      logReturned = await History.findOne({ associated_id: response.body._id }).exec();
      should.not.exist(logReturned);

      response = await agent.delete(`/api/documents/${document._id}`)
        .auth(validUser.username, validUser.password)
        .expect(200);
      response.body._id.should.have.length(24);
      response.body._id.should.equal(document._id.toString());

      logReturned = await History.findOne({ associated_id: response.body._id }).exec();
      logReturned.originalData.should.not.equal(undefined);
      logReturned.originalData.name.should.equal(document.name);

      logReturned.updates.should.be.instanceof(Array).and.have.lengthOf(0);
      logReturned.deletedAt.should.not.equal(undefined);
      logReturned.deletedBy.should.not.equal(undefined);
      logReturned.deletedBy.username.should.equal(validUser.username);
      logReturned.deletedBy.email.should.equal(validUser.email);
    });
  });

  describe('SEARCH', function () {
    beforeEach(async function () {
      validDocument.schema_id = schema._id;
      documentObject = new Document(validDocument);
      await documentObject.save();
    });

    it('should not return a document when passing in a valid parameter with a non existent document ID', async function () {
      response = await nonAuthAgent.get('/api/documents?q=_id=5bcdbe7287e21906ed4f12ba').expect(200);
      response.body.length.should.equal(0);
    });

    it('should not return a document when passing in a valid parameter with a non existent parameter', async function () {
      response = await agent.get(`/api/documents?q=${encodeURIComponent(`_id=${documentObject._id}&name=notExisting`)}`).expect(200);
      response.body.length.should.equal(0);
    });

    it('should return an error when not encoding q search parameters', async function () {
      response = await agent.get(`/api/documents?q=_id=${documentObject._id}&name=notExisting`).expect(422);
      response.body.message.should.equal('Improperly structured query. Make sure to use ?q=<key>=<value> syntax');
    });

    it('should return a single document when passing in _id parameter', async function () {
      response = await agent.get(`/api/documents?q=_id=${documentObject._id}`).expect(200);
      response.body[0].should.be.instanceof(Object);
      response.body[0].name.should.equal(documentObject.name);
      response.body[0].schema_id.should.equal(documentObject.schema_id.toString());
    });

    it('should not return a document when passing in invalid parameter', async function () {
      response = await nonAuthAgent.get('/api/documents?q=n0nsense=123454321').expect(200);
      response.body.length.should.equal(0);
    });

    it('should return a single document when passing in name parameter', async function () {
      response = await agent.get(`/api/documents?q=name=${documentObject.name}`).expect(200);
      response.body[0].should.be.instanceof(Object);
      response.body[0].name.should.equal(documentObject.name);
      response.body[0].schema_id.should.equal(documentObject.schema_id.toString());
    });

    it('should only return fields specified in url', async function () {
      response = await nonAuthAgent.get('/api/documents?fields=name').expect(200);
      response.body.length.should.equal(1);
      for (var key in response.body) {
        if (Object.prototype.hasOwnProperty.call(response.body, key)) {
          Object.prototype.hasOwnProperty.call(response.body[key], 'name').should.equal(true);
        }
      }
    });

    it('should only return fields specified in url using fields and q functionality', async function () {
      response = await agent.get(`/api/documents?fields=name&q=name=${documentObject.name}`).expect(200);
      response.body.length.should.equal(1);
      Object.prototype.hasOwnProperty.call(response.body[0], 'name').should.equal(true);
      response.body[0].name.should.equal(documentObject.name);
    });

    it('should only return nested fields specified in url', async function () {
      response = await nonAuthAgent.get('/api/documents?fields=content()').expect(200);
      response.body.length.should.equal(1);
      Object.prototype.hasOwnProperty.call(response.body[0], 'content').should.equal(true);
    });

    it('should return an error message when query has invalid search key blah', async function () {
      response = await agent.get(`/api/documents?q=name=${documentObject.name}&fields=name&blah=blah`).expect(422);
      response.body.message.should.equal('Improperly structured query. Make sure to use ?q=<key>=<value> syntax');
    });

    it('should return an error message when queried with an improper search', async function () {
      response = await agent.get(`/api/documents?name=${documentObject.name}`).expect(422);
      response.body.message.should.equal('Improperly structured query. Make sure to use ?q=<key>=<value> syntax');
    });

    it('should return an error message when queried with an empty q=', async function () {
      response = await nonAuthAgent.get('/api/documents?q=').expect(422);
      response.body.message.should.equal('Improperly structured query. Make sure to use ?q=<key>=<value> syntax');
    });

    it('should return an error message when queried with an empty fields=', async function () {
      response = await nonAuthAgent.get('/api/documents?fields=').expect(422);
      response.body.message.should.equal('Improperly structured query. Make sure to use ?q=<key>=<value> syntax');
    });

    it('should return an error message when queried with an empty fields= and q=', async function () {
      response = await nonAuthAgent.get('/api/documents?q=&fields=').expect(422);
      response.body.message.should.equal('Improperly structured query. Make sure to use ?q=<key>=<value> syntax');
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
