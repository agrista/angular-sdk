var sdkModelOrganization = angular.module('ag.sdk.model.organization', ['ag.sdk.library', 'ag.sdk.model.base']);

sdkModelOrganization.factory('Organization', ['Base', 'inheritModel', 'Model', 'privateProperty', 'topologyHelper', 'underscore',
    function (Base, inheritModel, Model, privateProperty, topologyHelper, underscore) {
        function Organization (attrs) {
            Model.Base.apply(this, arguments);

            // Geom
            privateProperty(this, 'contains', function (geojson) {
                return contains(this, geojson);
            });

            privateProperty(this, 'centroid', function () {
                return centroid(this);
            });

            this.data = (attrs && attrs.data) || {};
            Base.initializeObject(this.data, 'attachments', []);
            Base.initializeObject(this.data, 'baseStyles', {});

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.id = attrs.id || attrs.$id;
            this.email = attrs.email;
            this.hostUrl = attrs.hostUrl;
            this.name = attrs.name;
            this.registered = attrs.registered;
            this.services = attrs.services;
            this.status = attrs.status;
            this.uuid = attrs.uuid;
        }

        inheritModel(Organization, Model.Base);

        function getAssetsGeom (instance) {
            return underscore.chain(instance.legalEntities)
                .pluck('assets')
                .flatten().compact()
                .filter(function (asset) {
                    return asset.data && asset.data.loc;
                })
                .reduce(function (geom, asset) {
                    var assetGeom = topologyHelper.readGeoJSON(asset.data.loc);

                    return (geom && assetGeom.isValid() ? geom.union(assetGeom) : geom || assetGeom);
                }, null)
                .value();
        }

        function contains (instance, geojson) {
            var farmGeom = getAssetsGeom(instance),
                queryGeom = topologyHelper.readGeoJSON(geojson);

            return (farmGeom && queryGeom ? farmGeom.contains(queryGeom) : false);
        }

        function centroid (instance) {
            var geom = getAssetsGeom(instance);

            return (geom ? topologyHelper.writeGeoJSON(geom.getCentroid()) : geom);
        }

        privateProperty(Organization, 'contains', function (instance, geojson) {
            return contains(instance, geojson);
        });

        privateProperty(Organization, 'centroid', function (instance) {
            return centroid(instance);
        });

        Organization.validates({
            email: {
                required: true,
                format: {
                    email: true
                }
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

        return Organization;
    }]);


