'use strict';

define(['angular', 'core/authorizationModule', 'core/dataModule'], function () {
    var module = angular.module('agristaModule', ['authorizationModule', 'dataModule']);

    module.config(['authorizationProvider', 'dataStoreProvider', function(authorizationProvider, dataStoreProvider) {
        authorizationProvider.config({url: 'http://localhost:3006/'});
        dataStoreProvider.config('http://localhost:3006/api/');
    }]);

    module.factory('customersService', ['$q', 'dataStore', function($q, dataStore) {
        var customersStore = dataStore('customers', {apiTemplate: 'customers'});

        return {
            getCustomers: function(gcCallback) {
                customersStore.read(gcCallback);

                customersStore.transaction(function(tx) {
                    tx.read(gCallback);
                });
            }
        };
    }]);

    module.factory('testService', ['$q', 'dataStore', function($q, dataStore) {
        var testStore = dataStore('test', {apiTemplate: 'test/:id'});

        var _voidCallback = function() {};

        return {
            get: function(id, gCallback) {
                if(typeof gCallback !== 'function') gCallback = _voidCallback;

                testStore.transaction(function(tx) {
                    tx.read({id: id}, gCallback);
                });
            },
            set: function(items, sCallback) {
                if(typeof sCallback !== 'function') sCallback = _voidCallback;

                testStore.transaction(function(tx) {
                    tx.update(items, sCallback);
                });
            },
            add: function(id, data, aCallback) {
                if(typeof aCallback !== 'function') aCallback = _voidCallback;

                testStore.transaction(function(tx) {
                    tx.create({id: id}, data, aCallback);
                });
            },
            sync: function(id, sCallback) {
                if(typeof sCallback !== 'function') sCallback = _voidCallback;

                testStore.transaction(function(tx) {
                    tx.sync({id: id}, sCallback);
                });
            }
        };
    }]);
});
