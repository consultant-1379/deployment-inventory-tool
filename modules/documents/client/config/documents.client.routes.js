import _ from 'lodash';
import ListController from '../controllers/documents-list.client.controller';
import CreateController from '../controllers/documents-create.client.controller';
import ViewController from '../controllers/documents-view.client.controller';
import ListTemplate from '../views/documents-list.client.view.html';
import CreateTemplate from '../views/documents-create.client.view.html';
import ViewTemplate from '../views/documents-view.client.view.html';

routeConfig.$inject = ['$stateProvider'];

export default function routeConfig($stateProvider) {
  var urlParameters = '?documentName?schemaName?managedConfigName?useexternalnfs?ipv6?dns?vio?vioTransportOnly?vioMultiTech?overcommit?autopopulate';
  $stateProvider
    .state('documents', {
      abstract: true,
      url: '/documents',
      template: '<ui-view/>'
    })
    .state('documents.listSeds', {
      url: '/list/enm_sed',
      template: ListTemplate,
      controller: ListController,
      controllerAs: 'vm',
      resolve: {
        documents: getSeds,
        schemas: getSchemas,
        documentsHistory: getDocumentsHistory,
        showDocumentsFromAllSchemaVersions: function () { return true; },
        title: function () { return 'vENM SEDs'; }
      }
    })
    .state('documents.listcENMSeds', {
      url: '/list/cenm_sed',
      template: ListTemplate,
      controller: ListController,
      controllerAs: 'vm',
      resolve: {
        documents: getcENMSeds,
        schemas: getSchemas,
        documentsHistory: getDocumentsHistory,
        showDocumentsFromAllSchemaVersions: function () { return true; },
        title: function () { return 'cENM SEDs'; }
      }
    })
    .state('documents.listVnfLcmSeds', {
      url: '/list/vnflcm_sed',
      template: ListTemplate,
      controller: ListController,
      controllerAs: 'vm',
      resolve: {
        documents: getVnfLcmSeds,
        schemas: getSchemas,
        documentsHistory: getDocumentsHistory,
        showDocumentsFromAllSchemaVersions: function () { return true; },
        title: function () { return 'VNF LCM SEDs'; }
      }
    })
    .state('documents.listManagedConfigs', {
      url: '/list/managedconfigs',
      template: ListTemplate,
      controller: ListController,
      controllerAs: 'vm',
      resolve: {
        documents: getManagedConfigs,
        schemas: getSchemas,
        documentsHistory: getManagedConfigsHistory,
        showDocumentsFromAllSchemaVersions: function () { return false; },
        title: function () { return 'Managed Configs'; }
      }
    })
    .state('documents.listOther', {
      url: '/list/other',
      template: ListTemplate,
      controller: ListController,
      controllerAs: 'vm',
      resolve: {
        documents: getOtherDocuments,
        schemas: getSchemas,
        documentsHistory: getDocumentsHistory,
        showDocumentsFromAllSchemaVersions: function () { return true; },
        title: function () { return 'Other Documents'; }
      }
    })
    .state('documents.createEnmSed', {
      url: `/create/enm_sed?{restoreData:json}${urlParameters}`,
      template: CreateTemplate,
      controller: CreateController,
      controllerAs: 'vm',
      resolve: {
        document: newDocument,
        schema: function () { return null; },
        schemaCategory: function () { return 'enm'; },
        schemas: ['schema', 'schemaCategory', 'SchemasService', getSchemasOfCategory],
        allLabels: getAllLabels,
        allGroups: getGroups,
        allUsers: getAllUsers,
        restoredata: getRestoreData,
        project: function () { return null; },
        pod: function () { return null; },
        deployment: function () { return null; },
        supportedManagedConfigs: function () { return []; },
        creatingFromScratch: function () { return true; },
        managedConfigMode: function () { return false; }
      }
    })
    .state('documents.createcEnmSed', {
      url: `/create/cenm_sed?{restoreData:json}${urlParameters}`,
      template: CreateTemplate,
      controller: CreateController,
      controllerAs: 'vm',
      resolve: {
        document: newDocument,
        schema: function () { return null; },
        schemaCategory: function () { return 'cenm'; },
        schemas: ['schema', 'schemaCategory', 'SchemasService', getSchemasOfCategory],
        allLabels: getAllLabels,
        allGroups: getGroups,
        allUsers: getAllUsers,
        restoredata: getRestoreData,
        project: function () { return null; },
        pod: function () { return null; },
        deployment: function () { return null; },
        supportedManagedConfigs: function () { return []; },
        creatingFromScratch: function () { return true; },
        managedConfigMode: function () { return false; }
      }
    })
    .state('documents.createVnfLcmSed', {
      url: `/create/vnf_lcm_sed?{restoreData:json}${urlParameters}`,
      template: CreateTemplate,
      controller: CreateController,
      controllerAs: 'vm',
      resolve: {
        document: newDocument,
        schema: function () { return null; },
        schemaCategory: function () { return 'vnflcm'; },
        schemas: ['schema', 'schemaCategory', 'SchemasService', getSchemasOfCategory],
        allLabels: getAllLabels,
        allGroups: getGroups,
        allUsers: getAllUsers,
        restoredata: getRestoreData,
        project: function () { return null; },
        pod: function () { return null; },
        deployment: function () { return null; },
        supportedManagedConfigs: function () { return []; },
        creatingFromScratch: function () { return true; },
        managedConfigMode: function () { return false; }
      }
    })
    .state('documents.createOther', {
      url: '/create/other?{restoreData:json}',
      template: CreateTemplate,
      controller: CreateController,
      controllerAs: 'vm',
      resolve: {
        document: newDocument,
        schema: function () { return null; },
        schemaCategory: function () { return 'other'; },
        schemas: ['schema', 'schemaCategory', 'SchemasService', getSchemasOfCategory],
        allLabels: getAllLabels,
        allGroups: getGroups,
        allUsers: getAllUsers,
        restoredata: getRestoreData,
        project: function () { return null; },
        pod: function () { return null; },
        deployment: function () { return null; },
        supportedManagedConfigs: function () { return []; },
        creatingFromScratch: function () { return true; },
        managedConfigMode: function () { return false; }
      }
    })
    .state('documents.createManagedConfig', {
      url: '/create/managed_config?{restoreData:json}',
      template: CreateTemplate,
      controller: CreateController,
      controllerAs: 'vm',
      resolve: {
        document: newDocument,
        schema: function () { return null; },
        schemas: getSchemas,
        allLabels: getAllLabels,
        restoredata: getRestoreData,
        project: function () { return null; },
        pod: function () { return null; },
        deployment: function () { return null; },
        supportedManagedConfigs: function () { return []; },
        creatingFromScratch: function () { return true; },
        managedConfigMode: function () { return true; },
        allGroups: getGroups,
        allUsers: getAllUsers,
        schemaCategory: function () { return null; }
      }
    })
    .state('documents.editEnmSed', {
      url: `/edit/enm_sed/{documentId}?{restoreData:json}${urlParameters}`,
      template: CreateTemplate,
      controller: CreateController,
      controllerAs: 'vm',
      resolve: {
        document: getDocument,
        schema: ['document', 'SchemasService', getSchema],
        schemaCategory: function () { return 'enm'; },
        schemas: ['schema', 'schemaCategory', 'SchemasService', getSchemasOfCategory],
        allLabels: getAllLabels,
        restoredata: getRestoreData,
        project: ['deployment', 'ProjectsService', getProject],
        pod: ['project', 'PodsService', getPod],
        deployment: ['schema', 'DeploymentsService', 'document', getDeployment],
        supportedManagedConfigs: ['document', 'DocumentsService', getSupportedManagedConfigs],
        creatingFromScratch: function () { return false; },
        managedConfigMode: function () { return null; },
        allGroups: getGroups,
        allUsers: getAllUsers
      }
    })
    .state('documents.editcEnmSed', {
      url: `/edit/cenm_sed/{documentId}?{restoreData:json}${urlParameters}`,
      template: CreateTemplate,
      controller: CreateController,
      controllerAs: 'vm',
      resolve: {
        document: getDocument,
        schema: ['document', 'SchemasService', getSchema],
        schemaCategory: function () { return 'cenm'; },
        schemas: ['schema', 'schemaCategory', 'SchemasService', getSchemasOfCategory],
        allLabels: getAllLabels,
        restoredata: getRestoreData,
        project: ['deployment', 'ProjectsService', getProject],
        pod: ['project', 'PodsService', getPod],
        deployment: ['schema', 'DeploymentsService', 'document', getDeployment],
        supportedManagedConfigs: ['document', 'DocumentsService', getSupportedManagedConfigs],
        creatingFromScratch: function () { return false; },
        managedConfigMode: function () { return null; },
        allGroups: getGroups,
        allUsers: getAllUsers
      }
    })
    .state('documents.editVnfLcmSed', {
      url: `/edit/vnf_lcm_sed/{documentId}?{restoreData:json}${urlParameters}`,
      template: CreateTemplate,
      controller: CreateController,
      controllerAs: 'vm',
      resolve: {
        document: getDocument,
        schema: ['document', 'SchemasService', getSchema],
        schemaCategory: function () { return 'vnflcm'; },
        schemas: ['schema', 'schemaCategory', 'SchemasService', getSchemasOfCategory],
        allLabels: getAllLabels,
        restoredata: getRestoreData,
        project: ['deployment', 'ProjectsService', getProject],
        pod: ['project', 'PodsService', getPod],
        deployment: ['schema', 'DeploymentsService', 'document', getDeployment],
        supportedManagedConfigs: ['document', 'DocumentsService', getSupportedManagedConfigs],
        creatingFromScratch: function () { return false; },
        managedConfigMode: function () { return null; },
        allGroups: getGroups,
        allUsers: getAllUsers
      }
    })
    .state('documents.editOther', {
      url: `/edit/other/{documentId}?{restoreData:json}${urlParameters}`,
      template: CreateTemplate,
      controller: CreateController,
      controllerAs: 'vm',
      resolve: {
        document: getDocument,
        schema: ['document', 'SchemasService', getSchema],
        schemaCategory: function () { return 'other'; },
        schemas: ['schema', 'schemaCategory', 'SchemasService', getSchemasOfCategory],
        allLabels: getAllLabels,
        restoredata: getRestoreData,
        project: ['deployment', 'ProjectsService', getProject],
        pod: ['project', 'PodsService', getPod],
        deployment: ['schema', 'DeploymentsService', 'document', getDeployment],
        supportedManagedConfigs: ['document', 'DocumentsService', getSupportedManagedConfigs],
        creatingFromScratch: function () { return false; },
        managedConfigMode: function () { return null; },
        allGroups: getGroups,
        allUsers: getAllUsers
      }
    })
    .state('documents.editManagedConfig', {
      url: `/edit/managed_config/{documentId}?{restoreData:json}${urlParameters}`,
      template: CreateTemplate,
      controller: CreateController,
      controllerAs: 'vm',
      resolve: {
        document: getDocument,
        schema: ['document', 'SchemasService', getSchema],
        schemaCategory: function () { return null; },
        schemas: ['schema', 'schemaCategory', 'SchemasService', getSchemasOfCategory],
        allLabels: getAllLabels,
        restoredata: getRestoreData,
        project: ['deployment', 'ProjectsService', getProject],
        pod: ['project', 'PodsService', getPod],
        deployment: ['schema', 'DeploymentsService', 'document', getDeployment],
        supportedManagedConfigs: ['document', 'DocumentsService', getSupportedManagedConfigs],
        creatingFromScratch: function () { return false; },
        managedConfigMode: function () { return true; },
        allGroups: getGroups,
        allUsers: getAllUsers
      }
    })
    .state('documents.view', {
      url: '/view/{documentId}',
      template: ViewTemplate,
      controller: ViewController,
      controllerAs: 'vm',
      resolve: {
        document: getDocument,
        schema: ['document', 'SchemasService', getSchema],
        allLabels: getAllLabels,
        deployment: ['schema', 'DeploymentsService', 'document', getDeployment],
        dependentDocuments: ['document', 'DocumentsService', getDependentDocuments],
        supportedManagedConfigs: ['document', 'DocumentsService', getSupportedManagedConfigsJustIDsNamesAndLabels],
        allGroups: getGroups
      }
    });
}

