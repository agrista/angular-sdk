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
                openingBalance: 1000000,
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

            liability.limit = 10000;
            expect(liability.validate()).toBe(true);

            liability.limit = -10000;
            expect(liability.validate()).toBe(false);

            liability.limit = '10000';
            expect(liability.validate()).toBe(false);

            liability.limit = null;
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
                openingBalance: 100000
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

        it('validates openingBalance', function () {
            liability.openingBalance = '1000000';
            expect(liability.validate()).toBe(false);

            liability.openingBalance = 'one million';
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
            expect(liability.balanceInMonth('2015-01-04T10:20:00')).toEqual(90075);
        });

        it('computes property liabilityInMonth for Quarterly payments', function () {
            liability.frequency = 'quarterly';
            expect(liability.liabilityInMonth('2015-01-04T10:20:00')).toEqual({ opening : 100000, repayment : 10000, withdrawal : 0, balance : 90000, interest : 75, closing : 90075 });
            expect(liability.liabilityInMonth('2015-02-04T10:20:00')).toEqual({ opening : 90075, repayment : 0, withdrawal : 0, balance : 90075, interest : 75.0625, closing : 90150.0625 });
            expect(liability.liabilityInMonth('2015-03-04T10:20:00')).toEqual({ opening : 90150.0625, repayment : 0, withdrawal : 0, balance : 90150.0625, interest : 75.125052083333, closing : 90225.18755208333 });
            expect(liability.liabilityInMonth('2015-04-04T10:20:00')).toEqual({ opening : 90225.18755208333, repayment : 10000, withdrawal : 0, balance : 80225.18755208333, interest : 66.854322960069, closing : 80292.04187504339 });
            expect(liability.liabilityInMonth('2015-05-04T10:20:00')).toEqual({ opening : 80292.04187504339, repayment : 0, withdrawal : 0, balance : 80292.04187504339, interest : 66.910034895869, closing : 80358.95190993926 });
            expect(liability.liabilityInMonth('2015-06-04T10:20:00')).toEqual({ opening : 80358.95190993926, repayment : 0, withdrawal : 0, balance : 80358.95190993926, interest : 66.965793258283, closing : 80425.91770319754 });
            expect(liability.liabilityInMonth('2015-07-04T10:20:00')).toEqual({ opening : 80425.91770319754, repayment : 10000, withdrawal : 0, balance : 70425.91770319754, interest : 58.688264752665, closing : 70484.6059679502 });
            expect(liability.liabilityInMonth('2015-08-04T10:20:00')).toEqual({ opening : 70484.6059679502, repayment : 0, withdrawal : 0, balance : 70484.6059679502, interest : 58.737171639958994, closing : 70543.34313959017 });
            expect(liability.liabilityInMonth('2015-09-04T10:20:00')).toEqual({ opening : 70543.34313959017, repayment : 0, withdrawal : 0, balance : 70543.34313959017, interest : 58.786119282992004, closing : 70602.12925887316 });
            expect(liability.liabilityInMonth('2015-10-04T10:20:00')).toEqual({ opening : 70602.12925887316, repayment : 10000, withdrawal : 0, balance : 60602.12925887316, interest : 50.501774382394, closing : 60652.63103325555 });
            expect(liability.liabilityInMonth('2015-11-04T10:20:00')).toEqual({ opening : 60652.63103325555, repayment : 0, withdrawal : 0, balance : 60652.63103325555, interest : 50.543859194380005, closing : 60703.17489244993 });
            expect(liability.liabilityInMonth('2015-12-04T10:20:00')).toEqual({ opening : 60703.17489244993, repayment : 0, withdrawal : 0, balance : 60703.17489244993, interest : 50.585979077042005, closing : 60753.760871526974 });
            expect(liability.liabilityInMonth('2016-01-04T10:20:00')).toEqual({ opening : 60753.760871526974, repayment : 10000, withdrawal : 0, balance : 50753.760871526974, interest : 42.294800726271994, closing : 50796.05567225325 });
            expect(liability.liabilityInMonth('2016-02-04T10:20:00')).toEqual({ opening : 50796.05567225325, repayment : 0, withdrawal : 0, balance : 50796.05567225325, interest : 42.330046393543995, closing : 50838.385718646794 });
            expect(liability.liabilityInMonth('2016-03-04T10:20:00')).toEqual({ opening : 50838.385718646794, repayment : 0, withdrawal : 0, balance : 50838.385718646794, interest : 42.365321432206, closing : 50880.751040079 });
            expect(liability.liabilityInMonth('2016-04-04T10:20:00')).toEqual({ opening : 50880.751040079, repayment : 10000, withdrawal : 0, balance : 40880.751040079, interest : 34.067292533399, closing : 40914.8183326124 });
            expect(liability.liabilityInMonth('2016-05-04T10:20:00')).toEqual({ opening : 40914.8183326124, repayment : 0, withdrawal : 0, balance : 40914.8183326124, interest : 34.095681943844, closing : 40948.91401455624 });
            expect(liability.liabilityInMonth('2016-06-04T10:20:00')).toEqual({ opening : 40948.91401455624, repayment : 0, withdrawal : 0, balance : 40948.91401455624, interest : 34.12409501213, closing : 40983.03810956837 });
            expect(liability.liabilityInMonth('2016-07-04T10:20:00')).toEqual({ opening : 40983.03810956837, repayment : 10000, withdrawal : 0, balance : 30983.03810956837, interest : 25.81919842464, closing : 31008.85730799301 });
            expect(liability.liabilityInMonth('2016-08-04T10:20:00')).toEqual({ opening : 31008.85730799301, repayment : 0, withdrawal : 0, balance : 31008.85730799301, interest : 25.840714423328, closing : 31034.698022416338 });
            expect(liability.liabilityInMonth('2016-09-04T10:20:00')).toEqual({ opening : 31034.698022416338, repayment : 0, withdrawal : 0, balance : 31034.698022416338, interest : 25.862248352014, closing : 31060.560270768354 });
            expect(liability.liabilityInMonth('2016-10-04T10:20:00')).toEqual({ opening : 31060.560270768354, repayment : 10000, withdrawal : 0, balance : 21060.560270768354, interest : 17.550466892307, closing : 21078.11073766066 });
            expect(liability.liabilityInMonth('2016-11-04T10:20:00')).toEqual({ opening : 21078.11073766066, repayment : 0, withdrawal : 0, balance : 21078.11073766066, interest : 17.565092281384, closing : 21095.675829942043 });
            expect(liability.liabilityInMonth('2016-12-04T10:20:00')).toEqual({ opening : 21095.675829942043, repayment : 0, withdrawal : 0, balance : 21095.675829942043, interest : 17.579729858285, closing : 21113.255559800327 });
            expect(liability.liabilityInMonth('2017-01-04T10:20:00')).toEqual({ opening : 21113.255559800327, repayment : 10000, withdrawal : 0, balance : 11113.255559800327, interest : 9.261046299834, closing : 11122.516606100162 });
            expect(liability.liabilityInMonth('2017-02-04T10:20:00')).toEqual({ opening : 11122.516606100162, repayment : 0, withdrawal : 0, balance : 11122.516606100162, interest : 9.268763838417, closing : 11131.78536993858 });
            expect(liability.liabilityInMonth('2017-03-04T10:20:00')).toEqual({ opening : 11131.78536993858, repayment : 0, withdrawal : 0, balance : 11131.78536993858, interest : 9.276487808281999, closing : 11141.061857746861 });
            expect(liability.liabilityInMonth('2017-04-04T10:20:00')).toEqual({ opening : 11141.061857746861, repayment : 10000, withdrawal : 0, balance : 1141.0618577468613, interest : 0.9508848814559999, closing : 1142.0127426283173 });
            expect(liability.liabilityInMonth('2017-05-04T10:20:00')).toEqual({ opening : 1142.0127426283173, repayment : 0, withdrawal : 0, balance : 1142.0127426283173, interest : 0.9516772855240001, closing : 1142.9644199138413 });
            expect(liability.liabilityInMonth('2017-06-04T10:20:00')).toEqual({ opening : 1142.9644199138413, repayment : 0, withdrawal : 0, balance : 1142.9644199138413, interest : 0.952470349928, closing : 1143.9168902637693 });
            expect(liability.liabilityInMonth('2017-07-04T10:20:00')).toEqual({ opening : 1143.9168902637693, repayment : 1143.9168902637693, withdrawal : 0, balance : 0, interest : 0, closing : 0 });
            expect(liability.liabilityInMonth('2017-08-04T10:20:00')).toEqual({ opening : 0, repayment : 0, withdrawal : 0, balance : 0, interest : 0, closing : 0 });
            expect(liability.liabilityInMonth('2017-09-04T10:20:00')).toEqual({ opening : 0, repayment : 0, withdrawal : 0, balance : 0, interest : 0, closing : 0 });
            expect(liability.liabilityInMonth('2017-10-04T10:20:00')).toEqual({ opening : 0, repayment : 0, withdrawal : 0, balance : 0, interest : 0, closing : 0 });
        });

        it('computes property liabilityInMonth for Monthly payments', function () {
            expect(liability.liabilityInMonth('2015-01-04T10:20:00')).toEqual({ opening : 100000, repayment : 10000, withdrawal : 0, balance : 90000, interest : 75, closing : 90075 });
            expect(liability.liabilityInMonth('2015-02-04T10:20:00')).toEqual({ opening : 90075, repayment : 10000, withdrawal : 0, balance : 80075, interest : 66.729166666667, closing : 80141.72916666667 });
            expect(liability.liabilityInMonth('2015-03-04T10:20:00')).toEqual({ opening : 80141.72916666667, repayment : 10000, withdrawal : 0, balance : 70141.72916666667, interest : 58.451440972222, closing : 70200.18060763889 });
            expect(liability.liabilityInMonth('2015-04-04T10:20:00')).toEqual({ opening : 70200.18060763889, repayment : 10000, withdrawal : 0, balance : 60200.18060763889, interest : 50.166817173031994, closing : 60250.347424811924 });
            expect(liability.liabilityInMonth('2015-05-04T10:20:00')).toEqual({ opening : 60250.347424811924, repayment : 10000, withdrawal : 0, balance : 50250.347424811924, interest : 41.875289520677, closing : 50292.2227143326 });
            expect(liability.liabilityInMonth('2015-06-04T10:20:00')).toEqual({ opening : 50292.2227143326, repayment : 10000, withdrawal : 0, balance : 40292.2227143326, interest : 33.576852261944, closing : 40325.79956659455 });
            expect(liability.liabilityInMonth('2015-07-04T10:20:00')).toEqual({ opening : 40325.79956659455, repayment : 10000, withdrawal : 0, balance : 30325.79956659455, interest : 25.271499638829, closing : 30351.071066233377 });
            expect(liability.liabilityInMonth('2015-08-04T10:20:00')).toEqual({ opening : 30351.071066233377, repayment : 10000, withdrawal : 0, balance : 20351.071066233377, interest : 16.959225888528, closing : 20368.030292121904 });
            expect(liability.liabilityInMonth('2015-09-04T10:20:00')).toEqual({ opening : 20368.030292121904, repayment : 10000, withdrawal : 0, balance : 10368.030292121904, interest : 8.640025243435, closing : 10376.670317365339 });
            expect(liability.liabilityInMonth('2015-10-04T10:20:00')).toEqual({ opening : 10376.670317365339, repayment : 10000, withdrawal : 0, balance : 376.67031736533863, interest : 0.313891931138, closing : 376.98420929647665 });
            expect(liability.liabilityInMonth('2015-11-04T10:20:00')).toEqual({ opening : 376.98420929647665, repayment : 376.98420929647665, withdrawal : 0, balance : 0, interest : 0, closing : 0 });
            expect(liability.liabilityInMonth('2015-12-04T10:20:00')).toEqual({ opening : 0, repayment : 0, withdrawal : 0, balance : 0, interest : 0, closing : 0 });
        });

        it('computes property liabilityInMonth Bi-Monthly payments', function () {
            liability.frequency = 'bi-monthly';
            expect(liability.liabilityInMonth('2014-12-04T10:20:00')).toEqual({ opening : 0, repayment : 0, withdrawal : 0, balance : 0, interest : 0, closing : 0 });
            expect(liability.liabilityInMonth('2015-01-04T10:20:00')).toEqual({ opening : 100000, repayment : 20000, withdrawal : 0, balance : 80000, interest : 66.666666666667, closing : 80066.66666666667 });
            expect(liability.liabilityInMonth('2015-02-04T10:20:00')).toEqual({ opening : 80066.66666666667, repayment : 20000, withdrawal : 0, balance : 60066.66666666667, interest : 50.055555555556005, closing : 60116.722222222226 });
            expect(liability.liabilityInMonth('2015-03-04T10:20:00')).toEqual({ opening : 60116.722222222226, repayment : 20000, withdrawal : 0, balance : 40116.722222222226, interest : 33.430601851852, closing : 40150.15282407408 });
            expect(liability.liabilityInMonth('2015-04-04T10:20:00')).toEqual({ opening : 40150.15282407408, repayment : 20000, withdrawal : 0, balance : 20150.15282407408, interest : 16.791794020062, closing : 20166.94461809414 });
            expect(liability.liabilityInMonth('2015-05-04T10:20:00')).toEqual({ opening : 20166.94461809414, repayment : 20000, withdrawal : 0, balance : 166.94461809414133, interest : 0.139120515078, closing : 167.08373860921932 });
            expect(liability.liabilityInMonth('2015-06-04T10:20:00')).toEqual({ opening : 167.08373860921932, repayment : 167.08373860921932, withdrawal : 0, balance : 0, interest : 0, closing : 0 });
            expect(liability.liabilityInMonth('2015-07-04T10:20:00')).toEqual({ opening : 0, repayment : 0, withdrawal : 0, balance : 0, interest : 0, closing : 0 });
        });

        it('computes property liabilityInRange Quarterly payments', function () {
            liability.frequency = 'quarterly';

            expect(liability.liabilityInRange('2014-12-04T10:20:00', '2016-01-04T10:20:00')).toEqual([
                { opening : 0, repayment : 0, withdrawal : 0, balance : 0, interest : 0, closing : 0 },
                { opening : 100000, repayment : 10000, withdrawal : 0, balance : 90000, interest : 75, closing : 90075 },
                { opening : 90075, repayment : 0, withdrawal : 0, balance : 90075, interest : 75.0625, closing : 90150.0625 },
                { opening : 90150.0625, repayment : 0, withdrawal : 0, balance : 90150.0625, interest : 75.125052083333, closing : 90225.18755208333 },
                { opening : 90225.18755208333, repayment : 10000, withdrawal : 0, balance : 80225.18755208333, interest : 66.854322960069, closing : 80292.04187504339 },
                { opening : 80292.04187504339, repayment : 0, withdrawal : 0, balance : 80292.04187504339, interest : 66.910034895869, closing : 80358.95190993926 },
                { opening : 80358.95190993926, repayment : 0, withdrawal : 0, balance : 80358.95190993926, interest : 66.965793258283, closing : 80425.91770319754 },
                { opening : 80425.91770319754, repayment : 10000, withdrawal : 0, balance : 70425.91770319754, interest : 58.688264752665, closing : 70484.6059679502 },
                { opening : 70484.6059679502, repayment : 0, withdrawal : 0, balance : 70484.6059679502, interest : 58.737171639958994, closing : 70543.34313959017 },
                { opening : 70543.34313959017, repayment : 0, withdrawal : 0, balance : 70543.34313959017, interest : 58.786119282992004, closing : 70602.12925887316 },
                { opening : 70602.12925887316, repayment : 10000, withdrawal : 0, balance : 60602.12925887316, interest : 50.501774382394, closing : 60652.63103325555 },
                { opening : 60652.63103325555, repayment : 0, withdrawal : 0, balance : 60652.63103325555, interest : 50.543859194380005, closing : 60703.17489244993 },
                { opening : 60703.17489244993, repayment : 0, withdrawal : 0, balance : 60703.17489244993, interest : 50.585979077042005, closing : 60753.760871526974 }
            ]);
        });

        it('computes property liabilityInRange Bi-Monthly payments', function () {
            liability.frequency = 'bi-monthly';

            expect(liability.liabilityInRange('2014-12-04T10:20:00', '2015-07-04T10:20:00')).toEqual([
                { opening : 0, repayment : 0, withdrawal : 0, balance : 0, interest : 0, closing : 0 },
                { opening : 100000, repayment : 20000, withdrawal : 0, balance : 80000, interest : 66.666666666667, closing : 80066.66666666667 },
                { opening : 80066.66666666667, repayment : 20000, withdrawal : 0, balance : 60066.66666666667, interest : 50.055555555556005, closing : 60116.722222222226 },
                { opening : 60116.722222222226, repayment : 20000, withdrawal : 0, balance : 40116.722222222226, interest : 33.430601851852, closing : 40150.15282407408 },
                { opening : 40150.15282407408, repayment : 20000, withdrawal : 0, balance : 20150.15282407408, interest : 16.791794020062, closing : 20166.94461809414 },
                { opening : 20166.94461809414, repayment : 20000, withdrawal : 0, balance : 166.94461809414133, interest : 0.139120515078, closing : 167.08373860921932 },
                { opening : 167.08373860921932, repayment : 167.08373860921932, withdrawal : 0, balance : 0, interest : 0, closing : 0 }
            ]);
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
                openingBalance: 50000
            });
        });

        it('validates if financing', function () {
            expect(liability.validate()).toBe(true);
        });

        it('computes property liabilityInMonth for Monthly payments', function () {
            expect(liability.liabilityInMonth('2015-01-04T10:20:00')).toEqual({ opening : 50000, repayment : 10000, withdrawal : 0, balance : 40000, interest : 33.333333333333, closing : 40033.333333333336 });
            expect(liability.liabilityInMonth('2015-02-04T10:20:00')).toEqual({ opening : 40033.333333333336, repayment : 10000, withdrawal : 0, balance : 30033.333333333336, interest : 25.027777777778002, closing : 30058.361111111113 });
            expect(liability.liabilityInMonth('2015-03-04T10:20:00')).toEqual({ opening : 30058.361111111113, repayment : 10000, withdrawal : 0, balance : 20058.361111111113, interest : 16.715300925926, closing : 20075.07641203704 });
            expect(liability.liabilityInMonth('2015-04-04T10:20:00')).toEqual({ opening : 20075.07641203704, repayment : 10000, withdrawal : 0, balance : 10075.07641203704, interest : 8.395897010031, closing : 10083.47230904707 });
            expect(liability.liabilityInMonth('2015-05-04T10:20:00')).toEqual({ opening : 10083.47230904707, repayment : 10000, withdrawal : 0, balance : 83.47230904707067, interest : 0.069560257539, closing : 83.54186930460966 });
            expect(liability.liabilityInMonth('2015-06-04T10:20:00')).toEqual({ opening : 83.54186930460966, repayment : 83.54186930460966, withdrawal : 0, balance : 0, interest : 0, closing : 0 });
            expect(liability.liabilityInMonth('2015-07-04T10:20:00')).toEqual({ opening : 0, repayment : 0, withdrawal : 0, balance : 0, interest : 0, closing : 0 });
            expect(liability.liabilityInMonth('2015-08-04T10:20:00')).toEqual({ opening : 0, repayment : 0, withdrawal : 0, balance : 0, interest : 0, closing : 0 });
            expect(liability.liabilityInMonth('2015-09-04T10:20:00')).toEqual({ opening : 0, repayment : 0, withdrawal : 0, balance : 0, interest : 0, closing : 0 });
            expect(liability.liabilityInMonth('2015-10-04T10:20:00')).toEqual({ opening : 0, repayment : 0, withdrawal : 0, balance : 0, interest : 0, closing : 0 });
            expect(liability.liabilityInMonth('2015-11-04T10:20:00')).toEqual({ opening : 0, repayment : 0, withdrawal : 0, balance : 0, interest : 0, closing : 0 });
            expect(liability.liabilityInMonth('2015-12-04T10:20:00')).toEqual({ opening : 0, repayment : 0, withdrawal : 0, balance : 0, interest : 0, closing : 0 });
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
                limit: 50000,
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

            expect(liability.data.monthly[0]).toEqual({ opening : 1000, repayment : 0, withdrawal : 2000, balance : 3000, interest : 2.5, closing : 3002.5 });
            expect(liability.data.monthly[1]).toEqual({ opening : 3002.5, repayment : 0, withdrawal : 10000, balance : 13002.5, interest : 10.835416666667, closing : 13013.335416666667 });

            expect(liability.setWithdrawalInMonth(50000, '2015-05-04T10:20:00')).toBe(13035.0333460663);

            expect(liability.data.monthly.length).toBe(5);

            expect(liability.data.monthly[2]).toEqual({ opening : 13013.335416666667, repayment : 0, withdrawal : 0, balance : 13013.335416666667, interest : 10.844446180555998, closing : 13024.179862847222 });
            expect(liability.data.monthly[3]).toEqual({ opening : 13024.179862847222, repayment : 0, withdrawal : 0, balance : 13024.179862847222, interest : 10.853483219039, closing : 13035.033346066262 });
            expect(liability.data.monthly[4]).toEqual({ opening : 13035.033346066262, repayment : 0, withdrawal : 36964.966653933734, balance : 50000, interest : 41.666666666667, closing : 50041.666666666664 });

            expect(liability.setRepaymentInMonth(25000, '2015-07-04T10:20:00')).toBe(0);

            expect(liability.data.monthly.length).toBe(7);

            expect(liability.data.monthly[5]).toEqual({ opening : 50041.666666666664, repayment : 0, withdrawal : 0, balance : 50041.666666666664, interest : 41.701388888889, closing : 50083.368055555555 });
            expect(liability.data.monthly[6]).toEqual({ opening : 50083.368055555555, repayment : 25000, withdrawal : 0, balance : 25083.368055555555, interest : 20.902806712963002, closing : 25104.270862268517 });

            expect(liability.setRepaymentInMonth(30000, '2015-08-04T10:20:00')).toBe(4895.729137731483);

            expect(liability.data.monthly.length).toBe(8);

            expect(liability.data.monthly[7]).toEqual({ opening : 25104.270862268517, repayment : 25104.270862268517, withdrawal : 0, balance : 0, interest : 0, closing : 0 });

            //console.log(JSON.stringify(liability));
        });

        it('adds repayments to a month', function () {
            expect(liability.setRepaymentInMonth(500, '2015-02-04T10:20:00')).toBe(0);

            expect(liability.data.monthly.length).toBe(2);

            expect(liability.data.monthly[0]).toEqual({ opening : 1000, repayment : 0, withdrawal : 0, balance : 1000, interest : 0.8333333333330001, closing : 1000.833333333333 });

            expect(liability.data.monthly[1]).toEqual({ opening : 1000.833333333333, repayment : 500, withdrawal : 0, balance : 500.83333333333303, interest : 0.417361111111, closing : 501.25069444444404 });

            expect(liability.addRepaymentInMonth(250, '2015-02-04T10:20:00')).toBe(0);

            expect(liability.data.monthly.length).toBe(2);

            expect(liability.data.monthly[1]).toEqual({ opening : 1000.833333333333, repayment : 750, withdrawal : 0, balance : 250.83333333333303, interest : 0.209027777778, closing : 251.04236111111103 });

            expect(liability.addRepaymentInMonth(500, '2015-02-04T10:20:00')).toBe(249.16666666666697);

            expect(liability.data.monthly.length).toBe(2);

            expect(liability.data.monthly[1]).toEqual({ opening : 1000.833333333333, repayment : 1000.833333333333, withdrawal : 0, balance : 0, interest : 0, closing : 0 });

            expect(liability.addRepaymentInMonth(500, '2015-02-04T10:20:00')).toBe(500);

            expect(liability.data.monthly.length).toBe(2);

            expect(liability.data.monthly[1]).toEqual({ opening : 1000.833333333333, repayment : 1000.833333333333, withdrawal : 0, balance : 0, interest : 0, closing : 0 });
        });

        it('adds withdrawals to a month', function () {
            expect(liability.setWithdrawalInMonth(500, '2015-01-04T10:20:00')).toBe(0);

            expect(liability.data.monthly.length).toBe(1);

            expect(liability.data.monthly[0]).toEqual({ opening : 1000, repayment : 0, withdrawal : 500, balance : 1500, interest : 1.25, closing : 1501.25 });

            expect(liability.addWithdrawalInMonth(25000, '2015-01-04T10:20:00')).toBe(0);

            expect(liability.data.monthly.length).toBe(1);

            expect(liability.data.monthly[0]).toEqual({ opening : 1000, repayment : 0, withdrawal : 25500, balance : 26500, interest : 22.083333333332998, closing : 26522.083333333332 });

            expect(liability.addWithdrawalInMonth(25000, '2015-01-04T10:20:00')).toBe(1500);

            expect(liability.data.monthly.length).toBe(1);

            expect(liability.data.monthly[0]).toEqual({ opening : 1000, repayment : 0, withdrawal : 49000, balance : 50000, interest : 41.666666666667, closing : 50041.666666666664 });

            expect(liability.addWithdrawalInMonth(25000, '2015-01-04T10:20:00')).toBe(25000);

            expect(liability.data.monthly.length).toBe(1);

            expect(liability.data.monthly[0]).toEqual({ opening : 1000, repayment : 0, withdrawal : 49000, balance : 50000, interest : 41.666666666667, closing : 50041.666666666664 });
        });
    });});
