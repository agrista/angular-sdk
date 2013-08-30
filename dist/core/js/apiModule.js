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
            getTasksByType: function (type, options, gtCallback) {
                if (typeof options === 'function') {
                    gtCallback = options;
                    options = {};
                }

                dataStore('task', {apiTemplate: 'tasks?type=:type'})
                    .transaction(function (tx) {
                        tx.read({type: type}, options, function (res, err) {
                            if (res && (res instanceof Array) === false) {
                                res = [res];
                            }

                            gtCallback(res, err);
                        });
                    });

            },
            getTasksById: function (tid, options, gtCallback) {
                if (typeof options === 'function') {
                    gtCallback = options;
                    options = {};
                }

                dataStore('task', {apiTemplate: 'task/:id/tasks'})
                    .transaction(function (tx) {
                        tx.read({id: tid}, options, function (res, err) {
                            if (res && (res instanceof Array) === false) {
                                res = [res];
                            }

                            gtCallback(res, err);
                        });
                    });
            },

            // Task
            getTask: function (tid, options, gtCallback) {
                taskStore.transaction(function (tx) {
                    tx.read({id: tid}, options, gtCallback);
                });
            },
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
            syncTask: function (readUri, schema, writeUri, stCallback) {
                dataStore('task', {apiTemplate: readUri})
                    .transaction(function (tx) {
                        tx.sync(schema, writeUri, stCallback);
                    });
            }
        };
    }]);

    module.factory('documentApiService', ['dataStore', function (dataStore) {
        var documentStore = dataStore('document', {apiTemplate: 'document/:id'});

        return {
            // Document
            getDocument: function (did, options, gdCallback) {
                documentStore.transaction(function (tx) {
                    tx.read({id: did}, options, gdCallback);
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

    module.factory('photoApiService', ['dataStore', function (dataStore) {
        var photoStore = dataStore('photo', {apiTemplate: 'photo/:id'});

        return {
            // Photos
            getPhotos: function (pid, options, gpCallback) {
                if (typeof options === 'function') {
                    gpCallback = options;
                    options = {};
                }

                photoStore.transaction(function (tx) {
                    tx.read({id: pid}, options, function (res, err) {
                        if (res && (res instanceof Array) === false) {
                            res = [res];
                        }

                        gpCallback(res, err);
                    });
                });
            },

            // Photo
            createPhoto: function (documentId, photoItem, cpCallback) {
                photoStore.transaction(function (tx) {
                    tx.make({id: documentId}, photoItem, cpCallback);
                });
            },
            findPhoto: function (pid, fpCallback) {
                photoStore.transaction(function (tx) {
                    tx.find(pid, fpCallback);
                });
            },
            updatePhoto: function (photoItem, upCallback) {
                photoStore.transaction(function (tx) {
                    tx.update(photoItem, upCallback);
                });
            },
            syncPhoto: function (pid, spCallback) {
                photoStore.transaction(function (tx) {
                    tx.sync({id: pid}, spCallback);
                });
            }
        };
    }]);

    module.factory('customerApiService', ['dataStore', function (dataStore) {
        var customersStore = dataStore('customers', {apiTemplate: 'customers', indexerProperty: 'cid'});

        return {
            // Customers
            getCustomers: function (options, gcCallback) {
                if (typeof options === 'function') {
                    gcCallback = options;
                    options = {};
                }

                customersStore.transaction(function (tx) {
                    tx.read({}, options, function (res, err) {
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
            getCustomer: function (cid, options, gcCallback) {
                dataStore('customer', {apiTemplate: 'customer/:id'})
                    .transaction(function (tx) {
                        tx.read({id: cid}, options, gcCallback);
                    });
            },
            getCustomerAssets: function (cid, options, gcaCallback) {
                dataStore('asset', {apiTemplate: 'customer/:id/assets'})
                    .transaction(function (tx) {
                        tx.read({id: cid}, options, gcaCallback);
                    });
            }
        };
    }]);

    module.factory('assetApiService', ['dataStore', function (dataStore) {
        var assetStore = dataStore('asset', {apiTemplate: 'asset/:id'});

        return {
            getAsset: function (aid, options, gaCallback) {
                assetStore.transaction(function (tx) {
                    tx.read({id: aid}, options, gaCallback);
                });
            },
            findAsset: function (aid, faCallback) {
                assetStore.transaction(function (tx) {
                    tx.find(aid, faCallback);
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

    module.factory('cultivarApiService', ['dataStore', function (dataStore) {
        var cultivarsStore = dataStore('cultivars', {apiTemplate: 'cultivars/:crop'});

        return {
            getCultivars: function (crop, options, gcCallback) {
                cultivarsStore.transaction(function (tx) {
                    tx.read({crop: crop}, options, gcCallback);
                });
            },
            searchCultivars: function (data, scCallback) {
                cultivarsStore.transaction(function (tx) {
                    tx.search(data, function (res, err) {
                        if (res && (res instanceof Array) === false) {
                            res = [res];
                        }

                        scCallback(res, err);
                    });
                });
            }
        };
    }]);

    module.factory('farmerApiService', ['dataStore', function (dataStore) {
        var farmerStore = dataStore('farmer', {apiTemplate: 'farmer/:id'});

        return {
            getFarmer: function (fid, options, gfCallback) {
                farmerStore.transaction(function (tx) {
                    tx.read({id: fid}, options, gfCallback);
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
