import _ from 'lodash';
import semver from 'semver';
import { formatDate } from '../../../core/client/controllers/helpers.client.controller';
var $ = require('jquery');
require('datatables')();
require('datatables.net-scroller')(window, $);

SchemasListController.$inject = ['$scope', '$state', '$window', 'Notification', '$timeout', 'schemas'];

export default function SchemasListController($scope, $state, $window, Notification, $timeout, schemas) {
  var vm = this;
  vm.showAllSchemaVersions = false;
  vm.scrollYheight = '60vh';

  var fullVersionSchemas = schemas.filter(function (schema) {
    return `${semver.major(schema.version)}.${semver.minor(schema.version)}.${semver.patch(schema.version)}` === schema.version;
  });

  vm.setVisibleSchemas = function () {
    $timeout(function () {
      vm.schemas = (vm.showAllSchemaVersions) ? schemas : fullVersionSchemas;
      if ($.fn.DataTable.isDataTable('#schemas-list-table')) {
        $('#schemas-list-table').DataTable().clear().rows.add(vm.schemas).draw(); // eslint-disable-line new-cap
      }
      filterAllTables($('#filter-field').val());
    });
  };

  vm.setVisibleSchemas();

  $(document).ready(function () {
    refreshAllTables();
  });

  function refreshAllTables() {
    var dataTables = $.fn.dataTable.tables();
    $(dataTables).each(function () {
      $(this).dataTable().fnDestroy();
    });

    $('#schemas-list-table').dataTable({
      data: vm.schemas,
      columns: [
        {
          title: 'Name',
          data: 'name'
        },
        {
          title: 'Version',
          data: 'version'
        },
        {
          title: 'Category',
          data: 'category'
        },
        {
          title: 'Created At',
          data: null,
          render: function (data) {
            return formatDate(data.created_at);
          }
        },
        {
          title: 'Actions',
          orderable: false,
          searchable: false,
          data: null,
          width: '135px',
          defaultContent: '<button class="view-button btn btn-sm btn-info">View</button>&nbsp;' +
                          '<button class="delete-button btn btn-sm btn-danger">Delete</button>'
        }
      ],
      order: [[3, 'desc']],
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

    $('#schemas-list-table').on('click', 'tbody tr', function () {
      var schema = $('#schemas-list-table').dataTable().api().row(this)
        .data();
      $state.go('schemas.view', { schemaId: schema._id });
      removeTable();
    });

    $('#schemas-list-table').on('click', '.view-button', function (e) {
      e.stopPropagation();
      var tr = $(this).parents('tr');
      var schema = $('#schemas-list-table').dataTable().api().row(tr)
        .data();
      $state.go('schemas.view', { schemaId: schema._id });
      removeTable();
    });

    $('#schemas-list-table').on('click', '.delete-button', function (e) {
      e.stopPropagation();
      var tr = $(this).parents('tr');
      var row = $('#schemas-list-table').dataTable().api().row(tr);
      var schema = row.data();
      var displayName = schema.name;
      if ($window.confirm(`Are you sure you want to delete this schema "${displayName}"?`)) {
        schema.$delete()
          .then(successCallback)
          .catch(errorCallback);
      }

      function successCallback() {
        schemas.splice(schemas.indexOf(schema), 1);
        fullVersionSchemas.splice(fullVersionSchemas.indexOf(schema), 1);
        vm.setVisibleSchemas();
        Notification.success({ message: `<i class="glyphicon glyphicon-ok"></i> Schema "${displayName}" deleted successfully!` });
        row.remove().draw();
      }

      function errorCallback(res) {
        Notification.error({
          message: res.data.message.replace(/\n/g, '<br/>'),
          title: `<i class="glyphicon glyphicon-remove"></i> Schema "${displayName}" deletion failed!`,
          delay: 7000
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
    $('#schemas-list-table').DataTable().search(value).draw(); // eslint-disable-line new-cap
  }

  function removeTable() {
    $('#schemas-list-table').dataTable().api().clear();
    $('.delete-button').remove();
  }
}
