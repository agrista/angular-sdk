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
        }
    }
});

/*
 * GeoJson
 */
interfaceMapApp.factory('geojsonHelper', function () {
    function GeojsonHelper(json) {
        if (!(this instanceof GeojsonHelper)) {
            return new GeojsonHelper(json);
        }

        this._json = json;
    }

    function _recursiveCoordinateFinder (bounds, coordinates) {
        if (angular.isArray(coordinates[0])) {
            angular.forEach(coordinates, function(coordinate) {
                _recursiveCoordinateFinder(bounds, coordinate);
            });
        } else if (angular.isArray(coordinates)) {
            bounds.push([coordinates[1], coordinates[0]]);
        }
    }

    GeojsonHelper.prototype = {
        getJson: function () {
            return this._json;
        },
        getCenter: function () {
            var bounds = this.getBounds();
            var center = [0, 0];

            angular.forEach(bounds, function(coordinate) {
                center[0] += coordinate[0];
                center[1] += coordinate[1];
            });

            return [(center[1] / bounds.length), (center[0] / bounds.length)];
        },
        getBounds: function () {
            var features = this._json.features || [this._json];
            var bounds = [];

            angular.forEach(features, function(feature) {
                var geometry = feature.geometry || feature;

                _recursiveCoordinateFinder(bounds, geometry.coordinates);
            });

            return bounds;
        },
        addProperties: function (properties) {
            var _this = this;

            if (_this._json.type == 'Feature') {
                angular.forEach(properties, function(property, key) {
                    _this._json.geometry[key] = property;
                });
            } else if (_this._json.type != 'FeatureGroup') {
                _this._json = {
                    type: 'Feature',
                    geometry: _this._json,
                    properties: properties
                };
            }

            return _this;
        },
        addGeometry: function (geometry, properties) {
            if (this._json.type != 'FeatureGroup' && this._json.type != 'Feature') {
                this._json = {
                    type: 'Feature',
                    geometry: this._json
                };
            }

            if (this._json.type == 'Feature') {
                this._json = {
                    type: 'FeatureGroup',
                    features: [this._json]
                };
            }

            if (this._json.type == 'FeatureGroup') {
                this._json.features.push({
                    type: 'Feature',
                    geometry: geometry,
                    properties: properties
                });
            }
        }
    };

    return function (json) {
        return new GeojsonHelper(json);
    }
});