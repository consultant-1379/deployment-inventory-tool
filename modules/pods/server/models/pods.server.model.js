'use strict';

var mongoose = require('mongoose');
var Address4 = require('ip-address').Address4;
var Address6 = require('ip-address').Address6;
var _ = require('lodash');
var uniqueValidator = require('mongoose-unique-validator');
var commonValidators = require('../../../core/server/controllers/validators.server.controller');

var MongooseSchema = mongoose.Schema;
var MongooseHistory = require('../../../history/server/plugins/history.server.plugin');

function getIPObject(cidr, ipTypeLowercase) {
  if (ipTypeLowercase === 'ipv4') {
    return new Address4(cidr);
  }
  return new Address6(cidr);
}

var NetworkSchema = new MongooseSchema({
  _id: false,
  name: {
    type: String,
    required: true,
    validate: commonValidators.objectNameValidator
  },
  vrrp_range: {
    start: {
      type: Number,
      required: true,
      min: 1,
      max: 255,
      validate: commonValidators.objectIntegerValidator
    },
    end: {
      type: Number,
      required: true,
      min: 1,
      max: 255,
      validate: commonValidators.objectIntegerValidator
    }
  },
  ipv4_subnet: {
    cidr: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\/([1-9]|[12][0-9]|3[0-2])$/.test(v);
        },
        message: 'ipv4_subnet.cidr must be a valid IPv4 CIDR. {VALUE} is not valid.'
      }
    },
    gateway_ip: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/.test(v);
        },
        message: 'ipv4_subnet.gateway_ip must be a valid IPv4 address. {VALUE} is not valid.'
      }
    }
  },
  ipv6_subnet: {
    cidr: {
      type: String,
      required: false,
      validate: {
        validator: function (v) {
          return /^(?:(?:(?:[0-9A-Fa-f]{1,4}:){7}(?:[0-9A-Fa-f]{1,4}|:))|(?:(?:[0-9A-Fa-f]{1,4}:){6}(?::[0-9A-Fa-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(?:(?:[0-9A-Fa-f]{1,4}:){5}(?:(?:(?::[0-9A-Fa-f]{1,4}){1,2})|:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(?:(?:[0-9A-Fa-f]{1,4}:){4}(?:(?:(?::[0-9A-Fa-f]{1,4}){1,3})|(?:(?::[0-9A-Fa-f]{1,4})?:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(?:(?:[0-9A-Fa-f]{1,4}:){3}(?:(?:(?::[0-9A-Fa-f]{1,4}){1,4})|(?:(?::[0-9A-Fa-f]{1,4}){0,2}:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(?:(?:[0-9A-Fa-f]{1,4}:){2}(?:(?:(?::[0-9A-Fa-f]{1,4}){1,5})|(?:(?::[0-9A-Fa-f]{1,4}){0,3}:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(?:(?:[0-9A-Fa-f]{1,4}:){1}(?:(?:(?::[0-9A-Fa-f]{1,4}){1,6})|(?:(?::[0-9A-Fa-f]{1,4}){0,4}:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(?::(?:(?:(?::[0-9A-Fa-f]{1,4}){1,7})|(?:(?::[0-9A-Fa-f]{1,4}){0,5}:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(?:%.+)?(\/([0-9]|[1-9][0-9]|1[0-1][0-9]|12[0-8]))$|^$/.test(v);
        },
        message: 'ipv6_subnet.cidr must be a valid IPv6 CIDR. {VALUE} is not valid.'
      }
    },
    gateway_ip: {
      type: String,
      required: false,
      validate: {
        validator: function (v) {
          return /^(?:(?:(?:[0-9A-Fa-f]{1,4}:){7}(?:[0-9A-Fa-f]{1,4}|:))|(?:(?:[0-9A-Fa-f]{1,4}:){6}(?::[0-9A-Fa-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(?:(?:[0-9A-Fa-f]{1,4}:){5}(?:(?:(?::[0-9A-Fa-f]{1,4}){1,2})|:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(?:(?:[0-9A-Fa-f]{1,4}:){4}(?:(?:(?::[0-9A-Fa-f]{1,4}){1,3})|(?:(?::[0-9A-Fa-f]{1,4})?:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(?:(?:[0-9A-Fa-f]{1,4}:){3}(?:(?:(?::[0-9A-Fa-f]{1,4}){1,4})|(?:(?::[0-9A-Fa-f]{1,4}){0,2}:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(?:(?:[0-9A-Fa-f]{1,4}:){2}(?:(?:(?::[0-9A-Fa-f]{1,4}){1,5})|(?:(?::[0-9A-Fa-f]{1,4}){0,3}:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(?:(?:[0-9A-Fa-f]{1,4}:){1}(?:(?:(?::[0-9A-Fa-f]{1,4}){1,6})|(?:(?::[0-9A-Fa-f]{1,4}){0,4}:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(?::(?:(?:(?::[0-9A-Fa-f]{1,4}){1,7})|(?:(?::[0-9A-Fa-f]{1,4}){0,5}:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(?:%.+)?$|^$/.test(v);
        },
        message: 'ipv6_subnet.gateway_ip must be a valid IPv6 address. {VALUE} is not valid.'
      }
    }
  }
}, { strict: 'throw' });

var Pod = new MongooseSchema({
  name: {
    type: 'string',
    trim: true,
    required: true,
    unique: true,
    minlength: 5,
    maxlength: 20,
    validate: commonValidators.objectNameValidator
  },
  authUrl: {
    type: 'string',
    required: true,
    unique: true,
    validate: {
      validator: function (v) {
        return /^(https?:\/\/)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\\.[a-z0-9](?:[-0-9a-z]{0,61}[0-9a-z])?)*)(.*)$/.test(v);
      },
      message: '{VALUE} is not correct. The authUrl must be a valid url.'
    }
  },
  networks: {
    type: [NetworkSchema],
    validate: {
      validator: function (v) {
        return v.length > 0;
      },
      message: 'You must provide at least one network'
    }
  }
}, { strict: 'throw' });

Pod.plugin(uniqueValidator, { message: 'Error, provided {PATH} is not unique.' });

Pod.pre('save', function (next) {
  var pod = this;
  // Make sure two networks of the same name dont exist
  var uniqueNetworkNames = [...new Set(pod.networks.map(network => network.name))];
  if (uniqueNetworkNames.length !== pod.networks.length) {
    return next(new Error('You cannot have duplicate network names'));
  }
  var ipTypes = ['IPv4', 'IPv6'];
  for (var t = 0; t < ipTypes.length; t += 1) {
    var ipType = ipTypes[t];
    var ipTypeLowercase = ipType.toLowerCase();
    for (var n = 0; n < pod.networks.length; n += 1) {
      if (ipTypeLowercase === 'ipv4' || (ipTypeLowercase === 'ipv6' && pod.networks[n].ipv6_subnet.cidr)) {
        var podNetworkSubnetObject = getIPObject(pod.networks[n][`${ipTypeLowercase}_subnet`].cidr, ipTypeLowercase);
        var gatewayIPObject = getIPObject(pod.networks[n][`${ipTypeLowercase}_subnet`].gateway_ip, ipTypeLowercase);
        if (!gatewayIPObject.isInSubnet(podNetworkSubnetObject)) {
          return next(new Error(`The ${ipType} subnet gateway ip given ${pod.networks[n][`${ipTypeLowercase}_subnet`].gateway_ip} is not \
valid within the given CIDR ${pod.networks[n][`${ipTypeLowercase}_subnet`].cidr}`));
        }
        if (pod.networks[n].vrrp_range.start >= pod.networks[n].vrrp_range.end) {
          return next(new Error('Vrrp_id range start cannot be after range end'));
        }
      }
    }
  }
  return next();
});

Pod.plugin(MongooseHistory);

module.exports.Schema = mongoose.model('Pod', Pod);