getRestoreData.$inject = ['$stateParams'];
function getRestoreData($stateParams) {
  return $stateParams.restoreData;
}

getDocumentsHistory.$inject = ['documentHistoryService'];
async function getDocumentsHistory(documentHistoryService) {
  return documentHistoryService.query({ q: 'originalData.managedconfig=false', fields: 'associated_id,createdBy,managedconfig' }).$promise;
}

getManagedConfigsHistory.$inject = ['documentHistoryService'];
async function getManagedConfigsHistory(documentHistoryService) {
  return documentHistoryService.query({ q: 'originalData.managedconfig=true', fields: 'associated_id,createdBy,managedconfig' }).$promise;
}

getDocument.$inject = ['$stateParams', 'DocumentsService', 'SchemasService'];
async function getDocument($stateParams, DocumentsService, SchemasService) {
  var document = await DocumentsService.get({
    documentId: $stateParams.documentId
  }).$promise;
  var schema = await SchemasService.get({
    schemaId: document.schema_id
  }).$promise;
  if (schema.content.properties.parameters) {
    document.content.parameters = await sortObjectKeys(document.content.parameters, schema);
  }
  return document;
}

getSeds.$inject = ['SchemasService', 'DocumentsService'];
async function getSeds(SchemasService, DocumentsService) {
  var enmSedSchemas = await SchemasService.query({ q: 'category=enm', fields: '_id' }).$promise;
  if (enmSedSchemas.length === 0) return [];

  var allDocs = await DocumentsService.query({ q: 'managedconfig=false', fields: '_id,name,schema_id,created_at,updated_at,content(parameters(ip_version))' }).$promise;
  return allDocs.filter(isDocSchemaIdInArray(enmSedSchemas));
}

