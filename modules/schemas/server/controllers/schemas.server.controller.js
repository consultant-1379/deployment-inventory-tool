'use strict';

var commonController = require('../../../core/server/controllers/common.server.controller');
var Document = require('../../../documents/server/models/documents.server.model').Schema;
var dependentModelsDetails = [{ modelObject: Document, modelKey: 'schema_id' }];
var sortOrder = '-_id';
var Schema = require('../models/schemas.server.model').Schema;
commonController = commonController(Schema, dependentModelsDetails, sortOrder);

exports.create = commonController.create;
exports.read = commonController.read;
exports.list = commonController.list;
exports.delete = commonController.delete;
exports.findById = commonController.findById;
