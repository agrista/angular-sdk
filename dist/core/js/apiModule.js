'use strict';

define(['angular', 'core/utilityModule', 'core/dataModule', 'phone/storageModule'], function () {
    var module = angular.module('apiModule', ['utilityModule', 'dataModule', 'storageModule']);

    var _errors = {
        TypeParamRequired: {code: 'TypeParamRequired', message: 'Type parameter is required'},
        UploadPhotoError: {code: 'UploadPhotoError', message: 'Error occured uploading photo'}
    };


    /*
     * Syncronization
     */
    module.provider('dataSyncronizationService', function () {
        this.$get = ['queueService', 'taskApiService', 'documentApiService', 'photoApiService', 'customerApiService', 'cultivarApiService', 'assetApiService', 'farmerApiService',
            function (queueService, taskApiService, documentApiService, photoApiService, customerApiService, cultivarApiService, assetApiService, farmerApiService) {
                var _queue = null;
                var _syncList = null;
                var _inProgress = false;

                var _readOptions = {readLocal: false, readRemote: true};

                function _getTasksByType(taskType) {
                    if (_inProgress === true) {
                        _queue.pushPromise(function (defer) {
                            taskApiService.getTasksByType(taskType, _readOptions, function (res, err) {
                                if (res) {
                                    for (var i = 0; i < res.length; i++) {
                                        var item = res[i];

                                        if (item.id !== undefined) {
                                            var sync = (item.dirty === true && item.data.status === 'complete');

                                            _getTask(item.id, sync);

                                            if (sync) {
                                                _postTask('tasks?type=:type', {type: taskType}, 'task/:id');
                                            }
                                        }
                                    }

                                    defer.resolve();
                                } else {
                                    defer.reject();
                                }
                            });
                        });
                    }
                }

                function _getTask(tid, sync) {
                    if (_inProgress === true && tid !== undefined) {
                        _queue.pushPromise(function (defer) {
                            taskApiService.getTasksById(tid, _readOptions, function (res, err) {
                                if (res) {
                                    for (var i = 0; i < res.length; i++) {
                                        var task = res[i].data;

                                        if (task.object && task.object.id) {
                                            _getDocument(task.object.id, task);
                                        }

                                        if (sync) {
                                            _postDocument(task.object.id);
                                            _postTask('task/:id/tasks', {id: tid}, 'task/:id');
                                            _postPhotos(task.object.id);
                                        }
                                    }

                                    defer.resolve();
                                } else {
                                    defer.reject();
                                }
                            });
                        });
                    }
                }

                function _postTask(readUri, schema, writeUri) {
                    if (_inProgress === true) {
                        _queue.pushPromise(function (defer) {
                            taskApiService.syncTask(readUri, schema, writeUri, function (res, err) {
                                if (res) {
                                    defer.resolve();
                                } else {
                                    defer.reject();
                                }
                            });
                        });
                    }
                }

                function _getDocument(did, task) {
                    if (_inProgress === true && did !== undefined) {
                        _queue.pushPromise(function (defer) {
                            documentApiService.getDocument(did, _readOptions, function (res, err) {
                                if (res && res.length == 1) {
                                    var customer = res[0].data;

                                    _getCustomer(customer.customerID, task.ass_by);
                                    _getCustomerAssets(customer.customerID, task.ass_by);
                                    _getCultivars(customer.crop);

                                    defer.resolve();
                                } else {
                                    defer.reject();
                                }
                            });
                        });
                    }
                }

                function _postDocument(did) {
                    if (_inProgress === true && did !== undefined) {
                        _queue.pushPromise(function (defer) {
                            documentApiService.syncDocument(did, function (res, err) {
                                if (res) {
                                    defer.resolve();
                                } else {
                                    defer.reject();
                                }
                            });
                        });
                    }
                }

                function _postPhotos(did) {
                    if (_inProgress === true && did !== undefined) {
                        _queue.pushPromise(function (defer) {
                            documentApiService.getDocumentPhotos(did, function (res, err) {
                                if (res) {
                                    for (var i = 0; i < res.length; i++) {
                                        _postPhoto(res[i]);
                                    }

                                    defer.resolve();
                                } else {
                                    defer.reject();
                                }
                            });
                        });
                    }
                }

                function _postPhoto(photoItem) {
                    if (_inProgress === true) {
                        _queue.pushPromise(function (defer) {
                            photoApiService.uploadPhoto(photoItem, function (res, err) {
                                if (res) {
                                    defer.resolve();
                                } else {
                                    defer.reject();
                                }
                            });
                        });
                    }
                }

                function _getCustomers() {
                    if (_inProgress === true) {
                        _queue.pushPromise(function (defer) {
                            customerApiService.getCustomers(_readOptions, function (res, err) {
                                if (res) {
                                    for (var i = 0; i < res.length; i++) {
                                        _getCustomerAssets(res[i].data.cid);
                                        _getFarmer(res[i].data.fid);
                                    }
                                    defer.resolve();
                                } else {
                                    defer.reject();
                                }
                            });
                        });
                    }
                }

                function _getCustomer(cid, assigner) {
                    if (_inProgress === true && cid !== undefined && _syncList.customers[cid] === undefined) {
                        _syncList.customers[cid] = true;

                        _queue.pushPromise(function (defer) {
                            customerApiService.getCustomer(cid, assigner, _readOptions, function (res, err) {
                                if (res && res.length == 1) {
                                    _getFarmer(res[0].data.farmerID);
                                    defer.resolve();
                                } else {
                                    defer.reject();
                                }
                            });
                        });
                    }
                }

                function _getCustomerAssets(cid, assigner) {
                    if (_inProgress === true && cid !== undefined && _syncList.customerAssets[cid] === undefined) {
                        _syncList.customerAssets[cid] = true;

                        _queue.pushPromise(function (defer) {
                            customerApiService.getCustomerAssets(cid, assigner, _readOptions, function (res, err) {
                                if (res) {
                                    for (var i = 0; i < res.length; i++) {
                                        if (res[i].dirty === true) {
                                            _postAsset('customer/:id/assets', {id: taskType}, 'asset/:id');
                                        }
                                    }

                                    defer.resolve();
                                } else {
                                    defer.reject();
                                }
                            });
                        });
                    }
                }

                function _getCultivars(crop) {
                    if (_inProgress === true && crop !== undefined && _syncList.cultivars[crop] === undefined) {
                        _syncList.cultivars[crop] = true;

                        _queue.pushPromise(function (defer) {
                            cultivarApiService.getCultivars(crop, _readOptions, function (res, err) {
                                if (res) {
                                    defer.resolve();
                                } else {
                                    defer.reject();
                                }
                            });
                        });
                    }
                }

                function _getAsset(aid) {
                    if (_inProgress === true && aid !== undefined && _syncList.assets[aid] === undefined) {
                        _syncList.assets[aid] = true;

                        _queue.pushPromise(function (defer) {
                            assetApiService.getAsset(aid, _readOptions, function (res, err) {
                                if (res && res.length == 1) {
                                    if (res[0].dirty === true) {
                                        _postAsset('asset/:id', {id: aid}, 'asset/:id');
                                    }

                                    defer.resolve();
                                } else {
                                    defer.reject();
                                }
                            });
                        });
                    }
                }

                function _postAsset(readUri, schema, writeUri) {
                    if (_inProgress === true) {
                        _queue.pushPromise(function (defer) {
                            assetApiService.syncAsset(readUri, schema, writeUri, function (res, err) {
                                if (res) {
                                    defer.resolve();
                                } else {
                                    defer.reject();
                                }
                            });
                        });
                    }
                }

                function _getFarmer(fid) {
                    if (_inProgress === true && fid !== undefined && _syncList.farmers[fid] === undefined) {
                        _syncList.farmers[fid] = true;

                        _queue.pushPromise(function (defer) {
                            farmerApiService.getFarmer(fid, _readOptions, function (res, err) {
                                if (res && res.length == 1) {
                                    if (res[0].dirty === true) {
                                        _postFarmer(res[0].id);
                                    }

                                    defer.resolve();
                                } else {
                                    defer.reject();
                                }
                            });
                        });
                    }
                }

                function _postFarmer(fid) {
                    if (_inProgress === true && fid !== undefined) {
                        _queue.pushPromise(function (defer) {
                            farmerApiService.syncFarmer(fid, function (res, err) {
                                if (res) {
                                    defer.resolve();
                                } else {
                                    defer.reject();
                                }
                            });
                        });
                    }
                }

                return {
                    cancel: function () {
                        if (_queue) {
                            _inProgress = false;
                            _queue.clear();
                        }
                    },
                    sync: function (options, callback) {
                        if (typeof options === 'function') {
                            callback = options;
                            options = {
                                customers: true,
                                tasks: true
                            }
                        }

                        if (_inProgress === false) {
                            _inProgress = true;
                            _syncList = {
                                customers: {},
                                customerAssets: {},
                                cultivars: {},
                                farmers: {},
                                assets: {}
                            };

                            _queue = queueService(function (data) {
                                if (data.type === 'complete') {
                                    _inProgress = false;
                                }

                                callback(data);
                            });

                            if (options.tasks === true) {
                                _getTasksByType('work-package');
                            }

                            if (options.customers === true) {
                                _getCustomers();
                            }
                        }
                    }
                }
            }]
    });


    /*
     * API
     */
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
                        tx.read({type: type}, options, gtCallback);
                    });

            },
            getTasksById: function (tid, options, gtCallback) {
                if (typeof options === 'function') {
                    gtCallback = options;
                    options = {};
                }

                dataStore('task', {apiTemplate: 'task/:id/tasks'})
                    .transaction(function (tx) {
                        tx.read({id: tid}, options, gtCallback);
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
            },
            getDocumentPhotos: function (did, options, gdpCallback) {
                if (typeof options === 'function') {
                    gdpCallback = options;
                    options = {};
                }

                dataStore('photo', {apiTemplate: 'document/:id/photo'})
                    .transaction(function (tx) {
                        tx.read({id: did}, options, gdpCallback);
                    });
            }
        };
    }]);

    module.factory('photoApiService', ['$http', 'dataStore', 'fileStorageService', 'safeApply', function ($http, dataStore, fileStorageService, safeApply) {
        var photoStore = dataStore('photo', {apiTemplate: 'photo/:id'});

        return {
            // Photo
            createPhoto: function (uriTemplate, schema, photoItem, cpCallback) {
                photoStore.transaction(function (tx) {
                    tx.make(uriTemplate, schema, photoItem, cpCallback);
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
            uploadPhoto: function (photoItem, upCallback) {
                if (photoItem.local === true) {
                    console.log('photoItem local');

                    var photoData = {
                        loc: photoItem.data.loc
                    };

                    var _uploadAndUpdatePhoto = function (photoData) {
                        console.log('start upload');

                        safeApply(function () {
                            $http
                                .post(photoStore.defaults.url + photoItem.uri, photoData, {withCredentials: true})
                                .then(function () {
                                    console.log('finish upload');
                                    photoItem.local = false;

                                    photoStore.transaction(function (tx) {
                                        console.log('update upload');

                                        tx.update(photoItem, upCallback);
                                    });
                                }, function () {
                                    upCallback(null, _errors.UploadPhotoError);
                                });
                        });
                    };

                    if (photoItem.data.image.src !== undefined) {
                        console.log('start read');

                        fileStorageService.read(photoItem.data.image.src, true).then(function (fileData) {
                            console.log('finish read');

                            photoData.image = {
                                data: fileData.content.substring(fileData.content.indexOf(',') + 1),
                                type: photoItem.data.image.type
                            };

                            _uploadAndUpdatePhoto(photoData);
                        }, function (err) {
                            upCallback(null, err);
                        });
                    } else {
                        photoData.image = photoItem.data.image;

                        _uploadAndUpdatePhoto(photoData);
                    }
                } else {
                    upCallback(photoItem);
                }
            },
            deletePhoto: function (photoItem, dpCallback) {
                photoStore.transaction(function (tx) {
                    tx.remove(photoItem, dpCallback);
                });
            }
        };
    }]);

    module.factory('customerApiService', ['dataStore', function (dataStore) {
        return {
            // Customers
            getCustomers: function (options, gcCallback) {
                if (typeof options === 'function') {
                    gcCallback = options;
                    options = {};
                }

                dataStore('customers', {apiTemplate: 'customers', indexerProperty: 'cid'})
                    .transaction(function (tx) {
                        tx.read({}, options, gcCallback);
                    });
            },
            findCustomers: function (cid, fcCallback) {
                dataStore('customers', {apiTemplate: 'customers', indexerProperty: 'cid'})
                    .transaction(function (tx) {
                        tx.find(cid, fcCallback);
                    });
            },

            // Customer
            getCustomer: function (cid, assigner, options, gcCallback) {
                if (typeof assigner === 'object') {
                    gcCallback = options;
                    options = assigner;
                    assigner = undefined;
                }

                if (assigner !== undefined) {
                    dataStore('customer', {apiTemplate: 'customer/:id?user=:assigner'})
                        .transaction(function (tx) {
                            tx.read({id: cid, assigner: assigner}, options, gcCallback);
                        });
                } else {
                    dataStore('customer', {apiTemplate: 'customer/:id'})
                        .transaction(function (tx) {
                            tx.read({id: cid}, options, gcCallback);
                        });
                }
            },
            findCustomer: function (cid, fcCallback) {
                dataStore('customer', {apiTemplate: 'customer'})
                    .transaction(function (tx) {
                        tx.find(cid, fcCallback);
                    });
            },
            getCustomerAssets: function (cid, assigner, options, gcaCallback) {
                if (typeof assigner === 'object') {
                    gcaCallback = options;
                    options = assigner;
                    assigner = undefined;
                }
                if (typeof assigner === 'function') {
                    gcaCallback = assigner;
                    options = {};
                    assigner = undefined;
                }

                if (assigner !== undefined) {
                    dataStore('asset', {apiTemplate: 'customer/:id/assets?user=:assigner'})
                        .transaction(function (tx) {
                            tx.read({id: cid, assigner: assigner}, options, gcaCallback);
                        });
                } else {
                    dataStore('asset', {apiTemplate: 'customer/:id/assets'})
                        .transaction(function (tx) {
                            tx.read({id: cid}, options, gcaCallback);
                        });
                }
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
            syncAsset: function (readUri, schema, writeUri, saCallback) {
                if (readUri === assetStore.config.apiTemplate) {
                    assetStore.transaction(function (tx) {
                        tx.sync(schema, writeUri, saCallback);
                    });
                } else {
                    dataStore('asset', {apiTemplate: readUri})
                        .transaction(function (tx) {
                            tx.sync(schema, writeUri, saCallback);
                        });
                }
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
                    tx.search(data, scCallback);
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
