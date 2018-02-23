var sdkModelAsset = angular.module('ag.sdk.model.asset', ['ag.sdk.library', 'ag.sdk.model.base', 'ag.sdk.model.field', 'ag.sdk.model.liability', 'ag.sdk.model.production-schedule']);

sdkModelAsset.factory('AssetBase', ['Base', 'inheritModel', 'Liability', 'Model', 'privateProperty', 'readOnlyProperty', 'underscore',
    function (Base, inheritModel, Liability, Model, privateProperty, readOnlyProperty, underscore) {
        function AssetBase (attrs) {
            Model.Base.apply(this, arguments);

            privateProperty(this, 'generateKey', function (legalEntity, farm) {
                this.assetKey = generateKey(this, legalEntity, farm);

                return this.assetKey;
            });

            privateProperty(this, 'totalLiabilityInRange', function (rangeStart, rangeEnd) {
                return underscore.reduce(this.liabilities, function (total, liability) {
                    return total + liability.totalLiabilityInRange(rangeStart, rangeEnd);
                }, 0);
            });

            this.data = (attrs && attrs.data ? attrs.data : {});
            Base.initializeObject(this.data, 'attachments', []);

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.id = attrs.id || attrs.$id;
            this.assetKey = attrs.assetKey;
            this.legalEntityId = attrs.legalEntityId;
            this.type = attrs.type;

            this.liabilities = underscore.map(attrs.liabilities, Liability.newCopy);
        }

        function generateKey (instance, legalEntity, farm) {
            return  (legalEntity ? 'entity.' + legalEntity.uuid : '') +
                (instance.type !== 'farmland' && farm ? '-f.' + farm.name : '') +
                (instance.type === 'crop' && instance.data.season ? '-s.' + instance.data.season : '') +
                (instance.data.fieldName ? '-fi.' + instance.data.fieldName : '') +
                (instance.data.crop ? '-c.' + instance.data.crop : '') +
                (instance.type === 'cropland' && instance.data.irrigated ? '-i.' + instance.data.irrigation : '') +
                (instance.type === 'farmland' && instance.data.sgKey ? '-' + instance.data.sgKey : '') +
                (instance.type === 'improvement' || instance.type === 'livestock' || instance.type === 'vme' ?
                    (instance.data.type ? '-t.' + instance.data.type : '') +
                    (instance.data.category ? '-c.' + instance.data.category : '') +
                    (instance.data.name ? '-n.' + instance.data.name : '') +
                    (instance.data.purpose ? '-p.' + instance.data.purpose : '') +
                    (instance.data.model ? '-m.' + instance.data.model : '') +
                    (instance.data.identificationNo ? '-in.' + instance.data.identificationNo : '') : '') +
                (instance.type === 'stock' ?
                    (instance.data.type ? '-t.' + instance.data.type : '') +
                    (instance.data.category ? '-c.' + instance.data.category : '') +
                    (instance.data.product ? '-p.' + instance.data.product : '') : '') +
                (instance.data.waterSource ? '-ws.' + instance.data.waterSource : '') +
                (instance.type === 'other' ? (instance.data.name ? '-n.' + instance.data.name : '') : '');
        }

        inheritModel(AssetBase, Model.Base);

        readOnlyProperty(AssetBase, 'assetTypes', {
            'crop': 'Crops',
            'farmland': 'Farmlands',
            'improvement': 'Fixed Improvements',
            'cropland': 'Cropland',
            'livestock': 'Livestock',
            'pasture': 'Pastures',
            'permanent crop': 'Permanent Crops',
            'plantation': 'Plantations',
            'stock': 'Stock',
            'vme': 'Vehicles, Machinery & Equipment',
            'wasteland': 'Homestead & Wasteland',
            'water right': 'Water Rights'
        });

        readOnlyProperty(AssetBase, 'assetTypesWithOther', underscore.extend({
            'other': 'Other'
        }, AssetBase.assetTypes));

        privateProperty(AssetBase, 'getAssetKey', function (asset, legalEntity, farm) {
            return generateKey(asset, legalEntity, farm);
        });

        privateProperty(AssetBase, 'getTypeTitle', function (type) {
            return AssetBase.assetTypes[type] || '';
        });

        privateProperty(AssetBase, 'getTitleType', function (title) {
            var keys = underscore.keys(AssetBase.assetTypes);

            return keys[underscore.values(AssetBase.assetTypes).indexOf(title)];
        });

        AssetBase.validates({
            assetKey: {
                required: true
            },
            data: {
                required: true,
                object: true
            },
            legalEntityId: {
                required: true,
                numeric: true
            },
            type: {
                required: true,
                inclusion: {
                    in: underscore.keys(AssetBase.assetTypesWithOther)
                }
            }
        });

        return AssetBase;
    }]);

sdkModelAsset.factory('AssetFactory', ['Asset', 'Livestock', 'Stock',
    function (Asset, Livestock, Stock) {
        function apply (attrs, fnName) {
            switch (attrs.type) {
                case 'livestock':
                    return Livestock[fnName](attrs);
                case 'stock':
                    return Stock[fnName](attrs);
            }

            return Asset[fnName](attrs);
        }

        return {
            new: function (attrs) {
                return apply(attrs, 'new');
            },
            newCopy: function (attrs) {
                return apply(attrs, 'newCopy');
            }
        }
    }]);

