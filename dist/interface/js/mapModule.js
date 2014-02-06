var interfaceMapApp = angular.module('ag.interface.map', ['leaflet-directive']);

interfaceMapApp.factory('mapDefaultsHelper', function () {
    return {
        center: {
            lng: 23.914759,
            lat: -28.964584,
            zoom: 6
        },
        layers: {
            baselayers: {
                agrista: {
                    name: 'Agrista',
                    url: 'http://{s}.tiles.mapbox.com/v3/{key}/{z}/{x}/{y}.png',
                    type: 'xyz',
                    layerParams: {
                        key: 'agrista.map-65ftbmpi'
                    },
                    layerOptions: {
                        attribution: '&copy; <a href="http://www.agrista.com">Agrista</a>'
                    }
                },
                google: {
                    name: 'Google',
                    layerType: 'SATELLITE',
                    type: 'google'
                }
            }
        },
        defaults: {
            scrollWheelZoom: false
        }
    };
});

interfaceMapApp.factory('mapMarkerHelper', function () {
    var _defaultMarker = {
        iconUrl: 'img/icons/:name.:state.png',
        shadowUrl: 'img/icons/:name.shadow.png',
        iconSize: [48, 48],
        iconAnchor: [24, 48],
        shadowSize: [73, 48],
        shadowAnchor: [24, 48]
    };

    var _getMarker = function (name, state, options) {
        return _.defaults(options || {}, {
            iconUrl: 'img/icons/' + name + '.' + state + '.png',
            shadowUrl: 'img/icons/' + name + '.shadow.png',
            iconSize: [48, 48],
            iconAnchor: [24, 48],
            shadowSize: [73, 48],
            shadowAnchor: [24, 48]
        });
    };

    function recursiveCoordinate (data, coordinates) {
        if (coordinates[0] instanceof Array) {
            angular.forEach(coordinates, function(coordinate) {
                recursiveCoordinate(data, coordinate);
            });
        } else {
            data.center[0] += coordinates[0];
            data.center[1] += coordinates[1];
            data.count++;
        }
    }

    return {
        getMarker: function (name, options) {
            var marker = {};

            if (typeof name === 'string') {
                marker = _getMarker(name, 'default', options)
            }

            return marker;
        },
        getMarkerStates: function (name, states, options) {
            var markers = {};

            if (typeof name === 'string') {
                angular.forEach(states, function(state) {
                    markers[state] = _getMarker(name, state, options);
                });
            }

            return markers;
        },
        findCenter: function (coordinates) {
            var data = {
                center: [0, 0],
                count: 0
            };

            recursiveCoordinate(data, coordinates);

            return [data.center[0] / data.count, data.center[1] / data.count];
        }
    }
});