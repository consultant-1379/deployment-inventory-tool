'use strict';

var _ = require('lodash');
var Label = require('../models/labels.server.model').Schema;
var commonController = require('../../../core/server/controllers/common.server.controller');
var Document = require('../../../documents/server/models/documents.server.model').Schema;
var errorHandler = require('../../../core/server/controllers/errors.server.controller');

var dependentModelsDetails = [];
var sortOrder = 'name';
commonController = commonController(Label, dependentModelsDetails, sortOrder);

exports.read = commonController.read;
exports.list = commonController.list;
exports.findById = commonController.findById;

var categories = ['size', 'site', 'other'];

exports.create = async function (req, res) {
  try {
    commonController.setLoggedInUser(req.user);
    if (req.body.category) {
      var category = req.body.category.toLowerCase();
      if (categories.indexOf(category) === -1) {
        throw new Error(`Cannot create the Label, the category ${req.body.category} is invalid.`);
      }
    }
    var label = new Label(req.body);
    await label.save();
    res.location(`/api/labels/${label._id}`).status(201).json(label);
  } catch (err) {
    var statusCode;
    if (err.name === 'ValidationError' || err.name === 'StrictModeError') {
      statusCode = 400;
    } else {
      statusCode = 422;
    }
    return res.status(statusCode).send({
      message: errorHandler.getErrorMessage(err)
    });
  }
};

exports.update = async function (req, res) {
  try {
    commonController.setLoggedInUser(req.user);
    var dependentInstances = await Document.find({ labels: req.label.name }).exec();
    if (req.label.name !== req.body.name && dependentInstances.length > 0) {
      throw new Error(`Can't edit label's name, it has ${dependentInstances.length} dependent documents`);
    }
    if (req.body.category) {
      var category = req.body.category.toLowerCase();
      if (categories.indexOf(category) === -1) {
        throw new Error(`Cannot update the Label, the category ${req.body.category} is invalid.`);
      }
    }
    commonController.findAdditionalKeys(Label, req.label._doc, req.body, res);
    var label = _.extend(req.label, req.body);
    await label.save();
    res.json(label);
  } catch (err) {
    var statusCode;
    if (err.name === 'ValidationError' || err.name === 'StrictModeError') {
      statusCode = 400;
    } else {
      statusCode = 422;
    }
    return res.status(statusCode).send({
      message: errorHandler.getErrorMessage(err)
    });
  }
};

exports.delete = async function (req, res) {
  try {
    commonController.setLoggedInUser(req.user);
    var label = req.label;
    var dependentInstances = await Document.find({ labels: label.name }).exec();
    if (dependentInstances.length > 0) {
      throw new Error(`Can't delete label, it has ${dependentInstances.length} dependent documents`);
    }
    await label.remove();
    res.json(label);
  } catch (err) {
    return res.status(422).send({
      message: errorHandler.getErrorMessage(err)
    });
  }
};
