import { historyFormatDate } from '../../../core/client/controllers/helpers.client.controller';
import { getObjectLogWrapper } from '../../client/config/history.client.routes';

var _ = require('lodash');
var $ = require('jquery');
var moment = require('moment');

HistoryViewController.$inject = ['$scope', '$state',
  '$stateParams', '$window', '$timeout',
  'Notification', 'SchemasService',
  'log', 'schemas', 'documents', 'projects', 'pods'];
export default function HistoryViewController(
  $scope, $state, $stateParams, $window, $timeout,
  Notification, SchemasService, log, schemas,
  documents, projects, pods
) {
  var vm = this;
  var maxUpdatesToLoad = 100;
  $scope.loadUpdates = function () {
    var totalUpdatesToLoad = Math.min(vm.unloadedUpdates.length, maxUpdatesToLoad);
    var loadedUpdatesChunk = vm.unloadedUpdates.splice(0, totalUpdatesToLoad);
    vm.loadedUpdates = vm.loadedUpdates.concat(loadedUpdatesChunk);
    $scope.finishedLoading = (vm.unloadedUpdates.length === 0);
  };
  $scope.range = _.range;
  vm.log = parseLogData(log, false);
  vm.objType = $stateParams.objType.substring(0, $stateParams.objType.length - 1);
  vm.objectType = vm.objType.substring(0, 1).toUpperCase() + vm.objType.substring(1, vm.objType.length);
  vm.unloadedUpdates = sortOfLogData(_.cloneDeep(vm.log.updates));
  vm.loadedUpdates = [];
  $scope.loadUpdates();

  vm.setDITAdminLogs = async function () {
    var returnedLogs = await getObjectLogWrapper(undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, vm.showDITAdminLogs); // eslint-disable-line max-len
    vm.log = parseLogData(returnedLogs, false);
    vm.objType = $stateParams.objType.substring(0, $stateParams.objType.length - 1);
    vm.objectType = vm.objType.substring(0, 1).toUpperCase() + vm.objType.substring(1, vm.objType.length);
    vm.unloadedUpdates = sortOfLogData(_.cloneDeep(vm.log.updates));
    vm.loadedUpdates = [];
    $scope.loadUpdates();
    $scope.$apply();
  };

  vm.formatDate = function (dateTimeString) {
    return historyFormatDate(dateTimeString, 'view');
  };

  vm.downloadJSONFile = function (jsonObj, fileName) {
    jsonObj = JSON.parse(JSON.stringify(jsonObj).replace(/(\s+\(.*?\)) */g, ''));
    var tempElement = document.createElement('a');
    tempElement.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(JSON.stringify(jsonObj, null, '\t'))}`);
    tempElement.setAttribute('download', fileName);
    tempElement.style.display = 'none';
    document.body.appendChild(tempElement);
    tempElement.click();
    document.body.removeChild(tempElement);
  };

  vm.restoreObject = async function (jsonObj) {
    log = log[0] || log;
    jsonObj = JSON.parse(JSON.stringify(jsonObj).replace(/(\s+\(.*?\)) */g, ''));
    var alertMessage = `Are you sure you want to restore this ${vm.objType}? `;
    if (log.deletedAt) {
      alertMessage += 'If restored, it will be created with a new id.';
    }
    if ($window.confirm(alertMessage)) {
      var currentState = $state.current.name;
      var crudState = (log.deletedAt || vm.objType === 'schema') ? 'create' : 'edit';
      if (vm.objType === 'document') {
        try {
          var schema = await SchemasService.get({ schemaId: jsonObj.schema_id }).$promise;
          switch (schema.name) {
            case 'enm_sed': crudState += 'EnmSed'; break;
            case 'vnflcm_sed_schema': crudState += 'VnfLcmSed'; break;
            default: crudState += log.originalData.managedconfig ? 'ManagedConfig' : 'Other'; break;
          }
        } catch (err) {
          $state.go(currentState, { objType: $stateParams.objType, objId: vm.log.associated_id });
          Notification.error({
            title: '<i class="glyphicon glyphicon-remove"></i> Error Restoring Document!',
            message: `Associated Schema with ID "${jsonObj.schema_id}" does not exist.`
          });
          return;
        }
      }
      $state.go(`${vm.objType}s.${crudState}`, { [`${vm.objType}Id`]: vm.log.associated_id, restoreData: jsonObj });
    }
  };

  vm.toggleAllVisibility = () => {
    var firstUpdateContainerid = $('[id^="update-container-"]').first().attr('id');
    $('[id^="update-container-"]').toggle(!$(`#${firstUpdateContainerid}`).is(':visible'));
    $('[id^="update-button-"]').html(($(`#${firstUpdateContainerid}`).is(':visible')) ? 'Hide Changes' : 'Show Changes');
  };

  vm.toggleChildrenVisibility = function (objectId) {
    var trElems = $(`tr[id^="${objectId}-"]`);
    var firstElemVisible = trElems.first().is(':visible');
    trElems.toggle(!firstElemVisible);
    $(`span[id^="${objectId}-"][id$="-arrow-plus"]`).each(function () { $(this).toggle(firstElemVisible); });
    $(`span[id^="${objectId}-"][id$="-arrow-minus"]`).each(function () { $(this).toggle(!firstElemVisible); });
  };

  vm.toggleElemVisibility = objectId => {
    $(`#update-container-${objectId}`).toggle();
    $(`#update-button-${objectId}`).html(($(`#update-container-${objectId}`).is(':visible')) ? 'Hide Changes' : 'Show Changes');
  };

  vm.isRestoreButtonVisible = function (actionType, index) {
    switch (actionType) {
      case 'DELETED': return false;
      case 'CREATED': return (vm.log.deletedAt || vm.log.updates.length);
      case 'UPDATED': return (vm.log.deletedAt || index !== 0);
      default: return false;
    }
  };

  $scope.openMail = function (emailAddr, objName) {
    var tmpWindow = window.open(`mailto:${emailAddr}?subject=DIT Query Regarding ${vm.objectType} Object: ${objName}`, 'mail');
    tmpWindow.close();
  };

  // search key/value name in search field
  vm.filterLogs = function (searchType) {
    if (!$('#filter-field').val()) {
      searchType = false;
    }
    updateVisibleLogs(searchType);
  };

  $(() => {
    cleanEmptyTableElements();
  });

  vm.onSearchInput = function () {
    var searchValue = $('#filter-field').val();
    $('.search-clear').toggle(searchValue !== '');
  };

  vm.clearSearch = function () {
    $('#filter-field').val('').focus();
    updateVisibleLogs(false);
    $('.search-clear').hide();
  };

  // update the visible log depends on search type
  function updateVisibleLogs(searchType) {
    $timeout(function () {
      vm.log = parseLogData(vm.log, searchType);
      vm.loadedUpdates = sortOfLogData(_.cloneDeep(vm.log.updates));
      vm.unloadedUpdates = [];
      $scope.finishedLoading = true;
      $('[id^="update-container"]').each(function () {
        $(this).find('.parent-update-table-body').first().empty();
      });
      $scope.$apply();
      cleanEmptyTableElements();
    });
  }

  function getIdName(key, keyValue, type) {
    if (type) key = type;
    if (keyValue) {
      switch (key) {
        case 'document_id':
        case 'sed_id':
          var documentObj = documents.filter(document => document._id.toString() === keyValue.toString());
          if (documentObj.length === 1) keyValue = `${keyValue} (${documentObj[0].name})`;
          break;
        case 'schema_id':
          var schemaObj = schemas.filter(schema => schema._id.toString() === keyValue.toString());
          if (schemaObj.length === 1) keyValue = `${keyValue} (${schemaObj[0].name}-${schemaObj[0].version})`;
          break;
        case 'pod_id':
          var podObj = pods.filter(pod => pod._id.toString() === keyValue.toString());
          if (podObj.length === 1) keyValue = `${keyValue} (${podObj[0].name})`;
          break;
        case 'project_id':
          var projectObj = projects.filter(project => project._id.toString() === keyValue.toString());
          if (projectObj.length === 1) keyValue = `${keyValue} (${projectObj[0].name})`;
          break;
        default: // do nothing
      }
    }
    return keyValue;
  }

  // clean the child table
  function cleanEmptyTableElements() {
    $('[id^="update-container"]').each(function () {
      var updateTableBody = $(this).find('.parent-update-table-body').first();
      var tableRows = $(this).find('.child-change-table-body').children();
      for (var i = 0; i < tableRows.length; i += 1) {
        updateTableBody.append($(tableRows[i]));
      }
    });
    // Remove empty tables
    $('.child-change-table-body').each(function () {
      if ($(this).children().length === 0) $(this).closest('.log-card-body').remove();
    });
  }

  // Parse the current object log info into the desired format for HTML output
  function parseLogData(logData, searchType) {
    logData = logData[0] || logData;
    var currentData = _.cloneDeep(logData.originalData);
    logData.isCreatedLogVisible = (!searchType);
    logData.isDeletedLogVisible = (!searchType);
    for (var i = 0; i < logData.updates.length; i += 1) {
      logData.updates[i].index = i + 1;
      logData.updates[i].isVisible = (!searchType);
      getUpdateChanges(logData.updates[i], currentData, searchType);
      if (logData.updates[i].changes.length === 1 && logData.updates[i].changes[0].name === 'updated_at') {
        // add 'change' to say there was no changes made
        logData.updates[i].changes[1] = {
          name: 'N/A', isNew: false, isRemoved: false, origValue: 'No changes were made to the object'
        };
      }
      logData.updates[i].currentData = _.cloneDeep(currentData);
    }
    logData.currentData = currentData;
    return logData;
  }

  // Get the changes made for each update
  function getUpdateChanges(update, currentData, searchType) {
    update.changes = [];

    // the first layer of object
    for (var key in update.updateData) {
      if (Object.prototype.hasOwnProperty.call(update.updateData, key)) {
        var changeObj = getChange(currentData, update.updateData, key, searchType, update);
        update.changes.push(changeObj.change);
        currentData[key] = changeObj.current[key];
      }
    }
  }

  // Get an individual change from an update
  function getChange(current, update, key, searchType, topParentUpdate) {
    var change = {
      name: key,
      childChanges: [],
      isNew: false,
      isRemoved: false
    };

    current = current || {};
    var originalValue = current[key];
    var updateValue = update[key];
    var changeObj;
    var nameType;
    if (topParentUpdate.updateData.managedconfigs && /^-?\d+$/.test(key)) nameType = 'document_id';
    var keyIdList = ['schema_id', 'document_id', 'sed_id', 'pod_id', 'project_id'];
    if (keyIdList.includes(key) || nameType) {
      originalValue = getIdName(key, originalValue, nameType);
      updateValue = getIdName(key, updateValue, nameType);
    }

    if (searchType && topParentUpdate.isVisible === false) {
      var searchValue = $('#filter-field').val().toLowerCase();
      if (searchType === 'key' && key.toLowerCase() === searchValue) {
        topParentUpdate.isVisible = true;
      } else if (searchType === 'value') {
        if (originalValue && originalValue.toString().replace(/(\s+\(.*?\)) */g, '').toLowerCase() === searchValue) {
          topParentUpdate.isVisible = true;
        } else if (updateValue.toString().replace(/(\s+\(.*?\)) */g, '').toLowerCase() === searchValue) {
          topParentUpdate.isVisible = true;
        }
      }
    }

    if (updateValue === 'REMOVED') {
      if (typeof originalValue === 'object') {
        change.isRemoved = true;
        for (var origKeyA in originalValue) {
          if (Object.prototype.hasOwnProperty.call(originalValue, origKeyA)) {
            changeObj = getChange(originalValue, { [origKeyA]: 'REMOVED' }, origKeyA, searchType, topParentUpdate);
            change.childChanges.push(changeObj.change);
            delete current[key];
          }
        }
      } else {
        change.origValue = originalValue || '-';
        change.newValue = 'REMOVED';
        delete current[key];
      }
    } else if (typeof originalValue === 'object' || typeof updateValue === 'object') {
      change.isNew = (typeof originalValue === 'undefined');
      for (var childKeyA in updateValue) {
        if (Object.prototype.hasOwnProperty.call(updateValue, childKeyA)) {
          changeObj = getChange(originalValue, updateValue, childKeyA, searchType, topParentUpdate);
          change.childChanges.push(changeObj.change);
          if (changeObj.current.constructor === Array) {
            current[key] = changeObj.current.filter(keyValue => keyValue != null);
          } else {
            current[key] = Object.assign(current[key] || {}, changeObj.current);
          }
        }
      }
    } else {
      change.origValue = originalValue || '-';
      change.newValue = updateValue;
      current[key] = updateValue;
    }
    if (change.childChanges.length < 1) delete change.childChanges;
    return { change: change, current: _.cloneDeep(current) };
  }

  function sortOfLogData(logUpdateData) {
    logUpdateData = logUpdateData.sort(function (left, right) {
      return moment.utc(right.updatedAt).diff(moment.utc(left.updatedAt));
    });
    return logUpdateData;
  }
}
