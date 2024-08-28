'use strict';

var _ = require('lodash');
var JiraClient = require('jira-connector');
var commonController = require('../../../core/server/controllers/common.server.controller');
var Deployment = require('../models/deployments.server.model').Schema;
var Document = require('../../../documents/server/models/documents.server.model').Schema;
var Project = require('../../../projects/server/models/projects.server.model').Schema;
var documentsController = require('../../../documents/server/controllers/documents.server.controller');
var coreController = require('../../../core/server/controllers/core.server.controller');
var helperHandler = require('../../../core/server/controllers/helpers.server.controller');
var errorHandler = require('../../../core/server/controllers/errors.server.controller');
var Group = require('../../../groups/server/models/groups.server.model').Schema;

var dependentModelsDetails = [];
var sortOrder = 'name';
commonController = commonController(Deployment, dependentModelsDetails, sortOrder);

exports.read = commonController.read;
exports.list = commonController.list;
exports.delete = commonController.delete;
exports.findById = commonController.findById;

exports.create = async function (req, res) {
  var deployment;
  try {
    commonController.setLoggedInUser(req.user);
    var userGroups = req.body.usergroups;
    delete req.body.usergroups;
    await commonController.userGroupsValidation(userGroups);
    deployment = new Deployment(req.body);
    await deployment.validate();
    if (deployment.jira_issues.length) {
      deployment.jira_issues = deployment.jira_issues.map(jira => jira.toUpperCase());
    }
    await jiraIssuesValidation(deployment);
    deployment = await validateDeploymentDetails(deployment);
    await deployment.save();
    await createResaveDocuments(deployment);
    await commonController.addModelInstanceToGroup(req.user, deployment._id, userGroups);
    res.location(`/api/deployments/${deployment._id}`).status(201).json(deployment);
  } catch (err) {
    var statusCode = (err.name === 'ValidationError' || err.name === 'StrictModeError') ? 400 : 422;
    if (deployment) {
      try {
        await Deployment.deleteOne({ _id: deployment._id });
      } catch (errMsg) {
        return res.status(statusCode).send({
          message: errorHandler.getErrorMessage(`${err} - ${errMsg}`)
        });
      }
    }
    return res.status(statusCode).send({
      message: errorHandler.getErrorMessage(err)
    });
  }
};

exports.update = async function (req, res) {
  var originalDeployment;
  try {
    originalDeployment = await Deployment.findById(req.deployment._id).exec();
    commonController.setLoggedInUser(req.user);
    var userGroups = req.body.usergroups;
    delete req.body.usergroups;
    await commonController.userGroupsValidation(userGroups);
    commonController.findAdditionalKeys(Deployment, req.deployment._doc, req.body, res);
    var deployment = _.extend(req.deployment, req.body);
    await deployment.validate();
    if (deployment.jira_issues.length) {
      deployment.jira_issues = deployment.jira_issues.map(jira => jira.toUpperCase());
    }
    await jiraIssuesValidation(deployment);
    deployment = await validateDeploymentDetails(deployment);
    await deployment.save();
    await editResaveDocuments(originalDeployment, deployment);
    await commonController.updateModelInstanceInGroup(req.user, deployment._id, userGroups);
    return res.json(deployment);
  } catch (err) {
    var statusCode = (err.name === 'ValidationError' || err.name === 'StrictModeError') ? 400 : 422;
    if (originalDeployment) {
      try {
        await revertDeployment(originalDeployment);
      } catch (errMsg) {
        return res.status(statusCode).send({
          message: errorHandler.getErrorMessage(`${err} - ${errMsg}`)
        });
      }
    }
    return res.status(statusCode).send({
      message: errorHandler.getErrorMessage(err)
    });
  }
};

async function revertDeployment(originalDeployment) {
  try {
    await Deployment.findById(originalDeployment._id, function (err, deployment) {
      deployment.name = originalDeployment.name;
      deployment.project_id = originalDeployment.project_id;
      deployment.enm = originalDeployment.enm;
      deployment.documents = originalDeployment.documents;
      if (originalDeployment.jira_issues) {
        deployment.jira_issues = originalDeployment.jira_issues;
      }
      deployment.save();
    });
  } catch (err) {
    throw new Error(`Failed to revert deployment! ${err}`);
  }
}

async function jiraIssuesValidation(deployment) {
  if (deployment.jira_issues.length) {
    if (_.uniq(deployment.jira_issues).length !== deployment.jira_issues.length) {
      var jiraDuplicateList = [];
      deployment.jira_issues.forEach(function (jiraIssue) {
        if (deployment.jira_issues.filter((issue) => (issue === jiraIssue)).length !== 1) {
          jiraDuplicateList.push(jiraIssue);
        }
      });
      jiraDuplicateList = _.uniq(jiraDuplicateList);
      throw new Error(`You cannot add the same JIRA Issue multiple times. Please remove the duplicates: ${jiraDuplicateList.join(', ')} and try again.`);
    }
    var jira = coreController.getJiraClient();
    await helperHandler.asyncForEach(deployment.jira_issues, async function (jiraIssue) {
      jiraIssue = jiraIssue.trim();
      try {
        await jira.issue.getIssue({ issueKey: jiraIssue });
      } catch (error) {
        if (String(error).includes('Issue Does Not Exist')) {
          throw new Error(`JIRA Issue: ${jiraIssue} is invalid, please enter a valid Issue and try again.`);
        }
      }
    });
  }
}

