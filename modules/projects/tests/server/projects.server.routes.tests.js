'use strict';

var fs = require('fs'),
  should = require('should'),
  superagentDefaults = require('superagent-defaults'),
  supertest = require('supertest'),
  mongoose = require('mongoose'),
  _ = require('lodash'),
  History = require('../../../history/server/models/history.server.model').getSchema('projects'),
  Schema = mongoose.model('Schema'),
  Document = mongoose.model('Document'),
  Project = mongoose.model('Project'),
  Pod = mongoose.model('Pod'),
  Deployment = mongoose.model('Deployment'),
  Group = mongoose.model('Group'),
  User = mongoose.model('User'),
  express = require('../../../../config/lib/express');

var app,
  agent,
  nonAuthAgent,
  validSchema,
  schema,
  EnmSedSchemaObject,
  enmSedSchemaObjectReturned,
  documentResponse,
  schemaReturned,
  validDocument,
  validEnmSedDocument,
  validProject,
  enmSedSchema,
  validPod,
  pod,
  ipv4Pod,
  validIpv4OnlyPod,
  secondPod,
  secondPodObject,
  secondPodReturned,
  validExclusionPod,
  project,
  projectObject,
  projectReturned,
  validIpv4OnlyProject,
  validExclusionProject,
  _projectUpdated,
  projectResponse,
  secondProject,
  secondProjectObject,
  badProject,
  badProjectReturned,
  validDeployment,
  deployment,
  count,
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
  groupReturned;

var nodeEnv = process.env.NODE_ENV;

