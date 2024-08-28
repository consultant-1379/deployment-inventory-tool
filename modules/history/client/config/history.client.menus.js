menuConfig.$inject = ['menuService'];

export default function menuConfig(menuService) {
  menuService.addMenuItem('topbar', {
    title: 'Logs',
    state: 'logs',
    position: 7,
    roles: ['*'],
    type: 'dropdown'
  });

  var logObjects = ['Schema', 'Document', 'Pod', 'Project', 'Deployment', 'Label', 'Group'];
  for (var i = 0; i < logObjects.length; i += 1) {
    menuService.addSubMenuItem('topbar', 'logs', {
      title: `${logObjects[i]} Logs`,
      state: 'logs.list',
      params: { objType: `${logObjects[i].toLowerCase()}s` },
      position: i + 1,
      roles: (logObjects[i] === 'Group') ? ['superAdmin'] : ['*']
    });
  }
}
