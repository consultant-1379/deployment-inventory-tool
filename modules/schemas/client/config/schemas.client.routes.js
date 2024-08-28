import ListController from '../controllers/schemas-list.client.controller';
import CreateController from '../controllers/schemas-create.client.controller';
import ViewController from '../controllers/schemas-view.client.controller';
import ListTemplate from '../views/schemas-list.client.view.html';
import CreateTemplate from '../views/schemas-create.client.view.html';
import ViewTemplate from '../views/schemas-view.client.view.html';

routeConfig.$inject = ['$stateProvider'];
export default function routeConfig($stateProvider) {
  $stateProvider
    .state('schemas', {
      abstract: true,
      url: '/schemas',
      template: '<ui-view/>'
    })
    .state('schemas.list', {
      url: '',
      template: ListTemplate,
      controller: ListController,
      controllerAs: 'vm',
      resolve: {
        schemas: getSchemas
      }
    })
    .state('schemas.create', {
      url: '/create?{restoreData:json}',
      template: CreateTemplate,
      controller: CreateController,
      controllerAs: 'vm',
      resolve: {
        schema: newSchema,
        restoredata: getRestoreData
      }
    })
    .state('schemas.view', {
      url: '/view/{schemaId}',
      template: ViewTemplate,
      controller: ViewController,
      controllerAs: 'vm',
      resolve: {
        schema: getSchema,
        dependentDocuments: getDependentDocuments
      }
    });
}

getRestoreData.$inject = ['$stateParams'];
function getRestoreData($stateParams) {
  return $stateParams.restoreData;
}

getSchema.$inject = ['$stateParams', 'SchemasService'];
function getSchema($stateParams, SchemasService) {
  return SchemasService.get({
    schemaId: $stateParams.schemaId
  }).$promise;
}

getSchemas.$inject = ['SchemasService'];
function getSchemas(SchemasService) {
  return SchemasService.query({ fields: '_id,name,version,category,created_at' }).$promise;
}

newSchema.$inject = ['SchemasService'];
function newSchema(SchemasService) {
  return new SchemasService();
}

getDependentDocuments.$inject = ['$stateParams', 'DocumentsService'];
function getDependentDocuments($stateParams, DocumentsService) {
  return DocumentsService.query({ q: `schema_id=${$stateParams.schemaId}`, fields: '_id,name' }).$promise;
}
