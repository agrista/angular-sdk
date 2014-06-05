var sdkHelperEnterpriseBudgetApp = angular.module('ag.sdk.helper.enterprise-budget', []);

sdkHelperEnterpriseBudgetApp.factory('enterpriseBudgetHelper', [function() {
    var _listServiceMap = function (item) {
        return {
            title: item.name,
            subtitle: item.commodityType + (item.region && item.region.properties ? ' in ' + item.region.properties.name : '')
        }
    };

    var _modelTypes = {
        crop: 'Crop',
        livestock: 'Livestock'
    };

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
        fruit: {
            'Yield (t/Ha)': 'yield',
            'Price (R/Ha)': 'price'
        }
    };

    var _fruitsGrowthStages = {
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
        getModelType: function (type) {
            return _modelTypes[type] || '';
        },
        getIncomeList: function (assetType, commodityType) {
            if(assetType == 'crop' || assetType == 'fruit' ) {
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
            if(assetType == 'fruit') {
                return _fruitsGrowthStages[commodityType] || [];
            } else {
                return [];
            }
        },
        calculateTotals: function (budget) {
            var income = budget.data.income = budget.data.income || {};
            var expenses = budget.data.expenses = budget.data.expenses || [];
            var total = budget.data.total = budget.data.total || {};

            if (isNaN(income.yield) == false && isNaN(income.price) == false) {
                total.income = income.yield * income.price;
            }

            total.expenses = 0;

            angular.forEach(expenses, function (type) {
                angular.forEach(type, function (subtype) {
                    total.expenses += (subtype.cost || 0);
                });
            });

            total.profit = total.income - total.expenses;

            return budget;
        }
    }
}]);
