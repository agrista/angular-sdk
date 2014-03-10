var cordovaGeolocationApp = angular.module('ag.mobile-sdk.cordova.geolocation', ['ag.sdk.core.utilities']);

/**
 * @name cordovaGeolocationApp.geolocationService
 * @requires promiseService
 * @description Creates a AngularJS service to provide geolocation data
 * @example

 function onLocation(res) {
            console.log('Success: geolocationService.watchPosition');
            console.log(res);
        }

 function onError(err) {
            console.log('Error: geolocationService.watchPosition');
            console.log(err);
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
        switch (code, msg) {
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
