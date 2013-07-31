'use strict';

define(['app'], function (app) {
    app.lazyLoader.controller('ActivitiesController', ['$scope', 'navigationService', 'dataStore', function($scope, navigationService, dataStore) {

        var testStore = dataStore('test', {
            api: {
                template: 'test/:id',
                schema: {id: '@id'}
            }
        }, function () {
            testStore.read({id: '000000'}, {limit: 50}, function (res, err) {

                if (res) {
                    $scope.items = res;

                    if(!$scope.$$phase) $scope.$apply();
                }
            });
        });

        $scope.addItem = function(itemData) {
            $scope.items.push(testStore.create({name: itemData}, {id: '000000'}));
        }

        // Navigation
        $scope.navbar = {
            title: 'Activities',

            navigateRight: function() {
                navigationService.go('/tasks', 'slide');
            }
        };

        $scope.showItem = function(id) {
            navigationService.go('/tasks', 'modal');
        };
    }]);
});
