'use strict';

var fs = require('fs');
var _ = require('lodash'),
  chai = require('chai'),
  chaiHttp = require('chai-http'),
  expect = chai.expect,
  semver = require('semver'),
  should = require('should'),
  mongoose = require('mongoose'),
  superagentDefaults = require('superagent-defaults'),
  supertest = require('supertest'),
  User = require('../../../users/server/models/user.server.model').Schema,
  config = require('../../../.././config/config'),
  logger = require('../../../../config/lib/logger'),
  seed = require('../../../../config/lib/seed'),
  express = require('../../../../config/lib/express'),
  Schema = mongoose.model('Schema'),
  Pod = mongoose.model('Pod'),
  Group = mongoose.model('Group'),
  Document = mongoose.model('Document'),
  HistoryDocuments = require('../../../history/server/models/history.server.model').getSchema('documents'),
  HistoryPods = require('../../../history/server/models/history.server.model').getSchema('pods'),
  HistorySchemas = require('../../../history/server/models/history.server.model').getSchema('schemas');
chai.use(chaiHttp);

var app,
  agent,
  nonAuthAgent,
  user1,
  admin1,
  userFromSeedConfig,
  adminFromSeedConfig,
  originalLogConfig,
  userObject,
  userObject2,
  groupObject,
  groupReturned,
  validUser,
  validGroup,
  schema,
  validSchema,
  pod,
  validPod,
  validManagedConfigSnapshot;

var nodeEnv = process.env.NODE_ENV;

