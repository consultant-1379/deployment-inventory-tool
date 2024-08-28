LabelsCreateController.$inject = ['$scope', '$state', 'label',
  'Notification', 'restoredata', 'creatingFromScratch', 'dependentDocuments'];

export default function LabelsCreateController(
  $scope, $state, label, Notification,
  restoredata, creatingFromScratch, dependentDocuments
) {
  var vm = this;
  vm.label = label;
  vm.hasDependentDocuments = (dependentDocuments.length > 0);

  if (restoredata) {
    Object.keys(restoredata).forEach(function (key) {
      vm.label[key] = restoredata[key];
    });
  }

  if (creatingFromScratch && !restoredata) {
    vm.pageTitle = 'Creating label';
  } else {
    vm.pageTitle = (restoredata) ? 'Restoring label' : 'Editing label';
  }

  vm.categories = ['size', 'site', 'other'];

  vm.submitForm = async function () {
    try {
      vm.formSubmitting = true;
      await vm.label.createOrUpdate();
    } catch (err) {
      vm.formSubmitting = false;
      Notification.error({ message: err.data.message.replace(/\n/g, '<br/>'), title: '<i class="glyphicon glyphicon-remove"></i> Label creation error!' });
      return;
    }
    $state.go('labels.view', { labelId: vm.label._id });
    if (creatingFromScratch && !restoredata) {
      Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> Label creation successful!' });
    } else {
      Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> Label updated successfully!' });
    }
  };

  if (restoredata) {
    vm.submitForm();
  }
}
