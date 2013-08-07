'use strict';

define(['underscore', 'watch', 'angular', 'angular-resource'], function (_, watch) {
    var module = angular.module('dataModule', ['ngResource']);

    module.provider('dataStore', function () {
        var _apiUrl = '/api';
        var _defaultOptions = {
            pageLimit: 10
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

        /**
         * @name dataStoreProvider.config
         * @description dataStoreProvider provider
         * @param url
         * @param options
         */
        this.config = function (url, options) {
            _apiUrl = url.replace(/:(?!\/\/)/, '\\:');
            _defaultOptions = _.defaults((options || {}), _defaultOptions);
        };

        /**
         * dataStore service
         * @type {Array}
         */
        this.$get = ['$q', '$resource', '$http', function ($q, $resource, $http) {
            function DataStore(name, config, dsCallback) {
                // Check if instance of DataStore
                if (!(this instanceof DataStore)) {
                    return new DataStore(name, config, dsCallback);
                }

                // Validate parameters
                if (typeof config === 'function') {
                    dsCallback = config;
                    config = {};
                } else if (typeof name === 'undefined') {
                    throw new Error(_errors.NoStoreParams.msg);
                }

                /**
                 * Private variables
                 * @private

                 config = {
                    api: {
                        template: urlTemplate,
                        schema: schemaTemplate,
                    },
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
                    api: undefined,
                    paging: undefined,

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

                if(_config.api !== undefined) {
                    _config.api = _.defaults(_config.api, {
                        template: '',
                        schema: {}
                    });
                }

                if(_config.paging !== undefined) {
                    _config.paging = _.defaults(_config.paging, {
                        template: '',
                        schema: {},
                        data: {
                            page: 1,
                            limit: _defaultOptions.pageLimit
                        }
                    });
                }

                var _remoteStore = undefined;
                var _localStore = {
                    db: undefined,
                    name: name + 'Database',
                    size: 0
                };

                /**
                 * @name _initializeDatabase
                 * @param name
                 * @returns {Database}
                 * @private
                 */
                function _initializeDatabase(name, idCallback) {
                    var migrationSteps = [
                        {
                            current: '',
                            process: function (tx) {
                                tx.executeSql('CREATE TABLE IF NOT EXISTS data (id TEXT UNIQUE, key TEXT, dirty INT DEFAULT 0, local INT DEFAULT 0, data TEXT, updated TIMESTAMP DEFAULT current_timestamp)', [], _dataCallback, _errorCallback);
                                tx.executeSql('CREATE TRIGGER IF NOT EXISTS data_timestamp AFTER UPDATE ON data BEGIN UPDATE data SET updated = datetime(\'now\') WHERE id = old.id AND key = old.key; END', [], _dataCallback, _errorCallback);
                            },
                            next: '1.0'
                        }
                    ];

                    function _processMigration(db) {
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

                    _processMigration(window.openDatabase(name, '', name, 1000000));
                };

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

                function _countDatabaseRows(db, cdrCallback) {
                    db.transaction(function (tx) {
                        tx.executeSql('SELECT COUNT(*) from data', [], function (tx, res) {
                            cdrCallback(res.rows.length == 1 ? res.rows.item(0) : 0);
                        }, _errorCallback);
                    });
                }


                /*
                 * Utility functions
                 */

                function _createUniqueId() {
                    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                        return v.toString(16);
                    });
                };

                function _createSchemaKey(schemaData) {
                    return _.flatten(_.pairs(schemaData)).join('/');
                };

                function _createDataItems(data, schemaData) {
                    if (_.isArray(data) === false) {
                        data = [data];
                    }

                    var dataItems = [];

                    _.each(data, function (item) {
                        dataItems.push(new DataItem(item, schemaData));
                    });

                    return dataItems;
                };

                /*
                 * Local data storage
                 */

                var _getLocal = function (key, glCallback) {
                    console.log('_getLocal');
                    if (typeof glCallback !== 'function') glCallback = _voidCallback;

                    if (_config.read.local === true) {
                        _localStore.db.transaction(function (tx) {
                            tx.executeSql('SELECT * FROM data WHERE key = ?', [key], function (tx, res) {
                                var dataItems = [];

                                for (var i = 0; i < res.rows.length; i++) {
                                    var localData = res.rows.item(i);

                                    dataItems.push({
                                        id: localData.id,
                                        key: localData.key,
                                        data: JSON.parse(localData.data),
                                        dirty: (localData.dirty == 1 ? true : false),
                                        local: (localData.local == 1 ? true : false)
                                    });
                                }

                                glCallback(dataItems);
                            }, function (tx, err) {
                                _errorCallback(tx, err);
                                glCallback(null, _errors.LocalDataStoreError);
                            });
                        });
                    } else {
                        glCallback();
                    }
                };

                var _syncLocal = function (dataItems, key, slCallback) {
                    console.log('_syncLocal');
                    if (typeof slCallback !== 'function') slCallback = _voidCallback;

                    _deleteAllLocal(key, function () {
                        _updateLocal(dataItems, function () {
                            _getLocal(key, slCallback);
                        });
                    });
                };

                var _updateLocal = function (dataItems, options, ulCallback) {
                    console.log('_updateLocal');
                    if (typeof options === 'function') {
                        ulCallback = options;
                        options = {};
                    }
                    if (_.isArray(dataItems) === false) dataItems = [dataItems];
                    if (typeof ulCallback !== 'function') ulCallback = _voidCallback;

                    options = _.defaults((options || {}), {force: false});

                    var asyncMon = new AysncMonitor(dataItems.length, ulCallback);

                    if (_config.write.local === true) {
                        _localStore.db.transaction(function (tx) {
                            _.each(dataItems, function (item) {
                                var dataString = JSON.stringify(item.data);

                                tx.executeSql("INSERT INTO data (id, key, data, dirty, local) VALUES (?, ?, ?, ?, ?)", [item.id, item.key, dataString, (item.dirty ? 1 : 0), (item.local ? 1 : 0)], asyncMon.done, function (tx, err) {
                                    // Insert failed
                                    if (item.dirty === true || item.local === true || (_config.write.force === true || options.force)) {
                                        tx.executeSql('UPDATE data SET data = ?, dirty = ?, local = ? WHERE id = ?', [dataString, (item.dirty ? 1 : 0), (item.local ? 1 : 0), item.id], asyncMon.done, _errorCallback);
                                    } else {
                                        tx.executeSql('UPDATE data SET data = ?, dirty = ?, local = ? WHERE id = ? AND dirty = 0 AND local = 0', [dataString, (item.dirty ? 1 : 0), (item.local ? 1 : 0), item.id], asyncMon.done, _errorCallback);
                                    }
                                });
                            });
                        });
                    } else {
                        ulCallback();
                    }
                };

                var _deleteLocal = function (dataItems) {
                    console.log('_deleteLocal');
                    if (_.isArray(dataItems) === false) dataItems = [dataItems];

                    if (_config.write.local === true) {
                        _localStore.db.transaction(function (tx) {
                            _.each(dataItems, function (item) {
                                tx.executeSql("DELETE FROM data WHERE id = ? AND key = ?", [item.id, item.key], _traceCallback, _errorCallback);
                            });
                        });
                    }
                };

                var _deleteAllLocal = function (key, dalCallback) {
                    console.log('_deleteAllLocal');

                    _localStore.db.transaction(function (tx) {
                        if (_config.write.force === true) {
                            tx.executeSql("DELETE FROM data WHERE key = ?", [key], function () {
                                dalCallback();
                            }, _errorCallback);
                        } else {
                            tx.executeSql("DELETE FROM data WHERE key = ? AND local = 0 AND dirty = 0", [key], function () {
                                dalCallback();
                            }, _errorCallback);
                        }
                    });
                };

                /**
                 * Remote data storage
                 */

                /**
                 *
                 * @param schemaData
                 * @param key
                 * @param grCallback(res, err)
                 * @private
                 */
                var _getRemote = function (schemaData, key, grCallback) {
                    console.log('_getRemote');
                    if (typeof grCallback !== 'function') grCallback = _voidCallback;

                    _remoteStore.query(schemaData, {withCredentials: true}).$then(function (res) {
                        var data = res.data;
                        var dataItems = [];

                        if (_.isArray(data) === false) data = [data];

                        for (var i = 0; i < data.length; i++) {
                            var item = data[i];

                            dataItems.push({
                                id: item._id || item.id,
                                key: key,
                                data: item,
                                dirty: false,
                                local: false
                            });
                        }

                        grCallback(dataItems);
                    }, function (err) {
                        _errorCallback(err);
                        grCallback(null, _errors.RemoteDataStoreError);
                    });
                };

                /**
                 *
                 * @param schemaData
                 * @param dataItems
                 * @param urCallback()
                 * @private
                 */
                var _updateRemote = function (schemaData, dataItems, urCallback) {
                    console.log('_updateRemote');
                    if (_.isArray(dataItems) === false) dataItems = [dataItems];
                    if (typeof urCallback !== 'function') urCallback = _voidCallback;

                    var asyncMon = new AysncMonitor(dataItems.length, function () {
                        urCallback(dataItems);
                    });

                    if (_config.write.remote === true && _config.api !== undefined) {
                        _.each(dataItems, function (item, index) {
                            if (item.dirty === true) {
                                _remoteStore.save(schemaData, item.data).$then(function (res) {
                                    var remoteItem = {
                                        id: res.data._id || res.data.id || item.id,
                                        key: item.key,
                                        data: item.data,
                                        dirty: false,
                                        local: false
                                    }

                                    if (item.local == true) {
                                        remoteItem.data._id = remoteItem.id;

                                        _deleteLocal(item);
                                    }

                                    dataItems[index] = remoteItem;

                                    _updateLocal(remoteItem, {force: true}, asyncMon.done);
                                }, function (err) {
                                    _errorCallback(err);
                                    asyncMon.done();
                                });
                            } else {
                                asyncMon.done();
                            }
                        });
                    } else {
                        urCallback();
                    }
                };

                /**
                 *
                 * @param schemaData
                 * @param dataItems
                 * @param drCallback()
                 * @private
                 */
                var _deleteRemote = function (schemaData, dataItems, drCallback) {
                    console.log('_deleteRemote');
                    if (_.isArray(dataItems) === false) dataItems = [dataItems];
                    if (typeof drCallback !== 'function') drCallback = _voidCallback;

                    var asyncMon = new AysncMonitor(dataItems.length, drCallback);

                    if (_config.write.remote === true && _config.api !== undefined) {
                        _.each(dataItems, function (item, index) {
                            _remoteStore.delete(schemaData, item.data).$then(function (res) {
                                _deleteLocal(item, asyncMon.done);
                            }, function (err) {
                                _errorCallback(err);
                                asyncMon.done();
                            });
                        });
                    } else {
                        drCallback();
                    }
                };

                function AysncMonitor(size, callback) {
                    if (!(this instanceof AysncMonitor)) {
                        return new AysncMonitor(size, callback);
                    }

                    return {
                        done: function () {
                            size--;

                            if (size == 0) {
                                callback();
                            }
                        }
                    }
                }

                /**
                 * @name DataItem
                 * @param item
                 * @param schemaData
                 * @returns {*}
                 * @constructor
                 */
                function DataItem(item, schemaData) {
                    if (!(this instanceof DataItem)) {
                        return new DataItem(item, schemaData);
                    }

                    schemaData = schemaData || {};
                    item = _.defaults((item || {}), {
                        id: undefined,
                        key: undefined,
                        data: {},
                        dirty: false,
                        local: false
                    });

                    if (item.local === true) {
                        item.id = item.id || _createUniqueId();
                        item.key = item.key || _createSchemaKey(schemaData);

                        _updateLocal(item);
                    }

                    function _watchData() {
                        watch.watch(item.data, function () {
                            console.log('Data changed');

                            item.dirty = true;
                            _updateLocal(item);
                        });
                    };

                    _watchData();

                    return {
                        id: item.id,
                        data: item.data,
                        /**
                         * @param uCallback(res, err)
                         */
                        update: function (uCallback) {
                            console.log('Data updated');
                            if (typeof uCallback !== 'function') uCallback = _voidCallback;

                            _updateRemote(schemaData, item, function (res) {
                                if (_.isArray(res) === true) {
                                    item = res[0];
                                    _watchData();
                                }

                                uCallback(res);
                            });
                        },
                        /**
                         * @param dCallback(res, err)
                         */
                        delete: function (dCallback) {
                            console.log('Data deleted');

                            _deleteRemote(schemaData, item, dCallback);
                        }
                    }
                };

                /**
                 * Initialize
                 */

                if (_config.api !== undefined && _config.api.template !== undefined) {
                    console.log(_apiUrl + _config.api.template);
                    _remoteStore = $resource(_apiUrl + _config.api.template, _config.api.schema);
                }

                // Initialize database
                _initializeDatabase(_localStore.name, function (db) {
                    _localStore.db = db;

                    _countDatabaseRows(_localStore.db, function (count) {
                        _localStore.size = count;

                        dsCallback();
                    });
                });

                /**
                 * Public functions
                 */
                return {
                    read: function (schemaData, options, rCallback) {
                        // Validate parameters
                        if (typeof schemaData === 'function') {
                            rCallback = schemaData;
                            options = {};
                            schemaData = {};
                        } else if (typeof options === 'function') {
                            rCallback = options;
                            options = {};
                        }

                        if (typeof schemaData === 'object') {
                            var _readOptions = _.defaults(options, {page: 1, limit: _defaultOptions.pageLimit});
                            var _key = _createSchemaKey(schemaData);

                            // Process request
                            _getLocal(_key, function (res, err) {
                                if (res) {
                                    rCallback(_createDataItems(res, schemaData));
                                } else if (err) {
                                    rCallback(null, err);
                                }
                            });

                            _getRemote(schemaData, _key, function (res, err) {
                                if (res) {
                                    _syncLocal(res, _key, function (res, err) {
                                        rCallback(_createDataItems(res, schemaData));
                                    });
                                } else if (err) {
                                    rCallback(null, err);
                                }
                            });

                        } else {
                            rCallback(null, _errors.NoReadParams);
                        }
                    },
                    create: function (data, schemaData) {
                        return new DataItem({
                            data: data,
                            dirty: true,
                            local: true
                        }, schemaData);
                    }
                }
            };

            /**
             * @name dataStore
             * @description Create a new instance of the DataStore service
             * @param name
             * @param config
             * @param callback
             * @returns {DataStore}
             * @constructor
             */
            return function (name, config, callback) {
                return new DataStore(name, config, callback);
            };
        }];
    });

});

