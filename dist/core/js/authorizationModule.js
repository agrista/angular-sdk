'use strict';

define(['underscore', 'angular'], function (_) {
    var module = angular.module('authorizationModule', []);

    module.run(['$rootScope', 'authorization', 'navigationService', function ($rootScope, authorization, navigationService) {
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

    module.factory('authorizationInterceptor', ['$q', 'navigationService', function ($q, navigationService) {
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

    module.provider('authorization', ['$httpProvider', function ($httpProvider) {
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
            url: '/api/',
            login: 'login',
            logout: 'logout'
        }

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

            $get: ['$http', '$q', '$rootScope', function ($http, $q, $rootScope) {
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
                    currentUser: function() {
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
                        var defer = $q.defer();

                        $http.post(_config.url + _config.login, {email: email, password: password}).then(function (res) {
                            if (res.data.user !== null) {
                                _user = _setUser(res.data.user);
                                defer.resolve(_user);

                                $rootScope.$broadcast('authorization.login', _user);
                            } else {
                                _user = _setUser(_defaultUser);
                                defer.reject();
                            }

                        }, function (err) {
                            _user = _setUser(_defaultUser);
                            defer.reject();
                        });

                        return defer.promise;
                    },
                    changePassword: function(oldPassword, newPassword, cpCallback) {
                        $http.post(_config.url + 'api/user/' + _user.id + '/password', {oldPSW: oldPassword, newPSW: newPassword}).then(function (res) {
                            cpCallback({success: true, data: res.data});
                        }, function(err) {
                            cpCallback({success: false, data: err.data});
                        });
                    },
                    changeUserDetails: function(userDetails, cudCallback) {
                        $http.post(_config.url + 'api/user/' + _user.id + '/self', userDetails).then(function (res) {
                            _user = _setUser(userDetails);

                            cudCallback({success: true, data: res.data});
                        }, function(err) {
                            cudCallback({success: false, data: err.data});
                        });
                    },
                    logout: function () {
                        $http.post(_config.url + _config.logout).then(function () {
                            $rootScope.$broadcast('authorization.logout', _user);
                        });

                        _user = _setUser(_defaultUser);
                    }
                }
            }]
        }
    }]);
});