'use strict';

var fs = require('fs'),
  should = require('should'),
  superagentDefaults = require('superagent-defaults'),
  supertest = require('supertest'),
  mongoose = require('mongoose'),
  _ = require('lodash'),
  History = require('../../../history/server/models/history.server.model').getSchema('labels'),
  Label = mongoose.model('Label'),
  Schema = mongoose.model('Schema'),
  Document = mongoose.model('Document'),
  User = mongoose.model('User'),
  express = require('../../../../config/lib/express');

var app,
  agent,
  nonAuthAgent,
  validLabel,
  badLabel,
  labelReturned,
  labelObject,
  validLabel2,
  label2Object,
  validSchema,
  validDocument,
  dependentDocument,
  schemaObject,
  count,
  response,
  logReturned,
  validUser,
  userObject;

describe('Labels', function () {
  before(async function () {
    app = express.init(mongoose);
    nonAuthAgent = superagentDefaults(supertest.agent(app));
    agent = superagentDefaults(supertest.agent(app));
  });
  beforeEach(async function () {
    validSchema = JSON.parse(fs.readFileSync('/opt/mean.js/modules/labels/tests/server/test_files/valid_schema.json', 'utf8'));
    validDocument = JSON.parse(fs.readFileSync('/opt/mean.js/modules/labels/tests/server/test_files/valid_document.json', 'utf8'));
    validUser = JSON.parse(fs.readFileSync('/opt/mean.js/modules/deployments/tests/server/test_files/valid_user.json', 'utf8'));

    validLabel = {
      name: 'labelName',
      category: 'size'
    };
    userObject = new User(validUser);
    await userObject.save();

    // Authorise User
    agent.auth(validUser.username, validUser.password);
  });
  describe('POST', function () {
    it('should not create a new Label when user is not authenticated', async function () {
      response = await nonAuthAgent.post('/api/labels').send(validLabel).expect(401);
      response.body.message.should.equal('User must be logged in');
    });

    it('should create a new Label and check db', async function () {
      response = await agent.post('/api/labels').send(validLabel).expect(201);
      response.body._id.should.have.length(24);
      response.headers.location.should.equal(`/api/labels/${response.body._id}`);
      response.body.name.should.equal(validLabel.name);
      labelReturned = await Label.findById(response.body._id).exec();
      labelReturned.name.should.equal(validLabel.name);
      labelReturned.category.should.equal(validLabel.category);
    });

    it('should create a new Label with other when category is not provided', async function () {
      delete validLabel.category;
      response = await agent.post('/api/labels').send(validLabel).expect(201);
      response.body._id.should.have.length(24);
      response.headers.location.should.equal(`/api/labels/${response.body._id}`);
      response.body.name.should.equal(validLabel.name);
      response.body.category.should.equal('other');
      labelReturned = await Label.findById(response.body._id).exec();
      labelReturned.name.should.equal(validLabel.name);
      labelReturned.category.should.equal('other');
    });

    it('should not post more than one label with the same name', async function () {
      labelObject = new Label(validLabel);
      labelReturned = await labelObject.save();
      response = await agent.post('/api/labels').send(validLabel).expect(400);
      response.body.message.should.equal('Error, provided name is not unique.');
    });

    it('should not post label with a name less than 2 characters', async function () {
      badLabel = _.cloneDeep(validLabel);
      badLabel.name = 'x';
      response = await agent.post('/api/labels').send(badLabel).expect(400);
      response.body.message.should.equal(`Path \`name\` (\`${badLabel.name}\`) is shorter than the minimum allowed length (2).`);
    });

    it('should not post label with a name more than 50 characters', async function () {
      badLabel = _.cloneDeep(validLabel);
      badLabel.name = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
      response = await agent.post('/api/labels').send(badLabel).expect(400);
      response.body.message.should.equal(`Path \`name\` (\`${badLabel.name}\`) is longer than the maximum allowed length (50).`);
    });

    it('should not allow a label with a non-alphanumeric-underscored name', async function () {
      badLabel = _.cloneDeep(validLabel);
      badLabel.name = '!£$%&';
      response = await agent.post('/api/labels').send(badLabel).expect(400);
      response.body.message.should.equal('name is not valid; \'!£$%&\' can only contain letters, numbers, dots, dashes and underscores.');
    });

    it('should not post a label without a name key', async function () {
      badLabel = _.cloneDeep(validLabel);
      delete badLabel.name;
      response = await agent.post('/api/labels').send(badLabel).expect(400);
      response.body.message.should.equal('Path `name` is required.');
    });

    it('should not post a label with unknown key', async function () {
      badLabel = _.cloneDeep(validLabel);
      badLabel.rogueKey = 'rogueValue';
      response = await agent.post('/api/labels').send(badLabel).expect(400);
      response.body.message.should.equal('Field `rogueKey` is not in schema and strict mode is set to throw.');
    });

    it('should respond with bad request with invalid json', async function () {
      badLabel = '{';
      response = await agent.post('/api/labels').send(badLabel).type('json').expect(400);
      response.body.message.should.equal('There was a syntax error found in your request, please make sure that it is valid and try again');
    });

    it('should post a new log with user-details when a label is created by a logged-in user', async function () {
      response = await agent.post('/api/labels').auth(validUser.username, validUser.password).send(validLabel).expect(201);
      response.body._id.should.have.length(24);
      response.headers.location.should.equal(`/api/labels/${response.body._id}`);
      response.body.name.should.equal(validLabel.name);
      labelReturned = await Label.findById(response.body._id).exec();
      labelReturned.name.should.equal(validLabel.name);

      logReturned = await History.findOne({ associated_id: response.body._id }).exec();
      logReturned.originalData.should.not.equal(undefined);
      logReturned.originalData.name.should.equal(validLabel.name);
      logReturned.createdAt.should.not.equal(undefined);
      logReturned.createdBy.should.not.equal(undefined);
      logReturned.createdBy.username.should.equal(validUser.username);
      logReturned.createdBy.email.should.equal(validUser.email);
      logReturned.updates.should.be.instanceof(Array).and.have.lengthOf(0);
    });

    it('should not post a new log for a label that is created with a name beginning with \'A_Health_\'', async function () {
      var validLabelHealth = _.cloneDeep(validLabel);
      validLabelHealth.name = 'A_Health_Label';
      response = await agent.post('/api/labels').send(validLabelHealth).expect(201);
      response.body._id.should.have.length(24);
      response.headers.location.should.equal(`/api/labels/${response.body._id}`);
      response.body.name.should.equal(validLabelHealth.name);

      labelReturned = await Label.findById(response.body._id).exec();
      labelReturned.name.should.equal(validLabelHealth.name);

      logReturned = await History.findOne({ associated_id: response.body._id }).exec();
      should.not.exist(logReturned);
    });

    it('should throw error when invalid category is provided', async function () {
      validLabel.category = 'fake';
      response = await agent.post('/api/labels').send(validLabel).expect(422);
      response.body.message.should.containEql('Cannot create the Label, the category');
    });
  });

  describe('GET', function () {
    beforeEach(async function () {
      labelObject = new Label(validLabel);
      await labelObject.save();
    });

    it('should be able to get labels when user not authenticated', async function () {
      await nonAuthAgent.get('/api/labels').expect(200);
    });

    it('should be able to get empty label list', async function () {
      labelReturned = await labelObject.remove();
      response = await agent.get('/api/labels').expect(200);
      response.body.should.be.instanceof(Array).and.have.lengthOf(0);
    });

    it('should be able to get label list with one element', async function () {
      response = await agent.get('/api/labels').expect(200);
      response.body.should.be.instanceof(Array).and.have.lengthOf(1);
      response.body[0].name.should.equal(validLabel.name);
      response.body[0].category.should.equal(validLabel.category);
    });

    it('should be able to get label list with more than one element', async function () {
      validLabel2 = _.cloneDeep(validLabel);
      validLabel2.name = 'anotherLabelName';
      label2Object = new Label(validLabel2);
      await label2Object.save();
      response = await agent.get('/api/labels').expect(200);
      response.body.should.be.instanceof(Array).and.have.lengthOf(2);
      response.body[0].name.should.equal(validLabel2.name);
      response.body[1].name.should.deepEqual(validLabel.name);
    });

    it('should be able to get a single label', async function () {
      response = await agent.get(`/api/labels/${labelObject._id}`).expect(200);
      response.body.name.should.equal(validLabel.name);
    });

    it('should throw 404 when id is not in database', async function () {
      response = await agent.get('/api/labels/000000000000000000000000').expect(404);
      response.body.message.should.equal('A label with that id does not exist');
    });

    it('should throw 404 when id is invalid in the database', async function () {
      response = await agent.get('/api/labels/0').expect(404);
      response.body.message.should.equal('A label with that id does not exist');
    });
  });

  describe('PUT', function () {
    beforeEach(async function () {
      labelObject = new Label(validLabel);
      await labelObject.save();
      schemaObject = new Schema(validSchema);
      await schemaObject.save();
    });

    it('should not update a Label when user is not authenticated', async function () {
      validLabel2 = _.cloneDeep(validLabel);
      validLabel2.name = 'updatedName';
      validLabel2.category = 'site';
      response = await nonAuthAgent.put('/api/labels/' + labelObject._id).send(validLabel2).expect(401);
      response.body.message.should.equal('User must be logged in');
    });

    it('should update a label', async function () {
      validLabel2 = _.cloneDeep(validLabel);
      validLabel2.name = 'updatedName';
      validLabel2.category = 'site';
      response = await agent.put(`/api/labels/${labelObject._id}`).send(validLabel2).expect(200);
      response.body.name.should.equal(validLabel2.name);
      response.body.category.should.equal(validLabel2.category);
    });

    it('should not update a label category when category is not provided', async function () {
      validLabel2 = _.cloneDeep(validLabel);
      validLabel2.name = 'updatedName';
      delete validLabel2.category;
      response = await agent.put(`/api/labels/${labelObject._id}`).send(validLabel2).expect(200);
      response.body.name.should.equal(validLabel2.name);
      response.body.category.should.equal('size');
    });

    it('should not update a label name when name is not provided', async function () {
      validLabel2 = _.cloneDeep(validLabel);
      delete validLabel2.name;
      validLabel2.category = 'site';
      response = await agent.put(`/api/labels/${labelObject._id}`).send(validLabel2).expect(200);
      response.body.name.should.equal(validLabel.name);
      response.body.category.should.equal('site');
    });

    it('should throw error when label name already exist', async function () {
      validLabel2 = _.cloneDeep(validLabel);
      validLabel2.name = 'updatedName';
      response = await agent.post('/api/labels').send(validLabel2).expect(201);
      validLabel2 = _.cloneDeep(validLabel);
      validLabel2.name = 'labelName';
      response = await agent.put(`/api/labels/${response.body._id}`).send(validLabel2).expect(400);
      response.body.message.should.containEql('Error, provided name is not unique.');
    });

    it('should throw error when invalid category is provided', async function () {
      validLabel2 = _.cloneDeep(validLabel);
      validLabel2.name = 'updatedTheName';
      validLabel2.category = 'fake';
      response = await agent.put(`/api/labels/${labelObject._id}`).send(validLabel2).expect(422);
      response.body.message.should.containEql('Cannot update the Label, the category');
    });

    it('should fail when attempting to edit a label name which has dependent documents', async function () {
      validDocument.schema_id = schemaObject._id;
      validDocument.managedconfig = true;
      validDocument.labels = [
        validLabel.name
      ];
      dependentDocument = new Document(validDocument);
      await dependentDocument.save();

      validLabel2 = _.cloneDeep(validLabel);
      validLabel2.name = 'updatedName';
      response = await agent.put(`/api/labels/${labelObject._id}`).send(validLabel2).expect(422);
      response.body.message.should.equal('Can\'t edit label\'s name, it has 1 dependent documents');
    });
  });

  describe('DELETE', function () {
    beforeEach(async function () {
      labelObject = new Label(validLabel);
      labelReturned = await labelObject.save();
      schemaObject = new Schema(validSchema);
      await schemaObject.save();
    });

    it('should not delete a Label when user is not authenticated', async function () {
      response = await nonAuthAgent.delete('/api/labels/' + labelObject._id).expect(401);
      response.body.message.should.equal('User must be logged in');
    });

    it('should delete a label and check its response and the db', async function () {
      response = await agent.delete(`/api/labels/${labelObject._id}`).expect(200);
      response.body.should.be.instanceof(Object);
      response.body.name.should.equal(labelObject.name);
      count = await Label.count().exec();
      count.should.equal(0);
    });

    it('should fail when attempting to delete a label that does not exist', async function () {
      response = await agent.delete('/api/labels/000000000000000000000000').expect(404);
      response.body.message.should.equal('A label with that id does not exist');
    });

    it('should fail when attempting to delete a label which has dependent documents', async function () {
      validDocument.schema_id = schemaObject._id;
      validDocument.managedconfig = true;
      validDocument.labels = [
        validLabel.name
      ];
      dependentDocument = new Document(validDocument);
      await dependentDocument.save();

      response = await agent.delete(`/api/labels/${labelObject._id}`).expect(422);
      response.body.message.should.equal('Can\'t delete label, it has 1 dependent documents');
      count = await Label.count().exec();
      count.should.equal(1);
    });

    it('should update an existing log with user-details for a label thats deleted by a logged-in user', async function () {
      response = await agent.delete(`/api/labels/${labelObject._id}`)
        .auth(validUser.username, validUser.password)
        .expect(200);
      response.body._id.should.have.length(24);
      response.body._id.should.equal(labelObject._id.toString());

      logReturned = await History.findOne({ associated_id: response.body._id }).exec();
      logReturned.originalData.should.not.equal(undefined);
      logReturned.originalData.name.should.equal(validLabel.name);

      logReturned.updates.should.be.instanceof(Array).and.have.lengthOf(0);
      logReturned.deletedAt.should.not.equal(undefined);
      logReturned.deletedBy.should.not.equal(undefined);
      logReturned.deletedBy.username.should.equal(validUser.username);
      logReturned.deletedBy.email.should.equal(validUser.email);
    });

    it('should create a log with defined user-details for a label that gets deleted by a logged-in user', async function () {
      // clear logs and verify
      await History.remove().exec();
      logReturned = await History.findOne({ associated_id: response.body._id }).exec();
      should.not.exist(logReturned);

      response = await agent.delete(`/api/labels/${labelObject._id}`)
        .auth(validUser.username, validUser.password)
        .expect(200);
      response.body._id.should.have.length(24);
      response.body._id.should.equal(labelObject._id.toString());

      logReturned = await History.findOne({ associated_id: response.body._id }).exec();
      logReturned.originalData.should.not.equal(undefined);
      logReturned.originalData.name.should.equal(validLabel.name);

      logReturned.updates.should.be.instanceof(Array).and.have.lengthOf(0);
      logReturned.deletedAt.should.not.equal(undefined);
      logReturned.deletedBy.should.not.equal(undefined);
      logReturned.deletedBy.username.should.equal(validUser.username);
      logReturned.deletedBy.email.should.equal(validUser.email);
    });
  });

  describe('SEARCH', function () {
    beforeEach(async function () {
      labelObject = new Label(validLabel);
      await labelObject.save();
    });

    it('should not return a label when passing in a valid parameter with a non existent label ID', async function () {
      response = await agent.get('/api/labels?q=_id=5bcdbe7287e21906ed4f12ba').expect(200);
      response.body.length.should.equal(0);
    });

    it('should not return a label when passing in a valid parameter with a non existent parameter', async function () {
      response = await agent.get(`/api/labels?q=${encodeURIComponent(`_id=${labelObject._id}&name=notExisting`)}`)
        .expect(200);
      response.body.length.should.equal(0);
    });

    it('should return an error when not encoding q search parameters', async function () {
      response = await agent.get(`/api/labels?q=._id=${labelObject._id}&name=notExisting`).expect(422);
      response.body.message.should.equal('Improperly structured query. Make sure to use ?q=<key>=<value> syntax');
    });

    it('should return a single label when passing in _id parameter', async function () {
      response = await agent.get(`/api/labels?q=_id=${labelObject._id}`).expect(200);
      response.body[0].should.be.instanceof(Object);
      response.body[0].name.should.equal(labelObject.name);
    });

    it('should not return a label when passing in invalid parameter', async function () {
      response = await agent.get('/api/labels?q=n0nsense=123454321').expect(200);
      response.body.length.should.equal(0);
    });

    it('should return a single label when passing in name parameter', async function () {
      response = await agent.get(`/api/labels?q=name=${labelObject.name}`).expect(200);
      response.body[0].should.be.instanceof(Object);
      response.body[0].name.should.equal(labelObject.name);
    });

    it('should only return fields specified in url', async function () {
      response = await agent.get('/api/labels?fields=name').expect(200);
      response.body.length.should.equal(1);
      for (var key in response.body) {
        if (Object.prototype.hasOwnProperty.call(response.body, key)) {
          Object.prototype.hasOwnProperty.call(response.body[key], 'name').should.equal(true);
        }
      }
    });

    it('should only return fields specified in url using fields and q functionality', async function () {
      response = await agent.get(`/api/labels?fields=name&q=name=${labelObject.name}`).expect(200);
      response.body.length.should.equal(1);
      Object.prototype.hasOwnProperty.call(response.body[0], 'name').should.equal(true);
      response.body[0].name.should.equal(labelObject.name);
    });

    it('should return an error message when query has invalid search key blah', async function () {
      response = await agent.get(`/api/labels?q=name=${labelObject.name}&fields=name&blah=blah`).expect(422);
      response.body.message.should.equal('Improperly structured query. Make sure to use ?q=<key>=<value> syntax');
    });

    it('should return an error message when queried with an improper search', async function () {
      response = await agent.get(`/api/labels?name=${labelObject.name}`).expect(422);
      response.body.message.should.equal('Improperly structured query. Make sure to use ?q=<key>=<value> syntax');
    });

    it('should return an error message when queried with an empty q=', async function () {
      response = await agent.get('/api/documents?q=').expect(422);
      response.body.message.should.equal('Improperly structured query. Make sure to use ?q=<key>=<value> syntax');
    });

    it('should return an error message when queried with an empty fields=', async function () {
      response = await agent.get('/api/labels?fields=').expect(422);
      response.body.message.should.equal('Improperly structured query. Make sure to use ?q=<key>=<value> syntax');
    });

    it('should return an error message when queried with an empty fields= and q=', async function () {
      response = await agent.get('/api/labels?q=&fields=').expect(422);
      response.body.message.should.equal('Improperly structured query. Make sure to use ?q=<key>=<value> syntax');
    });
  });

  afterEach(async function () {
    await User.remove().exec();
    await Schema.remove().exec();
    await Document.remove().exec();
    await Label.remove().exec();
    await History.remove().exec();
  });
});
