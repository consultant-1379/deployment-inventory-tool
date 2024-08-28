import routes from './config/groups.client.routes';
import service from './services/groups.client.service';

export const groups = angular
  .module('groups', [])
  .config(routes)
  .factory('GroupsService', service)
  .name;
