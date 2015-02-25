var sdkModelAsset = angular.module('ag.sdk.model.asset', ['ag.sdk.library', 'ag.sdk.model.base']);

sdkModelAsset.factory('Asset', ['inheritModel', 'Model', 'readOnlyProperty', 'underscore',
    function (inheritModel, Model, readOnlyProperty, underscore) {
        function Asset (attrs) {
            Model.Base.apply(this, arguments);

            if (arguments.length === 0) return;

            this.id = attrs.id;
            this.type = attrs.type;
            this.organizationId = attrs.organizationId;

            this.data = attrs.data || {};
        }

        inheritModel(Asset, Model.Base);

        readOnlyProperty(Asset, 'assetTypes', {
            'crop': 'Crop'
        });

        Asset.validates({
            type: {
                required: true,
                inclusion: {
                    in: underscore.keys(Asset.assetTypes)
                }
            },
            organizationId: {
                required: true,
                numeric: true
            }
        });

        return Asset;
    }]);
