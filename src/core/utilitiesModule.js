var skdUtilitiesApp = angular.module('ag.sdk.utilities', ['ngCookies']);

skdUtilitiesApp.run(['stateResolver', function (stateResolver) {
    // Initialize stateResolver
}]);

skdUtilitiesApp.provider('stateResolver', function () {
    var _stateTable = {};

    this.when = function (states, resolverInjection) {
        if (states instanceof Array) {
            angular.forEach(states, function (state) {
                _stateTable[state] = resolverInjection;
            })
        } else {
            _stateTable[states] = resolverInjection;
        }

        return this;
    };

    this.resolver = function () {
        return {
            data: ['stateResolver', function (stateResolver) {
                return stateResolver.getData();
            }]
        }
    };

    this.$get = ['$rootScope', '$state', '$injector', function ($rootScope, $state, $injector) {
        var nextState = undefined;

        $rootScope.$on('$stateChangeStart', function (event, toState) {
            nextState = toState;
        });

        return {
            getData: function () {
                return (nextState && _stateTable[nextState.name] ? $injector.invoke(_stateTable[nextState.name]) : undefined);
            }
        }
    }];
});


skdUtilitiesApp.factory('safeApply', ['$rootScope', function ($rootScope) {
    return function (fn) {
        if ($rootScope.$$phase) {
            fn();
        } else {
            $rootScope.$apply(fn);
        }
    };
}]);

skdUtilitiesApp.factory('dataMapService', [function() {
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

skdUtilitiesApp.factory('pagingService', ['$rootScope', '$http', 'promiseService', 'dataMapService', function($rootScope, $http, promiseService, dataMapService) {
    return {
        initialize: function(requestor, dataMap, itemStore, options) {
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
                    params = params || (_scroll.searching ? _scroll.searching : _scroll.page);

                    _scroll.busy = true;

                    return promiseService.wrap(function(promise) {
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

                            itemStore(res);

                            promise.resolve(res);
                        }, promise.reject);
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

                if (params !== undefined) {
                    if (typeof params === 'string') {
                        $http.get(params, {withCredentials: true}).then(_handleResponse, promise.reject);
                    } else {
                        $http.get(endPoint, {params: params, withCredentials: true}).then(_handleResponse, promise.reject);
                    }
                } else {
                    $http.get(endPoint, {withCredentials: true}).then(_handleResponse, promise.reject);
                }
            });
        }
    };
}]);

skdUtilitiesApp.factory('promiseService', ['$q', 'safeApply', function ($q, safeApply) {
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

    var _chainAll = function (action, init) {
        var list = init;
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

    var _wrapAll = function (action, init) {
        var list = init;

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
        throwError: function (err) {
            throw err;
        },
        defer: _defer
    }
}]);

skdUtilitiesApp.factory('localStore', ['$cookieStore', '$window', function ($cookieStore, $window) {
    return {
        setItem: function (key, value) {
            if ($window.localStorage) {
                $window.localStorage.setItem(key, JSON.stringify(value));
            } else {
                $cookieStore.put(key, value);
            }
        },
        getItem: function (key) {
            if ($window.localStorage) {
                return JSON.parse($window.localStorage.getItem(key));
            } else {
                return $cookieStore.get(key);
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

skdUtilitiesApp.directive('signature', ['$compile', function ($compile) {
    return {
        restrict: 'E',
        replace: true,
        template: '<div class="panel panel-default signature"><div class="panel-heading">{{ title }}<div class="btn btn-default btn-sm pull-right" ng-click="reset()">Clear</div></div></div>',
        scope: {
            onsigned: '=',
            name: '@',
            title: '@'
        },
        link: function (scope, element, attrs) {
            var sigElement = $compile('<div class="panel-body signature-body"></div>')(scope);

            element.append(sigElement);

            scope.reset = function() {
                sigElement.jSignature('reset');

                scope.onsigned(attrs.name, null);
            };

            sigElement.jSignature({
                'width': attrs.width,
                'height': attrs.height,
                'showUndoButton': false});

            sigElement.bind('change', function() {
                scope.onsigned(attrs.name, sigElement.jSignature('getData', 'svgbase64'));
            });
        }
    };
}]);
