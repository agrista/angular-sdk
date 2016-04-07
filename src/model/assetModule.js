var sdkModelAsset = angular.module('ag.sdk.model.asset', ['ag.sdk.library', 'ag.sdk.model.base', 'ag.sdk.model.liability', 'ag.sdk.model.production-schedule']);

sdkModelAsset.factory('Asset', ['$filter', 'computedProperty', 'inheritModel', 'Liability', 'Model', 'moment', 'privateProperty', 'ProductionSchedule', 'readOnlyProperty', 'underscore',
    function ($filter, computedProperty, inheritModel, Liability, Model, moment, privateProperty, ProductionSchedule, readOnlyProperty, underscore) {
        function Asset (attrs) {
            Model.Base.apply(this, arguments);

            this.data = (attrs && attrs.data ? attrs.data : {});

            privateProperty(this, 'generateKey', function (legalEntity, farm) {
                this.assetKey = (legalEntity ? 'entity.' + legalEntity.uuid : '') +
                (this.type !== 'farmland' && farm ? '-f.' + farm.name : '') +
                (this.type === 'crop' && this.data.season ? '-s.' + this.data.season : '') +
                (this.data.fieldName ? '-fi.' + this.data.fieldName : '') +
                (this.data.crop ? '-c.' + this.data.crop : '') +
                (this.type === 'cropland' && this.data.irrigated ? '-i.' + this.data.irrigation : '') +
                (this.type === 'farmland' && this.data.sgKey ? '-' + this.data.sgKey : '') +
                (this.type === 'improvement' || this.type === 'livestock' || this.type === 'vme' ?
                (this.data.type ? '-t.' + this.data.type : '') +
                (this.data.category ? '-c.' + this.data.category : '') +
                (this.data.name ? '-n.' + this.data.name : '') +
                (this.data.purpose ? '-p.' + this.data.purpose : '') +
                (this.data.model ? '-m.' + this.data.model : '') +
                (this.data.identificationNo ? '-in.' + this.data.identificationNo : '') : '') +
                (this.data.waterSource ? '-ws.' + this.data.waterSource : '') +
                (this.type === 'other' ? (this.data.name ? '-n.' + this.data.name : '') : '');
            });

            computedProperty(this, 'age', function (asOfDate) {
                return (this.data.establishedDate ? moment(asOfDate).diff(this.data.establishedDate, 'years', true) : 0);
            });

            computedProperty(this, 'title', function () {
                switch (this.type) {
                    case 'crop':
                    case 'permanent crop':
                    case 'plantation':
                        return (this.data.plantedArea ? $filter('number')(this.data.plantedArea, 2) + 'Ha' : '') +
                            (this.data.plantedArea && this.data.crop ? ' of ' : '') +
                            (this.data.crop ? this.data.crop : '') +
                            (this.data.fieldName ? ' on field ' + this.data.fieldName : '');
                    case 'farmland':
                        return (this.data.portionLabel ? this.data.portionLabel :
                            (this.data.portionNumber ? 'Portion ' + this.data.portionNumber : 'Remainder of farm'));
                    case 'cropland':
                        return (this.data.equipped ? 'Irrigated ' + this.type + ' (' + (this.data.irrigation ? this.data.irrigation + ' irrigation from ' : '')
                            + this.data.waterSource + ')' : (this.data.irrigated ? 'Irrigable, unequipped ' : 'Non irrigable ') + this.type)
                            + (this.data.fieldName ? ' on field ' + this.data.fieldName : '');
                    case 'livestock':
                        return this.data.type + (this.data.category ? ' - ' + this.data.category : '');
                    case 'pasture':
                        return (this.data.intensified ? (this.data.crop || 'Intensified pasture') : 'Natural grazing') +
                            (this.data.fieldName ? ' on field ' + this.data.fieldName : '');
                    case 'vme':
                        return this.data.category + (this.data.model ? ' model ' + this.data.model : '');
                    case 'wasteland':
                        return 'Wasteland';
                    case 'water source':
                    case 'water right':
                        return this.data.waterSource + (this.data.fieldName ? ' on field ' + this.data.fieldName : '');
                    default:
                        return this.data.name || this.assetTypes[this.type];
                }
            });

            computedProperty(this, 'liquidityTypeTitle', function () {
                return (this.data.liquidityType && this.assetTypes[this.data.liquidityType]) || '';
            });

            computedProperty(this, 'description', function () {
                return this.data.description || '';
            });

            privateProperty(this, 'incomeInRange', function (rangeStart, rangeEnd) {
                var income = {};

                if (this.data.sold === true && this.data.salePrice && moment(this.data.soldDate, 'YYYY-MM-DD').isBetween(rangeStart, rangeEnd)) {
                    income['Sales'] = this.data.salePrice;
                }

                return income;
            });

            privateProperty(this, 'totalIncomeInRange', function (rangeStart, rangeEnd) {
                return underscore.reduce(this.incomeInRange(rangeStart, rangeEnd), function (total, value) {
                    return total + (value || 0);
                }, 0);
            });

            privateProperty(this, 'totalLiabilityInRange', function (rangeStart, rangeEnd) {
                return underscore.reduce(this.liabilities, function (total, liability) {
                    return total + liability.totalLiabilityInRange(rangeStart, rangeEnd);
                }, 0);
            });

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.id = attrs.id || attrs.$id;
            this.assetKey = attrs.assetKey;
            this.farmId = attrs.farmId;
            this.legalEntityId = attrs.legalEntityId;

            this.liabilities = underscore.map(attrs.liabilities, function (liability) {
                return Liability.new(liability);
            });

            this.productionSchedules = underscore.map(attrs.productionSchedules, function (schedule) {
                return ProductionSchedule.new(schedule);
            });

            this.type = attrs.type;
        }

        inheritModel(Asset, Model.Base);

        readOnlyProperty(Asset, 'assetTypes', {
            'crop': 'Crops',
            'farmland': 'Farmlands',
            'improvement': 'Fixed Improvements',
            'cropland': 'Cropland',
            'livestock': 'Livestock',
            'pasture': 'Pastures',
            'permanent crop': 'Permanent Crops',
            'plantation': 'Plantations',
            'vme': 'Vehicles, Machinery & Equipment',
            'wasteland': 'Wasteland',
            'water right': 'Water Rights'
        });

        readOnlyProperty(Asset, 'liquidityTypes', {
            'long-term': 'Long-term',
            'medium-term': 'Movable',
            'short-term': 'Current'
        });

        readOnlyProperty(Asset, 'assetTypesWithOther', underscore.extend({
            'other': 'Other'
        }, Asset.assetTypes));

        Asset.validates({
            farmId: {
                numeric: true
            },
            legalEntityId: {
                required: true,
                numeric: true
            },
            assetKey: {
                required: true
            },
            type: {
                required: true,
                inclusion: {
                    in: underscore.keys(Asset.assetTypesWithOther)
                }
            }
        });

        return Asset;
    }]);
