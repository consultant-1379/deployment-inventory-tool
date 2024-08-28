menuConfig.$inject = ['menuService'];

export default function menuConfig(menuService) {
  menuService.addMenuItem('topbar', {
    title: 'Projects',
    state: 'projects.list',
    position: 4,
    roles: ['*']
  });
}
