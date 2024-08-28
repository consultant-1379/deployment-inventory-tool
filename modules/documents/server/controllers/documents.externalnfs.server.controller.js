'use strict';

var _ = require('lodash');

exports.populateNfsKeyValues = async function (document, schema) {
  if (document.managedconfig) {
    return;
  }
  var nfsPopulatedKeysAndValues = {};
  if (document.useexternalnfs) {
    populateHiddenInternalNfsKeys(schema, nfsPopulatedKeysAndValues);
  } else {
    populateHiddenExternalNfsKeys(schema, nfsPopulatedKeysAndValues);
  }
  Object.keys(nfsPopulatedKeysAndValues).forEach(function (key) {
    var propertyPath = `properties.${key.replace(/\./g, '.properties.')}`;
    if (_.has(schema.content, propertyPath)) {
      _.set(document.content, key, nfsPopulatedKeysAndValues[key]);
    }
  });
};

function populateHiddenInternalNfsKeys(schema, nfsPopulatedKeysAndValues) {
  var nfsInstances = getKeysFromSchemaByDefinition(schema, '#/definitions/nfs_instances');
  var nfsVolumes = getKeysFromSchemaByDefinition(schema, '#/definitions/nfs_volume_size');
  var nfsVolumeBackups = getKeysFromSchemaByDefinition(schema, '#/definitions/nfs_volume_snap');
  var nfsIpv4List = getKeysFromSchemaByDefinition(schema, '#/definitions/nfs_ipv4_external_list');
  var nfsIpv6List = getKeysFromSchemaByDefinition(schema, '#/definitions/nfs_ipv6_external_list');
  // To ensure backward compatibility to be removed at a later date.
  var nfsSpecificDefinitionsExistInSchema = true;
  var externalNFSKeys = [nfsInstances, nfsVolumes, nfsVolumeBackups, nfsIpv4List, nfsIpv6List];
  for (var keyIndex in externalNFSKeys) {
    if (externalNFSKeys[keyIndex] === undefined || externalNFSKeys[keyIndex].length === 0) {
      nfsSpecificDefinitionsExistInSchema = false;
      break;
    }
  }
  if (!nfsSpecificDefinitionsExistInSchema) {
    nfsPopulatedKeysAndValues['parameters.nfspm_instances'] = '0';
    nfsPopulatedKeysAndValues['parameters.nfspmlinks_instances'] = '0';
    nfsPopulatedKeysAndValues['parameters.nfssmrs_instances'] = '0';
    nfsPopulatedKeysAndValues['parameters.nfsamos_volume_size'] = '1';
    nfsPopulatedKeysAndValues['parameters.nfspm_volume_size'] = '1';
    nfsPopulatedKeysAndValues['parameters.nfspmlinks_volume_size'] = '1';
    nfsPopulatedKeysAndValues['parameters.nfssmrs_volume_size'] = '1';
    nfsPopulatedKeysAndValues['parameters.nfspm_external_ip_list'] = '1.1.1.1';
    nfsPopulatedKeysAndValues['parameters.nfspm_external_ipv6_list'] = '::';
    nfsPopulatedKeysAndValues['parameters.nfspm_volume_backup'] = 'no';
    nfsPopulatedKeysAndValues['parameters.nfspmlinks_external_ip_list'] = '1.1.1.1';
    nfsPopulatedKeysAndValues['parameters.nfspmlinks_external_ipv6_list'] = '::';
    nfsPopulatedKeysAndValues['parameters.nfspmlinks_volume_backup'] = 'no';
  } else {
    for (var instanceIndex = 0; instanceIndex < nfsInstances.length; instanceIndex += 1) {
      nfsPopulatedKeysAndValues[`parameters.${nfsInstances[instanceIndex].key}`] = '0';
    }
    for (var volumeIndex = 0; volumeIndex < nfsVolumes.length; volumeIndex += 1) {
      if (nfsVolumes[volumeIndex].key === 'nfsamos_volume_size') {
        nfsPopulatedKeysAndValues[`parameters.${nfsVolumes[volumeIndex].key}`] = '1';
      } else {
        nfsPopulatedKeysAndValues[`parameters.${nfsVolumes[volumeIndex].key}`] = '0';
      }
      for (var backupIndex = 0; backupIndex < nfsVolumeBackups.length; backupIndex += 1) {
        var backupKeyName = nfsVolumeBackups[backupIndex].key;
        nfsPopulatedKeysAndValues[`parameters.${backupKeyName}`] = 'no';
      }
      for (var listIndex = 0; listIndex < nfsIpv4List.length; listIndex += 1) {
        var ipv4ListKeyName = nfsIpv4List[listIndex].key;
        nfsPopulatedKeysAndValues[`parameters.${ipv4ListKeyName}`] = '1.1.1.1';
      }
      for (var ipv6ListIndex = 0; ipv6ListIndex < nfsIpv6List.length; ipv6ListIndex += 1) {
        var ipv6ListKeyName = nfsIpv6List[ipv6ListIndex].key;
        nfsPopulatedKeysAndValues[`parameters.${ipv6ListKeyName}`] = '::';
      }
    }
  }
}

