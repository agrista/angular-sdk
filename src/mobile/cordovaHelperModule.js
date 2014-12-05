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
