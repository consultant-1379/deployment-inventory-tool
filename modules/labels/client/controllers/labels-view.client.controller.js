LabelsViewController.$inject = ['$scope', '$state', 'label', 'dependentDocuments'];

export default function LabelsViewController($scope, $state, label, dependentDocuments) {
  var vm = this;
  vm.label = label;
  vm.dependentDocuments = dependentDocuments.reverse();
}
