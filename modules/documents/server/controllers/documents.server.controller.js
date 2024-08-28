'use strict';

var Ajv = require('ajv');
var _ = require('lodash');
var semver = require('semver');
var mongoose = require('mongoose');
var Address6 = require('ip-address').Address6;
var draft06Schema = require('ajv/lib/refs/json-schema-draft-06.json');
var enmAutopopulate = require('../../../documents/server/controllers/documents.autopopulate.server.controller');
var errorHandler = require('../../../core/server/controllers/errors.server.controller');
var Schema = require('../../../schemas/server/models/schemas.server.model').Schema;
var commonController = require('../../../core/server/controllers/common.server.controller');
var autoPopulateController = require('../../../documents/server/controllers/documents.autopopulate.server.controller');
var vnflcmAutoPopulateController = require('../../../documents/server/controllers/documents.vnfautopopulate.server.controller');
var externalNfsController = require('../../../documents/server/controllers/documents.externalnfs.server.controller');
var vioController = require('../../../documents/server/controllers/documents.vio.server.controller');
var ipv6Controller = require('../../../documents/server/controllers/documents.ipv6.server.controller');
var Document = require('../models/documents.server.model').Schema;
var Deployment = require('../../../deployments/server/models/deployments.server.model').Schema;
var dependentModelsDetails = [{ modelObject: Deployment, modelKey: 'enm.sed_id' },
{ modelObject: Deployment, modelKey: 'documents.document_id' },
{ modelObject: Document, modelKey: 'managedconfigs' }];
var sortOrder = 'name';
commonController = commonController(Document, dependentModelsDetails, sortOrder);

var ajv = new Ajv({
  allErrors: true,
  removeAdditional: true,
  useDefaults: true
});

var enmOnlyFields = [
  'dns', 'managedconfigs', 'ipv6', 'overcommit', 'vio', 'vioMultiTech',
  'vioTransportOnly', 'vioOptimizedTransportOnly', 'useexternalnfs'
];

var mcOnlyFields = [
  'labels'
];

var requiredFields = [...enmOnlyFields, ...mcOnlyFields];

var overcommitPostfix = '_1';

ajv.addMetaSchema(draft06Schema);

exports.list = commonController.list;
exports.delete = commonController.delete;
exports.findById = commonController.findById;
exports.findByName = commonController.findByName;

exports.validateJSONtoSchema = async function (req, res) {
  var received = req.body;
  var ajv = new Ajv({ useDefaults: true, removeAdditional: true });
  ajv.addMetaSchema(draft06Schema);
  var populatedJSON = {};
  var validate = ajv.compile(received);
  validate(populatedJSON);
  res.json(populatedJSON);
};

exports.read = async function (req, res) {
  var modelInstance = req.document ? req.document.toJSON() : {};
  if (!req.headers.referer && modelInstance.content && process.env.PARAMETER_DEFAULTS_APPLICATION) {
    modelInstance = await setParameterDefaults(modelInstance, req);
  }
  if (!(req.query && req.query.fields)) {
    if (!modelInstance.managedconfig) mcOnlyFields.forEach(mcField => delete modelInstance[mcField]);
    var docSchema = await Schema.findOne({ _id: modelInstance.schema_id });
    var nonEnmDocument = (modelInstance.managedconfig || !modelInstance.schema_id || (!docSchema.category.includes('enm')));
    if (nonEnmDocument) enmOnlyFields.forEach(enmField => delete modelInstance[enmField]);
  }
  res.json(modelInstance);
};

async function setParameterDefaults(modelInstance, req) {
  if (req.user && Object.prototype.hasOwnProperty.call(modelInstance.content, 'parameters')) {
    var applictions = String(process.env.PARAMETER_DEFAULTS_APPLICATION).split(',');
    if (applictions.indexOf(req.user.username) !== -1) {
      modelInstance.content.parameter_defaults = modelInstance.content.parameters;
      delete modelInstance.content.parameters;
    }
  }
  return modelInstance;
}

