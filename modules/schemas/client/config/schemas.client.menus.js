menuConfig.$inject = ['menuService'];

export default function menuConfig(menuService) {
  menuService.addMenuItem('topbar', {
    title: 'Schemas',
    state: 'schemas.list',
    position: 1,
    roles: ['*']
  });
}
