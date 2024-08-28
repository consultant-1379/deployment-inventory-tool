import _ from 'lodash';
import semver from 'semver';
import { generateEmailElement, historyFormatDate } from '../../../core/client/controllers/helpers.client.controller';
var $ = require('jquery');
require('datatables')();
require('datatables.net-scroller')(window, $);

HistoryListController.$inject = ['$state', '$scope', '$compile', '$stateParams', '$timeout', 'logs', 'schemas'];
export default function HistoryListController($state, $scope, $compile, $stateParams, $timeout, logs, schemas) {
  var vm = this;
  vm.objType = $stateParams.objType;
  vm.objectType = vm.objType.substring(0, 1).toUpperCase() + vm.objType.substring(1, vm.objType.length);
  vm.logs = logs;
  logs = getLogsWithCurrentNames(logs);
  vm.documentTypes = ['Managed Configs'];
  vm.scrollYheight = $(window).height() / 5;

  if (vm.objType === 'schemas') {
    var fullVersionLogs = returnVisibleLogs(logs);
    vm.showAllLogVersions = false;

    vm.setVisibleLogs = function () {
      $timeout(function () {
        vm.logs = (vm.showAllLogVersions) ? logs : fullVersionLogs;
        $scope.$apply();
        refreshAllTables();
        filterAllTables($('#filter-field').val());
      });
    };
  }

  if (vm.objType === 'documents') {
    logs = logs.map(function (log) {
      log.schema = schemas.find(schema => schema._id === log.originalData.schema_id);
      return log;
    });
  }

  // Uniue Category Assigned With Proper Name Convention
  logs.forEach(log => {
    if (log.schema !== undefined) {
      var category = `${(log.schema.category === 'enm' ? 'v' : '')}${log.schema.category} Documents`;
      if ((!vm.documentTypes.includes(category))) vm.documentTypes.push(category);
    }
  });

  // On Document Load
  $(document).ready(function () {
    // populate vENM SEDs on load
    if (vm.objType === 'documents') vm.switchDocumentLogs('venm Documents');
    refreshAllTables();
  });

  function refreshAllTables() {
    var dataTables = $.fn.dataTable.tables();
    $(dataTables).each(function () {
      $(this).dataTable().fnDestroy();
    });

    var liveLogs = filterLogs(vm.logs, false);
    var deletedLogs = filterLogs(vm.logs, true);

    prepareTable('#live-table', liveLogs, 'Last Modified');
    prepareTable('#deleted-table', deletedLogs, 'Deleted');
  }

  function prepareTable(tableId, dataSource, uniqueHeader) {
    var table = $(tableId).dataTable({
      data: dataSource,
      columns: [
        {
          title: 'ID',
          data: 'associated_id'
        },
        {
          title: 'Name',
          data: null,
          render: function (data) {
            var stringBuilder = `<strong>${data.currentName}`;
            if (vm.objType === 'schemas') {
              stringBuilder += `-${data.originalData.version}`;
            } else if (vm.objType === 'documents') {
              data.schema = (data.schema) ? data.schema : {};
              stringBuilder += `<i class="ebIcon ebIcon_info pull-right" title="Associated Schema: ${data.schema.name}-${data.schema.version}"></i>`;
            }
            return `${stringBuilder}</strong>`;
          }
        },
        {
          title: 'Created At',
          data: null,
          render: function (data) {
            return historyFormatDate(data.createdAt);
          }
        },
        {
          title: 'Created By',
          data: null,
          render: function (data) {
            return generateEmailElement(vm.objectType, data.currentName, data.createdBy);
          }
        },
        {
          title: `${uniqueHeader} At`,
          data: null,
          render: function (data) {
            if (data.deletedAt) {
              return historyFormatDate(data.deletedAt);
            } else if (data.updates.length !== 0) {
              return historyFormatDate(data.updates[data.updates.length - 1].updatedAt);
            }
            return historyFormatDate(data.createdAt);
          }
        },
        {
          title: `${uniqueHeader} By`,
          data: null,
          render: function (data) {
            var user = data.createdBy;
            if (data.deletedBy) {
              user = data.deletedBy;
            } else if (data.updates.length !== 0) {
              user = data.updates[data.updates.length - 1].updatedBy;
            }
            return generateEmailElement(vm.objectType, data.currentName, user);
          }
        },
        {
          title: 'Action',
          orderable: false,
          searchable: false,
          width: '100px',
          data: null,
          render: function (data) {
            var viewElement = `<a id="view-log-${data.associated_id}" class="btn btn-sm btn-info"
            ui-sref="logs.view({objType: '${vm.objType}', objId: '${data.associated_id}' })">View</a>`;
            var compiledView = $compile(viewElement)($scope)[0].outerHTML;
            return compiledView;
          }
        }
      ],
      order: [[1, 'asc']],
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

    $(tableId).on('click', '.edit-button', function (e) {
      e.stopPropagation();
      var tr = $(this).parents('tr');
      var log = table.api().row(tr).data();
      $state.go('logs.view', { objType: vm.objType, objId: log.associated_id });
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

  vm.showDropDown = async function () {
    document.getElementById('documentsDropdown').classList.toggle('show');
  };

  vm.switchDocumentLogs = async function (documentType) {
    vm.documentType = documentType;
    vm.logs = [];
    var filteredLogs = [];

    if (documentType === 'Managed Configs') {
      filteredLogs = logs.filter(log => (log.originalData.managedconfig));
      vm.logs = returnVisibleLogs(filteredLogs);
    } else {
      var documentTypeSplit = documentType.split(' Documents');
      var category = documentTypeSplit[0] === 'venm' ? 'enm' : documentTypeSplit[0];
      filteredLogs = logs.filter(log => (log.schema && log.schema.category === category && !log.originalData.managedconfig));
      vm.logs = returnVisibleLogs(filteredLogs);
    }

    document.getElementById('documentsDropdown').classList.remove('show');
    document.getElementById('documentsDropdown').classList.toggle('hide');
    $timeout(function () {
      $scope.$apply();
      refreshAllTables();
      filterAllTables($('#filter-field').val());
    });
  };
}

function returnVisibleLogs(documents) {
  return documents.filter(function (log) {
    var version = (log.schema) ? log.schema.version : log.originalData.version;
    return (version) ? `${semver.major(version)}.${semver.minor(version)}.${semver.patch(version)}` === version : false;
  });
}

function getLogsWithCurrentNames(logs) {
  var logsWithCurrentName = logs.map(function (log) {
    log.currentName = log.originalData.name;
    for (var i = log.updates.length - 1; i >= 0; i -= 1) {
      if (log.updates[i] && log.updates[i].updateData.name) {
        log.currentName = log.updates[i].updateData.name;
        break;
      }
    }
    return log;
  });
  return logsWithCurrentName;
}

//  populates live and deleted logs.
function filterLogs(logs, expectingDeletedArtifacts) {
  var filteredLogList = logs.filter(function (log) {
    var name = log.currentName;
    var version = log.originalData.version || '';
    // Filter out Health-Check Logs
    if (name.startsWith('A_Health_') || version.startsWith('999.999.')) {
      return false;
    }
    // Filter out Live / Deleted Logs based on 'expectingDeletedArtifacts' argument
    return (Object.keys(log).includes('deletedBy') === expectingDeletedArtifacts);
  });
  return filteredLogList;
}

function filterAllTables(value) {
  $('#live-table, #deleted-table').each(function () {
    $(this).DataTable().search(value).draw(); // eslint-disable-line new-cap
  });
}
