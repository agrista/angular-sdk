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

    return {
        listServiceMap: function () {
            return _listServiceMap;
        },
        getModelType: function (type) {
            return _modelTypes[type] || '';
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
