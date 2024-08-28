SchemasService.$inject = ['$resource', '$log'];

export default function SchemasService($resource, $log) {
  var Schema = $resource('/api/schemas/:schemaId', {
    schemaId: '@_id'
  });
  return Schema;
}
