var sdkModelAsset = angular.module('ag.sdk.model.asset', ['ag.sdk.library', 'ag.sdk.model.activity', 'ag.sdk.model.base', 'ag.sdk.model.field', 'ag.sdk.model.liability', 'ag.sdk.model.production-schedule']);

sdkModelAsset.factory('AssetBase', ['Activity', 'Base', 'computedProperty', 'inheritModel', 'Liability', 'Model', 'moment', 'privateProperty', 'readOnlyProperty', 'safeMath', 'underscore',
    function (Activity, Base, computedProperty, inheritModel, Liability, Model, moment, privateProperty, readOnlyProperty, safeMath, underscore) {
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

            this.activities = underscore.map(attrs.activities, Activity.newCopy);
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
                    (instance.product ?
                            (instance.product.name ? '-pn.' + instance.product.name : '') +
                            (instance.product.sku ? '-ps.' + instance.product.sku : '')  : '') : '') +
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

        var AIRPORT = 'Airport',
            AQUACULTURE = 'Aquaculture',
            BOREHOLE = 'Borehole',
            POULTRY = 'Poultry',
            BREEDING = 'Breeding',
            BUILDING = 'Building',
            CATTLE = 'Cattle',
            CHICKENS = 'Chickens',
            COMMERCIAL = 'Commercial',
            COMPOST = 'Compost',
            CROP_PROCESSING = 'Crop Processing',
            DAIRY = 'Dairy',
            DAM = 'Dam',
            DOMESTIC = 'Domestic',
            EDUCATION = 'Education',
            EQUIPMENT = 'Equipment',
            FENCING = 'Fencing',
            FUEL = 'Fuel',
            GOATS = 'Goats',
            INDIRECT_COSTS = 'Indirect Costs',
            IRRIGATION = 'Irrigation',
            LIVESTOCK_HANDING = 'Livestock Handling',
            LOGISTICS = 'Logistics',
            MACHINERY = 'Machinery',
            MEAT_PROCESSING = 'Meat Processing',
            MUSHROOMS = 'Mushrooms',
            NURSERY = 'Nursery',
            OSTRICHES = 'Ostriches',
            PADDOCKS = 'Paddocks',
            PIGGERY = 'Piggery',
            PIGS = 'Pigs',
            PREHARVEST = 'Preharvest',
            PROCESSING = 'Processing',
            RECREATION = 'Recreation',
            RESIDENTIAL = 'Residential',
            ROADS = 'Roads',
            SECURITY = 'Security',
            SHEEP = 'Sheep',
            SLAUGHTER = 'Slaughter', 
            SPORTS = 'Sports',
            STAFF = 'Staff',
            STORAGE = 'Storage',
            TANKS = 'Tanks',
            UTILITIES = 'Utilities',
            VEHICLES = 'Vehicles',
            WALLS = 'Walls',
            WATER = 'Water',
            WINE_CELLAR = 'Wine Cellar';

        readOnlyProperty(Asset, 'categories', {
            improvement: underscore.map([
                [AIRPORT],
                [AIRPORT, 'Hangar'],
                [AIRPORT, 'Helipad'],
                [AIRPORT, 'Runway'],
                [AQUACULTURE],
                [AQUACULTURE, 'Pond'],
                [AQUACULTURE, 'Net House'],
                ['Aviary'],
                ['Beekeeping'],
                [BOREHOLE],
                [BOREHOLE, 'Equipped'],
                [BOREHOLE, 'Pump'],
                [BOREHOLE, 'Windmill'],
                [POULTRY],
                [POULTRY, 'Broiler House'],
                [POULTRY, 'Broiler House - Atmosphere'],
                [POULTRY, 'Broiler House - Semi'],
                [POULTRY, 'Broiler House - Zinc'],
                [POULTRY, 'Hatchery'],
                [BUILDING],
                [BUILDING, 'Administrative'],
                [BUILDING, COMMERCIAL],
                [BUILDING, 'Entrance'],
                [BUILDING, 'Lean-to'],
                [BUILDING, 'Outbuilding'],
                [BUILDING, 'Gate'],
                ['Cold Storage'],
                [COMMERCIAL],
                [COMMERCIAL, 'Coffee Shop'],
                [COMMERCIAL, 'Sales Facility'],
                [COMMERCIAL, 'Shop'],
                [COMMERCIAL, 'Bar'],
                [COMMERCIAL, 'Café'],
                [COMMERCIAL, 'Restaurant'],
                [COMMERCIAL, 'Factory'],
                [COMMERCIAL, 'Tasting Facility'],
                [COMMERCIAL, 'Cloth House'],
                [COMPOST],
                [COMPOST, 'Preparing Unit'],
                ['Crocodile Dam'],
                [CROP_PROCESSING],
                [CROP_PROCESSING, 'Degreening Room'],
                [CROP_PROCESSING, 'Dehusking Facility'],
                [CROP_PROCESSING, 'Drying Facility'],
                [CROP_PROCESSING, 'Drying Tunnels'],
                [CROP_PROCESSING, 'Sorting Facility'],
                [CROP_PROCESSING, 'Drying Oven'],
                [CROP_PROCESSING, 'Drying Racks'],
                [CROP_PROCESSING, 'Crushing Plant'],
                [CROP_PROCESSING, 'Nut Cracking Facility'],
                [CROP_PROCESSING, 'Nut Factory'],
                [DAIRY],
                [DAIRY, 'Pasteurising Facility'],
                [DAIRY, 'Milking Parlour'],
                [DAM],
                [DAM, 'Filter'],
                [DAM, 'Trout'],
                [DOMESTIC],
                [DOMESTIC, 'Chicken Coop'],
                [DOMESTIC, 'Chicken Run'],
                [DOMESTIC, 'Kennels'],
                [DOMESTIC, 'Gardening Facility'],
                [EDUCATION],
                [EDUCATION, 'Conference Room'],
                [EDUCATION, 'Classroom'],
                [EDUCATION, 'Crèche'],
                [EDUCATION, 'School'],
                [EDUCATION, 'Training Facility'],
                [EQUIPMENT],
                [EQUIPMENT, 'Air Conditioner'],
                [EQUIPMENT, 'Gantry'],
                [EQUIPMENT, 'Oven'],
                [EQUIPMENT, 'Pump'],
                [EQUIPMENT, 'Pumphouse'],
                [EQUIPMENT, 'Scale'],
                ['Feed Mill'],
                ['Feedlot'],
                [FENCING],
                [FENCING, 'Electric'],
                [FENCING, 'Game'],
                [FENCING, 'Perimeter'],
                [FENCING, SECURITY],
                [FENCING, 'Wire'],
                [FUEL],
                [FUEL, 'Tanks'],
                [FUEL, 'Tank Stand'],
                [FUEL, 'Fuelling Facility'],
                ['Grain Mill'],
                ['Greenhouse'],
                ['Infrastructure'],
                [IRRIGATION],
                [IRRIGATION, 'Sprinklers'],
                ['Laboratory'],
                [LIVESTOCK_HANDING],
                [LIVESTOCK_HANDING, 'Auction Facility'],
                [LIVESTOCK_HANDING, 'Cages'],
                [LIVESTOCK_HANDING, 'Growing House'],
                [LIVESTOCK_HANDING, 'Pens'],
                [LIVESTOCK_HANDING, 'Shelter'],
                [LIVESTOCK_HANDING, 'Breeding Facility'],
                [LIVESTOCK_HANDING, 'Culling Shed'],
                [LIVESTOCK_HANDING, 'Dipping Facility'],
                [LIVESTOCK_HANDING, 'Elephant Enclosures'],
                [LIVESTOCK_HANDING, 'Feed Troughs/Dispensers'],
                [LIVESTOCK_HANDING, 'Horse Walker'],
                [LIVESTOCK_HANDING, 'Maternity Shelter/Pen'],
                [LIVESTOCK_HANDING, 'Quarantine Area'],
                [LIVESTOCK_HANDING, 'Rehab Facility'],
                [LIVESTOCK_HANDING, 'Shearing Facility'],
                [LIVESTOCK_HANDING, 'Stable'],
                [LIVESTOCK_HANDING, 'Surgery'],
                [LIVESTOCK_HANDING, 'Treatment Area'],
                [LIVESTOCK_HANDING, 'Weaner House'],
                [LIVESTOCK_HANDING, 'Grading Facility'],
                [LIVESTOCK_HANDING, 'Inspection Facility'],
                [LOGISTICS],
                [LOGISTICS, 'Handling Equipment'],
                [LOGISTICS, 'Handling Facility'],
                [LOGISTICS, 'Depot'],
                [LOGISTICS, 'Loading Area'],
                [LOGISTICS, 'Loading Shed'],
                [LOGISTICS, 'Hopper'],
                [LOGISTICS, 'Weigh Bridge'],
                [MEAT_PROCESSING],
                [MEAT_PROCESSING, 'Abattoir'],
                [MEAT_PROCESSING, 'Deboning Room'],
                [MEAT_PROCESSING, 'Skinning Facility'],
                ['Mill'],
                [MUSHROOMS],
                [MUSHROOMS, 'Cultivation'],
                [MUSHROOMS, 'Sweat Room'],
                [NURSERY, 'Plant'],
                [NURSERY, 'Plant Growing Facility'],
                ['Office'],
                ['Packaging Facility'],
                [PADDOCKS],
                [PADDOCKS, 'Camp'],
                [PADDOCKS, 'Kraal'],
                [PIGGERY],
                [PIGGERY, 'Farrowing House'],
                [PIGGERY, 'Pig Sty'],
                [PROCESSING],
                [PROCESSING, 'Bottling Facility'],
                [PROCESSING, 'Flavour Shed'],
                [PROCESSING, 'Processing Facility'],
                [RECREATION],
                [RECREATION, 'Viewing Area'],
                [RECREATION, 'BBQ'],
                [RECREATION, 'Clubhouse'],
                [RECREATION, 'Event Venue'],
                [RECREATION, 'Gallery'],
                [RECREATION, 'Game Room'],
                [RECREATION, 'Gazebo'],
                [RECREATION, 'Gymnasium'],
                [RECREATION, 'Jacuzzi'],
                [RECREATION, 'Judging Booth'],
                [RECREATION, 'Museum'],
                [RECREATION, 'Play Area'],
                [RECREATION, 'Pool House'],
                [RECREATION, 'Pottery Room'],
                [RECREATION, 'Racing Track'],
                [RECREATION, 'Salon'],
                [RECREATION, 'Sauna'],
                [RECREATION, 'Shooting Range'],
                [RECREATION, 'Spa Facility'],
                [RECREATION, 'Squash Court'],
                [RECREATION, 'Swimming Pool'],
                ['Religious', 'Church'],
                [RESIDENTIAL],
                [RESIDENTIAL, 'Carport'],
                [RESIDENTIAL, 'Driveway'],
                [RESIDENTIAL, 'Flooring'],
                [RESIDENTIAL, 'Paving'],
                [RESIDENTIAL, 'Roofing'],
                [RESIDENTIAL, 'Water Feature'],
                [RESIDENTIAL, 'Hall'],
                [RESIDENTIAL, 'Balcony'],
                [RESIDENTIAL, 'Canopy'],
                [RESIDENTIAL, 'Concrete Surface'],
                [RESIDENTIAL, 'Courtyard'],
                [RESIDENTIAL, 'Covered'],
                [RESIDENTIAL, 'Deck'],
                [RESIDENTIAL, 'Mezzanine'],
                [RESIDENTIAL, 'Parking Area'],
                [RESIDENTIAL, 'Patio'],
                [RESIDENTIAL, 'Porch'],
                [RESIDENTIAL, 'Porte Cochere'],
                [RESIDENTIAL, 'Terrace'],
                [RESIDENTIAL, 'Veranda'],
                [RESIDENTIAL, 'Walkways'],
                [RESIDENTIAL, 'Rondavel'],
                [RESIDENTIAL, 'Accommodation Units'],
                [RESIDENTIAL, 'Boma'],
                [RESIDENTIAL, 'Bungalow'],
                [RESIDENTIAL, 'Bunker'],
                [RESIDENTIAL, 'Cabin'],
                [RESIDENTIAL, 'Chalet'],
                [RESIDENTIAL, 'Community Centre'],
                [RESIDENTIAL, 'Dormitory'],
                [RESIDENTIAL, 'Dwelling'],
                [RESIDENTIAL, 'Flat'],
                [RESIDENTIAL, 'Kitchen'],
                [RESIDENTIAL, 'Lapa'],
                [RESIDENTIAL, 'Laundry Facility'],
                [RESIDENTIAL, 'Locker Room'],
                [RESIDENTIAL, 'Lodge'],
                [RESIDENTIAL, 'Shower'],
                [RESIDENTIAL, 'Toilets'],
                [RESIDENTIAL, 'Room'],
                [RESIDENTIAL, 'Cottage'],
                [RESIDENTIAL, 'Garage'],
                [ROADS],
                [ROADS, 'Access Roads'],
                [ROADS, 'Gravel'],
                [ROADS, 'Tarred'],
                [SECURITY],
                [SECURITY, 'Control Room'],
                [SECURITY, 'Guardhouse'],
                [SECURITY, 'Office'],
                ['Shade Nets'],
                ['Silo'],
                [SPORTS],
                [SPORTS, 'Arena'],
                [SPORTS, 'Tennis Court'],
                [STAFF],
                [STAFF, 'Hostel'],
                [STAFF, 'Hut'],
                [STAFF, 'Retirement Centre'],
                [STAFF, 'Staff Building'],
                [STAFF, 'Canteen'],
                [STAFF, 'Dining Facility'],
                [STORAGE],
                [STORAGE, 'Truck Shelter'],
                [STORAGE, 'Barn'],
                [STORAGE, 'Dark Room'],
                [STORAGE, 'Bin Compartments'],
                [STORAGE, MACHINERY],
                [STORAGE, 'Saddle Room'],
                [STORAGE, 'Shed'],
                [STORAGE, 'Chemicals'],
                [STORAGE, 'Tools'],
                [STORAGE, 'Dry'],
                [STORAGE, EQUIPMENT],
                [STORAGE, 'Feed'],
                [STORAGE, 'Fertilizer'],
                [STORAGE, FUEL],
                [STORAGE, 'Grain'],
                [STORAGE, 'Hides'],
                [STORAGE, 'Oil'],
                [STORAGE, 'Pesticide'],
                [STORAGE, 'Poison'],
                [STORAGE, 'Seed'],
                [STORAGE, 'Zinc'],
                [STORAGE, 'Sulphur'],
                [STORAGE],
                [STORAGE, 'Vitamin Room'],
                ['Sugar Mill'],
                [TANKS],
                [TANKS, WATER],
                ['Timber Mill'],
                ['Trench'],
                [UTILITIES],
                [UTILITIES, 'Battery Room'],
                [UTILITIES, 'Boiler Room'],
                [UTILITIES, 'Compressor Room'],
                [UTILITIES, 'Engine Room'],
                [UTILITIES, 'Generator'],
                [UTILITIES, 'Power Room'],
                [UTILITIES, 'Pumphouse'],
                [UTILITIES, 'Transformer Room'],
                ['Vacant Area'],
                [VEHICLES],
                [VEHICLES, 'Transport Depot'],
                [VEHICLES, 'Truck Wash'],
                [VEHICLES, 'Workshop'],
                [WALLS],
                [WALLS, 'Boundary'],
                [WALLS, 'Retaining'],
                [WALLS, SECURITY],
                ['Warehouse'],
                [WATER],
                [WATER, 'Reservoir'],
                [WATER, 'Tower'],
                [WATER, 'Purification Plant'],
                [WATER, 'Reticulation Works'],
                [WATER, 'Filter Station'],
                [WINE_CELLAR],
                [WINE_CELLAR, 'Tanks'],
                [WINE_CELLAR, 'Winery'],
                [WINE_CELLAR, 'Barrel Maturation Room']
            ], categoryMapper(['category', 'subCategory'])),
            livestock: underscore.map([
                [CATTLE, 'Phase A Bulls', BREEDING],
                [CATTLE, 'Phase B Bulls', BREEDING],
                [CATTLE, 'Phase C Bulls', BREEDING],
                [CATTLE, 'Phase D Bulls', BREEDING],
                [CATTLE, 'Heifers', BREEDING],
                [CATTLE, 'Bull Calves', BREEDING],
                [CATTLE, 'Heifer Calves', BREEDING],
                [CATTLE, 'Tollies 1-2', BREEDING],
                [CATTLE, 'Heifers 1-2', BREEDING],
                [CATTLE, 'Culls', BREEDING],
                [CATTLE, 'Bulls', DAIRY],
                [CATTLE, 'Dry Cows', DAIRY],
                [CATTLE, 'Lactating Cows', DAIRY],
                [CATTLE, 'Heifers', DAIRY],
                [CATTLE, 'Calves', DAIRY],
                [CATTLE, 'Culls', DAIRY],
                [CATTLE, 'Bulls', SLAUGHTER],
                [CATTLE, 'Cows', SLAUGHTER],
                [CATTLE, 'Heifers', SLAUGHTER],
                [CATTLE, 'Weaners', SLAUGHTER],
                [CATTLE, 'Calves', SLAUGHTER],
                [CATTLE, 'Culls', SLAUGHTER],
                [CHICKENS, 'Day Old Chicks', 'Broilers'],
                [CHICKENS, 'Broilers', 'Broilers'],
                [CHICKENS, 'Hens', 'Layers'],
                [CHICKENS, 'Point of Laying Hens', 'Layers'],
                [CHICKENS, 'Culls', 'Layers'],
                ['Game', 'Game', SLAUGHTER],
                [GOATS, 'Rams', SLAUGHTER],
                [GOATS, 'Breeding Ewes', SLAUGHTER],
                [GOATS, 'Young Ewes', SLAUGHTER],
                [GOATS, 'Kids', SLAUGHTER],
                ['Horses', 'Horses', BREEDING],
                [PIGS, 'Boars', SLAUGHTER],
                [PIGS, 'Breeding Sows', SLAUGHTER],
                [PIGS, 'Weaned pigs', SLAUGHTER],
                [PIGS, 'Piglets', SLAUGHTER],
                [PIGS, 'Porkers', SLAUGHTER],
                [PIGS, 'Baconers', SLAUGHTER],
                [PIGS, 'Culls', SLAUGHTER],
                [OSTRICHES, 'Breeding Stock', SLAUGHTER],
                [OSTRICHES, 'Slaughter Birds > 3 months', SLAUGHTER],
                [OSTRICHES, 'Slaughter Birds < 3 months', SLAUGHTER],
                [OSTRICHES, 'Chicks', SLAUGHTER],
                ['Rabbits', 'Rabbits', SLAUGHTER],
                [SHEEP, 'Rams', BREEDING],
                [SHEEP, 'Young Rams', BREEDING],
                [SHEEP, 'Ewes', BREEDING],
                [SHEEP, 'Young Ewes', BREEDING],
                [SHEEP, 'Lambs', BREEDING],
                [SHEEP, 'Wethers', BREEDING],
                [SHEEP, 'Culls', BREEDING],
                [SHEEP, 'Rams', SLAUGHTER],
                [SHEEP, 'Ewes', SLAUGHTER],
                [SHEEP, 'Lambs', SLAUGHTER],
                [SHEEP, 'Wethers', SLAUGHTER],
                [SHEEP, 'Culls', SLAUGHTER]
            ], categoryMapper(['category', 'subCategory', 'purpose'])),
            stock: underscore.map([
                ['Animal Feed', 'Lick', 'kg'],
                [INDIRECT_COSTS, FUEL, 'l'],
                [INDIRECT_COSTS, WATER, 'l'],
                [PREHARVEST, 'Seed', 'kg'],
                [PREHARVEST, 'Plant Material', 'each'],
                [PREHARVEST, 'Fertiliser', 't'],
                [PREHARVEST, 'Fungicides', 'l'],
                [PREHARVEST, 'Lime', 't'],
                [PREHARVEST, 'Herbicides', 'l'],
                [PREHARVEST, 'Pesticides', 'l']
            ], categoryMapper(['category', 'subCategory', 'unit'])),
            vme: underscore.map([
                [VEHICLES, 'LDV'],
                [VEHICLES, 'LDV (Double Cab)'],
                [VEHICLES, 'LDV (4-Wheel)'],
                [VEHICLES, 'LDV (Double Cab 4-Wheel)'],
                [VEHICLES, 'Truck'],
                [VEHICLES, 'Truck (Double Differential)'],
                [VEHICLES, 'Truck (Horse)'],
                [VEHICLES, 'Truck (Semi-trailer)'],
                [VEHICLES, 'Truck (Timber Trailer)'],
                [VEHICLES, 'Truck (Cane Trailer)'],
                [MACHINERY, 'Tractor'],
                [MACHINERY, 'Tractor (4-Wheel)'],
                [MACHINERY, 'Tractor (Orchard)'],
                [MACHINERY, 'Tractor (Orchard, 4-Wheel)'],
                [MACHINERY, 'Road Grader'],
                [MACHINERY, 'Front-end Loader'],
                [MACHINERY, 'Bulldozer'],
                [MACHINERY, 'Forklift'],
                [MACHINERY, 'Borehole Machine'],
                [MACHINERY, 'Loader (Cane)'],
                [MACHINERY, 'Loader (Timber)'],
                [MACHINERY, 'Harvester (Maize Combine)'],
                [MACHINERY, 'Harvester (Wheat Combine)'],
                [MACHINERY, 'Electric Motor'],
                [MACHINERY, 'Internal Combustion Engine'],
                [MACHINERY, 'Irrigation Pump'],
                [MACHINERY, 'Irrigation Pump (Electrical)'],
                [MACHINERY, 'Irrigation Pump (Internal Combustion Engine) '],
                [EQUIPMENT, 'Ripper'],
                [EQUIPMENT, 'Ripper (Sugar Cane)'],
                [EQUIPMENT, 'Ripper (Heavy Duty)'],
                [EQUIPMENT, 'Ripper (Auto Reset)'],
                [EQUIPMENT, 'Plough'],
                [EQUIPMENT, 'Plough (Moldboard)'],
                [EQUIPMENT, 'Plough (Disc)'],
                [EQUIPMENT, 'Plough (Chisel)'],
                [EQUIPMENT, 'Plough (Bulldog)'],
                [EQUIPMENT, 'Harrow'],
                [EQUIPMENT, 'Harrow (Offset Disc)'],
                [EQUIPMENT, 'Harrow (Hydraulic Offset)'],
                [EQUIPMENT, 'Harrow (Offset Trailer)'],
                [EQUIPMENT, 'Harrow (Tandem Disc)'],
                [EQUIPMENT, 'Harrow (Rotary)'],
                [EQUIPMENT, 'Harrow (Power)'],
                [EQUIPMENT, 'Ridger'],
                [EQUIPMENT, 'Ridger (Disc)'],
                [EQUIPMENT, 'Ridger (Shear)'],
                [EQUIPMENT, 'Tiller'],
                [EQUIPMENT, 'Tiller (S-Shank)'],
                [EQUIPMENT, 'Tiller (C-Shank)'],
                [EQUIPMENT, 'Tiller (Vibro-flex)'],
                [EQUIPMENT, 'Tiller (Otma)'],
                [EQUIPMENT, 'Cultivator'],
                [EQUIPMENT, 'Cultivator (Shank Tiller)'],
                [EQUIPMENT, 'Cultivator (Vibro Tiller)'],
                [EQUIPMENT, 'Planter'],
                [EQUIPMENT, 'Planter (Single Kernel)'],
                [EQUIPMENT, 'Planter (Seed Drill)'],
                [EQUIPMENT, 'Planter (Wheat)'],
                [EQUIPMENT, 'Planter (Potato)'],
                [EQUIPMENT, 'Vegetable Transplanter'],
                [EQUIPMENT, 'Fine Seed Seeder'],
                [EQUIPMENT, 'Land Roller'],
                [EQUIPMENT, 'Spreader (Fertiliser)'],
                [EQUIPMENT, 'Spreader (Manure)'],
                [EQUIPMENT, 'Spreader (Lime)'],
                [EQUIPMENT, 'Mist Blower'],
                [EQUIPMENT, 'Boom Sprayer'],
                [EQUIPMENT, 'Boom Sprayer (Mounted)'],
                [EQUIPMENT, 'Boom Sprayer (Trailer)'],
                [EQUIPMENT, 'Mower'],
                [EQUIPMENT, 'Mower (Conditioner)'],
                [EQUIPMENT, 'Slasher'],
                [EQUIPMENT, 'Haymaker'],
                [EQUIPMENT, 'Hay Rake'],
                [EQUIPMENT, 'Hay Baler'],
                [EQUIPMENT, 'Hay Baler (Square)'],
                [EQUIPMENT, 'Hay Baler (Round)'],
                [EQUIPMENT, 'Bale Handler'],
                [EQUIPMENT, 'Bale Handler (Round)'],
                [EQUIPMENT, 'Bale Handler (Wrapper)'],
                [EQUIPMENT, 'Bale Handler (Shredder)'],
                [EQUIPMENT, 'Harvester (Combine Trailer)'],
                [EQUIPMENT, 'Harvester (Forage)'],
                [EQUIPMENT, 'Harvester (Forage Chop)'],
                [EQUIPMENT, 'Harvester (Forage Flail)'],
                [EQUIPMENT, 'Harvester (Thresher)'],
                [EQUIPMENT, 'Harvester (Potato Lifter)'],
                [EQUIPMENT, 'Harvester (Potato Sorter)'],
                [EQUIPMENT, 'Harvester (Groundnut Picker)'],
                [EQUIPMENT, 'Harvester (Groundnut Sheller)'],
                [EQUIPMENT, 'Harvester (Groundnut Lifter)'],
                [EQUIPMENT, 'Hammer Mill'],
                [EQUIPMENT, 'Feed Mixer'],
                [EQUIPMENT, 'Roller Mill'],
                [EQUIPMENT, 'Grain Pump'],
                [EQUIPMENT, 'Grain Grader'],
                [EQUIPMENT, 'Grain Drier'],
                [EQUIPMENT, 'Grader (Rear Mounted)'],
                [EQUIPMENT, 'Dam Scoop'],
                [EQUIPMENT, 'Post Digger'],
                [EQUIPMENT, 'Trailer'],
                [EQUIPMENT, 'Trailer (Tip)'],
                [EQUIPMENT, 'Trailer (4-Wheel)'],
                [EQUIPMENT, 'Trailer (Water Cart)'],
                [EQUIPMENT, 'Trailer (Cane)'],
                [EQUIPMENT, 'Trailer (Cane Truck)'],
                [EQUIPMENT, 'Trailer (Timber)'],
                [EQUIPMENT, 'Trailer (Timber Truck)']
            ], categoryMapper(['category', 'subCategory']))
        });

        readOnlyProperty(Asset, 'landClassesByType', {
            'crop': [
                'Cropland',
                'Cropland (Emerging)',
                'Cropland (Irrigated)',
                'Cropland (Smallholding)',
                'Greenhouses',
                'Vegetables'],
            'cropland': [
                'Cropland',
                'Cropland (Emerging)',
                'Cropland (Irrigated)',
                'Cropland (Smallholding)',
                'Greenhouses',
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
            'Greenhouses': _vegetableCrops,
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
            'crop': underscore.union(_croplandAllCrops, _vegetableCrops),
            'cropland': underscore.union(_croplandAllCrops, _vegetableCrops),
            'livestock': _grazingCrops,
            'pasture': _grazingCrops,
            'permanent crop': underscore.union(_perennialCrops, _vineyardCrops),
            'plantation': _plantationCrops
        });

        readOnlyProperty(Asset, 'improvementCategoriesByLandClass', {
            'Built-up': [AIRPORT, BUILDING, 'Crocodile Dam', DAM, DOMESTIC, EDUCATION, FENCING, 'Infrastructure', 'Laboratory', 'Office', ROADS, SECURITY, 'Trench', 'Vacant Area', WALLS],
            'Residential': [RECREATION, 'Religious', RESIDENTIAL, STAFF, SPORTS],
            'Structures (Handling)': [AQUACULTURE, 'Aviary', 'Beekeeping', DAIRY, 'Feedlot', 'Greenhouse', LIVESTOCK_HANDING, MUSHROOMS, NURSERY, PADDOCKS, PIGGERY, POULTRY],
            'Structures (Processing)': [CROP_PROCESSING, 'Feed Mill', 'Grain Mill', MEAT_PROCESSING, 'Packaging Facility', PROCESSING, 'Sugar Mill', 'Timber Mill'],
            'Structures (Retail)': [COMMERCIAL],
            'Structures (Storage)': ['Cold Storage', 'Silo', STORAGE, 'Warehouse', WINE_CELLAR],
            'Utilities': [BOREHOLE, 'Compost', EQUIPMENT, FUEL, IRRIGATION, LOGISTICS, 'Shade Nets', 'Tanks', UTILITIES, VEHICLES, WATER]
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

        privateProperty(Asset, 'getCustomTitle', function (asset, props, options) {
            return getCustomTitle(asset, props, options);
        });

        privateProperty(Asset, 'getDefaultCrop', function (landClass) {
            return (underscore.size(Asset.cropsByLandClass[landClass]) === 1 ? underscore.first(Asset.cropsByLandClass[landClass]) : undefined);
        });

        privateProperty(Asset, 'getImprovementLandClass', function (asset) {
            return getImprovementLandClass(asset);
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

        function getImprovementLandClass (instance) {
            return underscore.chain(Asset.improvementCategoriesByLandClass)
                .reduce(function (results, categories, landUse) {
                    if (underscore.contains(categories, instance.data.type)) {
                        results.push(landUse);
                    }

                    return results;
                }, [])
                .union(['Built-up'])
                .first()
                .value();
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

