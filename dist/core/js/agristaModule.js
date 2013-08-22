'use strict';

define(['angular', 'core/dataModule'], function () {
    var module = angular.module('agristaModule', ['dataModule']);

    module.factory('customerService', ['dataStore', function (dataStore) {
        var customersStore = dataStore('customers', {apiTemplate: 'customers', indexerProperty: 'cid'})

        return {
            // Customers
            getCustomers: function (gcCallback) {
                customersStore.transaction(function (tx) {
                    tx.read(function (res, err) {
                        if (res && (res instanceof Array) === false) {
                            res = [res];
                        }

                        gcCallback(res, err);
                    });
                });
            },
            findCustomer: function (cid, fcCallback) {
                customersStore.transaction(function (tx) {
                    tx.find(cid, fcCallback);
                });
            },
            syncCustomers: function (scCallback) {
                customersStore.transaction(function (tx) {
                    tx.sync(scCallback);
                });
            },

            // Customer
            getCustomer: function (cid, gcCallback) {
                dataStore('customer', {apiTemplate: 'customer/:id'})
                    .transaction(function (tx) {
                        tx.read({id: cid}, gcCallback);
                    });
            },
            getCustomerAssets: function (cid, gcaCallback) {
                dataStore('assets', {apiTemplate: 'customer/:id/assets'})
                    .transaction(function (tx) {
                        tx.read({id: cid}, gcaCallback);
                    });
            }
        };
    }]);

    module.factory('assetService', ['dataStore', function (dataStore) {
        var assetStore = dataStore('asset', {apiTemplate: 'asset/:id'});

        return {
            getAsset: function (id, gfCallback) {
                assetStore.transaction(function (tx) {
                    tx.read({id: id}, gfCallback);
                });
            }
        };
    }]);

    module.factory('farmerService', ['dataStore', function (dataStore) {
        var farmerStore = dataStore('farmer', {apiTemplate: 'farmer/:id'});

        return {
            getFarmer: function (id, gfCallback) {
                farmerStore.transaction(function (tx) {
                    tx.read({id: id}, gfCallback);
                });
            },
            updateFarmer: function (farmerItem, ufCallback) {
                farmerStore.transaction(function (tx) {
                    tx.update(farmerItem, ufCallback);
                });
            },
            syncFarmer: function (id, scCallback) {
                farmerStore.transaction(function (tx) {
                    tx.sync({id: id}, scCallback);
                });
            }
        };
    }]);
});
