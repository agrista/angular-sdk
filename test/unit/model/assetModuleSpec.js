describe('ag.sdk.model.asset', function () {
    var Mocks, Model, Asset, Liability;
    beforeEach(module('ag.sdk.model.base'));
    beforeEach(module('ag.test.model.mocks'));
    beforeEach(module('ag.sdk.model.asset'));
    beforeEach(inject(['Asset', 'Liability', 'Model', 'mocks', function(_Asset_, _Liability_, _Model_, _mocks_) {
        Model = _Model_;
        Mocks = _mocks_;
        Asset = _Asset_;
        Liability = _Liability_;
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

        it('validates with liability', function () {
            asset.data.financing.leased = true;

            expect(asset.validate()).toBe(false);

            asset.data.financing.leased = true;
            asset.data.financing.installment = 1000;
            asset.data.financing.legalEntityId = 0;
            asset.data.financing.paymentFrequency = 'Monthly';
            asset.data.financing.paymentStart = '2015-10-10T10:20:00';
            asset.data.financing.paymentEnd = '2016-10-10T10:20:00';
            asset.data.financing.rentalOwner = 'John Vickers';

            expect(asset.validate()).toBe(true);

            expect(asset.liability.liabilityInMonth('2015-09-10T10:20:00')).toEqual(0);
            expect(asset.liability.liabilityInMonth('2015-10-10T10:20:00')).toEqual(1000);
            expect(asset.liability.liabilityInMonth('2016-11-10T10:20:00')).toEqual(0);
        });
    });

    describe('Liability', function () {
        it('validates if undefined', function () {
            expect(Liability.new().validate()).toBe(true);
        });

        it('validates if no financing or leasing', function () {
            expect(Liability.new({}).validate()).toBe(true);
        });

        it('validates if financing or leasing and no data', function () {
            expect(Liability.new({
                leased: true
            }).validate()).toBe(false);

            expect(Liability.new({
                financed: true
            }).validate()).toBe(false);
        });

        it('computes property hasLiabilities', function () {
            expect(Liability.new().hasLiabilities).toBe(false);
        });
    });

    describe('Liability leasing', function () {
        var liability;

        beforeEach(function () {
            liability = Liability.new({
                leased: true,
                installment: 1000,
                legalEntityId: 1,
                paymentFrequency: 'Monthly',
                paymentStart: '2015-10-10T10:20:00',
                rentalOwner: 'John Vickers'
            });
        });

        it('validates if leasing', function () {
            expect(liability.validate()).toBe(true);
        });

        it('computes property hasLiabilities', function () {
            expect(liability.hasLiabilities).toBe(true);
        });

        it('validates installment', function () {
            liability.installment = '1000';
            expect(liability.validate()).toBe(false);

            liability.installment = 'one thousand';
            expect(liability.validate()).toBe(false);
        });

        it('validates legalEntityId', function () {
            liability.legalEntityId = '1';
            expect(liability.validate()).toBe(false);

            liability.legalEntityId = undefined;
            expect(liability.validate()).toBe(false);
        });

        it('validates paymentFrequency', function () {
            liability.paymentFrequency = 'Whenever';
            expect(liability.validate()).toBe(false);
        });

        it('validates paymentStart', function () {
            liability.paymentStart = '2015-10-10T99:99:99';
            expect(liability.validate()).toBe(false);

            liability.paymentStart = 'not a date';
            expect(liability.validate()).toBe(false);
        });

        it('validates paymentEnd', function () {
            liability.paymentEnd = '2015-10-10T99:99:99';
            expect(liability.validate()).toBe(false);

            liability.paymentEnd = 'not a date';
            expect(liability.validate()).toBe(false);
        });

        it('validates rentalOwner', function () {
            liability.rentalOwner = '';
            expect(liability.validate()).toBe(false);

            liability.rentalOwner = 'Lorem ipsum dolor sit amet, consectetur adiepiscing elit. Vivamus sit amet sollicitudin tellus. Nulla facilisi. Vestibulum erat urna, euismod at posuere ullamcorper, ultrices in lacus. Aenean molestie odio ac vestibulum molestie. Quisque id fringilla amet.';
            expect(liability.validate()).toBe(false);
        });
    })

    describe('Liability financing', function () {
        var liability;

        beforeEach(function () {
            liability = Liability.new({
                financed: true,
                installment: 10000,
                interestRate: 1,
                legalEntityId: 2,
                openingBalance: 100000,
                organizationName: 'John Vickers',
                paymentFrequency: 'Monthly',
                paymentStart: '2015-01-04T10:20:00'
            });
        });

        it('validates if financing', function () {
            expect(liability.validate()).toBe(true);
        });

        it('computes property hasLiabilities', function () {
            expect(liability.hasLiabilities).toBe(true);
        });

        it('validates installment', function () {
            liability.paymentFrequency = '1000';
            expect(liability.validate()).toBe(false);

            liability.paymentFrequency = 'one thousand';
            expect(liability.validate()).toBe(false);
        });

        it('validates interestRate', function () {
            liability.interestRate = 0;
            expect(liability.validate()).toBe(true);

            liability.interestRate = 100;
            expect(liability.validate()).toBe(true);

            liability.interestRate = -1;
            expect(liability.validate()).toBe(false);

            liability.interestRate = 101;
            expect(liability.validate()).toBe(false);

            liability.interestRate = '10';
            expect(liability.validate()).toBe(false);
        });

        it('validates openingBalance', function () {
            liability.openingBalance = '1000000';
            expect(liability.validate()).toBe(false);

            liability.openingBalance = 'one million';
            expect(liability.validate()).toBe(false);
        });

        it('validates organizationName', function () {
            liability.organizationName = '';
            expect(liability.validate()).toBe(false);

            liability.organizationName = 'Lorem ipsum dolor sit amet, consectetur adiepiscing elit. Vivamus sit amet sollicitudin tellus. Nulla facilisi. Vestibulum erat urna, euismod at posuere ullamcorper, ultrices in lacus. Aenean molestie odio ac vestibulum molestie. Quisque id fringilla amet.';
            expect(liability.validate()).toBe(false);
        });

        it('validates paymentFrequency', function () {
            liability.paymentFrequency = 'Whenever';
            expect(liability.validate()).toBe(false);
        });

        it('validates paymentStart', function () {
            liability.paymentStart = '2015-10-10T99:99:99';
            expect(liability.validate()).toBe(false);

            liability.paymentStart = 'not a date';
            expect(liability.validate()).toBe(false);
        });

        it('validates paymentEnd', function () {
            liability.paymentEnd = '2015-10-10T99:99:99';
            expect(liability.validate()).toBe(false);

            liability.paymentEnd = 'not a date';
            expect(liability.validate()).toBe(false);
        });

        it('computes property paymentMonths', function () {
            expect(liability.paymentMonths).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);

            liability.paymentFrequency = 'Bi-Monthly';
            expect(liability.paymentMonths).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);

            liability.paymentFrequency = 'Quarterly';
            expect(liability.paymentMonths).toEqual([0, 3, 6, 9]);

            liability.paymentFrequency = 'Bi-Yearly';
            expect(liability.paymentMonths).toEqual([0, 6]);

            liability.paymentFrequency = 'Yearly';
            expect(liability.paymentMonths).toEqual([0]);
        });

        it('computes property balanceInMonth', function () {
            expect(liability.balanceInMonth('2015-01-04T10:20:00')).toEqual(90083.33333333333);
        });

        it('computes property liabilityInMonth for Quarterly payments', function () {
            liability.paymentFrequency = 'Quarterly';
            expect(liability.liabilityInMonth('2015-01-04T10:20:00')).toEqual(10000);
            expect(liability.liabilityInMonth('2015-02-04T10:20:00')).toEqual(0);
            expect(liability.liabilityInMonth('2015-03-04T10:20:00')).toEqual(0);
            expect(liability.liabilityInMonth('2015-04-04T10:20:00')).toEqual(10000);
            expect(liability.liabilityInMonth('2015-05-04T10:20:00')).toEqual(0);
            expect(liability.liabilityInMonth('2015-06-04T10:20:00')).toEqual(0);
            expect(liability.liabilityInMonth('2015-07-04T10:20:00')).toEqual(10000);
            expect(liability.liabilityInMonth('2015-08-04T10:20:00')).toEqual(0);
            expect(liability.liabilityInMonth('2015-09-04T10:20:00')).toEqual(0);
            expect(liability.liabilityInMonth('2015-10-04T10:20:00')).toEqual(10000);
            expect(liability.liabilityInMonth('2015-11-04T10:20:00')).toEqual(0);
            expect(liability.liabilityInMonth('2015-12-04T10:20:00')).toEqual(0);
            expect(liability.liabilityInMonth('2016-01-04T10:20:00')).toEqual(10000);
            expect(liability.liabilityInMonth('2016-02-04T10:20:00')).toEqual(0);
            expect(liability.liabilityInMonth('2016-03-04T10:20:00')).toEqual(0);
            expect(liability.liabilityInMonth('2016-04-04T10:20:00')).toEqual(10000);
            expect(liability.liabilityInMonth('2016-05-04T10:20:00')).toEqual(0);
            expect(liability.liabilityInMonth('2016-06-04T10:20:00')).toEqual(0);
            expect(liability.liabilityInMonth('2016-07-04T10:20:00')).toEqual(10000);
            expect(liability.liabilityInMonth('2016-08-04T10:20:00')).toEqual(0);
            expect(liability.liabilityInMonth('2016-09-04T10:20:00')).toEqual(0);
            expect(liability.liabilityInMonth('2016-10-04T10:20:00')).toEqual(10000);
            expect(liability.liabilityInMonth('2016-11-04T10:20:00')).toEqual(0);
            expect(liability.liabilityInMonth('2016-12-04T10:20:00')).toEqual(0);
            expect(liability.liabilityInMonth('2017-01-04T10:20:00')).toEqual(10000);
            expect(liability.liabilityInMonth('2017-02-04T10:20:00')).toEqual(0);
            expect(liability.liabilityInMonth('2017-03-04T10:20:00')).toEqual(0);
            expect(liability.liabilityInMonth('2017-04-04T10:20:00')).toEqual(10000);
            expect(liability.liabilityInMonth('2017-05-04T10:20:00')).toEqual(0);
            expect(liability.liabilityInMonth('2017-06-04T10:20:00')).toEqual(0);
            expect(liability.liabilityInMonth('2017-07-04T10:20:00')).toEqual(1395.7804116356929);
            expect(liability.liabilityInMonth('2017-08-04T10:20:00')).toEqual(0);
            expect(liability.liabilityInMonth('2017-09-04T10:20:00')).toEqual(0);
            expect(liability.liabilityInMonth('2017-10-04T10:20:00')).toEqual(0);
        });

        it('computes property liabilityInMonth for Monthly payments', function () {
            expect(liability.liabilityInMonth('2015-01-04T10:20:00')).toEqual(10000);
            expect(liability.liabilityInMonth('2015-02-04T10:20:00')).toEqual(10000);
            expect(liability.liabilityInMonth('2015-03-04T10:20:00')).toEqual(10000);
            expect(liability.liabilityInMonth('2015-04-04T10:20:00')).toEqual(10000);
            expect(liability.liabilityInMonth('2015-05-04T10:20:00')).toEqual(10000);
            expect(liability.liabilityInMonth('2015-06-04T10:20:00')).toEqual(10000);
            expect(liability.liabilityInMonth('2015-07-04T10:20:00')).toEqual(10000);
            expect(liability.liabilityInMonth('2015-08-04T10:20:00')).toEqual(10000);
            expect(liability.liabilityInMonth('2015-09-04T10:20:00')).toEqual(10000);
            expect(liability.liabilityInMonth('2015-10-04T10:20:00')).toEqual(10000);
            expect(liability.liabilityInMonth('2015-11-04T10:20:00')).toEqual(460.6307380880098);
            expect(liability.liabilityInMonth('2015-12-04T10:20:00')).toEqual(0);
        });

        it('computes property liabilityInMonth Bi-Monthly payments', function () {
            liability.paymentFrequency = 'Bi-Monthly';
            expect(liability.liabilityInMonth('2014-12-04T10:20:00')).toEqual(0);
            expect(liability.liabilityInMonth('2015-01-04T10:20:00')).toEqual(20000);
            expect(liability.liabilityInMonth('2015-02-04T10:20:00')).toEqual(20000);
            expect(liability.liabilityInMonth('2015-03-04T10:20:00')).toEqual(20000);
            expect(liability.liabilityInMonth('2015-04-04T10:20:00')).toEqual(20000);
            expect(liability.liabilityInMonth('2015-05-04T10:20:00')).toEqual(20000);
            expect(liability.liabilityInMonth('2015-06-04T10:20:00')).toEqual(229.74030003645203);
            expect(liability.liabilityInMonth('2015-07-04T10:20:00')).toEqual(0);
        });

        it('computes property liabilityInRange Quarterly payments', function () {
            liability.paymentFrequency = 'Quarterly';

            expect(liability.liabilityInRange('2015-01-04T10:20:00', '2016-01-04T10:20:00')).toEqual([10000, 0, 0, 10000, 0, 0, 10000, 0, 0, 10000, 0, 0, 10000]);
        });

        it('computes property liabilityInRange Bi-Monthly payments', function () {
            liability.paymentFrequency = 'Bi-Monthly';

            expect(liability.liabilityInRange('2014-12-04T10:20:00', '2015-07-04T10:20:00')).toEqual([0, 20000, 20000, 20000, 20000, 20000, 229.74030003645203, 0]);
        });
    })
});