async function validateDeploymentDetails(deployment) {
  var uniqueSchemaNames = [...new Set(deployment.documents.map(document => document.schema_name))];
  if (uniqueSchemaNames.length !== deployment.documents.length) {
    throw new Error('You cannot associate multiple documents with the same schema_name.');
  }

  var associatedDocumentPromises = [];
  deployment.documents.map(function (associatedDocument) {
    if (associatedDocument.schema_name === 'enm_sed' || associatedDocument.schema_category === 'enm') {
      throw new Error('You cannot associate an enm_sed document within the deployments documents list.');
    }

    if (associatedDocument.schema_name.startsWith('vnflcm_sed_schema')) associatedDocument.schema_category = 'vnflcm';
    else if (associatedDocument.schema_name.startsWith('cenm_')) associatedDocument.schema_category = 'cenm';
    else associatedDocument.schema_category = 'other';

    associatedDocumentPromises.push(Document.findOne({ _id: associatedDocument.document_id }).select('_id name').populate({ path: 'schema_id' }).exec());
    return associatedDocument;
  });

  var associatedDocuments = await Promise.all(associatedDocumentPromises);
  for (var d = 0; d < associatedDocuments.length; d += 1) {
    if (!associatedDocuments[d]) {
      throw new Error(`The given document id ${deployment.documents[d].document_id} could not be found`);
    }

    if (associatedDocuments[d].schema_id.name !== deployment.documents[d].schema_name) {
      throw new Error(`The given document id ${deployment.documents[d].document_id} is not using a schema \
with the given schema_name of "${deployment.documents[d].schema_name}". Its schema has a name of "${associatedDocuments[d].schema_id.name}".`);
    }
  }
  var associatedDocumentIds = associatedDocuments.map(document => document._id);
  var otherDeploymentsMatchingDocuments = await Deployment.find({ _id: { $ne: deployment._id }, documents: { $elemMatch: { document_id: { $in: associatedDocumentIds } } } }).select('name documents').lean().exec();
  if (otherDeploymentsMatchingDocuments.length !== 0) {
    for (var o = 0; o < otherDeploymentsMatchingDocuments[0].documents.length; o += 1) {
      for (var a = 0; a < associatedDocuments.length; a += 1) {
        if (otherDeploymentsMatchingDocuments[0].documents[o].document_id.toString() === associatedDocuments[a]._id.toString()) {
          throw new Error(`The associated document "${associatedDocuments[a].name}" \
is already in use in another deployment "${otherDeploymentsMatchingDocuments[0].name}"`);
        }
      }
    }
  }
  return deployment;
}

async function createResaveDocuments(deployment) {
  var project = await Project.findById(deployment.project_id).exec();
  var ipv6Ranges = _.filter(project.network.ipv6_ranges, range => range.start && range.end);
  var isIpv6 = (ipv6Ranges.length !== 0);
  await documentsController.resaveAutopopulatedDocuments(project, isIpv6);
}

async function editResaveDocuments(originalDeployment, updatedDeployment) {
  var project = await Project.findById(updatedDeployment.project_id).exec();
  var ipv6Ranges = _.filter(project.network.ipv6_ranges, range => range.start && range.end);
  var enmSed = await Document.findById(updatedDeployment.enm.sed_id).exec();
  var oldEnmSed = await Document.findById(originalDeployment.enm.sed_id).exec();
  if (!oldEnmSed._id.equals(enmSed._id)) {
    enmSed.ipv6 = (ipv6Ranges.length === 0 ? false : oldEnmSed.ipv6);
    oldEnmSed.ipv6 = false;
    await documentsController.resaveDocumentRemovedFromDeployment(oldEnmSed);
  }
  await documentsController.resaveAutopopulatedDocuments(project, enmSed.ipv6);
  var oldVnfSed = await getVnfLcmSed(originalDeployment);
  if (oldVnfSed) {
    var vnfSed = await getVnfLcmSed(updatedDeployment);
    if (vnfSed) {
      if (!oldVnfSed._id.equals(vnfSed._id)) await documentsController.resaveDocumentRemovedFromDeployment(oldVnfSed);
    } else {
      await documentsController.resaveDocumentRemovedFromDeployment(oldVnfSed);
    }
  }
}

async function getVnfLcmSed(deployment) {
  var vnfLcmSedDocumentId;
  deployment.documents.forEach(function (document) {
    if (document.schema_name === 'vnflcm_sed_schema' || document.schema_category === 'vnflcm') {
      vnfLcmSedDocumentId = document.document_id;
      return vnfLcmSedDocumentId;
    }
  });
  var vnfLcmSed;
  if (vnfLcmSedDocumentId) {
    vnfLcmSed = await Document.findById(vnfLcmSedDocumentId).exec();
  }
  return vnfLcmSed;
}