getcENMSeds.$inject = ['SchemasService', 'DocumentsService'];
async function getcENMSeds(SchemasService, DocumentsService) {
  var cEnmSedSchemas = await SchemasService.query({ q: 'category=cenm', fields: '_id' }).$promise;
  if (cEnmSedSchemas.length === 0) return [];

  var allDocs = await DocumentsService.query({ q: 'managedconfig=false', fields: '_id,name,schema_id,created_at,updated_at,content(parameters(ip_version))' }).$promise;
  return allDocs.filter(isDocSchemaIdInArray(cEnmSedSchemas));
}


getVnfLcmSeds.$inject = ['SchemasService', 'DocumentsService'];
async function getVnfLcmSeds(SchemasService, DocumentsService) {
  var vnfLcmSedSchemas = await SchemasService.query({ q: 'category=vnflcm', fields: '_id' }).$promise;
  if (vnfLcmSedSchemas.length === 0) return [];
  var allDocs = await DocumentsService.query({ q: 'managedconfig=false', fields: '_id,name,schema_id,created_at,updated_at,content(parameters(ip_version))' }).$promise;
  return allDocs.filter(isDocSchemaIdInArray(vnfLcmSedSchemas));
}

getOtherDocuments.$inject = ['SchemasService', 'DocumentsService'];
async function getOtherDocuments(SchemasService, DocumentsService) {
  var otherDocs = await DocumentsService.query({ q: 'managedconfig=false', fields: '_id,name,schema_id,created_at,updated_at,content(parameters(ip_version))' }).$promise;
  var otherSchemas = await SchemasService.query({ q: 'category=other', fields: '_id' }).$promise;
  return otherDocs.filter(isDocSchemaIdInArray(otherSchemas));
}

