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
        var instances = {
            'livestock': Livestock,
            'stock': Stock
        };

        function apply (attrs, fnName) {
            if (instances[attrs.type]) {
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

                if (underscore.contains(['crop', 'pasture', 'permanent crop', 'plantation'], instance.type) && asset.data.crop) {
                    instance.data.crop = asset.data.crop;
                }

                if (underscore.contains(['permanent crop', 'plantation'], instance.type) && asset.data.establishedDate) {
                    instance.data.establishedDate = asset.data.establishedDate;
                }

                instance.recalculate();
            }
        }

        function adjustProperty (instance, property, value) {
            underscore.each(instance.assets, function (asset) {
                if (asset.data[property] !== instance.data[property]) {
                    asset.data[property] = instance.data[property];
                    asset.data.assetValue = safeMath.times(asset.data.assetValuePerHa, asset.data.size);
                    asset.$dirty = true;
                }
            });
        }

        function recalculate (instance) {
            instance.data = underscore.extend(instance.data, underscore.reduce(instance.assets, function (totals, asset) {
                totals.size = safeMath.plus(totals.size, asset.data.size);
                totals.assetValue = safeMath.plus(totals.assetValue, (asset.data.assetValue ? asset.data.assetValue : safeMath.times(asset.data.assetValuePerHa, asset.data.size)));
                totals.assetValuePerHa = safeMath.dividedBy(totals.assetValue, totals.size);

                return totals;
            }, {}));

            instance.data.assetValue = (instance.data.size && instance.data.assetValuePerHa ?
                safeMath.times(instance.data.assetValuePerHa, instance.data.size) :
                instance.data.assetValue);
        }

        return AssetGroup;
    }]);

