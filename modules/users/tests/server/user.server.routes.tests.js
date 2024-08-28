'use strict';

process.env.LDAP_URL = 'ldap://ldap';
process.env.SEARCH_FILTER = '(cn={{username}})';
process.env.BASE_DN_LIST = 'dc=example,dc=org:dc=example,dc=org';
process.env.BIND_DN = 'cn=admin,dc=example,dc=org';
process.env.BIND_CREDENTIALS = 'admin';

var fs = require('fs'),
  superagentDefaults = require('superagent-defaults'),
  supertest = require('supertest'),
  _ = require('lodash'),
  mongoose = require('mongoose'),
  ldapjs = require('ldapjs'),
  passport = require('passport'),
  sinon = require('sinon'),
  User = require('../../server/models/user.server.model').Schema,
  express = require('../../../../config/lib/express');
require('should-sinon');

var app,
  agent,
  nonAuthAgent,
  localCredentials,
  ldapCredentials,
  localUser,
  localLdapUser,
  ldapSpy,
  ldapClient,
  validUser,
  validUser2,
  validUser3,
  userObject,
  userObject2,
  userObject3;

const ldapUser = {
  displayName: 'theDisplayName',
  givenName: 'theGivenName',
  sn: 'thesn',
  cn: 'ldapuser',
  mail: 'email@ericsson.com',
  userPassword: 'validPassword1',
  objectClass: ['person', 'organizationalPerson', 'inetOrgPerson']
};

var nodeEnv = process.env.NODE_ENV;

