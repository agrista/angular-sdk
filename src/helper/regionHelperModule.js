var sdkHelperRegionApp = angular.module('ag.sdk.helper.region', []);

sdkHelperRegionApp.factory('regionHelper', [function() {
    var _listServiceMap = function(item) {
        var map = {
            title: item.name,
            subtitle: item.region.province,
            region: item.region.name
        };
        if(item.subRegionNumber) {
            map.subtitle += ' - ' +item.subRegionNumber;
        }
        if(item.plotCode) {
            map.subtitle += ' - ' +item.plotCode;
        }

        return map;
    };

    return {
        listServiceMap: function() {
            return _listServiceMap;
        }
    }
}]);