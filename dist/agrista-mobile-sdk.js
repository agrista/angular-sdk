var sdkApiGeoApp = angular.module('ag.sdk.api.geo', ['ag.sdk.config', 'ag.sdk.utilities', 'ag.sdk.library']);


/**
 * PIP Geo API
 */
sdkApiGeoApp.factory('pipGeoApi', ['$http', 'configuration', 'pagingService', 'promiseService', 'underscore', function ($http, configuration, pagingService, promiseService, underscore) {
    var _host = configuration.getServer();

    function trimQuery (query) {
        return underscore.omit(query, function (value) {
            return (value == null || value == '');
        });
    }

    function uriEncodeQuery (query) {
        return underscore.map(trimQuery(query), function (value, key) {
            return key + '=' + encodeURIComponent(value);
        });
    }

    function uriEncodeQueryJoin (query) {
        return uriEncodeQuery(query).join('&');
    }

    return {
        getAdminRegion: function (query) {
            query = uriEncodeQueryJoin(query);

            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/geo/admin-region' + (query ? '?' + query : ''), {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        searchAdminRegions: function (params) {
            return pagingService.page(_host + 'api/geo/admin-regions', trimQuery(params));
        },
        getDistrict: function (query) {
            query = uriEncodeQueryJoin(query);

            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/geo/district' + (query ? '?' + query : ''), {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getFarm: function (query) {
            query = uriEncodeQueryJoin(query);

            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/geo/farm' + (query ? '?' + query : ''), {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        searchFarms: function (params) {
            return pagingService.page(_host + 'api/geo/farms', trimQuery(params));
        },
        getField: function (query) {
            query = uriEncodeQueryJoin(query);

            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/geo/field' + (query ? '?' + query : ''), {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getPortion: function (query) {
            query = uriEncodeQueryJoin(query);

            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/geo/portion' + (query ? '?' + query : ''), {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        searchPortions: function (params) {
            return pagingService.page(_host + 'api/geo/portions', trimQuery(params));
        },
        getProvince: function (query) {
            query = uriEncodeQueryJoin(query);

            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/geo/province' + (query ? '?' + query : ''), {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getSublayer: function (query) {
            query = uriEncodeQueryJoin(query);

            return promiseService.wrap(function(promise) {
                $http.get(_host + 'api/geo/sublayer' + (query ? '?' + query : ''), {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    }
}]);

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
                $http.get(_host + 'api/me').then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateUser: function (data) {
            return promiseService.wrap(function(promise) {
                $http.post(_host + 'api/me', underscore.omit(data, 'profilePhotoSrc')).then(function (res) {
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

                if (_tokens && _tokens.refresh_token && _preReauthenticate(_expiry)) {
                    if (_requestQueue.length == 0) {
                        var $auth = $injector.get('$auth'),
                            authorizationApi = $injector.get('authorizationApi');

                        authorizationApi.refresh(_tokens.refresh_token).then(function (res) {
                            if (res) {
                                if (res.expires_at) {
                                    _expiry.expiresIn = moment(res.expires_at).diff(moment(), 'm');
                                }

                                $auth.setToken(res.token);
                                localStore.setItem('tokens', res);
                                _tokens = res;
                            }

                            resolveQueue(res && res.token);
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

    var _preAuthenticate = ['promiseService', function (promiseService) {
        return function () {
            return promiseService.wrap(function (promise) {
                promise.resolve();
            });
        }
    }], _preReauthenticate = function () {
        return true;
    };

    return {
        userRole: _userRoles,
        accessLevel: _accessLevels,

        setPreAuthenticate: function (fn) {
            _preAuthenticate = fn;
        },

        setPreReauthenticate: function (fn) {
            _preReauthenticate = fn;
        },

        $get: ['$auth', '$injector', '$log', '$rootScope', '$timeout', 'authorizationApi', 'localStore', 'promiseService', 'underscore',
            function ($auth, $injector, $log, $rootScope, $timeout, authorizationApi, localStore, promiseService, underscore) {
                var _user = _getUser();

                _tokens = localStore.getItem('tokens');

                if (_preAuthenticate instanceof Array) {
                    _preAuthenticate = $injector.invoke(_preAuthenticate);
                }

                authorizationApi.getUser().then(function (res) {
                    _user = _setUser(res);

                    $rootScope.$broadcast('authorization::login', _user);
                }, function () {
                    $rootScope.$broadcast('authorization::unauthorized');
                });

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
                        if (res.data.expires_at) {
                            _expiry.expiresIn = moment(res.data.expires_at).diff(moment(), 'm');
                        }

                        $auth.setToken(res.data.token);
                        localStore.setItem('tokens', res.data);
                        _tokens = res.data;
                    }

                    return authorizationApi.getUser();
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

                return {
                    userRole: _userRoles,
                    accessLevel: _accessLevels,
                    lastError: function () {
                        return _lastError;
                    },
                    currentUser: function () {
                        return _user;
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
                        return (level & _user.role) != 0;
                    },
                    isLoggedIn: function () {
                        return (_accessLevels.user & _user.role) != 0;
                    },
                    login: function (email, password) {
                        var credentials = {
                            email: email,
                            password: password
                        };

                        return promiseService.wrap(function (promise) {
                            return _preAuthenticate(credentials)
                                .then(function () {
                                    return $auth.login(credentials);
                                }, promiseService.throwError)
                                .then(_postAuthenticateSuccess, promiseService.throwError)
                                .then(_postGetUserSuccess(promise), _postError(promise));
                        });
                    },
                    authenticate: function (name, data) {
                        return promiseService.wrap(function (promise) {
                            return _preAuthenticate(data)
                                .then(function () {
                                    return $auth.authenticate(name, data);
                                }, promiseService.throwError)
                                .then(_postAuthenticateSuccess, promiseService.throwError)
                                .then(_postGetUserSuccess(promise), _postError(promise));
                        });
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
                        return promiseService.wrap(function (promise) {
                            return _preAuthenticate(data)
                                .then(function () {
                                    return $auth.signup(data);
                                }, promiseService.throwError)
                                .then(_postAuthenticateSuccess, promiseService.throwError)
                                .then(_postGetUserSuccess(promise), _postError(promise));
                        });
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
        testing: 'https://dev-enterprise.agrista.com/',
        staging: 'https://staging-enterprise.agrista.com/',
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

    var _getServer = function (stripTrailingSlash) {
        var server = _servers[_host];

        if (stripTrailingSlash && server.lastIndexOf('/') === server.length - 1) {
            server = server.substr(0, server.length - 1);
        }

        return server;
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
        setVersion: function (version) {
            if (version) {
                _version = version;
            }
        },
        getServer: _getServer,
        useHost: function(host, version, cCallback) {
            if (typeof version === 'function') {
                cCallback = version;
                version = _version;
            }

            _version = version || _version;

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
                getServer: _getServer
            }
        }
    }
}]);
var sdkGeospatialApp = angular.module('ag.sdk.geospatial', ['ag.sdk.utilities', 'ag.sdk.id', 'ag.sdk.library']);

sdkGeospatialApp.factory('geoJSONHelper', ['objectId', 'topologyHelper', 'underscore', function (objectId, topologyHelper, underscore) {
    function GeojsonHelper(json, properties) {
        if (!(this instanceof GeojsonHelper)) {
            return new GeojsonHelper(json, properties);
        }

        this.addGeometry(json, properties);
    }

    function recursiveCoordinateFinder (bounds, coordinates) {
        if (coordinates) {
            if (angular.isArray(coordinates[0])) {
                angular.forEach(coordinates, function(coordinate) {
                    recursiveCoordinateFinder(bounds, coordinate);
                });
            } else if (angular.isArray(coordinates)) {
                bounds.push([coordinates[1], coordinates[0]]);
            }
        }
    }

    function getGeometry (instance) {
        return (instance._json.type === 'Feature' ?
                instance._json.geometry :
                (instance._json.type !== 'FeatureCollection' ?
                        instance._json :
                        {
                            type: 'GeometryCollection',
                            geometries: underscore.pluck(instance._json.features, 'geometry')
                        }
                )
        );
    }

    function geometryRelation (instance, relation, geometry) {
        var geom1 = topologyHelper.readGeoJSON(getGeometry(instance)),
            geom2 = topologyHelper.readGeoJSON(geometry);

        return (geom1 && geom2 && geom1[relation] ? geom1[relation](geom2) : false);
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

                    recursiveCoordinateFinder(bounds, geometry.coordinates);
                });
            }

            return bounds;
        },
        getBoundingBox: function (bounds) {
            bounds = bounds || this.getBounds();

            var lat1 = 0, lat2 = 0,
                lng1 = 0, lng2 = 0;

            angular.forEach(bounds, function(coordinate, index) {
                if (index === 0) {
                    lat1 = lat2 = coordinate[0];
                    lng1 = lng2 = coordinate[1];
                } else {
                    lat1 = (lat1 < coordinate[0] ? lat1 : coordinate[0]);
                    lat2 = (lat2 < coordinate[0] ? coordinate[0] : lat2);
                    lng1 = (lng1 < coordinate[1] ? lng1 : coordinate[1]);
                    lng2 = (lng2 < coordinate[1] ? coordinate[1] : lng2);
                }
            });

            return [[lat1, lng1], [lat2, lng2]];
        },
        /**
         * Geometry Relations
         */
        contains: function (geometry) {
            return geometryRelation(this, 'contains', geometry);
        },
        within: function (geometry) {
            return geometryRelation(this, 'within', geometry);
        },
        /**
         * Get Center
         */
        getCenter: function () {
            var geom = topologyHelper.readGeoJSON(getGeometry(this)),
                coord = (geom ? geom.getCentroid().getCoordinate() : geom);

            return (coord ? [coord.x, coord.y] : coord);
        },
        getCenterAsGeojson: function () {
            var geom = topologyHelper.readGeoJSON(getGeometry(this));

            return (geom ? topologyHelper.writeGeoJSON(geom.getCentroid()) : geom);
        },
        getProperty: function (name) {
            return (this._json && this._json.properties ? this._json.properties[name] : undefined);
        },
        setCoordinates: function (coordinates) {
            if (this._json && this._json.type !== 'FeatureCollection') {
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
                if (_this._json.type !== 'FeatureCollection' && _this._json.type !== 'Feature') {
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
                    if (this._json.type !== 'FeatureCollection' && this._json.type !== 'Feature') {
                        this._json = {
                            type: 'Feature',
                            geometry: this._json
                        };
                    }

                    if (this._json.type === 'Feature') {
                        this._json.properties = underscore.defaults(this._json.properties || {}, {
                            featureId: objectId().toString()
                        });

                        this._json = {
                            type: 'FeatureCollection',
                            features: [this._json]
                        };
                    }

                    if (this._json.type === 'FeatureCollection') {
                        this._json.features.push({
                            type: 'Feature',
                            geometry: geometry,
                            properties: underscore.defaults(properties || {}, {
                                featureId: objectId().toString()
                            })
                        });
                    }
                }
            }

            return this;
        },
        formatGeoJson: function (geoJson, toType) {
            // TODO: REFACTOR
            //todo: maybe we can do the geoJson formation to make it standard instead of doing the validation.
            if (toType.toLowerCase() === 'point') {
                switch (geoJson && geoJson.type && geoJson.type.toLowerCase()) {
                    // type of Feature
                    case 'feature':
                        if (geoJson.geometry && geoJson.geometry.type && geoJson.geometry.type === 'Point') {
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
            if(!geoJson || geoJson.type === undefined || typeof geoJson.type !== 'string' || (typeRestriction && geoJson.type.toLowerCase() !== typeRestriction)) {
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
                    flattenedCoordinates.forEach(function(element) {
                        if (typeof element !== 'number') {
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
}]);

sdkGeospatialApp.factory('topologyHelper', ['topologySuite', function (topologySuite) {
    var geometryFactory = new topologySuite.geom.GeometryFactory(),
        geoJSONReader = new topologySuite.io.GeoJSONReader(geometryFactory),
        geoJSONWriter = new topologySuite.io.GeoJSONWriter(geometryFactory);

    return {
        getGeometryFactory: function () {
            return geometryFactory;
        },
        getGeoJSONReader: function () {
            return geoJSONReader;
        },
        getGeoJSONWriter: function () {
            return geoJSONWriter;
        },
        readGeoJSON: function (geojson) {
            return (geojson ? geoJSONReader.read(geojson) : undefined);
        },
        writeGeoJSON: function (geometry) {
            return (geometry ? geoJSONWriter.write(geometry) : undefined);
        }
    };
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
sdkLibraryApp.constant('bigNumber', window.BigNumber);

sdkLibraryApp.constant('underscore', window._);

sdkLibraryApp.constant('moment', window.moment);

sdkLibraryApp.constant('topologySuite', window.jsts);

sdkLibraryApp.constant('naturalSort', window.naturalSort);

var sdkMonitorApp = angular.module('ag.sdk.monitor', ['ag.sdk.utilities']);

sdkMonitorApp.config(['$provide', function ($provide) {
    $provide.decorator('$log', ['$delegate', '$filter', 'logStore', 'moment', 'underscore', function ($delegate, $filter, logStore, moment, underscore) {
        function prepareLogLevelFunction (log, level) {
            var levelFunction = log[level];

            log[level] = function () {
                var args = [].slice.call(arguments),
                    caller = (arguments.callee && arguments.callee.caller && arguments.callee.caller.name.length > 0 ? arguments.callee.caller.name + ' :: ' : ''),
                    output = (underscore.isObject(args[0]) ? (typeof args[0].toString === 'function' ? args[0].toString() : '\n' + $filter('json')(args[0])) : args[0]);

                args[0] = moment().format('YYYY-MM-DDTHH:mm:ss.SSS') + underscore.lpad(' [' + level.toUpperCase() + '] ', 7, ' ') +  caller + output;

                logStore.log(level, args[0]);
                levelFunction.apply(null, args);
            };
        }

        prepareLogLevelFunction($delegate, 'log');
        prepareLogLevelFunction($delegate, 'info');
        prepareLogLevelFunction($delegate, 'warn');
        prepareLogLevelFunction($delegate, 'debug');
        prepareLogLevelFunction($delegate, 'error');

        return $delegate;
    }]);
}]);

sdkMonitorApp.provider('logStore', [function () {
    var _items = [],
        _defaultConfig = {
            maxItems: 1000
        },
        _config = _defaultConfig;

    return {
        config: function (config) {
            _config = config;
        },
        $get: ['underscore', function (underscore) {
            _config = underscore.defaults(_config, _defaultConfig);

            return {
                log: function (level, entry) {
                    var item = {
                        level: level,
                        entry: entry
                    };

                    _items.splice(0, 0, item);

                    if (_items.length > _config.maxItems) {
                        _items.pop();
                    }
                },
                clear: function () {
                    _items = [];
                },
                list: function () {
                    return _items;
                }
            }
        }]
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

sdkUtilitiesApp.factory('httpRequestor', ['$http', 'underscore', function ($http, underscore) {
    return function (url, params) {
        params = params || {};

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

    return {
        all: $q.all,
        reject: $q.reject,
        resolve: $q.resolve,
        chain: function (action) {
            return _chainAll(action, []);
        },
        wrap: function(action) {
            var deferred = _defer();

            $timeout(function () {
                action(deferred);
            }, 0);

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

sdkUtilitiesApp.factory('asJson', ['underscore', function (underscore) {
    return function (object, omit) {
        return underscore.omit(object && typeof object.asJSON === 'function' ? object.asJSON(omit) : object, omit || []);
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
            return underscore.reduce(array || [], function (total, value) {
                return safeMath.plus(total, value);
            }, initialValue || 0)
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

var sdkHelperAssetApp = angular.module('ag.sdk.helper.asset', ['ag.sdk.helper.farmer', 'ag.sdk.helper.attachment', 'ag.sdk.library']);

sdkHelperAssetApp.factory('assetHelper', ['$filter', 'attachmentHelper', 'landUseHelper', 'underscore', function($filter, attachmentHelper, landUseHelper, underscore) {
    var _assetTitle = function (asset) {
        if (asset.data) {
            switch (asset.type) {
                case 'crop':
                case 'permanent crop':
                case 'plantation':
                    return (asset.data.plantedArea ? $filter('number')(asset.data.plantedArea, 2) + 'ha' : '') +
                       (asset.data.plantedArea && asset.data.crop ? ' of ' : '') +
                       (asset.data.crop ? asset.data.crop : '') +
                       (asset.data.fieldName ? ' on field ' + asset.data.fieldName : '');
                case 'farmland':
                    return (asset.data.label ? asset.data.label :
                        (asset.data.portionLabel ? asset.data.portionLabel :
                            (asset.data.portionNumber ? 'Ptn. ' + asset.data.portionNumber : 'Rem. extent of farm')));
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
            id: item.id || item.$id,
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
                map.subtitle = (item.data.area !== undefined ? 'Area: ' + $filter('number')(item.data.area, 2) + 'ha' : 'Unknown area');
                map.groupby = item.farmId;
            } else if (item.type == 'improvement') {
                map.title = _assetTitle(item);
                // Might want to edit this further so that title and subtitle are not identical in most cases
                map.subtitle = item.data.type + (item.data.category ? ' - ' + item.data.category : '');
                map.summary = (item.data.description || '');
                map.groupby = item.farmId;
            } else if (item.type == 'cropland') {
                map.title = _assetTitle(item);
                map.subtitle = (item.data.size !== undefined ? 'Area: ' + $filter('number')(item.data.size, 2) + 'ha' : 'Unknown area');
                map.groupby = item.farmId;
            } else if (item.type == 'livestock') {
                map.title = _assetTitle(item);
                map.subtitle = (item.data.breed ? item.data.breed + ' for ' : 'For ') + item.data.purpose;
                map.summary = (item.data.description || '');
                map.groupby = item.data.type;
            } else if (item.type == 'pasture') {
                map.title = _assetTitle(item);
                map.subtitle = (item.data.size !== undefined ? 'Area: ' + $filter('number')(item.data.size, 2) + 'ha' : 'Unknown area');
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
                map.subtitle = (item.data.size !== undefined ? 'Area: ' + $filter('number')(item.data.size, 2) + 'ha' : 'Unknown area');
                map.groupby = item.farmId;
            } else if (item.type == 'water right') {
                map.title = _assetTitle(item);
                map.subtitle = (item.data.size !== undefined ? 'Irrigatable Extent: ' + $filter('number')(item.data.size, 2) + 'ha' : 'Unknown area');
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
        improvement: [
            { category: "Airport", subCategory: "Hangar" },
            { category: "Airport", subCategory: "Helipad" },
            { category: "Airport", subCategory: "Runway" },
            { category: "Poultry", subCategory: "Hatchery" },
            { category: "Aquaculture", subCategory: "Pond" },
            { category: "Aquaculture", subCategory: "Net House" },
            { category: "Aviary" },
            { category: "Beekeeping" },
            { category: "Borehole" },
            { category: "Borehole", subCategory: "Equipped" },
            { category: "Borehole", subCategory: "Pump" },
            { category: "Borehole", subCategory: "Windmill" },
            { category: "Poultry", subCategory: "Broiler House" },
            { category: "Poultry", subCategory: "Broiler House - Atmosphere" },
            { category: "Poultry", subCategory: "Broiler House - Semi" },
            { category: "Poultry", subCategory: "Broiler House - Zinc" },
            { category: "Building", subCategory: "Administrative" },
            { category: "Building" },
            { category: "Building", subCategory: "Commercial" },
            { category: "Building", subCategory: "Entrance" },
            { category: "Building", subCategory: "Lean-to" },
            { category: "Building", subCategory: "Outbuilding" },
            { category: "Building", subCategory: "Gate" },
            { category: "Cold Storage" },
            { category: "Commercial", subCategory: "Coffee Shop" },
            { category: "Commercial", subCategory: "Sales Facility" },
            { category: "Commercial", subCategory: "Shop" },
            { category: "Commercial", subCategory: "Bar" },
            { category: "Commercial", subCategory: "Café" },
            { category: "Commercial", subCategory: "Restaurant" },
            { category: "Commercial", subCategory: "Factory" },
            { category: "Commercial", subCategory: "Tasting Facility" },
            { category: "Commercial", subCategory: "Cloth House" },
            { category: "Compost", subCategory: "Preparing Unit" },
            { category: "Crocodile Dam" },
            { category: "Crop Processing", subCategory: "Degreening Room" },
            { category: "Crop Processing", subCategory: "Dehusking Facility" },
            { category: "Crop Processing", subCategory: "Drying Facility" },
            { category: "Crop Processing", subCategory: "Drying Tunnels" },
            { category: "Crop Processing", subCategory: "Sorting Facility" },
            { category: "Crop Processing", subCategory: "Drying Oven" },
            { category: "Crop Processing", subCategory: "Drying Racks" },
            { category: "Crop Processing", subCategory: "Crushing Plant" },
            { category: "Crop Processing", subCategory: "Nut Cracking Facility" },
            { category: "Crop Processing", subCategory: "Nut Factory" },
            { category: "Dairy" },
            { category: "Dairy", subCategory: "Pasteurising Facility" },
            { category: "Dairy", subCategory: "Milking Parlour" },
            { category: "Dam" },
            { category: "Dam", subCategory: "Filter" },
            { category: "Dam", subCategory: "Trout" },
            { category: "Domestic", subCategory: "Chicken Coop" },
            { category: "Domestic", subCategory: "Chicken Run" },
            { category: "Domestic", subCategory: "Kennels" },
            { category: "Domestic", subCategory: "Gardening Facility" },
            { category: "Education", subCategory: "Conference Room" },
            { category: "Education", subCategory: "Classroom" },
            { category: "Education", subCategory: "Crèche" },
            { category: "Education", subCategory: "School" },
            { category: "Education", subCategory: "Training Facility" },
            { category: "Equipment", subCategory: "Air Conditioner" },
            { category: "Equipment", subCategory: "Gantry" },
            { category: "Equipment", subCategory: "Oven" },
            { category: "Equipment", subCategory: "Pump" },
            { category: "Equipment", subCategory: "Pumphouse" },
            { category: "Equipment", subCategory: "Scale" },
            { category: "Feed Mill" },
            { category: "Feedlot" },
            { category: "Fencing" },
            { category: "Fencing", subCategory: "Electric" },
            { category: "Fencing", subCategory: "Game" },
            { category: "Fencing", subCategory: "Perimeter" },
            { category: "Fencing", subCategory: "Security" },
            { category: "Fencing", subCategory: "Wire" },
            { category: "Fuel", subCategory: "Tanks" },
            { category: "Fuel", subCategory: "Tank Stand" },
            { category: "Fuel", subCategory: "Fuelling Facility" },
            { category: "Grain Mill" },
            { category: "Greenhouse" },
            { category: "Infrastructure" },
            { category: "Irrigation", subCategory: "Sprinklers" },
            { category: "Irrigation" },
            { category: "Laboratory" },
            { category: "Livestock Handling", subCategory: "Auction Facility" },
            { category: "Livestock Handling", subCategory: "Cages" },
            { category: "Livestock Handling", subCategory: "Growing House" },
            { category: "Livestock Handling", subCategory: "Pens" },
            { category: "Livestock Handling", subCategory: "Shelter" },
            { category: "Livestock Handling", subCategory: "Breeding Facility" },
            { category: "Livestock Handling", subCategory: "Culling Shed" },
            { category: "Livestock Handling", subCategory: "Dipping Facility" },
            { category: "Livestock Handling", subCategory: "Elephant Enclosures" },
            { category: "Livestock Handling", subCategory: "Feed Troughs/Dispensers" },
            { category: "Livestock Handling", subCategory: "Horse Walker" },
            { category: "Livestock Handling", subCategory: "Maternity Shelter/Pen" },
            { category: "Livestock Handling", subCategory: "Quarantine Area" },
            { category: "Livestock Handling", subCategory: "Rehab Facility" },
            { category: "Livestock Handling", subCategory: "Shearing Facility" },
            { category: "Livestock Handling", subCategory: "Stable" },
            { category: "Livestock Handling", subCategory: "Surgery" },
            { category: "Livestock Handling", subCategory: "Treatment Area" },
            { category: "Livestock Handling", subCategory: "Weaner House" },
            { category: "Livestock Handling", subCategory: "Grading Facility" },
            { category: "Livestock Handling", subCategory: "Inspection Facility" },
            { category: "Logistics", subCategory: "Handling Equipment" },
            { category: "Logistics", subCategory: "Handling Facility" },
            { category: "Logistics", subCategory: "Depot" },
            { category: "Logistics", subCategory: "Loading Area" },
            { category: "Logistics", subCategory: "Loading Shed" },
            { category: "Logistics", subCategory: "Hopper" },
            { category: "Logistics", subCategory: "Weigh Bridge" },
            { category: "Meat Processing", subCategory: "Abattoir" },
            { category: "Meat Processing", subCategory: "Deboning Room" },
            { category: "Meat Processing", subCategory: "Skinning Facility" },
            { category: "Mill" },
            { category: "Mushrooms", subCategory: "Cultivation" },
            { category: "Mushrooms", subCategory: "Sweat Room" },
            { category: "Nursery ", subCategory: "Plant" },
            { category: "Nursery ", subCategory: "Plant Growing Facility" },
            { category: "Office" },
            { category: "Packaging Facility" },
            { category: "Paddocks", subCategory: "Camp" },
            { category: "Paddocks", subCategory: "Kraal" },
            { category: "Paddocks" },
            { category: "Piggery", subCategory: "Farrowing House" },
            { category: "Piggery", subCategory: "Pig Sty" },
            { category: "Processing", subCategory: "Bottling Facility" },
            { category: "Processing", subCategory: "Flavour Shed" },
            { category: "Processing", subCategory: "Processing Facility" },
            { category: "Recreation", subCategory: "Viewing Area" },
            { category: "Recreation", subCategory: "BBQ" },
            { category: "Recreation", subCategory: "Clubhouse" },
            { category: "Recreation", subCategory: "Event Venue" },
            { category: "Recreation", subCategory: "Gallery" },
            { category: "Recreation", subCategory: "Game Room" },
            { category: "Recreation", subCategory: "Gazebo" },
            { category: "Recreation", subCategory: "Gymnasium" },
            { category: "Recreation", subCategory: "Jacuzzi" },
            { category: "Recreation", subCategory: "Judging Booth" },
            { category: "Recreation", subCategory: "Museum" },
            { category: "Recreation", subCategory: "Play Area" },
            { category: "Recreation", subCategory: "Pool House" },
            { category: "Recreation", subCategory: "Pottery Room" },
            { category: "Recreation", subCategory: "Racing Track" },
            { category: "Recreation", subCategory: "Salon" },
            { category: "Recreation", subCategory: "Sauna" },
            { category: "Recreation", subCategory: "Shooting Range" },
            { category: "Recreation", subCategory: "Spa Facility" },
            { category: "Recreation", subCategory: "Squash Court" },
            { category: "Recreation", subCategory: "Swimming Pool" },
            { category: "Recreation" },
            { category: "Religeous", subCategory: "Church" },
            { category: "Residential", subCategory: "Carport" },
            { category: "Residential", subCategory: "Driveway" },
            { category: "Residential", subCategory: "Flooring" },
            { category: "Residential", subCategory: "Paving" },
            { category: "Residential", subCategory: "Roofing" },
            { category: "Residential", subCategory: "Water Feature" },
            { category: "Residential", subCategory: "Hall" },
            { category: "Residential", subCategory: "Balcony" },
            { category: "Residential", subCategory: "Canopy" },
            { category: "Residential", subCategory: "Concrete Surface" },
            { category: "Residential", subCategory: "Courtyard" },
            { category: "Residential", subCategory: "Covered" },
            { category: "Residential", subCategory: "Deck" },
            { category: "Residential", subCategory: "Mezzanine" },
            { category: "Residential", subCategory: "Parking Area" },
            { category: "Residential", subCategory: "Patio" },
            { category: "Residential", subCategory: "Porch" },
            { category: "Residential", subCategory: "Porte Cochere" },
            { category: "Residential", subCategory: "Terrace" },
            { category: "Residential", subCategory: "Veranda" },
            { category: "Residential", subCategory: "Walkways" },
            { category: "Residential", subCategory: "Rondavel" },
            { category: "Residential", subCategory: "Accommodation Units" },
            { category: "Residential", subCategory: "Boma" },
            { category: "Residential", subCategory: "Bungalow" },
            { category: "Residential", subCategory: "Bunker" },
            { category: "Residential", subCategory: "Cabin" },
            { category: "Residential", subCategory: "Chalet" },
            { category: "Residential", subCategory: "Community Centre" },
            { category: "Residential", subCategory: "Dormitory" },
            { category: "Residential", subCategory: "Dwelling" },
            { category: "Residential", subCategory: "Flat" },
            { category: "Residential", subCategory: "Kitchen" },
            { category: "Residential", subCategory: "Lapa" },
            { category: "Residential", subCategory: "Laundry Facility" },
            { category: "Residential", subCategory: "Locker Room" },
            { category: "Residential", subCategory: "Lodge" },
            { category: "Residential", subCategory: "Shower" },
            { category: "Residential", subCategory: "Toilets" },
            { category: "Residential", subCategory: "Room" },
            { category: "Residential", subCategory: "Cottage" },
            { category: "Residential", subCategory: "Garage" },
            { category: "Roads", subCategory: "Access Roads" },
            { category: "Roads", subCategory: "Gravel" },
            { category: "Roads", subCategory: "Tarred" },
            { category: "Security", subCategory: "Control Room" },
            { category: "Security", subCategory: "Guardhouse" },
            { category: "Security", subCategory: "Office" },
            { category: "Shade Nets" },
            { category: "Silo" },
            { category: "Sports", subCategory: "Arena" },
            { category: "Sports", subCategory: "Tennis Court" },
            { category: "Staff", subCategory: "Hostel" },
            { category: "Staff", subCategory: "Hut" },
            { category: "Staff", subCategory: "Retirement Centre" },
            { category: "Staff", subCategory: "Staff Building" },
            { category: "Staff", subCategory: "Canteen" },
            { category: "Staff", subCategory: "Dining Facility" },
            { category: "Storage", subCategory: "Truck Shelter" },
            { category: "Storage", subCategory: "Barn" },
            { category: "Storage", subCategory: "Dark Room" },
            { category: "Storage", subCategory: "Bin Compartments" },
            { category: "Storage", subCategory: "Machinery" },
            { category: "Storage", subCategory: "Saddle Room" },
            { category: "Storage", subCategory: "Shed" },
            { category: "Storage", subCategory: "Chemicals" },
            { category: "Storage", subCategory: "Tools" },
            { category: "Storage", subCategory: "Dry" },
            { category: "Storage", subCategory: "Equipment" },
            { category: "Storage", subCategory: "Feed" },
            { category: "Storage", subCategory: "Fertilizer" },
            { category: "Storage", subCategory: "Fuel" },
            { category: "Storage", subCategory: "Grain" },
            { category: "Storage", subCategory: "Hides" },
            { category: "Storage", subCategory: "Oil" },
            { category: "Storage", subCategory: "Pesticide" },
            { category: "Storage", subCategory: "Poison" },
            { category: "Storage", subCategory: "Seed" },
            { category: "Storage", subCategory: "Zinc" },
            { category: "Storage", subCategory: "Sulphur" },
            { category: "Storage" },
            { category: "Storage", subCategory: "Vitamin Room" },
            { category: "Sugar Mill" },
            { category: "Tanks", subCategory: "Water" },
            { category: "Timber Mill" },
            { category: "Trench" },
            { category: "Utilities", subCategory: "Battery Room" },
            { category: "Utilities", subCategory: "Boiler Room" },
            { category: "Utilities", subCategory: "Compressor Room" },
            { category: "Utilities", subCategory: "Engine Room" },
            { category: "Utilities", subCategory: "Generator" },
            { category: "Utilities", subCategory: "Power Room" },
            { category: "Utilities", subCategory: "Pumphouse" },
            { category: "Utilities", subCategory: "Transformer Room" },
            { category: "Utilities" },
            { category: "Vacant Area" },
            { category: "Vehicles", subCategory: "Transport Depot" },
            { category: "Vehicles", subCategory: "Truck Wash" },
            { category: "Vehicles", subCategory: "Workshop" },
            { category: "Walls" },
            { category: "Walls", subCategory: "Boundary" },
            { category: "Walls", subCategory: "Retaining" },
            { category: "Walls", subCategory: "Security" },
            { category: "Warehouse" },
            { category: "Water", subCategory: "Reservoir" },
            { category: "Water", subCategory: "Tower" },
            { category: "Water", subCategory: "Purification Plant" },
            { category: "Water", subCategory: "Reticulation Works" },
            { category: "Water", subCategory: "Filter Station" },
            { category: "Wine Cellar", subCategory: "Tanks" },
            { category: "Wine Cellar" },
            { category: "Wine Cellar", subCategory: "Winery" },
            { category: "Wine Cellar", subCategory: "Barrel Maturation Room" }
        ],
        livestock: [
            { category: "Cattle", subCategory: "Phase A Bulls", purpose: "Breeding" },
            { category: "Cattle", subCategory: "Phase B Bulls", purpose: "Breeding" },
            { category: "Cattle", subCategory: "Phase C Bulls", purpose: "Breeding" },
            { category: "Cattle", subCategory: "Phase D Bulls", purpose: "Breeding" },
            { category: "Cattle", subCategory: "Heifers", purpose: "Breeding" },
            { category: "Cattle", subCategory: "Bull Calves", purpose: "Breeding" },
            { category: "Cattle", subCategory: "Heifer Calves", purpose: "Breeding" },
            { category: "Cattle", subCategory: "Tollies 1-2", purpose: "Breeding" },
            { category: "Cattle", subCategory: "Heifers 1-2", purpose: "Breeding" },
            { category: "Cattle", subCategory: "Culls", purpose: "Breeding" },
            { category: "Cattle", subCategory: "Bulls", purpose: "Dairy" },
            { category: "Cattle", subCategory: "Dry Cows", purpose: "Dairy" },
            { category: "Cattle", subCategory: "Lactating Cows", purpose: "Dairy" },
            { category: "Cattle", subCategory: "Heifers", purpose: "Dairy" },
            { category: "Cattle", subCategory: "Calves", purpose: "Dairy" },
            { category: "Cattle", subCategory: "Culls", purpose: "Dairy" },
            { category: "Cattle", subCategory: "Bulls", purpose: "Slaughter" },
            { category: "Cattle", subCategory: "Cows", purpose: "Slaughter" },
            { category: "Cattle", subCategory: "Heifers", purpose: "Slaughter" },
            { category: "Cattle", subCategory: "Weaners", purpose: "Slaughter" },
            { category: "Cattle", subCategory: "Calves", purpose: "Slaughter" },
            { category: "Cattle", subCategory: "Culls", purpose: "Slaughter" },
            { category: "Chickens", subCategory: "Day Old Chicks", purpose: "Broilers" },
            { category: "Chickens", subCategory: "Broilers", purpose: "Broilers" },
            { category: "Chickens", subCategory: "Hens", purpose: "Layers" },
            { category: "Chickens", subCategory: "Point of Laying Hens", purpose: "Layers" },
            { category: "Chickens", subCategory: "Culls", purpose: "Layers" },
            { category: "Game", subCategory: "Game", purpose: "Slaughter" },
            { category: "Goats", subCategory: "Rams", purpose: "Slaughter" },
            { category: "Goats", subCategory: "Breeding Ewes", purpose: "Slaughter" },
            { category: "Goats", subCategory: "Young Ewes", purpose: "Slaughter" },
            { category: "Goats", subCategory: "Kids", purpose: "Slaughter" },
            { category: "Horses", subCategory: "Horses", purpose: "Breeding" },
            { category: "Pigs", subCategory: "Boars", purpose: "Slaughter" },
            { category: "Pigs", subCategory: "Breeding Sows", purpose: "Slaughter" },
            { category: "Pigs", subCategory: "Weaned pigs", purpose: "Slaughter" },
            { category: "Pigs", subCategory: "Piglets", purpose: "Slaughter" },
            { category: "Pigs", subCategory: "Porkers", purpose: "Slaughter" },
            { category: "Pigs", subCategory: "Baconers", purpose: "Slaughter" },
            { category: "Pigs", subCategory: "Culls", purpose: "Slaughter" },
            { category: "Ostriches", subCategory: "Breeding Stock", purpose: "Slaughter" },
            { category: "Ostriches", subCategory: "Slaughter Birds > 3 months", purpose: "Slaughter" },
            { category: "Ostriches", subCategory: "Slaughter Birds < 3 months", purpose: "Slaughter" },
            { category: "Ostriches", subCategory: "Chicks", purpose: "Slaughter" },
            { category: "Rabbits", subCategory: "Rabbits", purpose: "Slaughter" },
            { category: "Sheep", subCategory: "Rams", purpose: "Breeding" },
            { category: "Sheep", subCategory: "Young Rams", purpose: "Breeding" },
            { category: "Sheep", subCategory: "Ewes", purpose: "Breeding" },
            { category: "Sheep", subCategory: "Young Ewes", purpose: "Breeding" },
            { category: "Sheep", subCategory: "Lambs", purpose: "Breeding" },
            { category: "Sheep", subCategory: "Wethers", purpose: "Breeding" },
            { category: "Sheep", subCategory: "Culls", purpose: "Breeding" },
            { category: "Sheep", subCategory: "Rams", purpose: "Slaughter" },
            { category: "Sheep", subCategory: "Ewes", purpose: "Slaughter" },
            { category: "Sheep", subCategory: "Lambs", purpose: "Slaughter" },
            { category: "Sheep", subCategory: "Wethers", purpose: "Slaughter" },
            { category: "Sheep", subCategory: "Culls", purpose: "Slaughter" }
        ],
        vme: [
            { category: "Vehicles", subCategory: "Bakkie" },
            { category: "Vehicles", subCategory: "Car" },
            { category: "Vehicles", subCategory: "Truck" },
            { category: "Vehicles", subCategory: "Tractor" },
            { category: "Machinery", subCategory: "Mower" },
            { category: "Machinery", subCategory: "Mower Conditioner" },
            { category: "Machinery", subCategory: "Hay Rake" },
            { category: "Machinery", subCategory: "Hay Baler" },
            { category: "Machinery", subCategory: "Harvester" },
            { category: "Equipment", subCategory: "Plough" },
            { category: "Equipment", subCategory: "Harrow" },
            { category: "Equipment", subCategory: "Ridgers" },
            { category: "Equipment", subCategory: "Rotovator" },
            { category: "Equipment", subCategory: "Cultivator" },
            { category: "Equipment", subCategory: "Planter" },
            { category: "Equipment", subCategory: "Combine" },
            { category: "Equipment", subCategory: "Spreader" },
            { category: "Equipment", subCategory: "Sprayer" },
            { category: "Equipment", subCategory: "Mixer" },
        ]
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

    var _grazingCropTypes = [
        'Bahia-Notatum',
        'Birdsfoot Trefoil',
        'Bottle Brush',
        'Buffalo',
        'Buffalo (Blue)',
        'Buffalo (White)',
        'Bush',
        'Carribean Stylo',
        'Clover',
        'Clover (Arrow Leaf)',
        'Clover (Crimson)',
        'Clover (Persian)',
        'Clover (Red)',
        'Clover (Rose)',
        'Clover (Strawberry)',
        'Clover (Subterranean)',
        'Clover (White)',
        'Cocksfoot',
        'Common Setaria',
        'Dallis',
        'Kikuyu',
        'Lucerne',
        'Lupin',
        'Lupin (Narrow Leaf)',
        'Lupin (White)',
        'Lupin (Yellow)',
        'Medic',
        'Medic (Barrel)',
        'Medic (Burr)',
        'Medic (Gama)',
        'Medic (Snail)',
        'Medic (Strand)',
        'Multispecies Pasture',
        'Phalaris',
        'Rescue',
        'Rhodes',
        'Russian Grass',
        'Ryegrass',
        'Ryegrass (Hybrid)',
        'Ryegrass (Italian)',
        'Ryegrass (Westerwolds)',
        'Serradella',
        'Serradella (Yellow)',
        'Silver Leaf Desmodium',
        'Smuts Finger',
        'Soutbos',
        'Tall Fescue',
        'Teff',
        'Veld',
        'Weeping Lovegrass'
    ];

    var _landUseCropTypes = {
        'Cropland': [
            'Barley',
            'Bean',
            'Bean (Broad)',
            'Bean (Dry)',
            'Bean (Sugar)',
            'Bean (Green)',
            'Bean (Kidney)',
            'Beet',
            'Broccoli',
            'Butternut',
            'Cabbage',
            'Canola',
            'Carrot',
            'Cassava',
            'Cauliflower',
            'Cotton',
            'Cowpea',
            'Grain Sorghum',
            'Groundnut',
            'Leek',
            'Lucerne',
            'Maize',
            'Maize (Irrigated)',
            'Maize (White)',
            'Maize (Yellow)',
            'Oats',
            'Onion',
            'Peanut',
            'Pearl Millet',
            'Potato',
            'Pumpkin',
            'Rapeseed',
            'Rice',
            'Rye',
            'Soya Bean',
            'Soya Bean (Irrigated)',
            'Sunflower',
            'Sweet Corn',
            'Sweet Potato',
            'Teff',
            'Teff (Irrigated)',
            'Tobacco',
            'Triticale',
            'Turnip',
            'Wheat',
            'Wheat (Durum)',
            'Wheat (Irrigated)'],
        'Grazing': _grazingCropTypes,
        'Horticulture (Perennial)': [
            'Almond',
            'Apple',
            'Apricot',
            'Avocado',
            'Banana',
            'Barberry',
            'Berry',
            'Bilberry',
            'Blackberry',
            'Blueberry',
            'Cherry',
            'Cloudberry',
            'Coconut',
            'Coffee',
            'Date',
            'Fig',
            'Gooseberry',
            'Grape',
            'Grape (Bush Vine)',
            'Grape (Red)',
            'Grape (Table)',
            'Grape (White)',
            'Grapefruit',
            'Guava',
            'Kiwi Fruit',
            'Lemon',
            'Litchi',
            'Macadamia Nut',
            'Mandarin',
            'Mango',
            'Nectarine',
            'Olive',
            'Orange',
            'Papaya',
            'Peach',
            'Pear',
            'Prickly Pear',
            'Pecan Nut',
            'Persimmon',
            'Pineapple',
            'Pistachio Nut',
            'Plum',
            'Pomegranate',
            'Protea',
            'Raspberry',
            'Rooibos',
            'Roses',
            'Strawberry',
            'Sugarcane',
            'Walnut',
            'Wineberry'],
        'Horticulture (Seasonal)': [
            'Asparagus',
            'Beet',
            'Beetroot',
            'Blackberry',
            'Borecole',
            'Brinjal',
            'Broccoli',
            'Brussel Sprout',
            'Butternut',
            'Cabbage',
            'Cabbage (Chinese)',
            'Cabbage (Savoy)',
            'Cactus Pear',
            'Carrot',
            'Cauliflower',
            'Celery',
            'Chicory',
            'Chili',
            'Cucumber',
            'Cucurbit',
            'Garlic',
            'Ginger',
            'Granadilla',
            'Kale',
            'Kohlrabi',
            'Leek',
            'Lentil',
            'Lespedeza',
            'Lettuce',
            'Makataan',
            'Mustard',
            'Mustard (White)',
            'Paprika',
            'Parsley',
            'Parsnip',
            'Pea',
            'Pea (Dry)',
            'Pepper',
            'Quince',
            'Rapeseed',
            'Radish',
            'Squash',
            'Strawberry',
            'Swede',
            'Sweet Melon',
            'Swiss Chard',
            'Tomato',
            'Vetch (Common)',
            'Vetch (Hairy)',
            'Watermelon',
            'Youngberry'],
        'Plantation': [
            'Aloe',
            'Bluegum',
            'Hops',
            'Pine',
            'Pineapple',
            'Tea',
            'Sisal',
            'Wattle'],
        'Planted Pastures': _grazingCropTypes
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
        'short-term': 'Short Term Loan',
        'medium-term': 'Medium Term Loan',
        'long-term': 'Long Term Loan'
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
            return (_assetCategories[type] ? (subtype ? (_assetCategories[type][subtype] || []) : _assetCategories[type] ) : []);
        },
        getCategoryLabel: function(categoryObject) {
            if (!(categoryObject && categoryObject.category)) {
                return '';
            }
            return categoryObject.category + (categoryObject.subCategory ? ' (' + categoryObject.subCategory + (categoryObject.purpose ? ', ' + categoryObject.purpose : '') + ')'  : '');
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
        generateFarmlandAssetLabels: function(asset, force) {
            var portion = (asset.data ? asset.data : asset);
            
            if (portion && (asset.type == 'farmland' || force)) {
                portion.portionLabel = (portion.portionNumber ?
                    (portion.remainder ? 'Rem. portion ' + portion.portionNumber : 'Ptn. ' + portion.portionNumber) :
                    'Rem. extent');
                portion.farmLabel = (portion.officialFarmName && !_(portion.officialFarmName.toLowerCase()).startsWith('farm') ?
                    _(portion.officialFarmName).titleize() + ' ' : '') + (portion.farmNumber ? portion.farmNumber : '');
                portion.label = portion.portionLabel + (portion.farmLabel && _.words(portion.farmLabel).length > 0 ?
                    " of " + (_.words(portion.farmLabel.toLowerCase())[0] == 'farm' ? _(portion.farmLabel).titleize() :
                    "farm " + _(portion.farmLabel).titleize() ) : 'farm Unknown');
            }
        },
        generateAssetName: function(asset, categoryLabel, currentAssetList) {
            var assetCount = underscore.chain(currentAssetList)
                .where({type: asset.type})
                .reduce(function(currentAssetCount, asset) {
                    if (asset.data.name) {
                        var index = asset.data.name.search(/\s+[0-9]+$/);
                        var name = asset.data.name;
                        var number;
                        if (index != -1) {
                            name = name.substr(0, index);
                            number = parseInt(asset.data.name.substring(index).trim());
                        }
                        if (categoryLabel && name == categoryLabel && (!number || number > currentAssetCount)) {
                            currentAssetCount = number || 1;
                        }
                    }

                    return currentAssetCount;
                }, -1)
                .value();

            asset.data.name = categoryLabel + (assetCount + 1 ? ' ' + (assetCount + 1) : '');
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

        var _getResizedAttachment = function (attachments, size, defaultImage, type) {
            if ((attachments instanceof Array) == false) {
                attachments = [attachments];
            }

            defaultImage = defaultImage || _options.defaultImage;

            var src = underscore.chain(attachments)
                .filter(function (attachment) {
                    return (type === undefined || attachment.type == type) &&
                        (attachment.sizes && attachment.sizes[size]);
                }).map(function (attachment) {
                    return attachment.sizes[size].src;
                }).last().value();

            return (src ? _options.fileResolver(src) : defaultImage);
        };

        return {
            findSize: function (obj, size, defaultImage, type) {
                return _getResizedAttachment((obj.data && obj.data.attachments ? obj.data.attachments : []), size, defaultImage, type);
            },
            getSize: function (attachments, size, defaultImage, type) {
                return _getResizedAttachment((attachments ? attachments : []), size, defaultImage, type);
            },
            getThumbnail: function (attachments, defaultImage, type) {
                return _getResizedAttachment((attachments ? attachments : []), 'thumb', defaultImage, type);
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
        'Oat': {
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
            doc.state = doc.state || 'document.details';
            _documentMap[doc.docType] = doc;
        });
    };

    this.getDocument = function (docType) {
        return _documentMap[docType];
    };

    this.$get = ['$filter', '$injector', 'taskHelper', 'underscore', function ($filter, $injector, taskHelper, underscore) {
        var _listServiceMap = function (item) {
            var typeColorMap = {
                'error': 'danger',
                'information': 'info',
                'warning': 'warning'
            };
            var flagLabels = underscore.chain(item.activeFlags)
                .groupBy(function(activeFlag) {
                    return activeFlag.flag.type;
                })
                .map(function (group, type) {
                    var hasOpen = false;
                    angular.forEach(group, function(activeFlag) {
                        if(activeFlag.status == 'open') {
                            hasOpen = true;
                        }
                    });
                    return {
                        label: typeColorMap[type],
                        count: group.length,
                        hasOpen: hasOpen
                    }
                })
                .value();
            var docMap = _documentMap[item.docType];
            var map = {
                id: item.id || item.$id,
                title: (item.documentId ? item.documentId : ''),
                subtitle: (item.author ? 'By ' + item.author + ' on ': 'On ') + $filter('date')(item.createdAt),
                docType: item.docType,
                group: (docMap ? docMap.title : item.docType),
                flags: flagLabels
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
                return (_documentMap[docType] ? _documentMap[docType].title : '');
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

sdkHelperEnterpriseBudgetApp.factory('enterpriseBudgetHelper', ['naturalSort', 'underscore', function(naturalSort, underscore) {
    var _listServiceMap = function (item) {
        return {
            id: item.id || item.$id,
            title: item.name,
            subtitle: item.commodityType + (item.regionName? ' in ' + item.regionName : ''),
            status: (item.published ? {text: 'public', label: 'label-success'} : (item.internallyPublished ? {text: 'internal', label: 'label-info'} : false)),
            searchingIndex: searchingIndex(item)
        };

        function searchingIndex (item) {
            var index = [item.name, item.assetType, item.commodityType];

            if (item.data && item.data.details && item.data.details.regionName) {
                index.push(item.data.details.regionName);
            }

            return index;
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
        crop: ['Barley', 'Bean (Dry)', 'Bean (Green)', 'Beet', 'Broccoli', 'Butternut', 'Cabbage', 'Canola', 'Carrot', 'Cauliflower', 'Cotton', 'Cowpea', 'Grain Sorghum', 'Groundnut', 'Leek', 'Lucerne', 'Lupin', 'Maize', 'Maize (Fodder)', 'Maize (Green)', 'Maize (Irrigated)', 'Maize (Seed)', 'Maize (White)', 'Maize (Yellow)', 'Multispecies Pasture', 'Oats', 'Onion', 'Potato', 'Pumpkin', 'Rapeseed', 'Rye', 'Soya Bean', 'Soya Bean (Irrigated)', 'Sunflower', 'Sweet Corn', 'Teff', 'Teff (Irrigated)', 'Tobacco', 'Triticale', 'Turnip', 'Wheat', 'Wheat (Irrigated)'],
        horticulture: ['Almond', 'Apple', 'Apricot', 'Avocado', 'Banana', 'Blueberry', 'Cherry', 'Chicory', 'Chili', 'Citrus (Hardpeel)', 'Citrus (Softpeel)', 'Coffee', 'Date', 'Fig', 'Garlic', 'Grape (Bush Vine)', 'Grape (Table)', 'Grape (Wine)', 'Guava', 'Hops', 'Kiwi', 'Kumquat', 'Lemon', 'Lentil', 'Lime', 'Macadamia Nut', 'Mango', 'Melon', 'Nectarine', 'Olive', 'Orange', 'Papaya', 'Pea', 'Peach', 'Peanut', 'Pear', 'Pecan Nut', 'Persimmon', 'Pineapple', 'Pistachio Nut', 'Plum', 'Pomegranate', 'Prickly Pear', 'Prune', 'Quince', 'Rooibos', 'Strawberry', 'Sugarcane', 'Tomato', 'Watermelon'],
        livestock: ['Cattle (Extensive)', 'Cattle (Feedlot)', 'Cattle (Stud)', 'Chicken (Broilers)', 'Chicken (Layers)', 'Dairy', 'Game', 'Goats', 'Horses', 'Ostrich', 'Pigs', 'Rabbits', 'Sheep (Extensive)', 'Sheep (Feedlot)', 'Sheep (Stud)']
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

    var _scheduleTypes = {
        'default': ['Fertilise', 'Harvest', 'Plant/Seed', 'Plough', 'Spray'],
        'livestock': ['Lick', 'Sales', 'Shearing', 'Vaccination']
    };

    var _scheduleBirthing = {
        'Calving': ['Cattle (Extensive)', 'Cattle (Feedlot)', 'Cattle (Stud)', 'Dairy'],
        'Hatching': ['Chicken (Broilers)', 'Chicken (Layers)', 'Ostrich'],
        'Kidding': ['Game', 'Goats'],
        'Foaling': ['Horses'],
        'Farrowing': ['Pigs'],
        'Lambing': ['Sheep (Extensive)', 'Sheep (Feedlot)', 'Sheep (Stud)']
    };

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

    function getScheduleBirthing (commodityType) {
        return underscore.chain(_scheduleBirthing)
            .keys()
            .filter(function (key) {
                return underscore.contains(_scheduleBirthing[key], commodityType);
            })
            .value();
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
        scheduleTypes: function() {
            return _scheduleTypes;
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
        getScheduleTypes: function(assetType, commodityType) {
            return underscore.chain(_scheduleTypes[assetType] ? _scheduleTypes[assetType] : _scheduleTypes.default)
                .union(getScheduleBirthing(commodityType))
                .compact()
                .value()
                .sort(function (a, b) {
                    return naturalSort(a, b);
                });
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
        area: 'ha',
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
var sdkHelperFarmerApp = angular.module('ag.sdk.helper.farmer', ['ag.sdk.geospatial', 'ag.sdk.library', 'ag.sdk.interface.map', 'ag.sdk.helper.attachment']);

sdkHelperFarmerApp.factory('farmerHelper', ['attachmentHelper', 'geoJSONHelper', 'underscore', function(attachmentHelper, geoJSONHelper, underscore) {
    var _listServiceMap = function (item) {
        typeColorMap = {
            'error': 'danger',
            'information': 'info',
            'warning': 'warning'
        };
        var flagLabels = underscore.chain(item.activeFlags)
            .groupBy(function(activeFlag) {
                return activeFlag.flag.type;
            })
            .map(function (group, type) {
                return {
                    label: typeColorMap[type],
                    count: group.length,
                    hasOpen: underscore.some(group, function (flag) {
                        return flag.status === 'open';
                    })
                }
            })
            .value();

        return {
            id: item.id || item.$id,
            title: item.name,
            subtitle: item.customerId,
            thumbnailUrl: attachmentHelper.findSize(item, 'thumb', 'img/profile-business.png'),
            searchingIndex: searchingIndex(item),
            flags: flagLabels
        };

        function searchingIndex (item) {
            return underscore.chain(item.legalEntities)
                .map(function (entity) {
                    return underscore.compact([entity.cifKey, entity.name, entity.registrationNumber]);
                })
                .flatten()
                .uniq()
                .value()
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
        },
        isFarmerActive: function(farmer) {
            return (farmer && farmer.status == 'active');
        }
    }
}]);

sdkHelperFarmerApp.factory('legalEntityHelper', ['attachmentHelper', 'underscore', function (attachmentHelper, underscore) {
    var _listServiceMap = function(item) {
        var map = {
            id: item.id || item.$id,
            title: item.name,
            subtitle: item.type
        };

        map.thumbnailUrl = attachmentHelper.findSize(item, 'thumb', 'img/profile-user.png');

        return map;
    };

    var _legalEntityTypes = ['Individual', 'Sole Proprietary', 'Joint account', 'Partnership', 'Close Corporation', 'Private Company', 'Public Company', 'Trust', 'Non-Profitable companies', 'Cooperatives', 'In- Cooperatives', 'Other Financial Intermediaries'];

    // When updating, also update the _commodities list in the enterpriseBudgetHelper
    var _enterpriseTypes = {
        'Field Crops': [
            'Barley',
            'Bean',
            'Bean (Broad)',
            'Bean (Dry)',
            'Bean (Sugar)',
            'Bean (Green)',
            'Bean (Kidney)',
            'Beet',
            'Broccoli',
            'Butternut',
            'Cabbage',
            'Canola',
            'Carrot',
            'Cassava',
            'Cauliflower',
            'Cotton',
            'Cowpea',
            'Grain Sorghum',
            'Groundnut',
            'Leek',
            'Lucerne',
            'Maize',
            'Maize (White)',
            'Maize (Yellow)',
            'Oats',
            'Peanut',
            'Pearl Millet',
            'Potato',
            'Rapeseed',
            'Rice',
            'Rye',
            'Soya Bean',
            'Sunflower',
            'Sweet Corn',
            'Sweet Potato',
            'Tobacco',
            'Triticale',
            'Turnip',
            'Wheat',
            'Wheat (Durum)'],
        'Grazing': [
            'Bahia-Notatum',
            'Birdsfoot Trefoil',
            'Bottle Brush',
            'Buffalo',
            'Buffalo (Blue)',
            'Buffalo (White)',
            'Bush',
            'Carribean Stylo',
            'Clover',
            'Clover (Arrow Leaf)',
            'Clover (Crimson)',
            'Clover (Persian)',
            'Clover (Red)',
            'Clover (Rose)',
            'Clover (Strawberry)',
            'Clover (Subterranean)',
            'Clover (White)',
            'Cocksfoot',
            'Common Setaria',
            'Dallis',
            'Kikuyu',
            'Lucerne',
            'Lupin',
            'Lupin (Narrow Leaf)',
            'Lupin (White)',
            'Lupin (Yellow)',
            'Medic',
            'Medic (Barrel)',
            'Medic (Burr)',
            'Medic (Gama)',
            'Medic (Snail)',
            'Medic (Strand)',
            'Multispecies Pasture',
            'Phalaris',
            'Rescue',
            'Rhodes',
            'Russian Grass',
            'Ryegrass',
            'Ryegrass (Hybrid)',
            'Ryegrass (Italian)',
            'Ryegrass (Westerwolds)',
            'Serradella',
            'Serradella (Yellow)',
            'Silver Leaf Desmodium',
            'Smuts Finger',
            'Soutbos',
            'Tall Fescue',
            'Teff',
            'Veld',
            'Weeping Lovegrass'],
        'Horticulture': [
            'Almond',
            'Apple',
            'Apricot',
            'Asparagus',
            'Avocado',
            'Banana',
            'Barberry',
            'Beet',
            'Beetroot',
            'Berry',
            'Bilberry',
            'Blackberry',
            'Blueberry',
            'Borecole',
            'Brinjal',
            'Broccoli',
            'Brussel Sprout',
            'Butternut',
            'Cabbage',
            'Cabbage (Chinese)',
            'Cabbage (Savoy)',
            'Cactus Pear',
            'Carrot',
            'Cauliflower',
            'Celery',
            'Cherry',
            'Chicory',
            'Chili',
            'Cloudberry',
            'Coconut',
            'Coffee',
            'Cucumber',
            'Cucurbit',
            'Date',
            'Fig',
            'Garlic',
            'Ginger',
            'Gooseberry',
            'Granadilla',
            'Grape',
            'Grape (Bush Vine)',
            'Grape (Red)',
            'Grape (Table)',
            'Grape (White)',
            'Grapefruit',
            'Guava',
            'Kale',
            'Kiwi Fruit',
            'Kohlrabi',
            'Kumquat',
            'Leek',
            'Lemon',
            'Lentil',
            'Lespedeza',
            'Lettuce',
            'Litchi',
            'Lime',
            'Macadamia Nut',
            'Makataan',
            'Mandarin',
            'Mango',
            'Mustard',
            'Mustard (White)',
            'Nectarine',
            'Olive',
            'Onion',
            'Orange',
            'Papaya',
            'Paprika',
            'Parsley',
            'Parsnip',
            'Pea',
            'Pea (Dry)',
            'Peach',
            'Pear',
            'Pecan Nut',
            'Pepper',
            'Persimmon',
            'Pistachio Nut',
            'Plum',
            'Pomegranate',
            'Prickly Pear',
            'Protea',
            'Pumpkin',
            'Quince',
            'Radish',
            'Rapeseed',
            'Raspberry',
            'Rooibos',
            'Roses',
            'Squash',
            'Strawberry',
            'Sugarcane',
            'Swede',
            'Sweet Melon',
            'Swiss Chard',
            'Tomato',
            'Vetch (Common)',
            'Vetch (Hairy)',
            'Walnut',
            'Watermelon',
            'Wineberry',
            'Youngberry'],
        'Livestock': [
            'Cattle (Extensive)',
            'Cattle (Feedlot)',
            'Cattle (Stud)',
            'Chicken (Broilers)',
            'Chicken (Layers)',
            'Dairy',
            'Game',
            'Goats',
            'Horses',
            'Ostrich',
            'Pigs',
            'Rabbits',
            'Sheep (Extensive)',
            'Sheep (Feedlot)',
            'Sheep (Stud)'],
        'Plantation': [
            'Aloe',
            'Bluegum',
            'Hops',
            'Pine',
            'Pineapple',
            'Tea',
            'Sisal',
            'Wattle']
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

sdkHelperFarmerApp.factory('landUseHelper', ['underscore', function (underscore) {
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
            return s.include(landUse, 'Cropland');
        },
        isEstablishedDateRequired: function (landUse) {
            return (landUse == 'Horticulture (Perennial)');
        },
        isTerrainRequired: function (landUse) {
            return s.include(landUse, 'Grazing');
        }
    }
}]);

var sdkHelperFavouritesApp = angular.module('ag.sdk.helper.favourites', ['ag.sdk.helper.document', 'ag.sdk.helper.task']);

sdkHelperFavouritesApp.factory('activityHelper', ['documentHelper', 'underscore',
    function (documentHelper, underscore) {
        var _listServiceMap = function(item) {
            var map = {
                id: item.id || item.$id,
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
            map.referenceId = (underscore.contains(['farmer', 'merchant', 'user'], item.referenceType) ? item.organization.id : item[item.referenceType + 'Id']);

            if (item.referenceType === 'document' && !underscore.isUndefined(item[item.referenceType])) {
                map.subtitle += _getReferenceArticle(item[item.referenceType].docType) + ' ' + documentHelper.getDocumentTitle(item[item.referenceType].docType) + ' ' + item.referenceType;

                map.referenceState = documentHelper.getDocumentState(item[item.referenceType].docType);
            } else if (item.referenceType === 'farmer' && !underscore.isUndefined(item.organization)) {
                if (item.action === 'invite') {
                    map.subtitle += item.organization.name + ' to create an Agrista account';
                } else if (item.action === 'register') {
                    map.subtitle += 'the request to join Agrista';
                } else if (item.action === 'create') {
                    map.subtitle += 'a customer portfolio for ' + item.organization.name;
                }

                map.referenceState = 'customer.details';
            } else if (item.referenceType === 'task' && !underscore.isUndefined(item[item.referenceType])) {
                map.subtitle += 'the ' + taskHelper.getTaskTitle(item[item.referenceType].todo) + ' ' + item.referenceType;
                map.referenceState = documentHelper.getTaskState(item[item.referenceType].todo);
            } else if (item.referenceType === 'merchant' && !underscore.isUndefined(item.organization)) {
                if (item.action === 'invite') {
                    map.subtitle += item.organization.name + ' to create an Agrista account';
                    map.referenceState = 'merchant';
                } else if (item.action === 'register') {
                    map.subtitle += 'the request to join Agrista';
                    map.referenceState = 'merchant';
                } else if (item.action === 'create') {
                    map.subtitle += 'a merchant portfolio for ' + item.organization.name;
                    map.referenceState = 'merchant';
                } else if (item.action === 'decline') {
                    map.subtitle += 'a task for ' + item.organization.name;
                } else {
                    map.subtitle += 'the portfolio of ' + item.organization.name;
                }
            } else if (item.referenceType === 'user' && !underscore.isUndefined(item.organization)) {
                if (item.action === 'invite') {
                    map.subtitle += item.organization.name + ' to create a user';
                } else if (item.action === 'register') {
                    map.subtitle += 'the request to create a user';
                }
            } else {
                map.subtitle += _getReferenceArticle(item.referenceType) + ' ' + item.referenceType;
            }

            if (item.actor && underscore.contains(['document', 'task'], item.referenceType) && item.organization && item.organization.name) {
                map.subtitle += ' ' + _getActionPreposition(item.action) + ' ' + item.organization.name;
            }

            return map;
        };

        var _getActionPreposition = function (action) {
            return _actionPrepositionExceptionMap[action] || 'for';
        };

        var _getActionVerb = function (action) {
            var vowels = ['a', 'e', 'i', 'o', 'u'];

            return _actionVerbExceptionMap[action] || (action.lastIndexOf('e') === action.length - 1 ? action + 'd' : action.lastIndexOf('y') === action.length - 1 ? (vowels.indexOf(action.substr(action.length - 1, action.length)) === -1 ? action.substr(0, action.length - 1)  + 'ied' : action + 'ed') : action + 'ed');
        };

        var _getReferenceArticle = function (reference) {
            var vowels = ['a', 'e', 'i', 'o', 'u'];

            return _referenceArticleExceptionMap[reference] || (vowels.indexOf(reference.substr(0, 1)) !== -1 ? 'an' : 'a');
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

sdkHelperFavouritesApp.factory('notificationHelper', [function () {
    var _listServiceMap = function(item) {
        return {
            id: item.id || item.$id,
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
            id: item.id || item.$id,
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
var sdkHelperTaskApp = angular.module('ag.sdk.helper.task', ['ag.sdk.authorization', 'ag.sdk.utilities', 'ag.sdk.interface.list', 'ag.sdk.library']);

sdkHelperTaskApp.provider('taskHelper', ['underscore', function (underscore) {
    var _validTaskStatuses = ['assigned', 'in progress', 'in review'];

    var _listServiceMap = function (item) {
        var title = item.documentKey;
        var mappedItems = underscore.chain(item.subtasks)
            .filter(function (task) {
                return (task.type === 'child' && _validTaskStatuses.indexOf(task.status) !== -1);
            })
            .map(function (task) {
                return {
                    id: task.id || item.$id,
                    title: item.organization.name,
                    subtitle: _getTaskTitle(task.todo, task),
                    todo: task.todo,
                    groupby: title,
                    status: {
                        text: task.status || ' ',
                        label: _getStatusLabelClass(task.status)
                    }
                }
            })
            .value();

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

        return (taskMap !== undefined ? (typeof taskMap.title === 'string' ? taskMap.title : taskMap.title(task)) : undefined);
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

            taskStatusTitles: function () {
                return _taskStatusTitles;
            },
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

sdkHelperTaskApp.factory('taskWorkflowHelper', ['underscore', function (underscore) {
    var taskActions = ['accept', 'decline', 'start', 'assign', 'complete', 'approve', 'reject', 'release'],
        taskActionsMap = {
            accept: ['backlog', 'assigned', 'in progress', 'in review', 'complete'],
            decline: ['assigned'],
            start: ['assigned', 'in progress'],
            assign: ['backlog', 'assigned', 'in progress', 'in review'],
            complete: ['assigned', 'in progress'],
            approve: ['in review'],
            reject: ['assigned', 'in review'],
            release: ['done']
        },
        taskTypeActions = {
            parent: {
                complete: ['in progress'],
                reject: ['done'],
                release: ['done']
            },
            child: taskActionsMap,
            external: taskActionsMap
        };

    return {
        canChangeToState: function (task, action) {
            return (underscore.contains(taskActions, action) ?
                (taskTypeActions[task.type] && taskTypeActions[task.type][action] ?
                taskTypeActions[task.type][action].indexOf(task.status) !== -1 : false) : true);
        }
    }
}]);

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

        this.filterList = function () {
            var instance = this;
            instance.selection.list = underscore.reject(availableTeams, function (item) {
                return underscore.contains(instance.teams, (item.name ? item.name : item));
            })
        };

        this.selection = {
            mode: (availableTeams.length == 0 ? 'add' : 'select'),
            text: ''
        };

        this.filterList();
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
            this.filterList();
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
            this.filterList();
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
            id: item.id || item.$id,
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

var sdkInterfaceGeocledianApp = angular.module('ag.sdk.interface.geocledian', ['ag.sdk.utilities', 'ag.sdk.id', 'ag.sdk.library']);

sdkInterfaceGeocledianApp.provider('geocledianService', ['underscore', function (underscore) {
    var _defaultConfig = {
        key: '46552fa9-6a5v-2346-3z67-s4b8556cxvwp',
        layers: ['vitality', 'visible'],
        url: 'https://geocledian.com/agknow/api/v3/',
        source: 'sentinel2'
    };

    this.config = function (options) {
        _defaultConfig = underscore.defaults(options || {}, _defaultConfig);
    };

    this.$get = ['$http', 'moment', 'promiseService', 'underscore',
        function ($http, moment, promiseService, underscore) {
            function GeocledianService () {
                this.ids = [];
                this.dates = [];
                this.parcels = [];
            }

            GeocledianService.prototype = {
                config: _defaultConfig,
                createParcel: function (data) {
                    return promiseService.wrap(function (promise) {
                        $http.post(_defaultConfig.url + 'parcels', underscore.extend({key: _defaultConfig.key}, data))
                            .then(function (result) {
                                if (result && result.data && underscore.isNumber(result.data.id)) {
                                    promise.resolve(result.data);
                                } else {
                                    promise.reject();
                                }
                            }, promise.reject);
                    });
                },
                addParcel: function (parcelId) {
                    return addParcel(this, parcelId);
                },
                getDates: function () {
                    return underscore.chain(this.parcels)
                        .pluck('date')
                        .uniq()
                        .sortBy(function (date) {
                            return moment(date)
                        })
                        .value();
                },
                getParcels: function (query) {
                    if (typeof query != 'object') {
                        query = {'parcel_id': query};
                    }

                    return underscore.where(this.parcels, query);
                },
                getParcelImageUrl: function (parcel, imageType) {
                    return _defaultConfig.url + parcel[imageType || 'png'] + '?key=' + _defaultConfig.key;
                }
            };

            function addParcel (instance, parcelId) {
                return promiseService.wrapAll(function (promises) {
                    var parcels = instance.getParcels(parcelId);

                    if (parcelId && parcels && parcels.length == 0) {
                        instance.ids.push(parcelId);

                        underscore.each(_defaultConfig.layers, function (layer) {
                            promises.push(addParcelType(instance, parcelId, layer));
                        });
                    } else {
                        underscore.each(parcels, function (parcel) {
                            promises.push(parcel);
                        });
                    }
                });
            }

            function addParcelType (instance, parcelId, type) {
                return $http.get(_defaultConfig.url + 'parcels/' + parcelId + '/' + type + '?key=' + _defaultConfig.key + (_defaultConfig.source ? '&source=' + _defaultConfig.source : '')).then(function (result) {
                    if (result && result.data && result.data.content) {
                        instance.parcels = instance.parcels.concat(underscore.map(result.data.content, function (parcel) {
                            return underscore.extend(parcel, {
                                type: type
                            });
                        }));
                    }
                });
            }

            return function () {
                return new GeocledianService();
            }
        }];
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
        },
        updateLabel: function(item) {
            $rootScope.$broadcast('list::labels__changed', item);
        }
    }
}]);

var sdkInterfaceMapApp = angular.module('ag.sdk.interface.map', ['ag.sdk.utilities', 'ag.sdk.id', 'ag.sdk.config', 'ag.sdk.geospatial', 'ag.sdk.library']);

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
                    fillOpacity: 0.6
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
        init: {
            delay: 200
        },
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
                    template: 'agrista.f9f5628d',
                    type: 'mapbox'
                },
                'Satellite': {
                    template: 'agrista.a7235891',
                    type: 'mapbox'
                },
                'Hybrid': {
                    template: 'agrista.01e3fb18',
                    type: 'mapbox'
                },
                'Light': {
                    template: 'agrista.e7367e07',
                    type: 'mapbox'
                },
                'Production Regions': {
                    template: 'agrista.87ceb2ab',
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

    this.$get = ['$rootScope', '$timeout', 'objectId', 'safeApply', function ($rootScope, $timeout, objectId, safeApply) {
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
                $timeout(function () {
                    _this.dequeueRequests();
                    _this._ready = true;
                }, _this._config.init.delay || 0);
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
            isReady: function () {
                return this._ready;
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
            enqueueRequest: function (event, data, handler) {
                handler = handler || angular.noop;

                if (this._ready) {
                    $rootScope.$broadcast(event, data);

                    handler();
                } else {
                    this._requestQueue.push({
                        event: event,
                        data: data,
                        handler: handler
                    });
                }
            },
            dequeueRequests: function () {
                if (this._requestQueue.length) {
                    do {
                        var request = this._requestQueue.shift();

                        $rootScope.$broadcast(request.event, request.data);

                        request.handler();
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
                var _this = this;

                this.enqueueRequest('mapbox-' + this._id + '::hide', {}, function () {
                    _this._show = false;
                });
            },
            show: function() {
                var _this = this;

                this.enqueueRequest('mapbox-' + this._id + '::show', {}, function () {
                    _this._show = true;
                });
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
                var _this = this;
                _this.enqueueRequest('mapbox-' + _this._id + '::set-basetile', tile, function () {
                    _this._config.layerControl.baseTile = tile;
                });
            },

            getBaseLayers: function () {
                return this._config.layerControl.baseLayers;
            },
            setBaseLayers: function (layers) {
                var _this = this;
                _this.enqueueRequest('mapbox-' + _this._id + '::set-baselayers', layers, function () {
                    _this._config.layerControl.baseLayers = layers;
                });
            },
            addBaseLayer: function (name, layer, show) {
                var _this = this;
                _this.enqueueRequest('mapbox-' + _this._id + '::add-baselayer', {
                    name: name,
                    layer: layer,
                    show: show
                }, function () {
                    _this._config.layerControl.baseLayers[name] = layer;
                });
            },

            getOverlays: function () {
                return this._config.layerControl.overlays;
            },
            addOverlay: function (layerName, name) {
                if (layerName && this._config.layerControl.overlays[layerName] == undefined) {
                    var _this = this;
                    _this.enqueueRequest('mapbox-' + _this._id + '::add-overlay', {
                        layerName: layerName,
                        name: name || layerName
                    }, function () {
                        _this._config.layerControl.overlays[layerName] = name;
                    });
                }
            },
            removeOverlay: function (layerName) {
                if (layerName && this._config.layerControl.overlays[layerName]) {
                    var _this = this;
                    _this.enqueueRequest('mapbox-' + _this._id + '::remove-overlay', layerName, function () {
                        delete _this._config.layerControl.overlays[layerName];
                    });
                }
            },
            removeOverlays: function () {
                var _this = this;
                
                angular.forEach(_this._config.layerControl.overlays, function(overlay, name) {
                    _this.enqueueRequest('mapbox-' + _this._id + '::remove-overlay', name, function () {
                        delete _this._config.layerControl.overlays[name];
                    });
                });
            },

            /*
             * Controls
             */
            getControls: function () {
                return this._config.controls;
            },
            addControl: function (controlName, options) {
                var _this = this;
                var control = {
                    name: controlName,
                    options: options
                };

                _this.enqueueRequest('mapbox-' + _this._id + '::add-control', control, function () {
                    _this._config.controls[controlName] = control;
                });
            },
            showControls: function () {
                this.enqueueRequest('mapbox-' + this._id + '::show-controls');
            },
            hideControls: function () {
                this.enqueueRequest('mapbox-' + this._id + '::hide-controls');
            },
            removeControl: function (control) {
                var _this = this;
                _this.enqueueRequest('mapbox-' + _this._id + '::remove-control', control, function () {
                    delete _this._config.controls[control];
                });
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

                angular.forEach(events, function (event) {
                    _this.removeEventHandler(event);

                    var eventHandler = (event !== 'click' ? handler : function (e) {
                        var clickLocation = e.originalEvent.x + ',' + e.originalEvent.y;

                        if (!_this.lastClick || _this.lastClick !== clickLocation) {
                            safeApply(function () {
                                handler(e);
                            });
                        }

                        _this.lastClick = clickLocation;
                    });

                    _this.enqueueRequest('mapbox-' + _this._id + '::add-event-handler', {
                        event: event,
                        handler: eventHandler
                    }, function () {
                        _this._config.events[event] = eventHandler;
                    });
                });
            },
            removeEventHandler: function (events) {
                events = (events instanceof Array ? events : [events]);

                var _this = this;

                angular.forEach(events, function (event) {
                    if (_this._config.events[event] !== undefined) {
                        _this.enqueueRequest('mapbox-' + _this._id + '::remove-event-handler', {
                            event: event,
                            handler: _this._config.events[event]
                        }, function () {
                            delete _this._config.events[event];
                        });
                    }
                });
            },
            addLayerEventHandler: function (event, layer, handler) {
                var _this = this;

                layer.on(event, (event !== 'click' ? handler : function (e) {
                    var clickLocation = e.originalEvent.x + ',' + e.originalEvent.y;

                    if (!_this.lastClick || _this.lastClick !== clickLocation) {
                        safeApply(function () {
                            handler(e);
                        });
                    }

                    _this.lastClick = clickLocation;
                }));
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
                    var _this = this;
                    var view = {
                        coordinates: coordinates,
                        zoom: zoom || _this._config.view.zoom
                    };

                    _this.enqueueRequest('mapbox-' + _this._id + '::set-view', view, function () {
                        _this._config.view = view;
                    });
                }
            },
            getBounds: function () {
                return this._config.bounds;
            },
            setBounds: function (coordinates, options) {
                var _this = this;
                var bounds = {
                    coordinates: coordinates,
                    options: options || {
                        reset: false
                    }
                };

                _this.enqueueRequest('mapbox-' + _this._id + '::set-bounds', bounds, function () {
                    _this._config.bounds = bounds;
                });
            },
            panTo: function (coordinates, options) {
                this.enqueueRequest('mapbox-' + this._id + '::pan-to', {
                    coordinates: coordinates,
                    options: options
                });
            },
            zoomTo: function (coordinates, zoom, options) {
                this.enqueueRequest('mapbox-' + this._id + '::zoom-to', {
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
                var layer = {
                    name: name,
                    type: type,
                    options: options,
                    handler: function (layer) {
                        _this._config.leafletLayers[name] = layer;

                        if (typeof handler === 'function') {
                            handler(layer);
                        }
                    }
                };

                _this.enqueueRequest('mapbox-' + _this._id + '::create-layer', layer, function () {
                    _this._config.layers[name] = layer;
                });
            },
            getLayer: function (name) {
                return this._config.leafletLayers[name];
            },
            getLayers: function () {
                return this._config.layers;
            },
            addLayer: function (name, layer) {
                var _this = this;
                _this.enqueueRequest('mapbox-' + _this._id + '::add-layer', name, function () {
                    _this._config.leafletLayers[name] = layer;
                });
            },
            removeLayer: function (names) {
                if ((names instanceof Array) === false) names = [names];

                var _this = this;

                angular.forEach(names, function (name) {
                    _this.enqueueRequest('mapbox-' + _this._id + '::remove-layer', name, function () {
                        delete _this._config.layers[name];
                        delete _this._config.leafletLayers[name];
                    });
                });
            },
            removeLayers: function () {
                var _this = this;
                
                angular.forEach(this._config.layers, function(layer, name) {
                    _this.enqueueRequest('mapbox-' + _this._id + '::remove-layer', name, function () {
                        delete _this._config.layers[name];
                        delete _this._config.leafletLayers[name];
                    });
                });
            },
            showLayer: function (name) {
                this.enqueueRequest('mapbox-' + this._id + '::show-layer', name);
            },
            hideLayer: function (name) {
                this.enqueueRequest('mapbox-' + this._id + '::hide-layer', name);
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

                _this.enqueueRequest('mapbox-' + _this._id + '::add-geojson', data, function () {
                    _this._config.geojson[layerName] = _this._config.geojson[layerName] || {};
                    _this._config.geojson[layerName][properties.featureId] = data;
                });

                return properties.featureId;
            },
            removeGeoJSONFeature: function(layerName, featureId) {
                if (this._config.geojson[layerName] && this._config.geojson[layerName][featureId]) {
                    var _this = this;
                    _this.enqueueRequest('mapbox-' + this._id + '::remove-geojson-feature', this._config.geojson[layerName][featureId], function () {
                        delete _this._config.geojson[layerName][featureId];
                    });
                }
            },
            removeGeoJSONLayer: function(layerNames) {
                if ((layerNames instanceof Array) === false) layerNames = [layerNames];

                var _this = this;

                angular.forEach(layerNames, function(layerName) {
                    if (_this._config.geojson[layerName]) {
                        angular.forEach(_this._config.geojson[layerName], function(childLayer, childName) {
                            _this.enqueueRequest('mapbox-' + _this._id + '::remove-layer', childName, function () {
                                delete _this._config.leafletLayers[childName];
                                delete _this._config.geojson[layerName][childName];
                            });
                        });

                        _this.enqueueRequest('mapbox-' + _this._id + '::remove-geojson-layer', layerName, function () {
                            delete _this._config.leafletLayers[layerName];
                            delete _this._config.geojson[layerName];
                        });
                    }
                });
            },
            removeGeoJSON: function() {
                var _this = this;

                angular.forEach(_this._config.geojson, function(layer, name) {
                    angular.forEach(layer, function(childLayer, childName) {
                        _this.enqueueRequest('mapbox-' + _this._id + '::remove-layer', childName, function () {
                            delete _this._config.leafletLayers[childName];
                            delete _this._config.geojson[name][childName];
                        });
                    });

                    _this.enqueueRequest('mapbox-' + _this._id + '::remove-geojson-layer', name, function () {
                        delete _this._config.leafletLayers[name];
                        delete _this._config.geojson[name];
                    });
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
                this.enqueueRequest('mapbox-' + this._id + '::define-service-area-off');
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
sdkInterfaceMapApp.directive('mapbox', ['$rootScope', '$http', '$log', '$timeout', 'configuration', 'mapboxService', 'geoJSONHelper', 'mapStyleHelper', 'objectId', 'underscore', function ($rootScope, $http, $log, $timeout, configuration, mapboxService, geoJSONHelper, mapStyleHelper, objectId, underscore) {
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

        L.mapbox.accessToken = options.accessToken;

        _this._map = L.map(_this._id, options).setView(view.coordinates, view.zoom);

        _this._map.whenReady(function () {
            _this.broadcast('mapbox-' + _this._mapboxServiceInstance.getId() + '::ready', _this._map);
        });

        _this._map.on('baselayerchange', function (event) {
            _this._layerControls.baseTile = event.name;
        });

        _this._editableFeature = L.featureGroup();
        _this._editableFeature.addTo(_this._map);

        _this.setEventHandlers(_this._mapboxServiceInstance.getEventHandlers());
        _this.addControls(_this._mapboxServiceInstance.getControls());
        _this.setBounds(_this._mapboxServiceInstance.getBounds());
        _this.resetLayers(_this._mapboxServiceInstance.getLayers());
        _this.resetGeoJSON(_this._mapboxServiceInstance.getGeoJSON());
        _this.resetLayerControls(_this._mapboxServiceInstance.getBaseTile(), _this._mapboxServiceInstance.getBaseLayers(), _this._mapboxServiceInstance.getOverlays());

        _this._map.on('draw:drawstart', _this.onDrawStart, _this);
        _this._map.on('draw:editstart', _this.onEditStart, _this);
        _this._map.on('draw:deletestart', _this.onDrawStart, _this);
        _this._map.on('draw:drawstop', _this.onDrawStop, _this);
        _this._map.on('draw:editstop', _this.onEditStop, _this);
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

        scope.$on('mapbox-' + id + '::show-controls', function (event, args) {
            _this.showControls(args);
        });

        scope.$on('mapbox-' + id + '::hide-controls', function (event, args) {
            _this.hideControls(args);
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

        scope.$on('mapbox-' + id + '::pan-to', function (event, args) {
            _this.panTo(args);
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
        if (this._map) {
            for (var layer in this._map._layers) {
                if (this._map._layers.hasOwnProperty(layer)) {
                    this._map.removeLayer(this._map._layers[layer]);
                }
            }

            this._map.remove();
            this._map = null;
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
    Mapbox.prototype.setBaseTile = function (baseTile) {
        var _this = this,
            _hasBaseTile = false;

        if (_this._layerControls.baseTile !== baseTile) {
            angular.forEach(_this._layerControls.baseLayers, function (baselayer, name) {
                if (_this._map.hasLayer(baselayer.layer)) {
                    _this._map.removeLayer(baselayer.layer);
                }
                if (name === baseTile) {
                    _hasBaseTile = true;
                }
            });

            if (_hasBaseTile) {
                _this._layerControls.baseTile = baseTile;
            }

            angular.forEach(_this._layerControls.baseLayers, function (baselayer, name) {
                if (name === _this._layerControls.baseTile) {
                    _this._map.addLayer(baselayer.layer);
                }
            });
        }
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
            if (baselayer.type === 'mapbox') {
                baselayer.layer = L.mapbox.tileLayer(baselayer.template, baselayer.options);
            } else if (typeof L[baselayer.type] === 'function') {
                baselayer.layer = L[baselayer.type](baselayer.template, baselayer.options);
            }

            if (baselayer.layer) {
                if (name === this._layerControls.baseTile || show) {
                    baselayer.layer.addTo(this._map);
                }

                this._layerControls.baseLayers[name] = baselayer;
                this._layerControls.control.addBaseLayer(baselayer.layer, name);
            }
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

    Mapbox.prototype.showControls = function () {
        var _this = this;

        if (_this._layerControls.control) {
            _this._map.addControl(_this._layerControls.control);
        }

        angular.forEach(_this._controls, function (control, key) {
            control.addTo(_this._map);
            delete _this._controls[key];
        });
    };

    Mapbox.prototype.hideControls = function () {
        var _this = this;

        if (_this._layerControls.control) {
            _this._layerControls.control.remove();
        }

        angular.forEach(_this._map.options, function (option, key) {
            if (option === true && _this._map[key] && typeof _this._map[key].disable == 'function') {
                _this._controls[key] = _this._map[key];
                _this._map[key].remove();
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

    Mapbox.prototype.panTo = function (pan) {
        if (this._map && pan.coordinates) {
            this._map.panTo(pan.coordinates, pan.options);
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
        var layer = this._mapboxServiceInstance.getLayer(name),
            added = false;

        if (layer) {
            added = (this._layers[name] == undefined);
            this._layers[name] = layer;
            this._map.addLayer(layer);
        }

        return added;
    };

    Mapbox.prototype.addLayerToLayer = function (name, layer, toLayerName) {
        var toLayer = this._layers[toLayerName];
        
        if (toLayer) {
            if (this._layers[name]) {
                toLayer.removeLayer(layer);
            }

            this._layers[name] = layer;
            toLayer.addLayer(layer);

            return true;
        }

        return false;
    };

    Mapbox.prototype.removeLayer = function (name) {
        var layer = this._layers[name],
            removed = false;

        if (layer) {
            removed = (this._layers[name] != undefined);
            this.removeOverlay(name);
            this._map.removeLayer(layer);

            delete this._layers[name];
        }

        return removed;
    };

    Mapbox.prototype.removeLayerFromLayer = function (name, fromLayerName) {
        var fromLayer = this._layers[fromLayerName],
            layer = this._layers[name],
            removed = false;

        if (fromLayer && layer) {
            removed = (this._layers[name] != undefined);
            fromLayer.removeLayer(layer);

            delete this._layers[name];
        }

        return removed;
    };

    Mapbox.prototype.showLayer = function (name) {
        var layer = this._layers[name];

        if (layer && this._map.hasLayer(layer) == false) {
            this._map.addLayer(layer);

            if (layer.eachLayer) {
                layer.eachLayer(function (item) {
                    if (item.bindTooltip && item.feature && item.feature.properties && item.feature.properties.label) {
                        item.bindTooltip(item.feature.properties.label.message, item.feature.properties.label.options);
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

            var label = new L.Tooltip(labelData.options);
            label.setContent(labelData.message);
            label.setLatLng(geojson.getCenter());

            if (labelData.options.permanent == true) {
                label.addTo(_this._map);

                layer.on('add', function () {
                    label.addTo(_this._map);
                });
                layer.on('remove', function () {
                    _this._map.removeLayer(label);
                });
            } else {
                layer.on('mouseover', function () {
                    label.addTo(_this._map);
                });
                layer.on('mouseout', function () {
                    _this._map.removeLayer(label);
                });
            }
        }
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
                var marker;
                // add points as circles
                if(geojsonOptions.radius) {
                    marker = L.circleMarker(latlng, geojsonOptions);
                }
                // add points as markers
                else {
                    marker = L.marker(latlng, geojsonOptions);
                }

                if (geojsonOptions.label) {
                    marker.bindPopup(geojsonOptions.label.message, geojsonOptions.label.options);
                }

                return marker;
            },
            onEachFeature: function(feature, layer) {
                var added = _this.addLayerToLayer(feature.properties.featureId, layer, item.layerName);
                _this.addLabel(geojsonOptions.label, feature, layer);

                if (added && typeof item.handler === 'function') {
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

    Mapbox.prototype.resetEditable = function () {
        var _this = this;

        if (_this._editableFeature) {
            _this._editableFeature.eachLayer(function(layer) {
                _this._editableFeature.removeLayer(layer);

                if (_this._layers[_this._editableLayer]) {
                    _this._layers[_this._editableLayer].addLayer(layer);
                }
            });

            _this._editableFeature = L.featureGroup();
            _this._editableFeature.addTo(_this._map);
        }
    };

    Mapbox.prototype.setDrawControls = function (controls, controlOptions) {
        this._draw.controlOptions = controlOptions || this._draw.controlOptions || {};
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

            this._draw.controls.editor = new L.Control.Draw({
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
            this._map.removeControl(this._draw.controls.editor);
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

            if(this._draw.controls.editor) {
                this._draw.controls.editor = new L.Control.Draw({
                    draw: false,
                    edit: {
                        featureGroup: this._editableFeature,
                        remove: (this._draw.controlOptions.nodelete != true)
                    }
                });

                this._map.addControl(this._draw.controls.editor);
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
            $http.get(host + 'api/geo/portion' + params)
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
            $http.get(host + 'api/geo/portion' + params)
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
            $http.get(host + 'api/geo/district' + params)
                .success(function (district) {
                    if(!_this._mapboxServiceInstance.getGeoJSONFeature(_this._editableLayer, district.sgKey)) {
                        var districtOptions = mapStyleHelper.getStyle('background', 'district');
                        _this._mapboxServiceInstance.removeGeoJSONLayer(_this._editableLayer);
                        _this._mapboxServiceInstance.addGeoJSON(_this._editableLayer, district.position, districtOptions, {featureId: district.sgKey});

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
            $http.get(host + 'api/geo/district' + params)
                .success(function (district) {
                    if(!_this._mapboxServiceInstance.getGeoJSONFeature(_this._editableLayer, district.sgKey)) {
                        var districtOptions = mapStyleHelper.getStyle('background', 'district');
                        _this._mapboxServiceInstance.addGeoJSON(_this._editableLayer, district.position, districtOptions, {featureId: district.sgKey, districtName: district.name});

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
            $http.get(host + 'api/geo/field' + params)
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
            $http.get(host + 'api/geo/field' + params)
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

        var _getCoordinates = function (latlngs, geojson) {
            var polygonCoordinates = [];

            angular.forEach(latlngs, function(latlng) {
                polygonCoordinates.push([latlng.lng, latlng.lat]);
            });

            // Add a closing coordinate if there is not a matching starting one
            if (polygonCoordinates.length > 0 && polygonCoordinates[0] != polygonCoordinates[polygonCoordinates.length - 1]) {
                polygonCoordinates.push(polygonCoordinates[0]);
            }

            // Add area
            if (geojson.properties.area !== undefined) {
                var geodesicArea = L.GeometryUtil.geodesicArea(latlngs);
                var yards = (geodesicArea * 1.19599);

                geojson.properties.area.m_sq += geodesicArea;
                geojson.properties.area.ha += (geodesicArea * 0.0001);
                geojson.properties.area.mi_sq += (yards / 3097600);
                geojson.properties.area.acres += (yards / 4840);
                geojson.properties.area.yd_sq += yards;
            }

            return polygonCoordinates;
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
                    coordinates: []
                };

                geojson.properties.area = {
                    m_sq: 0,
                    ha: 0,
                    mi_sq: 0,
                    acres: 0,
                    yd_sq: 0
                };

                angular.forEach(e.layer._latlngs, function (latlngs) {
                    geojson.geometry.coordinates.push(_getCoordinates(latlngs, geojson));
                });

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

        this._editing = false;

        if (this._draw.addLayer) {
            this._mapboxServiceInstance.addGeoJSON(this._editableLayer, geojson, this._optionSchema, geojson.properties);
            this.makeEditable(this._editableLayer);
            this.updateDrawControls();
        }
    };

    Mapbox.prototype.onEditStart = function (e) {
        this._editing = true;

        this.broadcast('mapbox-' + this._mapboxServiceInstance.getId() + '::geometry-editing', this._editing);
    };

    Mapbox.prototype.onEditStop = function (e) {
        this._editing = false;
        this.resetEditable();
        this.makeEditable(this._editableLayer);
        this.updateDrawControls();

        this.broadcast('mapbox-' + this._mapboxServiceInstance.getId() + '::geometry-editing', this._editing);
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

            var _getCoordinates = function (latlngs, geojson) {
                var polygonCoordinates = [];

                angular.forEach(latlngs, function(latlng) {
                    polygonCoordinates.push([latlng.lng, latlng.lat]);
                });

                // Add a closing coordinate if there is not a matching starting one
                if (polygonCoordinates.length > 0 && polygonCoordinates[0] != polygonCoordinates[polygonCoordinates.length - 1]) {
                    polygonCoordinates.push(polygonCoordinates[0]);
                }

                // Add area
                if (geojson.properties.area !== undefined) {
                    var geodesicArea = L.GeometryUtil.geodesicArea(latlngs);
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
                    geojson.geometry.coordinates = [];

                    angular.forEach(layer._latlngs, function (latlngs) {
                        geojson.geometry.coordinates.push(_getCoordinates(latlngs, geojson));
                    });

                    if (geojson.geometry.coordinates.length > 1) {
                        geojson.geometry.type = 'MultiPolygon';
                        geojson.geometry.coordinates = [geojson.geometry.coordinates];
                    }

                    $rootScope.$broadcast('mapbox-' + _this._mapboxServiceInstance.getId() + '::geometry-edited', geojson);
                    break;
                case 'MultiPolygon':
                    geojson.geometry.coordinates = [];

                    angular.forEach(layer._latlngs, function (latlngs, index) {
                        geojson.geometry.coordinates.push([]);
                        angular.forEach(latlngs, function (latlngs) {
                            geojson.geometry.coordinates[index].push(_getCoordinates(latlngs, geojson));
                        });
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
    var _positions = {
        topleft: '.leaflet-top.leaflet-left',
        topright: '.leaflet-top.leaflet-right',
        bottomleft: '.leaflet-bottom.leaflet-left',
        bottomright: '.leaflet-bottom.leaflet-right'
    };

    function addListeners(scope, element) {
        var parent = element.parent();

        $rootScope.$on('mapbox-' + parent.attr('id') + '::init', function (event, map) {
            element.on('click', function (e) {
                if (e.originalEvent) {
                    e.originalEvent._stopped = true;
                    e.originalEvent.preventDefault();
                    e.originalEvent.stopPropagation();
                }
            });

            element.on('mouseover', function () {
                map.dragging.disable();
            });

            element.on('mouseout', function () {
                map.dragging.enable();
            });

            parent.find('.leaflet-control-container ' + _positions[scope.position]).prepend(element);

            scope.hidden = false;
        });
    }

    return {
        restrict: 'E',
        require: '^mapbox',
        replace: true,
        transclude: true,
        scope: {
            position: '@'
        },
        template: '<div class="leaflet-control"><div class="leaflet-bar" ng-hide="hidden" ng-transclude></div></div>',
        link: function (scope, element, attrs) {
            scope.hidden = true;
        },
        controller: function($scope, $element) {
            addListeners($scope, $element);
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

        var _revokeApp = function (app) {
            var group = underscore.findWhere(_groupedApps, {title: app.group});

            if (group !== undefined) {
                group.items = underscore.reject(group.items, function (item) {
                    return item.id === app.id;
                });

                if (group.items.length === 0) {
                    _groupedApps = underscore.reject(_groupedApps, function (item) {
                        return item.title === group.title;
                    });
                }

                $rootScope.$broadcast('navigation::items__changed', _groupedApps);
                $rootScope.$broadcast('navigation::app__revoked', app);
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
            getApp: function (id) {
                return underscore.findWhere(_registeredApps, {id: id});
            },
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
            revokeApp: function (appName) {
                if (_registeredApps[appName]) {
                    _revokeApp(_registeredApps[appName]);
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

sdkInterfaceUiApp.directive('busy', [function() {
    return {
        restrict: 'A',
        template: '<button ng-click="onClick($event)" ng-disabled="disabled() || isBusy" ng-class="getBusyClass()">\n    <span ng-if="isBusy">\n        <span class="spinner"><i ng-show="icon" ng-class="icon"></i></span> {{ text }}\n    </span>\n    <span ng-if="!isBusy" ng-transclude></span>\n</button>',
        replace: true,
        transclude: true,
        scope: {
            busy: '&',
            busyIcon: '@',
            busyText: '@',
            busyClass: '@',
            busyDisabled: '&'
        },
        link: function(scope, element, attrs) {
            scope.isBusy = false;
            scope.icon = scope.busyIcon || 'glyphicon glyphicon-refresh';
            scope.text = (attrs.busyText !== undefined ? scope.busyText : 'Saving');
            scope.disabled = scope.busyDisabled || function () {
                return false;
            };

            scope.getBusyClass = function () {
                return (scope.isBusy && scope.icon ? 'has-spinner active' : '') + (scope.isBusy && scope.busyClass ? ' ' + scope.busyClass : '');
            };

            scope.onClick = function (event) {
                var pendingRequests = 0;
                var promise = scope.busy();

                event.preventDefault();
                event.stopPropagation();

                scope.isBusy = true;

                if (typeof promise === 'object' && typeof promise.finally === 'function') {
                    promise.finally(function () {
                        scope.isBusy = false;
                    });
                } else {
                    var deregister = scope.$on('http-intercepted', function (event, args) {
                        pendingRequests = (args == 'request' ? pendingRequests + 1 : pendingRequests - 1);
                        if (scope.isBusy && pendingRequests == 0) {
                            deregister();
                            scope.isBusy = false;
                        }
                    });
                }
            };
        }
    }
}]);

sdkInterfaceUiApp.directive('dynamicName', function() {
    return {
        restrict: 'A',
        require: '?form',
        link: function(scope, element, attrs, controller) {
            var formCtrl = (controller != null) ? controller :  element.parent().controller('form');
            var currentElementCtrl = formCtrl[element.attr('name')];

            if (formCtrl && currentElementCtrl) {
                element.attr('name', attrs.name);
                formCtrl.$removeControl(currentElementCtrl);
                currentElementCtrl.$name = attrs.name;
                formCtrl.$addControl(currentElementCtrl);
            }
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
    return function (value, abs) {
        var geometry = value && value.geometry || value,
            coords = (geometry && geometry.coordinates ? {lng: geometry.coordinates[0], lat: geometry.coordinates[1]} : geometry);

        return ((coords ? ($filter('number')(abs ? Math.abs(coords.lat) : coords.lng, 3) + (abs ? '° ' + (coords.lat >= 0 ? 'N' : 'S') : '') + ', '
        + $filter('number')(abs ? Math.abs(coords.lng) : coords.lat, 3) + (abs ? '° ' + (coords.lng <= 0 ? 'W' : 'E') : '')) : '')
        + (value && value.properties && value.properties.accuracy ? ' at ' + $filter('number')(value.properties.accuracy, 2) + 'm' : ''));
    };
}]);

sdkInterfaceUiApp.filter('floor', ['$filter', function ($filter) {
    return function (value) {
        return $filter('number')(Math.floor(value), 0);
    };
}]);

sdkInterfaceUiApp.filter('htmlEncode', [function () {
    return function (text) {
        return (text || '').replace(/[\u00A0-\u9999<>&'"]/gim, function (i) {
            return '&#' + i.charCodeAt(0) + ';';
        });
    }
}]);

sdkInterfaceUiApp.filter('newlines', ['$filter', '$sce', function ($filter, $sce) {
    return function(msg, isXHTML) {
        return $sce.trustAsHtml($filter('htmlEncode')(msg).replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1'+ (isXHTML === undefined || isXHTML ? '<br />' : '<br>') +'$2'));
    }
}]);

sdkInterfaceUiApp.filter('unsafe', ['$sce', function ($sce) {
    return function (input) {
        return $sce.trustAsHtml(input);
    }
}]);

sdkInterfaceUiApp.directive('locationFormatter', ['$filter', function ($filter) {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function (scope, element, attrs, ngModel) {
            ngModel.$formatters.push(function (value) {
                var viewValue = '';
                if (value !== undefined) {
                    viewValue = $filter('location')(value, (attrs.locationFormatter === 'true'));

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
                var isNan = isNaN(value) || isNaN(parseFloat(value));

                ngModel.$setValidity('number', isNan === false);

                if (isNan === false) {
                    var float = parseFloat(value);

                    ngModel.$setValidity('range', (_min === false || float >= _min) && (_max === false || float <= _max));
                    return float;
                } else {
                    return undefined;
                }
            });
        }
    };
}]);

sdkInterfaceUiApp.directive('inputDate', ['moment', function (moment) {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function (scope, element, attrs, ngModel) {
            var format = attrs.dateFormat || 'YYYY-MM-DD';

            ngModel.$formatters.length = 0;
            ngModel.$parsers.length = 0;

            ngModel.$formatters.push(function (modelValue) {
                if (modelValue) {
                    return moment(modelValue).format(format);
                } else {
                    return modelValue;
                }
            });

            ngModel.$parsers.push(function (value) {
                if (value) {
                    var date = (typeof value == 'string' ? moment(value, ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'], true) : moment(value));

                    if (date && typeof date.isValid == 'function' && date.isValid()) {
                        ngModel.$setValidity('date-format', true);
                        return (typeof value == 'string' ? date.format('YYYY-MM-DD') : date);
                    } else {
                        ngModel.$setValidity('date-format', false);
                        return value;
                    }
                }
            });
        }
    };
}]);

sdkInterfaceUiApp.directive('sparkline', ['$window', 'underscore', function ($window, underscore) {
    return {
        restrict: 'A',
        template: '<div class="sparkline"></div>',
        replace: true,
        scope: {
            sparkline: '=',
            sparklineText: '='
        },
        link: function ($scope, $element, $attrs) {
            var d3 = $window.d3,
                element = $element[0],
                width = $attrs.width || element.clientWidth,
                xExtent = $attrs.xExtent,
                height = $attrs.height || element.clientHeight,
                yExtent = $attrs.yExtent || 100,
                interpolate = $attrs.interpolate || 'step-before',
                svg = d3.select(element).append('svg').attr('width', width).attr('height', height),
                text = svg.append('text').attr('class', 'sparkline-text').attr('x', width / 2).attr('y', (height / 2) + 5),
                area = svg.append('path').attr('class', 'sparkline-area'),
                line = svg.append('path').attr('class', 'sparkline-line');

            var xFn = d3.scale.linear().range([0, width]),
                yFn = d3.scale.linear().range([height, 0]);

            var areaFn = d3.svg.area()
                .interpolate(interpolate)
                .x(getDimension(xFn, 'x'))
                .y0(height)
                .y1(getDimension(yFn, 'y'));

            var lineFn = d3.svg.line()
                .interpolate(interpolate)
                .x(getDimension(xFn, 'x'))
                .y(getDimension(yFn, 'y'));

            $scope.$watchCollection('sparkline', function () {
                renderChart();
            });

            $scope.$watch('sparklineText', function () {
                text.text(function () {
                    return $scope.sparklineText;
                });
            });

            function getDimension (fn, field) {
                return function (d) {
                    return fn(d[field]);
                }
            }

            function renderChart () {
                $scope.data = underscore.map($scope.sparkline, function (data) {
                    return (underscore.isArray(data) ? {
                        x: (underscore.isNumber(data[0]) ? data[0] : 0),
                        y: (underscore.isNumber(data[1]) ? data[1] : 0)
                    } : {
                        x: (underscore.isNumber(data.x) ? data.x : 0),
                        y: (underscore.isNumber(data.y) ? data.y : 0)
                    });
                });

                // Pad first element
                $scope.data.unshift({x: -1, y: underscore.first($scope.data).y});

                xFn.domain(xExtent && xExtent != 0 ? [0, xExtent] : d3.extent($scope.data, function (d) {
                    return d.x;
                }));

                yFn.domain(yExtent && yExtent != 0 ? [0, yExtent] : [0, d3.max($scope.data, function (d) {
                    return d.y;
                })]);

                area.attr('d', areaFn($scope.data));
                line.attr('d', lineFn($scope.data));
            }
        }
    }
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

angular.module('ag.sdk.model.base', ['ag.sdk.library', 'ag.sdk.model.validation', 'ag.sdk.model.errors', 'ag.sdk.model.store'])
    .factory('Model', ['Base', function (Base) {
        var Model = {};
        Model.Base = Base;
        return Model;
    }])
    .factory('Base', ['Errorable', 'privateProperty', 'Storable', 'underscore', 'Validatable', function (Errorable, privateProperty, Storable, underscore, Validatable) {
        function Base () {
            var _constructor = this;
            var _prototype = _constructor.prototype;

            _constructor.new = function (attrs, options) {
                var inst = new _constructor(attrs, options);

                if (typeof inst.storable == 'function') {
                    inst.storable(attrs);
                }

                return inst;
            };

            _constructor.newCopy = function (attrs, options) {
                return _constructor.new(JSON.parse(JSON.stringify(attrs)), options);
            };

            _constructor.asJSON = function (omit) {
                return underscore.omit(JSON.parse(JSON.stringify(this)), underscore.union(['$id', '$uri', '$complete', '$offline', '$dirty', '$local', '$saved'], omit || []));
            };

            _constructor.copy = function () {
                var original = this,
                    copy = {},
                    propertyNames = Object.getOwnPropertyNames(original);

                underscore.each(propertyNames, function (propertyName) {
                    Object.defineProperty(copy, propertyName, Object.getOwnPropertyDescriptor(original, propertyName));
                });

                return copy;
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
            _constructor.extend(Storable);
            _constructor.include(Validatable);
            _constructor.include(Errorable);
            _constructor.include(Storable);
        }

        privateProperty(Base, 'initializeArray', function (length, defaultValue) {
            return underscore.range(length).map(function () {
                return defaultValue || 0;
            });
        });

        privateProperty(Base, 'initializeObject', function (object, property, defaultValue) {
            object[property] = (object[property] && Object.prototype.toString.call(object[property]) == Object.prototype.toString.call(defaultValue))
                ? object[property]
                : defaultValue;
        });

        return Base;
    }])
    .factory('computedProperty', ['underscore', function (underscore) {
        return function (object, name, value, config) {
            Object.defineProperty(object, name, underscore.defaults(config || {}, {
                get: value
            }));
        }
    }])
    .factory('readOnlyProperty', ['underscore', function (underscore) {
        return function (object, name, value, config) {
            Object.defineProperty(object, name, underscore.defaults(config || {}, {
                writable: false,
                value: value
            }));
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
    .factory('privateProperty', ['underscore', function (underscore) {
        return function (object, name, value, config) {
            var val;

            Object.defineProperty(object, name, underscore.defaults(config || {}, {
                enumerable: false,
                configurable: false,
                get: function () {
                    return val;
                },
                set: function (newVal) {
                    val = newVal;
                }
            }));

            if (value !== undefined) {
                object[name] = value;
            }
        }
    }])
    .factory('interfaceProperty', ['underscore', function (underscore) {
        return function (object, name, value, config) {
            var val;

            Object.defineProperty(object, name, underscore.defaults(config || {}, {
                enumerable: false,
                configurable: true,
                get: function () {
                    return val;
                },
                set: function (newVal) {
                    val = newVal;
                }
            }));

            if (value !== undefined) {
                object[name] = value;
            }
        }
    }]);
var sdkModelComparableSale = angular.module('ag.sdk.model.comparable-sale', ['ag.sdk.library', 'ag.sdk.model.base']);

sdkModelComparableSale.factory('ComparableSale', ['computedProperty', 'Field', 'inheritModel', 'Model', 'naturalSort', 'privateProperty', 'readOnlyProperty', 'safeMath', 'underscore',
    function (computedProperty, Field, inheritModel, Model, naturalSort, privateProperty, readOnlyProperty, safeMath, underscore) {
        function ComparableSale (attrs) {
            Model.Base.apply(this, arguments);

            computedProperty(this, 'distanceInKm', function () {
                return (this.distance ? safeMath.dividedBy(this.distance, 1000.0) : '-');
            });

            computedProperty(this, 'improvedRatePerHa', function () {
                return safeMath.dividedBy(this.purchasePrice, this.area);
            }, {enumerable: true});

            computedProperty(this, 'vacantLandValue', function () {
                return safeMath.dividedBy(this.valueMinusImprovements, this.area);
            }, {enumerable: true});

            computedProperty(this, 'valueMinusImprovements', function () {
                return safeMath.minus(this.purchasePrice,  this.depImpValue);
            }, {enumerable: true});

            computedProperty(this, 'farmName', function () {
                return underscore.chain(this.portions)
                    .groupBy('farmLabel')
                    .map(function (portions, farmName) {
                        var portionSentence = underscore.chain(portions)
                            .sortBy('portionLabel')
                            .pluck('portionLabel')
                            .map(function (portionLabel) {
                                return (s.include(portionLabel, '/') ? s.strLeftBack(portionLabel, '/') : '');
                            })
                            .toSentence()
                            .value();

                        return ((portionSentence.length ? (s.startsWith(portionSentence, 'RE') ? '' : 'Ptn ') + portionSentence + ' of the ' : 'The ') + (farmName ? (underscore.startsWith(farmName.toLowerCase(), 'farm') ? '' : 'farm ') + farmName : ''));
                    })
                    .toSentence()
                    .value();
            }, {enumerable: true});


            computedProperty(this, 'totalLandComponentArea', function () {
                return underscore.reduce(this.landComponents, function(total, landComponent) {
                    return safeMath.plus(total, landComponent.area);
                }, 0);
            });

            computedProperty(this, 'totalLandComponentValue', function () {
                return underscore.reduce(this.landComponents, function(total, landComponent) {
                    return safeMath.plus(total, landComponent.assetValue);
                }, 0);
            });

            /**
             * Attachment Handling
             */
            privateProperty(this, 'addAttachment', function (attachment) {
                this.removeAttachment(attachment);

                this.attachments.push(attachment);
            });

            privateProperty(this, 'removeAttachment', function (attachment) {
                this.attachments = underscore.reject(this.attachments, function (item) {
                    return item.key === attachment.key;
                });
            });

            privateProperty(this, 'removeNewAttachments', function () {
                var attachments = this.attachments;

                this.attachments = underscore.reject(attachments, function (attachment) {
                    return underscore.isObject(attachment.archive);
                });

                return underscore.difference(attachments, this.attachments);
            });

            /**
             * Land Component Handling
             */
            privateProperty(this, 'addLandComponent', function (type) {
                this.landComponents.push({
                    type: type,
                    assetValue: 0
                });
            });

            privateProperty(this, 'removeLandComponent', function (landComponent) {
                this.landComponents = underscore.without(this.landComponents, landComponent);
            });

            /**
             * Portion Handling
             */
            privateProperty(this, 'addPortion', function (portion) {
                if (!this.hasPortion(portion)) {
                    this.portions.push(portion);

                    underscore.each(portion.landCover || [], function (landCover) {
                        var landComponent = underscore.findWhere(this.landComponents, {type: landCover.label});

                        if (underscore.isUndefined(landComponent)) {
                            landComponent = {
                                type: landCover.label,
                                assetValue: 0
                            };

                            this.landComponents.push(landComponent);
                        }

                        landComponent.area = safeMath.plus(landComponent.area, landCover.area, 3);

                        if (landComponent.unitValue) {
                            landComponent.assetValue = safeMath.times(landComponent.area, landComponent.unitValue);
                        }
                    }, this);
                }

                recalculateArea(this);
            });

            privateProperty(this, 'hasPortion', function (portion) {
                return underscore.some(this.portions, function (storedPortion) {
                    return storedPortion.sgKey === portion.sgKey;
                });
            });

            privateProperty(this, 'removePortionBySgKey', function (sgKey) {
                this.portions = underscore.reject(this.portions, function (portion) {
                    return (portion.sgKey === sgKey);
                });
                recalculateArea(this);
            });

            /**
             * Edit Authorisation
             */
            privateProperty(this, 'isEditable', function (user) {
                return (user && this.authorData && user.username === this.authorData.username && user.company === this.authorData.company);
            });

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.id = attrs.id || attrs.$id;
            this.uuid = attrs.uuid;
            this.area = attrs.area;
            this.attachments = attrs.attachments || [];
            this.authorData = attrs.authorData;
            this.centroid = attrs.centroid;
            this.comments = attrs.comments;
            this.createdAt = attrs.createdAt;
            this.createdBy = attrs.createdBy;
            this.depImpValue = attrs.depImpValue;
            this.distance = attrs.distance || 0;
            this.geometry = attrs.geometry;
            this.landComponents = underscore.map(attrs.landComponents || [], convertLandComponent);
            this.portions = attrs.portions || [];
            this.regions = attrs.regions || [];
            this.propertyKnowledge = attrs.propertyKnowledge;
            this.purchasedAt = attrs.purchasedAt;
            this.purchasePrice = attrs.purchasePrice || 0;
            this.useCount = attrs.useCount || 0;
        }

        function convertLandComponent (landComponent) {
            landComponent.type = convertLandComponentType(landComponent.type);

            return landComponent;
        }

        function convertLandComponentType (type) {
            switch (type) {
                case 'Cropland (Dry)':
                    return 'Cropland';
                case 'Cropland (Equipped, Irrigable)':
                case 'Cropland (Irrigable)':
                    return 'Cropland (Irrigated)';
                case 'Conservation':
                    return 'Grazing (Bush)';
                case 'Horticulture (Intensive)':
                    return 'Greenhouses';
                case 'Horticulture (Perennial)':
                    return 'Orchard';
                case 'Horticulture (Seasonal)':
                    return 'Vegetables';
                case 'Housing':
                    return 'Homestead';
                case 'Wasteland':
                    return 'Non-vegetated';
            }

            return type;
        }

        function recalculateArea (instance) {
            instance.area = safeMath.round(underscore.reduce(instance.portions, function(total, portion) {
                return safeMath.plus(total, portion.area);
            }, 0), 4);
        }

        inheritModel(ComparableSale, Model.Base);

        readOnlyProperty(ComparableSale, 'landComponentTypes', Field.landClasses);

        readOnlyProperty(ComparableSale, 'propertyKnowledgeOptions', ['The valuer has no firsthand knowledge of this property.',
            'The valuer has inspected this comparable from aerial photos, and has no firsthand knowledge of the property.',
            'The valuer has inspected/valued this comparable before, and has firsthand knowledge of the property.']);

        privateProperty(ComparableSale, 'convertLandComponentType', convertLandComponentType);

        ComparableSale.validates({
            area: {
                required: true,
                numeric: true
            },
            landComponents: {
                required: true,
                length: {
                    min: 1
                }
            },
            portions: {
                required: true,
                length: {
                    min: 1
                }
            },
            purchasePrice: {
                required: true,
                numeric: true
            }
        });

        return ComparableSale;
    }]);

var sdkModelEnterpriseBudget = angular.module('ag.sdk.model.enterprise-budget', ['ag.sdk.library', 'ag.sdk.utilities', 'ag.sdk.model.base']);

sdkModelEnterpriseBudget.factory('EnterpriseBudgetBase', ['Base', 'computedProperty', 'inheritModel', 'interfaceProperty', 'Model', 'privateProperty', 'readOnlyProperty', 'underscore',
    function (Base, computedProperty, inheritModel, interfaceProperty, Model, privateProperty, readOnlyProperty, underscore) {
        function EnterpriseBudgetBase(attrs) {
            Model.Base.apply(this, arguments);

            computedProperty(this, 'defaultCostStage', function () {
                return underscore.last(EnterpriseBudgetBase.costStages);
            });

            // Cache
            privateProperty(this, 'cache', {});

            privateProperty(this, 'getCache', function (props) {
                return this.cache[typeof props === 'string' ? props : props.join('/')];
            });

            privateProperty(this, 'setCache', function (props, value) {
                var cacheKey = (typeof props === 'string' ? props : props.join('/'));
                this.cache[cacheKey] = value;
                return this.cache[cacheKey];
            });

            privateProperty(this, 'resetCache', function (props) {
                delete this.cache[typeof props === 'string' ? props : props.join('/')];
            });

            privateProperty(this, 'clearCache', function () {
                underscore.each(underscore.keys(this.cache), function (cacheKey) {
                    delete this.cache[cacheKey];
                }, this);
            });

            // Stock
            privateProperty(this, 'stock', []);

            interfaceProperty(this, 'addStock', function (stock) {
                addStock(this, stock);
            });

            privateProperty(this, 'findStock', function (categoryName, commodityType) {
                return findStock(this, categoryName, commodityType);
            });

            interfaceProperty(this, 'replaceAllStock', function (stock) {
                replaceAllStock(this, stock);
            });

            interfaceProperty(this, 'removeStock', function (stock) {
                removeStock(this, stock);
            });

            // Sections
            privateProperty(this, 'getSections', function (sectionCode, costStage) {
                var sections = underscore.where(this.data.sections, {code: sectionCode, costStage: costStage || this.defaultCostStage});

                return (sections.length > 0 ? sections : underscore.filter(this.data.sections, function (section) {
                    return (underscore.isUndefined(sectionCode) || section.code === sectionCode) && underscore.isUndefined(section.costStage);
                }));
            });

            privateProperty(this, 'sortSections', function () {
                this.data.sections = underscore.chain(this.data.sections)
                    .sortBy('name')
                    .reverse()
                    .value();
            });

            privateProperty(this, 'hasSection', function (sectionCode, costStage) {
                return !underscore.isEmpty(this.getSections(sectionCode, costStage));
            });

            privateProperty(this, 'getSection', function (sectionCode, costStage) {
                return underscore.first(this.getSections(sectionCode, costStage));
            });

            privateProperty(this, 'getSectionTitle', function (sectionCode) {
                return (EnterpriseBudgetBase.sections[sectionCode] ? EnterpriseBudgetBase.sections[sectionCode].name : '');
            });

            privateProperty(this, 'addSection', function (sectionCode, costStage) {
                var section = this.getSection(sectionCode, costStage);

                if (underscore.isUndefined(section)) {
                    section = underscore.extend({
                        productCategoryGroups: [],
                        total: {
                            value: 0
                        }
                    }, EnterpriseBudgetBase.sections[sectionCode]);

                    if (this.assetType === 'livestock') {
                        section.total.valuePerLSU = 0;
                    }

                    if (costStage) {
                        section.costStage = costStage;
                    }

                    this.data.sections.push(section);
                    this.setCache([sectionCode, costStage], section);
                    this.sortSections();
                }

                return section;
            });

            // Groups
            privateProperty(this, 'getGroup', function (sectionCode, groupName, costStage) {
                var cacheKey = [groupName, costStage].join('/');

                return this.getCache(cacheKey) || this.setCache(cacheKey, underscore.chain(this.getSections(sectionCode, costStage))
                    .pluck('productCategoryGroups')
                    .flatten()
                    .findWhere({name: groupName})
                    .value());
            });

            privateProperty(this, 'findGroupNameByCategory', function (sectionCode, groupName, categoryCode) {
                return (groupName ? groupName : underscore.chain(this.getCategoryOptions(sectionCode))
                    .map(function (categoryGroup, categoryGroupName) {
                        return (underscore.where(categoryGroup, {code: categoryCode}).length > 0 ? categoryGroupName : undefined);
                    })
                    .compact()
                    .first()
                    .value());
            });

            privateProperty(this, 'addGroup', function (sectionCode, groupName, costStage) {
                var group = this.getGroup(sectionCode, groupName, costStage);

                if (underscore.isUndefined(group)) {
                    var section = this.addSection(sectionCode, costStage);

                    group = underscore.extend({
                        productCategories: [],
                        total: {
                            value: 0
                        }
                    }, EnterpriseBudgetBase.groups[groupName]);

                    if (this.assetType === 'livestock') {
                        group.total.valuePerLSU = 0;
                    }

                    section.productCategoryGroups.push(group);
                    this.setCache([groupName, costStage], group);
                }

                return group;
            });

            privateProperty(this, 'removeGroup', function (sectionCode, groupName, costStage) {
                var section = this.getSection(sectionCode, costStage);

                if (section) {
                    section.productCategoryGroups = underscore.reject(section.productCategoryGroups, function (group) {
                        return group.name === groupName;
                    });

                    this.resetCache([groupName, costStage]);
                }

                this.recalculate();
            });

            // Categories
            privateProperty(this, 'categoryAllowed', function (sectionCode, categoryQuery) {
                return underscore.chain(getCategoryOptions(sectionCode, this.assetType, this.baseAnimal))
                    .values()
                    .flatten()
                    .findWhere(categoryQuery)
                    .isObject()
                    .value();
            });

            privateProperty(this, 'groupAndCategoryAllowed', function (sectionCode, groupName, categoryCode) {
                var categoryOptions = getCategoryOptions(sectionCode, this.assetType, this.baseAnimal);

                return categoryOptions[groupName] && underscore.findWhere(categoryOptions[groupName], {code: categoryCode});
            });

            interfaceProperty(this, 'getCategory', function (sectionCode, categoryCode, costStage) {
                var cacheKey = [categoryCode, costStage].join('/');

                return this.getCache(cacheKey) || this.setCache(cacheKey, underscore.chain(this.getSections(sectionCode, costStage))
                    .pluck('productCategoryGroups')
                    .flatten()
                    .pluck('productCategories')
                    .flatten()
                    .findWhere({code: categoryCode})
                    .value());
            });

            interfaceProperty(this, 'getCategoryOptions', function (sectionCode) {
                return getCategoryOptions(sectionCode, this.assetType, this.baseAnimal);
            });

            interfaceProperty(this, 'getGroupCategoryOptions', function (sectionCode, groupName) {
                return getGroupCategories(sectionCode, this.assetType, this.baseAnimal, groupName);
            });

            privateProperty(this, 'getAvailableGroupCategories', function (sectionCode, groupName, costStage) {
                var group = this.getGroup(sectionCode, groupName, costStage);

                return getAvailableGroupCategories(this, sectionCode, (group ? group.productCategories : []), groupName);
            });

            privateProperty(this, 'getAvailableCategories', function (sectionCode, costStage) {
                var sectionCategories = underscore.chain(this.getSections(sectionCode, costStage))
                    .pluck('productCategoryGroups')
                    .flatten()
                    .pluck('productCategories')
                    .flatten()
                    .value();

                return getAvailableGroupCategories(this, sectionCode, sectionCategories);
            });

            interfaceProperty(this, 'addCategory', function (sectionCode, groupName, categoryCode, costStage) {
                var category = this.getCategory(sectionCode, categoryCode, costStage);

                if (underscore.isUndefined(category) && !underscore.isUndefined(categoryCode)) {
                    var group = this.addGroup(sectionCode, this.findGroupNameByCategory(sectionCode, groupName, categoryCode), costStage);

                    category = underscore.extend({
                        quantity: 0,
                        value: 0
                    }, EnterpriseBudgetBase.categories[categoryCode]);

                    // WA: Modify enterprise budget model to specify input costs as "per ha"
                    if (sectionCode === 'EXP') {
                        category.unit = 'Total'
                    }

                    category.per = (this.assetType === 'livestock' ? 'LSU' : 'ha');

                    if (this.assetType === 'livestock') {
                        var conversionRate = this.getConversionRate(category.name);

                        if (conversionRate) {
                            category.conversionRate = conversionRate;
                        }

                        category.valuePerLSU = 0;
                    }

                    group.productCategories.push(category);
                    this.setCache([categoryCode, costStage], category);
                }

                return category;
            });

            interfaceProperty(this, 'adjustCategory', function (sectionCode, categoryQuery, costStage, property) {});

            privateProperty(this, 'setCategory', function (sectionCode, groupName, category, costStage) {
                var group = this.addGroup(sectionCode, this.findGroupNameByCategory(sectionCode, groupName, category.code), costStage);

                if (group) {
                    group.productCategories = underscore.chain(group.productCategories)
                        .reject(function (groupCategory) {
                            return groupCategory.code === category.code;
                        })
                        .union([category])
                        .value();
                    this.setCache([categoryCode, costStage], category);
                }

                return category;
            });

            interfaceProperty(this, 'removeCategory', function (sectionCode, groupName, categoryCode, costStage) {
                groupName = this.findGroupNameByCategory(sectionCode, groupName, categoryCode);

                var group = this.getGroup(sectionCode, groupName, costStage);

                if (group) {
                    group.productCategories = underscore.reject(group.productCategories, function (category) {
                        return category.code === categoryCode;
                    });

                    if (group.productCategories.length === 0) {
                        this.removeGroup(sectionCode, groupName, costStage);
                    }

                    this.resetCache([categoryCode, costStage]);
                }

                this.recalculate();
            });

            privateProperty(this, 'getStockAssets', function () {
                return (this.assetType !== 'livestock' || underscore.isUndefined(conversionRate[this.baseAnimal]) ? [this.commodityType] : underscore.keys(conversionRate[this.baseAnimal]));
            });

            interfaceProperty(this, 'recalculate', function () {});

            // Livestock
            computedProperty(this, 'baseAnimal', function () {
                return baseAnimal[this.commodityType] || this.commodityType;
            });

            computedProperty(this, 'birthAnimal', function () {
                return EnterpriseBudgetBase.birthAnimals[this.baseAnimal];
            });

            privateProperty(this, 'getBaseAnimal', function () {
                return this.baseAnimal;
            });

            privateProperty(this, 'getRepresentativeAnimal', function () {
                return EnterpriseBudgetBase.representativeAnimals[this.baseAnimal];
            });

            privateProperty(this, 'getConversionRate', function(animal) {
                return conversionRate[this.baseAnimal] && (conversionRate[this.baseAnimal][animal] || conversionRate[this.baseAnimal][EnterpriseBudgetBase.representativeAnimals[this.baseAnimal]]);
            });

            privateProperty(this, 'getConversionRates', function() {
                return conversionRate[this.baseAnimal];
            });

            privateProperty(this, 'getUnitAbbreviation', function (unit) {
                return unitAbbreviations[unit] || unit;
            });

            // Properties
            this.assetType = attrs && attrs.assetType;
            this.data = (attrs && attrs.data ? attrs.data : {});
            Base.initializeObject(this.data, 'sections', []);

            this.sortSections();
        }

        inheritModel(EnterpriseBudgetBase, Model.Base);

        readOnlyProperty(EnterpriseBudgetBase, 'sections', underscore.indexBy([
            {
                code: 'EXP',
                name: 'Expenses'
            }, {
                code: 'INC',
                name: 'Income'
            }
        ], 'code'));

        readOnlyProperty(EnterpriseBudgetBase, 'groups', underscore.indexBy([
            {
                code: 'INC-CPS',
                name: 'Crop Sales'
            }, {
                code: 'INC-FRS',
                name: 'Fruit Sales'
            }, {
                code: 'EST',
                name: 'Establishment'
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
        ], 'name'));

        readOnlyProperty(EnterpriseBudgetBase, 'categories', underscore.indexBy([
            //*********** Income *********
            // livestock sales
            // Sheep
            {
                code: 'INC-LSS-SLAMB',
                name: 'Lamb',
                supplyUnit: 'hd',
                unit: 'kg'
            }, {
                code: 'INC-LSS-SWEAN',
                name: 'Weaner Lamb',
                supplyUnit: 'hd',
                unit: 'kg'
            }, {
                code: 'INC-LSS-SEWE',
                name: 'Ewe',
                supplyUnit: 'hd',
                unit: 'kg'
            }, {
                code: 'INC-LSS-SWTH',
                name: 'Wether',
                supplyUnit: 'hd',
                unit: 'kg'
            }, {
                code: 'INC-LSS-SRAM',
                name: 'Ram',
                supplyUnit: 'hd',
                unit: 'kg'
            },

            // Cattle
            {
                code: 'INC-LSS-CCALV',
                name: 'Calf',
                supplyUnit: 'hd',
                unit: 'kg'
            }, {
                code: 'INC-LSS-CWEN',
                name: 'Weaner Calf',
                supplyUnit: 'hd',
                unit: 'kg'
            }, {
                code: 'INC-LSS-CCOW',
                name: 'Cow',
                supplyUnit: 'hd',
                unit: 'kg'
            }, {
                code: 'INC-LSS-CHEI',
                name: 'Heifer',
                supplyUnit: 'hd',
                unit: 'kg'
            }, {
                code: 'INC-LSS-CST18',
                name: 'Steer',
                supplyUnit: 'hd',
                unit: 'kg'
            }, {
                code: 'INC-LSS-CST36',
                name: 'Ox',
                supplyUnit: 'hd',
                unit: 'kg'
            }, {
                code: 'INC-LSS-CBULL',
                name: 'Bull',
                supplyUnit: 'hd',
                unit: 'kg'
            },

            //Goats
            {
                code: 'INC-LSS-GKID',
                name: 'Kid',
                supplyUnit: 'hd',
                unit: 'kg'
            }, {
                code: 'INC-LSS-GWEAN',
                name: 'Weaner Kid',
                supplyUnit: 'hd',
                unit: 'kg'
            }, {
                code: 'INC-LSS-GEWE',
                name: 'Ewe',
                supplyUnit: 'hd',
                unit: 'kg'
            }, {
                code: 'INC-LSS-GCAST',
                name: 'Castrate',
                supplyUnit: 'hd',
                unit: 'kg'
            }, {
                code: 'INC-LSS-GRAM',
                name: 'Ram',
                supplyUnit: 'hd',
                unit: 'kg'
            },

            //Rabbits
            {
                code: 'INC-LSS-RKIT',
                name: 'Kit',
                supplyUnit: 'hd',
                unit: 'kg'
            }, {
                code: 'INC-LSS-RWEN',
                name: 'Weaner Kit',
                supplyUnit: 'hd',
                unit: 'kg'
            }, {
                code: 'INC-LSS-RDOE',
                name: 'Doe',
                supplyUnit: 'hd',
                unit: 'kg'
            }, {
                code: 'INC-LSS-RLAP',
                name: 'Lapin',
                supplyUnit: 'hd',
                unit: 'kg'
            }, {
                code: 'INC-LSS-RBUC',
                name: 'Buck',
                supplyUnit: 'hd',
                unit: 'kg'
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
            }, {
                code: 'INC-LSP-LFUR',
                name: 'Fur',
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
            // Establishment
            {
                code: 'EXP-EST-DRAN',
                name: 'Drainage',
                unit: 'Total'
            }, {
                code: 'EXP-EST-IRRG',
                name: 'Irrigation',
                unit: 'Total'
            }, {
                code: 'EXP-EST-LPRP',
                name: 'Land preparation',
                unit: 'Total'
            }, {
                code: 'EXP-EST-TRLL',
                name: 'Trellising',
                unit: 'Total'
            },
            // Preharvest
            {
                code: 'EXP-HVP-CONS',
                name: 'Consultants',
                unit: 'Total'
            }, {
                code: 'EXP-HVP-SEED',
                name: 'Seed',
                unit: 'kg'
            }, {
                code: 'EXP-HVP-PLTM',
                name: 'Plant Material',
                unit: 'each'
            }, {
                code: 'EXP-HVP-ELEC',
                name: 'Electricity',
                unit: 'Total'
            }, {
                code: 'EXP-HVP-FERT',
                name: 'Fertiliser',
                unit: 't'
            }, {
                code: 'EXP-HVP-FUEL',
                name: 'Fuel',
                unit: 'l'
            }, {
                code: 'EXP-HVP-FUNG',
                name: 'Fungicides',
                unit: 'Total'
            }, {
                code: 'EXP-HVP-GENL',
                name: 'General',
                unit: 'Total'
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
                code: 'EXP-HVP-PGRG',
                name: 'Plant growth regulators',
                unit: 'Total'
            }, {
                code: 'EXP-HVP-POLL',
                name: 'Pollination',
                unit: 'ha'
            }, {
                code: 'EXP-HVP-SPYA',
                name: 'Aerial spraying',
                unit: 'ha'
            }, {
                code: 'EXP-HVP-INSH',
                name: 'Hail insurance',
                unit: 't'
            }, {
                code: 'EXP-HVP-INSM',
                name: 'Yield insurance',
                unit: 't'
            }, {
                code: 'EXP-HVP-HEDG',
                name: 'Hedging cost',
                unit: 't'
            }, {
                code: 'EXP-HVP-REPP',
                name: 'Repairs & maintenance',
                unit: 'Total'
            }, {
                code: 'EXP-HVP-SLAB',
                name: 'Seasonal labour',
                unit: 'ha'
            },
            //Harvest
            {
                code: 'EXP-HVT-FUEL',
                name: 'Fuel',
                unit: 'l'
            }, {
                code: 'EXP-HVT-LABC',
                name: 'Harvest labour',
                unit: 'ha'
            }, {
                code: 'EXP-HVT-HVTT',
                name: 'Harvest transport',
                unit: 'Total'
            }, {
                code: 'EXP-HVT-HVTC',
                name: 'Harvesting cost',
                unit: 'Total'
            }, {
                code: 'EXP-HVT-REPP',
                name: 'Repairs & maintenance',
                unit: 'Total'
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
                name: 'Drying & cleaning',
                unit: 't'
            }, {
                code: 'EXP-HVT-PAKC',
                name: 'Packing cost',
                unit: 'each'
            },
            //Indirect
            {
                code: 'EXP-IDR-ODEP',
                name: 'Depreciation on orchards',
                unit: 'Total'
            }, {
                code: 'EXP-IDR-FUEL',
                name: 'Fuel',
                unit: 'l'
            }, {
                code: 'EXP-IDR-LUBR',
                name: 'Lubrication',
                unit: 'l'
            }, {
                code: 'EXP-IDR-REPP',
                name: 'Repairs & maintenance',
                unit: 'Total'
            }, {
                code: 'EXP-IDR-ELEC',
                name: 'Electricity',
                unit: 'Total'
            }, {
                code: 'EXP-IDR-INTR',
                name: 'Interest on loans',
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
                name: 'Other overheads',
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
                name: 'Weaner Lamb',
                unit: 'head'
            }, {
                code: 'EXP-RPM-SEWE',
                name: 'Ewe',
                unit: 'head'
            }, {
                code: 'EXP-RPM-SWTH',
                name: 'Wether',
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
                name: 'Weaner Calf',
                unit: 'head'
            }, {
                code: 'EXP-RPM-CCOW',
                name: 'Cow',
                unit: 'head'
            }, {
                code: 'EXP-RPM-CHEI',
                name: 'Heifer',
                unit: 'head'
            }, {
                code: 'EXP-RPM-CST18',
                name: 'Steer',
                unit: 'head'
            }, {
                code: 'EXP-RPM-CST36',
                name: 'Ox',
                unit: 'head'
            }, {
                code: 'EXP-RPM-CBULL',
                name: 'Bull',
                unit: 'head'
            },

            //Goats
            {
                code: 'EXP-RPM-GKID',
                name: 'Kid',
                unit: 'head'
            }, {
                code: 'EXP-RPM-GWEAN',
                name: 'Weaner Kid',
                unit: 'head'
            }, {
                code: 'EXP-RPM-GEWE',
                name: 'Ewe',
                unit: 'head'
            }, {
                code: 'EXP-RPM-GCAST',
                name: 'Castrate',
                unit: 'head'
            }, {
                code: 'EXP-RPM-GRAM',
                name: 'Ram',
                unit: 'head'
            },
            //Rabbits
            {
                code: 'EXP-RPM-RKIT',
                name: 'Kit',
                unit: 'head'
            }, {
                code: 'EXP-RPM-RWEN',
                name: 'Weaner Kit',
                unit: 'head'
            }, {
                code: 'EXP-RPM-RDOE',
                name: 'Doe',
                unit: 'head'
            }, {
                code: 'EXP-RPM-RLAP',
                name: 'Lapin',
                unit: 'head'
            }, {
                code: 'EXP-RPM-RBUC',
                name: 'Buck',
                unit: 'head'
            },
            //Animal feed
            {
                code: 'EXP-AMF-CROP',
                name: 'Crop',
                unit: 'kg'
            },
            {
                code: 'EXP-AMF-LICK',
                name: 'Lick',
                unit: 't'
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
                unit: 't'
            }, {
                code: 'EXP-MRK-LSPF',
                name: 'Livestock products marketing fees',
                unit: 't'
            }, {
                code: 'EXP-MRK-HOTF',
                name: 'Horticulture marketing fees',
                unit: 't'
            }, {
                code: 'EXP-MRK-CRPF',
                name: 'Crop marketing fees',
                unit: 't'
            }, {
                code: 'EXP-MRK-LSTP',
                name: 'Livestock transport',
                unit: 'head'
            }, {
                code: 'EXP-MRK-HOTT',
                name: 'Fruit transport',
                unit: 't'
            }, {
                code: 'EXP-MRK-CRPT',
                name: 'Crop transport',
                unit: 't'
            }
        ], 'code'));


        readOnlyProperty(EnterpriseBudgetBase, 'stockableCategoryCodes', [
            'INC-LSS-SLAMB',
            'INC-LSS-SWEAN',
            'INC-LSS-SEWE',
            'INC-LSS-SWTH',
            'INC-LSS-SRAM',
            'INC-LSS-CCALV',
            'INC-LSS-CWEN',
            'INC-LSS-CCOW',
            'INC-LSS-CHEI',
            'INC-LSS-CST18',
            'INC-LSS-CST36',
            'INC-LSS-CBULL',
            'INC-LSS-GKID',
            'INC-LSS-GWEAN',
            'INC-LSS-GEWE',
            'INC-LSS-GCAST',
            'INC-LSS-GRAM',
            'INC-LSS-RKIT',
            'INC-LSS-RWEN',
            'INC-LSS-RDOE',
            'INC-LSS-RLAP',
            'INC-LSS-RBUC',
            'INC-LSP-MILK',
            'INC-LSP-WOOL',
            'INC-LSP-LFUR',
            'INC-HVT-CROP',
            'INC-HVT-FRUT',
            'EXP-HVP-SEED',
            'EXP-HVP-PLTM',
            'EXP-HVP-FERT',
            'EXP-HVP-FUEL',
            'EXP-HVP-FUNG',
            'EXP-HVP-LIME',
            'EXP-HVP-HERB',
            'EXP-HVP-PEST',
            'EXP-HVP-PGRG',
            'EXP-HVT-FUEL',
            'EXP-IDR-FUEL',
            'EXP-IDR-LUBR',
            'EXP-IDR-WATR',
            'EXP-AMF-CROP',
            'EXP-AMF-LICK'
        ]);

        readOnlyProperty(EnterpriseBudgetBase, 'categoryOptions', {
            crop: {
                INC: {
                    'Crop Sales': getCategoryArray(['INC-HVT-CROP'])
                },
                EXP: {
                    'Preharvest': getCategoryArray(['EXP-HVP-FERT', 'EXP-HVP-FUNG', 'EXP-HVP-HEDG', 'EXP-HVP-HERB', 'EXP-HVP-INSH', 'EXP-HVP-INSM', 'EXP-HVP-LIME', 'EXP-HVP-PEST', 'EXP-HVP-SEED', 'EXP-HVP-SPYA']),
                    'Harvest': getCategoryArray(['EXP-HVT-LABC', 'EXP-HVT-HVTC']),
                    'Marketing': getCategoryArray(['EXP-MRK-CRPF', 'EXP-MRK-CRPT']),
                    'Indirect Costs': getCategoryArray(['EXP-IDR-FUEL', 'EXP-IDR-LUBR', 'EXP-IDR-REPP', 'EXP-IDR-ELEC', 'EXP-IDR-WATR', 'EXP-IDR-LABP', 'EXP-IDR-SCHED', 'EXP-IDR-OTHER'])
                }
            },
            horticulture: {
                INC: {
                    'Fruit Sales': getCategoryArray(['INC-HVT-FRUT'])
                },
                EXP: {
                    'Establishment': getCategoryArray(['EXP-EST-DRAN', 'EXP-EST-IRRG', 'EXP-EST-LPRP', 'EXP-EST-TRLL']),
                    'Preharvest': getCategoryArray(['EXP-HVP-CONS', 'EXP-HVP-ELEC', 'EXP-HVP-FERT', 'EXP-HVP-FUEL', 'EXP-HVP-FUNG', 'EXP-HVP-GENL', 'EXP-HVP-LIME', 'EXP-HVP-HERB', 'EXP-HVP-INSH', 'EXP-HVP-INSM', 'EXP-HVP-PEST', 'EXP-HVP-PGRG', 'EXP-HVP-PLTM', 'EXP-HVP-POLL', 'EXP-HVP-REPP', 'EXP-HVP-SLAB', 'EXP-HVP-SPYA']),
                    'Harvest': getCategoryArray(['EXP-HVT-FUEL', 'EXP-HVT-DYCL', 'EXP-HVT-LABC', 'EXP-HVT-HVTT', 'EXP-HVT-PAKC', 'EXP-HVT-PAKM', 'EXP-HVT-REPP', 'EXP-HVT-STOR']),
                    'Marketing': getCategoryArray(['EXP-MRK-HOTF', 'EXP-MRK-HOTT']),
                    'Indirect Costs': getCategoryArray(['EXP-IDR-ODEP', 'EXP-IDR-FUEL', 'EXP-IDR-LUBR', 'EXP-IDR-REPP', 'EXP-IDR-ELEC', 'EXP-IDR-WATR', 'EXP-IDR-LABP', 'EXP-IDR-SCHED', 'EXP-IDR-LICS', 'EXP-IDR-INSA', 'EXP-IDR-OTHER'])
                }
            },
            livestock: {
                Cattle: {
                    INC: {
                        'Livestock Sales': getCategoryArray(['INC-LSS-CCALV', 'INC-LSS-CWEN', 'INC-LSS-CCOW', 'INC-LSS-CHEI', 'INC-LSS-CST18', 'INC-LSS-CST36', 'INC-LSS-CBULL']),
                        'Product Sales': getCategoryArray(['INC-LSP-MILK'])
                    },
                    EXP: {
                        'Replacements': getCategoryArray(['EXP-RPM-CCALV', 'EXP-RPM-CWEN', 'EXP-RPM-CCOW', 'EXP-RPM-CHEI', 'EXP-RPM-CST18', 'EXP-RPM-CST36', 'EXP-RPM-CBULL']),
                        'Animal Feed': getCategoryArray(['EXP-AMF-CROP', 'EXP-AMF-LICK']),
                        'Husbandry': getCategoryArray(['EXP-HBD-VACC', 'EXP-HBD-DIPP', 'EXP-HBD-VETY']),
                        'Marketing': getCategoryArray(['EXP-MRK-LSSF', 'EXP-MRK-LSPF', 'EXP-MRK-LSTP']),
                        'Indirect Costs': getCategoryArray(['EXP-IDR-FUEL', 'EXP-IDR-REPP', 'EXP-IDR-ELEC', 'EXP-IDR-WATR', 'EXP-IDR-LABP', 'EXP-IDR-LICS', 'EXP-IDR-INSA', 'EXP-IDR-OTHER'])
                    }
                },
                Game: {
                    INC: {
                        'Livestock Sales': getCategoryArray(['INC-LSS-CCALV', 'INC-LSS-CWEN', 'INC-LSS-CCOW', 'INC-LSS-CHEI', 'INC-LSS-CST18', 'INC-LSS-CST36', 'INC-LSS-CBULL']),
                        'Product Sales': getCategoryArray(['INC-LSP-WOOL', 'INC-LSP-LFUR'])
                    },
                    EXP: {
                        'Replacements': getCategoryArray(['EXP-RPM-CCALV', 'EXP-RPM-CWEN', 'EXP-RPM-CCOW', 'EXP-RPM-CHEI', 'EXP-RPM-CST18', 'EXP-RPM-CST36', 'EXP-RPM-CBULL']),
                        'Animal Feed': getCategoryArray(['EXP-AMF-CROP', 'EXP-AMF-LICK']),
                        'Husbandry': getCategoryArray(['EXP-HBD-VACC', 'EXP-HBD-DIPP', 'EXP-HBD-VETY']),
                        'Marketing': getCategoryArray(['EXP-MRK-LSSF', 'EXP-MRK-LSPF', 'EXP-MRK-LSTP']),
                        'Indirect Costs': getCategoryArray(['EXP-IDR-FUEL', 'EXP-IDR-REPP', 'EXP-IDR-ELEC', 'EXP-IDR-WATR', 'EXP-IDR-LABP', 'EXP-IDR-LICS', 'EXP-IDR-INSA', 'EXP-IDR-OTHER'])
                    }
                },
                Goats: {
                    INC: {
                        'Livestock Sales': getCategoryArray(['INC-LSS-GKID', 'INC-LSS-GWEAN', 'INC-LSS-GEWE', 'INC-LSS-GCAST', 'INC-LSS-GRAM']),
                        'Product Sales': getCategoryArray(['INC-LSP-WOOL', 'INC-LSP-MILK'])
                    },
                    EXP: {
                        'Replacements': getCategoryArray(['EXP-RPM-GKID', 'EXP-RPM-GWEAN', 'EXP-RPM-GEWE', 'EXP-RPM-GCAST', 'EXP-RPM-GRAM']),
                        'Animal Feed': getCategoryArray(['EXP-AMF-CROP', 'EXP-AMF-LICK']),
                        'Husbandry': getCategoryArray(['EXP-HBD-VACC', 'EXP-HBD-DIPP', 'EXP-HBD-VETY', 'EXP-HBD-SHER', 'EXP-HBD-CRCH']),
                        'Marketing': getCategoryArray(['EXP-MRK-LSSF', 'EXP-MRK-LSPF', 'EXP-MRK-LSTP']),
                        'Indirect Costs': getCategoryArray(['EXP-IDR-FUEL', 'EXP-IDR-REPP', 'EXP-IDR-ELEC', 'EXP-IDR-WATR', 'EXP-IDR-LABP', 'EXP-IDR-LICS', 'EXP-IDR-INSA', 'EXP-IDR-OTHER'])
                    }
                },
                Rabbits: {
                    INC: {
                        'Livestock Sales': getCategoryArray(['INC-LSS-RKIT', 'INC-LSS-RWEN', 'INC-LSS-RDOE', 'INC-LSS-RLUP', 'INC-LSS-RBUC']),
                        'Product Sales': getCategoryArray(['INC-LSP-WOOL', 'INC-LSP-LFUR'])
                    },
                    EXP: {
                        'Replacements': getCategoryArray(['EXP-RPM-RKIT', 'EXP-RPM-RWEN', 'EXP-RPM-RDOE', 'EXP-RPM-RLUP', 'EXP-RPM-RBUC']),
                        'Husbandry': getCategoryArray(['EXP-HBD-VACC', 'EXP-HBD-DIPP', 'EXP-HBD-VETY', 'EXP-HBD-SHER', 'EXP-HBD-CRCH']),
                        'Marketing': getCategoryArray(['EXP-MRK-LSSF', 'EXP-MRK-LSPF', 'EXP-MRK-LSTP']),
                        'Indirect Costs': getCategoryArray(['EXP-IDR-FUEL', 'EXP-IDR-REPP', 'EXP-IDR-ELEC', 'EXP-IDR-WATR', 'EXP-IDR-LABP', 'EXP-IDR-LICS', 'EXP-IDR-INSA', 'EXP-IDR-OTHER'])
                    }
                },
                Sheep: {
                    INC: {
                        'Livestock Sales': getCategoryArray(['INC-LSS-SLAMB', 'INC-LSS-SWEAN', 'INC-LSS-SEWE', 'INC-LSS-SWTH', 'INC-LSS-SRAM']),
                        'Product Sales': getCategoryArray(['INC-LSP-WOOL', 'INC-LSP-MILK'])
                    },
                    EXP: {
                        'Replacements': getCategoryArray(['EXP-RPM-SLAMB', 'EXP-RPM-SWEAN', 'EXP-RPM-SEWE', 'EXP-RPM-SWTH', 'EXP-RPM-SRAM']),
                        'Animal Feed': getCategoryArray(['EXP-AMF-CROP', 'EXP-AMF-LICK']),
                        'Husbandry': getCategoryArray(['EXP-HBD-VACC', 'EXP-HBD-DIPP', 'EXP-HBD-VETY', 'EXP-HBD-SHER', 'EXP-HBD-CRCH']),
                        'Marketing': getCategoryArray(['EXP-MRK-LSSF', 'EXP-MRK-LSPF', 'EXP-MRK-LSTP']),
                        'Indirect Costs': getCategoryArray(['EXP-IDR-FUEL', 'EXP-IDR-REPP', 'EXP-IDR-ELEC', 'EXP-IDR-WATR', 'EXP-IDR-LABP', 'EXP-IDR-LICS', 'EXP-IDR-INSA', 'EXP-IDR-OTHER'])
                    }
                }
            }
        });

        // Stock
        function addStock (instance, stock) {
            if (stock && underscore.isArray(stock.data.ledger)) {
                instance.stock = underscore.chain(instance.stock)
                    .reject(function (item) {
                        return item.assetKey === stock.assetKey;
                    })
                    .union([stock])
                    .value();
            }
        }

        function findStock (instance, categoryName, commodityType) {
            return underscore.find(instance.stock, function (stock) {
                return stock.data.category === categoryName && (underscore.isUndefined(stock.data.type) || stock.data.type === commodityType);
            });
        }

        function replaceAllStock (instance, stock) {
            instance.stock = underscore.filter(stock, function (item) {
                return item && underscore.isArray(item.data.ledger);
            });
        }

        function removeStock (instance, stock) {
            instance.stock = underscore.chain(instance.stock)
                .reject(function (item) {
                    return item.assetKey === stock.assetKey;
                })
                .value();
        }

        // Categories
        privateProperty(EnterpriseBudgetBase, 'getBaseCategory', function (query) {
            return underscore.findWhere(EnterpriseBudgetBase.categories, query);
        });

        privateProperty(EnterpriseBudgetBase, 'getGroupCategories', function (assetType, commodityType, sectionCode, groupName) {
            return getGroupCategories(sectionCode, assetType, baseAnimal[commodityType], groupName);
        });

        function getCategoryOptions (sectionCode, assetType, baseAnimal) {
            return (assetType && EnterpriseBudgetBase.categoryOptions[assetType] ?
                (assetType === 'livestock'
                    ? (baseAnimal ? EnterpriseBudgetBase.categoryOptions[assetType][baseAnimal][sectionCode] : {})
                    : EnterpriseBudgetBase.categoryOptions[assetType][sectionCode])
                : {});
        }

        function getGroupCategories (sectionCode, assetType, baseAnimal, groupName) {
            var sectionGroupCategories = getCategoryOptions(sectionCode, assetType, baseAnimal);

            return (sectionGroupCategories && sectionGroupCategories[groupName] ? sectionGroupCategories[groupName] : []);
        }

        function getCategoryArray (categoryCodes) {
            return underscore.chain(categoryCodes)
                .map(function (code) {
                    return EnterpriseBudgetBase.categories[code];
                })
                .compact()
                .sortBy('name')
                .value();
        }

        function getAvailableGroupCategories (instance, sectionCode, usedCategories, groupName) {
            return underscore.chain(instance.getCategoryOptions(sectionCode))
                .map(function (categoryGroup, categoryGroupName) {
                    return underscore.chain(categoryGroup)
                        .reject(function (category) {
                            return (groupName && categoryGroupName !== groupName) ||
                                underscore.findWhere(usedCategories, {code: category.code});
                        })
                        .map(function (category) {
                            return underscore.extend(category, {
                                groupBy: categoryGroupName
                            });
                        })
                        .value();
                })
                .values()
                .flatten()
                .value();
        }

        readOnlyProperty(EnterpriseBudgetBase, 'costStages', ['Establishment', 'Yearly']);

        var unitAbbreviations = {
            head: 'hd',
            each: 'ea.'
        };

        // Livestock
        readOnlyProperty(EnterpriseBudgetBase, 'representativeAnimals', {
            Cattle: 'Cow',
            Game: 'Cow',
            Goats: 'Ewe',
            Rabbits: 'Doe',
            Sheep: 'Ewe'
        });

        var baseAnimal = {
            'Cattle (Extensive)': 'Cattle',
            'Cattle (Feedlot)': 'Cattle',
            'Cattle (Stud)': 'Cattle',
            'Sheep (Extensive)': 'Sheep',
            'Sheep (Feedlot)': 'Sheep',
            'Sheep (Stud)': 'Sheep'
        };

        readOnlyProperty(EnterpriseBudgetBase, 'birthAnimals', {
            Cattle: 'Calf',
            Game: 'Calf',
            Goats: 'Kid',
            Rabbits: 'Kit',
            Sheep: 'Lamb'
        });

        readOnlyProperty(EnterpriseBudgetBase, 'weanedAnimals', {
            Cattle: 'Weaner Calf',
            Game: 'Weaner Calf',
            Goats: 'Weaner Kid',
            Rabbits: 'Weaner Kit',
            Sheep: 'Weaner Lamb'
        });

        var conversionRate = {
            Cattle: {
                'Calf': 0.32,
                'Weaner Calf': 0.44,
                'Cow': 1.1,
                'Heifer': 1.1,
                'Steer': 0.75,
                'Ox': 1.1,
                'Bull': 1.36
            },
            Game: {
                'Calf': 0.32,
                'Weaner Calf': 0.44,
                'Cow': 1.1,
                'Heifer': 1.1,
                'Steer': 0.75,
                'Ox': 1.1,
                'Bull': 1.36
            },
            Goats: {
                'Kid': 0.08,
                'Weaner Kid': 0.12,
                'Ewe': 0.17,
                'Castrate': 0.17,
                'Ram': 0.22
            },
            Rabbits: {
                'Kit': 0.08,
                'Weaner Kit': 0.12,
                'Doe': 0.17,
                'Lapin': 0.17,
                'Buck': 0.22
            },
            Sheep: {
                'Lamb': 0.08,
                'Weaner Lamb': 0.11,
                'Ewe': 0.16,
                'Wether': 0.16,
                'Ram': 0.23
            }
        };

        privateProperty(EnterpriseBudgetBase, 'getBirthingAnimal', function (commodityType) {
            var base = baseAnimal[commodityType] || commodityType;

            return base && EnterpriseBudgetBase.birthAnimals[base];
        });

        interfaceProperty(EnterpriseBudgetBase, 'getAssetTypeForLandUse', function (landUse) {
            return (s.include(landUse, 'Cropland') ? 'crop' :
                (s.include(landUse, 'Cropland') ? 'horticulture' : 'livestock'));
        });

        privateProperty(EnterpriseBudgetBase, 'getCategorySortKey', function (categoryName) {
            if (underscore.contains(underscore.values(EnterpriseBudgetBase.representativeAnimals), categoryName)) {
                return 0 + categoryName;
            } else if (underscore.contains(underscore.values(EnterpriseBudgetBase.birthAnimals), categoryName)) {
                return 1 + categoryName;
            } else if (underscore.contains(underscore.values(EnterpriseBudgetBase.weanedAnimals), categoryName)) {
                return 2 + categoryName;
            }

            return 3 + categoryName;
        });

        EnterpriseBudgetBase.validates({
            data: {
                required: true,
                object: true
            }
        });

        return EnterpriseBudgetBase;
    }]);

sdkModelEnterpriseBudget.factory('EnterpriseBudget', ['$filter', 'Base', 'computedProperty', 'EnterpriseBudgetBase', 'inheritModel', 'moment', 'naturalSort', 'privateProperty', 'readOnlyProperty', 'safeArrayMath', 'safeMath', 'underscore',
    function ($filter, Base, computedProperty, EnterpriseBudgetBase, inheritModel, moment, naturalSort, privateProperty, readOnlyProperty, safeArrayMath, safeMath, underscore) {
        function EnterpriseBudget(attrs) {
            EnterpriseBudgetBase.apply(this, arguments);

            Base.initializeObject(this.data, 'details', {});
            Base.initializeObject(this.data, 'events', {});
            Base.initializeObject(this.data, 'schedules', {});
            Base.initializeObject(this.data.details, 'cycleStart', 0);
            Base.initializeObject(this.data.details, 'numberOfMonths', 12);
            Base.initializeObject(this.data.details, 'productionArea', '1 Hectare');

            computedProperty(this, 'commodityTitle', function () {
                return getCommodityTitle(this.assetType);
            });

            computedProperty(this, 'numberOfMonths', function () {
                return this.data.details.numberOfMonths;
            });

            computedProperty(this, 'defaultMonthlyPercent', function () {
                return monthlyPercents[this.data.details.numberOfMonths] || underscore.reduce(underscore.range(this.numberOfMonths), function (totals, value, index) {
                    totals[index] = (index === totals.length - 1 ?
                        safeMath.minus(100, safeArrayMath.reduce(totals)) :
                        safeMath.chain(100)
                            .dividedBy(totals.length)
                            .round(4)
                            .toNumber());
                    return totals;
                }, Base.initializeArray(this.numberOfMonths));
            });

            privateProperty(this, 'getCommodities', function () {
                return getAssetCommodities(this.assetType);
            });

            privateProperty(this, 'getShiftedCycle', function () {
                return getShiftedCycle(this);
            });

            privateProperty(this, 'getEventTypes', function () {
                return eventTypes[this.assetType] ? eventTypes[this.assetType] : eventTypes.default;
            });

            privateProperty(this, 'getScheduleTypes', function () {
                return underscore.chain(scheduleTypes[this.assetType] ? scheduleTypes[this.assetType] : scheduleTypes.default)
                    .union(getScheduleBirthing(this))
                    .compact()
                    .value()
                    .sort(naturalSort);
            });

            privateProperty(this, 'getSchedule', function (scheduleName, defaultValue) {
                return (scheduleName && this.data.schedules[scheduleName] ?
                    this.data.schedules[scheduleName] :
                    (underscore.isUndefined(defaultValue) ? angular.copy(this.defaultMonthlyPercent) : underscore.range(this.numberOfMonths).map(function () {
                        return 0;
                    })));
            });

            privateProperty(this, 'shiftMonthlyArray', function (array) {
                return (array ? underscore.rest(array, this.data.details.cycleStart).concat(
                    underscore.first(array, this.data.details.cycleStart)
                ) : array);
            });

            privateProperty(this, 'unshiftMonthlyArray', function (array) {
                return (array ? underscore.rest(array, array.length -this.data.details.cycleStart).concat(
                    underscore.first(array, array.length - this.data.details.cycleStart)
                ) : array);
            });

            privateProperty(this, 'getShiftedSchedule', function (schedule) {
                return (underscore.isArray(schedule) ?
                    this.shiftMonthlyArray(schedule) :
                    this.shiftMonthlyArray(this.getSchedule(schedule)));
            });

            privateProperty(this, 'getAvailableSchedules', function (includeSchedule) {
                return getAvailableSchedules(this, includeSchedule);
            });

            computedProperty(this, 'cycleStart', function () {
                return this.data.details.cycleStart;
            });

            computedProperty(this, 'cycleStartMonth', function () {
                return EnterpriseBudget.cycleMonths[this.data.details.cycleStart].name;
            });

            privateProperty(this, 'getAllocationIndex', function (sectionCode, costStage) {
                var section = this.getSection(sectionCode, costStage),
                    monthIndex = (section && section.total ? underscore.findIndex(this.shiftMonthlyArray(section.total.valuePerMonth), function (value) {
                    return value !== 0;
                }) : -1);

                return (monthIndex !== -1 ? monthIndex : 0);
            });

            privateProperty(this, 'getLastAllocationIndex', function (sectionCode, costStage) {
                var section = this.getSection(sectionCode, costStage),
                    monthIndex = (section && section.total ? underscore.findLastIndex(this.shiftMonthlyArray(section.total.valuePerMonth), function (value) {
                        return value !== 0;
                    }) : -1);

                return (monthIndex !== -1 ? monthIndex + 1 : this.numberOfMonths);
            });

            computedProperty(this, 'numberOfAllocatedMonths', function () {
                return this.getLastAllocationIndex('INC') - this.getAllocationIndex('EXP');
            });

            privateProperty(this, 'adjustCategory', function (sectionCode, categoryQuery, costStage, property) {
                return adjustCategory(this, sectionCode, categoryQuery, costStage, property);
            });

            privateProperty(this, 'recalculate', function () {
                return recalculateEnterpriseBudget(this);
            });

            privateProperty(this, 'recalculateCategory', function (categoryCode) {
                return recalculateEnterpriseBudgetCategory(this, categoryCode);
            });

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.averaged = attrs.averaged || false;
            this.cloneCount = attrs.cloneCount || 0;
            this.createdAt = attrs.createdAt;
            this.createdBy = attrs.createdBy;
            this.commodityType = attrs.commodityType;
            this.favoriteCount = attrs.favoriteCount || 0;
            this.favorited = attrs.favorited || false;
            this.followers = attrs.followers || [];
            this.id = attrs.id || attrs.$id;
            this.internallyPublished = attrs.internallyPublished || false;
            this.name = attrs.name;
            this.organization = attrs.organization;
            this.organizationUuid = attrs.organizationUuid;
            this.published = attrs.published || false;
            this.region = attrs.region;
            this.sourceUuid = attrs.sourceUuid;
            this.useCount = attrs.useCount || 0;
            this.updatedAt = attrs.updatedAt;
            this.updatedBy = attrs.updatedBy;
            this.user = attrs.user;
            this.userData = attrs.userData;
            this.userId = attrs.userId;
            this.uuid = attrs.uuid;

            if (this.assetType === 'livestock') {
                this.data.details.representativeAnimal = this.getRepresentativeAnimal();
                this.data.details.conversions = this.getConversionRates();
                this.data.details.budgetUnit = 'LSU';

                underscore.each(this.getEventTypes(), function (event) {
                    Base.initializeObject(this.data.events, event, Base.initializeArray(this.numberOfMonths));
                }, this);
            } else if (this.assetType === 'horticulture') {
                if (this.data.details.maturityFactor instanceof Array) {
                    this.data.details.maturityFactor = {
                        'INC': this.data.details.maturityFactor
                    };
                }

                Base.initializeObject(this.data.details, 'yearsToMaturity', getYearsToMaturity(this));
                Base.initializeObject(this.data.details, 'maturityFactor', {});
                Base.initializeObject(this.data.details.maturityFactor, 'INC', []);
                Base.initializeObject(this.data.details.maturityFactor, 'EXP', []);
            }

            this.recalculate();
        }

        inheritModel(EnterpriseBudget, EnterpriseBudgetBase);

        // Commodities
        readOnlyProperty(EnterpriseBudget, 'commodityTypes', {
            crop: 'Field Crops',
            horticulture: 'Horticulture',
            livestock: 'Livestock'
        });

        readOnlyProperty(EnterpriseBudget, 'assetCommodities', {
            crop: [
                'Barley',
                'Bean (Dry)',
                'Bean (Green)',
                'Beet',
                'Broccoli',
                'Butternut',
                'Cabbage',
                'Canola',
                'Carrot',
                'Cauliflower',
                'Cotton',
                'Cowpea',
                'Grain Sorghum',
                'Groundnut',
                'Leek',
                'Lucerne',
                'Lupin',
                'Maize',
                'Maize (Fodder)',
                'Maize (Green)',
                'Maize (Irrigated)',
                'Maize (Seed)',
                'Maize (White)',
                'Maize (Yellow)',
                'Multispecies Pasture',
                'Oats',
                'Onion',
                'Potato',
                'Pumpkin',
                'Rapeseed',
                'Rye',
                'Soya Bean',
                'Soya Bean (Irrigated)',
                'Sunflower',
                'Sweet Corn',
                'Teff',
                'Teff (Irrigated)',
                'Tobacco',
                'Triticale',
                'Turnip',
                'Wheat',
                'Wheat (Irrigated)'
            ],
            horticulture: [
                'Almond',
                'Apple',
                'Apricot',
                'Avocado',
                'Banana',
                'Barberry',
                'Berry',
                'Bilberry',
                'Blackberry',
                'Blueberry',
                'Cherry',
                'Chicory',
                'Chili',
                'Cloudberry',
                'Citrus (Hardpeel)',
                'Citrus (Softpeel)',
                'Coffee',
                'Date',
                'Fig',
                'Garlic',
                'Gooseberry',
                'Grape (Bush Vine)',
                'Grape (Table)',
                'Grape (Wine)',
                'Guava',
                'Hazelnut',
                'Hops',
                'Kiwi',
                'Kumquat',
                'Lemon',
                'Lentil',
                'Lime',
                'Macadamia Nut',
                'Mandarin',
                'Mango',
                'Melon',
                'Mulberry',
                'Nectarine',
                'Olive',
                'Orange',
                'Papaya',
                'Pea',
                'Peach',
                'Peanut',
                'Pear',
                'Prickly Pear',
                'Pecan Nut',
                'Persimmon',
                'Pineapple',
                'Pistachio Nut',
                'Plum',
                'Pomegranate',
                'Protea',
                'Prune',
                'Quince',
                'Raspberry',
                'Rooibos',
                'Strawberry',
                'Sugarcane',
                'Tea',
                'Tomato',
                'Watermelon',
                'Wineberry'
            ],
            livestock: [
                'Cattle (Extensive)',
                'Cattle (Feedlot)',
                'Cattle (Stud)',
                'Chicken (Broilers)',
                'Chicken (Layers)',
                'Dairy',
                'Game',
                'Goats',
                'Horses',
                'Ostrich',
                'Pigs',
                'Rabbits',
                'Sheep (Extensive)',
                'Sheep (Feedlot)',
                'Sheep (Stud)'
            ]
        });

        function getCommodityTitle (assetType) {
            return EnterpriseBudget.commodityTypes[assetType] || '';
        }

        function getAssetCommodities (assetType) {
            return EnterpriseBudget.assetCommodities[assetType] || [];
        }

        var eventTypes = {
            'default': [],
            'livestock': ['Birth', 'Death']
        };

        var scheduleTypes = {
            'default': ['Fertilise', 'Harvest', 'Plant/Seed', 'Plough', 'Spray'],
            'livestock': ['Lick', 'Sales', 'Shearing', 'Vaccination']
        };

        readOnlyProperty(EnterpriseBudget, 'cycleMonths', underscore.map([
                'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'
            ],
            function (month, index) {
                return {
                    id: index,
                    name: month,
                    shortname: month.substring(0, 3)
                }
            }));

        privateProperty(EnterpriseBudget, 'getCycleMonth', function (month) {
            return EnterpriseBudget.cycleMonths[month % 12];
        });

        function getShiftedCycle (instance) {
            return underscore.sortBy(EnterpriseBudget.cycleMonths, function (monthCycle) {
                return (monthCycle.id < instance.data.details.cycleStart ? monthCycle.id + 12 : monthCycle.id);
            });
        }

        var monthlyPercents = {
            3: [33.33, 33.34, 33.33],
            6: [16.67, 16.67, 16.66, 16.66, 16.67, 16.67],
            7: [14.29, 14.28, 14.29, 14.28, 14.29, 14.28, 14.29],
            9: [11.11, 11.11, 11.11, 11.11, 11.12, 11.11, 11.11, 11.11, 11.11],
            11: [9.09, 9.09, 9.09, 9.09, 9.09, 9.10, 9.09, 9.09, 9.09, 9.09, 9.09],
            12: [8.33, 8.33, 8.34, 8.33, 8.33, 8.34, 8.33, 8.33, 8.34, 8.33, 8.33, 8.34]
        };

        // Horticulture
        var yearsToMaturity = {
            'Apple': 25,
            'Apricot': 18,
            'Avocado': 8,
            'Blueberry': 8,
            'Citrus (Hardpeel)': 25,
            'Citrus (Softpeel)': 25,
            'Date': 12,
            'Fig': 30,
            'Grape (Table)': 25,
            'Grape (Wine)': 25,
            'Macadamia Nut': 10,
            'Mango': 30,
            'Nectarine': 18,
            'Olive': 10,
            'Orange': 25,
            'Pecan Nut': 10,
            'Peach': 18,
            'Pear': 25,
            'Persimmon': 20,
            'Plum': 18,
            'Pomegranate': 30,
            'Rooibos': 5
        };

        function getYearsToMaturity (instance) {
            return yearsToMaturity[instance.commodityType];
        }

        // Schedules
        var scheduleBirthing = {
            'Calving': ['Cattle (Extensive)', 'Cattle (Feedlot)', 'Cattle (Stud)', 'Dairy'],
            'Hatching': ['Chicken (Broilers)', 'Chicken (Layers)', 'Ostrich'],
            'Kidding': ['Game', 'Goats'],
            'Foaling': ['Horses'],
            'Farrowing': ['Pigs'],
            'Lambing': ['Sheep (Extensive)', 'Sheep (Feedlot)', 'Sheep (Stud)']
        };

        function getScheduleBirthing (instance) {
            return underscore.chain(scheduleBirthing)
                .keys()
                .filter(function (key) {
                    return underscore.contains(scheduleBirthing[key], instance.commodityType);
                })
                .value();
        }

        function getAvailableSchedules(instance, includeSchedule) {
            return underscore.reject(instance.getScheduleTypes(), function (schedule) {
                return ((includeSchedule === undefined || schedule !== includeSchedule) && instance.data.schedules[schedule] !== undefined);
            })
        }

        function adjustCategory (instance, sectionCode, categoryQuery, costStage, property) {
            var categoryCode = (underscore.isObject(categoryQuery) ? categoryQuery.code : categoryQuery),
                category = instance.getCategory(sectionCode, categoryCode, costStage);

            if (category) {
                category.quantity = (category.unit === 'Total' ? 1 : category.quantity);

                if (underscore.has(category, 'schedule')) {
                    category.scheduled = true;
                    delete category.schedule;
                }

                if (property === 'valuePerMonth') {
                    category.scheduled = true;
                    category.value = safeArrayMath.reduce(category.valuePerMonth);
                }

                if (underscore.contains(['value', 'valuePerLSU', 'valuePerMonth'], property)) {
                    if (property === 'valuePerLSU') {
                        category.value = safeMath.round(safeMath.dividedBy(category.value, instance.getConversionRate(category.name)), 2);
                    }

                    category.pricePerUnit = safeMath.round(safeMath.dividedBy(safeMath.dividedBy(category.value, category.supply || 1), category.quantity), 4);
                }

                if (underscore.contains(['pricePerUnit', 'quantity', 'quantityPerLSU', 'supply'], property)) {
                    if (property === 'quantityPerLSU') {
                        category.quantity = safeMath.round(safeMath.dividedBy(category.quantity, instance.getConversionRate(category.name)), 2);
                    }

                    category.value = safeMath.times(safeMath.times(category.supply || 1, category.quantity), category.pricePerUnit);
                }

                if (property !== 'valuePerMonth') {
                    // Need to convert valuePerMonth using a ratio of the value change
                    // If the previous value is 0, we need to reset the valuePerMonth to a monthly average
                    var oldValue = safeArrayMath.reduce(category.valuePerMonth),
                        valueMod = category.value % instance.numberOfMonths;

                    if (oldValue === 0 || !category.scheduled) {
                        category.valuePerMonth = underscore.reduce(instance.defaultMonthlyPercent, function (totals, value, index) {
                            totals[index] = (index === totals.length - 1 ?
                                safeMath.minus(category.value, safeArrayMath.reduce(totals)) :
                                (valueMod === 0 ?
                                    safeMath.dividedBy(category.value, instance.numberOfMonths) :
                                    safeMath.round(safeMath.dividedBy(safeMath.times(value, category.value), 100), 2)));
                            return totals;
                        }, Base.initializeArray(instance.numberOfMonths));
                    } else {
                        var totalFilled = safeArrayMath.count(category.valuePerMonth),
                            countFilled = 0;

                        category.valuePerMonth = underscore.reduce(category.valuePerMonth, function (totals, value, index) {
                            if (value > 0) {
                                totals[index] = (index === totals.length - 1 || countFilled === totalFilled - 1 ?
                                    safeMath.minus(category.value, safeArrayMath.reduce(totals)) :
                                    safeMath.round(safeMath.dividedBy(safeMath.times(value, category.value), oldValue), 2));
                                countFilled++;
                            }
                            return totals;
                        }, Base.initializeArray(instance.numberOfMonths));
                    }
                }

                recalculateEnterpriseBudgetCategory(instance, categoryCode);
            }
        }

        // Calculation
        function validateEnterpriseBudget (instance) {
            // Validate sections
            underscore.each(EnterpriseBudget.sections, function (section) {
                for (var i = EnterpriseBudget.costStages.length - 1; i >= 0; i--) {
                    var budgetSection = instance.getSection(section.code, EnterpriseBudget.costStages[i]);

                    if (underscore.isUndefined(budgetSection)) {
                        budgetSection = angular.copy(section);
                        budgetSection.productCategoryGroups = [];

                        instance.data.sections.push(budgetSection);
                        instance.sortSections();
                    }

                    budgetSection.costStage = EnterpriseBudget.costStages[i];
                }
            });

            // Validate maturity
            if (instance.assetType === 'horticulture' && instance.data.details.yearsToMaturity) {
                var yearsToMaturity = instance.data.details.yearsToMaturity;

                instance.data.details.maturityFactor = underscore.mapObject(instance.data.details.maturityFactor, function (maturityFactor) {
                    return underscore.first(maturityFactor.concat(underscore.range(maturityFactor.length < yearsToMaturity ? (yearsToMaturity - maturityFactor.length) : 0)
                        .map(function () {
                            return 100;
                        })), yearsToMaturity);
                });
            }
        }

        function recalculateEnterpriseBudget (instance) {
            validateEnterpriseBudget(instance);

            if (instance.assetType === 'livestock' && instance.getConversionRate()) {
                instance.data.details.calculatedLSU = safeMath.times(instance.data.details.herdSize, instance.getConversionRate());
            }

            underscore.each(instance.data.sections, function (section) {
                underscore.each(section.productCategoryGroups, function (group) {
                    underscore.each(group.productCategories, function (category) {
                        recalculateCategory(instance, category);
                    });

                    recalculateGroup(instance, group);
                });

                recalculateSection(instance, section);
            });

            recalculateGrossProfit(instance);
        }

        function recalculateEnterpriseBudgetCategory (instance, categoryCode) {
            underscore.each(instance.data.sections, function (section) {
                underscore.each(section.productCategoryGroups, function (group) {
                    underscore.each(group.productCategories, function (category) {
                        if (category.code === categoryCode) {
                            recalculateCategory(instance, category);
                            recalculateGroup(instance, group);
                            recalculateSection(instance, section);
                        }
                    });
                });
            });

            recalculateGrossProfit(instance);
        }

        function recalculateGrossProfit (instance) {
            instance.data.details.grossProfitByStage = underscore.object(EnterpriseBudget.costStages,
                underscore.map(EnterpriseBudget.costStages, function (stage) {
                    return underscore
                        .chain(instance.data.sections)
                        .where({costStage: stage})
                        .reduce(function (total, section) {
                            return (section.code === 'INC' ? safeMath.plus(total, section.total.value) :
                                (section.code === 'EXP' ? safeMath.minus(total, section.total.value) : total));
                        }, 0)
                        .value();
                }));

            instance.data.details.grossProfit = instance.data.details.grossProfitByStage[instance.defaultCostStage];

            if (instance.assetType === 'livestock') {
                instance.data.details.grossProfitPerLSU = safeMath.dividedBy(instance.data.details.grossProfit, instance.data.details.calculatedLSU);
            }
        }

        function recalculateSection (instance, section) {
            section.total = underscore.extend({
                value: underscore.reduce(section.productCategoryGroups, function (total, group) {
                    return safeMath.plus(total, group.total.value)
                }, 0),
                valuePerMonth: underscore.reduce(section.productCategoryGroups, function (totals, group) {
                    return safeArrayMath.plus(totals, group.total.valuePerMonth);
                }, Base.initializeArray(instance.numberOfMonths))
            }, (instance.assetType !== 'livestock' ? {} : {
                quantityPerLSU: underscore.reduce(section.productCategoryGroups, function (total, group) {
                    return safeMath.plus(total, group.total.quantityPerLSU)
                }, 0),
                valuePerLSU: underscore.reduce(section.productCategoryGroups, function (total, group) {
                    return safeMath.plus(total, group.total.valuePerLSU)
                }, 0)
            }));
        }

        function recalculateGroup (instance, group) {
            group.total = underscore.extend({
                value: underscore.reduce(group.productCategories, function (total, category) {
                    return safeMath.plus(total, category.value)
                }, 0),
                valuePerMonth: underscore.reduce(group.productCategories, function (totals, category) {
                    return safeArrayMath.plus(totals, category.valuePerMonth);
                }, Base.initializeArray(instance.numberOfMonths))
            }, (instance.assetType !== 'livestock' ? {} : {
                quantityPerLSU: underscore.reduce(group.productCategories, function (total, category) {
                    return safeMath.plus(total, category.quantityPerLSU)
                }, 0),
                valuePerLSU: underscore.reduce(group.productCategories, function (total, category) {
                    return safeMath.plus(total, category.valuePerLSU)
                }, 0)
            }));
        }

        function recalculateCategory (instance, category) {
            category.name = (underscore.contains(['INC-HVT-CROP', 'INC-HVT-FRUT'], category.code) ?
                instance.commodityType :
                EnterpriseBudgetBase.categories[category.code].name);

            if (instance.assetType === 'livestock' && instance.getConversionRate(category.name)) {
                category.quantityPerLSU = safeMath.times(category.quantity, instance.getConversionRate(category.name));
                category.valuePerLSU = safeMath.times(category.value, instance.getConversionRate(category.name));
            }

            category.valuePerMonth = category.valuePerMonth || Base.initializeArray(instance.numberOfMonths);

            category.quantityPerMonth = underscore.reduce(category.valuePerMonth, function (totals, value, index) {
                totals[index] = (index === totals.length - 1 ?
                    safeMath.minus(category.quantity, safeArrayMath.reduce(totals)) :
                    safeMath.dividedBy(safeMath.times(category.quantity, value), category.value));
                return totals;
            }, Base.initializeArray(instance.numberOfMonths));

            if (!underscore.isUndefined(category.supplyUnit)) {
                category.supplyPerMonth = underscore.reduce(category.valuePerMonth, function (totals, value, index) {
                    totals[index] = (index === totals.length - 1 ?
                        safeMath.minus(category.supply, safeArrayMath.reduce(totals)) :
                        safeMath.dividedBy(safeMath.times(category.supply, value), category.value));
                    totals[index] = (category.supplyUnit === 'hd' ? Math.round(totals[index]) : totals[index]);
                    return totals;
                }, Base.initializeArray(instance.numberOfMonths));
            }
        }

        // Validation
        EnterpriseBudget.validates({
            assetType: {
                required: true,
                inclusion: {
                    in: underscore.keys(EnterpriseBudget.assetCommodities)
                }
            },
            commodityType: {
                required: true,
                inclusion: {
                    in: function (value, instance, field) {
                        return getAssetCommodities(instance.assetType);
                    }
                }
            },
            data: {
                required: true,
                object: true
            },
            name: {
                required: true,
                length: {
                    min: 1,
                    max: 255
                }
            },
            region: {
                required: true,
                object: true
            }
        });

        return EnterpriseBudget;
    }]);

var sdkModelFarm = angular.module('ag.sdk.model.farm', ['ag.sdk.library', 'ag.sdk.model.base']);

sdkModelFarm.factory('Farm', ['asJson', 'Base', 'computedProperty', 'geoJSONHelper', 'inheritModel', 'Model', 'naturalSort', 'privateProperty', 'readOnlyProperty', 'topologyHelper', 'underscore',
    function (asJson, Base, computedProperty, geoJSONHelper, inheritModel, Model, naturalSort, privateProperty, readOnlyProperty, topologyHelper, underscore) {
        function Farm (attrs) {
            Model.Base.apply(this, arguments);

            privateProperty(this, 'farmNameUnique', function (name, farms) {
                return farmNameUnique(this, name, farms);
            });

            computedProperty(this, 'fields', function () {
                return this.data.fields;
            });

            computedProperty(this, 'gates', function () {
                return this.data.gates;
            });

            // Fields
            privateProperty(this, 'addField', function (field) {
                addItem(this, 'fields', field, 'fieldName');
            });

            privateProperty(this, 'removeField', function (field) {
                removeItem(this, 'fields', field, 'fieldName');
            });

            // Gates
            privateProperty(this, 'addGate', function (gate) {
                addItem(this, 'gates', gate, 'name');
            });

            privateProperty(this, 'removeGate', function (gate) {
                removeItem(this, 'gates', gate, 'name');
            });

            // Geom
            privateProperty(this, 'contains', function (geojson, assets) {
                return contains(this, geojson, assets);
            });

            privateProperty(this, 'centroid', function (assets) {
                return centroid(this, assets);
            });

            this.data = (attrs && attrs.data) || {};
            Base.initializeObject(this.data, 'fields', []);
            Base.initializeObject(this.data, 'gates', []);
            Base.initializeObject(this.data, 'ignoredLandClasses', []);

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.id = attrs.id || attrs.$id;
            this.name = attrs.name;
            this.organizationId = attrs.organizationId;

            // Models
            this.organization = attrs.organization;
        }

        function farmNameUnique (instance, name, farms) {
            var trimmedValue = s.trim(name || '').toLowerCase();

            return !underscore.isEmpty(trimmedValue) && !underscore.chain(farms)
                .reject(function (farm) {
                    return instance.id === farm.id;
                })
                .some(function (farm) {
                    return (s.trim(farm.name).toLowerCase() === trimmedValue);
                })
                .value();
        }

        inheritModel(Farm, Model.Base);

        function addItem (instance, dataStore, item, compareProp) {
            if (item) {
                instance.data[dataStore] = underscore.chain(instance.data[dataStore])
                    .reject(function (dsItem) {
                        return dsItem[compareProp] === item[compareProp];
                    })
                    .union([asJson(item)])
                    .value()
                    .sort(function (a, b) {
                        return naturalSort(a[compareProp], b[compareProp]);
                    });

                instance.$dirty = true;
            }
        }

        function removeItem (instance, dataStore, item, compareProp) {
            if (item) {
                instance.data[dataStore] = underscore.reject(instance.data[dataStore], function (dsItem) {
                    return dsItem[compareProp] === item[compareProp];
                });

                instance.$dirty = true;
            }
        }

        function getAssetsGeom (instance, assets) {
            return underscore.chain(assets)
                .filter(function (asset) {
                    return asset.farmId === instance.id && asset.data && asset.data.loc;
                })
                .reduce(function (geom, asset) {
                    var assetGeom = topologyHelper.readGeoJSON(asset.data.loc);

                    return (geom && assetGeom.isValid() ? geom.union(assetGeom) : geom || assetGeom);
                }, null)
                .value();
        }

        function contains (instance, geojson, assets) {
            var farmGeom = getAssetsGeom(instance, assets),
                queryGeom = topologyHelper.readGeoJSON(geojson);

            return (farmGeom && queryGeom ? farmGeom.contains(queryGeom) : false);
        }

        function centroid (instance, assets) {
            var geom = getAssetsGeom(instance, assets);

            return (geom ? topologyHelper.writeGeoJSON(geom.getCentroid()) : geom);
        }

        Farm.validates({
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
            }
        });

        return Farm;
    }]);

var sdkModelField = angular.module('ag.sdk.model.field', ['ag.sdk.library', 'ag.sdk.model.base']);

sdkModelField.factory('Field', ['computedProperty', 'inheritModel', 'Model', 'privateProperty', 'readOnlyProperty', 'underscore',
    function (computedProperty, inheritModel, Model, privateProperty, readOnlyProperty, underscore) {
        function Field (attrs) {
            Model.Base.apply(this, arguments);

            computedProperty(this, 'croppingPotentialRequired', function () {
                return s.include(this.landUse, 'Cropland');
            });

            computedProperty(this, 'hasGeometry', function () {
                return !underscore.isUndefined(this.loc);
            });

            computedProperty(this, 'establishedDateRequired', function () {
                return s.include(this.landUse, 'Orchard');
            });

            computedProperty(this, 'terrainRequired', function () {
                return s.include(this.landUse, 'Grazing');
            });

            privateProperty(this, 'setIrrigatedFromLandUse', function () {
                this.irrigated = s.include(this.landUse, 'Irrigated');
            });

            privateProperty(this, 'fieldNameUnique', function (fieldName, farm) {
                return fieldNameUnique(this, fieldName, farm);
            });

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.crop = attrs.crop;
            this.croppingPotential = attrs.croppingPotential;
            this.effectiveDepth = attrs.effectiveDepth;
            this.farmName = attrs.farmName;
            this.fieldName = attrs.fieldName;
            this.irrigated = attrs.irrigated;
            this.irrigationType = attrs.irrigationType;
            this.landUse = attrs.landUse;
            this.loc = attrs.loc;
            this.sgKey = attrs.sgKey;
            this.size = attrs.size;
            this.soilTexture = attrs.soilTexture;
            this.source = attrs.source;
            this.terrain = attrs.terrain;
            this.waterSource = attrs.waterSource;

            convertLandUse(this);
        }

        function convertLandUse (instance) {
            switch (instance.landUse) {
                case 'Cropland':
                    if (instance.irrigated) {
                        instance.landUse = 'Cropland (Irrigated)';
                    }
                    break;
                case 'Conservation':
                    instance.landUse = 'Grazing (Bush)';
                    break;
                case 'Horticulture (Intensive)':
                    instance.landUse = 'Greenhouses';
                    break;
                case 'Horticulture (Perennial)':
                    instance.landUse = 'Orchard';
                    break;
                case 'Horticulture (Seasonal)':
                    instance.landUse = 'Vegetables';
                    break;
                case 'Housing':
                    instance.landUse = 'Homestead';
                    break;
                case 'Wasteland':
                    instance.landUse = 'Non-vegetated';
                    break;
            }
        }

        function fieldNameUnique (instance, fieldName, farm) {
            var trimmedValue = s.trim(fieldName || '').toLowerCase();

            return (farm && farm.data && !underscore.isEmpty(trimmedValue) && !underscore.some(farm.data.fields || [], function (field) {
                return (s.trim(field.fieldName).toLowerCase() === trimmedValue || (!underscore.isUndefined(instance.loc) && underscore.isEqual(field.loc, instance.loc)));
            }));
        }

        inheritModel(Field, Model.Base);

        readOnlyProperty(Field, 'croppingPotentials', [
            'High',
            'Medium',
            'Low']);

        readOnlyProperty(Field, 'effectiveDepths', [
            '0 - 30cm',
            '30 - 60cm',
            '60 - 90cm',
            '90 - 120cm',
            '120cm +']);

        readOnlyProperty(Field, 'irrigationTypes', [
            'Centre-Pivot',
            'Drip',
            'Flood',
            'Micro',
            'Sprinkler',
            'Sub-drainage']);

        readOnlyProperty(Field, 'landClasses', [
            'Building',
            'Built-up',
            'Cropland',
            'Cropland (Emerging)',
            'Cropland (Irrigated)',
            'Cropland (Smallholding)',
            'Erosion',
            'Forest',
            'Grazing',
            'Grazing (Bush)',
            'Grazing (Fynbos)',
            'Grazing (Shrubland)',
            'Greenhouses',
            'Homestead',
            'Mining',
            'Non-vegetated',
            'Orchard',
            'Orchard (Shadenet)',
            'Pineapple',
            'Plantation',
            'Plantation (Smallholding)',
            'Planted Pastures',
            'Sugarcane',
            'Sugarcane (Emerging)',
            'Sugarcane (Irrigated)',
            'Tea',
            'Vegetables',
            'Vineyard',
            'Water',
            'Water (Seasonal)',
            'Wetland']);

        readOnlyProperty(Field, 'soilTextures', [
            'Clay',
            'Clay Loam',
            'Clay Sand',
            'Coarse Sand',
            'Coarse Sandy Clay',
            'Coarse Sandy Clay Loam',
            'Coarse Sandy Loam',
            'Fine Sand',
            'Fine Sandy Clay',
            'Fine Sandy Clay Loam',
            'Fine Sandy Loam',
            'Gravel',
            'Loam',
            'Loamy Coarse Sand',
            'Loamy Fine Sand',
            'Loamy Medium Sand',
            'Loamy Sand',
            'Medium Sand',
            'Medium Sandy Clay',
            'Medium Sandy Clay Loam',
            'Medium Sandy Loam',
            'Other',
            'Sand',
            'Sandy Clay',
            'Sandy Clay Loam',
            'Sandy Loam',
            'Silty Clay',
            'Silty Loam']);

        readOnlyProperty(Field, 'waterSources', [
            'Borehole',
            'Dam',
            'Irrigation Scheme',
            'River']);

        readOnlyProperty(Field, 'terrains', [
            'Mountains',
            'Plains']);

        Field.validates({
            croppingPotential: {
                required: false,
                inclusion: {
                    in: Field.croppingPotentials
                }
            },
            effectiveDepth: {
                required: false,
                inclusion: {
                    in: Field.effectiveDepths
                }
            },
            farmName: {
                required: true,
                length: {
                    min: 0,
                    max: 255
                }
            },
            fieldName: {
                required: true,
                length: {
                    min: 0,
                    max: 255
                }
            },
            landUse: {
                required: true,
                inclusion: {
                    in: Field.landClasses
                }
            },
            loc: {
                required: false,
                object: true
            },
            size: {
                required: true,
                numeric: true
            },
            sgKey: {
                required: false,
                numeric: true
            },
            soilTexture: {
                required: false,
                inclusion: {
                    in: Field.soilTextures
                }
            },
            source: {
                required: false,
                length: {
                    min: 0,
                    max: 255
                }
            },
            terrain: {
                requiredIf: function (value, instance, field) {
                    return instance.terrainRequired;
                },
                inclusion: {
                    in: Field.terrains
                }
            },
            waterSource: {
                required: false,
                inclusion: {
                    in: Field.waterSources
                }
            }
        });

        return Field;
    }]);

var sdkModelFinancial = angular.module('ag.sdk.model.financial', ['ag.sdk.library', 'ag.sdk.model.base', 'ag.sdk.utilities']);

sdkModelFinancial.factory('FinancialBase', ['Base', 'inheritModel', 'Model', 'privateProperty', 'safeMath', 'underscore',
    function (Base, inheritModel, Model, privateProperty, safeMath, underscore) {
        function FinancialBase (attrs) {
            Model.Base.apply(this, arguments);

            this.data = (attrs && attrs.data) || {};
            Base.initializeObject(this.data, 'assets', {});
            Base.initializeObject(this.data, 'liabilities', {});
            Base.initializeObject(this.data, 'ratios', {});

            privateProperty(this, 'recalculate', function () {
                return recalculate(this);
            });

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.id = attrs.id || attrs.$id;
            this.grossProfit = attrs.grossProfit;
            this.netProfit = attrs.netProfit;
            this.netWorth = attrs.netWorth;
            this.year = attrs.year;

            convert(this);
        }

        function convert(instance) {
            underscore.each(['assets', 'liabilities'], function (group) {
                instance.data[group] = underscore.chain(instance.data[group])
                    .omit('undefined')
                    .mapObject(function (categories, type) {
                        return (!underscore.isArray(categories) ?
                            categories :
                            underscore.chain(categories)
                                .map(function (category) {
                                    return [category.name, category.estimatedValue];
                                })
                                .object()
                                .value());
                    })
                    .value();
            });
        }

        inheritModel(FinancialBase, Model.Base);

        function calculateRatio (numeratorProperties, denominatorProperties) {
            numeratorProperties = (underscore.isArray(numeratorProperties) ? numeratorProperties : [numeratorProperties]);
            denominatorProperties = (underscore.isArray(denominatorProperties) ? denominatorProperties : [denominatorProperties]);

            var numerator = underscore.reduce(numeratorProperties, function (total, value) {
                    return safeMath.plus(total, value);
                }, 0),
                denominator = underscore.reduce(denominatorProperties, function (total, value) {
                    return safeMath.plus(total, value);
                }, 0);

            return safeMath.round(safeMath.dividedBy(numerator, denominator), 2);
        }

        function recalculate (instance) {
            instance.data.totalAssets = safeMath.round(underscore.chain(instance.data.assets)
                .values()
                .reduce(function (total, categories) {
                    return underscore.reduce(categories, function (total, value) {
                        return safeMath.plus(total, value);
                    }, total);
                }, 0)
                .value());
            instance.data.totalLiabilities = safeMath.round(underscore.chain(instance.data.liabilities)
                .values()
                .reduce(function (total, categories) {
                    return underscore.reduce(categories, function (total, value) {
                        return safeMath.plus(total, value);
                    }, total);
                }, 0)
                .value());

            instance.netWorth = safeMath.round(safeMath.minus(instance.data.totalAssets, instance.data.totalLiabilities), 2);
            instance.grossProfit = safeMath.round(safeMath.minus(instance.data.productionIncome, instance.data.productionExpenditure), 2);

            instance.data.ebitda = safeMath.round(safeMath.minus(safeMath.plus(instance.grossProfit, instance.data.otherIncome), instance.data.otherExpenditure), 2);
            instance.data.ebit = safeMath.round(safeMath.minus(instance.data.ebitda, instance.data.depreciationAmortization), 2);
            instance.data.ebt = safeMath.round(safeMath.minus(instance.data.ebit, instance.data.interestPaid), 2);

            instance.netProfit = safeMath.round(safeMath.minus(instance.data.ebt, instance.data.taxPaid), 2);

            instance.data.ratios = {
                debt: calculateRatio(instance.data.totalLiabilities, instance.data.totalAssets),
                debtToTurnover: calculateRatio(instance.data.totalLiabilities, [instance.data.productionIncome, instance.data.otherIncome]),
                gearing: calculateRatio(instance.data.totalLiabilities, instance.netWorth),
                inputOutput: calculateRatio(instance.data.productionIncome, instance.data.productionExpenditure),
                interestCover: calculateRatio(instance.grossProfit, instance.data.interestPaid),
                interestToTurnover: calculateRatio(instance.data.interestPaid, [instance.data.productionIncome, instance.data.otherIncome]),
                productionCost: calculateRatio(instance.data.productionExpenditure, instance.data.productionIncome),
                returnOnInvestment: calculateRatio(instance.grossProfit, instance.data.totalAssets)
            };

            instance.$dirty = true;
        }

        FinancialBase.validates({
            year: {
                numeric: true,
                range: {
                    from: 1000,
                    to: 9999
                }
            }
        });

        return FinancialBase;
    }]);

sdkModelFinancial.factory('Financial', ['inheritModel', 'FinancialBase', 'underscore',
    function (inheritModel, FinancialBase, underscore) {
        function Financial (attrs) {
            FinancialBase.apply(this, arguments);

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.legalEntityId = attrs.legalEntityId;

            // Models
            this.legalEntity = attrs.legalEntity;
        }

        inheritModel(Financial, FinancialBase);

        Financial.validates({
            legalEntityId: {
                required: true,
                numeric: true
            },
            year: {
                numeric: true,
                range: {
                    from: 1000,
                    to: 9999
                }
            }
        });

        return Financial;
    }]);


sdkModelFinancial.factory('FinancialGroup', ['inheritModel', 'Financial', 'FinancialBase', 'privateProperty', 'safeMath', 'underscore',
    function (inheritModel, Financial, FinancialBase, privateProperty, safeMath, underscore) {
        function FinancialGroup (attrs) {
            FinancialBase.apply(this, arguments);

            privateProperty(this, 'addFinancial', function (financial) {
                addFinancial(this, financial);
            });

            this.financials = [];

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            underscore.each(attrs.financials, this.addFinancial, this);
        }

        inheritModel(FinancialGroup, FinancialBase);

        function addFinancial (instance, financial) {
            financial = (financial instanceof Financial ? financial : Financial.new(financial));

            instance.year = financial.year;

            instance.financials = underscore.chain(instance.financials)
                .reject(function (item) {
                    return item.legalEntityId === financial.legalEntityId && item.year === financial.year;
                })
                .union([financial])
                .value();

            instance.data = underscore.chain(instance.financials)
                .reduce(function (data, financial) {
                    underscore.each(['assets', 'liabilities'], function (group) {
                        underscore.each(financial.data[group], function (categories, type) {
                            data[group][type] = underscore.reduce(categories, function (result, value, category) {
                                result[category] = safeMath.plus(result[category], value);

                                return result;
                            }, data[group][type] || {});
                        });
                    });

                    return data;
                }, {
                    assets: {},
                    liabilities: {},
                    ratios: {}
                })
                .extend(underscore.chain(['productionIncome', 'productionExpenditure', 'otherIncome', 'otherExpenditure', 'depreciationAmortization', 'interestPaid', 'taxPaid'])
                    .map(function (key) {
                        return [key, underscore.chain(instance.financials)
                            .pluck('data')
                            .pluck(key)
                            .reduce(function(total, value) {
                                return safeMath.plus(total, value);
                            }, 0)
                            .value()];
                    })
                    .object()
                    .value())
                .value();

            instance.recalculate();
        }

        FinancialGroup.validates({
            year: {
                numeric: true,
                range: {
                    from: 1000,
                    to: 9999
                }
            }
        });

        return FinancialGroup;
    }]);
var sdkModelLayer= angular.module('ag.sdk.model.layer', ['ag.sdk.library', 'ag.sdk.model.base', 'ag.sdk.geospatial']);

sdkModelLayer.factory('Layer', ['inheritModel', 'Model', 'privateProperty', 'readOnlyProperty', 'underscore',
    function (inheritModel, Model, privateProperty, readOnlyProperty, underscore) {
        function Layer (attrs) {
            Model.Base.apply(this, arguments);

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.id = attrs.id || attrs.$id;
            this.comments = attrs.comments;
            this.createdAt = attrs.createdAt;
            this.createdBy = attrs.createdBy;
            this.geometry = attrs.geometry;
            this.name = attrs.name;
            this.organizationId = attrs.organizationId;
            this.province = attrs.province;
            this.type = attrs.type;
            this.updatedAt = attrs.updatedAt;
            this.updatedBy = attrs.updatedBy;

            this.organization = attrs.organization;
            this.sublayers = attrs.sublayers;
        }

        inheritModel(Layer, Model.Base);

        privateProperty(Layer, 'listMap', function (item) {
            return {
                title: item.name,
                subtitle: item.province
            }
        });

        Layer.validates({
            comments: {
                required: false,
                length: {
                    min: 0,
                    max: 255
                }
            },
            geometry: {
                required: false,
                object: true
            },
            name: {
                required: true,
                length: {
                    min: 1,
                    max: 255
                }
            },
            organizationId: {
                required: false,
                numeric: true
            },
            province: {
                required: false,
                length: {
                    min: 0,
                    max: 255
                }
            },
            type: {
                required: true,
                length: {
                    min: 1,
                    max: 255
                }
            }
        });

        return Layer;
    }]);


sdkModelLayer.factory('Sublayer', ['computedProperty', 'inheritModel', 'Model', 'privateProperty', 'readOnlyProperty', 'topologyHelper', 'underscore',
    function (computedProperty, inheritModel, Model, privateProperty, readOnlyProperty, topologyHelper, underscore) {
        function Sublayer (attrs) {
            Model.Base.apply(this, arguments);

            computedProperty(this, 'geom', function () {
                return topologyHelper.readGeoJSON(this.geometry);
            });

            privateProperty(this, 'contains', function (geometry) {
                return geometryRelation(this, 'contains', geometry);
            });

            privateProperty(this, 'covers', function (geometry) {
                return geometryRelation(this, 'covers', geometry);
            });

            privateProperty(this, 'crosses', function (geometry) {
                return geometryRelation(this, 'crosses', geometry);
            });

            privateProperty(this, 'intersects', function (geometry) {
                return geometryRelation(this, 'intersects', geometry);
            });

            privateProperty(this, 'overlaps', function (geometry) {
                return geometryRelation(this, 'overlaps', geometry);
            });

            privateProperty(this, 'touches', function (geometry) {
                return geometryRelation(this, 'touches', geometry);
            });

            privateProperty(this, 'within', function (geometry) {
                return geometryRelation(this, 'within', geometry);
            });

            privateProperty(this, 'withinOrCovers', function (geometry) {
                return (geometryRelation(this, 'within', geometry) ||
                    (geometryRelation(this, 'intersects', geometry) && geometryArea(geometryManipulation(this, 'difference', geometry)) < 0.001));
            });

            privateProperty(this, 'subtract', function (geometry) {
                var geom = saveGeometryManipulation(this, 'difference', geometry);

                if (geometryArea(geom) == 0) {
                    this.geometry = undefined;
                }
            });

            privateProperty(this, 'add', function (geometry) {
                saveGeometryManipulation(this, 'union', geometry);
            });

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.id = attrs.id || attrs.$id;
            this.data = attrs.data;
            this.code = attrs.code;
            this.comments = attrs.comments;
            this.createdAt = attrs.createdAt;
            this.createdBy = attrs.createdBy;
            this.geometry = attrs.geometry;
            this.name = attrs.name;
            this.organizationId = attrs.organizationId;
            this.layerId = attrs.layerId;
            this.type = attrs.type;
            this.updatedAt = attrs.updatedAt;
            this.updatedBy = attrs.updatedBy;

            this.organization = attrs.organization;
            this.layer = attrs.layer;
        }

        inheritModel(Sublayer, Model.Base);

        privateProperty(Sublayer, 'listMap', function (item) {
            return {
                title: item.name,
                subtitle: item.layer.province + (item.code ? ' - ' + item.code : ''),
                layer: item.layer.name
            }
        });

        function geometryArea (geometry) {
            return (geometry && geometry.getArea());
        }

        function geometryEmpty (geometry) {
            return (geometry && geometry.isEmpty());
        }

        function geometryRelation (instance, relation, geometry) {
            var geom = instance.geom;

            return (geom && geometry && geom[relation] ? geom[relation](geometry) : false);
        }

        function geometryManipulation (instance, manipulation, geometry) {
            var geom = instance.geom;

            return (geom && geometry && geom[manipulation] ? geom[manipulation](geometry) : geom);
        }

        function saveGeometryManipulation (instance, manipulation, geometry) {
            var geom = geometryManipulation(instance, manipulation, geometry);

            if (geom) {
                instance.$dirty = true;
                instance.geometry = topologyHelper.writeGeoJSON(geom);
            }

            return geom;
        }

        Sublayer.validates({
            data: {
                required: false,
                object: true
            },
            code: {
                required: false,
                length: {
                    min: 0,
                    max: 255
                }
            },
            comments: {
                required: false,
                length: {
                    min: 0,
                    max: 255
                }
            },
            geometry: {
                required: true,
                object: true
            },
            layerId: {
                required: true,
                numeric: true
            },
            name: {
                required: true,
                length: {
                    min: 1,
                    max: 255
                }
            },
            organizationId: {
                required: false,
                numeric: true
            },
            type: {
                required: true,
                length: {
                    min: 1,
                    max: 255
                }
            }
        });

        return Sublayer;
    }]);

var sdkModelLegalEntity = angular.module('ag.sdk.model.legal-entity', ['ag.sdk.library', 'ag.sdk.model.base', 'ag.sdk.model.asset', 'ag.sdk.model.liability']);

sdkModelLegalEntity.factory('LegalEntity', ['Base', 'Asset', 'Financial', 'inheritModel', 'Liability', 'Model', 'readOnlyProperty', 'underscore',
    function (Base, Asset, Financial, inheritModel, Liability, Model, readOnlyProperty, underscore) {
        function LegalEntity (attrs) {
            Model.Base.apply(this, arguments);

            this.data = (attrs && attrs.data ? attrs.data : {});
            Base.initializeObject(this.data, 'attachments', []);

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.id = attrs.id || attrs.$id;
            this.addressCity = attrs.addressCity;
            this.addressCode = attrs.addressCode;
            this.addressDistrict = attrs.addressDistrict;
            this.addressStreet = attrs.addressStreet;
            this.cifKey = attrs.cifKey;
            this.contactName = attrs.contactName;
            this.email = attrs.email;
            this.fax = attrs.fax;
            this.isActive = attrs.isActive;
            this.isPrimary = attrs.isPrimary;
            this.mobile = attrs.mobile;
            this.name = attrs.name;
            this.organizationId = attrs.organizationId;
            this.registrationNumber = attrs.registrationNumber;
            this.telephone = attrs.telephone;
            this.type = attrs.type;
            this.uuid = attrs.uuid;

            this.assets = underscore.map(attrs.assets, Asset.newCopy);

            this.financials = underscore.map(attrs.financials, Financial.newCopy);

            this.liabilities = underscore.map(attrs.liabilities, Liability.newCopy);
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

var sdkModelLiability = angular.module('ag.sdk.model.liability', ['ag.sdk.library', 'ag.sdk.utilities', 'ag.sdk.model.base']);

sdkModelLiability.factory('Liability', ['computedProperty', 'inheritModel', 'Model', 'moment', 'privateProperty', 'readOnlyProperty', 'safeArrayMath', 'safeMath', 'underscore',
    function (computedProperty, inheritModel, Model, moment, privateProperty, readOnlyProperty, safeArrayMath, safeMath, underscore) {
        var _frequency = {
            'monthly': 12,
            'bi-monthly': 24,
            'quarterly': 4,
            'bi-yearly': 2,
            'yearly': 1
        };

        var _types = {
            'short-term': 'Short-term',
            'medium-term': 'Medium-term',
            'long-term': 'Long-term',
            'production-credit': 'Production Credit',
            'rent': 'Rent'
        };

        var _typesWithInstallmentPayments = ['short-term', 'medium-term', 'long-term', 'rent'];
        var _typesWithAmount = ['short-term', 'medium-term', 'long-term'];
        var _typesWithName = ['production-credit', 'other'];

        function defaultMonth () {
            return {
                opening: 0,
                repayment: {},
                withdrawal: 0,
                balance: 0,
                interest: 0,
                closing: 0
            }
        }

        function initializeMonthlyTotals (instance, monthlyData, upToIndex) {
            while (monthlyData.length <= upToIndex) {
                monthlyData.push(defaultMonth());
            }

            recalculateMonthlyTotals(instance, monthlyData);
        }

        function recalculateMonthlyTotals (instance, monthlyData) {
            var startMonth = moment(instance.startDate, 'YYYY-MM-DD').month(),
                paymentMonths = instance.paymentMonths,
                paymentsPerMonth = (_frequency[instance.frequency] > 12 ? _frequency[instance.frequency] / 12 : 1);

            underscore.each(monthlyData, function (month, index) {
                var currentMonth = (index + startMonth) % 12;

                month.opening = (index === 0 ? instance.getLiabilityOpening() : monthlyData[index - 1].closing);

                if ((this.frequency === 'once' && index === 0) || (instance.installmentPayment > 0 && underscore.contains(paymentMonths, currentMonth))) {
                    var installmentPayment = (this.frequency === 'once' ? month.opening : safeMath.times(instance.installmentPayment, paymentsPerMonth));

                    if (instance.type === 'rent') {
                        month.repayment.bank = installmentPayment;
                    } else if (month.opening > 0) {
                        month.repayment.bank = (month.opening <= installmentPayment ? month.opening : installmentPayment);
                    }
                }

                month.balance = safeMath.round(Math.max(0, safeMath.minus(safeMath.plus(month.opening, month.withdrawal), safeArrayMath.reduce(month.repayment))), 2);
                month.interest = safeMath.round(safeMath.dividedBy(safeMath.times(safeMath.dividedBy(instance.interestRate, 12), month.balance), 100), 2);
                month.closing = safeMath.round((month.balance === 0 ? 0 : safeMath.plus(month.balance, month.interest)), 2);
            });
        }

        function liabilityInMonth (instance, month) {
            var startMonth = moment(instance.offsetDate, 'YYYY-MM-DD'),
                currentMonth = moment(month, 'YYYY-MM-DD'),
                appliedMonth = currentMonth.diff(startMonth, 'months');

            var monthlyData = angular.copy(instance.data.monthly || []);
            initializeMonthlyTotals(instance, monthlyData, appliedMonth);

            return monthlyData[appliedMonth] || defaultMonth();
        }

        function Liability (attrs) {
            Model.Base.apply(this, arguments);

            this.data = (attrs && attrs.data) || {};

            computedProperty(this, 'title', function () {
                return this.name || this.category;
            });

            computedProperty(this, 'paymentMonths', function () {
                var paymentsPerYear = _frequency[this.frequency],
                    firstPaymentMonth = (underscore.isUndefined(this.data.month) ? moment(this.offsetDate, 'YYYY-MM-DD').month() : this.data.month);

                return underscore
                    .range(firstPaymentMonth, firstPaymentMonth + 12, (paymentsPerYear < 12 ? 12 / paymentsPerYear : 1))
                    .map(function (value) {
                        return value % 12;
                    })
                    .sort(function (a, b) {
                        return a - b;
                    });
            });

            computedProperty(this, 'offsetDate', function () {
                return (this.startDate && this.openingDate ?
                    (moment(this.startDate).isBefore(this.openingDate) ? this.openingDate : this.startDate) :
                    (this.startDate ? this.startDate : this.openingDate));
            });

            /**
             * Get liability/balance in month
             */
            privateProperty(this, 'liabilityInMonth', function (month) {
                return liabilityInMonth(this, month);
            });

            privateProperty(this, 'balanceInMonth', function (month) {
                return this.liabilityInMonth(month).closing || 0;
            });

            computedProperty(this, 'currentBalance', function () {
                return (this.type !== 'rent' ? this.balanceInMonth(moment().startOf('month')) : 0);
            });

            privateProperty(this, 'recalculate', function () {
                this.data.monthly = this.data.monthly || [];

                recalculateMonthlyTotals(this, this.data.monthly);
            });

            /**
             * Set/add repayment/withdrawal in month
             */
            privateProperty(this, 'resetWithdrawalAndRepayments', function () {
                this.data.monthly = [];
            });

            privateProperty(this, 'resetRepayments', function () {
                underscore.each(this.data.monthly, function (month) {
                    month.repayment = {};
                });

                recalculateMonthlyTotals(this, this.data.monthly);
            });

            privateProperty(this, 'resetWithdrawals', function () {
                underscore.each(this.data.monthly, function (month) {
                    month.withdrawal = 0;
                });

                recalculateMonthlyTotals(this, this.data.monthly);
            });

            privateProperty(this, 'resetWithdrawalsInRange', function (rangeStart, rangeEnd) {
                var startMonth = moment(this.offsetDate, 'YYYY-MM-DD'),
                    appliedStartMonth = moment(rangeStart, 'YYYY-MM-DD').diff(startMonth, 'months'),
                    appliedEndMonth = moment(rangeEnd, 'YYYY-MM-DD').diff(startMonth, 'months');

                this.data.monthly = this.data.monthly || [];

                appliedStartMonth = (appliedStartMonth < 0 ? 0 : appliedStartMonth);
                appliedEndMonth = (appliedEndMonth > this.data.monthly.length ? this.data.monthly.length : appliedEndMonth);

                for (var i = appliedStartMonth; i < appliedEndMonth; i++) {
                    this.data.monthly[i].withdrawal = 0;
                }

                recalculateMonthlyTotals(this, this.data.monthly);
            });

            privateProperty(this, 'addRepaymentInMonth', function (repayment, month, source) {
                var startMonth = moment(this.offsetDate, 'YYYY-MM-DD'),
                    currentMonth = moment(month, 'YYYY-MM-DD'),
                    appliedMonth = currentMonth.diff(startMonth, 'months');

                source = source || 'bank';

                var repaymentRemainder = repayment;

                // applied month is not before the offsetDate, add repayment and do calculation
                if(appliedMonth > -1) {
                    this.data.monthly = this.data.monthly || [];
                    initializeMonthlyTotals(this, this.data.monthly, appliedMonth);

                    var monthLiability = this.data.monthly[appliedMonth],
                        summedRepayment = safeArrayMath.reduce(monthLiability.repayment),
                        openingPlusBalance = safeMath.minus(safeMath.plus(monthLiability.opening, monthLiability.withdrawal), summedRepayment),
                        limitedRepayment = (openingPlusBalance <= repayment ? openingPlusBalance : repayment);

                    repaymentRemainder = safeMath.round(safeMath.minus(repayment, limitedRepayment), 2);
                    monthLiability.repayment[source] = safeMath.plus(monthLiability.repayment[source], limitedRepayment);

                    recalculateMonthlyTotals(this, this.data.monthly);
                }
                // applied month is before the offsetDate, do nothing

                return repaymentRemainder;
            });

            privateProperty(this, 'setRepaymentInMonth', function (repayment, month, source) {
                var startMonth = moment(this.offsetDate, 'YYYY-MM-DD'),
                    currentMonth = moment(month, 'YYYY-MM-DD'),
                    appliedMonth = currentMonth.diff(startMonth, 'months');

                source = source || 'bank';

                var repaymentRemainder = repayment;

                // applied month is not before the offsetDate, add repayment and do calculation
                if(appliedMonth > -1) {
                    this.data.monthly = this.data.monthly || [];
                    initializeMonthlyTotals(this, this.data.monthly, appliedMonth);

                    var monthLiability = this.data.monthly[appliedMonth],
                        repaymentWithoutSource = underscore.reduce(monthLiability.repayment, function (total, amount, repaymentSource) {
                            return total + (repaymentSource === source ? 0 : amount || 0)
                        }, 0),
                        openingPlusBalance = safeMath.minus(safeMath.plus(monthLiability.opening, monthLiability.withdrawal), repaymentWithoutSource),
                        limitedRepayment = (openingPlusBalance <= repayment ? openingPlusBalance : repayment);

                    repaymentRemainder = safeMath.round(safeMath.minus(repayment, limitedRepayment), 2);
                    monthLiability.repayment[source] = limitedRepayment;

                    recalculateMonthlyTotals(this, this.data.monthly);
                }
                // applied month is before the offsetDate, do nothing

                return repaymentRemainder;
            });

            privateProperty(this, 'removeRepaymentInMonth', function (month, source) {
                source = source || 'bank';

                underscore.each(this.data.monthly, function (item, key) {
                    if (month === key) {
                        delete item.repayment[source];
                    }
                });

                recalculateMonthlyTotals(this, this.data.monthly);
            });

            privateProperty(this, 'addWithdrawalInMonth', function (withdrawal, month) {
                var startMonth = moment(this.offsetDate, 'YYYY-MM-DD'),
                    currentMonth = moment(month, 'YYYY-MM-DD'),
                    appliedMonth = currentMonth.diff(startMonth, 'months');

                // applied month is not before the offsetDate, add withdrawal and do calculation
                if(appliedMonth > -1) {
                    this.data.monthly = this.data.monthly || [];
                    initializeMonthlyTotals(this, this.data.monthly, appliedMonth);

                    var monthLiability = this.data.monthly[appliedMonth],
                        summedWithdrawal = safeMath.plus(withdrawal, monthLiability.withdrawal),
                        openingMinusRepayment = safeMath.minus(monthLiability.opening, safeArrayMath.reduce(monthLiability.repayment)),
                        limitedWithdrawal = (this.creditLimit > 0 ? Math.min(Math.max(0, safeMath.minus(this.creditLimit, openingMinusRepayment)), summedWithdrawal) : summedWithdrawal),
                        withdrawalRemainder = safeMath.round(safeMath.minus(summedWithdrawal, limitedWithdrawal), 2);

                    monthLiability.withdrawal = limitedWithdrawal;

                    recalculateMonthlyTotals(this, this.data.monthly);
                }
                // applied month is before the offsetDate, do nothing

                return withdrawalRemainder;
            });

            privateProperty(this, 'setWithdrawalInMonth', function (withdrawal, month) {
                var startMonth = moment(this.offsetDate, 'YYYY-MM-DD'),
                    currentMonth = moment(month, 'YYYY-MM-DD'),
                    appliedMonth = currentMonth.diff(startMonth, 'months');

                // applied month is not before the offsetDate, add withdrawal and do calculation
                if(appliedMonth > -1) {
                    this.data.monthly = this.data.monthly || [];
                    initializeMonthlyTotals(this, this.data.monthly, appliedMonth);

                    var monthLiability = this.data.monthly[appliedMonth],
                        openingMinusRepayment = safeMath.minus(monthLiability.opening, safeArrayMath.reduce(monthLiability.repayment)),
                        limitedWithdrawal = (this.creditLimit > 0 ? Math.min(Math.max(0, safeMath.minus(this.creditLimit, openingMinusRepayment)), withdrawal) : withdrawal),
                        withdrawalRemainder = safeMath.round(safeMath.minus(withdrawal, limitedWithdrawal), 2);

                    monthLiability.withdrawal = limitedWithdrawal;

                    recalculateMonthlyTotals(this, this.data.monthly);
                }
                // applied month is before the offsetDate, do nothing

                return withdrawalRemainder;
            });

            /**
             * Ranges of liability
             */
            privateProperty(this, 'liabilityInRange', function (rangeStart, rangeEnd) {
                var startMonth = moment(this.offsetDate, 'YYYY-MM-DD'),
                    rangeStartMonth = moment(rangeStart, 'YYYY-MM-DD'),
                    rangeEndMonth = moment(rangeEnd, 'YYYY-MM-DD'),
                    appliedStartMonth = rangeStartMonth.diff(startMonth, 'months'),
                    appliedEndMonth = rangeEndMonth.diff(startMonth, 'months'),
                    paddedOffset = (appliedStartMonth < 0 ? Math.min(rangeEndMonth.diff(rangeStartMonth, 'months'), Math.abs(appliedStartMonth)) : 0);

                var monthlyData = angular.copy(this.data.monthly || []);
                initializeMonthlyTotals(this, monthlyData, appliedEndMonth);

                return underscore.range(paddedOffset)
                    .map(defaultMonth)
                    .concat(monthlyData.slice(appliedStartMonth + paddedOffset, appliedEndMonth));
            });

            privateProperty(this, 'totalLiabilityInRange', function (rangeStart, rangeEnd) {
                return underscore.reduce(this.liabilityInRange(rangeStart, rangeEnd), function (total, liability) {
                    return safeMath.plus(total, (typeof liability.repayment == 'number' ? liability.repayment : safeArrayMath.reduce(liability.repayment)));
                }, 0);
            });

            privateProperty(this, 'getLiabilityOpening', function () {
                return (moment(this.startDate).isBefore(this.openingDate) && !underscore.isUndefined(this.openingBalance) ? this.openingBalance : this.amount) || 0;
            });

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.id = attrs.id || attrs.$id;
            this.uuid = attrs.uuid;
            this.merchantUuid = attrs.merchantUuid;
            this.name = attrs.name;
            this.type = attrs.type;
            this.category = attrs.category;
            this.openingBalance = attrs.openingBalance;
            this.installmentPayment = attrs.installmentPayment;
            this.interestRate = attrs.interestRate || 0;
            this.creditLimit = attrs.creditLimit;
            this.frequency = attrs.frequency;
            this.startDate = attrs.startDate && moment(attrs.startDate).format('YYYY-MM-DD');
            this.endDate = attrs.endDate && moment(attrs.endDate).format('YYYY-MM-DD');
            this.openingDate = attrs.openingDate && moment(attrs.openingDate).format('YYYY-MM-DD') || this.startDate;
            this.amount = attrs.amount || this.openingBalance;

            // TODO: Add merchant model
            this.merchant = attrs.merchant;
        }

        inheritModel(Liability, Model.Base);

        readOnlyProperty(Liability, 'frequencyTypes', {
            'once': 'One Time',
            'bi-monthly': 'Bi-Monthly',
            'monthly': 'Monthly',
            'quarterly': 'Quarterly',
            'bi-yearly': 'Bi-Annually',
            'yearly': 'Annually'
        });

        readOnlyProperty(Liability, 'frequencyTypesWithCustom', underscore.extend({
            'custom': 'Custom'
        }, Liability.frequencyTypes));

        privateProperty(Liability, 'getFrequencyTitle', function (type) {
            return Liability.frequencyTypesWithCustom[type] || '';
        });

        readOnlyProperty(Liability, 'liabilityTypes', _types);

        readOnlyProperty(Liability, 'liabilityTypesWithOther', underscore.extend({
            'other': 'Other'
        }, Liability.liabilityTypes));

        privateProperty(Liability, 'getTypeTitle', function (type) {
            return Liability.liabilityTypesWithOther[type] || '';
        });

        privateProperty(Liability, 'getLiabilityInMonth', function (liability, month) {
            return liabilityInMonth(Liability.newCopy(liability), month);
        });

        readOnlyProperty(Liability, 'liabilityCategories', {
            'long-term': ['Bonds', 'Loans', 'Other'],
            'medium-term': ['Terms Loans', 'Instalment Sale Credit', 'Leases', 'Other'],
            'short-term': ['Bank', 'Co-operative', 'Creditors', 'Income Tax', 'Bills Payable', 'Portion of Term Commitments', 'Other'],
            'production-credit': ['Off Taker', 'Input Supplier', 'Input Financing']
        });

        function isLeased (value, instance, field) {
            return instance.type === 'rent';
        }

        function isOtherType (value, instance, field) {
            return instance.type === 'other';
        }

        function hasCategory (value, instance, field) {
            return !underscore.isEmpty(Liability.liabilityCategories[instance.type]);
        }

        Liability.validates({
            amount: {
                requiredIf: function (value, instance, field) {
                    return !isLeased(value, instance, field);
                },
                numeric: true
            },
            openingBalance: {
                required: true,
                numeric: true
            },
            installmentPayment: {
                requiredIf: function (value, instance, field) {
                    return underscore.contains(_typesWithInstallmentPayments, instance.type) &&
                        (instance.type !== 'production-credit' && !angular.isNumber(instance.interestRate));
                },
                range: {
                    from: 0
                },
                numeric: true
            },
            interestRate: {
                required: true,
                range: {
                    from: 0,
                    to: 100
                },
                numeric: true
            },
            creditLimit: {
                requiredIf: function (value, instance, field) {
                    return (instance.type === 'production-credit' && instance.data.category === 'Input Financing') ||
                        (instance.type !== 'production-credit' && !angular.isNumber(instance.installmentPayment));
                },
                range: {
                    from: 0
                },
                numeric: true
            },
            merchantUuid: {
                requiredIf: function (value, instance, field) {
                    return !isOtherType(value, instance, field);
                },
                format: {
                    uuid: true
                }
            },
            frequency: {
                required: true,
                inclusion: {
                    in: underscore.keys(Liability.frequencyTypesWithCustom)
                }
            },
            type: {
                required: true,
                inclusion: {
                    in: underscore.keys(Liability.liabilityTypesWithOther)
                }
            },
            category: {
                requiredIf: hasCategory,
                inclusion: {
                    in: function (value, instance, field) {
                        return Liability.liabilityCategories[instance.type];
                    }
                }
            },
            data: {
                required: true,
                object: true
            },
            name: {
                requiredIf: function (value, instance, field) {
                    return underscore.contains(_typesWithName, instance.type);
                },
                length: {
                    min: 1,
                    max: 255
                }
            },
            startDate: {
                required: true,
                format: {
                    date: true
                }
            },
            openingDate: {
                required: false,
                format: {
                    date: true
                }
            },
            endDate: {
                requiredIf: function (value, instance, field) {
                    return isLeased(value, instance, field) || instance.type === 'custom';
                },
                format: {
                    date: true
                }
            }
        });

        return Liability;
    }]);

var sdkModelMapTheme = angular.module('ag.sdk.model.map-theme', ['ag.sdk.library', 'ag.sdk.model.base']);

sdkModelMapTheme.factory('MapTheme', ['Base', 'inheritModel', 'Model', 'privateProperty', 'readOnlyProperty', 'underscore',
    function (Base, inheritModel, Model, privateProperty, readOnlyProperty, underscore) {
        function MapTheme (attrs) {
            Model.Base.apply(this, arguments);

            this.data = (attrs && attrs.data) || {};
            Base.initializeObject(this.data, 'categories', []);

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.id = attrs.id || attrs.$id;
            this.createdAt = attrs.createdAt;
            this.createdBy = attrs.createdBy;
            this.name = attrs.name;
            this.organizationId = attrs.organizationId;
            this.updatedAt = attrs.updatedAt;
            this.updatedBy = attrs.updatedBy;

            // Models
            this.organization = attrs.organization;

            checkVersion(this);
        }

        function checkVersion(instance) {
            switch (instance.data.version) {
                case undefined:
                    instance.data = underscore.extend({
                        baseStyle: (instance.data.baseTile && MapTheme.baseStyles[instance.data.baseTile] ? instance.data.baseTile : 'Agriculture'),
                        categories: instance.data.categories,
                        center: instance.data.center,
                        zoom: {
                            value: instance.data.zoom
                        }
                    }, MapTheme.baseStyles[instance.data.baseTile] || MapTheme.baseStyles['Agriculture']);
            }

            instance.data.version = MapTheme.version;
        }

        inheritModel(MapTheme, Model.Base);

        readOnlyProperty(MapTheme, 'version', 1);

        readOnlyProperty(MapTheme, 'baseStyles', {
            'Agriculture': {
                style: 'mapbox://styles/agrista/cjdmrq0wu0iq02so2sevccwlm',
                sources: [],
                layers: []
            },
            'Satellite': {
                style: 'mapbox://styles/agrista/cjdmt8w570l3r2sql91xzgmbn',
                sources: [],
                layers: []
            },
            'Light': {
                style: 'mapbox://styles/agrista/cjdmt9c8q0mr02srgvyfo2qwg',
                sources: [],
                layers: []
            },
            'Dark': {
                style: 'mapbox://styles/agrista/cjdmt9w8d0o8x2so2xpcu4mm0',
                sources: [],
                layers: []
            }
        });

        MapTheme.validates({
            data: {
                required: true,
                object: true
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
            }
        });

        return MapTheme;
    }]);

var sdkModelProductionSchedule = angular.module('ag.sdk.model.production-schedule', ['ag.sdk.library', 'ag.sdk.utilities', 'ag.sdk.model']);

sdkModelProductionSchedule.factory('ProductionGroup', ['Base', 'computedProperty', 'EnterpriseBudgetBase', 'inheritModel', 'moment', 'naturalSort', 'privateProperty', 'ProductionSchedule', 'safeArrayMath', 'safeMath', 'underscore',
    function (Base, computedProperty, EnterpriseBudgetBase, inheritModel, moment, naturalSort, privateProperty, ProductionSchedule, safeArrayMath, safeMath, underscore) {
        function ProductionGroup (attrs, options) {
            options = options || {};

            EnterpriseBudgetBase.apply(this, arguments);

            Base.initializeObject(this.data, 'details', {});
            Base.initializeObject(this.data.details, 'grossProfit', 0);
            Base.initializeObject(this.data.details, 'size', 0);

            this.commodities = [];
            this.productionSchedules = [];

            privateProperty(this, 'addProductionSchedule', function (productionSchedule) {
                if (!options.manualDateRange) {
                    if (underscore.isUndefined(this.startDate) || moment(productionSchedule.startDate).isBefore(this.startDate)) {
                        this.startDate = moment(productionSchedule.startDate).format('YYYY-MM-DD');
                    }

                    if (underscore.isUndefined(this.endDate) || moment(productionSchedule.endDate).isAfter(this.endDate)) {
                        this.endDate = moment(productionSchedule.endDate).format('YYYY-MM-DD');
                    }

                    addProductionSchedule(this, productionSchedule);
                } else if (productionSchedule.inDateRange(this.startDate, this.endDate)) {
                    addProductionSchedule(this, productionSchedule);
                }
            });

            computedProperty(this, 'options', function () {
                return options;
            });

            // Stock
            privateProperty(this, 'addStock', function (stock) {
                addStock(this, stock);
            });

            privateProperty(this, 'replaceAllStock', function (stock) {
                replaceAllStock(this, stock);
            });

            privateProperty(this, 'removeStock', function (stock) {
                removeStock(this, stock);
            });

            // Categories
            privateProperty(this, 'adjustCategory', function (sectionCode, categoryQuery, costStage, property) {
                return adjustCategory(this, sectionCode, categoryQuery, costStage, property);
            });

            privateProperty(this, 'getCategory', function (sectionCode, categoryQuery, costStage) {
                return underscore.chain(this.getSections(sectionCode, costStage))
                    .pluck('productCategoryGroups')
                    .flatten()
                    .pluck('productCategories')
                    .flatten()
                    .findWhere(categoryQuery)
                    .value();
            });

            privateProperty(this, 'getCategoryOptions', function (sectionCode) {
                return underscore.chain(this.productionSchedules)
                    .map(function (productionSchedule) {
                        return productionSchedule.getCategoryOptions(sectionCode);
                    })
                    .reduce(function (categoryOptions, categoryGroup) {
                        return underscore.extend(categoryOptions || {}, categoryGroup);
                    }, {})
                    .value();
            });

            privateProperty(this, 'addCategory', function (sectionCode, groupName, categoryQuery, costStage) {
                return addCategory(this, sectionCode, groupName, categoryQuery, costStage);
            });

            privateProperty(this, 'removeCategory', function (sectionCode, groupName, categoryCode, costStage) {
                removeCategory(this, sectionCode, groupName, categoryCode, costStage);
            });

            privateProperty(this, 'recalculate', function () {
                recalculateProductionGroup(this);
            });

            privateProperty(this, 'recalculateCategory', function (sectionCode, groupName, categoryQuery, costStage) {
                recalculateProductionGroupCategory(this, sectionCode, groupName, categoryQuery, costStage);
            });
            
            computedProperty(this, 'allocatedSize', function () {
                return safeMath.round(this.data.details.size || 0, 2);
            });

            computedProperty(this, 'numberOfMonths', function () {
                return moment(this.endDate).diff(this.startDate, 'months');
            });

            computedProperty(this, 'startDateOffset', function () {
                return Math.max(0, moment(underscore.chain(this.productionSchedules)
                    .sortBy(function (productionSchedule) {
                        return moment(productionSchedule.startDate).unix();
                    })
                    .pluck('startDate')
                    .first()
                    .value()).diff(this.startDate, 'months'));
            });

            computedProperty(this, 'endDateOffset', function () {
                return safeMath.minus(this.numberOfMonths - 1, Math.max(0, moment(this.endDate).diff(underscore.chain(this.productionSchedules)
                    .sortBy(function (productionSchedule) {
                        return moment(productionSchedule.endDate).unix();
                    })
                    .pluck('endDate')
                    .last()
                    .value(), 'months')));
            });

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            if (options.startDate && options.endDate) {
                options.manualDateRange = true;
                this.startDate = moment(options.startDate).format('YYYY-MM-DD');
                this.endDate = moment(options.endDate).format('YYYY-MM-DD');
            } else {
                this.startDate = attrs.startDate && moment(attrs.startDate).format('YYYY-MM-DD');
                this.endDate = attrs.endDate && moment(attrs.endDate).format('YYYY-MM-DD');
            }

            this.replaceAllStock(attrs.stock || []);

            underscore.each(attrs.productionSchedules, this.addProductionSchedule, this);

            this.recalculate();
        }

        inheritModel(ProductionGroup, EnterpriseBudgetBase);

        function addProductionSchedule (instance, productionSchedule) {
            instance.productionSchedules.push(productionSchedule);
            instance.commodities = underscore.chain(instance.commodities)
                .union([productionSchedule.commodityType])
                .uniq()
                .value()
                .sort(naturalSort);

            instance.data.details.size = safeArrayMath.reduceProperty(instance.productionSchedules, 'allocatedSize');

            productionSchedule.replaceAllStock(instance.stock);
        }

        // Stock
        function addStock (instance, stock) {
            if (stock && underscore.isArray(stock.data.ledger)) {
                instance.stock = underscore.chain(instance.stock)
                    .reject(function (item) {
                        return item.assetKey === stock.assetKey;
                    })
                    .union([stock])
                    .value();

                underscore.each(instance.productionSchedules, function (productionSchedule) {
                    productionSchedule.addStock(stock);
                });
            }
        }

        function replaceAllStock (instance, stock) {
            instance.stock = underscore.filter(stock, function (item) {
                return item && underscore.isArray(item.data.ledger);
            });

            underscore.each(instance.productionSchedules, function (productionSchedule) {
                productionSchedule.replaceAllStock(stock);
            });
        }

        function removeStock (instance, stock) {
            instance.stock = underscore.chain(instance.stock)
                .reject(function (item) {
                    return item.assetKey === stock.assetKey;
                })
                .value();

            underscore.each(instance.productionSchedules, function (productionSchedule) {
                productionSchedule.removeStock(stock);
            });
        }

        // Categories
        function addCategory (instance, sectionCode, groupName, categoryQuery, costStage) {
            var category = instance.getCategory(sectionCode, categoryQuery, costStage);

            if (underscore.isUndefined(category)) {
                var group = instance.addGroup(sectionCode, instance.findGroupNameByCategory(sectionCode, groupName, categoryQuery.code), costStage);

                category = underscore.extend({
                    quantity: 0,
                    value: 0
                }, EnterpriseBudgetBase.categories[categoryQuery.code]);

                // WA: Modify enterprise budget model to specify input costs as "per ha"
                if (sectionCode === 'EXP') {
                    category.unit = 'Total'
                }

                if (categoryQuery.name) {
                    category.name = categoryQuery.name;
                }

                category.per = (instance.assetType === 'livestock' ? 'LSU' : 'ha');

                if (this.assetType === 'livestock') {
                    var conversionRate = instance.getConversionRate(category.name);

                    if (conversionRate) {
                        category.conversionRate = conversionRate;
                    }

                    category.valuePerLSU = 0;
                }

                group.productCategories = underscore.union(group.productCategories, [category])
                    .sort(function (categoryA, categoryB) {
                        return (instance.assetType === 'livestock' && sectionCode === 'INC' ?
                            naturalSort(EnterpriseBudgetBase.getCategorySortKey(categoryA.name), EnterpriseBudgetBase.getCategorySortKey(categoryB.name)) :
                            naturalSort(categoryA.name, categoryB.name));
                    });
                instance.setCache([category.code, costStage], category);
            }

            return category;
        }

        function removeCategory (instance, sectionCode, groupName, categoryQuery, costStage) {
            groupName = instance.findGroupNameByCategory(sectionCode, groupName, categoryQuery.code);

            var group = instance.getGroup(sectionCode, groupName, costStage);

            if (group) {
                group.productCategories = underscore.reject(group.productCategories, function (category) {
                    return underscore.every(categoryQuery, function (value, key) {
                        return category[key] === value;
                    });
                });

                instance.resetCache([categoryQuery.code, costStage]);
            }
        }

        function adjustCategory (instance, sectionCode, categoryQuery, costStage, property) {
            var productionGroupCategory = instance.getCategory(sectionCode, categoryQuery, costStage),
                oldValue = 0;

            if (productionGroupCategory && !underscore.isUndefined(productionGroupCategory[property])) {
                var categorySchedules = underscore.chain(instance.productionSchedules)
                    .filter(function (productionSchedule) {
                        return underscore.some(productionGroupCategory.categories, function (category) {
                            return productionSchedule.scheduleKey === category.scheduleKey;
                        });
                    })
                    .uniq(false, function (productionSchedule) {
                        return productionSchedule.scheduleKey;
                    })
                    .indexBy('scheduleKey')
                    .value();

                var uniqueBudgets = underscore.chain(categorySchedules)
                    .pluck('budget')
                    .uniq(false, underscore.iteratee('uuid'))
                    .value();

                var propertyMap = {
                    quantity: 'quantityPerMonth',
                    value: 'valuePerMonth',
                    quantityPerHa: 'quantity',
                    valuePerHa: 'value'
                }, mappedProperty = propertyMap[property] || property;

                switch (property) {
                    case 'stock':
                        underscore.each(categorySchedules, function (productionSchedule) {
                            productionSchedule.adjustCategory(sectionCode, categoryQuery, productionSchedule.costStage, property);
                        });
                        break;
                    case 'quantity':
                    case 'value':
                        oldValue = safeMath.round(safeArrayMath.reduce(productionGroupCategory[mappedProperty]), 2);

                        if (oldValue === 0) {
                            var totalCategories = safeArrayMath.reduce(productionGroupCategory.categoriesPerMonth);

                            productionGroupCategory[mappedProperty] = underscore.reduce(productionGroupCategory.categoriesPerMonth, function (result, value, index) {
                                result[index] = safeMath.dividedBy(safeMath.times(value, productionGroupCategory[property]), totalCategories);

                                return result;
                            }, Base.initializeArray(instance.numberOfMonths));

                            property = mappedProperty;
                        } else {
                            underscore.each(categorySchedules, function (productionSchedule) {
                                var productionCategory = productionSchedule.getCategory(sectionCode, categoryQuery.code, productionSchedule.costStage);

                                if (productionCategory) {
                                    productionCategory[property] = safeMath.dividedBy(safeMath.times(productionCategory[property], productionGroupCategory[property]), oldValue);

                                    productionSchedule.adjustCategory(sectionCode, categoryQuery, productionSchedule.costStage, property);
                                }
                            });
                        }
                        break;
                    case 'quantityPerHa':
                    case 'valuePerHa':
                        oldValue = safeMath.round(safeMath.dividedBy(safeArrayMath.reduce(productionGroupCategory[mappedProperty + 'PerHaPerMonth']), safeArrayMath.count(productionGroupCategory[mappedProperty + 'PerHaPerMonth'])), 2);

                        productionGroupCategory[mappedProperty + 'PerHaPerMonth'] = underscore.reduce(productionGroupCategory[mappedProperty + 'PerHaPerMonth'], function (valuePerHaPerMonth, value, index) {
                            valuePerHaPerMonth[index] = (oldValue === 0 ?
                                safeMath.dividedBy(productionGroupCategory[property], uniqueBudgets.length) :
                                safeMath.dividedBy(safeMath.times(value, productionGroupCategory[property]), oldValue));
                            return valuePerHaPerMonth;
                        }, Base.initializeArray(instance.numberOfMonths));

                        productionGroupCategory[mappedProperty + 'PerMonth'] = safeArrayMath.round(safeArrayMath.times(productionGroupCategory[mappedProperty + 'PerHaPerMonth'], productionGroupCategory.haPerMonth), 2);
                        property = mappedProperty + 'PerMonth';
                        break;
                }

                if (underscore.contains(['quantityPerMonth', 'valuePerMonth'], property)) {
                    var oldValuePerMonth = underscore.reduce(productionGroupCategory.categories, function (result, category) {
                        return safeArrayMath.plus(result, category[property]);
                    }, Base.initializeArray(instance.numberOfMonths));

                    oldValue = safeArrayMath.reduce(oldValuePerMonth);

                    underscore.each(productionGroupCategory.categories, function (category) {
                        var productionSchedule = categorySchedules[category.scheduleKey],
                            productionCategory = productionSchedule && productionSchedule.getCategory(sectionCode, categoryQuery.code, productionSchedule.costStage);

                        if (productionCategory) {
                            productionCategory[property] = underscore.reduce(productionGroupCategory[property], function (result, value, index) {
                                var indexOffset = index - category.offset;

                                if (indexOffset >= 0 && indexOffset < result.length) {
                                    result[indexOffset] = safeMath.dividedBy(value, productionGroupCategory.categoriesPerMonth[index]);
                                }
                                return result;
                            }, productionCategory[property]);

                            productionSchedule.adjustCategory(sectionCode, categoryQuery, productionSchedule.costStage, property);

                            underscore.each(categorySchedules, function (schedule) {
                                if (schedule.budgetUuid === productionSchedule.budgetUuid && schedule.scheduleKey !== productionSchedule.scheduleKey) {
                                    schedule.recalculateCategory(categoryQuery.code);
                                }
                            });
                        }
                    });
                }

                recalculateProductionGroupCategory(instance, sectionCode, productionGroupCategory.groupBy, categoryQuery, costStage);
            }
        }

        function reduceArrayInRange (offset) {
            return function (totals, value, index) {
                var indexOffset = index + offset;

                if (indexOffset >= 0 && indexOffset < totals.length) {
                    totals[indexOffset] = safeMath.plus(totals[indexOffset], value);
                }

                return totals;
            }
        }

        function recalculateProductionGroup (instance) {
            instance.data.sections = [];
            instance.clearCache();

            underscore.each(instance.productionSchedules, function (productionSchedule) {
                var startOffset = moment(productionSchedule.startDate).diff(instance.startDate, 'months');

                productionSchedule.recalculate();

                underscore.each(productionSchedule.data.sections, function (section) {
                    if (section.costStage === productionSchedule.costStage) {
                        underscore.each(section.productCategoryGroups, function (group) {
                            underscore.each(group.productCategories, function (category) {
                                recalculateCategory(instance, productionSchedule, startOffset, section, group, category);
                            });
                            
                            recalculateGroup(instance, productionSchedule, section, group);
                        });

                        recalculateSection(instance, productionSchedule, section);
                    }
                });
            });

            instance.addSection('INC');
            instance.addSection('EXP');
            instance.sortSections();

            instance.data.details.grossProfit = underscore.reduce(instance.data.sections, function (total, section) {
                return (section.code === 'INC' ? safeMath.plus(total, section.total.value) : safeMath.minus(total, section.total.value));
            }, 0);
        }

        function recalculateProductionGroupCategory (instance, sectionCode, groupName, categoryQuery, costStage) {
            instance.removeCategory(sectionCode, groupName, categoryQuery, costStage);

            underscore.each(instance.productionSchedules, function (productionSchedule) {
                productionSchedule.recalculateCategory(categoryQuery.code);

                underscore.each(productionSchedule.data.sections, function (section) {
                    if (section.costStage === productionSchedule.costStage) {
                        underscore.each(section.productCategoryGroups, function (group) {
                            var category = underscore.findWhere(group.productCategories, categoryQuery);

                            if (category) {
                                var startOffset = moment(productionSchedule.startDate).diff(instance.startDate, 'months');

                                recalculateCategory(instance, productionSchedule, startOffset, section, group, category);
                                recalculateGroup(instance, productionSchedule, section, group);
                                recalculateSection(instance, productionSchedule, section);
                            }
                        });
                    }
                });
            });

            instance.data.details.grossProfit = underscore.reduce(instance.data.sections, function (total, section) {
                return (section.code === 'INC' ? safeMath.plus(total, section.total.value) : safeMath.minus(total, section.total.value));
            }, 0);
        }

        function recalculateSection (instance, productionSchedule, section) {
            var productionSection = instance.getSection(section.code, instance.defaultCostStage);

            if (productionSection) {
                productionSection.total.value = underscore.reduce(productionSection.productCategoryGroups, function (total, group) {
                    return safeMath.plus(total, group.total.value);
                }, 0);

                productionSection.total.valuePerMonth = underscore
                    .chain(productionSection.productCategoryGroups)
                    .pluck('total')
                    .pluck('valuePerMonth')
                    .reduce(function (totalPerMonth, valuePerMonth) {
                        return (totalPerMonth ? underscore.map(valuePerMonth, function (value, index) {
                            return safeMath.plus(totalPerMonth[index], value);
                        }) : angular.copy(valuePerMonth));
                    })
                    .value();

                if (productionSchedule.type === 'livestock') {
                    productionSection.total.valuePerLSU = underscore.reduce(productionSection.productCategoryGroups, function (total, group) {
                        return safeMath.plus(total, group.total.valuePerLSU);
                    }, 0);
                }

                instance.data.details.grossProfit = (productionSection.code === 'INC' ?
                    safeMath.plus(instance.data.details.grossProfit, productionSection.total.value) :
                    safeMath.minus(instance.data.details.grossProfit, productionSection.total.value));
            }
        }

        function recalculateGroup (instance, productionSchedule, section, group) {
            var productionGroup = instance.getGroup(section.code, group.name, instance.defaultCostStage);

            if (productionGroup) {
                productionGroup.total.value = safeArrayMath.reduceProperty(productionGroup.productCategories, 'value');

                productionGroup.total.valuePerMonth = underscore
                    .chain(productionGroup.productCategories)
                    .pluck('valuePerMonth')
                    .reduce(function (totalPerMonth, valuePerMonth) {
                        return (totalPerMonth ? underscore.map(valuePerMonth, function (value, index) {
                            return safeMath.plus(totalPerMonth[index], value);
                        }) : angular.copy(valuePerMonth));
                    })
                    .value();

                if (productionSchedule.type === 'livestock') {
                    productionGroup.total.valuePerLSU = safeArrayMath.reduceProperty(productionGroup.productCategories, 'valuePerLSU');
                }
            }
        }

        function recalculateCategory (instance, productionSchedule, startOffset, section, group, category) {
            var productionGroupCategory = instance.addCategory(section.code, group.name, underscore.pick(category, ['code', 'name']), instance.defaultCostStage),
                stock = instance.findStock(category.name, productionSchedule.data.details.commodity);

            var productionCategory = underscore.extend({
                commodity: productionSchedule.commodityType,
                offset: startOffset,
                scheduleKey: productionSchedule.scheduleKey
            }, category);

            productionGroupCategory.per = category.per;
            productionGroupCategory.categories = productionGroupCategory.categories || [];
            productionGroupCategory.categories.push(productionCategory);

            if (stock) {
                productionGroupCategory.stock = productionGroupCategory.stock || stock;
            }

            productionGroupCategory.categoriesPerMonth = safeArrayMath.plus(underscore.reduce(Base.initializeArray(instance.numberOfMonths, 1), reduceArrayInRange(startOffset), Base.initializeArray(instance.numberOfMonths)), productionGroupCategory.categoriesPerMonth || Base.initializeArray(instance.numberOfMonths));

            // Value
            productionCategory.valuePerMonth = underscore.reduce(category.valuePerMonth, reduceArrayInRange(startOffset), Base.initializeArray(instance.numberOfMonths));
            productionCategory.value = safeMath.round(safeArrayMath.reduce(productionCategory.valuePerMonth), 2);

            productionGroupCategory.valuePerMonth = safeArrayMath.plus(productionCategory.valuePerMonth, productionGroupCategory.valuePerMonth || Base.initializeArray(instance.numberOfMonths));
            productionGroupCategory.value = safeMath.round(safeArrayMath.reduce(productionGroupCategory.valuePerMonth), 2);

            // Quantity
            productionCategory.quantityPerMonth = underscore.reduce(category.quantityPerMonth, reduceArrayInRange(startOffset), Base.initializeArray(instance.numberOfMonths));
            productionCategory.quantity = safeMath.round(safeArrayMath.reduce(productionCategory.quantityPerMonth), 2);

            productionGroupCategory.quantityPerMonth = safeArrayMath.plus(productionCategory.quantityPerMonth, productionGroupCategory.quantityPerMonth || Base.initializeArray(instance.numberOfMonths));
            productionGroupCategory.quantity = safeMath.round(safeArrayMath.reduce(productionGroupCategory.quantityPerMonth), 2);

            // Supply
            if (productionCategory.supplyPerMonth) {
                productionCategory.supplyPerMonth = underscore.reduce(category.supplyPerMonth, reduceArrayInRange(startOffset), Base.initializeArray(instance.numberOfMonths));
                productionCategory.supply = safeMath.round(safeArrayMath.reduce(productionCategory.supplyPerMonth), 2);

                productionGroupCategory.supplyPerMonth = safeArrayMath.plus(productionCategory.supplyPerMonth, productionGroupCategory.supplyPerMonth || Base.initializeArray(instance.numberOfMonths));
                productionGroupCategory.supply = safeMath.round(safeArrayMath.reduce(productionGroupCategory.supplyPerMonth), 2);
            }

            // Price Per Unit
            productionCategory.pricePerUnit = safeMath.round(safeMath.dividedBy(safeMath.dividedBy(productionCategory.value, productionCategory.supply || 1), productionCategory.quantity), 4);
            productionGroupCategory.pricePerUnit = safeMath.round(safeMath.dividedBy(safeMath.dividedBy(productionGroupCategory.value, productionGroupCategory.supply || 1), productionGroupCategory.quantity), 4);

            if (productionSchedule.type === 'livestock') {
                productionCategory.valuePerLSU = safeMath.dividedBy(safeMath.times(productionCategory.value, category.valuePerLSU), category.value);
                productionCategory.quantityPerLSU = safeMath.dividedBy(safeMath.times(productionCategory.quantity, category.quantityPerLSU), category.quantity);

                productionGroupCategory.valuePerLSU = safeMath.plus(productionGroupCategory.valuePerLSU, productionCategory.valuePerLSU);
                productionGroupCategory.quantityPerLSU = safeMath.plus(productionGroupCategory.quantityPerLSU, productionCategory.quantityPerLSU);
            } else {
                productionCategory.haPerMonth = underscore.reduce(Base.initializeArray(instance.numberOfMonths, productionSchedule.allocatedSize), reduceArrayInRange(startOffset), Base.initializeArray(instance.numberOfMonths));
                productionGroupCategory.haPerMonth = safeArrayMath.plus(productionCategory.haPerMonth, productionGroupCategory.haPerMonth || Base.initializeArray(instance.numberOfMonths));

                productionGroupCategory.valuePerHaPerMonth = safeArrayMath.round(safeArrayMath.dividedBy(productionGroupCategory.valuePerMonth, productionGroupCategory.haPerMonth), 2);
                productionGroupCategory.quantityPerHaPerMonth = safeArrayMath.round(safeArrayMath.dividedBy(productionGroupCategory.quantityPerMonth, productionGroupCategory.haPerMonth), 3);

                productionGroupCategory.valuePerHa = safeMath.round(safeMath.dividedBy(safeArrayMath.reduce(productionGroupCategory.valuePerHaPerMonth), safeArrayMath.count(productionGroupCategory.valuePerHaPerMonth)), 2);
                productionGroupCategory.quantityPerHa = safeMath.round(safeMath.dividedBy(safeArrayMath.reduce(productionGroupCategory.quantityPerHaPerMonth), safeArrayMath.count(productionGroupCategory.quantityPerHaPerMonth)), 3);
            }
        }

        return ProductionGroup;
    }]);

sdkModelProductionSchedule.factory('ProductionSchedule', ['Base', 'computedProperty', 'EnterpriseBudget', 'EnterpriseBudgetBase', 'Field', 'inheritModel', 'moment', 'privateProperty', 'readOnlyProperty', 'safeArrayMath', 'safeMath', 'underscore',
    function (Base, computedProperty, EnterpriseBudget, EnterpriseBudgetBase, Field, inheritModel, moment, privateProperty, readOnlyProperty, safeArrayMath, safeMath, underscore) {
        function ProductionSchedule (attrs) {
            EnterpriseBudgetBase.apply(this, arguments);

            Base.initializeObject(this.data, 'details', {});

            computedProperty(this, 'costStage', function () {
                return (this.type !== 'horticulture' || this.data.details.assetAge !== 0 ? this.defaultCostStage : underscore.first(ProductionSchedule.costStages));
            });

            privateProperty(this, 'setDate', function (startDate) {
                startDate = moment(startDate);
                startDate.date(1);

                this.startDate = startDate.format('YYYY-MM-DD');

                var monthsPerCycle = 12 / Math.floor(12 / this.numberOfAllocatedMonths),
                    nearestAllocationMonth = (this.budget ? ((monthsPerCycle * Math.floor((startDate.month() - this.budget.cycleStart) / monthsPerCycle)) + this.budget.cycleStart) : startDate.month()),
                    allocationDate = moment([startDate.year()]).add(nearestAllocationMonth, 'M');

                this.startDate = allocationDate.format('YYYY-MM-DD');
                this.endDate = allocationDate.add(1, 'y').format('YYYY-MM-DD');

                if (this.type === 'horticulture') {
                    startDate = moment(this.startDate);

                    this.data.details.establishedDate = (underscore.isUndefined(this.data.details.establishedDate) ?
                        (this.asset && this.asset.data.establishedDate ? this.asset.data.establishedDate : this.startDate) :
                        this.data.details.establishedDate);
                    var assetAge = (startDate.isAfter(this.data.details.establishedDate) ? startDate.diff(this.data.details.establishedDate, 'years') : 0);

                    if (assetAge !== this.data.details.assetAge) {
                        this.data.details.assetAge = assetAge;

                        this.recalculate();
                    }
                }
            });

            privateProperty(this, 'setAsset', function (asset) {
                this.asset = underscore.omit(asset, ['liabilities', 'productionSchedules']);
                this.assetId = this.asset.id;

                this.type = ProductionSchedule.typeByAsset[asset.type];
                this.data.details.fieldName = this.asset.data.fieldName;
                this.data.details.irrigated = (this.asset.data.irrigated === true);

                if (asset.data.crop) {
                    this.data.details.commodity = asset.data.crop;
                }

                if (this.type === 'horticulture') {
                    var startDate = moment(this.startDate);

                    this.data.details.establishedDate = this.asset.data.establishedDate || this.startDate;
                    this.data.details.assetAge = (startDate.isAfter(this.data.details.establishedDate) ?
                        startDate.diff(this.data.details.establishedDate, 'years') : 0);
                } else if (this.type === 'livestock') {
                    this.data.details.pastureType = (this.asset.data.intensified ? 'pasture' : 'grazing');

                    if (this.budget && this.budget.data.details.stockingDensity) {
                        this.setLivestockStockingDensity(this.budget.data.details.stockingDensity[this.data.details.pastureType]);
                    }
                }
                
                this.setSize(this.asset.data.size);
            });
            
            privateProperty(this, 'setBudget', function (budget) {
                this.budget = EnterpriseBudget.new(budget);
                this.budgetUuid = this.budget.uuid;
                this.type = this.budget.assetType;

                this.data.budget = this.budget;
                this.data.details = underscore.extend(this.data.details, {
                    commodity: this.budget.commodityType,
                    grossProfit: 0
                });

                if (this.type === 'livestock') {
                    this.data.details = underscore.defaults(this.data.details, {
                        calculatedLSU: 0,
                        grossProfitPerLSU: 0,
                        herdSize: this.budget.data.details.herdSize || 0,
                        stockingDensity: 0,
                        multiplicationFactor: 0
                    });
                } else if (this.type === 'horticulture') {
                    this.data.details = underscore.extend(this.data.details, {
                        maturityFactor: this.budget.data.details.maturityFactor
                    });
                }

                if (this.data.details.pastureType && this.budget.data.details.stockingDensity) {
                    this.setLivestockStockingDensity(this.budget.data.details.stockingDensity[this.data.details.pastureType]);
                }

                this.recalculate();

                if (this.startDate) {
                    this.setDate(this.startDate);
                }
            });

            privateProperty(this, 'setLivestockStockingDensity', function (stockingDensity) {
                if (this.type === 'livestock' && this.data.details.stockingDensity !== stockingDensity) {
                    this.data.details.stockingDensity = stockingDensity;

                    this.setSize(this.allocatedSize);
                }
            });

            privateProperty(this, 'setSize', function (size) {
                this.data.details.size = size;

                if (this.type === 'livestock') {
                    this.data.details.calculatedLSU = safeMath.dividedBy(this.allocatedSize, this.data.details.stockingDensity);

                    if (this.budget) {
                        this.data.details.multiplicationFactor = (this.budget.data.details.herdSize ? safeMath.dividedBy(this.data.details.herdSize, this.budget.data.details.herdSize) : 1);
                        this.data.details.grossProfit = safeMath.times(this.budget.data.details.grossProfit, this.data.details.multiplicationFactor);
                        this.data.details.grossProfitPerLSU = (this.data.details.calculatedLSU ? safeMath.dividedBy(this.data.details.grossProfit, this.data.details.calculatedLSU) : 0);
                    }
                } else if (this.budget) {
                    this.data.details.grossProfit = safeMath.times(this.budget.data.details.grossProfit, this.data.details.size);
                }

                this.recalculate();
            });

            privateProperty(this, 'adjustCategory', function (sectionCode, categoryQuery, costStage, property) {
                return adjustCategory(this, sectionCode, categoryQuery, costStage, property);
            });

            privateProperty(this, 'updateCategoryStock', function (sectionCode, categoryCode, stock) {
                updateCategoryStock(this, sectionCode, categoryCode, stock);
            });

            privateProperty(this, 'applyMaturityFactor', function (sectionCode, value) {
                var factor = (this.type === 'horticulture' && this.costStage === 'Yearly' && this.data.details.maturityFactor && this.data.details.maturityFactor[sectionCode] ?
                    (this.data.details.maturityFactor[sectionCode][this.data.details.assetAge - 1] || 0) : 100);

                return safeMath.chain(value)
                    .times(factor)
                    .dividedBy(100)
                    .toNumber();
            });

            privateProperty(this, 'reverseMaturityFactor', function (sectionCode, value) {
                var factor = (this.type === 'horticulture' && this.costStage === 'Yearly' && this.data.details.maturityFactor && this.data.details.maturityFactor[sectionCode] ?
                    (this.data.details.maturityFactor[sectionCode][this.data.details.assetAge - 1] || 0) : 100);

                return safeMath.chain(value)
                    .times(100)
                    .dividedBy(factor)
                    .toNumber();
            });

            privateProperty(this, 'recalculate', function () {
                recalculateProductionSchedule(this);
            });

            privateProperty(this, 'recalculateCategory', function (categoryCode) {
                recalculateProductionScheduleCategory(this, categoryCode);
            });

            computedProperty(this, 'scheduleKey', function () {
                return (this.budgetUuid ? this.budgetUuid + '-' : '') +
                    (this.data.details.fieldName ? this.data.details.fieldName + '-' : '') +
                    (this.startDate ? moment(this.startDate).unix() + '-' : '') +
                    (this.endDate ? moment(this.endDate).unix() : '');
            }, {
                enumerable: true
            });

            computedProperty(this, 'assetType', function () {
                return (this.budget ? this.budget.assetType : this.type);
            });

            computedProperty(this, 'commodityType', function () {
                return (this.budget ? this.budget.commodityType : this.data.details.commodity);
            });
            
            computedProperty(this, 'allocatedSize', function () {
                return safeMath.round(this.data.details.size, 2);
            });

            computedProperty(this, 'title', function () {
                return this.allocatedSize + 'ha ' + (this.commodityType ? 'of ' + this.commodityType : '') + (this.startDate ? ' starting ' + moment(this.startDate).format('MMM YYYY') : '');
            });

            computedProperty(this, 'numberOfMonths', function () {
                return moment(this.endDate).diff(this.startDate, 'months');
            });

            privateProperty(this, 'getAllocationIndex', function (sectionCode, costStage) {
                return (this.budget ? this.budget.getAllocationIndex(sectionCode, costStage) : 0);
            });

            privateProperty(this, 'getLastAllocationIndex', function (sectionCode, costStage) {
                return (this.budget ? this.budget.getLastAllocationIndex(sectionCode, costStage) : this.numberOfMonths);
            });

            privateProperty(this, 'getAllocationMonth', function (sectionCode, costStage) {
                return moment(this.startDate).add(this.getAllocationIndex(sectionCode, costStage), 'M');
            });

            privateProperty(this, 'getLastAllocationMonth', function (sectionCode, costStage) {
                return moment(this.startDate).add(this.getLastAllocationIndex(sectionCode, costStage), 'M');
            });

            computedProperty(this, 'numberOfAllocatedMonths', function () {
                return (this.budget ? this.budget.numberOfAllocatedMonths : this.numberOfMonths);
            });

            privateProperty(this, 'inDateRange', function (rangeStart, rangeEnd) {
                rangeStart = moment(rangeStart);
                rangeEnd = moment(rangeEnd);

                var scheduleStart = moment(this.startDate),
                    scheduleEnd = moment(this.endDate);

                return (scheduleStart.isSame(rangeStart) && scheduleEnd.isSame(rangeEnd)) ||
                    (scheduleStart.isSameOrAfter(rangeStart) && scheduleStart.isBefore(rangeEnd)) ||
                    (scheduleEnd.isAfter(rangeStart) && scheduleEnd.isSameOrBefore(rangeEnd));
            });

            computedProperty(this, 'income', function () {
                return underscore.findWhere(this.data.sections, {code: 'INC', costStage: this.costStage});
            });

            computedProperty(this, 'expenses', function () {
                return underscore.findWhere(this.data.sections, {code: 'EXP', costStage: this.costStage});
            });

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.assetId = attrs.assetId;
            this.budgetUuid = attrs.budgetUuid;
            this.type = attrs.type;
            this.endDate = attrs.endDate && moment(attrs.endDate).format('YYYY-MM-DD');
            this.id = attrs.id || attrs.$id;
            this.organizationId = attrs.organizationId;
            this.startDate = attrs.startDate && moment(attrs.startDate).format('YYYY-MM-DD');

            this.organization = attrs.organization;

            if (attrs.asset) {
                this.setAsset(attrs.asset);
            }

            if (this.data.budget || attrs.budget) {
                this.setBudget(this.data.budget || attrs.budget);
            }
        }

        function adjustCategory (instance, sectionCode, categoryQuery, costStage, property) {
            var categoryCode = (underscore.isObject(categoryQuery) ? categoryQuery.code : categoryQuery),
                productionCategory = instance.getCategory(sectionCode, categoryCode, costStage),
                budgetCategory = instance.budget.getCategory(sectionCode, categoryCode, costStage),
                budgetProperty = property;

            if (productionCategory && budgetCategory) {
                switch (property) {
                    case 'pricePerUnit':
                        budgetCategory.pricePerUnit = productionCategory.pricePerUnit;
                        break;
                    case 'quantity':
                        budgetCategory.quantity = safeMath.dividedBy(instance.reverseMaturityFactor(sectionCode, productionCategory.quantity), (instance.type === 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize));
                        break;
                    case 'quantityPerHa':
                        budgetCategory.quantity = instance.reverseMaturityFactor(sectionCode, productionCategory.quantityPerHa);
                        budgetProperty = 'quantity';
                        break;
                    case 'quantityPerLSU':
                        budgetCategory.quantityPerLSU = productionCategory.quantityPerLSU;
                        break;
                    case 'stock':
                        var stock = instance.findStock(productionCategory.name, instance.commodityType),
                            reference = [instance.scheduleKey, (sectionCode === 'INC' ? 'Sale' : 'Consumption')].join('/'),
                            ignoredKeys = ['quantity', 'quantityPerMonth'];

                        underscore.extend(budgetCategory, underscore.chain(stock.inventoryInRange(instance.startDate, instance.endDate))
                            .reduce(function (resultCategory, monthly, index) {
                                underscore.chain(monthly.entries)
                                    .filter(function (entry) {
                                        return s.include(entry.reference, reference);
                                    })
                                    .each(function (entry) {
                                        if (budgetCategory.supplyUnit && entry.quantityUnit === budgetCategory.supplyUnit) {
                                            resultCategory.supply = safeMath.plus(resultCategory.supply, entry.quantity);
                                            resultCategory.quantity = safeMath.plus(resultCategory.quantity, entry.rate);
                                        }

                                        resultCategory.valuePerMonth[index] = safeMath.plus(resultCategory.valuePerMonth[index], entry.value);
                                    });

                                return resultCategory;
                            }, {
                                valuePerMonth: Base.initializeArray(instance.budget.numberOfMonths)
                            })
                            .mapObject(function (value, key) {
                                return (underscore.contains(ignoredKeys, key) ? value : (underscore.isArray(value) ? instance.budget.unshiftMonthlyArray(underscore.map(value, function (monthValue) {
                                    return safeMath.dividedBy(instance.reverseMaturityFactor(sectionCode, monthValue), (instance.type === 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize));
                                })) : safeMath.dividedBy(instance.reverseMaturityFactor(sectionCode, value), (instance.type === 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize))));
                            })
                            .value());

                        budgetProperty = 'valuePerMonth';
                        break;
                    case 'supply':
                        budgetCategory.supply = safeMath.dividedBy(productionCategory.supply, (instance.type === 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize));
                        break;
                    case 'value':
                        budgetCategory.value = safeMath.dividedBy(instance.reverseMaturityFactor(sectionCode, productionCategory.value), (instance.type === 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize));
                        break;
                    case 'valuePerHa':
                        budgetCategory.value = instance.reverseMaturityFactor(sectionCode, productionCategory.valuePerHa);
                        budgetProperty = 'value';
                        break;
                    case 'valuePerLSU':
                        budgetCategory.valuePerLSU = productionCategory.valuePerLSU;
                        break;
                    case 'valuePerMonth':
                        var totalFilled = safeArrayMath.count(productionCategory.valuePerMonth),
                            countFilled = 0;

                        budgetCategory.value = safeMath.round(safeMath.dividedBy(instance.reverseMaturityFactor(sectionCode, safeArrayMath.reduce(productionCategory.valuePerMonth)), (instance.type === 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize)), 4);
                        budgetCategory.valuePerMonth = instance.budget.unshiftMonthlyArray(underscore.reduce(productionCategory.valuePerMonth, function (totals, value, index) {
                            if (value > 0) {
                                totals[index] = (index === totals.length - 1 || countFilled === totalFilled - 1 ?
                                    safeMath.minus(budgetCategory.value, safeArrayMath.reduce(totals)) :
                                    safeMath.round(safeMath.dividedBy(instance.reverseMaturityFactor(sectionCode, value), (instance.type === 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize)), 4));
                                countFilled++;
                            }
                            return totals;
                        }, Base.initializeArray(instance.budget.numberOfMonths)));
                        break;
                    default:
                        budgetCategory[property] = productionCategory[property];
                }

                instance.budget.adjustCategory(sectionCode, categoryCode, costStage, budgetProperty);

                recalculateProductionScheduleCategory(instance, categoryCode);

                if (property !== 'stock') {
                    updateCategoryStock(instance, sectionCode, categoryCode);
                }

                instance.$dirty = true;

                return productionCategory[property];
            }
        }

        function updateStockLedgerEntry (instance, stock, ledgerEntry, formattedDate, action, category, index, forceUpdate) {
            var reference = [instance.scheduleKey, action, formattedDate].join('/');

            if (underscore.isUndefined(ledgerEntry)) {
                ledgerEntry = underscore.extend({
                    action: action,
                    date: formattedDate,
                    commodity: instance.commodityType,
                    reference: reference,
                    value: category.valuePerMonth[index]
                }, (category.unit === 'Total' ? {} :
                    underscore.extend({
                        price: category.pricePerUnit,
                        priceUnit: category.unit
                    }, (underscore.isUndefined(category.supplyPerMonth) ? {
                        quantity: category.quantityPerMonth[index],
                        quantityUnit: category.unit
                    } : {
                        quantity: category.supplyPerMonth[index],
                        quantityUnit: category.supplyUnit,
                        rate: category.quantity
                    }))));

                stock.addLedgerEntry(ledgerEntry);
            } else if (!ledgerEntry.edited || forceUpdate) {
                underscore.extend(ledgerEntry, underscore.extend({
                    commodity: instance.commodityType,
                    reference: reference,
                    value: category.valuePerMonth[index]
                }, (category.unit === 'Total' ? {} :
                    underscore.extend({
                        price: category.pricePerUnit,
                        priceUnit: category.unit
                    }, (underscore.isUndefined(category.supplyPerMonth) ? {
                        quantity: category.quantityPerMonth[index],
                        quantityUnit: category.unit
                    } : {
                        quantity: category.supplyPerMonth[index],
                        quantityUnit: category.supplyUnit,
                        rate: category.quantity
                    })))));

                if (ledgerEntry.liabilityUuid) {
                    var liability = underscore.findWhere(stock.liabilities, {uuid: ledgerEntry.liabilityUuid});

                    updateLedgerEntryLiability(liability, category.name, formattedDate, action, category.valuePerMonth[index]);
                }
            }

            return ledgerEntry;
        }

        function updateCategoryStock (instance, sectionCode, categoryCode, stock) {
            var category = instance.getCategory(sectionCode, categoryCode, instance.costStage);

            if (category) {
                var forceInput = !underscore.isUndefined(stock);

                stock = stock || instance.findStock(category.name, instance.commodityType);

                if (stock) {
                    var inputAction = (sectionCode === 'INC' ? 'Production' : 'Purchase'),
                        outputAction = (sectionCode === 'INC' ? 'Sale' : 'Consumption');

                    // Remove entries
                    var unassignedLiabilities = underscore.chain(category.valuePerMonth)
                        .reduce(function (results, value, index) {
                            if (value === 0) {
                                var formattedDate = moment(instance.startDate).add(index, 'M').format('YYYY-MM-DD'),
                                    inputLedgerEntry = stock.findLedgerEntry({date: formattedDate, action: inputAction, reference: instance.scheduleKey}),
                                    outputLedgerEntry = stock.findLedgerEntry({date: formattedDate, action: outputAction, reference: instance.scheduleKey});

                                if (inputLedgerEntry && inputLedgerEntry.liabilityUuid) {
                                    results.push(underscore.findWhere(stock.liabilities, {uuid: inputLedgerEntry.liabilityUuid}));
                                }

                                stock.removeLedgerEntry(inputLedgerEntry);
                                stock.removeLedgerEntry(outputLedgerEntry);
                            }

                            return results;
                        }, [])
                        .compact()
                        .value();

                    // Add entries
                    underscore.each(category.valuePerMonth, function (value, index) {
                        if (value > 0) {
                            var formattedDate = moment(instance.startDate).add(index, 'M').format('YYYY-MM-DD'),
                                inputLedgerEntry = stock.findLedgerEntry({date: formattedDate, action: inputAction, reference: instance.scheduleKey}),
                                outputLedgerEntry = stock.findLedgerEntry({date: formattedDate, action: outputAction, reference: instance.scheduleKey});

                            if (sectionCode === 'EXP' || instance.assetType !== 'livestock') {
                                inputLedgerEntry = updateStockLedgerEntry(instance, stock, inputLedgerEntry, formattedDate, inputAction, category, index, true);

                                if (underscore.size(unassignedLiabilities) > 0 && underscore.isUndefined(inputLedgerEntry.liabilityUuid) && inputAction === 'Purchase') {
                                    var liability = unassignedLiabilities.shift();

                                    updateLedgerEntryLiability(liability, category.name, formattedDate, inputAction, value);

                                    inputLedgerEntry.liabilityUuid = liability.uuid;
                                }
                            }

                            updateStockLedgerEntry(instance, stock, outputLedgerEntry, formattedDate, outputAction, category, index, true);
                        }
                    });

                    stock.recalculateLedger();
                }
            }
        }

        function updateLedgerEntryLiability (liability, name, formattedDate, inputAction, value) {
            if (liability) {
                liability.name = name + ' ' + inputAction + ' ' + formattedDate;
                liability.creditLimit = value;
                liability.openingDate = formattedDate;
                liability.startDate = formattedDate;

                liability.resetWithdrawals();
                liability.setWithdrawalInMonth(value, formattedDate);
            }
        }

        function recalculateProductionSchedule (instance) {
            if (instance.budget) {
                instance.budget.recalculate();

                instance.data.sections = [];
                instance.clearCache();

                underscore.each(instance.budget.data.sections, function (section) {
                    if (section.costStage === instance.costStage) {
                        underscore.each(section.productCategoryGroups, function (group) {
                            underscore.each(group.productCategories, function (category) {
                                recalculateCategory(instance, section, group, category);
                            });

                            recalculateGroup(instance, section, group);
                        });

                        recalculateSection(instance, section);
                    }
                });

                instance.sortSections();

                recalculateGrossProfit(instance);
            }
        }

        function recalculateProductionScheduleCategory (instance, categoryCode) {
            if (instance.budget) {
                instance.budget.recalculateCategory(categoryCode);

                underscore.each(instance.budget.data.sections, function (section) {
                    if (section.costStage === instance.costStage) {
                        underscore.each(section.productCategoryGroups, function (group) {
                            underscore.each(group.productCategories, function (category) {
                                if (category.code === categoryCode) {
                                    recalculateCategory(instance, section, group, category);
                                    recalculateGroup(instance, section, group);
                                    recalculateSection(instance, section);
                                }
                            });
                        });
                    }
                });

                recalculateGrossProfit(instance);
            }
        }

        function recalculateGrossProfit (instance) {
            instance.data.details.grossProfit = underscore.reduce(instance.data.sections, function (total, section) {
                return (section.code === 'INC' ? safeMath.plus(total, section.total.value) : safeMath.minus(total, section.total.value));
            }, 0);

            if (instance.type === 'livestock') {
                instance.data.details.grossProfitPerLSU = safeMath.dividedBy(instance.data.details.grossProfit, instance.data.details.calculatedLSU);
            }
        }

        function recalculateSection (instance, section) {
            var productionSection = instance.getSection(section.code, section.costStage);

            if (productionSection) {
                productionSection.total.value = underscore.reduce(productionSection.productCategoryGroups, function (total, group) {
                    return safeMath.plus(total, group.total.value);
                }, 0);

                productionSection.total.valuePerMonth = underscore
                    .chain(productionSection.productCategoryGroups)
                    .pluck('total')
                    .pluck('valuePerMonth')
                    .reduce(function (total, valuePerMonth) {
                        return (total ? underscore.map(valuePerMonth, function (value, index) {
                            return safeMath.plus(total[index], value);
                        }) : angular.copy(valuePerMonth));
                    })
                    .value();

                productionSection.total.quantityPerMonth = underscore
                    .chain(productionSection.productCategoryGroups)
                    .pluck('total')
                    .pluck('quantityPerMonth')
                    .reduce(function (total, quantityPerMonth) {
                        return (total ? underscore.map(quantityPerMonth, function (value, index) {
                            return safeMath.plus(total[index], value);
                        }) : angular.copy(quantityPerMonth));
                    })
                    .value();

                if (instance.type === 'livestock') {
                    productionSection.total.valuePerLSU = underscore.reduce(productionSection.productCategoryGroups, function (total, group) {
                        return safeMath.plus(total, group.total.valuePerLSU);
                    }, 0);
                }
            }
        }

        function recalculateGroup (instance, section, group) {
            var productionGroup = instance.getGroup(section.code, group.name, section.costStage);

            if (productionGroup) {
                productionGroup.total.value = underscore.reduce(productionGroup.productCategories, function (total, category) {
                    return safeMath.plus(total, category.value);
                }, 0);

                productionGroup.total.valuePerMonth = underscore
                    .chain(productionGroup.productCategories)
                    .pluck('valuePerMonth')
                    .reduce(function (total, valuePerMonth) {
                        return (total ? underscore.map(valuePerMonth, function (value, index) {
                            return safeMath.plus(total[index], value);
                        }) : angular.copy(valuePerMonth));
                    })
                    .value();

                productionGroup.total.quantityPerMonth = underscore
                    .chain(productionGroup.productCategories)
                    .pluck('quantityPerMonth')
                    .reduce(function (total, quantityPerMonth) {
                        return (total ? underscore.map(quantityPerMonth, function (value, index) {
                            return safeMath.plus(total[index], value);
                        }) : angular.copy(quantityPerMonth));
                    })
                    .value();

                if (instance.type === 'livestock') {
                    productionGroup.total.valuePerLSU = underscore.reduce(productionGroup.productCategories, function (total, category) {
                        return safeMath.plus(total, category.valuePerLSU);
                    }, 0);
                }
            }
        }

        function recalculateCategory (instance, section, group, category) {
            var productionCategory = instance.addCategory(section.code, group.name, category.code, section.costStage);

            productionCategory.name = category.name;
            productionCategory.pricePerUnit = category.pricePerUnit;

            if (instance.type === 'livestock') {
                productionCategory.valuePerLSU = safeMath.plus(productionCategory.valuePerLSU, safeMath.times(category.valuePerLSU, instance.data.details.multiplicationFactor));
                productionCategory.quantityPerLSU = category.quantity;

                if (group.code === 'INC-LSS') {
                    productionCategory.stock = (!underscore.isUndefined(category.stock) ? category.stock : (category.name === instance.getRepresentativeAnimal() ? instance.data.details.herdSize : 0));
                    productionCategory.stockPrice = (!underscore.isUndefined(category.stockPrice) ? category.stockPrice : category.pricePerUnit);
                }
            } else {
                productionCategory.quantityPerHa = instance.applyMaturityFactor(section.code, category.quantity);

                if (section.code === 'EXP') {
                    productionCategory.valuePerHa = instance.applyMaturityFactor(section.code, category.value);
                }
            }

            if (section.code === 'INC' && productionCategory.supplyUnit && productionCategory.unit !== category.unit) {
                category.supplyUnit = productionCategory.supplyUnit;
                category.supply = category.quantity;
                category.quantity = 1;
                category.unit = productionCategory.unit;
            }

            if (!underscore.isUndefined(category.supplyPerMonth)) {
                productionCategory.supply = safeMath.times(category.supply, (instance.type === 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize));

                productionCategory.quantityPerMonth = underscore.map(instance.budget.shiftMonthlyArray(category.quantityPerMonth), function (value) {
                    return safeMath.round(instance.applyMaturityFactor(section.code, value), 2);
                });

                productionCategory.supplyPerMonth = underscore.map(instance.budget.shiftMonthlyArray(category.supplyPerMonth), function (value) {
                    var productionValue = safeMath.times(instance.applyMaturityFactor(section.code, value), (instance.type === 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize));

                    return (category.supplyUnit === 'hd' ? Math.round(productionValue) : productionValue);
                });
            } else {
                productionCategory.quantityPerMonth = underscore.map(instance.budget.shiftMonthlyArray(category.quantityPerMonth), function (value) {
                    return safeMath.round(safeMath.times(instance.applyMaturityFactor(section.code, value), (instance.type === 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize)), 2);
                });
            }

            productionCategory.quantity = safeArrayMath.reduce(productionCategory.quantityPerMonth);

            productionCategory.valuePerMonth = underscore.map(instance.budget.shiftMonthlyArray(category.valuePerMonth), function (value) {
                return safeMath.round(safeMath.times(instance.applyMaturityFactor(section.code, value), (instance.type === 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize)), 2);
            });

            productionCategory.value = safeArrayMath.reduce(productionCategory.valuePerMonth);
        }

        inheritModel(ProductionSchedule, EnterpriseBudgetBase);

        readOnlyProperty(ProductionSchedule, 'productionScheduleTypes', {
            crop: 'Crop',
            horticulture: 'Horticulture',
            livestock: 'Livestock'
        });

        readOnlyProperty(ProductionSchedule, 'allowedLandUse', underscore.difference(Field.landClasses, [
            'Building',
            'Built-up',
            'Erosion',
            'Forest',
            'Homestead',
            'Mining',
            'Non-vegetated',
            'Water',
            'Water (Seasonal)',
            'Wetland']));

        readOnlyProperty(ProductionSchedule, 'allowedAssets', ['cropland', 'pasture', 'permanent crop']);

        readOnlyProperty(ProductionSchedule, 'typeByAsset', {
            'cropland': 'crop',
            'pasture': 'livestock',
            'permanent crop': 'horticulture'
        });

        privateProperty(ProductionSchedule, 'getTypeTitle', function (type) {
            return ProductionSchedule.productionScheduleTypes[type] || '';
        });

        ProductionSchedule.validates({
            assetId: {
                requiredIf: function (value, instance) {
                    return !underscore.isUndefined(instance.id);
                },
                numeric: true
            },
            budget: {
                required: true,
                object: true
            },
            budgetUuid: {
                required: true,
                format: {
                    uuid: true
                }
            },
            data: {
                required: true,
                object: true
            },
            endDate: {
                required: true,
                format: {
                    date: true
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
            }
        });

        return ProductionSchedule;
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
            return (navigator.connection && navigator.connection.type !== Connection.NONE);
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

var cordovaMapApp = angular.module('ag.mobile-sdk.cordova.map', ['ag.sdk.library']);

cordovaMapApp.factory('cordovaTileCache', ['mapConfig', 'underscore',
    function (mapConfig, underscore) {
        function getTileLayers () {
            return underscore.chain(mapConfig.layerControl && mapConfig.layerControl.baseLayers || [])
                .omit(function (layer) {
                    return layer.type !== 'tileLayerCordova';
                })
                .mapObject(function (layer) {
                    return L[layer.type](layer.template, layer.options);
                })
                .value();
        }

        return {
            clear: function () {
                underscore.each(getTileLayers(), function (tileLayer) {
                    tileLayer.emptyCache();
                });
            },
            getTileLayer: function (name) {
                return getTileLayers()[name];
            }
        }
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
        noFileEntry: {err: 'noFileEntry', msg: 'Could not initialize file entry'},
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

        var _reject = function (err) {
            $log.error(err);
            defer.reject(_errors.noFileEntry);
        };

        $log.debug(fileURI);

        // Initialize the file system
        _initFileSystem(function () {
            // Request the file entry
            _fileSystem.root.getFile(fileURI, options, _resolve, function () {
                var filePath = fileURI.substr(0, fileURI.lastIndexOf('/')),
                    fileName = fileURI.substr(fileURI.lastIndexOf('/') + 1);

                window.resolveLocalFileSystemURI(filePath, function (directoryEntry) {
                    directoryEntry.getFile(fileName, options, _resolve, _reject);
                }, _reject);
            });
        }, function () {
            defer.reject(_errors.noFileSystem);
        });

        return defer.promise;
    };

    $log.debug('Initialized storageService');

    return {
        getBaseDirectory: function (directory) {
            return (cordova.file && cordova.file[directory] ? cordova.file[directory] : '');
        },
        getFileEntry: _getFileEntry,
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

cordovaToasterApp.factory('toasterService', ['$log', function ($log) {
    var _show = function (message, duration, position) {
        var _toaster = (window.plugins && window.plugins.toast ? window.plugins.toast : undefined);

        $log.debug('Toaster: ' + message);

        if (_toaster && typeof _toaster.show === 'function') {
            _toaster.show(message, duration || 'long', position || 'bottom');
        }
    };

    var _hide = function () {
        var _toaster = (window.plugins && window.plugins.toast ? window.plugins.toast : undefined);

        if (_toaster && typeof _toaster.hide === 'function') {
            _toaster.hide();
        }
    }

    return {
        show: function (message, duration, position) {
            _show(message, duration, position);
        },
        showLongBottom: function (message) {
            _show(message);
        },
        hide: function () {
            _hide();
        }
    };
}]);

var mobileSdkApiApp = angular.module('ag.mobile-sdk.api', ['ag.sdk.utilities', 'ag.sdk.monitor', 'ag.mobile-sdk.hydration', 'ag.mobile-sdk.data', 'ag.mobile-sdk.cordova.connection', 'ag.mobile-sdk.cordova.storage', 'ag.sdk.library', 'ag.sdk.api.geo']);

var _errors = {
    TypeParamRequired: {code: 'TypeParamRequired', message: 'Type parameter is required'},
    UploadPhotoError: {code: 'UploadPhotoError', message: 'Error occured uploading photo'}
};


/*
 * Syncronization
 */
mobileSdkApiApp.provider('apiSynchronizationService', ['underscore', function (underscore) {
    var _options = {
        models: ['budgets', 'documents', 'expenses', 'farmers', 'tasks', 'organizational-units', 'merchants'],
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

    this.$get = ['$http', '$log', 'api', 'assetApi', 'authorizationApi', 'configuration', 'connectionService', 'documentApi', 'enterpriseBudgetApi', 'expenseApi', 'farmApi', 'farmerApi', 'fileStorageService', 'financialApi', 'legalEntityApi', 'liabilityApi', 'merchantApi', 'organizationalUnitApi', 'pagingService', 'productionScheduleApi', 'promiseService', 'taskApi',
        function ($http, $log, api, assetApi, authorizationApi, configuration, connectionService, documentApi, enterpriseBudgetApi, expenseApi, farmApi, farmerApi, fileStorageService, financialApi, legalEntityApi, liabilityApi, merchantApi, organizationalUnitApi, pagingService, productionScheduleApi, promiseService, taskApi) {
            function _getItems(apiName, params) {
                var apiInstance = api(apiName);

                return apiInstance.findItem({key: 1, column: 'offline', options: {fallbackRemote: false, hydrate: false, one: false, remoteHydration: false}}).then(function (offlineItems) {
                    return apiInstance.purgeItem({template: apiInstance.options.plural, options: {force: false}}).then(function () {
                        return promiseService.wrap(function (promise) {
                            var paging = pagingService.initialize(function (page) {
                                return apiInstance.getItems({params: page, options: _options.remote});
                            }, function (items) {
                                promiseService.chain(function (chain) {
                                    underscore.chain(items)
                                        .reject(function (item) {
                                            return underscore.chain(offlineItems)
                                                .findWhere({id: item.id})
                                                .isUndefined()
                                                .value();
                                        })
                                        .each(function (item) {
                                            chain.push(function () {
                                                return apiInstance.findItem({key: item.id, options: {availableOffline: true, fallbackRemote: true, hydrateRemote: true}});
                                            });
                                        });
                                }).then(function () {
                                    if (paging.complete) {
                                        promise.resolve();
                                    } else {
                                        paging.request().catch(promise.reject);
                                    }
                                }, promise.reject);
                            }, params);

                            paging.request().catch(promise.reject);
                        });
                    });
                });
            }

            function _getFarmers (params) {
                return _getItems('farmer', params || {
                    resulttype: {
                        name: 1,
                        operationType: 1
                    }
                });
            }

            function _getDocuments (params) {
                return _getItems('document', {
                    resulttype: {
                        docType: 1,
                        documentId: 1,
                        organizationId: 1
                    }
                });
            }

            function _getExpenses (params) {
                return _getItems('expense', {
                    limit: 20,
                    resulttype: 'full'
                });
            }

            function _getTasks (params) {
                return _getItems('task', {
                    resulttype: {
                        documentId: 1,
                        documentKey: 1,
                        organizationId: 1,
                        status: 1,
                        todo: 1
                    }
                });
            }

            function _getEnterpriseBudgets(params) {
                return _getItems('budget', {
                    resulttype: {
                        assetType: 1,
                        cloneCount: 1,
                        commodityType: 1,
                        details: 1,
                        favoriteCount: 1,
                        internallyPublished: 1,
                        name: 1,
                        published: 1,
                        useCount: 1,
                        uuid: 1
                    }
                });
            }

            function _getOrganizationalUnits (params) {
                return _getItems('organizational-unit', {
                    resulttype: {
                        costCenterCode: 1,
                        name: 1,
                        type: 1
                    }
                });
            }

            function _getMerchants(params) {
                return _getItems('merchant', {
                    resulttype: {
                        name: 1,
                        services: 1,
                        uuid: 1
                    }
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
                    if (farmer.$dirty === true) {
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
                            if (farm.$dirty === true) {
                                chain.push(function () {
                                    if (farm.$local === true) {
                                        return farmApi.postFarm({data: farm}).then(function (res) {
                                            return assetApi.getAssets({
                                                template: '',
                                                options: {
                                                    readLocal: true,
                                                    hydrate: false,
                                                    filter: function (dataItem) {
                                                        return dataItem.farmId && dataItem.farmId === farm.$id;
                                                    }
                                                }
                                            }).then(function (assets) {
                                                return promiseService.wrapAll(function (promises) {
                                                    underscore.each(assets, function (asset) {
                                                        asset.$dirty = true;
                                                        asset.farmId = res.id;

                                                        promises.push(assetApi.updateAsset({data: asset}));
                                                    });
                                                });
                                            });
                                        });
                                    } else {
                                        return farmApi.postFarm({data: farm});
                                    }
                                });
                            }
                        });
                    });
                }, promiseService.throwError);
            }

            function _postFinancials (localEntityId, remoteEntityId) {
                financialApi.getFinancials({id: localEntityId, options: _options.local}).then(function (financials) {
                    return promiseService.chain(function (chain) {
                        angular.forEach(financials, function (financial) {
                            if (localEntityId !== remoteEntityId) {
                                financial.$uri = 'financials/' + remoteEntityId;
                                financial.legalEntityId = remoteEntityId;

                                chain.push(function () {
                                    return financialApi.updateFinancial({data: financial});
                                });
                            }

                            if (financial.$dirty === true) {
                                chain.push(function () {
                                    return financialApi.postFinancial({data: financial});
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
                            if (entity.$dirty === true) {
                                chain.push(function () {
                                    return legalEntityApi.postEntity({data: entity}).then(function (res) {
                                        return promiseService.all([_postAssets(entity.$id, res.id), _postLiabilities('legalentity', entity.$id, res.id, res.id)]);
                                    });
                                });
                            } else {
                                chain.push(function () {
                                    return _postAssets(entity.$id, entity.id);
                                });

                                chain.push(function () {
                                    return _postFinancials(entity.$id, entity.id);
                                });

                                chain.push(function () {
                                    return _postLiabilities('legalentity', entity.$id, entity.id, entity.$id);
                                });
                            }
                        });
                    });
                }, promiseService.throwError);
            }

            function _postAssets (localEntityId, remoteEntityId) {
                return assetApi.getAssets({id: localEntityId, options: _options.local}).then(function (assets) {
                    return promiseService.chain(function (chain) {
                        angular.forEach(assets, function (asset) {
                            if (localEntityId !== remoteEntityId) {
                                asset.$uri = 'assets/' + remoteEntityId;
                                asset.legalEntityId = remoteEntityId;

                                chain.push(function () {
                                    return assetApi.updateAsset({data: asset});
                                });
                            }

                            if (asset.$dirty === true) {
                                chain.push(function () {
                                    return assetApi.postAsset({data: asset}).then(function (res) {
                                        return promiseService.all([_postLiabilities('asset', asset.$id, res.id, remoteEntityId), _postProductionSchedules(asset.$id, res.id)]);
                                    });
                                });
                            } else {
                                chain.push(function () {
                                    return _postLiabilities('asset', asset.$id, asset.id, remoteEntityId);
                                });

                                chain.push(function () {
                                    return _postProductionSchedules(asset.$id, asset.id);
                                });
                            }
                        });
                    });
                }, promiseService.throwError);
            }

            function _postLiabilities (type, localId, remoteId, legalEntityId) {
                return liabilityApi.getLiabilities({template: 'liabilities/:type/:id', schema: {type: type, id: localId}, options: _options.local}).then(function (liabilities) {
                    return promiseService.chain(function (chain) {
                        angular.forEach(liabilities, function (liability) {
                            if (localId !== remoteId) {
                                liability.$uri = 'liabilities/' + type + '/' + remoteId;
                                liability.legalEntityId = legalEntityId;

                                chain.push(function () {
                                    return liabilityApi.updateLiability({data: liability});
                                });
                            }

                            if (liability.$dirty === true) {
                                chain.push(function () {
                                    return liabilityApi.postLiability({
                                        template: (liability.$local ? ':type/:oid/liability' : 'liability/:id'),
                                        schema: {type: type, oid: remoteId},
                                        data: liability
                                    });
                                });
                            }
                        });
                    });
                }, promiseService.throwError);
            }

            function _postProductionSchedules (localAssetId, remoteAssetId) {
                return productionScheduleApi.getProductionSchedules({id: localAssetId, options: _options.local}).then(function (schedules) {
                    return promiseService.chain(function (chain) {
                        angular.forEach(schedules, function (schedule) {
                            if (localAssetId !== remoteAssetId) {
                                schedule.$uri = 'production-schedules/' + remoteAssetId;
                                schedule.assetId = remoteAssetId;

                                chain.push(function () {
                                    return productionScheduleApi.updateProductionSchedule({data: schedule});
                                });
                            }

                            if (schedule.$dirty === true) {
                                chain.push(function () {
                                    return productionScheduleApi.postProductionSchedule({data: schedule});
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
                            if (document.$dirty === true) {
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
                            if (expense.$dirty === true) {
                                chain.push(function () {
                                    return expenseApi.postExpense({data: expense});
                                });
                            }
                        });
                    });
                }, promiseService.throwError);
            }


            function _postMerchants () {
                return merchantApi.getMerchants({options: _options.local}).then(function (merchants) {
                    return promiseService.chain(function (chain) {
                        angular.forEach(merchants, function (merchant) {
                            if (merchant.$dirty === true) {
                                chain.push(function () {
                                    return merchantApi.postMerchant({data: merchant});
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
                            } else if (subtask.$dirty === true) {
                                chain.push(function () {
                                    return taskApi.postTask({data: subtask})
                                });
                            }
                        });

                        if (task && task.$dirty === true) {
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

                    $log.debug('Attempting data synchronization');

                    return promiseService.wrap(function (promise) {
                        authorizationApi.getUser().then(function (res) {
                            _this.upload(models).then(function () {
                                _this.download(models).then(promise.resolve, promise.reject);
                            }, promise.reject);
                        }, promise.reject);
                    });
                },
                upload: function (models) {
                    models = models || _options.models;

                    return promiseService.wrap(function (promise) {
                        if (_busy) {
                            $log.debug('Upload - Already syncing with server');
                            promise.reject({
                                data: {
                                    message: 'Syncing with server. Please wait'
                                }
                            });
                        } else if (connectionService.isOnline() == false) {
                            $log.debug('Upload - Device is offline');
                            promise.reject({
                                data: {
                                    message: 'Cannot connect to the server. Please try again later'
                                }
                            });
                        } else {
                            _busy = true;
                            $log.debug('Uploading');

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

                                    if (models.indexOf('merchants') !== -1) {
                                        chain.push(_postMerchants);
                                    }
                                })
                                .then(function (res) {
                                    _busy = false;
                                    promise.resolve(res);
                                }, function (err) {
                                    _busy = false;
                                    $log.error(error);
                                    promise.reject(err);
                                });
                        }
                    });
                },
                download: function (models) {
                    models = models || _options.models;

                    return promiseService.wrap(function (promise) {
                        if (_busy) {
                            $log.debug('Download - Already syncing with server');
                            promise.reject({
                                data: {
                                    message: 'Syncing with server. Please wait'
                                }
                            });
                        } else if (connectionService.isOnline() == false) {
                            $log.debug('Download - Device is offline');
                            promise.reject({
                                data: {
                                    message: 'Cannot connect to the server. Please try again later'
                                }
                            });
                        } else {
                            _busy = true;
                            $log.debug('Downloading');

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

                                    if (models.indexOf('merchants') !== -1) {
                                        chain.push(_getMerchants);
                                    }
                                })
                                .then(function (res) {
                                    _busy = false;
                                    promise.resolve(res);
                                }, function (err) {
                                    _busy = false;
                                    $log.error(err);
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
    var _apis = {};

    return function (options) {
        if (typeof options == 'string') {
            options = {
                singular: options,
                plural: options + 's'
            }
        }

        options.plural = options.plural || options.singular + 's';

        if (underscore.isUndefined(_apis[options.singular])) {
            var _itemStore = dataStore(options.singular, {
                apiTemplate: options.singular + '/:id',
                hydrate: options.hydrate,
                dehydrate: options.dehydrate
            }), _stripProperties = function (object, omit) {
                return underscore.omit(JSON.parse(JSON.stringify(object)), omit || []);
            };

            _apis[options.singular] = {
                options: options,

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
                    var request = req || {};
                    request.options = underscore.defaults((request.options ? angular.copy(request.options) : {}), {one: false});

                    return _itemStore.transaction().then(function (tx) {
                        if (!underscore.isUndefined(request.template)) {
                            return tx.getItems({template: request.template, schema: request.schema, options: request.options, params: request.params});
                        } else if (request.search) {
                            request.options.readLocal = false;
                            request.options.readRemote = true;

                            return tx.getItems({template: options.plural + '?search=:query', schema: {query: request.search}, options: request.options, params: request.params});
                        } else if (request.id) {
                            return tx.getItems({template: options.plural + '/:id', schema: {id: request.id}, options: request.options, params: request.params});
                        } else {
                            return tx.getItems({template: options.plural, options: request.options, params: request.params});
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
                    var request = req || {};
                    request.options = (request.options ? angular.copy(request.options) : {});

                    return _itemStore.transaction().then(function (tx) {
                        if (request.data) {
                            return tx.createItems({template: request.template, schema: request.schema, data: _stripProperties(request.data), options: request.options});
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
                    var request = req || {};
                    request.options = (request.options ? angular.copy(request.options) : {});

                    return _itemStore.transaction().then(function (tx) {
                        if (request.id) {
                            return tx.getItems({template: request.template, schema: {id: request.id}, options: request.options});
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
                    var request = req || {};
                    request.options = (request.options ? angular.copy(request.options) : {});

                    return _itemStore.transaction().then(function (tx) {
                        if (request.key) {
                            return tx.findItems({key: request.key, column: request.column, options: request.options});
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
                    var request = req || {};
                    request.options = (request.options ? angular.copy(request.options) : {});

                    return _itemStore.transaction().then(function (tx) {
                        if (request.data) {
                            return tx.updateItems({data: _stripProperties(request.data, options.strip), options: request.options});
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
                    var request = req || {};
                    request.options = (request.options ? angular.copy(request.options) : {});

                    return _itemStore.transaction().then(function (tx) {
                        if (request.data) {
                            return tx.postItems({template: request.template, schema: request.schema, data: _stripProperties(request.data, options.strip), options: request.options});
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
                    var request = req || {};
                    request.options = (request.options ? angular.copy(request.options) : {});

                    return _itemStore.transaction().then(function (tx) {
                        if (request.data) {
                            return tx.removeItems({template: options.singular + '/:id/delete', data: request.data});
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
                    var request = req || {};
                    request.options = (request.options ? angular.copy(request.options) : {});

                    return _itemStore.transaction().then(function (tx) {
                        return tx.purgeItems({template: request.template, schema: request.schema, options: request.options});
                    });
                }
            };
        }

        return _apis[options.singular];
    }
}]);

mobileSdkApiApp.provider('activityApi', ['hydrationProvider', function (hydrationProvider) {
    hydrationProvider.registerHydrate('activities', ['activityApi', 'connectionService', function (activityApi, connectionService) {
        return function (obj, type) {
            return activityApi.getActivities({template: 'activities/:id', schema: {id: obj.$id}, options: {one: false, fallbackRemote: connectionService.isOnline(), hydrateRemote: false}});
        }
    }]);

    this.$get = ['api', function (api) {
        var activityApi = api({
            plural: 'activities',
            singular: 'activity'
        });

        return {
            getActivities: function (req) {
                req = req || {};
                req.params = req.params || {
                    resulttype: {
                        action: 1,
                        actor: {
                            displayName: 1,
                            position: 1,
                            profilePhotoSrc: 1
                        },
                        date: 1,
                        document: {
                            docType: 1
                        },
                        documentId: 1,
                        organization: {
                            name: 1
                        },
                        referenceType: 1,
                        task: {
                            todo: 1
                        },
                        taskId: 1
                    }
                };

                return activityApi.getItems(req);
            },
            createActivity: activityApi.createItem,
            getActivity: activityApi.getItem,
            deleteActivity: activityApi.deleteItem
        };
    }];
}]);

mobileSdkApiApp.provider('assetApi', ['hydrationProvider', function (hydrationProvider) {
    hydrationProvider.registerHydrate('asset', ['assetApi', function (assetApi) {
        return function (obj, type) {
            return assetApi.findAsset({key: obj.$id, options: {one: true}});
        }
    }]);

    hydrationProvider.registerHydrate('assets', ['assetApi', function (assetApi) {
        return function (obj, type) {
            return assetApi.getAssets({id: obj.$id, options: {hydrate: ['liabilities', 'productionSchedules']}});
        }
    }]);

    hydrationProvider.registerDehydrate('assets', ['assetApi', 'promiseService', function (assetApi, promiseService) {
        return function (obj, type) {
            var objId = (obj.$id !== undefined ? obj.$id : obj.id);

            return assetApi.purgeAsset({template: 'assets/:id', schema: {id: objId}, options: {force: false}})
                .then(function () {
                    return promiseService.arrayWrap(function (promises) {
                        angular.forEach(obj.assets, function (asset) {
                            promises.push(assetApi.createAsset({template: 'assets/:id', schema: {id: objId}, data: asset, options: {replace: obj.$complete, complete: obj.$complete, dirty: false}}));
                        });
                    });
                }, promiseService.throwError);
        }
    }]);

    this.$get = ['api', 'hydration', function (api, hydration) {
        var hydrateRelations = ['liabilities', 'productionSchedules'];
        var assetApi = api({
            plural: 'assets',
            singular: 'asset',
            strip: ['farm', 'legalEntity', 'liabilities', 'productionSchedules'],
            hydrate: function (obj, options) {
                options.hydrate = (options.hydrate instanceof Array ? options.hydrate : (options.hydrate === true ? hydrateRelations : []));
                return hydration.hydrate(obj, 'asset', options);
            },
            dehydrate: function (obj, options) {
                options.dehydrate = (options.dehydrate instanceof Array ? options.dehydrate : (options.dehydrate === false ? [] : hydrateRelations));
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
            return documentApi.createDocument({template: 'documents', data: obj.document, options: {replace: obj.$complete, complete: obj.$complete, dirty: false}});
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

mobileSdkApiApp.provider('enterpriseBudgetApi', ['hydrationProvider', function (hydrationProvider) {
    hydrationProvider.registerHydrate('budget', ['enterpriseBudgetApi', function (enterpriseBudgetApi) {
        return function (obj, type, options) {
            if (obj.budgetUuid) {
                return enterpriseBudgetApi.findEnterpriseBudget({column: 'data', key: obj.budgetUuid, options: {like: true, one: true}});
            } else {
                return enterpriseBudgetApi.findEnterpriseBudget({key: obj.budgetId, options: {one: true}});
            }
        }
    }]);

    hydrationProvider.registerDehydrate('budget', ['enterpriseBudgetApi', function (enterpriseBudgetApi) {
        return function (obj, type) {
            return enterpriseBudgetApi.createEnterpriseBudget({template: 'budgets', data: obj.budget, options: {replace: obj.$complete, complete: obj.$complete, dirty: false}});
        }
    }]);

    this.$get = ['api', function (api) {
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
    }];
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

mobileSdkApiApp.provider('farmApi', ['hydrationProvider', function (hydrationProvider) {
    hydrationProvider.registerHydrate('farm', ['farmApi', function (farmApi) {
        return function (obj, type, options) {
            return (angular.isNumber(obj.farmId) ? farmApi.findFarm({key: obj.farmId, options: {one: true, hydrateRemote: options.remoteHydration}}) : null);
        }
    }]);

    hydrationProvider.registerHydrate('farms', ['farmApi', function (farmApi) {
        return function (obj, type) {
            return farmApi.getFarms({id: obj.$id});
        }
    }]);

    hydrationProvider.registerDehydrate('farms', ['farmApi', 'promiseService', function (farmApi, promiseService) {
        return function (obj, type) {
            var objId = (obj.$id !== undefined ? obj.$id : obj.id);

            return farmApi.purgeFarm({template: 'farms/:id', schema: {id: objId}, options: {force: false}})
                .then(function () {
                    return promiseService.arrayWrap(function (promises) {
                        angular.forEach(obj.farms, function (farm) {
                            promises.push(farmApi.createFarm({template: 'farms/:id', schema: {id: objId}, data: farm, options: {replace: obj.$complete, complete: obj.$complete, dirty: false}}));
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

                    farmerApi.createFarmer({template: 'farmers', data: obj.organization, options: {replace: obj.$complete, complete: obj.$complete, dirty: false}}).then(promise.resolve, promise.reject);
                } else {
                    promise.resolve(obj);
                }
            });
        }
    }]);

    this.$get = ['api', 'hydration', function (api, hydration) {
        var defaultRelations = ['activities', 'farms', 'legalEntities', 'primaryContact'];
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

mobileSdkApiApp.provider('financialApi', ['hydrationProvider', function (hydrationProvider) {
    hydrationProvider.registerHydrate('financials', ['financialApi', function (financialApi) {
        return function (obj, type) {
            return financialApi.getFinancials({id: obj.$id, options: {hydrate: true}});
        }
    }]);

    hydrationProvider.registerDehydrate('financials', ['financialApi', 'promiseService', function (financialApi, promiseService) {
        return function (obj, type) {
            var objId = (obj.$id !== undefined ? obj.$id : obj.id);

            return financialApi.purgeFinancial({template: 'financials/:id', schema: {id: objId}, options: {force: false}})
                .then(function () {
                    return promiseService.arrayWrap(function (promises) {
                        angular.forEach(obj.financials, function (financial) {
                            promises.push(financialApi.createFinancial({template: 'financials/:id', schema: {id: objId}, data: financial, options: {replace: obj.$complete, complete: obj.$complete, dirty: false}}));
                        });
                    });
                }, promiseService.throwError);
        }
    }]);

    this.$get = ['api', 'hydration', function (api, hydration) {
        var financialApi = api({
            plural: 'financials',
            singular: 'financial',
            strip: ['legalEntity']
        });

        return {
            getFinancials: financialApi.getItems,
            createFinancial: financialApi.createItem,
            getFinancial: financialApi.getItem,
            findFinancial: financialApi.findItem,
            updateFinancial: financialApi.updateItem,
            postFinancial: financialApi.postItem,
            deleteFinancial: financialApi.deleteItem,
            purgeFinancial: financialApi.purgeItem
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
            return legalEntityApi.getEntities({id: obj.$id, options: {hydrate: true}});
        }
    }]);

    hydrationProvider.registerHydrate('primaryContact', ['legalEntityApi', 'underscore', function (legalEntityApi, underscore) {
        return function (obj, type) {
            return legalEntityApi.getEntities({id: obj.$id})
                .then(function (entities) {
                    return underscore.findWhere(entities, {isPrimary: true});
                });
        }
    }]);

    hydrationProvider.registerDehydrate('legalEntities', ['legalEntityApi', 'promiseService', function (legalEntityApi, promiseService) {
        return function (obj, type) {
            var objId = (obj.$id !== undefined ? obj.$id : obj.id);

            return legalEntityApi.purgeEntity({template: 'legalentities/:id', schema: {id: objId}, options: {force: false}})
                .then(function () {
                    return promiseService.arrayWrap(function (promises) {
                        angular.forEach(obj.legalEntities, function (entity) {
                            promises.push(legalEntityApi.createEntity({template: 'legalentities/:id', schema: {id: objId}, data: entity, options: {replace: obj.$complete, complete: obj.$complete, dirty: false}}));
                        });
                    });
                }, promiseService.throwError);
        }
    }]);

    this.$get = ['api', 'hydration', function (api, hydration) {
        var defaultRelations = ['assets', 'financials', 'liabilities'];
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

mobileSdkApiApp.provider('liabilityApi', ['hydrationProvider', function (hydrationProvider) {
    hydrationProvider.registerHydrate('liabilities', ['liabilityApi', function (liabilityApi) {
        return function (obj, type) {
            return liabilityApi.getLiabilities({template: 'liabilities/:type/:id', schema: {type: type, id: obj.$id}, options: {hydrate: true}});
        }
    }]);

    hydrationProvider.registerDehydrate('liabilities', ['liabilityApi', 'promiseService', function (liabilityApi, promiseService) {
        return function (obj, type) {
            var objId = (obj.$id !== undefined ? obj.$id : obj.id);

            return liabilityApi.purgeLiability({template: 'liabilities/:type/:id', schema: {type: type, id: objId}, options: {force: false}})
                .then(function () {
                    return promiseService.arrayWrap(function (promises) {
                        angular.forEach(obj.liabilities, function (liability) {
                            promises.push(liabilityApi.createLiability({template: 'liabilities/:type/:id', schema: {type: type, id: objId}, data: liability, options: {replace: obj.$complete, complete: obj.$complete, dirty: false}}));
                        });
                    });
                }, promiseService.throwError);
        }
    }]);

    this.$get = ['api', 'hydration', function (api, hydration) {
        var defaultRelations = ['merchant'];
        var liabilityApi = api({
            plural: 'liabilities',
            singular: 'liability',
            strip: defaultRelations,
            hydrate: function (obj, options) {
                options.hydrate = (options.hydrate instanceof Array ? options.hydrate : (options.hydrate === true ? defaultRelations : []));
                return hydration.hydrate(obj, 'liability', options);
            },
            dehydrate: function (obj, options) {
                options.dehydrate = (options.dehydrate instanceof Array ? options.dehydrate : (options.dehydrate === false ? [] : defaultRelations));
                return hydration.dehydrate(obj, 'liability', options);
            }
        });

        return {
            getLiabilities: liabilityApi.getItems,
            createLiability: liabilityApi.createItem,
            getLiability: liabilityApi.getItem,
            findLiability: liabilityApi.findItem,
            updateLiability: liabilityApi.updateItem,
            postLiability: liabilityApi.postItem,
            deleteLiability: liabilityApi.deleteItem,
            purgeLiability: liabilityApi.purgeItem
        };
    }];
}]);

mobileSdkApiApp.provider('merchantApi', ['hydrationProvider', function (hydrationProvider) {
    hydrationProvider.registerHydrate('merchant', ['merchantApi', function (merchantApi) {
        return function (obj, type, options) {
            return (obj.merchantUuid ? merchantApi.findMerchant({column: 'data', key: obj.merchantUuid, options: {like: true, one: true}}) : undefined);
        }
    }]);

    hydrationProvider.registerDehydrate('merchant', ['merchantApi', function (merchantApi) {
        return function (obj, type) {
            return merchantApi.createMerchant({template: 'merchants', data: obj.merchant, options: {replace: obj.$complete, complete: obj.$complete, dirty: false}});
        }
    }]);

    this.$get = ['$http', 'api', 'configuration', 'promiseService', 'underscore', function ($http, api, configuration, promiseService, underscore) {
        var _host = configuration.getServer();
        var merchantApi = api({
            plural: 'merchants',
            singular: 'merchant'
        });

        return {
            getMerchants: merchantApi.getItems,
            createMerchant: merchantApi.createItem,
            getMerchant: merchantApi.getItem,
            findMerchant: merchantApi.findItem,
            updateMerchant: merchantApi.updateItem,
            postMerchant: merchantApi.postItem,
            deleteMerchant: merchantApi.deleteItem,
            purgeMerchant: merchantApi.purgeItem,
            searchMerchants: function (query) {
                query = underscore.map(query, function (value, key) {
                    return key + '=' + value;
                }).join('&');

                return promiseService.wrap(function (promise) {
                    $http.get(_host + 'api/agrista/providers' + (query ? '?' + query : ''), {withCredentials: true}).then(function (res) {
                        promise.resolve(res.data);
                    }, promise.reject);
                });
            }
        };
    }];
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

mobileSdkApiApp.provider('productionScheduleApi', ['hydrationProvider', function (hydrationProvider) {
    hydrationProvider.registerHydrate('productionSchedules', ['productionScheduleApi', function (productionScheduleApi) {
        return function (obj, type) {
            return productionScheduleApi.getProductionSchedules({id: obj.$id});
        }
    }]);

    hydrationProvider.registerDehydrate('productionSchedules', ['productionScheduleApi', 'promiseService', function (productionScheduleApi, promiseService) {
        return function (obj, type) {
            var objId = (obj.$id !== undefined ? obj.$id : obj.id);

            return productionScheduleApi.purgeProductionSchedule({template: 'production-schedules/:id', schema: {id: objId}, options: {force: false}})
                .then(function () {
                    return promiseService.arrayWrap(function (promises) {
                        angular.forEach(obj.productionSchedules, function (schedule) {
                            promises.push(productionScheduleApi.createProductionSchedule({template: 'production-schedules/:id', schema: {id: objId}, data: schedule, options: {replace: obj.$complete, complete: obj.$complete, dirty: false}}));
                        });
                    });
                }, promiseService.throwError);
        }
    }]);

    this.$get = ['api', 'hydration', 'promiseService', 'underscore', function (api, hydration, promiseService, underscore) {
        var dehydrateRelations = ['asset', 'budget', 'organization'];
        var hydrateRelations = ['budget'];
        var productionScheduleApi = api({
            plural: 'production-schedules',
            singular: 'production-schedule',
            strip: dehydrateRelations,
            hydrate: function (obj, options) {
                options.hydrate = (options.hydrate instanceof Array ? options.hydrate : (options.hydrate === true ? hydrateRelations : []));
                return hydration.hydrate(obj, 'production-schedule', options);
            },
            dehydrate: function (obj, options) {
                return promiseService.wrap(function (promise) {
                    promise.resolve(underscore.omit(obj, options.dehydrate || dehydrateRelations));
                });
            }
        });

        return {
            getProductionSchedules: productionScheduleApi.getItems,
            createProductionSchedule: productionScheduleApi.createItem,
            getProductionSchedule: productionScheduleApi.getItem,
            findProductionSchedule: productionScheduleApi.findItem,
            updateProductionSchedule: productionScheduleApi.updateItem,
            postProductionSchedule: productionScheduleApi.postItem,
            deleteProductionSchedule: productionScheduleApi.deleteItem,
            purgeProductionSchedule: productionScheduleApi.purgeItem
        };
    }];
}]);

mobileSdkApiApp.provider('taskApi', ['hydrationProvider', function (hydrationProvider) {
    hydrationProvider.registerHydrate('subtasks', ['taskApi', function (taskApi) {
        return function (obj, type) {
            return taskApi.getTasks({template: 'tasks/:id', schema: {id: obj.$id}});
        }
    }]);

    hydrationProvider.registerDehydrate('subtasks', ['taskApi', 'promiseService', function (taskApi, promiseService) {
        return function (obj, type) {
            var objId = (obj.$id !== undefined ? obj.$id : obj.id);

            return taskApi.purgeTask({template: 'tasks/:id', schema: {id: objId}, options: {force: false}})
                .then(function () {
                    return promiseService.arrayWrap(function (promises) {
                        angular.forEach(obj.subtasks, function (subtask) {
                            promises.push(taskApi.createTask({template: 'tasks/:id', schema: {id: objId}, data: subtask, options: {replace: obj.$complete, complete: obj.$complete, dirty: false}}));
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

var mobileSdkCacheApp = angular.module('ag.mobile-sdk.cache', ['ag.sdk.config', 'ag.sdk.utilities', 'ag.sdk.library', 'lokijs']);


mobileSdkCacheApp.provider('lokiCache', [function () {
    var _adapterProvider = function (name) {
        return new LokiCordovaFSAdapter({'prefix': 'loki'});
    };

    return {
        setAdapterProvider: function (adapterProvider) {
            _adapterProvider = adapterProvider;
        },
        $get: ['Loki', 'promiseService', 'underscore',
            function (Loki, promiseService, underscore) {
                var cacheStore = {},
                    adapter = _adapterProvider('loki');

                return function (dbName, options) {
                    return promiseService.wrap(function (promise) {
                        if (underscore.isUndefined(cacheStore[dbName])) {
                            cacheStore[dbName] = promise;

                            var lokiInstance = new Loki(dbName, underscore.defaults(options || {}, {
                                adapter: adapter,
                                autoload: true,
                                autosave: true,
                                autoloadCallback: function () {
                                    var promise = cacheStore[dbName];
                                    cacheStore[dbName] = lokiInstance;

                                    promise.resolve(cacheStore[dbName]);
                                }
                            }));
                        } else if (typeof cacheStore[dbName].promise === 'object') {
                            promise.resolve(cacheStore[dbName].promise);
                        } else {
                            promise.resolve(cacheStore[dbName]);
                        }
                    });
                };
            }]
    }
}]);

mobileSdkCacheApp.factory('lokiCollectionCache', ['lokiCache', 'promiseService', 'underscore',
    function (lokiCache, promiseService, underscore) {
        var collectionStore = {};

        return function (dbName, collectionName, options) {
            return promiseService.wrap(function (promise) {
                var key = dbName + '-' + collectionName;

                if (underscore.isUndefined(collectionStore[key])) {
                    lokiCache(dbName, options).then(function (db) {
                        collectionStore[key] = db.getCollection(collectionName);

                        if (collectionStore[key] === null) {
                            collectionStore[key] = db.addCollection(collectionName);
                        }

                        promise.resolve(collectionStore[key]);
                    }, promise.reject);
                } else {
                    promise.resolve(collectionStore[key]);
                }
            });
        };
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
                    templateUrl = templateUrl
                        .replace('/:' + key, (data !== undefined ? '/' + data : ''))
                        .replace(':' + key, (data !== undefined ? data : ''));
                });
            }

            return templateUrl;
        },
        generateItemIndex: function () {
            return 2000000000 + Math.round(Math.random() * 147483647);
        },
        injectMetadata: function (item) {
            return underscore.extend((typeof item.data == 'object' ? item.data : JSON.parse(item.data)), {
                $id: item.id,
                $uri: item.uri,
                $complete: (item.complete == 1),
                $offline: (item.offline == 1),
                $dirty: (item.dirty == 1),
                $local: (item.local == 1),
                $saved: true
            });
        },
        extractMetadata: function (item) {
            return {
                id: item.$id,
                uri: item.$uri,
                complete: item.$complete,
                offline: item.$offline,
                dirty: item.$dirty,
                local: item.$local,
                data: underscore.omit(item, ['$id', '$uri', '$complete', '$offline', '$dirty', '$local', '$saved'])
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
            $log.error(err);
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
            }, {
                current: '1',
                next: '2',
                process: function (tx) {
                    return dataStoreUtilities.executeSqlPromise(tx, 'SELECT name FROM sqlite_master WHERE type = ? ', ['table']).then(function (res) {
                        return promiseService.wrapAll(function (promises) {
                            for (var i = 0; i < res.rows.length; i++) {
                                var table = res.rows.item(i);

                                if (table.name.indexOf('__') === -1) {
                                    promises.push(dataStoreUtilities.executeSqlPromise(tx, 'ALTER TABLE ' + table.name + ' ADD COLUMN offline INT DEFAULT 0'));
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
                        dataStoreUtilities.executeSqlPromise(tx, 'CREATE TABLE IF NOT EXISTS ' + name + ' (id INT UNIQUE, uri TEXT, complete INT DEFAULT 0, offline INT DEFAULT 0, dirty INT DEFAULT 0, local INT DEFAULT 0, data TEXT, updated TIMESTAMP DEFAULT current_timestamp)', []),
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
                request.options = request.options || {};

                return dataStoreUtilities
                    .transactionPromise(_localDatabase)
                    .then(function (tx) {
                        return (underscore.isEmpty(uri) ?
                            dataStoreUtilities.executeSqlPromise(tx, 'SELECT * FROM ' + name) :
                            dataStoreUtilities.executeSqlPromise(tx, 'SELECT * FROM ' + name + ' WHERE uri = ?', [uri]));
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
                return _deleteAllLocal(uri)
                    .then(function () {
                        return _updateLocal(dataItems, {});
                    }, promiseService.throwError)
                    .then(function () {
                        return _getLocal(uri, request);
                    }, promiseService.throwError);
            };

            var _updateLocal = function (dataItems, request) {
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
                                        .executeSqlPromise(tx, 'INSERT INTO ' + name + ' (id, uri, data, complete, offline, dirty, local) VALUES (?, ?, ?, ?, ?, ?, ?)', [item.id, item.uri, dataString, (item.complete ? 1 : 0), (item.offline ? 1 : 0), (item.dirty ? 1 : 0), (item.local ? 1 : 0)])
                                        .then(resolveItem, function () {
                                            if (request.options.replace === true) {
                                                if (item.dirty === true || item.local === true || request.options.force) {
                                                    return dataStoreUtilities
                                                        .executeSqlPromise(tx, 'UPDATE ' + name + ' SET uri = ?, data = ?, complete = ?, offline = ?, dirty = ?, local = ? WHERE id = ?', [item.uri, dataString, (item.complete ? 1 : 0), (item.offline ? 1 : 0), (item.dirty ? 1 : 0), (item.local ? 1 : 0), item.id])
                                                        .then(resolveItem);
                                                } else {
                                                    return dataStoreUtilities
                                                        .executeSqlPromise(tx, 'UPDATE ' + name + ' SET uri = ?, data = ?, complete = ?, offline = ?, dirty = ?, local = ? WHERE id = ? AND dirty = 0 AND local = 0', [item.uri, dataString, (item.complete ? 1 : 0), (item.offline ? 1 : 0), (item.dirty ? 1 : 0), (item.local ? 1 : 0), item.id])
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
                request.options = request.options || {};
                request.params = request.params || {};

                return promiseService
                    .wrap(function (promise) {
                        if (_config.apiTemplate !== undefined) {
                            var httpRequest = (underscore.isObject(request.params.resulttype) ? {
                                    method: 'POST',
                                    url: _hostApi + uri,
                                    data: request.params.resulttype,
                                    params: underscore.omit(request.params, 'resulttype'),
                                    withCredentials: true
                                } : {
                                    method: 'GET',
                                    url: _hostApi + uri,
                                    params: request.params,
                                    withCredentials: true
                                });

                            $log.debug(httpRequest.method + ' ' + httpRequest.url);
                            $log.debug(httpRequest);

                            $http(httpRequest)
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
                                                complete: (request.options.one || (!underscore.isObject(request.params.resulttype) && request.params.resulttype !== 'simple')),
                                                offline: request.options.availableOffline,
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

                                        $log.debug('POST ' + _hostApi + uri);

                                        promises.push($http.post(_hostApi + uri, obj, {withCredentials: true})
                                            .then(function (res) {
                                                var postedItem = dataStoreUtilities.injectMetadata({
                                                    id: _getItemIndex(res.data, item.id),
                                                    uri: item.uri,
                                                    data: res.data,
                                                    complete: true,
                                                    offline: item.offline,
                                                    dirty: false,
                                                    local: false
                                                });

                                                if (item.local == true) {
                                                    postedItem.id = postedItem.$id;

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
                return promiseService.wrap(function (promise) {
                    if (dataItems !== undefined && writeUri !== undefined) {
                        if ((dataItems instanceof Array) === false) dataItems = [dataItems];

                        promiseService
                            .wrapAll(function (promises) {
                                angular.forEach(dataItems, function (dataItem) {
                                    if (dataItem.$local === false) {
                                        var item = dataStoreUtilities.extractMetadata(dataItem);
                                        var uri = dataStoreUtilities.parseRequest(writeUri, underscore.defaults(writeSchema, {id: item.id}));

                                        $log.debug('POST ' + _hostApi + uri);

                                        promises.push($http.post(_hostApi + uri, {withCredentials: true})
                                            .then(function () {
                                                return _deleteLocal(dataItem);
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
                request.options.one = singular;
                request.schema = request.schema || {};

                return promiseService
                    .chain(function (chain) {
                        angular.forEach(data, function (dataItem) {
                            chain.push(function () {
                                if (dataItem.$complete === false && request.options.fallbackRemote === true &&
                                    (request.options.hydrateRemote === undefined || request.options.hydrateRemote === true)) {
                                    var uri = dataStoreUtilities.parseRequest(_config.apiTemplate, underscore.defaults({id: dataItem.$id}, request.schema));

                                    request.options.force = true;
                                    request.options.forceUri = dataItem.$uri;
                                    request.options.hydrate = request.options.hydrateRemote || request.options.hydrate;

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
                            availableOffline: false,
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
                                        offline: request.options.availableOffline,
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
                            availableOffline: false,
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
                                                    complete: (request.options.one || request.params === undefined || (!underscore.isObject(request.params.resulttype) && request.params.resulttype !== 'simple')),
                                                    offline: request.options.availableOffline,
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
                            availableOffline: false,
                            fallbackRemote: true,
                            like: false,
                            one: true,
                            remoteHydration: true
                        });

                        return _findLocal(request.key, request.column, request.options).then(function (res) {
                            return _handleIncompleteResponse(res, request, request.options.one);
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
                                    if (item.$local === true) {
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
                                            return (item.$dirty == false || request.options.force == true);
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

var sdkModelAsset = angular.module('ag.sdk.model.asset', ['ag.sdk.library', 'ag.sdk.model.base', 'ag.sdk.model.field', 'ag.sdk.model.liability', 'ag.sdk.model.production-schedule']);

sdkModelAsset.factory('AssetBase', ['Base', 'computedProperty', 'inheritModel', 'Liability', 'Model', 'privateProperty', 'readOnlyProperty', 'safeMath', 'underscore',
    function (Base, computedProperty, inheritModel, Liability, Model, privateProperty, readOnlyProperty, safeMath, underscore) {
        function AssetBase (attrs) {
            Model.Base.apply(this, arguments);

            privateProperty(this, 'generateKey', function (legalEntity, farm) {
                this.assetKey = generateKey(this, legalEntity, farm);

                return this.assetKey;
            });

            computedProperty(this, 'hasGeometry', function () {
                return !underscore.isUndefined(this.data.loc);
            });

            privateProperty(this, 'totalLiabilityInRange', function (rangeStart, rangeEnd) {
                return underscore.reduce(this.liabilities, function (total, liability) {
                    return safeMath.plus(total, liability.totalLiabilityInRange(rangeStart, rangeEnd));
                }, 0);
            });

            this.data = (attrs && attrs.data ? attrs.data : {});
            Base.initializeObject(this.data, 'attachments', []);

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.id = attrs.id || attrs.$id;
            this.assetKey = attrs.assetKey;
            this.legalEntityId = attrs.legalEntityId;
            this.type = attrs.type;

            this.liabilities = underscore.map(attrs.liabilities, Liability.newCopy);
        }

        function generateKey (instance, legalEntity, farm) {
            return  (legalEntity ? 'entity.' + legalEntity.uuid : '') +
                (instance.type !== 'farmland' && farm ? '-f.' + farm.name : '') +
                (instance.type === 'crop' && instance.data.season ? '-s.' + instance.data.season : '') +
                (instance.data.fieldName ? '-fi.' + instance.data.fieldName : '') +
                (instance.data.crop ? '-c.' + instance.data.crop : '') +
                (instance.type === 'cropland' && instance.data.irrigated ? '-i.' + instance.data.irrigation : '') +
                (instance.type === 'farmland' && instance.data.sgKey ? '-' + instance.data.sgKey : '') +
                (instance.type === 'improvement' || instance.type === 'livestock' || instance.type === 'vme' ?
                    (instance.data.type ? '-t.' + instance.data.type : '') +
                    (instance.data.category ? '-c.' + instance.data.category : '') +
                    (instance.data.name ? '-n.' + instance.data.name : '') +
                    (instance.data.purpose ? '-p.' + instance.data.purpose : '') +
                    (instance.data.model ? '-m.' + instance.data.model : '') +
                    (instance.data.identificationNo ? '-in.' + instance.data.identificationNo : '') : '') +
                (instance.type === 'stock' ?
                    (instance.data.type ? '-t.' + instance.data.type : '') +
                    (instance.data.category ? '-c.' + instance.data.category : '') +
                    (instance.data.product ? '-p.' + instance.data.product : '') : '') +
                (instance.data.waterSource ? '-ws.' + instance.data.waterSource : '') +
                (instance.type === 'other' ? (instance.data.name ? '-n.' + instance.data.name : '') : '');
        }

        inheritModel(AssetBase, Model.Base);

        readOnlyProperty(AssetBase, 'assetTypes', {
            'crop': 'Crops',
            'farmland': 'Farmlands',
            'improvement': 'Fixed Improvements',
            'cropland': 'Cropland',
            'livestock': 'Livestock',
            'pasture': 'Pastures',
            'permanent crop': 'Permanent Crops',
            'plantation': 'Plantations',
            'stock': 'Stock',
            'vme': 'Vehicles, Machinery & Equipment',
            'wasteland': 'Homestead & Wasteland',
            'water right': 'Water Rights'
        });

        readOnlyProperty(AssetBase, 'assetTypesWithOther', underscore.extend({
            'other': 'Other'
        }, AssetBase.assetTypes));

        privateProperty(AssetBase, 'getAssetKey', function (asset, legalEntity, farm) {
            return generateKey(asset, legalEntity, farm);
        });

        privateProperty(AssetBase, 'getTypeTitle', function (type) {
            return AssetBase.assetTypes[type] || '';
        });

        privateProperty(AssetBase, 'getTitleType', function (title) {
            var keys = underscore.keys(AssetBase.assetTypes);

            return keys[underscore.values(AssetBase.assetTypes).indexOf(title)];
        });

        AssetBase.validates({
            assetKey: {
                required: true
            },
            data: {
                required: true,
                object: true
            },
            legalEntityId: {
                required: true,
                numeric: true
            },
            type: {
                required: true,
                inclusion: {
                    in: underscore.keys(AssetBase.assetTypesWithOther)
                }
            }
        });

        return AssetBase;
    }]);

sdkModelAsset.factory('AssetFactory', ['Asset', 'Livestock', 'Stock',
    function (Asset, Livestock, Stock) {
        var instances = {
            'livestock': Livestock,
            'stock': Stock
        };

        function apply (attrs, fnName) {
            if (instances[attrs.type]) {
                return instances[attrs.type][fnName](attrs);
            }

            return Asset[fnName](attrs);
        }

        return {
            isInstanceOf: function (asset) {
                return (asset ?
                    (instances[asset.type] ?
                        asset instanceof instances[asset.type] :
                        asset instanceof Asset) :
                    false);
            },
            new: function (attrs) {
                return apply(attrs, 'new');
            },
            newCopy: function (attrs) {
                return apply(attrs, 'newCopy');
            }
        }
    }]);

sdkModelAsset.factory('AssetGroup', ['Asset', 'AssetFactory', 'computedProperty', 'inheritModel', 'Model', 'privateProperty', 'safeMath', 'underscore',
    function (Asset, AssetFactory, computedProperty, inheritModel, Model, privateProperty, safeMath, underscore) {
        function AssetGroup (attrs) {
            Model.Base.apply(this, arguments);

            this.data = (attrs && attrs.data ? attrs.data : {});

            this.assets = [];

            privateProperty(this, 'addAsset', function (asset) {
                addAsset(this, asset);
            });

            privateProperty(this, 'adjustProperty', function (property, value) {
                adjustProperty(this, property, value);
            });

            privateProperty(this, 'availableCrops', function (field) {
                return (field && field.landUse ? Asset.cropsByLandClass[field.landUse] : Asset.cropsByType[this.type]) || [];
            });

            computedProperty(this, 'hasGeometry', function () {
                return underscore.some(this.assets, function (asset) {
                    return !underscore.isUndefined(asset.data.loc);
                });
            });

            privateProperty(this, 'recalculate', function () {
                recalculate(this);
            });

            underscore.each(attrs.assets, this.addAsset, this);
        }

        inheritModel(AssetGroup, Model.Base);

        function addAsset (instance, asset) {
            asset = (AssetFactory.isInstanceOf(asset) ? asset : AssetFactory.new(asset));

            if (underscore.isUndefined(instance.type) || instance.type === asset.type) {
                instance.type = asset.type;
                instance.assets = underscore.chain(instance.assets)
                    .reject(function (item) {
                        return item.assetKey === asset.assetKey;
                    })
                    .union([asset])
                    .value();

                if (underscore.contains(['crop', 'pasture', 'permanent crop', 'plantation'], instance.type) && asset.data.crop) {
                    instance.data.crop = asset.data.crop;
                }

                if (underscore.contains(['permanent crop', 'plantation'], instance.type) && asset.data.establishedDate) {
                    instance.data.establishedDate = asset.data.establishedDate;
                }

                instance.recalculate();
            }
        }

        function adjustProperty (instance, property, value) {
            underscore.each(instance.assets, function (asset) {
                if (asset.data[property] !== instance.data[property]) {
                    asset.data[property] = instance.data[property];
                    asset.data.assetValue = safeMath.times(asset.data.assetValuePerHa, asset.data.size);
                    asset.$dirty = true;
                }
            });
        }

        function recalculate (instance) {
            instance.data = underscore.extend(instance.data, underscore.reduce(instance.assets, function (totals, asset) {
                totals.size = safeMath.plus(totals.size, asset.data.size);
                totals.assetValue = safeMath.plus(totals.assetValue, (asset.data.assetValue ? asset.data.assetValue : safeMath.times(asset.data.assetValuePerHa, asset.data.size)));
                totals.assetValuePerHa = safeMath.dividedBy(totals.assetValue, totals.size);

                return totals;
            }, {}));

            instance.data.assetValue = (instance.data.size && instance.data.assetValuePerHa ?
                safeMath.times(instance.data.assetValuePerHa, instance.data.size) :
                instance.data.assetValue);
        }

        return AssetGroup;
    }]);

sdkModelAsset.factory('Asset', ['AssetBase', 'attachmentHelper', 'Base', 'computedProperty', 'Field', 'inheritModel', 'moment', 'naturalSort', 'privateProperty', 'ProductionSchedule', 'readOnlyProperty', 'safeMath', 'underscore',
    function (AssetBase, attachmentHelper, Base, computedProperty, Field, inheritModel, moment, naturalSort, privateProperty, ProductionSchedule, readOnlyProperty, safeMath, underscore) {
        function Asset (attrs) {
            AssetBase.apply(this, arguments);

            privateProperty(this, 'generateUniqueName', function (categoryLabel, assets) {
                this.data.name = generateUniqueName(this, categoryLabel, assets);
            });

            privateProperty(this, 'getAge', function (asOfDate) {
                return (this.data.establishedDate ? moment(asOfDate).diff(this.data.establishedDate, 'years', true) : 0);
            });

            privateProperty(this, 'getCategories', function () {
                return Asset.categories[this.type] || [];
            });

            privateProperty(this, 'getCustomTitle', function (props, options) {
                return getCustomTitle(this, props, options);
            });

            privateProperty(this, 'getTitle', function (withField, farm) {
                return getTitle(this, withField, farm);
            });

            privateProperty(this, 'isFieldApplicable', function (field) {
                return isFieldApplicable(this, field);
            });

            privateProperty(this, 'clean', function () {
                if (this.type === 'vme') {
                    this.data.quantity = (this.data.identificationNo && this.data.identificationNo.length > 0 ? 1 : this.data.quantity);
                    this.data.identificationNo = (this.data.quantity !== 1 ? '' : this.data.identificationNo);
                } else if (this.type === 'cropland') {
                    this.data.equipped = (this.data.irrigated ? this.data.equipped : false);
                }
            });

            computedProperty(this, 'thumbnailUrl', function () {
                return attachmentHelper.findSize(this, 'thumb', 'img/camera.png');
            });

            computedProperty(this, 'age', function () {
                return (this.data.establishedDate ? moment().diff(this.data.establishedDate, 'years', true) : 0);
            });

            computedProperty(this, 'title', function () {
                return getTitle(this, true);
            });

            computedProperty(this, 'description', function () {
                return this.data.description || '';
            });

            computedProperty(this, 'fieldName', function () {
                return this.data.fieldName;
            });

            computedProperty(this, 'size', function () {
                return (this.type !== 'farmland' ? this.data.size : this.data.area);
            });

            // Crop
            privateProperty(this, 'availableCrops', function (field) {
                return (field && field.landUse ? Asset.cropsByLandClass[field.landUse] : Asset.cropsByType[this.type]) || [];
            });

            computedProperty(this, 'crop', function () {
                return this.data.crop;
            });

            computedProperty(this, 'establishedDate', function () {
                return this.data.establishedDate;
            });

            // Value / Liability
            computedProperty(this, 'liquidityTypeTitle', function () {
                return (this.data.liquidityType && this.assetTypes[this.data.liquidityType]) || '';
            });

            privateProperty(this, 'incomeInRange', function (rangeStart, rangeEnd) {
                var income = {};

                if (this.data.sold === true && this.data.salePrice && moment(this.data.soldDate, 'YYYY-MM-DD').isBetween(rangeStart, rangeEnd)) {
                    income['Sales'] = this.data.salePrice;
                }

                return income;
            });

            privateProperty(this, 'totalIncomeInRange', function (rangeStart, rangeEnd) {
                return underscore.reduce(this.incomeInRange(rangeStart, rangeEnd), function (total, value) {
                    return safeMath.plus(total, value);
                }, 0);
            });

            Base.initializeObject(this.data, 'zones', []);

            this.farmId = attrs.farmId;

            this.productionSchedules = underscore.map(attrs.productionSchedules, function (schedule) {
                return ProductionSchedule.newCopy(schedule);
            });

            if (!this.data.assetValuePerHa && this.data.assetValue && this.size) {
                this.data.assetValuePerHa = safeMath.dividedBy(this.data.assetValue, this.size);
                this.$dirty = true;
            }
        }

        inheritModel(Asset, AssetBase);

        readOnlyProperty(Asset, 'categories', {
            improvement: [
                {category: 'Airport', subCategory: 'Hangar'},
                {category: 'Airport', subCategory: 'Helipad'},
                {category: 'Airport', subCategory: 'Runway'},
                {category: 'Poultry', subCategory: 'Hatchery'},
                {category: 'Aquaculture', subCategory: 'Pond'},
                {category: 'Aquaculture', subCategory: 'Net House'},
                {category: 'Aviary'},
                {category: 'Beekeeping'},
                {category: 'Borehole'},
                {category: 'Borehole', subCategory: 'Equipped'},
                {category: 'Borehole', subCategory: 'Pump'},
                {category: 'Borehole', subCategory: 'Windmill'},
                {category: 'Poultry', subCategory: 'Broiler House'},
                {category: 'Poultry', subCategory: 'Broiler House - Atmosphere'},
                {category: 'Poultry', subCategory: 'Broiler House - Semi'},
                {category: 'Poultry', subCategory: 'Broiler House - Zinc'},
                {category: 'Building', subCategory: 'Administrative'},
                {category: 'Building'},
                {category: 'Building', subCategory: 'Commercial'},
                {category: 'Building', subCategory: 'Entrance'},
                {category: 'Building', subCategory: 'Lean-to'},
                {category: 'Building', subCategory: 'Outbuilding'},
                {category: 'Building', subCategory: 'Gate'},
                {category: 'Cold Storage'},
                {category: 'Commercial', subCategory: 'Coffee Shop'},
                {category: 'Commercial', subCategory: 'Sales Facility'},
                {category: 'Commercial', subCategory: 'Shop'},
                {category: 'Commercial', subCategory: 'Bar'},
                {category: 'Commercial', subCategory: 'Café'},
                {category: 'Commercial', subCategory: 'Restaurant'},
                {category: 'Commercial', subCategory: 'Factory'},
                {category: 'Commercial', subCategory: 'Tasting Facility'},
                {category: 'Commercial', subCategory: 'Cloth House'},
                {category: 'Compost', subCategory: 'Preparing Unit'},
                {category: 'Crocodile Dam'},
                {category: 'Crop Processing', subCategory: 'Degreening Room'},
                {category: 'Crop Processing', subCategory: 'Dehusking Facility'},
                {category: 'Crop Processing', subCategory: 'Drying Facility'},
                {category: 'Crop Processing', subCategory: 'Drying Tunnels'},
                {category: 'Crop Processing', subCategory: 'Sorting Facility'},
                {category: 'Crop Processing', subCategory: 'Drying Oven'},
                {category: 'Crop Processing', subCategory: 'Drying Racks'},
                {category: 'Crop Processing', subCategory: 'Crushing Plant'},
                {category: 'Crop Processing', subCategory: 'Nut Cracking Facility'},
                {category: 'Crop Processing', subCategory: 'Nut Factory'},
                {category: 'Dairy'},
                {category: 'Dairy', subCategory: 'Pasteurising Facility'},
                {category: 'Dairy', subCategory: 'Milking Parlour'},
                {category: 'Dam'},
                {category: 'Dam', subCategory: 'Filter'},
                {category: 'Dam', subCategory: 'Trout'},
                {category: 'Domestic', subCategory: 'Chicken Coop'},
                {category: 'Domestic', subCategory: 'Chicken Run'},
                {category: 'Domestic', subCategory: 'Kennels'},
                {category: 'Domestic', subCategory: 'Gardening Facility'},
                {category: 'Education', subCategory: 'Conference Room'},
                {category: 'Education', subCategory: 'Classroom'},
                {category: 'Education', subCategory: 'Crèche'},
                {category: 'Education', subCategory: 'School'},
                {category: 'Education', subCategory: 'Training Facility'},
                {category: 'Equipment', subCategory: 'Air Conditioner'},
                {category: 'Equipment', subCategory: 'Gantry'},
                {category: 'Equipment', subCategory: 'Oven'},
                {category: 'Equipment', subCategory: 'Pump'},
                {category: 'Equipment', subCategory: 'Pumphouse'},
                {category: 'Equipment', subCategory: 'Scale'},
                {category: 'Feed Mill'},
                {category: 'Feedlot'},
                {category: 'Fencing'},
                {category: 'Fencing', subCategory: 'Electric'},
                {category: 'Fencing', subCategory: 'Game'},
                {category: 'Fencing', subCategory: 'Perimeter'},
                {category: 'Fencing', subCategory: 'Security'},
                {category: 'Fencing', subCategory: 'Wire'},
                {category: 'Fuel', subCategory: 'Tanks'},
                {category: 'Fuel', subCategory: 'Tank Stand'},
                {category: 'Fuel', subCategory: 'Fuelling Facility'},
                {category: 'Grain Mill'},
                {category: 'Greenhouse'},
                {category: 'Infrastructure'},
                {category: 'Irrigation', subCategory: 'Sprinklers'},
                {category: 'Irrigation'},
                {category: 'Laboratory'},
                {category: 'Livestock Handling', subCategory: 'Auction Facility'},
                {category: 'Livestock Handling', subCategory: 'Cages'},
                {category: 'Livestock Handling', subCategory: 'Growing House'},
                {category: 'Livestock Handling', subCategory: 'Pens'},
                {category: 'Livestock Handling', subCategory: 'Shelter'},
                {category: 'Livestock Handling', subCategory: 'Breeding Facility'},
                {category: 'Livestock Handling', subCategory: 'Culling Shed'},
                {category: 'Livestock Handling', subCategory: 'Dipping Facility'},
                {category: 'Livestock Handling', subCategory: 'Elephant Enclosures'},
                {category: 'Livestock Handling', subCategory: 'Feed Troughs/Dispensers'},
                {category: 'Livestock Handling', subCategory: 'Horse Walker'},
                {category: 'Livestock Handling', subCategory: 'Maternity Shelter/Pen'},
                {category: 'Livestock Handling', subCategory: 'Quarantine Area'},
                {category: 'Livestock Handling', subCategory: 'Rehab Facility'},
                {category: 'Livestock Handling', subCategory: 'Shearing Facility'},
                {category: 'Livestock Handling', subCategory: 'Stable'},
                {category: 'Livestock Handling', subCategory: 'Surgery'},
                {category: 'Livestock Handling', subCategory: 'Treatment Area'},
                {category: 'Livestock Handling', subCategory: 'Weaner House'},
                {category: 'Livestock Handling', subCategory: 'Grading Facility'},
                {category: 'Livestock Handling', subCategory: 'Inspection Facility'},
                {category: 'Logistics', subCategory: 'Handling Equipment'},
                {category: 'Logistics', subCategory: 'Handling Facility'},
                {category: 'Logistics', subCategory: 'Depot'},
                {category: 'Logistics', subCategory: 'Loading Area'},
                {category: 'Logistics', subCategory: 'Loading Shed'},
                {category: 'Logistics', subCategory: 'Hopper'},
                {category: 'Logistics', subCategory: 'Weigh Bridge'},
                {category: 'Meat Processing', subCategory: 'Abattoir'},
                {category: 'Meat Processing', subCategory: 'Deboning Room'},
                {category: 'Meat Processing', subCategory: 'Skinning Facility'},
                {category: 'Mill'},
                {category: 'Mushrooms', subCategory: 'Cultivation'},
                {category: 'Mushrooms', subCategory: 'Sweat Room'},
                {category: 'Nursery ', subCategory: 'Plant'},
                {category: 'Nursery ', subCategory: 'Plant Growing Facility'},
                {category: 'Office'},
                {category: 'Packaging Facility'},
                {category: 'Paddocks', subCategory: 'Camp'},
                {category: 'Paddocks', subCategory: 'Kraal'},
                {category: 'Paddocks'},
                {category: 'Piggery', subCategory: 'Farrowing House'},
                {category: 'Piggery', subCategory: 'Pig Sty'},
                {category: 'Processing', subCategory: 'Bottling Facility'},
                {category: 'Processing', subCategory: 'Flavour Shed'},
                {category: 'Processing', subCategory: 'Processing Facility'},
                {category: 'Recreation', subCategory: 'Viewing Area'},
                {category: 'Recreation', subCategory: 'BBQ'},
                {category: 'Recreation', subCategory: 'Clubhouse'},
                {category: 'Recreation', subCategory: 'Event Venue'},
                {category: 'Recreation', subCategory: 'Gallery'},
                {category: 'Recreation', subCategory: 'Game Room'},
                {category: 'Recreation', subCategory: 'Gazebo'},
                {category: 'Recreation', subCategory: 'Gymnasium'},
                {category: 'Recreation', subCategory: 'Jacuzzi'},
                {category: 'Recreation', subCategory: 'Judging Booth'},
                {category: 'Recreation', subCategory: 'Museum'},
                {category: 'Recreation', subCategory: 'Play Area'},
                {category: 'Recreation', subCategory: 'Pool House'},
                {category: 'Recreation', subCategory: 'Pottery Room'},
                {category: 'Recreation', subCategory: 'Racing Track'},
                {category: 'Recreation', subCategory: 'Salon'},
                {category: 'Recreation', subCategory: 'Sauna'},
                {category: 'Recreation', subCategory: 'Shooting Range'},
                {category: 'Recreation', subCategory: 'Spa Facility'},
                {category: 'Recreation', subCategory: 'Squash Court'},
                {category: 'Recreation', subCategory: 'Swimming Pool'},
                {category: 'Recreation'},
                {category: 'Religeous', subCategory: 'Church'},
                {category: 'Residential', subCategory: 'Carport'},
                {category: 'Residential', subCategory: 'Driveway'},
                {category: 'Residential', subCategory: 'Flooring'},
                {category: 'Residential', subCategory: 'Paving'},
                {category: 'Residential', subCategory: 'Roofing'},
                {category: 'Residential', subCategory: 'Water Feature'},
                {category: 'Residential', subCategory: 'Hall'},
                {category: 'Residential', subCategory: 'Balcony'},
                {category: 'Residential', subCategory: 'Canopy'},
                {category: 'Residential', subCategory: 'Concrete Surface'},
                {category: 'Residential', subCategory: 'Courtyard'},
                {category: 'Residential', subCategory: 'Covered'},
                {category: 'Residential', subCategory: 'Deck'},
                {category: 'Residential', subCategory: 'Mezzanine'},
                {category: 'Residential', subCategory: 'Parking Area'},
                {category: 'Residential', subCategory: 'Patio'},
                {category: 'Residential', subCategory: 'Porch'},
                {category: 'Residential', subCategory: 'Porte Cochere'},
                {category: 'Residential', subCategory: 'Terrace'},
                {category: 'Residential', subCategory: 'Veranda'},
                {category: 'Residential', subCategory: 'Walkways'},
                {category: 'Residential', subCategory: 'Rondavel'},
                {category: 'Residential', subCategory: 'Accommodation Units'},
                {category: 'Residential', subCategory: 'Boma'},
                {category: 'Residential', subCategory: 'Bungalow'},
                {category: 'Residential', subCategory: 'Bunker'},
                {category: 'Residential', subCategory: 'Cabin'},
                {category: 'Residential', subCategory: 'Chalet'},
                {category: 'Residential', subCategory: 'Community Centre'},
                {category: 'Residential', subCategory: 'Dormitory'},
                {category: 'Residential', subCategory: 'Dwelling'},
                {category: 'Residential', subCategory: 'Flat'},
                {category: 'Residential', subCategory: 'Kitchen'},
                {category: 'Residential', subCategory: 'Lapa'},
                {category: 'Residential', subCategory: 'Laundry Facility'},
                {category: 'Residential', subCategory: 'Locker Room'},
                {category: 'Residential', subCategory: 'Lodge'},
                {category: 'Residential', subCategory: 'Shower'},
                {category: 'Residential', subCategory: 'Toilets'},
                {category: 'Residential', subCategory: 'Room'},
                {category: 'Residential', subCategory: 'Cottage'},
                {category: 'Residential', subCategory: 'Garage'},
                {category: 'Roads', subCategory: 'Access Roads'},
                {category: 'Roads', subCategory: 'Gravel'},
                {category: 'Roads', subCategory: 'Tarred'},
                {category: 'Security', subCategory: 'Control Room'},
                {category: 'Security', subCategory: 'Guardhouse'},
                {category: 'Security', subCategory: 'Office'},
                {category: 'Shade Nets'},
                {category: 'Silo'},
                {category: 'Sports', subCategory: 'Arena'},
                {category: 'Sports', subCategory: 'Tennis Court'},
                {category: 'Staff', subCategory: 'Hostel'},
                {category: 'Staff', subCategory: 'Hut'},
                {category: 'Staff', subCategory: 'Retirement Centre'},
                {category: 'Staff', subCategory: 'Staff Building'},
                {category: 'Staff', subCategory: 'Canteen'},
                {category: 'Staff', subCategory: 'Dining Facility'},
                {category: 'Storage', subCategory: 'Truck Shelter'},
                {category: 'Storage', subCategory: 'Barn'},
                {category: 'Storage', subCategory: 'Dark Room'},
                {category: 'Storage', subCategory: 'Bin Compartments'},
                {category: 'Storage', subCategory: 'Machinery'},
                {category: 'Storage', subCategory: 'Saddle Room'},
                {category: 'Storage', subCategory: 'Shed'},
                {category: 'Storage', subCategory: 'Chemicals'},
                {category: 'Storage', subCategory: 'Tools'},
                {category: 'Storage', subCategory: 'Dry'},
                {category: 'Storage', subCategory: 'Equipment'},
                {category: 'Storage', subCategory: 'Feed'},
                {category: 'Storage', subCategory: 'Fertilizer'},
                {category: 'Storage', subCategory: 'Fuel'},
                {category: 'Storage', subCategory: 'Grain'},
                {category: 'Storage', subCategory: 'Hides'},
                {category: 'Storage', subCategory: 'Oil'},
                {category: 'Storage', subCategory: 'Pesticide'},
                {category: 'Storage', subCategory: 'Poison'},
                {category: 'Storage', subCategory: 'Seed'},
                {category: 'Storage', subCategory: 'Zinc'},
                {category: 'Storage', subCategory: 'Sulphur'},
                {category: 'Storage'},
                {category: 'Storage', subCategory: 'Vitamin Room'},
                {category: 'Sugar Mill'},
                {category: 'Tanks', subCategory: 'Water'},
                {category: 'Timber Mill'},
                {category: 'Trench'},
                {category: 'Utilities', subCategory: 'Battery Room'},
                {category: 'Utilities', subCategory: 'Boiler Room'},
                {category: 'Utilities', subCategory: 'Compressor Room'},
                {category: 'Utilities', subCategory: 'Engine Room'},
                {category: 'Utilities', subCategory: 'Generator'},
                {category: 'Utilities', subCategory: 'Power Room'},
                {category: 'Utilities', subCategory: 'Pumphouse'},
                {category: 'Utilities', subCategory: 'Transformer Room'},
                {category: 'Utilities'},
                {category: 'Vacant Area'},
                {category: 'Vehicles', subCategory: 'Transport Depot'},
                {category: 'Vehicles', subCategory: 'Truck Wash'},
                {category: 'Vehicles', subCategory: 'Workshop'},
                {category: 'Walls'},
                {category: 'Walls', subCategory: 'Boundary'},
                {category: 'Walls', subCategory: 'Retaining'},
                {category: 'Walls', subCategory: 'Security'},
                {category: 'Warehouse'},
                {category: 'Water', subCategory: 'Reservoir'},
                {category: 'Water', subCategory: 'Tower'},
                {category: 'Water', subCategory: 'Purification Plant'},
                {category: 'Water', subCategory: 'Reticulation Works'},
                {category: 'Water', subCategory: 'Filter Station'},
                {category: 'Wine Cellar', subCategory: 'Tanks'},
                {category: 'Wine Cellar'},
                {category: 'Wine Cellar', subCategory: 'Winery'},
                {category: 'Wine Cellar', subCategory: 'Barrel Maturation Room'}
            ],
            livestock: [
                {category: 'Cattle', subCategory: 'Phase A Bulls', purpose: 'Breeding'},
                {category: 'Cattle', subCategory: 'Phase B Bulls', purpose: 'Breeding'},
                {category: 'Cattle', subCategory: 'Phase C Bulls', purpose: 'Breeding'},
                {category: 'Cattle', subCategory: 'Phase D Bulls', purpose: 'Breeding'},
                {category: 'Cattle', subCategory: 'Heifers', purpose: 'Breeding'},
                {category: 'Cattle', subCategory: 'Bull Calves', purpose: 'Breeding'},
                {category: 'Cattle', subCategory: 'Heifer Calves', purpose: 'Breeding'},
                {category: 'Cattle', subCategory: 'Tollies 1-2', purpose: 'Breeding'},
                {category: 'Cattle', subCategory: 'Heifers 1-2', purpose: 'Breeding'},
                {category: 'Cattle', subCategory: 'Culls', purpose: 'Breeding'},
                {category: 'Cattle', subCategory: 'Bulls', purpose: 'Dairy'},
                {category: 'Cattle', subCategory: 'Dry Cows', purpose: 'Dairy'},
                {category: 'Cattle', subCategory: 'Lactating Cows', purpose: 'Dairy'},
                {category: 'Cattle', subCategory: 'Heifers', purpose: 'Dairy'},
                {category: 'Cattle', subCategory: 'Calves', purpose: 'Dairy'},
                {category: 'Cattle', subCategory: 'Culls', purpose: 'Dairy'},
                {category: 'Cattle', subCategory: 'Bulls', purpose: 'Slaughter'},
                {category: 'Cattle', subCategory: 'Cows', purpose: 'Slaughter'},
                {category: 'Cattle', subCategory: 'Heifers', purpose: 'Slaughter'},
                {category: 'Cattle', subCategory: 'Weaners', purpose: 'Slaughter'},
                {category: 'Cattle', subCategory: 'Calves', purpose: 'Slaughter'},
                {category: 'Cattle', subCategory: 'Culls', purpose: 'Slaughter'},
                {category: 'Chickens', subCategory: 'Day Old Chicks', purpose: 'Broilers'},
                {category: 'Chickens', subCategory: 'Broilers', purpose: 'Broilers'},
                {category: 'Chickens', subCategory: 'Hens', purpose: 'Layers'},
                {category: 'Chickens', subCategory: 'Point of Laying Hens', purpose: 'Layers'},
                {category: 'Chickens', subCategory: 'Culls', purpose: 'Layers'},
                {category: 'Game', subCategory: 'Game', purpose: 'Slaughter'},
                {category: 'Goats', subCategory: 'Rams', purpose: 'Slaughter'},
                {category: 'Goats', subCategory: 'Breeding Ewes', purpose: 'Slaughter'},
                {category: 'Goats', subCategory: 'Young Ewes', purpose: 'Slaughter'},
                {category: 'Goats', subCategory: 'Kids', purpose: 'Slaughter'},
                {category: 'Horses', subCategory: 'Horses', purpose: 'Breeding'},
                {category: 'Pigs', subCategory: 'Boars', purpose: 'Slaughter'},
                {category: 'Pigs', subCategory: 'Breeding Sows', purpose: 'Slaughter'},
                {category: 'Pigs', subCategory: 'Weaned pigs', purpose: 'Slaughter'},
                {category: 'Pigs', subCategory: 'Piglets', purpose: 'Slaughter'},
                {category: 'Pigs', subCategory: 'Porkers', purpose: 'Slaughter'},
                {category: 'Pigs', subCategory: 'Baconers', purpose: 'Slaughter'},
                {category: 'Pigs', subCategory: 'Culls', purpose: 'Slaughter'},
                {category: 'Ostriches', subCategory: 'Breeding Stock', purpose: 'Slaughter'},
                {category: 'Ostriches', subCategory: 'Slaughter Birds > 3 months', purpose: 'Slaughter'},
                {category: 'Ostriches', subCategory: 'Slaughter Birds < 3 months', purpose: 'Slaughter'},
                {category: 'Ostriches', subCategory: 'Chicks', purpose: 'Slaughter'},
                {category: 'Rabbits', subCategory: 'Rabbits', purpose: 'Slaughter'},
                {category: 'Sheep', subCategory: 'Rams', purpose: 'Breeding'},
                {category: 'Sheep', subCategory: 'Young Rams', purpose: 'Breeding'},
                {category: 'Sheep', subCategory: 'Ewes', purpose: 'Breeding'},
                {category: 'Sheep', subCategory: 'Young Ewes', purpose: 'Breeding'},
                {category: 'Sheep', subCategory: 'Lambs', purpose: 'Breeding'},
                {category: 'Sheep', subCategory: 'Wethers', purpose: 'Breeding'},
                {category: 'Sheep', subCategory: 'Culls', purpose: 'Breeding'},
                {category: 'Sheep', subCategory: 'Rams', purpose: 'Slaughter'},
                {category: 'Sheep', subCategory: 'Ewes', purpose: 'Slaughter'},
                {category: 'Sheep', subCategory: 'Lambs', purpose: 'Slaughter'},
                {category: 'Sheep', subCategory: 'Wethers', purpose: 'Slaughter'},
                {category: 'Sheep', subCategory: 'Culls', purpose: 'Slaughter'}
            ],
            stock: [
                {category: 'Animal Feed', subCategory: 'Lick', unit: 'kg'},
                {category: 'Indirect Costs', subCategory: 'Fuel', unit: 'l'},
                {category: 'Indirect Costs', subCategory: 'Water', unit: 'l'},
                {category: 'Preharvest', subCategory: 'Seed', unit: 'kg'},
                {category: 'Preharvest', subCategory: 'Plant Material', unit: 'each'},
                {category: 'Preharvest', subCategory: 'Fertiliser', unit: 't'},
                {category: 'Preharvest', subCategory: 'Fungicides', unit: 'l'},
                {category: 'Preharvest', subCategory: 'Lime', unit: 't'},
                {category: 'Preharvest', subCategory: 'Herbicides', unit: 'l'},
                {category: 'Preharvest', subCategory: 'Pesticides', unit: 'l'}
            ],
            vme: [
                {category: 'Vehicles', subCategory: 'LDV'},
                {category: 'Vehicles', subCategory: 'LDV (Double Cab)'},
                {category: 'Vehicles', subCategory: 'LDV (4-Wheel)'},
                {category: 'Vehicles', subCategory: 'LDV (Double Cab 4-Wheel)'},
                {category: 'Vehicles', subCategory: 'Truck'},
                {category: 'Vehicles', subCategory: 'Truck (Double Differential)'},
                {category: 'Vehicles', subCategory: 'Truck (Horse)'},
                {category: 'Vehicles', subCategory: 'Truck (Semi-trailer)'},
                {category: 'Vehicles', subCategory: 'Truck (Timber Trailer)'},
                {category: 'Vehicles', subCategory: 'Truck (Cane Trailer)'},
                {category: 'Machinery', subCategory: 'Tractor'},
                {category: 'Machinery', subCategory: 'Tractor (4-Wheel)'},
                {category: 'Machinery', subCategory: 'Tractor (Orchard)'},
                {category: 'Machinery', subCategory: 'Tractor (Orchard, 4-Wheel)'},
                {category: 'Machinery', subCategory: 'Road Grader'},
                {category: 'Machinery', subCategory: 'Front-end Loader'},
                {category: 'Machinery', subCategory: 'Bulldozer'},
                {category: 'Machinery', subCategory: 'Forklift'},
                {category: 'Machinery', subCategory: 'Borehole Machine'},
                {category: 'Machinery', subCategory: 'Loader (Cane)'},
                {category: 'Machinery', subCategory: 'Loader (Timber)'},
                {category: 'Machinery', subCategory: 'Harvester (Maize Combine)'},
                {category: 'Machinery', subCategory: 'Harvester (Wheat Combine)'},
                {category: 'Machinery', subCategory: 'Electric Motor'},
                {category: 'Machinery', subCategory: 'Internal Combustion Engine'},
                {category: 'Machinery', subCategory: 'Irrigation Pump'},
                {category: 'Machinery', subCategory: 'Irrigation Pump (Electrical)'},
                {category: 'Machinery', subCategory: 'Irrigation Pump (Internal Combustion Engine) '},
                {category: 'Equipment', subCategory: 'Ripper'},
                {category: 'Equipment', subCategory: 'Ripper (Sugar Cane)'},
                {category: 'Equipment', subCategory: 'Ripper (Heavy Duty)'},
                {category: 'Equipment', subCategory: 'Ripper (Auto Reset)'},
                {category: 'Equipment', subCategory: 'Plough'},
                {category: 'Equipment', subCategory: 'Plough (Moldboard)'},
                {category: 'Equipment', subCategory: 'Plough (Disc)'},
                {category: 'Equipment', subCategory: 'Plough (Chisel)'},
                {category: 'Equipment', subCategory: 'Plough (Bulldog)'},
                {category: 'Equipment', subCategory: 'Harrow'},
                {category: 'Equipment', subCategory: 'Harrow (Offset Disc)'},
                {category: 'Equipment', subCategory: 'Harrow (Hydraulic Offset)'},
                {category: 'Equipment', subCategory: 'Harrow (Offset Trailer)'},
                {category: 'Equipment', subCategory: 'Harrow (Tandem Disc)'},
                {category: 'Equipment', subCategory: 'Harrow (Rotary)'},
                {category: 'Equipment', subCategory: 'Harrow (Power)'},
                {category: 'Equipment', subCategory: 'Ridger'},
                {category: 'Equipment', subCategory: 'Ridger (Disc)'},
                {category: 'Equipment', subCategory: 'Ridger (Shear)'},
                {category: 'Equipment', subCategory: 'Tiller'},
                {category: 'Equipment', subCategory: 'Tiller (S-Shank)'},
                {category: 'Equipment', subCategory: 'Tiller (C-Shank)'},
                {category: 'Equipment', subCategory: 'Tiller (Vibro-flex)'},
                {category: 'Equipment', subCategory: 'Tiller (Otma)'},
                {category: 'Equipment', subCategory: 'Cultivator'},
                {category: 'Equipment', subCategory: 'Cultivator (Shank Tiller)'},
                {category: 'Equipment', subCategory: 'Cultivator (Vibro Tiller)'},
                {category: 'Equipment', subCategory: 'Planter'},
                {category: 'Equipment', subCategory: 'Planter (Single Kernel)'},
                {category: 'Equipment', subCategory: 'Planter (Seed Drill)'},
                {category: 'Equipment', subCategory: 'Planter (Wheat)'},
                {category: 'Equipment', subCategory: 'Planter (Potato)'},
                {category: 'Equipment', subCategory: 'Vegetable Transplanter'},
                {category: 'Equipment', subCategory: 'Fine Seed Seeder'},
                {category: 'Equipment', subCategory: 'Land Roller'},
                {category: 'Equipment', subCategory: 'Spreader (Fertiliser)'},
                {category: 'Equipment', subCategory: 'Spreader (Manure)'},
                {category: 'Equipment', subCategory: 'Spreader (Lime)'},
                {category: 'Equipment', subCategory: 'Mist Blower'},
                {category: 'Equipment', subCategory: 'Boom Sprayer'},
                {category: 'Equipment', subCategory: 'Boom Sprayer (Mounted)'},
                {category: 'Equipment', subCategory: 'Boom Sprayer (Trailer)'},
                {category: 'Equipment', subCategory: 'Mower'},
                {category: 'Equipment', subCategory: 'Mower (Conditioner)'},
                {category: 'Equipment', subCategory: 'Slasher'},
                {category: 'Equipment', subCategory: 'Haymaker'},
                {category: 'Equipment', subCategory: 'Hay Rake'},
                {category: 'Equipment', subCategory: 'Hay Baler'},
                {category: 'Equipment', subCategory: 'Hay Baler (Square)'},
                {category: 'Equipment', subCategory: 'Hay Baler (Round)'},
                {category: 'Equipment', subCategory: 'Bale Handler'},
                {category: 'Equipment', subCategory: 'Bale Handler (Round)'},
                {category: 'Equipment', subCategory: 'Bale Handler (Wrapper)'},
                {category: 'Equipment', subCategory: 'Bale Handler (Shredder)'},
                {category: 'Equipment', subCategory: 'Harvester (Combine Trailer)'},
                {category: 'Equipment', subCategory: 'Harvester (Forage)'},
                {category: 'Equipment', subCategory: 'Harvester (Forage Chop)'},
                {category: 'Equipment', subCategory: 'Harvester (Forage Flail)'},
                {category: 'Equipment', subCategory: 'Harvester (Thresher)'},
                {category: 'Equipment', subCategory: 'Harvester (Potato Lifter)'},
                {category: 'Equipment', subCategory: 'Harvester (Potato Sorter)'},
                {category: 'Equipment', subCategory: 'Harvester (Groundnut Picker)'},
                {category: 'Equipment', subCategory: 'Harvester (Groundnut Sheller)'},
                {category: 'Equipment', subCategory: 'Harvester (Groundnut Lifter)'},
                {category: 'Equipment', subCategory: 'Hammer Mill'},
                {category: 'Equipment', subCategory: 'Feed Mixer'},
                {category: 'Equipment', subCategory: 'Roller Mill'},
                {category: 'Equipment', subCategory: 'Grain Pump'},
                {category: 'Equipment', subCategory: 'Grain Grader'},
                {category: 'Equipment', subCategory: 'Grain Drier'},
                {category: 'Equipment', subCategory: 'Grader (Rear Mounted)'},
                {category: 'Equipment', subCategory: 'Dam Scoop'},
                {category: 'Equipment', subCategory: 'Post Digger'},
                {category: 'Equipment', subCategory: 'Trailer'},
                {category: 'Equipment', subCategory: 'Trailer (Tip)'},
                {category: 'Equipment', subCategory: 'Trailer (4-Wheel)'},
                {category: 'Equipment', subCategory: 'Trailer (Water Cart)'},
                {category: 'Equipment', subCategory: 'Trailer (Cane)'},
                {category: 'Equipment', subCategory: 'Trailer (Cane Truck)'},
                {category: 'Equipment', subCategory: 'Trailer (Timber)'},
                {category: 'Equipment', subCategory: 'Trailer (Timber Truck)'}
            ]
        });

        readOnlyProperty(Asset, 'landClassesByType', {
            'crop': [
                'Cropland',
                'Cropland (Emerging)',
                'Cropland (Irrigated)',
                'Cropland (Smallholding)',
                'Vegetables'],
            'cropland': [
                'Cropland',
                'Cropland (Emerging)',
                'Cropland (Irrigated)',
                'Cropland (Smallholding)',
                'Vegetables'],
            'farmland': [],
            'improvement': [],
            'livestock': [
                'Grazing',
                'Grazing (Bush)',
                'Grazing (Fynbos)',
                'Grazing (Shrubland)',
                'Planted Pastures'],
            'pasture': [
                'Grazing',
                'Grazing (Bush)',
                'Grazing (Fynbos)',
                'Grazing (Shrubland)',
                'Planted Pastures'],
            'permanent crop': [
                'Greenhouses',
                'Orchard',
                'Orchard (Shadenet)',
                'Vineyard'],
            'plantation': [
                'Forest',
                'Pineapple',
                'Plantation',
                'Plantation (Smallholding)',
                'Sugarcane',
                'Sugarcane (Emerging)',
                'Sugarcane (Irrigated)',
                'Tea'],
            'vme': [],
            'wasteland': [
                'Non-vegetated'],
            'water right': [
                'Water',
                'Water (Seasonal)',
                'Wetland']
        });

        var _croplandCrops = [
            'Barley',
            'Bean',
            'Bean (Broad)',
            'Bean (Dry)',
            'Bean (Sugar)',
            'Bean (Green)',
            'Bean (Kidney)',
            'Beet',
            'Broccoli',
            'Butternut',
            'Cabbage',
            'Canola',
            'Carrot',
            'Cassava',
            'Cauliflower',
            'Cotton',
            'Cowpea',
            'Grain Sorghum',
            'Groundnut',
            'Leek',
            'Lucerne',
            'Maize',
            'Maize (White)',
            'Maize (Yellow)',
            'Oats',
            'Onion',
            'Peanut',
            'Pearl Millet',
            'Potato',
            'Pumpkin',
            'Rapeseed',
            'Rice',
            'Rye',
            'Soya Bean',
            'Sunflower',
            'Sweet Corn',
            'Sweet Potato',
            'Teff',
            'Tobacco',
            'Triticale',
            'Turnip',
            'Wheat',
            'Wheat (Durum)'
        ];
        var _croplandIrrigatedCrops = [
            'Maize (Irrigated)',
            'Soya Bean (Irrigated)',
            'Teff (Irrigated)',
            'Wheat (Irrigated)'
        ];
        var _croplandAllCrops = underscore.union(_croplandCrops, _croplandIrrigatedCrops).sort(naturalSort);
        var _grazingCrops = [
            'Bahia-Notatum',
            'Birdsfoot Trefoil',
            'Bottle Brush',
            'Buffalo',
            'Buffalo (Blue)',
            'Buffalo (White)',
            'Bush',
            'Carribean Stylo',
            'Clover',
            'Clover (Arrow Leaf)',
            'Clover (Crimson)',
            'Clover (Persian)',
            'Clover (Red)',
            'Clover (Rose)',
            'Clover (Strawberry)',
            'Clover (Subterranean)',
            'Clover (White)',
            'Cocksfoot',
            'Common Setaria',
            'Dallis',
            'Kikuyu',
            'Lucerne',
            'Lupin',
            'Lupin (Narrow Leaf)',
            'Lupin (White)',
            'Lupin (Yellow)',
            'Medic',
            'Medic (Barrel)',
            'Medic (Burr)',
            'Medic (Gama)',
            'Medic (Snail)',
            'Medic (Strand)',
            'Multispecies Pasture',
            'Phalaris',
            'Rescue',
            'Rhodes',
            'Russian Grass',
            'Ryegrass',
            'Ryegrass (Hybrid)',
            'Ryegrass (Italian)',
            'Ryegrass (Westerwolds)',
            'Serradella',
            'Serradella (Yellow)',
            'Silver Leaf Desmodium',
            'Smuts Finger',
            'Soutbos',
            'Tall Fescue',
            'Teff',
            'Veld',
            'Weeping Lovegrass'
        ];
        var _perennialCrops = [
            'Almond',
            'Apple',
            'Apricot',
            'Avocado',
            'Banana',
            'Barberry',
            'Berry',
            'Bilberry',
            'Blackberry',
            'Blueberry',
            'Cherry',
            'Cloudberry',
            'Coconut',
            'Coffee',
            'Date',
            'Fig',
            'Gooseberry',
            'Grapefruit',
            'Guava',
            'Hazelnut',
            'Kiwi Fruit',
            'Kumquat',
            'Lemon',
            'Lime',
            'Litchi',
            'Macadamia Nut',
            'Mandarin',
            'Mango',
            'Mulberry',
            'Nectarine',
            'Olive',
            'Orange',
            'Papaya',
            'Peach',
            'Pear',
            'Prickly Pear',
            'Pecan Nut',
            'Persimmon',
            'Pistachio Nut',
            'Plum',
            'Pomegranate',
            'Protea',
            'Prune',
            'Raspberry',
            'Rooibos',
            'Roses',
            'Strawberry',
            'Walnut',
            'Wineberry'
        ];
        var _plantationCrops = [
            'Aloe',
            'Bluegum',
            'Hops',
            'Pine',
            'Pineapple',
            'Tea',
            'Sisal',
            'Sugarcane',
            'Sugarcane (Irrigated)',
            'Wattle'
        ];
        var _vegetableCrops = [
            'Chicory',
            'Chili',
            'Garlic',
            'Lentil',
            'Melon',
            'Olive',
            'Onion',
            'Pea',
            'Pumpkin',
            'Quince',
            'Strawberry',
            'Tomato',
            'Watermelon',
            'Carrot',
            'Beet',
            'Cauliflower',
            'Broccoli',
            'Leek',
            'Butternut',
            'Cabbage',
            'Rapeseed'
        ];
        var _vineyardCrops = [
            'Grape',
            'Grape (Bush Vine)',
            'Grape (Red)',
            'Grape (Table)',
            'Grape (White)'
        ];

        readOnlyProperty(Asset, 'cropsByLandClass', {
            'Cropland': _croplandCrops,
            'Cropland (Emerging)': _croplandCrops,
            'Cropland (Irrigated)': _croplandIrrigatedCrops,
            'Cropland (Smallholding)': _croplandCrops,
            'Forest': ['Pine'],
            'Grazing': _grazingCrops,
            'Grazing (Bush)': _grazingCrops,
            'Grazing (Fynbos)': _grazingCrops,
            'Grazing (Shrubland)': _grazingCrops,
            'Greenhouses': [],
            'Orchard': _perennialCrops,
            'Orchard (Shadenet)': _perennialCrops,
            'Pineapple': ['Pineapple'],
            'Plantation': _plantationCrops,
            'Plantation (Smallholding)': _plantationCrops,
            'Planted Pastures': _grazingCrops,
            'Sugarcane': ['Sugarcane'],
            'Sugarcane (Emerging)': ['Sugarcane'],
            'Sugarcane (Irrigated)': ['Sugarcane (Irrigated)'],
            'Tea': ['Tea'],
            'Vegetables': _vegetableCrops,
            'Vineyard': _vineyardCrops
        });

        readOnlyProperty(Asset, 'cropsByType', {
            'crop': _croplandAllCrops,
            'cropland': _croplandAllCrops,
            'livestock': _grazingCrops,
            'pasture': _grazingCrops,
            'permanent crop': underscore.union(_perennialCrops, _vineyardCrops),
            'plantation': _plantationCrops
        });

        readOnlyProperty(Asset, 'liquidityTypes', {
            'long-term': 'Long-term',
            'medium-term': 'Movable',
            'short-term': 'Current'
        });

        readOnlyProperty(Asset, 'liquidityCategories', {
            'long-term': ['Fixed Improvements', 'Investments', 'Land', 'Other'],
            'medium-term': ['Breeding Stock', 'Vehicles, Machinery & Equipment', 'Other'],
            'short-term': ['Crops & Crop Products', 'Cash on Hand', 'Debtors', 'Short-term Investments', 'Prepaid Expenses', 'Production Inputs', 'Life Insurance', 'Livestock Products', 'Marketable Livestock', 'Negotiable Securities', 'Other']
        });

        readOnlyProperty(Asset, 'conditions', ['Good', 'Good to fair', 'Fair', 'Fair to poor', 'Poor']);

        readOnlyProperty(Asset, 'seasons', ['Cape', 'Summer', 'Fruit', 'Winter']);

        privateProperty(Asset, 'getCropsByLandClass', function (landClass) {
            return Asset.cropsByLandClass[landClass] || [];
        });

        privateProperty(Asset, 'getDefaultCrop', function (landClass) {
            return (underscore.size(Asset.cropsByLandClass[landClass]) === 1 ? underscore.first(Asset.cropsByLandClass[landClass]) : undefined);
        });

        privateProperty(Asset, 'getCustomTitle', function (asset, props, options) {
            return getCustomTitle(asset, props, options);
        });

        privateProperty(Asset, 'getTitle', function (asset, withField, farm) {
            return getTitle(asset, withField, farm);
        });

        privateProperty(Asset, 'listServiceMap', function (asset, metadata) {
            return listServiceMap(asset, metadata);
        });

        function getDefaultProps (instance) {
            switch (instance.type) {
                case 'crop':
                case 'permanent crop':
                case 'plantation':
                    return ['plantedArea', 'crop', 'fieldName', 'farmName'];
                case 'farmland':
                    return [['label', 'portionLabel', 'portionNumber']];
                case 'cropland':
                    return ['typeTitle', function (instance) {
                        return (instance.data.irrigation ?
                            instance.data.irrigation + ' irrigated' :
                            (instance.data.irrigated ?
                                'Irrigated (' + (instance.data.equipped ? 'equipped' : 'unequipped') + ')':
                                'Non irrigable'))
                    }, 'waterSource', 'fieldName', 'farmName'];
                case 'livestock':
                    return ['type', 'category'];
                case 'pasture':
                    return [function (instance) {
                        return (instance.data.intensified ?
                            (instance.data.crop ? instance.data.crop + ' intensified ' : 'Intensified ') + instance.type :
                            'Natural Grazing');
                    }, 'fieldName', 'farmName'];
                case 'vme':
                    return ['category', 'model'];
                case 'wasteland':
                    return ['typeTitle'];
                case 'water source':
                case 'water right':
                    return ['waterSource', 'fieldName', 'farmName'];
                default:
                    return [['name', 'category', 'typeTitle']];
            }
        }

        function getProps (instance, props, options) {
            return underscore.chain(props)
                .map(function (prop) {
                    if (underscore.isArray(prop)) {
                        return underscore.first(getProps(instance, prop, options));
                    } else if (underscore.isFunction(prop)) {
                        return prop(instance, options);
                    } else {
                        switch (prop) {
                            case 'age':
                                return instance.data.establishedDate && s.replaceAll(moment(options.asOfDate).from(instance.data.establishedDate, true), 'a ', '1 ');
                            case 'defaultTitle':
                                return getProps(instance, getDefaultProps(instance), options);
                            case 'farmName':
                                return options.withFarm && options.field && options.field[prop];
                            case 'fieldName':
                                return options.withField && instance.data[prop];
                            case 'croppingPotential':
                                return options.field && options.field[prop] && options.field[prop] + ' Potential';
                            case 'landUse':
                                return options.field && options.field[prop];
                            case 'area':
                            case 'plantedArea':
                            case 'size':
                                return instance.data[prop] && safeMath.round(instance.data[prop], 2) + 'ha';
                            case 'portionNumber':
                                return (instance.data.portionNumber ? 'Ptn. ' + instance.data.portionNumber : 'Rem. extent of farm');
                            case 'typeTitle':
                                return Asset.assetTypes[instance.type];
                            default:
                                return instance.data[prop];
                        }
                    }
                })
                .compact()
                .uniq()
                .value();
        }

        function getCustomTitle (instance, props, options) {
            options = underscore.defaults(options || {}, {
                separator: ', '
            });

            return underscore.flatten(getProps(instance, props || getDefaultProps(instance), options)).join(options.separator);
        }
        
        function getTitle (instance, withField, farm) {
            return getCustomTitle(instance, getDefaultProps(instance), {
                farm: farm,
                withFarm: !underscore.isUndefined(farm),
                field: farm && underscore.findWhere(farm.data.fields, {fieldName: instance.data.fieldName}),
                withField: withField
            });
        }
        
        function listServiceMap (instance, metadata) {
            var map = {
                id: instance.id || instance.$id,
                type: instance.type,
                updatedAt: instance.updatedAt
            };

            if (instance.data) {
                map.title = getTitle(instance, true);
                map.groupby = instance.farmId;
                map.thumbnailUrl = attachmentHelper.findSize(instance, 'thumb', 'img/camera.png');

                switch (instance.type) {
                    case 'crop':
                        map.subtitle = (instance.data.season ? instance.data.season : '');
                        map.size = instance.data.size;
                        break;
                    case 'cropland':
                    case 'pasture':
                    case 'wasteland':
                    case 'water right':
                        map.subtitle = (instance.data.size !== undefined ? 'Area: ' + safeMath.round(instance.data.size, 2) + 'ha' : 'Unknown area');
                        map.size = instance.data.size;
                        break;
                    case 'farmland':
                        map.subtitle = (instance.data.area !== undefined ? 'Area: ' + safeMath.round(instance.data.area, 2) + 'ha' : 'Unknown area');
                        map.size = instance.data.area;
                        break;
                    case 'permanent crop':
                    case 'plantation':
                        map.subtitle = (instance.data.establishedDate ? 'Established: ' + moment(instance.data.establishedDate).format('DD-MM-YYYY') : '');
                        map.size = instance.data.size;
                        break;
                    case 'improvement':
                        map.subtitle = instance.data.type + (instance.data.category ? ' - ' + instance.data.category : '') + (instance.data.size !== undefined ? ' (' + safeMath.round(instance.data.size, 2) + 'm²)' : '');
                        map.summary = (instance.data.description || '');
                        break;
                    case 'livestock':
                        map.subtitle = (instance.data.breed ? instance.data.breed + ' for ' : 'For ') + instance.data.purpose;
                        map.summary = (instance.data.description || '');
                        map.groupby = instance.data.type;
                        break;
                    case 'vme':
                        map.subtitle = 'Quantity: ' + instance.data.quantity;
                        map.summary = (instance.data.description || '');
                        map.groupby = instance.data.type;
                        break;
                }
            }

            if (metadata) {
                map = underscore.extend(map, metadata);
            }

            return map;
        }

        function generateUniqueName (instance, categoryLabel, assets) {
            categoryLabel = categoryLabel || '';

            var assetCount = underscore.chain(assets)
                .where({type: instance.type})
                .reduce(function(assetCount, asset) {
                    if (asset.data.name) {
                        var index = asset.data.name.search(/\s+[0-9]+$/),
                            name = asset.data.name,
                            number;

                        if (index !== -1) {
                            name = name.substr(0, index);
                            number = parseInt(asset.data.name.substring(index).trim());
                        }

                        if (categoryLabel && name === categoryLabel && (!number || number > assetCount)) {
                            assetCount = number || 1;
                        }
                    }

                    return assetCount;
                }, -1)
                .value();

            return categoryLabel + (assetCount + 1 ? ' ' + (assetCount + 1) : '');
        }

        function isFieldApplicable (instance, field) {
            return underscore.contains(Asset.landClassesByType[instance.type], Field.new(field).landUse);
        }

        Asset.validates({
            crop: {
                requiredIf: function (value, instance) {
                    return underscore.contains(['crop', 'permanent crop', 'plantation'], instance.type);
                },
                inclusion: {
                    in: function (value, instance) {
                        return Asset.cropsByType[instance.type];
                    }
                }
            },
            establishedDate: {
                requiredIf: function (value, instance) {
                    return underscore.contains(['permanent crop', 'plantation'], instance.type);
                },
                format: {
                    date: true
                }
            },
            farmId: {
                requiredIf: function (value, instance) {
                    return underscore.contains(['crop', 'farmland', 'cropland', 'improvement', 'pasture', 'permanent crop', 'plantation', 'wasteland', 'water right'], instance.type);
                },
                numeric: true
            },
            fieldName: {
                requiredIf: function (value, instance) {
                    return underscore.contains(['crop', 'cropland', 'pasture', 'permanent crop', 'plantation'], instance.type);
                },
                length: {
                    min: 1,
                    max: 255
                }
            },
            legalEntityId: {
                required: true,
                numeric: true
            },
            assetKey: {
                required: true
            },
            size: {
                requiredIf: function (value, instance) {
                    return underscore.contains(['crop', 'cropland', 'pasture', 'permanent crop', 'plantation', 'wasteland', 'water right'], instance.type);
                },
                numeric: true
            },
            type: {
                required: true,
                inclusion: {
                    in: underscore.keys(Asset.assetTypesWithOther)
                }
            }
        });

        return Asset;
    }]);

var sdkModelLivestock = angular.module('ag.sdk.model.livestock', ['ag.sdk.model.asset', 'ag.sdk.model.stock']);

sdkModelLivestock.factory('Livestock', ['computedProperty', 'inheritModel', 'privateProperty', 'readOnlyProperty', 'Stock', 'underscore',
    function (computedProperty, inheritModel, privateProperty, readOnlyProperty, Stock, underscore) {
        function Livestock (attrs) {
            Stock.apply(this, arguments);

            readOnlyProperty(this, 'actions', {
                'credit': [
                    'Birth',
                    'Retained',
                    'Purchase'],
                'debit': [
                    'Death',
                    'Household',
                    'Labour',
                    'Retain',
                    'Sale']
            });

            computedProperty(this, 'actionTitles', function () {
                return getActionTitles(this);
            });

            privateProperty(this, 'getActionTitle', function (action) {
                var splitAction = action.split(':', 2);

                if (splitAction.length === 2) {
                    switch (splitAction[0]) {
                        case 'Retain':
                            return (this.birthAnimal === this.data.category ? 'Wean Livestock' : 'Retain ' + splitAction[1]);
                        case 'Retained':
                            return (this.weanedAnimal === this.data.category ? 'Weaned Livestock' : 'Retained ' + splitAction[1]);
                        default:
                            return splitAction[0];
                    }
                }

                return this.actionTitles[action];
            });

            computedProperty(this, 'baseAnimal', function () {
                return baseAnimals[this.data.type] || this.data.type;
            });

            computedProperty(this, 'birthAnimal', function () {
                return getBirthingAnimal(this.data.type);
            });

            computedProperty(this, 'weanedAnimal', function () {
                return getWeanedAnimal(this.data.type);
            });

            privateProperty(this, 'conversionRate', function () {
                return conversionRate[this.baseAnimal] && (conversionRate[this.baseAnimal][this.data.category] || conversionRate[this.baseAnimal][representativeAnimals[this.baseAnimal]]);
            });

            computedProperty(this, 'representativeAnimal', function () {
                return representativeAnimals[this.baseAnimal];
            });

            this.type = 'livestock';
        }

        inheritModel(Livestock, Stock);

        function getActionTitles (instance) {
            return underscore.chain(actionTitles)
                .pairs()
                .union(underscore.map(animalGrowthStages[instance.baseAnimal][instance.data.category], function (category) {
                    return ['Retain:' + category, (instance.birthAnimal === instance.data.category ? 'Wean Livestock' : 'Retain ' + category)];
                }))
                .sortBy(function (pair) {
                    return pair[0];
                })
                .object()
                .omit(instance.birthAnimal === instance.data.category ? [] : ['Birth', 'Death'])
                .value();
        }

        var actionTitles = {
            'Birth': 'Register Births',
            'Death': 'Register Deaths',
            'Purchase': 'Purchase Livestock',
            'Household': 'Household Consumption',
            'Labour': 'Labour Consumption',
            'Sale': 'Sell Livestock'
        };

        var baseAnimals = {
            'Cattle (Extensive)': 'Cattle',
            'Cattle (Feedlot)': 'Cattle',
            'Cattle (Stud)': 'Cattle',
            'Sheep (Extensive)': 'Sheep',
            'Sheep (Feedlot)': 'Sheep',
            'Sheep (Stud)': 'Sheep'
        };

        var birthAnimals = {
            Cattle: 'Calf',
            Game: 'Calf',
            Goats: 'Kid',
            Rabbits: 'Kit',
            Sheep: 'Lamb'
        };

        var representativeAnimals = {
            Cattle: 'Cow',
            Game: 'Cow',
            Goats: 'Ewe',
            Rabbits: 'Doe',
            Sheep: 'Ewe'
        };

        var animalGrowthStages = {
            Cattle: {
                'Calf': ['Weaner Calf'],
                'Weaner Calf': ['Bull', 'Heifer', 'Steer'],
                'Heifer': ['Cow'],
                'Cow': [],
                'Steer': ['Ox'],
                'Ox': [],
                'Bull': []
            },
            Game: {
                'Calf': ['Weaner Calf'],
                'Weaner Calf': ['Heifer', 'Steer', 'Bull'],
                'Heifer': ['Cow'],
                'Cow': [],
                'Steer': ['Ox'],
                'Ox': [],
                'Bull': []
            },
            Goats: {
                'Kid': ['Weaner Kid'],
                'Weaner Kid': ['Ewe', 'Castrate', 'Ram'],
                'Ewe': [],
                'Castrate': [],
                'Ram': []
            },
            Rabbits: {
                'Kit': ['Weaner Kit'],
                'Weaner Kit': ['Doe', 'Lapin', 'Buck'],
                'Doe': [],
                'Lapin': [],
                'Buck': []
            },
            Sheep: {
                'Lamb': ['Weaner Lamb'],
                'Weaner Lamb': ['Ewe', 'Wether', 'Ram'],
                'Ewe': [],
                'Wether': [],
                'Ram': []
            }
        };

        var conversionRate = {
            Cattle: {
                'Calf': 0.32,
                'Weaner Calf': 0.44,
                'Cow': 1.1,
                'Heifer': 1.1,
                'Steer': 0.75,
                'Ox': 1.1,
                'Bull': 1.36
            },
            Game: {
                'Calf': 0.32,
                'Weaner Calf': 0.44,
                'Cow': 1.1,
                'Heifer': 1.1,
                'Steer': 0.75,
                'Ox': 1.1,
                'Bull': 1.36
            },
            Goats: {
                'Kid': 0.08,
                'Weaner Kid': 0.12,
                'Ewe': 0.17,
                'Castrate': 0.17,
                'Ram': 0.22
            },
            Rabbits: {
                'Kit': 0.08,
                'Weaner Kit': 0.12,
                'Doe': 0.17,
                'Lapin': 0.17,
                'Buck': 0.22
            },
            Sheep: {
                'Lamb': 0.08,
                'Weaner Lamb': 0.11,
                'Ewe': 0.16,
                'Wether': 0.16,
                'Ram': 0.23
            }
        };

        privateProperty(Livestock, 'getBaseAnimal', function (type) {
            return baseAnimals[type] || type;
        });

        function getBirthingAnimal (type) {
            var baseAnimal = baseAnimals[type] || type;

            return baseAnimal && birthAnimals[baseAnimal];
        }

        privateProperty(Livestock, 'getBirthingAnimal', function (type) {
            return getBirthingAnimal(type);
        });

        function getWeanedAnimal (type) {
            var baseAnimal = baseAnimals[type] || type,
                birthAnimal = birthAnimals[baseAnimal];

            return birthAnimal && animalGrowthStages[baseAnimal] && underscore.first(animalGrowthStages[baseAnimal][birthAnimal]);
        }

        privateProperty(Livestock, 'getWeanedAnimal', function (type) {
            return getWeanedAnimal(type);
        });

        privateProperty(Livestock, 'getAnimalGrowthStages', function (type) {
            var baseAnimal = baseAnimals[type] || type;

            return baseAnimal && animalGrowthStages[baseAnimal] || [];
        });

        privateProperty(Livestock, 'getConversionRate', function (type, category) {
            var baseAnimal = baseAnimals[type] || type;

            return baseAnimal && conversionRate[baseAnimal] && (conversionRate[baseAnimal][category] || conversionRate[baseAnimal][representativeAnimals[baseAnimal]]);
        });

        privateProperty(Livestock, 'getConversionRates', function (type) {
            var baseAnimal = baseAnimals[type] || type;

            return baseAnimal && conversionRate[baseAnimal] || {};
        });

        privateProperty(Livestock, 'getRepresentativeAnimal', function (type) {
            var baseAnimal = baseAnimals[type] || type;

            return baseAnimal && representativeAnimals[baseAnimal];
        });

        Livestock.validates({
            assetKey: {
                required: true
            },
            data: {
                required: true,
                object: true
            },
            legalEntityId: {
                required: true,
                numeric: true
            },
            type: {
                required: true,
                equal: {
                    to: 'livestock'
                }
            }
        });

        return Livestock;
    }]);

var sdkModelStock = angular.module('ag.sdk.model.stock', ['ag.sdk.model.asset']);

sdkModelStock.factory('Stock', ['AssetBase', 'Base', 'computedProperty', 'inheritModel', 'moment', 'naturalSort', 'privateProperty', 'readOnlyProperty', 'safeMath', 'underscore',
    function (AssetBase, Base, computedProperty, inheritModel, moment, naturalSort, privateProperty, readOnlyProperty, safeMath, underscore) {
        function Stock (attrs) {
            AssetBase.apply(this, arguments);

            computedProperty(this, 'startMonth', function () {
                return (underscore.isEmpty(this.data.ledger) ? undefined : moment(underscore.chain(this.data.ledger)
                    .pluck('date')
                    .first()
                    .value(), 'YYYY-MM-DD').date(1));
            });

            computedProperty(this, 'endMonth', function () {
                return (underscore.isEmpty(this.data.ledger) ? undefined : moment(underscore.chain(this.data.ledger)
                    .pluck('date')
                    .last()
                    .value(), 'YYYY-MM-DD').date(1));
            });

            // Actions
            readOnlyProperty(this, 'actions', {
                'credit': [
                    'Production',
                    'Purchase'],
                'debit': [
                    'Consumption',
                    'Internal',
                    'Household',
                    'Labour',
                    'Repay',
                    'Sale']
            }, {configurable: true});

            readOnlyProperty(this, 'actionTitles', {
                'Consumption': 'Consume',
                'Household': 'Household Consumption',
                'Internal': 'Internal Consumption',
                'Labour': 'Labour Consumption',
                'Production': 'Produce',
                'Purchase': 'Buy Stock',
                'Repay': 'Repay Credit',
                'Sale': 'Sell Stock'
            }, {configurable: true});

            privateProperty(this, 'getActionTitle', function (action) {
                return this.actionTitles[action];
            }, {configurable: true});

            // Ledger
            function addLedgerEntry (instance, item) {
                if (instance.isLedgerEntryValid(item)) {
                    instance.data.ledger = underscore.chain(instance.data.ledger)
                        .union([underscore.extend(item, {
                            date: moment(item.date).format('YYYY-MM-DD')
                        })])
                        .sortBy(function (item) {
                            return moment(item.date).valueOf() + getActionGroup(instance, item.action);
                        })
                        .value();

                    recalculateAndCache(instance, {checkEntries: true});
                }
            }

            privateProperty(this, 'addLedgerEntry', function (item) {
                return addLedgerEntry(this, item);
            });

            function getActionGroup (instance, action) {
                return underscore.chain(instance.actions)
                    .keys()
                    .filter(function (group) {
                        return underscore.contains(instance.actions[group], asPureAction(action));
                    })
                    .first()
                    .value();
            }

            privateProperty(this, 'getActionGroup', function (action) {
                return getActionGroup(this, action);
            });

            privateProperty(this, 'findLedgerEntry', function (query) {
                if (underscore.isObject(query)) {
                    var entry = underscore.findWhere(this.data.ledger, query);

                    return entry || underscore.findWhere(this.data.ledger, {
                        reference: underscore.compact([query.reference, query.action, query.date]).join('/')
                    });
                }

                return underscore.findWhere(this.data.ledger, {reference: query});
            });

            privateProperty(this, 'hasLedgerEntries', function () {
                return this.data.ledger.length > 0;
            });

            privateProperty(this, 'hasQuantityBefore', function (before) {
                var beforeDate = moment(before, 'YYYY-MM-DD');

                return !underscore.isUndefined(underscore.chain(this.data.ledger)
                    .filter(function (entry) {
                        return moment(entry.date).isSameOrBefore(beforeDate);
                    })
                    .pluck('quantity')
                    .last()
                    .value());
            });

            privateProperty(this, 'removeLedgerEntry', function (ledgerEntry, markDeleted) {
                if (ledgerEntry) {
                    if (markDeleted) {
                        ledgerEntry.deleted = true;
                    } else {
                        this.data.ledger = underscore.reject(this.data.ledger, function (entry) {
                            return entry.date === ledgerEntry.date && entry.action === ledgerEntry.action && entry.quantity === ledgerEntry.quantity;
                        });
                    }

                    recalculateAndCache(this);
                }
            });

            privateProperty(this, 'generateLedgerEntryReference', function (entry) {
                return '/' + underscore.compact([entry.action, entry.date]).join('/');
            });

            privateProperty(this, 'removeLedgerEntriesByReference', function (reference) {
                this.data.ledger = underscore.reject(this.data.ledger, function (entry) {
                    return s.include(entry.reference, reference);
                });

                recalculateAndCache(this);
            });

            privateProperty(this, 'inventoryInRange', function (rangeStart, rangeEnd) {
                return inventoryInRange(this, rangeStart, rangeEnd);
            });

            privateProperty(this, 'inventoryBefore', function (before) {
                var beforeDate = moment(before, 'YYYY-MM-DD');

                if (this.startMonth && beforeDate.isSameOrAfter(this.startMonth)) {
                    var numberOfMonths = beforeDate.diff(this.startMonth, 'months');

                    if (underscore.isEmpty(_monthly)) {
                        recalculateAndCache(this);
                    }

                    return _monthly[numberOfMonths] || underscore.last(_monthly);
                }

                return openingMonth(this);
            });

            privateProperty(this, 'subtotalInRange', function (actions, rangeStart, rangeEnd) {
                var rangeStartDate = moment(rangeStart, 'YYYY-MM-DD'),
                    rangeEndDate = moment(rangeEnd, 'YYYY-MM-DD');

                actions = (underscore.isArray(actions) ? actions : [actions]);

                return underscore.chain(this.data.ledger)
                    .reject(function (entry) {
                        var entryDate = moment(entry.date);

                        return entry.deleted || !underscore.contains(actions, entry.action) || entryDate.isBefore(rangeStartDate) || entryDate.isSameOrAfter(rangeEndDate);
                    })
                    .reduce(function (result, entry) {
                        result.quantity = safeMath.plus(result.quantity, entry.quantity);
                        result.value = safeMath.plus(result.value, entry.value);
                        result.price = safeMath.dividedBy(result.value, result.quantity);
                        return result;
                    }, {})
                    .value();
            });

            privateProperty(this, 'marketPriceAtDate', function (before) {
                var beforeDate = moment(before, 'YYYY-MM-DD'),
                    actions = ['Purchase', 'Sale'];

                return underscore.chain(this.data.ledger)
                    .filter(function (entry) {
                        return !entry.deleted && underscore.contains(actions, entry.action) && moment(entry.date).isSameOrBefore(beforeDate);
                    })
                    .map(function (entry) {
                        return safeMath.dividedBy(entry.value, entry.quantity);
                    })
                    .last()
                    .value() || this.data.pricePerUnit;
            });

            privateProperty(this, 'isLedgerEntryValid', function (item) {
                return isLedgerEntryValid(this, item);
            });

            privateProperty(this, 'clearLedger', function () {
                this.data.ledger = [];

                recalculateAndCache(this);
            });

            privateProperty(this, 'recalculateLedger' ,function () {
                recalculateAndCache(this);
            });

            var _monthly = [];

            function balanceEntry (curr, prev) {
                curr.opening = prev.closing;
                curr.balance = underscore.mapObject(curr.opening, function (value, key) {
                    return safeMath.chain(value)
                        .plus(underscore.reduce(curr.credit, function (total, item) {
                            return safeMath.plus(total, item[key]);
                        }, 0))
                        .minus(underscore.reduce(curr.debit, function (total, item) {
                            return safeMath.plus(total, item[key]);
                        }, 0))
                        .toNumber();
                });
                curr.closing = curr.balance;
            }

            function inventoryInRange(instance, rangeStart, rangeEnd) {
                var rangeStartDate = moment(rangeStart, 'YYYY-MM-DD').date(1),
                    rangeEndDate = moment(rangeEnd, 'YYYY-MM-DD').date(1),
                    numberOfMonths = rangeEndDate.diff(rangeStartDate, 'months'),
                    appliedStart = (instance.startMonth ? instance.startMonth.diff(rangeStartDate, 'months') : numberOfMonths),
                    appliedEnd = (instance.endMonth ? rangeEndDate.diff(instance.endMonth, 'months') : 0),
                    startCrop = Math.abs(Math.min(0, appliedStart));

                if (underscore.isEmpty(_monthly) && !underscore.isEmpty(instance.data.ledger)) {
                    recalculateAndCache(instance);
                }

                return underscore.reduce(defaultMonths(Math.max(0, appliedStart))
                        .concat(_monthly)
                        .concat(defaultMonths(Math.max(0, appliedEnd))),
                    function (monthly, curr) {
                        balanceEntry(curr, underscore.last(monthly) || openingMonth(instance));
                        monthly.push(curr);
                        return monthly;
                    }, [])
                    .slice(startCrop, startCrop + numberOfMonths);
            }

            function recalculate (instance, options) {
                var startMonth = instance.startMonth,
                    endMonth = instance.endMonth,
                    numberOfMonths = (endMonth ? endMonth.diff(startMonth, 'months') : -1);

                options = underscore.defaults(options || {}, {
                    checkEntries: false
                });

                return underscore.range(numberOfMonths + 1).reduce(function (monthly, offset) {
                    var offsetDate = moment(startMonth).add(offset, 'M');

                    var curr = underscore.extend(defaultMonth(), underscore.reduce(instance.data.ledger, function (month, entry) {
                        var itemDate = moment(entry.date),
                            pureAction = asPureAction(entry.action);

                        if (!entry.deleted && offsetDate.year() === itemDate.year() && offsetDate.month() === itemDate.month()) {
                            underscore.each(['credit', 'debit'], function (key) {
                                if (underscore.contains(instance.actions[key], pureAction)) {
                                    if (options.checkEntries) {
                                        recalculateEntry(instance, entry);
                                    }

                                    month.entries.push(entry);
                                    month[key][pureAction] = underscore.mapObject(month[key][pureAction] || defaultItem(), function (value, key) {
                                        return safeMath.plus(value, entry[key]);
                                    });
                                }
                            });
                        }

                        return month;
                    }, {
                        credit: {},
                        debit: {},
                        entries: []
                    }));

                    balanceEntry(curr, underscore.last(monthly) || openingMonth(instance));
                    monthly.push(curr);
                    return monthly;
                }, []);
            }

            function recalculateEntry (instance, entry) {
                if (underscore.isUndefined(entry.price) && !underscore.isUndefined(entry.quantity) && !underscore.isUndefined(instance.data.pricePerUnit)) {
                    entry.price = instance.data.pricePerUnit;
                    entry.value = safeMath.times((entry.rate || 1), safeMath.times(entry.price, entry.quantity));
                }
            }

            function recalculateAndCache (instance, options) {
                _monthly = recalculate(instance, options);
            }

            Base.initializeObject(this.data, 'ledger', []);
            Base.initializeObject(this.data, 'openingBalance', 0);


            this.type = 'stock';
        }

        function asPureAction (action) {
            return s.strLeft(action, ':');
        }

        function defaultItem (quantity, value) {
            return {
                quantity: quantity || 0,
                value: value || 0
            }
        }

        function defaultMonth (quantity, value) {
            return {
                opening: defaultItem(quantity, value),
                credit: {},
                debit: {},
                entries: [],
                balance: defaultItem(quantity, value),
                interest: 0,
                closing: defaultItem(quantity, value)
            }
        }

        function defaultMonths (size) {
            return underscore.range(size).map(defaultMonth);
        }

        function openingMonth (instance) {
            var quantity = instance.data.openingBalance,
                value = safeMath.times(instance.data.openingBalance, instance.data.pricePerUnit);

            return defaultMonth(quantity, value);
        }

        function isLedgerEntryValid (instance, item) {
            var pureAction = asPureAction(item.action);
            return item && item.date && moment(item.date).isValid() && /*underscore.isNumber(item.quantity) && */underscore.isNumber(item.value) &&
                (underscore.contains(instance.actions.credit, pureAction) || underscore.contains(instance.actions.debit, pureAction));
        }

        inheritModel(Stock, AssetBase);

        Stock.validates({
            assetKey: {
                required: true
            },
            data: {
                required: true,
                object: true
            },
            legalEntityId: {
                required: true,
                numeric: true
            },
            type: {
                required: true,
                inclusion: {
                    in: underscore.keys(AssetBase.assetTypesWithOther)
                }
            }
        });

        return Stock;
    }]);

var sdkModelBusinessPlanDocument = angular.module('ag.sdk.model.business-plan', ['ag.sdk.id', 'ag.sdk.helper.enterprise-budget', 'ag.sdk.model.asset', 'ag.sdk.model.document', 'ag.sdk.model.liability', 'ag.sdk.model.production-schedule', 'ag.sdk.model.stock']);

sdkModelBusinessPlanDocument.factory('BusinessPlan', ['AssetFactory', 'Base', 'computedProperty', 'Document', 'EnterpriseBudget', 'Financial', 'FinancialGroup', 'generateUUID', 'inheritModel', 'Liability', 'Livestock', 'privateProperty', 'ProductionSchedule', 'readOnlyProperty', 'safeArrayMath', 'safeMath', 'Stock', 'underscore',
    function (AssetFactory, Base, computedProperty, Document, EnterpriseBudget, Financial, FinancialGroup, generateUUID, inheritModel, Liability, Livestock, privateProperty, ProductionSchedule, readOnlyProperty, safeArrayMath, safeMath, Stock, underscore) {
        var _version = 16;

        function BusinessPlan (attrs) {
            Document.apply(this, arguments);

            this.docType = 'financial resource plan';

            this.data.startDate = moment(this.data.startDate).format('YYYY-MM-DD');
            this.data.endDate = moment(this.data.startDate).add(2, 'y').format('YYYY-MM-DD');

            Base.initializeObject(this.data, 'account', {});
            Base.initializeObject(this.data, 'models', {});
            Base.initializeObject(this.data, 'adjustmentFactors', {});
            Base.initializeObject(this.data, 'assetStatement', {});
            Base.initializeObject(this.data, 'liabilityStatement', {});

            Base.initializeObject(this.data.assetStatement, 'total', {});
            Base.initializeObject(this.data.liabilityStatement, 'total', {});

            Base.initializeObject(this.data.account, 'monthly', []);
            Base.initializeObject(this.data.account, 'yearly', []);
            Base.initializeObject(this.data.account, 'openingBalance', 0);
            Base.initializeObject(this.data.account, 'interestRateCredit', 0);
            Base.initializeObject(this.data.account, 'interestRateDebit', 0);
            Base.initializeObject(this.data.account, 'depreciationRate', 0);

            Base.initializeObject(this.data.models, 'assets', []);
            Base.initializeObject(this.data.models, 'budgets', []);
            Base.initializeObject(this.data.models, 'expenses', []);
            Base.initializeObject(this.data.models, 'financials', []);
            Base.initializeObject(this.data.models, 'income', []);
            Base.initializeObject(this.data.models, 'liabilities', []);
            Base.initializeObject(this.data.models, 'productionSchedules', []);

            function reEvaluateBusinessPlan (instance) {
                recalculate(instance);
                recalculateRatios(instance);
            }

            /**
             * Helper functions
             */
            function asJson (object, omit) {
                return underscore.omit(object && typeof object.asJSON === 'function' ? object.asJSON() : object, omit || []);
            }

            /**
             * Production Schedule handling
             */
            privateProperty(this, 'updateProductionSchedules', function (schedules, options) {
                updateProductionSchedules(this, schedules, options);
            });

            function updateProductionSchedules (instance, schedules, options) {
                var startMonth = moment(instance.startDate, 'YYYY-MM-DD'),
                    endMonth = moment(instance.endDate, 'YYYY-MM-DD'),
                    oldSchedules = underscore.map(instance.models.productionSchedules, ProductionSchedule.newCopy);

                options = underscore.defaults(options || {}, {
                    extractStockAssets: true
                });

                instance.models.productionSchedules = [];

                underscore.chain(schedules)
                    .map(function (schedule) {
                        return (schedule instanceof ProductionSchedule ? schedule : ProductionSchedule.newCopy(schedule));
                    })
                    .sortBy(function (schedule) {
                        return moment(schedule.startDate).valueOf();
                    })
                    .each(function (schedule) {
                        // Add valid production schedule if between business plan dates
                        if (schedule.validate() && (startMonth.isBetween(schedule.startDate, schedule.endDate) || (startMonth.isBefore(schedule.endDate) && endMonth.isAfter(schedule.startDate)))) {
                            if (options.extractStockAssets) {
                                extractProductionScheduleStockAssets(instance, schedule);
                            }

                            instance.models.productionSchedules.push(asJson(schedule, ['asset']));

                            oldSchedules = underscore.reject(oldSchedules, function (oldSchedule) {
                                return oldSchedule.scheduleKey === schedule.scheduleKey;
                            });
                        }
                    });

                if (oldSchedules.length > 0) {
                    var stockAssets = underscore.chain(instance.models.assets)
                        .filter(function (asset) {
                            return underscore.contains(['livestock', 'stock'], asset.type);
                        })
                        .map(AssetFactory.newCopy)
                        .value();

                    underscore.each(oldSchedules, function (oldSchedule) {
                        underscore.each(stockAssets, function (stock) {
                            stock.removeLedgerEntriesByReference(oldSchedule.scheduleKey);

                            addStockAsset(instance, stock);
                        });
                    });
                }

                updateBudgets(instance);
                reEvaluateBusinessPlan(instance);
            }

            function initializeCategoryValues (instance, section, category, length) {
                instance.data[section] = instance.data[section] || {};
                instance.data[section][category] = instance.data[section][category] || Base.initializeArray(length);
            }

            function getLowerIndexBound (scheduleArray, offset) {
                return (scheduleArray ? Math.min(scheduleArray.length, Math.abs(Math.min(0, offset))) : 0);
            }

            function getUpperIndexBound (scheduleArray, offset, numberOfMonths) {
                return (scheduleArray ? Math.min(numberOfMonths, offset + scheduleArray.length) - offset : 0);
            }

            function extractProductionScheduleCategoryValuePerMonth(dataStore, schedule, code, startMonth, numberOfMonths, forceCategory) {
                var section = underscore.findWhere(schedule.data.sections, {code: code}),
                    scheduleStart = moment(schedule.startDate, 'YYYY-MM-DD'),
                    enterprise = schedule.data.details.commodity;

                if (section) {
                    var offset = scheduleStart.diff(startMonth, 'months');

                    angular.forEach(section.productCategoryGroups, function (group) {
                        var dataCategory = 'enterpriseProduction' + (code === 'INC' ? 'Income' : 'Expenditure');

                        angular.forEach(group.productCategories, function (category) {
                            // Ignore stockable categories
                            if (!underscore.contains(EnterpriseBudget.stockableCategoryCodes, category.code)) {
                                var categoryName = (!forceCategory && (schedule.type !== 'livestock' && code === 'INC') ? schedule.data.details.commodity : category.name),
                                    index = getLowerIndexBound(category.valuePerMonth, offset),
                                    maxIndex = getUpperIndexBound(category.valuePerMonth, offset, numberOfMonths);

                                Base.initializeObject(dataStore[dataCategory], enterprise, {});
                                dataStore[dataCategory][enterprise][categoryName] = dataStore[dataCategory][enterprise][categoryName] || Base.initializeArray(numberOfMonths);

                                for (; index < maxIndex; index++) {
                                    dataStore[dataCategory][enterprise][categoryName][index + offset] = safeMath.plus(dataStore[dataCategory][enterprise][categoryName][index + offset], category.valuePerMonth[index]);
                                }
                            }
                        });
                    });
                }
            }

            function findStockAsset (instance, type, stockType, category) {
                return underscore.find(instance.models.assets, function (asset) {
                    return asset.type === type && asset.data.category === category && (underscore.isUndefined(stockType) || asset.data.type === stockType);
                });
            }

            function getStockAsset (instance, type, stockType, category, priceUnit, quantityUnit) {
                var stock = AssetFactory.new(findStockAsset(instance, type, stockType, category) || {
                    type: type,
                    legalEntityId: underscore.chain(instance.data.legalEntities)
                        .where({isPrimary: true})
                        .pluck('id')
                        .first()
                        .value(),
                    data: underscore.extend({
                        category: category,
                        priceUnit: priceUnit,
                        quantityUnit: quantityUnit
                    }, (underscore.isUndefined(stockType) ? {} : {
                        type: stockType
                    }))
                });

                stock.generateKey(underscore.findWhere(instance.data.legalEntities, {id: stock.legalEntityId}));

                return stock;
            }

            function addStockAsset (instance, stock, force) {
                instance.models.assets = underscore.reject(instance.models.assets, function (asset) {
                    return asset.assetKey === stock.assetKey;
                });

                if (force || stock.hasLedgerEntries()) {
                    instance.models.assets.push(asJson(stock));
                }
            }

            function extractProductionScheduleStockAssets (instance, productionSchedule) {
                var startDate = moment(productionSchedule.startDate);

                underscore.each(productionSchedule.data.sections, function (section) {
                    underscore.each(section.productCategoryGroups, function (group) {
                        underscore.each(group.productCategories, function (category) {
                            if (underscore.contains(EnterpriseBudget.stockableCategoryCodes, category.code)) {
                                var assetType = (group.code === 'INC-LSS' ? 'livestock' : 'stock'),
                                    priceUnit = (category.unit === 'Total' ? undefined : category.unit),
                                    stockType = (section.code === 'INC' ? productionSchedule.commodityType : undefined),
                                    stock = getStockAsset(instance, assetType, stockType, category.name, priceUnit, category.supplyUnit);

                                if (assetType === 'livestock' && category.value) {
                                    Base.initializeObject(stock.data, 'pricePerUnit', safeMath.dividedBy(category.value, category.supply || 1));
                                }

                                productionSchedule.updateCategoryStock(section.code, category.code, stock);

                                addStockAsset(instance, stock, true);
                            }
                        });

                        if (group.code === 'INC-LSS') {
                            // Representative Animal
                            var representativeAnimal = productionSchedule.getRepresentativeAnimal(),
                                representativeCategory = underscore.findWhere(productionSchedule.getGroupCategoryOptions('INC', 'Livestock Sales'), {name: representativeAnimal});

                            // Birth/Weaned Animals
                            var birthAnimal = productionSchedule.birthAnimal,
                                birthCategory = underscore.findWhere(productionSchedule.getGroupCategoryOptions('INC', 'Livestock Sales'), {name: birthAnimal}),
                                weanedCategory = underscore.findWhere(productionSchedule.getGroupCategoryOptions('INC', 'Livestock Sales'), {name: Livestock.getWeanedAnimal(productionSchedule.commodityType)});

                            if (!underscore.isUndefined(representativeCategory) && !underscore.isUndefined(birthCategory) && !underscore.isUndefined(weanedCategory)) {
                                var representativeLivestock = getStockAsset(instance, 'livestock', productionSchedule.commodityType, representativeAnimal, representativeCategory.unit, representativeCategory.supplyUnit),
                                    birthLivestock = getStockAsset(instance, 'livestock', productionSchedule.commodityType, birthAnimal, birthCategory.unit, birthCategory.supplyUnit),
                                    weanedLivestock = getStockAsset(instance, 'livestock', productionSchedule.commodityType, weanedCategory.name, weanedCategory.unit, weanedCategory.supplyUnit);

                                var firstBirthLedgerEntry = underscore.first(birthLivestock.data.ledger),
                                    retainLivestockMap = {
                                        'Retain': birthLivestock,
                                        'Retained': weanedLivestock
                                    };

                                if (underscore.isUndefined(firstBirthLedgerEntry) || moment(productionSchedule.startDate).isSameOrBefore(firstBirthLedgerEntry.date)) {
                                    representativeLivestock.data.openingBalance = productionSchedule.data.details.herdSize;
                                }

                                productionSchedule.budget.addCategory('INC', 'Livestock Sales', representativeCategory.code, productionSchedule.costStage);
                                productionSchedule.budget.addCategory('INC', 'Livestock Sales', birthCategory.code, productionSchedule.costStage);
                                productionSchedule.budget.addCategory('INC', 'Livestock Sales', weanedCategory.code, productionSchedule.costStage);

                                underscore.each(underscore.keys(productionSchedule.budget.data.events).sort(), function (action) {
                                    var shiftedSchedule = productionSchedule.budget.shiftMonthlyArray(productionSchedule.budget.data.events[action]);

                                    underscore.each(shiftedSchedule, function (rate, index) {
                                        if (rate > 0) {
                                            var formattedDate = moment(startDate).add(index, 'M').format('YYYY-MM-DD'),
                                                representativeLivestockInventory = representativeLivestock.inventoryBefore(formattedDate),
                                                ledgerEntry = birthLivestock.findLedgerEntry({date: formattedDate, action: action, reference: productionSchedule.scheduleKey}),
                                                actionReference = [productionSchedule.scheduleKey, action, formattedDate].join('/'),
                                                quantity = Math.floor(safeMath.chain(rate)
                                                    .times(representativeLivestockInventory.closing.quantity)
                                                    .dividedBy(100)
                                                    .toNumber()),
                                                value = safeMath.times(quantity, birthLivestock.data.pricePerUnit);

                                            if (underscore.isUndefined(ledgerEntry)) {
                                                birthLivestock.addLedgerEntry({
                                                    action: action,
                                                    commodity: productionSchedule.commodityType,
                                                    date: formattedDate,
                                                    price: birthLivestock.data.pricePerUnit,
                                                    priceUnit: birthLivestock.data.quantityUnit,
                                                    quantity: quantity,
                                                    quantityUnit: birthLivestock.data.quantityUnit,
                                                    reference: actionReference,
                                                    value: value
                                                });
                                            } else {
                                                underscore.extend(ledgerEntry, {
                                                    commodity: productionSchedule.commodityType,
                                                    price: birthLivestock.data.pricePerUnit,
                                                    priceUnit: birthLivestock.data.quantityUnit,
                                                    quantity: quantity,
                                                    quantityUnit: birthLivestock.data.quantityUnit,
                                                    reference: actionReference,
                                                    value: value
                                                });

                                                birthLivestock.recalculateLedger();
                                            }

                                            if (action === 'Death') {
                                                var retainReference = [productionSchedule.scheduleKey, 'Retain:' + birthAnimal, formattedDate].join('/');

                                                // Removed already included retained entries, as it affects the inventory balance
                                                birthLivestock.removeLedgerEntriesByReference(retainReference);

                                                // Retains birth animal as weaned animal
                                                var inventory = birthLivestock.inventoryBefore(formattedDate);

                                                underscore.each(underscore.keys(retainLivestockMap), function (retainAction) {
                                                    var retainLivestock = retainLivestockMap[retainAction],
                                                        retainLedgerEntry = retainLivestock.findLedgerEntry(retainReference),
                                                        value = inventory.closing.value || safeMath.times(retainLivestock.data.pricePerUnit, inventory.closing.quantity);

                                                    if (underscore.isUndefined(retainLedgerEntry)) {
                                                        retainLivestock.addLedgerEntry({
                                                            action: retainAction + ':' + birthAnimal,
                                                            commodity: productionSchedule.commodityType,
                                                            date: formattedDate,
                                                            price: retainLivestock.data.pricePerUnit,
                                                            priceUnit: retainLivestock.data.quantityUnit,
                                                            quantity: inventory.closing.quantity,
                                                            quantityUnit: retainLivestock.data.quantityUnit,
                                                            reference: retainReference,
                                                            value: value
                                                        });
                                                    } else {
                                                        underscore.extend(retainLedgerEntry, {
                                                            commodity: productionSchedule.commodityType,
                                                            price: retainLivestock.data.pricePerUnit,
                                                            priceUnit: retainLivestock.data.quantityUnit,
                                                            quantity: inventory.closing.quantity,
                                                            quantityUnit: retainLivestock.data.quantityUnit,
                                                            reference: retainReference,
                                                            value: value
                                                        });

                                                        retainLivestock.recalculateLedger();
                                                    }
                                                });
                                            }
                                        }
                                    });
                                });

                                addStockAsset(instance, representativeLivestock, true);
                                addStockAsset(instance, birthLivestock, true);
                                addStockAsset(instance, weanedLivestock, true);
                            }
                        }
                    });
                });
            }

            function calculateYearlyProductionIncomeComposition(productionIncomeComposition, year) {
                var yearlyComposition = underscore.mapObject(productionIncomeComposition, function (monthlyComposition) {
                    return underscore.reduce(monthlyComposition.slice((year - 1) * 12, year * 12), function (yearly, consumption) {
                        yearly.unit = consumption.unit;
                        yearly.value = safeMath.plus(yearly.value, consumption.value);
                        yearly.quantity = safeMath.plus(yearly.quantity, consumption.quantity);
                        yearly.pricePerUnit = safeMath.dividedBy(yearly.value, yearly.quantity);

                        return yearly;
                    }, {
                        quantity: 0,
                        value: 0
                    });
                });

                yearlyComposition.total = {
                    value: safeArrayMath.reduce(underscore.chain(yearlyComposition)
                        .values()
                        .pluck('value')
                        .value()) || 0
                };

                underscore.each(yearlyComposition, function(consumption, enterprise) {
                    consumption.percent = (enterprise !== 'total' ? safeMath.times(safeMath.dividedBy(100, yearlyComposition.total.value), consumption.value) : 100);
                });

                return yearlyComposition;
            }

            function reEvaluateProductionSchedules (instance) {
                var startMonth = moment(instance.startDate, 'YYYY-MM-DD'),
                    numberOfMonths = instance.numberOfMonths;

                // Indirect production income & expenses
                underscore.chain(instance.models.income)
                    .where({type: 'production'})
                    .each(function (income) {
                        Base.initializeObject(instance.data.enterpriseProductionIncome, 'Indirect', {});
                        Base.initializeObject(instance.data.enterpriseProductionIncome['Indirect'], income.name, Base.initializeArray(numberOfMonths, 0));
                        instance.data.enterpriseProductionIncome['Indirect'][income.name] = safeArrayMath.plus(instance.data.enterpriseProductionIncome['Indirect'][income.name], income.months);
                    });

                underscore.chain(instance.models.expenses)
                    .where({type: 'production'})
                    .each(function (expense) {
                        Base.initializeObject(instance.data.enterpriseProductionExpenditure, 'Indirect', {});
                        Base.initializeObject(instance.data.enterpriseProductionExpenditure['Indirect'], expense.name, Base.initializeArray(numberOfMonths, 0));
                        instance.data.enterpriseProductionExpenditure['Indirect'][expense.name] = safeArrayMath.plus(instance.data.enterpriseProductionExpenditure['Indirect'][expense.name], expense.months);
                    });

                // Production income & expenses
                angular.forEach(instance.models.productionSchedules, function (productionSchedule) {
                    var schedule = ProductionSchedule.new(productionSchedule);

                    extractProductionScheduleCategoryValuePerMonth(instance.data, schedule, 'INC', startMonth, numberOfMonths, true);
                    extractProductionScheduleCategoryValuePerMonth(instance.data, schedule, 'EXP', startMonth, numberOfMonths, true);
                });
            }

            function reEvaluateProductionIncomeAndExpenditure (instance, numberOfMonths) {
                instance.data.productionIncome = underscore.extend(instance.data.productionIncome, underscore.reduce(instance.data.enterpriseProductionIncome, function (results, groupedValues) {
                    return underscore.reduce(groupedValues, function (totals, values, group) {
                        Base.initializeObject(totals, group, Base.initializeArray(numberOfMonths, 0));
                        totals[group] = safeArrayMath.plus(totals[group], values);
                        return totals;
                    }, results);
                }, {}));

                instance.data.productionExpenditure = underscore.extend(instance.data.productionExpenditure, underscore.reduce(instance.data.enterpriseProductionExpenditure, function (results, groupedValues) {
                    return underscore.reduce(groupedValues, function (totals, values, group) {
                        Base.initializeObject(totals, group, Base.initializeArray(numberOfMonths, 0));
                        totals[group] = safeArrayMath.plus(totals[group], values);
                        return totals;
                    }, results);
                }, {}));

                instance.data.unallocatedProductionIncome = instance.data.productionIncome;
                instance.data.unallocatedProductionExpenditure = instance.data.productionExpenditure;
            }

            /**
             * Income & Expenses handling
             */
            function addIncomeExpense (instance, type, item) {
                instance.models[type] = underscore.reject(instance.models[type], function (modelItem) {
                    return modelItem.uuid === item.uuid;
                });

                instance.models[type].push(item);

                reEvaluateBusinessPlan(instance);
            }

            function removeIncomeExpense (instance, type, item) {
                instance.models[type] = underscore.reject(instance.models[type], function (modelItem) {
                    return modelItem.uuid === item.uuid;
                });

                reEvaluateBusinessPlan(instance);
            }

            privateProperty(this, 'addIncome', function (income) {
                addIncomeExpense(this, 'income', income);
            });

            privateProperty(this, 'removeIncome', function (income) {
                removeIncomeExpense(this, 'income', income);
            });

            privateProperty(this, 'addExpense', function (expense) {
                addIncomeExpense(this, 'expenses', expense);
            });

            privateProperty(this, 'removeExpense', function (expense) {
                removeIncomeExpense(this, 'expenses', expense);
            });

            function reEvaluateIncomeAndExpenses (instance) {
                var startMonth = moment(instance.startDate, 'YYYY-MM-DD'),
                    endMonth = moment(instance.endDate, 'YYYY-MM-DD'),
                    numberOfMonths = endMonth.diff(startMonth, 'months'),
                    evaluatedModels = [];

                underscore.each(instance.models.income, function (income) {
                    var registerLegalEntity = underscore.findWhere(instance.data.legalEntities, {id: income.legalEntityId}),
                        evaluatedModel = underscore.findWhere(evaluatedModels, {uuid: income.uuid}),
                        type = (income.type ? income.type : 'other') + 'Income';

                    // Check income is not already added
                    if (income.type !== 'production' && registerLegalEntity && underscore.isUndefined(evaluatedModel) && instance.data[type]) {
                        initializeCategoryValues(instance, type, income.name, numberOfMonths);

                        instance.data[type][income.name] = underscore.map(income.months, function (monthValue, index) {
                            return safeMath.plus(monthValue, instance.data[type][income.name][index]);
                        });

                        evaluatedModels.push(income);
                    }
                });

                underscore.each(instance.models.expenses, function (expense) {
                    var registerLegalEntity = underscore.findWhere(instance.data.legalEntities, {id: expense.legalEntityId}),
                        evaluatedModel = underscore.findWhere(evaluatedModels, {uuid: expense.uuid}),
                        type = (expense.type ? expense.type : 'other') + 'Expenditure';

                    // Check expense is not already added
                    if (expense.type !== 'production' && registerLegalEntity && underscore.isUndefined(evaluatedModel) && instance.data[type]) {
                        initializeCategoryValues(instance, type, expense.name, numberOfMonths);

                        instance.data[type][expense.name] = underscore.map(expense.months, function (monthValue, index) {
                            return safeMath.plus(monthValue, instance.data[type][expense.name][index]);
                        });

                        evaluatedModels.push(expense);
                    }
                });
            }

            /**
             * Financials
             */
            privateProperty(this, 'updateFinancials', function (financials) {
                this.models.financials = underscore.filter(financials, function (financial) {
                    return Financial.new(financial).validate();
                });

                this.data.consolidatedFinancials = underscore.chain(this.models.financials)
                    .groupBy('year')
                    .map(function (groupedFinancials) {
                        return asJson(FinancialGroup.new({
                            financials: groupedFinancials
                        }), ['financials']);
                    })
                    .sortBy('year')
                    .last(3)
                    .value();
            });

            /**
             *   Assets & Liabilities Handling
             */
            privateProperty(this, 'addAsset', function (asset) {
                var instance = this,
                    oldAsset = underscore.findWhere(instance.models.assets, {assetKey: asset.assetKey});

                asset = AssetFactory.new(asset);

                if (asset.validate()) {
                    // Remove the old asset's liabilities if we are updating an existing asset
                    if (!underscore.isUndefined(oldAsset)) {
                        instance.models.liabilities = underscore.reject(instance.models.liabilities, function (liability) {
                            return underscore.findWhere(oldAsset.liabilities, {uuid: liability.uuid});
                        });
                    }

                    // Remove the asset
                    instance.models.assets = underscore.reject(instance.models.assets, function (item) {
                        return item.assetKey === asset.assetKey;
                    });

                    // Add the new asset's liabilities
                    asset.liabilities = underscore.chain(asset.liabilities)
                        .map(function (liability) {
                            if (liability.validate()) {
                                instance.models.liabilities = underscore.reject(instance.models.liabilities, function (item) {
                                    return item.uuid === liability.uuid;
                                });

                                instance.models.liabilities.push(asJson(liability));
                            }

                            return asJson(liability);
                        })
                        .value();

                    // Add the new asset
                    instance.models.assets.push(asJson(asset));

                    reEvaluateBusinessPlan(instance);
                }
            });

            privateProperty(this, 'removeAsset', function (asset) {
                var instance = this;

                instance.models.assets = underscore.reject(instance.models.assets, function (item) {
                    return item.assetKey === asset.assetKey;
                });

                underscore.each(asset.liabilities, function (liability) {
                    instance.models.liabilities = underscore.reject(instance.models.liabilities, function (item) {
                        return item.uuid === liability.uuid;
                    });
                });

                reEvaluateBusinessPlan(instance);
            });

            privateProperty(this, 'addLiability', function (liability) {
                liability = Liability.new(liability);

                if (liability.validate()) {
                    this.models.liabilities = underscore.reject(this.models.liabilities, function (item) {
                        return item.uuid === liability.uuid;
                    });

                    this.models.liabilities.push(asJson(liability));

                    reEvaluateBusinessPlan(this);
                }
            });

            privateProperty(this, 'removeLiability', function (liability) {
                this.models.liabilities = underscore.reject(this.models.liabilities, function (item) {
                    return item.uuid === liability.uuid;
                });

                reEvaluateBusinessPlan(this);
            });

            function reEvaluateProductionCredit(instance) {
                instance.data.unallocatedEnterpriseProductionExpenditure = angular.copy(instance.data.enterpriseProductionExpenditure);
                instance.data.unallocatedProductionExpenditure = angular.copy(instance.data.productionExpenditure);

                underscore.chain(instance.data.models.liabilities)
                    .where({type: 'production-credit'})
                    .map(Liability.newCopy)
                    .each(function (liability) {
                        underscore.each(liability.liabilityInRange(instance.startDate, instance.endDate), function (monthly, index) {
                            underscore.each(liability.data.enterprises, function (enterprise) {
                                underscore.each(liability.data.inputs, function (input) {
                                    instance.data.unallocatedEnterpriseProductionExpenditure[enterprise][input][index] = Math.max(0, safeMath.minus(instance.data.unallocatedEnterpriseProductionExpenditure[enterprise][input][index], monthly.withdrawal));
                                    instance.data.unallocatedProductionExpenditure[input][index] = Math.max(0, safeMath.minus(instance.data.unallocatedProductionExpenditure[input][index], monthly.withdrawal));
                                });
                            });
                        });
                    });
            }

            privateProperty(this, 'reEvaluateProductionCredit', function (liabilities) {
                return reEvaluateProductionCredit(this, liabilities);
            });

            function updateAssetStatementCategory(instance, category, name, asset) {
                asset.data.assetValue = asset.data.assetValue || 0;

                var startMonth = moment(instance.startDate, 'YYYY-MM-DD'),
                    numberOfMonths = instance.numberOfMonths,
                    numberOfYears = instance.numberOfYears,
                    assetCategory = underscore.findWhere(instance.data.assetStatement[category], {name: name}) || {
                        name: name,
                        estimatedValue: 0,
                        marketValue: 0,
                        monthly: {
                            depreciation: Base.initializeArray(numberOfMonths),
                            marketValue: Base.initializeArray(numberOfMonths)
                        },
                        yearly: {
                            depreciation: Base.initializeArray(numberOfYears),
                            marketValue: Base.initializeArray(numberOfYears)
                        },
                        assets: []
                    };

                if (!underscore.findWhere(assetCategory.assets, {assetKey: asset.assetKey})) {
                    assetCategory.assets.push(asJson(asset, ['liabilities', 'productionSchedules']));
                }

                if (!asset.data.acquisitionDate || startMonth.isAfter(asset.data.acquisitionDate)) {
                    assetCategory.estimatedValue = safeMath.plus(assetCategory.estimatedValue, asset.data.assetValue);
                }

                instance.data.assetStatement[category] = underscore.chain(instance.data.assetStatement[category])
                    .reject(function (item) {
                        return item.name === assetCategory.name;
                    })
                    .union([assetCategory])
                    .value()
                    .sort(function (a, b) {
                        return naturalSort(a.name, b.name);
                    });
            }

            function updateLiabilityStatementCategory(instance, liability) {
                var category = (liability.type === 'production-credit' ? 'medium-term' : (liability.type === 'rent' ? 'short-term' : liability.type)),
                    name = (liability.type === 'production-credit' ? 'Production Credit' : (liability.type === 'rent' ? 'Rent overdue' : liability.category || liability.name)),
                    numberOfYears = instance.numberOfYears,
                    liabilityCategory = underscore.findWhere(instance.data.liabilityStatement[category], {name: name}) || {
                        name: name,
                        currentValue: 0,
                        yearlyValues: Base.initializeArray(numberOfYears),
                        liabilities: []
                    };

                liabilityCategory.currentValue = safeMath.plus(liabilityCategory.currentValue, liability.liabilityInMonth(instance.startDate).opening);

                if (!underscore.findWhere(liabilityCategory.liabilities, {uuid: liability.uuid})) {
                    liabilityCategory.liabilities.push(asJson(liability));
                }

                // Calculate total year-end values for liability category
                for (var year = 0; year < numberOfYears; year++) {
                    var yearEnd = moment.min(moment(instance.endDate, 'YYYY-MM-DD'), moment(instance.startDate, 'YYYY-MM-DD').add(year, 'years').add(11, 'months'));
                    liabilityCategory.yearlyValues[year] = safeMath.plus(liabilityCategory.yearlyValues[year], liability.liabilityInMonth(yearEnd).closing);
                }

                instance.data.liabilityStatement[category] = underscore.chain(instance.data.liabilityStatement[category])
                    .reject(function (item) {
                        return item.name === liabilityCategory.name;
                    })
                    .union([liabilityCategory])
                    .value()
                    .sort(function (a, b) {
                        return naturalSort(a.name, b.name);
                    });
            }

            function recalculateAssetStatement (instance) {
                var ignoredItems = ['Bank Capital', 'Bank Overdraft'],
                    depreciationRatePerMonth = safeMath.chain(instance.data.account.depreciationRate || 0)
                        .dividedBy(100)
                        .dividedBy(12)
                        .toNumber();

                angular.forEach(instance.data.assetStatement, function (statementItems, category) {
                    if (category !== 'total') {
                        angular.forEach(statementItems, function (item) {
                            if (!underscore.contains(ignoredItems, item.name)) {
                                var adjustmentFactor = instance.data.adjustmentFactors[item.name] || 1,
                                    assetMarketValue = instance.data.assetMarketValue[item.name] || Base.initializeArray(instance.numberOfMonths),
                                    assetStockValue = instance.data.assetStockValue[item.name],
                                    capitalExpenditure = instance.data.capitalExpenditure[item.name] || Base.initializeArray(instance.numberOfMonths);

                                item.marketValue = safeMath.times(item.estimatedValue, adjustmentFactor);

                                item.monthly.marketValue = (underscore.isArray(assetStockValue) ?
                                    assetStockValue :
                                    underscore.map(item.monthly.marketValue, function (value, index) {
                                        return safeMath.chain(item.marketValue)
                                            .minus(safeArrayMath.reduce(assetMarketValue.slice(0, index)))
                                            .plus(safeArrayMath.reduce(capitalExpenditure.slice(0, index)))
                                            .toNumber();
                                    }));

                                item.monthly.depreciation = underscore.map(item.monthly.marketValue, function (value) {
                                    return (item.name !== 'Vehicles, Machinery & Equipment' ? 0 : safeMath.times(value, depreciationRatePerMonth));
                                });
                                item.monthly.marketValue = safeArrayMath.minus(item.monthly.marketValue, assetMarketValue);

                                item.yearly.depreciation = [calculateYearlyTotal(item.monthly.depreciation, 1), calculateYearlyTotal(item.monthly.depreciation, 2)];
                                item.yearly.marketValue = [calculateEndOfYearValue(item.monthly.marketValue, 1), calculateEndOfYearValue(item.monthly.marketValue, 2)];
                            }
                        });
                    }
                });
            }

            function totalAssetsAndLiabilities(instance) {
                var numberOfMonths = instance.numberOfMonths,
                    numberOfYears = instance.numberOfYears;

                instance.data.assetStatement.total = underscore.chain(instance.data.assetStatement)
                    .omit('total')
                    .values()
                    .flatten(true)
                    .reduce(function(result, asset) {
                        result.estimatedValue = safeMath.plus(result.estimatedValue, asset.estimatedValue);
                        result.marketValue = safeMath.plus(result.marketValue, asset.marketValue);
                        result.monthly.depreciation = safeArrayMath.plus(result.monthly.depreciation, asset.monthly.depreciation);
                        result.monthly.marketValue = safeArrayMath.plus(result.monthly.marketValue, asset.monthly.marketValue);
                        result.yearly.depreciation = safeArrayMath.plus(result.yearly.depreciation, asset.yearly.depreciation);
                        result.yearly.marketValue = safeArrayMath.plus(result.yearly.marketValue, asset.yearly.marketValue);
                        return result;
                    }, {
                        estimatedValue: 0,
                        marketValue: 0,
                        monthly: {
                            depreciation: Base.initializeArray(numberOfMonths),
                            marketValue: Base.initializeArray(numberOfMonths)
                        },
                        yearly: {
                            depreciation: Base.initializeArray(numberOfYears),
                            marketValue: Base.initializeArray(numberOfYears)
                        }
                    })
                    .value();

                instance.data.liabilityStatement.total = underscore.chain(instance.data.liabilityStatement)
                    .omit('total')
                    .values()
                    .flatten(true)
                    .reduce(function(result, liability) {
                        result.currentValue = safeMath.plus(result.currentValue, liability.currentValue);
                        result.yearlyValues = safeArrayMath.plus(result.yearlyValues, liability.yearlyValues);
                        return result;
                    }, {
                        currentValue: 0,
                        yearlyValues: Base.initializeArray(numberOfYears)
                    })
                    .value();
            }

            function reEvaluateAssetsAndLiabilities (instance) {
                var startMonth = moment(instance.startDate, 'YYYY-MM-DD'),
                    endMonth = moment(instance.endDate, 'YYYY-MM-DD'),
                    numberOfMonths = endMonth.diff(startMonth, 'months'),
                    evaluatedModels = [],
                    monthDiff = 0;

                var assetRank = {
                    'cropland': 1,
                    'pasture': 1,
                    'permanent crop': 1,
                    'plantation': 1,
                    'wasteland': 1,
                    'farmland': 2
                };

                underscore.chain(instance.models.assets)
                    .sortBy(function (asset) {
                        return assetRank[asset.type] || 0;
                    })
                    .each(function (asset) {
                        var registerLegalEntity = underscore.findWhere(instance.data.legalEntities, {id: asset.legalEntityId}),
                            evaluatedAsset = underscore.findWhere(evaluatedModels, {assetKey: asset.assetKey});

                        // Check asset is not already added
                        if (registerLegalEntity && underscore.isUndefined(evaluatedAsset)) {
                            evaluatedModels.push(asset);

                            asset = AssetFactory.new(asset);

                            var acquisitionDate = (asset.data.acquisitionDate ? moment(asset.data.acquisitionDate) : undefined),
                                soldDate = (asset.data.soldDate ? moment(asset.data.soldDate) : undefined),
                                constructionDate = (asset.data.constructionDate ? moment(asset.data.constructionDate) : undefined),
                                demolitionDate = (asset.data.demolitionDate ? moment(asset.data.demolitionDate) : undefined);

                            // VME
                            if (asset.type === 'vme') {
                                if (asset.data.assetValue && acquisitionDate && acquisitionDate.isBetween(startMonth, endMonth)) {
                                    monthDiff = acquisitionDate.diff(startMonth, 'months');

                                    initializeCategoryValues(instance, 'capitalExpenditure', 'Vehicles, Machinery & Equipment', numberOfMonths);

                                    instance.data.capitalExpenditure['Vehicles, Machinery & Equipment'][monthDiff] = safeMath.plus(instance.data.capitalExpenditure['Vehicles, Machinery & Equipment'][monthDiff], asset.data.assetValue);
                                }

                                if (asset.data.sold && asset.data.salePrice && soldDate && soldDate.isBetween(startMonth, endMonth)) {
                                    monthDiff = soldDate.diff(startMonth, 'months');

                                    var value = safeMath.minus(asset.data.assetValue, safeMath.chain(instance.data.account.depreciationRate || 0)
                                        .dividedBy(100)
                                        .dividedBy(12)
                                        .times(asset.data.assetValue)
                                        .times(acquisitionDate && acquisitionDate.isBetween(startMonth, endMonth) ?
                                            soldDate.diff(acquisitionDate, 'months') :
                                            monthDiff + 1)
                                        .toNumber());

                                    initializeCategoryValues(instance, 'assetMarketValue', 'Vehicles, Machinery & Equipment', numberOfMonths);
                                    initializeCategoryValues(instance, 'capitalIncome', 'Vehicles, Machinery & Equipment', numberOfMonths);
                                    initializeCategoryValues(instance, 'capitalProfit', 'Vehicles, Machinery & Equipment', numberOfMonths);
                                    initializeCategoryValues(instance, 'capitalLoss', 'Vehicles, Machinery & Equipment', numberOfMonths);

                                    instance.data.assetMarketValue['Vehicles, Machinery & Equipment'][monthDiff] = safeMath.plus(instance.data.assetMarketValue['Vehicles, Machinery & Equipment'][monthDiff], safeMath.plus(asset.data.assetValue, value));
                                    instance.data.capitalIncome['Vehicles, Machinery & Equipment'][monthDiff] = safeMath.plus(instance.data.capitalIncome['Vehicles, Machinery & Equipment'][monthDiff], asset.data.salePrice);
                                    instance.data.capitalProfit['Vehicles, Machinery & Equipment'][monthDiff] = safeMath.plus(instance.data.capitalProfit['Vehicles, Machinery & Equipment'][monthDiff], Math.max(0, safeMath.minus(asset.data.salePrice, value)));
                                    instance.data.capitalLoss['Vehicles, Machinery & Equipment'][monthDiff] = safeMath.plus(instance.data.capitalLoss['Vehicles, Machinery & Equipment'][monthDiff], Math.max(0, safeMath.minus(value, asset.data.salePrice)));
                                }
                            } else if (asset.type === 'improvement') {
                                if (asset.data.assetValue && constructionDate && constructionDate.isBetween(startMonth, endMonth)) {
                                    monthDiff = constructionDate.diff(startMonth, 'months');

                                    initializeCategoryValues(instance, 'capitalExpenditure', 'Fixed Improvements', numberOfMonths);

                                    instance.data.capitalExpenditure['Fixed Improvements'][monthDiff] = safeMath.plus(instance.data.capitalExpenditure['Fixed Improvements'][monthDiff], asset.data.assetValue);
                                }
                            } else if (asset.type === 'stock') {
                                underscore.each(asset.inventoryInRange(startMonth, endMonth), function (monthly, index) {
                                    initializeCategoryValues(instance, 'assetStockValue', 'Stock On Hand', numberOfMonths);
                                    instance.data.assetStockValue['Stock On Hand'][index] = safeMath.plus(instance.data.assetStockValue['Stock On Hand'][index], monthly.closing.value);

                                    underscore.each(monthly.entries, function (entry) {
                                        var commodity = entry.commodity || 'Indirect';

                                        switch (entry.action) {
                                            case 'Household':
                                                initializeCategoryValues(instance, 'otherExpenditure', 'Farm Products Consumed', numberOfMonths);
                                                instance.data.otherExpenditure['Farm Products Consumed'][index] = safeMath.plus(instance.data.otherExpenditure['Farm Products Consumed'][index], entry.value);
                                                break;
                                            case 'Labour':
                                                Base.initializeObject(instance.data.enterpriseProductionExpenditure, commodity, {});
                                                instance.data.enterpriseProductionExpenditure[commodity]['Farm Products Consumed'] = instance.data.enterpriseProductionExpenditure[commodity]['Farm Products Consumed'] || Base.initializeArray(numberOfMonths);
                                                instance.data.enterpriseProductionExpenditure[commodity]['Farm Products Consumed'][index] = safeMath.plus(instance.data.enterpriseProductionExpenditure[commodity]['Farm Products Consumed'][index], entry.value);
                                                break;
                                            case 'Purchase':
                                                Base.initializeObject(instance.data.enterpriseProductionExpenditure, commodity, {});
                                                instance.data.enterpriseProductionExpenditure[commodity][asset.data.category] = instance.data.enterpriseProductionExpenditure[commodity][asset.data.category] || Base.initializeArray(numberOfMonths);
                                                instance.data.enterpriseProductionExpenditure[commodity][asset.data.category][index] = safeMath.plus(instance.data.enterpriseProductionExpenditure[commodity][asset.data.category][index], entry.value);
                                                break;
                                            case 'Sale':
                                                // Stock Production Income
                                                Base.initializeObject(instance.data.enterpriseProductionIncome, commodity, {});
                                                instance.data.enterpriseProductionIncome[commodity]['Crop Sales'] = instance.data.enterpriseProductionIncome[commodity]['Crop Sales'] || Base.initializeArray(numberOfMonths);
                                                instance.data.enterpriseProductionIncome[commodity]['Crop Sales'][index] = safeMath.plus(instance.data.enterpriseProductionIncome[commodity]['Crop Sales'][index], entry.value);

                                                // Composition
                                                instance.data.productionIncomeComposition[asset.data.category] = instance.data.productionIncomeComposition[asset.data.category] || underscore.range(numberOfMonths).map(function () {
                                                    return {
                                                        unit: asset.data.quantityUnit || asset.data.priceUnit,
                                                        quantity: 0,
                                                        value: 0
                                                    };
                                                });

                                                var compositionMonth = instance.data.productionIncomeComposition[asset.data.category][index];
                                                compositionMonth.value = safeMath.plus(compositionMonth.value, entry.value);
                                                compositionMonth.quantity = safeMath.plus(compositionMonth.quantity, entry.quantity);
                                                compositionMonth.pricePerUnit = safeMath.dividedBy(compositionMonth.value, compositionMonth.quantity);
                                                break;
                                        }
                                    });

                                    if (index === 0) {
                                        updateAssetStatementCategory(instance, 'short-term', 'Stock On Hand', {
                                            data: {
                                                name: asset.data.category,
                                                liquidityType: 'short-term',
                                                assetValue: monthly.opening.value,
                                                reference: 'production/crop'
                                            }
                                        });
                                    }
                                });
                            } else if (asset.type === 'livestock') {
                                var monthlyLedger = asset.inventoryInRange(startMonth, endMonth),
                                    birthingAnimal = EnterpriseBudget.getBirthingAnimal(asset.data.type);

                                underscore.each(monthlyLedger, function (ledger, index) {
                                    var offsetDate = moment(instance.startDate, 'YYYY-MM-DD').add(index, 'M'),
                                        stockValue = safeMath.times(ledger.closing.quantity, asset.marketPriceAtDate(offsetDate));

                                    if (birthingAnimal === asset.data.category) {
                                        initializeCategoryValues(instance, 'assetStockValue', 'Marketable Livestock', numberOfMonths);
                                        instance.data.assetStockValue['Marketable Livestock'][index] = safeMath.plus(instance.data.assetStockValue['Marketable Livestock'][index], stockValue);
                                    } else {
                                        initializeCategoryValues(instance, 'assetStockValue', 'Breeding Stock', numberOfMonths);
                                        instance.data.assetStockValue['Breeding Stock'][index] = safeMath.plus(instance.data.assetStockValue['Breeding Stock'][index], stockValue);
                                    }

                                    underscore.chain(ledger)
                                        .pick(['credit', 'debit'])
                                        .each(function (actions) {
                                            underscore.each(actions, function (item, action) {
                                                switch (action) {
                                                    case 'Household':
                                                        initializeCategoryValues(instance, 'otherExpenditure', 'Farm Products Consumed', numberOfMonths);
                                                        instance.data.otherExpenditure['Farm Products Consumed'][index] = safeMath.plus(instance.data.otherExpenditure['Farm Products Consumed'][index], item.value);
                                                        break;
                                                    case 'Labour':
                                                        Base.initializeObject(instance.data.enterpriseProductionExpenditure, asset.data.type, {});
                                                        instance.data.enterpriseProductionExpenditure[asset.data.type]['Farm Products Consumed'] = instance.data.enterpriseProductionExpenditure[asset.data.type]['Farm Products Consumed'] || Base.initializeArray(numberOfMonths);
                                                        instance.data.enterpriseProductionExpenditure[asset.data.type]['Farm Products Consumed'][index] = safeMath.plus(instance.data.enterpriseProductionExpenditure[asset.data.type]['Farm Products Consumed'][index], item.value);
                                                        break;
                                                    case 'Purchase':
                                                        initializeCategoryValues(instance, 'capitalExpenditure', 'Livestock', numberOfMonths);
                                                        instance.data.capitalExpenditure['Livestock'][index] = safeMath.plus(instance.data.capitalExpenditure['Livestock'][index], item.value);
                                                        break;
                                                    case 'Sale':
                                                        // Livestock Production Income
                                                        Base.initializeObject(instance.data.enterpriseProductionIncome, asset.data.type, {});
                                                        instance.data.enterpriseProductionIncome[asset.data.type]['Livestock Sales'] = instance.data.enterpriseProductionIncome[asset.data.type]['Livestock Sales'] || Base.initializeArray(numberOfMonths);
                                                        instance.data.enterpriseProductionIncome[asset.data.type]['Livestock Sales'][index] = safeMath.plus(instance.data.enterpriseProductionIncome[asset.data.type]['Livestock Sales'][index], item.value);

                                                        // Composition
                                                        instance.data.productionIncomeComposition[asset.data.category] = instance.data.productionIncomeComposition[asset.data.category] || underscore.range(numberOfMonths).map(function () {
                                                            return {
                                                                unit: asset.data.quantityUnit,
                                                                quantity: 0,
                                                                value: 0
                                                            };
                                                        });

                                                        var compositionMonth = instance.data.productionIncomeComposition[asset.data.category][index];
                                                        compositionMonth.value = safeMath.plus(compositionMonth.value, item.value);
                                                        compositionMonth.quantity = safeMath.plus(compositionMonth.quantity, item.quantity);
                                                        compositionMonth.pricePerUnit = safeMath.dividedBy(compositionMonth.value, compositionMonth.quantity);
                                                        break;
                                                }
                                            });
                                        });

                                    if (index === 0) {
                                        if (birthingAnimal === asset.data.category) {
                                            updateAssetStatementCategory(instance, 'short-term', 'Marketable Livestock', {
                                                data: {
                                                    name: asset.data.category,
                                                    liquidityType: 'short-term',
                                                    assetValue: ledger.opening.value,
                                                    reference: 'production/livestock'
                                                }
                                            });
                                        } else {
                                            updateAssetStatementCategory(instance, 'medium-term', 'Breeding Stock', {
                                                data: {
                                                    name: asset.data.category,
                                                    liquidityType: 'medium-term',
                                                    assetValue: ledger.opening.value,
                                                    reference: 'production/livestock'
                                                }
                                            });
                                        }
                                    }
                                });
                            } else if (asset.type === 'farmland') {
                                if (asset.data.assetValue && acquisitionDate && acquisitionDate.isBetween(startMonth, endMonth)) {
                                    monthDiff = acquisitionDate.diff(startMonth, 'months');

                                    initializeCategoryValues(instance, 'capitalExpenditure', 'Land', numberOfMonths);

                                    instance.data.capitalExpenditure['Land'][monthDiff] = safeMath.plus(instance.data.capitalExpenditure['Land'][monthDiff], asset.data.assetValue);
                                }

                                if (asset.data.sold && asset.data.salePrice && soldDate && soldDate.isBetween(startMonth, endMonth)) {
                                    monthDiff = soldDate.diff(startMonth, 'months');

                                    initializeCategoryValues(instance, 'assetMarketValue', 'Land', numberOfMonths);
                                    initializeCategoryValues(instance, 'capitalIncome', 'Land', numberOfMonths);
                                    initializeCategoryValues(instance, 'capitalProfit', 'Land', numberOfMonths);
                                    initializeCategoryValues(instance, 'capitalLoss', 'Land', numberOfMonths);

                                    instance.data.assetMarketValue['Land'][monthDiff] = safeMath.plus(instance.data.assetMarketValue['Land'][monthDiff], asset.data.assetValue);
                                    instance.data.capitalIncome['Land'][monthDiff] = safeMath.plus(instance.data.capitalIncome['Land'][monthDiff], asset.data.salePrice);
                                    instance.data.capitalProfit['Land'][monthDiff] = safeMath.plus(instance.data.capitalProfit['Land'][monthDiff], Math.max(0, safeMath.minus(asset.data.salePrice, asset.data.assetValue)));
                                    instance.data.capitalLoss['Land'][monthDiff] = safeMath.plus(instance.data.capitalLoss['Land'][monthDiff], Math.max(0, safeMath.minus(asset.data.assetValue, asset.data.salePrice)));
                                }
                            } else if (asset.type === 'other') {
                                asset.data.liquidityCategory = asset.data.liquidityCategory || asset.data.category;

                                if (asset.data.assetValue && acquisitionDate && acquisitionDate.isBetween(startMonth, endMonth)) {
                                    monthDiff = acquisitionDate.diff(startMonth, 'months');

                                    initializeCategoryValues(instance, 'capitalExpenditure', asset.data.liquidityCategory, numberOfMonths);

                                    instance.data.capitalExpenditure[asset.data.liquidityCategory][monthDiff] = safeMath.plus(instance.data.capitalExpenditure[asset.data.liquidityCategory][monthDiff], asset.data.assetValue);
                                }

                                if (asset.data.sold && asset.data.salePrice && soldDate && soldDate.isBetween(startMonth, endMonth)) {
                                    monthDiff = soldDate.diff(startMonth, 'months');

                                    var value = (asset.data.liquidityCategory !== 'Vehicles, Machinery & Equipment' ? asset.data.assetValue : safeMath.minus(asset.data.assetValue, safeMath.chain(instance.data.account.depreciationRate || 0)
                                        .dividedBy(100)
                                        .dividedBy(12)
                                        .times(asset.data.assetValue)
                                        .times(acquisitionDate && acquisitionDate.isBetween(startMonth, endMonth) ?
                                            soldDate.diff(acquisitionDate, 'months') :
                                            monthDiff + 1)
                                        .toNumber()));

                                    initializeCategoryValues(instance, 'assetMarketValue', asset.data.liquidityCategory, numberOfMonths);
                                    initializeCategoryValues(instance, 'capitalIncome', asset.data.liquidityCategory, numberOfMonths);
                                    initializeCategoryValues(instance, 'capitalProfit', asset.data.liquidityCategory, numberOfMonths);
                                    initializeCategoryValues(instance, 'capitalLoss', asset.data.liquidityCategory, numberOfMonths);

                                    instance.data.assetMarketValue[asset.data.liquidityCategory][monthDiff] = safeMath.plus(instance.data.assetMarketValue[asset.data.liquidityCategory][monthDiff], asset.data.assetValue);
                                    instance.data.capitalIncome[asset.data.liquidityCategory][monthDiff] = safeMath.plus(instance.data.capitalIncome[asset.data.liquidityCategory][monthDiff], asset.data.salePrice);
                                    instance.data.capitalProfit[asset.data.liquidityCategory][monthDiff] = safeMath.plus(instance.data.capitalProfit[asset.data.liquidityCategory][monthDiff], Math.max(0, safeMath.minus(asset.data.salePrice, value)));
                                    instance.data.capitalLoss[asset.data.liquidityCategory][monthDiff] = safeMath.plus(instance.data.capitalLoss[asset.data.liquidityCategory][monthDiff], Math.max(0, safeMath.minus(value, asset.data.salePrice)));
                                }
                            }

                            if (!(asset.data.sold && soldDate && soldDate.isBefore(startMonth)) && !(asset.data.demolished && demolitionDate && demolitionDate.isBefore(startMonth))) {
                                switch(asset.type) {
                                    case 'cropland':
                                    case 'pasture':
                                    case 'permanent crop':
                                    case 'plantation':
                                    case 'wasteland':
                                        updateAssetStatementCategory(instance, 'long-term', 'Land', asset);
                                        break;
                                    case 'farmland':
                                        instance.data.assetStatement['long-term'] = instance.data.assetStatement['long-term'] || [];

                                        var assetCategory = underscore.findWhere(instance.data.assetStatement['long-term'], {name: 'Land'}) || {},
                                            landUseValue = underscore.chain(assetCategory.assets || [])
                                                .reject(function (statementAsset) {
                                                    return statementAsset.farmId !== asset.farmId || statementAsset.type === 'farmland';
                                                })
                                                .reduce(function (total, statementAsset) {
                                                    return safeMath.plus(total, statementAsset.data.assetValue);
                                                }, 0)
                                                .value();

                                        if (landUseValue === 0) {
                                            updateAssetStatementCategory(instance, 'long-term', 'Land', asset);
                                        }
                                        break;
                                    case 'improvement':
                                        updateAssetStatementCategory(instance, 'long-term', 'Fixed Improvements', asset);
                                        break;
                                    case 'vme':
                                        updateAssetStatementCategory(instance, 'medium-term', 'Vehicles, Machinery & Equipment', asset);
                                        break;
                                    case 'other':
                                        updateAssetStatementCategory(instance, asset.data.liquidityType, asset.data.liquidityCategory, asset);
                                        break;
                                }
                            }

                            angular.forEach(asset.liabilities, function (liability) {
                                // Check liability is not already added
                                if (underscore.findWhere(evaluatedModels, {uuid: liability.uuid}) === undefined) {
                                    evaluatedModels.push(liability);

                                    var section = (liability.type === 'rent' ? 'capitalExpenditure' : 'debtRedemption'),
                                        typeTitle = (liability.type !== 'other' ? Liability.getTypeTitle(liability.type) : liability.name),
                                        liabilityMonths = liability.liabilityInRange(instance.startDate, instance.endDate);

                                    if (asset.type === 'farmland' && liability.type !== 'rent' && moment(liability.startDate, 'YYYY-MM-DD').isBetween(startMonth, endMonth)) {
                                        monthDiff = moment(liability.startDate, 'YYYY-MM-DD').diff(startMonth, 'months');

                                        initializeCategoryValues(instance, 'capitalExpenditure', 'Land', numberOfMonths);

                                        instance.data.capitalExpenditure['Land'][monthDiff] = safeMath.plus(instance.data.capitalExpenditure['Land'][monthDiff], liability.openingBalance);
                                    }

                                    initializeCategoryValues(instance, section, typeTitle, numberOfMonths);

                                    instance.data[section][typeTitle] = underscore.map(liabilityMonths, function (month, index) {
                                        return safeArrayMath.reduce(month.repayment, instance.data[section][typeTitle][index]);
                                    });

                                    // TODO: deal with missing liquidityType for 'Other' liabilities
                                    updateLiabilityStatementCategory(instance, liability)
                                }
                            });
                        }
                    });

                underscore.each(instance.models.liabilities, function (liability) {
                    // Check liability is not already added
                    if (underscore.findWhere(evaluatedModels, {uuid: liability.uuid}) === undefined) {
                        evaluatedModels.push(liability);

                        liability = Liability.new(liability);

                        var section = (liability.type === 'rent' ? 'capitalExpenditure' : 'debtRedemption'),
                            typeTitle = (liability.type !== 'other' ? Liability.getTypeTitle(liability.type) : liability.name),
                            liabilityMonths = liability.liabilityInRange(instance.startDate, instance.endDate);

                        initializeCategoryValues(instance, section, typeTitle, numberOfMonths);

                        instance.data[section][typeTitle] = underscore.map(liabilityMonths, function (month, index) {
                            return safeArrayMath.reduce(month.repayment, instance.data[section][typeTitle][index]);
                        });

                        updateLiabilityStatementCategory(instance, liability);
                    }
                });
            }

            /**
             * Recalculate summary & ratio data
             */
            function calculateYearlyTotal (monthlyTotals, year) {
                return safeArrayMath.reduce(monthlyTotals.slice((year - 1) * 12, year * 12));
            }

            function calculateEndOfYearValue(monthlyTotals, year) {
                var yearSlice = monthlyTotals.slice((year - 1) * 12, year * 12);
                return yearSlice[yearSlice.length - 1];
            }

            function calculateMonthlyAssetTotal (instance, types) {
                var ignoredItems = ['Bank Capital', 'Bank Overdraft'];

                return underscore.chain(instance.data.assetStatement)
                    .pick(types)
                    .values()
                    .flatten()
                    .compact()
                    .reduce(function (totals, item) {
                        return (!underscore.contains(ignoredItems, item.name) && !underscore.isUndefined(item.monthly) ? safeArrayMath.plus(totals, item.monthly.marketValue) : totals);
                    }, Base.initializeArray(instance.numberOfMonths))
                    .value();
            }

            function calculateAssetLiabilityGroupTotal (instance, type, subTypes) {
                subTypes = (underscore.isArray(subTypes) ? subTypes : [subTypes]);

                var numberOfMonths = instance.numberOfMonths,
                    numberOfYears = instance.numberOfYears,
                    result = (type === 'asset' ? {
                        estimatedValue: 0,
                        marketValue: 0,
                        monthly: {
                            marketValue: Base.initializeArray(numberOfMonths),
                            depreciation: Base.initializeArray(numberOfMonths)
                        },
                        yearly: {
                            marketValue: Base.initializeArray(numberOfYears),
                            depreciation: Base.initializeArray(numberOfYears)
                        }
                    } : {
                        currentValue: 0,
                        yearlyValues: Base.initializeArray(numberOfYears)
                    } );

                underscore.each(subTypes, function (subType) {
                    result = underscore.reduce(instance.data[type + 'Statement'][subType], function(total, item) {
                        if (type === 'asset') {
                            total.estimatedValue = safeMath.plus(total.estimatedValue, item.estimatedValue);
                            total.marketValue = safeMath.plus(total.marketValue, item.marketValue);
                            total.monthly.depreciation = safeArrayMath.plus(total.monthly.depreciation, item.monthly.depreciation);
                            total.monthly.marketValue = safeArrayMath.plus(total.monthly.marketValue, item.monthly.marketValue);
                            total.yearly.depreciation = safeArrayMath.plus(total.yearly.depreciation, item.yearly.depreciation);
                            total.yearly.marketValue = safeArrayMath.plus(total.yearly.marketValue, item.yearly.marketValue);
                        } else {
                            total.currentValue = safeMath.plus(total.currentValue, item.currentValue);
                            total.yearlyValues = safeArrayMath.plus(total.yearlyValues, item.yearlyValues);
                        }
                        return total;
                    }, result);
                });

                return result;
            }

            function calculateMonthlyLiabilityPropertyTotal (instance, liabilityTypes, property, startMonth, endMonth) {
                var liabilities = underscore.filter(instance.models.liabilities, function(liability) {
                    if (!liabilityTypes || liabilityTypes.length === 0) return true;

                    return liabilityTypes.indexOf(liability.type) !== -1;
                });

                if (liabilities.length === 0) return Base.initializeArray(instance.numberOfMonths);

                return underscore.chain(liabilities)
                    .map(function(liability) {
                        var range = new Liability(liability).liabilityInRange(startMonth, endMonth);

                        return underscore.chain(range)
                            .pluck(property)
                            .map(function (propertyValue) {
                                return (underscore.isNumber(propertyValue) ? propertyValue : safeArrayMath.reduce(propertyValue))
                            })
                            .value();
                    })
                    .unzip()
                    .map(safeArrayMath.reduce)
                    .value();
            }

            function calculateMonthlyCategoriesTotal (categories, results) {
                underscore.reduce(categories, function (currentTotals, category) {
                    underscore.each(category, function (month, index) {
                        currentTotals[index] += month;
                    });
                    return currentTotals;
                }, results);

                return results;
            }

            function calculateMonthlySectionsTotal (sections, results) {
                return underscore.reduce(sections, function (sectionTotals, section) {
                    return (section ? calculateMonthlyCategoriesTotal(section, sectionTotals) : sectionTotals);
                }, results);
            }


            function calculateYearlyLivestockAdjustment (instance, year) {
                var startDate = moment(instance.startDate).add(year - 1, 'y'),
                    endDate = moment(instance.startDate).add(year, 'y');

                return underscore.chain(instance.models.assets)
                    .where({type: 'livestock'})
                    .map(AssetFactory.new)
                    .reduce(function (total, asset) {
                        var monthly = asset.inventoryInRange(startDate, endDate),
                            openingMonth = underscore.first(monthly),
                            closingMonth = underscore.last(monthly);

                        var openingStockValue = safeMath.times(openingMonth.opening.quantity, asset.marketPriceAtDate(startDate)),
                            closingStockValue = safeMath.times(closingMonth.opening.quantity, asset.marketPriceAtDate(endDate)),
                            purchaseSubtotal = asset.subtotalInRange('Purchase', startDate, endDate);

                        return safeMath.plus(total, safeMath.minus(safeMath.minus(closingStockValue, openingStockValue), purchaseSubtotal.value));
                    }, 0)
                    .value();
            }

            function calculateYearlyLivestockConsumption (instance, year) {
                var startDate = moment(instance.startDate).add(year - 1, 'y'),
                    endDate = moment(instance.startDate).add(year, 'y');

                return underscore.chain(instance.models.assets)
                    .where({type: 'livestock'})
                    .map(AssetFactory.new)
                    .reduce(function (total, asset) {
                        return safeMath.plus(total, asset.subtotalInRange(['Household', 'Labour'], startDate, endDate).value);
                    }, 0)
                    .value();
            }

            function recalculate (instance) {
                var startMonth = moment(instance.startDate, 'YYYY-MM-DD'),
                    endMonth = moment(instance.endDate, 'YYYY-MM-DD'),
                    numberOfMonths = instance.numberOfMonths,
                    taxRatePerYear = safeMath.dividedBy(instance.data.account.incomeTaxRate, 100);

                instance.data.summary = {
                    monthly: {},
                    yearly: {}
                };

                instance.data.capitalIncome = {};
                instance.data.capitalExpenditure = {};
                instance.data.capitalLoss = {};
                instance.data.capitalProfit = {};
                instance.data.cashInflow = {};
                instance.data.cashOutflow = {};
                instance.data.debtRedemption = {};
                instance.data.assetMarketValue = {};
                instance.data.assetStockValue = {};
                instance.data.assetStatement = {};
                instance.data.liabilityStatement = {};
                instance.data.enterpriseProductionIncome = {};
                instance.data.enterpriseProductionExpenditure = {};
                instance.data.productionIncome = {};
                instance.data.productionExpenditure = {};
                instance.data.productionIncomeComposition = {};
                instance.data.otherIncome = {};
                instance.data.otherExpenditure = {};

                reEvaluateProductionSchedules(instance);
                reEvaluateAssetsAndLiabilities(instance);
                reEvaluateIncomeAndExpenses(instance);
                reEvaluateProductionIncomeAndExpenditure(instance, numberOfMonths);
                reEvaluateProductionCredit(instance);
                reEvaluateCashFlow(instance);

                recalculateIncomeExpensesSummary(instance, startMonth, endMonth, numberOfMonths);
                recalculatePrimaryAccount(instance, startMonth, endMonth, numberOfMonths);
                addPrimaryAccountAssetsLiabilities(instance);

                recalculateAssetStatement(instance);
                totalAssetsAndLiabilities(instance);
                recalculateAssetsLiabilitiesInterestSummary(instance, startMonth, endMonth);

                instance.data.summary.yearly.grossProductionValue = safeArrayMath.plus(instance.data.summary.yearly.productionIncome, safeArrayMath.plus(instance.data.summary.yearly.livestockAdjustment, instance.data.summary.yearly.livestockConsumption));
                instance.data.summary.yearly.grossProfit = safeArrayMath.minus(instance.data.summary.yearly.grossProductionValue, instance.data.summary.yearly.productionExpenditure);
                instance.data.summary.yearly.ebitda = safeArrayMath.minus(safeArrayMath.plus(instance.data.summary.yearly.grossProfit, instance.data.summary.yearly.nonFarmIncome), instance.data.summary.yearly.nonFarmExpenditure);
                instance.data.summary.yearly.ebit = safeArrayMath.minus(instance.data.summary.yearly.ebitda, instance.data.summary.yearly.depreciation);
                instance.data.summary.yearly.interestPaid = safeArrayMath.plus(instance.data.summary.yearly.totalRent, instance.data.summary.yearly.totalInterest);
                instance.data.summary.yearly.ebt = safeArrayMath.minus(instance.data.summary.yearly.ebit, instance.data.summary.yearly.interestPaid);
                instance.data.summary.yearly.taxPaid = underscore.map(instance.data.summary.yearly.ebt, function (value) {
                    return Math.max(0, safeMath.times(value, taxRatePerYear));
                });
                instance.data.summary.yearly.netProfit = safeArrayMath.minus(instance.data.summary.yearly.ebt, instance.data.summary.yearly.taxPaid);
            }

            function reEvaluateCashFlow (instance) {
                instance.data.cashInflow = {
                    capitalIncome: instance.data.capitalIncome,
                    productionIncome: instance.data.productionIncome,
                    otherIncome: instance.data.otherIncome
                };

                instance.data.cashOutflow = {
                    capitalExpenditure: instance.data.capitalExpenditure,
                    productionExpenditure: underscore.omit(instance.data.unallocatedProductionExpenditure, ['Farm Products Consumed']),
                    otherExpenditure: underscore.omit(instance.data.otherExpenditure, ['Farm Products Consumed'])
                };
            }

            function recalculateIncomeExpensesSummary (instance, startMonth, endMonth, numberOfMonths) {
                var cashInflow = calculateMonthlySectionsTotal([instance.data.cashInflow.capitalIncome, instance.data.cashInflow.productionIncome, instance.data.cashInflow.otherIncome], Base.initializeArray(numberOfMonths)),
                    cashOutflow = calculateMonthlySectionsTotal([instance.data.cashOutflow.capitalExpenditure, instance.data.cashOutflow.productionExpenditure, instance.data.cashOutflow.otherExpenditure], Base.initializeArray(numberOfMonths)),
                    productionCreditRepayments = underscore.reduce(cashInflow, function (repayment, income, index) {
                        repayment[index] = (income - repayment[index] < 0 ? income : repayment[index]);
                        return repayment;
                    }, calculateMonthlyLiabilityPropertyTotal(instance, ['production-credit'], 'repayment', startMonth, endMonth)),
                    cashInflowAfterRepayments = safeArrayMath.minus(cashInflow, productionCreditRepayments),
                    debtRedemptionAfterRepayments = safeArrayMath.minus(calculateMonthlySectionsTotal([instance.data.debtRedemption], Base.initializeArray(numberOfMonths)), productionCreditRepayments);

                underscore.extend(instance.data.summary.monthly, {
                    // Income
                    productionIncome: calculateMonthlySectionsTotal([instance.data.productionIncome], Base.initializeArray(numberOfMonths)),
                    capitalIncome: calculateMonthlySectionsTotal([instance.data.capitalIncome], Base.initializeArray(numberOfMonths)),
                    capitalProfit: calculateMonthlySectionsTotal([instance.data.capitalProfit], Base.initializeArray(numberOfMonths)),
                    otherIncome: calculateMonthlySectionsTotal([instance.data.otherIncome], Base.initializeArray(numberOfMonths)),
                    nonFarmIncome: calculateMonthlySectionsTotal([instance.data.capitalProfit, instance.data.otherIncome], Base.initializeArray(numberOfMonths)),
                    totalIncome: calculateMonthlySectionsTotal([instance.data.capitalIncome, instance.data.productionIncome, instance.data.otherIncome], Base.initializeArray(numberOfMonths)),
                    cashInflowAfterRepayments: cashInflowAfterRepayments,

                    // Expenses
                    unallocatedProductionExpenditure: calculateMonthlySectionsTotal([instance.data.unallocatedProductionExpenditure], Base.initializeArray(numberOfMonths)),
                    productionExpenditure: calculateMonthlySectionsTotal([instance.data.productionExpenditure], Base.initializeArray(numberOfMonths)),
                    capitalExpenditure: calculateMonthlySectionsTotal([instance.data.capitalExpenditure], Base.initializeArray(numberOfMonths)),
                    capitalLoss: calculateMonthlySectionsTotal([instance.data.capitalLoss], Base.initializeArray(numberOfMonths)),
                    otherExpenditure: calculateMonthlySectionsTotal([instance.data.otherExpenditure], Base.initializeArray(numberOfMonths)),
                    nonFarmExpenditure: calculateMonthlySectionsTotal([instance.data.capitalLoss, instance.data.otherExpenditure], Base.initializeArray(numberOfMonths)),
                    debtRedemption: debtRedemptionAfterRepayments,
                    totalExpenditure: safeArrayMath.plus(debtRedemptionAfterRepayments, calculateMonthlySectionsTotal([instance.data.capitalExpenditure, instance.data.unallocatedProductionExpenditure, instance.data.otherExpenditure], Base.initializeArray(numberOfMonths))),
                    cashOutflowAfterRepayments: safeArrayMath.plus(debtRedemptionAfterRepayments, cashOutflow)
                });

                var livestockAdjustment = [calculateYearlyLivestockAdjustment(instance, 1), calculateYearlyLivestockAdjustment(instance, 2)],
                    livestockConsumption = [calculateYearlyLivestockConsumption(instance, 1), calculateYearlyLivestockConsumption(instance, 2)];

                underscore.extend(instance.data.summary.yearly, {
                    livestockAdjustment: livestockAdjustment,
                    livestockConsumption: livestockConsumption,

                    // Income
                    productionIncome: [calculateYearlyTotal(instance.data.summary.monthly.productionIncome, 1), calculateYearlyTotal(instance.data.summary.monthly.productionIncome, 2)],
                    productionIncomeComposition: [calculateYearlyProductionIncomeComposition(instance.data.productionIncomeComposition, 1), calculateYearlyProductionIncomeComposition(instance.data.productionIncomeComposition, 2)],
                    capitalIncome: [calculateYearlyTotal(instance.data.summary.monthly.capitalIncome, 1), calculateYearlyTotal(instance.data.summary.monthly.capitalIncome, 2)],
                    capitalProfit: [calculateYearlyTotal(instance.data.summary.monthly.capitalProfit, 1), calculateYearlyTotal(instance.data.summary.monthly.capitalProfit, 2)],
                    otherIncome: [calculateYearlyTotal(instance.data.summary.monthly.otherIncome, 1), calculateYearlyTotal(instance.data.summary.monthly.otherIncome, 2)],
                    nonFarmIncome: [calculateYearlyTotal(instance.data.summary.monthly.nonFarmIncome, 1), calculateYearlyTotal(instance.data.summary.monthly.nonFarmIncome, 2)],
                    totalIncome: [calculateYearlyTotal(instance.data.summary.monthly.totalIncome, 1), calculateYearlyTotal(instance.data.summary.monthly.totalIncome, 2)],
                    cashInflowAfterRepayments: [calculateYearlyTotal(instance.data.summary.monthly.cashInflowAfterRepayments, 1), calculateYearlyTotal(instance.data.summary.monthly.cashInflowAfterRepayments, 2)],

                    // Expenses
                    unallocatedProductionExpenditure: [calculateYearlyTotal(instance.data.summary.monthly.unallocatedProductionExpenditure, 1), calculateYearlyTotal(instance.data.summary.monthly.unallocatedProductionExpenditure, 2)],
                    productionExpenditure: [calculateYearlyTotal(instance.data.summary.monthly.productionExpenditure, 1), calculateYearlyTotal(instance.data.summary.monthly.productionExpenditure, 2)],
                    capitalExpenditure: [calculateYearlyTotal(instance.data.summary.monthly.capitalExpenditure, 1), calculateYearlyTotal(instance.data.summary.monthly.capitalExpenditure, 2)],
                    capitalLoss: [calculateYearlyTotal(instance.data.summary.monthly.capitalLoss, 1), calculateYearlyTotal(instance.data.summary.monthly.capitalLoss, 2)],
                    otherExpenditure: [calculateYearlyTotal(instance.data.summary.monthly.otherExpenditure, 1), calculateYearlyTotal(instance.data.summary.monthly.otherExpenditure, 2)],
                    nonFarmExpenditure: [calculateYearlyTotal(instance.data.summary.monthly.nonFarmExpenditure, 1), calculateYearlyTotal(instance.data.summary.monthly.nonFarmExpenditure, 2)],
                    debtRedemption: [calculateYearlyTotal(instance.data.summary.monthly.debtRedemption, 1), calculateYearlyTotal(instance.data.summary.monthly.debtRedemption, 2)],
                    totalExpenditure: [calculateYearlyTotal(instance.data.summary.monthly.totalExpenditure, 1), calculateYearlyTotal(instance.data.summary.monthly.totalExpenditure, 2)],
                    cashOutflowAfterRepayments: [calculateYearlyTotal(instance.data.summary.monthly.cashOutflowAfterRepayments, 1), calculateYearlyTotal(instance.data.summary.monthly.cashOutflowAfterRepayments, 2)]
                });
            }

            function recalculateAssetsLiabilitiesInterestSummary (instance, startMonth, endMonth) {
                var numberOfMonths = instance.numberOfMonths,
                    numberOfYears = instance.numberOfYears;

                underscore.extend(instance.data.summary.monthly, {
                    // Interest
                    productionCreditInterest: calculateMonthlyLiabilityPropertyTotal(instance, ['short-term', 'production-credit'], 'interest', startMonth, endMonth),
                    mediumTermInterest: calculateMonthlyLiabilityPropertyTotal(instance, ['medium-term'], 'interest', startMonth, endMonth),
                    longTermInterest: calculateMonthlyLiabilityPropertyTotal(instance, ['long-term'], 'interest', startMonth, endMonth),
                    totalInterest: safeArrayMath.plus(calculateMonthlyLiabilityPropertyTotal(instance, ['short-term', 'long-term', 'medium-term'], 'interest', startMonth, endMonth), instance.data.summary.monthly.primaryAccountInterest),

                    // Liabilities
                    currentLiabilities: safeArrayMath.plus(calculateMonthlyLiabilityPropertyTotal(instance, ['short-term', 'production-credit'], 'closing', startMonth, endMonth), instance.data.summary.monthly.primaryAccountLiability),
                    mediumLiabilities: calculateMonthlyLiabilityPropertyTotal(instance, ['medium-term'], 'closing', startMonth, endMonth),
                    longLiabilities: calculateMonthlyLiabilityPropertyTotal(instance, ['long-term'], 'closing', startMonth, endMonth),
                    totalLiabilities: safeArrayMath.plus(calculateMonthlyLiabilityPropertyTotal(instance, [], 'closing', startMonth, endMonth), instance.data.summary.monthly.primaryAccountLiability),
                    totalRent: calculateMonthlyLiabilityPropertyTotal(instance, ['rent'], 'repayment', startMonth, endMonth),

                    // Assets
                    currentAssets: safeArrayMath.plus(calculateMonthlyAssetTotal(instance, ['short-term']), instance.data.summary.monthly.primaryAccountCapital),
                    movableAssets: calculateMonthlyAssetTotal(instance, ['medium-term']),
                    fixedAssets: calculateMonthlyAssetTotal(instance, ['long-term']),
                    totalAssets: safeArrayMath.plus(calculateMonthlyAssetTotal(instance, ['short-term', 'medium-term', 'long-term']), instance.data.summary.monthly.primaryAccountCapital),

                    depreciation: instance.data.assetStatement.total.monthly.depreciation || Base.initializeArray(numberOfMonths)
                });

                underscore.extend(instance.data.summary.yearly, {
                    // Interest
                    productionCreditInterest: [calculateYearlyTotal(instance.data.summary.monthly.productionCreditInterest, 1), calculateYearlyTotal(instance.data.summary.monthly.productionCreditInterest, 2)],
                    mediumTermInterest: [calculateYearlyTotal(instance.data.summary.monthly.mediumTermInterest, 1), calculateYearlyTotal(instance.data.summary.monthly.mediumTermInterest, 2)],
                    longTermInterest: [calculateYearlyTotal(instance.data.summary.monthly.longTermInterest, 1), calculateYearlyTotal(instance.data.summary.monthly.longTermInterest, 2)],
                    totalInterest: [calculateYearlyTotal(instance.data.summary.monthly.totalInterest, 1), calculateYearlyTotal(instance.data.summary.monthly.totalInterest, 2)],

                    // Liabilities
                    currentLiabilities: calculateAssetLiabilityGroupTotal(instance, 'liability', 'short-term'),
                    mediumLiabilities: calculateAssetLiabilityGroupTotal(instance, 'liability', 'medium-term'),
                    longLiabilities: calculateAssetLiabilityGroupTotal(instance, 'liability', 'long-term'),
                    totalLiabilities: [calculateEndOfYearValue(instance.data.summary.monthly.totalLiabilities, 1), calculateEndOfYearValue(instance.data.summary.monthly.totalLiabilities, 2)],
                    totalRent: [calculateYearlyTotal(instance.data.summary.monthly.totalRent, 1), calculateYearlyTotal(instance.data.summary.monthly.totalRent, 2)],

                    // Assets
                    currentAssets: calculateAssetLiabilityGroupTotal(instance, 'asset', 'short-term'),
                    movableAssets: calculateAssetLiabilityGroupTotal(instance, 'asset', 'medium-term'),
                    fixedAssets: calculateAssetLiabilityGroupTotal(instance, 'asset', 'long-term'),
                    totalAssets: instance.data.assetStatement.total.yearly.marketValue || Base.initializeArray(numberOfYears),

                    depreciation: instance.data.assetStatement.total.yearly.depreciation || Base.initializeArray(numberOfYears)
                });

                calculateAssetLiabilityGrowth(instance);
            }

            function calculateAssetLiabilityGrowth (instance) {
                var currentWorth = safeMath.minus(instance.data.assetStatement.total.estimatedValue, instance.data.liabilityStatement.total.currentValue),
                    netWorth = safeArrayMath.minus(instance.data.assetStatement.total.yearly.marketValue, instance.data.liabilityStatement.total.yearlyValues);

                underscore.extend(instance.data.summary.yearly, {
                    netWorth: {
                        current: currentWorth,
                        yearly: netWorth
                    },
                    netWorthGrowth: underscore.map(netWorth, function (value, index) {
                        return (index === 0 ? safeMath.minus(value, currentWorth) : safeMath.minus(value, netWorth[index - 1]));
                    })
                });
            }

            /**
             * Primary Account Handling
             */
            function recalculatePrimaryAccount(instance, startMonth, endMonth, numberOfMonths) {
                var numberOfYears = instance.numberOfYears,
                    defaultObject = {
                        opening: 0,
                        inflow: 0,
                        outflow: 0,
                        balance: 0,
                        interestPayable: 0,
                        interestReceivable: 0,
                        closing: 0
                    };

                instance.data.summary.monthly.primaryAccountInterest = Base.initializeArray(numberOfMonths);
                instance.data.summary.monthly.primaryAccountCapital = Base.initializeArray(numberOfMonths);
                instance.data.summary.monthly.primaryAccountLiability = Base.initializeArray(numberOfMonths);

                instance.account.monthly = underscore.chain(underscore.range(numberOfMonths))
                    .map(function () {
                        return underscore.extend({}, defaultObject);
                    })
                    .reduce(function (monthly, month, index) {
                        month.opening = (index === 0 ? instance.account.openingBalance : monthly[monthly.length - 1].closing);
                        month.inflow = instance.data.summary.monthly.cashInflowAfterRepayments[index];
                        month.outflow = instance.data.summary.monthly.cashOutflowAfterRepayments[index];
                        month.balance = safeMath.plus(month.opening, safeMath.minus(month.inflow, month.outflow));
                        month.interestPayable = (month.balance < 0 && instance.account.interestRateDebit ?
                            safeMath.times(Math.abs(month.balance), safeMath.chain(instance.account.interestRateDebit)
                                .dividedBy(100)
                                .dividedBy(12)
                                .toNumber()) : 0);
                        month.interestReceivable = (month.balance > 0 && instance.account.interestRateCredit ?
                            safeMath.times(month.balance, safeMath.chain(instance.account.interestRateCredit)
                                .dividedBy(100)
                                .dividedBy(12)
                                .toNumber()) : 0);
                        month.closing = safeMath.chain(month.balance).minus(month.interestPayable).plus(month.interestReceivable).toNumber();

                        instance.data.summary.monthly.primaryAccountInterest[index] = safeMath.plus(instance.data.summary.monthly.primaryAccountInterest[index], month.interestPayable);
                        instance.data.summary.monthly.primaryAccountCapital[index] = safeMath.plus(instance.data.summary.monthly.primaryAccountCapital[index], Math.abs(Math.max(0, month.closing)));
                        instance.data.summary.monthly.primaryAccountLiability[index] = safeMath.plus(instance.data.summary.monthly.primaryAccountLiability[index], Math.abs(Math.min(0, month.closing)));

                        monthly.push(month);
                        return monthly;
                    }, [])
                    .value();

                instance.account.yearly = underscore.chain(underscore.range(numberOfYears))
                    .map(function () {
                        return underscore.extend({
                            worstBalance: 0,
                            bestBalance: 0,
                            openingMonth: null,
                            closingMonth: null
                        }, defaultObject);
                    })
                    .reduce(function (yearly, year, index) {
                        var months = instance.account.monthly.slice(index * 12, (index + 1) * 12);
                        year.opening = months[0].opening;
                        year.inflow = safeArrayMath.reduceProperty(months, 'inflow');
                        year.outflow = safeArrayMath.reduceProperty(months, 'outflow');
                        year.balance = safeMath.plus(year.opening, safeMath.minus(year.inflow, year.outflow));
                        year.interestPayable = safeArrayMath.reduceProperty(months, 'interestPayable');
                        year.interestReceivable = safeArrayMath.reduceProperty(months, 'interestReceivable');
                        year.closing = safeMath.chain(year.balance).minus(year.interestPayable).plus(year.interestReceivable).toNumber();
                        year.openingMonth = moment(startMonth, 'YYYY-MM-DD').add(index, 'years').format('YYYY-MM-DD');
                        year.closingMonth = moment(startMonth, 'YYYY-MM-DD').add(index, 'years').add(months.length - 1, 'months').format('YYYY-MM-DD');

                        var bestBalance = underscore.max(months, function (month) { return month.closing; }),
                            worstBalance = underscore.min(months, function (month) { return month.closing; });
                        year.bestBalance = {
                            balance: bestBalance.closing,
                            month: moment(year.openingMonth, 'YYYY-MM-DD').add(months.indexOf(bestBalance), 'months').format('YYYY-MM-DD')
                        };
                        year.worstBalance = {
                            balance: worstBalance.closing,
                            month: moment(year.openingMonth, 'YYYY-MM-DD').add(months.indexOf(worstBalance), 'months').format('YYYY-MM-DD')
                        };

                        yearly.push(year);
                        return yearly;
                    }, [])
                    .value();

                instance.data.summary.yearly.primaryAccountInterest = [calculateYearlyTotal(instance.data.summary.monthly.primaryAccountInterest, 1), calculateYearlyTotal(instance.data.summary.monthly.primaryAccountInterest, 2)];
                instance.data.summary.yearly.primaryAccountCapital = [calculateEndOfYearValue(instance.data.summary.monthly.primaryAccountCapital, 1), calculateEndOfYearValue(instance.data.summary.monthly.primaryAccountCapital, 2)];
                instance.data.summary.yearly.primaryAccountLiability = [calculateEndOfYearValue(instance.data.summary.monthly.primaryAccountLiability, 1), calculateEndOfYearValue(instance.data.summary.monthly.primaryAccountLiability, 2)];
            }

            function addPrimaryAccountAssetsLiabilities (instance) {
                // Bank Capital
                instance.data.assetStatement['short-term'] = instance.data.assetStatement['short-term'] || [];
                instance.data.assetStatement['short-term'].push({
                    name: 'Bank Capital',
                    estimatedValue: Math.max(0, instance.account.openingBalance),
                    marketValue: Math.max(0, instance.account.openingBalance),
                    monthly: {
                        marketValue: underscore.map(instance.account.monthly, function (monthly) {
                            return Math.max(0, monthly.closing);
                        }),
                        depreciation: Base.initializeArray(instance.numberOfMonths)
                    },
                    yearly: {
                        marketValue: underscore.map(instance.account.yearly, function (yearly) {
                            return Math.max(0, yearly.closing);
                        }),
                        depreciation: Base.initializeArray(instance.numberOfYears)
                    }
                });

                // Bank Overdraft
                instance.data.liabilityStatement['short-term'] = instance.data.liabilityStatement['short-term'] || [];
                instance.data.liabilityStatement['short-term'].push({
                    name: 'Bank Overdraft',
                    currentValue: Math.abs(Math.min(0, instance.account.openingBalance)),
                    yearlyValues: [instance.data.summary.yearly.primaryAccountLiability[0], instance.data.summary.yearly.primaryAccountLiability[1]]
                });
            }

            /**
             * Ratios
             */
            function recalculateRatios (instance) {
                instance.data.ratios = {
                    interestCover: calculateRatio(instance, 'operatingProfit', 'totalInterest'),
                    inputOutput: calculateRatio(instance, 'productionIncome', ['productionExpenditure', 'productionCreditInterest', 'primaryAccountInterest']),
                    productionCost: calculateRatio(instance, 'productionExpenditure', 'productionIncome'),
                    cashFlowBank: calculateRatio(instance, 'cashInflowAfterRepayments', ['capitalExpenditure', 'unallocatedProductionExpenditure', 'debtRedemption', 'otherExpenditure', 'primaryAccountInterest']),
                    //TODO: add payments to co-ops with crop deliveries to cashFlowFarming denominator
                    cashFlowFarming: calculateRatio(instance, 'totalIncome', ['capitalExpenditure', 'productionExpenditure', 'debtRedemption', 'otherExpenditure', 'primaryAccountInterest']),
                    debtToTurnover: calculateRatio(instance, 'totalLiabilities', ['productionIncome', 'otherIncome']),
                    interestToTurnover: calculateRatio(instance, 'totalInterest', ['productionIncome', 'otherIncome']),
                    //TODO: change denominator to total asset value used for farming
                    returnOnInvestment: calculateRatio(instance, 'operatingProfit', 'totalAssets')
                };

                calculateAssetsLiabilitiesRatios(instance);
                calculateAccountRatios(instance);
            }

            function calculateAccountRatios (instance) {
                var debtRatioYear1 = calculateDebtStageRatio(instance, 0),
                    debtRatioYear2 = calculateDebtStageRatio(instance, 1);

                instance.data.ratios = underscore.extend(instance.data.ratios, {
                    debtMinStage: [debtRatioYear1.min, debtRatioYear2.min],
                    debtMaxStage: [debtRatioYear1.max, debtRatioYear2.max]
                });
            }

            function calculateDebtStageRatio (instance, year) {
                var yearStart = 12 * year,
                    yearEnd = 12 * (year + 1);

                function slice (array) {
                    return array.slice(yearStart, yearEnd);
                }

                var totalAssetsMinusAccountCapital = safeArrayMath.minus(slice(instance.data.summary.monthly.totalAssets), slice(instance.data.summary.monthly.primaryAccountCapital)),
                    minusCapitalIncome = safeArrayMath.minus(totalAssetsMinusAccountCapital, slice(instance.data.summary.monthly.capitalIncome)),
                    plusAccountCapital = safeArrayMath.plus(minusCapitalIncome, slice(instance.data.summary.monthly.primaryAccountCapital)),
                    plusCapitalExpenditure = safeArrayMath.plus(plusAccountCapital, slice(instance.data.summary.monthly.capitalExpenditure)),
                    plusTotalIncome = safeArrayMath.plus(plusCapitalExpenditure, slice(instance.data.summary.monthly.totalIncome)),
                    minusCashInflowAfterRepayments = safeArrayMath.minus(plusTotalIncome, slice(instance.data.summary.monthly.cashInflowAfterRepayments)),
                    totalDebt = slice(instance.data.summary.monthly.totalLiabilities);

                var debtRatio = underscore.map(minusCashInflowAfterRepayments, function (month, index) {
                    return safeMath.dividedBy(totalDebt[index], month);
                });

                return {
                    min: underscore.min(debtRatio),
                    max: underscore.max(debtRatio)
                };
            }

            function calculateAssetsLiabilitiesRatios (instance) {
                var defaultObj = { yearly: [], marketValue: 0, estimatedValue: 0 };

                instance.data.ratios = underscore.extend(instance.data.ratios, {
                    netCapital: defaultObj,
                    gearing: defaultObj,
                    debt: defaultObj
                });

                instance.data.ratios.netCapital = underscore.mapObject(instance.data.ratios.netCapital, function(value, key) {
                    if (underscore.contains(['marketValue', 'estimatedValue'], key)) {
                        return safeMath.dividedBy(instance.data.assetStatement.total[key], instance.data.liabilityStatement.total.currentValue);
                    } else if (key === 'yearly') {
                        return safeArrayMath.dividedBy(instance.data.assetStatement.total.yearly.marketValue, instance.data.liabilityStatement.total.yearlyValues);
                    }
                });

                instance.data.ratios.debt = underscore.mapObject(instance.data.ratios.debt, function(value, key) {
                    if (underscore.contains(['marketValue', 'estimatedValue'], key)) {
                        return safeMath.dividedBy(instance.data.liabilityStatement.total.currentValue, instance.data.assetStatement.total[key]);
                    } else if (key === 'yearly') {
                        return safeArrayMath.dividedBy(instance.data.liabilityStatement.total.yearlyValues, instance.data.assetStatement.total.yearly.marketValue);
                    }
                });

                instance.data.ratios.gearing = underscore.mapObject(instance.data.ratios.gearing, function(value, key) {
                    if (underscore.contains(['marketValue', 'estimatedValue'], key)) {
                        return safeMath.dividedBy(instance.data.liabilityStatement.total.currentValue, safeMath.minus(instance.data.assetStatement.total[key], instance.data.liabilityStatement.total.currentValue));
                    } else if (key === 'yearly') {
                        return safeArrayMath.dividedBy(instance.data.liabilityStatement.total.yearlyValues, safeArrayMath.minus(instance.data.assetStatement.total.yearly.marketValue, instance.data.liabilityStatement.total.yearlyValues));
                    }
                });
            }

            function calculateRatio(instance, numeratorProperties, denominatorProperties) {
                numeratorProperties = (underscore.isArray(numeratorProperties) ? numeratorProperties : [numeratorProperties]);
                denominatorProperties = (underscore.isArray(denominatorProperties) ? denominatorProperties : [denominatorProperties]);

                function sumPropertyValuesForInterval (propertyList, interval) {
                    if (!instance.data.summary[interval]) {
                        return [];
                    }

                    var valueArrays = underscore.chain(propertyList)
                        .map(function(propertyName) {
                            if (propertyName.charAt(0) === '-') {
                                propertyName = propertyName.substr(1);
                                return safeArrayMath.negate(instance.data.summary[interval][propertyName]);
                            }
                            return instance.data.summary[interval][propertyName];
                        })
                        .compact()
                        .value();

                    return underscore.reduce(valueArrays.slice(1), function(result, array) {
                        return safeArrayMath.plus(result, array);
                    }, angular.copy(valueArrays[0]) || []);
                }

                return {
                    monthly: safeArrayMath.dividedBy(sumPropertyValuesForInterval(numeratorProperties, 'monthly'), sumPropertyValuesForInterval(denominatorProperties, 'monthly')),
                    yearly: safeArrayMath.dividedBy(sumPropertyValuesForInterval(numeratorProperties, 'yearly'), sumPropertyValuesForInterval(denominatorProperties, 'yearly'))
                }
            }

            computedProperty(this, 'startDate', function () {
                return this.data.startDate;
            });

            computedProperty(this, 'endDate', function () {
                this.data.endDate = (this.data.startDate ?
                    moment(this.data.startDate).add(2, 'y').format('YYYY-MM-DD') :
                    this.data.endDate);

                return this.data.endDate;
            });

            computedProperty(this, 'account', function () {
                return this.data.account;
            });

            computedProperty(this, 'adjustmentFactors', function () {
                return this.data.adjustmentFactors;
            });

            computedProperty(this, 'numberOfMonths', function () {
                return moment(this.endDate, 'YYYY-MM-DD').diff(moment(this.startDate, 'YYYY-MM-DD'), 'months');
            });

            computedProperty(this, 'numberOfYears', function () {
                return Math.ceil(moment(this.endDate, 'YYYY-MM-DD').diff(moment(this.startDate, 'YYYY-MM-DD'), 'years', true));
            });

            computedProperty(this, 'models', function () {
                return this.data.models;
            });

            privateProperty(this, 'reEvaluate', function() {
                reEvaluateBusinessPlan(this);
            });

            privateProperty(this, 'recalculateAccount', function() {
                recalculatePrimaryAccount(this);
            });

            if (underscore.isEmpty(this.data.models.budgets) && !underscore.isEmpty(this.data.models.productionSchedules))  {
                updateBudgets(this);
            }

            if (this.data.version !== _version) {
                this.updateProductionSchedules(this.data.models.productionSchedules);
                this.updateFinancials(this.data.models.financials);
                this.data.version = _version;
            }
        }

        function updateBudgets (instance) {
            instance.data.models.budgets = underscore.chain(instance.data.models.productionSchedules)
                .pluck('budget')
                .compact()
                .uniq(false, function (budget) {
                    return budget.uuid;
                })
                .value();
        }

        inheritModel(BusinessPlan, Document);

        readOnlyProperty(BusinessPlan, 'incomeExpenseTypes', {
            'capital': 'Capital',
            'production': 'Production',
            'other': 'Other'
        });

        readOnlyProperty(BusinessPlan, 'incomeSubtypes', {
            'other': [
                'Interest, Dividends & Subsidies',
                'Pension Fund',
                'Short-term Insurance Claims',
                'VAT Refund',
                'Inheritance',
                'Shares',
                'Other']
        });

        readOnlyProperty(BusinessPlan, 'expenseSubtypes', {
            'production': [
                'Accident Insurance',
                'Administration',
                'Accounting Fees',
                'Bank Charges',
                'Crop Insurance',
                'Fuel',
                'Electricity',
                'Government Levy',
                'Licenses & Membership Fees',
                'Long term insurance & Policies',
                'Office Costs',
                'Property Rates',
                'Protective Clothing',
                'Rations',
                'Repairs & Maintenance',
                'Staff Salaries & Wages',
                'Security',
                'Short-term Insurance',
                'Unemployment Insurance',
                'Other'],
            'other': [
                'Drawings',
                'Medical',
                'Life insurance',
                'University / School fees',
                'Other']
        });

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
                    to: 'financial resource plan'
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
                length: {
                    min: 1,
                    max: 255
                }
            }
        });

        return BusinessPlan;
    }]);

var sdkModelDesktopValuationDocument = angular.module('ag.sdk.model.desktop-valuation', ['ag.sdk.model.comparable-sale', 'ag.sdk.model.document']);

sdkModelDesktopValuationDocument.factory('DesktopValuation', ['Base', 'ComparableSale', 'computedProperty', 'Document', 'inheritModel', 'privateProperty', 'underscore',
    function (Base, ComparableSale, computedProperty, Document, inheritModel, privateProperty, underscore) {
        function DesktopValuation (attrs) {
            Document.apply(this, arguments);

            this.docType = 'desktop valuation';

            var defaultReportBody = '<div class="tinymce-container pdf-container">' +
                '<h2 id="property-description">Property Description</h2><br/><table id="property-description-table" width="100%"></table><br/>' +
                '<h2 id="farmland-value">Estimated Farmland Value</h2><br/><div id="farmland-value-table"></div><br/>' +
                '<h2 id="regional-value">Regional Value Development</h2><br/><div id="regional-value-graph"></div><br/>' +
                '<h2 id="comparable-sales">Comparable Sales</h2><table id="comparable-sales-table" width="100%"></table><br/>' +
                '<h2 id="disclaimer">Disclaimer</h2><p>Estimates of farmland and property value is based on the aggregation of regional sales data and assumptions regarding the property being valued.</p><br/><br/>' +
                '</div>';

            Base.initializeObject(this.data, 'attachments', []);
            Base.initializeObject(this.data, 'request', {});
            Base.initializeObject(this.data, 'report', {});

            Base.initializeObject(this.data.request, 'farmland', []);

            Base.initializeObject(this.data.report, 'body', defaultReportBody);
            Base.initializeObject(this.data.report, 'comparableSales', []);
            Base.initializeObject(this.data.report, 'improvements', []);
            Base.initializeObject(this.data.report, 'improvementsValue', {});
            Base.initializeObject(this.data.report, 'landUseComponents', {});
            Base.initializeObject(this.data.report, 'landUseValue', {});
            Base.initializeObject(this.data.report, 'summary', {});

            /**
             * Legal Entity handling
             */
            privateProperty(this, 'setLegalEntity', function (entity) {
                this.data.request.legalEntity = underscore.omit(entity, ['assets', 'farms', 'liabilities']);
            });

            /**
             * Attachment handling
             */
            privateProperty(this, 'addAttachment', function (attachment) {
                this.removeAttachment(attachment);

                this.data.attachments.push(attachment);
            });

            privateProperty(this, 'removeAttachment', function (attachment) {
                this.data.attachments = underscore.reject(this.data.attachments, function (item) {
                    return item.key === attachment.key;
                });
            });

            /**
             * Farmland handling
             */
            privateProperty(this, 'getFarmland', function () {
                return this.data.request.farmland;
            });

            privateProperty(this, 'hasFarmland', function (farmland) {
                return underscore.some(this.data.request.farmland, function (asset) {
                    return asset.assetKey === farmland.assetKey;
                });
            });

            privateProperty(this, 'addFarmland', function (farmland) {
                this.removeFarmland(farmland);

                this.data.request.farmland.push(farmland);
            });

            privateProperty(this, 'removeFarmland', function (farmland) {
                this.data.request.farmland = underscore.reject(this.data.request.farmland, function (asset) {
                    return asset.assetKey === farmland.assetKey;
                });
            });

            privateProperty(this, 'getFarmlandSummary', function () {
                return underscore.chain(this.data.request.farmland)
                    .groupBy(function (farmland) {
                        return (farmland.data.farmLabel ? farmland.data.farmLabel :
                            (farmland.data.officialFarmName ? underscore.titleize(farmland.data.officialFarmName) : 'Unknown'));
                    })
                    .mapObject(function (farmGroup) {
                        return {
                            portionList: (underscore.size(farmGroup) > 1 ? underscore.chain(farmGroup)
                                .map(function (farmland) {
                                    return (farmland.data.portionNumber ? farmland.data.portionNumber : farmland.data.portionLabel);
                                })
                                .sort()
                                .toSentence()
                                .value() : underscore.first(farmGroup).data.portionLabel),
                            town: underscore.chain(farmGroup)
                                .map(function (farmland) {
                                    return (farmland.data.town ? underscore.titleize(farmland.data.town) : '');
                                })
                                .first()
                                .value(),
                            province: underscore.chain(farmGroup)
                                .map(function (farmland) {
                                    return (farmland.data.province ? underscore.titleize(farmland.data.province) : '');
                                })
                                .first()
                                .value(),
                            area: underscore.reduce(farmGroup, function (total, farmland) {
                                return total + (farmland.data.area || 0);
                            }, 0)
                        }
                    })
                    .value();
            });

            /**
             * Comparable Handling
             */
            privateProperty(this, 'addComparableSale', function (comparableSale) {
                var _this = this;

                comparableSale = ComparableSale.new(comparableSale);

                _this.removeComparableSale(comparableSale);

                _this.data.report.comparableSales.push(comparableSale.asJSON());

                underscore.each(comparableSale.attachments, function (attachment) {
                    _this.addAttachment(attachment);
                });
            });

            privateProperty(this, 'removeComparableSale', function (comparableSale) {
                var _this = this;

                _this.data.report.comparableSales = underscore.reject(_this.data.report.comparableSales, function (comparable) {
                    return comparable.uuid === comparableSale.uuid;
                });

                underscore.each(comparableSale.attachments, function (attachment) {
                    _this.removeAttachment(attachment);
                });
            });
        }

        inheritModel(DesktopValuation, Document);

        DesktopValuation.validates({
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
                    to: 'desktop valuation'
                }
            },
            organizationId: {
                required: true,
                numeric: true
            }
        });

        return DesktopValuation;
    }]);

var sdkModelDocument = angular.module('ag.sdk.model.document', ['ag.sdk.library', 'ag.sdk.model.base']);

sdkModelDocument.factory('Document', ['inheritModel', 'Model', 'privateProperty', 'readOnlyProperty', 'underscore',
    function (inheritModel, Model, privateProperty, readOnlyProperty, underscore) {
        function Document (attrs, organization) {
            Model.Base.apply(this, arguments);

            this.data = (attrs && attrs.data) || {};

            privateProperty(this, 'updateRegister', function (organization) {
                this.organization = organization;
                this.organizationId = organization.id;
                this.data = underscore.extend(this.data, {
                    farmer: underscore.omit(organization, ['activeFlags', 'farms', 'legalEntities', 'primaryContact', 'teams']),
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
            this.id = attrs.id || attrs.$id;
            this.organization = attrs.organization;
            this.organizationId = attrs.organizationId;
            this.originUuid = attrs.originUuid;
            this.origin = attrs.origin;
            this.title = attrs.title;
        }

        inheritModel(Document, Model.Base);

        readOnlyProperty(Document, 'docTypes', {
            'asset register': 'Asset Register',
            'desktop valuation': 'Desktop Valuation',
            'emergence report': 'Emergence Report',
            'farm valuation': 'Farm Valuation',
            'financial resource plan': 'Financial Resource Plan',
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

var sdkModelOrganization = angular.module('ag.sdk.model.organization', ['ag.sdk.library', 'ag.sdk.model.base']);

sdkModelOrganization.factory('Organization', ['Base', 'inheritModel', 'Model', 'privateProperty', 'topologyHelper', 'underscore',
    function (Base, inheritModel, Model, privateProperty, topologyHelper, underscore) {
        function Organization (attrs) {
            Model.Base.apply(this, arguments);

            // Geom
            privateProperty(this, 'contains', function (geojson) {
                return contains(this, geojson);
            });

            privateProperty(this, 'centroid', function () {
                return centroid(this);
            });

            this.data = (attrs && attrs.data) || {};
            Base.initializeObject(this.data, 'attachments', []);
            Base.initializeObject(this.data, 'baseStyles', {});

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.id = attrs.id || attrs.$id;
            this.email = attrs.email;
            this.hostUrl = attrs.hostUrl;
            this.name = attrs.name;
            this.registered = attrs.registered;
            this.services = attrs.services;
            this.status = attrs.status;
            this.uuid = attrs.uuid;
        }

        inheritModel(Organization, Model.Base);

        function getAssetsGeom (instance) {
            return underscore.chain(instance.legalEntities)
                .pluck('assets')
                .flatten().compact()
                .filter(function (asset) {
                    return asset.data && asset.data.loc;
                })
                .reduce(function (geom, asset) {
                    var assetGeom = topologyHelper.readGeoJSON(asset.data.loc);

                    return (geom && assetGeom.isValid() ? geom.union(assetGeom) : geom || assetGeom);
                }, null)
                .value();
        }

        function contains (instance, geojson) {
            var farmGeom = getAssetsGeom(instance),
                queryGeom = topologyHelper.readGeoJSON(geojson);

            return (farmGeom && queryGeom ? farmGeom.contains(queryGeom) : false);
        }

        function centroid (instance) {
            var geom = getAssetsGeom(instance);

            return (geom ? topologyHelper.writeGeoJSON(geom.getCentroid()) : geom);
        }

        privateProperty(Organization, 'contains', function (instance, geojson) {
            return contains(instance, geojson);
        });

        privateProperty(Organization, 'centroid', function (instance) {
            return centroid(instance);
        });

        Organization.validates({
            email: {
                required: true,
                format: {
                    email: true
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
            }
        });

        return Organization;
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
var sdkModelStore = angular.module('ag.sdk.model.store', ['ag.sdk.library', 'ag.sdk.model.base']);

sdkModelStore.factory('Storable', ['computedProperty', 'privateProperty',
    function (computedProperty, privateProperty) {
        function Storable () {
            var _storable = {};

            privateProperty(_storable, 'set', function (inst, attrs) {
                if (attrs) {
                    inst.$complete = attrs.$complete === true;
                    inst.$dirty = attrs.$dirty === true;
                    inst.$id = attrs.$id;
                    inst.$local = attrs.$local === true;
                    inst.$saved = attrs.$saved === true;
                    inst.$uri = attrs.$uri;
                }
            });

            privateProperty(this, 'storable', function (attrs) {
                _storable.set(this, attrs);
            });
        }

        return Storable;
    }]);
var sdkModelValidation = angular.module('ag.sdk.model.validation', ['ag.sdk.library', 'ag.sdk.model.base', 'ag.sdk.model.validators']);

sdkModelValidation.factory('Validatable', ['computedProperty', 'privateProperty', 'underscore', 'Validatable.Field',
    'Validator.dateRange',
    'Validator.equal',
    'Validator.format',
    'Validator.inclusion',
    'Validator.inclusion.in',
    'Validator.length',
    'Validator.object',
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
            if (underscore.isFunction(options.message)) {
                return options.message.apply(options);
            }

            return options.message;
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
                if (typeof options != 'object' || underscore.isArray(options)) {
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
sdkModelValidators.factory('Validator.inclusion', ['underscore', 'Validatable.Validator', 'Validator.inclusion.in',
    function (underscore, Validator, inclusionIn) {
        function inclusion (value, instance, field) {}

        inclusion.message = function () {
            return 'Must have an included value';
        };

        inclusion.options = {
            in: inclusionIn
        };

        return new Validator(inclusion);
    }]);

sdkModelValidators.factory('Validator.inclusion.in', ['underscore', 'Validatable.Validator',
    function (underscore, Validator) {
        function inclusionIn (value, instance, field) {
            var _in = (typeof this.value == 'function' ? this.value(value, instance, field) : this.value);

            if (underscore.isUndefined(value) || underscore.isNull(value)) {
                return true;
            }

            return (_in.length == 0 ? true : underscore.some(_in, function (item) {
                return value === item;
            }));
        }

        inclusionIn.message = function () {
            return 'Must be in array of values';
        };

        return new Validator(inclusionIn);
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
        length.options = {};

        if (min) length.options.min = min;
        if (max) length.options.max = max;

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
            return 'Length must be at least ' + this.min;
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
            return 'Length must be at most ' + this.max;
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

sdkModelValidators.factory('Validator.object', ['underscore', 'Validatable.Validator',
    function (underscore, Validator) {
        function object (value, instance, field) {
            if (underscore.isUndefined(value) || underscore.isNull(value)) {
                return true;
            }

            return (typeof value == 'object');
        }

        object.message = function () {
            return 'Must be an object';
        };

        return new Validator(object);
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
            if (!this.required) {
                return true;
            }

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
            if (!this.value(value, instance, field)) {
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

        requiredIf.message = 'Is a required field';

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
    'ag.sdk.helper.task',
    'ag.sdk.helper.team',
    'ag.sdk.helper.user'
]);

angular.module('ag.sdk.interface', [
    'ag.sdk.interface.geocledian',
    'ag.sdk.interface.ui',
    'ag.sdk.interface.list',
    'ag.sdk.interface.map',
    'ag.sdk.interface.navigation'
]);

angular.module('ag.sdk.model', [
    'ag.sdk.model.asset',
    'ag.sdk.model.base',
    'ag.sdk.model.business-plan',
    'ag.sdk.model.comparable-sale',
    'ag.sdk.model.desktop-valuation',
    'ag.sdk.model.document',
    'ag.sdk.model.enterprise-budget',
    'ag.sdk.model.farm',
    'ag.sdk.model.farm-valuation',
    'ag.sdk.model.field',
    'ag.sdk.model.financial',
    'ag.sdk.model.layer',
    'ag.sdk.model.legal-entity',
    'ag.sdk.model.liability',
    'ag.sdk.model.livestock',
    'ag.sdk.model.map-theme',
    'ag.sdk.model.organization',
    'ag.sdk.model.production-schedule',
    'ag.sdk.model.errors',
    'ag.sdk.model.stock',
    'ag.sdk.model.store',
    'ag.sdk.model.validation',
    'ag.sdk.model.validators'
]);

angular.module('ag.sdk.test', [
    'ag.sdk.test.data'
]);

angular.module('ag.mobile-sdk.cordova', [
    'ag.mobile-sdk.cordova.camera',
    'ag.mobile-sdk.cordova.connection',
    'ag.mobile-sdk.cordova.geolocation',
    'ag.mobile-sdk.cordova.map',
    'ag.mobile-sdk.cordova.storage',
    'ag.mobile-sdk.cordova.toaster'
]);

angular.module('ag.mobile-sdk', [
    'ag.sdk.authorization',
    'ag.sdk.id',
    'ag.sdk.geospatial',
    'ag.sdk.utilities',
    'ag.sdk.model',
    'ag.sdk.monitor',
    'ag.sdk.interface.map',
    'ag.sdk.helper',
    'ag.sdk.library',
    'ag.sdk.test',
    'ag.mobile-sdk.cordova',
    'ag.mobile-sdk.helper',
    'ag.mobile-sdk.api',
    'ag.mobile-sdk.data',
    'ag.mobile-sdk.hydration'
]);
