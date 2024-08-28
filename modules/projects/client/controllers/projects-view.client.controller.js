ProjectsViewController.$inject = ['$scope', '$state', 'project', 'pod', 'dependentDeployments', 'allGroups'];
export default function ProjectsViewController($scope, $state, project, pod, dependentDeployments, allGroups) {
  var vm = this;
  vm.project = project;
  vm.pod = pod;
  vm.dependentDeployments = dependentDeployments;
  getProjectGroups(allGroups, project._id);

  async function getProjectGroups(allGroups, projectId) {
    var projectGroups = await allGroups.filter(group => isProjectPresentInGroup(group, projectId));
    vm.groups = await projectGroups.map(group => { return { id: group._id, name: group.name }; });
  }

  function isProjectPresentInGroup(group, projectId) {
    return group.associatedProjects.indexOf(projectId) !== -1;
  }
}
