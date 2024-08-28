'use strict';

var url = require('url');
var _ = require('lodash');
var semver = require('semver');
var Address4 = require('ip-address').Address4;
var Address6 = require('ip-address').Address6;
var bigInt = require('big-integer');
var dns = require('dns-then');
var enmAutopopulate = require('../../../documents/server/controllers/documents.autopopulate.server.controller');
var Schema = require('../../../schemas/server/models/schemas.server.model').Schema;
var Deployment = require('../../../deployments/server/models/deployments.server.model').Schema;
var Document = require('../models/documents.server.model').Schema;

exports.vnfAutoPopulate = async function (document, schema) {
  if (!document.autopopulate) return;

  if (!schema) schema = (await readSchema(document.schema_id)).toJSON();

  if (schema.category === 'enm' || schema.category === 'cenm') return;

  if (schema.category === 'vnflcm') {
    var deployment = await Deployment.find({ documents: { $elemMatch: { document_id: document._id } } }).populate({ path: 'project_id', populate: { path: 'pod_id' } }).exec();
    var isEnmSedFFE = false;
    var enmSed;

    if (deployment[0] && deployment[0].enm) {
      enmSed = await Document.findOne({ _id: deployment[0].enm.sed_id });
      isEnmSedFFE = enmSed.isFFE;
    }

    var ipTypes = ['IPv4', 'IPv6'];
    var commonValuesAcrossENMVNFDocs = {
      enm_laf_1_ip_internal: 'internal_ipv4_for_services_vm',
      vnflaf_db_1_ip_internal: 'internal_ipv4_for_db_vm',
      vnflaf_db_1_ip_external: 'external_ipv4_for_db_vm',
      enm_laf_1_ipv6_external: 'external_ipv6_for_services_vm',
      vnflaf_db_1_ipv6_external: 'external_ipv6_for_db_vm',
      enm_laf_1_ip_external: 'external_ipv4_for_services_vm',
      visinamingnb_external_ip_list: 'ossNotificationServiceIP',
      nbalarmirp_external_ip_list: 'ossNbiAlarmIP',
      server_group_policy: 'availability_rule'
    };

    if (!isEnmSedFFE) commonValuesAcrossENMVNFDocs.serviceregistry_internal_ip_list = 'serviceregistry_internal_ip_list';

    var enmCommonValueKeys = Object.keys(commonValuesAcrossENMVNFDocs);

    var autoPopulatedKeysAndValues;
    if (deployment[0]) {
      var podNetwork;
      for (var n = 0; n < deployment[0].project_id.pod_id.networks.length; n += 1) {
        if (deployment[0].project_id.pod_id.networks[n].name === deployment[0].project_id.network.name) {
          podNetwork = deployment[0].project_id.pod_id.networks[n];
          break;
        }
      }
      if (!podNetwork) {
        throw new Error(`The network name given in the project settings '${deployment[0].project_id.network.name}' \
was not found within the given pod`);
      }
      var enmDocument = await Document.findOne({ _id: deployment[0].enm.sed_id }).exec();
      var vimUrl = url.parse(deployment[0].project_id.pod_id.authUrl);
      var vimIp = await getIPFromHostname(vimUrl.hostname);

      autoPopulatedKeysAndValues = {
        'parameters.vim_ip': vimIp,
        'parameters.vim_url': deployment[0].project_id.pod_id.authUrl,
        'parameters.vim_tenant_id': deployment[0].project_id.id,
        'parameters.vim_tenant_name': deployment[0].project_id.name,
        'parameters.vim_name': `vim_${deployment[0].project_id.name}`,
        'parameters.vim_tenant_username': deployment[0].project_id.username,
        'parameters.vim_tenant_user_password': deployment[0].project_id.password,
        'parameters.external_ipv4_subnet_cidr': podNetwork.ipv4_subnet.cidr,
        'parameters.external_ipv4_subnet_gateway': podNetwork.ipv4_subnet.gateway_ip,
        'parameters.keypair': `key_pair_${deployment[0].project_id.name}`,
        'parameters.vim_HostName': vimUrl.hostname,
        'parameters.deployment_id': enmDocument.content.parameters.deployment_id,
        'parameters.internal_ipv4_subnet_cidr': enmDocument.content.parameters.internal_subnet,
        'parameters.services_vm_count': '1',
        'parameters.db_vm_count': '1',
        'parameters.availability_rule': 'affinity'
      };

      if (['v4', 'dual'].includes(enmDocument.content.parameters.ip_version)) {
        // Set values if ENM Document is IPv4
        autoPopulatedKeysAndValues['parameters.ossNotificationServiceIP'] = enmDocument.content.parameters.visinamingsb_external_ip_list || '1.1.1.1';
        autoPopulatedKeysAndValues['parameters.ossNbiAlarmIP'] = enmDocument.content.parameters.nbalarmirp_external_ip_list || '1.1.1.1';
      }

      for (var i = 0; i < enmCommonValueKeys.length; i += 1) {
        if (Object.prototype.hasOwnProperty.call(enmDocument.content.parameters, enmCommonValueKeys[i])) {
          var keyName = `parameters.${commonValuesAcrossENMVNFDocs[enmCommonValueKeys[i]]}`;
          autoPopulatedKeysAndValues[keyName] = enmDocument.content.parameters[enmCommonValueKeys[i]];
        }
      }

      if (enmDocument.content.parameters.ip_version) {
        autoPopulatedKeysAndValues = _.extend(autoPopulatedKeysAndValues, {
          'parameters.ip_version': String(enmDocument.content.parameters.ip_version).replace('v', '')
        });
      } else if (enmDocument.ipv6) {
        autoPopulatedKeysAndValues = _.extend(autoPopulatedKeysAndValues, {
          'parameters.ip_version': 'dual'
        });
      } else {
        autoPopulatedKeysAndValues = _.extend(autoPopulatedKeysAndValues, {
          'parameters.ip_version': '4'
        });
      }
      if (enmDocument.content.parameters.nameserverA && enmDocument.content.parameters.nameserverB) {
        autoPopulatedKeysAndValues = _.extend(autoPopulatedKeysAndValues, {
          'parameters.dns_server_ip': `${enmDocument.content.parameters.nameserverA},${enmDocument.content.parameters.nameserverB}`
        });
      }
      if (enmDocument.ipv6 && podNetwork.ipv6_subnet) {
        autoPopulatedKeysAndValues = _.extend(autoPopulatedKeysAndValues, {
          'parameters.external_ipv6_subnet_cidr': podNetwork.ipv6_subnet.cidr,
          'parameters.external_ipv6_subnet_gateway': podNetwork.ipv6_subnet.gateway_ip,
          'parameters.internal_ipv6_subnet_cidr': enmDocument.content.parameters.internal_subnet_ipv6
        });
      }
      // Setting HA Values
      if (document.ha) {
        autoPopulatedKeysAndValues = _.extend(autoPopulatedKeysAndValues, {
          'parameters.services_vm_count': '2',
          'parameters.db_vm_count': '2',
          'parameters.availability_rule': 'anti-affinity'
        });
        var invalidVrrpIDs = await enmAutopopulate.getVrrpIdsKeysWithEmptyOrInvalidValues(schema, document, podNetwork);
        if (invalidVrrpIDs.length) {
          var availableVrrpIdValues = await enmAutopopulate.determineAvailableVrrpIds(podNetwork, schema, document);
          for (var x = 0; x < invalidVrrpIDs.length; x += 1) {
            autoPopulatedKeysAndValues[`parameters.${invalidVrrpIDs[x]}`] = availableVrrpIdValues.pop();
          }
        }
      }
      // Getting IP addresses
      autoPopulatedKeysAndValues = await getIPaddresses(autoPopulatedKeysAndValues, schema, document, enmDocument, ipTypes, deployment[0]);

      // Change to temporary for ipv6 when enm sed ipv6 is disabled
      if (!enmDocument.ipv6) {
        autoPopulatedKeysAndValues = _.extend(autoPopulatedKeysAndValues, {
          'parameters.external_subnet_ipv6': '::',
          'parameters.external_gateway_ipv6': '::',
          'parameters.external_ipv6_subnet_cidr': '::/64',
          'parameters.external_ipv6_subnet_gateway': '::',
          'parameters.internal_ipv6_subnet_cidr': '::/64',
          'parameters.internal_ipv6_subnet_gateway': '::',
          'parameters.external_ipv6_for_services_vm': '::',
          'parameters.external_ipv6_for_db_vm': '::',
          'parameters.external_ipv6_vip_for_services': '::',
          'parameters.internal_ipv6_vip_for_services': '::',
          'parameters.internal_ipv6_vip_for_db': '::',
          'parameters.internal_ipv6_for_services_vm': '::',
          'parameters.internal_ipv6_for_db_vm': '::'
        });
      }
    } else {
      autoPopulatedKeysAndValues = await addTemporaryValues(autoPopulatedKeysAndValues, schema, document, ipTypes);
    }

    Object.keys(autoPopulatedKeysAndValues).forEach(function (key) {
      var propertyPath = `properties.${key.replace(/\./g, '.properties.')}`;
      if (_.has(schema.content, propertyPath)) {
        _.set(document.content, key, autoPopulatedKeysAndValues[key]);
      }
    });
  }
};

