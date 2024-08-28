'use strict';

var _ = require('lodash');
var semver = require('semver');
var Netmask = require('netmask').Netmask;
var Address4 = require('ip-address').Address4;
var Address6 = require('ip-address').Address6;
var bigInt = require('big-integer');
var dns = require('dns-then');
var Schema = require('../../../schemas/server/models/schemas.server.model').Schema;
var Deployment = require('../../../deployments/server/models/deployments.server.model').Schema;
var Document = require('../models/documents.server.model').Schema;
var exclusionIPsValues = [];
var exclusionIPv4Values = [];
var exclusionIPv6Values = [];

exports.autoPopulate = async function (document, schema) {
  if (!document.autopopulate) return;
  if (schema.category === 'enm') {
    var deployment = await Deployment.findOne({ 'enm.sed_id': document._id }).populate({ path: 'project_id', populate: { path: 'pod_id' } }).exec();
    var ipTypes = document.ipv6 ? ['IPv4', 'IPv6'] : ['IPv4'];
    var ipType;
    var ipTypeLowercase;
    var autoPopulatedKeysAndValues;
    if (deployment) {
      var podNetwork;
      for (var n = 0; n < deployment.project_id.pod_id.networks.length; n += 1) {
        if (deployment.project_id.pod_id.networks[n].name === deployment.project_id.network.name) {
          podNetwork = deployment.project_id.pod_id.networks[n];
          break;
        }
      }
      if (!podNetwork) {
        throw new Error(`The network name given in the project settings '${deployment.project_id.network.name}' was not found within the given pod`);
      }
      var vnflcmSedId;
      for (var i = 0; i < deployment.documents.length; i += 1) {
        if (deployment.documents[i].schema_name === 'vnflcm_sed_schema' || deployment.documents[i].schema_category === 'vnflcm') {
          vnflcmSedId = deployment.documents[i].document_id;
        }
      }
      var vnfLcmDocument = await Document.findOne({ _id: vnflcmSedId }).exec();
      autoPopulatedKeysAndValues = {
        'parameters.vim_tenant_name': deployment.project_id.name,
        'parameters.vim_name': `vim_${deployment.project_id.name}`,
        'parameters.cloudManagerRestInterfaceBaseURL': deployment.project_id.pod_id.authUrl,
        'parameters.cloudManagerTenantId': deployment.project_id.id,
        'parameters.cloudManagerTenantName': deployment.project_id.name,
        'parameters.cloudManagerUserName': deployment.project_id.username,
        'parameters.cloudManagerUserPassword': deployment.project_id.password,
        'parameters.enm_internal_network_name': `enm_internal_network_${deployment.project_id.name}`,
        'parameters.enm_external_security_group_name': `enm_external_security_group_${deployment.project_id.name}`,
        'parameters.enm_internal_security_group_name': `enm_internal_security_group_${deployment.project_id.name}`,
        'parameters.enm_laf_security_group_name': `enm_laf_security_group_${deployment.project_id.name}`,
        'parameters.enm_external_network_name': podNetwork.name,
        'parameters.external_subnet': podNetwork.ipv4_subnet.cidr,
        'parameters.external_gateway': podNetwork.ipv4_subnet.gateway_ip,
        'parameters.external_netmask': new Netmask(podNetwork.ipv4_subnet.cidr).mask,
        'parameters.external_subnet_ipv6': podNetwork.ipv6_subnet.cidr,
        'parameters.external_gateway_ipv6': podNetwork.ipv6_subnet.gateway_ip,
        'parameters.key_name': `key_pair_${deployment.project_id.name}`,
        'parameters.ip_version': 'v4'
      };
      // ExclusionIPs from associated Project.
      if (deployment.project_id.exclusion_ipv6_addresses.length) exclusionIPv6Values = _.map(deployment.project_id.exclusion_ipv6_addresses, 'ipv6');
      if (deployment.project_id.exclusion_ipv4_addresses.length) exclusionIPv4Values = _.map(deployment.project_id.exclusion_ipv4_addresses, 'ipv4');
      exclusionIPv6Values = exclusionIPv6Values.map(ip => new Address6(ip).canonicalForm());
      exclusionIPsValues = _.union(exclusionIPv6Values, exclusionIPv4Values);

      // Populate the external IPs
      var previousDocument = await Document.findOne({ _id: document._id });
      for (var a = 0; a < ipTypes.length; a += 1) {
        ipType = ipTypes[a];
        ipTypeLowercase = ipType.toLowerCase();
        var externalRanges = deployment.project_id.network[`${ipTypeLowercase}_ranges`];
        var autoPopulatedExternalIPFromRangeKeys = getAutopopulateExternalIPFromRangeKeys(schema, ipTypeLowercase);
        // Remove keys that are autopopulatable and are in exclusion lists
        for (var k = 0; k < autoPopulatedExternalIPFromRangeKeys.length; k += 1) {
          var keyName = autoPopulatedExternalIPFromRangeKeys[k][0];
          if (document.content.parameters[keyName]) {
            var currentValue = document.content.parameters[keyName];
            var arrayCurrentIPs = currentValue.split(',');
            var isIPv4RegEx = new RegExp(process.env.IPV4REGEX);
            var isIPv6RegEx = new RegExp(process.env.IPV6REGEX);

            for (var o = 0; o < arrayCurrentIPs.length; o += 1) {
              var ip = arrayCurrentIPs[o];
              // If valid(not default) IP and in excluded list
              if (((isIPv4RegEx.test(ip) && ip !== '1.1.1.1') || (isIPv6RegEx.test(ip) && ip !== '::')) &&
                exclusionIPsValues.includes(ip)) {
                // check if contains in excluded ones
                var validNotExcludedIPsArray = filterExcludedIPs(arrayCurrentIPs, ip);
                var newIPValueString = validNotExcludedIPsArray.join(',');
                document.content.parameters[keyName] = newIPValueString;
              }
            }
          }
        }
        autoPopulatedKeysAndValues = populateIPs(schema, autoPopulatedKeysAndValues, document, externalRanges, autoPopulatedExternalIPFromRangeKeys, ipType, 'project', previousDocument, vnfLcmDocument);
      }

      // Populate the internal IPs
      var internalIPv4NetworkObject = new Address4(document.content.parameters.internal_subnet);
      var ipv4StartBigInt = getBigIntFromIP(document.content.parameters.dynamic_ip_range_end, 'ipv4').add('1');
      var ipv4StartIPObject = Address4.fromBigInteger(ipv4StartBigInt);
      var internalIPv6NetworkObject;
      var ipv6StartBigInt;
      var ipv6StartIPObject;
      if (document.ipv6) {
        internalIPv6NetworkObject = new Address6(document.content.parameters.internal_subnet_ipv6);
        ipv6StartBigInt = getBigIntFromIP(document.content.parameters.dynamic_ipv6_range_end, 'ipv6').add('1');
        ipv6StartIPObject = Address6.fromBigInteger(ipv6StartBigInt);
        // Populate ipVersion value to dual on ipv6 checkbox selected
        autoPopulatedKeysAndValues = _.extend(autoPopulatedKeysAndValues, {
          'parameters.ip_version': 'dual'
        });
      }

      var allInternalRanges = {
        ipv4: [{
          start: ipv4StartIPObject.address,
          end: internalIPv4NetworkObject.endAddress().address
        }],
        ipv6: [{
          start: document.ipv6 ? ipv6StartIPObject.address : '',
          end: document.ipv6 ? internalIPv6NetworkObject.endAddress().address : ''
        }]
      };
      for (var b = 0; b < ipTypes.length; b += 1) {
        ipType = ipTypes[b];
        ipTypeLowercase = ipType.toLowerCase();
        var internalRanges = allInternalRanges[ipTypeLowercase];
        var autoPopulatedInternalIPFromRangeKeys = getAutopopulateInternalIPFromRangeKeys(schema, ipTypeLowercase, document.isFFE);
        autoPopulatedKeysAndValues = populateIPs(schema, autoPopulatedKeysAndValues, document, internalRanges, autoPopulatedInternalIPFromRangeKeys, ipType, 'internal', previousDocument, vnfLcmDocument);
      }

      // Figure out the httpd fqdn from its ip in dns
      var httpdFqdn = document.content.parameters.httpd_fqdn || 'temporary';
      if (document.content.parameters.haproxy_instances > 0 && document.dns) {
        var ipaddress = autoPopulatedKeysAndValues['parameters.haproxy_external_ip_list'].split(',')[0];
        httpdFqdn = await getHostnameFromIP(ipaddress);
      }
      // Figure out SSO_COOKIE_DOMAIN depending if Document is FFE
      var ssoCookieDomain = (document.isFFE) ? `${document.content.parameters.deployment_id}.athtem.eei.ericsson.se` : httpdFqdn;

      // Figure out COM_INF_LDAP_ROOT_SUFFIX from first part of httpdFqdn
      var comInfLdapRootSuffix = `dc=${(document.isFFE ? document.content.parameters.deployment_id : httpdFqdn).split('.')[0]},dc=com`;

      // Find esmon_hostname
      var esmonHostname = document.content.parameters.esmon_hostname || 'temporary';
      if (document.content.parameters.esmon_instances > 0 && document.dns) {
        var firstEsmonExternalIP = autoPopulatedKeysAndValues['parameters.esmon_external_ip_list'].split(',')[0];
        var esmonFullHostname = await getHostnameFromIP(firstEsmonExternalIP);
        esmonHostname = esmonFullHostname.split('.')[0];
      }

      // Split the neo4j addresses so they can be reused in the duplicated, single ip fields
      var neo4jAddresses = autoPopulatedKeysAndValues['parameters.neo4j_internal_ip_list'].split(',');

      // Determine available vrrp ids
      var invalidVrrpIDs = await getVrrpIdsKeysWithEmptyOrInvalidValues(schema, document, podNetwork);
      if (invalidVrrpIDs.length) {
        var availableVrrpIdValues = await determineAvailableVrrpIds(podNetwork, schema, document);
        for (var x = 0; x < invalidVrrpIDs.length; x += 1) {
          autoPopulatedKeysAndValues[`parameters.${invalidVrrpIDs[x]}`] = availableVrrpIdValues.pop();
        }
      }

      // Populate any keys that are effected by any auto populated IPs
      autoPopulatedKeysAndValues = _.extend(autoPopulatedKeysAndValues, {
        'parameters.svc_CM_vip_to_fip': autoPopulatedKeysAndValues['parameters.svc_CM_vip_external_ip_address'],
        'parameters.svc_FM_vip_to_fip': autoPopulatedKeysAndValues['parameters.svc_FM_vip_external_ip_address'],
        'parameters.svc_PM_vip_to_fip': autoPopulatedKeysAndValues['parameters.svc_PM_vip_external_ip_address'],
        'parameters.neo4j_1_ip_internal': neo4jAddresses[0],
        'parameters.neo4j_2_ip_internal': neo4jAddresses[1],
        'parameters.neo4j_3_ip_internal': neo4jAddresses[2],
        'parameters.laf_url': `http://${autoPopulatedKeysAndValues['parameters.enm_laf_1_ip_external']}`,
        'parameters.httpd_fqdn': httpdFqdn,
        'parameters.esmon_hostname': esmonHostname,
        'parameters.COM_INF_LDAP_ROOT_SUFFIX': comInfLdapRootSuffix,
        'parameters.SSO_COOKIE_DOMAIN': ssoCookieDomain
      });

      // if saving enmsed and it has vnflcm doc, make sed serviceregistry_internal_ip_list equal to vnflcm value
      if (document.isFFE && deployment.documents[0] && deployment.documents[0].document_id) {
        var vnfLcmDocumentId;
        for (var docIndex = 0; docIndex < deployment.documents.length; docIndex += 1) {
          if (deployment.documents[docIndex].schema_name === 'vnflcm_sed_schema' || deployment.documents[docIndex].schema_category === 'vnflcm') {
            vnfLcmDocumentId = deployment.documents[docIndex].document_id;
            break;
          }
        }
        var vnflcmdoc = await Document.findOne({ _id: vnfLcmDocumentId });
        if (vnflcmdoc) {
          autoPopulatedKeysAndValues = _.extend(autoPopulatedKeysAndValues, {
            'parameters.serviceregistry_internal_ip_list': vnflcmdoc.content.parameters.serviceregistry_internal_ip_list
          });
        }
      }

      // dont autopop httpd_fqdn and esmon_hostname for FFE documents
      if (document.isFFE) {
        delete autoPopulatedKeysAndValues['parameters.httpd_fqdn'];
        delete autoPopulatedKeysAndValues['parameters.esmon_hostname'];
      }
    } else {
      autoPopulatedKeysAndValues = {
        'parameters.vim_tenant_name': 'temporary',
        'parameters.vim_name': 'temporary',
        'parameters.cloudManagerRestInterfaceBaseURL': 'http://temporary.com',
        'parameters.cloudManagerTenantId': 'temporary',
        'parameters.cloudManagerTenantName': 'temporary',
        'parameters.cloudManagerUserName': 'temporary',
        'parameters.cloudManagerUserPassword': 'temporary',
        'parameters.enm_internal_network_name': 'temporary',
        'parameters.enm_external_security_group_name': 'temporary',
        'parameters.enm_internal_security_group_name': 'temporary',
        'parameters.enm_laf_security_group_name': 'temporary',
        'parameters.enm_external_network_name': 'temporary',
        'parameters.external_subnet': '1.1.1.1/1',
        'parameters.external_gateway': '1.1.1.1',
        'parameters.external_netmask': '255.255.255.0',
        'parameters.svc_CM_vip_to_fip': '1.1.1.1',
        'parameters.svc_FM_vip_to_fip': '1.1.1.1',
        'parameters.svc_PM_vip_to_fip': '1.1.1.1',
        'parameters.neo4j_1_ip_internal': '1.1.1.1',
        'parameters.neo4j_2_ip_internal': '1.1.1.1',
        'parameters.neo4j_3_ip_internal': '1.1.1.1',
        'parameters.laf_url': 'http://temporary.com',
        'parameters.httpd_fqdn': 'temporary.com',
        'parameters.COM_INF_LDAP_ROOT_SUFFIX': 'dc=temporary,dc=com',
        'parameters.esmon_hostname': 'temporary',
        'parameters.SSO_COOKIE_DOMAIN': 'temporary.com',
        'parameters.esmon_external_ip_list': '1.1.1.1',
        'parameters.key_name': 'temporary',
        'parameters.lvs_external_CM_vrrp_id': '1',
        'parameters.lvs_external_FM_vrrp_id': '2',
        'parameters.lvs_external_PM_vrrp_id': '3',
        'parameters.ip_version': 'v4'
      };
      //  dont autopop httpd_fqdn and esmon_hostname for FFE documents
      if (document.isFFE) {
        delete autoPopulatedKeysAndValues['parameters.httpd_fqdn'];
        delete autoPopulatedKeysAndValues['parameters.esmon_hostname'];
      }

      if (document.vioTransportOnly) {
        autoPopulatedKeysAndValues = _.extend(autoPopulatedKeysAndValues, {
          'parameters.enm_deployment_type': 'SIENM_transport_only'
        });
      } else if (document.vioOptimizedTransportOnly) {
        autoPopulatedKeysAndValues = _.extend(autoPopulatedKeysAndValues, {
          'parameters.enm_deployment_type': 'OSIENM_transport_only'
        });
      } else if (document.vioMultiTech) {
        autoPopulatedKeysAndValues = _.extend(autoPopulatedKeysAndValues, {
          'parameters.enm_deployment_type': 'SIENM_multi_technology'
        });
      }
      // Fill in the autopopulated ip fields with temporary ip values
      for (var y = 0; y < ipTypes.length; y += 1) {
        ipType = ipTypes[y];
        ipTypeLowercase = ipType.toLowerCase();
        autoPopulatedKeysAndValues = getAutopopulateExternalIPFromRangeKeys(schema, ipTypeLowercase).map(getKeyFromKeyValue)
          .reduce(addTemporaryIPValueForKey(ipTypeLowercase), autoPopulatedKeysAndValues);
        autoPopulatedKeysAndValues = getAutopopulateInternalIPFromRangeKeys(schema, ipTypeLowercase).map(getKeyFromKeyValue)
          .reduce(addTemporaryIPValueForKey(ipTypeLowercase), autoPopulatedKeysAndValues);
      }
    }
    Object.keys(autoPopulatedKeysAndValues).forEach(function (key) {
      var propertyPath = `properties.${key.replace(/\./g, '.properties.')}`;
      if (_.has(schema.content, propertyPath)) {
        _.set(document.content, key, autoPopulatedKeysAndValues[key]);
      }
    });
  }

  if (schema.category === 'cenm') {
    var foundDeployment = await Deployment.findOne({ 'enm.sed_id': document._id }).populate({ path: 'project_id', populate: { path: 'pod_id' } }).exec();
    var autoPopVal = {};

    if (foundDeployment) {
      var podNetworkcENM;
      for (var m = 0; m < foundDeployment.project_id.pod_id.networks.length; m += 1) {
        if (foundDeployment.project_id.pod_id.networks[m].name === foundDeployment.project_id.network.name) {
          podNetworkcENM = foundDeployment.project_id.pod_id.networks[m];
          break;
        }
      }
      if (!podNetworkcENM) {
        throw new Error(`The network name given in the project settings '${foundDeployment.project_id.network.name}' was not found within the given pod`); // eslint-disable-line max-len
      }
      if (foundDeployment.project_id.exclusion_ipv4_addresses.length) {
        exclusionIPv4Values = _.map(foundDeployment.project_id.exclusion_ipv4_addresses, 'ipv4');
      }
      if (foundDeployment.project_id.exclusion_ipv6_addresses.length) {
        exclusionIPv6Values = _.map(foundDeployment.project_id.exclusion_ipv6_addresses, 'ipv6');
      }
      exclusionIPv6Values = exclusionIPv6Values.map(ip => new Address6(ip).canonicalForm());
      exclusionIPsValues = _.union(exclusionIPv6Values, exclusionIPv4Values);
      // Populate the external ipv4 autopop IPs
      var previouscENMDocument = await Document.findOne({ _id: document._id });
      var extRangesIPv4 = foundDeployment.project_id.network.ipv4_ranges;
      var autoPopulatedExternalIPcENMFromRangeKeysIPv4 = getAutopopulateExternalIPFromRangeKeys(schema, 'ipv4');
      autoPopVal = populateIPs(schema, autoPopVal, document, extRangesIPv4, autoPopulatedExternalIPcENMFromRangeKeysIPv4, 'IPv4', 'project', previouscENMDocument, false);
      // Populate the external ipv6 autopop IPs
      var extRangesIPv6 = foundDeployment.project_id.network.ipv6_ranges;
      var autoPopulatedExternalIPcENMFromRangeKeysIPv6 = getAutopopulateExternalIPFromRangeKeys(schema, 'ipv6');
      var IPv6AutoPop = populateIPs(schema, autoPopVal, document, extRangesIPv6, autoPopulatedExternalIPcENMFromRangeKeysIPv6, 'IPv6', 'project', previouscENMDocument, false);
      autoPopVal = _.extend(IPv6AutoPop);
    } else {
      // Populate ipv4 autopop IPs with temp values
      autoPopVal = getAutopopulateIP(schema, 'ipv4').map(getKeyFromKeyValue)
        .reduce(addTemporaryIPValueForKey('ipv4'), autoPopVal);
      // Populate ipv6 autopop IPs with temp values
      autoPopVal = getAutopopulateIP(schema, 'ipv6').map(getKeyFromKeyValue)
        .reduce(addTemporaryIPValueForKey('ipv6'), autoPopVal);
    }

    Object.keys(autoPopVal).forEach(function (key) {
      var propertyPath = `properties.${key.replace(/\./g, '.properties.')}`;
      if (_.has(schema.content, propertyPath)) {
        _.set(document.content, key, autoPopVal[key]);
      }
    });
  }
};

