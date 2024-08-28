import ListController from '../controllers/projects-list.client.controller';
import CreateController from '../controllers/projects-create.client.controller';
import ViewController from '../controllers/projects-view.client.controller';
import ListView from '../views/projects-list.client.view.html';
import CreateTemplate from '../views/projects-create.client.view.html';
import ViewTemplate from '../views/projects-view.client.view.html';

routeConfig.$inject = ['$stateProvider'];
export default function routeConfig($stateProvider) {
  $stateProvider
    .state('projects', {
      abstract: true,
      url: '/projects',
      template: '<ui-view/>'
    })

    .state('projects.list', {
      url: '',
      template: ListView,
      controller: ListController,
      controllerAs: 'vm',
      resolve: {
        projects: getProjects,
        pods: getPods,
        projectsHistory: getProjectsHistory
      }
    })
    .state('projects.create', {
      url: '/create?{restoreData:json}',
      template: CreateTemplate,
      controller: CreateController,
      controllerAs: 'vm',
      resolve: {
        project: newProject,
        pods: getPods,
        pod: function () { return null; },
        restoredata: getRestoreData,
        dependentDeployments: function () { return null; },
        creatingFromScratch: function () { return true; },
        allGroups: getGroups,
        allUsers: getAllUsers
      }
    })
    .state('projects.view', {
      url: '/view/{projectId}',
      template: ViewTemplate,
      controller: ViewController,
      controllerAs: 'vm',
      resolve: {
        project: getProject,
        pod: ['project', 'PodsService', getPod],
        dependentDeployments: getDependentDeployments,
        allGroups: getGroups
      }
    })
    .state('projects.edit', {
      url: '/edit/{projectId}?{restoreData:json}',
      template: CreateTemplate,
      controller: CreateController,
      controllerAs: 'vm',
      resolve: {
        project: getProject,
        pods: getPods,
        restoredata: getRestoreData,
        pod: ['project', 'PodsService', getPod],
        dependentDeployments: getDependentDeployments,
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

getProject.$inject = ['$stateParams', 'ProjectsService'];
function getProject($stateParams, ProjectsService) {
  return ProjectsService.get({
    projectId: $stateParams.projectId
  }).$promise;
}

getProjects.$inject = ['ProjectsService'];
function getProjects(ProjectsService) {
  return ProjectsService.query({ fields: '_id,name,pod_id' }).$promise;
}

newProject.$inject = ['ProjectsService'];
function newProject(ProjectsService) {
  return new ProjectsService();
}

getPods.$inject = ['PodsService'];
function getPods(podsService) {
  return podsService.query({ fields: '_id,name' }).$promise;
}

function getPod(project, PodsService) {
  return PodsService.get({ podId: project.pod_id }).$promise;
}

getDependentDeployments.$inject = ['$stateParams', 'DeploymentsService'];
function getDependentDeployments($stateParams, DeploymentsService) {
  return DeploymentsService.query({ q: `project_id=${$stateParams.projectId}`, fields: '_id,name,enm(sed_id)' }).$promise;
}

getGroups.$inject = ['GroupsService'];
function getGroups(GroupsService) {
  return GroupsService.query().$promise;
}

getAllUsers.$inject = ['UsersService'];
function getAllUsers(UsersService) {
  return UsersService.query({ fields: '_id,username,roles' }).$promise;
}

getProjectsHistory.$inject = ['projectHistoryService'];
async function getProjectsHistory(projectHistoryService) {
  return projectHistoryService.query({ fields: 'associated_id,createdBy,createdAt,updates(updatedAt)' }).$promise;
}
