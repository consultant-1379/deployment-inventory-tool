'use strict';

var querystring = require('querystring'),
  mongoose = require('mongoose'),
  mongoMask = require('mongo-mask'),
  errorHandler = require('../../../../modules/core/server/controllers/errors.server.controller'),
  modelNameLowercase,
  objectType;

exports.getObjectType = async function (req, res, next, modelName) {
  try {
    modelNameLowercase = modelName.toLowerCase();
    objectType = require('../models/history.server.model').getSchema(modelNameLowercase); // eslint-disable-line global-require
    return next();
  } catch (err) {
    return res.status(422).send({ message: err.message });
  }
};

exports.findById = function (req, res, next, _id) {
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).send({
      message: `A ${modelNameLowercase} log with that id does not exist. Ensure a correct ${modelNameLowercase} id is entered and is not a log or legacy object id.` // eslint-disable-line max-len
    });
  }
  objectType.findOne({ associated_id: _id }).exec(function (err, modelInstance) {
    if (err || !modelInstance) {
      var errMsg = (err)
        ? 'An error occurred whilst trying to find a log: Internal Server Error.'
        : `A ${modelNameLowercase} log with that id does not exist. Ensure a correct ${modelNameLowercase} id is entered and is not a log or legacy object id.`; // eslint-disable-line max-len
      return res.status(404).send({ message: errMsg });
    }
    req[modelNameLowercase] = modelInstance;
    return next();
  });
};

exports.aggregate = async function (req, res) {
  var ObjectId = mongoose.Types.ObjectId;
  var pipeline = req.body;
  pipeline[0].$match.associated_id = new ObjectId(pipeline[0].$match.associated_id);

  if (!mongoose.Types.ObjectId.isValid(pipeline[0].$match.associated_id)) {
    return res.status(404).send({
      message: `A ${modelNameLowercase} log with that id does not exist. Ensure a correct ${modelNameLowercase} id is entered and is not a log or legacy object id.` // eslint-disable-line max-len
    });
  }

  objectType.aggregate(pipeline).exec(function (err, modelInstance) {
    if (err || !modelInstance) {
      var errMsg = (err)
        ? 'An error occurred whilst trying to find a log: Internal Server Error.'
        : `A ${modelNameLowercase} log with that id does not exist. Ensure a correct ${modelNameLowercase} id is entered and is not a log or legacy object id.`; // eslint-disable-line max-len
      return res.status(404).send({ message: errMsg });
    }

    res.json(modelInstance);
  });
};

exports.list = async function (req, res, err) {
  if (!isValidSearch(req.query)) {
    return res.status(422).send({
      message: 'Improperly structured query. Make sure to use ?q=<key>=<value> syntax'
    });
  }

  var query = (req.query.q) ? querystring.parse(req.query.q, { parseBooleans: true }) : null;
  var fields = (req.query.fields) ? mongoMask(req.query.fields, {}) : null;

  if (query && query['originalData.managedconfig']) {
    // workaround: parse string -> boolean for returning specific document logs
    query['originalData.managedconfig'] = (query['originalData.managedconfig'] === 'true');
  }

  objectType.find(query).select(fields).exec(async function (err, modelInstances) {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    res.json(modelInstances);
  });
};

exports.read = function (req, res) {
  var modelInstance = req[modelNameLowercase] ? req[modelNameLowercase].toJSON() : {};
  res.json(modelInstance);
};

function isValidSearch(query) {
  for (var key in query) {
    if ((key !== 'fields' && key !== 'q') || !query[key]) return false;
  }
  return true;
}
