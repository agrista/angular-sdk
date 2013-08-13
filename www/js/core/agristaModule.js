'use strict';

define(['angular', 'core/authorizationModule', 'core/dataModule'], function () {
    var module = angular.module('agristaModule', ['authorizationModule', 'dataModule']);

    var _voidCallback = function() {};

    module.config(['authorizationProvider', 'dataStoreProvider', function(authorizationProvider, dataStoreProvider) {
        authorizationProvider.config({url: 'http://beta.agrista.com/'});
        dataStoreProvider.config('http://beta.agrista.com/api/');
//        authorizationProvider.config({url: 'http://localhost:3006/'});
//        dataStoreProvider.config('http://localhost:3006/api/');
    }]);



    module.factory('customersService', ['dataStore', function(dataStore) {
        var customersStore = dataStore('customers', {apiTemplate: 'customers', indexerProperty: 'cid'});

        return {
            getCustomers: function(gcCallback) {
                customersStore.transaction(function(tx) {
                    tx.read(function(res, err) {
                        if(res) {
                            if ((res instanceof Array) === false) {
                                res = [res];
                            }
                        } else {
                            res = [];
                        }

                        gcCallback(res, err);
                    });
                });
            },
            syncCustomers: function(scCallback) {
                customersStore.transaction(function(tx) {
                    tx.sync(scCallback);
                });
            }
        };
    }]);

    module.factory('farmerService', ['dataStore', function(dataStore) {
        var farmerStore = dataStore('farmer', {apiTemplate: 'farmer/:id'});

        return {
            getFarmer: function(id, gfCallback) {
                farmerStore.transaction(function(tx) {
                    tx.read({id: id}, gfCallback);
                });
            },
            updateFarmer: function(farmerItem, ufCallback) {
                farmerStore.transaction(function(tx) {
                    tx.update(farmerItem, ufCallback);
                });
            },
            syncFarmer: function(id, scCallback) {
                farmerStore.transaction(function(tx) {
                    tx.sync({id: id}, scCallback);
                });
            }
        };
    }]);

    module.factory('testService', ['dataStore', function(dataStore) {
        var testStore = dataStore('test', {apiTemplate: 'test/:id'});

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
