var sdkModelLiability = angular.module('ag.sdk.model.liability', ['ag.sdk.library', 'ag.sdk.model.base']);

sdkModelLiability.factory('Liability', ['computedProperty', 'inheritModel', 'Model', 'moment', 'privateProperty', 'readOnlyProperty', 'underscore',
    function (computedProperty, inheritModel, Model, moment, privateProperty, readOnlyProperty, underscore) {
        var _frequency = {
            'monthly': 12,
            'bi-monthly': 24,
            'quarterly': 4,
            'bi-yearly': 2,
            'yearly': 1
        };

        function Liability (attrs) {
            Model.Base.apply(this, arguments);

            computedProperty(this, 'currentBalance', function () {
                return (this.type !== 'rent' ? this.liabilityInMonth(moment().startOf('month')) : 0);
            });

            privateProperty(this, 'balanceInMonth', function (month) {
                var balance = this.amount || 0;

                if (this.type !== 'rent') {
                    var startMonth = moment(this.startDate),
                        paymentMonths = this.paymentMonths,
                        paymentsPerMonth = (_frequency[this.frequency] > 12 ? _frequency[this.frequency] / 12 : 1),
                        numberOfMonths = moment(month).diff(startMonth, 'months') + 1;

                    for(var i = 0; i < numberOfMonths; i++) {
                        var month = moment(this.startDate).add(i, 'M');

                        if (month >= startMonth) {
                            balance += (((this.interestRate || 0) / 100) / 12) * balance;

                            if (underscore.contains(paymentMonths, month.month())) {
                                for (var j = 0; j < paymentsPerMonth; j++) {
                                    balance -= Math.min(balance, (this.installmentPayment || 0));
                                }
                            }
                        }
                    }
                }

                return balance;
            });

            computedProperty(this, 'paymentMonths', function () {
                var paymentsPerYear = _frequency[this.frequency],
                    firstPaymentMonth = moment(this.startDate).month();

                return underscore
                    .range(firstPaymentMonth, firstPaymentMonth + 12, (paymentsPerYear < 12 ? 12 / paymentsPerYear : 1))
                    .map(function (value) {
                        return value % 12;
                    })
                    .sort(function (a, b) {
                        return a - b;
                    });
            });

            privateProperty(this, 'liabilityInMonth', function (month) {
                var previousMonth = moment(month).subtract(1, 'M'),
                    currentMonth = moment(month),
                    startMonth = moment(this.startDate),
                    endMonth = moment(this.endDate),
                    paymentsPerYear = _frequency[this.frequency],
                    paymentsPerMonth = (paymentsPerYear > 12 ? paymentsPerYear / 12 : 1),
                    previousBalance = this.balanceInMonth(previousMonth);

                var liability = 0;

                if (currentMonth >= startMonth && (this.endDate === undefined || currentMonth <= endMonth)) {
                    previousBalance += (((this.interestRate || 0) / 100) / 12) * previousBalance;

                    if (underscore.contains(this.paymentMonths, currentMonth.month())) {
                        for (var i = 0; i < paymentsPerMonth; i++) {
                            if (this.type !== 'rent') {
                                liability += Math.min(previousBalance, (this.installmentPayment || 0));
                                previousBalance -= Math.min(previousBalance, (this.installmentPayment || 0));
                            } else {
                                liability += (this.installmentPayment || 0);
                            }
                        }
                    }
                }

                return liability;
            });

            privateProperty(this, 'liabilityInRange', function (rangeStart, rangeEnd) {
                var previousMonth = moment(rangeStart).subtract(1, 'M'),
                    startMonth = moment(this.startDate),
                    endMonth = moment(this.endDate),
                    paymentMonths = this.paymentMonths,
                    paymentsPerYear = _frequency[this.frequency],
                    paymentsPerMonth = (paymentsPerYear > 12 ? paymentsPerYear / 12 : 1),
                    previousBalance = this.balanceInMonth(previousMonth),
                    numberOfMonths = moment(rangeEnd).diff(rangeStart, 'months') + 1;

                var liability = underscore.range(numberOfMonths).map(function () {
                    return 0;
                });

                for(var i = 0; i < numberOfMonths; i++) {
                    var month = moment(rangeStart).add(i, 'M');

                    if (month >= startMonth && (this.endDate === undefined || month <= endMonth)) {
                        previousBalance += (((this.interestRate || 0) / 100) / 12) * previousBalance;

                        if (underscore.contains(paymentMonths, month.month())) {
                            for (var j = 0; j < paymentsPerMonth; j++) {
                                if (this.type !== 'rent') {
                                    liability[i] += Math.min(previousBalance, (this.installmentPayment || 0));
                                    previousBalance -= Math.min(previousBalance, (this.installmentPayment || 0));
                                } else {
                                    liability[i] += (this.installmentPayment || 0);
                                }
                            }
                        }
                    }
                }

                return liability;
            });

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.id = attrs.id || attrs.$id;
            this.uuid = attrs.uuid;
            this.merchantUuid = attrs.merchantUuid;
            this.legalEntityId = attrs.legalEntityId;
            this.type = attrs.type;
            this.installmentPayment = attrs.installmentPayment;
            this.interestRate = attrs.interestRate;
            this.amount = attrs.amount;
            this.frequency = attrs.frequency;
            this.startDate = attrs.startDate;
            this.endDate = attrs.endDate;
        }

        inheritModel(Liability, Model.Base);

        readOnlyProperty(Liability, 'frequencyTypes', {
            'bi-monthly': 'Bi-Monthly',
            'monthly': 'Monthly',
            'quarterly': 'Quarterly',
            'bi-yearly': 'Bi-Yearly',
            'yearly': 'Yearly'});

        readOnlyProperty(Liability, 'liabilityTypes', {
            'short-loan': 'Short Term Loan',
            'medium-loan': 'Medium Term Loan',
            'long-loan': 'Long Term Loan',
            'rent': 'Rented'});

        privateProperty(Liability, 'getFrequencyTitle', function (type) {
            return Liability.frequencyTypes[type] || '';
        });

        privateProperty(Liability, 'getTypeTitle', function (type) {
            return Liability.liabilityTypes[type] || '';
        });

        function isLoaned (value, instance, field) {
            return instance.type !== 'rent';
        }

        function isLeased (value, instance, field) {
            return instance.leased === 'rent';
        }

        Liability.validates({
            installmentPayment: {
                required: true,
                numeric: true
            },
            interestRate: {
                requiredIf: isLoaned,
                numeric: true,
                range: {
                    from: 0,
                    to: 100
                }
            },
            legalEntityId: {
                required: true,
                numeric: true
            },
            amount: {
                requiredIf: isLoaned,
                numeric: true
            },
            merchantUuid: {
                required: true,
                format: {
                    uuid: true
                }
            },
            frequency: {
                required: true,
                inclusion: {
                    in: underscore.keys(Liability.frequencyTypes)
                }
            },
            type: {
                required: true,
                inclusion: {
                    in: underscore.keys(Liability.liabilityTypes)
                }
            },
            startDate: {
                required: true,
                format: {
                    date: true
                }
            },
            endDate: {
                requiredIf: isLeased,
                format: {
                    date: true
                }
            }
        });

        return Liability;
    }]);
