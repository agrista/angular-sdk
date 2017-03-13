var sdkModelLayer= angular.module('ag.sdk.model.layer', ['ag.sdk.library', 'ag.sdk.model.base', 'ag.sdk.geospatial']);

sdkModelLayer.factory('Layer', ['inheritModel', 'Model', 'privateProperty', 'readOnlyProperty', 'underscore',
    function (inheritModel, Model, privateProperty, readOnlyProperty, underscore) {
        function Layer (attrs) {
            Model.Base.apply(this, arguments);

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.id = attrs.id || attrs.$id;
            this.comments = attrs.comments;
            this.createdAt = attrs.createdAt;
            this.createdBy = attrs.createdBy;
            this.geometry = attrs.geometry;
            this.name = attrs.name;
            this.organizationId = attrs.organizationId;
            this.province = attrs.province;
            this.type = attrs.type;
            this.updatedAt = attrs.updatedAt;
            this.updatedBy = attrs.updatedBy;

            this.organization = attrs.organization;
            this.sublayers = attrs.sublayers;
        }

        inheritModel(Layer, Model.Base);

        privateProperty(Layer, 'listMap', function (item) {
            return {
                title: item.name,
                subtitle: item.province
            }
        });

        Layer.validates({
            comments: {
                required: false,
                length: {
                    min: 0,
                    max: 255
                }
            },
            geometry: {
                required: false,
                object: true
            },
            name: {
                required: true,
                length: {
                    min: 1,
                    max: 255
                }
            },
            organizationId: {
                required: false,
                numeric: true
            },
            province: {
                required: false,
                length: {
                    min: 0,
                    max: 255
                }
            },
            type: {
                required: true,
                length: {
                    min: 1,
                    max: 255
                }
            }
        });

        return Layer;
    }]);


sdkModelLayer.factory('Sublayer', ['computedProperty', 'inheritModel', 'Model', 'privateProperty', 'readOnlyProperty', 'topologyHelper', 'underscore',
    function (computedProperty, inheritModel, Model, privateProperty, readOnlyProperty, topologyHelper, underscore) {
        function Sublayer (attrs) {
            Model.Base.apply(this, arguments);

            computedProperty(this, 'geom', function () {
                return topologyHelper.readGeoJSON(this.geometry);
            });

            privateProperty(this, 'contains', function (geometry) {
                return geometryRelation(this, 'contains', geometry);
            });

            privateProperty(this, 'covers', function (geometry) {
                return geometryRelation(this, 'covers', geometry);
            });

            privateProperty(this, 'crosses', function (geometry) {
                return geometryRelation(this, 'crosses', geometry);
            });

            privateProperty(this, 'intersects', function (geometry) {
                return geometryRelation(this, 'intersects', geometry);
            });

            privateProperty(this, 'overlaps', function (geometry) {
                return geometryRelation(this, 'overlaps', geometry);
            });

            privateProperty(this, 'touches', function (geometry) {
                return geometryRelation(this, 'touches', geometry);
            });

            privateProperty(this, 'within', function (geometry) {
                return geometryRelation(this, 'within', geometry);
            });

            privateProperty(this, 'withinOrCovers', function (geometry) {
                return (geometryRelation(this, 'within', geometry) ||
                    (geometryRelation(this, 'intersects', geometry) && geometryArea(geometryManipluation(this, 'difference', geometry)) < 0.001));
            });

            privateProperty(this, 'subtract', function (geometry) {
                var geom = saveGeometryManipluation(this, 'difference', geometry);

                if (geometryArea(geom) == 0) {
                    this.geometry = undefined;
                }
            });

            privateProperty(this, 'add', function (geometry) {
                saveGeometryManipluation(this, 'union', geometry);
            });

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.id = attrs.id || attrs.$id;
            this.data = attrs.data;
            this.code = attrs.code;
            this.comments = attrs.comments;
            this.createdAt = attrs.createdAt;
            this.createdBy = attrs.createdBy;
            this.geometry = attrs.geometry;
            this.name = attrs.name;
            this.organizationId = attrs.organizationId;
            this.layerId = attrs.layerId;
            this.type = attrs.type;
            this.updatedAt = attrs.updatedAt;
            this.updatedBy = attrs.updatedBy;

            this.organization = attrs.organization;
            this.layer = attrs.layer;
        }

        inheritModel(Sublayer, Model.Base);

        privateProperty(Sublayer, 'listMap', function (item) {
            return {
                title: item.name,
                subtitle: item.layer.province + (item.code ? ' - ' + item.code : ''),
                layer: item.layer.name
            }
        });

        function geometryArea (geometry) {
            return (geometry && geometry.getArea());
        }

        function geometryEmpty (geometry) {
            return (geometry && geometry.isEmpty());
        }

        function geometryRelation (instance, relation, geometry) {
            var geom = instance.geom;

            return (geom && geometry && geom[relation] ? geom[relation](geometry) : false);
        }

        function geometryManipluation (instance, manipluation, geometry) {
            var geom = instance.geom;

            return (geom && geometry && geom[manipluation] ? geom[manipluation](geometry) : geom);
        }

        function saveGeometryManipluation (instance, manipluation, geometry) {
            var geom = geometryManipluation(instance, manipluation, geometry);

            if (geom) {
                instance.$dirty = true;
                instance.geometry = topologyHelper.writeGeoJSON(geom);
            }

            return geom;
        }

        Sublayer.validates({
            data: {
                required: false,
                object: true
            },
            code: {
                required: false,
                length: {
                    min: 0,
                    max: 255
                }
            },
            comments: {
                required: false,
                length: {
                    min: 0,
                    max: 255
                }
            },
            geometry: {
                required: true,
                object: true
            },
            layerId: {
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
                required: false,
                numeric: true
            },
            type: {
                required: true,
                length: {
                    min: 1,
                    max: 255
                }
            }
        });

        return Sublayer;
    }]);