exports.create = async function (req, res) {
  try {
    commonController.setLoggedInUser(req.user);
    delete req.body.created_at;
    var userGroups = req.body.usergroups;
    delete req.body.usergroups;
    await commonController.userGroupsValidation(userGroups);
    var schema = await readSchema(req.body.schema_id);
    var document = new Document(req.body);
    await mergeManagedConfigs(document);
    await externalNfsController.populateNfsKeyValues(document, schema);
    await vioController.populateVioKeyValues(document, schema);
    await ipv6Controller.populateIpv6KeyValues(document, schema);
    await autoPopulateController.autoPopulate(document, schema);
    await vnflcmAutoPopulateController.vnfAutoPopulate(document);
    await autopopulateOvercommitValues(document);
    await setDocumentOptionsBasedOnEnmDeploymentType(document);
    await labelValidityCheck(document);
    await addRequiredFields(document);
    await document.save();
    if (!req.body.managedconfig) {
      await commonController.addModelInstanceToGroup(req.user, document._id, userGroups);
    }
    res.location(`/api/documents/${document._id}`).status(201).json(document);
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

exports.update = async function (req, res) {
  try {
    commonController.setLoggedInUser(req.user);
    var userGroups = req.body.usergroups;
    delete req.body.usergroups;
    await commonController.userGroupsValidation(userGroups);
    delete req.body.created_at;
    commonController.findAdditionalKeys(Document, req.document._doc, req.body, res);
    var schemaIdChanged = (req.body.schema_id && !req.document.schema_id.equals(req.body.schema_id));
    if (isSchemaVersionUpdate(req) && !schemaIdChanged) {
      return res.status(200).send(req.document);
    }
    var previousSchema = await readSchema(req.document.schema_id);
    var targetSchema = previousSchema;
    if (schemaIdChanged) {
      targetSchema = await readSchema(req.body.schema_id);
      compareSchemaCategories(targetSchema, previousSchema);
    }
    if (req.body.ha === false && targetSchema.toJSON().category === 'vnflcm') {
      delete req.body.content.parameters.svc_external_vrrp_id;
      delete req.body.content.parameters.svc_internal_vrrp_id;
      delete req.body.content.parameters.db_internal_vrrp_id;
    }
    if (req.body.managedconfig && req.body.managedconfig !== req.document.managedconfig) {
      throw new Error('You cannot change a documents managed config mode');
    }
    var mergedDocument = mergeWithPreviousDocument(req.document, req.body);
    if (isSchemaVersionUpdate(req)) {
      updateDocumentWithSchemaDefaults(targetSchema, mergedDocument);
      await switchManagedConfigsSchemas(mergedDocument);
      mergedDocument.markModified('managedconfigs');
    }

    await mergeManagedConfigs(mergedDocument);
    await externalNfsController.populateNfsKeyValues(mergedDocument, targetSchema);

    // handle new fields only for cenm
    if (targetSchema.category === 'cenm') addNewFieldsAndAddDefaults(mergedDocument.content, targetSchema.content);
    await autoPopulateController.autoPopulate(mergedDocument, targetSchema.toJSON());
    await vnflcmAutoPopulateController.vnfAutoPopulate(mergedDocument, targetSchema.toJSON());
    await vioController.populateVioKeyValues(mergedDocument, targetSchema.toJSON());
    await ipv6Controller.populateIpv6KeyValues(mergedDocument, targetSchema.toJSON());
    await autopopulateOvercommitValues(mergedDocument);
    mergedDocument.markModified('content');
    await removeBlankValuesFromManagedConfigs(mergedDocument);
    await setDocumentOptionsBasedOnEnmDeploymentType(mergedDocument);
    await isVNFLCMDocumentRequired(mergedDocument, targetSchema.toJSON());
    await labelValidityCheck(mergedDocument);
    await addRequiredFields(mergedDocument);
    var savedDocument = await saveDocument(mergedDocument);
    if (!req.body.managedconfig) {
      await commonController.updateModelInstanceInGroup(req.user, mergedDocument._id, userGroups);
    }
    await updateVNFLCMDocument(savedDocument, targetSchema.toJSON());

    // if updating vnflcm sed and its part of deployment whos enm sed is ffe,
    // need to resave enmsed document using updateENMSedDocument()
    var updatingVnfLcm = targetSchema.category === 'vnflcm';
    var updateSedAgainForFFE = false;
    var deployment;
    var deploymentSed;
    var enmSedSchema;
    if (updatingVnfLcm) {
      deployment = await Deployment.find({ documents: { $elemMatch: { document_id: req.document._id } } }).exec();
      if (deployment[0]) {
        deploymentSed = await Document.findOne({ _id: deployment[0].enm.sed_id });
        if (deploymentSed.isFFE) {
          enmSedSchema = await Schema.findOne({ _id: deploymentSed.schema_id });
          updateSedAgainForFFE = true;
        }
      }
    }
    if (updateSedAgainForFFE) await updateENMSedDocument(deploymentSed, enmSedSchema);
    res.json(savedDocument);
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

async function addRequiredFields(document) {
  requiredFields.forEach(function (enmField) {
    var defaultValue = (['labels', 'managedconfigs'].includes(enmField)) ? [] : false;
    document[enmField] = document[enmField] || defaultValue;
  });
}

async function removeBlankValuesFromManagedConfigs(document) {
  if (!document.managedconfig) {
    return;
  }
  for (var docKey in document.content.parameters) {
    if (!document.content.parameters[docKey]) {
      delete document.content.parameters[docKey];
    }
  }
}

function addNewFieldsAndAddDefaults(documentContent, schemaContent) {
  // add missing fields from new schema
  var newSchemaFields = schemaContent.properties.parameters.properties;
  for (const key in newSchemaFields) {
    if (!Object.prototype.hasOwnProperty.call(documentContent.parameters, key) && newSchemaFields[key].$ref) {
      // Get definition default
      var definitionRef = newSchemaFields[key].$ref;
      var definitionKey = definitionRef.substring(definitionRef.lastIndexOf('/') + 1);
      var definitionDefault = schemaContent.definitions[definitionKey].default;

      // Set value only if there is a default
      if (definitionDefault) documentContent.parameters[key] = definitionDefault;
    }
  }

  // Remove fields that are not in the new schema anymore
  for (const key in documentContent.parameters) {
    if (!Object.prototype.hasOwnProperty.call(newSchemaFields, key)) {
      delete documentContent.parameters[key];
    }
  }
  return documentContent;
}

function isSchemaVersionUpdate(req) {
  return Object.keys(req.body).length === 1 && Object.keys(req.body)[0] === 'schema_id';
}

function saveDocument(document) {
  return document.save();
}

async function readSchema(schemaId) {
  var schema;
  try {
    schema = await Schema.findById(schemaId).exec();
  } catch (err) {
    // continue regardless of error
  }
  if (!schema) {
    throw new Error('The given schema id could not be found');
  }
  return schema;
}

function compareSchemaCategories(schema, previousSchema) {
  if (schema.category !== previousSchema.category) {
    throw new Error(`You cannot change a documents schema's category from '${previousSchema.category}' to '${schema.category}'`);
  }
}

function updateDocumentWithSchemaDefaults(schema, document) {
  if (document.managedconfig) {
    return;
  }
  var validate = ajv.compile(schema.content);
  validate(document.content);
}

async function switchManagedConfigsSchemas(document) {
  if (document.managedconfig) {
    return;
  }
  document.managedconfigs.map(documentMC => new mongoose.Types.ObjectId(documentMC));
  var populatedManagedConfigPromises = [];
  document.managedconfigs.forEach(function (docMC) {
    populatedManagedConfigPromises.push(Document.findById(docMC).select('_id name labels'));
  });
  var populatedManagedConfigs = await Promise.all(populatedManagedConfigPromises);
  var supportedManagedConfigs = await Document.find({ schema_id: document.schema_id, managedconfig: true }, '_id labels');

  populatedManagedConfigs.forEach(function (populatedMC, pIndex) {
    var matchingManagedConfig;
    supportedManagedConfigs.forEach(function (supportedMC) {
      if (populatedMC.labels.every(label => supportedMC.labels.indexOf(label) > -1)) {
        matchingManagedConfig = supportedMC._id;
      }
    });
    if (matchingManagedConfig) {
      document.managedconfigs[pIndex] = matchingManagedConfig;
    } else {
      throw new Error(`Could not find a managed config matching the requested schema \
and the labels from managed config '${populatedMC.name}' (${populatedMC.labels.join(',')})`);
    }
  });
}

function mergeWithPreviousDocument(previousDocument, newDocument) {
  return _.extend(previousDocument, newDocument);
}

async function autopopulateOvercommitValues(document) {
  var schema = await readSchema(document.schema_id);
  if (schema.name !== 'enm_sed' || document.managedconfig) {
    return;
  }

  // Substitute in custom flavor values
  for (var docKey in document.content.parameters) {
    if (!schema.content.properties.parameters.properties[docKey]) {
      delete document.content.parameters[docKey];
    } else if (schema.content.properties.parameters.properties[docKey].$ref === '#/definitions/openstack_flavor') {
      var value = document.content.parameters[docKey];
      if (document.content.parameters[value] && document.overcommit) {
        var overcommitValue1 = document.content.parameters[`${value}1_1`];
        var overcommitValue3 = document.content.parameters[`${value}3_1`];
        if (overcommitValue1 && overcommitValue1.includes(docKey)) {
          if (overcommitValue1.split(',')[0] !== 'not_set') {
            document.content.parameters[docKey] = overcommitValue1.split(',')[0];
          }
        } else if (overcommitValue3 && overcommitValue3.includes(docKey)) {
          if (overcommitValue3.split(',')[0] !== 'not_set') {
            document.content.parameters[docKey] = overcommitValue3.split(',')[0];
          }
        }
      } else if (document.content.parameters[value] && !document.overcommit) {
        if (document.content.parameters[value].split(',')[0] !== 'not_set') {
          document.content.parameters[docKey] = document.content.parameters[value].split(',')[0];
        }
      }
    }
  }

  // Give unused overcommit keys a value to allow SED to save
  if (schema.content.properties.parameters) {
    for (var key in schema.content.properties.parameters.properties) {
      if (key in schema.content.properties.parameters.properties) {
        var ref = schema.content.properties.parameters.properties[key].$ref;
        if (ref === '#/definitions/not_over_commit' || ref === '#/definitions/over_commit') {
          if (document.content.parameters[key] === undefined) {
            document.content.parameters[key] = 'not_set';
          }
        }
      }
    }
  }
  if (document.overcommit === null) {
    document.overcommit = false;
  }
}

async function parseManagedConfigForCustomFlavorName(document, managedConfig) {
  var schema = await readSchema(document.schema_id);
  if (schema.name !== 'enm_sed') {
    return;
  }
  var openstackFlavors = getOpenstackFlavors(schema);
  var newFlavorValue;
  for (var x = 0; x < openstackFlavors.length; x += 1) {
    var keyName = openstackFlavors[x][0];
    var originalValue = document.content.parameters[keyName];
    if (originalValue && managedConfig.content.parameters[originalValue]) {
      if (document.overcommit) {
        newFlavorValue = managedConfig.content.parameters[originalValue].split(',')[0];
        document.content.parameters[keyName] = newFlavorValue;
      } else {
        originalValue = originalValue.endsWith(overcommitPostfix) ? originalValue.slice(0, -3) : originalValue;
        newFlavorValue = managedConfig.content.parameters[originalValue].split(',')[0];
        document.content.parameters[keyName] = newFlavorValue;
      }
    }
  }
  _.merge(document.content, managedConfig.content);
}

function getOpenstackFlavors(schema) {
  if (_.has(schema.content, 'properties.parameters.properties')) {
    return Object.entries(schema.content.properties.parameters.properties).filter(isOpenstackFlavorKey);
  }
  return [];
}

function isOpenstackFlavorKey([key, keyDefinition]) {
  if (keyDefinition.$ref === '#/definitions/openstack_flavor') {
    return true;
  }
  return false;
}

function getIndexOfManagedConfigWithFlavours(managedConfigs) {
  for (var x = 0; x < managedConfigs.length; x += 1) {
    if (containsVmFlavorOvercommitValues(managedConfigs[x])) {
      return x;
    }
  }
  return -1;
}

function containsVmFlavorOvercommitValues(managedConfig) {
  if (!managedConfig.content.parameters) {
    return;
  }
  var result = false;
  Object.entries(managedConfig.content.parameters).forEach(function ([key, value]) {
    if (value) {
      if (isValidFlavor(key) && isValidFlavor(value)) {
        result = true;
      }
    }
  });
  return result;
}

function isValidFlavor(key) {
  var flavorRegex = /flavor_\d+vC\d+M/;
  return flavorRegex.test(key);
}

async function mergeManagedConfigs(document) {
  if (document.managedconfig && document.autopopulate) {
    throw new Error('You cannot have both managed config and autopopulate enabled together');
  }
  if (document.managedconfig && document.managedconfigs.length !== 0) {
    throw new Error('A managed config cannot have managed configs attached to it');
  }

  if (document.managedconfig) {
    return;
  }
  var managedConfigsAsStrings = document.managedconfigs.map(managedconfig => JSON.stringify(managedconfig));
  if (_.uniq(managedConfigsAsStrings).length !== document.managedconfigs.length) {
    throw new Error('You cannot attach the same managed config twice');
  }

  var managedConfigPromises = [];
  for (var s = 0; s < document.managedconfigs.length; s += 1) {
    managedConfigPromises.push(Document.findById(document.managedconfigs[s]));
  }
  var managedConfigs = await Promise.all(managedConfigPromises);
  var managedConfigWithFlavorsIndex = getIndexOfManagedConfigWithFlavours(managedConfigs);
  if (managedConfigWithFlavorsIndex !== -1) {
    await parseManagedConfigForCustomFlavorName(document, managedConfigs[managedConfigWithFlavorsIndex]);
  }

  if (document.autopopulate) {
    var exclusionIPsValues = [];
    var deployment = await Deployment.findOne({ 'enm.sed_id': document._id }).populate({ path: 'project_id', populate: { path: 'pod_id' } }).exec();
    if (deployment) {
      exclusionIPsValues = returnExclusionAddressesArray(deployment);
      // check every MC for IP
      for (var i = 0; i < managedConfigs.length; i += 1) {
        var allMCIPs = enmAutopopulate.getDocumentAddresses(managedConfigs[i]);
        var commonIPs = _.intersection(exclusionIPsValues, allMCIPs);
        if (commonIPs.length) {
          throw new Error(`${commonIPs} cannot be part of ${managedConfigs[i].name} while autopopulation is on, as its in the exclusion IP list of ${deployment.project_id.name} Project.`); // eslint-disable-line max-len
        }
      }
    }
  }

  for (var x = 0; x < managedConfigs.length; x += 1) {
    if (!managedConfigs[x].schema_id.equals(document.schema_id)) {
      throw new Error(`The attached managed config '${managedConfigs[x].name}' is not using the same schema id as the document itself`);
    }
    if (!managedConfigs[x].managedconfig) {
      throw new Error(`You cannot attach the document '${managedConfigs[x].name}' as a managed config as it is not a managed config`);
    }

    if (x !== managedConfigWithFlavorsIndex) {
      _.merge(document.content, managedConfigs[x].content);
    }
  }
}

function returnExclusionAddressesArray(deployment) {
  var exclusionIPv4Values = [];
  var exclusionIPv6Values = [];
  if (deployment.project_id.exclusion_ipv6_addresses.length) exclusionIPv6Values = _.map(deployment.project_id.exclusion_ipv6_addresses, 'ipv6');
  if (deployment.project_id.exclusion_ipv4_addresses.length) exclusionIPv4Values = _.map(deployment.project_id.exclusion_ipv4_addresses, 'ipv4');
  exclusionIPv6Values = exclusionIPv6Values.map(ip => new Address6(ip).canonicalForm());
  return _.union(exclusionIPv6Values, exclusionIPv4Values);
}

async function updateVNFLCMDocument(document, schema) {
  if (schema.category === 'enm') {
    var deployment = await Deployment.findOne({ 'enm.sed_id': document._id }).populate({ path: 'project_id', populate: { path: 'pod_id' } }).exec();
    if (deployment) {
      var vnfLcmDocumentId = '';
      for (var i = 0; i < deployment.documents.length; i += 1) {
        if (deployment.documents[i].schema_name === 'vnflcm_sed_schema' || deployment.documents[i].schema_category === 'vnflcm') {
          vnfLcmDocumentId = deployment.documents[i].document_id;
          break;
        }
      }
      if (vnfLcmDocumentId) {
        var vnfLcmDocument = await Document.findOne({ _id: vnfLcmDocumentId });
        await vnflcmAutoPopulateController.vnfAutoPopulate(vnfLcmDocument);
        vnfLcmDocument.markModified('content');
        await saveDocument(vnfLcmDocument);
      }
    }
  }
}

async function updateENMSedDocument(enmSedDocument, enmSedDocSchema) {
  await autoPopulateController.autoPopulate(enmSedDocument, enmSedDocSchema.toJSON());
  enmSedDocument.markModified('content');
  await saveDocument(enmSedDocument);
}

async function isVNFLCMDocumentRequired(document, schema) {
  if (schema.category === 'enm') {
    var deployment = await Deployment.findOne({ 'enm.sed_id': document._id }).populate({ path: 'project_id', populate: { path: 'pod_id' } }).exec();
    if (deployment && semver.gt(schema.version, '1.39.14')) {
      var hasVnfLcmDocument = false;
      for (var i = 0; i < deployment.documents.length; i += 1) {
        if (deployment.documents[i].schema_name === 'vnflcm_sed_schema' || deployment.documents[i].schema_category === 'vnflcm') {
          hasVnfLcmDocument = true;
          break;
        }
      }
      if (!hasVnfLcmDocument) {
        throw new Error('For this ENM Schema version, a VNF-LCM SED is required. Do the following steps to resolve:\n 1. Delete the Deployment that this ENM SED is attached to. \n 2. Update schema version of this ENM SED. \n 3. Create a VNF-LCM SED. \n 4. Recreate the Deployment.');
      }
    }
  }
}

async function setDocumentOptionsBasedOnEnmDeploymentType(document) {
  var schema = await readSchema(document.schema_id);
  if (schema.name !== 'enm_sed' || !document.content.parameters || !document.content.parameters.enm_deployment_type || document.managedconfig) {
    return;
  }
  if (document.vioTransportOnly || document.content.parameters.enm_deployment_type === 'SIENM_transport_only') {
    document.content.parameters.enm_deployment_type = 'SIENM_transport_only';
    document.vioTransportOnly = true;
    document.vioMultiTech = false;
    document.vioOptimizedTransportOnly = false;
  } else if (document.vioOptimizedTransportOnly || document.content.parameters.enm_deployment_type === 'OSIENM_transport_only') {
    document.content.parameters.enm_deployment_type = 'OSIENM_transport_only';
    document.vioOptimizedTransportOnly = true;
    document.vioMultiTech = false;
    document.vioTransportOnly = false;
  } else if (document.vioMultiTech || document.content.parameters.enm_deployment_type === 'SIENM_multi_technology') {
    document.content.parameters.enm_deployment_type = 'SIENM_multi_technology';
    document.vioMultiTech = true;
    document.vioTransportOnly = false;
    document.vioOptimizedTransportOnly = false;
  }
}

async function labelValidityCheck(document) {
  if (!document.managedconfig) {
    return;
  }

  var duplicateManagedConfigs = await Document.find({
    _id: { $ne: document._id },
    labels: document.labels,
    schema_id: document.schema_id,
    managedconfig: true
  });

  var duplicateMC = duplicateManagedConfigs[0];
  if (duplicateMC && duplicateMC.labels.length) {
    throw new Error(`No duplicate managed configs allowed. '${duplicateMC.name}' already exists with schema_id: \
'${duplicateMC.schema_id}' and label(s): '${duplicateMC.labels.join('\', \'')}'.`);
  }
}

exports.resaveAutopopulatedDocuments = async function (project, ipv6) {
  var deployment = await Deployment.findOne({ project_id: project._id }).exec();
  var enmDocument;
  var enmSedSchema;
  if (deployment) {
    enmDocument = await Document.findById(deployment.enm.sed_id).exec();
    if (enmDocument) {
      enmSedSchema = (await readSchema(enmDocument.schema_id)).toJSON();
      if (ipv6) enmDocument.ipv6 = ipv6;
      await autoPopulateController.autoPopulate(enmDocument, enmSedSchema);
      await ipv6Controller.populateIpv6KeyValues(enmDocument, enmSedSchema);
      enmDocument.markModified('content');
      await saveDocument(enmDocument);
    }
    var vnfLcmDocumentId = '';
    for (var docIndex = 0; docIndex < deployment.documents.length; docIndex += 1) {
      if (deployment.documents[docIndex].schema_name === 'vnflcm_sed_schema' || deployment.documents[docIndex].schema_category === 'vnflcm') {
        vnfLcmDocumentId = deployment.documents[docIndex].document_id;
        break;
      }
    }
    if (vnfLcmDocumentId) {
      var vnfLcmDocument = await Document.findById(vnfLcmDocumentId).exec();
      await vnflcmAutoPopulateController.vnfAutoPopulate(vnfLcmDocument);
      vnfLcmDocument.markModified('content');
      await saveDocument(vnfLcmDocument);
      // resave enm sed if its ffe
      if (enmDocument && enmDocument.isFFE) {
        enmSedSchema = (await readSchema(enmDocument.schema_id)).toJSON();
        if (ipv6) enmDocument.ipv6 = ipv6;
        await autoPopulateController.autoPopulate(enmDocument, enmSedSchema);
        await ipv6Controller.populateIpv6KeyValues(enmDocument, enmSedSchema);
        enmDocument.markModified('content');
        await saveDocument(enmDocument);
      }
    }
  }
};

exports.resaveDocumentRemovedFromDeployment = async function (sedDocument) {
  var schema = await readSchema(sedDocument.schema_id);
  if (schema.category === 'enm') {
    await ipv6Controller.populateIpv6KeyValues(sedDocument, schema);
    await autoPopulateController.autoPopulate(sedDocument, schema);
  } else {
    await vnflcmAutoPopulateController.vnfAutoPopulate(sedDocument, schema);
  }
  sedDocument.markModified('content');
  await saveDocument(sedDocument);
};
