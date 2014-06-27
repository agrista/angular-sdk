var mobileSdkDataApp = angular.module('ag.mobile-sdk.data', ['ag.sdk.utilities', 'ag.sdk.config', 'ag.sdk.monitor']);

/**
 * @name dataPurgeService
 */
mobileSdkDataApp.provider('dataPurge', function () {
    this.$get = ['promiseService', 'dataStore', function (promiseService, dataStore) {
        function _purgeDataStore(name) {
            return promiseService.wrap(function (promise) {
                var store = dataStore(name);

                store.transaction(function (tx) {
                    tx.purgeItems({callback: promise});
                })
            });
        }

        return function purge(dataStoreList) {
            return promiseService.wrapAll(function(promises) {
                for (var i = 0; i < dataStoreList.length; i++) {
                    promises.push(_purgeDataStore(dataStoreList[i]));
                }
            });
        }
    }];
});

mobileSdkDataApp.factory('dataStoreUtilities', ['$log', function ($log) {
    return {
        parseRequest: function (templateUrl, schemaData) {
            $log.debug('Unresolved: ' + templateUrl);

            if (templateUrl !== undefined) {
                angular.forEach(schemaData, function (data, key) {
                    templateUrl = templateUrl.replace('/:' + key, (data !== undefined ? '/' + data : ''));
                });
            }

            $log.debug('Resolved: ' + templateUrl);

            return templateUrl;
        },
        generateItemIndex: function () {
            return 2000000000 + Math.round(Math.random() * 147483647);
        },
        injectMetadata: function (item) {
            return _.extend((typeof item.data == 'object' ? item.data : JSON.parse(item.data)), {
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
                data: _.omit(item, ['__id', '__uri', '__dirty', '__local', '__saved'])
            };
        }
    }
}]);

/**
 * @name dataStore
 */
mobileSdkDataApp.provider('dataStore', [function () {
    var _defaultOptions = {
        pageLimit: 10,
        dbName: undefined,
        readLocal: true,
        readRemote: true
    };

    var _errors = {
        NoStoreParams: {code: 'NoStoreParams', message: 'No DataStore parameters defined'},
        NoConfigDBNameParams: {code: 'NoConfigDBNameParams', message: 'No Config database name defined'},
        NoConfigAPIParams: {code: 'NoConfigAPIParams', message: 'No Config API parameters defined'},
        NoConfigPagingParams: {code: 'NoConfigPagingParams', message: 'No Config Paging parameters defined'},
        NoReadParams: {code: 'NoReadParams', message: 'No DataRead parameters defined'},
        NoPagingDefined: {code: 'NoPagingDefined', message: 'No Paging parameters have been defined in config'},
        LocalDataStoreError: {code: 'LocalDataStoreError', message: 'Can not perform action on local data store'},
        RemoteDataStoreError: {code: 'RemoteDataStoreError', message: 'Can not perform action on remote data store'},
        RemoteNoDataError: {code: 'RemoteNoDataError', message: 'No data response from remote store'}
    };

    var _localDatabase;

    /**
     * @name dataStoreProvider.config
     * @description dataStoreProvider provider
     * @param url
     * @param options
     */
    this.config = function (options) {
        _defaultOptions = _.defaults((options || {}), _defaultOptions);
    };

    /**
     * dataStore service
     * @type {Array}
     */
    this.$get = ['$http', '$log', '$q', '$rootScope', 'safeApply', 'configuration', 'dataStoreUtilities', function ($http, $log, $q, $rootScope, safeApply, configuration, dataStoreUtilities) {
        var _hostApi = configuration.getServer() + 'api/';

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

                        db.changeVersion(migration.current, migration.next, migration.process, _errorCallback, function () {
                            $log.debug('Database version migrated from ' + migration.current + ' to ' + migration.next);
                            _processMigration(db);
                        });
                    } else {
                        _processMigration(db);
                    }
                } else {
                    idCallback(db);
                }
            };

            _processMigration(window.openDatabase(_defaultOptions.dbName, '', _defaultOptions.dbName, 4 * 1048576));
        };

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
                throw new Error(_errors.NoStoreParams.msg);
            }

            if (_defaultOptions.dbName === undefined) {
                throw new Error(_errors.NoConfigDBNameParams.msg);
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
            var _config = _.defaults((config || {}), {
                apiTemplate: undefined,
                paging: undefined,
                indexerProperty: 'id',

                readLocal: _defaultOptions.readLocal,
                readRemote: _defaultOptions.readRemote
            });

            if (_config.paging !== undefined) {
                _config.paging = _.defaults(_config.paging, {
                    template: '',
                    schema: {},
                    data: {
                        page: 1,
                        limit: _defaultOptions.pageLimit
                    }
                });
            }

            function _initializeTable(itCallback) {
                var asyncMon = new AsyncMonitor(2, itCallback);

                _localDatabase.transaction(function (tx) {
                    tx.executeSql('CREATE TABLE IF NOT EXISTS ' + name + ' (id INT UNIQUE, uri TEXT, dirty INT DEFAULT 0, local INT DEFAULT 0, data TEXT, updated TIMESTAMP DEFAULT current_timestamp)', [], asyncMon.done, _errorCallback);
                    tx.executeSql('CREATE TRIGGER IF NOT EXISTS ' + name + '_timestamp AFTER UPDATE ON ' + name + ' BEGIN UPDATE ' + name + '  SET updated = datetime(\'now\') WHERE id = old.id AND uri = old.uri; END', [], asyncMon.done, _errorCallback);
                });
            }

            function _countTableRows(cdrCallback) {
                _localDatabase.transaction(function (tx) {
                    tx.executeSql('SELECT COUNT(*) from ' + name, [], function (tx, res) {
                        cdrCallback(res.rows.length == 1 ? res.rows.item(0) : 0);
                    }, _errorCallback);
                });
            }

            function _clearTable(ctCallback) {
                _localDatabase.transaction(function (tx) {
                    tx.executeSql('DELETE FROM ' + name, [], function () {
                        ctCallback(true);
                    }, function () {
                        ctCallback(false);
                    });
                });
            }


            /*
             * Utility functions
             */

            function _traceCallback() {
                $log.warn('_traceCallback');
                $log.warn('Arguments: [' + Array.prototype.join.call(arguments, ', ') + ']');
            }

            function _dataCallback(tx, res) {
                $log.debug('SQL complete: ' + res.rowsAffected);
            }

            function _errorCallback(tx, err) {
                if (typeof err === 'undefined') {
                    err = tx;
                    tx = undefined;
                }

                if (typeof err === 'string') {
                    $log.warn('Error: ' + err);
                } else if (err.message !== undefined) {
                    $log.warn('Error: ' + err.message + '(' + err.code + ')');
                } else {
                    $log.warn(err);
                }
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

            var _getLocal = function (uri, options, glCallback) {
                $log.debug('_getLocal');
                if (typeof glCallback !== 'function') glCallback = angular.noop;

                _localDatabase.transaction(function (tx) {
                    tx.executeSql('SELECT * FROM ' + name + ' WHERE uri = ?', [uri], function (tx, res) {
                        if (res.rows.length > 0) {
                            if (options.one) {
                                glCallback(dataStoreUtilities.injectMetadata(res.rows.item(0)));
                            } else {
                                var dataItems = [];

                                for (var i = 0; i < res.rows.length; i++) {
                                    dataItems.push(dataStoreUtilities.injectMetadata(res.rows.item(i)));
                                }

                                glCallback(dataItems);
                            }
                        } else {
                            glCallback(options.one ? undefined : []);
                        }
                    }, function (tx, err) {
                        _errorCallback(tx, err);
                        glCallback(null, _errors.LocalDataStoreError);
                    });
                });
            };

            var _findLocal = function (key, column, options, flCallback) {
                $log.debug('_findLocal');

                if (typeof flCallback !== 'function') flCallback = angular.noop;

                _localDatabase.transaction(function (tx) {
                    tx.executeSql('SELECT * FROM ' + name + ' WHERE ' + column + ' ' + (options.like ? 'LIKE' : '=') + ' ?', [(options.like ? "%" + key + "%" : key)], function (tx, res) {
                        if (res.rows.length > 0) {
                            if (options.one) {
                                flCallback(dataStoreUtilities.injectMetadata(res.rows.item(0)));
                            } else {
                                var dataItems = [];

                                for (var i = 0; i < res.rows.length; i++) {
                                    dataItems.push(dataStoreUtilities.injectMetadata(res.rows.item(i)));
                                }

                                flCallback(dataItems);
                            }
                        } else {
                            flCallback(options.one ? undefined : []);
                        }
                    }, function (tx, err) {
                        flCallback(null, err);
                    });
                });
            };

            var _syncLocal = function (dataItems, uri, slCallback) {
                $log.debug('_syncLocal');
                if (typeof slCallback !== 'function') slCallback = angular.noop;

                _deleteAllLocal(uri, function () {
                    _updateLocal(dataItems, function () {
                        _getLocal(uri, {}, slCallback);
                    });
                });
            };

            var _updateLocal = function (dataItems, options, ulCallback) {
                $log.debug('_updateLocal');
                if (typeof options === 'function') {
                    ulCallback = options;
                    options = {};
                }

                if (typeof ulCallback !== 'function') ulCallback = angular.noop;
                if ((dataItems instanceof Array) === false) dataItems = [dataItems];

                if (dataItems.length > 0) {
                    options = _.defaults(options || {}, {
                        replace: true,
                        force: false
                    });

                    var asyncMon = new AsyncMonitor(dataItems.length, function () {
                        ulCallback(dataItems);
                    });

                    _localDatabase.transaction(function (tx) {
                        for (var i = 0; i < dataItems.length; i++) {
                            var item = dataStoreUtilities.extractMetadata(dataItems[i]);
                            var dataString = JSON.stringify(item.data);

                            tx.executeSql('INSERT INTO ' + name + ' (id, uri, data, dirty, local) VALUES (?, ?, ?, ?, ?)', [item.id, item.uri, dataString, (item.dirty ? 1 : 0), (item.local ? 1 : 0)], asyncMon.done, function (tx, err) {
                                // Insert failed
                                if (options.replace === true) {
                                    if (item.dirty === true || item.local === true || options.force) {
                                        tx.executeSql('UPDATE ' + name + ' SET uri = ?, data = ?, dirty = ?, local = ? WHERE id = ?', [item.uri, dataString, (item.dirty ? 1 : 0), (item.local ? 1 : 0), item.id], asyncMon.done, _errorCallback);
                                    } else {
                                        tx.executeSql('UPDATE ' + name + ' SET uri = ?, data = ?, dirty = ?, local = ? WHERE id = ? AND dirty = 0 AND local = 0', [item.uri, dataString, (item.dirty ? 1 : 0), (item.local ? 1 : 0), item.id], asyncMon.done, _errorCallback);
                                    }
                                } else {
                                    asyncMon.done();
                                }
                            });
                        }
                    });
                } else {
                    ulCallback(dataItems);
                }
            };

            var _deleteLocal = function (dataItems, dlCallback) {
                $log.debug('_deleteLocal');
                if ((dataItems instanceof Array) === false) dataItems = [dataItems];

                if (dataItems.length > 0) {
                    var asyncMon = new AsyncMonitor(dataItems.length, dlCallback);

                    _localDatabase.transaction(function (tx) {
                        for (var i = 0; i < dataItems.length; i++) {
                            var item = dataStoreUtilities.extractMetadata(dataItems[i]);

                            tx.executeSql('DELETE FROM ' + name + ' WHERE id = ? AND uri = ?', [item.id, item.uri], asyncMon.done, function (err) {
                                _errorCallback(tx, err);
                                asyncMon.done();
                            });
                        }
                    });
                } else {
                    dlCallback(dataItems);
                }
            };

            var _deleteAllLocal = function (uri, options, dalCallback) {
                $log.debug('_deleteAllLocal');
                if (typeof options === 'function') {
                    dalCallback = options;
                    options = {};
                }

                options = _.defaults((options || {}), {force: false});

                var asyncMon = new AsyncMonitor(1, dalCallback);

                var handleSuccess = function () {
                    $log.debug('handleSuccess');
                    asyncMon.done();
                };

                var handleError = function (tx, err) {
                    $log.debug('handleError');
                    _errorCallback(tx, err);
                    asyncMon.done();
                };

                $log.debug(uri);

                _localDatabase.transaction(function (tx) {
                    $log.debug('_deleteAllLocal transaction');

                    if (options.force === true) {
                        $log.debug('_deleteAllLocal force');
                        tx.executeSql('DELETE FROM ' + name + ' WHERE uri = ?', [uri], handleSuccess, handleError);
                    } else {
                        $log.debug('_deleteAllLocal not force');
                        tx.executeSql('DELETE FROM ' + name + ' WHERE uri = ? AND local = ? AND dirty = ?', [uri, 0, 0], handleSuccess, handleError);
                    }
                });

                $log.debug('_deleteAllLocal end');
            };

            /**
             * Remote data storage
             */

            var _getRemote = function (uri, grCallback) {
                $log.debug('_getRemote');
                if (typeof grCallback !== 'function') grCallback = angular.noop;

                if (_config.apiTemplate !== undefined) {
                    safeApply(function () {
                        $http.get(_hostApi + uri, {withCredentials: true}).then(function (res) {
                            if (res.data != null && res.data !== 'null') {
                                var data = res.data;

                                if ((data instanceof Array) === false) {
                                    grCallback([dataStoreUtilities.injectMetadata({
                                        id: _getItemIndex(data),
                                        uri: uri,
                                        data: data,
                                        dirty: false,
                                        local: false
                                    })]);
                                } else {
                                    var dataItems = [];

                                    for (var i = 0; i < data.length; i++) {
                                        var item = data[i];

                                        dataItems.push(dataStoreUtilities.injectMetadata({
                                            id: _getItemIndex(item),
                                            uri: uri,
                                            data: item,
                                            dirty: false,
                                            local: false
                                        }));
                                    }

                                    grCallback(dataItems);
                                }
                            } else {
                                grCallback(null, _errors.RemoteNoDataError);
                            }
                        }, function (err) {
                            _errorCallback(err);
                            grCallback(null, _errors.RemoteDataStoreError);
                        });
                    });
                } else {
                    grCallback();
                }
            };

            /**
             * @name _updateRemote
             * @param dataItems
             * @param urCallback
             * @private
             */
            var _updateRemote = function (dataItems, writeUri, writeSchema, urCallback) {
                $log.debug('_updateRemote');
                if (typeof writeSchema === 'function') {
                    urCallback = writeSchema;
                    writeSchema = {};
                } else if (typeof writeUri === 'function') {
                    urCallback = writeUri;
                    writeSchema = {};
                    writeUri = undefined;
                }

                if (typeof urCallback !== 'function') urCallback = angular.noop;

                if (dataItems !== undefined && _config.apiTemplate !== undefined) {
                    if ((dataItems instanceof Array) === false) dataItems = [dataItems];

                    var postedDataItems = undefined;
                    var asyncMon = new AsyncMonitor(dataItems.length, function () {
                        urCallback(postedDataItems);
                    });

                    var pushDataItem = function (item) {
                        if (postedDataItems) {
                            postedDataItems.push(item);
                        } else {
                            postedDataItems = [item];
                        }
                    };

                    var _makePost = function (item, uri) {
                        safeApply(function () {
                            $http.post(_hostApi + uri, item.data, {withCredentials: true}).then(function (res) {
                                if (res.status === 200) {
                                    var remoteItem = dataStoreUtilities.injectMetadata({
                                        id: _getItemIndex(res.data, item.id),
                                        uri: item.uri,
                                        data: item.data,
                                        dirty: false,
                                        local: false
                                    });

                                    if (item.local == true) {
                                        remoteItem.id = remoteItem.__id;

                                        _deleteLocal(item);
                                    }

                                    pushDataItem(remoteItem);
                                    _updateLocal(remoteItem, {force: true}, asyncMon.done);
                                } else {
                                    _errorCallback(err);
                                    asyncMon.done();
                                }
                            }, function (err) {
                                _errorCallback(err);
                                asyncMon.done();
                            });
                        });
                    };

                    for (var i = 0; i < dataItems.length; i++) {
                        var item = dataStoreUtilities.extractMetadata(dataItems[i]);

                        if (item.dirty === true) {
                            if (item.local || writeUri !== undefined) {
                                if (item.local && item.data[_config.indexerProperty] !== undefined) {
                                    delete item.data[_config.indexerProperty];
                                }

                                _makePost(item, dataStoreUtilities.parseRequest(writeUri || _config.apiTemplate, _.extend(writeSchema, {id: item.local ? undefined : item.id})));
                            } else {
                                _makePost(item, item.uri);
                            }
                        } else {
                            asyncMon.done();
                        }
                    }
                } else {
                    urCallback();
                }

            };

            /**
             * @name _deleteRemote
             * @param dataItems
             * @param drCallback()
             * @private
             */
            var _deleteRemote = function (dataItems, writeUri, writeSchema, drCallback) {
                $log.debug('_deleteRemote');
                if (typeof writeSchema === 'function') {
                    drCallback = writeSchema;
                    writeSchema = {};
                } else if (typeof writeUri === 'function') {
                    drCallback = writeUri;
                    writeSchema = {};
                    writeUri = undefined;
                }

                if (typeof drCallback !== 'function') drCallback = angular.noop;

                if (dataItems !== undefined && writeUri !== undefined) {
                    if ((dataItems instanceof Array) === false) dataItems = [dataItems];

                    var asyncMon = new AsyncMonitor(dataItems.length, drCallback);

                    var _makeDelete = function (item, uri) {
                        safeApply(function () {
                            $http.post(_hostApi + uri, {withCredentials: true}).then(function (res) {
                                if (res.status === 200) {
                                    _deleteLocal(item, asyncMon.done);
                                } else {
                                    _errorCallback(err);
                                    asyncMon.done();
                                }
                            }, function (err) {
                                _errorCallback(err);
                                asyncMon.done();
                            });
                        });
                    };

                    for (var i = 0; i < dataItems.length; i++) {
                        var item = dataStoreUtilities.extractMetadata(dataItems[i]);

                        if (item.local === false) {
                            _makeDelete(item, dataStoreUtilities.parseRequest(writeUri, _.defaults(writeSchema, {id: item.id})));
                        } else {
                            asyncMon.done();
                        }
                    }
                } else {
                    drCallback();
                }
            };

            /**
             *
             * @param size
             * @param callback
             * @returns {*} AsyncMonitor
             * @constructor
             * @funtion done
             * */
            function AsyncMonitor(size, callback) {
                if (!(this instanceof AsyncMonitor)) {
                    return new AsyncMonitor(size, callback);
                }

                return {
                    done: function () {
                        size--;

                        if (size == 0 && callback) {
                            callback.apply(this, arguments);
                        }
                    }
                }
            };

            /**
             * Transactions
             */
            var _dataStoreInitialized = false;
            var _transactionQueue = [];

            var _processTransactionQueue = function () {
                if (_localDatabase !== undefined) {
                    while (_transactionQueue.length > 0) {
                        var transactionItem = _transactionQueue[0];

                        transactionItem(new DataTransaction());

                        _transactionQueue.splice(0, 1);
                    }
                }
            };

            var _responseHandler = function (handle, res, err) {
                if (handle !== undefined) {
                    if (typeof handle === 'function') {
                        handle(res, err);
                    } else {
                        if (res) {
                            handle.resolve(res);
                        } else {
                            handle.reject(err);
                        }
                    }
                }
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
                        var request = _.defaults(req || {}, {
                            template: _config.apiTemplate,
                            schema: {},
                            data: [],
                            options: {
                                replace: true,
                                force: false,
                                dirty: true
                            },
                            callback: angular.noop
                        });

                        if ((request.data instanceof Array) === false) {
                            request.data = [request.data];
                        }

                        var asyncMon = new AsyncMonitor(request.data.length, function (res, err) {
                            _responseHandler(request.callback, res, err);
                        });

                        angular.forEach(request.data, function (data) {
                            var id = _getItemIndex(data, dataStoreUtilities.generateItemIndex());

                            _updateLocal(dataStoreUtilities.injectMetadata({
                                id: id,
                                uri: dataStoreUtilities.parseRequest(request.template, _.defaults(request.schema, {id: id})),
                                data: data,
                                dirty: request.options.dirty,
                                local: request.options.dirty
                            }), request.options, asyncMon.done);
                        });
                    },
                    getItems: function (req) {
                        var request = _.defaults(req || {}, {
                            template: _config.apiTemplate,
                            schema: {},
                            options: {
                                page: 1,
                                limit: _defaultOptions.pageLimit,
                                readLocal: _config.readLocal,
                                readRemote: _config.readRemote,
                                fallbackRemote: false
                            },
                            callback: angular.noop
                        });

                        var handleRemote = function (_uri) {
                            _getRemote(_uri, function (res, err) {
                                if (res) {
                                    _syncLocal(res, _uri, function (res, err) {
                                        _responseHandler(request.callback, res, err);
                                    });
                                } else {
                                    _getLocal(_uri, request.options, function (res, err) {
                                        _responseHandler(request.callback, res, err);
                                    });
                                }
                            });
                        };

                        if (typeof request.schema === 'object') {
                            var _uri = dataStoreUtilities.parseRequest(request.template, request.schema);

                            // Process request
                            if (request.options.readRemote === true) {
                                handleRemote(_uri);
                            } else if (request.options.readLocal === true) {
                                _getLocal(_uri, request.options, function (res, err) {
                                    if (res.length == 0 && request.options.fallbackRemote === true) {
                                        handleRemote(_uri);
                                    } else {
                                        _responseHandler(request.callback, res, err);
                                    }

                                });
                            }
                        } else {
                            _responseHandler(request.callback, null, _errors.NoReadParams);
                        }
                    },
                    findItems: function (req) {
                        var request = _.defaults(req || {}, {
                            key: '',
                            column: 'id',
                            options: {
                                like: false,
                                one: false
                            },
                            callback: angular.noop
                        });

                        _findLocal(request.key, request.column, request.options, function (res, err) {
                            _responseHandler(request.callback, res, err);
                        });
                    },
                    updateItems: function (req) {
                        var request = _.defaults(req || {}, {
                            data: [],
                            options: {
                                dirty: true
                            },
                            callback: angular.noop
                        });

                        if ((request.data instanceof Array) === false) {
                            request.data = [request.data];
                        }

                        if (request.options.dirty) {
                            angular.forEach(request.data, function (item) {
                                item.__dirty = true;
                            });
                        }

                        _updateLocal(request.data, request.options, function (res, err) {
                            _responseHandler(request.callback, res, err);
                        });
                    },
                    postItems: function (req) {
                        var request = _.defaults(req || {}, {
                            template: _config.apiTemplate,
                            schema: {},
                            data: [],
                            callback: angular.noop
                        });

                        if ((request.data instanceof Array) === false) {
                            request.data = [request.data];
                        }

                        _updateRemote(request.data, request.template, request.schema, function (res, err) {
                            _responseHandler(request.callback, res, err);
                        });
                    },
                    removeItems: function (req) {
                        var request = _.defaults(req || {}, {
                            template: undefined,
                            schema: {},
                            data: [],
                            callback: angular.noop
                        });

                        if ((request.data instanceof Array) === false) {
                            request.data = [request.data];
                        }

                        var asyncMon = new AsyncMonitor(request.data.length, function (res, err) {
                            _responseHandler(request.callback, res, err);
                        });

                        angular.forEach(request.data, function (item) {
                            if (item.__local === true) {
                                _deleteLocal(item, asyncMon.done);
                            } else {
                                _deleteRemote(item, request.template, request.schema, asyncMon.done);
                            }
                        });
                    },
                    purgeItems: function (req) {
                        var request = _.defaults(req || {}, {
                            template: undefined,
                            schema: {},
                            options: {
                                force: true
                            },
                            callback: angular.noop
                        });

                        if (request.template !== undefined) {
                            var _uri = dataStoreUtilities.parseRequest(request.template, request.schema);

                            _getLocal(_uri, request.options, function (res, err) {
                                var deleteItems = [];

                                angular.forEach(res, function (item) {
                                    if (item.__dirty == false || request.options.force == true) {
                                        deleteItems.push(item);
                                    }
                                });

                                _deleteLocal(deleteItems, function (res, err) {
                                    _responseHandler(request.callback, res, err);
                                });
                            });
                        } else {
                            _clearTable(function (res, err) {
                                _responseHandler(request.callback, res, err);
                            });
                        }
                    }
                }
            }

            /**
             * Initialize table
             */

            _initializeTable(function () {
                $log.debug('table initialized');

                _dataStoreInitialized = true;
                _processTransactionQueue();
            })

            /**
             * Public functions
             */
            return {
                defaults: _defaultOptions,
                config: _config,
                transaction: function (tCallback) {
                    if (typeof tCallback === 'function') {
                        _transactionQueue.push(tCallback);

                        _processTransactionQueue();
                    }
                }
            }
        }

        /**
         * Initialize database
         */

        _initializeDatabase(function (db) {
            _localDatabase = db;

            $log.debug('database initialized');
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
