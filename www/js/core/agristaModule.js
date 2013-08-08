'use strict';

define(['angular', 'core/authorizationModule', 'core/dataModule'], function () {
    var module = angular.module('agristaModule', ['authorizationModule', 'dataModule']);

    module.config(['authorizationProvider', 'dataStoreProvider', function(authorizationProvider, dataStoreProvider) {
        authorizationProvider.config({url: 'http://localhost:3006/'});
        dataStoreProvider.config('http://localhost:3006/api/');
    }]);

    module.factory('customersService', ['$q', 'dataStore', function($q, dataStore) {
        var customersStore = dataStore('customers', {
            api: {
                template: 'customers'
            }
        });

        return {
            getCustomers: function() {
                var defer = $q.defer();

                customersStore.read().then(function(res) {
                    defer.resolve(res);
                }, function(err) {
                    defer.reject(err);
                });

                return defer.promise;
            }
        };
    }]);
});
