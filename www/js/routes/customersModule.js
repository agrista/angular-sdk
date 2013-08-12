'use strict';

define(['app'], function (app) {
    app.lazyLoader.controller('CustomerListController', ['$scope', 'navigationService', 'authorization', 'customersService',
        function ($scope, navigationService, authorization, customersService) {
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

            var _handleData = function (res, err) {
                $scope.customers = res;

                if (!$scope.$$phase) $scope.$apply();
            };

            customersService.getCustomers(_handleData);

            $scope.toolbar = "list";
            $('#listdiv').show();
            $('#wallmap').hide();

            $scope.toolList = function() {
                $scope.toolbar = "list";
                $('#listdiv').show();
                $('#wallmap').hide();
            };

            $scope.toolMap = function() {
                $scope.toolbar = "map";
                $('#listdiv').hide();
                $('#wallmap').show();
                showMap();
            };

            function showMap() {
                if (!$scope.map) {
                    $scope.map = L.mapbox.map('map', 'agrista.map-65ftbmpi').setView([-28.964584, 23.914759], 6);
                }
                /**
                 * Load farm centroids of each customer for the wall map
                 */
                var markers = new L.MarkerClusterGroup();
                var markerFeatures = {"type": "FeatureCollection", "features": []};
                for (var i = 0; i < $scope.customers.length; i++) {
                    var customer = $scope.customers[i].data;
//                    console.log(customer);

                    if (customer.loc && customer.loc.coordinates && customer.loc.coordinates.length == 2) {
                        var feature = {
                            "type": "Feature",
                            "properties": {
                                "cid": customer.cid,
                                "fid": customer.fid,
                                "name": customer.name
                            },
                            "geometry": customer.loc
                        }
                        markerFeatures.features.push(feature);
                    }
                }
                var geoJsonLayer = L.geoJson(markerFeatures, {onEachFeature: markerClick});
                markers.addLayer(geoJsonLayer);
                $scope.map.addLayer(markers);

                function markerClick(feature, layer) {
                    layer.on('click', function(e) {
//                        $scope.showCustomer(e.target.feature.properties.fid);
//                        console.log(e.target.feature.properties.fid);
//                        navigationService.go('/customer/' + e.target.feature.properties.fid, 'slide');
                        e.target.bindPopup('<strong>Customer </strong><br/><span>' + e.target.feature.properties.name + '</span>');
                    });
                }
//                var physical = L.mapbox.tileLayer('agrista.map-65ftbmpi');
//                map.addLayer(physical);

            }

            $scope.showCustomer = function (id) {
                navigationService.go('/customer/' + id, 'slide');
            };
        }]);


    app.lazyLoader.controller('CustomerDetailController', ['$scope', '$routeParams', 'navigationService', 'farmerService',
        function ($scope, $routeParams, navigationService, farmerService) {
            var _handleData = function (res, err) {
                $scope.farmer = res;

                if (!$scope.$$phase) $scope.$apply();
            };

            farmerService.getFarmer($routeParams.id, _handleData);

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

                        farmerService.updateFarmer($scope.farmer, function() {
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

            $scope.mode = 'view';

            $scope.typeOptions = ['Smallholder', 'Commercial', 'Cooperative', 'Corporate'];

            $scope.addEnterprise = function () {
                navigationService.go('/customer/' + $routeParams.id + '/enterprises', 'modal');
            };

            $scope.deleteEnterprise = function (idx) {
                $scope.farmer.data.enterprises.splice(idx, 1);
            };

        }]);

    app.lazyLoader.controller('CustomerEnterpriseController', ['$scope', '$routeParams', 'navigationService', 'farmerService',
        function ($scope, $routeParams, navigationService, farmerService) {
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
                            if ($scope.farmer.data.enterprises.indexOf(enterprise) == -1) {
                                $scope.farmer.data.enterprises.push(enterprise);
                            }
                        }
                    }
                    farmerService.updateFarmer($scope.farmer, function() {
                        farmerService.syncFarmer($routeParams.id);
                    });
                    navigationService.go('/customer/' + $routeParams.id, 'modal', true);
                }
            };

            var _handleData = function (res, err) {
                $scope.farmer = res;

                if (!$scope.$$phase) $scope.$apply();
            };

            farmerService.getFarmer($routeParams.id, _handleData);

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
                    $scope.enterprises[id] = false;
                    e.className = 'selectable';
                }
                else {
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
            var completeCount = 0;

            for (var i = 0; i < input.length; i++) {
                if (input[i].complete) completeCount++;
            }

            return (completeCount / input.length) * 100;
        };
    });

});
