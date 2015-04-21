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
        updateUser: function (data) {
            return promiseService.wrap(function(promise) {
                $http.post(_host + 'current-user', _.omit(data, 'profilePhotoSrc'), {withCredentials: true}).then(function (res) {
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
                    $rootScope.$broadcast('authorization::unauthorized', err);
                } else if (err.status === 403) {
                    $rootScope.$broadcast('authorization::forbidden', err);
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

            $rootScope.$on('authorization::unauthorized', function () {
                localStore.removeItem('user');
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

                                localStore.removeItem('user');
                                promise.reject();
                            }

                        }, function (err) {
                            localStore.removeItem('user');
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
                    return authorizationApi.updateUser(userDetails).then(function (result) {
                        _user = _setUser(result);

                        $rootScope.$broadcast('authorization::user-details__changed', _user);

                        return result;
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
                                localStore.removeItem('user');
                                promise.reject();
                            }
                        }, function (err) {
                            _lastError = {
                                type: 'error',
                                message: 'There is already an Agrista account associated with this email address. Please login.'
                            };

                            localStore.removeItem('user');
                            promise.reject(err);
                        });
                    });
                },
                logout: function () {
                    $rootScope.$broadcast('authorization::logout');

                    return authorizationApi.logout().then(function () {
                        localStore.removeItem('user');
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

    var _modules = [];
    var _servers = {
        local: '',
        testing: 'https://enterprise-uat.agrista.com/',
        staging: 'https://enterprise-staging.agrista.com/',
        production: 'https://enterprise.agrista.com/'
    };

    var _hasModule = function (name) {
        return (_modules.indexOf(name) !== -1);
    };

    var _addModule = function (name) {
        if (_hasModule(name) == false) {
            _modules.push(name);
        }
    };

    return {
        addModule: _addModule,
        hasModule: _hasModule,

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
                addModule: _addModule,
                hasModule: _hasModule,

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

var sdkLibraryApp = angular.module('ag.sdk.library', []);

/**
 * This module includes other required third party libraries
 */
sdkLibraryApp.constant('underscore', window._);

sdkLibraryApp.constant('moment', window.moment);

sdkLibraryApp.constant('geojsonUtils', window.gju);

var sdkMonitorApp = angular.module('ag.sdk.monitor', ['ag.sdk.utilities']);

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

var skdUtilitiesApp = angular.module('ag.sdk.utilities', ['ngCookies', 'ag.sdk.id']);

skdUtilitiesApp.factory('safeApply', ['$rootScope', function ($rootScope) {
    return function (fn) {
        if ($rootScope.$$phase) {
            fn();
        } else {
            $rootScope.$apply(fn);
        }
    };
}]);

skdUtilitiesApp.directive('stopEvent', function () {
    return {
        restrict: 'A',
        link: function (scope, element, attr) {
            element.bind(attr.stopEvent, function (e) {
                e.stopPropagation();
            });
        }
    };
});

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

skdUtilitiesApp.factory('pagingService', ['$rootScope', '$http', 'promiseService', 'dataMapService', 'generateUUID', function($rootScope, $http, promiseService, dataMapService, generateUUID) {
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
                    var currentListId = _listId;

                    params = params || (_scroll.searching ? _scroll.searching : _scroll.page);

                    _scroll.busy = true;
                    delete params.complete;

                    return requestor(params).then(function(res) {
                        if (params.search === undefined) {
                            _scroll.page.offset = (_scroll.page.offset === undefined ? res.length : _scroll.page.offset + res.length);
                            _scroll.complete = (res.length !== _scroll.page.limit);
                        } else {
                            _scroll.searching = params;
                            _scroll.searching.offset = (_scroll.searching.offset === undefined ? res.length : _scroll.searching.offset + res.length);
                            _scroll.searching.complete = (res.length !== _scroll.searching.limit);
                        }

                        _scroll.busy = false;

                        if (currentListId === _listId) {
                            if (dataMap) {
                                res = dataMapService(res, dataMap);
                            }

                            itemStore(res);
                        }

                        return res;
                    }, promiseService.throwError);
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
                        $http.get(params, {withCredentials: true}).then(_handleResponse, promiseService.throwError);
                    } else {
                        $http.get(endPoint, {params: params, withCredentials: true}).then(_handleResponse, promiseService.throwError);
                    }
                } else {
                    $http.get(endPoint, {withCredentials: true}).then(_handleResponse, promiseService.throwError);
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

var sdkHelperAssetApp = angular.module('ag.sdk.helper.asset', ['ag.sdk.helper.farmer', 'ag.sdk.helper.attachment', 'ag.sdk.library']);

sdkHelperAssetApp.factory('assetHelper', ['$filter', 'attachmentHelper', 'landUseHelper', 'underscore', function($filter, attachmentHelper, landUseHelper, underscore) {
    var _assetTitle = function (asset) {
        if (asset.data) {
            switch (asset.type) {
                case 'crop':
                case 'permanent crop':
                case 'plantation':
                    return (asset.data.plantedArea ? $filter('number')(asset.data.plantedArea, 2) + 'Ha' : '') +
                       (asset.data.plantedArea && asset.data.crop ? ' of ' : '') +
                       (asset.data.crop ? asset.data.crop : '') +
                       (asset.data.fieldName ? ' on field ' + asset.data.fieldName : '');
                case 'farmland':
                    return (asset.data.portionLabel ? asset.data.portionLabel :
                        (asset.data.portionNumber ? 'Portion ' + asset.data.portionNumber : 'Remainder of farm'));
                case 'improvement':
                    return asset.data.name;
                case 'cropland':
                    return (asset.data.equipped ? 'Irrigated ' + asset.type + ' (' + (asset.data.irrigation ? asset.data.irrigation + ' irrigation from ' : '')
                        + asset.data.waterSource + ')' : (asset.data.irrigated ? 'Irrigable, unequipped ' : 'Non irrigable ') + asset.type)
                        + (asset.data.fieldName ? ' on field ' + asset.data.fieldName : '');
                case 'livestock':
                    return asset.data.type + (asset.data.category ? ' - ' + asset.data.category : '');
                case 'pasture':
                    return (asset.data.intensified ? (asset.data.crop || 'Intensified pasture') : 'Natural grazing') +
                        (asset.data.fieldName ? ' on field ' + asset.data.fieldName : '');
                case 'vme':
                    return asset.data.category + (asset.data.model ? ' model ' + asset.data.model : '');
                case 'wasteland':
                    return 'Wasteland';
                case 'water source':
                case 'water right':
                    return asset.data.waterSource + (asset.data.fieldName ? ' on field ' + asset.data.fieldName : '');
            }
        }

        return _assetTypes[type];
    };

    var _listServiceMap = function(item, metadata) {
        var map = {
            id: item.id || item.__id,
            type: item.type,
            updatedAt: item.updatedAt
        };

        if (item.data) {
            if (item.type == 'crop') {
                map.title = _assetTitle(item);
                map.subtitle = (item.data.season ? item.data.season : '');
                map.groupby = item.farmId;
            } else if (item.type == 'farmland') {
                map.title = _assetTitle(item);
                map.subtitle = (item.data.area !== undefined ? 'Area: ' + $filter('number')(item.data.area, 2) + 'Ha' : 'Unknown area');
                map.groupby = item.farmId;
            } else if (item.type == 'improvement') {
                map.title = _assetTitle(item);
                map.subtitle = item.data.type + ' - ' + item.data.category;
                map.summary = (item.data.description || '');
                map.groupby = item.farmId;
            } else if (item.type == 'cropland') {
                map.title = _assetTitle(item);
                map.subtitle = (item.data.size !== undefined ? 'Area: ' + $filter('number')(item.data.size, 2) + 'Ha' : 'Unknown area');
                map.groupby = item.farmId;
            } else if (item.type == 'livestock') {
                map.title = _assetTitle(item);
                map.subtitle = (item.data.breed ? item.data.breed + ' for ' : 'For ') + item.data.purpose;
                map.summary = (item.data.description || '');
                map.groupby = item.data.type;
            } else if (item.type == 'pasture') {
                map.title = _assetTitle(item);
                map.subtitle = (item.data.size !== undefined ? 'Area: ' + $filter('number')(item.data.size, 2) + 'Ha' : 'Unknown area');
                map.groupby = item.farmId;
            } else if (item.type == 'permanent crop') {
                map.title = _assetTitle(item);
                map.subtitle = (item.data.establishedDate ? 'Established: ' + $filter('date')(item.data.establishedDate, 'dd/MM/yy') : '');
                map.groupby = item.farmId;
            } else if (item.type == 'plantation') {
                map.title = _assetTitle(item);
                map.subtitle = (item.data.establishedDate ? 'Established: ' + $filter('date')(item.data.establishedDate, 'dd/MM/yy') : '');
                map.groupby = item.farmId;
            } else if (item.type == 'vme') {
                map.title = _assetTitle(item);
                map.subtitle = 'Quantity: ' + item.data.quantity;
                map.summary = (item.data.description || '');
                map.groupby = item.data.type;
            } else if (item.type == 'wasteland') {
                map.title = _assetTitle(item);
                map.subtitle = (item.data.size !== undefined ? 'Area: ' + $filter('number')(item.data.size, 2) + 'Ha' : 'Unknown area');
                map.groupby = item.farmId;
            } else if (item.type == 'water right') {
                map.title = _assetTitle(item);
                map.subtitle = (item.data.size !== undefined ? 'Irrigatable Extent: ' + $filter('number')(item.data.size, 2) + 'Ha' : 'Unknown area');
                map.groupby = item.farmId;
            }

            map.thumbnailUrl = attachmentHelper.findSize(item, 'thumb', 'img/camera.png');
        }

        if (metadata) {
            map = underscore.extend(map, metadata);
        }

        return map;
    };

    var _assetTypes = {
        'crop': 'Crops',
        'farmland': 'Farmlands',
        'improvement': 'Fixed Improvements',
        'cropland': 'Cropland',
        'livestock': 'Livestock',
        'pasture': 'Pastures',
        'permanent crop': 'Permanent Crops',
        'plantation': 'Plantations',
        'vme': 'Vehicles, Machinery & Equipment',
        'wasteland': 'Wasteland',
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
        'farmland': [],
        'improvement': [],
        'cropland': ['Cropland', 'Irrigated Cropland'],
        'livestock': ['Grazing', 'Planted Pastures', 'Conservation'],
        'pasture': ['Grazing', 'Planted Pastures', 'Conservation'],
        'permanent crop': ['Horticulture (Perennial)'],
        'plantation': ['Plantation'],
        'vme': [],
        'wasteland': ['Grazing', 'Structures (Handling)', 'Structures (Processing)', 'Structures (Storage)', 'Utilities', 'Wasteland'],
        'water right': ['Water Right']
    };

    var _landUseCropTypes = {
        'Cropland': ['Barley', 'Bean', 'Bean (Broad)', 'Bean (Dry)', 'Bean (Sugar)', 'Bean (Green)', 'Bean (Kidney)', 'Canola', 'Cassava', 'Cotton', 'Cowpea', 'Grain Sorghum', 'Groundnut', 'Maize', 'Maize (White)', 'Maize (Yellow)', 'Oats', 'Peanut', 'Pearl Millet', 'Potato', 'Rape', 'Rice', 'Rye', 'Soya Bean', 'Sunflower', 'Sweet Corn', 'Sweet Potato', 'Tobacco', 'Triticale', 'Wheat', 'Wheat (Durum)'],
        'Grazing': ['Bahia-Notatum', 'Bottle Brush', 'Buffalo', 'Buffalo (Blue)', 'Buffalo (White)', 'Bush', 'Cocksfoot', 'Common Setaria', 'Dallis', 'Phalaris', 'Rescue', 'Rhodes', 'Smuts Finger', 'Tall Fescue', 'Teff', 'Veld', 'Weeping Lovegrass'],
        'Horticulture (Perennial)': ['Almond', 'Aloe', 'Apple', 'Apricot', 'Avocado', 'Banana', 'Cherry', 'Coconut', 'Coffee', 'Grape', 'Grape (Bush Vine)', 'Grape (Red)', 'Grape (Table)', 'Grape (White)', 'Grapefruit', 'Guava', 'Hops', 'Kiwi Fruit', 'Lemon', 'Litchi', 'Macadamia Nut', 'Mandarin', 'Mango', 'Nectarine', 'Olive', 'Orange', 'Papaya', 'Peach', 'Pear', 'Pecan Nut', 'Persimmon', 'Pineapple', 'Pistachio Nut', 'Plum', 'Rooibos', 'Sisal', 'Tea', 'Walnut'],
        'Horticulture (Seasonal)': ['Asparagus', 'Beet', 'Beetroot', 'Blackberry', 'Borecole', 'Brinjal', 'Broccoli', 'Brussel Sprout', 'Cabbage', 'Cabbage (Chinese)', 'Cabbage (Savoy)', 'Cactus Pear', 'Carrot', 'Cauliflower', 'Celery', 'Chicory', 'Chili', 'Cucumber', 'Cucurbit', 'Garlic', 'Ginger', 'Granadilla', 'Kale', 'Kohlrabi', 'Leek', 'Lentil', 'Lespedeza', 'Lettuce', 'Makataan', 'Mustard', 'Mustard (White)', 'Onion', 'Paprika', 'Parsley', 'Parsnip', 'Pea', 'Pea (Dry)', 'Pepper', 'Pumpkin', 'Quince', 'Radish', 'Squash', 'Strawberry', 'Swede', 'Sweet Melon', 'Swiss Chard', 'Tomato', 'Turnip', 'Vetch (Common)', 'Vetch (Hairy)', 'Watermelon', 'Youngberry'],
        'Plantation': ['Bluegum', 'Pine', 'Sugarcane', 'Wattle'],
        'Planted Pastures': ['Birdsfoot Trefoil', 'Carribean Stylo', 'Clover', 'Clover (Arrow Leaf)', 'Clover (Crimson)', 'Clover (Persian)', 'Clover (Red)', 'Clover (Rose)', 'Clover (Strawberry)', 'Clover (Subterranean)', 'Clover (White)', 'Kikuyu', 'Lucerne', 'Lupin', 'Lupin (Narrow Leaf)', 'Lupin (White)', 'Lupin (Yellow)', 'Medic', 'Medic (Barrel)', 'Medic (Burr)', 'Medic (Gama)', 'Medic (Snail)', 'Medic (Strand)', 'Ryegrass', 'Ryegrass (Hybrid)', 'Ryegrass (Italian)', 'Ryegrass (Westerwolds)', 'Serradella', 'Serradella (Yellow)', 'Silver Leaf Desmodium']
    };

    var _liabilityFrequencies = {
        'bi-monthly': 'Bi-Monthly',
        'monthly': 'Monthly',
        'quarterly': 'Quarterly',
        'bi-yearly': 'Bi-Yearly',
        'yearly': 'Yearly'
    };

    var _liabilityTypes = {
        'rent': 'Rented',
        'short-loan': 'Short Term Loan',
        'medium-loan': 'Medium Term Loan',
        'long-loan': 'Long Term Loan'
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
        getAssetClass: function (type) {
            return _assetTypes[type];
        },
        getAssetTitle: function (asset) {
            return _assetTitle(asset);
        },
        getAssetLandUse: function (type) {
            return _assetLandUse[type];
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
        getCropsForLandUse: function (landUse) {
            return _landUseCropTypes[landUse] || [];
        },
        getLiabilityFrequencyTitle: function (frequency) {
            return _liabilityFrequencies[frequency] || '';
        },
        getLiabilityTitle: function (type) {
            return _liabilityTypes[type] || '';
        },
        getZoneTitle: function (zone) {
            return $filter('number')(zone.size, 2) + 'Ha at Stage ' + zone.growthStage + ' (' + zone.cultivar + ')';
        },
        conditionTypes: function () {
            return _conditionTypes;
        },
        isFieldApplicable: function (type, field) {
            return (_assetLandUse[type] && _assetLandUse[type].indexOf(field.landUse) !== -1);
        },
        generateAssetKey: function (asset, legalEntity, farm) {
            asset.assetKey = 'entity.' + legalEntity.uuid +
                (asset.type !== 'farmland' && farm ? '-f.' + farm.name : '') +
                (asset.type === 'crop' && asset.data.season ? '-s.' + asset.data.season : '') +
                (asset.data.fieldName ? '-fi.' + asset.data.fieldName : '') +
                (asset.data.crop ? '-c.' + asset.data.crop : '') +
                (asset.type === 'cropland' && asset.data.irrigated ? '-i.' + asset.data.irrigation : '') +
                (asset.type === 'farmland' && asset.data.sgKey ? '-' + asset.data.sgKey : '') +
                (asset.type === 'improvement' || asset.type === 'livestock' || asset.type === 'vme' ?
                    (asset.data.type ? '-t.' + asset.data.type : '') +
                    (asset.data.category ? '-c.' + asset.data.category : '') +
                    (asset.data.name ? '-n.' + asset.data.name : '') +
                    (asset.data.purpose ? '-p.' + asset.data.purpose : '') +
                    (asset.data.model ? '-m.' + asset.data.model : '') +
                    (asset.data.identificationNo ? '-in.' + asset.data.identificationNo : '') : '') +
                (asset.data.waterSource ? '-ws.' + asset.data.waterSource : '');
        },
        cleanAssetData: function (asset) {
            if (asset.type == 'vme') {
                asset.data.quantity = (asset.data.identificationNo && asset.data.identificationNo.length > 0 ? 1 : asset.data.quantity);
                asset.data.identificationNo = (asset.data.quantity != 1 ? '' : asset.data.identificationNo);
            } else if (asset.type == 'cropland') {
                asset.data.equipped = (asset.data.irrigated ? asset.data.equipped : false);
            }

            return asset;
        },
        calculateLiability: function (asset) {
            if (asset.data.financing && (asset.data.financing.financed || asset.data.financing.leased)) {
                asset.data.financing.closingBalance = this.calculateLiabilityForMonth(asset, moment().format('YYYY-MM'))
            }

            return asset;
        },
        calculateLiabilityForMonth: function (asset, month) {
            var freq = {
                Monthly: 12,
                'Bi-Monthly': 24,
                Quarterly: 4,
                'Bi-Yearly': 2,
                Yearly: 1
            };

            var financing = asset.data.financing,
                closingBalance = financing.openingBalance || 0;

            var startMonth = moment(financing.paymentStart),
                endMonth = moment(financing.paymentEnd),
                currentMonth = moment(month);

            var installmentsSince = (financing.leased && currentMonth > endMonth ? endMonth : currentMonth)
                    .diff(startMonth, 'months') * ((freq[financing.paymentFrequency] || 1) / 12);

            if (asset.data.financing.financed) {
                for (var i = 0; i <= installmentsSince; i++) {
                    closingBalance -= Math.min(closingBalance, (financing.installment || 0) - ((((financing.interestRate || 0) / 100) / freq[financing.paymentFrequency]) * closingBalance));
                }
            } else if (startMonth <= currentMonth) {
                closingBalance = Math.ceil(installmentsSince) * (financing.installment || 0);
            }

            return closingBalance;
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
        },
        generateFarmlandAssetLabels: function(asset) {
            if (asset.type == 'farmland') {
                asset.data.portionLabel = (asset.data.portionNumber ?
                    (asset.data.remainder ? 'Rem. portion ' + asset.data.portionNumber : 'Portion ' + asset.data.portionNumber) :
                    'Rem. extent');
                asset.data.farmLabel = (asset.data.officialFarmName && !_(asset.data.officialFarmName.toLowerCase()).startsWith('farm') ?
                    _(asset.data.officialFarmName).titleize() + ' ' : '') + (asset.data.farmNumber ? asset.data.farmNumber : '');
                asset.data.label = asset.data.portionLabel + (asset.data.farmLabel && _.words(asset.data.farmLabel).length > 0 ?
                    " of " + (_.words(asset.data.farmLabel.toLowerCase())[0] == 'farm' ? _(asset.data.farmLabel).titleize() :
                    "farm " + _(asset.data.farmLabel).titleize() ) : 'farm Unknown');
            }
        }
    }
}]);

sdkHelperAssetApp.factory('assetValuationHelper', ['assetHelper', 'underscore', function (assetHelper, underscore) {
    var _listServiceMap = function (item) {
        return {
            title: item.organization.name,
            subtitle: 'Valued at ' + item.currency + ' ' + item.assetValue,
            date: item.date
        };
    };

    return {
        listServiceMap: function () {
            return _listServiceMap;
        },
        calculateAssetValue: function (asset) {
            if (asset.type == 'vme' && isNaN(asset.data.quantity) == false) {
                asset.data.assetValue = asset.data.quantity * (asset.data.unitValue || 0);
            } else if (asset.type == 'livestock' && isNaN(asset.data.totalStock) == false) {
                asset.data.assetValue = asset.data.totalStock * (asset.data.unitValue || 0);
            } else if (asset.type == 'crop' && isNaN(asset.data.expectedYield) == false) {
                asset.data.assetValue = asset.data.expectedYield * (asset.data.unitValue || 0);
            } else if (asset.type == 'improvement') {
                asset.data.valuation = asset.data.valuation || {};
                asset.data.valuation.replacementValue = asset.data.size * ((asset.data.valuation && asset.data.valuation.constructionCost) || 0);
                asset.data.valuation.totalDepreciation = underscore.reduce(['physicalDepreciation', 'functionalDepreciation', 'economicDepreciation', 'purchaserResistance'], function (total, type) {
                    return isNaN(asset.data.valuation[type]) ? total : total * (1 - asset.data.valuation[type]);
                }, 1);

                asset.data.assetValue = Math.round((asset.data.valuation.replacementValue || 0) * Math.min(asset.data.valuation.totalDepreciation, 1));
            } else if (asset.type != 'improvement' && isNaN(asset.data.size) == false) {
                asset.data.assetValue = asset.data.size * (asset.data.unitValue || 0);
            }

            asset.data.assetValue = Math.round(asset.data.assetValue * 100) / 100;
        },
        getApplicableGuidelines: function (guidelines, asset, field) {
            var assetLandUse = assetHelper.getAssetLandUse(asset.type);
            var chain = underscore.chain(guidelines).filter(function(item) {
                return (assetLandUse.indexOf(item.assetClass) !== -1);
            });

            if (asset.type === 'cropland') {
                chain = chain.filter(function (item) {
                    return (field.irrigated ?
                        (asset.data.waterSource ? (item.waterSource && item.waterSource.indexOf(asset.data.waterSource) !== -1) : item.category === 'Potential Irrigable Land') :
                        (item.assetClass === 'Cropland' && (item.soilPotential === undefined || item.soilPotential === field.croppingPotential)));
                });
            } else if (asset.type === 'pasture' || asset.type === 'wasteland') {
                chain = chain.where({assetClass: field.landUse}).filter(function (item) {
                    return ((asset.data.crop === undefined && item.crop === undefined) || (item.crop !== undefined && item.crop.indexOf(asset.data.crop) !== -1)) &&
                        ((field.terrain === undefined && item.terrain === undefined) || item.terrain === field.terrain);
                });
            } else if (asset.type === 'permanent crop') {
                var establishedDate = moment(asset.data.establishedDate);
                var monthsFromEstablished = moment().diff(establishedDate, 'months');

                chain = chain.filter(function (item) {
                    return (item.crop && item.crop.indexOf(asset.data.crop) !== -1) &&
                        (!asset.data.irrigation || item.irrigationType === undefined ||
                            item.irrigationType.indexOf(asset.data.irrigation) !== -1) &&
                        (item.minAge === undefined || monthsFromEstablished >= item.minAge) &&
                        (item.maxAge === undefined || monthsFromEstablished < item.maxAge);
                });
            } else if (asset.type === 'plantation') {
                chain = chain.filter(function (item) {
                    return (item.crop === undefined || item.crop.indexOf(asset.data.crop) !== -1);
                });
            } else if (asset.type === 'water right') {
                chain = chain.filter(function (item) {
                    return (item.waterSource === undefined || item.waterSource.indexOf(asset.data.waterSource) !== -1);
                });
            }

            return chain.value();
        }
    }
}]);

var sdkHelperAttachmentApp = angular.module('ag.sdk.helper.attachment', ['ag.sdk.library']);

sdkHelperAttachmentApp.provider('attachmentHelper', ['underscore', function (underscore) {
    var _options = {
        defaultImage: 'img/camera.png',
        fileResolver: function (uri) {
            return uri;
        }
    };

    this.config = function (options) {
        _options = underscore.defaults(options || {}, _options);
    };

    this.$get = ['$injector', 'promiseService', function ($injector, promiseService) {
        if (_options.fileResolver instanceof Array) {
            _options.fileResolver = $injector.invoke(_options.fileResolver);
        }

        var _getResizedAttachment = function (attachments, size, defaultImage) {
            if ((attachments instanceof Array) == false) {
                attachments = [attachments];
            }

            defaultImage = defaultImage || _options.defaultImage;

            var src = underscore.chain(attachments)
                .filter(function (attachment) {
                    return (attachment.sizes && attachment.sizes[size]);
                }).map(function (attachment) {
                    return attachment.sizes[size].src;
                }).last().value();

            return (src ? _options.fileResolver(src) : defaultImage);
        };

        return {
            findSize: function (obj, size, defaultImage) {
                return _getResizedAttachment((obj.data && obj.data.attachments ? obj.data.attachments : []), size, defaultImage);
            },
            getSize: function (attachments, size, defaultImage) {
                return _getResizedAttachment((attachments ? attachments : []), size, defaultImage);
            },
            getThumbnail: function (attachments, defaultImage) {
                return _getResizedAttachment((attachments ? attachments : []), 'thumb', defaultImage);
            },
            resolveUri: function (uri) {
                return _options.fileResolver(uri);
            }
        };
    }];
}]);

sdkHelperAttachmentApp.factory('resizeImageService', ['promiseService', 'underscore', function (promiseService, underscore) {
    return function (imageOrUri, options) {
        var _processImage = function (image) {
            var canvas = document.createElement('canvas');
            var ctx = canvas.getContext('2d');

            options = underscore.defaults(options || {}, {
                width: 80,
                height: 80,
                center: true,
                crop: true,
                output: 'image/png'
            });

            canvas.width = options.width;
            canvas.height = options.height;

            if (options.crop) {
                var sX = 0, sY = 0;
                var scaleToHeight = (((options.width * image.height) / options.height) > image.width);

                var sW = (scaleToHeight ? Math.floor(image.width) : Math.floor((options.width * image.height) / options.height));
                var sH = (scaleToHeight ? Math.floor((options.height * image.width) / options.width) : Math.floor(image.height));

                if (options.center) {
                    sX = (scaleToHeight ? 0 : Math.floor((sW - options.width) / 2));
                    sY = (scaleToHeight ? Math.floor((sH - options.height) / 2) : 0);
                }

                ctx.drawImage(image, sX, sY, sW, sH, 0, 0, options.width, options.height);
            } else {
                ctx.drawImage(image, 0, 0, options.width, options.height);
            }

            return canvas.toDataURL(options.output, 1);
        };

        return promiseService.wrap(function (promise) {
            if (typeof imageOrUri == 'string') {
                var image = new Image();

                image.onload = function () {
                    promise.resolve(_processImage(image));
                };

                image.src = imageOrUri;
            } else {
                promise.resolve(_processImage(imageOrUri));
            }
        });
    };
}]);
var sdkHelperCropInspectionApp = angular.module('ag.sdk.helper.crop-inspection', ['ag.sdk.helper.document', 'ag.sdk.library']);

sdkHelperCropInspectionApp.factory('cropInspectionHelper', ['documentHelper', 'underscore', function(documentHelper, underscore) {
    var _approvalTypes = ['Approved', 'Not Approved', 'Not Planted'];

    var _commentTypes = ['Crop amendment', 'Crop re-plant', 'Insurance coverage discontinued', 'Multi-insured', 'Other', 'Without prejudice', 'Wrongfully reported'];

    var _growthStageTable = [
        ['V0', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9', 'V10', 'V11', 'V12', 'V13', 'V14', 'V15', 'V16', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8', 'R9', 'R10', 'R11', 'R12', 'R13', 'R14'],
        ['V0', 'V1', 'V2', 'V3', 'V4', 'V5', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6'],
        ['V0', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9', 'V10', 'V11', 'V12', 'V13', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8', 'R9'],
        ['V0', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9', 'V10', 'V11', 'V12', 'V13', 'V14', 'V15', 'V16', 'V17', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8', 'R9', 'R10', 'R11', 'R12'],
        ['V0', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9', 'V10', 'V11', 'V12', 'V13', 'V14', 'V15', 'V16', 'V17', 'V18', 'V19', 'V20', 'V21', 'V22', 'V23', 'V24', 'V25', 'V26', 'V27', 'V28', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8'],
        ['V0', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8', 'R9'],
        ['V0', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8', 'R9', 'R10', 'R11', 'R12', 'R13', 'R14', 'R15', 'R16', 'R17', 'R18'],
        ['V0', 'V1', 'V2', 'V3', 'V4', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6'],
        ['V0', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6']
    ];

    var _growthStageCrops = {
        'Barley': _growthStageTable[1],
        'Bean': _growthStageTable[5],
        'Bean (Broad)': _growthStageTable[5],
        'Bean (Dry)': _growthStageTable[5],
        'Bean (Sugar)': _growthStageTable[5],
        'Bean (Green)': _growthStageTable[5],
        'Bean (Kidney)': _growthStageTable[5],
        'Canola': _growthStageTable[7],
        'Cotton': _growthStageTable[6],
        'Grain Sorghum': _growthStageTable[3],
        'Maize': _growthStageTable[0],
        'Maize (White)': _growthStageTable[0],
        'Maize (Yellow)': _growthStageTable[0],
        'Soya Bean': _growthStageTable[2],
        'Sunflower': _growthStageTable[4],
        'Wheat': _growthStageTable[1],
        'Wheat (Durum)': _growthStageTable[1]
    };

    var _inspectionTypes = {
        'emergence inspection': 'Emergence Inspection',
        'hail inspection': 'Hail Inspection',
        //'harvest inspection': 'Harvest Inspection',
        //'preharvest inspection': 'Pre Harvest Inspection',
        'progress inspection': 'Progress Inspection'
    };

    var _moistureStatusTypes = ['Dry', 'Moist', 'Wet'];

    var _seedTypeTable = [
        ['Maize Commodity', 'Maize Hybrid', 'Maize Silo Fodder']
    ];

    var _seedTypes = {
        'Maize': _seedTypeTable[0],
        'Maize (White)': _seedTypeTable[0],
        'Maize (Yellow)': _seedTypeTable[0]
    };

    var _policyTypes = ['Hail', 'Multi Peril'];

    var _policyInspections = {
        'Hail': ['emergence inspection', 'hail inspection'],
        'Multi Peril': underscore.keys(_inspectionTypes)
    };

    var _problemTypes = {
        disease: 'Disease',
        fading: 'Fading',
        uneven: 'Uneven',
        other: 'Other',
        root: 'Root',
        shortage: 'Shortage',
        weed: 'Weed'
    };

    var _flowerTypes = {
        'Dry Bean': 'pod',
        'Grain Sorghum': 'panicle',
        'Maize (White)': 'ear',
        'Maize (Yellow)': 'ear',
        'Sunflower': 'flower',
        'Wheat': 'spikelet',
        'Soya Bean': 'pod'
    };

    return {
        approvalTypes: function () {
            return _approvalTypes;
        },
        commentTypes: function () {
            return _commentTypes;
        },
        inspectionTitles: function () {
            return _inspectionTypes;
        },
        inspectionTypes: function () {
            return underscore.keys(_inspectionTypes);
        },
        moistureStatusTypes: function () {
            return _moistureStatusTypes;
        },
        policyTypes: function () {
            return _policyTypes;
        },
        policyInspectionTypes: function (policyType) {
            return _policyInspections[policyType] || [];
        },
        problemTypes: function () {
            return _problemTypes;
        },

        getFlowerType: function (crop) {
            return _flowerTypes[crop] || '';
        },
        getGrowthStages: function (crop) {
            return _growthStageCrops[crop] || _growthStageTable[0];
        },
        getSeedTypes:function (crop) {
            return _seedTypes[crop];
        },
        getInspectionTitle: function (type) {
            return _inspectionTypes[type] || '';
        },
        getProblemTitle: function (type) {
            return _problemTypes[type] || '';
        },
        getSampleArea: function (asset, zone) {
            return (_flowerTypes[asset.data.crop] === 'spikelet' ?
                (zone && zone.plantedInRows === true ? '3m' : 'm²') :
                (_flowerTypes[asset.data.crop] === 'pod' ? '3m' : '10m'));
        },

        hasSeedTypes: function (crop) {
            return _seedTypes[crop] !== undefined;
        },

        calculateProgressYield: function (asset, samples, pitWeight, realization) {
            pitWeight = pitWeight || 0;
            realization = (realization === undefined ? 100 : realization);

            var reduceSamples = function (samples, prop) {
                return (underscore.reduce(samples, function (total, sample) {
                    return (sample[prop] ? total + sample[prop] : total);
                }, 0) / samples.length) || 0
            };

            var zoneYields = underscore.map(asset.data.zones, function (zone, index) {
                var zoneSamples = underscore.where(samples, {zone: index});
                var total = {
                    coverage: (zone.size / asset.data.plantedArea),
                    heads: reduceSamples(zoneSamples, 'heads'),
                    weight: reduceSamples(zoneSamples, 'weight')
                };

                if (_flowerTypes[asset.data.crop] === 'spikelet') {
                    total.yield = (total.weight * total.heads) / ((asset.data.irrigated ? 3000 : 3500) * (zone.plantedInRows ? zone.rowWidth * 3 : 1));
                } else if (_flowerTypes[asset.data.crop] === 'pod') {
                    total.pods = reduceSamples(zoneSamples, 'pods');
                    total.seeds = reduceSamples(zoneSamples, 'seeds');
                    total.yield = (pitWeight * total.seeds * total.pods * total.heads) / (zone.rowWidth * 300);
                } else {
                    total.yield = (total.weight * total.heads) / (zone.rowWidth * 1000);
                }

                total.yield *= (realization / 100);

                return total;
            });

            return {
                zones: zoneYields,
                yield: underscore.reduce(zoneYields, function (total, item) {
                    return total + (item.coverage * item.yield);
                }, 0)
            };
        }
    }
}]);

sdkHelperCropInspectionApp.factory('cultivarHelper', ['underscore', function (underscore) {
    var _providerCultivars = {
        'Barley': {
            'Agricol': [
                'Other',
                'SKG 9',
                'SVG 13'
            ],
            'Other': [
                'Clipper',
                'Cocktail',
                'Other',
                'Puma',
                'SabbiErica',
                'SabbiNemesia',
                'SSG 564',
                'SSG 585'
            ]
        },
        'Bean (Dry)': {
            'Capstone': [
                'CAP 2000',
                'CAP 2001',
                'CAP 2008',
                'Other'
            ],
            'Dry Bean Seed Pty (Ltd)': [
                'DBS 310',
                'DBS 360',
                'DBS 830',
                'DBS 840',
                'Kranskop HR1',
                'OPS RS1',
                'OPS RS2',
                'OPS RS4',
                'OPS-KW1',
                'Other',
                'RS 5',
                'RS 6',
                'RS 7'
            ],
            'Pannar': [
                'Other',
                'PAN 116',
                'PAN 123',
                'PAN 128',
                'PAN 135',
                'PAN 139',
                'PAN 146',
                'PAN 148',
                'PAN 148 Plus',
                'PAN 9213',
                'PAN 9216',
                'PAN 9225',
                'PAN 9249',
                'PAN 9280',
                'PAN 9281',
                'PAN 9292',
                'PAN 9298'
            ],
            'Other': [
                'AFG 470',
                'AFG 471',
                'BONUS',
                'CALEDON',
                'CARDINAL',
                'CERRILLOS',
                'DONGARA',
                'DPO 820',
                'JENNY',
                'KAMIESBERG',
                'KOMATI',
                'KRANSKOP',
                'MAJUBA',
                'MASKAM',
                'MINERVA',
                'MKONDENI',
                'MKUZI',
                'Other',
                'RUBY',
                'SC Silk',
                'SC Superior',
                'SEDERBERG',
                'SSB 20',
                'STORMBERG',
                'TEEBUS',
                'TEEBUS-RCR2',
                'TEEBUS-RR1',
                'TYGERBERG',
                'UKULINGA',
                'UMTATA',
                'WERNA'
            ]
        },
        'Canola': {
            'Agricol': [
                'Aga Max',
                'AV Garnet',
                'CB Jardee HT',
                'Cobbler',
                'Other',
                'Tawriffic'
            ],
            'Klein Karoo': [
                'Hyola 61',
                'Other',
                'Rocket CL',
                'Thunder TT',
                'Varola 54'
            ],
            'Other': [
                'Other'
            ]
        },
        'Grain Sorghum': {
            'Agricol': [
                'AVENGER GH',
                'DOMINATOR GM',
                'ENFORCER GM',
                'MAXIMIZER',
                'Other',
                'PREMIUM 4065 T GH',
                'PREMIUM 100',
                'NS 5511 GH',
                'NS 5540',
                'NS 5555',
                'NS 5655 GM',
                'NS 5751',
                'NS 5832',
                'TIGER GM'
            ],
            'Capstone': [
                'CAP 1002',
                'CAP 1003',
                'CAP 1004',
                'Other'
            ],
            'Klein Karoo Saad': [
                'MR 32 GL',
                'MR 43 GL',
                'MR BUSTER GL',
                'MR PACER',
                'Other'
            ],
            'Pannar': [
                'PAN 8625 GH',
                'PAN 8816 GM',
                'PAN 8906 GM',
                'PAN 8909 GM',
                'PAN 8006 T',
                'PAN 8507',
                'PAN 8609',
                'PAN 8648',
                'PAN 8706',
                'PAN 8806',
                'PAN 8901',
                'PAN 8902',
                'PAN 8903',
                'PAN 8904',
                'PAN 8905',
                'PAN 8906',
                'PAN 8907',
                'PAN 8908',
                'PAN 8909',
                'PAN 8911',
                'PAN 8912',
                'PAN 8913',
                'PAN 8914',
                'PAN 8915',
                'PAN 8916',
                'PAN 8918',
                'PAN 8919',
                'PAN 8920',
                'PAN 8921',
                'PAN 8922',
                'PAN 8923',
                'PAN 8924',
                'PAN 8925',
                'PAN 8926',
                'PAN 8927',
                'PAN 8928',
                'PAN 8929',
                'PAN 8930',
                'PAN 8931',
                'PAN 8932',
                'PAN 8933',
                'PAN 8936',
                'PAN 8937',
                'PAN 8938',
                'PAN 8939',
                'PAN 8940',
                'PAN 8966',
                'Other'
            ],
            'Other': [
                'APN 881',
                'MACIA-SA',
                'NK 8830',
                'Other',
                'OVERFLOW',
                'SA 1302-M27',
                'TITAN',
                'X868'
            ]
        },
        'Maize (Yellow)': {
            'Afgri': [
                'AFG 4222 B',
                'AFG 4244',
                'AFG 4270 B',
                'AFG 4410',
                'AFG 4412 B',
                'AFG 4414',
                'AFG 4416 B',
                'AFG 4434 R',
                'AFG 4440',
                'AFG 4448',
                'AFG 4452 B',
                'AFG 4474 R',
                'AFG 4476',
                'AFG 4478 BR',
                'AFG 4512',
                'AFG 4520',
                'AFG 4522 B',
                'AFG 4530',
                'AFG 4540',
                'AFG 4546',
                'AFG 4548',
                'AFG 4566 B',
                'AFG 4572 R',
                'AFG 4660',
                'AFG 4664',
                'DK 618',
                'Other'
            ],
            'Agricol': [
                'IMP 50-90 BR',
                'IMP 51-22 B',
                'IMP 51-92',
                'IMP 51-92 R',
                'Other',
                'QS 7646',
                'SC 602',
                'SC 608'
            ],
            'Capstone Seeds': [
                'CAP 121-30',
                'CAP 122-60',
                'CAP 130-120',
                'CAP 130-140',
                'CAP 444 NG',
                'CAP 766 NG',
                'CAP 9004',
                'CAP 9444 NG',
                'Other'
            ],
            'Dekalb (Monsanto)': [
                'DKC 61-90',
                'DKC 62-80 BR',
                'DKC 62-80 BR GEN',
                'DKC 62-84 R',
                'DKC 64-78 BR',
                'DKC 64-78 BR GEN',
                'DKC 66-32 B',
                'DKC 66-36 R',
                'DKC 66-60 BR',
                'DKC 73-70 B GEN',
                'DKC 73-72',
                'DKC 73-74 BR GEN',
                'DKC 73-76 R',
                'DKC 80-10',
                'DKC 80-12 B GEN',
                'DKC 80-30 R',
                'DKC 80-40 BR GEN',
                'Other'
            ],
            'Delta Seed': [
                'Amber',
                'DE 2004',
                'DE 2006',
                'DE 2016',
                'DE 222',
                'Other'
            ],
            'Klein Karoo Saad': [
                'Helen',
                'KKS 8202',
                'KKS 8204 B',
                'KKS 8400',
                'KKS 8402',
                'Other'
            ],
            'Linksaad': [
                'LS 8518',
                'LS 8524 R',
                'LS 8526',
                'LS 8528 R',
                'LS 8532 B',
                'LS 8536 B',
                'Other'
            ],
            'Pannar': [
                'BG 3268',
                'BG 3292',
                'BG 3492BR',
                'BG 3568R',
                'BG 3592R',
                'BG 3768BR',
                'BG 4296',
                'BG 6308B',
                'Other',
                'PAN 14',
                'PAN 3D-736 BR',
                'PAN 3P-502 R',
                'PAN 3P-730 BR',
                'PAN 3Q-222',
                'PAN 3Q-240',
                'PAN 3Q-740 BR',
                'PAN 3R-644 R',
                'PAN 4P-228',
                'PAN 4P-716 BR',
                'PAN 6126 ',
                'PAN 66',
                'PAN 6616',
                'PAN 6P-110',
                'PAN 6P110',
                'PAN 6Q-408B',
                'PAN 6Q-508 R',
                'PAN 6Q-708 BR'
            ],
            'Pioneer': [
                'Other',
                'P 1615 R',
                'P 2048',
                'Phb 31D21 B',
                'Phb 31D24',
                'Phb 31D46 BR',
                'Phb 31D48 B',
                'Phb 31G54 BR',
                'Phb 31G56 R',
                'Phb 31K58 B',
                'Phb 32D95 BR',
                'Phb 32D96 B',
                'Phb 32D99',
                'Phb 32P68 R',
                'Phb 32T50',
                'Phb 32W71',
                'Phb 32W72 B',
                'Phb 33A14 B',
                'Phb 33H52 B',
                'Phb 33H56',
                'Phb 33Y72 B',
                'Phb 33Y74',
                'Phb 3442',
                'Phb 34N44 B',
                'Phb 34N45 BR',
                'Phb 35T05 R'
            ],
            'Sensako (Monsanto)': [
                'Other',
                'SNK 2472',
                'SNK 2682',
                'SNK 2778',
                'SNK 2900',
                'SNK 2942',
                'SNK 2972',
                'SNK 6326 B',
                'SNK 7510 Y',
                'SNK 8520'
            ],
            'Other': [
                'Brasco',
                'Cobber Flint',
                'Cumbre',
                'Energy',
                'Gold Finger',
                'High Flyer',
                'IMP 50-10 R',
                'IMP 51-22',
                'IMP 52-12',
                'MEH 114',
                'MMH 1765',
                'MMH 8825',
                'Maverik',
                'NK Arma',
                'NK MAYOR B',
                'NS 5000',
                'NS 5004',
                'NS 5066',
                'NS 5914',
                'NS 5916',
                'NS 5918',
                'NS 5920',
                'Other',
                'Premium Flex',
                'QS 7608',
                'RO 430',
                'SA 24',
                'SABI 7004',
                'SABI 7200',
                'Silmaster',
                'Syncerus',
                'US 9570',
                'US 9580',
                'US 9600',
                'US 9610',
                'US 9620',
                'US 9770',
                'US 9772',
                'Woodriver'
            ]
        },
        'Maize (White)': {
            'Afgri': [
                'AFG 4211',
                'AFG 4321',
                'AFG 4331',
                'AFG 4333',
                'AFG 4361',
                'AFG 4383',
                'AFG 4411',
                'AFG 4445',
                'AFG 4447',
                'AFG 4471',
                'AFG 4475 B',
                'AFG 4477',
                'AFG 4479 R',
                'AFG 4501',
                'AFG 4517',
                'AFG 4555',
                'AFG 4571 B',
                'AFG 4573 B',
                'AFG 4575',
                'AFG 4577 B',
                'AFG 4579 B',
                'AFG 4581 BR',
                'AFG 4611',
                'AFG 4663',
                'AFRIC 1',
                'Other'
            ],
            'Agricol': [
                'IMP 52-11',
                'Other',
                'SC 701',
                'SC 709'
            ],
            'Capstone Seeds': [
                'CAP 341 NG',
                'CAP 341 T NG',
                'CAP 441 NG',
                'CAP 775 NG',
                'CAP 9001',
                'CAP 9013',
                'CAP 9421',
                'Other'
            ],
            'Dekalb (Monsanto)': [
                'CRN 3505',
                'CRN 4141',
                'DKC 77-61 B',
                'DKC 77-85 B GEN',
                'DKC 78-15 B',
                'DKC 78-17 B',
                'DKC 78-35 R',
                'DKC 78-45 BR',
                'DKC 78-45 BR GEN',
                'DKC 79-05',
                'Other'
            ],
            'Delta Seed': [
                'DE 111',
                'DE 303',
                'Other'
            ],
            'Klein Karoo Saad': [
                'KKS 4383',
                'KKS 4445',
                'KKS 4447',
                'KKS 4471',
                'KKS 4473',
                'KKS 4477',
                'KKS 4479 R',
                'KKS 4485',
                'KKS 4501',
                'KKS 4517',
                'KKS 4519',
                'KKS 4555',
                'KKS 4575',
                'KKS 4581 BR',
                'KKS 8401',
                'Other'
            ],
            'Linksaad': [
                'LS 8519',
                'LS 8529',
                'LS 8533 R',
                'LS 8535 B',
                'LS 8537',
                'LS 8539 B',
                'Other'
            ],
            'Pannar': [
                'BG 5485B',
                'BG 5685R',
                'BG4201',
                'BG4401B',
                'BG5285',
                'BG5785BR',
                'BG6683R',
                'Other',
                'PAN 413',
                'PAN 4P-767BR',
                'PAN 53',
                'PAN 5Q-649 R',
                'PAN 5Q-749 BR',
                'PAN 5Q-751BR',
                'PAN 6227',
                'PAN 6479',
                'PAN 6611',
                'PAN 6671',
                'PAN 67',
                'PAN 6777',
                'PAN 69',
                'PAN 6Q-745BR',
                'PAN 93',
                'PAN413',
                'PAN53',
                'PAN6Q245',
                'PAN6Q345CB',
                'SC 701 (Green mealie)'
            ],
            'Pioneer': [
                'Other',
                'P 2369 W',
                'P 2653 WB',
                'P 2823 WB',
                'P 2961 W',
                'Phb 30B95 B',
                'Phb 30B97 BR',
                'Phb 30D04 R',
                'Phb 30D07 B',
                'Phb 30D09 BR',
                'Phb 30Y79 B',
                'Phb 30Y81 R',
                'Phb 30Y83',
                'Phb 31M09',
                'Phb 31M84 BR',
                'Phb 31T91',
                'Phb 31V31',
                'Phb 3210B',
                'Phb 32A05 B',
                'Phb 32B07 BR',
                'Phb 32Y85',
                'Phb 32Y87 B'
            ],
            'Sensako (Monsanto)': [
                'SNK 2021',
                'SNK 2147',
                'SNK 2401',
                'SNK 2551',
                'SNK 2721',
                'SNK 2911',
                'SNK 2969',
                'SNK 6025',
                'SNK 7811 B'
            ],
            'Other': [
                'CG 4141',
                'GM 2000',
                'KGALAGADI',
                'MRI 514',
                'MRI 624',
                'NG 761',
                'NS 5913',
                'NS 5917',
                'NS 5919',
                'Other',
                'PGS 7053',
                'PGS 7061',
                'PGS 7071',
                'PLATINUM',
                'Panthera',
                'QS 7707',
                'RO 413',
                'RO 413',
                'RO 419',
                'SAFFIER',
                'SC 401',
                'SC 403',
                'SC 405',
                'SC 407',
                'SC 513',
                'SC 627',
                'SC 631',
                'SC 633',
                'SC 713',
                'SC 715',
                'Scout'
            ]
        },
        'Oats': {
            'Agricol': [
                'Magnifico',
                'Maida',
                'Nugene',
                'Other',
                'Overberg',
                'Pallinup',
                'Saia',
                'SWK001'
            ],
            'Sensako (Monsanto)': [
                'Other',
                'SSH 39W',
                'SSH 405',
                'SSH 421',
                'SSH 423',
                'SSH 491'
            ],
            'Other': [
                'Drakensberg',
                'H06/19',
                'H06/20',
                'H07/04',
                'H07/05',
                'Heros',
                'Kompasberg',
                'Le Tucana',
                'Maluti',
                'Other',
                'Potoroo',
                'Witteberg'
            ]
        },
        'Peanut': {
            'Other': [
                'Other'
            ]
        },
        'Soya Bean': {
            'Agriocare': [
                'AGC 58007 R',
                'AGC 60104 R',
                'AGC 64107 R',
                'AS 4801 R',
                'Other'
            ],
            'Linksaad': [
                'LS 6146 R',
                'LS 6150 R',
                'LS 6161 R',
                'LS 6164 R',
                'LS 6248 R',
                'LS 6261 R',
                'LS 6444 R',
                'LS 6466 R',
                'Other'
            ],
            'Pannar': [
                'A 5409 RG',
                'Other',
                'PAN 1454 R',
                'PAN 1583 R',
                'PAN 1664 R',
                'PAN 1666 R'
            ],
            'Pioneer': [
                'Other',
                'Phb 94Y80 R',
                'Phb 95B53 R',
                'Phb 95Y20 R',
                'Phb 95Y40 R'
            ],
            'Other': [
                'AG 5601',
                'AMSTEL NO 1',
                'DUMELA',
                'DUNDEE',
                'EGRET',
                'HERON',
                'HIGHVELD TOP',
                'IBIS 2000',
                'JF 91',
                'JIMMY',
                'KIAAT',
                'KNAP',
                'LEX 1233 R',
                'LEX 1235 R',
                'LEX 2257 R',
                'LEX 2685 R',
                'LIGHTNING',
                'MARULA',
                'MARUTI',
                'MOPANIE',
                'MPIMBO',
                'MUKWA',
                'NQUTU',
                'OCTA',
                'Other',
                'SONOP',
                'SPITFIRE',
                'STORK',
                'TAMBOTIE',
                'WENNER'
            ]
        },
        'Sugarcane': {
            'Other': [
                'ACRUNCH',
                'BONITA',
                'CHIEFTAIN',
                'EARLISWEET',
                'GLADIATOR',
                'GSS 9299',
                'HOLLYWOOD',
                'HONEYMOON',
                'INFERNO',
                'JUBILEE',
                'MADHUR',
                'MAJESTY',
                'MANTRA',
                'MATADOR',
                'MAX',
                'MEGATON',
                'MMZ 9903',
                'ORLA',
                'OSCAR',
                'Other',
                'OVERLAND',
                'PRIMEPLUS',
                'RUSALTER',
                'RUSTICO',
                'RUSTLER',
                'SENTINEL',
                'SHIMMER',
                'STAR 7708',
                'STAR 7713',
                'STAR 7714',
                'STAR 7715',
                'STAR 7717',
                'STAR 7718',
                'STAR 7719',
                'STETSON',
                'SWEET SUCCESS',
                'SWEET SURPRISE',
                'SWEET TALK',
                'TENDER TREAT',
                'WINSTAR'
            ]
        },
        'Sunflower': {
            'Agricol': [
                'AGSUN 5161 CL',
                'AGSUN 5182 CL',
                'Agsun 5264',
                'Agsun 5671',
                'Agsun 8251',
                'Nonjana',
                'Other',
                'SUNSTRIPE'
            ],
            'Klein Karoo Saad': [
                'AFG 271',
                'HYSUN 333',
                'KKS 318',
                'NK ADAGIO',
                'NK Armoni',
                'NK FERTI',
                'Other',
                'Sirena',
                'Sunbird'
            ],
            'Pannar': [
                'Other',
                'PAN 7033',
                'PAN 7049',
                'PAN 7050',
                'PAN 7057',
                'PAN 7063 CL',
                'PAN 7080',
                'PAN 7086 HO',
                'PAN 7095 CL',
                'PAN 7351'
            ],
            'Other': [
                'Ella',
                'Grainco Sunstripe',
                'HV 3037',
                'HYSUN 334',
                'HYSUN 338',
                'HYSUN 346',
                'HYSUN 350',
                'Jade Emperor',
                'Marica-2',
                'NK Adagio CL',
                'Nallimi CL',
                'Other',
                'SEA 2088 CL AO',
                'SY 4045',
                'SY 4200',
                'Sikllos CL',
                'WBS 3100'
            ]
        },
        'Triticale': {
            'Agricol': [
                'AG Beacon',
                'Other',
                'Rex'
            ],
            'Pannar': [
                'PAN 248',
                'PAN 299',
                'Other'
            ],
            'Other': [
                'Bacchus',
                'Cloc 1',
                'Cultivars',
                'Falcon',
                'Ibis',
                'Kiewiet',
                'Korhaan',
                'Other',
                'Tobie',
                'US 2009',
                'US 2010',
                'US2007'
            ]
        },
        'Wheat': {
            'Afgri': [
                'AFG 554-8',
                'AFG 75-3',
                'Other'
            ],
            'All-Grow Seed': [
                'BUFFELS',
                'DUZI',
                'KARIEGA',
                'KROKODIL',
                'Other',
                'SABIE',
                'STEENBRAS'
            ],
            'Klein Karoo Saad': [
                'HARTBEES',
                'KOMATI',
                'KOONAP',
                'MATLABAS',
                'Other',
                'SELATI',
                'SENQU'
            ],
            'Sensako': [
                'CRN 826',
                'ELANDS',
                'Other',
                'SST 015',
                'SST 026',
                'SST 027',
                'SST 035',
                'SST 036',
                'SST 037',
                'SST 039',
                'SST 047',
                'SST 056',
                'SST 057',
                'SST 065',
                'SST 077',
                'SST 087',
                'SST 088',
                'SST 094',
                'SST 096',
                'SST 107',
                'SST 124',
                'SST 308',
                'SST 316',
                'SST 317',
                'SST 319',
                'SST 322',
                'SST 333',
                'SST 334',
                'SST 347',
                'SST 356',
                'SST 363',
                'SST 366',
                'SST 367',
                'SST 374',
                'SST 387',
                'SST 398',
                'SST 399',
                'SST 802',
                'SST 805',
                'SST 806',
                'SST 807',
                'SST 815',
                'SST 816',
                'SST 822',
                'SST 825',
                'SST 835',
                'SST 843',
                'SST 866',
                'SST 867',
                'SST 875',
                'SST 876',
                'SST 877',
                'SST 878',
                'SST 884',
                'SST 885',
                'SST 886',
                'SST 895',
                'SST 896',
                'SST 935',
                'SST 936',
                'SST 946',
                'SST 954',
                'SST 963',
                'SST 964',
                'SST 966',
                'SST 972',
                'SST 983',
                'SST 0127',
                'SST 1327',
                'SST 3137',
                'SST 8125',
                'SST 8126',
                'SST 8134',
                'SST 8135',
                'SST 8136'
            ],
            'Pannar': [
                'Other',
                'PAN 3118',
                'PAN 3120',
                'PAN 3122',
                'PAN 3144',
                'PAN 3161',
                'PAN 3172',
                'PAN 3195',
                'PAN 3198',
                'PAN 3355',
                'PAN 3364',
                'PAN 3368',
                'PAN 3369',
                'PAN 3377',
                'PAN 3378',
                'PAN 3379',
                'PAN 3394',
                'PAN 3400',
                'PAN 3404',
                'PAN 3405',
                'PAN 3408',
                'PAN 3434',
                'PAN 3471',
                'PAN 3478',
                'PAN 3489',
                'PAN 3490',
                'PAN 3492',
                'PAN 3497',
                'PAN 3111',
                'PAN 3349',
                'PAN 3515',
                'PAN 3623'
            ],
            'Other': [
                'BAVIAANS',
                'BELINDA',
                'BETTA-DN',
                'BIEDOU',
                'CALEDON',
                'CARINA',
                'CAROL',
                'GARIEP',
                'HUGENOOT',
                'INIA',
                'KOUGA',
                'KWARTEL',
                'LIMPOPO',
                'MacB',
                'MARICO',
                'NOSSOB',
                'OLIFANTS',
                'Other',
                'SNACK',
                'TAMBOTI',
                'TANKWA',
                'TARKA',
                'TIMBAVATI',
                'TUGELA-DN',
                'UMLAZI',
                'RATEL'
            ]
        }
    };

    // Create Maize from Maize (Yellow) and Maize (White)
    _providerCultivars['Maize'] = angular.copy(_providerCultivars['Maize (Yellow)']);

    angular.forEach(_providerCultivars['Maize (White)'], function (cultivars, seedProvider) {
        _providerCultivars['Maize'][seedProvider] = _.chain(_providerCultivars['Maize'][seedProvider] || [])
            .union(cultivars)
            .compact()
            .uniq()
            .sortBy(function (cultivar) {
                return cultivar;
            })
            .value();
    });

    var _cultivarLeafTable = {
        'Phb 30F40': 23,
        'Phb 31G54 BR': 19,
        'Phb 31G58': 21,
        'Phb 32D95BR': 18,
        'Phb 32D96 B': 18,
        'Phb 32P68 R': 20,
        'Phb 32T50': 18,
        'Phb 32W71': 21,
        'Phb 32W72 B': 20,
        'Phb 33A14 B': 19,
        'Phb 33H56': 20,
        'Phb 33R78 B': 21,
        'Phb 33Y72B': 17,
        'Phb 3442': 21,
        'Phb 30B95 B': 23,
        'Phb 30B97 BR': 23,
        'Phb 30D09 BR': 20,
        'Phb 31M09': 18,
        'Phb 32A05 B': 19,
        'Phb 32B10': 18,
        'Phb 32Y85': 21,
        'Phb 31D48 BR': 21,
        'Phb 32D91 R': 20,
        'Phb 32D99': 20,
        'Phb 32Y68': 20,
        'Phb 3394': 19,
        'Phb 33A13': 19,
        'Phb 33H52 B': 19,
        'Phb 33H54 BR': 19,
        'Phb 33P34': 20,
        'Phb 33P66': 20,
        'Phb 33P67': 20,
        'X 70200 T': 23,
        'X 7268 TR': 21,
        'Phb 30N35': 23,
        'Phb 32A03': 19,
        'Phb 32Y52': 19,
        'Phb 32Y53': 20,
        'Phb 33A03': 19,
        'Phb 30H22': 21,
        'Phb 32P75': 20,
        'Phb 3335': 20,
        'DKC62-74R': 20,
        'DKC62-80BR': 18,
        'DKC64-78BR': 17,
        'DKC66-32B': 21,
        'DKC66-36R': 19,
        'DKC73-70BGEN': 20,
        'DKC73-74BR': 20,
        'DKC73-74BRGEN': 20,
        'DKC73-76R': 20,
        'DKC80-10': 20,
        'DKC80-12B': 20,
        'DKC80-30R': 20,
        'DKC80-40BR': 19,
        'DKC80-40BRGEN': 21,
        'CRN3505': 21,
        'DKC77-61B': 20,
        'DKC77-71R': 20,
        'DKC77-85B': 21,
        'DKC78-15B': 20,
        'DKC78-35BR': 21,
        'DKC78-45BRGEN': 21,
        'DKC 78-79 BR': 21,
        'CRN 3604': 21,
        'CRN 37-60': 20,
        'CRN 4760 B': 23,
        'DKC 63-20': 20,
        'DKC 66-21': 21,
        'DKC 66-38 B': 21,
        'DKC 63-28 R': 21,
        'CRN 3549': 21,
        'DKC 71-21': 20,
        'SNK 2472': 23,
        'SNK 2682': 23,
        'SNK 2778': 23,
        'SNK 2900': 20,
        'SNK 2942': 24,
        'SNK 2972': 21,
        'SNK 6326 B': 21,
        'SNK 8520': 24,
        'SNK 2911': 21,
        'SNK 6025': 18,
        'LS 8504': 20,
        'LS 8512': 20,
        'LS 8518': 19,
        'LS 8522 R': 19,
        'LS 8511': 19,
        'LS 8513': 19,
        'LS 8519': 19,
        'LS 8521 B': 19,
        'LS 8523 B': 19,
        'LS 8527 BR': 19,
        'LS 8506': 21,
        'LS 8508': 20,
        'LS 8524 R': 20,
        'LEX 800': 23,
        'LS 8509': 21,
        'LS 8517': 23,
        'LS 8525': 21,
        'LS 8529': 21,
        'LS 8533 R': 21,
        'LS 8536 B': 19,
        'PAN 3D-432Bt ': 18,
        'PAN 3D-736BR': 18,
        'PAN 3P-502RR': 19,
        'PAN 3P-730BR': 18,
        'PAN 3Q-422B': 18,
        'PAN 3Q-740BR': 19,
        'PAN 3R-644R': 18,
        'PAN 4P-116': 19,
        'PAN 4P-316Bt': 19,
        'PAN 4P-516RR': 20,
        'PAN 4P-716BR': 19,
        'PAN 6114': 19,
        'PAN 6126': 18,
        'PAN 6146': 24,
        'PAN 6236Bt': 18,
        'PAN 6238RR': 18,
        'PAN 6480': 23,
        'PAN 6616': 23,
        'PAN 6724Bt': 25,
        'PAN 6734': 23,
        'PAN 6P-110': 21,
        'PAN 6Q-308 B': 21,
        'PAN 6Q-308 Bt': 21,
        'PAN 6Q-408 CB': 21,
        'PAN 6Q-508R': 21,
        'PAN 6Q-508RR': 20,
        'PAN 4P-767BR': 19,
        'PAN 5Q-433Bt *': 20,
        'PAN 5R-541RR': 19,
        'PAN 6013Bt': 23,
        'PAN 6017': 21,
        'PAN 6043': 23,
        'PAN 6053': 23,
        'PAN 6223Bt': 21,
        'PAN 6479': 23,
        'PAN 6611': 23,
        'PAN 6723': 23,
        'PAN 6777': 25,
        'PAN 6Q-419B': 20,
        'PAN 6Q-445Bt': 21,
        'PAN 6000 Bt': 19,
        'PAN 6012 Bt': 21,
        'PAN 6118': 19,
        'PAN 6124 Bt': 19,
        'PAN 6128 RR': 19,
        'PAN 6256': 24,
        'PAN 6310': 24,
        'PAN 6316': 25,
        'PAN 6320': 25,
        'PAN 6432 B': 23,
        'PAN 6568': 23,
        'PAN 6622': 25,
        'PAN 6710': 21,
        'PAN 6804': 20,
        'PAN 6844': 25,
        'PAN 6994 Bt': 24,
        'PAN 5Q-749 BR': 23,
        'PAN 6243': 24,
        'PAN 6335': 23,
        'PAN 6573': 23,
        'PAN 6633': 23,
        'PAN 6757': 25,
        'PAN 6839': 23,
        'PAN 6Q-321 B': 23,
        'PAN 6Q-345 CB': 21,
        'AFG 4270B': 18,
        'AFG 4412B': 19,
        'AFG 4434R': 20,
        'AFG 4522B': 20,
        'AFG 4530': 19,
        'AFG 4222 B': 19,
        'AFG 4244': 19,
        'AFG 4410': 19,
        'AFG 4414': 20,
        'AFG 4416 B': 20,
        'AFG 4448': 20,
        'AFG 4474 R': 19,
        'AFG 4476': 20,
        'AFG 4512': 23,
        'AFG 4520': 20,
        'AFG 4540': 20,
        'DK 618': 21,
        'EXPG 5002': 20,
        'EXP Stack': 20,
        'AFG 4321': 19,
        'AFG 4331': 20,
        'AFG 4333': 20,
        'AFG 4411': 21,
        'AFG 4445': 21,
        'AFG 4447': 21,
        'AFG 4471': 23,
        'AFG 4475 B': 21,
        'AFG 4477': 20,
        'AFG 4479 R': 21,
        'AFG 4573 B': 21,
        'AFG 4577 B': 21,
        'AFG 4611': 23,
        'KKS 8204B': 15,
        'KKS 4581 BR': 21,
        'KKS 8301': 19,
        'IMP 50 - 90BR': 18,
        'IMP 51 - 22': 19,
        'IMP 51-92': 19,
        'IMP 52-12': 20,
        'NS 5920': 20,
        'QS 7646': 20,
        'BG 5485 B': 23,
        'BG 8285': 23,
        'Brasco': 19,
        'Energy': 18,
        'Gold Finger': 19,
        'Helen': 17,
        'High Flyer': 17,
        'Maverik': 19,
        'NK Arma': 18,
        'QS 7608': 23,
        'SC 506': 19,
        'SC 602': 21,
        'Woodriver': 18,
        'P 1615 R': 19,
        'P 1973 Y': 19,
        'P 2653 WB': 20,
        'P 2048': 20,
        'IMP 52-11 B': 18,
        'Panthera': 21,
        'QS 7707': 23,
        'SC 401': 18,
        'SC 403': 20,
        'SC 405': 20,
        'SC 407': 20,
        'SC 533': 21,
        'SC 719': 24,
        'Scout': 20
    };

    return {
        getCultivars: function (crop, seedProvider) {
            return (_providerCultivars[crop] && _providerCultivars[crop][seedProvider] ? _providerCultivars[crop][seedProvider] : []);
        },
        getCultivarLeafCount: function (cultivar) {
            return _cultivarLeafTable[cultivar] || 22;
        },
        getSeedProviders: function (crop) {
            return (_providerCultivars[crop] ? underscore.keys(_providerCultivars[crop]) : []);
        }
    }
}]);

var sdkHelperDocumentApp = angular.module('ag.sdk.helper.document', ['ag.sdk.helper.task', 'ag.sdk.library']);

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

    this.$get = ['$filter', '$injector', 'taskHelper', 'underscore', function ($filter, $injector, taskHelper, underscore) {
        var _listServiceMap = function (item) {
            var docMap = _documentMap[item.docType];
            var map = {
                id: item.id || item.__id,
                title: (item.documentId ? item.documentId : ''),
                subtitle: (item.author ? 'By ' + item.author + ' on ': 'On ') + $filter('date')(item.createdAt),
                docType: item.docType,
                group: (docMap ? docMap.title : item.docType)
            };

            if (item.organization && item.organization.name) {
                map.title = item.organization.name;
                map.subtitle = item.documentId || '';
            }

            if (item.data && docMap && docMap.listServiceMap) {
                if (docMap.listServiceMap instanceof Array) {
                    docMap.listServiceMap = $injector.invoke(docMap.listServiceMap);
                }

                docMap.listServiceMap(map, item);
            }

            return map;
        };

        var _listServiceWithTaskMap = function (item) {
            if (_documentMap[item.docType]) {
                var map = _listServiceMap(item);
                var parentTask = underscore.findWhere(item.tasks, {type: 'parent'});

                if (map && parentTask) {
                    map.status = {
                        text: parentTask.status,
                        label: taskHelper.getTaskLabel(parentTask.status)
                    }
                }

                return map;
            }
        };

        return {
            listServiceMap: function () {
                return _listServiceMap;
            },
            listServiceWithTaskMap: function () {
                return _listServiceWithTaskMap;
            },
            filterDocuments: function (documents) {
                return underscore.filter(documents, function (document) {
                    return (_documentMap[document.docType] !== undefined);
                });
            },
            pluralMap: function (item, count) {
                return _pluralMap(item, count);
            },

            documentTypes: function () {
                return _docTypes;
            },
            documentTitles: function () {
                return underscore.pluck(_documentMap, 'title');
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

var sdkHelperEnterpriseBudgetApp = angular.module('ag.sdk.helper.enterprise-budget', ['ag.sdk.library']);

sdkHelperEnterpriseBudgetApp.factory('enterpriseBudgetHelper', ['underscore', function(underscore) {
    var _listServiceMap = function (item) {
        return {
            id: item.id || item.__id,
            title: item.name,
            subtitle: item.commodityType + (item.regionName? ' in ' + item.regionName : ''),
            status: (item.published ? {text: 'published', label: 'label-success'} : false)
        }
    };

    var _modelTypes = {
        crop: 'Field Crop',
        livestock: 'Livestock',
        horticulture: 'Horticulture'
    };

    var _sections = {
        expenses: {
            code: 'EXP',
            name: 'Expenses'
        },
        income: {
            code: 'INC',
            name: 'Income'
        }
    };

    var _groups = underscore.indexBy([
        {
            code: 'INC-CPS',
            name: 'Crop Sales'
        }, {
            code: 'INC-FRS',
            name: 'Fruit Sales'
        }, {
            code: 'HVT',
            name: 'Harvest'
        }, {
            code: 'HVP',
            name: 'Preharvest'
        }, {
            code: 'INC-LSS',
            name: 'Livestock Sales'
        }, {
            code: 'INC-LSP',
            name: 'Product Sales'
        }, {
            code: 'EXP-AMF',
            name: 'Animal Feed'
        }, {
            code: 'HBD',
            name: 'Husbandry'
        }, {
            code: 'IDR',
            name: 'Indirect Costs'
        }, {
            code: 'MRK',
            name: 'Marketing'
        }, {
            code: 'RPM',
            name: 'Replacements'
        }
    ], 'name');

    var _categories = underscore.indexBy([
        //*********** Income *********
        // livestock sales
        // Sheep
        {
            code: 'INC-LSS-SLAMB',
            name: 'Lamb',
            unit: 'head'
        }, {
            code: 'INC-LSS-SWEAN',
            name: 'Weaner lambs',
            unit: 'head'
        }, {
            code: 'INC-LSS-SEWE',
            name: 'Ewe',
            unit: 'head'
        }, {
            code: 'INC-LSS-SWTH',
            name: 'Wether (2-tooth plus)',
            unit: 'head'
        }, {
            code: 'INC-LSS-SRAM',
            name: 'Ram',
            unit: 'head'
        },

        // Cattle
        {
            code: 'INC-LSS-CCALV',
            name: 'Calf',
            unit: 'head'
        }, {
            code: 'INC-LSS-CWEN',
            name: 'Weaner calves',
            unit: 'head'
        }, {
            code: 'INC-LSS-CCOW',
            name: 'Cow or heifer',
            unit: 'head'
        }, {
            code: 'INC-LSS-CST18',
            name: 'Steer (18 moths plus)',
            unit: 'head'
        }, {
            code: 'INC-LSS-CST36',
            name: 'Steer (3 years plus)',
            unit: 'head'
        }, {
            code: 'INC-LSS-CBULL',
            name: 'Bull (3 years plus)',
            unit: 'head'
        },

        //Goats
        {
            code: 'INC-LSS-GKID',
            name: 'Kid',
            unit: 'head'
        }, {
            code: 'INC-LSS-GWEAN',
            name: 'Weaner kids',
            unit: 'head'
        }, {
            code: 'INC-LSS-GEWE',
            name: 'Ewe (2-tooth plus)',
            unit: 'head'
        }, {
            code: 'INC-LSS-GCAST',
            name: 'Castrate (2-tooth plus)',
            unit: 'head'
        }, {
            code: 'INC-LSS-GRAM',
            name: 'Ram (2-tooth plus)',
            unit: 'head'
        },

        // livestock product sales
        {
            code: 'INC-LSP-MILK',
            name: 'Milk',
            unit: 'l'
        }, {
            code: 'INC-LSP-WOOL',
            name: 'Wool',
            unit: 'kg'
        },

        //Crops
        {
            code: 'INC-HVT-CROP',
            name: 'Crop',
            unit: 't'
        },
        //Horticulture (non-perennial)
        {
            code: 'INC-HVT-FRUT',
            name: 'Fruit',
            unit: 't'
        },
        //*********** Expenses *********
        // Preharvest
        {
            code: 'EXP-HVP-SEED',
            name: 'Seed',
            unit: 'kg'
        }, {
            code: 'EXP-HVP-PLTM',
            name: 'Plant Material',
            unit: 'each'
        }, {
            code: 'EXP-HVP-FERT',
            name: 'Fertiliser',
            unit: 't'
        }, {
            code: 'EXP-HVP-LIME',
            name: 'Lime',
            unit: 't'
        }, {
            code: 'EXP-HVP-HERB',
            name: 'Herbicides',
            unit: 'l'
        }, {
            code: 'EXP-HVP-PEST',
            name: 'Pesticides',
            unit: 'l'
        }, {
            code: 'EXP-HVP-SPYA',
            name: 'Aerial spraying',
            unit: 'ha'
        }, {
            code: 'EXP-HVP-INSH',
            name: 'Crop Insurance (Hail)',
            unit: 't'
        }, {
            code: 'EXP-HVP-INSM',
            name: 'Crop Insurance (Multiperil)',
            unit: 't'
        }, {
            code: 'EXP-HVP-HEDG',
            name: 'Hedging cost',
            unit: 't'
        },
        //Harvest
        {
            code: 'EXP-HVT-LABC',
            name: 'Contract work (Harvest)',
            unit: 'ha'
        }, {
            code: 'EXP-HVT-STOR',
            name: 'Storage',
            unit: 'days'
        }, {
            code: 'EXP-HVT-PAKM',
            name: 'Packaging material',
            unit: 'each'
        }, {
            code: 'EXP-HVT-DYCL',
            name: 'Drying and cleaning',
            unit: 't'
        }, {
            code: 'EXP-HVT-PAKC',
            name: 'Packing cost',
            unit: 'each'
        },
        //Indirect
        {
            code: 'EXP-IDR-FUEL',
            name: 'Fuel',
            unit: 'l'
        }, {
            code: 'EXP-IDR-REPP',
            name: 'Repairs & parts',
            unit: 'Total'
        }, {
            code: 'EXP-IDR-ELEC',
            name: 'Electricity',
            unit: 'Total'
        }, {
            code: 'EXP-IDR-WATR',
            name: 'Water',
            unit: 'Total'
        }, {
            code: 'EXP-IDR-LABP',
            name: 'Permanent labour',
            unit: 'Total'
        }, {
            code: 'EXP-IDR-SCHED',
            name: 'Scheduling',
            unit: 'Total'
        }, {
            code: 'EXP-IDR-LICS',
            name: 'License',
            unit: 'Total'
        }, {
            code: 'EXP-IDR-INSA',
            name: 'Insurance assets',
            unit: 'Total'
        }, {
            code: 'EXP-IDR-OTHER',
            name: 'Other costs',
            unit: 'Total'
        },
        //Replacements
        // Sheep
        {
            code: 'EXP-RPM-SLAMB',
            name: 'Lamb',
            unit: 'head'
        }, {
            code: 'EXP-RPM-SWEAN',
            name: 'Weaner lambs',
            unit: 'head'
        }, {
            code: 'EXP-RPM-SEWE',
            name: 'Ewe',
            unit: 'head'
        }, {
            code: 'EXP-RPM-SWTH',
            name: 'Wether (2-tooth plus)',
            unit: 'head'
        }, {
            code: 'EXP-RPM-SRAM',
            name: 'Ram',
            unit: 'head'
        },

        // Cattle
        {
            code: 'EXP-RPM-CCALV',
            name: 'Calf',
            unit: 'head'
        }, {
            code: 'EXP-RPM-CWEN',
            name: 'Weaner calves',
            unit: 'head'
        }, {
            code: 'EXP-RPM-CCOW',
            name: 'Cow or heifer',
            unit: 'head'
        }, {
            code: 'EXP-RPM-CST18',
            name: 'Steer (18 moths plus)',
            unit: 'head'
        }, {
            code: 'EXP-RPM-CST36',
            name: 'Steer (3 years plus)',
            unit: 'head'
        }, {
            code: 'EXP-RPM-CBULL',
            name: 'Bull (3 years plus)',
            unit: 'head'
        },

        //Goats
        {
            code: 'EXP-RPM-GKID',
            name: 'Kid',
            unit: 'head'
        }, {
            code: 'EXP-RPM-GWEAN',
            name: 'Weaner kids',
            unit: 'head'
        }, {
            code: 'EXP-RPM-GEWE',
            name: 'Ewe (2-tooth plus)',
            unit: 'head'
        }, {
            code: 'EXP-RPM-GCAST',
            name: 'Castrate (2-tooth plus)',
            unit: 'head'
        }, {
            code: 'EXP-RPM-GRAM',
            name: 'Ram (2-tooth plus)',
            unit: 'head'
        },
        //Animal feed
        {
            code: 'EXP-AMF-LICK',
            name: 'Lick',
            unit: 'kg'
        },
        //Husbandry
        {
            code: 'EXP-HBD-VACC',
            name: 'Drenching & vaccination',
            unit: 'head'
        }, {
            code: 'EXP-HBD-DIPP',
            name: 'Dipping & jetting',
            unit: 'head'
        }, {
            code: 'EXP-HBD-VETY',
            name: 'Veterinary',
            unit: 'head'
        }, {
            code: 'EXP-HBD-SHER',
            name: 'Shearing',
            unit: 'head'
        }, {
            code: 'EXP-HBD-CRCH',
            name: 'Crutching',
            unit: 'head'
        }, {
            code: 'EXP-MRK-LSSF',
            name: 'Livestock sales marketing fees',
            incomeGroup: 'Livestock Sales',
            unit: '%'
        }, {
            code: 'EXP-MRK-LSPF',
            name: 'Livestock products marketing fees',
            incomeGroup: 'Product Sales',
            unit: '%'
        }, {
            code: 'EXP-MRK-HOTF',
            name: 'Horticulture marketing fees',
            incomeGroup: 'Fruit Sales',
            unit: '%'
        }, {
            code: 'EXP-MRK-CRPF',
            name: 'Crop marketing fees',
            incomeGroup: 'Crop Sales',
            unit: '%'
        }, {
            code: 'EXP-MRK-LSTP',
            name: 'Livestock transport',
            unit: 'head'
        }, {
            code: 'EXP-MRK-HOTT',
            name: 'Horticulture transport',
            unit: 't'
        }, {
            code: 'EXP-MRK-CRPT',
            name: 'Crop transport',
            unit: 't'
        }
    ], 'code');

    // todo: extend the categories with products for future features.
//    var _productsMap = {
//        'INC-PDS-MILK': {
//            code: 'INC-PDS-MILK-M13',
//            name: 'Cow Milk',
//            unit: 'l'
//        }
//    }

    var _categoryOptions = {
        crop: {
            income: {
                'Crop Sales': [
                    _categories['INC-HVT-CROP']
                ]
            },
            expenses: {
                'Preharvest': [
                    _categories['EXP-HVP-SEED'],
                    _categories['EXP-HVP-FERT'],
                    _categories['EXP-HVP-LIME'],
                    _categories['EXP-HVP-HERB'],
                    _categories['EXP-HVP-PEST'],
                    _categories['EXP-HVP-SPYA'],
                    _categories['EXP-HVP-INSH'],
                    _categories['EXP-HVP-INSM'],
                    _categories['EXP-HVP-HEDG']
                ],
                'Harvest': [
                    _categories['EXP-HVT-LABC']
                ],
                'Marketing': [
                    _categories['EXP-MRK-CRPF'],
                    _categories['EXP-MRK-CRPT']
                ],
                'Indirect Costs': [
                    _categories['EXP-IDR-FUEL'],
                    _categories['EXP-IDR-REPP'],
                    _categories['EXP-IDR-ELEC'],
                    _categories['EXP-IDR-WATR'],
                    _categories['EXP-IDR-LABP'],
                    _categories['EXP-IDR-SCHED'],
                    _categories['EXP-IDR-OTHER']
                ]
            }
        },
        horticulture: {
            income: {
                'Fruit Sales': [
                    _categories['INC-HVT-FRUT']
                ]
            },
            expenses: {
                'Preharvest': [
                    _categories['EXP-HVP-PLTM'],
                    _categories['EXP-HVP-FERT'],
                    _categories['EXP-HVP-LIME'],
                    _categories['EXP-HVP-HERB'],
                    _categories['EXP-HVP-PEST'],
                    _categories['EXP-HVP-SPYA'],
                    _categories['EXP-HVP-INSH'],
                    _categories['EXP-HVP-INSM']
                ],
                'Harvest': [
                    _categories['EXP-HVT-LABC'],
                    _categories['EXP-HVT-STOR'],
                    _categories['EXP-HVT-PAKM'],
                    _categories['EXP-HVT-DYCL'],
                    _categories['EXP-HVT-PAKC']
                ],
                'Marketing': [
                    _categories['EXP-MRK-HOTF'],
                    _categories['EXP-MRK-HOTT']
                ],
                'Indirect Costs': [
                    _categories['EXP-IDR-FUEL'],
                    _categories['EXP-IDR-REPP'],
                    _categories['EXP-IDR-ELEC'],
                    _categories['EXP-IDR-WATR'],
                    _categories['EXP-IDR-LABP'],
                    _categories['EXP-IDR-SCHED'],
                    _categories['EXP-IDR-LICS'],
                    _categories['EXP-IDR-INSA'],
                    _categories['EXP-IDR-OTHER']
                ]
            }
        },
        livestock: {
            Cattle: {
                income: {
                    'Livestock Sales': [
                        _categories['INC-LSS-CCALV'],
                        _categories['INC-LSS-CWEN'],
                        _categories['INC-LSS-CCOW'],
                        _categories['INC-LSS-CST18'],
                        _categories['INC-LSS-CST36'],
                        _categories['INC-LSS-CBULL']
                    ],
                    'Product Sales': [
                        _categories['INC-LSP-MILK']
                    ]
                },
                expenses: {
                    'Replacements': [
                        _categories['EXP-RPM-CCALV'],
                        _categories['EXP-RPM-CWEN'],
                        _categories['EXP-RPM-CCOW'],
                        _categories['EXP-RPM-CST18'],
                        _categories['EXP-RPM-CST36'],
                        _categories['EXP-RPM-CBULL']
                    ],
                    'Animal Feed': [
                        _categories['EXP-AMF-LICK']
                    ],
                    'Husbandry': [
                        _categories['EXP-HBD-VACC'],
                        _categories['EXP-HBD-DIPP'],
                        _categories['EXP-HBD-VETY']
                    ],
                    'Marketing': [
                        _categories['EXP-MRK-LSSF'],
                        _categories['EXP-MRK-LSPF'],
                        _categories['EXP-MRK-LSTP']
                    ],
                    'Indirect Costs': [
                        _categories['EXP-IDR-FUEL'],
                        _categories['EXP-IDR-REPP'],
                        _categories['EXP-IDR-ELEC'],
                        _categories['EXP-IDR-WATR'],
                        _categories['EXP-IDR-LABP'],
                        _categories['EXP-IDR-LICS'],
                        _categories['EXP-IDR-INSA'],
                        _categories['EXP-IDR-OTHER']
                    ]
                }
            },
            Goats: {
                income: {
                    'Livestock Sales': [
                        _categories['INC-LSS-GKID'],
                        _categories['INC-LSS-GWEAN'],
                        _categories['INC-LSS-GEWE'],
                        _categories['INC-LSS-GCAST'],
                        _categories['INC-LSS-GRAM']
                    ],
                    'Product Sales': [
                        _categories['INC-LSP-WOOL'],
                        _categories['INC-LSP-MILK']
                    ]
                },
                expenses: {
                    'Replacements': [
                        _categories['EXP-RPM-GKID'],
                        _categories['EXP-RPM-GWEAN'],
                        _categories['EXP-RPM-GEWE'],
                        _categories['EXP-RPM-GCAST'],
                        _categories['EXP-RPM-GRAM']
                    ],
                    'Animal Feed': [
                        _categories['EXP-AMF-LICK']
                    ],
                    'Husbandry': [
                        _categories['EXP-HBD-VACC'],
                        _categories['EXP-HBD-DIPP'],
                        _categories['EXP-HBD-VETY'],
                        _categories['EXP-HBD-SHER'],
                        _categories['EXP-HBD-CRCH']
                    ],
                    'Marketing': [
                        _categories['EXP-MRK-LSSF'],
                        _categories['EXP-MRK-LSPF'],
                        _categories['EXP-MRK-LSTP']
                    ],
                    'Indirect Costs': [
                        _categories['EXP-IDR-FUEL'],
                        _categories['EXP-IDR-REPP'],
                        _categories['EXP-IDR-ELEC'],
                        _categories['EXP-IDR-WATR'],
                        _categories['EXP-IDR-LABP'],
                        _categories['EXP-IDR-LICS'],
                        _categories['EXP-IDR-INSA'],
                        _categories['EXP-IDR-OTHER']
                    ]
                }
            },
            Sheep: {
                income: {
                    'Livestock Sales': [
                        _categories['INC-LSS-SLAMB'],
                        _categories['INC-LSS-SWEAN'],
                        _categories['INC-LSS-SEWE'],
                        _categories['INC-LSS-SWTH'],
                        _categories['INC-LSS-SRAM']
                    ],
                    'Product Sales': [
                        _categories['INC-LSP-WOOL'],
                        _categories['INC-LSP-MILK']
                    ]
                },
                expenses: {
                    'Replacements': [
                        _categories['EXP-RPM-SLAMB'],
                        _categories['EXP-RPM-SWEAN'],
                        _categories['EXP-RPM-SEWE'],
                        _categories['EXP-RPM-SWTH'],
                        _categories['EXP-RPM-SRAM']
                    ],
                    'Animal Feed': [
                        _categories['EXP-AMF-LICK']
                    ],
                    'Husbandry': [
                        _categories['EXP-HBD-VACC'],
                        _categories['EXP-HBD-DIPP'],
                        _categories['EXP-HBD-VETY'],
                        _categories['EXP-HBD-SHER'],
                        _categories['EXP-HBD-CRCH']
                    ],
                    'Marketing': [
                        _categories['EXP-MRK-LSSF'],
                        _categories['EXP-MRK-LSPF'],
                        _categories['EXP-MRK-LSTP']
                    ],
                    'Indirect Costs': [
                        _categories['EXP-IDR-FUEL'],
                        _categories['EXP-IDR-REPP'],
                        _categories['EXP-IDR-ELEC'],
                        _categories['EXP-IDR-WATR'],
                        _categories['EXP-IDR-LABP'],
                        _categories['EXP-IDR-LICS'],
                        _categories['EXP-IDR-INSA'],
                        _categories['EXP-IDR-OTHER']
                    ]
                }
            }
        }
    };

    var _representativeAnimal = {
        Cattle: 'Cow or heifer',
        Sheep: 'Ewe',
        Goats: 'Ewe (2-tooth plus)'
    };

    var _baseAnimal = {
        'Cattle (Extensive)': 'Cattle',
        'Cattle (Feedlot)': 'Cattle',
        'Cattle (Stud)': 'Cattle',
        'Sheep (Extensive)': 'Sheep',
        'Sheep (Feedlot)': 'Sheep',
        'Sheep (Stud)': 'Sheep'
    };

    var _conversionRate = {
        Cattle: {
            'Calf': 0.32,
            'Weaner calves': 0.44,
            'Cow or heifer': 1.1,
            'Steer (18  months plus)': 0.75,
            'Steer (3 years plus)': 1.1,
            'Bull (3 years plus)': 1.36
        },
        Sheep: {
            'Lamb': 0.08,
            'Weaner Lambs': 0.11,
            'Ewe': 0.16,
            'Wether (2-tooth plus)': 0.16,
            'Ram (2-tooth plus)': 0.23
        },
        Goats: {
            'Kid': 0.08,
            'Weaner kids': 0.12,
            'Ewe (2-tooth plus)': 0.17,
            'Castrate (2-tooth plus)': 0.17,
            'Ram (2-tooth plus)': 0.22
        }
    };

    var _commodityTypes = {
        crop: 'Field Crops',
        horticulture: 'Horticulture',
        livestock: 'Livestock'
    };

    // When updating, also update the _enterpriseTypes list in the legalEntityHelper (farmerHelperModule.js)
    var _commodities = {
        crop: ['Barley', 'Bean (Dry)', 'Bean (Green)', 'Canola', 'Cotton', 'Cowpea', 'Grain Sorghum', 'Groundnut', 'Lucerne', 'Maize (Fodder)', 'Maize (Green)', 'Maize (Seed)', 'Maize (White)', 'Maize (Yellow)', 'Oats', 'Potato', 'Rye', 'Soya Bean', 'Sunflower', 'Sweet Corn', 'Tobacco', 'Triticale', 'Wheat'],
        horticulture: ['Almond', 'Apple', 'Apricot', 'Avocado', 'Banana', 'Blueberry', 'Cherry', 'Chicory', 'Chili', 'Citrus (Hardpeel)', 'Citrus (Softpeel)', 'Coffee', 'Fig', 'Garlic', 'Grape (Table)', 'Grape (Wine)', 'Guava', 'Hops', 'Kiwi', 'Lemon', 'Lentil', 'Macadamia Nut', 'Mango', 'Melon', 'Nectarine', 'Olive', 'Onion', 'Orange', 'Papaya', 'Pea', 'Peach', 'Peanut', 'Pear', 'Pecan Nut', 'Persimmon', 'Pineapple', 'Pistachio Nut', 'Plum', 'Pomegranate', 'Prune', 'Pumpkin', 'Quince', 'Rooibos', 'Strawberry', 'Sugarcane', 'Tomato', 'Watermelon'],
        livestock: ['Cattle (Extensive)', 'Cattle (Feedlot)', 'Cattle (Stud)', 'Chicken (Broilers)', 'Chicken (Layers)', 'Dairy', 'Game', 'Goats', 'Horses', 'Ostrich', 'Pigs', 'Sheep (Extensive)', 'Sheep (Feedlot)', 'Sheep (Stud)']
};

    var _horticultureStages = {
        'Apple': ['0-3 years', '3-10 years', '10-15 years', '15-25 years', '25+ years'],
        'Apricot': ['0-2 years', '2-5 years', '5-15 years', '15-18 years', '18+ years'],
        'Avocado': ['0-1 years', '1-3 years', '3-5 years', '5-8 years', '8+ years'],
        'Blueberry': ['0-1 years', '1-3 years', '3-5 years', '5-8 years', '8+ years'],
        'Citrus (Hardpeel)': ['0-1 years', '1-4 years', '4-8 years', '8-20 years', '20-25 years', '25+ years'],
        'Citrus (Softpeel)': ['0-1 years', '1-4 years', '4-8 years', '8-20 years', '20-25 years', '25+ years'],
        'Fig': ['0-1 years', '1-3 years', '3-6 years', '6-18 years', '18-30 years', '30+ years'],
        'Grape (Table)': ['0-3 years', '3-10 years', '10-15 years', '15-25 years', '25+ years'],
        'Grape (Wine)': ['0-3 years', '3-10 years', '10-15 years', '15-25 years', '25+ years'],
        'Macadamia Nut': ['0-1 years', '1-3 years', '3-6 years', '6-9 years','10+ years'],
        'Mango': ['0-1 years', '1-3 years', '3-5 years', '5-18 years', '18-30 years', '30+ years'],
        'Nectarine': ['0-2 years', '2-5 years', '5-15 years', '15-18 years', '18+ years'],
        'Olive': ['0-1 years', '1-3 years', '3-5 years', '5-10 years', '10+ years'],
        'Orange': ['0-1 years', '1-4 years', '4-8 years', '8-20 years', '20-25 years', '25+ years'],
        'Pecan Nut': ['0-1 years', '1-3 years', '3-7 years', '7-10 years', '10+ years'],
        'Peach': ['0-2 years', '2-5 years', '5-15 years', '15-18 years', '18+ years'],
        'Pear': ['0-3 years', '3-10 years', '10-15 years', '15-25 years', '25+ years'],
        'Persimmon': ['0-1 years', '1-4 years', '4-12 years', '12-20 years', '20+ years'],
        'Plum': ['0-2 years', '2-5 years', '5-15 years', '15-18 years', '18+ years'],
        'Pomegranate': ['0-1 years', '1-3 years', '3-5 years', '5-18 years', '18-30 years', '30+ years'],
        'Rooibos': ['0-1 years', '1-2 years', '2-4 years', '4-5 years', '5+ years']
    };

    /*
     * Extended Budgets
     */
    var _cycleMonths = [
        {
            id: 0,
            name: 'January',
            shortname: 'Jan'
        }, {
            id: 1,
            name: 'February',
            shortname: 'Feb'
        }, {
            id: 2,
            name: 'March',
            shortname: 'Mar'
        }, {
            id: 3,
            name: 'April',
            shortname: 'Apr'
        }, {
            id: 4,
            name: 'May',
            shortname: 'May'
        }, {
            id: 5,
            name: 'June',
            shortname: 'Jun'
        }, {
            id: 6,
            name: 'July',
            shortname: 'Jul'
        }, {
            id: 7,
            name: 'August',
            shortname: 'Aug'
        }, {
            id: 8,
            name: 'September',
            shortname: 'Sep'
        }, {
            id: 9,
            name: 'October',
            shortname: 'Oct'
        }, {
            id: 10,
            name: 'November',
            shortname: 'Nov'
        }, {
            id: 11,
            name: 'December',
            shortname: 'Dec'
        }];

    var _productsMap = {
        'INC-PDS-MILK': {
            code: 'INC-PDS-MILK-M13',
            name: 'Cow Milk',
            unit: 'Litre'
        }
    };

    function checkBudgetTemplate (budget) {
        budget.data = budget.data || {};
        budget.data.details = budget.data.details || {};
        budget.data.details.cycleStart = budget.data.details.cycleStart || 0;
        budget.data.sections = budget.data.sections || [];
        budget.data.schedules = budget.data.schedules || {};
    }

    function getBaseAnimal (commodityType) {
        return _baseAnimal[commodityType] || commodityType;
    }

    function checkBudgetSection (budget, stage) {
        angular.forEach(['income', 'expenses'], function (section) {
            var foundSection = underscore.findWhere(budget.data.sections,
                (stage === undefined ? {code: _sections[section].code} : {code: _sections[section].code, horticultureStage: stage}));

            if (foundSection === undefined) {
                foundSection = {
                    code: _sections[section].code,
                    name: _sections[section].name,
                    productCategoryGroups: [],
                    total: {
                        value: 0
                    }
                };

                if (stage !== undefined) {
                    foundSection.horticultureStage = stage;
                }

                budget.data.sections.push(foundSection);
            }
        });

        return budget;
    }

    return {
        listServiceMap: function () {
            return _listServiceMap;
        },
        commodityTypes: function() {
            return _commodityTypes;
        },
        commodities: function() {
            return _commodities;
        },
        cycleMonths: function () {
            return _cycleMonths;
        },
        getRepresentativeAnimal: function(commodityType) {
            return _representativeAnimal[getBaseAnimal(commodityType)];
        },
        getConversionRate: function(commodityType) {
            return _conversionRate[getBaseAnimal(commodityType)][_representativeAnimal[getBaseAnimal(commodityType)]];
        },
        getConversionRates: function(commodityType) {
            return _conversionRate[getBaseAnimal(commodityType)];
        },
        getCommodities: function (type) {
            return _commodities[type] || '';
        },
        getHorticultureStages: function(commodityType) {
            return _horticultureStages[commodityType] || [];
        },
        getHorticultureStage: function (commodityType, asset) {
            var stages = this.getHorticultureStages(commodityType),
                result = (stages.length > 0 ? stages[0] : undefined);

            if (asset && asset.data.establishedDate) {
                var assetAge = moment().diff(asset.data.establishedDate, 'years', true);

                angular.forEach(stages, function (stage) {
                    var matchYears = stage.match(/\d+/g);

                    if ((matchYears.length == 1 && matchYears[0] <= assetAge) || (matchYears.length == 2 && matchYears[0] <= assetAge && matchYears[1] >= assetAge)) {
                        result = stage;
                    }
                });
            }

            return result;
        },
        getCategories: function (budget, assetType, commodityType, sectionType, horticultureStage) {
            var categories = {};

            if(assetType == 'livestock' && _categoryOptions[assetType][getBaseAnimal(commodityType)]) {
                categories = angular.copy(_categoryOptions[assetType][getBaseAnimal(commodityType)][sectionType]) || {};
            }

            if(assetType == 'crop' && _categoryOptions[assetType][sectionType]) {
                categories = angular.copy(_categoryOptions[assetType][sectionType]) || {};
            }

            if(assetType == 'horticulture' && _categoryOptions[assetType][sectionType]) {
                categories = angular.copy(_categoryOptions[assetType][sectionType]) || {};
            }

            // remove the income / expense items which exists in the budget, from the categories
            angular.forEach(budget.data.sections, function(section, i) {
                if(section.name.toLowerCase().indexOf(sectionType) > -1) {
                    if(budget.assetType != 'horticulture' || (budget.assetType == 'horticulture' && section.horticultureStage == horticultureStage)) {
                        angular.forEach(section.productCategoryGroups, function(group, j) {
                            angular.forEach(group.productCategories, function(category, k) {
                                angular.forEach(categories[group.name], function(option, l) {
                                    if(option.code == category.code) {
                                        categories[group.name].splice(l, 1);
                                    }
                                });
                            });
                        });
                    }
                }
            });

            var result = [];

            for(var label in categories) {
                categories[label].forEach(function(option, i) {
                    option.groupBy = label;
                    result.push(option);
                });
            }

            return result;
        },
        getModelType: function (type) {
            return _modelTypes[type] || '';
        },

        validateBudgetData: function (budget, stage) {
            checkBudgetTemplate(budget);
            checkBudgetSection(budget, stage);
            return this.calculateTotals(budget);
        },
        initNewSections: function (budget, stage) {
            return checkBudgetSection(budget, stage);
        },
        addCategoryToBudget: function (budget, sectionName, groupName,  categoryCode, horticultureStage) {
            var category = angular.copy(_categories[categoryCode]);

            if(budget.assetType == 'livestock') {
                category.valuePerLSU = 0;
                if(_conversionRate[getBaseAnimal(budget.commodityType)][category.name]) {
                    category.conversionRate = _conversionRate[getBaseAnimal(budget.commodityType)][category.name];
                }
            }

            var noSuchSection = true;
            var noSuchGroup = true;
            var sectionIndex = -1;
            var groupIndex = -1;
            var targetSection = angular.copy(_sections[sectionName]);
            var targetGroup = angular.copy(_groups[groupName]);

            targetSection.productCategoryGroups = [];
            targetGroup.productCategories = [];

            angular.forEach(budget.data.sections, function(section, i) {
                if((budget.assetType != 'horticulture' && section.name == targetSection.name) || (budget.assetType == 'horticulture' && section.name == targetSection.name && section.horticultureStage == horticultureStage)) {
                    noSuchSection = false;
                    sectionIndex = i;
                    targetSection = section;
                    section.productCategoryGroups.forEach(function(group, j) {
                        if(group.name == groupName) {
                            noSuchGroup = false;
                            groupIndex = j;
                            targetGroup = group;
                        }
                    });
                }
            });

            // add new section and/or new group
            if(noSuchSection) {
                if(budget.assetType == 'horticulture' && horticultureStage) {
                    targetSection.horticultureStage = horticultureStage;
                }

                budget.data.sections.push(targetSection);
                sectionIndex = budget.data.sections.length - 1;
            }

            if(noSuchGroup) {
                budget.data.sections[sectionIndex].productCategoryGroups.push(targetGroup);
                groupIndex = budget.data.sections[sectionIndex].productCategoryGroups.length - 1;
            }

            budget.data.sections[sectionIndex].productCategoryGroups[groupIndex].productCategories.push(category);

            return budget;
        },
        calculateTotals: function (budget) {
            checkBudgetTemplate(budget);

            if(budget.assetType == 'livestock') {
                budget.data.details.calculatedLSU = budget.data.details.herdSize *
                    _conversionRate[getBaseAnimal(budget.commodityType)][_representativeAnimal[getBaseAnimal(budget.commodityType)]];
            }

            var income = 0;
            var costs = 0;
            budget.data.sections.forEach(function(section, i) {
                section.total = {
                    value: 0
                };

                if(budget.assetType == 'livestock') {
                    section.total.valuePerLSU = 0;
                }

                section.productCategoryGroups.forEach(function(group, j) {
                    group.total = {
                        value: 0
                    };

                    if(budget.assetType == 'livestock') {
                        group.total.valuePerLSU = 0;
                    }

                    group.productCategories.forEach(function(category, k) {
                        if(category.unit == '%') {
                            var groupSum = underscore
                                .chain(budget.data.sections)
                                .filter(function (groupingSection) {
                                    return (budget.assetType != 'horticulture' || groupingSection.horticultureStage === section.horticultureStage);
                                })
                                .pluck('productCategoryGroups')
                                .flatten()
                                .reduce(function(total, group) {
                                    return (group.name == category.incomeGroup && group.total !== undefined ? total + group.total.value : total);
                                }, 0)
                                .value();

                            category.value = (category.pricePerUnit || 0) * groupSum / 100;
                        } else {
                            category.quantity = (category.unit == 'Total' ? 1 : category.quantity);
                            category.value = (category.pricePerUnit || 0) * (category.quantity || 0);
                        }

                        if(budget.assetType == 'livestock') {
                            category.valuePerLSU = (category.pricePerUnit || 0) / _conversionRate[getBaseAnimal(budget.commodityType)][category.name];
                            group.total.valuePerLSU += category.valuePerLSU;
                        }

                        var schedule = (category.schedule && budget.data.schedules[category.schedule] ?
                            budget.data.schedules[category.schedule] :
                            underscore.range(12).map(function () {
                                return 100 / 12;
                            }));

                        category.valuePerMonth = underscore.map(schedule, function (month) {
                            return (month / 100) * category.value;
                        });

                        group.total.value += category.value;
                        group.total.valuePerMonth = (group.total.valuePerMonth ?
                            underscore.map(group.total.valuePerMonth, function (month, i) {
                                return month + category.valuePerMonth[i];
                            }) : category.valuePerMonth);
                    });

                    section.total.value += group.total.value;
                    section.total.valuePerMonth = (section.total.valuePerMonth ?
                        underscore.map(section.total.valuePerMonth, function (month, i) {
                            return month + group.total.valuePerMonth[i];
                        }) : group.total.valuePerMonth);

                    if(budget.assetType == 'livestock') {
                        section.total.valuePerLSU += group.total.valuePerLSU;
                    }
                });

                if(section.name == 'Income') {
                    income = section.total.value;
                } else {
                    costs += section.total.value;
                }
            });

            budget.data.details.grossProfit = income - costs;

            if(budget.assetType == 'horticulture') {
                budget.data.details.grossProfitByStage = {};

                angular.forEach(_horticultureStages[budget.commodityType], function(stage) {
                    budget.data.details.grossProfitByStage[stage] = underscore
                        .chain(budget.data.sections)
                        .where({horticultureStage: stage})
                        .reduce(function (total, section) {
                            return (section.name === 'Income' ? total + section.total.value :
                                (section.name === 'Expenses' ? total - section.total.value : total));
                        }, 0)
                        .value();
                });
            }

            if(budget.assetType == 'livestock') {
                budget.data.details.grossProfitPerLSU = budget.data.details.grossProfit / budget.data.details.calculatedLSU;
            }

            return budget;
        }
    }
}]);
var sdkHelperExpenseApp = angular.module('ag.sdk.helper.expense', ['ag.sdk.library']);

sdkHelperExpenseApp.factory('expenseHelper', ['underscore', function (underscore) {
    var _expenseTypes = {
        area: 'Area',
        distance: 'Distance',
        hours: 'Hours'
    };

    var _expenseUnits = {
        area: 'Ha',
        distance: 'km',
        hours: 'h'
    };

    var _expenseAction = {
        area: 'inspected',
        distance: 'travelled',
        hours: 'worked'
    };

    return {
        expenseTypes: function () {
            return _expenseTypes;
        },

        getExpenseTitle: function (type) {
            return _expenseTypes[type] || '';
        },
        getExpenseUnit: function (type) {
            return _expenseUnits[type] || '';
        },
        getExpenseAction: function (type) {
            return _expenseAction[type] || '';
        }
    };
}]);
var sdkHelperFarmerApp = angular.module('ag.sdk.helper.farmer', ['ag.sdk.interface.map', 'ag.sdk.helper.attachment', 'ag.sdk.library']);

sdkHelperFarmerApp.factory('farmerHelper', ['attachmentHelper', 'geoJSONHelper', function(attachmentHelper, geoJSONHelper) {
    var _listServiceMap = function (item) {
        typeColorMap = {
            'common': 'label-danger'
        };
        var flagLabels = _.chain(item.flags)
            .groupBy('type')
            .map(function (group, type) {
                return {
                    label: typeColorMap[type],
                    count: group.length
                }
            })
            .value();

        return {
            id: item.id || item.__id,
            title: item.name,
            subtitle: item.operationType,
            thumbnailUrl: attachmentHelper.findSize(item, 'thumb', 'img/profile-business.png'),
            searchingIndex: searchingIndex(item),
            flags: flagLabels
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

    var _businessEntityTypes = ['Commercial', 'Recreational', 'Smallholder'];
    var _businessEntityDescriptions = {
        Commercial: 'Large scale agricultural production',
        Recreational: 'Leisure or hobby farming',
        Smallholder: 'Small farm, limited production'
    };

    return {
        listServiceMap: function() {
            return _listServiceMap;
        },
        businessEntityTypes: function() {
            return _businessEntityTypes;
        },

        getBusinessEntityDescription: function (businessEntity) {
            return _businessEntityDescriptions[businessEntity] || '';
        },
        getFarmerLocation: function(farmer) {
            if (farmer) {
                if (farmer.data && farmer.data.loc) {
                    return (farmer.data.loc.geometry ? farmer.data.loc.geometry.coordinates : farmer.data.loc.coordinates);
                } else if (farmer.legalEntities) {
                    var geojson = geoJSONHelper();

                    angular.forEach(farmer.legalEntities, function (entity) {
                        if (entity.assets) {
                            angular.forEach(entity.assets, function (asset) {
                                geojson.addGeometry(asset.data.loc);
                            });
                        }
                    });

                    return geojson.getCenter().reverse();
                }
            }

            return null;
        }
    }
}]);

sdkHelperFarmerApp.factory('legalEntityHelper', ['attachmentHelper', 'underscore', function (attachmentHelper, underscore) {
    var _listServiceMap = function(item) {
        var map = {
            id: item.id || item.__id,
            title: item.name,
            subtitle: item.type
        };

        map.thumbnailUrl = attachmentHelper.findSize(item, 'thumb', 'img/profile-user.png');

        return map;
    };

    var _legalEntityTypes = ['Individual', 'Sole Proprietary', 'Joint account', 'Partnership', 'Close Corporation', 'Private Company', 'Public Company', 'Trust', 'Non-Profitable companies', 'Cooperatives', 'In- Cooperatives', 'Other Financial Intermediaries'];

    // When updating, also update the _commodities list in the enterpriseBudgetHelper
    var _enterpriseTypes = {
        'Field Crops': ['Barley', 'Bean (Dry)', 'Bean (Green)', 'Canola', 'Cotton', 'Cowpea', 'Grain Sorghum', 'Groundnut', 'Lucerne', 'Maize (Fodder)', 'Maize (Green)', 'Maize (Seed)', 'Maize (White)', 'Maize (Yellow)', 'Oats', 'Potato', 'Rye', 'Soya Bean', 'Sunflower', 'Sweet Corn', 'Tobacco', 'Triticale', 'Wheat'],
        'Horticulture': ['Almond', 'Apple', 'Apricot', 'Avocado', 'Banana', 'Cherry', 'Chicory', 'Chili', 'Citrus (Hardpeel)', 'Citrus (Softpeel)', 'Coffee', 'Fig', 'Garlic', 'Grapes (Table)', 'Grapes (Wine)', 'Guava', 'Hops', 'Kiwi', 'Lemon', 'Lentil', 'Macadamia Nut', 'Mango', 'Melon', 'Nectarine', 'Olive', 'Onion', 'Orange', 'Papaya', 'Pea', 'Peach', 'Peanut', 'Pear', 'Pecan Nut', 'Persimmon', 'Pineapple', 'Pistachio Nut', 'Plum', 'Pomegranate', 'Prune', 'Pumpkin', 'Quince', 'Rooibos', 'Strawberry', 'Sugarcane', 'Tomato', 'Watermelon'],
        'Livestock': ['Cattle (Extensive)', 'Cattle (Feedlot)', 'Cattle (Stud)', 'Chicken (Broilers)', 'Chicken (Layers)', 'Dairy', 'Game', 'Goats', 'Horses', 'Ostrich', 'Pigs', 'Sheep (Extensive)', 'Sheep (Feedlot)', 'Sheep (Stud)']
    };

    /**
     * @name EnterpriseEditor
     * @param enterprises
     * @constructor
     */
    function EnterpriseEditor (enterprises) {
        this.enterprises = underscore.map(enterprises || [], function (item) {
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
        isCroppingPotentialRequired: function (landUse) {
            return (landUse == 'Cropland');
        },
        isTerrainRequired: function (landUse) {
            return (landUse == 'Grazing');
        }
    }
});

sdkHelperFarmerApp.factory('farmHelper', ['geoJSONHelper', 'geojsonUtils', 'underscore', function(geoJSONHelper, geojsonUtils, underscore) {
    var _listServiceMap = function(item) {
        return {
            id: item.id || item.__id,
            title: item.name
        };
    };

    return {
        listServiceMap: function () {
            return _listServiceMap;
        },

        containsPoint: function (geometry, assets, farm) {
            var found = false;

            angular.forEach(assets, function (asset) {
                if(asset.type == 'farmland' && asset.farmId && asset.farmId == farm.id) {
                    if (geojsonUtils.pointInPolygon(geometry, asset.data.loc)) {
                        found = true;
                    }
                }
            });

            return found;
        },
        getCenter: function (farmer, farm) {
            var geojson = geoJSONHelper();

            underscore
                .chain(farmer.legalEntities)
                .pluck('assets')
                .flatten()
                .compact()
                .each(function (asset) {
                    if(asset.type == 'farmland' && asset.farmId && asset.farmId == farm.id) {
                        geojson.addGeometry(asset.data.loc);
                    }
                });

            return geojson.getCenterAsGeojson();
        },

        validateFieldName: function (farm, newField, oldField) {
            newField.fieldName = (newField.fieldName ? newField.fieldName.trim().replace(/[^0-9A-Za-z\s]/g, '') : '');
            var foundField = underscore.find(farm.data.fields, function (field) {
                return (field.fieldName.toUpperCase().replace(/[^0-9A-Z]/g, '') === newField.fieldName.toUpperCase().replace(/[^0-9A-Z]/g, ''))
            });

            return (angular.isObject(foundField) ? (angular.isObject(oldField) && foundField.fieldName === oldField.fieldName) : true);
        }
    }
}]);

var sdkHelperFavouritesApp = angular.module('ag.sdk.helper.favourites', ['ag.sdk.helper.document', 'ag.sdk.helper.task']);

sdkHelperFavouritesApp.factory('activityHelper', ['documentHelper', function(documentHelper) {
    var _listServiceMap = function(item) {
        var map = {
            id: item.id || item.__id,
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
        'share': 'of',
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
        return {
            id: item.id || item.__id,
            title: item.sender,
            subtitle: item.message,
            state: _notificationState(item.notificationType, item.dataType)
        };
    };

    var _notificationState = function (notificationType, dataType) {
        var state = (_notificationMap[notificationType] ? _notificationMap[notificationType].state : 'view');

        return ('notification.' + state + '-' + dataType);
    };

    var _notificationMap = {
        'reassign': {
            title: 'Reassign',
            state: 'manage'
        },
        'import': {
            title: 'Import',
            state: 'import'
        },
        'view': {
            title: 'View',
            state: 'view'
        },
        'reject': {
            title: 'Rejected',
            state: 'view'
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

var sdkHelperMerchantApp = angular.module('ag.sdk.helper.merchant', ['ag.sdk.library']);

sdkHelperMerchantApp.factory('merchantHelper', ['underscore', function (underscore) {
    var _listServiceMap = function (item) {
        return {
            id: item.id || item.__id,
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

        this.services = underscore.map(services || [], function (item) {
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

var sdkHelperProductionPlanApp = angular.module('ag.sdk.helper.production-plan', []);

sdkHelperProductionPlanApp.factory('productionPlanHelper', [function () {
    var _assetTypeMap = {
        'crop': ['Cropland'],
        'livestock': ['Grazing', 'Planted Pastures', 'Conservation'],
        'horticulture': ['Horticulture (Perennial)']
    };

    return {
        isFieldApplicable: function (field) {
            return (this.getAssetType(field) !== undefined);
        },

        getAssetType: function (field) {
            var assetType;

            angular.forEach(_assetTypeMap, function (fieldTypes, type) {
                if (fieldTypes.indexOf(field.landUse) !== -1) {
                    assetType = type;
                }
            });

            return assetType;
        }
    }
}]);
var sdkHelperRegionApp = angular.module('ag.sdk.helper.region', []);

sdkHelperRegionApp.factory('regionHelper', [function() {
    var _listServiceMap = function(item) {
        var map = {
            title: item.name,
            subtitle: item.region.province,
            region: item.region.name
        };
        if(item.subRegionNumber) {
            map.subtitle += ' - ' +item.subRegionNumber;
        }
        if(item.plotCode) {
            map.subtitle += ' - ' +item.plotCode;
        }

        return map;
    };

    return {
        listServiceMap: function() {
            return _listServiceMap;
        }
    }
}]);
var sdkHelperTaskApp = angular.module('ag.sdk.helper.task', ['ag.sdk.authorization', 'ag.sdk.utilities', 'ag.sdk.interface.list', 'ag.sdk.library']);

sdkHelperTaskApp.provider('taskHelper', ['underscore', function (underscore) {
    var _validTaskStatuses = ['assigned', 'in progress', 'in review'];

    var _listServiceMap = function (item) {
        var title = item.documentKey;
        var mappedItems = underscore.filter(item.subtasks, function (task) {
            return (task.type && _validTaskStatuses.indexOf(task.status) !== -1 && task.type == 'child');
        }).map(function (task) {
                return {
                    id: task.id || item.__id,
                    title: item.organization.name,
                    subtitle: _getTaskTitle(task.todo, task),
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

    var _getTaskTitle = function (taskType, task) {
        var taskMap = _taskTodoMap[taskType];

        return (taskMap !== undefined ? (typeof taskMap.title == 'string' ? taskMap.title : taskMap.title(task)) : undefined);
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
        _taskTodoMap = underscore.extend(_taskTodoMap, tasks);
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

            filterTasks: function (tasks, excludeStatus) {
                excludeStatus = excludeStatus || [];

                return underscore.filter(tasks, function (task) {
                    return (_getTaskState(task.todo) !== undefined && underscore.contains(excludeStatus, task.status) == false);
                });
            },
            updateListService: function (id, todo, tasks, organization) {
                var currentUser = authorization.currentUser();
                var task = underscore.findWhere(tasks, {id: id});

                listService.addItems(dataMapService({
                    id: task.parentTaskId,
                    documentKey: task.documentKey,
                    type: 'parent',
                    todo: todo,
                    organization: organization,
                    subtasks : underscore.filter(tasks, function (task) {
                        return (task && task.assignedTo == currentUser.username);
                    })
                }, _listServiceMap));

                if (task && _validTaskStatuses.indexOf(task.status) === -1) {
                    listService.removeItems(task.id);
                }
            }
        }
    }];
}]);

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

var sdkHelperTeamApp = angular.module('ag.sdk.helper.team', ['ag.sdk.library']);

sdkHelperTeamApp.factory('teamHelper', ['underscore', function (underscore) {

    /**
     * @name TeamEditor
     * @param availableTeams
     * @param teams
     * @constructor
     */
    function TeamEditor (/**Array=*/availableTeams, /**Array=*/teams) {
        availableTeams = availableTeams || [];
        teams = teams || [];

        this.teams = underscore.map(teams, function (item) {
            return (item.name ? item.name : item);
        });

        this.teamsDetails = angular.copy(teams);

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

        if (this.teams.indexOf(team) == -1) {
            this.teams.push(team);
            this.teamsDetails.push(underscore.findWhere(this.selection.list, {name: team}));
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
            this.selection.text = '';
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
            id: item.id || item.__id,
            title: item.firstName + ' ' + item.lastName,
            subtitle: item.position,
            teams: item.teams
        }
    };

    var _languageList = ['English'];

    return {
        listServiceMap: function() {
            return _listServiceMap;
        },
        languageList: function() {
            return _languageList;
        }
    }
}]);

var sdkInterfaceListApp = angular.module('ag.sdk.interface.list', ['ag.sdk.id']);

sdkInterfaceListApp.factory('listService', ['$rootScope', 'objectId', function ($rootScope, objectId) {
    var _button,
        _groupby,
        _infiniteScroll,
        _search,
        _title;

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

    var _setTitle = function (title) {
        if (_title !== title) {
            _title = (title ? title : undefined);

            $rootScope.$broadcast('list::title__changed', _title);
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
                _title = undefined;

                _items = [];
                _activeItemId = undefined;
            }

            _setButton(config.button);
            _setGroupby(config.groupby);
            _setScroll(config.infiniteScroll);
            _setSearch(config.search);
            _setTitle(config.title);
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
        title: function(title) {
            if(arguments.length == 1) {
                _setTitle(title);
            }

            return _title;
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
        addItems: function(items, top) {
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
                            if (top === true) {
                                _items.unshift(item);
                            } else {
                                _items.push(item);
                            }
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

var sdkInterfaceMapApp = angular.module('ag.sdk.interface.map', ['ag.sdk.utilities', 'ag.sdk.id', 'ag.sdk.config', 'ag.sdk.library']);

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
        getGeometryType: function () {
            return (this._json.geometry ? this._json.geometry.type : this._json.type);
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
        getCenter: function (bounds) {
            bounds = bounds || this.getBounds();

            var lat1 = 0, lat2 = 0,
                lng1 = 0, lng2 = 0;

            angular.forEach(bounds, function(coordinate, index) {
                if (index == 0) {
                    lat1 = lat2 = coordinate[0];
                    lng1 = lng2 = coordinate[1];
                } else {
                    lat1 = (lat1 < coordinate[0] ? lat1 : coordinate[0]);
                    lat2 = (lat2 < coordinate[0] ? coordinate[0] : lat2);
                    lng1 = (lng1 < coordinate[1] ? lng1 : coordinate[1]);
                    lng2 = (lng2 < coordinate[1] ? coordinate[1] : lng2);
                }
            });

            return [lat1 + ((lat2 - lat1) / 2), lng1 + ((lng2 - lng1) / 2)];
        },
        getCenterAsGeojson: function (bounds) {
            bounds = bounds || this.getBounds();

            return {
                coordinates: this.getCenter(bounds).reverse(),
                type: 'Point'
            }
        },
        getProperty: function (name) {
            return (this._json && this._json.properties ? this._json.properties[name] : undefined);
        },
        setCoordinates: function (coordinates) {
            if (this._json && this._json.type != 'FeatureCollection') {
                if (this._json.geometry) {
                    this._json.geometry.coordinates = coordinates;
                } else {
                    this._json.coordinates = coordinates;
                }
            }
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
        },
        formatGeoJson: function (geoJson, toType) {
            // TODO: REFACTOR
            //todo: maybe we can do the geoJson formation to make it standard instead of doing the validation.
            if(toType.toLowerCase() == 'point') {
                switch (geoJson && geoJson.type && geoJson.type.toLowerCase()) {
                    // type of Feature
                    case 'feature':
                        if(geoJson.geometry && geoJson.geometry.type && geoJson.geometry.type == 'Point') {
                            console.log(geoJson.geometry);
                            return geoJson.geometry;
                        }
                        break;
                    // type of FeatureCollection
                    case 'featurecollection':
                        break;
                    // type of GeometryCollection
                    case 'geometrycollection':
                        break;
                    // type of Point, MultiPoint, LineString, MultiLineString, Polygon, MultiPolygon
                    default:
                        break;
                }
            }

            return geoJson;
        },
        validGeoJson: function (geoJson, typeRestriction) {
            // TODO: REFACTOR
            var validate = true;
            if(!geoJson || geoJson.type == undefined || typeof geoJson.type != 'string' || (typeRestriction && geoJson.type.toLowerCase() != typeRestriction)) {
                return false;
            }

            // valid type, and type matches the restriction, then validate the geometry / features / geometries / coordinates fields
            switch (geoJson.type.toLowerCase()) {
                // type of Feature
                case 'feature':
                    break;
                // type of FeatureCollection
                case 'featurecollection':
                    break;
                // type of GeometryCollection
                case 'geometrycollection':
                    break;
                // type of Point, MultiPoint, LineString, MultiLineString, Polygon, MultiPolygon
                default:
                    if(!geoJson.coordinates || !geoJson.coordinates instanceof Array) {
                        return false;
                    }
                    var flattenedCoordinates = _.flatten(geoJson.coordinates);
                    flattenedCoordinates.forEach(function(element, i) {
                        if(typeof element != 'number') {
                            validate = false;
                        }
                    });
                    break;
            }

            return validate;
        }
    };

    return function (json, properties) {
        return new GeojsonHelper(json, properties);
    }
});

sdkInterfaceMapApp.provider('mapMarkerHelper', ['underscore', function (underscore) {
    var _createMarker = function (name, state, options) {
        return underscore.defaults(options || {}, {
            iconUrl: 'img/icons/' + name + '.' + (state ? state : 'default') + '.png',
            shadowUrl: 'img/icons/' + name + '.shadow.png',
            iconSize: [48, 48],
            iconAnchor: [22, 42],
            shadowSize: [73, 48],
            shadowAnchor: [22, 40],
            labelAnchor: [12, -24]
        });
    };

    var _getMarker = this.getMarker = function (name, state, options) {
        if (typeof state == 'object') {
            options = state;
            state = 'default';
        }

        return  _createMarker(name, state, options);
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
}]);

sdkInterfaceMapApp.provider('mapStyleHelper', ['mapMarkerHelperProvider', function (mapMarkerHelperProvider) {
    var _markerIcons = {
        asset: mapMarkerHelperProvider.getMarkerStates('asset', ['default', 'success', 'error']),
        zone: mapMarkerHelperProvider.getMarkerStates('marker', ['default', 'success', 'error'])
    };

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
                icon: _markerIcons.asset.success,
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
            cropland: {
                icon: _markerIcons.asset.success,
                style: {
                    weight: 2,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#4573d5",
                    fillOpacity: 0.8
                }
            },
            pasture: {
                icon: _markerIcons.asset.success,
                style: {
                    weight: 2,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#ffde40",
                    fillOpacity: 0.8
                }
            },
            'permanent crop': {
                icon: _markerIcons.asset.success,
                style: {
                    weight: 2,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#487811",
                    fillOpacity: 0.8
                }
            },
            plantation: {
                icon: _markerIcons.asset.success,
                style: {
                    weight: 2,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#00e64a",
                    fillOpacity: 0.8
                }
            },
            zone: {
                icon: _markerIcons.zone.success,
                style: {
                    weight: 4,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#ff6666",
                    fillOpacity: 0.8
                }
            },
            farmgate: {
                icon: 'success'
            },
            homestead: {
                icon: 'success'
            },
            search: {
                style: {
                    weight: 2,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#f7b2bf",
                    fillOpacity: 0.8,
                    dashArray: "5,5"
                }
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
                icon: _markerIcons.asset.default,
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
            cropland: {
                icon: _markerIcons.asset.default,
                style: {
                    weight: 1,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#4573d5",
                    fillOpacity: 0.4
                }
            },
            pasture: {
                icon: _markerIcons.asset.default,
                style: {
                    weight: 1,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#ffde40",
                    fillOpacity: 0.4
                }
            },
            'permanent crop': {
                icon: _markerIcons.asset.default,
                style: {
                    weight: 1,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#487811",
                    fillOpacity: 0.4
                }
            },
            plantation: {
                icon: _markerIcons.asset.default,
                style: {
                    weight: 1,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#00e64a",
                    fillOpacity: 0.4
                }
            },
            zone: {
                icon: _markerIcons.zone.default,
                style: {
                    weight: 2,
                    color: 'white',
                    opacity: 0.5,
                    fillColor: "#ff6666",
                    fillOpacity: 0.5
                }
            },
            farmgate: {
                icon: 'default'
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

        if (typeof mapStyle.icon == 'string') {
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
sdkInterfaceMapApp.provider('mapboxService', ['underscore', function (underscore) {
    var _defaultConfig = {
        options: {
            attributionControl: true,
            layersControl: true,
            scrollWheelZoom: false,
            zoomControl: true
        },
        layerControl: {
            baseTile: 'Agriculture',
            baseLayers: {
                'Agriculture': {
                    type: 'mapbox',
                    tiles: {
                        'autoscale': true,
                        'bounds': [-180, -85, 180, 85],
                        'cache': {
                            'maxzoom': 16,
                            'minzoom': 5
                        },
                        'center': [24.631347656249993, -28.97931203672245, 6],
                        'data': ['https://a.tiles.mapbox.com/v3/agrista.map-65ftbmpi/markers.geojsonp'],
                        'geocoder': 'https://a.tiles.mapbox.com/v3/agrista.map-65ftbmpi/geocode/{query}.jsonp',
                        'id': 'agrista.map-65ftbmpi',
                        'maxzoom': 19,
                        'minzoom': 0,
                        'name': 'SA Agri Backdrop',
                        'private': true,
                        'scheme': 'xyz',
                        'tilejson': '2.0.0',
                        'tiles': ['https://a.tiles.mapbox.com/v3/agrista.map-65ftbmpi/{z}/{x}/{y}.png', 'https://b.tiles.mapbox.com/v3/agrista.map-65ftbmpi/{z}/{x}/{y}.png'],
                        'vector_layers': [
                            {
                                'fields': {},
                                'id': 'mapbox_streets'
                            },
                            {
                                'description': '',
                                'fields': {},
                                'id': 'agrista_agri_backdrop'
                            }
                        ]
                    }
                },
                'Satellite': {
                    type: 'mapbox',
                    tiles: {
                        'autoscale': true,
                        'bounds': [-180, -85, 180, 85],
                        'cache': {
                            'maxzoom': 16,
                            'minzoom': 15
                        },
                        'center': [23.843663473727442, -29.652475838000733, 7],
                        'data': ['https://a.tiles.mapbox.com/v3/agrista.map-tlsadyhb/markers.geojsonp'],
                        'geocoder': 'https://a.tiles.mapbox.com/v3/agrista.map-tlsadyhb/geocode/{query}.jsonp',
                        'id': 'agrista.map-tlsadyhb',
                        'maxzoom': 22,
                        'minzoom': 0,
                        'name': 'Satellite backdrop',
                        'private': true,
                        'scheme': 'xyz',
                        'tilejson': '2.0.0',
                        'tiles': [
                            'https://a.tiles.mapbox.com/v3/agrista.map-tlsadyhb/{z}/{x}/{y}.png',
                            'https://b.tiles.mapbox.com/v3/agrista.map-tlsadyhb/{z}/{x}/{y}.png'
                        ],
                        'vector_layers': [
                            {
                                'fields': {},
                                'id': 'mapbox_satellite_full'
                            },
                            {
                                'fields': {},
                                'id': 'mapbox_satellite_plus'
                            },
                            {
                                'fields': {},
                                'id': 'mapbox_satellite_open'
                            },
                            {
                                'fields': {},
                                'id': 'mapbox_satellite_watermask'
                            },
                            {
                                'fields': {},
                                'id': 'mapbox_streets'
                            }
                        ]
                    }
                },
                'Hybrid': {
                    tiles: 'agrista.h13nehk2',
                    type: 'mapbox'
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
        leafletLayers: {},
        layers: {},
        geojson: {}
    };

    var _instances = {};
    
    this.config = function (options) {
        _defaultConfig = underscore.defaults(options || {}, _defaultConfig);
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
                this.removeGeoJSON();
                this.removeLayers();
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
            addBaseLayer: function (name, layer, show) {
                this._config.layerControl.baseLayers[name] = layer;
                this.enqueueRequest('mapbox-' + this._id + '::add-baselayer', {
                    name: name,
                    layer: layer,
                    show: show
                });
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
                            handler: _this._config.events[event]
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
                };

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

                this._config.layers[name] = {
                    name: name,
                    type: type,
                    options: options,
                    handler: function (layer) {
                        _this._config.leafletLayers[name] = layer;

                        handler(layer);
                    }
                };

                this.enqueueRequest('mapbox-' + this._id + '::create-layer', this._config.layers[name]);
            },
            getLayer: function (name) {
                return this._config.leafletLayers[name];
            },
            getLayers: function () {
                return this._config.layers;
            },
            addLayer: function (name, layer) {
                this._config.leafletLayers[name] = layer;

                $rootScope.$broadcast('mapbox-' + this._id + '::add-layer', name);
            },
            removeLayer: function (names) {
                if ((names instanceof Array) === false) names = [names];

                var _this = this;

                angular.forEach(names, function(name) {
                    $rootScope.$broadcast('mapbox-' + _this._id + '::remove-layer', name);

                    delete _this._config.layers[name];
                    delete _this._config.leafletLayers[name];
                });
            },
            removeLayers: function () {
                var _this = this;
                
                angular.forEach(this._config.layers, function(layer, name) {
                    $rootScope.$broadcast('mapbox-' + _this._id + '::remove-layer', name);

                    delete _this._config.layers[name];
                    delete _this._config.leafletLayers[name];
                });
            },
            showLayer: function (name) {
                $rootScope.$broadcast('mapbox-' + this._id + '::show-layer', name);
            },
            hideLayer: function (name) {
                $rootScope.$broadcast('mapbox-' + this._id + '::hide-layer', name);
            },
            fitLayer: function (name, options) {
                this.enqueueRequest('mapbox-' + this._id + '::fit-layer', {
                    name: name,
                    options: options || {
                        reset: false
                    }
                });
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
                if (typeof properties == 'function') {
                    onAddCallback = properties;
                    properties = {};
                }

                var _this = this;

                properties = underscore.defaults(properties || {},  {
                    featureId: objectId().toString()
                });

                var data = {
                    layerName: layerName,
                    geojson: geojson,
                    options: options,
                    properties: properties,
                    handler: function (layer, feature, featureLayer) {
                        _this._config.leafletLayers[layerName] = layer;
                        _this._config.leafletLayers[properties.featureId] = featureLayer;

                        if (typeof onAddCallback == 'function') {
                            onAddCallback(feature, featureLayer);
                        }
                    }
                };

                this._config.geojson[layerName] = this._config.geojson[layerName] || {};
                this._config.geojson[layerName][properties.featureId] = data;

                $rootScope.$broadcast('mapbox-' + this._id + '::add-geojson', data);

                return properties.featureId;
            },
            addPhotoMarker: function(layerName, geojson, options, properties, onAddCallback) {
                if (typeof properties == 'function') {
                    onAddCallback = properties;
                    properties = {};
                }

                var _this = this;

                properties = underscore.defaults(properties || {},  {
                    featureId: objectId().toString()
                });

                var data = {
                    layerName: layerName,
                    geojson: geojson,
                    options: options,
                    properties: properties,
                    handler: function (layer, feature, featureLayer) {
                        _this._config.leafletLayers[layerName] = layer;

                        if (typeof onAddCallback == 'function') {
                            onAddCallback(feature, featureLayer);
                        }
                    }
                };

                data.properties.isMedia = true;

                this._config.geojson[layerName] = this._config.geojson[layerName] || {};
                this._config.geojson[layerName][properties.featureId] = data;

                $rootScope.$broadcast('mapbox-' + this._id + '::add-photo-marker', data);

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

                        delete _this._config.leafletLayers[layerName];
                        delete _this._config.geojson[layerName];
                    }
                });
            },
            removeGeoJSON: function() {
                var _this = this;
                
                angular.forEach(_this._config.geojson, function(layer, name) {
                    $rootScope.$broadcast('mapbox-' + _this._id + '::remove-geojson-layer', name);

                    delete _this._config.leafletLayers[name];
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

            /*
             * Sidebar
             */
            enableSidebar: function() {
                this.enqueueRequest('mapbox-' + this._id + '::enable-sidebar');
            },
            showSidebar: function() {
                this.enqueueRequest('mapbox-' + this._id + '::sidebar-show');
            },
            hideSidebar: function() {
                this.enqueueRequest('mapbox-' + this._id + '::sidebar-hide');
            },
            toggleSidebar: function() {
                this.enqueueRequest('mapbox-' + this._id + '::sidebar-toggle');
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
}]);

/**
 * mapbox
 */
sdkInterfaceMapApp.directive('mapbox', ['$rootScope', '$http', '$log', '$timeout', 'configuration', 'mapboxService', 'geoJSONHelper', 'objectId', 'underscore', function ($rootScope, $http, $log, $timeout, configuration, mapboxService, geoJSONHelper, objectId, underscore) {
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

            _this.broadcast('mapbox-' + _this._mapboxServiceInstance.getId() + '::init', _this._map);
        }, attrs.delay);
    }

    /*
     * Config
     */
    Mapbox.prototype.mapInit = function() {
        // Setup mapboxServiceInstance
        var _this = this;
        _this._mapboxServiceInstance = mapboxService(_this._id);

        // Setup map
        var view = _this._mapboxServiceInstance.getView();
        var options = _this._mapboxServiceInstance.getOptions();

        _this._map = L.map(_this._id, options).setView(view.coordinates, view.zoom);

        _this._map.whenReady(function () {
            _this.broadcast('mapbox-' + _this._mapboxServiceInstance.getId() + '::ready', _this._map);
        });

        _this._editableFeature = L.featureGroup();
        _this._editableFeature.addTo(_this._map);

        _this.setEventHandlers(_this._mapboxServiceInstance.getEventHandlers());
        _this.resetLayerControls(_this._mapboxServiceInstance.getBaseTile(), _this._mapboxServiceInstance.getBaseLayers(), _this._mapboxServiceInstance.getOverlays());
        _this.addControls(_this._mapboxServiceInstance.getControls());
        _this.setBounds(_this._mapboxServiceInstance.getBounds());
        _this.resetLayers(_this._mapboxServiceInstance.getLayers());
        _this.resetGeoJSON(_this._mapboxServiceInstance.getGeoJSON());

        _this._map.on('draw:drawstart', _this.onDrawStart, _this);
        _this._map.on('draw:editstart', _this.onDrawStart, _this);
        _this._map.on('draw:deletestart', _this.onDrawStart, _this);
        _this._map.on('draw:drawstop', _this.onDrawStop, _this);
        _this._map.on('draw:editstop', _this.onDrawStop, _this);
        _this._map.on('draw:deletestop', _this.onDrawStop, _this);
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

            _this.broadcast('mapbox-' + id + '::destroy');
        });

        // Layer Controls
        scope.$on('mapbox-' + id + '::set-basetile', function (event, args) {
            _this.setBaseTile(args);
        });

        scope.$on('mapbox-' + id + '::set-baselayers', function (event, args) {
            _this.setBaseLayers(args);
        });

        scope.$on('mapbox-' + id + '::add-baselayer', function (event, args) {
            _this.addBaseLayer(args.layer, args.name, args.show);
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

        scope.$on('mapbox-' + id + '::fit-layer', function (event, args) {
            _this.fitLayer(args);
        });

        // GeoJSON
        scope.$on('mapbox-' + id + '::add-geojson', function (event, args) {
            _this.addGeoJSONFeature(args);
        });

        // photoMarker
        scope.$on('mapbox-' + id + '::add-photo-marker', function (event, args) {
            _this.addPhotoMarker(args);
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

        scope.$on('mapbox-' + id + '::enable-sidebar', function(event, args) {
            var sidebar = L.control.sidebar('sidebar', {closeButton: true, position: 'right'});
            _this._sidebar = sidebar;
            _this._map.addControl(sidebar);
//            setTimeout(function () {
//                sidebar.show();
//            }, 500);
        });

        // Sidebar
        scope.$on('mapbox-' + id + '::sidebar-show', function(event, args) {
            if(null != _this._sidebar) {
                _this._sidebar.show();
            }
        });

        scope.$on('mapbox-' + id + '::sidebar-hide', function(event, args) {
            if(null != _this._sidebar) {
                _this._sidebar.hide();
            }
        });

        scope.$on('mapbox-' + id + '::sidebar-toggle', function(event, args) {
            if(null != _this._sidebar) {
                _this._sidebar.toggle();
            }
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

    Mapbox.prototype.broadcast = function (event, data) {
        $log.debug(event);
        $rootScope.$broadcast(event, data);
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
            if (typeof layer.handler === 'function') {
                layer.handler(_this.createLayer(name, layer.type, layer.options));
            }
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
    Mapbox.prototype.setBaseTile = function (name) {
        var _this = this;

        _this._layerControls.baseTile = name;

        angular.forEach(_this._layerControls.baseLayers, function (baselayer, name) {
            if (name === _this._layerControls.baseTile) {
                baselayer.layer.addTo(_this._map);
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

                if (name === _this._layerControls.baseTile) {
                    baselayer.layer.addTo(_this._map);
                }
            }
        });
    };

    Mapbox.prototype.addBaseLayer = function (baselayer, name, show) {
        if (this._layerControls.baseLayers[name] === undefined) {
            if (baselayer.type == 'tile') {
                baselayer.layer = L.tileLayer(baselayer.tiles);
            } else if (baselayer.type == 'mapbox') {
                baselayer.layer = L.mapbox.tileLayer(baselayer.tiles);
            } else if (baselayer.type == 'google' && typeof L.Google === 'function') {
                baselayer.layer = new L.Google(baselayer.tiles);
            }

            if (name === this._layerControls.baseTile || show) {
                baselayer.layer.addTo(this._map);
            }

            this._layerControls.baseLayers[name] = baselayer;
            this._layerControls.control.addBaseLayer(baselayer.layer, name);
        }
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
                } else if (bounds.coordinates.length == 1) {
                    this._map.fitBounds(bounds.coordinates.concat(bounds.coordinates), bounds.options);
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

        options = underscore.defaults(options || {},  {
            enabled: true
        });

        if (this._layers[name] === undefined) {
            if (type == 'featureGroup' && L.featureGroup) {
                this._layers[name] = L.featureGroup(options);
            } else if (type == 'layerGroup' && L.layerGroup) {
                this._layers[name] = L.layerGroup(options);
            } else if (type == 'markerClusterGroup' && L.markerClusterGroup) {
                this._layers[name] = L.markerClusterGroup(options);
            }

            if (this._layers[name] && options.enabled) {
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

            if (layer.eachLayer) {
                layer.eachLayer(function (item) {
                    if (item.bindLabel && item.feature.properties.label) {
                        item.bindLabel(item.feature.properties.label.message, item.feature.properties.label.options);
                    }
                });
            }
        }
    };

    Mapbox.prototype.hideLayer = function (name) {
        var layer = this._layers[name];

        if (layer && this._map.hasLayer(layer)) {
            this._map.removeLayer(layer);
        }
    };

    Mapbox.prototype.fitLayer = function (args) {
        if (args.name) {
            var layer = this._layers[args.name];

            if (layer && this._map.hasLayer(layer)) {
                var bounds = layer.getBounds();

                this._map.fitBounds(bounds, args.options);
            }
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
        if (data instanceof L.Class) {
            return data;
        } else {
            if (data.type && L[data.type]) {
                return (L[data.type].icon ? L[data.type].icon(data) : L[data.type](data));
            } else {
                return L.icon(data);
            }
        }
    };

    Mapbox.prototype.addLabel = function (labelData, feature, layer) {
        var _this = this;
        var geojson = geoJSONHelper(feature);

        if (typeof labelData === 'object' && feature.geometry.type !== 'Point') {
            labelData.options = labelData.options || {};

            if ((labelData.options.centered || labelData.options.noHide) && typeof _this._map.showLabel === 'function') {
                var label = new L.Label(underscore.extend(labelData.options), {
                    offset: [6, -15]
                });

                label.setContent(labelData.message);
                label.setLatLng(geojson.getCenter());

                if (labelData.options.noHide == true) {
                    _this._map.showLabel(label);

                    layer.on('add', function () {
                        _this._map.showLabel(label);
                    });
                    layer.on('remove', function () {
                        _this._map.removeLayer(label);
                    });
                } else {
                    layer.on('mouseover', function () {
                        _this._map.showLabel(label);
                    });
                    layer.on('mouseout', function () {
                        _this._map.removeLayer(label);
                    });
                }
            } else if (typeof layer.bindLabel === 'function') {
                layer.bindLabel(labelData.message, labelData.options);
            }
        }
    };

    Mapbox.prototype.addPhotoMarker = function (item) {
        var _this = this;
        var geojson = geoJSONHelper(item.geojson, item.properties);

        _this.createLayer(item.layerName, item.type, item.options);

        _this._geoJSON[item.layerName] = _this._geoJSON[item.layerName] || {};
        _this._geoJSON[item.layerName][item.properties.featureId] = item;

        var image = item;
        var icon = {
            iconSize: [40, 40],
            className: 'leaflet-marker-agrista-photo'
        };
        var fancyboxOptions = {
            helpers: {
                overlay : {
                    css : {
                        'background' : 'rgba(0,0,0,0.7)'
                    }
                }
            },
            aspectRatio: true,
            autoSize: false,
            width: 640,
            height: 640
        };

        L.geoJson(geojson.getJson(), {
            pointToLayer: function(feature, latlng) {
                return L.marker(latlng, {
                    icon: L.icon(L.extend({
                        iconUrl: image.geojson.properties.data.src
                    }, icon)),
                    title: image.caption || ''
                });
            },
            onEachFeature: function(feature, layer) {
                _this.addLayerToLayer(feature.properties.featureId, layer, item.layerName);

                if (typeof item.handler === 'function') {
                    item.handler(_this._layers[item.layerName], feature, layer);
                }

                layer.on('click', function(e) {
                    //todo: video
                    //image
                    $.fancybox({
                        href: feature.properties.data.src,
                        title: (feature.properties.data.photoDate || feature.properties.data.uploadDate)
                            + ' @ ' + feature.geometry.coordinates[1].toFixed(4) + (feature.geometry.coordinates[1] > 0 ? ' N' : ' S')
                            + ' ' + feature.geometry.coordinates[0].toFixed(4)+ (feature.geometry.coordinates[0] > 0 ? ' E' : '  W'),
                        type: 'image'
                    }, fancyboxOptions);
                });
            }
        });
    };

    Mapbox.prototype.addGeoJSONFeature = function (item) {
        var _this = this;
        var geojson = geoJSONHelper(item.geojson, item.properties);

        _this.createLayer(item.layerName, item.type, item.options);

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

                if (typeof item.handler === 'function') {
                    item.handler(_this._layers[item.layerName], feature, layer);
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

                        _this.broadcast('mapbox-' + _this._mapboxServiceInstance.getId() + '::polygon-clicked', {properties: feature.properties, highlighted: feature.properties.highlighted});
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

                        _this.broadcast('mapbox-' + _this._mapboxServiceInstance.getId() + '::portion-added', portion);
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

                        _this.broadcast('mapbox-' + _this._mapboxServiceInstance.getId() + '::portion-added', portion);
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

                        _this.broadcast('mapbox-' + _this._mapboxServiceInstance.getId() + '::district-added', district);
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

                        _this.broadcast('mapbox-' + _this._mapboxServiceInstance.getId() + '::district-added', district);
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

                        _this.broadcast('mapbox-' + _this._mapboxServiceInstance.getId() + '::field-added', field);
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

                        _this.broadcast('mapbox-' + _this._mapboxServiceInstance.getId() + '::field-added', field);
                    }
                }).error(function(err) {
                    $log.debug(err);
                });
        }
    };

    Mapbox.prototype.onDrawStart = function (e) {
       this._editing = true;

        this.broadcast('mapbox-' + this._mapboxServiceInstance.getId() + '::geometry-editing', this._editing);
    };

    Mapbox.prototype.onDrawStop = function (e) {
        this._editing = false;

        this.broadcast('mapbox-' + this._mapboxServiceInstance.getId() + '::geometry-editing', this._editing);
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

                this.broadcast('mapbox-' + this._mapboxServiceInstance.getId() + '::geometry-created', geojson);
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

                this.broadcast('mapbox-' + this._mapboxServiceInstance.getId() + '::geometry-created', geojson);
                break;
            case 'marker':
                geojson.geometry = {
                    type: 'Point',
                    coordinates: [e.layer._latlng.lng, e.layer._latlng.lat]
                };

                this.broadcast('mapbox-' + this._mapboxServiceInstance.getId() + '::geometry-created', geojson);
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

            if (_this._draw.controls.polygon.options.draw.polygon.showArea) {
                geojson.properties.area = {
                    m_sq: 0,
                    ha: 0,
                    mi_sq: 0,
                    acres: 0,
                    yd_sq: 0
                };
            }

            var _getCoordinates = function (layer, geojson) {
                var polygonCoordinates = [];

                angular.forEach(layer._latlngs, function(latlng) {
                    polygonCoordinates.push([latlng.lng, latlng.lat]);
                });

                // Add a closing coordinate if there is not a matching starting one
                if (polygonCoordinates.length > 0 && polygonCoordinates[0] != polygonCoordinates[polygonCoordinates.length - 1]) {
                    polygonCoordinates.push(polygonCoordinates[0]);
                }

                // Add area
                if (geojson.properties.area !== undefined) {
                    var geodesicArea = L.GeometryUtil.geodesicArea(layer._latlngs);
                    var yards = (geodesicArea * 1.19599);

                    geojson.properties.area.m_sq += geodesicArea;
                    geojson.properties.area.ha += (geodesicArea * 0.0001);
                    geojson.properties.area.mi_sq += (yards / 3097600);
                    geojson.properties.area.acres += (yards / 4840);
                    geojson.properties.area.yd_sq += yards;
                }

                return polygonCoordinates;
            };

            switch(layer.feature.geometry.type) {
                case 'Point':
                    geojson.geometry.coordinates = [layer._latlng.lng, layer._latlng.lat];

                    _this.broadcast('mapbox-' + _this._mapboxServiceInstance.getId() + '::geometry-edited', geojson);
                    break;
                case 'Polygon':
                    geojson.geometry.coordinates = [_getCoordinates(layer, geojson)];

                    $rootScope.$broadcast('mapbox-' + _this._mapboxServiceInstance.getId() + '::geometry-edited', geojson);
                    break;
                case 'MultiPolygon':
                    geojson.geometry.coordinates = [[]];

                    layer.eachLayer(function (childLayer) {
                        geojson.geometry.coordinates[0].push(_getCoordinates(childLayer, geojson));
                    });

                    _this.broadcast('mapbox-' + _this._mapboxServiceInstance.getId() + '::geometry-edited', geojson);
                    break;
                case 'LineString':
                    geojson.geometry.coordinates = [];

                    angular.forEach(layer._latlngs, function(latlng) {
                        geojson.geometry.coordinates.push([latlng.lng, latlng.lat]);
                    });

                    _this.broadcast('mapbox-' + _this._mapboxServiceInstance.getId() + '::geometry-edited', geojson);
                    break;
            }
        });
    };

    // may delete one or two geometry at most (field label & field shape)
    Mapbox.prototype.onDeleted = function (e) {
        var _this = this;

        var _removeLayer = function (layer) {
            _this._editableFeature.removeLayer(layer);

            _this.broadcast('mapbox-' + _this._mapboxServiceInstance.getId() + '::geometry-deleted', layer.feature.properties.featureId);
        };

        if(e.layers.getLayers().length > 0) {
            // Layer is within the editableFeature
            e.layers.eachLayer(function(deletedLayer) {
                if (deletedLayer.feature !== undefined) {
                    _removeLayer(deletedLayer);
                } else {
                    _this._editableFeature.eachLayer(function (editableLayer) {
                        if (editableLayer.hasLayer(deletedLayer)) {
                            _removeLayer(editableLayer);
                        }
                    });
                }
            });
        } else {
            // Layer is the editableFeature
            _this._editableFeature.clearLayers();

            _this.broadcast('mapbox-' + _this._mapboxServiceInstance.getId() + '::geometry-deleted');
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


var sdkInterfaceNavigiationApp = angular.module('ag.sdk.interface.navigation', ['ag.sdk.authorization', 'ag.sdk.library']);

sdkInterfaceNavigiationApp.provider('navigationService', ['underscore', function (underscore) {
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
            app = underscore.defaults(app, {
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
            var group = underscore.findWhere(_groupedApps, {title: app.group});

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
            var groupItem = underscore.findWhere(group.items, {id: app.id});

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
            var roleApps = (authUser.userRole ? underscore.pluck(authUser.userRole.apps, 'name') : []);
            var orgServices = (authUser.organization ? underscore.pluck(authUser.organization.services, 'serviceType') : []);

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
                var app = underscore.findWhere(_registeredApps, {id: id});

                if (app) {
                    app.title = title;

                    $rootScope.$broadcast('navigation::items__changed', _groupedApps);
                }
            },
            selectItem: function (id) {
                $rootScope.$broadcast('navigation::item__selected', id);

                return $state.go(id);
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
}]);

var sdkInterfaceUiApp = angular.module('ag.sdk.interface.ui', []);

sdkInterfaceUiApp.directive('dynamicName', function() {
    return {
        restrict: 'A',
        require: '?form',
        link: function(scope, element, attrs, controller) {
            var formCtrl = (controller != null) ? controller :  element.parent().controller('form');
            var currentElementCtrl = formCtrl[element.attr('name')];

            element.attr('name', attrs.name);
            formCtrl.$removeControl(currentElementCtrl);
            currentElementCtrl.$name = attrs.name;
            formCtrl.$addControl(currentElementCtrl);
        }
    }
});

sdkInterfaceUiApp.directive('defaultSrc', [function () {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            element.bind('error', function() {
                element.attr("src", attrs.defaultSrc);
            });
        }
    };
}]);

sdkInterfaceUiApp.filter('location', ['$filter', function ($filter) {
    return function (value) {
        return ((value && value.geometry ? $filter('number')(value.geometry.coordinates[0], 3) + ', ' + $filter('number')(value.geometry.coordinates[1], 3) : '') + (value && value.properties && value.properties.accuracy ? ' at ' + $filter('number')(value.properties.accuracy, 2) + 'm' : ''));
    };
}]);

sdkInterfaceUiApp.directive('locationFormatter', ['$filter', function ($filter) {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function (scope, element, attrs, ngModel) {
            ngModel.$formatters.push(function (value) {
                var viewValue = '';
                if (value !== undefined) {
                    viewValue = $filter('location')(value);

                    if (attrs.ngChange) {
                        scope.$eval(attrs.ngChange);
                    }
                }

                return viewValue;
            });
        }
    };
}]);

sdkInterfaceUiApp.directive('dateFormatter', ['$filter', function ($filter) {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function (scope, element, attrs, ngModel) {
            ngModel.$formatters.push(function (value) {
                return (value !== undefined ? $filter('date')(new Date(value), attrs['dateFormat'] || 'yyyy-MM-dd') : '');
            });
        }
    };
}]);

sdkInterfaceUiApp.directive('dateParser', ['$filter', function ($filter) {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function (scope, element, attrs, ngModel) {
            ngModel.$parsers.push(function (value) {
                return (value !== undefined ? $filter('date')(new Date(value), attrs['dateFormat'] || 'yyyy-MM-dd') : '');
            });
        }
    };
}]);

sdkInterfaceUiApp.directive('inputNumber', ['$filter', function ($filter) {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function (scope, element, attrs, ngModel) {
            var _max = (attrs.max ? parseFloat(attrs.max) : false);
            var _min = (attrs.min ? parseFloat(attrs.min) : false);
            var _round = (attrs.round ? parseInt(attrs.round) : false);

            ngModel.$formatters.push(function (value) {
                return (_round === false ? value : $filter('number')(value, _round));
            });

            ngModel.$parsers.push(function (value) {
                var isNan = isNaN(value);

                ngModel.$setValidity('number', isNan === false);

                if (isNan === false) {
                    var float = parseFloat(value);

                    ngModel.$setValidity('range', (_min === false || float >= _min) && (_max === false || float <= _max));
                    return float;
                } else {
                    return value;
                }
            });
        }
    };
}]);
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
            enableHighAccuracy: true,
            timeout: 30000
        },
        camera: {
            quality: 40,
            targetWidth: 960,
            targetHeight: 540,
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
                                    source: 'gps',
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

cordovaHelperApp.factory('mapLocationService', ['$rootScope', '$timeout', 'geolocationService', 'safeApply', 'underscore',
    function ($rootScope, $timeout, geolocationService, safeApply, underscore) {
        return function (mapboxInstance, options) {
            var _coords = null,
                _geolocationHandler = null,
                _map = null,
                _marker = null,
                _options = options || {},
                _active = false,
                _timeout = null;

            var _turnOn = function () {
                if (_active === false) {
                    _options = underscore.defaults(options || {}, {
                        enableHighAccuracy: true,
                        maximumAge: 30000,
                        timeout: 60000,
                        setView: true
                    });

                    _active = true;
                    _geolocationHandler = geolocationService.watchPosition(_options, _locationUpdate);
                }
            };

            var _initMarkers = function (coords) {
                if (coords) {
                    if (_marker === null) {
                        _marker = {
                            position: L.circleMarker([coords.latitude, coords.longitude], {
                                color: '#4d90fe',
                                opacity: 1,
                                fill: true,
                                fillOpacity: 1,
                                clickable: false
                            }),
                            accuracy: L.circle([coords.latitude, coords.longitude], coords.accuracy, {
                                color: '#4d90fe',
                                weight: 3,
                                fill: false,
                                clickable: false
                            })
                        };

                        _marker.position.setRadius(7);
                    }

                    _marker.position.addTo(_map);
                    _marker.accuracy.addTo(_map);
                }
            };

            var _updateMarkers = function (coords) {
                if (coords) {
                    _marker.position.setLatLng([coords.latitude, coords.longitude]);
                    _marker.accuracy.setLatLng([coords.latitude, coords.longitude]);
                    _marker.accuracy.setRadius(coords.accuracy);

                    _marker.position.bringToFront();
                    _marker.accuracy.bringToBack();

                    if (_options.setView) {
                        _map.setView(_marker.position.getLatLng(), 15);
                    }
                }
            };

            var _turnOff = function () {
                if (_active) {
                    _active = false;

                    if (_marker) {
                        _map.removeLayer(_marker.position);
                        _map.removeLayer(_marker.accuracy);

                        _marker = null;
                        _coords = null;
                    }

                    _geolocationHandler.cancel();
                }
            };

            var _locationUpdate = function (result, error) {
                safeApply(function () {
                    if (result && result.coords) {
                        if (_map) {
                            if (_marker === null) {
                                _initMarkers(result.coords);
                            }

                            _updateMarkers(result.coords);

                            _coords = result.coords;
                        }
                    }
                });
            };

            $rootScope.$on('mapbox-' + mapboxInstance.getId() + '::init', function (event, map) {
                _map = map;

                if (_active) {
                    _initMarkers(_coords);
                    _updateMarkers(_coords);
                }
            });

            mapboxInstance.addEventHandler(['dragstart'], function () {
                _options.setView = false;
            });

            return {
                isActive: function () {
                    return _active;
                },
                cancel: function () {
                    _turnOff();
                },
                toggleActive: function () {
                    $timeout.cancel(_timeout);

                    _timeout = $timeout(function () {
                        if (_active) {
                            _turnOff();
                        } else {
                            _turnOn();
                        }
                    }, 300);
                }
            }
        }
    }]);

var sdkModelAsset = angular.module('ag.sdk.model.asset', ['ag.sdk.library', 'ag.sdk.model.base']);

sdkModelAsset.factory('Asset', ['$filter', 'computedProperty', 'inheritModel', 'Model', 'privateProperty', 'readOnlyProperty', 'underscore',
    function ($filter, computedProperty, inheritModel, Model, privateProperty, readOnlyProperty, underscore) {
        function Asset (attrs) {
            Model.Base.apply(this, arguments);

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.assetKey = attrs.assetKey;
            this.legalEntityId = attrs.legalEntityId;
            this.id = attrs.id;
            this.type = attrs.type;

            this.data = attrs.data || {};

            privateProperty(this, 'generateKey', function (legalEntity, farm) {
                this.assetKey = (legalEntity ? 'entity.' + legalEntity.uuid : '') +
                (this.type !== 'farmland' && farm ? '-f.' + farm.name : '') +
                (this.type === 'crop' && this.data.season ? '-s.' + this.data.season : '') +
                (this.data.fieldName ? '-fi.' + this.data.fieldName : '') +
                (this.data.crop ? '-c.' + this.data.crop : '') +
                (this.type === 'cropland' && this.data.irrigated ? '-i.' + this.data.irrigation : '') +
                (this.type === 'farmland' && this.data.sgKey ? '-' + this.data.sgKey : '') +
                (this.type === 'improvement' || this.type === 'livestock' || this.type === 'vme' ?
                (this.data.type ? '-t.' + this.data.type : '') +
                (this.data.category ? '-c.' + this.data.category : '') +
                (this.data.name ? '-n.' + this.data.name : '') +
                (this.data.purpose ? '-p.' + this.data.purpose : '') +
                (this.data.model ? '-m.' + this.data.model : '') +
                (this.data.identificationNo ? '-in.' + this.data.identificationNo : '') : '') +
                (this.data.waterSource ? '-ws.' + this.data.waterSource : '') +
                (this.type === 'other' ? (this.data.name ? '-n.' + this.data.name : '') : '');
            });

            computedProperty(this, 'title', function () {
                switch (this.type) {
                    case 'crop':
                    case 'permanent crop':
                    case 'plantation':
                        return (this.data.plantedArea ? $filter('number')(this.data.plantedArea, 2) + 'Ha' : '') +
                            (this.data.plantedArea && this.data.crop ? ' of ' : '') +
                            (this.data.crop ? this.data.crop : '') +
                            (this.data.fieldName ? ' on field ' + this.data.fieldName : '');
                    case 'farmland':
                        return (this.data.portionLabel ? this.data.portionLabel :
                            (this.data.portionNumber ? 'Portion ' + this.data.portionNumber : 'Remainder of farm'));
                    case 'cropland':
                        return (this.data.equipped ? 'Irrigated ' + this.type + ' (' + (this.data.irrigation ? this.data.irrigation + ' irrigation from ' : '')
                            + this.data.waterSource + ')' : (this.data.irrigated ? 'Irrigable, unequipped ' : 'Non irrigable ') + this.type)
                            + (this.data.fieldName ? ' on field ' + this.data.fieldName : '');
                    case 'livestock':
                        return this.data.type + (this.data.category ? ' - ' + this.data.category : '');
                    case 'pasture':
                        return (this.data.intensified ? (this.data.crop || 'Intensified pasture') : 'Natural grazing') +
                            (this.data.fieldName ? ' on field ' + this.data.fieldName : '');
                    case 'vme':
                        return this.data.category + (this.data.model ? ' model ' + this.data.model : '');
                    case 'wasteland':
                        return 'Wasteland';
                    case 'water source':
                    case 'water right':
                        return this.data.waterSource + (this.data.fieldName ? ' on field ' + this.data.fieldName : '');
                    default:
                        return this.data.name || this.assetTypes[this.type];
                }
            });

            computedProperty(this, 'description', function () {
                return this.data.description || '';
            });
        }

        inheritModel(Asset, Model.Base);

        readOnlyProperty(Asset, 'assetTypes', {
            'crop': 'Crops',
            'farmland': 'Farmlands',
            'improvement': 'Fixed Improvements',
            'cropland': 'Cropland',
            'livestock': 'Livestock',
            'pasture': 'Pastures',
            'permanent crop': 'Permanent Crops',
            'plantation': 'Plantations',
            'vme': 'Vehicles, Machinery & Equipment',
            'wasteland': 'Wasteland',
            'water right': 'Water Rights'
        });

        readOnlyProperty(Asset, 'assetTypesWithOther', underscore.extend({
            'other': 'Other'
        }, Asset.assetTypes));

        Asset.validates({
            assetKey: {
                required: true
            },
            type: {
                required: true,
                inclusion: {
                    in: underscore.keys(Asset.assetTypesWithOther)
                }
            },
            legalEntityId: {
                required: true,
                numeric: true
            }
        });

        return Asset;
    }]);

angular.module('ag.sdk.model.base', ['ag.sdk.library', 'ag.sdk.model.validation', 'ag.sdk.model.errors'])
    .factory('Model', ['Base', function (Base) {
        var Model = {};
        Model.Base = Base;
        return Model;
    }])
    .factory('Base', ['Errorable', 'underscore', 'Validatable', function (Errorable, underscore, Validatable) {
        function Base () {
            var _constructor = this;
            var _prototype = _constructor.prototype;

            _constructor.new = function (attrs) {
                var inst = new _constructor(attrs);
                return inst;
            };

            _constructor.extend = function (Module) {
                var properties = new Module(),
                    propertyNames = Object.getOwnPropertyNames(properties),
                    classPropertyNames = underscore.filter(propertyNames, function (propertyName) {
                        return propertyName.slice(0, 2) !== '__';
                    });

                underscore.each(classPropertyNames, function (classPropertyName) {
                    Object.defineProperty(this, classPropertyName, Object.getOwnPropertyDescriptor(properties, classPropertyName));
                }, this);
            };

            _constructor.include = function (Module) {
                var methods = new Module(),
                    propertyNames = Object.getOwnPropertyNames(methods),
                    instancePropertyNames = underscore.filter(propertyNames, function (propertyName) {
                        return propertyName.slice(0, 2) == '__';
                    }),
                    oldConstructor = this.new;

                this.new = function () {
                    var instance = oldConstructor.apply(this, arguments);

                    underscore.each(instancePropertyNames, function (instancePropertyName) {
                        Object.defineProperty(instance, instancePropertyName.slice(2), Object.getOwnPropertyDescriptor(methods, instancePropertyName));
                    });

                    return instance;
                };
            };

            _constructor.extend(Validatable);
            _constructor.include(Validatable);
            _constructor.include(Errorable);
        }

        return Base;
    }])
    .factory('computedProperty', [function () {
        return function (object, name, value) {
            Object.defineProperty(object, name, {
                get: value
            });
        }
    }])
    .factory('readOnlyProperty', [function () {
        return function (object, name, value) {
            Object.defineProperty(object, name, {
                writable: false,
                value: value
            });
        }
    }])
    .factory('inheritModel', ['underscore', function (underscore) {
        return function (object, base) {
            base.apply(object);

            // Apply defined properties to extended object
            underscore.each(Object.getOwnPropertyNames(base), function (name) {
                var descriptor = Object.getOwnPropertyDescriptor(base, name);

                if (underscore.isUndefined(object[name]) && descriptor) {
                    Object.defineProperty(object, name, descriptor);
                }
            });
        }
    }])
    .factory('privateProperty', [function () {
        return function (object, name, value) {
            var val;

            Object.defineProperty(object, name, {
                enumerable: false,
                configurable: false,
                get: function () {
                    return val;
                },
                set: function (newVal) {
                    val = newVal;
                }
            });

            if (value !== undefined) {
                object[name] = value;
            }
        }
    }]);
var sdkModelBusinessPlanDocument = angular.module('ag.sdk.model.business-plan', ['ag.sdk.id', 'ag.sdk.model.asset', 'ag.sdk.model.document', 'ag.sdk.model.legal-entity', 'ag.sdk.model.liability', 'ag.sdk.model.production-plan', 'ag.sdk.model.farm-valuation']);

sdkModelBusinessPlanDocument.factory('BusinessPlan', ['Asset', 'computedProperty', 'Document', 'FarmValuation', 'generateUUID', 'inheritModel', 'LegalEntity', 'Liability', 'privateProperty', 'ProductionPlan', 'underscore',
    function (Asset, computedProperty, Document, FarmValuation, generateUUID, inheritModel, LegalEntity, Liability, privateProperty, ProductionPlan, underscore) {
        function BusinessPlan (attrs) {
            Document.apply(this, arguments);

            this.docType = 'business plan';

            this.data.models = this.data.models || {
                assets: [],
                farmValuations: [],
                legalEntities: [],
                liabilities: [],
                productionPlans: []
            };

            this.data.monthlyStatement = this.data.monthlyStatement || [];

            function reEvaluateBusinessPlan (instance) {
                // Re-evaluate all included models
                reEvaluateLegalEntities(instance);
                reEvaluateFarmValuations(instance);
                reEvaluateProductionPlans(instance);
                reEvaluateAssetsAndLiabilities(instance);
            }

            /**
             * Legal Entities handling
             */
            privateProperty(this, 'addLegalEntity', function (legalEntity) {
                var dupLegalEntity = underscore.findWhere(this.models.legalEntities, {uuid: legalEntity.uuid});

                if (underscore.isUndefined(dupLegalEntity) && LegalEntity.new(legalEntity).validate()) {
                    this.models.legalEntities.push(legalEntity);

                    reEvaluateBusinessPlan(this);
                }
            });

            privateProperty(this, 'removeLegalEntity', function (legalEntity) {
                this.models.legalEntities = underscore.reject(this.models.legalEntities, function (entity) {
                    return entity.id === legalEntity.id;
                });

                reEvaluateBusinessPlan(this);
            });

            function reEvaluateLegalEntities (instance) {
                instance.data.monthlyStatement = underscore.reject(instance.data.monthlyStatement, function (item) {
                    return item.source === 'legal entity';
                });

                underscore.each(instance.models.legalEntities, function (item) {
                    var legalEntity = LegalEntity.new(item),
                        registerAssets = underscore
                            .chain(instance.data.assets)
                            .values()
                            .flatten()
                            .where({legalEntityId: legalEntity.id})
                            .value(),
                        registerLiabilities = underscore
                            .chain(instance.data.liabilities)
                            .where({legalEntityId: legalEntity.id})
                            .value();

                    underscore.each(registerAssets, function (asset) {
                        var statementAsset = underscore.findWhere(instance.data.monthlyStatement, {uuid: asset.assetKey});

                        if (underscore.isUndefined(statementAsset)) {
                            asset = Asset.new(asset);

                            instance.data.monthlyStatement.push({
                                uuid: asset.assetKey,
                                legalEntityUuid: legalEntity.uuid,
                                name: asset.title,
                                description: (asset.type === 'improvement' ? asset.data.category : asset.description),
                                type: 'asset',
                                subtype: asset.type,
                                source: 'legal entity',
                                value: asset.data.assetValue || 0
                            });
                        }
                    });

                    underscore.each(registerLiabilities, function (liability) {
                        var statementLiability = underscore.findWhere(instance.data.monthlyStatement, {uuid: liability.uuid});

                        if (underscore.isUndefined(statementLiability)) {
                            liability = Liability.new(liability);

                            instance.data.monthlyStatement.push({
                                uuid: liability.uuid,
                                legalEntityUuid: legalEntity.uuid,
                                name: Liability.getTypeTitle(liability.type),
                                type: 'liability',
                                subtype: liability.type,
                                source: 'legal entity',
                                liability: liability.liabilityInRange(instance.startDate, instance.endDate)
                            });
                        }
                    });

                });
            }

            /**
             * Production Plans handling
             */
            privateProperty(this, 'addProductionPlan', function (productionPlan) {
                var dupProductionPlan = underscore.findWhere(this.models.productionPlans, {documentId: productionPlan.documentId});

                if (underscore.isUndefined(dupProductionPlan) && ProductionPlan.new(productionPlan).validate()) {
                    this.models.productionPlans.push(productionPlan);

                    reEvaluateProductionPlans(this);
                }
            });

            privateProperty(this, 'removeProductionPlan', function (productionPlan) {
                this.models.productionPlans = underscore.reject(this.models.productionPlans, function (plan) {
                    return plan.id === productionPlan.id;
                });

                reEvaluateProductionPlans(this);
            });

            function reEvaluateProductionPlans (instance) {
                instance.data.monthlyStatement = underscore.reject(instance.data.monthlyStatement, function (item) {
                    return item.source === 'production plan';
                });

                underscore.each(instance.models.productionPlans, function (item) {
                    var productionPlan = ProductionPlan.new(item);
                });
            }

            /**
             * Farm Valuations handling
             */
            privateProperty(this, 'addFarmValuation', function (farmValuation) {
                var dupFarmValuation = underscore.findWhere(this.models.farmValuations, {documentId: farmValuation.documentId});

                if (underscore.isUndefined(dupFarmValuation) && FarmValuation.new(farmValuation).validate()) {
                    this.models.farmValuations.push(farmValuation);

                    reEvaluateFarmValuations(this);
                }
            });

            privateProperty(this, 'removeFarmValuation', function (farmValuation) {
                this.models.farmValuations = underscore.reject(this.models.farmValuations, function (valuation) {
                    return valuation.id === farmValuation.id;
                });

                reEvaluateFarmValuations(this);
            });

            function reEvaluateFarmValuations (instance) {
                // Remove all statements from farm valuation source
                instance.data.monthlyStatement = underscore.reject(instance.data.monthlyStatement, function (item) {
                    return item.source === 'farm valuation';
                });

                underscore.each(instance.models.farmValuations, function (valuationItem) {
                    var farmValuation = FarmValuation.new(valuationItem);

                    if (farmValuation.data.request && farmValuation.data.report) {
                        var legalEntity = farmValuation.data.request.legalEntity;

                        // Check legal entity model for farm valuation is included
                        if (underscore.some(instance.models.legalEntities, function (entity) {
                                return entity.uuid === legalEntity.uuid;
                            })) {
                            // Farm valuation contains a completed report landUseComponents
                            if (farmValuation.data.report.landUseComponents) {
                                underscore.each(farmValuation.data.report.landUseComponents, function (landUseComponent, landUse) {
                                    underscore.each(landUseComponent, function (category) {
                                        var statementCategory = underscore.findWhere(instance.data.monthlyStatement, {uuid: landUse + '-' + category.name})

                                        if (underscore.isUndefined(statementCategory)) {
                                            // Add new land use component
                                            instance.data.monthlyStatement.push({
                                                uuid: landUse + '-' + category.name,
                                                legalEntityUuid: legalEntity.uuid,
                                                name: landUse,
                                                description: category.name,
                                                type: 'asset',
                                                subtype: 'land use',
                                                source: 'farm valuation',
                                                value: (category.area * category.valuePerHa)
                                            });
                                        } else {
                                            // Sum two components together
                                            statementCategory.value += (category.area * category.valuePerHa);
                                        }
                                    });
                                });
                            }

                            // Farm valuation contains a completed report improvements
                            if (farmValuation.data.report.improvements) {
                                // Loop through the valued improvements
                                underscore.each(farmValuation.data.report.improvements, function (improvementItem) {
                                    var improvement = Asset.new(improvementItem),
                                        statementImprovement = underscore.findWhere(instance.data.monthlyStatement, {uuid: improvement.assetKey, type: 'asset'}),
                                        registerImprovement = underscore.findWhere(instance.data.assets.improvement, {assetKey: improvement.assetKey});

                                    if (underscore.isUndefined(statementImprovement)) {
                                        // Improvement is still valid
                                        if (registerImprovement && improvement.validate()) {
                                            // Find asset in document's asset register
                                            var registerLegalEntity = underscore.findWhere(instance.data.legalEntities, {id: registerImprovement.legalEntityId});

                                            if (underscore.some(instance.models.legalEntities, function (entity) {
                                                    return entity.uuid === registerLegalEntity.uuid;
                                                })) {
                                                // Legal Entity for this improvement is an included Legal Entity

                                                // Add asset
                                                instance.data.monthlyStatement.push({
                                                    uuid: improvement.assetKey,
                                                    legalEntityUuid: registerLegalEntity.uuid,
                                                    name: improvement.title,
                                                    description: improvement.description,
                                                    type: 'asset',
                                                    subtype: improvement.type,
                                                    source: 'farm valuation',
                                                    value: improvement.data.assetValue || 0
                                                });
                                            }
                                        }
                                    } else {
                                        // Add valuation to improvement
                                        statementImprovement.source = 'farm valuation';
                                        statementImprovement.value = improvement.data.assetValue;
                                    }
                                });
                            }
                        }
                    }
                });
            }

            // Add Assets & Liabilities
            privateProperty(this, 'addAsset', function (asset) {
                if (Asset.new(asset).validate()) {
                    this.models.assets.push(asset);

                    reEvaluateAssetsAndLiabilities(this);
                }
            });

            privateProperty(this, 'removeAsset', function (assetKey) {
                this.models.assets = underscore.reject(this.models.assets, function (asset) {
                    return asset.assetKey === assetKey;
                });

                reEvaluateAssetsAndLiabilities(this);
            });

            privateProperty(this, 'addLiability', function (liability) {
                if (Liability.new(liability).validate()) {
                    this.models.liabilities.push(liability);

                    reEvaluateAssetsAndLiabilities(this);
                }
            });

            privateProperty(this, 'removeLiability', function (uuid) {
                this.models.liabilities = underscore.reject(this.models.liabilities, function (liability) {
                    return liability.uuid === uuid;
                });

                reEvaluateAssetsAndLiabilities(this);
            });

            function reEvaluateAssetsAndLiabilities (instance) {
                instance.data.monthlyStatement = underscore.reject(instance.data.monthlyStatement, function (item) {
                    return underscore.contains(['asset', 'liability'], item.source);
                });

                underscore.each(instance.models.assets, function (asset) {
                    asset = Asset.new(asset);

                    var registerLegalEntity = underscore.findWhere(instance.data.legalEntities, {id: asset.legalEntityId}),
                        statementAsset = underscore.findWhere(instance.data.monthlyStatement, {uuid: asset.assetKey});

                    // Check asset is not already added and legal entity model is included
                    if (underscore.isUndefined(statementAsset) && underscore.some(instance.models.legalEntities, function (entity) {
                            return entity.uuid === registerLegalEntity.uuid;
                        })) {

                        // Add asset
                        instance.data.monthlyStatement.push({
                            uuid: asset.assetKey,
                            legalEntityUuid: registerLegalEntity.uuid,
                            name: asset.title,
                            description: asset.description,
                            type: 'asset',
                            subtype: asset.type,
                            source: 'asset',
                            value: asset.data.assetValue || 0
                        });
                    }
                });

                underscore.each(instance.models.liabilities, function (liability) {
                    liability = Liability.new(liability);

                    var registerLegalEntity = underscore.findWhere(instance.data.legalEntities, {id: liability.legalEntityId});

                    // Check legal entity model is included
                    if (underscore.some(instance.models.legalEntities, function (entity) {
                            return entity.uuid === registerLegalEntity.uuid;
                        })) {
                        // Add asset
                        instance.data.monthlyStatement.push({
                            uuid: liability.uuid,
                            legalEntityUuid: registerLegalEntity.uuid,
                            name: liability.name || '',
                            description: liability.description || '',
                            type: 'liability',
                            subtype: 'other',
                            source: 'liability',
                            liability: liability.liabilityInRange(instance.startDate, instance.endDate)
                        });
                    }
                });
            }

            // View added Assets & Liabilities
            computedProperty(this, 'startDate', function () {
                return this.data.startDate;
            });

            computedProperty(this, 'endDate', function () {
                this.data.endDate = (this.data.startDate ?
                    moment(this.data.startDate).add(2, 'y').format() :
                    this.data.endDate);

                return this.data.endDate;
            });

            computedProperty(this, 'models', function () {
                return this.data.models;
            });

            computedProperty(this, 'monthlyStatement', function () {
                return this.data.monthlyStatement;
            });
        }

        inheritModel(BusinessPlan, Document);

        BusinessPlan.validates({
            author: {
                required: true,
                length: {
                    min: 1,
                    max: 255
                }
            },
            docType: {
                required: true,
                equal: {
                    to: 'business plan'
                }
            },
            organizationId: {
                required: true,
                numeric: true
            },
            startDate: {
                required: true,
                format: {
                    date: true
                }
            },
            title: {
                required: true,
                length: {
                    min: 1,
                    max: 255
                }
            }
        });

        return BusinessPlan;
    }]);

var sdkModelDocument = angular.module('ag.sdk.model.document', ['ag.sdk.library', 'ag.sdk.model.base']);

sdkModelDocument.factory('Document', ['inheritModel', 'Model', 'privateProperty', 'readOnlyProperty', 'underscore',
        function (inheritModel, Model, privateProperty, readOnlyProperty, underscore) {
            function Document (attrs, organization) {
                Model.Base.apply(this, arguments);

                this.data = (attrs && attrs.data) || {};

                privateProperty(this, 'updateRegister', function (organization) {
                    this.data = underscore.extend(this.data, {
                        farmer: underscore.omit(organization, ['farms', 'legalEntities', 'primaryContact', 'teams']),
                        farms : organization.farms,
                        legalEntities: underscore
                            .map(organization.legalEntities, function (entity) {
                                return underscore.omit(entity, ['assets', 'farms']);
                            }),
                        assets: underscore
                            .chain(organization.legalEntities)
                            .pluck('assets')
                            .flatten()
                            .compact()
                            .groupBy('type')
                            .value(),
                        liabilities: underscore
                            .chain(organization.legalEntities)
                            .pluck('liabilities')
                            .flatten()
                            .compact()
                            .value()
                    });
                });

                if (underscore.isUndefined(attrs) || arguments.length === 0) return;

                this.author = attrs.author;
                this.docType = attrs.docType;
                this.documentId = attrs.documentId;
                this.id = attrs.id;
                this.organizationId = attrs.organizationId;
                this.title = attrs.title;
            }

            inheritModel(Document, Model.Base);

            readOnlyProperty(Document, 'docTypes', {
                'asset register': 'Asset Register',
                'business plan': 'Business Plan',
                'emergence report': 'Emergence Report',
                'farm valuation': 'Farm Valuation',
                'insurance policy': 'Insurance Policy',
                'production plan': 'Production Plan',
                'progress report': 'Progress Report'
            });

            Document.validates({
                author: {
                    required: true,
                    length: {
                        min: 1,
                        max: 255
                    }
                },
                docType: {
                    required: true,
                    inclusion: {
                        in: underscore.keys(Document.docTypes)
                    }
                },
                organizationId: {
                    required: true,
                    numeric: true
                }
            });

            return Document;
        }]);

var sdkModelFarmValuationDocument = angular.module('ag.sdk.model.farm-valuation', ['ag.sdk.model.asset', 'ag.sdk.model.document']);

sdkModelFarmValuationDocument.factory('FarmValuation', ['Asset', 'computedProperty', 'Document', 'inheritModel', 'privateProperty',
    function (Asset, computedProperty, Document, inheritModel, privateProperty) {
        function FarmValuation (attrs) {
            Document.apply(this, arguments);

            this.docType = 'farm valuation';
        }

        inheritModel(FarmValuation, Document);

        FarmValuation.validates({
            author: {
                required: true,
                length: {
                    min: 1,
                    max: 255
                }
            },
            docType: {
                required: true,
                equal: {
                    to: 'farm valuation'
                }
            },
            organizationId: {
                required: true,
                numeric: true
            }
        });

        return FarmValuation;
    }]);

var sdkModelLegalEntity = angular.module('ag.sdk.model.legal-entity', ['ag.sdk.library', 'ag.sdk.model.base']);

sdkModelLegalEntity.factory('LegalEntity', ['inheritModel', 'Model', 'readOnlyProperty', 'underscore',
    function (inheritModel, Model, readOnlyProperty, underscore) {
        function LegalEntity (attrs) {
            Model.Base.apply(this, arguments);

            this.data = (attrs && attrs.data) || {};

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.addressCity = attrs.addressCity;
            this.addressCode = attrs.addressCode;
            this.addressDistrict = attrs.addressDistrict;
            this.addressStreet = attrs.addressStreet;
            this.email = attrs.email;
            this.fax = attrs.fax;
            this.id = attrs.id;
            this.mobile = attrs.mobile;
            this.name = attrs.name;
            this.organizationId = attrs.organizationId;
            this.registrationNumber = attrs.registrationNumber;
            this.telephone = attrs.telephone;
            this.type = attrs.type;
            this.uuid = attrs.uuid;
        }

        inheritModel(LegalEntity, Model.Base);

        readOnlyProperty(LegalEntity, 'legalEntityTypes', [
            'Individual',
            'Sole Proprietary',
            'Joint account',
            'Partnership',
            'Close Corporation',
            'Private Company',
            'Public Company',
            'Trust',
            'Non-Profitable companies',
            'Cooperatives',
            'In- Cooperatives',
            'Other Financial Intermediaries']);

        LegalEntity.validates({
            addressCity: {
                length: {
                    min: 1,
                    max: 255
                }
            },
            addressCode: {
                length: {
                    min: 1,
                    max: 255
                }
            },
            addressDistrict: {
                length: {
                    min: 1,
                    max: 255
                }
            },
            addressStreet: {
                length: {
                    min: 1,
                    max: 255
                }
            },
            email: {
                required: true,
                format: {
                    email: true
                }
            },
            fax: {
                format: {
                    telephone: true
                }
            },
            mobile: {
                format: {
                    telephone: true
                }
            },
            name: {
                required: true,
                length: {
                    min: 1,
                    max: 255
                }
            },
            organizationId: {
                required: true,
                numeric: true
            },
            registrationNumber: {
                length: {
                    min: 1,
                    max: 255
                }
            },
            telephone: {
                format: {
                    telephone: true
                }
            },
            type: {
                required: true,
                inclusion: {
                    in: LegalEntity.legalEntityTypes
                }
            },
            uuid: {
                format: {
                    uuid: true
                }
            }
        });

        return LegalEntity;
    }]);

var sdkModelLiability = angular.module('ag.sdk.model.liability', ['ag.sdk.library', 'ag.sdk.model.base']);

sdkModelLiability.factory('Liability', ['computedProperty', 'inheritModel', 'Model', 'moment', 'privateProperty', 'readOnlyProperty', 'underscore',
    function (computedProperty, inheritModel, Model, moment, privateProperty, readOnlyProperty, underscore) {
        var _frequency = {
            'monthly': 12,
            'bi-monthly': 24,
            'quarterly': 4,
            'bi-yearly': 2,
            'yearly': 1
        };

        function Liability (attrs) {
            Model.Base.apply(this, arguments);

            computedProperty(this, 'currentBalance', function () {
                return (this.type !== 'rent' ? this.liabilityInMonth(moment().startOf('month')) : 0);
            });

            privateProperty(this, 'balanceInMonth', function (month) {
                var balance = this.amount || 0;

                if (this.type !== 'rent') {
                    var startMonth = moment(this.startDate),
                        paymentMonths = this.paymentMonths,
                        paymentsPerMonth = (_frequency[this.frequency] > 12 ? _frequency[this.frequency] / 12 : 1),
                        numberOfMonths = moment(month).diff(startMonth, 'months') + 1;

                    for(var i = 0; i < numberOfMonths; i++) {
                        var month = moment(this.startDate).add(i, 'M');

                        if (month >= startMonth) {
                            balance += (((this.interestRate || 0) / 100) / 12) * balance;

                            if (underscore.contains(paymentMonths, month.month())) {
                                for (var j = 0; j < paymentsPerMonth; j++) {
                                    balance -= Math.min(balance, (this.installmentPayment || 0));
                                }
                            }
                        }
                    }
                }

                return balance;
            });

            computedProperty(this, 'paymentMonths', function () {
                var paymentsPerYear = _frequency[this.frequency],
                    firstPaymentMonth = moment(this.startDate).month();

                return underscore
                    .range(firstPaymentMonth, firstPaymentMonth + 12, (paymentsPerYear < 12 ? 12 / paymentsPerYear : 1))
                    .map(function (value) {
                        return value % 12;
                    })
                    .sort(function (a, b) {
                        return a - b;
                    });
            });

            privateProperty(this, 'liabilityInMonth', function (month) {
                var previousMonth = moment(month).subtract(1, 'M'),
                    currentMonth = moment(month),
                    startMonth = moment(this.startDate),
                    endMonth = moment(this.endDate),
                    paymentsPerYear = _frequency[this.frequency],
                    paymentsPerMonth = (paymentsPerYear > 12 ? paymentsPerYear / 12 : 1),
                    previousBalance = this.balanceInMonth(previousMonth);

                var liability = 0;

                if (currentMonth >= startMonth && (this.endDate === undefined || currentMonth <= endMonth)) {
                    previousBalance += (((this.interestRate || 0) / 100) / 12) * previousBalance;

                    if (underscore.contains(this.paymentMonths, currentMonth.month())) {
                        for (var i = 0; i < paymentsPerMonth; i++) {
                            if (this.type !== 'rent') {
                                liability += Math.min(previousBalance, (this.installmentPayment || 0));
                                previousBalance -= Math.min(previousBalance, (this.installmentPayment || 0));
                            } else {
                                liability += (this.installmentPayment || 0);
                            }
                        }
                    }
                }

                return liability;
            });

            privateProperty(this, 'liabilityInRange', function (rangeStart, rangeEnd) {
                var previousMonth = moment(rangeStart).subtract(1, 'M'),
                    startMonth = moment(this.startDate),
                    endMonth = moment(this.endDate),
                    paymentMonths = this.paymentMonths,
                    paymentsPerYear = _frequency[this.frequency],
                    paymentsPerMonth = (paymentsPerYear > 12 ? paymentsPerYear / 12 : 1),
                    previousBalance = this.balanceInMonth(previousMonth),
                    numberOfMonths = moment(rangeEnd).diff(rangeStart, 'months') + 1;

                var liability = underscore.range(numberOfMonths).map(function () {
                    return 0;
                });

                for(var i = 0; i < numberOfMonths; i++) {
                    var month = moment(rangeStart).add(i, 'M');

                    if (month >= startMonth && (this.endDate === undefined || month <= endMonth)) {
                        previousBalance += (((this.interestRate || 0) / 100) / 12) * previousBalance;

                        if (underscore.contains(paymentMonths, month.month())) {
                            for (var j = 0; j < paymentsPerMonth; j++) {
                                if (this.type !== 'rent') {
                                    liability[i] += Math.min(previousBalance, (this.installmentPayment || 0));
                                    previousBalance -= Math.min(previousBalance, (this.installmentPayment || 0));
                                } else {
                                    liability[i] += (this.installmentPayment || 0);
                                }
                            }
                        }
                    }
                }

                return liability;
            });

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.uuid = attrs.uuid;
            this.merchantUuid = attrs.merchantUuid;
            this.legalEntityId = attrs.legalEntityId;
            this.type = attrs.type;
            this.installmentPayment = attrs.installmentPayment;
            this.interestRate = attrs.interestRate;
            this.amount = attrs.amount;
            this.frequency = attrs.frequency;
            this.startDate = attrs.startDate;
            this.endDate = attrs.endDate;
        }

        inheritModel(Liability, Model.Base);

        readOnlyProperty(Liability, 'frequencyTypes', {
            'bi-monthly': 'Bi-Monthly',
            'monthly': 'Monthly',
            'quarterly': 'Quarterly',
            'bi-yearly': 'Bi-Yearly',
            'yearly': 'Yearly'});

        readOnlyProperty(Liability, 'liabilityTypes', {
            'short-loan': 'Short Term Loan',
            'medium-loan': 'Medium Term Loan',
            'long-loan': 'Long Term Loan',
            'rent': 'Rented'});

        privateProperty(Liability, 'getFrequencyTitle', function (type) {
            return Liability.frequencyTypes[type] || '';
        });

        privateProperty(Liability, 'getTypeTitle', function (type) {
            return Liability.liabilityTypes[type] || '';
        });

        function isLoaned (value, instance, field) {
            return instance.type !== 'rent';
        }

        function isLeased (value, instance, field) {
            return instance.leased === 'rent';
        }

        Liability.validates({
            installmentPayment: {
                required: true,
                numeric: true
            },
            interestRate: {
                requiredIf: isLoaned,
                numeric: true,
                range: {
                    from: 0,
                    to: 100
                }
            },
            legalEntityId: {
                required: true,
                numeric: true
            },
            amount: {
                requiredIf: isLoaned,
                numeric: true
            },
            merchantUuid: {
                required: true,
                format: {
                    uuid: true
                }
            },
            frequency: {
                required: true,
                inclusion: {
                    in: underscore.keys(Liability.frequencyTypes)
                }
            },
            type: {
                required: true,
                inclusion: {
                    in: underscore.keys(Liability.liabilityTypes)
                }
            },
            startDate: {
                required: true,
                format: {
                    date: true
                }
            },
            endDate: {
                requiredIf: isLeased,
                format: {
                    date: true
                }
            }
        });

        return Liability;
    }]);

var sdkModelProductionPlanDocument = angular.module('ag.sdk.model.production-plan', ['ag.sdk.model.asset', 'ag.sdk.model.document']);

sdkModelProductionPlanDocument.factory('ProductionPlan', ['Asset', 'computedProperty', 'Document', 'inheritModel', 'privateProperty',
    function (Asset, computedProperty, Document, inheritModel, privateProperty) {
        function ProductionPlan (attrs) {
            Document.apply(this, arguments);

            this.docType = 'production plan';
        }

        inheritModel(ProductionPlan, Document);

        ProductionPlan.validates({
            author: {
                required: true,
                length: {
                    min: 1,
                    max: 255
                }
            },
            docType: {
                required: true,
                equal: {
                    to: 'production plan'
                }
            },
            organizationId: {
                required: true,
                numeric: true
            },
            title: {
                required: true,
                length: {
                    min: 1,
                    max: 255
                }
            }
        });

        return ProductionPlan;
    }]);

var sdkTestDataApp = angular.module('ag.sdk.test.data', ['ag.sdk.utilities', 'ag.sdk.id', 'ag.sdk.library']);

sdkTestDataApp.provider('mockDataService', ['underscore', function (underscore) {
    var _mockData = {};
    var _config = {
        localStore: true
    };

    this.config = function (options) {
        _config = underscore.defaults(options, _config);
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
                    data.id = data.id || objectId().toString();

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
                        promise.resolve(underscore.toArray(_mockData[type] || {}));
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

var cordovaCameraApp = angular.module('ag.mobile-sdk.cordova.camera', ['ag.sdk.utilities', 'ag.sdk.library', 'ag.mobile-sdk.cordova.storage']);

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
cordovaCameraApp.factory('cameraService', ['fileStorageService', 'promiseService', 'underscore', function (fileStorageService, promiseService, underscore) {
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
                if (options.destinationType === _destinationTypes.FILE_URI) {
                    fileStorageService.move(data, 'photos').then(function (res) {
                        defer.resolve(res.path);
                    });
                } else {
                    defer.resolve(data);
                }
            }, function (err) {
                defer.reject(err);
            }, options);
        } else {
            defer.reject({code: 'NoCamera', message: 'No camera available'});
        }

        return defer.promise;
    }

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

            return _makeRequest(underscore.defaults(options, {
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

            return _makeRequest(underscore.defaults(options, {
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

            return _makeRequest(underscore.defaults(options, {
                quality: 50,
                destinationType: _destinationTypes.FILE_URI,
                source: _pictureSourceTypes.PHOTOLIBRARY
            }));
        }
    };
}]);

var cordovaConnectionApp = angular.module('ag.mobile-sdk.cordova.connection', ['ag.sdk.library']);

cordovaConnectionApp.factory('connectionService', ['$timeout', 'underscore', function ($timeout, underscore) {
    var _watchConnectionList = [];
    var _lastConnectionType = undefined;
    var _timeout = undefined;

    var _updateConnection = function () {
        $timeout.cancel(_timeout);

        if (navigator.connection && _lastConnectionType !== navigator.connection.type) {
            _lastConnectionType = navigator.connection.type;

            angular.forEach(_watchConnectionList, function (watcher) {
                watcher(_lastConnectionType);
            });
        }

        _timeout = $timeout(_updateConnection, 10000);
    };

    return {
        watchConnection: function (callback) {
            if (typeof callback === 'function') {
                _watchConnectionList.push(callback);

                callback(_lastConnectionType);
                _updateConnection();
            }

            return {
                cancel: function () {
                    _watchConnectionList = underscore.without(_watchConnectionList, callback);

                    if (_watchConnectionList.length == 0) {
                        $timeout.cancel(_timeout);
                    }
                }
            }
        },
        isOnline: function () {
            return (navigator.connection && navigator.connection.type !== Connection.NONE && navigator.connection.type !== Connection.UNKNOWN);
        },
        isMobile: function () {
            return navigator.connection && (navigator.connection.type === Connection.CELL ||
                navigator.connection.type === Connection.CELL_2G ||
                navigator.connection.type === Connection.CELL_3G ||
                navigator.connection.type === Connection.CELL_4G);
        }
    };
}]);

var cordovaGeolocationApp = angular.module('ag.mobile-sdk.cordova.geolocation', ['ag.sdk.utilities', 'ag.sdk.library']);

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
cordovaGeolocationApp.factory('geolocationService', ['promiseService', 'underscore', function (promiseService, underscore) {
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

            options = underscore.defaults(options, _defaultOptions);

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

            options = underscore.defaults(options, _defaultOptions);

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
                var fileName = fileEntry.name.replace(/^([^.]+)/, new Date().getTime());

                _fileSystem.root.getDirectory(directory, {create: true, exclusive: false}, function (directoryEntry) {
                    fileEntry.copyTo(directoryEntry, fileName, function (newFileEntry) {
                        defer.resolve({
                            copy: true,
                            file: newFileEntry.name,
                            path: newFileEntry.toURL()
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
                var fileName = fileEntry.name.replace(/^([^.]+)/, new Date().getTime());

                _fileSystem.root.getDirectory(directory, {create: true, exclusive: false}, function (directoryEntry) {
                    fileEntry.moveTo(directoryEntry, fileName, function (newFileEntry) {
                        defer.resolve({
                            move: true,
                            file: newFileEntry.name,
                            path: newFileEntry.toURL()
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

var cordovaToasterApp = angular.module('ag.mobile-sdk.cordova.toaster', []);

cordovaToasterApp.factory('toasterService', [function () {
    var _show = function (message, duration, position) {
        var _toaster = (window.plugins && window.plugins.toast ? window.plugins.toast : undefined);

        if (_toaster !== undefined) {
            _toaster.show(message, duration, position);
        }
    };

    return {
        show: function (message, duration, position) {
            _show(message, duration, position);
        },
        showLongBottom: function (message) {
            _show(message, 'long', 'bottom');
        }
    };
}]);

var mobileSdkApiApp = angular.module('ag.mobile-sdk.api', ['ag.sdk.utilities', 'ag.sdk.monitor', 'ag.mobile-sdk.hydration', 'ag.mobile-sdk.data', 'ag.mobile-sdk.cordova.connection', 'ag.mobile-sdk.cordova.storage', 'ag.sdk.library']);

var _errors = {
    TypeParamRequired: {code: 'TypeParamRequired', message: 'Type parameter is required'},
    UploadPhotoError: {code: 'UploadPhotoError', message: 'Error occured uploading photo'}
};


/*
 * Syncronization
 */
mobileSdkApiApp.provider('apiSynchronizationService', ['underscore', function (underscore) {
    var _options = {
        models: ['budgets', 'documents', 'expenses', 'farmers', 'tasks', 'organizational-units'],
        local: {
            readLocal: true,
            hydrate: false
        },
        remote: {
            readLocal: false,
            readRemote: true,
            hydrate: false
        }
    };

    var _busy = false;

    this.config = function (options) {
        _options = underscore.extend(_options, options);
    };

    this.$get = ['$http', '$log', 'assetApi', 'configuration', 'connectionService', 'documentApi', 'enterpriseBudgetApi', 'expenseApi', 'farmApi', 'farmerApi', 'fileStorageService', 'legalEntityApi', 'organizationalUnitApi', 'pagingService', 'promiseService', 'taskApi',
        function ($http, $log, assetApi, configuration, connectionService, documentApi, enterpriseBudgetApi, expenseApi, farmApi, farmerApi, fileStorageService, legalEntityApi, organizationalUnitApi, pagingService, promiseService, taskApi) {
            function _getFarmers (getParams) {
                getParams = getParams || {limit: 20, resulttype: 'simple'};

                return farmerApi.purgeFarmer({template: 'farmers', options: {force: false}}).then(function () {
                    return promiseService.wrap(function (promise) {
                        var paging = pagingService.initialize(function (page) {
                            return farmerApi.getFarmers({params: page, options: _options.remote});
                        }, function (farmers) {
                            if (paging.complete) {
                                promise.resolve();
                            } else {
                                paging.request().catch(promise.reject);
                            }
                        }, getParams);

                        paging.request().catch(promise.reject);
                    });
                });
            }

            function _getDocuments (getParams) {
                getParams = getParams || {limit: 20, resulttype: 'simple'};

                return documentApi.purgeDocument({template: 'documents', options: {force: false}}).then(function () {
                    return promiseService.wrap(function (promise) {
                        var paging = pagingService.initialize(function (page) {
                            return documentApi.getDocuments({params: page, options: _options.remote});
                        }, function (documents) {
                            if (paging.complete) {
                                promise.resolve();
                            } else {
                                paging.request().catch(promise.reject);
                            }
                        }, getParams);

                        paging.request().catch(promise.reject);
                    });
                });
            }

            function _getExpenses (getParams) {
                getParams = getParams || {limit: 20, resulttype: 'full'};

                return expenseApi.purgeExpense({template: 'expenses', options: {force: false}}).then(function () {
                    return promiseService.wrap(function (promise) {
                        var paging = pagingService.initialize(function (page) {
                            return expenseApi.getExpenses({params: page, options: _options.remote});
                        }, function (expenses) {
                            if (paging.complete) {
                                promise.resolve();
                            } else {
                                paging.request().catch(promise.reject);
                            }
                        }, getParams);

                        paging.request().catch(promise.reject);
                    });
                });
            }

            function _getTasks (getParams) {
                getParams = getParams || {limit: 20, resulttype: 'simple'};

                return taskApi.purgeTask({template: 'tasks', options: {force: false}}).then(function () {
                    return promiseService.wrap(function (promise) {
                        var paging = pagingService.initialize(function (page) {
                            return taskApi.getTasks({params: page, options: _options.remote});
                        }, function (tasks) {
                            promiseService
                                .chain(function (chain) {
                                    angular.forEach(tasks, function (task) {
                                        chain.push(function () {
                                            return taskApi.findTask({key: task.id, options: {fallbackRemote: true, hydrate: ['organization', 'subtasks']}});
                                        });
                                    });
                                })
                                .then(function () {
                                    if (paging.complete) {
                                        promise.resolve();
                                    } else {
                                        paging.request().catch(promise.reject);
                                    }
                                });
                        }, getParams);

                        paging.request().catch(promise.reject);
                    });
                });
            }

            function _getEnterpriseBudgets() {
                return enterpriseBudgetApi.getEnterpriseBudgets({options: _options.remote});
            }

            function _getOrganizationalUnits (getParams) {
                getParams = getParams || {limit: 20, resulttype: 'simple'};

                return organizationalUnitApi.purgeOrganizationalUnit({template: 'organizational-units', options: {force: false}}).then(function () {
                    return promiseService.wrap(function (promise) {
                        var paging = pagingService.initialize(function (page) {
                            return organizationalUnitApi.getOrganizationalUnits({params: page, options: _options.remote});
                        }, function (expenses) {
                            if (paging.complete) {
                                promise.resolve();
                            } else {
                                paging.request().catch(promise.reject);
                            }
                        }, getParams);

                        paging.request().catch(promise.reject);
                    });
                });
            }

            function _postFarmers () {
                return farmerApi.getFarmers({options: {readLocal: true, hydrate: ['primaryContact']}}).then(function (farmers) {
                    return promiseService.chain(function (chain) {
                        angular.forEach(farmers, function (farmer) {
                            chain.push(function () {
                                return _postFarmer(farmer);
                            });
                        });
                    });
                }, promiseService.throwError);
            }

            function _postFarmer (farmer) {
                return promiseService.chain(function (chain) {
                    if (farmer.__dirty === true) {
                        chain.push(function () {
                            return farmerApi.postFarmer({data: farmer});
                        });
                    }

                    chain.push(function () {
                        return _postFarms(farmer.id);
                    }, function () {
                        return _postLegalEntities(farmer.id);
                    });
                });
            }

            function _postFarms (farmerId) {
                return farmApi.getFarms({id: farmerId, options: _options.local}).then(function (farms) {
                    return promiseService.chain(function (chain) {
                        angular.forEach(farms, function (farm) {
                            if (farm.__dirty === true) {
                                chain.push(function () {
                                    return farmApi.postFarm({data: farm});
                                });
                            }
                        });
                    });
                }, promiseService.throwError);
            }

            function _postLegalEntities (farmerId) {
                return legalEntityApi.getEntities({id: farmerId, options: _options.local}).then(function (entities) {
                    return promiseService.chain(function (chain) {
                        angular.forEach(entities, function (entity) {
                            if (entity.__dirty === true) {
                                chain.push(function () {
                                    return legalEntityApi.postEntity({data: entity});
                                });
                            }

                            chain.push(function () {
                                return _postAssets(entity.id);
                            });
                        });
                    });
                }, promiseService.throwError);
            }

            function _postAssets (entityId) {
                return assetApi.getAssets({id: entityId, options: _options.local}).then(function (assets) {
                    return promiseService.chain(function (chain) {
                        angular.forEach(assets, function (asset) {
                            if (asset.__dirty === true) {
                                chain.push(function () {
                                    return assetApi.postAsset({data: asset});
                                });
                            }
                        });
                    });
                }, promiseService.throwError);
            }

            function _postDocuments () {
                return documentApi.getDocuments({options: _options.local}).then(function (documents) {
                    return promiseService.chain(function (chain) {
                        angular.forEach(documents, function (document) {
                            if (document.__dirty === true) {
                                chain.push(function () {
                                    return documentApi.postDocument({data: document});
                                });
                            }
                        });
                    });
                }, promiseService.throwError);
            }

            function _postExpenses () {
                return expenseApi.getExpenses({options: _options.local}).then(function (expenses) {
                    return promiseService.chain(function (chain) {
                        angular.forEach(expenses, function (expense) {
                            if (expense.__dirty === true) {
                                chain.push(function () {
                                    return expenseApi.postExpense({data: expense});
                                });
                            }
                        });
                    });
                }, promiseService.throwError);
            }

            function _postTasks (task) {
                var query = (task !== undefined ? {template: 'tasks/:id', schema: {id: task.id}, options: _options.local} : {options: _options.local});

                return taskApi.getTasks(query).then(function (subtasks) {
                    return promiseService.chain(function (chain) {
                        angular.forEach(subtasks, function (subtask) {
                            if (task === undefined) {
                                chain.push(function () {
                                    return _postTasks(subtask);
                                });
                            } else if (subtask.__dirty === true) {
                                chain.push(function () {
                                    return taskApi.postTask({data: subtask})
                                });
                            }
                        });

                        if (task && task.__dirty === true) {
                            chain.push(function () {
                                return taskApi.postTask({data: task})
                            });
                        }
                    });
                }, promiseService.throwError);
            }

            return {
                isSynchronizing: function () {
                    return _busy;
                },
                synchronize: function (models) {
                    var _this = this;

                    models = models || _options.models;

                    return _this.upload(models).then(function () {
                        return _this.download(models);
                    });
                },
                upload: function (models) {
                    models = models || _options.models;

                    return promiseService.wrap(function (promise) {
                        if (_busy) {
                            promise.reject({
                                data: {
                                    message: 'Syncing with server. Please wait'
                                }
                            });
                        } else if (connectionService.isOnline() == false) {
                            promise.reject({
                                data: {
                                    message: 'Cannot connect to the server. Please try again later'
                                }
                            });
                        } else {
                            _busy = true;

                            promiseService
                                .chain(function (chain) {
                                    if (models.indexOf('farmers') !== -1) {
                                        chain.push(_postFarmers);
                                    }

                                    if (models.indexOf('documents') !== -1) {
                                        chain.push(_postDocuments);
                                    }

                                    if (models.indexOf('tasks') !== -1) {
                                        chain.push(_postTasks);
                                    }

                                    if (models.indexOf('expenses') !== -1) {
                                        chain.push(_postExpenses);
                                    }
                                })
                                .then(function (res) {
                                    _busy = false;
                                    promise.resolve(res);
                                }, function (err) {
                                    _busy = false;
                                    promise.reject(err);
                                });
                        }
                    });
                },
                download: function (models) {
                    models = models || _options.models;

                    return promiseService.wrap(function (promise) {
                        if (_busy) {
                            promise.reject({
                                data: {
                                    message: 'Syncing with server. Please wait'
                                }
                            });
                        } else if (connectionService.isOnline() == false) {
                            promise.reject({
                                data: {
                                    message: 'Cannot connect to the server. Please try again later'
                                }
                            });
                        } else {
                            _busy = true;

                            promiseService
                                .chain(function (chain) {
                                    if (models.indexOf('farmers') !== -1) {
                                        chain.push(_getFarmers);
                                    }

                                    if (models.indexOf('documents') !== -1) {
                                        chain.push(_getDocuments);
                                    }

                                    if (models.indexOf('tasks') !== -1) {
                                        chain.push(_getTasks);
                                    }

                                    if (models.indexOf('budgets') !== -1) {
                                        chain.push(_getEnterpriseBudgets);
                                    }

                                    if (models.indexOf('expenses') !== -1) {
                                        chain.push(_getExpenses);
                                    }

                                    if (models.indexOf('organizational-units') !== -1) {
                                        chain.push(_getOrganizationalUnits);
                                    }
                                })
                                .then(function (res) {
                                    _busy = false;
                                    promise.resolve(res);
                                }, function (err) {
                                    _busy = false;
                                    promise.reject(err);
                                });
                        }
                    });
                }
            };
        }];
}]);

/*
 * API
 */
mobileSdkApiApp.constant('apiConstants', {
    MissingParams: {code: 'MissingParams', message: 'Missing parameters for api call'}
});

mobileSdkApiApp.factory('api', ['apiConstants', 'dataStore', 'promiseService', 'underscore', function (apiConstants, dataStore, promiseService, underscore) {
    return function (options) {
        if (typeof options === 'String') {
            options = {
                singular: options,
                plural: options + 's'
            }
        }

        if (options.plural === undefined) {
            options.plural = options.singular + 's'
        }
        
        var _itemStore = dataStore(options.singular, {
            apiTemplate: options.singular + '/:id',
            hydrate: options.hydrate,
            dehydrate: options.dehydrate
        });
        
        var _stripProperties = function (data) {
            return (options.strip ? underscore.omit(data, options.strip) : data);
        };

        return {
            /**
             * @name getItems
             * @param req {Object}
             * @param req.template {String} Optional uri template
             * @param req.schema {Object} Optional schema for template
             * @param req.search {String} Optional
             * @param req.id {Number} Optional
             * @param req.options {Object} Optional
             * @param req.params {Object} Optional
             * @returns {Promise}
             */
            getItems: function (req) {
                req = (req ? angular.copy(req) : {});
                req.options = underscore.defaults(req.options || {}, {one: false});

                return _itemStore.transaction().then(function (tx) {
                    if (req.template) {
                        return tx.getItems({template: req.template, schema: req.schema, options: req.options, params: req.params});
                    } else if (req.search) {
                        req.options.readLocal = false;
                        req.options.readRemote = true;

                        return tx.getItems({template: options.plural + '?search=:query', schema: {query: req.search}, options: req.options, params: req.params});
                    } else if (req.id) {
                        return tx.getItems({template: options.plural + '/:id', schema: {id: req.id}, options: req.options, params: req.params});
                    } else {
                        return tx.getItems({template: options.plural, options: req.options, params: req.params});
                    }
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
                req = (req ? angular.copy(req) : {});

                return _itemStore.transaction().then(function (tx) {
                    if (req.data) {
                        return tx.createItems({template: req.template, schema: req.schema, data: req.data, options: req.options});
                    } else {
                        promiseService.throwError(apiConstants.MissingParams);
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
                req = (req ? angular.copy(req) : {});

                return _itemStore.transaction().then(function (tx) {
                    if (req.id) {
                        return tx.getItems({template: req.template, schema: {id: req.id}, options: req.options});
                    } else {
                        promiseService.throwError(apiConstants.MissingParams);
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
                req = (req ? angular.copy(req) : {});

                return _itemStore.transaction().then(function (tx) {
                    if (req.key) {
                        return tx.findItems({key: req.key, column: req.column, options: req.options});
                    } else {
                        promiseService.throwError(apiConstants.MissingParams);
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
                req = (req ? angular.copy(req) : {});

                return _itemStore.transaction().then(function (tx) {
                    if (req.data) {
                        return tx.updateItems({data: _stripProperties(req.data), options: req.options});
                    } else {
                        promiseService.throwError(apiConstants.MissingParams);
                    }
                });
            },
            /**
             * @name postItem
             * @param req {Object}
             * @param req.template {String} Optional write uri template
             * @param req.schema {Object} Optional schema for template
             * @param req.data {Object} Required
             * @param req.options {Object} Optional
             * @returns {Promise}
             */
            postItem: function (req) {
                req = (req ? angular.copy(req) : {});

                return _itemStore.transaction().then(function (tx) {
                    if (req.data) {
                        return tx.postItems({template: req.template, schema: req.schema, data: _stripProperties(req.data), options: req.options});
                    } else {
                        promiseService.throwError(apiConstants.MissingParams);
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
                req = (req ? angular.copy(req) : {});

                return _itemStore.transaction().then(function (tx) {
                    if (req.data) {
                        return tx.removeItems({template: options.singular + '/:id/delete', data: req.data});
                    } else {
                        promiseService.throwError(apiConstants.MissingParams);
                    }
                });
            },
            /**
             * @name purgeItem
             * @param req {Object}
             * @param req.template {String} Optional template
             * @param req.schema {Object} Optional schema
             * @param req.options {Object} Optional
             * @returns {Promise}
             */
            purgeItem: function (req) {
                req = (req ? angular.copy(req) : {});

                return _itemStore.transaction().then(function (tx) {
                    return tx.purgeItems({template: req.template, schema: req.schema, options: req.options});
                });
            }
        };
    }
}]);

mobileSdkApiApp.factory('userApi', ['api', function (api) {
    var userApi = api({
        plural: 'users',
        singular: 'user'
    });

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

mobileSdkApiApp.factory('organizationalUnitApi', ['api', function (api) {
    var organizationalUnitApi = api({
        plural: 'organizational-units',
        singular: 'organizational-unit'
    });

    return {
        getOrganizationalUnits: organizationalUnitApi.getItems,
        createOrganizationalUnit: organizationalUnitApi.createItem,
        getOrganizationalUnit: organizationalUnitApi.getItem,
        findOrganizationalUnit: organizationalUnitApi.findItem,
        updateOrganizationalUnit: organizationalUnitApi.updateItem,
        postOrganizationalUnit: organizationalUnitApi.postItem,
        deleteOrganizationalUnit: organizationalUnitApi.deleteItem,
        purgeOrganizationalUnit: organizationalUnitApi.purgeItem
    };
}]);

mobileSdkApiApp.factory('notificationApi', ['api', function (api) {
    var notificationApi = api({
        plural: 'notifications',
        singular: 'notification'
    });

    return {
        getNotifications: notificationApi.getItems,
        getNotification: notificationApi.getItem,
        deleteNotification: notificationApi.deleteItem
    };
}]);

mobileSdkApiApp.provider('taskApi', ['hydrationProvider', function (hydrationProvider) {
    hydrationProvider.registerHydrate('subtasks', ['taskApi', function (taskApi) {
        return function (obj, type) {
            return taskApi.getTasks({template: 'tasks/:id', schema: {id: obj.__id}});
        }
    }]);

    hydrationProvider.registerDehydrate('subtasks', ['taskApi', 'promiseService', function (taskApi, promiseService) {
        return function (obj, type) {
            var objId = (obj.__id !== undefined ? obj.__id : obj.id);

            return taskApi.purgeTask({template: 'tasks/:id', schema: {id: objId}, options: {force: false}})
                .then(function () {
                    return promiseService.arrayWrap(function (promises) {
                        angular.forEach(obj.subtasks, function (subtask) {
                            promises.push(taskApi.createTask({template: 'tasks/:id', schema: {id: objId}, data: subtask, options: {replace: obj.__complete, complete: obj.__complete, dirty: false}}));
                        });
                    });
                }, promiseService.throwError);
        }
    }]);

    this.$get = ['api', 'hydration', function (api, hydration) {
        var hydrateRelations = ['document', 'organization', 'subtasks'];
        var dehydrateRelations = ['document', 'subtasks'];
        var taskApi = api({
            plural: 'tasks',
            singular: 'task',
            strip: hydrateRelations,
            hydrate: function (obj, options) {
                options.hydrate = (options.hydrate instanceof Array ? options.hydrate : (options.hydrate === true ? hydrateRelations : []));
                return hydration.hydrate(obj, 'task', options);
            },
            dehydrate: function (obj, options) {
                options.dehydrate = (options.dehydrate instanceof Array ? options.dehydrate : (options.dehydrate === false ? [] : dehydrateRelations));
                return hydration.dehydrate(obj, 'task', options);
            }
        });

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
    }];
}]);

mobileSdkApiApp.factory('merchantApi', ['api', function (api) {
    var merchantApi = api({
        plural: 'merchants',
        singular: 'merchant'
    });

    return {
        getMerchants: merchantApi.getItems,
        createMerchant: merchantApi.createItem,
        getMerchant: merchantApi.getItem,
        updateMerchant: merchantApi.updateItem,
        postMerchant: merchantApi.postItem,
        deleteMerchant: merchantApi.deleteItem
    };
}]);

mobileSdkApiApp.provider('farmerApi', ['hydrationProvider', function (hydrationProvider) {
    hydrationProvider.registerHydrate('organization', ['farmerApi', function (farmerApi) {
        return function (obj, type, options) {
            return farmerApi.findFarmer({key: obj.organizationId, options: {one: true, hydrateRemote: options.remoteHydration}});
        }
    }]);

    hydrationProvider.registerDehydrate('organization', ['farmerApi', 'promiseService', function (farmerApi, promiseService) {
        return function (obj, type) {
            return promiseService.wrap(function (promise) {
                if (obj.organization) {
                    obj.organization.id = obj.organization.id || obj.organizationId;

                    farmerApi.createFarmer({template: 'farmers', data: obj.organization, options: {replace: obj.__complete, complete: obj.__complete, dirty: false}}).then(promise.resolve, promise.reject);
                } else {
                    promise.resolve(obj);
                }
            });
        }
    }]);

    this.$get = ['api', 'hydration', function (api, hydration) {
        var defaultRelations = ['farms', 'legalEntities', 'primaryContact'];
        var farmerApi = api({
            plural: 'farmers',
            singular: 'farmer',
            strip: ['farms', 'legalEntities'],
            hydrate: function (obj, options) {
                options.hydrate = (options.hydrate instanceof Array ? options.hydrate : (options.hydrate === true ? defaultRelations : []));
                return hydration.hydrate(obj, 'farmer', options);
            },
            dehydrate: function (obj, options) {
                options.dehydrate = (options.dehydrate instanceof Array ? options.dehydrate : (options.dehydrate === false ? [] : defaultRelations));
                return hydration.dehydrate(obj, 'farmer', options);
            }
        });

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
    }];
}]);

mobileSdkApiApp.provider('legalEntityApi', ['hydrationProvider', function (hydrationProvider) {
    hydrationProvider.registerHydrate('legalEntity', ['legalEntityApi', function (legalEntityApi) {
        return function (obj, type, options) {
            return legalEntityApi.findEntity({key: obj.legalEntityId, options: {one: true, hydrate: true, hydrateRemote: options.remoteHydration}});
        }
    }]);

    hydrationProvider.registerHydrate('legalEntities', ['legalEntityApi', function (legalEntityApi) {
        return function (obj, type) {
            return legalEntityApi.getEntities({id: obj.__id, options: {hydrate: true}});
        }
    }]);

    hydrationProvider.registerHydrate('primaryContact', ['legalEntityApi', 'underscore', function (legalEntityApi, underscore) {
        return function (obj, type) {
            return legalEntityApi.getEntities({id: obj.__id})
                .then(function (entities) {
                    return underscore.findWhere(entities, {isPrimary: true});
                });
        }
    }]);

    hydrationProvider.registerDehydrate('legalEntities', ['legalEntityApi', 'promiseService', function (legalEntityApi, promiseService) {
        return function (obj, type) {
            var objId = (obj.__id !== undefined ? obj.__id : obj.id);

            return legalEntityApi.purgeEntity({template: 'legalentities/:id', schema: {id: objId}, options: {force: false}})
                .then(function () {
                    return promiseService.arrayWrap(function (promises) {
                        angular.forEach(obj.legalEntities, function (entity) {
                            promises.push(legalEntityApi.createEntity({template: 'legalentities/:id', schema: {id: objId}, data: entity, options: {replace: obj.__complete, complete: obj.__complete, dirty: false}}));
                        });
                    });
                }, promiseService.throwError);
        }
    }]);

    this.$get = ['api', 'hydration', function (api, hydration) {
        var defaultRelations = ['assets'];
        var entityApi = api({
            plural: 'legalentities',
            singular: 'legalentity',
            strip: defaultRelations,
            hydrate: function (obj, options) {
                options.hydrate = (options.hydrate instanceof Array ? options.hydrate : (options.hydrate === true ? defaultRelations : []));
                return hydration.hydrate(obj, 'legalentity', options);
            },
            dehydrate: function (obj, options) {
                options.dehydrate = (options.dehydrate instanceof Array ? options.dehydrate : (options.dehydrate === false ? [] : defaultRelations));
                return hydration.dehydrate(obj, 'legalentity', options);
            }
        });

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
    }];
}]);

mobileSdkApiApp.provider('farmApi', ['hydrationProvider', function (hydrationProvider) {
    hydrationProvider.registerHydrate('farm', ['farmApi', function (farmApi) {
        return function (obj, type, options) {
            return farmApi.findFarm({key: obj.farmId, options: {one: true, hydrateRemote: options.remoteHydration}});
        }
    }]);

    hydrationProvider.registerHydrate('farms', ['farmApi', function (farmApi) {
        return function (obj, type) {
            return farmApi.getFarms({id: obj.__id});
        }
    }]);

    hydrationProvider.registerDehydrate('farms', ['farmApi', 'promiseService', function (farmApi, promiseService) {
        return function (obj, type) {
            var objId = (obj.__id !== undefined ? obj.__id : obj.id);

            return farmApi.purgeFarm({template: 'farms/:id', schema: {id: objId}, options: {force: false}})
                .then(function () {
                    return promiseService.arrayWrap(function (promises) {
                        angular.forEach(obj.farms, function (farm) {
                            promises.push(farmApi.createFarm({template: 'farms/:id', schema: {id: objId}, data: farm, options: {replace: obj.__complete, complete: obj.__complete, dirty: false}}));
                        });
                    });
                }, promiseService.throwError);
        }
    }]);

    this.$get = ['api', 'hydration', function (api, hydration) {
        var farmApi = api({
            plural: 'farms',
            singular: 'farm'
        });

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
    }];
}]);

mobileSdkApiApp.provider('assetApi', ['hydrationProvider', function (hydrationProvider) {
    hydrationProvider.registerHydrate('assets', ['assetApi', function (assetApi) {
        return function (obj, type) {
            return assetApi.getAssets({id: obj.__id});
        }
    }]);

    hydrationProvider.registerDehydrate('assets', ['assetApi', 'promiseService', function (assetApi, promiseService) {
        return function (obj, type) {
            var objId = (obj.__id !== undefined ? obj.__id : obj.id);

            return assetApi.purgeAsset({template: 'assets/:id', schema: {id: objId}, options: {force: false}})
                .then(function () {
                    return promiseService.arrayWrap(function (promises) {
                        angular.forEach(obj.assets, function (asset) {
                            promises.push(assetApi.createAsset({template: 'assets/:id', schema: {id: objId}, data: asset, options: {replace: obj.__complete, complete: obj.__complete, dirty: false}}));
                        });
                    });
                }, promiseService.throwError);
        }
    }]);

    this.$get = ['api', 'hydration', function (api, hydration) {
        var assetApi = api({
            plural: 'assets',
            singular: 'asset',
            strip: ['farm', 'legalEntity'],
            hydrate: function (obj, options) {
                options.hydrate = (options.hydrate instanceof Array ? options.hydrate : []);
                return hydration.hydrate(obj, 'asset', options);
            },
            dehydrate: function (obj, options) {
                options.dehydrate = (options.dehydrate instanceof Array ? options.dehydrate : []);
                return hydration.dehydrate(obj, 'asset', options);
            }
        });

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
    }];
}]);

mobileSdkApiApp.provider('documentApi', ['hydrationProvider', function (hydrationProvider) {
    hydrationProvider.registerHydrate('document', ['documentApi', function (documentApi) {
        return function (obj, type, options) {
            return documentApi.findDocument({key: obj.documentId, options: {one: true, hydrateRemote: options.remoteHydration}});
        }
    }]);

    hydrationProvider.registerDehydrate('document', ['documentApi', function (documentApi) {
        return function (obj, type) {
            return documentApi.createDocument({template: 'documents', data: obj.document, options: {replace: obj.__complete, complete: obj.__complete, dirty: false}});
        }
    }]);

    this.$get = ['api', 'hydration', function (api, hydration) {
        var hydrateRelations = ['organization'];
        var dehydrateRelations = [];
        var documentApi = api({
            plural: 'documents',
            singular: 'document',
            strip: ['organization', 'tasks'],
            hydrate: function (obj, options) {
                options.hydrate = (options.hydrate instanceof Array ? options.hydrate : (options.hydrate === true ? hydrateRelations : []));
                return hydration.hydrate(obj, 'document', options);
            },
            dehydrate: function (obj, options) {
                options.dehydrate = (options.dehydrate instanceof Array ? options.dehydrate : (options.dehydrate === false ? [] : dehydrateRelations));
                return hydration.dehydrate(obj, 'document', options);
            }
        });

        return {
            getDocuments: documentApi.getItems,
            createDocument: documentApi.createItem,
            getDocument: documentApi.getItem,
            findDocument: documentApi.findItem,
            updateDocument: documentApi.updateItem,
            postDocument: documentApi.postItem,
            deleteDocument: documentApi.deleteItem,
            purgeDocument: documentApi.purgeItem
        };
    }];
}]);

mobileSdkApiApp.factory('activityApi', ['api', function (api) {
    var activityApi = api({
        plural: 'activities',
        singular: 'activity'
    });

    return {
        getActivities: activityApi.getItems,
        createActivity: activityApi.createItem,
        getActivity: activityApi.getItem,
        deleteActivity: activityApi.deleteItem
    };
}]);

mobileSdkApiApp.factory('enterpriseBudgetApi', ['api', function (api) {
    var budgetApi = api({
        plural: 'budgets',
        singular: 'budget'
    });

    return {
        getEnterpriseBudgets: budgetApi.getItems,
        createEnterpriseBudget: budgetApi.createItem,
        getEnterpriseBudget: budgetApi.getItem,
        findEnterpriseBudget: budgetApi.findItem,
        updateEnterpriseBudget: budgetApi.updateItem,
        postEnterpriseBudget: budgetApi.postItem,
        deleteEnterpriseBudget: budgetApi.deleteItem,
        purgeEnterpriseBudget: budgetApi.purgeItem
    };
}]);

mobileSdkApiApp.factory('expenseApi', ['api', 'hydration', 'promiseService', 'underscore', function (api, hydration, promiseService, underscore) {
    var defaultRelations = ['document', 'organization'];
    var expenseApi = api({
        plural: 'expenses',
        singular: 'expense',
        strip: ['document', 'organization', 'user'],
        hydrate: function (obj, options) {
            options.hydrate = (options.hydrate instanceof Array ? options.hydrate : (options.hydrate === true ? defaultRelations : []));
            return hydration.hydrate(obj, 'expense', options);
        },
        dehydrate: function (obj, options) {
            return promiseService.wrap(function (promise) {
                promise.resolve(underscore.omit(obj, options.dehydrate || defaultRelations));
            });
        }
    });

    return {
        getExpenses: expenseApi.getItems,
        createExpense: expenseApi.createItem,
        getExpense: expenseApi.getItem,
        findExpense: expenseApi.findItem,
        updateExpense: expenseApi.updateItem,
        postExpense: expenseApi.postItem,
        purgeExpense: expenseApi.purgeItem
    };
}]);

mobileSdkApiApp.factory('pipGeoApi', ['$http', 'promiseService', 'configuration', function ($http, promiseService, configuration) {
    var _host = configuration.getServer();

    return {
        getFieldPolygon: function (lng, lat) {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/geo/field-polygon?x=' + lng + '&y=' + lat, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getPortionPolygon: function (lng, lat) {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/geo/portion-polygon?x=' + lng + '&y=' + lat, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getDistrictPolygon: function (lng, lat) {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/geo/district-polygon?x=' + lng + '&y=' + lat, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getProvincePolygon: function (lng, lat) {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/geo/province-polygon?x=' + lng + '&y=' + lat, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    }
}]);

var mobileSdkDataApp = angular.module('ag.mobile-sdk.data', ['ag.sdk.utilities', 'ag.sdk.config', 'ag.sdk.monitor', 'ag.sdk.library', 'ag.mobile-sdk.cordova.storage']);

/**
 * @name dataPurgeService
 */
mobileSdkDataApp.provider('dataPurge', function () {
    this.$get = ['promiseService', 'dataStore', function (promiseService, dataStore) {
        return function purge(dataStoreList) {
            return promiseService.wrapAll(function(promises) {
                angular.forEach(dataStoreList, function (item) {
                    promises.push(dataStore(item).transaction()
                        .then(function (tx) {
                            return tx.purgeItems();
                        }));
                });
            });
        }
    }];
});

mobileSdkDataApp.constant('dataStoreConstants', {
    NoStoreParams: {code: 'NoStoreParams', message: 'No DataStore parameters defined'},
    NoConfigDBNameParams: {code: 'NoConfigDBNameParams', message: 'No Config database name defined'},
    NoConfigAPIParams: {code: 'NoConfigAPIParams', message: 'No Config API parameters defined'},
    NoConfigPagingParams: {code: 'NoConfigPagingParams', message: 'No Config Paging parameters defined'},
    NoReadParams: {code: 'NoReadParams', message: 'No DataRead parameters defined'},
    NoPagingDefined: {code: 'NoPagingDefined', message: 'No Paging parameters have been defined in config'},
    LocalDataStoreError: {code: 'LocalDataStoreError', message: 'Can not perform action on local data store'},
    RemoteDataStoreError: {code: 'RemoteDataStoreError', message: 'Can not perform action on remote data store'},
    RemoteNoDataError: {code: 'RemoteNoDataError', message: 'No data response from remote store'}
});

mobileSdkDataApp.factory('dataStoreUtilities', ['$log', '$timeout', 'dataStoreConstants', 'promiseService', 'underscore', function ($log, $timeout, dataStoreConstants, promiseService, underscore) {
    function _errorLog (err) {
        if (typeof err === 'string') {
            $log.warn('Error: ' + err);
        } else if (err.message !== undefined) {
            $log.warn('Error: ' + err.message + '(' + err.code + ')');
        } else {
            $log.warn(err);
        }
    }

    return {
        parseRequest: function (templateUrl, schemaData) {
            if (templateUrl !== undefined) {
                angular.forEach(schemaData, function (data, key) {
                    templateUrl = templateUrl.replace('/:' + key, (data !== undefined ? '/' + data : ''));
                });
            }

            return templateUrl;
        },
        generateItemIndex: function () {
            return 2000000000 + Math.round(Math.random() * 147483647);
        },
        injectMetadata: function (item) {
            return underscore.extend((typeof item.data == 'object' ? item.data : JSON.parse(item.data)), {
                __id: item.id,
                __uri: item.uri,
                __complete: (item.complete == 1),
                __dirty: (item.dirty == 1),
                __local: (item.local == 1),
                __saved: true
            });
        },
        extractMetadata: function (item) {
            return {
                id: item.__id,
                uri: item.__uri,
                complete: item.__complete,
                dirty: item.__dirty,
                local: item.__local,
                data: underscore.omit(item, ['__id', '__uri', '__complete', '__dirty', '__local', '__saved'])
            };
        },
        transactionPromise: function(db) {
            var _transactionAttempts = 0;
            var _getTransaction = function (promise) {
                _transactionAttempts++;

                db.transaction(function (res) {
                    promise.resolve(res);
                }, function (err) {
                    if (_transactionAttempts <= 10) {
                        $log.warn('Waiting for transaction');
                        $log.warn(JSON.stringify(err));

                        $timeout(function () {
                            _getTransaction(promise);
                        }, 250);
                    } else {
                        promise.reject(err);
                    }
                });
            };

            return promiseService.wrap(function (promise) {
                if (db) {
                    _getTransaction(promise);
                } else {
                    promise.reject(dataStoreConstants.LocalDataStoreError);
                }
            });
        },
        executeSqlPromise: function (tx, sql, data) {
            data = data || [];

            return promiseService.wrap(function (promise) {
                if (tx) {
                    tx.executeSql(sql, data, function (tx, res) {
                        promise.resolve(res);
                    }, function (tx, err) {
                        _errorLog(err);

                        promise.reject(err);
                    });
                } else {
                    promise.reject(dataStoreConstants.LocalDataStoreError);
                }
            });
        }
    }
}]);

/**
 * @name dataStore
 */
mobileSdkDataApp.provider('dataStore', ['dataStoreConstants', 'underscore', function (dataStoreConstants, underscore) {
    var _defaultOptions = {
        pageLimit: 10,
        dbName: undefined,

        readLocal: true,
        readRemote: true
    };

    var _localDatabase;

    /**
     * @name dataStoreProvider.config
     * @description dataStoreProvider provider
     * @param url
     * @param options
     */
    this.config = function (options) {
        _defaultOptions = underscore.defaults((options || {}), _defaultOptions);
    };

    /**
     * dataStore service
     * @type {Array}
     */
    this.$get = ['$http', '$log', '$rootScope', 'fileStorageService', 'localStore', 'promiseService', 'safeApply', 'configuration', 'dataStoreUtilities', function ($http, $log, $rootScope, fileStorageService, localStore, promiseService, safeApply, configuration, dataStoreUtilities) {
        var _hostApi = configuration.getServer() + 'api/';

        var _defaultHydration = function (obj) {
            return promiseService.wrap(function (promise) {
                promise.resolve(obj);
            })
        };

        function _errorCallback(err) {
            $log.error('_errorCallback');
            $log.error(err);
            $log.error(JSON.stringify(err));
        }

        /**
         * @name _initializeDatabase
         * @param name
         * @returns {Database}
         * @private
         */
        function _initializeDatabase() {
            var migrationSteps = [{
                current: '',
                next: '1',
                process: function (tx) {
                    return dataStoreUtilities.executeSqlPromise(tx, 'SELECT name FROM sqlite_master WHERE type = ? ', ['table']).then(function (res) {
                        return promiseService.wrapAll(function (promises) {
                            for (var i = 0; i < res.rows.length; i++) {
                                var table = res.rows.item(i);

                                if (table.name.indexOf('__') === -1) {
                                    promises.push(dataStoreUtilities.executeSqlPromise(tx, 'ALTER TABLE ' + table.name + ' ADD COLUMN complete INT DEFAULT 1'));
                                }
                            }
                        });
                    });
                }
            }];

            function _processMigration(db) {
                $log.debug('_processMigration');

                var currentDbVersion = localStore.getItem('dataStore-dbVersion', '');
                $log.debug('Current version: ' + currentDbVersion);

                if (migrationSteps.length > 0) {
                    var migration = migrationSteps[0];
                    migrationSteps.splice(0, 1);

                    if (migration.current === currentDbVersion) {
                        $log.debug('Database (' + currentDbVersion + ') has a newer version ' + migration.next);

                        dataStoreUtilities.transactionPromise(db)
                            .then(migration.process)
                            .then(function () {
                                $log.debug('Database version migrated from ' + migration.current + ' to ' + migration.next);

                                localStore.setItem('dataStore-dbVersion', migration.next);

                                _processMigration(db);
                            });
                    } else {
                        _processMigration(db);
                    }
                }
            }

            _localDatabase = window.openDatabase(_defaultOptions.dbName, '', _defaultOptions.dbName, 4 * 1048576);

            _processMigration(_localDatabase);
        }

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
                throw new Error(dataStoreConstants.NoStoreParams.msg);
            }

            if (_defaultOptions.dbName === undefined) {
                throw new Error(dataStoreConstants.NoConfigDBNameParams.msg);
            }

            name = name.replace('-', '');

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
            var _config = underscore.defaults((config || {}), {
                apiTemplate: undefined,
                paging: undefined,
                indexerProperty: 'id',

                readLocal: _defaultOptions.readLocal,
                readRemote: _defaultOptions.readRemote,

                hydrate: _defaultHydration,
                dehydrate: _defaultHydration
            });

            if (_config.paging !== undefined) {
                _config.paging = underscore.defaults(_config.paging, {
                    template: '',
                    schema: {},
                    data: {
                        page: 1,
                        limit: _defaultOptions.pageLimit
                    }
                });
            }

            function _initializeTable() {
                return dataStoreUtilities.transactionPromise(_localDatabase).then(function (tx) {
                    return promiseService.all([
                        dataStoreUtilities.executeSqlPromise(tx, 'CREATE TABLE IF NOT EXISTS ' + name + ' (id INT UNIQUE, uri TEXT, complete INT DEFAULT 0, dirty INT DEFAULT 0, local INT DEFAULT 0, data TEXT, updated TIMESTAMP DEFAULT current_timestamp)', []),
                        dataStoreUtilities.executeSqlPromise(tx, 'CREATE TRIGGER IF NOT EXISTS ' + name + '_timestamp AFTER UPDATE ON ' + name + ' BEGIN UPDATE ' + name + '  SET updated = datetime(\'now\') WHERE id = old.id AND uri = old.uri; END', [])
                    ])
                }, promiseService.throwError);
            }

            function _clearTable() {
                return dataStoreUtilities.transactionPromise(_localDatabase).then(function (tx) {
                    return dataStoreUtilities.executeSqlPromise(tx, 'DELETE FROM ' + name, []);
                }, promiseService.throwError);
            }

            /*
             * Utility functions
             */

            function _traceCallback() {
                $log.warn('_traceCallback');
                $log.warn('Arguments: [' + Array.prototype.join.call(arguments, ', ') + ']');
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

            var _getLocal = function (uri, request) {
                $log.debug('_getLocal');

                request.options = request.options || {};

                return dataStoreUtilities
                    .transactionPromise(_localDatabase)
                    .then(function (tx) {
                        return dataStoreUtilities.executeSqlPromise(tx, 'SELECT * FROM ' + name + ' WHERE uri = ?', [uri]);
                    }, promiseService.throwError)
                    .then(function (res) {
                        return promiseService.wrapAll(function (promises) {
                            var applyFilter = (typeof request.options.filter == 'function');

                            for (var i = 0; i < res.rows.length; i++) {
                                var dataItem = dataStoreUtilities.injectMetadata(res.rows.item(i));

                                if (!applyFilter || request.options.filter(dataItem)) {
                                    promises.push(_config.hydrate(dataItem, request.options));
                                }
                            }
                        });
                    }, promiseService.throwError);
            };

            var _findLocal = function (key, column, options) {
                $log.debug('_findLocal');

                return dataStoreUtilities
                    .transactionPromise(_localDatabase)
                    .then(function (tx) {
                        return dataStoreUtilities.executeSqlPromise(tx, 'SELECT * FROM ' + name + ' WHERE ' + column + ' ' + (options.like ? 'LIKE' : '=') + ' ?', [(options.like ? "%" + key + "%" : key)]);
                    }, promiseService.throwError)
                    .then(function (res) {
                        return promiseService.wrapAll(function (promises) {
                            for (var i = 0; i < res.rows.length; i++) {
                                promises.push(_config.hydrate(dataStoreUtilities.injectMetadata(res.rows.item(i)), options));
                            }
                        });
                    }, promiseService.throwError);
            };

            var _syncLocal = function (dataItems, uri, request) {
                $log.debug('_syncLocal');

                return _deleteAllLocal(uri)
                    .then(function () {
                        return _updateLocal(dataItems, {});
                    }, promiseService.throwError)
                    .then(function () {
                        return _getLocal(uri, request);
                    }, promiseService.throwError);
            };

            var _updateLocal = function (dataItems, request) {
                $log.debug('_updateLocal');

                if ((dataItems instanceof Array) === false) dataItems = [dataItems];

                request.options = underscore.defaults(request.options || {}, {
                    replace: true,
                    force: false
                });

                return promiseService
                    .wrapAll(function (promises) {
                        angular.forEach(dataItems, function (dataItem) {
                            promises.push(_config.dehydrate(dataItem, request.options));
                        });
                    })
                    .then(function (dehydratedItems) {
                        return dataStoreUtilities.transactionPromise(_localDatabase).then(function (tx) {
                            return promiseService.wrapAll(function (promises) {
                                angular.forEach(dehydratedItems, function (dehydratedItem) {
                                    var item = dataStoreUtilities.extractMetadata(dehydratedItem);
                                    var dataString = JSON.stringify(item.data);
                                    var resolveItem = function () {
                                        return dehydratedItem;
                                    };

                                    item.dirty = (request.options.dirty === true ? true : item.dirty);

                                    promises.push(dataStoreUtilities
                                        .executeSqlPromise(tx, 'INSERT INTO ' + name + ' (id, uri, data, complete, dirty, local) VALUES (?, ?, ?, ?, ?, ?)', [item.id, item.uri, dataString, (item.complete ? 1 : 0), (item.dirty ? 1 : 0), (item.local ? 1 : 0)])
                                        .then(resolveItem, function () {
                                            if (request.options.replace === true) {
                                                if (item.dirty === true || item.local === true || request.options.force) {
                                                    return dataStoreUtilities
                                                        .executeSqlPromise(tx, 'UPDATE ' + name + ' SET uri = ?, data = ?, complete = ?, dirty = ?, local = ? WHERE id = ?', [item.uri, dataString, (item.complete ? 1 : 0), (item.dirty ? 1 : 0), (item.local ? 1 : 0), item.id])
                                                        .then(resolveItem);
                                                } else {
                                                    return dataStoreUtilities
                                                        .executeSqlPromise(tx, 'UPDATE ' + name + ' SET uri = ?, data = ?, complete = ?, dirty = ?, local = ? WHERE id = ? AND dirty = 0 AND local = 0', [item.uri, dataString, (item.complete ? 1 : 0), (item.dirty ? 1 : 0), (item.local ? 1 : 0), item.id])
                                                        .then(resolveItem);
                                                }
                                            }

                                            return null;
                                        }));
                                });
                            });
                        });
                    }, promiseService.throwError)
                    .then(function (dehydratedItems) {
                        return promiseService.wrapAll(function (promises) {
                            angular.forEach(underscore.compact(dehydratedItems), function (dehydratedItem) {
                                promises.push(_config.hydrate(dehydratedItem, request.options));
                            });
                        });
                    }, promiseService.throwError);
            };

            var _deleteLocal = function (dataItems) {
                $log.debug('_deleteLocal');
                if ((dataItems instanceof Array) === false) dataItems = [dataItems];

                return dataStoreUtilities
                    .transactionPromise(_localDatabase)
                    .then(function (tx) {
                        return promiseService.wrapAll(function (promises) {
                            angular.forEach(dataItems, function (dataItem) {
                                var item = dataStoreUtilities.extractMetadata(dataItem);

                                promises.push(dataStoreUtilities.executeSqlPromise(tx, 'DELETE FROM ' + name + ' WHERE id = ? AND uri = ?', [item.id, item.uri]));
                            });
                        });
                    }, promiseService.throwError)
                    .then(function () {
                        return dataItems;
                    }, promiseService.throwError);
            };

            var _deleteAllLocal = function (uri, options) {
                $log.debug('_deleteAllLocal');

                options = underscore.defaults((options || {}), {
                    force: false
                });

                return dataStoreUtilities
                    .transactionPromise(_localDatabase)
                    .then(function (tx) {
                        if (options.force === true) {
                            $log.debug('_deleteAllLocal force');
                            return dataStoreUtilities.executeSqlPromise(tx, 'DELETE FROM ' + name + ' WHERE uri = ?', [uri]);
                        }

                        $log.debug('_deleteAllLocal not force');
                        return dataStoreUtilities.executeSqlPromise(tx, 'DELETE FROM ' + name + ' WHERE uri = ? AND local = ? AND dirty = ?', [uri, 0, 0]);
                    });
            };

            /*
             * Remote data storage
             */

            var _getRemote = function (uri, request) {
                $log.debug('_getRemote');

                request.options = request.options || {};

                return promiseService
                    .wrap(function (promise) {
                        if (_config.apiTemplate !== undefined) {
                            $http.get(_hostApi + uri, {params: request.params, withCredentials: true})
                                .then(function (res) {
                                    return (res && res.data ? (res.data instanceof Array ? res.data : [res.data]) : []);
                                }, promiseService.throwError)
                                .then(function (res) {
                                    return promiseService.wrapAll(function (promises) {
                                        angular.forEach(res, function (item) {
                                            promises.push(_config.dehydrate(dataStoreUtilities.injectMetadata({
                                                id: _getItemIndex(item),
                                                uri: request.options.forceUri || uri,
                                                data: item,
                                                complete: (request.options.one || request.params === undefined || request.params.resulttype !== 'simple'),
                                                dirty: false,
                                                local: false
                                            }), underscore.defaults(request.options, {
                                                dehydrate: true
                                            })));
                                        });
                                    });
                                }, promiseService.throwError)
                                .then(promise.resolve, promise.reject);
                        } else {
                            promise.reject(dataStoreConstants.RemoteDataStoreError);
                        }
                    });
            };

            /**
             * @name _updateRemote
             * @param dataItems
             * @param request
             * @private
             */
            var _updateRemote = function (dataItems, request) {
                $log.debug('_updateRemote');

                request.options = request.options || {};

                return promiseService.wrap(function (promise) {
                    if (dataItems !== undefined && _config.apiTemplate !== undefined) {
                        if ((dataItems instanceof Array) === false) dataItems = [dataItems];

                        promiseService
                            .wrapAll(function (promises) {
                                angular.forEach(dataItems, function (dataItem) {
                                    var item = dataStoreUtilities.extractMetadata(dataItem);
                                    var obj = item.data;
                                    var uri = item.uri;

                                    if (item.dirty === true || request.options.force) {
                                        if (item.local || request.template !== undefined) {
                                            if (item.local && item.data[_config.indexerProperty] !== undefined) {
                                                delete item.data[_config.indexerProperty];
                                            }

                                            uri = dataStoreUtilities.parseRequest(request.template || _config.apiTemplate, underscore.extend(request.schema, {id: item.local ? undefined : item.id}));
                                        }

                                        var cachedAttachments = (obj.data && obj.data.attachments ? angular.copy(obj.data.attachments) : undefined);
                                        var toBeAttached = (cachedAttachments ? underscore.where(cachedAttachments, {local: true}) : []);

                                        if (cachedAttachments && toBeAttached.length > 0) {
                                            obj.data.attachments = underscore.difference(cachedAttachments, toBeAttached);
                                        }

                                        promises.push($http.post(_hostApi + uri, obj, {withCredentials: true})
                                            .then(function (res) {
                                                var postedItem = dataStoreUtilities.injectMetadata({
                                                    id: _getItemIndex(res.data, item.id),
                                                    uri: item.uri,
                                                    data: res.data,
                                                    complete: true,
                                                    dirty: false,
                                                    local: false
                                                });

                                                if (item.local == true) {
                                                    postedItem.id = postedItem.__id;

                                                    return _deleteLocal(dataItem).then(function () {
                                                        return postedItem;
                                                    });
                                                }

                                                    return postedItem;
                                                }, promiseService.throwError)
                                            .then(function (postedItem) {
                                                if (toBeAttached.length > 0) {
                                                    uri = dataStoreUtilities.parseRequest((request.template || _config.apiTemplate) + '/attach', underscore.extend(request.schema, {id: postedItem.id}));

                                                    return promiseService
                                                        .chain(function (chain) {
                                                            angular.forEach(toBeAttached, function (attachment) {
                                                                chain.push(function () {
                                                                    return fileStorageService.read(attachment.src, true).then(function (fileData) {
                                                                        return $http
                                                                            .post(_hostApi + uri, {
                                                                                archive: underscore.extend(underscore.omit(attachment, ['src', 'local', 'key', 'sizes']), {
                                                                                    filename: fileData.file,
                                                                                    content: fileData.content.substring(fileData.content.indexOf(',') + 1)
                                                                                })
                                                                            }, {withCredentials: true})
                                                                            .then(function (res) {
                                                                                return (res && res.data ? underscore.last(res.data) : undefined);
                                                                            }, promiseService.throwError);
                                                                    }, promiseService.throwError);
                                                                });
                                                            });
                                                        })
                                                        .then(function (attachments) {
                                                            postedItem.data.attachments = underscore
                                                                .chain(postedItem.data.attachments)
                                                                .union(attachments)
                                                                .compact()
                                                                .value();

                                                            return postedItem;
                                                        }, promiseService.throwError);
                                                } else {
                                                    return postedItem;
                                                }
                                            }, promiseService.throwError));
                                    }
                                });
                            }, promiseService.throwError)
                            .then(function(results) {
                                request.options = underscore.defaults({force: true}, request.options);

                                return _updateLocal(underscore.compact(results), request);
                            }, promiseService.throwError)
                            .then(promise.resolve, promise.reject);
                    } else {
                        promise.reject(dataStoreConstants.RemoteDataStoreError);
                    }
                });
            };

            /**
             * @name _deleteRemote
             * @param dataItems
             * @param writeUri
             * @param writeSchema
             * @private
             */
            var _deleteRemote = function (dataItems, writeUri, writeSchema) {
                $log.debug('_deleteRemote');

                return promiseService.wrap(function (promise) {
                    if (dataItems !== undefined && writeUri !== undefined) {
                        if ((dataItems instanceof Array) === false) dataItems = [dataItems];

                        promiseService
                            .wrapAll(function (promises) {
                                angular.forEach(dataItems, function (dataItem) {
                                    if (dataItem.local === false) {
                                        var item = dataStoreUtilities.extractMetadata(dataItem);
                                        var uri = dataStoreUtilities.parseRequest(writeUri, underscore.defaults(writeSchema, {id: item.id}));

                                        promises.push($http.post(_hostApi + uri, {withCredentials: true})
                                            .then(function () {
                                                return _deleteLocal(item);
                                            }, promiseService.throwError));
                                    }
                                });
                            }).then(promise.resolve, promise.reject);
                    } else {
                        promise.reject(dataStoreConstants.RemoteDataStoreError);
                    }
                });
            };

            /**
             * Transactions
             */
            var _tableInitialized = false;
            var _transactionQueue = [];

            var _processTransactionQueue = function () {
                if (_tableInitialized && _localDatabase !== undefined) {
                    while (_transactionQueue.length > 0) {
                        var deferredTransaction = _transactionQueue.shift();

                        deferredTransaction.resolve(new DataTransaction());
                    }
                }
            };

            var _responseFormatter = function (data, singular) {
                return (singular === true && data instanceof Array && data.length > 0 ? data[0] : data);
            };

            var _handleIncompleteResponse = function (data, request, singular) {
                request.options.one = true;
                request.schema = request.schema || {};

                return promiseService
                    .chain(function (chain) {
                        angular.forEach(data, function (dataItem) {
                            chain.push(function () {
                                if (dataItem.__complete === false && request.options.fallbackRemote === true &&
                                    (request.options.hydrateRemote === undefined || request.options.hydrateRemote === true)) {
                                    var uri = dataStoreUtilities.parseRequest(_config.apiTemplate, underscore.defaults({id: dataItem.__id}, request.schema));

                                    request.options.force = true;
                                    request.options.forceUri = dataItem.__uri;

                                    return _getRemote(uri, request).then(function (res) {
                                        return _updateLocal(res, request);
                                    });
                                } else {
                                    return dataItem;
                                }
                            });
                        });
                    })
                    .then(function (res) {
                        return _responseFormatter(res, singular);
                    });
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
                        var request = underscore.defaults(req || {}, {
                            template: _config.apiTemplate,
                            schema: {},
                            data: [],
                            options: {}
                        });

                        request.options = underscore.defaults(request.options, {
                            replace: true,
                            force: false,
                            complete: true,
                            dirty: true
                        });

                        return promiseService
                            .wrapAll(function (promises) {
                                if ((request.data instanceof Array) === false) request.data = [request.data];

                                angular.forEach(request.data, function (data) {
                                    var id = _getItemIndex(data, dataStoreUtilities.generateItemIndex());

                                    promises.push(_config.dehydrate(dataStoreUtilities.injectMetadata({
                                        id: id,
                                        uri: dataStoreUtilities.parseRequest(request.template, underscore.defaults(request.schema, {id: id})),
                                        data: data,
                                        complete: request.options.complete,
                                        dirty: request.options.dirty,
                                        local: request.options.dirty
                                    }), request.options));
                                });
                            }, promiseService.throwError)
                            .then(function (results) {
                                return _updateLocal(underscore.compact(results), request);
                            }, promiseService.throwError)
                            .then(function (results) {
                                return _responseFormatter(results, true);
                            }, promiseService.throwError);
                    },
                    getItems: function (req) {
                        var request = underscore.defaults(req || {}, {
                            template: _config.apiTemplate,
                            schema: {},
                            options: {}
                        });

                        request.options = underscore.defaults(request.options, {
                            fallbackRemote: false,
                            one: (request.options.one !== undefined ? request.options.one : (request.schema.id !== undefined)),
                            passThrough: false,
                            readLocal: _config.readLocal,
                            readRemote: _config.readRemote,
                            remoteHydration: true
                        });

                        return promiseService.wrap(function (promise) {
                            var handleRemote = function (_uri) {
                                _getRemote(_uri, request)
                                    .then(function (res) {
                                        if (request.options.passThrough === true) {
                                            promise.resolve(_responseFormatter(underscore.map(res, function (item) {
                                                var id = _getItemIndex(item, dataStoreUtilities.generateItemIndex());
                                                return dataStoreUtilities.injectMetadata({
                                                    id: id,
                                                    uri: dataStoreUtilities.parseRequest(request.template, underscore.defaults(request.schema, {id: id})),
                                                    data: item,
                                                    complete: (request.options.one || request.params === undefined || request.params.resulttype !== 'simple'),
                                                    dirty: false,
                                                    local: false
                                                });
                                            }), request.options.one));
                                        } else if (request.params === undefined && request.options.readLocal === true) {
                                            _syncLocal(res, _uri, request).then(function (res) {
                                                promise.resolve(_responseFormatter(res, request.options.one));
                                            }, promise.reject);
                                        } else {
                                            _updateLocal(res, request).then(function (res) {
                                                promise.resolve(_responseFormatter(res, request.options.one));
                                            }, promise.reject);
                                        }
                                    }, function (err) {
                                        if (request.options.readLocal === true) {
                                            _getLocal(_uri, request).then(function (res) {
                                                promise.resolve(_responseFormatter(res, request.options.one));
                                            }, promise.reject);
                                        } else {
                                            _errorCallback(err);
                                            promise.reject(err);
                                        }
                                    });
                            };

                            if (typeof request.schema === 'object') {
                                var _uri = dataStoreUtilities.parseRequest(request.template, request.schema);

                                // Process request
                                if (request.options.readRemote === true) {
                                    handleRemote(_uri);
                                } else {
                                    _getLocal(_uri, request).then(function (res) {
                                        if (res.length == 0 && request.options.fallbackRemote === true && request.options.filter === undefined) {
                                            handleRemote(_uri);
                                        } else {
                                            _handleIncompleteResponse(res, request, request.options.one).then(promise.resolve, promise.reject);
                                        }
                                    }, function (err) {
                                        _errorCallback(err);
                                        promise.reject(err);
                                    });
                                }
                            } else {
                                promise.reject(dataStoreConstants.NoReadParams);
                            }
                        });
                    },
                    findItems: function (req) {
                        var request = underscore.defaults(req || {}, {
                            key: '',
                            column: 'id',
                            options: {}
                        });

                        request.options = underscore.defaults(request.options, {
                            fallbackRemote: true,
                            like: false,
                            one: false,
                            remoteHydration: true
                        });

                        return _findLocal(request.key, request.column, request.options).then(function (res) {
                            return _handleIncompleteResponse(res, request, true);
                        }, promiseService.throwError);
                    },
                    updateItems: function (req) {
                        var request = underscore.defaults(req || {}, {
                            data: [],
                            options: {}
                        });

                        request.options = underscore.defaults(request.options, {
                            dirty: true
                        });

                        if ((request.data instanceof Array) === false) request.data = [request.data];

                        return _updateLocal(request.data, request).then(function (res) {
                            return _responseFormatter(res, true);
                        }, promiseService.throwError);
                    },
                    postItems: function (req) {
                        var request = underscore.defaults(req || {}, {
                            template: _config.apiTemplate,
                            schema: {},
                            data: [],
                            options: {}
                        });

                        if ((request.data instanceof Array) === false) request.data = [request.data];

                        return _updateRemote(request.data, request).then(function (res) {
                            return _responseFormatter(res, true);
                        }, promiseService.throwError);
                    },
                    removeItems: function (req) {
                        var request = underscore.defaults(req || {}, {
                            template: undefined,
                            schema: {},
                            data: []
                        });

                        if ((request.data instanceof Array) === false) request.data = [request.data];

                        return promiseService
                            .wrapAll(function (promises) {
                                angular.forEach(request.data, function (item) {
                                    if (item.__local === true) {
                                        promises.push(_deleteLocal(item));
                                    } else {
                                        promises.push(_deleteRemote(item, request.template, request.schema));
                                    }
                                });
                            }).then(function (res) {
                                return _responseFormatter(res, true);
                            }, promiseService.throwError);
                    },
                    purgeItems: function (req) {
                        var request = underscore.defaults(req || {}, {
                            template: undefined,
                            schema: {},
                            options: {},
                            callback: angular.noop
                        });

                        request.options = underscore.defaults(request.options, {
                            force: true
                        });

                        return promiseService.wrap(function (promise) {
                            if (request.template !== undefined) {
                                var _uri = dataStoreUtilities.parseRequest(request.template, request.schema);

                                _getLocal(_uri, request)
                                    .then(function (res) {
                                        var items = underscore.filter(res, function (item) {
                                            return (item.__dirty == false || request.options.force == true);
                                        });

                                        return _deleteLocal(items);
                                    }, promiseService.throwError)
                                    .then(promise.resolve, promise.reject);
                            } else {
                                _clearTable().then(promise.resolve, promise.reject);
                            }
                        });
                    }
                }
            }

            /**
             * Initialize table
             */

            _initializeTable().then(function () {
                $log.debug('table initialized');

                _tableInitialized = true;
                _processTransactionQueue();
            });

            /**
             * Public functions
             */
            return {
                defaults: _defaultOptions,
                config: _config,
                transaction: function () {
                    var defer = promiseService.defer();
                    _transactionQueue.push(defer);

                    _processTransactionQueue();

                    return defer.promise;
                }
            }
        }

        /**
         * Initialize database
         */

        _initializeDatabase();

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

var sdkModelErrors = angular.module('ag.sdk.model.errors', ['ag.sdk.library', 'ag.sdk.model.base']);

sdkModelErrors.factory('Errorable', ['privateProperty', 'underscore',
    function (privateProperty, underscore) {
        function Errorable () {
            var _$errors = {};

            privateProperty(_$errors, 'count', 0);

            privateProperty(_$errors, 'countFor', function (fieldName) {
                if (underscore.isUndefined(fieldName)) {
                    return _$errors.count;
                }

                return (_$errors[fieldName] ? _$errors[fieldName].length : 0);
            });

            privateProperty(_$errors, 'add', function (fieldName, errorMessage) {
                if (underscore.isUndefined(_$errors[fieldName])) {
                    _$errors[fieldName] = [];
                }

                if (underscore.contains(_$errors[fieldName], errorMessage) === false) {
                    _$errors[fieldName].push(errorMessage);
                    _$errors.count++;
                }
            });

            privateProperty(_$errors, 'clear', function (fieldName, errorMessage) {
                if (underscore.isUndefined(errorMessage) === false) {
                    if (underscore.contains(_$errors[fieldName], errorMessage)) {
                        _$errors[fieldName] = underscore.without(_$errors[fieldName], errorMessage);
                        _$errors.count--;

                        if(_$errors[fieldName].length === 0) {
                            delete _$errors[fieldName];
                        }
                    }
                } else {
                    var toClear = [];

                    if (underscore.isArray(fieldName)) {
                        toClear = fieldName;
                    }

                    if (underscore.isString(fieldName)) {
                        toClear.push(fieldName);
                    }

                    if (underscore.isUndefined(fieldName)) {
                        toClear = underscore.keys(_$errors);
                    }

                    underscore.each(toClear, function (fieldName) {
                        if (underscore.isUndefined(_$errors[fieldName]) === false) {
                            var count = _$errors[fieldName].length;
                            delete _$errors[fieldName];
                            _$errors.count -= count;
                        }
                    });
                }
            });

            privateProperty(this, '__$errors', _$errors);
        }

        return Errorable;
    }]);
var sdkModelValidation = angular.module('ag.sdk.model.validation', ['ag.sdk.library', 'ag.sdk.model.base', 'ag.sdk.model.validators']);

sdkModelValidation.factory('Validatable', ['computedProperty', 'privateProperty', 'underscore', 'Validatable.Field',
    'Validator.dateRange',
    'Validator.equal',
    'Validator.format',
    'Validator.inclusion',
    'Validator.length',
    'Validator.numeric',
    'Validator.range',
    'Validator.required',
    'Validator.requiredIf',
    function (computedProperty, privateProperty, underscore, Field) {
        function Validatable () {
            var _validations = {};

            privateProperty(_validations, 'add', function (validationSpec) {
                underscore.each(validationSpec, function (validationSet, fieldName) {
                    if (_validations[fieldName]) {
                        _validations[fieldName].addValidators(validationSet);
                    } else {
                        _validations[fieldName] = new Field(fieldName, validationSet);
                    }
                });
            });

            privateProperty(_validations, 'validate', function (instance, fieldName) {
                var toValidate = getFieldsToValidate(fieldName);

                underscore.each(toValidate, function (validation) {
                    validateField(instance, validation);
                });

                return instance.$errors.countFor(fieldName) === 0;
            });

            function validateField (instance, validation) {
                if (validation.validate(instance) === false) {
                    instance.$errors.add(validation.field, validation.message);
                } else {
                    instance.$errors.clear(validation.field, validation.message);
                }
            }

            function getFieldsToValidate (fieldName) {
                if (fieldName && _validations[fieldName]) {
                    return _validations[fieldName];
                }

                return underscore.chain(_validations)
                    .map(function (validations) {
                        return validations;
                    })
                    .flatten()
                    .value();
            }

            privateProperty(this, 'validations', _validations);
            privateProperty(this, 'validates', _validations.add);

            privateProperty(this, '__validate', function (fieldName) {
                return this.constructor.validations.validate(this, fieldName);
            });

            computedProperty(this, '__$valid', function () {
                return this.constructor.validations.validate(this);
            });

            computedProperty(this, '__$invalid', function () {
                return !this.constructor.validations.validate(this);
            });
        }

        return Validatable;
    }]);

sdkModelValidation.factory('Validatable.DuplicateValidatorError', [function () {
    function DuplicateValidatorError(name) {
        this.name = 'DuplicateValidatorError';
        this.message = 'A validator by the name ' + name + ' is already registered';
    }

    DuplicateValidatorError.prototype = Error.prototype;

    return DuplicateValidatorError;
}]);

sdkModelValidation.factory('Validatable.ValidationMessageNotFoundError', [function() {
    function ValidationMessageNotFoundError(validatorName, fieldName) {
        this.name    = 'ValidationMessageNotFound';
        this.message = 'Validation message not found for validator ' + validatorName + ' on the field ' + fieldName + '. Validation messages must be added to validators in order to provide your users with useful error messages.';
    }

    ValidationMessageNotFoundError.prototype = Error.prototype;

    return ValidationMessageNotFoundError;
}]);

sdkModelValidation.factory('Validatable.Field', ['privateProperty', 'underscore', 'Validatable.Validation', 'Validatable.ValidationMessageNotFoundError', 'Validatable.Validator', 'Validatable.validators',
    function (privateProperty, underscore, Validation, ValidationMessageNotFoundError, Validator, validators) {
        function Field (name, validationSet) {
            var field = [];

            privateProperty(field, 'addValidator', function (options, validationName) {
                var validator = validators.find(validationName) || new Validator(options, validationName),
                    configuredFunctions = underscore.flatten([validator.configure(options)]);

                if (underscore.isUndefined(validator.message)) {
                    throw new ValidationMessageNotFoundError(validationName, name);
                }

                underscore.each(configuredFunctions, function (configuredFunction) {
                    field.push(new Validation(name, configuredFunction));
                })
            });

            privateProperty(field, 'addValidators', function (validationSet) {
                underscore.each(validationSet, field.addValidator);
            });

            field.addValidators(validationSet);

            return field;
        }

        return Field;
    }]);

sdkModelValidation.factory('Validatable.Validation', ['privateProperty', function (privateProperty) {
    function Validation (field, validationFunction) {
        privateProperty(this, 'field', field);
        privateProperty(this, 'message', validationFunction.message);
        privateProperty(this, 'validate', function (instance) {
            return validationFunction(instance[field], instance, field);
        });
    }

    return Validation;
}]);

sdkModelValidation.factory('Validatable.ValidationFunction', ['underscore', function (underscore) {
    function ValidationFunction (validationFunction, options) {
        var boundFunction = underscore.bind(validationFunction, options);
        boundFunction.message = configureMessage();

        function configureMessage () {
            if (underscore.isString(options.message)) {
                return options.message;
            }

            if (underscore.isFunction(options.message)) {
                return options.message.apply(options);
            }
        }

        return boundFunction;
    }

    return ValidationFunction;
}]);

sdkModelValidation.factory('Validatable.ValidatorNotFoundError', [function() {
    function ValidatorNotFoundError(name) {
        this.name    = 'ValidatorNotFoundError';
        this.message = 'No validator found by the name of ' + name + '. Custom validators must define a validator key containing the custom validation function';
    }

    ValidatorNotFoundError.prototype = Error.prototype;

    return ValidatorNotFoundError;
}]);

sdkModelValidation.factory('Validatable.Validator', ['privateProperty', 'underscore', 'Validatable.ValidationFunction', 'Validatable.ValidatorNotFoundError', 'Validatable.validators',
    function (privateProperty, underscore, ValidationFunction, ValidatorNotFoundError, validators) {
        function AnonymousValidator(options, name) {
            if (underscore.isFunction(options.validator)) {
                if (options.message) {
                    options.validator.message = options.message;
                }

                return new Validator(options.validator, name);
            }
        }

        function Validator (validationFunction, name) {
            if (validationFunction.validator) {
                return new AnonymousValidator(validationFunction, name);
            }

            if (underscore.isFunction(validationFunction) === false) {
                throw new ValidatorNotFoundError(name);
            }

            var validator = this;

            privateProperty(validator, 'name', validationFunction.name);
            privateProperty(validator, 'message', validationFunction.message);
            privateProperty(validator, 'childValidators', {});
            privateProperty(validator, 'configure', function (options) {
                options = defaultOptions(options);

                if (underscore.size(validator.childValidators) > 0) {
                    return configuredChildren(options);
                }

                return new ValidationFunction(validationFunction, underscore.defaults(options, this));
            });

            addChildValidators(validationFunction.options);
            validators.register(validator);

            function addChildValidators (options) {
                underscore.each(options, function (value, key) {

                    if (value.constructor.name === 'Validator') {
                        validator.childValidators[key] = value;
                    }
                });
            }

            function configuredChildren (options) {
                return underscore.chain(validator.childValidators)
                    .map(function (childValidator, name) {
                        if (options[name] !== undefined) {
                            return childValidator.configure(options[name]);
                        }
                    })
                    .compact()
                    .value();
            }

            function defaultOptions (options) {
                if (underscore.isObject(options) === false) {
                    options = {
                        value: options,
                        message: validator.message
                    };
                }

                if (underscore.isUndefined(validationFunction.name) == false) {
                    options[validationFunction.name] = options.value;
                }

                return options;
            }
        }

        return Validator;
    }]);

sdkModelValidation.factory('Validatable.validators', ['Validatable.DuplicateValidatorError', 'privateProperty', 'underscore',
    function (DuplicateValidatorError, privateProperty, underscore) {
        var validators = {};

        privateProperty(validators, 'register', function (validator) {
            if (underscore.isUndefined(validators[validator.name])) {
                validators[validator.name] = validator;
            } else {
                throw new DuplicateValidatorError(validator.name);
            }
        });

        privateProperty(validators, 'find', function (validatorName) {
            return validators[validatorName];
        });

        return validators;
    }]);

var sdkModelValidators = angular.module('ag.sdk.model.validators', ['ag.sdk.library', 'ag.sdk.model.validation']);

/**
 * Date Validator
 */
sdkModelValidators.factory('Validator.dateRange', ['moment', 'underscore', 'Validatable.Validator', 'Validator.dateRange.after', 'Validator.dateRange.before',
    function (moment, underscore, Validator, after, before) {
        function dateRange (value, instance, field) {}

        dateRange.message = function () {
            return 'Is not a valid date';
        };

        dateRange.options = {
            after: after,
            before: before
        };

        return new Validator(dateRange);
    }]);

sdkModelValidators.factory('Validator.dateRange.after', ['moment', 'underscore', 'Validatable.Validator',
    function (moment, underscore, Validator) {
        function after (value, instance, field) {
            if (underscore.isUndefined(this.after) || underscore.isUndefined(value) || underscore.isNull(value) || value === '') {
                return true;
            }

            return moment(value) >= moment(this.after);
        }

        after.message = function () {
            return 'Must be at least ' + moment(this.after).format("dddd, MMMM Do YYYY, h:mm:ss a");
        };

        return new Validator(after);
    }]);

sdkModelValidators.factory('Validator.dateRange.before', ['moment', 'underscore', 'Validatable.Validator',
    function (moment, underscore, Validator) {
        function before (value, instance, field) {
            if (underscore.isUndefined(this.before) || underscore.isUndefined(value) || underscore.isNull(value) || value === '') {
                return true;
            }

            return moment(value) <= moment(this.before);
        }

        before.message = function () {
            return 'Must be no more than ' + moment(this.before).format("dddd, MMMM Do YYYY, h:mm:ss a");
        };

        return new Validator(before);
    }]);

/**
 * Equals Validator
 */
sdkModelValidators.factory('Validator.equal', ['underscore', 'Validatable.Validator',
    function (underscore, Validator) {
        function equal (value, instance, field) {
            if (underscore.isUndefined(this.to)) {
                throw 'Equal validator must specify an \'to\' attribute';
            }

            return value === this.to;
        }

        equal.message = function () {
            return 'Must be equal to \'' + this.to + '\'';
        };

        return new Validator(equal);
    }]);

/**
 * Format Validator
 */
sdkModelValidators.factory('Validator.format', ['underscore', 'Validatable.Validator', 'Validator.format.date', 'Validator.format.email', 'Validator.format.telephone', 'Validator.format.uuid',
    function (underscore, Validator, date, email, telephone, uuid) {
        function format (value, instance, field) {}

        format.message = function () {
            return 'Must be the correct format';
        };

        format.options = {
            date: date,
            email: email,
            telephone: telephone,
            uuid: uuid
        };

        return new Validator(format);
    }]);

sdkModelValidators.factory('Validator.format.date', ['moment', 'underscore', 'Validatable.Validator',
    function (moment, underscore, Validator) {
        function date (value, instance, field) {
            if (underscore.isUndefined(value) || underscore.isNull(value) || value === '') {
                return true;
            }

            return moment(value).isValid();
        }

        date.message = function () {
            return 'Must be a valid date';
        };

        return new Validator(date);
    }]);

sdkModelValidators.factory('Validator.format.email', ['moment', 'underscore', 'Validatable.Validator',
    function (moment, underscore, Validator) {
        var regexValidator = new RegExp('^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,6}$');

        function email (value, instance, field) {
            if (underscore.isUndefined(value) || underscore.isNull(value) || value === '') {
                return true;
            }

            return regexValidator.test(value);
        }

        email.message = function () {
            return 'Must be a valid email address';
        };

        return new Validator(email);
    }]);

sdkModelValidators.factory('Validator.format.telephone', ['moment', 'underscore', 'Validatable.Validator',
    function (moment, underscore, Validator) {
        var regexValidator = new RegExp('^(\\(?\\+?[0-9]*\\)?)?[0-9_\\- \\(\\)]*$');

        function telephone (value, instance, field) {
            if (underscore.isUndefined(value) || underscore.isNull(value) || value === '') {
                return true;
            }

            return regexValidator.test(value);
        }

        telephone.message = function () {
            return 'Must be a valid telephone number';
        };

        return new Validator(telephone);
    }]);

sdkModelValidators.factory('Validator.format.uuid', ['moment', 'underscore', 'Validatable.Validator',
    function (moment, underscore, Validator) {
        var regexValidator = new RegExp('^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$', 'i');

        function uuid (value, instance, field) {
            if (underscore.isUndefined(value) || underscore.isNull(value) || value === '') {
                return true;
            }

            return regexValidator.test(value);
        }

        uuid.message = function () {
            return 'Must be a valid UUID';
        };

        return new Validator(uuid);
    }]);

/**
 * Inclusion Validator
 */
sdkModelValidators.factory('Validator.inclusion', ['underscore', 'Validatable.Validator',
    function (underscore, Validator) {
        function inclusion (value, instance, field) {
            if (underscore.isUndefined(value) || underscore.isNull(value)) {
                return false;
            }

            if (underscore.isUndefined(this.in) || underscore.isArray(this.in) === false) {
                throw 'Inclusion validator must specify an \'in\' attribute';
            }

            return underscore.some(this.in, function (item) {
                return value === item;
            })
        }

        inclusion.message = function () {
            return 'Must be one of \''+ this.in.join(', ') + '\'';
        };

        return new Validator(inclusion);
    }]);

/**
 * Length Validators
 */
sdkModelValidators.factory('Validator.length', ['Validatable.Validator', 'Validator.length.min', 'Validator.length.max',
    function (Validator, min, max) {
        function length () {
            return true;
        }

        length.message = 'does not meet the length requirement';

        length.options = {
            min: min,
            max: max
        };

        return new Validator(length);
    }]);

sdkModelValidators.factory('Validator.length.min', ['underscore', 'Validatable.Validator',
    function (underscore, Validator) {
        function min (value, instance, field) {
            if (underscore.isUndefined(value) || underscore.isNull(value)) {
                return true;
            }

            return value.length >= this.min;
        }

        min.message = function () {
            return 'Must be at least ' + this.min + ' characters';
        };

        return new Validator(min);
    }]);

sdkModelValidators.factory('Validator.length.max', ['underscore', 'Validatable.Validator',
    function (underscore, Validator) {
        function max (value, instance, field) {
            if (underscore.isUndefined(value) || underscore.isNull(value)) {
                return true;
            }

            return value.length <= this.max;
        }

        max.message = function () {
            return 'Must be no more than ' + this.max + ' characters';
        };

        return new Validator(max);
    }]);

/**
 * Numeric Validator
 */
sdkModelValidators.factory('Validator.numeric', ['underscore', 'Validatable.Validator',
    function (underscore, Validator) {
        function numeric (value, instance, field) {
            if (underscore.isUndefined(value) || underscore.isNull(value)) {
                return true;
            }

            return (typeof value == 'number' && underscore.isNumber(value));
        }

        numeric.message = function () {
            return 'Must be a number';
        };

        return new Validator(numeric);
    }]);

/**
 * Range Validators
 */
sdkModelValidators.factory('Validator.range', ['Validatable.Validator', 'Validator.range.from', 'Validator.range.to',
    function (Validator, from, to) {
        function range () {
            return true;
        }

        range.message = 'Must be with the range requirement';

        range.options = {
            from: from,
            to: to
        };

        return new Validator(range);
    }]);

sdkModelValidators.factory('Validator.range.from', ['underscore', 'Validatable.Validator',
    function (underscore, Validator) {
        function from (value, instance, field) {
            if (underscore.isUndefined(value) || underscore.isNull(value) || value === '') {
                return true;
            }

            return value >= this.from;
        }

        from.message = function () {
            return 'Must be at least ' + this.from;
        };

        return new Validator(from);
    }]);

sdkModelValidators.factory('Validator.range.to', ['underscore', 'Validatable.Validator',
    function (underscore, Validator) {
        function to (value, instance, field) {
            if (underscore.isUndefined(value) || underscore.isNull(value) || value === '') {
                return true;
            }

            return value <= this.to;
        }

        to.message = function () {
            return 'Must be no more than ' + this.to;
        };

        return new Validator(to);
    }]);

/**
 * Required Validator
 */
sdkModelValidators.factory('Validator.required', ['underscore', 'Validatable.Validator',
    function (underscore, Validator) {
        function required (value, instance, field) {
            if (underscore.isUndefined(value) || underscore.isNull(value)) {
                return false;
            }

            if (value.constructor.name === 'String') {
                return !!(value && value.length || typeof value == 'object');
            }

            return value !== undefined;
        }

        required.message = 'cannot be blank';

        return new Validator(required);
    }]);

/**
 * Required If Validator
 */
sdkModelValidators.factory('Validator.requiredIf', ['underscore', 'Validatable.Validator',
    function (underscore, Validator) {
        function requiredIf (value, instance, field) {
            if (!this(value, instance, field)) {
                return true;
            } else {
                if (underscore.isUndefined(value) || underscore.isNull(value)) {
                    return false;
                }

                if (value.constructor.name == 'String') {
                    return !!(value && value.length || typeof value == 'object');
                }

                return value !== undefined;
            }
        }

        requiredIf.message = 'cannot be blank';

        return new Validator(requiredIf);
    }]);
angular.module('ag.sdk.helper', [
    'ag.sdk.helper.asset',
    'ag.sdk.helper.attachment',
    'ag.sdk.helper.crop-inspection',
    'ag.sdk.helper.document',
    'ag.sdk.helper.enterprise-budget',
    'ag.sdk.helper.expense',
    'ag.sdk.helper.farmer',
    'ag.sdk.helper.favourites',
    'ag.sdk.helper.merchant',
    'ag.sdk.helper.production-plan',
    'ag.sdk.helper.region',
    'ag.sdk.helper.task',
    'ag.sdk.helper.team',
    'ag.sdk.helper.user'
]);

angular.module('ag.sdk.interface', [
    'ag.sdk.interface.ui',
    'ag.sdk.interface.list',
    'ag.sdk.interface.map',
    'ag.sdk.interface.navigation'
]);

angular.module('ag.sdk.model', [
    'ag.sdk.model.asset',
    'ag.sdk.model.base',
    'ag.sdk.model.business-plan',
    'ag.sdk.model.document',
    'ag.sdk.model.farm-valuation',
    'ag.sdk.model.legal-entity',
    'ag.sdk.model.liability',
    'ag.sdk.model.production-plan',
    'ag.sdk.model.errors',
    'ag.sdk.model.validation',
    'ag.sdk.model.validators'
]);

angular.module('ag.sdk.test', [
    'ag.sdk.test.data'
]);

angular.module('ag.mobile-sdk', [
    'ag.sdk.authorization',
    'ag.sdk.id',
    'ag.sdk.utilities',
    'ag.sdk.model',
    'ag.sdk.monitor',
    'ag.sdk.interface.map',
    'ag.sdk.helper',
    'ag.sdk.library',
    'ag.sdk.test',
    'ag.mobile-sdk.helper',
    'ag.mobile-sdk.api',
    'ag.mobile-sdk.data',
    'ag.mobile-sdk.hydration'
]);