function filterExcludedIPs(ipArray, excludedIp) {
  return ipArray.filter(ip => ip !== excludedIp);
}

function getAutopopulateIP(schema, ipType) {
  if (_.has(schema.content, 'properties.parameters.properties')) {
    return Object.entries(schema.content.properties.parameters.properties).filter(isAutopopulateIP(ipType));
  }
  return [];
}

function isAutopopulateIP(ipType) {
  return function ([key, keyDefinition]) {
    return keyDefinition.$ref && keyDefinition.$ref.includes(ipType) && keyDefinition.$ref.includes('_autopop');
  };
}

function getAutopopulateExternalIPFromRangeKeys(schema, ipType) {
  if (_.has(schema.content, 'properties.parameters.properties')) {
    return Object.entries(schema.content.properties.parameters.properties).filter((schema.category === 'cenm' ? isAutopopulatedExternalIPKeyFromRangeCENM(ipType) : isAutopopulatedExternalIPKeyFromRange(ipType)));
  }
  return [];
}

function getVrrpIdKeysFromSchema(schema) {
  var vrrpIdObjects = [];
  if (_.has(schema.content, 'properties.parameters.properties')) {
    vrrpIdObjects = Object.entries(schema.content.properties.parameters.properties).filter(function ([key, keyDefinition]) {
      return (keyDefinition.$ref === '#/definitions/virtual_router_identifier' || keyDefinition.$ref === '#/definitions/vrrp_id');
    });
    return vrrpIdObjects.map(function ([key, keyDefinition]) { return { key }; });
  }
}

