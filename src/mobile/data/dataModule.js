var mobileSdkDataApp = angular.module('ag.mobile-sdk.data', ['ag.sdk.utilities', 'ag.sdk.config', 'ag.sdk.monitor', 'ag.sdk.library']);

/**
 * @name dataPurgeService
 */
mobileSdkDataApp.provider('dataPurge', function () {
    this.$get = ['promiseService', 'dataStore', function (promiseService, dataStore) {
        return function purge(dataStoreList) {
            return promiseService.wrapAll(function(promises) {
                angular.forEach(dataStoreList, function (item) {
                    promises.push(dataStore(item).transaction()
                        .then(function (tx) {
                            return tx.purgeItems();
                        }));
                });
            });
        }
    }];
});

mobileSdkDataApp.constant('dataStoreConstants', {
    NoStoreParams: {code: 'NoStoreParams', message: 'No DataStore parameters defined'},
    NoConfigDBNameParams: {code: 'NoConfigDBNameParams', message: 'No Config database name defined'},
    NoConfigAPIParams: {code: 'NoConfigAPIParams', message: 'No Config API parameters defined'},
    NoConfigPagingParams: {code: 'NoConfigPagingParams', message: 'No Config Paging parameters defined'},
    NoReadParams: {code: 'NoReadParams', message: 'No DataRead parameters defined'},
    NoPagingDefined: {code: 'NoPagingDefined', message: 'No Paging parameters have been defined in config'},
    LocalDataStoreError: {code: 'LocalDataStoreError', message: 'Can not perform action on local data store'},
    RemoteDataStoreError: {code: 'RemoteDataStoreError', message: 'Can not perform action on remote data store'},
    RemoteNoDataError: {code: 'RemoteNoDataError', message: 'No data response from remote store'}
});

mobileSdkDataApp.factory('dataStoreUtilities', ['$log', 'dataStoreConstants', 'promiseService', 'underscore', function ($log, dataStoreConstants, promiseService, underscore) {
    function _errorLog (err) {
        if (typeof err === 'string') {
            $log.warn('Error: ' + err);
        } else if (err.message !== undefined) {
            $log.warn('Error: ' + err.message + '(' + err.code + ')');
        } else {
            $log.warn(err);
        }
    }

    return {
        parseRequest: function (templateUrl, schemaData) {
            if (templateUrl !== undefined) {
                angular.forEach(schemaData, function (data, key) {
                    templateUrl = templateUrl.replace('/:' + key, (data !== undefined ? '/' + data : ''));
                });
            }

            return templateUrl;
        },
        generateItemIndex: function () {
            return 2000000000 + Math.round(Math.random() * 147483647);
        },
        injectMetadata: function (item) {
            return underscore.extend((typeof item.data == 'object' ? item.data : JSON.parse(item.data)), {
                __id: item.id,
                __uri: item.uri,
                __dirty: (item.dirty == 1),
                __local: (item.local == 1),
                __saved: true
            });
        },
        extractMetadata: function (item) {
            return {
                id: item.__id,
                uri: item.__uri,
                dirty: item.__dirty,
                local: item.__local,
                data: underscore.omit(item, ['__id', '__uri', '__dirty', '__local', '__saved'])
            };
        },
        transactionPromise: function(db) {
            return promiseService.wrap(function (promise) {
                if (db) {
                    db.transaction(function (res) {
                        promise.resolve(res);
                    }, function (err) {
                        promise.reject(err);
                    });
                } else {
                    promise.reject(dataStoreConstants.LocalDataStoreError);
                }
            });
        },
        executeSqlPromise: function (tx, sql, data) {
            data = data || [];

            return promiseService.wrap(function (promise) {
                if (tx) {
                    tx.executeSql(sql, data, function (tx, res) {
                        promise.resolve(res);
                    }, function (tx, err) {
                        _errorLog(err);

                        promise.reject(err);
                    });
                } else {
                    promise.reject(dataStoreConstants.LocalDataStoreError);
                }
            });
        }
    }
}]);

/**
 * @name dataStore
 */
