var sdkModelProductionSchedule = angular.module('ag.sdk.model.production-schedule', ['ag.sdk.library', 'ag.sdk.model']);

sdkModelProductionSchedule.factory('ProductionSchedule', ['computedProperty', 'EnterpriseBudget', 'EnterpriseBudgetBase', 'enterpriseBudgetHelper', 'inheritModel', 'Model', 'moment', 'privateProperty', 'readOnlyProperty', 'underscore',
    function (computedProperty, EnterpriseBudget, EnterpriseBudgetBase, enterpriseBudgetHelper, inheritModel, Model, moment, privateProperty, readOnlyProperty, underscore) {
        function ProductionSchedule (attrs) {
            EnterpriseBudgetBase.apply(this, arguments);

            this.data = (attrs && attrs.data ? attrs.data : {});
            this.data.details = this.data.details || {};

            privateProperty(this, 'setDate', function (startDate) {
                startDate = moment(startDate);

                var startCycle = this.budget.data.details.cycleStart || startDate.month(),
                    allocationDate = moment([(startDate.month() < startCycle ? startDate.year() - 1 : startDate.year()), startCycle]);

                this.startDate = allocationDate.format();
                this.endDate = allocationDate.add(1, 'y').format();

                if (this.asset) {
                    this.data.details.assetAge = (this.asset.data.establishedDate ? moment(this.startDate).diff(this.asset.data.establishedDate, 'years') : 0);

                    this.recalculate();
                }
            });

            privateProperty(this, 'setAsset', function (asset) {
                this.asset = asset;
                this.assetId = this.asset.id || this.asset.$id;
                this.data.details.fieldName = this.asset.data.fieldName;
                this.data.details.assetAge = (this.asset.data.establishedDate ? moment(this.startDate).diff(this.asset.data.establishedDate, 'years') : 0);

                if (this.type === 'livestock') {
                    this.data.details.pastureType = (this.asset.data.irrigated ? 'pasture' : 'grazing');

                    if (this.budget && this.budget.data.details.stockingDensity) {
                        this.setLivestockStockingDensity(this.budget.data.details.stockingDensity[this.data.details.pastureType]);
                    }
                }
                
                this.setSize(this.asset.data.size);
            });
            
            privateProperty(this, 'setBudget', function (budget) {
                this.budget = EnterpriseBudget.new(budget);
                this.budgetUuid = this.budget.uuid;
                this.type = this.budget.assetType;

                this.data.budget = this.budget;
                this.data.details = underscore.extend(this.data.details, {
                    applyEstablishmentCosts: false,
                    grossProfit: 0
                });

                if (this.type === 'livestock') {
                    this.data.details = underscore.extend(this.data.details, {
                        calculatedLSU: 0,
                        grossProfitPerLSU: 0,
                        herdSize: this.budget.data.details.herdSize || 0,
                        stockingDensity: 0,
                        multiplicationFactor: 0
                    });
                }

                if (this.data.details.pastureType && this.budget.data.details.stockingDensity) {
                    this.setLivestockStockingDensity(this.budget.data.details.stockingDensity[this.data.details.pastureType]);
                }

                this.recalculate();
            });

            privateProperty(this, 'setLivestockStockingDensity', function (stockingDensity) {
                if (this.type == 'livestock') {
                    this.data.details.stockingDensity = stockingDensity;

                    this.setSize(this.allocatedSize);
                }
            });

            privateProperty(this, 'setSize', function (size) {
                this.data.details.size = size;

                if (this.type == 'livestock') {
                    this.data.details.calculatedLSU = (this.data.details.stockingDensity ? this.allocatedSize / this.data.details.stockingDensity : 0);
                    this.data.details.multiplicationFactor = (this.data.details.calculatedLSU ? (this.data.details.stockingDensity ? this.allocatedSize / this.data.details.stockingDensity : 0) / this.data.details.calculatedLSU : 0);
                    this.data.details.herdSize = this.budget.data.details.herdSize * this.data.details.multiplicationFactor;
                    this.data.details.grossProfit = this.budget.data.details.grossProfit * this.data.details.multiplicationFactor;
                    this.data.details.grossProfitPerLSU = (this.data.details.calculatedLSU ? this.data.details.grossProfit / this.data.details.calculatedLSU : 0);
                } else {
                    this.data.details.grossProfit = this.budget.data.details.grossProfit * this.data.details.size;
                }

                this.recalculate();
            });

            privateProperty(this, 'adjustCategory', function (sectionCode, categoryCode, costStage, property) {
                var scheduleCategory = this.getCategory(sectionCode, categoryCode, costStage),
                    budgetCategory = this.budget.getCategory(sectionCode, categoryCode, costStage);

                if (scheduleCategory && budgetCategory) {
                    if (property === 'value') {
                        if (this.type == 'livestock') {
                            budgetCategory.value = scheduleCategory.value / this.data.details.multiplicationFactor;

                            if (budgetCategory.unit === 'Total') {
                                scheduleCategory.pricePerUnit = scheduleCategory.value / this.data.details.multiplicationFactor;
                                budgetCategory.pricePerUnit = scheduleCategory.value / this.data.details.multiplicationFactor;
                            }
                        } else {
                            budgetCategory.value = scheduleCategory.value / this.allocatedSize;

                            if (budgetCategory.unit === 'Total') {
                                scheduleCategory.pricePerUnit = scheduleCategory.value / this.allocatedSize;
                                budgetCategory.pricePerUnit = scheduleCategory.value / this.allocatedSize;
                            }
                        }

                        scheduleCategory.quantity = scheduleCategory.value / scheduleCategory.pricePerUnit
                        budgetCategory.quantity = budgetCategory.value / budgetCategory.pricePerUnit;
                    }
                }
            });

            privateProperty(this, 'recalculate', function () {
                recalculateProductionSchedule(this);
            });

            computedProperty(this, 'assetType', function () {
                return this.budget.assetType;
            });

            computedProperty(this, 'commodityType', function () {
                return this.budget.commodityType;
            });
            
            computedProperty(this, 'allocatedSize', function () {
                return this.data.details.size || 0;
            });

            computedProperty(this, 'income', function () {
                return underscore.findWhere(this.data.sections, {code: 'INC'});
            });

            computedProperty(this, 'expenses', function () {
                return underscore.findWhere(this.data.sections, {code: 'EXP'});
            });

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.assetId = attrs.assetId;
            this.budgetUuid = attrs.budgetUuid;
            this.type = attrs.type;
            this.endDate = attrs.endDate;
            this.id = attrs.id || attrs.$id;
            this.organizationId = attrs.organizationId;
            this.startDate = attrs.startDate;

            this.organization = attrs.organization;

            if (attrs.asset) {
                this.setAsset(attrs.asset);
            }

            if (this.data.budget || attrs.budget) {
                this.setBudget(this.data.budget || attrs.budget);
            }
        }

        function fixPrecisionError (number, precision) {
            precision = precision || 10;

            return parseFloat((+(Math.round(+(number + 'e' + precision)) + 'e' + -precision)).toFixed(precision)) || 0;
        }

        function recalculateProductionSchedule (instance) {
            if (instance.budget) {
                instance.budget.recalculate();

                instance.data.sections = [];
                instance.data.details.grossProfit = 0;
                
                angular.forEach(instance.budget.data.sections, function (section) {
                    if (instance.data.details.applyEstablishmentCosts || section.costStage === instance.defaultCostStage) {
                        angular.forEach(section.productCategoryGroups, function (group) {
                            angular.forEach(group.productCategories, function (category) {
                                var scheduleCategory = instance.addCategory(section.code, group.name, category.code, section.costStage);

                                scheduleCategory.pricePerUnit = category.pricePerUnit;

                                if (instance.type == 'livestock') {
                                    scheduleCategory.valuePerLSU += fixPrecisionError(category.valuePerLSU * instance.data.details.multiplicationFactor, 2);
                                    scheduleCategory.quantity += fixPrecisionError(category.quantity * instance.data.details.multiplicationFactor, 2);
                                    scheduleCategory.value += fixPrecisionError(category.value * instance.data.details.multiplicationFactor, 2);
                                } else {
                                    scheduleCategory.quantity += fixPrecisionError(category.quantity * instance.allocatedSize, 2);
                                    scheduleCategory.value += fixPrecisionError(category.value * instance.allocatedSize, 2);
                                }

                                var shiftedSchedule = instance.budget.getShiftedSchedule(category.schedule);

                                scheduleCategory.valuePerMonth = underscore.map(shiftedSchedule, function (monthFactor, index) {
                                    return ((monthFactor / 100) * scheduleCategory.value) + (scheduleCategory.valuePerMonth ? scheduleCategory.valuePerMonth[index] : 0);
                                });

                                scheduleCategory.quantityPerMonth = underscore.map(shiftedSchedule, function (monthFactor, index) {
                                    return ((monthFactor / 100) * scheduleCategory.quantity) + (scheduleCategory.quantityPerMonth ? scheduleCategory.quantityPerMonth[index] : 0);
                                });
                            });

                            // Group totals
                            var scheduleGroup = instance.getGroup(section.code, group.name, section.costStage);

                            if (scheduleGroup) {
                                scheduleGroup.total.value = underscore.reduce(scheduleGroup.productCategories, function (total, category) {
                                    return total + category.value;
                                }, 0);

                                scheduleGroup.total.valuePerMonth = underscore
                                    .chain(scheduleGroup.productCategories)
                                    .pluck('valuePerMonth')
                                    .reduce(function (total, valuePerMonth) {
                                        return (total ? underscore.map(valuePerMonth, function (value, index) {
                                            return total[index] + value;
                                        }) : valuePerMonth);
                                    })
                                    .value();

                                scheduleGroup.total.quantityPerMonth = underscore
                                    .chain(scheduleGroup.productCategories)
                                    .pluck('quantityPerMonth')
                                    .reduce(function (total, quantityPerMonth) {
                                        return (total ? underscore.map(quantityPerMonth, function (value, index) {
                                            return total[index] + value;
                                        }) : quantityPerMonth);
                                    })
                                    .value();

                                if (instance.type == 'livestock') {
                                    scheduleGroup.total.valuePerLSU = underscore.reduce(scheduleGroup.productCategories, function (total, category) {
                                        return total + category.valuePerLSU;
                                    }, 0);
                                }
                            }
                        });

                        // Section totals
                        var scheduleSection = instance.getSection(section.code, section.costStage);

                        if (scheduleSection) {
                            scheduleSection.total.value = underscore.reduce(scheduleSection.productCategoryGroups, function (total, group) {
                                return total + group.total.value;
                            }, 0);

                            scheduleSection.total.valuePerMonth = underscore
                                .chain(scheduleSection.productCategoryGroups)
                                .pluck('total')
                                .pluck('valuePerMonth')
                                .reduce(function (total, valuePerMonth) {
                                    return (total ? underscore.map(valuePerMonth, function (value, index) {
                                        return total[index] + value;
                                    }) : valuePerMonth);
                                })
                                .value();

                            scheduleSection.total.quantityPerMonth = underscore
                                .chain(scheduleSection.productCategoryGroups)
                                .pluck('total')
                                .pluck('quantityPerMonth')
                                .reduce(function (total, quantityPerMonth) {
                                    return (total ? underscore.map(quantityPerMonth, function (value, index) {
                                        return total[index] + value;
                                    }) : quantityPerMonth);
                                })
                                .value();

                            if (instance.type == 'livestock') {
                                scheduleSection.total.valuePerLSU = underscore.reduce(scheduleSection.productCategoryGroups, function (total, group) {
                                    return total + group.total.valuePerLSU;
                                }, 0);
                            }

                            instance.data.details.grossProfit = (scheduleSection.code == 'INC' ?
                                (instance.data.details.grossProfit + scheduleSection.total.value) :
                                (instance.data.details.grossProfit - scheduleSection.total.value));
                        }
                    }
                });

                if (instance.type == 'livestock') {
                    instance.data.details.grossProfitPerLSU = (instance.data.details.calculatedLSU ? instance.data.details.grossProfit / instance.data.details.calculatedLSU : 0);
                }
            }
        }

        inheritModel(ProductionSchedule, EnterpriseBudgetBase);

        readOnlyProperty(ProductionSchedule, 'productionScheduleTypes', {
            crop: 'Crop',
            horticulture: 'Horticulture',
            livestock: 'Livestock'
        });

        readOnlyProperty(ProductionSchedule, 'allowedLandUse', ['Conservation', 'Cropland', 'Grazing', 'Horticulture (Perennial)', 'Irrigated Cropland', 'Planted Pastures']);

        readOnlyProperty(ProductionSchedule, 'allowedAssets', ['cropland', 'pasture', 'permanent crop']);

        privateProperty(ProductionSchedule, 'getTypeTitle', function (type) {
            return ProductionSchedule.productionScheduleTypes[type] || '';
        });

        ProductionSchedule.validates({
            assetId: {
                required: true,
                numeric: true
            },
            budget: {
                required: true,
                object: true
            },
            budgetUuid: {
                required: true,
                format: {
                    uuid: true
                }
            },
            data: {
                required: true,
                object: true
            },
            endDate: {
                required: true,
                format: {
                    date: true
                }
            },
            organizationId: {
                required: true,
                numeric: true
            },
            startDate: {
                required: true,
                format: {
                    date: true
                }
            }
        });

        return ProductionSchedule;
    }]);
