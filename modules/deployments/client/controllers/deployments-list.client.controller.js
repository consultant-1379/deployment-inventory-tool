import _ from 'lodash';
import { formatDate } from '../../../core/client/controllers/helpers.client.controller';

DeploymentsListController.$inject = ['$scope', '$state', '$window', 'Notification', 'deployments', 'deploymentsHistory'];
var $ = require('jquery');
require('datatables')();
require('datatables.net-scroller')(window, $);

export default function DeploymentsListController($scope, $state, $window, Notification, deployments, deploymentsHistory) {
  var vm = this;

  deployments = deployments.map(function (deployment) {
    deployment.history = deploymentsHistory.find(history => history.associated_id === deployment._id);
    return deployment;
  });
  vm.deployments = deployments;
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

    $('#deployments-list-table').dataTable({
      data: vm.deployments,
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
          orderable: false,
          searchable: false,
          data: null,
          width: '180px',
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

    $('#deployments-list-table').on('click', 'tbody tr', function () {
      var deployment = $('#deployments-list-table').dataTable().api().row(this)
        .data();
      $state.go('deployments.view', { deploymentId: deployment._id });
      removeTable();
    });

    $('#deployments-list-table').on('click', '.view-button', function (e) {
      e.stopPropagation();
      var tr = $(this).parents('tr');
      var deployment = $('#deployments-list-table').dataTable().api().row(tr)
        .data();
      $state.go('deployments.view', { deploymentId: deployment._id });
      removeTable();
    });

    $('#deployments-list-table').on('click', '.edit-button', function (e) {
      e.stopPropagation();
      var tr = $(this).parents('tr');
      var deployment = $('#deployments-list-table').dataTable().api().row(tr)
        .data();
      $state.go('deployments.edit', { deploymentId: deployment._id });
      removeTable();
    });

    $('#deployments-list-table').on('click', '.delete-button', function (e) {
      e.stopPropagation();
      var tr = $(this).parents('tr');
      var row = $('#deployments-list-table').dataTable().api().row(tr);
      var deployment = row.data();
      var displayName = deployment.name;
      if ($window.confirm(`Are you sure you want to delete this deployment "${displayName}"?`)) {
        deployment.$delete()
          .then(successCallback)
          .catch(errorCallback);
      }

      function successCallback() {
        vm.deployments.splice(vm.deployments.indexOf(deployment), 1);
        Notification.success({ message: `<i class="glyphicon glyphicon-ok"></i> Deployment "${displayName}" deleted successfully!` });
        row.remove().draw();
      }

      function errorCallback(res) {
        Notification.error({
          message: res.data.message.replace(/\n/g, '<br/>'),
          title: `<i class="glyphicon glyphicon-remove"></i> Deployment "${displayName}" deletion failed!`,
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
    $('#deployments-list-table').DataTable().search(value).draw(); // eslint-disable-line new-cap
  }

  function removeTable() {
    $('#deployments-list-table').dataTable().api().clear();
    $('.edit-button').remove();
    $('.delete-button').remove();
  }
}
