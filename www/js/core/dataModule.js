'use strict';

define(['underscore', 'angular'], function (_) {
    var module = angular.module('dataModule', []);


    module.provider('dataStore', function () {
        var _apiUrl = '/api';
        var _defaultOptions = {
            pageLimit: 10
        };

        var _errors = {
            NoStoreParams: {err: 'NoStoreParams', msg: 'No DataStore parameters defined'},
            NoConfigAPIParams: {err: 'NoConfigAPIParams', msg: 'No Config API parameters defined'},
            NoConfigPagingParams: {err: 'NoConfigPagingParams', msg: 'No Config Paging parameters defined'},
            NoReadParams: {err: 'NoReadParams', msg: 'No DataRead parameters defined'},
            NoPagingDefined: {err: 'NoPagingDefined', msg: 'No Paging parameters have been defined in config'}
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
                                tx.executeSql('CREATE TABLE IF NOT EXISTS data (id TEXT UNIQUE, key TEXT, dirty INT DEFAULT 0, data TEXT, updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP)', [], _dataCallback, _errorCallback);
                                tx.executeSql('CREATE TRIGGER IF NOT EXISTS data_timestamp AFTER UPDATE ON data BEGIN UPDATE data SET updated = CURRENT_TIMESTAMP WHERE id = old.id AND key = old.key; END', [], _dataCallback, _errorCallback);
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

                function _traceCallback() {
                    console.warn('_traceCallback');
                    console.warn('Arguments: [' + arguments.join(', ') + ']');

                    if (_trackCallback.caller && _trackCallback.caller.name) {
                        console.warn('Called from: ' + _trackCallback.caller.name);
                    }
                };

                function _dataCallback(tx, res) {
                    console.log('SQL complete: ' + res.rowsAffected);
                };

                function _errorCallback(err) {
                    console.error('Error: ' + err.message + '(' + err.code + ')');
                };

                function _countDatabaseRows(db, cdrCallback) {
                    db.transaction(function (tx) {
                        tx.executeSql('SELECT COUNT(*) from data', [], function (tx, res) {
                            cdrCallback(res.rows.length == 1 ? res.rows.item(0) : 0);
                        }, _errorCallback);
                    });
                }

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
                 * @name DataReader
                 * @param schemaData
                 * @param options
                 * @param drCallback
                 * @returns {DataReader}
                 * @constructor
                 */
                function DataReader(schemaData, options, drCallback) {
                    // Check if instance of DataReader
                    if (!(this instanceof DataReader)) {
                        return new DataReader(schemaData, options, drCallback);
                    }

                    // Validate parameters
                    if (typeof schemaData === 'function') {
                        drCallback = schemaData;
                        options = {};
                        schemaData = {};
                    } else if (typeof options === 'function') {
                        drCallback = options;
                        options = {};
                    } else if (typeof schemaData === 'undefined') {
                        throw new Error(_errors.NoReadParams.msg);
                    }

                    var _readOptions = _.defaults(options, {page: 1, limit: _defaultOptions.pageLimit});

                    // Process request
                    var _key = _.flatten(_.pairs(schemaData)).join('/');


                    function _makeLocalRequest(mlrCallback) {
                        _localStore.db.transaction(function (tx) {
                            tx.executeSql('SELECT * FROM data WHERE key = ?', [_key], function (tx, res) {
                                var dataArray = [];

                                for (var i = 0; i < res.rows.length; i++) {
                                    var localData = res.rows.item(i);

                                    dataArray.push(JSON.parse(localData.data));
                                }

                                mlrCallback(dataArray);
                            }, function (err) {
                                mlrCallback(null, err);
                            });
                        });
                    };

                    function _storeLocalResponse(data) {
                        console.log('_makeRemoteRequest');

                        if (typeof data === 'object') data = [data];

                        _localStore.db.transaction(function (tx) {
                            _.each(data, function (element, index) {
                                var id = element._id || '';
                                var dataString = JSON.stringify(element);

                                tx.executeSql("INSERT INTO data (id, key, data) VALUES (?, ?, ?)", [id, _key, dataString], _traceCallback, function (tx, err) {
                                    // Insert failed
                                    console.log('Insert failed');
                                    if (_config.write.force) {
                                        tx.executeSql('UPDATE data SET data = ?, dirty = 0 WHERE id = ?', [dataString, id], _dataCallback, _errorCallback);
                                    } else {
                                        tx.executeSql('UPDATE data SET data = ? WHERE id = ? AND dirty = 0', [dataString, id], _dataCallback, _errorCallback);
                                    }
                                });
                            });
                        });

                    };

                    function _makeRemoteRequest(mrrCallback) {
                        _remoteStore.get(schemaData).$then(function (res) {
                            mrrCallback(res.data);
                        }, function (err) {
                            mrrCallback(null, err);
                        });
                    };

                    function _makeRequest(mrCallback) {
                        if (_config.read.local) {
                            _makeLocalRequest(function (res, err) {
                                console.log('_makeLocalRequest');
                                mrCallback(res, err);
                            });
                        }

                        if (_config.read.remote && _config.api !== undefined) {
                            _makeRemoteRequest(function (res, err) {
                                console.log('_makeRemoteRequest');

                                if (_config.write.local === true) {
                                    _storeLocalResponse(res);
                                }

                                mrCallback(res, err);
                            })
                        }
                    };

                    _makeRequest(drCallback);
                };

                /**
                 * Public functions
                 */
                return {
                    read: function (schemaData, options, callback) {
                        return new DataReader(schemaData, options, callback);
                    },
                    create: function (data, callback) {

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