async function getVrrpIdsKeysWithEmptyOrInvalidValues(schema, document, podNetwork) {
  var vrrpIdKeysWithInvalidValues = [];
  var vrrpIdKeys = getVrrpIdKeysFromSchema(schema);
  var usedVrrpIds = await findVrrpIdsInUse(schema, document, vrrpIdKeys, podNetwork);
  var vrrpIdRangeStart = podNetwork.vrrp_range.start;
  var vrrpIdRangeEnd = podNetwork.vrrp_range.end;

  vrrpIdKeys.forEach(function (vrrpId) {
    var vrrpIdKey = parseInt(document.content.parameters[vrrpId.key], 10);
    if (!vrrpIdKey || usedVrrpIds.includes(vrrpIdKey.toString()) || vrrpIdKey < vrrpIdRangeStart || vrrpIdKey > vrrpIdRangeEnd) {
      vrrpIdKeysWithInvalidValues.push(vrrpId.key);
    }
  });
  var dupVrrpIdKeys = getDuplicateKeysInCurrentDocument(document, vrrpIdKeys);
  return vrrpIdKeysWithInvalidValues.concat(dupVrrpIdKeys);
}

function getDuplicateKeysInCurrentDocument(document, vrrpIdKeys) {
  var assignedIDs = [];
  var dupVrrpIdKeys = [];
  for (var i = 0; i < vrrpIdKeys.length; i += 1) {
    var value = document.content.parameters[vrrpIdKeys[i].key];
    if (value && !assignedIDs.includes(value)) {
      assignedIDs.push(value);
    } else if (value && assignedIDs.includes(value)) {
      dupVrrpIdKeys.push(vrrpIdKeys[i].key);
    }
  }
  return dupVrrpIdKeys;
}

