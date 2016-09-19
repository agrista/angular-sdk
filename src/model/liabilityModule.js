var sdkModelLiability = angular.module('ag.sdk.model.liability', ['ag.sdk.library', 'ag.sdk.utilities', 'ag.sdk.model.base']);

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
            'short-term': 'Short-term',
            'medium-term': 'Medium-term',
            'long-term': 'Long-term',
            'production-credit': 'Production Credit',
            'rent': 'Rent'
        };

        var _typesWithInstallmentPayments = ['short-term', 'medium-term', 'long-term', 'rent'];
        var _typesWithAmount = ['short-term', 'medium-term', 'long-term'];

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
        
        var roundValue = $filter('round');

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

                month.opening = (index === 0 ? instance.getLiabilityOpening() : monthlyData[index - 1].closing);

                if ((this.frequency === 'once' && index === 0) || (instance.installmentPayment > 0 && underscore.contains(paymentMonths, currentMonth))) {
                    var installmentPayment = (this.frequency === 'once' ? month.opening : instance.installmentPayment * paymentsPerMonth);

                    if (month.opening > 0) {
                        month.repayment.bank = (month.opening <= installmentPayment ? month.opening : installmentPayment);
                    }
                }

                var totalRepayment = underscore.reduce(month.repayment, function (total, amount, source) {
                    return total + (amount || 0);
                }, 0);

                month.balance = roundValue(month.opening - totalRepayment + month.withdrawal <= 0 ? 0 : month.opening - totalRepayment + month.withdrawal);
                month.interest = roundValue(((instance.interestRate / 12) * month.balance) / 100);
                month.closing = roundValue(month.balance === 0 ? 0 : month.balance + month.interest);
            });
        }

        function Liability (attrs) {
            Model.Base.apply(this, arguments);

            this.data = (attrs && attrs.data) || {};

            computedProperty(this, 'title', function () {
                return this.name || this.category;
            });

            computedProperty(this, 'paymentMonths', function () {
                var paymentsPerYear = _frequency[this.frequency],
                    firstPaymentMonth = moment(this.offsetDate, 'YYYY-MM-DD').month();

                return underscore
                    .range(firstPaymentMonth, firstPaymentMonth + 12, (paymentsPerYear < 12 ? 12 / paymentsPerYear : 1))
                    .map(function (value) {
                        return value % 12;
                    })
                    .sort(function (a, b) {
                        return a - b;
                    });
            });

            computedProperty(this, 'offsetDate', function () {
                return (this.startDate && this.openingDate ?
                    (moment(this.startDate).isBefore(this.openingDate) ? this.openingDate : this.startDate) :
                    (this.startDate ? this.startDate : this.openingDate));
            });

            /**
             * Get liability/balance in month
             */
            privateProperty(this, 'liabilityInMonth', function (month) {
                var startMonth = moment(this.offsetDate, 'YYYY-MM-DD'),
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

            privateProperty(this, 'recalculate', function () {
                this.data.monthly = this.data.monthly || [];

                recalculateMonthlyTotals(this, this.data.monthly);
            });

            /**
             * Set/add repayment/withdrawal in month
             */
            privateProperty(this, 'resetWithdrawalAndRepayments', function () {
                this.data.monthly = [];
            });

            privateProperty(this, 'resetRepayments', function () {
                underscore.each(this.data.monthly, function (month, index) {
                    month.repayment = {};
                });

                recalculateMonthlyTotals(this, this.data.monthly);
            });

            privateProperty(this, 'resetWithdrawalsInRange', function (rangeStart, rangeEnd) {
                var startMonth = moment(this.offsetDate, 'YYYY-MM-DD'),
                    appliedStartMonth = moment(rangeStart, 'YYYY-MM-DD').diff(startMonth, 'months'),
                    appliedEndMonth = moment(rangeEnd, 'YYYY-MM-DD').diff(startMonth, 'months');

                this.data.monthly = this.data.monthly || [];

                appliedStartMonth = (appliedStartMonth < 0 ? 0 : appliedStartMonth);
                appliedEndMonth = (appliedEndMonth > this.data.monthly.length ? this.data.monthly.length - 1 : appliedEndMonth);

                for (var i = appliedStartMonth; i < appliedEndMonth; i++) {
                    this.data.monthly[i].withdrawal = 0;
                }

                recalculateMonthlyTotals(this, this.data.monthly);
            });

            privateProperty(this, 'addRepaymentInMonth', function (repayment, month, source) {
                var startMonth = moment(this.offsetDate, 'YYYY-MM-DD'),
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
                        limitedRepayment = (openingPlusBalance <= repayment ? openingPlusBalance : repayment);

                    repaymentRemainder = roundValue(repayment - limitedRepayment);
                    monthLiability.repayment[source] = monthLiability.repayment[source] || 0;
                    monthLiability.repayment[source] += limitedRepayment;

                    recalculateMonthlyTotals(this, this.data.monthly);
                }
                // applied month is before the offsetDate, do nothing

                return repaymentRemainder;
            });

            privateProperty(this, 'setRepaymentInMonth', function (repayment, month, source) {
                var startMonth = moment(this.offsetDate, 'YYYY-MM-DD'),
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
                        limitedRepayment = (openingPlusBalance <= repayment ? openingPlusBalance : repayment);

                    repaymentRemainder = roundValue(repayment - limitedRepayment)
                    monthLiability.repayment[source] = limitedRepayment;

                    recalculateMonthlyTotals(this, this.data.monthly);
                }
                // applied month is before the offsetDate, do nothing

                return repaymentRemainder;
            });

            privateProperty(this, 'addWithdrawalInMonth', function (withdrawal, month) {
                var startMonth = moment(this.offsetDate, 'YYYY-MM-DD'),
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
                        withdrawalRemainder = roundValue(summedWithdrawal - limitedWithdrawal);

                    monthLiability.withdrawal = limitedWithdrawal;

                    recalculateMonthlyTotals(this, this.data.monthly);
                }
                // applied month is before the offsetDate, do nothing

                return withdrawalRemainder;
            });

            privateProperty(this, 'setWithdrawalInMonth', function (withdrawal, month) {
                var startMonth = moment(this.offsetDate, 'YYYY-MM-DD'),
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
                        withdrawalRemainder = roundValue(withdrawal - limitedWithdrawal);

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
                var startMonth = moment(this.offsetDate, 'YYYY-MM-DD'),
                    rangeStartMonth = moment(rangeStart, 'YYYY-MM-DD'),
                    rangeEndMonth = moment(rangeEnd, 'YYYY-MM-DD'),
                    appliedStartMonth = rangeStartMonth.diff(startMonth, 'months'),
                    appliedEndMonth = rangeEndMonth.diff(startMonth, 'months'),
                    paddedOffset = (appliedStartMonth < 0 ? Math.min(rangeEndMonth.diff(rangeStartMonth, 'months'), Math.abs(appliedStartMonth)) : 0);

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
                return (moment(this.startDate).isBefore(this.openingDate) && !underscore.isUndefined(this.openingBalance) ? this.openingBalance : this.amount);
            });

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.id = attrs.id || attrs.$id;
            this.uuid = attrs.uuid;
            this.merchantUuid = attrs.merchantUuid;
            this.name = attrs.name;
            this.type = attrs.type;
            this.category = attrs.category;
            this.openingBalance = attrs.openingBalance || 0;
            this.installmentPayment = attrs.installmentPayment;
            this.interestRate = attrs.interestRate || 0;
            this.creditLimit = attrs.creditLimit;
            this.frequency = attrs.frequency;
            this.startDate = attrs.startDate && moment(attrs.startDate).format('YYYY-MM-DD');
            this.endDate = attrs.endDate && moment(attrs.endDate).format('YYYY-MM-DD');
            this.openingDate = attrs.openingDate && moment(attrs.openingDate).format('YYYY-MM-DD') || this.startDate;
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

        privateProperty(Liability, 'getFrequencyTitle', function (type) {
            return Liability.frequencyTypesWithCustom[type] || '';
        });

        readOnlyProperty(Liability, 'liabilityTypes', _types);

        readOnlyProperty(Liability, 'liabilityTypesWithOther', underscore.extend({
            'other': 'Other'
        }, Liability.liabilityTypes));

        privateProperty(Liability, 'getTypeTitle', function (type) {
            return Liability.liabilityTypesWithOther[type] || '';
        });

        readOnlyProperty(Liability, 'liabilityCategories', {
            'long-term': ['Bonds', 'Loans', 'Other'],
            'medium-term': ['Terms Loans', 'Instalment Sale Credit', 'Leases', 'Other'],
            'short-term': ['Bank', 'Co-operative', 'Creditors', 'Income Tax', 'Bills Payable', 'Portion of Term Commitments', 'Other'],
            'production-credit': ['Off Taker', 'Input Supplier', 'Input Financing']
        });

        function isLeased (value, instance, field) {
            return instance.type === 'rent';
        }

        function isOtherType (value, instance, field) {
            return instance.type === 'other';
        }

        function hasCategory (value, instance, field) {
            return !underscore.isEmpty(Liability.liabilityCategories[instance.type]);
        }

        Liability.validates({
            amount: {
                requiredIf: function (value, instance, field) {
                    return !isLeased(value, instance, field);
                },
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
                    return (instance.type === 'production-credit' && instance.data.category === 'Input Financing') ||
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
            category: {
                requiredIf: hasCategory,
                inclusion: {
                    in: function (value, instance, field) {
                        return Liability.liabilityCategories[instance.type];
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
