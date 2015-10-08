var mobileSdkApiApp = angular.module('ag.mobile-sdk.api', ['ag.sdk.utilities', 'ag.sdk.monitor', 'ag.mobile-sdk.hydration', 'ag.mobile-sdk.data', 'ag.mobile-sdk.cordova.connection', 'ag.mobile-sdk.cordova.storage', 'ag.sdk.library']);

var _errors = {
    TypeParamRequired: {code: 'TypeParamRequired', message: 'Type parameter is required'},
    UploadPhotoError: {code: 'UploadPhotoError', message: 'Error occured uploading photo'}
};


/*
 * Syncronization
 */
mobileSdkApiApp.provider('apiSynchronizationService', ['underscore', function (underscore) {
    var _options = {
        models: ['budgets', 'documents', 'expenses', 'farmers', 'tasks', 'organizational-units', 'merchants'],
        local: {
            readLocal: true,
            hydrate: false
        },
        remote: {
            readLocal: false,
            readRemote: true,
            hydrate: false
        }
    };

    var _busy = false;

    this.config = function (options) {
        _options = underscore.extend(_options, options);
    };

    this.$get = ['$http', '$log', 'assetApi', 'configuration', 'connectionService', 'documentApi', 'enterpriseBudgetApi', 'expenseApi', 'farmApi', 'farmerApi', 'fileStorageService', 'legalEntityApi', 'liabilityApi', 'merchantApi', 'organizationalUnitApi', 'pagingService', 'productionScheduleApi', 'promiseService', 'taskApi',
        function ($http, $log, assetApi, configuration, connectionService, documentApi, enterpriseBudgetApi, expenseApi, farmApi, farmerApi, fileStorageService, legalEntityApi, liabilityApi, merchantApi, organizationalUnitApi, pagingService, productionScheduleApi, promiseService, taskApi) {
            function _getFarmers (getParams) {
                getParams = getParams || {limit: 20, resulttype: 'simple'};

                return farmerApi.purgeFarmer({template: 'farmers', options: {force: false}}).then(function () {
                    return promiseService.wrap(function (promise) {
                        var paging = pagingService.initialize(function (page) {
                            return farmerApi.getFarmers({params: page, options: _options.remote});
                        }, function (farmers) {
                            if (paging.complete) {
                                promise.resolve();
                            } else {
                                paging.request().catch(promise.reject);
                            }
                        }, getParams);

                        paging.request().catch(promise.reject);
                    });
                });
            }

            function _getDocuments (getParams) {
                getParams = getParams || {limit: 20, resulttype: 'simple'};

                return documentApi.purgeDocument({template: 'documents', options: {force: false}}).then(function () {
                    return promiseService.wrap(function (promise) {
                        var paging = pagingService.initialize(function (page) {
                            return documentApi.getDocuments({params: page, options: _options.remote});
                        }, function (documents) {
                            if (paging.complete) {
                                promise.resolve();
                            } else {
                                paging.request().catch(promise.reject);
                            }
                        }, getParams);

                        paging.request().catch(promise.reject);
                    });
                });
            }

            function _getExpenses (getParams) {
                getParams = getParams || {limit: 20, resulttype: 'full'};

                return expenseApi.purgeExpense({template: 'expenses', options: {force: false}}).then(function () {
                    return promiseService.wrap(function (promise) {
                        var paging = pagingService.initialize(function (page) {
                            return expenseApi.getExpenses({params: page, options: _options.remote});
                        }, function (expenses) {
                            if (paging.complete) {
                                promise.resolve();
                            } else {
                                paging.request().catch(promise.reject);
                            }
                        }, getParams);

                        paging.request().catch(promise.reject);
                    });
                });
            }

            function _getTasks (getParams) {
                getParams = getParams || {limit: 20, resulttype: 'simple'};

                return taskApi.purgeTask({template: 'tasks', options: {force: false}}).then(function () {
                    return promiseService.wrap(function (promise) {
                        var paging = pagingService.initialize(function (page) {
                            return taskApi.getTasks({params: page, options: _options.remote});
                        }, function (tasks) {
                            promiseService
                                .chain(function (chain) {
                                    angular.forEach(tasks, function (task) {
                                        chain.push(function () {
                                            return taskApi.findTask({key: task.id, options: {fallbackRemote: true, hydrate: ['organization', 'subtasks']}});
                                        });
                                    });
                                })
                                .then(function () {
                                    if (paging.complete) {
                                        promise.resolve();
                                    } else {
                                        paging.request().catch(promise.reject);
                                    }
                                });
                        }, getParams);

                        paging.request().catch(promise.reject);
                    });
                });
            }

            function _getEnterpriseBudgets() {
                return enterpriseBudgetApi.getEnterpriseBudgets({options: _options.remote});
            }

            function _getOrganizationalUnits (getParams) {
                getParams = getParams || {limit: 20, resulttype: 'simple'};

                return organizationalUnitApi.purgeOrganizationalUnit({template: 'organizational-units', options: {force: false}}).then(function () {
                    return promiseService.wrap(function (promise) {
                        var paging = pagingService.initialize(function (page) {
                            return organizationalUnitApi.getOrganizationalUnits({params: page, options: _options.remote});
                        }, function (expenses) {
                            if (paging.complete) {
                                promise.resolve();
                            } else {
                                paging.request().catch(promise.reject);
                            }
                        }, getParams);

                        paging.request().catch(promise.reject);
                    });
                });
            }

            function _getMerchants() {
                return merchantApi.getMerchants({options: _options.remote});
            }

            function _postFarmers () {
                return farmerApi.getFarmers({options: {readLocal: true, hydrate: ['primaryContact']}}).then(function (farmers) {
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
                    if (farmer.$dirty === true) {
                        chain.push(function () {
                            return farmerApi.postFarmer({data: farmer});
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
                return farmApi.getFarms({id: farmerId, options: _options.local}).then(function (farms) {
                    return promiseService.chain(function (chain) {
                        angular.forEach(farms, function (farm) {
                            if (farm.$dirty === true) {
                                chain.push(function () {
                                    return farmApi.postFarm({data: farm});
                                });
                            }
                        });
                    });
                }, promiseService.throwError);
            }

            function _postLegalEntities (farmerId) {
                return legalEntityApi.getEntities({id: farmerId, options: _options.local}).then(function (entities) {
                    return promiseService.chain(function (chain) {
                        angular.forEach(entities, function (entity) {
                            if (entity.$dirty === true) {
                                chain.push(function () {
                                    return legalEntityApi.postEntity({data: entity}).then(function (res) {
                                        return promiseService.all([_postAssets(entity.$id, res.id), _postLiabilities('legalentity', entity.$id, res.id, res.id)]);
                                    });
                                });
                            } else {
                                chain.push(function () {
                                    return _postAssets(entity.$id, entity.id);
                                });

                                chain.push(function () {
                                    return _postLiabilities('legalentity', entity.$id, entity.id, entity.$id);
                                });
                            }
                        });
                    });
                }, promiseService.throwError);
            }

            function _postAssets (localEntityId, remoteEntityId) {
                return assetApi.getAssets({id: localEntityId, options: _options.local}).then(function (assets) {
                    return promiseService.chain(function (chain) {
                        angular.forEach(assets, function (asset) {
                            if (localEntityId !== remoteEntityId) {
                                asset.$uri = 'assets/' + remoteEntityId;
                                asset.legalEntityId = remoteEntityId;

                                chain.push(function () {
                                    return assetApi.updateAsset({data: asset});
                                });
                            }

                            if (asset.$dirty === true) {
                                chain.push(function () {
                                    return assetApi.postAsset({data: asset}).then(function (res) {
                                        return promiseService.all([_postLiabilities('asset', asset.$id, res.id, remoteEntityId), _postProductionSchedules(asset.$id, res.id)]);
                                    });
                                });
                            } else {
                                chain.push(function () {
                                    return _postLiabilities('asset', asset.$id, asset.id, remoteEntityId);
                                });

                                chain.push(function () {
                                    return _postProductionSchedules(asset.$id, asset.id);
                                });
                            }
                        });
                    });
                }, promiseService.throwError);
            }

            function _postLiabilities (type, localId, remoteId, legalEntityId) {
                return liabilityApi.getLiabilities({template: 'liabilities/:type/:id', schema: {type: type, id: localId}, options: _options.local}).then(function (liabilities) {
                    return promiseService.chain(function (chain) {
                        angular.forEach(liabilities, function (liability) {
                            if (localId !== remoteId) {
                                liability.$uri = 'liabilities/' + type + '/' + remoteId;
                                liability.legalEntityId = legalEntityId;

                                chain.push(function () {
                                    return liabilityApi.updateLiability({data: liability});
                                });
                            }

                            if (liability.$dirty === true) {
                                chain.push(function () {
                                    return liabilityApi.postLiability({
                                        template: (liability.$local ? ':type/:oid/liability' : 'liability/:id'),
                                        schema: {type: type, oid: remoteId},
                                        data: liability
                                    });
                                });
                            }
                        });
                    });
                }, promiseService.throwError);
            }

            function _postProductionSchedules (localAssetId, remoteAssetId) {
                return productionScheduleApi.getProductionSchedules({id: localAssetId, options: _options.local}).then(function (schedules) {
                    return promiseService.chain(function (chain) {
                        angular.forEach(schedules, function (schedule) {
                            if (localAssetId !== remoteAssetId) {
                                schedule.$uri = 'production-schedules/' + remoteAssetId;
                                schedule.assetId = remoteAssetId;

                                chain.push(function () {
                                    return productionScheduleApi.updateProductionSchedule({data: schedule});
                                });
                            }

                            if (schedule.$dirty === true) {
                                chain.push(function () {
                                    return productionScheduleApi.postProductionSchedule({data: schedule});
                                });
                            }
                        });
                    });
                }, promiseService.throwError);
            }

            function _postDocuments () {
                return documentApi.getDocuments({options: _options.local}).then(function (documents) {
                    return promiseService.chain(function (chain) {
                        angular.forEach(documents, function (document) {
                            if (document.$dirty === true) {
                                chain.push(function () {
                                    return documentApi.postDocument({data: document});
                                });
                            }
                        });
                    });
                }, promiseService.throwError);
            }

            function _postExpenses () {
                return expenseApi.getExpenses({options: _options.local}).then(function (expenses) {
                    return promiseService.chain(function (chain) {
                        angular.forEach(expenses, function (expense) {
                            if (expense.$dirty === true) {
                                chain.push(function () {
                                    return expenseApi.postExpense({data: expense});
                                });
                            }
                        });
                    });
                }, promiseService.throwError);
            }


            function _postMerchants () {
                return merchantApi.getMerchants({options: _options.local}).then(function (merchants) {
                    return promiseService.chain(function (chain) {
                        angular.forEach(merchants, function (merchant) {
                            if (merchant.$dirty === true) {
                                chain.push(function () {
                                    return merchantApi.postMerchant({data: merchant});
                                });
                            }
                        });
                    });
                }, promiseService.throwError);
            }

            function _postTasks (task) {
                var query = (task !== undefined ? {template: 'tasks/:id', schema: {id: task.id}, options: _options.local} : {options: _options.local});

                return taskApi.getTasks(query).then(function (subtasks) {
                    return promiseService.chain(function (chain) {
                        angular.forEach(subtasks, function (subtask) {
                            if (task === undefined) {
                                chain.push(function () {
                                    return _postTasks(subtask);
                                });
                            } else if (subtask.$dirty === true) {
                                chain.push(function () {
                                    return taskApi.postTask({data: subtask})
                                });
                            }
                        });

                        if (task && task.$dirty === true) {
                            chain.push(function () {
                                return taskApi.postTask({data: task})
                            });
                        }
                    });
                }, promiseService.throwError);
            }

            return {
                isSynchronizing: function () {
                    return _busy;
                },
                synchronize: function (models) {
                    var _this = this;

                    models = models || _options.models;

                    return _this.upload(models).then(function () {
                        return _this.download(models);
                    });
                },
                upload: function (models) {
                    models = models || _options.models;

                    return promiseService.wrap(function (promise) {
                        if (_busy) {
                            promise.reject({
                                data: {
                                    message: 'Syncing with server. Please wait'
                                }
                            });
                        } else if (connectionService.isOnline() == false) {
                            promise.reject({
                                data: {
                                    message: 'Cannot connect to the server. Please try again later'
                                }
                            });
                        } else {
                            _busy = true;

                            promiseService
                                .chain(function (chain) {
                                    if (models.indexOf('farmers') !== -1) {
                                        chain.push(_postFarmers);
                                    }

                                    if (models.indexOf('documents') !== -1) {
                                        chain.push(_postDocuments);
                                    }

                                    if (models.indexOf('tasks') !== -1) {
                                        chain.push(_postTasks);
                                    }

                                    if (models.indexOf('expenses') !== -1) {
                                        chain.push(_postExpenses);
                                    }

                                    if (models.indexOf('merchants') !== -1) {
                                        chain.push(_postMerchants);
                                    }
                                })
                                .then(function (res) {
                                    _busy = false;
                                    promise.resolve(res);
                                }, function (err) {
                                    _busy = false;
                                    promise.reject(err);
                                });
                        }
                    });
                },
                download: function (models) {
                    models = models || _options.models;

                    return promiseService.wrap(function (promise) {
                        if (_busy) {
                            promise.reject({
                                data: {
                                    message: 'Syncing with server. Please wait'
                                }
                            });
                        } else if (connectionService.isOnline() == false) {
                            promise.reject({
                                data: {
                                    message: 'Cannot connect to the server. Please try again later'
                                }
                            });
                        } else {
                            _busy = true;

                            promiseService
                                .chain(function (chain) {
                                    if (models.indexOf('farmers') !== -1) {
                                        chain.push(_getFarmers);
                                    }

                                    if (models.indexOf('documents') !== -1) {
                                        chain.push(_getDocuments);
                                    }

                                    if (models.indexOf('tasks') !== -1) {
                                        chain.push(_getTasks);
                                    }

                                    if (models.indexOf('budgets') !== -1) {
                                        chain.push(_getEnterpriseBudgets);
                                    }

                                    if (models.indexOf('expenses') !== -1) {
                                        chain.push(_getExpenses);
                                    }

                                    if (models.indexOf('organizational-units') !== -1) {
                                        chain.push(_getOrganizationalUnits);
                                    }

                                    if (models.indexOf('merchants') !== -1) {
                                        chain.push(_getMerchants);
                                    }
                                })
                                .then(function (res) {
                                    _busy = false;
                                    promise.resolve(res);
                                }, function (err) {
                                    _busy = false;
                                    promise.reject(err);
                                });
                        }
                    });
                }
            };
        }];
}]);

/*
 * API
 */
mobileSdkApiApp.constant('apiConstants', {
    MissingParams: {code: 'MissingParams', message: 'Missing parameters for api call'}
});

mobileSdkApiApp.factory('api', ['apiConstants', 'dataStore', 'promiseService', 'underscore', function (apiConstants, dataStore, promiseService, underscore) {
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
        
        var _itemStore = dataStore(options.singular, {
            apiTemplate: options.singular + '/:id',
            hydrate: options.hydrate,
            dehydrate: options.dehydrate
        });
        
        var _stripProperties = function (data) {
            if (typeof data.copy == 'function') {
                var strippedData = data.copy();

                angular.forEach(options.strip, function (prop) {
                    delete strippedData[prop];
                });

                return strippedData;
            } else {
                return (options.strip ? underscore.omit(data, options.strip) : data);
            }
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
             * @param req.params {Object} Optional
             * @returns {Promise}
             */
            getItems: function (req) {
                var request = req || {};
                request.options = underscore.defaults((request.options ? angular.copy(request.options) : {}), {one: false});

                return _itemStore.transaction().then(function (tx) {
                    if (request.template) {
                        return tx.getItems({template: request.template, schema: request.schema, options: request.options, params: request.params});
                    } else if (request.search) {
                        request.options.readLocal = false;
                        request.options.readRemote = true;

                        return tx.getItems({template: options.plural + '?search=:query', schema: {query: request.search}, options: request.options, params: request.params});
                    } else if (request.id) {
                        return tx.getItems({template: options.plural + '/:id', schema: {id: request.id}, options: request.options, params: request.params});
                    } else {
                        return tx.getItems({template: options.plural, options: request.options, params: request.params});
                    }
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
                var request = req || {};
                request.options = (request.options ? angular.copy(request.options) : {});
                
                return _itemStore.transaction().then(function (tx) {
                    if (request.data) {
                        return tx.createItems({template: request.template, schema: request.schema, data: request.data, options: request.options});
                    } else {
                        promiseService.throwError(apiConstants.MissingParams);
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
                var request = req || {};
                request.options = (request.options ? angular.copy(request.options) : {});
                
                return _itemStore.transaction().then(function (tx) {
                    if (request.id) {
                        return tx.getItems({template: request.template, schema: {id: request.id}, options: request.options});
                    } else {
                        promiseService.throwError(apiConstants.MissingParams);
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
                var request = req || {};
                request.options = (request.options ? angular.copy(request.options) : {});

                return _itemStore.transaction().then(function (tx) {
                    if (request.key) {
                        return tx.findItems({key: request.key, column: request.column, options: request.options});
                    } else {
                        promiseService.throwError(apiConstants.MissingParams);
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
                var request = req || {};
                request.options = (request.options ? angular.copy(request.options) : {});

                return _itemStore.transaction().then(function (tx) {
                    if (request.data) {
                        return tx.updateItems({data: _stripProperties(request.data), options: request.options});
                    } else {
                        promiseService.throwError(apiConstants.MissingParams);
                    }
                });
            },
            /**
             * @name postItem
             * @param req {Object}
             * @param req.template {String} Optional write uri template
             * @param req.schema {Object} Optional schema for template
             * @param req.data {Object} Required
             * @param req.options {Object} Optional
             * @returns {Promise}
             */
            postItem: function (req) {
                var request = req || {};
                request.options = (request.options ? angular.copy(request.options) : {});

                return _itemStore.transaction().then(function (tx) {
                    if (request.data) {
                        return tx.postItems({template: request.template, schema: request.schema, data: _stripProperties(request.data), options: request.options});
                    } else {
                        promiseService.throwError(apiConstants.MissingParams);
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
                var request = req || {};
                request.options = (request.options ? angular.copy(request.options) : {});

                return _itemStore.transaction().then(function (tx) {
                    if (request.data) {
                        return tx.removeItems({template: options.singular + '/:id/delete', data: request.data});
                    } else {
                        promiseService.throwError(apiConstants.MissingParams);
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
                var request = req || {};
                request.options = (request.options ? angular.copy(request.options) : {});

                return _itemStore.transaction().then(function (tx) {
                    return tx.purgeItems({template: request.template, schema: request.schema, options: request.options});
                });
            }
        };
    }
}]);

mobileSdkApiApp.factory('userApi', ['api', function (api) {
    var userApi = api({
        plural: 'users',
        singular: 'user'
    });

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

mobileSdkApiApp.factory('organizationalUnitApi', ['api', function (api) {
    var organizationalUnitApi = api({
        plural: 'organizational-units',
        singular: 'organizational-unit'
    });

    return {
        getOrganizationalUnits: organizationalUnitApi.getItems,
        createOrganizationalUnit: organizationalUnitApi.createItem,
        getOrganizationalUnit: organizationalUnitApi.getItem,
        findOrganizationalUnit: organizationalUnitApi.findItem,
        updateOrganizationalUnit: organizationalUnitApi.updateItem,
        postOrganizationalUnit: organizationalUnitApi.postItem,
        deleteOrganizationalUnit: organizationalUnitApi.deleteItem,
        purgeOrganizationalUnit: organizationalUnitApi.purgeItem
    };
}]);

mobileSdkApiApp.factory('notificationApi', ['api', function (api) {
    var notificationApi = api({
        plural: 'notifications',
        singular: 'notification'
    });

    return {
        getNotifications: notificationApi.getItems,
        getNotification: notificationApi.getItem,
        deleteNotification: notificationApi.deleteItem
    };
}]);

mobileSdkApiApp.provider('taskApi', ['hydrationProvider', function (hydrationProvider) {
    hydrationProvider.registerHydrate('subtasks', ['taskApi', function (taskApi) {
        return function (obj, type) {
            return taskApi.getTasks({template: 'tasks/:id', schema: {id: obj.$id}});
        }
    }]);

    hydrationProvider.registerDehydrate('subtasks', ['taskApi', 'promiseService', function (taskApi, promiseService) {
        return function (obj, type) {
            var objId = (obj.$id !== undefined ? obj.$id : obj.id);

            return taskApi.purgeTask({template: 'tasks/:id', schema: {id: objId}, options: {force: false}})
                .then(function () {
                    return promiseService.arrayWrap(function (promises) {
                        angular.forEach(obj.subtasks, function (subtask) {
                            promises.push(taskApi.createTask({template: 'tasks/:id', schema: {id: objId}, data: subtask, options: {replace: obj.$complete, complete: obj.$complete, dirty: false}}));
                        });
                    });
                }, promiseService.throwError);
        }
    }]);

    this.$get = ['api', 'hydration', function (api, hydration) {
        var hydrateRelations = ['document', 'organization', 'subtasks'];
        var dehydrateRelations = ['document', 'subtasks'];
        var taskApi = api({
            plural: 'tasks',
            singular: 'task',
            strip: hydrateRelations,
            hydrate: function (obj, options) {
                options.hydrate = (options.hydrate instanceof Array ? options.hydrate : (options.hydrate === true ? hydrateRelations : []));
                return hydration.hydrate(obj, 'task', options);
            },
            dehydrate: function (obj, options) {
                options.dehydrate = (options.dehydrate instanceof Array ? options.dehydrate : (options.dehydrate === false ? [] : dehydrateRelations));
                return hydration.dehydrate(obj, 'task', options);
            }
        });

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
    }];
}]);

mobileSdkApiApp.provider('merchantApi', ['hydrationProvider', function (hydrationProvider) {
    hydrationProvider.registerHydrate('merchant', ['merchantApi', function (merchantApi) {
        return function (obj, type, options) {
            return (obj.merchantUuid ? merchantApi.findMerchant({column: 'data', key: obj.merchantUuid, options: {like: true, one: true}}) : undefined);
        }
    }]);

    hydrationProvider.registerDehydrate('merchant', ['merchantApi', function (merchantApi) {
        return function (obj, type) {
            return merchantApi.createMerchant({template: 'merchants', data: obj.merchant, options: {replace: obj.$complete, complete: obj.$complete, dirty: false}});
        }
    }]);

    this.$get = ['$http', 'api', 'configuration', 'promiseService', 'underscore', function ($http, api, configuration, promiseService, underscore) {
        var _host = configuration.getServer();
        var merchantApi = api({
            plural: 'merchants',
            singular: 'merchant'
        });

        return {
            getMerchants: merchantApi.getItems,
            createMerchant: merchantApi.createItem,
            getMerchant: merchantApi.getItem,
            findMerchant: merchantApi.findItem,
            updateMerchant: merchantApi.updateItem,
            postMerchant: merchantApi.postItem,
            deleteMerchant: merchantApi.deleteItem,
            searchMerchants: function (query) {
                query = underscore.map(query, function (value, key) {
                    return key + '=' + value;
                }).join('&');

                return promiseService.wrap(function (promise) {
                    $http.get(_host + 'api/agrista/providers' + (query ? '?' + query : ''), {withCredentials: true}).then(function (res) {
                        promise.resolve(res.data);
                    }, promise.reject);
                });
            }
        };
    }];
}]);

mobileSdkApiApp.provider('farmerApi', ['hydrationProvider', function (hydrationProvider) {
    hydrationProvider.registerHydrate('organization', ['farmerApi', function (farmerApi) {
        return function (obj, type, options) {
            return farmerApi.findFarmer({key: obj.organizationId, options: {one: true, hydrateRemote: options.remoteHydration}});
        }
    }]);

    hydrationProvider.registerDehydrate('organization', ['farmerApi', 'promiseService', function (farmerApi, promiseService) {
        return function (obj, type) {
            return promiseService.wrap(function (promise) {
                if (obj.organization) {
                    obj.organization.id = obj.organization.id || obj.organizationId;

                    farmerApi.createFarmer({template: 'farmers', data: obj.organization, options: {replace: obj.$complete, complete: obj.$complete, dirty: false}}).then(promise.resolve, promise.reject);
                } else {
                    promise.resolve(obj);
                }
            });
        }
    }]);

    this.$get = ['api', 'hydration', function (api, hydration) {
        var defaultRelations = ['activities', 'farms', 'legalEntities', 'primaryContact'];
        var farmerApi = api({
            plural: 'farmers',
            singular: 'farmer',
            strip: ['farms', 'legalEntities'],
            hydrate: function (obj, options) {
                options.hydrate = (options.hydrate instanceof Array ? options.hydrate : (options.hydrate === true ? defaultRelations : []));
                return hydration.hydrate(obj, 'farmer', options);
            },
            dehydrate: function (obj, options) {
                options.dehydrate = (options.dehydrate instanceof Array ? options.dehydrate : (options.dehydrate === false ? [] : defaultRelations));
                return hydration.dehydrate(obj, 'farmer', options);
            }
        });

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
    }];
}]);

mobileSdkApiApp.provider('legalEntityApi', ['hydrationProvider', function (hydrationProvider) {
    hydrationProvider.registerHydrate('legalEntity', ['legalEntityApi', function (legalEntityApi) {
        return function (obj, type, options) {
            return legalEntityApi.findEntity({key: obj.legalEntityId, options: {one: true, hydrate: true, hydrateRemote: options.remoteHydration}});
        }
    }]);

    hydrationProvider.registerHydrate('legalEntities', ['legalEntityApi', function (legalEntityApi) {
        return function (obj, type) {
            return legalEntityApi.getEntities({id: obj.$id, options: {hydrate: true}});
        }
    }]);

    hydrationProvider.registerHydrate('primaryContact', ['legalEntityApi', 'underscore', function (legalEntityApi, underscore) {
        return function (obj, type) {
            return legalEntityApi.getEntities({id: obj.$id})
                .then(function (entities) {
                    return underscore.findWhere(entities, {isPrimary: true});
                });
        }
    }]);

    hydrationProvider.registerDehydrate('legalEntities', ['legalEntityApi', 'promiseService', function (legalEntityApi, promiseService) {
        return function (obj, type) {
            var objId = (obj.$id !== undefined ? obj.$id : obj.id);

            return legalEntityApi.purgeEntity({template: 'legalentities/:id', schema: {id: objId}, options: {force: false}})
                .then(function () {
                    return promiseService.arrayWrap(function (promises) {
                        angular.forEach(obj.legalEntities, function (entity) {
                            promises.push(legalEntityApi.createEntity({template: 'legalentities/:id', schema: {id: objId}, data: entity, options: {replace: obj.$complete, complete: obj.$complete, dirty: false}}));
                        });
                    });
                }, promiseService.throwError);
        }
    }]);

    this.$get = ['api', 'hydration', function (api, hydration) {
        var defaultRelations = ['assets', 'liabilities'];
        var entityApi = api({
            plural: 'legalentities',
            singular: 'legalentity',
            strip: defaultRelations,
            hydrate: function (obj, options) {
                options.hydrate = (options.hydrate instanceof Array ? options.hydrate : (options.hydrate === true ? defaultRelations : []));
                return hydration.hydrate(obj, 'legalentity', options);
            },
            dehydrate: function (obj, options) {
                options.dehydrate = (options.dehydrate instanceof Array ? options.dehydrate : (options.dehydrate === false ? [] : defaultRelations));
                return hydration.dehydrate(obj, 'legalentity', options);
            }
        });

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
    }];
}]);

mobileSdkApiApp.provider('farmApi', ['hydrationProvider', function (hydrationProvider) {
    hydrationProvider.registerHydrate('farm', ['farmApi', function (farmApi) {
        return function (obj, type, options) {
            return (angular.isNumber(obj.farmId) ? farmApi.findFarm({key: obj.farmId, options: {one: true, hydrateRemote: options.remoteHydration}}) : null);
        }
    }]);

    hydrationProvider.registerHydrate('farms', ['farmApi', function (farmApi) {
        return function (obj, type) {
            return farmApi.getFarms({id: obj.$id});
        }
    }]);

    hydrationProvider.registerDehydrate('farms', ['farmApi', 'promiseService', function (farmApi, promiseService) {
        return function (obj, type) {
            var objId = (obj.$id !== undefined ? obj.$id : obj.id);

            return farmApi.purgeFarm({template: 'farms/:id', schema: {id: objId}, options: {force: false}})
                .then(function () {
                    return promiseService.arrayWrap(function (promises) {
                        angular.forEach(obj.farms, function (farm) {
                            promises.push(farmApi.createFarm({template: 'farms/:id', schema: {id: objId}, data: farm, options: {replace: obj.$complete, complete: obj.$complete, dirty: false}}));
                        });
                    });
                }, promiseService.throwError);
        }
    }]);

    this.$get = ['api', 'hydration', function (api, hydration) {
        var farmApi = api({
            plural: 'farms',
            singular: 'farm'
        });

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
    }];
}]);

mobileSdkApiApp.provider('assetApi', ['hydrationProvider', function (hydrationProvider) {
    hydrationProvider.registerHydrate('asset', ['assetApi', function (assetApi) {
        return function (obj, type) {
            return assetApi.findAsset({key: obj.$id, options: {one: true}});
        }
    }]);

    hydrationProvider.registerHydrate('assets', ['assetApi', function (assetApi) {
        return function (obj, type) {
            return assetApi.getAssets({id: obj.$id, options: {hydrate: ['liabilities', 'productionSchedules']}});
        }
    }]);

    hydrationProvider.registerDehydrate('assets', ['assetApi', 'promiseService', function (assetApi, promiseService) {
        return function (obj, type) {
            var objId = (obj.$id !== undefined ? obj.$id : obj.id);

            return assetApi.purgeAsset({template: 'assets/:id', schema: {id: objId}, options: {force: false}})
                .then(function () {
                    return promiseService.arrayWrap(function (promises) {
                        angular.forEach(obj.assets, function (asset) {
                            promises.push(assetApi.createAsset({template: 'assets/:id', schema: {id: objId}, data: asset, options: {replace: obj.$complete, complete: obj.$complete, dirty: false}}));
                        });
                    });
                }, promiseService.throwError);
        }
    }]);

    this.$get = ['api', 'hydration', function (api, hydration) {
        var hydrateRelations = ['liabilities', 'productionSchedules'];
        var assetApi = api({
            plural: 'assets',
            singular: 'asset',
            strip: ['farm', 'legalEntity', 'liabilities', 'productionSchedules'],
            hydrate: function (obj, options) {
                options.hydrate = (options.hydrate instanceof Array ? options.hydrate : (options.hydrate === true ? hydrateRelations : []));
                return hydration.hydrate(obj, 'asset', options);
            },
            dehydrate: function (obj, options) {
                options.dehydrate = (options.dehydrate instanceof Array ? options.dehydrate : (options.dehydrate === false ? [] : hydrateRelations));
                return hydration.dehydrate(obj, 'asset', options);
            }
        });

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
    }];
}]);

mobileSdkApiApp.provider('liabilityApi', ['hydrationProvider', function (hydrationProvider) {
    hydrationProvider.registerHydrate('liabilities', ['liabilityApi', function (liabilityApi) {
        return function (obj, type) {
            return liabilityApi.getLiabilities({template: 'liabilities/:type/:id', schema: {type: type, id: obj.$id}, options: {hydrate: true}});
        }
    }]);

    hydrationProvider.registerDehydrate('liabilities', ['liabilityApi', 'promiseService', function (liabilityApi, promiseService) {
        return function (obj, type) {
            var objId = (obj.$id !== undefined ? obj.$id : obj.id);

            return liabilityApi.purgeLiability({template: 'liabilities/:type/:id', schema: {type: type, id: objId}, options: {force: false}})
                .then(function () {
                    return promiseService.arrayWrap(function (promises) {
                        angular.forEach(obj.liabilities, function (liability) {
                            promises.push(liabilityApi.createLiability({template: 'liabilities/:type/:id', schema: {type: type, id: objId}, data: liability, options: {replace: obj.$complete, complete: obj.$complete, dirty: false}}));
                        });
                    });
                }, promiseService.throwError);
        }
    }]);

    this.$get = ['api', 'hydration', function (api, hydration) {
        var defaultRelations = ['merchant'];
        var liabilityApi = api({
            plural: 'liabilities',
            singular: 'liability',
            strip: defaultRelations,
            hydrate: function (obj, options) {
                options.hydrate = (options.hydrate instanceof Array ? options.hydrate : (options.hydrate === true ? defaultRelations : []));
                return hydration.hydrate(obj, 'liability', options);
            },
            dehydrate: function (obj, options) {
                options.dehydrate = (options.dehydrate instanceof Array ? options.dehydrate : (options.dehydrate === false ? [] : defaultRelations));
                return hydration.dehydrate(obj, 'liability', options);
            }
        });

        return {
            getLiabilities: liabilityApi.getItems,
            createLiability: liabilityApi.createItem,
            getLiability: liabilityApi.getItem,
            findLiability: liabilityApi.findItem,
            updateLiability: liabilityApi.updateItem,
            postLiability: liabilityApi.postItem,
            deleteLiability: liabilityApi.deleteItem,
            purgeLiability: liabilityApi.purgeItem
        };
    }];
}]);

mobileSdkApiApp.provider('documentApi', ['hydrationProvider', function (hydrationProvider) {
    hydrationProvider.registerHydrate('document', ['documentApi', function (documentApi) {
        return function (obj, type, options) {
            return documentApi.findDocument({key: obj.documentId, options: {one: true, hydrateRemote: options.remoteHydration}});
        }
    }]);

    hydrationProvider.registerDehydrate('document', ['documentApi', function (documentApi) {
        return function (obj, type) {
            return documentApi.createDocument({template: 'documents', data: obj.document, options: {replace: obj.$complete, complete: obj.$complete, dirty: false}});
        }
    }]);

    this.$get = ['api', 'hydration', function (api, hydration) {
        var hydrateRelations = ['organization'];
        var dehydrateRelations = [];
        var documentApi = api({
            plural: 'documents',
            singular: 'document',
            strip: ['organization', 'tasks'],
            hydrate: function (obj, options) {
                options.hydrate = (options.hydrate instanceof Array ? options.hydrate : (options.hydrate === true ? hydrateRelations : []));
                return hydration.hydrate(obj, 'document', options);
            },
            dehydrate: function (obj, options) {
                options.dehydrate = (options.dehydrate instanceof Array ? options.dehydrate : (options.dehydrate === false ? [] : dehydrateRelations));
                return hydration.dehydrate(obj, 'document', options);
            }
        });

        return {
            getDocuments: documentApi.getItems,
            createDocument: documentApi.createItem,
            getDocument: documentApi.getItem,
            findDocument: documentApi.findItem,
            updateDocument: documentApi.updateItem,
            postDocument: documentApi.postItem,
            deleteDocument: documentApi.deleteItem,
            purgeDocument: documentApi.purgeItem
        };
    }];
}]);

mobileSdkApiApp.provider('activityApi', ['hydrationProvider', function (hydrationProvider) {
    hydrationProvider.registerHydrate('activities', ['activityApi', 'connectionService', function (activityApi, connectionService) {
        return function (obj, type) {
            return activityApi.getActivities({template: 'activities/:id', schema: {id: obj.$id}, options: {fallbackRemote: connectionService.isOnline()}});
        }
    }]);

    this.$get = ['api', function (api) {
        var activityApi = api({
            plural: 'activities',
            singular: 'activity'
        });

        return {
            getActivities: activityApi.getItems,
            createActivity: activityApi.createItem,
            getActivity: activityApi.getItem,
            deleteActivity: activityApi.deleteItem
        };
    }];
}]);

mobileSdkApiApp.provider('enterpriseBudgetApi', ['hydrationProvider', function (hydrationProvider) {
    hydrationProvider.registerHydrate('budget', ['enterpriseBudgetApi', function (enterpriseBudgetApi) {
        return function (obj, type, options) {
            if (obj.budgetUuid) {
                return enterpriseBudgetApi.findEnterpriseBudget({column: 'data', key: obj.budgetUuid, options: {like: true, one: true}});
            } else {
                return enterpriseBudgetApi.findEnterpriseBudget({key: obj.budgetId, options: {one: true}});
            }
        }
    }]);

    hydrationProvider.registerDehydrate('budget', ['enterpriseBudgetApi', function (enterpriseBudgetApi) {
        return function (obj, type) {
            return enterpriseBudgetApi.createEnterpriseBudget({template: 'budgets', data: obj.budget, options: {replace: obj.$complete, complete: obj.$complete, dirty: false}});
        }
    }]);

    this.$get = ['api', function (api) {
        var budgetApi = api({
            plural: 'budgets',
            singular: 'budget'
        });

        return {
            getEnterpriseBudgets: budgetApi.getItems,
            createEnterpriseBudget: budgetApi.createItem,
            getEnterpriseBudget: budgetApi.getItem,
            findEnterpriseBudget: budgetApi.findItem,
            updateEnterpriseBudget: budgetApi.updateItem,
            postEnterpriseBudget: budgetApi.postItem,
            deleteEnterpriseBudget: budgetApi.deleteItem,
            purgeEnterpriseBudget: budgetApi.purgeItem
        };
    }];
}]);

mobileSdkApiApp.factory('expenseApi', ['api', 'hydration', 'promiseService', 'underscore', function (api, hydration, promiseService, underscore) {
    var defaultRelations = ['document', 'organization'];
    var expenseApi = api({
        plural: 'expenses',
        singular: 'expense',
        strip: ['document', 'organization', 'user'],
        hydrate: function (obj, options) {
            options.hydrate = (options.hydrate instanceof Array ? options.hydrate : (options.hydrate === true ? defaultRelations : []));
            return hydration.hydrate(obj, 'expense', options);
        },
        dehydrate: function (obj, options) {
            return promiseService.wrap(function (promise) {
                promise.resolve(underscore.omit(obj, options.dehydrate || defaultRelations));
            });
        }
    });

    return {
        getExpenses: expenseApi.getItems,
        createExpense: expenseApi.createItem,
        getExpense: expenseApi.getItem,
        findExpense: expenseApi.findItem,
        updateExpense: expenseApi.updateItem,
        postExpense: expenseApi.postItem,
        purgeExpense: expenseApi.purgeItem
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

mobileSdkApiApp.provider('productionScheduleApi', ['hydrationProvider', function (hydrationProvider) {
    hydrationProvider.registerHydrate('productionSchedules', ['productionScheduleApi', function (productionScheduleApi) {
        return function (obj, type) {
            return productionScheduleApi.getProductionSchedules({id: obj.$id});
        }
    }]);

    hydrationProvider.registerDehydrate('productionSchedules', ['productionScheduleApi', 'promiseService', function (productionScheduleApi, promiseService) {
        return function (obj, type) {
            var objId = (obj.$id !== undefined ? obj.$id : obj.id);

            return productionScheduleApi.purgeProductionSchedule({template: 'production-schedules/:id', schema: {id: objId}, options: {force: false}})
                .then(function () {
                    return promiseService.arrayWrap(function (promises) {
                        angular.forEach(obj.productionSchedules, function (schedule) {
                            promises.push(productionScheduleApi.createProductionSchedule({template: 'production-schedules/:id', schema: {id: objId}, data: schedule, options: {replace: obj.$complete, complete: obj.$complete, dirty: false}}));
                        });
                    });
                }, promiseService.throwError);
        }
    }]);

    this.$get = ['api', 'hydration', 'promiseService', 'underscore', function (api, hydration, promiseService, underscore) {
        var dehydrateRelations = ['asset', 'budget', 'organization'];
        var hydrateRelations = ['budget'];
        var productionScheduleApi = api({
            plural: 'production-schedules',
            singular: 'production-schedule',
            strip: dehydrateRelations,
            hydrate: function (obj, options) {
                options.hydrate = (options.hydrate instanceof Array ? options.hydrate : (options.hydrate === true ? hydrateRelations : []));
                return hydration.hydrate(obj, 'production-schedule', options);
            },
            dehydrate: function (obj, options) {
                return promiseService.wrap(function (promise) {
                    promise.resolve(underscore.omit(obj, options.dehydrate || dehydrateRelations));
                });
            }
        });

        return {
            getProductionSchedules: productionScheduleApi.getItems,
            createProductionSchedule: productionScheduleApi.createItem,
            getProductionSchedule: productionScheduleApi.getItem,
            findProductionSchedule: productionScheduleApi.findItem,
            updateProductionSchedule: productionScheduleApi.updateItem,
            postProductionSchedule: productionScheduleApi.postItem,
            deleteProductionSchedule: productionScheduleApi.deleteItem,
            purgeProductionSchedule: productionScheduleApi.purgeItem
        };
    }];
}]);