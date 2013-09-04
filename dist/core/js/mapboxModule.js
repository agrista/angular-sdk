'use strict';

define(['angular'], function () {
    var module = angular.module('mapboxModule', []);

    module.factory('mapboxService', ['$rootScope', function ($rootScope) {
        var _view = undefined;
        var _boundsView = undefined;
        var _geoJsonData = [],
            _layers = [];

        return {
            reset: function () {
                _geoJsonData = [];
                _layers = []
            },
            getView: function () {
                return _view;
            },
            setView: function (coordinates, zoom) {
                if (coordinates instanceof Array) {
                    _view = {
                        coordinates: coordinates,
                        zoom: zoom || 11
                    };

                    $rootScope.$broadcast('mapbox::set-view', _view);
                }
            },
            fitBounds: function (bounds, options) {
                if (bounds instanceof Array) {
                    _boundsView = {
                        bounds: bounds,
                        options: options || {reset: false}
                    }
                }

                $rootScope.$broadcast('mapbox::fit-bounds', _boundsView);
            },
            addLayer: function (layer) {
                _layers.push(layer);
                $rootScope.$broadcast('mapbox::add-layer', layer);
            },
            getLayers: function () {
                return _layers;
            },
            addGeoJson: function (group, geoJson, options, onAddCallback) {
                if (typeof geoJson === 'object') {
                    var data = {
                        group: group,
                        geoJson: geoJson,
                        options: options,
                        onAdd: onAddCallback
                    };

                    _geoJsonData.push(data);
                    $rootScope.$broadcast('mapbox::add-geojson', data);
                }
            },
            getGeoJsonData: function () {
                return _geoJsonData;
            }
        }
    }]);

    module.directive('mapbox', ['mapboxService', 'geolocationService', '$rootScope', function (mapboxService, geolocationService, $rootScope) {
        var map;
        var featureGroups = {};
        var location = {};

        function _checkFeatureGroup(name) {
            if (featureGroups[name] === undefined) {
                featureGroups[name] = L.featureGroup().addTo(map);
            }
        }

        /**
         * Swap lat and lng in a feature object.
         * @param coordinates
         * @returns []
         */
        function swapLatLng(coordinates) {
            var swapped = [];

            if ((coordinates instanceof Array) === true) {
                if (coordinates.length > 0 && (coordinates[0] instanceof Array) === true) {
                    for (var i = 0; i < coordinates.length; i++) {
                        var polygon = coordinates[i];

                        for (var x = 0; x < polygon.length; x++) {
                            swapped.push(swap(polygon[x]));
                        }
                    }
                } else if (coordinates.length == 2) {
                    swapped = swap(coordinates);
                }
            }

            return swapped;
        }

        /**
         *  Swap position of objects in an array of two.
         * @param twoThings
         * @returns {Array}
         */
        function swap(twoThings) {
            return [twoThings[1], twoThings[0]];
        }

        function addLayer(layer) {
            if ((layer instanceof Array) === false) layer = [layer];

            if (map) {
                for (var x = 0; x < layer.length; x++) {
                    map.addLayer(layer[x]);
                }
            }
        }

        function addGeoJson(data) {
            if ((data instanceof Array) === false) data = [data];

            for (var x = 0; x < data.length; x++) {
                var item = data[x];
                var feature = undefined;

                _checkFeatureGroup(item.group);

                if (item.geoJson.type === 'Polygon') {
                    feature = L.polygon(swapLatLng(item.geoJson.coordinates), item.options).addTo(featureGroups[item.group]);
                } else if (item.geoJson.type === 'Point') {
                    feature = L.marker(swapLatLng(item.geoJson.coordinates), item.options).addTo(featureGroups[item.group]);
                } else if (item.geoJson.type === 'Feature') {
                    feature = L.geoJson(item.geoJson, item.options).addTo(featureGroups[item.group]);
                }

                if (feature !== undefined && typeof item.onAdd === 'function') {
                    item.onAdd(feature);
                }
            }
        }

        function setView(view) {
            if (map && view !== undefined) {
                map.setView(view.coordinates, view.zoom);
            }
        }

        function fitBounds(view) {
            if (map && view !== undefined) {
                map.fitBounds(view.bounds, view.options);
            }
        }

        return {
            restrict: 'E',
            template: '<div></div>',
            replace: true,
            link: function (scope, element, attrs) {
                map = L.mapbox.map(attrs.id);

                var physical = L.mapbox.tileLayer('agrista.map-65ftbmpi').addTo(map);
                var satellite = new L.Google();

                map.addControl(new L.Control.Layers({
                    'Physical': physical,
                    'Satellite': satellite
                }));

                setView(mapboxService.getView());
                addLayer(mapboxService.getLayers());
                addGeoJson(mapboxService.getGeoJsonData());
            },
            controller: function ($scope, $attrs) {
                $scope.$on('mapbox::set-view', function (event, args) {
                    setView(args);
                });
                $scope.$on('mapbox::fit-bounds', function (event, args) {
                    fitBounds(args);
                });
                $scope.$on('mapbox::add-geojson', function (event, args) {
                    addGeoJson(args);
                });
                $scope.$on('mapbox::add-layer', function (event, args) {
                    addLayer(args);
                });

                var watcher = geolocationService.watchPosition(function (res, err) {
                    if (res) {
                        if (location.marker === undefined) {
                            location.marker = L.marker([res.coords.latitude, res.coords.longitude], {
                                icon: L.icon({
                                    iconUrl: 'img/icons/navigation-marker.png',
                                    iconSize: [32, 32],
                                    iconAnchor: [16, 16],
                                    popupAnchor: [16, -16]
                                })
                            }).addTo(map);
                        } else {
                            location.marker.setLatLng([res.coords.latitude, res.coords.longitude]);
                        }
                    }
                });

                $scope.$on('$destroy', function () {
                    for (var layer in map._layers) {
                        if (map._layers.hasOwnProperty(layer)) {
                            map.removeLayer(map._layers[layer]);
                        }
                    }

                    for (var group in featureGroups) {
                        if (featureGroups.hasOwnProperty(group)) {
                            featureGroups[group].clearLayers();
                            delete featureGroups[group];
                        }
                    }

                    map.remove();

                    map = undefined;
                    location.marker = undefined;

                    watcher.cancel();
                });
            }
        }
    }]);
});
