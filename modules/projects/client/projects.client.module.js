import routes from './config/projects.client.routes';
import menus from './config/projects.client.menus';
import service from './services/projects.client.service';

export const projects = angular
  .module('projects', [])
  .config(routes)
  .run(menus)
  .factory('ProjectsService', service)
  .name;