async function addTemporaryValues(autoPopulatedKeysAndValues, schema, document, ipTypes) {
  var ipType;
  var ipTypeLowercase;
  autoPopulatedKeysAndValues = _.extend(autoPopulatedKeysAndValues, {
    'parameters.deployment_id': 'temporary',
    'parameters.cinder_volume_id': '1',
    'parameters.internal_net_id': '1',
    'parameters.external_net_id': '1',
    'parameters.internal_mtu': '1',
    'parameters.security_group_id': '1',
    'parameters.internal_ipv4_subnet_cidr': '1.1.1.1/1',
    'parameters.internal_ipv4_subnet_gateway': '1.1.1.1',
    'parameters.external_ipv4_subnet_cidr': '1.1.1.1/1',
    'parameters.external_ipv4_subnet_gateway': '1.1.1.1',
    'parameters.vim_ip': '1.1.1.1',
    'parameters.vim_url': 'http://temporary.com',
    'parameters.vim_tenant_id': '1',
    'parameters.vim_tenant_name': 'temporary',
    'parameters.vim_name': 'temporary',
    'parameters.vim_tenant_username': 'temporary',
    'parameters.vim_tenant_user_password': 'temporary',
    'parameters.vim_HostName': 'temporary',
    'parameters.external_gateway': '1.1.1.1',
    'parameters.keypair': 'temporary',
    'parameters.ip_version': '4',
    'parameters.ossNotificationServiceIP': '1.1.1.1',
    'parameters.ossNbiAlarmIP': '1.1.1.1',
    'parameters.external_subnet_ipv6': '::',
    'parameters.external_gateway_ipv6': '::',
    'parameters.external_ipv6_subnet_cidr': '::/64',
    'parameters.external_ipv6_subnet_gateway': '::',
    'parameters.internal_ipv6_subnet_cidr': '::/64',
    'parameters.internal_ipv6_subnet_gateway': '::',
    'parameters.internal_ipv4_for_services_vm': '1.1.1.1',
    'parameters.dns_server_ip': '1.1.1.1,1.1.1.1',
    'parameters.external_ipv4_for_services_vm': '1.1.1.1',
    'parameters.internal_ipv4_for_db_vm': '1.1.1.1',
    'parameters.external_ipv4_for_db_vm': '1.1.1.1',
    'parameters.external_ipv6_for_services_vm': '::',
    'parameters.external_ipv6_for_db_vm': '::',
    'parameters.internal_ipv6_for_services_vm': '::',
    'parameters.internal_ipv6_for_db_vm': '::',
    'parameters.serviceregistry_internal_ip_list': '1.1.1.1',
    'parameters.services_vm_count': '1',
    'parameters.db_vm_count': '1',
    'parameters.availability_rule': 'affinity'
  });
  if (document.ha) {
    autoPopulatedKeysAndValues = _.extend(autoPopulatedKeysAndValues, {
      'parameters.services_vm_count': '2',
      'parameters.db_vm_count': '2',
      'parameters.svc_external_vrrp_id': '1',
      'parameters.svc_internal_vrrp_id': '2',
      'parameters.db_internal_vrrp_id': '3',
      'parameters.availability_rule': 'anti-affinity'
    });
  }

  // Fill in the autopopulated ip fields with temporary ip values
  for (var y = 0; y < ipTypes.length; y += 1) {
    ipType = ipTypes[y];
    ipTypeLowercase = ipType.toLowerCase();
    autoPopulatedKeysAndValues = getAutopopulateExternalIPFromRangeKeys(schema, ipTypeLowercase).map(enmAutopopulate.getKeyFromKeyValue)
      .reduce(addTemporaryIPValueForKey(ipTypeLowercase), autoPopulatedKeysAndValues);
    autoPopulatedKeysAndValues = getAutopopulateInternalIPFromRangeKeys(schema, ipTypeLowercase).map(enmAutopopulate.getKeyFromKeyValue)
      .reduce(addTemporaryIPValueForKey(ipTypeLowercase), autoPopulatedKeysAndValues);
  }
  return autoPopulatedKeysAndValues;
}

