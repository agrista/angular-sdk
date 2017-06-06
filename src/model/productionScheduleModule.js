var sdkModelProductionSchedule = angular.module('ag.sdk.model.production-schedule', ['ag.sdk.library', 'ag.sdk.utilities', 'ag.sdk.model']);

sdkModelProductionSchedule.factory('ProductionGroup', ['$filter', 'Base', 'computedProperty', 'EnterpriseBudgetBase', 'inheritModel', 'moment', 'privateProperty', 'ProductionSchedule', 'underscore',
    function ($filter, Base, computedProperty, EnterpriseBudgetBase, inheritModel, moment, privateProperty, ProductionSchedule, underscore) {
        function ProductionGroup (attrs) {
            EnterpriseBudgetBase.apply(this, arguments);

            Base.initializeObject(this.data, 'details', {});
            Base.initializeObject(this.data.details, 'grossProfit', 0);
            Base.initializeObject(this.data.details, 'size', 0);

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
                        return total + (category[property] || 0);
                    }, 0) / productionCategory.categories.length, 2);
                } else if (underscore.contains(['value', 'quantity', 'supply'], property)) {
                    value = roundValue(underscore.reduce(productionCategory.categories, function (total, category) {
                        return total + (category[property] || 0);
                    }, 0), 2);
                } else if (property === 'valuePerHa') {
                    value = roundValue(productionCategory.value / instance.allocatedSize, 2);
                }

                var affectedProductionSchedules = underscore.reject(instance.productionSchedules, function (productionSchedule) {
                    return underscore.isUndefined(productionSchedule.getCategory(sectionCode, categoryCode, costStage));
                });

                if (property !== 'schedule') {
                    var ratio = (value !== 0 ? (productionCategory[property] / value) : (productionCategory[property] / affectedProductionSchedules.length)),
                        remainder = productionCategory[property];

                    underscore.each(affectedProductionSchedules, function (productionSchedule, index, list) {
                        var category = productionSchedule.getCategory(sectionCode, categoryCode, costStage);

                        if (value === 0) {
                            category[property] = ratio;
                        } else if (index === list.length - 1) {
                            category[property] = remainder;
                        } else if (!underscore.isUndefined(category[property])) {
                            category[property] = category[property] * ratio;
                        } else {
                            category[property] = (index < list.length - 1 ? (category[property] || 0) / list.length : remainder);
                        }

                        remainder = roundValue(remainder - productionSchedule.adjustCategory(sectionCode, categoryCode, costStage, property), 2);
                    });
                } else if (property === 'schedule') {
                    var valuePerMonth = underscore.reduce(productionCategory.schedule, function (valuePerMonth, allocation, index) {
                        //valuePerMonth[index] = roundValue((productionCategory.value / 100) * allocation, 2);
                        valuePerMonth[index] = (productionCategory.value || 0) * (allocation / 100);

                        return valuePerMonth;
                    }, initializeArray(instance.numberOfMonths));

                    underscore.each(productionCategory.valuePerMonth, function (value, index) {
                        var categoryCount = underscore.chain(productionCategory.categories)
                            .filter(function (category) {
                                return index >= category.offset && index < category.offset + category.valuePerMonth.length;
                            })
                            .size();

                        underscore.each(affectedProductionSchedules, function (productionSchedule) {
                            var startOffset = moment(productionSchedule.startDate).diff(instance.startDate, 'months'),
                                category = productionSchedule.getCategory(sectionCode, categoryCode, costStage);

                            if (index >= startOffset && index < startOffset + category.valuePerMonth.length) {
                                //category.valuePerMonth[index - startOffset] = (value === 0 ?
                                //    roundValue(valuePerMonth[index] / categoryCount, 2) :
                                //    roundValue(valuePerMonth[index] * (category.valuePerMonth[index - startOffset] / value), 2));
                                category.valuePerMonth[index - startOffset] = (value === 0 ?
                                    valuePerMonth[index] / categoryCount :
                                    valuePerMonth[index] * (category.valuePerMonth[index - startOffset] / value));
                            }
                        });
                    });

                    underscore.each(affectedProductionSchedules, function (productionSchedule) {
                        var category = productionSchedule.getCategory(sectionCode, categoryCode, costStage);

                        category.value = underscore.reduce(category.valuePerMonth, function (total, value) {
                            return total + (value || 0);
                        }, 0);

                        category.schedule = underscore.map(category.valuePerMonth, function (value) {
                            return (category.value > 0 ? roundValue((100 / category.value) * value, 2) : 0);
                        });

                        productionSchedule.adjustCategory(sectionCode, categoryCode, costStage, property);
                    });
                }
            }
        }

        function initializeArray (size) {
            return underscore.range(size).map(function () {
                return 0;
            });
        }

        function recalculateProductionGroup (instance) {
            instance.data.sections = [];

            angular.forEach(instance.productionSchedules, function (productionSchedule) {
                var startOffset = moment(productionSchedule.startDate).diff(instance.startDate, 'months');

                productionSchedule.recalculate();

                angular.forEach(productionSchedule.data.sections, function (section) {
                    if (section.costStage === productionSchedule.costStage) {
                        angular.forEach(section.productCategoryGroups, function (group) {
                            angular.forEach(group.productCategories, function (category) {
                                var productionCategory = instance.addCategory(section.code, group.name, category.code, instance.defaultCostStage);

                                productionCategory.per = category.per;
                                productionCategory.categories = productionCategory.categories || [];
                                productionCategory.categories.push(underscore.extend({
                                    offset: startOffset,
                                    size: productionSchedule.allocatedSize
                                }, category));

                                productionCategory.valuePerMonth = underscore.reduce(category.valuePerMonth, function (valuePerMonth, value, index) {
                                    valuePerMonth[index + startOffset] = roundValue(valuePerMonth[index + startOffset] + value);

                                    return valuePerMonth;
                                }, productionCategory.valuePerMonth || initializeArray(instance.numberOfMonths));

                                productionCategory.value = roundValue(underscore.reduce(productionCategory.categories, function (total, category) {
                                    return total + (category.value || 0);
                                }, 0), 2);

                                productionCategory.quantityPerMonth = underscore.reduce(category.quantityPerMonth, function (quantityPerMonth, value, index) {
                                    quantityPerMonth[index + startOffset] = roundValue(quantityPerMonth[index + startOffset] + value);

                                    return quantityPerMonth;
                                }, productionCategory.quantityPerMonth || initializeArray(instance.numberOfMonths));

                                productionCategory.quantity = roundValue(underscore.reduce(productionCategory.categories, function (total, category) {
                                    return total + (category.quantity || 0);
                                }, 0), 2);

                                if (productionCategory.supplyUnit) {
                                    productionCategory.supply = roundValue(underscore.reduce(productionCategory.categories, function (total, category) {
                                        return total + (category.supply || 0);
                                    }, 0), 2);
                                }

                                productionCategory.pricePerUnit = roundValue(productionCategory.value / productionCategory.quantity / (productionCategory.supply || 1), 2);

                                productionCategory.schedule = underscore.reduce(productionCategory.valuePerMonth, function (schedule, value, index) {
                                    schedule[index] = roundValue((100 / productionCategory.value) * value, 2);

                                    return schedule;
                                }, initializeArray(instance.numberOfMonths));

                                if (productionSchedule.type === 'livestock') {
                                    productionCategory.quantityPerLSU = roundValue(underscore.reduce(productionCategory.categories, function (total, category) {
                                        return total + (category.quantityPerLSU || 0);
                                    }, 0) / productionCategory.categories.length, 2);

                                    productionCategory.valuePerLSU = roundValue(underscore.reduce(productionCategory.categories, function (total, category) {
                                        return total + (category.valuePerLSU || 0);
                                    }, 0) / productionCategory.categories.length, 2);
                                } else {
                                    productionCategory.quantityPerHa = roundValue(underscore.reduce(productionCategory.categories, function (total, category) {
                                        return total + (category.quantityPerHa || 0);
                                    }, 0) / productionCategory.categories.length, 2);
                                }

                                if (section.code === 'EXP') {
                                    productionCategory.valuePerHa = roundValue(productionCategory.value / instance.allocatedSize, 2);
                                }
                            });

                            // Group totals
                            var productionGroup = instance.getGroup(section.code, group.name, instance.defaultCostStage);

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

                                if (productionSchedule.type === 'livestock') {
                                    productionGroup.total.valuePerLSU = underscore.reduce(productionGroup.productCategories, function (total, category) {
                                        return total + (category.valuePerLSU || 0);
                                    }, 0);
                                }
                            }
                        });

                        // Section totals
                        var productionSection = instance.getSection(section.code, instance.defaultCostStage);

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

                            if (productionSchedule.type === 'livestock') {
                                productionSection.total.valuePerLSU = underscore.reduce(productionSection.productCategoryGroups, function (total, group) {
                                    return total + (group.total.valuePerLSU || 0);
                                }, 0);
                            }

                            instance.data.details.grossProfit += (productionSection.code === 'INC' ?
                                (instance.data.details.grossProfit + productionSection.total.value) :
                                (instance.data.details.grossProfit - productionSection.total.value));
                        }
                    }
                });
            });

            instance.sortSections();

            instance.data.details.grossProfit = underscore.reduce(instance.data.sections, function (total, section) {
                return (section.code === 'INC' ? total + section.total.value : total - section.total.value);
            }, 0);
        }

        return ProductionGroup;
    }]);