function populateHiddenExternalNfsKeys(schema, nfsPopulatedKeysAndValues) {
  var nfsExportedFs = getKeysFromSchemaByDefinition(schema, '#/definitions/nfs_exported_fs');
  var externalNfsServer = getKeysFromSchemaByDefinition(schema, '#/definitions/external_nfs_server');
  // To ensure backward compatibility to be removed at a later date.
  var nfsSpecificDefinitionsExistInSchema = true;
  var externalNFSKeys = [nfsExportedFs, externalNfsServer];
  for (var keyIndex in externalNFSKeys) {
    if (externalNFSKeys[keyIndex] === undefined || externalNFSKeys[keyIndex].length === 0) {
      nfsSpecificDefinitionsExistInSchema = false;
      break;
    }
  }
  if (!nfsSpecificDefinitionsExistInSchema) {
    nfsPopulatedKeysAndValues['parameters.nfsamos_external_exported_fs'] = '';
    nfsPopulatedKeysAndValues['parameters.nfsamos_external_server'] = '';
    nfsPopulatedKeysAndValues['parameters.nfspm1_external_server'] = '';
    nfsPopulatedKeysAndValues['parameters.nfspm1_external_exported_fs'] = '';
    nfsPopulatedKeysAndValues['parameters.nfspm2_external_server'] = '';
    nfsPopulatedKeysAndValues['parameters.nfspm2_external_exported_fs'] = '';
    nfsPopulatedKeysAndValues['parameters.nfspmlinks_external_server'] = '';
    nfsPopulatedKeysAndValues['parameters.nfspmlinks_external_exported_fs'] = '';
    nfsPopulatedKeysAndValues['parameters.nfssmrs_external_server'] = '';
    nfsPopulatedKeysAndValues['parameters.nfssmrs_external_exported_fs'] = '';
  } else {
    for (var fsIndex = 0; fsIndex < nfsExportedFs.length; fsIndex += 1) {
      var exportedFsKeyName = nfsExportedFs[fsIndex].key;
      nfsPopulatedKeysAndValues[`parameters.${exportedFsKeyName}`] = '';
    }
    for (var serverIndex = 0; serverIndex < externalNfsServer.length; serverIndex += 1) {
      var serverKeyName = externalNfsServer[serverIndex].key;
      nfsPopulatedKeysAndValues[`parameters.${serverKeyName}`] = '';
    }
  }
}

function getKeysFromSchemaByDefinition(schema, definitionReference) {
  var schemaKeys = [];
  if (_.has(schema.content, 'properties.parameters.properties')) {
    schemaKeys = Object.entries(schema.content.properties.parameters.properties).filter(function ([key, keyDefinition]) {
      if (keyDefinition.$ref === definitionReference) {
        return true;
      }
      return false;
    });
    return schemaKeys.map(function ([key, keyDefinition]) {
      return {
        key
      };
    });
  }
}