async function getIPaddresses(autoPopulatedKeysAndValues, schema, document, enmDocument, ipTypes, deployment) {
  var ipType;
  var ipTypeLowercase;
  var externalIpsCheck;
  var enmSchema;
  if (enmDocument) {
    enmSchema = (await readSchema(enmDocument.schema_id)).toJSON();
  }
  // Populate the external IPs
  var previousVnfLcmDocument = await Document.findOne({ _id: document._id });
  for (var a = 0; a < ipTypes.length; a += 1) {
    ipType = ipTypes[a];
    externalIpsCheck = true;
    ipTypeLowercase = ipTypes[a].toLowerCase();
    if ((enmDocument.ipv6 && ipTypeLowercase === 'ipv6') || ipTypeLowercase === 'ipv4') {
      var externalRanges = deployment.project_id.network[`${ipTypeLowercase}_ranges`];
      var autoPopulatedExternalIPFromRangeKeys = getAutopopulateExternalIPFromRangeKeys(schema, ipTypeLowercase);
      autoPopulatedKeysAndValues = populateIPs(schema, autoPopulatedKeysAndValues, document, externalIpsCheck, externalRanges, autoPopulatedExternalIPFromRangeKeys, ipType, 'project', previousVnfLcmDocument, enmDocument, enmSchema);
    }
  }

  // Populate the internal IPs
  var dynamicIpv4RangeEnd = enmDocument.content.parameters.dynamic_ip_range_end;
  var internalIPv4NetworkObject = new Address4(enmDocument.content.parameters.internal_subnet);
  var ipv4StartBigInt = getBigIntFromIP(dynamicIpv4RangeEnd, 'ipv4').add('1');
  var ipv4StartIPObject = Address4.fromBigInteger(ipv4StartBigInt);
  var allInternalRanges = {
    ipv4: [{
      start: ipv4StartIPObject.address,
      end: internalIPv4NetworkObject.endAddress().address
    }]
  };

  if (enmDocument.ipv6) {
    var dynamicIpv6RangeEnd = enmDocument.content.parameters.dynamic_ipv6_range_end;
    var internalIPv6NetworkObject = new Address6(enmDocument.content.parameters.internal_subnet_ipv6);
    var ipv6StartBigInt = getBigIntFromIP(dynamicIpv6RangeEnd, 'ipv6').add('1');
    var ipv6StartIPObject = Address6.fromBigInteger(ipv6StartBigInt);
    allInternalRanges = _.extend(allInternalRanges, {
      ipv6: [{
        start: ipv6StartIPObject.address,
        end: internalIPv6NetworkObject.endAddress().address
      }]
    });
  }

  for (var b = 0; b < ipTypes.length; b += 1) {
    ipType = ipTypes[b];
    externalIpsCheck = false;
    ipTypeLowercase = ipTypes[b].toLowerCase();
    if ((enmDocument.ipv6 === true && ipTypeLowercase === 'ipv6') || ipTypeLowercase === 'ipv4') {
      var internalRanges = allInternalRanges[ipTypeLowercase];
      var autoPopulatedInternalIPFromRangeKeys = getAutopopulateInternalIPFromRangeKeys(schema, ipTypeLowercase);
      autoPopulatedKeysAndValues = populateIPs(schema, autoPopulatedKeysAndValues, document, externalIpsCheck, internalRanges, autoPopulatedInternalIPFromRangeKeys, ipType, 'internal', previousVnfLcmDocument, enmDocument, enmSchema);
    }
  }
  return autoPopulatedKeysAndValues;
}