sdkModelProductionSchedule.factory('ProductionSchedule', ['$filter', 'Base', 'computedProperty', 'EnterpriseBudget', 'EnterpriseBudgetBase', 'inheritModel', 'moment', 'privateProperty', 'readOnlyProperty', 'underscore',
    function ($filter, Base, computedProperty, EnterpriseBudget, EnterpriseBudgetBase, inheritModel, moment, privateProperty, readOnlyProperty, underscore) {
        function ProductionSchedule (attrs) {
            EnterpriseBudgetBase.apply(this, arguments);

            Base.initializeObject(this.data, 'details', {});

            computedProperty(this, 'costStage', function () {
                return (this.type !== 'horticulture' || this.data.details.assetAge !== 0 ? this.defaultCostStage : underscore.first(ProductionSchedule.costStages));
            });

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

                    if (assetAge !== this.data.details.assetAge) {
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
                this.budget = EnterpriseBudget.new(underscore.omit(budget, ['followers', 'organization', 'region', 'user', 'userData']));
                this.budgetUuid = this.budget.uuid;
                this.type = this.budget.assetType;

                this.data.budget = this.budget;
                this.data.details = underscore.extend(this.data.details, {
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
                } else if (this.type === 'horticulture') {
                    this.data.details = underscore.extend(this.data.details, {
                        maturityFactor: this.budget.data.details.maturityFactor
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
                if (this.type === 'livestock' && this.data.details.stockingDensity !== stockingDensity) {
                    this.data.details.stockingDensity = stockingDensity;

                    this.setSize(this.allocatedSize);
                }
            });

            privateProperty(this, 'setSize', function (size) {
                this.data.details.size = size;

                if (this.type === 'livestock') {
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
                return adjustCategory(this, sectionCode, categoryCode, costStage, property);
            });

            privateProperty(this, 'applyMaturityFactor', function (sectionCode, value) {
                var factor = (this.type === 'horticulture' && this.costStage === 'Yearly' && this.data.details.maturityFactor && this.data.details.maturityFactor[sectionCode] ?
                    (this.data.details.maturityFactor[sectionCode][this.data.details.assetAge - 1] || 0) : 100);

                return (factor ? (value * (factor / 100)) : factor);
            });

            privateProperty(this, 'reverseMaturityFactor', function (sectionCode, value) {
                var factor = (this.type === 'horticulture' && this.costStage === 'Yearly' && this.data.details.maturityFactor && this.data.details.maturityFactor[sectionCode] ?
                    (this.data.details.maturityFactor[sectionCode][this.data.details.assetAge - 1] || 0) : 100);

                return (factor ? (value * (100 / factor)) : factor);
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
                return underscore.findWhere(this.data.sections, {code: 'INC', costStage: this.costStage});
            });

            computedProperty(this, 'expenses', function () {
                return underscore.findWhere(this.data.sections, {code: 'EXP', costStage: this.costStage});
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
        
        function adjustCategory (instance, sectionCode, categoryCode, costStage, property) {
            var productionCategory = instance.getCategory(sectionCode, categoryCode, costStage),
                budgetCategory = instance.budget.getCategory(sectionCode, categoryCode, costStage);

            if (productionCategory && budgetCategory) {
                if (property === 'value') {
                    budgetCategory.value = instance.reverseMaturityFactor(sectionCode, productionCategory.value / (instance.type === 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize));

                    if (budgetCategory.unit === 'Total') {
                        budgetCategory.pricePerUnit = budgetCategory.value;
                        productionCategory.pricePerUnit = budgetCategory.value;
                    } else {
                        budgetCategory.quantity = budgetCategory.value / budgetCategory.pricePerUnit;
                        productionCategory.quantity = productionCategory.value / productionCategory.pricePerUnit;
                    }

                    productionCategory.value = roundValue(instance.applyMaturityFactor(sectionCode, budgetCategory.value * (instance.type === 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize)), 2);
                } else if (property === 'valuePerHa') {
                    budgetCategory.value = instance.reverseMaturityFactor(sectionCode, productionCategory.valuePerHa);

                    if (budgetCategory.unit === 'Total') {
                        budgetCategory.pricePerUnit = budgetCategory.value;
                        productionCategory.pricePerUnit = budgetCategory.value;
                    }

                    budgetCategory.quantity = budgetCategory.value / budgetCategory.pricePerUnit;
                    productionCategory.value = roundValue(instance.applyMaturityFactor(sectionCode, budgetCategory.value * instance.allocatedSize), 2);
                    productionCategory.valuePerHa = roundValue(instance.applyMaturityFactor(sectionCode, budgetCategory.value));
                    productionCategory.quantity = roundValue(productionCategory.value / productionCategory.pricePerUnit, 2);
                } else if (property === 'valuePerLSU') {
                    budgetCategory.valuePerLSU = roundValue(productionCategory.valuePerLSU, 2);
                    budgetCategory.pricePerUnit = budgetCategory.valuePerLSU * instance.budget.getConversionRate(budgetCategory.name);
                    budgetCategory.value = (budgetCategory.supply || 1) * (budgetCategory.pricePerUnit || 0) * (budgetCategory.quantity || 0);
                    productionCategory.value = roundValue(budgetCategory.value * instance.data.details.multiplicationFactor, 2);
                    productionCategory.valuePerLSU = roundValue(budgetCategory.valuePerLSU * instance.data.details.multiplicationFactor, 2);
                    productionCategory.quantity = roundValue(productionCategory.value / productionCategory.pricePerUnit, 2);
                } else if (property === 'quantityPerHa') {
                    budgetCategory.quantity = instance.reverseMaturityFactor(sectionCode, productionCategory.quantityPerHa);
                    budgetCategory.value = (budgetCategory.supply || 1) * (budgetCategory.pricePerUnit || 0) * (budgetCategory.quantity || 0);
                    productionCategory.quantity = roundValue(instance.applyMaturityFactor(sectionCode, budgetCategory.quantity * instance.allocatedSize), 2);
                    productionCategory.quantityPerHa = roundValue(instance.applyMaturityFactor(sectionCode, budgetCategory.quantity), 2);
                    productionCategory.value = roundValue((productionCategory.supply || 1) * productionCategory.quantity * productionCategory.pricePerUnit, 2);
                } else if (property === 'quantityPerLSU') {
                    budgetCategory.quantity = productionCategory.quantityPerLSU;
                    productionCategory.quantity = roundValue(budgetCategory.quantity * instance.data.details.multiplicationFactor, 2);
                    productionCategory.quantityPerLSU = budgetCategory.quantity;
                    budgetCategory.value = (budgetCategory.supply || 1) * (budgetCategory.pricePerUnit || 0) * (budgetCategory.quantity || 0);
                    productionCategory.value = roundValue((productionCategory.supply || 1) * productionCategory.quantity * productionCategory.pricePerUnit, 2);
                } else if (property === 'quantity') {
                    budgetCategory.quantity = instance.reverseMaturityFactor(sectionCode, productionCategory.quantity / (instance.type === 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize));
                    budgetCategory.value = (budgetCategory.supply || 1) * (budgetCategory.pricePerUnit || 0) * (budgetCategory.quantity || 0);
                    productionCategory.quantity = roundValue(instance.applyMaturityFactor(sectionCode, budgetCategory.quantity * (instance.type === 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize)), 2);
                    productionCategory.value = roundValue((productionCategory.supply || 1) * productionCategory.pricePerUnit * productionCategory.quantity, 2);
                } else if (property === 'supply') {
                    budgetCategory.supply = productionCategory.supply / (instance.type === 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize);
                    budgetCategory.value = (budgetCategory.supply || 1) * (budgetCategory.pricePerUnit || 0) * (budgetCategory.quantity || 0);
                    productionCategory.supply = budgetCategory.supply * (instance.type === 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize);
                    productionCategory.value = roundValue(instance.applyMaturityFactor(sectionCode, budgetCategory.value * (instance.type === 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize)), 2);
                } else if (property === 'pricePerUnit') {
                    budgetCategory.pricePerUnit = productionCategory.pricePerUnit;
                    budgetCategory.value = (budgetCategory.supply || 1) * (budgetCategory.pricePerUnit || 0) * (budgetCategory.quantity || 0);
                    productionCategory.value = roundValue(instance.applyMaturityFactor(sectionCode, budgetCategory.value * (instance.type === 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize)), 2);
                    productionCategory.pricePerUnit = budgetCategory.pricePerUnit;
                } else if (underscore.contains(['stock', 'stockPrice'], property)) {
                    budgetCategory[property] = productionCategory[property];
                } else if (property === 'schedule') {
                    budgetCategory.schedule = instance.budget.unshiftMonthlyArray(productionCategory.schedule);
                    budgetCategory.value = instance.reverseMaturityFactor(sectionCode, productionCategory.value / (instance.type === 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize));

                    if (budgetCategory.unit === 'Total') {
                        budgetCategory.pricePerUnit = budgetCategory.value;
                        productionCategory.pricePerUnit = budgetCategory.value;
                    } else {
                        budgetCategory.quantity = budgetCategory.value / budgetCategory.pricePerUnit;
                    }

                    budgetCategory.value = ((budgetCategory.supply || 1) * (budgetCategory.pricePerUnit || 0) * (budgetCategory.quantity || 0)) * (underscore.reduce(budgetCategory.schedule, function (total, value) {
                        return total + (value || 0);
                    }, 0) / 100);

                    budgetCategory.valuePerMonth = underscore.map(budgetCategory.schedule, function (allocation) {
                        return budgetCategory.value * (allocation / 100);
                    });

                    productionCategory.valuePerMonth = underscore.map(instance.budget.shiftMonthlyArray(budgetCategory.valuePerMonth), function (value) {
                        return instance.applyMaturityFactor(sectionCode, value) * (instance.type === 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize);
                    });

                    productionCategory.quantity = roundValue(instance.applyMaturityFactor(sectionCode, budgetCategory.quantity * (instance.type === 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize)), 2);
                    productionCategory.value = roundValue(instance.applyMaturityFactor(sectionCode, budgetCategory.value * (instance.type === 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize)), 2);
                }

                if(instance.type === 'livestock') {
                    budgetCategory.valuePerLSU = (budgetCategory.pricePerUnit || 0) / instance.budget.getConversionRate(budgetCategory.name);
                }

                if (sectionCode === 'EXP') {
                    productionCategory.valuePerHa = roundValue(instance.applyMaturityFactor(sectionCode, budgetCategory.value), 2);
                }

                instance.$dirty = true;

                return productionCategory[property];
            }
        }

        function recalculateProductionSchedule (instance) {
            if (instance.budget) {
                instance.budget.recalculate();

                instance.data.sections = [];
                instance.data.details.grossProfit = 0;
                
                angular.forEach(instance.budget.data.sections, function (section) {
                    if (section.costStage === instance.costStage) {
                        angular.forEach(section.productCategoryGroups, function (group) {
                            angular.forEach(group.productCategories, function (category) {
                                var productionCategory = instance.addCategory(section.code, group.name, category.code, section.costStage);

                                productionCategory.pricePerUnit = category.pricePerUnit;

                                if (instance.type === 'livestock') {
                                    productionCategory.valuePerLSU += roundValue((category.valuePerLSU || 0) * instance.data.details.multiplicationFactor, 2);
                                    productionCategory.quantityPerLSU = category.quantity;

                                    if (group.code === 'INC-LSS') {
                                        productionCategory.stock = category.stock || (category.name === instance.getRepresentativeAnimal() ? instance.data.details.herdSize : 0);
                                        productionCategory.stockPrice = category.stockPrice || category.pricePerUnit;
                                    }
                                } else {
                                    productionCategory.quantityPerHa = roundValue(instance.applyMaturityFactor(section.code, category.quantity), 2);
                                }

                                if (section.code === 'INC' && productionCategory.supplyUnit && productionCategory.unit !== category.unit) {
                                    category.supplyUnit = productionCategory.supplyUnit;
                                    category.supply = category.quantity;
                                    category.quantity = 1;
                                    category.unit = productionCategory.unit;
                                }

                                if (section.code === 'EXP') {
                                    productionCategory.valuePerHa = roundValue(instance.applyMaturityFactor(section.code, category.value), 2);
                                }

                                if (productionCategory.supplyUnit && category.supply) {
                                    productionCategory.supply = category.supply * (instance.type === 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize);
                                }

                                productionCategory.schedule = instance.budget.getShiftedSchedule(category.schedule);

                                productionCategory.valuePerMonth = underscore.map(instance.budget.shiftMonthlyArray(category.valuePerMonth), function (value) {
                                    return roundValue(instance.applyMaturityFactor(section.code, value * (instance.type === 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize)), 2);
                                });

                                productionCategory.quantityPerMonth = underscore.map(instance.budget.shiftMonthlyArray(category.quantityPerMonth), function (value) {
                                    return roundValue(instance.applyMaturityFactor(section.code, value * (instance.type === 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize)), 2);
                                });

                                productionCategory.quantity = roundValue(instance.applyMaturityFactor(section.code, category.quantity * (instance.type === 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize)), 2);
                                productionCategory.value = roundValue((productionCategory.supply || 1) * (productionCategory.pricePerUnit || 0) * (productionCategory.quantity || 0), 2);

                                instance.setCategory(section.code, group.name, underscore.pick(productionCategory, underscore.identity), section.costStage);
                            });

                            // Group totals
                            var productionGroup = instance.getGroup(section.code, group.name, section.costStage);

                            if (productionGroup) {
                                productionGroup.total.value = underscore.reduce(productionGroup.productCategories, function (total, category) {
                                    return total + (category.value || 0);
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

                                if (instance.type === 'livestock') {
                                    productionGroup.total.valuePerLSU = underscore.reduce(productionGroup.productCategories, function (total, category) {
                                        return total + (category.valuePerLSU || 0);
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

                            if (instance.type === 'livestock') {
                                productionSection.total.valuePerLSU = underscore.reduce(productionSection.productCategoryGroups, function (total, group) {
                                    return total + (group.total.valuePerLSU || 0);
                                }, 0);
                            }

                            instance.data.details.grossProfit = (productionSection.code === 'INC' ?
                                (instance.data.details.grossProfit + productionSection.total.value) :
                                (instance.data.details.grossProfit - productionSection.total.value));
                        }
                    }
                });

                instance.sortSections();

                if (instance.type === 'livestock') {
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
