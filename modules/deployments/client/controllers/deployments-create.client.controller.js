import _ from 'lodash';
import semver from 'semver';
var $ = require('jquery');
require('select2')();

DeploymentsCreateController.$inject = ['$scope', '$http', '$state', '$window', 'deployment',
  'documents', 'projects', 'schemas', 'creatingFromScratch', 'Notification',
  'DocumentsService', 'allGroups', 'Authentication', 'allUsers', 'SchemasService',
  'DeploymentsService', 'ProjectsService', 'restoredata'];

export default function DeploymentsCreateController(
  $scope, $http, $state, $window, deployment,
  documents, projects, schemas, creatingFromScratch, Notification,
  DocumentsService, allGroups, Authentication, allUsers, SchemasService,
  DeploymentsService, ProjectsService, restoredata
) {
  var vm = this;
  vm.deployment = deployment;
  if (restoredata) {
    Object.keys(restoredata).forEach(function (key) {
      vm.deployment[key] = restoredata[key];
    });
  }
  vm.projects = projects;
  vm.formSubmitting = false;
  vm.nameregex = '^[a-zA-Z0-9_]{1,17}$';
  // JIRA Issues Variable
  if (!vm.deployment.jira_issues || vm.deployment.jira_issues.length === 0) {
    vm.deployment.jira_issues = [];
  }
  vm.currentDocumentsList = [];
  vm.sedDocuments = [];
  vm.cENMsedDocuments = [];
  vm.deployment.usergroups = [];
  vm.allUserGroups = [];
  vm.showENMSeds = true;
  var allGroupsOptions = [];
  var currentUser = allUsers.filter(user => user.username === Authentication.user.username)[0];
  var superAdmin = isSuperAdmin(currentUser);
  getAllGroups(allGroups, superAdmin);
  if (!superAdmin) {
    getAllUserGroups(allGroups, currentUser._id);
  }

  getDeploymentGroups(allGroups, vm.deployment._id);
  vm.vnfLcmSedDocuments = [];
  var documentsForSchema = {};

  var uniqueSchemaCategories = new Set();
  schemas.forEach(function (schema) {
    if ((schema.category === 'other' || schema.category === 'cenm') && !schema.name.includes('cenm_site_values')) {
      uniqueSchemaCategories.add(schema.name);
    }
  });
  uniqueSchemaCategories = Array.from(uniqueSchemaCategories).sort();
  uniqueSchemaCategories.forEach(function (name) {
    documentsForSchema[name] = [];
  });
  vm.toggleSEDHandler = function () {
    // Populate
    vm.currentDocumentsList = (vm.showENMSeds) ? vm.sedDocuments : vm.cENMsedDocuments;
    // remove any vnflcm document when toggling to cENM
    if (!vm.showENMSeds) {
      vm.vnfLcmSedRequired = false;
      vm.deployment.documents.forEach(function (document) {
        if (document.schema_name === 'vnflcm_sed_schema' || document.schema_category === 'vnflcm') {
          vm.deployment.documents.splice(vm.deployment.documents.indexOf(document), 1);
        }
      });
    }
    setSelect2('#enm-sed-select', `${(vm.showENMSeds) ? 'v' : 'c'}ENM SED`);
    populateDocumentsForSchema(documentsForSchema, !vm.showENMSeds);
  };
  documents.forEach(function (document) {
    schemas.forEach(function (schema) {
      if (schema._id === document.schema_id) {
        if (schema.category === 'enm') {
          vm.sedDocuments.push(document);
        } else if (schema.category === 'cenm' && schema.name.includes('cenm_site_values')) {
          vm.cENMsedDocuments.push(document);
        } else if (schema.category === 'cenm' && schema.name.includes('cenm_deployment_values')) {
          documentsForSchema[schema.name].push(document);
        } else if (schema.category === 'vnflcm') {
          vm.vnfLcmSedDocuments.push(document);
        } else {
          documentsForSchema[schema.name].push(document);
        }
      }
    });
  });
  async function getEnmSedSchemaId() {
    var sedDocument = await DocumentsService.get({ documentId: vm.deployment.enm.sed_id, fields: 'schema_id' }).$promise;
    return sedDocument.schema_id;
  }

  async function isVnfLcmSedRequired() {
    if (vm.deployment.enm.sed_id) {
      var enmSchemaId = await getEnmSedSchemaId(vm.deployment.enm.sed_id);
      var schema = await SchemasService.get({ schemaId: enmSchemaId }).$promise;
      var schemaVersion = schema.version;
      vm.vnfLcmSedRequired = false;
      if (semver.gt(schemaVersion, '1.39.14')) {
        vm.vnfLcmSedRequired = true;
      }
    }
    $scope.$apply();
  }

  vm.onEnmSedChange = async function () {
    await isVnfLcmSedRequired();
    if (!vm.vnfLcmSedRequired) {
      vm.deployment.documents.forEach(function (document) {
        if (document.schema_name === 'vnflcm_sed_schema' || document.schema_category === 'vnflcm') {
          vm.deployment.documents.splice(vm.deployment.documents.indexOf(document), 1);
        }
      });
    }
    if (vm.vnfLcmSedRequired) await setVnflcmSelect();
  };

  vm.onVnfLcmSedChange = async function () {
    var attachedVnfLcmSed;
    if (vm.vnfLcmSedDocumentId) {
      var vnfLcmSedDocument = await DocumentsService.get({ documentId: vm.vnfLcmSedDocumentId }).$promise;
      var vnfLcmSchema = await SchemasService.get({ schemaId: vnfLcmSedDocument.schema_id }).$promise;
      attachedVnfLcmSed = await vm.deployment.documents.filter(document => (document.schema_name === 'vnflcm_sed_schema' || document.schema_category === 'vnflcm'));
      if (attachedVnfLcmSed.length === 0) {
        vm.deployment.documents.push({ schema_name: vnfLcmSchema.name, schema_category: 'vnflcm', document_id: vm.vnfLcmSedDocumentId });
      } else {
        attachedVnfLcmSed[0].document_id = vm.vnfLcmSedDocumentId;
      }
    } else {
      attachedVnfLcmSed = await vm.deployment.documents.filter(document => (document.schema_name === 'vnflcm_sed_schema' || document.schema_category === 'vnflcm'));
      if (attachedVnfLcmSed.length !== 0) vm.deployment.documents.splice(vm.deployment.documents.indexOf(attachedVnfLcmSed[0]), 1);
    }
  };

  vm.documentsForSchema = {};

  function populateDocumentsForSchema(documentsForSchema, cENM) {
    vm.documentsForSchema = {};
    Object.entries(documentsForSchema).forEach(function ([key, value]) {
      if (!key.startsWith('cenm_')) vm.documentsForSchema[key] = value;
      if (cENM && key.startsWith('cenm_')) vm.documentsForSchema[key] = value;
    });
  }


  if (creatingFromScratch && !restoredata) {
    vm.pageTitle = 'Creating deployment';
    vm.deployment.enm = {};
    vm.deployment.documents = [];
  } else {
    vm.pageTitle = (restoredata) ? 'Restoring deployment' : 'Editing deployment';
    isVnfLcmSedRequired();
    vm.deployment.documents.forEach(function (document) {
      if (document.schema_name === 'vnflcm_sed_schema' || document.schema_category === 'vnflcm') {
        vm.vnfLcmSedDocumentId = document.document_id;
        return vm.vnfLcmSedDocumentId;
      }
    });
    // If Editing cENM Deployment
    var currentSed = documents.filter(doc => doc._id === vm.deployment.enm.sed_id);
    var currentSedSchema = schemas.filter(schema => schema._id === currentSed[0].schema_id);
    vm.showENMSeds = !((currentSedSchema.length === 1) && (currentSedSchema[0].category === 'cenm'));
  }
  populateDocumentsForSchema(documentsForSchema, vm.showENMSeds);

  function setSelect2(selectId, placeholderName) {
    $(selectId).select2({
      placeholder: `--Select ${placeholderName}--`,
      allowClear: true
    });
  }

  $(async function () { // On Document Load
    // Populate Document List
    vm.toggleSEDHandler();
    setSelect2('#project-select', 'Project');
    $('#project-select').on('select2:select select2:unselecting', async function () {
      if ($(this).val() === null || $(this).val() === '') {
        $(this).data('unselecting', true);
        vm.deployment.project_id = undefined;
      } else {
        vm.deployment.project_id = $(this).val().replace('string:', '');
      }
      _.defer(() => $scope.$apply());
    });
    setSelect2('#enm-sed-select', `${(vm.showENMSeds) ? 'v' : 'c'}ENM SED`);
    $('#enm-sed-select').on('select2:select select2:unselecting', async function () {
      if ($(this).val() === null || $(this).val() === '') {
        $(this).data('unselecting', true);
        vm.deployment.enm.sed_id = undefined;
      } else {
        vm.deployment.enm.sed_id = $(this).val().replace('string:', '');
      }
      if (vm.showENMSeds) await vm.onEnmSedChange();
      _.defer(() => $scope.$apply());
    });
    if (vm.deployment.enm.sed_id && vm.showENMSeds && creatingFromScratch) $('#enm-sed-select').trigger('select2:select');
    if (vm.deployment.documents) {
      vm.deployment.documents.forEach(function (documentItem, index) {
        if (vm.checkDocument(documentItem)) setOtherDocumentSelect(index);
      });
    }

    $('#add-document').on('click', function () {
      vm.deployment.documents.forEach(function (documentItem, index) {
        if (vm.checkDocument(documentItem)) setOtherDocumentSelect(index);
      });
    });
  });

  async function setVnflcmSelect() {
    setSelect2('#vnfLcm-sed-select', 'VNF LCM SED');
    $('#vnfLcm-sed-select').on('select2:select select2:unselecting', async function () {
      if ($(this).val() === null || $(this).val() === '') {
        $(this).data('unselecting', true);
        vm.vnfLcmSedDocumentId = undefined;
      } else {
        vm.vnfLcmSedDocumentId = $(this).val().replace('string:', '');
      }
      await vm.onVnfLcmSedChange();
      _.defer(() => $scope.$apply());
    });
    _.defer(() => $scope.$apply());
  }

  async function setOtherDocumentSelect(documentIndex) {
    var schemaSelectId = `#documents${documentIndex}-schema`;
    setSelect2(schemaSelectId, 'Schema Name');
    $(schemaSelectId).on('select2:select select2:unselecting', async function () {
      if ($(this).val() === null || $(this).val() === '') {
        $(this).data('unselecting', true);
        vm.deployment.documents[documentIndex].schema_name = undefined;
      } else {
        vm.deployment.documents[documentIndex].schema_name = $(this).val().replace('string:', '');
      }
      _.defer(() => $scope.$apply());
    });
    var documentSelectId = `#documents${documentIndex}-document`;
    setSelect2(documentSelectId, 'Document');
    $(documentSelectId).on('select2:select select2:unselecting', async function () {
      if ($(this).val() === null || $(this).val() === '') {
        $(this).data('unselecting', true);
        vm.deployment.documents[documentIndex].document_id = undefined;
      } else {
        vm.deployment.documents[documentIndex].document_id = $(this).val().replace('string:', '');
      }
      _.defer(() => $scope.$apply());
    });
    _.defer(() => $scope.$apply());
  }

  vm.submitForm = async function () {
    var deploymentStatus = (creatingFromScratch ? 'creation' : 'update');
    try {
      vm.formSubmitting = true;
      await vm.deployment.createOrUpdate();
    } catch (err) {
      vm.formSubmitting = false;
      Notification.error({ message: err.data.message.replace(/\n/g, '<br/>'), title: `<i class="glyphicon glyphicon-remove"></i> Deployment ${deploymentStatus} error!` });
      return;
    }
    $state.go('deployments.view', { deploymentId: vm.deployment._id });
    Notification.success({ message: `<i class="glyphicon glyphicon-ok"></i> Deployment ${deploymentStatus} successful!` });
  };

  if (restoredata) vm.submitForm();

  vm.addDocument = function () {
    vm.deployment.documents.push({});
    if (!vm.showENMSeds) vm.deployment.documents[0].schema_category = 'cenm';
  };

  vm.removeDocument = function (document) {
    if ($window.confirm('Are you sure you want to delete this document?')) {
      vm.deployment.documents.splice(vm.deployment.documents.indexOf(document), 1);
    }
  };

  function isSuperAdmin(currentUser) {
    return currentUser.roles.indexOf('superAdmin') !== -1;
  }

  async function getAllGroups(allGroups, superAdmin) {
    allGroupsOptions = await allGroups.map(group => { return { id: group._id, name: group.name }; });
    if (superAdmin) vm.allUserGroups = allGroupsOptions;
  }

  async function getAllUserGroups(allGroups, currentUserId) {
    var foundGroups = await allGroups.filter(group => isUserPresentInGroup(group, currentUserId));
    vm.allUserGroups = await foundGroups.map(group => { return { id: group._id, name: group.name }; });
  }

  function isUserPresentInGroup(group, currentUserId) {
    return (group.admin_IDs.indexOf(currentUserId) !== -1 || group.users.indexOf(currentUserId) !== -1);
  }

  async function getDeploymentGroups(allGroups, deploymentId) {
    var deploymentGroups = await allGroups.filter(group => isDeploymentPresentInGroup(group, deploymentId));
    vm.deployment.usergroups = await deploymentGroups.map(group => { return group._id; });
    if (vm.allUserGroups.length === 1 && vm.deployment.usergroups.length === 0) {
      vm.deployment.usergroups.push(vm.allUserGroups[0].id);
    }
  }

  function isDeploymentPresentInGroup(group, deploymentId) {
    return group.associatedDeployments.indexOf(deploymentId) !== -1;
  }

  vm.addUserGroup = function () {
    vm.deployment.usergroups.push('');
  };

  vm.removeUserGroup = function (group) {
    if ($window.confirm('Are you sure you want to delete the association with this group?')) {
      vm.deployment.usergroups.splice(vm.deployment.usergroups.indexOf(group), 1);
    }
  };

  vm.disableGroupsButton = function (group, buttonType) {
    if (vm.allUserGroups.length === 0) return true;
    if (vm.deployment.usergroups) {
      if (vm.allUserGroups.length === 1 && vm.deployment.usergroups.indexOf(vm.allUserGroups[0].id) !== -1) return true;
    }
    for (var g = 0; g < vm.allUserGroups.length; g += 1) {
      if (vm.allUserGroups[g].id === group || group === '') return false;
    }
    return buttonType.toString() !== 'add';
  };

  vm.groupOptions = function (status) {
    return (status) ? allGroupsOptions : vm.allUserGroups;
  };

  vm.checkDocument = function (deploymentDocument) {
    return !(deploymentDocument.schema_name === 'vnflcm_sed_schema' || deploymentDocument.schema_category === 'vnflcm');
  };

  vm.addJiraIssue = function () {
    vm.deployment.jira_issues.push('');
  };

  vm.removeJiraIssue = function (jiraIssueIndex) {
    var jiraIssue = vm.deployment.jira_issues[jiraIssueIndex];
    if ($window.confirm(`Are you sure you want to remove this JIRA Issue ${jiraIssueIndex + 1}: "${jiraIssue}"?`)) {
      vm.deployment.jira_issues.splice(jiraIssueIndex, 1);
    }
  };

  vm.jiraIssueValidation = function ($index) {
    vm.deployment.jira_issues = vm.deployment.jira_issues.map(jira => jira.toUpperCase());
    var jiraIssue = vm.deployment.jira_issues[$index];
    $http({
      method: 'GET',
      url: `/api/jiraIssueValidation/${jiraIssue}`
    }).then(function successCallback(response) {
      if (response.data.valid === true) {
        Notification.success({ message: `<i class="glyphicon glyphicon-ok"></i> JIRA Issue: ${jiraIssue} is valid` });
        $scope.form[`jira_issues[${$index}]`].$setValidity('jiraValidation', true);
      } else if (response.data.valid === false) {
        Notification.error({
          message: response.data.errorMessages.join(', '),
          title: `<i class="glyphicon glyphicon-remove"></i> JIRA Issue: ${jiraIssue} is invalid`
        });
        if (response.data.errorMessages.includes('Issue Does Not Exist')) {
          $scope.form[`jira_issues[${$index}]`].$setValidity('jiraValidation', false);
        }
      } else {
        Notification.error({
          message: JSON.stringify(response.data.errorMessage),
          title: `<i class="glyphicon glyphicon-remove"></i> An error occurred while checking the JIRA Issue: ${jiraIssue}`
        });
      }
    }, function errorCallback(response) {
      Notification.error({
        message: JSON.stringify(response),
        title: `<i class="glyphicon glyphicon-remove"></i> An error occurred while checking the JIRA Issue: ${jiraIssue}`
      });
    });

    // Checking for duplicates
    var notDuplicateJira = (vm.deployment.jira_issues.filter((issue) => (issue === jiraIssue)).length === 1);
    $scope.form[`jira_issues[${$index}]`].$setValidity('jiraDuplicate', notDuplicateJira);
    _.defer(function () { $scope.$apply(); });
  };
}
