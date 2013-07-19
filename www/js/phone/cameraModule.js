'use strict';

define(['cordova', 'angular'], function () {
    var module = angular.module('cameraModule', []);

    module.factory('cameraService', ['promiseService', function (promiseService) {
        var _pictureSourceTypes = navigator.camera.PictureSourceType;
        var _destinationTypes = navigator.camera.DestinationType;

        return {
            getPictureSourceTypes: _pictureSourceTypes,

            capture: function(quality) {
                var defer = promiseService.defer();

                if(typeof quality === 'undefined') quality = 50;

                navigator.camera.getPicture(function(data) {
                    promiseService.resolve(defer, data);
                }, function(err) {
                    promiseService.reject(defer, err);
                }, {
                    quality: quality,
                    destinationType: _destinationTypes.DATA_URL
                });

                return defer.promise;
            },
            captureAndEdit: function(quality) {
                var defer = promiseService.defer();

                if(typeof quality === 'undefined') quality = 50;

                navigator.camera.getPicture(function(data) {
                    promiseService.resolve(defer, data);
                }, function(err) {
                    promiseService.reject(defer, err);
                }, {
                    quality: quality,
                    allowEdit: true,
                    destinationType: _destinationTypes.DATA_URL
                });

                return defer.promise;
            },
            retrieve: function(quality) {
                var defer = promiseService.defer();

                navigator.camera.getPicture(function(data) {
                    promiseService.resolve(defer, data);
                }, function(err) {
                    promiseService.reject(defer, err);
                }, {
                    quality: quality,
                    destinationType: _destinationTypes.FILE_URI,
                    source: source
                });

                return defer.promise;
            }
        };
    }]);
});
