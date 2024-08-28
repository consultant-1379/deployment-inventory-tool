'use strict';

var _ = require('lodash');
var IP = require('ip.js');
var bigInt = require('big-integer');
var errorHandler = require('../../../core/server/controllers/errors.server.controller'),
  commonController = require('../../../../modules/core/server/controllers/common.server.controller'),
  helperHandler = require('../../../core/server/controllers/helpers.server.controller');
var Project = require('../../../projects/server/models/projects.server.model').Schema;
var dependentModelsDetails = [{ modelObject: Project, modelKey: 'pod_id' }];
var sortOrder = 'name';
var Pod = require('../models/pods.server.model.js').Schema;
commonController = commonController(Pod, dependentModelsDetails, sortOrder);

exports.create = commonController.create;
exports.read = commonController.read;
exports.list = commonController.list;
exports.update = commonController.update;
exports.delete = commonController.delete;
exports.findById = commonController.findById;

exports.getSubnetData = async function (req, res) {
  try {
    var podId = req.params.podId,
      networkName = req.params.networkName;
    var pod = await Pod.findById(podId).exec();
    var network = pod.networks.find(network => network.name === networkName);
    if (!network) throw new Error(`The given network name ${networkName} could not be found`);
    var projects = await Project.find({ pod_id: pod._id, 'network.name': networkName }).exec();
    var subnetTypes = ['ipv4_subnet', 'ipv6_subnet'];
    var subnetIPData = { ipv4_subnet: {}, ipv6_subnet: {} };
    await helperHandler.asyncForEach(subnetTypes, async function (subnet) {
      if (!network[subnet].cidr) return;
      var countAssignedAddresses = 0;
      subnetIPData[subnet].cidr = network[subnet].cidr;
      subnetIPData[subnet].gateway_ip = network[subnet].gateway_ip;
      // CIDR & gateway_ip need to be counted in the assigned as they can't be used as part of Project's IP Ranges
      countAssignedAddresses = 2;
      const subnetData = new IP.Prefix(network[subnet].cidr);
      var subnetSize = String(subnetData.countIps());
      subnetIPData[subnet].size = String(bigInt(subnetSize).value).replace('n', '');
      if (projects.length) {
        var range = (subnet === 'ipv4_subnet') ? 'ipv4_ranges' : 'ipv6_ranges';
        await helperHandler.asyncForEach(projects, async function (project) { // eslint-disable-line no-loop-func
          await helperHandler.asyncForEach(project.network[range], async function (address) {
            if (address.start && address.end) {
              const ipRange = new IP.Range(address.start, address.end);
              var numIPs = Number(String(ipRange.countIps()));
              countAssignedAddresses += numIPs;
            }
          });
        });
        var totalFree = bigInt(subnetSize).subtract(countAssignedAddresses).value;
        subnetIPData[subnet].assigned = String(countAssignedAddresses);
        subnetIPData[subnet].free = String(totalFree).replace('n', '');
      } else {
        // For when there are no Project(s) using the network's subnet
        subnetIPData[subnet].assigned = '0';
        subnetIPData[subnet].free = String(bigInt(subnetSize).value).replace('n', '');
      }
    });
    var subnetData = {
      _id: pod._id,
      name: pod.name,
      network: {
        name: network.name,
        ipv4_subnet: subnetIPData.ipv4_subnet,
        ipv6_subnet: (network.ipv6_subnet) ? subnetIPData.ipv6_subnet : {}
      }
    };
    res.status(200).json(subnetData);
  } catch (err) {
    var statusCode = (err.name === 'ValidationError' || err.name === 'StrictModeError') ? 400 : 422;
    return res.status(statusCode).send({
      message: errorHandler.getErrorMessage(err)
    });
  }
};
