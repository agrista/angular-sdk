var sdkModelFarm = angular.module('ag.sdk.model.farm', ['ag.sdk.library', 'ag.sdk.model.base']);

sdkModelFarm.factory('Farm', ['Base', 'inheritModel', 'Model', 'privateProperty', 'readOnlyProperty', 'underscore',
    function (Base, inheritModel, Model, privateProperty, readOnlyProperty, underscore) {
        function Farm (attrs) {
            Model.Base.apply(this, arguments);

            this.data = (attrs && attrs.data) || {};
            Base.initializeObject(this.data, 'fields', []);
            Base.initializeObject(this.data, 'gates', []);
            Base.initializeObject(this.data, 'ignoredLandClasses', []);

            privateProperty(this, 'farmNameUnique', function (name, farms) {
                return farmNameUnique(this, name, farms);
            });

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.id = attrs.id || attrs.$id;
            this.name = attrs.name;
            this.organizationId = attrs.organizationId;

            // Models
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
