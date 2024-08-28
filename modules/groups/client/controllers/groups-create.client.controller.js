GroupsCreateController.$inject = ['$scope', '$state', '$window', 'group',
  'users', 'documents', 'pods', 'projects', 'deployments',
  'creatingFromScratch', 'Notification', 'Authentication', 'restoredata'];

export default function GroupsCreateController(
  $scope, $state, $window, group, users, documents,
  pods, projects, deployments, creatingFromScratch, Notification, Authentication, restoredata
) {
  var vm = this;
  vm.group = group;
  if (restoredata) {
    Object.keys(restoredata).forEach(function (key) {
      vm.group[key] = restoredata[key];
    });
  }
  vm.users = users;
  vm.Authentication = Authentication;
  vm.admins = users.filter(user => user.roles[0] === 'admin' || user.roles[0] === 'superAdmin');
  if (creatingFromScratch && !restoredata) {
    vm.group.associatedDocuments = [];
    vm.group.associatedPods = [];
    vm.group.associatedProjects = [];
    vm.group.associatedDeployments = [];
    vm.group.users = [];
    vm.group.admin_IDs = [];
  }
  vm.currentDocNames = getNamesFromIDs('document', vm.group.associatedDocuments);
  vm.currentPodNames = getNamesFromIDs('pod', vm.group.associatedPods);
  vm.currentProjectNames = getNamesFromIDs('project', vm.group.associatedProjects);
  vm.currentDeploymentNames = getNamesFromIDs('deployment', vm.group.associatedDeployments);
  vm.currentUserNames = getNamesFromUserIDs(vm.group.users);
  if (restoredata) {
    vm.pageTitle = 'Restoring group';
  } else {
    vm.pageTitle = creatingFromScratch ? 'Creating group' : 'Editing group';
  }

  vm.submitForm = async function () {
    var action = creatingFromScratch ? 'creation' : 'edit';
    try {
      vm.formSubmitting = true;
      await vm.group.createOrUpdate();
    } catch (err) {
      vm.formSubmitting = false;
      var message = err.data ? err.data.message : err.message;
      Notification.error({ message: message.replace(/\n/g, '<br/>'), title: `<i class="glyphicon glyphicon-remove"></i> Group ${action} error!` });
      return;
    }
    $state.go('groups.view', { groupId: vm.group._id });
    Notification.success({ message: `<i class="glyphicon glyphicon-ok"></i> Group ${action} successful!` });
  };

  if (restoredata) {
    vm.submitForm();
  }

  function getNamesFromIDs(type, currentIDs) {
    var selectedArray = [];
    var names = [];
    if (type === 'document') {
      selectedArray = documents;
    } else if (type === 'pod') {
      selectedArray = pods;
    } else if (type === 'project') {
      selectedArray = projects;
    } else if (type === 'deployment') {
      selectedArray = deployments;
    }
    for (var x = 0; x < currentIDs.length; x += 1) {
      for (var i = 0; i < selectedArray.length; i += 1) {
        if (currentIDs[x] === selectedArray[i]._id) {
          names.push(selectedArray[i].name);
        }
      }
    }
    return names;
  }

  function getNamesFromUserIDs(currentUsersIDs) {
    return vm.users.filter(user => currentUsersIDs.includes(user._id)).map(user => user.displayName);
  }

  function getArtifactID(type, artifactName) {
    var returnedArtifacts;
    if (type === 'document') {
      returnedArtifacts = documents.filter(document => document.name === artifactName);
      return (returnedArtifacts[0] ? returnedArtifacts[0]._id : null);
    }
    if (type === 'pod') {
      returnedArtifacts = pods.filter(pod => pod.name === artifactName);
      return (returnedArtifacts[0] ? returnedArtifacts[0]._id : null);
    }
    if (type === 'project') {
      returnedArtifacts = projects.filter(project => project.name === artifactName);
      return (returnedArtifacts[0] ? returnedArtifacts[0]._id : null);
    }
    if (type === 'deployment') {
      returnedArtifacts = deployments.filter(deployment => deployment.name === artifactName);
      return (returnedArtifacts[0] ? returnedArtifacts[0]._id : null);
    }
  }

  function notAlreadyAdded(type, artifactID) {
    if (type === 'document') {
      if (!vm.group.associatedDocuments) {
        return false;
      }
      return vm.group.associatedDocuments.filter(document => document === artifactID).length;
    }
    if (type === 'pod') {
      if (!vm.group.associatedPods) {
        return false;
      }
      return vm.group.associatedPods.filter(pod => pod === artifactID).length;
    }
    if (type === 'project') {
      if (!vm.group.associatedProjects) {
        return false;
      }
      return vm.group.associatedProjects.filter(project => project === artifactID).length;
    }
    if (type === 'deployment') {
      if (!vm.group.associatedDeployments) {
        return false;
      }
      return vm.group.associatedDeployments.filter(deployment => deployment === artifactID).length;
    }
  }

  vm.addArtifact = function (type) {
    var validID = getArtifactID(type, vm[type].name);
    var duplicate = notAlreadyAdded(type, validID);
    if (!validID) {
      Notification.error({ message: `Associated ${type} not found.`, title: `<i class="glyphicon glyphicon-remove"></i> ${type} association error!` }); // eslint-disable-line max-len
      return;
    }
    if (duplicate) {
      Notification.error({ message: `${type} already associated.`, title: `<i class="glyphicon glyphicon-remove"></i> ${type} association error!` });
      return;
    }

    if (type === 'document') {
      vm.group.associatedDocuments.push(validID);
      vm.currentDocNames = getNamesFromIDs(type, vm.group.associatedDocuments);
      vm.document.name = '';
    }
    if (type === 'pod') {
      vm.group.associatedPods.push(validID);
      vm.currentPodNames = getNamesFromIDs(type, vm.group.associatedPods);
      vm.pod.name = '';
    }
    if (type === 'project') {
      vm.group.associatedProjects.push(validID);
      vm.currentProjectNames = getNamesFromIDs(type, vm.group.associatedProjects);
      vm.project.name = '';
    }
    if (type === 'deployment') {
      vm.group.associatedDeployments.push(validID);
      vm.currentDeploymentNames = getNamesFromIDs(type, vm.group.associatedDeployments);
      vm.deployment.name = '';
    }
  };

  vm.removeArtifact = function (type, artifact) {
    var index;
    if ($window.confirm(`Are you sure you want to remove this ${type} association?`)) {
      if (type === 'document') {
        index = vm.currentDocNames.indexOf(artifact);
        vm.currentDocNames.splice(index, 1);
        vm.group.associatedDocuments.splice(index, 1);
      }
      if (type === 'pod') {
        index = vm.currentPodNames.indexOf(artifact);
        vm.currentPodNames.splice(index, 1);
        vm.group.associatedPods.splice(index, 1);
      }
      if (type === 'project') {
        index = vm.currentProjectNames.indexOf(artifact);
        vm.currentProjectNames.splice(index, 1);
        vm.group.associatedProjects.splice(index, 1);
      }
      if (type === 'deployment') {
        index = vm.currentDeploymentNames.indexOf(artifact);
        vm.currentDeploymentNames.splice(index, 1);
        vm.group.associatedDeployments.splice(index, 1);
      }
    }
  };

  function getIDFromSignum(signum) {
    return users.filter(user => user.username === signum)[0]._id;
  }

  vm.addUser = function () {
    try {
      isUserInDB(vm.signum.toLowerCase());
      vm.group.users.push(getIDFromSignum(vm.signum.toLowerCase()));
      vm.currentUserNames = getNamesFromUserIDs(vm.group.users);
      vm.signum = '';
      return;
    } catch (err) {
      var message = err.data ? err.data.message : err.message;
      Notification.error({ message: message.replace(/\n/g, '<br/>'), title: '<i class="glyphicon glyphicon-remove"></i> Group User Error!' });
    }
  };

  vm.removeUser = function (user) {
    if ($window.confirm('Are you sure you want to remove this user from the group?')) {
      vm.group.users.splice(vm.group.users.indexOf(user), 1);
      vm.currentUserNames.splice(vm.currentUserNames.indexOf(user), 1);
    }
  };

  function isUserInDB(username) {
    for (var index in users) {
      if (users[index].username === username) {
        return true;
      }
    }
    var message = 'Username not in database. Users must have logged in once before they can be added to a group.';
    throw new Error(message);
  }
}