async function sortObjectKeys(obj, schema) {
  var sortedObj = {};
  if (!obj) return sortedObj;
  var schemaKeys = Object.keys(schema.content.properties.parameters.properties);
  schemaKeys.forEach(function (key) {
    sortedObj[key] = obj[key];
  });
  return sortedObj;
}

function isDocSchemaIdInArray(schemas) {
  return function (doc) {
    for (var schemaIndex in schemas) {
      if ((doc.schema_id && schemas[schemaIndex]._id) && (doc.schema_id.toString() === schemas[schemaIndex]._id.toString())) return true;
    }
    return false;
  };
}

getManagedConfigs.$inject = ['DocumentsService'];
function getManagedConfigs(DocumentsService) {
  return DocumentsService.query({ q: 'managedconfig=true', fields: '_id,name,schema_id,managedconfig,created_at,updated_at' }).$promise;
}

newDocument.$inject = ['DocumentsService'];
function newDocument(DocumentsService) {
  return new DocumentsService();
}

function getSchemasOfCategory(schema, category, SchemasService) {
  return SchemasService.query({ q: `category=${(schema) ? schema.category : category}`, fields: '_id,name,version,category' }).$promise;
}

getSchemas.$inject = ['SchemasService'];
function getSchemas(SchemasService) {
  return SchemasService.query({ fields: '_id,name,version,category' }).$promise;
}

