'use strict';

define(['angular', 'core/dataModule'], function () {
    var module = angular.module('apiModule', ['dataModule']);

    var _errors = {
        TypeParamRequired: {code: 'TypeParamRequired', message: 'Type parameter is required'}
    };

    module.factory('taskApiService', ['dataStore', function (dataStore) {
        var taskStore = dataStore('task', {apiTemplate: 'task/:id'});

        return {
            // Tasks
            getTasksByType: function (type, gtCallback) {
                if (arguments.length != 2) {
                    gtCallback(null, _errors.TypeParamRequired);
                } else {
                    dataStore('task', {apiTemplate: 'tasks?type=:type'})
                        .transaction(function (tx) {
                            tx.read({type: type}, function (res, err) {
                                if (res && (res instanceof Array) === false) {
                                    res = [res];
                                }

                                gtCallback(res, err);
                            });
                        });
                }
            },
            getTasksById: function (tid, gtCallback) {
                dataStore('task', {apiTemplate: 'task/:id/tasks'})
                    .transaction(function (tx) {
                        tx.read({id: tid}, function (res, err) {
                            if (res && (res instanceof Array) === false) {
                                res = [res];
                            }

                            gtCallback(res, err);
                        });
                    });
            },

            // Task
            findTask: function (tid, ftCallback) {
                taskStore.transaction(function (tx) {
                    tx.find(tid, ftCallback);
                });
            },
            updateTask: function (taskItem, utCallback) {
                taskStore.transaction(function (tx) {
                        tx.update(taskItem, utCallback);
                    });
            },
            syncTask: function (tid, stCallback) {
                taskStore.transaction(function (tx) {
                        tx.sync({id: tid}, stCallback);
                    });
            }
        };
    }]);

    module.factory('documentApiService', ['dataStore', function (dataStore) {
        var documentStore = dataStore('document', {apiTemplate: 'document/:id'});

        return {
            // Document
            getDocument: function (did, gdCallback) {
                documentStore.transaction(function (tx) {
                    tx.read({id: did}, gdCallback);
                });
            },
            updateDocument: function (documentItem, udCallback) {
                documentStore.transaction(function (tx) {
                        tx.update(documentItem, udCallback);
                    });
            },
            syncDocument: function (did, sdCallback) {
                documentStore.transaction(function (tx) {
                        tx.sync({id: did}, sdCallback);
                    });
            }
        };
    }]);

    module.factory('customerApiService', ['dataStore', function (dataStore) {
        var customersStore = dataStore('customers', {apiTemplate: 'customers', indexerProperty: 'cid'});

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

    module.factory('assetApiService', ['dataStore', function (dataStore) {
        var assetStore = dataStore('asset', {apiTemplate: 'asset/:id'});

        return {
            getAsset: function (aid, gaCallback) {
                assetStore.transaction(function (tx) {
                    tx.read({id: aid}, gaCallback);
                });
            },
            updateAsset: function (assetItem, uaCallback) {
                assetStore.transaction(function (tx) {
                    tx.update(assetItem, uaCallback);
                });
            },
            syncAsset: function (aid, saCallback) {
                assetStore.transaction(function (tx) {
                    tx.sync({id: aid}, saCallback);
                });
            }
        };
    }]);

    module.factory('farmerApiService', ['dataStore', function (dataStore) {
        var farmerStore = dataStore('farmer', {apiTemplate: 'farmer/:id'});

        return {
            getFarmer: function (fid, gfCallback) {
                farmerStore.transaction(function (tx) {
                    tx.read({id: fid}, gfCallback);
                });
            },
            updateFarmer: function (farmerItem, ufCallback) {
                farmerStore.transaction(function (tx) {
                    tx.update(farmerItem, ufCallback);
                });
            },
            syncFarmer: function (fid, sfCallback) {
                farmerStore.transaction(function (tx) {
                    tx.sync({id: fid}, sfCallback);
                });
            }
        };
    }]);
});
