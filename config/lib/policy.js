'use strict';

var acl = require('acl');
var mongoose = require('mongoose');
var User = mongoose.model('User');

acl = new acl(new acl.memoryBackend());

var userRoutes = [
  'schemas', 'schemas/:schemaId',
  'documents', 'documents/:documentId',
  'documents', 'documents/name/:documentName',
  'labels', 'labels/:labelId',
  'deployments', 'deployments/:deploymentId',
  'pods', 'pods/:podId',
  'projects', 'projects/:projectId'
];

var adminRoutes = [
  'groups', 'groups/:groupId'
];

var superAdminRoutes = [
  'users', 'users/:userId'
];

function assignPermissions(userType) {
  var routePermissions = [];

  userRoutes.forEach(function (route) {
    routePermissions.push({
      resources: `/api/${route}`,
      permissions: '*'
    });
  });

  adminRoutes.forEach(function (route) {
    routePermissions.push({
      resources: `/api/${route}`,
      permissions: (userType !== 'user') ? '*' : 'get'
    });
  });

  superAdminRoutes.forEach(function (route) {
    routePermissions.push({
      resources: `/api/${route}`,
      permissions: (userType === 'superAdmin') ? '*' : 'get'
    });
  });

  return routePermissions;
}

exports.invokeRolesPolicies = function () {
  acl.allow([
    { roles: ['user'], allows: assignPermissions('user') },
    { roles: ['admin'], allows: assignPermissions('admin') },
    { roles: ['superAdmin'], allows: assignPermissions('superAdmin') }
  ]);
};

exports.isAllowed = async function (req, res, next) {
  // when sending 'user' to update, req.user becomes the user to be updated, rather then user that is performing an update
  var user = (req.route.path === '/api/users/:userId') ? await getUserFromSignum(req.loginUsername) : await getUserFromID(req.user);
  if (!user) return res.status(401).json({ message: 'User must be logged in' });
  acl.areAnyRolesAllowed(user.roles, req.route.path, req.method.toLowerCase(), function (err, isAllowed) {
    if (err) return res.status(500).send('Unexpected authorization error');
    if (isAllowed) return next();
    return res.status(403).json({ message: 'User is not authorized' });
  });
};

async function getUserFromSignum(signum) {
  return User.findOne({ username: signum }, '-salt -password -providerData').exec();
}

async function getUserFromID(userID) {
  return User.findById(userID, '-salt -password -providerData').exec();
}
