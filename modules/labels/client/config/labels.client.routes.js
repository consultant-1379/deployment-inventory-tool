import ListController from '../controllers/labels-list.client.controller';
import CreateController from '../controllers/labels-create.client.controller';
import ViewController from '../controllers/labels-view.client.controller';
import ListTemplate from '../views/labels-list.client.view.html';
import CreateTemplate from '../views/labels-create.client.view.html';
import ViewTemplate from '../views/labels-view.client.view.html';

routeConfig.$inject = ['$stateProvider'];
export default function routeConfig($stateProvider) {
  $stateProvider
    .state('labels', {
      abstract: true,
      url: '/labels',
      template: '<ui-view/>'
    })
    .state('labels.list', {
      url: '',
      template: ListTemplate,
      controller: ListController,
      controllerAs: 'vm',
      resolve: {
        labels: getLabels
      }
    })
    .state('labels.create', {
      url: '/create?{restoreData:json}',
      template: CreateTemplate,
      controller: CreateController,
      controllerAs: 'vm',
      resolve: {
        label: newLabel,
        dependentDocuments: function () { return []; },
        restoredata: getRestoreData,
        creatingFromScratch: function () { return true; }
      }
    })
    .state('labels.edit', {
      url: '/edit/{labelId}?{restoreData:json}',
      template: CreateTemplate,
      controller: CreateController,
      controllerAs: 'vm',
      resolve: {
        label: getLabel,
        dependentDocuments: ['label', 'DocumentsService', getDependentDocuments],
        restoredata: getRestoreData,
        creatingFromScratch: function () { return false; }
      }
    })
    .state('labels.view', {
      url: '/view/{labelId}',
      template: ViewTemplate,
      controller: ViewController,
      controllerAs: 'vm',
      resolve: {
        label: getLabel,
        dependentDocuments: ['label', 'DocumentsService', getDependentDocuments]
      }
    });
}

getRestoreData.$inject = ['$stateParams'];
function getRestoreData($stateParams) {
  return $stateParams.restoreData;
}

getLabel.$inject = ['$stateParams', 'LabelsService'];
function getLabel($stateParams, LabelsService) {
  return LabelsService.get({
    labelId: $stateParams.labelId
  }).$promise;
}

getLabels.$inject = ['LabelsService'];
function getLabels(labelsService) {
  return labelsService.query().$promise;
}

newLabel.$inject = ['LabelsService'];
function newLabel(LabelsService) {
  return new LabelsService();
}

function getDependentDocuments(label, DocumentsService) {
  return DocumentsService.query({ q: `labels=${label.name}`, fields: '_id,name' }).$promise;
}
