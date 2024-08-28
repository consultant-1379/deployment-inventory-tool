import { saveAs } from 'file-saver';
import _ from 'lodash';
var YAML = require('js-yaml');

DocumentsViewController.$inject = [
  'document', 'schema', 'deployment', 'allLabels',
  'supportedManagedConfigs', 'dependentDocuments', 'allGroups'
];

export default function DocumentsViewController(
  document, schema, deployment, allLabels,
  supportedManagedConfigs, dependentDocuments, allGroups
) {
  var vm = this;
  vm.document = document;
  vm.schema = schema;
  vm.dependentDeployment = deployment;
  vm.dependentDocuments = dependentDocuments;
  getDocumentGroups(allGroups, document._id);
  async function getDocumentGroups(allGroups, documentId) {
    var documentGroups = await allGroups.filter(group => isDocumentPresentInGroup(group, documentId));
    vm.groups = await documentGroups.map(group => { return { id: group._id, name: group.name }; });
  }

  function isDocumentPresentInGroup(group, documentId) {
    return group.associatedDocuments.indexOf(documentId) !== -1;
  }

  vm.isSedDocument = function () {
    return (!vm.document.managedconfig && schema.category === 'enm');
  };

  vm.iscENMSedDocument = function () {
    return (!vm.document.managedconfig && schema.category === 'cenm');
  };

  vm.isVnfLcmSedDocument = function () {
    return (!vm.document.managedconfig && schema.category === 'vnflcm');
  };

  vm.labels = [];
  if (vm.document.labels) {
    allLabels.forEach(function (label) {
      if (vm.document.labels.includes(label.name)) {
        vm.labels.push(label);
      }
    });
  }

  vm.managedconfigs = [];
  if (vm.document.managedconfigs) {
    vm.document.managedconfigs.forEach(function (managedConfigId) {
      supportedManagedConfigs.forEach(function (supportedManagedConfig) {
        if (managedConfigId === supportedManagedConfig._id) {
          vm.managedconfigs.push(supportedManagedConfig);
        }
      });
    });
  }

  vm.managedconfigs.forEach(function (managedconfig) {
    managedconfig.populatedLabels = [];
    allLabels.forEach(function (label) {
      if (managedconfig.labels.includes(label.name)) {
        managedconfig.populatedLabels.push(label);
      }
    });
  });

  vm.preFilter = function (obj) {
    var jsonArray = [];
    for (var key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        if (!isOvercommitFlavours(key) || vm.document.managedconfig) {
          jsonArray.push([key, obj[key]]);
        }
      }
    }
    return jsonArray;
  };

  function isOvercommitFlavours(key) {
    var flavorRegexKey = /flavor_\d+vC\d+M/;
    return flavorRegexKey.test(key);
  }

  vm.saveJson = function (event) {
    var jsonObject = _.cloneDeep(document.content);
    if (Object.prototype.hasOwnProperty.call(jsonObject, 'parameters')
      && event.target.id === 'defaults') {
      jsonObject.parameter_defaults = jsonObject.parameters;
      delete jsonObject.parameters;
    }
    var blob = new Blob([JSON.stringify(jsonObject, null, 2)], { type: 'application/json;charset=utf-8' });
    saveAs(blob, `${document.name}_sed.json`);
  };

  vm.saveYaml = function () {
    var jsonObject = _.cloneDeep(document.content);
    if (Object.prototype.hasOwnProperty.call(jsonObject, 'parameters')) {
      jsonObject.parameter_defaults = jsonObject.parameters;
      delete jsonObject.parameters;
    }
    var blob = new Blob([YAML.dump(JSON.parse(JSON.stringify(jsonObject)))], { type: 'text/yaml;charset=utf-8' });
    saveAs(blob, `${document.name}_sed.yaml`);
  };
}
