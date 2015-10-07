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
        var _typesWithAmount = ['short-loan', 'medium-loan', 'long-loan'];

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
                repayment: 0,
                withdrawal: 0,
                balance: 0,
                interest: 0,
                closing: 0
            }
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
            var startMonth = moment(instance.startDate).month(),
                paymentMonths = instance.paymentMonths,
                paymentsPerMonth = (_frequency[instance.frequency] > 12 ? _frequency[instance.frequency] / 12 : 1);

            underscore.each(monthlyData, function (month, index) {
                var currentMonth = (index + startMonth) % 12;

                month.opening = (index === 0 ? instance.openingBalance : monthlyData[index - 1].closing);

                if ((this.frequency === 'once' && index === 0) || (instance.installmentPayment > 0 && underscore.contains(paymentMonths, currentMonth))) {
                    var installmentPayment = (this.frequency === 'once' ? month.opening : instance.installmentPayment * paymentsPerMonth);

                    month.repayment = (month.opening <= installmentPayment ? month.opening : installmentPayment);
                }

                month.balance = (month.opening - month.repayment + month.withdrawal <= 0 ? 0 : month.opening - month.repayment + month.withdrawal);
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


            /**
             * Get liability/balance in month
             */
            privateProperty(this, 'liabilityInMonth', function (month) {
                var startMonth = moment(this.startDate),
                    currentMonth = moment(month),
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

            privateProperty(this, 'addRepaymentInMonth', function (repayment, month) {
                var startMonth = moment(this.startDate),
                    currentMonth = moment(month),
                    appliedMonth = currentMonth.diff(startMonth, 'months');

                this.data.monthly = this.data.monthly || [];
                initializeMonthlyTotals(this, this.data.monthly, appliedMonth);

                var monthLiability = this.data.monthly[appliedMonth],
                    summedRepayment = repayment + monthLiability.repayment,
                    openingPlusWithdrawal = monthLiability.opening + monthLiability.withdrawal,
                    limitedRepayment = (openingPlusWithdrawal <= summedRepayment ? openingPlusWithdrawal : summedRepayment),
                    repaymentRemainder = summedRepayment - limitedRepayment;

                monthLiability.repayment = limitedRepayment;

                recalculateMonthlyTotals(this, this.data.monthly);

                return repaymentRemainder;
            });

            privateProperty(this, 'setRepaymentInMonth', function (repayment, month) {
                var startMonth = moment(this.startDate),
                    currentMonth = moment(month),
                    appliedMonth = currentMonth.diff(startMonth, 'months');

                this.data.monthly = this.data.monthly || [];
                initializeMonthlyTotals(this, this.data.monthly, appliedMonth);

                var monthLiability = this.data.monthly[appliedMonth],
                    openingPlusWithdrawal = monthLiability.opening + monthLiability.withdrawal,
                    limitedRepayment = (openingPlusWithdrawal <= repayment ? openingPlusWithdrawal : repayment),
                    repaymentRemainder = repayment - limitedRepayment;

                monthLiability.repayment = limitedRepayment;

                recalculateMonthlyTotals(this, this.data.monthly);

                return repaymentRemainder;
            });

            privateProperty(this, 'addWithdrawalInMonth', function (withdrawal, month) {
                var startMonth = moment(this.startDate),
                    currentMonth = moment(month),
                    appliedMonth = currentMonth.diff(startMonth, 'months');

                this.data.monthly = this.data.monthly || [];
                initializeMonthlyTotals(this, this.data.monthly, appliedMonth);

                var monthLiability = this.data.monthly[appliedMonth],
                    summedWithdrawal = withdrawal + monthLiability.withdrawal,
                    openingMinusRepayment = monthLiability.opening - monthLiability.repayment,
                    limitedWithdrawal = (this.limit > 0 ? Math.min(Math.max(0, this.limit - openingMinusRepayment), summedWithdrawal) : summedWithdrawal),
                    withdrawalRemainder = summedWithdrawal - limitedWithdrawal;

                monthLiability.withdrawal = limitedWithdrawal;

                recalculateMonthlyTotals(this, this.data.monthly);

                return withdrawalRemainder;
            });

            privateProperty(this, 'setWithdrawalInMonth', function (withdrawal, month) {
                var startMonth = moment(this.startDate),
                    currentMonth = moment(month),
                    appliedMonth = currentMonth.diff(startMonth, 'months');

                this.data.monthly = this.data.monthly || [];
                initializeMonthlyTotals(this, this.data.monthly, appliedMonth);

                var monthLiability = this.data.monthly[appliedMonth],
                    openingMinusRepayment = monthLiability.opening - monthLiability.repayment,
                    limitedWithdrawal = (this.limit > 0 ? Math.min(Math.max(0, this.limit - openingMinusRepayment), withdrawal) : withdrawal),
                    withdrawalRemainder = fixPrecisionError(withdrawal - limitedWithdrawal);

                monthLiability.withdrawal = limitedWithdrawal;

                recalculateMonthlyTotals(this, this.data.monthly);

                return withdrawalRemainder;
            });

            /**
             * Ranges of liability
             */
            privateProperty(this, 'liabilityInRange', function (rangeStart, rangeEnd) {
                var startMonth = moment(this.startDate),
                    rangeStartMonth = moment(rangeStart),
                    rangeEndMonth = moment(rangeEnd),
                    appliedStartMonth = rangeStartMonth.diff(startMonth, 'months'),
                    appliedEndMonth = rangeEndMonth.diff(startMonth, 'months'),
                    paddedOffset = (appliedStartMonth < 0 ? 0 - appliedStartMonth : 0);

                var monthlyData = angular.copy(this.data.monthly || []);
                initializeMonthlyTotals(this, monthlyData, appliedEndMonth);

                return underscore.range(paddedOffset)
                    .map(defaultMonth)
                    .concat(monthlyData.slice(appliedStartMonth - appliedStartMonth, appliedEndMonth - appliedStartMonth - paddedOffset));
            });

            privateProperty(this, 'totalLiabilityInRange', function (rangeStart, rangeEnd) {
                return underscore.reduce(this.liabilityInRange(rangeStart, rangeEnd), function (total, liability) {
                    return total - liability.repayment;
                }, 0);
            });

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.id = attrs.id || attrs.$id;
            this.uuid = attrs.uuid;
            this.merchantUuid = attrs.merchantUuid;
            this.legalEntityId = attrs.legalEntityId;
            this.name = attrs.name;
            this.type = attrs.type;
            this.openingBalance = attrs.openingBalance || 0;
            this.installmentPayment = attrs.installmentPayment;
            this.interestRate = attrs.interestRate || 0;
            this.limit = attrs.limit;
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
            legalEntityId: {
                required: true,
                numeric: true
            },
            limit: {
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
