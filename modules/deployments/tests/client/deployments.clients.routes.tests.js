(function () {
  'use strict';

  describe('Deployments Route Tests', function () {
    var $scope,
      DeploymentsService;

    beforeEach(module('myapp'));

    beforeEach(inject(function ($rootScope, _DeploymentsService_) {
      $scope = $rootScope.$new();
      DeploymentsService = _DeploymentsService_;
    }));

    describe('Route Config', function () {
      describe('Main Route', function () {
        var mainState;
        beforeEach(inject(function ($state) {
          mainState = $state.get('deployments');
        }));

        it('should have the correct URL', function () {
          expect(mainState.url).toEqual('/deployments');
        });

        it('should be abstract', function () {
          expect(mainState.abstract).toBe(true);
        });

        it('should have template', function () {
          expect(mainState.template).toBe('<ui-view/>');
        });
      });

      describe('List Route', function () {
        var listState;
        beforeEach(inject(function ($state) {
          listState = $state.get('deployments.list');
        }));

        it('should have the correct URL', function () {
          expect(listState.url).toEqual('');
        });

        it('should not be abstract', function () {
          expect(listState.abstract).toBe(undefined);
        });
      });

      describe('Create Route', function () {
        var createState;
        beforeEach(inject(function ($state) {
          createState = $state.get('deployments.create');
        }));

        it('should have the correct URL', function () {
          expect(createState.url).toEqual('/create');
        });

        it('should not be abstract', function () {
          expect(createState.abstract).toBe(undefined);
        });
      });

      describe('View Route', function () {
        var viewState;
        beforeEach(inject(function ($state) {
          viewState = $state.get('deployments.view');
        }));

        it('should have the correct URL', function () {
          expect(viewState.url).toEqual('/view/{deploymentId}');
        });

        it('should not be abstract', function () {
          expect(viewState.abstract).toBe(undefined);
        });
      });

      describe('Edit Route', function () {
        var editState;
        beforeEach(inject(function ($state) {
          editState = $state.get('deployments.edit');
        }));

        it('should have the correct URL', function () {
          expect(editState.url).toEqual('/edit/{deploymentId}');
        });

        it('should not be abstract', function () {
          expect(editState.abstract).toBe(undefined);
        });
      });
    });
  });
}());
