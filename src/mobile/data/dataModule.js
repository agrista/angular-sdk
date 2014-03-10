var mobileSdkDataApp = angular.module('ag.mobile-sdk.data', ['ag.sdk.core.utilities', 'ag.sdk.core.config']);

/**
 * @name dataPurgeService
 */
mobileSdkDataApp.provider('dataPurge', function () {
    this.$get = ['queueService', 'dataStore', function (queueService, dataStore) {
        var _queue = null;

        function _purgeDataStore(name) {
            _queue.wrapPush(function (defer) {
                var store = dataStore(name);

                store.transaction(function (tx) {
                    tx.purgeItems({
                        callback: function (res) {
                            if (res) {
                                defer.resolve();
                            } else {
                                defer.reject();
                            }
                        }
                    });
                })
            });
        }

        return function purge(dataStoreList, pCallback) {
            if (typeof pCallback !== 'function') pCallback = angular.noop;

            if (dataStoreList instanceof Array) {
                _queue = queueService(pCallback);

                for (var i = 0; i < dataStoreList.length; i++) {
                    _purgeDataStore(dataStoreList[i]);
                }
            }
        }
    }];
});

mobileSdkDataApp.factory('dataStoreUtilities', function () {
    return {
        parseRequest: function (templateUrl, schemaData) {
            console.log('Unresolved: ' + templateUrl);

            if (templateUrl !== undefined) {
                for (var key in schemaData) {
                    if (schemaData.hasOwnProperty(key)) {
                        var schemaKey = (schemaData[key] !== undefined ? schemaData[key] : '');

                        templateUrl = templateUrl.replace(':' + key, schemaKey);
                    }
                }
            }

            console.log('Resolved: ' + templateUrl);

            return templateUrl;
        },
        generateItemIndex: function () {
            return 2000000000 + Math.round(Math.random() * 147483647);
        },
        createDataItem: function (item) {
            return {
                id: item.id,
                uri: item.uri,
                data: JSON.parse(item.data),
                dirty: (item.dirty == 1 ? true : false),
                local: (item.local == 1 ? true : false)
            };
        }
    }
});

/**
 * @name dataStore
 */
