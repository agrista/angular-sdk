var mobileSdkApiApp = angular.module('ag.mobile-sdk.api', ['ag.sdk.utilities', 'ag.sdk.monitor', 'ag.mobile-sdk.hydration', 'ag.mobile-sdk.data', 'ag.mobile-sdk.cordova.storage', 'ag.sdk.library']);

var _errors = {
    TypeParamRequired: {code: 'TypeParamRequired', message: 'Type parameter is required'},
    UploadPhotoError: {code: 'UploadPhotoError', message: 'Error occured uploading photo'}
};


/*
 * Syncronization
 */
mobileSdkApiApp.provider('apiSynchronizationService', ['underscore', function (underscore) {
    var _options = {
        models: ['budgets', 'documents', 'expenses', 'farmers', 'tasks', 'organizational-units'],
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

    this.config = function (options) {
        _options = underscore.extend(_options, options);
    }

    this.$get = ['$http', '$log', 'assetApi', 'configuration', 'documentApi', 'enterpriseBudgetApi', 'expenseApi', 'farmApi', 'farmerApi', 'fileStorageService', 'legalEntityApi', 'organizationalUnitApi', 'pagingService', 'promiseService', 'taskApi',
        function ($http, $log, assetApi, configuration, documentApi, enterpriseBudgetApi, expenseApi, farmApi, farmerApi, fileStorageService, legalEntityApi, organizationalUnitApi, pagingService, promiseService, taskApi) {
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
                            if (paging.complete) {
                                taskApi.getTasks({options: {fallbackRemote: true, hydrate: ['organization', 'subtasks']}})
                                    .then(promise.resolve, promise.reject);
                            } else {
                                paging.request().catch(promise.reject);
                            }
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
                    if (farmer.__dirty === true) {
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
                return legalEntityApi.getEntities({id: farmerId, options: _options.local}).then(function (entities) {
                    return promiseService.chain(function (chain) {
                        angular.forEach(entities, function (entity) {
                            if (entity.__dirty === true) {
                                chain.push(function () {
                                    return _postLegalEntity(entity);
                                });
                            }

                            chain.push(function () {
                                return _postAssets(entity.id);
                            });
                        });
                    });
                }, promiseService.throwError);
            }

            function _postLegalEntity (entity) {
                entity.data = entity.data || {};

                var cachedAttachments = (entity.data.attachments ? angular.copy(entity.data.attachments) : []);
                var toBeAttached = underscore.where(cachedAttachments, {local: true});
                entity.data.attachments = underscore.difference(cachedAttachments, toBeAttached);

                return legalEntityApi.postEntity({data: entity}).then(function (result) {
                    return promiseService.chain(function (chain) {
                        angular.forEach(toBeAttached, function (attachment) {
                            chain.push(function () {
                                return _postAttachment('legalentity', result.id, attachment);
                            });
                        });
                    });
                }, promiseService.throwError);
            }

            function _postAssets (entityId) {
                return assetApi.getAssets({id: entityId, options: _options.local}).then(function (assets) {
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
                return documentApi.getDocuments({options: _options.local}).then(function (documents) {
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

                return documentApi.postDocument({data: document}).then(function (result) {
                    return promiseService.chain(function (chain) {
                        angular.forEach(toBeAttached, function (attachment) {
                            chain.push(function () {
                                return _postAttachment('document', result.id, attachment);
                            });
                        });
                    });
                }, promiseService.throwError);
            }

            function _postExpenses () {
                return expenseApi.getExpenses({options: _options.local}).then(function (expenses) {
                    return promiseService.chain(function (chain) {
                        angular.forEach(expenses, function (expense) {
                            if (expense.__dirty === true) {
                                chain.push(function () {
                                    return expenseApi.postExpense({data: expense});
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

                return taskApi.postTask({data: task}).then(function (result) {
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
                        archive: underscore.extend(underscore.omit(attachment, ['src', 'local', 'key', 'sizes']), {
                            filename: fileData.file,
                            content: fileData.content.substring(fileData.content.indexOf(',') + 1)
                        })
                    }, {withCredentials: true})
                }, promiseService.throwError);
            }

            return {
                synchronize: function (models) {
                    models = models || _options.models;

                    var _this = this;

                    return _this.upload(models).then(function () {
                        return _this.download(models);
                    });
                },
                upload: function (models) {
                    models = models || _options.models;

                    return promiseService
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
                        })
                        .catch(promiseService.throwError);
                },
                download: function (models) {
                    models = models || _options.models;

                    return promiseService
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
                        })
                        .catch(promiseService.throwError);
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
            return (options.strip ? underscore.omit(data, options.strip) : data);
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
                req = (req ? angular.copy(req) : {});
                req.options = underscore.defaults(req.options || {}, {one: false});

                return _itemStore.transaction().then(function (tx) {
                    if (req.template) {
                        return tx.getItems({template: req.template, schema: req.schema, options: req.options, params: req.params});
                    } else if (req.search) {
                        req.options.readLocal = false;
                        req.options.readRemote = true;

                        return tx.getItems({template: options.plural + '?search=:query', schema: {query: req.search}, options: req.options, params: req.params});
                    } else if (req.id) {
                        return tx.getItems({template: options.plural + '/:id', schema: {id: req.id}, options: req.options, params: req.params});
                    } else {
                        return tx.getItems({template: options.plural, options: req.options, params: req.params});
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
                req = (req ? angular.copy(req) : {});

                return _itemStore.transaction().then(function (tx) {
                    if (req.data) {
                        return tx.createItems({template: req.template, schema: req.schema, data: req.data, options: req.options});
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
                req = (req ? angular.copy(req) : {});

                return _itemStore.transaction().then(function (tx) {
                    if (req.id) {
                        return tx.getItems({template: req.template, schema: {id: req.id}, options: req.options});
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
                req = (req ? angular.copy(req) : {});

                return _itemStore.transaction().then(function (tx) {
                    if (req.key) {
                        return tx.findItems({key: req.key, column: req.column, options: req.options});
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
                req = (req ? angular.copy(req) : {});

                return _itemStore.transaction().then(function (tx) {
                    if (req.data) {
                        return tx.updateItems({data: _stripProperties(req.data), options: req.options});
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
             * @returns {Promise}
             */
            postItem: function (req) {
                req = (req ? angular.copy(req) : {});

                return _itemStore.transaction().then(function (tx) {
                    if (req.data) {
                        return tx.postItems({template: req.template, schema: req.schema, data: _stripProperties(req.data)});
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
                req = (req ? angular.copy(req) : {});

                return _itemStore.transaction().then(function (tx) {
                    if (req.data) {
                        return tx.removeItems({template: options.singular + '/:id/delete', data: req.data});
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
                req = (req ? angular.copy(req) : {});

                return _itemStore.transaction().then(function (tx) {
                    return tx.purgeItems({template: req.template, schema: req.schema, options: req.options});
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
            return taskApi.getTasks({template: 'tasks/:id', schema: {id: obj.__id}});
        }
    }]);

    hydrationProvider.registerDehydrate('subtasks', ['taskApi', 'promiseService', function (taskApi, promiseService) {
        return function (obj, type) {
            var objId = (obj.__id !== undefined ? obj.__id : obj.id);

            return taskApi.purgeTask({template: 'tasks/:id', schema: {id: objId}, options: {force: false}})
                .then(function () {
                    return promiseService.arrayWrap(function (promises) {
                        angular.forEach(obj.subtasks, function (subtask) {
                            promises.push(taskApi.createTask({template: 'tasks/:id', schema: {id: objId}, data: subtask, options: {replace: obj.__complete, complete: obj.__complete, dirty: false}}));
                        });
                    });
                }, promiseService.throwError);
        }
    }]);

    this.$get = ['api', 'hydration', function (api, hydration) {
        var defaultRelations = ['document', 'organization', 'subtasks'];
        var taskApi = api({
            plural: 'tasks',
            singular: 'task',
            strip: defaultRelations,
            hydrate: function (obj, relations) {
                relations = (relations instanceof Array ? relations : (relations === true ? defaultRelations : []));
                return hydration.hydrate(obj, 'task', relations);
            },
            dehydrate: function (obj, relations) {
                relations = (relations instanceof Array ? relations : (relations === false ? [] : defaultRelations));
                return hydration.dehydrate(obj, 'task', relations);
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

mobileSdkApiApp.factory('merchantApi', ['api', function (api) {
    var merchantApi = api({
        plural: 'merchants',
        singular: 'merchant'
    });

    return {
        getMerchants: merchantApi.getItems,
        createMerchant: merchantApi.createItem,
        getMerchant: merchantApi.getItem,
        updateMerchant: merchantApi.updateItem,
        postMerchant: merchantApi.postItem,
        deleteMerchant: merchantApi.deleteItem
    };
}]);

mobileSdkApiApp.provider('farmerApi', ['hydrationProvider', function (hydrationProvider) {
    hydrationProvider.registerHydrate('organization', ['farmerApi', function (farmerApi) {
        return function (obj, type) {
            return farmerApi.findFarmer({key: obj.organizationId, options: {one: true}});
        }
    }]);

    hydrationProvider.registerDehydrate('organization', ['farmerApi', 'promiseService', function (farmerApi, promiseService) {
        return function (obj, type) {
            return promiseService.wrap(function (promise) {
                if (obj.organization) {
                    obj.organization.id = obj.organization.id || obj.organizationId;

                    farmerApi.createFarmer({template: 'farmers', data: obj.organization, options: {replace: obj.__complete, complete: obj.__complete, dirty: false}}).then(promise.resolve, promise.reject);
                } else {
                    promise.resolve(obj);
                }
            });
        }
    }]);

    this.$get = ['api', 'hydration', function (api, hydration) {
        var defaultRelations = ['farms', 'legalEntities', 'primaryContact'];
        var farmerApi = api({
            plural: 'farmers',
            singular: 'farmer',
            strip: ['farms', 'legalEntities'],
            hydrate: function (obj, relations) {
                relations = (relations instanceof Array ? relations : (relations === true ? defaultRelations : []));
                return hydration.hydrate(obj, 'farmer', relations);
            },
            dehydrate: function (obj, relations) {
                relations = (relations instanceof Array ? relations : (relations === false ? [] : defaultRelations));
                return hydration.dehydrate(obj, 'farmer', relations);
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
        return function (obj, type) {
            return legalEntityApi.findEntity({key: obj.legalEntityId, options: {one: true, hydrate: true}});
        }
    }]);

    hydrationProvider.registerHydrate('legalEntities', ['legalEntityApi', function (legalEntityApi) {
        return function (obj, type) {
            return legalEntityApi.getEntities({id: obj.__id, options: {hydrate: true}});
        }
    }]);

    hydrationProvider.registerHydrate('primaryContact', ['legalEntityApi', 'underscore', function (legalEntityApi, underscore) {
        return function (obj, type) {
            return legalEntityApi.getEntities({id: obj.__id})
                .then(function (entities) {
                    return underscore.findWhere(entities, {isPrimary: true});
                });
        }
    }]);

    hydrationProvider.registerDehydrate('legalEntities', ['legalEntityApi', 'promiseService', function (legalEntityApi, promiseService) {
        return function (obj, type) {
            var objId = (obj.__id !== undefined ? obj.__id : obj.id);

            return legalEntityApi.purgeEntity({template: 'legalentities/:id', schema: {id: objId}, options: {force: false}})
                .then(function () {
                    return promiseService.arrayWrap(function (promises) {
                        angular.forEach(obj.legalEntities, function (entity) {
                            promises.push(legalEntityApi.createEntity({template: 'legalentities/:id', schema: {id: objId}, data: entity, options: {replace: obj.__complete, complete: obj.__complete, dirty: false}}));
                        });
                    });
                }, promiseService.throwError);
        }
    }]);

    this.$get = ['api', 'hydration', function (api, hydration) {
        var defaultRelations = ['assets'];
        var entityApi = api({
            plural: 'legalentities',
            singular: 'legalentity',
            strip: defaultRelations,
            hydrate: function (obj, relations) {
                relations = (relations instanceof Array ? relations : (relations === true ? defaultRelations : []));
                return hydration.hydrate(obj, 'legalentity', relations);
            },
            dehydrate: function (obj, relations) {
                relations = (relations instanceof Array ? relations : (relations === false ? [] : defaultRelations));
                return hydration.dehydrate(obj, 'legalentity', relations);
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
        return function (obj, type) {
            return farmApi.findFarm({key: obj.farmId, options: {one: true}});
        }
    }]);

    hydrationProvider.registerHydrate('farms', ['farmApi', function (farmApi) {
        return function (obj, type) {
            return farmApi.getFarms({id: obj.__id});
        }
    }]);

    hydrationProvider.registerDehydrate('farms', ['farmApi', 'promiseService', function (farmApi, promiseService) {
        return function (obj, type) {
            var objId = (obj.__id !== undefined ? obj.__id : obj.id);

            return farmApi.purgeFarm({template: 'farms/:id', schema: {id: objId}, options: {force: false}})
                .then(function () {
                    return promiseService.arrayWrap(function (promises) {
                        angular.forEach(obj.farms, function (farm) {
                            promises.push(farmApi.createFarm({template: 'farms/:id', schema: {id: objId}, data: farm, options: {replace: obj.__complete, complete: obj.__complete, dirty: false}}));
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
    hydrationProvider.registerHydrate('assets', ['assetApi', function (assetApi) {
        return function (obj, type) {
            return assetApi.getAssets({id: obj.__id});
        }
    }]);

    hydrationProvider.registerDehydrate('assets', ['assetApi', 'promiseService', function (assetApi, promiseService) {
        return function (obj, type) {
            var objId = (obj.__id !== undefined ? obj.__id : obj.id);

            return assetApi.purgeAsset({template: 'assets/:id', schema: {id: objId}, options: {force: false}})
                .then(function () {
                    return promiseService.arrayWrap(function (promises) {
                        angular.forEach(obj.assets, function (asset) {
                            promises.push(assetApi.createAsset({template: 'assets/:id', schema: {id: objId}, data: asset, options: {replace: obj.__complete, complete: obj.__complete, dirty: false}}));
                        });
                    });
                }, promiseService.throwError);
        }
    }]);

    this.$get = ['api', 'hydration', function (api, hydration) {
        var assetApi = api({
            plural: 'assets',
            singular: 'asset',
            strip: ['farm', 'legalEntity'],
            hydrate: function (obj, relations) {
                relations = (relations instanceof Array ? relations : []);
                return hydration.hydrate(obj, 'asset', relations);
            },
            dehydrate: function (obj, relations) {
                relations = (relations instanceof Array ? relations : []);
                return hydration.dehydrate(obj, 'asset', relations);
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

mobileSdkApiApp.provider('documentApi', ['hydrationProvider', function (hydrationProvider) {
    hydrationProvider.registerHydrate('document', ['documentApi', function (documentApi) {
        return function (obj, type) {
            return documentApi.findDocument({key: obj.documentId, options: {one: true}});
        }
    }]);

    hydrationProvider.registerDehydrate('document', ['documentApi', function (documentApi) {
        return function (obj, type) {
            return documentApi.createDocument({template: 'documents', data: obj.document, options: {replace: obj.__complete, complete: obj.__complete, dirty: false}});
        }
    }]);

    this.$get = ['api', 'hydration', function (api, hydration) {
        var defaultRelations = ['organization'];
        var documentApi = api({
            plural: 'documents',
            singular: 'document',
            strip: ['organization', 'tasks'],
            hydrate: function (obj, relations) {
                relations = (relations instanceof Array ? relations : (relations === true ? defaultRelations : []));
                return hydration.hydrate(obj, 'document', relations);
            },
            dehydrate: function (obj, relations) {
                relations = (relations instanceof Array ? relations : (relations === false ? [] : defaultRelations));
                return hydration.dehydrate(obj, 'document', relations);
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

mobileSdkApiApp.factory('activityApi', ['api', function (api) {
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
}]);

mobileSdkApiApp.factory('enterpriseBudgetApi', ['api', function (api) {
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
}]);

mobileSdkApiApp.factory('expenseApi', ['api', 'hydration', 'promiseService', 'underscore', function (api, hydration, promiseService, underscore) {
    var defaultRelations = ['document', 'organization'];
    var expenseApi = api({
        plural: 'expenses',
        singular: 'expense',
        strip: ['document', 'organization', 'user'],
        hydrate: function (obj, relations) {
            relations = (relations instanceof Array ? relations : (relations === true ? defaultRelations : []));
            return hydration.hydrate(obj, 'expense', relations);
        },
        dehydrate: function (obj, relations) {
            return promiseService.wrap(function (promise) {
                promise.resolve(underscore.omit(obj, relations || defaultRelations));
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
