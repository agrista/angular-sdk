var mobileSdkApiApp = angular.module('ag.mobile-sdk.api', ['ag.sdk.utilities', 'ag.sdk.monitor', 'ag.mobile-sdk.data', 'ag.mobile-sdk.cordova.storage', 'ag.sdk.library']);

var _errors = {
    TypeParamRequired: {code: 'TypeParamRequired', message: 'Type parameter is required'},
    UploadPhotoError: {code: 'UploadPhotoError', message: 'Error occured uploading photo'}
};


/*
 * Syncronization
 */
mobileSdkApiApp.factory('dataUploadService', ['$http', 'configuration', 'promiseMonitor', 'promiseService', 'farmerApi', 'farmApi', 'fileStorageService', 'assetApi', 'documentApi', 'taskApi', 'enterpriseBudgetApi', 'legalEntityApi', 'underscore',
    function ($http, configuration, promiseMonitor, promiseService, farmerApi, farmApi, fileStorageService, assetApi, documentApi, taskApi, enterpriseBudgetApi, legalEntityApi, underscore) {
        var _monitor = null;

        function _getFarmers () {
            return _monitor.add(promiseService.wrap(function (defer) {
                farmerApi.getFarmers().then(function (farmers) {
                    promiseService
                        .arrayWrap(function (list) {
                            angular.forEach(farmers, function (farmer) {
                                list.push(promiseService.wrap(function(promise) {
                                    _postFarmer(farmer).then(function () {
                                        promiseService
                                            .all([_postFarms(farmer.id), _postLegalEntities(farmer.id)])
                                            .then(promise.resolve, promise.reject);
                                    });
                                }));
                            });
                        })
                        .then(defer.resolve, defer.reject);
                });
            }));
        }

        function _getDocuments () {
            return _monitor.add(promiseService.wrap(function (defer) {
                documentApi.getDocuments().then(function (documents) {
                    promiseService
                        .arrayWrap(function (list) {
                            angular.forEach(documents, function (document) {
                                list.push(_postDocument(document));
                            });
                        })
                        .then(defer.resolve, defer.reject);
                });
            }));
        }

        function _getTasks () {
            return _monitor.add(promiseService.wrap(function (defer) {
                taskApi.getTasks().then(function (tasks) {
                    promiseService
                        .arrayWrap(function (list) {
                            angular.forEach(tasks, function (task) {
                                list.push(promiseService.wrap(function(promise) {
                                    taskApi.getTasks({template: 'tasks/:id', schema: {id: task.id}}).then(function (subtasks) {
                                        promiseService
                                            .arrayWrap(function (promises) {
                                                angular.forEach(subtasks, function (subtask) {
                                                    promises.push(_postTask(subtask));
                                                });
                                            })
                                            .then(function () {
                                                return _postTask(task);
                                            }, promise.reject)
                                            .then(promise.resolve, promise.reject);
                                    }, promise.reject);
                                }));
                            });
                        })
                        .then(defer.resolve, defer.reject);
                });
            }));
        }

        function _getEnterpriseBudgets () {
            return _monitor.add(promiseService.wrap(function (defer) {
                enterpriseBudgetApi.getEnterpriseBudgets().then(function (budgets) {
                    promiseService
                        .arrayWrap(function (list) {
                            angular.forEach(budgets, function (budget) {
                                list.push(_postEnterpriseBudget(budget));
                            });
                        })
                        .then(defer.resolve, defer.reject);
                });
            }));
        }

        function _postFarmer (farmer) {
            return _monitor.add(promiseService.wrap(function (defer) {
                if (farmer.__dirty === true) {
                    farmerApi.postFarmer({data: farmer}).then(defer.resolve, defer.reject);
                } else {
                    defer.resolve();
                }
            }));
        }

        function _postFarms (fid) {
            return _monitor.add(promiseService.wrap(function (defer) {
                farmApi.getFarms({id: fid}).then(function (farms) {
                    promiseService
                        .arrayWrap(function (list) {
                            angular.forEach(farms, function (farm) {
                                if (farm.__dirty === true) {
                                    list.push(farmApi.postFarm({data: farm}));
                                }

                            });
                        })
                        .then(defer.resolve, defer.reject);
                });
            }));
        }

        function _postLegalEntities (fid) {
            return _monitor.add(promiseService.wrap(function (defer) {
                legalEntityApi.getEntities({id: fid}).then(function (entities) {
                    promiseService
                        .arrayWrap(function (list) {
                            angular.forEach(entities, function (entity) {
                                if (entity.__dirty === true) {
                                    list.push(legalEntityApi.postEntity({data: entity}));
                                }

                                list.push(_postAssets(entity.id));
                            });
                        })
                        .then(defer.resolve, defer.reject);
                });
            }));
        }

        function _postAssets (eid) {
            return _monitor.add(promiseService.wrap(function (defer) {
                assetApi.getAssets({id: eid}).then(function (assets) {
                    promiseService
                        .arrayWrap(function (list) {
                            angular.forEach(assets, function (asset) {
                                list.push(_postAsset(asset));
                            });
                        })
                        .then(defer.resolve, defer.reject);
                });
            }));
        }

        function _postAsset (asset) {
            return _monitor.add(promiseService.wrap(function (defer) {
                if (asset.__dirty === true) {
                    var cachedAttachments = angular.copy(asset.data.attachments);
                    asset.data.attachments = underscore.filter(asset.data.attachments, function (attachment) {
                        return attachment.local !== true;
                    });

                    assetApi.postAsset({data: asset})
                        .then(function (res) {
                            if (res && res.length == 1) {
                                asset.data.attachments = cachedAttachments;

                                _postAttachments('asset', res[0].id, asset).then(defer.resolve, defer.reject);
                            } else {
                                defer.resolve();
                            }
                        }, defer.reject);
                } else {
                    defer.resolve();
                }
            }));
        }

        function _postDocument (document) {
            return _monitor.add(promiseService.wrap(function (defer) {
                if (document.__dirty === true) {
                    var cachedAttachments = angular.copy(document.data.attachments);
                    document.data.attachments = underscore.reject(document.data.attachments, function (attachment) {
                        return attachment.local === true;
                    });

                    documentApi.postDocument({data: document})
                        .then(function (res) {
                            if (res && res.length == 1) {
                                document.data.attachments = cachedAttachments;

                                _postAttachments('document', res[0].id, document).then(defer.resolve, defer.reject);
                            } else {
                                defer.resolve();
                            }
                        }, defer.reject)
                } else {
                    defer.resolve();
                }
            }));
        }

        function _postAttachments (type, id, obj) {
            var promiseChain = null;

            return _monitor.add(promiseService.wrap(function (promise) {
                angular.forEach(obj.data.attachments, function (attachment) {
                    if (attachment.local === true) {
                        if (promiseChain) {
                            promiseChain.then(function () {
                                return _postAttachment(type, id, attachment);
                            }, promise.reject);
                        } else {
                            promiseChain = _postAttachment(type, id, attachment);
                        }
                    }
                });

                if (promiseChain) {
                    promiseChain.then(promise.resolve, promise.reject);
                } else {
                    promise.resolve();
                }
            }));
        }

        function _postAttachment (type, id, attachment) {
            return promiseService.wrap(function (promise) {
                var uri = 'api/' + type + '/' + id + '/attach';

                fileStorageService.read(attachment.src, true)
                    .then(function (fileData) {
                        $http.post(configuration.getServer() + uri, {
                            archive: underscore.extend(underscore.omit(attachment, ['src', 'local', 'key']), {
                                filename: fileData.file,
                                content: fileData.content.substring(fileData.content.indexOf(',') + 1)
                            })
                        }, {withCredentials: true}).then(promise.resolve, promise.reject);
                    }, promise.reject);
            });
        }

        function _postTask (task) {
            return _monitor.add(promiseService.wrap(function (defer) {
                if (task.__dirty === true) {
                    taskApi.postTask({template: 'task/:id', schema: {id: task.id}, data: task}).then(defer.resolve, defer.reject);
                } else {
                    defer.resolve();
                }
            }));
        }

        function _postEnterpriseBudget (budget) {
            return _monitor.add(promiseService.wrap(function (defer) {
                if (budget.__dirty === true) {
                    enterpriseBudgetApi.postEnterpriseBudget({data: budget}).then(defer.resolve, defer.reject);
                } else {
                    defer.resolve();
                }
            }));
        }

        return function (monitor) {
            _monitor = monitor || promiseMonitor();

            return promiseService.wrap(function(promise) {
                _getFarmers()
                    .then(_getDocuments, promise.reject)
                    .then(_getTasks, promise.reject)
                    .then(_getEnterpriseBudgets, promise.reject)
                    .then(promise.resolve, promise.reject);
            });
        }
    }]);

