SchemasViewController.$inject = ['schema', 'dependentDocuments'];

export default function SchemasViewController(schema, dependentDocuments) {
  var vm = this;
  vm.schema = schema;
  vm.dependentDocuments = dependentDocuments;
}
