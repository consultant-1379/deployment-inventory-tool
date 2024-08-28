(function () {
  'use strict';

  describe('Documents Route Tests', function () {
    var $scope,
      DocumentsService;

    beforeEach(module('myapp'));

    beforeEach(inject(function ($rootScope, _DocumentsService_) {
      $scope = $rootScope.$new();
      DocumentsService = _DocumentsService_;
    }));

    describe('Route Config', function () {
      describe('Main Route', function () {
        var mainState;
        beforeEach(inject(function ($state) {
          mainState = $state.get('documents');
        }));

        it('should have the correct URL', function () {
          expect(mainState.url).toEqual('/documents');
        });

        it('should be abstract', function () {
          expect(mainState.abstract).toBe(true);
        });

        it('should have template', function () {
          expect(mainState.template).toBe('<ui-view/>');
        });
      });

      describe('List Route', function () {
        var listENMstate,
          listVNFLCMstate,
          listMCstate,
          listOtherstate;
        beforeEach(inject(function ($state) {
          listENMstate = $state.get('documents.listSeds');
          listVNFLCMstate = $state.get('documents.listVnfLcmSeds');
          listMCstate = $state.get('documents.listManagedConfigs');
          listOtherstate = $state.get('documents.listOther');
        }));

        it('should have the correct URL enm sed documents', function () {
          expect(listENMstate.url).toEqual('/list/enm_sed');
        });

        it('should not be abstract enm sed documents', function () {
          expect(listENMstate.abstract).toBe(undefined);
        });

        it('should have the correct URL vnflcum sed documents', function () {
          expect(listVNFLCMstate.url).toEqual('/list/vnflcm_sed');
        });

        it('should not be abstract vnflcum sed documents', function () {
          expect(listVNFLCMstate.abstract).toBe(undefined);
        });

        it('should have the correct URL managed configs', function () {
          expect(listMCstate.url).toEqual('/list/managedconfigs');
        });

        it('should not be abstract managed configs', function () {
          expect(listMCstate.abstract).toBe(undefined);
        });

        it('should have the correct URL other documents', function () {
          expect(listOtherstate.url).toEqual('/list/other');
        });

        it('should not be abstract other documents', function () {
          expect(listOtherstate.abstract).toBe(undefined);
        });
      });

      describe('Create Route', function () {
        var createENMstate,
          createVNFLCMstate,
          createMCstate,
          createOtherstate;
        beforeEach(inject(function ($state) {
          createENMstate = $state.get('documents.createEnmSed');
          createVNFLCMstate = $state.get('documents.createVnfLcmSed');
          createMCstate = $state.get('documents.createManagedConfig');
          createOtherstate = $state.get('documents.createOther');
        }));

        it('should have the correct URL enm sed documents', function () {
          expect(createENMstate.url).toEqual('/create/enm_sed?documentName?schemaName?managedConfigName?useexternalnfs?ipv6?dns?vio?vioTransportOnly?vioMultiTech?overcommit?autopopulate');
        });

        it('should not be abstract enm sed documents', function () {
          expect(createENMstate.abstract).toBe(undefined);
        });

        it('should have the correct URL vnflcum sed documents', function () {
          expect(createVNFLCMstate.url).toEqual('/create/vnf_lcm_sed?documentName?schemaName?managedConfigName?useexternalnfs?ipv6?dns?vio?vioTransportOnly?vioMultiTech?overcommit?autopopulate');
        });

        it('should not be abstract enm vnflcum sed documents', function () {
          expect(createVNFLCMstate.abstract).toBe(undefined);
        });

        it('should have the correct URL managed configs', function () {
          expect(createMCstate.url).toEqual('/create/managed_config');
        });

        it('should not be abstract managed configs', function () {
          expect(createMCstate.abstract).toBe(undefined);
        });

        it('should have the correct URL other documents', function () {
          expect(createOtherstate.url).toEqual('/create/other');
        });

        it('should not be abstract other documents', function () {
          expect(createOtherstate.abstract).toBe(undefined);
        });
      });

      describe('View Route', function () {
        var viewState;
        beforeEach(inject(function ($state) {
          viewState = $state.get('documents.view');
        }));

        it('should have the correct URL', function () {
          expect(viewState.url).toEqual('/view/{documentId}');
        });

        it('should not be abstract', function () {
          expect(viewState.abstract).toBe(undefined);
        });
      });

      describe('Edit Route', function () {
        var editENMstate,
          editVNFLCMstate,
          editMCstate,
          editOtherstate;
        beforeEach(inject(function ($state) {
          editENMstate = $state.get('documents.editEnmSed');
          editVNFLCMstate = $state.get('documents.editVnfLcmSed');
          editMCstate = $state.get('documents.editManagedConfig');
          editOtherstate = $state.get('documents.editOther');
        }));

        it('should have the correct URL enm sed documents', function () {
          expect(editENMstate.url).toEqual('/edit/enm_sed/{documentId}?documentName?schemaName?managedConfigName?useexternalnfs?ipv6?dns?vio?vioTransportOnly?vioMultiTech?overcommit?autopopulate');
        });

        it('should not be abstract enm sed documents', function () {
          expect(editENMstate.abstract).toBe(undefined);
        });

        it('should have the correct URL vnflcum sed documents', function () {
          expect(editVNFLCMstate.url).toEqual('/edit/vnf_lcm_sed/{documentId}?documentName?schemaName?managedConfigName?useexternalnfs?ipv6?dns?vio?vioTransportOnly?vioMultiTech?overcommit?autopopulate');
        });

        it('should not be abstract enm vnflcum sed documents', function () {
          expect(editVNFLCMstate.abstract).toBe(undefined);
        });

        it('should have the correct URL managed configs', function () {
          expect(editMCstate.url).toEqual('/edit/managed_config/{documentId}?documentName?schemaName?managedConfigName?useexternalnfs?ipv6?dns?vio?vioTransportOnly?vioMultiTech?overcommit?autopopulate');
        });

        it('should not be abstract managed configs', function () {
          expect(editMCstate.abstract).toBe(undefined);
        });

        it('should have the correct URL other documents', function () {
          expect(editOtherstate.url).toEqual('/edit/other/{documentId}?documentName?schemaName?managedConfigName?useexternalnfs?ipv6?dns?vio?vioTransportOnly?vioMultiTech?overcommit?autopopulate');
        });

        it('should not be abstract other documents', function () {
          expect(editOtherstate.abstract).toBe(undefined);
        });
      });
    });
  });
}());
