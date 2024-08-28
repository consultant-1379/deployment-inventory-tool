'use strict';

var mje = require('mongo-json-escape');
var semver = require('semver');
var Ajv = require('ajv');
var ajv = new Ajv({
  allErrors: true
});
var mongoose = require('mongoose');
var MongooseSchema = mongoose.Schema;
var uniqueValidator = require('mongoose-unique-validator');
var draft06Schema = require('ajv/lib/refs/json-schema-draft-06.json');
var commonValidators = require('../../../core/server/controllers/validators.server.controller');
var MongooseHistory = require('../../../history/server/plugins/history.server.plugin');
ajv.addMetaSchema(draft06Schema);

var Schema = new MongooseSchema({
  name: {
    type: String,
    trim: true,
    required: true,
    minlength: 3,
    maxlength: 50,
    validate: commonValidators.objectNameValidator
  },
  version: {
    type: String,
    trim: true,
    required: true
  },
  content: {
    type: Object,
    required: true
  },
  category: {
    type: String,
    enum: ['enm', 'cenm', 'vnflcm', 'other'],
    default: 'other',
    required: true
  }
}, {
  strict: 'throw',
  minimize: false,
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

Schema.index({ name: 1, version: 1 }, { unique: true });

Schema.plugin(uniqueValidator, { message: 'Error, provided combination of name and version is not unique.' });

// Validate schema and escape before saving to the database
Schema.pre('save', function (next) {
  var schema = this;
  schema.category = setSchemaCategory(schema.name);
  try {
    ajv.compile(schema.content);
  } catch (err) {
    return next(err);
  }
  if (!semver.valid(schema.version)) {
    return next(new Error('The version you gave is not a valid version'));
  }
  schema.content = mje.escape(schema.content);
  return next();
});

// Unscape after saving to the database so that if we return the object in the post, its not the escaped version
Schema.post('save', function (schema) {
  schema.content = mje.unescape(schema.content);
});

// Unscape after reading out of the database
Schema.post('init', function (schema) {
  if (schema.content) {
    schema.content = mje.unescape(schema.content);
  }
});

Schema.plugin(MongooseHistory);

module.exports.Schema = mongoose.model('Schema', Schema);

function setSchemaCategory(schemaName) {
  if (schemaName.startsWith('enm_sed')) {
    return 'enm';
  } else if (schemaName.startsWith('cenm_')) {
    return 'cenm';
  } else if (schemaName.startsWith('vnflcm_sed_schema')) {
    return 'vnflcm';
  }
  return 'other';
}
