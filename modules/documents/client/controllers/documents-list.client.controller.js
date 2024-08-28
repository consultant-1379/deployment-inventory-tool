import _ from 'lodash';
import semver from 'semver';
import { formatDate, generateEmailElement } from '../../../core/client/controllers/helpers.client.controller';
var $ = require('jquery');
require('datatables')();
require('datatables.net-scroller')(window, $);


DocumentsListController.$inject = ['$scope', '$state', '$window', 'Notification', '$timeout', 'documents', 'schemas', 'documentsHistory', 'title', 'showDocumentsFromAllSchemaVersions'];
// eslint-disable-next-line max-len
export default function DocumentsListController($scope, $state, $window, Notification, $timeout, documents, schemas, documentsHistory, title, showDocumentsFromAllSchemaVersions) {
  var vm = this;
  vm.title = title;
  vm.scrollYheight = '60vh';
  vm.showDocumentsFromAllSchemaVersions = showDocumentsFromAllSchemaVersions;

  documents = documents.map(function (document) {
    document.schema = schemas.find(schema => schema._id === document.schema_id);
    document.history = documentsHistory.find(history => history.associated_id === document._id);
    return document;
  });

  var fullVersionDocuments = documents.filter(function (document) {
    if (document.schema) {
      return `${semver.major(document.schema.version)}.${semver.minor(document.schema.version)}.${semver.patch(document.schema.version)}` === document.schema.version; // eslint-disable-line max-len
    }
    return null;
  });

  vm.setVisibleDocuments = function () {
    $timeout(function () {
      var visibleDocuments = (vm.showDocumentsFromAllSchemaVersions) ? documents : fullVersionDocuments;
      if (!_.isEqual(vm.documents, visibleDocuments)) {
        vm.documents = visibleDocuments;
      }
      if ($.fn.DataTable.isDataTable('#documents-list-table')) {
        $('#documents-list-table').DataTable().clear().rows.add(vm.documents).draw(); // eslint-disable-line new-cap
      }
      filterAllTables($('#filter-field').val());
    });
  };

  vm.setVisibleDocuments();

  $(document).ready(function () {
    refreshAllTables();
  });

  function refreshAllTables() {
    var dataTables = $.fn.dataTable.tables();
    $(dataTables).each(function () {
      $(this).dataTable().fnDestroy();
    });

    $('#documents-list-table').dataTable({
      data: vm.documents,
      columns: [
        {
          title: 'Name',
          data: 'name'
        },
        {
          title: 'IP Version',
          data: null,
          render: function (data) {
            if (data.content && data.content.parameters) return data.content.parameters.ip_version || '-';
          }
        },
        {
          title: 'Schema Name',
          data: null,
          render: function (data) {
            if (data.schema) return data.schema.name;
          }
        },
        {
          title: 'Schema Version',
          data: null,
          render: function (data) {
            if (data.schema) return data.schema.version;
          }
        },
        {
          title: 'Created By',
          data: null,
          render: function (data) {
            return (data.history) ? generateEmailElement('Document', data.name, data.history.createdBy) : 'UNKNOWN USER';
          }
        },
        {
          title: 'Created At',
          data: null,
          render: function (data) {
            return formatDate(data.created_at);
          }
        },
        {
          title: 'Last Modified At',
          data: null,
          render: function (data) {
            return formatDate(data.updated_at);
          }
        },
        {
          title: 'Actions',
          orderable: false,
          searchable: false,
          data: null,
          width: '170px',
          defaultContent: '<button class="view-button btn btn-sm btn-info">View</button>&nbsp;' +
                          '<button class="edit-button btn btn-sm btn-primary">Edit</button>&nbsp;' +
                          '<button class="delete-button btn btn-sm btn-danger">Delete</button>'
        }
      ],
      order: [[0, 'asc']],
      columnDefs: [{
        defaultContent: '-',
        targets: '_all'
      }],
      sDom: 'Brti',
      paging: true,
      paginate: true,
      scrollY: vm.scrollYheight,
      scrollCollapse: true,
      deferRender: true,
      scroller: true,
      info: false,
      bLengthChange: false,
      searching: true
    });

    $('#documents-list-table').on('click', 'tbody tr', function () {
      var document = $('#documents-list-table').dataTable().api().row(this)
        .data();
      $state.go('documents.view', { documentId: document._id });
      removeTable();
    });

    $('#documents-list-table').on('click', '.view-button', function (e) {
      e.stopPropagation();
      var tr = $(this).parents('tr');
      var document = $('#documents-list-table').dataTable().api().row(tr)
        .data();
      $state.go('documents.view', { documentId: document._id });
      removeTable();
    });

    $('#documents-list-table').on('click', '.edit-button', function (e) {
      e.stopPropagation();
      var tr = $(this).parents('tr');
      var document = $('#documents-list-table').dataTable().api().row(tr)
        .data();
      var stateToGo;
      switch (vm.title) {
        case 'vENM SEDs': stateToGo = 'editEnmSed'; break;
        case 'cENM SEDs': stateToGo = 'editcEnmSed'; break;
        case 'VNF LCM SEDs': stateToGo = 'editVnfLcmSed'; break;
        case 'Other Documents': stateToGo = 'editOther'; break;
        case 'Managed Configs': stateToGo = 'editManagedConfig'; break;
        default: break;
      }
      $state.go(`documents.${stateToGo}`, { documentId: document._id });
      removeTable();
    });

    $('#documents-list-table').on('click', '.delete-button', function (e) {
      e.stopPropagation();
      var tr = $(this).parents('tr');
      var row = $('#documents-list-table').dataTable().api().row(tr);
      var document = row.data();
      var displayName = document.name;
      if ($window.confirm(`Are you sure you want to delete this document "${displayName}"?`)) {
        document.$delete()
          .then(successCallback)
          .catch(errorCallback);
      }

      function successCallback() {
        documents.splice(documents.indexOf(document), 1);
        fullVersionDocuments.splice(fullVersionDocuments.indexOf(document), 1);
        Notification.success({ message: `<i class="glyphicon glyphicon-ok"></i> Document "${displayName}" deleted successfully!` });
        row.remove().draw();
      }

      function errorCallback(res) {
        Notification.error({
          message: res.data.message.replace(/\n/g, '<br/>'),
          title: `<i class="glyphicon glyphicon-remove"></i> Document "${displayName}" deletion failed!`
        });
      }
    });

    $('.dataTables_scrollBody').css('height', vm.scrollYheight);
    _.defer(function () { $scope.$apply(); });
  }

  $('#filter-field').on('keyup click', () => filterAllTables($('#filter-field').val()));

  $('#filter-field').keyup(function () {
    $('.search-clear').toggle(Boolean($(this).val()));
  });

  $('.search-clear').toggle(Boolean($('#filter-field').val()));

  $('.search-clear').click(function () {
    $('#filter-field').val('').focus();
    $(this).hide();
    filterAllTables($('#filter-field').val());
  });

  function filterAllTables(value) {
    $('#documents-list-table').DataTable().search(value).draw(); // eslint-disable-line new-cap
  }

  function removeTable() {
    $('#documents-list-table').dataTable().api().clear();
    $('.edit-button').remove();
    $('.delete-button').remove();
  }
}
