var mobileSdkCacheApp = angular.module('ag.mobile-sdk.cache', ['ag.sdk.config', 'ag.sdk.utilities', 'ag.sdk.library', 'lokijs']);


mobileSdkCacheApp.provider('lokiCache', [function () {
    var _adapterProvider = function (name) {
        return new LokiCordovaFSAdapter({'prefix': 'loki'});
    };

    return {
        setAdapterProvider: function (adapterProvider) {
            _adapterProvider = adapterProvider;
        },
        $get: ['Loki', 'underscore',
            function (Loki, underscore) {
                var cacheStore = {},
                    adapter = _adapterProvider('loki');

                return function (dbName, options) {
                    if (underscore.isUndefined(cacheStore[dbName])) {
                        cacheStore[dbName] = new Loki(dbName, underscore.defaults(options || {}, {
                            adapter: adapter
                        }));
                    }

                    return cacheStore[dbName];
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
                    var db = lokiCache(dbName, underscore.defaults(options || {}, {
                        autoload: true,
                        autosave: true,
                        autoloadCallback: function () {
                            collectionStore[key] = db.getCollection(collectionName);

                            if (collectionStore[key] == null) {
                                collectionStore[key] = db.addCollection(collectionName);
                            }

                            promise.resolve(collectionStore[key]);
                        }
                    }));
                } else {
                    promise.resolve(collectionStore[key]);
                }
            });
        };
    }]);
