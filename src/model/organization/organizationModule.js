var sdkModelOrganization = angular.module('ag.sdk.model.organization', ['ag.sdk.library', 'ag.sdk.model.base']);

sdkModelOrganization.factory('Organization', ['Locale', 'Base', 'inheritModel', 'privateProperty', 'readOnlyProperty', 'topologyHelper', 'underscore',
    function (Locale, Base, inheritModel, privateProperty, readOnlyProperty, topologyHelper, underscore) {
        function Organization (attrs) {
            Locale.apply(this, arguments);

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
            this.createdAt = attrs.createdAt;
            this.createdBy = attrs.createdBy;
            this.email = attrs.email;
            this.hostUrl = attrs.hostUrl;
            this.name = attrs.name;
            this.originHost = attrs.originHost;
            this.originPort = attrs.originPort;
            this.primaryContact = attrs.primaryContact;
            this.registered = attrs.registered;
            this.status = attrs.status;
            this.teams = attrs.teams || [];
            this.updatedAt = attrs.updatedAt;
            this.updatedBy = attrs.updatedBy;
            this.uuid = attrs.uuid;
        }

        inheritModel(Organization, Locale);

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
            var geom = getAssetsGeom(instance),
                coord = (geom ? geom.getCentroid().getCoordinate() : geom);

            return (coord ? [coord.x, coord.y] : coord);
        }

        privateProperty(Organization, 'contains', function (instance, geojson) {
            return contains(instance, geojson);
        });

        privateProperty(Organization, 'centroid', function (instance) {
            return centroid(instance);
        });

        Organization.validates({
            country: {
                required: true,
                length: {
                    min: 1,
                    max: 64
                }
            },
            email: {
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
                numeric: true
            },
            teams: {
                required: true,
                length: {
                    min: 1
                }
            }
        });

        return Organization;
    }]);


