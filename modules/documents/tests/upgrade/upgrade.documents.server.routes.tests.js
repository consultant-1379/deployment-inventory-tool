'use strict';

var fs = require('fs');
var semver = require('semver'),
  should = require('should'),
  superagentDefaults = require('superagent-defaults'),
  supertest = require('supertest'),
  mongoose = require('mongoose');

var logger = require('../../../../config/lib/logger'),
  express = require('../../../../config/lib/express');

var Schema = mongoose.model('Schema'),
  Document = mongoose.model('Document'),
  User = mongoose.model('User');

var app,
  agent,
  validUser,
  userObject;

describe('Document', function () {
  before(async function () {
    app = express.init(mongoose);
    agent = superagentDefaults(supertest(app));
    validUser = JSON.parse(fs.readFileSync('/opt/mean.js/modules/deployments/tests/server/test_files/valid_user.json', 'utf8'));
    userObject = new User(validUser);
    await userObject.save();
    // Authorise User
    agent.auth(validUser.username, validUser.password);
  });

  describe('Upgrade Tests', function () {
    it('should upgrade all SED documents to latest schema', async function () {
      this.timeout(300000);
      var schemas = await Schema.find({ name: 'enm_sed' }).select('_id version').exec();
      var schemaVersions = [];
      var schemaIds = [];
      var docsThatFailedUpgrade = 0;
      var foundTooManyMCsFailure = 0;
      var didntFindMCsFailure = 0;
      var newKeysAddedToSchemaFailure = 0;
      var notEnoughIPvAddressesFailure = 0;
      var vnfLcmSedRequiredFailure = 0;
      var enmDeploymentTypeFailure = 0;
      var dnsFailure = 0;
      var unknownFailures = [];
      var schemaItem;

      for (schemaItem in schemas) {
        if (semver.valid(schemas[schemaItem].version)
          && schemas[schemaItem].version !== '1.54.9'
          && !schemas[schemaItem].version.includes('SNAPSHOT')) {
          schemaVersions.push(schemas[schemaItem].version);
        }
      }
      schemaVersions.sort(semver.rcompare);
      var schemaVersionN = schemaVersions.splice(0, 1)[0];
      var schemaVersionNid;
      for (schemaItem in schemas) {
        if (Object.prototype.hasOwnProperty.call(schemas, schemaItem)) {
          if (schemaVersions.includes(schemas[schemaItem].version)) {
            schemaIds.push(schemas[schemaItem]._id);
          }
          if (schemas[schemaItem].version === schemaVersionN) {
            schemaVersionNid = schemas[schemaItem]._id;
          }
        }
      }

      var docsOnLatestBeforeUpdate = await Document.find({ schema_id: schemaVersionNid }).select('_id version').exec();
      var schemaIdsFormatedForQuery = `[{"schema_id":"${schemaIds.toString().replace(/,/gi, '"},{"schema_id":"')}"}]`;
      var documentsToUpgrade = await Document.find({ $or: JSON.parse(schemaIdsFormatedForQuery), $and: [{ managedconfig: false }] }).select('_id').exec();
      for (var documentIndex in documentsToUpgrade) {
        if (Object.prototype.hasOwnProperty.call(documentsToUpgrade, documentIndex)) {
          // eslint-disable-next-line no-await-in-loop
          var response = await agent.put(`/api/documents/${documentsToUpgrade[documentIndex]._id}`).send({ schema_id: schemaVersionNid });
          if (response.status === 200) {
            logger.info('Document upgrade successful.');
          } else {
            logger.info('Document upgrade failed.');
            docsThatFailedUpgrade += 1;
            if (response.body.message.includes('Found too many managed configs')) {
              foundTooManyMCsFailure += 1;
            } else if (response.body.message.includes('There are not enough free')) {
              notEnoughIPvAddressesFailure += 1;
            } else if (response.body.message.includes('should have required property')) {
              newKeysAddedToSchemaFailure += 1;
            } else if (response.body.message.includes('Could not find a managed config')) {
              didntFindMCsFailure += 1;
            } else if (response.body.message.includes('For this ENM Schema version, a VNF-LCM SED is required.')) {
              vnfLcmSedRequiredFailure += 1;
            } else if (response.body.message.includes('parameters.enm_deployment_type')) {
              enmDeploymentTypeFailure += 1;
            } else if (response.body.message.includes('Unable to retrieve a hostname for ip') ||
              response.body.message.includes('Unable to retrieve an ip for hostname')) {
              dnsFailure += 1;
            } else {
              unknownFailures.push(`Doc ID: ${response.req.path.replace('/api/documents/', '')} ${response.body.message}`);
            }
          }
        }
      }
      var docsOnLatestAfterUpdate = await Document.find({ schema_id: schemaVersionNid }).select('_id version').exec();
      var docsUpgraded = docsOnLatestAfterUpdate.length - docsOnLatestBeforeUpdate.length;
      logger.info('-----------------------------------------------------');
      logger.info('-----------------------------------------------------');
      logger.info(`${documentsToUpgrade.length} SED Documents Found.`);
      logger.info('-----------------------------------------------------');
      logger.info(`${docsUpgraded} Documents Upgraded to latest Schema.`);
      logger.info(`${docsThatFailedUpgrade} Documents Failed to Upgrade.`);
      logger.info('-----------------------------------------------------');
      logger.info(`${foundTooManyMCsFailure} failures related to duplicate managed configs for a schema version.`);
      logger.info(`${didntFindMCsFailure} failures related to not finding a managed config with correct version and label.`);
      logger.info(`${notEnoughIPvAddressesFailure} failures related to not enough IP addresses.`);
      logger.info(`${newKeysAddedToSchemaFailure} failures related to keys added to schema.`);
      logger.info(`${vnfLcmSedRequiredFailure} failures related to VNF-LCM SED being required.`);
      logger.info(`${enmDeploymentTypeFailure} failures related to invalid enm_deployment_type enum.`);
      logger.info(`${dnsFailure} failures related to not being able to retrieve hostnames/ips from DNS.`);
      logger.info(`${unknownFailures.length} unknown failure(s) during document upgrade.`);
      logger.info('-----------------------------------------------------');
      if (unknownFailures.length) {
        logger.info('Please investigate the below failure(s): ');
        unknownFailures.forEach(function (element) {
          logger.info(element);
        });
      }
      logger.info('-----------------------------------------------------');
      logger.info('-----------------------------------------------------');
      unknownFailures.length.should.equal(0);
    });
  });
});
