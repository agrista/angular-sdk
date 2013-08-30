'use strict';

define(['underscore', 'cordova', 'angular'], function (_) {
    var module = angular.module('cameraModule', []);

    /**
     * @name cameraModule.cameraService
     * @requires $q
     * @description Creates a AngularJS service to provide camera data
     * @example

     cameraService.capture(50).then(function (res) {
            console.log('Photo taken');
        }, function (err) {
            console.log(err);
        });

     */
    module.factory('cameraService', ['$q', '$rootScope', function ($q, $rootScope) {
        if (typeof window.Camera === 'undefined') {
            window.Camera = {};
        }

        var _pictureSourceTypes = Camera.PictureSourceType;
        var _destinationTypes = Camera.DestinationType;
        var _encodingTypes = Camera.EncodingType;

        function _safeApply(scope, fn) {
            (scope.$$phase || scope.$root.$$phase) ? fn() : scope.$apply(fn);
        }

        function _makeRequest(options) {
            var defer = $q.defer();

            if (navigator.camera !== undefined) {
                navigator.camera.getPicture(function (data) {
                    _safeApply($rootScope, function() {
                        defer.resolve(data);
                    });
                }, function (err) {
                    _safeApply($rootScope, function() {
                        defer.reject(err);
                    });
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

                return _makeRequest(_.defaults(options, {
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

                return _makeRequest(_.defaults(options, {
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

                return _makeRequest(_.defaults(options, {
                    quality: 50,
                    destinationType: _destinationTypes.FILE_URI,
                    source: _pictureSourceTypes.PHOTOLIBRARY
                }));
            }
        };
    }]);
});
