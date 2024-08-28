import _ from 'lodash';
var $ = require('jquery');
require('datatables')();
require('datatables.net-scroller')(window, $);

LabelsListController.$inject = ['$scope', '$state', '$window', 'Notification', 'labels'];

export default function LabelsListController($scope, $state, $window, Notification, labels) {
  var vm = this;
  vm.labels = labels;
  vm.scrollYheight = '60vh';

  $(document).ready(function () {
    refreshAllTables();
  });

  function refreshAllTables() {
    var dataTables = $.fn.dataTable.tables();
    $(dataTables).each(function () {
      $(this).dataTable().fnDestroy();
    });

    $('#labels-list-table').dataTable({
      data: vm.labels,
      columns: [
        {
          title: 'Name',
          data: 'name'
        },
        {
          title: 'Category',
          data: 'category'
        },
        {
          title: 'Actions',
          orderable: false,
          searchable: false,
          data: null,
          width: '175px',
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

    $('#labels-list-table').on('click', 'tbody tr', function () {
      var label = $('#labels-list-table').dataTable().api().row(this)
        .data();
      $state.go('labels.view', { labelId: label._id });
      removeTable();
    });

    $('#labels-list-table').on('click', '.view-button', function (e) {
      e.stopPropagation();
      var tr = $(this).parents('tr');
      var label = $('#labels-list-table').dataTable().api().row(tr)
        .data();
      $state.go('labels.view', { labelId: label._id });
      removeTable();
    });

    $('#labels-list-table').on('click', '.edit-button', function (e) {
      e.stopPropagation();
      var tr = $(this).parents('tr');
      var label = $('#labels-list-table').dataTable().api().row(tr)
        .data();
      $state.go('labels.edit', { labelId: label._id });
      removeTable();
    });

    $('#labels-list-table').on('click', '.delete-button', function (e) {
      e.stopPropagation();
      var tr = $(this).parents('tr');
      var row = $('#labels-list-table').dataTable().api().row(tr);
      var label = row.data();
      var displayName = label.name;
      if ($window.confirm(`Are you sure you want to delete this label "${displayName}"?`)) {
        label.$delete()
          .then(successCallback)
          .catch(errorCallback);
      }

      function successCallback() {
        vm.labels.splice(vm.labels.indexOf(label), 1);
        Notification.success({ message: `<i class="glyphicon glyphicon-ok"></i> Label "${displayName}" deleted successfully!` });
        row.remove().draw();
      }

      function errorCallback(res) {
        Notification.error({
          message: res.data.message.replace(/\n/g, '<br/>'),
          title: `<i class="glyphicon glyphicon-remove"></i> Label "${displayName}" deletion failed!`
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
    $('#labels-list-table').DataTable().search(value).draw(); // eslint-disable-line new-cap
  }

  function removeTable() {
    $('#labels-list-table').dataTable().api().clear();
    $('.edit-button').remove();
    $('.delete-button').remove();
  }
}