async function readSchema(schemaId) {
  var schema = await Schema.findById(schemaId).exec();
  if (!schema) {
    throw new Error('The given schema id could not be found');
  }
  return schema;
}

function getAutopopulateExternalIPFromRangeKeys(schema, ipType) {
  if (_.has(schema.content, 'properties.parameters.properties')) {
    return Object.entries(schema.content.properties.parameters.properties).filter(isAutopopulatedExternalIPKeyFromRange(ipType));
  }
  return [];
}

function populateIPs(
  schema, autoPopulatedKeysAndValues, document, externalIpsCheck, ranges, autoPopulatedIPFromRangeKeys,
  ipType, rangeTypeString, previousVnfLcmDocument, enmDocument, enmSchema
) {
  var ipTypeLowercase = ipType.toLowerCase();
  // Build an initial array of ipKey details that can be built up and manipulated
  var updatedDocument = _.cloneDeep(document);
  updatedDocument.content.parameters.services_vm_count = autoPopulatedKeysAndValues['parameters.services_vm_count'];
  updatedDocument.content.parameters.db_vm_count = autoPopulatedKeysAndValues['parameters.db_vm_count'];

  var ipKeyDetails = autoPopulatedIPFromRangeKeys.map(function ([key, keyDefinition]) {
    return {
      key_name: key,
      number_of_ips_required: enmAutopopulate.getNumberOfIPsRequiredForKey(schema, updatedDocument, key, keyDefinition),
      ips: getExistingIPArrayFromDocument(document, key)
    };
  });
  var enmDocsAddresses = [];
  var keysSameInEnmSed = [
    'internal_ipv4_for_services_vm',
    'internal_ipv4_for_db_vm',
    'external_ipv4_for_services_vm',
    'external_ipv4_for_db_vm',
    'external_ipv6_for_services_vm',
    'external_ipv6_for_db_vm',
    'serviceregistry_internal_ip_list',
    'ossNotificationServiceIP',
    'ossNbiAlarmIP'
  ];
  if (enmDocument) {
    if (semver.gt(enmSchema.version, '1.65.2')) {
      keysSameInEnmSed = [
        'ossNotificationServiceIP',
        'ossNbiAlarmIP'
      ];
      if (!enmDocument.isFFE) keysSameInEnmSed.push('serviceregistry_internal_ip_list');
    }
    var checkIpAddress = true;
    enmDocsAddresses = enmAutopopulate.getDocumentAddresses(enmDocument);
    // Reversed loop due to removing elements from the array messing up the index and skipping loops
    for (var keyIndex = ipKeyDetails.length - 1; keyIndex >= 0; keyIndex -= 1) {
      checkIpAddress = true;
      if (keysSameInEnmSed.includes(ipKeyDetails[keyIndex].key_name)) {
        ipKeyDetails.splice(keyIndex, 1);
        checkIpAddress = false;
      }
      if (checkIpAddress) {
        for (var ipIndex = 0; ipIndex < ipKeyDetails[keyIndex].ips.length; ipIndex += 1) {
          if (enmDocsAddresses.includes(ipKeyDetails[keyIndex].ips[ipIndex])) {
            ipKeyDetails[keyIndex].ips.splice(ipIndex, 1);
          }
        }
      }
    }
  }
  var ipCountRequired = ipKeyDetails.map(function (entry) {
    return entry.number_of_ips_required;
  }).reduce(add, 0);
  var ipsInRanges = ranges.map(enmAutopopulate.countIPsInRange(ipTypeLowercase)).reduce(add, 0);
  if (ipCountRequired > ipsInRanges) {
    throw new Error(`There are not enough free ${ipType} addresses in the ${rangeTypeString} ranges to auto populate. ${ipCountRequired} \
${ipType} addresses are required in total but the ${rangeTypeString} ranges only have ${ipsInRanges} ${ipType} addresses in total. \
Please add more and try again.`);
  }
  // Remove ips that are not valid within the project ranges
  ipKeyDetails = ipKeyDetails.map(enmAutopopulate.filterIPsInvalidInRanges(ranges, ipTypeLowercase));

  // Remove duplicate ips accross all keys
  ipKeyDetails = removeDuplicatesFromIPKeyDetails(ipKeyDetails, ipTypeLowercase);

  // Remove ips where there are too many
  ipKeyDetails = ipKeyDetails.map(function (item) {
    item.ips = item.ips.splice(0, item.number_of_ips_required);
    return item;
  });

  // Fill in any missing ips
  ipKeyDetails = populateMissingIPsInKeyDetails(ipKeyDetails, ranges, ipTypeLowercase, previousVnfLcmDocument, document, enmDocument);
  for (var x = 0; x < ipKeyDetails.length; x += 1) {
    var item = ipKeyDetails[x];
    if (item.ips.length > 0) {
      autoPopulatedKeysAndValues[`parameters.${item.key_name}`] = item.ips.join(',');
    } else if (ipTypeLowercase === 'ipv4') {
      autoPopulatedKeysAndValues[`parameters.${item.key_name}`] = '1.1.1.1';
    } else {
      autoPopulatedKeysAndValues[`parameters.${item.key_name}`] = '::';
    }
  }
  return autoPopulatedKeysAndValues;
}

