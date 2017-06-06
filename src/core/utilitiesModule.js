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

sdkUtilitiesApp.factory('pagingService', ['$rootScope', '$http', 'promiseService', 'dataMapService', 'generateUUID', 'underscore', function($rootScope, $http, promiseService, dataMapService, generateUUID, underscore) {
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
                        params: underscore.omit(params, 'resulttype'),
                        withCredentials: true
                    } : {
                        method: 'GET',
                        url: endPoint,
                        params: params,
                        withCredentials: true
                    });

                    $http(httpRequest).then(_handleResponse, promise.reject);
                }
            });
        }
    };
}]);

sdkUtilitiesApp.factory('httpRequestor', ['$http', 'underscore', function ($http, underscore) {
    return function (url, params) {
        return $http(underscore.extend(underscore.isObject(params.resulttype) ? {
            method: 'POST',
            data: params.resulttype,
            params: underscore.omit(params, 'resulttype')
        } : {
            method: 'GET',
            params: params
        }, {
            url: url,
            withCredentials: true
        })).then(function (result) {
            return result.data;
        });
    }
}]);

sdkUtilitiesApp.factory('promiseService', ['$q', 'safeApply', function ($q, safeApply) {
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

    return {
        all: function (promises) {
            return $q.all(promises);
        },
        chain: function (action) {
            return _chainAll(action, []);
        },
        wrap: function(action) {
            var deferred = _defer();

            action(deferred);

            return deferred.promise;
        },
        wrapAll: function (action) {
            return _wrapAll(action, []);
        },
        arrayWrap: function (action) {
            return _wrapAll(action, []);
        },
        objectWrap: function (action) {
            return _wrapAll(action, {});
        },
        reject: function (obj) {
            return $q.reject(obj);
        },
        throwError: function (err) {
            throw err;
        },
        defer: _defer
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

sdkUtilitiesApp.filter('round', [function () {
    return function (value, precision) {
        precision = precision || 2;

        return Number(Math.round(value + 'e' + precision) + 'e-' + precision);
    };
}]);