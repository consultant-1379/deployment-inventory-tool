import routes from './config/documents.client.routes';
import menus from './config/documents.client.menus';
import service from './services/documents.client.service';

export const documents = angular
  .module('documents', ['schemaForm', 'btorfs.multiselect', 'ui.toggle'])
  .config(routes)
  .run(menus)
  .factory('DocumentsService', service)
  .name;
