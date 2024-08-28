'use strict';

var Group = require('../models/groups.server.model').Schema;
var commonController = require('../../../core/server/controllers/common.server.controller');

var dependentModelsDetails = [];
var sortOrder = 'name';
commonController = commonController(Group, dependentModelsDetails, sortOrder);

exports.create = commonController.create;
exports.read = commonController.read;
exports.list = commonController.list;
exports.findById = commonController.findById;
exports.delete = commonController.delete;
exports.update = commonController.update;