sdkModelAsset.factory('Asset', ['$filter', 'AssetBase', 'attachmentHelper', 'Base', 'computedProperty', 'Field', 'inheritModel', 'moment', 'naturalSort', 'privateProperty', 'ProductionSchedule', 'readOnlyProperty', 'underscore',
    function ($filter, AssetBase, attachmentHelper, Base, computedProperty, Field, inheritModel, moment, naturalSort, privateProperty, ProductionSchedule, readOnlyProperty, underscore) {
        function Asset (attrs) {
            AssetBase.apply(this, arguments);

            privateProperty(this, 'generateUniqueName', function (categoryLabel, assets) {
                this.data.name = generateUniqueName(this, categoryLabel, assets);
            });

            privateProperty(this, 'getCategories', function () {
                return Asset.categories[this.type] || [];
            });

            privateProperty(this, 'getPhoto', function () {
                return attachmentHelper.findSize(this, 'thumb', 'img/camera.png');
            });

            privateProperty(this, 'getTitle', function (withField, farm) {
                return getTitle(this, withField, farm);
            });

            privateProperty(this, 'isFieldApplicable', function (field) {
                return isFieldApplicable(this, field);
            });

            privateProperty(this, 'clean', function () {
                if (this.type === 'vme') {
                    this.data.quantity = (this.data.identificationNo && this.data.identificationNo.length > 0 ? 1 : this.data.quantity);
                    this.data.identificationNo = (this.data.quantity !== 1 ? '' : this.data.identificationNo);
                } else if (this.type === 'cropland') {
                    this.data.equipped = (this.data.irrigated ? this.data.equipped : false);
                }
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

            Base.initializeObject(this.data, 'zones', []);

            this.farmId = attrs.farmId;

            this.productionSchedules = underscore.map(attrs.productionSchedules, function (schedule) {
                return ProductionSchedule.newCopy(schedule);
            });

            if (!this.data.assetValuePerHa && this.data.assetValue && this.size) {
                this.data.assetValuePerHa = (this.data.assetValue / this.size);
                this.$dirty = true;
            }
        }

        inheritModel(Asset, AssetBase);

        readOnlyProperty(Asset, 'categories', {
            improvement: [
                {category: 'Airport', subCategory: 'Hangar'},
                {category: 'Airport', subCategory: 'Helipad'},
                {category: 'Airport', subCategory: 'Runway'},
                {category: 'Poultry', subCategory: 'Hatchery'},
                {category: 'Aquaculture', subCategory: 'Pond'},
                {category: 'Aquaculture', subCategory: 'Net House'},
                {category: 'Aviary'},
                {category: 'Beekeeping'},
                {category: 'Borehole'},
                {category: 'Borehole', subCategory: 'Equipped'},
                {category: 'Borehole', subCategory: 'Pump'},
                {category: 'Borehole', subCategory: 'Windmill'},
                {category: 'Poultry', subCategory: 'Broiler House'},
                {category: 'Poultry', subCategory: 'Broiler House - Atmosphere'},
                {category: 'Poultry', subCategory: 'Broiler House - Semi'},
                {category: 'Poultry', subCategory: 'Broiler House - Zinc'},
                {category: 'Building', subCategory: 'Administrative'},
                {category: 'Building'},
                {category: 'Building', subCategory: 'Commercial'},
                {category: 'Building', subCategory: 'Entrance'},
                {category: 'Building', subCategory: 'Lean-to'},
                {category: 'Building', subCategory: 'Outbuilding'},
                {category: 'Building', subCategory: 'Gate'},
                {category: 'Cold Storage'},
                {category: 'Commercial', subCategory: 'Coffee Shop'},
                {category: 'Commercial', subCategory: 'Sales Facility'},
                {category: 'Commercial', subCategory: 'Shop'},
                {category: 'Commercial', subCategory: 'Bar'},
                {category: 'Commercial', subCategory: 'Café'},
                {category: 'Commercial', subCategory: 'Restaurant'},
                {category: 'Commercial', subCategory: 'Factory'},
                {category: 'Commercial', subCategory: 'Tasting Facility'},
                {category: 'Commercial', subCategory: 'Cloth House'},
                {category: 'Compost', subCategory: 'Preparing Unit'},
                {category: 'Crocodile Dam'},
                {category: 'Crop Processing', subCategory: 'Degreening Room'},
                {category: 'Crop Processing', subCategory: 'Dehusking Facility'},
                {category: 'Crop Processing', subCategory: 'Drying Facility'},
                {category: 'Crop Processing', subCategory: 'Drying Tunnels'},
                {category: 'Crop Processing', subCategory: 'Sorting Facility'},
                {category: 'Crop Processing', subCategory: 'Drying Oven'},
                {category: 'Crop Processing', subCategory: 'Drying Racks'},
                {category: 'Crop Processing', subCategory: 'Crushing Plant'},
                {category: 'Crop Processing', subCategory: 'Nut Cracking Facility'},
                {category: 'Crop Processing', subCategory: 'Nut Factory'},
                {category: 'Dairy'},
                {category: 'Dairy', subCategory: 'Pasteurising Facility'},
                {category: 'Dairy', subCategory: 'Milking Parlour'},
                {category: 'Dam'},
                {category: 'Dam', subCategory: 'Filter'},
                {category: 'Dam', subCategory: 'Trout'},
                {category: 'Domestic', subCategory: 'Chicken Coop'},
                {category: 'Domestic', subCategory: 'Chicken Run'},
                {category: 'Domestic', subCategory: 'Kennels'},
                {category: 'Domestic', subCategory: 'Gardening Facility'},
                {category: 'Education', subCategory: 'Conference Room'},
                {category: 'Education', subCategory: 'Classroom'},
                {category: 'Education', subCategory: 'Crèche'},
                {category: 'Education', subCategory: 'School'},
                {category: 'Education', subCategory: 'Training Facility'},
                {category: 'Equipment', subCategory: 'Air Conditioner'},
                {category: 'Equipment', subCategory: 'Gantry'},
                {category: 'Equipment', subCategory: 'Oven'},
                {category: 'Equipment', subCategory: 'Pump'},
                {category: 'Equipment', subCategory: 'Pumphouse'},
                {category: 'Equipment', subCategory: 'Scale'},
                {category: 'Feed Mill'},
                {category: 'Feedlot'},
                {category: 'Fencing'},
                {category: 'Fencing', subCategory: 'Electric'},
                {category: 'Fencing', subCategory: 'Game'},
                {category: 'Fencing', subCategory: 'Perimeter'},
                {category: 'Fencing', subCategory: 'Security'},
                {category: 'Fencing', subCategory: 'Wire'},
                {category: 'Fuel', subCategory: 'Tanks'},
                {category: 'Fuel', subCategory: 'Tank Stand'},
                {category: 'Fuel', subCategory: 'Fuelling Facility'},
                {category: 'Grain Mill'},
                {category: 'Greenhouse'},
                {category: 'Infrastructure'},
                {category: 'Irrigation', subCategory: 'Sprinklers'},
                {category: 'Irrigation'},
                {category: 'Laboratory'},
                {category: 'Livestock Handling', subCategory: 'Auction Facility'},
                {category: 'Livestock Handling', subCategory: 'Cages'},
                {category: 'Livestock Handling', subCategory: 'Growing House'},
                {category: 'Livestock Handling', subCategory: 'Pens'},
                {category: 'Livestock Handling', subCategory: 'Shelter'},
                {category: 'Livestock Handling', subCategory: 'Breeding Facility'},
                {category: 'Livestock Handling', subCategory: 'Culling Shed'},
                {category: 'Livestock Handling', subCategory: 'Dipping Facility'},
                {category: 'Livestock Handling', subCategory: 'Elephant Enclosures'},
                {category: 'Livestock Handling', subCategory: 'Feed Troughs/Dispensers'},
                {category: 'Livestock Handling', subCategory: 'Horse Walker'},
                {category: 'Livestock Handling', subCategory: 'Maternity Shelter/Pen'},
                {category: 'Livestock Handling', subCategory: 'Quarantine Area'},
                {category: 'Livestock Handling', subCategory: 'Rehab Facility'},
                {category: 'Livestock Handling', subCategory: 'Shearing Facility'},
                {category: 'Livestock Handling', subCategory: 'Stable'},
                {category: 'Livestock Handling', subCategory: 'Surgery'},
                {category: 'Livestock Handling', subCategory: 'Treatment Area'},
                {category: 'Livestock Handling', subCategory: 'Weaner House'},
                {category: 'Livestock Handling', subCategory: 'Grading Facility'},
                {category: 'Livestock Handling', subCategory: 'Inspection Facility'},
                {category: 'Logistics', subCategory: 'Handling Equipment'},
                {category: 'Logistics', subCategory: 'Handling Facility'},
                {category: 'Logistics', subCategory: 'Depot'},
                {category: 'Logistics', subCategory: 'Loading Area'},
                {category: 'Logistics', subCategory: 'Loading Shed'},
                {category: 'Logistics', subCategory: 'Hopper'},
                {category: 'Logistics', subCategory: 'Weigh Bridge'},
                {category: 'Meat Processing', subCategory: 'Abattoir'},
                {category: 'Meat Processing', subCategory: 'Deboning Room'},
                {category: 'Meat Processing', subCategory: 'Skinning Facility'},
                {category: 'Mill'},
                {category: 'Mushrooms', subCategory: 'Cultivation'},
                {category: 'Mushrooms', subCategory: 'Sweat Room'},
                {category: 'Nursery ', subCategory: 'Plant'},
                {category: 'Nursery ', subCategory: 'Plant Growing Facility'},
                {category: 'Office'},
                {category: 'Packaging Facility'},
                {category: 'Paddocks', subCategory: 'Camp'},
                {category: 'Paddocks', subCategory: 'Kraal'},
                {category: 'Paddocks'},
                {category: 'Piggery', subCategory: 'Farrowing House'},
                {category: 'Piggery', subCategory: 'Pig Sty'},
                {category: 'Processing', subCategory: 'Bottling Facility'},
                {category: 'Processing', subCategory: 'Flavour Shed'},
                {category: 'Processing', subCategory: 'Processing Facility'},
                {category: 'Recreation', subCategory: 'Viewing Area'},
                {category: 'Recreation', subCategory: 'BBQ'},
                {category: 'Recreation', subCategory: 'Clubhouse'},
                {category: 'Recreation', subCategory: 'Event Venue'},
                {category: 'Recreation', subCategory: 'Gallery'},
                {category: 'Recreation', subCategory: 'Game Room'},
                {category: 'Recreation', subCategory: 'Gazebo'},
                {category: 'Recreation', subCategory: 'Gymnasium'},
                {category: 'Recreation', subCategory: 'Jacuzzi'},
                {category: 'Recreation', subCategory: 'Judging Booth'},
                {category: 'Recreation', subCategory: 'Museum'},
                {category: 'Recreation', subCategory: 'Play Area'},
                {category: 'Recreation', subCategory: 'Pool House'},
                {category: 'Recreation', subCategory: 'Pottery Room'},
                {category: 'Recreation', subCategory: 'Racing Track'},
                {category: 'Recreation', subCategory: 'Salon'},
                {category: 'Recreation', subCategory: 'Sauna'},
                {category: 'Recreation', subCategory: 'Shooting Range'},
                {category: 'Recreation', subCategory: 'Spa Facility'},
                {category: 'Recreation', subCategory: 'Squash Court'},
                {category: 'Recreation', subCategory: 'Swimming Pool'},
                {category: 'Recreation'},
                {category: 'Religeous', subCategory: 'Church'},
                {category: 'Residential', subCategory: 'Carport'},
                {category: 'Residential', subCategory: 'Driveway'},
                {category: 'Residential', subCategory: 'Flooring'},
                {category: 'Residential', subCategory: 'Paving'},
                {category: 'Residential', subCategory: 'Roofing'},
                {category: 'Residential', subCategory: 'Water Feature'},
                {category: 'Residential', subCategory: 'Hall'},
                {category: 'Residential', subCategory: 'Balcony'},
                {category: 'Residential', subCategory: 'Canopy'},
                {category: 'Residential', subCategory: 'Concrete Surface'},
                {category: 'Residential', subCategory: 'Courtyard'},
                {category: 'Residential', subCategory: 'Covered'},
                {category: 'Residential', subCategory: 'Deck'},
                {category: 'Residential', subCategory: 'Mezzanine'},
                {category: 'Residential', subCategory: 'Parking Area'},
                {category: 'Residential', subCategory: 'Patio'},
                {category: 'Residential', subCategory: 'Porch'},
                {category: 'Residential', subCategory: 'Porte Cochere'},
                {category: 'Residential', subCategory: 'Terrace'},
                {category: 'Residential', subCategory: 'Veranda'},
                {category: 'Residential', subCategory: 'Walkways'},
                {category: 'Residential', subCategory: 'Rondavel'},
                {category: 'Residential', subCategory: 'Accommodation Units'},
                {category: 'Residential', subCategory: 'Boma'},
                {category: 'Residential', subCategory: 'Bungalow'},
                {category: 'Residential', subCategory: 'Bunker'},
                {category: 'Residential', subCategory: 'Cabin'},
                {category: 'Residential', subCategory: 'Chalet'},
                {category: 'Residential', subCategory: 'Community Centre'},
                {category: 'Residential', subCategory: 'Dormitory'},
                {category: 'Residential', subCategory: 'Dwelling'},
                {category: 'Residential', subCategory: 'Flat'},
                {category: 'Residential', subCategory: 'Kitchen'},
                {category: 'Residential', subCategory: 'Lapa'},
                {category: 'Residential', subCategory: 'Laundry Facility'},
                {category: 'Residential', subCategory: 'Locker Room'},
                {category: 'Residential', subCategory: 'Lodge'},
                {category: 'Residential', subCategory: 'Shower'},
                {category: 'Residential', subCategory: 'Toilets'},
                {category: 'Residential', subCategory: 'Room'},
                {category: 'Residential', subCategory: 'Cottage'},
                {category: 'Residential', subCategory: 'Garage'},
                {category: 'Roads', subCategory: 'Access Roads'},
                {category: 'Roads', subCategory: 'Gravel'},
                {category: 'Roads', subCategory: 'Tarred'},
                {category: 'Security', subCategory: 'Control Room'},
                {category: 'Security', subCategory: 'Guardhouse'},
                {category: 'Security', subCategory: 'Office'},
                {category: 'Shade Nets'},
                {category: 'Silo'},
                {category: 'Sports', subCategory: 'Arena'},
                {category: 'Sports', subCategory: 'Tennis Court'},
                {category: 'Staff', subCategory: 'Hostel'},
                {category: 'Staff', subCategory: 'Hut'},
                {category: 'Staff', subCategory: 'Retirement Centre'},
                {category: 'Staff', subCategory: 'Staff Building'},
                {category: 'Staff', subCategory: 'Canteen'},
                {category: 'Staff', subCategory: 'Dining Facility'},
                {category: 'Storage', subCategory: 'Truck Shelter'},
                {category: 'Storage', subCategory: 'Barn'},
                {category: 'Storage', subCategory: 'Dark Room'},
                {category: 'Storage', subCategory: 'Bin Compartments'},
                {category: 'Storage', subCategory: 'Machinery'},
                {category: 'Storage', subCategory: 'Saddle Room'},
                {category: 'Storage', subCategory: 'Shed'},
                {category: 'Storage', subCategory: 'Chemicals'},
                {category: 'Storage', subCategory: 'Tools'},
                {category: 'Storage', subCategory: 'Dry'},
                {category: 'Storage', subCategory: 'Equipment'},
                {category: 'Storage', subCategory: 'Feed'},
                {category: 'Storage', subCategory: 'Fertilizer'},
                {category: 'Storage', subCategory: 'Fuel'},
                {category: 'Storage', subCategory: 'Grain'},
                {category: 'Storage', subCategory: 'Hides'},
                {category: 'Storage', subCategory: 'Oil'},
                {category: 'Storage', subCategory: 'Pesticide'},
                {category: 'Storage', subCategory: 'Poison'},
                {category: 'Storage', subCategory: 'Seed'},
                {category: 'Storage', subCategory: 'Zinc'},
                {category: 'Storage', subCategory: 'Sulphur'},
                {category: 'Storage'},
                {category: 'Storage', subCategory: 'Vitamin Room'},
                {category: 'Sugar Mill'},
                {category: 'Tanks', subCategory: 'Water'},
                {category: 'Timber Mill'},
                {category: 'Trench'},
                {category: 'Utilities', subCategory: 'Battery Room'},
                {category: 'Utilities', subCategory: 'Boiler Room'},
                {category: 'Utilities', subCategory: 'Compressor Room'},
                {category: 'Utilities', subCategory: 'Engine Room'},
                {category: 'Utilities', subCategory: 'Generator'},
                {category: 'Utilities', subCategory: 'Power Room'},
                {category: 'Utilities', subCategory: 'Pumphouse'},
                {category: 'Utilities', subCategory: 'Transformer Room'},
                {category: 'Utilities'},
                {category: 'Vacant Area'},
                {category: 'Vehicles', subCategory: 'Transport Depot'},
                {category: 'Vehicles', subCategory: 'Truck Wash'},
                {category: 'Vehicles', subCategory: 'Workshop'},
                {category: 'Walls'},
                {category: 'Walls', subCategory: 'Boundary'},
                {category: 'Walls', subCategory: 'Retaining'},
                {category: 'Walls', subCategory: 'Security'},
                {category: 'Warehouse'},
                {category: 'Water', subCategory: 'Reservoir'},
                {category: 'Water', subCategory: 'Tower'},
                {category: 'Water', subCategory: 'Purification Plant'},
                {category: 'Water', subCategory: 'Reticulation Works'},
                {category: 'Water', subCategory: 'Filter Station'},
                {category: 'Wine Cellar', subCategory: 'Tanks'},
                {category: 'Wine Cellar'},
                {category: 'Wine Cellar', subCategory: 'Winery'},
                {category: 'Wine Cellar', subCategory: 'Barrel Maturation Room'}
            ],
            livestock: [
                {category: 'Cattle', subCategory: 'Phase A Bulls', purpose: 'Breeding'},
                {category: 'Cattle', subCategory: 'Phase B Bulls', purpose: 'Breeding'},
                {category: 'Cattle', subCategory: 'Phase C Bulls', purpose: 'Breeding'},
                {category: 'Cattle', subCategory: 'Phase D Bulls', purpose: 'Breeding'},
                {category: 'Cattle', subCategory: 'Heifers', purpose: 'Breeding'},
                {category: 'Cattle', subCategory: 'Bull Calves', purpose: 'Breeding'},
                {category: 'Cattle', subCategory: 'Heifer Calves', purpose: 'Breeding'},
                {category: 'Cattle', subCategory: 'Tollies 1-2', purpose: 'Breeding'},
                {category: 'Cattle', subCategory: 'Heifers 1-2', purpose: 'Breeding'},
                {category: 'Cattle', subCategory: 'Culls', purpose: 'Breeding'},
                {category: 'Cattle', subCategory: 'Bulls', purpose: 'Dairy'},
                {category: 'Cattle', subCategory: 'Dry Cows', purpose: 'Dairy'},
                {category: 'Cattle', subCategory: 'Lactating Cows', purpose: 'Dairy'},
                {category: 'Cattle', subCategory: 'Heifers', purpose: 'Dairy'},
                {category: 'Cattle', subCategory: 'Calves', purpose: 'Dairy'},
                {category: 'Cattle', subCategory: 'Culls', purpose: 'Dairy'},
                {category: 'Cattle', subCategory: 'Bulls', purpose: 'Slaughter'},
                {category: 'Cattle', subCategory: 'Cows', purpose: 'Slaughter'},
                {category: 'Cattle', subCategory: 'Heifers', purpose: 'Slaughter'},
                {category: 'Cattle', subCategory: 'Weaners', purpose: 'Slaughter'},
                {category: 'Cattle', subCategory: 'Calves', purpose: 'Slaughter'},
                {category: 'Cattle', subCategory: 'Culls', purpose: 'Slaughter'},
                {category: 'Chickens', subCategory: 'Day Old Chicks', purpose: 'Broilers'},
                {category: 'Chickens', subCategory: 'Broilers', purpose: 'Broilers'},
                {category: 'Chickens', subCategory: 'Hens', purpose: 'Layers'},
                {category: 'Chickens', subCategory: 'Point of Laying Hens', purpose: 'Layers'},
                {category: 'Chickens', subCategory: 'Culls', purpose: 'Layers'},
                {category: 'Game', subCategory: 'Game', purpose: 'Slaughter'},
                {category: 'Goats', subCategory: 'Rams', purpose: 'Slaughter'},
                {category: 'Goats', subCategory: 'Breeding Ewes', purpose: 'Slaughter'},
                {category: 'Goats', subCategory: 'Young Ewes', purpose: 'Slaughter'},
                {category: 'Goats', subCategory: 'Kids', purpose: 'Slaughter'},
                {category: 'Horses', subCategory: 'Horses', purpose: 'Breeding'},
                {category: 'Pigs', subCategory: 'Boars', purpose: 'Slaughter'},
                {category: 'Pigs', subCategory: 'Breeding Sows', purpose: 'Slaughter'},
                {category: 'Pigs', subCategory: 'Weaned pigs', purpose: 'Slaughter'},
                {category: 'Pigs', subCategory: 'Piglets', purpose: 'Slaughter'},
                {category: 'Pigs', subCategory: 'Porkers', purpose: 'Slaughter'},
                {category: 'Pigs', subCategory: 'Baconers', purpose: 'Slaughter'},
                {category: 'Pigs', subCategory: 'Culls', purpose: 'Slaughter'},
                {category: 'Ostriches', subCategory: 'Breeding Stock', purpose: 'Slaughter'},
                {category: 'Ostriches', subCategory: 'Slaughter Birds > 3 months', purpose: 'Slaughter'},
                {category: 'Ostriches', subCategory: 'Slaughter Birds < 3 months', purpose: 'Slaughter'},
                {category: 'Ostriches', subCategory: 'Chicks', purpose: 'Slaughter'},
                {category: 'Rabbits', subCategory: 'Rabbits', purpose: 'Slaughter'},
                {category: 'Sheep', subCategory: 'Rams', purpose: 'Breeding'},
                {category: 'Sheep', subCategory: 'Young Rams', purpose: 'Breeding'},
                {category: 'Sheep', subCategory: 'Ewes', purpose: 'Breeding'},
                {category: 'Sheep', subCategory: 'Young Ewes', purpose: 'Breeding'},
                {category: 'Sheep', subCategory: 'Lambs', purpose: 'Breeding'},
                {category: 'Sheep', subCategory: 'Wethers', purpose: 'Breeding'},
                {category: 'Sheep', subCategory: 'Culls', purpose: 'Breeding'},
                {category: 'Sheep', subCategory: 'Rams', purpose: 'Slaughter'},
                {category: 'Sheep', subCategory: 'Ewes', purpose: 'Slaughter'},
                {category: 'Sheep', subCategory: 'Lambs', purpose: 'Slaughter'},
                {category: 'Sheep', subCategory: 'Wethers', purpose: 'Slaughter'},
                {category: 'Sheep', subCategory: 'Culls', purpose: 'Slaughter'}
            ],
            stock: [
                {category: 'Animal Feed', subCategory: 'Lick', unit: 'kg'},
                {category: 'Indirect Costs', subCategory: 'Fuel', unit: 'l'},
                {category: 'Indirect Costs', subCategory: 'Water', unit: 'l'},
                {category: 'Preharvest', subCategory: 'Seed', unit: 'kg'},
                {category: 'Preharvest', subCategory: 'Plant Material', unit: 'each'},
                {category: 'Preharvest', subCategory: 'Fertiliser', unit: 't'},
                {category: 'Preharvest', subCategory: 'Fungicides', unit: 'l'},
                {category: 'Preharvest', subCategory: 'Lime', unit: 't'},
                {category: 'Preharvest', subCategory: 'Herbicides', unit: 'l'},
                {category: 'Preharvest', subCategory: 'Pesticides', unit: 'l'}
            ],
            vme: [
                {category: 'Vehicles', subCategory: 'Bakkie'},
                {category: 'Vehicles', subCategory: 'Car'},
                {category: 'Vehicles', subCategory: 'Truck'},
                {category: 'Vehicles', subCategory: 'Tractor'},
                {category: 'Machinery', subCategory: 'Mower'},
                {category: 'Machinery', subCategory: 'Mower Conditioner'},
                {category: 'Machinery', subCategory: 'Hay Rake'},
                {category: 'Machinery', subCategory: 'Hay Baler'},
                {category: 'Machinery', subCategory: 'Harvester'},
                {category: 'Equipment', subCategory: 'Plough'},
                {category: 'Equipment', subCategory: 'Harrow'},
                {category: 'Equipment', subCategory: 'Ridgers'},
                {category: 'Equipment', subCategory: 'Rotovator'},
                {category: 'Equipment', subCategory: 'Cultivator'},
                {category: 'Equipment', subCategory: 'Planter'},
                {category: 'Equipment', subCategory: 'Combine'},
                {category: 'Equipment', subCategory: 'Spreader'},
                {category: 'Equipment', subCategory: 'Sprayer'},
                {category: 'Equipment', subCategory: 'Mixer'},
            ]
        });

        readOnlyProperty(Asset, 'landClassesByType', {
            'crop': [
                'Cropland',
                'Cropland (Emerging)',
                'Cropland (Irrigated)',
                'Cropland (Smallholding)',
                'Vegetables'],
            'cropland': [
                'Cropland',
                'Cropland (Emerging)',
                'Cropland (Irrigated)',
                'Cropland (Smallholding)',
                'Vegetables'],
            'farmland': [],
            'improvement': [],
            'livestock': [
                'Grazing',
                'Grazing (Bush)',
                'Grazing (Fynbos)',
                'Grazing (Shrubland)',
                'Planted Pastures'],
            'pasture': [
                'Grazing',
                'Grazing (Bush)',
                'Grazing (Fynbos)',
                'Grazing (Shrubland)',
                'Planted Pastures'],
            'permanent crop': [
                'Greenhouses',
                'Orchard',
                'Orchard (Shadenet)',
                'Vineyard'],
            'plantation': [
                'Forest',
                'Pineapple',
                'Plantation',
                'Plantation (Smallholding)',
                'Sugarcane',
                'Sugarcane (Emerging)',
                'Sugarcane (Irrigated)',
                'Tea'],
            'vme': [],
            'wasteland': [
                'Non-vegetated'],
            'water right': [
                'Water',
                'Water (Seasonal)',
                'Wetland']
        });

        var _croplandCrops = [
            'Barley',
            'Bean',
            'Bean (Broad)',
            'Bean (Dry)',
            'Bean (Sugar)',
            'Bean (Green)',
            'Bean (Kidney)',
            'Beet',
            'Broccoli',
            'Butternut',
            'Cabbage',
            'Canola',
            'Carrot',
            'Cassava',
            'Cauliflower',
            'Cotton',
            'Cowpea',
            'Grain Sorghum',
            'Groundnut',
            'Leek',
            'Lucerne',
            'Maize',
            'Maize (White)',
            'Maize (Yellow)',
            'Oats',
            'Onion',
            'Peanut',
            'Pearl Millet',
            'Potato',
            'Pumpkin',
            'Rapeseed',
            'Rice',
            'Rye',
            'Soya Bean',
            'Sunflower',
            'Sweet Corn',
            'Sweet Potato',
            'Teff',
            'Tobacco',
            'Triticale',
            'Turnip',
            'Wheat',
            'Wheat (Durum)'
        ];
        var _croplandIrrigatedCrops = [
            'Maize (Irrigated)',
            'Soya Bean (Irrigated)',
            'Teff (Irrigated)',
            'Wheat (Irrigated)'
        ];
        var _croplandAllCrops = underscore.union(_croplandCrops, _croplandIrrigatedCrops).sort(naturalSort);
        var _grazingCrops = [
            'Bahia-Notatum',
            'Birdsfoot Trefoil',
            'Bottle Brush',
            'Buffalo',
            'Buffalo (Blue)',
            'Buffalo (White)',
            'Bush',
            'Carribean Stylo',
            'Clover',
            'Clover (Arrow Leaf)',
            'Clover (Crimson)',
            'Clover (Persian)',
            'Clover (Red)',
            'Clover (Rose)',
            'Clover (Strawberry)',
            'Clover (Subterranean)',
            'Clover (White)',
            'Cocksfoot',
            'Common Setaria',
            'Dallis',
            'Kikuyu',
            'Lucerne',
            'Lupin',
            'Lupin (Narrow Leaf)',
            'Lupin (White)',
            'Lupin (Yellow)',
            'Medic',
            'Medic (Barrel)',
            'Medic (Burr)',
            'Medic (Gama)',
            'Medic (Snail)',
            'Medic (Strand)',
            'Multispecies Pasture',
            'Phalaris',
            'Rescue',
            'Rhodes',
            'Russian Grass',
            'Ryegrass',
            'Ryegrass (Hybrid)',
            'Ryegrass (Italian)',
            'Ryegrass (Westerwolds)',
            'Serradella',
            'Serradella (Yellow)',
            'Silver Leaf Desmodium',
            'Smuts Finger',
            'Soutbos',
            'Tall Fescue',
            'Teff',
            'Veld',
            'Weeping Lovegrass'
        ];
        var _perennialCrops = [
            'Almond',
            'Apple',
            'Apricot',
            'Avocado',
            'Banana',
            'Barberry',
            'Berry',
            'Bilberry',
            'Blackberry',
            'Blueberry',
            'Cherry',
            'Cloudberry',
            'Coconut',
            'Coffee',
            'Fig',
            'Gooseberry',
            'Grapefruit',
            'Guava',
            'Hazelnut',
            'Kiwi Fruit',
            'Kumquat',
            'Lemon',
            'Lime',
            'Litchi',
            'Macadamia Nut',
            'Mandarin',
            'Mango',
            'Mulberry',
            'Nectarine',
            'Olive',
            'Orange',
            'Papaya',
            'Peach',
            'Pear',
            'Prickly Pear',
            'Pecan Nut',
            'Persimmon',
            'Pistachio Nut',
            'Plum',
            'Pomegranate',
            'Protea',
            'Prune',
            'Raspberry',
            'Rooibos',
            'Roses',
            'Strawberry',
            'Walnut',
            'Wineberry'
        ];
        var _plantationCrops = [
            'Aloe',
            'Bluegum',
            'Hops',
            'Pine',
            'Pineapple',
            'Tea',
            'Sisal',
            'Sugarcane',
            'Sugarcane (Irrigated)',
            'Wattle'
        ];
        var _vegetableCrops = [
            'Chicory',
            'Chili',
            'Garlic',
            'Lentil',
            'Melon',
            'Olive',
            'Onion',
            'Pea',
            'Pumpkin',
            'Quince',
            'Strawberry',
            'Tomato',
            'Watermelon',
            'Carrot',
            'Beet',
            'Cauliflower',
            'Broccoli',
            'Leek',
            'Butternut',
            'Cabbage',
            'Rapeseed'
        ];
        var _vineyardCrops = [
            'Grape',
            'Grape (Bush Vine)',
            'Grape (Red)',
            'Grape (Table)',
            'Grape (White)'
        ];

        readOnlyProperty(Asset, 'cropsByLandClass', {
            'Cropland': _croplandCrops,
            'Cropland (Emerging)': _croplandCrops,
            'Cropland (Irrigated)': _croplandIrrigatedCrops,
            'Cropland (Smallholding)': _croplandCrops,
            'Forest': ['Pine'],
            'Grazing': _grazingCrops,
            'Grazing (Bush)': _grazingCrops,
            'Grazing (Fynbos)': _grazingCrops,
            'Grazing (Shrubland)': _grazingCrops,
            'Greenhouses': [],
            'Orchard': _perennialCrops,
            'Orchard (Shadenet)': _perennialCrops,
            'Pineapple': ['Pineapple'],
            'Plantation': _plantationCrops,
            'Plantation (Smallholding)': _plantationCrops,
            'Planted Pastures': _grazingCrops,
            'Sugarcane': ['Sugarcane'],
            'Sugarcane (Emerging)': ['Sugarcane'],
            'Sugarcane (Irrigated)': ['Sugarcane (Irrigated)'],
            'Tea': ['Tea'],
            'Vegetables': _vegetableCrops,
            'Vineyard': _vineyardCrops
        });

        readOnlyProperty(Asset, 'cropsByType', {
            'crop': _croplandAllCrops,
            'cropland': _croplandAllCrops,
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

        readOnlyProperty(Asset, 'conditions', ['Good', 'Good to fair', 'Fair', 'Fair to poor', 'Poor']);

        readOnlyProperty(Asset, 'seasons', ['Cape', 'Summer', 'Fruit', 'Winter']);

        privateProperty(Asset, 'getCropsByLandClass', function (landClass) {
            return Asset.cropsByLandClass[landClass] || [];
        });

        privateProperty(Asset, 'getDefaultCrop', function (landClass) {
            return (underscore.size(Asset.cropsByLandClass[landClass]) === 1 ? underscore.first(Asset.cropsByLandClass[landClass]) : undefined);
        });

        privateProperty(Asset, 'getTitle', function (asset, withField, farm) {
            return getTitle(asset, withField, farm);
        });
        
        privateProperty(Asset, 'listServiceMap', function (asset, metadata) {
            return listServiceMap(asset, metadata);
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
                    return instance.data.name || instance.data.category || Asset.assetTypes[instance.type];
            }
        }
        
        function listServiceMap (instance, metadata) {
            var map = {
                id: instance.id || instance.$id,
                type: instance.type,
                updatedAt: instance.updatedAt
            };

            if (instance.data) {
                map.title = getTitle(instance, true);
                map.groupby = instance.farmId;
                map.thumbnailUrl = attachmentHelper.findSize(instance, 'thumb', 'img/camera.png');

                switch (instance.type) {
                    case 'crop':
                        map.subtitle = (instance.data.season ? instance.data.season : '');
                        break;
                    case 'cropland':
                    case 'pasture':
                    case 'wasteland':
                    case 'water right':
                        map.subtitle = (instance.data.size !== undefined ? 'Area: ' + $filter('number')(instance.data.size, 2) + 'ha' : 'Unknown area');
                        break;
                    case 'farmland':
                        map.subtitle = (instance.data.area !== undefined ? 'Area: ' + $filter('number')(instance.data.area, 2) + 'ha' : 'Unknown area');
                        break;
                    case 'permanent crop':
                    case 'plantation':
                        map.subtitle = (instance.data.establishedDate ? 'Established: ' + $filter('date')(instance.data.establishedDate, 'dd/MM/yy') : '');
                        break;
                    case 'improvement':
                        map.subtitle = instance.data.type + (instance.data.category ? ' - ' + instance.data.category : '');
                        map.summary = (instance.data.description || '');
                        break;
                    case 'livestock':
                        map.subtitle = (instance.data.breed ? instance.data.breed + ' for ' : 'For ') + instance.data.purpose;
                        map.summary = (instance.data.description || '');
                        map.groupby = instance.data.type;
                        break;
                    case 'vme':
                        map.subtitle = 'Quantity: ' + instance.data.quantity;
                        map.summary = (instance.data.description || '');
                        map.groupby = instance.data.type;
                        break;
                }
            }

            if (metadata) {
                map = underscore.extend(map, metadata);
            }

            return map;
        }

        function generateUniqueName (instance, categoryLabel, assets) {
            categoryLabel = categoryLabel || '';

            var assetCount = underscore.chain(assets)
                .where({type: instance.type})
                .reduce(function(assetCount, asset) {
                    if (asset.data.name) {
                        var index = asset.data.name.search(/\s+[0-9]+$/),
                            name = asset.data.name,
                            number;

                        if (index !== -1) {
                            name = name.substr(0, index);
                            number = parseInt(asset.data.name.substring(index).trim());
                        }

                        if (categoryLabel && name === categoryLabel && (!number || number > assetCount)) {
                            assetCount = number || 1;
                        }
                    }

                    return assetCount;
                }, -1)
                .value();

            return categoryLabel + (assetCount + 1 ? ' ' + (assetCount + 1) : '');
        }

        function isFieldApplicable (instance, field) {
            return underscore.contains(Asset.landClassesByType[instance.type], Field.new(field).landUse);
        }

        Asset.validates({
            crop: {
                requiredIf: function (value, instance) {
                    return underscore.contains(['crop', 'permanent crop', 'plantation'], instance.type);
                },
                inclusion: {
                    in: function (value, instance) {
                        return Asset.cropsByType[instance.type];
                    }
                }
            },
            establishedDate: {
                requiredIf: function (value, instance) {
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
                requiredIf: function (value, instance) {
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
                requiredIf: function (value, instance) {
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
