import _ from 'lodash';

UsersListController.$inject = ['$scope', '$window', 'Notification', 'users'];
var $ = require('jquery');
require('datatables')();
require('datatables.net-scroller')(window, $);

export default function UsersListController($scope, $window, Notification, users) {
  var vm = this;
  vm.users = users;
  vm.admins = vm.users.filter(user => user.roles[0] === 'admin' || user.roles[0] === 'superAdmin');
  vm.scrollYheight = '60vh';

  $(document).ready(function () {
    refreshAllTables();
  });

  function refreshAllTables() {
    var dataTables = $.fn.dataTable.tables();
    $(dataTables).each(function () {
      $(this).dataTable().fnDestroy();
    });

    var table = $('#admins-list-table').dataTable({
      data: vm.admins,
      columns: [
        {
          title: 'Name',
          data: 'displayName'
        },
        {
          title: 'Signum',
          data: 'username'
        },
        {
          title: 'Account Type',
          data: 'roles[0]'
        },
        {
          title: 'Actions',
          searchable: false,
          orderable: false,
          data: null,
          width: '135px',
          defaultContent: '<button class="delete-button btn btn-sm btn-danger">Delete</button>'
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

    $('#admins-list-table').on('click', '.delete-button', function (e) {
      e.stopPropagation();
      var tr = $(this).parents('tr');
      var row = table.api().row(tr);
      var user = row.data();
      var accountType = user.roles[0];
      if ($window.confirm(`Are you sure you want to remove this ${accountType} user "${user.displayName}"?`)) {
        user.roles = ['user'];
        user.$update()
          .then(successCallback)
          .catch(errorCallback);
      }

      function successCallback() {
        vm.admins.splice(vm.admins.indexOf(user), 1);
        Notification.success({ message: `<i class="glyphicon glyphicon-ok"></i> User "${user.displayName}" is no longer an ${accountType} user!` });
        row.remove().draw();
      }

      function errorCallback(res) {
        Notification.error({
          message: res.data.message.replace(/\n/g, '<br/>'),
          title: `<i class="glyphicon glyphicon-remove"></i> User "${user.displayName}" operation failed!`
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
    $('#admins-list-table').DataTable().search(value).draw(); // eslint-disable-line new-cap
  }
}
