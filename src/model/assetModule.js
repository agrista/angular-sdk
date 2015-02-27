var sdkModelAsset = angular.module('ag.sdk.model.asset', ['ag.sdk.library', 'ag.sdk.model.base']);

sdkModelAsset.factory('Asset', ['$filter', 'computedProperty', 'inheritModel', 'Liability', 'Model', 'privateProperty', 'readOnlyProperty', 'underscore',
    function ($filter, computedProperty, inheritModel, Liability, Model, privateProperty, readOnlyProperty, underscore) {
        function Asset (attrs) {
            Model.Base.apply(this, arguments);

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.assetKey = attrs.assetKey;
            this.legalEntityId = attrs.legalEntityId;
            this.id = attrs.id;
            this.type = attrs.type;

            this.data = attrs.data || {};

            this.data.financing = Liability.new(this.data.financing);

            computedProperty(this, 'liability', function () {
                return this.data.financing;
            });

            computedProperty(this, 'title', function () {
                switch (this.type) {
                    case 'crop':
                    case 'permanent crop':
                    case 'plantation':
                        return (this.data.plantedArea ? $filter('number')(this.data.plantedArea, 2) + 'Ha' : '') +
                            (this.data.plantedArea && this.data.crop ? ' of ' : '') +
                            (this.data.crop ? this.data.crop : '') +
                            (this.data.fieldName ? ' on field ' + this.data.fieldName : '');
                    case 'farmland':
                        return (this.data.portionLabel ? this.data.portionLabel :
                            (this.data.portionNumber ? 'Portion ' + this.data.portionNumber : 'Remainder of farm'));
                    case 'cropland':
                        return (this.data.equipped ? 'Irrigated ' + this.type + ' (' + (this.data.irrigation ? this.data.irrigation + ' irrigation from ' : '')
                            + this.data.waterSource + ')' : (this.data.irrigated ? 'Irrigable, unequipped ' : 'Non irrigable ') + this.type)
                            + (this.data.fieldName ? ' on field ' + this.data.fieldName : '');
                    case 'livestock':
                        return this.data.type + (this.data.category ? ' - ' + this.data.category : '');
                    case 'pasture':
                        return (this.data.intensified ? (this.data.crop || 'Intensified pasture') : 'Natural grazing') +
                            (this.data.fieldName ? ' on field ' + this.data.fieldName : '');
                    case 'vme':
                        return this.data.category + (this.data.model ? ' model ' + this.data.model : '');
                    case 'wasteland':
                        return 'Wasteland';
                    case 'water source':
                    case 'water right':
                        return this.data.waterSource + (this.data.fieldName ? ' on field ' + this.data.fieldName : '');
                    default:
                        return this.data.name || this.assetTypes[this.type];
                }
            });

            computedProperty(this, 'description', function () {
                return this.data.description || '';
            });
        }

        inheritModel(Asset, Model.Base);

        readOnlyProperty(Asset, 'assetTypes', {
            'crop': 'Crops',
            'farmland': 'Farmlands',
            'improvement': 'Fixed Improvements',
            'cropland': 'Cropland',
            'livestock': 'Livestock',
            'pasture': 'Pastures',
            'permanent crop': 'Permanent Crops',
            'plantation': 'Plantations',
            'vme': 'Vehicles, Machinery & Equipment',
            'wasteland': 'Wasteland',
            'water right': 'Water Rights'
        });

        Asset.validates({
            assetKey: {
                required: true
            },
            type: {
                required: true,
                inclusion: {
                    in: underscore.keys(Asset.assetTypes)
                }
            },
            legalEntityId: {
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

            computedProperty(this, 'hasLiabilities', function () {
                return this.leased === true || this.financed === true;
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

            this.description = attrs.description;
            this.installment = attrs.installment;
            this.interestRate = attrs.interestRate;
            this.legalEntityId = attrs.legalEntityId;
            this.name = attrs.name;
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
            return instance.financed === true;
        }

        function isLeased (value, instance, field) {
            return instance.leased === true;
        }

        function isFinancedOrLeased (value, instance, field) {
            return instance.leased === true || instance.financed === true;
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
            legalEntityId: {
                requiredIf: isFinancedOrLeased,
                numeric: true
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
