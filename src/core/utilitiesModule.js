var sdkUtilitiesApp = angular.module('ag.sdk.utilities', ['ngCookies', 'ag.sdk.id']);

sdkUtilitiesApp.factory('safeApply', ['$rootScope', function ($rootScope) {
    return function (fn) {
        if ($rootScope.$$phase) {
            fn();
        } else {
            $rootScope.$apply(fn);
        }
    };
}]);

sdkUtilitiesApp.directive('stopEvent', function () {
    return {
        restrict: 'A',
        link: function (scope, element, attr) {
            element.bind(attr.stopEvent, function (e) {
                e.stopPropagation();
            });
        }
    };
});

sdkUtilitiesApp.factory('dataMapService', [function() {
    return function(items, mapping, excludeId) {
        var mappedItems = [];

        if (items instanceof Array === false) {
            items = (items !== undefined ? [items] : []);
        }

        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            var mappedItem;

            if (typeof mapping === 'function') {
                mappedItem = mapping(item);
            } else {
                mappedItem = {};

                for (var key in mapping) {
                    if (mapping.hasOwnProperty(key)) {
                        mappedItem[key] = item[mapping[key]];
                    }
                }
            }

            if (mappedItem instanceof Array) {
                mappedItems = mappedItems.concat(mappedItem);
            } else if (typeof mappedItem === 'object') {
                if (excludeId !== true) {
                    mappedItem.id = mappedItem.id || item.id;
                }

                mappedItems.push(mappedItem);
            } else if (mappedItem !== undefined) {
                mappedItems.push(mappedItem);
            }
        }

        return mappedItems;
    }
}]);

sdkUtilitiesApp.factory('pagingService', ['$rootScope', '$http', 'promiseService', 'dataMapService', 'generateUUID', 'underscore', 'uriQueryFormatArrays', function($rootScope, $http, promiseService, dataMapService, generateUUID, underscore, uriQueryFormatArrays) {
    var _listId = generateUUID();

    return {
        initialize: function(requestor, dataMap, itemStore, options) {
            if (typeof itemStore == 'object') {
                options = itemStore;
                itemStore = dataMap;
                dataMap = undefined;
            }

            if (typeof dataMap == 'object') {
                options = dataMap;
                itemStore = undefined;
                dataMap = undefined;
            }

            _listId = generateUUID();
            itemStore = itemStore || function (data) {
                $rootScope.$broadcast('paging::items', data);
            };

            var _pagingDefaults = _.defaults(options || {}, {
                limit: 50,
                resulttype: 'simple'
            });

            var _scroll = {
                page: _.clone(_pagingDefaults),
                busy: false,
                complete: false,
                disabled: function () {
                    return (_scroll.busy || _scroll.complete || (_scroll.searching !== undefined && _scroll.searching.complete));
                },
                search: function (query) {
                    if (query && query.length > 0) {
                        if (_scroll.searching === undefined || (_scroll.searching.complete === false || _scroll.searching.search !== query)) {
                            _scroll.searching = _.defaults({
                                search: query
                            }, _pagingDefaults);
                        }

                        _scroll.request();
                    } else {
                        delete _scroll.searching;
                    }
                },
                request: function (params) {
                    return promiseService.wrap(function (promise) {
                        if (_scroll.disabled()) {
                            promise.reject();
                        } else {
                            var currentListId = _listId;

                            params = params || (_scroll.searching ? _scroll.searching : _scroll.page);

                            _scroll.busy = true;
                            delete params.complete;

                            requestor(params).then(function(res) {
                                if (params.search === undefined) {
                                    _scroll.page.offset = (_scroll.page.offset === undefined ? res.length : _scroll.page.offset + res.length);
                                    _scroll.complete = (res.length !== _scroll.page.limit);
                                } else {
                                    _scroll.searching = params;
                                    _scroll.searching.offset = (_scroll.searching.offset === undefined ? res.length : _scroll.searching.offset + res.length);
                                    _scroll.searching.complete = (res.length !== _scroll.searching.limit);
                                }

                                _scroll.busy = false;

                                if (dataMap) {
                                    res = dataMapService(res, dataMap);
                                }

                                if (currentListId === _listId) {
                                    itemStore(res);
                                }

                                promise.resolve(res);
                            }, function (err) {
                                _scroll.complete = true;
                                _scroll.busy = false;

                                promise.reject(err);
                            });
                        }
                    });
                }
            };

            return _scroll;
        },
        page: function(endPoint, params) {
            return promiseService.wrap(function(promise) {
                var _handleResponse = function (res) {
                    promise.resolve(res.data);
                };

                if (underscore.isUndefined(params)) {
                    $http.get(endPoint, {withCredentials: true}).then(_handleResponse, promise.reject);
                } else if (underscore.isString(params)) {
                    $http.get(params, {withCredentials: true}).then(_handleResponse, promise.reject);
                } else {
                    var httpRequest = (underscore.isObject(params.resulttype) ? {
                        method: 'POST',
                        url: endPoint,
                        data: params.resulttype,
                        params: uriQueryFormatArrays(underscore.omit(params, 'resulttype')),
                        withCredentials: true
                    } : {
                        method: 'GET',
                        url: endPoint,
                        params: uriQueryFormatArrays(params),
                        withCredentials: true
                    });

                    $http(httpRequest).then(_handleResponse, promise.reject);
                }
            });
        }
    };
}]);

