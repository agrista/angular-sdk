'use strict';

define(['app', 'core/mapboxModule'], function (app) {
    app.lazyLoader.controller('CustomerListController', ['$scope', 'navigationService', 'authorization', 'customersService',
        function ($scope, navigationService, authorization, customersService) {
            // Data service
            var _handleData = function (res, err) {
                $scope.customers = res;

                if (!$scope.$$phase) $scope.$apply();
            };

            customersService.getCustomers(_handleData);

            // Navigation
            $scope.navbar = {
                title: 'Customers',
                leftButton: {icon: 'align-justify'},
                rightButton: {icon: 'refresh'},
                syncData: function () {
                    customersService.syncCustomers(_handleData);
                }
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

            $scope.showCustomer = function (id) {
                navigationService.go('/customer/' + id, 'slide');
            };
        }]);


    app.lazyLoader.controller('CustomerDetailController', ['$scope', '$routeParams', 'navigationService', 'farmerService', 'mapboxService',
        function ($scope, $routeParams, navigationService, farmerService, mapboxService) {
            // Data service
            var _handleData = function (res, err) {
                if (res) {
                    $scope.farmer = res;

                    $scope.navbar.title = $scope.farmer.data.farmer_name;

                    mapboxService.addPolygon('');

                }

                if (!$scope.$$phase) $scope.$apply();
            };

            farmerService.getFarmer($routeParams.id, _handleData);

            // Navigation
            $scope.navbar = {
                title: 'Customer',
                leftButton: {icon: 'chevron-left'},
                navigateLeft: function () {
                    navigationService.go('/customers', 'slide', true);
                },
                rightButton: {icon: 'edit', title: 'Edit'},
                navigateRight: function () {
                    if ($scope.mode == 'edit') {
                        $scope.mode = 'view';
                        $scope.navbar.rightButton = {
                            icon: 'edit',
                            title: 'Edit'
                        };

                        farmerService.updateFarmer($scope.farmer, function () {
                            farmerService.syncFarmer($routeParams.id);
                        });

                    } else {
                        $scope.mode = 'edit';
                        $scope.navbar.rightButton = {
                            icon: 'check',
                            title: 'Done'
                        };
                    }
                }
            };

            // Toolbar
            $scope.toolbar = 'profile';

            $scope.setToolbar = function (name) {
                $scope.toolbar = name;
            };

            // Editing
            $scope.mode = 'view';

            $scope.typeOptions = ['Smallholder', 'Commercial', 'Cooperative', 'Corporate'];

            $scope.addEnterprise = function () {
                navigationService.go('/customer/' + $routeParams.id + '/enterprises', 'modal');
            };

            $scope.deleteEnterprise = function (idx) {
                $scope.farmer.data.enterprises.splice(idx, 1);
            };

        }]);

    app.lazyLoader.controller('CustomerEnterpriseController', ['$scope', '$routeParams', 'navigationService', 'dataStore',
        function ($scope, $routeParams, navigationService, dataStore) {
            $scope.navbar = {
                title: 'Add Enterprise',
                leftButton: {icon: 'chevron-left'},
                navigateLeft: function () {
                    navigationService.go('/customer/' + $routeParams.id, 'modal', true);
                },
                rightButton: {icon: 'check', title: 'Done'},
                navigateRight: function () {
                    for (var key in $scope.enterprises) {
                        if ($scope.enterprises[key]) {
                            var indexes = key.split('_');
                            var enterprise = $scope.enterpriseTypes[indexes[0]].commodities[indexes[1]];
                            console.log(enterprise);
                            if ($scope.customer.data.enterprises.indexOf(enterprise) == -1) {
                                $scope.customer.data.enterprises.push(enterprise);
                            }
                        }
                    }
                    $scope.customer.update();
                    navigationService.go('/customer/' + $routeParams.id, 'modal', true);
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

            $scope.enterpriseTypes = [
                {
                    label: "Field Crops",
                    commodities: ['Barley', 'Cabbage', 'Canola', 'Chicory', 'Citrus (Hardpeel)', 'Cotton', 'Cow Peas', 'Dry Bean', 'Dry Grapes', 'Dry Peas', 'Garlic', 'Grain Sorghum', 'Green Bean', 'Ground Nut', 'Hybrid Maize Seed', 'Lentils', 'Lucerne', 'Maize (Fodder)', 'Maize (Green)', 'Maize (Seed)', 'Maize (White)', 'Maize (Yellow)', 'Oats', 'Onion', 'Onion (Seed)', 'Popcorn', 'Potato', 'Pumpkin', 'Rye', 'Soya Bean', 'Sugar Cane', 'Sunflower', 'Sweetcorn', 'Tobacco', 'Tobacco (Oven dry)', 'Tomatoes', 'Watermelon', 'Wheat']
                },
                {
                    label: "Horticulture",
                    commodities: ['Almonds', 'Apples', 'Apricots', 'Avo', 'Avocado', 'Bananas', 'Cherries', 'Chilli', 'Citrus (Hardpeel Class 1)', 'Citrus (Softpeel)', 'Coffee', 'Figs', 'Grapes (Table)', 'Grapes (Wine)', 'Guavas', 'Hops', 'Kiwi Fruit', 'Lemons', 'Macadamia Nut', 'Mango', 'Mangos', 'Melons', 'Nectarines', 'Olives', 'Oranges', 'Papaya', 'Peaches', 'Peanut', 'Pears', 'Pecan Nuts', 'Persimmons', 'Pineapples', 'Pistachio Nuts', 'Plums', 'Pomegranates', 'Prunes', 'Quinces', 'Rooibos', 'Strawberries', 'Triticale', 'Watermelons']
                },
                {
                    label: "Livestock",
                    commodities: ['Cattle (Extensive)', 'Cattle (Feedlot)', 'Cattle (Stud)', 'Chicken (Broilers)', 'Chicken (Layers)', 'Dairy', 'Game', 'Goats', 'Horses', 'Ostrich', 'Pigs', 'Sheep (Extensive)', 'Sheep (Feedlot)', 'Sheep (Stud)']
                }
            ];

            $scope.enterprises = {};

            $scope.toggle = function (id) {
                var e = document.getElementById(id);
                if ($scope.enterprises[id]) {
                    console.log('toggleEnterprise off');
                    $scope.enterprises[id] = false;
                    e.className = 'selectable';
                }
                else {
                    console.log('toggleEnterprise on');
                    $scope.enterprises[id] = true;
                    e.className = 'highlight selectable';
                }
            }
        }]);

    app.lazyLoader.filter('checkmark', function () {
        return function (input) {
            return input === true ? '\u2713' : '\u2718';
        };
    });

    app.lazyLoader.filter('progress', function () {
        return function (input) {
            if (input instanceof Array === false) return 0;

            var completeCount = 0;

            for (var i = 0; i < input.length; i++) {
                if (input[i].complete) completeCount++;
            }

            return (completeCount / input.length) * 100;
        };
    });

});
