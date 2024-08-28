'use strict';

var fs = require('fs');
var should = require('should'),
  superagentDefaults = require('superagent-defaults'),
  supertest = require('supertest'),
  mongoose = require('mongoose'),
  _ = require('lodash'),
  History = require('../../../history/server/models/history.server.model').getSchema('documents'),
  Schema = mongoose.model('Schema'),
  Group = mongoose.model('Group'),
  User = mongoose.model('User'),
  Document = mongoose.model('Document'),
  Project = mongoose.model('Project'),
  Pod = mongoose.model('Pod'),
  Deployment = mongoose.model('Deployment'),
  Label = mongoose.model('Label'),
  express = require('../../../../config/lib/express');

var app,
  agent,
  validSchema,
  schema,
  backwardCompatibleExternalNFSSubEnmSedSchema,
  externalNFSSubEnmSedSchema,
  enmSedSchemaObject,
  enmSedSchemaObjectReturned,
  validDocument,
  backwardCompatibleValidUseExternalNfsTrueEnmSedDocument,
  validUseExternalNFSSubEnmSedDocument,
  validInternalNFSEnmSedDocument,
  validInternalNFSSubEnmSedDocument,
  validEnmSedManagedConfig,
  documentResponse,
  documentReturned,
  validDeployment,
  response,
  vrrpKeys,
  validDocumentUpdate,
  validUser,
  validUser2,
  validUser3,
  userObject,
  userObject2,
  userObject3,
  validGroup,
  groupObject,
  groupReturned;

const expectedBackwardUseExternalNfsTrue = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/expected_backward_use_external_nfs_true.json', 'utf8'));
const expectedWhenUseExternalNfsTrue = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/expected_when_use_external_nfs_true.json', 'utf8'));
const expectedWhenUseExternalNfsFalse = { parameters: {} };

