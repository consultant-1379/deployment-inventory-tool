menuConfig.$inject = ['menuService'];
export default function menuConfig(menuService) {
  menuService.addMenuItem('topbar', {
    title: 'Documents',
    state: 'documents',
    position: 2,
    roles: ['*'],
    type: 'dropdown'
  });

  menuService.addSubMenuItem('topbar', 'documents', {
    title: 'vENM SEDs',
    state: 'documents.listSeds',
    position: '0'
  });

  menuService.addSubMenuItem('topbar', 'documents', {
    title: 'cENM SEDs',
    state: 'documents.listcENMSeds',
    position: '1'
  });

  menuService.addSubMenuItem('topbar', 'documents', {
    title: 'VNF LCM SEDs',
    state: 'documents.listVnfLcmSeds',
    position: '2'
  });

  menuService.addSubMenuItem('topbar', 'documents', {
    title: 'Managed Configs',
    state: 'documents.listManagedConfigs',
    position: '3'
  });

  menuService.addSubMenuItem('topbar', 'documents', {
    title: 'Other',
    state: 'documents.listOther',
    position: '4'
  });
}
