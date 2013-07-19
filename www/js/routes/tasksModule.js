'use strict';

define(['app'], function (app) {
    app.lazyLoader.controller('TasksController', ['$scope', 'navigationService', function($scope, navigationService) {
        $scope.navbar = {
            title: 'Task',
            navigateLeft: function() {
                navigationService.go('/activities', 'slide', true);
            },
            navigateRight: function() {
                navigationService.go('/activities', 'modal', true);
            }
        }
    }]);
});
