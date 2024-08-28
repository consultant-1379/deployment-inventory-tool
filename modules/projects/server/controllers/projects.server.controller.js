'use strict';

var _ = require('lodash');
var Address4 = require('ip-address').Address4;
var Address6 = require('ip-address').Address6;
var Netmask = require('netmask').Netmask;
var bigInt = require('big-integer');
var dns = require('dns-then');
var Pod = require('../../../pods/server/models/pods.server.model').Schema;
var errorHandler = require('../../../core/server/controllers/errors.server.controller');
var commonController = require('../../../core/server/controllers/common.server.controller');
var Deployment = require('../../../deployments/server/models/deployments.server.model').Schema;
var Project = require('../models/projects.server.model').Schema;
var Group = require('../../../groups/server/models/groups.server.model').Schema;
var Document = require('../../../documents/server/models/documents.server.model').Schema;
var enmAutopopulate = require('../../../documents/server/controllers/documents.autopopulate.server.controller');
var documentController = require('../../../documents/server/controllers/documents.server.controller');

// Promise to 'race' against when checking dns reverse
var timeout = (delay, message) => new Promise((_, reject) => setTimeout(reject, delay, message));
var delay = 3000;

var dependentModelsDetails = [{ modelObject: Deployment, modelKey: 'project_id' }];
var sortOrder = 'name';
commonController = commonController(Project, dependentModelsDetails, sortOrder);

exports.read = commonController.read;
exports.list = commonController.list;
exports.delete = commonController.delete;
exports.findById = commonController.findById;

exports.create = async function (req, res) {
  try {
    commonController.setLoggedInUser(req.user);
    var userGroups = req.body.usergroups;
    delete req.body.usergroups;
    await commonController.userGroupsValidation(userGroups);
    var project = new Project(req.body);
    await project.validate();
    await validateNetworkDetails(project);
    await project.save();
    await commonController.addModelInstanceToGroup(req.user, project._id, userGroups);
    res.location(`/api/projects/${project._id}`).status(201).json(project);
  } catch (err) {
    var statusCode = (err.name === 'ValidationError' || err.name === 'StrictModeError') ? 400 : 422;
    return res.status(statusCode).send({
      message: errorHandler.getErrorMessage(err)
    });
  }
};

exports.update = async function (req, res) {
  var preUpdateProject = {};
  var projectName = req.project.name;
  try {
    commonController.setLoggedInUser(req.user);
    var userGroups = req.body.usergroups;
    delete req.body.usergroups;
    await commonController.userGroupsValidation(userGroups);
    commonController.findAdditionalKeys(Project, req.project._doc, req.body, res);
    var project = _.extend(req.project, req.body);
    projectName = project.name;
    await project.validate();
    await validateExclusionIPs(project);
    await validateNetworkDetails(project);
    preUpdateProject = await Project.findOne({ _id: req.project._id }).exec();
    var modelInstanceReturned = await project.save();
    await documentController.resaveAutopopulatedDocuments(project);
    await commonController.updateModelInstanceInGroup(req.user, modelInstanceReturned._id, userGroups);
    return res.json(project);
  } catch (err) {
    await revertProject(preUpdateProject);
    var statusCode = (err.name === 'ValidationError' || err.name === 'StrictModeError') ? 400 : 422;
    return res.status(statusCode).send({
      message: `Error when updating Project ${projectName}: ${errorHandler.getErrorMessage(err)}`
    });
  }
};

async function revertProject(preUpdateProject) {
  try {
    delete preUpdateProject.__v;
    var projectToRevert = new Project(preUpdateProject);
    await projectToRevert.save();
  } catch (err) {
    // continue
  }
}

