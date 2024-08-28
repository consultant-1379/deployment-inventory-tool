import _ from 'lodash';
var helperHandler = require('../../../core/server/controllers/helpers.server.controller');
PodsViewController.$inject = [
  '$http', 'Notification', 'pod', 'dependentProjects', 'allGroups'
];

export default function PodsViewController($http, Notification, pod, dependentProjects, allGroups) {
  var vm = this;
  vm.pod = pod;
  vm.dependentProjects = dependentProjects;
  getPodGroups(allGroups, pod._id);
  getSubnetData();

  async function getPodGroups(allGroups, podId) {
    var podGroups = await allGroups.filter(group => isPodPresentInGroup(group, podId));
    vm.groups = await podGroups.map(group => { return { id: group._id, name: group.name }; });
  }

  function isPodPresentInGroup(group, podId) {
    return group.associatedPods.indexOf(podId) !== -1;
  }

  async function getSubnetData() {
    try {
      await helperHandler.asyncForEach(vm.pod.networks, async function (network) {
        var networkName = network.name;
        await $http({ method: 'GET', url: `/api/pods/${pod._id}/subnet/${networkName}` }).then(successCallback, errorCallback);
        function successCallback(response) {
          _.merge(network, response.data.network);
        }
        function errorCallback(response) {
          Notification.error({
            message: JSON.stringify(response),
            title: `<i class="glyphicon glyphicon-remove"></i> Issue getting subnet data for network ${networkName}`
          });
        }
        return network;
      });
    } catch (err) {
      Notification.error({ message: err.data.message.replace(/\n/g, '<br/>'), title: '<i class="glyphicon glyphicon-remove"></i> Getting subnet data error!' });
    }
  }
}
