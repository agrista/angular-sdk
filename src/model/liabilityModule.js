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
            'short-term': 'Short Term',
            'medium-term': 'Medium Term',
            'long-term': 'Long Term',
            'production-credit': 'Production Credit',
            'rent': 'Rented'
        };

        var _typesWithInstallmentPayments = ['short-term', 'medium-term', 'long-term', 'rent'];
        var _typesWithAmount = ['short-term', 'medium-term', 'long-term'];

        var _subtypes = {
            'production-credit': {
                'off-taker': 'Off Taker',
                'input-supplier': 'Input Supplier',
                'input-financing': 'Input Financing'
            }
        };

        function defaultMonth () {
            return {
                opening: 0,
                repayment: {},
                withdrawal: 0,
                balance: 0,
                interest: 0,
                closing: 0
            }
        }

        function getOffsetDate(instance) {
            return moment(instance.startDate).isBefore(instance.openingDate) ? instance.openingDate : instance.startDate;
        }

        function fixPrecisionError (number, precision) {
            precision = precision || 10;

            return parseFloat((+(Math.round(+(number + 'e' + precision)) + 'e' + -precision)).toFixed(precision)) || 0;
        }

        function initializeMonthlyTotals (instance, monthlyData, upToIndex) {
            while (monthlyData.length <= upToIndex) {
                monthlyData.push(defaultMonth());
            }

            recalculateMonthlyTotals(instance, monthlyData);
        }

        function recalculateMonthlyTotals (instance, monthlyData) {
            var startMonth = moment(instance.startDate, 'YYYY-MM-DD').month(),
                paymentMonths = instance.paymentMonths,
                paymentsPerMonth = (_frequency[instance.frequency] > 12 ? _frequency[instance.frequency] / 12 : 1);

            underscore.each(monthlyData, function (month, index) {
                var currentMonth = (index + startMonth) % 12;

                if(moment(instance.startDate).isAfter(instance.openingDate)) {
                    month.opening = (index === 0 ? instance.amount : monthlyData[index - 1].closing);
                } else {
                    month.opening = (index === 0 ? instance.openingBalance : monthlyData[index - 1].closing);
                }


                if ((this.frequency === 'once' && index === 0) || (instance.installmentPayment > 0 && underscore.contains(paymentMonths, currentMonth))) {
                    var installmentPayment = (this.frequency === 'once' ? month.opening : instance.installmentPayment * paymentsPerMonth);

                    if (month.opening > 0) {
                        month.repayment.bank = (month.opening <= installmentPayment ? month.opening : installmentPayment);
                    }
                }

                var totalRepayment = underscore.reduce(month.repayment, function (total, amount, source) {
                    return total + (amount || 0);
                }, 0);

                month.balance = (month.opening - totalRepayment + month.withdrawal <= 0 ? 0 : month.opening - totalRepayment + month.withdrawal);
                month.interest = fixPrecisionError((instance.interestRate / 12) * month.balance) / 100;
                month.closing = (month.balance === 0 ? 0 : month.balance + month.interest);
            });
        }

        function Liability (attrs) {
            Model.Base.apply(this, arguments);

            this.data = (attrs && attrs.data) || {};

            computedProperty(this, 'title', function () {
                return (this.installmentPayment ? $filter('number')(this.installmentPayment, 0) + ' ' : '') +
                    (this.frequency ? Liability.getFrequencyTitle(this.frequency) + ' ' : '') +
                    (this.name ? this.name : Liability.getTypeTitle(this.type));
            });

            computedProperty(this, 'subtype', function () {
                return this.data.subtype;
            });

            computedProperty(this, 'paymentMonths', function () {
                var paymentsPerYear = _frequency[this.frequency],
                    firstPaymentMonth = moment(getOffsetDate(this), 'YYYY-MM-DD').month();

                return underscore
                    .range(firstPaymentMonth, firstPaymentMonth + 12, (paymentsPerYear < 12 ? 12 / paymentsPerYear : 1))
                    .map(function (value) {
                        return value % 12;
                    })
                    .sort(function (a, b) {
                        return a - b;
                    });
            });


            /**
             * Get liability/balance in month
             */
            privateProperty(this, 'liabilityInMonth', function (month) {
                var startMonth = moment(getOffsetDate(this), 'YYYY-MM-DD'),
                    currentMonth = moment(month, 'YYYY-MM-DD'),
                    appliedMonth = currentMonth.diff(startMonth, 'months');

                var monthlyData = angular.copy(this.data.monthly || []);
                initializeMonthlyTotals(this, monthlyData, appliedMonth);

                return monthlyData[appliedMonth] || defaultMonth();
            });

            privateProperty(this, 'balanceInMonth', function (month) {
                return this.liabilityInMonth(month).closing || 0;
            });

            computedProperty(this, 'currentBalance', function () {
                return (this.type !== 'rent' ? this.balanceInMonth(moment().startOf('month')) : 0);
            });

            /**
             * Set/add repayment/withdrawal in month
             */
            privateProperty(this, 'resetWithdrawalAndRepayments', function () {
                this.data.monthly = [];
            });

            privateProperty(this, 'addRepaymentInMonth', function (repayment, month, source) {
                var startMonth = moment(getOffsetDate(this), 'YYYY-MM-DD'),
                    currentMonth = moment(month, 'YYYY-MM-DD'),
                    appliedMonth = currentMonth.diff(startMonth, 'months');

                source = source || 'bank';

                var repaymentRemainder = repayment;

                // applied month is not before the offsetDate, add repayment and do calculation
                if(appliedMonth > -1) {

                    this.data.monthly = this.data.monthly || [];
                    initializeMonthlyTotals(this, this.data.monthly, appliedMonth);

                    var monthLiability = this.data.monthly[appliedMonth],
                        summedRepayment = underscore.reduce(monthLiability.repayment, function (total, amount) {
                            return total + (amount || 0);
                        }, 0),
                        openingPlusBalance = monthLiability.opening + monthLiability.withdrawal - summedRepayment,
                        limitedRepayment = (openingPlusBalance <= repayment ? openingPlusBalance : repayment),
                        repaymentRemainder = repayment - limitedRepayment;

                    monthLiability.repayment[source] = monthLiability.repayment[source] || 0;
                    monthLiability.repayment[source] += limitedRepayment;

                    recalculateMonthlyTotals(this, this.data.monthly);
                }
                // applied month is before the offsetDate, do nothing

                return repaymentRemainder;
            });

            privateProperty(this, 'setRepaymentInMonth', function (repayment, month, source) {
                var startMonth = moment(getOffsetDate(this), 'YYYY-MM-DD'),
                    currentMonth = moment(month, 'YYYY-MM-DD'),
                    appliedMonth = currentMonth.diff(startMonth, 'months');

                source = source || 'bank';

                var repaymentRemainder = repayment;

                // applied month is not before the offsetDate, add repayment and do calculation
                if(appliedMonth > -1) {
                    this.data.monthly = this.data.monthly || [];
                    initializeMonthlyTotals(this, this.data.monthly, appliedMonth);

                    var monthLiability = this.data.monthly[appliedMonth],
                        repaymentWithoutSource = underscore.reduce(monthLiability.repayment, function (total, amount, src) {
                            return total + (src === source ? 0 : amount || 0)
                        }, 0),
                        openingPlusBalance = monthLiability.opening + monthLiability.withdrawal - repaymentWithoutSource,
                        limitedRepayment = (openingPlusBalance <= repayment ? openingPlusBalance : repayment),
                        repaymentRemainder = repayment - limitedRepayment;

                    monthLiability.repayment[source] = limitedRepayment;

                    recalculateMonthlyTotals(this, this.data.monthly);
                }
                // applied month is before the offsetDate, do nothing

                return repaymentRemainder;
            });

            privateProperty(this, 'addWithdrawalInMonth', function (withdrawal, month) {
                var startMonth = moment(getOffsetDate(this), 'YYYY-MM-DD'),
                    currentMonth = moment(month, 'YYYY-MM-DD'),
                    appliedMonth = currentMonth.diff(startMonth, 'months');

                // applied month is not before the offsetDate, add withdrawal and do calculation
                if(appliedMonth > -1) {
                    this.data.monthly = this.data.monthly || [];
                    initializeMonthlyTotals(this, this.data.monthly, appliedMonth);

                    var monthLiability = this.data.monthly[appliedMonth],
                        summedWithdrawal = withdrawal + monthLiability.withdrawal,
                        openingMinusRepayment = monthLiability.opening - underscore.reduce(monthLiability.repayment, function (total, amount) {
                                return total + (amount || 0);
                            }, 0),
                        limitedWithdrawal = (this.creditLimit > 0 ? Math.min(Math.max(0, this.creditLimit - openingMinusRepayment), summedWithdrawal) : summedWithdrawal),
                        withdrawalRemainder = summedWithdrawal - limitedWithdrawal;

                    monthLiability.withdrawal = limitedWithdrawal;

                    recalculateMonthlyTotals(this, this.data.monthly);
                }
                // applied month is before the offsetDate, do nothing

                return withdrawalRemainder;
            });

            privateProperty(this, 'setWithdrawalInMonth', function (withdrawal, month) {
                var startMonth = moment(getOffsetDate(this), 'YYYY-MM-DD'),
                    currentMonth = moment(month, 'YYYY-MM-DD'),
                    appliedMonth = currentMonth.diff(startMonth, 'months');

                // applied month is not before the offsetDate, add withdrawal and do calculation
                if(appliedMonth > -1) {
                    this.data.monthly = this.data.monthly || [];
                    initializeMonthlyTotals(this, this.data.monthly, appliedMonth);

                    var monthLiability = this.data.monthly[appliedMonth],
                        openingMinusRepayment = monthLiability.opening - underscore.reduce(monthLiability.repayment, function (total, amount) {
                                return total + (amount || 0);
                            }, 0),
                        limitedWithdrawal = (this.creditLimit > 0 ? Math.min(Math.max(0, this.creditLimit - openingMinusRepayment), withdrawal) : withdrawal),
                        withdrawalRemainder = fixPrecisionError(withdrawal - limitedWithdrawal);

                    monthLiability.withdrawal = limitedWithdrawal;

                    recalculateMonthlyTotals(this, this.data.monthly);
                }
                // applied month is before the offsetDate, do nothing

                return withdrawalRemainder;
            });

            /**
             * Ranges of liability
             */
            privateProperty(this, 'liabilityInRange', function (rangeStart, rangeEnd) {
                var startMonth = moment(getOffsetDate(this), 'YYYY-MM-DD'),
                    rangeStartMonth = moment(rangeStart, 'YYYY-MM-DD'),
                    rangeEndMonth = moment(rangeEnd, 'YYYY-MM-DD'),
                    appliedStartMonth = rangeStartMonth.diff(startMonth, 'months'),
                    appliedEndMonth = rangeEndMonth.diff(startMonth, 'months'),
                    paddedOffset = (appliedStartMonth < 0 ? 0 - appliedStartMonth : 0);

                var monthlyData = angular.copy(this.data.monthly || []);
                initializeMonthlyTotals(this, monthlyData, appliedEndMonth);

                return underscore.range(paddedOffset)
                    .map(defaultMonth)
                    .concat(monthlyData.slice(appliedStartMonth + paddedOffset, appliedEndMonth));
            });

            privateProperty(this, 'totalLiabilityInRange', function (rangeStart, rangeEnd) {
                return underscore.reduce(this.liabilityInRange(rangeStart, rangeEnd), function (total, liability) {
                    return total + (typeof liability.repayment == 'number' ? liability.repayment : underscore.reduce(liability.repayment, function (subtotal, value) {
                        return subtotal + (value || 0);
                    }, 0));
                }, 0);
            });

            privateProperty(this, 'getLiabilityOpening', function () {
                var opening = 0;
                var instance = angular.copy(this);
                if(moment(instance.startDate).isBefore(instance.openingDate)) {
                    opening = instance.openingBalance;
                } else {
                    opening = instance.amount;
                }
                return opening;
            });

            privateProperty(this, 'getOffsetDate', function () {
                return getOffsetDate(this);
            });

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.id = attrs.id || attrs.$id;
            this.uuid = attrs.uuid;
            this.merchantUuid = attrs.merchantUuid;
            this.name = attrs.name;
            this.type = attrs.type;
            this.openingBalance = attrs.openingBalance || 0;
            this.installmentPayment = attrs.installmentPayment;
            this.interestRate = attrs.interestRate || 0;
            this.creditLimit = attrs.creditLimit;
            this.frequency = attrs.frequency;
            this.startDate = attrs.startDate;
            this.endDate = attrs.endDate;
            this.openingDate = attrs.openingDate || this.startDate;
            this.amount = attrs.amount || this.openingBalance;

            // TODO: Add merchant model
            this.merchant = attrs.merchant;
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

        readOnlyProperty(Liability, 'frequencyTypesWithCustom', underscore.extend({
            'custom': 'Custom'
        }, Liability.frequencyTypes));

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

        function isLeased (value, instance, field) {
            return instance.type === 'rent';
        }

        function isOtherType (value, instance, field) {
            return instance.type === 'other';
        }

        function hasSubtype (value, instance, field) {
            return !!(_subtypes[instance.type] && underscore.keys(_subtypes[instance.type]).length > 0);
        }

        Liability.validates({
            amount: {
                required: false,
                numeric: true
            },
            openingBalance: {
                required: true,
                numeric: true
            },
            installmentPayment: {
                requiredIf: function (value, instance, field) {
                    return underscore.contains(_typesWithInstallmentPayments, instance.type) &&
                        (instance.type !== 'production-credit' && !angular.isNumber(instance.interestRate));
                },
                range: {
                    from: 0
                },
                numeric: true
            },
            interestRate: {
                required: true,
                range: {
                    from: 0,
                    to: 100
                },
                numeric: true
            },
            creditLimit: {
                requiredIf: function (value, instance, field) {
                    return (instance.type === 'production-credit' && instance.data.subtype === 'input-financing') ||
                        (instance.type !== 'production-credit' && !angular.isNumber(instance.installmentPayment));
                },
                range: {
                    from: 0
                },
                numeric: true
            },
            merchantUuid: {
                requiredIf: function (value, instance, field) {
                    return !isOtherType(value, instance, field);
                },
                format: {
                    uuid: true
                }
            },
            frequency: {
                required: true,
                inclusion: {
                    in: underscore.keys(Liability.frequencyTypesWithCustom)
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
            openingDate: {
                required: false,
                format: {
                    date: true
                }
            },
            endDate: {
                requiredIf: function (value, instance, field) {
                    return isLeased(value, instance, field) || instance.type === 'custom';
                },
                format: {
                    date: true
                }
            }
        });

        return Liability;
    }]);
