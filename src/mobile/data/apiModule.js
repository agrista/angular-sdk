var mobileSdkApiApp = angular.module('ag.mobile-sdk.api', ['ag.sdk.utilities', 'ag.sdk.monitor', 'ag.mobile-sdk.data', 'ag.mobile-sdk.cordova.storage']);

var _errors = {
    TypeParamRequired: {code: 'TypeParamRequired', message: 'Type parameter is required'},
    UploadPhotoError: {code: 'UploadPhotoError', message: 'Error occured uploading photo'}
};


/*
 * Syncronization
 */
mobileSdkApiApp.factory('dataUploadService', ['promiseMonitor', 'promiseService', 'farmerApi', 'farmApi', 'assetApi', 'documentApi', 'taskApi', 'attachmentApi',
    function (promiseMonitor, promiseService, farmerApi, farmApi, assetApi, documentApi, taskApi, attachmentApi) {
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
                                            .all([_postFarms(farmer.id), _postAssets(farmer.id)])
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
                                    taskApi.getTasks({template: 'task/:id/tasks', schema: {id: task.id}}).then(function (subtasks) {
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

        function _postFarmer (farmer) {
            return _monitor.add(promiseService.wrap(function (defer) {
                if (farmer.dirty === true) {
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
                                if (farm.dirty === true) {
                                    list.push(farmApi.postFarm({data: farm}));
                                }

                            });
                        })
                        .then(defer.resolve, defer.reject);
                });
            }));
        }

        function _postAssets (fid) {
            return _monitor.add(promiseService.wrap(function (defer) {
                assetApi.getAssets({id: fid}).then(function (assets) {
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
                if (asset.dirty === true) {
                    assetApi.postAsset({data: asset})
                        .then(function (res) {
                            if (res && res.length == 1) {
                                _postAttachments('asset', asset.id, res[0].id).then(defer.resolve, defer.reject);
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
                if (document.dirty === true) {
                    documentApi.postDocument({data: document})
                        .then(function (res) {
                            if (res && res.length == 1) {
                                _postAttachments('document', document.id, res[0].id).then(defer.resolve, defer.reject);
                            } else {
                                defer.resolve();
                            }
                        }, defer.reject)
                } else {
                    defer.resolve();
                }
            }));
        }

        function _postAttachments (type, oldId, newId) {
            return _monitor.add(promiseService.wrap(function (defer) {
                attachmentApi.getAttachments({template: type + '/:id/attachments', schema: {id: oldId}}).then(function (attachments) {
                    promiseService
                        .arrayWrap(function (list) {
                            angular.forEach(attachments, function (attachment) {
                                if (attachment.dirty === true) {
                                    attachment.uri = type + '/' + newId + '/attachments';

                                    list.push(attachmentApi.postAttachment({template: type + '/:id/attach', schema: {id: newId}, data: attachment}));
                                }
                            });
                        })
                        .then(defer.resolve, defer.reject);
                });
            }));
        }

        function _postTask (task) {
            return _monitor.add(promiseService.wrap(function (defer) {
                if (task.dirty === true) {
                    taskApi.postTask({template: 'task/:id', schema: {id: task.id}, data: task}).then(defer.resolve, defer.reject);
                } else {
                    defer.resolve();
                }
            }));
        }

        return function (monitor) {
            _monitor = monitor || promiseMonitor();

            return promiseService.wrap(function(promise) {
                _getFarmers()
                    .then(_getDocuments)
                    .then(_getTasks)
                    .then(promise.resolve, promise.reject);
            });
        }
    }]);

mobileSdkApiApp.factory('dataDownloadService', ['promiseMonitor', 'promiseService', 'farmApi', 'assetUtility', 'farmerUtility', 'documentUtility', 'taskUtility',
    function (promiseMonitor, promiseService, farmApi, assetUtility, farmerUtility, documentUtility, taskUtility) {
        var _monitor = null;
        var _readOptions = {readLocal: false, readRemote: true};

        function _getFarmers() {
            return _monitor.add(promiseService.wrap(function (defer) {
                farmerUtility.api
                    .getFarmers({options: _readOptions})
                    .then(function (farmers) {
                        return promiseService.arrayWrap(function (list) {
                            angular.forEach(farmers, function (farmer) {
                                list.push(farmerUtility.hydration.dehydrate(farmer), _getFarms(farmer.id), _getAssets(farmer.id));
                            });
                        });
                    }, defer.reject)
                    .then(defer.resolve, defer.reject);
            }));
        }

        function _getAssets(fid) {
            return _monitor.add(promiseService.wrap(function (defer) {
                assetUtility.api.getAssets({id: fid, options: _readOptions})
                    .then(function (assets) {
                        return promiseService.arrayWrap(function (list) {
                            angular.forEach(assets, function (asset) {
                                list.push(assetUtility.hydration.dehydrate(asset));
                            });
                        });
                    }, defer.reject)
                    .then(defer.resolve, defer.reject);
            }));
        }

        function _getFarms(fid) {
            return _monitor.add(farmApi.getFarms({id: fid, options: _readOptions}));
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

        function _getDocument(did, options) {
            options = options || _readOptions;

            return _monitor.add(documentUtility.api.getDocument({id: did, options: options}));
        }

        function _getTasks() {
            return _monitor.add(promiseService.wrap(function (defer) {
                taskUtility.api
                    .getTasks({options: _readOptions})
                    .then(function (tasks) {
                        return promiseService.arrayWrap(function (promises) {
                            angular.forEach(tasks, function (task) {
                                promises.push(_getDocument(task.data.documentId, {readLocal: true, fallbackRemote: true}));
                                promises.push(taskUtility.hydration.dehydrate(task));
                            })
                        });
                    }, defer.reject)
                    .then(defer.resolve, defer.reject);
            }));
        }

        return function (monitor) {
            _monitor = monitor || promiseMonitor();

            return promiseService.wrap(function(promise) {
                _getFarmers()
                    .then(_getDocuments)
                    .then(_getTasks)
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
mobileSdkApiApp.factory('api', ['promiseService', 'dataStore', function (promiseService, dataStore) {
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
             * @param req.options {Object} Optional
             * @returns {Promise}
             */
            createItem: function (req) {
                req = req || {};

                return promiseService.wrap(function (promise) {
                    if (req.data) {
                        _itemStore.transaction(function (tx) {
                            tx.createItems({template: req.template, schema: req.schema, data: req.data, options: req.options, callback: promise});
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
                            tx.updateItems({data: req.data, options: req.options, callback: promise});
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
                            tx.postItems({template: req.template, schema: req.schema, data: req.data, callback: promise});
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
                            tx.removeItems({template: naming.singular + '/:id/delete', data: req.data, callback: promise});
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
    var taskApi = api({plural: 'tasks', singular: 'task'});

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
    var farmerApi = api({plural: 'farmers', singular: 'farmer'});

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
    var entityApi = api({plural: 'legalentities', singular: 'legalentity'});

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
    var assetApi = api({plural: 'assets', singular: 'asset'});

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
    var documentStore = api({plural: 'documents', singular: 'document'});

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

mobileSdkApiApp.factory('attachmentApi', ['$http', 'api', 'configuration', 'dataStoreUtilities', 'promiseService', 'fileStorageService', function ($http, api, configuration, dataStoreUtilities, promiseService, fileStorageService) {
    var attachmentStore = api({plural: 'attachments', singular: 'attachment'});

    return {
        getAttachments: attachmentStore.getItems,
        createAttachment: attachmentStore.createItem,
        getAttachment: attachmentStore.getItem,
        findAttachment: attachmentStore.findItem,
        updateAttachment: attachmentStore.updateItem,
        postAttachment: function (req) {
            req = req || {};

            return promiseService.wrap(function (promise) {
                if (req.data) {
                    var attachment = req.data;
                    var uri = 'api/' + (req.template !== undefined ? dataStoreUtilities.parseRequest(req.template, req.schema) : attachment.uri);

                    fileStorageService.read(attachment.data.src, true)
                        .then(function (fileData) {
                            // Set content
                            var upload = {
                                archive: angular.copy(attachment.data)
                            };

                            upload.archive.content = fileData.content.substring(fileData.content.indexOf(',') + 1);

                            return $http.post(configuration.getServer() + uri, upload, {withCredentials: true});
                        }, promise.reject)
                        .then(function () {
                            console.log('update attachment');
                            attachment.local = false;

                            attachmentStore.updateItem({data: attachment, options: {dirty: false}}).then(promise.resolve, promise.reject);
                        }, promise.reject);
                } else {
                    promise.reject();
                }
            });
        },
        deleteAttachment: function (req) {
            req = req || {
                data: {}
            };
            req.data.local = true;

            return attachmentStore.deleteItem(req);
        },
        purgeAttachment: attachmentStore.purgeItem
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


/*
 * Handlers
 */
mobileSdkApiApp.factory('hydration', ['promiseService', 'taskApi', 'farmerApi', 'farmApi', 'assetApi', 'documentApi', 'attachmentApi', 'legalEntityApi',
    function (promiseService, taskApi, farmerApi, farmApi, assetApi, documentApi, attachmentApi, legalEntityApi) {
        // TODO: Allow for tree of hydrations/dehydrations (e.g. Farmer -> LegalEntities -> Assets)

        var _relationTable = {
            organization: {
                many: false,
                hydrate: function (obj, type) {
                    return farmerApi.findFarmer({key: obj.data.organizationId});
                },
                dehydrate: function (obj, type) {
                    return farmerApi.createFarmer({data: obj.data.organization, options: {replace: false, dirty: false}});
                }
            },
            farms: {
                many: true,
                hydrate: function (obj, type) {
                    return farmApi.getFarms({id: obj.id});
                },
                dehydrate: function (obj, type) {
                    return promiseService.wrap(function (promise) {
                        farmApi.purgeFarm({template: 'farms/:id', schema: {id: obj.id}, options: {force: false}})
                            .then(function () {
                                promiseService.arrayWrap(function (promises) {
                                    angular.forEach(obj.data.farms, function (farm) {
                                        promises.push(farmApi.createFarm({template: 'farms/:id', schema: {id: obj.id}, data: farm, options: {replace: false, dirty: false}}));
                                    });
                                }).then(promise.resolve, promise.reject);
                            }, promise.reject);
                    });
                }
            },
            assets: {
                many: true,
                hydrate: function (obj, type) {
                    return assetApi.getAssets({id: obj.id});
                },
                dehydrate: function (obj, type) {
                    return promiseService.wrap(function (promise) {
                        assetApi.purgeAsset({template: 'assets/:id', schema: {id: obj.id}, options: {force: false}})
                            .then(function () {
                                promiseService.arrayWrap(function (promises) {
                                    angular.forEach(obj.data.assets, function (asset) {
                                        promises.push(assetApi.createAsset({template: 'assets/:id', schema: {id: obj.id}, data: asset, options: {replace: false, dirty: false}}));
                                    });
                                }).then(promise.resolve, promise.reject);
                            }, promise.reject);
                    });
                }
            },
            legalEntities: {
                many: true,
                hydrate: function (obj, type) {
                    return legalEntityApi.getEntities({id: obj.id});
                },
                dehydrate: function (obj, type) {
                    return promiseService.wrap(function (promise) {
                        legalEntityApi.purgeEntity({template: 'legalentities/:id', schema: {id: obj.id}, options: {force: false}})
                            .then(function () {
                                promiseService.arrayWrap(function (promises) {
                                    angular.forEach(obj.data.legalEntities, function (entity) {
                                        delete entity.assets;

                                        promises.push(legalEntityApi.createEntity({template: 'legalentities/:id', schema: {id: obj.id}, data: entity, options: {replace: false, dirty: false}}));
                                    });
                                }).then(promise.resolve, promise.reject);
                            }, promise.reject);
                    });
                }
            },
            document: {
                many: false,
                hydrate: function (obj, type) {
                    return documentApi.findDocument({key: obj.data.documentId});
                },
                dehydrate: function (obj, type) {
                    return documentApi.createDocument({data: obj.data.document, options: {replace: false, dirty: false}});
                }
            },
            attachments: {
                many: true,
                hydrate: function (obj, type) {
                    return attachmentApi.getAttachments({template: type + '/:id/attachments', schema: {id: obj.id}});
                },
                dehydrate: function (obj, type) {
                    return promiseService.wrap(function (promise) {
                        attachmentApi.purgeAttachment({template: type + '/:id/attachments', schema: {id: obj.id}, options: {force: false}})
                            .then(function () {
                                promiseService.arrayWrap(function (promises) {
                                    angular.forEach(obj.data.data.attachments, function (attachment) {
                                        promises.push(attachmentApi.createAttachment({template: type + '/:id/attachments', schema: {id: obj.id}, data: attachment, options: {replace: false, dirty: false}}));
                                    });
                                }).then(promise.resolve, promise.reject);
                            }, promise.reject);
                    });
                }
            },
            subtasks: {
                many: true,
                hydrate: function (obj, type) {
                    return taskApi.getTasks({template: 'task/:id/tasks', schema: {id: obj.id}});
                },
                dehydrate: function (obj, type) {
                    return promiseService.wrap(function (promise) {
                        taskApi.purgeTask({template: 'task/:id/tasks', schema: {id: obj.id}, options: {force: false}})
                            .then(function () {
                                promiseService.arrayWrap(function (promises) {
                                    angular.forEach(obj.data.subtasks, function (subtask) {
                                        promises.push(taskApi.createTask({template: 'task/:id/tasks', schema: {id: obj.id}, data: subtask, options: {replace: false, dirty: false}}));
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
                        angular.forEach(results, function (result, relationName) {
                            var relation = _relationTable[relationName];

                            if (relation && relation.many === false) {
                                results[relationName] = (result.length == 1 ? result[0] : undefined);
                            }
                        });

                        promise.resolve(_.extend(obj, results));
                    }, promise.reject);
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
                            delete obj.data[relationName];
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
    var _relations = ['farms', 'assets', 'legalEntities'];

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

                angular.forEach(farmer.data.teams, function (team, i) {
                    if (typeof team === 'object') {
                        farmer.data.teams[i] = team.name;
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
    var _relations = ['attachments'];

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
    var _relations = ['organization', 'attachments'];

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
                    delete document.data.tasks;

                    documentApi.updateDocument({data: document, options: {dirty: false}});
                })
            }
        },
        api: documentApi
    };
}]);
