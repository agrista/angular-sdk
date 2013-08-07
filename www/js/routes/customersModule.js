'use strict';

define(['app'], function (app) {
    app.lazyLoader.controller('CustomerListController', ['$scope', 'navigationService', 'authorization', 'dataStore',
        function ($scope, navigationService, authorization, dataStore) {
            $scope.navbar = {
                title: 'Customers'
            }

            navigationService.menu([
                {
                    title: 'Customers',
                    click: function () {
                        navigationService.go('/', 'slide', true);
                    }
                },
                {
                    title: 'Settings',
                    click: function () {
                        navigationService.go('/settings', 'modal');
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


            var customersStore = dataStore('customers', {
                api: {
                    template: 'customers'
                }
            }, function () {
                customersStore.read(function (res, err) {
                    if (res) {
                        $scope.customers = res;
                    }

                    if (!$scope.$$phase) $scope.$apply();
                });
            });

            $scope.syncData = function() {

            };

            $scope.showCustomer = function (id) {
                navigationService.go('/customer/' + id, 'slide');
            };

        }]);

    app.lazyLoader.controller('CustomerDetailController', ['$scope', 'navigationService',
        function ($scope, navigationService) {
            $scope.navbar = {
                title: 'Customer'
            };
        }]);
});
