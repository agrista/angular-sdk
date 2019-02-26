var sdkModelBusinessPlanDocument = angular.module('ag.sdk.model.business-plan', ['ag.sdk.id', 'ag.sdk.model.asset', 'ag.sdk.model.document', 'ag.sdk.model.liability', 'ag.sdk.model.production-schedule', 'ag.sdk.model.stock']);

sdkModelBusinessPlanDocument.provider('BusinessPlan', ['DocumentFactoryProvider', function (DocumentFactoryProvider) {
    this.$get = ['asJson', 'AssetFactory', 'Base', 'computedProperty', 'Document', 'EnterpriseBudget', 'Financial', 'FinancialGroup', 'generateUUID', 'inheritModel', 'Liability', 'Livestock', 'privateProperty', 'ProductionSchedule', 'readOnlyProperty', 'safeArrayMath', 'safeMath', 'Stock', 'underscore',
        function (asJson, AssetFactory, Base, computedProperty, Document, EnterpriseBudget, Financial, FinancialGroup, generateUUID, inheritModel, Liability, Livestock, privateProperty, ProductionSchedule, readOnlyProperty, safeArrayMath, safeMath, Stock, underscore) {
            var _version = 17;

            function BusinessPlan (attrs) {
                Document.apply(this, arguments);

                this.docType = 'financial resource plan';

                this.data.startDate = moment(this.data.startDate).format('YYYY-MM-DD');
                this.data.endDate = moment(this.data.startDate).add(2, 'y').format('YYYY-MM-DD');

                Base.initializeObject(this.data, 'account', {});
                Base.initializeObject(this.data, 'models', {});
                Base.initializeObject(this.data, 'adjustmentFactors', {});
                Base.initializeObject(this.data, 'assetStatement', {});
                Base.initializeObject(this.data, 'liabilityStatement', {});

                Base.initializeObject(this.data.assetStatement, 'total', {});
                Base.initializeObject(this.data.liabilityStatement, 'total', {});

                Base.initializeObject(this.data.account, 'monthly', []);
                Base.initializeObject(this.data.account, 'yearly', []);
                Base.initializeObject(this.data.account, 'openingBalance', 0);
                Base.initializeObject(this.data.account, 'interestRateCredit', 0);
                Base.initializeObject(this.data.account, 'interestRateDebit', 0);
                Base.initializeObject(this.data.account, 'depreciationRate', 0);

                Base.initializeObject(this.data.models, 'assets', []);
                Base.initializeObject(this.data.models, 'budgets', []);
                Base.initializeObject(this.data.models, 'expenses', []);
                Base.initializeObject(this.data.models, 'financials', []);
                Base.initializeObject(this.data.models, 'income', []);
                Base.initializeObject(this.data.models, 'liabilities', []);
                Base.initializeObject(this.data.models, 'productionSchedules', []);

                function reEvaluateBusinessPlan (instance) {
                    recalculate(instance);
                    recalculateRatios(instance);
                }

                /**
                 * Production Schedule handling
                 */
                privateProperty(this, 'updateProductionSchedules', function (schedules, options) {
                    updateProductionSchedules(this, schedules, options);
                });

                function updateProductionSchedules (instance, schedules, options) {
                    var startMonth = moment(instance.startDate, 'YYYY-MM-DD'),
                        endMonth = moment(instance.endDate, 'YYYY-MM-DD'),
                        oldSchedules = underscore.map(instance.models.productionSchedules, ProductionSchedule.newCopy);

                    options = underscore.defaults(options || {}, {
                        extractStockAssets: true
                    });

                    instance.models.productionSchedules = [];

                    underscore.chain(schedules)
                        .map(function (schedule) {
                            return (schedule instanceof ProductionSchedule ? schedule : ProductionSchedule.newCopy(schedule));
                        })
                        .sortBy(function (schedule) {
                            return moment(schedule.startDate).valueOf();
                        })
                        .each(function (schedule) {
                            // Add valid production schedule if between business plan dates
                            if (schedule.validate() && (startMonth.isBetween(schedule.startDate, schedule.endDate) || (startMonth.isBefore(schedule.endDate) && endMonth.isAfter(schedule.startDate)))) {
                                if (options.extractStockAssets) {
                                    extractProductionScheduleStockAssets(instance, schedule);
                                }

                                instance.models.productionSchedules.push(asJson(schedule));

                                oldSchedules = underscore.reject(oldSchedules, function (oldSchedule) {
                                    return oldSchedule.scheduleKey === schedule.scheduleKey;
                                });
                            }
                        });

                    if (oldSchedules.length > 0) {
                        var stockAssets = underscore.chain(instance.models.assets)
                            .filter(function (asset) {
                                return underscore.contains(['livestock', 'stock'], asset.type);
                            })
                            .map(AssetFactory.newCopy)
                            .value();

                        underscore.each(oldSchedules, function (oldSchedule) {
                            underscore.each(stockAssets, function (stock) {
                                stock.removeLedgerEntriesByReference(oldSchedule.scheduleKey);

                                addStockAsset(instance, stock);
                            });
                        });
                    }

                    updateBudgets(instance);
                    reEvaluateBusinessPlan(instance);
                }

                function initializeCategoryValues (instance, section, category, length) {
                    instance.data[section] = instance.data[section] || {};
                    instance.data[section][category] = instance.data[section][category] || Base.initializeArray(length);
                }

                function getLowerIndexBound (scheduleArray, offset) {
                    return (scheduleArray ? Math.min(scheduleArray.length, Math.abs(Math.min(0, offset))) : 0);
                }

                function getUpperIndexBound (scheduleArray, offset, numberOfMonths) {
                    return (scheduleArray ? Math.min(numberOfMonths, offset + scheduleArray.length) - offset : 0);
                }

                function extractProductionScheduleCategoryValuePerMonth(dataStore, schedule, code, startMonth, numberOfMonths, forceCategory) {
                    var section = underscore.findWhere(schedule.data.sections, {code: code}),
                        scheduleStart = moment(schedule.startDate, 'YYYY-MM-DD'),
                        enterprise = schedule.data.details.commodity;

                    if (section) {
                        var offset = scheduleStart.diff(startMonth, 'months');

                        angular.forEach(section.productCategoryGroups, function (group) {
                            var dataCategory = 'enterpriseProduction' + (code === 'INC' ? 'Income' : 'Expenditure');

                            angular.forEach(group.productCategories, function (category) {
                                // Ignore stockable categories
                                if (!underscore.contains(EnterpriseBudget.stockableCategoryCodes, category.code)) {
                                    var categoryName = (!forceCategory && (schedule.type !== 'livestock' && code === 'INC') ? schedule.data.details.commodity : category.name),
                                        index = getLowerIndexBound(category.valuePerMonth, offset),
                                        maxIndex = getUpperIndexBound(category.valuePerMonth, offset, numberOfMonths);

                                    Base.initializeObject(dataStore[dataCategory], enterprise, {});
                                    dataStore[dataCategory][enterprise][categoryName] = dataStore[dataCategory][enterprise][categoryName] || Base.initializeArray(numberOfMonths);

                                    for (; index < maxIndex; index++) {
                                        dataStore[dataCategory][enterprise][categoryName][index + offset] = safeMath.plus(dataStore[dataCategory][enterprise][categoryName][index + offset], category.valuePerMonth[index]);
                                    }
                                }
                            });
                        });
                    }
                }

                function findStockAsset (instance, type, stockType, category) {
                    return underscore.find(instance.models.assets, function (asset) {
                        return asset.type === type && asset.data.category === category && (underscore.isUndefined(stockType) || asset.data.type === stockType);
                    });
                }

                function stockPicker (instance) {
                    return function (type, stockType, category, priceUnit, quantityUnit) {
                        var stock = AssetFactory.new(findStockAsset(instance, type, stockType, category) || {
                            type: type,
                            legalEntityId: underscore.chain(instance.data.legalEntities)
                                .where({isPrimary: true})
                                .pluck('id')
                                .first()
                                .value(),
                            data: underscore.extend({
                                category: category,
                                priceUnit: priceUnit,
                                quantityUnit: quantityUnit
                            }, (underscore.isUndefined(stockType) ? {} : {
                                type: stockType
                            }))
                        });

                        stock.generateKey(underscore.findWhere(instance.data.legalEntities, {id: stock.legalEntityId}));

                        return stock;
                    }
                }

                function addStockAsset (instance, stock, force) {
                    instance.models.assets = underscore.reject(instance.models.assets, function (asset) {
                        return asset.assetKey === stock.assetKey;
                    });

                    if (force || stock.hasLedgerEntries()) {
                        instance.models.assets.push(asJson(stock));
                    }
                }

                function extractProductionScheduleStockAssets (instance, productionSchedule) {
                    var inventory = productionSchedule.extractStock(stockPicker(instance));

                    underscore.each(inventory, function (stock) {
                        addStockAsset(instance, stock, true);
                    });
                }

                function calculateYearlyProductionIncomeComposition(productionIncomeComposition, year) {
                    var yearlyComposition = underscore.mapObject(productionIncomeComposition, function (monthlyComposition) {
                        return underscore.reduce(monthlyComposition.slice((year - 1) * 12, year * 12), function (yearly, consumption) {
                            yearly.unit = consumption.unit;
                            yearly.value = safeMath.plus(yearly.value, consumption.value);
                            yearly.quantity = safeMath.plus(yearly.quantity, consumption.quantity);
                            yearly.pricePerUnit = safeMath.dividedBy(yearly.value, yearly.quantity);

                            return yearly;
                        }, {
                            quantity: 0,
                            value: 0
                        });
                    });

                    yearlyComposition.total = {
                        value: safeArrayMath.reduce(underscore.chain(yearlyComposition)
                            .values()
                            .pluck('value')
                            .value()) || 0
                    };

                    underscore.each(yearlyComposition, function(consumption, enterprise) {
                        consumption.percent = (enterprise !== 'total' ? safeMath.times(safeMath.dividedBy(100, yearlyComposition.total.value), consumption.value) : 100);
                    });

                    return yearlyComposition;
                }

                function reEvaluateProductionSchedules (instance) {
                    var startMonth = moment(instance.startDate, 'YYYY-MM-DD'),
                        numberOfMonths = instance.numberOfMonths;

                    // Indirect production income & expenses
                    underscore.chain(instance.models.income)
                        .where({type: 'production'})
                        .each(function (income) {
                            Base.initializeObject(instance.data.enterpriseProductionIncome, 'Indirect', {});
                            Base.initializeObject(instance.data.enterpriseProductionIncome['Indirect'], income.name, Base.initializeArray(numberOfMonths, 0));
                            instance.data.enterpriseProductionIncome['Indirect'][income.name] = safeArrayMath.plus(instance.data.enterpriseProductionIncome['Indirect'][income.name], income.months);
                        });

                    underscore.chain(instance.models.expenses)
                        .where({type: 'production'})
                        .each(function (expense) {
                            Base.initializeObject(instance.data.enterpriseProductionExpenditure, 'Indirect', {});
                            Base.initializeObject(instance.data.enterpriseProductionExpenditure['Indirect'], expense.name, Base.initializeArray(numberOfMonths, 0));
                            instance.data.enterpriseProductionExpenditure['Indirect'][expense.name] = safeArrayMath.plus(instance.data.enterpriseProductionExpenditure['Indirect'][expense.name], expense.months);
                        });

                    // Production income & expenses
                    angular.forEach(instance.models.productionSchedules, function (productionSchedule) {
                        var schedule = ProductionSchedule.new(productionSchedule);

                        extractProductionScheduleCategoryValuePerMonth(instance.data, schedule, 'INC', startMonth, numberOfMonths, true);
                        extractProductionScheduleCategoryValuePerMonth(instance.data, schedule, 'EXP', startMonth, numberOfMonths, true);
                    });
                }

                function reEvaluateProductionIncomeAndExpenditure (instance, numberOfMonths) {
                    instance.data.productionIncome = underscore.extend(instance.data.productionIncome, underscore.reduce(instance.data.enterpriseProductionIncome, function (results, groupedValues) {
                        return underscore.reduce(groupedValues, function (totals, values, group) {
                            Base.initializeObject(totals, group, Base.initializeArray(numberOfMonths, 0));
                            totals[group] = safeArrayMath.plus(totals[group], values);
                            return totals;
                        }, results);
                    }, {}));

                    instance.data.productionExpenditure = underscore.extend(instance.data.productionExpenditure, underscore.reduce(instance.data.enterpriseProductionExpenditure, function (results, groupedValues) {
                        return underscore.reduce(groupedValues, function (totals, values, group) {
                            Base.initializeObject(totals, group, Base.initializeArray(numberOfMonths, 0));
                            totals[group] = safeArrayMath.plus(totals[group], values);
                            return totals;
                        }, results);
                    }, {}));

                    instance.data.unallocatedProductionIncome = instance.data.productionIncome;
                    instance.data.unallocatedProductionExpenditure = instance.data.productionExpenditure;
                }

                /**
                 * Income & Expenses handling
                 */
                function addIncomeExpense (instance, type, item) {
                    instance.models[type] = underscore.reject(instance.models[type], function (modelItem) {
                        return modelItem.uuid === item.uuid;
                    });

                    instance.models[type].push(item);

                    reEvaluateBusinessPlan(instance);
                }

                function removeIncomeExpense (instance, type, item) {
                    instance.models[type] = underscore.reject(instance.models[type], function (modelItem) {
                        return modelItem.uuid === item.uuid;
                    });

                    reEvaluateBusinessPlan(instance);
                }

                privateProperty(this, 'addIncome', function (income) {
                    addIncomeExpense(this, 'income', income);
                });

                privateProperty(this, 'removeIncome', function (income) {
                    removeIncomeExpense(this, 'income', income);
                });

                privateProperty(this, 'addExpense', function (expense) {
                    addIncomeExpense(this, 'expenses', expense);
                });

                privateProperty(this, 'removeExpense', function (expense) {
                    removeIncomeExpense(this, 'expenses', expense);
                });

                function reEvaluateIncomeAndExpenses (instance) {
                    var startMonth = moment(instance.startDate, 'YYYY-MM-DD'),
                        endMonth = moment(instance.endDate, 'YYYY-MM-DD'),
                        numberOfMonths = endMonth.diff(startMonth, 'months'),
                        evaluatedModels = [];

                    underscore.each(instance.models.income, function (income) {
                        var registerLegalEntity = underscore.findWhere(instance.data.legalEntities, {id: income.legalEntityId}),
                            evaluatedModel = underscore.findWhere(evaluatedModels, {uuid: income.uuid}),
                            type = (income.type ? income.type : 'other') + 'Income';

                        // Check income is not already added
                        if (income.type !== 'production' && registerLegalEntity && underscore.isUndefined(evaluatedModel) && instance.data[type]) {
                            initializeCategoryValues(instance, type, income.name, numberOfMonths);

                            instance.data[type][income.name] = underscore.map(income.months, function (monthValue, index) {
                                return safeMath.plus(monthValue, instance.data[type][income.name][index]);
                            });

                            evaluatedModels.push(income);
                        }
                    });

                    underscore.each(instance.models.expenses, function (expense) {
                        var registerLegalEntity = underscore.findWhere(instance.data.legalEntities, {id: expense.legalEntityId}),
                            evaluatedModel = underscore.findWhere(evaluatedModels, {uuid: expense.uuid}),
                            type = (expense.type ? expense.type : 'other') + 'Expenditure';

                        // Check expense is not already added
                        if (expense.type !== 'production' && registerLegalEntity && underscore.isUndefined(evaluatedModel) && instance.data[type]) {
                            initializeCategoryValues(instance, type, expense.name, numberOfMonths);

                            instance.data[type][expense.name] = underscore.map(expense.months, function (monthValue, index) {
                                return safeMath.plus(monthValue, instance.data[type][expense.name][index]);
                            });

                            evaluatedModels.push(expense);
                        }
                    });
                }

                /**
                 * Financials
                 */
                privateProperty(this, 'updateFinancials', function (financials) {
                    this.models.financials = underscore.filter(financials, function (financial) {
                        return Financial.new(financial).validate();
                    });

                    this.data.consolidatedFinancials = underscore.chain(this.models.financials)
                        .groupBy('year')
                        .map(function (groupedFinancials) {
                            return asJson(FinancialGroup.new({
                                financials: groupedFinancials
                            }), ['financials']);
                        })
                        .sortBy('year')
                        .last(3)
                        .value();
                });

                /**
                 *   Assets & Liabilities Handling
                 */
                privateProperty(this, 'addAsset', function (asset) {
                    var instance = this,
                        oldAsset = underscore.findWhere(instance.models.assets, {assetKey: asset.assetKey});

                    asset = AssetFactory.new(asset);

                    if (asset.validate()) {
                        // Remove the old asset's liabilities if we are updating an existing asset
                        if (!underscore.isUndefined(oldAsset)) {
                            instance.models.liabilities = underscore.reject(instance.models.liabilities, function (liability) {
                                return underscore.findWhere(oldAsset.liabilities, {uuid: liability.uuid});
                            });
                        }

                        // Remove the asset
                        instance.models.assets = underscore.reject(instance.models.assets, function (item) {
                            return item.assetKey === asset.assetKey;
                        });

                        // Add the new asset's liabilities
                        asset.liabilities = underscore.chain(asset.liabilities)
                            .map(function (liability) {
                                if (liability.validate()) {
                                    instance.models.liabilities = underscore.reject(instance.models.liabilities, function (item) {
                                        return item.uuid === liability.uuid;
                                    });

                                    if (liability.$delete === false) {
                                        instance.models.liabilities.push(asJson(liability));
                                    }
                                }

                                return asJson(liability);
                            })
                            .value();

                        // Add the new asset
                        instance.models.assets.push(asJson(asset));

                        reEvaluateBusinessPlan(instance);
                    }
                });

                privateProperty(this, 'removeAsset', function (asset) {
                    var instance = this;

                    instance.models.assets = underscore.reject(instance.models.assets, function (item) {
                        return item.assetKey === asset.assetKey;
                    });

                    underscore.each(asset.liabilities, function (liability) {
                        instance.models.liabilities = underscore.reject(instance.models.liabilities, function (item) {
                            return item.uuid === liability.uuid;
                        });
                    });

                    reEvaluateBusinessPlan(instance);
                });

                privateProperty(this, 'addLiability', function (liability) {
                    liability = Liability.new(liability);

                    if (liability.validate()) {
                        this.models.liabilities = underscore.reject(this.models.liabilities, function (item) {
                            return item.uuid === liability.uuid;
                        });

                        this.models.liabilities.push(asJson(liability));

                        reEvaluateBusinessPlan(this);
                    }
                });

                privateProperty(this, 'removeLiability', function (liability) {
                    this.models.liabilities = underscore.reject(this.models.liabilities, function (item) {
                        return item.uuid === liability.uuid;
                    });

                    reEvaluateBusinessPlan(this);
                });

                function reEvaluateProductionCredit(instance) {
                    instance.data.unallocatedEnterpriseProductionExpenditure = angular.copy(instance.data.enterpriseProductionExpenditure);
                    instance.data.unallocatedProductionExpenditure = angular.copy(instance.data.productionExpenditure);

                    underscore.chain(instance.data.models.liabilities)
                        .where({type: 'production-credit'})
                        .map(Liability.newCopy)
                        .each(function (liability) {
                            underscore.each(liability.liabilityInRange(instance.startDate, instance.endDate), function (monthly, index) {
                                underscore.each(liability.data.enterprises, function (enterprise) {
                                    underscore.each(liability.data.inputs, function (input) {
                                        Base.initializeObject(instance.data.unallocatedEnterpriseProductionExpenditure[enterprise], input, Base.initializeArray(instance.numberOfMonths, 0));
                                        Base.initializeObject(instance.data.unallocatedProductionExpenditure, input, Base.initializeArray(instance.numberOfMonths, 0));

                                        instance.data.unallocatedEnterpriseProductionExpenditure[enterprise][input][index] = Math.max(0, safeMath.minus(instance.data.unallocatedEnterpriseProductionExpenditure[enterprise][input][index], monthly.withdrawal));
                                        instance.data.unallocatedProductionExpenditure[input][index] = Math.max(0, safeMath.minus(instance.data.unallocatedProductionExpenditure[input][index], monthly.withdrawal));
                                    });
                                });
                            });
                        });
                }

                privateProperty(this, 'reEvaluateProductionCredit', function (liabilities) {
                    return reEvaluateProductionCredit(this, liabilities);
                });

                function updateAssetStatementCategory(instance, category, name, asset) {
                    asset.data.assetValue = asset.data.assetValue || 0;

                    var startMonth = moment(instance.startDate, 'YYYY-MM-DD'),
                        numberOfMonths = instance.numberOfMonths,
                        numberOfYears = instance.numberOfYears,
                        assetCategory = underscore.findWhere(instance.data.assetStatement[category], {name: name}) || {
                            name: name,
                            estimatedValue: 0,
                            marketValue: 0,
                            monthly: {
                                depreciation: Base.initializeArray(numberOfMonths),
                                marketValue: Base.initializeArray(numberOfMonths)
                            },
                            yearly: {
                                depreciation: Base.initializeArray(numberOfYears),
                                marketValue: Base.initializeArray(numberOfYears)
                            },
                            assets: []
                        };

                    if (!underscore.findWhere(assetCategory.assets, {assetKey: asset.assetKey})) {
                        assetCategory.assets.push(asJson(asset, ['liabilities', 'productionSchedules']));
                    }

                    if (!asset.data.acquisitionDate || startMonth.isAfter(asset.data.acquisitionDate)) {
                        assetCategory.estimatedValue = safeMath.plus(assetCategory.estimatedValue, asset.data.assetValue);
                    }

                    instance.data.assetStatement[category] = underscore.chain(instance.data.assetStatement[category])
                        .reject(function (item) {
                            return item.name === assetCategory.name;
                        })
                        .union([assetCategory])
                        .value()
                        .sort(function (a, b) {
                            return naturalSort(a.name, b.name);
                        });
                }

                function updateLiabilityStatementCategory(instance, liability) {
                    var category = (liability.type === 'production-credit' ? 'medium-term' : (liability.type === 'rent' ? 'short-term' : liability.type)),
                        name = (liability.type === 'production-credit' ? 'Production Credit' : (liability.type === 'rent' ? 'Rent overdue' : liability.category || liability.name)),
                        numberOfYears = instance.numberOfYears,
                        liabilityCategory = underscore.findWhere(instance.data.liabilityStatement[category], {name: name}) || {
                            name: name,
                            currentValue: 0,
                            yearlyValues: Base.initializeArray(numberOfYears),
                            liabilities: []
                        };

                    liabilityCategory.currentValue = safeMath.plus(liabilityCategory.currentValue, liability.liabilityInMonth(instance.startDate).opening);

                    if (!underscore.findWhere(liabilityCategory.liabilities, {uuid: liability.uuid})) {
                        liabilityCategory.liabilities.push(asJson(liability));
                    }

                    // Calculate total year-end values for liability category
                    for (var year = 0; year < numberOfYears; year++) {
                        var yearEnd = moment.min(moment(instance.endDate, 'YYYY-MM-DD'), moment(instance.startDate, 'YYYY-MM-DD').add(year, 'years').add(11, 'months'));
                        liabilityCategory.yearlyValues[year] = safeMath.plus(liabilityCategory.yearlyValues[year], liability.liabilityInMonth(yearEnd).closing);
                    }

                    instance.data.liabilityStatement[category] = underscore.chain(instance.data.liabilityStatement[category])
                        .reject(function (item) {
                            return item.name === liabilityCategory.name;
                        })
                        .union([liabilityCategory])
                        .value()
                        .sort(function (a, b) {
                            return naturalSort(a.name, b.name);
                        });
                }

                function recalculateAssetStatement (instance) {
                    var ignoredItems = ['Bank Capital', 'Bank Overdraft'],
                        depreciationRatePerMonth = safeMath.chain(instance.data.account.depreciationRate || 0)
                            .dividedBy(100)
                            .dividedBy(12)
                            .toNumber();

                    angular.forEach(instance.data.assetStatement, function (statementItems, category) {
                        if (category !== 'total') {
                            angular.forEach(statementItems, function (item) {
                                if (!underscore.contains(ignoredItems, item.name)) {
                                    var adjustmentFactor = instance.data.adjustmentFactors[item.name] || 1,
                                        assetMarketValue = instance.data.assetMarketValue[item.name] || Base.initializeArray(instance.numberOfMonths),
                                        assetStockValue = instance.data.assetStockValue[item.name],
                                        capitalExpenditure = instance.data.capitalExpenditure[item.name] || Base.initializeArray(instance.numberOfMonths);

                                    item.marketValue = safeMath.times(item.estimatedValue, adjustmentFactor);

                                    item.monthly.marketValue = (underscore.isArray(assetStockValue) ?
                                        assetStockValue :
                                        underscore.map(item.monthly.marketValue, function (value, index) {
                                            return safeMath.chain(item.marketValue)
                                                .minus(safeArrayMath.reduce(assetMarketValue.slice(0, index)))
                                                .plus(safeArrayMath.reduce(capitalExpenditure.slice(0, index)))
                                                .toNumber();
                                        }));

                                    item.monthly.depreciation = underscore.map(item.monthly.marketValue, function (value) {
                                        return (item.name !== 'Vehicles, Machinery & Equipment' ? 0 : safeMath.times(value, depreciationRatePerMonth));
                                    });
                                    item.monthly.marketValue = safeArrayMath.minus(item.monthly.marketValue, assetMarketValue);

                                    item.yearly.depreciation = [calculateYearlyTotal(item.monthly.depreciation, 1), calculateYearlyTotal(item.monthly.depreciation, 2)];
                                    item.yearly.marketValue = [calculateEndOfYearValue(item.monthly.marketValue, 1), calculateEndOfYearValue(item.monthly.marketValue, 2)];
                                }
                            });
                        }
                    });
                }

                function totalAssetsAndLiabilities(instance) {
                    var numberOfMonths = instance.numberOfMonths,
                        numberOfYears = instance.numberOfYears;

                    instance.data.assetStatement.total = underscore.chain(instance.data.assetStatement)
                        .omit('total')
                        .values()
                        .flatten(true)
                        .reduce(function(result, asset) {
                            result.estimatedValue = safeMath.plus(result.estimatedValue, asset.estimatedValue);
                            result.marketValue = safeMath.plus(result.marketValue, asset.marketValue);
                            result.monthly.depreciation = safeArrayMath.plus(result.monthly.depreciation, asset.monthly.depreciation);
                            result.monthly.marketValue = safeArrayMath.plus(result.monthly.marketValue, asset.monthly.marketValue);
                            result.yearly.depreciation = safeArrayMath.plus(result.yearly.depreciation, asset.yearly.depreciation);
                            result.yearly.marketValue = safeArrayMath.plus(result.yearly.marketValue, asset.yearly.marketValue);
                            return result;
                        }, {
                            estimatedValue: 0,
                            marketValue: 0,
                            monthly: {
                                depreciation: Base.initializeArray(numberOfMonths),
                                marketValue: Base.initializeArray(numberOfMonths)
                            },
                            yearly: {
                                depreciation: Base.initializeArray(numberOfYears),
                                marketValue: Base.initializeArray(numberOfYears)
                            }
                        })
                        .value();

                    instance.data.liabilityStatement.total = underscore.chain(instance.data.liabilityStatement)
                        .omit('total')
                        .values()
                        .flatten(true)
                        .reduce(function(result, liability) {
                            result.currentValue = safeMath.plus(result.currentValue, liability.currentValue);
                            result.yearlyValues = safeArrayMath.plus(result.yearlyValues, liability.yearlyValues);
                            return result;
                        }, {
                            currentValue: 0,
                            yearlyValues: Base.initializeArray(numberOfYears)
                        })
                        .value();
                }

                function reEvaluateAssetsAndLiabilities (instance) {
                    var startMonth = moment(instance.startDate, 'YYYY-MM-DD'),
                        endMonth = moment(instance.endDate, 'YYYY-MM-DD'),
                        numberOfMonths = endMonth.diff(startMonth, 'months'),
                        evaluatedModels = [],
                        monthDiff = 0;

                    var assetRank = {
                        'cropland': 1,
                        'pasture': 1,
                        'permanent crop': 1,
                        'plantation': 1,
                        'wasteland': 1,
                        'farmland': 2
                    };

                    underscore.chain(instance.models.assets)
                        .sortBy(function (asset) {
                            return assetRank[asset.type] || 0;
                        })
                        .each(function (asset) {
                            var registerLegalEntity = underscore.findWhere(instance.data.legalEntities, {id: asset.legalEntityId}),
                                evaluatedAsset = underscore.findWhere(evaluatedModels, {assetKey: asset.assetKey});

                            // Check asset is not already added
                            if (registerLegalEntity && underscore.isUndefined(evaluatedAsset)) {
                                evaluatedModels.push(asset);

                                asset = AssetFactory.new(asset);

                                var acquisitionDate = (asset.data.acquisitionDate ? moment(asset.data.acquisitionDate) : undefined),
                                    soldDate = (asset.data.soldDate ? moment(asset.data.soldDate) : undefined),
                                    constructionDate = (asset.data.constructionDate ? moment(asset.data.constructionDate) : undefined),
                                    demolitionDate = (asset.data.demolitionDate ? moment(asset.data.demolitionDate) : undefined);

                                // VME
                                if (asset.type === 'vme') {
                                    if (asset.data.assetValue && acquisitionDate && acquisitionDate.isBetween(startMonth, endMonth)) {
                                        monthDiff = acquisitionDate.diff(startMonth, 'months');

                                        initializeCategoryValues(instance, 'capitalExpenditure', 'Vehicles, Machinery & Equipment', numberOfMonths);

                                        instance.data.capitalExpenditure['Vehicles, Machinery & Equipment'][monthDiff] = safeMath.plus(instance.data.capitalExpenditure['Vehicles, Machinery & Equipment'][monthDiff], asset.data.assetValue);
                                    }

                                    if (asset.data.sold && asset.data.salePrice && soldDate && soldDate.isBetween(startMonth, endMonth)) {
                                        monthDiff = soldDate.diff(startMonth, 'months');

                                        var value = safeMath.minus(asset.data.assetValue, safeMath.chain(instance.data.account.depreciationRate || 0)
                                            .dividedBy(100)
                                            .dividedBy(12)
                                            .times(asset.data.assetValue)
                                            .times(acquisitionDate && acquisitionDate.isBetween(startMonth, endMonth) ?
                                                soldDate.diff(acquisitionDate, 'months') :
                                                monthDiff + 1)
                                            .toNumber());

                                        initializeCategoryValues(instance, 'assetMarketValue', 'Vehicles, Machinery & Equipment', numberOfMonths);
                                        initializeCategoryValues(instance, 'capitalIncome', 'Vehicles, Machinery & Equipment', numberOfMonths);
                                        initializeCategoryValues(instance, 'capitalProfit', 'Vehicles, Machinery & Equipment', numberOfMonths);
                                        initializeCategoryValues(instance, 'capitalLoss', 'Vehicles, Machinery & Equipment', numberOfMonths);

                                        instance.data.assetMarketValue['Vehicles, Machinery & Equipment'][monthDiff] = safeMath.plus(instance.data.assetMarketValue['Vehicles, Machinery & Equipment'][monthDiff], safeMath.plus(asset.data.assetValue, value));
                                        instance.data.capitalIncome['Vehicles, Machinery & Equipment'][monthDiff] = safeMath.plus(instance.data.capitalIncome['Vehicles, Machinery & Equipment'][monthDiff], asset.data.salePrice);
                                        instance.data.capitalProfit['Vehicles, Machinery & Equipment'][monthDiff] = safeMath.plus(instance.data.capitalProfit['Vehicles, Machinery & Equipment'][monthDiff], Math.max(0, safeMath.minus(asset.data.salePrice, value)));
                                        instance.data.capitalLoss['Vehicles, Machinery & Equipment'][monthDiff] = safeMath.plus(instance.data.capitalLoss['Vehicles, Machinery & Equipment'][monthDiff], Math.max(0, safeMath.minus(value, asset.data.salePrice)));
                                    }
                                } else if (asset.type === 'improvement') {
                                    if (asset.data.assetValue && constructionDate && constructionDate.isBetween(startMonth, endMonth)) {
                                        monthDiff = constructionDate.diff(startMonth, 'months');

                                        initializeCategoryValues(instance, 'capitalExpenditure', 'Fixed Improvements', numberOfMonths);

                                        instance.data.capitalExpenditure['Fixed Improvements'][monthDiff] = safeMath.plus(instance.data.capitalExpenditure['Fixed Improvements'][monthDiff], asset.data.assetValue);
                                    }
                                } else if (asset.type === 'stock') {
                                    underscore.each(asset.inventoryInRange(startMonth, endMonth), function (monthly, index) {
                                        initializeCategoryValues(instance, 'assetStockValue', 'Stock On Hand', numberOfMonths);
                                        instance.data.assetStockValue['Stock On Hand'][index] = safeMath.plus(instance.data.assetStockValue['Stock On Hand'][index], monthly.closing.value);

                                        underscore.each(monthly.entries, function (entry) {
                                            var commodity = entry.commodity || 'Indirect';

                                            switch (entry.action) {
                                                case 'Household':
                                                    initializeCategoryValues(instance, 'otherExpenditure', 'Farm Products Consumed', numberOfMonths);
                                                    instance.data.otherExpenditure['Farm Products Consumed'][index] = safeMath.plus(instance.data.otherExpenditure['Farm Products Consumed'][index], entry.value);
                                                    break;
                                                case 'Labour':
                                                    Base.initializeObject(instance.data.enterpriseProductionExpenditure, commodity, {});
                                                    instance.data.enterpriseProductionExpenditure[commodity]['Farm Products Consumed'] = instance.data.enterpriseProductionExpenditure[commodity]['Farm Products Consumed'] || Base.initializeArray(numberOfMonths);
                                                    instance.data.enterpriseProductionExpenditure[commodity]['Farm Products Consumed'][index] = safeMath.plus(instance.data.enterpriseProductionExpenditure[commodity]['Farm Products Consumed'][index], entry.value);
                                                    break;
                                                case 'Purchase':
                                                    Base.initializeObject(instance.data.enterpriseProductionExpenditure, commodity, {});
                                                    instance.data.enterpriseProductionExpenditure[commodity][asset.data.category] = instance.data.enterpriseProductionExpenditure[commodity][asset.data.category] || Base.initializeArray(numberOfMonths);
                                                    instance.data.enterpriseProductionExpenditure[commodity][asset.data.category][index] = safeMath.plus(instance.data.enterpriseProductionExpenditure[commodity][asset.data.category][index], entry.value);
                                                    break;
                                                case 'Sale':
                                                    // Stock Production Income
                                                    Base.initializeObject(instance.data.enterpriseProductionIncome, commodity, {});
                                                    instance.data.enterpriseProductionIncome[commodity]['Crop Sales'] = instance.data.enterpriseProductionIncome[commodity]['Crop Sales'] || Base.initializeArray(numberOfMonths);
                                                    instance.data.enterpriseProductionIncome[commodity]['Crop Sales'][index] = safeMath.plus(instance.data.enterpriseProductionIncome[commodity]['Crop Sales'][index], entry.value);

                                                    // Composition
                                                    instance.data.productionIncomeComposition[asset.data.category] = instance.data.productionIncomeComposition[asset.data.category] || underscore.range(numberOfMonths).map(function () {
                                                        return {
                                                            unit: asset.data.quantityUnit || asset.data.priceUnit,
                                                            quantity: 0,
                                                            value: 0
                                                        };
                                                    });

                                                    var compositionMonth = instance.data.productionIncomeComposition[asset.data.category][index];
                                                    compositionMonth.value = safeMath.plus(compositionMonth.value, entry.value);
                                                    compositionMonth.quantity = safeMath.plus(compositionMonth.quantity, entry.quantity);
                                                    compositionMonth.pricePerUnit = safeMath.dividedBy(compositionMonth.value, compositionMonth.quantity);
                                                    break;
                                            }
                                        });

                                        if (index === 0) {
                                            updateAssetStatementCategory(instance, 'short-term', 'Stock On Hand', {
                                                data: {
                                                    name: asset.data.category,
                                                    liquidityType: 'short-term',
                                                    assetValue: monthly.opening.value,
                                                    reference: 'production/crop'
                                                }
                                            });
                                        }
                                    });
                                } else if (asset.type === 'livestock') {
                                    var monthlyLedger = asset.inventoryInRange(startMonth, endMonth),
                                        birthingAnimal = EnterpriseBudget.getBirthingAnimal(asset.data.type);

                                    underscore.each(monthlyLedger, function (ledger, index) {
                                        var offsetDate = moment(instance.startDate, 'YYYY-MM-DD').add(index, 'M'),
                                            stockValue = safeMath.times(ledger.closing.quantity, asset.marketPriceAtDate(offsetDate));

                                        if (birthingAnimal === asset.data.category) {
                                            initializeCategoryValues(instance, 'assetStockValue', 'Marketable Livestock', numberOfMonths);
                                            instance.data.assetStockValue['Marketable Livestock'][index] = safeMath.plus(instance.data.assetStockValue['Marketable Livestock'][index], stockValue);
                                        } else {
                                            initializeCategoryValues(instance, 'assetStockValue', 'Breeding Stock', numberOfMonths);
                                            instance.data.assetStockValue['Breeding Stock'][index] = safeMath.plus(instance.data.assetStockValue['Breeding Stock'][index], stockValue);
                                        }

                                        underscore.chain(ledger)
                                            .pick(['incoming', 'outgoing'])
                                            .each(function (actions) {
                                                underscore.each(actions, function (item, action) {
                                                    switch (action) {
                                                        case 'Household':
                                                            initializeCategoryValues(instance, 'otherExpenditure', 'Farm Products Consumed', numberOfMonths);
                                                            instance.data.otherExpenditure['Farm Products Consumed'][index] = safeMath.plus(instance.data.otherExpenditure['Farm Products Consumed'][index], item.value);
                                                            break;
                                                        case 'Labour':
                                                            Base.initializeObject(instance.data.enterpriseProductionExpenditure, asset.data.type, {});
                                                            instance.data.enterpriseProductionExpenditure[asset.data.type]['Farm Products Consumed'] = instance.data.enterpriseProductionExpenditure[asset.data.type]['Farm Products Consumed'] || Base.initializeArray(numberOfMonths);
                                                            instance.data.enterpriseProductionExpenditure[asset.data.type]['Farm Products Consumed'][index] = safeMath.plus(instance.data.enterpriseProductionExpenditure[asset.data.type]['Farm Products Consumed'][index], item.value);
                                                            break;
                                                        case 'Purchase':
                                                            initializeCategoryValues(instance, 'capitalExpenditure', 'Livestock', numberOfMonths);
                                                            instance.data.capitalExpenditure['Livestock'][index] = safeMath.plus(instance.data.capitalExpenditure['Livestock'][index], item.value);
                                                            break;
                                                        case 'Sale':
                                                            // Livestock Production Income
                                                            Base.initializeObject(instance.data.enterpriseProductionIncome, asset.data.type, {});
                                                            instance.data.enterpriseProductionIncome[asset.data.type]['Livestock Sales'] = instance.data.enterpriseProductionIncome[asset.data.type]['Livestock Sales'] || Base.initializeArray(numberOfMonths);
                                                            instance.data.enterpriseProductionIncome[asset.data.type]['Livestock Sales'][index] = safeMath.plus(instance.data.enterpriseProductionIncome[asset.data.type]['Livestock Sales'][index], item.value);

                                                            // Composition
                                                            instance.data.productionIncomeComposition[asset.data.category] = instance.data.productionIncomeComposition[asset.data.category] || underscore.range(numberOfMonths).map(function () {
                                                                return {
                                                                    unit: asset.data.quantityUnit,
                                                                    quantity: 0,
                                                                    value: 0
                                                                };
                                                            });

                                                            var compositionMonth = instance.data.productionIncomeComposition[asset.data.category][index];
                                                            compositionMonth.value = safeMath.plus(compositionMonth.value, item.value);
                                                            compositionMonth.quantity = safeMath.plus(compositionMonth.quantity, item.quantity);
                                                            compositionMonth.pricePerUnit = safeMath.dividedBy(compositionMonth.value, compositionMonth.quantity);
                                                            break;
                                                    }
                                                });
                                            });

                                        if (index === 0) {
                                            if (birthingAnimal === asset.data.category) {
                                                updateAssetStatementCategory(instance, 'short-term', 'Marketable Livestock', {
                                                    data: {
                                                        name: asset.data.category,
                                                        liquidityType: 'short-term',
                                                        assetValue: ledger.opening.value,
                                                        reference: 'production/livestock'
                                                    }
                                                });
                                            } else {
                                                updateAssetStatementCategory(instance, 'medium-term', 'Breeding Stock', {
                                                    data: {
                                                        name: asset.data.category,
                                                        liquidityType: 'medium-term',
                                                        assetValue: ledger.opening.value,
                                                        reference: 'production/livestock'
                                                    }
                                                });
                                            }
                                        }
                                    });
                                } else if (asset.type === 'farmland') {
                                    if (asset.data.assetValue && acquisitionDate && acquisitionDate.isBetween(startMonth, endMonth)) {
                                        monthDiff = acquisitionDate.diff(startMonth, 'months');

                                        initializeCategoryValues(instance, 'capitalExpenditure', 'Land', numberOfMonths);

                                        instance.data.capitalExpenditure['Land'][monthDiff] = safeMath.plus(instance.data.capitalExpenditure['Land'][monthDiff], asset.data.assetValue);
                                    }

                                    if (asset.data.sold && asset.data.salePrice && soldDate && soldDate.isBetween(startMonth, endMonth)) {
                                        monthDiff = soldDate.diff(startMonth, 'months');

                                        initializeCategoryValues(instance, 'assetMarketValue', 'Land', numberOfMonths);
                                        initializeCategoryValues(instance, 'capitalIncome', 'Land', numberOfMonths);
                                        initializeCategoryValues(instance, 'capitalProfit', 'Land', numberOfMonths);
                                        initializeCategoryValues(instance, 'capitalLoss', 'Land', numberOfMonths);

                                        instance.data.assetMarketValue['Land'][monthDiff] = safeMath.plus(instance.data.assetMarketValue['Land'][monthDiff], asset.data.assetValue);
                                        instance.data.capitalIncome['Land'][monthDiff] = safeMath.plus(instance.data.capitalIncome['Land'][monthDiff], asset.data.salePrice);
                                        instance.data.capitalProfit['Land'][monthDiff] = safeMath.plus(instance.data.capitalProfit['Land'][monthDiff], Math.max(0, safeMath.minus(asset.data.salePrice, asset.data.assetValue)));
                                        instance.data.capitalLoss['Land'][monthDiff] = safeMath.plus(instance.data.capitalLoss['Land'][monthDiff], Math.max(0, safeMath.minus(asset.data.assetValue, asset.data.salePrice)));
                                    }
                                } else if (asset.type === 'other') {
                                    asset.data.liquidityCategory = asset.data.liquidityCategory || asset.data.category;

                                    if (asset.data.assetValue && acquisitionDate && acquisitionDate.isBetween(startMonth, endMonth)) {
                                        monthDiff = acquisitionDate.diff(startMonth, 'months');

                                        initializeCategoryValues(instance, 'capitalExpenditure', asset.data.liquidityCategory, numberOfMonths);

                                        instance.data.capitalExpenditure[asset.data.liquidityCategory][monthDiff] = safeMath.plus(instance.data.capitalExpenditure[asset.data.liquidityCategory][monthDiff], asset.data.assetValue);
                                    }

                                    if (asset.data.sold && asset.data.salePrice && soldDate && soldDate.isBetween(startMonth, endMonth)) {
                                        monthDiff = soldDate.diff(startMonth, 'months');

                                        var value = (asset.data.liquidityCategory !== 'Vehicles, Machinery & Equipment' ? asset.data.assetValue : safeMath.minus(asset.data.assetValue, safeMath.chain(instance.data.account.depreciationRate || 0)
                                            .dividedBy(100)
                                            .dividedBy(12)
                                            .times(asset.data.assetValue)
                                            .times(acquisitionDate && acquisitionDate.isBetween(startMonth, endMonth) ?
                                                soldDate.diff(acquisitionDate, 'months') :
                                                monthDiff + 1)
                                            .toNumber()));

                                        initializeCategoryValues(instance, 'assetMarketValue', asset.data.liquidityCategory, numberOfMonths);
                                        initializeCategoryValues(instance, 'capitalIncome', asset.data.liquidityCategory, numberOfMonths);
                                        initializeCategoryValues(instance, 'capitalProfit', asset.data.liquidityCategory, numberOfMonths);
                                        initializeCategoryValues(instance, 'capitalLoss', asset.data.liquidityCategory, numberOfMonths);

                                        instance.data.assetMarketValue[asset.data.liquidityCategory][monthDiff] = safeMath.plus(instance.data.assetMarketValue[asset.data.liquidityCategory][monthDiff], asset.data.assetValue);
                                        instance.data.capitalIncome[asset.data.liquidityCategory][monthDiff] = safeMath.plus(instance.data.capitalIncome[asset.data.liquidityCategory][monthDiff], asset.data.salePrice);
                                        instance.data.capitalProfit[asset.data.liquidityCategory][monthDiff] = safeMath.plus(instance.data.capitalProfit[asset.data.liquidityCategory][monthDiff], Math.max(0, safeMath.minus(asset.data.salePrice, value)));
                                        instance.data.capitalLoss[asset.data.liquidityCategory][monthDiff] = safeMath.plus(instance.data.capitalLoss[asset.data.liquidityCategory][monthDiff], Math.max(0, safeMath.minus(value, asset.data.salePrice)));
                                    }
                                }

                                if (!(asset.data.sold && soldDate && soldDate.isBefore(startMonth)) && !(asset.data.demolished && demolitionDate && demolitionDate.isBefore(startMonth))) {
                                    switch(asset.type) {
                                        case 'cropland':
                                        case 'pasture':
                                        case 'permanent crop':
                                        case 'plantation':
                                        case 'wasteland':
                                            updateAssetStatementCategory(instance, 'long-term', 'Land', asset);
                                            break;
                                        case 'farmland':
                                            instance.data.assetStatement['long-term'] = instance.data.assetStatement['long-term'] || [];

                                            var assetCategory = underscore.findWhere(instance.data.assetStatement['long-term'], {name: 'Land'}) || {},
                                                landUseValue = underscore.chain(assetCategory.assets || [])
                                                    .reject(function (statementAsset) {
                                                        return statementAsset.farmId !== asset.farmId || statementAsset.type === 'farmland';
                                                    })
                                                    .reduce(function (total, statementAsset) {
                                                        return safeMath.plus(total, statementAsset.data.assetValue);
                                                    }, 0)
                                                    .value();

                                            if (landUseValue === 0) {
                                                updateAssetStatementCategory(instance, 'long-term', 'Land', asset);
                                            }
                                            break;
                                        case 'improvement':
                                            updateAssetStatementCategory(instance, 'long-term', 'Fixed Improvements', asset);
                                            break;
                                        case 'vme':
                                            updateAssetStatementCategory(instance, 'medium-term', 'Vehicles, Machinery & Equipment', asset);
                                            break;
                                        case 'other':
                                            updateAssetStatementCategory(instance, asset.data.liquidityType, asset.data.liquidityCategory, asset);
                                            break;
                                    }
                                }

                                angular.forEach(asset.liabilities, function (liability) {
                                    // Check liability is not already added
                                    if (underscore.findWhere(evaluatedModels, {uuid: liability.uuid}) === undefined) {
                                        evaluatedModels.push(liability);

                                        var section = (liability.type === 'rent' ? 'capitalExpenditure' : 'debtRedemption'),
                                            typeTitle = (liability.type !== 'other' ? Liability.getTypeTitle(liability.type) : liability.name),
                                            liabilityMonths = liability.liabilityInRange(instance.startDate, instance.endDate);

                                        if (asset.type === 'farmland' && liability.type !== 'rent' && moment(liability.startDate, 'YYYY-MM-DD').isBetween(startMonth, endMonth)) {
                                            monthDiff = moment(liability.startDate, 'YYYY-MM-DD').diff(startMonth, 'months');

                                            initializeCategoryValues(instance, 'capitalExpenditure', 'Land', numberOfMonths);

                                            instance.data.capitalExpenditure['Land'][monthDiff] = safeMath.plus(instance.data.capitalExpenditure['Land'][monthDiff], liability.openingBalance);
                                        }

                                        initializeCategoryValues(instance, section, typeTitle, numberOfMonths);

                                        instance.data[section][typeTitle] = underscore.map(liabilityMonths, function (month, index) {
                                            return safeArrayMath.reduce(month.repayment, instance.data[section][typeTitle][index]);
                                        });

                                        // TODO: deal with missing liquidityType for 'Other' liabilities
                                        updateLiabilityStatementCategory(instance, liability)
                                    }
                                });
                            }
                        });

                    underscore.each(instance.models.liabilities, function (liability) {
                        // Check liability is not already added
                        if (underscore.findWhere(evaluatedModels, {uuid: liability.uuid}) === undefined) {
                            evaluatedModels.push(liability);

                            liability = Liability.new(liability);

                            var section = (liability.type === 'rent' ? 'capitalExpenditure' : 'debtRedemption'),
                                typeTitle = (liability.type !== 'other' ? Liability.getTypeTitle(liability.type) : liability.name),
                                liabilityMonths = liability.liabilityInRange(instance.startDate, instance.endDate);

                            initializeCategoryValues(instance, section, typeTitle, numberOfMonths);

                            instance.data[section][typeTitle] = underscore.map(liabilityMonths, function (month, index) {
                                return safeArrayMath.reduce(month.repayment, instance.data[section][typeTitle][index]);
                            });

                            updateLiabilityStatementCategory(instance, liability);
                        }
                    });
                }

                /**
                 * Recalculate summary & ratio data
                 */
                function calculateYearlyTotal (monthlyTotals, year) {
                    return safeArrayMath.reduce(monthlyTotals.slice((year - 1) * 12, year * 12));
                }

                function calculateEndOfYearValue(monthlyTotals, year) {
                    var yearSlice = monthlyTotals.slice((year - 1) * 12, year * 12);
                    return yearSlice[yearSlice.length - 1];
                }

                function calculateMonthlyAssetTotal (instance, types) {
                    var ignoredItems = ['Bank Capital', 'Bank Overdraft'];

                    return underscore.chain(instance.data.assetStatement)
                        .pick(types)
                        .values()
                        .flatten()
                        .compact()
                        .reduce(function (totals, item) {
                            return (!underscore.contains(ignoredItems, item.name) && !underscore.isUndefined(item.monthly) ? safeArrayMath.plus(totals, item.monthly.marketValue) : totals);
                        }, Base.initializeArray(instance.numberOfMonths))
                        .value();
                }

                function calculateAssetLiabilityGroupTotal (instance, type, subTypes) {
                    subTypes = (underscore.isArray(subTypes) ? subTypes : [subTypes]);

                    var numberOfMonths = instance.numberOfMonths,
                        numberOfYears = instance.numberOfYears,
                        result = (type === 'asset' ? {
                            estimatedValue: 0,
                            marketValue: 0,
                            monthly: {
                                marketValue: Base.initializeArray(numberOfMonths),
                                depreciation: Base.initializeArray(numberOfMonths)
                            },
                            yearly: {
                                marketValue: Base.initializeArray(numberOfYears),
                                depreciation: Base.initializeArray(numberOfYears)
                            }
                        } : {
                            currentValue: 0,
                            yearlyValues: Base.initializeArray(numberOfYears)
                        } );

                    underscore.each(subTypes, function (subType) {
                        result = underscore.reduce(instance.data[type + 'Statement'][subType], function(total, item) {
                            if (type === 'asset') {
                                total.estimatedValue = safeMath.plus(total.estimatedValue, item.estimatedValue);
                                total.marketValue = safeMath.plus(total.marketValue, item.marketValue);
                                total.monthly.depreciation = safeArrayMath.plus(total.monthly.depreciation, item.monthly.depreciation);
                                total.monthly.marketValue = safeArrayMath.plus(total.monthly.marketValue, item.monthly.marketValue);
                                total.yearly.depreciation = safeArrayMath.plus(total.yearly.depreciation, item.yearly.depreciation);
                                total.yearly.marketValue = safeArrayMath.plus(total.yearly.marketValue, item.yearly.marketValue);
                            } else {
                                total.currentValue = safeMath.plus(total.currentValue, item.currentValue);
                                total.yearlyValues = safeArrayMath.plus(total.yearlyValues, item.yearlyValues);
                            }
                            return total;
                        }, result);
                    });

                    return result;
                }

                function calculateMonthlyLiabilityPropertyTotal (instance, liabilityTypes, property, startMonth, endMonth) {
                    var liabilities = underscore.filter(instance.models.liabilities, function(liability) {
                        if (!liabilityTypes || liabilityTypes.length === 0) return true;

                        return liabilityTypes.indexOf(liability.type) !== -1;
                    });

                    if (liabilities.length === 0) return Base.initializeArray(instance.numberOfMonths);

                    return underscore.chain(liabilities)
                        .map(function(liability) {
                            var range = new Liability(liability).liabilityInRange(startMonth, endMonth);

                            return underscore.chain(range)
                                .pluck(property)
                                .map(function (propertyValue) {
                                    return (underscore.isNumber(propertyValue) ? propertyValue : safeArrayMath.reduce(propertyValue))
                                })
                                .value();
                        })
                        .unzip()
                        .map(safeArrayMath.reduce)
                        .value();
                }

                function calculateMonthlyCategoriesTotal (categories, results) {
                    underscore.reduce(categories, function (currentTotals, category) {
                        underscore.each(category, function (month, index) {
                            currentTotals[index] += month;
                        });
                        return currentTotals;
                    }, results);

                    return results;
                }

                function calculateMonthlySectionsTotal (sections, results) {
                    return underscore.reduce(sections, function (sectionTotals, section) {
                        return (section ? calculateMonthlyCategoriesTotal(section, sectionTotals) : sectionTotals);
                    }, results);
                }


                function calculateYearlyLivestockAdjustment (instance, year) {
                    var startDate = moment(instance.startDate).add(year - 1, 'y'),
                        endDate = moment(instance.startDate).add(year, 'y');

                    return underscore.chain(instance.models.assets)
                        .where({type: 'livestock'})
                        .map(AssetFactory.new)
                        .reduce(function (total, asset) {
                            var monthly = asset.inventoryInRange(startDate, endDate),
                                openingMonth = underscore.first(monthly),
                                closingMonth = underscore.last(monthly);

                            var openingStockValue = safeMath.times(openingMonth.opening.quantity, asset.marketPriceAtDate(startDate)),
                                closingStockValue = safeMath.times(closingMonth.opening.quantity, asset.marketPriceAtDate(endDate)),
                                purchaseSubtotal = asset.subtotalInRange('Purchase', startDate, endDate);

                            return safeMath.plus(total, safeMath.minus(safeMath.minus(closingStockValue, openingStockValue), purchaseSubtotal.value));
                        }, 0)
                        .value();
                }

                function calculateYearlyLivestockConsumption (instance, year) {
                    var startDate = moment(instance.startDate).add(year - 1, 'y'),
                        endDate = moment(instance.startDate).add(year, 'y');

                    return underscore.chain(instance.models.assets)
                        .where({type: 'livestock'})
                        .map(AssetFactory.new)
                        .reduce(function (total, asset) {
                            return safeMath.plus(total, asset.subtotalInRange(['Household', 'Labour'], startDate, endDate).value);
                        }, 0)
                        .value();
                }

                function recalculate (instance) {
                    var startMonth = moment(instance.startDate, 'YYYY-MM-DD'),
                        endMonth = moment(instance.endDate, 'YYYY-MM-DD'),
                        numberOfMonths = instance.numberOfMonths,
                        taxRatePerYear = safeMath.dividedBy(instance.data.account.incomeTaxRate, 100);

                    instance.data.summary = {
                        monthly: {},
                        yearly: {}
                    };

                    instance.data.capitalIncome = {};
                    instance.data.capitalExpenditure = {};
                    instance.data.capitalLoss = {};
                    instance.data.capitalProfit = {};
                    instance.data.cashInflow = {};
                    instance.data.cashOutflow = {};
                    instance.data.debtRedemption = {};
                    instance.data.assetMarketValue = {};
                    instance.data.assetStockValue = {};
                    instance.data.assetStatement = {};
                    instance.data.liabilityStatement = {};
                    instance.data.enterpriseProductionIncome = {};
                    instance.data.enterpriseProductionExpenditure = {};
                    instance.data.productionIncome = {};
                    instance.data.productionExpenditure = {};
                    instance.data.productionIncomeComposition = {};
                    instance.data.otherIncome = {};
                    instance.data.otherExpenditure = {};

                    reEvaluateProductionSchedules(instance);
                    reEvaluateAssetsAndLiabilities(instance);
                    reEvaluateIncomeAndExpenses(instance);
                    reEvaluateProductionIncomeAndExpenditure(instance, numberOfMonths);
                    reEvaluateProductionCredit(instance);
                    reEvaluateCashFlow(instance);

                    recalculateIncomeExpensesSummary(instance, startMonth, endMonth, numberOfMonths);
                    recalculatePrimaryAccount(instance, startMonth, endMonth, numberOfMonths);
                    addPrimaryAccountAssetsLiabilities(instance);

                    recalculateAssetStatement(instance);
                    totalAssetsAndLiabilities(instance);
                    recalculateAssetsLiabilitiesInterestSummary(instance, startMonth, endMonth);

                    instance.data.summary.yearly.grossProductionValue = safeArrayMath.plus(instance.data.summary.yearly.productionIncome, safeArrayMath.plus(instance.data.summary.yearly.livestockAdjustment, instance.data.summary.yearly.livestockConsumption));
                    instance.data.summary.yearly.grossProfit = safeArrayMath.minus(instance.data.summary.yearly.grossProductionValue, instance.data.summary.yearly.productionExpenditure);
                    instance.data.summary.yearly.ebitda = safeArrayMath.minus(safeArrayMath.plus(instance.data.summary.yearly.grossProfit, instance.data.summary.yearly.nonFarmIncome), instance.data.summary.yearly.nonFarmExpenditure);
                    instance.data.summary.yearly.ebit = safeArrayMath.minus(instance.data.summary.yearly.ebitda, instance.data.summary.yearly.depreciation);
                    instance.data.summary.yearly.interestPaid = safeArrayMath.plus(instance.data.summary.yearly.totalRent, instance.data.summary.yearly.totalInterest);
                    instance.data.summary.yearly.ebt = safeArrayMath.minus(instance.data.summary.yearly.ebit, instance.data.summary.yearly.interestPaid);
                    instance.data.summary.yearly.taxPaid = underscore.map(instance.data.summary.yearly.ebt, function (value) {
                        return Math.max(0, safeMath.times(value, taxRatePerYear));
                    });
                    instance.data.summary.yearly.netProfit = safeArrayMath.minus(instance.data.summary.yearly.ebt, instance.data.summary.yearly.taxPaid);
                }

                function reEvaluateCashFlow (instance) {
                    instance.data.cashInflow = {
                        capitalIncome: instance.data.capitalIncome,
                        productionIncome: instance.data.productionIncome,
                        otherIncome: instance.data.otherIncome
                    };

                    instance.data.cashOutflow = {
                        capitalExpenditure: instance.data.capitalExpenditure,
                        productionExpenditure: underscore.omit(instance.data.unallocatedProductionExpenditure, ['Farm Products Consumed']),
                        otherExpenditure: underscore.omit(instance.data.otherExpenditure, ['Farm Products Consumed'])
                    };
                }

                function recalculateIncomeExpensesSummary (instance, startMonth, endMonth, numberOfMonths) {
                    var cashInflow = calculateMonthlySectionsTotal([instance.data.cashInflow.capitalIncome, instance.data.cashInflow.productionIncome, instance.data.cashInflow.otherIncome], Base.initializeArray(numberOfMonths)),
                        cashOutflow = calculateMonthlySectionsTotal([instance.data.cashOutflow.capitalExpenditure, instance.data.cashOutflow.productionExpenditure, instance.data.cashOutflow.otherExpenditure], Base.initializeArray(numberOfMonths)),
                        productionCreditRepayments = underscore.reduce(cashInflow, function (repayment, income, index) {
                            repayment[index] = (income - repayment[index] < 0 ? income : repayment[index]);
                            return repayment;
                        }, calculateMonthlyLiabilityPropertyTotal(instance, ['production-credit'], 'repayment', startMonth, endMonth)),
                        cashInflowAfterRepayments = safeArrayMath.minus(cashInflow, productionCreditRepayments),
                        debtRedemptionAfterRepayments = safeArrayMath.minus(calculateMonthlySectionsTotal([instance.data.debtRedemption], Base.initializeArray(numberOfMonths)), productionCreditRepayments);

                    underscore.extend(instance.data.summary.monthly, {
                        // Income
                        productionIncome: calculateMonthlySectionsTotal([instance.data.productionIncome], Base.initializeArray(numberOfMonths)),
                        capitalIncome: calculateMonthlySectionsTotal([instance.data.capitalIncome], Base.initializeArray(numberOfMonths)),
                        capitalProfit: calculateMonthlySectionsTotal([instance.data.capitalProfit], Base.initializeArray(numberOfMonths)),
                        otherIncome: calculateMonthlySectionsTotal([instance.data.otherIncome], Base.initializeArray(numberOfMonths)),
                        nonFarmIncome: calculateMonthlySectionsTotal([instance.data.capitalProfit, instance.data.otherIncome], Base.initializeArray(numberOfMonths)),
                        totalIncome: calculateMonthlySectionsTotal([instance.data.capitalIncome, instance.data.productionIncome, instance.data.otherIncome], Base.initializeArray(numberOfMonths)),
                        cashInflowAfterRepayments: cashInflowAfterRepayments,

                        // Expenses
                        unallocatedProductionExpenditure: calculateMonthlySectionsTotal([instance.data.unallocatedProductionExpenditure], Base.initializeArray(numberOfMonths)),
                        productionExpenditure: calculateMonthlySectionsTotal([instance.data.productionExpenditure], Base.initializeArray(numberOfMonths)),
                        capitalExpenditure: calculateMonthlySectionsTotal([instance.data.capitalExpenditure], Base.initializeArray(numberOfMonths)),
                        capitalLoss: calculateMonthlySectionsTotal([instance.data.capitalLoss], Base.initializeArray(numberOfMonths)),
                        otherExpenditure: calculateMonthlySectionsTotal([instance.data.otherExpenditure], Base.initializeArray(numberOfMonths)),
                        nonFarmExpenditure: calculateMonthlySectionsTotal([instance.data.capitalLoss, instance.data.otherExpenditure], Base.initializeArray(numberOfMonths)),
                        debtRedemption: debtRedemptionAfterRepayments,
                        totalExpenditure: safeArrayMath.plus(debtRedemptionAfterRepayments, calculateMonthlySectionsTotal([instance.data.capitalExpenditure, instance.data.unallocatedProductionExpenditure, instance.data.otherExpenditure], Base.initializeArray(numberOfMonths))),
                        cashOutflowAfterRepayments: safeArrayMath.plus(debtRedemptionAfterRepayments, cashOutflow)
                    });

                    var livestockAdjustment = [calculateYearlyLivestockAdjustment(instance, 1), calculateYearlyLivestockAdjustment(instance, 2)],
                        livestockConsumption = [calculateYearlyLivestockConsumption(instance, 1), calculateYearlyLivestockConsumption(instance, 2)];

                    underscore.extend(instance.data.summary.yearly, {
                        livestockAdjustment: livestockAdjustment,
                        livestockConsumption: livestockConsumption,

                        // Income
                        productionIncome: [calculateYearlyTotal(instance.data.summary.monthly.productionIncome, 1), calculateYearlyTotal(instance.data.summary.monthly.productionIncome, 2)],
                        productionIncomeComposition: [calculateYearlyProductionIncomeComposition(instance.data.productionIncomeComposition, 1), calculateYearlyProductionIncomeComposition(instance.data.productionIncomeComposition, 2)],
                        capitalIncome: [calculateYearlyTotal(instance.data.summary.monthly.capitalIncome, 1), calculateYearlyTotal(instance.data.summary.monthly.capitalIncome, 2)],
                        capitalProfit: [calculateYearlyTotal(instance.data.summary.monthly.capitalProfit, 1), calculateYearlyTotal(instance.data.summary.monthly.capitalProfit, 2)],
                        otherIncome: [calculateYearlyTotal(instance.data.summary.monthly.otherIncome, 1), calculateYearlyTotal(instance.data.summary.monthly.otherIncome, 2)],
                        nonFarmIncome: [calculateYearlyTotal(instance.data.summary.monthly.nonFarmIncome, 1), calculateYearlyTotal(instance.data.summary.monthly.nonFarmIncome, 2)],
                        totalIncome: [calculateYearlyTotal(instance.data.summary.monthly.totalIncome, 1), calculateYearlyTotal(instance.data.summary.monthly.totalIncome, 2)],
                        cashInflowAfterRepayments: [calculateYearlyTotal(instance.data.summary.monthly.cashInflowAfterRepayments, 1), calculateYearlyTotal(instance.data.summary.monthly.cashInflowAfterRepayments, 2)],

                        // Expenses
                        unallocatedProductionExpenditure: [calculateYearlyTotal(instance.data.summary.monthly.unallocatedProductionExpenditure, 1), calculateYearlyTotal(instance.data.summary.monthly.unallocatedProductionExpenditure, 2)],
                        productionExpenditure: [calculateYearlyTotal(instance.data.summary.monthly.productionExpenditure, 1), calculateYearlyTotal(instance.data.summary.monthly.productionExpenditure, 2)],
                        capitalExpenditure: [calculateYearlyTotal(instance.data.summary.monthly.capitalExpenditure, 1), calculateYearlyTotal(instance.data.summary.monthly.capitalExpenditure, 2)],
                        capitalLoss: [calculateYearlyTotal(instance.data.summary.monthly.capitalLoss, 1), calculateYearlyTotal(instance.data.summary.monthly.capitalLoss, 2)],
                        otherExpenditure: [calculateYearlyTotal(instance.data.summary.monthly.otherExpenditure, 1), calculateYearlyTotal(instance.data.summary.monthly.otherExpenditure, 2)],
                        nonFarmExpenditure: [calculateYearlyTotal(instance.data.summary.monthly.nonFarmExpenditure, 1), calculateYearlyTotal(instance.data.summary.monthly.nonFarmExpenditure, 2)],
                        debtRedemption: [calculateYearlyTotal(instance.data.summary.monthly.debtRedemption, 1), calculateYearlyTotal(instance.data.summary.monthly.debtRedemption, 2)],
                        totalExpenditure: [calculateYearlyTotal(instance.data.summary.monthly.totalExpenditure, 1), calculateYearlyTotal(instance.data.summary.monthly.totalExpenditure, 2)],
                        cashOutflowAfterRepayments: [calculateYearlyTotal(instance.data.summary.monthly.cashOutflowAfterRepayments, 1), calculateYearlyTotal(instance.data.summary.monthly.cashOutflowAfterRepayments, 2)]
                    });
                }

                function recalculateAssetsLiabilitiesInterestSummary (instance, startMonth, endMonth) {
                    var numberOfMonths = instance.numberOfMonths,
                        numberOfYears = instance.numberOfYears;

                    underscore.extend(instance.data.summary.monthly, {
                        // Interest
                        productionCreditInterest: calculateMonthlyLiabilityPropertyTotal(instance, ['short-term', 'production-credit'], 'interest', startMonth, endMonth),
                        mediumTermInterest: calculateMonthlyLiabilityPropertyTotal(instance, ['medium-term'], 'interest', startMonth, endMonth),
                        longTermInterest: calculateMonthlyLiabilityPropertyTotal(instance, ['long-term'], 'interest', startMonth, endMonth),
                        totalInterest: safeArrayMath.plus(calculateMonthlyLiabilityPropertyTotal(instance, ['short-term', 'long-term', 'medium-term'], 'interest', startMonth, endMonth), instance.data.summary.monthly.primaryAccountInterest),

                        // Liabilities
                        currentLiabilities: safeArrayMath.plus(calculateMonthlyLiabilityPropertyTotal(instance, ['short-term', 'production-credit'], 'closing', startMonth, endMonth), instance.data.summary.monthly.primaryAccountLiability),
                        mediumLiabilities: calculateMonthlyLiabilityPropertyTotal(instance, ['medium-term'], 'closing', startMonth, endMonth),
                        longLiabilities: calculateMonthlyLiabilityPropertyTotal(instance, ['long-term'], 'closing', startMonth, endMonth),
                        totalLiabilities: safeArrayMath.plus(calculateMonthlyLiabilityPropertyTotal(instance, [], 'closing', startMonth, endMonth), instance.data.summary.monthly.primaryAccountLiability),
                        totalRent: calculateMonthlyLiabilityPropertyTotal(instance, ['rent'], 'repayment', startMonth, endMonth),

                        // Assets
                        currentAssets: safeArrayMath.plus(calculateMonthlyAssetTotal(instance, ['short-term']), instance.data.summary.monthly.primaryAccountCapital),
                        movableAssets: calculateMonthlyAssetTotal(instance, ['medium-term']),
                        fixedAssets: calculateMonthlyAssetTotal(instance, ['long-term']),
                        totalAssets: safeArrayMath.plus(calculateMonthlyAssetTotal(instance, ['short-term', 'medium-term', 'long-term']), instance.data.summary.monthly.primaryAccountCapital),

                        depreciation: instance.data.assetStatement.total.monthly.depreciation || Base.initializeArray(numberOfMonths)
                    });

                    underscore.extend(instance.data.summary.yearly, {
                        // Interest
                        productionCreditInterest: [calculateYearlyTotal(instance.data.summary.monthly.productionCreditInterest, 1), calculateYearlyTotal(instance.data.summary.monthly.productionCreditInterest, 2)],
                        mediumTermInterest: [calculateYearlyTotal(instance.data.summary.monthly.mediumTermInterest, 1), calculateYearlyTotal(instance.data.summary.monthly.mediumTermInterest, 2)],
                        longTermInterest: [calculateYearlyTotal(instance.data.summary.monthly.longTermInterest, 1), calculateYearlyTotal(instance.data.summary.monthly.longTermInterest, 2)],
                        totalInterest: [calculateYearlyTotal(instance.data.summary.monthly.totalInterest, 1), calculateYearlyTotal(instance.data.summary.monthly.totalInterest, 2)],

                        // Liabilities
                        currentLiabilities: calculateAssetLiabilityGroupTotal(instance, 'liability', 'short-term'),
                        mediumLiabilities: calculateAssetLiabilityGroupTotal(instance, 'liability', 'medium-term'),
                        longLiabilities: calculateAssetLiabilityGroupTotal(instance, 'liability', 'long-term'),
                        totalLiabilities: [calculateEndOfYearValue(instance.data.summary.monthly.totalLiabilities, 1), calculateEndOfYearValue(instance.data.summary.monthly.totalLiabilities, 2)],
                        totalRent: [calculateYearlyTotal(instance.data.summary.monthly.totalRent, 1), calculateYearlyTotal(instance.data.summary.monthly.totalRent, 2)],

                        // Assets
                        currentAssets: calculateAssetLiabilityGroupTotal(instance, 'asset', 'short-term'),
                        movableAssets: calculateAssetLiabilityGroupTotal(instance, 'asset', 'medium-term'),
                        fixedAssets: calculateAssetLiabilityGroupTotal(instance, 'asset', 'long-term'),
                        totalAssets: instance.data.assetStatement.total.yearly.marketValue || Base.initializeArray(numberOfYears),

                        depreciation: instance.data.assetStatement.total.yearly.depreciation || Base.initializeArray(numberOfYears)
                    });

                    calculateAssetLiabilityGrowth(instance);
                }

                function calculateAssetLiabilityGrowth (instance) {
                    var currentWorth = safeMath.minus(instance.data.assetStatement.total.estimatedValue, instance.data.liabilityStatement.total.currentValue),
                        netWorth = safeArrayMath.minus(instance.data.assetStatement.total.yearly.marketValue, instance.data.liabilityStatement.total.yearlyValues);

                    underscore.extend(instance.data.summary.yearly, {
                        netWorth: {
                            current: currentWorth,
                            yearly: netWorth
                        },
                        netWorthGrowth: underscore.map(netWorth, function (value, index) {
                            return (index === 0 ? safeMath.minus(value, currentWorth) : safeMath.minus(value, netWorth[index - 1]));
                        })
                    });
                }

                /**
                 * Primary Account Handling
                 */
                function recalculatePrimaryAccount(instance, startMonth, endMonth, numberOfMonths) {
                    var numberOfYears = instance.numberOfYears,
                        defaultObject = {
                            opening: 0,
                            inflow: 0,
                            outflow: 0,
                            balance: 0,
                            interestPayable: 0,
                            interestReceivable: 0,
                            closing: 0
                        };

                    instance.data.summary.monthly.primaryAccountInterest = Base.initializeArray(numberOfMonths);
                    instance.data.summary.monthly.primaryAccountCapital = Base.initializeArray(numberOfMonths);
                    instance.data.summary.monthly.primaryAccountLiability = Base.initializeArray(numberOfMonths);

                    instance.account.monthly = underscore.chain(underscore.range(numberOfMonths))
                        .map(function () {
                            return underscore.extend({}, defaultObject);
                        })
                        .reduce(function (monthly, month, index) {
                            month.opening = (index === 0 ? instance.account.openingBalance : monthly[monthly.length - 1].closing);
                            month.inflow = instance.data.summary.monthly.cashInflowAfterRepayments[index];
                            month.outflow = instance.data.summary.monthly.cashOutflowAfterRepayments[index];
                            month.balance = safeMath.plus(month.opening, safeMath.minus(month.inflow, month.outflow));
                            month.interestPayable = (month.balance < 0 && instance.account.interestRateDebit ?
                                safeMath.times(Math.abs(month.balance), safeMath.chain(instance.account.interestRateDebit)
                                    .dividedBy(100)
                                    .dividedBy(12)
                                    .toNumber()) : 0);
                            month.interestReceivable = (month.balance > 0 && instance.account.interestRateCredit ?
                                safeMath.times(month.balance, safeMath.chain(instance.account.interestRateCredit)
                                    .dividedBy(100)
                                    .dividedBy(12)
                                    .toNumber()) : 0);
                            month.closing = safeMath.chain(month.balance).minus(month.interestPayable).plus(month.interestReceivable).toNumber();

                            instance.data.summary.monthly.primaryAccountInterest[index] = safeMath.plus(instance.data.summary.monthly.primaryAccountInterest[index], month.interestPayable);
                            instance.data.summary.monthly.primaryAccountCapital[index] = safeMath.plus(instance.data.summary.monthly.primaryAccountCapital[index], Math.abs(Math.max(0, month.closing)));
                            instance.data.summary.monthly.primaryAccountLiability[index] = safeMath.plus(instance.data.summary.monthly.primaryAccountLiability[index], Math.abs(Math.min(0, month.closing)));

                            monthly.push(month);
                            return monthly;
                        }, [])
                        .value();

                    instance.account.yearly = underscore.chain(underscore.range(numberOfYears))
                        .map(function () {
                            return underscore.extend({
                                worstBalance: 0,
                                bestBalance: 0,
                                openingMonth: null,
                                closingMonth: null
                            }, defaultObject);
                        })
                        .reduce(function (yearly, year, index) {
                            var months = instance.account.monthly.slice(index * 12, (index + 1) * 12);
                            year.opening = months[0].opening;
                            year.inflow = safeArrayMath.reduceProperty(months, 'inflow');
                            year.outflow = safeArrayMath.reduceProperty(months, 'outflow');
                            year.balance = safeMath.plus(year.opening, safeMath.minus(year.inflow, year.outflow));
                            year.interestPayable = safeArrayMath.reduceProperty(months, 'interestPayable');
                            year.interestReceivable = safeArrayMath.reduceProperty(months, 'interestReceivable');
                            year.closing = safeMath.chain(year.balance).minus(year.interestPayable).plus(year.interestReceivable).toNumber();
                            year.openingMonth = moment(startMonth, 'YYYY-MM-DD').add(index, 'years').format('YYYY-MM-DD');
                            year.closingMonth = moment(startMonth, 'YYYY-MM-DD').add(index, 'years').add(months.length - 1, 'months').format('YYYY-MM-DD');

                            var bestBalance = underscore.max(months, function (month) { return month.closing; }),
                                worstBalance = underscore.min(months, function (month) { return month.closing; });
                            year.bestBalance = {
                                balance: bestBalance.closing,
                                month: moment(year.openingMonth, 'YYYY-MM-DD').add(months.indexOf(bestBalance), 'months').format('YYYY-MM-DD')
                            };
                            year.worstBalance = {
                                balance: worstBalance.closing,
                                month: moment(year.openingMonth, 'YYYY-MM-DD').add(months.indexOf(worstBalance), 'months').format('YYYY-MM-DD')
                            };

                            yearly.push(year);
                            return yearly;
                        }, [])
                        .value();

                    instance.data.summary.yearly.primaryAccountInterest = [calculateYearlyTotal(instance.data.summary.monthly.primaryAccountInterest, 1), calculateYearlyTotal(instance.data.summary.monthly.primaryAccountInterest, 2)];
                    instance.data.summary.yearly.primaryAccountCapital = [calculateEndOfYearValue(instance.data.summary.monthly.primaryAccountCapital, 1), calculateEndOfYearValue(instance.data.summary.monthly.primaryAccountCapital, 2)];
                    instance.data.summary.yearly.primaryAccountLiability = [calculateEndOfYearValue(instance.data.summary.monthly.primaryAccountLiability, 1), calculateEndOfYearValue(instance.data.summary.monthly.primaryAccountLiability, 2)];
                }

                function addPrimaryAccountAssetsLiabilities (instance) {
                    // Bank Capital
                    instance.data.assetStatement['short-term'] = instance.data.assetStatement['short-term'] || [];
                    instance.data.assetStatement['short-term'].push({
                        name: 'Bank Capital',
                        estimatedValue: Math.max(0, instance.account.openingBalance),
                        marketValue: Math.max(0, instance.account.openingBalance),
                        monthly: {
                            marketValue: underscore.map(instance.account.monthly, function (monthly) {
                                return Math.max(0, monthly.closing);
                            }),
                            depreciation: Base.initializeArray(instance.numberOfMonths)
                        },
                        yearly: {
                            marketValue: underscore.map(instance.account.yearly, function (yearly) {
                                return Math.max(0, yearly.closing);
                            }),
                            depreciation: Base.initializeArray(instance.numberOfYears)
                        }
                    });

                    // Bank Overdraft
                    instance.data.liabilityStatement['short-term'] = instance.data.liabilityStatement['short-term'] || [];
                    instance.data.liabilityStatement['short-term'].push({
                        name: 'Bank Overdraft',
                        currentValue: Math.abs(Math.min(0, instance.account.openingBalance)),
                        yearlyValues: [instance.data.summary.yearly.primaryAccountLiability[0], instance.data.summary.yearly.primaryAccountLiability[1]]
                    });
                }

                /**
                 * Ratios
                 */
                function recalculateRatios (instance) {
                    instance.data.ratios = {
                        interestCover: calculateRatio(instance, 'operatingProfit', 'totalInterest'),
                        inputOutput: calculateRatio(instance, 'productionIncome', ['productionExpenditure', 'productionCreditInterest', 'primaryAccountInterest']),
                        productionCost: calculateRatio(instance, 'productionExpenditure', 'productionIncome'),
                        cashFlowBank: calculateRatio(instance, 'cashInflowAfterRepayments', ['capitalExpenditure', 'unallocatedProductionExpenditure', 'debtRedemption', 'otherExpenditure', 'primaryAccountInterest']),
                        //TODO: add payments to co-ops with crop deliveries to cashFlowFarming denominator
                        cashFlowFarming: calculateRatio(instance, 'totalIncome', ['capitalExpenditure', 'productionExpenditure', 'debtRedemption', 'otherExpenditure', 'primaryAccountInterest']),
                        debtToTurnover: calculateRatio(instance, 'totalLiabilities', ['productionIncome', 'otherIncome']),
                        interestToTurnover: calculateRatio(instance, 'totalInterest', ['productionIncome', 'otherIncome']),
                        //TODO: change denominator to total asset value used for farming
                        returnOnInvestment: calculateRatio(instance, 'operatingProfit', 'totalAssets')
                    };

                    calculateAssetsLiabilitiesRatios(instance);
                    calculateAccountRatios(instance);
                }

                function calculateAccountRatios (instance) {
                    var debtRatioYear1 = calculateDebtStageRatio(instance, 0),
                        debtRatioYear2 = calculateDebtStageRatio(instance, 1);

                    instance.data.ratios = underscore.extend(instance.data.ratios, {
                        debtMinStage: [debtRatioYear1.min, debtRatioYear2.min],
                        debtMaxStage: [debtRatioYear1.max, debtRatioYear2.max]
                    });
                }

                function calculateDebtStageRatio (instance, year) {
                    var yearStart = 12 * year,
                        yearEnd = 12 * (year + 1);

                    function slice (array) {
                        return array.slice(yearStart, yearEnd);
                    }

                    var totalAssetsMinusAccountCapital = safeArrayMath.minus(slice(instance.data.summary.monthly.totalAssets), slice(instance.data.summary.monthly.primaryAccountCapital)),
                        minusCapitalIncome = safeArrayMath.minus(totalAssetsMinusAccountCapital, slice(instance.data.summary.monthly.capitalIncome)),
                        plusAccountCapital = safeArrayMath.plus(minusCapitalIncome, slice(instance.data.summary.monthly.primaryAccountCapital)),
                        plusCapitalExpenditure = safeArrayMath.plus(plusAccountCapital, slice(instance.data.summary.monthly.capitalExpenditure)),
                        plusTotalIncome = safeArrayMath.plus(plusCapitalExpenditure, slice(instance.data.summary.monthly.totalIncome)),
                        minusCashInflowAfterRepayments = safeArrayMath.minus(plusTotalIncome, slice(instance.data.summary.monthly.cashInflowAfterRepayments)),
                        totalDebt = slice(instance.data.summary.monthly.totalLiabilities);

                    var debtRatio = underscore.map(minusCashInflowAfterRepayments, function (month, index) {
                        return safeMath.dividedBy(totalDebt[index], month);
                    });

                    return {
                        min: underscore.min(debtRatio),
                        max: underscore.max(debtRatio)
                    };
                }

                function calculateAssetsLiabilitiesRatios (instance) {
                    var defaultObj = { yearly: [], marketValue: 0, estimatedValue: 0 };

                    instance.data.ratios = underscore.extend(instance.data.ratios, {
                        netCapital: defaultObj,
                        gearing: defaultObj,
                        debt: defaultObj
                    });

                    instance.data.ratios.netCapital = underscore.mapObject(instance.data.ratios.netCapital, function(value, key) {
                        if (underscore.contains(['marketValue', 'estimatedValue'], key)) {
                            return safeMath.dividedBy(instance.data.assetStatement.total[key], instance.data.liabilityStatement.total.currentValue);
                        } else if (key === 'yearly') {
                            return safeArrayMath.dividedBy(instance.data.assetStatement.total.yearly.marketValue, instance.data.liabilityStatement.total.yearlyValues);
                        }
                    });

                    instance.data.ratios.debt = underscore.mapObject(instance.data.ratios.debt, function(value, key) {
                        if (underscore.contains(['marketValue', 'estimatedValue'], key)) {
                            return safeMath.dividedBy(instance.data.liabilityStatement.total.currentValue, instance.data.assetStatement.total[key]);
                        } else if (key === 'yearly') {
                            return safeArrayMath.dividedBy(instance.data.liabilityStatement.total.yearlyValues, instance.data.assetStatement.total.yearly.marketValue);
                        }
                    });

                    instance.data.ratios.gearing = underscore.mapObject(instance.data.ratios.gearing, function(value, key) {
                        if (underscore.contains(['marketValue', 'estimatedValue'], key)) {
                            return safeMath.dividedBy(instance.data.liabilityStatement.total.currentValue, safeMath.minus(instance.data.assetStatement.total[key], instance.data.liabilityStatement.total.currentValue));
                        } else if (key === 'yearly') {
                            return safeArrayMath.dividedBy(instance.data.liabilityStatement.total.yearlyValues, safeArrayMath.minus(instance.data.assetStatement.total.yearly.marketValue, instance.data.liabilityStatement.total.yearlyValues));
                        }
                    });
                }

                function calculateRatio(instance, numeratorProperties, denominatorProperties) {
                    numeratorProperties = (underscore.isArray(numeratorProperties) ? numeratorProperties : [numeratorProperties]);
                    denominatorProperties = (underscore.isArray(denominatorProperties) ? denominatorProperties : [denominatorProperties]);

                    function sumPropertyValuesForInterval (propertyList, interval) {
                        if (!instance.data.summary[interval]) {
                            return [];
                        }

                        var valueArrays = underscore.chain(propertyList)
                            .map(function(propertyName) {
                                if (propertyName.charAt(0) === '-') {
                                    propertyName = propertyName.substr(1);
                                    return safeArrayMath.negate(instance.data.summary[interval][propertyName]);
                                }
                                return instance.data.summary[interval][propertyName];
                            })
                            .compact()
                            .value();

                        return underscore.reduce(valueArrays.slice(1), function(result, array) {
                            return safeArrayMath.plus(result, array);
                        }, angular.copy(valueArrays[0]) || []);
                    }

                    return {
                        monthly: safeArrayMath.dividedBy(sumPropertyValuesForInterval(numeratorProperties, 'monthly'), sumPropertyValuesForInterval(denominatorProperties, 'monthly')),
                        yearly: safeArrayMath.dividedBy(sumPropertyValuesForInterval(numeratorProperties, 'yearly'), sumPropertyValuesForInterval(denominatorProperties, 'yearly'))
                    }
                }

                computedProperty(this, 'startDate', function () {
                    return this.data.startDate;
                });

                computedProperty(this, 'endDate', function () {
                    this.data.endDate = (this.data.startDate ?
                        moment(this.data.startDate).add(2, 'y').format('YYYY-MM-DD') :
                        this.data.endDate);

                    return this.data.endDate;
                });

                computedProperty(this, 'account', function () {
                    return this.data.account;
                });

                computedProperty(this, 'adjustmentFactors', function () {
                    return this.data.adjustmentFactors;
                });

                computedProperty(this, 'numberOfMonths', function () {
                    return moment(this.endDate, 'YYYY-MM-DD').diff(moment(this.startDate, 'YYYY-MM-DD'), 'months');
                });

                computedProperty(this, 'numberOfYears', function () {
                    return Math.ceil(moment(this.endDate, 'YYYY-MM-DD').diff(moment(this.startDate, 'YYYY-MM-DD'), 'years', true));
                });

                computedProperty(this, 'models', function () {
                    return this.data.models;
                });

                privateProperty(this, 'reEvaluate', function() {
                    reEvaluateBusinessPlan(this);
                });

                privateProperty(this, 'recalculateAccount', function() {
                    recalculatePrimaryAccount(this);
                });

                if (underscore.isEmpty(this.data.models.budgets) && !underscore.isEmpty(this.data.models.productionSchedules))  {
                    updateBudgets(this);
                }

                if (this.data.version <= 16) {
                    migrateProductionSchedules(this);
                }

                if (this.data.version <= 15) {
                    this.updateProductionSchedules(this.data.models.productionSchedules);
                    this.updateFinancials(this.data.models.financials);
                }

                this.data.version = _version;
            }

            function migrateProductionSchedules (instance) {
                var productionSchedules = underscore.chain(instance.data.models.productionSchedules)
                    .map(ProductionSchedule.newCopy)
                    .uniq(function (schedule) {
                        return schedule.scheduleKey;
                    })
                    .value();

                instance.data.models.assets = underscore.map(instance.data.models.assets, function (asset) {
                    var legalEntity = underscore.findWhere(instance.data.legalEntities, {id: asset.legalEntityId}),
                        assetProductionSchedules = asset.productionSchedules;

                    asset = AssetFactory.new(asset);
                    asset.generateKey(legalEntity);

                    underscore.each(assetProductionSchedules, function (schedule) {
                        var assetProductionSchedule = ProductionSchedule.newCopy(schedule),
                            productionSchedule = underscore.findWhere(productionSchedules, {scheduleKey: assetProductionSchedule.scheduleKey}) || assetProductionSchedule;

                        if (underscore.isUndefined(productionSchedule)) {
                            productionSchedules.push(assetProductionSchedule);
                            productionSchedule = assetProductionSchedule;
                        }

                        productionSchedule.addAsset(asset);
                    });

                    return asJson(asset);
                });

                instance.data.models.productionSchedules = asJson(productionSchedules);
            }

            function updateBudgets (instance) {
                instance.data.models.budgets = underscore.chain(instance.data.models.productionSchedules)
                    .pluck('budget')
                    .compact()
                    .uniq(false, function (budget) {
                        return budget.uuid;
                    })
                    .value();
            }

            inheritModel(BusinessPlan, Document);

            readOnlyProperty(BusinessPlan, 'incomeExpenseTypes', {
                'capital': 'Capital',
                'production': 'Production',
                'other': 'Other'
            });

            readOnlyProperty(BusinessPlan, 'incomeSubtypes', {
                'other': [
                    'Interest, Dividends & Subsidies',
                    'Pension Fund',
                    'Short-term Insurance Claims',
                    'VAT Refund',
                    'Inheritance',
                    'Shares',
                    'Other']
            });

            readOnlyProperty(BusinessPlan, 'expenseSubtypes', {
                'production': [
                    'Accident Insurance',
                    'Administration',
                    'Accounting Fees',
                    'Bank Charges',
                    'Crop Insurance',
                    'Fuel',
                    'Electricity',
                    'Government Levy',
                    'Licenses & Membership Fees',
                    'Long term insurance & Policies',
                    'Office Costs',
                    'Property Rates',
                    'Protective Clothing',
                    'Rations',
                    'Repairs & Maintenance',
                    'Staff Salaries & Wages',
                    'Security',
                    'Short-term Insurance',
                    'Unemployment Insurance',
                    'Other'],
                'other': [
                    'Drawings',
                    'Medical',
                    'Life insurance',
                    'University / School fees',
                    'Other']
            });

            BusinessPlan.validates(underscore.defaults({
                docType: {
                    required: true,
                    equal: {
                        to: 'financial resource plan'
                    }
                },
                startDate: {
                    required: true,
                    format: {
                        date: true
                    }
                }
            }, Document.validations));

            return BusinessPlan;
        }];

    DocumentFactoryProvider.add('financial resource plan', 'BusinessPlan');
}]);
