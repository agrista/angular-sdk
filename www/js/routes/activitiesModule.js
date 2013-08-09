'use strict';

define(['app'], function (app) {
    app.lazyLoader.controller('ActivitiesController', ['$scope', 'authorization', 'navigationService', 'testService',
        function ($scope, authorization, navigationService, testService) {

            // Navigation
            $scope.navbar = {
                title: 'Activities',
                leftButton: {icon: 'align-justify'},
                rightButton: {icon: 'refresh', title: 'Sync'},
                navigateRight: function () {
                    testService.sync('000000', _handleData);
                }
            };

            navigationService.menu([
                {
                    title: 'Navigation Item 1',
                    click: function () {
                        navigationService.go('/tasks', 'modal');
                    }
                },
                {
                    title: 'Logout',
                    click: function () {
                        authorization.logout();
                        navigationService.go('/', 'slide');
                    }
                }
            ]);

            var _handleData = function(res, err) {
                $scope.items = res;

                if(!$scope.$$phase) $scope.$apply();
            };

            testService.get('000000', _handleData);

            $scope.addItem = function(name) {
                testService.add('000000', {name: name}, function(item) {
                    $scope.items.splice(0, 0, item);
                });
            };

            $scope.updateItem = function(item) {
                console.log(item);
                testService.set(item);
            };

            $scope.showItem = function (id) {
                navigationService.go('/tasks', 'modal');
            }
        }]);
});
