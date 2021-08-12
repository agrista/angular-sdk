var sdkAuthorizationApp = angular.module('ag.sdk.authorization', ['ag.sdk.config', 'ag.sdk.utilities', 'satellizer']);

sdkAuthorizationApp.factory('authorizationApi', ['$http', 'promiseService', 'configuration', 'underscore', function($http, promiseService, configuration, underscore) {
    var _host = configuration.getServer();
    
    return {
        requestReset: function(email) {
            return promiseService.wrap(function(promise) {
                $http.post(_host + 'auth/request-reset', {email: email}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        confirmReset: function (data) {
            return promiseService.wrap(function(promise) {
                $http.post(_host + 'auth/confirm-reset', data).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        authorize: function (provider, data) {
            return promiseService.wrap(function(promise) {
                $http.post(_host + 'auth/' + provider, data, {skipAuthorization: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        refresh: function (refreshToken) {
            return promiseService.wrap(function(promise) {
                $http.post(_host + 'auth/refresh-token', {refresh_token: refreshToken}, {skipAuthorization: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        changePassword: function (oldPassword, newPassword) {
            return promiseService.wrap(function(promise) {
                $http.post(_host + 'auth/change-password', {password: oldPassword, newPassword: newPassword}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getUser: function () {
            return promiseService.wrap(function(promise) {
                $http.get(_host + 'me').then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateUser: function (data) {
            return promiseService.wrap(function(promise) {
                $http.post(_host + 'me', underscore.omit(data, 'profilePhotoSrc')).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        logout: function() {
            return $http.post(_host + 'logout', {});
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

    var _lastError,
        _tokens,
        _expiry = {
            expiresIn: 60
        };

    // Intercept any HTTP responses that are not authorized
    $httpProvider.interceptors.push(['$injector', '$log', '$rootScope', 'localStore', 'moment', 'promiseService', function ($injector, $log, $rootScope, localStore, moment, promiseService) {
        var _requestQueue = [];

        function queueRequest (config) {
            var queueItem = {
                config: config,
                defer: promiseService.defer()
            };

            _requestQueue.push(queueItem);

            return queueItem.defer.promise;
        }

        function resolveQueue (token) {
            while (_requestQueue.length > 0) {
                var queueItem = _requestQueue.shift();

                if (token) {
                    queueItem.config.headers['Authorization'] = 'Bearer ' + token;
                }

                queueItem.defer.resolve(queueItem.config);
            }
        }

        return {
            request: function (config) {
                if (config.skipAuthorization || config.headers['Authorization']) {
                    _expiry.lastRequest = moment();

                    return config;
                }

                if (_tokens && _tokens.refresh_token && _preReauthenticateHandler(_expiry)) {
                    if (_requestQueue.length === 0) {
                        var $auth = $injector.get('$auth'),
                            authorizationApi = $injector.get('authorizationApi');

                        authorizationApi.refresh(_tokens.refresh_token).then(function (res) {
                            if (res) {
                                _processExpiry(res);

                                $auth.setToken(res.access_token);
                                localStore.setItem('tokens', res);
                                _tokens = res;
                            }

                            resolveQueue(res && res.access_token);
                        }, function () {
                            resolveQueue();
                        });
                    }

                    return queueRequest(config);
                }

                return config;
            },
            responseError: function (err) {
                $log.debug(err);

                if (err.status === 401) {
                    $rootScope.$broadcast('authorization::unauthorized', err);
                } else if (err.status === 403) {
                    $rootScope.$broadcast('authorization::forbidden', err);
                }

                return promiseService.reject(err);
            }
        }
    }]);

    var _authenticateHandler = ['authorizationApi', function (authorizationApi) {
        return function (authentication) {
            return authorizationApi.authorize(authentication.provider, authentication)
        }
    }], _preAuthenticateHandler = ['promiseService', function (promiseService) {
        return function () {
            return promiseService.wrap(function (promise) {
                promise.resolve();
            });
        }
    }], _preReauthenticateHandler = function () {
        return true;
    }, _getUserHandler = ['authorizationApi', function (authorizationApi) {
        return function () {
            return authorizationApi.getUser();
        }
    }];

    var _processExpiry = ['moment', function (moment) {
        return function (data) {
            if (data) {
                if (data.expires_at) {
                    _expiry.expiresAt = data.expires_at;
                    _expiry.expiresIn = moment(_expiry.expiresAt).diff(moment(), 's');
                } else if (data.expires_in) {
                    _expiry.expiresIn = data.expires_in;
                    _expiry.expiresAt = moment().add(_expiry.expiresIn, 's').unix();
                }
            }
        }
    }];

    return {
        userRole: _userRoles,
        accessLevel: _accessLevels,

        setAuthenticate: function (fn) {
            _authenticateHandler = fn;
        },

        setPreAuthenticate: function (fn) {
            _preAuthenticateHandler = fn;
        },

        setPreReauthenticate: function (fn) {
            _preReauthenticateHandler = fn;
        },

        setGetUser: function (fn) {
            _getUserHandler = fn;
        },

        $get: ['$auth', '$injector', '$log', '$rootScope', 'authorizationApi', 'localStore', 'promiseService', 'underscore',
            function ($auth, $injector, $log, $rootScope, authorizationApi, localStore, promiseService, underscore) {
                var _user = _getUser(),
                    _authenticationPromise;

                _tokens = localStore.getItem('tokens');

                if (_processExpiry instanceof Array) {
                    _processExpiry = $injector.invoke(_processExpiry);
                }

                if (_authenticateHandler instanceof Array) {
                    _authenticateHandler = $injector.invoke(_authenticateHandler);
                }

                if (_preAuthenticateHandler instanceof Array) {
                    _preAuthenticateHandler = $injector.invoke(_preAuthenticateHandler);
                }

                if (_getUserHandler instanceof Array) {
                    _getUserHandler = $injector.invoke(_getUserHandler);
                }

                _processExpiry(_tokens);

                $rootScope.$on('authorization::unauthorized', function () {
                    localStore.removeItem('user');
                    localStore.removeItem('tokens');
                    $auth.removeToken();
                    _tokens = undefined;
                });

                function _getUser () {
                    return localStore.getItem('user') || _defaultUser;
                }

                function _setUser (user) {
                    user = user || _defaultUser;

                    if (user.role === undefined) {
                        user.role = (user.accessLevel === 'admin' ? _userRoles.admin : _userRoles.user);
                    }

                    localStore.setItem('user', user);

                    return user;
                }

                function _postAuthenticateSuccess (res) {
                    if (res && res.data) {
                        _processExpiry(res.data);

                        $auth.setToken(res.data.access_token);
                        localStore.setItem('tokens', res.data);
                        _tokens = res.data;
                    }

                    return _getUserHandler();
                }

                function _postGetUserSuccess (promise) {
                    return function (res) {
                        _lastError = undefined;
                        _user = _setUser(res);
                        promise.resolve(_user);

                        $rootScope.$broadcast('authorization::login', _user);
                    }
                }

                function _postError (promise) {
                    return function (err) {
                        $log.error(err);

                        _lastError = {
                            code: err.status,
                            type: 'error',
                            message: err.data && err.data.message || 'Unable to Authenticate. Please try again.'
                        };

                        localStore.removeItem('user');
                        promise.reject({
                            data: _lastError
                        });
                    }
                }

                function isLoggedIn () {
                    return (_accessLevels.user & _user.role) !== 0;
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
                    setAuthentication: function (authentication) {
                        _authenticationPromise = promiseService
                            .wrap(function (promise) {
                                if (underscore.has(authentication, 'code')) {
                                    _preAuthenticateHandler(authentication)
                                        .then(function () {
                                            return _authenticateHandler(authentication);
                                        }, promiseService.throwError)
                                        .then(function (response) {
                                            return _postAuthenticateSuccess({data: response});
                                        }, promiseService.throwError)
                                        .then(_postGetUserSuccess(promise), _postError(promise));
                                } else {
                                    _postAuthenticateSuccess({data: authentication})
                                        .then(_postGetUserSuccess(promise), _postError(promise));
                                }
                            });

                        return _authenticationPromise;
                    },
                    waitForAuthentication: function () {
                        return promiseService.wrap(function (promise) {
                            if (_authenticationPromise) {
                                _authenticationPromise.then(function () {
                                    if (isLoggedIn()) {
                                        promise.resolve(_user);
                                    } else {
                                        promise.reject();
                                    }
                                }, promise.reject);
                            } else if (isLoggedIn()) {
                                promise.resolve(_user);
                            } else {
                                promise.reject();
                            }
                        });
                    },
                    getAuthenticationResponse: function () {
                        return _tokens;
                    },
                    hasApp: function (appName) {
                        return _user && _user.userRole &&
                            underscore.some(_user.userRole.apps, function (app) {
                                return app.name === appName;
                            });
                    },
                    isAdmin: function () {
                        return _user && (_user.accessLevel === 'admin' || (_user.userRole && _user.userRole.name === 'Admin'));
                    },
                    isAllowed: function (level) {
                        return (level & _user.role) !== 0;
                    },
                    isLoggedIn: isLoggedIn,
                    login: function (email, password) {
                        var credentials = {
                            email: email,
                            password: password
                        };

                        _authenticationPromise = promiseService.wrap(function (promise) {
                            return _preAuthenticateHandler(credentials)
                                .then(function () {
                                    return $auth.login(credentials);
                                }, promiseService.throwError)
                                .then(_postAuthenticateSuccess, promiseService.throwError)
                                .then(_postGetUserSuccess(promise), _postError(promise));
                        });

                        return _authenticationPromise;
                    },
                    authenticate: function (name, data) {
                        _authenticationPromise = promiseService.wrap(function (promise) {
                            return _preAuthenticateHandler(data)
                                .then(function () {
                                    return $auth.authenticate(name, data);
                                }, promiseService.throwError)
                                .then(_postAuthenticateSuccess, promiseService.throwError)
                                .then(_postGetUserSuccess(promise), _postError(promise));
                        });

                        return _authenticationPromise;
                    },
                    requestReset: authorizationApi.requestReset,
                    confirmReset: function (data) {
                        return promiseService.wrap(function (promise) {
                            authorizationApi.confirmReset(data).then(function (res) {
                                if (_tokens) {
                                    _tokens.confirmed = true;
                                    localStore.setItem('tokens', _tokens);
                                }

                                promise.resolve(res);
                            }, promise.reject);
                        });
                    },
                    changePassword: function (oldPassword, newPassword) {
                        return authorizationApi.changePassword(oldPassword, newPassword);
                    },
                    changeUserDetails: function (userDetails) {
                        return authorizationApi.updateUser(userDetails).then(function (result) {
                            _user = _setUser(result);

                            $rootScope.$broadcast('authorization::user-details__changed', _user);

                            return result;
                        });
                    },
                    register: function (data) {
                        _authenticationPromise = promiseService.wrap(function (promise) {
                            return _preAuthenticateHandler(data)
                                .then(function () {
                                    return $auth.signup(data);
                                }, promiseService.throwError)
                                .then(_postAuthenticateSuccess, promiseService.throwError)
                                .then(_postGetUserSuccess(promise), _postError(promise));
                        });

                        return _authenticationPromise;
                    },
                    logout: function () {
                        return authorizationApi.logout().then(function () {
                            $auth.logout();
                            localStore.removeItem('user');
                            localStore.removeItem('tokens');
                            _tokens = undefined;
                            _user = _getUser();

                            $rootScope.$broadcast('authorization::logout');

                            return _user;
                        });
                    }
                }
            }]
    }
}]);
