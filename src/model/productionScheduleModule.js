var sdkModelProductionSchedule = angular.module('ag.sdk.model.production-schedule', ['ag.sdk.library', 'ag.sdk.utilities', 'ag.sdk.model']);

sdkModelProductionSchedule.factory('ProductionGroup', ['$filter', 'computedProperty', 'EnterpriseBudgetBase', 'inheritModel', 'moment', 'privateProperty', 'ProductionSchedule', 'underscore',
    function ($filter, computedProperty, EnterpriseBudgetBase, inheritModel, moment, privateProperty, ProductionSchedule, underscore) {
        function ProductionGroup (attrs) {
            EnterpriseBudgetBase.apply(this, arguments);

            this.data.details = this.data.details || {};

            this.productionSchedules = [];

            privateProperty(this, 'addProductionSchedule', function (productionSchedule) {
                if (underscore.isUndefined(this.startDate) || moment(productionSchedule.startDate).isBefore(this.startDate)) {
                    this.startDate = moment(productionSchedule.startDate).format('YYYY-MM-DD');
                }

                if (underscore.isUndefined(this.endDate) || moment(productionSchedule.endDate).isAfter(this.endDate)) {
                    this.endDate = moment(productionSchedule.endDate).format('YYYY-MM-DD');
                }

                this.productionSchedules.push(productionSchedule);

                this.data.details.size = roundValue(underscore.reduce(this.productionSchedules, function (total, schedule) {
                    return total + schedule.allocatedSize;
                }, 0), 2);

                this.recalculate();
            });

            privateProperty(this, 'adjustCategory', function (sectionCode, categoryCode, costStage, property) {
                return adjustCategory(this, sectionCode, categoryCode, costStage, property);
            });

            privateProperty(this, 'getCategoryOptions', function (sectionCode) {
                return underscore.chain(this.productionSchedules)
                    .map(function (productionSchedule) {
                        return productionSchedule.getCategoryOptions(sectionCode);
                    })
                    .reduce(function (categoryOptions, categoryGroup) {
                        return underscore.extend(categoryOptions || {}, categoryGroup);
                    }, {})
                    .value();
            });

            privateProperty(this, 'recalculate', function () {
                recalculateProductionGroup(this);
            });

            computedProperty(this, 'allocatedSize', function () {
                return roundValue(this.data.details.size || 0, 2);
            });

            computedProperty(this, 'numberOfMonths', function () {
                return moment(this.endDate).diff(this.startDate, 'months');
            });

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.endDate = attrs.endDate && moment(attrs.endDate).format('YYYY-MM-DD');
            this.startDate = attrs.startDate && moment(attrs.startDate).format('YYYY-MM-DD');


            underscore.each(attrs.productionSchedules, this.addProductionSchedule, this);
        }

        inheritModel(ProductionGroup, EnterpriseBudgetBase);

        var roundValue = $filter('round');

        function adjustCategory (instance, sectionCode, categoryCode, costStage, property) {
            var groupCategory = instance.getCategory(sectionCode, categoryCode, costStage),
                value = 0;

            if (groupCategory && !underscore.isUndefined(groupCategory[property])) {
                if (underscore.contains(['valuePerLSU', 'pricePerUnit', 'quantityPerLSU', 'quantityPerHa'], property)) {
                    value = roundValue(underscore.reduce(groupCategory.scheduleCategories, function (total, category) {
                        return total + category[property];
                    }, 0) / groupCategory.scheduleCategories.length, 2);
                } else if (underscore.contains(['value', 'quantity'], property)) {
                    value = roundValue(underscore.reduce(groupCategory.scheduleCategories, function (total, category) {
                        return total + category[property];
                    }, 0), 2);
                } else if (property === 'valuePerHa') {
                    value = roundValue(groupCategory.value / instance.allocatedSize, 2);
                }

                var offset = (100 / value) * groupCategory[property],
                    remainder = groupCategory[property];

                underscore.chain(instance.productionSchedules)
                    .reject(function (productionSchedule) {
                        return underscore.isUndefined(productionSchedule.getCategory(sectionCode, categoryCode, costStage));
                    })
                    .each(function (productionSchedule, index, list) {
                        var scheduleCategory = productionSchedule.getCategory(sectionCode, categoryCode, costStage);

                        if (underscore.isFinite(offset) && scheduleCategory[property] != 0) {
                            scheduleCategory[property] = (scheduleCategory[property] / 100) * offset;
                        } else if (index < list.length - 1) {
                            scheduleCategory[property] = groupCategory[property] / list.length;
                        } else {
                            scheduleCategory[property] = remainder;
                        }

                        remainder = roundValue(remainder - productionSchedule.adjustCategory(sectionCode, categoryCode, costStage, property), 2);
                    });
            }
        }

        function recalculateProductionGroup (instance) {
            instance.data.sections = [];

            angular.forEach(instance.productionSchedules, function (productionSchedule) {
                var startOffset = moment(productionSchedule.startDate).diff(instance.startDate, 'months');

                productionSchedule.recalculate();

                angular.forEach(productionSchedule.data.sections, function (section) {
                    if (productionSchedule.data.details.applyEstablishmentCosts || section.costStage === productionSchedule.defaultCostStage) {
                        angular.forEach(section.productCategoryGroups, function (group) {
                            angular.forEach(group.productCategories, function (category) {
                                var groupCategory = instance.addCategory(section.code, group.name, category.code, section.costStage);

                                groupCategory.per = category.per;
                                groupCategory.scheduleCategories = groupCategory.scheduleCategories || [];
                                groupCategory.scheduleCategories.push(underscore.extend({
                                    size: productionSchedule.allocatedSize
                                }, category));

                                groupCategory.quantity = roundValue(underscore.reduce(groupCategory.scheduleCategories, function (total, category) {
                                    return total + category.quantity;
                                }, 0), 2);

                                groupCategory.value = roundValue(underscore.reduce(groupCategory.scheduleCategories, function (total, category) {
                                    return total + category.value;
                                }, 0), 2);

                                if (productionSchedule.type == 'livestock') {
                                    groupCategory.quantityPerLSU = roundValue(underscore.reduce(groupCategory.scheduleCategories, function (total, category) {
                                        return total + category.quantityPerLSU;
                                    }, 0) / groupCategory.scheduleCategories.length, 2);

                                    groupCategory.valuePerLSU = roundValue(underscore.reduce(groupCategory.scheduleCategories, function (total, category) {
                                        return total + category.valuePerLSU;
                                    }, 0) / groupCategory.scheduleCategories.length, 2);
                                } else {
                                    groupCategory.quantityPerHa = roundValue(underscore.reduce(groupCategory.scheduleCategories, function (total, category) {
                                        return total + category.quantityPerHa;
                                    }, 0) / groupCategory.scheduleCategories.length, 2);
                                }

                                if (section.code === 'EXP') {
                                    groupCategory.valuePerHa = roundValue(groupCategory.value / instance.allocatedSize, 2);
                                }

                                groupCategory.pricePerUnit = roundValue(underscore.reduce(groupCategory.scheduleCategories, function (total, category) {
                                    return total + category.pricePerUnit;
                                }, 0) / groupCategory.scheduleCategories.length, 2);

                                groupCategory.valuePerMonth = underscore.reduce(category.valuePerMonth, function (valuePerMonth, value, index) {
                                    valuePerMonth[index + startOffset] += value;

                                    return valuePerMonth;
                                }, groupCategory.valuePerMonth || underscore.range(instance.numberOfMonths).map(function () {
                                    return 0;
                                }));

                                groupCategory.quantityPerMonth = underscore.reduce(category.quantityPerMonth, function (quantityPerMonth, value, index) {
                                    quantityPerMonth[index + startOffset] += value;

                                    return quantityPerMonth;
                                }, groupCategory.quantityPerMonth || underscore.range(instance.numberOfMonths).map(function () {
                                    return 0;
                                }));
                            });

                            // Group totals
                            var groupGroup = instance.getGroup(section.code, group.name, section.costStage);

                            if (groupGroup) {
                                groupGroup.total.value = underscore.reduce(groupGroup.productCategories, function (total, category) {
                                    return total + category.value;
                                }, 0);

                                groupGroup.total.valuePerMonth = underscore
                                    .chain(groupGroup.productCategories)
                                    .pluck('valuePerMonth')
                                    .reduce(function (totalPerMonth, valuePerMonth) {
                                        return (totalPerMonth ? underscore.map(valuePerMonth, function (value, index) {
                                            return totalPerMonth[index] + value;
                                        }) : angular.copy(valuePerMonth));
                                    })
                                    .value();

                                if (productionSchedule.type == 'livestock') {
                                    groupGroup.total.valuePerLSU = underscore.reduce(groupGroup.productCategories, function (total, category) {
                                        return total + category.valuePerLSU;
                                    }, 0);
                                }
                            }
                        });

                        // Section totals
                        var groupSection = instance.getSection(section.code, section.costStage);

                        if (groupSection) {
                            groupSection.total.value = underscore.reduce(groupSection.productCategoryGroups, function (total, group) {
                                return total + group.total.value;
                            }, 0);

                            groupSection.total.valuePerMonth = underscore
                                .chain(groupSection.productCategoryGroups)
                                .pluck('total')
                                .pluck('valuePerMonth')
                                .reduce(function (totalPerMonth, valuePerMonth) {
                                    return (totalPerMonth ? underscore.map(valuePerMonth, function (value, index) {
                                        return totalPerMonth[index] + value;
                                    }) : angular.copy(valuePerMonth));
                                })
                                .value();

                            if (productionSchedule.type == 'livestock') {
                                groupSection.total.valuePerLSU = underscore.reduce(groupSection.productCategoryGroups, function (total, group) {
                                    return total + group.total.valuePerLSU;
                                }, 0);
                            }

                            instance.data.details.grossProfit += (groupSection.code == 'INC' ?
                                (instance.data.details.grossProfit + groupSection.total.value) :
                                (instance.data.details.grossProfit - groupSection.total.value));
                        }
                    }
                });
            });

            instance.data.details.grossProfit = underscore.reduce(instance.data.sections, function (total, section) {
                return (section.code == 'INC' ? total + section.total.value : total - section.total.value);
            }, 0);
        }

        return ProductionGroup;
    }]);

