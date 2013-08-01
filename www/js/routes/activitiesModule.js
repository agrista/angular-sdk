'use strict';

define(['app'], function (app) {
    app.lazyLoader.controller('ActivitiesController', ['$scope', 'navigationService', 'dataStore', function($scope, navigationService, dataStore) {

        function _readData() {
            testStore.read({id: '000000'}, {limit: 50}, function (res, err) {

                if (res) {
                    $scope.items = res;

                    if(!$scope.$$phase) $scope.$apply();
                }
            });
        }

        var testStore = dataStore('test', {
            api: {
                template: 'test/:id',
                schema: {id: '@id'}
            }
        }, _readData);

        $scope.addItem = function(itemData) {
            $scope.items.push(testStore.create({name: itemData}, {id: '000000'}));
        }

        $scope.showItem = function(id) {
            navigationService.go('/tasks', 'modal');
        }

        // Navigation
        $scope.navbar = {
            title: 'Activities',

            navigateRight: function() {
                _readData();
            }
        };
    }]);
});
