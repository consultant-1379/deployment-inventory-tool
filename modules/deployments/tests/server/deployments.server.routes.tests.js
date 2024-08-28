'use strict';

var fs = require('fs'),
  should = require('should'),
  superagentDefaults = require('superagent-defaults'),
  supertest = require('supertest'),
  mongoose = require('mongoose'),
  _ = require('lodash'),
  Schema = require('../../../schemas/server/models/schemas.server.model').Schema,
  Document = require('../../../documents/server/models/documents.server.model').Schema,
  Deployment = require('../../../deployments/server/models/deployments.server.model').Schema,
  History = require('../../../history/server/models/history.server.model').getSchema('deployments'),
  PodsHistory = require('../../../history/server/models/history.server.model').getSchema('pods'),
  Pod = mongoose.model('Pod'),
  Project = mongoose.model('Project'),
  Group = mongoose.model('Group'),
  User = mongoose.model('User'),
  express = require('../../../../config/lib/express');

var app,
  agent,
  nonAuthAgent,
  validEnmSedSchema,
  validVnfLcmSedSchema,
  validSimpleSchema,
  validSimpleDocument,
  inValidSchema,
  schemaObject,
  schemaVnfLcmObject,
  badschemaObject,
  validDocument,
  validVnLcmDocument,
  secondValidDocument,
  documentObject,
  vnfLcmDocumentObject,
  secondDocumentObject,
  documentReturned,
  secondDocumentReturned,
  validPod,
  podObject,
  validProject,
  secondValidProject,
  projectObject,
  secondProjectObject,
  projectReturned,
  projectReturned2,
  validDeployment,
  validDeployment2,
  _deploymentUpdated,
  deploymentResponse,
  secondValidDeployment,
  deploymentReturned,
  secondDeploymentReturned,
  badDeployment,
  deploymentObject,
  secondDeploymentObject,
  response,
  logReturned,
  validUser,
  validUser2,
  validUser3,
  userObject,
  userObject2,
  userObject3,
  validGroup,
  groupObject,
  groupReturned,
  validcENMSchema,
  validcENMSchema2,
  validcENMDocument1,
  validcENMDocument2,
  validcENMSchemaObject,
  validcENMSchemaObject2,
  validcENMDocument1Object,
  validcENMDocument2Object,
  validcENMDeployment,
  validProject2,
  projectObject2;

var jiraHost = process.env.JIRA_HOST;
var nodeEnv = process.env.NODE_ENV;