mobileSdkDataApp.provider('dataStore', ['dataStoreConstants', 'underscore', function (dataStoreConstants, underscore) {
    var _defaultOptions = {
        pageLimit: 10,
        dbName: undefined,

        readLocal: true,
        readRemote: true
    };

    var _localDatabase;

    /**
     * @name dataStoreProvider.config
     * @description dataStoreProvider provider
     * @param url
     * @param options
     */
    this.config = function (options) {
        _defaultOptions = underscore.defaults((options || {}), _defaultOptions);
    };

    /**
     * dataStore service
     * @type {Array}
     */
    this.$get = ['$http', '$log', '$rootScope', 'promiseService', 'safeApply', 'configuration', 'dataStoreUtilities', function ($http, $log, $rootScope, promiseService, safeApply, configuration, dataStoreUtilities) {
        var _hostApi = configuration.getServer() + 'api/';

        var _defaultHydration = function (obj) {
            return promiseService.wrap(function (promise) {
                promise.resolve(obj);
            })
        };

        /**
         * @name _initializeDatabase
         * @param name
         * @returns {Database}
         * @private
         */
        function _initializeDatabase(idCallback) {
            var migrationSteps = [];

            function _processMigration(db) {
                $log.debug('_processMigration');

                if (migrationSteps.length > 0) {
                    var migration = migrationSteps[0];
                    migrationSteps.splice(0, 1);

                    if (migration.current === db.version) {
                        $log.debug('Database (' + db.version + ') has a newer version ' + migration.next);

                        db.changeVersion(migration.current, migration.next, migration.process, function () {
                            idCallback();
                        }, function () {
                            $log.debug('Database version migrated from ' + migration.current + ' to ' + migration.next);
                            _processMigration(db);
                        });
                    } else {
                        _processMigration(db);
                    }
                } else {
                    idCallback(db);
                }
            }

            _processMigration(window.openDatabase(_defaultOptions.dbName, '', _defaultOptions.dbName, 4 * 1048576));
        }

        /**
         * @name DataStore
         * @param name
         * @param config
         * @returns {*} DataStore
         * @constructor
         * @function transaction
         */
        function DataStore(name, config) {
            // Check if instance of DataStore
            if (!(this instanceof DataStore)) {
                return new DataStore(name, config);
            }

            // Validate parameters
            if (typeof name !== 'string') {
                throw new Error(dataStoreConstants.NoStoreParams.msg);
            }

            if (_defaultOptions.dbName === undefined) {
                throw new Error(dataStoreConstants.NoConfigDBNameParams.msg);
            }

            /**
             * Private variables
             * @private

             config = {
                    api: undefined,
                    paging: {
                        template: urlTemplate,
                        schema: schemaTemplate,
                        data: {
                            page: 1,
                            limit: pageLimit
                        }
                    },
                    readLocal: true,
                    readRemote: true
                }
             */
            var _config = underscore.defaults((config || {}), {
                apiTemplate: undefined,
                paging: undefined,
                indexerProperty: 'id',

                readLocal: _defaultOptions.readLocal,
                readRemote: _defaultOptions.readRemote,

                hydrate: _defaultHydration,
                dehydrate: _defaultHydration
            });

            if (_config.paging !== undefined) {
                _config.paging = underscore.defaults(_config.paging, {
                    template: '',
                    schema: {},
                    data: {
                        page: 1,
                        limit: _defaultOptions.pageLimit
                    }
                });
            }

            function _initializeTable() {
                return dataStoreUtilities.transactionPromise(_localDatabase).then(function (tx) {
                    return promiseService.all([
                        dataStoreUtilities.executeSqlPromise(tx, 'CREATE TABLE IF NOT EXISTS ' + name + ' (id INT UNIQUE, uri TEXT, dirty INT DEFAULT 0, local INT DEFAULT 0, data TEXT, updated TIMESTAMP DEFAULT current_timestamp)', []),
                        dataStoreUtilities.executeSqlPromise(tx, 'CREATE TRIGGER IF NOT EXISTS ' + name + '_timestamp AFTER UPDATE ON ' + name + ' BEGIN UPDATE ' + name + '  SET updated = datetime(\'now\') WHERE id = old.id AND uri = old.uri; END', [])
                    ])
                }, promiseService.throwError);
            }

            function _clearTable() {
                return dataStoreUtilities.transactionPromise(_localDatabase).then(function (tx) {
                    return dataStoreUtilities.executeSqlPromise(tx, 'DELETE FROM ' + name, []);
                }, promiseService.throwError);
            }

            /*
             * Utility functions
             */

            function _traceCallback() {
                $log.warn('_traceCallback');
                $log.warn('Arguments: [' + Array.prototype.join.call(arguments, ', ') + ']');
            }

            function _getItemIndex(item, id) {
                if (item[_config.indexerProperty] === undefined) {
                    $log.warn('Configured indexer property not defined');
                }

                return (item[_config.indexerProperty] || item.id || id);
            }

            /*
             * Local data storage
             */

            var _getLocal = function (uri, options) {
                $log.debug('_getLocal');

                return dataStoreUtilities
                    .transactionPromise(_localDatabase)
                    .then(function (tx) {
                        return dataStoreUtilities.executeSqlPromise(tx, 'SELECT * FROM ' + name + ' WHERE uri = ?', [uri]);
                    }, promiseService.throwError)
                    .then(function (res) {
                        return promiseService.wrapAll(function (promises) {
                            for (var i = 0; i < res.rows.length; i++) {
                                promises.push(_config.hydrate(dataStoreUtilities.injectMetadata(res.rows.item(i)), options.hydrate));
                            }
                        });
                    }, promiseService.throwError);
            };

            var _findLocal = function (key, column, options) {
                $log.debug('_findLocal');

                return dataStoreUtilities
                    .transactionPromise(_localDatabase)
                    .then(function (tx) {
                        return dataStoreUtilities.executeSqlPromise(tx, 'SELECT * FROM ' + name + ' WHERE ' + column + ' ' + (options.like ? 'LIKE' : '=') + ' ?', [(options.like ? "%" + key + "%" : key)]);
                    }, promiseService.throwError)
                    .then(function (res) {
                        return promiseService.wrapAll(function (promises) {
                            for (var i = 0; i < res.rows.length; i++) {
                                promises.push(_config.hydrate(dataStoreUtilities.injectMetadata(res.rows.item(i)), options.hydrate));
                            }
                        });
                    }, promiseService.throwError);
            };

            var _syncLocal = function (dataItems, uri, options) {
                $log.debug('_syncLocal');

                return _deleteAllLocal(uri)
                    .then(function () {
                        return _updateLocal(dataItems);
                    }, promiseService.throwError)
                    .then(function () {
                        return _getLocal(uri, options);
                    }, promiseService.throwError);
            };

            var _updateLocal = function (dataItems, options) {
                $log.debug('_updateLocal');

                if ((dataItems instanceof Array) === false) dataItems = [dataItems];

                options = underscore.defaults(options || {}, {
                    replace: true,
                    force: false
                });

                return dataStoreUtilities
                    .transactionPromise(_localDatabase)
                    .then(function (tx) {
                        return promiseService
                            .wrapAll(function (promises) {
                                angular.forEach(dataItems, function (dataItem) {
                                    var item = dataStoreUtilities.extractMetadata(dataItem);
                                    var dataString = JSON.stringify(item.data);
                                    var resolveItem = function () {
                                        return _config.hydrate(dataItem, options.hydrate);
                                    };

                                    item.dirty = (options.dirty === true ? true : item.dirty);

                                    promises.push(dataStoreUtilities
                                        .executeSqlPromise(tx, 'INSERT INTO ' + name + ' (id, uri, data, dirty, local) VALUES (?, ?, ?, ?, ?)', [item.id, item.uri, dataString, (item.dirty ? 1 : 0), (item.local ? 1 : 0)])
                                        .then(resolveItem, function () {
                                            if (options.replace === true) {
                                                if (item.dirty === true || item.local === true || options.force) {
                                                    return dataStoreUtilities
                                                        .executeSqlPromise(tx, 'UPDATE ' + name + ' SET uri = ?, data = ?, dirty = ?, local = ? WHERE id = ?', [item.uri, dataString, (item.dirty ? 1 : 0), (item.local ? 1 : 0), item.id])
                                                        .then(resolveItem);
                                                } else {
                                                    return dataStoreUtilities
                                                        .executeSqlPromise(tx, 'UPDATE ' + name + ' SET uri = ?, data = ?, dirty = ?, local = ? WHERE id = ? AND dirty = 0 AND local = 0', [item.uri, dataString, (item.dirty ? 1 : 0), (item.local ? 1 : 0), item.id])
                                                        .then(resolveItem);
                                                }
                                            }

                                            return null;
                                        }));
                                });
                            });
                    }, promiseService.throwError);
            };

            var _deleteLocal = function (dataItems) {
                $log.debug('_deleteLocal');
                if ((dataItems instanceof Array) === false) dataItems = [dataItems];

                return dataStoreUtilities
                    .transactionPromise(_localDatabase)
                    .then(function (tx) {
                        return promiseService.wrapAll(function (promises) {
                            angular.forEach(dataItems, function (dataItem) {
                                var item = dataStoreUtilities.extractMetadata(dataItem);

                                promises.push(dataStoreUtilities.executeSqlPromise(tx, 'DELETE FROM ' + name + ' WHERE id = ? AND uri = ?', [item.id, item.uri]));
                            });
                        });
                    }, promiseService.throwError)
                    .then(function () {
                        return dataItems;
                    }, promiseService.throwError);
            };

            var _deleteAllLocal = function (uri, options) {
                $log.debug('_deleteAllLocal');

                options = underscore.defaults((options || {}), {
                    force: false
                });

                return dataStoreUtilities
                    .transactionPromise(_localDatabase)
                    .then(function (tx) {
                        if (options.force === true) {
                            $log.debug('_deleteAllLocal force');
                            return dataStoreUtilities.executeSqlPromise(tx, 'DELETE FROM ' + name + ' WHERE uri = ?', [uri]);
                        }

                        $log.debug('_deleteAllLocal not force');
                        return dataStoreUtilities.executeSqlPromise(tx, 'DELETE FROM ' + name + ' WHERE uri = ? AND local = ? AND dirty = ?', [uri, 0, 0]);
                    });
            };

            /*
             * Remote data storage
             */

            var _getRemote = function (uri, paging) {
                $log.debug('_getRemote');

                return promiseService
                    .wrap(function (promise) {
                        if (_config.apiTemplate !== undefined) {
                            $http.get(_hostApi + uri, {params: paging, withCredentials: true})
                                .then(function (res) {
                                    return (res && res.data ? (res.data instanceof Array ? res.data : [res.data]) : []);
                                }, promiseService.throwError)
                                .then(function (res) {
                                    return promiseService.wrapAll(function (promises) {
                                        angular.forEach(res, function (item) {
                                            promises.push(_config.dehydrate(dataStoreUtilities.injectMetadata({
                                                id: _getItemIndex(item),
                                                uri: uri,
                                                data: item,
                                                dirty: false,
                                                local: false
                                            }), true));
                                        });
                                    });
                                }, promiseService.throwError)
                                .then(promise.resolve, promise.reject);
                        } else {
                            promise.reject(dataStoreConstants.RemoteDataStoreError);
                        }
                    });
            };

            /**
             * @name _updateRemote
             * @param dataItems
             * @param writeUri
             * @param writeSchema
             * @private
             */
            var _updateRemote = function (dataItems, writeUri, writeSchema) {
                $log.debug('_updateRemote');

                return promiseService.wrap(function (promise) {
                    if (dataItems !== undefined && _config.apiTemplate !== undefined) {
                        if ((dataItems instanceof Array) === false) dataItems = [dataItems];

                        promiseService
                            .wrapAll(function (promises) {
                                angular.forEach(dataItems, function (dataItem) {
                                    var item = dataStoreUtilities.extractMetadata(dataItem);
                                    var uri = item.uri;

                                    if (item.dirty === true) {
                                        if (item.local || writeUri !== undefined) {
                                            if (item.local && item.data[_config.indexerProperty] !== undefined) {
                                                delete item.data[_config.indexerProperty];
                                            }

                                            uri = dataStoreUtilities.parseRequest(writeUri || _config.apiTemplate, underscore.extend(writeSchema, {id: item.local ? undefined : item.id}));
                                        }

                                        promises.push($http.post(_hostApi + uri, item.data, {withCredentials: true})
                                            .then(function (res) {
                                                var postedItem = dataStoreUtilities.injectMetadata({
                                                    id: _getItemIndex(res.data, item.id),
                                                    uri: item.uri,
                                                    data: item.data,
                                                    dirty: false,
                                                    local: false
                                                });

                                                if (item.local == true) {
                                                    postedItem.id = postedItem.__id;

                                                    return _deleteLocal(dataItem).then(function () {
                                                        return postedItem;
                                                    });
                                                }

                                                return postedItem;
                                            }, promiseService.throwError));
                                    }
                                });
                            }, promiseService.throwError)
                            .then(function(results) {
                                return _updateLocal(underscore.compact(results), {force: true});
                            }, promiseService.throwError)
                            .then(promise.resolve, promise.reject);
                    } else {
                        promise.reject(dataStoreConstants.RemoteDataStoreError);
                    }
                });
            };

            /**
             * @name _deleteRemote
             * @param dataItems
             * @param writeUri
             * @param writeSchema
             * @private
             */
            var _deleteRemote = function (dataItems, writeUri, writeSchema) {
                $log.debug('_deleteRemote');

                return promiseService.wrap(function (promise) {
                    if (dataItems !== undefined && writeUri !== undefined) {
                        if ((dataItems instanceof Array) === false) dataItems = [dataItems];

                        promiseService
                            .wrapAll(function (promises) {
                                angular.forEach(dataItems, function (dataItem) {
                                    if (dataItem.local === false) {
                                        var item = dataStoreUtilities.extractMetadata(dataItem);
                                        var uri = dataStoreUtilities.parseRequest(writeUri, underscore.defaults(writeSchema, {id: item.id}));

                                        promises.push($http.post(_hostApi + uri, {withCredentials: true})
                                            .then(function () {
                                                return _deleteLocal(item);
                                            }, promiseService.throwError));
                                    }
                                });
                            }).then(promise.resolve, promise.reject);
                    } else {
                        promise.reject(dataStoreConstants.RemoteDataStoreError);
                    }
                });

            };

            /**
             * Transactions
             */
            var _dataStoreInitialized = false;
            var _transactionQueue = [];

            var _processTransactionQueue = function () {
                if (_dataStoreInitialized && _localDatabase !== undefined) {
                    while (_transactionQueue.length > 0) {
                        var deferredTransaction = _transactionQueue.shift();

                        deferredTransaction.resolve(new DataTransaction());
                    }
                }
            };

            var _responseFormatter = function (data, asArray) {
                return (asArray == false && data instanceof Array && data.length > 0 ? data[0] : data);
            };

            /**
             * @name DataTransaction
             * @returns {*} DataTransaction
             * @constructor
             * @function create
             * @function read
             * @function update
             * @function sync
             * @function delete
             */
            function DataTransaction() {
                if (!(this instanceof DataTransaction)) {
                    return new DataTransaction();
                }

                return {
                    createItems: function (req) {
                        var request = underscore.defaults(req || {}, {
                            template: _config.apiTemplate,
                            schema: {},
                            data: [],
                            options: {}
                        });

                        request.options = underscore.defaults(request.options, {
                            replace: true,
                            force: false,
                            dirty: true
                        });

                        return promiseService
                            .wrapAll(function (promises) {
                                if ((request.data instanceof Array) === false) request.data = [request.data];

                                angular.forEach(request.data, function (data) {
                                    var id = _getItemIndex(data, dataStoreUtilities.generateItemIndex());

                                    promises.push(_config.dehydrate(dataStoreUtilities.injectMetadata({
                                        id: id,
                                        uri: dataStoreUtilities.parseRequest(request.template, underscore.defaults(request.schema, {id: id})),
                                        data: data,
                                        dirty: request.options.dirty,
                                        local: request.options.dirty
                                    }), request.options.dehydrate));
                                });
                            }, promiseService.throwError)
                            .then(function (results) {
                                return _updateLocal(underscore.compact(results), request.options);
                            }, promiseService.throwError)
                            .then(function (results) {
                                return _responseFormatter(results, false);
                            });
                    },
                    getItems: function (req) {
                        var request = underscore.defaults(req || {}, {
                            template: _config.apiTemplate,
                            schema: {},
                            options: {}
                        });

                        request.options = underscore.defaults(request.options, {
                            readLocal: _config.readLocal,
                            readRemote: _config.readRemote,
                            fallbackRemote: false
                        });

                        return promiseService.wrap(function (promise) {
                            var handleRemote = function (_uri) {
                                _getRemote(_uri, request.paging)
                                    .then(function (res) {
                                        if (request.paging === undefined && request.options.readLocal === true) {
                                            _syncLocal(res, _uri, request.options).then(function (res) {
                                                promise.resolve(_responseFormatter(res, true));
                                            }, promise.reject);
                                        } else {
                                            _updateLocal(res, request.options).then(function (res) {
                                                promise.resolve(_responseFormatter(res, true));
                                            }, promise.reject);
                                        }
                                    }, function () {
                                        if (request.options.readLocal === true) {
                                            _updateLocal(res, request.options).then(function (res) {
                                                promise.resolve(_responseFormatter(res, true));
                                            }, promise.reject);
                                        } else {
                                            promise.resolve(_responseFormatter(res, true));
                                        }
                                    });
                            };

                            if (typeof request.schema === 'object') {
                                var _uri = dataStoreUtilities.parseRequest(request.template, request.schema);

                                // Process request
                                if (request.options.readRemote === true) {
                                    handleRemote(_uri);
                                } else {
                                    _getLocal(_uri, request.options).then(function (res) {
                                        if (res.length == 0 && request.options.fallbackRemote === true) {
                                            handleRemote(_uri);
                                        } else {
                                            promise.resolve(res);
                                        }
                                    }, promise.reject);
                                }
                            } else {
                                promise.reject(dataStoreConstants.NoReadParams);
                            }
                        });
                    },
                    findItems: function (req) {
                        var request = underscore.defaults(req || {}, {
                            key: '',
                            column: 'id',
                            options: {}
                        });

                        request.options = underscore.defaults(request.options, {
                            like: false,
                            one: false
                        });

                        return _findLocal(request.key, request.column, request.options).then(function (res) {
                            return _responseFormatter(res, false);
                        }, promiseService.throwError);
                    },
                    updateItems: function (req) {
                        var request = underscore.defaults(req || {}, {
                            data: [],
                            options: {}
                        });

                        request.options = underscore.defaults(request.options, {
                            dirty: true
                        });

                        if ((request.data instanceof Array) === false) request.data = [request.data];

                        return _updateLocal(request.data, request.options).then(function (res) {
                            return _responseFormatter(res, false);
                        }, promiseService.throwError);
                    },
                    postItems: function (req) {
                        var request = underscore.defaults(req || {}, {
                            template: _config.apiTemplate,
                            schema: {},
                            data: []
                        });

                        if ((request.data instanceof Array) === false) request.data = [request.data];

                        return _updateRemote(request.data, request.template, request.schema).then(function (res) {
                            return _responseFormatter(res, false);
                        }, promiseService.throwError);
                    },
                    removeItems: function (req) {
                        var request = underscore.defaults(req || {}, {
                            template: undefined,
                            schema: {},
                            data: []
                        });

                        if ((request.data instanceof Array) === false) request.data = [request.data];

                        return promiseService
                            .wrapAll(function (promises) {
                                angular.forEach(request.data, function (item) {
                                    if (item.__local === true) {
                                        promises.push(_deleteLocal(item));
                                    } else {
                                        promises.push(_deleteRemote(item, request.template, request.schema));
                                    }
                                });
                            }).then(function (res) {
                                return _responseFormatter(res, false);
                            }, promiseService.throwError);
                    },
                    purgeItems: function (req) {
                        var request = underscore.defaults(req || {}, {
                            template: undefined,
                            schema: {},
                            options: {},
                            callback: angular.noop
                        });

                        request.options = underscore.defaults(request.options, {
                            force: true
                        });

                        return promiseService.wrap(function (promise) {
                            if (request.template !== undefined) {
                                var _uri = dataStoreUtilities.parseRequest(request.template, request.schema);

                                _getLocal(_uri, request.options)
                                    .then(function (res) {
                                        var items = underscore.filter(res, function (item) {
                                            return (item.__dirty == false || request.options.force == true);
                                        });

                                        return _deleteLocal(items);
                                    }, promiseService.throwError)
                                    .then(promise.resolve, promise.reject);
                            } else {
                                _clearTable().then(promise.resolve, promise.reject);
                            }
                        });
                    }
                }
            }

            /**
             * Initialize table
             */

            _initializeTable().then(function () {
                $log.debug('table initialized');

                _dataStoreInitialized = true;
                _processTransactionQueue();
            });

            /**
             * Public functions
             */
            return {
                defaults: _defaultOptions,
                config: _config,
                transaction: function () {
                    var defer = promiseService.defer();
                    _transactionQueue.push(defer);

                    _processTransactionQueue();

                    return defer.promise;
                }
            }
        }

        /**
         * Initialize database
         */

        _initializeDatabase(function (db) {
            if (db) {
                _localDatabase = db;

                $log.debug('database initialized');
            }
        });

        /**
         * @name dataStore
         * @description Create a new instance of the DataStore service
         * @param name
         * @param config
         * @returns {DataStore}
         * @constructor
         */
        return function (name, config) {
            return new DataStore(name, config);
        };
    }];
}]);
