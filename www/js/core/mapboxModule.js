'use strict';

define(['app'], function (app) {

    app.lazyLoader.factory('mapboxService', ['$rootScope', function ($rootScope) {

        return {
            setView: function (coordinates, zoom) {
                if (coordinates instanceof Array) {
                    $rootScope.$emit('mapbox::set-view', {
                        coordinates: coordinates,
                        zoom: zoom || 6
                    });
                }
            },
            addGeoJSON: function (group, geojson, options) {
                if (polygon instanceof Array) {
                    $rootScope.$emit('mapbox::add-geojson', {
                        group: group,
                        geojson: geojson,
                        options: options
                    });
                }
            },
            addMarker: function (group, position, options) {
                if (polygon instanceof Array) {
                    $rootScope.$emit('mapbox::add-marker', {
                        group: group,
                        position: position,
                        options: options
                    });
                }
            }
        }
    }]);

    app.lazyLoader.directive('mapbox', ['mapboxService', function (mapboxService) {

        var map = undefined;

        var featureGroups = {
            land: undefined,
            portion: undefined
        }

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

        return {
            restrict: 'E',
            template: '<div></div>',
            replace: true,
            link: function (scope, element, attrs) {
                map = L.mapbox.map(attrs.id, 'agrista.map-65ftbmpi');

                featureGroups.land = L.featureGroup().addTo(map);
                featureGroups.portion = L.featureGroup().addTo(map);

                map.setView([-28.964584, 23.914759], 6);
            },
            controller: function ($scope, $attrs) {
                $scope.$on('mapbox::set-view', function (view) {
                    map.setView(view.coordinates, view.zoom);
                });

                $scope.$on('mapbox::add-geojson', function (geojson) {
                    if (geojson.type === 'Polygon') {
                        L.polygon(swapLatLng(geojson.coordinates), polygon.options).addTo(featureGroups[polygon.group]);
                    }


                });

                $scope.$on('mapbox::add-marker', function (marker) {
                    L.marker(marker.position, marker.options).addTo(featureGroups[marker.group]);
                });

            }
        }
    }]);
});
