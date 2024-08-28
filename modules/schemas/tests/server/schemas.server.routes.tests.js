'use strict';

var fs = require('fs'),
  should = require('should'),
  superagentDefaults = require('superagent-defaults'),
  supertest = require('supertest'),
  mongoose = require('mongoose'),
  _ = require('lodash'),
  History = require('../../../history/server/models/history.server.model').getSchema('schemas'),
  Schema = mongoose.model('Schema'),
  Document = mongoose.model('Document'),
  User = mongoose.model('User'),
  express = require('../../../../config/lib/express');

var app,
  agent,
  nonAuthAgent,
  validSchema,
  validSchema2,
  validDocument,
  dependentDocument,
  badSchema,
  schemaObject,
  schema2Object,
  schemaReturned,
  count,
  response,
  logReturned,
  validUser,
  userObject;

describe('Schemas', function () {
  before(async function () {
    app = express.init(mongoose);
    nonAuthAgent = superagentDefaults(supertest.agent(app));
    agent = superagentDefaults(supertest.agent(app));
  });
  beforeEach(async function () {
    validSchema = JSON.parse(fs.readFileSync('/opt/mean.js/modules/schemas/tests/server/test_files/valid_schema.json', 'utf8'));
    validUser = JSON.parse(fs.readFileSync('/opt/mean.js/modules/deployments/tests/server/test_files/valid_user.json', 'utf8'));
    validDocument = JSON.parse(fs.readFileSync('/opt/mean.js/modules/schemas/tests/server/test_files/valid_document.json', 'utf8'));
    userObject = new User(validUser);
    await userObject.save();

    // Authorise User
    agent.auth(validUser.username, validUser.password);
  });
  describe('POST', function () {
    it('should not create a new Schema when user is not authenticated', async function () {
      response = await nonAuthAgent.post('/api/schemas').send(validSchema).expect(401);
      response.body.message.should.equal('User must be logged in');
    });

    it('should create a new schema and check db', async function () {
      response = await agent.post('/api/schemas').send(validSchema).expect(201);
      response.body._id.should.have.length(24);
      response.headers.location.should.equal(`/api/schemas/${response.body._id}`);
      response.body.version.should.equal(validSchema.version);
      response.body.content.should.deepEqual(validSchema.content);
      schemaReturned = await Schema.findById(response.body._id).exec();
      schemaReturned.version.should.equal(validSchema.version);
      schemaReturned.content.should.deepEqual(validSchema.content);
      var currentDate = new Date();
      var createdAtDate = new Date(schemaReturned.created_at);
      var updatedAtDate = new Date(schemaReturned.updated_at);
      var createdAtDateDifference = currentDate.getTime() - createdAtDate.getTime();
      var updatedAtDateDifference = currentDate.getTime() - updatedAtDate.getTime();
      createdAtDateDifference.should.be.lessThanOrEqual(2000);
      updatedAtDateDifference.should.be.lessThanOrEqual(2000);
    });

    it('should create a new \'cenm\' schema and check db', async function () {
      validSchema.name = 'cenm_site';
      response = await agent.post('/api/schemas').send(validSchema).expect(201);
      response.body._id.should.have.length(24);
      response.headers.location.should.equal(`/api/schemas/${response.body._id}`);
      response.body.version.should.equal(validSchema.version);
      response.body.content.should.deepEqual(validSchema.content);
      response.body.name.should.deepEqual(validSchema.name);
      response.body.category.should.deepEqual('cenm');
      schemaReturned = await Schema.findById(response.body._id).exec();
      schemaReturned.version.should.equal(validSchema.version);
      schemaReturned.content.should.deepEqual(validSchema.content);
      var currentDate = new Date();
      var createdAtDate = new Date(schemaReturned.created_at);
      var updatedAtDate = new Date(schemaReturned.updated_at);
      var createdAtDateDifference = currentDate.getTime() - createdAtDate.getTime();
      var updatedAtDateDifference = currentDate.getTime() - updatedAtDate.getTime();
      createdAtDateDifference.should.be.lessThanOrEqual(2000);
      updatedAtDateDifference.should.be.lessThanOrEqual(2000);
    });

    it('should not be able to create a new schema with invalid meta schema', async function () {
      badSchema = _.cloneDeep(validSchema);
      badSchema.content.$schema = 'http://json-schema.org/draft-0x/schema#';
      response = await agent.post('/api/schemas').send(badSchema).expect(422);
      response.body.message.should.equal('no schema with key or ref "http://json-schema.org/draft-0x/schema#"');
      count = await Schema.count().exec();
      count.should.equal(0);
    });

    it('should not post more than one schema with the same name and version', async function () {
      schemaObject = new Schema(validSchema);
      schemaReturned = await schemaObject.save();
      response = await agent.post('/api/schemas').send(validSchema).expect(400);
      response.body.message.should.equal('Error, provided combination of name and version is not unique.');
    });

    it('should not post schema with an invalid version', async function () {
      badSchema = _.cloneDeep(validSchema);
      badSchema.version = 'badversion';
      response = await agent.post('/api/schemas').send(badSchema).expect(422);
      response.body.message.should.equal('The version you gave is not a valid version');
    });

    it('should not post schema with a name less than 3 characters', async function () {
      badSchema = _.cloneDeep(validSchema);
      badSchema.name = 'xx';
      response = await agent.post('/api/schemas').send(badSchema).expect(400);
      response.body.message.should.equal(`Path \`name\` (\`${badSchema.name}\`) is shorter than the minimum allowed length (3).`);
    });

    it('should not post schema with a name more than 50 characters', async function () {
      badSchema = _.cloneDeep(validSchema);
      badSchema.name = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
      response = await agent.post('/api/schemas').send(badSchema).expect(400);
      response.body.message.should.equal(`Path \`name\` (\`${badSchema.name}\`) is longer than the maximum allowed length (50).`);
    });

    it('should not post schema without a name key', async function () {
      badSchema = _.cloneDeep(validSchema);
      delete badSchema.name;
      response = await agent.post('/api/schemas').send(badSchema).expect(400);
      response.body.message.should.equal('Path `name` is required.');
    });

    it('should not allow a schema with a non-alphanumeric-underscored name', async function () {
      badSchema = _.cloneDeep(validSchema);
      badSchema.name = '!£$%&';
      response = await agent.post('/api/schemas').send(badSchema).expect(400);
      response.body.message.should.equal('name is not valid; \'!£$%&\' can only contain letters, numbers, dots, dashes and underscores.');
    });

    it('should not post schema without a content key', async function () {
      badSchema = _.cloneDeep(validSchema);
      delete badSchema.content;
      response = await agent.post('/api/schemas').send(badSchema).expect(400);
      response.body.message.should.equal('Path `content` is required.');
    });

    it('should not post schema without a version', async function () {
      badSchema = _.cloneDeep(validSchema);
      delete badSchema.version;
      response = await agent.post('/api/schemas').send(badSchema).expect(400);
      response.body.message.should.equal('Path `version` is required.');
    });

    it('should not post schema with unknown key', async function () {
      badSchema = _.cloneDeep(validSchema);
      badSchema.rogueKey = 'rogueValue';
      response = await agent.post('/api/schemas').send(badSchema).expect(400);
      response.body.message.should.equal('Field `rogueKey` is not in schema and strict mode is set to throw.');
    });

    it('should respond with bad request with invalid json', async function () {
      badSchema = '{';
      response = await agent.post('/api/schemas').send(badSchema).type('json').expect(400);
      response.body.message.should.equal('There was a syntax error found in your request, please make sure that it is valid and try again');
    });

    it('should not use given created_at value', async function () {
      badSchema = _.cloneDeep(validSchema);
      badSchema.created_at = '2017-01-16T09:17:01.441Z';
      response = await agent.post('/api/schemas').send(badSchema).expect(201);
      var currentDate = new Date();
      var createdAtDate = new Date(response.body.created_at);
      var createdAtDateDifference = currentDate.getTime() - createdAtDate.getTime();
      createdAtDateDifference.should.be.lessThanOrEqual(2000);
    });

    it('should not use given updated_at value', async function () {
      badSchema = _.cloneDeep(validSchema);
      badSchema.updated_at = '2017-01-16T09:17:01.441Z';
      response = await agent.post('/api/schemas').send(badSchema).expect(201);
      var currentDate = new Date();
      var updatedAtDate = new Date(response.body.updated_at);
      var updatedAtDateDifference = currentDate.getTime() - updatedAtDate.getTime();
      updatedAtDateDifference.should.be.lessThanOrEqual(2000);
    });

    it('should post a new log with user-details when a schema is created by a logged-in user', async function () {
      response = await agent.post('/api/schemas').auth(validUser.username, validUser.password).send(validSchema).expect(201);
      response.body._id.should.have.length(24);
      response.headers.location.should.equal(`/api/schemas/${response.body._id}`);
      response.body.version.should.equal(validSchema.version);
      response.body.content.should.deepEqual(validSchema.content);
      schemaReturned = await Schema.findById(response.body._id).exec();
      schemaReturned.version.should.equal(validSchema.version);
      schemaReturned.content.should.deepEqual(validSchema.content);

      logReturned = await History.findOne({ associated_id: response.body._id }).exec();
      logReturned.originalData.should.not.equal(undefined);
      logReturned.originalData.version.should.equal(validSchema.version);
      logReturned.originalData.content.toString().should.equal(validSchema.content.toString());
      logReturned.originalData.name.should.equal(validSchema.name);
      logReturned.createdAt.should.not.equal(undefined);
      logReturned.createdBy.should.not.equal(undefined);
      logReturned.createdBy.username.should.equal(validUser.username);
      logReturned.createdBy.email.should.equal(validUser.email);
      logReturned.updates.should.be.instanceof(Array).and.have.lengthOf(0);
    });

    it('should not post a new log for a schema that is created with a name beginning with \'A_Health_\'', async function () {
      var validSchemaHealth = _.cloneDeep(validSchema);
      validSchemaHealth.name = 'A_Health_Schema';
      response = await agent.post('/api/schemas').send(validSchemaHealth).expect(201);
      response.body._id.should.have.length(24);
      response.headers.location.should.equal(`/api/schemas/${response.body._id}`);
      response.body.name.should.equal(validSchemaHealth.name);

      schemaReturned = await Schema.findById(response.body._id).exec();
      schemaReturned.name.should.equal(validSchemaHealth.name);

      logReturned = await History.findOne({ associated_id: response.body._id }).exec();
      should.not.exist(logReturned);
    });
  });

  describe('GET', function () {
    beforeEach(async function () {
      schemaObject = new Schema(validSchema);
      schemaReturned = await schemaObject.save();
    });

    it('should be able to get schemas when user not authenticated', async function () {
      await nonAuthAgent.get('/api/schemas').expect(200);
    });

    it('should be able to get empty schema list', async function () {
      schemaReturned = await schemaObject.remove();
      response = await agent.get('/api/schemas').expect(200);
      response.body.should.be.instanceof(Array).and.have.lengthOf(0);
    });

    it('should be able to get schema list with one element', async function () {
      response = await agent.get('/api/schemas').expect(200);
      response.body.should.be.instanceof(Array).and.have.lengthOf(1);
      response.body[0].version.should.equal(validSchema.version);
      response.body[0].content.should.deepEqual(validSchema.content);
    });

    it('should be able to get schema list with more than one element', async function () {
      validSchema2 = _.cloneDeep(validSchema);
      validSchema2.version = '3.2.1';
      schema2Object = new Schema(validSchema2);
      await schema2Object.save();
      response = await agent.get('/api/schemas').expect(200);
      response.body.should.be.instanceof(Array).and.have.lengthOf(2);
      response.body[0].version.should.equal(validSchema2.version);
      response.body[0].content.should.deepEqual(validSchema2.content);
      response.body[1].version.should.equal(validSchema.version);
      response.body[1].content.should.deepEqual(validSchema.content);
    });

    it('should be able to get a single schema', async function () {
      response = await agent.get(`/api/schemas/${schemaObject._id}`).expect(200);
      response.body.version.should.equal(validSchema.version);
      response.body.content.should.deepEqual(validSchema.content);
    });

    it('should throw 404 when id is not in database', async function () {
      response = await agent.get('/api/schemas/000000000000000000000000').expect(404);
      response.body.message.should.equal('A schema with that id does not exist');
    });

    it('should throw 404 when id is invalid in the database', async function () {
      response = await agent.get('/api/schemas/0').expect(404);
      response.body.message.should.equal('A schema with that id does not exist');
    });
  });

  describe('PUT', function () {
    beforeEach(async function () {
      schemaObject = new Schema(validSchema);
      schemaReturned = await schemaObject.save();
    });

    it('should return 404 when attempting to update a schema', async function () {
      await agent.put(`/api/schemas/${schemaObject._id}`).send().expect(404);
    });
  });

  describe('DELETE', function () {
    beforeEach(async function () {
      schemaObject = new Schema(validSchema);
      schemaReturned = await schemaObject.save();
    });

    it('should not delete a Schema when user is not authenticated', async function () {
      response = await nonAuthAgent.delete('/api/schemas/' + schemaObject._id).expect(401);
      response.body.message.should.equal('User must be logged in');
    });

    it('should delete a schema and check its response and the db', async function () {
      response = await agent.delete(`/api/schemas/${schemaObject._id}`).expect(200);
      response.body.should.be.instanceof(Object);
      response.body.version.should.equal(schemaObject.version);
      response.body.content.should.deepEqual(schemaObject.content);
      count = await Schema.count().exec();
      count.should.equal(0);
    });

    it('should fail when attempting to delete schema that does not exist', async function () {
      response = await agent.delete('/api/schemas/000000000000000000000000').expect(404);
      response.body.message.should.equal('A schema with that id does not exist');
    });

    it('should fail when attempting to delete a schema which has dependent documents', async function () {
      validDocument.schema_id = schemaObject._id;
      dependentDocument = new Document(validDocument);
      await dependentDocument.save();
      response = await agent.delete(`/api/schemas/${schemaObject._id}`).expect(422);
      response.body.message.should.equal('Can\'t delete schema, it has 1 dependent document');
      count = await Schema.count().exec();
      count.should.equal(1);
    });

    it('should update an existing log with user-details for a schema thats deleted by a logged-in user', async function () {
      response = await agent.delete(`/api/schemas/${schemaObject._id}`)
        .auth(validUser.username, validUser.password)
        .expect(200);
      response.body._id.should.have.length(24);
      response.body._id.should.equal(schemaObject._id.toString());

      logReturned = await History.findOne({ associated_id: response.body._id }).exec();
      logReturned.originalData.should.not.equal(undefined);
      logReturned.originalData.name.should.equal(validSchema.name);

      logReturned.updates.should.be.instanceof(Array).and.have.lengthOf(0);
      logReturned.deletedAt.should.not.equal(undefined);
      logReturned.deletedBy.should.not.equal(undefined);
      logReturned.deletedBy.username.should.equal(validUser.username);
      logReturned.deletedBy.email.should.equal(validUser.email);
    });

    it('should create a log with defined user-details for a schema that gets deleted by a logged-in user', async function () {
      // clear logs and verify
      await History.remove().exec();
      logReturned = await History.findOne({ associated_id: response.body._id }).exec();
      should.not.exist(logReturned);

      response = await agent.delete(`/api/schemas/${schemaObject._id}`)
        .auth(validUser.username, validUser.password)
        .expect(200);
      response.body._id.should.have.length(24);
      response.body._id.should.equal(schemaObject._id.toString());

      logReturned = await History.findOne({ associated_id: response.body._id }).exec();
      logReturned.originalData.should.not.equal(undefined);
      logReturned.originalData.name.should.equal(validSchema.name);

      logReturned.updates.should.be.instanceof(Array).and.have.lengthOf(0);
      logReturned.deletedAt.should.not.equal(undefined);
      logReturned.deletedBy.should.not.equal(undefined);
      logReturned.deletedBy.username.should.equal(validUser.username);
      logReturned.deletedBy.email.should.equal(validUser.email);
    });
  });

  describe('SEARCH', function () {
    beforeEach(async function () {
      schemaObject = new Schema(validSchema);
      await schemaObject.save();
    });

    it('should not return a schema when passing in a valid parameter with a non existent schema ID', async function () {
      response = await agent.get('/api/schemas?q=_id=5bcdbe7287e21906ed4f12ba').expect(200);
      response.body.length.should.equal(0);
    });

    it('should not return a schema when passing in a valid parameter with a non existent parameter', async function () {
      response = await agent.get(`/api/schemas?q=${encodeURIComponent(`_id=${schemaObject._id}&name=notExisting`)}`).expect(200);
      response.body.length.should.equal(0);
    });

    it('should return an error when not encoding q search parameters', async function () {
      response = await agent.get(`/api/schemas?q=._id=${schemaObject._id}&name=notExisting`).expect(422);
      response.body.message.should.equal('Improperly structured query. Make sure to use ?q=<key>=<value> syntax');
    });

    it('should return a single schema when passing in _id parameter', async function () {
      response = await agent.get(`/api/schemas?q=_id=${schemaObject._id}`).expect(200);
      response.body[0].should.be.instanceof(Object);
      response.body[0].name.should.equal(schemaObject.name);
    });

    it('should not return a schema when passing in invalid parameter', async function () {
      response = await agent.get('/api/schemas?q=n0nsense=123454321').expect(200);
      response.body.length.should.equal(0);
    });

    it('should return a single schema when passing in name parameter', async function () {
      response = await agent.get(`/api/schemas?q=name=${schemaObject.name}`).expect(200);
      response.body[0].should.be.instanceof(Object);
      response.body[0].name.should.equal(schemaObject.name);
    });

    it('should only return fields specified in url', async function () {
      response = await agent.get('/api/schemas?fields=name').expect(200);
      response.body.length.should.equal(1);
      for (var key in response.body) {
        if (Object.prototype.hasOwnProperty.call(response.body, key)) {
          Object.prototype.hasOwnProperty.call(response.body[key], 'name').should.equal(true);
        }
      }
    });

    it('should only return fields specified in url using fields and q functionality', async function () {
      response = await agent.get(`/api/schemas?fields=name&q=name=${schemaObject.name}`).expect(200);
      response.body.length.should.equal(1);
      Object.prototype.hasOwnProperty.call(response.body[0], 'name').should.equal(true);
      response.body[0].name.should.equal(schemaObject.name);
    });

    it('should only return nested fields specified in url', async function () {
      response = await agent.get('/api/schemas?fields=content()').expect(200);
      response.body.length.should.equal(1);
      Object.prototype.hasOwnProperty.call(response.body[0], 'content').should.equal(true);
    });

    it('should return an error message when query has invalid search key blah', async function () {
      response = await agent.get(`/api/schemas?q=name=${schemaObject.name}&fields=name&blah=blah`).expect(422);
      response.body.message.should.equal('Improperly structured query. Make sure to use ?q=<key>=<value> syntax');
    });

    it('should return an error message when queried with an improper search', async function () {
      response = await agent.get(`/api/schemas?name=${schemaObject.name}`).expect(422);
      response.body.message.should.equal('Improperly structured query. Make sure to use ?q=<key>=<value> syntax');
    });

    it('should return an error message when queried with an empty q=', async function () {
      response = await agent.get('/api/schemas?q=').expect(422);
      response.body.message.should.equal('Improperly structured query. Make sure to use ?q=<key>=<value> syntax');
    });

    it('should return an error message when queried with an empty fields=', async function () {
      response = await agent.get('/api/schemas?fields=').expect(422);
      response.body.message.should.equal('Improperly structured query. Make sure to use ?q=<key>=<value> syntax');
    });

    it('should return an error message when queried with an empty fields= and q=', async function () {
      response = await agent.get('/api/schemas?q=&fields=').expect(422);
      response.body.message.should.equal('Improperly structured query. Make sure to use ?q=<key>=<value> syntax');
    });
  });

  afterEach(async function () {
    await User.remove().exec();
    await Schema.remove().exec();
    await Document.remove().exec();
    await History.remove().exec();
  });
});
