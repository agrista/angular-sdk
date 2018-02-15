var sdkModelMapTheme = angular.module('ag.sdk.model.map-theme', ['ag.sdk.library', 'ag.sdk.model.base']);

sdkModelMapTheme.factory('MapTheme', ['Base', 'inheritModel', 'Model', 'privateProperty', 'readOnlyProperty', 'underscore',
    function (Base, inheritModel, Model, privateProperty, readOnlyProperty, underscore) {
        function MapTheme (attrs) {
            Model.Base.apply(this, arguments);

            this.data = (attrs && attrs.data) || {};
            Base.initializeObject(this.data, 'categories', []);

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.id = attrs.id || attrs.$id;
            this.name = attrs.name;
            this.organizationId = attrs.organizationId;

            // Models
            this.organization = attrs.organization;

            checkVersion(this);
        }

        function checkVersion(instance) {
            switch (instance.data.version) {
                case undefined:
                    instance.data = underscore.extend({
                        baseStyle: (instance.data.baseTile && MapTheme.baseStyles[instance.data.baseTile] ? instance.data.baseTile : 'Agriculture'),
                        categories: instance.data.categories,
                        center: instance.data.center,
                        zoom: {
                            value: instance.data.zoom
                        }
                    }, MapTheme.baseStyles[instance.data.baseTile] || MapTheme.baseStyles['Agriculture']);
            }

            instance.data.version = MapTheme.version;
        }

        inheritModel(MapTheme, Model.Base);

        readOnlyProperty(MapTheme, 'version', 1);

        readOnlyProperty(MapTheme, 'baseStyles', {
            'Agriculture': {
                style: 'mapbox://styles/agrista/cjdmrq0wu0iq02so2sevccwlm',
                sources: [],
                layers: []
            },
            'Satellite': {
                style: 'mapbox://styles/agrista/cjdmt8w570l3r2sql91xzgmbn',
                sources: [],
                layers: []
            },
            'Light': {
                style: 'mapbox://styles/agrista/cjdmt9c8q0mr02srgvyfo2qwg',
                sources: [],
                layers: []
            },
            'Dark': {
                style: 'mapbox://styles/agrista/cjdmt9w8d0o8x2so2xpcu4mm0',
                sources: [],
                layers: []
            }
        });

        MapTheme.validates({
            data: {
                required: true,
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
                required: true,
                numeric: true
            }
        });

        return MapTheme;
    }]);
