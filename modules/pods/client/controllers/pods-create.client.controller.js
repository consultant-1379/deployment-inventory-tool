PodsCreateController.$inject = ['$state', 'pod', 'dependentProjects', 'creatingFromScratch', 'Notification',
  'PodsService', 'ProjectsService', 'DeploymentsService', 'DocumentsService', '$window', 'allGroups', 'Authentication', 'allUsers', 'restoredata'];

export default function PodsCreateController(
  $state, pod, dependentProjects, creatingFromScratch, Notification,
  PodsService, ProjectsService, DeploymentsService, DocumentsService,
  $window, allGroups, Authentication, allUsers, restoredata
) {
  var vm = this;
  vm.pod = pod;
  if (restoredata) {
    Object.keys(restoredata).forEach(function (key) {
      pod[key] = restoredata[key];
    });
  }
  vm.pod.usergroups = [];
  vm.allUserGroups = [];
  var allGroupsOptions = [];
  var currentUser = allUsers.filter(user => user.username === Authentication.user.username)[0];
  var superAdmin = isSuperAdmin(currentUser);
  getAllGroups(allGroups, superAdmin);
  if (!superAdmin) {
    getAllUserGroups(allGroups, currentUser._id);
  }
  getPodGroups(allGroups, pod._id);
  vm.urlregex = '^(https?://)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\\.[a-z0-9](?:[-0-9a-z]{0,61}[0-9a-z])?)*)(.*)$';
  vm.ipv4cidrregex = '^(?:(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\/([1-9]|[12][0-9]|3[0-2])$';
  vm.ipv4regex = '^(?:(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)$';
  vm.ipv6cidrregex = '^(?:(?:(?:[0-9A-Fa-f]{1,4}:){7}(?:[0-9A-Fa-f]{1,4}|:))|(?:(?:[0-9A-Fa-f]{1,4}:){6}(?::[0-9A-Fa-f]{1,4}|(?:(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3})|:))|(?:(?:[0-9A-Fa-f]{1,4}:){5}(?:(?:(?::[0-9A-Fa-f]{1,4}){1,2})|:(?:(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3})|:))|(?:(?:[0-9A-Fa-f]{1,4}:){4}(?:(?:(?::[0-9A-Fa-f]{1,4}){1,3})|(?:(?::[0-9A-Fa-f]{1,4})?:(?:(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3}))|:))|(?:(?:[0-9A-Fa-f]{1,4}:){3}(?:(?:(?::[0-9A-Fa-f]{1,4}){1,4})|(?:(?::[0-9A-Fa-f]{1,4}){0,2}:(?:(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3}))|:))|(?:(?:[0-9A-Fa-f]{1,4}:){2}(?:(?:(?::[0-9A-Fa-f]{1,4}){1,5})|(?:(?::[0-9A-Fa-f]{1,4}){0,3}:(?:(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3}))|:))|(?:(?:[0-9A-Fa-f]{1,4}:){1}(?:(?:(?::[0-9A-Fa-f]{1,4}){1,6})|(?:(?::[0-9A-Fa-f]{1,4}){0,4}:(?:(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3}))|:))|(?::(?:(?:(?::[0-9A-Fa-f]{1,4}){1,7})|(?:(?::[0-9A-Fa-f]{1,4}){0,5}:(?:(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3}))|:)))(?:%.+)?(/([0-9]|[1-9][0-9]|1[0-1][0-9]|12[0-8]))$|^$';
  vm.ipv6regex = '^((?:(?:(?:[0-9A-Fa-f]{1,4}:){7}(?:[0-9A-Fa-f]{1,4}|:))|(?:(?:[0-9A-Fa-f]{1,4}:){6}(?::[0-9A-Fa-f]{1,4}|(?:(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3})|:))|(?:(?:[0-9A-Fa-f]{1,4}:){5}(?:(?:(?::[0-9A-Fa-f]{1,4}){1,2})|:(?:(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3})|:))|(?:(?:[0-9A-Fa-f]{1,4}:){4}(?:(?:(?::[0-9A-Fa-f]{1,4}){1,3})|(?:(?::[0-9A-Fa-f]{1,4})?:(?:(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3}))|:))|(?:(?:[0-9A-Fa-f]{1,4}:){3}(?:(?:(?::[0-9A-Fa-f]{1,4}){1,4})|(?:(?::[0-9A-Fa-f]{1,4}){0,2}:(?:(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3}))|:))|(?:(?:[0-9A-Fa-f]{1,4}:){2}(?:(?:(?::[0-9A-Fa-f]{1,4}){1,5})|(?:(?::[0-9A-Fa-f]{1,4}){0,3}:(?:(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3}))|:))|(?:(?:[0-9A-Fa-f]{1,4}:){1}(?:(?:(?::[0-9A-Fa-f]{1,4}){1,6})|(?:(?::[0-9A-Fa-f]{1,4}){0,4}:(?:(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3}))|:))|(?::(?:(?:(?::[0-9A-Fa-f]{1,4}){1,7})|(?:(?::[0-9A-Fa-f]{1,4}){0,5}:(?:(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3}))|:)))(?:%.+)?)?$|^$';

  vm.undeletableNetworks = [];
  if (dependentProjects) {
    vm.pod.networks.forEach(function (network) {
      dependentProjects.forEach(function (project) {
        if (project.network && project.network.name === network.name) {
          vm.undeletableNetworks.push(network.name);
        }
      });
    });
  }

  if (restoredata) {
    vm.pageTitle = 'Restoring pod';
  } else {
    vm.pageTitle = creatingFromScratch ? 'Creating pod' : 'Editing pod';
  }

  if (!vm.pod.networks || vm.pod.networks.length === 0) {
    vm.pod.networks = [{}];
  }

  async function resaveDocuments() {
    var projectPromises = [],
      deploymentsPromises = [],
      documentPromises = [];

    for (var p = 0; p < dependentProjects.length; p += 1) {
      var project = new ProjectsService({ _id: dependentProjects[p]._id });
      projectPromises.push(project.createOrUpdate());
      deploymentsPromises.push(DeploymentsService.query({ q: `project_id=${dependentProjects[p]._id}`, fields: 'enm(sed_id)' }).$promise);
    }
    try {
      await Promise.all(projectPromises);
    } catch (err) {
      err.objectTypeFailure = 'Project';
      throw err;
    }
    try {
      var deployments = await Promise.all(deploymentsPromises);
      for (var d = 0; d < deployments.length; d += 1) {
        if (deployments[d].length !== 0) {
          var sed = new DocumentsService({ _id: deployments[d][0].enm.sed_id });
          documentPromises.push(sed.createOrUpdate());
        }
      }
    } catch (err) {
      err.objectTypeFailure = 'Deployment';
      throw err;
    }
    try {
      await Promise.all(documentPromises);
    } catch (err) {
      err.objectTypeFailure = 'SED';
      throw err;
    }
  }

  vm.submitForm = async function () {
    var podStatus = (creatingFromScratch ? 'creation' : 'update');
    var originalPod;

    if (!creatingFromScratch) {
      originalPod = await PodsService.get({ podId: vm.pod._id }).$promise;
    }
    try {
      vm.formSubmitting = true;
      delete vm.pod.__v;
      await vm.pod.createOrUpdate();
    } catch (err) {
      vm.formSubmitting = false;
      Notification.error({ message: err.data.message.replace(/\n/g, '<br/>'), title: `<i class="glyphicon glyphicon-remove"></i> Pod ${podStatus} error!` });
      return;
    }
    if (!creatingFromScratch) {
      try {
        await resaveDocuments();
      } catch (err) {
        vm.formSubmitting = false;
        await revertPod(originalPod);
        var message = err.data ? err.data.message : err.message;
        Notification.error({ message: message.replace(/\n/g, '<br/>'), title: `<i class="glyphicon glyphicon-remove"></i> ${err.objectTypeFailure} update error!` });
        return;
      }
    }
    $state.go('pods.view', { podId: vm.pod._id });
    Notification.success({ message: `<i class="glyphicon glyphicon-ok"></i> Pod ${podStatus} successful!` });
  };

  async function revertPod(podToRevert) {
    try {
      delete podToRevert.__v;
      await podToRevert.createOrUpdate();
    } catch (err) {
      Notification.error({ message: '<i class="glyphicon glyphicon-remove"></i> Failed to revert pod!' });
    }
  }

  if (restoredata) {
    vm.submitForm();
  }

  vm.addNetwork = function () {
    vm.pod.networks.push({});
  };
  vm.removeNetwork = function (network) {
    if ($window.confirm('Are you sure you want to delete this network?')) {
      vm.pod.networks.splice(vm.pod.networks.indexOf(network), 1);
    }
  };

  vm.addIpv6Subnet = function (networkIndex) {
    vm.pod.networks[networkIndex].ipv6_subnet = {};
  };
  vm.removeIpv6Subnet = function (networkIndex) {
    if ($window.confirm('Are you sure you want to delete this IPv6 Subnet?')) {
      delete vm.pod.networks[networkIndex].ipv6_subnet;
    }
  };

  function isSuperAdmin(currentUser) {
    return currentUser.roles.indexOf('superAdmin') !== -1;
  }

  async function getAllGroups(allGroups, superAdmin) {
    allGroupsOptions = await allGroups.map(group => { return { id: group._id, name: group.name }; });
    if (superAdmin) {
      vm.allUserGroups = allGroupsOptions;
    }
  }

  async function getAllUserGroups(allGroups, currentUserId) {
    var foundGroups = await allGroups.filter(group => isUserPresentInGroup(group, currentUserId));
    vm.allUserGroups = await foundGroups.map(group => { return { id: group._id, name: group.name }; });
  }

  function isUserPresentInGroup(group, currentUserId) {
    return (group.admin_IDs.indexOf(currentUserId) !== -1 || group.users.indexOf(currentUserId) !== -1);
  }

  async function getPodGroups(allGroups, podId) {
    var podGroups = await allGroups.filter(group => isPodPresentInGroup(group, podId));
    vm.pod.usergroups = await podGroups.map(group => { return group._id; });
    if (vm.allUserGroups.length === 1 && vm.pod.usergroups.length === 0) {
      vm.pod.usergroups.push(vm.allUserGroups[0].id);
    }
  }

  function isPodPresentInGroup(group, podId) {
    return group.associatedPods.indexOf(podId) !== -1;
  }

  vm.addUserGroup = function () {
    vm.pod.usergroups.push('');
  };

  vm.removeUserGroup = function (group) {
    if ($window.confirm('Are you sure you want to delete the association with this group?')) {
      vm.pod.usergroups.splice(vm.pod.usergroups.indexOf(group), 1);
    }
  };

  vm.disableGroupsButton = function (group, buttonType) {
    if (vm.allUserGroups.length === 0) {
      return true;
    }
    if (vm.pod.usergroups) {
      if (vm.allUserGroups.length === 1 && vm.pod.usergroups.indexOf(vm.allUserGroups[0].id) !== -1) {
        return true;
      }
    }
    for (var g = 0; g < vm.allUserGroups.length; g += 1) {
      if (vm.allUserGroups[g].id === group || group === '') {
        return false;
      }
    }
    return buttonType.toString() !== 'add';
  };

  vm.groupOptions = function (status) {
    if (status) {
      return allGroupsOptions;
    }
    return vm.allUserGroups;
  };
}
