'use strict';

define(['app'], function (app) {
    app.lazyLoader.controller('TasksController', ['$scope', 'navigationService', 'cameraService', function($scope, navigationService, cameraService) {
        $scope.navbar = {
            title: 'Task',
            navigateLeft: function() {
                navigationService.go('/activities', 'slide', true);
            },
            takePhoto: function() {
                cameraService.capture(50).then(function(res) {
                    console.log('Photo taken');
                }, function(res) {
                    console.log(res);
                });

            }
        }
    }]);
});
