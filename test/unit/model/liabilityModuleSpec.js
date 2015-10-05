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
            expect(liability.balanceInMonth('2015-01-04T10:20:00')).toEqual(90083.33333333333);
        });

        it('computes property liabilityInMonth for Quarterly payments', function () {
            liability.frequency = 'quarterly';
            expect(liability.liabilityInMonth('2015-01-04T10:20:00')).toEqual({ opening : 100000, repayment : 10000, withdrawal : 0, balance : 90000, interest : 83.33333333333331, closing : 90083.33333333333 });
            expect(liability.liabilityInMonth('2015-02-04T10:20:00')).toEqual({ opening : 90083.33333333333, repayment : 0, withdrawal : 0, balance : 90083.33333333333, interest : 75.06944444444443, closing : 90158.40277777777 });
            expect(liability.liabilityInMonth('2015-03-04T10:20:00')).toEqual({ opening : 90158.40277777777, repayment : 0, withdrawal : 0, balance : 90158.40277777777, interest : 75.1320023148148, closing : 90233.53478009258 });
            expect(liability.liabilityInMonth('2015-04-04T10:20:00')).toEqual({ opening : 90233.53478009258, repayment : 10000, withdrawal : 0, balance : 80233.53478009258, interest : 75.19461231674381, closing : 80308.72939240932 });
            expect(liability.liabilityInMonth('2015-05-04T10:20:00')).toEqual({ opening : 80308.72939240932, repayment : 0, withdrawal : 0, balance : 80308.72939240932, interest : 66.9239411603411, closing : 80375.65333356966 });
            expect(liability.liabilityInMonth('2015-06-04T10:20:00')).toEqual({ opening : 80375.65333356966, repayment : 0, withdrawal : 0, balance : 80375.65333356966, interest : 66.97971111130805, closing : 80442.63304468097 });
            expect(liability.liabilityInMonth('2015-07-04T10:20:00')).toEqual({ opening : 80442.63304468097, repayment : 10000, withdrawal : 0, balance : 70442.63304468097, interest : 67.03552753723415, closing : 70509.6685722182 });
            expect(liability.liabilityInMonth('2015-08-04T10:20:00')).toEqual({ opening : 70509.6685722182, repayment : 0, withdrawal : 0, balance : 70509.6685722182, interest : 58.75805714351516, closing : 70568.42662936171 });
            expect(liability.liabilityInMonth('2015-09-04T10:20:00')).toEqual({ opening : 70568.42662936171, repayment : 0, withdrawal : 0, balance : 70568.42662936171, interest : 58.807022191134756, closing : 70627.23365155284 });
            expect(liability.liabilityInMonth('2015-10-04T10:20:00')).toEqual({ opening : 70627.23365155284, repayment : 10000, withdrawal : 0, balance : 60627.233651552844, interest : 58.856028042960695, closing : 60686.0896795958 });
            expect(liability.liabilityInMonth('2015-11-04T10:20:00')).toEqual({ opening : 60686.0896795958, repayment : 0, withdrawal : 0, balance : 60686.0896795958, interest : 50.57174139966317, closing : 60736.661420995464 });
            expect(liability.liabilityInMonth('2015-12-04T10:20:00')).toEqual({ opening : 60736.661420995464, repayment : 0, withdrawal : 0, balance : 60736.661420995464, interest : 50.61388451749622, closing : 60787.27530551296 });
            expect(liability.liabilityInMonth('2016-01-04T10:20:00')).toEqual({ opening : 60787.27530551296, repayment : 10000, withdrawal : 0, balance : 50787.27530551296, interest : 50.65606275459413, closing : 50837.93136826755 });
            expect(liability.liabilityInMonth('2016-02-04T10:20:00')).toEqual({ opening : 50837.93136826755, repayment : 0, withdrawal : 0, balance : 50837.93136826755, interest : 42.36494280688962, closing : 50880.29631107444 });
            expect(liability.liabilityInMonth('2016-03-04T10:20:00')).toEqual({ opening : 50880.29631107444, repayment : 0, withdrawal : 0, balance : 50880.29631107444, interest : 42.40024692589536, closing : 50922.69655800033 });
            expect(liability.liabilityInMonth('2016-04-04T10:20:00')).toEqual({ opening : 50922.69655800033, repayment : 10000, withdrawal : 0, balance : 40922.69655800033, interest : 42.43558046500028, closing : 40965.13213846533 });
            expect(liability.liabilityInMonth('2016-05-04T10:20:00')).toEqual({ opening : 40965.13213846533, repayment : 0, withdrawal : 0, balance : 40965.13213846533, interest : 34.13761011538777, closing : 40999.269748580715 });
            expect(liability.liabilityInMonth('2016-06-04T10:20:00')).toEqual({ opening : 40999.269748580715, repayment : 0, withdrawal : 0, balance : 40999.269748580715, interest : 34.16605812381726, closing : 41033.43580670453 });
            expect(liability.liabilityInMonth('2016-07-04T10:20:00')).toEqual({ opening : 41033.43580670453, repayment : 10000, withdrawal : 0, balance : 31033.435806704532, interest : 34.194529838920445, closing : 31067.630336543454 });
            expect(liability.liabilityInMonth('2016-08-04T10:20:00')).toEqual({ opening : 31067.630336543454, repayment : 0, withdrawal : 0, balance : 31067.630336543454, interest : 25.889691947119545, closing : 31093.520028490573 });
            expect(liability.liabilityInMonth('2016-09-04T10:20:00')).toEqual({ opening : 31093.520028490573, repayment : 0, withdrawal : 0, balance : 31093.520028490573, interest : 25.911266690408812, closing : 31119.43129518098 });
            expect(liability.liabilityInMonth('2016-10-04T10:20:00')).toEqual({ opening : 31119.43129518098, repayment : 10000, withdrawal : 0, balance : 21119.43129518098, interest : 25.932859412650814, closing : 21145.36415459363 });
            expect(liability.liabilityInMonth('2016-11-04T10:20:00')).toEqual({ opening : 21145.36415459363, repayment : 0, withdrawal : 0, balance : 21145.36415459363, interest : 17.62113679549469, closing : 21162.985291389123 });
            expect(liability.liabilityInMonth('2016-12-04T10:20:00')).toEqual({ opening : 21162.985291389123, repayment : 0, withdrawal : 0, balance : 21162.985291389123, interest : 17.6358210761576, closing : 21180.62111246528 });
            expect(liability.liabilityInMonth('2017-01-04T10:20:00')).toEqual({ opening : 21180.62111246528, repayment : 10000, withdrawal : 0, balance : 11180.62111246528, interest : 17.650517593721066, closing : 11198.271630059002 });
            expect(liability.liabilityInMonth('2017-02-04T10:20:00')).toEqual({ opening : 11198.271630059002, repayment : 0, withdrawal : 0, balance : 11198.271630059002, interest : 9.331893025049167, closing : 11207.603523084052 });
            expect(liability.liabilityInMonth('2017-03-04T10:20:00')).toEqual({ opening : 11207.603523084052, repayment : 0, withdrawal : 0, balance : 11207.603523084052, interest : 9.339669602570043, closing : 11216.943192686622 });
            expect(liability.liabilityInMonth('2017-04-04T10:20:00')).toEqual({ opening : 11216.943192686622, repayment : 10000, withdrawal : 0, balance : 1216.9431926866218, interest : 9.347452660572184, closing : 1226.290645347194 });
            expect(liability.liabilityInMonth('2017-05-04T10:20:00')).toEqual({ opening : 1226.290645347194, repayment : 0, withdrawal : 0, balance : 1226.290645347194, interest : 1.0219088711226616, closing : 1227.3125542183166 });
            expect(liability.liabilityInMonth('2017-06-04T10:20:00')).toEqual({ opening : 1227.3125542183166, repayment : 0, withdrawal : 0, balance : 1227.3125542183166, interest : 1.022760461848597, closing : 1228.335314680165 });
            expect(liability.liabilityInMonth('2017-07-04T10:20:00')).toEqual({ opening : 1228.335314680165, repayment : 1229.3589274423985, withdrawal : 0, balance : 0, interest : 1.023612762233471, closing : 0 });
            expect(liability.liabilityInMonth('2017-08-04T10:20:00')).toEqual({ opening : 0, repayment : 0, withdrawal : 0, balance : 0, interest : 0, closing : 0 });
            expect(liability.liabilityInMonth('2017-09-04T10:20:00')).toEqual({ opening : 0, repayment : 0, withdrawal : 0, balance : 0, interest : 0, closing : 0 });
            expect(liability.liabilityInMonth('2017-10-04T10:20:00')).toEqual({ opening : 0, repayment : 0, withdrawal : 0, balance : 0, interest : 0, closing : 0 });
        });

        it('computes property liabilityInMonth for Monthly payments', function () {
            expect(liability.liabilityInMonth('2015-01-04T10:20:00')).toEqual({ opening : 100000, repayment : 10000, withdrawal : 0, balance : 90000, interest : 83.33333333333331, closing : 90083.33333333333 });
            expect(liability.liabilityInMonth('2015-02-04T10:20:00')).toEqual({ opening : 90083.33333333333, repayment : 10000, withdrawal : 0, balance : 80083.33333333333, interest : 75.06944444444443, closing : 80158.40277777777 });
            expect(liability.liabilityInMonth('2015-03-04T10:20:00')).toEqual({ opening : 80158.40277777777, repayment : 10000, withdrawal : 0, balance : 70158.40277777777, interest : 66.79866898148147, closing : 70225.20144675925 });
            expect(liability.liabilityInMonth('2015-04-04T10:20:00')).toEqual({ opening : 70225.20144675925, repayment : 10000, withdrawal : 0, balance : 60225.20144675925, interest : 58.52100120563271, closing : 60283.72244796489 });
            expect(liability.liabilityInMonth('2015-05-04T10:20:00')).toEqual({ opening : 60283.72244796489, repayment : 10000, withdrawal : 0, balance : 50283.72244796489, interest : 50.23643537330407, closing : 50333.95888333819 });
            expect(liability.liabilityInMonth('2015-06-04T10:20:00')).toEqual({ opening : 50333.95888333819, repayment : 10000, withdrawal : 0, balance : 40333.95888333819, interest : 41.94496573611516, closing : 40375.90384907431 });
            expect(liability.liabilityInMonth('2015-07-04T10:20:00')).toEqual({ opening : 40375.90384907431, repayment : 10000, withdrawal : 0, balance : 30375.90384907431, interest : 33.64658654089526, closing : 30409.550435615205 });
            expect(liability.liabilityInMonth('2015-08-04T10:20:00')).toEqual({ opening : 30409.550435615205, repayment : 10000, withdrawal : 0, balance : 20409.550435615205, interest : 25.341292029679334, closing : 20434.891727644885 });
            expect(liability.liabilityInMonth('2015-09-04T10:20:00')).toEqual({ opening : 20434.891727644885, repayment : 10000, withdrawal : 0, balance : 10434.891727644885, interest : 17.02907643970407, closing : 10451.920804084588 });
            expect(liability.liabilityInMonth('2015-10-04T10:20:00')).toEqual({ opening : 10451.920804084588, repayment : 10000, withdrawal : 0, balance : 451.92080408458787, interest : 8.709934003403824, closing : 460.6307380879917 });
            expect(liability.liabilityInMonth('2015-11-04T10:20:00')).toEqual({ opening : 460.6307380879917, repayment : 461.01459703639836, withdrawal : 0, balance : 0, interest : 0.3838589484066597, closing : 0 });
            expect(liability.liabilityInMonth('2015-12-04T10:20:00')).toEqual({ opening : 0, repayment : 0, withdrawal : 0, balance : 0, interest : 0, closing : 0 });
        });

        it('computes property liabilityInMonth Bi-Monthly payments', function () {
            liability.frequency = 'bi-monthly';
            expect(liability.liabilityInMonth('2014-12-04T10:20:00')).toEqual({ opening : 0, repayment : 0, withdrawal : 0, balance : 0, interest : 0, closing : 0 });
            expect(liability.liabilityInMonth('2015-01-04T10:20:00')).toEqual({ opening : 100000, repayment : 20000, withdrawal : 0, balance : 80000, interest : 83.33333333333331, closing : 80083.33333333333 });
            expect(liability.liabilityInMonth('2015-02-04T10:20:00')).toEqual({ opening : 80083.33333333333, repayment : 20000, withdrawal : 0, balance : 60083.33333333333, interest : 66.7361111111111, closing : 60150.06944444444 });
            expect(liability.liabilityInMonth('2015-03-04T10:20:00')).toEqual({ opening : 60150.06944444444, repayment : 20000, withdrawal : 0, balance : 40150.06944444444, interest : 50.12505787037036, closing : 40200.19450231481 });
            expect(liability.liabilityInMonth('2015-04-04T10:20:00')).toEqual({ opening : 40200.19450231481, repayment : 20000, withdrawal : 0, balance : 20200.194502314807, interest : 33.50016208526234, closing : 20233.69466440007 });
            expect(liability.liabilityInMonth('2015-05-04T10:20:00')).toEqual({ opening : 20233.69466440007, repayment : 20000, withdrawal : 0, balance : 233.6946644000709, interest : 16.861412220333392, closing : 250.5560766204043 });
            expect(liability.liabilityInMonth('2015-06-04T10:20:00')).toEqual({ opening : 250.5560766204043, repayment : 250.7648733509213, withdrawal : 0, balance : 0, interest : 0.2087967305170036, closing : 0 });
            expect(liability.liabilityInMonth('2015-07-04T10:20:00')).toEqual({ opening : 0, repayment : 0, withdrawal : 0, balance : 0, interest : 0, closing : 0 });
        });

        it('computes property liabilityInRange Quarterly payments', function () {
            liability.frequency = 'quarterly';

            expect(liability.liabilityInRange('2014-12-04T10:20:00', '2016-01-04T10:20:00')).toEqual([
                { opening : 0, repayment : 0, withdrawal : 0, balance : 0, interest : 0, closing : 0 },
                { opening : 100000, repayment : 10000, withdrawal : 0, balance : 90000, interest : 83.33333333333331, closing : 90083.33333333333 },
                { opening : 90083.33333333333, repayment : 0, withdrawal : 0, balance : 90083.33333333333, interest : 75.06944444444443, closing : 90158.40277777777 },
                { opening : 90158.40277777777, repayment : 0, withdrawal : 0, balance : 90158.40277777777, interest : 75.1320023148148, closing : 90233.53478009258 },
                { opening : 90233.53478009258, repayment : 10000, withdrawal : 0, balance : 80233.53478009258, interest : 75.19461231674381, closing : 80308.72939240932 },
                { opening : 80308.72939240932, repayment : 0, withdrawal : 0, balance : 80308.72939240932, interest : 66.9239411603411, closing : 80375.65333356966 },
                { opening : 80375.65333356966, repayment : 0, withdrawal : 0, balance : 80375.65333356966, interest : 66.97971111130805, closing : 80442.63304468097 },
                { opening : 80442.63304468097, repayment : 10000, withdrawal : 0, balance : 70442.63304468097, interest : 67.03552753723415, closing : 70509.6685722182 },
                { opening : 70509.6685722182, repayment : 0, withdrawal : 0, balance : 70509.6685722182, interest : 58.75805714351516, closing : 70568.42662936171 },
                { opening : 70568.42662936171, repayment : 0, withdrawal : 0, balance : 70568.42662936171, interest : 58.807022191134756, closing : 70627.23365155284 },
                { opening : 70627.23365155284, repayment : 10000, withdrawal : 0, balance : 60627.233651552844, interest : 58.856028042960695, closing : 60686.0896795958 },
                { opening : 60686.0896795958, repayment : 0, withdrawal : 0, balance : 60686.0896795958, interest : 50.57174139966317, closing : 60736.661420995464 },
                { opening : 60736.661420995464, repayment : 0, withdrawal : 0, balance : 60736.661420995464, interest : 50.61388451749622, closing : 60787.27530551296 }
            ]);
        });

        it('computes property liabilityInRange Bi-Monthly payments', function () {
            liability.frequency = 'bi-monthly';

            expect(liability.liabilityInRange('2014-12-04T10:20:00', '2015-07-04T10:20:00')).toEqual([
                { opening : 0, repayment : 0, withdrawal : 0, balance : 0, interest : 0, closing : 0 },
                { opening : 100000, repayment : 20000, withdrawal : 0, balance : 80000, interest : 83.33333333333331, closing : 80083.33333333333 },
                { opening : 80083.33333333333, repayment : 20000, withdrawal : 0, balance : 60083.33333333333, interest : 66.7361111111111, closing : 60150.06944444444 },
                { opening : 60150.06944444444, repayment : 20000, withdrawal : 0, balance : 40150.06944444444, interest : 50.12505787037036, closing : 40200.19450231481 },
                { opening : 40200.19450231481, repayment : 20000, withdrawal : 0, balance : 20200.194502314807, interest : 33.50016208526234, closing : 20233.69466440007 },
                { opening : 20233.69466440007, repayment : 20000, withdrawal : 0, balance : 233.6946644000709, interest : 16.861412220333392, closing : 250.5560766204043 },
                { opening : 250.5560766204043, repayment : 250.7648733509213, withdrawal : 0, balance : 0, interest : 0.2087967305170036, closing : 0 }
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
            expect(liability.liabilityInMonth('2015-01-04T10:20:00')).toEqual({ opening : 50000, repayment : 10000, withdrawal : 0, balance : 40000, interest : 41.66666666666666, closing : 40041.666666666664 });
            expect(liability.liabilityInMonth('2015-02-04T10:20:00')).toEqual({ opening : 40041.666666666664, repayment : 10000, withdrawal : 0, balance : 30041.666666666664, interest : 33.36805555555555, closing : 30075.03472222222 });
            expect(liability.liabilityInMonth('2015-03-04T10:20:00')).toEqual({ opening : 30075.03472222222, repayment : 10000, withdrawal : 0, balance : 20075.03472222222, interest : 25.06252893518518, closing : 20100.097251157404 });
            expect(liability.liabilityInMonth('2015-04-04T10:20:00')).toEqual({ opening : 20100.097251157404, repayment : 10000, withdrawal : 0, balance : 10100.097251157404, interest : 16.75008104263117, closing : 10116.847332200035 });
            expect(liability.liabilityInMonth('2015-05-04T10:20:00')).toEqual({ opening : 10116.847332200035, repayment : 10000, withdrawal : 0, balance : 116.84733220003545, interest : 8.430706110166696, closing : 125.27803831020215 });
            expect(liability.liabilityInMonth('2015-06-04T10:20:00')).toEqual({ opening : 125.27803831020215, repayment : 125.38243667546065, withdrawal : 0, balance : 0, interest : 0.1043983652585018, closing : 0 });
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

            expect(liability.data.monthly[0]).toEqual({ opening : 1000, repayment : 0, withdrawal : 2000, balance : 3000, interest : 0.8333333333333333, closing : 3000.8333333333335 });
            expect(liability.data.monthly[1]).toEqual({ opening : 3000.8333333333335, repayment : 0, withdrawal : 10000, balance : 13000.833333333334, interest : 2.5006944444444446, closing : 13003.334027777779 });

            expect(liability.setWithdrawalInMonth(50000, '2015-05-04T10:20:00')).toBe(13025.015281250482);

            expect(liability.data.monthly.length).toBe(5);

            expect(liability.data.monthly[2]).toEqual({ opening : 13003.334027777779, repayment : 0, withdrawal : 0, balance : 13003.334027777779, interest : 10.836111689814816, closing : 13014.170139467593 });
            expect(liability.data.monthly[3]).toEqual({ opening : 13014.170139467593, repayment : 0, withdrawal : 0, balance : 13014.170139467593, interest : 10.845141782889659, closing : 13025.015281250482 });
            expect(liability.data.monthly[4]).toEqual({ opening : 13025.015281250482, repayment : 0, withdrawal : 36974.98471874952, balance : 50000, interest : 10.854179401042067, closing : 50010.854179401045 });

            expect(liability.setRepaymentInMonth(25000, '2015-07-04T10:20:00')).toBe(0);

            expect(liability.data.monthly.length).toBe(7);

            expect(liability.data.monthly[5]).toEqual({ opening : 50010.854179401045, repayment : 0, withdrawal : 0, balance : 50010.854179401045, interest : 41.675711816167535, closing : 50052.529891217215 });
            expect(liability.data.monthly[6]).toEqual({ opening : 50052.529891217215, repayment : 25000, withdrawal : 0, balance : 25052.529891217215, interest : 41.71044157601435, closing : 25094.24033279323 });

            expect(liability.setRepaymentInMonth(30000, '2015-08-04T10:20:00')).toBe(4905.75966720677);

            expect(liability.data.monthly.length).toBe(8);

            expect(liability.data.monthly[7]).toEqual({ opening : 25094.24033279323, repayment : 25094.24033279323, withdrawal : 0, balance : 0, interest : 20.911866943994355, closing : 0 });

            //console.log(JSON.stringify(liability));
        });
    });});