sdkModelAsset.factory('Asset', ['AssetBase', 'attachmentHelper', 'Base', 'computedProperty', 'Field', 'inheritModel', 'moment', 'naturalSort', 'privateProperty', 'ProductionSchedule', 'readOnlyProperty', 'safeMath', 'underscore',
    function (AssetBase, attachmentHelper, Base, computedProperty, Field, inheritModel, moment, naturalSort, privateProperty, ProductionSchedule, readOnlyProperty, safeMath, underscore) {
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

            Base.initializeObject(this.data, 'zones', []);

            this.farmId = attrs.farmId;

            this.productionSchedules = underscore.map(attrs.productionSchedules, function (schedule) {
                return ProductionSchedule.newCopy(schedule);
            });

            if (!this.data.assetValuePerHa && this.data.assetValue && this.size) {
                this.data.assetValuePerHa = safeMath.dividedBy(this.data.assetValue, this.size);
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
                {category: 'Vehicles', subCategory: 'LDV'},
                {category: 'Vehicles', subCategory: 'LDV (Double Cab)'},
                {category: 'Vehicles', subCategory: 'LDV (4-Wheel)'},
                {category: 'Vehicles', subCategory: 'LDV (Double Cab 4-Wheel)'},
                {category: 'Vehicles', subCategory: 'Truck'},
                {category: 'Vehicles', subCategory: 'Truck (Double Differential)'},
                {category: 'Vehicles', subCategory: 'Truck (Horse)'},
                {category: 'Vehicles', subCategory: 'Truck (Semi-trailer)'},
                {category: 'Vehicles', subCategory: 'Truck (Timber Trailer)'},
                {category: 'Vehicles', subCategory: 'Truck (Cane Trailer)'},
                {category: 'Machinery', subCategory: 'Tractor'},
                {category: 'Machinery', subCategory: 'Tractor (4-Wheel)'},
                {category: 'Machinery', subCategory: 'Tractor (Orchard)'},
                {category: 'Machinery', subCategory: 'Tractor (Orchard, 4-Wheel)'},
                {category: 'Machinery', subCategory: 'Road Grader'},
                {category: 'Machinery', subCategory: 'Front-end Loader'},
                {category: 'Machinery', subCategory: 'Bulldozer'},
                {category: 'Machinery', subCategory: 'Forklift'},
                {category: 'Machinery', subCategory: 'Borehole Machine'},
                {category: 'Machinery', subCategory: 'Loader (Cane)'},
                {category: 'Machinery', subCategory: 'Loader (Timber)'},
                {category: 'Machinery', subCategory: 'Harvester (Maize Combine)'},
                {category: 'Machinery', subCategory: 'Harvester (Wheat Combine)'},
                {category: 'Machinery', subCategory: 'Electric Motor'},
                {category: 'Machinery', subCategory: 'Internal Combustion Engine'},
                {category: 'Machinery', subCategory: 'Irrigation Pump'},
                {category: 'Machinery', subCategory: 'Irrigation Pump (Electrical)'},
                {category: 'Machinery', subCategory: 'Irrigation Pump (Internal Combustion Engine) '},
                {category: 'Equipment', subCategory: 'Ripper'},
                {category: 'Equipment', subCategory: 'Ripper (Sugar Cane)'},
                {category: 'Equipment', subCategory: 'Ripper (Heavy Duty)'},
                {category: 'Equipment', subCategory: 'Ripper (Auto Reset)'},
                {category: 'Equipment', subCategory: 'Plough'},
                {category: 'Equipment', subCategory: 'Plough (Moldboard)'},
                {category: 'Equipment', subCategory: 'Plough (Disc)'},
                {category: 'Equipment', subCategory: 'Plough (Chisel)'},
                {category: 'Equipment', subCategory: 'Plough (Bulldog)'},
                {category: 'Equipment', subCategory: 'Harrow'},
                {category: 'Equipment', subCategory: 'Harrow (Offset Disc)'},
                {category: 'Equipment', subCategory: 'Harrow (Hydraulic Offset)'},
                {category: 'Equipment', subCategory: 'Harrow (Offset Trailer)'},
                {category: 'Equipment', subCategory: 'Harrow (Tandem Disc)'},
                {category: 'Equipment', subCategory: 'Harrow (Rotary)'},
                {category: 'Equipment', subCategory: 'Harrow (Power)'},
                {category: 'Equipment', subCategory: 'Ridger'},
                {category: 'Equipment', subCategory: 'Ridger (Disc)'},
                {category: 'Equipment', subCategory: 'Ridger (Shear)'},
                {category: 'Equipment', subCategory: 'Tiller'},
                {category: 'Equipment', subCategory: 'Tiller (S-Shank)'},
                {category: 'Equipment', subCategory: 'Tiller (C-Shank)'},
                {category: 'Equipment', subCategory: 'Tiller (Vibro-flex)'},
                {category: 'Equipment', subCategory: 'Tiller (Otma)'},
                {category: 'Equipment', subCategory: 'Cultivator'},
                {category: 'Equipment', subCategory: 'Cultivator (Shank Tiller)'},
                {category: 'Equipment', subCategory: 'Cultivator (Vibro Tiller)'},
                {category: 'Equipment', subCategory: 'Planter'},
                {category: 'Equipment', subCategory: 'Planter (Single Kernel)'},
                {category: 'Equipment', subCategory: 'Planter (Seed Drill)'},
                {category: 'Equipment', subCategory: 'Planter (Wheat)'},
                {category: 'Equipment', subCategory: 'Planter (Potato)'},
                {category: 'Equipment', subCategory: 'Vegetable Transplanter'},
                {category: 'Equipment', subCategory: 'Fine Seed Seeder'},
                {category: 'Equipment', subCategory: 'Land Roller'},
                {category: 'Equipment', subCategory: 'Spreader (Fertiliser)'},
                {category: 'Equipment', subCategory: 'Spreader (Manure)'},
                {category: 'Equipment', subCategory: 'Spreader (Lime)'},
                {category: 'Equipment', subCategory: 'Mist Blower'},
                {category: 'Equipment', subCategory: 'Boom Sprayer'},
                {category: 'Equipment', subCategory: 'Boom Sprayer (Mounted)'},
                {category: 'Equipment', subCategory: 'Boom Sprayer (Trailer)'},
                {category: 'Equipment', subCategory: 'Mower'},
                {category: 'Equipment', subCategory: 'Mower (Conditioner)'},
                {category: 'Equipment', subCategory: 'Slasher'},
                {category: 'Equipment', subCategory: 'Haymaker'},
                {category: 'Equipment', subCategory: 'Hay Rake'},
                {category: 'Equipment', subCategory: 'Hay Baler'},
                {category: 'Equipment', subCategory: 'Hay Baler (Square)'},
                {category: 'Equipment', subCategory: 'Hay Baler (Round)'},
                {category: 'Equipment', subCategory: 'Bale Handler'},
                {category: 'Equipment', subCategory: 'Bale Handler (Round)'},
                {category: 'Equipment', subCategory: 'Bale Handler (Wrapper)'},
                {category: 'Equipment', subCategory: 'Bale Handler (Shredder)'},
                {category: 'Equipment', subCategory: 'Harvester (Combine Trailer)'},
                {category: 'Equipment', subCategory: 'Harvester (Forage)'},
                {category: 'Equipment', subCategory: 'Harvester (Forage Chop)'},
                {category: 'Equipment', subCategory: 'Harvester (Forage Flail)'},
                {category: 'Equipment', subCategory: 'Harvester (Thresher)'},
                {category: 'Equipment', subCategory: 'Harvester (Potato Lifter)'},
                {category: 'Equipment', subCategory: 'Harvester (Potato Sorter)'},
                {category: 'Equipment', subCategory: 'Harvester (Groundnut Picker)'},
                {category: 'Equipment', subCategory: 'Harvester (Groundnut Sheller)'},
                {category: 'Equipment', subCategory: 'Harvester (Groundnut Lifter)'},
                {category: 'Equipment', subCategory: 'Hammer Mill'},
                {category: 'Equipment', subCategory: 'Feed Mixer'},
                {category: 'Equipment', subCategory: 'Roller Mill'},
                {category: 'Equipment', subCategory: 'Grain Pump'},
                {category: 'Equipment', subCategory: 'Grain Grader'},
                {category: 'Equipment', subCategory: 'Grain Drier'},
                {category: 'Equipment', subCategory: 'Grader (Rear Mounted)'},
                {category: 'Equipment', subCategory: 'Dam Scoop'},
                {category: 'Equipment', subCategory: 'Post Digger'},
                {category: 'Equipment', subCategory: 'Trailer'},
                {category: 'Equipment', subCategory: 'Trailer (Tip)'},
                {category: 'Equipment', subCategory: 'Trailer (4-Wheel)'},
                {category: 'Equipment', subCategory: 'Trailer (Water Cart)'},
                {category: 'Equipment', subCategory: 'Trailer (Cane)'},
                {category: 'Equipment', subCategory: 'Trailer (Cane Truck)'},
                {category: 'Equipment', subCategory: 'Trailer (Timber)'},
                {category: 'Equipment', subCategory: 'Trailer (Timber Truck)'}
            ]
        });

        var AFGRI = 'Afgri',
            ARGICOL = 'Agricol',
            AGRIOCARE = 'Agriocare',
            ALL_GROW = 'All-Grow Seed',
            CAPSTONE = 'Capstone',
            DELALB_MONSANTO = 'Dekalb (Monsanto)',
            DELTA_SEED = 'Delta Seeds',
            DRY_BEAN = 'Dry Bean Seed Pty (Ltd)',
            KLEIN_KAROO = 'Klein Karoo',
            LINKSAAD = 'Linksaad',
            PANNAR = 'Pannar',
            PIONEER = 'Pioneer',
            SENSAKO = 'Sensako',
            SENSAKO_MONSANTO = 'Sensako (Monsanto)',
            OTHER = 'Other';

        var MAIZE_YELLOW = [
            [AFGRI,'AFG 4222 B'],
            [AFGRI,'AFG 4244'],
            [AFGRI,'AFG 4270 B'],
            [AFGRI,'AFG 4410'],
            [AFGRI,'AFG 4412 B'],
            [AFGRI,'AFG 4414'],
            [AFGRI,'AFG 4416 B'],
            [AFGRI,'AFG 4434 R'],
            [AFGRI,'AFG 4440'],
            [AFGRI,'AFG 4448'],
            [AFGRI,'AFG 4452 B'],
            [AFGRI,'AFG 4474 R'],
            [AFGRI,'AFG 4476'],
            [AFGRI,'AFG 4478 BR'],
            [AFGRI,'AFG 4512'],
            [AFGRI,'AFG 4520'],
            [AFGRI,'AFG 4522 B'],
            [AFGRI,'AFG 4530'],
            [AFGRI,'AFG 4540'],
            [AFGRI,'AFG 4546'],
            [AFGRI,'AFG 4548'],
            [AFGRI,'AFG 4566 B'],
            [AFGRI,'AFG 4572 R'],
            [AFGRI,'AFG 4660'],
            [AFGRI,'AFG 4664'],
            [AFGRI,'DK 618'],
            [ARGICOL,'IMP 50-90 BR'],
            [ARGICOL,'IMP 51-22 B'],
            [ARGICOL,'IMP 51-92'],
            [ARGICOL,'IMP 51-92 R'],
            [ARGICOL,'QS 7646'],
            [ARGICOL,'SC 602'],
            [ARGICOL,'SC 608'],
            [CAPSTONE,'CAP 121-30'],
            [CAPSTONE,'CAP 122-60'],
            [CAPSTONE,'CAP 130-120'],
            [CAPSTONE,'CAP 130-140'],
            [CAPSTONE,'CAP 444 NG'],
            [CAPSTONE,'CAP 766 NG'],
            [CAPSTONE,'CAP 9004'],
            [CAPSTONE,'CAP 9444 NG'],
            [DELALB_MONSANTO,'DKC 61-90'],
            [DELALB_MONSANTO,'DKC 62-80 BR'],
            [DELALB_MONSANTO,'DKC 62-80 BR GEN'],
            [DELALB_MONSANTO,'DKC 62-84 R'],
            [DELALB_MONSANTO,'DKC 64-78 BR'],
            [DELALB_MONSANTO,'DKC 64-78 BR GEN'],
            [DELALB_MONSANTO,'DKC 66-32 B'],
            [DELALB_MONSANTO,'DKC 66-36 R'],
            [DELALB_MONSANTO,'DKC 66-60 BR'],
            [DELALB_MONSANTO,'DKC 73-70 B GEN'],
            [DELALB_MONSANTO,'DKC 73-72'],
            [DELALB_MONSANTO,'DKC 73-74 BR GEN'],
            [DELALB_MONSANTO,'DKC 73-76 R'],
            [DELALB_MONSANTO,'DKC 80-10'],
            [DELALB_MONSANTO,'DKC 80-12 B GEN'],
            [DELALB_MONSANTO,'DKC 80-30 R'],
            [DELALB_MONSANTO,'DKC 80-40 BR GEN'],
            [DELTA_SEED,'Amber'],
            [DELTA_SEED,'DE 2004'],
            [DELTA_SEED,'DE 2006'],
            [DELTA_SEED,'DE 2016'],
            [DELTA_SEED,'DE 222'],
            [KLEIN_KAROO,'Helen'],
            [KLEIN_KAROO,'KKS 8202'],
            [KLEIN_KAROO,'KKS 8204 B'],
            [KLEIN_KAROO,'KKS 8400'],
            [KLEIN_KAROO,'KKS 8402'],
            [LINKSAAD,'LS 8518'],
            [LINKSAAD,'LS 8524 R'],
            [LINKSAAD,'LS 8526'],
            [LINKSAAD,'LS 8528 R'],
            [LINKSAAD,'LS 8532 B'],
            [LINKSAAD,'LS 8536 B'],
            [PANNAR,'BG 3268'],
            [PANNAR,'BG 3292'],
            [PANNAR,'BG 3492BR'],
            [PANNAR,'BG 3568R'],
            [PANNAR,'BG 3592R'],
            [PANNAR,'BG 3768BR'],
            [PANNAR,'BG 4296'],
            [PANNAR,'BG 6308B'],
            [PANNAR,'PAN 14'],
            [PANNAR,'PAN 3D-736 BR'],
            [PANNAR,'PAN 3P-502 R'],
            [PANNAR,'PAN 3P-730 BR'],
            [PANNAR,'PAN 3Q-222'],
            [PANNAR,'PAN 3Q-240'],
            [PANNAR,'PAN 3Q-740 BR'],
            [PANNAR,'PAN 3R-644 R'],
            [PANNAR,'PAN 4P-228'],
            [PANNAR,'PAN 4P-716 BR'],
            [PANNAR,'PAN 6126 '],
            [PANNAR,'PAN 66'],
            [PANNAR,'PAN 6616'],
            [PANNAR,'PAN 6P-110'],
            [PANNAR,'PAN 6P110'],
            [PANNAR,'PAN 6Q-408B'],
            [PANNAR,'PAN 6Q-508 R'],
            [PANNAR,'PAN 6Q-708 BR'],
            [PIONEER,'P 1615 R'],
            [PIONEER,'P 2048'],
            [PIONEER,'Phb 31D21 B'],
            [PIONEER,'Phb 31D24'],
            [PIONEER,'Phb 31D46 BR'],
            [PIONEER,'Phb 31D48 B'],
            [PIONEER,'Phb 31G54 BR'],
            [PIONEER,'Phb 31G56 R'],
            [PIONEER,'Phb 31K58 B'],
            [PIONEER,'Phb 32D95 BR'],
            [PIONEER,'Phb 32D96 B'],
            [PIONEER,'Phb 32D99'],
            [PIONEER,'Phb 32P68 R'],
            [PIONEER,'Phb 32T50'],
            [PIONEER,'Phb 32W71'],
            [PIONEER,'Phb 32W72 B'],
            [PIONEER,'Phb 33A14 B'],
            [PIONEER,'Phb 33H52 B'],
            [PIONEER,'Phb 33H56'],
            [PIONEER,'Phb 33Y72 B'],
            [PIONEER,'Phb 33Y74'],
            [PIONEER,'Phb 3442'],
            [PIONEER,'Phb 34N44 B'],
            [PIONEER,'Phb 34N45 BR'],
            [PIONEER,'Phb 35T05 R'],
            [SENSAKO_MONSANTO,'SNK 2472'],
            [SENSAKO_MONSANTO,'SNK 2682'],
            [SENSAKO_MONSANTO,'SNK 2778'],
            [SENSAKO_MONSANTO,'SNK 2900'],
            [SENSAKO_MONSANTO,'SNK 2942'],
            [SENSAKO_MONSANTO,'SNK 2972'],
            [SENSAKO_MONSANTO,'SNK 6326 B'],
            [SENSAKO_MONSANTO,'SNK 7510 Y'],
            [SENSAKO_MONSANTO,'SNK 8520'],
            [OTHER,'Brasco'],
            [OTHER,'Cobber Flint'],
            [OTHER,'Cumbre'],
            [OTHER,'Energy'],
            [OTHER,'Gold Finger'],
            [OTHER,'High Flyer'],
            [OTHER,'IMP 50-10 R'],
            [OTHER,'IMP 51-22'],
            [OTHER,'IMP 52-12'],
            [OTHER,'MEH 114'],
            [OTHER,'MMH 1765'],
            [OTHER,'MMH 8825'],
            [OTHER,'Maverik'],
            [OTHER,'NK Arma'],
            [OTHER,'NK MAYOR B'],
            [OTHER,'NS 5000'],
            [OTHER,'NS 5004'],
            [OTHER,'NS 5066'],
            [OTHER,'NS 5914'],
            [OTHER,'NS 5916'],
            [OTHER,'NS 5918'],
            [OTHER,'NS 5920'],
            [OTHER,'Premium Flex'],
            [OTHER,'QS 7608'],
            [OTHER,'RO 430'],
            [OTHER,'SA 24'],
            [OTHER,'SABI 7004'],
            [OTHER,'SABI 7200'],
            [OTHER,'Silmaster'],
            [OTHER,'Syncerus'],
            [OTHER,'US 9570'],
            [OTHER,'US 9580'],
            [OTHER,'US 9600'],
            [OTHER,'US 9610'],
            [OTHER,'US 9620'],
            [OTHER,'US 9770'],
            [OTHER,'US 9772'],
            [OTHER,'Woodriver']
        ];

        var MAIZE_WHITE = [
            [AFGRI,'AFG 4211'],
            [AFGRI,'AFG 4321'],
            [AFGRI,'AFG 4331'],
            [AFGRI,'AFG 4333'],
            [AFGRI,'AFG 4361'],
            [AFGRI,'AFG 4383'],
            [AFGRI,'AFG 4411'],
            [AFGRI,'AFG 4445'],
            [AFGRI,'AFG 4447'],
            [AFGRI,'AFG 4471'],
            [AFGRI,'AFG 4475 B'],
            [AFGRI,'AFG 4477'],
            [AFGRI,'AFG 4479 R'],
            [AFGRI,'AFG 4501'],
            [AFGRI,'AFG 4517'],
            [AFGRI,'AFG 4555'],
            [AFGRI,'AFG 4571 B'],
            [AFGRI,'AFG 4573 B'],
            [AFGRI,'AFG 4575'],
            [AFGRI,'AFG 4577 B'],
            [AFGRI,'AFG 4579 B'],
            [AFGRI,'AFG 4581 BR'],
            [AFGRI,'AFG 4611'],
            [AFGRI,'AFG 4663'],
            [AFGRI,'AFRIC 1'],
            [ARGICOL,'IMP 52-11'],
            [ARGICOL,'SC 701'],
            [ARGICOL,'SC 709'],
            [CAPSTONE,'CAP 341 NG'],
            [CAPSTONE,'CAP 341 T NG'],
            [CAPSTONE,'CAP 441 NG'],
            [CAPSTONE,'CAP 775 NG'],
            [CAPSTONE,'CAP 9001'],
            [CAPSTONE,'CAP 9013'],
            [CAPSTONE,'CAP 9421'],
            [DELALB_MONSANTO,'CRN 3505'],
            [DELALB_MONSANTO,'CRN 4141'],
            [DELALB_MONSANTO,'DKC 77-61 B'],
            [DELALB_MONSANTO,'DKC 77-85 B GEN'],
            [DELALB_MONSANTO,'DKC 78-15 B'],
            [DELALB_MONSANTO,'DKC 78-17 B'],
            [DELALB_MONSANTO,'DKC 78-35 R'],
            [DELALB_MONSANTO,'DKC 78-45 BR'],
            [DELALB_MONSANTO,'DKC 78-45 BR GEN'],
            [DELALB_MONSANTO,'DKC 79-05'],
            [DELTA_SEED,'DE 111'],
            [DELTA_SEED,'DE 303'],
            [KLEIN_KAROO,'KKS 4383'],
            [KLEIN_KAROO,'KKS 4445'],
            [KLEIN_KAROO,'KKS 4447'],
            [KLEIN_KAROO,'KKS 4471'],
            [KLEIN_KAROO,'KKS 4473'],
            [KLEIN_KAROO,'KKS 4477'],
            [KLEIN_KAROO,'KKS 4479 R'],
            [KLEIN_KAROO,'KKS 4485'],
            [KLEIN_KAROO,'KKS 4501'],
            [KLEIN_KAROO,'KKS 4517'],
            [KLEIN_KAROO,'KKS 4519'],
            [KLEIN_KAROO,'KKS 4555'],
            [KLEIN_KAROO,'KKS 4575'],
            [KLEIN_KAROO,'KKS 4581 BR'],
            [KLEIN_KAROO,'KKS 8401'],
            [LINKSAAD,'LS 8519'],
            [LINKSAAD,'LS 8529'],
            [LINKSAAD,'LS 8533 R'],
            [LINKSAAD,'LS 8535 B'],
            [LINKSAAD,'LS 8537'],
            [LINKSAAD,'LS 8539 B'],
            [PANNAR,'BG 5485B'],
            [PANNAR,'BG 5685R'],
            [PANNAR,'BG4201'],
            [PANNAR,'BG4401B'],
            [PANNAR,'BG5285'],
            [PANNAR,'BG5785BR'],
            [PANNAR,'BG6683R'],
            [PANNAR,'PAN 413'],
            [PANNAR,'PAN 4P-767BR'],
            [PANNAR,'PAN 53'],
            [PANNAR,'PAN 5Q-649 R'],
            [PANNAR,'PAN 5Q-749 BR'],
            [PANNAR,'PAN 5Q-751BR'],
            [PANNAR,'PAN 6227'],
            [PANNAR,'PAN 6479'],
            [PANNAR,'PAN 6611'],
            [PANNAR,'PAN 6671'],
            [PANNAR,'PAN 67'],
            [PANNAR,'PAN 6777'],
            [PANNAR,'PAN 69'],
            [PANNAR,'PAN 6Q-745BR'],
            [PANNAR,'PAN 93'],
            [PANNAR,'PAN413'],
            [PANNAR,'PAN53'],
            [PANNAR,'PAN6Q245'],
            [PANNAR,'PAN6Q345CB'],
            [PANNAR,'SC 701 (Green mealie)'],
            [PIONEER,'P 2369 W'],
            [PIONEER,'P 2653 WB'],
            [PIONEER,'P 2823 WB'],
            [PIONEER,'P 2961 W'],
            [PIONEER,'Phb 30B95 B'],
            [PIONEER,'Phb 30B97 BR'],
            [PIONEER,'Phb 30D04 R'],
            [PIONEER,'Phb 30D07 B'],
            [PIONEER,'Phb 30D09 BR'],
            [PIONEER,'Phb 30Y79 B'],
            [PIONEER,'Phb 30Y81 R'],
            [PIONEER,'Phb 30Y83'],
            [PIONEER,'Phb 31M09'],
            [PIONEER,'Phb 31M84 BR'],
            [PIONEER,'Phb 31T91'],
            [PIONEER,'Phb 31V31'],
            [PIONEER,'Phb 3210B'],
            [PIONEER,'Phb 32A05 B'],
            [PIONEER,'Phb 32B07 BR'],
            [PIONEER,'Phb 32Y85'],
            [PIONEER,'Phb 32Y87 B'],
            [SENSAKO_MONSANTO,'SNK 2021'],
            [SENSAKO_MONSANTO,'SNK 2147'],
            [SENSAKO_MONSANTO,'SNK 2401'],
            [SENSAKO_MONSANTO,'SNK 2551'],
            [SENSAKO_MONSANTO,'SNK 2721'],
            [SENSAKO_MONSANTO,'SNK 2911'],
            [SENSAKO_MONSANTO,'SNK 2969'],
            [SENSAKO_MONSANTO,'SNK 6025'],
            [SENSAKO_MONSANTO,'SNK 7811 B'],
            [OTHER,'CG 4141'],
            [OTHER,'GM 2000'],
            [OTHER,'KGALAGADI'],
            [OTHER,'MRI 514'],
            [OTHER,'MRI 624'],
            [OTHER,'NG 761'],
            [OTHER,'NS 5913'],
            [OTHER,'NS 5917'],
            [OTHER,'NS 5919'],
            [OTHER,'PGS 7053'],
            [OTHER,'PGS 7061'],
            [OTHER,'PGS 7071'],
            [OTHER,'PLATINUM'],
            [OTHER,'Panthera'],
            [OTHER,'QS 7707'],
            [OTHER,'RO 413'],
            [OTHER,'RO 413'],
            [OTHER,'RO 419'],
            [OTHER,'SAFFIER'],
            [OTHER,'SC 401'],
            [OTHER,'SC 403'],
            [OTHER,'SC 405'],
            [OTHER,'SC 407'],
            [OTHER,'SC 513'],
            [OTHER,'SC 627'],
            [OTHER,'SC 631'],
            [OTHER,'SC 633'],
            [OTHER,'SC 713'],
            [OTHER,'SC 715'],
            [OTHER,'Scout']];

        readOnlyProperty(Asset, 'cultivarsByCrop', {
            'Barley':[
                [ARGICOL,'SKG 9'],
                [ARGICOL,'SVG 13'],
                [OTHER,'Clipper'],
                [OTHER,'Cocktail'],
                [OTHER,'Puma'],
                [OTHER,'SabbiErica'],
                [OTHER,'SabbiNemesia'],
                [OTHER,'SSG 564'],
                [OTHER,'SSG 585']
            ],
            'Bean (Dry)':[
                [CAPSTONE,'CAP 2000'],
                [CAPSTONE,'CAP 2001'],
                [CAPSTONE,'CAP 2008'],
                [DRY_BEAN,'DBS 310'],
                [DRY_BEAN,'DBS 360'],
                [DRY_BEAN,'DBS 830'],
                [DRY_BEAN,'DBS 840'],
                [DRY_BEAN,'Kranskop HR1'],
                [DRY_BEAN,'OPS RS1'],
                [DRY_BEAN,'OPS RS2'],
                [DRY_BEAN,'OPS RS4'],
                [DRY_BEAN,'OPS-KW1'],
                [DRY_BEAN,'RS 5'],
                [DRY_BEAN,'RS 6'],
                [DRY_BEAN,'RS 7'],
                [PANNAR,'PAN 116'],
                [PANNAR,'PAN 123'],
                [PANNAR,'PAN 128'],
                [PANNAR,'PAN 135'],
                [PANNAR,'PAN 139'],
                [PANNAR,'PAN 146'],
                [PANNAR,'PAN 148'],
                [PANNAR,'PAN 148 Plus'],
                [PANNAR,'PAN 9213'],
                [PANNAR,'PAN 9216'],
                [PANNAR,'PAN 9225'],
                [PANNAR,'PAN 9249'],
                [PANNAR,'PAN 9280'],
                [PANNAR,'PAN 9281'],
                [PANNAR,'PAN 9292'],
                [PANNAR,'PAN 9298'],
                [OTHER,'AFG 470'],
                [OTHER,'AFG 471'],
                [OTHER,'BONUS'],
                [OTHER,'CALEDON'],
                [OTHER,'CARDINAL'],
                [OTHER,'CERRILLOS'],
                [OTHER,'DONGARA'],
                [OTHER,'DPO 820'],
                [OTHER,'JENNY'],
                [OTHER,'KAMIESBERG'],
                [OTHER,'KOMATI'],
                [OTHER,'KRANSKOP'],
                [OTHER,'MAJUBA'],
                [OTHER,'MASKAM'],
                [OTHER,'MINERVA'],
                [OTHER,'MKONDENI'],
                [OTHER,'MKUZI'],
                [OTHER,'RUBY'],
                [OTHER,'SC Silk'],
                [OTHER,'SC Superior'],
                [OTHER,'SEDERBERG'],
                [OTHER,'SSB 20'],
                [OTHER,'STORMBERG'],
                [OTHER,'TEEBUS'],
                [OTHER,'TEEBUS-RCR2'],
                [OTHER,'TEEBUS-RR1'],
                [OTHER,'TYGERBERG'],
                [OTHER,'UKULINGA'],
                [OTHER,'UMTATA'],
                [OTHER,'WERNA']
            ],
            'Canola':[
                [ARGICOL,'Aga Max'],
                [ARGICOL,'AV Garnet'],
                [ARGICOL,'CB Jardee HT'],
                [ARGICOL,'Cobbler'],
                [ARGICOL,'Tawriffic'],
                [KLEIN_KAROO,'Hyola 61'],
                [KLEIN_KAROO,'Rocket CL'],
                [KLEIN_KAROO,'Thunder TT'],
                [KLEIN_KAROO,'Varola 54']
            ],
            'Grain Sorghum':[
                [ARGICOL,'AVENGER GH'],
                [ARGICOL,'DOMINATOR GM'],
                [ARGICOL,'ENFORCER GM'],
                [ARGICOL,'MAXIMIZER'],
                [ARGICOL,'PREMIUM 4065 T GH'],
                [ARGICOL,'PREMIUM 100'],
                [ARGICOL,'NS 5511 GH'],
                [ARGICOL,'NS 5540'],
                [ARGICOL,'NS 5555'],
                [ARGICOL,'NS 5655 GM'],
                [ARGICOL,'NS 5751'],
                [ARGICOL,'NS 5832'],
                [ARGICOL,'TIGER GM'],
                [CAPSTONE,'CAP 1002'],
                [CAPSTONE,'CAP 1003'],
                [CAPSTONE,'CAP 1004'],
                [KLEIN_KAROO,'MR 32 GL'],
                [KLEIN_KAROO,'MR 43 GL'],
                [KLEIN_KAROO,'MR BUSTER GL'],
                [KLEIN_KAROO,'MR PACER'],
                [PANNAR,'PAN 8625 GH'],
                [PANNAR,'PAN 8816 GM'],
                [PANNAR,'PAN 8906 GM'],
                [PANNAR,'PAN 8909 GM'],
                [PANNAR,'PAN 8006 T'],
                [PANNAR,'PAN 8507'],
                [PANNAR,'PAN 8609'],
                [PANNAR,'PAN 8648'],
                [PANNAR,'PAN 8706'],
                [PANNAR,'PAN 8806'],
                [PANNAR,'PAN 8901'],
                [PANNAR,'PAN 8902'],
                [PANNAR,'PAN 8903'],
                [PANNAR,'PAN 8904'],
                [PANNAR,'PAN 8905'],
                [PANNAR,'PAN 8906'],
                [PANNAR,'PAN 8907'],
                [PANNAR,'PAN 8908'],
                [PANNAR,'PAN 8909'],
                [PANNAR,'PAN 8911'],
                [PANNAR,'PAN 8912'],
                [PANNAR,'PAN 8913'],
                [PANNAR,'PAN 8914'],
                [PANNAR,'PAN 8915'],
                [PANNAR,'PAN 8916'],
                [PANNAR,'PAN 8918'],
                [PANNAR,'PAN 8919'],
                [PANNAR,'PAN 8920'],
                [PANNAR,'PAN 8921'],
                [PANNAR,'PAN 8922'],
                [PANNAR,'PAN 8923'],
                [PANNAR,'PAN 8924'],
                [PANNAR,'PAN 8925'],
                [PANNAR,'PAN 8926'],
                [PANNAR,'PAN 8927'],
                [PANNAR,'PAN 8928'],
                [PANNAR,'PAN 8929'],
                [PANNAR,'PAN 8930'],
                [PANNAR,'PAN 8931'],
                [PANNAR,'PAN 8932'],
                [PANNAR,'PAN 8933'],
                [PANNAR,'PAN 8936'],
                [PANNAR,'PAN 8937'],
                [PANNAR,'PAN 8938'],
                [PANNAR,'PAN 8939'],
                [PANNAR,'PAN 8940'],
                [PANNAR,'PAN 8966'],
                [OTHER,'APN 881'],
                [OTHER,'MACIA-SA'],
                [OTHER,'NK 8830'],
                [OTHER,'OVERFLOW'],
                [OTHER,'SA 1302-M27'],
                [OTHER,'TITAN'],
                [OTHER,'X868']
            ],
            'Maize': underscore.union(MAIZE_YELLOW, MAIZE_WHITE).sort(function (itemA, itemB) {
                return naturalSort(itemA.join(), itemB.join());
            }),
            'Maize (Yellow)': MAIZE_YELLOW,
            'Maize (White)': MAIZE_WHITE,
            'Oat':[
                [ARGICOL,'Magnifico'],
                [ARGICOL,'Maida'],
                [ARGICOL,'Nugene'],
                [ARGICOL,'Overberg'],
                [ARGICOL,'Pallinup'],
                [ARGICOL,'Saia'],
                [ARGICOL,'SWK001'],
                [SENSAKO_MONSANTO],
                [SENSAKO_MONSANTO,'SSH 39W'],
                [SENSAKO_MONSANTO,'SSH 405'],
                [SENSAKO_MONSANTO,'SSH 421'],
                [SENSAKO_MONSANTO,'SSH 423'],
                [SENSAKO_MONSANTO,'SSH 491'],
                [OTHER,'Drakensberg'],
                [OTHER,'H06/19'],
                [OTHER,'H06/20'],
                [OTHER,'H07/04'],
                [OTHER,'H07/05'],
                [OTHER,'Heros'],
                [OTHER,'Kompasberg'],
                [OTHER,'Le Tucana'],
                [OTHER,'Maluti'],
                [OTHER,'Potoroo'],
                [OTHER,'Witteberg']
            ],
            'Soya Bean':[
                [AGRIOCARE,'AGC 58007 R'],
                [AGRIOCARE,'AGC 60104 R'],
                [AGRIOCARE,'AGC 64107 R'],
                [AGRIOCARE,'AS 4801 R'],
                [LINKSAAD,'LS 6146 R'],
                [LINKSAAD,'LS 6150 R'],
                [LINKSAAD,'LS 6161 R'],
                [LINKSAAD,'LS 6164 R'],
                [LINKSAAD,'LS 6248 R'],
                [LINKSAAD,'LS 6261 R'],
                [LINKSAAD,'LS 6444 R'],
                [LINKSAAD,'LS 6466 R'],
                [PANNAR,'A 5409 RG'],
                [PANNAR,'PAN 1454 R'],
                [PANNAR,'PAN 1583 R'],
                [PANNAR,'PAN 1664 R'],
                [PANNAR,'PAN 1666 R'],
                [PIONEER,'Phb 94Y80 R'],
                [PIONEER,'Phb 95B53 R'],
                [PIONEER,'Phb 95Y20 R'],
                [PIONEER,'Phb 95Y40 R'],
                [OTHER,'AG 5601'],
                [OTHER,'AMSTEL NO 1'],
                [OTHER,'DUMELA'],
                [OTHER,'DUNDEE'],
                [OTHER,'EGRET'],
                [OTHER,'HERON'],
                [OTHER,'HIGHVELD TOP'],
                [OTHER,'IBIS 2000'],
                [OTHER,'JF 91'],
                [OTHER,'JIMMY'],
                [OTHER,'KIAAT'],
                [OTHER,'KNAP'],
                [OTHER,'LEX 1233 R'],
                [OTHER,'LEX 1235 R'],
                [OTHER,'LEX 2257 R'],
                [OTHER,'LEX 2685 R'],
                [OTHER,'LIGHTNING'],
                [OTHER,'MARULA'],
                [OTHER,'MARUTI'],
                [OTHER,'MOPANIE'],
                [OTHER,'MPIMBO'],
                [OTHER,'MUKWA'],
                [OTHER,'NQUTU'],
                [OTHER,'OCTA'],
                [OTHER,'SONOP'],
                [OTHER,'SPITFIRE'],
                [OTHER,'STORK'],
                [OTHER,'TAMBOTIE'],
                [OTHER,'WENNER']
            ],
            'Sugarcane':[
                [OTHER,'ACRUNCH'],
                [OTHER,'BONITA'],
                [OTHER,'CHIEFTAIN'],
                [OTHER,'EARLISWEET'],
                [OTHER,'GLADIATOR'],
                [OTHER,'GSS 9299'],
                [OTHER,'HOLLYWOOD'],
                [OTHER,'HONEYMOON'],
                [OTHER,'INFERNO'],
                [OTHER,'JUBILEE'],
                [OTHER,'MADHUR'],
                [OTHER,'MAJESTY'],
                [OTHER,'MANTRA'],
                [OTHER,'MATADOR'],
                [OTHER,'MAX'],
                [OTHER,'MEGATON'],
                [OTHER,'MMZ 9903'],
                [OTHER,'ORLA'],
                [OTHER,'OSCAR'],
                [OTHER,'OVERLAND'],
                [OTHER,'PRIMEPLUS'],
                [OTHER,'RUSALTER'],
                [OTHER,'RUSTICO'],
                [OTHER,'RUSTLER'],
                [OTHER,'SENTINEL'],
                [OTHER,'SHIMMER'],
                [OTHER,'STAR 7708'],
                [OTHER,'STAR 7713'],
                [OTHER,'STAR 7714'],
                [OTHER,'STAR 7715'],
                [OTHER,'STAR 7717'],
                [OTHER,'STAR 7718'],
                [OTHER,'STAR 7719'],
                [OTHER,'STETSON'],
                [OTHER,'SWEET SUCCESS'],
                [OTHER,'SWEET SURPRISE'],
                [OTHER,'SWEET TALK'],
                [OTHER,'TENDER TREAT'],
                [OTHER,'WINSTAR']
            ],
            'Sunflower':[
                [ARGICOL,'AGSUN 5161 CL'],
                [ARGICOL,'AGSUN 5182 CL'],
                [ARGICOL,'Agsun 5264'],
                [ARGICOL,'Agsun 5671'],
                [ARGICOL,'Agsun 8251'],
                [ARGICOL,'Nonjana'],
                [ARGICOL,'SUNSTRIPE'],
                [KLEIN_KAROO,'AFG 271'],
                [KLEIN_KAROO,'HYSUN 333'],
                [KLEIN_KAROO,'KKS 318'],
                [KLEIN_KAROO,'NK ADAGIO'],
                [KLEIN_KAROO,'NK Armoni'],
                [KLEIN_KAROO,'NK FERTI'],
                [KLEIN_KAROO,'Sirena'],
                [KLEIN_KAROO,'Sunbird'],
                [PANNAR,'PAN 7033'],
                [PANNAR,'PAN 7049'],
                [PANNAR,'PAN 7050'],
                [PANNAR,'PAN 7057'],
                [PANNAR,'PAN 7063 CL'],
                [PANNAR,'PAN 7080'],
                [PANNAR,'PAN 7086 HO'],
                [PANNAR,'PAN 7095 CL'],
                [PANNAR,'PAN 7351'],
                [OTHER,'Ella'],
                [OTHER,'Grainco Sunstripe'],
                [OTHER,'HV 3037'],
                [OTHER,'HYSUN 334'],
                [OTHER,'HYSUN 338'],
                [OTHER,'HYSUN 346'],
                [OTHER,'HYSUN 350'],
                [OTHER,'Jade Emperor'],
                [OTHER,'Marica-2'],
                [OTHER,'NK Adagio CL'],
                [OTHER,'Nallimi CL'],
                [OTHER,'SEA 2088 CL AO'],
                [OTHER,'SY 4045'],
                [OTHER,'SY 4200'],
                [OTHER,'Sikllos CL'],
                [OTHER,'WBS 3100']
            ],
            'Triticale':[
                [ARGICOL,'AG Beacon'],
                [ARGICOL,'Rex'],
                [PANNAR,'PAN 248'],
                [PANNAR,'PAN 299'],
                [OTHER,'Bacchus'],
                [OTHER,'Cloc 1'],
                [OTHER,'Cultivars'],
                [OTHER,'Falcon'],
                [OTHER,'Ibis'],
                [OTHER,'Kiewiet'],
                [OTHER,'Korhaan'],
                [OTHER,'Tobie'],
                [OTHER,'US 2009'],
                [OTHER,'US 2010'],
                [OTHER,'US2007']
            ],
            'Wheat':[
                [AFGRI,'AFG 554-8'],
                [AFGRI,'AFG 75-3'],
                [ALL_GROW,'BUFFELS'],
                [ALL_GROW,'DUZI'],
                [ALL_GROW,'KARIEGA'],
                [ALL_GROW,'KROKODIL'],
                [ALL_GROW,'SABIE'],
                [ALL_GROW,'STEENBRAS'],
                [KLEIN_KAROO,'HARTBEES'],
                [KLEIN_KAROO,'KOMATI'],
                [KLEIN_KAROO,'KOONAP'],
                [KLEIN_KAROO,'MATLABAS'],
                [KLEIN_KAROO,'SELATI'],
                [KLEIN_KAROO,'SENQU'],
                [SENSAKO,'CRN 826'],
                [SENSAKO,'ELANDS'],
                [SENSAKO,'SST 015'],
                [SENSAKO,'SST 026'],
                [SENSAKO,'SST 027'],
                [SENSAKO,'SST 035'],
                [SENSAKO,'SST 036'],
                [SENSAKO,'SST 037'],
                [SENSAKO,'SST 039'],
                [SENSAKO,'SST 047'],
                [SENSAKO,'SST 056'],
                [SENSAKO,'SST 057'],
                [SENSAKO,'SST 065'],
                [SENSAKO,'SST 077'],
                [SENSAKO,'SST 087'],
                [SENSAKO,'SST 088'],
                [SENSAKO,'SST 094'],
                [SENSAKO,'SST 096'],
                [SENSAKO,'SST 107'],
                [SENSAKO,'SST 124'],
                [SENSAKO,'SST 308'],
                [SENSAKO,'SST 316'],
                [SENSAKO,'SST 317'],
                [SENSAKO,'SST 319'],
                [SENSAKO,'SST 322'],
                [SENSAKO,'SST 333'],
                [SENSAKO,'SST 334'],
                [SENSAKO,'SST 347'],
                [SENSAKO,'SST 356'],
                [SENSAKO,'SST 363'],
                [SENSAKO,'SST 366'],
                [SENSAKO,'SST 367'],
                [SENSAKO,'SST 374'],
                [SENSAKO,'SST 387'],
                [SENSAKO,'SST 398'],
                [SENSAKO,'SST 399'],
                [SENSAKO,'SST 802'],
                [SENSAKO,'SST 805'],
                [SENSAKO,'SST 806'],
                [SENSAKO,'SST 807'],
                [SENSAKO,'SST 815'],
                [SENSAKO,'SST 816'],
                [SENSAKO,'SST 822'],
                [SENSAKO,'SST 825'],
                [SENSAKO,'SST 835'],
                [SENSAKO,'SST 843'],
                [SENSAKO,'SST 866'],
                [SENSAKO,'SST 867'],
                [SENSAKO,'SST 875'],
                [SENSAKO,'SST 876'],
                [SENSAKO,'SST 877'],
                [SENSAKO,'SST 878'],
                [SENSAKO,'SST 884'],
                [SENSAKO,'SST 885'],
                [SENSAKO,'SST 886'],
                [SENSAKO,'SST 895'],
                [SENSAKO,'SST 896'],
                [SENSAKO,'SST 935'],
                [SENSAKO,'SST 936'],
                [SENSAKO,'SST 946'],
                [SENSAKO,'SST 954'],
                [SENSAKO,'SST 963'],
                [SENSAKO,'SST 964'],
                [SENSAKO,'SST 966'],
                [SENSAKO,'SST 972'],
                [SENSAKO,'SST 983'],
                [SENSAKO,'SST 0127'],
                [SENSAKO,'SST 1327'],
                [SENSAKO,'SST 3137'],
                [SENSAKO,'SST 8125'],
                [SENSAKO,'SST 8126'],
                [SENSAKO,'SST 8134'],
                [SENSAKO,'SST 8135'],
                [SENSAKO,'SST 8136'],
                [PANNAR,'PAN 3118'],
                [PANNAR,'PAN 3120'],
                [PANNAR,'PAN 3122'],
                [PANNAR,'PAN 3144'],
                [PANNAR,'PAN 3161'],
                [PANNAR,'PAN 3172'],
                [PANNAR,'PAN 3195'],
                [PANNAR,'PAN 3198'],
                [PANNAR,'PAN 3355'],
                [PANNAR,'PAN 3364'],
                [PANNAR,'PAN 3368'],
                [PANNAR,'PAN 3369'],
                [PANNAR,'PAN 3377'],
                [PANNAR,'PAN 3378'],
                [PANNAR,'PAN 3379'],
                [PANNAR,'PAN 3394'],
                [PANNAR,'PAN 3400'],
                [PANNAR,'PAN 3404'],
                [PANNAR,'PAN 3405'],
                [PANNAR,'PAN 3408'],
                [PANNAR,'PAN 3434'],
                [PANNAR,'PAN 3471'],
                [PANNAR,'PAN 3478'],
                [PANNAR,'PAN 3489'],
                [PANNAR,'PAN 3490'],
                [PANNAR,'PAN 3492'],
                [PANNAR,'PAN 3497'],
                [PANNAR,'PAN 3111'],
                [PANNAR,'PAN 3349'],
                [PANNAR,'PAN 3515'],
                [PANNAR,'PAN 3623'],
                [OTHER,'BAVIAANS'],
                [OTHER,'BELINDA'],
                [OTHER,'BETTA-DN'],
                [OTHER,'BIEDOU'],
                [OTHER,'CALEDON'],
                [OTHER,'CARINA'],
                [OTHER,'CAROL'],
                [OTHER,'GARIEP'],
                [OTHER,'HUGENOOT'],
                [OTHER,'INIA'],
                [OTHER,'KOUGA'],
                [OTHER,'KWARTEL'],
                [OTHER,'LIMPOPO'],
                [OTHER,'MacB'],
                [OTHER,'MARICO'],
                [OTHER,'NOSSOB'],
                [OTHER,'OLIFANTS'],
                [OTHER,'SNACK'],
                [OTHER,'TAMBOTI'],
                [OTHER,'TANKWA'],
                [OTHER,'TARKA'],
                [OTHER,'TIMBAVATI'],
                [OTHER,'TUGELA-DN'],
                [OTHER,'UMLAZI'],
                [OTHER,'RATEL']
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
                                return instance.data.establishedDate && s.replaceAll(moment(options.asOfDate).from(instance.data.establishedDate, true), 'a ', '1 ');
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
