describe('ag.sdk.model.asset', function () {
    var Mocks, Model, Asset;
    beforeEach(module('ag.sdk.model.base'));
    beforeEach(module('ag.test.model.mocks'));
    beforeEach(module('ag.sdk.model.asset'));
    beforeEach(inject(['Asset', 'Model', 'mocks', function(_Asset_, _Model_, _mocks_) {
        Model = _Model_;
        Mocks = _mocks_;
        Asset = _Asset_;
    }]));

    describe('Asset', function () {
        var asset;

        beforeEach(function () {
            asset = Asset.new({
                assetKey: 'asset key',
                legalEntityId: 1,
                type: 'crop'
            });
        });

        it('validates', function () {
            expect(asset.validate()).toBe(true);
        });
    });
});
