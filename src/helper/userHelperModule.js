var sdkHelperUserApp = angular.module('ag.sdk.helper.user', []);

sdkHelperUserApp.provider('userHelper', ['listServiceMapProvider', function (listServiceMapProvider) {
    this.$get = ['listServiceMap', function (listServiceMap) {
        return {
            listServiceMap: function() {
                return listServiceMap('user');
            }
        }
    }];

    listServiceMapProvider.add('user', [function () {
        return function (item) {
            return {
                id: item.id || item.$id,
                title: item.firstName + ' ' + item.lastName,
                subtitle: item.position,
                teams: item.teams
            }
        };
    }]);
}]);
