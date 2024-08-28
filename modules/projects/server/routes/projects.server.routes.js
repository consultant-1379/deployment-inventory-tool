'use strict';

var projects = require('../controllers/projects.server.controller');
var adminPolicy = require('../../../../config/lib/policy');

module.exports = function (app) {
  app.route('/api/projects')
    .get(projects.list)
    .post(adminPolicy.isAllowed, projects.create);

  app.route('/api/projects/:projectId')
    .get(projects.read)
    .put(adminPolicy.isAllowed, projects.update)
    .delete(adminPolicy.isAllowed, projects.delete);

  app.param('projectId', projects.findById);

  app.route('/api/projects/free_address')
    .post(projects.getFreeIPs);
};
