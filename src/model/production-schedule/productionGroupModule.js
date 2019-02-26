var sdkModelProductionGroup = angular.module('ag.sdk.model.production-group', ['ag.sdk.library', 'ag.sdk.utilities', 'ag.sdk.model']);

sdkModelProductionGroup.factory('ProductionGroup', ['Base', 'computedProperty', 'EnterpriseBudgetBase', 'inheritModel', 'moment', 'naturalSort', 'privateProperty', 'ProductionSchedule', 'promiseService', 'safeArrayMath', 'safeMath', 'underscore',
    function (Base, computedProperty, EnterpriseBudgetBase, inheritModel, moment, naturalSort, privateProperty, ProductionSchedule, promiseService, safeArrayMath, safeMath, underscore) {
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

            privateProperty(this, 'removeProductionSchedule', function (productionSchedule) {
                removeProductionSchedule(this, productionSchedule);
            });

            computedProperty(this, 'costStage', function () {
                return this.defaultCostStage;
            });

            computedProperty(this, 'options', function () {
                return options;
            });

            // Stock
            privateProperty(this, 'addStock', function (stock) {
                addStock(this, stock);
            });

            privateProperty(this, 'extractStock', function (stockPickerFn) {
                return extractStock(this, stockPickerFn);
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

            updateSchedules(instance);

            productionSchedule.replaceAllStock(instance.stock);
        }

        function removeProductionSchedule (instance, productionSchedule) {
            instance.productionSchedules = underscore.without(instance.productionSchedules, productionSchedule);

            updateSchedules(instance);
        }

        function updateSchedules (instance) {
            instance.commodities = underscore.chain(instance.productionSchedules)
                .pluck('commodityType')
                .uniq()
                .compact()
                .value()
                .sort(naturalSort);

            instance.data.details.size = safeArrayMath.reduceProperty(instance.productionSchedules, 'allocatedSize');
        }

        // Stock
        function addAllStock (instance, inventory) {
            underscore.each(underscore.isArray(inventory) ? inventory : [inventory], function (stock) {
                addStock(instance, stock);
            });
        }

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

        function extractStock (instance, stockPickerFn) {
            return promiseService.chain(function (promises) {
                underscore.each(instance.productionSchedules, function (productionSchedule) {
                    promises.push(function () {
                        return productionSchedule.extractStock(stockPickerFn).then(function (stock) {
                            addAllStock(instance, stock);
                        });
                    });
                });
            }).then(function () {
                return instance.stock;
            });
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

                    var categoriesAffectedPerMonth = underscore.reduce(productionGroupCategory.categories, function (result, category) {
                        return safeArrayMath.plus(result, underscore.map(category[property], function (value) {
                            return (value !== 0 ? 1 : 0);
                        }));
                    }, Base.initializeArray(instance.numberOfMonths));

                    underscore.each(productionGroupCategory.categories, function (category) {
                        var productionSchedule = categorySchedules[category.scheduleKey],
                            productionCategory = productionSchedule && productionSchedule.getCategory(sectionCode, categoryQuery.code, productionSchedule.costStage);

                        if (productionCategory) {
                            underscore.reduce(productionGroupCategory[property], function (result, value, index) {
                                if (value !== oldValuePerMonth[index]) {
                                    var indexOffset = index - category.offset,
                                        categoriesAffected = (categoriesAffectedPerMonth[index] !== 0 ?
                                            categoriesAffectedPerMonth[index] :
                                            productionGroupCategory.categoriesPerMonth[index]);

                                    if (indexOffset >= 0 && indexOffset < result.length && (categoriesAffectedPerMonth[index] === 0 || result[indexOffset] > 0)) {
                                        result[indexOffset] = safeMath.dividedBy(value, categoriesAffected);
                                    }
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
                assetType = (group.code === 'INC-LSS' ? 'livestock' : 'stock'),
                stock = instance.findStock(assetType, category.name, productionSchedule.data.details.commodity);

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
