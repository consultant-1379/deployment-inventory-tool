'use strict';

var history = require('../controllers/history.server.controller');

module.exports = function (app) {
  app.route('/api/logs/:objectType').get(history.list);
  app.route('/api/logs/:objectType/:objectId').get(history.read);

  app.route('/api/logs/:objectType').post(history.aggregate);

  app.param('objectType', history.getObjectType);
  app.param('objectId', history.findById);
};
