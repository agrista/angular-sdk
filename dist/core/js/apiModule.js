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
    module.factory('dataUploadService', ['promiseMonitor', 'promiseService', 'taskApiService', 'documentApiService', 'photoApiService', 'customerApiService', 'assetApiService', 'farmerApiService',
        function(promiseMonitor, promiseService, taskApiService, documentApiService, photoApiService, customerApiService, assetApiService, farmerApiService) {
            var _monitor = null;
            var _syncList = null;

            function _uploadParentTasksByType (taskType) {
                return _monitor.add(promiseService.wrap(function(promise) {
                    // Dependency wrapper
                    taskApiService.getTasksByType(taskType).then(function(res) {
                        promiseService
                            .wrapAll(function(list) {
                                for (var i = 0; i < res.length; i++) {
                                    var parentTask = res[i];

                                    if (parentTask.dirty === true && parentTask.data.status == 'complete') {
                                        list.push(_monitor.add(_uploadChildTasks(parentTask.id)));
                                    }
                                }

                            }).then(function() {
                                // Resolve dependency list
                                promiseService
                                    .wrapAll(function(list) {
                                        for (var i = 0; i < res.length; i++) {
                                            var parentTask = res[i];

                                            if (parentTask.dirty === true && parentTask.data.status == 'complete') {
                                                list.push(_monitor.add(taskApiService.syncTask(parentTask, 'tasks?type=:type', {type: taskType}, 'task/:id')));
                                            }
                                        }
                                    }).then(promise.resolve, promise.reject);
                            }, promise.reject);
                    }, promise.reject);
                }));
            }

            function _uploadChildTasks(tid) {
                return  _monitor.add(promiseService.wrap(function(promise) {
                    // Dependency wrapper
                    taskApiService.getTasksById(tid)
                        .then(function(res) {
                            promiseService
                                .wrapAll(function(list) {
                                    for (var i = 0; i < res.length; i++) {
                                        var childTask = res[i].data;

                                        list.push(_uploadDocument(childTask.object.id, childTask.ass_by));
                                    }
                                }).then(function() {
                                    // Resolve dependency list
                                    promise.resolve(promiseService.wrapAll(function(list) {
                                        for (var i = 0; i < res.length; i++) {
                                            list.push(_monitor.add(taskApiService.syncTask(res[i], 'task/:id/tasks', {id: tid}, 'task/:id')));
                                        }
                                    }));
                                }, promise.reject);
                        }, promise.reject);
                }));
            }

            function _uploadDocument(did, taskAssigner) {
                return _monitor.add(promiseService.wrap(function(promise) {
                    // Dependency wrapper
                    documentApiService.getDocument(did).then(function(res) {
                        var document = res[0];

                        promiseService
                            .all([
                                _uploadPhotos(document.id),
                                _uploadCustomer(document.data.customerID, taskAssigner)
                            ]).then(function() {
                                _monitor.add(documentApiService.syncDocument(document, {id: document.id})).then(promise.resolve, promise.reject);
                            }, promise.reject);
                    }, promise.reject);
                }));
            }

            function _uploadPhotos(did) {
                return _monitor.add(promiseService.wrap(function(promise) {
                    // Dependency wrapper
                    documentApiService.getDocumentPhotos(did).then(function(res) {
                        promiseService.wrapAll(function(list) {
                            for (var i = 0; i < res.length; i++) {
                                if (res[i].dirty === true) {
                                    list.push(_monitor.add(photoApiService.uploadPhoto(res[i])));
                                }
                            }
                        }).then(promise.resolve, promise.reject);
                    }, promise.reject);
                }));
            }

            function _uploadCustomer(cid, taskAssigner) {
                return _monitor.add(promiseService.wrap(function(promise) {
                    // Dependency wrapper
                    if (cid && _syncList.customers[cid] === undefined) {
                        _syncList.customers[cid] = true;

                        customerApiService.getCustomer(cid, taskAssigner).then(function(res) {
                            var customer = res[0];

                            promiseService.all([
                                _uploadCustomerAssets(cid, taskAssigner),
                                _uploadFarmer(customer.data.farmerID)
                            ]).then(promise.resolve, promise.reject);
                        }, promise.reject);
                    } else {
                        // Handled already
                        promise.resolve();
                    }
                }));
            }

            function _uploadCustomerAssets(cid, taskAssigner) {
                return _monitor.add(promiseService.wrap(function(promise) {
                    // Dependency wrapper
                    if (cid && _syncList.customerAssets[cid] === undefined) {
                        _syncList.customerAssets[cid] = true;

                        customerApiService.getCustomerAssets(cid, taskAssigner).then(function(res) {
                            promiseService
                                .wrapAll(function(list) {
                                    for (var i = 0; i < res.length; i++) {
                                        if (res[i].dirty === true) {
                                            list.push(_monitor.add(assetApiService.syncAsset(res[i], 'customer/:id/assets', {id: cid}, 'asset/:id')));
                                        }
                                    }
                                }).then(promise.resolve, promise.reject);
                        }, promise.reject);
                    } else {
                        // Handled already
                        promise.resolve();
                    }
                }));
            }

            function _uploadFarmer(fid) {
                return _monitor.add(promiseService.wrap(function(promise) {
                    // Dependency wrapper
                    if (fid && _syncList.farmer[fid] === undefined) {
                        _syncList.farmer[fid] = true;

                        farmerApiService.getFarmer(fid).then(function(res) {
                            if (res[0].dirty === true) {
                                _monitor.add(farmerApiService.syncFarmer(res[0], {id: res[0].id})).then(promise.resolve, promise.reject);
                            } else {
                                promise.resolve();
                            }
                        }, promise.reject);
                    } else {
                        // Handled already
                        promise.resolve();
                    }
                }));
            }

            return function(monitor, options) {
                if (arguments.length == 1) {
                    options = monitor;
                    monitor = promiseMonitor();
                }

                _monitor = monitor;
                _syncList = {
                    customers: {},
                    customerAssets: {},
                    farmer: {}
                };

                return promiseService.wrapAll(function(list) {
                    if (options.tasks === true) {
                        list.push(_uploadParentTasksByType('work-package'));
                    }
                });
            }
        }]);

    module.factory('dataDownloadService', ['promiseMonitor', 'promiseService', 'taskApiService', 'documentApiService', 'photoApiService', 'customerApiService', 'cultivarApiService', 'assetApiService', 'farmerApiService',
        function (promiseMonitor, promiseService, taskApiService, documentApiService, photoApiService, customerApiService, cultivarApiService, assetApiService, farmerApiService) {
            var _monitor = null;
            var _syncList = null;

            var _readOptions = {readLocal: false, readRemote: true};

            function _getTasksByType(taskType) {
                return _monitor.add(promiseService.wrap(function (promise) {
                    // Dependency wrapper
                    taskApiService.getTasksByType(taskType, _readOptions).then(function(res) {
                        for (var i = 0; i < res.length; i++) {
                            var item = res[i];

                            if (item.id !== undefined) {
                                _getTasks(item.id);
                            }
                        }

                        promise.resolve();
                    }, promise.reject);
                }));
            }

            function _getTasks(tid) {
                return _monitor.add(promiseService.wrap(function (promise) {
                    // Dependency wrapper
                    taskApiService.getTasksById(tid, _readOptions).then(function(res) {
                        for (var i = 0; i < res.length; i++) {
                            var task = res[i];
                            var did = task.data.object.id;

                            _getDocument(did, task.data.ass_by);
                        }

                        promise.resolve();
                    }, promise.reject);
                }));
            }

            function _getDocument(did, taskAssigner) {
                return _monitor.add(promiseService.wrap(function (promise) {
                    // Dependency wrapper
                    documentApiService.getDocument(did, _readOptions).then(function(res) {
                        var document = res[0];

                        _getCustomer(document.data.customerID, taskAssigner);
                        _getCustomerAssets(document.data.customerID, taskAssigner);
                        _getCultivars(document.data.crop);

                        promise.resolve();
                    }, promise.reject);
                }));
            }

            function _getCustomers() {
                return _monitor.add(promiseService.wrap(function (promise) {
                    // Dependency wrapper
                    customerApiService.getCustomers(_readOptions).then(function(res) {
                        for (var i = 0; i < res.length; i++) {
                            _getCustomerAssets(res[i].data.cid);
                            _getFarmer(res[i].data.fid);
                        }

                        promise.resolve();
                    }, promise.reject);
                }));
            }

            function _getCustomer(cid, assigner) {
                return _monitor.add(promiseService.wrap(function (promise) {
                    // Dependency wrapper
                    if(cid && _syncList.customers[cid] === undefined) {
                        _syncList.customers[cid] = true;

                        customerApiService.getCustomer(cid, assigner, _readOptions).then(function(res) {
                            _getFarmer(res[0].data.farmerID);
                            promise.resolve();
                        }, promise.reject);
                    } else {
                        promise.resolve();
                    }
                }));
            }

            function _getCustomerAssets(cid, assigner) {
                return _monitor.add(promiseService.wrap(function (promise) {
                    // Dependency wrapper
                    if (cid && _syncList.customerAssets[cid] === undefined) {
                        _syncList.customerAssets[cid] = true;

                        customerApiService.getCustomerAssets(cid, assigner, _readOptions).then(promise.resolve, promise.reject);
                    } else {
                        promise.resolve();
                    }
                }));
            }

            function _getCultivars(crop) {
                return _monitor.add(promiseService.wrap(function (promise) {
                    // Dependency wrapper
                    if (crop && _syncList.cultivars[crop] === undefined) {
                        _syncList.cultivars[crop] = true;

                        cultivarApiService.getCultivars(crop, _readOptions).then(promise.resolve, promise.reject);
                    } else {
                        promise.resolve();
                    }
                }));
            }

            function _getAsset(aid) {
                return _monitor.add(promiseService.wrap(function (promise) {
                    // Dependency wrapper
                    if (aid && _syncList.assets[aid] === undefined) {
                        _syncList.assets[aid] = true;

                        assetApiService.getAsset(aid, _readOptions).then(promise.resolve, promise.reject);
                    } else {
                        promise.resolve();
                    }
                }));
            }

            function _getFarmer(fid) {
                return _monitor.add(promiseService.wrap(function (promise) {
                    // Dependency wrapper
                    if (fid && _syncList.farmers[fid] === undefined) {
                        _syncList.farmers[fid] = true;

                        farmerApiService.getFarmer(fid, _readOptions).then(promise.resolve, promise.reject);
                    } else {
                        promise.resolve();
                    }
                }));
            }

            return function(monitor, options) {
                if (arguments.length == 1) {
                    options = monitor;
                    monitor = promiseMonitor();
                }

                _monitor = monitor;
                _syncList = {
                    customers: {},
                    customerAssets: {},
                    cultivars: {},
                    farmers: {},
                    assets: {}
                };

                return promiseService.wrapAll(function(list) {
                    if (options.tasks === true) {
                        list.push(_getTasksByType('work-package'));
                    }

                    if (options.customers === true) {
                        list.push(_getCustomers());
                    }
                });
            }
        }]);

    module.factory('dataSyncronizationService', ['promiseMonitor', 'promiseService', 'dataUploadService', 'dataDownloadService', function (promiseMonitor, promiseService, dataUploadService, dataDownloadService) {
        var _monitor = null;
        var _inProgress = false;
        
        return function (options, callback) {
            if (typeof options === 'function') {
                callback = options;
                options = {
                    customers: true,
                    tasks: true
                }
            }
            
            if (_inProgress === false) {
                _inProgress = true;

                _monitor = promiseMonitor(function (data) {
                    if (data.type === 'complete') {
                        _inProgress = false;
                    }

                    callback(data);
                });

                _monitor.add(promiseService.wrap(function(promise) {
                    dataUploadService(_monitor, options).then(function() {
                        dataDownloadService(_monitor, options).then(promise.resolve, promise.reject);
                    }, promise.reject);
                }));
            }
        }
    }]);


    /*
     * API
     */
    module.factory('userApiService', ['promiseService', 'dataStore', function(promiseService, dataStore) {
        return {
            getCompanyUsers: function(id, options, callback) {
                if (typeof options == 'function') {
                    callback = options;
                    options = {};
                } else if (arguments.length == 1) {
                    options = {};
                }

                return promiseService.wrap(function(promise) {
                    var response = callback || promise;

                    dataStore('users', {apiTemplate: 'users/:id'})
                        .transaction(function (tx) {
                            tx.read({id: id}, options, response);
                        });
                });
            }
        };
    }]);

    module.factory('taskApiService', ['promiseService', 'dataStore', function (promiseService, dataStore) {
        var taskStore = dataStore('task', {apiTemplate: 'task/:id'});

        return {
            // Tasks
            getTasksByType: function (type, options, callback) {
                if (typeof options == 'function') {
                    callback = options;
                    options = {};
                } else if (arguments.length == 1) {
                    options = {};
                }

                return promiseService.wrap(function(promise) {
                    var response = callback || promise;

                    dataStore('task', {apiTemplate: 'tasks?type=:type'})
                        .transaction(function (tx) {
                            tx.read({type: type}, options, response);
                        });
                });
            },
            getTasksById: function (tid, options, callback) {
                if (typeof options == 'function') {
                    callback = options;
                    options = {};
                } else if (arguments.length == 1) {
                    options = {};
                }

                return promiseService.wrap(function(promise) {
                    var response = callback || promise;

                    dataStore('task', {apiTemplate: 'task/:id/tasks'})
                        .transaction(function (tx) {
                            tx.read({id: tid}, options, response);
                        });
                });
            },

            // Task
            createTask: function (uriTemplate, schema, taskItem, callback) {
                return promiseService.wrap(function(promise) {
                    var response = callback || promise;

                    taskStore.transaction(function (tx) {
                        tx.make(uriTemplate, schema, taskItem, response);
                    });
                });
            },
            getTask: function (tid, options, callback) {
                return promiseService.wrap(function(promise) {
                    var response = callback || promise;

                    taskStore.transaction(function (tx) {
                        tx.read({id: tid}, options, response);
                    });
                });
            },
            findTask: function (tid, callback) {
                return promiseService.wrap(function(promise) {
                    var response = callback || promise;

                    taskStore.transaction(function (tx) {
                        tx.find(tid, response);
                    });
                });
            },
            updateTask: function (taskItem, callback) {
                return promiseService.wrap(function(promise) {
                    var response = callback || promise;

                    taskStore.transaction(function (tx) {
                        tx.update(taskItem, response);
                    });
                });
            },
            syncTask: function (taskItem, readUri, schema, writeUri, callback) {
                return promiseService.wrap(function(promise) {
                    var response = callback || promise;

                    dataStore('task', {apiTemplate: readUri})
                        .transaction(function (tx) {
                            tx.sync(taskItem, schema, writeUri, response);
                        });
                });
            }
        };
    }]);

    module.factory('documentApiService', ['promiseService', 'dataStore', function (promiseService, dataStore) {
        var documentStore = dataStore('document', {apiTemplate: 'document/:id'});

        return {
            // Document
            createDocument: function (uriTemplate, schema, documentItem, callback) {
                return promiseService.wrap(function(promise) {
                    var response = callback || promise;

                    documentStore.transaction(function (tx) {
                        tx.make(uriTemplate, schema, documentItem, response);
                    });
                });
            },
            getDocument: function (did, options, callback) {
                if (typeof options == 'function') {
                    callback = options;
                    options = {};
                } else if (arguments.length == 1) {
                    options = {};
                }

                return promiseService.wrap(function(promise) {
                    var response = callback || promise;

                    documentStore.transaction(function (tx) {
                        tx.read({id: did}, options, response);
                    });
                });
            },
            updateDocument: function (documentItem, callback) {
                return promiseService.wrap(function(promise) {
                    var response = callback || promise;

                    documentStore.transaction(function (tx) {
                        tx.update(documentItem, response);
                    });
                });
            },
            syncDocument: function (documentItem, schema, callback) {
                return promiseService.wrap(function(promise) {
                    var response = callback || promise;

                    documentStore.transaction(function (tx) {
                        tx.sync(documentItem, schema, response);
                    });
                });
            },
            getDocumentPhotos: function (did, options, callback) {
                if (typeof options == 'function') {
                    callback = options;
                    options = {};
                } else if (arguments.length == 1) {
                    options = {};
                }

                return promiseService.wrap(function(promise) {
                    var response = callback || promise;

                    dataStore('photo', {apiTemplate: 'document/:id/photo'})
                        .transaction(function (tx) {
                            tx.read({id: did}, options, response);
                        });
                });
            }
        };
    }]);

    module.factory('photoApiService', ['$http', 'promiseService', 'dataStore', 'fileStorageService', 'safeApply', function ($http, promiseService, dataStore, fileStorageService, safeApply) {
        var photoStore = dataStore('photo', {apiTemplate: 'photo/:id'});

        return {
            // Photo
            createPhoto: function (uriTemplate, schema, photoItem, callback) {
                return promiseService.wrap(function(promise) {
                    var response = callback || promise;

                    photoStore.transaction(function (tx) {
                        tx.make(uriTemplate, schema, photoItem, response);
                    });
                });
            },
            findPhoto: function (pid, callback) {
                return promiseService.wrap(function(promise) {
                    var response = callback || promise;

                    photoStore.transaction(function (tx) {
                        tx.find(pid, response);
                    });
                });
            },
            updatePhoto: function (photoItem, callback) {
                return promiseService.wrap(function(promise) {
                    var response = callback || promise;

                    photoStore.transaction(function (tx) {
                        tx.update(photoItem, response);
                    });
                });
            },
            uploadPhoto: function (photoItem) {
                return promiseService.wrap(function(promise) {
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

                                            tx.update(photoItem, promise);
                                        });
                                    }, function () {
                                        promise.reject(_errors.UploadPhotoError);
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
                            }, promise.resolve);
                        } else {
                            photoData.image = photoItem.data.image;

                            _uploadAndUpdatePhoto(photoData);
                        }
                    } else {
                        promise.resolve(photoItem);
                    }
                });
            },
            deletePhoto: function (photoItem, callback) {
                return promiseService.wrap(function(promise) {
                    var response = callback || promise;

                    photoStore.transaction(function (tx) {
                        tx.remove(photoItem, response);
                    });
                });
            }
        };
    }]);

    module.factory('customerApiService', ['promiseService', 'dataStore', function (promiseService, dataStore) {
        return {
            // Customers
            getCustomers: function (options, callback) {
                if (typeof options == 'function') {
                    callback = options;
                    options = {};
                } else if (arguments.length == 0) {
                    options = {};
                }

                return promiseService.wrap(function(promise) {
                    var response = callback || promise;

                    dataStore('customers', {apiTemplate: 'customers', indexerProperty: 'cid'})
                        .transaction(function (tx) {
                            tx.read({}, options, response);
                        });
                });
            },
            findCustomers: function (cid, callback) {
                return promiseService.wrap(function(promise) {
                    var response = callback || promise;

                    dataStore('customers', {apiTemplate: 'customers', indexerProperty: 'cid'})
                        .transaction(function (tx) {
                            tx.find(cid, response);
                        });
                });
            },

            // Customer
            getCustomer: function (cid, assigner, options, callback) {
                if (typeof options == 'function') {
                    callback = options;
                    options = {};
                } else if (arguments.length < 3) {
                    options = {};
                }

                return promiseService.wrap(function(promise) {
                    var response = callback || promise;

                    if (assigner !== undefined) {
                        dataStore('customer', {apiTemplate: 'customer/:id?user=:assigner'})
                            .transaction(function (tx) {
                                tx.read({id: cid, assigner: assigner}, options, response);
                            });
                    } else {
                        dataStore('customer', {apiTemplate: 'customer/:id'})
                            .transaction(function (tx) {
                                tx.read({id: cid}, options, response);
                            });
                    }
                });
            },
            findCustomer: function (cid, callback) {
                return promiseService.wrap(function(promise) {
                    var response = callback || promise;

                    dataStore('customer', {apiTemplate: 'customer'})
                        .transaction(function (tx) {
                            tx.find(cid, response);
                        });
                });
            },
            getCustomerAssets: function (cid, assigner, options, callback) {
                if (typeof options == 'function') {
                    callback = options;
                    options = {};
                } else if (arguments.length < 3) {
                    options = {};
                }

                return promiseService.wrap(function(promise) {
                    var response = callback || promise;

                    if (assigner !== undefined) {
                        dataStore('asset', {apiTemplate: 'customer/:id/assets?user=:assigner'})
                            .transaction(function (tx) {
                                tx.read({id: cid, assigner: assigner}, options, response);
                            });
                    } else {
                        dataStore('asset', {apiTemplate: 'customer/:id/assets'})
                            .transaction(function (tx) {
                                tx.read({id: cid}, options, response);
                            });
                    }
                });
            }
        };
    }]);

    module.factory('assetApiService', ['promiseService', 'dataStore', function (promiseService, dataStore) {
        var assetStore = dataStore('asset', {apiTemplate: 'asset/:id'});

        return {
            getAsset: function (aid, options, callback) {
                if (typeof options == 'function') {
                    callback = options;
                    options = {};
                } else if (arguments.length == 1) {
                    options = {};
                }

                return promiseService.wrap(function(promise) {
                    var response = callback || promise;

                    assetStore.transaction(function (tx) {
                        tx.read({id: aid}, options, response);
                    });
                });
            },
            findAsset: function (aid, callback) {
                return promiseService.wrap(function(promise) {
                    var response = callback || promise;

                    assetStore.transaction(function (tx) {
                        tx.find(aid, response);
                    });
                });
            },
            updateAsset: function (assetItem, callback) {
                return promiseService.wrap(function(promise) {
                    var response = callback || promise;

                    assetStore.transaction(function (tx) {
                        tx.update(assetItem, response);
                    });
                });
            },
            syncAsset: function (assetItem, readUri, schema, writeUri, callback) {
                return promiseService.wrap(function(promise) {
                    var response = callback || promise;

                    if (readUri === assetStore.config.apiTemplate) {
                        assetStore.transaction(function (tx) {
                            tx.sync(assetItem, schema, writeUri, response);
                        });
                    } else {
                        dataStore('asset', {apiTemplate: readUri})
                            .transaction(function (tx) {
                                tx.sync(assetItem, schema, writeUri, response);
                            });
                    }
                });
            }
        };
    }]);

    module.factory('cultivarApiService', ['promiseService', 'dataStore', function (promiseService, dataStore) {
        var cultivarsStore = dataStore('cultivars', {apiTemplate: 'cultivars/:crop'});

        return {
            getCultivars: function (crop, options, callback) {
                if (typeof options == 'function') {
                    callback = options;
                    options = {};
                } else if (arguments.length == 1) {
                    options = {};
                }

                return promiseService.wrap(function(promise) {
                    var response = callback || promise;

                    cultivarsStore.transaction(function (tx) {
                        tx.read({crop: crop}, options, response);
                    });
                });
            },
            searchCultivars: function (data, callback) {
                return promiseService.wrap(function(promise) {
                    var response = callback || promise;

                    cultivarsStore.transaction(function (tx) {
                        tx.search(data, response);
                    });
                });
            }
        };
    }]);

    module.factory('farmerApiService', ['promiseService', 'dataStore', function (promiseService, dataStore) {
        var farmerStore = dataStore('farmer', {apiTemplate: 'farmer/:id'});

        return {
            getFarmer: function (fid, options, callback) {
                if (typeof options == 'function') {
                    callback = options;
                    options = {};
                } else if (arguments.length == 1) {
                    options = {};
                }

                return promiseService.wrap(function(promise) {
                    var response = callback || promise;

                    farmerStore.transaction(function (tx) {
                        tx.read({id: fid}, options, response);
                    });
                });
            },
            updateFarmer: function (farmerItem, callback) {
                return promiseService.wrap(function(promise) {
                    var response = callback || promise;

                    farmerStore.transaction(function (tx) {
                        tx.update(farmerItem, response);
                    });
                });
            },
            syncFarmer: function (farmerItem, schema, callback) {
                return promiseService.wrap(function(promise) {
                    var response = callback || promise;

                    farmerStore.transaction(function (tx) {
                        tx.sync(farmerItem, schema, response);
                    });
                });
            }
        };
    }]);
});
