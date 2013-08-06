'use strict';

define(['app', 'phone/cameraModule'], function (app) {
    app.lazyLoader.controller('TasksController', ['$scope', 'navigationService', 'cameraService',
        function ($scope, navigationService, cameraService) {
            $scope.navbar = {
                title: 'Task',
                navigateLeft: function () {
                    navigationService.go('/', 'slide', true);
                },
                takePhoto: function () {
                    cameraService.capture({quality: 50}).then(function (res) {
                        console.log('Photo taken');
                    }, function (res) {
                        console.log(res);
                    });
                }
            }
        }]);
});
