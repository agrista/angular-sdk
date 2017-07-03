var sdkGeospatialApp = angular.module('ag.sdk.geospatial', ['ag.sdk.utilities', 'ag.sdk.id', 'ag.sdk.library']);

sdkGeospatialApp.factory('geoJSONHelper', ['objectId', 'topologyHelper', 'underscore', function (objectId, topologyHelper, underscore) {
    function GeojsonHelper(json, properties) {
        if (!(this instanceof GeojsonHelper)) {
            return new GeojsonHelper(json, properties);
        }

        this.addGeometry(json, properties);
    }

    function recursiveCoordinateFinder (bounds, coordinates) {
        if (coordinates) {
            if (angular.isArray(coordinates[0])) {
                angular.forEach(coordinates, function(coordinate) {
                    recursiveCoordinateFinder(bounds, coordinate);
                });
            } else if (angular.isArray(coordinates)) {
                bounds.push([coordinates[1], coordinates[0]]);
            }
        }
    }

    function geometryRelation (instance, relation, geometry) {
        var geom1 = topologyHelper.readGeoJSON(instance._json),
            geom2 = topologyHelper.readGeoJSON(geometry);

        return (geom1 && geom2 && geom1[relation] ? geom1[relation](geom2) : false);
    }
    

    GeojsonHelper.prototype = {
        getJson: function () {
            return this._json;
        },
        getType: function () {
            return this._json.type;
        },
        getGeometryType: function () {
            return (this._json.geometry ? this._json.geometry.type : this._json.type);
        },
        getBounds: function () {
            var bounds = [];

            if (this._json) {
                var features = this._json.features || [this._json];

                angular.forEach(features, function(feature) {
                    var geometry = feature.geometry || feature;

                    recursiveCoordinateFinder(bounds, geometry.coordinates);
                });
            }

            return bounds;
        },
        getBoundingBox: function (bounds) {
            bounds = bounds || this.getBounds();

            var lat1 = 0, lat2 = 0,
                lng1 = 0, lng2 = 0;

            angular.forEach(bounds, function(coordinate, index) {
                if (index === 0) {
                    lat1 = lat2 = coordinate[0];
                    lng1 = lng2 = coordinate[1];
                } else {
                    lat1 = (lat1 < coordinate[0] ? lat1 : coordinate[0]);
                    lat2 = (lat2 < coordinate[0] ? coordinate[0] : lat2);
                    lng1 = (lng1 < coordinate[1] ? lng1 : coordinate[1]);
                    lng2 = (lng2 < coordinate[1] ? coordinate[1] : lng2);
                }
            });

            return [[lat1, lng1], [lat2, lng2]];
        },
        /**
         * Geometry Relations
         */
        contains: function (geometry) {
            return geometryRelation(this, 'contains', geometry);
        },
        within: function (geometry) {
            return geometryRelation(this, 'within', geometry);
        },
        /**
         * Get Center
         */
        getCenter: function (bounds) {
            var boundingBox = this.getBoundingBox(bounds || this.getBounds());

            return [boundingBox[0][0] + ((boundingBox[1][0] - boundingBox[0][0]) / 2), boundingBox[0][1] + ((boundingBox[1][1] - boundingBox[0][1]) / 2)];
        },
        getCenterAsGeojson: function (bounds) {
            return {
                coordinates: this.getCenter(bounds || this.getBounds()).reverse(),
                type: 'Point'
            }
        },
        getProperty: function (name) {
            return (this._json && this._json.properties ? this._json.properties[name] : undefined);
        },
        setCoordinates: function (coordinates) {
            if (this._json && this._json.type !== 'FeatureCollection') {
                if (this._json.geometry) {
                    this._json.geometry.coordinates = coordinates;
                } else {
                    this._json.coordinates = coordinates;
                }
            }
        },
        addProperties: function (properties) {
            var _this = this;

            if (this._json && properties) {
                if (_this._json.type !== 'FeatureCollection' && _this._json.type !== 'Feature') {
                    _this._json = {
                        type: 'Feature',
                        geometry: _this._json,
                        properties: properties
                    };
                } else {
                    _this._json.properties = _this._json.properties || {};

                    angular.forEach(properties, function(property, key) {
                        _this._json.properties[key] = property;
                    });
                }
            }

            return _this;
        },
        addGeometry: function (geometry, properties) {
            if (geometry) {
                if (this._json === undefined) {
                    this._json = geometry;

                    this.addProperties(properties);
                } else {
                    if (this._json.type !== 'FeatureCollection' && this._json.type !== 'Feature') {
                        this._json = {
                            type: 'Feature',
                            geometry: this._json
                        };
                    }

                    if (this._json.type === 'Feature') {
                        this._json.properties = underscore.defaults(this._json.properties || {}, {
                            featureId: objectId().toString()
                        });

                        this._json = {
                            type: 'FeatureCollection',
                            features: [this._json]
                        };
                    }

                    if (this._json.type === 'FeatureCollection') {
                        this._json.features.push({
                            type: 'Feature',
                            geometry: geometry,
                            properties: underscore.defaults(properties || {}, {
                                featureId: objectId().toString()
                            })
                        });
                    }
                }
            }

            return this;
        },
        formatGeoJson: function (geoJson, toType) {
            // TODO: REFACTOR
            //todo: maybe we can do the geoJson formation to make it standard instead of doing the validation.
            if (toType.toLowerCase() === 'point') {
                switch (geoJson && geoJson.type && geoJson.type.toLowerCase()) {
                    // type of Feature
                    case 'feature':
                        if (geoJson.geometry && geoJson.geometry.type && geoJson.geometry.type === 'Point') {
                            return geoJson.geometry;
                        }
                        break;
                    // type of FeatureCollection
                    case 'featurecollection':
                        break;
                    // type of GeometryCollection
                    case 'geometrycollection':
                        break;
                    // type of Point, MultiPoint, LineString, MultiLineString, Polygon, MultiPolygon
                    default:
                        break;
                }
            }

            return geoJson;
        },
        validGeoJson: function (geoJson, typeRestriction) {
            // TODO: REFACTOR
            var validate = true;
            if(!geoJson || geoJson.type === undefined || typeof geoJson.type !== 'string' || (typeRestriction && geoJson.type.toLowerCase() !== typeRestriction)) {
                return false;
            }

            // valid type, and type matches the restriction, then validate the geometry / features / geometries / coordinates fields
            switch (geoJson.type.toLowerCase()) {
                // type of Feature
                case 'feature':
                    break;
                // type of FeatureCollection
                case 'featurecollection':
                    break;
                // type of GeometryCollection
                case 'geometrycollection':
                    break;
                // type of Point, MultiPoint, LineString, MultiLineString, Polygon, MultiPolygon
                default:
                    if(!geoJson.coordinates || !geoJson.coordinates instanceof Array) {
                        return false;
                    }
                    var flattenedCoordinates = _.flatten(geoJson.coordinates);
                    flattenedCoordinates.forEach(function(element) {
                        if (typeof element !== 'number') {
                            validate = false;
                        }
                    });
                    break;
            }

            return validate;
        }
    };

    return function (json, properties) {
        return new GeojsonHelper(json, properties);
    }
}]);

sdkGeospatialApp.factory('topologyHelper', ['topologySuite', function (topologySuite) {
    var geometryFactory = new topologySuite.geom.GeometryFactory(),
        geoJSONReader = new topologySuite.io.GeoJSONReader(geometryFactory),
        geoJSONWriter = new topologySuite.io.GeoJSONWriter(geometryFactory);

    return {
        getGeometryFactory: function () {
            return geometryFactory;
        },
        getGeoJSONReader: function () {
            return geoJSONReader;
        },
        getGeoJSONWriter: function () {
            return geoJSONWriter;
        },
        readGeoJSON: function (geojson) {
            return (geojson ? geoJSONReader.read(geojson) : undefined);
        },
        writeGeoJSON: function (geometry) {
            return (geometry ? geoJSONWriter.write(geometry) : undefined);
        }
    };
}]);