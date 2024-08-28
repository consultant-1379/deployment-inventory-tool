'use strict';

var mongoose = require('mongoose'),
  User = mongoose.model('User'),
  errorHandler = require('../../../../modules/core/server/controllers/errors.server.controller'),
  ldap = require('../../../../config/lib/ldap'),
  commonController = require('../../../core/server/controllers/common.server.controller');
var dependentModelsDetails = [];
var sortOrder = 'name';
commonController = commonController(User, dependentModelsDetails, sortOrder);

exports.signin = async function (req, res) {
  try {
    var user = await ldap.signinFromLoginPage(req, res);
    user.password = undefined;
    user.salt = undefined;
    res.json(user);
  } catch (err) {
    return res.status(422).send({
      message: errorHandler.getErrorMessage(err)
    });
  }
};

exports.signout = function (req, res, next) {
  req.logout(function (err) {
    if (err) { return next(err); }
    res.redirect('/authentication/signin');
  });
};

exports.list = async function (req, res) {
  try {
    var users = await User.find({}, '-salt -password -providerData').sort('-created').populate('user', 'displayName').exec();
    res.json(users);
  } catch (err) {
    return res.status(422).send({
      message: errorHandler.getErrorMessage(err)
    });
  }
};

exports.findById = commonController.findById;
