'use strict';

var fs = require('fs');
var chai = require('chai'),
  chaiHttp = require('chai-http'),
  expect = chai.expect,
  request = require('supertest'),
  mongoose = require('mongoose'),
  _ = require('lodash'),
  sinon = require('sinon'),
  DeploymentsHistory = require('../../../history/server/models/history.server.model').getSchema('deployments'),
  DocumentsHistory = require('../../../history/server/models/history.server.model').getSchema('documents'),
  GroupsHistory = require('../../../history/server/models/history.server.model').getSchema('groups'),
  LabelsHistory = require('../../../history/server/models/history.server.model').getSchema('labels'),
  PodsHistory = require('../../../history/server/models/history.server.model').getSchema('pods'),
  ProjectsHistory = require('../../../history/server/models/history.server.model').getSchema('projects'),
  SchemasHistory = require('../../../history/server/models/history.server.model').getSchema('schemas'),
  Schema = mongoose.model('Schema'),
  Document = mongoose.model('Document'),
  Deployment = mongoose.model('Deployment'),
  Label = mongoose.model('Label'),
  Pod = mongoose.model('Pod'),
  Project = mongoose.model('Project'),
  Group = mongoose.model('Group'),
  User = mongoose.model('User'),
  express = require('../../../../config/lib/express');

require('sinon-mongoose');
chai.use(chaiHttp);

var app,
  agent,
  response,
  validLabel,
  labelObject,
  secondValidLabel,
  secondLabelObject,
  validPod,
  podObject,
  secondValidPod,
  secondPodObject,
  validProject,
  secondValidProject,
  projectObject,
  secondProjectObject,
  validSchema,
  schemaObject,
  secondValidSchema,
  secondSchemaObject,
  validDocument,
  documentObject,
  secondValidDocument,
  secondDocumentObject,
  validDeployment,
  deploymentObject,
  secondValidDeployment,
  secondDeploymentObject,
  validUser,
  userObject,
  validGroup,
  groupObject,
  secondValidGroup,
  secondGroupObject;

