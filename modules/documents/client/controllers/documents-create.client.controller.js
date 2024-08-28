import Ajv from 'ajv';
import _ from 'lodash';
import semver from 'semver';
import 'angular-bootstrap-multiselect';
import { sleep, floatingSaveButton } from '../../../core/client/controllers/helpers.client.controller';
var http = require('http');
var $ = require('jquery');
require('select2')();
var draft06Schema = require('ajv/lib/refs/json-schema-draft-06.json');
function isFullVersion(version) {
  if (`${semver.major(version)}.${semver.minor(version)}.${semver.patch(version)}` === version) {
    return true;
  }
}
DocumentsCreateController.$inject = ['$scope', '$state', '$http', 'document', 'schemas',
  'schema', 'creatingFromScratch', 'Notification', 'SchemasService',
  'DocumentsService', 'allLabels', 'supportedManagedConfigs',
  '$window', 'managedConfigMode', 'project', 'pod', 'allGroups',
  'Authentication', 'allUsers', 'schemaCategory', 'restoredata'
];
export default function DocumentsCreateController(
  $scope, $state, $http, document, schemas, schema, creatingFromScratch, Notification,
  SchemasService, DocumentsService, allLabels, supportedManagedConfigs,
  $window, managedConfigMode, project, pod, allGroups,
  Authentication, allUsers, schemaCategory, restoredata

) {
  var vm = this;
  var ajv = new Ajv({ useDefaults: true, removeAdditional: true });
  ajv.addMetaSchema(draft06Schema);
  var ajvAddDefaultsAndRemoveAdditionalKeys;
  var unmodifiedSchema;
  var documentSchemaVersionChange = false;
  var ipv6OptionClicked = false;
  var ipv6Ranges;
  var hiddenIpv6Keys;
  var hiddenFields;
  var filteredIPv6Keys;
  var skipHideIPv6Keys = [
    'dynamic_ipv6_range_start',
    'dynamic_ipv6_range_end',
    'internal_subnet_ipv6'
  ];
  var filteredManagedConfigs = { size: [], site: [], other: [] };
  vm.categories = ['size', 'site', 'other'];
  vm.document = document;
  if (restoredata) {
    $(async function () {
      if (!restoredata.content) restoredata.content = {};
      Object.assign(vm.document, restoredata);
      $('#schema').val(`string:${vm.document.schema_id}`).trigger('change');
      await vm.changedDocumentSchemaID(vm.document.schema_id);
      if (vm.document.managedconfigs || restoredata.managedconfigs) {
        sleep(2000).then(() => {
          vm.document.managedconfigs = restoredata.managedconfigs;
          vm.changedDocumentManagedConfigs();
          _.defer(() => $scope.$apply());
        });
      }
      sleep(2000).then(() => { vm.submitForm(); });
    });
  } else {
    processURLParameters();
  }

  function setSelect2(selectId, placeholderName) {
    $(selectId).select2({
      placeholder: `--Select ${placeholderName}--`,
      allowClear: true
    });
  }

  $(document).ready(function () {
    setSelect2('#schema', 'Schema');
    $('#schema').on('select2:select select2:unselecting', async function () {
      if ($(this).val() === null || $(this).val() === '') {
        $(this).data('unselecting', true);
        vm.document.schema_id = undefined;
      } else {
        vm.document.schema_id = $(this).val().replace('string:', '');
        vm.changedDocumentSchemaID(vm.document.schema_id);
        if (isCategoryEnmAndNotMC()) waitToSetAddMcOnClick();
      }
      _.defer(() => $scope.$apply());
    });
    if (vm.document.managedconfigs) {
      vm.document.managedconfigs.forEach(function (mangedItem, index) {
        setMangedConfigSelect(index);
      });
    }
    if (vm.isSedDocument() || vm.iscEnmSedDocument()) setAddMcOnClick();
    floatingSaveButton();
  });

  function isCategoryEnmAndNotMC(schemaId) {
    var checkingSchemas = _.cloneDeep(vm.schemas);
    checkingSchemas.filter(schema => schema._id === schemaId);
    return (checkingSchemas[0].category.includes('enm') && !vm.document.managedConfig);
  }

  function waitToSetAddMcOnClick() {
    var existCondition = setInterval(function () {
      if ($('#add-managedconfig').length) {
        clearInterval(existCondition);
        setAddMcOnClick();
      }
    }, 100); // check every 100ms
  }

  function setAddMcOnClick() {
    $('#add-managedconfig').on('click', function () {
      vm.document.managedconfigs.forEach(function (mangedItem, index) {
        setMangedConfigSelect(index);
      });
    });
  }

  function setMangedConfigSelect(managedConfigIndex) {
    var mcSelectId = `#managedconfigs${managedConfigIndex}-mc`;
    setSelect2(mcSelectId, 'Manged Config');
    $(mcSelectId).on('select2:select select2:unselecting', async function () {
      var valueIsEmpty = $(this).val() === null || $(this).val() === '';
      if (valueIsEmpty) $(this).data('unselecting', true);
      vm.document.managedconfigs[managedConfigIndex] = (valueIsEmpty) ? undefined : $(this).val().replace('string:', '');
      vm.changedDocumentManagedConfigs(managedConfigIndex);
      _.defer(() => $scope.$apply());
    });
    _.defer(() => $scope.$apply());
  }

  if (project) {
    vm.project = project;
    ipv6Ranges = _.filter(vm.project.network.ipv6_ranges, function (ranges) {
      return ranges.start && ranges.end;
    });
  }
  if (pod) {
    vm.pod = pod;
  }
  vm.document.overcommit = vm.document.overcommit || false;
  vm.showAllSchemaVersions = isDocumentUsingSnapshotSchema();
  vm.supportedManagedConfigs = supportedManagedConfigs;
  vm.creatingFromScratch = creatingFromScratch;
  vm.populatedManagedConfigs = [];
  vm.document.usergroups = [];
  vm.allUserGroups = [];
  vm.allLabels = allLabels.map(function (label) {
    return label.name;
  });
  var allGroupsOptions = [];
  var currentUser = allUsers.filter(user => user.username === Authentication.user.username)[0];
  var superAdmin = isSuperAdmin(currentUser);
  getAllGroups(allGroups, superAdmin);
  if (!superAdmin) {
    getAllUserGroups(allGroups, currentUser._id);
  }
  getDocumentGroups(allGroups, document._id);

  vm.pasteMode = false;
  vm.schemaFormOptions = {
    validateOnRender: true
  };
  vm.schemaForm = ['*'];
  vm.autoPopulateSupported = false;
  vm.editingLabelsVisible = false;
  vm.setVisibleSchemas = function () {
    var visibleSchemas = [];
    if (vm.showAllSchemaVersions) {
      visibleSchemas = schemas;
    } else {
      visibleSchemas = schemas.filter(function (schema) {
        return (isFullVersion(schema.version) || vm.document.schema_id === schema._id);
      });
    }
    if (!_.isEqual(vm.schemas, visibleSchemas)) {
      vm.schemas = visibleSchemas;
    }
    if (vm.document.schema_id && !creatingFromScratch) {
      loadSupportedManagedConfigs();
    }
    vm.schemas.sort((a, b) => semver.rcompare(a.version, b.version));
  };

  function getSchemaForm(schema) {
    var refValue;
    var defKeyName;
    var validationMsg;
    var formList = [];
    var propertiesParameters = schema.content.properties.parameters;
    for (var keyName in propertiesParameters.properties) {
      if (Object.prototype.hasOwnProperty.call(propertiesParameters.properties, keyName)) {
        validationMsg = '';
        if (propertiesParameters.required) {
          if (propertiesParameters.required.indexOf(keyName) !== -1) {
            validationMsg = 'Required: ';
          }
        }
        var formType = 'text';
        if (propertiesParameters.properties[keyName].description) {
          validationMsg += propertiesParameters.properties[keyName].description;
          if (propertiesParameters.properties[keyName].enum) {
            formType = 'select';
          }
        } else {
          refValue = propertiesParameters.properties[keyName].$ref;
          defKeyName = refValue.substring(refValue.lastIndexOf('/') + 1, refValue.length);
          validationMsg += schema.content.definitions[defKeyName].description;
          if (schema.content.definitions[defKeyName].enum) {
            formType = 'select';
          }
        }
        formList.push({
          key: `parameters.${keyName}`,
          title: keyName,
          type: formType,
          validationMessage: validationMsg
        });
      }
    }
    return formList;
  }

  function isSuperAdmin(currentUser) {
    return currentUser.roles.indexOf('superAdmin') !== -1;
  }

  async function getAllGroups(allGroups, superAdmin) {
    allGroupsOptions = await allGroups.map(group => { return { id: group._id, name: group.name }; });
    if (superAdmin) {
      vm.allUserGroups = allGroupsOptions;
    }
  }

  async function getAllUserGroups(allGroups, currentUserId) {
    var foundGroups = await allGroups.filter(group => isUserPresentInGroup(group, currentUserId));
    vm.allUserGroups = await foundGroups.map(group => { return { id: group._id, name: group.name }; });
  }

  function isUserPresentInGroup(group, currentUserId) {
    return (group.admin_IDs.indexOf(currentUserId) !== -1 || group.users.indexOf(currentUserId) !== -1);
  }

  async function getDocumentGroups(allGroups, documentId) {
    var documentGroups = await allGroups.filter(group => isDocumentPresentInGroup(group, documentId));
    vm.document.usergroups = await documentGroups.map(group => { return group._id; });
    if (vm.allUserGroups.length === 1 && vm.document.usergroups.length === 0) {
      vm.document.usergroups.push(vm.allUserGroups[0].id);
    }
  }

  function isDocumentPresentInGroup(group, documentId) {
    return group.associatedDocuments.indexOf(documentId) !== -1;
  }

  async function processURLParameters() {
    await window.location.search;
    var queryString = window.location.search.substring(1);
    var queries = queryString.split('&');
    var keyPair = {};
    var documentOptions = ['useexternalnfs', 'ipv6', 'dns', 'vio', 'vioTransportOnly',
      'vioMultiTech', 'overcommit', 'autopopulate'];
    var schemaRequiredOptions = documentOptions.concat(['managedConfigName']);
    var options = schemaRequiredOptions.concat(['documentName', 'schemaName']);
    for (var i = 0; i < queries.length; i += 1) {
      var optionKey = queries[i].split('=')[0];
      var optionValues = queries[i].split('=')[1];
      if (optionKey && !options.includes(optionKey)) {
        Notification.error({ message: `${optionKey} is not a valid key`, title: '<i class="glyphicon glyphicon-remove"></i> URL Parameters error!' });
      } else if (!queryString.includes('schemaName') && schemaRequiredOptions.includes(optionKey)) {
        Notification.error({ message: `Schema required to use ${optionKey} in URL Redirection`, title: '<i class="glyphicon glyphicon-remove"></i> URL Parameters error!' });
      } else if (optionKey in keyPair) {
        Notification.error({ message: `Duplicate key: ${optionKey}`, title: '<i class="glyphicon glyphicon-remove"></i> URL Parameters error!' });
      } else {
        keyPair[optionKey] = optionValues;
      }
    }
    if ('documentName' in keyPair) {
      vm.document.name = keyPair.documentName;
    }
    if ('schemaName' in keyPair) {
      var schemaName = keyPair.schemaName.split('-')[0];
      var schemaVersion = keyPair.schemaName.split('-')[1];
      var schema = await SchemasService.query({ q: `name=${schemaName}&version=${schemaVersion}`, fields: '_id,' }).$promise;
      if (!schema[0]) {
        Notification.error({ message: 'Schema not found.', title: '<i class="glyphicon glyphicon-remove"></i> Documents redirect error!' });
      }
      vm.document.schema_id = schema[0]._id;
      vm.changedDocumentSchemaID(vm.document.schema_id);
      if ('managedConfigName' in keyPair) {
        var managedConfigs = await DocumentsService.query({ q: `name=${keyPair.managedConfigName}&schema_id=${schema[0]._id}&managedconfig=true`, fields: '_id,' }).$promise;
        if (!managedConfigs[0]) {
          Notification.error({ message: 'Managed Config not found.', title: '<i class="glyphicon glyphicon-remove"></i> Documents redirect error!' });
        }
        vm.document.managedconfigs = [managedConfigs[0]._id];
      }
      if (keyPair.vioTransportOnly === 'true' && keyPair.vioMultiTech === 'true') {
        Notification.error({
          message: 'Both Small integrated ENM transport Only and Multi-techology can not be set to true.',
          title: '<i class="glyphicon glyphicon-remove"></i> Documents redirect error!'
        });
      }
      if (keyPair.vioOptimizedTransportOnly === 'true' && keyPair.vioMultiTech === 'true') {
        Notification.error({
          message: 'Both Optimized Small integrated ENM transport Only and Multi-techology can not be set to true.',
          title: '<i class="glyphicon glyphicon-remove"></i> Documents redirect error!'
        });
      }
      if (keyPair.vioOptimizedTransportOnly === 'true' && keyPair.vioTransportOnly === 'true') {
        Notification.error({
          message: 'Both Optimized Small integrated ENM transport Only and Small integrated ENM transport Only can not be set to true.',
          title: '<i class="glyphicon glyphicon-remove"></i> Documents redirect error!'
        });
      }
      if (keyPair.vioOptimizedTransportOnly === 'true'
        && keyPair.vioTransportOnly === 'true'
        && keyPair.vioMultiTech === 'true') {
        Notification.error({
          message: 'Only one of following can be set to true: Optimized Small integrated ENM transport Only or Small integrated ENM transport Only or Multi-techology',
          title: '<i class="glyphicon glyphicon-remove"></i> Documents redirect error!'
        });
      }
      for (var key in keyPair) {
        if (documentOptions.indexOf(key) > -1) {
          if (keyPair[key] === 'true') {
            vm.document[key] = true;
          } else if (keyPair[key] === 'false') {
            vm.document[key] = false;
          } else {
            Notification.error({ message: `${key} value must be true or false`, title: '<i class="glyphicon glyphicon-remove"></i> Documents redirect error!' });
          }
        }
      }
    }
  }

  function isDocumentUsingSnapshotSchema() {
    if (!creatingFromScratch && !isFullVersion(schema.version)) {
      return true;
    }
    return false;
  }
  vm.setVisibleSchemas();

  vm.changeVioType = function (vioType) {
    if (vioType === 'vioMultiTech') {
      vm.document.vioTransportOnly = false;
      vm.document.vioOptimizedTransportOnly = false;
    }
    if (vioType === 'vioTransportOnly') {
      vm.document.vioMultiTech = false;
      vm.document.vioOptimizedTransportOnly = false;
    }
    if (vioType === 'vioOptimizedTransportOnly') {
      vm.document.vioMultiTech = false;
      vm.document.vioTransportOnly = false;
    }
    vm.document.vio = false;
    vm.changedDocument();
  };

  vm.changedDocument = function () {
    vm.generateModifiedSchema();
  };

  vm.vnfLcmChangedDocument = function () {
    vm.generateVnfLcmModifiedSchema();
  };

  vm.ipv6ChangedDocument = function () {
    ipv6OptionClicked = true;
    vm.generateModifiedSchema();
  };

  vm.changedSupportedManagedConfigs = function () {
    if (vm.document.managedconfig) {
      return;
    }
    var managedConfigsList = _.cloneDeep(vm.populatedManagedConfigs);
    vm.document.managedconfigs = managedConfigsList.map(function (populatedMC) {
      var matchingManagedConfigCounts = 0;
      var lastMatchingManagedConfig;
      vm.supportedManagedConfigs.forEach(function (supportedMC) {
        if (populatedMC.labels.every(containsLabel(supportedMC.labels))) {
          matchingManagedConfigCounts += 1;
          lastMatchingManagedConfig = supportedMC._id;
        }
      });
      if (matchingManagedConfigCounts === 1) {
        populatedMC = lastMatchingManagedConfig;
      } else {
        populatedMC = '';
      }
      return populatedMC;
    });
    vm.changedDocumentManagedConfigs();
  };

  function loadSupportedManagedConfigs() {
    if (vm.document.managedconfig) {
      return [];
    }
    DocumentsService.query({ q: `schema_id=${vm.document.schema_id}&managedconfig=true`, fields: '_id,name,labels,content' }).$promise
      .then(async function (documents) {
        vm.supportedManagedConfigs = getManagedConfigsLabelCategory(documents);
        vm.changedSupportedManagedConfigs();
      })
      .catch(function (err) {
        var message = err.data ? err.data.message : err.message;
        Notification.error({ message: message.replace(/\n/g, '<br/>'), title: '<i class="glyphicon glyphicon-remove"></i> Documents loading error!' });
      });
  }

  function getManagedConfigsLabelCategory(documents) {
    filteredManagedConfigs = { size: [], site: [], other: [] };
    documents = documents.map(function (document) {
      document.labels.find(function (docLabel) {
        allLabels.find(function (label) {
          if (docLabel === label.name) {
            document.category = label.category;
            filteredManagedConfigs[label.category].push(document);
          }
          return docLabel === label.name;
        });
        return true;
      });
      return document;
    });
    return documents;
  }

  vm.changeEditingLabelsVisibility = function () {
    vm.editingLabelsVisible = !vm.editingLabelsVisible;
  };

  vm.submitForm = async function () {
    var documentStatus = (creatingFromScratch ? 'creation' : 'update');
    var originalDocument;

    if (!creatingFromScratch) {
      originalDocument = await DocumentsService.get({ documentId: vm.document._id }).$promise;
    }
    try {
      vm.formSubmitting = true;
      await vm.document.createOrUpdate();
    } catch (err) {
      vm.formSubmitting = false;
      Notification.error({ message: err.data.message.replace(/\n/g, '<br/>'), title: `<i class="glyphicon glyphicon-remove"></i> Document ${documentStatus} error!` });
      return;
    }
    if (!creatingFromScratch && vm.document.managedconfig) {
      try {
        await resaveDocuments();
      } catch (err) {
        vm.formSubmitting = false;
        await revertDocument(originalDocument);
        var message = err.data ? err.data.message : err.message;
        Notification.error({ message: message.replace(/\n/g, '<br/>'), title: '<i class="glyphicon glyphicon-remove"></i> Associated document update error!' });
        return;
      }
    }
    $state.go('documents.view', { documentId: vm.document._id });
    Notification.success({ message: `<i class="glyphicon glyphicon-ok"></i> Document ${documentStatus} successful!` });
  };

  async function revertDocument(documentToRevert) {
    try {
      delete documentToRevert.__v;
      await documentToRevert.createOrUpdate();
    } catch (err) {
      Notification.error({ message: '<i class="glyphicon glyphicon-remove"></i> Failed to revert document!' });
    }
  }

  function containsLabel(labels) {
    return function (label) {
      return labels.indexOf(label) >= 0;
    };
  }

  vm.changedDocumentSchemaID = function (schemaId) {
    documentSchemaVersionChange = true;
    SchemasService.get({ schemaId: schemaId }).$promise
      .then(async function (schema) {
        loadSupportedManagedConfigs();
        vm.setUnmodifiedAndModifiedSchemas(schema);
        vm.setVisibleSchemas();
      })
      .catch(function (err) {
        var message = err.data ? err.data.message : err.message;
        Notification.error({ message: message.replace(/\n/g, '<br/>'), title: '<i class="glyphicon glyphicon-remove"></i> Schema loading error!' });
      });
  };

  vm.setUnmodifiedAndModifiedSchemas = function (schema) {
    unmodifiedSchema = schema;
    vm.generateModifiedSchema();
    vm.generateVnfLcmModifiedSchema();
  };

  function isAutopopulatedIPKey([key, keyDefinition]) {
    var ignorableKeys = [
      'dynamic_ip_range_start',
      'dynamic_ip_range_end',
      'dynamic_ipv6_range_start',
      'dynamic_ipv6_range_end'
    ];
    if (ignorableKeys.includes(key)) {
      return false;
    }
    var autoPopulateIPKeyDefinitions = [
      '#/definitions/ipv4_external',
      '#/definitions/ipv6_external',
      '#/definitions/ipv4_external_list',
      '#/definitions/ipv6_external_list',
      '#/definitions/ipv4_internal',
      '#/definitions/ipv6_internal',
      '#/definitions/ipv4_internal_list',
      '#/definitions/ipv6_internal_list'
    ];
    if (autoPopulateIPKeyDefinitions.includes(keyDefinition.$ref)) {
      return true;
    }
    return false;
  }

  function isVnfLcmAutopopulatedIPKey([key, keyDefinition]) {
    var vnfLcmAutoPopulateIPKeyDefinitions = [
      '#/definitions/ipv4_cidr_external',
      '#/definitions/ipv4_external',
      '#/definitions/ipv6_cidr_external',
      '#/definitions/ipv6_external',
      '#/definitions/ipv4_internal',
      '#/definitions/ipv6_internal',
      '#/definitions/ipv6_internal_list',
      '#/definitions/ipv4_cidr_internal',
      '#/definitions/ipv6_cidr_internal'
    ];
    if (vnfLcmAutoPopulateIPKeyDefinitions.includes(keyDefinition.$ref)) {
      return true;
    }
    return false;
  }

  function iscENMAutopopulatedIPKey([key, keyDefinition]) {
    return keyDefinition.$ref && keyDefinition.$ref.includes('_autopop');
  }

  function getAutopopulatedCENMIPKeys(schema) {
    if (_.has(schema.content, 'properties.parameters.properties')) {
      return Object.entries(schema.content.properties.parameters.properties).filter(iscENMAutopopulatedIPKey);
    }
    return [];
  }

  function getAutopopulatedIPKeys(schema) {
    if (_.has(schema.content, 'properties.parameters.properties')) {
      return Object.entries(schema.content.properties.parameters.properties).filter(isAutopopulatedIPKey);
    }
    return [];
  }

  function getVnfLcmAutopopulatedIPKeys(schema) {
    if (_.has(schema.content, 'properties.parameters.properties')) {
      return Object.entries(schema.content.properties.parameters.properties).filter(isVnfLcmAutopopulatedIPKey);
    }
    return [];
  }

  function getAllAutopopulatedKeys() {
    var autoPopulatedFields = [];
    if (vm.isSedDocument() && vm.document.autopopulate) {
      autoPopulatedFields = [
        'parameters.vim_tenant_name',
        'parameters.vim_name',
        'parameters.cloudManagerRestInterfaceBaseURL',
        'parameters.cloudManagerTenantId',
        'parameters.cloudManagerTenantName',
        'parameters.cloudManagerUserName',
        'parameters.cloudManagerUserPassword',
        'parameters.enm_internal_network_name',
        'parameters.enm_external_security_group_name',
        'parameters.enm_internal_security_group_name',
        'parameters.enm_laf_security_group_name',
        'parameters.enm_external_network_name',
        'parameters.external_subnet',
        'parameters.external_gateway',
        'parameters.external_netmask',
        'parameters.external_subnet_ipv6',
        'parameters.external_gateway_ipv6',
        'parameters.laf_url',
        'parameters.COM_INF_LDAP_ROOT_SUFFIX',
        'parameters.key_name',
        'parameters.lvs_external_CM_vrrp_id',
        'parameters.lvs_external_FM_vrrp_id',
        'parameters.lvs_external_PM_vrrp_id'
      ];
      if (vm.document.vioTransportOnly
        || vm.document.vioOptimizedTransportOnly
        || vm.document.vioMultiTech) {
        autoPopulatedFields.push('parameters.enm_deployment_type');
      }
      getAutopopulatedIPKeys(unmodifiedSchema).forEach(function ([key, keyDefinition]) {
        autoPopulatedFields.push(`parameters.${key}`);
      });
    }

    if (vm.iscEnmSedDocument() && vm.document.autopopulate) {
      getAutopopulatedCENMIPKeys(unmodifiedSchema).forEach(function ([key, keyDefinition]) {
        autoPopulatedFields.push(`parameters.${key}`);
      });
    }
    return autoPopulatedFields;
  }

  function getAllVnfLcmAutopopulatedKeys() {
    var vnfLcmAutoPopulatedFields = [];
    if (vm.isVnfLcmSedDocument() && vm.document.autopopulate) {
      vnfLcmAutoPopulatedFields = [
        'parameters.internal_ipv4_for_services_vm',
        'parameters.internal_ipv4_for_db_vm',
        'parameters.external_ipv4_for_services_vm',
        'parameters.external_ipv4_for_db_vm',
        'parameters.external_ipv6_for_services_vm',
        'parameters.external_ipv6_for_db_vm',
        'parameters.internal_ipv4_subnet_gateway',
        'parameters.external_ipv4_subnet_cidr',
        'parameters.external_ipv4_subnet_gateway',
        'parameters.internal_ipv6_subnet_gateway',
        'parameters.external_ipv6_subnet_cidr',
        'parameters.external_ipv6_subnet_gateway',
        'parameters.vim_ip',
        'parameters.vim_url',
        'parameters.vim_tenant_id',
        'parameters.vim_tenant_name',
        'parameters.vim_name',
        'parameters.vim_tenant_username',
        'parameters.vim_tenant_user_password',
        'parameters.external_ipv4_subnet_cidr',
        'parameters.external_gateway',
        'parameters.external_subnet_ipv6',
        'parameters.external_gateway_ipv6',
        'parameters.keypair',
        'parameters.vim_HostName',
        'parameters.serviceregistry_internal_ip_list',
        'parameters.deployment_id',
        'parameters.ip_version',
        'parameters.dns_server_ip',
        'parameters.cinder_volume_id',
        'parameters.internal_net_id',
        'parameters.internal_mtu',
        'parameters.external_net_id',
        'parameters.security_group_id',
        'parameters.services_vm_count',
        'parameters.db_vm_count',
        'parameters.svc_external_vrrp_id',
        'parameters.svc_internal_vrrp_id',
        'parameters.db_internal_vrrp_id',
        'parameters.ossNotificationServiceIP',
        'parameters.ossNbiAlarmIP'
      ];
      getVnfLcmAutopopulatedIPKeys(unmodifiedSchema).forEach(function ([key, keyDefinition]) {
        vnfLcmAutoPopulatedFields.push(`parameters.${key}`);
      });
    }
    /* workaround to reveal key which needs to be manually filled, as shared definition is hiding it */
    if (!vnfLcmAutoPopulatedFields.includes('internal_ipv6_for_services_vm')) {
      vnfLcmAutoPopulatedFields.push('vnfLcmAutoPopulatedFields');
    }
    return vnfLcmAutoPopulatedFields;
  }

  function isExternalNFSKey([key, keyDefinition]) {
    var externalNFSDefinitions = [
      '#/definitions/nfs_exported_fs',
      '#/definitions/external_nfs_server'
    ];
    // To ensure backward compatibility to be removed at a later date.
    var backwardCompatibleKeys = [
      'nfsamos_external_exported_fs',
      'nfspmlinks_external_server',
      'nfspmlinks_external_exported_fs',
      'nfspm1_external_server',
      'nfspm1_external_exported_fs',
      'nfspm2_external_server',
      'nfspm2_external_exported_fs',
      'nfssmrs_external_server',
      'nfssmrs_external_exported_fs',
      'nfsamos_external_server'
    ];
    if (externalNFSDefinitions.includes(keyDefinition.$ref)) {
      return true;
    }
    // To ensure backward compatibility to be removed at a later date.
    if (backwardCompatibleKeys.includes(key)) {
      return true;
    }
    return false;
  }

  function isInternalNFSKey([key, keyDefinition]) {
    var internalNFSDefinitions = [
      '#/definitions/nfs_instances',
      '#/definitions/nfs_volume_size',
      '#/definitions/nfs_volume_snap',
      '#/definitions/nfs_ipv4_external_list',
      '#/definitions/nfs_ipv6_external_list'
    ];
    // To ensure backward compatibility to be removed at a later date.
    var backwardCompatibleKeys = [
      'nfspm_instances',
      'nfspmlinks_instances',
      'nfssmrs_instances',
      'nfspm_volume_size',
      'nfspmlinks_volume_size',
      'nfssmrs_volume_size',
      'nfspm_external_ip_list',
      'nfspm_external_ipv6_list',
      'nfspmlinks_external_ip_list',
      'nfspmlinks_external_ipv6_list',
      'nfspm_volume_backup',
      'nfspmlinks_volume_backup'
    ];
    if (internalNFSDefinitions.includes(keyDefinition.$ref)) {
      return true;
    }
    // To ensure backward compatibility to be removed at a later date.
    if (backwardCompatibleKeys.includes(key)) {
      return true;
    }
    return false;
  }

  function isOvercommitKey([key, keyDefinition]) {
    return (keyDefinition.$ref === '#/definitions/over_commit');
  }

  function isNotOvercommitKey([key, keyDefinition]) {
    return (keyDefinition.$ref === '#/definitions/not_over_commit');
  }

  function isOpenstackFlavorKey([key, keyDefinition]) {
    return (keyDefinition.$ref === '#/definitions/openstack_flavor');
  }

  function filterSchemaByDefinition(schema, filterFunction) {
    if (_.has(schema.content, 'properties.parameters.properties')) {
      return Object.entries(schema.content.properties.parameters.properties).filter(filterFunction);
    }
    return [];
  }

  function getHiddenNFSKeys() {
    var hiddenNFSKeys = [];
    if (vm.document.useexternalnfs) {
      filterSchemaByDefinition(unmodifiedSchema, isInternalNFSKey).forEach(function ([key, keyDefinition]) {
        hiddenNFSKeys.push(`parameters.${key}`);
      });
    } else {
      filterSchemaByDefinition(unmodifiedSchema, isExternalNFSKey).forEach(function ([key, keyDefinition]) {
        hiddenNFSKeys.push(`parameters.${key}`);
      });
    }
    return hiddenNFSKeys;
  }

  function getHiddenOpenstackFlavors() {
    var flavorKeys = [];
    filterSchemaByDefinition(unmodifiedSchema, isOpenstackFlavorKey).forEach(function ([key, keyDefinition]) {
      flavorKeys.push(`parameters.${key}`);
    });
    return flavorKeys;
  }

  function getHiddenOvercommitKeys() {
    var overcommitKeys = [];
    if (vm.document.overcommit) {
      filterSchemaByDefinition(unmodifiedSchema, isNotOvercommitKey).forEach(function ([key, keyDefinition]) {
        overcommitKeys.push(`parameters.${key}`);
      });
    } else {
      filterSchemaByDefinition(unmodifiedSchema, isOvercommitKey).forEach(function ([key, keyDefinition]) {
        overcommitKeys.push(`parameters.${key}`);
      });
    }
    return overcommitKeys;
  }

  var getRequiredNFSKeys = function () {
    var requiredNFSKeys = [];
    if (vm.document.useexternalnfs) {
      filterSchemaByDefinition(unmodifiedSchema, isExternalNFSKey).forEach(function ([key, keyDefinition]) {
        requiredNFSKeys.push(key);
      });
    } else {
      filterSchemaByDefinition(unmodifiedSchema, isInternalNFSKey).forEach(function ([key, keyDefinition]) {
        requiredNFSKeys.push(key);
      });
    }
    return requiredNFSKeys;
  };

  vm.hasSchemaObsoleteVioDefinitions = function () {
    if (!vm.isSedDocument()) { return false; }
    var obsoleteVIOKeys = getHiddenObsoleteVIOKeys();
    if (obsoleteVIOKeys.length === 0) {
      return false;
    }
    return true;
  };

  vm.hasSchemaVioDefinitions = function () {
    if (!vm.isSedDocument()) { return false; }
    var commonVIOKeys = getHiddenCommonVIOKeys();
    if (commonVIOKeys.length === 0) {
      return false;
    }
    return true;
  };

  function getHiddenObsoleteVIOKeys() {
    var hiddenObsoleteVIOKeys = [];
    getObsoleteVIOkeys(unmodifiedSchema).forEach(function ([key, keyDefinition]) {
      hiddenObsoleteVIOKeys.push(`parameters.${key}`);
    });
    return hiddenObsoleteVIOKeys;
  }

  function isObsoleteVIOKey([key, keyDefinition]) {
    var obsoleteVIODefinitions = [
      '#/definitions/ipv4_vio',
      '#/definitions/ipv6_vio',
      '#/definitions/vio_any_string',
      '#/definitions/vio_hostname',
      '#/definitions/vio_positive_integer'
    ];
    if (obsoleteVIODefinitions.includes(keyDefinition.$ref)) {
      return true;
    }
  }

  function getObsoleteVIOkeys(schema) {
    if (_.has(schema.content, 'properties.parameters.properties')) {
      return Object.entries(schema.content.properties.parameters.properties).filter(isObsoleteVIOKey);
    }
    return [];
  }

  function getHiddenCommonVIOKeys() {
    var hiddenCommonVIOKeys = [];
    getCommonVIOkeys(unmodifiedSchema).forEach(function ([key, keyDefinition]) {
      hiddenCommonVIOKeys.push(`parameters.${key}`);
    });
    return hiddenCommonVIOKeys;
  }

  function getHiddenTransportVIOKeys() {
    var hiddenTransportVIOKeys = [];
    getSingleVIOkeys(unmodifiedSchema).forEach(function ([key, keyDefinition]) {
      hiddenTransportVIOKeys.push(`parameters.${key}`);
    });
    return hiddenTransportVIOKeys;
  }

  function getHiddenMultiTechVIOKeys() {
    var hiddenMultiTechVIOKeys = [];
    getMultiTechVIOkeys(unmodifiedSchema).forEach(function ([key, keyDefinition]) {
      hiddenMultiTechVIOKeys.push(`parameters.${key}`);
    });
    return hiddenMultiTechVIOKeys;
  }

  function getCommonVIOkeys(schema) {
    if (_.has(schema.content, 'properties.parameters.properties')) {
      return Object.entries(schema.content.properties.parameters.properties).filter(isCommonVIOKey);
    }
    return [];
  }

  function isCommonVIOKey([key, keyDefinition]) {
    var commonVIODefinitions = [
      '#/definitions/ipv4_vio_common',
      '#/definitions/ipv6_vio_common',
      '#/definitions/vio_common_any_string',
      '#/definitions/vio_common_hostname',
      '#/definitions/vio_common_positive_integer'
    ];
    if (commonVIODefinitions.includes(keyDefinition.$ref)) {
      return true;
    }
  }

  function getSingleVIOkeys(schema) {
    if (_.has(schema.content, 'properties.parameters.properties')) {
      return Object.entries(schema.content.properties.parameters.properties).filter(isSingleVIOKey);
    }
    return [];
  }

  function isSingleVIOKey([key, keyDefinition]) {
    var singleVIODefinitions = [
      '#/definitions/ipv4_vio_single',
      '#/definitions/ipv6_vio_single',
      '#/definitions/vio_single_any_string',
      '#/definitions/vio_single_hostname',
      '#/definitions/vio_single_positive_integer'
    ];
    if (singleVIODefinitions.includes(keyDefinition.$ref)) {
      return true;
    }
  }

  function getMultiTechVIOkeys(schema) {
    if (_.has(schema.content, 'properties.parameters.properties')) {
      return Object.entries(schema.content.properties.parameters.properties).filter(isMultiTechVIOKey);
    }
    return [];
  }

  function isMultiTechVIOKey([key, keyDefinition]) {
    var multiTechVIODefinitions = [
      '#/definitions/ipv4_vio_multi',
      '#/definitions/ipv6_vio_multi',
      '#/definitions/vio_multi_any_string',
      '#/definitions/vio_multi_hostname',
      '#/definitions/vio_multi_positive_integer'
    ];
    if (multiTechVIODefinitions.includes(keyDefinition.$ref)) {
      return true;
    }
  }

  function getHiddenIpv6Keys() {
    var hiddenIpv6Keys = [];
    getIPv6KeyValues(unmodifiedSchema).forEach(function ([key, keyDefinition]) {
      if (skipHideIPv6Keys.indexOf(key) !== -1) {
        return;
      }
      hiddenIpv6Keys.push(`parameters.${key}`);
    });
    return hiddenIpv6Keys;
  }

  function getIPv6Keys() {
    var IPv6Keys = [];
    getIPv6KeyValues(unmodifiedSchema).forEach(function ([key, keyDefinition]) {
      IPv6Keys.push(key);
    });
    return IPv6Keys;
  }

  function getIPv6KeyValues(schema) {
    if (_.has(schema.content, 'properties.parameters.properties')) {
      return Object.entries(schema.content.properties.parameters.properties).filter(isIpv6Key);
    }
    return [];
  }

  function isIpv6Key([key, keyDefinition]) {
    var Ipv6Definitions = [
      '#/definitions/ipv6_cidr',
      '#/definitions/ipv6_external',
      '#/definitions/ipv6_external_list',
      '#/definitions/ipv6_internal_list',
      '#/definitions/nfs_ipv6_external_list',
      '#/definitions/ipv6_internal'
    ];
    if (Ipv6Definitions.includes(keyDefinition.$ref)) {
      return true;
    }
  }

  vm.generateVnfLcmModifiedSchema = function () {
    if (!unmodifiedSchema || !vm.isVnfLcmSedDocument()) {
      return;
    }
    var schema = _.cloneDeep(unmodifiedSchema);
    hiddenFields = getAllVnfLcmAutopopulatedKeys();
    for (var i = 0; i < hiddenFields.length; i += 1) {
      var propertyPath = `properties.${hiddenFields[i].replace(/\./g, '.properties.')}`;
      var parts = propertyPath.split('.');
      var keyName = parts[parts.length - 1];
      var requiredPath = `${parts.slice(0, -2).join('.')}.required`;
      _.unset(schema.content, propertyPath);
      _.pull(_.get(schema.content, requiredPath), keyName);
    }
    if (!_.isEqual(vm.modifiedSchema, schema.content)) {
      vm.modifiedSchema = schema.content;
      ajvAddDefaultsAndRemoveAdditionalKeys = ajv.compile(unmodifiedSchema.content);
      vm.addDefaultsAndRemoveAdditionalKeys();
    }
    if (schema.content.properties.parameters) {
      vm.schemaForm = getSchemaForm(schema);
    }
  };

  vm.generateModifiedSchema = async function () {
    if (!unmodifiedSchema || vm.isVnfLcmSedDocument()) {
      return;
    }
    var schema = _.cloneDeep(unmodifiedSchema);
    hiddenFields = getAllAutopopulatedKeys();
    if (vm.isSedDocument()) {
      hiddenFields = hiddenFields.concat(getHiddenNFSKeys(), ['parameters.ip_version']);
      if (vm.document.dns) {
        var hiddenDNSKeys = ['parameters.httpd_fqdn', 'parameters.esmon_hostname', 'parameters.SSO_COOKIE_DOMAIN'];
        hiddenFields = hiddenFields.concat(hiddenDNSKeys);
      }
      var nonVioDocument = (
        !vm.document.vioTransportOnly
        && !vm.document.vioOptimizedTransportOnly
        && !vm.document.vioMultiTech
        && !vm.document.vio
      );
      if (nonVioDocument) {
        let hiddenObsoleteVIOKeys = getHiddenObsoleteVIOKeys();
        let hiddenCommonVIOKeys = getHiddenCommonVIOKeys();
        let hiddenTransportVIOKeys = getHiddenTransportVIOKeys();
        let hiddenMultiTechVIOKeys = getHiddenMultiTechVIOKeys();
        hiddenFields = hiddenFields.concat(hiddenObsoleteVIOKeys);
        hiddenFields = hiddenFields.concat(hiddenCommonVIOKeys);
        hiddenFields = hiddenFields.concat(hiddenTransportVIOKeys);
        hiddenFields = hiddenFields.concat(hiddenMultiTechVIOKeys);
      }
      if (vm.document.vioMultiTech) {
        let hiddenTransportVIOKeys = getHiddenTransportVIOKeys();
        hiddenFields = hiddenFields.concat(hiddenTransportVIOKeys);
      }
      if (vm.document.vioTransportOnly || vm.document.vioOptimizedTransportOnly) {
        let hiddenMultiTechVIOKeys = getHiddenMultiTechVIOKeys();
        hiddenFields = hiddenFields.concat(hiddenMultiTechVIOKeys);
      }
      filteredIPv6Keys = _.pull(getIPv6Keys(), 'dynamic_ipv6_range_start', 'dynamic_ipv6_range_end');
      vm.preIPv6OptionSed = areIPv6KeysInRequired(filteredIPv6Keys, schema);
      if (ipv6OptionClicked && !vm.preIPv6OptionSed && vm.pod && vm.project && !ipv6Ranges.length) {
        vm.document.ipv6 = false;
      }
      if (!vm.preIPv6OptionSed && !vm.document.ipv6) {
        if (!vm.pod && !vm.project) {
          hideIPv6Keys();
        }
        if (vm.pod && vm.project) {
          if (ipv6OptionClicked) {
            hideIPv6Keys();
          }
          if (!ipv6OptionClicked) {
            if (!documentSchemaVersionChange) {
              hideIPv6Keys();
            } else {
              var isPodValid = false;
              vm.pod.networks.forEach(function (podNetwork) {
                var ipv6 = podNetwork.ipv6_subnet;
                if (ipv6 && ipv6.cidr && ipv6.gateway_ip) {
                  isPodValid = true;
                }
              });
              if (!ipv6Ranges.length && !isPodValid) {
                hideIPv6Keys();
              }
            }
          }
        }
      }
      if (vm.document.autopopulate && vm.isManagedConfigWithFlavorValuesAttached()) {
        hiddenFields = hiddenFields.concat(getHiddenOpenstackFlavors());
        hiddenFields = hiddenFields.concat(getHiddenOvercommitKeys());
      } else {
        var overcommitKeys = [];
        filterSchemaByDefinition(unmodifiedSchema, isNotOvercommitKey).forEach(function ([key, keyDefinition]) {
          overcommitKeys.push(`parameters.${key}`);
        });
        filterSchemaByDefinition(unmodifiedSchema, isOvercommitKey).forEach(function ([key, keyDefinition]) {
          overcommitKeys.push(`parameters.${key}`);
        });
        hiddenFields = hiddenFields.concat(overcommitKeys);
      }
    }
    for (var x = 0; x < vm.populatedManagedConfigs.length; x += 1) {
      hiddenFields.push(...Object.keys(flattenObjectKeys(vm.populatedManagedConfigs[x].content)));
    }
    for (var i = 0; i < hiddenFields.length; i += 1) {
      var propertyPath = `properties.${hiddenFields[i].replace(/\./g, '.properties.')}`;
      var parts = propertyPath.split('.');
      var keyName = parts[parts.length - 1];
      var requiredPath = `${parts.slice(0, -2).join('.')}.required`;
      _.unset(schema.content, propertyPath);
      _.pull(_.get(schema.content, requiredPath), keyName);
    }
    if (vm.document.managedconfig) {
      removeKeyFromObject(schema.content, 'required');
      removeKeyFromObject(schema.content, 'default');
    }
    if (vm.isSedDocument()) {
      var requiredNfsKeyNames = getRequiredNFSKeys();
      schema.content.properties.parameters.required = _.union(schema.content.properties.parameters.required, requiredNfsKeyNames);
    }
    if (!_.isEqual(vm.modifiedSchema, schema.content)) {
      vm.modifiedSchema = schema.content;
      if (vm.document.managedconfig) {
        ajvAddDefaultsAndRemoveAdditionalKeys = (vm.isSedDocument() || vm.iscEnmSedDocument()) ? vm.modifiedSchema : ajv.compile(vm.modifiedSchema);
      } else {
        ajvAddDefaultsAndRemoveAdditionalKeys = (vm.isSedDocument() || vm.iscEnmSedDocument()) ? unmodifiedSchema.content : ajv.compile(unmodifiedSchema.content); // eslint-disable-line max-len
      }
      if (vm.isSedDocument() || vm.iscEnmSedDocument()) {
        await vm.addDefaultsAndRemoveAdditionalKeysENM();
      } else {
        vm.addDefaultsAndRemoveAdditionalKeys();
      }
    }
    if (schema.content.properties.parameters) {
      vm.schemaForm = getSchemaForm(schema);
    }
  };

  function hideIPv6Keys() {
    hiddenIpv6Keys = getHiddenIpv6Keys();
    hiddenFields = hiddenFields.concat(hiddenIpv6Keys);
  }

  function areIPv6KeysInRequired(filteredIPv6Keys, schema) {
    var result = filteredIPv6Keys.every(function (key) {
      return schema.content.properties.parameters.required.indexOf(key) >= 0;
    });
    return result;
  }

  function removeKeyFromObject(obj, key) {
    for (var property in obj) {
      if (property === key) {
        delete obj[property];
      } else if (typeof obj[property] === 'object') {
        removeKeyFromObject(obj[property], key);
      }
    }
  }

  function flattenObjectKeys(obj) {
    var result = {};
    function recurse(cur, prop) {
      if (Object(cur) !== cur) {
        result[prop] = cur;
      } else if (Array.isArray(cur)) {
        var l;
        var i;
        for (i = 0, l = cur.length; i < l; i += 1) { recurse(cur[i], `${prop}[${i}]`); }
        if (l === 0) { result[prop] = []; }
      } else {
        var isEmpty = true;
        for (var p in cur) {
          if (Object.prototype.hasOwnProperty.call(cur, p)) {
            isEmpty = false;
            recurse(cur[p], prop ? `${prop}.${p}` : p);
          }
        }
        if (isEmpty && prop) { result[prop] = {}; }
      }
    }
    recurse(obj, '');
    return result;
  }

  function cleanJson(obj) {
    for (var key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        if (obj[key] === null || obj[key] === undefined || obj[key] === '') {
          delete obj[key];
        }
      }
    }
  }

  vm.changedPasteTextArea = function (documentType, pasteModeCheck) {
    if (pasteModeCheck && $('#pasteMode').is(':checked')) {
      return;
    }
    var keyName = Object.keys(vm.document.content)[0];
    if (documentType === 'json' && keyName) {
      if (vm.isSedDocument() || vm.isVnfLcmSedDocument() || vm.document.managedconfig) {
        if (keyName !== 'parameters') {
          vm.document.content.parameters = vm.document.content[keyName];
          delete vm.document.content[keyName];
          $window.alert(`The parent key you entered "${keyName}" for Document JSON was invalid.
            \nTo fix this, parent key was renamed to correct name "parameters".`);
        }
      }
      cleanJson(vm.document.content[Object.keys(vm.document.content)[0]]);
    }
    vm.pasteMode = false;
    if (!vm.isSedDocument()) vm.addDefaultsAndRemoveAdditionalKeys();
  };

  vm.addDefaultsAndRemoveAdditionalKeys = function () {
    ajvAddDefaultsAndRemoveAdditionalKeys(vm.document.content);
  };

  vm.addDefaultsAndRemoveAdditionalKeysENM = async function () {
    // only autopopulate when its creation ENM document (during edit fields are already valid/autopopulated)
    if (creatingFromScratch) {
      const schemaData = JSON.stringify(ajvAddDefaultsAndRemoveAdditionalKeys);
      try {
        // default post header
        $http.defaults.headers.post['Content-Type'] = 'application/json';
        await $http({
          method: 'POST',
          url: '/api/documents/validate',
          data: schemaData,
          headers: { 'Content-Type': 'application/json' }
        }).then(function (data) {
          // populate document
          vm.document.content = data.data;
        }, function (err) {
          Notification.error({
            message: JSON.stringify(err),
            title: `<i class="glyphicon glyphicon-remove"></i> ERROR: Failed to send schema to server side! ${err}`
          });
        });
      } catch (err) {
        Notification.error({
          message: JSON.stringify(err),
          title: `<i class="glyphicon glyphicon-remove"></i> ERROR: Failed to send schema to server side! ${err}`
        });
      }
    }
  };

  vm.addManagedConfig = function () {
    vm.document.managedconfigs.push('');
    vm.changedDocumentManagedConfigs();
  };

  vm.removeManagedConfig = function (managedConfigIndex) {
    if ($window.confirm('Are you sure you want to delete the association with this managed config?')) {
      vm.document.managedconfigs.splice(managedConfigIndex, 1);
      vm.changedDocumentManagedConfigs();
    }
  };

  vm.isSedDocument = function () {
    return (!vm.document.managedconfig && unmodifiedSchema && unmodifiedSchema.category === 'enm');
  };

  vm.iscEnmSedDocument = function () {
    return (!vm.document.managedconfig && unmodifiedSchema && unmodifiedSchema.category === 'cenm');
  };

  vm.isVnfLcmSedDocument = function () {
    return (!vm.document.managedconfig && unmodifiedSchema && unmodifiedSchema.category === 'vnflcm');
  };

  function calculatePopulatedManagedConfigs() {
    var populatedManagedConfigs = [];
    for (var x = 0; x < vm.document.managedconfigs.length; x += 1) {
      for (var y = 0; y < vm.supportedManagedConfigs.length; y += 1) {
        if (vm.document.managedconfigs[x] === vm.supportedManagedConfigs[y]._id) {
          populatedManagedConfigs.push(vm.supportedManagedConfigs[y]);
          break;
        }
      }
    }
    if (!_.isEqual(vm.populatedManagedConfigs, populatedManagedConfigs)) {
      vm.populatedManagedConfigs = populatedManagedConfigs;
      vm.changedDocument();
    }
  }

  vm.changedDocumentManagedConfigs = function (itemIndex) {
    if (vm.isSedDocument() || vm.iscEnmSedDocument()) {
      calculatePopulatedManagedConfigs();
      vm.getSupportedManagedConfigs(itemIndex);
    }
  };

  vm.getCategory = function (itemIndex) {
    var managedConfig = vm.supportedManagedConfigs.find(function (mc) {
      return mc._id === vm.document.managedconfigs[itemIndex];
    });
    if (managedConfig) {
      for (var l = 0; l < allLabels.length; l += 1) {
        if (managedConfig.labels.indexOf(allLabels[l].name) !== -1) {
          return vm.categories.indexOf(allLabels[l].category);
        }
      }
    }
  };

  vm.getSupportedManagedConfigs = function (itemIndex) {
    var managedConfigs = vm.supportedManagedConfigs;
    if (vm.category && vm.category[itemIndex]) {
      managedConfigs = filteredManagedConfigs[vm.category[itemIndex]];
    }
    if (vm.document.managedconfigs.length) {
      managedConfigs = managedConfigs.filter(function (mc) {
        return (vm.document.managedconfigs.indexOf(mc._id) === -1 || vm.document.managedconfigs[itemIndex] === mc._id);
      });
    }
    return managedConfigs;
  };

  vm.isManagedConfigWithFlavorValuesAttached = function () {
    if (vm.isSedDocument()) {
      var mcIsFound = vm.supportedManagedConfigs.some(function (supportedManagedConfig) {
        return (vm.document.managedconfigs.includes(supportedManagedConfig._id) && containsVmFlavorValues(supportedManagedConfig));
      });
      if (!mcIsFound) vm.document.overcommit = false;
      return mcIsFound;
    }
  };

  vm.isIpv6NetworkValid = function () {
    return (vm.project && ipv6Ranges.length);
  };

  function containsVmFlavorValues(managedConfig) {
    var result = false;
    var flavorRegex = /flavor_\d+vC\d+M/;
    Object.entries(managedConfig.content.parameters).forEach(function ([key, value]) {
      if (value) {
        if (!flavorRegex.test(key) && flavorRegex.test(value)) {
          result = true;
        }
      }
    });
    return result;
  }

  async function resaveDocuments() {
    var documents = await DocumentsService.query({ q: `managedconfigs=${vm.document._id}`, fields: '_id' }).$promise;
    var documentPromises = [];
    for (var d = 0; d < documents.length; d += 1) {
      var document = new DocumentsService({ _id: documents[d]._id });
      documentPromises.push(document.createOrUpdate());
    }
    await Promise.all(documentPromises);
  }

  if (creatingFromScratch && !restoredata) {
    _.extend(vm.document, {
      autopopulate: !managedConfigMode,
      labels: [],
      managedconfigs: [],
      managedconfig: managedConfigMode,
      dns: true,
      vio: false,
      ipv6: false,
      usergroups: [],
      content: {}
    });
    vm.pageTitle = 'Creating';
  } else {
    vm.setUnmodifiedAndModifiedSchemas(schema);
    if (vm.isSedDocument() || vm.iscEnmSedDocument()) calculatePopulatedManagedConfigs();
    vm.pageTitle = (restoredata) ? 'Restoring' : 'Editing';
  }

  vm.addUserGroup = function () {
    vm.document.usergroups.push('');
  };

  vm.removeUserGroup = function (group) {
    if ($window.confirm('Are you sure you want to delete the association with this group?')) {
      vm.document.usergroups.splice(vm.document.usergroups.indexOf(group), 1);
    }
  };

  vm.disableGroupsButton = function (group, buttonType) {
    if (vm.allUserGroups.length === 0) {
      return true;
    }
    if (vm.document.usergroups) {
      if (vm.allUserGroups.length === 1 && vm.document.usergroups.indexOf(vm.allUserGroups[0].id) !== -1) {
        return true;
      }
    }
    for (var g = 0; g < vm.allUserGroups.length; g += 1) {
      if (vm.allUserGroups[g].id === group || group === '') {
        return false;
      }
    }
    return buttonType.toString() !== 'add';
  };

  vm.groupOptions = function (status) {
    if (status) {
      return allGroupsOptions;
    }
    return vm.allUserGroups;
  };
}
