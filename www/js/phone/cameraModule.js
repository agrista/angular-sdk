'use strict';

define(['app', 'underscore', 'cordova'], function (app, _) {
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
    app.lazyLoader.factory('cameraService', ['$q', function ($q) {
        var _pictureSourceTypes = Camera.PictureSourceType;
        var _destinationTypes = Camera.DestinationType;
        var _encodingTypes = Camera.EncodingType;

        function _makeRequest(options) {
            var defer = $q.defer();

            navigator.camera.getPicture(function (data) {
                defer.resolve(data);
            }, function (err) {
                defer.reject(err);
            }, options);

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
                return _makeRequest(_.defaults((options || {}), {
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
                return _makeRequest(_.defaults((options || {}), {
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
                return _makeRequest(_.defaults((options || {}), {
                    quality: 50,
                    destinationType: _destinationTypes.FILE_URI,
                    source: _pictureSourceTypes.PHOTOLIBRARY
                }));
            }
        };
    }]);
});
