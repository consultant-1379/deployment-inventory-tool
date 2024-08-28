import _ from 'lodash';
import semver from 'semver';
var $ = require('jquery');
require('datatables')();
require('datatables.net-scroller')(window, $);


GroupsListController.$inject = ['$scope', '$document', '$state', '$window', 'Notification', 'Authentication', 'groups', 'users'];

export default function GroupsListController($scope, $document, $state, $window, Notification, Authentication, groups, users) {
  var vm = this;
  vm.groups = groups;
  vm.users = users;
  vm.Authentication = Authentication;
  vm.scrollYheight = '60vh';

  function getNameFromId(userId) {
    return users.filter(user => user._id === userId)[0].displayName;
  }

  $(() => { refreshAllTables(); });

  function refreshAllTables() {
    var dataTables = $.fn.dataTable.tables();
    $(dataTables).each(function () {
      $(this).dataTable().fnDestroy();
    });

    var table = $('#groups-list-table').dataTable({
      data: vm.groups,
      columns: [
        {
          title: 'Name',
          data: 'name'
        },
        {
          title: 'Admin',
          data: null,
          render: function (data) {
            var name = '';
            data.admin_IDs.forEach(adminId => {
              name = `${name}${getNameFromId(adminId)} `;
            });
            return name;
          }
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

    if (vm.Authentication.user.roles[0] !== 'superAdmin') {
      var numOfRows = table.api().rows().count();
      for (var i = 0; i < numOfRows; i += 1) {
        $document[0].getElementsByClassName('delete-button')[i].style.visibility = 'hidden';
      }
    }


    $('#groups-list-table').on('click', 'tbody tr', function () {
      var group = table.api().row(this).data();
      $state.go('groups.view', { groupId: group._id });
    });

    $('#groups-list-table').on('click', '.view-button', function (e) {
      e.stopPropagation();
      var tr = $(this).parents('tr');
      var group = table.api().row(tr).data();
      $state.go('groups.view', { groupId: group._id });
    });

    $('#groups-list-table').on('click', '.edit-button', function (e) {
      e.stopPropagation();
      var tr = $(this).parents('tr');
      var group = table.api().row(tr).data();
      $state.go('groups.edit', { groupId: group._id });
    });

    $('#groups-list-table').on('click', '.delete-button', function (e) {
      e.stopPropagation();
      var tr = $(this).parents('tr');
      var row = table.api().row(tr);
      var group = row.data();
      var displayName = group.name;
      if ($window.confirm(`Are you sure you want to delete this Group "${displayName}"?`)) {
        group.$delete()
          .then(successCallback)
          .catch(errorCallback);
      }

      function successCallback() {
        vm.groups.splice(vm.groups.indexOf(group), 1);
        Notification.success({ message: `<i class="glyphicon glyphicon-ok"></i> Group "${displayName}" deleted successfully!` });
        row.remove().draw();
      }

      function errorCallback(res) {
        Notification.error({
          message: res.data.message.replace(/\n/g, '<br/>'),
          title: `<i class="glyphicon glyphicon-remove"></i> Group "${displayName}" deletion failed!`
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
    $('#groups-list-table').DataTable().search(value).draw(); // eslint-disable-line new-cap
  }
}
