'use strict';

define(['underscore', 'angular'], function (_) {
    var module = angular.module('dataModule', []);


    module.provider('dataStore', function () {
        var _apiUrl = '/api';
        var _defaultOptions = {
            timeout: 60,
            pageLimit: 10,
            readLocalOnly: false,
            waitForRemote: false,
            cacheRemoteData: true,
            index: 'id'
        };

        var _errors = {
            NoStoreParams: {err: 'NoStoreParams', msg: 'No DataStore parameters defined'},
            NoConfigAPIParams: {err: 'NoConfigAPIParams', msg: 'No Config API parameters defined'},
            NoConfigPagingParams: {err: 'NoConfigPagingParams', msg: 'No Config Paging parameters defined'},
            NoReadParams: {err: 'NoReadParams', msg: 'No DataRead parameters defined'},
            NoPagingDefined: {err: 'NoPagingDefined', msg: 'No Paging parameters have been defined in config'}
        };

        /**
         * dataStoreProvider provider
         * @param {String} The base API URL
         * @param {Object} Additional API options
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
                    paging: undefined
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
                                tx.executeSql('CREATE TABLE IF NOT EXISTS data (id TEXT UNIQUE, key TEXT, dirty INT DEFAULT 0, data TEXT, updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP)');
                                tx.executeSql('CREATE TRIGGER IF NOT EXISTS data_timestamp AFTER UPDATE ON data BEGIN UPDATE data SET updated = CURRENT_TIMESTAMP WHERE id = old.id AND key = old.key; END');
                            },
                            next: '1.0'
                        }
                    ];

                    function _processMigration(db) {
                        if (migrationSteps.length > 0) {
                            var migration = migrationSteps[0];
                            migrationSteps.splice(0,1);

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

                function _errorCallback(tx, err) {
                    console.log('Database Error: ' + err.message + '(' + err.code + ')');

                    throw new Error(err.message);
                };

                function _countDatabaseRows(db, cdrCallback) {
                    db.transaction(function (tx) {
                        tx.executeSql('SELECT COUNT(*) from data', [], function (tx, res) {
                            cdrCallback(res.rows.length == 1 ? res.rows.item(0) : 0);
                       });
                    });
                }

                /**
                 * Initialize
                 */

                if(_config.api !== undefined && _config.api.template !== undefined) {
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
                 * @param callback
                 * @returns {DataStore.DataReader}
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

                    options = _.defaults(options, {page: 1, limit: _defaultOptions.pageLimit});

                    // Process request
                    var _key = _.flatten(_.pairs(schemaData)).join('/');


                    function _makeLocalRequest(mlrCallback) {
                        _localStore.db.transaction(function (tx) {
                            tx.executeSql('SELECT * FROM data WHERE key = ?', [_key], function(tx, res) {
                                var dataArray = [];

                                for (var i = 0; i < res.rows.length; i++) {
                                    var localData = res.rows.item(i);

                                    dataArray.push(JSON.parse(localData.data));
                                }

                                mlrCallback(dataArray);
                            }, function(err) {
                                mlrCallback(null, err);
                            });
                        });
                    };

                    function _storeLocalResponse(data) {
                        if(typeof data === 'object') data = [data];

                        _localStore.db.transaction(function(tx) {
                            _.each(data, function(element, index) {
                                var id = element._id || '';
                                var dataArray = [id, _key, JSON.stringify(element)];

                                tx.executeSql("REPLACE INTO data (id, key, data) VALUES (?, ?, ?)", dataArray);
                            });
                        });
                    };

                    function _makeRemoteRequest(mrrCallback) {
                        _remoteStore.get(schemaData).$then(function(res) {
                            mrrCallback(res.data);
                        }, function(err) {
                            mrrCallback(null, err);
                        });
                    };

                    function _makeRequest(mrCallback) {
                        _makeLocalRequest(function(res, err) {
                            console.log('_makeLocalRequest');
                            mrCallback(res, err);
                        });

                        _makeRemoteRequest(function(res, err) {
                            if(res !== undefined) {
                                _storeLocalResponse(res);
                           }

                            console.log('_makeRemoteRequest');
                            mrCallback(res, err);
                        })

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
            /*







             function EndPoint(endPointTemplate, querySchema) {
             if (typeof endPointTemplate === 'object') {
             querySchema = endPointTemplate;
             endPointTemplate = '';
             } else if (typeof endPointTemplate === 'undefined') {
             querySchema = {};
             endPointTemplate = '';
             }

             _apiUrl = _apiUrl + endPointTemplate.split('/').join('/');

             this.resourceHandle = $resource(_apiUrl, querySchema);
             };

             EndPoint.prototype.read = function (queryData, options, callback) {
             if (typeof queryData === 'function') {
             callback = queryData;
             options = {};
             queryData = '';
             } else if (typeof options === 'function') {
             callback = options;
             options = {};
             } else if (typeof queryData === 'undefined') {
             throw new Error(_errors.EmptyReadParams.msg);
             }

             options = _.defaults(options, _defaultOptions);

             function Reader() {
             var _page = 1;

             function _readRequest() {
             // TODO: Get local data

             if (options.waitForRemote === false || options.readCacheOnly === true) {
             //callback();
             }

             // Make remote API call


             if (options.readCacheOnly === false) {
             this.resourceHandle.get(queryData, function (res) {
             if (options.cacheRemoteData === true) {
             // TODO: Store to local
             }

             console.log(res);

             callback(res.data);
             }, function (err) {
             callback(null, err);
             });
             }
             }

             return {
             page: _page,
             pageTo: function (page) {
             _page = page;
             _readRequest();
             },
             refresh: function () {
             _readRequest();
             }
             }
             }

             return new Reader();


             if (typeof queryData === 'object') {
             callback = options;
             options = queryData;
             queryData = '';
             } else if (typeof queryData === 'function') {
             callback = queryData;
             options = {};
             queryData = '';
             } else {
             throw new Error(_errors.NoReadParams.msg);
             }

             options = _.defaults(options, _defaultOptions);


             // Make remote API call
             if (options.readCacheOnly === false) {
             this.resourceHandle.get(queryData, function (res) {
             if (options.cacheRemoteData === true) {
             // TODO: Store to local
             }

             console.log(res);

             callback(res.data);
             }, function (err) {
             callback(null, err);
             });
             }
             };
             */

            return {
                /**
                 * @name data.createInstance
                 * @description Create a new EndPoint instance of the Data service
                 * @param {String} endPointTemplate: The API end point (e.g. '/user/:id')
                 * @param {Object} querySchema: The schema parameters used in the API template
                 */
                DataStore: function (name, config, callback) {
                    return new DataStore(name, config, callback);
                }
            };
        }];
    });

});

