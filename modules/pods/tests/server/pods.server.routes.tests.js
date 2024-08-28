'use strict';

var fs = require('fs');
var should = require('should'),
  superagentDefaults = require('superagent-defaults'),
  supertest = require('supertest'),
  mongoose = require('mongoose'),
  _ = require('lodash'),
  History = require('../../../history/server/models/history.server.model').getSchema('pods'),
  Pod = mongoose.model('Pod'),
  Project = mongoose.model('Project'),
  Group = mongoose.model('Group'),
  User = mongoose.model('User'),
  express = require('../../../../config/lib/express');

var app,
  agent,
  nonAuthAgent,
  validPod,
  secondValidPod,
  badPod,
  podObject,
  podReturned,
  _podUpdated,
  podResponse,
  secondPodObject,
  validProject,
  dependentProject,
  secondNetwork,
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

describe('Pods', function () {
  before(async function () {
    app = express.init(mongoose);
    nonAuthAgent = superagentDefaults(supertest.agent(app));
    agent = superagentDefaults(supertest.agent(app));
  });
  beforeEach(async function () {
    validPod = JSON.parse(fs.readFileSync('/opt/mean.js/modules/pods/tests/server/test_files/valid_pod.json', 'utf8'));
    secondValidPod = JSON.parse(fs.readFileSync('/opt/mean.js/modules/pods/tests/server/test_files/second_valid_pod.json', 'utf8'));
    validProject = JSON.parse(fs.readFileSync('/opt/mean.js/modules/pods/tests/server/test_files/valid_project.json', 'utf8'));
    validUser = JSON.parse(fs.readFileSync('/opt/mean.js/modules/deployments/tests/server/test_files/valid_user.json', 'utf8'));
    validUser2 = JSON.parse(fs.readFileSync('/opt/mean.js/modules/deployments/tests/server/test_files/valid_user2.json', 'utf8'));
    validUser3 = JSON.parse(fs.readFileSync('/opt/mean.js/modules/deployments/tests/server/test_files/valid_user3.json', 'utf8'));

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
    it('should not create a new Pod when user is not authenticated', async function () {
      response = await nonAuthAgent.post('/api/pods').send(validPod).expect(401);
      response.body.message.should.equal('User must be logged in');
    });

    it('should create a new pod and check db', async function () {
      response = await agent.post('/api/pods').send(validPod).expect(201);
      response.body._id.should.have.length(24);
      response.headers.location.should.equal(`/api/pods/${response.body._id}`);
      response.body.name.should.equal(validPod.name);
      response.body.authUrl.should.equal(validPod.authUrl);
      podReturned = await Pod.findById(response.body._id).exec();
      podReturned.name.should.equal(validPod.name);
      podReturned.authUrl.should.equal(validPod.authUrl);
    });

    it('should not post more than one pod with the same name', async function () {
      podObject = new Pod(validPod);
      podReturned = await podObject.save();
      secondValidPod = _.cloneDeep(validPod);
      secondValidPod.authUrl = 'A_Diff_AuthUrl';
      response = await agent.post('/api/pods').send(secondValidPod).expect(400);
      response.body.message.should.equal('Error, provided name is not unique.');
    });

    it('should not post more than one pod with the same authUrl', async function () {
      await agent.post('/api/pods').send(validPod).expect(201);
      secondValidPod = _.cloneDeep(validPod);
      secondValidPod.name = 'A_Diff_Name';
      response = await agent.post('/api/pods').send(secondValidPod).expect(400);
      response.body.message.should.equal('Error, provided authUrl is not unique.');
    });

    it('should not post a pod with a name with an invalid length', async function () {
      badPod = _.cloneDeep(validPod);
      badPod.name = 'xxxx';
      response = await agent.post('/api/pods').send(badPod).expect(400);
      response.body.message.should.equal(`Path \`name\` (\`${badPod.name}\`) is shorter than the minimum allowed length (5).`);
    });

    it('should post a pod without IPv6 details', async function () {
      delete validPod.networks[0].ipv6_subnet;
      await agent.post('/api/pods').send(validPod).expect(201);
    });

    it('should post a pod with IPv4 network and without IPv6 network details', async function () {
      delete validPod.networks[0].ipv6_subnet;
      var newNetwork = {
        name: 'another_provider_network',
        vrrp_range: {
          start: 1,
          end: 2
        },
        ipv6_subnet: {
          cidr: '2001:1b70:6207:37::/64',
          gateway_ip: '2001:1b70:6207:37:0:874:0:1'
        },
        ipv4_subnet: {
          cidr: '131.160.203.0/24',
          gateway_ip: '131.160.203.1'
        }
      };
      validPod.networks.push(newNetwork);
      await agent.post('/api/pods').send(validPod).expect(201);
    });

    it('should not allow a pod with a non-alphanumeric-underscored name', async function () {
      badPod = _.cloneDeep(validPod);
      badPod.name = '!£$%&';
      response = await agent.post('/api/pods').send(badPod).expect(400);
      response.body.message.should.equal('name is not valid; \'!£$%&\' can only contain letters, numbers, dots, dashes and underscores.');
    });

    it('should not post a pod without a name key', async function () {
      badPod = _.cloneDeep(validPod);
      delete badPod.name;
      response = await agent.post('/api/pods').send(badPod).expect(400);
      response.body.message.should.equal('Path `name` is required.');
    });

    it('should not post a pod without an authUrl key', async function () {
      badPod = _.cloneDeep(validPod);
      delete badPod.authUrl;
      response = await agent.post('/api/pods').send(badPod).expect(400);
      response.body.message.should.equal('Path `authUrl` is required.');
    });

    it('should not post a pod with an authUrl that isnt a url', async function () {
      badPod = _.cloneDeep(validPod);
      badPod.authUrl = 'htp://';
      response = await agent.post('/api/pods').send(badPod).expect(400);
      response.body.message.should.equal(`${badPod.authUrl} is not correct. The authUrl must be a valid url.`);
    });

    it('should not post a pod with unknown key', async function () {
      badPod = _.cloneDeep(validPod);
      badPod.rogueKey = 'rogueValue';
      response = await agent.post('/api/pods').send(badPod).expect(400);
      response.body.message.should.equal('Field `rogueKey` is not in schema and strict mode is set to throw.');
    });

    it('should respond with bad request with invalid json', async function () {
      badPod = '{';
      response = await agent.post('/api/pods').send(badPod).type('json').expect(400);
      response.body.message.should.equal('There was a syntax error found in your request, please make sure that it is valid and try again');
    });

    it('should allow to add pod to a group', async function () {
      process.env.NODE_ENV = 'policyCheckEnabled';
      validPod.usergroups = [groupReturned._id.toString()];
      response = await agent.post('/api/pods').auth(validUser.username, validUser.password).send(validPod).expect(201);
      groupReturned = await Group.findById(groupReturned._id).exec();
      groupReturned.associatedPods[0].toString().should.deepEqual(response.body._id.toString());
      process.env.NODE_ENV = nodeEnv;
    });

    it('should allow to add pod from a group, when user is superAdmin', async function () {
      process.env.NODE_ENV = 'policyCheckEnabled';
      validPod.usergroups = [groupReturned._id.toString()];
      response = await agent.post('/api/pods').auth(validUser3.username, validUser3.password).send(validPod).expect(201);
      groupReturned = await Group.findById(groupReturned._id).exec();
      groupReturned.associatedPods[0].toString().should.deepEqual(response.body._id.toString());
      process.env.NODE_ENV = nodeEnv;
    });

    it('should not allow to add same group twice', async function () {
      process.env.NODE_ENV = 'policyCheckEnabled';
      validPod.usergroups = [groupReturned._id.toString(), groupReturned._id.toString()];
      response = await agent.post('/api/pods').auth(validUser.username, validUser.password).send(validPod).expect(422);
      response.body.message.should.equal('You cannot attach the same group twice');
      process.env.NODE_ENV = nodeEnv;
    });

    it('should not allow to add pod to group, when user is not in that group', async function () {
      process.env.NODE_ENV = 'policyCheckEnabled';
      validPod.usergroups = [groupReturned._id.toString()];
      response = await agent.post('/api/pods').auth(validUser2.username, validUser2.password).send(validPod).expect(422);
      response.body.message.should.equal(`You cannot attach group ${groupReturned._id.toString()}, you are not in this group`);
      process.env.NODE_ENV = nodeEnv;
    });

    it('should respond with bad request when no networks key is given', async function () {
      badPod = _.cloneDeep(validPod);
      delete badPod.networks;
      response = await agent.post('/api/pods').send(badPod).type('json').expect(400);
      response.body.message.should.equal('You must provide at least one network');
    });

    it('should respond with bad request when empty network list is given', async function () {
      badPod = _.cloneDeep(validPod);
      badPod.networks = [];
      response = await agent.post('/api/pods').send(badPod).type('json').expect(400);
      response.body.message.should.equal('You must provide at least one network');
    });

    it('should not create when duplicate network names are given', async function () {
      badPod = _.cloneDeep(validPod);
      badPod.networks.push(badPod.networks[0]);
      response = await agent.post('/api/pods').send(badPod).type('json').expect(422);
      response.body.message.should.equal('You cannot have duplicate network names');
    });

    it('should not create when invalid IPv4 cidr is given', async function () {
      badPod = _.cloneDeep(validPod);
      badPod.networks[0].ipv4_subnet.cidr = 'invalid';
      response = await agent.post('/api/pods').send(badPod).type('json').expect(400);
      response.body.message.should.equal('ipv4_subnet.cidr must be a valid IPv4 CIDR. invalid is not valid.');
    });

    it('should not create when invalid IPv6 cidr is given', async function () {
      badPod = _.cloneDeep(validPod);
      badPod.networks[0].ipv6_subnet.cidr = 'invalid';
      response = await agent.post('/api/pods').send(badPod).type('json').expect(400);
      response.body.message.should.equal('ipv6_subnet.cidr must be a valid IPv6 CIDR. invalid is not valid.');
    });

    it('should not create when invalid IPv4 gateway ip is given', async function () {
      badPod = _.cloneDeep(validPod);
      badPod.networks[0].ipv4_subnet.gateway_ip = 'invalid';
      response = await agent.post('/api/pods').send(badPod).type('json').expect(400);
      response.body.message.should.equal('ipv4_subnet.gateway_ip must be a valid IPv4 address. invalid is not valid.');
    });

    it('should not create when invalid IPv6 gateway ip is given', async function () {
      badPod = _.cloneDeep(validPod);
      badPod.networks[0].ipv6_subnet.gateway_ip = 'invalid';
      response = await agent.post('/api/pods').send(badPod).type('json').expect(400);
      response.body.message.should.equal('ipv6_subnet.gateway_ip must be a valid IPv6 address. invalid is not valid.');
    });

    it('should not create when an IPv4 gateway ip is given thats not within the cidr', async function () {
      badPod = _.cloneDeep(validPod);
      badPod.networks[0].ipv4_subnet.gateway_ip = '1.1.1.1';
      response = await agent.post('/api/pods').send(badPod).type('json').expect(422);
      response.body.message.should.equal(`The IPv4 subnet gateway ip given ${badPod.networks[0].ipv4_subnet.gateway_ip} is \
not valid within the given CIDR ${badPod.networks[0].ipv4_subnet.cidr}`);
    });

    it('should not create when an IPv6 gateway ip is given thats not within the cidr', async function () {
      badPod = _.cloneDeep(validPod);
      badPod.networks[0].ipv6_subnet.gateway_ip = '::';
      response = await agent.post('/api/pods').send(badPod).type('json').expect(422);
      response.body.message.should.equal(`The IPv6 subnet gateway ip given ${badPod.networks[0].ipv6_subnet.gateway_ip} is \
not valid within the given CIDR ${badPod.networks[0].ipv6_subnet.cidr}`);
    });

    it('should create with multiple networks', async function () {
      secondNetwork = _.cloneDeep(validPod.networks[0]);
      secondNetwork.name = 'provider_network2';
      validPod.networks.push(secondNetwork);
      response = await agent.post('/api/pods').send(validPod).type('json').expect(201);
      response.body.networks.should.deepEqual(validPod.networks);
    });

    it('should not create pod when part of vrrp id range is missing', async function () {
      badPod = _.cloneDeep(validPod);
      delete badPod.networks[0].vrrp_range;
      response = await agent.post('/api/pods').send(badPod).type('json').expect(400);
      response.body.message.should.equal('Path `vrrp_range.start` is required.');

      badPod = _.cloneDeep(validPod);
      delete badPod.networks[0].vrrp_range.start;
      response = await agent.post('/api/pods').send(badPod).type('json').expect(400);
      response.body.message.should.equal('Path `vrrp_range.start` is required.');

      badPod = _.cloneDeep(validPod);
      delete badPod.networks[0].vrrp_range.end;
      response = await agent.post('/api/pods').send(badPod).type('json').expect(400);
      response.body.message.should.equal('Path `vrrp_range.end` is required.');
    });

    it('should not create pod when vrrp id range is set to invalid values', async function () {
      badPod = _.cloneDeep(validPod);
      badPod.networks[0].vrrp_range.start = '-1';
      response = await agent.post('/api/pods').send(badPod).type('json').expect(400);
      response.body.message.should.equal('Path `vrrp_range.start` (-1) is less than minimum allowed value (1).');

      badPod = _.cloneDeep(validPod);
      badPod.networks[0].vrrp_range.start = -1;
      response = await agent.post('/api/pods').send(badPod).type('json').expect(400);
      response.body.message.should.equal('Path `vrrp_range.start` (-1) is less than minimum allowed value (1).');

      badPod = _.cloneDeep(validPod);
      badPod.networks[0].vrrp_range.end = '256';
      response = await agent.post('/api/pods').send(badPod).type('json').expect(400);
      response.body.message.should.equal('Path `vrrp_range.end` (256) is more than maximum allowed value (255).');

      badPod = _.cloneDeep(validPod);
      badPod.networks[0].vrrp_range.end = 256;
      response = await agent.post('/api/pods').send(badPod).type('json').expect(400);
      response.body.message.should.equal('Path `vrrp_range.end` (256) is more than maximum allowed value (255).');
    });

    it('should not create pod when vrrp id range has unknown key', async function () {
      badPod = _.cloneDeep(validPod);
      badPod.networks[0].vrrp_range.unknownKey = 'unknownKey';
      response = await agent.post('/api/pods').send(badPod).type('json').expect(400);
      response.body.message.should.containEql('Cast to Array failed for value');
    });

    it('should not create pod when vrrp id end range is before start range', async function () {
      badPod = _.cloneDeep(validPod);
      var start = badPod.networks[0].vrrp_range.start;
      badPod.networks[0].vrrp_range.start = badPod.networks[0].vrrp_range.end;
      badPod.networks[0].vrrp_range.end = start;
      response = await agent.post('/api/pods').send(badPod).type('json').expect(422);
      response.body.message.should.containEql('Vrrp_id range start cannot be after range end');
    });

    it('should post a new log with user-details when a pod is created by a logged-in user', async function () {
      response = await agent.post('/api/pods').auth(validUser.username, validUser.password).send(validPod).expect(201);
      response.body._id.should.have.length(24);
      response.headers.location.should.equal(`/api/pods/${response.body._id}`);
      response.body.name.should.equal(validPod.name);
      response.body.authUrl.should.equal(validPod.authUrl);
      podReturned = await Pod.findById(response.body._id).exec();
      podReturned.name.should.equal(validPod.name);
      podReturned.authUrl.should.equal(validPod.authUrl);

      logReturned = await History.findOne({ associated_id: response.body._id }).exec();
      logReturned.originalData.should.not.equal(undefined);
      logReturned.originalData.authUrl.should.equal(validPod.authUrl);
      logReturned.originalData.name.should.equal(validPod.name);
      logReturned.createdAt.should.not.equal(undefined);
      logReturned.createdBy.should.not.equal(undefined);
      logReturned.createdBy.username.should.equal(validUser.username);
      logReturned.createdBy.email.should.equal(validUser.email);
      logReturned.updates.should.be.instanceof(Array).and.have.lengthOf(0);
    });

    it('should not post a new log for a pod that is created with a name beginning with \'A_Health_\'', async function () {
      var validPodHealth = _.cloneDeep(validPod);
      validPodHealth.name = 'A_Health_Pod';
      response = await agent.post('/api/pods').send(validPodHealth).expect(201);
      response.body._id.should.have.length(24);
      response.headers.location.should.equal(`/api/pods/${response.body._id}`);
      response.body.name.should.equal(validPodHealth.name);

      podReturned = await Pod.findById(response.body._id).exec();
      podReturned.name.should.equal(validPodHealth.name);

      logReturned = await History.findOne({ associated_id: response.body._id }).exec();
      should.not.exist(logReturned);
    });
  });

  describe('GET', function () {
    beforeEach(async function () {
      podObject = new Pod(validPod);
      podReturned = await podObject.save();
    });

    it('should be able to get pods when user not authenticated', async function () {
      await nonAuthAgent.get('/api/pods').expect(200);
    });

    it('should be able to get an empty pod list', async function () {
      podReturned = await podObject.remove();
      response = await agent.get('/api/pods').expect(200);
      response.body.should.be.instanceof(Array).and.have.lengthOf(0);
    });

    it('should be able to get a pod list with one element', async function () {
      response = await agent.get('/api/pods').expect(200);
      response.body.should.be.instanceof(Array).and.have.lengthOf(1);
      response.body[0].name.should.equal(validPod.name);
      response.body[0].authUrl.should.equal(validPod.authUrl);
    });

    it('should be able to get a pod list with more than one element', async function () {
      await agent.post('/api/pods').send(secondValidPod).expect(201);
      response = await agent.get('/api/pods').expect(200);
      response.body.should.be.instanceof(Array).and.have.lengthOf(2);
      response.body[0].name.should.equal(validPod.name);
      response.body[0].authUrl.should.equal(validPod.authUrl);
      response.body[1].name.should.equal(secondValidPod.name);
      response.body[1].authUrl.should.equal(secondValidPod.authUrl);
    });

    it('should be able to get a single pod', async function () {
      response = await agent.get(`/api/pods/${podObject._id}`).expect(200);
      response.body.name.should.equal(validPod.name);
      response.body.authUrl.should.equal(validPod.authUrl);
    });

    it('should throw 404 when id is not in database', async function () {
      response = await agent.get('/api/pods/000000000000000000000000').expect(404);
      response.body.message.should.equal('A pod with that id does not exist');
    });

    it('should throw 404 when an invalid id is used to search the db', async function () {
      response = await agent.get('/api/pods/0').expect(404);
      response.body.message.should.equal('A pod with that id does not exist');
    });

    it('should return subnet data for network', async function () {
      response = await agent.get(`/api/pods/${podObject._id}/subnet/provider_network`).expect(200);
      response.body.network.ipv4_subnet.size.should.equal('256');
      response.body.network.ipv4_subnet.assigned.should.equal('0');
      response.body.network.ipv4_subnet.free.should.equal('256');
      response.body.network.ipv6_subnet.size.should.equal('18446744073709551616');
      response.body.network.ipv6_subnet.assigned.should.equal('0');
      response.body.network.ipv6_subnet.free.should.equal('18446744073709551616');
    });

    it('should return subnet data for network without ipv6', async function () {
      podObject.networks[0].ipv6_subnet = {};
      await podObject.save();
      response = await agent.get(`/api/pods/${podObject._id}/subnet/provider_network`).expect(200);
      response.body.network.ipv4_subnet.size.should.equal('256');
      response.body.network.ipv4_subnet.assigned.should.equal('0');
      response.body.network.ipv4_subnet.free.should.equal('256');
    });

    it('should return subnet data for network with a project', async function () {
      validProject.pod_id = podObject._id;
      dependentProject = new Project(validProject);
      await dependentProject.save();
      response = await agent.get(`/api/pods/${podObject._id}/subnet/provider_network`).expect(200);
      response.body.network.ipv4_subnet.size.should.equal('256');
      response.body.network.ipv4_subnet.assigned.should.equal('13');
      response.body.network.ipv4_subnet.free.should.equal('243');
      response.body.network.ipv6_subnet.size.should.equal('18446744073709551616');
      response.body.network.ipv6_subnet.assigned.should.equal('65538');
      response.body.network.ipv6_subnet.free.should.equal('18446744073709486078');
    });

    it('should return subnet data for network with a project that has no ipv6', async function () {
      var noIPv6ValidProject = _.cloneDeep(validProject);
      noIPv6ValidProject.pod_id = podObject._id;
      noIPv6ValidProject.network.ipv6_ranges = [];
      dependentProject = new Project(noIPv6ValidProject);
      await dependentProject.save();
      response = await agent.get(`/api/pods/${podObject._id}/subnet/provider_network`).expect(200);
      response.body.network.ipv4_subnet.size.should.equal('256');
      response.body.network.ipv4_subnet.assigned.should.equal('13');
      response.body.network.ipv4_subnet.free.should.equal('243');
    });

    it('should return subnet data for network with a project that has assigned all the ipv4 addresses', async function () {
      var allIpv4ValidProject = _.cloneDeep(validProject);
      allIpv4ValidProject.pod_id = podObject._id;
      allIpv4ValidProject.network.ipv4_ranges = [
        {
          start: '131.160.202.2',
          end: '131.160.202.255'
        }
      ];
      dependentProject = new Project(allIpv4ValidProject);
      await dependentProject.save();
      response = await agent.get(`/api/pods/${podObject._id}/subnet/provider_network`).expect(200);
      response.body.network.ipv4_subnet.size.should.equal('256');
      response.body.network.ipv4_subnet.assigned.should.equal('256');
      response.body.network.ipv4_subnet.free.should.equal('0');
    });

    it('should return error with invalid pod id', async function () {
      response = await agent.get('/api/pods/00007/subnet/provider_network').expect(404);
      response.body.message.should.equal('A pod with that id does not exist');
    });

    it('should return error with invalid pod id', async function () {
      response = await agent.get(`/api/pods/${podObject._id}/subnet/adasds`).expect(422);
      response.body.message.should.equal('The given network name adasds could not be found');
    });
  });

  describe('PUT', function () {
    beforeEach(async function () {
      podObject = new Pod(validPod);
      podReturned = await podObject.save();
    });

    it('should not update a Pod when user is not authenticated', async function () {
      secondValidPod = { name: secondValidPod.name };
      response = await nonAuthAgent.put('/api/pods/' + podObject._id).send(secondValidPod).expect(401);
      response.body.message.should.equal('User must be logged in');
    });

    it('should return the updated pod name and authUrl after update and check db', async function () {
      response = await agent.put(`/api/pods/${podObject._id}`).send(secondValidPod).expect(200);
      response.body._id.should.have.length(24);
      response.body.name.should.equal(secondValidPod.name);
      response.body.authUrl.should.equal(secondValidPod.authUrl);
      podReturned = await Pod.findById(response.body._id).exec();
      podReturned.name.should.equal(secondValidPod.name);
      podReturned.authUrl.should.equal(secondValidPod.authUrl);
    });

    it('should update with partial pod, just a name', async function () {
      secondValidPod = { name: secondValidPod.name };
      response = await agent.put(`/api/pods/${podObject._id}`).send(secondValidPod).expect(200);
      podReturned = await Pod.findById(podObject._id).exec();
      podReturned.name.should.equal(secondValidPod.name);
    });

    it('should update with partial pod, just networks', async function () {
      validPod = { networks: validPod.networks };
      response = await agent.put(`/api/pods/${podObject._id}`).send(validPod).expect(200);
      podReturned = await Pod.findById(podObject._id).exec();
      podReturned.toJSON().networks.should.deepEqual(validPod.networks);
    });

    it('should not allow update of pod with unknown key', async function () {
      badPod = _.cloneDeep(validPod);
      badPod.rogueKey = 'rogueValue';
      response = await agent.put(`/api/pods/${podObject._id}`).send(badPod).expect(400);
      response.body.message.should.equal('Field `rogueKey` is not in schema and strict mode is set to throw.');
      podReturned = await Pod.findById(podObject._id).exec();
      should.not.exist(podReturned.rogueKey);
    });

    it('should respond with bad update request with invalid json', async function () {
      badPod = '{';
      response = await agent.put(`/api/pods/${podObject._id}`).send(badPod).type('json').expect(400);
      response.body.message.should.equal('There was a syntax error found in your request, please make sure that it is valid and try again');
    });

    it('should not allow an update with an existing name', async function () {
      secondPodObject = new Pod(secondValidPod);
      await secondPodObject.save();
      badPod = _.cloneDeep(secondValidPod);
      badPod.authUrl = 'http://cloud1a.athtem.eei.ericsson.se:5000/v2.0';
      response = await agent.put(`/api/pods/${podObject._id}`).send(badPod).expect(400);
      response.body.message.should.equal('Error, provided name is not unique.');
      podReturned = await Pod.findById(podObject._id).exec();
      podReturned.name.should.equal(validPod.name);
      podReturned.authUrl.should.equal(validPod.authUrl);
    });

    it('should not allow an update with a name with less than 5 characters', async function () {
      badPod = _.cloneDeep(validPod);
      badPod.name = 'xxxx';
      response = await agent.put(`/api/pods/${podObject._id}`).send(badPod).expect(400);
      response.body.message.should.equal(`Path \`name\` (\`${badPod.name}\`) is shorter than the minimum allowed length (5).`);
      podReturned = await Pod.findById(podObject._id).exec();
      podReturned.name.should.equal(validPod.name);
    });

    it('should not allow an update with a name of more than 20 characters', async function () {
      badPod = _.cloneDeep(validPod);
      badPod.name = 'xxxxxxxxxxxxxxxxxxxxx';
      response = await agent.put(`/api/pods/${podObject._id}`).send(badPod).expect(400);
      response.body.message.should.equal(`Path \`name\` (\`${badPod.name}\`) is longer than the maximum allowed length (20).`);
      podReturned = await Pod.findById(podObject._id).exec();
      podReturned.name.should.equal(validPod.name);
    });

    it('should not allow an update with an existing authUrl', async function () {
      secondPodObject = new Pod(secondValidPod);
      await secondPodObject.save();
      badPod = _.cloneDeep(secondValidPod);
      badPod.name = 'Testname';
      response = await agent.put(`/api/pods/${podObject._id}`).send(badPod).expect(400);
      response.body.message.should.equal('Error, provided authUrl is not unique.');
      podReturned = await Pod.findById(podObject._id).exec();
      podReturned.name.should.equal(validPod.name);
      podReturned.authUrl.should.equal(validPod.authUrl);
    });

    it('should not allow an update with a pod the has a invalid authUrl', async function () {
      badPod = _.cloneDeep(secondValidPod);
      badPod.authUrl = 'NotaURL';
      response = await agent.put(`/api/pods/${podObject._id}`).send(badPod).expect(400);
      response.body.message.should.equal('NotaURL is not correct. The authUrl must be a valid url.');
      podReturned = await Pod.findById(podObject._id).exec();
      podReturned.name.should.equal(validPod.name);
      podReturned.authUrl.should.equal(validPod.authUrl);
    });

    it('should not allow an update when empty network list is given', async function () {
      badPod = _.cloneDeep(validPod);
      badPod.networks = [];
      response = await agent.put(`/api/pods/${podObject._id}`).send(badPod).type('json').expect(400);
      response.body.message.should.equal('You must provide at least one network');
    });

    it('should not allow an update when duplicate network names are given', async function () {
      badPod = _.cloneDeep(validPod);
      badPod.networks.push(badPod.networks[0]);
      response = await agent.put(`/api/pods/${podObject._id}`).send(badPod).type('json').expect(422);
      response.body.message.should.equal('You cannot have duplicate network names');
    });

    it('should not allow an update when a non-alphanumeric-underscored network name is given', async function () {
      badPod = _.cloneDeep(validPod);
      badPod.networks[0].name = '!£$%&';
      response = await agent.put(`/api/pods/${podObject._id}`).send(badPod).type('json').expect(400);
      response.body.message.should.equal('name is not valid; \'!£$%&\' can only contain letters, numbers, dots, dashes and underscores.');
    });

    it('should not allow an update when invalid IPv4 cidr is given', async function () {
      badPod = _.cloneDeep(validPod);
      badPod.networks[0].ipv4_subnet.cidr = 'invalid';
      response = await agent.put(`/api/pods/${podObject._id}`).send(badPod).type('json').expect(400);
      response.body.message.should.equal('ipv4_subnet.cidr must be a valid IPv4 CIDR. invalid is not valid.');
    });

    it('should not allow an update when invalid IPv6 cidr is given', async function () {
      badPod = _.cloneDeep(validPod);
      badPod.networks[0].ipv6_subnet.cidr = 'invalid';
      response = await agent.put(`/api/pods/${podObject._id}`).send(badPod).type('json').expect(400);
      response.body.message.should.equal('ipv6_subnet.cidr must be a valid IPv6 CIDR. invalid is not valid.');
    });

    it('should not allow an update when invalid IPv4 gateway ip is given', async function () {
      badPod = _.cloneDeep(validPod);
      badPod.networks[0].ipv4_subnet.gateway_ip = 'invalid';
      response = await agent.put(`/api/pods/${podObject._id}`).send(badPod).type('json').expect(400);
      response.body.message.should.equal('ipv4_subnet.gateway_ip must be a valid IPv4 address. invalid is not valid.');
    });

    it('should not allow an update when invalid IPv6 gateway ip is given', async function () {
      badPod = _.cloneDeep(validPod);
      badPod.networks[0].ipv6_subnet.gateway_ip = 'invalid';
      response = await agent.put(`/api/pods/${podObject._id}`).send(badPod).type('json').expect(400);
      response.body.message.should.equal('ipv6_subnet.gateway_ip must be a valid IPv6 address. invalid is not valid.');
    });

    it('should not allow an update when IPv4 gateway ip is given thats not within the cidr', async function () {
      badPod = _.cloneDeep(validPod);
      badPod.networks[0].ipv4_subnet.gateway_ip = '1.1.1.1';
      response = await agent.put(`/api/pods/${podObject._id}`).send(badPod).type('json').expect(422);
      response.body.message.should.equal(`The IPv4 subnet gateway ip given ${badPod.networks[0].ipv4_subnet.gateway_ip} \
is not valid within the given CIDR ${badPod.networks[0].ipv4_subnet.cidr}`);
    });

    it('should not allow an update when IPv6 gateway ip is given thats not within the cidr', async function () {
      badPod = _.cloneDeep(validPod);
      badPod.networks[0].ipv6_subnet.gateway_ip = '::';
      response = await agent.put(`/api/pods/${podObject._id}`).send(badPod).type('json').expect(422);
      response.body.message.should.equal(`The IPv6 subnet gateway ip given ${badPod.networks[0].ipv6_subnet.gateway_ip} \
is not valid within the given CIDR ${badPod.networks[0].ipv6_subnet.cidr}`);
    });

    it('should not update pod when part of vrrp id range is missing', async function () {
      badPod = _.cloneDeep(validPod);
      delete badPod.networks[0].vrrp_range;
      response = await agent.put(`/api/pods/${podObject._id}`).send(badPod).type('json').expect(400);
      response.body.message.should.equal('Path `vrrp_range.start` is required.');

      badPod = _.cloneDeep(validPod);
      delete badPod.networks[0].vrrp_range.start;
      response = await agent.put(`/api/pods/${podObject._id}`).send(badPod).type('json').expect(400);
      response.body.message.should.equal('Path `vrrp_range.start` is required.');

      badPod = _.cloneDeep(validPod);
      delete badPod.networks[0].vrrp_range.end;
      response = await agent.put(`/api/pods/${podObject._id}`).send(badPod).type('json').expect(400);
      response.body.message.should.equal('Path `vrrp_range.end` is required.');
    });

    it('should not update pod when vrrp id range is set to invalid values', async function () {
      badPod = _.cloneDeep(validPod);
      badPod.networks[0].vrrp_range.start = '-1';
      response = await agent.put(`/api/pods/${podObject._id}`).send(badPod).type('json').expect(400);
      response.body.message.should.equal('Path `vrrp_range.start` (-1) is less than minimum allowed value (1).');

      badPod = _.cloneDeep(validPod);
      badPod.networks[0].vrrp_range.start = -1;
      response = await agent.put(`/api/pods/${podObject._id}`).send(badPod).type('json').expect(400);
      response.body.message.should.equal('Path `vrrp_range.start` (-1) is less than minimum allowed value (1).');

      badPod = _.cloneDeep(validPod);
      badPod.networks[0].vrrp_range.end = '256';
      response = await agent.put(`/api/pods/${podObject._id}`).send(badPod).type('json').expect(400);
      response.body.message.should.equal('Path `vrrp_range.end` (256) is more than maximum allowed value (255).');

      badPod = _.cloneDeep(validPod);
      badPod.networks[0].vrrp_range.end = 256;
      response = await agent.put(`/api/pods/${podObject._id}`).send(badPod).type('json').expect(400);
      response.body.message.should.equal('Path `vrrp_range.end` (256) is more than maximum allowed value (255).');
    });

    it('should not create pod when vrrp id range has unknown key', async function () {
      badPod = _.cloneDeep(validPod);
      badPod.networks[0].vrrp_range.unknownKey = 'unknownKey';
      response = await agent.put(`/api/pods/${podObject._id}`).send(badPod).type('json').expect(400);
      response.body.message.should.containEql('Cast to Array failed for value');
    });

    it('should allow to add and remove pod from a group', async function () {
      process.env.NODE_ENV = 'policyCheckEnabled';
      validPod.usergroups = [groupReturned._id.toString()];
      podResponse = await agent.put(`/api/pods/${podObject._id}`).auth(validUser.username, validUser.password).send(validPod).expect(200);
      groupReturned = await Group.findById(groupReturned._id).exec();
      groupReturned.associatedPods[0].toString().should.deepEqual(podResponse.body._id.toString());
      validPod.usergroups = [];
      _podUpdated = _.cloneDeep(validPod);
      response = await agent.put(`/api/pods/${podResponse.body._id}`).auth(validUser.username, validUser.password).send(_podUpdated).expect(200);
      groupReturned = await Group.findById(groupReturned._id).exec();
      groupReturned.associatedPods.length.should.equal(0);
      process.env.NODE_ENV = nodeEnv;
    });

    it('should allow to add and remove pod from a group, when user is superAdmin', async function () {
      process.env.NODE_ENV = 'policyCheckEnabled';
      validPod.usergroups = [groupReturned._id.toString()];
      podResponse = await agent.put(`/api/pods/${podObject._id}`).auth(validUser.username, validUser.password).send(validPod).expect(200);
      groupReturned = await Group.findById(groupReturned._id).exec();
      groupReturned.associatedPods[0].toString().should.deepEqual(podResponse.body._id.toString());
      validPod.usergroups = [];
      _podUpdated = _.cloneDeep(validPod);
      response = await agent.put(`/api/pods/${podResponse.body._id}`).auth(validUser3.username, validUser3.password).send(_podUpdated).expect(200);
      groupReturned = await Group.findById(groupReturned._id).exec();
      groupReturned.associatedPods.length.should.equal(0);
      process.env.NODE_ENV = nodeEnv;
    });

    it('should not allow to add same group twice', async function () {
      process.env.NODE_ENV = 'policyCheckEnabled';
      validPod.usergroups = [groupReturned._id.toString(), groupReturned._id.toString()];
      response = await agent.put(`/api/pods/${podObject._id}`).auth(validUser.username, validUser.password).send(validPod).expect(422);
      response.body.message.should.equal('You cannot attach the same group twice');
      process.env.NODE_ENV = nodeEnv;
    });

    it('should not allow to add pod to group, when user is not in that group', async function () {
      process.env.NODE_ENV = 'policyCheckEnabled';
      validPod.usergroups = [groupReturned._id.toString()];
      response = await agent.put(`/api/pods/${podObject._id}`).auth(validUser2.username, validUser2.password).send(validPod).expect(422);
      response.body.message.should.equal(`You cannot attach group ${groupReturned._id.toString()}, you are not in this group`);
      process.env.NODE_ENV = nodeEnv;
    });

    it('should not allow to remove pod from a group, when user is not in that group', async function () {
      process.env.NODE_ENV = 'policyCheckEnabled';
      validPod.usergroups = [groupReturned._id.toString()];
      podResponse = await agent.put(`/api/pods/${podObject._id}`).auth(validUser.username, validUser.password).send(validPod).expect(200);
      groupReturned = await Group.findById(groupReturned._id).exec();
      groupReturned.associatedPods[0].toString().should.deepEqual(podResponse.body._id.toString());
      validPod.usergroups = [];
      _podUpdated = _.cloneDeep(validPod);
      response = await agent.put(`/api/pods/${podResponse.body._id}`).auth(validUser2.username, validUser2.password).send(_podUpdated).expect(200);
      groupReturned = await Group.findById(groupReturned._id).exec();
      groupReturned.associatedPods.length.should.equal(1);
      process.env.NODE_ENV = nodeEnv;
    });

    it('should update an existing log with user-details for a pod thats updated by a logged-in user', async function () {
      secondValidPod = { name: '_updatedPod' };
      response = await agent.put(`/api/pods/${podObject._id}`).send(secondValidPod)
        .auth(validUser.username, validUser.password).expect(200);
      response.body._id.should.have.length(24);
      response.body.name.should.equal(secondValidPod.name);

      logReturned = await History.findOne({ associated_id: response.body._id }).exec();
      logReturned.originalData.should.not.equal(undefined);
      logReturned.originalData.name.should.equal(validPod.name);

      logReturned.updates.should.be.instanceof(Array).and.have.lengthOf(1);
      logReturned.updates[0].updatedAt.should.not.equal(undefined);
      logReturned.updates[0].updatedBy.username.should.equal(validUser.username);
      logReturned.updates[0].updatedBy.email.should.equal(validUser.email);
      logReturned.updates[0].updateData.name.should.equal(secondValidPod.name);
    });

    it('should create a log with defined user-details for a pod that gets updated by a logged-in user', async function () {
      // clear logs and verify
      await History.remove().exec();
      logReturned = await History.findOne({}).exec();
      should.not.exist(logReturned);

      secondValidPod = { name: '_updatedPod' };
      response = await agent.put(`/api/pods/${podObject._id}`).send(secondValidPod)
        .auth(validUser.username, validUser.password).expect(200);
      response.body._id.should.have.length(24);
      response.body.name.should.equal(secondValidPod.name);

      logReturned = await History.findOne({ associated_id: response.body._id }).exec();
      logReturned.originalData.should.not.equal(undefined);
      logReturned.originalData.name.should.equal(validPod.name);

      logReturned.updates.should.be.instanceof(Array).and.have.lengthOf(1);
      logReturned.updates[0].updatedAt.should.not.equal(undefined);
      logReturned.updates[0].updatedBy.username.should.equal(validUser.username);
      logReturned.updates[0].updatedBy.email.should.equal(validUser.email);
      logReturned.updates[0].updateData.name.should.equal(secondValidPod.name);
    });
  });

  describe('DELETE', function () {
    beforeEach(async function () {
      podObject = new Pod(validPod);
      podReturned = await podObject.save();
    });

    it('should not delete a Pod when user is not authenticated', async function () {
      response = await nonAuthAgent.delete('/api/pods/' + podObject._id).expect(401);
      response.body.message.should.equal('User must be logged in');
    });

    it('should delete a single pod', async function () {
      response = await agent.delete(`/api/pods/${podObject._id}`).expect(200);
      response.body.name.should.deepEqual(podReturned.name);
    });

    it('should have 1 elements in db after 1 pod deletion', async function () {
      secondPodObject = new Pod(secondValidPod);
      await secondPodObject.save();
      count = await Pod.count().exec();
      count.should.equal(2);
      response = await agent.delete(`/api/pods/${podObject._id}`).expect(200);
      count = await Pod.count().exec();
      count.should.equal(1);
    });

    it('should delete a pod with no dependent projects and check its response', async function () {
      response = await agent.delete(`/api/pods/${podObject._id}`).expect(200);
      response.body.should.be.instanceof(Object);
      response.body.name.should.equal(podObject.name);
      response.body.authUrl.should.equal(podObject.authUrl);
    });

    it('should fail when attempting to delete a pod that does not exist', async function () {
      response = await agent.delete('/api/pods/000000000000000000000000').expect(404);
      response.body.message.should.equal('A pod with that id does not exist');
    });

    it('should fail when attempting to delete a pod which has dependent projects', async function () {
      validProject.pod_id = podObject._id;
      dependentProject = new Project(validProject);
      await dependentProject.save();
      response = await agent.delete(`/api/pods/${podObject._id}`).expect(422);
      response.body.message.should.equal('Can\'t delete pod, it has 1 dependent project');
      count = await Pod.count().exec();
      count.should.equal(1);
    });

    it('should update an existing log with user-details for a pod thats deleted by a logged-in user', async function () {
      response = await agent.delete(`/api/pods/${podObject._id}`)
        .auth(validUser.username, validUser.password).expect(200);
      response.body._id.should.have.length(24);
      response.body._id.should.equal(podObject._id.toString());

      logReturned = await History.findOne({ associated_id: response.body._id }).exec();
      logReturned.originalData.should.not.equal(undefined);
      logReturned.originalData.name.should.equal(validPod.name);

      logReturned.updates.should.be.instanceof(Array).and.have.lengthOf(0);
      logReturned.deletedAt.should.not.equal(undefined);
      logReturned.deletedBy.should.not.equal(undefined);
      logReturned.deletedBy.username.should.equal(validUser.username);
      logReturned.deletedBy.email.should.equal(validUser.email);
    });

    it('should create a log with defined user-details for a pod that gets deleted by a logged-in user', async function () {
      // clear logs and verify
      await History.remove().exec();
      logReturned = await History.findOne({}).exec();
      should.not.exist(logReturned);

      response = await agent.delete(`/api/pods/${podObject._id}`)
        .auth(validUser.username, validUser.password).expect(200);
      response.body._id.should.have.length(24);
      response.body._id.should.equal(podObject._id.toString());

      logReturned = await History.findOne({ associated_id: response.body._id }).exec();
      logReturned.originalData.should.not.equal(undefined);
      logReturned.originalData.name.should.equal(validPod.name);

      logReturned.updates.should.be.instanceof(Array).and.have.lengthOf(0);
      logReturned.deletedAt.should.not.equal(undefined);
      logReturned.deletedBy.should.not.equal(undefined);
      logReturned.deletedBy.username.should.equal(validUser.username);
      logReturned.deletedBy.email.should.equal(validUser.email);
    });
  });

  describe('SEARCH', function () {
    beforeEach(async function () {
      podObject = new Pod(validPod);
      await podObject.save();
    });

    it('should not return a pod when passing in a valid parameter with a non existent pod ID', async function () {
      response = await agent.get('/api/pods?q=_id=5bcdbe7287e21906ed4f12ba').expect(200);
      response.body.length.should.equal(0);
    });

    it('should not return a label when passing in a valid parameter with a non existent parameter', async function () {
      response = await agent.get(`/api/pods?q=${encodeURIComponent(`_id=${podObject._id}&name=notExisting`)}`).expect(200);
      response.body.length.should.equal(0);
    });

    it('should return an error when not encoding q search parameters', async function () {
      response = await agent.get(`/api/pods?q=._id=${podObject._id}&name=notExisting`).expect(422);
      response.body.message.should.equal('Improperly structured query. Make sure to use ?q=<key>=<value> syntax');
    });

    it('should return a single pod when passing in _id parameter', async function () {
      response = await agent.get(`/api/pods?q=_id=${podObject._id}`).expect(200);
      response.body[0].should.be.instanceof(Object);
      response.body[0].name.should.equal(podObject.name);
    });

    it('should not return a pod when passing in invalid parameter', async function () {
      response = await agent.get('/api/pods?q=n0nsense=123454321').expect(200);
      response.body.length.should.equal(0);
    });

    it('should return a single pod when passing in name parameter', async function () {
      response = await agent.get(`/api/pods?q=name=${podObject.name}`).expect(200);
      response.body[0].should.be.instanceof(Object);
      response.body[0].name.should.equal(podObject.name);
    });

    it('should only return fields specified in url', async function () {
      response = await agent.get('/api/pods?fields=name').expect(200);
      response.body.length.should.equal(1);
      for (var key in response.body) {
        if (Object.prototype.hasOwnProperty.call(response.body, key)) {
          Object.prototype.hasOwnProperty.call(response.body[key], 'name').should.equal(true);
        }
      }
    });

    it('should only return fields specified in url using fields and q functionality', async function () {
      response = await agent.get(`/api/pods?fields=name&q=name=${podObject.name}`).expect(200);
      response.body.length.should.equal(1);
      Object.prototype.hasOwnProperty.call(response.body[0], 'name').should.equal(true);
      response.body[0].name.should.equal(podObject.name);
    });

    it('should return an error message when query has invalid search key blah', async function () {
      response = await agent.get(`/api/pods?q=name=${podObject.name}&fields=name&blah=blah`).expect(422);
      response.body.message.should.equal('Improperly structured query. Make sure to use ?q=<key>=<value> syntax');
    });

    it('should return an error message when queried with an improper search', async function () {
      response = await agent.get(`/api/pods?name=${podObject.name}`).expect(422);
      response.body.message.should.equal('Improperly structured query. Make sure to use ?q=<key>=<value> syntax');
    });

    it('should return an error message when queried with an empty q=', async function () {
      response = await agent.get('/api/pods?q=').expect(422);
      response.body.message.should.equal('Improperly structured query. Make sure to use ?q=<key>=<value> syntax');
    });

    it('should return an error message when queried with an empty fields=', async function () {
      response = await agent.get('/api/pods?fields=').expect(422);
      response.body.message.should.equal('Improperly structured query. Make sure to use ?q=<key>=<value> syntax');
    });

    it('should return an error message when queried with an empty fields= and q=', async function () {
      response = await agent.get('/api/pods?q=&fields=').expect(422);
      response.body.message.should.equal('Improperly structured query. Make sure to use ?q=<key>=<value> syntax');
    });
  });

  afterEach(async function () {
    await User.remove().exec();
    await Group.remove().exec();
    await Project.remove().exec();
    await Pod.remove().exec();
    await History.remove().exec();
  });
});
