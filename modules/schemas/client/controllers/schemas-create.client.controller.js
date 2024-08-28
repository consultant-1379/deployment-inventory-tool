SchemasCreateController.$inject = ['$scope', '$state', 'schema', 'Notification', 'restoredata'];

export default function SchemasCreateController($scope, $state, schema, Notification, restoredata) {
  var vm = this;
  vm.schema = schema;
  if (restoredata) {
    Object.keys(restoredata).forEach(function (key) {
      vm.schema[key] = restoredata[key];
    });
  }
  vm.formSubmitting = false;
  vm.pageTitle = (restoredata) ? 'Restoring schema' : 'Creating schema';

  vm.submitForm = function () {
    vm.formSubmitting = true;
    vm.schema.$save(successCallback, errorCallback);

    function successCallback() {
      $state.go('schemas.view', { schemaId: vm.schema._id });
      Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> Schema created successfully!' });
    }
    function errorCallback(res) {
      vm.formSubmitting = false;
      Notification.error({ message: res.data.message.replace(/\n/g, '<br/>'), title: '<i class="glyphicon glyphicon-remove"></i> Schema creation error!' });
    }
  };

  if (restoredata) {
    vm.submitForm();
  }
}
