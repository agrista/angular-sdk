var sdkHelperAgriModelApp = angular.module('ag.sdk.helper.agri-model', []);

sdkHelperAgriModelApp.factory('agriModelHelper', [function() {
    var _listServiceMap = function (item) {
        return {
            title: item.name,
            subtitle: item.commodityType + ' in ' + item.region
        }
    };

    return {
        listServiceMap: function() {
            return _listServiceMap;
        }
    }
}]);
