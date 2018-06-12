var sdkModelProductionSchedule = angular.module('ag.sdk.model.production-schedule', ['ag.sdk.library', 'ag.sdk.utilities', 'ag.sdk.model']);

sdkModelProductionSchedule.factory('ProductionGroup', ['Base', 'computedProperty', 'EnterpriseBudgetBase', 'inheritModel', 'moment', 'naturalSort', 'privateProperty', 'ProductionSchedule', 'safeMath', 'underscore',
    function (Base, computedProperty, EnterpriseBudgetBase, inheritModel, moment, naturalSort, privateProperty, ProductionSchedule, safeMath, underscore) {
        function ProductionGroup (attrs, options) {
            options = options || {};

            EnterpriseBudgetBase.apply(this, arguments);

            Base.initializeObject(this.data, 'details', {});
            Base.initializeObject(this.data.details, 'grossProfit', 0);
            Base.initializeObject(this.data.details, 'size', 0);

            this.commodities = [];
            this.productionSchedules = [];
            this.stock = [];

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

            privateProperty(this, 'addStock', function (stock) {
                addStock(this, stock);
            });

            privateProperty(this, 'replaceAllStock', function (stock) {
                replaceAllStock(this, stock);
            });

            privateProperty(this, 'removeStock', function (stock) {
                removeStock(this, stock);
            });

            computedProperty(this, 'options', function () {
                return options;
            });

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

            replaceAllStock(this, attrs.stock || []);

            underscore.each(attrs.productionSchedules, this.addProductionSchedule, this);

            this.recalculate();
        }

        inheritModel(ProductionGroup, EnterpriseBudgetBase);

        function addProductionSchedule (instance, schedule) {
            instance.productionSchedules.push(schedule);
            instance.commodities = underscore.chain(instance.commodities)
                .union([schedule.commodityType])
                .uniq()
                .value()
                .sort(naturalSort);

            instance.data.details.size = underscore.reduce(instance.productionSchedules, reduceProperty('allocatedSize'), 0);
        }

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

        function addStock (instance, stock) {
            if (stock && underscore.isArray(stock.data.ledger)) {
                instance.stock = underscore.chain(instance.stock)
                    .reject(function (item) {
                        return item.assetKey === stock.assetKey;
                    })
                    .union([stock])
                    .value();

                instance.recalculate();
            }
        }

        function removeStock (instance, stock) {
            instance.stock = underscore.chain(instance.stock)
                .reject(function (item) {
                    return item.assetKey === stock.assetKey;
                })
                .value();

            instance.recalculate();
        }

        function replaceAllStock (instance, stock) {
            instance.stock = underscore.filter(stock, function (item) {
                return item && underscore.isArray(item.data.ledger);
            });

            instance.recalculate();
        }

        function adjustCategory (instance, sectionCode, categoryQuery, costStage, property) {
            var productionCategory = instance.getCategory(sectionCode, categoryQuery, costStage),
                value = 0;

            if (productionCategory && !underscore.isUndefined(productionCategory[property])) {
                var totalSize = underscore.reduce(productionCategory.categories, reduceProperty('size'), 0);

                if (underscore.contains(['valuePerLSU', 'quantityPerLSU'], property)) {
                    value = safeMath.dividedBy(underscore.reduce(productionCategory.categories, reduceProperty(property), 0), productionCategory.categories.length);
                } else if (underscore.contains(['value', 'quantity'], property)) {
                    value = underscore.reduce(productionCategory[property + 'PerMonth'], reduceValue, 0);
                } else if (property === 'supply') {
                    value = underscore.reduce(productionCategory.categories, reduceProperty('supply'), 0);
                } else if (property === 'pricePerUnit') {
                    value = safeMath.chain(productionCategory.value)
                        .dividedBy(productionCategory.quantity)
                        .dividedBy(productionCategory.supply || 1)
                        .round(2)
                        .toNumber();
                } else if (property === 'valuePerHa') {
                    value = safeMath.chain(productionCategory.value)
                        .dividedBy(totalSize)
                        .round(2)
                        .toNumber();
                } else if (property === 'quantityPerHa') {
                    value = safeMath.chain(productionCategory.quantity)
                        .dividedBy(totalSize)
                        .round(2)
                        .toNumber();
                }

                var ratio = safeMath.dividedBy(productionCategory[property], value),
                    affectedProductionSchedules = underscore.reject(instance.productionSchedules, function (productionSchedule) {
                        var category = productionSchedule.getCategory(sectionCode, categoryQuery.code, productionSchedule.costStage);

                        return underscore.isUndefined(category) || category.name !== categoryQuery.name;
                    });

                if (property !== 'schedule') {
                    var remainder = productionCategory[property];

                    underscore.each(affectedProductionSchedules, function (productionSchedule, index) {
                        var category = productionSchedule.getCategory(sectionCode, categoryQuery.code, productionSchedule.costStage);

                        if (value === 0) {
                            var size = (productionSchedule.type === 'livestock' ? productionSchedule.data.details.herdSize : productionSchedule.data.details.size);

                            category[property] = safeMath.times(safeMath.dividedBy(productionCategory[property], totalSize), size);
                        } else if (underscore.isFinite(ratio) && !underscore.isUndefined(category[property])) {
                            category[property] = safeMath.times(category[property], ratio);
                        } else {
                            category[property] = (index < affectedProductionSchedules.length - 1 ? safeMath.dividedBy(category[property], affectedProductionSchedules.length) : remainder);
                        }

                        remainder = safeMath.minus(remainder, productionSchedule.adjustCategory(sectionCode, categoryQuery.code, productionSchedule.costStage, property));
                    });
                } else if (property === 'schedule') {
                    var valuePerMonth = underscore.reduce(productionCategory.schedule, function (valuePerMonth, allocation, index) {
                        valuePerMonth[index] = safeMath.chain(productionCategory.value)
                            .times(allocation)
                            .dividedBy(100)
                            .toNumber();

                        return valuePerMonth;
                    }, initializeArray(instance.numberOfMonths));

                    underscore.each(valuePerMonth, function (value, index) {
                        var categoryCount = underscore.chain(productionCategory.categories)
                            .filter(function (category) {
                                return index >= category.offset && index < category.offset + category.valuePerMonth.length;
                            })
                            .size()
                            .value();

                        underscore.each(affectedProductionSchedules, function (productionSchedule) {
                            var startOffset = moment(productionSchedule.startDate).diff(instance.startDate, 'months'),
                                category = productionSchedule.getCategory(sectionCode, categoryQuery.code, productionSchedule.costStage),
                                modIndex = (category.valuePerMonth.length - startOffset + index) % category.valuePerMonth.length;

                            category.valuePerMonth[modIndex] = safeMath.dividedBy(value, categoryCount);
                        });
                    });

                    underscore.each(affectedProductionSchedules, function (productionSchedule) {
                        var startOffset = moment(productionSchedule.startDate).diff(instance.startDate, 'months'),
                            category = productionSchedule.getCategory(sectionCode, categoryQuery.code, productionSchedule.costStage);

                        category.value = underscore.reduce(category.valuePerMonth, reduceValue, 0);

                        category.schedule = underscore.map(category.valuePerMonth, function (value) {
                            return (category.value > 0 ? safeMath.chain(value)
                                .times(100)
                                .dividedBy(category.value)
                                .toNumber() : 0);
                        });

                        productionSchedule.adjustCategory(sectionCode, categoryQuery.code, productionSchedule.costStage, property, startOffset);
                    });
                }
            }
        }

        function initializeArray (size) {
            return underscore.range(size).map(function () {
                return 0;
            });
        }

        function reduceValue (total, value) {
            return safeMath.plus(total, value);
        }

        function reduceProperty (property) {
            return function (total, obj) {
                return safeMath.plus(total, obj[property]);
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
                var startOffset = moment(productionSchedule.startDate).diff(instance.startDate, 'months'),
                    size = safeMath.chain(productionSchedule.type === 'livestock' ? productionSchedule.data.details.herdSize : productionSchedule.data.details.size)
                        .dividedBy(productionSchedule.numberOfMonths)
                        .times(safeMath.minus(productionSchedule.numberOfMonths, Math.abs(startOffset)))
                        .toNumber();

                productionSchedule.recalculate();

                underscore.each(productionSchedule.data.sections, function (section) {
                    if (section.costStage === productionSchedule.costStage) {
                        underscore.each(section.productCategoryGroups, function (group) {
                            underscore.each(group.productCategories, function (category) {
                                recalculateCategory(instance, productionSchedule, startOffset, size, section, group, category);
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
                                var startOffset = moment(productionSchedule.startDate).diff(instance.startDate, 'months'),
                                    size = safeMath.chain(productionSchedule.type === 'livestock' ? productionSchedule.data.details.herdSize : productionSchedule.data.details.size)
                                        .dividedBy(productionSchedule.numberOfMonths)
                                        .times(safeMath.minus(productionSchedule.numberOfMonths, Math.abs(startOffset)))
                                        .toNumber();

                                recalculateCategory(instance, productionSchedule, startOffset, size, section, group, category);
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
                productionGroup.total.value = underscore.reduce(productionGroup.productCategories, reduceProperty('value'), 0);

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
                    productionGroup.total.valuePerLSU = underscore.reduce(productionGroup.productCategories, reduceProperty('valuePerLSU'), 0);
                }
            }
        }

        function recalculateCategory (instance, productionSchedule, startOffset, size, section, group, category) {
            var productionCategory = instance.addCategory(section.code, group.name, underscore.pick(category, ['code', 'name']), instance.defaultCostStage),
                stock = underscore.find(instance.stock, function (stock) {
                    return stock.data.category === category.name && (underscore.isUndefined(stock.data.type) || stock.data.type === productionSchedule.data.details.commodity);
                });

            productionCategory.per = category.per;
            productionCategory.categories = productionCategory.categories || [];
            productionCategory.categories.push(underscore.extend({
                commodity: productionSchedule.commodityType,
                offset: startOffset,
                size: size
            }, category));

            if (stock) {
                if (underscore.isUndefined(productionCategory.stock)) {
                    var ignoredActions = underscore.union(stock.actions[(section.code === 'INC' ? 'credit' : 'debit')], ['Death', 'Consumption', 'Internal', 'Household', 'Retain']);

                    productionCategory.stock = stock;

                    underscore.extend(productionCategory, underscore.chain(stock.data.ledger)
                        .reject(function (ledgerEntry) {
                            var entryDate = moment(ledgerEntry.date);

                            return ledgerEntry.deleted ||
                                (ledgerEntry.commodity && !underscore.contains(instance.commodities, ledgerEntry.commodity)) ||
                                entryDate.isBefore(instance.startDate) ||
                                entryDate.isSameOrAfter(instance.endDate) ||
                                underscore.some(ignoredActions, function (action) {
                                    return s.include(ledgerEntry.action, action);
                                });
                        })
                        .reduce(function (result, ledgerEntry) {
                            result.value = safeMath.plus(result.value, ledgerEntry.value);
                            result.quantity = safeMath.plus(result.quantity, ledgerEntry.quantity);

                            return result;
                        }, {
                            value: 0,
                            quantity: 0
                        })
                        .value());
                }
            } else {
                // Value
                productionCategory.valuePerMonth = underscore.reduce(category.valuePerMonth, reduceArrayInRange(startOffset), productionCategory.valuePerMonth || initializeArray(instance.numberOfMonths));
                productionCategory.value = safeMath.round(underscore.reduce(productionCategory.valuePerMonth, reduceValue, 0), 2);

                // Quantity
                productionCategory.quantityPerMonth = underscore.reduce(category.quantityPerMonth, reduceArrayInRange(startOffset), productionCategory.quantityPerMonth || initializeArray(instance.numberOfMonths));
                productionCategory.quantity = safeMath.round(underscore.reduce(productionCategory.quantityPerMonth, reduceValue, 0), 2);

                // Supply
                productionCategory.supplyPerMonth = underscore.reduce(category.valuePerMonth, function (supplyPerMonth, value, index) {
                    var indexOffset = index + startOffset;

                    if (indexOffset >= 0 && indexOffset < supplyPerMonth.length) {
                        supplyPerMonth[indexOffset] = safeMath.plus(supplyPerMonth[indexOffset], category.supply);
                    }

                    return supplyPerMonth;
                }, productionCategory.supplyPerMonth || initializeArray(instance.numberOfMonths));

                productionCategory.supply = underscore.reduce(productionCategory.categories, reduceProperty('supply'), 0);

                productionCategory.pricePerUnit = safeMath.round(safeMath.dividedBy(
                    safeMath.dividedBy(productionCategory.value, productionCategory.quantity),
                    productionCategory.supply || 1), 2);

                productionCategory.schedule = underscore.reduce(productionCategory.valuePerMonth, function (schedule, value, index) {
                    schedule[index] = safeMath.dividedBy(safeMath.times(value, 100), productionCategory.value);

                    return schedule;
                }, initializeArray(instance.numberOfMonths));

                if (productionSchedule.type === 'livestock') {
                    productionCategory.quantityPerLSU = safeMath.dividedBy(underscore.reduce(productionCategory.categories, reduceProperty('quantityPerLSU'), 0), productionCategory.categories.length);
                    productionCategory.valuePerLSU = safeMath.dividedBy(underscore.reduce(productionCategory.categories, reduceProperty('valuePerLSU'), 0), productionCategory.categories.length);
                } else {
                    productionCategory.quantityPerHa = safeMath.round(safeMath.dividedBy(productionCategory.quantity, size), 2);

                    if (section.code === 'EXP') {
                        productionCategory.valuePerHa = safeMath.round(safeMath.dividedBy(productionCategory.value, size), 2);
                    }
                }
            }
        }

        return ProductionGroup;
    }]);

sdkModelProductionSchedule.factory('ProductionSchedule', ['Base', 'computedProperty', 'EnterpriseBudget', 'EnterpriseBudgetBase', 'Field', 'inheritModel', 'moment', 'privateProperty', 'readOnlyProperty', 'safeMath', 'underscore',
    function (Base, computedProperty, EnterpriseBudget, EnterpriseBudgetBase, Field, inheritModel, moment, privateProperty, readOnlyProperty, safeMath, underscore) {
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
                
                this.setSize(this.asset.data.size);
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

            privateProperty(this, 'adjustCategory', function (sectionCode, categoryCode, costStage, property) {
                return adjustCategory(this, sectionCode, categoryCode, costStage, property);
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

        function adjustCategory (instance, sectionCode, categoryCode, costStage, property) {
            var productionCategory = instance.getCategory(sectionCode, categoryCode, costStage),
                budgetCategory = instance.budget.getCategory(sectionCode, categoryCode, costStage);

            if (productionCategory && budgetCategory) {
                if (property === 'value') {
                    budgetCategory.value = instance.reverseMaturityFactor(sectionCode, safeMath.dividedBy(productionCategory.value, (instance.type === 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize)));

                    if (budgetCategory.unit === 'Total') {
                        budgetCategory.pricePerUnit = budgetCategory.value;
                        productionCategory.pricePerUnit = budgetCategory.value;
                    } else {
                        budgetCategory.quantity = safeMath.dividedBy(budgetCategory.value, budgetCategory.pricePerUnit);
                        productionCategory.quantity = safeMath.dividedBy(productionCategory.value, productionCategory.pricePerUnit);
                    }

                    productionCategory.value = instance.applyMaturityFactor(sectionCode, safeMath.times(budgetCategory.value, (instance.type === 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize)));
                } else if (property === 'valuePerHa') {
                    budgetCategory.value = instance.reverseMaturityFactor(sectionCode, productionCategory.valuePerHa);

                    if (budgetCategory.unit === 'Total') {
                        budgetCategory.pricePerUnit = budgetCategory.value;
                        productionCategory.pricePerUnit = budgetCategory.value;
                    }

                    budgetCategory.quantity = safeMath.dividedBy(budgetCategory.value, budgetCategory.pricePerUnit);
                    productionCategory.value = instance.applyMaturityFactor(sectionCode, safeMath.times(budgetCategory.value, instance.allocatedSize));
                    productionCategory.valuePerHa = instance.applyMaturityFactor(sectionCode, budgetCategory.value);
                    productionCategory.quantity = safeMath.dividedBy(productionCategory.value, productionCategory.pricePerUnit);
                } else if (property === 'valuePerLSU') {
                    budgetCategory.valuePerLSU = productionCategory.valuePerLSU;
                    budgetCategory.pricePerUnit = safeMath.times(budgetCategory.valuePerLSU, instance.budget.getConversionRate(budgetCategory.name));
                    budgetCategory.value = safeMath.chain(budgetCategory.supply || 1).times(budgetCategory.pricePerUnit || 0).times(budgetCategory.quantity || 0).toNumber();
                    productionCategory.value = safeMath.times(budgetCategory.value, instance.data.details.multiplicationFactor);
                    productionCategory.valuePerLSU = safeMath.times(budgetCategory.valuePerLSU, instance.data.details.multiplicationFactor);
                    productionCategory.quantity = safeMath.dividedBy(productionCategory.value, productionCategory.pricePerUnit);
                } else if (property === 'quantityPerHa') {
                    budgetCategory.quantity = instance.reverseMaturityFactor(sectionCode, productionCategory.quantityPerHa);
                    budgetCategory.value = safeMath.chain(budgetCategory.supply || 1).times(budgetCategory.pricePerUnit || 0).times(budgetCategory.quantity || 0).toNumber();
                    productionCategory.quantity = instance.applyMaturityFactor(sectionCode, safeMath.times(budgetCategory.value, instance.allocatedSize));
                    productionCategory.quantityPerHa = instance.applyMaturityFactor(sectionCode, budgetCategory.quantity);
                    productionCategory.value = safeMath.chain(productionCategory.supply || 1).times(productionCategory.pricePerUnit || 0).times(productionCategory.quantity || 0).toNumber();
                } else if (property === 'quantityPerLSU') {
                    budgetCategory.quantity = productionCategory.quantityPerLSU;
                    productionCategory.quantity = safeMath.times(budgetCategory.quantity, instance.data.details.multiplicationFactor);
                    productionCategory.quantityPerLSU = budgetCategory.quantity;
                    budgetCategory.value = safeMath.chain(budgetCategory.supply || 1).times(budgetCategory.pricePerUnit || 0).times(budgetCategory.quantity || 0).toNumber();
                    productionCategory.value = safeMath.chain(productionCategory.supply || 1).times(productionCategory.pricePerUnit || 0).times(productionCategory.quantity || 0).toNumber();
                } else if (property === 'quantity') {
                    budgetCategory.quantity = instance.reverseMaturityFactor(sectionCode, safeMath.dividedBy(productionCategory.quantity, (instance.type === 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize)));
                    budgetCategory.value = safeMath.chain(budgetCategory.supply || 1).times(budgetCategory.pricePerUnit || 0).times(budgetCategory.quantity || 0).toNumber();
                    productionCategory.quantity = instance.applyMaturityFactor(sectionCode, safeMath.times(budgetCategory.quantity, (instance.type === 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize)));
                    productionCategory.value = safeMath.chain(productionCategory.supply || 1).times(productionCategory.pricePerUnit || 0).times(productionCategory.quantity || 0).toNumber();
                } else if (property === 'supply') {
                    budgetCategory.supply = safeMath.dividedBy(productionCategory.supply, (instance.type === 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize));
                    budgetCategory.value = safeMath.chain(budgetCategory.supply || 1).times(budgetCategory.pricePerUnit || 0).times(budgetCategory.quantity || 0).toNumber();
                    productionCategory.supply = safeMath.times(budgetCategory.supply, (instance.type === 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize));
                    productionCategory.value = instance.applyMaturityFactor(sectionCode, safeMath.times(budgetCategory.value, (instance.type === 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize)));
                } else if (property === 'pricePerUnit') {
                    budgetCategory.pricePerUnit = productionCategory.pricePerUnit;
                    budgetCategory.value = safeMath.chain(budgetCategory.supply || 1).times(budgetCategory.pricePerUnit || 0).times(budgetCategory.quantity || 0).toNumber();
                    productionCategory.value = instance.applyMaturityFactor(sectionCode, safeMath.times(budgetCategory.value, (instance.type === 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize)));
                    productionCategory.pricePerUnit = budgetCategory.pricePerUnit;
                } else if (underscore.contains(['stock', 'stockPrice'], property)) {
                    budgetCategory[property] = productionCategory[property];
                } else if (property === 'schedule') {
                    budgetCategory.schedule = instance.budget.unshiftMonthlyArray(productionCategory.schedule);
                    budgetCategory.value = instance.reverseMaturityFactor(sectionCode, safeMath.dividedBy(productionCategory.value, (instance.type === 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize)));

                    if (budgetCategory.unit === 'Total') {
                        budgetCategory.pricePerUnit = budgetCategory.value;
                        productionCategory.pricePerUnit = budgetCategory.value;
                    } else {
                        budgetCategory.quantity = safeMath.dividedBy(budgetCategory.value, budgetCategory.pricePerUnit);
                    }

                    var scheduleTotalAllocation = underscore.reduce(budgetCategory.schedule, function (total, value) {
                        return safeMath.plus(total, value);
                    }, 0);

                    budgetCategory.value = safeMath.chain(underscore.isUndefined(budgetCategory.supply) ? 1 : budgetCategory.supply)
                        .times(budgetCategory.quantity || 0)
                        .times(budgetCategory.pricePerUnit || 0)
                        .times(scheduleTotalAllocation)
                        .dividedBy(100)
                        .toNumber();

                    underscore.each(['value', 'quantity'], function (property) {
                        budgetCategory[property + 'PerMonth'] = underscore.map(budgetCategory.schedule, function (allocation) {
                            return safeMath.chain(budgetCategory[property])
                                .times(allocation)
                                .dividedBy(100)
                                .toNumber();
                        });

                        productionCategory[property + 'PerMonth'] = underscore.map(instance.budget.shiftMonthlyArray(budgetCategory[property + 'PerMonth']), function (value) {
                            return instance.applyMaturityFactor(sectionCode, safeMath.times(value, (instance.type === 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize)));
                        });

                        productionCategory[property] = instance.applyMaturityFactor(sectionCode, safeMath.times(budgetCategory[property], (instance.type === 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize)));
                    });
                }

                if(instance.type === 'livestock') {
                    budgetCategory.valuePerLSU = safeMath.dividedBy(budgetCategory.pricePerUnit, instance.budget.getConversionRate(budgetCategory.name));
                }

                if (sectionCode === 'EXP') {
                    productionCategory.valuePerHa = instance.applyMaturityFactor(sectionCode, budgetCategory.value);
                }

                instance.$dirty = true;

                return productionCategory[property];
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

                instance.data.details.grossProfit = underscore.reduce(instance.data.sections, function (total, section) {
                    return (section.code === 'INC' ? safeMath.plus(total, section.total.value) : safeMath.minus(total, section.total.value));
                }, 0);

                if (instance.type === 'livestock') {
                    instance.data.details.grossProfitPerLSU = safeMath.dividedBy(instance.data.details.grossProfit, instance.data.details.calculatedLSU);
                }
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

                instance.data.details.grossProfit = underscore.reduce(instance.data.sections, function (total, section) {
                    return (section.code === 'INC' ? safeMath.plus(total, section.total.value) : safeMath.minus(total, section.total.value));
                }, 0);

                if (instance.type === 'livestock') {
                    instance.data.details.grossProfitPerLSU = safeMath.dividedBy(instance.data.details.grossProfit, instance.data.details.calculatedLSU);
                }
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

            if (productionCategory.supplyUnit && !underscore.isUndefined(category.supply)) {
                productionCategory.supply = safeMath.times(category.supply, (instance.type === 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize));
                productionCategory.quantity = instance.applyMaturityFactor(section.code, category.quantity);

                productionCategory.quantityPerMonth = underscore.map(instance.budget.shiftMonthlyArray(category.quantityPerMonth), function (value) {
                    return instance.applyMaturityFactor(section.code, value);
                });
            } else {
                productionCategory.quantity = instance.applyMaturityFactor(section.code, safeMath.times(category.quantity, (instance.type === 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize)));

                productionCategory.quantityPerMonth = underscore.map(instance.budget.shiftMonthlyArray(category.quantityPerMonth), function (value) {
                    return instance.applyMaturityFactor(section.code, safeMath.times(value, (instance.type === 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize)));
                });
            }

            productionCategory.schedule = instance.budget.getShiftedSchedule(category.schedule);

            productionCategory.valuePerMonth = underscore.map(instance.budget.shiftMonthlyArray(category.valuePerMonth), function (value) {
                return instance.applyMaturityFactor(section.code, safeMath.times(value, (instance.type === 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize)));
            });

            productionCategory.value = safeMath.chain(productionCategory.supply || 1)
                .times(productionCategory.pricePerUnit || 0)
                .times(productionCategory.quantity || 0)
                .toNumber();
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

        readOnlyProperty(ProductionSchedule, 'allowedAssets', ['cropland', 'pasture', 'permanent crop']);

        readOnlyProperty(ProductionSchedule, 'typeByAsset', {
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
