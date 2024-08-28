'use strict';

var groups = require('../controllers/groups.server.controller');
var adminPolicy = require('../../../../config/lib/policy');

module.exports = function (app) {
  app.route('/api/groups')
    .get(adminPolicy.isAllowed, groups.list)
    .post(adminPolicy.isAllowed, groups.create);

  app.route('/api/groups/:groupId')
    .get(adminPolicy.isAllowed, groups.read)
    .put(adminPolicy.isAllowed, groups.update)
    .delete(adminPolicy.isAllowed, groups.delete);

  app.param('groupId', groups.findById);
};
