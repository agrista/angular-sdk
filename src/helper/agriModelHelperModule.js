var sdkHelperAgriModelApp = angular.module('ag.sdk.helper.agri-model', []);

sdkHelperAgriModelApp.factory('agriModelHelper', [function() {
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

        calculateTotals: function (agriModel) {
            var income = agriModel.data.income = agriModel.data.income || {};
            var expenses = agriModel.data.expenses = agriModel.data.expenses || [];
            var total = agriModel.data.total = agriModel.data.total || {};

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

            return agriModel;

        }
    }
}]);
