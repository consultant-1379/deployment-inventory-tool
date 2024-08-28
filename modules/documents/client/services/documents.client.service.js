DocumentsService.$inject = ['$resource', '$log'];

export default function DocumentsService($resource, $log) {
  var Document = $resource('/api/documents/:documentId', {
    documentId: '@_id'
  }, {
    update: {
      method: 'PUT'
    }
  });

  angular.extend(Document.prototype, {
    createOrUpdate: function () {
      var document = this;
      return createOrUpdate(document);
    }
  });
  return Document;

  function createOrUpdate(document) {
    if (document._id) {
      return document.$update(onSuccess, onError);
    }
    return document.$save(onSuccess, onError);

    function onSuccess() {
    }

    function onError(errorResponse) {
      $log.error(errorResponse.data);
    }
  }
}