sdkUtilitiesApp.factory('apiPager', ['pagingService', 'promiseService', function (pagingService, promiseService) {
    return function (initializeFn, params) {
        return promiseService.wrap(function (promise) {
            var results = [];
            var paging = pagingService.initialize(initializeFn, function (items) {
                results = results.concat(items);

                if (paging.complete) {
                    promise.resolve(results);
                } else {
                    paging.request().catch(promise.reject);
                }
            }, params);

            paging.request().catch(promise.reject);
        });
    }
}]);

sdkUtilitiesApp.factory('httpRequestor', ['$http', 'underscore', 'uriQueryFormatArrays', function ($http, underscore, uriQueryFormatArrays) {
    return function (url, params) {
        params = params || {};

        return $http(underscore.extend(underscore.isObject(params.resulttype) ? {
            method: 'POST',
            data: params.resulttype,
            params: uriQueryFormatArrays(underscore.omit(params, 'resulttype'))
        } : {
            method: 'GET',
            params: uriQueryFormatArrays(params)
        }, {
            url: url,
            withCredentials: true
        })).then(function (result) {
            return result.data;
        });
    }
}]);

sdkUtilitiesApp.factory('promiseService', ['$timeout', '$q', 'safeApply', function ($timeout, $q, safeApply) {
    var _defer = function() {
        var deferred = $q.defer();

        return {
            resolve: function (response) {
                safeApply(function () {
                    deferred.resolve(response);
                });

            },
            reject: function (response) {
                safeApply(function () {
                    deferred.reject(response);
                });

            },
            promise: deferred.promise
        }
    };

    var _chainAll = function (action, list) {
        var deferred = $q.defer();
        var chain = deferred.promise;
        var results = [];

        action(list);

        var chainItem = function(item) {
            return chain.then(function (result) {
                if (result instanceof Array) {
                    results = results.concat(result);
                } else if (result) {
                    results.push(result);
                }

                return (item ? item() : results);
            }, function (err) {
                throw err;
            });
        };

        angular.forEach(list, function (item) {
            chain = chainItem(item);
        });

        deferred.resolve();

        return chainItem();
    };

    var _wrapAll = function (action, list) {
        action(list);

        return $q.all(list);
    };

    var _wrap = function (action) {
        var deferred = _defer();

        $timeout(function () {
            action(deferred);
        }, 0);

        return deferred.promise;
    };

    return {
        all: $q.all,
        reject: $q.reject,
        resolve: $q.resolve,
        chain: function (action) {
            return _chainAll(action, []);
        },
        wrap: _wrap,
        wrapAll: function (action) {
            return _wrapAll(action, []);
        },
        arrayWrap: function (action) {
            return _wrapAll(action, []);
        },
        objectWrap: function (action) {
            return _wrapAll(action, {});
        },
        throwError: function (err) {
            throw err;
        },
        defer: _defer,
        noop: function () {
            return _wrap(function (p) {
                p.resolve();
            });
        }
    }
}]);

sdkUtilitiesApp.factory('localStore', ['$cookieStore', '$window', function ($cookieStore, $window) {
    return {
        setItem: function (key, value) {
            if ($window.localStorage) {
                $window.localStorage.setItem(key, JSON.stringify(value));
            } else {
                $cookieStore.put(key, value);
            }
        },
        getItem: function (key, defaultValue) {
            if ($window.localStorage) {
                return JSON.parse($window.localStorage.getItem(key)) || defaultValue;
            } else {
                return $cookieStore.get(key) || defaultValue;
            }
        },
        removeItem: function (key) {
            if ($window.localStorage) {
                $window.localStorage.removeItem(key);
            } else {
                $cookieStore.remove(key);
            }
        }
    }
}]);