describe('Documents ExternalNfs', function () {
  before(async function () {
    app = express.init(mongoose);
    agent = superagentDefaults(supertest(app));
  });
  beforeEach(async function () {
    validSchema = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/valid_schema.json', 'utf8'));
    validDocument = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/valid_document.json', 'utf8'));
    backwardCompatibleValidUseExternalNfsTrueEnmSedDocument = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/backwardCompatible_validUseExternalNfsTrue_enmSedDocument.json', 'utf8'));
    validUseExternalNFSSubEnmSedDocument = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/valid_useExternalNFS_sub_enmSed_document.json', 'utf8'));
    validInternalNFSEnmSedDocument = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/valid_internal_nfs_enm_sed_document.json', 'utf8'));
    validInternalNFSSubEnmSedDocument = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/valid_internal_nfs_sub_enm_sed_document.json', 'utf8'));
    validEnmSedManagedConfig = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/valid_enm_sed_managed_config.json', 'utf8'));
    validDeployment = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/valid_deployment.json', 'utf8'));
    backwardCompatibleExternalNFSSubEnmSedSchema = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/backwardCompatible_externalNFS_sub_enm_sed_schema.json', 'utf8'));
    externalNFSSubEnmSedSchema = JSON.parse(fs.readFileSync('/opt/mean.js/modules/documents/tests/server/test_files/external_nfs_sub_enm_sed_schema.json', 'utf8'));
    validUser = JSON.parse(fs.readFileSync('/opt/mean.js/modules/deployments/tests/server/test_files/valid_user.json', 'utf8'));
    validUser2 = JSON.parse(fs.readFileSync('/opt/mean.js/modules/deployments/tests/server/test_files/valid_user2.json', 'utf8'));
    validUser3 = JSON.parse(fs.readFileSync('/opt/mean.js/modules/deployments/tests/server/test_files/valid_user3.json', 'utf8'));

    schema = new Schema(validSchema);
    await schema.save();
    validDocument.schema_id = schema._id;

    vrrpKeys = ['lvs_external_CM_vrrp_id', 'lvs_external_PM_vrrp_id', 'lvs_external_FM_vrrp_id'];

    validDocumentUpdate = { name: '_updatedDocument' };

    userObject = new User(validUser);
    await userObject.save();
    userObject2 = new User(validUser2);
    await userObject2.save();
    userObject3 = new User(validUser3);
    await userObject3.save();

    validGroup = {
      name: 'groupName',
      admin_IDs: [userObject._id],
      users: [],
      associatedDocuments: []
    };

    groupObject = new Group(validGroup);
    groupReturned = await groupObject.save();

    // Authorise User
    agent.auth(validUser.username, validUser.password);
  });

  describe('POST', function () {
    it('should set internal NFS keys to inactive default values when use external nfs is true', async function () {
      enmSedSchemaObject = new Schema(externalNFSSubEnmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validUseExternalNFSSubEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      validUseExternalNFSSubEnmSedDocument.useexternalnfs = true;
      response = await agent.post('/api/documents').send(validUseExternalNFSSubEnmSedDocument).expect(201);
      response.body.content.should.deepEqual(expectedWhenUseExternalNfsTrue);
      response.body.useexternalnfs.should.equal(true);
      documentReturned = await Document.findById(response.body._id).exec();
      response.body.useexternalnfs.should.equal(documentReturned.useexternalnfs);
    });

    it('should set external NFS key inactive default values when use external nfs is false', async function () {
      enmSedSchemaObject = new Schema(externalNFSSubEnmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validInternalNFSEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      validInternalNFSEnmSedDocument.useexternalnfs = false;
      response = await agent.post('/api/documents').send(validInternalNFSEnmSedDocument).expect(201);
      response.body.content.should.deepEqual(expectedWhenUseExternalNfsFalse);
      response.body.useexternalnfs.should.equal(false);
      documentReturned = await Document.findById(response.body._id).exec();
      response.body.useexternalnfs.should.equal(documentReturned.useexternalnfs);
    });

    it('should set backward compatible internal NFS keys to inactive default values when use external nfs is true', async function () {
      enmSedSchemaObject = new Schema(backwardCompatibleExternalNFSSubEnmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      backwardCompatibleValidUseExternalNfsTrueEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      backwardCompatibleValidUseExternalNfsTrueEnmSedDocument.useexternalnfs = true;
      response = await agent.post('/api/documents').send(backwardCompatibleValidUseExternalNfsTrueEnmSedDocument).expect(201);
      response.body.content.should.deepEqual(expectedBackwardUseExternalNfsTrue);
      response.body.useexternalnfs.should.equal(true);
      documentReturned = await Document.findById(response.body._id).exec();
      response.body.useexternalnfs.should.equal(documentReturned.useexternalnfs);
    });

    it('should set backward compatible external NFS keys to inactive default values when use external nfs is false', async function () {
      enmSedSchemaObject = new Schema(backwardCompatibleExternalNFSSubEnmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validInternalNFSEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      validInternalNFSEnmSedDocument.useexternalnfs = false;
      response = await agent.post('/api/documents').send(validInternalNFSEnmSedDocument).expect(201);
      response.body.content.should.deepEqual(expectedWhenUseExternalNfsFalse);
      response.body.useexternalnfs.should.equal(false);
      documentReturned = await Document.findById(response.body._id).exec();
      response.body.useexternalnfs.should.equal(documentReturned.useexternalnfs);
    });

    it('should not introduce external nfs keys into managed configs on save', async function () {
      enmSedSchemaObject = new Schema(externalNFSSubEnmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validEnmSedManagedConfig.schema_id = enmSedSchemaObjectReturned._id;
      delete validEnmSedManagedConfig.content.parameters.enm_external_network_name;
      response = await agent.post('/api/documents').send(validEnmSedManagedConfig).expect(201);
      should.not.exist(response.body.content.parameters.nfspmlinks_external_server);
      should.not.exist(response.body.content.parameters.nfspm2_external_server);
      should.not.exist(response.body.content.parameters.nfspm1_external_server);
      should.not.exist(response.body.content.parameters.nfssmrs_external_server);
      should.not.exist(response.body.content.parameters.nfsamos_external_server);
    });
  });

  describe('GET', function () {
    it('should update internal NFS keys to inactive default values when use external nfs is true', async function () {
      enmSedSchemaObject = new Schema(externalNFSSubEnmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validInternalNFSSubEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      documentResponse = await agent.post('/api/documents').send(validInternalNFSSubEnmSedDocument).expect(201);
      validDeployment.enm.sed_id = documentResponse.body._id;
      validInternalNFSSubEnmSedDocument.useexternalnfs = true;
      response = await agent.put(`/api/documents/${documentResponse.body._id}`).send(validInternalNFSSubEnmSedDocument).expect(200);
      response.body.useexternalnfs.should.equal(true);
      response.body.content.parameters.nfsamos_volume_size.should.equal('1');
      response.body.content.parameters.nfspm_instances.should.equal('0');
      response.body.content.parameters.nfspmlinks_instances.should.equal('0');
      response.body.content.parameters.nfssmrs_instances.should.equal('0');
      response.body.content.parameters.nfspm_volume_size.should.equal('0');
      documentReturned = await Document.findById(response.body._id).exec();
      response.body.useexternalnfs.should.equal(documentReturned.useexternalnfs);
    });

    it('should update external NFS keys to inactive default values when use external nfs is false', async function () {
      enmSedSchemaObject = new Schema(externalNFSSubEnmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validInternalNFSSubEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      documentResponse = await agent.post('/api/documents').send(validInternalNFSSubEnmSedDocument).expect(201);
      validDeployment.enm.sed_id = documentResponse.body._id;
      validInternalNFSSubEnmSedDocument.useexternalnfs = false;
      response = await agent.put(`/api/documents/${documentResponse.body._id}`).send(validInternalNFSSubEnmSedDocument).expect(200);
      response.body.useexternalnfs.should.equal(false);
      should.not.exist(response.body.content.parameters.nfsamos_external_server);
      should.not.exist(response.body.content.parameters.nfsamos_external_exported_fs);
      should.not.exist(response.body.content.parameters.nfspm1_external_server);
      should.not.exist(response.body.content.parameters.nfspm1_external_exported_fs);
      should.not.exist(response.body.content.parameters.nfspm2_external_server);
      should.not.exist(response.body.content.parameters.nfspm2_external_exported_fs);
      should.not.exist(response.body.content.parameters.nfspmlinks_external_exported_fs);
      should.not.exist(response.body.content.parameters.nfssmrs_external_server);
      should.not.exist(response.body.content.parameters.nfssmrs_external_exported_fs);
      documentReturned = await Document.findById(response.body._id).exec();
      response.body.useexternalnfs.should.equal(documentReturned.useexternalnfs);
    });

    it('should update backward internal NFS keys to inactive default values when use external nfs is true', async function () {
      enmSedSchemaObject = new Schema(backwardCompatibleExternalNFSSubEnmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validInternalNFSSubEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      documentResponse = await agent.post('/api/documents').send(validInternalNFSSubEnmSedDocument).expect(201);
      validDeployment.enm.sed_id = documentResponse.body._id;
      validInternalNFSSubEnmSedDocument.useexternalnfs = true;
      response = await agent.put(`/api/documents/${documentResponse.body._id}`).send(validInternalNFSSubEnmSedDocument).expect(200);
      response.body.useexternalnfs.should.equal(true);
      response.body.content.parameters.nfsamos_volume_size.should.equal('1');
      response.body.content.parameters.nfspm_instances.should.equal('0');
      response.body.content.parameters.nfspmlinks_instances.should.equal('0');
      response.body.content.parameters.nfssmrs_instances.should.equal('0');
      response.body.content.parameters.nfspm_volume_size.should.equal('1');
      response.body.content.parameters.nfssmrs_volume_size.should.equal('1');
      documentReturned = await Document.findById(response.body._id).exec();
      response.body.useexternalnfs.should.equal(documentReturned.useexternalnfs);
    });

    it('should update backward external NFS keys to inactive default values when use external nfs is false', async function () {
      enmSedSchemaObject = new Schema(backwardCompatibleExternalNFSSubEnmSedSchema);
      enmSedSchemaObjectReturned = await enmSedSchemaObject.save();
      validInternalNFSSubEnmSedDocument.schema_id = enmSedSchemaObjectReturned._id;
      documentResponse = await agent.post('/api/documents').send(validInternalNFSSubEnmSedDocument).expect(201);
      validDeployment.enm.sed_id = documentResponse.body._id;
      validInternalNFSSubEnmSedDocument.useexternalnfs = false;
      response = await agent.put(`/api/documents/${documentResponse.body._id}`).send(validInternalNFSSubEnmSedDocument).expect(200);
      response.body.useexternalnfs.should.equal(false);
      should.not.exist(response.body.content.parameters.nfsamos_external_server);
      should.not.exist(response.body.content.parameters.nfsamos_external_exported_fs);
      should.not.exist(response.body.content.parameters.nfspm1_external_server);
      should.not.exist(response.body.content.parameters.nfspm1_external_exported_fs);
      should.not.exist(response.body.content.parameters.nfspm2_external_server);
      should.not.exist(response.body.content.parameters.nfspm2_external_exported_fs);
      should.not.exist(response.body.content.parameters.nfspmlinks_external_exported_fs);
      should.not.exist(response.body.content.parameters.nfssmrs_external_server);
      should.not.exist(response.body.content.parameters.nfssmrs_external_exported_fs);
      documentReturned = await Document.findById(response.body._id).exec();
      response.body.useexternalnfs.should.equal(documentReturned.useexternalnfs);
    });
  });

  afterEach(async function () {
    await User.remove().exec();
    await Group.remove().exec();
    await Pod.remove().exec();
    await Schema.remove().exec();
    await Project.remove().exec();
    await Document.remove().exec();
    await History.remove().exec();
    await Deployment.remove().exec();
    await Label.remove().exec();
  });
});
