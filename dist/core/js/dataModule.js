'use strict';

define(['underscore', 'angular'], function (_) {
    var module = angular.module('dataModule', []);

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
        var _apiUrl = '/api';
        var _defaultOptions = {
            pageLimit: 10,
            dbName: 'appDatabase'
        };

        var _errors = {
            NoStoreParams: {code: 'NoStoreParams', message: 'No DataStore parameters defined'},
            NoConfigAPIParams: {code: 'NoConfigAPIParams', message: 'No Config API parameters defined'},
            NoConfigPagingParams: {code: 'NoConfigPagingParams', message: 'No Config Paging parameters defined'},
            NoReadParams: {code: 'NoReadParams', message: 'No DataRead parameters defined'},
            NoPagingDefined: {code: 'NoPagingDefined', message: 'No Paging parameters have been defined in config'},
            LocalDataStoreError: {code: 'LocalDataStoreError', message: 'Can not perform action on local data store'},
            RemoteDataStoreError: {code: 'RemoteDataStoreError', message: 'Can not perform action on remote data store'}
        };

        var _localDatabase;

        /**
         * @name dataStoreProvider.config
         * @description dataStoreProvider provider
         * @param url
         * @param options
         */
        this.config = function (url, options) {
            _apiUrl = url;
            _defaultOptions = _.defaults((options || {}), _defaultOptions);
        };

        /**
         * dataStore service
         * @type {Array}
         */
        this.$get = ['$q', '$http', '$rootScope', function ($q, $http, $rootScope) {

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
                    apiTemplate: urlTemplate,
                    paging: {
                        template: urlTemplate,
                        schema: schemaTemplate,
                        data: {
                            page: 1,
                            limit: pageLimit
                        }
                    },
                    read: {
                        local: true,
                        remote: true
                    },
                    write: {
                        local: true,
                        remote: true,
                        force: false
                    }
                }
                 */
                var _config = _.defaults((config || {}), {
                    apiTemplate: undefined,
                    paging: undefined,
                    indexerProperty: '_id',

                    read: {
                        local: true,
                        remote: true
                    },
                    write: {
                        local: true,
                        remote: true,
                        force: false
                    }
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
                        tx.executeSql('CREATE TABLE IF NOT EXISTS ' + name + ' (id TEXT UNIQUE, uri TEXT, dirty INT DEFAULT 0, local INT DEFAULT 0, data TEXT, updated TIMESTAMP DEFAULT current_timestamp)', [], asyncMon.done, _errorCallback);
                        tx.executeSql('CREATE TRIGGER IF NOT EXISTS ' + name + '_timestamp AFTER UPDATE ON ' + name + ' BEGIN UPDATE ' + name + '  SET updated = datetime(\'now\') WHERE id = old.id AND uri = old.uri; END', [], asyncMon.done, _errorCallback);
                    });
                };

                function _countTableRows(cdrCallback) {
                    _localDatabase.transaction(function (tx) {
                        tx.executeSql('SELECT COUNT(*) from ' + name, [], function (tx, res) {
                            cdrCallback(res.rows.length == 1 ? res.rows.item(0) : 0);
                        }, _errorCallback);
                    });
                }


                /*
                 * Utility functions
                 */

                function _voidCallback() {
                };

                function _traceCallback() {
                    console.warn('_traceCallback');
                    console.warn('Arguments: [' + Array.prototype.join.call(arguments, ', ') + ']');
                };

                function _dataCallback(tx, res) {
                    console.log('SQL complete: ' + res.rowsAffected);
                };

                function _errorCallback(tx, err) {
                    if (typeof err === 'undefined') {
                        err = tx;
                        tx = undefined;
                    }

                    if (typeof err === 'string') {
                        console.error('Error: ' + err);
                    } else if (err.message !== undefined) {
                        console.error('Error: ' + err.message + '(' + err.code + ')');
                    } else {
                        console.error('Error');
                        console.error(err);
                    }
                };

                function _createUniqueId() {
                    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                        return v.toString(16);
                    });
                };

                function _parseRequest(templateUrl, schemaData) {
                    console.log('Unresolved: ' + templateUrl);

                    if (templateUrl !== undefined) {
                        for (var key in schemaData) {
                            if (schemaData.hasOwnProperty(key)) {
                                console.log('Property: ' + key);

                                templateUrl = templateUrl.replace(':' + key, schemaData[key]);
                            }
                        }
                    }

                    console.log('Resolved: ' + templateUrl);

                    return templateUrl;
                };

                function _safeApply(scope, fn) {
                    (scope.$$phase || scope.$root.$$phase) ? fn() : scope.$apply(fn);
                };


                function _getItemIndex(item) {
                    if (item[_config.indexerProperty] === undefined) {
                        console.warn('Configured indexer property not defined');
                    }

                    return (item[_config.indexerProperty] || item._id || item.id);
                };


                /*
                 * Local data storage
                 */

                var _getLocal = function (uri, glCallback) {
                    console.log('_getLocal');
                    if (typeof glCallback !== 'function') glCallback = _voidCallback;

                    if (_config.read.local === true) {
                        _localDatabase.transaction(function (tx) {
                            tx.executeSql('SELECT * FROM ' + name + ' WHERE uri = ?', [uri], function (tx, res) {
                                if (res.rows.length == 1) {
                                    var localData = res.rows.item(0);

                                    glCallback({
                                        id: localData.id,
                                        uri: localData.uri,
                                        data: JSON.parse(localData.data),
                                        dirty: (localData.dirty == 1 ? true : false),
                                        local: (localData.local == 1 ? true : false)
                                    });

                                } else {
                                    var dataItems = [];

                                    for (var i = 0; i < res.rows.length; i++) {
                                        var localData = res.rows.item(i);

                                        dataItems.push({
                                            id: localData.id,
                                            uri: localData.uri,
                                            data: JSON.parse(localData.data),
                                            dirty: (localData.dirty == 1 ? true : false),
                                            local: (localData.local == 1 ? true : false)
                                        });
                                    }

                                    glCallback(dataItems);
                                }
                            }, function (tx, err) {
                                _errorCallback(tx, err);
                                glCallback(null, _errors.LocalDataStoreError);
                            });
                        });
                    } else {
                        glCallback();
                    }
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
                    if ((dataItems instanceof Array) === false) dataItems = [dataItems];
                    if (typeof ulCallback !== 'function') ulCallback = _voidCallback;

                    options = _.defaults((options || {}), {force: false});

                    var asyncMon = new AsyncMonitor(dataItems.length, ulCallback);

                    if (_config.write.local === true) {
                        _localDatabase.transaction(function (tx) {
                            for (var i = 0; i < dataItems.length; i++) {
                                var item = dataItems[i];
                                var dataString = JSON.stringify(item.data);

                                tx.executeSql('INSERT INTO ' + name + ' (id, uri, data, dirty, local) VALUES (?, ?, ?, ?, ?)', [item.id, item.uri, dataString, (item.dirty ? 1 : 0), (item.local ? 1 : 0)], asyncMon.done, function (tx, err) {
                                    // Insert failed
                                    if (item.dirty === true || item.local === true || (_config.write.force === true || options.force)) {
                                        tx.executeSql('UPDATE ' + name + ' SET data = ?, dirty = ?, local = ? WHERE id = ?', [dataString, (item.dirty ? 1 : 0), (item.local ? 1 : 0), item.id], asyncMon.done, _errorCallback);
                                    } else {
                                        tx.executeSql('UPDATE ' + name + ' SET data = ?, dirty = ?, local = ? WHERE id = ? AND dirty = 0 AND local = 0', [dataString, (item.dirty ? 1 : 0), (item.local ? 1 : 0), item.id], asyncMon.done, _errorCallback);
                                    }
                                });
                            }
                        });
                    } else {
                        ulCallback();
                    }
                };

                var _deleteLocal = function (dataItems, dlCallback) {
                    console.log('_deleteLocal');
                    if ((dataItems instanceof Array) === false) dataItems = [dataItems];

                    var asyncMon = new AsyncMonitor(dataItems.length, dlCallback);

                    if (_config.write.local === true) {
                        _localDatabase.transaction(function (tx) {
                            for (var i = 0; i < dataItems.length; i++) {
                                var item = dataItems[i];

                                tx.executeSql('DELETE FROM ' + name + ' WHERE id = ? AND uri = ?', [item.id, item.uri], asyncMon.done, function (err) {
                                    _errorCallback(tx, err);
                                    asyncMon.done();
                                });
                            }
                        });
                    }
                };

                var _deleteAllLocal = function (uri, dalCallback) {
                    console.log('_deleteAllLocal');

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

                        if (_config.write.force === true) {
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

                    if (_config.read.remote === true && _config.apiTemplate !== undefined) {
                        _safeApply($rootScope, function () {
                            $http.get(_apiUrl + uri, {withCredentials: true}).then(function (res) {
                                var data = res.data;

                                if ((data instanceof Array) === false) {
                                    grCallback({
                                        id: _getItemIndex(data),
                                        uri: uri,
                                        data: data,
                                        dirty: false,
                                        local: false
                                    });
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
                var _updateRemote = function (dataItems, urCallback) {
                    console.log('_updateRemote');
                    if ((dataItems instanceof Array) === false) dataItems = [dataItems];
                    if (typeof urCallback !== 'function') urCallback = _voidCallback;

                    if (dataItems.length > 0 && _config.write.remote === true && _config.apiTemplate !== undefined) {
                        var asyncMon = new AsyncMonitor(dataItems.length, function () {
                            urCallback(dataItems);
                        });

                        var _makePost = function (item) {
                            _safeApply($rootScope, function () {
                                $http.post(_apiUrl + item.uri, item.data, {withCredentials: true}).then(function (res) {
                                    var remoteItem = {
                                        id: _getItemIndex(res.data),
                                        uri: item.uri,
                                        data: item.data,
                                        dirty: false,
                                        local: false
                                    }

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
                                _makePost(item);
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
                    if ((data instanceof Array) === false) dataItems = [dataItems];
                    if (typeof drCallback !== 'function') drCallback = _voidCallback;

                    if (dataItems.length > 0 && _config.write.remote === true && _config.apiTemplate !== undefined) {
                        var asyncMon = new AsyncMonitor(dataItems.length, drCallback);

                        var _makeDelete = function (item) {
                            _safeApply($rootScope, function () {
                                $http.delete(_apiUrl + item.uri, {withCredentials: true}).then(function (res) {
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
                }

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
                        create: function (schemaData, data, cCallback) {
                            if (typeof data === 'function') {
                                cCallback = data;
                                data = {};
                            }
                            else if (typeof schemaData === 'undefined') {
                                cCallback = schemaData;
                                data = {};
                                schemaData = {};
                            }

                            cCallback({
                                id: _createUniqueId(),
                                uri: _parseRequest(_config.apiTemplate, schemaData),
                                data: data,
                                dirty: true,
                                local: true
                            });
                        },
                        read: function (schemaData, options, rCallback) {
                            // Validate parameters
                            if (typeof options === 'function') {
                                rCallback = options;
                                options = {};
                            } else if (typeof schemaData === 'function') {
                                rCallback = schemaData;
                                options = {};
                                schemaData = {};
                            }

                            if (typeof schemaData === 'object') {
                                var _readOptions = _.defaults(options, {page: 1, limit: _defaultOptions.pageLimit});
                                var _uri = _parseRequest(_config.apiTemplate, schemaData);

                                // Process request
                                _getLocal(_uri, function(res, err) {
                                    console.log('_getLocal complete');
                                    rCallback(res, err);
                                });

                                _getRemote(_uri, function (res, err) {
                                    console.log('_getRemote complete');
                                    if (res) {
                                        _syncLocal(res, _uri, function (res, err) {
                                            rCallback(res);
                                        });
                                    } else if (err) {
                                        rCallback(null, err);
                                    }
                                });
                            } else {
                                rCallback(null, _errors.NoReadParams);
                            }
                        },
                        update: function (dataItems, uCallback) {
                            if ((dataItems instanceof Array) === false) {
                                dataItems = [dataItems];
                            }

                            for (var i = 0; i < dataItems.length; i++) {
                                dataItems[i].dirty = true;
                            }

                            _updateLocal(dataItems, uCallback);
                        },
                        sync: function (schemaData, sCallback) {
                            // Validate parameters
                            if (typeof schemaData === 'undefined') {
                                sCallback = _voidCallback;
                            }

                            var _uri = _parseRequest(_config.apiTemplate, schemaData);

                            _getLocal(_uri, function (res, err) {
                                _updateRemote(res, function (res, err) {
                                    _getRemote(_uri, function (res, err) {
                                        if (res) {
                                            _syncLocal(res, _uri, sCallback);
                                        } else if (err) {
                                            sCallback(null, err);
                                        }
                                    });
                                });
                            });
                        },
                        delete: function (dataItems, dCallback) {
                            _deleteRemote(dataItems, dCallback);
                        }
                    }
                };

                /**
                 * Initialize table
                 */

                _initializeTable(function() {
                    console.log('table initialized');

                    _dataStoreInitialized = true;
                    _processTransactionQueue();
                })

                /**
                 * Public functions
                 */
                return {
                    transaction: function (tCallback) {
                        if (typeof tCallback === 'function') {
                            _transactionQueue.push(tCallback);

                            _processTransactionQueue();
                        }
                    }
                }
            };

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