describe('History', function () {
  before(async function () {
    app = express.init(mongoose);
    agent = request.agent(app);
  });

  beforeEach(async function () {
    validLabel = { name: 'tmpLabel1' };
    labelObject = new Label(validLabel);
    await labelObject.save();

    validPod = JSON.parse(fs.readFileSync('/opt/mean.js/modules/history/tests/server/test_files/valid_pod.json', 'utf8'));
    validProject = JSON.parse(fs.readFileSync('/opt/mean.js/modules/history/tests/server/test_files/valid_project.json', 'utf8'));
    validSchema = JSON.parse(fs.readFileSync('/opt/mean.js/modules/history/tests/server/test_files/valid_schema.json', 'utf8'));
    validDocument = JSON.parse(fs.readFileSync('/opt/mean.js/modules/history/tests/server/test_files/valid_document.json', 'utf8'));
    validDeployment = JSON.parse(fs.readFileSync('/opt/mean.js/modules/history/tests/server/test_files/valid_deployment.json', 'utf8'));
    validUser = JSON.parse(fs.readFileSync('/opt/mean.js/modules/deployments/tests/server/test_files/valid_user.json', 'utf8'));

    podObject = new Pod(validPod);
    await podObject.save();

    validProject.pod_id = podObject._id;
    projectObject = new Project(validProject);
    await projectObject.save();

    schemaObject = new Schema(validSchema);
    await schemaObject.save();

    validDocument.schema_id = schemaObject._id;
    documentObject = new Document(validDocument);
    await documentObject.save();

    validDeployment.project_id = projectObject._id;
    validDeployment.enm.sed_id = documentObject._id;
    deploymentObject = new Deployment(validDeployment);
    await deploymentObject.save();

    userObject = new User(validUser);
    await userObject.save();

    validGroup = {
      name: 'tmpGroup1',
      admin_IDs: [userObject._id],
      users: [],
      associatedDocuments: []
    };
    groupObject = new Group(validGroup);
    await groupObject.save();
  });

  describe('GET', function () {
    describe('logs/deployments', function () {
      it('should be able to get empty deployments-log list', async function () {
        await DeploymentsHistory.remove().exec();
        response = await agent.get('/api/logs/deployments').expect(200);
        response.body.should.be.instanceof(Array).and.have.lengthOf(0);
      });

      it('should be able to get deployments-log list with one element', async function () {
        response = await agent.get('/api/logs/deployments').expect(200);
        response.body.should.be.instanceof(Array).and.have.lengthOf(1);
        response.body[0].associated_id.should.equal(deploymentObject._id.toString());
      });

      it('should be able to get deployments-log list with more than one element', async function () {
        secondValidProject = _.cloneDeep(validProject);
        secondValidProject.name = 'tmpProj2';
        secondProjectObject = new Project(secondValidProject);
        await secondProjectObject.save();

        secondValidDocument = _.cloneDeep(validDocument);
        secondValidDocument.name = 'tmpDoc2';
        secondDocumentObject = new Document(secondValidDocument);
        await secondDocumentObject.save();

        secondValidDeployment = _.cloneDeep(validDeployment);
        secondValidDeployment.enm.sed_id = secondDocumentObject._id;
        secondValidDeployment.name = 'tmpDepl2';
        secondValidDeployment.project_id = secondProjectObject._id;
        secondDeploymentObject = new Deployment(secondValidDeployment);
        await secondDeploymentObject.save();

        response = await agent.get('/api/logs/deployments/').expect(200);
        response.body.should.be.instanceof(Array).and.have.lengthOf(2);
      });

      it('should be able to get a single deployment log', async function () {
        response = await agent.get(`/api/logs/deployments/${deploymentObject._id}`).expect(200);
        response.body.associated_id.toString().should.deepEqual(deploymentObject._id.toString());
        response.body.originalData.name.should.equal(validDeployment.name);
      });

      it('should throw 404 when deployment id is not in deployments-log database', async function () {
        response = await agent.get('/api/logs/deployments/000000000000000000000000').expect(404);
        response.body.message.should.equal('A deployments log with that id does not exist. Ensure a correct deployments id is entered and is not a log or legacy object id.');
      });

      it('should throw 404 when deployment id is invalid in the deployments-log database', async function () {
        response = await agent.get('/api/logs/deployments/0').expect(404);
        response.body.message.should.equal('A deployments log with that id does not exist. Ensure a correct deployments id is entered and is not a log or legacy object id.');
      });

      it('should return an error message and status 422 when the DeploymentsHistory.find function fails', async function () {
        sinon.mock(DeploymentsHistory).expects('find').chain('exec').yields(new Error('Simulated Error.'));
        response = await agent.get('/api/logs/deployments/').expect(422);
        expect(response.body.message).to.deep.equal('Simulated Error.');
      });

      it('should return an error message and status 500 when the DeploymentsHistory.findOne function fails', async function () {
        sinon.mock(DeploymentsHistory).expects('findOne').chain('exec').yields(new Error('Simulated Error'));
        response = await agent.get(`/api/logs/deployments/${deploymentObject._id}`).expect(404);
        expect(response.body.message).to.deep.equal('An error occurred whilst trying to find a log: Internal Server Error.');
      });
    });

    describe('logs/documents', function () {
      it('should be able to get empty documents-log list', async function () {
        await DocumentsHistory.remove().exec();
        response = await agent.get('/api/logs/documents').expect(200);
        response.body.should.be.instanceof(Array).and.have.lengthOf(0);
      });

      it('should be able to get documents-log list with one element', async function () {
        response = await agent.get('/api/logs/documents').expect(200);
        response.body.should.be.instanceof(Array).and.have.lengthOf(1);
        response.body[0].associated_id.should.equal(documentObject._id.toString());
      });

      it('should be able to get documents-log list with more than one element', async function () {
        secondValidProject = _.cloneDeep(validProject);
        secondValidProject.name = 'tmpProj2';
        secondProjectObject = new Project(secondValidProject);
        await secondProjectObject.save();

        secondValidDocument = _.cloneDeep(validDocument);
        secondValidDocument.name = 'tmpDoc2';
        secondDocumentObject = new Document(secondValidDocument);
        await secondDocumentObject.save();

        response = await agent.get('/api/logs/documents/').expect(200);
        response.body.should.be.instanceof(Array).and.have.lengthOf(2);
      });

      it('should not be able to get a document snapshot log as they are not created', async function () {
        response = await agent.get('/api/logs/documents/').expect(200);
        response.body.should.be.instanceof(Array).and.have.lengthOf(1);
        secondValidDocument = _.cloneDeep(validDocument);
        secondValidDocument.name = 'snapshot1';
        secondDocumentObject = new Document(secondValidDocument);
        await secondDocumentObject.save();

        response = await agent.get('/api/logs/documents/').expect(200);
        response.body.should.be.instanceof(Array).and.have.lengthOf(1);
        expect(response.body[0].originalData.name).to.equal(validDocument.name);
      });

      it('should be able to get a single document log', async function () {
        response = await agent.get(`/api/logs/documents/${documentObject._id}`).expect(200);
        response.body.associated_id.toString().should.deepEqual(documentObject._id.toString());
        response.body.originalData.name.should.equal(validDocument.name);
      });

      it('should throw 404 when document id is not in documents-log database', async function () {
        response = await agent.get('/api/logs/documents/000000000000000000000000').expect(404);
        response.body.message.should.equal('A documents log with that id does not exist. Ensure a correct documents id is entered and is not a log or legacy object id.');
      });

      it('should throw 404 when document id is invalid in the documents-log database', async function () {
        response = await agent.get('/api/logs/documents/0').expect(404);
        response.body.message.should.equal('A documents log with that id does not exist. Ensure a correct documents id is entered and is not a log or legacy object id.');
      });

      it('should return an error message and status 422 when the DocumentsHistory.find function fails', async function () {
        sinon.mock(DocumentsHistory).expects('find').chain('exec').yields(new Error('Simulated Error.'));
        response = await agent.get('/api/logs/documents/').expect(422);
        expect(response.body.message).to.deep.equal('Simulated Error.');
      });

      it('should return an error message and status 500 when the DocumentsHistory.findOne function fails', async function () {
        sinon.mock(DocumentsHistory).expects('findOne').chain('exec').yields(new Error('Simulated Error'));
        response = await agent.get(`/api/logs/documents/${documentObject._id}`).expect(404);
        expect(response.body.message).to.deep.equal('An error occurred whilst trying to find a log: Internal Server Error.');
      });
    });

    describe('logs/groups', function () {
      it('should be able to get empty groups-log list', async function () {
        await GroupsHistory.remove().exec();
        response = await agent.get('/api/logs/groups').expect(200);
        response.body.should.be.instanceof(Array).and.have.lengthOf(0);
      });

      it('should be able to get groups-log list with one element', async function () {
        response = await agent.get('/api/logs/groups').expect(200);
        response.body.should.be.instanceof(Array).and.have.lengthOf(1);
        response.body[0].associated_id.should.equal(groupObject._id.toString());
      });

      it('should be able to get groups-log list with more than one element', async function () {
        secondValidGroup = _.cloneDeep(validGroup);
        secondValidGroup.name = 'tmpGroup2';
        secondGroupObject = new Group(secondValidGroup);
        await secondGroupObject.save();

        response = await agent.get('/api/logs/groups/').expect(200);
        response.body.should.be.instanceof(Array).and.have.lengthOf(2);
      });

      it('should be able to get a single group log', async function () {
        response = await agent.get(`/api/logs/groups/${groupObject._id}`).expect(200);
        response.body.associated_id.toString().should.deepEqual(groupObject._id.toString());
        response.body.originalData.name.should.equal(validGroup.name);
      });

      it('should throw 404 when group id is not in groups-log database', async function () {
        response = await agent.get('/api/logs/groups/000000000000000000000000').expect(404);
        response.body.message.should.equal('A groups log with that id does not exist. Ensure a correct groups id is entered and is not a log or legacy object id.');
      });

      it('should throw 404 when group id is invalid in the groups-log database', async function () {
        response = await agent.get('/api/logs/groups/0').expect(404);
        response.body.message.should.equal('A groups log with that id does not exist. Ensure a correct groups id is entered and is not a log or legacy object id.');
      });

      it('should return an error message and status 422 when the GroupsHistory.find function fails', async function () {
        sinon.mock(GroupsHistory).expects('find').chain('exec').yields(new Error('Simulated Error.'));
        response = await agent.get('/api/logs/groups/').expect(422);
        expect(response.body.message).to.deep.equal('Simulated Error.');
      });

      it('should return an error message and status 500 when the GroupsHistory.findOne function fails', async function () {
        sinon.mock(GroupsHistory).expects('findOne').chain('exec').yields(new Error('Simulated Error'));
        response = await agent.get(`/api/logs/groups/${groupObject._id}`).expect(404);
        expect(response.body.message).to.deep.equal('An error occurred whilst trying to find a log: Internal Server Error.');
      });
    });

    describe('logs/labels', function () {
      it('should be able to get empty labels-log list', async function () {
        await LabelsHistory.remove().exec();
        response = await agent.get('/api/logs/labels').expect(200);
        response.body.should.be.instanceof(Array).and.have.lengthOf(0);
      });

      it('should be able to get labels-log list with one element', async function () {
        response = await agent.get('/api/logs/labels').expect(200);
        response.body.should.be.instanceof(Array).and.have.lengthOf(1);
        response.body[0].associated_id.should.equal(labelObject._id.toString());
      });

      it('should be able to get labels-log list with more than one element', async function () {
        secondValidLabel = _.cloneDeep(validLabel);
        secondValidLabel.name = 'tmpLabel2';
        secondLabelObject = new Label(secondValidLabel);
        await secondLabelObject.save();

        response = await agent.get('/api/logs/labels/').expect(200);
        response.body.should.be.instanceof(Array).and.have.lengthOf(2);
      });

      it('should be able to get a single label log', async function () {
        response = await agent.get(`/api/logs/labels/${labelObject._id}`).expect(200);
        response.body.associated_id.toString().should.deepEqual(labelObject._id.toString());
        response.body.originalData.name.should.equal(validLabel.name);
      });

      it('should throw 404 when label id is not in labels-log database', async function () {
        response = await agent.get('/api/logs/labels/000000000000000000000000').expect(404);
        response.body.message.should.equal('A labels log with that id does not exist. Ensure a correct labels id is entered and is not a log or legacy object id.');
      });

      it('should throw 404 when label id is invalid in the labels-log database', async function () {
        response = await agent.get('/api/logs/labels/0').expect(404);
        response.body.message.should.equal('A labels log with that id does not exist. Ensure a correct labels id is entered and is not a log or legacy object id.');
      });

      it('should return an error message and status 422 when the LabelsHistory.find function fails', async function () {
        sinon.mock(LabelsHistory).expects('find').chain('exec').yields(new Error('Simulated Error.'));
        response = await agent.get('/api/logs/labels/').expect(422);
        expect(response.body.message).to.deep.equal('Simulated Error.');
      });

      it('should return an error message and status 500 when the LabelsHistory.findOne function fails', async function () {
        sinon.mock(LabelsHistory).expects('findOne').chain('exec').yields(new Error('Simulated Error'));
        response = await agent.get(`/api/logs/labels/${labelObject._id}`).expect(404);
        expect(response.body.message).to.deep.equal('An error occurred whilst trying to find a log: Internal Server Error.');
      });
    });

    describe('logs/pods', function () {
      it('should be able to get empty pods-log list', async function () {
        await PodsHistory.remove().exec();
        response = await agent.get('/api/logs/pods').expect(200);
        response.body.should.be.instanceof(Array).and.have.lengthOf(0);
      });

      it('should be able to get pods-log list with one element', async function () {
        response = await agent.get('/api/logs/pods').expect(200);
        response.body.should.be.instanceof(Array).and.have.lengthOf(1);
        response.body[0].associated_id.should.equal(podObject._id.toString());
      });

      it('should be able to get pods-log list with more than one element', async function () {
        secondValidPod = _.cloneDeep(validPod);
        secondValidPod.name = 'tmpPod2';
        secondValidPod.authUrl = 'http://tmpPod2.com';
        secondPodObject = new Pod(secondValidPod);
        await secondPodObject.save();

        response = await agent.get('/api/logs/pods/').expect(200);
        response.body.should.be.instanceof(Array).and.have.lengthOf(2);
      });

      it('should be able to get a single pod log', async function () {
        response = await agent.get(`/api/logs/pods/${podObject._id}`).expect(200);
        response.body.associated_id.toString().should.deepEqual(podObject._id.toString());
        response.body.originalData.name.should.equal(validPod.name);
      });

      it('should throw 404 when pod id is not in pods-log database', async function () {
        response = await agent.get('/api/logs/pods/000000000000000000000000').expect(404);
        response.body.message.should.equal('A pods log with that id does not exist. Ensure a correct pods id is entered and is not a log or legacy object id.');
      });

      it('should throw 404 when pod id is invalid in the pods-log database', async function () {
        response = await agent.get('/api/logs/pods/0').expect(404);
        response.body.message.should.equal('A pods log with that id does not exist. Ensure a correct pods id is entered and is not a log or legacy object id.');
      });

      it('should return an error message and status 422 when the PodsHistory.find function fails', async function () {
        sinon.mock(PodsHistory).expects('find').chain('exec').yields(new Error('Simulated Error.'));
        response = await agent.get('/api/logs/pods/').expect(422);
        expect(response.body.message).to.deep.equal('Simulated Error.');
      });

      it('should return an error message and status 500 when the PodsHistory.findOne function fails', async function () {
        sinon.mock(PodsHistory).expects('findOne').chain('exec').yields(new Error('Simulated Error'));
        response = await agent.get(`/api/logs/pods/${podObject._id}`).expect(404);
        expect(response.body.message).to.deep.equal('An error occurred whilst trying to find a log: Internal Server Error.');
      });
    });

    describe('logs/projects', function () {
      it('should be able to get empty projects-log list', async function () {
        await ProjectsHistory.remove().exec();
        response = await agent.get('/api/logs/projects').expect(200);
        response.body.should.be.instanceof(Array).and.have.lengthOf(0);
      });

      it('should be able to get projects-log list with one element', async function () {
        response = await agent.get('/api/logs/projects').expect(200);
        response.body.should.be.instanceof(Array).and.have.lengthOf(1);
        response.body[0].associated_id.should.equal(projectObject._id.toString());
      });

      it('should be able to get projects-log list with more than one element', async function () {
        secondValidProject = _.cloneDeep(validProject);
        secondValidProject.name = 'TestProject2';
        secondProjectObject = new Project(secondValidProject);
        await secondProjectObject.save();

        response = await agent.get('/api/logs/projects/').expect(200);
        response.body.should.be.instanceof(Array).and.have.lengthOf(2);
      });

      it('should be able to get a single project log', async function () {
        response = await agent.get(`/api/logs/projects/${projectObject._id}`).expect(200);
        response.body.associated_id.toString().should.deepEqual(projectObject._id.toString());
        response.body.originalData.name.should.equal(validProject.name);
      });

      it('should throw 404 when project id is not in projects-log database', async function () {
        response = await agent.get('/api/logs/projects/000000000000000000000000').expect(404);
        response.body.message.should.equal('A projects log with that id does not exist. Ensure a correct projects id is entered and is not a log or legacy object id.');
      });

      it('should throw 404 when project id is invalid in the projects-log database', async function () {
        response = await agent.get('/api/logs/projects/0').expect(404);
        response.body.message.should.equal('A projects log with that id does not exist. Ensure a correct projects id is entered and is not a log or legacy object id.');
      });

      it('should return an error message and status 422 when the ProjectsHistory.find function fails', async function () {
        sinon.mock(ProjectsHistory).expects('find').chain('exec').yields(new Error('Simulated Error.'));
        response = await agent.get('/api/logs/projects/').expect(422);
        expect(response.body.message).to.deep.equal('Simulated Error.');
      });

      it('should return an error message and status 500 when the ProjectsHistory.findOne function fails', async function () {
        sinon.mock(ProjectsHistory).expects('findOne').chain('exec').yields(new Error('Simulated Error'));
        response = await agent.get(`/api/logs/projects/${projectObject._id}`).expect(404);
        expect(response.body.message).to.deep.equal('An error occurred whilst trying to find a log: Internal Server Error.');
      });
    });

    describe('logs/schemas', function () {
      it('should be able to get empty schemas-log list', async function () {
        await SchemasHistory.remove().exec();
        response = await agent.get('/api/logs/schemas').expect(200);
        response.body.should.be.instanceof(Array).and.have.lengthOf(0);
      });

      it('should be able to get schemas-log list with one element', async function () {
        response = await agent.get('/api/logs/schemas').expect(200);
        response.body.should.be.instanceof(Array).and.have.lengthOf(1);
        response.body[0].associated_id.should.equal(schemaObject._id.toString());
      });

      it('should be able to get schemas-log list with more than one element', async function () {
        secondValidSchema = _.cloneDeep(validSchema);
        secondValidSchema.name = 'TestSchema2';
        secondSchemaObject = new Schema(secondValidSchema);
        await secondSchemaObject.save();

        response = await agent.get('/api/logs/schemas/').expect(200);
        response.body.should.be.instanceof(Array).and.have.lengthOf(2);
      });

      it('should be able to get a single schema log', async function () {
        response = await agent.get(`/api/logs/schemas/${schemaObject._id}`).expect(200);
        response.body.associated_id.toString().should.deepEqual(schemaObject._id.toString());
        response.body.originalData.name.should.equal(validSchema.name);
      });

      it('should throw 404 when schema id is not in schemas-log database', async function () {
        response = await agent.get('/api/logs/schemas/000000000000000000000000').expect(404);
        response.body.message.should.equal('A schemas log with that id does not exist. Ensure a correct schemas id is entered and is not a log or legacy object id.');
      });

      it('should throw 404 when schema id is invalid in the schemas-log database', async function () {
        response = await agent.get('/api/logs/schemas/0').expect(404);
        response.body.message.should.equal('A schemas log with that id does not exist. Ensure a correct schemas id is entered and is not a log or legacy object id.');
      });

      it('should return an error message and status 422 when the SchemasHistory.find function fails', async function () {
        sinon.mock(SchemasHistory).expects('find').chain('exec').yields(new Error('Simulated Error.'));
        response = await agent.get('/api/logs/schemas/').expect(422);
        expect(response.body.message).to.deep.equal('Simulated Error.');
      });

      it('should return an error message and status 500 when the SchemasHistory.findOne function fails', async function () {
        sinon.mock(SchemasHistory).expects('findOne').chain('exec').yields(new Error('Simulated Error'));
        response = await agent.get(`/api/logs/schemas/${schemaObject._id}`).expect(404);
        expect(response.body.message).to.deep.equal('An error occurred whilst trying to find a log: Internal Server Error.');
      });
    });

    describe('logs/invalid_object', function () {
      it('should not be able to get a log list when querying an invalid object-type', async function () {
        response = await agent.get('/api/logs/invalid_object').expect(422);
        response.body.should.not.be.instanceof(Array);
        response.body.message.should.startWith('Logs are not available for object type: invalid_object.');
      });
    });
  });

  describe('SEARCH', function () {
    it('should not return a log when passing in a valid parameter with a non existent associated deployments ID', async function () {
      response = await agent.get('/api/logs/deployments?q=associated_id=000000000000000000000000').expect(200);
      response.body.length.should.equal(0);
    });

    it('should not return a log when passing in a valid parameter with a non existent parameter', async function () {
      response = await agent.get(`/api/logs/deployments?q=${encodeURIComponent('name=notExisting')}`).expect(200);
      response.body.length.should.equal(0);
    });

    it('should return an error when not encoding q search parameters', async function () {
      response = await agent.get(`/api/logs/deployments?q=.associated_id=${deploymentObject._id}&name=notExisting`).expect(422);
      response.body.message.should.equal('Improperly structured query. Make sure to use ?q=<key>=<value> syntax');
    });

    it('should return a single log when passing in a valid associated_id parameter', async function () {
      response = await agent.get(`/api/logs/deployments?q=associated_id=${deploymentObject._id}`).expect(200);
      response.body.length.should.equal(1);
      response.body[0].should.be.instanceof(Object);
      response.body[0].originalData.name.should.equal(deploymentObject.name);
      response.body[0].associated_id.should.equal(deploymentObject._id.toString());
    });

    it('should not return a log when passing in invalid parameter', async function () {
      response = await agent.get('/api/logs/deployments?q=n0nsense=123454321').expect(200);
      response.body.length.should.equal(0);
    });

    it('should return a single log when passing in name parameter', async function () {
      response = await agent.get(`/api/logs/deployments?q=originalData.name=${deploymentObject.name}`).expect(200);
      response.body.length.should.equal(1);
      response.body[0].should.be.instanceof(Object);
      response.body[0].originalData.name.should.equal(deploymentObject.name);
    });

    it('should only return fields specified in url', async function () {
      response = await agent.get('/api/logs/deployments?fields=associated_id').expect(200);
      response.body.length.should.equal(1);
      for (var key in response.body) {
        if (Object.prototype.hasOwnProperty.call(response.body, key)) {
          Object.prototype.hasOwnProperty.call(response.body[key], 'associated_id').should.equal(true);
        }
      }
    });

    it('should only return fields specified in url using fields and q functionality', async function () {
      response = await agent.get(`/api/logs/deployments?fields=associated_id&q=associated_id=${deploymentObject._id}`).expect(200);
      response.body.length.should.equal(1);
      Object.prototype.hasOwnProperty.call(response.body[0], 'associated_id').should.equal(true);
      response.body[0].associated_id.should.equal(deploymentObject._id.toString());
    });

    it('should only return nested fields specified in url', async function () {
      response = await agent.get('/api/logs/deployments?fields=originalData(name)').expect(200);
      response.body.length.should.equal(1);
      Object.prototype.hasOwnProperty.call(response.body[0], 'originalData').should.equal(true);
      Object.prototype.hasOwnProperty.call(response.body[0].originalData, 'name').should.equal(true);
      response.body[0].originalData.name.should.equal(deploymentObject.name);
    });

    it('should return an error message when query has invalid search key blah', async function () {
      response = await agent.get(`/api/logs/deployments?q=name=${deploymentObject.name}&fields=name&blah=blah`).expect(422);
      response.body.message.should.equal('Improperly structured query. Make sure to use ?q=<key>=<value> syntax');
    });

    it('should return an error message when queried with an improper search', async function () {
      response = await agent.get(`/api/logs/deployments?name=${deploymentObject.name}`).expect(422);
      response.body.message.should.equal('Improperly structured query. Make sure to use ?q=<key>=<value> syntax');
    });

    it('should return an error message when queried with an empty q=', async function () {
      response = await agent.get('/api/logs/deployments?q=').expect(422);
      response.body.message.should.equal('Improperly structured query. Make sure to use ?q=<key>=<value> syntax');
    });

    it('should return an error message when queried with an empty fields=', async function () {
      response = await agent.get('/api/logs/deployments?fields=').expect(422);
      response.body.message.should.equal('Improperly structured query. Make sure to use ?q=<key>=<value> syntax');
    });

    it('should return an error message when queried with an empty fields= and q=', async function () {
      response = await agent.get('/api/logs/deployments?q=&fields=').expect(422);
      response.body.message.should.equal('Improperly structured query. Make sure to use ?q=<key>=<value> syntax');
    });
  });

  afterEach(async function () {
    sinon.restore();
    await User.remove().exec();
    await Group.remove().exec();
    await Label.remove().exec();
    await Pod.remove().exec();
    await Schema.remove().exec();
    await Project.remove().exec();
    await Document.remove().exec();
    await Deployment.remove().exec();
    await DeploymentsHistory.remove().exec();
    await DocumentsHistory.remove().exec();
    await GroupsHistory.remove().exec();
    await LabelsHistory.remove().exec();
    await PodsHistory.remove().exec();
    await ProjectsHistory.remove().exec();
    await SchemasHistory.remove().exec();
  });
});
