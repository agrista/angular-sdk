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
                $id: 1,
                $complete: true,
                $local: true,
                $saved: false,
                $uri: 'assets',
                assetKey: 'asset key',
                legalEntityId: 1,
                type: 'crop'
            });
        });

        it('validates', function () {
            expect(asset.validate()).toBe(true);
        });
    });

    describe('Asset with liabilities', function () {
        var asset;

        beforeEach(function () {
            asset = Asset.new({
                $id: 1,
                $complete: true,
                $local: true,
                $saved: false,
                $uri: 'assets',
                assetKey: 'asset key',
                legalEntityId: 1,
                type: 'crop',
                liabilities: [{
                    uuid: '53486CEC-523F-4842-B7F6-4132A9622960',
                    type: 'medium-term',
                    installmentPayment: 1000,
                    openingBalance: 1000000,
                    interestRate: 1,
                    frequency: 'monthly',
                    startDate: '2015-10-10T10:20:00',
                    merchantUuid: '63210902-D65B-4F1B-8A37-CF5139716729'
                }]
            });
        });

        it('validates', function () {
            expect(asset.validate()).toBe(true);
        });
    });
});
