var sdkModelOrganization = angular.module('ag.sdk.model.organization', ['ag.sdk.library', 'ag.sdk.model.base']);

sdkModelOrganization.provider('Organization', ['listServiceMapProvider', function (listServiceMapProvider) {
    this.$get = ['Locale', 'Base', 'computedProperty', 'geoJSONHelper', 'inheritModel', 'privateProperty', 'readOnlyProperty', 'topologyHelper', 'underscore',
        function (Locale, Base, computedProperty, geoJSONHelper, inheritModel, privateProperty, readOnlyProperty, topologyHelper, underscore) {
            function Organization (attrs) {
                Locale.apply(this, arguments);

                computedProperty(this, 'isActive', function () {
                    return this.status === 'active';
                });

                // Geom
                privateProperty(this, 'contains', function (geojson) {
                    return contains(this, geojson);
                });

                privateProperty(this, 'centroid', function () {
                    return centroid(this);
                });

                privateProperty(this, 'location', function () {
                    var centroid = this.centroid();

                    return (this.data.loc ?
                        geoJSONHelper(this.data.loc).getCenter() :
                        centroid ? centroid : this.countryLocale.coordinates);
                });

                this.data = (attrs && attrs.data) || {};
                Base.initializeObject(this.data, 'attachments', []);
                Base.initializeObject(this.data, 'baseStyles', {});

                if (underscore.isUndefined(attrs) || arguments.length === 0) return;

                this.id = attrs.id || attrs.$id;
                this.createdAt = attrs.createdAt;
                this.createdBy = attrs.createdBy;
                this.customerId = attrs.customerId;
                this.customerNumber = attrs.customerNumber;
                this.email = attrs.email;
                this.hostUrl = attrs.hostUrl;
                this.legalEntities = attrs.legalEntities || [];
                this.name = attrs.name;
                this.originHost = attrs.originHost;
                this.originPort = attrs.originPort;
                this.primaryContact = attrs.primaryContact;
                this.pointsOfInterest = attrs.pointsOfInterest || [];
                this.productionRegion = attrs.productionRegion;
                this.registered = attrs.registered;
                this.status = attrs.status;
                this.subscriptionPlan = attrs.subscriptionPlan;
                this.tags = attrs.tags || [];
                this.teams = attrs.teams || [];
                this.type = attrs.type;
                this.updatedAt = attrs.updatedAt;
                this.updatedBy = attrs.updatedBy;
                this.uuid = attrs.uuid;
            }

            function centroid (instance) {
                var geom = getAssetGeom(instance),
                    coord = (geom ? geom.getCentroid().getCoordinate() : geom);

                return (coord ? [coord.x, coord.y] : coord);
            }

            function contains (instance, geojson) {
                var farmGeom = getAssetGeom(instance),
                    queryGeom = topologyHelper.readGeoJSON(geojson);

                return (farmGeom && queryGeom ? farmGeom.contains(queryGeom) : false);
            }

            function getAssetGeom (instance) {
                return underscore.chain(instance.legalEntities)
                    .pluck('assets')
                    .flatten().compact()
                    .filter(function (asset) {
                        return asset.data && asset.data.loc;
                    })
                    .reduce(function (geom, asset) {
                        var assetGeom = geoJSONHelper(asset.data.loc).geometry();

                        return (geom && assetGeom.isValid() ? geom.union(assetGeom) : geom || assetGeom);
                    }, null)
                    .value();
            }

            inheritModel(Organization, Locale);

            privateProperty(Organization, 'contains', function (instance, geojson) {
                return contains(instance, geojson);
            });

            privateProperty(Organization, 'centroid', function (instance) {
                return centroid(instance);
            });

            privateProperty(Organization, 'types', {
                'farmer': 'Farmer',
                'merchant': 'AgriBusiness'
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
                },
                teams: {
                    required: true,
                    length: {
                        min: 1
                    }
                }
            });

            return Organization;
        }];

    listServiceMapProvider.add('organization', ['attachmentHelper', 'Organization', 'underscore', function (attachmentHelper, Organization, underscore) {
        var tagMap = {
            'danger': ['Duplicate Farmland', 'Duplicate Legal Entities'],
            'warning': ['No CIF', 'No Farmland', 'No Homestead', 'No Segmentation']
        };

        function searchingIndex (item) {
            return underscore.chain(item.legalEntities)
                .map(function (entity) {
                    return underscore.compact([entity.cifKey, entity.name, entity.registrationNumber]);
                })
                .flatten()
                .uniq()
                .value()
        }

        return function (item) {
            return {
                id: item.id || item.$id,
                title: item.name,
                subtitle: (item.type && Organization.types[item.type] || '') + (item.customerId ? (item.type ? ': ' : '') + item.customerId : ''),
                thumbnailUrl: attachmentHelper.findSize(item, 'thumb', 'img/profile-business.png'),
                searchingIndex: searchingIndex(item),
                pills: underscore.chain(tagMap)
                    .mapObject(function (values) {
                        return underscore.chain(item.tags)
                            .pluck('name')
                            .filter(function (tag) {
                                return underscore.contains(values, tag);
                            })
                            .value();
                    })
                    .omit(function (values) {
                        return underscore.isEmpty(values);
                    })
                    .value()
            };
        };
    }]);
}]);

sdkModelOrganization.provider('OrganizationFactory', function () {
    var instances = {};

    this.add = function (type, modelName) {
        instances[type] = modelName;
    };

    this.$get = ['$injector', 'Organization', function ($injector, Organization) {
        function apply (attrs, fnName) {
            if (instances[attrs.type]) {
                initInstance(attrs.type);

                return instances[attrs.type][fnName](attrs);
            }

            return Organization[fnName](attrs);
        }

        function initInstance(type) {
            if (instances[type] && typeof instances[type] === 'string') {
                instances[type] = $injector.get(instances[type]);
            }
        }

        return {
            isInstanceOf: function (organization) {
                if (organization) {
                    initInstance(organization.type);

                    return (instances[organization.type] ?
                            organization instanceof instances[organization.type] :
                            organization instanceof Organization);
                }

                return false;
            },
            new: function (attrs) {
                return apply(attrs, 'new');
            },
            newCopy: function (attrs) {
                return apply(attrs, 'newCopy');
            }
        }
    }];
});
