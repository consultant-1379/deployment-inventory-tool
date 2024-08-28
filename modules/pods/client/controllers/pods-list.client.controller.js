import _ from 'lodash';
import { formatDate } from '../../../core/client/controllers/helpers.client.controller';

PodsListController.$inject = ['$scope', '$state', '$window', 'Notification', 'pods', 'podsHistory'];
var $ = require('jquery');
require('datatables')();
require('datatables.net-scroller')(window, $);

export default function PodsListController($scope, $state, $window, Notification, pods, podsHistory) {
  var vm = this;

  pods = pods.map(function (pod) {
    pod.history = podsHistory.find(history => history.associated_id === pod._id);
    return pod;
  });

  vm.pods = pods;
  vm.scrollYheight = '60vh';

  $(document).ready(function () {
    refreshAllTables();
  });

  function refreshAllTables() {
    var dataTables = $.fn.dataTable.tables();
    $(dataTables).each(function () {
      $(this).dataTable().fnDestroy();
    });

    function generateDateField(data) {
      return (data.history && !data.history.createdAt.includes('1970-')) ? formatDate(data.history.createdAt) : 'UNKNOWN DATE';
    }

    $('#pods-list-table').dataTable({
      data: vm.pods,
      columns: [
        {
          title: 'Name',
          data: 'name'
        },
        {
          title: 'Created At',
          data: null,
          render: function (data) {
            return generateDateField(data);
          }
        },
        {
          title: 'Last Modified At',
          data: null,
          render: function (data) {
            if (data.history && data.history.updates.length > 0) {
              return formatDate(data.history.updates.slice(-1)[0].updatedAt);
            }
            return generateDateField(data);
          }
        },
        {
          title: 'Actions',
          searchable: false,
          orderable: false,
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

    $('#pods-list-table').on('click', 'tbody tr', function () {
      var pod = $('#pods-list-table').dataTable().api().row(this)
        .data();
      $state.go('pods.view', { podId: pod._id });
      removeTable();
    });

    $('#pods-list-table').on('click', '.view-button', function (e) {
      e.stopPropagation();
      var tr = $(this).parents('tr');
      var pod = $('#pods-list-table').dataTable().api().row(tr)
        .data();
      $state.go('pods.view', { podId: pod._id });
      removeTable();
    });

    $('#pods-list-table').on('click', '.edit-button', function (e) {
      e.stopPropagation();
      var tr = $(this).parents('tr');
      var pod = $('#pods-list-table').dataTable().api().row(tr)
        .data();
      $state.go('pods.edit', { podId: pod._id });
      removeTable();
    });

    $('#pods-list-table').on('click', '.delete-button', function (e) {
      e.stopPropagation();
      var tr = $(this).parents('tr');
      var row = $('#pods-list-table').dataTable().api().row(tr);
      var pod = row.data();
      var displayName = pod.name;
      if ($window.confirm(`Are you sure you want to delete this pod "${displayName}"?`)) {
        pod.$delete()
          .then(successCallback)
          .catch(errorCallback);
      }

      function successCallback() {
        pods.splice(pods.indexOf(pod), 1);
        Notification.success({ message: `<i class="glyphicon glyphicon-ok"></i> Pod "${displayName}" deleted successfully!` });
        row.remove().draw();
      }

      function errorCallback(res) {
        Notification.error({
          message: res.data.message.replace(/\n/g, '<br/>'),
          title: `<i class="glyphicon glyphicon-remove"></i> Pod "${displayName}" deletion failed!`
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
    $('#pods-list-table').DataTable().search(value).draw(); // eslint-disable-line new-cap
  }

  function removeTable() {
    $('#pods-list-table').dataTable().api().clear();
    $('.edit-button').remove();
    $('.delete-button').remove();
  }
}
