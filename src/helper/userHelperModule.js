var sdkHelperUserApp = angular.module('ag.sdk.helper.user', []);

sdkHelperUserApp.factory('userHelper', [function() {
    var _listServiceMap = function (item) {
        return {
            title: item.firstName + ' ' + item.lastName,
            subtitle: item.position,
            teams: item.teams
        }
    };

    var _languageLit = ['English'];

    return {
        listServiceMap: function() {
            return _listServiceMap;
        },
        languageList: function() {
            return _languageLit;
        }
    }
}]);