async function getVrrpIdsInUseOutsideCurrentDoc(vrrpIdKeys, podNetwork, currentDoc, schema) {
  var usedVrrpIds = [];
  var vrrpQueryString = '_id ';
  for (var i = 0; i < vrrpIdKeys.length; i += 1) {
    vrrpQueryString += `content.parameters.${vrrpIdKeys[i].key} `;
  }
  var documentsOnSamePodNetwork = await Document.find({
    'content.parameters.enm_external_network_name': podNetwork.name,
    _id: { $ne: currentDoc._id }
  }).select(vrrpQueryString);
  var allDocumentsOnSamePodNetwork = _.cloneDeep(documentsOnSamePodNetwork);
  var podId;
  if (schema.category === 'enm') {
    var deployment = await Deployment.findOne({ 'enm.sed_id': currentDoc._id }).populate({ path: 'project_id', populate: { path: 'pod_id' } }).exec();
    allDocumentsOnSamePodNetwork.push(currentDoc);
    podId = deployment.project_id.pod_id._id;
  } else if (schema.category === 'vnflcm') {
    var vnfDeployment = await Deployment.findOne({ documents: { $elemMatch: { document_id: currentDoc._id } } }).populate({ path: 'project_id', populate: { path: 'pod_id' } }).exec();
    podId = vnfDeployment.project_id.pod_id._id;
  }
  var vnfLcmDocuments = [];
  var vnfLcmDocumentId;
  var deployments = [];
  var podDocIds = [];
  for (var allDocIndex = 0; allDocIndex < allDocumentsOnSamePodNetwork.length; allDocIndex += 1) {
    deployments.push(Deployment.findOne({ 'enm.sed_id': allDocumentsOnSamePodNetwork[allDocIndex]._id }).populate({ path: 'project_id', populate: { path: 'pod_id' } }).exec());
  }
  await Promise.all(deployments).then(function (deployments) {
    for (var a = 0; a < deployments.length; a += 1) {
      if (deployments[a] && deployments[a].project_id.pod_id._id.equals(podId)) podDocIds.push(deployments[a].enm.sed_id.toString());
    }
    documentsOnSamePodNetwork = documentsOnSamePodNetwork.filter(function (doc) {
      return podDocIds.includes(doc._id.toString());
    });
    for (var deploymentIndex = 0; deploymentIndex < deployments.length; deploymentIndex += 1) {
      if (deployments[deploymentIndex]) {
        for (var k = 0; k < deployments[deploymentIndex].documents.length; k += 1) {
          if (deployments[deploymentIndex].documents[k].schema_name === 'vnflcm_sed_schema' || deployments[deploymentIndex].documents[k].schema_category === 'vnflcm') {
            vnfLcmDocumentId = deployments[deploymentIndex].documents[k].document_id;
            vnfLcmDocuments.push(Document.findOne({ _id: vnfLcmDocumentId }));
          }
        }
      }
    }
  });
  await Promise.all(vnfLcmDocuments).then(function (vnfLcmDocuments) {
    var vrrpVnfLcmDocuments = [];
    for (var vnfDocIndex = 0; vnfDocIndex < vnfLcmDocuments.length; vnfDocIndex += 1) {
      for (var x = 0; x < vrrpIdKeys.length; x += 1) {
        if (vnfLcmDocuments[vnfDocIndex] && vrrpIdKeys[x].key in vnfLcmDocuments[vnfDocIndex].content.parameters) {
          vrrpVnfLcmDocuments.push(vnfLcmDocuments[vnfDocIndex]);
          break;
        }
      }
    }
    for (var docIndex = 0; docIndex < vrrpVnfLcmDocuments.length; docIndex += 1) {
      documentsOnSamePodNetwork.push(vrrpVnfLcmDocuments[docIndex]);
    }
  });
  // Extract used vrrp ids from these documents
  for (var y = 0; y < documentsOnSamePodNetwork.length; y += 1) {
    if (!currentDoc._id.equals(documentsOnSamePodNetwork[y]._id)) {
      for (var z = 0; z < vrrpIdKeys.length; z += 1) {
        if (documentsOnSamePodNetwork[y].content.parameters[vrrpIdKeys[z].key]) {
          usedVrrpIds.push(documentsOnSamePodNetwork[y].content.parameters[vrrpIdKeys[z].key]);
        }
      }
    }
  }
  return usedVrrpIds;
}

