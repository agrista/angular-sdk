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
