'use strict';

define(['underscore', 'angular', 'core/utilityModule'], function (underscore) {
    var module = angular.module('dataModule', ['utilityModule']);

    /**
     * @name dataPurgeService
     */
    module.provider('dataPurge', function () {
        this.$get = ['queueService', 'dataStore',
            function (queueService, dataStore) {
                var _queue = null;

                function _purgeDataStore(name) {
                    _queue.wrapPush(function (defer) {
                        var store = dataStore(name);

                        store.transaction(function (tx) {
                            tx.purgeItems(function (res) {
                                if (res) {
                                    defer.resolve();
                                } else {
                                    defer.reject();
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


    /**
     * @name dataStore
     * @example

     var testStore = dataStore('test', {apiTemplate: 'test/:id'});

     ...

     testStore.transaction(function(tx) {
        tx.read({id: '123xyz'}, function(res, err) {
            // Handle read data
        });
     });

     */
    module.provider('dataStore', function () {
        var _defaultOptions = {
            url: '/api',
            pageLimit: 10,
            dbName: 'appDatabase',
            readLocal: true,
            readRemote: true
        };

        var _errors = {
            NoStoreParams: {code: 'NoStoreParams', message: 'No DataStore parameters defined'},
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
            _defaultOptions = underscore.defaults((options || {}), _defaultOptions);
        };

        /**
         * dataStore service
         * @type {Array}
         */
        this.$get = ['$q', '$http', '$rootScope', 'objectId', 'safeApply', function ($q, $http, $rootScope, objectId, safeApply) {

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

                _processMigration(window.openDatabase(_defaultOptions.dbName, '', _defaultOptions.dbName, 1000000));
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
                    indexerProperty: '_id',

                    readLocal: _defaultOptions.readLocal,
                    readRemote: _defaultOptions.readRemote
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

                function _initializeTable(itCallback) {
                    var asyncMon = new AsyncMonitor(2, itCallback);

                    _localDatabase.transaction(function (tx) {
                        tx.executeSql('CREATE TABLE IF NOT EXISTS ' + name + ' (id TEXT UNIQUE, uri TEXT, dirty INT DEFAULT 0, local INT DEFAULT 0, data TEXT, updated TIMESTAMP DEFAULT current_timestamp)', [], asyncMon.done, _errorCallback);
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

                function _voidCallback() {
                }

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

                function _parseRequest(templateUrl, schemaData) {
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
                }


                function _getItemIndex(item, id) {
                    if (item[_config.indexerProperty] === undefined) {
                        console.warn('Configured indexer property not defined');
                    }

                    return (item[_config.indexerProperty] || item._id || item.id || id);
                }

                function _createDataItem(item) {
                    return {
                        id: item.id,
                        uri: item.uri,
                        data: JSON.parse(item.data),
                        dirty: (item.dirty == 1 ? true : false),
                        local: (item.local == 1 ? true : false)
                    };
                }


                /*
                 * Local data storage
                 */

                var _getLocal = function (uri, glCallback) {
                    console.log('_getLocal');
                    if (typeof glCallback !== 'function') glCallback = _voidCallback;

                    _localDatabase.transaction(function (tx) {
                        tx.executeSql('SELECT * FROM ' + name + ' WHERE uri = ?', [uri], function (tx, res) {
                            if (res.rows.length > 0) {
                                var dataItems = [];

                                for (var i = 0; i < res.rows.length; i++) {
                                    dataItems.push(_createDataItem(res.rows.item(i)));
                                }

                                glCallback(dataItems);
                            } else {
                                glCallback([]);
                            }
                        }, function (tx, err) {
                            _errorCallback(tx, err);
                            glCallback(null, _errors.LocalDataStoreError);
                        });
                    });
                };

                var _findLocal = function (key, column, flCallback) {
                    console.log('_findLocal');
                    if (column === undefined) {
                        column = 'id';
                    }

                    if (typeof flCallback !== 'function') flCallback = _voidCallback;

                    _localDatabase.transaction(function (tx) {
                        tx.executeSql('SELECT * FROM ' + name + ' WHERE ' + column + ' LIKE ?', ["%" + key + "%"], function (tx, res) {
                            if (res.rows.length > 0) {
                                var dataItems = [];

                                for (var i = 0; i < res.rows.length; i++) {
                                    dataItems.push(_createDataItem(res.rows.item(i)));
                                }

                                flCallback(dataItems);
                            } else {
                                flCallback([]);
                            }
                        }, function (tx, err) {
                            flCallback(null, err);
                        });
                    });
                };

                var _syncLocal = function (dataItems, uri, slCallback) {
                    console.log('_syncLocal');
                    if (typeof slCallback !== 'function') slCallback = _voidCallback;

                    _localDatabase.transaction(function (tx) {
                        tx.executeSql('SELECT * FROM ' + name + ' WHERE uri = ? AND local = ? AND dirty = ?', [uri, 0, 0], function (tx, res) {
                            console.log('select success: ' + res.rows.length);
                        }, function (tx, err) {
                            console.log('select error: ' + err.message);
                        });
                    });

                    _deleteAllLocal(uri, function () {
                        _updateLocal(dataItems, function () {
                            _getLocal(uri, slCallback);
                        });
                    });
                };

                var _updateLocal = function (dataItems, options, ulCallback) {
                    console.log('_updateLocal');
                    if (typeof options === 'function') {
                        ulCallback = options;
                        options = {};
                    }

                    if (typeof ulCallback !== 'function') ulCallback = _voidCallback;
                    if ((dataItems instanceof Array) === false) dataItems = [dataItems];

                    if (dataItems.length > 0) {

                        options = underscore.defaults((options || {}), {force: false});

                        var asyncMon = new AsyncMonitor(dataItems.length, function () {
                            ulCallback(dataItems);
                        });

                        _localDatabase.transaction(function (tx) {
                            for (var i = 0; i < dataItems.length; i++) {
                                var item = dataItems[i];
                                var dataString = JSON.stringify(item.data);

                                tx.executeSql('INSERT INTO ' + name + ' (id, uri, data, dirty, local) VALUES (?, ?, ?, ?, ?)', [item.id, item.uri, dataString, (item.dirty ? 1 : 0), (item.local ? 1 : 0)], asyncMon.done, function (tx, err) {
                                    // Insert failed
                                    if (item.dirty === true || item.local === true || options.force) {
                                        tx.executeSql('UPDATE ' + name + ' SET uri = ?, data = ?, dirty = ?, local = ? WHERE id = ?', [item.uri, dataString, (item.dirty ? 1 : 0), (item.local ? 1 : 0), item.id], asyncMon.done, _errorCallback);
                                    } else {
                                        tx.executeSql('UPDATE ' + name + ' SET uri = ?, data = ?, dirty = ?, local = ? WHERE id = ? AND dirty = 0 AND local = 0', [item.uri, dataString, (item.dirty ? 1 : 0), (item.local ? 1 : 0), item.id], asyncMon.done, _errorCallback);
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
                };

                var _deleteAllLocal = function (uri, options, dalCallback) {
                    console.log('_deleteAllLocal');
                    if (typeof options === 'function') {
                        dalCallback = options;
                        options = {};
                    }

                    options = underscore.defaults((options || {}), {force: false});

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
                    if (typeof grCallback !== 'function') grCallback = _voidCallback;

                    if (_config.apiTemplate !== undefined) {
                        safeApply(function () {
                            $http.get(_defaultOptions.url + uri, {withCredentials: true}).then(function (res) {
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

                    if (typeof urCallback !== 'function') urCallback = _voidCallback;

                    if (dataItems !== undefined && _config.apiTemplate !== undefined) {
                        if ((dataItems instanceof Array) === false) dataItems = [dataItems];

                        var asyncMon = new AsyncMonitor(dataItems.length, function () {
                            urCallback(dataItems);
                        });

                        var _makePost = function (item, uri) {
                            safeApply(function () {
                                $http.post(_defaultOptions.url + uri, item.data, {withCredentials: true}).then(function (res) {
                                    var remoteItem = {
                                        id: _getItemIndex(res.data, item.id),
                                        uri: item.uri,
                                        data: item.data,
                                        dirty: false,
                                        local: false
                                    };

                                    if (item.local == true) {
                                        remoteItem.data._id = remoteItem.id;

                                        _deleteLocal(item);
                                    }

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
                                    _makePost(item, _parseRequest(writeUri || _config.apiTemplate, underscore.extend(writeSchema, {id: item.local ? undefined : item.id})));
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
                var _deleteRemote = function (dataItems, drCallback) {
                    console.log('_deleteRemote');
                    if (typeof drCallback !== 'function') drCallback = _voidCallback;

                    if (dataItems !== undefined && _config.apiTemplate !== undefined) {
                        if ((dataItems instanceof Array) === false) dataItems = [dataItems];

                        var asyncMon = new AsyncMonitor(dataItems.length, drCallback);

                        var _makeDelete = function (item) {
                            safeApply(function () {
                                $http.delete(_defaultOptions.url + item.uri, {withCredentials: true}).then(function (res) {
                                    _deleteLocal(item, asyncMon.done);
                                }, function (err) {
                                    _errorCallback(err);
                                    asyncMon.done();
                                });
                            });
                        };

                        for (var i = 0; i < dataItems.length; i++) {
                            _makeDelete(dataItems[i]);
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
                                callback();
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
                        createItem: function (uriTemplate, schemaData, data, cCallback) {
                            if (arguments.length == 3) {
                                cCallback = data;
                                data = schemaData;
                                schemaData = uriTemplate;
                                uriTemplate = _config.apiTemplate;
                            } else if (arguments.length == 2) {
                                cCallback = schemaData;
                                data = uriTemplate;
                                schemaData = {};
                                uriTemplate = _config.apiTemplate;
                            } else if (arguments.length == 1) {
                                cCallback = schemaData;
                                data = {};
                                schemaData = {};
                                uriTemplate = _config.apiTemplate;
                            }

                            _updateLocal({
                                id: _getItemIndex(data, objectId().toBase64String()),
                                uri: _parseRequest(uriTemplate, schemaData),
                                data: data,
                                dirty: true,
                                local: true
                            }, function (res, err) {
                                _responseHandler(cCallback, res, err);
                            });
                        },
                        getItems: function (schemaData, options, rCallback) {
                            // Validate parameters
                            if (arguments.length == 2) {
                                rCallback = options;
                                options = {};
                            } else if (arguments.length == 1) {
                                rCallback = schemaData;
                                options = {};
                                schemaData = {};
                            }

                            if (typeof schemaData === 'object') {
                                var _readOptions = underscore.defaults(options, {
                                    page: 1,
                                    limit: _defaultOptions.pageLimit,
                                    readLocal: _config.readLocal,
                                    readRemote: _config.readRemote
                                });

                                var _uri = _parseRequest(_config.apiTemplate, schemaData);

                                // Process request
                                if (_readOptions.readLocal === true) {
                                    _getLocal(_uri, function (res, err) {
                                        _responseHandler(rCallback, res, err);
                                    });
                                }

                                if (_readOptions.readRemote === true) {
                                    _getRemote(_uri, function (res, err) {
                                        if (res) {
                                            _syncLocal(res, _uri, function (res, err) {
                                                _responseHandler(rCallback, res, err);
                                            });
                                        } else if (err) {
                                            _responseHandler(rCallback, null, err);
                                        }
                                    });
                                }
                            } else {
                                _responseHandler(rCallback, null, _errors.NoReadParams);
                            }
                        },
                        findItems: function (key, column, fCallback) {
                            if (arguments.length == 2) {
                                fCallback = column;
                                column = undefined;
                            }

                            _findLocal(key, column, function (res, err) {
                                _responseHandler(fCallback, res, err);
                            });
                        },
                        updateItems: function (dataItems, options, uCallback) {
                            if (arguments.length == 2) {
                                uCallback = options;
                                options = {};
                            }

                            if ((dataItems instanceof Array) === false) {
                                dataItems = [dataItems];
                            }

                            for (var i = 0; i < dataItems.length; i++) {
                                dataItems[i].dirty = true;
                            }

                            _updateLocal(dataItems, options, function (res, err) {
                                _responseHandler(uCallback, res, err);
                            });
                        },
                        postItems: function (dataItems, schemaData, writeUri, sCallback) {
                            // Validate parameters
                            if (arguments.length == 3) {
                                sCallback = writeUri;
                                writeUri = undefined;
                            } else if (arguments.length == 2) {
                                sCallback = schemaData;
                                writeUri = undefined;
                                schemaData = {};
                            }

                            if ((dataItems instanceof Array) === false) {
                                dataItems = [dataItems];
                            }

                            _updateRemote(dataItems, writeUri, schemaData, function (res, err) {
                                _responseHandler(sCallback, res, err);
                            });
                        },
                        removeItems: function (dataItems, dCallback) {
                            if ((dataItems instanceof Array) === false) {
                                dataItems = [dataItems];
                            }

                            var asyncMon = new AsyncMonitor(dataItems.length, function (res, err) {
                                _responseHandler(dCallback, res, err);
                            });

                            for (var i = 0; i < dataItems.length; i++) {
                                if (dataItems[i].local === true) {
                                    _deleteLocal(dataItems, function () {
                                        asyncMon.done();
                                    });
                                } else {
                                    _deleteRemote(dataItems, function () {
                                        asyncMon.done();
                                    });
                                }
                            }
                        },
                        purgeItems: function (pCallback) {
                            _clearTable(function (res, err) {
                                _responseHandler(pCallback, res, err);
                            });
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
});
