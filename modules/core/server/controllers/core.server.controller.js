'use strict';

var fs = require('fs'),
  validator = require('validator'),
  requestPromise = require('request-promise'),
  JiraClient = require('jira-connector'),
  cron = require('node-cron'),
  nodemailer = require('nodemailer'),
  _ = require('lodash'),
  logger = require('../../../../config/lib/logger'),
  config = require('../../../../config/config'),
  Document = require('../../../documents/server/models/documents.server.model').Schema,
  Schema = require('../../../schemas/server/models/schemas.server.model').Schema,
  helperHandler = require('../../../core/server/controllers/helpers.server.controller'),
  HistoryLog = require('../../../history/server/models/history.server.model'),
  HistoryLogDocument = require('../../../history/server/models/history.server.model').getSchema('documents');
var clearArtifactLogsFor = [
  'deployment', 'document', 'pod', 'project', 'schema', 'label'
];
var mailTransporter = nodemailer.createTransport({
  host: 'smtp-central.internal.ericsson.com',
  port: 25,
  secure: false, // true for 465, false for other ports
  tls: { rejectUnauthorized: false } // dont check certificate trust
});
/**
 * Render the main application page
 */
exports.renderIndex = function (req, res) {
  var safeUserObject = null;
  if (req.user) {
    safeUserObject = {
      displayName: validator.escape(req.user.displayName),
      username: validator.escape(req.user.username),
      created: req.user.created.toString(),
      roles: req.user.roles,
      email: validator.escape(req.user.email),
      lastName: validator.escape(req.user.lastName),
      firstName: validator.escape(req.user.firstName)
    };
  }

  res.render('modules/core/server/views/index', {
    user: JSON.stringify(safeUserObject),
    sharedConfig: JSON.stringify(config.shared)
  });
};

exports.loginTest = async function (req, res) {
  res.send({ message: 'success' });
};

exports.getVersion = async function (req, res) {
  var version = await readFileAsync('VERSION');
  res.send(version);
};