describe('Configuration Tests:', function () {
  describe('Testing default seedDB', function () {
    before(function (done) {
      User.remove(function (err) {
        should.not.exist(err);

        user1 = JSON.parse(fs.readFileSync('/opt/mean.js/modules/core/tests/server/test_files/user1.json', 'utf8'));
        admin1 = JSON.parse(fs.readFileSync('/opt/mean.js/modules/core/tests/server/test_files/admin1.json', 'utf8'));

        userFromSeedConfig = config.seedDB.options.seedUser;
        adminFromSeedConfig = config.seedDB.options.seedAdmin;

        return done();
      });
    });

    after(function (done) {
      User.remove(function (err) {
        should.not.exist(err);
        return done();
      });
    });

    it('should have seedDB configuration set for "regular" user', function () {
      (typeof userFromSeedConfig).should.not.equal('undefined');
      should.exist(userFromSeedConfig.username);
      should.exist(userFromSeedConfig.email);
    });

    it('should have seedDB configuration set for admin user', function () {
      (typeof adminFromSeedConfig).should.not.equal('undefined');
      should.exist(adminFromSeedConfig.username);
      should.exist(adminFromSeedConfig.email);
    });

    it('should not be an admin user to begin with', function (done) {
      User.find({ username: 'seedadmin' }, function (err, users) {
        should.not.exist(err);
        users.should.be.instanceof(Array).and.have.lengthOf(0);
        return done();
      });
    });

    it('should not be a "regular" user to begin with', function (done) {
      User.find({ username: 'seeduser' }, function (err, users) {
        should.not.exist(err);
        users.should.be.instanceof(Array).and.have.lengthOf(0);
        return done();
      });
    });

    it('should seed ONLY the admin user account when NODE_ENV is set to "production"', function (done) {
      // Set node env to test environment
      process.env.NODE_ENV = 'production';

      User.find({ username: adminFromSeedConfig.username }, function (err, users) {
        // There shouldn't be any errors
        should.not.exist(err);
        users.should.be.instanceof(Array).and.have.lengthOf(0);

        seed
          .start({ logResults: false })
          .then(function () {
            User.find({ username: adminFromSeedConfig.username }, function (err, users) {
              should.not.exist(err);
              users.should.be.instanceof(Array).and.have.lengthOf(1);

              var _admin = users.pop();
              _admin.username.should.equal(adminFromSeedConfig.username);

              // Restore original NODE_ENV environment variable
              process.env.NODE_ENV = nodeEnv;

              User.remove(function (err) {
                should.not.exist(err);
                return done();
              });
            });
          });
      });
    });

    it('should seed admin, and "regular" user accounts when NODE_ENV is set to "test"', function (done) {
      // Set node env to test environment
      process.env.NODE_ENV = 'test';

      User.find({ username: adminFromSeedConfig.username }, function (err, users) {
        // There shouldn't be any errors
        should.not.exist(err);
        users.should.be.instanceof(Array).and.have.lengthOf(0);

        seed
          .start({ logResults: false })
          .then(function () {
            User.find({ username: adminFromSeedConfig.username }, function (err, users) {
              should.not.exist(err);
              users.should.be.instanceof(Array).and.have.lengthOf(1);

              var _admin = users.pop();
              _admin.username.should.equal(adminFromSeedConfig.username);

              User.find({ username: userFromSeedConfig.username }, function (err, users) {
                should.not.exist(err);
                users.should.be.instanceof(Array).and.have.lengthOf(1);

                var _user = users.pop();
                _user.username.should.equal(userFromSeedConfig.username);

                // Restore original NODE_ENV environment variable
                process.env.NODE_ENV = nodeEnv;

                User.remove(function (err) {
                  should.not.exist(err);
                  return done();
                });
              });
            });
          });
      });
    });

    it('should seed admin, and "regular" user accounts when NODE_ENV is set to "test" when they already exist', function (done) {
      // Set node env to test environment
      process.env.NODE_ENV = 'test';

      var _user = new User(userFromSeedConfig);
      var _admin = new User(adminFromSeedConfig);

      _admin.save(function (err) {
        // There shouldn't be any errors
        should.not.exist(err);
        _user.save(function (err) {
          // There shouldn't be any errors
          should.not.exist(err);

          User.find({ username: { $in: [adminFromSeedConfig.username, userFromSeedConfig.username] } }, function (err, users) {
            // There shouldn't be any errors
            should.not.exist(err);
            users.should.be.instanceof(Array).and.have.lengthOf(2);

            seed
              .start({ logResults: false })
              .then(function () {
                User.find({ username: { $in: [adminFromSeedConfig.username, userFromSeedConfig.username] } }, function (err, users) {
                  should.not.exist(err);
                  users.should.be.instanceof(Array).and.have.lengthOf(2);

                  // Restore original NODE_ENV environment variable
                  process.env.NODE_ENV = nodeEnv;

                  User.remove(function (err) {
                    should.not.exist(err);
                    return done();
                  });
                });
              });
          });
        });
      });
    });

    it('should ONLY seed admin user account when NODE_ENV is set to "production" with custom admin', function (done) {
      // Set node env to test environment
      process.env.NODE_ENV = 'production';

      User.find({ username: admin1.username }, function (err, users) {
        // There shouldn't be any errors
        should.not.exist(err);
        users.should.be.instanceof(Array).and.have.lengthOf(0);

        seed
          .start({ logResults: false, seedAdmin: admin1 })
          .then(function () {
            User.find({ username: admin1.username }, function (err, users) {
              should.not.exist(err);
              users.should.be.instanceof(Array).and.have.lengthOf(1);

              var _admin = users.pop();
              _admin.username.should.equal(admin1.username);

              // Restore original NODE_ENV environment variable
              process.env.NODE_ENV = nodeEnv;

              User.remove(function (err) {
                should.not.exist(err);
                return done();
              });
            });
          });
      });
    });

    it('should seed admin, and "regular" user accounts when NODE_ENV is set to "test" with custom options', function (done) {
      // Set node env to test environment
      process.env.NODE_ENV = 'test';

      User.find({ username: admin1.username }, function (err, users) {
        // There shouldn't be any errors
        should.not.exist(err);
        users.should.be.instanceof(Array).and.have.lengthOf(0);

        seed
          .start({ logResults: false, seedAdmin: admin1, seedUser: user1 })
          .then(function () {
            User.find({ username: admin1.username }, function (err, users) {
              should.not.exist(err);
              users.should.be.instanceof(Array).and.have.lengthOf(1);

              var _admin = users.pop();
              _admin.username.should.equal(admin1.username);

              User.find({ username: user1.username }, function (err, users) {
                should.not.exist(err);
                users.should.be.instanceof(Array).and.have.lengthOf(1);

                var _user = users.pop();
                _user.username.should.equal(user1.username);

                // Restore original NODE_ENV environment variable
                process.env.NODE_ENV = nodeEnv;

                User.remove(function (err) {
                  should.not.exist(err);
                  return done();
                });
              });
            });
          });
      });
    });

    it('should NOT seed admin user account if it already exists when NODE_ENV is set to "production"', function (done) {
      // Set node env to test environment
      process.env.NODE_ENV = 'production';

      var _admin = new User(adminFromSeedConfig);

      _admin.save(function (err, user) {
        // There shouldn't be any errors
        should.not.exist(err);
        user.username.should.equal(adminFromSeedConfig.username);

        seed
          .start({ logResults: false })
          .then(function () {
            // we don't ever expect to make it here but we don't want to timeout
            User.remove(function (err) {
              should.not.exist(err);
              // force this test to fail since we should never be here
              should.exist(undefined);
              // Restore original NODE_ENV environment variable
              process.env.NODE_ENV = nodeEnv;

              return done();
            });
          })
          .catch(function (err) {
            should.exist(err);
            err.message.should.equal(`Failed due to local account already exists: ${adminFromSeedConfig.username}`);

            // Restore original NODE_ENV environment variable
            process.env.NODE_ENV = nodeEnv;

            User.remove(function (removeErr) {
              should.not.exist(removeErr);

              return done();
            });
          });
      });
    });

    it('should NOT seed "regular" user account if missing email when NODE_ENV set to "test"', function (done) {
      // Set node env to test environment
      process.env.NODE_ENV = 'test';

      var _user = new User(user1);
      _user.email = '';

      seed
        .start({ logResults: false, seedUser: _user })
        .then(function () {
          // we don't ever expect to make it here but we don't want to timeout
          User.remove(function () {
            // force this test to fail since we should never be here
            should.exist(undefined);
            // Restore original NODE_ENV environment variable
            process.env.NODE_ENV = nodeEnv;

            return done();
          });
        })
        .catch(function (err) {
          should.exist(err);
          err.message.should.equal(`Failed to add local ${user1.username}`);

          // Restore original NODE_ENV environment variable
          process.env.NODE_ENV = nodeEnv;

          User.remove(function (removeErr) {
            should.not.exist(removeErr);

            return done();
          });
        });
    });
  });

  describe('Testing Session Secret Configuration', function () {
    it('should warn if using default session secret when running in production', function (done) {
      var conf = { sessionSecret: 'MEAN' };
      // set env to production for this test
      process.env.NODE_ENV = 'production';
      config.utils.validateSessionSecret(conf, true).should.equal(false);
      // set env back to test
      process.env.NODE_ENV = nodeEnv;
      return done();
    });

    it('should accept non-default session secret when running in production', function () {
      var conf = { sessionSecret: 'super amazing secret' };
      // set env to production for this test
      process.env.NODE_ENV = 'production';
      config.utils.validateSessionSecret(conf, true).should.equal(true);
      // set env back to test
      process.env.NODE_ENV = nodeEnv;
    });

    it('should accept default session secret when running in development', function () {
      var conf = { sessionSecret: 'MEAN' };
      // set env to development for this test
      process.env.NODE_ENV = 'development';
      config.utils.validateSessionSecret(conf, true).should.equal(true);
      // set env back to test
      process.env.NODE_ENV = nodeEnv;
    });

    it('should accept default session secret when running in test', function () {
      var conf = { sessionSecret: 'MEAN' };
      config.utils.validateSessionSecret(conf, true).should.equal(true);
    });
  });

  describe('Testing DIT Version and 404 page', function () {
    it('should return DIT version', function (done) {
      app = express.init(mongoose);
      agent = superagentDefaults(supertest(app));
      agent.get('/api/version')
        .expect(200)
        .end(function (err, res) {
          if (err) {
            return done(err);
          }
          if (!semver.gt(res.text, '0.0.0')) {
            return done(new Error('Invalid version'));
          }
          return done();
        });
    });

    it('should trigger 404 page', function (done) {
      app = express.init(mongoose);
      agent = superagentDefaults(supertest(app));
      agent.get('/api/nonsense')
        .expect(404)
        .end(function (err, res) {
          if (err) {
            return done(err);
          }
          return done();
        });
    });
  });

  describe('Testing Logger Configuration', function () {
    beforeEach(function () {
      originalLogConfig = _.clone(config.log, true);
    });

    afterEach(function () {
      config.log = originalLogConfig;
    });

    it('should retrieve the log format from the logger configuration', function () {
      config.log = {
        format: 'tiny'
      };

      var format = logger.getLogFormat();
      format.should.be.equal('tiny');
    });

    it('should retrieve the log options from the logger configuration for a valid stream object', function () {
      var options = logger.getMorganOptions();

      options.should.be.instanceof(Object);
      options.should.have.property('stream');
    });

    it('should verify that a file logger object was created using the logger configuration', function () {
      var _dir = process.cwd();
      var _filename = 'unit-test-access.log';

      config.log = {
        fileLogger: {
          directoryPath: _dir,
          fileName: _filename
        }
      };

      var fileTransport = logger.getLogOptions(config);
      fileTransport.should.be.instanceof(Object);
      fileTransport.filename.should.equal(`${_dir}/${_filename}`);
    });

    it('should use the default log format of "combined" when an invalid format was provided', function () {
      var _logger = require('../../../../config/lib/logger'); // eslint-disable-line global-require

      // manually set the config log format to be invalid
      config.log = {
        format: '_some_invalid_format_'
      };

      var format = _logger.getLogFormat();
      format.should.be.equal('combined');
    });

    it('should not create a file transport object if critical options are missing: filename', function () {
      // manually set the config stream fileName option to an empty string
      config.log = {
        format: 'combined',
        options: {
          stream: {
            directoryPath: process.cwd(),
            fileName: ''
          }
        }
      };

      var fileTransport = logger.getLogOptions(config);
      fileTransport.should.be.false();
    });

    it('should not create a file transport object if critical options are missing: directory', function () {
      // manually set the config stream fileName option to an empty string
      config.log = {
        format: 'combined',
        options: {
          stream: {
            directoryPath: '',
            fileName: 'app.log'
          }
        }
      };

      var fileTransport = logger.getLogOptions(config);
      fileTransport.should.be.false();
    });
  });

  describe('Testing exposing environment as a variable to layout', function () {
    ['development', 'production', 'test'].forEach(function (env) {
      it(`should expose environment set to ${env}`, function (done) {
        // Set env to development for this test
        process.env.NODE_ENV = env;

        // Get application
        app = express.init(mongoose);
        agent = superagentDefaults(supertest(app));

        // Get rendered layout
        agent.get('/')
          .expect('Content-Type', 'text/html; charset=utf-8')
          .expect(200)
          .end(function (err, res) {
            // Set env back to test
            process.env.NODE_ENV = nodeEnv;
            // Handle errors
            if (err) {
              return done(err);
            }
            res.text.should.containEql(`env = "${env}"`);
            return done();
          });
      });
    });
  });

  describe('CORE API Functionality', function () {
    before(async function () {
      app = express.init(mongoose);
      nonAuthAgent = superagentDefaults(supertest(app));
      agent = superagentDefaults(supertest(app));
    });

    describe('Testing GET /api/jiraIssueValidation', function () {
      it('should return valid true', async function () {
        var response = await agent.get('/api/jiraIssueValidation/CIP-30065').expect(200);
        expect(response.body.valid).to.equal(true);
      });

      it('should return valid false', async function () {
        var response = await agent.get('/api/jiraIssueValidation/notAJira999').expect(200);
        expect(response.body.valid).to.equal(false);
      });

      it('should return team as None', async function () {
        var response = await agent.get('/api/jiraIssueValidation/ETTS-5838').expect(200);
        expect(response.body.valid).to.equal(true);
        expect(response.body.team).to.equal('None');
      });

      it('should return team as Stratus', async function () {
        var response = await agent.get('/api/jiraIssueValidation/CIP-30065').expect(200);
        expect(response.body.valid).to.equal(true);
        expect(response.body.team).to.equal('Stratus');
      });

      it('should return 404 status when no JIRA Issue is provided', async function () {
        var response = await agent.get('/api/jiraIssueValidation/').expect(404);
      });
    });

    describe('Testing GET /api/upgradeEmail', function () {
      it('should return 200', async function () {
        var response = await agent.get('/api/upgradeEmail').expect(200);
      });
    });

    describe('GET /api/toolnotifications', function () {
      it('should return 200', async function () {
        var response = await agent.get('/api/toolnotifications').expect(200);
      });
    });

    describe('Testing GET /api/clearOldSnapshotsAndLogs', function () {
      before(async function () {
        validSchema = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/valid_schema.json', 'utf8'));
        validManagedConfigSnapshot = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/valid_document.json', 'utf8'));
        validUser = JSON.parse(fs.readFileSync('/opt/mean.js/modules/deployments/tests/server/test_files/valid_user3.json', 'utf8'));

        schema = new Schema(validSchema);
        schema.created_at = '2020-04-22T12:04:27.424Z';
        schema.version = '1.1.1-SNAPSHOT.noarch';
        await schema.save();

        validManagedConfigSnapshot.name = 'managedConfig_SNAPSHOT.noarch';
        validManagedConfigSnapshot.schema_id = schema._id;
        validManagedConfigSnapshot.managedconfig = true;
        validManagedConfigSnapshot.created_at = '2020-04-22T12:04:27.424Z';
        validUser.username = 'uniqueUsername';
        validUser.email = 'uniqueEmail@ericsson.com';
        userObject = new User(validUser);
        await userObject.save();

        validGroup = {
          name: 'groupName1',
          admin_IDs: [userObject._id],
          users: [],
          associatedDocuments: []
        };
        groupObject = new Group(validGroup);
        groupReturned = await groupObject.save();

        // Authorise User
        agent.auth(validUser.username, validUser.password);
      });

      it('should return success message when triggering cleanup for Snapshots', async function () {
        var response = await agent.get('/api/clearOldSnapshotsAndLogs').expect(200);
        expect(response.body.message).to.equal('Snapshots and Snapshot Logs cleared successfully');
      });

      it('should remove old Snapshot when triggering a cleanup', async function () {
        schema = new Schema(validSchema);
        schema.created_at = '2020-04-22T12:04:27.424Z';
        schema.version = '1.1.1-SNAPSHOT.noarch';
        await schema.save();
        var managedConfSnap = new Document(validManagedConfigSnapshot);
        managedConfSnap.schema_id = schema._id;
        await managedConfSnap.save();
        // get number of managed configs
        var response = await agent.get('/api/documents').expect(200);
        response.body.should.be.instanceof(Array).and.have.lengthOf(1);
        response.body[0].schema_id.should.be.equal(schema._id.toString());
        response = await agent.get('/api/clearOldSnapshotsAndLogs').expect(200);
        expect(response.body.message).to.equal('Snapshots and Snapshot Logs cleared successfully');
        // wait for snapshot to be cleared
        response = await agent.get('/api/documents').expect(200);
        response.body.should.be.instanceof(Array).and.have.lengthOf(0);
        response = await agent.get('/api/logs/documents').expect(200);
        response.body.should.be.instanceof(Array).and.have.lengthOf(0);
        // Schema snapshot to be cleared
        response = await agent.get('/api/schemas').expect(200);
        response.body.should.be.instanceof(Array).and.have.lengthOf(0);
        response = await agent.get('/api/logs/schemas').expect(200);
        response.body.should.be.instanceof(Array).and.have.lengthOf(0);
      });

      it('should not remove old Snapshot with documents when triggering a cleanup', async function () {
        schema = new Schema(validSchema);
        schema.created_at = '2020-04-22T12:04:27.424Z';
        schema.version = '1.1.2-SNAPSHOT.noarch';
        await schema.save();
        delete validManagedConfigSnapshot.created_at;
        validManagedConfigSnapshot.name = 'managedConfig_SNAPSHOT.noarch';
        var managedConfSnap = new Document(validManagedConfigSnapshot);
        managedConfSnap.schema_id = schema._id;
        await managedConfSnap.save();
        // get number of managed configs
        var response = await agent.get('/api/documents').expect(200);
        response.body.should.be.instanceof(Array).and.have.lengthOf(1);
        response.body[0].schema_id.should.be.equal(schema._id.toString());
        response = await agent.get('/api/clearOldSnapshotsAndLogs').expect(200);
        expect(response.body.message).to.equal('Snapshots and Snapshot Logs cleared successfully');
        // wait for snapshot wasn't cleared
        response = await agent.get('/api/documents').expect(200);
        response.body.should.be.instanceof(Array).and.have.lengthOf(1);
        // Schema snapshot wasn't cleared
        response = await agent.get('/api/schemas').expect(200);
        response.body.should.be.instanceof(Array).and.have.lengthOf(1);
        await Document.remove().exec();
        await Schema.remove().exec();
      });
    });

    describe('Testing GET /api/clearOldDeletedLogs', function () {
      before(async function () {
        validSchema = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/valid_schema.json', 'utf8'));
        validManagedConfigSnapshot = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/valid_document.json', 'utf8'));
        validUser = JSON.parse(fs.readFileSync('/opt/mean.js/modules/deployments/tests/server/test_files/valid_user3.json', 'utf8'));
        schema = new Schema(validSchema);
        schema.name = 'ValidSchemaName2';
        await schema.save();
        validManagedConfigSnapshot.name = 'managedConfig_SNAPSHOT2';
        validManagedConfigSnapshot.schema_id = schema._id;
        validManagedConfigSnapshot.managedconfig = true;
        validPod = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/valid_pod.json', 'utf8'));
        pod = new Pod(validPod);
        pod.name = 'ValidPodName';
        await pod.save();
        validUser.username = 'uniqueUsername2';
        validUser.email = 'uniqueEmail2@ericsson.com';
        userObject2 = new User(validUser);
        await userObject2.save();

        // Authorise User
        agent.auth(validUser.username, validUser.password);
      });

      it('should return success message when triggering cleanup for old deleted logs', async function () {
        var response = await nonAuthAgent.get('/api/clearOldDeletedLogs').expect(200);
        expect(response.body.message).to.equal('Logs cleared successfully');
      });

      it('should remove deleted document logs older than six months when triggering a cleanup', async function () {
        var managedConfSnap = new Document(validManagedConfigSnapshot);
        await managedConfSnap.save();
        // get number of managed configs
        var response = await nonAuthAgent.get('/api/documents').expect(200);
        response.body.should.be.instanceof(Array).and.have.lengthOf(1);
        response.body[0].schema_id.should.be.equal(schema._id.toString());
        await agent.delete(`/api/documents/${response.body[0]._id}`).expect(200);
        response = await nonAuthAgent.get('/api/logs/documents').expect(200);
        response.body.should.be.instanceof(Array).and.have.lengthOf(1);
        var sevenMonthsAgo = new Date();
        sevenMonthsAgo.setMonth(sevenMonthsAgo.getMonth() - 7);
        var documentLog = await HistoryDocuments.findOne({ associated_id: response.body[0].associated_id }).exec();
        documentLog.deletedAt = sevenMonthsAgo;
        await documentLog.save();
        await nonAuthAgent.get('/api/clearOldDeletedLogs').expect(200);
        response = await nonAuthAgent.get('/api/logs/documents').expect(200);
        expect(response.body).to.be.an('array');
        expect(response.body.length).to.equal(0);
      });

      it('should remove deleted pods logs older than six months when triggering a cleanup', async function () {
        await agent.delete(`/api/pods/${pod._id}`).expect(200);
        var response = await nonAuthAgent.get('/api/logs/pods').expect(200);
        var arrayLengthReceived = response.body.length;
        var podLog = await HistoryPods.findOne({ associated_id: response.body[0].associated_id }).exec();
        podLog.deletedAt = '2020-04-22T12:04:27.424Z';
        await podLog.save();

        await nonAuthAgent.get('/api/clearOldDeletedLogs').expect(200);
        response = await nonAuthAgent.get('/api/logs/pods').expect(200);
        response.body.should.be.instanceof(Array).and.have.lengthOf(arrayLengthReceived - 1);
      });

      it('should remove deleted schemas logs older than six months when triggering a cleanup', async function () {
        var response = await nonAuthAgent.get('/api/schemas').expect(200);
        response.body[0]._id.should.be.equal(schema._id.toString());

        await agent.delete(`/api/schemas/${response.body[0]._id}`).expect(200);
        response = await nonAuthAgent.get('/api/logs/schemas').expect(200);
        var arrayLengthReceived = response.body.length;

        var sevenMonthsAgo = new Date();
        sevenMonthsAgo.setMonth(sevenMonthsAgo.getMonth() - 7);
        var schemaLog = await HistorySchemas.findOne({ associated_id: response.body[0].associated_id }).exec();
        schemaLog.deletedAt = sevenMonthsAgo;
        await schemaLog.save();

        await nonAuthAgent.get('/api/clearOldDeletedLogs').expect(200);
        response = await nonAuthAgent.get('/api/logs/schemas').expect(200);
        response.body.should.be.instanceof(Array).and.have.lengthOf(arrayLengthReceived - 1);
      });
    });
  });
});
