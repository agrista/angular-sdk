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
                    min: 1,
                    max: 255
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
                required: false,
                numeric: true
            },
            province: {
                required: true,
                length: {
                    min: 1,
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


sdkModelLayer.factory('Sublayer', ['inheritModel', 'Model', 'privateProperty', 'readOnlyProperty', 'topologySuite', 'underscore',
    function (inheritModel, Model, privateProperty, readOnlyProperty, topologySuite, underscore) {
        function Sublayer (attrs) {
            Model.Base.apply(this, arguments);

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.id = attrs.id || attrs.$id;
            this.code = attrs.code;
            this.comments = attrs.comments;
            this.createdAt = attrs.createdAt;
            this.createdBy = attrs.createdBy;
            this.geometry = attrs.geometry;
            this.name = attrs.name;
            this.organizationId = attrs.organizationId;
            this.regionId = attrs.regionId;
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

        Sublayer.validates({
            code: {
                required: false,
                length: {
                    min: 1,
                    max: 255
                }
            },
            comments: {
                required: false,
                length: {
                    min: 1,
                    max: 255
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