function getSchema(document, SchemasService) {
  return SchemasService.get({ schemaId: document.schema_id }).$promise;
}

function getDependentDocuments(document, DocumentsService) {
  if (document.managedconfig) return DocumentsService.query({ q: `managedconfigs=${document._id}`, fields: '_id,name' }).$promise;
  return [];
}

getAllLabels.$inject = ['LabelsService'];
function getAllLabels(LabelsService) {
  return LabelsService.query().$promise;
}

getGroups.$inject = ['GroupsService'];
function getGroups(GroupsService) {
  return GroupsService.query().$promise;
}

getAllUsers.$inject = ['UsersService'];
function getAllUsers(UsersService) {
  return UsersService.query({ fields: '_id,username,roles' }).$promise;
}

function getSupportedManagedConfigs(document, DocumentsService) {
  if (!document.managedconfig) {
    return DocumentsService.query({ q: `schema_id=${document.schema_id}&managedconfig=true`, fields: '_id,name,labels,content' }).$promise;
  }
  return [];
}

function getSupportedManagedConfigsJustIDsNamesAndLabels(document, DocumentsService) {
  if (!document.managedconfig) {
    return DocumentsService.query({ q: `schema_id=${document.schema_id}&managedconfig=true`, fields: '_id,name,labels' }).$promise;
  }
  return [];
}

function getProject(deployment, ProjectsService) {
  if (deployment && deployment.project_id) {
    return ProjectsService.get({
      projectId: deployment.project_id
    }).$promise;
  }
  return null;
}

function getPod(project, PodsService) {
  if (project && project.pod_id) {
    return PodsService.get({
      podId: project.pod_id
    }).$promise;
  }
  return null;
}

async function getDeployment(schema, DeploymentsService, document) {
  var searchKey = (schema.category === 'cenm' || schema.category === 'enm') ? 'enm.sed_id' : 'documents.document_id';
  var dependentDeployments = await DeploymentsService.query({ q: `${searchKey}=${document._id}` }).$promise;
  if (dependentDeployments && dependentDeployments.length) return dependentDeployments[0];
  return null;
}