sdkModelProductionSchedule.factory('ProductionSchedule', ['$filter', 'computedProperty', 'EnterpriseBudget', 'EnterpriseBudgetBase', 'inheritModel', 'moment', 'privateProperty', 'readOnlyProperty', 'underscore',
    function ($filter, computedProperty, EnterpriseBudget, EnterpriseBudgetBase, inheritModel, moment, privateProperty, readOnlyProperty, underscore) {
        function ProductionSchedule (attrs) {
            EnterpriseBudgetBase.apply(this, arguments);

            this.data.details = this.data.details || {};

            privateProperty(this, 'setDate', function (startDate) {
                startDate = moment(startDate);
                startDate.date(1);

                this.startDate = startDate.format('YYYY-MM-DD');

                var monthsPerCycle = 12 / Math.floor(12 / this.numberOfAllocatedMonths),
                    nearestAllocationMonth = (this.budget ? ((monthsPerCycle * Math.floor((startDate.month() - this.budget.cycleStart) / monthsPerCycle)) + this.budget.cycleStart) : startDate.month()),
                    allocationDate = moment([startDate.year()]).add(nearestAllocationMonth, 'M');

                this.startDate = allocationDate.format('YYYY-MM-DD');
                this.endDate = allocationDate.add(1, 'y').format('YYYY-MM-DD');

                if (this.asset) {
                    var assetAge = (this.asset.data.establishedDate ? moment(this.startDate).diff(this.asset.data.establishedDate, 'years') : 0);

                    if (assetAge != this.data.details.assetAge) {
                        this.data.details.assetAge = assetAge;

                        this.recalculate();
                    }
                }
            });

            privateProperty(this, 'setAsset', function (asset) {
                this.asset = underscore.omit(asset, ['liabilities', 'productionSchedules']);
                this.assetId = this.asset.id || this.asset.$id;
                this.type = (asset.type === 'cropland' ? 'crop' : (asset.type === 'permanent crop' ? 'horticulture' : 'livestock'));
                this.data.details.fieldName = this.asset.data.fieldName;
                this.data.details.assetAge = (this.asset.data.establishedDate ? moment(this.startDate).diff(this.asset.data.establishedDate, 'years') : 0);

                if (asset.data.crop) {
                    this.data.details.commodity = asset.data.crop;
                }

                if (this.type === 'livestock') {
                    this.data.details.pastureType = (this.asset.data.irrigated ? 'pasture' : 'grazing');

                    if (this.budget && this.budget.data.details.stockingDensity) {
                        this.setLivestockStockingDensity(this.budget.data.details.stockingDensity[this.data.details.pastureType]);
                    }
                }
                
                this.setSize(this.asset.data.size);
            });
            
            privateProperty(this, 'setBudget', function (budget) {
                this.budget = (budget instanceof EnterpriseBudget ? budget : EnterpriseBudget.newCopy(budget));
                this.budgetUuid = this.budget.uuid;
                this.type = this.budget.assetType;

                this.data.budget = this.budget;
                this.data.details = underscore.extend(this.data.details, {
                    applyEstablishmentCosts: false,
                    commodity: this.budget.commodityType,
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

                if (this.startDate) {
                    this.setDate(this.startDate);
                }
            });

            privateProperty(this, 'setLivestockStockingDensity', function (stockingDensity) {
                if (this.type == 'livestock' && this.data.details.stockingDensity != stockingDensity) {
                    this.data.details.stockingDensity = stockingDensity;

                    this.setSize(this.allocatedSize);
                }
            });

            privateProperty(this, 'setSize', function (size) {
                this.data.details.size = size;

                if (this.type == 'livestock') {
                    this.data.details.calculatedLSU = (this.data.details.stockingDensity ? this.allocatedSize / this.data.details.stockingDensity : 0);
                    this.data.details.multiplicationFactor = roundValue(this.data.details.calculatedLSU ? (this.data.details.stockingDensity ? this.allocatedSize / this.data.details.stockingDensity : 0) / this.data.details.calculatedLSU : 0, 2);

                    if (this.budget) {
                        this.data.details.herdSize = this.budget.data.details.herdSize * this.data.details.multiplicationFactor;
                        this.data.details.grossProfit = this.budget.data.details.grossProfit * this.data.details.multiplicationFactor;
                        this.data.details.grossProfitPerLSU = (this.data.details.calculatedLSU ? this.data.details.grossProfit / this.data.details.calculatedLSU : 0);
                    }
                } else if (this.budget) {
                    this.data.details.grossProfit = this.budget.data.details.grossProfit * this.data.details.size;
                }

                this.recalculate();
            });

            privateProperty(this, 'adjustCategory', function (sectionCode, categoryCode, costStage, property) {
                var scheduleCategory = this.getCategory(sectionCode, categoryCode, costStage),
                    budgetCategory = this.budget.getCategory(sectionCode, categoryCode, costStage);

                if (scheduleCategory && budgetCategory) {
                    if (property === 'value') {
                        budgetCategory.value = roundValue(scheduleCategory.value / (this.type == 'livestock' ? this.data.details.multiplicationFactor : this.allocatedSize), 2);

                        if (budgetCategory.unit === 'Total') {
                            budgetCategory.pricePerUnit = budgetCategory.value;
                            scheduleCategory.pricePerUnit = budgetCategory.value;
                        } else {
                            budgetCategory.quantity = roundValue(budgetCategory.value / budgetCategory.pricePerUnit, 2);
                            scheduleCategory.quantity = roundValue(scheduleCategory.value / scheduleCategory.pricePerUnit, 2);
                        }

                        scheduleCategory.value = roundValue(budgetCategory.value * (this.type == 'livestock' ? this.data.details.multiplicationFactor : this.allocatedSize), 2);
                    } else if (property === 'valuePerHa') {
                        budgetCategory.value = roundValue(scheduleCategory.valuePerHa, 2);

                        if (budgetCategory.unit === 'Total') {
                            budgetCategory.pricePerUnit = budgetCategory.value;
                            scheduleCategory.pricePerUnit = budgetCategory.value;
                        }

                        budgetCategory.quantity = roundValue(budgetCategory.value / budgetCategory.pricePerUnit, 2);
                        scheduleCategory.value = roundValue(budgetCategory.value * this.allocatedSize, 2);
                        scheduleCategory.valuePerHa = budgetCategory.value;
                        scheduleCategory.quantity = roundValue(scheduleCategory.value / scheduleCategory.pricePerUnit, 2);
                    } else if (property === 'valuePerLSU') {
                        budgetCategory.valuePerLSU = roundValue(scheduleCategory.valuePerLSU, 2);
                        budgetCategory.pricePerUnit = budgetCategory.valuePerLSU * this.budget.getConversionRate(budgetCategory.name);
                        budgetCategory.value = roundValue((budgetCategory.pricePerUnit || 0) * (budgetCategory.quantity || 0), 2);
                        scheduleCategory.value = roundValue(budgetCategory.value * this.data.details.multiplicationFactor, 2);
                        scheduleCategory.valuePerLSU = roundValue(budgetCategory.valuePerLSU * this.data.details.multiplicationFactor, 2);
                        scheduleCategory.quantity = roundValue(scheduleCategory.value / scheduleCategory.pricePerUnit, 2);
                    } else if (property === 'quantityPerHa') {
                        budgetCategory.quantity = roundValue(scheduleCategory.quantityPerHa, 2);
                        budgetCategory.value = roundValue((budgetCategory.pricePerUnit || 0) * (budgetCategory.quantity || 0), 2);
                        scheduleCategory.value = roundValue(budgetCategory.value * this.allocatedSize, 2);
                        scheduleCategory.quantity = roundValue(scheduleCategory.value / scheduleCategory.pricePerUnit, 2);
                        scheduleCategory.quantityPerHa = budgetCategory.quantity;
                    } else if (property === 'quantityPerLSU') {
                        budgetCategory.quantity = roundValue(scheduleCategory.quantityPerLSU, 2);
                        budgetCategory.value = roundValue((budgetCategory.pricePerUnit || 0) * (budgetCategory.quantity || 0), 2);
                        scheduleCategory.value = roundValue(budgetCategory.value * this.data.details.multiplicationFactor, 2);
                        scheduleCategory.quantity = roundValue(scheduleCategory.value / scheduleCategory.pricePerUnit, 2);
                        scheduleCategory.quantityPerLSU = budgetCategory.quantity;
                    } else if (property === 'quantity') {
                        budgetCategory.quantity = roundValue(scheduleCategory.quantity / (this.type == 'livestock' ? this.data.details.multiplicationFactor : this.allocatedSize), 2);
                        budgetCategory.value = roundValue((budgetCategory.pricePerUnit || 0) * (budgetCategory.quantity || 0), 2);
                        scheduleCategory.value = roundValue(budgetCategory.value * (this.type == 'livestock' ? this.data.details.multiplicationFactor : this.allocatedSize), 2);
                        scheduleCategory.quantity = roundValue(scheduleCategory.value / scheduleCategory.pricePerUnit, 2);
                    } else if (property === 'pricePerUnit') {
                        budgetCategory.pricePerUnit = roundValue(scheduleCategory.pricePerUnit, 2);
                        budgetCategory.value = roundValue((budgetCategory.pricePerUnit || 0) * (budgetCategory.quantity || 0), 2);
                        scheduleCategory.value = roundValue(budgetCategory.value * (this.type == 'livestock' ? this.data.details.multiplicationFactor : this.allocatedSize), 2);
                        scheduleCategory.pricePerUnit = budgetCategory.pricePerUnit;
                    } else if (property === 'stock') {
                        budgetCategory.stock = scheduleCategory.stock;
                    }

                    if(this.type == 'livestock') {
                        budgetCategory.valuePerLSU = roundValue((budgetCategory.pricePerUnit || 0) / this.budget.getConversionRate(budgetCategory.name), 2);
                    }

                    if (sectionCode === 'EXP') {
                        scheduleCategory.valuePerHa = budgetCategory.value;
                    }

                    this.$dirty = true;

                    return scheduleCategory[property];
                }
            });

            privateProperty(this, 'recalculate', function () {
                recalculateProductionSchedule(this);
            });

            computedProperty(this, 'scheduleKey', function () {
                return (this.budgetUuid ? this.budgetUuid + '-' : '') +
                    (this.data.details.fieldName ? this.data.details.fieldName + '-' : '') +
                    (this.startDate ? moment(this.startDate).unix() + '-' : '') +
                    (this.endDate ? moment(this.endDate).unix() : '');
            }, {
                enumerable: true
            });

            computedProperty(this, 'assetType', function () {
                return (this.budget ? this.budget.assetType : this.type);
            });

            computedProperty(this, 'commodityType', function () {
                return (this.budget ? this.budget.commodityType : this.data.details.commodity);
            });
            
            computedProperty(this, 'allocatedSize', function () {
                return roundValue(this.data.details.size || 0, 2);
            });

            computedProperty(this, 'title', function () {
                return this.allocatedSize + 'ha ' + (this.commodityType ? 'of ' + this.commodityType : '') + (this.startDate ? ' starting ' + moment(this.startDate).format('MMM YYYY') : '');
            });

            computedProperty(this, 'numberOfMonths', function () {
                return moment(this.endDate).diff(this.startDate, 'months');
            });

            privateProperty(this, 'getAllocationIndex', function (sectionCode, costStage) {
                return (this.budget ? this.budget.getAllocationIndex(sectionCode, costStage) : 0);
            });

            privateProperty(this, 'getLastAllocationIndex', function (sectionCode, costStage) {
                return (this.budget ? this.budget.getLastAllocationIndex(sectionCode, costStage) : this.numberOfMonths);
            });

            privateProperty(this, 'getAllocationMonth', function (sectionCode, costStage) {
                return moment(this.startDate).add(this.getAllocationIndex(sectionCode, costStage), 'M');
            });

            privateProperty(this, 'getLastAllocationMonth', function (sectionCode, costStage) {
                return moment(this.startDate).add(this.getLastAllocationIndex(sectionCode, costStage), 'M');
            });

            computedProperty(this, 'numberOfAllocatedMonths', function () {
                return (this.budget ? this.budget.numberOfAllocatedMonths : this.numberOfMonths);
            });

            computedProperty(this, 'income', function () {
                return underscore.findWhere(this.data.sections, {code: 'INC', costStage: this.defaultCostStage});
            });

            computedProperty(this, 'expenses', function () {
                return underscore.findWhere(this.data.sections, {code: 'EXP', costStage: this.defaultCostStage});
            });

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.assetId = attrs.assetId;
            this.budgetUuid = attrs.budgetUuid;
            this.type = attrs.type;
            this.endDate = attrs.endDate && moment(attrs.endDate).format('YYYY-MM-DD');
            this.id = attrs.id || attrs.$id;
            this.organizationId = attrs.organizationId;
            this.startDate = attrs.startDate && moment(attrs.startDate).format('YYYY-MM-DD');

            this.organization = attrs.organization;

            if (attrs.asset) {
                this.setAsset(attrs.asset);
            }

            if (this.data.budget || attrs.budget) {
                this.setBudget(this.data.budget || attrs.budget);
            }
        }

        var roundValue = $filter('round');

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
                                    scheduleCategory.value += roundValue(category.value * instance.data.details.multiplicationFactor, 2);
                                    scheduleCategory.valuePerLSU += roundValue(category.valuePerLSU * instance.data.details.multiplicationFactor, 2);
                                    scheduleCategory.quantity += roundValue(scheduleCategory.value / category.pricePerUnit, 2);
                                    scheduleCategory.quantityPerLSU = category.quantity;

                                    if (group.code === 'INC-LSS') {
                                        scheduleCategory.stock = category.stock || (category.name == instance.getRepresentativeAnimal() ? instance.data.details.herdSize : 0);
                                    }
                                } else {
                                    scheduleCategory.value += roundValue(category.value * instance.allocatedSize, 2);
                                    scheduleCategory.quantity += roundValue(scheduleCategory.value / category.pricePerUnit, 2);
                                    scheduleCategory.quantityPerHa = category.quantity;
                                }

                                if (section.code === 'EXP') {
                                    scheduleCategory.valuePerHa = category.value;
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
                                        }) : angular.copy(valuePerMonth));
                                    })
                                    .value();

                                scheduleGroup.total.quantityPerMonth = underscore
                                    .chain(scheduleGroup.productCategories)
                                    .pluck('quantityPerMonth')
                                    .reduce(function (total, quantityPerMonth) {
                                        return (total ? underscore.map(quantityPerMonth, function (value, index) {
                                            return total[index] + value;
                                        }) : angular.copy(quantityPerMonth));
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
                                    }) : angular.copy(valuePerMonth));
                                })
                                .value();

                            scheduleSection.total.quantityPerMonth = underscore
                                .chain(scheduleSection.productCategoryGroups)
                                .pluck('total')
                                .pluck('quantityPerMonth')
                                .reduce(function (total, quantityPerMonth) {
                                    return (total ? underscore.map(quantityPerMonth, function (value, index) {
                                        return total[index] + value;
                                    }) : angular.copy(quantityPerMonth));
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
