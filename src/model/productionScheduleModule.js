var sdkModelProductionSchedule = angular.module('ag.sdk.model.production-schedule', ['ag.sdk.library', 'ag.sdk.model.base']);

sdkModelProductionSchedule.factory('ProductionSchedule', ['inheritModel', 'Model', 'privateProperty', 'readOnlyProperty', 'underscore',
    function (inheritModel, Model, privateProperty, readOnlyProperty, underscore) {
        function ProductionSchedule (attrs) {
            Model.Base.apply(this, arguments);

            this.data = (attrs && attrs.data) || {};

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.assetId = attrs.assetId;
            this.budgetUuid = attrs.budgetUuid;
            this.type = attrs.type;
            this.endDate = attrs.endDate;
            this.id = attrs.id || attrs.$id;
            this.organizationId = attrs.organizationId;
            this.startDate = attrs.startDate;

            this.asset = attrs.asset;
            this.budget = attrs.budget;
            this.organization = attrs.organization;
        }

        inheritModel(ProductionSchedule, Model.Base);

        readOnlyProperty(ProductionSchedule, 'productionScheduleTypes', {
            crop: 'Crop',
            horticulture: 'Horticulture',
            livestock: 'Livestock'
        });

        readOnlyProperty(ProductionSchedule, 'allowedAssets', ['cropland', 'pasture', 'permanent crop']);

        privateProperty(ProductionSchedule, 'getTypeTitle', function (type) {
            return ProductionSchedule.productionScheduleTypes[type] || '';
        });

        ProductionSchedule.validates({
            assetId: {
                required: true,
                numeric: true
            },
            budgetUuid: {
                required: true,
                format: {
                    uuid: true
                }
            },
            endDate: {
                required: true,
                format: {
                    date: true
                }
            },
            organizationId: {
                required: true,
                numeric: true
            },
            startDate: {
                required: true,
                format: {
                    date: true
                }
            }
        });

        return ProductionSchedule;
    }]);
