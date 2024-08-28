var logRoutes = require('../../modules/history/server/routes/history.server.routes.js');
var podsRoutes = require('../../modules/pods/server/routes/pods.server.routes.js');
var authRoutes = require('../../modules/users/server/routes/auth.server.routes.js');
var projectsRoutes = require('../../modules/projects/server/routes/projects.server.routes.js');
var deploymentsRoutes = require('../../modules/deployments/server/routes/deployments.server.routes.js');
var documentsRoutes = require('../../modules/documents/server/routes/documents.server.routes.js');
var schemasRoutes = require('../../modules/schemas/server/routes/schemas.server.routes.js');
var labelsRoutes = require('../../modules/labels/server/routes/labels.server.routes.js');
var groupsRoutes = require('../../modules/groups/server/routes/groups.server.routes.js');
var coreRoutes = require('../../modules/core/server/routes/core.server.routes.js');

module.exports = [
  logRoutes,
  podsRoutes,
  authRoutes,
  projectsRoutes,
  deploymentsRoutes,
  documentsRoutes,
  schemasRoutes,
  labelsRoutes,
  groupsRoutes,
  coreRoutes
];
