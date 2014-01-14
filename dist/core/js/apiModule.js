var coreApiApp = angular.module('ag.core.api', ['ag.core.utilities', 'ag.core.data', 'ag.phone.storage']);

var _errors = {
    TypeParamRequired: {code: 'TypeParamRequired', message: 'Type parameter is required'},
    UploadPhotoError: {code: 'UploadPhotoError', message: 'Error occured uploading photo'}
};


/*
 * Syncronization
 */
coreApiApp.factory('dataUploadService', ['promiseMonitor', 'promiseService', 'farmerApi', 'farmApi', 'assetApi', 'documentApi', 'taskApi',
    function (promiseMonitor, promiseService, farmerApi, farmApi, assetApi, documentApi, taskApi) {
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
                                            .all(_postFarms(farmer.id), _postAssets(farmer.id))
                                            .then(promise.resolve, promise.reject);
                                    });
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
                                if (asset.dirty === true) {
                                    list.push(assetApi.postAsset({data: asset}));
                                }

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
                                list.push(promiseService.wrap(function(promise) {
                                    _postDocument(document).then(function () {
                                        _postTasks(document.id).then(promise.resolve, promise.reject);
                                    });
                                }));
                            });
                        })
                        .then(defer.resolve, defer.reject);
                });
            }));
        }

        function _postDocument (document) {
            return _monitor.add(promiseService.wrap(function (defer) {
                if (document.dirty === true) {
                    documentApi.postDocument({data: document}).then(defer.resolve, defer.reject);
                } else {
                    defer.resolve();
                }
            }));
        }

        function _postTasks (did) {
            return _monitor.add(promiseService.wrap(function (defer) {
                taskApi.getTasks({template: 'document/:id/tasks', schema: {id: did}}).then(function (tasks) {
                    promiseService
                        .arrayWrap(function (list) {
                            angular.forEach(tasks, function (task) {
                                if (task.dirty === true) {
                                    list.push(taskApi.postTask({template: 'task/:id', schema: {id: task.id}, data: task}));
                                }
                            });
                        })
                        .then(defer.resolve, defer.reject);
                });
            }));
        }

        return function (monitor) {
            _monitor = monitor || promiseMonitor();

            return promiseService.wrap(function(promise) {
                _getFarmers()
                    .then(function () {
                        return _getDocuments();
                    }).then(promise.resolve, promise.reject);
            });
        }
    }]);

coreApiApp.factory('dataDownloadService', ['promiseMonitor', 'promiseService', 'farmerApi', 'farmApi', 'assetApi', 'documentUtility',
    function (promiseMonitor, promiseService, farmerApi, farmApi, assetApi, documentUtility) {
        var _monitor = null;
        var _readOptions = {readLocal: false, readRemote: true};

        function _getFarmers() {
            return _monitor.add(promiseService.wrap(function (defer) {
                farmerApi.getFarmers({options: _readOptions}).then(function (farmers) {
                    return promiseService.arrayWrap(function (list) {
                        angular.forEach(farmers, function (farmer) {
                            list.push(_getFarms(farmer.id), _getAssets(farmer.id));
                        });
                    });
                }, defer.reject).then(defer.resolve, defer.reject);
            }));
        }

        function _getAssets(fid) {
            return _monitor.add(promiseService.wrap(function (defer) {
                assetApi.getAssets({id: fid, options: _readOptions}).then(defer.resolve, defer.reject);
            }));
        }

        function _getFarms(fid) {
            return _monitor.add(promiseService.wrap(function (defer) {
                farmApi.getFarms({id: fid, options: _readOptions}).then(defer.resolve, defer.reject);
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

        return function (monitor) {
            _monitor = monitor || promiseMonitor();

            return promiseService.wrap(function(promise) {
                _getFarmers()
                    .then(function () {
                        return _getDocuments();
                    }).then(promise.resolve, promise.reject);
            });
        };
    }]);

coreApiApp.factory('dataSyncService', ['promiseMonitor', 'promiseService', 'dataUploadService', 'dataDownloadService', function (promiseMonitor, promiseService, dataUploadService, dataDownloadService) {
    var _monitor = null;

    return function (callback) {
        _monitor = promiseMonitor(callback);

        _monitor.add(promiseService.wrap(function (promise) {
            dataUploadService(_monitor)
                .then(function () {
                    return dataDownloadService(_monitor);
                }, promise.reject)
                .then(promise.resolve, promise.reject);
        }));
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
                    _itemStore.transaction(function (tx) {
                        tx.createItems({template: req.template, schema: req.schema, data: req.data, options: req.options, callback: promise});
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
                        tx.findItems({key: req.key, column: req.column, callback: promise});
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
coreApiApp.factory('documentUtility', ['promiseService', 'documentApi', 'farmerApi', 'taskApi', function (promiseService, documentApi, farmerApi, taskApi) {
    return {
        hydration: {
            /**
             * @name Resolve all related dependencies to document
             * @param document
             */
            hydrate: function (document) {
                return promiseService.wrap(function (promise) {
                    promiseService
                        .objectWrap(function (promises) {
                            if (document.data.farmer_id) {
                                promises.farmer = farmerApi.findFarmer({key: document.data.farmer_id});
                            }

                            promises.tasks = taskApi.getTasks({template: 'document/:id/tasks', schema: {id: document.id}});
                        })
                        .then(function (result) {
                            promise.resolve(_.extend(document, result));
                        }, promise.reject);
                });
            },
            dehydrate: function (document) {
                return promiseService.wrap(function (promise) {
                    promiseService
                        .arrayWrap(function (promises) {
                            if (document.data.farmer_id && document.data.farmer) {
                                promises.push(farmerApi.createFarmer({data: document.data.farmer, options: {replace: false, dirty: false}}));
                            }

                            if (document.data.tasks) {
                                angular.forEach(document.data.tasks, function (task) {
                                    promises.push(taskApi.createTask({template: 'document/:id/tasks', schema: {id: document.id}, data: task, options: {replace: false, dirty: false}}));
                                });
                            }
                        })
                        .then(function () {
                            delete document.data.farmer;
                            delete document.data.tasks;

                            documentApi.updateDocument({data: document, options: {dirty: false}}).then(function () {
                                promise.resolve(document);
                            }, promise.reject);
                        }, promise.reject);
                });
            }
        },
        api: documentApi
    };
}]);

coreApiApp.factory('documentApi', ['api', function (api) {
    var documentStore = api({plural: 'documents', singular: 'document'});

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

/*
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
*/