describe('User', function () {
  before(async function () {
    app = express.init(mongoose);
    nonAuthAgent = superagentDefaults(supertest(app));
    agent = superagentDefaults(supertest(app));
    ldapClient = ldapjs.createClient({
      url: process.env.LDAP_URL
    });
    await ldapClientBind(ldapClient, process.env.BIND_DN, process.env.BIND_CREDENTIALS);

    await ldapClientAdd(ldapClient, 'cn=ldapuser,dc=example,dc=org', ldapUser);
    var otherValidPasswords = [
      'validPassword2',
      'validPassword3',
      'validPassword4',
      'validPassword5',
      'validPassword6'
    ];
    var modifyPromises = [];
    for (var x = 0; x < otherValidPasswords.length; x += 1) {
      var change = new ldapjs.Change({
        operation: 'add',
        modification: {
          userPassword: otherValidPasswords[x]
        }
      });
      modifyPromises.push(ldapClientModify(ldapClient, 'cn=ldapuser,dc=example,dc=org', change));
    }
    await Promise.all(modifyPromises);
    ldapSpy = sinon.spy(passport, 'authenticate');
  });

  beforeEach(async function () {
    ldapSpy.resetHistory();
    localCredentials = JSON.parse(fs.readFileSync('/opt/mean.js/modules/users/tests/server/test_files/local_credentials.json', 'utf8'));
    ldapCredentials = JSON.parse(fs.readFileSync('/opt/mean.js/modules/users/tests/server/test_files/ldap_credentials.json', 'utf8'));
    validUser = JSON.parse(fs.readFileSync('/opt/mean.js/modules/deployments/tests/server/test_files/valid_user3.json', 'utf8'));
    validUser2 = JSON.parse(fs.readFileSync('/opt/mean.js/modules/deployments/tests/server/test_files/valid_user2.json', 'utf8'));
    validUser3 = JSON.parse(fs.readFileSync('/opt/mean.js/modules/deployments/tests/server/test_files/valid_user.json', 'utf8'));

    localUser = {
      firstName: 'Full',
      lastName: 'Name',
      displayName: 'Full Name',
      email: 'test@test.com',
      cn: localCredentials.username,
      username: localCredentials.username,
      password: localCredentials.password,
      provider: 'local'
    };

    localLdapUser = {
      firstName: 'Full',
      lastName: 'Names',
      displayName: 'Full Name',
      email: 'ldapTest@test.com',
      cn: ldapCredentials.username,
      username: ldapCredentials.username,
      password: ldapCredentials.password,
      provider: 'mockLdap'
    };
    userObject = new User(validUser); // superAdmin
    await userObject.save();
    userObject2 = new User(validUser2); // user
    await userObject2.save();
    userObject3 = new User(validUser3); // admin
    await userObject3.save();
    // Authorise User
    agent.auth(validUser.username, validUser.password);
  });

  describe('Message Body Sign In / Sign Out', function () {
    it('should be able to successfully login/logout with locally cached username/password without contacting mock ldap', async function () {
      var localUserObject = new User(localUser);
      await localUserObject.save();
      await agent.post('/api/auth/signin').send(localCredentials).expect(200);
      var response = await agent.get('/api/auth/signout').expect(302);
      response.redirect.should.equal(true);
      response.text.should.equal('Found. Redirecting to /authentication/signin');
      ldapSpy.should.not.be.called();
    });

    it('should not be able login with invalid username and password', async function () {
      this.retries(10);
      var response = await agent.post('/api/auth/signin').send({ username: 'invalid', password: 'invalid' }).expect(422);
      response.redirect.should.equal(false);
      response.body.message.should.equal('Invalid username or password');
      ldapSpy.should.be.calledTwice();
    });

    it('should be able to successfully login/logout with username/password with mock ldap strategy', async function () {
      this.retries(10);
      await agent.post('/api/auth/signin').send(ldapCredentials).expect(200);
      var response = await agent.get('/api/auth/signout').expect(302);
      response.redirect.should.equal(true);
      response.text.should.equal('Found. Redirecting to /authentication/signin');
      ldapSpy.should.be.calledTwice();
    });

    it('should be able to successfully login/logout with uppercase username with mock ldap strategy', async function () {
      this.retries(10);
      ldapCredentials.username = 'LDAPUSER';
      await agent.post('/api/auth/signin').send(ldapCredentials).expect(200);
      var response = await agent.get('/api/auth/signout').expect(302);
      response.redirect.should.equal(true);
      response.text.should.equal('Found. Redirecting to /authentication/signin');
      ldapSpy.should.be.calledTwice();
    });

    it('should be able to successfully login/logout with username, new password and with mock ldap strategy', async function () {
      this.retries(10);
      var localLdapUserObject = new User(localLdapUser);
      await localLdapUserObject.save();
      ldapCredentials.password = 'validPassword3';
      await agent.post('/api/auth/signin').send(ldapCredentials).expect(200);
      var response = await agent.get('/api/auth/signout').expect(302);
      response.redirect.should.equal(true);
      response.text.should.equal('Found. Redirecting to /authentication/signin');
      ldapSpy.should.be.calledTwice();
    });
  });

  describe('BASIC Authentication Sign In', function () {
    it('should not log in without credentials', async function () {
      this.retries(10);
      var response = await nonAuthAgent.get('/api/logintest').expect(401);
      response.text.should.equal('Unauthorized');
    });

    it('should not log in with invalid credentials', async function () {
      this.retries(10);
      var response = await agent.get('/api/logintest').auth('invalid', 'invalid').expect(401);
      response.body.message.should.equal('Invalid username or password');
    });

    it('should log in with valid ldap credentials and create a local user', async function () {
      this.retries(10);
      var response = await agent.get('/api/logintest').auth(ldapCredentials.username, ldapCredentials.password).expect(200);
      response.body.message.should.equal('success');
      ldapSpy.should.be.calledTwice();
      var userObject = await User.findOne({ username: ldapCredentials.username }).exec();
      userObject.firstName.should.equal(ldapUser.givenName);
    });

    it('should log in with valid local credentials and not go to ldap', async function () {
      this.retries(10);
      var localLdapUserObject = new User(localLdapUser);
      await localLdapUserObject.save();
      await agent.get('/api/logintest').auth(ldapCredentials.username, ldapCredentials.password).expect(200);
      ldapSpy.should.not.be.called();
      var userObject = await User.findOne({ username: ldapCredentials.username }).exec();
      userObject.firstName.should.equal(localLdapUser.firstName);
    });

    it('should log in where local user in db has the wrong password but user has valid ldap credentials and local user should be updated', async function () {
      this.retries(10);
      var localLdapUserObject = new User(localLdapUser);
      await localLdapUserObject.save();
      await agent.get('/api/logintest').auth(ldapCredentials.username, 'validPassword4').expect(200);
      ldapSpy.should.be.calledTwice();
      ldapSpy.resetHistory();
      await agent.get('/api/logintest').auth(ldapCredentials.username, 'validPassword4').expect(200);
      ldapSpy.should.not.be.called();
    });
  });

  describe('User Permission Policy', function () {
    it('should not be able to update an existing user when user is admin user', async function () {
      process.env.NODE_ENV = 'policyCheckEnabled';
      var localLdapUserObject = new User(localLdapUser);
      await localLdapUserObject.save();
      var response = await agent.put(`/api/users/${localLdapUserObject._id}`)
        .auth(validUser3.username, validUser3.password).send(localLdapUser).expect(403);
      response.body.message.should.equal('User is not authorized');
      process.env.NODE_ENV = nodeEnv;
    });

    it('should be able to list users when user is superAdmin user', async function () {
      var response = await agent.get('/api/users/').expect(200);
      response.body.length.should.equal(3);
    });

    it('should be able to list users when user is standard user', async function () {
      var response = await agent.get('/api/users/').auth(validUser2.username, validUser2.password).expect(200);
      response.body.length.should.equal(3);
    });

    it('should not be able to update an existing user when user is standard user', async function () {
      process.env.NODE_ENV = 'policyCheckEnabled';
      var localLdapUserObject = new User(localLdapUser);
      await localLdapUserObject.save();
      var response = await agent.put(`/api/users/${localLdapUserObject._id}`)
        .auth(validUser2.username, validUser2.password).send(localLdapUser).expect(403);
      response.body.message.should.equal('User is not authorized');
      process.env.NODE_ENV = nodeEnv;
    });

    it('should be able to update an existing user when user is superAdmin user', async function () {
      process.env.NODE_ENV = 'policyCheckEnabled';
      localLdapUser.roles = ['admin'];
      var localLdapUserObject = new User(localLdapUser);
      await localLdapUserObject.save();
      var response = await agent.put(`/api/users/${localLdapUserObject._id}`)
        .auth(validUser.username, validUser.password).send(localLdapUser).expect(200);
      response.body.roles[0].should.equal(localLdapUser.roles[0]);
      process.env.NODE_ENV = nodeEnv;
    });
  });

  afterEach(async function () {
    await User.remove().exec();
  });

  after(async function () {
    await ldapClientDel(ldapClient, 'cn=ldapuser,dc=example,dc=org');
  });
});

function ldapClientBind(ldapClient, user, pass) {
  return new Promise(function (resolve, reject) {
    ldapClient.bind(user, pass, function (err) {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
}

function ldapClientDel(ldapClient, base) {
  return new Promise(function (resolve, reject) {
    ldapClient.del(base, function (err) {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
}

function ldapClientAdd(ldapClient, base, entry) {
  return new Promise(function (resolve, reject) {
    ldapClient.add(base, entry, function (err) {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
}

function ldapClientModify(ldapClient, base, change) {
  return new Promise(function (resolve, reject) {
    ldapClient.modify(base, change, function (err) {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
}
