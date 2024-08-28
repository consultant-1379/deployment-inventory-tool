'use strict';

var mongoose = require('mongoose');
var MongooseSchema = mongoose.Schema;
var uniqueValidator = require('mongoose-unique-validator');
var Document = require('../../../documents/server/models/documents.server.model.js').Schema;
var Pod = require('../../../pods/server/models/pods.server.model.js').Schema;
var Project = require('../../../projects/server/models/projects.server.model.js').Schema;
var Deployment = require('../../../deployments/server/models/deployments.server.model.js').Schema;
var User = require('../../../users/server/models/user.server.model.js').Schema;
var MongooseHistory = require('../../../history/server/plugins/history.server.plugin');

var Group = new MongooseSchema({
  name: {
    type: 'string',
    trim: true,
    required: true,
    unique: true,
    minlength: 2,
    maxlength: 50
  },
  admin_IDs: [{
    type: MongooseSchema.ObjectId,
    ref: 'User',
    required: true
  }],
  users: [{
    type: MongooseSchema.ObjectId,
    ref: 'User'
  }],
  associatedDocuments: [{
    type: MongooseSchema.ObjectId
  }],
  associatedPods: [{
    type: MongooseSchema.ObjectId
  }],
  associatedProjects: [{
    type: MongooseSchema.ObjectId
  }],
  associatedDeployments: [{
    type: MongooseSchema.ObjectId
  }]
}, {
  strict: 'throw'
});

Group.plugin(uniqueValidator, { message: 'Error, provided name is not unique.' });

async function findOneDocument(documentId) {
  return Document.findOne({ _id: documentId }).exec();
}

async function findOneUser(userId) {
  return User.findOne({ _id: userId }).exec();
}

async function anyNullElement(arr) {
  for (var index in arr) {
    if (!arr[index]) {
      return true;
    }
  }
  return false;
}

async function removeAnyDeletedArtifactIDs(group) {
  var docIDs = await Document.find().select('_id').exec();
  docIDs = docIDs.map(docObj => docObj._id.toString());
  var podIDs = await Pod.find().select('_id').exec();
  podIDs = podIDs.map(podObj => podObj._id.toString());
  var projectIDs = await Project.find().select('_id').exec();
  projectIDs = projectIDs.map(projectObj => projectObj._id.toString());
  var deploymentIDs = await Deployment.find().select('_id').exec();
  deploymentIDs = deploymentIDs.map(deploymentObj => deploymentObj._id.toString());
  group.associatedDocuments = group.associatedDocuments.filter(currentDocID => docIDs.includes(currentDocID.toString()));
  group.associatedPods = group.associatedPods.filter(currentPodID => podIDs.includes(currentPodID.toString()));
  group.associatedProjects = group.associatedProjects.filter(currentProjectID => projectIDs.includes(currentProjectID.toString()));
  group.associatedDeployments = group.associatedDeployments.filter(currentDeploymentID => deploymentIDs.includes(currentDeploymentID.toString()));
}

Group.pre('save', async function (next) {
  try {
    var group = this;
    await removeAnyDeletedArtifactIDs(group);
    var foundAdminUser = await findOneUser(group.admin_IDs[0]);
    if (!foundAdminUser || (foundAdminUser.roles[0] !== 'admin' && foundAdminUser.roles[0] !== 'superAdmin')) {
      return await Promise.reject(new Error(`An Admin User with id '${group.admin_IDs[0]}' does not exist`));
    }
    if (group.admin_IDs.length > 2) {
      throw new Error('There can be only a maximium of two admin users per group.');
    }
    if (group.admin_IDs.length !== [...new Set(group.admin_IDs.map(userId => userId.toString()))].length) {
      return await Promise.reject(new Error('Duplicate users added to admin group.'));
    }
    var userPromises = [];
    for (var x = 0; x < group.users.length; x += 1) {
      userPromises.push(findOneUser(group.users[x]));
    }
    var foundUsers = await Promise.all(userPromises);
    if (await anyNullElement(foundUsers)) {
      return await Promise.reject(new Error('An associated user id does not exist'));
    }

    var documentPromises = [];
    for (var i = 0; i < group.associatedDocuments.length; i += 1) {
      documentPromises.push(findOneDocument(group.associatedDocuments[i]));
    }
    var foundDocs = await Promise.all(documentPromises);
    if (await anyNullElement(foundDocs)) {
      return await Promise.reject(new Error('An associated document id does not exist'));
    }

    if (group.associatedDocuments.length !== [...new Set(group.associatedDocuments.map(docId => docId.toString()))].length) {
      return await Promise.reject(new Error('Duplicate documents added to group.'));
    }

    if (group.users.length !== [...new Set(group.users.map(userId => userId.toString()))].length) {
      return await Promise.reject(new Error('Duplicate users added to group.'));
    }
    return next();
  } catch (error) {
    return next(error);
  }
});

Group.plugin(MongooseHistory);

module.exports.Schema = mongoose.model('Group', Group);