async function determineAvailableVrrpIds(podNetwork, schema, document) {
  var vrrpIdKeys = getVrrpIdKeysFromSchema(schema);
  var usedVrrpIdsOutsideCurrentDoc = await findVrrpIdsInUse(schema, document, vrrpIdKeys, podNetwork);
  var usedVrrpIdsInCurrentDoc = await findValidVrrpIdsInCurrentDoc(vrrpIdKeys, document, usedVrrpIdsOutsideCurrentDoc);
  var usedVrrpIds = usedVrrpIdsOutsideCurrentDoc.concat(usedVrrpIdsInCurrentDoc);

  var vrrpIdRangeStart = podNetwork.vrrp_range.start;
  var vrrpIdRangeEnd = podNetwork.vrrp_range.end;
  // Fills array with valid vrrp ids based off the range start and end
  var validVrrpIds = Array((vrrpIdRangeEnd - vrrpIdRangeStart) + 1).fill()
    .map((item, index) => (parseInt(vrrpIdRangeStart, 10) + parseInt(index, 10)).toString());
  // Determines available ids by removing used ids from valid ids array
  var availableVrrpIds = validVrrpIds.filter(i => !usedVrrpIds.includes(i) || usedVrrpIdsInCurrentDoc.includes(i));
  if (availableVrrpIds.length < vrrpIdKeys.length) {
    throw new Error(`Not enough Vrrp ids available to populate document. ${availableVrrpIds.length} available, ${vrrpIdKeys.length} required.`);
  }

  var availableVrrpIdsForRemainingAutopop = availableVrrpIds.filter(i => !usedVrrpIdsInCurrentDoc.includes(i));
  return availableVrrpIdsForRemainingAutopop.sort((a, b) => b - a);
}

