var sdkHelperEnterpriseBudgetApp = angular.module('ag.sdk.helper.enterprise-budget', []);

sdkHelperEnterpriseBudgetApp.factory('enterpriseBudgetHelper', [function() {
    var _listServiceMap = function (item) {
        return {
            title: item.name,
            subtitle: item.commodityType + (item.region && item.region.properties ? ' in ' + item.region.properties.name : '')
        }
    };

    var _modelTypes = {
        crop: 'Field Crop',
        livestock: 'Livestock',
        horticulture: 'Horticulture'
    };

    var _expenses = ['Seed',
        'Plant Material',
        'Fertiliser',
        'Lime',
        'Herbicides',
        'Pesticides',
        'Fuel',
        'Repairs & parts',
        'Electricity',
        'Water',
        'Scheduling',
        'Crop Insurance (Hail)',
        'Crop Insurance (Multiperil)',
        'Summer lick',
        'Winter lick',
        'Veterinary costs',
        'Marketing costs',
        'Transport',
        'Storage',
        'Packaging material',
        'Drying and cleaning',
        'Packing cost',
        'Casual labour',
        'Contact work (Harvest)',
        'Hedging cost',
        'Fuel',
        'Repairs & parts',
        'Electricity',
        'License',
        'Insurance assets',
        'Permanent labour',
        'Other costs'];

    var _expenseCategories = {
        crop: [_expenses[0], _expenses[2], _expenses[3], _expenses[4], _expenses[5], _expenses[6], _expenses[7], _expenses[8], _expenses[9], _expenses[10], _expenses[11], _expenses[12], _expenses[22], _expenses[23], _expenses[24], _expenses[25], _expenses[26], _expenses[27], _expenses[30], _expenses[31]],
        livestock: [_expenses[13], _expenses[14], _expenses[15], _expenses[16], _expenses[17], _expenses[22], _expenses[25], _expenses[26], _expenses[27], _expenses[28], _expenses[29], _expenses[30], _expenses[31]],
        horticulture: [_expenses[1], _expenses[2], _expenses[3], _expenses[4], _expenses[5], _expenses[6], _expenses[7], _expenses[8], _expenses[9], _expenses[10], _expenses[11], _expenses[12], _expenses[16], _expenses[17], _expenses[18], _expenses[19], _expenses[20], _expenses[21], _expenses[22], _expenses[25], _expenses[26], _expenses[27], _expenses[28], _expenses[29], _expenses[30], _expenses[31]]
    };

    function checkBudgetTemplate (budget) {
        budget.data = budget.data || {};
        budget.data.income = budget.data.income || {};
        budget.data.expenses = budget.data.expenses || {};
        budget.data.products = budget.data.products || {};
        budget.data.total = budget.data.total || {};
    }

    var _incomeTypes = {
        crop: {
            'Yield (t/Ha)': 'yield',
            'Price (R/Ha)': 'price'
        },
        livestock: {
            Cattle: {
                'Bulls': {
                    incomeSubTypeVariableName: 'bulls',
                    perCattleVariableName: 'perCattle',
                    perUnitVariableName: 'perUnit'
                },
                'Heifers': {
                    incomeSubTypeVariableName: 'heifers',
                    perCattleVariableName: 'perCattle',
                    perUnitVariableName: 'perUnit'
                },
                'Cull cows': {
                    incomeSubTypeVariableName: 'cull cows',
                    perCattleVariableName: 'perCattle',
                    perUnitVariableName: 'perUnit'
                },
                'Calves': {
                    incomeSubTypeVariableName: 'calves',
                    perCattleVariableName: 'perCattle',
                    perUnitVariableName: 'perUnit'
                }
            },
            Goat: {
                'Goats income 1': {
                    incomeSubTypeVariableName: 'goatsIncome1',
                    perCattleVariableName: 'perGoat',
                    perUnitVariableName: 'perUnit'
                },
                'Goats income 2': {
                    incomeSubTypeVariableName: 'goatsIncome2',
                    perCattleVariableName: 'perGoat',
                    perUnitVariableName: 'perUnit'
                },
                'Goats income 3': {
                    incomeSubTypeVariableName: 'goatsIncome3',
                    perCattleVariableName: 'perGoat',
                    perUnitVariableName: 'perUnit'
                }
            }
        },
        horticulture: {
            'Yield (t/Ha)': 'yield',
            'Price (R/Ha)': 'price'
        }
    };

    var _horticulturesGrowthStages = {
        Bananas: ['0-1', '2-10'],
        Litchis: ['0-1', '2-3', '4-5', '6-19', '20'],
        Mangos: ['0-1', '2', '3', '4', '5-20'],
        Pineapples: ['0-1', '2'],
        Strawberries: ['0-1', '2']
    };

    return {
        listServiceMap: function () {
            return _listServiceMap;
        },
        getExpenseCategories: function (type) {
            return _expenseCategories[type] || [];
        },
        getModelType: function (type) {
            return _modelTypes[type] || '';
        },

        validateBudgetData: function (budget) {
            checkBudgetTemplate(budget);

            var expenseCategories = _expenseCategories[budget.assetType];

            angular.forEach(budget.data.expenses, function (value, category) {
                if (expenseCategories.indexOf(category) == -1 || typeof value != 'number') {
                    delete budget.data.expenses[category];
                    delete budget.data.products[category];
                }
            });

            return this.calculateTotals(budget);
        },
        addExpenseCategory: function (budget, category) {
            if (_expenseCategories[budget.assetType].indexOf(category) != -1 && budget.data.expenses[category] === undefined) {
                budget.data.expenses[category] = 0;
                budget = this.calculateTotals(budget);
            }

            return budget;
        },
        removeExpenseCategory: function (budget, category) {
            delete budget.data.expenses[category];
            delete budget.data.products[category];
            return this.calculateTotals(budget);
        },
        getIncomeList: function (assetType, commodityType) {
            if(assetType == 'crop' || assetType == 'horticulture' ) {
                return _incomeTypes[assetType];
            }
            else if(assetType == 'livestock') {
                return _incomeTypes.livestock[commodityType];
            }
            else {
                return {};
            }
        },
        getGrowthStages: function (assetType, commodityType) {
            if(assetType == 'horticulture') {
                return _horticulturesGrowthStages[commodityType] || [];
            } else {
                return [];
            }
        },
        calculateTotals: function (budget) {
            checkBudgetTemplate(budget);

            if (isNaN(budget.data.income.yield) == false && isNaN(budget.data.income.price) == false) {
                budget.data.total.income = budget.data.income.yield * budget.data.income.price;
            }

            budget.data.total.expenses = 0;

            angular.forEach(budget.data.expenses, function (value, type) {
                if (budget.data.products[type] !== undefined) {
                    value = _.reduce(budget.data.products[type], function (total, product) {
                        return total + product.price;
                    }, 0);
                }

                budget.data.expenses[type] = value;
                budget.data.total.expenses += value;
            });

            budget.data.total.profit = budget.data.total.income - budget.data.total.expenses;

            return budget;
        }
    }
}]);
