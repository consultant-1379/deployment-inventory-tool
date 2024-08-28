ProjectsService.$inject = ['$resource', '$log'];

export default function ProjectsService($resource, $log) {
  var Project = $resource('/api/projects/:projectId', {
    projectId: '@_id'
  }, {
    update: {
      method: 'PUT'
    }
  });

  angular.extend(Project.prototype, {
    createOrUpdate: function () {
      var project = this;
      return createOrUpdate(project);
    }
  });
  return Project;

  function createOrUpdate(project) {
    if (project._id) {
      return project.$update(onSuccess, onError);
    }
    return project.$save(onSuccess, onError);

    function onSuccess() {
    }

    function onError(errorResponse) {
      $log.error(errorResponse.data);
    }
  }
}
