var sdkModelBusinessPlanDocument = angular.module('ag.sdk.model.business-plan', ['ag.sdk.id', 'ag.sdk.helper.enterprise-budget', 'ag.sdk.model.asset', 'ag.sdk.model.document', 'ag.sdk.model.liability', 'ag.sdk.model.production-schedule']);

sdkModelBusinessPlanDocument.factory('BusinessPlan', ['Asset', 'Base', 'computedProperty', 'Document', 'Financial', 'generateUUID', 'inheritModel', 'Liability', 'privateProperty', 'ProductionSchedule', 'readOnlyProperty', 'underscore',
    function (Asset, Base, computedProperty, Document, Financial, generateUUID, inheritModel, Liability, privateProperty, ProductionSchedule, readOnlyProperty, underscore) {

        var _assetYearEndValueAdjustments = {
            'Land and fixed improvements': [
                {
                    operation: '+',
                    category: 'capitalIncome',
                    item: 'Land Sales'
                },
                {
                    operation: '-',
                    category: 'capitalExpenditure',
                    item: 'Land Purchases'
                },
                {
                    operation: '-',
                    category: 'capitalExpenditure',
                    item: 'Development'
                }
            ],
            'Vehicles': [
                {
                    operation: '+',
                    category: 'capitalIncome',
                    item: 'Vehicle Sales'
                },
                {
                    operation: '-',
                    category: 'capitalExpenditure',
                    item: 'Vehicle Purchases'
                }
            ],
            'Machinery': [
                {
                    operation: '+',
                    category: 'capitalIncome',
                    item: 'Machinery & Plant Sales'
                },
                {
                    operation: '-',
                    category: 'capitalExpenditure',
                    item: 'Machinery & Plant Purchases'
                }
            ],
            'Breeding Stock': [
                {
                    operation: '+',
                    category: 'capitalIncome',
                    item: 'Breeding Stock Sales'
                },
                {
                    operation: '-',
                    category: 'capitalExpenditure',
                    item: 'Breeding Stock Purchases'
                }
            ]
        };

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
                reEvaluateAssetsAndLiabilities(instance);
                reEvaluateIncomeAndExpenses(instance);

                recalculate(instance);
            }

            function recalculate (instance) {
                // Re-calculate summary, account & ratio data
                recalculateSummary(instance);
                recalculatePrimaryAccount(instance);
                recalculateRatios(instance);
            }

            /**
             * Helper functions
             */
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

            function divideArrayValues (numeratorValues, denominatorValues) {
                if (!numeratorValues || !denominatorValues || numeratorValues.length != denominatorValues.length) {
                    return [];
                }

                return underscore.reduce(denominatorValues, function(result, value, index) {
                    result[index] = infinityToZero(result[index] / value);
                    return result;
                }, angular.copy(numeratorValues));
            }

            function addArrayValues (array1, array2) {
                if (!array1 || !array2 || array1.length != array2.length) {
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

            /**
             * Production Schedule handling
             */
            privateProperty(this, 'updateProductionSchedules', function (schedules) {
                var startMonth = moment(this.startDate, 'YYYY-MM-DD'),
                    endMonth = moment(this.endDate, 'YYYY-MM-DD');

                this.models.productionSchedules = [];

                angular.forEach(schedules, function (schedule) {
                    if (schedule && ProductionSchedule.new(schedule).validate() &&
                        (startMonth.isBetween(schedule.startDate, schedule.endDate) ||
                        (startMonth.isBefore(schedule.endDate) && endMonth.isAfter(schedule.startDate)))) {
                        // Add valid production schedule if between business plan dates
                        this.models.productionSchedules.push(schedule);
                    }
                }, this);

                reEvaluateBusinessPlan(this);
            });

            function initializeCategoryValues(instance, section, category, months) {
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

            function extractGroupCategories(dataStore, schedule, code, startMonth, numberOfMonths) {
                var section = underscore.findWhere(schedule.data.sections, {code: code}),
                // TODO: Fix time zone errors. Temporarily added one day to startDate to ensure it falls in the appropriate month.
                    scheduleStart = moment(schedule.startDate).add(1, 'days');

                if (section) {
                    var offset = scheduleStart.diff(startMonth, 'months');

                    angular.forEach(section.productCategoryGroups, function (group) {
                        angular.forEach(group.productCategories, function (category) {
                            var categoryName = (schedule.type !== 'livestock' && code === 'INC' ? schedule.data.details.commodity : category.name);

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

            function calculateIncomeComposition(instance, schedule, startMonth, numberOfMonths) {
                var section = underscore.findWhere(schedule.data.sections, {code: 'INC'}),
                // TODO: Fix time zone errors. Temporarily added one day to startDate to ensure it falls in the appropriate month.
                    scheduleStart = moment(schedule.startDate).add(1, 'days');

                if (section) {
                    var numberOfYears = Math.ceil(numberOfMonths / 12);

                    while (instance.data.productionIncomeComposition.length < numberOfYears) {
                        instance.data.productionIncomeComposition.push({});
                    }

                    for (var year = 0; year < numberOfYears; year++) {
                        var monthsInYear = Math.min(12, numberOfMonths - (year * 12));
                        var offset = scheduleStart.diff(moment(startMonth, 'YYYY-MM-DD').add(year, 'years'), 'months');

                        angular.forEach(section.productCategoryGroups, function (group) {
                            angular.forEach(group.productCategories, function (category) {
                                var categoryName = (schedule.type !== 'livestock' ? schedule.data.details.commodity : category.name);

                                var compositionCategory = instance.data.productionIncomeComposition[year][categoryName] ||
                                {
                                    unit: category.unit,
                                    pricePerUnit: 0,
                                    quantity: 0,
                                    value: 0
                                };

                                var minIndex = getLowerIndexBound(category.valuePerMonth, offset);
                                var maxIndex = getUpperIndexBound(category.valuePerMonth, offset, monthsInYear);
                                for (var i = minIndex; i < maxIndex; i++) {
                                    compositionCategory.value += category.valuePerMonth[i];
                                }

                                minIndex = getLowerIndexBound(category.quantityPerMonth, offset);
                                maxIndex = getUpperIndexBound(category.quantityPerMonth, offset, monthsInYear);
                                for (i = minIndex; i < maxIndex; i++) {
                                    compositionCategory.quantity += category.quantityPerMonth[i];
                                }

                                compositionCategory.pricePerUnit = ((!compositionCategory.pricePerUnit && category.pricePerUnit) ?
                                    category.pricePerUnit : infinityToZero(compositionCategory.value / compositionCategory.quantity));

                                instance.data.productionIncomeComposition[year][categoryName] = compositionCategory;
                            });
                        });

                        var totalValue = underscore.chain(instance.data.productionIncomeComposition[year])
                            .omit('total')
                            .values()
                            .pluck('value')
                            .reduce(function(total, value) { return total + value; }, 0)
                            .value();

                        for (var categoryName in instance.data.productionIncomeComposition[year]) {
                            if (instance.data.productionIncomeComposition[year].hasOwnProperty(categoryName) && categoryName != 'total') {
                                instance.data.productionIncomeComposition[year][categoryName].contributionPercent =
                                    infinityToZero(instance.data.productionIncomeComposition[year][categoryName].value / totalValue) * 100;
                            }
                        }
                        instance.data.productionIncomeComposition[year].total = {value: totalValue};
                    }
                }
            }

            function extractLivestockBreedingStockComposition (instance, schedule) {
                if (schedule.type == 'livestock') {
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
                var startMonth = moment(instance.startDate, 'YYYY-MM-DD'),
                    numberOfMonths = instance.numberOfMonths;

                instance.data.enterpriseProductionExpenditure = {};
                instance.data.productionIncome = {};
                instance.data.productionExpenditure = {};
                instance.data.productionIncomeComposition = [];

                angular.forEach(instance.models.productionSchedules, function (productionSchedule) {
                    var schedule = ProductionSchedule.new(productionSchedule);

                    Base.initializeObject(instance.data.enterpriseProductionExpenditure, schedule.data.details.commodity, {});
                    extractGroupCategories(instance.data.enterpriseProductionExpenditure[schedule.data.details.commodity], schedule, 'EXP', startMonth, numberOfMonths);

                    extractGroupCategories(instance.data.productionIncome, schedule, 'INC', startMonth, numberOfMonths);
                    extractGroupCategories(instance.data.productionExpenditure, schedule, 'EXP', startMonth, numberOfMonths);
                    calculateIncomeComposition(instance, schedule, startMonth, numberOfMonths);
                });

                instance.data.unallocatedProductionIncome = instance.data.unallocatedProductionIncome || instance.data.productionIncome;
                instance.data.unallocatedProductionExpenditure = instance.data.unallocatedProductionExpenditure || instance.data.productionExpenditure;
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

                instance.data.unallocatedProductionIncome = instance.data.unallocatedProductionIncome || instance.data.productionIncome;
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

                                instance.models.liabilities.push(liability.asJSON());
                            }

                            return liability.asJSON();
                        })
                        .value();

                    instance.models.assets.push(asset.asJSON());

                    reEvaluateAssetsAndLiabilities(instance);
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

                reEvaluateAssetsAndLiabilities(instance);
                recalculate(instance);

            });

            privateProperty(this, 'addLiability', function (liability) {
                liability = Liability.new(liability);

                if (liability.validate()) {
                    this.models.liabilities = underscore.reject(this.models.liabilities, function (item) {
                        return item.uuid === liability.uuid;
                    });

                    this.models.liabilities.push(liability.asJSON());

                    reEvaluateAssetsAndLiabilities(this);
                    recalculate(this);
                }
            });

            privateProperty(this, 'removeLiability', function (liability) {
                this.models.liabilities = underscore.reject(this.models.liabilities, function (item) {
                    return item.uuid === liability.uuid;
                });

                reEvaluateAssetsAndLiabilities(this);
                recalculate(this);
            });

            function reEvaluateProductionCredit(instance, liabilities) {
                var filteredLiabilities = underscore.where(liabilities, {type: 'production-credit'});

                instance.data.unallocatedEnterpriseProductionExpenditure = angular.copy(instance.data.enterpriseProductionExpenditure);
                instance.data.unallocatedProductionIncome = angular.copy(instance.data.productionIncome);
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

                var index = underscore.findIndex(instance.data.assetStatement[category], function (statement) {
                        return statement.name == name;
                    }),
                    numberOfYears = Math.ceil(moment(instance.endDate, 'YYYY-MM-DD').diff(moment(instance.startDate, 'YYYY-MM-DD'), 'years', true)),
                    assetCategory = (index !== -1 ? instance.data.assetStatement[category].splice(index, 1)[0] : {
                        name: name,
                        estimatedValue: 0,
                        currentRMV: 0,
                        yearlyRMV: Base.initializeArray(numberOfYears),
                        assets: []
                    });

                if (!underscore.findWhere(assetCategory.assets, {assetKey: asset.assetKey})) {
                    assetCategory.assets.push(typeof asset.asJSON == 'function' ? asset.asJSON() : asset);
                }

                assetCategory.estimatedValue += asset.data.assetValue || 0;
                instance.data.assetStatement[category].push(assetCategory);
            }

            function updateLiabilityStatementCategory(instance, liability) {
                var category = (liability.type == 'production-credit' ? 'medium-term' : (liability.type == 'rent' ? 'short-term' : liability.type)),
                    name = (liability.type == 'production-credit' ? 'Production Credit' : (liability.type == 'rent' ? 'Rent overdue' : liability.name)),
                    index = underscore.findIndex(instance.data.liabilityStatement[category], function(statement) {
                        return statement.name == name;
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
                    liabilityCategory.liabilities.push(typeof liability.asJSON == 'function' ? liability.asJSON() : liability);
                }

                instance.data.liabilityStatement[category].push(liabilityCategory);
            }

            function calculateAssetStatementRMV(instance) {
                angular.forEach(instance.data.assetStatement, function(statementItems, category) {
                    if (category != 'total') {
                        angular.forEach(statementItems, function(item) {
                            var adjustmentFactor = instance.data.adjustmentFactors[item.name] || 1;
                            item.currentRMV = (item.estimatedValue || 0) * adjustmentFactor;

                            for (var year = 0; year < item.yearlyRMV.length; year++) {
                                var rmv = (year == 0 ? item.currentRMV : item.yearlyRMV[year - 1]);
                                angular.forEach(_assetYearEndValueAdjustments[item.name], function(adjustment) {
                                    if (instance.data[adjustment.category][adjustment.item]) {
                                        var value = underscore.reduce(instance.data[adjustment.category][adjustment.item].slice(year * 12, (year + 1) * 12), function(total, value) {
                                            return total + (value || 0);
                                        }, 0);
                                        rmv = (['+', '-'].indexOf(adjustment.operation) != -1 ? eval( rmv + adjustment.operation + value ) : rmv);
                                    }
                                });
                                item.yearlyRMV[year] = rmv * adjustmentFactor;
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
                        return result;
                    }, {
                        estimatedValue: 0,
                        currentRMV: 0,
                        yearlyRMV: Base.initializeArray(numberOfYears)
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

                recalculate(instance);
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
                                    initializeCategoryValues(instance, 'capitalExpenditure', 'Vehicle Purchases', numberOfMonths);

                                    instance.data.capitalExpenditure['Vehicle Purchases'][acquisitionDate.diff(startMonth, 'months')] += asset.data.assetValue;
                                }

                                if (asset.data.sold && asset.data.salePrice && soldDate && soldDate.isBetween(startMonth, endMonth)) {
                                    initializeCategoryValues(instance, 'capitalIncome', 'Vehicle Sales', numberOfMonths);

                                    instance.data.capitalIncome['Vehicle Sales'][soldDate.diff(startMonth, 'months')] += asset.data.salePrice;
                                }

                            } else if (asset.data.type === 'Machinery') {
                                if (asset.data.assetValue && acquisitionDate && acquisitionDate.isBetween(startMonth, endMonth)) {
                                    initializeCategoryValues(instance, 'capitalExpenditure', 'Machinery & Plant Purchases', numberOfMonths);

                                    instance.data.capitalExpenditure['Machinery & Plant Purchases'][acquisitionDate.diff(startMonth, 'months')] += asset.data.assetValue;
                                }

                                if (asset.data.sold && asset.data.salePrice && soldDate && soldDate.isBetween(startMonth, endMonth)) {
                                    initializeCategoryValues(instance, 'capitalIncome', 'Machinery & Plant Sales', numberOfMonths);

                                    instance.data.capitalIncome['Machinery & Plant Sales'][soldDate.diff(startMonth, 'months')] += asset.data.salePrice;
                                }
                            }
                        } else if (asset.type === 'improvement' && asset.data.assetValue && constructionDate && constructionDate.isBetween(startMonth, endMonth)) {
                            initializeCategoryValues(instance, 'capitalExpenditure', 'Development', numberOfMonths);

                            instance.data.capitalExpenditure['Development'][constructionDate.diff(startMonth, 'months')] += asset.data.assetValue;
                        } else if (asset.type === 'farmland') {
                            if (asset.data.assetValue && acquisitionDate && acquisitionDate.isBetween(startMonth, endMonth)) {
                                initializeCategoryValues(instance, 'capitalExpenditure', 'Land Purchases', numberOfMonths);

                                instance.data.capitalExpenditure['Land Purchases'][acquisitionDate.diff(startMonth, 'months')] += asset.data.assetValue;
                            }

                            if (asset.data.sold && asset.data.salePrice && soldDate && soldDate.isBetween(startMonth, endMonth)) {
                                initializeCategoryValues(instance, 'capitalIncome', 'Land Sales', numberOfMonths);

                                instance.data.capitalIncome['Land Sales'][soldDate.diff(startMonth, 'months')] += asset.data.salePrice;
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
                                    updateAssetStatementCategory(instance, 'medium-term', 'Vehicles, Machinery & Equipment', asset);
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

                                if (asset.type == 'farmland' && liability.type !== 'rent' && moment(liability.startDate, 'YYYY-MM-DD').isBetween(startMonth, endMonth)) {
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

            function calculateAssetLiabilityGroupTotal (instance, type, subType) {
                var numberOfYears = Math.ceil(moment(instance.endDate, 'YYYY-MM-DD').diff(moment(instance.startDate, 'YYYY-MM-DD'), 'years', true));
                var defaultObj = (type == 'asset' ? {
                    estimatedValue: 0,
                    currentRMV: 0,
                    yearlyRMV: Base.initializeArray(numberOfYears)
                } : { currentValue: 0, yearlyValues: Base.initializeArray(numberOfYears) } );
                var statementProperty = (type == 'asset' ? 'assetStatement' : 'liabilityStatement');

                if (!instance.data[statementProperty][subType] || instance.data[statementProperty][subType].length == 0) {
                    return defaultObj;
                }

                return underscore.reduce(instance.data[statementProperty][subType], function(result, item) {
                    if (type == 'asset') {
                        result.estimatedValue += item.estimatedValue || 0;
                        result.currentRMV += item.currentRMV || 0;
                        result.yearlyRMV = addArrayValues(result.yearlyRMV, item.yearlyRMV);
                    } else {
                        result.currentValue += item.currentValue || 0;
                        result.yearlyValues = addArrayValues(result.yearlyValues, item.yearlyValues);
                    }
                    return result;
                }, defaultObj);
            }

            function calculateMonthlyLiabilityPropertyTotal (instance, liabilityTypes, property, startMonth, endMonth) {
                var liabilities = underscore.filter(instance.models.liabilities, function(liability) {
                        if (!liabilityTypes || liabilityTypes.length == 0) return true;

                        return liabilityTypes.indexOf(liability.type) != -1;
                    });

                if (liabilities.length == 0) return Base.initializeArray(instance.numberOfMonths);

                return underscore.chain(liabilities)
                    .map(function(liability) {
                        var l = new Liability(liability).liabilityInRange(startMonth, endMonth);
                        return underscore.pluck(l, property);
                    })
                    .unzip()
                    .map(function(monthArray) {
                            return underscore.reduce(monthArray, function(total, value) { return total + (value || 0); }, 0);
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

            function getDepreciation(instance) {
                var yearlyDepreciation = underscore.chain(instance.data.assetStatement['medium-term'])
                    .filter(function(item) {
                        return underscore.contains(['Vehicle', 'Machinery', 'Equipment'], item.name);
                    })
                    .map(function(item) {
                        var adjustmentFactor = instance.data.adjustmentFactors[item.name] || 1;
                        for (var i = 0; i < item.yearlyRMV.length; i++) {
                            item.yearlyRMV[i] = (item.yearlyRMV[i] / adjustmentFactor) * (1 - (instance.data.account.depreciationRate || 0));
                        }
                        return item;
                    })
                    .pluck('yearlyRMV')
                    .reduce(function(result, rmvArray) {
                        if (result.length == 0) {
                            result = Base.initializeArray(rmvArray.length);
                        }
                        return addArrayValues(result, rmvArray);
                    }, [])
                    .value();
                return (yearlyDepreciation.length == 0 ? [0,0] : yearlyDepreciation);
            }

            function recalculateSummary (instance) {
                var startMonth = moment(instance.startDate, 'YYYY-MM-DD'),
                    endMonth = moment(instance.endDate, 'YYYY-MM-DD'),
                    numberOfMonths = endMonth.diff(startMonth, 'months');

                // Summary of year 1 & year 2 for each category
                instance.data.summary = {};
                instance.data.summary.monthly = {
                    // Income
                    unallocatedProductionIncome: calculateMonthlySectionsTotal([instance.data.unallocatedProductionIncome], Base.initializeArray(numberOfMonths)),
                    productionIncome: calculateMonthlySectionsTotal([instance.data.productionIncome], Base.initializeArray(numberOfMonths)),
                    capitalIncome: calculateMonthlySectionsTotal([instance.data.capitalIncome], Base.initializeArray(numberOfMonths)),
                    otherIncome: calculateMonthlySectionsTotal([instance.data.otherIncome], Base.initializeArray(numberOfMonths)),
                    totalIncome: calculateMonthlySectionsTotal([instance.data.capitalIncome, instance.data.unallocatedProductionIncome, instance.data.otherIncome], Base.initializeArray(numberOfMonths)),

                    // Expenses
                    unallocatedProductionExpenditure: calculateMonthlySectionsTotal([instance.data.unallocatedProductionExpenditure], Base.initializeArray(numberOfMonths)),
                    productionExpenditure: calculateMonthlySectionsTotal([instance.data.productionExpenditure], Base.initializeArray(numberOfMonths)),
                    capitalExpenditure: calculateMonthlySectionsTotal([instance.data.capitalExpenditure], Base.initializeArray(numberOfMonths)),
                    otherExpenditure: calculateMonthlySectionsTotal([instance.data.otherExpenditure], Base.initializeArray(numberOfMonths)),
                    debtRedemption: calculateMonthlySectionsTotal([instance.data.debtRedemption], Base.initializeArray(numberOfMonths)),
                    totalExpenditure: calculateMonthlySectionsTotal([instance.data.capitalExpenditure, instance.data.unallocatedProductionExpenditure, instance.data.debtRedemption, instance.data.otherExpenditure], Base.initializeArray(numberOfMonths)),

                    // Interest
                    primaryAccountInterest: Base.initializeArray(numberOfMonths), //Calculated when primary account is recalculated
                    productionCreditInterest: calculateMonthlyLiabilityPropertyTotal(instance, ['short-term', 'production-credit'], 'interest', startMonth, endMonth),
                    mediumTermInterest: calculateMonthlyLiabilityPropertyTotal(instance, ['medium-term'], 'interest', startMonth, endMonth),
                    longTermInterest: calculateMonthlyLiabilityPropertyTotal(instance, ['long-term'], 'interest', startMonth, endMonth),
                    totalInterest: Base.initializeArray(numberOfMonths), //Calculated when primary account is recalculated

                    // Liabilities
                    currentLiabilities: calculateMonthlyLiabilityPropertyTotal(instance, ['short-term', 'production-credit'], 'closing', startMonth, endMonth),
                    mediumLiabilities: calculateMonthlyLiabilityPropertyTotal(instance, ['medium-term'], 'closing', startMonth, endMonth),
                    longLiabilities: calculateMonthlyLiabilityPropertyTotal(instance, ['long-term'], 'closing', startMonth, endMonth),
                    totalLiabilities: calculateMonthlyLiabilityPropertyTotal(instance, [], 'closing', startMonth, endMonth),
                    totalRent: calculateMonthlyLiabilityPropertyTotal(instance, ['rent'], 'rent', startMonth, endMonth)
                };

                instance.data.summary.yearly = {
                    // Income
                    unallocatedProductionIncome: [calculateYearlyTotal(instance.data.summary.monthly.unallocatedProductionIncome, 1), calculateYearlyTotal(instance.data.summary.monthly.unallocatedProductionIncome, 2)],
                    productionIncome: [calculateYearlyTotal(instance.data.summary.monthly.productionIncome, 1), calculateYearlyTotal(instance.data.summary.monthly.productionIncome, 2)],
                    capitalIncome: [calculateYearlyTotal(instance.data.summary.monthly.capitalIncome, 1), calculateYearlyTotal(instance.data.summary.monthly.capitalIncome, 2)],
                    otherIncome: [calculateYearlyTotal(instance.data.summary.monthly.otherIncome, 1), calculateYearlyTotal(instance.data.summary.monthly.otherIncome, 2)],
                    totalIncome: [calculateYearlyTotal(instance.data.summary.monthly.totalIncome, 1), calculateYearlyTotal(instance.data.summary.monthly.totalIncome, 2)],

                    // Expenses
                    unallocatedProductionExpenditure: [calculateYearlyTotal(instance.data.summary.monthly.unallocatedProductionExpenditure, 1), calculateYearlyTotal(instance.data.summary.monthly.unallocatedProductionExpenditure, 2)],
                    productionExpenditure: [calculateYearlyTotal(instance.data.summary.monthly.productionExpenditure, 1), calculateYearlyTotal(instance.data.summary.monthly.productionExpenditure, 2)],
                    capitalExpenditure: [calculateYearlyTotal(instance.data.summary.monthly.capitalExpenditure, 1), calculateYearlyTotal(instance.data.summary.monthly.capitalExpenditure, 2)],
                    otherExpenditure: [calculateYearlyTotal(instance.data.summary.monthly.otherExpenditure, 1), calculateYearlyTotal(instance.data.summary.monthly.otherExpenditure, 2)],
                    debtRedemption: [calculateYearlyTotal(instance.data.summary.monthly.debtRedemption, 1), calculateYearlyTotal(instance.data.summary.monthly.debtRedemption, 2)],
                    totalExpenditure: [calculateYearlyTotal(instance.data.summary.monthly.totalExpenditure, 1), calculateYearlyTotal(instance.data.summary.monthly.totalExpenditure, 2)],

                    // Interest
                    primaryAccountInterest: Base.initializeArray(2),
                    productionCreditInterest: [calculateYearlyTotal(instance.data.summary.monthly.productionCreditInterest, 1), calculateYearlyTotal(instance.data.summary.monthly.productionCreditInterest, 2)],
                    mediumTermInterest: [calculateYearlyTotal(instance.data.summary.monthly.mediumTermInterest, 1), calculateYearlyTotal(instance.data.summary.monthly.mediumTermInterest, 2)],
                    longTermInterest: [calculateYearlyTotal(instance.data.summary.monthly.longTermInterest, 1), calculateYearlyTotal(instance.data.summary.monthly.longTermInterest, 2)],
                    totalInterest: Base.initializeArray(2),

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

                    depreciation: getDepreciation(instance)
                };

                instance.data.summary.yearly.netFarmIncome = subtractArrayValues(instance.data.summary.yearly.productionIncome, addArrayValues(instance.data.summary.yearly.productionExpenditure, instance.data.summary.yearly.depreciation));
                instance.data.summary.yearly.farmingProfitOrLoss = subtractArrayValues(instance.data.summary.yearly.netFarmIncome, addArrayValues(instance.data.summary.yearly.totalRent, instance.data.summary.yearly.totalInterest));
            }

            /**
             * Primary Account Handling
             */
            function recalculatePrimaryAccount(instance) {
                var startMonth = moment(instance.startDate, 'YYYY-MM-DD'),
                    endMonth = moment(instance.endDate, 'YYYY-MM-DD'),
                    numberOfYears = Math.ceil(endMonth.diff(startMonth, 'years', true)),
                    defaultObject = {
                        opening: 0,
                        inflow: 0,
                        outflow: 0,
                        balance: 0,
                        interestPayable: 0,
                        interestReceivable: 0,
                        closing: 0
                    };

                instance.data.summary.monthly.primaryAccountInterest = Base.initializeArray(instance.numberOfMonths);
                instance.data.summary.monthly.totalInterest = calculateMonthlyLiabilityPropertyTotal(instance, [], 'interest', startMonth, endMonth);

                instance.account.monthly = underscore.chain(underscore.range(instance.numberOfMonths))
                    .map(function () {
                        return underscore.extend({}, defaultObject);
                    })
                    .reduce(function (monthly, month, index) {
                        month.opening = (index === 0 ? instance.account.openingBalance : monthly[monthly.length - 1].closing);
                        month.inflow = instance.data.summary.monthly.totalIncome[index];
                        month.outflow = instance.data.summary.monthly.totalExpenditure[index];
                        month.balance = month.opening + month.inflow - month.outflow;
                        month.interestPayable = (month.balance < 0 && instance.account.interestRateCredit ? ((month.opening + month.balance) / 2) * (instance.account.interestRateCredit / 100 / 12) : 0 );
                        month.interestReceivable = (month.balance > 0 && instance.account.interestRateDebit ? ((month.opening + month.balance) / 2) * (instance.account.interestRateDebit / 100 / 12) : 0 );
                        month.closing = month.balance + month.interestPayable + month.interestReceivable;

                        instance.data.summary.monthly.totalInterest[index] += -month.interestPayable;
                        instance.data.summary.monthly.primaryAccountInterest[index] += -month.interestPayable;

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
                instance.data.summary.yearly.totalInterest = [calculateYearlyTotal(instance.data.summary.monthly.totalInterest, 1), calculateYearlyTotal(instance.data.summary.monthly.totalInterest, 2)];
            }

            function recalculateRatios (instance) {
                instance.data.ratios = {
                    interestCover: calculateRatio(instance, 'netFarmIncome', 'totalInterest'),
                    inputOutput: calculateRatio(instance, 'productionIncome', ['productionExpenditure', 'productionCreditInterest', 'primaryAccountInterest']),
                    productionCost: calculateRatio(instance, 'productionExpenditure', 'productionIncome'),
                    cashFlowBank: calculateRatio(instance, 'unallocatedProductionIncome', ['unallocatedProductionExpenditure', 'primaryAccountInterest']),
                    //TODO: add payments to co-ops with crop deliveries to cashFlowFarming denominator
                    cashFlowFarming: calculateRatio(instance, ['productionIncome', 'capitalIncome', 'otherIncome'], ['totalExpenditure', 'primaryAccountInterest']),
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

            computedProperty(this, 'models', function () {
                return this.data.models;
            });

            privateProperty(this, 'reEvaluate', function() {
                reEvaluateBusinessPlan(this);
            });

            privateProperty(this, 'recalculateAccount', function() {
                recalculatePrimaryAccount(this);
            });
        }

        inheritModel(BusinessPlan, Document);

        readOnlyProperty(BusinessPlan, 'incomeExpenseTypes', {
            'capital': 'Capital',
            'production': 'Production',
            'other': 'Other'
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
