import UsersService from '../services/users.client.service';
import ListController from '../controllers/users-list.client.controller';
import ListTemplate from '../views/users-list.client.view.html';
import CreateController from '../controllers/users-create.client.controller';
import CreateTemplate from '../views/users-create.client.view.html';
import authenticationController from '../controllers/authentication.client.controller';
import authenticationView from '../views/authentication/authentication.client.view.html';
import signInView from '../views/authentication/signin.client.view.html';
routeConfig.$inject = ['$stateProvider'];

export default function routeConfig($stateProvider) {
  $stateProvider
    .state('authentication', {
      abstract: true,
      url: '/authentication',
      template: authenticationView,
      controller: authenticationController,
      controllerAs: 'vm'
    })
    .state('authentication.signin', {
      url: '/signin?err',
      template: signInView,
      controller: authenticationController,
      controllerAs: 'vm'
    });

  $stateProvider
    .state('users', {
      abstract: true,
      url: '/users',
      template: '<ui-view/>'
    })
    .state('users.list', {
      url: '',
      template: ListTemplate,
      controller: ListController,
      controllerAs: 'vm',
      resolve: {
        users: getUsers
      }
    })
    .state('users.create', {
      url: '/create',
      template: CreateTemplate,
      controller: CreateController,
      controllerAs: 'vm',
      resolve: {
        users: getUsers
      }
    });
}

getUsers.$inject = ['UsersService'];
function getUsers(UsersService) {
  return UsersService.query().$promise;
}
