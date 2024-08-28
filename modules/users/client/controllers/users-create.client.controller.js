UsersCreateController.$inject = ['$scope', '$state', 'users', 'Notification'];

export default function UsersCreateController($scope, $state, users, Notification) {
  var vm = this;
  vm.users = users;
  vm.pageTitle = 'Creating admin';

  vm.submitForm = async function () {
    try {
      vm.formSubmitting = true;
      if (await isUserInDB(vm.user.name)) {
        var user = await vm.users.filter(user => user.username === vm.user.name)[0];
        user.roles = ['admin'];
        await user.$update();
      }
    } catch (err) {
      vm.formSubmitting = false;
      var message = err.data ? err.data.message : err.message;
      Notification.error({ message: message.replace(/\n/g, '<br/>'), title: '<i class="glyphicon glyphicon-remove"></i> Admin creation error!' });
      return;
    }
    $state.go('users.list');
    Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> Admin creation successful!' });
  };

  function isUserInDB(username) {
    for (var index in users) {
      if (users[index].username === username) {
        return true;
      }
    }
    var message = 'Username not in database. User must have logged in once before they can be added as an admin.';
    throw new Error(message);
  }
}
