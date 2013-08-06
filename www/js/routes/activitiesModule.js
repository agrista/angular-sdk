'use strict';

define(['app'], function (app) {
    app.lazyLoader.controller('ActivitiesController', ['$scope', 'authorization', 'navigationService', 'dataStore',
        function ($scope, authorization, navigationService, dataStore) {

            $scope.items = [
                {
                    id: 0,
                    name: 'Bob'
                },
                {
                    id: 0,
                    name: 'Bob'
                },
                {
                    id: 0,
                    name: 'Bob'
                },
                {
                    id: 0,
                    name: 'Bob'
                },
                {
                    id: 0,
                    name: 'Bob'
                },
                {
                    id: 0,
                    name: 'Bob'
                },
                {
                    id: 0,
                    name: 'Bob'
                },
                {
                    id: 0,
                    name: 'Bob'
                },
                {
                    id: 0,
                    name: 'Bob'
                },
                {
                    id: 0,
                    name: 'Bob'
                }
            ]

            function _readData() {
                testStore.read({id: '5182833c44e28913bea4619f'}, {limit: 50}, function (res, err) {

                    if (res) {
                        $scope.items = res;

                        if (!$scope.$$phase) $scope.$apply();
                    }
                });
            }

            var testStore = dataStore('farm-valuations', {
                api: {
                    template: 'farm-valuations/:id',
                    schema: {id: '@id'}
                }
            }, _readData);

            $scope.addItem = function (itemData) {
                $scope.items.push(testStore.create({name: itemData}, {id: '000000'}));
            }

            $scope.showItem = function (id) {
                navigationService.go('/tasks', 'modal');
            }

            // Navigation
            $scope.navbar = {
                title: 'Activities',

                navigateRight: function () {
                    navigationService.go('/tasks', 'slide');
                    //_readData();
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
        }]);
});
