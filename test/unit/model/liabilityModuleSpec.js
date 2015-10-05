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
            expect(liability.liabilityInMonth('2015-03-04T10:20:00')).toEqual({ opening : 90150.0625, repayment : 0, withdrawal : 0, balance : 90150.0625, interest : 75.12505208333333, closing : 90225.18755208333 });
            expect(liability.liabilityInMonth('2015-04-04T10:20:00')).toEqual({ opening : 90225.18755208333, repayment : 10000, withdrawal : 0, balance : 80225.18755208333, interest : 66.85432296006944, closing : 80292.0418750434 });
            expect(liability.liabilityInMonth('2015-05-04T10:20:00')).toEqual({ opening : 80292.0418750434, repayment : 0, withdrawal : 0, balance : 80292.0418750434, interest : 66.9100348958695, closing : 80358.95190993928 });
            expect(liability.liabilityInMonth('2015-06-04T10:20:00')).toEqual({ opening : 80358.95190993928, repayment : 0, withdrawal : 0, balance : 80358.95190993928, interest : 66.96579325828273, closing : 80425.91770319756 });
            expect(liability.liabilityInMonth('2015-07-04T10:20:00')).toEqual({ opening : 80425.91770319756, repayment : 10000, withdrawal : 0, balance : 70425.91770319756, interest : 58.68826475266463, closing : 70484.60596795022 });
            expect(liability.liabilityInMonth('2015-08-04T10:20:00')).toEqual({ opening : 70484.60596795022, repayment : 0, withdrawal : 0, balance : 70484.60596795022, interest : 58.73717163995852, closing : 70543.34313959019 });
            expect(liability.liabilityInMonth('2015-09-04T10:20:00')).toEqual({ opening : 70543.34313959019, repayment : 0, withdrawal : 0, balance : 70543.34313959019, interest : 58.78611928299182, closing : 70602.12925887317 });
            expect(liability.liabilityInMonth('2015-10-04T10:20:00')).toEqual({ opening : 70602.12925887317, repayment : 10000, withdrawal : 0, balance : 60602.129258873174, interest : 50.5017743823943, closing : 60652.631033255566 });
            expect(liability.liabilityInMonth('2015-11-04T10:20:00')).toEqual({ opening : 60652.631033255566, repayment : 0, withdrawal : 0, balance : 60652.631033255566, interest : 50.543859194379635, closing : 60703.17489244995 });
            expect(liability.liabilityInMonth('2015-12-04T10:20:00')).toEqual({ opening : 60703.17489244995, repayment : 0, withdrawal : 0, balance : 60703.17489244995, interest : 50.58597907704162, closing : 60753.76087152699 });
            expect(liability.liabilityInMonth('2016-01-04T10:20:00')).toEqual({ opening : 60753.76087152699, repayment : 10000, withdrawal : 0, balance : 50753.76087152699, interest : 42.294800726272484, closing : 50796.055672253264 });
            expect(liability.liabilityInMonth('2016-02-04T10:20:00')).toEqual({ opening : 50796.055672253264, repayment : 0, withdrawal : 0, balance : 50796.055672253264, interest : 42.33004639354438, closing : 50838.38571864681 });
            expect(liability.liabilityInMonth('2016-03-04T10:20:00')).toEqual({ opening : 50838.38571864681, repayment : 0, withdrawal : 0, balance : 50838.38571864681, interest : 42.365321432205675, closing : 50880.75104007901 });
            expect(liability.liabilityInMonth('2016-04-04T10:20:00')).toEqual({ opening : 50880.75104007901, repayment : 10000, withdrawal : 0, balance : 40880.75104007901, interest : 34.067292533399176, closing : 40914.81833261241 });
            expect(liability.liabilityInMonth('2016-05-04T10:20:00')).toEqual({ opening : 40914.81833261241, repayment : 0, withdrawal : 0, balance : 40914.81833261241, interest : 34.09568194384367, closing : 40948.914014556256 });
            expect(liability.liabilityInMonth('2016-06-04T10:20:00')).toEqual({ opening : 40948.914014556256, repayment : 0, withdrawal : 0, balance : 40948.914014556256, interest : 34.12409501213021, closing : 40983.038109568384 });
            expect(liability.liabilityInMonth('2016-07-04T10:20:00')).toEqual({ opening : 40983.038109568384, repayment : 10000, withdrawal : 0, balance : 30983.038109568384, interest : 25.819198424640316, closing : 31008.857307993025 });
            expect(liability.liabilityInMonth('2016-08-04T10:20:00')).toEqual({ opening : 31008.857307993025, repayment : 0, withdrawal : 0, balance : 31008.857307993025, interest : 25.84071442332752, closing : 31034.698022416353 });
            expect(liability.liabilityInMonth('2016-09-04T10:20:00')).toEqual({ opening : 31034.698022416353, repayment : 0, withdrawal : 0, balance : 31034.698022416353, interest : 25.862248352013626, closing : 31060.560270768365 });
            expect(liability.liabilityInMonth('2016-10-04T10:20:00')).toEqual({ opening : 31060.560270768365, repayment : 10000, withdrawal : 0, balance : 21060.560270768365, interest : 17.55046689230697, closing : 21078.11073766067 });
            expect(liability.liabilityInMonth('2016-11-04T10:20:00')).toEqual({ opening : 21078.11073766067, repayment : 0, withdrawal : 0, balance : 21078.11073766067, interest : 17.56509228138389, closing : 21095.675829942054 });
            expect(liability.liabilityInMonth('2016-12-04T10:20:00')).toEqual({ opening : 21095.675829942054, repayment : 0, withdrawal : 0, balance : 21095.675829942054, interest : 17.579729858285045, closing : 21113.25555980034 });
            expect(liability.liabilityInMonth('2017-01-04T10:20:00')).toEqual({ opening : 21113.25555980034, repayment : 10000, withdrawal : 0, balance : 11113.255559800338, interest : 9.261046299833616, closing : 11122.516606100171 });
            expect(liability.liabilityInMonth('2017-02-04T10:20:00')).toEqual({ opening : 11122.516606100171, repayment : 0, withdrawal : 0, balance : 11122.516606100171, interest : 9.26876383841681, closing : 11131.785369938587 });
            expect(liability.liabilityInMonth('2017-03-04T10:20:00')).toEqual({ opening : 11131.785369938587, repayment : 0, withdrawal : 0, balance : 11131.785369938587, interest : 9.276487808282155, closing : 11141.061857746869 });
            expect(liability.liabilityInMonth('2017-04-04T10:20:00')).toEqual({ opening : 11141.061857746869, repayment : 10000, withdrawal : 0, balance : 1141.0618577468686, interest : 0.9508848814557237, closing : 1142.0127426283243 });
            expect(liability.liabilityInMonth('2017-05-04T10:20:00')).toEqual({ opening : 1142.0127426283243, repayment : 0, withdrawal : 0, balance : 1142.0127426283243, interest : 0.9516772855236035, closing : 1142.964419913848 });
            expect(liability.liabilityInMonth('2017-06-04T10:20:00')).toEqual({ opening : 1142.964419913848, repayment : 0, withdrawal : 0, balance : 1142.964419913848, interest : 0.9524703499282066, closing : 1143.9168902637762 });
            expect(liability.liabilityInMonth('2017-07-04T10:20:00')).toEqual({ opening : 1143.9168902637762, repayment : 1143.9168902637762, withdrawal : 0, balance : 0, interest : 0, closing : 0 });
            expect(liability.liabilityInMonth('2017-08-04T10:20:00')).toEqual({ opening : 0, repayment : 0, withdrawal : 0, balance : 0, interest : 0, closing : 0 });
            expect(liability.liabilityInMonth('2017-09-04T10:20:00')).toEqual({ opening : 0, repayment : 0, withdrawal : 0, balance : 0, interest : 0, closing : 0 });
            expect(liability.liabilityInMonth('2017-10-04T10:20:00')).toEqual({ opening : 0, repayment : 0, withdrawal : 0, balance : 0, interest : 0, closing : 0 });
        });

        it('computes property liabilityInMonth for Monthly payments', function () {
            expect(liability.liabilityInMonth('2015-01-04T10:20:00')).toEqual({ opening : 100000, repayment : 10000, withdrawal : 0, balance : 90000, interest : 75, closing : 90075 });
            expect(liability.liabilityInMonth('2015-02-04T10:20:00')).toEqual({ opening : 90075, repayment : 10000, withdrawal : 0, balance : 80075, interest : 66.72916666666666, closing : 80141.72916666667 });
            expect(liability.liabilityInMonth('2015-03-04T10:20:00')).toEqual({ opening : 80141.72916666667, repayment : 10000, withdrawal : 0, balance : 70141.72916666667, interest : 58.45144097222223, closing : 70200.18060763889 });
            expect(liability.liabilityInMonth('2015-04-04T10:20:00')).toEqual({ opening : 70200.18060763889, repayment : 10000, withdrawal : 0, balance : 60200.18060763889, interest : 50.166817173032406, closing : 60250.347424811924 });
            expect(liability.liabilityInMonth('2015-05-04T10:20:00')).toEqual({ opening : 60250.347424811924, repayment : 10000, withdrawal : 0, balance : 50250.347424811924, interest : 41.875289520676596, closing : 50292.2227143326 });
            expect(liability.liabilityInMonth('2015-06-04T10:20:00')).toEqual({ opening : 50292.2227143326, repayment : 10000, withdrawal : 0, balance : 40292.2227143326, interest : 33.576852261943834, closing : 40325.79956659455 });
            expect(liability.liabilityInMonth('2015-07-04T10:20:00')).toEqual({ opening : 40325.79956659455, repayment : 10000, withdrawal : 0, balance : 30325.79956659455, interest : 25.27149963882879, closing : 30351.071066233377 });
            expect(liability.liabilityInMonth('2015-08-04T10:20:00')).toEqual({ opening : 30351.071066233377, repayment : 10000, withdrawal : 0, balance : 20351.071066233377, interest : 16.95922588852781, closing : 20368.030292121904 });
            expect(liability.liabilityInMonth('2015-09-04T10:20:00')).toEqual({ opening : 20368.030292121904, repayment : 10000, withdrawal : 0, balance : 10368.030292121904, interest : 8.64002524343492, closing : 10376.670317365339 });
            expect(liability.liabilityInMonth('2015-10-04T10:20:00')).toEqual({ opening : 10376.670317365339, repayment : 10000, withdrawal : 0, balance : 376.67031736533863, interest : 0.3138919311377822, closing : 376.9842092964764 });
            expect(liability.liabilityInMonth('2015-11-04T10:20:00')).toEqual({ opening : 376.9842092964764, repayment : 376.9842092964764, withdrawal : 0, balance : 0, interest : 0, closing : 0 });
            expect(liability.liabilityInMonth('2015-12-04T10:20:00')).toEqual({ opening : 0, repayment : 0, withdrawal : 0, balance : 0, interest : 0, closing : 0 });
        });

        it('computes property liabilityInMonth Bi-Monthly payments', function () {
            liability.frequency = 'bi-monthly';
            expect(liability.liabilityInMonth('2014-12-04T10:20:00')).toEqual({ opening : 0, repayment : 0, withdrawal : 0, balance : 0, interest : 0, closing : 0 });
            expect(liability.liabilityInMonth('2015-01-04T10:20:00')).toEqual({ opening : 100000, repayment : 20000, withdrawal : 0, balance : 80000, interest : 66.66666666666666, closing : 80066.66666666667 });
            expect(liability.liabilityInMonth('2015-02-04T10:20:00')).toEqual({ opening : 80066.66666666667, repayment : 20000, withdrawal : 0, balance : 60066.66666666667, interest : 50.05555555555556, closing : 60116.722222222226 });
            expect(liability.liabilityInMonth('2015-03-04T10:20:00')).toEqual({ opening : 60116.722222222226, repayment : 20000, withdrawal : 0, balance : 40116.722222222226, interest : 33.430601851851854, closing : 40150.15282407408 });
            expect(liability.liabilityInMonth('2015-04-04T10:20:00')).toEqual({ opening : 40150.15282407408, repayment : 20000, withdrawal : 0, balance : 20150.15282407408, interest : 16.791794020061733, closing : 20166.94461809414 });
            expect(liability.liabilityInMonth('2015-05-04T10:20:00')).toEqual({ opening : 20166.94461809414, repayment : 20000, withdrawal : 0, balance : 166.94461809414133, interest : 0.1391205150784511, closing : 167.08373860921978 });
            expect(liability.liabilityInMonth('2015-06-04T10:20:00')).toEqual({ opening : 167.08373860921978, repayment : 167.08373860921978, withdrawal : 0, balance : 0, interest : 0, closing : 0 });
            expect(liability.liabilityInMonth('2015-07-04T10:20:00')).toEqual({ opening : 0, repayment : 0, withdrawal : 0, balance : 0, interest : 0, closing : 0 });
        });

        it('computes property liabilityInRange Quarterly payments', function () {
            liability.frequency = 'quarterly';

            expect(liability.liabilityInRange('2014-12-04T10:20:00', '2016-01-04T10:20:00')).toEqual([
                { opening : 0, repayment : 0, withdrawal : 0, balance : 0, interest : 0, closing : 0 },
                { opening : 100000, repayment : 10000, withdrawal : 0, balance : 90000, interest : 75, closing : 90075 },
                { opening : 90075, repayment : 0, withdrawal : 0, balance : 90075, interest : 75.0625, closing : 90150.0625 },
                { opening : 90150.0625, repayment : 0, withdrawal : 0, balance : 90150.0625, interest : 75.12505208333333, closing : 90225.18755208333 },
                { opening : 90225.18755208333, repayment : 10000, withdrawal : 0, balance : 80225.18755208333, interest : 66.85432296006944, closing : 80292.0418750434 },
                { opening : 80292.0418750434, repayment : 0, withdrawal : 0, balance : 80292.0418750434, interest : 66.9100348958695, closing : 80358.95190993928 },
                { opening : 80358.95190993928, repayment : 0, withdrawal : 0, balance : 80358.95190993928, interest : 66.96579325828273, closing : 80425.91770319756 },
                { opening : 80425.91770319756, repayment : 10000, withdrawal : 0, balance : 70425.91770319756, interest : 58.68826475266463, closing : 70484.60596795022 },
                { opening : 70484.60596795022, repayment : 0, withdrawal : 0, balance : 70484.60596795022, interest : 58.73717163995852, closing : 70543.34313959019 },
                { opening : 70543.34313959019, repayment : 0, withdrawal : 0, balance : 70543.34313959019, interest : 58.78611928299182, closing : 70602.12925887317 },
                { opening : 70602.12925887317, repayment : 10000, withdrawal : 0, balance : 60602.129258873174, interest : 50.5017743823943, closing : 60652.631033255566 },
                { opening : 60652.631033255566, repayment : 0, withdrawal : 0, balance : 60652.631033255566, interest : 50.543859194379635, closing : 60703.17489244995 },
                { opening : 60703.17489244995, repayment : 0, withdrawal : 0, balance : 60703.17489244995, interest : 50.58597907704162, closing : 60753.76087152699 }
            ]);
        });

        it('computes property liabilityInRange Bi-Monthly payments', function () {
            liability.frequency = 'bi-monthly';

            expect(liability.liabilityInRange('2014-12-04T10:20:00', '2015-07-04T10:20:00')).toEqual([
                { opening : 0, repayment : 0, withdrawal : 0, balance : 0, interest : 0, closing : 0 },
                { opening : 100000, repayment : 20000, withdrawal : 0, balance : 80000, interest : 66.66666666666666, closing : 80066.66666666667 },
                { opening : 80066.66666666667, repayment : 20000, withdrawal : 0, balance : 60066.66666666667, interest : 50.05555555555556, closing : 60116.722222222226 },
                { opening : 60116.722222222226, repayment : 20000, withdrawal : 0, balance : 40116.722222222226, interest : 33.430601851851854, closing : 40150.15282407408 },
                { opening : 40150.15282407408, repayment : 20000, withdrawal : 0, balance : 20150.15282407408, interest : 16.791794020061733, closing : 20166.94461809414 },
                { opening : 20166.94461809414, repayment : 20000, withdrawal : 0, balance : 166.94461809414133, interest : 0.1391205150784511, closing : 167.08373860921978 },
                { opening : 167.08373860921978, repayment : 167.08373860921978, withdrawal : 0, balance : 0, interest : 0, closing : 0 }
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
            expect(liability.liabilityInMonth('2015-01-04T10:20:00')).toEqual({ opening : 50000, repayment : 10000, withdrawal : 0, balance : 40000, interest : 33.33333333333333, closing : 40033.333333333336 });
            expect(liability.liabilityInMonth('2015-02-04T10:20:00')).toEqual({ opening : 40033.333333333336, repayment : 10000, withdrawal : 0, balance : 30033.333333333336, interest : 25.02777777777778, closing : 30058.361111111113 });
            expect(liability.liabilityInMonth('2015-03-04T10:20:00')).toEqual({ opening : 30058.361111111113, repayment : 10000, withdrawal : 0, balance : 20058.361111111113, interest : 16.715300925925927, closing : 20075.07641203704 });
            expect(liability.liabilityInMonth('2015-04-04T10:20:00')).toEqual({ opening : 20075.07641203704, repayment : 10000, withdrawal : 0, balance : 10075.07641203704, interest : 8.395897010030867, closing : 10083.47230904707 });
            expect(liability.liabilityInMonth('2015-05-04T10:20:00')).toEqual({ opening : 10083.47230904707, repayment : 10000, withdrawal : 0, balance : 83.47230904707067, interest : 0.06956025753922555, closing : 83.54186930460989 });
            expect(liability.liabilityInMonth('2015-06-04T10:20:00')).toEqual({ opening : 83.54186930460989, repayment : 83.54186930460989, withdrawal : 0, balance : 0, interest : 0, closing : 0 });
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
            expect(liability.data.monthly[1]).toEqual({ opening : 3002.5, repayment : 0, withdrawal : 10000, balance : 13002.5, interest : 10.835416666666665, closing : 13013.335416666667 });

            expect(liability.setWithdrawalInMonth(50000, '2015-05-04T10:20:00')).toBe(13035.03);

            expect(liability.data.monthly.length).toBe(5);

            expect(liability.data.monthly[2]).toEqual({ opening : 13013.335416666667, repayment : 0, withdrawal : 0, balance : 13013.335416666667, interest : 10.844446180555556, closing : 13024.179862847222 });
            expect(liability.data.monthly[3]).toEqual({ opening : 13024.179862847222, repayment : 0, withdrawal : 0, balance : 13024.179862847222, interest : 10.85348321903935, closing : 13035.033346066262 });
            expect(liability.data.monthly[4]).toEqual({ opening : 13035.033346066262, repayment : 0, withdrawal : 36964.966653933734, balance : 50000, interest : 41.66666666666666, closing : 50041.666666666664 });

            expect(liability.setRepaymentInMonth(25000, '2015-07-04T10:20:00')).toBe(0);

            expect(liability.data.monthly.length).toBe(7);

            expect(liability.data.monthly[5]).toEqual({ opening : 50041.666666666664, repayment : 0, withdrawal : 0, balance : 50041.666666666664, interest : 41.701388888888886, closing : 50083.368055555555 });
            expect(liability.data.monthly[6]).toEqual({ opening : 50083.368055555555, repayment : 25000, withdrawal : 0, balance : 25083.368055555555, interest : 20.90280671296296, closing : 25104.270862268517 });

            expect(liability.setRepaymentInMonth(30000, '2015-08-04T10:20:00')).toBe(4895.73);

            expect(liability.data.monthly.length).toBe(8);

            expect(liability.data.monthly[7]).toEqual({ opening : 25104.270862268517, repayment : 25104.270862268517, withdrawal : 0, balance : 0, interest : 0, closing : 0 });

            //console.log(JSON.stringify(liability));
        });

        it('adds repayments to a month', function () {
            expect(liability.setRepaymentInMonth(500, '2015-02-04T10:20:00')).toBe(0);

            expect(liability.data.monthly.length).toBe(2);

            expect(liability.data.monthly[0]).toEqual({ opening : 1000, repayment : 0, withdrawal : 0, balance : 1000, interest : 0.8333333333333333, closing : 1000.8333333333334 });

            expect(liability.data.monthly[1]).toEqual({ opening : 1000.8333333333334, repayment : 500, withdrawal : 0, balance : 500.83333333333337, interest : 0.4173611111111111, closing : 501.2506944444445 });

            expect(liability.addRepaymentInMonth(250, '2015-02-04T10:20:00')).toBe(0);

            expect(liability.data.monthly.length).toBe(2);

            expect(liability.data.monthly[1]).toEqual({ opening : 1000.8333333333334, repayment : 750, withdrawal : 0, balance : 250.83333333333337, interest : 0.20902777777777778, closing : 251.04236111111115 });

            expect(liability.addRepaymentInMonth(500, '2015-02-04T10:20:00')).toBe(249.17);

            expect(liability.data.monthly.length).toBe(2);

            expect(liability.data.monthly[1]).toEqual({ opening : 1000.8333333333334, repayment : 1000.8333333333334, withdrawal : 0, balance : 0, interest : 0, closing : 0 });

            expect(liability.addRepaymentInMonth(500, '2015-02-04T10:20:00')).toBe(500);

            expect(liability.data.monthly.length).toBe(2);

            expect(liability.data.monthly[1]).toEqual({ opening : 1000.8333333333334, repayment : 1000.8333333333334, withdrawal : 0, balance : 0, interest : 0, closing : 0 });
        });

        it('adds withdrawals to a month', function () {
            expect(liability.setWithdrawalInMonth(500, '2015-01-04T10:20:00')).toBe(0);

            expect(liability.data.monthly.length).toBe(1);

            expect(liability.data.monthly[0]).toEqual({ opening : 1000, repayment : 0, withdrawal : 500, balance : 1500, interest : 1.25, closing : 1501.25 });

            expect(liability.addWithdrawalInMonth(25000, '2015-01-04T10:20:00')).toBe(0);

            expect(liability.data.monthly.length).toBe(1);

            expect(liability.data.monthly[0]).toEqual({ opening : 1000, repayment : 0, withdrawal : 25500, balance : 26500, interest : 22.08333333333333, closing : 26522.083333333332 });

            expect(liability.addWithdrawalInMonth(25000, '2015-01-04T10:20:00')).toBe(1500);

            expect(liability.data.monthly.length).toBe(1);

            expect(liability.data.monthly[0]).toEqual({ opening : 1000, repayment : 0, withdrawal : 49000, balance : 50000, interest : 41.66666666666666, closing : 50041.666666666664 });

            expect(liability.addWithdrawalInMonth(25000, '2015-01-04T10:20:00')).toBe(25000);

            expect(liability.data.monthly.length).toBe(1);

            expect(liability.data.monthly[0]).toEqual({ opening : 1000, repayment : 0, withdrawal : 49000, balance : 50000, interest : 41.66666666666666, closing : 50041.666666666664 });
        });
    });});
