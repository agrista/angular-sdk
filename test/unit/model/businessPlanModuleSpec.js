describe('ag.sdk.model.business-plan', function () {
    var Mocks, Model, BusinessPlan;
    beforeEach(module('ag.sdk.model.base'));
    beforeEach(module('ag.test.model.mocks'));
    beforeEach(module('ag.sdk.model.business-plan'));
    beforeEach(inject(['BusinessPlan', 'Model', 'mocks', function(_BusinessPlan_, _Model_, _mocks_) {
        Model = _Model_;
        Mocks = _mocks_;
        BusinessPlan = _BusinessPlan_;
    }]));

    describe('initialization', function () {
        var businessPlan;

        beforeEach(function () {
            businessPlan = BusinessPlan.new({
                author: 'Agrista',
                title: 'Business Time',
                organizationId: 1,
                data: {}
            });
        });

        it('adds docTypes to the class', function () {
            expect(BusinessPlan.docTypes).toBeDefined(true);
        });

        it('validates the author length', function () {
            expect(businessPlan.validate()).toBe(true);

            businessPlan.author = '';
            expect(businessPlan.validate()).toBe(false);

            businessPlan.author = 'Lorem ipsum dolor sit amet, consectetur adiepiscing elit. Vivamus sit amet sollicitudin tellus. Nulla facilisi. Vestibulum erat urna, euismod at posuere ullamcorper, ultrices in lacus. Aenean molestie odio ac vestibulum molestie. Quisque id fringilla amet.';
            expect(businessPlan.validate()).toBe(false);
        });

        it('validates the title length', function () {
            expect(businessPlan.validate()).toBe(true);

            businessPlan.title = '';
            expect(businessPlan.validate()).toBe(false);

            businessPlan.title = 'Lorem ipsum dolor sit amet, consectetur adiepiscing elit. Vivamus sit amet sollicitudin tellus. Nulla facilisi. Vestibulum erat urna, euismod at posuere ullamcorper, ultrices in lacus. Aenean molestie odio ac vestibulum molestie. Quisque id fringilla amet.';
            expect(businessPlan.validate()).toBe(false);
        });

        it('validates the docType is set automatically', function () {
            expect(businessPlan.validate()).toBe(true);
            businessPlan.docType = 'not a docType';
            expect(businessPlan.validate()).toBe(false);
        });

        it('validates the organizationId', function () {
            expect(businessPlan.validate()).toBe(true);

            businessPlan.organizationId = 'Not a number';
            expect(businessPlan.validate()).toBe(false);

            businessPlan.organizationId = undefined;
            expect(businessPlan.validate()).toBe(false);
        });

        it('adds productionPlan on the instance', function () {
            expect(businessPlan.productionPlan).toBeUndefined();

            var productionPlan = {
                docType: 'production plan'
            };

            businessPlan.productionPlan = productionPlan;

            expect(businessPlan.productionPlan).toEqual(productionPlan);
        });

        it('validates startDate as a date', function () {
            //expect(businessPlan.validate()).toBe(true);

            businessPlan.startDate = '2015-10-10T10:20:00';
            expect(businessPlan.validate()).toBe(true);

            businessPlan.startDate = 'this is not a date';
            expect(businessPlan.validate()).toBe(false);
        });

        it('does not add plannedAssets on the instance', function () {
            expect(businessPlan.plannedAssets).toBeUndefined();
        });

        it('does not add an invalid asset', function () {
            expect(businessPlan.plannedAssets).toBeUndefined();

            businessPlan.addAsset({});
            expect(businessPlan.plannedAssets.length).toBe(0);
        });

        it('adds a valid asset', function () {
            businessPlan.addAsset({
                organizationId: 1,
                type: 'crop'
            });
            expect(businessPlan.plannedAssets.length).toBe(1);
        });

        it('adds plannedLiabilities on the instance', function () {
            expect(businessPlan.plannedLiabilities).toBeUndefined();

            businessPlan.addLiability({});
            expect(businessPlan.plannedLiabilities).toBeDefined();
        });
    });
});
