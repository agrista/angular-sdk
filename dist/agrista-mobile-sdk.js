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

var skdUtilitiesApp = angular.module('ag.sdk.utilities', ['ngCookies']);

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

                        if (dataMap) {
                            res = dataMapService(res, dataMap);
                        }

                        itemStore(res);

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

var sdkHelperAssetApp = angular.module('ag.sdk.helper.asset', ['ag.sdk.helper.farmer', 'ag.sdk.helper.attachment', 'ag.sdk.library']);

sdkHelperAssetApp.factory('assetHelper', ['$filter', 'attachmentHelper', 'landUseHelper', 'underscore', function($filter, attachmentHelper, landUseHelper, underscore) {
    var _listServiceMap = function(item, metadata) {
        var map = {
            id: item.id || item.__id,
            type: item.type,
            updatedAt: item.updatedAt
        };

        if (item.data) {
            if (item.type == 'crop') {
                map.title = (item.data.plantedArea ? item.data.plantedArea.toFixed(2) + 'Ha of ' : '') + (item.data.crop ? item.data.crop : '') + (item.data.fieldName ? ' on field ' + item.data.fieldName : '');
                map.subtitle = (item.data.season ? item.data.season : '');
                map.groupby = item.farmId;
            } else if (item.type == 'farmland') {
                map.title = (item.data.portionLabel? item.data.portionLabel :
                    (item.data.portionNumber ? 'Portion ' + item.data.portionNumber : 'Remainder of farm'));
                map.subtitle = (item.data.area !== undefined ? 'Area: ' + item.data.area.toFixed(2) + 'Ha' : 'Unknown area');
                map.groupby = item.farmId;
            } else if (item.type == 'improvement') {
                map.title = item.data.name;
                map.subtitle = item.data.type + ' - ' + item.data.category;
                map.summary = (item.data.description || '');
                map.groupby = item.farmId;
            } else if (item.type == 'cropland') {
                map.title = (item.data.irrigated ? item.data.irrigation + ' from ' + item.data.waterSource : 'Non irrigable ' + item.type) + (item.data.fieldName ? ' on field ' + item.data.fieldName : '');
                map.subtitle = (item.data.size !== undefined ? 'Area: ' + item.data.size.toFixed(2) + 'Ha' : 'Unknown area');
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
            } else if (item.type == 'wasteland') {
                map.title = 'Wasteland';
                map.subtitle = (item.data.size !== undefined ? 'Area: ' + item.data.size.toFixed(2) + 'Ha' : 'Unknown area');
                map.groupby = item.farmId;
            } else if (item.type == 'water right') {
                map.title = item.data.waterSource + (item.data.fieldName ? ' on field ' + item.data.fieldName : '');
                map.subtitle = (item.data.size !== undefined ? 'Irrigatable Extent: ' + item.data.size.toFixed(2) + 'Ha' : 'Unknown area');
                map.groupby = item.farmId;
            }

            map.image = attachmentHelper.getThumbnail(item.data.attachments);
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

    var _commodityTypes = {
        crop: 'Field Crops',
        horticulture: 'Horticulture',
        livestock: 'Livestock'
    };

    var _commodities = {
        crop: ['Barley', 'Cabbage', 'Canola', 'Chicory', 'Citrus (Hardpeel)', 'Cotton', 'Cow Peas', 'Dry Bean', 'Dry Grapes', 'Dry Peas', 'Garlic', 'Grain Sorghum', 'Green Bean', 'Ground Nut', 'Hybrid Maize Seed', 'Lentils', 'Lucerne', 'Maize (Fodder)', 'Maize (Green)', 'Maize (Seed)', 'Maize (White)', 'Maize (Yellow)', 'Oats', 'Onion', 'Onion (Seed)', 'Popcorn', 'Potato', 'Pumpkin', 'Rye', 'Soya Bean', 'Sugar Cane', 'Sunflower', 'Sweetcorn', 'Tobacco', 'Tobacco (Oven dry)', 'Tomatoes', 'Watermelon', 'Wheat'],
        horticulture: ['Almonds', 'Apples', 'Apricots', 'Avo', 'Avocado', 'Bananas', 'Cherries', 'Chilli', 'Citrus (Hardpeel Class 1)', 'Citrus (Softpeel)', 'Coffee', 'Figs', 'Grapes (Table)', 'Grapes (Wine)', 'Guavas', 'Hops', 'Kiwi Fruit', 'Lemons', 'Macadamia Nut', 'Mango', 'Mangos', 'Melons', 'Nectarines', 'Olives', 'Oranges', 'Papaya', 'Peaches', 'Peanut', 'Pears', 'Pecan Nuts', 'Persimmons', 'Pineapples', 'Pistachio Nuts', 'Plums', 'Pomegranates', 'Prunes', 'Quinces', 'Rooibos', 'Strawberries', 'Triticale', 'Watermelons'],
        livestock: ['Cattle (Extensive)', 'Cattle (Feedlot)', 'Cattle (Stud)', 'Chicken (Broilers)', 'Chicken (Layers)', 'Dairy', 'Game', 'Goats', 'Horses', 'Ostrich', 'Pigs', 'Sheep (Extensive)', 'Sheep (Feedlot)', 'Sheep (Stud)']
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
        getAssetTitle: function (type) {
            return _assetTypes[type];
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
        getCommodities: function (type) {
            return _commodities[type] || '';
        },
        getZoneTitle: function (zone) {
            return zone.size + 'Ha at stage ' + zone.growthStage + ' (' + zone.cultivar + ')';
        },

        commodityTypes: function() {
            return _commodityTypes;
        },
        commodities: function() {
            return _commodities;
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

    function monthDiff (d1, d2) {
        var months = (d2.getFullYear() - d1.getFullYear()) * 12;
        months -= d1.getMonth() + 1;
        months += d2.getMonth();
        return months <= 0 ? 0 : months;
    }

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
                asset.data.valuation.totalDepreciation = underscore.reduce(['physicalDepreciation', 'functionalDepreciation', 'economicDepreciation', 'purchaserResistance'], function (total, type) {
                    return isNaN(asset.data.valuation[type]) ? total : total + (asset.data.valuation[type] / 100);
                }, 0);

                asset.data.assetValue = Math.round((asset.data.valuation.replacementValue || 0) * (1 - Math.min(asset.data.valuation.totalDepreciation, 1)));
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
                    return (field.irrigated === true && item.assetClass === 'Irrigated Cropland') ||
                        (field.irrigated !== true && item.assetClass === 'Cropland' &&
                            (item.soilPotential === undefined || item.soilPotential === field.croppingPotential));
                });
            } else if (asset.type === 'pasture' || asset.type === 'wasteland') {
                chain = chain.where({assetClass: field.landUse}).filter(function (item) {
                    return ((asset.data.crop === undefined && item.crop === undefined) || (item.crop !== undefined && item.crop.indexOf(asset.data.crop) !== -1)) &&
                        ((field.terrain === undefined && item.terrain === undefined) || item.terrain === field.terrain);
                });
            } else if (asset.type === 'permanent crop') {
                var establishedDate = new Date(Date.parse(asset.data.establishedDate));
                var monthsFromEstablised = monthDiff(establishedDate, new Date());

                chain = chain.filter(function (item) {
                    return (item.crop === undefined || item.crop.indexOf(asset.data.crop) !== -1) &&
                        (item.irrigationType === undefined || item.irrigationType.indexOf(field.irrigation) !== -1) &&
                        (item.minAge === undefined || monthsFromEstablised >= item.minAge) &&
                        (item.maxAge === undefined || monthsFromEstablised < item.maxAge);
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
        defaultImage: 'img/camera.png'
    };

    this.config = function (options) {
        _options = underscore.defaults(options || {}, _options);
    };

    this.$get = function () {
        var _getResizedAttachment = function (attachments, size) {
            if (attachments !== undefined) {
                if ((attachments instanceof Array) == false) {
                    attachments = [attachments];
                }

                return underscore.chain(attachments)
                    .filter(function (attachment) {
                        return (attachment.sizes !== undefined && attachment.sizes[size] !== undefined);
                    }).map(function (attachment) {
                        return attachment.sizes[size].src;
                    }).last().value();
            }

            return attachments;
        };

        return {
            getSize: function (attachments, size) {
                return _getResizedAttachment(attachments, size) || _options.defaultImage;
            },
            getThumbnail: function (attachments) {
                return _getResizedAttachment(attachments, 'thumb') || _options.defaultImage;
            }
        };
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
        'harvest inspection': 'Harvest Inspection',
        'preharvest inspection': 'Pre Harvest Inspection',
        'progress inspection': 'Progress Inspection'
    };

    var _seedTypeTable = [
        ['Maize Commodity', 'Maize Hybrid', 'Maize Silo Fodder']
    ];

    var _seedTypes = {
        'Maize': _seedTypeTable[0],
        'Maize (White)': _seedTypeTable[0],
        'Maize (Yellow)': _seedTypeTable[0]
    };

    var _policyTypes = {
        'hail': 'Hail',
        'multi peril': 'Multi Peril'
    };

    var _policyInspections = {
        'hail': ['hail inspection'],
        'multi peril': underscore.keys(_inspectionTypes)
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
        getPolicyTitle: function (type) {
            return _policyTypes[type] || '';
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

                if (_flowerTypes[asset.data.crop] === 'ear') {
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
            if (_documentMap[item.docType]) {
                var docMap = _documentMap[item.docType];
                var map = {
                    id: item.id || item.__id,
                    title: (item.documentId ? item.documentId : ''),
                    subtitle: (item.author ? 'By ' + item.author + ' on ': 'On ') + $filter('date')(item.createdAt),
                    docType: item.docType,
                    group: docMap.title
                };

                if (item.organization && item.organization.name) {
                    map.title = item.organization.name;
                    map.subtitle = (item.documentId ? item.documentId : '');
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
            subtitle: item.commodityType + (item.regionName? ' in ' + item.regionName : '')
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
            'Wether (2-tooth plus)': 0.23,
            'Ram (2-tooth plus)': 0.23
        },
        Goats: {
            'Kid': 0.12,
            'Weaner kids': 0.12,
            'Ewe (2-tooth plus)': 0.17,
            'Castrate (2-tooth plus)': 0.17,
            'Ram (2-tooth plus)': 0.12
        }
    };

    var _horticultureStages = {
        'Pears': ['1-7 years', '7-12 years', '12-20 years', '20+ years'],
        'Apples': ['1-7 years', '7-12 years', '12-20 years', '20+ years'],
        'Olives': ['2-3 years', '5-7 years', '9-19 years', '21-25 years', '25+ years'],
        'Pecan nuts': ['1-2 years', '4-5 years', '6-8 years', '8+ years'],
        'Peaches': ['1-2 years', '3-5 years', '5-8 years', '8+ years'],
        'Stone Fruit': ['2-3 years', '5-7 years', '9-19 years', '21-25 years', '25+ years'],
        'Grapes': ['0-1 years', '1-2 years', '2-3 years', '3+ years'],
        'Oranges': ['2-3 years', '5-7 years', '9-19 years', '21-25 years', '25+ years'],
        'Macadamia': ['0-1 years', '2-3 years', '4-6 years', '7-9 years','10+ years']
    }

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
        budget.data.sections = budget.data.sections || [];
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
        getRepresentativeAnimal: function(commodityType) {
            return _representativeAnimal[getBaseAnimal(commodityType)];
        },
        getConversionRate: function(commodityType) {
            return _conversionRate[getBaseAnimal(commodityType)][_representativeAnimal[getBaseAnimal(commodityType)]];
        },
        getConversionRates: function(commodityType) {
            return _conversionRate[getBaseAnimal(commodityType)];
        },
        getHorticultureStages: function(commodityType) {
            return _horticultureStages[commodityType] || [];
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
            category.quantity = 0;
            category.pricePerUnit = 0;
            category.value = 0;

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
                                .pluck('productCategoryGroups')
                                .flatten()
                                .reduce(function(total, group) {
                                    return (group.name == category.incomeGroup ? total + group.total.value : total);
                                }, 0)
                                .value();

                            category.value = category.pricePerUnit * groupSum / 100;

                            if(budget.assetType == 'livestock') {
                                category.valuePerLSU = category.pricePerUnit / _conversionRate[getBaseAnimal(budget.commodityType)][category.name];
                            }
                        } else {
                            if(category.unit == 'Total') {
                                category.quantity = 1;
                            }

                            category.value = category.pricePerUnit * category.quantity;

                            if(budget.assetType == 'livestock') {
                                category.valuePerLSU = category.pricePerUnit / _conversionRate[getBaseAnimal(budget.commodityType)][category.name];
                            }
                        }

                        group.total.value += category.value;

                        if(budget.assetType == 'livestock') {
                            group.total.valuePerLSU += category.valuePerLSU;
                        }
                    });

                    section.total.value += group.total.value;

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

sdkHelperFarmerApp.factory('farmerHelper', ['geoJSONHelper', function(geoJSONHelper) {
    var _listServiceMap = function (item) {
        return {
            id: item.id || item.__id,
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

        if (item.data) {
            map.image = attachmentHelper.getThumbnail(item.data.attachments);
        }

        return map;
    };

    var _legalEntityTypes = ['Individual', 'Sole Proprietary', 'Joint account', 'Partnership', 'Close Corporation', 'Private Company', 'Public Company', 'Trust', 'Non-Profitable companies', 'Cooperatives', 'In- Cooperatives', 'Other Financial Intermediaries'];

    var _enterpriseTypes = {
        'Field Crops': ['Barley', 'Cabbage', 'Canola', 'Chicory', 'Cotton', 'Cow Peas', 'Dry Bean', 'Dry Grapes', 'Dry Peas', 'Garlic', 'Grain Sorghum', 'Green Bean', 'Ground Nut', 'Hybrid Maize Seed', 'Lentils', 'Lucerne', 'Maize (Fodder)', 'Maize (Green)', 'Maize (Seed)', 'Maize (White)', 'Maize (Yellow)', 'Oats', 'Onion', 'Onion (Seed)', 'Popcorn', 'Potato', 'Pumpkin', 'Rye', 'Soya Bean', 'Sugar Cane', 'Sunflower', 'Sweetcorn', 'Tobacco', 'Tobacco (Oven dry)', 'Tomatoes', 'Watermelon', 'Wheat'],
        'Horticulture': ['Almonds', 'Apples', 'Apricots', 'Avocado', 'Bananas', 'Cherries', 'Chilli', 'Coffee', 'Figs', 'Grapes (Table)', 'Grapes (Wine)', 'Guavas', 'Hops', 'Kiwi Fruit', 'Lemons', 'Macadamia Nut', 'Mangos', 'Melons', 'Nectarines', 'Olives', 'Oranges', 'Papaya', 'Peaches', 'Peanut', 'Pears', 'Pecan Nuts', 'Persimmons', 'Pineapples', 'Pistachio Nuts', 'Plums', 'Pomegranates', 'Prunes', 'Quinces', 'Rooibos', 'Strawberries', 'Triticale', 'Watermelons'],
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

    var _landUseCropTypes = {
        'Cropland': ['Barley', 'Bean', 'Bean (Broad)', 'Bean (Dry)', 'Bean (Sugar)', 'Bean (Green)', 'Bean (Kidney)', 'Canola', 'Cassava', 'Cotton', 'Cowpea', 'Grain Sorghum', 'Groundnut', 'Maize', 'Maize (White)', 'Maize (Yellow)', 'Oats', 'Pearl Millet', 'Potato', 'Rape', 'Rice', 'Rye', 'Soya Bean', 'Sunflower', 'Sweet Corn', 'Sweet Potato', 'Tobacco', 'Triticale', 'Wheat', 'Wheat (Durum)'],
        'Grazing': ['Bahia-Notatum', 'Bottle Brush', 'Buffalo', 'Buffalo (Blue)', 'Buffalo (White)', 'Bush', 'Cocksfoot', 'Common Setaria', 'Dallis', 'Phalaris', 'Rescue', 'Rhodes', 'Smuts Finger', 'Tall Fescue', 'Teff', 'Veld', 'Weeping Lovegrass'],
        'Horticulture (Perennial)': ['Almond', 'Aloe', 'Apple', 'Apricot', 'Avocado', 'Banana', 'Cherry', 'Coconut', 'Coffee', 'Grape', 'Grape (Bush Vine)', 'Grape (Red)', 'Grape (Table)', 'Grape (White)', 'Grapefruit', 'Guava', 'Hops', 'Kiwi Fruit', 'Lemon', 'Litchi', 'Macadamia Nut', 'Mandarin', 'Mango', 'Nectarine', 'Olive', 'Orange', 'Papaya', 'Peach', 'Pear', 'Pecan Nut', 'Persimmon', 'Pineapple', 'Pistachio Nut', 'Plum', 'Rooibos', 'Sisal', 'Sugarcane', 'Tea', 'Walnuts'],
        'Horticulture (Seasonal)': ['Asparagus', 'Beet', 'Beetroot', 'Blackberry', 'Borecole', 'Brinjal', 'Broccoli', 'Brussel Sprout', 'Cabbage', 'Cabbage (Chinese)', 'Cabbage (Savoy)', 'Cactus Pear', 'Carrot', 'Cauliflower', 'Celery', 'Chicory', 'Chilly', 'Cucumber', 'Cucurbit', 'Dry Pea', 'Garlic', 'Ginger', 'Granadilla', 'Kale', 'Kohlrabi', 'Leek', 'Lespedeza', 'Lettuce', 'Makataan', 'Mustard', 'Mustard (White)', 'Onion', 'Paprika', 'Parsley', 'Parsnip', 'Pea', 'Pepper', 'Pumpkin', 'Quince', 'Radish', 'Squash', 'Strawberry', 'Swede', 'Sweet Melon', 'Swiss Chard', 'Tomato', 'Turnip', 'Vetch (Common)', 'Vetch (Hairy)', 'Watermelon', 'Youngberry'],
        'Plantation': ['Bluegum', 'Pine', 'Wattle'],
        'Planted Pastures': ['Birdsfoot Trefoil', 'Carribean Stylo', 'Clover', 'Clover (Arrow Leaf)', 'Clover (Crimson)', 'Clover (Persian)', 'Clover (Red)', 'Clover (Rose)', 'Clover (Strawberry)', 'Clover (Subterranean)', 'Clover (White)', 'Kikuyu', 'Lucerne', 'Lupin', 'Lupin (Narrow Leaf)', 'Lupin (White)', 'Lupin (Yellow)', 'Medic', 'Medic (Barrel)', 'Medic (Burr)', 'Medic (Gama)', 'Medic (Snail)', 'Medic (Strand)', 'Ryegrass', 'Ryegrass (Hybrid)', 'Ryegrass (Italian)', 'Ryegrass (Westerwolds)', 'Serradella', 'Serradella (Yellow)', 'Silver Leaf Desmodium']
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
        getCenter: function (assets, farm) {
            var geojson = geoJSONHelper();

            angular.forEach(assets, function(asset) {
                if(asset.type == 'farmland' && asset.farmId && asset.farmId == farm.id) {
                    geojson.addGeometry(asset.data.loc);
                }
            });

            return geojson.getCenterAsGeojson();
        },

        validateFieldName: function (farm, newField, oldField) {
            newField.fieldName = (newField.fieldName ? newField.fieldName.toUpperCase().replace(/[^0-9A-Z]/g, '') : newField.fieldName);
            var foundField = underscore.findWhere(farm.data.fields, {fieldName: newField.fieldName});

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

            filterTasks: function (tasks) {
                return underscore.filter(tasks, function (task) {
                    return (_getTaskState(task.todo) !== undefined);
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

var sdkInterfaceInputApp = angular.module('ag.sdk.interface.input', []);

sdkInterfaceInputApp.filter('location', ['$filter', function ($filter) {
    return function (value) {
        return ((value && value.geometry ? $filter('number')(value.geometry.coordinates[0], 3) + ', ' + $filter('number')(value.geometry.coordinates[1], 3) : '') + (value && value.properties ? ' at ' + $filter('number')(value.properties.accuracy, 2) + 'm' : ''));
    };
}]);

sdkInterfaceInputApp.directive('locationFormatter', ['$filter', function ($filter) {
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

sdkInterfaceInputApp.directive('dateFormatter', ['$filter', function ($filter) {
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

sdkInterfaceInputApp.directive('dateParser', ['$filter', function ($filter) {
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

sdkInterfaceInputApp.directive('inputNumber', ['$filter', function ($filter) {
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
                draggable: true,
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
            baseTile: {
                'autoscale': true,
                'bounds': [-180, -85, 180, 85],
                'cache': {
                    'maxzoom': 16,
                    'minzoom': 5
                },
                'center': [24.631347656249993, -28.97931203672245, 6],
                'data': ['http://a.tiles.mapbox.com/v3/agrista.map-65ftbmpi/markers.geojsonp'],
                'geocoder': 'http://a.tiles.mapbox.com/v3/agrista.map-65ftbmpi/geocode/{query}.jsonp',
                'id': 'agrista.map-65ftbmpi',
                'maxzoom': 19,
                'minzoom': 0,
                'name': 'SA Agri Backdrop',
                'private': true,
                'scheme': 'xyz',
                'tilejson': '2.0.0',
                'tiles': ['http://a.tiles.mapbox.com/v3/agrista.map-65ftbmpi/{z}/{x}/{y}.png', 'http://b.tiles.mapbox.com/v3/agrista.map-65ftbmpi/{z}/{x}/{y}.png'],
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
            },
            baseLayers: {
                'Agriculture': {
                    base: true,
                    type: 'mapbox'
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
                        'data': ['http://a.tiles.mapbox.com/v3/agrista.map-tlsadyhb/markers.geojsonp'],
                        'geocoder': 'http://a.tiles.mapbox.com/v3/agrista.map-tlsadyhb/geocode/{query}.jsonp',
                        'id': 'agrista.map-tlsadyhb',
                        'maxzoom': 22,
                        'minzoom': 0,
                        'name': 'Satellite backdrop',
                        'private': true,
                        'scheme': 'xyz',
                        'tilejson': '2.0.0',
                        'tiles': [
                            'http://a.tiles.mapbox.com/v3/agrista.map-tlsadyhb/{z}/{x}/{y}.png',
                            'http://b.tiles.mapbox.com/v3/agrista.map-tlsadyhb/{z}/{x}/{y}.png'
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

                properties = underscore.defaults(properties || {},  {
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
        _this.resetLayers(_this._mapboxServiceInstance.getLayers());
        _this.resetGeoJSON(_this._mapboxServiceInstance.getGeoJSON());
        _this.resetLayerControls(_this._mapboxServiceInstance.getBaseTile(), _this._mapboxServiceInstance.getBaseLayers(), _this._mapboxServiceInstance.getOverlays());
        _this.addControls(_this._mapboxServiceInstance.getControls());
        _this.setBounds(_this._mapboxServiceInstance.getBounds());

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
                this._map.fitBounds((bounds.coordinates.length > 1 ? bounds.coordinates : bounds.coordinates.concat(bounds.coordinates)), bounds.options);
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
                var app = underscore.findWhere(_registeredApps, {id: id});

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

var cordovaCameraApp = angular.module('ag.mobile-sdk.cordova.camera', ['ag.sdk.utilities', 'ag.sdk.library']);

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
cordovaCameraApp.factory('cameraService', ['promiseService', 'underscore', function (promiseService, underscore) {
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

var mobileSdkApiApp = angular.module('ag.mobile-sdk.api', ['ag.sdk.utilities', 'ag.sdk.monitor', 'ag.mobile-sdk.hydration', 'ag.mobile-sdk.data', 'ag.mobile-sdk.cordova.storage', 'ag.sdk.library']);

var _errors = {
    TypeParamRequired: {code: 'TypeParamRequired', message: 'Type parameter is required'},
    UploadPhotoError: {code: 'UploadPhotoError', message: 'Error occured uploading photo'}
};


/*
 * Syncronization
 */
mobileSdkApiApp.factory('apiSynchronizationService', ['$http', '$log', 'assetApi', 'configuration', 'documentApi', 'enterpriseBudgetApi', 'expenseApi', 'farmApi', 'farmerApi', 'fileStorageService', 'legalEntityApi', 'pagingService', 'promiseService', 'taskApi', 'underscore',
    function ($http, $log, assetApi, configuration, documentApi, enterpriseBudgetApi, expenseApi, farmApi, farmerApi, fileStorageService, legalEntityApi, pagingService, promiseService, taskApi, underscore) {
        var _localOptions = {readLocal: true, hydrate: false};
        var _remoteOptions = {readLocal: false, readRemote: true, hydrate: false};

        function _getFarmers (pageOptions) {
            pageOptions = pageOptions || {limit: 20, resulttype: 'full'};

            return farmerApi.purgeFarmer({template: 'farmers', options: {force: false}}).then(function () {
                return promiseService.wrap(function (promise) {
                    var paging = pagingService.initialize(function (page) {
                        return farmerApi.getFarmers({paging: page, options: _remoteOptions});
                    }, function (farmers) {
                        if (paging.complete) {
                            promise.resolve();
                        } else {
                            paging.request().catch(promise.reject);
                        }
                    }, pageOptions);

                    paging.request().catch(promise.reject);
                });
            });
        }

        function _getDocuments (pageOptions) {
            pageOptions = pageOptions || {limit: 20, resulttype: 'full'};

            return documentApi.purgeDocument({template: 'documents', options: {force: false}}).then(function () {
                return promiseService.wrap(function (promise) {
                    var paging = pagingService.initialize(function (page) {
                        return documentApi.getDocuments({paging: page, options: _remoteOptions});
                    }, function (documents) {
                        if (paging.complete) {
                            promise.resolve();
                        } else {
                            paging.request().catch(promise.reject);
                        }
                    }, pageOptions);

                    paging.request().catch(promise.reject);
                });
            });
        }

        function _getExpenses (pageOptions) {
            pageOptions = pageOptions || {limit: 20, resulttype: 'simple'};

            return expenseApi.purgeExpense({template: 'expenses', options: {force: false}}).then(function () {
                return promiseService.wrap(function (promise) {
                    var paging = pagingService.initialize(function (page) {
                        return expenseApi.getExpenses({paging: page, options: _remoteOptions});
                    }, function (expenses) {
                        if (paging.complete) {
                            promise.resolve();
                        } else {
                            paging.request().catch(promise.reject);
                        }
                    }, pageOptions);

                    paging.request().catch(promise.reject);
                });
            });
        }

        function _getTasks (pageOptions) {
            pageOptions = pageOptions || {limit: 20, resulttype: 'full'};

            return taskApi.purgeTask({template: 'tasks', options: {force: false}}).then(function () {
                return promiseService.wrap(function (promise) {
                    var paging = pagingService.initialize(function (page) {
                        return taskApi.getTasks({paging: page, options: _remoteOptions});
                    }, function (tasks) {
                        if (paging.complete) {
                            promise.resolve();
                        } else {
                            paging.request().catch(promise.reject);
                        }
                    }, pageOptions);

                    paging.request().catch(promise.reject);
                });
            });
        }

        function _getEnterpriseBudgets() {
            return enterpriseBudgetApi.getEnterpriseBudgets({options: _remoteOptions});
        }

        function _postFarmers () {
            return farmerApi.getFarmers({options: _localOptions}).then(function (farmers) {
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
            return farmApi.getFarms({id: farmerId, options: _localOptions}).then(function (farms) {
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
            return legalEntityApi.getEntities({id: farmerId, options: _localOptions}).then(function (entities) {
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
            return assetApi.getAssets({id: entityId, options: _localOptions}).then(function (assets) {
                return promiseService.chain(function (chain) {
                    angular.forEach(assets, function (asset) {
                        if (asset.__dirty === true) {
                            chain.push(function () {
                                return _postAsset(asset);
                            });
                        }
                    });
                });
            }, promiseService.throwError);
        }

        function _postAsset (asset) {
            asset.data = asset.data || {};

            var cachedAttachments = (asset.data.attachments ? angular.copy(asset.data.attachments) : []);
            var toBeAttached = underscore.where(cachedAttachments, {local: true});
            asset.data.attachments = underscore.difference(cachedAttachments, toBeAttached);

            return assetApi.postAsset({data: asset}).then(function (result) {
                result = (result && result.length ? result[0] : result);

                return promiseService.chain(function (chain) {
                    angular.forEach(toBeAttached, function (attachment) {
                        chain.push(function () {
                            return _postAttachment('asset', result.id, attachment);
                        });
                    });
                });
            }, promiseService.throwError);
        }

        function _postDocuments () {
            return documentApi.getDocuments({options: _localOptions}).then(function (documents) {
                return promiseService.chain(function (chain) {
                    angular.forEach(documents, function (document) {
                        if (document.__dirty === true) {
                            chain.push(function () {
                                return _postDocument(document);
                            });
                        }
                    });
                });
            }, promiseService.throwError);
        }

        function _postDocument (document) {
            document.data = document.data || {};

            var cachedAttachments = (document.data.attachments ? angular.copy(document.data.attachments) : []);
            var toBeAttached = underscore.where(cachedAttachments, {local: true});
            document.data.attachments = underscore.difference(cachedAttachments, toBeAttached);

            return documentApi.postDocument({data: document}).then(function (result) {
                return promiseService.chain(function (chain) {
                    angular.forEach(toBeAttached, function (attachment) {
                        chain.push(function () {
                            return _postAttachment('document', result.id, attachment);
                        });
                    });
                });
            }, promiseService.throwError);
        }

        function _postExpenses () {
            return expenseApi.getExpenses({options: _localOptions}).then(function (expenses) {
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
            var query = (task !== undefined ? {template: 'tasks/:id', schema: {id: task.id}, options: _localOptions} : {options: _localOptions});

            return taskApi.getTasks(query).then(function (subtasks) {
                return promiseService.chain(function (chain) {
                    angular.forEach(subtasks, function (subtask) {
                        if (task === undefined) {
                            chain.push(function () {
                                return _postTasks(subtask);
                            });
                        } else if (subtask.__dirty === true) {
                            chain.push(function () {
                                return _postTask(subtask);
                            });
                        }
                    });

                    if (task && task.__dirty === true) {
                        chain.push(function () {
                            return _postTask(task);
                        });
                    }
                });
            }, promiseService.throwError);
        }

        function _postTask (task) {
            task.data = task.data || {};

            var cachedAttachments = (task.data.attachments ? angular.copy(task.data.attachments) : []);
            var toBeAttached = underscore.where(cachedAttachments, {local: true});
            task.data.attachments = underscore.difference(cachedAttachments, toBeAttached);

            return taskApi.postTask({data: task}).then(function (result) {
                return promiseService.chain(function (chain) {
                    angular.forEach(toBeAttached, function (attachment) {
                        chain.push(function () {
                            return _postAttachment('task', result.id, attachment);
                        });
                    });
                });
            }, promiseService.throwError);
        }

        function _postAttachment (type, id, attachment) {
            return fileStorageService.read(attachment.src, true).then(function (fileData) {
                return $http.post(configuration.getServer() + 'api/' + type + '/' + id + '/attach', {
                    archive: underscore.extend(underscore.omit(attachment, ['src', 'local', 'key']), {
                        filename: fileData.file,
                        content: fileData.content.substring(fileData.content.indexOf(',') + 1)
                    })
                }, {withCredentials: true})
            }, promiseService.throwError);
        }

        return {
            synchronize: function () {
                return this.upload().then(this.download);
            },
            upload: function () {
                return promiseService
                    .chain(function (chain) {
                        chain.push(_postFarmers, _postDocuments, _postTasks, _postExpenses);
                    })
                    .catch(promiseService.throwError);
            },
            download: function () {
                return promiseService
                    .chain(function (chain) {
                        chain.push(_getFarmers, _getDocuments, _getTasks, _getEnterpriseBudgets, _getExpenses);
                    })
                    .catch(promiseService.throwError);
            }
        };
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
             * @param req.paging {Object} Optional
             * @returns {Promise}
             */
            getItems: function (req) {
                req = req || {};

                return _itemStore.transaction().then(function (tx) {
                    if (req.template) {
                        return tx.getItems({template: req.template, schema: req.schema, options: req.options, paging: req.paging});
                    } else if (req.search) {
                        req.options.readLocal = false;
                        req.options.readRemote = true;

                        return tx.getItems({template: options.plural + '?search=:query', schema: {query: req.search}, options: req.options, paging: req.paging});
                    } else if (req.id) {
                        return tx.getItems({template: options.plural + '/:id', schema: {id: req.id}, options: req.options, paging: req.paging});
                    } else {
                        return tx.getItems({template: options.plural, options: req.options, paging: req.paging});
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
                req = req || {};

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
                req = req || {};

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
                req = req || {};

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
                req = req || {};

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
             * @returns {Promise}
             */
            postItem: function (req) {
                req = req || {};

                return _itemStore.transaction().then(function (tx) {
                    if (req.data) {
                        return tx.postItems({template: req.template, schema: req.schema, data: _stripProperties(req.data)});
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
                req = req || {};

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
                req = req || {};

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

mobileSdkApiApp.factory('teamApi', ['api', function (api) {
    var teamApi = api({
        plural: 'teams',
        singular: 'team'
    });

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
                            promises.push(taskApi.createTask({template: 'tasks/:id', schema: {id: objId}, data: subtask, options: {replace: false, dirty: false}}));
                        });
                    });
                }, promiseService.throwError);
        }
    }]);

    this.$get = ['api', 'hydration', function (api, hydration) {
        var defaultRelations = ['document', 'organization', 'subtasks'];
        var taskApi = api({
            plural: 'tasks',
            singular: 'task',
            strip: defaultRelations,
            hydrate: function (obj, relations) {
                relations = (relations instanceof Array ? relations : (relations === true ? defaultRelations : []));
                return hydration.hydrate(obj, 'task', relations);
            },
            dehydrate: function (obj, relations) {
                relations = (relations instanceof Array ? relations : (relations === false ? [] : defaultRelations));
                return hydration.dehydrate(obj, 'task', relations);
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
        return function (obj, type) {
            return farmerApi.findFarmer({key: obj.organizationId, options: {one: true}});
        }
    }]);

    hydrationProvider.registerDehydrate('organization', ['farmerApi', 'promiseService', function (farmerApi, promiseService) {
        return function (obj, type) {
            return promiseService.wrap(function (promise) {
                if (obj.organization) {
                    obj.organization.id = obj.organization.id || obj.organizationId;

                    farmerApi.createFarmer({template: 'farmers', data: obj.organization, options: {replace: false, dirty: false}}).then(promise.resolve, promise.reject);
                } else {
                    promise.resolve(obj);
                }
            });
        }
    }]);

    this.$get = ['api', 'hydration', function (api, hydration) {
        var defaultRelations = ['farms', 'legalEntities'];
        var farmerApi = api({
            plural: 'farmers',
            singular: 'farmer',
            strip: defaultRelations,
            hydrate: function (obj, relations) {
                relations = (relations instanceof Array ? relations : (relations === true ? defaultRelations : []));
                return hydration.hydrate(obj, 'farmer', relations);
            },
            dehydrate: function (obj, relations) {
                relations = (relations instanceof Array ? relations : (relations === false ? [] : defaultRelations));
                return hydration.dehydrate(obj, 'farmer', relations);
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
        return function (obj, type) {
            return legalEntityApi.findEntity({key: obj.legalEntityId, options: {one: true, hydrate: true}});
        }
    }]);

    hydrationProvider.registerHydrate('legalEntities', ['legalEntityApi', function (legalEntityApi) {
        return function (obj, type) {
            return legalEntityApi.getEntities({id: obj.__id, options: {hydrate: true}});
        }
    }]);

    hydrationProvider.registerDehydrate('legalEntities', ['legalEntityApi', 'promiseService', function (legalEntityApi, promiseService) {
        return function (obj, type) {
            var objId = (obj.__id !== undefined ? obj.__id : obj.id);

            return legalEntityApi.purgeEntity({template: 'legalentities/:id', schema: {id: objId}, options: {force: false}})
                .then(function () {
                    return promiseService.arrayWrap(function (promises) {
                        angular.forEach(obj.legalEntities, function (entity) {
                            promises.push(legalEntityApi.createEntity({template: 'legalentities/:id', schema: {id: objId}, data: entity, options: {replace: false, dirty: false}}));
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
            hydrate: function (obj, relations) {
                relations = (relations instanceof Array ? relations : (relations === true ? defaultRelations : []));
                return hydration.hydrate(obj, 'legalentity', relations);
            },
            dehydrate: function (obj, relations) {
                relations = (relations instanceof Array ? relations : (relations === false ? [] : defaultRelations));
                return hydration.dehydrate(obj, 'legalentity', relations);
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
        return function (obj, type) {
            return farmApi.findFarm({key: obj.farmId, options: {one: true}});
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
                            promises.push(farmApi.createFarm({template: 'farms/:id', schema: {id: objId}, data: farm, options: {replace: false, dirty: false}}));
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
                            promises.push(assetApi.createAsset({template: 'assets/:id', schema: {id: objId}, data: asset, options: {replace: false, dirty: false}}));
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
            hydrate: function (obj, relations) {
                relations = (relations instanceof Array ? relations : []);
                return hydration.hydrate(obj, 'asset', relations);
            },
            dehydrate: function (obj, relations) {
                relations = (relations instanceof Array ? relations : []);
                return hydration.dehydrate(obj, 'asset', relations);
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
        return function (obj, type) {
            return documentApi.findDocument({key: obj.documentId, options: {one: true}});
        }
    }]);

    hydrationProvider.registerDehydrate('document', ['documentApi', function (documentApi) {
        return function (obj, type) {
            return documentApi.createDocument({template: 'documents', data: obj.document, options: {replace: false, dirty: false}});
        }
    }]);

    this.$get = ['api', 'hydration', function (api, hydration) {
        var defaultRelations = ['organization'];
        var documentApi = api({
            plural: 'documents',
            singular: 'document',
            strip: ['organization', 'tasks'],
            hydrate: function (obj, relations) {
                relations = (relations instanceof Array ? relations : (relations === true ? defaultRelations : []));
                return hydration.hydrate(obj, 'document', relations);
            },
            dehydrate: function (obj, relations) {
                relations = (relations instanceof Array ? relations : (relations === false ? [] : defaultRelations));
                return hydration.dehydrate(obj, 'document', relations);
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
        hydrate: function (obj, relations) {
            relations = (relations instanceof Array ? relations : (relations === true ? defaultRelations : []));
            return hydration.hydrate(obj, 'expense', relations);
        },
        dehydrate: function (obj, relations) {
            return promiseService.wrap(function (promise) {
                promise.resolve(underscore.omit(obj, relations || defaultRelations));
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

var mobileSdkDataApp = angular.module('ag.mobile-sdk.data', ['ag.sdk.utilities', 'ag.sdk.config', 'ag.sdk.monitor', 'ag.sdk.library']);

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

mobileSdkDataApp.factory('dataStoreUtilities', ['$log', 'dataStoreConstants', 'promiseService', 'underscore', function ($log, dataStoreConstants, promiseService, underscore) {
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
                __dirty: (item.dirty == 1),
                __local: (item.local == 1),
                __saved: true
            });
        },
        extractMetadata: function (item) {
            return {
                id: item.__id,
                uri: item.__uri,
                dirty: item.__dirty,
                local: item.__local,
                data: underscore.omit(item, ['__id', '__uri', '__dirty', '__local', '__saved'])
            };
        },
        transactionPromise: function(db) {
            return promiseService.wrap(function (promise) {
                if (db) {
                    db.transaction(function (res) {
                        promise.resolve(res);
                    }, function (err) {
                        promise.reject(err);
                    });
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
    this.$get = ['$http', '$log', '$rootScope', 'promiseService', 'safeApply', 'configuration', 'dataStoreUtilities', function ($http, $log, $rootScope, promiseService, safeApply, configuration, dataStoreUtilities) {
        var _hostApi = configuration.getServer() + 'api/';

        var _defaultHydration = function (obj) {
            return promiseService.wrap(function (promise) {
                promise.resolve(obj);
            })
        };

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

                        db.changeVersion(migration.current, migration.next, migration.process, function () {
                            idCallback();
                        }, function () {
                            $log.debug('Database version migrated from ' + migration.current + ' to ' + migration.next);
                            _processMigration(db);
                        });
                    } else {
                        _processMigration(db);
                    }
                } else {
                    idCallback(db);
                }
            }

            _processMigration(window.openDatabase(_defaultOptions.dbName, '', _defaultOptions.dbName, 4 * 1048576));
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
                        dataStoreUtilities.executeSqlPromise(tx, 'CREATE TABLE IF NOT EXISTS ' + name + ' (id INT UNIQUE, uri TEXT, dirty INT DEFAULT 0, local INT DEFAULT 0, data TEXT, updated TIMESTAMP DEFAULT current_timestamp)', []),
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

            var _getLocal = function (uri, options) {
                $log.debug('_getLocal');

                return dataStoreUtilities
                    .transactionPromise(_localDatabase)
                    .then(function (tx) {
                        return dataStoreUtilities.executeSqlPromise(tx, 'SELECT * FROM ' + name + ' WHERE uri = ?', [uri]);
                    }, promiseService.throwError)
                    .then(function (res) {
                        return promiseService.wrapAll(function (promises) {
                            for (var i = 0; i < res.rows.length; i++) {
                                promises.push(_config.hydrate(dataStoreUtilities.injectMetadata(res.rows.item(i)), options.hydrate));
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
                                promises.push(_config.hydrate(dataStoreUtilities.injectMetadata(res.rows.item(i)), options.hydrate));
                            }
                        });
                    }, promiseService.throwError);
            };

            var _syncLocal = function (dataItems, uri, options) {
                $log.debug('_syncLocal');

                return _deleteAllLocal(uri)
                    .then(function () {
                        return _updateLocal(dataItems);
                    }, promiseService.throwError)
                    .then(function () {
                        return _getLocal(uri, options);
                    }, promiseService.throwError);
            };

            var _updateLocal = function (dataItems, options) {
                $log.debug('_updateLocal');

                if ((dataItems instanceof Array) === false) dataItems = [dataItems];

                options = underscore.defaults(options || {}, {
                    replace: true,
                    force: false
                });

                return dataStoreUtilities
                    .transactionPromise(_localDatabase)
                    .then(function (tx) {
                        return promiseService
                            .wrapAll(function (promises) {
                                angular.forEach(dataItems, function (dataItem) {
                                    promises.push(_config.dehydrate(dataItem, options.dehydrate).then(function(dehydratedItem) {
                                        var item = dataStoreUtilities.extractMetadata(dehydratedItem);
                                        var dataString = JSON.stringify(item.data);
                                        var resolveItem = function () {
                                            return _config.hydrate(dehydratedItem, options.hydrate);
                                        };
                                        item.dirty = (options.dirty === true ? true : item.dirty);
                                        return dataStoreUtilities
                                            .executeSqlPromise(tx, 'INSERT INTO ' + name + ' (id, uri, data, dirty, local) VALUES (?, ?, ?, ?, ?)', [item.id, item.uri, dataString, (item.dirty ? 1 : 0), (item.local ? 1 : 0)])
                                            .then(resolveItem, function () {
                                                if (options.replace === true) {
                                                    if (item.dirty === true || item.local === true || options.force) {
                                                        return dataStoreUtilities
                                                            .executeSqlPromise(tx, 'UPDATE ' + name + ' SET uri = ?, data = ?, dirty = ?, local = ? WHERE id = ?', [item.uri, dataString, (item.dirty ? 1 : 0), (item.local ? 1 : 0), item.id])
                                                            .then(resolveItem);
                                                    } else {
                                                        return dataStoreUtilities
                                                            .executeSqlPromise(tx, 'UPDATE ' + name + ' SET uri = ?, data = ?, dirty = ?, local = ? WHERE id = ? AND dirty = 0 AND local = 0', [item.uri, dataString, (item.dirty ? 1 : 0), (item.local ? 1 : 0), item.id])
                                                            .then(resolveItem);
                                                    }
                                                }

                                                return null;
                                            });
                                    }))
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

            var _getRemote = function (uri, options) {
                $log.debug('_getRemote');

                options = options || {};

                return promiseService
                    .wrap(function (promise) {
                        if (_config.apiTemplate !== undefined) {
                            $http.get(_hostApi + uri, {params: options.paging, withCredentials: true})
                                .then(function (res) {
                                    return (res && res.data ? (res.data instanceof Array ? res.data : [res.data]) : []);
                                }, promiseService.throwError)
                                .then(function (res) {
                                    return promiseService.wrapAll(function (promises) {
                                        angular.forEach(res, function (item) {
                                            promises.push(_config.dehydrate(dataStoreUtilities.injectMetadata({
                                                id: _getItemIndex(item),
                                                uri: options.forceUri || uri,
                                                data: item,
                                                dirty: false,
                                                local: false
                                            }), true));
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
             * @param writeUri
             * @param writeSchema
             * @private
             */
            var _updateRemote = function (dataItems, writeUri, writeSchema) {
                $log.debug('_updateRemote');

                return promiseService.wrap(function (promise) {
                    if (dataItems !== undefined && _config.apiTemplate !== undefined) {
                        if ((dataItems instanceof Array) === false) dataItems = [dataItems];

                        promiseService
                            .wrapAll(function (promises) {
                                angular.forEach(dataItems, function (dataItem) {
                                    var item = dataStoreUtilities.extractMetadata(dataItem);
                                    var uri = item.uri;

                                    if (item.dirty === true) {
                                        if (item.local || writeUri !== undefined) {
                                            if (item.local && item.data[_config.indexerProperty] !== undefined) {
                                                delete item.data[_config.indexerProperty];
                                            }

                                            uri = dataStoreUtilities.parseRequest(writeUri || _config.apiTemplate, underscore.extend(writeSchema, {id: item.local ? undefined : item.id}));
                                        }

                                        promises.push($http.post(_hostApi + uri, item.data, {withCredentials: true})
                                            .then(function (res) {
                                                var postedItem = dataStoreUtilities.injectMetadata({
                                                    id: _getItemIndex(res.data, item.id),
                                                    uri: item.uri,
                                                    data: item.data,
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
                                            }, promiseService.throwError));
                                    }
                                });
                            }, promiseService.throwError)
                            .then(function(results) {
                                return _updateLocal(underscore.compact(results), {force: true});
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
            var _dataStoreInitialized = false;
            var _transactionQueue = [];

            var _processTransactionQueue = function () {
                if (_dataStoreInitialized && _localDatabase !== undefined) {
                    while (_transactionQueue.length > 0) {
                        var deferredTransaction = _transactionQueue.shift();

                        deferredTransaction.resolve(new DataTransaction());
                    }
                }
            };

            var _responseFormatter = function (data, asArray) {
                return (asArray == false && data instanceof Array && data.length > 0 ? data[0] : data);
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
                                        dirty: request.options.dirty,
                                        local: request.options.dirty
                                    }), request.options.dehydrate));
                                });
                            }, promiseService.throwError)
                            .then(function (results) {
                                return _updateLocal(underscore.compact(results), request.options);
                            }, promiseService.throwError)
                            .then(function (results) {
                                return _responseFormatter(results, false);
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
                            one: (request.schema.id === undefined),
                            passThrough: false,
                            readLocal: _config.readLocal,
                            readRemote: _config.readRemote
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
                                                    dirty: false,
                                                    local: false
                                                });
                                            }), request.options.one));
                                        } else if (request.paging === undefined && request.options.readLocal === true) {
                                            _syncLocal(res, _uri, request.options).then(function (res) {
                                                promise.resolve(_responseFormatter(res, request.options.one));
                                            }, promise.reject);
                                        } else {
                                            _updateLocal(res, request.options).then(function (res) {
                                                promise.resolve(_responseFormatter(res, request.options.one));
                                            }, promise.reject);
                                        }
                                    }, function (err) {
                                        if (request.options.readLocal === true) {
                                            _updateLocal(res, request.options).then(function (res) {
                                                promise.resolve(_responseFormatter(res, request.options.one));
                                            }, promise.reject);
                                        } else {
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
                                    _getLocal(_uri, request.options).then(function (res) {
                                        if (res.length == 0 && request.options.fallbackRemote === true) {
                                            handleRemote(_uri);
                                        } else {
                                            promise.resolve(res);
                                        }
                                    }, promise.reject);
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
                            like: false,
                            one: false
                        });

                        return _findLocal(request.key, request.column, request.options).then(function (res) {
                            return _responseFormatter(res, false);
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

                        return _updateLocal(request.data, request.options).then(function (res) {
                            return _responseFormatter(res, false);
                        }, promiseService.throwError);
                    },
                    postItems: function (req) {
                        var request = underscore.defaults(req || {}, {
                            template: _config.apiTemplate,
                            schema: {},
                            data: []
                        });

                        if ((request.data instanceof Array) === false) request.data = [request.data];

                        return _updateRemote(request.data, request.template, request.schema).then(function (res) {
                            return _responseFormatter(res, false);
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
                                return _responseFormatter(res, false);
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

                                _getLocal(_uri, request.options)
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

                _dataStoreInitialized = true;
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

        _initializeDatabase(function (db) {
            if (db) {
                _localDatabase = db;

                $log.debug('database initialized');
            }
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
            hydrate: function (obj, type, relations) {
                relations = relations || [];

                return promiseService
                    .objectWrap(function (promises) {
                        angular.forEach(relations, function (relationName) {
                            var relation = _relationTable[relationName];

                            if (relation && relation.hydrate) {
                                if (relation.hydrate instanceof Array) {
                                    _relationTable[relationName].hydrate = $injector.invoke(relation.hydrate);
                                }

                                promises[relationName] = relation.hydrate(obj, type);
                            }
                        });
                    })
                    .then(function (results) {
                        return underscore.extend(obj, results);
                    }, function (results) {
                        return underscore.extend(obj, results);
                    });
            },
            dehydrate: function (obj, type, relations) {
                relations = relations || [];

                return promiseService
                    .objectWrap(function (promises) {
                        angular.forEach(relations, function (relationName) {
                            var relation = _relationTable[relationName];

                            if (obj[relationName] && relation && relation.dehydrate) {
                                if (relation.dehydrate instanceof Array) {
                                    _relationTable[relationName].dehydrate = $injector.invoke(relation.dehydrate);
                                }

                                promises[relationName] = relation.dehydrate(obj, type);
                            }
                        });
                    })
                    .then(function () {
                        return underscore.omit(obj, relations);
                    }, function () {
                        return underscore.omit(obj, relations);
                    });
            }
        };
    }];
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
    'ag.sdk.helper.region',
    'ag.sdk.helper.task',
    'ag.sdk.helper.team',
    'ag.sdk.helper.user'
]);

angular.module('ag.sdk.interface', [
    'ag.sdk.interface.input',
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
    'ag.sdk.library',
    'ag.sdk.test',
    'ag.mobile-sdk.helper',
    'ag.mobile-sdk.api',
    'ag.mobile-sdk.data',
    'ag.mobile-sdk.hydration'
]);
