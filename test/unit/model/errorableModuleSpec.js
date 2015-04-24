describe('ag.sdk.model.errors', function () {
    var Farmer, Model, Mocks;
    beforeEach(module('ag.sdk.model.base'));
    beforeEach(module('ag.test.model.mocks'));
    beforeEach(inject(['Model', 'mocks', function(_Model_, _mocks_) {
        Model = _Model_;
        Mocks = _mocks_;
        Farmer = Mocks.Farmer;
    }]));

    describe('Errorable', function () {
        var farmer;

        beforeEach(function () {
            farmer = Farmer.new({
                name: 'Farmer',
                email: 'farmer@joe.com',
                telephone: 3832939
            });
        });

        it('adds errors', function () {
            farmer.$errors.add('name', 'is too short');
            expect(farmer.$errors.name).toContain('is too short');
        });

        it('adds errors idempotently', function () {
            farmer.$errors.add('name', 'is too short');
            farmer.$errors.add('name', 'is too short');
            expect(farmer.$errors.name.length).toEqual(1);
        });
        
        it('clears errors', function() {
            farmer.$errors.add('name', 'is too short.');
            farmer.$errors.clear();
            expect(farmer.$errors.count).toEqual(0);
        });

        it('clears errors on individual fields', function() {
            farmer.$errors.add('name', 'is too short.');
            farmer.$errors.add('telephone', 'is invalid.');
            farmer.$errors.clear('name');
            expect(farmer.$errors.count).toEqual(1);
        });

        it('clears an array of field names', function() {
            farmer.$errors.add('name', 'is too short.');
            farmer.$errors.add('telephone', 'is invalid.');
            farmer.$errors.add('email', 'is incorrectly formatted');
            farmer.$errors.clear(['name', 'telephone']);
            expect(farmer.$errors.count).toEqual(1);
        });

        it('clears particular error messages', function() {
            farmer.$errors.add('name', 'is too short.');
            farmer.$errors.add('name', 'is too weird.');
            farmer.$errors.clear('name', 'is too weird.');
            expect(farmer.$errors.count).toEqual(1);
        });

        it('clears all error messages of a type when there are none', function() {
            farmer.$errors.add('name', 'is too short.');
            farmer.$errors.add('name', 'is too weird.');
            farmer.$errors.clear('name', 'is too weird.');
            farmer.$errors.clear('name', 'is too short.');
            expect(farmer.$errors.name).toBeUndefined();
        });
    });
});