describe('Projects', function () {
  before(async function () {
    app = express.init(mongoose);
    nonAuthAgent = superagentDefaults(supertest.agent(app));
    agent = superagentDefaults(supertest.agent(app));
  });
  beforeEach(async function () {
    validEnmSedDocument = JSON.parse(fs.readFileSync('/opt/mean.js/modules/projects/tests/server/test_files/valid_enm_sed_document.json', 'utf8'));
    validProject = JSON.parse(fs.readFileSync('/opt/mean.js/modules/projects/tests/server/test_files/valid_project.json', 'utf8'));
    validIpv4OnlyPod = JSON.parse(fs.readFileSync('/opt/mean.js/modules/projects/tests/server/test_files/valid_ipv4_only_pod.json', 'utf8'));
    enmSedSchema = JSON.parse(fs.readFileSync('/opt/mean.js/modules/projects/tests/server/test_files/enm_sed_schema.json', 'utf8'));
    validPod = JSON.parse(fs.readFileSync('/opt/mean.js/modules/projects/tests/server/test_files/valid_pod.json', 'utf8'));
    validSchema = JSON.parse(fs.readFileSync('/opt/mean.js/modules/projects/tests/server/test_files/valid_schema.json', 'utf8'));
    validDocument = JSON.parse(fs.readFileSync('/opt/mean.js/modules/projects/tests/server/test_files/valid_document.json', 'utf8'));
    validIpv4OnlyProject = JSON.parse(fs.readFileSync('/opt/mean.js/modules/projects/tests/server/test_files/valid_ipv4_only_project.json', 'utf8'));
    validExclusionPod = JSON.parse(fs.readFileSync('/opt/mean.js/modules/projects/tests/server/test_files/valid_exclusion_pod.json', 'utf8'));
    validDeployment = JSON.parse(fs.readFileSync('/opt/mean.js/modules/projects/tests/server/test_files/valid_deployment.json', 'utf8'));
    validExclusionProject = JSON.parse(fs.readFileSync('/opt/mean.js/modules/projects/tests/server/test_files/valid_exclusion_project.json', 'utf8'));
    validUser = JSON.parse(fs.readFileSync('/opt/mean.js/modules/deployments/tests/server/test_files/valid_user.json', 'utf8'));
    validUser2 = JSON.parse(fs.readFileSync('/opt/mean.js/modules/deployments/tests/server/test_files/valid_user2.json', 'utf8'));
    validUser3 = JSON.parse(fs.readFileSync('/opt/mean.js/modules/deployments/tests/server/test_files/valid_user3.json', 'utf8'));

    pod = new Pod(validPod);
    await pod.save();
    validProject.pod_id = pod._id;
    validIpv4OnlyProject.pod_id = pod._id;

    ipv4Pod = new Pod(validIpv4OnlyPod);
    await ipv4Pod.save();

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
    it('should not create a new Project when user is not authenticated', async function () {
      response = await nonAuthAgent.post('/api/projects').send(validProject).expect(401);
      response.body.message.should.equal('User must be logged in');
    });

    it('should create a new project and check db', async function () {
      response = await agent.post('/api/projects').send(validProject).expect(201);
      response.body._id.should.have.length(24);
      response.headers.location.should.equal(`/api/projects/${response.body._id}`);
      response.body.name.should.equal(validProject.name);
      response.body.id.should.equal(validProject.id);
      projectReturned = await Project.findById(response.body._id).exec();
      projectReturned.name.should.equal(validProject.name);
      projectReturned.id.should.equal(validProject.id);
    });

    it('should not create a project with extra fields not outlined in its model.', async function () {
      badProject = _.cloneDeep(validProject);
      badProject.newkey = 12123;
      response = await agent.post('/api/projects').send(badProject).expect(400);
      response.body.message.should.equal('Field `newkey` is not in schema and strict mode is set to throw.');
    });

    it('should not be able to create a new project with valid pod_id that doesn\'t exist', async function () {
      validProject.pod_id = '000000000000000000000000';
      response = await agent.post('/api/projects').send(validProject).expect(422);
      response.body.message.should.equal(`The given pod id ${validProject.pod_id} could not be found`);
    });

    it('should not be able to create a new project with an invalid pod_id', async function () {
      validProject.pod_id = 'this_is_so_completely_invalid';
      response = await agent.post('/api/projects').send(validProject).expect(400);
      response.body.message.should.equal('Cast to ObjectID failed for value "this_is_so_completely_invalid" at path "pod_id"');
    });

    it('should not allow project without a name', async function () {
      badProject = _.cloneDeep(validProject);
      delete badProject.name;
      response = await agent.post('/api/projects').send(badProject).expect(400);
      response.body.message.should.equal('Path `name` is required.');
    });

    it('should not allow a project with no id', async function () {
      badProject = _.cloneDeep(validProject);
      delete badProject.id;
      response = await agent.post('/api/projects').send(badProject).expect(400);
      response.body.message.should.equal('Path `id` is required.');
    });

    it('should not allow a project with a non-alphanumeric-underscored name', async function () {
      badProject = _.cloneDeep(validProject);
      badProject.name = '!£$%&';
      response = await agent.post('/api/projects').send(badProject).expect(400);
      response.body.message.should.equal('name is not valid; \'!£$%&\' can only contain letters, numbers, dots, dashes and underscores.');
    });

    it('should not allow a project with no username', async function () {
      badProject = _.cloneDeep(validProject);
      delete badProject.username;
      response = await agent.post('/api/projects').send(badProject).expect(400);
      response.body.message.should.equal('Path `username` is required.');
    });

    it('should not allow a project with no password', async function () {
      badProject = _.cloneDeep(validProject);
      delete badProject.password;
      response = await agent.post('/api/projects').send(badProject).expect(400);
      response.body.message.should.equal('Path `password` is required.');
    });

    it('should respond with bad request with invalid json', async function () {
      badProject = '{';
      response = await agent.post('/api/projects').send(badProject).type('json').expect(400);
      response.body.message.should.equal('There was a syntax error found in your request, please make sure that it is valid and try again');
    });

    it('should not allow to post in a project that already exists in the same pod.', async function () {
      secondProject = _.cloneDeep(validProject);
      secondProject.id = 'temporary';
      project = new Project(secondProject);
      projectReturned = await project.save();
      response = await agent.post('/api/projects').send(validProject).expect(400);
      response.body.message.should.equal('Error, one of the following pairs are not unique. (Project Name and Pod) or (Project Name and Openstack Project Id)');
    });

    it('should not allow to post in a project that is using a Openstack project id that is already in use.', async function () {
      secondPod = _.cloneDeep(validPod);
      secondPod.name = 'Pod_B';
      secondPod.authUrl = 'http://www.pod_b.com';
      secondPodObject = new Pod(secondPod);
      secondPodReturned = await secondPodObject.save();
      secondProject = _.cloneDeep(validProject);
      secondProject.pod_id = secondPodReturned._id;
      project = new Project(secondProject);
      projectReturned = await project.save();
      response = await agent.post('/api/projects').send(validProject).expect(400);
      response.body.message.should.equal('Error, one of the following pairs are not unique. (Project Name and Pod) or (Project Name and Openstack Project Id)');
    });

    it('should allow to add project to a group', async function () {
      process.env.NODE_ENV = 'policyCheckEnabled';
      validProject.usergroups = [groupReturned._id.toString()];
      response = await agent.post('/api/projects').auth(validUser.username, validUser.password).send(validProject).expect(201);
      groupReturned = await Group.findById(groupReturned._id).exec();
      groupReturned.associatedProjects[0].toString().should.deepEqual(response.body._id.toString());
      process.env.NODE_ENV = nodeEnv;
    });

    it('should allow to add project from a group, when user is superAdmin', async function () {
      process.env.NODE_ENV = 'policyCheckEnabled';
      validProject.usergroups = [groupReturned._id.toString()];
      response = await agent.post('/api/projects').auth(validUser3.username, validUser3.password).send(validProject).expect(201);
      groupReturned = await Group.findById(groupReturned._id).exec();
      groupReturned.associatedProjects[0].toString().should.deepEqual(response.body._id.toString());
      process.env.NODE_ENV = nodeEnv;
    });

    it('should not allow to add same group twice', async function () {
      process.env.NODE_ENV = 'policyCheckEnabled';
      validProject.usergroups = [groupReturned._id.toString(), groupReturned._id.toString()];
      response = await agent.post('/api/projects').auth(validUser.username, validUser.password).send(validProject).expect(422);
      response.body.message.should.equal('You cannot attach the same group twice');
      process.env.NODE_ENV = nodeEnv;
    });

    it('should not allow to add project to group, when user is not in that group', async function () {
      process.env.NODE_ENV = 'policyCheckEnabled';
      validProject.usergroups = [groupReturned._id.toString()];
      response = await agent.post('/api/projects').auth(validUser2.username, validUser2.password).send(validProject).expect(422);
      response.body.message.should.equal(`You cannot attach group ${groupReturned._id.toString()}, you are not in this group`);
      process.env.NODE_ENV = nodeEnv;
    });

    it('should respond with bad request when a network with no name is given', async function () {
      badProject = _.cloneDeep(validProject);
      delete badProject.network.name;
      response = await agent.post('/api/projects').send(badProject).type('json').expect(400);
      response.body.message.should.equal('Path `network.name` is required.');
    });

    it('should not allow a network with an unknown name', async function () {
      badProject = _.cloneDeep(validProject);
      badProject.network.name = 'unknown';
      response = await agent.post('/api/projects').send(badProject).type('json').expect(422);
      response.body.message.should.equal('The network name given \'unknown\' was not found within the given pod');
    });

    it('should respond with bad request when a network with no ipv4_ranges key is given', async function () {
      badProject = _.cloneDeep(validProject);
      delete badProject.network.ipv4_ranges;
      response = await agent.post('/api/projects').send(badProject).type('json').expect(400);
      response.body.message.should.equal('Path `network.ipv4_ranges` is required.');
    });

    it('should respond with bad request when a network with no ipv4_ranges are given', async function () {
      badProject = _.cloneDeep(validProject);
      badProject.network.ipv4_ranges = [];
      response = await agent.post('/api/projects').send(badProject).type('json').expect(400);
      response.body.message.should.equal('Path `network.ipv4_ranges` is required.');
    });

    it('should respond with bad request when a network with no ipv4_range start key is given', async function () {
      badProject = _.cloneDeep(validProject);
      delete badProject.network.ipv4_ranges[0].start;
      response = await agent.post('/api/projects').send(badProject).type('json').expect(400);
      response.body.message.should.equal('Path `start` is required.');
    });

    it('should respond with bad request when a network with no ipv4_range end key is given', async function () {
      badProject = _.cloneDeep(validProject);
      delete badProject.network.ipv4_ranges[0].end;
      response = await agent.post('/api/projects').send(badProject).type('json').expect(400);
      response.body.message.should.equal('Path `end` is required.');
    });

    it('should respond with bad request when an invalid ipv4_range start ip is given', async function () {
      badProject = _.cloneDeep(validProject);
      badProject.network.ipv4_ranges[0].start = 'invalid';
      response = await agent.post('/api/projects').send(badProject).type('json').expect(400);
      response.body.message.should.equal(`network.ipv4_ranges.start must be a valid IPv4 address. \
${badProject.network.ipv4_ranges[0].start} is not valid.`);
    });

    it('should respond with bad request when an invalid ipv4_range end ip is given', async function () {
      badProject = _.cloneDeep(validProject);
      badProject.network.ipv4_ranges[0].end = 'invalid';
      response = await agent.post('/api/projects').send(badProject).type('json').expect(400);
      response.body.message.should.equal(`network.ipv4_ranges.end must be a valid IPv4 address. \
${badProject.network.ipv4_ranges[0].end} is not valid.`);
    });

    it('should respond with bad request when an invalid ipv6_range start ip is given', async function () {
      badProject = _.cloneDeep(validProject);
      badProject.network.ipv6_ranges[0].start = 'invalid';
      response = await agent.post('/api/projects').send(badProject).type('json').expect(400);
      response.body.message.should.equal(`network.ipv6_ranges.start must be a valid IPv6 address. \
${badProject.network.ipv6_ranges[0].start} is not valid.`);
    });

    it('should respond with bad request when an invalid ipv6_range end ip is given', async function () {
      badProject = _.cloneDeep(validProject);
      badProject.network.ipv6_ranges[0].end = 'invalid';
      response = await agent.post('/api/projects').send(badProject).type('json').expect(400);
      response.body.message.should.equal(`network.ipv6_ranges.end must be a valid IPv6 address. \
${badProject.network.ipv6_ranges[0].end} is not valid.`);
    });

    it('should respond with bad request when the ipv4 start is not within the cidr', async function () {
      badProject = _.cloneDeep(validProject);
      badProject.network.ipv4_ranges[0].start = '1.1.1.1';
      response = await agent.post('/api/projects').send(badProject).type('json').expect(422);
      response.body.message.should.equal(`The IPv4 range start ip given ${badProject.network.ipv4_ranges[0].start} is not \
valid within the pod network CIDR ${validPod.networks[0].ipv4_subnet.cidr}`);
    });

    it('should respond with bad request when the ipv4 end is not within the cidr', async function () {
      badProject = _.cloneDeep(validProject);
      badProject.network.ipv4_ranges[0].end = '1.1.1.1';
      response = await agent.post('/api/projects').send(badProject).type('json').expect(422);
      response.body.message.should.equal(`The IPv4 range end ip given ${badProject.network.ipv4_ranges[0].end} is not \
valid within the pod network CIDR ${validPod.networks[0].ipv4_subnet.cidr}`);
    });

    it('should respond with bad request when the ipv4 range overlaps with the gateway address', async function () {
      badProject = _.cloneDeep(validProject);
      badProject.network.ipv4_ranges[0].start = validPod.networks[0].ipv4_subnet.gateway_ip;
      response = await agent.post('/api/projects').send(badProject).type('json').expect(422);
      response.body.message.should.equal(`The IPv4 range (${badProject.network.ipv4_ranges[0].start} - ${badProject.network.ipv4_ranges[0].end}) \
is invalid as it would make use of the gateway IP ${validPod.networks[0].ipv4_subnet.gateway_ip}`);
    });

    it('should respond with bad request when the ipv4 start address is after the ipv4 end address', async function () {
      badProject = _.cloneDeep(validProject);
      badProject.network.ipv4_ranges[0].end = '131.160.202.9';
      response = await agent.post('/api/projects').send(badProject).type('json').expect(422);
      response.body.message.should.equal(`The IPv4 range start ip ${badProject.network.ipv4_ranges[0].start} must come \
before the end ip ${badProject.network.ipv4_ranges[0].end}`);
    });

    it('should respond with bad request when ipv4 ranges in the current project overlap', async function () {
      badProject = _.cloneDeep(validProject);
      badProject.network.ipv4_ranges.push({
        start: '131.160.202.30',
        end: '131.160.202.40'
      });
      badProject.network.ipv4_ranges.push({
        start: '131.160.202.35',
        end: '131.160.202.45'
      });
      response = await agent.post('/api/projects').send(badProject).type('json').expect(422);
      response.body.message.should.equal(`Range (131.160.202.35 - 131.160.202.45) from project '${validProject.name}' overlaps with another range \
(131.160.202.30 - 131.160.202.40) from project '${validProject.name}'`);
    });

    it('should respond with bad request when ipv6 ranges in the current project overlap', async function () {
      badProject = _.cloneDeep(validProject);
      badProject.network.ipv6_ranges.push({
        start: '2001:1b70:6207:0027:0000:0874:1001:0000',
        end: '2001:1b70:6207:0027:0000:0874:1002:ffff'
      });
      response = await agent.post('/api/projects').send(badProject).type('json').expect(422);
      response.body.message.should.equal(`Range (2001:1B70:6207:0027:0000:0874:1001:0000 - 2001:1B70:6207:0027:0000:0874:1001:ffff) from project \
'${validProject.name}' overlaps with another range (2001:1b70:6207:0027:0000:0874:1001:0000 - \
2001:1b70:6207:0027:0000:0874:1002:ffff) from project '${validProject.name}'`);
    });

    it('should respond with bad request when ipv4 ranges in different projects overlap', async function () {
      validProject.network.ipv4_ranges.push({
        start: '131.160.202.30',
        end: '131.160.202.40'
      });
      validProject.network.ipv4_ranges.push({
        start: '131.160.202.41',
        end: '131.160.202.50'
      });
      response = await agent.post('/api/projects').send(validProject).type('json').expect(201);
      badProject = _.cloneDeep(validProject);
      badProject.name = 'secondProject';
      badProject.network.ipv4_ranges = [];
      badProject.network.ipv4_ranges.push({
        start: '131.160.202.45',
        end: '131.160.202.60'
      });
      response = await agent.post('/api/projects').send(badProject).type('json').expect(422);
      response.body.message.should.equal(`Range (131.160.202.45 - 131.160.202.60) from project '${badProject.name}' overlaps with another range \
(131.160.202.41 - 131.160.202.50) from project '${validProject.name}'`);
    });

    it('should allow a project to be save when a different project has no ipv6 ranges', async function () {
      response = await agent.post('/api/projects').send(validIpv4OnlyProject).type('json').expect(201);
      response = await agent.post('/api/projects').send(validProject).type('json').expect(201);
      response.body._id.should.have.length(24);
      response.headers.location.should.equal(`/api/projects/${response.body._id}`);
      response.body.name.should.equal(validProject.name);
      response.body.id.should.equal(validProject.id);
      projectReturned = await Project.findById(response.body._id).exec();
      projectReturned.name.should.equal(validProject.name);
      projectReturned.id.should.equal(validProject.id);
    });

    it('should not allow a project to be save when pod has no ipv6 subnet', async function () {
      badProject = _.cloneDeep(validProject);
      badProject.pod_id = ipv4Pod._id;
      badProject.network.name = 'provider_network_v4';
      badProject.network.ipv4_ranges = [];
      badProject.network.ipv4_ranges.push({
        start: '131.160.203.5',
        end: '131.160.203.25'
      });
      response = await agent.post('/api/projects').send(badProject).type('json').expect(422);
      response.body.message.should.containEql('IPv6 Subnet within the given Pod');
    });

    it('should respond with bad request when ipv6 ranges in different projects overlap', async function () {
      badProject = _.cloneDeep(validProject);
      badProject.network.ipv6_ranges.push({
        start: '2001:1b70:6207:0027:0000:0874:1001:0000',
        end: '2001:1b70:6207:0027:0000:0874:1001:ffff'
      });
      response = await agent.post('/api/projects').send(validProject).type('json').expect(201);
      badProject = _.cloneDeep(validProject);
      badProject.name = 'secondProject';
      badProject.network.ipv4_ranges = [];
      badProject.network.ipv4_ranges.push({
        start: '131.160.202.99',
        end: '131.160.202.99'
      });
      badProject.network.ipv6_ranges = [];
      badProject.network.ipv6_ranges.push({
        start: '2001:1b70:6207:0027:0000:0874:1001:0000',
        end: '2001:1b70:6207:0027:0000:0874:1001:ffff'
      });
      response = await agent.post('/api/projects').send(badProject).type('json').expect(422);
      response.body.message.should.equal(`Range (2001:1B70:6207:0027:0000:0874:1001:0000 - 2001:1B70:6207:0027:0000:0874:1001:ffff) from project \
'${validProject.name}' overlaps with another range (2001:1b70:6207:0027:0000:0874:1001:0000 - \
2001:1b70:6207:0027:0000:0874:1001:ffff) from project '${badProject.name}'`);
    });

    it('should post a new log with user-details when a project is created by a logged-in user', async function () {
      response = await agent.post('/api/projects').auth(validUser.username, validUser.password).send(validProject).expect(201);
      response.body._id.should.have.length(24);
      response.headers.location.should.equal(`/api/projects/${response.body._id}`);
      response.body.name.should.equal(validProject.name);
      response.body.id.should.equal(validProject.id);
      projectReturned = await Project.findById(response.body._id).exec();
      projectReturned.name.should.equal(validProject.name);
      projectReturned.id.should.equal(validProject.id);

      logReturned = await History.findOne({ associated_id: response.body._id }).exec();
      logReturned.originalData.should.not.equal(undefined);
      logReturned.originalData.name.should.equal(validProject.name);
      logReturned.createdAt.should.not.equal(undefined);
      logReturned.createdBy.should.not.equal(undefined);
      logReturned.createdBy.username.should.equal(validUser.username);
      logReturned.createdBy.email.should.equal(validUser.email);
      logReturned.updates.should.be.instanceof(Array).and.have.lengthOf(0);
    });

    it('should not post a new log for a project that is created with a name beginning with \'A_Health_\'', async function () {
      var validProjectHealth = _.cloneDeep(validProject);
      validProjectHealth.name = 'A_Health_Project';
      response = await agent.post('/api/projects').send(validProjectHealth).expect(201);
      response.body._id.should.have.length(24);
      response.headers.location.should.equal(`/api/projects/${response.body._id}`);
      response.body.name.should.equal(validProjectHealth.name);

      projectReturned = await Project.findById(response.body._id).exec();
      projectReturned.name.should.equal(validProjectHealth.name);

      logReturned = await History.findOne({ associated_id: response.body._id }).exec();
      should.not.exist(logReturned);
    });
  });

  describe('GET', function () {
    beforeEach(async function () {
      project = new Project(validProject);
      await project.save();
    });

    it('should be able to get projects when user not authenticated', async function () {
      await nonAuthAgent.get('/api/projects').expect(200);
    });

    it('should be able to get empty project list', async function () {
      await project.remove();
      response = await agent.get('/api/projects').expect(200);
      response.body.should.be.instanceof(Array).and.have.lengthOf(0);
    });

    it('should be able to get project list with one element', async function () {
      response = await agent.get('/api/projects').expect(200);
      response.body.should.be.instanceof(Array).and.have.lengthOf(1);
      response.body[0].pod_id.should.be.equal(pod._id.toString());
    });

    it('should be able to get project list with more than one element', async function () {
      _projectUpdated = _.cloneDeep(validProject);
      _projectUpdated.name = 'testProject';
      secondPodObject = new Project(_projectUpdated);
      await secondPodObject.save();
      response = await agent.get('/api/projects').expect(200);
      response.body.should.be.instanceof(Array).and.have.lengthOf(2);
    });

    it('should be able to get a single project', async function () {
      response = await agent.get(`/api/projects/${project._id}`).expect(200);
      response.body.name.should.equal(validProject.name);
      response.body._id.should.equal(project._id.toString());
    });

    it('should throw 404 when id is not in database', async function () {
      response = await agent.get('/api/projects/000000000000000000000000').expect(404);
      response.body.message.should.equal('A project with that id does not exist');
    });

    it('should throw 404 when id is invalid in the database', async function () {
      response = await agent.get('/api/projects/0').expect(404);
      response.body.message.should.equal('A project with that id does not exist');
    });
  });

  describe('PUT', function () {
    beforeEach(async function () {
      project = new Project(validProject);
      await project.save();
    });

    it('should not update a Project when user is not authenticated', async function () {
      _projectUpdated = { name: 'updated_name' };
      response = await nonAuthAgent.put(`/api/projects/${project._id}`).send(_projectUpdated).expect(401);
      response.body.message.should.equal('User must be logged in');
    });

    it('should return the updated project after update and check db', async function () {
      _projectUpdated = _.cloneDeep(validProject);
      _projectUpdated.name = 'updated_name';
      _projectUpdated.id = '0123456879';
      _projectUpdated.username = 'esignum';
      _projectUpdated.password = 'TmpPassword';
      response = await agent.put(`/api/projects/${project._id}`).send(_projectUpdated).expect(200);
      response.body._id.should.have.length(24);
      response.body.name.should.equal(_projectUpdated.name);
      response.body.id.should.equal(_projectUpdated.id);
      response.body.username.should.equal(_projectUpdated.username);
      response.body.password.should.equal(_projectUpdated.password);
      projectReturned = await Project.findById(project._id).exec();
      projectReturned.name.should.equal(_projectUpdated.name);
      projectReturned.id.should.equal(_projectUpdated.id);
      projectReturned.username.should.equal(_projectUpdated.username);
      projectReturned.password.should.equal(_projectUpdated.password);
    });

    it('should allow update of just one valid field', async function () {
      _projectUpdated = { name: 'updated_name' };
      response = await agent.put(`/api/projects/${project._id}`).send(_projectUpdated).expect(200);
      response.body.name.should.equal(_projectUpdated.name);
      projectReturned = await Project.findById(project._id).exec();
      projectReturned.name.should.equal(_projectUpdated.name);
    });

    it('should not allow update with a invalid field', async function () {
      _projectUpdated = _.cloneDeep(validProject);
      _projectUpdated.testkey = 12345;
      response = await agent.put(`/api/projects/${project._id}`).send(_projectUpdated).expect(400);
      response.body.message.should.containEql('Field `testkey` is not in schema and strict mode is set to throw.');
      response = await Project.findById(project._id).exec();
      should.not.exist(response.testkey);
    });

    it('should respond with bad update request when using invalid json', async function () {
      badProject = '{';
      response = await agent.put(`/api/projects/${project._id}`).send(badProject).type('json').expect(400);
      response.body.message.should.containEql('There was a syntax error found in your request, please make sure that it is valid and try again');
    });

    it('should not allow a project to update with a pod that doesnt exist', async function () {
      _projectUpdated = _.cloneDeep(validProject);
      _projectUpdated.pod_id = '000000000000000000000000';
      response = await agent.put(`/api/projects/${project._id}`).send(_projectUpdated).expect(422);
      response.body.message.should.containEql(`The given pod id ${_projectUpdated.pod_id} could not be found`);
    });

    it('should fail to update Project with deployment using ip addresses from ENM SED as Exclusion ip addresses', async function () {
      EnmSedSchemaObject = new Schema(enmSedSchema);
      enmSedSchemaObjectReturned = await EnmSedSchemaObject.save();
      validEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      documentResponse = await agent.post('/api/documents/').send(validEnmSedDocument).expect(201);
      validDeployment.enm.sed_id = documentResponse.body._id;
      pod = new Pod(validExclusionPod);
      await pod.save();
      validExclusionProject.pod_id = pod._id;
      projectObject = new Project(validExclusionProject);
      projectReturned = await projectObject.save();
      validDeployment.project_id = projectReturned._id;
      deployment = new Deployment(validDeployment);
      await deployment.save();
      response = await agent.put(`/api/projects/${projectReturned._id}`).send(validExclusionProject).expect(422);
      response.body.message.should.containEql('fd5b:1fd5:8295:5339:0000:0000:0000:0005 cannot be added to exclusion IPs as they are already part of ENM SED');
    });

    it('should not allow to update a project to have the same name as a project that already exists in the same pod.', async function () {
      secondProject = _.cloneDeep(validProject);
      secondProject.name = 'secondProject';
      secondProject.id = 'temporaryValue1';
      secondProjectObject = new Project(secondProject);
      await secondProjectObject.save();
      _projectUpdated = _.cloneDeep(validProject);
      _projectUpdated.name = secondProject.name;
      _projectUpdated.id = 'temporaryValue2';
      response = await agent.put(`/api/projects/${project._id}`).send(_projectUpdated).expect(400);
      response.body.message.should.containEql('Error, one of the following pairs are not unique. (Project Name and Pod) or (Project Name and Openstack Project Id)');
    });

    it('should not allow to update a project with a Openstack project id that is already in use.', async function () {
      secondPod = _.cloneDeep(validPod);
      secondPod.name = 'SecondPod';
      secondPod.authUrl = 'http://www.pod_b.com';
      secondPodObject = new Pod(secondPod);
      secondPodReturned = await secondPodObject.save();
      secondProject = _.cloneDeep(validProject);
      secondProject.name = 'SecondProject';
      secondProject.id = 'anotherValidId';
      secondProject.pod_id = secondPodReturned._id;
      secondProjectObject = new Project(secondProject);
      await secondProjectObject.save();
      _projectUpdated = _.cloneDeep(validProject);
      _projectUpdated.name = secondProject.name;
      _projectUpdated.id = secondProject.id;
      response = await agent.put(`/api/projects/${project._id}`).send(_projectUpdated).expect(400);
      response.body.message.should.containEql('Error, one of the following pairs are not unique. (Project Name and Pod) or (Project Name and Openstack Project Id)');
    });

    it('should not update when an empty network is given', async function () {
      badProject = {};
      badProject.network = {};
      response = await agent.put(`/api/projects/${project._id}`).send(badProject).type('json').expect(400);
      response.body.message.should.containEql('Path `network.name` is required.');
    });

    it('should not update when a network with no name is given', async function () {
      badProject = _.cloneDeep(validProject);
      delete badProject.network.name;
      response = await agent.put(`/api/projects/${project._id}`).send(badProject).type('json').expect(400);
      response.body.message.should.containEql('Path `network.name` is required.');
    });

    it('should not update when a network with no ipv4_ranges key is given', async function () {
      badProject = _.cloneDeep(validProject);
      delete badProject.network.ipv4_ranges;
      response = await agent.put(`/api/projects/${project._id}`).send(badProject).type('json').expect(400);
      response.body.message.should.containEql('Path `network.ipv4_ranges` is required.');
    });

    it('should not update when a network with no ipv4_ranges are given', async function () {
      badProject = _.cloneDeep(validProject);
      badProject.network.ipv4_ranges = [];
      response = await agent.put(`/api/projects/${project._id}`).send(badProject).type('json').expect(400);
      response.body.message.should.containEql('Path `network.ipv4_ranges` is required.');
    });

    it('should not update when a network with no ipv4_range start key is given', async function () {
      badProject = _.cloneDeep(validProject);
      delete badProject.network.ipv4_ranges[0].start;
      response = await agent.put(`/api/projects/${project._id}`).send(badProject).type('json').expect(400);
      response.body.message.should.containEql('Path `start` is required.');
    });

    it('should not update when a network with no ipv4_range end key is given', async function () {
      badProject = _.cloneDeep(validProject);
      delete badProject.network.ipv4_ranges[0].end;
      response = await agent.put(`/api/projects/${project._id}`).send(badProject).type('json').expect(400);
      response.body.message.should.containEql('Path `end` is required.');
    });

    it('should not update when an invalid ipv4_range start ip is given', async function () {
      badProject = _.cloneDeep(validProject);
      badProject.network.ipv4_ranges[0].start = 'invalid';
      response = await agent.put(`/api/projects/${project._id}`).send(badProject).type('json').expect(400);
      response.body.message.should.containEql(`network.ipv4_ranges.start must be a valid IPv4 address. \
${badProject.network.ipv4_ranges[0].start} is not valid.`);
    });

    it('should not update when an invalid ipv4_range end ip is given', async function () {
      badProject = _.cloneDeep(validProject);
      badProject.network.ipv4_ranges[0].end = 'invalid';
      response = await agent.put(`/api/projects/${project._id}`).send(badProject).type('json').expect(400);
      response.body.message.should.containEql(`network.ipv4_ranges.end must be a valid IPv4 address. \
${badProject.network.ipv4_ranges[0].end} is not valid.`);
    });

    it('should not update when an invalid ipv6_range start ip is given', async function () {
      badProject = _.cloneDeep(validProject);
      badProject.network.ipv6_ranges[0].start = 'invalid';
      response = await agent.put(`/api/projects/${project._id}`).send(badProject).type('json').expect(400);
      response.body.message.should.containEql(`network.ipv6_ranges.start must be a valid IPv6 address. \
${badProject.network.ipv6_ranges[0].start} is not valid.`);
    });

    it('should not update when an invalid ipv6_range end ip is given', async function () {
      badProject = _.cloneDeep(validProject);
      badProject.network.ipv6_ranges[0].end = 'invalid';
      response = await agent.put(`/api/projects/${project._id}`).send(badProject).type('json').expect(400);
      response.body.message.should.containEql(`network.ipv6_ranges.end must be a valid IPv6 address. \
${badProject.network.ipv6_ranges[0].end} is not valid.`);
    });

    it('should not update when the ipv4 start is not within the cidr', async function () {
      badProject = _.cloneDeep(validProject);
      badProject.network.ipv4_ranges[0].start = '1.1.1.1';
      response = await agent.put(`/api/projects/${project._id}`).send(badProject).type('json').expect(422);
      response.body.message.should.containEql(`The IPv4 range start ip given ${badProject.network.ipv4_ranges[0].start} is not \
valid within the pod network CIDR ${validPod.networks[0].ipv4_subnet.cidr}`);
    });

    it('should not update when the ipv4 end is not within the cidr', async function () {
      badProject = _.cloneDeep(validProject);
      badProject.network.ipv4_ranges[0].end = '1.1.1.1';
      response = await agent.put(`/api/projects/${project._id}`).send(badProject).type('json').expect(422);
      response.body.message.should.containEql(`The IPv4 range end ip given ${badProject.network.ipv4_ranges[0].end} is not \
valid within the pod network CIDR ${validPod.networks[0].ipv4_subnet.cidr}`);
    });

    it('should not update when the ipv4 range overlaps with the gateway address', async function () {
      badProject = _.cloneDeep(validProject);
      badProject.network.ipv4_ranges[0].start = validPod.networks[0].ipv4_subnet.gateway_ip;
      response = await agent.put(`/api/projects/${project._id}`).send(badProject).type('json').expect(422);
      response.body.message.should.containEql(`The IPv4 range (${badProject.network.ipv4_ranges[0].start} \
- ${badProject.network.ipv4_ranges[0].end}) is invalid as it would make use of the gateway IP ${validPod.networks[0].ipv4_subnet.gateway_ip}`);
    });

    it('should not update when the ipv4 start address is after the ipv4 end address', async function () {
      badProject = _.cloneDeep(validProject);
      badProject.network.ipv4_ranges[0].end = '131.160.202.9';
      response = await agent.put(`/api/projects/${project._id}`).send(badProject).type('json').expect(422);
      response.body.message.should.containEql(`The IPv4 range start ip ${badProject.network.ipv4_ranges[0].start} must \
come before the end ip ${badProject.network.ipv4_ranges[0].end}`);
    });

    it('should not update when ipv4 ranges in the current project overlap', async function () {
      badProject = _.cloneDeep(validProject);
      badProject.network.ipv4_ranges.push({
        start: '131.160.202.30',
        end: '131.160.202.40'
      });
      badProject.network.ipv4_ranges.push({
        start: '131.160.202.35',
        end: '131.160.202.45'
      });
      response = await agent.put(`/api/projects/${project._id}`).send(badProject).type('json').expect(422);
      response.body.message.should.containEql(`Range (131.160.202.35 - 131.160.202.45) from project '${validProject.name}' \
overlaps with another range (131.160.202.30 - 131.160.202.40) from project '${validProject.name}'`);
    });

    it('should not update when ipv4 ranges in different projects overlap', async function () {
      validProject.network.ipv4_ranges.push({
        start: '131.160.202.30',
        end: '131.160.202.40'
      });
      validProject.network.ipv4_ranges.push({
        start: '131.160.202.41',
        end: '131.160.202.50'
      });
      response = await agent.put(`/api/projects/${project._id}`).send(validProject).type('json').expect(200);
      badProject = _.cloneDeep(validProject);
      badProject.name = 'secondProject';
      badProject.network.ipv4_ranges = [{
        start: '131.160.202.51',
        end: '131.160.202.60'
      }];
      badProject.network.ipv6_ranges = [{
        start: '2001:1b70:6207:0027:0000:0874:1002:0000',
        end: '2001:1b70:6207:0027:0000:0874:1002:ffff'
      }];
      badProjectReturned = await agent.post('/api/projects/').send(badProject).type('json').expect(201);
      badProject.network.ipv4_ranges = [];
      badProject.network.ipv4_ranges.push({
        start: '131.160.202.45',
        end: '131.160.202.60'
      });
      response = await agent.put(`/api/projects/${badProjectReturned.body._id}`).send(badProject).type('json').expect(422);
      response.body.message.should.containEql(`Range (131.160.202.45 - 131.160.202.60) from project '${badProject.name}' \
overlaps with another range (131.160.202.41 - 131.160.202.50) from project '${validProject.name}'`);
    });

    it('should not update when ipv6 ranges in the current project overlap', async function () {
      badProject = _.cloneDeep(validProject);
      badProject.network.ipv6_ranges.push({
        start: '2001:1b70:6207:0027:0000:0874:1002:0000',
        end: '2001:1b70:6207:0027:0000:0874:1002:ffff'
      });
      badProject.network.ipv6_ranges.push({
        start: '2001:1b70:6207:0027:0000:0874:1002:0000',
        end: '2001:1b70:6207:0027:0000:0874:1002:ffff'
      });
      response = await agent.put(`/api/projects/${project._id}`).send(badProject).type('json').expect(422);
      response.body.message.should.containEql(`Range (2001:1b70:6207:0027:0000:0874:1002:0000 - 2001:1b70:6207:0027:0000:0874:1002:ffff) \
from project '${validProject.name}' overlaps with another range (2001:1b70:6207:0027:0000:0874:1002:0000 - \
2001:1b70:6207:0027:0000:0874:1002:ffff) from project '${validProject.name}'`);
    });

    it('should not update when ipv6 ranges in different projects overlap', async function () {
      validProject.network.ipv6_ranges.push({
        start: '2001:1b70:6207:0027:0000:0874:1002:0000',
        end: '2001:1b70:6207:0027:0000:0874:1002:ffff'
      });
      response = await agent.put(`/api/projects/${project._id}`).send(validProject).type('json').expect(200);
      badProject = _.cloneDeep(validProject);
      badProject.name = 'secondProject';
      badProject.network.ipv4_ranges = [{
        start: '131.160.202.99',
        end: '131.160.202.99'
      }];
      badProject.network.ipv6_ranges = [{
        start: '2001:1b70:6207:0027:0000:0874:1003:0000',
        end: '2001:1b70:6207:0027:0000:0874:1003:ffff'
      }];
      var badProjectReturned = await agent.post('/api/projects/').send(badProject).type('json').expect(201);
      badProject.network.ipv6_ranges = [];
      badProject.network.ipv6_ranges.push({
        start: '2001:1b70:6207:0027:0000:0874:1002:0000',
        end: '2001:1b70:6207:0027:0000:0874:1002:ffff'
      });
      response = await agent.put(`/api/projects/${badProjectReturned.body._id}`).send(badProject).type('json').expect(422);
      response.body.message.should.containEql(`Range (2001:1b70:6207:0027:0000:0874:1002:0000 - \
2001:1b70:6207:0027:0000:0874:1002:ffff) from project '${validProject.name}' overlaps \
with another range (2001:1b70:6207:0027:0000:0874:1002:0000 - 2001:1b70:6207:0027:0000:0874:1002:ffff) \
from project '${badProject.name}'`);
    });

    it('should allow to add and remove project from a group', async function () {
      process.env.NODE_ENV = 'policyCheckEnabled';
      validProject.usergroups = [groupReturned._id.toString()];
      projectResponse = await agent.put(`/api/projects/${project._id}`).auth(validUser.username, validUser.password).send(validProject).expect(200);
      groupReturned = await Group.findById(groupReturned._id).exec();
      groupReturned.associatedProjects[0].toString().should.deepEqual(projectResponse.body._id.toString());
      validProject.usergroups = [];
      _projectUpdated = _.cloneDeep(validProject);
      response = await agent.put(`/api/projects/${projectResponse.body._id}`)
        .auth(validUser.username, validUser.password).send(_projectUpdated).expect(200);
      groupReturned = await Group.findById(groupReturned._id).exec();
      groupReturned.associatedProjects.length.should.equal(0);
      process.env.NODE_ENV = nodeEnv;
    });

    it('should not allow to add same group twice', async function () {
      process.env.NODE_ENV = 'policyCheckEnabled';
      validProject.usergroups = [groupReturned._id.toString(), groupReturned._id.toString()];
      response = await agent.put(`/api/projects/${project._id}`).auth(validUser.username, validUser.password).send(validProject).expect(422);
      response.body.message.should.containEql('You cannot attach the same group twice');
      process.env.NODE_ENV = nodeEnv;
    });

    it('should not allow to add project to group, when user is not in that group', async function () {
      process.env.NODE_ENV = 'policyCheckEnabled';
      validProject.usergroups = [groupReturned._id.toString()];
      response = await agent.put(`/api/projects/${project._id}`).auth(validUser2.username, validUser2.password).send(validProject).expect(422);
      response.body.message.should.containEql(`You cannot attach group ${groupReturned._id.toString()}, you are not in this group`);
      process.env.NODE_ENV = nodeEnv;
    });

    it('should not allow to remove project from a group, when user is not in that group', async function () {
      process.env.NODE_ENV = 'policyCheckEnabled';
      validProject.usergroups = [groupReturned._id.toString()];
      projectResponse = await agent.put(`/api/projects/${project._id}`).auth(validUser.username, validUser.password).send(validProject).expect(200);
      groupReturned = await Group.findById(groupReturned._id).exec();
      groupReturned.associatedProjects[0].toString().should.deepEqual(projectResponse.body._id.toString());
      validProject.usergroups = [];
      _projectUpdated = _.cloneDeep(validProject);
      response = await agent.put(`/api/projects/${projectResponse.body._id}`)
        .auth(validUser2.username, validUser2.password).send(_projectUpdated).expect(200);
      groupReturned = await Group.findById(groupReturned._id).exec();
      groupReturned.associatedProjects.length.should.equal(1);
      process.env.NODE_ENV = nodeEnv;
    });

    it('should allow to add and remove project from a group, when user is superAdmin', async function () {
      process.env.NODE_ENV = 'policyCheckEnabled';
      validProject.usergroups = [groupReturned._id.toString()];
      projectResponse = await agent.put(`/api/projects/${project._id}`).auth(validUser.username, validUser.password).send(validProject).expect(200);
      groupReturned = await Group.findById(groupReturned._id).exec();
      groupReturned.associatedProjects[0].toString().should.deepEqual(projectResponse.body._id.toString());
      validProject.usergroups = [];
      _projectUpdated = _.cloneDeep(validProject);
      response = await agent.put(`/api/projects/${projectResponse.body._id}`)
        .auth(validUser3.username, validUser3.password).send(_projectUpdated).expect(200);
      groupReturned = await Group.findById(groupReturned._id).exec();
      groupReturned.associatedProjects.length.should.equal(0);
      process.env.NODE_ENV = nodeEnv;
    });

    it('should update an existing log with user-details for a project thats updated by a logged-in user', async function () {
      _projectUpdated = _.cloneDeep(validProject);
      _projectUpdated.name = 'updated_name';
      response = await agent.put(`/api/projects/${project._id}`)
        .send(_projectUpdated)
        .auth(validUser.username, validUser.password)
        .expect(200);
      response.body._id.should.have.length(24);
      response.body.name.should.equal(_projectUpdated.name);

      logReturned = await History.findOne({ associated_id: response.body._id }).exec();
      logReturned.originalData.should.not.equal(undefined);
      logReturned.originalData.name.should.equal(validProject.name);

      logReturned.updates.should.be.instanceof(Array).and.have.lengthOf(1);
      logReturned.updates[0].updatedAt.should.not.equal(undefined);
      logReturned.updates[0].updatedBy.username.should.equal(validUser.username);
      logReturned.updates[0].updatedBy.email.should.equal(validUser.email);
      logReturned.updates[0].updateData.name.should.equal(_projectUpdated.name);
    });

    it('should create a log with defined user-details for a project that gets updated by a logged-in user', async function () {
      // clear logs and verify
      await History.remove().exec();
      logReturned = await History.findOne({ associated_id: response.body._id }).exec();
      should.not.exist(logReturned);

      _projectUpdated = _.cloneDeep(validProject);
      _projectUpdated.name = 'updated_name';
      response = await agent.put(`/api/projects/${project._id}`)
        .send(_projectUpdated)
        .auth(validUser.username, validUser.password)
        .expect(200);
      response.body._id.should.have.length(24);
      response.body.name.should.equal(_projectUpdated.name);

      logReturned = await History.findOne({ associated_id: response.body._id }).exec();
      logReturned.originalData.should.not.equal(undefined);
      logReturned.originalData.name.should.equal(validProject.name);

      logReturned.updates.should.be.instanceof(Array).and.have.lengthOf(1);
      logReturned.updates[0].updatedAt.should.not.equal(undefined);
      logReturned.updates[0].updatedBy.username.should.equal(validUser.username);
      logReturned.updates[0].updatedBy.email.should.equal(validUser.email);
      logReturned.updates[0].updateData.name.should.equal(_projectUpdated.name);
    });
  });

  describe('DELETE', function () {
    beforeEach(async function () {
      count = await Project.count({});
      count.should.equal(0);
      validProject.pod_id = pod._id;
      project = new Project(validProject);
      await project.save();
    });

    it('should not delete a Project when user is not authenticated', async function () {
      response = await nonAuthAgent.delete('/api/projects/' + project._id).expect(401);
      response.body.message.should.equal('User must be logged in');
    });

    it('should delete a project and check its response', async function () {
      response = await agent.delete(`/api/projects/${project._id}`).send(project).expect(200);
      response.body._id.should.have.length(24);
      response.body.name.should.equal(validProject.name);
      response.body.id.should.equal(validProject.id);
      response.body.username.should.equal(validProject.username);
      response.body.password.should.equal(validProject.password);
      response = await Project.findById(response.body._id).exec();
      should.not.exist(response);
    });

    it('should fail when attempting to delete project that does not exist', async function () {
      response = await agent.delete('/api/projects/000000000000000000000000').expect(404);
      response.body.message.should.equal('A project with that id does not exist');
    });

    it('should fail when attempting to delete project with an invalid _id', async function () {
      response = await agent.delete('/api/projects/ThisIsAInvalidId').expect(404);
      response.body.message.should.equal('A project with that id does not exist');
    });

    it('should fail when attempting to delete project that is attached to a deployment', async function () {
      schema = new Schema(validSchema);
      schemaReturned = await schema.save();

      validDocument.schema_id = schemaReturned._id;
      response = await agent.post('/api/documents/').send(validDocument).expect(201);
      validDeployment.enm.sed_id = response.body._id;
      validDeployment.project_id = project._id;
      deployment = new Deployment(validDeployment);
      await deployment.save();

      response = await agent.delete(`/api/projects/${project._id}`).expect(422);
      response.body.message.should.equal('Can\'t delete project, it has 1 dependent deployment');
    });

    it('should update an existing log with user-details for a project thats deleted by a logged-in user', async function () {
      response = await agent.delete(`/api/projects/${project._id}`)
        .send(project)
        .auth(validUser.username, validUser.password)
        .expect(200);
      response.body._id.should.have.length(24);
      response.body._id.should.equal(project._id.toString());

      logReturned = await History.findOne({ associated_id: response.body._id }).exec();
      logReturned.originalData.should.not.equal(undefined);
      logReturned.originalData.name.should.equal(project.name);

      logReturned.updates.should.be.instanceof(Array).and.have.lengthOf(0);
      logReturned.deletedAt.should.not.equal(undefined);
      logReturned.deletedBy.should.not.equal(undefined);
      logReturned.deletedBy.username.should.equal(validUser.username);
      logReturned.deletedBy.email.should.equal(validUser.email);
    });

    it('should create a log with defined user-details for a project that gets deleted by a logged-in user', async function () {
      // clear logs and verify
      await History.remove().exec();
      logReturned = await History.findOne({ associated_id: response.body._id }).exec();
      should.not.exist(logReturned);

      response = await agent.delete(`/api/projects/${project._id}`)
        .send(project)
        .auth(validUser.username, validUser.password)
        .expect(200);
      response.body._id.should.have.length(24);
      response.body._id.should.equal(project._id.toString());

      logReturned = await History.findOne({ associated_id: response.body._id }).exec();
      logReturned.originalData.should.not.equal(undefined);
      logReturned.originalData.name.should.equal(project.name);

      logReturned.updates.should.be.instanceof(Array).and.have.lengthOf(0);
      logReturned.deletedAt.should.not.equal(undefined);
      logReturned.deletedBy.should.not.equal(undefined);
      logReturned.deletedBy.username.should.equal(validUser.username);
      logReturned.deletedBy.email.should.equal(validUser.email);
    });
  });

  describe('SEARCH', function () {
    beforeEach(async function () {
      projectObject = new Project(validProject);
      await projectObject.save();
    });

    it('should not return a project when passing in a valid parameter with a non existent project ID', async function () {
      response = await agent.get('/api/projects?q=_id=5bcdbe7287e21906ed4f12ba').expect(200);
      response.body.length.should.equal(0);
    });

    it('should not return a project when passing in a valid parameter with a non existent parameter', async function () {
      response = await agent.get(`/api/projects?q=${encodeURIComponent(`_id=${projectObject._id}&name=notExisting`)}`).expect(200);
      response.body.length.should.equal(0);
    });

    it('should return an error when not encoding q search parameters', async function () {
      response = await agent.get(`/api/projects?q=._id=${projectObject._id}&name=notExisting`).expect(422);
      response.body.message.should.equal('Improperly structured query. Make sure to use ?q=<key>=<value> syntax');
    });

    it('should return a single project when passing in _id parameter', async function () {
      response = await agent.get(`/api/projects?q=_id=${projectObject._id}`).expect(200);
      response.body[0].should.be.instanceof(Object);
      response.body[0].name.should.equal(projectObject.name);
    });

    it('should not return a project when passing in invalid parameter', async function () {
      response = await agent.get('/api/projects?q=n0nsense=123454321').expect(200);
      response.body.length.should.equal(0);
    });

    it('should return a single project when passing in name parameter', async function () {
      response = await agent.get(`/api/projects?q=name=${projectObject.name}`).expect(200);
      response.body[0].should.be.instanceof(Object);
      response.body[0].name.should.equal(projectObject.name);
    });

    it('should only return fields specified in url', async function () {
      response = await agent.get('/api/projects?fields=name').expect(200);
      response.body.length.should.equal(1);
      for (var key in response.body) {
        if (Object.prototype.hasOwnProperty.call(response.body, key)) {
          Object.prototype.hasOwnProperty.call(response.body[key], 'name').should.equal(true);
        }
      }
    });

    it('should only return fields specified in url using fields and q functionality', async function () {
      response = await agent.get(`/api/projects?fields=name&q=name=${projectObject.name}`).expect(200);
      response.body.length.should.equal(1);
      Object.prototype.hasOwnProperty.call(response.body[0], 'name').should.equal(true);
      response.body[0].name.should.equal(projectObject.name);
    });

    it('should only return nested fields specified in url', async function () {
      response = await agent.get('/api/projects?fields=network()').expect(200);
      response.body.length.should.equal(1);
      Object.prototype.hasOwnProperty.call(response.body[0], 'network').should.equal(true);
    });

    it('should return an error message when query has invalid search key blah', async function () {
      response = await agent.get(`/api/projects?q=name=${projectObject.name}&fields=name&blah=blah`).expect(422);
      response.body.message.should.equal('Improperly structured query. Make sure to use ?q=<key>=<value> syntax');
    });

    it('should return an error message when queried with an improper search', async function () {
      response = await agent.get(`/api/projects?name=${projectObject.name}`).expect(422);
      response.body.message.should.equal('Improperly structured query. Make sure to use ?q=<key>=<value> syntax');
    });

    it('should return an error message when queried with an empty q=', async function () {
      response = await agent.get('/api/projects?q=').expect(422);
      response.body.message.should.equal('Improperly structured query. Make sure to use ?q=<key>=<value> syntax');
    });

    it('should return an error message when queried with an empty fields=', async function () {
      response = await agent.get('/api/projects?fields=').expect(422);
      response.body.message.should.equal('Improperly structured query. Make sure to use ?q=<key>=<value> syntax');
    });

    it('should return an error message when queried with an empty fields= and q=', async function () {
      response = await agent.get('/api/projects?q=&fields=').expect(422);
      response.body.message.should.equal('Improperly structured query. Make sure to use ?q=<key>=<value> syntax');
    });
  });

  describe('FREE ADDRESS', function () {
    it('should return error when project name not provided', async function () {
      var jsonInput = {
        pod_name: pod.name,
        network_name: 'provider_network',
        number_of_addresses: 4,
        ip_type: 'ipv4',
        excluded_addresses: ''
      };
      response = await agent.post('/api/projects/free_address').send(jsonInput).expect(400);
      response.body.message.should.containEql('Path `name` is required.');
    });

    it('should return error when pod not found', async function () {
      var jsonInput = {
        pod_name: 'invalid',
        network_name: 'provider_network',
        name: 'validProject',
        number_of_addresses: 4,
        ip_type: 'ipv4',
        excluded_addresses: ''
      };
      response = await agent.post('/api/projects/free_address').send(jsonInput).expect(422);
      response.body.message.should.containEql('The given pod name invalid could not be found');
    });

    it('should return error when network not found', async function () {
      var jsonInput = {
        pod_name: pod.name,
        network_name: 'invalid',
        name: 'validProject',
        number_of_addresses: 4,
        ip_type: 'ipv4',
        excluded_addresses: ''
      };
      response = await agent.post('/api/projects/free_address').send(jsonInput).expect(422);
      response.body.message.should.containEql('The given network name invalid could not be found');
    });

    it('should return error when number_of_addresses is not a type of number', async function () {
      var jsonInput = {
        pod_name: pod.name,
        network_name: 'invalid',
        name: 'validProject',
        number_of_addresses: 'fdsfsdf',
        ip_type: 'ipv4',
        excluded_addresses: ''
      };
      response = await agent.post('/api/projects/free_address').send(jsonInput).expect(422);
      response.body.message.should.containEql('number_of_addresses must be a number, received: fdsfsdf');
    });

    it('should create a project if not found when getting a free ip address', async function () {
      var jsonInput = {
        pod_name: pod.name,
        network_name: 'provider_network',
        name: 'validProject',
        number_of_addresses: 4,
        ip_type: 'ipv4',
        excluded_addresses: ''
      };
      response = await agent.post('/api/projects/free_address').send(jsonInput).expect(201);
      response.body.name.should.equal('validProject');
      response.body.network.ipv4_ranges.length.should.equal(4);
    });

    it('should update a project when getting number of free ipv4 ip address', async function () {
      validProject.pod_id = pod._id;
      project = new Project(validProject);
      await project.save();
      var jsonInput = {
        pod_name: pod.name,
        network_name: 'provider_network',
        name: 'validProject',
        number_of_addresses: 2,
        ip_type: 'ipv4',
        excluded_addresses: ''
      };
      response = await agent.post('/api/projects/free_address').send(jsonInput).expect(200);
      response.body.name.should.equal('validProject');
      response.body.network.ipv4_ranges.length.should.equal(4);
    });

    it('should update a project when getting a free ipv4 ip address', async function () {
      validProject.pod_id = pod._id;
      project = new Project(validProject);
      await project.save();
      var jsonInput = {
        pod_name: pod.name,
        network_name: 'provider_network',
        name: 'validProject',
        ip_type: 'ipv4',
        excluded_addresses: ''
      };
      response = await agent.post('/api/projects/free_address').send(jsonInput).expect(200);
      response.body.name.should.equal('validProject');
      response.body.network.ipv4_ranges.length.should.equal(3);
    });

    it('should update a project when getting number of free ipv6 ip address', async function () {
      validProject.pod_id = pod._id;
      project = new Project(validProject);
      await project.save();
      var jsonInput = {
        pod_name: pod.name,
        network_name: 'provider_network',
        name: 'validProject',
        number_of_addresses: 2,
        ip_type: 'ipv6',
        excluded_addresses: ''
      };
      response = await agent.post('/api/projects/free_address').send(jsonInput).expect(200);
      response.body.name.should.equal('validProject');
      response.body.network.ipv6_ranges.length.should.equal(3);
    });

    it('should return error when no more free ip addresses in network subnet', async function () {
      pod.networks = [
        {
          name: 'provider_network',
          vrrp_range: {
            start: '1',
            end: '2'
          },
          ipv6_subnet: {
            cidr: '2001:1b70:6207:27::/64',
            gateway_ip: '2001:1b70:6207:27:0:874:0:1'
          },
          ipv4_subnet: {
            cidr: '131.160.202.0/24',
            gateway_ip: '131.160.202.1'
          }
        },
        {
          name: 'services_network',
          vrrp_range: {
            start: '1',
            end: '2'
          },
          ipv4_subnet: {
            cidr: '10.32.184.128/30',
            gateway_ip: '10.32.184.128'
          }
        }
      ];
      await pod.save();
      var freeAddressProject = _.cloneDeep(validProject);
      freeAddressProject.pod_id = pod._id;
      freeAddressProject.network.name = 'services_network';
      freeAddressProject.network.ipv4_ranges = [{
        start: '10.32.184.129',
        end: '10.32.184.129'
      }];
      delete freeAddressProject.network.ipv6_ranges;
      project = new Project(freeAddressProject);
      await project.save();
      var jsonInput = {
        pod_name: pod.name,
        network_name: 'services_network',
        name: 'validProject',
        number_of_addresses: 1,
        ip_type: 'ipv4',
        excluded_addresses: ''
      };
      response = await agent.post('/api/projects/free_address').send(jsonInput).expect(200);
      response.body.network.ipv4_ranges.length.should.equal(2);
      response = await agent.post('/api/projects/free_address').send(jsonInput).expect(422);
      response.body.message.should.containEql('No more free IP addresses within network');
    });

    it('should return error when not enough free ip addresses in network subnet', async function () {
      pod.networks = [
        {
          name: 'provider_network',
          vrrp_range: {
            start: '1',
            end: '2'
          },
          ipv6_subnet: {
            cidr: '2001:1b70:6207:27::/64',
            gateway_ip: '2001:1b70:6207:27:0:874:0:1'
          },
          ipv4_subnet: {
            cidr: '131.160.202.0/24',
            gateway_ip: '131.160.202.1'
          }
        },
        {
          name: 'services_network',
          vrrp_range: {
            start: '1',
            end: '2'
          },
          ipv4_subnet: {
            cidr: '10.32.184.128/30',
            gateway_ip: '10.32.184.128'
          }
        }
      ];
      await pod.save();
      var freeAddressProject = _.cloneDeep(validProject);
      freeAddressProject.pod_id = pod._id;
      freeAddressProject.network.name = 'services_network';
      freeAddressProject.network.ipv4_ranges = [{
        start: '10.32.184.129',
        end: '10.32.184.129'
      }];
      delete freeAddressProject.network.ipv6_ranges;
      project = new Project(freeAddressProject);
      await project.save();
      var jsonInput = {
        pod_name: pod.name,
        network_name: 'services_network',
        name: 'validProject',
        number_of_addresses: 4,
        ip_type: 'ipv4',
        excluded_addresses: ''
      };
      response = await agent.post('/api/projects/free_address').send(jsonInput).expect(422);
      response.body.message.should.containEql('Not enough free IP addresses within network');
    });

    it('should return error when there is no ipv6 subnet for the given network', async function () {
      pod.networks = [
        {
          name: 'provider_network',
          vrrp_range: {
            start: '1',
            end: '2'
          },
          ipv6_subnet: {
            cidr: '2001:1b70:6207:27::/64',
            gateway_ip: '2001:1b70:6207:27:0:874:0:1'
          },
          ipv4_subnet: {
            cidr: '131.160.202.0/24',
            gateway_ip: '131.160.202.1'
          }
        },
        {
          name: 'services_network',
          vrrp_range: {
            start: '1',
            end: '2'
          },
          ipv4_subnet: {
            cidr: '10.32.184.128/30',
            gateway_ip: '10.32.184.128'
          }
        }
      ];
      await pod.save();
      var freeAddressProject = _.cloneDeep(validProject);
      freeAddressProject.pod_id = pod._id;
      freeAddressProject.network.name = 'services_network';
      freeAddressProject.network.ipv4_ranges = [{
        start: '10.32.184.129',
        end: '10.32.184.129'
      }];
      delete freeAddressProject.network.ipv6_ranges;
      project = new Project(freeAddressProject);
      await project.save();
      var jsonInput = {
        pod_name: pod.name,
        network_name: 'services_network',
        name: 'validProject',
        number_of_addresses: 4,
        ip_type: 'ipv6',
        excluded_addresses: ''
      };
      response = await agent.post('/api/projects/free_address').send(jsonInput).expect(422);
      response.body.message.should.containEql('No IPv6 subnet found for network');
    });

    it('should update a project with newly passed ipv4 excluded addresses', async function () {
      validProject.pod_id = pod._id;
      project = new Project(validProject);
      await project.save();
      var jsonInput = {
        pod_name: pod.name,
        network_name: 'provider_network',
        name: 'validProject',
        ip_type: 'ipv4',
        excluded_addresses: '11.11.11.11'
      };
      response = await agent.post('/api/projects/free_address').send(jsonInput).expect(200);
      response.body.exclusion_ipv4_addresses[0].ipv4.should.equal('11.11.11.11');
    });

    it('should update a project with newly passed ipv6 excluded addresses', async function () {
      validProject.pod_id = pod._id;
      project = new Project(validProject);
      await project.save();
      var jsonInput = {
        pod_name: pod.name,
        network_name: 'provider_network',
        name: 'validProject',
        ip_type: 'ipv6',
        excluded_addresses: '2001:1b70:6207:0027:0000:0874:1001:7777'
      };
      response = await agent.post('/api/projects/free_address').send(jsonInput).expect(200);
      response.body.exclusion_ipv6_addresses[0].ipv6.should.equal('2001:1b70:6207:0027:0000:0874:1001:7777');
    });

    it('should not include a duplicate excluded address when updating project', async function () {
      validProject.pod_id = pod._id;
      project = new Project(validProject);
      project.exclusion_ipv4_addresses = { ipv4: '22.22.22.22' };
      await project.save();
      var jsonInput = {
        pod_name: pod.name,
        network_name: 'provider_network',
        name: 'validProject',
        ip_type: 'ipv4',
        excluded_addresses: '11.11.11.11,22.22.22.22'
      };
      response = await agent.post('/api/projects/free_address').send(jsonInput).expect(200);
      response.body.exclusion_ipv4_addresses.length.should.equal(2);
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
  });
});