mobileSdkApiApp.factory('dataDownloadService', ['promiseMonitor', 'promiseService', 'farmApi', 'assetUtility', 'farmerUtility', 'documentUtility', 'taskUtility', 'enterpriseBudgetApi',
    function (promiseMonitor, promiseService, farmApi, assetUtility, farmerUtility, documentUtility, taskUtility, enterpriseBudgetApi) {
        var _monitor = null;
        var _readOptions = {readLocal: false, readRemote: true};

        function _getFarmers() {
            return _monitor.add(promiseService.wrap(function (defer) {
                farmerUtility.api
                    .getFarmers({options: _readOptions})
                    .then(function (farmers) {
                        return promiseService.arrayWrap(function (list) {
                            angular.forEach(farmers, function (farmer) {
                                list.push(farmerUtility.hydration.dehydrate(farmer));
                            });
                        });
                    }, defer.reject)
                    .then(defer.resolve, defer.reject);
            }));
        }

        function _getDocuments() {
            return _monitor.add(promiseService.wrap(function (defer) {
                documentUtility.api
                    .getDocuments({options: _readOptions})
                    .then(function (documents) {
                        return promiseService.arrayWrap(function (promises) {
                            angular.forEach(documents, function (document) {
                                promises.push(documentUtility.hydration.dehydrate(document));
                            })
                        });
                    }, defer.reject)
                    .then(defer.resolve, defer.reject);
            }));
        }

        function _getTasks() {
            return _monitor.add(promiseService.wrap(function (defer) {
                taskUtility.api
                    .getTasks({options: _readOptions})
                    .then(function (tasks) {
                        return promiseService.arrayWrap(function (promises) {
                            angular.forEach(tasks, function (task) {
                                promises.push(taskUtility.hydration.dehydrate(task));
                            })
                        });
                    }, defer.reject)
                    .then(defer.resolve, defer.reject);
            }));
        }

        function _getEnterpriseBudgets() {
            return _monitor.add(enterpriseBudgetApi.getEnterpriseBudgets({options: _readOptions}));
        }

        return function (monitor) {
            _monitor = monitor || promiseMonitor();

            return promiseService.wrap(function(promise) {
                _getFarmers()
                    .then(_getDocuments, promise.reject)
                    .then(_getTasks, promise.reject)
                    .then(_getEnterpriseBudgets, promise.reject)
                    .then(promise.resolve, promise.reject);
            });
        };
    }]);

