'use strict';

var _ = require('lodash');

exports.populateVioKeyValues = async function (document, schema) {
  if (document.managedconfig) {
    return;
  }
  if (schema.category === 'enm') {
    var vioKeyDefinitions = ['ipv4_vio', 'ipv6_vio', 'vio_hostname', 'vio_positive_integer', 'vio_any_string'];
    var vioPopulatedKeysAndValues = {};
    if (!document.vio) {
      for (var x = 0; x < vioKeyDefinitions.length; x += 1) {
        vioPopulatedKeysAndValues = getVioKeys(schema, vioKeyDefinitions[x]).map(getKeyFromKeyValue)
          .reduce(addTemporaryValueForKey(vioKeyDefinitions[x], document), vioPopulatedKeysAndValues);
      }
    }
    Object.keys(vioPopulatedKeysAndValues).forEach(function (key) {
      var propertyPath = `properties.${key.replace(/\./g, '.properties.')}`;
      if (_.has(schema.content, propertyPath)) {
        _.set(document.content, key, vioPopulatedKeysAndValues[key]);
      }
    });
  }
};

function getVioKeys(schema, vioKeyDefinition) {
  if (_.has(schema.content, 'properties.parameters.properties')) {
    return Object.entries(schema.content.properties.parameters.properties).filter(isVioKey(vioKeyDefinition));
  }
  return [];
}

function isVioKey(vioKeyDefinition) {
  return function ([key, keyDefinition]) {
    var vioKeyDefinitionArray = ['ipv4_vio', 'ipv6_vio', 'vio_any_string', 'vio_hostname', 'vio_positive_integer'];
    return vioKeyDefinitionArray.includes(vioKeyDefinition) && keyDefinition.$ref === `#/definitions/${vioKeyDefinition}`;
  };
}

function getKeyFromKeyValue(keyValue) {
  return keyValue[0];
}

function addTemporaryValueForKey(vioKeyDefinition, document) {
  return function (vioPopulatedKeysAndValues, key) {
    if (key in document.content.parameters) {
      vioPopulatedKeysAndValues[`parameters.${key}`] = getTemporaryVioValueForDefType(vioKeyDefinition);
    }
    return vioPopulatedKeysAndValues;
  };
}

function getTemporaryVioValueForDefType(vioKeyDefinition) {
  if (vioKeyDefinition === 'ipv4_vio') {
    return '1.1.1.1';
  }
  if (vioKeyDefinition === 'ipv6_vio') {
    return '::';
  }
  if (vioKeyDefinition === 'vio_hostname') {
    return 'temporary';
  }
  if (vioKeyDefinition === 'vio_positive_integer') {
    return '1';
  }
  if (vioKeyDefinition === 'vio_any_string') {
    return 'temporary';
  }
}
