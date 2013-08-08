'use strict';

define(['app'], function (app) {
    app.lazyLoader.controller('ActivitiesController', ['$scope', 'authorization', 'navigationService', 'dataStore',
        function ($scope, authorization, navigationService, dataStore) {
            $scope.items = [
                {name: ''},
                {name: ''},
                {name: ''},
                {name: ''},
                {name: ''},
                {name: ''},
                {name: ''},
                {name: ''},
                {name: ''},
                {name: ''},
                {name: ''},
                {name: ''},
                {name: ''},
                {name: ''},
                {name: ''},
                {name: ''},
                {name: ''},
                {name: ''},
                {name: ''},
                {name: ''},
                {name: ''},
                {name: ''},
                {name: ''},
                {name: ''}
            ];

            // Navigation
            $scope.navbar = {
                title: 'Activities',
                leftButton: {icon: 'align-justify'},
                rightButton: {icon: 'refresh', title: 'Sync'},
                navigateRight: function () {
                    navigationService.go('/tasks', 'slide');
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

            /*var testStore = dataStore('farm-valuations', {
                api: {
                    template: 'farm-valuations/:id',
                    schema: {id: '@id'}
                }
            }, _readData);*/

            function _readData() {
                testStore.read({id: '5182833c44e28913bea4619f'}, {limit: 50}, function (res, err) {

                    if (res) {
                        $scope.items = res;

                        if (!$scope.$$phase) $scope.$apply();
                    }
                });
            }

            $scope.showItem = function (id) {
                navigationService.go('/tasks', 'modal');
            }
        }]);
});