// Check for presence of ExclusionIPs in ENM SED during update of Project.
async function validateExclusionIPs(project) {
  var deployment = await Deployment.findOne({ project_id: project._id }).populate({ path: 'project_id', populate: { path: 'pod_id' } }).exec();
  if (deployment) {
    if (project.exclusion_ipv6_addresses.length || project.exclusion_ipv4_addresses.length) {
      var enmDocument = await Document.findOne({ _id: deployment.enm.sed_id }).exec();
      var exclusionIPv6Values = _.map(project.exclusion_ipv6_addresses, 'ipv6');
      var exclusionIPv4Values = _.map(project.exclusion_ipv4_addresses, 'ipv4');
      exclusionIPv6Values = exclusionIPv6Values.map(ip => new Address6(ip).canonicalForm());
      var exclusionIPsValues = _.union(exclusionIPv6Values, exclusionIPv4Values);
      var enmDocAddresses = enmAutopopulate.getDocumentAddresses(enmDocument);
      var commonIPs = _.intersection(exclusionIPsValues, enmDocAddresses);
      if (commonIPs.length) {
        throw new Error(`${commonIPs} cannot be added to exclusion IPs as they are already part of ENM SED`);
      }
    }
  }
}

function getBigIntFromIP(ipaddress, ipTypeLowercase) {
  var ipObject = getIPObject(ipaddress, ipTypeLowercase);
  return bigInt(ipObject.bigInteger().toString());
}

function getIPObject(ipaddress, ipTypeLowercase) {
  var ipObject = (ipTypeLowercase === 'ipv4') ? new Address4(ipaddress) : new Address6(ipaddress);
  if (!ipObject.isValid()) throw new Error(`The ip address given '${ipaddress}' is not a valid address`);
  return ipObject;
}

async function validateNetworkDetails(project) {
  var pod = await Pod.findOne({ _id: project.pod_id }).exec();
  if (!pod) {
    throw new Error(`The given pod id ${project.pod_id} could not be found`);
  }
  var podNetwork;
  for (var n = 0; n < pod.networks.length; n += 1) {
    if (pod.networks[n].name === project.network.name) {
      podNetwork = pod.networks[n];
      break;
    }
  }
  if (!podNetwork) throw new Error(`The network name given '${project.network.name}' was not found within the given pod`);
  var otherProjects = await Project.find({ _id: { $ne: project._id }, 'network.name': project.network.name, pod_id: project.pod_id }).exec();
  var allProjects = otherProjects.concat(project);
  var ipv6arr = _.filter(project.network.ipv6_ranges, function (ranges) {
    return ranges.start && ranges.end;
  });
  var ipTypes = ipv6arr.length ? ['IPv4', 'IPv6'] : ['IPv4'];
  for (var a = 0; a < ipTypes.length; a += 1) {
    var ipType = ipTypes[a];
    var ipTypeLowercase = ipType.toLowerCase();
    var podNetworkSubnet = podNetwork[`${ipTypeLowercase}_subnet`];
    if (!podNetworkSubnet.cidr) {
      throw new Error(`The network name given '${project.network.name}' has no ${ipType} Subnet within the given Pod, \
add one if require ${ipType} Range`);
    }
    var allProjectRangeDetails = [];
    var gatewayIPBigInt = getBigIntFromIP(podNetworkSubnet.gateway_ip, ipTypeLowercase);

    // Single project checks
    for (var i = 0; i < project.network[`${ipTypeLowercase}_ranges`].length; i += 1) {
      var projectIPRange = project.network[`${ipTypeLowercase}_ranges`][i];
      var rangeIPKeys = ['start', 'end'];
      for (var c = 0; c < rangeIPKeys.length; c += 1) {
        var rangeIPKey = rangeIPKeys[c];
        var subnetObject = getIPObject(podNetworkSubnet.cidr, ipTypeLowercase);
        var projectIPObject = getIPObject(projectIPRange[rangeIPKey], ipTypeLowercase);
        if (!projectIPObject.isInSubnet(subnetObject)) {
          throw new Error(`The ${ipType} range ${rangeIPKey} ip given ${projectIPRange[rangeIPKey]} \
is not valid within the pod network CIDR ${podNetworkSubnet.cidr}`);
        }
      }
      var startBigInt = getBigIntFromIP(projectIPRange.start, ipTypeLowercase);
      var endBigInt = getBigIntFromIP(projectIPRange.end, ipTypeLowercase);
      if (startBigInt.greater(endBigInt)) {
        throw new Error(`The ${ipType} range start ip ${projectIPRange.start} must come before \
the end ip ${projectIPRange.end}`);
      }

      // Make sure the gateway isn't within the range
      if (gatewayIPBigInt.geq(startBigInt) && gatewayIPBigInt.leq(endBigInt)) {
        throw new Error(`The ${ipType} range (${projectIPRange.start} - ${projectIPRange.end}) is invalid \
as it would make use of the gateway IP ${podNetworkSubnet.gateway_ip}`);
      }
    }

    // Build up of data to find overlapping ranges across all projects networks
    for (var p = 0; p < allProjects.length; p += 1) {
      var otherProject = allProjects[p];
      for (var l = 0; l < otherProject.network[`${ipTypeLowercase}_ranges`].length; l += 1) {
        var otherProjectIPRange = otherProject.network[`${ipTypeLowercase}_ranges`][l];
        if (otherProjectIPRange.start && otherProjectIPRange.end) {
          allProjectRangeDetails.push({
            start: otherProjectIPRange.start,
            startBigInt: getBigIntFromIP(otherProjectIPRange.start, ipTypeLowercase),
            end: otherProjectIPRange.end,
            endBigInt: getBigIntFromIP(otherProjectIPRange.end, ipTypeLowercase),
            projectName: otherProject.name
          });
        }
      }
    }
    // Find overlapping ranges across all projects networks
    for (var x = 0; x < allProjectRangeDetails.length; x += 1) {
      var projectRangeDetails1 = allProjectRangeDetails[x];
      for (var y = 0; y < allProjectRangeDetails.length; y += 1) {
        if (x !== y) {
          var projectRangeDetails2 = allProjectRangeDetails[y];
          if (
            projectRangeDetails1.startBigInt.geq(projectRangeDetails2.startBigInt) &&
            projectRangeDetails1.startBigInt.leq(projectRangeDetails2.endBigInt)
          ) {
            throw new Error(`Range (${projectRangeDetails1.start} - ${projectRangeDetails1.end}) from project '${projectRangeDetails1.projectName}' \
overlaps with another range (${projectRangeDetails2.start} - ${projectRangeDetails2.end}) from project '${projectRangeDetails2.projectName}'`);
          }
        }
      }
    }
  }
}

