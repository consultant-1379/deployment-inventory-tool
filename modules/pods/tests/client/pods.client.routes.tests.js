(function () {
  'use strict';

  describe('Pods Route Tests', function () {
    var $scope,
      PodsService;

    beforeEach(module('myapp'));

    beforeEach(inject(function ($rootScope, _PodsService_) {
      $scope = $rootScope.$new();
      PodsService = _PodsService_;
    }));

    describe('Route Config', function () {
      describe('Main Route', function () {
        var mainState;
        beforeEach(inject(function ($state) {
          mainState = $state.get('pods');
        }));

        it('should have the correct URL', function () {
          expect(mainState.url).toEqual('/pods');
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
          listState = $state.get('pods.list');
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
          createState = $state.get('pods.create');
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
          viewState = $state.get('pods.view');
        }));

        it('should have the correct URL', function () {
          expect(viewState.url).toEqual('/view/{podId}');
        });

        it('should not be abstract', function () {
          expect(viewState.abstract).toBe(undefined);
        });
      });

      describe('Edit Route', function () {
        var editState;
        beforeEach(inject(function ($state) {
          editState = $state.get('pods.edit');
        }));

        it('should have the correct URL', function () {
          expect(editState.url).toEqual('/edit/{podId}');
        });

        it('should not be abstract', function () {
          expect(editState.abstract).toBe(undefined);
        });
      });
    });
  });
}());
