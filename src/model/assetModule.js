var sdkModelAsset = angular.module('ag.sdk.model.asset', ['ag.sdk.library', 'ag.sdk.model.base']);

sdkModelAsset.factory('Asset', ['computedProperty', 'inheritModel', 'Liability', 'Model', 'privateProperty', 'readOnlyProperty', 'underscore',
    function (computedProperty, inheritModel, Liability, Model, privateProperty, readOnlyProperty, underscore) {
        function Asset (attrs) {
            Model.Base.apply(this, arguments);

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.id = attrs.id;
            this.type = attrs.type;
            this.organizationId = attrs.organizationId;

            this.data = attrs.data || {};

            this.data.financing = Liability.new(this.data.financing);

            computedProperty(this, 'liability', function () {
                return this.data.financing;
            });
        }

        inheritModel(Asset, Model.Base);

        readOnlyProperty(Asset, 'assetTypes', {
            'crop': 'Crop'
        });

        Asset.validates({
            type: {
                required: true,
                inclusion: {
                    in: underscore.keys(Asset.assetTypes)
                }
            },
            organizationId: {
                required: true,
                numeric: true
            },
            liability: {
                validates: {
                    validator: function (value) {
                        return value.validate();
                    },
                    message: 'Must be valid'
                }

            }
        });

        return Asset;
    }]);

sdkModelAsset.factory('Liability', ['computedProperty', 'inheritModel', 'Model', 'moment', 'privateProperty', 'readOnlyProperty', 'underscore',
    function (computedProperty, inheritModel, Model, moment, privateProperty, readOnlyProperty, underscore) {
        var _frequency = {
            'Monthly': 12,
            'Bi-Monthly': 24,
            'Quarterly': 4,
            'Bi-Yearly': 2,
            'Yearly': 1
        };

        function Liability (attrs) {
            Model.Base.apply(this, arguments);

            computedProperty(this, 'currentBalance', function () {
                return (this.financing ? this.liabilityInMonth(moment().startOf('month')) : 0);
            });

            privateProperty(this, 'balanceInMonth', function (month) {
                var balance = this.openingBalance || 0;

                if (this.financed) {
                    var startMonth = moment(this.paymentStart),
                        paymentMonths = this.paymentMonths,
                        paymentsPerYear = _frequency[this.paymentFrequency],
                        paymentsPerMonth = (paymentsPerYear > 12 ? paymentsPerYear / 12 : 1),
                        numberOfMonths = moment(month).diff(startMonth, 'months') + 1;

                    for(var i = 0; i < numberOfMonths; i++) {
                        var month = moment(this.paymentStart).add(i, 'M');

                        if (underscore.contains(paymentMonths, month.month()) && month >= startMonth) {
                            for (var j = 0; j < paymentsPerMonth; j++) {
                                balance -= Math.min(balance, (this.installment || 0) - ((((this.interestRate || 0) / 100) / paymentsPerYear) * balance));
                            }
                        }
                    }
                }

                return balance;
            });

            computedProperty(this, 'paymentMonths', function () {
                var paymentsPerYear = _frequency[this.paymentFrequency],
                    firstPaymentMonth = moment(this.paymentStart).month();

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
                    startMonth = moment(this.paymentStart),
                    endMonth = moment(this.paymentEnd),
                    paymentsPerYear = _frequency[this.paymentFrequency],
                    paymentsPerMonth = (paymentsPerYear > 12 ? paymentsPerYear / 12 : 1),
                    previousBalance = this.balanceInMonth(previousMonth);

                var liability = 0;

                if (underscore.contains(this.paymentMonths, currentMonth.month()) && currentMonth >= startMonth && (this.paymentEnd === undefined || currentMonth <= endMonth)) {
                    for (var i = 0; i < paymentsPerMonth; i++) {
                        if (this.financed) {
                            liability += Math.min(previousBalance, this.installment);
                            previousBalance -= Math.min(previousBalance, (this.installment || 0) - ((((this.interestRate || 0) / 100) / paymentsPerYear) * previousBalance));
                        } else if (this.leased) {
                            liability += this.installment;
                        }
                    }
                }

                return liability;
            });

            privateProperty(this, 'liabilityInRange', function (rangeStart, rangeEnd) {
                var previousMonth = moment(rangeStart).subtract(1, 'M'),
                    startMonth = moment(this.paymentStart),
                    endMonth = moment(this.paymentEnd),
                    paymentMonths = this.paymentMonths,
                    paymentsPerYear = _frequency[this.paymentFrequency],
                    paymentsPerMonth = (paymentsPerYear > 12 ? paymentsPerYear / 12 : 1),
                    previousBalance = this.balanceInMonth(previousMonth),
                    numberOfMonths = moment(rangeEnd).diff(rangeStart, 'months') + 1;

                var liability = underscore.range(numberOfMonths).map(function () {
                    return 0;
                });

                for(var i = 0; i < numberOfMonths; i++) {
                    var month = moment(rangeStart).add(i, 'M');

                    if (underscore.contains(paymentMonths, month.month()) && month >= startMonth && (this.paymentEnd === undefined || month <= endMonth)) {
                        for (var j = 0; j < paymentsPerMonth; j++) {
                            if (this.financed) {
                                liability[i] += Math.min(previousBalance, this.installment);
                                previousBalance -= Math.min(previousBalance, (this.installment || 0) - ((((this.interestRate || 0) / 100) / paymentsPerYear) * previousBalance));

                            } else if (this.leased) {
                                liability[i] += this.installment;
                            }
                        }
                    }
                }

                return liability;
            });

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.leased = attrs.leased;
            this.financed = attrs.financed;

            this.installment = attrs.installment;
            this.interestRate = attrs.interestRate;
            this.openingBalance = attrs.openingBalance;
            this.organizationName = attrs.organizationName;
            this.paymentFrequency = attrs.paymentFrequency;
            this.paymentStart = attrs.paymentStart;
            this.paymentEnd = attrs.paymentEnd;
            this.rentalOwner = attrs.rentalOwner;
        }

        inheritModel(Liability, Model.Base);

        readOnlyProperty(Liability, 'paymentFrequencyTypes', [
            'Bi-Monthly',
            'Monthly',
            'Quarterly',
            'Bi-Yearly',
            'Yearly']);

        function isFinanced (value, instance, field) {
            return instance.financed;
        }

        function isLeased (value, instance, field) {
            return instance.leased;
        }

        function isFinancedOrLeased (value, instance, field) {
            return instance.leased || instance.financed;
        }

        Liability.validates({
            installment: {
                requiredIf: isFinancedOrLeased,
                numeric: true
            },
            interestRate: {
                requiredIf: isFinanced,
                numeric: true,
                range: {
                    from: 0,
                    to: 100
                }
            },
            openingBalance: {
                requiredIf: isFinanced,
                numeric: true
            },
            organizationName: {
                requiredIf: isFinanced,
                length: {
                    min: 1,
                    max: 255
                }
            },
            paymentFrequency: {
                requiredIf: isFinancedOrLeased,
                inclusion: {
                    in: Liability.paymentFrequencyTypes
                }
            },
            paymentStart: {
                requiredIf: isFinancedOrLeased,
                format: {
                    date: true
                }
            },
            paymentEnd: {
                format: {
                    date: true
                }
            },
            rentalOwner: {
                requiredIf: isLeased,
                length: {
                    min: 1,
                    max: 255
                }
            }
        });

        return Liability;
    }]);
