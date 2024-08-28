'use strict';

var pods = require('../controllers/pods.server.controller');
var adminPolicy = require('../../../../config/lib/policy');

module.exports = function (app) {
  app.route('/api/pods')
    .get(pods.list)
    .post(adminPolicy.isAllowed, pods.create);

  app.route('/api/pods/:podId')
    .get(pods.read)
    .put(adminPolicy.isAllowed, pods.update)
    .delete(adminPolicy.isAllowed, pods.delete);

  app.route('/api/pods/:podId/subnet/:networkName')
    .get(pods.getSubnetData);

  app.param('podId', pods.findById);
};
