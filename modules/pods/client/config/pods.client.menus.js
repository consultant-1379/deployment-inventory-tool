menuConfig.$inject = ['menuService'];

export default function menuConfig(menuService) {
  menuService.addMenuItem('topbar', {
    title: 'Pods',
    state: 'pods.list',
    position: 3,
    roles: ['*']
  });
}
