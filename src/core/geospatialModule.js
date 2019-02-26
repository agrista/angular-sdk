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

    function geometryArea (area, geojson) {
        if (geojson.type) {
            switch (geojson.type) {
                case 'Polygon':
                    return polygonArea(0, geojson.coordinates);
                case 'MultiPolygon':
                    return underscore.reduce(geojson.coordinates, polygonArea, area);
                case 'GeometryCollection':
                    return underscore.reduce(geojson.geometries, geometryArea, area);
            }
        }

        return area;
    }

    function polygonArea (area, coords) {
        if (coords && coords.length > 0) {
            area += Math.abs(ringArea(coords[0]));
            for (var i = 1; i < coords.length; i++) {
                area -= Math.abs(ringArea(coords[i]));
            }
        }

        return area;
    }

    function ringArea (coords) {
        var p1, p2, p3, lowerIndex, middleIndex, upperIndex, i,
            area = 0,
            coordsLength = coords.length;

        if (coordsLength > 2) {
            for (i = 0; i < coordsLength; i++) {
                if (i === coordsLength - 2) {// i = N-2
                    lowerIndex = coordsLength - 2;
                    middleIndex = coordsLength -1;
                    upperIndex = 0;
                } else if (i === coordsLength - 1) {// i = N-1
                    lowerIndex = coordsLength - 1;
                    middleIndex = 0;
                    upperIndex = 1;
                } else { // i = 0 to N-3
                    lowerIndex = i;
                    middleIndex = i+1;
                    upperIndex = i+2;
                }
                p1 = coords[lowerIndex];
                p2 = coords[middleIndex];
                p3 = coords[upperIndex];
                area += (rad(p3[0]) - rad(p1[0])) * Math.sin(rad(p2[1]));
            }

            // WGS84 radius
            area = area * 6378137 * 6378137 / 2;
        }

        return area;
    }

    function rad (val) {
        return val * Math.PI / 180;
    }

    function getGeometry (instance) {
        return instance._json && (instance._json.type === 'Feature' ?
                instance._json.geometry :
                (instance._json.type !== 'FeatureCollection' ?
                        instance._json : {
                            type: 'GeometryCollection',
                            geometries: underscore.pluck(instance._json.features, 'geometry')
                        }
                )
        );
    }

    function geometryRelation (instance, relation, geometry) {
        var geom1 = topologyHelper.readGeoJSON(getGeometry(instance)),
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
        getArea: function () {
            var area = (this._json ? geometryArea(0, this._json) : 0),
                yards = (area * 1.19599);

            return {
                m_sq: area,
                ha: (area * 0.0001),
                mi_sq: (yards / 3097600),
                acres: (yards / 4840),
                yd_sq: yards
            };
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
         * Geometry Editing
         */
        geometry: function () {
            return topologyHelper.readGeoJSON(getGeometry(this));
        },
        difference: function (geometry) {
            var geom = topologyHelper.readGeoJSON(getGeometry(this));
            this._json = topologyHelper.writeGeoJSON(geom.difference(geometry));
            return this;
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
        getCenter: function () {
            var geom = topologyHelper.readGeoJSON(getGeometry(this)),
                coord = (geom ? geom.getCentroid().getCoordinate() : geom);

            return (coord ? [coord.x, coord.y] : coord);
        },
        getCenterAsGeojson: function () {
            var geom = topologyHelper.readGeoJSON(getGeometry(this));

            return (geom ? topologyHelper.writeGeoJSON(geom.getCentroid()) : geom);
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
        addGeometry: function (geojson, properties) {
            if (geojson) {
                if (this._json === undefined) {
                    this._json = geojson;

                    this.addProperties(properties);
                } else {
                    if (this._json.type !== 'GeometryCollection' && this._json.type !== 'FeatureCollection' && this._json.type !== 'Feature') {
                        this._json = {
                            type: 'GeometryCollection',
                            geometries: [this._json]
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
                        if (geojson.type === 'Feature') {
                            this._json.features.push(geojson);
                        } else {
                            this._json.features.push({
                                type: 'Feature',
                                geometry: geojson,
                                properties: underscore.defaults(properties || {}, {
                                    featureId: objectId().toString()
                                })
                            });
                        }
                    }

                    if (this._json.type === 'GeometryCollection') {
                        if (geojson.type === 'Feature') {
                            this._json.features.push(geojson.geometry);
                        } else {
                            this._json.geometries.push(geojson);
                        }
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