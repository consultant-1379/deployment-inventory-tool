import $ from 'jquery';
import _ from 'lodash';
import { capitalizeFirstLetter } from '../../../core/client/controllers/helpers.client.controller';
window.jQuery = $;
window.$ = $;
require('select2')();

ProjectsCreateController.$inject = ['$scope', '$state', 'project', 'pods', 'pod', 'dependentDeployments', 'creatingFromScratch',
  'Notification', 'DeploymentsService', 'DocumentsService', 'ProjectsService', 'PodsService', '$window', 'allGroups', 'Authentication', 'allUsers', 'restoredata'];

export default function ProjectsCreateController(
  $scope, $state, project, pods, pod, dependentDeployments, creatingFromScratch,
  Notification, DeploymentsService, DocumentsService, ProjectsService, PodsService, $window,
  allGroups, Authentication, allUsers, restoredata
) {
  var vm = this;
  var originalProject = project;
  vm.project = project;
  if (restoredata) {
    Object.keys(restoredata).forEach(function (key) {
      vm.project[key] = restoredata[key];
    });
  }
  vm.project.usergroups = [];
  vm.allUserGroups = [];
  var allGroupsOptions = [];
  var currentUser = allUsers.filter(user => user.username === Authentication.user.username)[0];
  var superAdmin = isSuperAdmin(currentUser);
  getAllGroups(allGroups, superAdmin);
  if (!superAdmin) {
    getAllUserGroups(allGroups, currentUser._id);
  }
  getProjectGroups(allGroups, project._id);

  vm.pods = pods;
  vm.pod = pod;
  vm.ipv4regex = '^(?:(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)$';
  vm.ipv6regex = '^(?:(?:(?:[0-9A-Fa-f]{1,4}:){7}(?:[0-9A-Fa-f]{1,4}|:))|(?:(?:[0-9A-Fa-f]{1,4}:){6}(?::[0-9A-Fa-f]{1,4}|(?:(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3})|:))|(?:(?:[0-9A-Fa-f]{1,4}:){5}(?:(?:(?::[0-9A-Fa-f]{1,4}){1,2})|:(?:(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3})|:))|(?:(?:[0-9A-Fa-f]{1,4}:){4}(?:(?:(?::[0-9A-Fa-f]{1,4}){1,3})|(?:(?::[0-9A-Fa-f]{1,4})?:(?:(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3}))|:))|(?:(?:[0-9A-Fa-f]{1,4}:){3}(?:(?:(?::[0-9A-Fa-f]{1,4}){1,4})|(?:(?::[0-9A-Fa-f]{1,4}){0,2}:(?:(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3}))|:))|(?:(?:[0-9A-Fa-f]{1,4}:){2}(?:(?:(?::[0-9A-Fa-f]{1,4}){1,5})|(?:(?::[0-9A-Fa-f]{1,4}){0,3}:(?:(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3}))|:))|(?:(?:[0-9A-Fa-f]{1,4}:){1}(?:(?:(?::[0-9A-Fa-f]{1,4}){1,6})|(?:(?::[0-9A-Fa-f]{1,4}){0,4}:(?:(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3}))|:))|(?::(?:(?:(?::[0-9A-Fa-f]{1,4}){1,7})|(?:(?::[0-9A-Fa-f]{1,4}){0,5}:(?:(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3}))|:)))(?:%.+)?$|^$';
  vm.disableIpv6Btn = true;

  if (restoredata) {
    vm.pageTitle = 'Restoring project';
  } else {
    vm.pageTitle = creatingFromScratch ? 'Creating project' : 'Editing project';
  }

  if (!vm.project.network || !vm.project.network.name) {
    vm.project.network = {
      ipv4_ranges: [{}]
    };
  }

  if (!vm.project.exclusion_ipv4_addresses) {
    vm.project.exclusion_ipv4_addresses = [];
  }

  if (!vm.project.exclusion_ipv6_addresses) {
    vm.project.exclusion_ipv6_addresses = [];
  }

  vm.setPodById = async function (podId) {
    try {
      vm.pod = await PodsService.get({ podId: podId }).$promise;
      $scope.$apply();
    } catch (err) {
      Notification.error({ message: err.data.message.replace(/\n/g, '<br/>'), title: '<i class="glyphicon glyphicon-remove"></i> Pod loading error!' });
    }
  };

  async function checkNetworkForIpv6Subnet(networkName) {
    vm.disableIpv6Btn = true;
    if (vm.pod.networks.length !== 0) {
      vm.pod.networks.forEach(function (network) {
        if (network.name === networkName && network.ipv6_subnet) vm.disableIpv6Btn = false;
      });
    }
    _.defer(() => $scope.$apply());
  }

  async function resaveDocuments() {
    if (dependentDeployments.length !== 0) {
      var sed = new DocumentsService({ _id: dependentDeployments[0].enm.sed_id });
      await sed.createOrUpdate();
    }
  }

  vm.submitForm = async function () {
    var projectStatus = (creatingFromScratch ? 'creation' : 'update');

    try {
      vm.formSubmitting = true;
      delete vm.project.__v;
      await vm.project.createOrUpdate();
    } catch (err) {
      vm.formSubmitting = false;
      Notification.error({ message: err.data.message.replace(/\n/g, '<br/>'), title: `<i class="glyphicon glyphicon-remove"></i> Project ${projectStatus} error!` });
      return;
    }
    if (!creatingFromScratch) {
      try {
        await resaveDocuments();
      } catch (err) {
        vm.formSubmitting = false;
        await revertProject(originalProject);
        var message = err.data ? err.data.message : err.message;
        Notification.error({ message: message.replace(/\n/g, '<br/>'), title: '<i class="glyphicon glyphicon-remove"></i> SED update error!' });
        return;
      }
    }
    $state.go('projects.view', { projectId: vm.project._id });
    Notification.success({ message: `<i class="glyphicon glyphicon-ok"></i> Project ${projectStatus} successful!` });
  };

  async function revertProject(projectToRevert) {
    try {
      delete projectToRevert.__v;
      await projectToRevert.createOrUpdate();
    } catch (err) {
      Notification.error({ message: '<i class="glyphicon glyphicon-remove"></i> Failed to revert project!' });
    }
  }

  if (restoredata) {
    vm.submitForm();
  }

  vm.addIPV4Range = function () {
    var currentRanges = _.get(vm.project, 'network.ipv4_ranges', []);
    currentRanges.push({});
    _.set(vm.project, 'network.ipv4_ranges', currentRanges);
  };
  vm.removeIPV4Range = function (range) {
    if ($window.confirm('Are you sure you want to delete this range?')) {
      vm.project.network.ipv4_ranges.splice(vm.project.network.ipv4_ranges.indexOf(range), 1);
    }
  };
  vm.addIPV6Range = function () {
    var currentRanges = _.get(vm.project, 'network.ipv6_ranges', []);
    currentRanges.push({});
    _.set(vm.project, 'network.ipv6_ranges', currentRanges);
  };
  vm.removeIPV6Range = function (range) {
    if ($window.confirm('Are you sure you want to delete this range?')) {
      vm.project.network.ipv6_ranges.splice(vm.project.network.ipv6_ranges.indexOf(range), 1);
    }
  };

  // For addition of Exclusion IP Addresses from Project.
  vm.addExclusionIPAddress = function (addressName) {
    var exclusionIPAddresses = _.get(vm.project, addressName, []);
    exclusionIPAddresses.push({});
    _.set(vm.project, addressName, exclusionIPAddresses);
  };

  // For deletion of Exclusion IP Addresses from Project.
  vm.removeExclusionIPAddress = function (ip, addresses) {
    if ($window.confirm('Are you sure you want to delete this IP?')) {
      if (addresses === 'exclusion_ipv4_addresses') {
        vm.project[addresses].splice(vm.project[addresses].findIndex(ipAddress => ipAddress.ipv4 === ip), 1);
      } else {
        vm.project[addresses].splice(vm.project[addresses].findIndex(ipAddress => ipAddress.ipv6 === ip), 1);
      }
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

  async function getProjectGroups(allGroups, projectId) {
    var projectGroups = await allGroups.filter(group => isProjectPresentInGroup(group, projectId));
    vm.project.usergroups = await projectGroups.map(group => { return group._id; });
    if (vm.allUserGroups.length === 1 && vm.project.usergroups.length === 0) {
      vm.project.usergroups.push(vm.allUserGroups[0].id);
    }
  }

  function isProjectPresentInGroup(group, projectId) {
    return group.associatedProjects.indexOf(projectId) !== -1;
  }

  vm.addUserGroup = function () {
    vm.project.usergroups.push('');
  };

  vm.removeUserGroup = function (group) {
    if ($window.confirm('Are you sure you want to delete the association with this group?')) {
      vm.project.usergroups.splice(vm.project.usergroups.indexOf(group), 1);
    }
  };

  vm.disableGroupsButton = function (group, buttonType) {
    if (vm.allUserGroups.length === 0) {
      return true;
    }
    if (vm.project.usergroups) {
      if (vm.allUserGroups.length === 1 && vm.project.usergroups.indexOf(vm.allUserGroups[0].id) !== -1) {
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

  $(function () { // On Document Load
    if (vm.project.network) checkNetworkForIpv6Subnet(vm.project.network.name);
    var selectOptions = ['pod', 'network'];
    selectOptions.forEach(function (option) {
      var selectId = `#${option}-select`;
      $(selectId).select2({
        placeholder: `--Select ${capitalizeFirstLetter(option)}--`,
        allowClear: true
      });
    });
    $('#pod-select').on('select2:select select2:unselecting', async function () {
      if ($(this).val() === null || $(this).val() === '') {
        $(this).data('unselecting', true);
        vm.project.pod_id = undefined;
        vm.pod = undefined;
      } else {
        vm.project.pod_id = $(this).val().replace('string:', '');
        await vm.setPodById(vm.project.pod_id);
      }
      _.defer(() => $scope.$apply());
    });
    $('#network-select').on('select2:select select2:unselecting', async function () {
      if ($(this).val() === null || $(this).val() === '') {
        $(this).data('unselecting', true);
        vm.project.network.name = undefined;
        vm.disableIpv6Btn = true;
      } else {
        vm.project.network.name = $(this).val().replace('string:', '');
        await checkNetworkForIpv6Subnet(vm.project.network.name);
      }
      _.defer(() => $scope.$apply());
    });
  });
}
