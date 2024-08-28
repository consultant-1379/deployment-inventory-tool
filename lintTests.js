var coreClientIntTests = require('./modules/core/tests/client/interceptors/auth-interceptor.client.tests.js');
var coreClientTests = require('./modules/core/tests/client/core.client.tests.js');
var coreClientHeaderTests = require('./modules/core/tests/client/header.client.controller.tests.js');
var coreClientHomeTests = require('./modules/core/tests/client/home.client.controller.tests.js');
var coreClientMenuTests = require('./modules/core/tests/client/menus.client.service.tests.js');
var coreServerTests = require('./modules/core/tests/server/core.server.config.tests.js');
var deploymentsClientTests = require('./modules/deployments/tests/client/deployments.clients.routes.tests.js');
var deploymentsServerTests = require('./modules/deployments/tests/server/deployments.server.routes.tests.js');
var documentsClientTests = require('./modules/documents/tests/client/documents.client.routes.tests.js');
var documentsServerTests = require('./modules/documents/tests/server/documents.server.routes.tests.js');
var documentsServerVIOTests = require('./modules/documents/tests/server/documents.server.routes.vio.tests.js');
var documentsServerVnflcmTests = require('./modules/documents/tests/server/documents.server.routes.vnf.tests.js');
var documentsServerIPv6Tests = require('./modules/documents/tests/server/documents.server.routes.ipv6.tests.js');
var documentsServerExternalNfsTests = require('./modules/documents/tests/server/documents.server.routes.externalnfs.tests.js');
var documentsUpgradeTests = require('./modules/documents/tests/upgrade/upgrade.documents.server.routes.tests.js');
var groupsClientTests = require('./modules/groups/tests/client/groups.client.routes.tests.js');
var groupsServerTests = require('./modules/groups/tests/server/groups.server.routes.tests.js');
var labelsClientTests = require('./modules/labels/tests/client/labels.client.routes.tests.js');
var labelsServerTests = require('./modules/labels/tests/server/labels.server.routes.tests.js');
var podsClientTests = require('./modules/pods/tests/client/pods.client.routes.tests.js');
var podsServerTests = require('./modules/pods/tests/server/pods.server.routes.tests.js');
var projectsClientTests = require('./modules/projects/tests/client/projects.client.routes.tests.js');
var projectsServerTests = require('./modules/projects/tests/server/projects.server.routes.tests.js');
var schemasClientTests = require('./modules/schemas/tests/client/schemas.client.routes.tests.js');
var schemasServerTests = require('./modules/schemas/tests/server/schemas.server.routes.tests.js');
var usersAuthClientTests = require('./modules/users/tests/client/users.client.routes.tests.js');
var usersClientTests = require('./modules/users/tests/client/authentication.client.controller.tests.js');
var usersModelServerTests = require('./modules/users/tests/server/user.server.model.tests.js');
var usersRoutesServerTests = require('./modules/users/tests/server/user.server.routes.tests.js');
var smokeTests = require('./SmokeTests/smoke_test.js');

module.exports = [
  coreClientIntTests,
  coreClientTests,
  coreClientHeaderTests,
  coreClientHomeTests,
  coreClientMenuTests,
  coreServerTests,
  deploymentsClientTests,
  deploymentsServerTests,
  documentsClientTests,
  documentsServerTests,
  documentsServerVIOTests,
  documentsServerVnflcmTests,
  documentsServerIPv6Tests,
  documentsServerExternalNfsTests,
  documentsUpgradeTests,
  groupsClientTests,
  groupsServerTests,
  labelsClientTests,
  labelsServerTests,
  podsClientTests,
  podsServerTests,
  projectsClientTests,
  projectsServerTests,
  schemasClientTests,
  schemasServerTests,
  usersAuthClientTests,
  usersClientTests,
  usersModelServerTests,
  usersRoutesServerTests,
  smokeTests
];
