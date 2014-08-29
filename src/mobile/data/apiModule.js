var mobileSdkApiApp = angular.module('ag.mobile-sdk.api', ['ag.sdk.utilities', 'ag.sdk.monitor', 'ag.mobile-sdk.data', 'ag.mobile-sdk.cordova.storage', 'ag.sdk.library']);

var _errors = {
    TypeParamRequired: {code: 'TypeParamRequired', message: 'Type parameter is required'},
    UploadPhotoError: {code: 'UploadPhotoError', message: 'Error occured uploading photo'}
};


/*
 * Syncronization
 */
mobileSdkApiApp.factory('apiSynchronizationService', ['$http', '$log', 'assetApi', 'configuration', 'documentUtility', 'enterpriseBudgetApi', 'farmApi', 'farmerUtility', 'fileStorageService', 'legalEntityApi', 'pagingService', 'promiseService', 'taskUtility', 'underscore',
    function ($http, $log, assetApi, configuration, documentUtility, enterpriseBudgetApi, farmApi, farmerUtility, fileStorageService, legalEntityApi, pagingService, promiseService, taskUtility, underscore) {
        var _readOptions = {readLocal: false, readRemote: true};

        function _getFarmers (pageOptions) {
            pageOptions = pageOptions || {limit: 20, resulttype: 'full'};

            return farmerUtility.api.purgeFarmer({template: 'farmers', options: {force: false}}).then(function () {
                return promiseService.wrap(function (promise) {
                    var paging = pagingService.initialize(function (page) {
                        return farmerUtility.api.getFarmers({paging: page, options: _readOptions});
                    }, function (farmers) {
                        promiseService
                            .chain(function (chain) {
                                if (paging.complete === false) {
                                    paging.request().then(angular.noop, promiseService.throwError);
                                }

                                angular.forEach(farmers, function (farmer) {
                                    chain.push(function () {
                                        return farmerUtility.hydration.dehydrate(farmer);
                                    });
                                });
                            }).then(function () {
                                if (paging.complete) {
                                    promise.resolve();
                                }
                            }, promiseService.throwError);
                    }, pageOptions);

                    paging.request().then(angular.noop, promiseService.throwError);
                });
            });
        }

        function _getDocuments (pageOptions) {
            pageOptions = pageOptions || {limit: 20, resulttype: 'full'};

            return documentUtility.api.purgeDocument({template: 'documents', options: {force: false}}).then(function () {
                return promiseService.wrap(function (promise) {
                    var paging = pagingService.initialize(function (page) {
                        return documentUtility.api.getDocuments({paging: page, options: _readOptions});
                    }, function (documents) {
                        promiseService
                            .chain(function (chain) {
                                if (paging.complete === false) {
                                    paging.request().then(angular.noop, promiseService.throwError);
                                }

                                angular.forEach(documents, function (document) {
                                    chain.push(function () {
                                        return documentUtility.hydration.dehydrate(document);
                                    });
                                });
                            }).then(function () {
                                if (paging.complete) {
                                    promise.resolve();
                                }
                            }, promiseService.throwError);
                    }, pageOptions);

                    paging.request().then(angular.noop, promiseService.throwError);
                });
            });
        }

        function _getTasks (pageOptions) {
            pageOptions = pageOptions || {limit: 20, resulttype: 'full'};

            return taskUtility.api.purgeTask({template: 'tasks', options: {force: false}}).then(function () {
                return promiseService.wrap(function (promise) {
                    var paging = pagingService.initialize(function (page) {
                        return taskUtility.api.getTasks({paging: page, options: _readOptions});
                    }, function (tasks) {
                        promiseService
                            .chain(function (chain) {
                                if (paging.complete === false) {
                                    paging.request().then(angular.noop, promiseService.throwError);
                                }

                                angular.forEach(tasks, function (task) {
                                    chain.push(function () {
                                        return taskUtility.hydration.dehydrate(task);
                                    });
                                });
                            }).then(function () {
                                if (paging.complete) {
                                    promise.resolve();
                                }
                            }, promiseService.throwError);
                    }, pageOptions);

                    paging.request().then(angular.noop, promiseService.throwError);
                });
            });
        }

        function _getEnterpriseBudgets() {
            return enterpriseBudgetApi.getEnterpriseBudgets({options: _readOptions});
        }


        function _postFarmers () {
            return farmerUtility.api.getFarmers().then(function (farmers) {
                return promiseService.chain(function (chain) {
                    angular.forEach(farmers, function (farmer) {
                        chain.push(function () {
                            return _postFarmer(farmer);
                        });
                    });
                });
            }, promiseService.throwError);
        }

        function _postFarmer (farmer) {
            return promiseService.chain(function (chain) {
                if (farmer.__dirty === true) {
                    chain.push(function () {
                        return farmerUtility.api.postFarmer({data: farmer});
                    });
                }

                chain.push(function () {
                    return _postFarms(farmer.id);
                }, function () {
                    return _postLegalEntities(farmer.id);
                });
            });
        }

        function _postFarms (farmerId) {
            return farmApi.getFarms({id: farmerId}).then(function (farms) {
                return promiseService.chain(function (chain) {
                    angular.forEach(farms, function (farm) {
                        if (farm.__dirty === true) {
                            chain.push(function () {
                                return farmApi.postFarm({data: farm});
                            });
                        }
                    });
                });
            }, promiseService.throwError);
        }

        function _postLegalEntities (farmerId) {
            return legalEntityApi.getEntities({id: farmerId}).then(function (entities) {
                return promiseService.chain(function (chain) {
                    angular.forEach(entities, function (entity) {
                        if (entity.__dirty === true) {
                            chain.push(function () {
                                return legalEntityApi.postEntity({data: entity});
                            });
                        }

                        chain.push(function () {
                            return _postAssets(entity.id);
                        });
                    });
                });
            }, promiseService.throwError);
        }

        function _postAssets (entityId) {
            return assetApi.getAssets({id: entityId}).then(function (assets) {
                return promiseService.chain(function (chain) {
                    angular.forEach(assets, function (asset) {
                        if (asset.__dirty === true) {
                            chain.push(function () {
                                return _postAsset(asset);
                            });
                        }
                    });
                });
            }, promiseService.throwError);
        }

        function _postAsset (asset) {
            asset.data = asset.data || {};

            var cachedAttachments = (asset.data.attachments ? angular.copy(asset.data.attachments) : []);
            var toBeAttached = underscore.where(cachedAttachments, {local: true});
            asset.data.attachments = underscore.difference(cachedAttachments, toBeAttached);

            return assetApi.postAsset({data: asset}).then(function (result) {
                result = (result && result.length ? result[0] : result);

                return promiseService.chain(function (chain) {
                    angular.forEach(toBeAttached, function (attachment) {
                        chain.push(function () {
                            return _postAttachment('asset', result.id, attachment);
                        });
                    });
                });
            }, promiseService.throwError);
        }

        function _postDocuments () {
            return documentUtility.api.getDocuments().then(function (documents) {
                return promiseService.chain(function (chain) {
                    angular.forEach(documents, function (document) {
                        if (document.__dirty === true) {
                            chain.push(function () {
                                return _postDocument(document);
                            });
                        }
                    });
                });
            }, promiseService.throwError);
        }

        function _postDocument (document) {
            document.data = document.data || {};

            var cachedAttachments = (document.data.attachments ? angular.copy(document.data.attachments) : []);
            var toBeAttached = underscore.where(cachedAttachments, {local: true});
            document.data.attachments = underscore.difference(cachedAttachments, toBeAttached);

            return documentUtility.api.postDocument({data: document}).then(function (result) {
                result = (result && result.length ? result[0] : result);

                return promiseService.chain(function (chain) {
                    angular.forEach(toBeAttached, function (attachment) {
                        chain.push(function () {
                            return _postAttachment('document', result.id, attachment);
                        });
                    });
                });
            }, promiseService.throwError);
        }

        function _postTasks (task) {
            var query = (task !== undefined ? {template: 'tasks/:id', schema: {id: task.id}} : task);

            return taskUtility.api.getTasks(query).then(function (subtasks) {
                return promiseService.chain(function (chain) {
                    angular.forEach(subtasks, function (subtask) {
                        if (query === undefined) {
                            chain.push(function () {
                                return _postTasks(subtask);
                            });
                        } else if (subtask.__dirty === true) {
                            chain.push(function () {
                                return _postTask(subtask);
                            });
                        }
                    });

                    if (task && task.__dirty === true) {
                        chain.push(function () {
                            return _postTask(task);
                        });
                    }
                });
            }, promiseService.throwError);
        }

        function _postTask (task) {
            task.data = task.data || {};

            var cachedAttachments = (task.data.attachments ? angular.copy(task.data.attachments) : []);
            var toBeAttached = underscore.where(cachedAttachments, {local: true});
            task.data.attachments = underscore.difference(cachedAttachments, toBeAttached);

            return taskUtility.api.postTask({data: task}).then(function (result) {
                result = (result && result.length ? result[0] : result);

                return promiseService.chain(function (chain) {
                    angular.forEach(toBeAttached, function (attachment) {
                        chain.push(function () {
                            return _postAttachment('task', result.id, attachment);
                        });
                    });
                });
            }, promiseService.throwError);
        }

        function _postAttachment (type, id, attachment) {
            return fileStorageService.read(attachment.src, true).then(function (fileData) {
                return $http.post(configuration.getServer() + 'api/' + type + '/' + id + '/attach', {
                    archive: underscore.extend(underscore.omit(attachment, ['src', 'local', 'key']), {
                        filename: fileData.file,
                        content: fileData.content.substring(fileData.content.indexOf(',') + 1)
                    })
                }, {withCredentials: true})
            }, promiseService.throwError);
        }

        return {
            synchronize: function () {
                return this.upload().then(this.download);
            },
            upload: function () {
                return promiseService.chain(function (chain) {
                    chain.push(_postFarmers, _postDocuments, _postTasks);
                });
            },
            download: function () {
                return promiseService.chain(function (chain) {
                    chain.push(_getFarmers, _getDocuments, _getTasks, _getEnterpriseBudgets);
                });
            }
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
             * @param req.paging {Object} Optional
             * @returns {Promise}
             */
            getItems: function (req) {
                req = req || {};

                return promiseService.wrap(function (promise) {
                    _itemStore.transaction(function (tx) {
                        if (req.template) {
                            tx.getItems({template: req.template, schema: req.schema, options: req.options, paging: req.paging, callback: promise});
                        } else if (req.search) {
                            req.options.readLocal = false;
                            req.options.readRemote = true;

                            tx.getItems({template: options.plural + '?search=:query', schema: {query: req.search}, options: req.options, paging: req.paging, callback: promise});
                        } else if (req.id) {
                            tx.getItems({template: options.plural + '/:id', schema: {id: req.id}, options: req.options, paging: req.paging, callback: promise});
                        } else {
                            tx.getItems({template: options.plural, options: req.options, paging: req.paging, callback: promise});
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
             * @param req.template {String} Optional template
             * @param req.schema {Object} Optional schema
             * @param req.options {Object} Optional
             * @returns {Promise}
             */
            purgeItem: function (req) {
                req = req || {};

                return promiseService.wrap(function (promise) {
                    _itemStore.transaction(function (tx) {
                        tx.purgeItems({template: req.template, schema: req.schema, options: req.options, callback: promise});
                    });
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
