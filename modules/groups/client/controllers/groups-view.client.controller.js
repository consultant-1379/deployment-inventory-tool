GroupsViewController.$inject = ['$scope', '$state', 'group', 'users',
  'documents', 'pods', 'projects', 'deployments', 'Authentication'];

export default function GroupsViewController(
  $scope, $state, group, users, documents, pods,
  projects, deployments, Authentication
) {
  var vm = this;
  vm.group = group;
  var currentUser = users.filter(user => user.username === Authentication.user.username)[0];
  vm.viewEditButton = currentUser.roles.indexOf('superAdmin') !== -1 || currentUser.roles.indexOf('admin') !== -1;
  vm.group.adminPrimary = users.filter(user => user._id === vm.group.admin_IDs[0])[0];
  vm.group.adminSecondary = users.filter(user => user._id === vm.group.admin_IDs[1])[0];
  vm.group.users = users.filter(user => vm.group.users.includes(user._id)).map(user => user.displayName);
  vm.group.documents = documents.filter(document => vm.group.associatedDocuments.includes(document._id)).map(document => {
    return { id: document._id, name: document.name };
  });
  vm.group.pods = pods.filter(pod => vm.group.associatedPods.includes(pod._id)).map(pod => {
    return { id: pod._id, name: pod.name };
  });
  vm.group.projects = projects.filter(project => vm.group.associatedProjects.includes(project._id)).map(project => {
    return { id: project._id, name: project.name };
  });
  vm.group.deployments = deployments.filter(deployment => vm.group.associatedDeployments.includes(deployment._id)).map(deployment => {
    return { id: deployment._id, name: deployment.name };
  });
}
