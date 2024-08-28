import _ from 'lodash';
import { formatDate, generateEmailElement } from '../../../core/client/controllers/helpers.client.controller';
var $ = require('jquery');
require('datatables')();
require('datatables.net-scroller')(window, $);

ProjectsListController.$inject = ['$scope', '$state', '$window', 'Notification', 'projects', 'pods', 'projectsHistory'];
export default function ProjectsListController($scope, $state, $window, Notification, projects, pods, projectsHistory) {
  var vm = this;
  vm.pods = pods;
  vm.scrollYheight = '60vh';
  projects = projects.map(function (project) {
    project.history = projectsHistory.find(history => history.associated_id === project._id);
    return project;
  });
  vm.projects = projects;

  $(document).ready(function () {
    refreshAllTables();
  });

  function refreshAllTables() {
    var dataTables = $.fn.dataTable.tables();
    $(dataTables).each(function () {
      $(this).dataTable().fnDestroy();
    });

    $('#projects-list-table').dataTable({
      data: vm.projects,
      columns: [
        {
          title: 'Name',
          data: 'name'
        },
        {
          title: 'Related Pod',
          data: null,
          render: function (data) {
            for (var i = 0; i < vm.pods.length; i += 1) {
              if (vm.pods[i]._id === data.pod_id) {
                return vm.pods[i].name;
              }
            }
          }
        },
        {
          title: 'Created By',
          data: null,
          render: function (data) {
            return (data.history) ? generateEmailElement('Project', data.name, data.history.createdBy) : 'UNKNOWN USER';
          }
        },
        {
          title: 'Created At',
          data: null,
          render: function (data) {
            return (data.history) ? formatDate(data.history.createdAt) : 'UNKNOWN DATE';
          }
        },
        {
          title: 'Last Modified At',
          data: null,
          render: function (data) {
            return (data.history) ? formatDate((data.history.updates.length > 0) ? data.history.updates.slice(-1)[0].updatedAt : data.history.createdAt) : 'UNKNOWN DATE';
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

    $('#projects-list-table').on('click', 'tbody tr', function () {
      var project = $('#projects-list-table').dataTable().api().row(this)
        .data();
      $state.go('projects.view', { projectId: project._id });
      removeTable();
    });

    $('#projects-list-table').on('click', '.view-button', function (e) {
      e.stopPropagation();
      var tr = $(this).parents('tr');
      var project = $('#projects-list-table').dataTable().api().row(tr)
        .data();
      $state.go('projects.view', { projectId: project._id });
      removeTable();
    });

    $('#projects-list-table').on('click', '.edit-button', function (e) {
      e.stopPropagation();
      var tr = $(this).parents('tr');
      var project = $('#projects-list-table').dataTable().api().row(tr)
        .data();
      $state.go('projects.edit', { projectId: project._id });
      removeTable();
    });

    $('#projects-list-table').on('click', '.delete-button', function (e) {
      e.stopPropagation();
      var tr = $(this).parents('tr');
      var row = $('#projects-list-table').dataTable().api().row(tr);
      var project = row.data();
      var displayName = project.name;
      if ($window.confirm(`Are you sure you want to delete this project "${displayName}"?`)) {
        project.$delete()
          .then(successCallback)
          .catch(errorCallback);
      }

      function successCallback() {
        vm.projects.splice(vm.projects.indexOf(project), 1);
        Notification.success({ message: `<i class="glyphicon glyphicon-ok"></i> Project "${displayName}" deleted successfully!` });
        row.remove().draw();
      }

      function errorCallback(res) {
        Notification.error({
          message: res.data.message.replace(/\n/g, '<br/>'),
          title: `<i class="glyphicon glyphicon-remove"></i> Project "${displayName}" deletion failed!`
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
    $('#projects-list-table').DataTable().search(value).draw(); // eslint-disable-line new-cap
  }

  function removeTable() {
    $('#projects-list-table').dataTable().api().clear();
    $('.edit-button').remove();
    $('.delete-button').remove();
  }
}
