'use strict';

var documents = require('../controllers/documents.server.controller');
var adminPolicy = require('../../../../config/lib/policy');

module.exports = function (app) {
  app.route('/api/documents/validate')
    .post(documents.validateJSONtoSchema);

  app.route('/api/documents')
    .get(documents.list)
    .post(adminPolicy.isAllowed, documents.create);

  app.route('/api/documents/:documentId')
    .get(documents.read)
    .put(adminPolicy.isAllowed, documents.update)
    .delete(adminPolicy.isAllowed, documents.delete);

  app.route('/api/documents/name/:documentName')
    .get(documents.read)
    .put(adminPolicy.isAllowed, documents.update)
    .delete(adminPolicy.isAllowed, documents.delete);

  app.param('documentId', documents.findById);
  app.param('documentName', documents.findByName);
};
