var mobileSdkHydrationApp = angular.module('ag.mobile-sdk.hydration', ['ag.sdk.utilities', 'ag.sdk.library']);

/*
 * Hydration
 */
mobileSdkHydrationApp.provider('hydration', [function () {
    var _relationTable = {};

    this.registerHydrate = function (model, fn) {
        _relationTable[model] = _relationTable[model] || {};
        _relationTable[model].hydrate = fn;
    };

    this.registerDehydrate = function (model, fn) {
        _relationTable[model] = _relationTable[model] || {};
        _relationTable[model].dehydrate = fn;
    };

    this.$get = ['$injector', 'promiseService', 'underscore', function ($injector, promiseService, underscore) {
        return {
            hydrate: function (obj, type, options) {
                return promiseService
                    .objectWrap(function (promises) {
                        if (options.hydrate && options.hydrate instanceof Array) {
                            angular.forEach(options.hydrate, function (relationName) {
                                var relation = _relationTable[relationName];

                                if (relation && relation.hydrate) {
                                    if (relation.hydrate instanceof Array) {
                                        _relationTable[relationName].hydrate = $injector.invoke(relation.hydrate);
                                    }

                                    promises[relationName] = relation.hydrate(obj, type, options);
                                }
                            });
                        }
                    })
                    .then(function (results) {
                        return (results ? underscore.extend(obj, results) : obj);
                    }, function () {
                        return obj;
                    });
            },
            dehydrate: function (obj, type, options) {
                return promiseService
                    .objectWrap(function (promises) {
                        if (options.dehydrate && options.dehydrate instanceof Array) {
                            angular.forEach(options.dehydrate, function (relationName) {
                                var relation = _relationTable[relationName];

                                if (obj[relationName] && relation && relation.dehydrate) {
                                    if (relation.dehydrate instanceof Array) {
                                        _relationTable[relationName].dehydrate = $injector.invoke(relation.dehydrate);
                                    }

                                    promises[relationName] = relation.dehydrate(obj, type);
                                }
                            });
                        }
                    })
                    .then(function () {
                        return underscore.omit(obj, options.dehydrate);
                    }, function () {
                        return underscore.omit(obj, options.dehydrate);
                    });
            }
        };
    }];
}]);
