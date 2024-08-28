var $ = require('jquery');

HeaderController.$inject = ['$scope', 'Authentication', 'menuService', '$http'];
export default function HeaderController($scope, Authentication, menuService, $http) {
  var vm = this;
  vm.changeLogURL = 'https://arm1s11-eiffel004.eiffel.gic.ericsson.se:8443/nexus/content/sites/tor/deployment-inventory-tool/latest/changelog.html';
  if (env === 'development') { // eslint-disable-line no-undef
    document.title = 'DEV: Deployment Inventory Tool';
    vm.isDev = true;
  }
  vm.accountMenu = menuService.getMenu('account').items[0];
  vm.authentication = Authentication;
  vm.isCollapsed = false;
  vm.menu = menuService.getMenu('topbar');

  $http.get('/api/version')
    .then(function (response) {
      vm.version = response.data;
    });

  $scope.$on('$stateChangeSuccess', stateChangeSuccess);
  function stateChangeSuccess() {
    // Collapsing the menu after navigation
    vm.isCollapsed = false;
  }
  $scope.navbarActive = false;
  if (vm.authentication.user) {
    $scope.navbarActive = true;
  }

  $scope.showNavBar = function (status) {
    $scope.navbarActive = status;
  };

  vm.navbarToggle = function () {
    if ($('#navbar-toggle').is(':visible')) vm.isCollapsed = !vm.isCollapsed;
  };

  $(async () => {
    try {
      var toolNotifications = await $http.get('/api/toolnotifications'); // eslint-disable-line no-await-in-loop
      var notificationData = toolNotifications.data;
      if (notificationData) {
        var enabled = notificationData.enabled;
        $scope.hasNotification = enabled;
        if (enabled) {
          var notifications = notificationData.notification;
          var jiraLink = notificationData.jira;
          var scrollClass = ((notifications.length > 90 && !jiraLink) || (notifications.length > 60 && jiraLink)) ? 'scroll-left' : 'non-scroll';
          $('#div-scroll').attr('class', scrollClass);
          $('#text-span').html((jiraLink) ? `${notifications} <a target="_blank" class="btn btn-info small-btn-notification" href="${jiraLink}" role="button"> Info` : notifications);
          $(`#${scrollClass}`).show();
        }
      }
      $scope.$apply();
    } catch (err) { console.log(err); /* eslint-disable-line no-console */ }

    // Get information about upcoming upgrade and populate modal
    try {
      var upgradeToolResponse = await $http.get('/api/upgradeEmail'); // eslint-disable-line no-await-in-loop
      var latestUpgrade = upgradeToolResponse.data;
      if (latestUpgrade && !latestUpgrade.message) {
        // Populate footer and reduce 'content' container height
        $scope.footerActive = true;
        $('#footer-title,#upgrade-modal-title').each(function () { $(this).html(latestUpgrade.subject); });
        $('.content').css('bottom', '35px');
        var refactoredUpgradeEmail = latestUpgrade.refactoredUpgradeEmail;
        $('#upgrade-email-message-body').html(refactoredUpgradeEmail);
      }
      $scope.$apply();
    } catch (err) { console.log(err); /* eslint-disable-line no-console */ }
    // Find Upgrade Modal
    var upgradeModal = $('#upgrade-modal');

    $('#open-upgrade-modal').click(function () {
      upgradeModal.show();
      $scope.$apply();
    });

    $('#close-upgrade-modal').click(function () {
      upgradeModal.hide();
    });

    // When the user clicks anywhere outside of the modal, close it
    var docUpgradeModal = document.getElementById('upgrade-modal');
    window.onclick = function (event) {
      if (event.target === docUpgradeModal) upgradeModal.hide();
    };
  });
}