async function findVrrpIdsInUse(schema, currentDoc, vrrpIdKeys, podNetwork) {
  var vnfLcmDocumentId;
  var otherSchema;
  var deployment;
  if (schema.category === 'enm') {
    deployment = await Deployment.findOne({ 'enm.sed_id': currentDoc._id }).populate({ path: 'project_id', populate: { path: 'pod_id' } }).exec();
    if (deployment) {
      for (var j = 0; j < deployment.documents.length; j += 1) {
        if (deployment.documents[j].schema_name === 'vnflcm_sed_schema' || deployment.documents[j].schema_category === 'vnflcm') {
          vnfLcmDocumentId = deployment.documents[j].document_id;
        }
      }
      if (vnfLcmDocumentId) {
        var vnfLcmDocument = await Document.findOne({ _id: vnfLcmDocumentId });
        otherSchema = await Schema.findOne({ _id: vnfLcmDocument.schema_id });
      }
    }
  } else if (schema.category === 'vnflcm') {
    deployment = await Deployment.findOne({ documents: { $elemMatch: { document_id: currentDoc._id } } }).populate({ path: 'project_id', populate: { path: 'pod_id' } }).exec();
    if (deployment) {
      var enmDocumentId = deployment.enm.sed_id;
      var enmDocument = await Document.findOne({ _id: enmDocumentId });
      otherSchema = await Schema.findOne({ _id: enmDocument.schema_id });
    }
  }

  if (otherSchema) {
    var otherVrrpIdKeys = getVrrpIdKeysFromSchema(otherSchema);
    vrrpIdKeys = vrrpIdKeys.concat(otherVrrpIdKeys);
  }
  return getVrrpIdsInUseOutsideCurrentDoc(vrrpIdKeys, podNetwork, currentDoc, schema);
}

async function findValidVrrpIdsInCurrentDoc(vrrpIdKeys, currentDoc, usedVrrpIdsOutsideCurrentDoc) {
  var vrrpIdsUsedInCurrentDoc = [];
  vrrpIdKeys.forEach(function (vrrpId) {
    // Extract used vrrp ids from the document that are not also used in other documents
    var vrrpIdKeyValue = currentDoc.content.parameters[vrrpId.key];
    if (vrrpIdKeyValue && !usedVrrpIdsOutsideCurrentDoc.includes(vrrpIdKeyValue)) vrrpIdsUsedInCurrentDoc.push(vrrpIdKeyValue);
  });
  return vrrpIdsUsedInCurrentDoc;
}

function populateIPs(
  schema, autoPopulatedKeysAndValues, document, ranges, autoPopulatedIPFromRangeKeys,
  ipType, rangeTypeString, previousDocument, vnfLcmDocument
) {
  var ipTypeLowercase = ipType.toLowerCase();
  // Build an initial array of ipKey details that can be built up and manipulated
  var ipKeyDetails = autoPopulatedIPFromRangeKeys.map(function ([key, keyDefinition]) {
    return {
      key_name: key,
      number_of_ips_required: getNumberOfIPsRequiredForKey(schema, document, key, keyDefinition),
      ips: getExistingIPArrayFromDocument(document, key, ipTypeLowercase)
    };
  });
  // Remove duplicate ips accross all keys
  ipKeyDetails = removeDuplicatesFromIPKeyDetails(ipKeyDetails, ipTypeLowercase);

  var keysSameInVnfSed = [
    'enm_laf_1_ip_internal',
    'vnflaf_db_1_ip_internal',
    'enm_laf_1_ip_external',
    'vnflaf_db_1_ip_external',
    'enm_laf_1_ipv6_external',
    'vnflaf_db_1_ipv6_external',
    'visinamingnb_external_ip_list',
    'nbalarmirp_external_ip_list'
  ];
  if (!document.isFFE) keysSameInVnfSed.push('serviceregistry_internal_ip_list');
  // Doesnt apply to cENM
  if (semver.gt(schema.version, '1.65.2') && schema.category !== 'cenm') {
    keysSameInVnfSed = [
      'serviceregistry_internal_ip_list',
      'visinamingnb_external_ip_list',
      'nbalarmirp_external_ip_list'
    ];
  }

  // Remove ips that are not valid within the project ranges
  ipKeyDetails = ipKeyDetails.map(filterIPsInvalidInRanges(ranges, ipTypeLowercase));

  // Remove duplicate ips in each individual ipKey and remove ips where there are too many
  ipKeyDetails = ipKeyDetails.map(function (item) {
    item.ips = _.uniq(item.ips).splice(0, item.number_of_ips_required);
    return item;
  });

  var vnfLcmDocsAddresses = [];
  if (vnfLcmDocument) {
    var checkIpAddress = true;
    vnfLcmDocsAddresses = getDocumentAddresses(vnfLcmDocument);
    // Reversed loop due to removing elements from the array messing up the index and skipping loops
    for (var keyIndex = ipKeyDetails.length - 1; keyIndex >= 0; keyIndex -= 1) {
      checkIpAddress = true;
      if (keysSameInVnfSed.includes(ipKeyDetails[keyIndex].key_name) && ipKeyDetails[keyIndex].ips.length !== 0) {
        var splice = true;
        if (!ipKeyDetails[keyIndex].ips.includes('1.1.1.1') && !ipKeyDetails[keyIndex].ips.includes('::')) {
          if (ipKeyDetails[keyIndex].key_name === 'nbalarmirp_external_ip_list') {
            // handle adding extra ips
            if (ipKeyDetails[keyIndex].ips.length !== ipKeyDetails[keyIndex].number_of_ips_required) {
              splice = false;
            }
            // handle removing by checking if vnflcm doc has more than required here
            if (vnfLcmDocument.content.parameters.ossNbiAlarmIP &&
              vnfLcmDocument.content.parameters.ossNbiAlarmIP.length !== ipKeyDetails[keyIndex].ips.length) {
              splice = false;
            }
          }
          if (splice) ipKeyDetails.splice(keyIndex, 1);
          checkIpAddress = false;
        }
      }
      if (checkIpAddress) {
        for (var ipIndex = 0; ipIndex < ipKeyDetails[keyIndex].ips.length; ipIndex += 1) {
          if (vnfLcmDocsAddresses.includes(ipKeyDetails[keyIndex].ips[ipIndex])) {
            ipKeyDetails[keyIndex].ips.splice(ipIndex, 1);
          }
        }
      }
    }
  }
  var ipCountRequired = ipKeyDetails.map(entry => entry.number_of_ips_required).reduce(add, 0);
  var ipsInRanges = ranges.map(countIPsInRange(ipTypeLowercase)).reduce(add, 0);
  if (ipCountRequired > ipsInRanges) {
    throw new Error(`There are not enough free ${ipType} addresses in the ${rangeTypeString} ranges to auto populate. ${ipCountRequired} ${ipType} addresses are required in total but the ${rangeTypeString} ranges only have ${ipsInRanges} ${ipType} addresses in total. Please add more and try again.`); // eslint-disable-line max-len
  }

  // Fill in any missing ips
  ipKeyDetails = populateMissingIPsInKeyDetails(ipKeyDetails, ranges, ipTypeLowercase, previousDocument, document, vnfLcmDocument);
  for (var x = 0; x < ipKeyDetails.length; x += 1) {
    var item = ipKeyDetails[x];
    if (item.ips.length > 0) autoPopulatedKeysAndValues[`parameters.${item.key_name}`] = item.ips.join(',');
    else autoPopulatedKeysAndValues[`parameters.${item.key_name}`] = (ipTypeLowercase === 'ipv4') ? '1.1.1.1' : '::';
  }
  return autoPopulatedKeysAndValues;
}

