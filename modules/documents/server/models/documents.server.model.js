'use strict';

var Ajv = require('ajv');
var draft06Schema = require('ajv/lib/refs/json-schema-draft-06.json');
var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
var _ = require('lodash');
var Schema = require('../../../schemas/server/models/schemas.server.model.js').Schema;
var Label = require('../../../labels/server/models/labels.server.model.js').Schema;
var commonValidators = require('../../../core/server/controllers/validators.server.controller');

var MongooseSchema = mongoose.Schema;
var MongooseHistory = require('../../../history/server/plugins/history.server.plugin');
var ajv = new Ajv({
  unknownFormats: true,
  allErrors: true
});
ajv.addMetaSchema(draft06Schema);

var Document = new MongooseSchema({
  schema_id: {
    type: MongooseSchema.ObjectId,
    ref: 'Schema'
  },
  name: {
    type: String,
    trim: true,
    required: true,
    unique: true,
    minlength: 5,
    maxlength: 80,
    validate: commonValidators.objectNameValidator
  },
  useexternalnfs: {
    type: Boolean,
    required: true,
    default: false
  },
  autopopulate: {
    type: Boolean,
    required: true,
    default: true
  },
  dns: {
    type: Boolean,
    required: true,
    default: true
  },
  overcommit: {
    type: Boolean,
    required: true,
    default: false
  },
  vio: {
    type: Boolean,
    required: true,
    default: false
  },
  vioTransportOnly: {
    type: Boolean,
    required: true,
    default: false
  },
  vioOptimizedTransportOnly: {
    type: Boolean,
    required: true,
    default: false
  },
  vioMultiTech: {
    type: Boolean,
    required: true,
    default: false
  },
  ipv6: {
    type: Boolean,
    required: true,
    default: true
  },
  ha: {
    type: Boolean,
    required: false
  },
  managedconfig: {
    type: Boolean,
    required: true,
    default: false
  },
  managedconfigs: [{
    type: MongooseSchema.ObjectId,
    ref: 'Document'
  }],
  labels: [{
    type: String,
    trim: true,
    required: true
  }],
  content: {
    type: Object,
    trim: true,
    required: true
  },
  isFFE: {
    type: Boolean,
    default: false
  }
}, {
  strict: 'throw',
  minimize: false,
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

Document.plugin(uniqueValidator, { message: 'Error, provided name is not unique.' });

Document.pre('save', async function (next) {
  try {
    var document = this;
    // reverse content object when resaving
    if (!document.isNew && document.content) {
      document.content = reverseContentObject(document.content);
    }
    if (document.vioTransportOnly === true && document.vioMultiTech === true) {
      throw new Error('Both Small Integrated ENM Transport Only and Multi-technology can not be selected.');
    }
    // Remove all Keys that are empty
    document = removeAllEmptyKeysFromObject(document);
    var schema = await Schema.findOne({ _id: document.schema_id }).exec();
    if (document.managedconfig) {
      removeKeyFromObject(schema.content, 'required');
    }
    var schemaContent = schema.content;

    if (document.useexternalnfs) {
      schemaContent = dynamnicallyUpdateUseExternalNfsDefinitions(schema.content);
    }
    var validate = ajv.compile(schema.content);
    var valid = validate(document.content);
    if (!valid) {
      return await Promise.reject(new Error(`There were ${validate.errors.length} errors found when validating the given document \
against the schema: ${JSON.stringify(validate.errors)}`));
    }
    if (document.labels.length > 0) {
      if (_.uniq(document.labels).length !== document.labels.length) {
        return await Promise.reject(new Error('There are duplicate labels assigned to this document.'));
      }
      var labelList = await Label.find({}).exec();
      var errorMessage;
      for (var d = 0; d < document.labels.length; d += 1) {
        if (!findLabelInArray(labelList, document.labels[d])) {
          errorMessage = `Label '${document.labels[d]}' does not exist!`;
          break;
        }
      }
      if (errorMessage) {
        return await Promise.reject(new Error(errorMessage));
      }
    }
    return next();
  } catch (error) {
    return next(error);
  }
});

function removeKeyFromObject(obj, key) {
  for (var property in obj) {
    if (property === key) {
      delete obj[property];
    } else if (typeof obj[property] === 'object') {
      removeKeyFromObject(obj[property], key);
    }
  }
}

function removeAllEmptyKeysFromObject(document) {
  if (document.managedconfig || !document.content.parameters) {
    return document;
  }
  for (var key in document.content.parameters) {
    if (Object.prototype.hasOwnProperty.call(document.content.parameters, key)) {
      if (!document.content.parameters[key]) {
        delete document.content.parameters[key];
      }
    }
  }
  return document;
}

function findLabelInArray(labelList, docLabel) {
  for (var label in labelList) {
    if (labelList[label].name === docLabel) {
      return true;
    }
  }
  return false;
}

function dynamnicallyUpdateUseExternalNfsDefinitions(schemaContent) {
  var useExternalNfsExportedFsDefinition = { pattern: '^.+$' };
  var useExternalNfsServerDefinition = { pattern: '^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\\.[a-z0-9](?:[-0-9a-z]{0,61}[0-9a-z])?)*$' };
  _.merge(schemaContent.definitions.nfs_exported_fs, useExternalNfsExportedFsDefinition);
  _.merge(schemaContent.definitions.external_nfs_server, useExternalNfsServerDefinition);
  return schemaContent;
}

function reverseContentObject(content) {
  var returnObj = {};
  Object.keys(content).reverse().forEach(function (key) {
    returnObj[key] = content[key];
  });
  return returnObj;
}

Document.plugin(MongooseHistory);

module.exports.Schema = mongoose.model('Document', Document);
