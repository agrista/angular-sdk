describe('ag.sdk.model.liability', function () {
    var Mocks, Model, Liability;
    beforeEach(module('ag.sdk.model.base'));
    beforeEach(module('ag.test.model.mocks'));
    beforeEach(module('ag.sdk.model.liability'));
    beforeEach(inject(['Liability', 'Model', 'mocks', function(_Liability_, _Model_, _mocks_) {
        Model = _Model_;
        Mocks = _mocks_;
        Liability = _Liability_;
    }]));

    describe('Liability is empty', function () {
        it('validates if undefined', function () {
            expect(Liability.new().validate()).toBe(false);
        });
    });

    describe('Liability', function () {
        var liability;

        beforeEach(function () {
            liability = Liability.new({
                uuid: '53486CEC-523F-4842-B7F6-4132A9622960',
                type: 'medium-loan',
                installmentPayment: 1000,
                amount: 1000000,
                interestRate: 1,
                legalEntityId: 1,
                frequency: 'monthly',
                startDate: '2015-10-10T10:20:00',
                merchantUuid: '63210902-D65B-4F1B-8A37-CF5139716729'
            });
        });

        it('validates', function () {
            expect(liability.validate('subtype')).toBe(true);
        });

        it('validates type', function () {
            liability.type = '';
            expect(liability.validate()).toBe(false);


            liability.type = 'loan';
            expect(liability.validate()).toBe(false);
        });

        it('validates installment', function () {
            liability.installmentPayment = '1000';
            expect(liability.validate()).toBe(false);

            liability.installmentPayment = 'one thousand';
            expect(liability.validate()).toBe(false);
        });

        it('validates legalEntityId', function () {
            liability.legalEntityId = '1';
            expect(liability.validate()).toBe(false);

            liability.legalEntityId = undefined;
            expect(liability.validate()).toBe(false);
        });

        it('validates frequency', function () {
            liability.frequency = 'Whenever';
            expect(liability.validate()).toBe(false);
        });

        it('validates startDate', function () {
            liability.startDate = '2015-10-10T99:99:99';
            expect(liability.validate()).toBe(false);

            liability.startDate = 'not a date';
            expect(liability.validate()).toBe(false);
        });

        it('validates endDate', function () {
            liability.endDate = '2015-10-10T99:99:99';
            expect(liability.validate()).toBe(false);

            liability.endDate = 'not a date';
            expect(liability.validate()).toBe(false);
        });

        it('validates merchantUuid', function () {
            liability.merchantUuid = '';
            expect(liability.validate()).toBe(false);

            liability.merchantUuid = '63210902-D65B-4F1B-8A37-CF5139>!6729';
            expect(liability.validate()).toBe(false);
        });
    });

    describe('Liability for production credit', function () {
        var liability;

        beforeEach(function () {
            liability = Liability.new({
                uuid: '53486CEC-523F-4842-B7F6-4132A9622960',
                type: 'production-credit',
                amount: 1000000,
                interestRate: 1,
                legalEntityId: 1,
                frequency: 'monthly',
                startDate: '2015-10-10T10:20:00',
                merchantUuid: '63210902-D65B-4F1B-8A37-CF5139716729',
                data: {
                    subtype: 'off-taker'
                }
            });
        });

        it('validates', function () {
            expect(liability.validate()).toBe(true);
        });

        it('validates subtype', function () {
            expect(liability.validate()).toBe(true);

            liability.data.subtype = 'not valid subtype';
            expect(liability.validate()).toBe(false);

            liability.type = 'medium-loan';
            liability.installmentPayment = 1000;
            expect(liability.validate()).toBe(true);

            liability.type = 'production-credit';
            expect(liability.validate()).toBe(false);

            liability.data.subtype = 'input-supplier';
            expect(liability.validate()).toBe(true);
        });
    });

    describe('Liability for production credit input financing', function () {
        var liability;

        beforeEach(function () {
            liability = Liability.new({
                uuid: '53486CEC-523F-4842-B7F6-4132A9622960',
                type: 'production-credit',
                interestRate: 1,
                legalEntityId: 1,
                frequency: 'monthly',
                startDate: '2015-10-10T10:20:00',
                merchantUuid: '63210902-D65B-4F1B-8A37-CF5139716729',
                data: {
                    subtype: 'input-financing'
                }
            });
        });

        it('validates', function () {
            expect(liability.validate()).toBe(false);

            liability.amount = 10000;
            expect(liability.validate()).toBe(true);

            liability.amount = -10000;
            expect(liability.validate()).toBe(false);

            liability.amount = '10000';
            expect(liability.validate()).toBe(false);

            liability.amount = null;
            liability.data.subtype = 'input-supplier';
            expect(liability.validate()).toBe(true);
        });
    });

    describe('Liability financing', function () {
        var liability;

        beforeEach(function () {
            liability = Liability.new({
                uuid: '53486CEC-523F-4842-B7F6-4132A9622960',
                type: 'short-loan',
                interestRate: 1,
                legalEntityId: 1,
                frequency: 'monthly',
                startDate: '2015-01-04T10:20:00',
                merchantUuid: '63210902-D65B-4F1B-8A37-CF5139716729',
                installmentPayment: 10000,
                amount: 100000
            });
        });

        it('validates if financing', function () {
            expect(liability.validate()).toBe(true);
        });

        it('validates installmentPayment', function () {
            liability.installmentPayment = '1000';
            expect(liability.validate()).toBe(false);

            liability.installmentPayment = 'one thousand';
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

        it('validates amount', function () {
            liability.amount = '1000000';
            expect(liability.validate()).toBe(false);

            liability.amount = 'one million';
            expect(liability.validate()).toBe(false);
        });

        it('validates frequency', function () {
            liability.frequency = 'Whenever';
            expect(liability.validate()).toBe(false);
        });

        it('validates startDate', function () {
            liability.startDate = '2015-10-10T99:99:99';
            expect(liability.validate()).toBe(false);

            liability.startDate = 'not a date';
            expect(liability.validate()).toBe(false);
        });

        it('validates endDate', function () {
            liability.endDate = '2015-10-10T99:99:99';
            expect(liability.validate()).toBe(false);

            liability.endDate = 'not a date';
            expect(liability.validate()).toBe(false);
        });

        it('computes property paymentMonths', function () {
            expect(liability.paymentMonths).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);

            liability.frequency = 'bi-monthly';
            expect(liability.paymentMonths).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);

            liability.frequency = 'quarterly';
            expect(liability.paymentMonths).toEqual([0, 3, 6, 9]);

            liability.frequency = 'bi-yearly';
            expect(liability.paymentMonths).toEqual([0, 6]);

            liability.frequency = 'yearly';
            expect(liability.paymentMonths).toEqual([0]);
        });

        it('computes property balanceInMonth', function () {
            expect(liability.balanceInMonth('2015-01-04T10:20:00')).toEqual(90083.33333333333);
        });

        it('computes property liabilityInMonth for Quarterly payments', function () {
            liability.frequency = 'quarterly';
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
            expect(liability.liabilityInMonth('2017-07-04T10:20:00')).toEqual(1229.3589274423996);
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
            expect(liability.liabilityInMonth('2015-11-04T10:20:00')).toEqual(461.01459703640194);
            expect(liability.liabilityInMonth('2015-12-04T10:20:00')).toEqual(0);
        });

        it('computes property liabilityInMonth Bi-Monthly payments', function () {
            liability.frequency = 'bi-monthly';
            expect(liability.liabilityInMonth('2014-12-04T10:20:00')).toEqual(0);
            expect(liability.liabilityInMonth('2015-01-04T10:20:00')).toEqual(20000);
            expect(liability.liabilityInMonth('2015-02-04T10:20:00')).toEqual(20000);
            expect(liability.liabilityInMonth('2015-03-04T10:20:00')).toEqual(20000);
            expect(liability.liabilityInMonth('2015-04-04T10:20:00')).toEqual(20000);
            expect(liability.liabilityInMonth('2015-05-04T10:20:00')).toEqual(20000);
            expect(liability.liabilityInMonth('2015-06-04T10:20:00')).toEqual(250.76487335092048);
            expect(liability.liabilityInMonth('2015-07-04T10:20:00')).toEqual(0);
        });

        it('computes property liabilityInRange Quarterly payments', function () {
            liability.frequency = 'quarterly';

            expect(liability.liabilityInRange('2015-01-04T10:20:00', '2016-01-04T10:20:00')).toEqual([10000, 0, 0, 10000, 0, 0, 10000, 0, 0, 10000, 0, 0]);
        });

        it('computes property liabilityInRange Bi-Monthly payments', function () {
            liability.frequency = 'bi-monthly';

            expect(liability.liabilityInRange('2014-12-04T10:20:00', '2015-07-04T10:20:00')).toEqual([0, 20000, 20000, 20000, 20000, 20000, 250.76487335092048]);
        });
    });


    describe('Liability financing with opening balance', function () {
        var liability;

        beforeEach(function () {
            liability = Liability.new({
                uuid: '53486CEC-523F-4842-B7F6-4132A9622960',
                type: 'short-loan',
                interestRate: 1,
                legalEntityId: 1,
                frequency: 'monthly',
                startDate: '2015-01-04T10:20:00',
                merchantUuid: '63210902-D65B-4F1B-8A37-CF5139716729',
                installmentPayment: 10000,
                amount: 100000,
                openingBalance: 50000
            });
        });

        it('validates if financing', function () {
            expect(liability.validate()).toBe(true);
        });

        it('computes property liabilityInMonth for Monthly payments', function () {
            expect(liability.liabilityInMonth('2015-01-04T10:20:00')).toEqual(10000);
            expect(liability.liabilityInMonth('2015-02-04T10:20:00')).toEqual(10000);
            expect(liability.liabilityInMonth('2015-03-04T10:20:00')).toEqual(10000);
            expect(liability.liabilityInMonth('2015-04-04T10:20:00')).toEqual(10000);
            expect(liability.liabilityInMonth('2015-05-04T10:20:00')).toEqual(10000);
            expect(liability.liabilityInMonth('2015-06-04T10:20:00')).toEqual(125.38243667546024);
            expect(liability.liabilityInMonth('2015-07-04T10:20:00')).toEqual(0);
            expect(liability.liabilityInMonth('2015-08-04T10:20:00')).toEqual(0);
            expect(liability.liabilityInMonth('2015-09-04T10:20:00')).toEqual(0);
            expect(liability.liabilityInMonth('2015-10-04T10:20:00')).toEqual(0);
            expect(liability.liabilityInMonth('2015-11-04T10:20:00')).toEqual(0);
            expect(liability.liabilityInMonth('2015-12-04T10:20:00')).toEqual(0);
        });
    });

    describe('Liability custom', function () {
        var liability;

        beforeEach(function () {
            liability = Liability.new({
                uuid: '53486CEC-523F-4842-B7F6-4132A9622960',
                type: 'production-credit',
                interestRate: 1,
                legalEntityId: 1,
                frequency: 'custom',
                startDate: '2015-01-04T10:20:00',
                merchantUuid: '63210902-D65B-4F1B-8A37-CF5139716729',
                amount: 50000,
                openingBalance: 1000,
                data: {
                    subtype: 'off-taker'
                }
            });
        });

        it('validates', function () {
            expect(liability.validate()).toBe(true);
        });

        it('computes opening months totals', function () {
            expect(liability.setWithdrawalInMonth(2000, '2015-01-04T10:20:00')).toBe(0);
            expect(liability.setWithdrawalInMonth(10000, '2015-02-04T10:20:00')).toBe(0);

            expect(liability.data.monthly.length).toBe(2);

            expect(liability.data.monthly[0]).toEqual({
                opening: 1000,
                withdrawal: 2000,
                repayment: 0,
                balance: 3000,
                interest: 2.5,
                closing: 3002.5
            });

            expect(liability.data.monthly[1]).toEqual({
                opening: 3002.5,
                withdrawal: 10000,
                repayment: 0,
                balance: 13002.5,
                interest: 10.835416666666667,
                closing: 13013.335416666667
            });

            expect(liability.setWithdrawalInMonth(50000, '2015-05-04T10:20:00')).toBe(13035.033346066266);

            expect(liability.data.monthly.length).toBe(5);

            expect(liability.data.monthly[2]).toEqual({
                opening: 13013.335416666667,
                withdrawal: 0,
                repayment: 0,
                balance: 13013.335416666667,
                interest: 10.844446180555556,
                closing: 13024.179862847222
            });

            expect(liability.data.monthly[3]).toEqual({
                opening: 13024.179862847222,
                withdrawal: 0,
                repayment: 0,
                balance: 13024.179862847222,
                interest: 10.853483219039353,
                closing: 13035.033346066262
            });

            expect(liability.data.monthly[4]).toEqual({
                opening: 13035.033346066262,
                withdrawal: 36964.966653933734,
                repayment: 0,
                balance: 50000,
                interest: 41.66666666666667,
                closing: 50041.666666666666664
            });

            expect(liability.setRepaymentInMonth(25000, '2015-07-04T10:20:00')).toBe(0);

            expect(liability.data.monthly.length).toBe(7);

            expect(liability.data.monthly[5]).toEqual({
                opening: 50041.666666666666664,
                withdrawal: 0,
                repayment: 0,
                balance: 50041.666666666666664,
                interest: 41.70138888888889,
                closing: 50083.368055555555
            });

            expect(liability.data.monthly[6]).toEqual({
                opening: 50083.368055555555,
                withdrawal: 0,
                repayment: 25000,
                balance: 25083.368055555555,
                interest: 20.902806712962963,
                closing: 25104.270862268517
            });

            expect(liability.setRepaymentInMonth(30000, '2015-08-04T10:20:00')).toBe(4895.729137731483);

            expect(liability.data.monthly.length).toBe(8);

            expect(liability.data.monthly[7]).toEqual({
                opening: 25104.270862268517,
                withdrawal: 0,
                repayment: 25104.270862268517,
                balance: 0,
                interest: 0,
                closing: 0
            });

            console.log(JSON.stringify(liability));
        });
    });});