function getBigIntFromIP(ipaddress, ipType) {
  var ipObject = (ipType === 'ipv4') ? new Address4(ipaddress) : new Address6(ipaddress);
  if (!ipObject.isValid()) throw new Error(`The ip address given '${ipaddress}' is not a valid address`);
  return bigInt(ipObject.bigInteger().toString());
}

function getAutopopulateInternalIPFromRangeKeys(schema, ipType, isDocumentFFE) {
  if (_.has(schema.content, 'properties.parameters.properties')) {
    return Object.entries(schema.content.properties.parameters.properties).filter(isAutopopulatedInternalIPKeyFromRange(ipType, isDocumentFFE));
  }
  return [];
}

async function getHostnameFromIP(ipaddress) {
  var timeoutSeconds = 15;
  var timer;
  var timeoutPromise = new Promise(function (resolve, reject) {
    timer = setTimeout(function () {
      reject(new Error(`Unable to retrieve a hostname for ip '${ipaddress}' after ${timeoutSeconds} seconds, from dns`));
    }, timeoutSeconds * 1000);
  });
  var dnsPromise = new Promise(async function (resolve, reject) {
    try {
      var hostnames = await dns.reverse(ipaddress);
      clearTimeout(timer);
      resolve(hostnames);
    } catch (err) {
      reject(new Error(`Unable to retrieve a hostname for ip '${ipaddress}', from dns`));
    }
  });
  var hostnames = await Promise.race([dnsPromise, timeoutPromise]);
  return hostnames[0];
}

function addTemporaryIPValueForKey(ipType) {
  return function (autoPopulatedKeysAndValues, key) {
    autoPopulatedKeysAndValues[`parameters.${key}`] = getTemporaryIPValueForIPType(ipType);
    return autoPopulatedKeysAndValues;
  };
}

function isAutopopulatedExternalIPKeyFromRange(ipType) {
  return function ([key, keyDefinition]) {
    var ignorableKeys = [
      'external_gateway',
      'external_gateway_ipv6',
      'svc_CM_vip_to_fip',
      'svc_FM_vip_to_fip',
      'svc_PM_vip_to_fip'
    ];

    if (ignorableKeys.includes(key)) {
      return false;
    } else if (ipType === 'ipv4') {
      return (keyDefinition.$ref === '#/definitions/ipv4_external_list' || keyDefinition.$ref === '#/definitions/ipv4_external');
    }
    return (keyDefinition.$ref === '#/definitions/ipv6_external_list' || keyDefinition.$ref === '#/definitions/ipv6_external');
  };
}

function isAutopopulatedExternalIPKeyFromRangeCENM(ipType) {
  return function ([key, keyDefinition]) {
    return (keyDefinition.$ref && keyDefinition.$ref.includes(ipType) && keyDefinition.$ref.includes('autopop'));
  };
}

function getNumberOfIPsRequiredForKey(schema, document, key, keyDefinition) {
  var numberOfIpsRequired = 1;
  var listDefinitions = [
    '#/definitions/ipv4_external_list',
    '#/definitions/ipv6_external_list',
    '#/definitions/ipv4_internal_list',
    '#/definitions/ipv6_internal_list'
  ];
  if (listDefinitions.includes(keyDefinition.$ref)) {
    var instancesKeyName = `${key.split('_')[0]}_instances`;
    if (schema.category === 'vnflcm') instancesKeyName = `${rsplit(key, '_', 2)[1]}_${rsplit(key, '_', 2)[2]}_count`;
    if (document.content.parameters[instancesKeyName]) numberOfIpsRequired = parseInt(document.content.parameters[instancesKeyName], 10);
  }
  return numberOfIpsRequired;
}

