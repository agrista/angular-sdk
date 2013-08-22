'use strict';

define(['app'], function (app) {

    app.lazyLoader.factory('mapboxService', ['$rootScope', function ($rootScope) {
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

                    $rootScope.$emit('mapbox::set-view', _view);
                }
            },
            fitBounds: function (bounds, options) {
                if (bounds instanceof Array) {
                    _boundsView = {
                        bounds: bounds,
                        options: options || {reset: false}
                    }
                }

                $rootScope.$emit('mapbox::fit-bounds', _boundsView);
            },
            addLayer: function (layer) {
                _layers.push(layer);
                $rootScope.$emit('mapbox::add-layer', layer);
            },
            getLayers: function () {
                return _layers;
            },
            addGeoJson: function (group, geoJson, options) {
                if (typeof geoJson === 'object') {
                    var data = {
                        group: group,
                        geoJson: geoJson,
                        options: options
                    };

                    _geoJsonData.push(data);
                    $rootScope.$emit('mapbox::add-geojson', data);
                }
            },
            getGeoJsonData: function () {
                return _geoJsonData;
            }
        }
    }]);

    app.lazyLoader.directive('mapbox', ['mapboxService', 'geolocationService', '$rootScope', function (mapboxService, geolocationService, $rootScope) {
        var map;
        var featureGroups = {
            land: undefined,
            portion: undefined,
            marker: undefined
        };

        var location = {};

        /**
         * Swap lat and lng in a feature object.
         * @param feature
         * @returns feature
         */
        function swapLatLng(coordinates) {
            var swapped = [];

            for (var i = 0; i < coordinates.length; i++) {
                var polygon = coordinates[i];

                for (var x = 0; x < polygon.length; x++) {
                    swapped.push(swap(polygon[x]));
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

                if (item.geoJson.type === 'Polygon') {
                    L.polygon(swapLatLng(item.geoJson.coordinates), item.options).addTo(featureGroups[item.group]);
                } else if (item.geoJson.type === 'Point') {
                    L.marker(swapLatLng(item.geoJson.coordinates), item.options).addTo(featureGroups[item.group]);
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

                featureGroups.land = L.featureGroup().addTo(map);
                featureGroups.portion = L.featureGroup().addTo(map);
                featureGroups.marker = L.featureGroup().addTo(map);
                featureGroups.location = L.featureGroup().addTo(map);

                setView(mapboxService.getView());
                addLayer(mapboxService.getLayers());
                addGeoJson(mapboxService.getGeoJsonData());
            },
            controller: function ($scope, $attrs) {
                $rootScope.$on('mapbox::set-view', function (event, args) {
                    setView(args);
                });
                $rootScope.$on('mapbox::fit-bounds', function (event, args) {
                    fitBounds(args);
                });
                $rootScope.$on('mapbox::add-geojson', function (event, args) {
                    addGeoJson(args);
                });
                $rootScope.$on('mapbox::add-layer', function (event, args) {
                    addLayer(args);
                });

                var watcher = geolocationService.watchPosition(function (res, err) {
                    if (res) {
                        if (location.marker === undefined) {
                            location.marker = L.marker([res.coords.latitude, res.coords.longitude]).addTo(map);
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

                    featureGroups.land.clearLayers();
                    featureGroups.portion.clearLayers();
                    featureGroups.marker.clearLayers();
                    featureGroups.location.clearLayers();

                    map.remove();

                    map = undefined;
                    location.marker = undefined;

                    watcher.cancel();
                });
            }
        }
    }]);
});
