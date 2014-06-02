var sdkAuthorizationApp = angular.module('ag.sdk.authorization', ['ag.sdk.config', 'ag.sdk.utilities']);

sdkAuthorizationApp.factory('authorizationApi', ['$http', 'promiseService', 'configuration', function($http, promiseService, configuration) {
    var _host = configuration.getServer();
    
    return {
        login: function (email, password) {
            return promiseService.wrap(function(promise) {
                $http.post(_host + 'login', {email: email, password: password}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        resetPassword: function (hash, password) {
            return promiseService.wrap(function(promise) {
                $http.post(_host + 'api/password-reset', {hash: hash, password: password}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        requestResetPasswordEmail: function(email) {
            return promiseService.wrap(function(promise) {
                $http.post(_host + 'api/password-reset-email', {email: email}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        changePassword: function (id, oldPassword, newPassword) {
            return promiseService.wrap(function(promise) {
                $http.post(_host + 'api/user/password', {password: oldPassword, newPassword: newPassword}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getUser: function () {
            return promiseService.wrap(function(promise) {
                $http.get(_host + 'current-user', {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        registerUser: function (data) {
            return promiseService.wrap(function(promise) {
                $http.post(_host + 'api/register', data).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        logout: function() {
            return $http.post(_host + 'logout');
        }
    };
}]);

sdkAuthorizationApp.provider('authorization', ['$httpProvider', function ($httpProvider) {
    // TODO: make read-only
    var _userRoles = {
        open: 1,
        user: 2,
        admin: 4
    };
    var _accessLevels = {
        open: (_userRoles.open | _userRoles.user | _userRoles.admin),
        user: (_userRoles.user | _userRoles.admin),
        admin: (_userRoles.admin)
    };

    var _defaultUser = {
        email: '',
        role: _userRoles.open
    };

    var _lastError = undefined;

    // Intercept any HTTP responses that are not authorized
    $httpProvider.interceptors.push(['$q', '$injector', '$rootScope', function ($q, $injector, $rootScope) {
        return {
            responseError: function (err) {
                if (err.status === 401) {
                    $rootScope.$broadcast('authorization::unauthorized');
                }

                return $q.reject(err);
            }
        }
    }]);

    return {
        userRole: _userRoles,
        accessLevel: _accessLevels,

        $get: ['$rootScope', 'authorizationApi', 'localStore', 'promiseService', function ($rootScope, authorizationApi, localStore, promiseService) {
            var _user = _getUser();

            authorizationApi.getUser().then(function (res) {
                if (res.user !== null) {
                    _user = _setUser(res.user);

                    $rootScope.$broadcast('authorization::login', _user);
                } else if (_user.isActive !== true) {
                    $rootScope.$broadcast('authorization::unauthorized');
                }
            });

            function _getUser() {
                return localStore.getItem('user') || _defaultUser;
            }

            function _setUser(user) {
                user = user || _defaultUser;

                if (user.role === undefined) {
                    user.role = (user.accessLevel == 'admin' ? _userRoles.admin : _userRoles.user);
                }

                localStore.setItem('user', user);

                return user;
            }

            return {
                userRole: _userRoles,
                accessLevel: _accessLevels,
                lastError: function () {
                    return _lastError;
                },
                currentUser: function () {
                    return _user;
                },

                isAllowed: function (level) {
                    return (level & _user.role) != 0;
                },
                isLoggedIn: function () {
                    return (_accessLevels.user & _user.role) != 0;
                },
                login: function (email, password) {
                    return promiseService.wrap(function(promise) {
                        authorizationApi.login(email, password).then(function (res) {
                            if (res.user !== null) {
                                _lastError = undefined;
                                _user = _setUser(res.user);
                                promise.resolve(_user);

                                $rootScope.$broadcast('authorization::login', _user);
                            } else {
                                _lastError = {
                                    type: 'error',
                                    message: 'The entered e-mail and/or password is incorrect. Please try again.'
                                };

                                _user = _setUser(_defaultUser);
                                promise.reject();
                            }

                        }, function (err) {
                            _user = _setUser(_defaultUser);
                            promise.reject(err);
                        });
                    });
                },
                requestResetPasswordEmail: authorizationApi.requestResetPasswordEmail,
                resetPassword: authorizationApi.resetPassword,
                changePassword: function (oldPassword, newPassword) {
                    return authorizationApi.changePassword(_user.id, oldPassword, newPassword);
                },
                changeUserDetails: function (userDetails) {
                    return authorizationApi.updateUser(_user.id, userDetails).then(function (res) {
                        _user = _setUser(userDetails);
                    });
                },
                register: function(data) {
                    return promiseService.wrap(function(promise) {
                        authorizationApi.registerUser(data).then(function (res) {
                            if (res !== null) {
                                _lastError = undefined;
                                _user = _setUser(res);
                                promise.resolve(_user);

                                $rootScope.$broadcast('authorization::login', _user);
                            } else {
                                _user = _setUser(_defaultUser);
                                promise.reject();
                            }
                        }, function (err) {
                            _lastError = {
                                type: 'error',
                                message: 'There is already an Agrista account associated with this email address. Please login.'
                            };

                            _user = _setUser(_defaultUser);
                            promise.reject(err);
                        });
                    });
                },
                logout: function () {
                    $rootScope.$broadcast('authorization::logout');

                    return authorizationApi.logout().then(function () {
                        _user = _setUser(_defaultUser);
                    });
                }
            }
        }]
    }
}]);

var sdkConfigApp = angular.module('ag.sdk.config', []);

/**
 * @name configurationProvider / configuration
 * @description Provider to define the configuration of servers
 */
sdkConfigApp.provider('configuration', ['$httpProvider', function($httpProvider) {
    var _version = '';
    var _host = 'local';

    var _servers = {
        local: '',
        testing: 'https://uat.enterprise.agrista.com/',
        staging: 'https://staging.enterprise.agrista.com/',
        production: 'https://enterprise.agrista.com/'
    };

    return {
        setServers: function(servers) {
            angular.forEach(servers, function (host, name) {
                if (host.lastIndexOf('/') !== host.length - 1) {
                    host += '/';
                }

                _servers[name] = host;
            });

            this.useHost(_host, _version);
        },
        useHost: function(host, version, cCallback) {
            if (typeof version === 'function') {
                cCallback = version;
                version = '';
            }

            _version = version || '';

            if (_servers[host] !== undefined) {
                _host = host;

                // Enable cross domain
                $httpProvider.defaults.useXDomain = true;
                delete $httpProvider.defaults.headers.common['X-Requested-With'];
            }

            if (typeof cCallback === 'function') {
                cCallback(_servers[_host]);
            }
        },
        $get: function() {
            return {
                getVersion: function() {
                    return _version;
                },
                getHost: function() {
                    return _host;
                },
                getServer: function() {
                    return _servers[_host];
                }
            }
        }
    }
}]);
var sdkIdApp = angular.module('ag.sdk.id', ['ag.sdk.utilities']);

sdkIdApp.factory('objectId', ['localStore', function(localStore) {
    /*
     *
     * Copyright (c) 2011 Justin Dearing (zippy1981@gmail.com)
     * Dual licensed under the MIT (http://www.opensource.org/licenses/mit-license.php)
     * and GPL (http://www.opensource.org/licenses/gpl-license.php) version 2 licenses.
     * This software is not distributed under version 3 or later of the GPL.
     *
     * Version 1.0.1-dev
     *
     */

    /**
     * Javascript class that mimics how WCF serializes a object of type MongoDB.Bson.ObjectId
     * and converts between that format and the standard 24 character representation.
     */
    var ObjectId = (function () {
        var increment = 0;
        var pid = Math.floor(Math.random() * (32767));
        var machine = Math.floor(Math.random() * (16777216));

        // Get local stored machine id
        var mongoMachineId = parseInt(localStore.getItem('mongoMachineId'));

        if (mongoMachineId >= 0 && mongoMachineId <= 16777215) {
            machine = Math.floor(localStore.getItem('mongoMachineId'));
        }

        // Just always stick the value in.
        localStore.setItem('mongoMachineId', machine);

        function ObjId() {
            if (!(this instanceof ObjectId)) {
                return new ObjectId(arguments[0], arguments[1], arguments[2], arguments[3]).toString();
            }

            if (typeof (arguments[0]) == 'object') {
                this.timestamp = arguments[0].timestamp;
                this.machine = arguments[0].machine;
                this.pid = arguments[0].pid;
                this.increment = arguments[0].increment;
            }
            else if (typeof (arguments[0]) == 'string' && arguments[0].length == 24) {
                this.timestamp = Number('0x' + arguments[0].substr(0, 8)),
                    this.machine = Number('0x' + arguments[0].substr(8, 6)),
                    this.pid = Number('0x' + arguments[0].substr(14, 4)),
                    this.increment = Number('0x' + arguments[0].substr(18, 6))
            }
            else if (arguments.length == 4 && arguments[0] != null) {
                this.timestamp = arguments[0];
                this.machine = arguments[1];
                this.pid = arguments[2];
                this.increment = arguments[3];
            }
            else {
                this.timestamp = Math.floor(new Date().valueOf() / 1000);
                this.machine = machine;
                this.pid = pid;
                this.increment = increment++;
                if (increment > 0xffffff) {
                    increment = 0;
                }
            }
        };
        return ObjId;
    })();

    ObjectId.prototype.getDate = function () {
        return new Date(this.timestamp * 1000);
    };

    ObjectId.prototype.toArray = function () {
        var strOid = this.toString();
        var array = [];
        var i;
        for(i = 0; i < 12; i++) {
            array[i] = parseInt(strOid.slice(i*2, i*2+2), 16);
        }
        return array;
    };

    /**
     * Turns a WCF representation of a BSON ObjectId into a 24 character string representation.
     */
    ObjectId.prototype.toString = function () {
        var timestamp = this.timestamp.toString(16);
        var machine = this.machine.toString(16);
        var pid = this.pid.toString(16);
        var increment = this.increment.toString(16);
        return '00000000'.substr(0, 8 - timestamp.length) + timestamp +
            '000000'.substr(0, 6 - machine.length) + machine +
            '0000'.substr(0, 4 - pid.length) + pid +
            '000000'.substr(0, 6 - increment.length) + increment;
    };

    ObjectId.prototype.toBase64String = function() {
        return window.btoa(this.toString());
    };

    return function() {
        return new ObjectId();
    };
}]);

sdkIdApp.factory('generateUUID', function () {
    function GenerateUUID () {
        var d = new Date().getTime();
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = (d + Math.random()*16)%16 | 0;
            d = Math.floor(d/16);
            return (c=='x' ? r : (r&0x7|0x8)).toString(16);
        });
        return uuid;
    };

    return function() {
        return GenerateUUID();
    };
});

var sdkMonitorApp = angular.module('ag.sdk.monitor', ['ag.sdk.utilities']);

sdkMonitorApp.factory('queueService', ['$log', '$q', 'promiseService', function ($log, $q, promiseService) {
    function QueueService(options, callback) {
        // Check if instance of QueueService
        if (!(this instanceof QueueService)) {
            return new QueueService(options, callback);
        }

        // Validate parameters
        if (typeof options === 'function') {
            callback = options;
            options = { limit: 1 };
        }
        if (typeof options !== 'object') options = { limit: 1 };
        if (typeof callback !== 'function') callback = angular.noop;

        var _queue = [];
        var _limit = options.limit || 1;
        var _progress = {
            total: 0,
            complete: 0
        };

        // Private Functions
        var _next = function () {
            _limit++;

            if (_progress.complete < _progress.total) {
                _progress.complete++;
            }

            pop();
        };

        var _success = _next;
        var _error = function () {
            callback({type: 'error'});

            _next();
        };

        // Public Functions
        var push = function (action, deferred) {
            _progress.total++;
            _queue.push([action, deferred]);

            pop();
        };

        var pop = function () {
            callback({type: 'progress', percent: (100.0 / _progress.total) * _progress.complete});

            $log.debug('QUEUE TOTAL: ' + _progress.total + ' COMPLETE: ' + _progress.complete + ' PERCENT: ' + (100.0 / _progress.total) * _progress.complete);

            if (_queue.length === 0 && _progress.total === _progress.complete) {
                _progress.total = 0;
                _progress.complete = 0;

                callback({type: 'complete'});
            }

            if (_limit <= 0 || _queue.length === 0) {
                return;
            }

            _limit--;

            var buffer = _queue.shift(),
                action = buffer[0],
                deferred = buffer[1];

            deferred.promise.then(_success, _error);

            action(deferred);
        };

        var clear = function () {
            _progress.total = 0;
            _progress.complete = 0;
            _queue.length = 0;
        };

        var wrapPush = function (action) {
            var deferred = promiseService.defer();

            push(action, deferred);

            return deferred.promise;
        };

        return {
            wrapPush: wrapPush,
            push: push,
            pop: pop,
            clear: clear
        }
    }

    return function (options, callback) {
        return new QueueService(options, callback);
    };
}]);

sdkMonitorApp.factory('promiseMonitor', ['$log', 'safeApply', function ($log, safeApply) {
    function PromiseMonitor(callback) {
        if (!(this instanceof PromiseMonitor)) {
            return new PromiseMonitor(callback);
        }

        var _stats = {
            total: 0,
            complete: 0,
            resolved: 0,
            rejected: 0,
            percent: 0
        };

        var _completePromise = function () {
            _stats.complete++;
            _stats.percent = (100.0 / _stats.total) * _stats.complete;

            $log.debug('MONITOR TOTAL: ' + _stats.total + ' COMPLETE: ' + _stats.complete + ' PERCENT: ' + _stats.percent);

            safeApply(function () {
                if (_stats.complete == _stats.total) {
                    callback({type: 'complete', percent: _stats.percent, stats: _stats});
                } else {
                    callback({type: 'progress', percent: _stats.percent, stats: _stats});
                }
            });
        };

        return {
            stats: function () {
                return _stats;
            },
            clear: function () {
                _stats = {
                    total: 0,
                    complete: 0,
                    resolved: 0,
                    rejected: 0,
                    percent: 0
                };
            },
            add: function (promise) {
                _stats.total++;

                promise.then(function (res) {
                    _stats.resolved++;

                    _completePromise();
                }, function (err) {
                    _stats.rejected++;

                    safeApply(function () {
                        callback({type: 'error'}, err);
                    });

                    _completePromise();
                });

                return promise;
            }
        };
    }

    return function (callback) {
        return new PromiseMonitor(callback);
    }
}]);

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
        initialize: function(requestor, dataMap, itemStore) {
            itemStore = itemStore || function (data) {
                $rootScope.$broadcast('paging::items', data);
            };

            var _scroll = {
                page: {limit: 50},
                busy: false,
                complete: false,
                disabled: function() {
                    return (_scroll.busy || _scroll.complete);
                },
                request: function() {
                    return promiseService.wrap(function(promise) {
                        _scroll.busy = true;

                        requestor(_scroll.page).then(function(res) {
                            _scroll.page = res.paging;
                            _scroll.complete = (_scroll.page === undefined);
                            _scroll.busy = false;

                            if (_scroll.page !== undefined) {
                                res = res.data;
                            }

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
        page: function(endPoint, paging) {
            return promiseService.wrap(function(promise) {
                var _handleResponse = function (res) {
                    promise.resolve(res.data);
                };

                if (paging !== undefined) {
                    if (typeof paging === 'string') {
                        $http.get(paging, {withCredentials: true}).then(_handleResponse, promise.reject);
                    } else {
                        $http.get(endPoint, {params: paging, withCredentials: true}).then(_handleResponse, promise.reject);
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

    var _wrapAll = function (action, init) {
        var list = init;

        action(list);

        return $q.all(list);
    };
    
    return {
        all: function (promises) {
            return $q.all(promises);
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
var sdkHelperAssetApp = angular.module('ag.sdk.helper.asset', ['ag.sdk.helper.farmer']);

sdkHelperAssetApp.factory('assetHelper', ['$filter', 'landUseHelper', function($filter, landUseHelper) {
    var _listServiceMap = function(item, metadata) {
        var map = {
            type: item.type,
            updatedAt: item.updatedAt
        };

        if (item.data) {
            if (item.type == 'crop') {
                map.title = (item.data.plantedArea ? item.data.plantedArea.toFixed(2) + 'Ha of ' : '') + (item.data.crop ? item.data.crop : '') + (item.data.fieldName ? ' on field ' + item.data.fieldName : '');
                map.subtitle = (item.data.season ? item.data.season : '');
                map.groupby = item.farmId;
            } else if (item.type == 'farmland') {
                map.title = (item.data.portionNumber == 0 ? 'Remainder of farm' : 'Portion ' + item.data.portionNumber);
                map.subtitle = 'Area: ' + item.data.area.toFixed(2) + 'Ha';
                map.groupby = item.farmId;
            } else if (item.type == 'improvement') {
                map.title = item.data.name;
                map.subtitle = item.data.type + ' - ' + item.data.category;
                map.summary = (item.data.description || '');
                map.groupby = item.farmId;
            } else if (item.type == 'irrigated cropland') {
                map.title = item.data.irrigation + (item.data.fieldName ? ' on field ' + item.data.fieldName : '');
                map.subtitle = 'Equipped Area: ' + item.data.size.toFixed(2) + 'Ha';
                map.groupby = item.farmId;
            } else if (item.type == 'livestock') {
                map.title = item.data.type + ' - ' + item.data.category;
                map.subtitle = (item.data.breed ? item.data.breed + ' for ' : 'For ') + item.data.purpose;
                map.summary = (item.data.description || '');
                map.groupby = item.data.type;
            } else if (item.type == 'pasture') {
                map.title = (item.data.crop ? item.data.crop : 'Natural') + (item.data.fieldName ? ' on field ' + item.data.fieldName : '');
                map.subtitle = (item.data.plantedDate ? 'Planted: ' + $filter('date')(item.data.plantedDate, 'dd/MM/yy') : '');
                map.groupby = item.farmId;
            } else if (item.type == 'permanent crop') {
                map.title = item.data.crop + (item.data.fieldName ? ' on field ' + item.data.fieldName : '');
                map.subtitle = (item.data.establishedDate ? 'Established: ' + $filter('date')(item.data.establishedDate, 'dd/MM/yy') : '');
                map.groupby = item.farmId;
            } else if (item.type == 'plantation') {
                map.title = item.data.crop + (item.data.fieldName ? ' on field ' + item.data.fieldName : '');
                map.subtitle = (item.data.establishedDate ? 'Established: ' + $filter('date')(item.data.establishedDate, 'dd/MM/yy') : '');
                map.groupby = item.farmId;
            } else if (item.type == 'vme') {
                map.title = item.data.category + (item.data.model ? ' model ' + item.data.model : '');
                map.subtitle = 'Quantity: ' + item.data.quantity;
                map.summary = (item.data.description || '');
                map.groupby = item.data.type;
            } else if (item.type == 'water right') {
                map.title = item.data.waterSource + (item.data.fieldName ? ' on field ' + item.data.fieldName : '');
                map.subtitle = 'Irrigatable Extent: ' + item.data.size.toFixed(2) + 'Ha';
                map.groupby = item.farmId;
            }

            if (item.data.attachments) {
                var validImages = ['png', 'jpg', 'jpeg', 'gif'];

                for (var i = 0; i < item.data.attachments.length; i++) {
                    var attachment = item.data.attachments[i];

                    for (var x = 0; x < validImages.length; x++) {
                        if (attachment.key.indexOf(validImages[x]) != -1) {
                            map.image = attachment.src;
                        }
                    }
                }
            }
        }

        if (metadata) {
            map = _.extend(map, metadata);
        }

        return map;
    };

    var _assetTypes = {
        'crop': 'Crops',
        'farmland': 'Farmlands',
        'improvement': 'Fixed Improvements',
        'irrigated cropland': 'Irrigated Cropland',
        'livestock': 'Livestock',
        'pasture': 'Pastures',
        'permanent crop': 'Permanent Crops',
        'plantation': 'Plantations',
        'vme': 'Vehicles, Machinery & Equipment',
        'water right': 'Water Rights'
    };

    var _assetSubtypes = {
        'improvement': ['Livestock & Game', 'Crop Cultivation & Processing', 'Residential', 'Business','Equipment & Utilities','Infrastructure','Recreational & Misc.'],
        'livestock': ['Cattle', 'Sheep', 'Pigs', 'Chickens', 'Ostriches', 'Goats'],
        'vme': ['Vehicles', 'Machinery', 'Equipment']
    };

    var _assetCategories = {
        improvement: {
            'Livestock & Game': ['Abattoir','Animal Cages','Animal Camp','Animal Feedlot','Animal Growing House','Animal Handling Equiment','Animal Handling Facility','Animal Pens','Animal Sale Facility','Animal Shelter','Animal Stable','Anti-Poaching Training Facility','Arena','Auction Facilities','Aviary','Barn','Beekeeping Room','Bottling Facility','Breeding Facility','Broiler House','Broiler House - Atmosphere','Broiler House - Semi','Broiler Unit','Cheese Factory','Chicken Coop','Chicken Run','Cooling Facility','Crocodile Dams','Dairy','Deboning Room','Dry Oven','Dry Storage','Drying Facility','Drying Ovens','Drying Racks','Drying Strips','Drying Tunnels','Egg Grading Facility','Egg Packaging Building','Elephant Enclosures','Embryo Room','Feed Dispensers','Feed Mill','Feed Storeroom','Feeding Lot','Feeding Pens','Feeding Shelter','Feeding Troughs','Filter Station','Fish Market Buildings','Flavour Shed','Game Cage Facility','Game Lodge','Game Pens','Game Room','Game Slaughter Area','Game Viewing Area','Grading Room','Handling Facilities','Hatchery','Hide Store','Hing Pen','Horse Walker','Hunters','Hide Storeroom','Inspection Room','Kennels','Kraal','Laying Hen House','Maternity House','Maternity Pens','Meat Processing Facility','Milk Bottling Plant','Milk Tank Room','Milking Parlour','Other','Packaging Complex','Packaging Facility','Paddocks','Pasteurising Facility','Pens','Pig Sty','Poison Store','Post-Feeding Shed','Processing Facility','Quarantine Area','Racing Track','Rankin Game','Refrigeration Facility','Rehab Facility','Saddle Room','Sales Facility','Selling Kraal','Shearing Facility','Shed','Shelter','Shooting Range','Skinning Facility','Slaughter Facility','Sorting Facility','Stable','Stall','Stock Handling Facility','Storage Facility','Sty','Surgery','Treatment Area','Trout Dam','Warehouse'],
            'Crop Cultivation & Processing': ["Crop Cultivation & Processing","Barrel Maturation Room","Bottling Facility","Carton Shed","Cellar","Chemical Shed","Compost Pasteurising Unit","Compost Preparing Unit","Cooling Facility","Crushing Plant","Dark Room","Degreening Room","Dehusking Shed","Dry Oven","Dry Sow House","Dry Storage","Drying Facility","Drying Ovens","Drying Racks","Drying Strips","Drying Tunnels","Farrowing House","Fertilizer Shed","Flavour Shed","Food Plant Shed","Fruit Dry Tracks","Fruit Hopper","Gardening Facility","Germination Facility","Grading Room","Grain Handling Equipment","Grain Loading Facility","Grain Mill","Grain Silos","Grain Store","Greenhouse","Grower Unit","Handling Facilities","Hopper","Hothouse","Igloo","Inspection Room","Irrigation Dam","Irrigation Pump","Irrigation Reservoir","Irrigation System","Mill","Milling Store","Mushroom Cultivation Building","Mushroom Sweat Room","Nursery (Plant)","Nut Cracking Facility","Nut Factory","Oil Store","Onion Drying Shed","Other","Packaging Complex","Packaging Facility","Pesticide Store","Poison Store","Processing Facility","Refrigeration Facility","Sales Facility","Seed Store","Seedling Growing Facility","Seedling Packaging Facility","Shed","Silo","Sorting Facility","Sprinklers","Storage Facility","Tea Drying Facility","Tea Room","Tobacco Dryers","Warehouse","Wine Cellar","Wine Storage Shed","Wine Tanks","Winery Building"],
            'Residential': ["Ablution Facility","Accommodation Units","Attic","Balcony","Bathroom","Bedroom","Building","Bungalow","Bunk House","Cabin","Camp Accommodation","Canteen","Caretaker's Dwelling","Chalet","Cloak Room","Community Dwelling","Cottage","Dining Area","Dining Facility","Dormitory","Dressing Rooms","Drivers' Accommodation","Dwelling","Estate House","Flat","Foreman's Dwelling","Game Lodge","Guest Accommodation","Homestead","Hostels","House","Hunters' Accommodation","Hunters' Kitchen","Hut","Kitchen","Lapa","Lean-to","Lodge","Loft","Log Cabin","Longdavel","Lounge","Luncheon Areas","Luxury Accommodation","Manager's Dwelling","Manor House","Maternity House","Other","Owner's Dwelling","Parlor","Shed","Shower","Staff Ablutions","Staff Accommodation","Staff Building","Staff Compound","Staff Dining Facility","Stoop","Tavern","Teachers' Dwellings","Toilet - Outdoor","Toilet Block","Toilets","Toilets - Staff","Veranda","Winemakers' Dwelling","Workers' Ablutions","Workers' Accommodation","Workers' Kitchen","Workers' School"],
            'Business': ["Ablution Facility","Administration Block","Administrative Building","Administrative Offices","Animal Sale Facility","Auction Facilities","Barrel Maturation Room","Bathroom","Bottling Facility","Building","Charcoal Factory","Cheese Factory","Cloak Room","Cloth House","Commercial Buildings","Conference Facility","Cooling Facility","Distribution Centre","Factory Building","Fish Market Buildings","Functions Centre","Furniture Factory","Grading Room","Industrial Warehouse","Inspection Room","Ironing Room","Kiosk","Laboratory","Laundry Facility","Lean-to","Liquor Store","Loading Area","Loading Bay","Loading Platform","Loading Shed","Locker Room","Lockup Shed","Mechanical Workshop","Office","Office Building","Office Complex","Other","Packaging Complex","Packaging Facility","Pallet Factory","Pallet Stacking Area","Pill Factory","Processing Facility","Reception Area","Refrigeration Facility","Sales Facility","Saw Mill","Security Office","Shed","Shop","Sorting Facility","Staff Building","Staff Compound","Storage Facility","Studio","Toilet - Outdoor","Toilet Block","Toilets","Toilets - Client","Toilets - Office","Toilets - Staff","Transport Depot","Warehouse","Wine Cellar","Wine Shop","Wine Tasting Room","Winery Building","Work Station","Workers' Ablutions","Workers' Accommodation","Workers' Kitchen","Workers' School","Workshop"],
            'Equipment & Utilities': ["Air Conditioners","Aircraft Hangar","Backup Generator","Boiler Room","Borehole","Borehole - Equipped","Borehole - Pump","Bulk Tank Room","Caravan Room","Carport","Carport - Double","Carton Shed","Chemical Shed","Compressor Room","Control Hut","Cooling Facility","Diesel Room","Electricity Room","Engine Room","Equipment Stores","Eskom Transformer","Filter Station","Fuel Depot","Fuel Store","Fuel Tank","Garage","Garage - Double","Garage - Triple","Generator Room","Hangar","Helipad","Hydro Tanks","Hydrophonic Pond","Laying Hen House Equipment","Machinery Room","Mechanical Workshop","Oil Store","Other","Oven","Petrol Storage","Poison Store","Power Room","Pump","Pump House Equipment","Pumphouse","Refuelling Canopy","Scale","Shed","Solar Power Room","Tank Stand","Tanks","Tool Shed","Tractor Shed","Transformer Room","Transport Depot","Truck Shelter","Truck Wash","Turbine Room","Twin Engine Generator Unit","Tyre Shed","Utility Building","Utility Room","Water Purification Plant","Water Reticulation Works","Water Storage Tanks","Water Tower"],
            'Infrastructure': ["Ablution Facility","Access Roads","All Infrastructure","Attic","Balcony","Barn","Bathroom","Bedroom","Bell Arch","Bin Compartments","Boiler Room","Borehole","Borehole - Equipped","Borehole - Pump","Building","Bulk Tank Room","Bunker","Canopy","Canteen","Cellar","Classroom","Cloak Room","Concrete Slab","Concrete Surfaces","Courtyard","Covered Area","Dam","Dam - Filter","Debris Filter Pond","Deck","Driveway","Electric Fencing","Electric Gate","Electricity Room","Entrance Building","Entrance Gate","Fencing","Fencing (Game)","Fencing (Perimeter)","Fencing (Security)","Flooring","Foyer","Gate","Gate - Sliding","Gate House","Gazebo","Guardhouse","Hall","House","Hut","Hydro Tanks","Hydrophonic Pond","Infrastructure","Irrigation Dam","Irrigation Pump","Irrigation Reservoir","Irrigation System","Kiosk","Kitchen","Koi Pond","Kraal","Laboratory","Landing Strip","Laundry Facility","Lean-to","Lockup Shed","Longdavel","Mezzanine","Other","Outbuilding","Outdoor Room","Outhouse","Parking Area","Parlor","Patio","Paving","Pens","Poles","Pool Facility","Pool House","Porch","Porte Cochere","Reservoir","Reservoir Pumphouse","Reservoir Tower","Road Stall","Rondavel","Roofing","Room","Ruin","Runway","Security Office","Shade Netting","Shade Port","Shed","Shooting Range","Shower","Silo","Slab","Splash Pool","Sprinklers","Stable","Stoop","Storage Facility","Studio","Surrounding Works","Tarmac","Tarred Area","Tarred Road Surfaces","Terrace","Toilet - Outdoor","Toilet Block","Toilets","Toilets - Client","Toilets - Office","Toilets - Staff","Trench","Tunnel","Tunnel Building","Vacant Areas","Veranda","Walkways","Walls","Walls (Boundary)","Walls (Retaining)","Walls (Security)","Warehouse","Water Feature","Water Storage Tanks","Water Tower","Wire Enclosures","Work Station"],
            'Recreational & Misc.': ["Anti-Poaching Training Facility","Archive Room","Arena","Art Gallery","Bar","Barrel Maturation Room","BBQ","BBQ Facility","Café","Canteen","Caravan Room","Chapel","Church","Church Facility","Classroom","Cloth House","Clubhouse","Coffee Shop","Community Centre","Compost Pasteurising Unit","Compost Preparing Unit","Dark Room","Entertainment Area","Entertainment Facility","Functions Centre","Funeral Building","Furniture Factory","Gallery","Game Room","Golf Clubhouse","Gymnasium","Helipad","Hydro Tanks","Hydrophonic Pond","Igloo","Ironing Room","Jacuzzi","Judging Booth","Kiosk","Koi Pond","Laundry Facility","Liquor Store","Locker Room","Lounge","Luncheon Areas","Museum","Nursery School","Nursing Home","Other","Parlor","Pill Factory","Play Area","Pool Facility","Pool House","Pottery Room","Pub","Reception Area","Recreation Facility","Rehab Facility","Restaurant","Retirement Centre","Salon","Sauna","Saw Mill","School","Spa Baths","Spa Complex","Splash Pool","Squash Court","Sulphur Room","Surgery","Swimming Pool - Indoor","Swimming Pool - Outdoor","Swimming Pool Ablution","Tavern","Tea Room","Tennis Court","Treatment Area","Trout Dam","Venue Hall","Vitamin Room","Wedding Venue","Weigh Bridge","Weigh Bridge Control Room","Wellness Centre","Windmill"
            ]
        },
        'livestock': {
            Cattle: {
                Breeding: ['Phase A Bulls', 'Phase B Bulls', 'Phase C Bulls', 'Phase D Bulls', 'Heifers', 'Bull Calves', 'Heifer Calves', 'Tollies 1-2', 'Heifers 1-2', 'Culls'],
                Dairy: ['Bulls', 'Dry Cows', 'Lactating Cows', 'Heifers', 'Calves', 'Culls'],
                Slaughter: ['Bulls', 'Cows', 'Heifers', 'Weaners', 'Calves', 'Culls']
            },
            Sheep: {
                Breeding: ['Rams', 'Young Rams', 'Ewes', 'Young Ewes', 'Lambs', 'Wethers', 'Culls'],
                Slaughter: ['Rams', 'Ewes', 'Lambs', 'Wethers', 'Culls']
            },
            Pigs: {
                Slaughter: ['Boars', 'Breeding Sows', 'Weaned pigs', 'Piglets', 'Porkers', 'Baconers', 'Culls']
            },
            Chickens: {
                Broilers: ['Day Old Chicks', 'Broilers'],
                Layers: ['Hens', 'Point of Laying Hens', 'Culls']
            },
            Ostriches: {
                Slaughter: ['Breeding Stock', 'Slaughter Birds > 3 months', 'Slaughter Birds < 3 months', 'Chicks']
            },
            Goats: {
                Slaughter: ['Rams', 'Breeding Ewes', 'Young Ewes', 'Kids']
            }
        },
        'vme': {
            Vehicles: ['Bakkie', 'Car', 'Truck', 'Tractor'],
            Machinery: ['Mower', 'Mower Conditioner', 'Hay Rake', 'Hay Baler', 'Harvester'],
            Equipment: ['Plough', 'Harrow', 'Ridgers', 'Rotovator', 'Cultivator', 'Planter', 'Combine', 'Spreader', 'Sprayer', 'Mixer']
        }
    };

    var _conditionTypes = ['Good', 'Good to fair', 'Fair', 'Fair to poor', 'Poor'];

    var _assetPurposes = {
        livestock: {
            Cattle: ['Breeding', 'Dairy', 'Slaughter'],
            Sheep: ['Breeding', 'Slaughter'],
            Pigs: ['Slaughter'],
            Chickens: ['Broilers', 'Layers'],
            Ostriches:['Slaughter'],
            Goats: ['Slaughter']
        }
    };

    var _seasonTypes = ['Cape', 'Summer', 'Fruit', 'Winter'];

    var _assetLandUse = {
        'crop': ['Cropland'],
        'farmland': landUseHelper.landUseTypes(),
        'improvement': [],
        'irrigated cropland': ['Cropland'],
        'livestock': ['Grazing', 'Planted Pastures', 'Conservation'],
        'pasture': ['Grazing', 'Planted Pastures', 'Conservation'],
        'permanent crop': ['Horticulture (Perennial)'],
        'plantation': ['Plantation'],
        'vme': [],
        'water right': landUseHelper.landUseTypes()
    };

    return {
        assetTypes: function() {
            return _assetTypes;
        },
        seasonTypes: function () {
            return _seasonTypes;
        },
        listServiceMap: function () {
            return _listServiceMap;
        },
        getAssetTitle: function (assetType) {
            return _assetTypes[assetType];
        },
        getAssetSubtypes: function(type) {
            return _assetSubtypes[type] || [];
        },
        getAssetCategories: function(type, subtype) {
            return (_assetCategories[type] ? (_assetCategories[type][subtype] || []) : []);
        },
        getAssetPurposes: function(type, subtype) {
            return (_assetPurposes[type] ? (_assetPurposes[type][subtype] || []) : []);
        },
        conditionTypes: function () {
            return _conditionTypes;
        },

        isFieldApplicable: function (type, field) {
            var fieldHasLandUse = (_assetLandUse[type].indexOf(field.landUse) !== -1);

            if (type == 'irrigated cropland') {
                return (fieldHasLandUse && field.irrigated);
            }

            return fieldHasLandUse;
        },

        cleanAssetData: function (asset) {
            if (asset.type == 'vme') {
                asset.data.quantity = (asset.data.identificationNo && asset.data.identificationNo.length > 0 ? 1 : asset.data.quantity);
                asset.data.identificationNo = (asset.data.quantity != 1 ? '' : asset.data.identificationNo);
            }

            return asset;
        },
        calculateValuation: function (asset, valuation) {
            if (asset.type == 'vme' && isNaN(asset.data.quantity) == false) {
                valuation.assetValue = asset.data.quantity * (valuation.unitValue || 0);
            } else if (asset.type == 'livestock' && isNaN(valuation.totalStock) == false) {
                valuation.assetValue = valuation.totalStock * (valuation.unitValue || 0);
            } else if (asset.type == 'crop' && isNaN(valuation.expectedYield) == false) {
                valuation.assetValue = valuation.expectedYield * (valuation.unitValue || 0);
            } else if (asset.type != 'improvement' && isNaN(asset.data.size) == false) {
                valuation.assetValue = asset.data.size * (valuation.unitValue || 0);
            }

            return valuation;
        }
    }
}]);

sdkHelperAssetApp.factory('assetValuationHelper', function () {
    var _listServiceMap = function(item) {
        if (item.data && item.data.valuations) {
            var mappedItems = [];

            angular.forEach(item.data.valuations, function (valuation) {
                var map = {
                    title: valuation.organization.name,
                    date: valuation.date
                };

                mappedItems.push(map);
            });

            return mappedItems;
        }
    };

    return {
        listServiceMap: function () {
            return _listServiceMap;
        },
        calculateValuation: function (asset, valuation) {
            if (asset.type == 'vme' && isNaN(asset.data.quantity) == false) {
                valuation.assetValue = asset.data.quantity * (valuation.unitValue || 0);
            } else if (asset.type == 'livestock' && isNaN(valuation.totalStock) == false) {
                valuation.assetValue = valuation.totalStock * (valuation.unitValue || 0);
            } else if (asset.type == 'crop' && isNaN(valuation.expectedYield) == false) {
                valuation.assetValue = valuation.expectedYield * (valuation.unitValue || 0);
            } else if (asset.type != 'improvement' && isNaN(asset.data.size) == false) {
                valuation.assetValue = asset.data.size * (valuation.unitValue || 0);
            }

            return valuation;
        }
    }
});
var sdkHelperDocumentApp = angular.module('ag.sdk.helper.document', []);

sdkHelperDocumentApp.provider('documentHelper', function () {
    var _docTypes = [];
    var _documentMap = {};

    var _pluralMap = function (item, count) {
        return (count != 1 ? (item.lastIndexOf('y') == item.length - 1 ? item.substr(0, item.length - 1) + 'ies' : item + 's') : item);
    };

    this.registerDocuments = function (docs) {
        if ((docs instanceof Array) === false) docs = [docs];

        angular.forEach(docs, function (doc) {
            if (_docTypes.indexOf(doc.docType) === -1) {
                _docTypes.push(doc.docType);
            }

            // Allow override of document
            doc.deletable = (doc.deletable === true);
            doc.state = doc.state || 'document.' + doc.docType.replace(' ', '-');
            _documentMap[doc.docType] = doc;
        });
    };

    this.getDocument = function (docType) {
        return _documentMap[docType];
    };

    this.$get = ['$injector', function ($injector) {
        var _listServiceMap = function (item) {
            if (_documentMap[item.docType]) {
                var docMap = _documentMap[item.docType];
                var map = {
                    title: (item.author ? item.author : ''),
                    subtitle: '',
                    docType: item.docType,
                    group: docMap.title,
                    updatedAt: item.updatedAt
                };

                if (item.organization && item.organization.name) {
                    map.subtitle = (item.author ? 'From ' + item.author + ': ' : '');
                    map.title = item.organization.name;
                }

                if (item.data && docMap && docMap.listServiceMap) {
                    if (docMap.listServiceMap instanceof Array) {
                        docMap.listServiceMap = $injector.invoke(docMap.listServiceMap);
                    }

                    docMap.listServiceMap(map, item);
                }

                return map;
            }
        };

        return {
            listServiceMap: function () {
                return _listServiceMap;
            },
            pluralMap: function (item, count) {
                return _pluralMap(item, count);
            },

            documentTypes: function () {
                return _docTypes;
            },
            documentTitles: function () {
                return _.pluck(_documentMap, 'title');
            },

            getDocumentTitle: function (docType) {
                return (_documentMap[docType] ? _documentMap[docType].title : undefined);
            },
            getDocumentState: function (docType) {
                return (_documentMap[docType] ? _documentMap[docType].state : undefined);
            },
            getDocumentMap: function (docType) {
                return _documentMap[docType];
            }
        }
    }]
});

var sdkHelperEnterpriseBudgetApp = angular.module('ag.sdk.helper.enterprise-budget', []);

sdkHelperEnterpriseBudgetApp.factory('enterpriseBudgetHelper', [function() {
    var _listServiceMap = function (item) {
        return {
            title: item.name,
            subtitle: item.commodityType + (item.region && item.region.properties ? ' in ' + item.region.properties.name : '')
        }
    };

    var _modelTypes = {
        crop: 'Crop',
        livestock: 'Livestock'
    };

    return {
        listServiceMap: function () {
            return _listServiceMap;
        },
        getModelType: function (type) {
            return _modelTypes[type] || '';
        },

        calculateTotals: function (budget) {
            var income = budget.data.income = budget.data.income || {};
            var expenses = budget.data.expenses = budget.data.expenses || [];
            var total = budget.data.total = budget.data.total || {};

            if (isNaN(income.yield) == false && isNaN(income.price) == false) {
                total.income = income.yield * income.price;
            }

            total.expenses = 0;

            angular.forEach(expenses, function (type) {
                angular.forEach(type, function (subtype) {
                    total.expenses += (subtype.cost || 0);
                });
            });

            total.profit = total.income - total.expenses;

            return budget;
        }
    }
}]);

var sdkHelperFarmerApp = angular.module('ag.sdk.helper.farmer', ['ag.sdk.interface.map']);

sdkHelperFarmerApp.factory('farmerHelper', ['geoJSONHelper', function(geoJSONHelper) {
    var _listServiceMap = function (item) {
        return {
            title: item.name,
            subtitle: item.operationType,
            profileImage : item.profilePhotoSrc,
            searchingIndex: searchingIndex(item)
        };
        
        function searchingIndex(item) {
            var index = [];

            angular.forEach(item.legalEntities, function(entity) {
                index.push(entity.name);
                
                if(entity.registrationNumber) {
                    index.push(entity.registrationNumber);
                }
            });

            return index;
        }
    };

    var _businessEntityTypes = ['Commercial', 'Cooperative', 'Corporate', 'Smallholder'];

    return {
        listServiceMap: function() {
            return _listServiceMap;
        },
        businessEntityTypes: function() {
            return _businessEntityTypes;
        },
        getFarmerLocation: function(farmer) {
            if (farmer) {
                if (farmer.data && farmer.data.loc) {
                    return farmer.data.loc.coordinates;
                } else if (farmer.legalEntities) {
                    var geojson = geoJSONHelper();

                    angular.forEach(farmer.legalEntities, function (entity) {
                        if (entity.assets) {
                            angular.forEach(entity.assets, function (asset) {
                                geojson.addGeometry(asset.loc);
                            });
                        }
                    });

                    return geojson.getCenter();
                }
            }

            return null;
        }
    }
}]);

sdkHelperFarmerApp.factory('legalEntityHelper', [function() {
    var _listServiceMap = function(item) {
        return {
            title: item.name,
            subtitle: item.type
        };
    };

    var _legalEntityTypes = ['Individual', 'Sole Proprietary', 'Joint account', 'Partnership', 'Close Corporation', 'Private Company', 'Public Company', 'Trust', 'Non-Profitable companies', 'Cooperatives', 'In- Cooperatives', 'Other Financial Intermediaries'];

    var _enterpriseTypes = {
        'Field Crops': ['Barley', 'Cabbage', 'Canola', 'Chicory', 'Citrus (Hardpeel)', 'Cotton', 'Cow Peas', 'Dry Bean', 'Dry Grapes', 'Dry Peas', 'Garlic', 'Grain Sorghum', 'Green Bean', 'Ground Nut', 'Hybrid Maize Seed', 'Lentils', 'Lucerne', 'Maize (Fodder)', 'Maize (Green)', 'Maize (Seed)', 'Maize (White)', 'Maize (Yellow)', 'Oats', 'Onion', 'Onion (Seed)', 'Popcorn', 'Potato', 'Pumpkin', 'Rye', 'Soya Bean', 'Sugar Cane', 'Sunflower', 'Sweetcorn', 'Tobacco', 'Tobacco (Oven dry)', 'Tomatoes', 'Watermelon', 'Wheat'],
        'Horticulture': ['Almonds', 'Apples', 'Apricots', 'Avo', 'Avocado', 'Bananas', 'Cherries', 'Chilli', 'Citrus (Hardpeel Class 1)', 'Citrus (Softpeel)', 'Coffee', 'Figs', 'Grapes (Table)', 'Grapes (Wine)', 'Guavas', 'Hops', 'Kiwi Fruit', 'Lemons', 'Macadamia Nut', 'Mango', 'Mangos', 'Melons', 'Nectarines', 'Olives', 'Oranges', 'Papaya', 'Peaches', 'Peanut', 'Pears', 'Pecan Nuts', 'Persimmons', 'Pineapples', 'Pistachio Nuts', 'Plums', 'Pomegranates', 'Prunes', 'Quinces', 'Rooibos', 'Strawberries', 'Triticale', 'Watermelons'],
        'Livestock': ['Cattle (Extensive)', 'Cattle (Feedlot)', 'Cattle (Stud)', 'Chicken (Broilers)', 'Chicken (Layers)', 'Dairy', 'Game', 'Goats', 'Horses', 'Ostrich', 'Pigs', 'Sheep (Extensive)', 'Sheep (Feedlot)', 'Sheep (Stud)']
    };

    /**
     * @name EnterpriseEditor
     * @param enterprises
     * @constructor
     */
    function EnterpriseEditor (enterprises) {
        this.enterprises = _.map(enterprises || [], function (item) {
            return (item.name ? item.name : item);
        });

        this.selection = {
            category: undefined,
            item: undefined
        }
    }

    EnterpriseEditor.prototype.addEnterprise = function (enterprise) {
        enterprise = enterprise || this.selection.item;

        if (this.enterprises.indexOf(enterprise) == -1) {
            this.enterprises.push(enterprise);
            this.selection.item = undefined;
        }
    };

    EnterpriseEditor.prototype.removeEnterprise = function (item) {
        if (typeof item == 'string') {
            item = this.enterprises.indexOf(item);
        }

        if (item !== -1) {
            this.enterprises.splice(item, 1);
        }
    };

    return {
        listServiceMap: function() {
            return _listServiceMap;
        },
        legalEntityTypes: function() {
            return _legalEntityTypes;
        },
        enterpriseTypes: function () {
            return _enterpriseTypes;
        },

        enterpriseEditor: function (enterprises) {
            return new EnterpriseEditor(enterprises);
        }
    }
}]);

sdkHelperFarmerApp.factory('landUseHelper', function() {
    var _croppingPotentialTypes = ['High', 'Medium', 'Low'];
    var _effectiveDepthTypes = ['0 - 30cm', '30 - 60cm', '60 - 90cm', '90 - 120cm', '120cm +'];
    var _irrigationTypes = ['Centre-Pivot', 'Flood', 'Micro', 'Sub-drainage', 'Sprinkler', 'Drip'];
    var _landUseTypes = ['Cropland', 'Grazing', 'Horticulture (Intensive)', 'Horticulture (Perennial)', 'Horticulture (Seasonal)', 'Housing', 'Plantation', 'Planted Pastures', 'Structures (Handling)', 'Structures (Processing)', 'Structures (Storage)', 'Utilities', 'Wasteland', 'Conservation'];
    var _soilTextureTypes = ['Sand', 'Loamy Sand', 'Clay Sand', 'Sandy Loam', 'Fine Sandy Loam', 'Loam', 'Silty Loam', 'Sandy Clay Loam', 'Clay Loam', 'Clay', 'Gravel', 'Other', 'Fine Sandy Clay', 'Medium Sandy Clay Loam', 'Fine Sandy Clay Loam', 'Loamy Medium Sand', 'Medium Sandy Loam', 'Coarse Sandy Clay Loam', 'Coarse Sand', 'Loamy Fine Sand', 'Loamy Coarse Sand', 'Fine Sand', 'Silty Clay', 'Coarse Sandy Loam', 'Medium Sand', 'Medium Sandy Clay', 'Coarse Sandy Clay', 'Sandy Clay'];
    var _terrainTypes = ['Plains', 'Mountains'];
    var _waterSourceTypes = ['Irrigation Scheme', 'River', 'Dam', 'Borehole'];

    var _landUseCropTypes = {
        'Cropland': ['Barley', 'Bean', 'Bean (Broad)', 'Bean (Dry)', 'Bean (Sugar)', 'Bean (Green)', 'Bean (Kidney)', 'Canola', 'Cassava', 'Cotton', 'Cowpea', 'Grain Sorghum', 'Groundnut', 'Maize', 'Maize (White)', 'Maize (Yellow)', 'Oats', 'Pearl Millet', 'Potato', 'Rape', 'Rice', 'Rye', 'Soybean', 'Sunflower', 'Sweet Corn', 'Sweet Potato', 'Tobacco', 'Triticale', 'Wheat', 'Wheat (Durum)'],
        'Grazing': ['Bahia-Notatum', 'Bottle Brush', 'Buffalo', 'Buffalo (Blue)', 'Buffalo (White)', 'Bush', 'Cocksfoot', 'Common Setaria', 'Dallis', 'Phalaris', 'Rescue', 'Rhodes', 'Smuts Finger', 'Tall Fescue', 'Teff', 'Veld', 'Weeping Lovegrass'],
        'Horticulture (Perennial)': ['Almond', 'Aloe', 'Apple', 'Apricot', 'Avocado', 'Banana', 'Cherry', 'Coconut', 'Coffee', 'Grape', 'Grape (Bush Vine)', 'Grape (Red)', 'Grape (Table)', 'Grape (White)', 'Grapefruit', 'Guava', 'Hops', 'Kiwi Fruit', 'Lemon', 'Litchi', 'Macadamia Nut', 'Mandarin', 'Mango', 'Nectarine', 'Olive', 'Orange', 'Papaya', 'Peach', 'Pear', 'Pecan Nut', 'Persimmon', 'Pineapple', 'Pistachio Nut', 'Plum', 'Rooibos', 'Sisal', 'Sugarcane', 'Tea', 'Walnuts'],
        'Horticulture (Seasonal)': ['Asparagus', 'Beet', 'Beetroot', 'Blackberry', 'Borecole', 'Brinjal', 'Broccoli', 'Brussel Sprout', 'Cabbage', 'Cabbage (Chinese)', 'Cabbage (Savoy)', 'Cactus Pear', 'Carrot', 'Cauliflower', 'Celery', 'Chicory', 'Chilly', 'Cucumber', 'Cucurbit', 'Dry Pea', 'Garlic', 'Ginger', 'Granadilla', 'Kale', 'Kohlrabi', 'Leek', 'Lespedeza', 'Lettuce', 'Makataan', 'Mustard', 'Mustard (White)', 'Onion', 'Paprika', 'Parsley', 'Parsnip', 'Pea', 'Pepper', 'Pumpkin', 'Quince', 'Radish', 'Squash', 'Strawberry', 'Swede', 'Sweet Melon', 'Swiss Chard', 'Tomato', 'Turnip', 'Vetch (Common)', 'Vetch (Hairy)', 'Watermelon', 'Youngberry'],
        'Plantation': ['Bluegum', 'Pine', 'Wattle'],
        'Planted Pastures': ['Birdsfoot Trefoil', 'Carribean Stylo', 'Clover', 'Clover (Arrow Leaf)', 'Clover (Crimson)', 'Clover (Persian)', 'Clover (Red)', 'Clover (Rose)', 'Clover (Strawberry)', 'Clover (Subterranean)', 'Clover (White)', 'Kikuyu', 'Lucerne', 'Lupin', 'Lupin (Narrow Leaf)', 'Lupin (White)', 'Lupin (Yellow)', 'Medic', 'Medic (Barrel)', 'Medic (Burr)', 'Medic (Gama)', 'Medic (Snail)', 'Medic (Strand)', 'Ryegrass', 'Ryegrass (Hybrid)', 'Ryegrass (Italian)', 'Ryegrass (Westerwolds)', 'Serradella', 'Serradella (Yellow)', 'Silver Leaf Desmodium'],
    };

    return {
        croppingPotentialTypes: function () {
            return _croppingPotentialTypes;
        },
        effectiveDepthTypes: function () {
            return _effectiveDepthTypes;
        },
        irrigationTypes: function () {
            return _irrigationTypes;
        },
        landUseTypes: function () {
            return _landUseTypes;
        },
        soilTextureTypes: function () {
            return _soilTextureTypes;
        },
        terrainTypes: function () {
            return _terrainTypes;
        },
        waterSourceTypes: function () {
            return _waterSourceTypes;
        },

        getCropsForLandUse: function (landUse) {
            return _landUseCropTypes[landUse] || [];
        },

        isCroppingPotentialRequired: function (landUse) {
            return (landUse == 'Cropland');
        },
        isTerrainRequired: function (landUse) {
            return (landUse == 'Grazing');
        }

    }
});

sdkHelperFarmerApp.factory('farmHelper', [function() {
    var _listServiceMap = function(item) {
        return {
            title: item.name
        };
    };

    return {
        listServiceMap: function() {
            return _listServiceMap;
        }
    }
}]);

var sdkHelperFavouritesApp = angular.module('ag.sdk.helper.favourites', ['ag.sdk.helper.document', 'ag.sdk.helper.task']);

sdkHelperFavouritesApp.factory('activityHelper', ['documentHelper', function(documentHelper) {
    var _listServiceMap = function(item) {
        var map = {
            date: item.date
        };

        if (typeof item.actor === 'object') {
            // User is the actor
            if (item.actor.displayName) {
                map.title = item.actor.displayName;
                map.subtitle = item.actor.displayName;
            }
            else {
                map.title = item.actor.firstName + ' ' + item.actor.lastName;
                map.subtitle = item.actor.firstName + ' ' + item.actor.lastName;
            }

            if (item.actor.position) {
                map.title += ' (' + item.actor.position + ')';
            }

            map.profilePhotoSrc = item.actor.profilePhotoSrc;
        } else if (item.organization) {
            // Organization is the actor
            map.title = item.organization.name;
            map.subtitle = item.organization.name;
        } else {
            // Unknown actor
            map.title = 'Someone';
            map.subtitle = 'Someone';
        }

        map.subtitle += ' ' + _getActionVerb(item.action) + ' ';

        map.referenceId = item.referenceType == 'farmer' ? item.organization.id : item[item.referenceType + 'Id'];

        if (item.referenceType == 'farmer') {
            if (item.action == 'invite') {
                map.subtitle += item.organization.name + ' to create an Agrista account';
            } else if (item.action == 'register') {
                map.subtitle += 'your request to join Agrista';
            } else if (item.action == 'create') {
                map.subtitle += 'a customer portfolio for ' + item.organization.name;
            } else if (item.action == 'decline') {
                map.subtitle += 'a task for ' + item.organization.name;
            } else {
                map.subtitle += 'the portfolio of ' + item.organization.name;
            }

            map.referenceState = 'customer.details';
        } else {
            if (item[item.referenceType] !== undefined) {
                if (item.referenceType == 'document') {
                    map.subtitle += _getReferenceArticle(item[item.referenceType].docType) + ' ' + documentHelper.getDocumentTitle(item[item.referenceType].docType) + ' ' + item.referenceType;
                    map.referenceState = documentHelper.getDocumentState(item[item.referenceType].docType);
                } else if (item.referenceType == 'task') {
                    map.subtitle += 'the ' + taskHelper.getTaskTitle(item[item.referenceType].todo) + ' ' + item.referenceType;
                    map.referenceState = documentHelper.getTaskState(item[item.referenceType].todo);
                } else {
                    map.subtitle += _getReferenceArticle(item.referenceType) + ' ' + item.referenceType;
                }
            } else {
                map.subtitle += _getReferenceArticle(item.referenceType) + ' ' + item.referenceType;
            }

            if (item.actor && item.organization && item.organization.name) {
                map.subtitle += ' ' + _getActionPreposition(item.action) + ' ' + item.organization.name;
            }
        }

        return map;
    };

    var _getActionPreposition = function (action) {
        return _actionPrepositionExceptionMap[action] || 'for';
    };

    var _getActionVerb = function (action) {
        return _actionVerbExceptionMap[action] || (action.lastIndexOf('e') == action.length - 1 ? action + 'd' : action + 'ed');
    };

    var _getReferenceArticle = function (reference) {
        var vowels = ['a', 'e', 'i', 'o', 'u'];

        return _referenceArticleExceptionMap[reference] || (vowels.indexOf(reference.substr(0, 1)) != -1 ? 'an' : 'a');
    };

    var _actionPrepositionExceptionMap = {
        'share': 'with',
        'sent': 'to'
    };

    var _actionVerbExceptionMap = {
        'register': 'accepted',
        'sent': 'sent'
    };

    var _referenceArticleExceptionMap = {
        'asset register': 'an'
    };

    return {
        listServiceMap: function() {
            return _listServiceMap;
        },
        getActionVerb: _getActionVerb,
        getReferenceArticle: _getReferenceArticle
    }
}]);

sdkHelperFavouritesApp.factory('notificationHelper', ['taskHelper', 'documentHelper', function (taskHelper, documentHelper) {
    var _listServiceMap = function(item) {
        var map = {
            title: item.sender,
            subtitle: _notificationMap[item.notificationType].title,
            state: _notificationState(item.notificationType, item.dataType)
        };

        if (item.dataType == 'task') {
            map.subtitle += ' ' + taskHelper.getTaskTitle(item.sharedData.todo);
        } else if (item.dataType == 'document') {
            map.subtitle +=  ' ' + documentHelper.getDocumentTitle(item.sharedData.docType);
        }

        map.subtitle += ' ' + item.dataType + (item.organization == null ? '' : ' for ' + item.organization.name);

        return map;
    };

    var _notificationState = function (notificationType, dataType) {
        var state = (_notificationMap[notificationType] ? _notificationMap[notificationType].state : 'view');

        return ('notification.' + state + '-' + dataType);
    };

    var _notificationMap = {
        'import': {
            title: 'Import',
            state: 'import'
        },
        'view': {
            title: 'View',
            state: 'view'
        },
        'reject': {
            title: 'Reassign',
            state: 'manage'
        },
        'review': {
            title: 'Review',
            state: 'view'
        }
    };

    return {
        listServiceMap: function() {
            return _listServiceMap;
        },

        getNotificationState: function (notificationType, dataType) {
            return _notificationState(notificationType, dataType);
        },
        getNotificationTitle: function (notificationType) {
            return (_notificationMap[notificationType] ? _notificationMap[notificationType].title : '')
        }
    }
}]);

var sdkHelperMerchantApp = angular.module('ag.sdk.helper.merchant', []);

sdkHelperMerchantApp.factory('merchantHelper', [function() {
    var _listServiceMap = function (item) {
        return {
            title: item.name,
            subtitle: (item.subscriptionPlan ? getSubscriptionPlan(item.subscriptionPlan) + ' ' : '') + (item.partnerType ? getPartnerType(item.partnerType) + ' partner' : ''),
            status: (item.registered ? {text: 'registered', label: 'label-success'} : false)
        }
    };

    var _partnerTypes = {
        benefit: 'Benefit',
        standard: 'Standard'
    };

    var _subscriptionPlans = {
        small: 'Small',
        medium: 'Medium',
        large: 'Large',
        association: 'Association'
    };

    var getPartnerType = function (type) {
        return _partnerTypes[type] || '';
    };

    var getSubscriptionPlan = function (plan) {
        return _subscriptionPlans[plan] || '';
    };

    /**
     * @name ServiceEditor
     * @param availableServices
     * @param services
     * @constructor
     */
    function ServiceEditor (/**Array=*/availableServices, /**Array=*/services) {
        availableServices = availableServices || [];

        this.services = _.map(services || [], function (item) {
            return (item.name ? item.name : item);
        });

        this.selection = {
            list: availableServices,
            mode: (availableServices.length == 0 ? 'add' : 'select'),
            text: ''
        };
    }

    ServiceEditor.prototype.toggleMode = function() {
        if (this.selection.list.length > 0) {
            // Allow toggle
            this.selection.mode = (this.selection.mode == 'select' ? 'add' : 'select');
            this.selection.text = '';
        }
    };

    ServiceEditor.prototype.addService = function (service) {
        service = service || this.selection.text;

        if (this.services.indexOf(service) == -1) {
            this.services.push(service);
            this.selection.text = '';
        }
    };

    ServiceEditor.prototype.removeService = function (indexOrService) {
        if (typeof indexOrService == 'string') {
            indexOrService = this.services.indexOf(indexOrService);
        }

        if (indexOrService !== -1) {
            this.services.splice(indexOrService, 1);
        }
    };

    return {
        listServiceMap: function() {
            return _listServiceMap;
        },

        partnerTypes: function() {
            return _partnerTypes;
        },
        getPartnerType: getPartnerType,
        subscriptionPlans: function() {
            return _subscriptionPlans;
        },
        getSubscriptionPlan: getSubscriptionPlan,

        serviceEditor: function (/**Array=*/availableServices, /**Array=*/services) {
            return new ServiceEditor(availableServices, services);
        }
    }
}]);

var sdkHelperTaskApp = angular.module('ag.sdk.helper.task', ['ag.sdk.authorization', 'ag.sdk.utilities', 'ag.sdk.interface.list']);

sdkHelperTaskApp.provider('taskHelper', function() {
    var _validTaskStatuses = ['assigned', 'in progress', 'in review'];

    var _listServiceMap = function (item) {
        var title = item.documentKey;
        var mappedItems = _.filter(item.subtasks, function (task) {
            return (task.type && _validTaskStatuses.indexOf(task.status) !== -1 && task.type == 'child');
        }).map(function (task) {
                return {
                    id: task.id,
                    title: item.organization.name,
                    subtitle: _getTaskTitle(task.todo),
                    todo: task.todo,
                    groupby: title,
                    status: {
                        text: task.status || ' ',
                        label: _getStatusLabelClass(task.status)
                    }
                }
            });

        return (mappedItems.length ? mappedItems : undefined);
    };

    var _parentListServiceMap = function (item) {
        return {
            id: item.documentId,
            title: item.organization.name,
            subtitle: item.documentKey,
            status: {
                text: item.status || ' ',
                label: _getStatusLabelClass(item.status)
            }
        };
    };

    var _taskTodoMap = {};

    var _getTaskState = function (taskType) {
        return (_taskTodoMap[taskType] ? _taskTodoMap[taskType].state : undefined);
    };

    var _getTaskTitle = function (taskType) {
        return (_taskTodoMap[taskType] ? _taskTodoMap[taskType].title : undefined);
    };

    var _getStatusTitle = function (taskStatus) {
        return _taskStatusTitles[taskStatus] || taskStatus || ' ';
    };

    var _getActionTitle = function (taskAction) {
        return _taskActionTitles[taskAction] || taskAction || ' ';
    };

    var _getStatusLabelClass = function (status) {
        switch (status) {
            case 'in progress':
            case 'in review':
                return 'label-warning';
            case 'done':
                return 'label-success';
            default:
                return 'label-default';
        }
    };

    var _taskStatusTitles = {
        'backlog': 'Backlog',
        'assigned': 'Assigned',
        'in progress': 'In Progress',
        'in review': 'In Review',
        'done': 'Done',
        'archive': 'Archived'
    };

    var _taskActionTitles = {
        'accept': 'Accept',
        'decline': 'Decline',
        'assign': 'Assign',
        'start': 'Start',
        'complete': 'Complete',
        'approve': 'Approve',
        'reject': 'Reject',
        'release': 'Release'
    };

    /*
     * Provider functions
     */
    this.addTasks = function (tasks) {
        _taskTodoMap =  _.extend(_taskTodoMap, tasks);
    };

    this.$get = ['authorization', 'listService', 'dataMapService', function (authorization, listService, dataMapService) {
        return {
            listServiceMap: function() {
                return _listServiceMap;
            },
            parentListServiceMap: function() {
                return _parentListServiceMap;
            },

            getTaskState: _getTaskState,
            getTaskTitle: _getTaskTitle,
            getTaskStatusTitle: _getStatusTitle,
            getTaskActionTitle: _getActionTitle,
            getTaskLabel: _getStatusLabelClass,

            filterTasks: function (tasks) {
                return _.filter(tasks, function (task) {
                    return (_getTaskState(task.todo) !== undefined);
                });
            },
            updateListService: function (id, todo, tasks, organization) {
                var currentUser = authorization.currentUser();
                var task = _.findWhere(tasks, {id: id});

                listService.addItems(dataMapService({
                    id: task.parentTaskId,
                    documentKey: task.documentKey,
                    type: 'parent',
                    todo: todo,
                    organization: organization,
                    subtasks : _.filter(tasks, function (task) {
                        return (task && task.assignedTo == currentUser.username);
                    })
                }, _listServiceMap));

                if (task && _validTaskStatuses.indexOf(task.status) === -1) {
                    listService.removeItems(task.id);
                }
            }
        }
    }];
});

sdkHelperTaskApp.factory('taskWorkflowHelper', function() {
    var _taskActions = {
        accept: ['backlog', 'assigned', 'in progress', 'in review', 'complete'],
        decline: ['assigned'],
        start: ['assigned', 'in progress'],
        assign: ['backlog', 'assigned', 'in progress', 'in review'],
        complete: ['assigned', 'in progress'],
        approve: ['in review'],
        reject: ['assigned', 'in review'],
        release: ['done']
    };

    return {
        canChangeToState: function (task, action) {
            return (_taskActions[action] ? _taskActions[action].indexOf(task.status) !== -1 : true);
        }
    }
});

var sdkHelperTeamApp = angular.module('ag.sdk.helper.team', []);

sdkHelperTeamApp.factory('teamHelper', [function() {

    /**
     * @name TeamEditor
     * @param availableTeams
     * @param teams
     * @constructor
     */
    function TeamEditor (/**Array=*/availableTeams, /**Array=*/teams) {
        availableTeams = availableTeams || [];

        this.teams = _.map(teams || [], function (item) {
            return (item.name ? item.name : item);
        });

        this.teamsDetails = _.map(teams || [], function (item) {
            return item;
        });

        this.selection = {
            list: availableTeams,
            mode: (availableTeams.length == 0 ? 'add' : 'select'),
            text: ''
        };
    }

    TeamEditor.prototype.toggleMode = function() {
        if (this.selection.list.length > 0) {
            // Allow toggle
            this.selection.mode = (this.selection.mode == 'select' ? 'add' : 'select');
            this.selection.text = '';
        }
    };

    TeamEditor.prototype.addTeam = function (team) {
        team = team || this.selection.text;

        if (this.teams.indexOf(team) == -1 && !_.findWhere(this.teamsDetails, team)) {
            this.teams.push(team);
            this.teamsDetails.push(team);
            this.selection.text = '';
        }
    };

    TeamEditor.prototype.removeTeam = function (indexOrTeam) {
        if (typeof indexOrTeam == 'string') {
            indexOrTeam = this.teams.indexOf(indexOrTeam);
        }

        if (indexOrTeam !== -1) {
            this.teams.splice(indexOrTeam, 1);
            this.teamsDetails.splice(indexOrTeam, 1);
        }
    };

    return {
        teamEditor: function (/**Array=*/availableTeams, /**Array=*/teams) {
            return new TeamEditor(availableTeams, teams);
        }
    }
}]);

var sdkHelperUserApp = angular.module('ag.sdk.helper.user', []);

sdkHelperUserApp.factory('userHelper', [function() {
    var _listServiceMap = function (item) {
        return {
            title: item.firstName + ' ' + item.lastName,
            subtitle: item.position,
            teams: item.teams
        }
    };

    var _languageLit = ['English'];

    return {
        listServiceMap: function() {
            return _listServiceMap;
        },
        languageList: function() {
            return _languageLit;
        }
    }
}]);

var sdkInterfaceListApp = angular.module('ag.sdk.interface.list', ['ag.sdk.id']);

sdkInterfaceListApp.factory('listService', ['$rootScope', 'objectId', function ($rootScope, objectId) {
    var _button;
    var _groupby;
    var _infiniteScroll;
    var _search;

    var _items = [];
    var _activeItemId;

    var _defaultButtonClick = function() {
        $rootScope.$broadcast('list::button__clicked');
    };

    var _setButton = function (button) {
        if (_button !== button) {
            if (typeof button === 'object') {
                _button = button;
                _button.click = _button.click || _defaultButtonClick;
            } else {
                _button = undefined;
            }

            $rootScope.$broadcast('list::button__changed', _button);
        }
    };

    var _setGroupby = function (groupby) {
        if (_groupby !== groupby) {
            if (groupby !== undefined) {
                _groupby = groupby;
            } else {
                _groupby = undefined;
            }

            $rootScope.$broadcast('list::groupby__changed', _groupby);
        }
    };

    var _setScroll = function (infinite) {
        if (_infiniteScroll !== infinite) {
            if (infinite !== undefined) {
                _items = [];
                _infiniteScroll = infinite;
            } else {
                _infiniteScroll = undefined;
            }

            $rootScope.$broadcast('list::scroll__changed', _infiniteScroll);
        }
    };

    var _setSearch = function (search) {
        if (_search !== search) {
            if (search !== undefined) {
                _search = search;
            } else {
                _search = undefined;
            }

            $rootScope.$broadcast('list::search__changed', _search);
        }
    };

    var _setActiveItem = function(id) {
        _activeItemId = id;

        if (_items instanceof Array) {
            for (var i = 0; i < _items.length; i++) {
                _items[i].active = false;

                if (id !== undefined) {
                    if (_items[i].id == id) {
                        _items[i].active = true;
                    }
                    else if (_items[i].type == id) {
                        _items[i].active = true;
                    }
                }
            }
        } else {
            for (var itemKey in _items) {
                if (_items.hasOwnProperty(itemKey)) {
                    _items[itemKey].active = (itemKey == id);
                }
            }
        }
    };

    var _getActiveItem = function() {
        if (_items instanceof Array) {
            for (var i = 0; i < _items.length; i++) {
                if (_items[i].id == _activeItemId) {
                    return _items[i];
                }
            }
        } else {
            for (var itemKey in _items) {
                if (_items.hasOwnProperty(itemKey) && itemKey == _activeItemId) {
                    return _items[itemKey];
                }
            }
        }

        return null;
    };

    $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
        if(toParams.id) {
            _setActiveItem(toParams.id);
        } else {
            _setActiveItem(toParams.type);
        }
    });

    $rootScope.$on('list::item__selected', function(event, args) {
        if (typeof args == 'object') {
            if(args.id) {
                _setActiveItem(args.id);
            } else {
                _setActiveItem(args.type);
            }
        } else {
            _setActiveItem(args);
        }
    });

    return {
        /* CONFIG */
        config: function(config) {
            if (config.reset) {
                _button = undefined;
                _groupby = undefined;
                _infiniteScroll = undefined;
                _search = undefined;

                _items = [];
                _activeItemId = undefined;
            }

            _setButton(config.button);
            _setGroupby(config.groupby);
            _setScroll(config.infiniteScroll);
            _setSearch(config.search);
        },
        button: function(button) {
            if (arguments.length == 1) {
                _setButton(button);
            }
            return _button;
        },
        groupby: function(groupby) {
            if (arguments.length == 1) {
                _setGroupby(groupby);
            }

            return _groupby;
        },
        /**
         *
         * @param {Object} infinite
         * @param {function} infinite.request
         * @param {boolean} infinite.busy
         * @returns {*}
         */
        infiniteScroll: function(infinite) {
            if (arguments.length == 1) {
                _setScroll(infinite);
            }

            return _infiniteScroll;
        },
        search: function(search) {
            if (arguments.length == 1) {
                _setSearch(search);
            }

            return _search;
        },

        /* ITEMS */
        items: function(items) {
            if (items !== undefined) {
                _items = angular.copy(items);
                _activeItemId = undefined;

                $rootScope.$broadcast('list::items__changed', _items);
            }

            return _items;
        },
        length: function () {
            return _items.length;
        },
        addItems: function(items) {
            if (items !== undefined) {
                if ((items instanceof Array) === false) {
                    items = [items];
                }

                for (var i = 0; i < items.length; i++) {
                    var item = items[i];
                    item.id = item.id || objectId().toBase64String();

                    if (_items instanceof Array) {
                        var found = false;

                        for (var x = 0; x < _items.length; x++) {
                            if (item.id == _items[x].id) {
                                _items[x] = item;
                                _items[x].active = (_activeItemId !== undefined && _activeItemId == item.id);
                                found = true;

                                break;
                            }
                        }

                        if (found == false) {
                            _items.push(item);
                        }
                    } else {
                        _items[item.id] = item;
                        _items[item.id].active = (_activeItemId !== undefined && _activeItemId == item.id);
                    }
                }

                $rootScope.$broadcast('list::items__changed', _items);
            }
        },
        removeItems: function(ids) {
            if (ids !== undefined) {
                if ((ids instanceof Array) === false) {
                    ids = [ids];
                }

                for (var i = 0; i < ids.length; i++) {
                    var id = ids[i];

                    if (_items instanceof Array) {
                        for (var x = 0; x < _items.length; x++) {
                            if (id == _items[x].id) {
                                _items.splice(x, 1);

                                if (id == _activeItemId && _items.length) {
                                    var next = (_items[x] ? _items[x] : _items[x - 1]);
                                    $rootScope.$broadcast('list::item__selected', next);
                                }

                                break;
                            }
                        }
                    } else {
                        delete _items[id];
                    }
                }

                if (_items instanceof Array && _items.length == 0) {
                    $rootScope.$broadcast('list::items__empty');
                }

                $rootScope.$broadcast('list::items__changed', _items);
            }
        },
        selectFirstItem: function() {
            $rootScope.$broadcast('list::selectFirst__requested');
        },
        setActiveItem: function(id) {
            _setActiveItem(id);
        },
        getActiveItem: function() {
            return _getActiveItem();
        }
    }
}]);

var sdkInterfaceMapApp = angular.module('ag.sdk.interface.map', ['ag.sdk.utilities', 'ag.sdk.id', 'ag.sdk.config']);

/*
 * GeoJson
 */
sdkInterfaceMapApp.factory('geoJSONHelper', function () {
    function GeojsonHelper(json, properties) {
        if (!(this instanceof GeojsonHelper)) {
            return new GeojsonHelper(json, properties);
        }

        this.addGeometry(json, properties);
    }

    function _recursiveCoordinateFinder (bounds, coordinates) {
        if (coordinates) {
            if (angular.isArray(coordinates[0])) {
                angular.forEach(coordinates, function(coordinate) {
                    _recursiveCoordinateFinder(bounds, coordinate);
                });
            } else if (angular.isArray(coordinates)) {
                bounds.push([coordinates[1], coordinates[0]]);
            }
        }
    }

    GeojsonHelper.prototype = {
        getJson: function () {
            return this._json;
        },
        getType: function () {
            return this._json.type;
        },
        getCenter: function (bounds) {
            var bounds = bounds || this.getBounds();
            var center = [0, 0];

            angular.forEach(bounds, function(coordinate) {
                center[0] += coordinate[0];
                center[1] += coordinate[1];
            });

            return (bounds.length ? [(center[0] / bounds.length), (center[1] / bounds.length)] : null);
        },
        getBounds: function () {
            var bounds = [];

            if (this._json) {
                var features = this._json.features || [this._json];

                angular.forEach(features, function(feature) {
                    var geometry = feature.geometry || feature;

                    _recursiveCoordinateFinder(bounds, geometry.coordinates);
                });
            }

            return bounds;
        },
        addProperties: function (properties) {
            var _this = this;

            if (this._json && properties) {
                if (_this._json.type != 'FeatureCollection' && _this._json.type != 'Feature') {
                    _this._json = {
                        type: 'Feature',
                        geometry: _this._json,
                        properties: properties
                    };
                } else {
                    _this._json.properties = _this._json.properties || {};

                    angular.forEach(properties, function(property, key) {
                        _this._json.properties[key] = property;
                    });
                }
            }

            return _this;
        },
        addGeometry: function (geometry, properties) {
            if (geometry) {
                if (this._json === undefined) {
                    this._json = geometry;

                    this.addProperties(properties);
                } else {
                    if (this._json.type != 'FeatureCollection' && this._json.type != 'Feature') {
                        this._json = {
                            type: 'Feature',
                            geometry: this._json
                        };
                    }

                    if (this._json.type == 'Feature') {
                        this._json = {
                            type: 'FeatureCollection',
                            features: [this._json]
                        };
                    }

                    if (this._json.type == 'FeatureCollection') {
                        this._json.features.push({
                            type: 'Feature',
                            geometry: geometry,
                            properties: properties
                        });
                    }
                }
            }

            return this;
        }
    };

    return function (json, properties) {
        return new GeojsonHelper(json, properties);
    }
});

sdkInterfaceMapApp.provider('mapMarkerHelper', function () {
    var _createMarker = function (name, state, options) {
        return _.defaults(options || {}, {
            iconUrl: 'img/icons/' + name + '.' + state + '.png',
            shadowUrl: 'img/icons/' + name + '.shadow.png',
            iconSize: [48, 48],
            iconAnchor: [24, 48],
            shadowSize: [73, 48],
            shadowAnchor: [24, 48],
            labelAnchor: [12, -24]
        });
    };

    var _getMarker = this.getMarker = function (name, options) {
        var marker = {};

        if (typeof name === 'string') {
            marker = _createMarker(name, 'default', options)
        }

        return marker;
    };

    var _getMarkerStates = this.getMarkerStates = function (name, states, options) {
        var markers = {};

        if (typeof name === 'string') {
            angular.forEach(states, function(state) {
                markers[state] = _createMarker(name, state, options);
            });
        }

        return markers;
    };

    this.$get = function() {
        return {
            getMarker: _getMarker,
            getMarkerStates: _getMarkerStates
        }
    };
});

sdkInterfaceMapApp.provider('mapStyleHelper', ['mapMarkerHelperProvider', function (mapMarkerHelperProvider) {
    var _markerIcons = {};

    var _mapStyles = {
        foreground: {
            district: {
                style: {
                    weight: 2,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#0094D6",
                    fillOpacity: 0.5
                }
            },
            farmland: {
                style: {
                    weight: 2,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "blue",
                    fillOpacity: 0.3
                }
            },
            field: {
                icon: 'success',
                style: {
                    weight: 2,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#5b4723",
                    fillOpacity: 0.8
                }
            },
            crop: {
                style: {
                    weight: 2,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#aa64b0",
                    fillOpacity: 0.8
                }
            },
            improvement: {
                icon: 'success',
                style: {
                    weight: 4,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#ff6666",
                    fillOpacity: 0.8
                }
            },
            'irrigated cropland': {
                style: {
                    weight: 2,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#4573d5",
                    fillOpacity: 0.8
                }
            },
            pasture: {
                style: {
                    weight: 2,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#ffde40",
                    fillOpacity: 0.8
                }
            },
            'permanent crop': {
                style: {
                    weight: 2,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#487811",
                    fillOpacity: 0.8
                }
            },
            plantation: {
                style: {
                    weight: 2,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#00e64a",
                    fillOpacity: 0.8
                }
            },
            homestead: {
                icon: 'success'
            }
        },
        background: {
            district: {
                style: {
                    weight: 1,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#0094D6",
                    fillOpacity: 0.2
                }
            },
            farmland: {
                style: {
                    weight: 1,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "blue",
                    fillOpacity: 0.1
                }
            },
            field: {
                icon: 'default',
                style: {
                    weight: 1,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#5b4723",
                    fillOpacity: 0.4
                }
            },
            crop: {
                style: {
                    weight: 1,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#aa64b0",
                    fillOpacity: 0.4
                }
            },
            improvement: {
                icon: 'default',
                style: {
                    weight: 4,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#ff6666",
                    fillOpacity: 0.5
                }
            },
            'irrigated cropland': {
                style: {
                    weight: 1,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#4573d5",
                    fillOpacity: 0.4
                }
            },
            pasture: {
                style: {
                    weight: 1,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#ffde40",
                    fillOpacity: 0.4
                }
            },
            'permanent crop': {
                style: {
                    weight: 1,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#487811",
                    fillOpacity: 0.4
                }
            },
            plantation: {
                style: {
                    weight: 1,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#00e64a",
                    fillOpacity: 0.4
                }
            },
            homestead: {
                icon: 'default',
                label: {
                    message: 'Homestead'
                }
            }
        }
    };

    var _getStyle = this.getStyle = function (composition, layerName, label) {
        var mapStyle = (_mapStyles[composition] && _mapStyles[composition][layerName] ? angular.copy(_mapStyles[composition][layerName]) : {});

        if (mapStyle.icon !== undefined) {
            if (_markerIcons[layerName] === undefined) {
                _markerIcons[layerName] = mapMarkerHelperProvider.getMarkerStates(layerName, ['default', 'success', 'error']);
            }

            mapStyle.icon = _markerIcons[layerName][mapStyle.icon];
        }

        if (typeof label == 'object') {
            mapStyle.label = label;
        }

        return mapStyle;
    };

    var _setStyle = this.setStyle = function(composition, layerName, style) {
        _mapStyles[composition] = _mapStyles[composition] || {};
        _mapStyles[composition][layerName] = style;
    };

    this.$get = function() {
        return {
            getStyle: _getStyle,
            setStyle: _setStyle
        }
    };
}]);

/**
 * Maps
 */
sdkInterfaceMapApp.provider('mapboxService', function () {
    var _defaultConfig = {
        options: {
            attributionControl: true,
            layersControl: true,
            scrollWheelZoom: false,
            zoomControl: true
        },
        layerControl: {
            baseTile: 'agrista.map-65ftbmpi',
            baseLayers: {
                'Agrista': {
                    base: true,
                    type: 'mapbox'
                },
                'Google': {
                    type: 'google',
                    tiles: 'SATELLITE'
                }
            },
            overlays: {}
        },
        controls: {},
        events: {},
        view: {
            coordinates: [-28.691, 24.714],
            zoom: 6
        },
        bounds: {},
        layers: {},
        geojson: {}
    };

    var _instances = {};
    
    this.config = function (options) {
        _defaultConfig = _.defaults(options || {}, _defaultConfig);
    };

    this.$get = ['$rootScope', 'objectId', function ($rootScope, objectId) {
        /**
        * @name MapboxServiceInstance
        * @param id
        * @constructor
        */
        function MapboxServiceInstance(id, options) {
            var _this = this;

            _this._id = id;
            _this._ready = false;
            _this._options = options;
            _this._show = _this._options.show || false;

            _this._config = angular.copy(_defaultConfig);
            _this._requestQueue = [];

            $rootScope.$on('mapbox-' + _this._id + '::init', function () {
                _this.dequeueRequests();
                _this._ready = true;
            });

            $rootScope.$on('mapbox-' + _this._id + '::destroy', function () {
                _this._ready = false;

                if (_this._options.persist !== true) {
                    _this._config = angular.copy(_defaultConfig);
                }
            });
        }

        MapboxServiceInstance.prototype = {
            getId: function () {
                return this._id;
            },
            
            /*
             * Reset
             */
            reset: function () {
                this._config = angular.copy(_defaultConfig);

                $rootScope.$broadcast('mapbox-' + this._id + '::reset');
            },
            clearLayers: function () {
                this.removeOverlays();
                this.removeLayers();
                this.removeGeoJSON();
            },

            /*
             * Queuing requests
             */
            enqueueRequest: function (event, args) {
                if (this._ready) {
                    $rootScope.$broadcast(event, args);
                } else {
                    this._requestQueue.push({
                        event: event,
                        args: args
                    });
                }
            },
            dequeueRequests: function () {
                if (this._requestQueue.length) {
                    do {
                        var request = this._requestQueue.shift();

                        $rootScope.$broadcast(request.event, request.args);
                    } while(this._requestQueue.length);
                }
            },

            /*
             * Display
             */
            shouldShow: function() {
                return this._show;
            },
            hide: function() {
                this._show = false;
                this.enqueueRequest('mapbox-' + this._id + '::hide', {});
            },
            show: function() {
                this._show = true;
                this.enqueueRequest('mapbox-' + this._id + '::show', {});
            },
            invalidateSize: function() {
                this.enqueueRequest('mapbox-' + this._id + '::invalidate-size', {});
            },

            /*
             * Options
             */
            getOptions: function () {
                return this._config.options;
            },
            setOptions: function (options) {
                var _this = this;

                angular.forEach(options, function(value, key) {
                    _this._config.options[key] = value;
                });
            },

            /*
             * Map
             */
            getMapCenter: function(handler) {
                this.enqueueRequest('mapbox-' + this._id + '::get-center', handler);
            },
            getMapBounds: function(handler) {
                this.enqueueRequest('mapbox-' + this._id + '::get-bounds', handler);
            },
            getMapControl: function(control, handler) {
                this.enqueueRequest('mapbox-' + this._id + '::get-control', {
                    control: control,
                    handler: handler
                });
            },

            /*
             * Layer Control
             */
            getBaseTile: function () {
                return this._config.layerControl.baseTile;
            },
            setBaseTile: function (tile) {
                this._config.layerControl.baseTile = tile;
                this.enqueueRequest('mapbox-' + this._id + '::set-basetile', tile);
            },

            getBaseLayers: function () {
                return this._config.layerControl.baseLayers;
            },
            setBaseLayers: function (layers) {
                this._config.layerControl.baseLayers = layers;
                this.enqueueRequest('mapbox-' + this._id + '::set-baselayers', layers);
            },

            getOverlays: function () {
                return this._config.layerControl.overlays;
            },
            addOverlay: function (layerName, name) {
                if (layerName && this._config.layerControl.overlays[layerName] == undefined) {
                    this._config.layerControl.overlays[layerName] = name;

                    this.enqueueRequest('mapbox-' + this._id + '::add-overlay', {
                        layerName: layerName,
                        name: name || layerName
                    });
                }
            },
            removeOverlay: function (layerName) {
                if (layerName && this._config.layerControl.overlays[layerName]) {
                    $rootScope.$broadcast('mapbox-' + this._id + '::remove-overlay', layerName);

                    delete this._config.layerControl.overlays[layerName];
                }
            },
            removeOverlays: function () {
                var _this = this;
                
                angular.forEach(this._config.layerControl.overlays, function(overlay, name) {
                    $rootScope.$broadcast('mapbox-' + _this._id + '::remove-overlay', name);

                    delete _this._config.layerControl.overlays[name];
                });
            },

            /*
             * Controls
             */
            getControls: function () {
                return this._config.controls;
            },
            addControl: function (control, options) {
                this._config.controls[control] = {
                    name: control,
                    options: options
                };

                $rootScope.$broadcast('mapbox-' + this._id + '::add-control',  this._config.controls[control]);
            },
            removeControl: function (control) {
                delete this._config.controls[control];

                $rootScope.$broadcast('mapbox-' + this._id + '::remove-control', control);
            },

            /*
             * Event Handlers
             */
            getEventHandlers: function () {
                return this._config.events;
            },
            addEventHandler: function (events, handler) {
                events = (events instanceof Array ? events : [events]);

                var _this = this;

                angular.forEach(events, function(event) {
                    _this.removeEventHandler(event);
                    _this._config.events[event] = handler;

                    $rootScope.$broadcast('mapbox-' + _this._id + '::add-event-handler', {
                        event: event,
                        handler: handler
                    });
                });
            },
            removeEventHandler: function (events) {
                events = (events instanceof Array ? events : [events]);

                var _this = this;

                angular.forEach(events, function(event) {
                    if (_this._config.events[event] !== undefined) {
                        $rootScope.$broadcast('mapbox-' + _this._id + '::remove-event-handler', {
                            event: event,
                            handler: _this._config.events[handler]
                        });

                        delete _this._config.events[event];
                    }
                });
            },

            /*
             * View
             */
            getView: function () {
                return {
                    coordinates: this._config.view.coordinates,
                    zoom: this._config.view.zoom
                }
            },
            setView: function (coordinates, zoom) {
                if (coordinates instanceof Array) {
                    this._config.view.coordinates = coordinates;
                    this._config.view.zoom = zoom || this._config.view.zoom;

                    $rootScope.$broadcast('mapbox-' + this._id + '::set-view', this._config.view);
                }
            },
            getBounds: function () {
                return this._config.bounds;
            },
            setBounds: function (coordinates, options) {
                this._config.bounds = {
                    coordinates: coordinates,
                    options: options || {
                        reset: false
                    }
                }

                $rootScope.$broadcast('mapbox-' + this._id + '::set-bounds', this._config.bounds);
            },
            zoomTo: function (coordinates, zoom, options) {
                $rootScope.$broadcast('mapbox-' + this._id + '::zoom-to', {
                    coordinates: coordinates,
                    zoom: zoom,
                    options: options
                });
            },

            /*
             * Layers
             */
            createLayer: function (name, type, options, handler) {
                if (typeof options === 'function') {
                    handler = options;
                    options = {};
                }

                var _this = this;

                this.enqueueRequest('mapbox-' + this._id + '::create-layer', {
                    name: name,
                    type: type,
                    options: options,
                    handler: function (layer) {
                        _this._config.layers[name] = layer;

                        handler(layer);
                    }
                });
            },
            getLayer: function (name) {
                return this._config.layers[name];
            },
            getLayers: function () {
                return this._config.layers;
            },
            addLayer: function (name, layer) {
                this._config.layers[name] = layer;

                $rootScope.$broadcast('mapbox-' + this._id + '::add-layer', name);
            },
            removeLayer: function (names) {
                if ((names instanceof Array) === false) names = [names];

                var _this = this;

                angular.forEach(names, function(name) {
                    $rootScope.$broadcast('mapbox-' + _this._id + '::remove-layer', name);

                    delete _this._config.layers[name];
                });
            },
            removeLayers: function () {
                var _this = this;
                
                angular.forEach(this._config.layers, function(layer, name) {
                    $rootScope.$broadcast('mapbox-' + -this._id + '::remove-layer', name);

                    delete _this._config.layers[name];
                });
            },
            showLayer: function (name) {
                $rootScope.$broadcast('mapbox-' + this._id + '::show-layer', name);
            },
            hideLayer: function (name) {
                $rootScope.$broadcast('mapbox-' + this._id + '::hide-layer', name);
            },

            /*
             * GeoJson
             */
            getGeoJSON: function () {
                return this._config.geojson;
            },
            getGeoJSONFeature: function (layerName, featureId) {
                if (this._config.geojson[layerName] && this._config.geojson[layerName][featureId]) {
                    return this._config.geojson[layerName][featureId];
                }

                return null;
            },
            getGeoJSONLayer: function (layerName) {
                if (this._config.geojson[layerName]) {
                    return this._config.geojson[layerName];
                }

                return null;
            },
            addGeoJSON: function(layerName, geojson, options, properties, onAddCallback) {
                properties = _.defaults(properties || {},  {
                    featureId: objectId().toString()
                });

                var data = {
                    layerName: layerName,
                    geojson: geojson,
                    options: options,
                    properties: properties,
                    onAddCallback: onAddCallback
                };

                this._config.geojson[layerName] = this._config.geojson[layerName] || {};
                this._config.geojson[layerName][properties.featureId] = data;

                $rootScope.$broadcast('mapbox-' + this._id + '::add-geojson', data);

                return properties.featureId;
            },
            removeGeoJSONFeature: function(layerName, featureId) {
                if (this._config.geojson[layerName] && this._config.geojson[layerName][featureId]) {
                    $rootScope.$broadcast('mapbox-' + this._id + '::remove-geojson-feature', this._config.geojson[layerName][featureId]);

                    delete this._config.geojson[layerName][featureId];
                }
            },
            removeGeoJSONLayer: function(layerNames) {
                if ((layerNames instanceof Array) === false) layerNames = [layerNames];

                var _this = this;

                angular.forEach(layerNames, function(layerName) {
                    if (_this._config.geojson[layerName]) {
                        $rootScope.$broadcast('mapbox-' + _this._id + '::remove-geojson-layer', layerName);

                        delete _this._config.geojson[layerName];
                    }
                });
            },
            removeGeoJSON: function() {
                var _this = this;
                
                angular.forEach(_this._config.geojson, function(layer, name) {
                    $rootScope.$broadcast('mapbox-' + _this._id + '::remove-geojson-layer', name);

                    delete _this._config.geojson[name];
                });
            },

            /*
             * Editing
             */
            editingOn: function (layerName, controls, controlOptions, styleOptions, addLayer) {
                if (typeof controlOptions == 'string') {
                    controlOptions = {
                        exclude: (controlOptions == 'exclude')
                    }
                }

                this.enqueueRequest('mapbox-' + this._id + '::edit-on', {layerName: layerName, controls: controls, controlOptions: controlOptions, styleOptions: styleOptions, addLayer: addLayer});
            },
            editingUpdate: function () {
                this.enqueueRequest('mapbox-' + this._id + '::edit-update');
            },
            editingClear: function () {
                this.enqueueRequest('mapbox-' + this._id + '::edit-clear');
            },
            editingOff: function () {
                this.enqueueRequest('mapbox-' + this._id + '::edit-off');
            },

            /*
             * Picking
             */
            pickPortionOn: function() {
                this.enqueueRequest('mapbox-' + this._id + '::pick-portion-on');
            },
            pickDistrictOn: function() {
                this.enqueueRequest('mapbox-' + this._id + '::pick-district-on');
            },
            pickFieldOn: function() {
                this.enqueueRequest('mapbox-' + this._id + '::pick-field-on');
            },
            defineFarmOn: function() {
                this.enqueueRequest('mapbox-' + this._id + '::define-farm-on');
            },
            defineServiceAreaOn: function() {
                this.enqueueRequest('mapbox-' + this._id + '::define-service-area-on');
            },
            defineFieldGroupOn: function() {
                this.enqueueRequest('mapbox-' + this._id + '::define-field-group-on');
            },
            featureClickOn: function() {
                this.enqueueRequest('mapbox-' + this._id + '::feature-click-on');
            },
            pickPortionOff: function() {
                this.enqueueRequest('mapbox-' + this._id + '::pick-portion-off');
            },
            pickDistrictOff: function() {
                this.enqueueRequest('mapbox-' + this._id + '::pick-district-off');
            },
            pickFieldOff: function() {
                this.enqueueRequest('mapbox-' + this._id + '::pick-field-off');
            },
            defineFarmOff: function() {
                this.enqueueRequest('mapbox-' + this._id + '::define-farm-off');
            },
            defineServiceAreaOff: function() {
                this.enqueueRequest('mapbox-' + this._id + '::define-farm-off');
            },
            defineFieldGroupOff: function() {
                this.enqueueRequest('mapbox-' + this._id + '::define-field-group-off');
            },
            featureClickOff: function() {
                this.enqueueRequest('mapbox-' + this._id + '::feature-click-off');
            },
            printMap: function() {
                this.enqueueRequest('mapbox-' + this._id + '::print-map');
            }
        };

        /*
         * Get or create a MapboxServiceInstance
         */
        return function (id, options) {
            options = options || {};

            if (_instances[id] === undefined) {
                _instances[id] = new MapboxServiceInstance(id, options);
            }

            if (options.clean === true) {
                _instances[id].reset();
            }

            return _instances[id];
        };
    }];
});

/**
 * mapbox
 */
sdkInterfaceMapApp.directive('mapbox', ['$rootScope', '$http', '$log', '$timeout', 'configuration', 'mapboxService', 'geoJSONHelper', 'objectId', function ($rootScope, $http, $log, $timeout, configuration, mapboxService, geoJSONHelper, objectId) {
    var _instances = {};
    
    function Mapbox(attrs, scope) {
        var _this = this;
        _this._id = attrs.id;

        _this._optionSchema = {};
        _this._editing = false;
        _this._editableLayer;
        _this._editableFeature = L.featureGroup();
        _this._featureClickable;

        _this._geoJSON = {};
        _this._layers = {};
        _this._controls = {};
        _this._layerControls = {
            baseTile: '',
            baseLayers: {},
            overlays: {}
        };
        _this._draw = {
            exclude: false,
            addLayer: true,
            options: {},
            controls: {}
        };

        // Init
        attrs.delay = attrs.delay || 0;

        $timeout(function () {
            _this.mapInit();
            _this.addListeners(scope);

            $rootScope.$broadcast('mapbox-' + _this._mapboxServiceInstance.getId() + '::init', _this._map);
        }, attrs.delay);
    }

    /*
     * Config
     */
    Mapbox.prototype.mapInit = function() {
        // Setup mapboxServiceInstance
        this._mapboxServiceInstance = mapboxService(this._id);

        // Setup map
        var view = this._mapboxServiceInstance.getView();
        var options = this._mapboxServiceInstance.getOptions();

        this._map = L.map(this._id, options).setView(view.coordinates, view.zoom);

        this._editableFeature = L.featureGroup();
        this._editableFeature.addTo(this._map);

        this.setEventHandlers(this._mapboxServiceInstance.getEventHandlers());
        this.resetLayers(this._mapboxServiceInstance.getLayers());
        this.resetGeoJSON(this._mapboxServiceInstance.getGeoJSON());
        this.resetLayerControls(this._mapboxServiceInstance.getBaseTile(), this._mapboxServiceInstance.getBaseLayers(), this._mapboxServiceInstance.getOverlays());
        this.addControls(this._mapboxServiceInstance.getControls());
        this.setBounds(this._mapboxServiceInstance.getBounds());

        this._map.on('draw:drawstart', this.onDrawStart, this);
        this._map.on('draw:editstart', this.onDrawStart, this);
        this._map.on('draw:deletestart', this.onDrawStart, this);
        this._map.on('draw:drawstop', this.onDrawStop, this);
        this._map.on('draw:editstop', this.onDrawStop, this);
        this._map.on('draw:deletestop', this.onDrawStop, this);
    };

    Mapbox.prototype.addListeners = function (scope) {
        scope.hidden = !this._mapboxServiceInstance.shouldShow();
        
        var _this = this;
        var id = this._mapboxServiceInstance.getId();

        scope.$on('mapbox-' + id + '::get-center', function (event, handler) {
            if (typeof handler === 'function') {
                handler(_this._map.getCenter());
            }
        });

        scope.$on('mapbox-' + id + '::get-bounds', function (event, handler) {
            if (typeof handler === 'function') {
                handler(_this._map.getBounds());
            }
        });

        scope.$on('mapbox-' + id + '::get-control', function (event, args) {
            if (typeof args.handler === 'function') {
                args.handler(_this._controls[args.control]);
            }
        });

        // Destroy mapbox directive
        scope.$on('$destroy', function () {
            delete _instances[id];

            _this.mapDestroy();

            $rootScope.$broadcast('mapbox-' + id + '::destroy');
        });

        // Layer Controls
        scope.$on('mapbox-' + id + '::set-basetile', function (event, args) {
            _this.setBaseTile(args);
        });

        scope.$on('mapbox-' + id + '::set-baselayers', function (event, args) {
            _this.setBaseLayers(args);
        });

        scope.$on('mapbox-' + id + '::add-overlay', function (event, args) {
            _this.addOverlay(args.layerName, args.name);
        });

        scope.$on('mapbox-' + id + '::remove-overlay', function (event, args) {
            _this.removeOverlay(args);
        });

        // Controls
        scope.$on('mapbox-' + id + '::add-control', function (event, args) {
            _this.addControls({control: args});
        });

        scope.$on('mapbox-' + id + '::remove-control', function (event, args) {
            _this.removeControl(args);
        });

        // Event Handlers
        scope.$on('mapbox-' + id + '::add-event-handler', function (event, args) {
            _this.addEventHandler(args.event, args.handler);
        });

        scope.$on('mapbox-' + id + '::remove-event-handler', function (event, args) {
            _this.removeEventHandler(args.event, args.handler);
        });

        // View
        scope.$on('mapbox-' + id + '::set-view', function (event, args) {
            _this.setView(args);
        });

        scope.$on('mapbox-' + id + '::set-bounds', function (event, args) {
            _this.setBounds(args);
        });

        scope.$on('mapbox-' + id + '::zoom-to', function (event, args) {
            _this.zoomTo(args);
        });

        // Layers
        scope.$on('mapbox-' + id + '::create-layer', function (event, args) {
            if (typeof args.handler === 'function') {
                args.handler(_this.createLayer(args.name, args.type, args.options));
            }
        });

        scope.$on('mapbox-' + id + '::add-layer', function (event, args) {
            _this.addLayer(args);
        });

        scope.$on('mapbox-' + id + '::remove-layer', function (event, args) {
            _this.removeLayer(args);
        });

        scope.$on('mapbox-' + id + '::show-layer', function (event, args) {
            _this.showLayer(args);
        });

        scope.$on('mapbox-' + id + '::hide-layer', function (event, args) {
            _this.hideLayer(args);
        });

        // GeoJSON
        scope.$on('mapbox-' + id + '::add-geojson', function (event, args) {
            _this.addGeoJSONFeature(args);
        });

        scope.$on('mapbox-' + id + '::remove-geojson-feature', function (event, args) {
            _this.removeGeoJSONFeature(args);
        });

        scope.$on('mapbox-' + id + '::remove-geojson-layer', function (event, args) {
            _this.removeGeoJSONLayer(args);
        });

        // Visibility
        scope.$on('mapbox-' + id + '::hide', function (event, args) {
            scope.hidden = true;
        });

        scope.$on('mapbox-' + id + '::show', function (event, args) {
            scope.hidden = false;
        });

        scope.$on('mapbox-' + id + '::invalidate-size', function (event, args) {
            _this._map.invalidateSize();
        });

        // Editing
        scope.$on('mapbox-' + id + '::edit-on', function(events, args) {
            _this.setOptionSchema(args.styleOptions);
            _this.makeEditable(args.layerName, args.addLayer, true);
            _this.setDrawControls(args.controls, args.controlOptions);
            _this.updateDrawControls();
        });

        scope.$on('mapbox-' + id + '::edit-update', function(events, args) {
            _this.makeEditable(_this._editableLayer, _this._draw.addLayer, false);
            _this.updateDrawControls();
        });

        scope.$on('mapbox-' + id + '::edit-clear', function(events, args) {
            _this.cleanEditable();
            _this.updateDrawControls();
        });

        scope.$on('mapbox-' + id + '::edit-off', function(events, args) {
            _this.makeEditable(undefined, {}, true);
            _this.updateDrawControls();
        });

        // Picking
        scope.$on('mapbox-' + id + '::pick-portion-on', function(event, args) {
            _this._map.on('click', _this.pickPortion, _this);
        });

        scope.$on('mapbox-' + id + '::pick-district-on', function(event, args) {
            _this._map.on('click', _this.pickDistrict, _this);
        });

        scope.$on('mapbox-' + id + '::pick-field-on', function(event, args) {
            _this._map.on('click', _this.pickField, _this);
        });

        scope.$on('mapbox-' + id + '::define-farm-on', function(event, args) {
            _this._map.on('click', _this.defineNewFarm, _this);
        });

        scope.$on('mapbox-' + id + '::define-service-area-on', function(event, args) {
            _this._map.on('click', _this.defineServiceArea, _this);
        });

        scope.$on('mapbox-' + id + '::define-field-group-on', function(event, args) {
            _this._map.on('click', _this.defineFieldGroup, _this);
        });

        scope.$on('mapbox-' + id + '::feature-click-on', function(event, args) {
            _this._featureClickable = true;
        });

        scope.$on('mapbox-' + id + '::pick-portion-off', function(event, args) {
            _this._map.off('click', _this.pickPortion, _this);
        });

        scope.$on('mapbox-' + id + '::pick-field-off', function(event, args) {
            _this._map.off('click', _this.pickField, _this);
        });

        scope.$on('mapbox-' + id + '::pick-district-off', function(event, args) {
            _this._map.off('click', _this.pickDistrict, _this);
        });

        scope.$on('mapbox-' + id + '::define-farm-off', function(event, args) {
            _this._map.off('click', _this.defineNewFarm, _this);
        });

        scope.$on('mapbox-' + id + '::define-service-area-off', function(event, args) {
            _this._map.off('click', _this.defineServiceArea, _this);
        });

        scope.$on('mapbox-' + id + '::define-field-group-off', function(event, args) {
            _this._map.off('click', _this.defineFieldGroup, _this);
        });

        scope.$on('mapbox-' + id + '::feature-click-off', function(event, args) {
            _this._featureClickable = false;
        });

        scope.$on('mapbox-' + id + '::print-map', function(event, args) {
            leafletImage(_this._map, function(err, canvas) {
                var img = document.createElement('img');
                var dimensions = _this._map.getSize();
                img.width = dimensions.x;
                img.height = dimensions.y;
                img.src = canvas.toDataURL();
                $rootScope.$broadcast('mapbox-' + id + '::print-map-done', img);
            });
        });
    };

    Mapbox.prototype.mapDestroy = function () {
        for (var layer in this._map._layers) {
            if (this._map._layers.hasOwnProperty(layer)) {
                this._map.removeLayer(this._map._layers[layer]);
            }
        }

        this._optionSchema = {};
        this._editing = false;
        this._editableLayer = null;
        this._editableFeature = null;

        this._geoJSON = {};
        this._layers = {};
        this._layerControls = {
            baseTile: '',
            baseLayers: {},
            overlays: {}
        };
        this._draw = {
            exclude: false,
            addLayer: true,
            options: {},
            controls: {}
        };

        this._map.remove();
        this._map = null;
    };

    /*
     * Reset
     */
    Mapbox.prototype.resetLayerControls = function (baseTile, baseLayers, overlays) {
        this._layerControls.baseTile = baseTile;

        try {
            this.map.removeControl(this._layerControls.control);
        } catch(exception) {}

        this.setBaseLayers(baseLayers);
        this.setOverlays(overlays);
    };

    Mapbox.prototype.resetLayers = function (layers) {
        var _this = this;

        angular.forEach(_this._layers, function (layer, name) {
            _this._map.removeLayer(layer);

            delete _this._layers[name];
        });

        angular.forEach(layers, function (layer, name) {
            _this._layers[name] = layer;

            _this._map.addLayer(layer);
        });
    };

    Mapbox.prototype.resetGeoJSON = function (geojson) {
        var _this = this;

        angular.forEach(_this._geoJSON, function (layer, name) {
            if (_this._layers[name]) {
                _this._map.removeLayer(_this._layers[name]);

                delete _this._layers[name];
            }
        });

        angular.forEach(geojson, function(layer) {
            _this.addGeoJSONLayer(layer);
        });
    };

    /*
     * Layer Controls
     */
    Mapbox.prototype.setBaseTile = function (tile) {
        var _this = this;

        _this._layerControls.baseTile = tile;

        angular.forEach(_this._layerControls.baseLayers, function (baselayer) {
            if (baselayer.base && baselayer.layer) {
                baselayer.layer.setUrl(tile);
            }
        });
    };

    Mapbox.prototype.setBaseLayers = function (layers) {
        var _this = this;
        var options = _this._mapboxServiceInstance.getOptions();

        if (_this._layerControls.control === undefined) {
            _this._layerControls.control = L.control.layers({}, {});

            if (options.layersControl) {
                _this._map.addControl(_this._layerControls.control);
            }
        }

        angular.forEach(_this._layerControls.baseLayers, function (baselayer, name) {
            if (layers[name] === undefined) {
                _this._layerControls.control.removeLayer(baselayer.layer);
            } else if (baselayer.layer === undefined) {
                _this.addBaseLayer(baselayer, name);
            }
        });

        angular.forEach(layers, function (baselayer, name) {
            if (_this._layerControls.baseLayers[name] === undefined) {
                _this.addBaseLayer(baselayer, name);
            } else {
                baselayer =  _this._layerControls.baseLayers[name];

                if (baselayer.base) {
                    baselayer.layer.addTo(this._map);
                }
            }
        });
    };

    Mapbox.prototype.addBaseLayer = function (baselayer, name) {
        if (baselayer.base) {
            baselayer.tiles = this._layerControls.baseTile;
        }

        if (baselayer.type == 'tile') {
            baselayer.layer = L.tileLayer(baselayer.tiles);
        } else if (baselayer.type == 'mapbox') {
            baselayer.layer = L.mapbox.tileLayer(baselayer.tiles);
        } else if (baselayer.type == 'google' && typeof L.Google === 'function') {
            baselayer.layer = new L.Google(baselayer.tiles);
        }

        if (baselayer.base) {
            baselayer.layer.addTo(this._map);
        }

        this._layerControls.baseLayers[name] = baselayer;
        this._layerControls.control.addBaseLayer(baselayer.layer, name);
    };

    Mapbox.prototype.setOverlays = function (overlays) {
        var _this = this;

        angular.forEach(_this._layerControls.overlays, function (overlay, name) {
            if (overlays[name] === undefined) {
                _this.removeOverlay(name, overlay);
            }
        });

        angular.forEach(overlays, function (name, layerName) {
            _this.addOverlay(layerName, name);
        });
    };

    Mapbox.prototype.addOverlay = function (layerName, name) {
        var layer = this._layers[layerName];
        name = name || layerName;

        if (this._layerControls.control && layer) {
            if (this._layerControls.overlays[layerName] === undefined) {
                this._layerControls.overlays[layerName] = layer;

                this._layerControls.control.addOverlay(layer, name);
            }
        }
    };

    Mapbox.prototype.removeOverlay = function (name, overlay) {
        var layer = overlay || this._layers[name];

        if (this._layerControls.control && layer) {
            this._layerControls.control.removeLayer(layer);

            delete this._layerControls.overlays[name];
        }
    };

    /*
     * Controls
     */
    Mapbox.prototype.addControls = function (controls) {
        var _this = this;

        angular.forEach(controls, function (control) {
            if (typeof L.control[control.name] == 'function') {
                _this.removeControl(control.name);

                _this._controls[control.name] = L.control[control.name](control.options);
                _this._map.addControl(_this._controls[control.name]);
            }
        });
    };

    Mapbox.prototype.removeControl = function (control) {
        if (this._controls[control]) {
            this._map.removeControl(this._controls[control]);
            delete this._controls[control];
        }
    };

    /*
     * Event Handlers
     */
    Mapbox.prototype.setEventHandlers = function (handlers) {
        var _this = this;

        angular.forEach(handlers, function (handler, event) {
            _this.addEventHandler(event, handler);
        });
    };

    Mapbox.prototype.addEventHandler = function (event, handler) {
        this._map.on(event, handler);
    };

    Mapbox.prototype.removeEventHandler = function (event, handler) {
        this._map.off(event, handler);
    };

    /*
     * View
     */
    Mapbox.prototype.setView = function (view) {
        if (this._map && view !== undefined) {
            this._map.setView(view.coordinates, view.zoom);
        }
    };

    Mapbox.prototype.setBounds = function (bounds) {
        if (this._map && bounds.coordinates) {
            if (bounds.coordinates instanceof Array) {
                if (bounds.coordinates.length > 1) {
                    this._map.fitBounds(bounds.coordinates, bounds.options);
                }
            } else {
                this._map.fitBounds(bounds.coordinates, bounds.options);
            }
        }
    };

    Mapbox.prototype.zoomTo = function (view) {
        if (this._map && view.coordinates && view.zoom) {
            this._map.setZoomAround(view.coordinates, view.zoom, view.options);
        }
    };

    /*
     * Layers
     */
    Mapbox.prototype.createLayer = function (name, type, options) {
        type = type || 'featureGroup';
        options = options || {};

        if (this._layers[name] === undefined) {
            if (type == 'featureGroup' && L.featureGroup) {
                this._layers[name] = L.featureGroup(options);
            } else if (type == 'markerClusterGroup' && L.markerClusterGroup) {
                this._layers[name] = L.markerClusterGroup(options);
            }

            if (this._layers[name]) {
                this._layers[name].addTo(this._map);
            }
        }

        return this._layers[name];
    };

    Mapbox.prototype.addLayer = function (name) {
        var layer = this._mapboxServiceInstance.getLayer(name);

        if (layer) {
            this._layers[name] = layer;

            this._map.addLayer(layer);
        }
    };

    Mapbox.prototype.addLayerToLayer = function (name, layer, toLayerName) {
        var toLayer = this._layers[toLayerName];
        
        if (toLayer) {
            this._layers[name] = layer;

            toLayer.addLayer(layer);
        }
    };

    Mapbox.prototype.removeLayer = function (name) {
        var layer = this._layers[name];

        if (layer) {
            this.removeOverlay(name);
            this._map.removeLayer(layer);

            delete this._layers[name];
        }
    };

    Mapbox.prototype.removeLayerFromLayer = function (name, fromLayerName) {
        var fromLayer = this._layers[fromLayerName];
        var layer = this._layers[name];

        if (fromLayer) {
            fromLayer.removeLayer(layer);
            
            delete this._layers[name];
        }
    };

    Mapbox.prototype.showLayer = function (name) {
        var layer = this._layers[name];

        if (layer && this._map.hasLayer(layer) == false) {
            this._map.addLayer(layer);

            layer.eachLayer(function (item) {
                if (item.bindLabel && item.feature.properties.label) {
                    item.bindLabel(item.feature.properties.label.message, item.feature.properties.label.options);
                }
            });
        }
    };

    Mapbox.prototype.hideLayer = function (name) {
        var layer =  this._layers[name];

        if (layer &&  this._map.hasLayer(layer)) {
            this._map.removeLayer(layer);
        }
    };

    /*
     * GeoJSON
     */
    Mapbox.prototype.addGeoJSONLayer = function (data) {
        var _this = this;

        angular.forEach(data, function(item) {
            _this.addGeoJSONFeature(item);
        });
    };

    Mapbox.prototype.makeIcon = function (data) {
        if (data) {
            if (data.type && L[data.type] && L[data.type].icon) {
                return L[data.type].icon(data);
            } else {
                return L.icon(data);
            }
        } else {
            return L.Icon.Default();
        }
    };

    Mapbox.prototype.addLabel = function (labelData, feature, layer) {
        var _this = this;
        var geojson = geoJSONHelper(feature);

        if (typeof labelData === 'object' && feature.geometry.type !== 'Point') {
            labelData.options = labelData.options || {};

            if ((labelData.options.centered || labelData.options.noHide) && typeof _this._map.showLabel === 'function') {
                var label = new L.Label(_.extend(labelData.options), {
                    offset: [6, -15]
                });

                label.setContent(labelData.message);
                label.setLatLng(geojson.getCenter());

                if (labelData.options.noHide == true) {
                    _this._map.showLabel(label);
                } else {
                    layer.on('mouseover', function () {
                        _this._map.showLabel(label);
                    });
                    layer.on('mouseout', function () {
                        _this._map.removeLayer(label);
                    });
                }

                layer.on('remove', function () {
                    _this._map.removeLayer(label);
                })
            } else if (typeof layer.bindLabel === 'function') {
                layer.bindLabel(labelData.message, labelData.options);
            }
        }
    };

    Mapbox.prototype.addGeoJSONFeature = function (item) {
        var _this = this;
        var geojson = geoJSONHelper(item.geojson, item.properties);

        _this.createLayer(item.layerName);

        _this._geoJSON[item.layerName] = _this._geoJSON[item.layerName] || {};
        _this._geoJSON[item.layerName][item.properties.featureId] = item;

        var geojsonOptions = (item.options ? angular.copy(item.options) : {});

        if (geojsonOptions.icon) {
            geojsonOptions.icon = _this.makeIcon(geojsonOptions.icon);
        }

        L.geoJson(geojson.getJson(), {
            style: geojsonOptions.style,
            pointToLayer: function(feature, latlng) {
                var marker = L.marker(latlng, geojsonOptions);

                if (geojsonOptions.label) {
                    marker.bindLabel(geojsonOptions.label.message, geojsonOptions.label.options);
                }

                return marker;
            },
            onEachFeature: function(feature, layer) {
                _this.addLayerToLayer(feature.properties.featureId, layer, item.layerName);
                _this.addLabel(geojsonOptions.label, feature, layer);

                if (typeof item.onAddCallback === 'function') {
                    item.onAddCallback(feature, layer);
                }

                if (_this._featureClickable && (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon')) {
                    // highlight polygon on click
                    layer.on('click', function(e) {
                        if(feature && feature.properties) {
                            if(feature.properties.highlighted) {
                                feature.properties.highlighted = false;
                                layer.setStyle({color: layer.options.fillColor || 'blue', opacity: layer.options.fillOpacity || 0.4});
                            } else {
                                feature.properties.highlighted = true;
                                layer.setStyle({color: 'white', opacity: 1, fillColor: layer.options.fillColor || 'blue', fillOpacity: layer.options.fillOpacity || 0.4});
                            }
                        }

                        $rootScope.$broadcast('mapbox-' + _this._mapboxServiceInstance.getId() + '::polygon-clicked', {properties: feature.properties, highlighted: feature.properties.highlighted});
                    });
                }
            }
        });
    };

    Mapbox.prototype.removeGeoJSONFeature = function (data) {
        if (this._geoJSON[data.layerName] && this._geoJSON[data.layerName][data.properties.featureId]) {
            this.removeLayerFromLayer(data.properties.featureId, data.layerName);
            
            delete this._geoJSON[data.layerName][data.properties.featureId];
        }
    };

    Mapbox.prototype.removeGeoJSONLayer = function (layerName) {
        if (this._geoJSON[layerName]) {
            this.removeLayer(layerName);

            delete this._geoJSON[layerName];
        }
    };

    /*
     * Edit
     */
    Mapbox.prototype.makeEditable = function (editable, addLayer, clean) {
        var _this = this;

        if (clean == true) {
            _this.cleanEditable();
        }

        if(editable && _this._layers[editable]) {
            _this._layers[editable].eachLayer(function(layer) {
                _this._layers[editable].removeLayer(layer);
                _this._editableFeature.addLayer(layer);
            });
        }
        _this._editableLayer = editable;
        _this._draw.addLayer = (addLayer == undefined ? true : addLayer);
    };

    Mapbox.prototype.cleanEditable = function () {
        var _this = this;

        _this._editableFeature.eachLayer(function(layer) {
            _this._editableFeature.removeLayer(layer);
        });
    };

    Mapbox.prototype.setDrawControls = function (controls, controlOptions) {
        this._draw.controlOptions = controlOptions || {};
        this._draw.controls = {};

        if(controls instanceof Array && typeof L.Control.Draw == 'function') {
            this._draw.controls.polyline = new L.Control.Draw({
                draw: {
                    polyline: (controls.indexOf('polyline') != -1),
                    polygon: false,
                    rectangle: false,
                    circle: false,
                    marker: false
                }
            });

            this._draw.controls.polygon = new L.Control.Draw({
                draw: {
                    polyline: false,
                    polygon: (controls.indexOf('polygon') == -1 ? false : {
                        allowIntersection: false,
                        showArea: true,
                        metric: true
                    }),
                    rectangle: false,
                    circle: false,
                    marker: false
                }
            });

            this._draw.controls.marker = new L.Control.Draw({
                draw: {
                    polyline: false,
                    polygon: false,
                    rectangle: false,
                    circle: false,
                    marker: (controls.indexOf('marker') == -1 ? false : {
                        icon: (this._optionSchema.icon ? L.icon(this._optionSchema.icon) : L.Icon.Default())
                    })
                }
            });

            this._draw.controls.edit = new L.Control.Draw({
                draw: false,
                edit: {
                    featureGroup: this._editableFeature,
                    remove: (this._draw.controlOptions.nodelete != true)
                }
            });
        }
    };

    Mapbox.prototype.setOptionSchema = function (options) {
        this._optionSchema = options || {};
    };

    Mapbox.prototype.updateDrawControls = function () {
        try {
            this._map.removeControl(this._draw.controls.polyline);
        } catch(exception) {}
        try {
            this._map.removeControl(this._draw.controls.polygon);
        } catch(exception) {}
        try {
            this._map.removeControl(this._draw.controls.marker);
        } catch(exception) {}
        try {
            this._map.removeControl(this._draw.controls.edit);
        } catch(exception) {}

        try {
            this._map.off('draw:created', this.onDrawn, this);
            this._map.off('draw:edited', this.onEdited, this);
            this._map.off('draw:deleted', this.onDeleted, this);
        } catch(exception) {}

        // Draw controls
        if(this._editableFeature.getLayers().length > 0) {
            this._map.on('draw:edited', this.onEdited, this);
            this._map.on('draw:deleted', this.onDeleted, this);

            if(this._draw.controls.edit) {
                this._map.addControl(this._draw.controls.edit);
            }
        }

        if (this._editableLayer && (this._editableFeature.getLayers().length == 0 || this._draw.controlOptions.multidraw)) {
            var controlRequirement = {
                polyline: true,
                polygon: true,
                marker: true
            };

            this._editableFeature.eachLayer(function(layer) {
                if(layer.feature && layer.feature.geometry && layer.feature.geometry.type) {
                    switch(layer.feature.geometry.type) {
                        case 'LineString':
                            controlRequirement.polyline = false;
                            break;
                        case 'Polygon':
                            controlRequirement.polygon = false;
                            break;
                        case 'Point':
                            controlRequirement.marker = false;
                            break;
                    }
                }
            });

            if (this._draw.controlOptions.exclude) {
                if(controlRequirement.polyline) {
                    this._map.addControl(this._draw.controls.polyline);
                }

                if(controlRequirement.polygon) {
                    this._map.addControl(this._draw.controls.polygon);
                }

                if(controlRequirement.marker) {
                    this._map.addControl(this._draw.controls.marker);
                }

                this._map.on('draw:created', this.onDrawn, this);
            } else {
                if(this._draw.controls.polyline) {
                    this._map.addControl(this._draw.controls.polyline);
                }

                if(this._draw.controls.polygon) {
                    this._map.addControl(this._draw.controls.polygon);
                }

                if(this._draw.controls.marker) {
                    this._map.addControl(this._draw.controls.marker);
                }

                this._map.on('draw:created', this.onDrawn, this);
            }
        }
    };

    /*
     * Picking
     */
    Mapbox.prototype.pickPortion = function (e) {
        var _this = this;

        if (_this._editing == false) {
            var host = configuration.getServer();
            var params = '?x=' + e.latlng.lng + '&y=' + e.latlng.lat;
            $http.get(host + 'api/geo/portion-polygon' + params)
                .success(function (portion) {
                    if(!_this._mapboxServiceInstance.getGeoJSONFeature(_this._editableLayer, portion.sgKey)) {
                        _this._mapboxServiceInstance.removeGeoJSONLayer(_this._editableLayer);
                        _this._mapboxServiceInstance.addGeoJSON(_this._editableLayer, portion.position, _this._optionSchema, {featureId: portion.sgKey});

                        $rootScope.$broadcast('mapbox-' + _this._mapboxServiceInstance.getId() + '::portion-added', portion);
                    }

                }).error(function(err) {
                    $log.debug(err);
                });
        }
    };

    Mapbox.prototype.defineNewFarm = function (e) {
        var _this = this;

        if (_this._editing == false) {
            var host = configuration.getServer();
            var params = '?x=' + e.latlng.lng + '&y=' + e.latlng.lat;
            $http.get(host + 'api/geo/portion-polygon' + params)
                .success(function (portion) {
                    if(!_this._mapboxServiceInstance.getGeoJSONFeature(_this._editableLayer, portion.sgKey)) {
                        _this._mapboxServiceInstance.addGeoJSON(_this._editableLayer, portion.position, _this._optionSchema, {featureId: portion.sgKey, portion: portion});

                        _this.makeEditable(_this._editableLayer, _this._draw.addLayer, false);
                        _this.updateDrawControls();

                        $rootScope.$broadcast('mapbox-' + _this._mapboxServiceInstance.getId() + '::portion-added', portion);
                    }
                }).error(function(err) {
                    $log.debug(err);
                });
        }
    };

    Mapbox.prototype.pickDistrict = function (e) {
        var _this = this;

        if (_this._editing == false) {
            var host = configuration.getServer();
            var params = '?x=' + e.latlng.lng + '&y=' + e.latlng.lat;
            $http.get(host + 'api/geo/district-polygon' + params)
                .success(function (district) {
                    if(!_this._mapboxServiceInstance.getGeoJSONFeature(_this._editableLayer, district.sgKey)) {
                        _this._mapboxServiceInstance.removeGeoJSONLayer(_this._editableLayer);
                        _this._mapboxServiceInstance.addGeoJSON(_this._editableLayer, district.position, _this._optionSchema, {featureId: district.sgKey});

                        $rootScope.$broadcast('mapbox-' + _this._mapboxServiceInstance.getId() + '::district-added', district);
                    }
                }).error(function(err) {
                    $log.debug(err);
                });
        }
    };

    Mapbox.prototype.defineServiceArea = function (e) {
        var _this = this;

        if (_this._editing == false) {
            var host = configuration.getServer();
            var params = '?x=' + e.latlng.lng + '&y=' + e.latlng.lat;
            $http.get(host + 'api/geo/district-polygon' + params)
                .success(function (district) {
                    if(!_this._mapboxServiceInstance.getGeoJSONFeature(_this._editableLayer, district.sgKey)) {
                        _this._mapboxServiceInstance.addGeoJSON(_this._editableLayer, district.position, _this._optionSchema, {featureId: district.sgKey, districtName: district.name});

                        _this.makeEditable(_this._editableLayer, _this._draw.addLayer, false);
                        _this.updateDrawControls();

                        $rootScope.$broadcast('mapbox-' + _this._mapboxServiceInstance.getId() + '::district-added', district);
                    }
                }).error(function(err) {
                    $log.debug(err);
                });
        }
    };

    Mapbox.prototype.pickField = function (e) {
        var _this = this;

        if (_this._editing == false) {
            var host = configuration.getServer();
            var params = '?x=' + e.latlng.lng + '&y=' + e.latlng.lat;
            $http.get(host + 'api/geo/field-polygon' + params)
                .success(function (field) {
                    if(!_this._mapboxServiceInstance.getGeoJSONFeature(_this._editableLayer, field.sgKey)) {
                        _this._mapboxServiceInstance.removeGeoJSONLayer(_this._editableLayer);
                        _this._mapboxServiceInstance.addGeoJSON(_this._editableLayer, field.position, _this._optionSchema, {});

                        $rootScope.$broadcast('mapbox-' + _this._mapboxServiceInstance.getId() + '::field-added', field);
                    }
                }).error(function(err) {
                    $log.debug(err);
                });
        }
    };

    Mapbox.prototype.defineFieldGroup = function (e) {
        var _this = this;

        if (_this._editing == false) {
            var host = configuration.getServer();
            var params = '?x=' + e.latlng.lng + '&y=' + e.latlng.lat;
            $http.get(host + 'api/geo/field-polygon' + params)
                .success(function (field) {
                    if(!_this._mapboxServiceInstance.getGeoJSONFeature(_this._editableLayer, field.sgKey)) {
                        _this._mapboxServiceInstance.addGeoJSON(_this._editableLayer, field.position, _this._optionSchema, { });

                        _this.makeEditable(_this._editableLayer, _this._draw.addLayer, false);
                        _this.updateDrawControls();

                        $rootScope.$broadcast('mapbox-' + _this._mapboxServiceInstance.getId() + '::field-added', field);
                    }
                }).error(function(err) {
                    $log.debug(err);
                });
        }
    };

    Mapbox.prototype.onDrawStart = function (e) {
       this._editing = true;

        $rootScope.$broadcast('mapbox-' + this._mapboxServiceInstance.getId() + '::geometry-editing', this._editing);
    };

    Mapbox.prototype.onDrawStop = function (e) {
        this._editing = false;

        $rootScope.$broadcast('mapbox-' + this._mapboxServiceInstance.getId() + '::geometry-editing', this._editing);
    };

    Mapbox.prototype.onDrawn = function (e) {
        var geojson = {
            type: 'Feature',
            geometry: {},
            properties: {
                featureId: objectId().toString()
            }
        };

        switch (e.layerType) {
            case 'polyline':
                geojson.geometry = {
                    type: 'LineString',
                    coordinates: []
                };

                angular.forEach(e.layer._latlngs, function(latlng) {
                    geojson.geometry.coordinates.push([latlng.lng, latlng.lat]);
                });

                $rootScope.$broadcast('mapbox-' + this._mapboxServiceInstance.getId() + '::geometry-created', geojson);
                break;
            case 'polygon':
                geojson.geometry = {
                    type: 'Polygon',
                    coordinates: [[]]
                };

                angular.forEach(e.layer._latlngs, function(latlng) {
                    geojson.geometry.coordinates[0].push([latlng.lng, latlng.lat]);
                });

                // Add a closing coordinate if there is not a matching starting one
                if (geojson.geometry.coordinates[0].length > 0 && geojson.geometry.coordinates[0][0] != geojson.geometry.coordinates[0][geojson.geometry.coordinates[0].length - 1]) {
                    geojson.geometry.coordinates[0].push(geojson.geometry.coordinates[0][0]);
                }

                if (this._draw.controls.polygon.options.draw.polygon.showArea) {
                    var geodesicArea = L.GeometryUtil.geodesicArea(e.layer._latlngs);
                    var yards = (geodesicArea * 1.19599);

                    geojson.properties.area = {
                        m_sq: geodesicArea,
                        ha: (geodesicArea * 0.0001),
                        mi_sq: (yards / 3097600),
                        acres: (yards / 4840),
                        yd_sq: yards
                    };
                }

                $rootScope.$broadcast('mapbox-' + this._mapboxServiceInstance.getId() + '::geometry-created', geojson);
                break;
            case 'marker':
                geojson.geometry = {
                    type: 'Point',
                    coordinates: [e.layer._latlng.lng, e.layer._latlng.lat]
                };

                $rootScope.$broadcast('mapbox-' + this._mapboxServiceInstance.getId() + '::geometry-created', geojson);
                break;
        }

        if (this._draw.addLayer) {
            this._mapboxServiceInstance.addGeoJSON(this._editableLayer, geojson, this._optionSchema, geojson.properties);
            this.makeEditable(this._editableLayer);
            this.updateDrawControls();
        }
    };

    Mapbox.prototype.onEdited = function (e) {
        var _this = this;

        e.layers.eachLayer(function(layer) {
            var geojson = {
                type: 'Feature',
                geometry: {
                    type: layer.feature.geometry.type
                },
                properties: {
                    featureId: layer.feature.properties.featureId
                }
            };

            switch(layer.feature.geometry.type) {
                case 'Point':
                    geojson.geometry.coordinates = [layer._latlng.lng, layer._latlng.lat];

                    $rootScope.$broadcast('mapbox-' + _this._mapboxServiceInstance.getId() + '::geometry-edited', geojson);
                    break;
                case 'Polygon':
                    geojson.geometry.coordinates = [[]];

                    angular.forEach(layer._latlngs, function(latlng) {
                        geojson.geometry.coordinates[0].push([latlng.lng, latlng.lat]);
                    });

                    // Add a closing coordinate if there is not a matching starting one
                    if (geojson.geometry.coordinates[0].length > 0 && geojson.geometry.coordinates[0][0] != geojson.geometry.coordinates[0][geojson.geometry.coordinates[0].length - 1]) {
                        geojson.geometry.coordinates[0].push(geojson.geometry.coordinates[0][0]);
                    }

                    if (_this._draw.controls.polygon.options.draw.polygon.showArea) {
                        var geodesicArea = L.GeometryUtil.geodesicArea(layer._latlngs);
                        var yards = (geodesicArea * 1.19599);

                        geojson.properties.area = {
                            m_sq: geodesicArea,
                            ha: (geodesicArea * 0.0001),
                            mi_sq: (yards / 3097600),
                            acres: (yards / 4840),
                            yd_sq: yards
                        };
                    }

                    $rootScope.$broadcast('mapbox-' + _this._mapboxServiceInstance.getId() + '::geometry-edited', geojson);
                    break;
                case 'LineString':
                    geojson.geometry.coordinates = [];

                    angular.forEach(layer._latlngs, function(latlng) {
                        geojson.geometry.coordinates.push([latlng.lng, latlng.lat]);
                    });

                    $rootScope.$broadcast('mapbox-' + _this._mapboxServiceInstance.getId() + '::geometry-edited', geojson);
                    break;
            }
        });
    };

    // may delete one or two geometry at most (field label & field shape)
    Mapbox.prototype.onDeleted = function (e) {
        var _this = this;

        if(e.layers.getLayers().length > 0) {
            // Layer is within the editableFeature
            e.layers.eachLayer(function(layer) {
                _this._editableFeature.removeLayer(layer);

                $rootScope.$broadcast('mapbox-' + _this._mapboxServiceInstance.getId() + '::geometry-deleted', layer.feature.properties.featureId);
            });
        } else {
            // Layer is the editableFeature
            _this._editableFeature.clearLayers();

            $rootScope.$broadcast('mapbox-' + _this._mapboxServiceInstance.getId() + '::geometry-deleted');
        }

        _this.updateDrawControls();
    };
    
    return {
        restrict: 'E',
        template: '<div class="map" ng-hide="hidden" ng-transclude></div>',
        replace: true,
        transclude: true,
        link: function (scope, element, attrs) {
            if (_instances[attrs.id] === undefined) {
                _instances[attrs.id] = new Mapbox(attrs, scope);
            }
        },
        controller: function ($scope, $attrs) {
            this.getMap = function () {
                return _instances[$attrs.id]._map;
            };
        }
    }
}]);

sdkInterfaceMapApp.directive('mapboxControl', ['$rootScope', function ($rootScope) {
    var _position;

    var _positions = {
        topleft: '.leaflet-top.leaflet-left',
        topright: '.leaflet-top.leaflet-right',
        bottomleft: '.leaflet-bottom.leaflet-left',
        bottomright: '.leaflet-bottom.leaflet-right'
    };

    function addListeners(element) {
        var parent = element.parent();

        $rootScope.$on('mapbox-' + parent.attr('id') + '::init', function (event, map) {
            parent.find('.leaflet-control-container ' + _positions[_position]).prepend(element);
        });
    }

    return {
        restrict: 'E',
        require: '^mapbox',
        replace: true,
        transclude: true,
        template: '<div class="leaflet-control"><div class="leaflet-bar" ng-transclude></div></div>',
        link: function (scope, element, attrs) {
            _position = (attrs.position == undefined ? 'bottomright' : attrs.position);
        },
        controller: function($element) {
            addListeners($element);
        }
    }
}]);


var sdkInterfaceNavigiationApp = angular.module('ag.sdk.interface.navigation', ['ag.sdk.authorization']);

sdkInterfaceNavigiationApp.provider('navigationService', function() {
    var _registeredApps = {};
    var _groupedApps = [];

    var _groupOrder = {
        'Favourites': 1,
        'Assets': 2,
        'Apps': 3,
        'Administration': 4
    };

    var _buttons = {
        left: [],
        right: []
    };

    var _sortItems = function (a, b) {
        return a.order - b.order;
    };

    var _registerApps = this.registerApps = function(apps) {
        apps = (apps instanceof Array ? apps : [apps]);

        angular.forEach(apps, function (app) {
            app = _.defaults(app, {
                id: app.title,
                order: 100,
                group: 'Apps',
                include: function (app, roleApps) {
                    return (roleApps.indexOf(app.id) !== -1);
                }
            });

            if (app.title && app.state) {
                _registeredApps[app.title] = app;
            }
        });
    };

    this.$get = ['$rootScope', '$state', 'authorization', function($rootScope, $state, authorization) {
        var _slim = false;
        var _footerText = '';

        // Private functions
        var _allowApp = function (app) {
            var group = _.findWhere(_groupedApps, {title: app.group});

            // Find if the group exists
            if (group === undefined) {
                // Add the group
                group = {
                    title: app.group,
                    order: _groupOrder[app.group] || 100,
                    items: []
                };

                _groupedApps.push(group);
                _groupedApps = _groupedApps.sort(_sortItems);
            }

            // Find if the app exists in the group
            var groupItem = _.findWhere(group.items, {id: app.id});

            if (groupItem === undefined) {
                // Add the app to the group
                app.active = $state.includes(app.state);

                group.items.push(app);
                group.items = group.items.sort(_sortItems);

                $rootScope.$broadcast('navigation::items__changed', _groupedApps);
                $rootScope.$broadcast('navigation::app__allowed', app);
            }
        };

        var _revokeAllApps = function () {
            _groupedApps = [];

            $rootScope.$broadcast('navigation::items__changed', _groupedApps);
        };

        var _updateUserApps = function (currentUser) {
            var authUser = currentUser || authorization.currentUser();
            var roleApps = (authUser.userRole ? _.pluck(authUser.userRole.apps, 'name') : []);
            var orgServices = (authUser.organization ? _.pluck(authUser.organization.services, 'serviceType') : []);

            _revokeAllApps();

            angular.forEach(_registeredApps, function (app) {
                if (typeof app.include == 'function' && app.include(app, roleApps, orgServices) || app.include === true) {
                    _allowApp(app);
                }
            });
        };

        var _setButtons = function (position, buttons) {
            if (buttons) {
                if ((buttons instanceof Array) === false) {
                    _buttons[position].push(buttons);
                } else {
                    _buttons[position] = buttons;
                }

                $rootScope.$broadcast('navigation::' + position + '-buttons__changed', _buttons[position]);
                $rootScope.$broadcast('navigation::buttons__changed');
            }
        };

        // Event handlers
        $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
            angular.forEach(_groupedApps, function (app) {
                angular.forEach(app.items, function (item) {
                    item.active = $state.includes(item.state);
                });
            });
        });

        $rootScope.$on('navigation::item__selected', function(event, args) {
            $state.go(args);
        });

        $rootScope.$on('authorization::login', function (event, currentUser) {
            _updateUserApps(currentUser);
        });

        $rootScope.$on('authorization::unauthorized', function () {
            _revokeAllApps();
        });

        $rootScope.$on('authorization::logout', function () {
            _revokeAllApps();
        });

        _updateUserApps();

        // Public functions
        return {
            getGroupedApps: function () {
                return _groupedApps;
            },
            renameApp: function (id, title) {
                var app = _.findWhere(_registeredApps, {id: id});

                if (app) {
                    app.title = title;

                    $rootScope.$broadcast('navigation::items__changed', _groupedApps);
                }
            },
            /*
             * App registration
             */
            registerApps: function (apps) {
                _registerApps(apps);
            },
            unregisterApps: function () {
                _registeredApps = {};
                _groupedApps = [];
            },
            allowApp: function (appName) {
                if (_registeredApps[appName]) {
                    _allowApp(_registeredApps[appName]);
                }
            },
            /*
             * Control slim toggle
             */
            toggleSlim: function () {
                _slim = !_slim;

                $rootScope.$broadcast('navigation::slim__changed', _slim);
            },
            isSlim: function () {
                return _slim;
            },
            /*
             * Setting navigation sidebar footer
             */
            footerText: function (text) {
                if (text !== undefined) {
                    _footerText = text;

                    $rootScope.$broadcast('navigation::footerText', _footerText);
                }

                return _footerText;
            },

            /*
             * Buttons
             */
            leftButtons: function (/**Array=*/buttons) {
                _setButtons('left', buttons);

                return _buttons.left;
            },
            rightButtons: function (/**Array=*/buttons) {
                _setButtons('right', buttons);

                return _buttons.right;
            }
        }
    }];
});

var cordovaHelperApp = angular.module('ag.mobile-sdk.helper', ['ag.sdk.utilities', 'ag.mobile-sdk.cordova.geolocation', 'ag.mobile-sdk.cordova.camera']);

cordovaHelperApp.factory('geolocationHelper', ['promiseService', 'geolocationService', function(promiseService, geolocationService) {
    function GeolocationHelper(req) {
        if (!(this instanceof GeolocationHelper)) {
            return new GeolocationHelper(req);
        }

        this._options = req.options || {};
        this._onGet = req.onGet || angular.noop;
        this._onWatch = req.onWatch || angular.noop;
        this._onError = req.onError || angular.noop;

        this._watcher = null;
    }

    function _convertToGeoJson (data) {
        return {
            type: 'Feature',
            geometry: {
                coordinates: [data.coords.longitude, data.coords.latitude],
                type: 'Point'
            },
            properties: {
                accuracy: data.coords.accuracy,
                altitude: data.coords.altitude
            }
        };
    }

    GeolocationHelper.prototype = {
        busy: false,
        getPosition: function (options) {
            var _this = this;
            _this.busy = true;

            options = options || _this._options;

            geolocationService.getPosition(options).then(function (data) {
                _this.busy = false;
                _this._onGet(_convertToGeoJson(data), data);
            }, function (err) {
                _this.busy = false;
                _this._onError(err);
            });
        },
        watchPosition: function (options) {
            var _this = this;

            options = options || _this._options;

            _this._watcher = geolocationService.watchPosition(options, function (data, err) {
                if (data) {
                    _this._onWatch(_convertToGeoJson(data), data);
                } else {
                    _this._onError(err);
                }
            });
        },
        cancelWatch: function () {
            if (this._watcher) {
                this._watcher.cancel();
                this._watcher = null;
            }
        }
    };

    return function (req) {
        return new GeolocationHelper(req);
    }
}]);

cordovaHelperApp.factory('cameraHelper', ['promiseService', 'geolocationService', 'cameraService', function(promiseService, geolocationService, cameraService) {
    var _defaults = {
        geolocation: {
            timeout: 20000
        },
        camera: {
            quality: 50,
            targetWidth: 1280,
            targetHeight: 720,
            correctOrientation: true,
            encodingType: cameraService.getEncodingTypes.JPEG,
            destinationType: cameraService.getDestinationTypes.FILE_URI
        }
    };

    var _mimeTypes = {
        0: 'image/jpeg',
        1: 'image/png'
    };

    return {
        capturePhotoWithLocation: function (geolocationOptions, cameraOptions) {
            geolocationOptions = geolocationOptions || _defaults.geolocation;
            cameraOptions = cameraOptions || _defaults.camera;

            return promiseService.wrap(function(promise) {
                promiseService
                    .all({
                        geolocation: geolocationService.getPosition(geolocationOptions),
                        camera: cameraService.capture(cameraOptions)
                    }).then(function (result) {
                        promise.resolve({
                            geolocation: {
                                type: 'Feature',
                                geometry: {
                                    coordinates: [result.geolocation.coords.longitude, result.geolocation.coords.latitude],
                                    type: 'Point'
                                },
                                properties: {
                                    accuracy: result.geolocation.coords.accuracy,
                                    altitude: result.geolocation.coords.altitude
                                }
                            },
                            camera: {
                                src: result.camera,
                                type: _mimeTypes[cameraOptions.encodingType]
                            }
                        });
                    }, promise.reject);
            })
        }
    }
}]);
var sdkTestDataApp = angular.module('ag.sdk.test.data', ['ag.sdk.utilities', 'ag.sdk.id']);

sdkTestDataApp.provider('mockDataService', [function () {
    var _mockData = {};
    var _config = {
        localStore: true
    };

    this.config = function (options) {
        _config = _.defaults(options, _config);
    };

    this.$get = ['localStore', 'objectId', 'promiseService', function (localStore, objectId, promiseService) {
        if (_config.localStore) {
            _mockData = localStore.getItem('mockdata') || {};
        }

        return {
            setItem: function (type, data) {
                if (data instanceof Array) {
                    _mockData[type] = {};

                    angular.forEach(data, function (item) {
                        item.id = item.id || objectId().toString();

                        _mockData[type][item.id] = item;
                    });
                } else {
                    data.id = data.id || ObjectId().toString();

                    _mockData[type] = _mockData[type] || {};
                    _mockData[type][data.id] = data;
                }

                if (_config.localStore) {
                    localStore.setItem('mockdata', _mockData);
                }
            },
            getItem: function (type, id) {
                return promiseService.wrap(function (promise) {
                    _mockData[type] = _mockData[type] || {};

                    if (id === undefined) {
                        promise.resolve(_.toArray(_mockData[type] || {}));
                    } else {
                        if (_mockData[type][id]) {
                            promise.resolve(_mockData[type][id]);
                        } else {
                            promise.reject();
                        }
                    }
                });
            }
        }
    }];
}]);

var cordovaCameraApp = angular.module('ag.mobile-sdk.cordova.camera', ['ag.sdk.utilities']);

/**
 * @name cordovaCameraApp.cameraService
 * @requires promiseService
 * @description Creates a AngularJS service to provide camera data
 * @example

 cameraService.capture(50).then(function (res) {
            $log.debug('Photo taken');
        }, function (err) {
            $log.debug(err);
        });

 */
cordovaCameraApp.factory('cameraService', ['promiseService', function (promiseService) {
    if (typeof window.Camera === 'undefined') {
        window.Camera = {};
    }

    var _pictureSourceTypes = Camera.PictureSourceType;
    var _destinationTypes = Camera.DestinationType;
    var _encodingTypes = Camera.EncodingType;

    function _makeRequest(options) {
        var defer = promiseService.defer();

        if (navigator.camera !== undefined) {
            navigator.camera.getPicture(function (data) {
                defer.resolve(data);
            }, function (err) {
                defer.reject(err);
            }, options);
        } else {
            defer.reject({code: 'NoCamera', message: 'No camera available'});
        }

        return defer.promise;
    };

    return {
        getDestinationTypes: _destinationTypes,
        getEncodingTypes: _encodingTypes,
        getPictureSourceTypes: _pictureSourceTypes,

        /**
         * @name cameraService.capture
         * @description Capture data from the camera and edit the result
         * @param {Object} options Optional settings:
         *  - quality {number}
         *  - destinationType {DestinationType}
         *  - encodingType {EncodingType}
         *  - targetWidth {number}
         *  - targetHeight {number}
         *  - saveToPhotoAlbum {boolean}
         * @returns {Promise} Promise of a data string containing data dependant on the DestinationType
         */
        capture: function (options) {
            if (typeof options !== 'object') options = {};

            return _makeRequest(_.defaults(options, {
                quality: 50,
                destinationType: _destinationTypes.DATA_URL,
                source: _pictureSourceTypes.CAMERA
            }));
        },
        /**
         * @name cameraService.captureAndEdit
         * @description Capture data from the camera
         * @param {Object} options Optional settings:
         *  - quality {number}
         *  - destinationType {DestinationType}
         *  - encodingType {EncodingType}
         *  - targetWidth {number}
         *  - targetHeight {number}
         *  - saveToPhotoAlbum {boolean}
         * @returns {Promise} Promise of a data string containing data dependant on the DestinationType
         */
        captureAndEdit: function (options) {
            if (typeof options !== 'object') options = {};

            return _makeRequest(_.defaults(options, {
                quality: 50,
                allowEdit: true,
                destinationType: _destinationTypes.DATA_URL,
                source: _pictureSourceTypes.CAMERA
            }));
        },
        /**
         * @name cameraService.retrieve
         * @description Retrieve image data from the photo library
         * @param {Object} options Optional settings:
         *  - quality {number}
         *  - destinationType {DestinationType}
         *  - encodingType {EncodingType}
         *  - targetWidth {number}
         *  - targetHeight {number}
         *  - saveToPhotoAlbum {boolean}
         * @returns {Promise} Promise of a data string containing data dependant on the DestinationType
         */
        retrieve: function (options) {
            if (typeof options !== 'object') options = {};

            return _makeRequest(_.defaults(options, {
                quality: 50,
                destinationType: _destinationTypes.FILE_URI,
                source: _pictureSourceTypes.PHOTOLIBRARY
            }));
        }
    };
}]);

var cordovaConnectionApp = angular.module('ag.mobile-sdk.cordova.connection', []);

cordovaConnectionApp.factory('connectionService', ['$timeout', function ($timeout) {
    var _onConnectionChangeList = [];
    var _lastConnectionType = undefined;

    var _updateConnection = function () {
        if (_lastConnectionType !== navigator.connection.type) {
            _lastConnectionType = navigator.connection.type;

            for (var i = _onConnectionChangeList.length - 1; i >= 0; i--) {
                if (_onConnectionChangeList[i] !== undefined) {
                    _onConnectionChangeList[i](_lastConnectionType);
                } else {
                    _onConnectionChangeList.splice(i, 1);
                }
            }
        }

        $timeout(_updateConnection, 10000);
    };

    _updateConnection();

    return {
        onConnectionChange: function (onChangeCb) {
            if (typeof onChangeCb === 'function') {
                _onConnectionChangeList.push(onChangeCb);
            }
        },
        isOnline: function () {
            return (navigator.connection.type !== Connection.NONE);
        },
        isMobile: function () {
            return (navigator.connection.type === Connection.CELL ||
                navigator.connection.type === Connection.CELL_2G ||
                navigator.connection.type === Connection.CELL_3G ||
                navigator.connection.type === Connection.CELL_4G);
        }
    };
}]);

var cordovaGeolocationApp = angular.module('ag.mobile-sdk.cordova.geolocation', ['ag.sdk.utilities']);

/**
 * @name cordovaGeolocationApp.geolocationService
 * @requires promiseService
 * @description Creates a AngularJS service to provide geolocation data
 * @example

 function onLocation(res) {
            $log.debug('Success: geolocationService.watchPosition');
            $log.debug(res);
        }

 function onError(err) {
            $log.debug('Error: geolocationService.watchPosition');
            $log.debug(err);
        }

 var watch = geolocationService.watchPosition(onLocation, onError);

 ...

 watch.cancel();

 */
cordovaGeolocationApp.factory('geolocationService', ['promiseService', function (promiseService) {
    var _geolocation = navigator.geolocation;
    var _defaultOptions = {enableHighAccuracy: true};
    var _errors = {
        PermissionDenied: {err: 'PermissionDenied', msg: 'Not authorizated to request position'},
        PositionUnavailable: {err: 'PositionUnavailable', msg: 'Unable to receive position'},
        Timeout: {err: 'Timeout', msg: 'Unable to receive position within timeout'},
        Unknown: {err: 'Unknown', msg: 'An unknown error occured'}
    };

    function _resolveError(code, msg) {
        switch (code) {
            case PositionError.PERMISSION_DENIED:
                return _errors.PermissionDenied;
            case PositionError.POSITION_UNAVAILABLE:
                return _errors.PositionUnavailable;
            case PositionError.TIMEOUT:
                return _errors.Timeout;
            default:
                return {err: 'Unknown', msg: msg};
        }
    }

    return {
        /**
         * @name geolocationService.getPosition
         * @description Request a single position from the geolocation service
         * @param {Object} options Provide geolocation options with the following properties:
         *  - maximumAge {number}
         *  - timeout {number}
         *  - enableHighAccuracy {boolean}
         * @returns {Promise} Promise of a location Object with the following properties:
         *  - coords {Coordinates} (latitude, longitude, altitude, accuracy, altitudeAccuracy, heading, speed)
         *  - timestamp {Date}
         */
        getPosition: function (options) {
            if (typeof options !== 'object') options = {};

            options = _.defaults(options, _defaultOptions);

            var defer = promiseService.defer();

            _geolocation.getCurrentPosition(function (res) {
                defer.resolve(res);
            }, function (err) {
                defer.reject(_resolveError(err.code, err.msg));
            }, options);

            return defer.promise;
        },
        /**
         * @name geolocationService.watchPosition
         * @description Request ongoing position updates from the geolocation service
         * @param {Object} options Provide geolocation options with the following properties:
         *  - maximumAge {number}
         *  - timeout {number}
         *  - enableHighAccuracy {boolean}
         * @param {function(response, error)} callback A handler for geolocation data
         * @returns {Watcher} Provides a Watcher to enable cancelling and restarting of the watched position
         */
        watchPosition: function (options, callback) {
            if (typeof options === 'function') {
                callback = options;
                options = {};
            }
            if (typeof options !== 'object') options = {};

            options = _.defaults(options, _defaultOptions);

            function Watcher() {
                var id = undefined;

                this.start = function () {
                    if (id === undefined) {
                        id = _geolocation.watchPosition(function (res) {
                            callback(res);
                        }, function (err) {
                            callback(null, _resolveError(err.code, err.msg));
                        }, options);
                    }
                };

                this.cancel = function () {
                    if (id !== undefined) {
                        _geolocation.clearWatch(id);
                        id = undefined;
                    }
                };

                this.start();
            };

            return new Watcher();
        }
    };
}]);

var cordovaStorageApp = angular.module('ag.mobile-sdk.cordova.storage', ['ag.sdk.utilities']);

/**
 * @name cordovaStorageApp.fileStorageService
 * @requires promiseService
 * @description File Storage Service
 * @return {object} Angular Service
 **/
cordovaStorageApp.factory('fileStorageService', ['$log', 'promiseService', function ($log, promiseService) {
    var _fileSystem = undefined;
    var _errors = {
        noFileSystem: {err: 'NoFileSystem', msg: 'Could not initialize file system'},
        directoryNotFound: {err: 'directoryNotFound', msg: 'Could not find requested directory'},
        fileNotFound: {err: 'FileNotFound', msg: 'Could not find requested file'},
        fileNotReadable: {err: 'FileNotReadable', msg: 'Could not read from file'},
        fileNotWritable: {err: 'FileNotWritable', msg: 'Could not write to file'}
    };

    /**
     * Initializes the local File System
     * @param {function} onSuccessCb Successful operation callback
     * @param {function} onErrorCb Error in operation callback
     **/
    var _initFileSystem = function (onSuccessCb, onErrorCb) {
        if (_fileSystem === undefined) {
            window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fs) {
                _fileSystem = fs;
                onSuccessCb();
            }, onErrorCb);
        } else {
            onSuccessCb();
        }
        ;
    };

    /**
     * Initialize File System and get a file
     * @param {string} fileURI The file to request
     * @param {object} options file options: {create: boolean, exclusive: boolean}
     * @return {object} Promise for deferred result
     **/
    var _getFileEntry = function (fileURI, options) {
        var defer = promiseService.defer();

        var _resolve = function (fileEntry) {
            defer.resolve(fileEntry);
        };

        var _reject = function () {
            defer.reject(_errors.fileNotFound);
        };

        // Initialize the file system
        _initFileSystem(function () {
            // Request the file entry
            if (fileURI.indexOf('file://') === 0) {
                window.resolveLocalFileSystemURI(fileURI, _resolve, _reject);
            } else {
                _fileSystem.root.getFile(fileURI, options, _resolve, _reject);
            }
        }, function () {
            defer.reject(_errors.noFileSystem);
        });

        return defer.promise;
    };

    $log.debug('Initialized storageService');

    return {
        /**
         * Check if a file exists
         * @param {string} fileURI The file to check
         * @return {object} Promise for deferred result
         **/
        exists: function (fileURI) {
            var defer = promiseService.defer();

            // Initialize & request the file entry
            _getFileEntry(fileURI, {create: false}).then(function (fileEntry) {
                defer.resolve({
                    exists: true,
                    file: fileEntry.name
                });
            }, function (res) {
                defer.reject(res);
            });

            return defer.promise;
        },
        /**
         * Read a file
         * @param {string} fileURI The file to read
         * @return {object} Promise for deferred result
         **/
        read: function (fileURI, asDataUrl) {
            var defer = promiseService.defer();

            // Initialize & request the file entry
            _getFileEntry(fileURI, {create: false}).then(function (fileEntry) {
                // Request the file
                fileEntry.file(function (file) {
                    // Read the file
                    var _fileReader = new FileReader();
                    _fileReader.onloadend = function () {
                        defer.resolve({
                            read: true,
                            file: fileEntry.name,
                            content: _fileReader.result
                        });
                    };
                    _fileReader.onerror = function () {
                        defer.reject(_errors.fileNotReadable);
                    };

                    if (asDataUrl === true) {
                        _fileReader.readAsDataURL(file);
                    } else {
                        _fileReader.readAsText(file);
                    }
                }, function () {
                    defer.reject(_errors.fileNotFound);
                });
            }, function (res) {
                defer.reject(res);
            });

            return defer.promise;
        },
        copy: function (fileURI, directory) {
            var defer = promiseService.defer();

            // Initialize & request the file entry
            _getFileEntry(fileURI, {create: false}).then(function (fileEntry) {

                _fileSystem.root.getDirectory(directory, {create: true, exclusive: false}, function (directoryEntry) {
                    fileEntry.copyTo(directoryEntry, fileEntry.name, function (newFileEntry) {
                        defer.resolve({
                            copy: true,
                            file: newFileEntry.name,
                            path: newFileEntry.fullPath
                        });
                    }, function () {
                        defer.reject(_errors.fileNotFound);
                    });
                }, function () {
                    defer.reject(_errors.directoryNotFound);
                });
            }, function (res) {
                defer.reject(res);
            });

            return defer.promise;
        },
        move: function (fileURI, directory) {
            var defer = promiseService.defer();

            // Initialize & request the file entry
            _getFileEntry(fileURI, {create: false}).then(function (fileEntry) {

                _fileSystem.root.getDirectory(directory, {create: true, exclusive: false}, function (directoryEntry) {
                    fileEntry.moveTo(directoryEntry, fileEntry.name, function (newFileEntry) {
                        defer.resolve({
                            move: true,
                            file: newFileEntry.name,
                            path: newFileEntry.fullPath
                        });
                    }, function () {
                        defer.reject(_errors.fileNotFound);
                    });
                }, function () {
                    defer.reject(_errors.directoryNotFound);
                });
            }, function (res) {
                defer.reject(res);
            });

            return defer.promise;
        },

        /**
         * Write a file
         * @param {string} fileURI The file to write
         * @param {string} content The content to write to file
         * @return {object} Promise for deferred result
         **/
        write: function (fileURI, content) {
            var defer = promiseService.defer();

            // Initialize & request the file entry
            _getFileEntry(fileURI, {create: true}).then(function (fileEntry) {
                // Request the file
                fileEntry.createWriter(function (fileWriter) {
                    // Write the file
                    fileWriter.onwriteend = function () {
                        defer.resolve({
                            write: true,
                            file: fileEntry.name
                        });
                    };
                    fileWriter.onerror = function () {
                        defer.reject(_errors.fileNotWritable);
                    };

                    fileWriter.write(content);
                }, function () {
                    defer.reject(_errors.fileNotFound);
                });
            }, function (res) {
                defer.reject(res);
            });

            return defer.promise;
        },
        /**
         * Remove a file
         * @param {string} fileURI The file to remove
         * @return {object} Promise for deferred result
         **/
        remove: function (fileURI) {
            var defer = promiseService.defer();

            // Initialize & request the file entry
            _getFileEntry(fileURI, {create: false}).then(function (fileEntry) {
                fileEntry.remove(function () {
                    defer.resolve({
                        remove: true,
                        file: fileEntry.name
                    });
                }, function () {
                    defer.reject(_errors.fileNotFound);
                });
            }, function (res) {
                defer.reject(res);
            });

            return defer.promise;
        }
    };
}]);

var mobileSdkApiApp = angular.module('ag.mobile-sdk.api', ['ag.sdk.utilities', 'ag.sdk.monitor', 'ag.mobile-sdk.data', 'ag.mobile-sdk.cordova.storage']);

var _errors = {
    TypeParamRequired: {code: 'TypeParamRequired', message: 'Type parameter is required'},
    UploadPhotoError: {code: 'UploadPhotoError', message: 'Error occured uploading photo'}
};


/*
 * Syncronization
 */
mobileSdkApiApp.factory('dataUploadService', ['promiseMonitor', 'promiseService', 'farmerApi', 'farmApi', 'assetApi', 'documentApi', 'taskApi', 'attachmentApi', 'enterpriseBudgetApi',
    function (promiseMonitor, promiseService, farmerApi, farmApi, assetApi, documentApi, taskApi, attachmentApi, enterpriseBudgetApi) {
        var _monitor = null;

        function _getFarmers () {
            return _monitor.add(promiseService.wrap(function (defer) {
                farmerApi.getFarmers().then(function (farmers) {
                    promiseService
                        .arrayWrap(function (list) {
                            angular.forEach(farmers, function (farmer) {
                                list.push(promiseService.wrap(function(promise) {
                                    _postFarmer(farmer).then(function () {
                                        promiseService
                                            .all([_postFarms(farmer.id), _postAssets(farmer.id)])
                                            .then(promise.resolve, promise.reject);
                                    });
                                }));
                            });
                        })
                        .then(defer.resolve, defer.reject);
                });
            }));
        }

        function _getDocuments () {
            return _monitor.add(promiseService.wrap(function (defer) {
                documentApi.getDocuments().then(function (documents) {
                    promiseService
                        .arrayWrap(function (list) {
                            angular.forEach(documents, function (document) {
                                list.push(_postDocument(document));
                            });
                        })
                        .then(defer.resolve, defer.reject);
                });
            }));
        }

        function _getTasks () {
            return _monitor.add(promiseService.wrap(function (defer) {
                taskApi.getTasks().then(function (tasks) {
                    promiseService
                        .arrayWrap(function (list) {
                            angular.forEach(tasks, function (task) {
                                list.push(promiseService.wrap(function(promise) {
                                    taskApi.getTasks({template: 'task/:id/tasks', schema: {id: task.id}}).then(function (subtasks) {
                                        promiseService
                                            .arrayWrap(function (promises) {
                                                angular.forEach(subtasks, function (subtask) {
                                                    promises.push(_postTask(subtask));
                                                });
                                            })
                                            .then(function () {
                                                return _postTask(task);
                                            }, promise.reject)
                                            .then(promise.resolve, promise.reject);
                                    }, promise.reject);
                                }));
                            });
                        })
                        .then(defer.resolve, defer.reject);
                });
            }));
        }

        function _getEnterpriseBudgets () {
            return _monitor.add(promiseService.wrap(function (defer) {
                enterpriseBudgetApi.getEnterpriseBudgets().then(function (budgets) {
                    promiseService
                        .arrayWrap(function (list) {
                            angular.forEach(budgets, function (budget) {
                                list.push(_postEnterpriseBudget(budget));
                            });
                        })
                        .then(defer.resolve, defer.reject);
                });
            }));
        }

        function _postFarmer (farmer) {
            return _monitor.add(promiseService.wrap(function (defer) {
                if (farmer.__dirty === true) {
                    farmerApi.postFarmer({data: farmer}).then(defer.resolve, defer.reject);
                } else {
                    defer.resolve();
                }
            }));
        }

        function _postFarms (fid) {
            return _monitor.add(promiseService.wrap(function (defer) {
                farmApi.getFarms({id: fid}).then(function (farms) {
                    promiseService
                        .arrayWrap(function (list) {
                            angular.forEach(farms, function (farm) {
                                if (farm.__dirty === true) {
                                    list.push(farmApi.postFarm({data: farm}));
                                }

                            });
                        })
                        .then(defer.resolve, defer.reject);
                });
            }));
        }

        function _postAssets (fid) {
            return _monitor.add(promiseService.wrap(function (defer) {
                assetApi.getAssets({id: fid}).then(function (assets) {
                    promiseService
                        .arrayWrap(function (list) {
                            angular.forEach(assets, function (asset) {
                                list.push(_postAsset(asset));
                            });
                        })
                        .then(defer.resolve, defer.reject);
                });
            }));
        }

        function _postAsset (asset) {
            return _monitor.add(promiseService.wrap(function (defer) {
                if (asset.__dirty === true) {
                    assetApi.postAsset({data: asset})
                        .then(function (res) {
                            if (res && res.length == 1) {
                                _postAttachments('asset', asset.id, res[0].id).then(defer.resolve, defer.reject);
                            } else {
                                defer.resolve();
                            }
                        }, defer.reject);
                } else {
                    defer.resolve();
                }
            }));
        }

        function _postDocument (document) {
            return _monitor.add(promiseService.wrap(function (defer) {
                if (document.__dirty === true) {
                    documentApi.postDocument({data: document})
                        .then(function (res) {
                            if (res && res.length == 1) {
                                _postAttachments('document', document.id, res[0].id).then(defer.resolve, defer.reject);
                            } else {
                                defer.resolve();
                            }
                        }, defer.reject)
                } else {
                    defer.resolve();
                }
            }));
        }

        function _postAttachments (type, oldId, newId) {
            return _monitor.add(promiseService.wrap(function (defer) {
                attachmentApi.getAttachments({template: type + '/:id/attachments', schema: {id: oldId}}).then(function (attachments) {
                    promiseService
                        .arrayWrap(function (list) {
                            angular.forEach(attachments, function (attachment) {
                                if (attachment.__dirty === true) {
                                    attachment.uri = type + '/' + newId + '/attachments';

                                    list.push(attachmentApi.postAttachment({template: type + '/:id/attach', schema: {id: newId}, data: attachment}));
                                }
                            });
                        })
                        .then(defer.resolve, defer.reject);
                });
            }));
        }

        function _postTask (task) {
            return _monitor.add(promiseService.wrap(function (defer) {
                if (task.__dirty === true) {
                    taskApi.postTask({template: 'task/:id', schema: {id: task.id}, data: task}).then(defer.resolve, defer.reject);
                } else {
                    defer.resolve();
                }
            }));
        }

        function _postEnterpriseBudget (budget) {
            return _monitor.add(promiseService.wrap(function (defer) {
                if (budget.__dirty === true) {
                    enterpriseBudgetApi.postEnterpriseBudget({data: budget}).then(defer.resolve, defer.reject);
                } else {
                    defer.resolve();
                }
            }));
        }

        return function (monitor) {
            _monitor = monitor || promiseMonitor();

            return promiseService.wrap(function(promise) {
                _getFarmers()
                    .then(_getDocuments)
                    .then(_getTasks)
                    .then(_getEnterpriseBudgets)
                    .then(promise.resolve, promise.reject);
            });
        }
    }]);

mobileSdkApiApp.factory('dataDownloadService', ['promiseMonitor', 'promiseService', 'farmApi', 'assetUtility', 'farmerUtility', 'documentUtility', 'taskUtility', 'enterpriseBudgetApi',
    function (promiseMonitor, promiseService, farmApi, assetUtility, farmerUtility, documentUtility, taskUtility, enterpriseBudgetApi) {
        var _monitor = null;
        var _readOptions = {readLocal: false, readRemote: true};

        function _getFarmers() {
            return _monitor.add(promiseService.wrap(function (defer) {
                farmerUtility.api
                    .getFarmers({options: _readOptions})
                    .then(function (farmers) {
                        return promiseService.arrayWrap(function (list) {
                            angular.forEach(farmers, function (farmer) {
                                list.push(farmerUtility.hydration.dehydrate(farmer), _getAssets(farmer.id));
                            });
                        });
                    }, defer.reject)
                    .then(defer.resolve, defer.reject);
            }));
        }

        function _getAssets(fid) {
            return _monitor.add(promiseService.wrap(function (defer) {
                assetUtility.api.getAssets({id: fid, options: _readOptions})
                    .then(function (assets) {
                        return promiseService.arrayWrap(function (list) {
                            angular.forEach(assets, function (asset) {
                                list.push(assetUtility.hydration.dehydrate(asset));
                            });
                        });
                    }, defer.reject)
                    .then(defer.resolve, defer.reject);
            }));
        }

        function _getFarms(fid) {
            return _monitor.add(farmApi.getFarms({id: fid, options: _readOptions}));
        }

        function _getDocuments() {
            return _monitor.add(promiseService.wrap(function (defer) {
                documentUtility.api
                    .getDocuments({options: _readOptions})
                    .then(function (documents) {
                        return promiseService.arrayWrap(function (promises) {
                            angular.forEach(documents, function (document) {
                                promises.push(documentUtility.hydration.dehydrate(document));
                            })
                        });
                    }, defer.reject)
                    .then(defer.resolve, defer.reject);
            }));
        }

        function _getDocument(did, options) {
            options = options || _readOptions;

            return _monitor.add(documentUtility.api.getDocument({id: did, options: options}));
        }

        function _getTasks() {
            return _monitor.add(promiseService.wrap(function (defer) {
                taskUtility.api
                    .getTasks({options: _readOptions})
                    .then(function (tasks) {
                        return promiseService.arrayWrap(function (promises) {
                            angular.forEach(tasks, function (task) {
                                promises.push(_getDocument(task.documentId, {readLocal: true, fallbackRemote: true}));
                                promises.push(taskUtility.hydration.dehydrate(task));
                            })
                        });
                    }, defer.reject)
                    .then(defer.resolve, defer.reject);
            }));
        }

        function _getEnterpriseBudgets() {
            return _monitor.add(enterpriseBudgetApi.getEnterpriseBudgets({options: _readOptions}));
        }

        return function (monitor) {
            _monitor = monitor || promiseMonitor();

            return promiseService.wrap(function(promise) {
                _getFarmers()
                    .then(_getDocuments)
                    .then(_getTasks)
                    .then(_getEnterpriseBudgets)
                    .then(promise.resolve, promise.reject);
            });
        };
    }]);

mobileSdkApiApp.factory('dataSyncService', ['promiseMonitor', 'promiseService', 'dataUploadService', 'dataDownloadService', function (promiseMonitor, promiseService, dataUploadService, dataDownloadService) {
    var _monitor = null;

    return function (callback) {
        _monitor = promiseMonitor(callback);

        _monitor.add(promiseService.wrap(function (promise) {
            dataUploadService(_monitor).then(function () {
                dataDownloadService(_monitor).then(promise.resolve, promise.reject);
            }, promise.reject);
        }));
    };
}]);


/*
 * API
 */
mobileSdkApiApp.factory('api', ['promiseService', 'dataStore', function (promiseService, dataStore) {
    return function (naming) {
        if (typeof naming === 'String') {
            naming = {
                singular: naming,
                plural: naming + 's'
            }
        } else if (naming.plural === undefined) {
            naming.plural = naming.singular + 's'
        }
        
        var _itemStore = dataStore(naming.singular, {apiTemplate: naming.singular + '/:id'});

        return {
            /**
             * @name getItems
             * @param req {Object}
             * @param req.template {String} Optional uri template
             * @param req.schema {Object} Optional schema for template
             * @param req.search {String} Optional
             * @param req.id {Number} Optional
             * @param req.options {Object} Optional
             * @returns {Promise}
             */
            getItems: function (req) {
                req = req || {};

                return promiseService.wrap(function (promise) {
                    _itemStore.transaction(function (tx) {
                        if (req.template) {
                            tx.getItems({template: req.template, schema: req.schema, options: req.options, callback: promise});
                        } else if (req.search) {
                            req.options.readLocal = false;
                            req.options.readRemote = true;

                            tx.getItems({template: naming.plural + '?search=:query', schema: {query: req.search}, options: req.options, callback: promise});
                        } else if (req.id) {
                            tx.getItems({template: naming.plural + '/:id', schema: {id: req.id}, options: req.options, callback: promise});
                        } else {
                            tx.getItems({template: naming.plural, options: req.options, callback: promise});
                        }
                    });
                });
            },
            /**
             * @name createItem
             * @param req {Object}
             * @param req.template {String} Optional uri template
             * @param req.schema {Object} Optional schema for template
             * @param req.data {Object} Required document data
             * @param req.options {Object} Optional
             * @returns {Promise}
             */
            createItem: function (req) {
                req = req || {};

                return promiseService.wrap(function (promise) {
                    if (req.data) {
                        _itemStore.transaction(function (tx) {
                            tx.createItems({template: req.template, schema: req.schema, data: req.data, options: req.options, callback: promise});
                        });
                    } else {
                        promise.resolve();
                    }
                });
            },
            /**
             * @name getItem
             * @param req {Object}
             * @param req.id {Number} Required
             * @param req.template {String} Optional uri template
             * @param req.options {Object} Optional
             * @returns {Promise}
             */
            getItem: function (req) {
                req = req || {};

                return promiseService.wrap(function (promise) {
                    if (req.id) {
                        _itemStore.transaction(function (tx) {
                            tx.getItems({template: req.template, schema: {id: req.id}, options: req.options, callback: promise});
                        });
                    } else {
                        promise.resolve();
                    }
                });
            },
            /**
             * @name findItem
             * @param req {Object}
             * @param req.key {String} Required
             * @param req.column {String} Optional
             * @param req.options {Object} Optional
             * @param req.options.like {boolean} Optional to use a fuzzy search
             * @param req.options.one {boolean} Optional to return one result
             * @returns {Promise}
             */
            findItem: function (req) {
                req = req || {};

                return promiseService.wrap(function (promise) {
                    if (req.key) {
                        _itemStore.transaction(function (tx) {
                            tx.findItems({key: req.key, column: req.column, options: req.options, callback: promise});
                        });
                    } else {
                        promise.resolve();
                    }
                });
            },
            /**
             * @name updateItem
             * @param req {Object}
             * @param req.data {Object} Required
             * @param req.options {Object} Optional
             * @returns {Promise}
             */
            updateItem: function (req) {
                req = req || {};

                return promiseService.wrap(function (promise) {
                    if (req.data) {
                        _itemStore.transaction(function (tx) {
                            tx.updateItems({data: req.data, options: req.options, callback: promise});
                        });
                    } else {
                        promise.resolve();
                    }
                });
            },
            /**
             * @name postItem
             * @param req {Object}
             * @param req.template {String} Optional write uri template
             * @param req.schema {Object} Optional schema for template
             * @param req.data {Object} Required
             * @returns {Promise}
             */
            postItem: function (req) {
                req = req || {};

                return promiseService.wrap(function (promise) {
                    if (req.data) {
                        _itemStore.transaction(function (tx) {
                            tx.postItems({template: req.template, schema: req.schema, data: req.data, callback: promise});
                        });
                    } else {
                        promise.resolve();
                    }
                });
            },
            /**
             * @name deleteItem
             * @param req {Object}
             * @param req.data {Object} Required
             * @returns {Promise}
             */
            deleteItem: function (req) {
                req = req || {};

                return promiseService.wrap(function (promise) {
                    if (req.data) {
                        _itemStore.transaction(function (tx) {
                            tx.removeItems({template: naming.singular + '/:id/delete', data: req.data, callback: promise});
                        });
                    } else {
                        promise.resolve();
                    }
                });
            },
            /**
             * @name purgeItem
             * @param req {Object}
             * @param req.template {String} Required template
             * @param req.schema {Object} Optional schema
             * @returns {Promise}
             */
            purgeItem: function (req) {
                req = req || {};

                return promiseService.wrap(function (promise) {
                    if (req.template) {
                        _itemStore.transaction(function (tx) {
                            tx.purgeItems({template: req.template, schema: req.schema, callback: promise});
                        });
                    } else {
                        promise.resolve();
                    }
                });
            }
        };
    }
}]);

mobileSdkApiApp.factory('userApi', ['api', function (api) {
    var userApi = api({plural: 'users', singular: 'user'});

    return {
        getUsers: userApi.getItems,
        createUser: userApi.createItem,
        getUser: userApi.getItem,
        findUser: userApi.findItem,
        updateUser: userApi.updateItem,
        postUser: userApi.postItem,
        deleteUser: userApi.deleteItem
    };
}]);

mobileSdkApiApp.factory('teamApi', ['api', function (api) {
    var teamApi = api({plural: 'teams', singular: 'team'});

    return {
        getTeams: teamApi.getItems,
        createTeam: teamApi.createItem,
        getTeam: teamApi.getItem,
        findTeam: teamApi.findItem,
        updateTeam: teamApi.updateItem,
        postTeam: teamApi.postItem,
        deleteTeam: teamApi.deleteItem
    };
}]);

mobileSdkApiApp.factory('notificationApi', ['api', function (api) {
    var notificationApi = api({plural: 'notifications', singular: 'notification'});

    return {
        getNotifications: notificationApi.getItems,
        getNotification: notificationApi.getItem,
        deleteNotification: notificationApi.deleteItem
    };
}]);

mobileSdkApiApp.factory('taskApi', ['api', function (api) {
    var taskApi = api({plural: 'tasks', singular: 'task'});

    return {
        getTasks: taskApi.getItems,
        createTask: taskApi.createItem,
        getTask: taskApi.getItem,
        findTask: taskApi.findItem,
        updateTask: taskApi.updateItem,
        postTask: taskApi.postItem,
        deleteTask: taskApi.deleteItem,
        purgeTask: taskApi.purgeItem
    };
}]);

mobileSdkApiApp.factory('merchantApi', ['api', function (api) {
    var merchantApi = api({plural: 'merchants', singular: 'merchant'});

    return {
        getMerchants: merchantApi.getItems,
        createMerchant: merchantApi.createItem,
        getMerchant: merchantApi.getItem,
        updateMerchant: merchantApi.updateItem,
        postMerchant: merchantApi.postItem,
        deleteMerchant: merchantApi.deleteItem
    };
}]);

mobileSdkApiApp.factory('farmerApi', ['api', function (api) {
    var farmerApi = api({plural: 'farmers', singular: 'farmer'});

    return {
        getFarmers: farmerApi.getItems,
        createFarmer: farmerApi.createItem,
        getFarmer: farmerApi.getItem,
        findFarmer: farmerApi.findItem,
        updateFarmer: farmerApi.updateItem,
        postFarmer: farmerApi.postItem,
        deleteFarmer: farmerApi.deleteItem,
        purgeFarmer: farmerApi.purgeItem
    };
}]);

mobileSdkApiApp.factory('legalEntityApi', ['api', function (api) {
    var entityApi = api({plural: 'legalentities', singular: 'legalentity'});

    return {
        getEntities: entityApi.getItems,
        createEntity: entityApi.createItem,
        getEntity: entityApi.getItem,
        findEntity: entityApi.findItem,
        updateEntity: entityApi.updateItem,
        postEntity: entityApi.postItem,
        deleteEntity: entityApi.deleteItem,
        purgeEntity: entityApi.purgeItem
    };
}]);

mobileSdkApiApp.factory('farmApi', ['api', function (api) {
    var farmApi = api({plural: 'farms', singular: 'farm'});

    return {
        getFarms: farmApi.getItems,
        createFarm: farmApi.createItem,
        getFarm: farmApi.getItem,
        findFarm: farmApi.findItem,
        updateFarm: farmApi.updateItem,
        postFarm: farmApi.postItem,
        deleteFarm: farmApi.deleteItem,
        purgeFarm: farmApi.purgeItem
    };
}]);

mobileSdkApiApp.factory('assetApi', ['api', function (api) {
    var assetApi = api({plural: 'assets', singular: 'asset'});

    return {
        getAssets: assetApi.getItems,
        createAsset: assetApi.createItem,
        getAsset: assetApi.getItem,
        findAsset: assetApi.findItem,
        updateAsset: assetApi.updateItem,
        postAsset: assetApi.postItem,
        deleteAsset: assetApi.deleteItem,
        purgeAsset: assetApi.purgeItem
    };
}]);

mobileSdkApiApp.factory('documentApi', ['api', function (api) {
    var documentStore = api({plural: 'documents', singular: 'document'});

    return {
        getDocuments: documentStore.getItems,
        createDocument: documentStore.createItem,
        getDocument: documentStore.getItem,
        findDocument: documentStore.findItem,
        updateDocument: documentStore.updateItem,
        postDocument: documentStore.postItem,
        deleteDocument: documentStore.deleteItem,
        purgeDocument: documentStore.purgeItem
    };
}]);

mobileSdkApiApp.factory('attachmentApi', ['$http', '$log', 'api', 'configuration', 'dataStoreUtilities', 'promiseService', 'fileStorageService', function ($http, $log, api, configuration, dataStoreUtilities, promiseService, fileStorageService) {
    var attachmentStore = api({plural: 'attachments', singular: 'attachment'});

    return {
        getAttachments: attachmentStore.getItems,
        createAttachment: attachmentStore.createItem,
        getAttachment: attachmentStore.getItem,
        findAttachment: attachmentStore.findItem,
        updateAttachment: attachmentStore.updateItem,
        postAttachment: function (req) {
            req = req || {};

            return promiseService.wrap(function (promise) {
                if (req.data) {
                    var attachment = req.data;
                    var uri = 'api/' + (req.template !== undefined ? dataStoreUtilities.parseRequest(req.template, req.schema) : attachment.uri);

                    fileStorageService.read(attachment.src, true)
                        .then(function (fileData) {
                            // Set content
                            var upload = {
                                archive: dataStoreUtilities.extractMetadata(attachment).data
                            };

                            upload.archive.content = fileData.content.substring(fileData.content.indexOf(',') + 1);

                            return $http.post(configuration.getServer() + uri, upload, {withCredentials: true});
                        }, promise.reject)
                        .then(function () {
                            $log.debug('update attachment');
                            attachment.__local = false;

                            attachmentStore.updateItem({data: attachment, options: {dirty: false}}).then(promise.resolve, promise.reject);
                        }, promise.reject);
                } else {
                    promise.reject();
                }
            });
        },
        deleteAttachment: function (req) {
            req = req || {
                data: {}
            };
            req.data.__local = true;

            return attachmentStore.deleteItem(req);
        },
        purgeAttachment: attachmentStore.purgeItem
    };
}]);

mobileSdkApiApp.factory('activityApi', ['api', function (api) {
    var activityApi = api({plural: 'activities', singular: 'activity'});

    return {
        getActivities: activityApi.getItems,
        createActivity: activityApi.createItem,
        getActivity: activityApi.getItem,
        deleteActivity: activityApi.deleteItem
    };
}]);

mobileSdkApiApp.factory('enterpriseBudgetApi', ['api', function (api) {
    var farmApi = api({plural: 'budgets', singular: 'budget'});

    return {
        getEnterpriseBudgets: farmApi.getItems,
        createEnterpriseBudget: farmApi.createItem,
        getEnterpriseBudget: farmApi.getItem,
        findEnterpriseBudget: farmApi.findItem,
        updateEnterpriseBudget: farmApi.updateItem,
        postEnterpriseBudget: farmApi.postItem,
        deleteEnterpriseBudget: farmApi.deleteItem,
        purgeEnterpriseBudget: farmApi.purgeItem
    };
}]);

/*
 * Handlers
 */
mobileSdkApiApp.factory('hydration', ['promiseService', 'taskApi', 'farmerApi', 'farmApi', 'assetApi', 'documentApi', 'attachmentApi', 'legalEntityApi',
    function (promiseService, taskApi, farmerApi, farmApi, assetApi, documentApi, attachmentApi, legalEntityApi) {
        // TODO: Allow for tree of hydrations/dehydrations (e.g. Farmer -> LegalEntities -> Assets)

        var _relationTable = {
            organization: {
                hydrate: function (obj, type) {
                    return promiseService.wrap(function (promise) {
                        farmerApi.findFarmer({key: obj.organizationId, options: {one: true}}).then(function (farmer) {
                            promiseService.all({
                                farms: _relationTable.farms.hydrate(farmer, type),
                                legalEntities: _relationTable.legalEntities.hydrate(farmer, type),
                                assets: _relationTable.assets.hydrate(farmer, type)
                            }).then(function (results) {
                                promise.resolve(_.extend(farmer, results));
                            }, promise.reject);
                        }, promise.reject);
                    });
                },
                dehydrate: function (obj, type) {
                    return farmerApi.createFarmer({data: obj.organization, options: {replace: false, dirty: false}});
                }
            },
            farms: {
                hydrate: function (obj, type) {
                    return farmApi.getFarms({id: obj.__id});
                },
                dehydrate: function (obj, type) {
                    return promiseService.wrap(function (promise) {
                        farmApi.purgeFarm({template: 'farms/:id', schema: {id: obj.__id}, options: {force: false}})
                            .then(function () {
                                promiseService.arrayWrap(function (promises) {
                                    angular.forEach(obj.farms, function (farm) {
                                        promises.push(farmApi.createFarm({template: 'farms/:id', schema: {id: obj.__id}, data: farm, options: {replace: false, dirty: false}}));
                                    });
                                }).then(promise.resolve, promise.reject);
                            }, promise.reject);
                    });
                }
            },
            farm: {
                hydrate: function (obj, type) {
                    return farmApi.findFarm({key: obj.farmId, options: {one: true}});
                }
            },
            assets: {
                hydrate: function (obj, type) {
                    return assetApi.getAssets({id: obj.__id});
                },
                dehydrate: function (obj, type) {
                    return promiseService.wrap(function (promise) {
                        assetApi.purgeAsset({template: 'assets/:id', schema: {id: obj.__id}, options: {force: false}})
                            .then(function () {
                                promiseService.arrayWrap(function (promises) {
                                    angular.forEach(obj.assets, function (asset) {
                                        promises.push(assetApi.createAsset({template: 'assets/:id', schema: {id: obj.__id}, data: asset, options: {replace: false, dirty: false}}));
                                    });
                                }).then(promise.resolve, promise.reject);
                            }, promise.reject);
                    });
                }
            },
            legalEntities: {
                hydrate: function (obj, type) {
                    return legalEntityApi.getEntities({id: obj.__id});
                },
                dehydrate: function (obj, type) {
                    return promiseService.wrap(function (promise) {
                        legalEntityApi.purgeEntity({template: 'legalentities/:id', schema: {id: obj.__id}, options: {force: false}})
                            .then(function () {
                                promiseService.arrayWrap(function (promises) {
                                    angular.forEach(obj.legalEntities, function (entity) {
                                        delete entity.assets;

                                        promises.push(legalEntityApi.createEntity({template: 'legalentities/:id', schema: {id: obj.__id}, data: entity, options: {replace: false, dirty: false}}));
                                    });
                                }).then(promise.resolve, promise.reject);
                            }, promise.reject);
                    });
                }
            },
            legalEntity: {
                hydrate: function (obj, type) {
                    return legalEntityApi.findEntity({key: obj.legalEntityId, options: {one: true}});
                }
            },
            document: {
                hydrate: function (obj, type) {
                    return documentApi.findDocument({key: obj.documentId, options: {one: true}});
                },
                dehydrate: function (obj, type) {
                    return documentApi.createDocument({data: obj.document, options: {replace: false, dirty: false}});
                }
            },
            attachments: {
                hydrate: function (obj, type) {
                    return attachmentApi.getAttachments({template: type + '/:id/attachments', schema: {id: obj.__id}});
                },
                dehydrate: function (obj, type) {
                    return promiseService.wrap(function (promise) {
                        attachmentApi.purgeAttachment({template: type + '/:id/attachments', schema: {id: obj.__id}, options: {force: false}})
                            .then(function () {
                                promiseService.arrayWrap(function (promises) {
                                    if (obj.data && obj.data.attachments) {
                                        angular.forEach(obj.data.attachments, function (attachment) {
                                            promises.push(attachmentApi.createAttachment({template: type + '/:id/attachments', schema: {id: obj.__id}, data: attachment, options: {replace: false, dirty: false}}));
                                        });
                                    } else {
                                        promise.resolve();
                                    }
                                }).then(promise.resolve, promise.reject);
                            }, promise.reject);
                    });
                }
            },
            subtasks: {
                hydrate: function (obj, type) {
                    return taskApi.getTasks({template: 'task/:id/tasks', schema: {id: obj.__id}});
                },
                dehydrate: function (obj, type) {
                    return promiseService.wrap(function (promise) {
                        taskApi.purgeTask({template: 'task/:id/tasks', schema: {id: obj.__id}, options: {force: false}})
                            .then(function () {
                                promiseService.arrayWrap(function (promises) {
                                    angular.forEach(obj.subtasks, function (subtask) {
                                        promises.push(taskApi.createTask({template: 'task/:id/tasks', schema: {id: obj.__id}, data: subtask, options: {replace: false, dirty: false}}));
                                    });
                                }).then(promise.resolve, promise.reject);
                            }, promise.reject);
                    });
                }
            }
        };

        var _hydrate = function (obj, type, relations) {
            relations = relations || [];

            return promiseService.wrap(function (promise) {
                promiseService
                    .objectWrap(function (promises) {
                        angular.forEach(relations, function (relationName) {
                            var relation = _relationTable[relationName];

                            if (relation && relation.hydrate) {
                                promises[relationName] = relation.hydrate(obj, type);
                            }
                        });
                    })
                    .then(function (results) {
                        promise.resolve(_.extend(obj, results));
                    }, function (results) {
                        promise.resolve(_.extend(obj, results));
                    });
            });
        };

        var _dehydrate = function (obj, type, relations) {
            relations = relations || [];

            return promiseService.wrap(function (promise) {
                promiseService
                    .objectWrap(function (promises) {
                        angular.forEach(relations, function (relationName) {
                            var relation = _relationTable[relationName];

                            if (relation && relation.dehydrate) {
                                promises[relationName] = relation.dehydrate(obj, type);
                            }
                        });
                    })
                    .then(function () {
                        angular.forEach(relations, function (relationName) {
                            delete obj[relationName];
                        });

                        promise.resolve(obj);
                    }, function () {
                        promise.reject();
                    });
            });
        };

        return {
            hydrate: _hydrate,
            dehydrate: _dehydrate
        }
    }]);

mobileSdkApiApp.factory('taskUtility', ['promiseService', 'hydration', 'taskApi', function (promiseService, hydration, taskApi) {
    var _relations = ['organization', 'document', 'subtasks'];

    return {
        hydration: {
            hydrate: function (taskOrId, relations) {
                relations = relations || _relations;

                return promiseService.wrap(function (promise) {
                    if (typeof taskOrId !== 'object') {
                        taskApi.findTask({key: taskOrId, options: {one: true}}).then(function (task) {
                            hydration.hydrate(task, 'task', relations).then(promise.resolve, promise.reject);
                        }, promise.reject);
                    } else {
                        hydration.hydrate(taskOrId, 'task', relations).then(promise.resolve, promise.reject);
                    }
                });
            },
            dehydrate: function (task, relations) {
                relations = relations || _relations;

                return hydration.dehydrate(task, 'task', relations).then(function (task) {
                    taskApi.updateTask({data: task, options: {dirty: false}});
                })
            }
        },
        api: taskApi
    };
}]);

mobileSdkApiApp.factory('farmerUtility', ['promiseService', 'hydration', 'farmerApi', function (promiseService, hydration, farmerApi) {
    var _relations = ['farms', 'legalEntities', 'assets'];

    return {
        hydration: {
            hydrate: function (farmerOrId, relations) {
                relations = relations || _relations;

                return promiseService.wrap(function (promise) {
                    if (typeof farmerOrId !== 'object') {
                        farmerApi.findFarmer({key: farmerOrId, options: {one: true}}).then(function (farmer) {
                            hydration.hydrate(farmer, 'farmer', relations).then(promise.resolve, promise.reject);
                        }, promise.reject);
                    } else {
                        hydration.hydrate(farmerOrId, 'farmer', relations).then(promise.resolve, promise.reject);
                    }
                });
            },
            dehydrate: function (farmer, relations) {
                relations = relations || _relations;

                angular.forEach(farmer.teams, function (team, i) {
                    if (typeof team === 'object') {
                        farmer.teams[i] = team.name;
                    }
                });

                return hydration.dehydrate(farmer, 'farmer', relations).then(function (farmer) {
                    farmerApi.updateFarmer({data: farmer, options: {dirty: false}});
                })
            }
        },
        api: farmerApi
    };
}]);

mobileSdkApiApp.factory('assetUtility', ['promiseService', 'hydration', 'assetApi', function (promiseService, hydration, assetApi) {
    var _relations = ['attachments', 'farm', 'legalEntity'];

    return {
        hydration: {
            hydrate: function (assetOrId, relations) {
                relations = relations || _relations;

                return promiseService.wrap(function (promise) {
                    if (typeof assetOrId !== 'object') {
                        assetApi.findAsset({key: assetOrId, options: {one: true}}).then(function (asset) {
                            hydration.hydrate(asset, 'asset', relations).then(function (asset) {
                                if (asset.attachments) {
                                    asset.data.attachments = asset.attachments;
                                    delete asset.attachments;
                                }
                                promise.resolve(asset);
                            }, promise.reject);
                        }, promise.reject);
                    } else {
                        hydration.hydrate(assetOrId, 'asset', relations).then(function (asset) {
                            if (asset.attachments) {
                                asset.data.attachments = asset.attachments;
                                delete asset.attachments;
                            }
                            promise.resolve(asset);
                        }, promise.reject);
                    }
                });
            },
            dehydrate: function (asset, relations) {
                relations = relations || _relations;

                return hydration.dehydrate(asset, 'asset', relations).then(function (asset) {
                    delete asset.data.attachments;

                    assetApi.updateAsset({data: asset, options: {dirty: false}});
                })
            }
        },
        api: assetApi
    };
}]);

mobileSdkApiApp.factory('documentUtility', ['promiseService', 'hydration', 'documentApi', function (promiseService, hydration, documentApi) {
    var _relations = ['organization', 'attachments'];

    return {
        hydration: {
            hydrate: function (documentOrId, relations) {
                relations = relations || _relations;

                return promiseService.wrap(function (promise) {
                    if (typeof documentOrId !== 'object') {
                        documentApi.findDocument({key: documentOrId, options: {one: true}}).then(function (document) {
                            hydration.hydrate(document, 'document', relations).then(function (document) {
                                if (document.attachments) {
                                    document.data.attachments = document.attachments;
                                    delete document.attachments;
                                }
                                promise.resolve(document);
                            }, promise.reject);
                        }, promise.reject);
                    } else {
                        hydration.hydrate(documentOrId, 'document', relations).then(function (document) {
                            if (document.attachments) {
                                document.data.attachments = document.attachments;
                                delete document.attachments;
                            }
                            promise.resolve(document);
                        }, promise.reject);
                    }
                });
            },
            dehydrate: function (document, relations) {
                relations = relations || _relations;

                return hydration.dehydrate(document, 'document', relations).then(function (document) {
                    delete document.tasks;
                    delete document.data.attachments;

                    documentApi.updateDocument({data: document, options: {dirty: false}});
                })
            }
        },
        api: documentApi
    };
}]);

var mobileSdkDataApp = angular.module('ag.mobile-sdk.data', ['ag.sdk.utilities', 'ag.sdk.config', 'ag.sdk.monitor']);

/**
 * @name dataPurgeService
 */
mobileSdkDataApp.provider('dataPurge', function () {
    this.$get = ['promiseService', 'dataStore', function (promiseService, dataStore) {
        function _purgeDataStore(name) {
            return promiseService.wrap(function (promise) {
                var store = dataStore(name);

                store.transaction(function (tx) {
                    tx.purgeItems({callback: promise});
                })
            });
        }

        return function purge(dataStoreList) {
            return promiseService.wrapAll(function(promises) {
                for (var i = 0; i < dataStoreList.length; i++) {
                    promises.push(_purgeDataStore(dataStoreList[i]));
                }
            });
        }
    }];
});

mobileSdkDataApp.factory('dataStoreUtilities', ['$log', function ($log) {
    return {
        parseRequest: function (templateUrl, schemaData) {
            $log.debug('Unresolved: ' + templateUrl);

            if (templateUrl !== undefined) {
                for (var key in schemaData) {
                    if (schemaData.hasOwnProperty(key)) {
                        var schemaKey = (schemaData[key] !== undefined ? schemaData[key] : '');

                        templateUrl = templateUrl.replace(':' + key, schemaKey);
                    }
                }
            }

            $log.debug('Resolved: ' + templateUrl);

            return templateUrl;
        },
        generateItemIndex: function () {
            return 2000000000 + Math.round(Math.random() * 147483647);
        },
        injectMetadata: function (item) {
            return _.extend((typeof item.data == 'object' ? item.data : JSON.parse(item.data)), {
                __id: item.id,
                __uri: item.uri,
                __dirty: (item.dirty == 1),
                __local: (item.local == 1)
            });
        },
        extractMetadata: function (item) {
            return {
                id: item.__id,
                uri: item.__uri,
                dirty: item.__dirty,
                local: item.__local,
                data: _.omit(item, ['__id', '__uri', '__dirty', '__local'])
            };
        }
    }
}]);

/**
 * @name dataStore
 */
mobileSdkDataApp.provider('dataStore', [function () {
    var _defaultOptions = {
        pageLimit: 10,
        dbName: undefined,
        readLocal: true,
        readRemote: true
    };

    var _errors = {
        NoStoreParams: {code: 'NoStoreParams', message: 'No DataStore parameters defined'},
        NoConfigDBNameParams: {code: 'NoConfigDBNameParams', message: 'No Config database name defined'},
        NoConfigAPIParams: {code: 'NoConfigAPIParams', message: 'No Config API parameters defined'},
        NoConfigPagingParams: {code: 'NoConfigPagingParams', message: 'No Config Paging parameters defined'},
        NoReadParams: {code: 'NoReadParams', message: 'No DataRead parameters defined'},
        NoPagingDefined: {code: 'NoPagingDefined', message: 'No Paging parameters have been defined in config'},
        LocalDataStoreError: {code: 'LocalDataStoreError', message: 'Can not perform action on local data store'},
        RemoteDataStoreError: {code: 'RemoteDataStoreError', message: 'Can not perform action on remote data store'},
        RemoteNoDataError: {code: 'RemoteNoDataError', message: 'No data response from remote store'}
    };

    var _localDatabase;

    /**
     * @name dataStoreProvider.config
     * @description dataStoreProvider provider
     * @param url
     * @param options
     */
    this.config = function (options) {
        _defaultOptions = _.defaults((options || {}), _defaultOptions);
    };

    /**
     * dataStore service
     * @type {Array}
     */
    this.$get = ['$http', '$log', '$q', '$rootScope', 'safeApply', 'configuration', 'dataStoreUtilities', function ($http, $log, $q, $rootScope, safeApply, configuration, dataStoreUtilities) {
        var _hostApi = configuration.getServer() + 'api/';

        /**
         * @name _initializeDatabase
         * @param name
         * @returns {Database}
         * @private
         */
        function _initializeDatabase(idCallback) {
            var migrationSteps = [];

            function _processMigration(db) {
                $log.debug('_processMigration');

                if (migrationSteps.length > 0) {
                    var migration = migrationSteps[0];
                    migrationSteps.splice(0, 1);

                    if (migration.current === db.version) {
                        $log.debug('Database (' + db.version + ') has a newer version ' + migration.next);

                        db.changeVersion(migration.current, migration.next, migration.process, _errorCallback, function () {
                            $log.debug('Database version migrated from ' + migration.current + ' to ' + migration.next);
                            _processMigration(db);
                        });
                    } else {
                        _processMigration(db);
                    }
                } else {
                    idCallback(db);
                }
            };

            _processMigration(window.openDatabase(_defaultOptions.dbName, '', _defaultOptions.dbName, 4 * 1048576));
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

            if (_defaultOptions.dbName === undefined) {
                throw new Error(_errors.NoConfigDBNameParams.msg);
            }

            /**
             * Private variables
             * @private

             config = {
                    api: undefined,
                    paging: {
                        template: urlTemplate,
                        schema: schemaTemplate,
                        data: {
                            page: 1,
                            limit: pageLimit
                        }
                    },
                    readLocal: true,
                    readRemote: true
                }
             */
            var _config = _.defaults((config || {}), {
                apiTemplate: undefined,
                paging: undefined,
                indexerProperty: 'id',

                readLocal: _defaultOptions.readLocal,
                readRemote: _defaultOptions.readRemote
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
                    tx.executeSql('CREATE TABLE IF NOT EXISTS ' + name + ' (id INT UNIQUE, uri TEXT, dirty INT DEFAULT 0, local INT DEFAULT 0, data TEXT, updated TIMESTAMP DEFAULT current_timestamp)', [], asyncMon.done, _errorCallback);
                    tx.executeSql('CREATE TRIGGER IF NOT EXISTS ' + name + '_timestamp AFTER UPDATE ON ' + name + ' BEGIN UPDATE ' + name + '  SET updated = datetime(\'now\') WHERE id = old.id AND uri = old.uri; END', [], asyncMon.done, _errorCallback);
                });
            }

            function _countTableRows(cdrCallback) {
                _localDatabase.transaction(function (tx) {
                    tx.executeSql('SELECT COUNT(*) from ' + name, [], function (tx, res) {
                        cdrCallback(res.rows.length == 1 ? res.rows.item(0) : 0);
                    }, _errorCallback);
                });
            }

            function _clearTable(ctCallback) {
                _localDatabase.transaction(function (tx) {
                    tx.executeSql('DELETE FROM ' + name, [], function () {
                        ctCallback(true);
                    }, function () {
                        ctCallback(false);
                    });
                });
            }


            /*
             * Utility functions
             */

            function _traceCallback() {
                $log.warn('_traceCallback');
                $log.warn('Arguments: [' + Array.prototype.join.call(arguments, ', ') + ']');
            }

            function _dataCallback(tx, res) {
                $log.debug('SQL complete: ' + res.rowsAffected);
            }

            function _errorCallback(tx, err) {
                if (typeof err === 'undefined') {
                    err = tx;
                    tx = undefined;
                }

                if (typeof err === 'string') {
                    $log.warn('Error: ' + err);
                } else if (err.message !== undefined) {
                    $log.warn('Error: ' + err.message + '(' + err.code + ')');
                } else {
                    $log.warn(err);
                }
            }

            function _getItemIndex(item, id) {
                if (item[_config.indexerProperty] === undefined) {
                    $log.warn('Configured indexer property not defined');
                }

                return (item[_config.indexerProperty] || item.id || id);
            }

            /*
             * Local data storage
             */

            var _getLocal = function (uri, options, glCallback) {
                $log.debug('_getLocal');
                if (typeof glCallback !== 'function') glCallback = angular.noop;

                _localDatabase.transaction(function (tx) {
                    tx.executeSql('SELECT * FROM ' + name + ' WHERE uri = ?', [uri], function (tx, res) {
                        if (res.rows.length > 0) {
                            if (options.one) {
                                glCallback(dataStoreUtilities.injectMetadata(res.rows.item(0)));
                            } else {
                                var dataItems = [];

                                for (var i = 0; i < res.rows.length; i++) {
                                    dataItems.push(dataStoreUtilities.injectMetadata(res.rows.item(i)));
                                }

                                glCallback(dataItems);
                            }
                        } else {
                            glCallback(options.one ? undefined : []);
                        }
                    }, function (tx, err) {
                        _errorCallback(tx, err);
                        glCallback(null, _errors.LocalDataStoreError);
                    });
                });
            };

            var _findLocal = function (key, column, options, flCallback) {
                $log.debug('_findLocal');

                if (typeof flCallback !== 'function') flCallback = angular.noop;

                _localDatabase.transaction(function (tx) {
                    tx.executeSql('SELECT * FROM ' + name + ' WHERE ' + column + ' ' + (options.like ? 'LIKE' : '=') + ' ?', [(options.like ? "%" + key + "%" : key)], function (tx, res) {
                        if (res.rows.length > 0) {
                            if (options.one) {
                                flCallback(dataStoreUtilities.injectMetadata(res.rows.item(0)));
                            } else {
                                var dataItems = [];

                                for (var i = 0; i < res.rows.length; i++) {
                                    dataItems.push(dataStoreUtilities.injectMetadata(res.rows.item(i)));
                                }

                                flCallback(dataItems);
                            }
                        } else {
                            flCallback(options.one ? undefined : []);
                        }
                    }, function (tx, err) {
                        flCallback(null, err);
                    });
                });
            };

            var _syncLocal = function (dataItems, uri, slCallback) {
                $log.debug('_syncLocal');
                if (typeof slCallback !== 'function') slCallback = angular.noop;

                _deleteAllLocal(uri, function () {
                    _updateLocal(dataItems, function () {
                        _getLocal(uri, {}, slCallback);
                    });
                });
            };

            var _updateLocal = function (dataItems, options, ulCallback) {
                $log.debug('_updateLocal');
                if (typeof options === 'function') {
                    ulCallback = options;
                    options = {};
                }

                if (typeof ulCallback !== 'function') ulCallback = angular.noop;
                if ((dataItems instanceof Array) === false) dataItems = [dataItems];

                if (dataItems.length > 0) {
                    options = _.defaults(options || {}, {
                        replace: true,
                        force: false
                    });

                    var asyncMon = new AsyncMonitor(dataItems.length, function () {
                        ulCallback(dataItems);
                    });

                    _localDatabase.transaction(function (tx) {
                        for (var i = 0; i < dataItems.length; i++) {
                            var item = dataStoreUtilities.extractMetadata(dataItems[i]);
                            var dataString = JSON.stringify(item.data);

                            tx.executeSql('INSERT INTO ' + name + ' (id, uri, data, dirty, local) VALUES (?, ?, ?, ?, ?)', [item.id, item.uri, dataString, (item.dirty ? 1 : 0), (item.local ? 1 : 0)], asyncMon.done, function (tx, err) {
                                // Insert failed
                                if (options.replace === true) {
                                    if (item.dirty === true || item.local === true || options.force) {
                                        tx.executeSql('UPDATE ' + name + ' SET uri = ?, data = ?, dirty = ?, local = ? WHERE id = ?', [item.uri, dataString, (item.dirty ? 1 : 0), (item.local ? 1 : 0), item.id], asyncMon.done, _errorCallback);
                                    } else {
                                        tx.executeSql('UPDATE ' + name + ' SET uri = ?, data = ?, dirty = ?, local = ? WHERE id = ? AND dirty = 0 AND local = 0', [item.uri, dataString, (item.dirty ? 1 : 0), (item.local ? 1 : 0), item.id], asyncMon.done, _errorCallback);
                                    }
                                } else {
                                    asyncMon.done();
                                }
                            });
                        }
                    });
                } else {
                    ulCallback(dataItems);
                }
            };

            var _deleteLocal = function (dataItems, dlCallback) {
                $log.debug('_deleteLocal');
                if ((dataItems instanceof Array) === false) dataItems = [dataItems];

                if (dataItems.length > 0) {
                    var asyncMon = new AsyncMonitor(dataItems.length, dlCallback);

                    _localDatabase.transaction(function (tx) {
                        for (var i = 0; i < dataItems.length; i++) {
                            var item = dataStoreUtilities.extractMetadata(dataItems[i]);

                            tx.executeSql('DELETE FROM ' + name + ' WHERE id = ? AND uri = ?', [item.id, item.uri], asyncMon.done, function (err) {
                                _errorCallback(tx, err);
                                asyncMon.done();
                            });
                        }
                    });
                } else {
                    dlCallback(dataItems);
                }
            };

            var _deleteAllLocal = function (uri, options, dalCallback) {
                $log.debug('_deleteAllLocal');
                if (typeof options === 'function') {
                    dalCallback = options;
                    options = {};
                }

                options = _.defaults((options || {}), {force: false});

                var asyncMon = new AsyncMonitor(1, dalCallback);

                var handleSuccess = function () {
                    $log.debug('handleSuccess');
                    asyncMon.done();
                };

                var handleError = function (tx, err) {
                    $log.debug('handleError');
                    _errorCallback(tx, err);
                    asyncMon.done();
                };

                $log.debug(uri);

                _localDatabase.transaction(function (tx) {
                    $log.debug('_deleteAllLocal transaction');

                    if (options.force === true) {
                        $log.debug('_deleteAllLocal force');
                        tx.executeSql('DELETE FROM ' + name + ' WHERE uri = ?', [uri], handleSuccess, handleError);
                    } else {
                        $log.debug('_deleteAllLocal not force');
                        tx.executeSql('DELETE FROM ' + name + ' WHERE uri = ? AND local = ? AND dirty = ?', [uri, 0, 0], handleSuccess, handleError);
                    }
                });

                $log.debug('_deleteAllLocal end');
            };

            /**
             * Remote data storage
             */

            var _getRemote = function (uri, grCallback) {
                $log.debug('_getRemote');
                if (typeof grCallback !== 'function') grCallback = angular.noop;

                if (_config.apiTemplate !== undefined) {
                    safeApply(function () {
                        $http.get(_hostApi + uri, {withCredentials: true}).then(function (res) {
                            if (res.data != null && res.data !== 'null') {
                                var data = res.data;

                                if ((data instanceof Array) === false) {
                                    grCallback([dataStoreUtilities.injectMetadata({
                                        id: _getItemIndex(data),
                                        uri: uri,
                                        data: data,
                                        dirty: false,
                                        local: false
                                    })]);
                                } else {
                                    var dataItems = [];

                                    for (var i = 0; i < data.length; i++) {
                                        var item = data[i];

                                        dataItems.push(dataStoreUtilities.injectMetadata({
                                            id: _getItemIndex(item),
                                            uri: uri,
                                            data: item,
                                            dirty: false,
                                            local: false
                                        }));
                                    }

                                    grCallback(dataItems);
                                }
                            } else {
                                grCallback(null, _errors.RemoteNoDataError);
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
            var _updateRemote = function (dataItems, writeUri, writeSchema, urCallback) {
                $log.debug('_updateRemote');
                if (typeof writeSchema === 'function') {
                    urCallback = writeSchema;
                    writeSchema = {};
                } else if (typeof writeUri === 'function') {
                    urCallback = writeUri;
                    writeSchema = {};
                    writeUri = undefined;
                }

                if (typeof urCallback !== 'function') urCallback = angular.noop;

                if (dataItems !== undefined && _config.apiTemplate !== undefined) {
                    if ((dataItems instanceof Array) === false) dataItems = [dataItems];

                    var postedDataItems = [];
                    var asyncMon = new AsyncMonitor(dataItems.length, function () {
                        urCallback(postedDataItems);
                    });

                    var _makePost = function (item, uri) {
                        safeApply(function () {
                            $http.post(_hostApi + uri, item.data, {withCredentials: true}).then(function (res) {
                                var remoteItem = dataStoreUtilities.injectMetadata({
                                    id: _getItemIndex(res.data, item.id),
                                    uri: item.uri,
                                    data: item.data,
                                    dirty: false,
                                    local: false
                                });

                                if (item.local == true) {
                                    remoteItem.id = remoteItem.__id;

                                    _deleteLocal(item);
                                }

                                postedDataItems.push(remoteItem);

                                _updateLocal(remoteItem, {force: true}, asyncMon.done);
                            }, function (err) {
                                _errorCallback(err);
                                asyncMon.done();
                            });
                        });
                    };

                    for (var i = 0; i < dataItems.length; i++) {
                        var item = dataStoreUtilities.extractMetadata(dataItems[i]);

                        if (item.dirty === true) {
                            if (item.local || writeUri !== undefined) {
                                if (item.local && item.data[_config.indexerProperty] !== undefined) {
                                    delete item.data[_config.indexerProperty];
                                }

                                _makePost(item, dataStoreUtilities.parseRequest(writeUri || _config.apiTemplate, _.extend(writeSchema, {id: item.local ? undefined : item.id})));
                            } else {
                                _makePost(item, item.uri);
                            }
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
            var _deleteRemote = function (dataItems, writeUri, writeSchema, drCallback) {
                $log.debug('_deleteRemote');
                if (typeof writeSchema === 'function') {
                    drCallback = writeSchema;
                    writeSchema = {};
                } else if (typeof writeUri === 'function') {
                    drCallback = writeUri;
                    writeSchema = {};
                    writeUri = undefined;
                }

                if (typeof drCallback !== 'function') drCallback = angular.noop;

                if (dataItems !== undefined && writeUri !== undefined) {
                    if ((dataItems instanceof Array) === false) dataItems = [dataItems];

                    var asyncMon = new AsyncMonitor(dataItems.length, drCallback);

                    var _makeDelete = function (item, uri) {
                        safeApply(function () {
                            $http.post(_hostApi + uri, {withCredentials: true}).then(function (res) {
                                _deleteLocal(item, asyncMon.done);
                            }, function (err) {
                                _errorCallback(err);
                                asyncMon.done();
                            });
                        });
                    };

                    for (var i = 0; i < dataItems.length; i++) {
                        var item = dataStoreUtilities.extractMetadata(dataItems[i]);

                        if (item.local === false) {
                            _makeDelete(item, dataStoreUtilities.parseRequest(writeUri, _.defaults(writeSchema, {id: item.id})));
                        } else {
                            asyncMon.done();
                        }
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
                            callback.apply(this, arguments);
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
            };

            var _responseHandler = function (handle, res, err) {
                if (handle !== undefined) {
                    if (typeof handle === 'function') {
                        handle(res, err);
                    } else {
                        if (res) {
                            handle.resolve(res);
                        } else {
                            handle.reject(err);
                        }
                    }
                }
            };

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
                    createItems: function (req) {
                        var request = _.defaults(req || {}, {
                            template: _config.apiTemplate,
                            schema: {},
                            data: [],
                            options: {
                                replace: true,
                                force: false,
                                dirty: true
                            },
                            callback: angular.noop
                        });

                        if ((request.data instanceof Array) === false) {
                            request.data = [request.data];
                        }

                        var asyncMon = new AsyncMonitor(request.data.length, function (res, err) {
                            _responseHandler(request.callback, res, err);
                        });

                        angular.forEach(request.data, function (data) {
                            var id = _getItemIndex(data, dataStoreUtilities.generateItemIndex());

                            _updateLocal(dataStoreUtilities.injectMetadata({
                                id: id,
                                uri: dataStoreUtilities.parseRequest(request.template, _.defaults(request.schema, {id: id})),
                                data: data,
                                dirty: request.options.dirty,
                                local: request.options.dirty
                            }), request.options, asyncMon.done);
                        });
                    },
                    getItems: function (req) {
                        var request = _.defaults(req || {}, {
                            template: _config.apiTemplate,
                            schema: {},
                            options: {
                                page: 1,
                                limit: _defaultOptions.pageLimit,
                                readLocal: _config.readLocal,
                                readRemote: _config.readRemote,
                                fallbackRemote: false
                            },
                            callback: angular.noop
                        });

                        var handleRemote = function (_uri) {
                            _getRemote(_uri, function (res, err) {
                                if (res) {
                                    _syncLocal(res, _uri, function (res, err) {
                                        _responseHandler(request.callback, res, err);
                                    });
                                } else {
                                    _getLocal(_uri, request.options, function (res, err) {
                                        _responseHandler(request.callback, res, err);
                                    });
                                }
                            });
                        };

                        if (typeof request.schema === 'object') {
                            var _uri = dataStoreUtilities.parseRequest(request.template, request.schema);

                            // Process request
                            if (request.options.readRemote === true) {
                                handleRemote(_uri);
                            } else if (request.options.readLocal === true) {
                                _getLocal(_uri, request.options, function (res, err) {
                                    if (res.length == 0 && request.options.fallbackRemote === true) {
                                        handleRemote(_uri);
                                    } else {
                                        _responseHandler(request.callback, res, err);
                                    }

                                });
                            }
                        } else {
                            _responseHandler(request.callback, null, _errors.NoReadParams);
                        }
                    },
                    findItems: function (req) {
                        var request = _.defaults(req || {}, {
                            key: '',
                            column: 'id',
                            options: {
                                like: false,
                                one: false
                            },
                            callback: angular.noop
                        });

                        _findLocal(request.key, request.column, request.options, function (res, err) {
                            _responseHandler(request.callback, res, err);
                        });
                    },
                    updateItems: function (req) {
                        var request = _.defaults(req || {}, {
                            data: [],
                            options: {
                                dirty: true
                            },
                            callback: angular.noop
                        });

                        if ((request.data instanceof Array) === false) {
                            request.data = [request.data];
                        }

                        if (request.options.dirty) {
                            angular.forEach(request.data, function (item) {
                                item.__dirty = true;
                            });
                        }

                        _updateLocal(request.data, request.options, function (res, err) {
                            _responseHandler(request.callback, res, err);
                        });
                    },
                    postItems: function (req) {
                        var request = _.defaults(req || {}, {
                            template: _config.apiTemplate,
                            schema: {},
                            data: [],
                            callback: angular.noop
                        });

                        if ((request.data instanceof Array) === false) {
                            request.data = [request.data];
                        }

                        _updateRemote(request.data, request.template, request.schema, function (res, err) {
                            _responseHandler(request.callback, res, err);
                        });
                    },
                    removeItems: function (req) {
                        var request = _.defaults(req || {}, {
                            template: undefined,
                            schema: {},
                            data: [],
                            callback: angular.noop
                        });

                        if ((request.data instanceof Array) === false) {
                            request.data = [request.data];
                        }

                        var asyncMon = new AsyncMonitor(request.data.length, function (res, err) {
                            _responseHandler(request.callback, res, err);
                        });

                        angular.forEach(request.data, function (item) {
                            if (item.__local === true) {
                                _deleteLocal(item, asyncMon.done);
                            } else {
                                _deleteRemote(item, request.template, request.schema, asyncMon.done);
                            }
                        });
                    },
                    purgeItems: function (req) {
                        var request = _.defaults(req || {}, {
                            template: undefined,
                            schema: {},
                            options: {
                                force: true
                            },
                            callback: angular.noop
                        });

                        if (request.template !== undefined) {
                            var _uri = dataStoreUtilities.parseRequest(request.template, request.schema);

                            _getLocal(_uri, request.options, function (res, err) {
                                var deleteItems = [];

                                angular.forEach(res, function (item) {
                                    if (item.__dirty == false || request.options.force == true) {
                                        deleteItems.push(item);
                                    }
                                });

                                _deleteLocal(deleteItems, function (res, err) {
                                    _responseHandler(request.callback, res, err);
                                });
                            });
                        } else {
                            _clearTable(function (res, err) {
                                _responseHandler(request.callback, res, err);
                            });
                        }
                    }
                }
            }

            /**
             * Initialize table
             */

            _initializeTable(function () {
                $log.debug('table initialized');

                _dataStoreInitialized = true;
                _processTransactionQueue();
            })

            /**
             * Public functions
             */
            return {
                defaults: _defaultOptions,
                config: _config,
                transaction: function (tCallback) {
                    if (typeof tCallback === 'function') {
                        _transactionQueue.push(tCallback);

                        _processTransactionQueue();
                    }
                }
            }
        }

        /**
         * Initialize database
         */

        _initializeDatabase(function (db) {
            _localDatabase = db;

            $log.debug('database initialized');
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
}]);

angular.module('ag.sdk.helper', [
    'ag.sdk.helper.asset',
    'ag.sdk.helper.document',
    'ag.sdk.helper.enterprise-budget',
    'ag.sdk.helper.farmer',
    'ag.sdk.helper.favourites',
    'ag.sdk.helper.merchant',
    'ag.sdk.helper.task',
    'ag.sdk.helper.team',
    'ag.sdk.helper.user'
]);

angular.module('ag.sdk.interface', [
    'ag.sdk.interface.list',
    'ag.sdk.interface.map',
    'ag.sdk.interface.navigation'
]);

angular.module('ag.sdk.test', [
    'ag.sdk.test.data'
]);

angular.module('ag.mobile-sdk', [
    'ag.sdk.authorization',
    'ag.sdk.id',
    'ag.sdk.utilities',
    'ag.sdk.monitor',
    'ag.sdk.interface.map',
    'ag.sdk.helper',
    'ag.sdk.test',
    'ag.mobile-sdk.helper',
    'ag.mobile-sdk.api',
    'ag.mobile-sdk.data'
]);
