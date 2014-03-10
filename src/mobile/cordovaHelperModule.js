var cordovaHelperApp = angular.module('ag.mobile-sdk.helper', ['ag.sdk.core.utilities', 'ag.mobile-sdk.cordova.geolocation', 'ag.mobile-sdk.cordova.camera']);

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