function getBigIntFromIP(ipaddress, ipType) {
  var ipObject;
  if (ipType === 'ipv4') {
    ipObject = new Address4(ipaddress);
  } else {
    ipObject = new Address6(ipaddress);
  }
  if (!ipObject.isValid()) {
    throw new Error(`The ip address given '${ipaddress}' is not a valid address`);
  }
  return bigInt(ipObject.bigInteger().toString());
}

function getAutopopulateInternalIPFromRangeKeys(schema, ipType) {
  if (_.has(schema.content, 'properties.parameters.properties')) {
    return Object.entries(schema.content.properties.parameters.properties).filter(isAutopopulatedInternalIPKeyFromRange(ipType));
  }
  return [];
}

function addTemporaryIPValueForKey(ipType) {
  return function (autoPopulatedKeysAndValues, key) {
    autoPopulatedKeysAndValues[`parameters.${key}`] = enmAutopopulate.getTemporaryIPValueForIPType(ipType);
    return autoPopulatedKeysAndValues;
  };
}

function isAutopopulatedExternalIPKeyFromRange(ipType) {
  return function ([key, keyDefinition]) {
    var ignorableKeys = [
      'external_ipv4_subnet_gateway',
      'external_ipv6_subnet_gateway'
    ];
    if (ignorableKeys.includes(key)) {
      return false;
    }
    if (ipType === 'ipv4') {
      if (keyDefinition.$ref === '#/definitions/ipv4_external' || keyDefinition.$ref === '#/definitions/ipv4_external_list') {
        return true;
      }
    } else if (keyDefinition.$ref === '#/definitions/ipv6_external' || keyDefinition.$ref === '#/definitions/ipv6_external_list') {
      return true;
    }
    return false;
  };
}

