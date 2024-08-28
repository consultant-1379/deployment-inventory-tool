'use strict';

var fs = require('fs');
var semver = require('semver'),
  should = require('should'),
  superagentDefaults = require('superagent-defaults'),
  supertest = require('supertest'),
  mongoose = require('mongoose'),
  _ = require('lodash'),
  History = require('../../../history/server/models/history.server.model').getSchema('groups'),
  Group = mongoose.model('Group'),
  Document = mongoose.model('Document'),
  Schema = mongoose.model('Schema'),
  User = mongoose.model('User'),
  express = require('../../../../config/lib/express');

var app,
  agent,
  nonAuthAgent,
  validGroup,
  badGroup,
  groupReturned,
  groupObject,
  validGroup2,
  group2Object,
  validSchema,
  validDocument,
  schemaObject,
  documentObject,
  documentReturned,
  validUser,
  validUser2,
  validUser3,
  userObject,
  userReturned,
  userObject2,
  userReturned2,
  userObject3,
  userReturned3,
  count,
  logReturned,
  response;

describe('Groups', function () {
  before(async function () {
    app = express.init(mongoose);
    nonAuthAgent = superagentDefaults(supertest.agent(app));
    agent = superagentDefaults(supertest.agent(app));
  });
  beforeEach(async function () {
    validSchema = JSON.parse(fs.readFileSync('/opt/mean.js/modules/groups/tests/server/test_files/valid_schema.json', 'utf8'));
    validDocument = JSON.parse(fs.readFileSync('/opt/mean.js/modules/groups/tests/server/test_files/valid_document.json', 'utf8'));
    validUser = JSON.parse(fs.readFileSync('/opt/mean.js/modules/deployments/tests/server/test_files/valid_user.json', 'utf8'));
    validUser2 = JSON.parse(fs.readFileSync('/opt/mean.js/modules/deployments/tests/server/test_files/valid_user2.json', 'utf8'));
    validUser3 = JSON.parse(fs.readFileSync('/opt/mean.js/modules/deployments/tests/server/test_files/valid_user3.json', 'utf8'));

    schemaObject = new Schema(validSchema);
    await schemaObject.save();
    validDocument.schema_id = schemaObject._id;
    documentObject = new Document(validDocument);
    documentReturned = await documentObject.save();
    userObject = new User(validUser);
    userReturned = await userObject.save(); // admin
    userObject2 = new User(validUser2);
    userReturned2 = await userObject2.save(); // user
    userObject3 = new User(validUser3);
    userReturned3 = await userObject3.save(); // superAdmin

    validGroup = {
      name: 'groupName',
      admin_IDs: [userObject._id],
      users: [],
      associatedDocuments: []
    };

    // Authorise User
    agent.auth(validUser.username, validUser.password);
  });
  describe('POST', function () {
    it('should not create a new Group when user is not authenticated', async function () {
      response = await nonAuthAgent.post('/api/groups').send(validGroup).expect(401);
      response.body.message.should.equal('User must be logged in');
    });

    it('should not create a new Group when user is standard user', async function () {
      response = await agent.post('/api/groups').auth(validUser2.username, validUser2.password).send(validGroup).expect(403);
      response.body.message.should.equal('User is not authorized');
    });

    it('should create a new Group and check db when user is admin user', async function () {
      response = await agent.post('/api/groups').auth(validUser.username, validUser.password).send(validGroup).expect(201);
      response.body._id.should.have.length(24);
      response.headers.location.should.equal(`/api/groups/${response.body._id}`);
      response.body.name.should.equal(validGroup.name);
      groupReturned = await Group.findById(response.body._id).exec();
      groupReturned.name.should.equal(validGroup.name);
    });

    it('should create a new Group and check db when user is superAdmin user', async function () {
      response = await agent.post('/api/groups').auth(validUser3.username, validUser3.password).send(validGroup).expect(201);
      response.body._id.should.have.length(24);
      response.headers.location.should.equal(`/api/groups/${response.body._id}`);
      response.body.name.should.equal(validGroup.name);
      groupReturned = await Group.findById(response.body._id).exec();
      groupReturned.name.should.equal(validGroup.name);
    });

    it('should remove associated document from group if it does not exist', async function () {
      validGroup.associatedDocuments = ['987654321098765432109876'];
      response = await agent.post('/api/groups').send(validGroup).expect(201);
      response.body.associatedDocuments.length.should.equal(0);
    });

    it('should not create a new Group if associated user does not exist', async function () {
      validGroup.users = ['987654321098765432109876'];
      response = await agent.post('/api/groups').send(validGroup).expect(422);
      response.body.message.should.equal('An associated user id does not exist');
    });

    it('should not create a new Group if admin user is not an admin', async function () {
      validGroup.admin_IDs[0] = [userReturned2._id];
      response = await agent.post('/api/groups').send(validGroup).expect(422);
      response.body.message.should.equal(`An Admin User with id '${userReturned2._id}' does not exist`);
    });

    it('should create a new Group with optional parameters', async function () {
      validGroup.associatedDocuments = [documentReturned._id];
      validGroup.users = [userReturned._id];
      response = await agent.post('/api/groups').send(validGroup).expect(201);
      response.body.associatedDocuments[0].toString().should.deepEqual(validGroup.associatedDocuments[0].toString());
    });

    it('should add document to users group if document is created after group creation', async function () {
      validGroup.associatedDocuments = [documentReturned._id];
      validGroup.users = [userReturned._id];
      response = await agent.post('/api/groups').send(validGroup).expect(201);
      response.body.associatedDocuments[0].toString().should.deepEqual(validGroup.associatedDocuments[0].toString());
      var groupID = response.body._id;
      var validDocument2 = _.cloneDeep(validDocument);
      validDocument2.name = 'validDocument2';
      validDocument2.usergroups = [groupID.toString()];
      response = await agent.post('/api/documents').auth(validUser.username, validUser.password).send(validDocument2).expect(201);
      groupReturned = await Group.findById(groupID).exec();
      groupReturned.associatedDocuments.length.should.equal(2);
    });

    it('should create a new Group with only two admin users', async function () {
      validGroup.admin_IDs = [userReturned._id, userReturned2._id];
      response = await agent.post('/api/groups').send(validGroup).expect(201);
      response.body.name.should.equal(validGroup.name);
    });

    it('should not create a new Group with more than two admin users', async function () {
      validGroup.admin_IDs = [userReturned._id, userReturned2._id, userReturned3._id];
      response = await agent.post('/api/groups').send(validGroup).expect(422);
      response.body.message.should.equal('There can be only a maximium of two admin users per group.');
    });

    it('should not create a new Group with duplicate admin users', async function () {
      validGroup.admin_IDs = [userReturned._id, userReturned._id];
      response = await agent.post('/api/groups').send(validGroup).expect(422);
      response.body.message.should.equal('Duplicate users added to admin group.');
    });

    it('should not create a new Group with duplicate users', async function () {
      validGroup.users = [userReturned._id, userReturned._id];
      response = await agent.post('/api/groups').send(validGroup).expect(422);
      response.body.message.should.equal('Duplicate users added to group.');
    });

    it('should not create a new Group with duplicate documents', async function () {
      validGroup.associatedDocuments = [documentReturned._id, documentReturned._id];
      response = await agent.post('/api/groups').send(validGroup).expect(422);
      response.body.message.should.equal('Duplicate documents added to group.');
    });

    it('should not post more than one group with the same name', async function () {
      groupObject = new Group(validGroup);
      groupReturned = await groupObject.save();
      response = await agent.post('/api/groups').send(validGroup).expect(400);
      response.body.message.should.equal('Error, provided name is not unique.');
    });

    it('should not post group with a name less than 2 characters', async function () {
      badGroup = _.cloneDeep(validGroup);
      badGroup.name = 'x';
      response = await agent.post('/api/groups').send(badGroup).expect(400);
      response.body.message.should.equal(`Path \`name\` (\`${badGroup.name}\`) is shorter than the minimum allowed length (2).`);
    });

    it('should not post group with a name more than 50 characters', async function () {
      badGroup = _.cloneDeep(validGroup);
      badGroup.name = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
      response = await agent.post('/api/groups').send(badGroup).expect(400);
      response.body.message.should.equal(`Path \`name\` (\`${badGroup.name}\`) is longer than the maximum allowed length (50).`);
    });

    it('should not post a group without a name key', async function () {
      badGroup = _.cloneDeep(validGroup);
      delete badGroup.name;
      response = await agent.post('/api/groups').send(badGroup).expect(400);
      response.body.message.should.equal('Path `name` is required.');
    });

    it('should not post a group with unknown key', async function () {
      badGroup = _.cloneDeep(validGroup);
      badGroup.rogueKey = 'rogueValue';
      response = await agent.post('/api/groups').send(badGroup).expect(400);
      response.body.message.should.equal('Field `rogueKey` is not in schema and strict mode is set to throw.');
    });

    it('should not post a group without an assigned admin', async function () {
      badGroup = _.cloneDeep(validGroup);
      delete badGroup.admin_IDs[0];
      response = await agent.post('/api/groups').send(badGroup).expect(400);
      response.body.message.should.equal('Path `admin_IDs` is required.');
    });

    it('should respond with bad request with invalid json', async function () {
      badGroup = '{';
      response = await agent.post('/api/groups').send(badGroup).type('json').expect(400);
      response.body.message.should.equal('There was a syntax error found in your request, please make sure that it is valid and try again');
    });

    it('should post a new log with user-details when a group is created by a logged-in user', async function () {
      response = await agent.post('/api/groups').auth(validUser.username, validUser.password).send(validGroup).expect(201);
      response.body._id.should.have.length(24);
      response.headers.location.should.equal(`/api/groups/${response.body._id}`);
      response.body.name.should.equal(validGroup.name);
      logReturned = await History.findOne({ associated_id: response.body._id }).exec();
      logReturned.originalData.should.not.equal(undefined);
      logReturned.originalData.name.should.equal(validGroup.name);
      logReturned.createdAt.should.not.equal(undefined);
      logReturned.createdBy.should.not.equal(undefined);
      logReturned.createdBy.username.should.equal(validUser.username);
      logReturned.createdBy.email.should.equal(validUser.email);
      logReturned.updates.should.be.instanceof(Array).and.have.lengthOf(0);
    });

    it('should not post a new log for a group that is created with a name beginning with \'A_Health_\'', async function () {
      var validGroupHealth = _.cloneDeep(validGroup);
      validGroupHealth.name = 'A_Health_Group';
      response = await agent.post('/api/groups').send(validGroupHealth).expect(201);
      response.body._id.should.have.length(24);
      response.headers.location.should.equal(`/api/groups/${response.body._id}`);
      response.body.name.should.equal(validGroupHealth.name);

      var groupReturned = await Group.findById(response.body._id).exec();
      groupReturned.name.should.equal(validGroupHealth.name);

      logReturned = await History.findOne({ associated_id: response.body._id }).exec();
      should.not.exist(logReturned);
    });
  });

  describe('GET', function () {
    beforeEach(async function () {
      groupObject = new Group(validGroup);
      groupReturned = await groupObject.save();
    });

    it('should be able to get empty group list', async function () {
      groupReturned = await groupObject.remove();
      response = await agent.get('/api/groups').expect(200);
      response.body.should.be.instanceof(Array).and.have.lengthOf(0);
    });

    it('should be able to get group list with one element', async function () {
      response = await agent.get('/api/groups').expect(200);
      response.body.should.be.instanceof(Array).and.have.lengthOf(1);
      response.body[0].name.should.equal(validGroup.name);
    });

    it('should be able to get group list with more than one element when user is standard user', async function () {
      validGroup2 = _.cloneDeep(validGroup);
      validGroup2.name = 'anotherGroupName';
      group2Object = new Group(validGroup2);
      await group2Object.save();
      response = await agent.get('/api/groups').auth(validUser2.username, validUser2.password).expect(200);
      response.body.should.be.instanceof(Array).and.have.lengthOf(2);
      response.body[0].name.should.equal(validGroup2.name);
      response.body[1].name.should.deepEqual(validGroup.name);
    });

    it('should be able to get group list with more than one element when user is admin user', async function () {
      validGroup2 = _.cloneDeep(validGroup);
      validGroup2.name = 'anotherGroupName';
      group2Object = new Group(validGroup2);
      await group2Object.save();
      response = await agent.get('/api/groups').auth(validUser.username, validUser.password).expect(200);
      response.body.should.be.instanceof(Array).and.have.lengthOf(2);
      response.body[0].name.should.equal(validGroup2.name);
      response.body[1].name.should.deepEqual(validGroup.name);
    });

    it('should be able to get group list with more than one element when user is superAdmin user', async function () {
      validGroup2 = _.cloneDeep(validGroup);
      validGroup2.name = 'anotherGroupName';
      group2Object = new Group(validGroup2);
      await group2Object.save();
      response = await agent.get('/api/groups').auth(validUser3.username, validUser3.password).expect(200);
      response.body.should.be.instanceof(Array).and.have.lengthOf(2);
      response.body[0].name.should.equal(validGroup2.name);
      response.body[1].name.should.deepEqual(validGroup.name);
    });

    it('should be able to get a single group', async function () {
      response = await agent.get(`/api/groups/${groupObject._id}`).expect(200);
      response.body.name.should.equal(validGroup.name);
    });

    it('should throw 404 when id is not in database', async function () {
      response = await agent.get('/api/groups/000000000000000000000000').expect(404);
      response.body.message.should.equal('A group with that id does not exist');
    });

    it('should throw 404 when id is invalid in the database', async function () {
      response = await agent.get('/api/groups/0').expect(404);
      response.body.message.should.equal('A group with that id does not exist');
    });
  });

  describe('PUT', function () {
    beforeEach(async function () {
      groupObject = new Group(validGroup);
      groupReturned = await groupObject.save();
    });

    it('should not update a Group when user is not authenticated', async function () {
      response = await nonAuthAgent.put('/api/groups/' + groupObject._id).send(validGroup).expect(401);
      response.body.message.should.equal('User must be logged in');
    });

    it('should not update a Group when user is standard user', async function () {
      response = await nonAuthAgent.put('/api/groups/' + groupObject._id).auth(validUser2.username, validUser2.password).send(validGroup).expect(403);
      response.body.message.should.equal('User is not authorized');
    });

    it('should not update a group if user is not superAdmin or group admin', async function () {
      response = await agent.put('/api/groups/' + groupObject._id).send(validGroup)
        .auth(validUser2.username, validUser2.password).expect(403);
      response.body.message.should.equal('User is not authorized');
    });

    it('should update a group if user is group admin', async function () {
      validGroup.users.push(userObject3._id);
      response = await agent.put(`/api/groups/${groupObject._id}`).send(validGroup)
        .auth(validUser.username, validUser.password).expect(200);
      response.body.users.includes(userObject3._id.toString()).should.be.true();
    });

    it('should update an existing log with user-details when a group is updated', async function () {
      validGroup.users.push(userObject3._id);
      response = await agent.put(`/api/groups/${groupObject._id}`).send(validGroup)
        .auth(validUser.username, validUser.password).expect(200);
      response.body._id.should.have.length(24);
      response.body.users.includes(userObject3._id.toString()).should.be.true();

      logReturned = await History.findOne({ associated_id: response.body._id }).exec();
      logReturned.originalData.should.not.equal(undefined);
      logReturned.originalData.users.includes(userObject3._id.toString()).should.be.false();

      logReturned.updates.should.be.instanceof(Array).and.have.lengthOf(1);
      logReturned.updates[0].updatedAt.should.not.equal(undefined);
      logReturned.updates[0].updatedBy.should.not.equal(undefined);
      logReturned.updates[0].updatedBy.username.should.equal(validUser.username);
      logReturned.updates[0].updatedBy.email.should.equal(validUser.email);
      logReturned.updates[0].updateData.users[0].toString().should.equal(userObject3._id.toString());
    });

    it('should create a log (when none exists) with defined user-details for a group that gets updated by a logged-in user', async function () {
      // clear logs and verify
      await History.remove().exec();
      logReturned = await History.findOne({ associated_id: response.body._id }).exec();
      should.not.exist(logReturned);

      validGroup.users.push(userObject3._id);
      response = await agent.put(`/api/groups/${groupObject._id}`).send(validGroup)
        .auth(validUser.username, validUser.password).expect(200);
      response.body._id.should.have.length(24);
      response.body.users.includes(userObject3._id.toString()).should.be.true();

      logReturned = await History.findOne({ associated_id: response.body._id }).exec();
      logReturned.originalData.should.not.equal(undefined);
      logReturned.originalData.users.includes(userObject3._id.toString()).should.be.false();

      logReturned.updates.should.be.instanceof(Array).and.have.lengthOf(1);
      logReturned.updates[0].updatedAt.should.not.equal(undefined);
      logReturned.updates[0].updatedBy.should.not.equal(undefined);
      logReturned.updates[0].updatedBy.username.should.equal(validUser.username);
      logReturned.updates[0].updatedBy.email.should.equal(validUser.email);
      logReturned.updates[0].updateData.users[0].toString().should.equal(userObject3._id.toString());
    });
  });

  describe('DELETE', function () {
    beforeEach(async function () {
      groupObject = new Group(validGroup);
      groupReturned = await groupObject.save();
    });

    it('should not delete a Group when user is not authenticated', async function () {
      response = await nonAuthAgent.delete('/api/groups/' + groupObject._id).expect(401);
      response.body.message.should.equal('User must be logged in');
    });

    it('should delete a group as superAdmin and check its response and the db', async function () {
      response = await agent.delete(`/api/groups/${groupObject._id}`)
        .auth(validUser3.username, validUser3.password).expect(200);
      response.body.should.be.instanceof(Object);
      response.body.name.should.equal(groupObject.name);
      count = await Group.count().exec();
      count.should.equal(0);
    });

    it('should not delete a group as admin due to permissions', async function () {
      var nodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'policyCheckEnabled';
      response = await agent.delete(`/api/groups/${groupObject._id}`)
        .auth(validUser2.username, validUser2.password).expect(403);
      response.body.message.should.equal('User is not authorized');
      process.env.NODE_ENV = nodeEnv;
    });

    it('should fail when attempting to delete a group that does not exist', async function () {
      response = await agent.delete('/api/groups/000000000000000000000000').expect(404);
      response.body.message.should.equal('A group with that id does not exist');
    });

    it('should update an existing log with user-details for a group thats deleted by a logged-in user', async function () {
      response = await agent.delete(`/api/groups/${groupObject._id}`)
        .auth(validUser.username, validUser.password)
        .expect(200);
      response.body._id.should.have.length(24);
      response.body._id.should.equal(groupObject._id.toString());

      logReturned = await History.findOne({ associated_id: response.body._id }).exec();
      logReturned.originalData.should.not.equal(undefined);
      logReturned.originalData.name.should.equal(groupObject.name);

      logReturned.updates.should.be.instanceof(Array).and.have.lengthOf(0);
      logReturned.deletedAt.should.not.equal(undefined);
      logReturned.deletedBy.should.not.equal(undefined);
      logReturned.deletedBy.username.should.equal(validUser.username);
      logReturned.deletedBy.email.should.equal(validUser.email);
    });

    it('should create a log with defined user-details for a group that gets deleted by a logged-in user', async function () {
      // clear logs and verify
      await History.remove().exec();
      logReturned = await History.findOne({ associated_id: response.body._id }).exec();
      should.not.exist(logReturned);

      response = await agent.delete(`/api/groups/${groupObject._id}`)
        .auth(validUser.username, validUser.password)
        .expect(200);
      response.body._id.should.have.length(24);
      response.body._id.should.equal(groupObject._id.toString());

      logReturned = await History.findOne({ associated_id: response.body._id }).exec();
      logReturned.originalData.should.not.equal(undefined);
      logReturned.originalData.name.should.equal(groupObject.name);

      logReturned.updates.should.be.instanceof(Array).and.have.lengthOf(0);
      logReturned.deletedAt.should.not.equal(undefined);
      logReturned.deletedBy.should.not.equal(undefined);
      logReturned.deletedBy.username.should.equal(validUser.username);
      logReturned.deletedBy.email.should.equal(validUser.email);
    });
  });

  describe('SEARCH', function () {
    beforeEach(async function () {
      groupObject = new Group(validGroup);
      await groupObject.save();
    });

    it('should not return a group when passing in a valid parameter with a non existent group ID', async function () {
      response = await agent.get('/api/groups?q=_id=5bcdbe7287e21906ed4f12ba').expect(200);
      response.body.length.should.equal(0);
    });

    it('should not return a group when passing in a valid parameter with a non existent parameter', async function () {
      response = await agent.get(`/api/groups?q=${encodeURIComponent(`_id=${groupObject._id}&name=notExisting`)}`).expect(200);
      response.body.length.should.equal(0);
    });

    it('should return an error when not encoding q search parameters', async function () {
      response = await agent.get(`/api/groups?q=._id=${groupObject._id}&name=notExisting`).expect(422);
      response.body.message.should.equal('Improperly structured query. Make sure to use ?q=<key>=<value> syntax');
    });

    it('should return a single group when passing in _id parameter', async function () {
      response = await agent.get(`/api/groups?q=_id=${groupObject._id}`).expect(200);

      response.body[0].should.be.instanceof(Object);
      response.body[0].name.should.equal(groupObject.name);
    });

    it('should not return a group when passing in invalid parameter', async function () {
      response = await agent.get('/api/groups?q=n0nsense=123454321').expect(200);
      response.body.length.should.equal(0);
    });

    it('should return a single group when passing in name parameter', async function () {
      response = await agent.get(`/api/groups?q=name=${groupObject.name}`).expect(200);
      response.body[0].should.be.instanceof(Object);
      response.body[0].name.should.equal(groupObject.name);
    });

    it('should only return fields specified in url', async function () {
      response = await agent.get('/api/groups?fields=name').expect(200);
      response.body.length.should.equal(1);
      for (var key in response.body) {
        if (Object.prototype.hasOwnProperty.call(response.body, key)) {
          Object.prototype.hasOwnProperty.call(response.body[key], 'name').should.equal(true);
        }
      }
    });

    it('should only return fields specified in url using fields and q functionality', async function () {
      response = await agent.get(`/api/groups?fields=name&q=name=${groupObject.name}`).expect(200);
      response.body.length.should.equal(1);
      Object.prototype.hasOwnProperty.call(response.body[0], 'name').should.equal(true);
      response.body[0].name.should.equal(groupObject.name);
    });

    it('should return an error message when query has invalid search key blah', async function () {
      response = await agent.get(`/api/groups?q=name=${groupObject.name}&fields=name&blah=blah`).expect(422);
      response.body.message.should.equal('Improperly structured query. Make sure to use ?q=<key>=<value> syntax');
    });

    it('should return an error message when queried with an improper search', async function () {
      response = await agent.get(`/api/groups?name=${groupObject.name}`).expect(422);
      response.body.message.should.equal('Improperly structured query. Make sure to use ?q=<key>=<value> syntax');
    });

    it('should return an error message when queried with an empty q=', async function () {
      response = await agent.get('/api/groups?q=').expect(422);
      response.body.message.should.equal('Improperly structured query. Make sure to use ?q=<key>=<value> syntax');
    });

    it('should return an error message when queried with an empty fields=', async function () {
      response = await agent.get('/api/groups?fields=').expect(422);
      response.body.message.should.equal('Improperly structured query. Make sure to use ?q=<key>=<value> syntax');
    });

    it('should return an error message when queried with an empty fields= and q=', async function () {
      response = await agent.get('/api/groups?q=&fields=').expect(422);
      response.body.message.should.equal('Improperly structured query. Make sure to use ?q=<key>=<value> syntax');
    });
  });

  afterEach(async function () {
    await Document.remove().exec();
    await Group.remove().exec();
    await History.remove().exec();
    await User.remove().exec();
    await Schema.remove().exec();
  });
});
