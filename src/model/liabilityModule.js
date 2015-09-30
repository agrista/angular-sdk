var sdkModelLiability = angular.module('ag.sdk.model.liability', ['ag.sdk.library', 'ag.sdk.model.base']);

sdkModelLiability.factory('Liability', ['$filter', 'computedProperty', 'inheritModel', 'Model', 'moment', 'privateProperty', 'readOnlyProperty', 'underscore',
    function ($filter, computedProperty, inheritModel, Model, moment, privateProperty, readOnlyProperty, underscore) {
        var _frequency = {
            'monthly': 12,
            'bi-monthly': 24,
            'quarterly': 4,
            'bi-yearly': 2,
            'yearly': 1
        };

        var _types = {
            'short-loan': 'Short Term Loan',
            'medium-loan': 'Medium Term Loan',
            'long-loan': 'Long Term Loan',
            'production-credit': 'Production Credit',
            'rent': 'Rented'
        };

        var _typesWithInstallmentPayments = ['short-loan', 'medium-loan', 'long-loan', 'rent'];

        var _subtypes = {
            'production-credit': {
                'off-taker': 'Off Taker',
                'input-supplier': 'Input Supplier',
                'input-financing': 'Input Financing'
            }
        };

        function Liability (attrs) {
            Model.Base.apply(this, arguments);

            this.data = (attrs && attrs.data) || {};

            computedProperty(this, 'currentBalance', function () {
                return (this.type !== 'rent' ? this.liabilityInMonth(moment().startOf('month')) : 0);
            });

            privateProperty(this, 'balanceInMonth', function (month) {
                var balance = this.amount || 0;

                if (angular.isNumber(this.amount) && this.amount > 0) {
                    var startMonth = moment(this.startDate),
                        paymentMonths = this.paymentMonths,
                        paymentsPerMonth = (_frequency[this.frequency] > 12 ? _frequency[this.frequency] / 12 : 1),
                        numberOfMonths = moment(month).diff(startMonth, 'months') + 1;

                    for(var i = 0; i < numberOfMonths; i++) {
                        var month = moment(this.startDate).add(i, 'M');

                        if (this.frequency === 'once' && month.month() === startMonth.month() && month.year() === startMonth.year()) {
                            balance += this.amount;
                        } else if (month >= startMonth) {
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

            computedProperty(this, 'title', function () {
                return (this.installmentPayment ? $filter('number')(this.installmentPayment, 0) + ' ' : '') +
                    (this.frequency ? Liability.getFrequencyTitle(this.frequency) + ' ' : '') +
                    (this.name ? this.name : Liability.getTypeTitle(this.type));
            });

            computedProperty(this, 'subtype', function () {
                return this.data.subtype;
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

                if (this.frequency === 'once' && startMonth.month() === currentMonth.month() && startMonth.year() === currentMonth.year()) {
                    liability += this.amount;
                } else if (currentMonth >= startMonth && (this.endDate === undefined || currentMonth <= endMonth)) {
                    previousBalance += (((this.interestRate || 0) / 100) / 12) * previousBalance;

                    if (underscore.contains(this.paymentMonths, currentMonth.month())) {
                        for (var i = 0; i < paymentsPerMonth; i++) {

                            if (angular.isNumber(this.amount) && this.amount > 0) {
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
                    numberOfMonths = moment(rangeEnd).diff(rangeStart, 'months');

                var liability = underscore.range(numberOfMonths).map(function () {
                    return 0;
                });

                for(var i = 0; i < numberOfMonths; i++) {
                    var month = moment(rangeStart).add(i, 'M');

                    if (this.frequency === 'once' && month.month() === startMonth.month() && month.year() === startMonth.year()) {
                        liability[i] += this.amount;
                    } else if (month >= startMonth && (this.endDate === undefined || month <= endMonth)) {
                        previousBalance += (((this.interestRate || 0) / 100) / 12) * previousBalance;

                        if (underscore.contains(paymentMonths, month.month())) {
                            for (var j = 0; j < paymentsPerMonth; j++) {
                                if (angular.isNumber(this.amount) && this.amount > 0) {
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

            privateProperty(this, 'totalLiabilityInRange', function (rangeStart, rangeEnd) {
                return underscore.reduce(this.liabilityInRange(rangeStart, rangeEnd), function (total, liability) {
                    return total - liability;
                }, 0);
            });

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.id = attrs.id || attrs.$id;
            this.uuid = attrs.uuid;
            this.merchantUuid = attrs.merchantUuid;
            this.legalEntityId = attrs.legalEntityId;
            this.name = attrs.name;
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
            'once': 'One Time',
            'bi-monthly': 'Bi-Monthly',
            'monthly': 'Monthly',
            'quarterly': 'Quarterly',
            'bi-yearly': 'Bi-Yearly',
            'yearly': 'Yearly'
        });

        readOnlyProperty(Liability, 'liabilityTypes', _types);

        readOnlyProperty(Liability, 'liabilityTypesWithOther', underscore.extend({
            'other': 'Other'
        }, Liability.liabilityTypes));

        privateProperty(Liability, 'getFrequencyTitle', function (type) {
            return Liability.frequencyTypes[type] || '';
        });

        privateProperty(Liability, 'getTypeTitle', function (type) {
            return Liability.liabilityTypesWithOther[type] || '';
        });

        function isLoaned (value, instance, field) {
            return instance.type !== 'rent';
        }

        function isLeased (value, instance, field) {
            return instance.leased === 'rent';
        }

        function isOtherType (value, instance, field) {
            return instance.type === 'other';
        }

        function isNotOtherType (value, instance, field) {
            return instance.type !== 'other';
        }

        function hasSubtype (value, instance, field) {
            return !!(_subtypes[instance.type] && underscore.keys(_subtypes[instance.type]).length > 0);
        }

        Liability.validates({
            installmentPayment: {
                requiredIf: function (value, instance, field) {
                    return underscore.contains(_typesWithInstallmentPayments, instance.type) &&
                        (angular.isNumber(instance.amount) && instance.amount >= 0) === false ||
                        (instance.type !== 'production-credit' && angular.isNumber(instance.interestRate) && instance.interestRate >= 0);
                },
                range: {
                    from: 0
                },
                numeric: true
            },
            interestRate: {
                requiredIf: function (value, instance, field) {
                    return angular.isNumber(instance.installmentPayment) && instance.installmentPayment > 0;
                },
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
                requiredIf: function (value, instance, field) {
                    return (isLoaned(value, instance, field) && isNotOtherType(value, instance, field)) ||
                        (angular.isNumber(instance.installmentPayment) && instance.installmentPayment >= 0) === false;
                },
                range: {
                    from: 0
                },
                numeric: true
            },
            limit: {
                requiredIf: function (value, instance, field) {
                    return (instance.type === 'production-credit' && instance.data.subtype === 'input-financing');
                },
                range: {
                    from: 0
                },
                numeric: true
            },
            merchantUuid: {
                requiredIf: isNotOtherType,
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
                    in: underscore.keys(Liability.liabilityTypesWithOther)
                }
            },
            subtype: {
                requiredIf: hasSubtype,
                inclusion: {
                    in: function (value, instance, field) {
                        return _subtypes[instance.type] && underscore.keys(_subtypes[instance.type]) || [];
                    }
                }
            },
            data: {
                required: true,
                object: true
            },
            name: {
                requiredIf: isOtherType,
                length: {
                    min: 1,
                    max: 255
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