function getExistingIPArrayFromDocument(document, key) {
  if (document.content.parameters[key]) {
    return enmAutopopulate.getArrayFromCommaSeparatedList(document.content.parameters[key]);
  }
  return [];
}

function removeDuplicatesFromIPKeyDetails(ipKeyDetails, ipType) {
  var allIpsFound = [];
  return ipKeyDetails.map(function (item) {
    item.ips = item.ips.filter(isIPInAllIPsFound(ipType), allIpsFound);
    return item;
  });
}

function isIPInAllIPsFound(ipType) {
  return function (ip) {
    // allIpsFound is passed in from the outside to keep the state of all IPs found
    var allIpsFound = this;
    var ipCorrectForm;
    if (ipType === 'ipv4') {
      ipCorrectForm = ip;
    } else {
      ipCorrectForm = new Address6(ip).correctForm();
    }
    if (!allIpsFound.includes(ipCorrectForm)) {
      allIpsFound.push(ipCorrectForm);
      return true;
    }
    return false;
  };
}

function populateMissingIPsInKeyDetails(ipKeyDetails, ranges, ipType, previousVnfLcmDocument, document, enmDocument) {
  var previousDocsAddresses = enmAutopopulate.getDocumentAddresses(previousVnfLcmDocument);
  var enmDocsAddresses = enmAutopopulate.getDocumentAddresses(enmDocument);
  var currentDocsAddresses = enmAutopopulate.getDocumentAddresses(document);
  var allIpsFound = [];
  ipKeyDetails.forEach(function (item) {
    item.ips = item.ips.filter(isIPInAllIPsFound(ipType), allIpsFound);
    return item;
  });
  // Fill in missing ips from remaining ranges
  var IPGenerator = getIPObjectFromRanges(ranges, ipType);
  return ipKeyDetails.map(function (item) {
    while (item.ips.length < item.number_of_ips_required) {
      var foundUnusedIP = false;
      while (!foundUnusedIP) {
        var ipObject = IPGenerator.next().value;
        if (!ipObject) {
          throw new Error(`There are not enough free ${ipType} addresses in the ranges to auto populate. Please add more and try again.`);
        }
        var ipCorrectForm = (ipObject.v4 ? ipObject.address : ipObject.canonicalForm());
        if (!allIpsFound.includes(ipCorrectForm) && !previousDocsAddresses.includes(ipCorrectForm)
          && !currentDocsAddresses.includes(ipCorrectForm) && !enmDocsAddresses.includes(ipCorrectForm)) {
          allIpsFound.push(ipCorrectForm);
          item.ips.push(ipObject.address);
          foundUnusedIP = true;
        }
      }
    }
    return item;
  });
}