exports.getFreeIPs = async function (req, res) {
  var statusCode = 200;
  try {
    commonController.setLoggedInUser(req.user);
    var freeAddressesData = {},
      ipType = req.body.ip_type.toLowerCase(),
      podName = req.body.pod_name,
      networkName = req.body.network_name,
      projectName = req.body.name,
      numberOfAddresses = req.body.number_of_addresses || 1,
      newExcludedAddress = (req.body.excluded_addresses) ? _.uniq(req.body.excluded_addresses.split(',').map(ip => ip.trim())) : [],
      ipKey = `exclusion_${ipType}_addresses`,
      range = `${ipType}_ranges`,
      currentExcludedAddresses = [];

    if (numberOfAddresses && typeof numberOfAddresses !== 'number') throw new Error(`number_of_addresses must be a number, received: ${numberOfAddresses}`);

    var project = await Project.findOne({ name: projectName });

    if (project && project[ipKey]) {
      project[ipKey].forEach(ip => currentExcludedAddresses.push(ip[ipType]));
    }
    var allExcludedAddresses = _.union(newExcludedAddress, currentExcludedAddresses);
    freeAddressesData = await findFreeIPs(podName, ipType, networkName, numberOfAddresses, allExcludedAddresses);

    if (!project) { // Setup new project
      project = {
        name: projectName,
        pod_id: freeAddressesData.podId,
        username: 'dummy',
        password: 'dummy',
        id: '0',
        network: {
          name: networkName,
          ipv4_ranges: [],
          ipv6_ranges: []
        },
        exclusion_ipv4_addresses: [],
        exclusion_ipv6_addresses: []
      };
      project = new Project(project);
      statusCode = 201;
    }

    freeAddressesData.freeAddresses.forEach(function (address) {
      project.network[range] = project.network[range].concat({ start: address, end: address });
    });

    var remainingExcludedAddresses = allExcludedAddresses.filter(address => !currentExcludedAddresses.includes(address));
    remainingExcludedAddresses.forEach(function (address) {
      project[ipKey] = project[ipKey].concat({ [ipType]: address });
    });

    await project.validate();
    await validateNetworkDetails(project);
    await project.save();
    res.location(`/api/projects/${project._id}`).status(statusCode).json(project);
  } catch (err) {
    statusCode = (err.name === 'ValidationError' || err.name === 'StrictModeError') ? 400 : 422;
    return res.status(statusCode).send({
      message: errorHandler.getErrorMessage(err)
    });
  }
};

