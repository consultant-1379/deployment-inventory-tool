import ListController from '../controllers/deployments-list.client.controller';
import CreateController from '../controllers/deployments-create.client.controller';
import ViewController from '../controllers/deployments-view.client.controller';
import ListTemplate from '../views/deployments-list.client.view.html';
import CreateTemplate from '../views/deployments-create.client.view.html';
import ViewTemplate from '../views/deployments-view.client.view.html';

routeConfig.$inject = ['$stateProvider'];
export default function routeConfig($stateProvider) {
  $stateProvider
    .state('deployments', {
      abstract: true,
      url: '/deployments',
      template: '<ui-view/>'
    })
    .state('deployments.list', {
      url: '',
      template: ListTemplate,
      controller: ListController,
      controllerAs: 'vm',
      resolve: {
        deployments: getDeployments,
        deploymentsHistory: getDeploymentsHistory
      }
    })
    .state('deployments.create', {
      url: '/create?{restoreData:json}',
      template: CreateTemplate,
      controller: CreateController,
      controllerAs: 'vm',
      resolve: {
        deployment: newDeployment,
        projects: getProjects,
        documents: getDocuments,
        schemas: getSchemas,
        restoredata: getRestoreData,
        creatingFromScratch: function () { return true; },
        allGroups: getGroups,
        allUsers: getAllUsers
      }
    })
    .state('deployments.view', {
      url: '/view/{deploymentId}',
      template: ViewTemplate,
      controller: ViewController,
      controllerAs: 'vm',
      resolve: {
        deployment: getDeployment,
        project: ['deployment', 'ProjectsService', getProject],
        sed: ['deployment', 'DocumentsService', getDocument],
        vnflcmSed: ['deployment', 'DocumentsService', getVnflcmSed],
        vnflcmSchema: ['vnflcmSed', 'DocumentsService', 'SchemasService', getVnflcmSchemaVersion],
        secondcENMSed: ['deployment', 'DocumentsService', getSecondcENMSed],
        secondcENMSEDSchema: ['secondcENMSed', 'DocumentsService', 'SchemasService', getSecondcENMSchemaVersion],
        enmSchema: ['deployment', 'DocumentsService', 'SchemasService', getENMSchemaVersion],
        documents: getDocuments,
        allGroups: getGroups
      }
    })
    .state('deployments.edit', {
      url: '/edit/{deploymentId}?{restoreData:json}',
      template: CreateTemplate,
      controller: CreateController,
      controllerAs: 'vm',
      resolve: {
        deployment: getDeployment,
        projects: getProjects,
        documents: getDocuments,
        schemas: getSchemas,
        restoredata: getRestoreData,
        creatingFromScratch: function () { return false; },
        allGroups: getGroups,
        allUsers: getAllUsers
      }
    });
}

getRestoreData.$inject = ['$stateParams'];
function getRestoreData($stateParams) {
  return $stateParams.restoreData;
}

newDeployment.$inject = ['DeploymentsService'];
function newDeployment(DeploymentsService) {
  return new DeploymentsService();
}

getDeployments.$inject = ['DeploymentsService'];
function getDeployments(DeploymentsService) {
  return DeploymentsService.query({ fields: '_id,name,jira_issues' }).$promise;
}

getDeployment.$inject = ['$stateParams', 'DeploymentsService'];
function getDeployment($stateParams, DeploymentsService) {
  return DeploymentsService.get({
    deploymentId: $stateParams.deploymentId
  }).$promise;
}

getDocuments.$inject = ['DocumentsService'];
function getDocuments(DocumentsService) {
  return DocumentsService.query({ q: 'managedconfig=false', fields: '_id,name,schema_id,content(parameters(ip_version))' }).$promise;
}

function getDocument(deployment, DocumentsService) {
  return DocumentsService.get({ documentId: deployment.enm.sed_id, fields: '_id,name,content(parameters(ip_version)),schema_id' }).$promise;
}

getSchemas.$inject = ['SchemasService'];
function getSchemas(SchemasService) {
  return SchemasService.query({ fields: '_id,name,category' }).$promise;
}

function getENMSchemaVersion(deployment, DocumentsService, SchemasService) {
  return getDocument(deployment, DocumentsService).then(function (enmSed) {
    return SchemasService.get({ schemaId: enmSed.schema_id, fields: '_id,version,category' }).$promise;
  });
}

function getSecondcENMSed(deployment, DocumentsService) {
  if (deployment.documents.length > 0) {
    var cENMSed = deployment.documents.find(document => {
      return (document.schema_category === 'cenm') ? document : '';
    });
    if (cENMSed) {
      return DocumentsService.get({ documentId: cENMSed.document_id, fields: '_id,name,schema_id' }).$promise;
    }
  }
  return '';
}

function getVnflcmSed(deployment, DocumentsService) {
  if (deployment.documents.length > 0) {
    var vnflcmSed = deployment.documents.find(document => {
      return (document.schema_name === 'vnflcm_sed_schema' || document.schema_category === 'vnflcm') ? document : '';
    });
    if (vnflcmSed) {
      return DocumentsService.get({ documentId: vnflcmSed.document_id, fields: '_id,name,content(parameters(ip_version)),schema_id' }).$promise;
    }
  }
  return '';
}

function getVnflcmSchemaVersion(vnflcmSed, DocumentsService, SchemasService) {
  return (vnflcmSed) ? SchemasService.get({ schemaId: vnflcmSed.schema_id, fields: '_id,version' }).$promise : '';
}

function getSecondcENMSchemaVersion(cenmSed, DocumentsService, SchemasService) {
  return (cenmSed) ? SchemasService.get({ schemaId: cenmSed.schema_id, fields: '_id,version' }).$promise : '';
}

getProjects.$inject = ['ProjectsService'];
function getProjects(ProjectsService) {
  return ProjectsService.query({ fields: '_id,name' }).$promise;
}

function getProject(deployment, ProjectsService) {
  return ProjectsService.get({ projectId: deployment.project_id, fields: '_id,name' }).$promise;
}

getGroups.$inject = ['GroupsService'];
function getGroups(GroupsService) {
  return GroupsService.query().$promise;
}

getAllUsers.$inject = ['UsersService'];
function getAllUsers(UsersService) {
  return UsersService.query({ fields: '_id,username,roles' }).$promise;
}

getDeploymentsHistory.$inject = ['deploymentHistoryService'];
async function getDeploymentsHistory(deploymentHistoryService) {
  return deploymentHistoryService.query({ fields: 'associated_id,createdBy,createdAt,updates(updatedAt)' }).$promise;
}
