'use strict';

define(['app'], function (app) {
    app.lazyLoader.controller('CustomerListController', ['$scope', 'navigationService', 'authorization', 'dataStore',
        function ($scope, navigationService, authorization, dataStore) {
            $scope.navbar = {
                title: 'Customers',
                leftButton: {icon: 'align-justify'},
                rightButton: {icon: 'refresh'},
                syncData: _readFromStore
            }

            navigationService.menu([
                {
                    title: 'Customers',
                    click: function () {
                        navigationService.go('/customers', 'slide', true);
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
                        navigationService.go('/login', 'slide');
                    }
                }
            ]);


            var customersStore = dataStore('customers', {
                api: {
                    template: 'customers'
                }
            }, _readFromStore);

            function _readFromStore() {
                customersStore.read(function (res, err) {
                    if (res) {
                        $scope.customers = res;
                    }

                    if (!$scope.$$phase) $scope.$apply();
                });
            };

            $scope.syncData = function() {

            };

            $scope.showCustomer = function (id) {
                navigationService.go('/customer/' + id, 'slide');
            };
        }]);


    app.lazyLoader.controller('CustomerDetailController', ['$scope', '$routeParams', 'navigationService', 'dataStore',
        function ($scope, $routeParams, navigationService, dataStore) {
            $scope.navbar = {
                title: 'Customer',
                leftButton: {icon: 'chevron-left'},
                navigateLeft: function () {
                    navigationService.go('/customers', 'slide', true);
                },
                rightButton: {icon: 'edit', title: 'Edit'},
                navigateRight: function() {
                    if($scope.mode == 'edit') {
                        $scope.mode = 'view';
                        $scope.navbar.rightButton = {
                            icon: 'edit',
                            title: 'Edit'
                        };

                        $scope.customer.update();
                    } else {
                        $scope.mode = 'edit';
                        $scope.navbar.rightButton = {
                            icon: 'check',
                            title: 'Done'
                        };
                    }
                }
            };

            $scope.mode = 'view';

            var customerStore = dataStore('customer', {
                api: {
                    template: 'customer/:id',
                    schema: {id: '@id'}
                }
            }, function () {
                customerStore.read({id: $routeParams.id}, function (res, err) {
                    if (res) {
                        $scope.customer = res[0];
                    }

                    if (!$scope.$$phase) $scope.$apply();
                });
            });

        }]);

    app.lazyLoader.filter('checkmark', function() {
        return function(input) {
            return input === true ? '\u2713' : '\u2718';
        };
    });

    app.lazyLoader.filter('progress', function() {
        return function(input) {
            var completeCount = 0;

            for(var i = 0; i < input.length; i++) {
                if(input[i].complete) completeCount++;
            }

            return (completeCount / input.length) * 100;
        };
    });

});
