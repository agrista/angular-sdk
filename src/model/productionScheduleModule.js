var sdkModelProductionSchedule = angular.module('ag.sdk.model.production-schedule', ['ag.sdk.library', 'ag.sdk.utilities', 'ag.sdk.model']);

sdkModelProductionSchedule.factory('ProductionGroup', ['Base', 'computedProperty', 'EnterpriseBudgetBase', 'inheritModel', 'moment', 'naturalSort', 'privateProperty', 'ProductionSchedule', 'safeArrayMath', 'safeMath', 'underscore',
    function (Base, computedProperty, EnterpriseBudgetBase, inheritModel, moment, naturalSort, privateProperty, ProductionSchedule, safeArrayMath, safeMath, underscore) {
        function ProductionGroup (attrs, options) {
            options = options || {};

            EnterpriseBudgetBase.apply(this, arguments);

            Base.initializeObject(this.data, 'details', {});
            Base.initializeObject(this.data.details, 'grossProfit', 0);
            Base.initializeObject(this.data.details, 'size', 0);

            this.commodities = [];
            this.productionSchedules = [];

            privateProperty(this, 'addProductionSchedule', function (productionSchedule) {
                if (!options.manualDateRange) {
                    if (underscore.isUndefined(this.startDate) || moment(productionSchedule.startDate).isBefore(this.startDate)) {
                        this.startDate = moment(productionSchedule.startDate).format('YYYY-MM-DD');
                    }

                    if (underscore.isUndefined(this.endDate) || moment(productionSchedule.endDate).isAfter(this.endDate)) {
                        this.endDate = moment(productionSchedule.endDate).format('YYYY-MM-DD');
                    }

                    addProductionSchedule(this, productionSchedule);
                } else if (productionSchedule.inDateRange(this.startDate, this.endDate)) {
                    addProductionSchedule(this, productionSchedule);
                }
            });

            computedProperty(this, 'options', function () {
                return options;
            });

            // Stock
            privateProperty(this, 'addStock', function (stock) {
                addStock(this, stock);
            });

            privateProperty(this, 'replaceAllStock', function (stock) {
                replaceAllStock(this, stock);
            });

            privateProperty(this, 'removeStock', function (stock) {
                removeStock(this, stock);
            });

            // Categories
            privateProperty(this, 'adjustCategory', function (sectionCode, categoryQuery, costStage, property) {
                return adjustCategory(this, sectionCode, categoryQuery, costStage, property);
            });

            privateProperty(this, 'getCategory', function (sectionCode, categoryQuery, costStage) {
                return underscore.chain(this.getSections(sectionCode, costStage))
                    .pluck('productCategoryGroups')
                    .flatten()
                    .pluck('productCategories')
                    .flatten()
                    .findWhere(categoryQuery)
                    .value();
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

            privateProperty(this, 'addCategory', function (sectionCode, groupName, categoryQuery, costStage) {
                return addCategory(this, sectionCode, groupName, categoryQuery, costStage);
            });

            privateProperty(this, 'removeCategory', function (sectionCode, groupName, categoryCode, costStage) {
                removeCategory(this, sectionCode, groupName, categoryCode, costStage);
            });

            privateProperty(this, 'recalculate', function () {
                recalculateProductionGroup(this);
            });

            privateProperty(this, 'recalculateCategory', function (sectionCode, groupName, categoryQuery, costStage) {
                recalculateProductionGroupCategory(this, sectionCode, groupName, categoryQuery, costStage);
            });
            
            computedProperty(this, 'allocatedSize', function () {
                return safeMath.round(this.data.details.size || 0, 2);
            });

            computedProperty(this, 'numberOfMonths', function () {
                return moment(this.endDate).diff(this.startDate, 'months');
            });

            computedProperty(this, 'startDateOffset', function () {
                return Math.max(0, moment(underscore.chain(this.productionSchedules)
                    .sortBy(function (productionSchedule) {
                        return moment(productionSchedule.startDate).unix();
                    })
                    .pluck('startDate')
                    .first()
                    .value()).diff(this.startDate, 'months'));
            });

            computedProperty(this, 'endDateOffset', function () {
                return safeMath.minus(this.numberOfMonths - 1, Math.max(0, moment(this.endDate).diff(underscore.chain(this.productionSchedules)
                    .sortBy(function (productionSchedule) {
                        return moment(productionSchedule.endDate).unix();
                    })
                    .pluck('endDate')
                    .last()
                    .value(), 'months')));
            });

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            if (options.startDate && options.endDate) {
                options.manualDateRange = true;
                this.startDate = moment(options.startDate).format('YYYY-MM-DD');
                this.endDate = moment(options.endDate).format('YYYY-MM-DD');
            } else {
                this.startDate = attrs.startDate && moment(attrs.startDate).format('YYYY-MM-DD');
                this.endDate = attrs.endDate && moment(attrs.endDate).format('YYYY-MM-DD');
            }

            this.replaceAllStock(attrs.stock || []);

            underscore.each(attrs.productionSchedules, this.addProductionSchedule, this);

            this.recalculate();
        }

        inheritModel(ProductionGroup, EnterpriseBudgetBase);

        function addProductionSchedule (instance, productionSchedule) {
            instance.productionSchedules.push(productionSchedule);
            instance.commodities = underscore.chain(instance.commodities)
                .union([productionSchedule.commodityType])
                .uniq()
                .value()
                .sort(naturalSort);

            instance.data.details.size = safeArrayMath.reduceProperty(instance.productionSchedules, 'allocatedSize');

            productionSchedule.replaceAllStock(instance.stock);
        }

        // Stock
        function addStock (instance, stock) {
            if (stock && underscore.isArray(stock.data.ledger)) {
                instance.stock = underscore.chain(instance.stock)
                    .reject(function (item) {
                        return item.assetKey === stock.assetKey;
                    })
                    .union([stock])
                    .value();

                underscore.each(instance.productionSchedules, function (productionSchedule) {
                    productionSchedule.addStock(stock);
                });
            }
        }

        function replaceAllStock (instance, stock) {
            instance.stock = underscore.filter(stock, function (item) {
                return item && underscore.isArray(item.data.ledger);
            });

            underscore.each(instance.productionSchedules, function (productionSchedule) {
                productionSchedule.replaceAllStock(stock);
            });
        }

        function removeStock (instance, stock) {
            instance.stock = underscore.chain(instance.stock)
                .reject(function (item) {
                    return item.assetKey === stock.assetKey;
                })
                .value();

            underscore.each(instance.productionSchedules, function (productionSchedule) {
                productionSchedule.removeStock(stock);
            });
        }

        // Categories
        function addCategory (instance, sectionCode, groupName, categoryQuery, costStage) {
            var category = instance.getCategory(sectionCode, categoryQuery, costStage);

            if (underscore.isUndefined(category)) {
                var group = instance.addGroup(sectionCode, instance.findGroupNameByCategory(sectionCode, groupName, categoryQuery.code), costStage);

                category = underscore.extend({
                    quantity: 0,
                    value: 0
                }, EnterpriseBudgetBase.categories[categoryQuery.code]);

                // WA: Modify enterprise budget model to specify input costs as "per ha"
                if (sectionCode === 'EXP') {
                    category.unit = 'Total'
                }

                if (categoryQuery.name) {
                    category.name = categoryQuery.name;
                }

                category.per = (instance.assetType === 'livestock' ? 'LSU' : 'ha');

                if (this.assetType === 'livestock') {
                    var conversionRate = instance.getConversionRate(category.name);

                    if (conversionRate) {
                        category.conversionRate = conversionRate;
                    }

                    category.valuePerLSU = 0;
                }

                group.productCategories = underscore.union(group.productCategories, [category])
                    .sort(function (categoryA, categoryB) {
                        return (instance.assetType === 'livestock' && sectionCode === 'INC' ?
                            naturalSort(EnterpriseBudgetBase.getCategorySortKey(categoryA.name), EnterpriseBudgetBase.getCategorySortKey(categoryB.name)) :
                            naturalSort(categoryA.name, categoryB.name));
                    });
                instance.setCache([category.code, costStage], category);
            }

            return category;
        }

        function removeCategory (instance, sectionCode, groupName, categoryQuery, costStage) {
            groupName = instance.findGroupNameByCategory(sectionCode, groupName, categoryQuery.code);

            var group = instance.getGroup(sectionCode, groupName, costStage);

            if (group) {
                group.productCategories = underscore.reject(group.productCategories, function (category) {
                    return underscore.every(categoryQuery, function (value, key) {
                        return category[key] === value;
                    });
                });

                instance.resetCache([categoryQuery.code, costStage]);
            }
        }

        function adjustCategory (instance, sectionCode, categoryQuery, costStage, property) {
            var productionGroupCategory = instance.getCategory(sectionCode, categoryQuery, costStage),
                oldValue = 0;

            if (productionGroupCategory && !underscore.isUndefined(productionGroupCategory[property])) {
                var categorySchedules = underscore.chain(instance.productionSchedules)
                    .filter(function (productionSchedule) {
                        return underscore.some(productionGroupCategory.categories, function (category) {
                            return productionSchedule.scheduleKey === category.scheduleKey;
                        });
                    })
                    .uniq(false, function (productionSchedule) {
                        return productionSchedule.scheduleKey;
                    })
                    .indexBy('scheduleKey')
                    .value();

                var uniqueBudgets = underscore.chain(categorySchedules)
                    .pluck('budget')
                    .uniq(false, underscore.iteratee('uuid'))
                    .value();

                var propertyMap = {
                    quantity: 'quantityPerMonth',
                    value: 'valuePerMonth',
                    quantityPerHa: 'quantity',
                    valuePerHa: 'value'
                }, mappedProperty = propertyMap[property] || property;

                switch (property) {
                    case 'stock':
                        underscore.each(categorySchedules, function (productionSchedule) {
                            productionSchedule.adjustCategory(sectionCode, categoryQuery, productionSchedule.costStage, property);
                        });
                        break;
                    case 'quantity':
                    case 'value':
                        oldValue = safeMath.round(safeArrayMath.reduce(productionGroupCategory[mappedProperty]), 2);

                        if (oldValue === 0) {
                            var totalCategories = safeArrayMath.reduce(productionGroupCategory.categoriesPerMonth);

                            productionGroupCategory[mappedProperty] = underscore.reduce(productionGroupCategory.categoriesPerMonth, function (result, value, index) {
                                result[index] = safeMath.dividedBy(safeMath.times(value, productionGroupCategory[property]), totalCategories);

                                return result;
                            }, Base.initializeArray(instance.numberOfMonths));

                            property = mappedProperty;
                        } else {
                            underscore.each(categorySchedules, function (productionSchedule) {
                                var productionCategory = productionSchedule.getCategory(sectionCode, categoryQuery.code, productionSchedule.costStage);

                                if (productionCategory) {
                                    productionCategory[property] = safeMath.dividedBy(safeMath.times(productionCategory[property], productionGroupCategory[property]), oldValue);

                                    productionSchedule.adjustCategory(sectionCode, categoryQuery, productionSchedule.costStage, property);
                                }
                            });
                        }
                        break;
                    case 'quantityPerHa':
                    case 'valuePerHa':
                        oldValue = safeMath.round(safeMath.dividedBy(safeArrayMath.reduce(productionGroupCategory[mappedProperty + 'PerHaPerMonth']), safeArrayMath.count(productionGroupCategory[mappedProperty + 'PerHaPerMonth'])), 2);

                        productionGroupCategory[mappedProperty + 'PerHaPerMonth'] = underscore.reduce(productionGroupCategory[mappedProperty + 'PerHaPerMonth'], function (valuePerHaPerMonth, value, index) {
                            valuePerHaPerMonth[index] = (oldValue === 0 ?
                                safeMath.dividedBy(productionGroupCategory[property], uniqueBudgets.length) :
                                safeMath.dividedBy(safeMath.times(value, productionGroupCategory[property]), oldValue));
                            return valuePerHaPerMonth;
                        }, Base.initializeArray(instance.numberOfMonths));

                        productionGroupCategory[mappedProperty + 'PerMonth'] = safeArrayMath.round(safeArrayMath.times(productionGroupCategory[mappedProperty + 'PerHaPerMonth'], productionGroupCategory.haPerMonth), 2);
                        property = mappedProperty + 'PerMonth';
                        break;
                }

                if (underscore.contains(['quantityPerMonth', 'valuePerMonth'], property)) {
                    var oldValuePerMonth = underscore.reduce(productionGroupCategory.categories, function (result, category) {
                        return safeArrayMath.plus(result, category[property]);
                    }, Base.initializeArray(instance.numberOfMonths));

                    oldValue = safeArrayMath.reduce(oldValuePerMonth);

                    underscore.each(productionGroupCategory.categories, function (category) {
                        var productionSchedule = categorySchedules[category.scheduleKey],
                            productionCategory = productionSchedule && productionSchedule.getCategory(sectionCode, categoryQuery.code, productionSchedule.costStage);

                        if (productionCategory) {
                            productionCategory[property] = underscore.reduce(productionGroupCategory[property], function (result, value, index) {
                                var indexOffset = index - category.offset;

                                if (indexOffset >= 0 && indexOffset < result.length) {
                                    result[indexOffset] = safeMath.dividedBy(value, productionGroupCategory.categoriesPerMonth[index]);
                                }
                                return result;
                            }, productionCategory[property]);

                            productionSchedule.adjustCategory(sectionCode, categoryQuery, productionSchedule.costStage, property);

                            underscore.each(categorySchedules, function (schedule) {
                                if (schedule.budgetUuid === productionSchedule.budgetUuid && schedule.scheduleKey !== productionSchedule.scheduleKey) {
                                    schedule.recalculateCategory(categoryQuery.code);
                                }
                            });
                        }
                    });
                }

                recalculateProductionGroupCategory(instance, sectionCode, productionGroupCategory.groupBy, categoryQuery, costStage);
            }
        }

        function reduceArrayInRange (offset) {
            return function (totals, value, index) {
                var indexOffset = index + offset;

                if (indexOffset >= 0 && indexOffset < totals.length) {
                    totals[indexOffset] = safeMath.plus(totals[indexOffset], value);
                }

                return totals;
            }
        }

        function recalculateProductionGroup (instance) {
            instance.data.sections = [];
            instance.clearCache();

            underscore.each(instance.productionSchedules, function (productionSchedule) {
                var startOffset = moment(productionSchedule.startDate).diff(instance.startDate, 'months');

                productionSchedule.recalculate();

                underscore.each(productionSchedule.data.sections, function (section) {
                    if (section.costStage === productionSchedule.costStage) {
                        underscore.each(section.productCategoryGroups, function (group) {
                            underscore.each(group.productCategories, function (category) {
                                recalculateCategory(instance, productionSchedule, startOffset, section, group, category);
                            });
                            
                            recalculateGroup(instance, productionSchedule, section, group);
                        });

                        recalculateSection(instance, productionSchedule, section);
                    }
                });
            });

            instance.addSection('INC');
            instance.addSection('EXP');
            instance.sortSections();

            instance.data.details.grossProfit = underscore.reduce(instance.data.sections, function (total, section) {
                return (section.code === 'INC' ? safeMath.plus(total, section.total.value) : safeMath.minus(total, section.total.value));
            }, 0);
        }

        function recalculateProductionGroupCategory (instance, sectionCode, groupName, categoryQuery, costStage) {
            instance.removeCategory(sectionCode, groupName, categoryQuery, costStage);

            underscore.each(instance.productionSchedules, function (productionSchedule) {
                productionSchedule.recalculateCategory(categoryQuery.code);

                underscore.each(productionSchedule.data.sections, function (section) {
                    if (section.costStage === productionSchedule.costStage) {
                        underscore.each(section.productCategoryGroups, function (group) {
                            var category = underscore.findWhere(group.productCategories, categoryQuery);

                            if (category) {
                                var startOffset = moment(productionSchedule.startDate).diff(instance.startDate, 'months');

                                recalculateCategory(instance, productionSchedule, startOffset, section, group, category);
                                recalculateGroup(instance, productionSchedule, section, group);
                                recalculateSection(instance, productionSchedule, section);
                            }
                        });
                    }
                });
            });

            instance.data.details.grossProfit = underscore.reduce(instance.data.sections, function (total, section) {
                return (section.code === 'INC' ? safeMath.plus(total, section.total.value) : safeMath.minus(total, section.total.value));
            }, 0);
        }

        function recalculateSection (instance, productionSchedule, section) {
            var productionSection = instance.getSection(section.code, instance.defaultCostStage);

            if (productionSection) {
                productionSection.total.value = underscore.reduce(productionSection.productCategoryGroups, function (total, group) {
                    return safeMath.plus(total, group.total.value);
                }, 0);

                productionSection.total.valuePerMonth = underscore
                    .chain(productionSection.productCategoryGroups)
                    .pluck('total')
                    .pluck('valuePerMonth')
                    .reduce(function (totalPerMonth, valuePerMonth) {
                        return (totalPerMonth ? underscore.map(valuePerMonth, function (value, index) {
                            return safeMath.plus(totalPerMonth[index], value);
                        }) : angular.copy(valuePerMonth));
                    })
                    .value();

                if (productionSchedule.type === 'livestock') {
                    productionSection.total.valuePerLSU = underscore.reduce(productionSection.productCategoryGroups, function (total, group) {
                        return safeMath.plus(total, group.total.valuePerLSU);
                    }, 0);
                }

                instance.data.details.grossProfit = (productionSection.code === 'INC' ?
                    safeMath.plus(instance.data.details.grossProfit, productionSection.total.value) :
                    safeMath.minus(instance.data.details.grossProfit, productionSection.total.value));
            }
        }

        function recalculateGroup (instance, productionSchedule, section, group) {
            var productionGroup = instance.getGroup(section.code, group.name, instance.defaultCostStage);

            if (productionGroup) {
                productionGroup.total.value = safeArrayMath.reduceProperty(productionGroup.productCategories, 'value');

                productionGroup.total.valuePerMonth = underscore
                    .chain(productionGroup.productCategories)
                    .pluck('valuePerMonth')
                    .reduce(function (totalPerMonth, valuePerMonth) {
                        return (totalPerMonth ? underscore.map(valuePerMonth, function (value, index) {
                            return safeMath.plus(totalPerMonth[index], value);
                        }) : angular.copy(valuePerMonth));
                    })
                    .value();

                if (productionSchedule.type === 'livestock') {
                    productionGroup.total.valuePerLSU = safeArrayMath.reduceProperty(productionGroup.productCategories, 'valuePerLSU');
                }
            }
        }

        function recalculateCategory (instance, productionSchedule, startOffset, section, group, category) {
            var productionGroupCategory = instance.addCategory(section.code, group.name, underscore.pick(category, ['code', 'name']), instance.defaultCostStage),
                stock = instance.findStock(category.name, productionSchedule.data.details.commodity);

            var productionCategory = underscore.extend({
                commodity: productionSchedule.commodityType,
                offset: startOffset,
                scheduleKey: productionSchedule.scheduleKey
            }, category);

            productionGroupCategory.per = category.per;
            productionGroupCategory.categories = productionGroupCategory.categories || [];
            productionGroupCategory.categories.push(productionCategory);

            if (stock) {
                productionGroupCategory.stock = productionGroupCategory.stock || stock;
            }

            productionGroupCategory.categoriesPerMonth = safeArrayMath.plus(underscore.reduce(Base.initializeArray(instance.numberOfMonths, 1), reduceArrayInRange(startOffset), Base.initializeArray(instance.numberOfMonths)), productionGroupCategory.categoriesPerMonth || Base.initializeArray(instance.numberOfMonths));

            // Value
            productionCategory.valuePerMonth = underscore.reduce(category.valuePerMonth, reduceArrayInRange(startOffset), Base.initializeArray(instance.numberOfMonths));
            productionCategory.value = safeMath.round(safeArrayMath.reduce(productionCategory.valuePerMonth), 2);

            productionGroupCategory.valuePerMonth = safeArrayMath.plus(productionCategory.valuePerMonth, productionGroupCategory.valuePerMonth || Base.initializeArray(instance.numberOfMonths));
            productionGroupCategory.value = safeMath.round(safeArrayMath.reduce(productionGroupCategory.valuePerMonth), 2);

            // Quantity
            productionCategory.quantityPerMonth = underscore.reduce(category.quantityPerMonth, reduceArrayInRange(startOffset), Base.initializeArray(instance.numberOfMonths));
            productionCategory.quantity = safeMath.round(safeArrayMath.reduce(productionCategory.quantityPerMonth), 2);

            productionGroupCategory.quantityPerMonth = safeArrayMath.plus(productionCategory.quantityPerMonth, productionGroupCategory.quantityPerMonth || Base.initializeArray(instance.numberOfMonths));
            productionGroupCategory.quantity = safeMath.round(safeArrayMath.reduce(productionGroupCategory.quantityPerMonth), 2);

            // Supply
            if (productionCategory.supplyPerMonth) {
                productionCategory.supplyPerMonth = underscore.reduce(category.supplyPerMonth, reduceArrayInRange(startOffset), Base.initializeArray(instance.numberOfMonths));
                productionCategory.supply = safeMath.round(safeArrayMath.reduce(productionCategory.supplyPerMonth), 2);

                productionGroupCategory.supplyPerMonth = safeArrayMath.plus(productionCategory.supplyPerMonth, productionGroupCategory.supplyPerMonth || Base.initializeArray(instance.numberOfMonths));
                productionGroupCategory.supply = safeMath.round(safeArrayMath.reduce(productionGroupCategory.supplyPerMonth), 2);
            }

            // Price Per Unit
            productionCategory.pricePerUnit = safeMath.round(safeMath.dividedBy(safeMath.dividedBy(productionCategory.value, productionCategory.supply || 1), productionCategory.quantity), 4);
            productionGroupCategory.pricePerUnit = safeMath.round(safeMath.dividedBy(safeMath.dividedBy(productionGroupCategory.value, productionGroupCategory.supply || 1), productionGroupCategory.quantity), 4);

            if (productionSchedule.type === 'livestock') {
                productionCategory.valuePerLSU = safeMath.dividedBy(safeMath.times(productionCategory.value, category.valuePerLSU), category.value);
                productionCategory.quantityPerLSU = safeMath.dividedBy(safeMath.times(productionCategory.quantity, category.quantityPerLSU), category.quantity);

                productionGroupCategory.valuePerLSU = safeMath.plus(productionGroupCategory.valuePerLSU, productionCategory.valuePerLSU);
                productionGroupCategory.quantityPerLSU = safeMath.plus(productionGroupCategory.quantityPerLSU, productionCategory.quantityPerLSU);
            } else {
                productionCategory.haPerMonth = underscore.reduce(Base.initializeArray(instance.numberOfMonths, productionSchedule.allocatedSize), reduceArrayInRange(startOffset), Base.initializeArray(instance.numberOfMonths));
                productionGroupCategory.haPerMonth = safeArrayMath.plus(productionCategory.haPerMonth, productionGroupCategory.haPerMonth || Base.initializeArray(instance.numberOfMonths));

                productionGroupCategory.valuePerHaPerMonth = safeArrayMath.round(safeArrayMath.dividedBy(productionGroupCategory.valuePerMonth, productionGroupCategory.haPerMonth), 2);
                productionGroupCategory.quantityPerHaPerMonth = safeArrayMath.round(safeArrayMath.dividedBy(productionGroupCategory.quantityPerMonth, productionGroupCategory.haPerMonth), 3);

                productionGroupCategory.valuePerHa = safeMath.round(safeMath.dividedBy(safeArrayMath.reduce(productionGroupCategory.valuePerHaPerMonth), safeArrayMath.count(productionGroupCategory.valuePerHaPerMonth)), 2);
                productionGroupCategory.quantityPerHa = safeMath.round(safeMath.dividedBy(safeArrayMath.reduce(productionGroupCategory.quantityPerHaPerMonth), safeArrayMath.count(productionGroupCategory.quantityPerHaPerMonth)), 3);
            }
        }

        return ProductionGroup;
    }]);

sdkModelProductionSchedule.factory('ProductionSchedule', ['Base', 'computedProperty', 'EnterpriseBudget', 'EnterpriseBudgetBase', 'Field', 'inheritModel', 'moment', 'privateProperty', 'readOnlyProperty', 'safeArrayMath', 'safeMath', 'underscore',
    function (Base, computedProperty, EnterpriseBudget, EnterpriseBudgetBase, Field, inheritModel, moment, privateProperty, readOnlyProperty, safeArrayMath, safeMath, underscore) {
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

                if (this.type === 'horticulture') {
                    startDate = moment(this.startDate);

                    this.data.details.establishedDate = (underscore.isUndefined(this.data.details.establishedDate) ?
                        (this.asset && this.asset.data.establishedDate ? this.asset.data.establishedDate : this.startDate) :
                        this.data.details.establishedDate);
                    var assetAge = (startDate.isAfter(this.data.details.establishedDate) ? startDate.diff(this.data.details.establishedDate, 'years') : 0);

                    if (assetAge !== this.data.details.assetAge) {
                        this.data.details.assetAge = assetAge;

                        this.recalculate();
                    }
                }
            });

            privateProperty(this, 'setAsset', function (asset) {
                this.asset = underscore.omit(asset, ['liabilities', 'productionSchedules']);
                this.assetId = this.asset.id;

                this.type = ProductionSchedule.typeByAsset[asset.type];
                this.data.details.fieldName = this.asset.data.fieldName;
                this.data.details.irrigated = (this.asset.data.irrigated === true);

                if (asset.data.crop) {
                    this.data.details.commodity = asset.data.crop;
                }

                if (this.type === 'horticulture') {
                    var startDate = moment(this.startDate);

                    this.data.details.establishedDate = this.asset.data.establishedDate || this.startDate;
                    this.data.details.assetAge = (startDate.isAfter(this.data.details.establishedDate) ?
                        startDate.diff(this.data.details.establishedDate, 'years') : 0);
                } else if (this.type === 'livestock') {
                    this.data.details.pastureType = (this.asset.data.intensified ? 'pasture' : 'grazing');

                    if (this.budget && this.budget.data.details.stockingDensity) {
                        this.setLivestockStockingDensity(this.budget.data.details.stockingDensity[this.data.details.pastureType]);
                    }
                }
                
                this.setSize(this.asset.data.plantedArea || this.asset.data.size);
            });
            
            privateProperty(this, 'setBudget', function (budget) {
                this.budget = EnterpriseBudget.new(budget);
                this.budgetUuid = this.budget.uuid;
                this.type = this.budget.assetType;

                this.data.budget = this.budget;
                this.data.details = underscore.extend(this.data.details, {
                    commodity: this.budget.commodityType,
                    grossProfit: 0
                });

                if (this.type === 'livestock') {
                    this.data.details = underscore.defaults(this.data.details, {
                        calculatedLSU: 0,
                        grossProfitPerLSU: 0,
                        herdSize: this.budget.data.details.herdSize || 0,
                        stockingDensity: 0,
                        multiplicationFactor: 0
                    });
                } else {
                    this.data.details = underscore.extend(this.data.details, underscore.pick(this.budget.data.details, (this.type === 'horticulture' ?
                        ['maturityFactor', 'cultivar'] :
                        ['cultivar'])));
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
                    this.data.details.calculatedLSU = safeMath.dividedBy(this.allocatedSize, this.data.details.stockingDensity);

                    if (this.budget) {
                        this.data.details.multiplicationFactor = (this.budget.data.details.herdSize ? safeMath.dividedBy(this.data.details.herdSize, this.budget.data.details.herdSize) : 1);
                        this.data.details.grossProfit = safeMath.times(this.budget.data.details.grossProfit, this.data.details.multiplicationFactor);
                        this.data.details.grossProfitPerLSU = (this.data.details.calculatedLSU ? safeMath.dividedBy(this.data.details.grossProfit, this.data.details.calculatedLSU) : 0);
                    }
                } else if (this.budget) {
                    this.data.details.grossProfit = safeMath.times(this.budget.data.details.grossProfit, this.data.details.size);
                }

                this.recalculate();
            });

            privateProperty(this, 'adjustCategory', function (sectionCode, categoryQuery, costStage, property) {
                return adjustCategory(this, sectionCode, categoryQuery, costStage, property);
            });

            privateProperty(this, 'updateCategoryStock', function (sectionCode, categoryCode, stock) {
                updateCategoryStock(this, sectionCode, categoryCode, stock);
            });

            privateProperty(this, 'applyMaturityFactor', function (sectionCode, value) {
                var factor = (this.type === 'horticulture' && this.costStage === 'Yearly' && this.data.details.maturityFactor && this.data.details.maturityFactor[sectionCode] ?
                    (this.data.details.maturityFactor[sectionCode][this.data.details.assetAge - 1] || 0) : 100);

                return safeMath.chain(value)
                    .times(factor)
                    .dividedBy(100)
                    .toNumber();
            });

            privateProperty(this, 'reverseMaturityFactor', function (sectionCode, value) {
                var factor = (this.type === 'horticulture' && this.costStage === 'Yearly' && this.data.details.maturityFactor && this.data.details.maturityFactor[sectionCode] ?
                    (this.data.details.maturityFactor[sectionCode][this.data.details.assetAge - 1] || 0) : 100);

                return safeMath.chain(value)
                    .times(100)
                    .dividedBy(factor)
                    .toNumber();
            });

            privateProperty(this, 'recalculate', function () {
                recalculateProductionSchedule(this);
            });

            privateProperty(this, 'recalculateCategory', function (categoryCode) {
                recalculateProductionScheduleCategory(this, categoryCode);
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
                return safeMath.round(this.data.details.size, 2);
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

            privateProperty(this, 'inDateRange', function (rangeStart, rangeEnd) {
                rangeStart = moment(rangeStart);
                rangeEnd = moment(rangeEnd);

                var scheduleStart = moment(this.startDate),
                    scheduleEnd = moment(this.endDate);

                return (scheduleStart.isSame(rangeStart) && scheduleEnd.isSame(rangeEnd)) ||
                    (scheduleStart.isSameOrAfter(rangeStart) && scheduleStart.isBefore(rangeEnd)) ||
                    (scheduleEnd.isAfter(rangeStart) && scheduleEnd.isSameOrBefore(rangeEnd));
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

        function adjustCategory (instance, sectionCode, categoryQuery, costStage, property) {
            var categoryCode = (underscore.isObject(categoryQuery) ? categoryQuery.code : categoryQuery),
                productionCategory = instance.getCategory(sectionCode, categoryCode, costStage),
                budgetCategory = instance.budget.getCategory(sectionCode, categoryCode, costStage),
                budgetProperty = property;

            if (productionCategory && budgetCategory) {
                switch (property) {
                    case 'pricePerUnit':
                        budgetCategory.pricePerUnit = productionCategory.pricePerUnit;
                        break;
                    case 'quantity':
                        budgetCategory.quantity = safeMath.dividedBy(instance.reverseMaturityFactor(sectionCode, productionCategory.quantity), (instance.type === 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize));
                        break;
                    case 'quantityPerHa':
                        budgetCategory.quantity = instance.reverseMaturityFactor(sectionCode, productionCategory.quantityPerHa);
                        budgetProperty = 'quantity';
                        break;
                    case 'quantityPerLSU':
                        budgetCategory.quantityPerLSU = productionCategory.quantityPerLSU;
                        break;
                    case 'stock':
                        var stock = instance.findStock(productionCategory.name, instance.commodityType),
                            reference = [instance.scheduleKey, (sectionCode === 'INC' ? 'Sale' : 'Consumption')].join('/'),
                            ignoredKeys = ['quantity', 'quantityPerMonth'];

                        underscore.extend(budgetCategory, underscore.chain(stock.inventoryInRange(instance.startDate, instance.endDate))
                            .reduce(function (resultCategory, monthly, index) {
                                underscore.chain(monthly.entries)
                                    .filter(function (entry) {
                                        return s.include(entry.reference, reference);
                                    })
                                    .each(function (entry) {
                                        if (budgetCategory.supplyUnit && entry.quantityUnit === budgetCategory.supplyUnit) {
                                            resultCategory.supply = safeMath.plus(resultCategory.supply, entry.quantity);
                                            resultCategory.quantity = safeMath.plus(resultCategory.quantity, entry.rate);
                                        }

                                        resultCategory.valuePerMonth[index] = safeMath.plus(resultCategory.valuePerMonth[index], entry.value);
                                    });

                                return resultCategory;
                            }, {
                                valuePerMonth: Base.initializeArray(instance.budget.numberOfMonths)
                            })
                            .mapObject(function (value, key) {
                                return (underscore.contains(ignoredKeys, key) ? value : (underscore.isArray(value) ? instance.budget.unshiftMonthlyArray(underscore.map(value, function (monthValue) {
                                    return safeMath.dividedBy(instance.reverseMaturityFactor(sectionCode, monthValue), (instance.type === 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize));
                                })) : safeMath.dividedBy(instance.reverseMaturityFactor(sectionCode, value), (instance.type === 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize))));
                            })
                            .value());

                        budgetProperty = 'valuePerMonth';
                        break;
                    case 'supply':
                        budgetCategory.supply = safeMath.dividedBy(productionCategory.supply, (instance.type === 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize));
                        break;
                    case 'value':
                        budgetCategory.value = safeMath.dividedBy(instance.reverseMaturityFactor(sectionCode, productionCategory.value), (instance.type === 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize));
                        break;
                    case 'valuePerHa':
                        budgetCategory.value = instance.reverseMaturityFactor(sectionCode, productionCategory.valuePerHa);
                        budgetProperty = 'value';
                        break;
                    case 'valuePerLSU':
                        budgetCategory.valuePerLSU = productionCategory.valuePerLSU;
                        break;
                    case 'valuePerMonth':
                        var totalFilled = safeArrayMath.count(productionCategory.valuePerMonth),
                            countFilled = 0;

                        budgetCategory.value = safeMath.round(safeMath.dividedBy(instance.reverseMaturityFactor(sectionCode, safeArrayMath.reduce(productionCategory.valuePerMonth)), (instance.type === 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize)), 4);
                        budgetCategory.valuePerMonth = instance.budget.unshiftMonthlyArray(underscore.reduce(productionCategory.valuePerMonth, function (totals, value, index) {
                            if (value > 0) {
                                totals[index] = (index === totals.length - 1 || countFilled === totalFilled - 1 ?
                                    safeMath.minus(budgetCategory.value, safeArrayMath.reduce(totals)) :
                                    safeMath.round(safeMath.dividedBy(instance.reverseMaturityFactor(sectionCode, value), (instance.type === 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize)), 4));
                                countFilled++;
                            }
                            return totals;
                        }, Base.initializeArray(instance.budget.numberOfMonths)));
                        break;
                    default:
                        budgetCategory[property] = productionCategory[property];
                }

                instance.budget.adjustCategory(sectionCode, categoryCode, costStage, budgetProperty);

                recalculateProductionScheduleCategory(instance, categoryCode);

                if (property !== 'stock') {
                    updateCategoryStock(instance, sectionCode, categoryCode);
                }

                instance.$dirty = true;

                return productionCategory[property];
            }
        }

        function updateStockLedgerEntry (instance, stock, ledgerEntry, formattedDate, action, category, index, forceUpdate) {
            var reference = [instance.scheduleKey, action, formattedDate].join('/');

            if (underscore.isUndefined(ledgerEntry)) {
                ledgerEntry = underscore.extend({
                    action: action,
                    date: formattedDate,
                    commodity: instance.commodityType,
                    reference: reference,
                    value: category.valuePerMonth[index]
                }, (category.unit === 'Total' ? {} :
                    underscore.extend({
                        price: category.pricePerUnit,
                        priceUnit: category.unit
                    }, (underscore.isUndefined(category.supplyPerMonth) ? {
                        quantity: category.quantityPerMonth[index],
                        quantityUnit: category.unit
                    } : {
                        quantity: category.supplyPerMonth[index],
                        quantityUnit: category.supplyUnit,
                        rate: category.quantity
                    }))));

                stock.addLedgerEntry(ledgerEntry);
            } else if (!ledgerEntry.edited || forceUpdate) {
                underscore.extend(ledgerEntry, underscore.extend({
                    commodity: instance.commodityType,
                    reference: reference,
                    value: category.valuePerMonth[index]
                }, (category.unit === 'Total' ? {} :
                    underscore.extend({
                        price: category.pricePerUnit,
                        priceUnit: category.unit
                    }, (underscore.isUndefined(category.supplyPerMonth) ? {
                        quantity: category.quantityPerMonth[index],
                        quantityUnit: category.unit
                    } : {
                        quantity: category.supplyPerMonth[index],
                        quantityUnit: category.supplyUnit,
                        rate: category.quantity
                    })))));

                if (ledgerEntry.liabilityUuid) {
                    var liability = underscore.findWhere(stock.liabilities, {uuid: ledgerEntry.liabilityUuid});

                    updateLedgerEntryLiability(liability, category.name, formattedDate, action, category.valuePerMonth[index]);
                }
            }

            return ledgerEntry;
        }

        function updateCategoryStock (instance, sectionCode, categoryCode, stock) {
            var category = instance.getCategory(sectionCode, categoryCode, instance.costStage);

            if (category) {
                var forceInput = !underscore.isUndefined(stock);

                stock = stock || instance.findStock(category.name, instance.commodityType);

                if (stock) {
                    var inputAction = (sectionCode === 'INC' ? 'Production' : 'Purchase'),
                        outputAction = (sectionCode === 'INC' ? 'Sale' : 'Consumption');

                    // Remove entries
                    var unassignedLiabilities = underscore.chain(category.valuePerMonth)
                        .reduce(function (results, value, index) {
                            if (value === 0) {
                                var formattedDate = moment(instance.startDate).add(index, 'M').format('YYYY-MM-DD'),
                                    inputLedgerEntry = stock.findLedgerEntry({date: formattedDate, action: inputAction, reference: instance.scheduleKey}),
                                    outputLedgerEntry = stock.findLedgerEntry({date: formattedDate, action: outputAction, reference: instance.scheduleKey});

                                if (inputLedgerEntry && inputLedgerEntry.liabilityUuid) {
                                    results.push(underscore.findWhere(stock.liabilities, {uuid: inputLedgerEntry.liabilityUuid}));
                                }

                                stock.removeLedgerEntry(inputLedgerEntry);
                                stock.removeLedgerEntry(outputLedgerEntry);
                            }

                            return results;
                        }, [])
                        .compact()
                        .value();

                    // Add entries
                    underscore.each(category.valuePerMonth, function (value, index) {
                        if (value > 0) {
                            var formattedDate = moment(instance.startDate).add(index, 'M').format('YYYY-MM-DD'),
                                inputLedgerEntry = stock.findLedgerEntry({date: formattedDate, action: inputAction, reference: instance.scheduleKey}),
                                outputLedgerEntry = stock.findLedgerEntry({date: formattedDate, action: outputAction, reference: instance.scheduleKey});

                            if (sectionCode === 'EXP' || instance.assetType !== 'livestock') {
                                inputLedgerEntry = updateStockLedgerEntry(instance, stock, inputLedgerEntry, formattedDate, inputAction, category, index, true);

                                if (underscore.size(unassignedLiabilities) > 0 && underscore.isUndefined(inputLedgerEntry.liabilityUuid) && inputAction === 'Purchase') {
                                    var liability = unassignedLiabilities.shift();

                                    updateLedgerEntryLiability(liability, category.name, formattedDate, inputAction, value);

                                    inputLedgerEntry.liabilityUuid = liability.uuid;
                                }
                            }

                            updateStockLedgerEntry(instance, stock, outputLedgerEntry, formattedDate, outputAction, category, index, true);
                        }
                    });

                    stock.recalculateLedger();
                }
            }
        }

        function updateLedgerEntryLiability (liability, name, formattedDate, inputAction, value) {
            if (liability) {
                liability.name = name + ' ' + inputAction + ' ' + formattedDate;
                liability.creditLimit = value;
                liability.openingDate = formattedDate;
                liability.startDate = formattedDate;

                liability.resetWithdrawals();
                liability.setWithdrawalInMonth(value, formattedDate);
            }
        }

        function recalculateProductionSchedule (instance) {
            if (instance.budget) {
                instance.budget.recalculate();

                instance.data.sections = [];
                instance.clearCache();

                underscore.each(instance.budget.data.sections, function (section) {
                    if (section.costStage === instance.costStage) {
                        underscore.each(section.productCategoryGroups, function (group) {
                            underscore.each(group.productCategories, function (category) {
                                recalculateCategory(instance, section, group, category);
                            });

                            recalculateGroup(instance, section, group);
                        });

                        recalculateSection(instance, section);
                    }
                });

                instance.sortSections();

                recalculateGrossProfit(instance);
            }
        }

        function recalculateProductionScheduleCategory (instance, categoryCode) {
            if (instance.budget) {
                instance.budget.recalculateCategory(categoryCode);

                underscore.each(instance.budget.data.sections, function (section) {
                    if (section.costStage === instance.costStage) {
                        underscore.each(section.productCategoryGroups, function (group) {
                            underscore.each(group.productCategories, function (category) {
                                if (category.code === categoryCode) {
                                    recalculateCategory(instance, section, group, category);
                                    recalculateGroup(instance, section, group);
                                    recalculateSection(instance, section);
                                }
                            });
                        });
                    }
                });

                recalculateGrossProfit(instance);
            }
        }

        function recalculateGrossProfit (instance) {
            instance.data.details.grossProfit = underscore.reduce(instance.data.sections, function (total, section) {
                return (section.code === 'INC' ? safeMath.plus(total, section.total.value) : safeMath.minus(total, section.total.value));
            }, 0);

            if (instance.type === 'livestock') {
                instance.data.details.grossProfitPerLSU = safeMath.dividedBy(instance.data.details.grossProfit, instance.data.details.calculatedLSU);
            }
        }

        function recalculateSection (instance, section) {
            var productionSection = instance.getSection(section.code, section.costStage);

            if (productionSection) {
                productionSection.total.value = underscore.reduce(productionSection.productCategoryGroups, function (total, group) {
                    return safeMath.plus(total, group.total.value);
                }, 0);

                productionSection.total.valuePerMonth = underscore
                    .chain(productionSection.productCategoryGroups)
                    .pluck('total')
                    .pluck('valuePerMonth')
                    .reduce(function (total, valuePerMonth) {
                        return (total ? underscore.map(valuePerMonth, function (value, index) {
                            return safeMath.plus(total[index], value);
                        }) : angular.copy(valuePerMonth));
                    })
                    .value();

                productionSection.total.quantityPerMonth = underscore
                    .chain(productionSection.productCategoryGroups)
                    .pluck('total')
                    .pluck('quantityPerMonth')
                    .reduce(function (total, quantityPerMonth) {
                        return (total ? underscore.map(quantityPerMonth, function (value, index) {
                            return safeMath.plus(total[index], value);
                        }) : angular.copy(quantityPerMonth));
                    })
                    .value();

                if (instance.type === 'livestock') {
                    productionSection.total.valuePerLSU = underscore.reduce(productionSection.productCategoryGroups, function (total, group) {
                        return safeMath.plus(total, group.total.valuePerLSU);
                    }, 0);
                }
            }
        }

        function recalculateGroup (instance, section, group) {
            var productionGroup = instance.getGroup(section.code, group.name, section.costStage);

            if (productionGroup) {
                productionGroup.total.value = underscore.reduce(productionGroup.productCategories, function (total, category) {
                    return safeMath.plus(total, category.value);
                }, 0);

                productionGroup.total.valuePerMonth = underscore
                    .chain(productionGroup.productCategories)
                    .pluck('valuePerMonth')
                    .reduce(function (total, valuePerMonth) {
                        return (total ? underscore.map(valuePerMonth, function (value, index) {
                            return safeMath.plus(total[index], value);
                        }) : angular.copy(valuePerMonth));
                    })
                    .value();

                productionGroup.total.quantityPerMonth = underscore
                    .chain(productionGroup.productCategories)
                    .pluck('quantityPerMonth')
                    .reduce(function (total, quantityPerMonth) {
                        return (total ? underscore.map(quantityPerMonth, function (value, index) {
                            return safeMath.plus(total[index], value);
                        }) : angular.copy(quantityPerMonth));
                    })
                    .value();

                if (instance.type === 'livestock') {
                    productionGroup.total.valuePerLSU = underscore.reduce(productionGroup.productCategories, function (total, category) {
                        return safeMath.plus(total, category.valuePerLSU);
                    }, 0);
                }
            }
        }

        function recalculateCategory (instance, section, group, category) {
            var productionCategory = instance.addCategory(section.code, group.name, category.code, section.costStage);

            productionCategory.name = category.name;
            productionCategory.pricePerUnit = category.pricePerUnit;

            if (instance.type === 'livestock') {
                productionCategory.valuePerLSU = safeMath.plus(productionCategory.valuePerLSU, safeMath.times(category.valuePerLSU, instance.data.details.multiplicationFactor));
                productionCategory.quantityPerLSU = category.quantity;

                if (group.code === 'INC-LSS') {
                    productionCategory.stock = (!underscore.isUndefined(category.stock) ? category.stock : (category.name === instance.getRepresentativeAnimal() ? instance.data.details.herdSize : 0));
                    productionCategory.stockPrice = (!underscore.isUndefined(category.stockPrice) ? category.stockPrice : category.pricePerUnit);
                }
            } else {
                productionCategory.quantityPerHa = instance.applyMaturityFactor(section.code, category.quantity);

                if (section.code === 'EXP') {
                    productionCategory.valuePerHa = instance.applyMaturityFactor(section.code, category.value);
                }
            }

            if (section.code === 'INC' && productionCategory.supplyUnit && productionCategory.unit !== category.unit) {
                category.supplyUnit = productionCategory.supplyUnit;
                category.supply = category.quantity;
                category.quantity = 1;
                category.unit = productionCategory.unit;
            }

            if (!underscore.isUndefined(category.supplyPerMonth)) {
                productionCategory.supply = safeMath.times(category.supply, (instance.type === 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize));

                productionCategory.quantityPerMonth = underscore.map(instance.budget.shiftMonthlyArray(category.quantityPerMonth), function (value) {
                    return safeMath.round(instance.applyMaturityFactor(section.code, value), 2);
                });

                productionCategory.supplyPerMonth = underscore.map(instance.budget.shiftMonthlyArray(category.supplyPerMonth), function (value) {
                    var productionValue = safeMath.times(instance.applyMaturityFactor(section.code, value), (instance.type === 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize));

                    return (category.supplyUnit === 'hd' ? Math.round(productionValue) : productionValue);
                });
            } else {
                productionCategory.quantityPerMonth = underscore.map(instance.budget.shiftMonthlyArray(category.quantityPerMonth), function (value) {
                    return safeMath.round(safeMath.times(instance.applyMaturityFactor(section.code, value), (instance.type === 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize)), 2);
                });
            }

            productionCategory.quantity = safeArrayMath.reduce(productionCategory.quantityPerMonth);

            productionCategory.valuePerMonth = underscore.map(instance.budget.shiftMonthlyArray(category.valuePerMonth), function (value) {
                return safeMath.round(safeMath.times(instance.applyMaturityFactor(section.code, value), (instance.type === 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize)), 2);
            });

            productionCategory.value = safeArrayMath.reduce(productionCategory.valuePerMonth);
        }

        inheritModel(ProductionSchedule, EnterpriseBudgetBase);

        readOnlyProperty(ProductionSchedule, 'productionScheduleTypes', {
            crop: 'Crop',
            horticulture: 'Horticulture',
            livestock: 'Livestock'
        });

        readOnlyProperty(ProductionSchedule, 'allowedLandUse', underscore.difference(Field.landClasses, [
            'Building',
            'Built-up',
            'Erosion',
            'Forest',
            'Homestead',
            'Mining',
            'Non-vegetated',
            'Water',
            'Water (Seasonal)',
            'Wetland']));

        readOnlyProperty(ProductionSchedule, 'allowedAssets', ['crop', 'cropland', 'pasture', 'permanent crop']);

        readOnlyProperty(ProductionSchedule, 'typeByAsset', {
            'crop': 'crop',
            'cropland': 'crop',
            'pasture': 'livestock',
            'permanent crop': 'horticulture'
        });

        privateProperty(ProductionSchedule, 'getTypeTitle', function (type) {
            return ProductionSchedule.productionScheduleTypes[type] || '';
        });

        ProductionSchedule.validates({
            assetId: {
                requiredIf: function (value, instance) {
                    return !underscore.isUndefined(instance.id);
                },
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
