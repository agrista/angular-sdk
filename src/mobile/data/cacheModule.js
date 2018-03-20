var mobileSdkCacheApp = angular.module('ag.mobile-sdk.cache', ['ag.sdk.config', 'ag.sdk.utilities', 'ag.sdk.library', 'lokijs']);


mobileSdkCacheApp.provider('lokiCache', [function () {
    var _adapterProvider = function (name) {
        return new LokiCordovaFSAdapter({'prefix': 'loki'});
    };

    return {
        setAdapterProvider: function (adapterProvider) {
            _adapterProvider = adapterProvider;
        },
        $get: ['Loki', 'promiseService', 'underscore',
            function (Loki, promiseService, underscore) {
                var cacheStore = {},
                    adapter = _adapterProvider('loki');

                return function (dbName, options) {
                    return promiseService.wrap(function (promise) {
                        if (underscore.isUndefined(cacheStore[dbName])) {
                            cacheStore[dbName] = promise;

                            var lokiInstance = new Loki(dbName, underscore.defaults(options || {}, {
                                adapter: adapter,
                                autoload: true,
                                autosave: true,
                                autoloadCallback: function () {
                                    var promise = cacheStore[dbName];
                                    cacheStore[dbName] = lokiInstance;

                                    promise.resolve(cacheStore[dbName]);
                                }
                            }));
                        } else if (typeof cacheStore[dbName].promise === 'object') {
                            promise.resolve(cacheStore[dbName].promise);
                        } else {
                            promise.resolve(cacheStore[dbName]);
                        }
                    });
                };
            }]
    }
}]);

mobileSdkCacheApp.factory('lokiCollectionCache', ['lokiCache', 'promiseService', 'underscore',
    function (lokiCache, promiseService, underscore) {
        var collectionStore = {};

        return function (dbName, collectionName, options) {
            return promiseService.wrap(function (promise) {
                var key = dbName + '-' + collectionName;

                if (underscore.isUndefined(collectionStore[key])) {
                    lokiCache(dbName, options).then(function (db) {
                        collectionStore[key] = db.getCollection(collectionName);

                        if (collectionStore[key] === null) {
                            collectionStore[key] = db.addCollection(collectionName);
                        }

                        promise.resolve(collectionStore[key]);
                    }, promise.reject);
                } else {
                    promise.resolve(collectionStore[key]);
                }
            });
        };
    }]);
