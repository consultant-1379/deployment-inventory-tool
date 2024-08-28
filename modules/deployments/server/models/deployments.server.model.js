'use strict';

var mongoose = require('mongoose');
var MongooseSchema = mongoose.Schema;
var uniqueValidator = require('mongoose-unique-validator');
var config = require('../../../../config/config');
var Document = require('../../../documents/server/models/documents.server.model.js').Schema;
var Schema = require('../../../schemas/server/models/schemas.server.model.js').Schema;
var Project = require('../../../projects/server/models/projects.server.model.js').Schema;
var commonValidators = require('../../../core/server/controllers/validators.server.controller');
var MongooseHistory = require('../../../history/server/plugins/history.server.plugin');

var AssociatedDocumentSchema = new MongooseSchema({
  _id: false,
  schema_name: {
    type: String,
    required: true
  },
  schema_category: {
    type: String,
    enum: ['vnflcm', 'other', 'cenm'],
    default: 'other',
    required: true
  },
  document_id: {
    type: MongooseSchema.ObjectId,
    ref: 'Document',
    required: true
  }
}, { strict: 'throw' });

var Deployment = new MongooseSchema({
  name: {
    type: String,
    required: true,
    unique: true,
    validate: commonValidators.objectNameValidator
  },
  project_id: {
    type: MongooseSchema.ObjectId,
    ref: 'Project',
    required: true,
    unique: true
  },
  enm: {
    sed_id: {
      type: MongooseSchema.ObjectId,
      ref: 'Document',
      required: true,
      unique: true
    },
    public_key: String,
    private_key: String
  },
  jira_issues: [{
    type: String,
    trim: true,
    minlength: 3,
    maxlength: 60
  }],
  documents: {
    type: [AssociatedDocumentSchema]
  }
}, { strict: 'throw' });

Deployment.plugin(uniqueValidator, { message: 'Error, provided {PATH} is not unique.' });

async function findOneDocument(documentId) {
  return Document.findOne({ _id: documentId }).populate({ path: 'schema_id' }).exec();
}

async function countProjects(deployment) {
  return Project.count({ _id: deployment.project_id }).exec();
}

async function validateDocument(foundDocument, documentId) {
  var schemaCategories = ['enm', 'cenm'];
  if (!foundDocument) return Promise.reject(new Error(`A document with that id '${documentId}' does not exist`));
  if (!schemaCategories.includes(foundDocument.schema_id.category)) {
    return Promise.reject(new Error(`Schema's category of document '${foundDocument.name}' is \
'${foundDocument.schema_id.category}' but should have a schema with a category of 'enm' or 'cenm'.`));
  }
  if (foundDocument.managedconfig) return Promise.reject(new Error('A managed config cannot be directly associated with a deployment.'));
}

Deployment.pre('save', async function (next) {
  try {
    var deployment = this;
    var foundSedDocument = await findOneDocument(deployment.enm.sed_id);
    await validateDocument(foundSedDocument, deployment.enm.sed_id);
    var projectCount = await countProjects(deployment);
    if (projectCount === 0) {
      return await Promise.reject(new Error(`A project with id '${deployment.project_id}' does not exist`));
    }

    return next();
  } catch (error) {
    return next(error);
  }
});

Deployment.plugin(MongooseHistory);

module.exports.Schema = mongoose.model('Deployment', Deployment);
