var coreConnectionApp = angular.module('ag.core.connection', []);

/**
 * @name routeResolverProvider / routeResolver
 * @description Provider to define and resolve the data required for a route
 */
coreConnectionApp.provider('routeResolver', function () {
    var _routeTable = {};

    this.when = function (routePath, resolverInjection) {
        _routeTable[routePath] = resolverInjection;

        return this;
    };

    this.$get = ['$route', '$injector', function ($route, $injector) {
        return {
            getData: function () {
                var resolverInjection = ($route.current && $route.current.$$route ? _routeTable[$route.current.$$route.originalPath] : undefined);

                return (resolverInjection ? $injector.invoke(resolverInjection) : undefined);
            },
            getRoute: function (route, params) {
                params = params || {};

                angular.forEach(params, function (value, param) {
                    route = route.replace(':' + param, value);
                });

                return route;
            }
        }
    }];
});

/**
 * @name configurationProvider / configuration
 * @description Provider to define the configuration of servers
 */
coreConnectionApp.provider('configuration', [function() {
    var _version = '';
    var _host = 'alpha';

    var _servers = {
        local: 'http://localhost:3005/',
        alpha: 'http://staging.farmer.agrista.net/',
        beta: 'http://farmer.agrista.net/'
    };

    return {
        setServers: function(servers) {
            _servers = servers;
        },
        config: function(version, host, cCallback) {
            if (_servers[host] !== undefined) {
                _host = host;
            }

            _version = version;

            cCallback(_servers[_host]);
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

/*
 * Authorization
 */
coreConnectionApp.run(['$rootScope', 'authorization', 'navigationService', function ($rootScope, authorization, navigationService) {
    $rootScope.$on('$routeChangeStart', function (event, next, current) {

        if (next.$$route !== undefined && next.$$route.authorization !== undefined) {
            if (!authorization.isAllowed(next.$$route.authorization)) {
                if (!authorization.isLoggedIn()) {
                    navigationService.go('/login', 'modal');
                } else {
                    navigationService.go('/', 'slide');
                }
            }
        }
    });
}]);

coreConnectionApp.factory('authorizationInterceptor', ['$q', 'navigationService', function ($q, navigationService) {
    return function (promise) {
        return promise.then(function (res) {
            return res;
        }, function (err) {
            if (err.status === 401) {
                console.warn('Not authorized');
                navigationService.go('/login', 'modal');
            }

            return $q.reject(err);
        });
    }
}]);

coreConnectionApp.provider('authorization', ['$httpProvider', function ($httpProvider) {
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

    var _config = {
        url: '/api/'
    };

    // Intercept any HTTP responses that are not authorized
    $httpProvider.responseInterceptors.push('authorizationInterceptor');

    var _setConfig = function (options) {
        if (typeof options !== 'object') options = {};

        _config = _.defaults(options, _config);

        return _config;
    };

    return {
        userRole: _userRoles,
        accessLevel: _accessLevels,

        config: _setConfig,

        $get: ['$http', '$rootScope', 'promiseService', function ($http, $rootScope, promiseService) {
            var _user = _getUser();

            function _getUser() {
                var user = window.localStorage.getItem('user');

                return (user !== null ? JSON.parse(user) : _defaultUser);
            }

            function _setUser(user) {
                if (user.role === undefined) {
                    user.role = (user.admin ? _userRoles.admin : _userRoles.user);
                }

                window.localStorage.setItem('user', JSON.stringify(user));

                return user;
            }

            return {
                userRole: _userRoles,
                accessLevel: _accessLevels,
                currentUser: function () {
                    return _user;
                },
                config: _setConfig,

                isAllowed: function (level) {
                    console.log('authorization.allowed: ' + level + ' ' + _user.role + ' = ' + (level & _user.role));

                    return (level & _user.role) != 0;
                },
                isLoggedIn: function () {
                    console.log('authorization.loggedIn: ' + _accessLevels.user + ' ' + _user.role + ' = ' + (_accessLevels.user & _user.role));

                    return (_accessLevels.user & _user.role) != 0;
                },

                login: function (email, password) {
                    return promiseService.wrap(function (promise) {
                        $http.post(_config.url + 'login', {email: email, password: password}).then(function (res) {
                            if (res.data.user !== null) {
                                _user = _setUser(res.data.user);
                                promise.resolve(_user);

                                $rootScope.$broadcast('authorization.login', _user);
                            } else {
                                _user = _setUser(_defaultUser);
                                promise.reject();
                            }

                        }, function (err) {
                            _user = _setUser(_defaultUser);
                            promise.reject();
                        });
                    });
                },
                getUser: function () {
                    return promiseService.wrap(function (promise) {
                        $http.get(_config.url + 'current-user', {withCredentials: true}).then(function (res) {
                            if (res.data.user !== null) {
                                _user = _setUser(res.data.user);
                            }

                            promise.resolve(_user);
                        }, promise.reject);
                    });
                },
                resetPassword: function (email) {
                    return promiseService.wrap(function (promise) {
                        $http.post(_config.url + 'api/password-reset-email', {email: email}).then(function (res) {
                            promise.resolve(res.data);
                        }, promise.reject);
                    });
                },
                changePassword: function (oldPassword, newPassword) {
                    return promiseService.wrap(function (promise) {
                        $http.post(_config.url + 'api/user/password', {password: oldPassword, newPassword: newPassword}).then(function (res) {
                            promise.resolve(res.data);
                        }, promise.reject);
                    });
                },
                logout: function () {
                    return $http.post(_config.url + 'logout').then(function () {
                        _user = _setUser(_defaultUser);
                        $rootScope.$broadcast('authorization.logout', _user);
                    });
                }
            }
        }]
    }
}]);
