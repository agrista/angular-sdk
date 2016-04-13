var sdkModelProductionSchedule = angular.module('ag.sdk.model.production-schedule', ['ag.sdk.library', 'ag.sdk.model']);

sdkModelProductionSchedule.factory('ProductionGroup', ['computedProperty', 'EnterpriseBudgetBase', 'inheritModel', 'moment', 'privateProperty', 'ProductionSchedule', 'underscore',
    function (computedProperty, EnterpriseBudgetBase, inheritModel, moment, privateProperty, ProductionSchedule, underscore) {
        function ProductionGroup (attrs) {
            EnterpriseBudgetBase.apply(this, arguments);

            this.data = (attrs && attrs.data ? attrs.data : {});
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
                var groupCategory = this.getCategory(sectionCode, categoryCode, costStage),
                    value = 0,
                    offset = 100;

                if (groupCategory && !underscore.isUndefined(groupCategory[property])) {
                    if (property === 'valuePerHa') {
                        value = underscore.reduce(groupCategory.scheduleCategories, function (total, category) {
                            return total + category.valuePerHa;
                        }, 0) / groupCategory.scheduleCategories.length;
                    } else if (property === 'valuePerLSU' || property === 'value' || property === 'quantity') {
                        value = underscore.reduce(groupCategory.scheduleCategories, function (total, category) {
                            return total + category[property];
                        }, 0);
                    } else if (property === 'pricePerUnit') {
                        value = groupCategory.value / groupCategory.quantity;
                    }

                    offset = (100 / value) * groupCategory[property];

                    underscore.each(this.productionSchedules, function (productionSchedule) {
                        var scheduleCategory = productionSchedule.getCategory(sectionCode, categoryCode, costStage);

                        if (scheduleCategory) {
                            scheduleCategory[property] = (scheduleCategory[property] / 100) * offset;

                            productionSchedule.adjustCategory(sectionCode, categoryCode, costStage, property);
                        }
                    });
                }
            });

            privateProperty(this, 'recalculate', function () {
                recalculateProductionGroup(this);
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

        function roundValue (value, precision) {
            precision = Math.pow(10, precision || 0);

            return Math.round(value * precision) / precision;
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
                                groupCategory.scheduleCategories.push(category);

                                if (productionSchedule.type == 'livestock') {
                                    groupCategory.valuePerLSU = roundValue(underscore.reduce(groupCategory.scheduleCategories, function (total, category) {
                                        return total + category.valuePerLSU;
                                    }, 0), 2);
                                }

                                groupCategory.quantity = roundValue(underscore.reduce(groupCategory.scheduleCategories, function (total, category) {
                                    return total + category.quantity;
                                }, 0), 2);

                                groupCategory.value = roundValue(underscore.reduce(groupCategory.scheduleCategories, function (total, category) {
                                    return total + category.value;
                                }, 0), 2);

                                if (section.code === 'INC') {
                                    groupCategory.pricePerUnit = roundValue(groupCategory.value / groupCategory.quantity, 2);
                                } else {
                                    groupCategory.valuePerHa = roundValue(underscore.reduce(groupCategory.scheduleCategories, function (total, category) {
                                        return total + category.valuePerHa;
                                    }, 0) / groupCategory.scheduleCategories.length, 2);
                                }

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

sdkModelProductionSchedule.factory('ProductionSchedule', ['computedProperty', 'EnterpriseBudget', 'EnterpriseBudgetBase', 'enterpriseBudgetHelper', 'inheritModel', 'moment', 'privateProperty', 'readOnlyProperty', 'underscore',
    function (computedProperty, EnterpriseBudget, EnterpriseBudgetBase, enterpriseBudgetHelper, inheritModel, moment, privateProperty, readOnlyProperty, underscore) {
        function ProductionSchedule (attrs) {
            EnterpriseBudgetBase.apply(this, arguments);

            this.data = (attrs && attrs.data ? attrs.data : {});
            this.data.details = this.data.details || {};

            privateProperty(this, 'setDate', function (startDate) {
                startDate = moment(startDate);

                var startCycle = this.budget.data.details.cycleStart || startDate.month(),
                    allocationDate = moment([(startDate.month() < startCycle ? startDate.year() - 1 : startDate.year()), startCycle]);

                this.startDate = allocationDate.format('YYYY-MM-DD');
                this.endDate = allocationDate.add(1, 'y').format('YYYY-MM-DD');

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
                    this.data.details.multiplicationFactor = roundValue(this.data.details.calculatedLSU ? (this.data.details.stockingDensity ? this.allocatedSize / this.data.details.stockingDensity : 0) / this.data.details.calculatedLSU : 0, 2);
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
                    if (property === 'value' || property === 'valuePerHa' || property === 'valuePerLSU') {
                        var value = (property != 'value' ?
                            (property === 'valuePerHa' ? scheduleCategory.valuePerHa * this.allocatedSize : scheduleCategory.valuePerLSU * this.data.details.multiplicationFactor) :
                            scheduleCategory.value);

                        if (value) {
                            if (scheduleCategory.per == 'LSU') {
                                if (property === 'valuePerLSU') {
                                    budgetCategory.valuePerLSU = value / this.data.details.multiplicationFactor;
                                    budgetCategory.pricePerUnit = budgetCategory.valuePerLSU * this.budget.getConversionRate(budgetCategory.name);
                                } else {
                                    budgetCategory.value = value / this.data.details.multiplicationFactor;
                                    scheduleCategory.pricePerUnit = value / scheduleCategory.quantity;
                                    budgetCategory.pricePerUnit = budgetCategory.value / budgetCategory.quantity;
                                }
                            } else {
                                budgetCategory.value = value / this.allocatedSize;
                                scheduleCategory.quantity = value / scheduleCategory.pricePerUnit;
                                budgetCategory.quantity = budgetCategory.value / budgetCategory.pricePerUnit;
                            }

                            if (budgetCategory.unit === 'Total') {
                                scheduleCategory.pricePerUnit = budgetCategory.value;
                                budgetCategory.pricePerUnit = budgetCategory.value;
                            }
                        }
                    } else if (property === 'quantity') {
                        if (this.type == 'livestock') {
                            budgetCategory.quantity = scheduleCategory.quantity / this.data.details.multiplicationFactor;
                        } else {
                            budgetCategory.quantity = scheduleCategory.quantity / this.allocatedSize;
                        }

                        budgetCategory.value = budgetCategory.pricePerUnit * budgetCategory.quantity;
                        scheduleCategory.value = budgetCategory.pricePerUnit * scheduleCategory.quantity;
                    } else if (property === 'pricePerUnit') {
                        budgetCategory.pricePerUnit = scheduleCategory.pricePerUnit;
                        budgetCategory.value = budgetCategory.pricePerUnit * budgetCategory.quantity;
                        scheduleCategory.value = budgetCategory.pricePerUnit * scheduleCategory.quantity;
                    }

                    if(this.type == 'livestock') {
                        budgetCategory.valuePerLSU = roundValue((budgetCategory.pricePerUnit || 0) / this.budget.getConversionRate(budgetCategory.name), 2);
                    }

                    if (sectionCode === 'EXP') {
                        scheduleCategory.valuePerHa = budgetCategory.value;
                    }

                    this.$dirty = true;
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
                return roundValue(this.data.details.size || 0, 2);
            });

            computedProperty(this, 'numberOfMonths', function () {
                return moment(this.endDate).diff(this.startDate, 'months');
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

        function roundValue (value, precision) {
            precision = Math.pow(10, precision || 0);

            return Math.round(value * precision) / precision;
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
                                    scheduleCategory.valuePerLSU += roundValue(category.valuePerLSU * instance.data.details.multiplicationFactor, 2);
                                    scheduleCategory.quantity += roundValue(category.quantity * instance.data.details.multiplicationFactor, 2);
                                    scheduleCategory.value += roundValue(category.value * instance.data.details.multiplicationFactor, 2);
                                } else {
                                    scheduleCategory.quantity += roundValue(category.quantity * instance.allocatedSize, 2);
                                    scheduleCategory.value += roundValue(category.value * instance.allocatedSize, 2);
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
