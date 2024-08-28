'use strict';

var _ = require('lodash');

exports.populateIpv6KeyValues = async function (document, schema) {
  if (document.managedconfig) return;

  if (schema.category === 'enm') {
    var ipv6KeyDefinitions = ['ipv6_cidr', 'ipv6_external', 'ipv6_external_list', 'ipv6_internal_list', 'nfs_ipv6_external_list', 'ipv6_internal'];
    var keepIPv6Values = ['parameters.dynamic_ipv6_range_start', 'parameters.dynamic_ipv6_range_end', 'parameters.internal_subnet_ipv6'];
    var ipv6PopulatedKeysAndValues = {};
    var requiredIpv6Keys = {};
    var requiredIpv6Array = [];
    for (var x = 0; x < ipv6KeyDefinitions.length; x += 1) {
      requiredIpv6Keys = getIpv6Keys(schema, ipv6KeyDefinitions[x]).map(getKeyFromKeyValue);
      if (requiredIpv6Keys.length) {
        requiredIpv6Array.push(requiredIpv6Keys);
      }
      ipv6PopulatedKeysAndValues = getIpv6Keys(schema, ipv6KeyDefinitions[x]).map(getKeyFromKeyValue)
        .reduce(addTemporaryValueForKey(ipv6KeyDefinitions[x]), ipv6PopulatedKeysAndValues);
    }
    var mergedIpv6Array = _.flattenDeep(requiredIpv6Array);
    var preIPv6OptionSed;
    if (mergedIpv6Array.length && schema.content.properties.parameters.required.length) {
      preIPv6OptionSed = checkForIPv6Keys(mergedIpv6Array, schema);
    }
    Object.keys(ipv6PopulatedKeysAndValues).forEach(function (key) {
      var propertyPath = `properties.${key.replace(/\./g, '.properties.')}`;
      if (_.has(schema.content, propertyPath)) {
        if (keepIPv6Values.indexOf(key) === -1) {
          if (!document.ipv6 && !preIPv6OptionSed) {
            _.unset(document.content, key);
          } else if (!document.ipv6 && preIPv6OptionSed) {
            _.set(document.content, key, ipv6PopulatedKeysAndValues[key]);
          }
        }
      }
    });
    var IPv6KeysInRequired = mergedIpv6Array.filter(key => schema.content.properties.parameters.required.indexOf(key) >= 0);
    IPv6KeysInRequired.forEach(function (key) {
      if (!Object.keys(document.content.parameters).includes(key)
        || !document.content.parameters[key]) {
        document.content.parameters[key] = '::';
      }
    });
  }
};

function checkForIPv6Keys(mergedIpv6Array, schema) {
  var result = mergedIpv6Array.every(function (key) {
    return schema.content.properties.parameters.required.indexOf(key) >= 0;
  });
  return result;
}

function getIpv6Keys(schema, ipv6KeyDefinition) {
  if (_.has(schema.content, 'properties.parameters.properties')) {
    return Object.entries(schema.content.properties.parameters.properties).filter(isIpv6Key(ipv6KeyDefinition));
  }
  return [];
}

function isIpv6Key(ipv6KeyDefinition) {
  return function ([key, keyDefinition]) {
    var ipv6KeyDefinitionArray = ['ipv6_cidr', 'ipv6_external', 'ipv6_external_list', 'ipv6_internal_list', 'nfs_ipv6_external_list', 'ipv6_internal'];
    return ipv6KeyDefinitionArray.includes(ipv6KeyDefinition) && keyDefinition.$ref === `#/definitions/${ipv6KeyDefinition}`;
  };
}

function getKeyFromKeyValue(keyValue) {
  return keyValue[0];
}

function addTemporaryValueForKey(ipv6KeyDefinition) {
  return function (ipv6PopulatedKeysAndValues, key) {
    ipv6PopulatedKeysAndValues[`parameters.${key}`] = getTemporaryIpv6ValueForDefType(ipv6KeyDefinition);
    return ipv6PopulatedKeysAndValues;
  };
}

function getTemporaryIpv6ValueForDefType(ipv6KeyDefinition) {
  var ipv6KeyDefinitionArray = ['ipv6_cidr', 'ipv6_external', 'ipv6_external_list', 'ipv6_internal_list', 'nfs_ipv6_external_list', 'ipv6_internal'];
  if (ipv6KeyDefinitionArray.includes(ipv6KeyDefinition)) return '::';
}