mobileSdkDataApp.provider('dataStore', function () {
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
    this.$get = ['$q', '$http', '$rootScope', 'safeApply', 'configuration', 'dataStoreUtilities', function ($q, $http, $rootScope, safeApply, configuration, dataStoreUtilities) {
        var _hostApi = configuration.getServer() + 'api';

        /**
         * @name _initializeDatabase
         * @param name
         * @returns {Database}
         * @private
         */
        function _initializeDatabase(idCallback) {
            var migrationSteps = [];

            function _processMigration(db) {
                console.log('_processMigration');

                if (migrationSteps.length > 0) {
                    var migration = migrationSteps[0];
                    migrationSteps.splice(0, 1);

                    if (migration.current === db.version) {
                        console.log('Database (' + db.version + ') has a newer version ' + migration.next);

                        db.changeVersion(migration.current, migration.next, migration.process, _errorCallback, function () {
                            console.log('Database version migrated from ' + migration.current + ' to ' + migration.next);
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
                console.warn('_traceCallback');
                console.warn('Arguments: [' + Array.prototype.join.call(arguments, ', ') + ']');
            }

            function _dataCallback(tx, res) {
                console.log('SQL complete: ' + res.rowsAffected);
            }

            function _errorCallback(tx, err) {
                if (typeof err === 'undefined') {
                    err = tx;
                    tx = undefined;
                }

                if (typeof err === 'string') {
                    console.warn('Error: ' + err);
                } else if (err.message !== undefined) {
                    console.warn('Error: ' + err.message + '(' + err.code + ')');
                } else {
                    console.warn(err);
                }
            }

            function _getItemIndex(item, id) {
                if (item[_config.indexerProperty] === undefined) {
                    console.warn('Configured indexer property not defined');
                }

                return (item[_config.indexerProperty] || item.id || id);
            }

            /*
             * Local data storage
             */

            var _getLocal = function (uri, options, glCallback) {
                console.log('_getLocal');
                if (typeof glCallback !== 'function') glCallback = angular.noop;

                _localDatabase.transaction(function (tx) {
                    tx.executeSql('SELECT * FROM ' + name + ' WHERE uri = ?', [uri], function (tx, res) {
                        if (res.rows.length > 0) {
                            if (options.one) {
                                glCallback(dataStoreUtilities.createDataItem(res.rows.item(0)));
                            } else {
                                var dataItems = [];

                                for (var i = 0; i < res.rows.length; i++) {
                                    dataItems.push(dataStoreUtilities.createDataItem(res.rows.item(i)));
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
                console.log('_findLocal');

                if (typeof flCallback !== 'function') flCallback = angular.noop;

                _localDatabase.transaction(function (tx) {
                    tx.executeSql('SELECT * FROM ' + name + ' WHERE ' + column + ' ' + (options.like ? 'LIKE' : '=') + ' ?', [(options.like ? "%" + key + "%" : key)], function (tx, res) {
                        if (res.rows.length > 0) {
                            if (options.one) {
                                flCallback(dataStoreUtilities.createDataItem(res.rows.item(0)));
                            } else {
                                var dataItems = [];

                                for (var i = 0; i < res.rows.length; i++) {
                                    dataItems.push(dataStoreUtilities.createDataItem(res.rows.item(i)));
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
                console.log('_syncLocal');
                if (typeof slCallback !== 'function') slCallback = angular.noop;

                _deleteAllLocal(uri, function () {
                    _updateLocal(dataItems, function () {
                        _getLocal(uri, {}, slCallback);
                    });
                });
            };

            var _updateLocal = function (dataItems, options, ulCallback) {
                console.log('_updateLocal');
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
                            var item = dataItems[i];
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
                console.log('_deleteLocal');
                if ((dataItems instanceof Array) === false) dataItems = [dataItems];

                if (dataItems.length > 0) {
                    var asyncMon = new AsyncMonitor(dataItems.length, dlCallback);

                    _localDatabase.transaction(function (tx) {
                        for (var i = 0; i < dataItems.length; i++) {
                            var item = dataItems[i];

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
                console.log('_deleteAllLocal');
                if (typeof options === 'function') {
                    dalCallback = options;
                    options = {};
                }

                options = _.defaults((options || {}), {force: false});

                var asyncMon = new AsyncMonitor(1, dalCallback);

                var handleSuccess = function () {
                    console.log('handleSuccess');
                    asyncMon.done();
                };

                var handleError = function (tx, err) {
                    console.log('handleError');
                    _errorCallback(tx, err);
                    asyncMon.done();
                };

                console.log(uri);

                _localDatabase.transaction(function (tx) {
                    console.log('_deleteAllLocal transaction');

                    if (options.force === true) {
                        console.log('_deleteAllLocal force');
                        tx.executeSql('DELETE FROM ' + name + ' WHERE uri = ?', [uri], handleSuccess, handleError);
                    } else {
                        console.log('_deleteAllLocal not force');
                        tx.executeSql('DELETE FROM ' + name + ' WHERE uri = ? AND local = ? AND dirty = ?', [uri, 0, 0], handleSuccess, handleError);
                    }
                });

                console.log('_deleteAllLocal end');
            };

            /**
             * Remote data storage
             */

            var _getRemote = function (uri, grCallback) {
                console.log('_getRemote');
                if (typeof grCallback !== 'function') grCallback = angular.noop;

                if (_config.apiTemplate !== undefined) {
                    safeApply(function () {
                        $http.get(_hostApi + uri, {withCredentials: true}).then(function (res) {
                            if (res.data != null && res.data !== 'null') {
                                var data = res.data;

                                if ((data instanceof Array) === false) {
                                    grCallback([
                                        {
                                            id: _getItemIndex(data),
                                            uri: uri,
                                            data: data,
                                            dirty: false,
                                            local: false
                                        }
                                    ]);
                                } else {
                                    var dataItems = [];

                                    for (var i = 0; i < data.length; i++) {
                                        var item = data[i];

                                        dataItems.push({
                                            id: _getItemIndex(item),
                                            uri: uri,
                                            data: item,
                                            dirty: false,
                                            local: false
                                        });
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
                console.log('_updateRemote');
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

                    var postedDataItems = [];
                    var asyncMon = new AsyncMonitor(dataItems.length, function () {
                        urCallback(postedDataItems);
                    });

                    var _makePost = function (item, uri) {
                        safeApply(function () {
                            $http.post(_hostApi + uri, item.data, {withCredentials: true}).then(function (res) {
                                var remoteItem = {
                                    id: _getItemIndex(res.data, item.id),
                                    uri: item.uri,
                                    data: item.data,
                                    dirty: false,
                                    local: false
                                };

                                if (item.local == true) {
                                    remoteItem.data.id = remoteItem.id;

                                    _deleteLocal(item);
                                }

                                postedDataItems.push(remoteItem);

                                _updateLocal(remoteItem, {force: true}, asyncMon.done);
                            }, function (err) {
                                _errorCallback(err);
                                asyncMon.done();
                            });
                        });
                    };

                    for (var i = 0; i < dataItems.length; i++) {
                        var item = dataItems[i];

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
                console.log('_deleteRemote');
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
                                _deleteLocal(item, asyncMon.done);
                            }, function (err) {
                                _errorCallback(err);
                                asyncMon.done();
                            });
                        });
                    };

                    for (var i = 0; i < dataItems.length; i++) {
                        var item = dataItems[i];

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
                                dirty: true,
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

                            _updateLocal({
                                id: id,
                                uri: dataStoreUtilities.parseRequest(request.template, _.defaults(request.schema, {id: id})),
                                data: data,
                                dirty: request.options.dirty,
                                local: request.options.dirty
                            }, request.options, asyncMon.done);
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
                                item.dirty = true;
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
                            if (item.local === true) {
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
                                    if (item.dirty == false || request.options.force == true) {
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
                console.log('table initialized');

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

            console.log('database initialized');
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
});
