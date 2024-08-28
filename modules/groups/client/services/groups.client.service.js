GroupsService.$inject = ['$resource', '$log'];

export default function GroupsService($resource, $log) {
  var Group = $resource('/api/groups/:groupId', {
    groupId: '@_id'
  }, {
    update: {
      method: 'PUT'
    }
  });

  angular.extend(Group.prototype, {
    createOrUpdate: function () {
      var group = this;
      return createOrUpdate(group);
    }
  });
  return Group;

  function createOrUpdate(group) {
    if (group._id) {
      return group.$update(onSuccess, onError);
    }
    return group.$save(onSuccess, onError);

    function onSuccess() {
    }

    function onError(errorResponse) {
      $log.error(errorResponse.data);
    }
  }
}