function readFileAsync(path) {
  return new Promise(function (resolve, reject) {
    fs.readFile(path, 'utf8', function (error, result) {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
}

/**
 * Render the server not found responses
 * Performs content-negotiation on the Accept HTTP header
 */
exports.renderNotFound = function (req, res) {
  res.status(404).format({
    'text/html': function () {
      res.render('modules/core/server/views/404', {
        url: req.originalUrl
      });
    },
    'application/json': function () {
      res.json({
        error: 'Path not found'
      });
    },
    default: function () {
      res.send('Path not found');
    }
  });
};

exports.clearOldArtifactSnapshotsAndLogs = async function (req, res) {
  try {
    // Three Months
    var threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    var dateTimeQuery = { $lt: threeMonthsAgo };
    var snapshotQuery = { $regex: 'SNAPSHOT|.noarch', $options: 'i' };
    // Documents
    var queryInfo = {
      managedconfig: true,
      name: snapshotQuery
    };
    var docBefore = await Document.find(queryInfo).count();
    await Document.deleteMany({
      managedconfig: true,
      created_at: dateTimeQuery,
      name: snapshotQuery
    });
    var docAfter = await Document.find(queryInfo).count();
    // Logs
    queryInfo = {
      'originalData.managedconfig': true,
      'originalData.name': snapshotQuery
    };
    var logBefore = await HistoryLogDocument.find(queryInfo).count();
    await HistoryLogDocument.deleteMany({
      'originalData.created_at': dateTimeQuery,
      'originalData.managedconfig': true,
      'originalData.name': snapshotQuery
    });
    var logAfter = await HistoryLogDocument.find(queryInfo).count();
    // Schemas
    queryInfo = {
      version: snapshotQuery
    };
    var schBefore = await Schema.find(queryInfo).count();
    var snapshotSchemas = await Schema.find({
      created_at: dateTimeQuery,
      version: snapshotQuery
    });
    await helperHandler.asyncForEach(snapshotSchemas, async function (schemaData) {
      var exists = await Document.find({ schema_id: schemaData._id });
      if (exists.length === 0) schemaData.remove();
    });
    var schAfter = await Schema.find(queryInfo).count();
    // Logs
    queryInfo = {
      'originalData.version': snapshotQuery
    };
    var HistoryLogSchema = HistoryLog.getSchema('schemas');
    var logSchBefore = await HistoryLogSchema.find(queryInfo).count();
    await HistoryLogSchema.deleteMany({
      'originalData.created_at': dateTimeQuery,
      'originalData.version': snapshotQuery
    });
    var logSchAfter = await HistoryLogSchema.find(queryInfo).count();
    var result = {
      managedConfigSnapshots: { before: docBefore, after: docAfter, deleted: docBefore - docAfter },
      managedConfigSnapshotLogs: { before: logBefore, after: logAfter, deleted: logBefore - logAfter },
      schemaSnapshots: { before: schBefore, after: schAfter, deleted: schBefore - schAfter },
      schemaSnapshotLogs: { before: logSchBefore, after: logSchAfter, deleted: logSchBefore - logSchAfter }
    };
    if (req) {
      result.message = 'Snapshots and Snapshot Logs cleared successfully';
      res.status(200).send(result);
    } else {
      return result;
    }
  } catch (clearingError) {
    if (req) {
      res.status(422).send({
        message: `Error Whilst clearing Snapshots and Snapshot Logs: ${clearingError.message}`
      });
    } else if (process.env.NODE_ENV === 'production') await sendMonthlyCleanupMail(false, clearingError);
  }
};

exports.clearOldDeletedArtifactLogs = async function (req, res) {
  try {
    var result = {};
    var sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    // Artifacts
    var before,
      after,
      HistoryLogArtifact;
    await helperHandler.asyncForEach(clearArtifactLogsFor, async function (artifact) {
      HistoryLogArtifact = HistoryLog.getSchema(artifact + 's');
      before = await HistoryLogArtifact.count();
      await HistoryLogArtifact.deleteMany({
        deletedAt: { $lt: sixMonthsAgo }
      });
      after = await HistoryLogArtifact.count();
      result[`${artifact}Logs`] = {
        before: before, after: after, deleted: before - after
      };
    });
    if (req) {
      result.message = 'Logs cleared successfully';
      res.status(200).send(result);
    } else {
      return result;
    }
  } catch (clearError) {
    if (req) {
      res.status(422).send({
        message: `Error Whilst clearing Logs: ${clearError.message}`
      });
    } else if (process.env.NODE_ENV === 'production') await sendMonthlyCleanupMail(false, clearError);
  }
};

// Tool's upgrade email
exports.getUpgradeEmail = async function (req, res) {
  var options = {
    uri: `${process.env.UPGRADE_TOOL_URL}/api/upgradeCheck?q=toolName=deployment-inventory-tool`,
    json: true
  };
  try {
    var toolResponse = await requestPromise.get(options);
    res.send(toolResponse);
  } catch (requestErr) {
    // 200 = Error in this api should not impact the tool itself
    return res.status(200).send({
      message: `Upgrade Tool Request Error: ${requestErr.message}`
    });
  }
};

exports.jiraIssueValidation = async function (request, response) {
  var jiraIssue = request.params.issue;
  jiraIssue = jiraIssue.trim();
  var jira = getJiraClient();
  await jira.issue.getIssue({
    issueKey: jiraIssue
  }, function (error, issue) {
    if (error) {
      if (error.errorMessages) {
        response.send({ valid: false, errorMessages: error.errorMessages });
      } else {
        response.send({ errorMessage: error });
      }
      return;
    }
    var viewUrl = `https://${process.env.JIRA_HOST}/browse/${jiraIssue}`;
    var team = 'None';
    if (issue.fields.customfield_20012) {
      team = issue.fields.customfield_20012.value;
    }
    response.send({
      valid: true,
      summary: issue.fields.summary,
      status: issue.fields.status.name,
      team: team,
      viewUrl: viewUrl
    });
  });
};

function getJiraClient() {
  let buff = Buffer.from(`${process.env.JIRA_USERNAME}:${process.env.JIRA_PASSWORD}`);
  var auth = buff.toString('base64');
  var jira = new JiraClient({
    host: process.env.JIRA_HOST,
    basic_auth: {
      base64: auth
    }
  });
  return jira;
}

exports.getJiraClient = getJiraClient;

async function sendMonthlyCleanupMail(result, error) {
  var emailSubject = 'DIT Monthly Logs Cleanup Result';
  var emailBody = `<a>Result: ${(error) ? 'Fail' : 'Success'}</a><br>
  <br>${(error) ? `${error}` : generateEmailBodyMonthlyCleanup(result)}`;
  var emailObject = {
    from: process.env.DIT_EMAIL_ADDRESS,
    to: process.env.TEAM_EMAIL,
    subject: emailSubject,
    html: emailBody
  };
  try {
    // Send email
    await mailTransporter.sendMail(emailObject);
  } catch (emailError) {
    logger.info(`Error whilst sending Monthly Cleanup Email: ${emailError}`);
  }
}

function generateEmailBodyMonthlyCleanup(results) {
  var body = '';
  for (var artifact in results) {
    if (results[artifact]) {
      var data = results[artifact];
      body += `<a>${artifact}:</a><hr>
      <a>Before: ${data.before} | After: ${data.after} | Deleted: ${data.deleted}</a><hr><br>`;
    }
  }
  return body;
}

// sec/min/hrs/day/mth/day(week)
cron.schedule('0 0 0 1 * *', async function () {
  if (process.env.NODE_ENV === 'production') {
    var artifactLogs = await exports.clearOldDeletedArtifactLogs(false, false);
    var snapshotsAndLogs = await exports.clearOldArtifactSnapshotsAndLogs(false, false);
    var finalResult = _.extend(artifactLogs, snapshotsAndLogs);
    // send mail
    await sendMonthlyCleanupMail(finalResult);
  }
});

exports.getToolNotifications = async function (req, res) {
  var options = {
    uri: `${process.env.UPGRADE_TOOL_URL}/api/toolnotifications/deployment-inventory-tool`,
    json: true
  };

  try {
    var toolResponse = await requestPromise.get(options);
    res.send(toolResponse);
  } catch (requestErr) {
    // 200 = Error in this api should not impact the tool itself
    return res.status(200).send({
      message: `Upgrade Tool Request Error: ${requestErr.message}`
    });
  }
};