sdkUtilitiesApp.factory('colorHash', ['md5', function (md5) {
    function hashCode (str) {
        var hash = 0;
        for (var i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        return hash;
    }

    return function (str) {
        var c = (hashCode(str) & 0x00FFFFFF)
            .toString(16)
            .toUpperCase();

        return '#' + ('00000'.substring(0, 6 - c.length)) + c;
    };
}]);

sdkUtilitiesApp.filter('round', [function () {
    return function (value, precision) {
        precision = precision || 2;

        return Number(Math.round(value + 'e' + precision) + 'e-' + precision);
    };
}]);

sdkUtilitiesApp.factory('asJson', ['deepCopy', 'underscore', function (deepCopy, underscore) {
    function omitFn (omit) {
        return function (object) {
            var json = (underscore.isFunction(object.asJSON) ? object.asJSON(omit) : deepCopy(object));

            return (omit ? underscore.omit(json, omit) : json);
        }
    }

    return function (object, omit) {
        return (underscore.isArray(object) ? underscore.map(object, omitFn(omit)) : omitFn(omit)(object));
    }
}]);

sdkUtilitiesApp.factory('sortJson', ['underscore', function (underscore) {
    function sortJson(json) {
        var keys = underscore.keys(json).sort();

        return underscore.object(keys, underscore.map(keys, function (key) {
            return sortValue(json[key]);
        }))
    }

    function sortValue (value) {
        return (underscore.isUndefined(value) ? null :
            (underscore.isObject(value) && !underscore.isArray(value) ? sortJson(value) : value));
    }

    return sortValue;
}]);

sdkUtilitiesApp.factory('md5Json', ['md5', 'sortJson', function (md5, sortJson) {
    function compact (json) {
        return (json ? JSON.stringify(json).toLowerCase().replace(' ', '') : json);
    }

    return function (json) {
        return md5(compact(sortJson(json)));
    };
}]);

sdkUtilitiesApp.factory('deepCopy', [function () {
    return function (object) {
        return JSON.parse(JSON.stringify(object));
    }
}]);

sdkUtilitiesApp.factory('safeMath', ['bigNumber', function (bigNumber) {
    bigNumber.config({ERRORS: false});

    return {
        chain: function (value) {
            return new bigNumber(value || 0);
        },
        plus: function (valueA, valueB) {
            return new bigNumber(valueA || 0).plus(valueB || 0).toNumber();
        },
        minus: function (valueA, valueB) {
            return new bigNumber(valueA || 0).minus(valueB || 0).toNumber();
        },
        dividedBy: function (valueA, valueB) {
            return (valueB ? new bigNumber(valueA || 0).dividedBy(valueB).toNumber() : 0);
        },
        times: function (valueA, valueB) {
            return new bigNumber(valueA || 0).times(valueB || 0).toNumber();
        },
        round: function (value, precision) {
            return new bigNumber(value || 0).round(precision).toNumber();
        }
    };
}]);

sdkUtilitiesApp.factory('safeArrayMath', ['safeMath', 'underscore', function (safeMath, underscore) {
    function sortArrays (arrayA, arrayB) {
        arrayA = arrayA || [];
        arrayB = arrayB || [];

        return {
            short: (arrayA.length <= arrayB.length ? arrayA : arrayB),
            long: (arrayA.length > arrayB.length ? arrayA : arrayB)
        }
    }

    function performOperation (arrayA, arrayB, operatorFn) {
        var paddedArrayB = arrayB.concat(arrayB.length >= arrayA.length ? [] :
            underscore.range(arrayA.length - arrayB.length).map(function () {
                return 0;
            }));

        return underscore.reduce(paddedArrayB, function (totals, value, index) {
            totals[index] = operatorFn(totals[index], value);
            return totals;
        }, angular.copy(arrayA));
    }

    function performSortedOperation (arrayA, arrayB, operatorFn) {
        var arrays = sortArrays(arrayA, arrayB);

        return underscore.reduce(arrays.short, function (totals, value, index) {
            totals[index] = operatorFn(totals[index], value);
            return totals;
        }, angular.copy(arrays.long));
    }

    function reduce (array, initialValue, fnName) {
        fnName = fnName || 'plus';
        return underscore.reduce(array || [], function (total, value) {
            return safeMath[fnName](total, value);
        }, initialValue || 0);
    }

    return {
        count: function (array) {
            return underscore.reduce(array, function (total, value) {
                return safeMath.plus(total, (underscore.isNumber(value) && !underscore.isNaN(value) && value > 0 ? 1 : 0));
            }, 0);
        },
        plus: function (arrayA, arrayB) {
            return performSortedOperation(arrayA, arrayB, safeMath.plus);
        },
        minus: function (arrayA, arrayB) {
            return performOperation(arrayA, arrayB, safeMath.minus);
        },
        dividedBy: function (arrayA, arrayB) {
            return performOperation(arrayA, arrayB, safeMath.dividedBy);
        },
        times: function (arrayA, arrayB) {
            return performSortedOperation(arrayA, arrayB, safeMath.times);
        },
        reduce: function (array, initialValue) {
            return reduce(array, initialValue);
        },
        reduceOperator: function (array, fnName, initialValue) {
            return reduce(array, initialValue, fnName);
        },
        reduceProperty: function (array, property, initialValue) {
            return underscore.chain(array || [])
                .pluck(property)
                .reduce(function(total, value) {
                    return safeMath.plus(total, value);
                }, initialValue || 0)
                .value();
        },
        negate: function (array) {
            return underscore.map(array, function (value) {
                return safeMath.times(value, -1);
            });
        },
        round: function (array, precision) {
            return underscore.map(array, function (value) {
                return safeMath.round(value, precision);
            });
        }
    };
}]);

sdkUtilitiesApp.factory('uriQueryFormatArrays', ['underscore', function (underscore) {
    return function (query) {
        return underscore.mapObject(query, function (value) {
            return (underscore.isArray(value) ? value.join(',') : value);
        });
    }
}]);

sdkUtilitiesApp.factory('uriEncodeQuery', ['underscore', function (underscore) {
    return function (query, defaults) {
        return underscore.chain(query || {})
            .defaults(defaults || {})
            .map(function (value, key) {
                return key + '=' + encodeURIComponent(value);
            })
            .value().join('&');
    }
}]);