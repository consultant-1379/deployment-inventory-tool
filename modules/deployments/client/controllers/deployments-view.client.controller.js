import semver from 'semver';
import _ from 'lodash';

DeploymentsViewController.$inject = ['$scope', '$http', '$state', 'deployment',
  'project', 'sed', 'vnflcmSed', 'vnflcmSchema', 'secondcENMSed', 'secondcENMSEDSchema', 'enmSchema', 'documents', 'allGroups', 'SchemasService', 'Notification'];

export default function DeploymentsViewController(
  $scope, $http, $state, deployment,
  project, sed, vnflcmSed, vnflcmSchema, secondcENMSed, secondcENMSEDSchema, enmSchema, documents, allGroups, SchemasService, Notification
) {
  var vm = this;
  vm.deployment = deployment;
  vm.project = project;
  vm.sed = sed;
  vm.iscENM = enmSchema.category === 'cenm';
  vm.secondCENMPresent = secondcENMSed;
  vm.dependentDocuments = documents.filter(isDocumentIdInArray(vm.deployment.documents.map(justDocumentId)));
  getDeploymentGroups(allGroups, deployment._id);
  isVnfLcmSedRequired();
  getVnfLcmSedDocument();
  getSecondCENMDocument();
  getJiraData();
  function justDocumentId(document) {
    return document.document_id;
  }

  function isDocumentIdInArray(deploymentDocuments) {
    return function (document) {
      return deploymentDocuments.includes(document._id);
    };
  }

  async function getDeploymentGroups(allGroups, deploymentId) {
    var deploymentGroups = await allGroups.filter(group => isDeploymentPresentInGroup(group, deploymentId));
    vm.groups = await deploymentGroups.map(group => { return { id: group._id, name: group.name }; });
  }

  function isDeploymentPresentInGroup(group, deploymentId) {
    return group.associatedDeployments.indexOf(deploymentId) !== -1;
  }

  async function getSecondCENMDocument() {
    vm.secondCENM = {};
    if (vm.secondCENMPresent) {
      vm.secondCENM._id = secondcENMSed._id;
      vm.secondCENM.name = secondcENMSed.name;
      vm.secondCENM.schema_id = secondcENMSed.schema_id;
      vm.secondCENM.schema_version = secondcENMSEDSchema.version;
    }
  }

  async function getVnfLcmSedDocument() {
    vm.vnflcmSed = {};
    if (vnflcmSed) {
      vm.vnflcmSed._id = vnflcmSed._id;
      vm.vnflcmSed.name = vnflcmSed.name;
      vm.vnflcmSed.content = vnflcmSed.content;
      vm.vnflcmSed.schema_id = vnflcmSed.schema_id;
      vm.vnflcmSed.schema_version = vnflcmSchema.version;
    }
  }

  function isVnfLcmSedRequired() {
    vm.sed.schema_id = enmSchema._id;
    vm.sed.schema_version = enmSchema.version;
    vm.vnfLcmSedRequired = !semver.lt(enmSchema.version, '1.39.14') && !vm.iscENM;
  }

  function getJiraData() {
    var jiraIssues = [];
    if (vm.deployment.jira_issues.length) {
      vm.deployment.jira_issues.forEach(function (jiraIssue) {
        var jiraData = {};
        jiraData.issue = jiraIssue;
        jiraData.summary = 'Not available';
        jiraData.status = 'Not available';
        jiraData.team = 'Not available';
        jiraData.viewUrl = '';
        $http({
          method: 'GET',
          url: `/api/jiraIssueValidation/${jiraIssue}`
        }).then(function successCallback(response) {
          if (response.data.valid === true) {
            jiraData.summary = response.data.summary;
            jiraData.status = response.data.status;
            jiraData.team = response.data.team;
            jiraData.viewUrl = response.data.viewUrl;
          } else if (response.data.valid === false) {
            var errorMessage = response.data.errorMessages.join(', ');
            jiraData.summary = `ERROR: ${errorMessage}`;
          }
        }, function errorCallback(response) {
          Notification.error({
            message: JSON.stringify(response),
            title: `<i class="glyphicon glyphicon-remove"></i> Issue getting JIRA Issue: ${jiraIssue} data`
          });
        });
        jiraIssues.push(jiraData);
      });
    }
    vm.jiraIssuesData = jiraIssues;
    _.defer(function () { $scope.$apply(); });
  }
}
