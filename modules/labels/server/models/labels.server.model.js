'use strict';

var mongoose = require('mongoose');
var MongooseSchema = mongoose.Schema;
var uniqueValidator = require('mongoose-unique-validator');
var commonValidators = require('../../../core/server/controllers/validators.server.controller');
var MongooseHistory = require('../../../history/server/plugins/history.server.plugin');

var Label = new MongooseSchema({
  name: {
    type: 'string',
    trim: true,
    required: true,
    unique: true,
    minlength: 2,
    maxlength: 50,
    validate: commonValidators.objectNameValidator
  },
  category: {
    type: String,
    enum: ['size', 'site', 'other'],
    default: 'other'
  }
}, { strict: 'throw' });

Label.plugin(uniqueValidator, { message: 'Error, provided name is not unique.' });

Label.plugin(MongooseHistory);

module.exports.Schema = mongoose.model('Label', Label);
