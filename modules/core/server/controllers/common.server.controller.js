'use strict';

var querystring = require('querystring');
var mongoose = require('mongoose');
var _ = require('lodash');
var mongoMask = require('mongo-mask');
var errorHandler = require('../../../../modules/core/server/controllers/errors.server.controller');
var HistoryModel = require('../../../history/server/models/history.server.model');
var Group = require('../../../groups/server/models/groups.server.model').Schema;
var Document = require('../../../documents/server/models/documents.server.model').Schema;

module.exports = function (Model, dependentModelsDetails, sortOrder) {
  var module = {};
  var modelNameLowercase = Model.modelName.toLowerCase();
  var modelNames = ['pod', 'deployment', 'document', 'project'];

  // Common interface for setting the logged-in user that is performing
  // CRUD operations on objects; it is necessary for logging info.
  module.setLoggedInUser = (user) => HistoryModel.setLoggedInUser(user);

  module.create = async function (req, res) {
    try {
      module.setLoggedInUser(req.user);
      delete req.body.created_at;
      var userGroups = [];
      if (modelNames.indexOf(modelNameLowercase) !== -1) {
        userGroups = req.body.usergroups;
        delete req.body.usergroups;
        await isUserGroupsValid(userGroups);
      }
      var modelInstance = new Model(req.body);
      await modelInstance.save();
      if (modelNames.indexOf(modelNameLowercase) !== -1) {
        await addModelInstanceIdToUserGroupIfRequired(req.user, modelInstance._id, userGroups);
      }
      res.location(`/api/${modelNameLowercase}s/${modelInstance._id}`).status(201).json(modelInstance);
    } catch (err) {
      var statusCode;
      if (err.name === 'ValidationError' || err.name === 'StrictModeError') {
        statusCode = 400;
      } else {
        statusCode = 422;
      }
      return res.status(statusCode).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
  };

  module.addModelInstanceToGroup = async function (currentUser, modelInstanceID, userGroups) {
    await addModelInstanceIdToUserGroupIfRequired(currentUser, modelInstanceID, userGroups);
  };

  module.updateModelInstanceInGroup = async function (currentUser, modelInstanceID, userGroups) {
    await addModelInstanceIdToUserGroupIfRequired(currentUser, modelInstanceID, userGroups);
    await removeModelInstanceIdFromUserGroupIfRequired(currentUser, modelInstanceID, userGroups);
  };

  module.userGroupsValidation = async function (userGroups) {
    await isUserGroupsValid(userGroups);
  };

  function isSuperAdmin(currentUser) {
    return currentUser.roles.indexOf('superAdmin') !== -1;
  }

  async function isUserGroupsValid(userGroups) {
    if (userGroups) {
      var userGroupsAsStrings = await userGroups.map(group => JSON.stringify(group));
      if (_.uniq(userGroupsAsStrings).length !== userGroups.length) {
        throw new Error('You cannot attach the same group twice');
      }
    }
  }

  async function findGroup(groupId) {
    var group = await Group.findById(groupId).exec();
    return group;
  }

  function isModelInstancePresentInGroup(group, modelInstanceID) {
    var uppercasePlural = `${modelNameLowercase.charAt(0).toUpperCase()}${modelNameLowercase.substr(1)}s`;
    var arrayName = `associated${uppercasePlural}`;
    return group[arrayName].indexOf(modelInstanceID) !== -1;
  }

  function isUserPresentInGroup(group, currentUserId) {
    return (group.admin_IDs.indexOf(currentUserId) !== -1 || group.users.indexOf(currentUserId) !== -1);
  }

  async function addModelInstanceIdToUserGroupIfRequired(currentUser, modelInstanceID, userGroups) {
    if (userGroups && currentUser) {
      var currentUserId = currentUser.id;
      var allUserGroups = [];

      var allGroups = _.flattenDeep(await Group.find().exec());
      var modelInstanceGroups = await allGroups.filter(group => isModelInstancePresentInGroup(group, modelInstanceID));
      modelInstanceGroups = await modelInstanceGroups.map(group => { return group._id.toString(); });

      if (isSuperAdmin(currentUser)) {
        allUserGroups = await allGroups.map(group => { return group._id.toString(); });
      } else {
        var foundGroups = await allGroups.filter(group => isUserPresentInGroup(group, currentUserId));
        allUserGroups = await foundGroups.map(group => { return group._id.toString(); });
      }

      var userGroupsPromises = [];
      for (var ug = 0; ug < userGroups.length; ug += 1) {
        if (modelInstanceGroups && modelInstanceGroups.indexOf(userGroups[ug]) === -1) {
          if (allUserGroups.indexOf(userGroups[ug]) !== -1) {
            userGroupsPromises.push(findGroup(userGroups[ug]));
          } else {
            throw new Error(`You cannot attach group ${userGroups[ug]}, you are not in this group`);
          }
        }
      }
      userGroups = await Promise.all(userGroupsPromises);
      userGroups = _.flattenDeep(userGroups);
      var groupPromises = [];
      for (var g = 0; g < userGroups.length; g += 1) {
        groupPromises.push(addModelInstanceIDToGroup(userGroups[g], modelInstanceID));
      }
      await Promise.all(groupPromises);
    }
  }

  function addModelInstanceIDToGroup(group, modelInstanceID) {
    var uppercasePlural = `${modelNameLowercase.charAt(0).toUpperCase()}${modelNameLowercase.substr(1)}s`;
    var arrayName = `associated${uppercasePlural}`;
    if (group[arrayName].indexOf(modelInstanceID) === -1) {
      group[arrayName].push(modelInstanceID);
      return Group.findOneAndUpdate({ _id: group._id }, { $set: { [arrayName]: group[arrayName] } });
    }
  }

  async function getRemovedGroups(currentUser, modelInstanceID, userGroups) {
    var currentUserId = currentUser.id;
    var allUserGroups = [];
    var removedGroups = [];
    var allGroups = _.flattenDeep(await Group.find().exec());
    var modelInstanceGroups = await allGroups.filter(group => isModelInstancePresentInGroup(group, modelInstanceID));
    modelInstanceGroups = await modelInstanceGroups.map(group => { return group._id.toString(); });

    if (isSuperAdmin(currentUser)) {
      allUserGroups = await allGroups.map(group => { return group._id.toString(); });
    } else {
      var foundGroups = await allGroups.filter(group => isUserPresentInGroup(group, currentUserId));
      allUserGroups = await foundGroups.map(group => { return group._id.toString(); });
    }
    for (var mg = 0; mg < modelInstanceGroups.length; mg += 1) {
      if (userGroups.indexOf(modelInstanceGroups[mg]) === -1 && allUserGroups.indexOf(modelInstanceGroups[mg]) !== -1) {
        removedGroups.push(modelInstanceGroups[mg]);
      }
    }
    return removedGroups;
  }

  async function removeModelInstanceIdFromUserGroupIfRequired(currentUser, modelInstanceID, userGroups) {
    if (currentUser && userGroups) {
      var removedGroups = await getRemovedGroups(currentUser, modelInstanceID, userGroups);
      if (removedGroups) {
        var removedGroupsPromises = [];
        for (var rg = 0; rg < removedGroups.length; rg += 1) {
          removedGroupsPromises.push(findGroup(removedGroups[rg]));
        }
        removedGroups = await Promise.all(removedGroupsPromises);
        removedGroups = _.flattenDeep(removedGroups);
        var groupPromises = [];
        for (var g = 0; g < removedGroups.length; g += 1) {
          groupPromises.push(removeModelInstanceIDFromGroup(removedGroups[g], modelInstanceID));
        }
        await Promise.all(groupPromises);
      }
    }
  }

  function removeModelInstanceIDFromGroup(group, modelInstanceID) {
    var uppercasePlural = `${modelNameLowercase.charAt(0).toUpperCase()}${modelNameLowercase.substr(1)}s`;
    var arrayName = `associated${uppercasePlural}`;
    if (group[arrayName].indexOf(modelInstanceID) !== -1) {
      group[arrayName].splice(group[arrayName].indexOf(modelInstanceID), 1);
      return Group.findOneAndUpdate({ _id: group._id }, { $set: { [arrayName]: group[arrayName] } });
    }
  }

  module.delete = async function (req, res) {
    var modelInstance = req[modelNameLowercase];
    var dependentInstancesPromises = [];
    var dependentModelNames = [];

    try {
      module.setLoggedInUser(req.user);
      for (var i = 0; i < dependentModelsDetails.length; i += 1) {
        var dependentModelDetails = dependentModelsDetails[i];
        var dependentModelKey = dependentModelDetails.modelKey;
        var dependentModelName = dependentModelDetails.modelObject.modelName;
        var DependentModel = dependentModelDetails.modelObject;
        dependentModelNames.push(dependentModelName.toLowerCase());
        var findObject = {};
        findObject[dependentModelKey] = modelInstance._id;
        dependentInstancesPromises.push(DependentModel.find(findObject).exec());
      }
      var dependentInstances = await Promise.all(dependentInstancesPromises);
      for (var x = 0; x < dependentInstances.length; x += 1) {
        if (dependentInstances[x].length > 0) {
          var plural;
          if (dependentInstances[x].length === 1) {
            plural = '';
          } else {
            plural = 's';
          }
          return res.status(422).send({
            message: `Can't delete ${modelNameLowercase}, it has ${dependentInstances[x].length} \
dependent ${dependentModelNames[x]}${plural}`
          });
        }
      }
      await modelInstance.remove();
      res.json(modelInstance);
    } catch (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
  };

  function isValidSearch(query) {
    for (var key in query) {
      if (key !== 'fields' && key !== 'q') {
        return false;
      } else if (!query[key]) {
        return false;
      }
    }
    return true;
  }

  module.list = async function (req, res) {
    if (!isValidSearch(req.query)) {
      return res.status(422).send({
        message: 'Improperly structured query. Make sure to use ?q=<key>=<value> syntax'
      });
    }

    var query = (req.query.q) ? querystring.parse(req.query.q) : null;
    var fields = (req.query.fields) ? mongoMask(req.query.fields, {}) : null;

    Model.find(query).select(fields).sort(sortOrder).exec(async function (err, modelInstances) {
      if (err) {
        return res.status(422).send({
          message: errorHandler.getErrorMessage(err)
        });
      }
      res.json(await filterResultsBasedOnLoggedInUser(modelInstances, req));
    });
  };

  async function filterResultsBasedOnLoggedInUser(modelInstances, req) {
    /* production check to be removed during phase 2 */
    /* Ignoring 'if' in istanbul due to conflicting results between local and jenkins */
    /* istanbul ignore next */
    if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'development') {
      return modelInstances;
    }

    if (filterListForNonSuperAdmin(req)) {
      var userArtifactIds = await getUsersArtifactIDs(req.user._id);
      if (userArtifactIds.length) {
        return modelInstances.filter(modelInstance => modelInstance.managedconfig || userArtifactIds.includes(modelInstance._id.toString()));
      }
      return [];
    }
    if (modelNameLowercase === 'group' && req.user.roles[0] === 'admin') {
      var groups = await getGroupsWhereUserIsAdmin(req.user._id);
      var allowedResults = [];
      for (var i = 0; i < groups.length; i += 1) {
        for (var x = 0; x < modelInstances.length; x += 1) {
          if (modelInstances[x]._id.toString() === groups[i]._id.toString()) {
            allowedResults.push(modelInstances[x]);
          }
        }
      }
      return allowedResults;
    }
    return modelInstances;
  }

  function filterListForNonSuperAdmin(req) {
    return !queryIsForManagedConfigs(req) && !isSuperAdmin(req.user)
    && modelNameLowercase !== 'group' && modelNameLowercase !== 'schema'
    && modelNameLowercase !== 'label';
  }

  function queryIsForManagedConfigs(req) {
    if (req.query.q) {
      return req.query.q.includes('managedconfig=true');
    }
    return false;
  }

  async function getGroupsWhereUserIsAdmin(userID) {
    var groups = await Group.find({ admin_IDs: userID }).exec();
    if (groups.length) {
      return groups;
    }
    return [];
  }

  async function getUsersArtifactIDs(userID) {
    var userGroups = await Group.find({ users: { $in: [userID] } }).exec();
    var adminGroups = await Group.find({ admin_IDs: { $in: [userID] } }).exec();
    var groups = userGroups.concat(adminGroups);
    var uniqueGroups = [...new Set(groups)];
    var artifactIDs = [];
    if (uniqueGroups.length) {
      for (var i = 0; i < uniqueGroups.length; i += 1) {
        artifactIDs.push(uniqueGroups[i].associatedDocuments);
        artifactIDs.push(uniqueGroups[i].associatedPods);
        artifactIDs.push(uniqueGroups[i].associatedProjects);
        artifactIDs.push(uniqueGroups[i].associatedDeployments);
      }
      return _.flattenDeep(artifactIDs).map(documentID => documentID.toString());
    }
    return [];
  }

  module.read = function (req, res) {
    var modelInstance = req[modelNameLowercase] ? req[modelNameLowercase].toJSON() : {};
    res.json(modelInstance);
  };

  module.findAdditionalKeys = function (ModelType, document, updates) {
    var temp = new ModelType(_.extend({}, document, updates));
  };

  async function doesUserHavePermissionsToUpdateGroup(req, res) {
    if (req.body.admin_IDs[0].toString() !== req.user._id.toString()) {
      throw new Error('Cannot update as user is not admin of this group.');
    }
  }

  module.update = async function (req, res) {
    try {
      module.setLoggedInUser(req.user);
      if (modelNameLowercase === 'group' && req.user.roles[0] !== 'superAdmin') {
        await doesUserHavePermissionsToUpdateGroup(req, res);
      }
      var userGroups = [];
      if (modelNames.indexOf(modelNameLowercase) !== -1) {
        userGroups = req.body.usergroups;
        delete req.body.usergroups;
        await isUserGroupsValid(userGroups);
      }
      module.findAdditionalKeys(Model, req[modelNameLowercase]._doc, req.body, res);
      var modelInstance = _.extend(req[modelNameLowercase], req.body);
      await modelInstance.save();
      if (modelNames.indexOf(modelNameLowercase) !== -1) {
        await addModelInstanceIdToUserGroupIfRequired(req.user, modelInstance._id, userGroups);
        await removeModelInstanceIdFromUserGroupIfRequired(req.user, modelInstance._id, userGroups);
      }
      return res.json(modelInstance);
    } catch (err) {
      var statusCode;
      if (err.name === 'ValidationError' || err.name === 'StrictModeError') {
        statusCode = 400;
      } else {
        statusCode = 422;
      }
      return res.status(statusCode).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
  };

  module.findById = function (req, res, next, id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).send({
        message: `A ${modelNameLowercase} with that id does not exist`
      });
    }
    var fields;
    if (req.query.fields) {
      fields = mongoMask(req.query.fields, {});
    } else {
      fields = null;
    }
    Model.findById(id).select(fields).exec(function (err, modelInstance) {
      if (err) {
        return next(err);
      }
      if (!modelInstance) {
        return res.status(404).send({
          message: `A ${modelNameLowercase} with that id does not exist`
        });
      }
      req[modelNameLowercase] = modelInstance;
      return next();
    });
  };

  module.findByName = async function (req, res, next, name) {
    var searchParam = { name: name };
    var fields = (req.query.fields) ? mongoMask(req.query.fields, {}) : null;

    Model.findOne(searchParam).select(fields).exec(function (err, modelInstance) {
      if (err) return next(err);
      if (!modelInstance) {
        return res.status(404)
          .send({ message: `A ${Model.modelName} with name '${name}' does not exist.'` });
      }
      req.document = modelInstance;
      return next();
    });
  };
  return module;
};
