import ListController from '../controllers/history-list.client.controller';
import ListTemplate from '../views/history-list.client.view.html';

import ViewTemplate from '../views/history-view.client.view.html';
import ViewController from '../controllers/history-view.client.controller';
var $stateParamsGlobal;
var historyserviceGlobal;

routeConfig.$inject = ['$stateProvider'];
export default function routeConfig($stateProvider) {
  $stateProvider
    .state('logs', {
      abstract: true,
      url: '/logs',
      template: '<ui-view/>'
    })

    .state('logs.list', {
      url: '/{objType}',
      template: ListTemplate,
      controller: ListController,
      controllerAs: 'vm',
      resolve: {
        logs: getObjectLogs,
        schemas: getSchemas
      }
    })

    .state('logs.view', {
      url: '/{objType}/view/{objId}',
      template: ViewTemplate,
      controller: ViewController,
      controllerAs: 'vm',
      resolve: {
        log: getObjectLogWrapper,
        schemas: getSchemas,
        documents: getDocuments,
        projects: getProjects,
        pods: getPods
      }
    });
}

var fieldsObj = { fields: 'associated_id,originalData(name,schema_id,version,managedconfig),createdAt,createdBy,deletedAt,deletedBy,updates/(updatedAt,updatedBy,updateData(name))' };

getObjectLogs.$inject = ['$stateParams', 'deploymentHistoryService', 'documentHistoryService',
  'groupHistoryService', 'labelHistoryService', 'podHistoryService', 'projectHistoryService', 'schemaHistoryService'];
function getObjectLogs($stateParams, deploymentHistoryService, documentHistoryService, groupHistoryService, labelHistoryService, podHistoryService, projectHistoryService, schemaHistoryService) { // eslint-disable-line max-len
  switch ($stateParams.objType) {
    case 'deployments': return deploymentHistoryService.query(fieldsObj).$promise;
    case 'documents': return documentHistoryService.query(fieldsObj).$promise;
    case 'groups': return groupHistoryService.query(fieldsObj).$promise;
    case 'labels': return labelHistoryService.query(fieldsObj).$promise;
    case 'pods': return podHistoryService.query(fieldsObj).$promise;
    case 'projects': return projectHistoryService.query(fieldsObj).$promise;
    case 'schemas': return schemaHistoryService.query(fieldsObj).$promise;
    default: // do nothing
  }
}

function getObjectLog($stateParams, objectHistoryService) {
  return objectHistoryService.get({ objId: $stateParams.objId }).$promise;
}

function getObjectLogWithDIT($stateParams, objectHistoryService) {
  return objectHistoryService.aggregate([
    {
      $match: {
        associated_id: $stateParams.objId
      }
    },
    {
      $project: {
        _id: 1,
        associated_id: 1,
        originalData: 1,
        createdAt: 1,
        createdBy: 1,
        currentName: 1,
        __v: 1,
        emails: 1,
        updates: {
          $filter: {
            input: '$updates',
            as: 'update',
            cond: {
              $ne: [
                '$$update.updatedBy.username',
                'osdeployer'
              ]
            }
          }
        },
        deletedAt: 1,
        deletedBy: 1
      }
    }
  ]).$promise;
}

getObjectLogWrapper.$inject = ['$stateParams', 'deploymentHistoryService', 'documentHistoryService',
  'groupHistoryService', 'labelHistoryService', 'podHistoryService', 'projectHistoryService', 'schemaHistoryService'];
export async function getObjectLogWrapper($stateParams, deploymentHistoryService, documentHistoryService, groupHistoryService, labelHistoryService, podHistoryService, projectHistoryService, schemaHistoryService, showDITAdminLogs = false) { // eslint-disable-line max-len
  var objectHistoryService;
  if ($stateParams !== undefined) $stateParamsGlobal = $stateParams;
  switch ($stateParamsGlobal.objType) {
    case 'deployments': objectHistoryService = deploymentHistoryService; break;
    case 'documents': objectHistoryService = documentHistoryService; break;
    case 'groups': objectHistoryService = groupHistoryService; break;
    case 'labels': objectHistoryService = labelHistoryService; break;
    case 'pods': objectHistoryService = podHistoryService; break;
    case 'projects': objectHistoryService = projectHistoryService; break;
    case 'schemas': objectHistoryService = schemaHistoryService; break;
    default: // do nothing
  }

  if (objectHistoryService !== undefined) historyserviceGlobal = objectHistoryService;
  return showDITAdminLogs
    ? getObjectLog($stateParamsGlobal, historyserviceGlobal)
    : getObjectLogWithDIT($stateParamsGlobal, historyserviceGlobal);
}

getSchemas.$inject = ['$stateParams', 'SchemasService'];
function getSchemas($stateParams, SchemasService) {
  return SchemasService.query({ fields: '_id,name,version,category' }).$promise;
}

getPods.$inject = ['PodsService'];
function getPods(podsService) {
  return podsService.query({ fields: '_id,name' }).$promise;
}

getProjects.$inject = ['ProjectsService'];
function getProjects(projectsService) {
  return projectsService.query({ fields: '_id,name' }).$promise;
}

getDocuments.$inject = ['DocumentsService'];
function getDocuments(documentsService) {
  return documentsService.query({ fields: '_id,name' }).$promise;
}
