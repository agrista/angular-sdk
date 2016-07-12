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
            var productionCategory = instance.getCategory(sectionCode, categoryCode, costStage),
                value = 0;

            if (productionCategory && !underscore.isUndefined(productionCategory[property])) {
                if (underscore.contains(['valuePerLSU', 'pricePerUnit', 'quantityPerLSU', 'quantityPerHa'], property)) {
                    value = roundValue(underscore.reduce(productionCategory.categories, function (total, category) {
                        return total + category[property];
                    }, 0) / productionCategory.categories.length, 2);
                } else if (underscore.contains(['value', 'quantity'], property)) {
                    value = roundValue(underscore.reduce(productionCategory.categories, function (total, category) {
                        return total + category[property];
                    }, 0), 2);
                } else if (property === 'valuePerHa') {
                    value = roundValue(productionCategory.value / instance.allocatedSize, 2);
                }

                var offset = (100 / value) * productionCategory[property],
                    remainder = productionCategory[property];

                underscore.chain(instance.productionSchedules)
                    .reject(function (productionSchedule) {
                        return underscore.isUndefined(productionSchedule.getCategory(sectionCode, categoryCode, costStage));
                    })
                    .each(function (productionSchedule, index, list) {
                        var productionCategory = productionSchedule.getCategory(sectionCode, categoryCode, costStage);

                        if (underscore.isFinite(offset) && productionCategory[property] != 0) {
                            productionCategory[property] = (productionCategory[property] / 100) * offset;
                        } else if (index < list.length - 1) {
                            productionCategory[property] = productionCategory[property] / list.length;
                        } else {
                            productionCategory[property] = remainder;
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
                                var productionCategory = instance.addCategory(section.code, group.name, category.code, section.costStage);

                                productionCategory.per = category.per;
                                productionCategory.categories = productionCategory.categories || [];
                                productionCategory.categories.push(underscore.extend({
                                    offset: startOffset,
                                    size: productionSchedule.allocatedSize
                                }, category));

                                productionCategory.schedule = underscore.chain(productionCategory.categories)
                                    .map(function (category) {
                                        return underscore.range(category.offset)
                                            .map(function () {
                                                return 0;
                                            })
                                            .concat(category.schedule);
                                    })
                                    .reduce(function (reducedSchedule, schedule) {
                                        return underscore.reduce(schedule, function (schedule, value, index) {
                                            schedule[index] += (value / productionCategory.categories.length);

                                            return schedule;
                                        }, reducedSchedule);
                                    }, underscore.range(instance.numberOfMonths).map(function () {
                                        return 0;
                                    }))
                                    .map(function (value) {
                                        return roundValue(value, 2);
                                    })
                                    .value();

                                productionCategory.quantity = roundValue(underscore.reduce(productionCategory.categories, function (total, category) {
                                    return total + category.quantity;
                                }, 0), 2);

                                productionCategory.value = roundValue(underscore.reduce(productionCategory.categories, function (total, category) {
                                    return total + category.value;
                                }, 0), 2);

                                if (productionSchedule.type == 'livestock') {
                                    productionCategory.quantityPerLSU = roundValue(underscore.reduce(productionCategory.categories, function (total, category) {
                                        return total + category.quantityPerLSU;
                                    }, 0) / productionCategory.categories.length, 2);

                                    productionCategory.valuePerLSU = roundValue(underscore.reduce(productionCategory.categories, function (total, category) {
                                        return total + category.valuePerLSU;
                                    }, 0) / productionCategory.categories.length, 2);
                                } else {
                                    productionCategory.quantityPerHa = roundValue(underscore.reduce(productionCategory.categories, function (total, category) {
                                        return total + category.quantityPerHa;
                                    }, 0) / productionCategory.categories.length, 2);
                                }

                                if (section.code === 'EXP') {
                                    productionCategory.valuePerHa = roundValue(productionCategory.value / instance.allocatedSize, 2);
                                }

                                productionCategory.pricePerUnit = roundValue(underscore.reduce(productionCategory.categories, function (total, category) {
                                    return total + category.pricePerUnit;
                                }, 0) / productionCategory.categories.length, 2);

                                productionCategory.valuePerMonth = underscore.reduce(category.valuePerMonth, function (valuePerMonth, value, index) {
                                    valuePerMonth[index + startOffset] += value;

                                    return valuePerMonth;
                                }, productionCategory.valuePerMonth || underscore.range(instance.numberOfMonths).map(function () {
                                    return 0;
                                }));

                                productionCategory.quantityPerMonth = underscore.reduce(category.quantityPerMonth, function (quantityPerMonth, value, index) {
                                    quantityPerMonth[index + startOffset] += value;

                                    return quantityPerMonth;
                                }, productionCategory.quantityPerMonth || underscore.range(instance.numberOfMonths).map(function () {
                                    return 0;
                                }));
                            });

                            // Group totals
                            var productionGroup = instance.getGroup(section.code, group.name, section.costStage);

                            if (productionGroup) {
                                productionGroup.total.value = underscore.reduce(productionGroup.productCategories, function (total, category) {
                                    return total + category.value;
                                }, 0);

                                productionGroup.total.valuePerMonth = underscore
                                    .chain(productionGroup.productCategories)
                                    .pluck('valuePerMonth')
                                    .reduce(function (totalPerMonth, valuePerMonth) {
                                        return (totalPerMonth ? underscore.map(valuePerMonth, function (value, index) {
                                            return totalPerMonth[index] + value;
                                        }) : angular.copy(valuePerMonth));
                                    })
                                    .value();

                                if (productionSchedule.type == 'livestock') {
                                    productionGroup.total.valuePerLSU = underscore.reduce(productionGroup.productCategories, function (total, category) {
                                        return total + category.valuePerLSU;
                                    }, 0);
                                }
                            }
                        });

                        // Section totals
                        var productionSection = instance.getSection(section.code, section.costStage);

                        if (productionSection) {
                            productionSection.total.value = underscore.reduce(productionSection.productCategoryGroups, function (total, group) {
                                return total + group.total.value;
                            }, 0);

                            productionSection.total.valuePerMonth = underscore
                                .chain(productionSection.productCategoryGroups)
                                .pluck('total')
                                .pluck('valuePerMonth')
                                .reduce(function (totalPerMonth, valuePerMonth) {
                                    return (totalPerMonth ? underscore.map(valuePerMonth, function (value, index) {
                                        return totalPerMonth[index] + value;
                                    }) : angular.copy(valuePerMonth));
                                })
                                .value();

                            if (productionSchedule.type == 'livestock') {
                                productionSection.total.valuePerLSU = underscore.reduce(productionSection.productCategoryGroups, function (total, group) {
                                    return total + group.total.valuePerLSU;
                                }, 0);
                            }

                            instance.data.details.grossProfit += (productionSection.code == 'INC' ?
                                (instance.data.details.grossProfit + productionSection.total.value) :
                                (instance.data.details.grossProfit - productionSection.total.value));
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
                this.budget = EnterpriseBudget.new(budget);
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
                var productionCategory = this.getCategory(sectionCode, categoryCode, costStage),
                    budgetCategory = this.budget.getCategory(sectionCode, categoryCode, costStage);

                if (productionCategory && budgetCategory) {
                    if (property === 'value') {
                        budgetCategory.value = roundValue(productionCategory.value / (this.type == 'livestock' ? this.data.details.multiplicationFactor : this.allocatedSize), 2);

                        if (budgetCategory.unit === 'Total') {
                            budgetCategory.pricePerUnit = budgetCategory.value;
                            productionCategory.pricePerUnit = budgetCategory.value;
                        } else {
                            budgetCategory.quantity = roundValue(budgetCategory.value / budgetCategory.pricePerUnit, 2);
                            productionCategory.quantity = roundValue(productionCategory.value / productionCategory.pricePerUnit, 2);
                        }

                        productionCategory.value = roundValue(budgetCategory.value * (this.type == 'livestock' ? this.data.details.multiplicationFactor : this.allocatedSize), 2);
                    } else if (property === 'valuePerHa') {
                        budgetCategory.value = roundValue(productionCategory.valuePerHa, 2);

                        if (budgetCategory.unit === 'Total') {
                            budgetCategory.pricePerUnit = budgetCategory.value;
                            productionCategory.pricePerUnit = budgetCategory.value;
                        }

                        budgetCategory.quantity = roundValue(budgetCategory.value / budgetCategory.pricePerUnit, 2);
                        productionCategory.value = roundValue(budgetCategory.value * this.allocatedSize, 2);
                        productionCategory.valuePerHa = budgetCategory.value;
                        productionCategory.quantity = roundValue(productionCategory.value / productionCategory.pricePerUnit, 2);
                    } else if (property === 'valuePerLSU') {
                        budgetCategory.valuePerLSU = roundValue(productionCategory.valuePerLSU, 2);
                        budgetCategory.pricePerUnit = budgetCategory.valuePerLSU * this.budget.getConversionRate(budgetCategory.name);
                        budgetCategory.value = roundValue((budgetCategory.pricePerUnit || 0) * (budgetCategory.quantity || 0), 2);
                        productionCategory.value = roundValue(budgetCategory.value * this.data.details.multiplicationFactor, 2);
                        productionCategory.valuePerLSU = roundValue(budgetCategory.valuePerLSU * this.data.details.multiplicationFactor, 2);
                        productionCategory.quantity = roundValue(productionCategory.value / productionCategory.pricePerUnit, 2);
                    } else if (property === 'quantityPerHa') {
                        budgetCategory.quantity = roundValue(productionCategory.quantityPerHa, 2);
                        budgetCategory.value = roundValue((budgetCategory.pricePerUnit || 0) * (budgetCategory.quantity || 0), 2);
                        productionCategory.value = roundValue(budgetCategory.value * this.allocatedSize, 2);
                        productionCategory.quantity = roundValue(productionCategory.value / productionCategory.pricePerUnit, 2);
                        productionCategory.quantityPerHa = budgetCategory.quantity;
                    } else if (property === 'quantityPerLSU') {
                        budgetCategory.quantity = roundValue(productionCategory.quantityPerLSU, 2);
                        budgetCategory.value = roundValue((budgetCategory.pricePerUnit || 0) * (budgetCategory.quantity || 0), 2);
                        productionCategory.value = roundValue(budgetCategory.value * this.data.details.multiplicationFactor, 2);
                        productionCategory.quantity = roundValue(productionCategory.value / productionCategory.pricePerUnit, 2);
                        productionCategory.quantityPerLSU = budgetCategory.quantity;
                    } else if (property === 'quantity') {
                        budgetCategory.quantity = roundValue(productionCategory.quantity / (this.type == 'livestock' ? this.data.details.multiplicationFactor : this.allocatedSize), 2);
                        budgetCategory.value = roundValue((budgetCategory.pricePerUnit || 0) * (budgetCategory.quantity || 0), 2);
                        productionCategory.value = roundValue(budgetCategory.value * (this.type == 'livestock' ? this.data.details.multiplicationFactor : this.allocatedSize), 2);
                        productionCategory.quantity = roundValue(productionCategory.value / productionCategory.pricePerUnit, 2);
                    } else if (property === 'pricePerUnit') {
                        budgetCategory.pricePerUnit = roundValue(productionCategory.pricePerUnit, 2);
                        budgetCategory.value = roundValue((budgetCategory.pricePerUnit || 0) * (budgetCategory.quantity || 0), 2);
                        productionCategory.value = roundValue(budgetCategory.value * (this.type == 'livestock' ? this.data.details.multiplicationFactor : this.allocatedSize), 2);
                        productionCategory.pricePerUnit = budgetCategory.pricePerUnit;
                    } else if (property === 'stock') {
                        budgetCategory.stock = productionCategory.stock;
                    }

                    if(this.type == 'livestock') {
                        budgetCategory.valuePerLSU = roundValue((budgetCategory.pricePerUnit || 0) / this.budget.getConversionRate(budgetCategory.name), 2);
                    }

                    if (sectionCode === 'EXP') {
                        productionCategory.valuePerHa = budgetCategory.value;
                    }

                    this.$dirty = true;

                    return productionCategory[property];
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
                                var productionCategory = instance.addCategory(section.code, group.name, category.code, section.costStage);

                                productionCategory.pricePerUnit = category.pricePerUnit;

                                if (instance.type == 'livestock') {
                                    productionCategory.value += roundValue(category.value * instance.data.details.multiplicationFactor, 2);
                                    productionCategory.valuePerLSU += roundValue(category.valuePerLSU * instance.data.details.multiplicationFactor, 2);
                                    productionCategory.quantity += roundValue(productionCategory.value / category.pricePerUnit, 2);
                                    productionCategory.quantityPerLSU = category.quantity;

                                    if (group.code === 'INC-LSS') {
                                        productionCategory.stock = category.stock || (category.name == instance.getRepresentativeAnimal() ? instance.data.details.herdSize : 0);
                                    }
                                } else {
                                    productionCategory.value += roundValue(category.value * instance.allocatedSize, 2);
                                    productionCategory.quantity += roundValue(productionCategory.value / category.pricePerUnit, 2);
                                    productionCategory.quantityPerHa = category.quantity;
                                }

                                if (section.code === 'EXP') {
                                    productionCategory.valuePerHa = category.value;
                                }

                                productionCategory.schedule = instance.budget.getShiftedSchedule(category.schedule);

                                productionCategory.valuePerMonth = underscore.map(productionCategory.schedule, function (monthFactor, index) {
                                    return ((monthFactor / 100) * productionCategory.value) + (productionCategory.valuePerMonth ? productionCategory.valuePerMonth[index] : 0);
                                });

                                productionCategory.quantityPerMonth = underscore.map(productionCategory.schedule, function (monthFactor, index) {
                                    return ((monthFactor / 100) * productionCategory.quantity) + (productionCategory.quantityPerMonth ? productionCategory.quantityPerMonth[index] : 0);
                                });
                            });

                            // Group totals
                            var productionGroup = instance.getGroup(section.code, group.name, section.costStage);

                            if (productionGroup) {
                                productionGroup.total.value = underscore.reduce(productionGroup.productCategories, function (total, category) {
                                    return total + category.value;
                                }, 0);

                                productionGroup.total.valuePerMonth = underscore
                                    .chain(productionGroup.productCategories)
                                    .pluck('valuePerMonth')
                                    .reduce(function (total, valuePerMonth) {
                                        return (total ? underscore.map(valuePerMonth, function (value, index) {
                                            return total[index] + value;
                                        }) : angular.copy(valuePerMonth));
                                    })
                                    .value();

                                productionGroup.total.quantityPerMonth = underscore
                                    .chain(productionGroup.productCategories)
                                    .pluck('quantityPerMonth')
                                    .reduce(function (total, quantityPerMonth) {
                                        return (total ? underscore.map(quantityPerMonth, function (value, index) {
                                            return total[index] + value;
                                        }) : angular.copy(quantityPerMonth));
                                    })
                                    .value();

                                if (instance.type == 'livestock') {
                                    productionGroup.total.valuePerLSU = underscore.reduce(productionGroup.productCategories, function (total, category) {
                                        return total + category.valuePerLSU;
                                    }, 0);
                                }
                            }
                        });

                        // Section totals
                        var productionSection = instance.getSection(section.code, section.costStage);

                        if (productionSection) {
                            productionSection.total.value = underscore.reduce(productionSection.productCategoryGroups, function (total, group) {
                                return total + group.total.value;
                            }, 0);

                            productionSection.total.valuePerMonth = underscore
                                .chain(productionSection.productCategoryGroups)
                                .pluck('total')
                                .pluck('valuePerMonth')
                                .reduce(function (total, valuePerMonth) {
                                    return (total ? underscore.map(valuePerMonth, function (value, index) {
                                        return total[index] + value;
                                    }) : angular.copy(valuePerMonth));
                                })
                                .value();

                            productionSection.total.quantityPerMonth = underscore
                                .chain(productionSection.productCategoryGroups)
                                .pluck('total')
                                .pluck('quantityPerMonth')
                                .reduce(function (total, quantityPerMonth) {
                                    return (total ? underscore.map(quantityPerMonth, function (value, index) {
                                        return total[index] + value;
                                    }) : angular.copy(quantityPerMonth));
                                })
                                .value();

                            if (instance.type == 'livestock') {
                                productionSection.total.valuePerLSU = underscore.reduce(productionSection.productCategoryGroups, function (total, group) {
                                    return total + group.total.valuePerLSU;
                                }, 0);
                            }

                            instance.data.details.grossProfit = (productionSection.code == 'INC' ?
                                (instance.data.details.grossProfit + productionSection.total.value) :
                                (instance.data.details.grossProfit - productionSection.total.value));
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
