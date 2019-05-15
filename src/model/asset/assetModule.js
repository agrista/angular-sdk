var sdkModelAsset = angular.module('ag.sdk.model.asset', ['ag.sdk.library', 'ag.sdk.model.base', 'ag.sdk.model.field', 'ag.sdk.model.liability', 'ag.sdk.model.production-schedule']);

sdkModelAsset.factory('AssetBase', ['Base', 'computedProperty', 'inheritModel', 'Liability', 'Model', 'moment', 'privateProperty', 'readOnlyProperty', 'safeMath', 'underscore',
    function (Base, computedProperty, inheritModel, Liability, Model, moment, privateProperty, readOnlyProperty, safeMath, underscore) {
        function AssetBase (attrs) {
            Model.Base.apply(this, arguments);

            privateProperty(this, 'generateKey', function (legalEntity, farm) {
                this.assetKey = generateKey(this, legalEntity, farm);

                return this.assetKey;
            });

            computedProperty(this, 'hasGeometry', function () {
                return !underscore.isUndefined(this.data.loc);
            });

            privateProperty(this, 'totalLiabilityInRange', function (rangeStart, rangeEnd) {
                return underscore.reduce(this.liabilities, function (total, liability) {
                    return safeMath.plus(total, liability.totalLiabilityInRange(rangeStart, rangeEnd));
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
                (instance.data.fieldName ? '-fi.' + instance.data.fieldName : '') +
                (instance.data.crop ? '-c.' + instance.data.crop : '') +
                (instance.type === 'crop' && instance.data.plantedDate ? '-pd.' + moment(instance.data.plantedDate).format('YYYY-MM-DD') : '') +
                (underscore.contains(['permanent crop', 'plantation'], instance.type) && instance.data.establishedDate ? '-ed.' + moment(instance.data.establishedDate).format('YYYY-MM-DD') : '') +
                (instance.type === 'cropland' && instance.data.irrigated ? '-i.' + instance.data.irrigation : '') +
                (instance.type === 'farmland' && instance.data.sgKey ? '-' + instance.data.sgKey : '') +
                (underscore.contains(['improvement', 'livestock', 'vme'], instance.type) ?
                    (instance.data.type ? '-t.' + instance.data.type : '') +
                    (instance.data.category ? '-c.' + instance.data.category : '') +
                    (instance.data.name ? '-n.' + instance.data.name : '') +
                    (instance.data.purpose ? '-p.' + instance.data.purpose : '') +
                    (instance.data.model ? '-m.' + instance.data.model : '') +
                    (instance.data.identificationNo ? '-in.' + instance.data.identificationNo : '') : '') +
                (instance.type === 'stock' ?
                    (instance.data.type ? '-t.' + instance.data.type : '') +
                    (instance.data.category ? '-c.' + instance.data.category : '') +
                    (instance.data.product ? '-pr.' + instance.data.product : '') : '') +
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

sdkModelAsset.factory('AssetGroup', ['Asset', 'AssetFactory', 'computedProperty', 'inheritModel', 'Model', 'privateProperty', 'safeMath', 'underscore',
    function (Asset, AssetFactory, computedProperty, inheritModel, Model, privateProperty, safeMath, underscore) {
        function AssetGroup (attrs) {
            Model.Base.apply(this, arguments);

            this.data = (attrs && attrs.data ? attrs.data : {});

            this.assets = [];

            privateProperty(this, 'addAsset', function (asset) {
                addAsset(this, asset);
            });

            privateProperty(this, 'adjustProperty', function (property, value) {
                adjustProperty(this, property, value);
            });

            privateProperty(this, 'availableCrops', function (field) {
                return (field && field.landUse ? Asset.cropsByLandClass[field.landUse] : Asset.cropsByType[this.type]) || [];
            });

            computedProperty(this, 'hasGeometry', function () {
                return underscore.some(this.assets, function (asset) {
                    return !underscore.isUndefined(asset.data.loc);
                });
            });

            privateProperty(this, 'recalculate', function () {
                recalculate(this);
            });

            underscore.each(attrs.assets, this.addAsset, this);
        }

        inheritModel(AssetGroup, Model.Base);

        var commonProps = ['areaUnit', 'unitValue'];

        var dataProps = {
            'crop': ['crop', 'irrigated', 'irrigation'],
            'cropland': ['crop', 'croppingPotential', 'irrigated', 'irrigation'],
            'improvement': ['category', 'type'],
            'pasture': ['condition', 'crop', 'grazingCapacity', 'irrigated', 'irrigation', 'terrain'],
            'permanent crop': ['condition', 'crop', 'establishedDate', 'establishedYear', 'irrigated', 'irrigation'],
            'plantation': ['condition', 'crop', 'establishedDate', 'establishedYear', 'irrigated', 'irrigation'],
            'water right': ['waterSource']
        };

        function addAsset (instance, asset) {
            asset = (AssetFactory.isInstanceOf(asset) ? asset : AssetFactory.new(asset));

            if (underscore.isUndefined(instance.type) || instance.type === asset.type) {
                instance.type = asset.type;
                instance.assets = underscore.chain(instance.assets)
                    .reject(function (item) {
                        return item.assetKey === asset.assetKey;
                    })
                    .union([asset])
                    .value();

                underscore.each(commonProps, setPropFromAsset(instance, asset));
                underscore.each(dataProps[instance.type], setPropFromAsset(instance, asset));

                instance.recalculate();
            }
        }

        function setPropFromAsset (instance, asset) {
            return function (prop) {
                if (!underscore.isUndefined(asset.data[prop])) {
                    instance.data[prop] = asset.data[prop];
                }
            }
        }

        function adjustProperty (instance, property, value) {
            underscore.each(instance.assets, function (asset) {
                if (asset.data[property] !== instance.data[property]) {
                    asset.data[property] = instance.data[property];
                    asset.data.assetValue = safeMath.times(asset.data.unitValue, asset.data.size);
                    asset.$dirty = true;
                }
            });
        }

        function recalculate (instance) {
            instance.data = underscore.extend(instance.data, underscore.reduce(instance.assets, function (totals, asset) {
                totals.size = safeMath.plus(totals.size, asset.data.size);
                totals.assetValue = safeMath.plus(totals.assetValue, (asset.data.assetValue ? asset.data.assetValue : safeMath.times(asset.data.unitValue, asset.data.size)));
                totals.unitValue = (totals.size > 0 ? safeMath.dividedBy(totals.assetValue, totals.size) : totals.unitValue || asset.data.unitValue || 0);

                return totals;
            }, {}));

            instance.data.assetValue = (instance.data.size && instance.data.unitValue ?
                safeMath.times(instance.data.unitValue, instance.data.size) :
                instance.data.assetValue);
        }

        return AssetGroup;
    }]);

sdkModelAsset.factory('Asset', ['AssetBase', 'attachmentHelper', 'Base', 'computedProperty', 'Field', 'inheritModel', 'moment', 'naturalSort', 'privateProperty', 'readOnlyProperty', 'safeMath', 'underscore',
    function (AssetBase, attachmentHelper, Base, computedProperty, Field, inheritModel, moment, naturalSort, privateProperty, readOnlyProperty, safeMath, underscore) {
        function Asset (attrs) {
            AssetBase.apply(this, arguments);

            privateProperty(this, 'generateUniqueName', function (categoryLabel, assets) {
                this.data.name = generateUniqueName(this, categoryLabel, assets);
            });

            privateProperty(this, 'getAge', function (asOfDate) {
                return (this.data.establishedDate ? moment(asOfDate).diff(this.data.establishedDate, 'years', true) : 0);
            });

            privateProperty(this, 'getCategories', function () {
                return Asset.categories[this.type] || [];
            });

            privateProperty(this, 'getCustomTitle', function (props, options) {
                return getCustomTitle(this, props, options);
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

            computedProperty(this, 'thumbnailUrl', function () {
                return getThumbnailUrl(this);
            });

            computedProperty(this, 'age', function () {
                return (this.data.establishedDate ? moment().diff(this.data.establishedDate, 'years', true) : 0);
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

            computedProperty(this, 'farmRequired', function () {
                return farmRequired(this);
            });

            privateProperty(this, 'unitSize', function (unit) {
                return convertValue(this, unit, (this.type !== 'farmland' ? 'size' : 'area'));
            });

            privateProperty(this, 'unitValue', function (unit) {
                return (this.data.valuePerHa ?
                    convertUnitValue(this, unit, 'ha', 'valuePerHa') :
                    convertValue(this, unit, 'unitValue'));
            });

            // Crop
            privateProperty(this, 'availableCrops', function (field) {
                return (field && field.landUse ? Asset.cropsByLandClass[field.landUse] : Asset.cropsByType[this.type]) || [];
            });

            computedProperty(this, 'crop', function () {
                return this.data.crop;
            });

            computedProperty(this, 'establishedDate', function () {
                return this.data.establishedDate;
            });

            computedProperty(this, 'plantedDate', function () {
                return this.data.plantedDate;
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
                    return safeMath.plus(total, value);
                }, 0);
            });

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.farmId = attrs.farmId;

            if (!this.data.valuePerHa && this.data.assetValue && this.size) {
                this.data.valuePerHa = safeMath.dividedBy(this.data.assetValue, this.size);
                this.$dirty = true;
            }

            if (!this.data.unitValue && this.data.valuePerHa) {
                this.data.unitValue = this.data.valuePerHa;
                this.data.areaUnit = 'ha';
                this.$dirty = true;
            }
        }

        var unitConversions = {
            'sm/ha': function (value) {
                return safeMath.dividedBy(value, 10000);
            },
            'ha/sm': function (value) {
                return safeMath.times(value, 10000);
            }
        };

        function convertValue (instance, toUnit, prop) {
            var unit = instance.data.areaUnit || 'ha';

            return convertUnitValue(instance, toUnit, unit, prop);
        }

        function convertUnitValue (instance, toUnit, unit, prop) {
            var unitConversion = unitConversions[unit + '/' + toUnit],
                value = instance.data[prop];

            return (unit === toUnit ? value : unitConversion && unitConversion(value));
        }

        inheritModel(Asset, AssetBase);

        function categoryMapper (keys) {
            return function (items) {
                return underscore.object(underscore.first(keys, items.length), items);
            }
        }

        readOnlyProperty(Asset, 'categories', {
            improvement: underscore.map([
                ['Airport', 'Hangar'],
                ['Airport', 'Helipad'],
                ['Airport', 'Runway'],
                ['Poultry', 'Hatchery'],
                ['Aquaculture', 'Pond'],
                ['Aquaculture', 'Net House'],
                ['Aviary'],
                ['Beekeeping'],
                ['Borehole'],
                ['Borehole', 'Equipped'],
                ['Borehole', 'Pump'],
                ['Borehole', 'Windmill'],
                ['Poultry', 'Broiler House'],
                ['Poultry', 'Broiler House - Atmosphere'],
                ['Poultry', 'Broiler House - Semi'],
                ['Poultry', 'Broiler House - Zinc'],
                ['Building', 'Administrative'],
                ['Building'],
                ['Building', 'Commercial'],
                ['Building', 'Entrance'],
                ['Building', 'Lean-to'],
                ['Building', 'Outbuilding'],
                ['Building', 'Gate'],
                ['Cold Storage'],
                ['Commercial', 'Coffee Shop'],
                ['Commercial', 'Sales Facility'],
                ['Commercial', 'Shop'],
                ['Commercial', 'Bar'],
                ['Commercial', 'Café'],
                ['Commercial', 'Restaurant'],
                ['Commercial', 'Factory'],
                ['Commercial', 'Tasting Facility'],
                ['Commercial', 'Cloth House'],
                ['Compost', 'Preparing Unit'],
                ['Crocodile Dam'],
                ['Crop Processing', 'Degreening Room'],
                ['Crop Processing', 'Dehusking Facility'],
                ['Crop Processing', 'Drying Facility'],
                ['Crop Processing', 'Drying Tunnels'],
                ['Crop Processing', 'Sorting Facility'],
                ['Crop Processing', 'Drying Oven'],
                ['Crop Processing', 'Drying Racks'],
                ['Crop Processing', 'Crushing Plant'],
                ['Crop Processing', 'Nut Cracking Facility'],
                ['Crop Processing', 'Nut Factory'],
                ['Dairy'],
                ['Dairy', 'Pasteurising Facility'],
                ['Dairy', 'Milking Parlour'],
                ['Dam'],
                ['Dam', 'Filter'],
                ['Dam', 'Trout'],
                ['Domestic', 'Chicken Coop'],
                ['Domestic', 'Chicken Run'],
                ['Domestic', 'Kennels'],
                ['Domestic', 'Gardening Facility'],
                ['Education', 'Conference Room'],
                ['Education', 'Classroom'],
                ['Education', 'Crèche'],
                ['Education', 'School'],
                ['Education', 'Training Facility'],
                ['Equipment', 'Air Conditioner'],
                ['Equipment', 'Gantry'],
                ['Equipment', 'Oven'],
                ['Equipment', 'Pump'],
                ['Equipment', 'Pumphouse'],
                ['Equipment', 'Scale'],
                ['Feed Mill'],
                ['Feedlot'],
                ['Fencing'],
                ['Fencing', 'Electric'],
                ['Fencing', 'Game'],
                ['Fencing', 'Perimeter'],
                ['Fencing', 'Security'],
                ['Fencing', 'Wire'],
                ['Fuel', 'Tanks'],
                ['Fuel', 'Tank Stand'],
                ['Fuel', 'Fuelling Facility'],
                ['Grain Mill'],
                ['Greenhouse'],
                ['Infrastructure'],
                ['Irrigation', 'Sprinklers'],
                ['Irrigation'],
                ['Laboratory'],
                ['Livestock Handling', 'Auction Facility'],
                ['Livestock Handling', 'Cages'],
                ['Livestock Handling', 'Growing House'],
                ['Livestock Handling', 'Pens'],
                ['Livestock Handling', 'Shelter'],
                ['Livestock Handling', 'Breeding Facility'],
                ['Livestock Handling', 'Culling Shed'],
                ['Livestock Handling', 'Dipping Facility'],
                ['Livestock Handling', 'Elephant Enclosures'],
                ['Livestock Handling', 'Feed Troughs/Dispensers'],
                ['Livestock Handling', 'Horse Walker'],
                ['Livestock Handling', 'Maternity Shelter/Pen'],
                ['Livestock Handling', 'Quarantine Area'],
                ['Livestock Handling', 'Rehab Facility'],
                ['Livestock Handling', 'Shearing Facility'],
                ['Livestock Handling', 'Stable'],
                ['Livestock Handling', 'Surgery'],
                ['Livestock Handling', 'Treatment Area'],
                ['Livestock Handling', 'Weaner House'],
                ['Livestock Handling', 'Grading Facility'],
                ['Livestock Handling', 'Inspection Facility'],
                ['Logistics', 'Handling Equipment'],
                ['Logistics', 'Handling Facility'],
                ['Logistics', 'Depot'],
                ['Logistics', 'Loading Area'],
                ['Logistics', 'Loading Shed'],
                ['Logistics', 'Hopper'],
                ['Logistics', 'Weigh Bridge'],
                ['Meat Processing', 'Abattoir'],
                ['Meat Processing', 'Deboning Room'],
                ['Meat Processing', 'Skinning Facility'],
                ['Mill'],
                ['Mushrooms', 'Cultivation'],
                ['Mushrooms', 'Sweat Room'],
                ['Nursery ', 'Plant'],
                ['Nursery ', 'Plant Growing Facility'],
                ['Office'],
                ['Packaging Facility'],
                ['Paddocks', 'Camp'],
                ['Paddocks', 'Kraal'],
                ['Paddocks'],
                ['Piggery', 'Farrowing House'],
                ['Piggery', 'Pig Sty'],
                ['Processing', 'Bottling Facility'],
                ['Processing', 'Flavour Shed'],
                ['Processing', 'Processing Facility'],
                ['Recreation', 'Viewing Area'],
                ['Recreation', 'BBQ'],
                ['Recreation', 'Clubhouse'],
                ['Recreation', 'Event Venue'],
                ['Recreation', 'Gallery'],
                ['Recreation', 'Game Room'],
                ['Recreation', 'Gazebo'],
                ['Recreation', 'Gymnasium'],
                ['Recreation', 'Jacuzzi'],
                ['Recreation', 'Judging Booth'],
                ['Recreation', 'Museum'],
                ['Recreation', 'Play Area'],
                ['Recreation', 'Pool House'],
                ['Recreation', 'Pottery Room'],
                ['Recreation', 'Racing Track'],
                ['Recreation', 'Salon'],
                ['Recreation', 'Sauna'],
                ['Recreation', 'Shooting Range'],
                ['Recreation', 'Spa Facility'],
                ['Recreation', 'Squash Court'],
                ['Recreation', 'Swimming Pool'],
                ['Recreation'],
                ['Religious', 'Church'],
                ['Residential', 'Carport'],
                ['Residential', 'Driveway'],
                ['Residential', 'Flooring'],
                ['Residential', 'Paving'],
                ['Residential', 'Roofing'],
                ['Residential', 'Water Feature'],
                ['Residential', 'Hall'],
                ['Residential', 'Balcony'],
                ['Residential', 'Canopy'],
                ['Residential', 'Concrete Surface'],
                ['Residential', 'Courtyard'],
                ['Residential', 'Covered'],
                ['Residential', 'Deck'],
                ['Residential', 'Mezzanine'],
                ['Residential', 'Parking Area'],
                ['Residential', 'Patio'],
                ['Residential', 'Porch'],
                ['Residential', 'Porte Cochere'],
                ['Residential', 'Terrace'],
                ['Residential', 'Veranda'],
                ['Residential', 'Walkways'],
                ['Residential', 'Rondavel'],
                ['Residential', 'Accommodation Units'],
                ['Residential', 'Boma'],
                ['Residential', 'Bungalow'],
                ['Residential', 'Bunker'],
                ['Residential', 'Cabin'],
                ['Residential', 'Chalet'],
                ['Residential', 'Community Centre'],
                ['Residential', 'Dormitory'],
                ['Residential', 'Dwelling'],
                ['Residential', 'Flat'],
                ['Residential', 'Kitchen'],
                ['Residential', 'Lapa'],
                ['Residential', 'Laundry Facility'],
                ['Residential', 'Locker Room'],
                ['Residential', 'Lodge'],
                ['Residential', 'Shower'],
                ['Residential', 'Toilets'],
                ['Residential', 'Room'],
                ['Residential', 'Cottage'],
                ['Residential', 'Garage'],
                ['Roads', 'Access Roads'],
                ['Roads', 'Gravel'],
                ['Roads', 'Tarred'],
                ['Security', 'Control Room'],
                ['Security', 'Guardhouse'],
                ['Security', 'Office'],
                ['Shade Nets'],
                ['Silo'],
                ['Sports', 'Arena'],
                ['Sports', 'Tennis Court'],
                ['Staff', 'Hostel'],
                ['Staff', 'Hut'],
                ['Staff', 'Retirement Centre'],
                ['Staff', 'Staff Building'],
                ['Staff', 'Canteen'],
                ['Staff', 'Dining Facility'],
                ['Storage', 'Truck Shelter'],
                ['Storage', 'Barn'],
                ['Storage', 'Dark Room'],
                ['Storage', 'Bin Compartments'],
                ['Storage', 'Machinery'],
                ['Storage', 'Saddle Room'],
                ['Storage', 'Shed'],
                ['Storage', 'Chemicals'],
                ['Storage', 'Tools'],
                ['Storage', 'Dry'],
                ['Storage', 'Equipment'],
                ['Storage', 'Feed'],
                ['Storage', 'Fertilizer'],
                ['Storage', 'Fuel'],
                ['Storage', 'Grain'],
                ['Storage', 'Hides'],
                ['Storage', 'Oil'],
                ['Storage', 'Pesticide'],
                ['Storage', 'Poison'],
                ['Storage', 'Seed'],
                ['Storage', 'Zinc'],
                ['Storage', 'Sulphur'],
                ['Storage'],
                ['Storage', 'Vitamin Room'],
                ['Sugar Mill'],
                ['Tanks', 'Water'],
                ['Timber Mill'],
                ['Trench'],
                ['Utilities', 'Battery Room'],
                ['Utilities', 'Boiler Room'],
                ['Utilities', 'Compressor Room'],
                ['Utilities', 'Engine Room'],
                ['Utilities', 'Generator'],
                ['Utilities', 'Power Room'],
                ['Utilities', 'Pumphouse'],
                ['Utilities', 'Transformer Room'],
                ['Utilities'],
                ['Vacant Area'],
                ['Vehicles', 'Transport Depot'],
                ['Vehicles', 'Truck Wash'],
                ['Vehicles', 'Workshop'],
                ['Walls'],
                ['Walls', 'Boundary'],
                ['Walls', 'Retaining'],
                ['Walls', 'Security'],
                ['Warehouse'],
                ['Water', 'Reservoir'],
                ['Water', 'Tower'],
                ['Water', 'Purification Plant'],
                ['Water', 'Reticulation Works'],
                ['Water', 'Filter Station'],
                ['Wine Cellar', 'Tanks'],
                ['Wine Cellar'],
                ['Wine Cellar', 'Winery'],
                ['Wine Cellar', 'Barrel Maturation Room']
            ], categoryMapper(['category', 'subCategory'])),
            livestock: underscore.map([
                ['Cattle', 'Phase A Bulls', 'Breeding'],
                ['Cattle', 'Phase B Bulls', 'Breeding'],
                ['Cattle', 'Phase C Bulls', 'Breeding'],
                ['Cattle', 'Phase D Bulls', 'Breeding'],
                ['Cattle', 'Heifers', 'Breeding'],
                ['Cattle', 'Bull Calves', 'Breeding'],
                ['Cattle', 'Heifer Calves', 'Breeding'],
                ['Cattle', 'Tollies 1-2', 'Breeding'],
                ['Cattle', 'Heifers 1-2', 'Breeding'],
                ['Cattle', 'Culls', 'Breeding'],
                ['Cattle', 'Bulls', 'Dairy'],
                ['Cattle', 'Dry Cows', 'Dairy'],
                ['Cattle', 'Lactating Cows', 'Dairy'],
                ['Cattle', 'Heifers', 'Dairy'],
                ['Cattle', 'Calves', 'Dairy'],
                ['Cattle', 'Culls', 'Dairy'],
                ['Cattle', 'Bulls', 'Slaughter'],
                ['Cattle', 'Cows', 'Slaughter'],
                ['Cattle', 'Heifers', 'Slaughter'],
                ['Cattle', 'Weaners', 'Slaughter'],
                ['Cattle', 'Calves', 'Slaughter'],
                ['Cattle', 'Culls', 'Slaughter'],
                ['Chickens', 'Day Old Chicks', 'Broilers'],
                ['Chickens', 'Broilers', 'Broilers'],
                ['Chickens', 'Hens', 'Layers'],
                ['Chickens', 'Point of Laying Hens', 'Layers'],
                ['Chickens', 'Culls', 'Layers'],
                ['Game', 'Game', 'Slaughter'],
                ['Goats', 'Rams', 'Slaughter'],
                ['Goats', 'Breeding Ewes', 'Slaughter'],
                ['Goats', 'Young Ewes', 'Slaughter'],
                ['Goats', 'Kids', 'Slaughter'],
                ['Horses', 'Horses', 'Breeding'],
                ['Pigs', 'Boars', 'Slaughter'],
                ['Pigs', 'Breeding Sows', 'Slaughter'],
                ['Pigs', 'Weaned pigs', 'Slaughter'],
                ['Pigs', 'Piglets', 'Slaughter'],
                ['Pigs', 'Porkers', 'Slaughter'],
                ['Pigs', 'Baconers', 'Slaughter'],
                ['Pigs', 'Culls', 'Slaughter'],
                ['Ostriches', 'Breeding Stock', 'Slaughter'],
                ['Ostriches', 'Slaughter Birds > 3 months', 'Slaughter'],
                ['Ostriches', 'Slaughter Birds < 3 months', 'Slaughter'],
                ['Ostriches', 'Chicks', 'Slaughter'],
                ['Rabbits', 'Rabbits', 'Slaughter'],
                ['Sheep', 'Rams', 'Breeding'],
                ['Sheep', 'Young Rams', 'Breeding'],
                ['Sheep', 'Ewes', 'Breeding'],
                ['Sheep', 'Young Ewes', 'Breeding'],
                ['Sheep', 'Lambs', 'Breeding'],
                ['Sheep', 'Wethers', 'Breeding'],
                ['Sheep', 'Culls', 'Breeding'],
                ['Sheep', 'Rams', 'Slaughter'],
                ['Sheep', 'Ewes', 'Slaughter'],
                ['Sheep', 'Lambs', 'Slaughter'],
                ['Sheep', 'Wethers', 'Slaughter'],
                ['Sheep', 'Culls', 'Slaughter']
            ], categoryMapper(['category', 'subCategory', 'purpose'])),
            stock: underscore.map([
                ['Animal Feed', 'Lick', 'kg'],
                ['Indirect Costs', 'Fuel', 'l'],
                ['Indirect Costs', 'Water', 'l'],
                ['Preharvest', 'Seed', 'kg'],
                ['Preharvest', 'Plant Material', 'each'],
                ['Preharvest', 'Fertiliser', 't'],
                ['Preharvest', 'Fungicides', 'l'],
                ['Preharvest', 'Lime', 't'],
                ['Preharvest', 'Herbicides', 'l'],
                ['Preharvest', 'Pesticides', 'l']
            ], categoryMapper(['category', 'subCategory', 'unit'])),
            vme: underscore.map([
                ['Vehicles', 'LDV'],
                ['Vehicles', 'LDV (Double Cab)'],
                ['Vehicles', 'LDV (4-Wheel)'],
                ['Vehicles', 'LDV (Double Cab 4-Wheel)'],
                ['Vehicles', 'Truck'],
                ['Vehicles', 'Truck (Double Differential)'],
                ['Vehicles', 'Truck (Horse)'],
                ['Vehicles', 'Truck (Semi-trailer)'],
                ['Vehicles', 'Truck (Timber Trailer)'],
                ['Vehicles', 'Truck (Cane Trailer)'],
                ['Machinery', 'Tractor'],
                ['Machinery', 'Tractor (4-Wheel)'],
                ['Machinery', 'Tractor (Orchard)'],
                ['Machinery', 'Tractor (Orchard, 4-Wheel)'],
                ['Machinery', 'Road Grader'],
                ['Machinery', 'Front-end Loader'],
                ['Machinery', 'Bulldozer'],
                ['Machinery', 'Forklift'],
                ['Machinery', 'Borehole Machine'],
                ['Machinery', 'Loader (Cane)'],
                ['Machinery', 'Loader (Timber)'],
                ['Machinery', 'Harvester (Maize Combine)'],
                ['Machinery', 'Harvester (Wheat Combine)'],
                ['Machinery', 'Electric Motor'],
                ['Machinery', 'Internal Combustion Engine'],
                ['Machinery', 'Irrigation Pump'],
                ['Machinery', 'Irrigation Pump (Electrical)'],
                ['Machinery', 'Irrigation Pump (Internal Combustion Engine) '],
                ['Equipment', 'Ripper'],
                ['Equipment', 'Ripper (Sugar Cane)'],
                ['Equipment', 'Ripper (Heavy Duty)'],
                ['Equipment', 'Ripper (Auto Reset)'],
                ['Equipment', 'Plough'],
                ['Equipment', 'Plough (Moldboard)'],
                ['Equipment', 'Plough (Disc)'],
                ['Equipment', 'Plough (Chisel)'],
                ['Equipment', 'Plough (Bulldog)'],
                ['Equipment', 'Harrow'],
                ['Equipment', 'Harrow (Offset Disc)'],
                ['Equipment', 'Harrow (Hydraulic Offset)'],
                ['Equipment', 'Harrow (Offset Trailer)'],
                ['Equipment', 'Harrow (Tandem Disc)'],
                ['Equipment', 'Harrow (Rotary)'],
                ['Equipment', 'Harrow (Power)'],
                ['Equipment', 'Ridger'],
                ['Equipment', 'Ridger (Disc)'],
                ['Equipment', 'Ridger (Shear)'],
                ['Equipment', 'Tiller'],
                ['Equipment', 'Tiller (S-Shank)'],
                ['Equipment', 'Tiller (C-Shank)'],
                ['Equipment', 'Tiller (Vibro-flex)'],
                ['Equipment', 'Tiller (Otma)'],
                ['Equipment', 'Cultivator'],
                ['Equipment', 'Cultivator (Shank Tiller)'],
                ['Equipment', 'Cultivator (Vibro Tiller)'],
                ['Equipment', 'Planter'],
                ['Equipment', 'Planter (Single Kernel)'],
                ['Equipment', 'Planter (Seed Drill)'],
                ['Equipment', 'Planter (Wheat)'],
                ['Equipment', 'Planter (Potato)'],
                ['Equipment', 'Vegetable Transplanter'],
                ['Equipment', 'Fine Seed Seeder'],
                ['Equipment', 'Land Roller'],
                ['Equipment', 'Spreader (Fertiliser)'],
                ['Equipment', 'Spreader (Manure)'],
                ['Equipment', 'Spreader (Lime)'],
                ['Equipment', 'Mist Blower'],
                ['Equipment', 'Boom Sprayer'],
                ['Equipment', 'Boom Sprayer (Mounted)'],
                ['Equipment', 'Boom Sprayer (Trailer)'],
                ['Equipment', 'Mower'],
                ['Equipment', 'Mower (Conditioner)'],
                ['Equipment', 'Slasher'],
                ['Equipment', 'Haymaker'],
                ['Equipment', 'Hay Rake'],
                ['Equipment', 'Hay Baler'],
                ['Equipment', 'Hay Baler (Square)'],
                ['Equipment', 'Hay Baler (Round)'],
                ['Equipment', 'Bale Handler'],
                ['Equipment', 'Bale Handler (Round)'],
                ['Equipment', 'Bale Handler (Wrapper)'],
                ['Equipment', 'Bale Handler (Shredder)'],
                ['Equipment', 'Harvester (Combine Trailer)'],
                ['Equipment', 'Harvester (Forage)'],
                ['Equipment', 'Harvester (Forage Chop)'],
                ['Equipment', 'Harvester (Forage Flail)'],
                ['Equipment', 'Harvester (Thresher)'],
                ['Equipment', 'Harvester (Potato Lifter)'],
                ['Equipment', 'Harvester (Potato Sorter)'],
                ['Equipment', 'Harvester (Groundnut Picker)'],
                ['Equipment', 'Harvester (Groundnut Sheller)'],
                ['Equipment', 'Harvester (Groundnut Lifter)'],
                ['Equipment', 'Hammer Mill'],
                ['Equipment', 'Feed Mixer'],
                ['Equipment', 'Roller Mill'],
                ['Equipment', 'Grain Pump'],
                ['Equipment', 'Grain Grader'],
                ['Equipment', 'Grain Drier'],
                ['Equipment', 'Grader (Rear Mounted)'],
                ['Equipment', 'Dam Scoop'],
                ['Equipment', 'Post Digger'],
                ['Equipment', 'Trailer'],
                ['Equipment', 'Trailer (Tip)'],
                ['Equipment', 'Trailer (4-Wheel)'],
                ['Equipment', 'Trailer (Water Cart)'],
                ['Equipment', 'Trailer (Cane)'],
                ['Equipment', 'Trailer (Cane Truck)'],
                ['Equipment', 'Trailer (Timber)'],
                ['Equipment', 'Trailer (Timber Truck)']
            ], categoryMapper(['category', 'subCategory']))
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
            'improvement': [
                'Built-up',
                'Residential',
                'Structures (Handling)',
                'Structures (Processing)',
                'Structures (Retail)',
                'Structures (Storage)',
                'Utilities'
            ],
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
                'Non-vegetated',
                'Wasteland'],
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
            'Eragrostis',
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
            'Citrus',
            'Cloudberry',
            'Coconut',
            'Coffee',
            'Date',
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
            'Eucalyptus',
            'Hops',
            'Pine',
            'Pineapple',
            'Tea',
            'Timber',
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
            'Currant',
            'Grape',
            'Grape (Bush Vine)',
            'Grape (Red)',
            'Grape (Table)',
            'Grape (White)',
            'Raisin'
        ];

        readOnlyProperty(Asset, 'cropsByLandClass', {
            'Cropland': _croplandCrops,
            'Cropland (Emerging)': _croplandCrops,
            'Cropland (Irrigated)': _croplandIrrigatedCrops,
            'Cropland (Smallholding)': _croplandCrops,
            'Forest': ['Pine', 'Timber'],
            'Grazing': _grazingCrops,
            'Grazing (Bush)': ['Bush'],
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
            'permanent crop': underscore.union(_perennialCrops, _vineyardCrops),
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

        privateProperty(Asset, 'farmRequired', function (type) {
            return farmRequired(type)
        });

        privateProperty(Asset, 'getCropsByLandClass', function (landClass) {
            return Asset.cropsByLandClass[landClass] || [];
        });

        privateProperty(Asset, 'getDefaultCrop', function (landClass) {
            return (underscore.size(Asset.cropsByLandClass[landClass]) === 1 ? underscore.first(Asset.cropsByLandClass[landClass]) : undefined);
        });

        privateProperty(Asset, 'getCustomTitle', function (asset, props, options) {
            return getCustomTitle(asset, props, options);
        });

        privateProperty(Asset, 'getThumbnailUrl', function (asset) {
            return getThumbnailUrl(asset);
        });

        privateProperty(Asset, 'getTitle', function (asset, withField, farm) {
            return getTitle(asset, withField, farm);
        });

        privateProperty(Asset, 'listServiceMap', function (asset, metadata) {
            return listServiceMap(asset, metadata);
        });

        function getDefaultProps (instance) {
            switch (instance.type) {
                case 'crop':
                case 'permanent crop':
                case 'plantation':
                    return ['plantedArea', 'crop', 'fieldName', 'farmName'];
                case 'farmland':
                    return [['label', 'portionLabel', 'portionNumber']];
                case 'cropland':
                    return ['typeTitle', function (instance) {
                        return (instance.data.irrigation ?
                            instance.data.irrigation + ' irrigated' :
                            (instance.data.irrigated ?
                                'Irrigated (' + (instance.data.equipped ? 'equipped' : 'unequipped') + ')':
                                'Non irrigable'))
                    }, 'waterSource', 'fieldName', 'farmName'];
                case 'livestock':
                    return ['type', 'category'];
                case 'pasture':
                    return [function (instance) {
                        return (instance.data.intensified ?
                            (instance.data.crop ? instance.data.crop + ' intensified ' : 'Intensified ') + instance.type :
                            'Natural Grazing');
                    }, 'fieldName', 'farmName'];
                case 'stock':
                    return ['category'];
                case 'vme':
                    return ['category', 'model'];
                case 'wasteland':
                    return ['typeTitle'];
                case 'water source':
                case 'water right':
                    return ['waterSource', 'fieldName', 'farmName'];
                default:
                    return [['name', 'category', 'typeTitle']];
            }
        }

        function getProps (instance, props, options) {
            return underscore.chain(props)
                .map(function (prop) {
                    if (underscore.isArray(prop)) {
                        return underscore.first(getProps(instance, prop, options));
                    } else if (underscore.isFunction(prop)) {
                        return prop(instance, options);
                    } else {
                        switch (prop) {
                            case 'age':
                                var years = moment(options.asOfDate).diff(instance.data.establishedDate, 'years');
                                return instance.data.establishedDate && (years === 0 ? 'Established' : years + ' year' + (years === 1 ? '' : 's'));
                            case 'defaultTitle':
                                return getProps(instance, getDefaultProps(instance), options);
                            case 'farmName':
                                return options.withFarm && options.field && options.field[prop];
                            case 'fieldName':
                                return options.withField && instance.data[prop];
                            case 'croppingPotential':
                                return options.field && options.field[prop] && options.field[prop] + ' Potential';
                            case 'landUse':
                                return options.field && options.field[prop];
                            case 'area':
                            case 'plantedArea':
                            case 'size':
                                return instance.data[prop] && safeMath.round(instance.data[prop], 2) + 'ha';
                            case 'portionNumber':
                                return (instance.data.portionNumber ? 'Ptn. ' + instance.data.portionNumber : 'Rem. extent of farm');
                            case 'typeTitle':
                                return Asset.assetTypes[instance.type];
                            default:
                                return instance.data[prop];
                        }
                    }
                })
                .compact()
                .uniq()
                .value();
        }

        function getCustomTitle (instance, props, options) {
            options = underscore.defaults(options || {}, {
                separator: ', '
            });

            return underscore.flatten(getProps(instance, props || getDefaultProps(instance), options)).join(options.separator);
        }

        function getThumbnailUrl (instance) {
            return attachmentHelper.findSize(this, 'thumb', 'img/camera.png');
        }
        
        function getTitle (instance, withField, farm) {
            return getCustomTitle(instance, getDefaultProps(instance), {
                farm: farm,
                withFarm: !underscore.isUndefined(farm),
                field: farm && underscore.findWhere(farm.data.fields, {fieldName: instance.data.fieldName}),
                withField: withField
            });
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
                        map.subtitle = (instance.data.plantedDate ? 'Planted: ' + moment(instance.data.plantedDate).format('YYYY-MM-DD') : '');
                        map.size = instance.data.size;
                        break;
                    case 'cropland':
                    case 'pasture':
                    case 'wasteland':
                    case 'water right':
                        map.subtitle = (instance.data.size !== undefined ? 'Area: ' + safeMath.round(instance.data.size, 2) + 'ha' : 'Unknown area');
                        map.size = instance.data.size;
                        break;
                    case 'farmland':
                        map.subtitle = (instance.data.area !== undefined ? 'Area: ' + safeMath.round(instance.data.area, 2) + 'ha' : 'Unknown area');
                        map.size = instance.data.area;
                        break;
                    case 'permanent crop':
                    case 'plantation':
                        map.subtitle = (instance.data.establishedDate ? 'Established: ' + moment(instance.data.establishedDate).format('YYYY-MM-DD') : '');
                        map.size = instance.data.size;
                        break;
                    case 'improvement':
                        map.subtitle = instance.data.type + (instance.data.category ? ' - ' + instance.data.category : '') + (instance.data.size !== undefined ? ' (' + safeMath.round(instance.data.size, 2) + 'm²)' : '');
                        map.summary = (instance.data.description || '');
                        break;
                    case 'livestock':
                        map.subtitle = (instance.data.breed ? instance.data.breed + ' for ' : 'For ') + instance.data.purpose;
                        map.summary = (instance.data.description || '');
                        map.groupby = instance.data.type;
                        break;
                    case 'stock':
                        map.groupby = instance.type;
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

        function farmRequired (type) {
            return underscore.contains(['crop', 'farmland', 'cropland', 'improvement', 'pasture', 'permanent crop', 'plantation', 'wasteland', 'water right'], type);
        }

        Asset.validates({
            assetKey: {
                required: true
            },
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
                requiredIf: function (value, instance) {
                    return farmRequired(instance.type);
                },
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
            plantedDate: {
                requiredIf: function (value, instance) {
                    return underscore.contains(['crop'], instance.type);
                },
                format: {
                    date: true
                }
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

sdkModelAsset.provider('AssetFactory', function () {
    var instances = {};

    this.add = function (type, modelName) {
        instances[type] = modelName;
    };

    this.$get = ['$injector', 'Asset', function ($injector, Asset) {
        function apply (attrs, fnName) {
            if (instances[attrs.type]) {
                if (typeof instances[attrs.type] === 'string') {
                    instances[attrs.type] = $injector.get(instances[attrs.type]);
                }

                return instances[attrs.type][fnName](attrs);
            }

            return Asset[fnName](attrs);
        }

        return {
            isInstanceOf: function (asset) {
                return (asset ?
                    (instances[asset.type] ?
                        asset instanceof instances[asset.type] :
                        asset instanceof Asset) :
                    false);
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

