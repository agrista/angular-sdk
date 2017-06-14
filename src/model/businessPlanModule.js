var sdkModelBusinessPlanDocument = angular.module('ag.sdk.model.business-plan', ['ag.sdk.id', 'ag.sdk.helper.enterprise-budget', 'ag.sdk.model.asset', 'ag.sdk.model.document', 'ag.sdk.model.liability', 'ag.sdk.model.production-schedule']);

sdkModelBusinessPlanDocument.factory('BusinessPlan', ['$filter', 'Asset', 'Base', 'computedProperty', 'Document', 'Financial', 'generateUUID', 'inheritModel', 'Liability', 'privateProperty', 'ProductionSchedule', 'readOnlyProperty', 'underscore',
    function ($filter, Asset, Base, computedProperty, Document, Financial, generateUUID, inheritModel, Liability, privateProperty, ProductionSchedule, readOnlyProperty, underscore) {
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
            Base.initializeObject(this.data.models, 'expenses', []);
            Base.initializeObject(this.data.models, 'financials', []);
            Base.initializeObject(this.data.models, 'income', []);
            Base.initializeObject(this.data.models, 'liabilities', []);
            Base.initializeObject(this.data.models, 'productionSchedules', []);

            function reEvaluateBusinessPlan (instance) {
                // Re-evaluate all included models
                reEvaluateProductionSchedules(instance);
                reEvaluateIncomeAndExpenses(instance);

                recalculate(instance);
            }

            function recalculate (instance) {
                // Re-calculate summary, account & ratio data
                recalculateSummary(instance);
                recalculateRatios(instance);
            }

            /**
             * Helper functions
             */
            var roundValue = $filter('round');

            function infinityToZero(value) {
                return (isFinite(value) ? value : 0);
            }

            function sumCollectionProperty(collection, property) {
                return underscore.chain(collection)
                    .pluck(property)
                    .reduce(function(total, value) {
                        return total + value;
                    }, 0)
                    .value();
            }

            function sumCollectionValues (collection) {
                return underscore.reduce(collection || [], function (total, value) {
                    return total + value || 0;
                }, 0);
            }

            function roundCollectionValues (collection) {
                var mapper = (underscore.isArray(collection) ? underscore.map : underscore.mapObject);

                return mapper(collection, function (value) {
                    return roundValue(value, 2);
                });
            }

            function divideArrayValues (numeratorValues, denominatorValues) {
                if (!numeratorValues || !denominatorValues || numeratorValues.length !== denominatorValues.length) {
                    return [];
                }

                return underscore.reduce(denominatorValues, function(result, value, index) {
                    result[index] = infinityToZero(result[index] / value);
                    return result;
                }, angular.copy(numeratorValues));
            }

            function addArrayValues (array1, array2) {
                if (!array1 || !array2 || array1.length !== array2.length) {
                    return [];
                }

                return underscore.reduce(array1, function(result, value, index) {
                    result[index] += value;
                    return result;
                }, angular.copy(array2));
            }

            function subtractArrayValues (array1, array2) {
                return addArrayValues(array1, negateArrayValues(array2));
            }

            function negateArrayValues (array) {
                return underscore.map(array, function(value) {
                    return value * -1;
                });
            }

            function asJson (object, omit) {
                return underscore.omit(object && typeof object.asJSON === 'function' ? object.asJSON() : object, omit || []);
            }

            /**
             * Production Schedule handling
             */
            privateProperty(this, 'updateProductionSchedules', function (schedules) {
                updateProductionSchedules(this, schedules);
            });

            function updateProductionSchedules (instance, schedules) {
                var startMonth = moment(instance.startDate, 'YYYY-MM-DD'),
                    endMonth = moment(instance.endDate, 'YYYY-MM-DD'),
                    cashFlowAdjust = !underscore.isUndefined(instance.data.cashFlowIncome);

                var productionSchedules = angular.copy(instance.models.productionSchedules),
                    oldAdjustedSchedules = [],
                    newAdjustedSchedules = [];

                instance.models.productionSchedules = [];

                angular.forEach(schedules, function (schedule) {
                    var productionSchedule = ProductionSchedule.new(schedule);

                    if (productionSchedule.validate() &&
                        (startMonth.isBetween(schedule.startDate, schedule.endDate) ||
                        (startMonth.isBefore(schedule.endDate) && endMonth.isAfter(schedule.startDate)))) {
                        // Add valid production schedule if between business plan dates
                        instance.models.productionSchedules.push(schedule.asJSON());

                        if (cashFlowAdjust) {
                            var oldSchedule = underscore.findWhere(productionSchedules, {scheduleKey: schedule.scheduleKey});

                            if (oldSchedule) {
                                // Schedule already exists
                                oldAdjustedSchedules.push(oldSchedule);
                                newAdjustedSchedules.push(schedule);

                                productionSchedules = underscore.reject(productionSchedules, function (schedule) {
                                    return oldSchedule.scheduleKey === schedule.scheduleKey;
                                });
                            } else {
                                // Schedule is new
                                // - Add to cash flow
                                addProductionScheduleToCashFlow(instance, schedule);
                            }
                        }
                    }
                });

                
                if (cashFlowAdjust) {
                    // Schedule already exists
                    // - Adjust cash flow
                    // - Remove from old schedules
                    if (underscore.size(oldAdjustedSchedules) > 0) {
                        adjustProductionSchedulesInCashFlow(instance, oldAdjustedSchedules, newAdjustedSchedules);
                    }

                    // Schedules that no longer exist
                    // - Remove schedules from cash flow
                    angular.forEach(productionSchedules, function (schedule) {
                        removeProductionScheduleFromCashFlow(instance, schedule);
                    });
                }

                reEvaluateBusinessPlan(instance);
            }

            function calculateCashFlow (instance, schedules) {
                var startMonth = moment(instance.startDate, 'YYYY-MM-DD'),
                    numberOfMonths = instance.numberOfMonths,
                    cashFlowStartMonth = moment(startMonth).subtract(1, 'y'),
                    cashFlowNumberOfMonths = numberOfMonths + 24;

                var result = {
                    cashFlowIncome: {},
                    cashFlowExpenditure: {}
                };

                angular.forEach(schedules, function (productionSchedule) {
                    var schedule = ProductionSchedule.new(productionSchedule);

                    extractScheduleCategoryValuePerMonth(result.cashFlowIncome, schedule, 'INC', cashFlowStartMonth, cashFlowNumberOfMonths, true);
                    extractScheduleCategoryValuePerMonth(result.cashFlowExpenditure, schedule, 'EXP', cashFlowStartMonth, cashFlowNumberOfMonths, true);
                });

                result.cashFlowIncome = underscore.mapObject(result.cashFlowIncome, roundCollectionValues);
                result.cashFlowExpenditure = underscore.mapObject(result.cashFlowExpenditure, roundCollectionValues);

                return result;
            }

            function calculateEnterpriseCashFlowComposition (instance, schedules) {
                var startMonth = moment(instance.startDate, 'YYYY-MM-DD'),
                    numberOfMonths = instance.numberOfMonths,
                    cashFlowStartMonth = moment(startMonth).subtract(1, 'y'),
                    cashFlowNumberOfMonths = numberOfMonths + 24;

                var productionIncome = {},
                    productionExpenditure = {},
                    incomeResult = {};

                angular.forEach(schedules, function (productionSchedule) {
                    var schedule = ProductionSchedule.new(productionSchedule),
                        commodity = schedule.data.details.commodity;

                    Base.initializeObject(productionIncome, commodity, {});
                    extractScheduleCategory(productionIncome[commodity], schedule, 'INC', cashFlowStartMonth, cashFlowNumberOfMonths);

                    Base.initializeObject(productionExpenditure, commodity, {});
                    extractScheduleCategoryValuePerMonth(productionExpenditure[commodity], schedule, 'EXP', cashFlowStartMonth, cashFlowNumberOfMonths, true);
                });

                angular.forEach(productionIncome, function (income, commodity) {
                    angular.forEach(income, function (values, category) {
                        var enterprise = (category === 'Crop' || category === 'Fruit' ? commodity : category),
                            cashFlowCategoryTotal = sumCollectionValues(instance.data.cashFlowIncome[category]);

                        var totalComposition = underscore.reduce(values, function (total, obj) {
                            total.unit = total.unit || obj.unit;
                            total.quantity += obj.quantity;
                            total.value += obj.value;
                            total.pricePerUnit = (total.quantity ? (total.value / total.quantity) : obj.pricePerUnit);
                            return total;
                        }, {
                            pricePerUnit: 0,
                            quantity: 0,
                            value: 0
                        });

                        var adjustedValues = underscore.map(instance.data.cashFlowIncome[category], function (income) {
                            var quantity = roundValue(totalComposition.quantity * (income / cashFlowCategoryTotal), 2),
                                value = roundValue(totalComposition.value * (income / cashFlowCategoryTotal), 2);

                            return {
                                unit: totalComposition.unit,
                                quantity: quantity,
                                value: value,
                                pricePerUnit: roundValue(quantity ? (value / quantity) : 0, 2)
                            };
                        });

                        incomeResult[enterprise] = (incomeResult[enterprise] ? underscore.reduce(adjustedValues, function (totalObj, obj) {
                            totalObj.quantity = roundValue(totalObj.quantity + obj.quantity, 2);
                            totalObj.value = roundValue(totalObj.value + obj.value, 2);
                            totalObj.pricePerUnit = roundValue(totalObj.quantity ? (totalObj.value / totalObj.quantity) : 0, 2);
                        }, incomeResult[enterprise]) : adjustedValues);
                    });
                });

                return {
                    income: incomeResult,
                    expenditure: underscore.mapObject(productionExpenditure, function (expenditure) {
                        return underscore.mapObject(expenditure, function (values, category) {
                            var enterpriseCategoryTotal = sumCollectionValues(values),
                                cashFlowCategoryTotal = sumCollectionValues(instance.data.cashFlowExpenditure[category]),
                                diff = enterpriseCategoryTotal / cashFlowCategoryTotal;

                            return underscore.map(instance.data.cashFlowExpenditure[category], function (value) {
                                return roundValue(value * diff, 2);
                            });
                        });
                    })
                };
            }

            function addProductionScheduleToCashFlow (instance, schedule) {
                var scheduleCashFlow = calculateCashFlow(instance, [schedule]);

                angular.forEach(scheduleCashFlow, function (categories, section) {
                    angular.forEach(categories, function (values, category) {
                        addScheduleCategoryToCashFlow(instance, section, category, values);
                    });
                });
            }

            function addScheduleCategoryToCashFlow (instance, section, category, values) {
                if (underscore.isUndefined(instance.data[section][category])) {
                    // Insert new category to section
                    instance.data[section][category] = values;
                } else {
                    // Add schedule category values to category
                    instance.data[section][category] = addArrayValues(instance.data[section][category], values);
                }
            }

            function adjustProductionSchedulesInCashFlow (instance, oldSchedules, newSchedules) {
                var oldScheduleCashFlow = calculateCashFlow(instance, oldSchedules),
                    newScheduleCashFlow = calculateCashFlow(instance, newSchedules);

                // Add or adjust new categories
                angular.forEach(newScheduleCashFlow, function (categories, section) {
                    angular.forEach(categories, function (values, category) {
                        if (underscore.isUndefined(oldScheduleCashFlow[section][category])) {
                            // Add new category
                            addScheduleCategoryToCashFlow(instance, section, category, values);
                        } else {
                            // Adjust existing category if different
                            var oldScheduleCategoryTotal = sumCollectionValues(oldScheduleCashFlow[section][category]),
                                newScheduleCategoryTotal = sumCollectionValues(values);

                            if (oldScheduleCategoryTotal !== newScheduleCategoryTotal) {
                                if (oldScheduleCategoryTotal === 0) {
                                    // Current cash flow has no values
                                    // - Copy new values to cash flow
                                    instance.data[section][category] = values;
                                } else {
                                    // Calculate the ratio between old and new cash flows
                                    var cashFlowCategoryTotal = sumCollectionValues(instance.data[section][category]),
                                        cashFlowDiff = newScheduleCategoryTotal / oldScheduleCategoryTotal,
                                        categoryDiff = (cashFlowCategoryTotal - oldScheduleCategoryTotal) / cashFlowCategoryTotal;

                                    instance.data[section][category] = underscore.map(instance.data[section][category], function (value) {
                                        return roundValue((value * categoryDiff) + ((value - (value * categoryDiff)) * cashFlowDiff));
                                    });
                                }
                            }
                        }
                    });
                });

                // Remove deleted categories
                angular.forEach(oldScheduleCashFlow, function (categories, section) {
                    angular.forEach(categories, function (values, category) {
                        if (underscore.isUndefined(newScheduleCashFlow[section][category])) {
                            removeScheduleCategoryFromCashFlow(instance, section, category, values);
                        }
                    });
                });
            }

            function removeProductionScheduleFromCashFlow (instance, schedule) {
                var scheduleCashFlow = calculateCashFlow(instance, [schedule]);

                angular.forEach(scheduleCashFlow, function (categories, section) {
                    angular.forEach(categories, function (values, category) {
                        removeScheduleCategoryFromCashFlow(instance, section, category, values);
                    });
                });
            }

            function removeScheduleCategoryFromCashFlow (instance, section, category, values) {
                var scheduleCategoryTotal = sumCollectionValues(values),
                    cashFlowCategoryTotal = sumCollectionValues(instance.data[section][category]);

                if (scheduleCategoryTotal === cashFlowCategoryTotal) {
                    // Totals are the same
                    // - Remove category
                    delete instance.data[section][category];
                } else {
                    // Try to balance cash flow by removing entries from the same month
                    angular.forEach(instance.data[section][category], function (cashFlowValue, index) {
                        if (values[index] > 0) {
                            if (cashFlowValue >= values[index]) {
                                instance.data[section][category][index] -= values[index];
                                scheduleCategoryTotal -= values[index];
                            } else if (cashFlowValue > 0) {
                                scheduleCategoryTotal -= cashFlowValue;
                                instance.data[section][category][index] = 0;
                            }
                        }
                    });

                    // If it is still unbalanced, remove from each month until balanced
                    if (scheduleCategoryTotal > 0) {
                        angular.forEach(instance.data[section][category], function (cashFlowValue, index) {
                            if (cashFlowValue > 0 && scheduleCategoryTotal > 0) {
                                if (cashFlowValue >= scheduleCategoryTotal) {
                                    instance.data[section][category][index] -= scheduleCategoryTotal;
                                    scheduleCategoryTotal = 0;
                                } else {
                                    scheduleCategoryTotal -= cashFlowValue;
                                    instance.data[section][category][index] = 0;
                                }
                            }
                        });
                    }
                }
            }

            function initializeCategoryValues (instance, section, category, months) {
                instance.data[section] = instance.data[section] || {};
                instance.data[section][category] = instance.data[section][category] || underscore.range(months).map(function () {
                    return 0;
                });
            }

            function getLowerIndexBound (scheduleArray, offset) {
                return (scheduleArray ? Math.min(scheduleArray.length, Math.abs(Math.min(0, offset))) : 0);
            }

            function getUpperIndexBound (scheduleArray, offset, numberOfMonths) {
                return (scheduleArray ? Math.min(numberOfMonths, offset + scheduleArray.length) - offset : 0);
            }

            function extractScheduleCategoryValuePerMonth(dataStore, schedule, code, startMonth, numberOfMonths, forceCategory) {
                var section = underscore.findWhere(schedule.data.sections, {code: code}),
                    scheduleStart = moment(schedule.startDate, 'YYYY-MM-DD');

                if (section) {
                    var offset = scheduleStart.diff(startMonth, 'months');

                    angular.forEach(section.productCategoryGroups, function (group) {
                        angular.forEach(group.productCategories, function (category) {
                            var categoryName = (!forceCategory && (schedule.type !== 'livestock' && code === 'INC') ? schedule.data.details.commodity : category.name);

                            dataStore[categoryName] = dataStore[categoryName] || underscore.range(numberOfMonths).map(function () {
                                return 0;
                            });

                            var minIndex = getLowerIndexBound(category.valuePerMonth, offset);
                            var maxIndex = getUpperIndexBound(category.valuePerMonth, offset, numberOfMonths);
                            for (var i = minIndex; i < maxIndex; i++) {
                                dataStore[categoryName][i + offset] += (category.valuePerMonth[i] || 0);
                            }
                        });
                    });
                }
            }

            function extractScheduleCategory(dataStore, schedule, code, startMonth, numberOfMonths) {
                var section = underscore.findWhere(schedule.data.sections, {code: code}),
                    scheduleStart = moment(schedule.startDate, 'YYYY-MM-DD');

                if (section) {
                    var offset = scheduleStart.diff(startMonth, 'months');

                    angular.forEach(section.productCategoryGroups, function (group) {
                        angular.forEach(group.productCategories, function (category) {
                            var categoryName = category.name;

                            dataStore[categoryName] = dataStore[categoryName] || underscore.range(numberOfMonths).map(function () {
                                return {
                                    unit: category.unit,
                                    pricePerUnit: 0,
                                    quantity: 0,
                                    value: 0
                                };
                            });

                            var minIndex = getLowerIndexBound(category.valuePerMonth, offset);
                            var maxIndex = getUpperIndexBound(category.valuePerMonth, offset, numberOfMonths);

                            for (var i = minIndex; i < maxIndex; i++) {
                                dataStore[categoryName][i + offset].value += (category.valuePerMonth[i] || 0);
                                dataStore[categoryName][i + offset].quantity += (category.quantityPerMonth[i] || 0);
                                dataStore[categoryName][i + offset].pricePerUnit = (dataStore[categoryName][i + offset].quantity ? (dataStore[categoryName][i + offset].value / dataStore[categoryName][i + offset].quantity) : category.pricePerUnit);
                            }
                        });
                    });
                }
            }

            function extractLivestockBreedingStockComposition (instance, schedule) {
                if (schedule.type === 'livestock') {
                    var livestockSalesGroup = schedule.getGroup('INC', 'Livestock Sales', schedule.defaultCostStage);

                    if (livestockSalesGroup) {
                        underscore.each(livestockSalesGroup.productCategories, function (category) {
                            if (category.breedingStock && category.stock) {
                                updateAssetStatementCategory(instance, 'medium-term', 'Breeding Stock', {
                                    data: {
                                        name: category.name,
                                        liquidityType: 'medium-term',
                                        assetValue: (category.stock || 0) * (category.stockPrice || category.pricePerUnit || 0),
                                        scheduleKey: schedule.scheduleKey
                                    }
                                });
                            }
                        });
                    }
                }
            }

            function reEvaluateProductionSchedules (instance) {
                var numberOfMonths = instance.numberOfMonths;

                if (underscore.isUndefined(instance.data.cashFlowIncome)) {
                    underscore.extend(instance.data, calculateCashFlow(instance, instance.models.productionSchedules));
                }

                // Production Income/Expenditure
                instance.data.productionIncome = underscore.mapObject(instance.data.cashFlowIncome, function (values) {
                    return values.slice(12, 12 + numberOfMonths);
                });

                instance.data.productionExpenditure = underscore.mapObject(instance.data.cashFlowExpenditure, function (values) {
                    return values.slice(12, 12 + numberOfMonths);
                });

                instance.data.unallocatedProductionExpenditure = instance.data.unallocatedProductionExpenditure || instance.data.productionExpenditure;

                // Enterprise Production Expenditure
                var enterpriseCashFlowComposition = calculateEnterpriseCashFlowComposition(instance, instance.models.productionSchedules);

                instance.data.productionIncomeComposition = underscore.range(numberOfMonths / 12).map(function (year) {
                    var productionIncome = underscore.chain(enterpriseCashFlowComposition.income)
                        .mapObject(function (values) {
                            return underscore.reduce(values.slice(12 * (year + 1), 12 * (year + 2)), function (total, obj) {
                                total.unit = total.unit || obj.unit;
                                total.quantity = roundValue(total.quantity + obj.quantity, 2);
                                total.value = roundValue(total.value + obj.value, 2);
                                total.pricePerUnit = roundValue(total.quantity ? (total.value / total.quantity) : obj.pricePerUnit, 2);
                                return total;
                            }, {
                                pricePerUnit: 0,
                                quantity: 0,
                                value: 0
                            });
                        })
                        .value();

                    var total = underscore.chain(productionIncome)
                        .values()
                        .pluck('value')
                        .reduce(function (total, value) {return total + (value || 0)}, 0)
                        .value();

                    return underscore.extend({
                        total: {
                            value: total
                        }
                    }, underscore.mapObject(productionIncome, function (obj) {
                        return underscore.extend({
                            contributionPercent: (total ? (obj.value / total) * 100 : 0)
                        }, obj);
                    }));
                });

                instance.data.enterpriseProductionExpenditure = underscore.mapObject(enterpriseCashFlowComposition.expenditure, function (expenditure) {
                    return underscore.mapObject(expenditure, function (values) {
                        return values.slice(12, 12 + numberOfMonths);
                    });
                });
            }

            /**
             * Income & Expenses handling
             */
            privateProperty(this, 'addIncome', function (income) {
                this.models.income = underscore.reject(this.models.income, function (item) {
                    return item.uuid === income.uuid;
                });

                this.models.income.push(income);

                reEvaluateBusinessPlan(this);
                recalculate(this);
            });

            privateProperty(this, 'removeIncome', function (income) {
                this.models.income = underscore.reject(this.models.income, function (item) {
                    return item.uuid === income.uuid;
                });

                reEvaluateBusinessPlan(this);
                recalculate(this);
            });

            privateProperty(this, 'addExpense', function (expense) {
                this.models.expenses = underscore.reject(this.models.expenses, function (item) {
                    return item.uuid === expense.uuid;
                });

                this.models.expenses.push(expense);

                reEvaluateBusinessPlan(this);
                recalculate(this);
            });

            privateProperty(this, 'removeExpense', function (expense) {
                this.models.expenses = underscore.reject(this.models.expenses, function (item) {
                    return item.uuid === expense.uuid;
                });

                reEvaluateBusinessPlan(this);
                recalculate(this);
            });

            function reEvaluateIncomeAndExpenses (instance) {
                var startMonth = moment(instance.startDate, 'YYYY-MM-DD'),
                    endMonth = moment(instance.endDate, 'YYYY-MM-DD'),
                    numberOfMonths = endMonth.diff(startMonth, 'months'),
                    evaluatedModels = [];

                instance.data.otherIncome = {};
                instance.data.otherExpenditure = {};

                underscore.each(instance.models.income, function (income) {
                    var registerLegalEntity = underscore.findWhere(instance.data.legalEntities, {id: income.legalEntityId}),
                        evaluatedModel = underscore.findWhere(evaluatedModels, {uuid: income.uuid}),
                        type = (income.type ? income.type : 'other') + 'Income';

                    // Check income is not already added
                    if (registerLegalEntity && underscore.isUndefined(evaluatedModel) && instance.data[type]) {
                        initializeCategoryValues(instance, type, income.name, numberOfMonths);

                        instance.data[type][income.name] = underscore.map(income.months, function (monthValue, index) {
                            return (monthValue || 0) + (instance.data[type][income.name][index] || 0);
                        });

                        evaluatedModels.push(income);
                    }
                });

                underscore.each(instance.models.expenses, function (expense) {
                    var registerLegalEntity = underscore.findWhere(instance.data.legalEntities, {id: expense.legalEntityId}),
                        evaluatedModel = underscore.findWhere(evaluatedModels, {uuid: expense.uuid}),
                        type = (expense.type ? expense.type : 'other') + 'Expenditure';

                    // Check expense is not already added
                    if (registerLegalEntity && underscore.isUndefined(evaluatedModel) && instance.data[type]) {
                        initializeCategoryValues(instance, type, expense.name, numberOfMonths);

                        instance.data[type][expense.name] = underscore.map(expense.months, function (monthValue, index) {
                            return (monthValue || 0) + (instance.data[type][expense.name][index] || 0);
                        });

                        evaluatedModels.push(expense);
                    }
                });

                instance.data.unallocatedProductionExpenditure = instance.data.unallocatedProductionExpenditure || instance.data.productionExpenditure;
            }

            /**
             * Financials
             */
            privateProperty(this, 'updateFinancials', function (financials) {
                this.models.financials = underscore.chain(financials)
                    .filter(function(financial) {
                        return Financial.new(financial).validate();
                    })
                    .sortBy(function (financial) {
                        return -financial.year;
                    })
                    .first(3)
                    .sortBy(function (financial) {
                        return financial.year;
                    })
                    .value();
            });

            /**
             *   Assets & Liabilities Handling
             */
            privateProperty(this, 'addAsset', function (asset) {
                var instance = this;

                asset = Asset.new(asset);

                if (asset.validate()) {
                    instance.models.assets = underscore.reject(instance.models.assets, function (item) {
                        return item.assetKey === asset.assetKey;
                    });

                    asset.liabilities = underscore.chain(asset.liabilities)
                        .map(function (liability) {
                            if (liability.validate()) {
                                instance.models.liabilities = underscore.reject(instance.models.liabilities, function (item) {
                                    return item.uuid === liability.uuid;
                                });

                                instance.models.liabilities.push(asJson(liability));
                            }

                            return asJson(liability);
                        })
                        .value();

                    instance.models.assets.push(asJson(asset));

                    recalculate(instance);
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

                recalculate(instance);

            });

            privateProperty(this, 'addLiability', function (liability) {
                liability = Liability.new(liability);

                if (liability.validate()) {
                    this.models.liabilities = underscore.reject(this.models.liabilities, function (item) {
                        return item.uuid === liability.uuid;
                    });

                    this.models.liabilities.push(asJson(liability));

                    recalculate(this);
                }
            });

            privateProperty(this, 'removeLiability', function (liability) {
                this.models.liabilities = underscore.reject(this.models.liabilities, function (item) {
                    return item.uuid === liability.uuid;
                });

                recalculate(this);
            });

            function reEvaluateProductionCredit(instance, liabilities) {
                var filteredLiabilities = underscore.where(liabilities, {type: 'production-credit'});

                instance.data.unallocatedEnterpriseProductionExpenditure = angular.copy(instance.data.enterpriseProductionExpenditure);
                instance.data.unallocatedProductionExpenditure = angular.copy(instance.data.productionExpenditure);

                underscore.each(filteredLiabilities, function (liability) {
                    liability.resetRepayments();
                    liability.resetWithdrawalsInRange(instance.startDate, instance.endDate);
                    liability.$dirty = true;

                    underscore.each(liability.data.customRepayments, function (amount, month) {
                        if (moment(month).isBefore(liability.startDate)) {
                            liability.addRepaymentInMonth(amount, month, 'bank');
                        }
                    });

                    var filteredUnallocatedEnterpriseProductionExpenditure = underscore.chain(instance.data.unallocatedEnterpriseProductionExpenditure)
                        .reduce(function (enterpriseProductionExpenditure, productionExpenditure, enterprise) {
                            if (underscore.isEmpty(liability.data.enterprises) || underscore.contains(liability.data.enterprises, enterprise)) {
                                enterpriseProductionExpenditure[enterprise] = underscore.chain(productionExpenditure)
                                    .reduce(function (productionExpenditure, expenditure, input) {
                                        if (underscore.isEmpty(liability.data.inputs) || underscore.contains(liability.data.inputs, input)) {
                                            productionExpenditure[input] = expenditure;
                                        }

                                        return productionExpenditure;
                                    }, {})
                                    .value();
                            }

                            return enterpriseProductionExpenditure;
                        }, {})
                        .value();

                    for (var i = 0; i < instance.numberOfMonths; i++) {
                        var month = moment(liability.startDate, 'YYYY-MM-DD').add(i, 'M'),
                            monthFormatted = month.format('YYYY-MM-DD');

                        underscore.each(filteredUnallocatedEnterpriseProductionExpenditure, function (productionExpenditure, enterprise) {
                            underscore.each(productionExpenditure, function (expenditure, input) {
                                var opening = expenditure[i];

                                expenditure[i] = liability.addWithdrawalInMonth(opening, month);
                                instance.data.unallocatedProductionExpenditure[input][i] += (expenditure[i] - opening)
                            });
                        });

                        if (liability.data.customRepayments && liability.data.customRepayments[monthFormatted]) {
                            liability.addRepaymentInMonth(liability.data.customRepayments[monthFormatted], month, 'bank');
                        }
                    }
                });
            }

            privateProperty(this, 'reEvaluateProductionCredit', function (liabilities) {
                return reEvaluateProductionCredit(this, liabilities);
            });

            function updateAssetStatementCategory(instance, category, name, asset) {
                instance.data.assetStatement[category] = instance.data.assetStatement[category] || [];
                asset.data.assetValue = asset.data.assetValue || 0;

                var startMonth = moment(instance.startDate, 'YYYY-MM-DD'),
                    numberOfYears = Math.ceil(moment(instance.endDate, 'YYYY-MM-DD').diff(moment(instance.startDate, 'YYYY-MM-DD'), 'years', true)),
                    index = underscore.findIndex(instance.data.assetStatement[category], function (statement) {
                        return statement.name === name;
                    }),
                    assetCategory = (index !== -1 ? instance.data.assetStatement[category].splice(index, 1)[0] : {
                        name: name,
                        estimatedValue: 0,
                        currentRMV: 0,
                        yearlyRMV: Base.initializeArray(numberOfYears),
                        yearlyDep: Base.initializeArray(numberOfYears),
                        assets: []
                    });

                if (!underscore.findWhere(assetCategory.assets, {assetKey: asset.assetKey})) {
                    assetCategory.assets.push(asJson(asset, ['liabilities', 'productionSchedules']));
                }

                if (!asset.data.acquisitionDate || startMonth.isAfter(asset.data.acquisitionDate)) {
                    assetCategory.estimatedValue += asset.data.assetValue || 0;
                }

                instance.data.assetStatement[category].push(assetCategory);
            }

            function updateLiabilityStatementCategory(instance, liability) {
                var category = (liability.type === 'production-credit' ? 'medium-term' : (liability.type === 'rent' ? 'short-term' : liability.type)),
                    name = (liability.type === 'production-credit' ? 'Production Credit' : (liability.type === 'rent' ? 'Rent overdue' : liability.name)),
                    index = underscore.findIndex(instance.data.liabilityStatement[category], function(statement) {
                        return statement.name === name;
                    }),
                    numberOfYears = Math.ceil(moment(instance.endDate, 'YYYY-MM-DD').diff(moment(instance.startDate, 'YYYY-MM-DD'), 'years', true)),
                    liabilityCategory = (index !== -1 ? instance.data.liabilityStatement[category].splice(index, 1)[0] : {
                        name: name,
                        currentValue: 0,
                        yearlyValues: Base.initializeArray(numberOfYears),
                        liabilities: []
                    });

                instance.data.liabilityStatement[category] = instance.data.liabilityStatement[category] || [];
                liabilityCategory.currentValue += liability.liabilityInMonth(instance.startDate).opening;

                // Calculate total year-end values for liability category
                for (var year = 0; year < numberOfYears; year++) {
                    var yearEnd = moment.min(moment(instance.endDate, 'YYYY-MM-DD'), moment(instance.startDate, 'YYYY-MM-DD').add(year, 'years').add(11, 'months'));
                    liabilityCategory.yearlyValues[year] += liability.liabilityInMonth(yearEnd).closing;
                }

                if (!underscore.findWhere(liabilityCategory.liabilities, {uuid: liability.uuid})) {
                    liabilityCategory.liabilities.push(asJson(liability));
                }

                instance.data.liabilityStatement[category].push(liabilityCategory);
            }

            function calculateAssetStatementRMV(instance) {
                var ignoredItems = ['Bank Capital', 'Bank Overdraft'],
                    adjustments = [{
                        operation: '-',
                        category: 'capitalIncome'
                    }, {
                        operation: '+',
                        category: 'capitalExpenditure'
                    }];

                angular.forEach(instance.data.assetStatement, function (statementItems, category) {
                    if (category !== 'total') {
                        angular.forEach(statementItems, function (item) {
                            if (!underscore.contains(ignoredItems, item.name)) {
                                var adjustmentFactor = instance.data.adjustmentFactors[item.name] || 1;

                                item.currentRMV = (item.estimatedValue || 0) * adjustmentFactor;

                                for (var year = 0; year < item.yearlyRMV.length; year++) {
                                    var rmv = (year === 0 ? item.currentRMV : item.yearlyRMV[year - 1]);

                                    angular.forEach(adjustments, function (adjustment) {
                                        if (instance.data[adjustment.category][item.name]) {
                                            var value = underscore.reduce(instance.data[adjustment.category][item.name].slice(year * 12, (year + 1) * 12), function (total, value) {
                                                return total + (value || 0);
                                            }, 0);

                                            rmv = Math.max(0, (['+', '-'].indexOf(adjustment.operation) !== -1 ? eval(rmv + adjustment.operation + value) : rmv));
                                        }
                                    });

                                    rmv *= adjustmentFactor;

                                    item.yearlyDep[year] = rmv * (underscore.contains(['Vehicles', 'Machinery & Equipment'], item.name) ? (instance.data.account.depreciationRate || 0) / 100 : 0);
                                    item.yearlyRMV[year] = rmv - item.yearlyDep[year];
                                }
                            }
                        });
                    }
                });
            }

            function totalAssetsAndLiabilities(instance) {
                var numberOfYears = Math.ceil(moment(instance.endDate, 'YYYY-MM-DD').diff(moment(instance.startDate, 'YYYY-MM-DD'), 'years', true));

                instance.data.assetStatement.total = underscore.chain(instance.data.assetStatement)
                    .omit('total')
                    .values()
                    .flatten(true)
                    .reduce(function(result, asset) {
                        result.estimatedValue += asset.estimatedValue;
                        result.currentRMV += asset.currentRMV;
                        result.yearlyRMV = addArrayValues(result.yearlyRMV, asset.yearlyRMV);
                        result.yearlyDep = addArrayValues(result.yearlyDep, asset.yearlyDep);
                        return result;
                    }, {
                        estimatedValue: 0,
                        currentRMV: 0,
                        yearlyRMV: Base.initializeArray(numberOfYears),
                        yearlyDep: Base.initializeArray(numberOfYears)
                    })
                    .value();

                instance.data.liabilityStatement.total = underscore.chain(instance.data.liabilityStatement)
                    .omit('total')
                    .values()
                    .flatten(true)
                    .reduce(function(result, liability) {
                        result.currentValue += liability.currentValue;
                        result.yearlyValues = addArrayValues(result.yearlyValues, liability.yearlyValues);
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
                    evaluatedModels = [];

                instance.data.capitalIncome = {};
                instance.data.capitalExpenditure = {};
                instance.data.debtRedemption = {};
                instance.data.assetStatement = {};
                instance.data.liabilityStatement = {};

                underscore.each(instance.models.assets, function (asset) {
                    var registerLegalEntity = underscore.findWhere(instance.data.legalEntities, {id: asset.legalEntityId}),
                        evaluatedAsset = underscore.findWhere(evaluatedModels, {assetKey: asset.assetKey});

                    // Check asset is not already added
                    if (registerLegalEntity && underscore.isUndefined(evaluatedAsset)) {
                        evaluatedModels.push(asset);

                        asset = Asset.new(asset);

                        var acquisitionDate = (asset.data.acquisitionDate ? moment(asset.data.acquisitionDate) : undefined),
                            soldDate = (asset.data.soldDate ? moment(asset.data.soldDate) : undefined),
                            constructionDate = (asset.data.constructionDate ? moment(asset.data.constructionDate) : undefined),
                            demolitionDate = (asset.data.demolitionDate ? moment(asset.data.demolitionDate) : undefined);

                        // VME
                        if (asset.type === 'vme') {
                            if (asset.data.type === 'Vehicles') {
                                if (asset.data.assetValue && acquisitionDate && acquisitionDate.isBetween(startMonth, endMonth)) {
                                    initializeCategoryValues(instance, 'capitalExpenditure', 'Vehicles', numberOfMonths);

                                    instance.data.capitalExpenditure['Vehicles'][acquisitionDate.diff(startMonth, 'months')] += asset.data.assetValue;
                                }

                                if (asset.data.sold && asset.data.salePrice && soldDate && soldDate.isBetween(startMonth, endMonth)) {
                                    initializeCategoryValues(instance, 'capitalIncome', 'Vehicles', numberOfMonths);

                                    instance.data.capitalIncome['Vehicles'][soldDate.diff(startMonth, 'months')] += asset.data.salePrice;
                                }

                            } else if (asset.data.type === 'Machinery') {
                                if (asset.data.assetValue && acquisitionDate && acquisitionDate.isBetween(startMonth, endMonth)) {
                                    initializeCategoryValues(instance, 'capitalExpenditure', 'Machinery & Equipment', numberOfMonths);

                                    instance.data.capitalExpenditure['Machinery & Equipment'][acquisitionDate.diff(startMonth, 'months')] += asset.data.assetValue;
                                }

                                if (asset.data.sold && asset.data.salePrice && soldDate && soldDate.isBetween(startMonth, endMonth)) {
                                    initializeCategoryValues(instance, 'capitalIncome', 'Machinery & Equipment', numberOfMonths);

                                    instance.data.capitalIncome['Machinery & Equipment'][soldDate.diff(startMonth, 'months')] += asset.data.salePrice;
                                }
                            }
                        } else if (asset.type === 'improvement') {
                            if (asset.data.assetValue && constructionDate && constructionDate.isBetween(startMonth, endMonth)) {
                                initializeCategoryValues(instance, 'capitalExpenditure', 'Fixed Improvements', numberOfMonths);

                                instance.data.capitalExpenditure['Fixed Improvements'][constructionDate.diff(startMonth, 'months')] += asset.data.assetValue;
                            }
                        } else if (asset.type === 'farmland') {
                            if (asset.data.assetValue && acquisitionDate && acquisitionDate.isBetween(startMonth, endMonth)) {
                                initializeCategoryValues(instance, 'capitalExpenditure', 'Land', numberOfMonths);

                                instance.data.capitalExpenditure['Land'][acquisitionDate.diff(startMonth, 'months')] += asset.data.assetValue;
                            }

                            if (asset.data.sold && asset.data.salePrice && soldDate && soldDate.isBetween(startMonth, endMonth)) {
                                initializeCategoryValues(instance, 'capitalIncome', 'Land', numberOfMonths);

                                instance.data.capitalIncome['Land'][soldDate.diff(startMonth, 'months')] += asset.data.salePrice;
                            }
                        } else if (asset.type === 'other') {
                            if (asset.data.assetValue && acquisitionDate && acquisitionDate.isBetween(startMonth, endMonth)) {
                                initializeCategoryValues(instance, 'capitalExpenditure', asset.data.category, numberOfMonths);

                                instance.data.capitalExpenditure[asset.data.category][acquisitionDate.diff(startMonth, 'months')] += asset.data.assetValue;
                            }

                            if (asset.data.sold && asset.data.salePrice && soldDate && soldDate.isBetween(startMonth, endMonth)) {
                                initializeCategoryValues(instance, 'capitalIncome', asset.data.category, numberOfMonths);

                                instance.data.capitalIncome[asset.data.category][soldDate.diff(startMonth, 'months')] += asset.data.salePrice;
                            }
                        }

                        if (!(asset.data.sold && soldDate && soldDate.isBefore(startMonth)) && !(asset.data.demolished && demolitionDate && demolitionDate.isBefore(startMonth))) {
                            switch(asset.type) {
                                case 'cropland':
                                case 'farmland':
                                case 'pasture':
                                case 'permanent crop':
                                case 'plantation':
                                case 'wasteland':
                                    updateAssetStatementCategory(instance, 'long-term', 'Land', asset);
                                    break;
                                case 'improvement':
                                    updateAssetStatementCategory(instance, 'long-term', 'Fixed Improvements', asset);
                                    break;
                                case 'livestock':
                                    updateAssetStatementCategory(instance, 'medium-term', 'Breeding Stock', asset);
                                    break;
                                case 'vme':
                                    if (asset.data.type === 'Vehicles') {
                                        updateAssetStatementCategory(instance, 'medium-term', 'Vehicles', asset);
                                    } else if (asset.data.type === 'Machinery') {
                                        updateAssetStatementCategory(instance, 'medium-term', 'Machinery & Equipment', asset);
                                    }
                                    break;
                                case 'other':
                                    updateAssetStatementCategory(instance, asset.data.liquidityType, asset.data.category, asset);
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
                                    initializeCategoryValues(instance, 'capitalExpenditure', 'Land Purchases', numberOfMonths);

                                    instance.data.capitalExpenditure['Land Purchases'][moment(liability.startDate, 'YYYY-MM-DD').diff(startMonth, 'months')] += liability.openingBalance;
                                }

                                initializeCategoryValues(instance, section, typeTitle, numberOfMonths);

                                instance.data[section][typeTitle] = underscore.map(liabilityMonths, function (month, index) {
                                    return ((month.repayment && month.repayment.bank) || 0) + (instance.data[section][typeTitle][index] || 0);
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
                            return ((month.repayment && month.repayment.bank) || 0) + (instance.data[section][typeTitle][index] || 0);
                        });

                        updateLiabilityStatementCategory(instance, liability);
                    }
                });

                underscore.each(instance.models.productionSchedules, function (productionSchedule) {
                    var schedule = ProductionSchedule.new(productionSchedule);

                    extractLivestockBreedingStockComposition(instance, schedule);
                });

                addPrimaryAccountAssetsLiabilities(instance);
                calculateAssetStatementRMV(instance);
                totalAssetsAndLiabilities(instance);
            }

            /**
             * Recalculate summary & ratio data
             */
            function calculateYearlyTotal (monthlyTotals, year) {
                return underscore.reduce(monthlyTotals.slice((year - 1) * 12, year * 12), function (total, value) {
                    return total + (value || 0);
                }, 0);
            }

            function calculateYearlyEndLiabilityBalance(monthlyTotals, year) {
                var yearSlice = monthlyTotals.slice((year - 1) * 12, year * 12);
                return yearSlice[yearSlice.length - 1];
            }

            function calculateAssetLiabilityGroupTotal (instance, type, subTypes) {
                subTypes = (underscore.isArray(subTypes) ? subTypes : [subTypes]);

                var numberOfYears = Math.ceil(moment(instance.endDate, 'YYYY-MM-DD').diff(moment(instance.startDate, 'YYYY-MM-DD'), 'years', true)),
                    statementProperty = (type === 'asset' ? 'assetStatement' : 'liabilityStatement'),
                    result = (type === 'asset' ? {
                        estimatedValue: 0,
                        currentRMV: 0,
                        yearlyRMV: Base.initializeArray(numberOfYears),
                        yearlyDep: Base.initializeArray(numberOfYears)
                    } : {
                        currentValue: 0,
                        yearlyValues: Base.initializeArray(numberOfYears)
                    } );

                underscore.each(subTypes, function (subType) {
                    result = underscore.reduce(instance.data[statementProperty][subType], function(total, item) {
                        if (type === 'asset') {
                            total.estimatedValue += item.estimatedValue || 0;
                            total.currentRMV += item.currentRMV || 0;
                            total.yearlyRMV = addArrayValues(total.yearlyRMV, item.yearlyRMV);
                            total.yearlyDep = addArrayValues(total.yearlyDep, item.yearlyDep);
                        } else {
                            total.currentValue += item.currentValue || 0;
                            total.yearlyValues = addArrayValues(total.yearlyValues, item.yearlyValues);
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
                                return (underscore.isNumber(propertyValue) ? propertyValue : underscore.reduce(propertyValue, function (total, value) {
                                    return total + (value || 0);
                                }, 0))
                            })
                            .value();
                    })
                    .unzip()
                    .map(function(monthArray) {
                        return underscore.reduce(monthArray, function(total, value) {
                            return total + (value || 0);
                        }, 0);
                    })
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

            function recalculateSummary (instance) {
                var startMonth = moment(instance.startDate, 'YYYY-MM-DD'),
                    endMonth = moment(instance.endDate, 'YYYY-MM-DD'),
                    numberOfMonths = endMonth.diff(startMonth, 'months');

                instance.data.summary = {
                    monthly: {},
                    yearly: {}
                };

                recalculateIncomeExpensesSummary(instance, startMonth, endMonth, numberOfMonths);
                recalculatePrimaryAccount(instance, startMonth, endMonth, numberOfMonths);
                reEvaluateAssetsAndLiabilities(instance);
                recalculateAssetsLiabilitiesInterestSummary(instance, startMonth, endMonth, numberOfMonths);

                instance.data.summary.yearly.productionGrossMargin = subtractArrayValues(instance.data.summary.yearly.productionIncome, instance.data.summary.yearly.productionExpenditure);
                instance.data.summary.yearly.productionCost = addArrayValues(instance.data.summary.yearly.productionExpenditure, instance.data.summary.yearly.depreciation);
                instance.data.summary.yearly.netFarmIncome = subtractArrayValues(instance.data.summary.yearly.productionIncome, instance.data.summary.yearly.productionCost);
                instance.data.summary.yearly.farmingProfitOrLoss = subtractArrayValues(instance.data.summary.yearly.netFarmIncome, addArrayValues(instance.data.summary.yearly.totalRent, instance.data.summary.yearly.totalInterest));
            }

            function recalculateIncomeExpensesSummary (instance, startMonth, endMonth, numberOfMonths) {
                underscore.extend(instance.data.summary.monthly, {
                    // Income
                    productionIncome: calculateMonthlySectionsTotal([instance.data.productionIncome], Base.initializeArray(numberOfMonths)),
                    capitalIncome: calculateMonthlySectionsTotal([instance.data.capitalIncome], Base.initializeArray(numberOfMonths)),
                    otherIncome: calculateMonthlySectionsTotal([instance.data.otherIncome], Base.initializeArray(numberOfMonths)),
                    totalIncome: calculateMonthlySectionsTotal([instance.data.capitalIncome, instance.data.productionIncome, instance.data.otherIncome], Base.initializeArray(numberOfMonths)),
                    totalIncomeAfterRepayments: subtractArrayValues(calculateMonthlySectionsTotal([instance.data.capitalIncome, instance.data.productionIncome, instance.data.otherIncome], Base.initializeArray(numberOfMonths)), calculateMonthlyLiabilityPropertyTotal(instance, ['production-credit'], 'repayment', startMonth, endMonth)),

                    // Expenses
                    unallocatedProductionExpenditure: calculateMonthlySectionsTotal([instance.data.unallocatedProductionExpenditure], Base.initializeArray(numberOfMonths)),
                    productionExpenditure: calculateMonthlySectionsTotal([instance.data.productionExpenditure], Base.initializeArray(numberOfMonths)),
                    capitalExpenditure: calculateMonthlySectionsTotal([instance.data.capitalExpenditure], Base.initializeArray(numberOfMonths)),
                    otherExpenditure: calculateMonthlySectionsTotal([instance.data.otherExpenditure], Base.initializeArray(numberOfMonths)),
                    debtRedemption: calculateMonthlySectionsTotal([instance.data.debtRedemption], Base.initializeArray(numberOfMonths)),
                    totalExpenditure: calculateMonthlySectionsTotal([instance.data.capitalExpenditure, instance.data.unallocatedProductionExpenditure, instance.data.debtRedemption, instance.data.otherExpenditure], Base.initializeArray(numberOfMonths)),
                });

                underscore.extend(instance.data.summary.yearly, {
                    // Income
                    productionIncome: [calculateYearlyTotal(instance.data.summary.monthly.productionIncome, 1), calculateYearlyTotal(instance.data.summary.monthly.productionIncome, 2)],
                    capitalIncome: [calculateYearlyTotal(instance.data.summary.monthly.capitalIncome, 1), calculateYearlyTotal(instance.data.summary.monthly.capitalIncome, 2)],
                    otherIncome: [calculateYearlyTotal(instance.data.summary.monthly.otherIncome, 1), calculateYearlyTotal(instance.data.summary.monthly.otherIncome, 2)],
                    totalIncome: [calculateYearlyTotal(instance.data.summary.monthly.totalIncome, 1), calculateYearlyTotal(instance.data.summary.monthly.totalIncome, 2)],
                    totalIncomeAfterRepayments: [calculateYearlyTotal(instance.data.summary.monthly.totalIncomeAfterRepayments, 1), calculateYearlyTotal(instance.data.summary.monthly.totalIncomeAfterRepayments, 2)],

                    // Expenses
                    unallocatedProductionExpenditure: [calculateYearlyTotal(instance.data.summary.monthly.unallocatedProductionExpenditure, 1), calculateYearlyTotal(instance.data.summary.monthly.unallocatedProductionExpenditure, 2)],
                    productionExpenditure: [calculateYearlyTotal(instance.data.summary.monthly.productionExpenditure, 1), calculateYearlyTotal(instance.data.summary.monthly.productionExpenditure, 2)],
                    capitalExpenditure: [calculateYearlyTotal(instance.data.summary.monthly.capitalExpenditure, 1), calculateYearlyTotal(instance.data.summary.monthly.capitalExpenditure, 2)],
                    otherExpenditure: [calculateYearlyTotal(instance.data.summary.monthly.otherExpenditure, 1), calculateYearlyTotal(instance.data.summary.monthly.otherExpenditure, 2)],
                    debtRedemption: [calculateYearlyTotal(instance.data.summary.monthly.debtRedemption, 1), calculateYearlyTotal(instance.data.summary.monthly.debtRedemption, 2)],
                    totalExpenditure: [calculateYearlyTotal(instance.data.summary.monthly.totalExpenditure, 1), calculateYearlyTotal(instance.data.summary.monthly.totalExpenditure, 2)],
                });
            }

            function recalculateAssetsLiabilitiesInterestSummary (instance, startMonth, endMonth, numberOfMonths) {
                underscore.extend(instance.data.summary.monthly, {
                    // Interest
                    productionCreditInterest: calculateMonthlyLiabilityPropertyTotal(instance, ['short-term', 'production-credit'], 'interest', startMonth, endMonth),
                    mediumTermInterest: calculateMonthlyLiabilityPropertyTotal(instance, ['medium-term'], 'interest', startMonth, endMonth),
                    longTermInterest: calculateMonthlyLiabilityPropertyTotal(instance, ['long-term'], 'interest', startMonth, endMonth),
                    totalInterest: addArrayValues(calculateMonthlyLiabilityPropertyTotal(instance, ['short-term', 'long-term', 'medium-term'], 'interest', startMonth, endMonth), instance.data.summary.monthly.primaryAccountInterest),

                    // Liabilities
                    currentLiabilities: addArrayValues(calculateMonthlyLiabilityPropertyTotal(instance, ['short-term', 'production-credit'], 'closing', startMonth, endMonth), instance.data.summary.monthly.primaryAccountLiability),
                    mediumLiabilities: calculateMonthlyLiabilityPropertyTotal(instance, ['medium-term'], 'closing', startMonth, endMonth),
                    longLiabilities: calculateMonthlyLiabilityPropertyTotal(instance, ['long-term'], 'closing', startMonth, endMonth),
                    totalLiabilities: addArrayValues(calculateMonthlyLiabilityPropertyTotal(instance, [], 'closing', startMonth, endMonth), instance.data.summary.monthly.primaryAccountLiability),
                    totalRent: calculateMonthlyLiabilityPropertyTotal(instance, ['rent'], 'rent', startMonth, endMonth)
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
                    totalLiabilities: [calculateYearlyEndLiabilityBalance(instance.data.summary.monthly.totalLiabilities, 1), calculateYearlyEndLiabilityBalance(instance.data.summary.monthly.totalLiabilities, 2)],
                    totalRent: [calculateYearlyTotal(instance.data.summary.monthly.totalRent, 1), calculateYearlyTotal(instance.data.summary.monthly.totalRent, 2)],

                    // Assets
                    currentAssets: calculateAssetLiabilityGroupTotal(instance, 'asset', 'short-term'),
                    movableAssets: calculateAssetLiabilityGroupTotal(instance, 'asset', 'medium-term'),
                    fixedAssets: calculateAssetLiabilityGroupTotal(instance, 'asset', 'long-term'),
                    totalAssets: instance.data.assetStatement.total.yearlyRMV || Base.initializeArray(2),

                    depreciation: instance.data.assetStatement.total.yearlyDep || Base.initializeArray(2)
                });
            }

            /**
             * Primary Account Handling
             */
            function recalculatePrimaryAccount(instance, startMonth, endMonth, numberOfMonths) {
                var numberOfYears = Math.ceil(endMonth.diff(startMonth, 'years', true)),
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
                instance.data.summary.monthly.primaryAccountLiability = Base.initializeArray(numberOfMonths);

                instance.account.monthly = underscore.chain(underscore.range(numberOfMonths))
                    .map(function () {
                        return underscore.extend({}, defaultObject);
                    })
                    .reduce(function (monthly, month, index) {
                        month.opening = (index === 0 ? instance.account.openingBalance : monthly[monthly.length - 1].closing);
                        month.inflow = instance.data.summary.monthly.totalIncomeAfterRepayments[index];
                        month.outflow = instance.data.summary.monthly.totalExpenditure[index];
                        month.balance = month.opening + month.inflow - month.outflow;
                        month.interestPayable = Math.min(0, (month.balance < 0 && instance.account.interestRateDebit ? ((month.opening + month.balance) / 2) * (instance.account.interestRateDebit / 100 / 12) : 0));
                        month.interestReceivable = Math.max(0, (month.balance > 0 && instance.account.interestRateCredit ? ((month.opening + month.balance) / 2) * (instance.account.interestRateCredit / 100 / 12) : 0));
                        month.closing = month.balance + month.interestPayable + month.interestReceivable;

                        instance.data.summary.monthly.primaryAccountInterest[index] += -month.interestPayable;
                        instance.data.summary.monthly.primaryAccountLiability[index] += Math.abs(Math.min(0, month.closing));

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
                        year.inflow = sumCollectionProperty(months, 'inflow');
                        year.outflow = sumCollectionProperty(months, 'outflow');
                        year.balance = year.opening + year.inflow - year.outflow;
                        year.interestPayable = sumCollectionProperty(months, 'interestPayable');
                        year.interestReceivable = sumCollectionProperty(months, 'interestReceivable');
                        year.closing = year.balance + year.interestPayable + year.interestReceivable;
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
                instance.data.summary.yearly.primaryAccountLiability = [calculateYearlyEndLiabilityBalance(instance.data.summary.monthly.primaryAccountLiability, 1), calculateYearlyEndLiabilityBalance(instance.data.summary.monthly.primaryAccountLiability, 2)];
            }

            function addPrimaryAccountAssetsLiabilities (instance) {
                // Bank Capital
                instance.data.assetStatement['short-term'] = instance.data.assetStatement['short-term'] || [];
                instance.data.assetStatement['short-term'].push({
                    name: 'Bank Capital',
                    estimatedValue: Math.max(0, instance.account.openingBalance),
                    currentRMV: Math.max(0, instance.account.openingBalance),
                    yearlyRMV: [Math.max(0, instance.account.yearly[0].closing), Math.max(0, instance.account.yearly[1].closing)],
                    yearlyDep: Base.initializeArray(2)
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
                    interestCover: calculateRatio(instance, 'netFarmIncome', 'totalInterest'),
                    inputOutput: calculateRatio(instance, 'productionIncome', ['productionExpenditure', 'productionCreditInterest', 'primaryAccountInterest']),
                    productionCost: calculateRatio(instance, 'productionExpenditure', 'productionIncome'),
                    cashFlowBank: calculateRatio(instance, 'totalIncomeAfterRepayments', ['capitalExpenditure', 'unallocatedProductionExpenditure', 'debtRedemption', 'otherExpenditure', 'primaryAccountInterest']),
                    //TODO: add payments to co-ops with crop deliveries to cashFlowFarming denominator
                    cashFlowFarming: calculateRatio(instance, 'totalIncome', ['capitalExpenditure', 'productionExpenditure', 'debtRedemption', 'otherExpenditure', 'primaryAccountInterest']),
                    debtToTurnover: calculateRatio(instance, 'totalLiabilities', ['productionIncome', 'otherIncome']),
                    interestToTurnover: calculateRatio(instance, 'totalInterest', ['productionIncome', 'otherIncome']),
                    //TODO: change denominator to total asset value used for farming
                    returnOnInvestment: calculateRatio(instance, 'netFarmIncome', 'totalAssets')
                };

                calculateAssetRatios(instance);
            }

            function calculateAssetRatios (instance) {
                var defaultObj = { yearly: [], currentRMV: 0, estimatedValue: 0 };

                instance.data.ratios = underscore.extend(instance.data.ratios, {
                    netCapital: defaultObj,
                    gearing: defaultObj,
                    debt: defaultObj
                });

                instance.data.ratios.netCapital = underscore.mapObject(instance.data.ratios.netCapital, function(value, key) {
                    if (underscore.contains(['currentRMV', 'estimatedValue'], key)) {
                        return infinityToZero(instance.data.assetStatement.total[key] / instance.data.liabilityStatement.total.currentValue);
                    } else if (key === 'yearly') {
                        return divideArrayValues(instance.data.assetStatement.total.yearlyRMV, instance.data.liabilityStatement.total.yearlyValues);
                    }
                });

                instance.data.ratios.debt = underscore.mapObject(instance.data.ratios.debt, function(value, key) {
                    if (underscore.contains(['currentRMV', 'estimatedValue'], key)) {
                        return infinityToZero(instance.data.liabilityStatement.total.currentValue / instance.data.assetStatement.total[key]);
                    } else if (key === 'yearly') {
                        return divideArrayValues(instance.data.liabilityStatement.total.yearlyValues, instance.data.assetStatement.total.yearlyRMV);
                    }
                });

                instance.data.ratios.gearing = underscore.mapObject(instance.data.ratios.gearing, function(value, key) {
                    if (underscore.contains(['currentRMV', 'estimatedValue'], key)) {
                        return infinityToZero(instance.data.liabilityStatement.total.currentValue / (instance.data.assetStatement.total[key] - instance.data.liabilityStatement.total.currentValue));
                    } else if (key === 'yearly') {
                        return divideArrayValues(instance.data.liabilityStatement.total.yearlyValues, subtractArrayValues(instance.data.assetStatement.total.yearlyRMV, instance.data.liabilityStatement.total.yearlyValues));
                    }
                });
            }

            function calculateRatio(instance, numeratorProperties, denominatorProperties) {
                if (!underscore.isArray(numeratorProperties)) {
                    numeratorProperties = [numeratorProperties];
                }
                if (!underscore.isArray(denominatorProperties)) {
                    denominatorProperties = [denominatorProperties];
                }

                function sumPropertyValuesForInterval (propertyList, interval) {
                    if (!instance.data.summary[interval]) {
                        return [];
                    }

                    var valueArrays = underscore.chain(propertyList)
                        .map(function(propertyName) {
                            if (propertyName.charAt(0) === '-') {
                                propertyName = propertyName.substr(1);
                                return negateArrayValues(instance.data.summary[interval][propertyName]);
                            }
                            return instance.data.summary[interval][propertyName];
                        })
                        .compact()
                        .value();

                    return underscore.reduce(valueArrays.slice(1), function(result, array) {
                        return addArrayValues(result, array);
                    }, angular.copy(valueArrays[0]) || []);
                }

                return {
                    monthly: divideArrayValues(sumPropertyValuesForInterval(numeratorProperties, 'monthly'), sumPropertyValuesForInterval(denominatorProperties, 'monthly')),
                    yearly: divideArrayValues(sumPropertyValuesForInterval(numeratorProperties, 'yearly'), sumPropertyValuesForInterval(denominatorProperties, 'yearly'))
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

            if (underscore.isEmpty(this.data.cashFlowIncome) || underscore.isEmpty(this.data.cashFlowIncome)) {
                reEvaluateProductionSchedules(this);
            }
        }

        inheritModel(BusinessPlan, Document);

        readOnlyProperty(BusinessPlan, 'incomeExpenseTypes', {
            'capital': 'Capital',
            'production': 'Production',
            'other': 'Other'
        });

        readOnlyProperty(BusinessPlan, 'otherExpenseSubtypes', {
            'overhead': 'Overhead',
            'private': 'Private',
            'other': 'Other'
        });

        readOnlyProperty(BusinessPlan, 'subtypeExpenses', {
            'overhead': ['Accident Insurance',
                'Administration',
                'Accounting Fees',
                'Bank Charges',
                'Crop Insurance',
                'Fuel',
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
                'Unemployment Insurance'],
            'private': ['Drawings',
                'Medical',
                'Life insurance',
                'University / School fees']
        });

        BusinessPlan.validates({
            author: {
                required: true,
                length: {
                    min: 1,
                    max: 255
                }
            },
            docType: {
                required: true,
                equal: {
                    to: 'financial resource plan'
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
            },
            title: {
                length: {
                    min: 1,
                    max: 255
                }
            }
        });

        return BusinessPlan;
    }]);
