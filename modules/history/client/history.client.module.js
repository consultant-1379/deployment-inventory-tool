import routes from './config/history.client.routes';
import menus from './config/history.client.menus';
import HistoryService from './services/history.client.service';
import './css/history.css';

export const history = angular
  .module('history', [])
  .config(routes)
  .run(menus)
  .factory('deploymentHistoryService', HistoryService.getService('deployments'))
  .factory('documentHistoryService', HistoryService.getService('documents'))
  .factory('groupHistoryService', HistoryService.getService('groups'))
  .factory('labelHistoryService', HistoryService.getService('labels'))
  .factory('podHistoryService', HistoryService.getService('pods'))
  .factory('projectHistoryService', HistoryService.getService('projects'))
  .factory('schemaHistoryService', HistoryService.getService('schemas'))
  .name;