mobileSdkApiApp.factory('dataSyncService', ['promiseMonitor', 'promiseService', 'dataUploadService', 'dataDownloadService', function (promiseMonitor, promiseService, dataUploadService, dataDownloadService) {
    var _monitor = null;

    return function (callback) {
        _monitor = promiseMonitor(callback);

        _monitor.add(promiseService.wrap(function (promise) {
            dataUploadService(_monitor).then(function () {
                dataDownloadService(_monitor).then(promise.resolve, promise.reject);
            }, promise.reject);
        }));
    };
}]);

/*
 * API
 */
mobileSdkApiApp.factory('api', ['promiseService', 'dataStore', 'underscore', function (promiseService, dataStore, underscore) {
    return function (options) {
        if (typeof options === 'String') {
            options = {
                singular: options,
                plural: options + 's'
            }
        }

        if (options.plural === undefined) {
            options.plural = options.singular + 's'
        }
        
        var _itemStore = dataStore(options.singular, {apiTemplate: options.singular + '/:id'});
        
        var _stripProperties = function (data) {
            if (options.strip) {
                return underscore.omit(data, options.strip);
            }

            return data;
        };

        return {
            /**
             * @name getItems
             * @param req {Object}
             * @param req.template {String} Optional uri template
             * @param req.schema {Object} Optional schema for template
             * @param req.search {String} Optional
             * @param req.id {Number} Optional
             * @param req.options {Object} Optional
             * @returns {Promise}
             */
            getItems: function (req) {
                req = req || {};

                return promiseService.wrap(function (promise) {
                    _itemStore.transaction(function (tx) {
                        if (req.template) {
                            tx.getItems({template: req.template, schema: req.schema, options: req.options, callback: promise});
                        } else if (req.search) {
                            req.options.readLocal = false;
                            req.options.readRemote = true;

                            tx.getItems({template: options.plural + '?search=:query', schema: {query: req.search}, options: req.options, callback: promise});
                        } else if (req.id) {
                            tx.getItems({template: options.plural + '/:id', schema: {id: req.id}, options: req.options, callback: promise});
                        } else {
                            tx.getItems({template: options.plural, options: req.options, callback: promise});
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
             * @param req.options {Object} Optional
             * @returns {Promise}
             */
            createItem: function (req) {
                req = req || {};

                return promiseService.wrap(function (promise) {
                    if (req.data) {
                        _itemStore.transaction(function (tx) {
                            tx.createItems({template: req.template, schema: req.schema, data: _stripProperties(req.data), options: req.options, callback: promise});
                        });
                    } else {
                        promise.resolve();
                    }
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
                    if (req.id) {
                        _itemStore.transaction(function (tx) {
                            tx.getItems({template: req.template, schema: {id: req.id}, options: req.options, callback: promise});
                        });
                    } else {
                        promise.resolve();
                    }
                });
            },
            /**
             * @name findItem
             * @param req {Object}
             * @param req.key {String} Required
             * @param req.column {String} Optional
             * @param req.options {Object} Optional
             * @param req.options.like {boolean} Optional to use a fuzzy search
             * @param req.options.one {boolean} Optional to return one result
             * @returns {Promise}
             */
            findItem: function (req) {
                req = req || {};

                return promiseService.wrap(function (promise) {
                    if (req.key) {
                        _itemStore.transaction(function (tx) {
                            tx.findItems({key: req.key, column: req.column, options: req.options, callback: promise});
                        });
                    } else {
                        promise.resolve();
                    }
                });
            },
            /**
             * @name updateItem
             * @param req {Object}
             * @param req.data {Object} Required
             * @param req.options {Object} Optional
             * @returns {Promise}
             */
            updateItem: function (req) {
                req = req || {};

                return promiseService.wrap(function (promise) {
                    if (req.data) {
                        _itemStore.transaction(function (tx) {
                            tx.updateItems({data: _stripProperties(req.data), options: req.options, callback: promise});
                        });
                    } else {
                        promise.resolve();
                    }
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
                    if (req.data) {
                        _itemStore.transaction(function (tx) {
                            tx.postItems({template: req.template, schema: req.schema, data: _stripProperties(req.data), callback: promise});
                        });
                    } else {
                        promise.resolve();
                    }
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
                    if (req.data) {
                        _itemStore.transaction(function (tx) {
                            tx.removeItems({template: options.singular + '/:id/delete', data: req.data, callback: promise});
                        });
                    } else {
                        promise.resolve();
                    }
                });
            },
            /**
             * @name purgeItem
             * @param req {Object}
             * @param req.template {String} Required template
             * @param req.schema {Object} Optional schema
             * @returns {Promise}
             */
            purgeItem: function (req) {
                req = req || {};

                return promiseService.wrap(function (promise) {
                    if (req.template) {
                        _itemStore.transaction(function (tx) {
                            tx.purgeItems({template: req.template, schema: req.schema, callback: promise});
                        });
                    } else {
                        promise.resolve();
                    }
                });
            }
        };
    }
}]);

mobileSdkApiApp.factory('userApi', ['api', function (api) {
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

mobileSdkApiApp.factory('teamApi', ['api', function (api) {
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

mobileSdkApiApp.factory('notificationApi', ['api', function (api) {
    var notificationApi = api({plural: 'notifications', singular: 'notification'});

    return {
        getNotifications: notificationApi.getItems,
        getNotification: notificationApi.getItem,
        deleteNotification: notificationApi.deleteItem
    };
}]);

mobileSdkApiApp.factory('taskApi', ['api', function (api) {
    var taskApi = api({plural: 'tasks', singular: 'task', strip: ['document', 'organization', 'subtasks']});

    return {
        getTasks: taskApi.getItems,
        createTask: taskApi.createItem,
        getTask: taskApi.getItem,
        findTask: taskApi.findItem,
        updateTask: taskApi.updateItem,
        postTask: taskApi.postItem,
        deleteTask: taskApi.deleteItem,
        purgeTask: taskApi.purgeItem
    };
}]);

mobileSdkApiApp.factory('merchantApi', ['api', function (api) {
    var merchantApi = api({plural: 'merchants', singular: 'merchant'});

    return {
        getMerchants: merchantApi.getItems,
        createMerchant: merchantApi.createItem,
        getMerchant: merchantApi.getItem,
        updateMerchant: merchantApi.updateItem,
        postMerchant: merchantApi.postItem,
        deleteMerchant: merchantApi.deleteItem
    };
}]);

mobileSdkApiApp.factory('farmerApi', ['api', function (api) {
    var farmerApi = api({plural: 'farmers', singular: 'farmer', strip: ['assets', 'farms', 'legalEntities']});

    return {
        getFarmers: farmerApi.getItems,
        createFarmer: farmerApi.createItem,
        getFarmer: farmerApi.getItem,
        findFarmer: farmerApi.findItem,
        updateFarmer: farmerApi.updateItem,
        postFarmer: farmerApi.postItem,
        deleteFarmer: farmerApi.deleteItem,
        purgeFarmer: farmerApi.purgeItem
    };
}]);

mobileSdkApiApp.factory('legalEntityApi', ['api', function (api) {
    var entityApi = api({plural: 'legalentities', singular: 'legalentity', strip: ['assets']});

    return {
        getEntities: entityApi.getItems,
        createEntity: entityApi.createItem,
        getEntity: entityApi.getItem,
        findEntity: entityApi.findItem,
        updateEntity: entityApi.updateItem,
        postEntity: entityApi.postItem,
        deleteEntity: entityApi.deleteItem,
        purgeEntity: entityApi.purgeItem
    };
}]);

mobileSdkApiApp.factory('farmApi', ['api', function (api) {
    var farmApi = api({plural: 'farms', singular: 'farm'});

    return {
        getFarms: farmApi.getItems,
        createFarm: farmApi.createItem,
        getFarm: farmApi.getItem,
        findFarm: farmApi.findItem,
        updateFarm: farmApi.updateItem,
        postFarm: farmApi.postItem,
        deleteFarm: farmApi.deleteItem,
        purgeFarm: farmApi.purgeItem
    };
}]);

mobileSdkApiApp.factory('assetApi', ['api', function (api) {
    var assetApi = api({plural: 'assets', singular: 'asset', strip: ['farm', 'legalEntity']});

    return {
        getAssets: assetApi.getItems,
        createAsset: assetApi.createItem,
        getAsset: assetApi.getItem,
        findAsset: assetApi.findItem,
        updateAsset: assetApi.updateItem,
        postAsset: assetApi.postItem,
        deleteAsset: assetApi.deleteItem,
        purgeAsset: assetApi.purgeItem
    };
}]);

mobileSdkApiApp.factory('documentApi', ['api', function (api) {
    var documentStore = api({plural: 'documents', singular: 'document', strip: ['organization', 'tasks']});

    return {
        getDocuments: documentStore.getItems,
        createDocument: documentStore.createItem,
        getDocument: documentStore.getItem,
        findDocument: documentStore.findItem,
        updateDocument: documentStore.updateItem,
        postDocument: documentStore.postItem,
        deleteDocument: documentStore.deleteItem,
        purgeDocument: documentStore.purgeItem
    };
}]);

mobileSdkApiApp.factory('activityApi', ['api', function (api) {
    var activityApi = api({plural: 'activities', singular: 'activity'});

    return {
        getActivities: activityApi.getItems,
        createActivity: activityApi.createItem,
        getActivity: activityApi.getItem,
        deleteActivity: activityApi.deleteItem
    };
}]);

mobileSdkApiApp.factory('enterpriseBudgetApi', ['api', function (api) {
    var farmApi = api({plural: 'budgets', singular: 'budget'});

    return {
        getEnterpriseBudgets: farmApi.getItems,
        createEnterpriseBudget: farmApi.createItem,
        getEnterpriseBudget: farmApi.getItem,
        findEnterpriseBudget: farmApi.findItem,
        updateEnterpriseBudget: farmApi.updateItem,
        postEnterpriseBudget: farmApi.postItem,
        deleteEnterpriseBudget: farmApi.deleteItem,
        purgeEnterpriseBudget: farmApi.purgeItem
    };
}]);

mobileSdkApiApp.factory('pipGeoApi', ['$http', 'promiseService', 'configuration', function ($http, promiseService, configuration) {
    var _host = configuration.getServer();

    return {
        getFieldPolygon: function (lng, lat) {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/geo/field-polygon?x=' + lng + '&y=' + lat, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getPortionPolygon: function (lng, lat) {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/geo/portion-polygon?x=' + lng + '&y=' + lat, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getDistrictPolygon: function (lng, lat) {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/geo/district-polygon?x=' + lng + '&y=' + lat, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getProvincePolygon: function (lng, lat) {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/geo/province-polygon?x=' + lng + '&y=' + lat, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    }
}]);

/*
 * Handlers
 */
mobileSdkApiApp.factory('hydration', ['promiseService', 'taskApi', 'farmerApi', 'farmApi', 'assetApi', 'documentApi', 'legalEntityApi', 'underscore',
    function (promiseService, taskApi, farmerApi, farmApi, assetApi, documentApi, legalEntityApi, underscore) {
        // TODO: Allow for tree of hydrations/dehydrations (e.g. Farmer -> LegalEntities -> Assets)

        var _relationTable = {
            organization: {
                hydrate: function (obj, type) {
                    return promiseService.wrap(function (promise) {
                        farmerApi.findFarmer({key: obj.organizationId, options: {one: true}}).then(function (farmer) {
                            promiseService.all({
                                farms: _relationTable.farms.hydrate(farmer, type),
                                legalEntities: _relationTable.legalEntities.hydrate(farmer, type)
                            }).then(function (results) {
                                promise.resolve(underscore.extend(farmer, results));
                            }, promise.reject);
                        }, promise.reject);
                    });
                },
                dehydrate: function (obj, type) {
                    obj.organization.id = obj.organization.id || obj.organizationId;

                    return farmerApi.createFarmer({template: 'farmers', data: obj.organization, options: {replace: false, dirty: false}});
                }
            },
            farms: {
                hydrate: function (obj, type) {
                    return farmApi.getFarms({id: obj.__id});
                },
                dehydrate: function (obj, type) {
                    var objId = (obj.__id !== undefined ? obj.__id : obj.id);

                    return promiseService.wrap(function (promise) {
                        farmApi.purgeFarm({template: 'farms/:id', schema: {id: objId}, options: {force: false}})
                            .then(function () {
                                promiseService.arrayWrap(function (promises) {
                                    angular.forEach(obj.farms, function (farm) {
                                        promises.push(farmApi.createFarm({template: 'farms/:id', schema: {id: objId}, data: farm, options: {replace: false, dirty: false}}));
                                    });
                                }).then(promise.resolve, promise.reject);
                            }, promise.reject);
                    });
                }
            },
            farm: {
                hydrate: function (obj, type) {
                    return farmApi.findFarm({key: obj.farmId, options: {one: true}});
                }
            },
            assets: {
                hydrate: function (obj, type) {
                    return assetApi.getAssets({id: obj.__id});
                },
                dehydrate: function (obj, type) {
                    var objId = (obj.__id !== undefined ? obj.__id : obj.id);

                    return promiseService.wrap(function (promise) {
                        assetApi.purgeAsset({template: 'assets/:id', schema: {id: objId}, options: {force: false}})
                            .then(function () {
                                promiseService.arrayWrap(function (promises) {
                                    angular.forEach(obj.assets, function (asset) {
                                        promises.push(assetApi.createAsset({template: 'assets/:id', schema: {id: objId}, data: asset, options: {replace: false, dirty: false}}));
                                    });
                                }).then(promise.resolve, promise.reject);
                            }, promise.reject);
                    });
                }
            },
            legalEntities: {
                hydrate: function (obj, type) {
                    return promiseService.wrap(function (promise) {
                        legalEntityApi.getEntities({id: obj.__id})
                            .then(function (entities) {
                                return promiseService.arrayWrap(function (promises) {
                                    angular.forEach(entities, function (entity) {
                                        promises.push(_relationTable.assets.hydrate(entity, type)
                                            .then(function (assets) {
                                                entity.assets = assets;
                                                return entity;
                                            }, promise.reject));
                                    });
                                });
                            }, promise.reject).then(promise.resolve, promise.reject);
                    });
                },
                dehydrate: function (obj, type) {
                    var objId = (obj.__id !== undefined ? obj.__id : obj.id);

                    return promiseService.wrap(function (promise) {
                        legalEntityApi.purgeEntity({template: 'legalentities/:id', schema: {id: objId}, options: {force: false}})
                            .then(function () {
                                promiseService.arrayWrap(function (promises) {
                                    angular.forEach(obj.legalEntities, function (entity) {
                                        promises.push(legalEntityApi.createEntity({template: 'legalentities/:id', schema: {id: objId}, data: entity, options: {replace: false, dirty: false}}));
                                        promises.push(_relationTable.assets.dehydrate(entity, type));
                                    });
                                }).then(promise.resolve, promise.reject);
                            }, promise.reject);
                    });
                }
            },
            legalEntity: {
                hydrate: function (obj, type) {
                    return promiseService.wrap(function (promise) {
                        legalEntityApi.findEntity({key: obj.legalEntityId, options: {one: true}})
                            .then(function (entity) {
                                return _relationTable.assets.hydrate(entity, type)
                                    .then(function (assets) {
                                        entity.assets = assets;
                                        return entity;
                                    }, promise.reject);
                            })
                            .then(promise.resolve, promise.reject);
                    });
                }
            },
            document: {
                hydrate: function (obj, type) {
                    return documentApi.findDocument({key: obj.documentId, options: {one: true}});
                },
                dehydrate: function (obj, type) {
                    return documentApi.createDocument({template: 'documents', data: obj.document, options: {replace: false, dirty: false}});
                }
            },
            subtasks: {
                hydrate: function (obj, type) {
                    return taskApi.getTasks({template: 'tasks/:id', schema: {id: obj.__id}});
                },
                dehydrate: function (obj, type) {
                    var objId = (obj.__id !== undefined ? obj.__id : obj.id);

                    return promiseService.wrap(function (promise) {
                        taskApi.purgeTask({template: 'tasks/:id', schema: {id: objId}, options: {force: false}})
                            .then(function () {
                                promiseService.arrayWrap(function (promises) {
                                    angular.forEach(obj.subtasks, function (subtask) {
                                        promises.push(taskApi.createTask({template: 'tasks/:id', schema: {id: objId}, data: subtask, options: {replace: false, dirty: false}}));
                                    });
                                }).then(promise.resolve, promise.reject);
                            }, promise.reject);
                    });
                }
            }
        };

        var _hydrate = function (obj, type, relations) {
            relations = relations || [];

            return promiseService.wrap(function (promise) {
                promiseService
                    .objectWrap(function (promises) {
                        angular.forEach(relations, function (relationName) {
                            var relation = _relationTable[relationName];

                            if (relation && relation.hydrate) {
                                promises[relationName] = relation.hydrate(obj, type);
                            }
                        });
                    })
                    .then(function (results) {
                        promise.resolve(underscore.extend(obj, results));
                    }, function (results) {
                        promise.resolve(underscore.extend(obj, results));
                    });
            });
        };

        var _dehydrate = function (obj, type, relations) {
            relations = relations || [];

            return promiseService.wrap(function (promise) {
                promiseService
                    .objectWrap(function (promises) {
                        angular.forEach(relations, function (relationName) {
                            var relation = _relationTable[relationName];

                            if (relation && relation.dehydrate) {
                                promises[relationName] = relation.dehydrate(obj, type);
                            }
                        });
                    })
                    .then(function () {
                        angular.forEach(relations, function (relationName) {
                            delete obj[relationName];
                        });

                        promise.resolve(obj);
                    }, function () {
                        promise.reject();
                    });
            });
        };

        return {
            hydrate: _hydrate,
            dehydrate: _dehydrate
        }
    }]);

mobileSdkApiApp.factory('taskUtility', ['promiseService', 'hydration', 'taskApi', function (promiseService, hydration, taskApi) {
    var _relations = ['organization', 'document', 'subtasks'];

    return {
        hydration: {
            hydrate: function (taskOrId, relations) {
                relations = relations || _relations;

                return promiseService.wrap(function (promise) {
                    if (typeof taskOrId !== 'object') {
                        taskApi.findTask({key: taskOrId, options: {one: true}}).then(function (task) {
                            hydration.hydrate(task, 'task', relations).then(promise.resolve, promise.reject);
                        }, promise.reject);
                    } else {
                        hydration.hydrate(taskOrId, 'task', relations).then(promise.resolve, promise.reject);
                    }
                });
            },
            dehydrate: function (task, relations) {
                relations = relations || _relations;

                return hydration.dehydrate(task, 'task', relations).then(function (task) {
                    taskApi.updateTask({data: task, options: {dirty: false}});
                })
            }
        },
        api: taskApi
    };
}]);

mobileSdkApiApp.factory('farmerUtility', ['promiseService', 'hydration', 'farmerApi', function (promiseService, hydration, farmerApi) {
    var _relations = ['farms', 'legalEntities'];

    return {
        hydration: {
            hydrate: function (farmerOrId, relations) {
                relations = relations || _relations;

                return promiseService.wrap(function (promise) {
                    if (typeof farmerOrId !== 'object') {
                        farmerApi.findFarmer({key: farmerOrId, options: {one: true}}).then(function (farmer) {
                            hydration.hydrate(farmer, 'farmer', relations).then(promise.resolve, promise.reject);
                        }, promise.reject);
                    } else {
                        hydration.hydrate(farmerOrId, 'farmer', relations).then(promise.resolve, promise.reject);
                    }
                });
            },
            dehydrate: function (farmer, relations) {
                relations = relations || _relations;

                angular.forEach(farmer.teams, function (team, i) {
                    if (typeof team === 'object') {
                        farmer.teams[i] = team.name;
                    }
                });

                return hydration.dehydrate(farmer, 'farmer', relations).then(function (farmer) {
                    farmerApi.updateFarmer({data: farmer, options: {dirty: false}});
                })
            }
        },
        api: farmerApi
    };
}]);

mobileSdkApiApp.factory('assetUtility', ['promiseService', 'hydration', 'assetApi', function (promiseService, hydration, assetApi) {
    var _relations = ['farm', 'legalEntity'];

    return {
        hydration: {
            hydrate: function (assetOrId, relations) {
                relations = relations || _relations;

                return promiseService.wrap(function (promise) {
                    if (typeof assetOrId !== 'object') {
                        assetApi.findAsset({key: assetOrId, options: {one: true}}).then(function (asset) {
                            hydration.hydrate(asset, 'asset', relations).then(promise.resolve, promise.reject);
                        }, promise.reject);
                    } else {
                        hydration.hydrate(assetOrId, 'asset', relations).then(promise.resolve, promise.reject);
                    }
                });
            },
            dehydrate: function (asset, relations) {
                relations = relations || _relations;

                return hydration.dehydrate(asset, 'asset', relations).then(function (asset) {
                    assetApi.updateAsset({data: asset, options: {dirty: false}});
                })
            }
        },
        api: assetApi
    };
}]);

mobileSdkApiApp.factory('documentUtility', ['promiseService', 'hydration', 'documentApi', function (promiseService, hydration, documentApi) {
    var _relations = ['organization'];

    return {
        hydration: {
            hydrate: function (documentOrId, relations) {
                relations = relations || _relations;

                return promiseService.wrap(function (promise) {
                    if (typeof documentOrId !== 'object') {
                        documentApi.findDocument({key: documentOrId, options: {one: true}}).then(function (document) {
                            hydration.hydrate(document, 'document', relations).then(promise.resolve, promise.reject);
                        }, promise.reject);
                    } else {
                        hydration.hydrate(documentOrId, 'document', relations).then(promise.resolve, promise.reject);
                    }
                });
            },
            dehydrate: function (document, relations) {
                relations = relations || _relations;

                return hydration.dehydrate(document, 'document', relations).then(function (document) {
                    documentApi.updateDocument({data: document, options: {dirty: false}});
                })
            }
        },
        api: documentApi
    };
}]);
