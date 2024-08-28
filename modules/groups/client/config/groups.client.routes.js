import ListController from '../controllers/groups-list.client.controller';
import CreateController from '../controllers/groups-create.client.controller';
import ViewController from '../controllers/groups-view.client.controller';
import ListTemplate from '../views/groups-list.client.view.html';
import CreateTemplate from '../views/groups-create.client.view.html';
import ViewTemplate from '../views/groups-view.client.view.html';

routeConfig.$inject = ['$stateProvider'];
export default function routeConfig($stateProvider) {
  $stateProvider
    .state('groups', {
      abstract: true,
      url: '/groups',
      template: '<ui-view/>'
    })
    .state('groups.list', {
      url: '',
      template: ListTemplate,
      controller: ListController,
      controllerAs: 'vm',
      resolve: {
        groups: getGroups,
        users: ['UsersService', getAllUsers]
      }
    })
    .state('groups.create', {
      url: '/create?{restoreData:json}',
      template: CreateTemplate,
      controller: CreateController,
      controllerAs: 'vm',
      resolve: {
        group: newGroup,
        users: getUsers,
        documents: getDocuments,
        pods: getPods,
        projects: getProjects,
        deployments: getDeployments,
        restoredata: getRestoreData,
        creatingFromScratch: function () { return true; }
      }
    })
    .state('groups.edit', {
      url: '/edit/{groupId}?{restoreData:json}',
      template: CreateTemplate,
      controller: CreateController,
      controllerAs: 'vm',
      resolve: {
        group: getGroup,
        users: getUsers,
        documents: getDocuments,
        pods: getPods,
        projects: getProjects,
        deployments: getDeployments,
        restoredata: getRestoreData,
        creatingFromScratch: function () { return false; }
      }
    })
    .state('groups.view', {
      url: '/view/{groupId}',
      template: ViewTemplate,
      controller: ViewController,
      controllerAs: 'vm',
      resolve: {
        group: getGroup,
        users: ['UsersService', getAllUsers],
        documents: getDocuments,
        pods: getPods,
        projects: getProjects,
        deployments: getDeployments
      }
    });
}

getRestoreData.$inject = ['$stateParams'];
function getRestoreData($stateParams) {
  return $stateParams.restoreData;
}

function getAllUsers(UsersService) {
  return UsersService.query({ fields: '_id,username,displayName,roles' }).$promise;
}

getGroup.$inject = ['$stateParams', 'GroupsService'];
function getGroup($stateParams, GroupsService) {
  return GroupsService.get({
    groupId: $stateParams.groupId
  }).$promise;
}

getGroups.$inject = ['GroupsService'];
function getGroups(GroupsService) {
  return GroupsService.query().$promise;
}

newGroup.$inject = ['GroupsService'];
function newGroup(GroupsService) {
  return new GroupsService();
}

getUsers.$inject = ['UsersService'];
function getUsers(UsersService) {
  return UsersService.query().$promise;
}

getDocuments.$inject = ['DocumentsService'];
function getDocuments(DocumentsService) {
  return DocumentsService.query({ fields: '_id,name' }).$promise;
}

getPods.$inject = ['PodsService'];
function getPods(PodsService) {
  return PodsService.query({ fields: '_id,name' }).$promise;
}

getProjects.$inject = ['ProjectsService'];
function getProjects(ProjectsService) {
  return ProjectsService.query({ fields: '_id,name' }).$promise;
}

getDeployments.$inject = ['DeploymentsService'];
function getDeployments(DeploymentsService) {
  return DeploymentsService.query({ fields: '_id,name' }).$promise;
}
