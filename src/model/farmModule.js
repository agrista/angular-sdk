var sdkModelFarm = angular.module('ag.sdk.model.farm', ['ag.sdk.library', 'ag.sdk.model.base']);

sdkModelFarm.factory('Farm', ['asJson', 'Base', 'computedProperty', 'geoJSONHelper', 'inheritModel', 'Model', 'naturalSort', 'privateProperty', 'readOnlyProperty', 'topologyHelper', 'underscore',
    function (asJson, Base, computedProperty, geoJSONHelper, inheritModel, Model, naturalSort, privateProperty, readOnlyProperty, topologyHelper, underscore) {
        function Farm (attrs) {
            Model.Base.apply(this, arguments);

            privateProperty(this, 'farmNameUnique', function (name, farms) {
                return farmNameUnique(this, name, farms);
            });

            computedProperty(this, 'fields', function () {
                return this.data.fields;
            });

            computedProperty(this, 'gates', function () {
                return this.data.gates;
            });

            // Fields
            privateProperty(this, 'addFields', function (fields) {
                addItems(this, 'fields', fields, 'fieldName');
            });

            privateProperty(this, 'addField', function (field) {
                addItem(this, 'fields', field, 'fieldName');
            });

            privateProperty(this, 'getField', function (fieldName) {
                return getItem(this, 'fields', fieldName, 'fieldName');
            });

            privateProperty(this, 'removeField', function (field) {
                removeItem(this, 'fields', field, 'fieldName');
            });

            // Gates
            privateProperty(this, 'addGates', function (gates) {
                addItems(this, 'gates', gates, 'name');
            });

            privateProperty(this, 'addGate', function (gate) {
                addItem(this, 'gates', gate, 'name');
            });

            privateProperty(this, 'getGate', function (name) {
                return getItem(this, 'gates', name, 'name');
            });

            privateProperty(this, 'removeGate', function (gate) {
                removeItem(this, 'gates', gate, 'name');
            });

            // Geom
            privateProperty(this, 'contains', function (geojson, assets) {
                return contains(this, geojson, assets);
            });

            privateProperty(this, 'centroid', function (assets) {
                return centroid(this, assets);
            });

            this.data = (attrs && attrs.data) || {};
            Base.initializeObject(this.data, 'fields', []);
            Base.initializeObject(this.data, 'gates', []);
            Base.initializeObject(this.data, 'ignoredLandClasses', []);

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.id = attrs.id || attrs.$id;
            this.name = attrs.name;
            this.organizationId = attrs.organizationId;

            // Models
            this.assets = attrs.assets || [];
            this.organization = attrs.organization;
        }

        function farmNameUnique (instance, name, farms) {
            var trimmedValue = s.trim(name || '').toLowerCase();

            return !underscore.isEmpty(trimmedValue) && !underscore.chain(farms)
                .reject(function (farm) {
                    return instance.id === farm.id;
                })
                .some(function (farm) {
                    return (s.trim(farm.name).toLowerCase() === trimmedValue);
                })
                .value();
        }

        inheritModel(Farm, Model.Base);

        function addItems (instance, dataStore, items, compareProp) {
            underscore.each(items, function (item) {
                addItem(instance, dataStore, item, compareProp);
            })
        }

        function addItem (instance, dataStore, item, compareProp) {
            if (item) {
                instance.data[dataStore] = underscore.chain(instance.data[dataStore])
                    .reject(function (dsItem) {
                        return dsItem[compareProp] === item[compareProp];
                    })
                    .union([asJson(item)])
                    .value()
                    .sort(function (a, b) {
                        return naturalSort(a[compareProp], b[compareProp]);
                    });

                instance.$dirty = true;
            }
        }

        function getItem (instance, dataStore, value, compareProp) {
            return underscore.find(instance.data[dataStore], function (dsItem) {
                return dsItem[compareProp] === value;
            });
        }

        function removeItem (instance, dataStore, item, compareProp) {
            if (item) {
                instance.data[dataStore] = underscore.reject(instance.data[dataStore], function (dsItem) {
                    return dsItem[compareProp] === item[compareProp];
                });

                instance.$dirty = true;
            }
        }

        function getAssetsGeom (instance, assets) {
            return underscore.chain(assets)
                .filter(function (asset) {
                    return asset.farmId === instance.id && asset.data && asset.data.loc;
                })
                .reduce(function (geom, asset) {
                    var assetGeom = topologyHelper.readGeoJSON(asset.data.loc);

                    return (geom && assetGeom.isValid() ? geom.union(assetGeom) : geom || assetGeom);
                }, null)
                .value();
        }

        function contains (instance, geojson, assets) {
            var farmGeom = getAssetsGeom(instance, assets),
                queryGeom = topologyHelper.readGeoJSON(geojson);

            return (farmGeom && queryGeom ? farmGeom.contains(queryGeom) : false);
        }

        function centroid (instance, assets) {
            var geom = getAssetsGeom(instance, assets);

            return (geom ? topologyHelper.writeGeoJSON(geom.getCentroid()) : geom);
        }

        Farm.validates({
            name: {
                required: true,
                length: {
                    min: 1,
                    max: 255
                }
            },
            organizationId: {
                required: true,
                numeric: true
            }
        });

        return Farm;
    }]);
