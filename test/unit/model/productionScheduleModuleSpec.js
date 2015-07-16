describe('ag.sdk.model.production-schedule', function () {
    var Mocks, Model, ProductionSchedule;
    beforeEach(module('ag.sdk.model.base'));
    beforeEach(module('ag.test.model.mocks'));
    beforeEach(module('ag.sdk.model.production-schedule'));
    beforeEach(inject(['ProductionSchedule', 'Model', 'mocks', function(_ProductionSchedule_, _Model_, _mocks_) {
        Model = _Model_;
        Mocks = _mocks_;
        ProductionSchedule = _ProductionSchedule_;
    }]));

    describe('ProductionSchedule', function () {
        var productionSchedule;

        beforeEach(function () {
            productionSchedule = ProductionSchedule.new({
                assetId: 1,
                budgetUuid: 'B6EBD2F6-A328-4EBA-B59E-9DC27A5573C0',
                endDate: '2016-10-10T10:20:00',
                organizationId: 2,
                startDate: '2016-05-26T10:20:00'
            });
        });

        it('validates', function () {
            expect(productionSchedule.validate()).toBe(true);
        });

        it('validates the assetId', function () {
            expect(productionSchedule.validate()).toBe(true);

            productionSchedule.assetId = null;
            expect(productionSchedule.validate()).toBe(false);

            productionSchedule.assetId = '1';
            expect(productionSchedule.validate()).toBe(false);
        });

        it('validates the budget uuid', function () {
            expect(productionSchedule.validate()).toBe(true);

            productionSchedule.budgetUuid = '';
            expect(productionSchedule.validate()).toBe(false);

            productionSchedule.budgetUuid = 'not a valid uuid';
            expect(productionSchedule.validate()).toBe(false);
        });

        it('validates endDate as a date', function () {
            expect(productionSchedule.validate()).toBe(true);

            productionSchedule.endDate = 2378434823873;
            expect(productionSchedule.validate()).toBe(true);

            productionSchedule.endDate = null;
            expect(productionSchedule.validate()).toBe(false);

            productionSchedule.endDate = 'this is not a date';
            expect(productionSchedule.validate()).toBe(false);
        });

        it('validates the organizationId', function () {
            expect(productionSchedule.validate()).toBe(true);

            productionSchedule.organizationId = null;
            expect(productionSchedule.validate()).toBe(false);

            productionSchedule.organizationId = '1';
            expect(productionSchedule.validate()).toBe(false);
        });

        it('validates startDate as a date', function () {
            expect(productionSchedule.validate()).toBe(true);

            productionSchedule.startDate = 2378434823873;
            expect(productionSchedule.validate()).toBe(true);

            productionSchedule.startDate = null;
            expect(productionSchedule.validate()).toBe(false);

            productionSchedule.startDate = 'this is not a date';
            expect(productionSchedule.validate()).toBe(false);
        });
    });
});
