'use strict';

var path = require('path'),
  mongoose = require('mongoose'),
  _ = require('lodash'),
  User = mongoose.model('User'),
  errorHandler = require('../../../../modules/core/server/controllers/errors.server.controller');

exports.update = async function (req, res) {
  delete req.body.created_at;
  var user = _.extend(req.user, req.body);
  try {
    await user.save();
    res.json(user);
  } catch (err) {
    return res.status(422).send({
      message: errorHandler.getErrorMessage(err)
    });
  }
};
