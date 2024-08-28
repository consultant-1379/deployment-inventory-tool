'use strict';

var users = require('../controllers/users.server.controller');
var admins = require('../controllers/admin.server.controller');
var adminPolicy = require('../../../../config/lib/policy');

module.exports = function (app) {
  app.route('/api/auth/signin').post(users.signin);

  app.route('/api/auth/signout').get(users.signout);

  app.route('/api/users')
    .get(adminPolicy.isAllowed, users.list);

  app.route('/api/users/:userId')
    .put(adminPolicy.isAllowed, admins.update);

  app.param('userId', users.findById);
};