function isAutopopulatedInternalIPKeyFromRange(ipType) {
  return function ([key, keyDefinition]) {
    var ignorableKeys = [
      'internal_ipv4_subnet_gateway',
      'internal_ipv6_subnet_gateway'
    ];
    if (ignorableKeys.includes(key)) {
      return false;
    }
    if (ipType === 'ipv4') {
      if (keyDefinition.$ref === '#/definitions/ipv4_internal' || keyDefinition.$ref === '#/definitions/ipv4_internal_list') {
        return true;
      }
    } else if (keyDefinition.$ref === '#/definitions/ipv6_internal' || keyDefinition.$ref === '#/definitions/ipv6_internal_list') {
      return true;
    }
    return false;
  };
}

function* getIPObjectFromRanges(ranges, ipType) {
  for (var r = 0; r < ranges.length; r += 1) {
    var range = ranges[r];
    var bigIntStart = getBigIntFromIP(range.start, ipType);
    var bigIntEnd = getBigIntFromIP(range.end, ipType);

    while (bigIntStart.leq(bigIntEnd)) {
      if (ipType === 'ipv4') {
        yield Address4.fromBigInteger(bigIntStart);
      } else {
        yield Address6.fromBigInteger(bigIntStart);
      }
      bigIntStart = bigIntStart.add('1');
    }
  }
}

function add(a, b) {
  return a + b;
}

async function getIPFromHostname(hostname) {
  var timeoutSeconds = 15;
  var timer;
  var timeoutPromise = new Promise(function (resolve, reject) {
    timer = setTimeout(function () {
      reject(new Error(`Unable to retrieve an ip for hostname '${hostname}' after ${timeoutSeconds} seconds, from dns`));
    }, timeoutSeconds * 1000);
  });
  var dnsPromise = new Promise(async function (resolve, reject) {
    try {
      var ipAddress = await dns.lookup(hostname);
      clearTimeout(timer);
      resolve(ipAddress);
    } catch (err) {
      reject(new Error(`Unable to retrieve an ip for hostname '${hostname}', from DNS`));
    }
  });
  var ipAddress = await Promise.race([dnsPromise, timeoutPromise]);
  return ipAddress;
}
