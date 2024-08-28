import routes from './config/pods.client.routes';
import menus from './config/pods.client.menus';
import service from './services/pods.client.service';

export const pods = angular
  .module('pods', [])
  .config(routes)
  .run(menus)
  .factory('PodsService', service)
  .name;
