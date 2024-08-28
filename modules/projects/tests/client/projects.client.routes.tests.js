(function () {
  'use strict';

  describe('Projects Route Tests', function () {
    var $scope,
      ProjectsService;

    beforeEach(module('myapp'));

    beforeEach(inject(function ($rootScope, _ProjectsService_) {
      $scope = $rootScope.$new();
      ProjectsService = _ProjectsService_;
    }));

    describe('Route Config', function () {
      describe('Main Route', function () {
        var mainState;
        beforeEach(inject(function ($state) {
          mainState = $state.get('projects');
        }));

        it('should have the correct URL', function () {
          expect(mainState.url).toEqual('/projects');
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
          listState = $state.get('projects.list');
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
          createState = $state.get('projects.create');
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
          viewState = $state.get('projects.view');
        }));

        it('should have the correct URL', function () {
          expect(viewState.url).toEqual('/view/{projectId}');
        });

        it('should not be abstract', function () {
          expect(viewState.abstract).toBe(undefined);
        });
      });

      describe('Edit Route', function () {
        var editState;
        beforeEach(inject(function ($state) {
          editState = $state.get('projects.edit');
        }));

        it('should have the correct URL', function () {
          expect(editState.url).toEqual('/edit/{projectId}');
        });

        it('should not be abstract', function () {
          expect(editState.abstract).toBe(undefined);
        });
      });
    });
  });
}());
