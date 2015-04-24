describe('ag.sdk.model.validators', function () {
    var Mocks, Model, Farm;
    beforeEach(module('ag.sdk.model.base'));
    beforeEach(module('ag.test.model.mocks'));
    beforeEach(inject(['Model', 'mocks', function(_Model_, _mocks_) {
        Model = _Model_;
        Mocks = _mocks_;
        Farm = Mocks.Farm;
    }]));

    describe('Validators', function () {
        var farm;

        beforeEach(function () {
            Farm.validates({
                name: {
                    required: true,
                    length: {
                        min: 5,
                        max: 20
                    }
                }
            });

            farm = Farm.new({
                name: 'Farm Name'
            });
        });

        it('adds validations', function () {
            expect(Farm.validations.name[0].field).toEqual('name');
        });

        it('adds errors when instances are invalid', function () {
            farm.name = 'A';
            farm.validate();

            expect(farm.$errors.name).toContain('Must be at least 5 characters');
        });

        it('describes whether an instance is valid in general', function () {
            farm.name = 'A';
            expect(farm.validate()).toBe(false);
            farm.name = 'Farm Name';
            expect(farm.validate()).toBe(true);
        });

        it('sets $valid as a property of the instance', function () {
            expect(farm.$valid).toBe(true);
        });

        it('sets $invalid as a property of the instance', function () {
            expect(farm.$invalid).toBe(false);
            farm.name = '';
            expect(farm.$invalid).toBe(true);
        });
    });
});
