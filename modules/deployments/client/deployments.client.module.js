import routes from './config/deployments.client.routes';
import menus from './config/deployments.client.menus';
import service from './services/deployments.client.service';

export const deployments = angular
  .module('deployments', [])
  .config(routes)
  .run(menus)
  .factory('DeploymentsService', service)
  .name;