function getExistingIPArrayFromDocument(document, key, ipTypeLowercase) {
  if (document.content.parameters[key]) {
    return getArrayFromCommaSeparatedList(document.content.parameters[key], ipTypeLowercase);
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
    var ipCorrectForm = (ipType === 'ipv4') ? ip : new Address6(ip).correctForm();
    if (!allIpsFound.includes(ipCorrectForm)) {
      allIpsFound.push(ipCorrectForm);
      return true;
    }
    return false;
  };
}

function populateMissingIPsInKeyDetails(ipKeyDetails, ranges, ipType, previousDocument, document, vnfLcmDocument) {
  var previousDocsAddresses = getDocumentAddresses(previousDocument);
  var vnfLcmDocsAddresses = [];
  if (vnfLcmDocument) {
    vnfLcmDocsAddresses = getDocumentAddresses(vnfLcmDocument);
  }
  var currentDocsAddresses = getDocumentAddresses(document);
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
        var everyIpArray = allIpsFound.concat(previousDocsAddresses, currentDocsAddresses, vnfLcmDocsAddresses, exclusionIPsValues);
        var ipCorrectForm = (ipObject.v4 ? ipObject.address : ipObject.canonicalForm());
        if (!everyIpArray.includes(ipCorrectForm)) {
          allIpsFound.push(ipCorrectForm);
          item.ips.push(ipObject.address);
          foundUnusedIP = true;
        }
      }
    }
    return item;
  });
}

function getDocumentAddresses(document) {
  var documentAddresses = [];
  Object.entries(document.content.parameters).forEach(function ([key, value]) {
    if (value) {
      var valuesSplit = value.toString().split(',');
      for (var x = 0; x < valuesSplit.length; x += 1) {
        var valueAsAddress = new Address4(valuesSplit[x]);
        if (valueAsAddress.isValid()) documentAddresses.push(valueAsAddress.address);
        else {
          valueAsAddress = new Address6(valuesSplit[x]);
          if (valueAsAddress.isValid()) documentAddresses.push(valueAsAddress.canonicalForm());
        }
      }
    }
  });
  return documentAddresses;
}

function countIPsInRange(ipType) {
  return function (range) {
    if (range.start && range.end) {
      var bigIntEnd = getBigIntFromIP(range.end, ipType);
      var bigIntStart = getBigIntFromIP(range.start, ipType);
      if (bigInt(bigIntEnd).compareAbs(bigIntStart) === -1) {
        throw new Error(`${ipType} Range end cannot be lower than range start. Please review subnet values within SED.`);
      } else {
        return parseInt(bigIntEnd.minus(bigIntStart).toString(), 10) + 1;
      }
    }
    return 0;
  };
}

function filterIPsInvalidInRanges(ranges, ipType) {
  return function (item) {
    item.ips = item.ips.filter(isIPValidInRanges(ranges, ipType));
    return item;
  };
}

function isAutopopulatedInternalIPKeyFromRange(ipType, isDocumentFFE) {
  return function ([key, keyDefinition]) {
    var ignorableKeys = [
      'dynamic_ip_range_start',
      'dynamic_ip_range_end',
      'dynamic_ipv6_range_start',
      'dynamic_ipv6_range_end',
      'internal_subnet_ipv6',
      'neo4j_1_ip_internal',
      'neo4j_2_ip_internal',
      'neo4j_3_ip_internal'
    ];

    if (isDocumentFFE) ignorableKeys.push('serviceregistry_internal_ip_list');

    if (ignorableKeys.includes(key)) return false;
    var type = (ipType === 'ipv4') ? '4' : '6';
    return (keyDefinition.$ref === `#/definitions/ipv${type}_internal_list` || keyDefinition.$ref === `#/definitions/ipv${type}_internal`);
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

function getTemporaryIPValueForIPType(ipType) {
  return (ipType === 'ipv4') ? '1.1.1.1' : '::';
}

function getArrayFromCommaSeparatedList(string, ipTypeLowercase) {
  var value = string.replace(/\s+/g, '').split(',');
  if (value[0] === '') {
    return ipTypeLowercase === 'ipv4' ? ['1.1.1.1'] : ['::'];
  }
  return value;
}

function isIPValidInRanges(ranges, ipType) {
  return function (ip) {
    var bigIntIp = getBigIntFromIP(ip, ipType);
    return ranges.some(function (range) {
      return bigIntIp.geq(getBigIntFromIP(range.start, ipType)) && bigIntIp.leq(getBigIntFromIP(range.end, ipType));
    });
  };
}

function getKeyFromKeyValue(keyValue) {
  return keyValue[0];
}

function rsplit(value, sep, maxSplit) {
  var splitValue = value.split(sep);
  return maxSplit ? [splitValue.slice(0, -maxSplit).join(sep)].concat(splitValue.slice(-maxSplit)) : splitValue;
}
module.exports.getDocumentAddresses = getDocumentAddresses;
module.exports.countIPsInRange = countIPsInRange;
module.exports.filterIPsInvalidInRanges = filterIPsInvalidInRanges;
module.exports.getTemporaryIPValueForIPType = getTemporaryIPValueForIPType;
module.exports.getArrayFromCommaSeparatedList = getArrayFromCommaSeparatedList;
module.exports.getKeyFromKeyValue = getKeyFromKeyValue;
module.exports.getNumberOfIPsRequiredForKey = getNumberOfIPsRequiredForKey;
module.exports.getVrrpIdsKeysWithEmptyOrInvalidValues = getVrrpIdsKeysWithEmptyOrInvalidValues;
module.exports.determineAvailableVrrpIds = determineAvailableVrrpIds;
