'use strict';

define(['angular', 'underscore', 'core/utilityModule', 'core/dataModule', 'phone/storageModule'], function (angular, underscore) {
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
            var _promises = null;

            function _uploadParentTasksByType (taskType) {
                return _monitor.add(promiseService.wrap(function(defer) {
                    // Dependency wrapper
                    taskApiService.getTasksByType(taskType).then(function(res) {
                        promiseService
                            .wrapAll(function(list) {
                                for (var i = 0; i < res.length; i++) {
                                    var parentTask = res[i];

                                    if (parentTask.dirty === true && parentTask.data.status == 'complete') {
                                        list.push(_uploadChildTasks(parentTask.id));
                                        list.push(_uploadRestrictedDocument(parentTask.data.object.id, parentTask.data.ass_by));
                                    }
                                }

                            }).then(function() {
                                // Resolve dependency list
                                return promiseService
                                    .wrapAll(function(list) {
                                        for (var i = 0; i < res.length; i++) {
                                            var parentTask = res[i];

                                            if (parentTask.dirty === true) {
                                                // Always push the changes to parent task, incase the workpackage is split
                                                list.push(_monitor.add(taskApiService.postTask(parentTask, 'task/:id')));
                                            }
                                        }
                                    })
                            }, defer.reject).then(defer.resolve, defer.reject);
                    }, defer.reject);
                }));
            }

            function _uploadChildTasks(tid) {
                return _promises.task[tid] || _monitor.add(promiseService.wrap(function(defer) {
                    _promises.task[tid] = defer.promise;

                    taskApiService.getTasksById(tid).then(function(res) {
                        promiseService
                            .wrapAll(function(list) {
                                for (var i = 0; i < res.length; i++) {
                                    var childTask = res[i].data;

                                    list.push(_uploadDocument(childTask.object.id, childTask.ass_by));
                                }
                            }).then(function() {
                                // Resolve dependency list
                                return promiseService.wrapAll(function(list) {
                                    for (var i = 0; i < res.length; i++) {
                                        if (res[i].dirty === true) {
                                            list.push(_monitor.add(taskApiService.postTask(res[i], 'task/:id')));
                                        }
                                    }
                                });
                            }, defer.reject).then(defer.resolve, defer.reject);
                    }, defer.reject);
                }));
            }

            function _uploadRestrictedDocument(did, taskAssigner) {
                return _promises.document[did] || _monitor.add(promiseService.wrap(function(defer) {
                    _promises.document[did] = defer.promise;

                    documentApiService.getDocument(did, taskAssigner).then(function(res) {
                        promiseService
                            .wrapAll(function(list) {
                                for (var i = 0; i < res.length; i++) {
                                    if (res[i].dirty === true) {
                                        list.push(_monitor.add(documentApiService.postDocument(res[i])));
                                    }
                                }
                            }).then(defer.resolve, defer.reject);
                    }, defer.reject);
                }));
            }

            function _uploadDocument(did, taskAssigner) {
                return _promises.document[did] || _monitor.add(promiseService.wrap(function(defer) {
                    _promises.document[did] = defer.promise;

                    documentApiService.getDocument(did).then(function(res) {
                        promiseService
                            .wrapAll(function(list) {
                                for (var i = 0; i < res.length; i++) {
                                    if (res[i].dirty === true) {
                                        list.push(_monitor.add(documentApiService.postDocument(res[i])));
                                    }
                                }
                            }).then(function() {
                                return promiseService.wrapAll(function(list) {
                                    for (var i = 0; i < res.length; i++) {
                                        if (res[i].dirty === true) {
                                            list.push(promiseService.all([
                                                _uploadPhotos(res[i].id),
                                                _uploadCustomer(res[i].data.customerID, taskAssigner)
                                            ]));
                                        }
                                    }
                                });
                            }, defer.reject).then(defer.resolve, defer.reject);
                    }, defer.reject);
                }));
            }

            function _uploadPhotos(did) {
                return _promises.photo[did] || _monitor.add(promiseService.wrap(function(defer) {
                    _promises.photo[did] = defer.promise;

                    documentApiService.getDocumentPhotos(did).then(function(res) {
                        promiseService.wrapAll(function(list) {
                            for (var i = 0; i < res.length; i++) {
                                if (res[i].dirty === true) {
                                    list.push(_monitor.add(photoApiService.postPhoto(res[i])));
                                }
                            }
                        }).then(defer.resolve, defer.reject);
                    }, defer.reject);
                }));
            }

            function _uploadCustomer(cid, taskAssigner) {
                return _promises.customer[cid] || _monitor.add(promiseService.wrap(function(defer) {
                    _promises.customer[cid] = defer.promise;

                    customerApiService.findCustomer(cid).then(function(res) {
                        var customer = res[0];

                        promiseService.all([
                            _uploadCustomerAssets(cid, taskAssigner),
                            _uploadFarmer(customer.data.farmerID)
                        ]).then(defer.resolve, defer.reject);
                    }, defer.reject);
                }));
            }

            function _uploadCustomerAssets(cid, taskAssigner) {
                return _promises.customerAsset[cid] || _monitor.add(promiseService.wrap(function(defer) {
                    _promises.customerAsset[cid] = defer.promise;

                    customerApiService.getCustomerAssets(cid).then(function(res) {
                        promiseService
                            .wrapAll(function(list) {
                                for (var i = 0; i < res.length; i++) {
                                    if (res[i].dirty === true) {
                                        list.push(_monitor.add(assetApiService.postAsset(res[i], {assigner: taskAssigner}, 'asset/:id?user=:assigner')));
                                    }
                                }
                            }).then(defer.resolve, defer.reject);
                    }, defer.reject);
                }));
            }

            function _uploadFarmer(fid) {
                return _promises.farmer[fid] || _monitor.add(promiseService.wrap(function(defer) {
                    _promises.farmer[fid] = defer.promise;

                    farmerApiService.getFarmer(fid).then(function(res) {
                        if (res.length > 0 && res[0].dirty === true) {
                            _monitor.add(farmerApiService.postFarmer(res[0])).then(defer.resolve, defer.reject);
                        } else {
                            defer.resolve();
                        }
                    }, defer.reject);
                }));
            }

            return function(monitor, options) {
                if (arguments.length == 1) {
                    options = monitor;
                    monitor = promiseMonitor();
                }

                _monitor = monitor;
                _promises = {
                    customer: {},
                    customerAsset: {},
                    document: {},
                    farmer: {},
                    photo: {},
                    task: {}
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
            var _promises = null;

            var _readOptions = {readLocal: false, readRemote: true};

            function _getTasksByType(taskType) {
                return _monitor.add(promiseService.wrap(function (defer) {
                    taskApiService.getTasksByType(taskType, _readOptions).then(function(res) {
                        promiseService.wrapAll(function(list) {
                            for (var i = 0; i < res.length; i++) {
                                list.push(
                                    _getRestrictedDocument(res[i].data.object.id, res[i].data.ass_by),
                                    _getTasks(res[i].id));
                            }
                        }).then(defer.resolve, defer.reject);
                    }, defer.defer);
                }));
            }

            function _getTasks(tid) {
                return _monitor.add(promiseService.wrap(function (defer) {
                    taskApiService.getTasksById(tid, _readOptions).then(function(res) {
                        promiseService.wrapAll(function(list) {
                            for (var i = 0; i < res.length; i++) {
                                list.push(_getDocument(res[i].data.object.id, res[i].data.ass_by));
                            }
                        }).then(defer.resolve, defer.reject);
                    }, defer.reject);
                }));
            }

            function _getRestrictedDocument(did, taskAssigner) {
                return _promises.document[did] || _monitor.add(promiseService.wrap(function (defer) {
                    _promises.document[did] = defer.promise;

                    documentApiService.getDocument(did, taskAssigner, _readOptions).then(defer.resolve, defer.reject);
                }));
            }

            function _getDocument(did, taskAssigner) {
                return _promises.document[did] || _monitor.add(promiseService.wrap(function (defer) {
                    _promises.document[did] = defer.promise;

                    documentApiService.getDocument(did, _readOptions).then(function(res) {
                        promiseService.wrapAll(function(list) {
                            for (var i = 0; i < res.length; i++) {
                                var document = res[i].data;

                                if(document.customerID !== undefined) {
                                    list.push(
                                        _getCustomer(document.customerID, taskAssigner),
                                        _getCustomerAssets(document.customerID, taskAssigner));
                                }

                                if (document.crop !== undefined) {
                                    list.push(_getCultivars(document.crop));
                                }
                            }
                        }).then(defer.resolve, defer.reject);
                    }, defer.reject);
                }));
            }

            function _getCustomers() {
                return _monitor.add(promiseService.wrap(function (defer) {
                    customerApiService.getCustomers(_readOptions).then(function(res) {
                        return promiseService.wrapAll(function(list) {
                            for (var i = 0; i < res.length; i++) {
                                list.push(
                                    _getCustomerAssets(res[i].data.cid),
                                    _getFarmer(res[i].data.fid));
                            }
                        });
                    }, defer.reject).then(defer.resolve, defer.reject);
                }));
            }

            function _getCustomer(cid, assigner) {
                return _promises.customer[cid] || _monitor.add(promiseService.wrap(function (defer) {
                    _promises.customer[cid] = defer.promise;

                    customerApiService.getCustomer(cid, assigner, _readOptions).then(function(res) {
                        return _getFarmer(res[0].data.farmerID);
                    }, defer.reject).then(defer.resolve, defer.reject);
                }));
            }

            function _getCustomerAssets(cid, assigner) {
                return _promises.customerAsset[cid] || _monitor.add(promiseService.wrap(function (defer) {
                    _promises.customerAsset[cid] = defer.promise;

                    if (assigner !== undefined) {
                        customerApiService.getCustomerAssets(cid, assigner, _readOptions).then(defer.resolve, defer.reject);
                    } else {
                        customerApiService.getCustomerAssets(cid, _readOptions).then(defer.resolve, defer.reject);
                    }
                }));
            }

            function _getCultivars(crop) {
                return _promises.cultivar[crop] || _monitor.add(promiseService.wrap(function (defer) {
                    _promises.cultivar[crop] = defer.promise;

                    cultivarApiService.getCultivars(crop, _readOptions).then(defer.resolve, defer.reject);
                }));
            }

            function _getAsset(aid) {
                return _promises.asset[aid] || _monitor.add(promiseService.wrap(function (defer) {
                    _promises.asset[aid] = defer.promise;

                    assetApiService.getAsset(aid, _readOptions).then(defer.resolve, defer.reject);
                }));
            }

            function _getFarmer(fid) {
                return _promises.farmer[fid] || _monitor.add(promiseService.wrap(function (defer) {
                    _promises.farmer[fid] = defer.promise;

                    farmerApiService.getFarmer(fid, _readOptions).then(defer.resolve, defer.reject);
                }));
            }

            return function(monitor, options) {
                if (arguments.length == 1) {
                    options = monitor;
                    monitor = promiseMonitor();
                }

                _monitor = monitor;
                _promises = {
                    customer: {},
                    customerAsset: {},
                    document: {},
                    cultivar: {},
                    farmer: {},
                    asset: {}
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
                        return dataDownloadService(_monitor, options);
                    }, promise.reject).then(promise.resolve, promise.reject);
                }));
            }
        }
    }]);


    /*
     * Dependency Resolving
     */
    module.factory('dataDependencyService', ['promiseService', 'taskApiService', 'documentApiService', 'customerApiService', 'cultivarApiService', 'farmerApiService',
        function(promiseService, taskApiService, documentApiService, customerApiService, cultivarApiService, farmerApiService) {

            var _getIncludedDependencies = function(include, defaults) {
                include = include || {};

                return underscore.defaults(include, defaults);
            };

            var _resolveTasksByType = function(type, include) {
                return promiseService.wrap(function(defer) {
                    taskApiService.getTasksByType(type).then(function(res) {
                        var data = {
                            parents: res
                        };

                        if (include.children) {
                            promiseService
                                .wrapAll(function(list) {
                                    for (var i = 0; i < data.parents.length; i++) {
                                        list.push(_resolveTasksById(data.parents[i].id, include));
                                    }
                                }).then(function(tasks) {
                                    for (var i = 0; i < data.parents.length; i++) {
                                        data.parents[i].dependencies = tasks[i];
                                    }

                                    defer.resolve(data);
                                }, defer.reject);
                        } else {
                            defer.resolve(data);
                        }
                    }, defer.reject);
                });
            };

            var _resolveTasksById = function(id, include) {
                return promiseService.wrap(function(defer) {
                    taskApiService.getTasksById(id).then(function(res) {
                        var data = {
                            children: res
                        };

                        if (include.documents || include.document) {
                            if (include.document && include.documents !== true) {
                                _resolveDocument(data.children[0].data.object.id, include).then(function(document) {
                                    defer.resolve(underscore.extend(data, document));
                                }, defer.reject);
                            } else {
                                promiseService
                                    .wrapAll(function(list) {
                                        for (var i = 0; i < data.children.length; i++) {
                                            list.push(_resolveDocument(data.children[i].data.object.id, include));
                                        }
                                    }).then(function(documents) {
                                        for (var i = 0; i < data.children.length; i++) {
                                            data.children[i].dependencies = documents[i];
                                        }

                                        defer.resolve(data);
                                    }, defer.reject);
                            }
                        } else {
                            defer.resolve(data);
                        }
                    }, defer.reject);
                });
            };

            var _resolveDocument = function(id, include) {
                return promiseService.wrap(function(defer) {
                    documentApiService.getDocument(id).then(function(res) {
                        var data = {
                            document: res[0]
                        };

                        if (include.customer || include.cultivar) {
                            data.document.dependencies = {};

                            promiseService
                                .wrapAll(function(list) {
                                    if (include.customer) {
                                        list.push(_resolveCustomer(data.document.data.customerID, include));
                                    }

                                    if (include.cultivar) {
                                        list.push(_resolveCultivar(data.document.data.crop, include));
                                    }

                                    if (include.photos) {
                                        list.push(_resolvePhotos(id, include));
                                    }
                                }).then(function(res) {
                                    for (var i = 0; i < res.length; i++) {
                                        underscore.extend(data.document.dependencies, res[i]);
                                    }

                                    defer.resolve(data);
                                }, defer.reject);
                        } else {
                            defer.resolve(data);
                        }
                    }, defer.reject);
                });
            };

            function _resolvePhotos(id, include) {
                return promiseService.wrap(function (defer) {
                    documentApiService.getDocumentPhotos(id).then(function(res) {
                        var data = {
                            photos: res
                        };

                        defer.resolve(data);
                    }, defer.reject);
                });
            }

            function _resolveAllCustomers(include) {
                return promiseService.wrap(function (defer) {
                    customerApiService.getCustomers().then(function(res) {
                        var data = {
                            customers: res
                        };

                        promiseService
                            .wrapAll(function(list) {
                                for (var i = 0; i < data.customers.length; i++) {
                                    list.push(_processCustomer(data.customers[i], include));
                                }
                            }).then(function() {
                                defer.resolve(data);
                            }, defer.reject);
                    }, defer.reject);
                });
            }

            function _processCustomer(customer, include) {
                return promiseService.wrap(function (processDefer) {
                    promiseService
                        .wrapAll(function(list) {
                            if(include.assets) {
                                list.push(_resolveCustomerAssets(customer.id));
                            }

                            if(include.assets) {
                                list.push(_resolveFarmer(customer.data.fid || customer.data.farmerID));
                            }
                        }).then(function(dependencies) {
                            for (var i = 0; i < dependencies.length; i++) {
                                customer.dependencies = underscore.extend(customer.dependencies || {}, dependencies[i]);
                            }

                            processDefer.resolve();
                        }, processDefer.reject);
                });
            }

            function _resolveCustomer(apiService, id, include) {
                if (typeof apiService !== 'function') {
                    include = id;
                    id = apiService;
                    apiService = customerApiService.findCustomer;
                }

                return promiseService.wrap(function (defer) {
                    apiService(id).then(function(res) {
                        var data = {
                            customer: res[0]
                        };

                        _processCustomer(data.customer, include).then(function() {
                            defer.resolve(data);
                        })
                    }, defer.reject);
                });
            }

            function _resolveCustomerAssets(id, include) {
                return promiseService.wrap(function (defer) {
                    customerApiService.getCustomerAssets(id).then(function(res) {
                        var data = {
                            assets: res
                        };

                        defer.resolve(data);
                    }, defer.reject);
                });
            }

            function _resolveFarmer(id, include) {
                return promiseService.wrap(function (defer) {
                    farmerApiService.getFarmer(id).then(function(res) {
                        var data = {
                            farmer: res[0]
                        };

                        defer.resolve(data);
                    }, defer.reject);
                });
            }

            function _resolveCultivar(id, include) {
                return promiseService.wrap(function (defer) {
                    cultivarApiService.findCultivars(id).then(function(res) {
                        var data = {
                            cultivar: undefined
                        };

                        for (var i = 0; i < res.length; i++) {
                            var provider = res[i].data;

                            if (provider[crop] !== undefined) {
                                data.cultivar = provider[crop];
                                break;
                            }
                        }

                        defer.resolve(data);
                    }, defer.reject);
                });
            }

            return {
                resolveTasksByType: function(type, include) {
                    return _resolveTasksByType(type, _getIncludedDependencies(include, {
                        children: true,
                        document: true,
                        cultivar: true,
                        customer: true,
                        farmer: true
                    }));
                },
                resolveTasksById: function(id, include) {
                    return _resolveTasksById(id, _getIncludedDependencies(include, {
                        documents: true,
                        customer: true,
                        farmer: true
                    }));
                },
                resolveDocument: function(id, include) {
                    return  _resolveDocument(id, _getIncludedDependencies(include, {
                        cultivar: true,
                        customer: true,
                        farmer: true,
                        photos: true
                    }));
                },
                resolvePhotos: function(id, include) {
                    return  _resolvePhotos(id, _getIncludedDependencies(include, {}));
                },
                resolveAllCustomers: function(include) {
                    return _resolveAllCustomers(_getIncludedDependencies(include, {}));
                },
                resolveCustomersById: function(id, include) {
                    return _resolveCustomer(customerApiService.findCustomers, id, _getIncludedDependencies(include, {
                        assets: true,
                        farmer: true
                    }));
                },
                resolveCustomer: function(id, include) {
                    return  _resolveCustomer(id, _getIncludedDependencies(include, {
                        assets: true,
                        farmer: true
                    }));
                },
                resolveFarmer: function(id, include) {
                    return  _resolveFarmer(id, _getIncludedDependencies(include, {}));
                },
                resolveCultivar: function(id, include) {
                    return  _resolveCultivar(id, _getIncludedDependencies(include, {}));
                }
            };
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
                            tx.getItems({id: id}, options, response);
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
                            tx.getItems({type: type}, options, response);
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
                            tx.getItems({id: tid}, options, response);
                        });
                });
            },

            // Task
            createTask: function (uriTemplate, schema, taskItem, callback) {
                return promiseService.wrap(function(promise) {
                    var response = callback || promise;

                    taskStore.transaction(function (tx) {
                        tx.createItem(uriTemplate, schema, taskItem, response);
                    });
                });
            },
            getTask: function (tid, options, callback) {
                return promiseService.wrap(function(promise) {
                    var response = callback || promise;

                    taskStore.transaction(function (tx) {
                        tx.getItems({id: tid}, options, response);
                    });
                });
            },
            findTask: function (tid, callback) {
                return promiseService.wrap(function(promise) {
                    var response = callback || promise;

                    taskStore.transaction(function (tx) {
                        tx.findItems(tid, response);
                    });
                });
            },
            updateTask: function (taskItem, callback) {
                return promiseService.wrap(function(promise) {
                    var response = callback || promise;

                    taskStore.transaction(function (tx) {
                        tx.updateItems(taskItem, response);
                    });
                });
            },
            postTask: function (taskItem, schema, writeUri, callback) {
                if (typeof writeUri == 'function') {
                    callback = writeUri;
                    writeUri = undefined;
                } else if (typeof schema == 'string') {
                    callback = writeUri;
                    writeUri = schema;
                    schema = {};
                } else if (typeof schema == 'function') {
                    callback = schema;
                    writeUri = undefined;
                    schema = {};
                } else if (arguments.length < 2) {
                    schema = {};
                }

                return promiseService.wrap(function(promise) {
                    var response = callback || promise;

                    taskStore.transaction(function (tx) {
                        tx.postItems(taskItem, schema, writeUri, response);
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
                        tx.createItem(uriTemplate, schema, documentItem, response);
                    });
                });
            },
            getDocument: function (did, assigner, options, callback) {
                if (typeof options == 'function') {
                    callback = options;
                    options = {};
                } else if (typeof assigner == 'function') {
                    callback = assigner;
                    options = {};
                    assigner = undefined;
                } else if (typeof assigner == 'object') {
                    options = assigner;
                    assigner = undefined;
                } else if (arguments.length < 3) {
                    options = {};
                }

                return promiseService.wrap(function(promise) {
                    var response = callback || promise;

                    if (assigner !== undefined) {
                        dataStore('document', {apiTemplate: 'document/:id?user=:assigner'})
                            .transaction(function (tx) {
                                tx.getItems({id: did, assigner: assigner}, options, response);
                            });
                    } else {
                        documentStore.transaction(function (tx) {
                            tx.getItems({id: did}, options, response);
                        });
                    }
                });
            },
            updateDocument: function (documentItem, callback) {
                return promiseService.wrap(function(promise) {
                    var response = callback || promise;

                    documentStore.transaction(function (tx) {
                        tx.updateItems(documentItem, response);
                    });
                });
            },
            postDocument: function (documentItem, schema, writeUri, callback) {
                if (typeof writeUri == 'function') {
                    callback = writeUri;
                    writeUri = undefined;
                } else if (typeof schema == 'string') {
                    callback = writeUri;
                    writeUri = schema;
                    schema = {};
                } else if (typeof schema == 'function') {
                    callback = schema;
                    writeUri = undefined;
                    schema = {};
                } else if (arguments.length < 2) {
                    schema = {};
                }

                return promiseService.wrap(function(promise) {
                    var response = callback || promise;

                    documentStore.transaction(function (tx) {
                        tx.postItems(documentItem, schema, writeUri, response);
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
                            tx.getItems({id: did}, options, response);
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
                        tx.createItem(uriTemplate, schema, photoItem, response);
                    });
                });
            },
            findPhoto: function (pid, callback) {
                return promiseService.wrap(function(promise) {
                    var response = callback || promise;

                    photoStore.transaction(function (tx) {
                        tx.findItems(pid, response);
                    });
                });
            },
            updatePhoto: function (photoItem, callback) {
                return promiseService.wrap(function(promise) {
                    var response = callback || promise;

                    photoStore.transaction(function (tx) {
                        tx.updateItems(photoItem, response);
                    });
                });
            },
            postPhoto: function (photoItem) {
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

                                            tx.updateItems(photoItem, promise);
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
                        tx.removeItems(photoItem, response);
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
                            tx.getItems({}, options, response);
                        });
                });
            },
            findCustomers: function (cid, callback) {
                return promiseService.wrap(function(promise) {
                    var response = callback || promise;

                    dataStore('customers', {apiTemplate: 'customers', indexerProperty: 'cid'})
                        .transaction(function (tx) {
                            tx.findItems(cid, response);
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
                                tx.getItems({id: cid, assigner: assigner}, options, response);
                            });
                    } else {
                        dataStore('customer', {apiTemplate: 'customer/:id'})
                            .transaction(function (tx) {
                                tx.getItems({id: cid}, options, response);
                            });
                    }
                });
            },
            findCustomer: function (cid, callback) {
                return promiseService.wrap(function(promise) {
                    var response = callback || promise;

                    dataStore('customer', {apiTemplate: 'customer'})
                        .transaction(function (tx) {
                            tx.findItems(cid, response);
                        });
                });
            },
            getCustomerAssets: function (cid, assigner, options, callback) {
                if (typeof options == 'function') {
                    callback = options;
                    options = {};
                } else if(typeof assigner == 'object') {
                    callback = options;
                    options = assigner;
                    assigner = undefined;
                } else if(typeof assigner == 'function') {
                    callback = assigner;
                    options = {};
                    assigner = undefined;
                } else if (arguments.length < 3) {
                    options = {};
                }

                return promiseService.wrap(function(promise) {
                    var response = callback || promise;

                    if (assigner !== undefined) {
                        dataStore('asset', {apiTemplate: 'customer/:id/assets?user=:assigner'})
                            .transaction(function (tx) {
                                tx.getItems({id: cid, assigner: assigner}, options, response);
                            });
                    } else if (options.readRemote === true) {
                        dataStore('asset', {apiTemplate: 'customer/:id/assets'})
                            .transaction(function (tx) {
                                tx.getItems({id: cid}, options, response);
                            });
                    } else {
                        dataStore('asset', {apiTemplate: 'customer/:id/assets'})
                            .transaction(function (tx) {
                                tx.findItems(cid, 'uri', response);
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
                        tx.getItems({id: aid}, options, response);
                    });
                });
            },
            findAsset: function (aid, callback) {
                return promiseService.wrap(function(promise) {
                    var response = callback || promise;

                    assetStore.transaction(function (tx) {
                        tx.findItems(aid, response);
                    });
                });
            },
            updateAsset: function (assetItem, callback) {
                return promiseService.wrap(function(promise) {
                    var response = callback || promise;

                    assetStore.transaction(function (tx) {
                        tx.updateItems(assetItem, response);
                    });
                });
            },
            postAsset: function (assetItem, schema, writeUri, callback) {
                if (typeof writeUri == 'function') {
                    callback = writeUri;
                    writeUri = undefined;
                } else if (typeof schema == 'string') {
                    callback = writeUri;
                    writeUri = schema;
                    schema = {};
                } else if (typeof schema == 'function') {
                    callback = schema;
                    writeUri = undefined;
                    schema = {};
                } else if (arguments.length < 2) {
                    schema = {};
                }

                return promiseService.wrap(function(promise) {
                    var response = callback || promise;

                    assetStore.transaction(function (tx) {
                        tx.postItems(assetItem, schema, writeUri, response);
                    });
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
                        tx.getItems({crop: crop}, options, response);
                    });
                });
            },
            findCultivars: function (crop, callback) {
                return promiseService.wrap(function(promise) {
                    var response = callback || promise;

                    cultivarsStore.transaction(function (tx) {
                        tx.findItems(crop, 'data', response);
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
                        tx.getItems({id: fid}, options, response);
                    });
                });
            },
            updateFarmer: function (farmerItem, callback) {
                return promiseService.wrap(function(promise) {
                    var response = callback || promise;

                    farmerStore.transaction(function (tx) {
                        tx.updateItems(farmerItem, response);
                    });
                });
            },
            postFarmer: function (farmerItem, schema, writeUri, callback) {
                if (typeof writeUri == 'function') {
                    callback = writeUri;
                    writeUri = undefined;
                } else if (typeof schema == 'string') {
                    callback = writeUri;
                    writeUri = schema;
                    schema = {};
                } else if (typeof schema == 'function') {
                    callback = schema;
                    writeUri = undefined;
                    schema = {};
                } else if (arguments.length < 2) {
                    schema = {};
                }

                return promiseService.wrap(function(promise) {
                    var response = callback || promise;

                    farmerStore.transaction(function (tx) {
                        tx.postItems(farmerItem, schema, writeUri, response);
                    });
                });
            }
        };
    }]);
});