describe('Deployment', function () {
  before(async function () {
    app = express.init(mongoose);
    nonAuthAgent = superagentDefaults(supertest(app));
    agent = superagentDefaults(supertest(app));
  });
  beforeEach(async function () {
    validEnmSedSchema = JSON.parse(fs.readFileSync('/opt/mean.js/modules/deployments/tests/server/test_files/valid_enm_sed_schema.json', 'utf8'));
    validcENMSchema = JSON.parse(fs.readFileSync('/opt/mean.js/modules/deployments/tests/server/test_files/valid_cenm_sed_schema.json', 'utf8'));
    validcENMSchema2 = JSON.parse(fs.readFileSync('/opt/mean.js/modules/deployments/tests/server/test_files/valid_cenm_sed_schema2.json', 'utf8'));
    validVnfLcmSedSchema = JSON.parse(fs.readFileSync('/opt/mean.js/modules/deployments/tests/server/test_files/valid_vnfLcm_schema.json', 'utf8'));
    validSimpleSchema = JSON.parse(fs.readFileSync('/opt/mean.js/modules/deployments/tests/server/test_files/valid_simple_schema.json', 'utf8'));
    validSimpleDocument = JSON.parse(fs.readFileSync('/opt/mean.js/modules/deployments/tests/server/test_files/valid_simple_document.json', 'utf8'));
    inValidSchema = JSON.parse(fs.readFileSync('/opt/mean.js/modules/deployments/tests/server/test_files/invalid_schema.json', 'utf8'));
    validDocument = JSON.parse(fs.readFileSync('/opt/mean.js/modules/deployments/tests/server/test_files/valid_document.json', 'utf8'));
    validcENMDocument1 = JSON.parse(fs.readFileSync('/opt/mean.js/modules/deployments/tests/server/test_files/valid_cenm_document1.json', 'utf8'));
    validcENMDocument2 = JSON.parse(fs.readFileSync('/opt/mean.js/modules/deployments/tests/server/test_files/valid_cenm_document2.json', 'utf8'));
    validVnLcmDocument = JSON.parse(fs.readFileSync('/opt/mean.js/modules/deployments/tests/server/test_files/valid_vnfLcm_document.json', 'utf8'));
    validPod = JSON.parse(fs.readFileSync('/opt/mean.js/modules/deployments/tests/server/test_files/valid_pod.json', 'utf8'));
    validProject = JSON.parse(fs.readFileSync('/opt/mean.js/modules/deployments/tests/server/test_files/valid_project.json', 'utf8'));
    validProject2 = JSON.parse(fs.readFileSync('/opt/mean.js/modules/deployments/tests/server/test_files/valid_project2.json', 'utf8'));
    validDeployment = JSON.parse(fs.readFileSync('/opt/mean.js/modules/deployments/tests/server/test_files/valid_deployment.json', 'utf8'));
    validcENMDeployment = JSON.parse(fs.readFileSync('/opt/mean.js/modules/deployments/tests/server/test_files/valid_deployment.json', 'utf8'));
    validUser = JSON.parse(fs.readFileSync('/opt/mean.js/modules/deployments/tests/server/test_files/valid_user.json', 'utf8'));
    validUser2 = JSON.parse(fs.readFileSync('/opt/mean.js/modules/deployments/tests/server/test_files/valid_user2.json', 'utf8'));
    validUser3 = JSON.parse(fs.readFileSync('/opt/mean.js/modules/deployments/tests/server/test_files/valid_user3.json', 'utf8'));

    validcENMSchemaObject = new Schema(validcENMSchema);
    await validcENMSchemaObject.save();

    validcENMSchemaObject2 = new Schema(validcENMSchema2);
    await validcENMSchemaObject2.save();

    validcENMDocument1.schema_id = validcENMSchemaObject._id;
    validcENMDocument1Object = new Document(validcENMDocument1);
    await validcENMDocument1Object.save();

    validcENMDocument2.schema_id = validcENMSchemaObject2._id;
    validcENMDocument2Object = new Document(validcENMDocument2);
    await validcENMDocument2Object.save();

    podObject = new Pod(validPod);
    await podObject.save();

    validProject.pod_id = podObject._id;
    projectObject = new Project(validProject);
    projectReturned = await projectObject.save();

    validProject2.pod_id = podObject._id;
    projectObject2 = new Project(validProject2);
    projectReturned2 = await projectObject2.save();

    schemaObject = new Schema(validEnmSedSchema);
    await schemaObject.save();

    validDocument.schema_id = schemaObject._id;
    documentObject = new Document(validDocument);
    await documentObject.save();

    schemaVnfLcmObject = new Schema(validVnfLcmSedSchema);
    await schemaVnfLcmObject.save();

    validVnLcmDocument.schema_id = schemaVnfLcmObject._id;
    vnfLcmDocumentObject = new Document(validVnLcmDocument);
    await vnfLcmDocumentObject.save();

    validDeployment.project_id = projectObject._id;
    validDeployment.enm.sed_id = documentObject._id;

    validcENMDeployment.name = 'validcENMDeployment';
    validcENMDeployment.project_id = projectObject2._id;
    validcENMDeployment.enm.sed_id = validcENMDocument1Object._id;

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
    it('should not create a new Deployment when user is not authenticated', async function () {
      response = await nonAuthAgent.post('/api/deployments').send(validDeployment2).expect(401);
      response.body.message.should.equal('User must be logged in');
    });

    it('should create a new Deployment with JIRA Issue and check db', async function () {
      validDeployment2 = _.cloneDeep(validDeployment);
      validDeployment2.jira_issues = ['CIP-30065'];
      response = await agent.post('/api/deployments').send(validDeployment2).expect(201);
      response.body._id.should.have.length(24);
      response.headers.location.should.equal(`/api/deployments/${response.body._id}`);
      response.body.name.should.equal(validDeployment2.name);
      response.body.jira_issues.should.containEql('CIP-30065');
      deploymentReturned = await Deployment.findById(response.body._id).exec();
      deploymentReturned.name.should.equal(validDeployment2.name);
      deploymentReturned.jira_issues.should.containEql('CIP-30065');
    });

    it('should create a new Deployment with cenm Deployment Values Document and check db', async function () {
      validDeployment2 = _.cloneDeep(validcENMDeployment);
      validDeployment2.documents = [
        {
          document_id: validcENMDocument2Object._id,
          schema_name: validcENMSchema2.name,
          schema_category: 'cenm'
        }
      ];
      response = await agent.post('/api/deployments').send(validDeployment2).expect(201);
      response.body._id.should.have.length(24);
      response.headers.location.should.equal(`/api/deployments/${response.body._id}`);
      response.body.name.should.equal(validDeployment2.name);
      deploymentReturned = await Deployment.findById(response.body._id).exec();
      deploymentReturned.name.should.equal(validDeployment2.name);
      deploymentReturned.documents[0].document_id.should.containEql(validcENMDocument2Object._id);
    });

    it('should create a new Deployment with JIRA Issue even if can\'t connect to JIRA and check DB', async function () {
      process.env.JIRA_HOST = 'jira-oss';
      validDeployment2 = _.cloneDeep(validDeployment);
      validDeployment2.jira_issues = ['CIP-30065'];
      response = await agent.post('/api/deployments').send(validDeployment2).expect(201);
      response.body._id.should.have.length(24);
      response.headers.location.should.equal(`/api/deployments/${response.body._id}`);
      response.body.name.should.equal(validDeployment2.name);
      response.body.jira_issues.should.containEql('CIP-30065');
      deploymentReturned = await Deployment.findById(response.body._id).exec();
      deploymentReturned.name.should.equal(validDeployment2.name);
      deploymentReturned.jira_issues.should.containEql('CIP-30065');
      process.env.JIRA_HOST = jiraHost;
    });

    it('should throw error when same JIRA Issue entered multiple times', async function () {
      validDeployment2 = _.cloneDeep(validDeployment);
      validDeployment2.jira_issues = ['CIP-29798', 'CIP-29798'];
      response = await agent.post('/api/deployments').send(validDeployment2).expect(422);
      response.body.message.should.containEql('You cannot add the same JIRA Issue multiple times. Please remove the duplicates: CIP-29798 and try again.');
    });

    it('should throw error when same JIRA Issue entered multiple times, display two issues the error message', async function () {
      validDeployment2 = _.cloneDeep(validDeployment);
      validDeployment2.jira_issues = ['CIP-29798', 'CIP-29798', 'CIP-30065', 'CIP-30065'];
      response = await agent.post('/api/deployments').send(validDeployment2).expect(422);
      response.body.message.should.containEql('You cannot add the same JIRA Issue multiple times. Please remove the duplicates: CIP-29798, CIP-30065 and try again.');
    });

    it('should throw error when same JIRA Issue entered multiple times: lowercase JIRA Issue value', async function () {
      validDeployment2 = _.cloneDeep(validDeployment);
      validDeployment2.jira_issues = ['CIP-29798', 'cip-29798', 'CIP-29798'];
      response = await agent.post('/api/deployments').send(validDeployment2).expect(422);
      response.body.message.should.containEql('You cannot add the same JIRA Issue multiple times. Please remove the duplicates: CIP-29798 and try again.');
    });

    it('should throw error when JIRA Issue is invalid', async function () {
      validDeployment2 = _.clone(validDeployment);
      validDeployment2.jira_issues = ['CIP-30065', 'CIP-999999'];
      response = await agent.post('/api/deployments').send(validDeployment2).expect(422);
      response.body.message.should.containEql('is invalid');
    });

    it('should post in a deployment and check to see if the database is modified', async function () {
      response = await agent.post('/api/deployments').send(validDeployment).expect(201);
      response.body.project_id.should.equal(validDeployment.project_id.toString());
      response.body.enm.sed_id.should.equal(validDeployment.enm.sed_id.toString());
      response.body.name.should.equal(validDeployment.name);
      deploymentReturned = await Deployment.findById(response.body._id).exec();
      deploymentReturned.project_id.toString().should.equal(validDeployment.project_id.toString());
      deploymentReturned.enm.sed_id.toString().should.equal(validDeployment.enm.sed_id.toString());
      deploymentReturned.name.should.equal(validDeployment.name);
    });

    it('should not allow to post a deployment with missing mandatory fields', async function () {
      delete validDeployment.name;
      response = await agent.post('/api/deployments').send(validDeployment).expect(400);
      response.body.message.should.equal('Path `name` is required.');
    });

    it('should not post in a deployment with an invalid project_id', async function () {
      validDeployment.project_id = 'fjdsfjjcaXD';
      response = await agent.post('/api/deployments').send(validDeployment).expect(400);
      response.body.message.should.equal(`Cast to ObjectID failed for value "${validDeployment.project_id}" at path "project_id"`);
    });

    it('should not post in a deployment with an invalid sed_id', async function () {
      validDeployment.enm.sed_id = '12345678765432';
      response = await agent.post('/api/deployments').send(validDeployment).expect(400);
      response.body.message.should.equal(`Cast to ObjectID failed for value "${validDeployment.enm.sed_id}" at path "enm.sed_id"`);
    });

    it('should not post in a deployment with an valid project_id that doesnt exist', async function () {
      validDeployment.project_id = '000000000000000000000000';
      response = await agent.post('/api/deployments').send(validDeployment).expect(422);
      response.body.message.should.equal(`A project with id '${validDeployment.project_id}' does not exist`);
    });

    it('should not post in a deployment with an valid sed_id that doesnt exist', async function () {
      validDeployment.enm.sed_id = '000000000000000000000000';
      response = await agent.post('/api/deployments').send(validDeployment).expect(422);
      response.body.message.should.equal(`A document with that id '${validDeployment.enm.sed_id}' does not exist`);
    });

    it('should not allow a deployment with a non-alphanumeric-underscored name', async function () {
      badDeployment = _.cloneDeep(validDeployment);
      badDeployment.name = '!£$%&';
      response = await agent.post('/api/deployments').send(badDeployment).expect(400);
      response.body.message.should.equal('name is not valid; \'!£$%&\' can only contain letters, numbers, dots, dashes and underscores.');
    });

    it('should not allow deployment without a name', async function () {
      badDeployment = _.cloneDeep(validDeployment);
      delete badDeployment.name;
      response = await agent.post('/api/deployments').send(badDeployment).expect(400);
      response.body.message.should.equal('Path `name` is required.');
    });

    it('should not allow a deployment with no enm', async function () {
      badDeployment = _.cloneDeep(validDeployment);
      delete badDeployment.enm;
      response = await agent.post('/api/deployments').send(badDeployment).expect(400);
      response.body.message.should.equal('Path `enm.sed_id` is required.');
    });

    it('should not allow a deployment with no project_id', async function () {
      badDeployment = _.cloneDeep(validDeployment);
      delete badDeployment.project_id;
      response = await agent.post('/api/deployments').send(badDeployment).expect(400);
      response.body.message.should.equal('Path `project_id` is required.');
    });

    it('should not allow more than one deployment with the same name', async function () {
      deploymentObject = new Deployment(validDeployment);
      deploymentReturned = await deploymentObject.save();

      secondValidDocument = _.cloneDeep(validDocument);
      secondValidDocument.name = 'Doc200';
      secondDocumentObject = new Document(secondValidDocument);
      secondDocumentReturned = await secondDocumentObject.save();

      secondValidProject = _.cloneDeep(validProject);
      secondValidProject.name = 'AValidProject';
      secondProjectObject = new Project(secondValidProject);
      await secondProjectObject.save();

      secondValidDeployment = _.cloneDeep(validDeployment);
      secondValidDeployment.enm.sed_id = secondDocumentObject._id;
      secondValidDeployment.project_id = secondProjectObject._id;
      response = await agent.post('/api/deployments').send(secondValidDeployment).expect(400);
      response.body.message.should.equal('Error, provided name is not unique.');
    });

    it('should not allow more than one deployment with the same project', async function () {
      deploymentObject = new Deployment(validDeployment);
      deploymentReturned = await deploymentObject.save();

      secondValidDocument = _.cloneDeep(validDocument);
      secondValidDocument.name = 'Doc200';
      secondDocumentObject = new Document(secondValidDocument);
      secondDocumentReturned = await secondDocumentObject.save();

      secondValidProject = _.cloneDeep(validProject);
      secondValidProject.name = 'AValidProject';
      secondProjectObject = new Project(secondValidProject);
      await secondProjectObject.save();

      secondValidDeployment = _.cloneDeep(validDeployment);
      secondValidDeployment.name = 'DiffDeployment';
      secondValidDeployment.enm.sed_id = secondDocumentObject._id;
      response = await agent.post('/api/deployments').send(secondValidDeployment).expect(400);
      response.body.message.should.equal('Error, provided project_id is not unique.');
    });

    it('should not allow more than one deployment with the same sed', async function () {
      deploymentObject = new Deployment(validDeployment);
      deploymentReturned = await deploymentObject.save();

      secondValidDocument = _.cloneDeep(validDocument);
      secondValidDocument.name = 'Doc200';
      secondDocumentObject = new Document(secondValidDocument);
      secondDocumentReturned = await secondDocumentObject.save();

      secondValidProject = _.cloneDeep(validProject);
      secondValidProject.name = 'AValidProject';
      secondProjectObject = new Project(secondValidProject);
      await secondProjectObject.save();

      secondValidDeployment = _.cloneDeep(validDeployment);
      secondValidDeployment.name = 'DiffDeployment';
      secondValidDeployment.project_id = secondProjectObject._id;
      response = await agent.post('/api/deployments').send(secondValidDeployment).expect(400);
      response.body.message.should.equal('Error, provided enm.sed_id is not unique.');
    });

    it('should not create a deployment with extra fields not outlined in the mongoose model', async function () {
      badDeployment = _.cloneDeep(validDeployment);
      badDeployment.newkey = 12123;
      response = await agent.post('/api/deployments').send(badDeployment).expect(400);
      response.body.message.should.equal('Field `newkey` is not in schema and strict mode is set to throw.');
    });

    it('should respond with bad request with invalid json', async function () {
      badDeployment = '{';
      response = await agent.post('/api/deployments').send(badDeployment).type('json').expect(400);
      response.body.message.should.equal('There was a syntax error found in your request, please make sure that it is valid and try again');
    });

    it('should not allow to create a deployment where its sed is pointing to a schema that does not have category enm', async function () {
      badschemaObject = new Schema(inValidSchema);
      await badschemaObject.save();

      secondValidDocument = _.cloneDeep(validDocument);
      secondValidDocument.name = 'Test_Doc_2';
      secondValidDocument.schema_id = badschemaObject._id;
      secondDocumentObject = new Document(secondValidDocument);
      secondDocumentReturned = await secondDocumentObject.save();

      validDeployment.enm.sed_id = secondDocumentObject._id;
      response = await agent.post('/api/deployments').send(validDeployment).expect(422);
      response.body.message.should.equal('Schema\'s category of document \'Test_Doc_2\' is \'other\' but should have a schema with a category of \'enm\' or \'cenm\'.');
    });

    it('should not allow to create a deployment where its sed is a managed config', async function () {
      secondValidDocument = _.cloneDeep(validDocument);
      secondValidDocument.name = 'Test_Doc_2';
      secondValidDocument.managedconfig = true;
      secondDocumentObject = new Document(secondValidDocument);
      secondDocumentReturned = await secondDocumentObject.save();

      validDeployment.name = 'NewDeployment';
      validDeployment.enm.sed_id = secondDocumentObject._id;
      response = await agent.post('/api/deployments').send(validDeployment).expect(422);
      response.body.message.should.equal('A managed config cannot be directly associated with a deployment.');
    });

    it('should allow to create a deployment with a document attached', async function () {
      schemaObject = new Schema(validSimpleSchema);
      await schemaObject.save();

      validSimpleDocument.schema_id = schemaObject._id;
      documentObject = new Document(validSimpleDocument);
      documentReturned = await documentObject.save();

      validDeployment.documents = [
        {
          document_id: documentReturned._id,
          schema_name: validSimpleSchema.name,
          schema_category: 'other'
        }
      ];
      response = await agent.post('/api/deployments').send(validDeployment).expect(201);
    });

    it('should not allow to create a deployment with a missing document schema_name key', async function () {
      schemaObject = new Schema(validSimpleSchema);
      await schemaObject.save();

      validSimpleDocument.schema_id = schemaObject._id;
      documentObject = new Document(validSimpleDocument);
      documentReturned = await documentObject.save();

      validDeployment.documents = [
        {
          document_id: documentReturned._id
        }
      ];
      response = await agent.post('/api/deployments').send(validDeployment).expect(400);
      response.body.message.should.equal('Path `schema_name` is required.');
    });

    it('should not allow to create a deployment with a missing document document_id key', async function () {
      schemaObject = new Schema(validSimpleSchema);
      await schemaObject.save();

      validSimpleDocument.schema_id = schemaObject._id;
      documentObject = new Document(validSimpleDocument);
      documentReturned = await documentObject.save();

      validDeployment.documents = [
        {
          schema_name: validSimpleSchema.name
        }
      ];
      response = await agent.post('/api/deployments').send(validDeployment).expect(400);
      response.body.message.should.equal('Path `document_id` is required.');
    });

    it('should not allow to create a deployment with a document containing extra keys', async function () {
      schemaObject = new Schema(validSimpleSchema);
      await schemaObject.save();

      validSimpleDocument.schema_id = schemaObject._id;
      documentObject = new Document(validSimpleDocument);
      documentReturned = await documentObject.save();

      validDeployment.documents = [
        {
          document_id: documentReturned._id,
          schema_name: validSimpleSchema.name,
          another_key: 'somevalue'
        }
      ];
      response = await agent.post('/api/deployments').send(validDeployment).expect(400);
      response.body.message.should.containEql('Cast to Array failed for value');
    });

    it('should not allow to create a deployment with a document containing schema_name of enm_sed', async function () {
      validSimpleSchema.name = 'enm_sed';
      schemaObject = new Schema(validSimpleSchema);
      await schemaObject.save();

      validSimpleDocument.schema_id = schemaObject._id;
      documentObject = new Document(validSimpleDocument);
      documentReturned = await documentObject.save();

      validDeployment.documents = [
        {
          document_id: documentReturned._id,
          schema_name: validSimpleSchema.name
        }
      ];
      response = await agent.post('/api/deployments').send(validDeployment).expect(422);
      response.body.message.should.equal('You cannot associate an enm_sed document within the deployments documents list.');
    });

    it('should not allow to create a deployment with two documents of the same schema_name', async function () {
      schemaObject = new Schema(validSimpleSchema);
      await schemaObject.save();

      validSimpleDocument.schema_id = schemaObject._id;
      documentObject = new Document(validSimpleDocument);
      documentReturned = await documentObject.save();

      validDeployment.documents = [
        {
          document_id: documentReturned._id,
          schema_name: validSimpleSchema.name
        },
        {
          document_id: documentReturned._id,
          schema_name: validSimpleSchema.name
        }
      ];
      response = await agent.post('/api/deployments').send(validDeployment).expect(422);
      response.body.message.should.equal('You cannot associate multiple documents with the same schema_name.');
    });

    it('should not allow to create a deployment with a document with an invalid id', async function () {
      schemaObject = new Schema(validSimpleSchema);
      await schemaObject.save();

      validSimpleDocument.schema_id = schemaObject._id;
      documentObject = new Document(validSimpleDocument);
      documentReturned = await documentObject.save();

      validDeployment.documents = [
        {
          document_id: 'invalid',
          schema_name: validSimpleSchema.name
        }
      ];
      response = await agent.post('/api/deployments').send(validDeployment).expect(400);
      response.body.message.should.equal('Cast to ObjectID failed for value "invalid" at path "document_id"');
    });

    it('should not allow to create a deployment with a document that does not exist', async function () {
      validDeployment.documents = [
        {
          document_id: '000000000000000000000000',
          schema_name: 'invalid'
        }
      ];
      response = await agent.post('/api/deployments').send(validDeployment).expect(422);
      response.body.message.should.equal('The given document id 000000000000000000000000 could not be found');
    });

    it('should not allow to create a deployment with a documents with non matching schema_name and document_id', async function () {
      schemaObject = new Schema(validSimpleSchema);
      await schemaObject.save();
      validSimpleDocument.schema_id = schemaObject._id;
      documentObject = new Document(validSimpleDocument);
      documentReturned = await documentObject.save();

      validDeployment.documents = [
        {
          document_id: documentReturned._id,
          schema_name: 'invalid',
          schema_category: 'other'
        }
      ];
      response = await agent.post('/api/deployments').send(validDeployment).expect(422);
      response.body.message.should.equal(`The given document id ${documentReturned._id} is not using a schema \
with the given schema_name of "invalid". Its schema has a name of "${validSimpleSchema.name}".`);
    });

    it('should not allow to create a deployment with a document thats already in use by another deployment', async function () {
      schemaObject = new Schema(validSimpleSchema);
      await schemaObject.save();

      validSimpleDocument.schema_id = schemaObject._id;
      documentObject = new Document(validSimpleDocument);
      documentReturned = await documentObject.save();

      secondValidDocument = _.cloneDeep(validDocument);
      secondValidDocument.name = 'Thedoc';
      secondDocumentObject = new Document(secondValidDocument);
      await secondDocumentObject.save();

      secondValidProject = _.cloneDeep(validProject);
      secondValidProject.name = 'TestProject2';
      secondProjectObject = new Project(secondValidProject);
      await secondProjectObject.save();

      secondValidDeployment = _.cloneDeep(validDeployment);
      secondValidDeployment.name = 'secondDeployment';
      secondValidDeployment.project_id = secondProjectObject._id;
      secondValidDeployment.enm.sed_id = secondDocumentObject._id;
      secondValidDeployment.documents = [
        {
          document_id: documentReturned._id,
          schema_name: validSimpleSchema.name
        }
      ];
      response = await agent.post('/api/deployments').send(secondValidDeployment).expect(201);

      validDeployment.documents = secondValidDeployment.documents;
      response = await agent.post('/api/deployments').send(validDeployment).expect(422);
      response.body.message.should.equal(`The associated document "${validSimpleDocument.name}" \
is already in use in another deployment "${secondValidDeployment.name}"`);
    });

    it('should allow to add deployment to a group', async function () {
      process.env.NODE_ENV = 'policyCheckEnabled';
      validDeployment.usergroups = [groupReturned._id.toString()];
      response = await agent.post('/api/deployments').auth(validUser.username, validUser.password).send(validDeployment).expect(201);
      groupReturned = await Group.findById(groupReturned._id).exec();
      groupReturned.associatedDeployments[0].toString().should.deepEqual(response.body._id.toString());
      process.env.NODE_ENV = nodeEnv;
    });

    it('should allow to add deployment from a group, when user is superAdmin', async function () {
      process.env.NODE_ENV = 'policyCheckEnabled';
      validDeployment.usergroups = [groupReturned._id.toString()];
      response = await agent.post('/api/deployments').auth(validUser3.username, validUser3.password).send(validDeployment).expect(201);
      groupReturned = await Group.findById(groupReturned._id).exec();
      groupReturned.associatedDeployments[0].toString().should.deepEqual(response.body._id.toString());
      process.env.NODE_ENV = nodeEnv;
    });

    it('should not allow to add same group twice', async function () {
      process.env.NODE_ENV = 'policyCheckEnabled';
      validDeployment.usergroups = [groupReturned._id.toString(), groupReturned._id.toString()];
      response = await agent.post('/api/deployments').auth(validUser.username, validUser.password).send(validDeployment).expect(422);
      response.body.message.should.equal('You cannot attach the same group twice');
      process.env.NODE_ENV = nodeEnv;
    });

    it('should not allow to add deployment to group, when user is not in that group', async function () {
      process.env.NODE_ENV = 'policyCheckEnabled';
      validDeployment.usergroups = [groupReturned._id.toString()];
      response = await agent.post('/api/deployments').auth(validUser2.username, validUser2.password).send(validDeployment).expect(422);
      response.body.message.should.equal(`You cannot attach group ${groupReturned._id.toString()}, you are not in this group`);
      process.env.NODE_ENV = nodeEnv;
    });

    it('should post a new log with user-details when a deployment is created by a logged-in user', async function () {
      response = await agent.post('/api/deployments').auth(validUser.username, validUser.password).send(validDeployment).expect(201);
      response.body.project_id.should.equal(validDeployment.project_id.toString());
      response.body.enm.sed_id.should.equal(validDeployment.enm.sed_id.toString());
      response.body.name.should.equal(validDeployment.name);
      deploymentReturned = await Deployment.findById(response.body._id).exec();
      deploymentReturned.project_id.toString().should.equal(validDeployment.project_id.toString());
      deploymentReturned.enm.sed_id.toString().should.equal(validDeployment.enm.sed_id.toString());
      deploymentReturned.name.should.equal(validDeployment.name);

      logReturned = await History.findOne({ associated_id: response.body._id }).exec();
      logReturned.originalData.should.not.equal(undefined);
      logReturned.originalData.project_id.toString().should.equal(validDeployment.project_id.toString());
      logReturned.originalData.enm.sed_id.toString().should.equal(validDeployment.enm.sed_id.toString());
      logReturned.originalData.name.should.equal(validDeployment.name);
      logReturned.createdAt.should.not.equal(undefined);
      logReturned.createdBy.should.not.equal(undefined);
      logReturned.createdBy.username.should.equal(validUser.username);
      logReturned.createdBy.email.should.equal(validUser.email);
      logReturned.updates.should.be.instanceof(Array).and.have.lengthOf(0);
    });

    it('should not post a new log for a deployment that is created with a name beginning with \'A_Health_\'', async function () {
      var validDeploymentHealth = _.cloneDeep(validDeployment);
      validDeploymentHealth.name = 'A_Health_Deployment';
      response = await agent.post('/api/deployments').send(validDeploymentHealth).expect(201);
      response.body._id.should.have.length(24);
      response.headers.location.should.equal(`/api/deployments/${response.body._id}`);
      response.body.name.should.equal(validDeploymentHealth.name);

      deploymentReturned = await Deployment.findById(response.body._id).exec();
      deploymentReturned.name.should.equal(validDeploymentHealth.name);

      logReturned = await History.findOne({ associated_id: response.body._id }).exec();
      should.not.exist(logReturned);
    });
  });

  describe('GET', function () {
    beforeEach(async function () {
      deploymentObject = new Deployment(validDeployment);
      deploymentReturned = await deploymentObject.save();
    });

    it('should be able to get deployments when user not authenticated', async function () {
      await nonAuthAgent.get('/api/deployments').expect(200);
    });

    it('should be able to get empty deployments list', async function () {
      await deploymentObject.remove();
      response = await agent.get('/api/deployments').expect(200);
      response.body.should.be.instanceof(Array).and.have.lengthOf(0);
    });

    it('should be able to get deployment list with one element', async function () {
      response = await agent.get('/api/deployments').expect(200);
      response.body.should.be.instanceof(Array).and.have.lengthOf(1);
      response.body[0]._id.should.equal(deploymentObject._id.toString());
    });

    it('should be able to get deployment list with more than one element', async function () {
      secondValidProject = _.cloneDeep(validProject);
      secondValidProject.name = 'TestProject2';
      secondProjectObject = new Project(secondValidProject);
      await secondProjectObject.save();

      secondValidDocument = _.cloneDeep(validDocument);
      secondValidDocument.name = 'Doc200';
      secondDocumentObject = new Document(secondValidDocument);
      secondDocumentReturned = await secondDocumentObject.save();

      secondValidDeployment = _.cloneDeep(validDeployment);
      secondValidDeployment.enm.sed_id = secondDocumentObject._id;
      secondValidDeployment.name = 'secondValidDeployment';
      secondValidDeployment.project_id = secondProjectObject._id;
      secondDeploymentObject = new Deployment(secondValidDeployment);
      secondDeploymentReturned = await secondDeploymentObject.save();

      response = await agent.get('/api/deployments/').expect(200);
      response.body.should.be.instanceof(Array).and.have.lengthOf(2);
    });

    it('should be able to get a single deployment', async function () {
      response = await agent.get(`/api/deployments/${deploymentObject._id}`).expect(200);
      response.body.name.should.equal(validDeployment.name);
      response.body.enm.sed_id.toString().should.deepEqual(validDeployment.enm.sed_id.toString());
      response.body.project_id.should.equal(validDeployment.project_id.toString());
    });

    it('should throw 404 when id is not in database', async function () {
      response = await agent.get('/api/deployments/000000000000000000000000').expect(404);
      response.body.message.should.equal('A deployment with that id does not exist');
    });

    it('should throw 404 when id is invalid in the database', async function () {
      response = await agent.get('/api/deployments/0').expect(404);
      response.body.message.should.equal('A deployment with that id does not exist');
    });
  });

  describe('PUT', function () {
    beforeEach(async function () {
      validDeployment.enm.sed_id = documentObject._id;
      validDeployment.project_id = projectObject._id;
      validDeployment.documents = [
        {
          document_id: vnfLcmDocumentObject._id,
          schema_name: schemaVnfLcmObject.name,
          schema_category: schemaVnfLcmObject.category
        }
      ];
      deploymentObject = new Deployment(validDeployment);
      deploymentReturned = await deploymentObject.save();
    });

    it('should not update Deployment when user is not authenticated', async function () {
      validDeployment2 = _.cloneDeep(validDeployment);
      validDeployment2.jira_issues = ['CIP-29798', 'CIP-30052'];
      response = await nonAuthAgent.put(`/api/deployments/${deploymentObject._id}`).send(validDeployment2).expect(401);
      response.body.message.should.equal('User must be logged in');
    });

    it('should update Deployment with JIRA Issues and check DB', async function () {
      validDeployment2 = _.cloneDeep(validDeployment);
      validDeployment2.jira_issues = ['CIP-29798', 'CIP-30052'];
      response = await agent.put(`/api/deployments/${deploymentObject._id}`).send(validDeployment2).expect(200);
      deploymentReturned = await Deployment.findById(deploymentObject._id).exec();
      documentReturned = await Document.findById(documentObject._id).exec();
      documentReturned.content.should.deepEqual(documentObject.content);
      deploymentReturned.name.should.equal(validDeployment2.name);
      deploymentReturned.jira_issues.should.containEql('CIP-29798');
      deploymentReturned.jira_issues.should.containEql('CIP-30052');
    });

    it('should update Deployment with a new cenm sed document', async function () {
      validDeployment2 = _.cloneDeep(validcENMDeployment);
      var cenmDeploymentObject = await agent.post('/api/deployments').send(validDeployment2).expect(201);
      validDeployment2 = _.cloneDeep(validcENMDeployment);
      validDeployment2.documents = [
        {
          document_id: validcENMDocument2Object._id,
          schema_name: validcENMSchema2.name,
          schema_category: 'cenm'
        }
      ];
      response = await agent.put(`/api/deployments/${cenmDeploymentObject.body._id}`).send(validDeployment2).expect(200);
      response.body.name.should.equal(validDeployment2.name);
      response.body.documents[0].document_id.should.equal((validDeployment2.documents[0].document_id).toString());
    });

    it('should update Deployment with a new vnflcm sed document', async function () {
      validDeployment2 = _.cloneDeep(validDeployment);
      var vnfLcmDocument = _.cloneDeep(validVnLcmDocument);
      vnfLcmDocument.name = 'VNFLCMTEST';
      vnfLcmDocument.schema_id = schemaVnfLcmObject._id;
      var vnfLcmDocumentObjectTwo = new Document(vnfLcmDocument);
      await vnfLcmDocumentObjectTwo.save();
      validDeployment2.documents = [
        {
          document_id: vnfLcmDocumentObjectTwo._id,
          schema_name: schemaVnfLcmObject.name,
          schema_category: schemaVnfLcmObject.category
        }
      ];
      response = await agent.put(`/api/deployments/${deploymentObject._id}`).send(validDeployment2).expect(200);
      response.body.name.should.equal(validDeployment2.name);
      response.body.documents[0].document_id.should.equal((validDeployment2.documents[0].document_id).toString());
    });

    it('should update Deployment with JIRA Issue even if can\'t connect to JIRA and check DB', async function () {
      process.env.JIRA_HOST = 'jira-oss';
      validDeployment2 = _.cloneDeep(validDeployment);
      validDeployment2.jira_issues = ['CIP-29798'];
      response = await agent.put(`/api/deployments/${deploymentObject._id}`).send(validDeployment2).expect(200);
      deploymentReturned = await Deployment.findById(deploymentObject._id).exec();
      deploymentReturned.name.should.equal(validDeployment2.name);
      deploymentReturned.jira_issues.should.containEql('CIP-29798');
      process.env.JIRA_HOST = jiraHost;
    });

    it('should throw error when same JIRA Issue entered multiple times', async function () {
      validDeployment2 = _.cloneDeep(validDeployment);
      validDeployment2.jira_issues = ['CIP-29798', 'CIP-29798'];
      response = await agent.put(`/api/deployments/${deploymentObject._id}`).send(validDeployment2).expect(422);
      response.body.message.should.containEql('You cannot add the same JIRA Issue multiple times. Please remove the duplicates: CIP-29798 and try again.');
    });

    it('should throw error when same JIRA Issue entered multiple times, display two issues the error message', async function () {
      validDeployment2 = _.cloneDeep(validDeployment);
      validDeployment2.jira_issues = ['CIP-29798', 'CIP-29798', 'CIP-30065', 'CIP-30065'];
      response = await agent.put(`/api/deployments/${deploymentObject._id}`).send(validDeployment2).expect(422);
      response.body.message.should.containEql('You cannot add the same JIRA Issue multiple times. Please remove the duplicates: CIP-29798, CIP-30065 and try again.');
    });

    it('should throw error when same JIRA Issue entered multiple times: lowercase JIRA Issue value', async function () {
      validDeployment2 = _.cloneDeep(validDeployment);
      validDeployment2.jira_issues = ['CIP-29798', 'cip-29798', 'CIP-29798'];
      response = await agent.put(`/api/deployments/${deploymentObject._id}`).send(validDeployment2).expect(422);
      response.body.message.should.containEql('You cannot add the same JIRA Issue multiple times. Please remove the duplicates: CIP-29798 and try again.');
    });
    it('should throw error when JIRA Issue is invalid', async function () {
      validDeployment2 = _.cloneDeep(validDeployment);
      validDeployment2.jira_issues = ['CIP-29798', 'CI2979899999'];
      response = await agent.put(`/api/deployments/${deploymentObject._id}`).send(validDeployment2).expect(422);
      response.body.message.should.containEql('is invalid');
    });

    it('should allow to remove deployment from a group', async function () {
      process.env.NODE_ENV = 'policyCheckEnabled';
      validDeployment.usergroups = [groupReturned._id.toString()];
      deploymentResponse = await agent.put(`/api/deployments/${deploymentObject._id}`)
        .auth(validUser.username, validUser.password).send(validDeployment).expect(200);
      groupReturned = await Group.findById(groupReturned._id).exec();
      groupReturned.associatedDeployments[0].toString().should.deepEqual(deploymentResponse.body._id.toString());
      validDeployment.usergroups = [];
      _deploymentUpdated = _.cloneDeep(validDeployment);
      response = await agent.put(`/api/deployments/${deploymentResponse.body._id}`)
        .auth(validUser.username, validUser.password).send(_deploymentUpdated).expect(200);
      groupReturned = await Group.findById(groupReturned._id).exec();
      groupReturned.associatedDeployments.length.should.equal(0);
      process.env.NODE_ENV = nodeEnv;
    });

    it('should not allow to add same group twice', async function () {
      process.env.NODE_ENV = 'policyCheckEnabled';
      validDeployment.usergroups = [groupReturned._id.toString(), groupReturned._id.toString()];
      response = await agent.put(`/api/deployments/${deploymentObject._id}`)
        .auth(validUser.username, validUser.password)
        .send(validDeployment).expect(422);
      response.body.message.should.equal('You cannot attach the same group twice');
      process.env.NODE_ENV = nodeEnv;
    });

    it('should not allow to add deployment to group, when user is not in that group', async function () {
      process.env.NODE_ENV = 'policyCheckEnabled';
      validDeployment.usergroups = [groupReturned._id.toString()];
      response = await agent.put(`/api/deployments/${deploymentObject._id}`)
        .auth(validUser2.username, validUser2.password).send(validDeployment).expect(422);
      response.body.message.should.equal(`You cannot attach group ${groupReturned._id.toString()}, you are not in this group`);
      process.env.NODE_ENV = nodeEnv;
    });

    it('should allow to remove deployment from a group, when user is superAdmin', async function () {
      process.env.NODE_ENV = 'policyCheckEnabled';
      validDeployment.usergroups = [groupReturned._id.toString()];
      deploymentResponse = await agent.put(`/api/deployments/${deploymentObject._id}`)
        .auth(validUser.username, validUser.password).send(validDeployment).expect(200);
      groupReturned = await Group.findById(groupReturned._id).exec();
      groupReturned.associatedDeployments[0].toString().should.deepEqual(deploymentResponse.body._id.toString());
      validDeployment.usergroups = [];
      _deploymentUpdated = _.cloneDeep(validDeployment);
      response = await agent.put(`/api/deployments/${deploymentResponse.body._id}`)
        .auth(validUser3.username, validUser3.password).send(_deploymentUpdated).expect(200);
      groupReturned = await Group.findById(groupReturned._id).exec();
      groupReturned.associatedDeployments.length.should.equal(0);
      process.env.NODE_ENV = nodeEnv;
    });

    it('should not allow to remove deployment from a group, when user is not in that group', async function () {
      process.env.NODE_ENV = 'policyCheckEnabled';
      validDeployment.usergroups = [groupReturned._id.toString()];
      deploymentResponse = await agent.put(`/api/deployments/${deploymentObject._id}`)
        .auth(validUser.username, validUser.password).send(validDeployment).expect(200);
      groupReturned = await Group.findById(groupReturned._id).exec();
      groupReturned.associatedDeployments[0].toString().should.deepEqual(deploymentResponse.body._id.toString());
      validDeployment.usergroups = [];
      _deploymentUpdated = _.cloneDeep(validDeployment);
      response = await agent.put(`/api/deployments/${deploymentResponse.body._id}`)
        .auth(validUser2.username, validUser2.password).send(_deploymentUpdated).expect(200);
      groupReturned = await Group.findById(groupReturned._id).exec();
      groupReturned.associatedDeployments.length.should.equal(1);
      process.env.NODE_ENV = nodeEnv;
    });

    it('should return the updated deployment name and content after update and check db', async function () {
      secondValidDeployment = _.cloneDeep(validDeployment);
      secondValidDeployment.name = 'updatedName';
      response = await agent.put(`/api/deployments/${deploymentObject._id}`).send(secondValidDeployment).expect(200);
      response.body._id.should.have.length(24);
      response.body.name.should.equal(secondValidDeployment.name);
      deploymentReturned = await Deployment.findById(response.body._id).exec();
      deploymentReturned._id.toString().should.equal(response.body._id.toString());
      deploymentReturned.name.should.equal(response.body.name);
    });

    it('should update a deployment with a partical deployment', async function () {
      secondValidDeployment = { name: '_updatedDeployment' };
      response = await agent.put(`/api/deployments/${deploymentObject._id}`).send(secondValidDeployment).expect(200);
      response.body._id.should.have.length(24);
      response.body.name.should.equal(secondValidDeployment.name);
    });

    it('should respond with bad update request when using invalid json', async function () {
      badDeployment = '{';
      response = await agent.put(`/api/deployments/${deploymentObject._id}`).send(badDeployment).type('json').expect(400);
      response.body.message.should.equal('There was a syntax error found in your request, please make sure that it is valid and try again');
    });

    it('should not allow an update to a deployment with new field name', async function () {
      badDeployment = _.cloneDeep(validDeployment);
      badDeployment.extrakey = 'invalidValue';
      response = await agent.put(`/api/deployments/${deploymentObject._id}`).send(badDeployment).expect(400);
      response.body.message.should.equal('Field `extrakey` is not in schema and strict mode is set to throw.');
    });

    it('should allow to change deployment name to a valid deployment name', async function () {
      secondValidDeployment = _.cloneDeep(validDeployment);
      secondValidDeployment.name = 'ThisIsAValidName';
      response = await agent.put(`/api/deployments/${deploymentObject._id}`).send(secondValidDeployment).expect(200);
      response.body.name.should.equal(secondValidDeployment.name);
    });

    it('should not allow to change the name of a deployment to an existing name', async function () {
      secondValidDocument = _.cloneDeep(validDocument);
      secondValidDocument.name = 'TestDoc2';
      secondDocumentObject = new Document(secondValidDocument);
      secondDocumentReturned = await secondDocumentObject.save();

      secondValidProject = _.cloneDeep(validProject);
      secondValidProject.name = 'TestProject2';
      secondProjectObject = new Project(secondValidProject);
      await secondProjectObject.save();

      secondValidDeployment = _.cloneDeep(validDeployment);
      secondValidDeployment.enm.sed_id = secondDocumentObject._id;
      secondValidDeployment.project_id = secondProjectObject._id;
      secondValidDeployment.name = 'Deployment2';
      secondDeploymentObject = new Deployment(secondValidDeployment);
      secondDeploymentReturned = await secondDeploymentObject.save();

      badDeployment = _.cloneDeep(secondValidDeployment);
      badDeployment.name = validDeployment.name;
      response = await agent.put(`/api/deployments/${secondDeploymentObject._id}`).send(badDeployment).expect(400);
      response.body.message.should.equal('Error, provided name is not unique.');
    });

    it('should allow to change sed_id to a valid sed_id', async function () {
      secondValidDocument = _.cloneDeep(validDocument);
      secondValidDocument.name = 'TestDocument2';
      secondDocumentObject = new Document(secondValidDocument);
      secondValidDeployment = _.cloneDeep(validDeployment);
      secondDocumentReturned = await secondDocumentObject.save();
      secondValidDeployment.enm.sed_id = secondDocumentObject._id;
      response = await agent.put(`/api/deployments/${deploymentObject._id}`).send(secondValidDeployment).expect(200);
      response.body.enm.sed_id.should.equal(secondDocumentObject._id.toString());
    });

    it('should not allow to change to a valid sed_id that doesn\'t point to an actual document', async function () {
      badDeployment = _.cloneDeep(validDeployment);
      badDeployment.enm.sed_id = '000000000000000000000000';
      response = await agent.put(`/api/deployments/${deploymentObject._id}`).send(badDeployment).expect(422);
      response.body.message.should.equal('A document with that id \'000000000000000000000000\' does not exist');
    });

    it('should not allow to change sed_id to a invalid sed_id with less characters needed for an id', async function () {
      badDeployment = _.cloneDeep(validDeployment);
      badDeployment.enm.sed_id = '0';
      response = await agent.put(`/api/deployments/${deploymentObject._id}`).send(badDeployment).expect(400);
      response.body.message.should.equal('Cast to ObjectID failed for value "0" at path "enm.sed_id"');
    });

    it('should not allow to change to a valid sed_id that is in use by another deployment', async function () {
      secondValidDocument = _.cloneDeep(validDocument);
      secondValidDocument.name = 'TestDoc2';
      secondDocumentObject = new Document(secondValidDocument);
      secondDocumentReturned = await secondDocumentObject.save();
      should.exist(secondDocumentReturned);

      secondValidProject = _.cloneDeep(validProject);
      secondValidProject.name = 'AnValidName';
      secondProjectObject = new Project(secondValidProject);
      await secondProjectObject.save();
      should.exist(projectReturned);

      secondValidDeployment = _.cloneDeep(validDeployment);
      secondValidDeployment.name = 'TestName2';
      secondValidDeployment.project_id = secondProjectObject._id.toString();
      secondValidDeployment.enm.sed_id = secondDocumentObject._id.toString();
      secondDeploymentObject = new Deployment(secondValidDeployment);
      secondDeploymentReturned = await secondDeploymentObject.save();
      should.exist(secondDeploymentReturned);

      secondValidDeployment.enm.sed_id = documentObject._id;
      response = await agent.put(`/api/deployments/${secondDeploymentObject._id}`).send(secondValidDeployment).expect(400);
      response.body.message.should.equal('Error, provided enm.sed_id is not unique.');
    });

    it('should allow to change project to a valid project', async function () {
      secondValidProject = _.cloneDeep(validProject);
      secondValidProject.name = 'TestProject2';
      secondProjectObject = new Project(secondValidProject);
      projectReturned = await secondProjectObject.save();

      secondValidDeployment = _.cloneDeep(validDeployment);
      secondValidDeployment.project_id = secondProjectObject._id;
      response = await agent.put(`/api/deployments/${deploymentObject._id}`).send(secondValidDeployment).expect(200);
      response.body.project_id.should.equal(secondProjectObject._id.toString());
    });

    it('should not allow to change project_id to a project_id with an invalid length', async function () {
      badDeployment = _.cloneDeep(validDeployment);
      badDeployment.project_id = '0';
      response = await agent.put(`/api/deployments/${deploymentObject._id}`).send(badDeployment).expect(400);
      response.body.message.should.equal('Cast to ObjectID failed for value "0" at path "project_id"');
    });

    it('should not allow to change to a valid length project_id that does not exist in the db', async function () {
      badDeployment = _.cloneDeep(validDeployment);
      badDeployment.project_id = '000000000000000000000000';
      response = await agent.put(`/api/deployments/${deploymentObject._id}`).send(badDeployment).expect(422);
      response.body.message.should.equal('A project with id \'000000000000000000000000\' does not exist');
    });

    it('should not allow to change to a valid project_id that is in use by another deployment', async function () {
      secondValidDocument = _.cloneDeep(validDocument);
      secondValidDocument.name = 'TestDoc2';
      secondDocumentObject = new Document(secondValidDocument);
      secondDocumentReturned = await secondDocumentObject.save();
      should.exist(secondDocumentReturned);

      secondValidProject = _.cloneDeep(validProject);
      secondValidProject.name = 'AnValidName';
      secondProjectObject = new Project(secondValidProject);
      await secondProjectObject.save();
      should.exist(projectReturned);

      secondValidDeployment = _.cloneDeep(validDeployment);
      secondValidDeployment.name = 'TestName2';
      secondValidDeployment.project_id = secondProjectObject._id.toString();
      secondValidDeployment.enm.sed_id = secondDocumentObject._id.toString();
      secondDeploymentObject = new Deployment(secondValidDeployment);
      secondDeploymentReturned = await secondDeploymentObject.save();
      should.exist(secondDeploymentReturned);

      secondValidDeployment.project_id = projectObject._id;
      response = await agent.put(`/api/deployments/${secondDeploymentObject._id}`).send(secondValidDeployment).expect(400);
      response.body.message.should.equal('Error, provided project_id is not unique.');
    });

    it('should not allow to update a deployment to a sed that is pointing to a schema that has the category of enm', async function () {
      badschemaObject = new Schema(inValidSchema);
      await badschemaObject.save();

      secondValidDocument = _.cloneDeep(validDocument);
      secondValidDocument.name = 'Test_Doc_2';
      secondValidDocument.schema_id = badschemaObject._id;
      secondDocumentObject = new Document(secondValidDocument);
      secondDocumentReturned = await secondDocumentObject.save();

      validDeployment.enm.sed_id = secondDocumentObject._id;
      response = await agent.put(`/api/deployments/${deploymentObject._id}`).send(validDeployment).expect(422);
      response.body.message.should.equal('Schema\'s category of document \'Test_Doc_2\' is \'other\' but should have a schema with a category of \'enm\' or \'cenm\'.');
    });

    it('should not allow to update a deployment where its sed is a managed config', async function () {
      secondValidDocument = _.cloneDeep(validDocument);
      secondValidDocument.name = 'Test_Doc_2';
      secondValidDocument.managedconfig = true;
      secondDocumentObject = new Document(secondValidDocument);
      secondDocumentReturned = await secondDocumentObject.save();

      validDeployment.enm.sed_id = secondDocumentObject._id;
      response = await agent.put(`/api/deployments/${deploymentObject._id}`).send(validDeployment).expect(422);
      response.body.message.should.equal('A managed config cannot be directly associated with a deployment.');
    });

    it('should allow to update a deployment with a document attached', async function () {
      schemaObject = new Schema(validSimpleSchema);
      await schemaObject.save();

      validSimpleDocument.schema_id = schemaObject._id;
      documentObject = new Document(validSimpleDocument);
      documentReturned = await documentObject.save();

      validDeployment.documents = [
        {
          document_id: documentReturned._id,
          schema_name: validSimpleSchema.name
        }
      ];
      response = await agent.put(`/api/deployments/${deploymentObject._id}`).send(validDeployment).expect(200);
    });

    it('should not allow to update a deployment with a missing document schema_name key', async function () {
      schemaObject = new Schema(validSimpleSchema);
      await schemaObject.save();

      validSimpleDocument.schema_id = schemaObject._id;
      documentObject = new Document(validSimpleDocument);
      documentReturned = await documentObject.save();

      validDeployment.documents = [
        {
          document_id: documentReturned._id
        }
      ];
      response = await agent.put(`/api/deployments/${deploymentObject._id}`).send(validDeployment).expect(400);
      response.body.message.should.equal('Path `schema_name` is required.');
    });

    it('should not allow to update a deployment with a missing document document_id key', async function () {
      schemaObject = new Schema(validSimpleSchema);
      await schemaObject.save();

      validSimpleDocument.schema_id = schemaObject._id;
      documentObject = new Document(validSimpleDocument);
      documentReturned = await documentObject.save();

      validDeployment.documents = [
        {
          schema_name: validSimpleSchema.name
        }
      ];
      response = await agent.put(`/api/deployments/${deploymentObject._id}`).send(validDeployment).expect(400);
      response.body.message.should.equal('Path `document_id` is required.');
    });

    it('should not allow to update a deployment with a document containing extra keys', async function () {
      schemaObject = new Schema(validSimpleSchema);
      await schemaObject.save();

      validSimpleDocument.schema_id = schemaObject._id;
      documentObject = new Document(validSimpleDocument);
      documentReturned = await documentObject.save();

      validDeployment.documents = [
        {
          document_id: documentReturned._id,
          schema_name: validSimpleSchema.name,
          another_key: 'somevalue'
        }
      ];
      response = await agent.put(`/api/deployments/${deploymentObject._id}`).send(validDeployment).expect(400);
      response.body.message.should.containEql('Cast to Array failed for value');
    });

    it('should not allow to update a deployment with a document containing schema_name of enm_sed', async function () {
      validSimpleSchema.name = 'enm_sed';
      schemaObject = new Schema(validSimpleSchema);
      await schemaObject.save();

      validSimpleDocument.schema_id = schemaObject._id;
      documentObject = new Document(validSimpleDocument);
      documentReturned = await documentObject.save();

      validDeployment.documents = [
        {
          document_id: documentReturned._id,
          schema_name: validSimpleSchema.name
        }
      ];
      response = await agent.put(`/api/deployments/${deploymentObject._id}`).send(validDeployment).expect(422);
      response.body.message.should.equal('You cannot associate an enm_sed document within the deployments documents list.');
    });

    it('should not allow to update a deployment with two documents of the same schema_name', async function () {
      schemaObject = new Schema(validSimpleSchema);
      await schemaObject.save();

      validSimpleDocument.schema_id = schemaObject._id;
      documentObject = new Document(validSimpleDocument);
      documentReturned = await documentObject.save();

      validDeployment.documents = [
        {
          document_id: documentReturned._id,
          schema_name: validSimpleSchema.name
        },
        {
          document_id: documentReturned._id,
          schema_name: validSimpleSchema.name
        }
      ];
      response = await agent.put(`/api/deployments/${deploymentObject._id}`).send(validDeployment).expect(422);
      response.body.message.should.equal('You cannot associate multiple documents with the same schema_name.');
    });

    it('should not allow to update a deployment with a document with an invalid id', async function () {
      schemaObject = new Schema(validSimpleSchema);
      await schemaObject.save();

      validSimpleDocument.schema_id = schemaObject._id;
      documentObject = new Document(validSimpleDocument);
      documentReturned = await documentObject.save();

      validDeployment.documents = [
        {
          document_id: 'invalid',
          schema_name: validSimpleSchema.name
        }
      ];
      response = await agent.put(`/api/deployments/${deploymentObject._id}`).send(validDeployment).expect(400);
      response.body.message.should.equal('Cast to ObjectID failed for value "invalid" at path "document_id"');
    });

    it('should not allow to update a deployment with a document that does not exist', async function () {
      validDeployment.documents = [
        {
          document_id: '000000000000000000000000',
          schema_name: 'invalid'
        }
      ];
      response = await agent.put(`/api/deployments/${deploymentObject._id}`).send(validDeployment).expect(422);
      response.body.message.should.equal('The given document id 000000000000000000000000 could not be found');
    });

    it('should not allow to update a deployment with a documents with non matching schema_name and document_id', async function () {
      schemaObject = new Schema(validSimpleSchema);
      await schemaObject.save();

      validSimpleDocument.schema_id = schemaObject._id;
      documentObject = new Document(validSimpleDocument);
      documentReturned = await documentObject.save();

      validDeployment.documents = [
        {
          document_id: documentReturned._id,
          schema_name: 'invalid'
        }
      ];
      response = await agent.put(`/api/deployments/${deploymentObject._id}`).send(validDeployment).expect(422);
      response.body.message.should.equal(`The given document id ${documentReturned._id} is not using a schema \
with the given schema_name of "invalid". Its schema has a name of "${validSimpleSchema.name}".`);
    });

    it('should not allow to update a deployment with a document thats already in use by another deployment', async function () {
      schemaObject = new Schema(validSimpleSchema);
      await schemaObject.save();

      validSimpleDocument.schema_id = schemaObject._id;
      documentObject = new Document(validSimpleDocument);
      documentReturned = await documentObject.save();

      secondValidDocument = _.cloneDeep(validDocument);
      secondValidDocument.name = 'Thedoc';
      secondDocumentObject = new Document(secondValidDocument);
      await secondDocumentObject.save();

      secondValidProject = _.cloneDeep(validProject);
      secondValidProject.name = 'TestProject2';
      secondProjectObject = new Project(secondValidProject);
      await secondProjectObject.save();

      secondValidDeployment = _.cloneDeep(validDeployment);
      secondValidDeployment.name = 'secondDeployment';
      secondValidDeployment.project_id = secondProjectObject._id;
      secondValidDeployment.enm.sed_id = secondDocumentObject._id;
      secondValidDeployment.documents = [
        {
          document_id: documentReturned._id,
          schema_name: validSimpleSchema.name
        }
      ];
      response = await agent.post('/api/deployments').send(secondValidDeployment).expect(201);
      validDeployment.documents = secondValidDeployment.documents;
      response = await agent.put(`/api/deployments/${deploymentObject._id}`).send(validDeployment).expect(422);
      response.body.message.should.equal(`The associated document "${validSimpleDocument.name}" \
is already in use in another deployment "${secondValidDeployment.name}"`);
    });

    it('should update an existing log with user-details for a deployment thats updated by a logged-in user', async function () {
      secondValidDeployment = { name: '_updatedDeployment' };
      response = await agent.put(`/api/deployments/${deploymentObject._id}`)
        .send(secondValidDeployment)
        .auth(validUser.username, validUser.password)
        .expect(200);
      response.body._id.should.have.length(24);
      response.body.name.should.equal(secondValidDeployment.name);

      logReturned = await History.findOne({ associated_id: response.body._id }).exec();
      logReturned.originalData.should.not.equal(undefined);
      logReturned.originalData.name.should.equal(validDeployment.name);

      logReturned.updates.should.be.instanceof(Array).and.have.lengthOf(1);
      logReturned.updates[0].updatedAt.should.not.equal(undefined);
      logReturned.updates[0].updatedBy.username.should.equal(validUser.username);
      logReturned.updates[0].updatedBy.email.should.equal(validUser.email);
      logReturned.updates[0].updateData.name.should.equal(secondValidDeployment.name);
    });

    it('should create a log with defined user-details for a deployment that gets updated by a logged-in user', async function () {
      // clear logs and verify
      await History.remove().exec();
      logReturned = await History.findOne({ associated_id: response.body._id }).exec();
      should.not.exist(logReturned);

      secondValidDeployment = { name: '_updatedDeployment' };
      response = await agent.put(`/api/deployments/${deploymentObject._id}`)
        .send(secondValidDeployment)
        .auth(validUser.username, validUser.password)
        .expect(200);
      response.body._id.should.have.length(24);
      response.body.name.should.equal(secondValidDeployment.name);

      logReturned = await History.findOne({ associated_id: response.body._id }).exec();
      logReturned.originalData.should.not.equal(undefined);
      logReturned.originalData.name.should.equal(validDeployment.name);

      logReturned.updates.should.be.instanceof(Array).and.have.lengthOf(1);
      logReturned.updates[0].updatedAt.should.not.equal(undefined);
      logReturned.updates[0].updatedBy.username.should.equal(validUser.username);
      logReturned.updates[0].updatedBy.email.should.equal(validUser.email);
      logReturned.updates[0].updateData.name.should.equal(secondValidDeployment.name);
    });
  });

  describe('DELETE', function () {
    beforeEach(async function () {
      validDeployment.enm.sed_id = documentObject._id;
      validDeployment.project_id = projectObject._id;
      deploymentObject = new Deployment(validDeployment);
      deploymentReturned = await deploymentObject.save();
    });

    it('should not delete Deployment when user is not authenticated', async function () {
      response = await nonAuthAgent.delete(`/api/deployments/${deploymentObject._id}`).send(deploymentObject).expect(401);
      response.body.message.should.equal('User must be logged in');
    });

    it('should delete a deployment and check db', async function () {
      response = await agent.delete(`/api/deployments/${deploymentObject._id}`).send(deploymentObject).expect(200);
      response.body._id.should.have.length(24);
      response.body._id.should.equal(deploymentObject._id.toString());
      response.body.name.should.equal(validDeployment.name);
      response.body.enm.sed_id.should.deepEqual(validDeployment.enm.sed_id.toString());
      deploymentReturned = await Deployment.findById(response.body._id).exec();
      should.not.exist(deploymentReturned);
    });

    it('should fail when attempting to deletes deployment that does not exist', async function () {
      response = await agent.delete('/api/deployments/000000000000000000000000').expect(404);
      response.body.message.should.equal('A deployment with that id does not exist');
    });

    it('should fail when attempting to delete deployment with an invalid _id', async function () {
      response = await agent.delete('/api/deployments/ThisIsAInvalidId').expect(404);
      response.body.message.should.equal('A deployment with that id does not exist');
    });

    it('should update an existing log with user-details for a deployment thats deleted by a logged-in user', async function () {
      response = await agent.delete(`/api/deployments/${deploymentObject._id}`)
        .auth(validUser.username, validUser.password)
        .expect(200);
      response.body._id.should.have.length(24);
      response.body._id.should.equal(deploymentObject._id.toString());

      logReturned = await History.findOne({ associated_id: response.body._id }).exec();
      logReturned.originalData.should.not.equal(undefined);
      logReturned.originalData.name.should.equal(validDeployment.name);

      logReturned.updates.should.be.instanceof(Array).and.have.lengthOf(0);
      logReturned.deletedAt.should.not.equal(undefined);
      logReturned.deletedBy.should.not.equal(undefined);
      logReturned.deletedBy.username.should.equal(validUser.username);
      logReturned.deletedBy.email.should.equal(validUser.email);
    });

    it('should create a log with defined user-details for a deployment that gets deleted by a logged-in user', async function () {
      // clear logs and verify
      await History.remove().exec();
      logReturned = await History.findOne({ associated_id: response.body._id }).exec();
      should.not.exist(logReturned);

      response = await agent.delete(`/api/deployments/${deploymentObject._id}`)
        .auth(validUser.username, validUser.password)
        .expect(200);
      response.body._id.should.have.length(24);
      response.body._id.should.equal(deploymentObject._id.toString());

      logReturned = await History.findOne({ associated_id: response.body._id }).exec();
      logReturned.originalData.should.not.equal(undefined);
      logReturned.originalData.name.should.equal(validDeployment.name);

      logReturned.updates.should.be.instanceof(Array).and.have.lengthOf(0);
      logReturned.deletedAt.should.not.equal(undefined);
      logReturned.deletedBy.should.not.equal(undefined);
      logReturned.deletedBy.username.should.equal(validUser.username);
      logReturned.deletedBy.email.should.equal(validUser.email);
    });
  });

  describe('SEARCH', function () {
    beforeEach(async function () {
      validDeployment.enm.sed_id = documentObject._id;
      validDeployment.project_id = projectObject._id;
      deploymentObject = new Deployment(validDeployment);
      deploymentReturned = await deploymentObject.save();
    });

    it('should not return a deployment when passing in a valid parameter with a non existent deployments ID', async function () {
      response = await agent.get('/api/deployments?q=_id=5bcdbe7287e21906ed4f12ba').expect(200);
      response.body.length.should.equal(0);
    });

    it('should not return a deployment when passing in a valid parameter with a non existent parameter', async function () {
      response = await agent.get(`/api/deployments?q=${encodeURIComponent(`project_id=${deploymentObject.project_id}&name=notExisting`)}`)
        .expect(200);
      response.body.length.should.equal(0);
    });

    it('should return an error when not encoding q search parameters', async function () {
      response = await agent.get(`/api/documents?q=.project_id=${deploymentObject.project_id}&name=notExisting`).expect(422);
      response.body.message.should.equal('Improperly structured query. Make sure to use ?q=<key>=<value> syntax');
    });

    it('should return a single deployment when passing in _id parameter', async function () {
      response = await agent.get(`/api/deployments?q=_id=${deploymentObject._id}`).expect(200);
      response.body[0].should.be.instanceof(Object);
      response.body[0].name.should.equal(deploymentObject.name);
      response.body[0].project_id.should.equal(deploymentObject.project_id.toString());
    });

    it('should not return a deployment when passing in invalid parameter', async function () {
      response = await agent.get('/api/deployments?q=n0nsense=123454321').expect(200);
      response.body.length.should.equal(0);
    });

    it('should return a single deployment when passing in name parameter', async function () {
      response = await agent.get(`/api/deployments?q=name=${deploymentObject.name}`).expect(200);
      response.body[0].should.be.instanceof(Object);
      response.body[0].name.should.equal(deploymentObject.name);
      response.body[0].project_id.should.equal(deploymentObject.project_id.toString());
    });

    it('should only return fields specified in url', async function () {
      response = await agent.get('/api/deployments?fields=name').expect(200);
      response.body.length.should.equal(1);
      for (var key in response.body) {
        if (Object.prototype.hasOwnProperty.call(response.body, key)) {
          Object.prototype.hasOwnProperty.call(response.body[key], 'name').should.equal(true);
        }
      }
    });

    it('should only return fields specified in url using fields and q functionality', async function () {
      response = await agent.get(`/api/deployments?fields=name&q=name=${deploymentObject.name}`).expect(200);
      response.body.length.should.equal(1);
      Object.prototype.hasOwnProperty.call(response.body[0], 'name').should.equal(true);
      response.body[0].name.should.equal(deploymentObject.name);
    });

    it('should only return nested fields specified in url', async function () {
      response = await agent.get('/api/deployments?fields=enm(sed_id)').expect(200);
      response.body.length.should.equal(1);
      Object.prototype.hasOwnProperty.call(response.body[0], 'enm').should.equal(true);
      response.body[0].enm.sed_id.should.equal(deploymentObject.enm.sed_id.toString());
    });

    it('should return an error message when query has invalid search key blah', async function () {
      response = await agent.get(`/api/deployments?q=name=${deploymentObject.name}&fields=name&blah=blah`).expect(422);
      response.body.message.should.equal('Improperly structured query. Make sure to use ?q=<key>=<value> syntax');
    });

    it('should return an error message when queried with an improper search', async function () {
      response = await agent.get(`/api/deployments?name=${deploymentObject.name}`).expect(422);
      response.body.message.should.equal('Improperly structured query. Make sure to use ?q=<key>=<value> syntax');
    });

    it('should return an error message when queried with an empty q=', async function () {
      response = await agent.get('/api/deployments?q=').expect(422);
      response.body.message.should.equal('Improperly structured query. Make sure to use ?q=<key>=<value> syntax');
    });

    it('should return an error message when queried with an empty fields=', async function () {
      response = await agent.get('/api/deployments?fields=').expect(422);
      response.body.message.should.equal('Improperly structured query. Make sure to use ?q=<key>=<value> syntax');
    });

    it('should return an error message when queried with an empty fields= and q=', async function () {
      response = await agent.get('/api/deployments?q=&fields=').expect(422);
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
    await Deployment.remove().exec();
    await History.remove().exec();
    await PodsHistory.remove().exec();
  });
});
