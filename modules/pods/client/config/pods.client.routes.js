import ListController from '../controllers/pods-list.client.controller';
import CreateController from '../controllers/pods-create.client.controller';
import ViewController from '../controllers/pods-view.client.controller';
import ListTemplate from '../views/pods-list.client.view.html';
import CreateTemplate from '../views/pods-create.client.view.html';
import ViewTemplate from '../views/pods-view.client.view.html';

routeConfig.$inject = ['$stateProvider'];
export default function routeConfig($stateProvider) {
  $stateProvider
    .state('pods', {
      abstract: true,
      url: '/pods',
      template: '<ui-view/>'
    })

    .state('pods.list', {
      url: '',
      template: ListTemplate,
      controller: ListController,
      controllerAs: 'vm',
      resolve: {
        pods: getPods,
        podsHistory: getPodsHistory
      }
    })
    .state('pods.create', {
      url: '/create?{restoreData:json}',
      template: CreateTemplate,
      controller: CreateController,
      controllerAs: 'vm',
      resolve: {
        pod: newPod,
        dependentProjects: function () { return null; },
        restoredata: getRestoreData,
        creatingFromScratch: function () { return true; },
        allGroups: getGroups,
        allUsers: getAllUsers
      }
    })
    .state('pods.view', {
      url: '/view/{podId}',
      template: ViewTemplate,
      controller: ViewController,
      controllerAs: 'vm',
      resolve: {
        pod: getPod,
        dependentProjects: getDependentProjects,
        allGroups: getGroups
      }
    })
    .state('pods.edit', {
      url: '/edit/{podId}?{restoreData:json}',
      template: CreateTemplate,
      controller: CreateController,
      controllerAs: 'vm',
      resolve: {
        pod: getPod,
        dependentProjects: getDependentProjects,
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

getPod.$inject = ['$stateParams', 'PodsService'];
function getPod($stateParams, PodsService) {
  return PodsService.get({
    podId: $stateParams.podId
  }).$promise;
}

getPods.$inject = ['PodsService'];
function getPods(podsService) {
  return podsService.query().$promise;
}

newPod.$inject = ['PodsService'];
function newPod(PodsService) {
  return new PodsService();
}

getDependentProjects.$inject = ['$stateParams', 'ProjectsService'];
function getDependentProjects($stateParams, ProjectsService) {
  return ProjectsService.query({ q: `pod_id=${$stateParams.podId}`, fields: '_id,name,network(name)' }).$promise;
}

getGroups.$inject = ['GroupsService'];
function getGroups(GroupsService) {
  return GroupsService.query().$promise;
}

getAllUsers.$inject = ['UsersService'];
function getAllUsers(UsersService) {
  return UsersService.query({ fields: '_id,username,roles' }).$promise;
}

getPodsHistory.$inject = ['podHistoryService'];
async function getPodsHistory(podHistoryService) {
  return podHistoryService.query({ fields: 'associated_id,createdBy,createdAt,updates(updatedAt)' }).$promise;
}