async function findFreeIPs(podName, ipType, networkName, numberOfAddresses, excludedAddresses) {
  try {
    var freeAddresses = [];
    var pod = await Pod.findOne({ name: podName }).exec();
    if (!pod) throw new Error(`The given pod name ${podName} could not be found`);
    var network = pod.networks.filter(network => network.name === networkName);
    if (!network.length) throw new Error(`The given network name ${networkName} could not be found`);
    var range = `${ipType}_ranges`;
    var subnet = `${ipType}_subnet`;
    var assignedAddresses = [];
    var projects = await Project.find({ pod_id: pod._id, 'network.name': networkName }).exec();
    if (projects.length) {
      projects.forEach(function (project) {
        project.network[range].forEach(function (address) {
          assignedAddresses.push(address.start);
        });
      });
    }
    // find free IP addresses
    var subnetData;
    var startIP;
    var endIP;
    if (ipType === 'ipv4') {
      assignedAddresses.push(network[0][subnet].gateway_ip);
      subnetData = new Netmask(network[0][subnet].cidr);
      startIP = subnetData.first;
      endIP = subnetData.broadcast;
    } else {
      if (!network[0][subnet].cidr) throw new Error(`No IPv6 subnet found for network ${networkName}`);
      var gateway = new Address6(network[0][subnet].gateway_ip).canonicalForm();
      assignedAddresses.push(gateway);
      subnetData = new Address6(network[0][subnet].cidr);
      startIP = gateway;
      endIP = subnetData.endAddress().address;
    }

    var IPGenerator = getIPObjectFromRange(startIP, endIP, ipType);
    while (freeAddresses.length !== numberOfAddresses) {
      var foundUnusedIP = false;
      while (!foundUnusedIP) {
        var ipObject = IPGenerator.next().value;
        if (!ipObject) {
          var freeLength = freeAddresses.length;
          throw new Error(`${(freeLength) ? 'Not enough' : 'No more'} free IP addresses within network ${networkName} subnet${(freeLength) ? `, only ${freeLength} found left.` : ''}`);
        }
        var ipCorrectForm = (ipObject.v4 ? ipObject.address : ipObject.canonicalForm());
        // Check if IP is not already assigned AND IP is not part of excluded IPs
        if (!assignedAddresses.includes(ipCorrectForm) && !excludedAddresses.includes(ipCorrectForm)) {
          // add IP to list only if url return is not *. or no url returned in 3seconds
          var ipIsValid;
          try {
            var hostnames = await Promise.race([dns.reverse(ipCorrectForm), timeout(delay, 'ENOTFOUND')]); // eslint-disable-line no-await-in-loop
            var firstHost = hostnames[0] || '*';
            ipIsValid = (!firstHost.startsWith('*'));
          } catch (dnsError) {
            ipIsValid = (dnsError.code === 'ENOTFOUND') || (dnsError.includes('ENOTFOUND'));
          }
          if (ipIsValid) {
            assignedAddresses.push(ipCorrectForm);
            freeAddresses.push(ipCorrectForm);
            foundUnusedIP = true;
          }
        }
      }
    }

    return { podId: pod._id, freeAddresses: freeAddresses };
  } catch (err) {
    throw new Error(`Error during finding a free ip address: ${err}`);
  }
}

function* getIPObjectFromRange(start, end, ipTypeLowercase) {
  var bigIntStart = getBigIntFromIP(start, ipTypeLowercase);
  var bigIntEnd = getBigIntFromIP(end, ipTypeLowercase);
  while (bigIntStart.leq(bigIntEnd)) {
    if (ipTypeLowercase === 'ipv4') {
      yield Address4.fromBigInteger(bigIntStart);
    } else {
      yield Address6.fromBigInteger(bigIntStart);
    }
    bigIntStart = bigIntStart.add('1');
  }
}
