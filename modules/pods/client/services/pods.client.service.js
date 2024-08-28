PodsService.$inject = ['$resource', '$log'];

export default function PodsService($resource, $log) {
  var Pod = $resource('/api/pods/:podId', {
    podId: '@_id'
  }, {
    update: {
      method: 'PUT'
    }
  });

  angular.extend(Pod.prototype, {
    createOrUpdate: function () {
      var pod = this;
      return createOrUpdate(pod);
    }
  });
  return Pod;

  function createOrUpdate(pod) {
    if (pod._id) {
      return pod.$update(onSuccess, onError);
    }
    return pod.$save(onSuccess, onError);

    function onSuccess() {
    }

    function onError(errorResponse) {
      $log.error(errorResponse.data);
    }
  }
}
