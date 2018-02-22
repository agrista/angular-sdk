var sdkModelFarm = angular.module('ag.sdk.model.farm', ['ag.sdk.library', 'ag.sdk.model.base']);

sdkModelFarm.factory('Farm', ['Base', 'geoJSONHelper', 'inheritModel', 'Model', 'naturalSort', 'privateProperty', 'readOnlyProperty', 'topologyHelper', 'underscore',
    function (Base, geoJSONHelper, inheritModel, Model, naturalSort, privateProperty, readOnlyProperty, topologyHelper, underscore) {
        function Farm (attrs) {
            Model.Base.apply(this, arguments);

            // Fields
            privateProperty(this, 'addField', function (field) {
                addItem(this, 'fields', field, 'fieldName');
            });

            privateProperty(this, 'removeField', function (field) {
                removeItem(this, 'fields', field, 'fieldName');
            });

            // Gates
            privateProperty(this, 'addGate', function (gate) {
                addItem(this, 'gates', gate, 'name');
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
            this.legalEntityId = attrs.legalEntityId;

            // Models
            this.organization = attrs.organization;
        }

        inheritModel(Farm, Model.Base);

        function addItem (instance, dataStore, item, compareProp) {
            if (item) {
                instance.data[dataStore] = underscore.chain(instance.data[dataStore])
                    .reject(function (dsItem) {
                        return dsItem[compareProp] === item[compareProp];
                    })
                    .union([Base.jsonValue(item)])
                    .value()
                    .sort(function (a, b) {
                        return naturalSort(a[compareProp], b[compareProp]);
                    });

                instance.$dirty = true;
            }
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
            legalEntityId: {
                required: true,
                numeric: true
            },
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
