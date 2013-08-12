'use strict';

define(['app'], function (app) {

    app.lazyLoader.factory('mapboxService', ['$rootScope', function ($rootScope) {
        var _view = undefined;
        var _geojsonData = [],
            _layers = [];

        return {
            reset: function() {
                _geojsonData = [];
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
            addLayer: function(layer, callback) {
                var data = {
                    layer: layer,
                    callback: callback
                };

                _layers.push(data);
                $rootScope.$emit('mapbox::add-layer', data);
            },
            addGeoJSON: function (group, geojson, options) {
                if (typeof geojson === 'object') {
                    var data = {
                        group: group,
                        geojson: geojson,
                        options: options
                    };

                    _geojsonData.push(data);
                    $rootScope.$emit('mapbox::add-geojson', data);
                }
            },
            getGeoJSONData: function () {
                return _geojsonData;
            }
        }
    }]);

    app.lazyLoader.directive('mapbox', ['mapboxService', 'geolocationService', function (mapboxService, geolocationService) {
        var map;
        var featureGroups = {
            land: undefined,
            portion: undefined,
            marker: undefined
        };

        var location = {};

        geolocationService.watchPosition(function(res, err) {
            if(res) {
                if(location.marker === undefined) {
                    location.marker = L.marker([res.coords.latitude, res.coords.longitude]).addTo(map);
                } else {
                    location.marker.setLatLng([res.coords.latitude, res.coords.longitude]);
                }
            }
        });

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

        function addLayer(data) {
            if ((data instanceof Array) === false) data = [data];

            for (var x = 0; x < data.length; x++) {
                var item = data[x];

                map.addLayer(item.layer);
            }
        }

        function addGeoJSON(data) {
            if ((data instanceof Array) === false) data = [data];

            for (var x = 0; x < data.length; x++) {
                var item = data[x];

                if (item.geojson.type === 'Polygon') {
                    L.polygon(swapLatLng(item.geojson.coordinates), item.options).addTo(featureGroups[item.group]);
                } else if (item.geojson.type === 'Point') {
                    L.marker(swapLatLng(item.geojson.coordinates), item.options).addTo(featureGroups[item.group]);
                }
            }
        }

        function setView(view) {
            if (view !== undefined) {
                map.setView(view.coordinates, view.zoom);
            }
        }

        return {
            restrict: 'E',
            template: '<div></div>',
            replace: true,
            link: function (scope, element, attrs) {
                map = L.mapbox.map(attrs.id, 'agrista.map-65ftbmpi');

                featureGroups.land = L.featureGroup().addTo(map);
                featureGroups.portion = L.featureGroup().addTo(map);
                featureGroups.marker = L.featureGroup().addTo(map);
                featureGroups.location = L.featureGroup().addTo(map);

                setView(mapboxService.getView());
                addLayer(mapboxService.getLayers());
                addGeoJSON(mapboxService.getGeoJSONData());
            },
            controller: function ($scope, $attrs) {
                $scope.$on('mapbox::set-view', setView);
                $scope.$on('mapbox::add-geojson', addGeoJSON);
                $scope.$on('mapbox::add-layer', addLayer);
            }
        }
    }]);
});
