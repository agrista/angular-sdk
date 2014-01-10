var coreApiApp = angular.module('ag.core.api', ['ag.core.utilities', 'ag.core.data', 'ag.phone.storage']);

var _errors = {
    TypeParamRequired: {code: 'TypeParamRequired', message: 'Type parameter is required'},
    UploadPhotoError: {code: 'UploadPhotoError', message: 'Error occured uploading photo'}
};


/*
 * Syncronization
 */
coreApiApp.factory('dataUploadService', ['promiseMonitor', 'promiseService', 'taskApiService', 'documentApiService', 'photoApiService', 'customerApiService', 'assetApiService', 'farmerApiService',
    function (promiseMonitor, promiseService, taskApiService, documentApiService, photoApiService, customerApiService, assetApiService, farmerApiService) {
        var _monitor = null;
        var _promises = null;

        function _uploadParentTasksByType(taskType) {
            return _monitor.add(promiseService.wrap(function (defer) {
                // Dependency wrapper
                taskApiService.getTasksByType(taskType).then(function (res) {
                    promiseService
                        .arrayWrap(function (list) {
                            for (var i = 0; i < res.length; i++) {
                                var parentTask = res[i];

                                if (parentTask.dirty === true && parentTask.data.status == 'complete') {
                                    list.push(_uploadChildTasks(parentTask.id));
                                    list.push(_uploadRestrictedDocument(parentTask.data.object.id, parentTask.data.ass_by));
                                }
                            }

                        }).then(function () {
                            // Resolve dependency list
                            return promiseService
                                .arrayWrap(function (list) {
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
            return _promises.task[tid] || _monitor.add(promiseService.wrap(function (defer) {
                _promises.task[tid] = defer.promise;

                taskApiService.getTasksById(tid).then(function (res) {
                    promiseService
                        .arrayWrap(function (list) {
                            for (var i = 0; i < res.length; i++) {
                                var childTask = res[i].data;

                                list.push(_uploadDocument(childTask.object.id, childTask.ass_by));
                            }
                        }).then(function () {
                            // Resolve dependency list
                            return promiseService.arrayWrap(function (list) {
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
            return _promises.document[did] || _monitor.add(promiseService.wrap(function (defer) {
                _promises.document[did] = defer.promise;

                documentApiService.getDocument(did, taskAssigner).then(function (res) {
                    promiseService
                        .arrayWrap(function (list) {
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
            return _promises.document[did] || _monitor.add(promiseService.wrap(function (defer) {
                _promises.document[did] = defer.promise;

                documentApiService.getDocument(did).then(function (res) {
                    promiseService
                        .arrayWrap(function (list) {
                            for (var i = 0; i < res.length; i++) {
                                if (res[i].dirty === true) {
                                    list.push(_monitor.add(documentApiService.postDocument(res[i])));
                                }
                            }
                        }).then(function () {
                            return promiseService.arrayWrap(function (list) {
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
            return _promises.photo[did] || _monitor.add(promiseService.wrap(function (defer) {
                _promises.photo[did] = defer.promise;

                documentApiService.getDocumentPhotos(did).then(function (res) {
                    promiseService.arrayWrap(function (list) {
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
            return _promises.customer[cid] || _monitor.add(promiseService.wrap(function (defer) {
                _promises.customer[cid] = defer.promise;

                customerApiService.findCustomer(cid).then(function (res) {
                    var customer = res[0];

                    promiseService.all([
                        _uploadCustomerAssets(cid, taskAssigner),
                        _uploadFarmer(customer.data.farmerID)
                    ]).then(defer.resolve, defer.reject);
                }, defer.reject);
            }));
        }

        function _uploadCustomerAssets(cid, taskAssigner) {
            return _promises.customerAsset[cid] || _monitor.add(promiseService.wrap(function (defer) {
                _promises.customerAsset[cid] = defer.promise;

                customerApiService.getCustomerAssets(cid).then(function (res) {
                    promiseService
                        .arrayWrap(function (list) {
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
            return _promises.farmer[fid] || _monitor.add(promiseService.wrap(function (defer) {
                _promises.farmer[fid] = defer.promise;

                farmerApiService.getFarmer(fid).then(function (res) {
                    if (res.length > 0 && res[0].dirty === true) {
                        _monitor.add(farmerApiService.postFarmer(res[0])).then(defer.resolve, defer.reject);
                    } else {
                        defer.resolve();
                    }
                }, defer.reject);
            }));
        }

        return function (monitor, options) {
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

            return promiseService.arrayWrap(function (list) {
                if (options.tasks === true) {
                    list.push(_uploadParentTasksByType('work-package'));
                }
            });
        }
    }]);

coreApiApp.factory('dataDownloadService', ['promiseMonitor', 'promiseService', 'taskApiService', 'documentApiService', 'photoApiService', 'customerApiService', 'cultivarApiService', 'assetApiService', 'farmerApiService',
    function (promiseMonitor, promiseService, taskApiService, documentApiService, photoApiService, customerApiService, cultivarApiService, assetApiService, farmerApiService) {
        var _monitor = null;
        var _promises = null;

        var _readOptions = {readLocal: false, readRemote: true};

        function _getTasksByType(taskType) {
            return _monitor.add(promiseService.wrap(function (defer) {
                taskApiService.getTasksByType(taskType, _readOptions).then(function (res) {
                    promiseService.arrayWrap(function (list) {
                        for (var i = 0; i < res.length; i++) {
                            list.push(
                                _getRestrictedDocument(res[i].data.object.id, res[i].data.ass_by),
                                _getTasks(res[i].id));
                        }
                    }).then(defer.resolve, defer.reject);
                }, defer.reject);
            }));
        }

        function _getTasks(tid) {
            return _monitor.add(promiseService.wrap(function (defer) {
                taskApiService.getTasksById(tid, _readOptions).then(function (res) {
                    promiseService.arrayWrap(function (list) {
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

                documentApiService.getDocument(did, _readOptions).then(function (res) {
                    promiseService.arrayWrap(function (list) {
                        for (var i = 0; i < res.length; i++) {
                            var document = res[i].data;

                            if (document.customerID !== undefined) {
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
                customerApiService.getCustomers(_readOptions).then(function (res) {
                    return promiseService.arrayWrap(function (list) {
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

                customerApiService.getCustomer(cid, assigner, _readOptions).then(function (res) {
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

        return function (monitor, options) {
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

            return promiseService.arrayWrap(function (list) {
                if (options.tasks === true) {
                    list.push(_getTasksByType('work-package'));
                }

                if (options.customers === true) {
                    list.push(_getCustomers());
                }
            });
        }
    }]);

coreApiApp.factory('dataSyncronizationService', ['promiseMonitor', 'promiseService', 'dataUploadService', 'dataDownloadService', function (promiseMonitor, promiseService, dataUploadService, dataDownloadService) {
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

            _monitor.add(promiseService.wrap(function (promise) {
                dataUploadService(_monitor, options).then(function () {
                    return dataDownloadService(_monitor, options);
                }, promise.reject).then(promise.resolve, promise.reject);
            }));
        }
    }
}]);


/*
 * Dependency Resolving
 */
coreApiApp.factory('dataDependencyService', ['promiseService', 'taskApiService', 'documentApiService', 'customerApiService', 'cultivarApiService', 'farmerApiService',
    function (promiseService, taskApiService, documentApiService, customerApiService, cultivarApiService, farmerApiService) {

        var _getIncludedDependencies = function (include, defaults) {
            include = include || {};

            return _.defaults(include, defaults);
        };

        var _resolveTasksByType = function (type, include) {
            return promiseService.wrap(function (defer) {
                taskApiService.getTasksByType(type).then(function (res) {
                    var data = {
                        parents: res
                    };

                    if (include.children) {
                        promiseService
                            .arrayWrap(function (list) {
                                for (var i = 0; i < data.parents.length; i++) {
                                    list.push(_resolveTasksById(data.parents[i].id, include));
                                }
                            }).then(function (tasks) {
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

        var _resolveTasksById = function (id, include) {
            return promiseService.wrap(function (defer) {
                taskApiService.getTasksById(id).then(function (res) {
                    var data = {
                        children: res
                    };

                    if (include.documents || include.document) {
                        if (include.document && include.documents !== true) {
                            _resolveDocument(data.children[0].data.object.id, include).then(function (document) {
                                defer.resolve(_.extend(data, document));
                            }, defer.reject);
                        } else {
                            promiseService
                                .arrayWrap(function (list) {
                                    for (var i = 0; i < data.children.length; i++) {
                                        list.push(_resolveDocument(data.children[i].data.object.id, include));
                                    }
                                }).then(function (documents) {
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

        var _resolveDocument = function (id, include) {
            return promiseService.wrap(function (defer) {
                documentApiService.getDocument(id).then(function (res) {
                    var data = {
                        document: res[0]
                    };

                    if (include.customer || include.cultivar) {
                        data.document.dependencies = {};

                        promiseService
                            .arrayWrap(function (list) {
                                if (include.customer) {
                                    list.push(_resolveCustomer(data.document.data.customerID, include));
                                }

                                if (include.cultivar) {
                                    list.push(_resolveCultivar(data.document.data.crop, include));
                                }

                                if (include.photos) {
                                    list.push(_resolvePhotos(id, include));
                                }
                            }).then(function (res) {
                                for (var i = 0; i < res.length; i++) {
                                    _.extend(data.document.dependencies, res[i]);
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
                documentApiService.getDocumentPhotos(id).then(function (res) {
                    var data = {
                        photos: res
                    };

                    defer.resolve(data);
                }, defer.reject);
            });
        }

        function _resolveAllCustomers(include) {
            return promiseService.wrap(function (defer) {
                customerApiService.getCustomers().then(function (res) {
                    var data = {
                        customers: res
                    };

                    promiseService
                        .arrayWrap(function (list) {
                            for (var i = 0; i < data.customers.length; i++) {
                                list.push(_processCustomer(data.customers[i], include));
                            }
                        }).then(function () {
                            defer.resolve(data);
                        }, defer.reject);
                }, defer.reject);
            });
        }

        function _processCustomer(customer, include) {
            return promiseService.wrap(function (processDefer) {
                promiseService
                    .arrayWrap(function (list) {
                        if (include.assets) {
                            list.push(_resolveCustomerAssets(customer.id));
                        }

                        if (include.assets) {
                            list.push(_resolveFarmer(customer.data.fid || customer.data.farmerID));
                        }
                    }).then(function (dependencies) {
                        for (var i = 0; i < dependencies.length; i++) {
                            customer.dependencies = _.extend(customer.dependencies || {}, dependencies[i]);
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
                apiService(id).then(function (res) {
                    var data = {
                        customer: res[0]
                    };

                    _processCustomer(data.customer, include).then(function () {
                        defer.resolve(data);
                    })
                }, defer.reject);
            });
        }

        function _resolveCustomerAssets(id, include) {
            return promiseService.wrap(function (defer) {
                customerApiService.getCustomerAssets(id).then(function (res) {
                    var data = {
                        assets: res
                    };

                    defer.resolve(data);
                }, defer.reject);
            });
        }

        function _resolveFarmer(id, include) {
            return promiseService.wrap(function (defer) {
                farmerApiService.getFarmer(id).then(function (res) {
                    var data = {
                        farmer: res[0]
                    };

                    defer.resolve(data);
                }, defer.reject);
            });
        }

        function _resolveCultivar(id, include) {
            return promiseService.wrap(function (defer) {
                cultivarApiService.findCultivars(id).then(function (res) {
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
            resolveTasksByType: function (type, include) {
                return _resolveTasksByType(type, _getIncludedDependencies(include, {
                    children: true,
                    document: true,
                    cultivar: true,
                    customer: true,
                    farmer: true
                }));
            },
            resolveTasksById: function (id, include) {
                return _resolveTasksById(id, _getIncludedDependencies(include, {
                    documents: true,
                    customer: true,
                    farmer: true
                }));
            },
            resolveDocument: function (id, include) {
                return  _resolveDocument(id, _getIncludedDependencies(include, {
                    cultivar: true,
                    customer: true,
                    farmer: true,
                    photos: true
                }));
            },
            resolvePhotos: function (id, include) {
                return  _resolvePhotos(id, _getIncludedDependencies(include, {}));
            },
            resolveAllCustomers: function (include) {
                return _resolveAllCustomers(_getIncludedDependencies(include, {}));
            },
            resolveCustomersById: function (id, include) {
                return _resolveCustomer(customerApiService.findCustomers, id, _getIncludedDependencies(include, {
                    assets: true,
                    farmer: true
                }));
            },
            resolveCustomer: function (id, include) {
                return  _resolveCustomer(id, _getIncludedDependencies(include, {
                    assets: true,
                    farmer: true
                }));
            },
            resolveFarmer: function (id, include) {
                return  _resolveFarmer(id, _getIncludedDependencies(include, {}));
            },
            resolveCultivar: function (id, include) {
                return  _resolveCultivar(id, _getIncludedDependencies(include, {}));
            }
        };
    }]);


/*
 * API
 */
coreApiApp.factory('api', ['promiseService', 'dataStore', function (promiseService, dataStore) {
    return function (naming) {
        if (typeof naming === 'String') {
            naming = {
                singular: naming,
                plural: naming + 's'
            }
        } else if (naming.plural === undefined) {
            naming.plural = naming.singular + 's'
        }
        
        var _itemStore = dataStore(naming.singular, {apiTemplate: naming.singular + '/:id'});

        return {
            /**
             * @name getItems
             * @param req {Object}
             * @param req.id {Number} Optional
             * @param req.search {String} Optional
             * @param req.options {Object} Optional
             * @returns {Promise}
             */
            getItems: function (req) {
                req = req || {};

                return promiseService.wrap(function (promise) {
                    _itemStore.transaction(function (tx) {
                        if (req.search) {
                            req.options.readLocal = false;
                            req.options.readRemote = true;

                            tx.getItems({template: naming.plural + '?search=:query', schema: {query: req.search}, options: req.options, callback: promise});
                        } else if (req.id) {
                            tx.getItems({template: naming.plural + '/:id', schema: {id: req.id}, options: req.options, callback: promise});
                        } else {
                            tx.getItems({template: naming.plural, options: req.options, callback: promise});
                        }
                    });
                });
            },
            /**
             * @name createItem
             * @param req {Object}
             * @param req.template {String} Optional uri template
             * @param req.schema {Object} Optional schema for template
             * @param req.data {Object} Required document data
             * @returns {Promise}
             */
            createItem: function (req) {
                req = req || {};

                return promiseService.wrap(function (promise) {
                    _itemStore.transaction(function (tx) {
                        tx.createItems({template: req.template, schema: req.schema, data: req.data, callback: promise});
                    });
                });
            },
            /**
             * @name getItem
             * @param req {Object}
             * @param req.id {Number} Required
             * @param req.template {String} Optional uri template
             * @param req.options {Object} Optional
             * @returns {Promise}
             */
            getItem: function (req) {
                req = req || {};

                return promiseService.wrap(function (promise) {
                    _itemStore.transaction(function (tx) {
                        tx.getItems({template: req.template, schema: {id: req.id}, options: req.options, callback: promise});
                    });
                });
            },
            /**
             * @name findItem
             * @param req {Object}
             * @param req.key {String} Required
             * @param req.column {String} Optional
             * @returns {Promise}
             */
            findItem: function (req) {
                req = req || {};

                return promiseService.wrap(function (promise) {
                    _itemStore.transaction(function (tx) {
                        tx.getItems({key: req.key, column: req.column, callback: promise});
                    });
                });
            }, /**
             * @name updateItem
             * @param req {Object}
             * @param req.data {Object} Required
             * @param req.options {Object} Optional
             * @returns {Promise}
             */
            updateItem: function (req) {
                req = req || {};

                return promiseService.wrap(function (promise) {
                    _itemStore.transaction(function (tx) {
                        tx.updateItems({data: req.data, options: req.options, callback: promise});
                    });
                });
            },
            /**
             * @name postItem
             * @param req {Object}
             * @param req.template {String} Optional write uri template
             * @param req.schema {Object} Optional schema for template
             * @param req.data {Object} Required
             * @returns {Promise}
             */
            postItem: function (req) {
                req = req || {};

                return promiseService.wrap(function (promise) {
                    _itemStore.transaction(function (tx) {
                        tx.postItems({template: req.template, schema: req.schema, data: req.data, callback: promise});
                    });
                });
            },
            /**
             * @name deleteItem
             * @param req {Object}
             * @param req.data {Object} Required
             * @returns {Promise}
             */
            deleteItem: function (req) {
                req = req || {};

                return promiseService.wrap(function (promise) {
                    _itemStore.transaction(function (tx) {
                        tx.removeItems({template: naming.singular + '/:id/delete', data: req.data, callback: promise});
                    });
                });
            }
        };
    }
}]);

coreApiApp.factory('userApi', ['api', function (api) {
    var userApi = api({plural: 'users', singular: 'user'});

    return {
        getUsers: userApi.getItems,
        createUser: userApi.createItem,
        getUser: userApi.getItem,
        findUser: userApi.findItem,
        updateUser: userApi.updateItem,
        postUser: userApi.postItem,
        deleteUser: userApi.deleteItem
    };
}]);

coreApiApp.factory('teamApi', ['api', function (api) {
    var teamApi = api({plural: 'teams', singular: 'team'});

    return {
        getTeams: teamApi.getItems,
        createTeam: teamApi.createItem,
        getTeam: teamApi.getItem,
        findTeam: teamApi.findItem,
        updateTeam: teamApi.updateItem,
        postTeam: teamApi.postItem,
        deleteTeam: teamApi.deleteItem
    };
}]);

coreApiApp.factory('notificationApi', ['api', function (api) {
    var notificationApi = api({plural: 'notifications', singular: 'notification'});

    return {
        getNotifications: notificationApi.getItems,
        getNotification: notificationApi.getItem,
        deleteNotification: notificationApi.deleteItem
    };
}]);

coreApiApp.factory('taskApi', ['api', function (api) {
    var taskApi = api({plural: 'tasks', singular: 'task'});

    return {
        getTasks: taskApi.getItems,
        createTask: taskApi.createItem,
        getTask: taskApi.getItem,
        findTask: taskApi.findItem,
        updateTask: taskApi.updateItem,
        postTask: taskApi.postItem,
        deleteTask: taskApi.deleteItem
    };
}]);

coreApiApp.factory('organizationApi', ['api', function (api) {
    var organizationApi = api({plural: 'providers', singular: 'provider'});

    return {
        getOrganizations: organizationApi.getItems,
        createOrganization: organizationApi.createItem,
        getOrganization: organizationApi.getItem,
        updateOrganization: organizationApi.updateItem,
        postOrganization: organizationApi.postItem,
        deleteOrganization: organizationApi.deleteItem
    };
}]);

coreApiApp.factory('farmerApi', ['api', function (api) {
    var farmerApi = api({plural: 'farmers', singular: 'farmer'});

    return {
        getFarmers: farmerApi.getItems,
        createFarmer: farmerApi.createItem,
        getFarmer: farmerApi.getItem,
        findFarmer: farmerApi.findItem,
        updateFarmer: farmerApi.updateItem,
        postFarmer: farmerApi.postItem,
        deleteFarmer: farmerApi.deleteItem
    };
}]);

coreApiApp.factory('farmApi', ['api', function (api) {
    var farmApi = api({plural: 'farms', singular: 'farm'});

    return {
        getFarms: farmApi.getItems,
        createFarm: farmApi.createItem,
        getFarm: farmApi.getItem,
        findFarm: farmApi.findItem,
        updateFarm: farmApi.updateItem,
        postFarm: farmApi.postItem,
        deleteFarm: farmApi.deleteItem
    };
}]);

coreApiApp.factory('assetApi', ['api', function (api) {
    var assetApi = api({plural: 'assets', singular: 'asset'});

    return {
        getAssets: assetApi.getItems,
        createAsset: assetApi.createItem,
        getAsset: assetApi.getItem,
        findAsset: assetApi.findItem,
        updateAsset: assetApi.updateItem,
        postAsset: assetApi.postItem,
        deleteAsset: assetApi.deleteItem
    };
}]);


/*
 * Document Handlers
 */
coreApiApp.factory('documentHydration', ['promiseService', 'farmerApi', 'taskApi', function (promiseService, farmerApi, taskApi) {
    return {
        /**
         * @name Resolve all related dependencies to document
         * @param document
         */
        hydrate: function (document) {
            return promiseService.wrap(function (promise) {
                promiseService
                    .objectWrap(function (promises) {
                        if (document.data.farmer_id) {
                            promises.farmer = farmerApi.getFarmer({id: document.data.farmer_id});
                        }
                    })
                    .then(function (result) {
                        promise.resolve(_.extend({document: document}, result));
                    }, promise.reject);
            });
        },
        dehydrate: function (data) {
            return promiseService.wrap(function (promise) {
                promiseService
                    .arrayWrap(function (promises) {
                        if (data.farmer_id && data.farmer) {
                            promises.push(farmerApi.createFarmer({data: data.farmer}));

                            delete data.farmer;
                        }

                        if (data.tasks) {
                            angular.forEach(data.tasks, function (task) {
                                promises.push(taskApi.createTask({data: task}));
                            });

                            delete data.tasks;
                        }
                    })
                    .then(function () {
                        promise.resolve(data);
                    }, promise.reject);
            });
        }
    }
}]);

coreApiApp.factory('documentApi', ['api', 'documentHydration', function (api, documentHydration) {
    var documentStore = api({plural: 'documents', singular: 'document'}, {
        events: {
            ongetremote: documentHydration.dehydrate
        }
    });

    return {
        getDocuments: documentStore.getItems,
        createDocument: documentStore.createItem,
        getDocument: documentStore.getItem,
        findDocument: documentStore.findItem,
        updateDocument: documentStore.updateItem,
        postDocument: documentStore.postItem,
        deleteDocument: documentStore.deleteItem
    };
}]);


coreApiApp.factory('activityApi', ['api', function (api) {
    var activityApi = api({plural: 'activities', singular: 'activity'});

    return {
        getActivities: activityApi.getItems,
        createActivity: activityApi.createItem,
        getActivity: activityApi.getItem,
        deleteActivity: activityApi.deleteItem
    };
}]);

coreApiApp.factory('photoApiService', ['$http', 'promiseService', 'dataStore', 'fileStorageService', 'safeApply', function ($http, promiseService, dataStore, fileStorageService, safeApply) {
    var photoStore = dataStore('photo', {apiTemplate: 'photo/:id'});

    return {
        // Photo
        createPhoto: function (uriTemplate, schema, photoItem, callback) {
            return promiseService.wrap(function (promise) {
                var response = callback || promise;

                photoStore.transaction(function (tx) {
                    tx.createItems({template: uriTemplate, schema: schema, data: photoItem, callback: response});
                });
            });
        },
        findPhoto: function (pid, callback) {
            return promiseService.wrap(function (promise) {
                var response = callback || promise;

                photoStore.transaction(function (tx) {
                    tx.findItems({key: pid, callback: response});
                });
            });
        },
        updatePhoto: function (photoItem, callback) {
            return promiseService.wrap(function (promise) {
                var response = callback || promise;

                photoStore.transaction(function (tx) {
                    tx.updateItems({data: photoItem, callback: response});
                });
            });
        },
        postPhoto: function (photoItem) {
            return promiseService.wrap(function (promise) {
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

                                        tx.updateItems({data: photoItem, callback: promise});
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
            return promiseService.wrap(function (promise) {
                var response = callback || promise;

                photoStore.transaction(function (tx) {
                    tx.removeItems({data: photoItem, callback: response});
                });
            });
        }
    };
}]);

coreApiApp.factory('cultivarApiService', ['promiseService', 'dataStore', function (promiseService, dataStore) {
    var cultivarsStore = dataStore('cultivars', {apiTemplate: 'cultivars/:crop'});

    return {
        getCultivars: function (crop, options, callback) {
            if (typeof options == 'function') {
                callback = options;
                options = {};
            } else if (arguments.length == 1) {
                options = {};
            }

            return promiseService.wrap(function (promise) {
                var response = callback || promise;

                cultivarsStore.transaction(function (tx) {
                    tx.getItems({schema: {crop: crop}, options: options, callback: response});
                });
            });
        },
        findCultivars: function (crop, callback) {
            return promiseService.wrap(function (promise) {
                var response = callback || promise;

                cultivarsStore.transaction(function (tx) {
                    tx.findItems({key: crop, column: 'data', callback: response});
                });
            });
        }
    };
}]);
