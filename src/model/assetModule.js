var sdkModelAsset = angular.module('ag.sdk.model.asset', ['ag.sdk.library', 'ag.sdk.model.base', 'ag.sdk.model.liability', 'ag.sdk.model.production-schedule']);

sdkModelAsset.factory('Asset', ['$filter', 'attachmentHelper', 'computedProperty', 'inheritModel', 'Liability', 'Model', 'moment', 'privateProperty', 'ProductionSchedule', 'readOnlyProperty', 'underscore',
    function ($filter, attachmentHelper, computedProperty, inheritModel, Liability, Model, moment, privateProperty, ProductionSchedule, readOnlyProperty, underscore) {
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

            privateProperty(this, 'getPhoto', function () {
                return attachmentHelper.findSize(this, 'thumb', 'img/camera.png');
            });

            privateProperty(this, 'getTitle', function (withField, farm) {
                return getTitle(this, withField, farm);
            });

            computedProperty(this, 'age', function (asOfDate) {
                return (this.data.establishedDate ? moment(asOfDate).diff(this.data.establishedDate, 'years', true) : 0);
            });

            computedProperty(this, 'title', function () {
                return getTitle(this, true);
            });

            computedProperty(this, 'description', function () {
                return this.data.description || '';
            });

            computedProperty(this, 'fieldName', function () {
                return this.data.fieldName;
            });

            computedProperty(this, 'size', function () {
                return (this.type !== 'farmland' ? this.data.size : this.data.area);
            });

            // Crop
            privateProperty(this, 'availableCrops', function () {
                return Asset.cropsByType[this.type] || [];
            });

            computedProperty(this, 'crop', function () {
                return this.data.crop;
            });

            computedProperty(this, 'establishedDate', function () {
                return this.data.establishedDate;
            });

            // Value / Liability

            computedProperty(this, 'liquidityTypeTitle', function () {
                return (this.data.liquidityType && this.assetTypes[this.data.liquidityType]) || '';
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
                return Liability.newCopy(liability);
            });

            this.productionSchedules = underscore.map(attrs.productionSchedules, function (schedule) {
                return ProductionSchedule.newCopy(schedule);
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
            'wasteland': 'Homestead & Wasteland',
            'water right': 'Water Rights'
        });

        var _croplandCrops = ['Barley', 'Bean', 'Bean (Broad)', 'Bean (Dry)', 'Bean (Sugar)', 'Bean (Green)', 'Bean (Kidney)', 'Canola', 'Cassava', 'Cotton', 'Cowpea', 'Grain Sorghum', 'Groundnut', 'Maize', 'Maize (White)', 'Maize (Yellow)', 'Oat', 'Peanut', 'Pearl Millet', 'Potato', 'Rape', 'Rice', 'Rye', 'Soya Bean', 'Sunflower', 'Sweet Corn', 'Sweet Potato', 'Tobacco', 'Triticale', 'Wheat', 'Wheat (Durum)'];
        var _grazingCrops = ['Bahia-Notatum', 'Birdsfoot Trefoil', 'Bottle Brush', 'Buffalo', 'Buffalo (Blue)', 'Buffalo (White)', 'Bush', 'Carribean Stylo', 'Clover', 'Clover (Arrow Leaf)', 'Clover (Crimson)', 'Clover (Persian)', 'Clover (Red)', 'Clover (Rose)', 'Clover (Strawberry)', 'Clover (Subterranean)', 'Clover (White)', 'Cocksfoot', 'Common Setaria', 'Dallis', 'Kikuyu', 'Lucerne', 'Lupin', 'Lupin (Narrow Leaf)', 'Lupin (White)', 'Lupin (Yellow)', 'Medic', 'Medic (Barrel)', 'Medic (Burr)', 'Medic (Gama)', 'Medic (Snail)', 'Medic (Strand)', 'Phalaris', 'Rescue', 'Rhodes', 'Russian Grass', 'Ryegrass', 'Ryegrass (Hybrid)', 'Ryegrass (Italian)', 'Ryegrass (Westerwolds)', 'Serradella', 'Serradella (Yellow)', 'Silver Leaf Desmodium', 'Smuts Finger', 'Soutbos', 'Tall Fescue', 'Teff', 'Veld', 'Weeping Lovegrass'];
        var _perennialCrops = ['Almond', 'Aloe', 'Apple', 'Apricot', 'Avocado', 'Banana', 'Cherry', 'Coconut', 'Coffee', 'Fig', 'Grape', 'Grape (Bush Vine)', 'Grape (Red)', 'Grape (Table)', 'Grape (White)', 'Grapefruit', 'Guava', 'Hops', 'Kiwi Fruit', 'Lemon', 'Litchi', 'Macadamia Nut', 'Mandarin', 'Mango', 'Nectarine', 'Olive', 'Orange', 'Papaya', 'Peach', 'Pear', 'Prickly Pear', 'Pecan Nut', 'Persimmon', 'Pineapple', 'Pistachio Nut', 'Plum', 'Rooibos', 'Sisal', 'Walnut'];
        var _plantationCrops = ['Bluegum', 'Pine', 'Sugarcane', 'Tea', 'Wattle'];

        readOnlyProperty(Asset, 'cropsByType', {
            'crop': _croplandCrops,
            'cropland': _croplandCrops,
            'livestock': _grazingCrops,
            'pasture': _grazingCrops,
            'permanent crop': _perennialCrops,
            'plantation': _plantationCrops
        });

        readOnlyProperty(Asset, 'liquidityTypes', {
            'long-term': 'Long-term',
            'medium-term': 'Movable',
            'short-term': 'Current'
        });

        readOnlyProperty(Asset, 'liquidityCategories', {
            'long-term': ['Fixed Improvements', 'Investments', 'Land', 'Other'],
            'medium-term': ['Breeding Stock', 'Vehicles, Machinery & Equipment', 'Other'],
            'short-term': ['Crops & Crop Products', 'Cash on Hand', 'Debtors', 'Short-term Investments', 'Prepaid Expenses', 'Production Inputs', 'Life Insurance', 'Livestock Products', 'Marketable Livestock', 'Negotiable Securities', 'Other']
        });

        readOnlyProperty(Asset, 'assetTypesWithOther', underscore.extend({
            'other': 'Other'
        }, Asset.assetTypes));

        privateProperty(Asset, 'getTypeTitle', function (type) {
            return Asset.assetTypes[type] || '';
        });

        privateProperty(Asset, 'getTitleType', function (title) {
            var keys = underscore.keys(Asset.assetTypes);

            return keys[underscore.values(Asset.assetTypes).indexOf(title)];
        });

        function getTitle (instance, withField, farm) {
            switch (instance.type) {
                case 'crop':
                case 'permanent crop':
                case 'plantation':
                    return (instance.data.plantedArea ? $filter('number')(instance.data.plantedArea, 2) + 'ha' : '') +
                        (instance.data.plantedArea && instance.data.crop ? ' of ' : '') +
                        (instance.data.crop ? instance.data.crop : '') +
                        (withField && instance.data.fieldName ? ' on field ' + instance.data.fieldName : '') +
                        (farm ? ' on farm ' + farm.name : '');
                case 'farmland':
                    return (instance.data.label ? instance.data.label :
                        (instance.data.portionLabel ? instance.data.portionLabel :
                            (instance.data.portionNumber ? 'Ptn. ' + instance.data.portionNumber : 'Rem. extent of farm')));
                case 'cropland':
                    return (instance.data.irrigation ? instance.data.irrigation + ' irrigated' :
                            (instance.data.irrigated ? 'Irrigated' + (instance.data.equipped ? ', equipped' : ', unequipped') : 'Non irrigable'))
                        + ' ' + instance.type + (instance.data.waterSource ? ' from ' + instance.data.waterSource : '') +
                        (withField && instance.data.fieldName ? ' on field ' + instance.data.fieldName : '') +
                        (farm ? ' on farm ' + farm.name : '');
                case 'livestock':
                    return instance.data.type + (instance.data.category ? ' - ' + instance.data.category : '');
                case 'pasture':
                    return (instance.data.intensified ? (instance.data.crop ? instance.data.crop + ' intensified ' : 'Intensified ') + instance.type : 'Natural grazing') +
                        (withField && instance.data.fieldName ? ' on field ' + instance.data.fieldName : '') +
                        (farm ? ' on farm ' + farm.name : '');
                case 'vme':
                    return instance.data.category + (instance.data.model ? ' model ' + instance.data.model : '');
                case 'wasteland':
                    return 'Homestead & Wasteland';
                case 'water source':
                case 'water right':
                    return instance.data.waterSource +
                        (withField && instance.data.fieldName ? ' on field ' + instance.data.fieldName : '') +
                        (farm ? ' on farm ' + farm.name : '');
                default:
                    return instance.data.name || instance.data.category || instance.assetTypes[instance.type];
            }
        }

        Asset.validates({
            crop: {
                requiredIf: function (value, instance, field) {
                    return underscore.contains(['crop', 'permanent crop', 'plantation'], instance.type);
                },
                inclusion: {
                    in: function (value, instance, field) {
                        return Asset.cropsByType[instance.type];
                    }
                }
            },
            establishedDate: {
                requiredIf: function (value, instance, field) {
                    return underscore.contains(['permanent crop', 'plantation'], instance.type);
                },
                format: {
                    date: true
                }
            },
            farmId: {
                numeric: true
            },
            fieldName: {
                requiredIf: function (value, instance, field) {
                    return underscore.contains(['crop', 'cropland', 'pasture', 'permanent crop', 'plantation'], instance.type);
                },
                length: {
                    min: 1,
                    max: 255
                }
            },
            legalEntityId: {
                required: true,
                numeric: true
            },
            assetKey: {
                required: true
            },
            size: {
                requiredIf: function (value, instance, field) {
                    return underscore.contains(['crop', 'cropland', 'pasture', 'permanent crop', 'plantation', 'wasteland', 'water right'], instance.type);
                },
                numeric: true
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
