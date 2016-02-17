var sdkHelperAssetApp = angular.module('ag.sdk.helper.asset', ['ag.sdk.helper.farmer', 'ag.sdk.helper.attachment', 'ag.sdk.library']);

sdkHelperAssetApp.factory('assetHelper', ['$filter', 'attachmentHelper', 'landUseHelper', 'underscore', function($filter, attachmentHelper, landUseHelper, underscore) {
    var _assetTitle = function (asset) {
        if (asset.data) {
            switch (asset.type) {
                case 'crop':
                case 'permanent crop':
                case 'plantation':
                    return (asset.data.plantedArea ? $filter('number')(asset.data.plantedArea, 2) + 'Ha' : '') +
                       (asset.data.plantedArea && asset.data.crop ? ' of ' : '') +
                       (asset.data.crop ? asset.data.crop : '') +
                       (asset.data.fieldName ? ' on field ' + asset.data.fieldName : '');
                case 'farmland':
                    return (asset.data.label ? asset.data.label :
                        (asset.data.portionLabel ? asset.data.portionLabel :
                            (asset.data.portionNumber ? 'Ptn. ' + asset.data.portionNumber : 'Rem. extent of farm')));
                case 'improvement':
                    return asset.data.name;
                case 'cropland':
                    return (asset.data.equipped ? 'Irrigated ' + asset.type + ' (' + (asset.data.irrigation ? asset.data.irrigation + ' irrigation from ' : '')
                        + asset.data.waterSource + ')' : (asset.data.irrigated ? 'Irrigable, unequipped ' : 'Non irrigable ') + asset.type)
                        + (asset.data.fieldName ? ' on field ' + asset.data.fieldName : '');
                case 'livestock':
                    return asset.data.type + (asset.data.category ? ' - ' + asset.data.category : '');
                case 'pasture':
                    return (asset.data.intensified ? (asset.data.crop || 'Intensified pasture') : 'Natural grazing') +
                        (asset.data.fieldName ? ' on field ' + asset.data.fieldName : '');
                case 'vme':
                    return asset.data.category + (asset.data.model ? ' model ' + asset.data.model : '');
                case 'wasteland':
                    return 'Wasteland';
                case 'water source':
                case 'water right':
                    return asset.data.waterSource + (asset.data.fieldName ? ' on field ' + asset.data.fieldName : '');
            }
        }

        return _assetTypes[type];
    };

    var _listServiceMap = function(item, metadata) {
        var map = {
            id: item.id || item.$id,
            type: item.type,
            updatedAt: item.updatedAt
        };

        if (item.data) {
            if (item.type == 'crop') {
                map.title = _assetTitle(item);
                map.subtitle = (item.data.season ? item.data.season : '');
                map.groupby = item.farmId;
            } else if (item.type == 'farmland') {
                map.title = _assetTitle(item);
                map.subtitle = (item.data.area !== undefined ? 'Area: ' + $filter('number')(item.data.area, 2) + 'Ha' : 'Unknown area');
                map.groupby = item.farmId;
            } else if (item.type == 'improvement') {
                map.title = _assetTitle(item);
                // Might want to edit this further so that title and subtitle are not identical in most cases
                map.subtitle = item.data.type + (item.data.category ? ' - ' + item.data.category : '');
                map.summary = (item.data.description || '');
                map.groupby = item.farmId;
            } else if (item.type == 'cropland') {
                map.title = _assetTitle(item);
                map.subtitle = (item.data.size !== undefined ? 'Area: ' + $filter('number')(item.data.size, 2) + 'Ha' : 'Unknown area');
                map.groupby = item.farmId;
            } else if (item.type == 'livestock') {
                map.title = _assetTitle(item);
                map.subtitle = (item.data.breed ? item.data.breed + ' for ' : 'For ') + item.data.purpose;
                map.summary = (item.data.description || '');
                map.groupby = item.data.type;
            } else if (item.type == 'pasture') {
                map.title = _assetTitle(item);
                map.subtitle = (item.data.size !== undefined ? 'Area: ' + $filter('number')(item.data.size, 2) + 'Ha' : 'Unknown area');
                map.groupby = item.farmId;
            } else if (item.type == 'permanent crop') {
                map.title = _assetTitle(item);
                map.subtitle = (item.data.establishedDate ? 'Established: ' + $filter('date')(item.data.establishedDate, 'dd/MM/yy') : '');
                map.groupby = item.farmId;
            } else if (item.type == 'plantation') {
                map.title = _assetTitle(item);
                map.subtitle = (item.data.establishedDate ? 'Established: ' + $filter('date')(item.data.establishedDate, 'dd/MM/yy') : '');
                map.groupby = item.farmId;
            } else if (item.type == 'vme') {
                map.title = _assetTitle(item);
                map.subtitle = 'Quantity: ' + item.data.quantity;
                map.summary = (item.data.description || '');
                map.groupby = item.data.type;
            } else if (item.type == 'wasteland') {
                map.title = _assetTitle(item);
                map.subtitle = (item.data.size !== undefined ? 'Area: ' + $filter('number')(item.data.size, 2) + 'Ha' : 'Unknown area');
                map.groupby = item.farmId;
            } else if (item.type == 'water right') {
                map.title = _assetTitle(item);
                map.subtitle = (item.data.size !== undefined ? 'Irrigatable Extent: ' + $filter('number')(item.data.size, 2) + 'Ha' : 'Unknown area');
                map.groupby = item.farmId;
            }

            map.thumbnailUrl = attachmentHelper.findSize(item, 'thumb', 'img/camera.png');
        }

        if (metadata) {
            map = underscore.extend(map, metadata);
        }

        return map;
    };

    var _assetTypes = {
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
    };

    var _assetSubtypes = {
        'improvement': ['Livestock & Game', 'Crop Cultivation & Processing', 'Residential', 'Business','Equipment & Utilities','Infrastructure','Recreational & Misc.'],
        'livestock': ['Cattle', 'Sheep', 'Pigs', 'Chickens', 'Ostriches', 'Goats'],
        'vme': ['Vehicles', 'Machinery', 'Equipment']
    };

    var _assetCategories = {
        improvement: [
            { category: "Airport", subCategory: "Hangar" },
            { category: "Airport", subCategory: "Helipad" },
            { category: "Airport", subCategory: "Runway" },
            { category: "Poultry", subCategory: "Hatchery" },
            { category: "Aquaculture", subCategory: "Pond" },
            { category: "Aquaculture", subCategory: "Net House" },
            { category: "Aviary" },
            { category: "Beekeeping" },
            { category: "Borehole" },
            { category: "Borehole", subCategory: "Equipped" },
            { category: "Borehole", subCategory: "Pump" },
            { category: "Borehole", subCategory: "Windmill" },
            { category: "Poultry", subCategory: "Broiler House" },
            { category: "Poultry", subCategory: "Broiler House - Atmosphere" },
            { category: "Poultry", subCategory: "Broiler House - Semi" },
            { category: "Poultry", subCategory: "Broiler House - Zinc" },
            { category: "Building", subCategory: "Administrative" },
            { category: "Building" },
            { category: "Building", subCategory: "Commercial" },
            { category: "Building", subCategory: "Entrance" },
            { category: "Building", subCategory: "Lean-to" },
            { category: "Building", subCategory: "Outbuilding" },
            { category: "Building", subCategory: "Gate" },
            { category: "Cold Storage" },
            { category: "Commercial", subCategory: "Coffee Shop" },
            { category: "Commercial", subCategory: "Sales Facility" },
            { category: "Commercial", subCategory: "Shop" },
            { category: "Commercial", subCategory: "Bar" },
            { category: "Commercial", subCategory: "Café" },
            { category: "Commercial", subCategory: "Restaurant" },
            { category: "Commercial", subCategory: "Factory" },
            { category: "Commercial", subCategory: "Tasting Facility" },
            { category: "Commercial", subCategory: "Cloth House" },
            { category: "Compost", subCategory: "Preparing Unit" },
            { category: "Crocodile Dam" },
            { category: "Crop Processing", subCategory: "Degreening Room" },
            { category: "Crop Processing", subCategory: "Dehusking Facility" },
            { category: "Crop Processing", subCategory: "Drying Facility" },
            { category: "Crop Processing", subCategory: "Drying Tunnels" },
            { category: "Crop Processing", subCategory: "Sorting Facility" },
            { category: "Crop Processing", subCategory: "Drying Oven" },
            { category: "Crop Processing", subCategory: "Drying Racks" },
            { category: "Crop Processing", subCategory: "Crushing Plant" },
            { category: "Crop Processing", subCategory: "Nut Cracking Facility" },
            { category: "Crop Processing", subCategory: "Nut Factory" },
            { category: "Dairy" },
            { category: "Dairy", subCategory: "Pasteurising Facility" },
            { category: "Dairy", subCategory: "Milking Parlour" },
            { category: "Dam" },
            { category: "Dam", subCategory: "Filter" },
            { category: "Dam", subCategory: "Trout" },
            { category: "Domestic", subCategory: "Chicken Coop" },
            { category: "Domestic", subCategory: "Chicken Run" },
            { category: "Domestic", subCategory: "Kennels" },
            { category: "Domestic", subCategory: "Gardening Facility" },
            { category: "Education", subCategory: "Conference Room" },
            { category: "Education", subCategory: "Classroom" },
            { category: "Education", subCategory: "Crèche" },
            { category: "Education", subCategory: "School" },
            { category: "Education", subCategory: "Training Facility" },
            { category: "Equipment", subCategory: "Air Conditioner" },
            { category: "Equipment", subCategory: "Gantry" },
            { category: "Equipment", subCategory: "Oven" },
            { category: "Equipment", subCategory: "Pump" },
            { category: "Equipment", subCategory: "Pumphouse" },
            { category: "Equipment", subCategory: "Scale" },
            { category: "Feed Mill" },
            { category: "Feedlot" },
            { category: "Fencing" },
            { category: "Fencing", subCategory: "Electric" },
            { category: "Fencing", subCategory: "Game" },
            { category: "Fencing", subCategory: "Perimeter" },
            { category: "Fencing", subCategory: "Security" },
            { category: "Fencing", subCategory: "Wire" },
            { category: "Fuel", subCategory: "Tanks" },
            { category: "Fuel", subCategory: "Tank Stand" },
            { category: "Fuel", subCategory: "Fuelling Facility" },
            { category: "Grain Mill" },
            { category: "Greenhouse" },
            { category: "Infrastructure" },
            { category: "Irrigation", subCategory: "Sprinklers" },
            { category: "Irrigation" },
            { category: "Laboratory" },
            { category: "Livestock Handling", subCategory: "Auction Facility" },
            { category: "Livestock Handling", subCategory: "Cages" },
            { category: "Livestock Handling", subCategory: "Growing House" },
            { category: "Livestock Handling", subCategory: "Pens" },
            { category: "Livestock Handling", subCategory: "Shelter" },
            { category: "Livestock Handling", subCategory: "Breeding Facility" },
            { category: "Livestock Handling", subCategory: "Culling Shed" },
            { category: "Livestock Handling", subCategory: "Dipping Facility" },
            { category: "Livestock Handling", subCategory: "Elephant Enclosures" },
            { category: "Livestock Handling", subCategory: "Feed Troughs/Dispensers" },
            { category: "Livestock Handling", subCategory: "Horse Walker" },
            { category: "Livestock Handling", subCategory: "Maternity Shelter/Pen" },
            { category: "Livestock Handling", subCategory: "Quarantine Area" },
            { category: "Livestock Handling", subCategory: "Rehab Facility" },
            { category: "Livestock Handling", subCategory: "Shearing Facility" },
            { category: "Livestock Handling", subCategory: "Stable" },
            { category: "Livestock Handling", subCategory: "Surgery" },
            { category: "Livestock Handling", subCategory: "Treatment Area" },
            { category: "Livestock Handling", subCategory: "Weaner House" },
            { category: "Livestock Handling", subCategory: "Grading Facility" },
            { category: "Livestock Handling", subCategory: "Inspection Facility" },
            { category: "Logistics", subCategory: "Handling Equipment" },
            { category: "Logistics", subCategory: "Handling Facility" },
            { category: "Logistics", subCategory: "Depot" },
            { category: "Logistics", subCategory: "Loading Area" },
            { category: "Logistics", subCategory: "Loading Shed" },
            { category: "Logistics", subCategory: "Hopper" },
            { category: "Logistics", subCategory: "Weigh Bridge" },
            { category: "Meat Processing", subCategory: "Abattoir" },
            { category: "Meat Processing", subCategory: "Deboning Room" },
            { category: "Meat Processing", subCategory: "Skinning Facility" },
            { category: "Mill" },
            { category: "Mushrooms", subCategory: "Cultivation" },
            { category: "Mushrooms", subCategory: "Sweat Room" },
            { category: "Nursery ", subCategory: "Plant" },
            { category: "Nursery ", subCategory: "Plant Growing Facility" },
            { category: "Office" },
            { category: "Packaging Facility" },
            { category: "Paddocks", subCategory: "Camp" },
            { category: "Paddocks", subCategory: "Kraal" },
            { category: "Paddocks" },
            { category: "Piggery", subCategory: "Farrowing House" },
            { category: "Piggery", subCategory: "Pig Sty" },
            { category: "Processing", subCategory: "Bottling Facility" },
            { category: "Processing", subCategory: "Flavour Shed" },
            { category: "Processing", subCategory: "Processing Facility" },
            { category: "Recreation", subCategory: "Viewing Area" },
            { category: "Recreation", subCategory: "BBQ" },
            { category: "Recreation", subCategory: "Clubhouse" },
            { category: "Recreation", subCategory: "Event Venue" },
            { category: "Recreation", subCategory: "Gallery" },
            { category: "Recreation", subCategory: "Game Room" },
            { category: "Recreation", subCategory: "Gazebo" },
            { category: "Recreation", subCategory: "Gymnasium" },
            { category: "Recreation", subCategory: "Jacuzzi" },
            { category: "Recreation", subCategory: "Judging Booth" },
            { category: "Recreation", subCategory: "Museum" },
            { category: "Recreation", subCategory: "Play Area" },
            { category: "Recreation", subCategory: "Pool House" },
            { category: "Recreation", subCategory: "Pottery Room" },
            { category: "Recreation", subCategory: "Racing Track" },
            { category: "Recreation", subCategory: "Salon" },
            { category: "Recreation", subCategory: "Sauna" },
            { category: "Recreation", subCategory: "Shooting Range" },
            { category: "Recreation", subCategory: "Spa Facility" },
            { category: "Recreation", subCategory: "Squash Court" },
            { category: "Recreation", subCategory: "Swimming Pool" },
            { category: "Recreation" },
            { category: "Religeous", subCategory: "Church" },
            { category: "Residential", subCategory: "Carport" },
            { category: "Residential", subCategory: "Driveway" },
            { category: "Residential", subCategory: "Flooring" },
            { category: "Residential", subCategory: "Paving" },
            { category: "Residential", subCategory: "Roofing" },
            { category: "Residential", subCategory: "Water Feature" },
            { category: "Residential", subCategory: "Hall" },
            { category: "Residential", subCategory: "Balcony" },
            { category: "Residential", subCategory: "Canopy" },
            { category: "Residential", subCategory: "Concrete Surface" },
            { category: "Residential", subCategory: "Courtyard" },
            { category: "Residential", subCategory: "Covered" },
            { category: "Residential", subCategory: "Deck" },
            { category: "Residential", subCategory: "Mezzanine" },
            { category: "Residential", subCategory: "Parking Area" },
            { category: "Residential", subCategory: "Patio" },
            { category: "Residential", subCategory: "Porch" },
            { category: "Residential", subCategory: "Porte Cochere" },
            { category: "Residential", subCategory: "Terrace" },
            { category: "Residential", subCategory: "Veranda" },
            { category: "Residential", subCategory: "Walkways" },
            { category: "Residential", subCategory: "Rondavel" },
            { category: "Residential", subCategory: "Accommodation Units" },
            { category: "Residential", subCategory: "Boma" },
            { category: "Residential", subCategory: "Bungalow" },
            { category: "Residential", subCategory: "Bunker" },
            { category: "Residential", subCategory: "Cabin" },
            { category: "Residential", subCategory: "Chalet" },
            { category: "Residential", subCategory: "Community Centre" },
            { category: "Residential", subCategory: "Dormitory" },
            { category: "Residential", subCategory: "Dwelling" },
            { category: "Residential", subCategory: "Flat" },
            { category: "Residential", subCategory: "Kitchen" },
            { category: "Residential", subCategory: "Lapa" },
            { category: "Residential", subCategory: "Laundry Facility" },
            { category: "Residential", subCategory: "Locker Room" },
            { category: "Residential", subCategory: "Lodge" },
            { category: "Residential", subCategory: "Shower" },
            { category: "Residential", subCategory: "Toilets" },
            { category: "Residential", subCategory: "Room" },
            { category: "Residential", subCategory: "Cottage" },
            { category: "Residential", subCategory: "Garage" },
            { category: "Roads", subCategory: "Access Roads" },
            { category: "Roads", subCategory: "Gravel" },
            { category: "Roads", subCategory: "Tarred" },
            { category: "Security", subCategory: "Control Room" },
            { category: "Security", subCategory: "Guardhouse" },
            { category: "Security", subCategory: "Office" },
            { category: "Shade Nets" },
            { category: "Silo" },
            { category: "Sports", subCategory: "Arena" },
            { category: "Sports", subCategory: "Tennis Court" },
            { category: "Staff", subCategory: "Hostel" },
            { category: "Staff", subCategory: "Hut" },
            { category: "Staff", subCategory: "Retirement Centre" },
            { category: "Staff", subCategory: "Staff Building" },
            { category: "Staff", subCategory: "Canteen" },
            { category: "Staff", subCategory: "Dining Facility" },
            { category: "Storage", subCategory: "Truck Shelter" },
            { category: "Storage", subCategory: "Barn" },
            { category: "Storage", subCategory: "Dark Room" },
            { category: "Storage", subCategory: "Bin Compartments" },
            { category: "Storage", subCategory: "Machinery" },
            { category: "Storage", subCategory: "Saddle Room" },
            { category: "Storage", subCategory: "Shed" },
            { category: "Storage", subCategory: "Chemicals" },
            { category: "Storage", subCategory: "Tools" },
            { category: "Storage", subCategory: "Dry" },
            { category: "Storage", subCategory: "Equipment" },
            { category: "Storage", subCategory: "Feed" },
            { category: "Storage", subCategory: "Fertilizer" },
            { category: "Storage", subCategory: "Fuel" },
            { category: "Storage", subCategory: "Grain" },
            { category: "Storage", subCategory: "Hides" },
            { category: "Storage", subCategory: "Oil" },
            { category: "Storage", subCategory: "Pesticide" },
            { category: "Storage", subCategory: "Poison" },
            { category: "Storage", subCategory: "Seed" },
            { category: "Storage", subCategory: "Zinc" },
            { category: "Storage", subCategory: "Sulphur" },
            { category: "Storage" },
            { category: "Storage", subCategory: "Vitamin Room" },
            { category: "Sugar Mill" },
            { category: "Tanks", subCategory: "Water" },
            { category: "Timber Mill" },
            { category: "Trench" },
            { category: "Utilities", subCategory: "Battery Room" },
            { category: "Utilities", subCategory: "Boiler Room" },
            { category: "Utilities", subCategory: "Compressor Room" },
            { category: "Utilities", subCategory: "Engine Room" },
            { category: "Utilities", subCategory: "Generator" },
            { category: "Utilities", subCategory: "Power Room" },
            { category: "Utilities", subCategory: "Pumphouse" },
            { category: "Utilities", subCategory: "Transformer Room" },
            { category: "Utilities" },
            { category: "Vacant Area" },
            { category: "Vehicles", subCategory: "Transport Depot" },
            { category: "Vehicles", subCategory: "Truck Wash" },
            { category: "Vehicles", subCategory: "Workshop" },
            { category: "Walls" },
            { category: "Walls", subCategory: "Boundary" },
            { category: "Walls", subCategory: "Retaining" },
            { category: "Walls", subCategory: "Security" },
            { category: "Warehouse" },
            { category: "Water", subCategory: "Reservoir" },
            { category: "Water", subCategory: "Tower" },
            { category: "Water", subCategory: "Purification Plant" },
            { category: "Water", subCategory: "Reticulation Works" },
            { category: "Water", subCategory: "Filter Station" },
            { category: "Wine Cellar", subCategory: "Tanks" },
            { category: "Wine Cellar" },
            { category: "Wine Cellar", subCategory: "Winery" },
            { category: "Wine Cellar", subCategory: "Barrel Maturation Room" }
        ],
        'livestock': {
            Cattle: {
                Breeding: ['Phase A Bulls', 'Phase B Bulls', 'Phase C Bulls', 'Phase D Bulls', 'Heifers', 'Bull Calves', 'Heifer Calves', 'Tollies 1-2', 'Heifers 1-2', 'Culls'],
                Dairy: ['Bulls', 'Dry Cows', 'Lactating Cows', 'Heifers', 'Calves', 'Culls'],
                Slaughter: ['Bulls', 'Cows', 'Heifers', 'Weaners', 'Calves', 'Culls']
            },
            Sheep: {
                Breeding: ['Rams', 'Young Rams', 'Ewes', 'Young Ewes', 'Lambs', 'Wethers', 'Culls'],
                Slaughter: ['Rams', 'Ewes', 'Lambs', 'Wethers', 'Culls']
            },
            Pigs: {
                Slaughter: ['Boars', 'Breeding Sows', 'Weaned pigs', 'Piglets', 'Porkers', 'Baconers', 'Culls']
            },
            Chickens: {
                Broilers: ['Day Old Chicks', 'Broilers'],
                Layers: ['Hens', 'Point of Laying Hens', 'Culls']
            },
            Ostriches: {
                Slaughter: ['Breeding Stock', 'Slaughter Birds > 3 months', 'Slaughter Birds < 3 months', 'Chicks']
            },
            Goats: {
                Slaughter: ['Rams', 'Breeding Ewes', 'Young Ewes', 'Kids']
            }
        },
        'vme': {
            Vehicles: ['Bakkie', 'Car', 'Truck', 'Tractor'],
            Machinery: ['Mower', 'Mower Conditioner', 'Hay Rake', 'Hay Baler', 'Harvester'],
            Equipment: ['Plough', 'Harrow', 'Ridgers', 'Rotovator', 'Cultivator', 'Planter', 'Combine', 'Spreader', 'Sprayer', 'Mixer']
        }
    };

    var _conditionTypes = ['Good', 'Good to fair', 'Fair', 'Fair to poor', 'Poor'];

    var _assetPurposes = {
        livestock: {
            Cattle: ['Breeding', 'Dairy', 'Slaughter'],
            Sheep: ['Breeding', 'Slaughter'],
            Pigs: ['Slaughter'],
            Chickens: ['Broilers', 'Layers'],
            Ostriches:['Slaughter'],
            Goats: ['Slaughter']
        }
    };

    var _seasonTypes = ['Cape', 'Summer', 'Fruit', 'Winter'];

    var _assetLandUse = {
        'crop': ['Cropland'],
        'farmland': [],
        'improvement': [],
        'cropland': ['Cropland', 'Irrigated Cropland'],
        'livestock': ['Grazing', 'Planted Pastures', 'Conservation'],
        'pasture': ['Grazing', 'Planted Pastures', 'Conservation'],
        'permanent crop': ['Horticulture (Perennial)'],
        'plantation': ['Plantation'],
        'vme': [],
        'wasteland': ['Grazing', 'Structures (Handling)', 'Structures (Processing)', 'Structures (Storage)', 'Utilities', 'Wasteland'],
        'water right': ['Water Right']
    };

    var _landUseCropTypes = {
        'Cropland': ['Barley', 'Bean', 'Bean (Broad)', 'Bean (Dry)', 'Bean (Sugar)', 'Bean (Green)', 'Bean (Kidney)', 'Canola', 'Cassava', 'Cotton', 'Cowpea', 'Grain Sorghum', 'Groundnut', 'Maize', 'Maize (White)', 'Maize (Yellow)', 'Oats', 'Peanut', 'Pearl Millet', 'Potato', 'Rape', 'Rice', 'Rye', 'Soya Bean', 'Sunflower', 'Sweet Corn', 'Sweet Potato', 'Tobacco', 'Triticale', 'Wheat', 'Wheat (Durum)'],
        'Grazing': ['Bahia-Notatum', 'Bottle Brush', 'Buffalo', 'Buffalo (Blue)', 'Buffalo (White)', 'Bush', 'Cocksfoot', 'Common Setaria', 'Dallis', 'Phalaris', 'Rescue', 'Rhodes', 'Smuts Finger', 'Tall Fescue', 'Teff', 'Veld', 'Weeping Lovegrass'],
        'Horticulture (Perennial)': ['Almond', 'Aloe', 'Apple', 'Apricot', 'Avocado', 'Banana', 'Cherry', 'Coconut', 'Coffee', 'Grape', 'Grape (Bush Vine)', 'Grape (Red)', 'Grape (Table)', 'Grape (White)', 'Grapefruit', 'Guava', 'Hops', 'Kiwi Fruit', 'Lemon', 'Litchi', 'Macadamia Nut', 'Mandarin', 'Mango', 'Nectarine', 'Olive', 'Orange', 'Papaya', 'Peach', 'Pear', 'Pecan Nut', 'Persimmon', 'Pineapple', 'Pistachio Nut', 'Plum', 'Rooibos', 'Sisal', 'Tea', 'Walnut'],
        'Horticulture (Seasonal)': ['Asparagus', 'Beet', 'Beetroot', 'Blackberry', 'Borecole', 'Brinjal', 'Broccoli', 'Brussel Sprout', 'Cabbage', 'Cabbage (Chinese)', 'Cabbage (Savoy)', 'Cactus Pear', 'Carrot', 'Cauliflower', 'Celery', 'Chicory', 'Chili', 'Cucumber', 'Cucurbit', 'Garlic', 'Ginger', 'Granadilla', 'Kale', 'Kohlrabi', 'Leek', 'Lentil', 'Lespedeza', 'Lettuce', 'Makataan', 'Mustard', 'Mustard (White)', 'Onion', 'Paprika', 'Parsley', 'Parsnip', 'Pea', 'Pea (Dry)', 'Pepper', 'Pumpkin', 'Quince', 'Radish', 'Squash', 'Strawberry', 'Swede', 'Sweet Melon', 'Swiss Chard', 'Tomato', 'Turnip', 'Vetch (Common)', 'Vetch (Hairy)', 'Watermelon', 'Youngberry'],
        'Plantation': ['Bluegum', 'Pine', 'Sugarcane', 'Wattle'],
        'Planted Pastures': ['Birdsfoot Trefoil', 'Carribean Stylo', 'Clover', 'Clover (Arrow Leaf)', 'Clover (Crimson)', 'Clover (Persian)', 'Clover (Red)', 'Clover (Rose)', 'Clover (Strawberry)', 'Clover (Subterranean)', 'Clover (White)', 'Kikuyu', 'Lucerne', 'Lupin', 'Lupin (Narrow Leaf)', 'Lupin (White)', 'Lupin (Yellow)', 'Medic', 'Medic (Barrel)', 'Medic (Burr)', 'Medic (Gama)', 'Medic (Snail)', 'Medic (Strand)', 'Ryegrass', 'Ryegrass (Hybrid)', 'Ryegrass (Italian)', 'Ryegrass (Westerwolds)', 'Serradella', 'Serradella (Yellow)', 'Silver Leaf Desmodium']
    };

    var _liabilityFrequencies = {
        'bi-monthly': 'Bi-Monthly',
        'monthly': 'Monthly',
        'quarterly': 'Quarterly',
        'bi-yearly': 'Bi-Yearly',
        'yearly': 'Yearly'
    };

    var _liabilityTypes = {
        'rent': 'Rented',
        'short-term': 'Short Term Loan',
        'medium-term': 'Medium Term Loan',
        'long-term': 'Long Term Loan'
    };

    return {
        assetTypes: function() {
            return _assetTypes;
        },
        seasonTypes: function () {
            return _seasonTypes;
        },
        listServiceMap: function () {
            return _listServiceMap;
        },
        getAssetClass: function (type) {
            return _assetTypes[type];
        },
        getAssetTitle: function (asset) {
            return _assetTitle(asset);
        },
        getAssetLandUse: function (type) {
            return _assetLandUse[type];
        },
        getAssetSubtypes: function(type) {
            return _assetSubtypes[type] || [];
        },
        getAssetCategories: function(type, subtype) {
            return (_assetCategories[type] ? (subtype ? (_assetCategories[type][subtype] || []) : _assetCategories[type] ) : []);
        },
        getCategoryLabel: function(categoryObject) {
            if (!(categoryObject && categoryObject.category)) {
                return '';
            }
            return categoryObject.category + (categoryObject.subCategory ? ' (' + categoryObject.subCategory + ')'  : '');
        },
        getAssetPurposes: function(type, subtype) {
            return (_assetPurposes[type] ? (_assetPurposes[type][subtype] || []) : []);
        },
        getCropsForLandUse: function (landUse) {
            return _landUseCropTypes[landUse] || [];
        },
        getLiabilityFrequencyTitle: function (frequency) {
            return _liabilityFrequencies[frequency] || '';
        },
        getLiabilityTitle: function (type) {
            return _liabilityTypes[type] || '';
        },
        getZoneTitle: function (zone) {
            return $filter('number')(zone.size, 2) + 'Ha at Stage ' + zone.growthStage + ' (' + zone.cultivar + ')';
        },
        conditionTypes: function () {
            return _conditionTypes;
        },
        isFieldApplicable: function (type, field) {
            return (_assetLandUse[type] && _assetLandUse[type].indexOf(field.landUse) !== -1);
        },
        generateAssetKey: function (asset, legalEntity, farm) {
            asset.assetKey = 'entity.' + legalEntity.uuid +
                (asset.type !== 'farmland' && farm ? '-f.' + farm.name : '') +
                (asset.type === 'crop' && asset.data.season ? '-s.' + asset.data.season : '') +
                (asset.data.fieldName ? '-fi.' + asset.data.fieldName : '') +
                (asset.data.crop ? '-c.' + asset.data.crop : '') +
                (asset.type === 'cropland' && asset.data.irrigated ? '-i.' + asset.data.irrigation : '') +
                (asset.type === 'farmland' && asset.data.sgKey ? '-' + asset.data.sgKey : '') +
                (asset.type === 'improvement' || asset.type === 'livestock' || asset.type === 'vme' ?
                    (asset.data.type ? '-t.' + asset.data.type : '') +
                    (asset.data.category ? '-c.' + asset.data.category : '') +
                    (asset.data.name ? '-n.' + asset.data.name : '') +
                    (asset.data.purpose ? '-p.' + asset.data.purpose : '') +
                    (asset.data.model ? '-m.' + asset.data.model : '') +
                    (asset.data.identificationNo ? '-in.' + asset.data.identificationNo : '') : '') +
                (asset.data.waterSource ? '-ws.' + asset.data.waterSource : '');
        },
        cleanAssetData: function (asset) {
            if (asset.type == 'vme') {
                asset.data.quantity = (asset.data.identificationNo && asset.data.identificationNo.length > 0 ? 1 : asset.data.quantity);
                asset.data.identificationNo = (asset.data.quantity != 1 ? '' : asset.data.identificationNo);
            } else if (asset.type == 'cropland') {
                asset.data.equipped = (asset.data.irrigated ? asset.data.equipped : false);
            }

            return asset;
        },
        calculateLiability: function (asset) {
            if (asset.data.financing && (asset.data.financing.financed || asset.data.financing.leased)) {
                asset.data.financing.closingBalance = this.calculateLiabilityForMonth(asset, moment().format('YYYY-MM'))
            }

            return asset;
        },
        calculateLiabilityForMonth: function (asset, month) {
            var freq = {
                Monthly: 12,
                'Bi-Monthly': 24,
                Quarterly: 4,
                'Bi-Yearly': 2,
                Yearly: 1
            };

            var financing = asset.data.financing,
                closingBalance = financing.openingBalance || 0;

            var startMonth = moment(financing.paymentStart),
                endMonth = moment(financing.paymentEnd),
                currentMonth = moment(month);

            var installmentsSince = (financing.leased && currentMonth > endMonth ? endMonth : currentMonth)
                    .diff(startMonth, 'months') * ((freq[financing.paymentFrequency] || 1) / 12);

            if (asset.data.financing.financed) {
                for (var i = 0; i <= installmentsSince; i++) {
                    closingBalance -= Math.min(closingBalance, (financing.installment || 0) - ((((financing.interestRate || 0) / 100) / freq[financing.paymentFrequency]) * closingBalance));
                }
            } else if (startMonth <= currentMonth) {
                closingBalance = Math.ceil(installmentsSince) * (financing.installment || 0);
            }

            return closingBalance;
        },
        calculateValuation: function (asset, valuation) {
            if (asset.type == 'vme' && isNaN(asset.data.quantity) == false) {
                valuation.assetValue = asset.data.quantity * (valuation.unitValue || 0);
            } else if (asset.type == 'livestock' && isNaN(valuation.totalStock) == false) {
                valuation.assetValue = valuation.totalStock * (valuation.unitValue || 0);
            } else if (asset.type == 'crop' && isNaN(valuation.expectedYield) == false) {
                valuation.assetValue = valuation.expectedYield * (valuation.unitValue || 0);
            } else if (asset.type != 'improvement' && isNaN(asset.data.size) == false) {
                valuation.assetValue = asset.data.size * (valuation.unitValue || 0);
            }

            return valuation;
        },
        generateFarmlandAssetLabels: function(asset) {
            if (asset.type == 'farmland') {
                asset.data.portionLabel = (asset.data.portionNumber ?
                    (asset.data.remainder ? 'Rem. portion ' + asset.data.portionNumber : 'Ptn. ' + asset.data.portionNumber) :
                    'Rem. extent');
                asset.data.farmLabel = (asset.data.officialFarmName && !_(asset.data.officialFarmName.toLowerCase()).startsWith('farm') ?
                    _(asset.data.officialFarmName).titleize() + ' ' : '') + (asset.data.farmNumber ? asset.data.farmNumber : '');
                asset.data.label = asset.data.portionLabel + (asset.data.farmLabel && _.words(asset.data.farmLabel).length > 0 ?
                    " of " + (_.words(asset.data.farmLabel.toLowerCase())[0] == 'farm' ? _(asset.data.farmLabel).titleize() :
                    "farm " + _(asset.data.farmLabel).titleize() ) : 'farm Unknown');
            }
        },
        generateAssetName: function(asset, categoryLabel, currentAssetList) {
            if (asset.type == 'improvement') {
                var assetCount = underscore.chain(currentAssetList)
                    .filter(function(asset) {
                        return asset.type == 'improvement'
                    }).reduce(function(currentAssetCount, asset) {
                        var index = asset.data.name.search(/\s+[0-9]+$/);
                        var name = asset.data.name;
                        var number;
                        if (index != -1) {
                            name = name.substr(0, index);
                            number = parseInt(asset.data.name.substring(index).trim());
                        }
                        if (categoryLabel && name == categoryLabel && (!number || number > currentAssetCount)) {
                            currentAssetCount = number || 1;
                        }
                        return currentAssetCount;
                    }, -1)
                    .value();

                asset.data.name = categoryLabel + (assetCount + 1 ? ' ' + (assetCount + 1) : '');
            }
        }
    }
}]);

sdkHelperAssetApp.factory('assetValuationHelper', ['assetHelper', 'underscore', function (assetHelper, underscore) {
    var _listServiceMap = function (item) {
        return {
            title: item.organization.name,
            subtitle: 'Valued at ' + item.currency + ' ' + item.assetValue,
            date: item.date
        };
    };

    return {
        listServiceMap: function () {
            return _listServiceMap;
        },
        calculateAssetValue: function (asset) {
            if (asset.type == 'vme' && isNaN(asset.data.quantity) == false) {
                asset.data.assetValue = asset.data.quantity * (asset.data.unitValue || 0);
            } else if (asset.type == 'livestock' && isNaN(asset.data.totalStock) == false) {
                asset.data.assetValue = asset.data.totalStock * (asset.data.unitValue || 0);
            } else if (asset.type == 'crop' && isNaN(asset.data.expectedYield) == false) {
                asset.data.assetValue = asset.data.expectedYield * (asset.data.unitValue || 0);
            } else if (asset.type == 'improvement') {
                asset.data.valuation = asset.data.valuation || {};
                asset.data.valuation.replacementValue = asset.data.size * ((asset.data.valuation && asset.data.valuation.constructionCost) || 0);
                asset.data.valuation.totalDepreciation = underscore.reduce(['physicalDepreciation', 'functionalDepreciation', 'economicDepreciation', 'purchaserResistance'], function (total, type) {
                    return isNaN(asset.data.valuation[type]) ? total : total * (1 - asset.data.valuation[type]);
                }, 1);

                asset.data.assetValue = Math.round((asset.data.valuation.replacementValue || 0) * Math.min(asset.data.valuation.totalDepreciation, 1));
            } else if (asset.type != 'improvement' && isNaN(asset.data.size) == false) {
                asset.data.assetValue = asset.data.size * (asset.data.unitValue || 0);
            }

            asset.data.assetValue = Math.round(asset.data.assetValue * 100) / 100;
        },
        getApplicableGuidelines: function (guidelines, asset, field) {
            var assetLandUse = assetHelper.getAssetLandUse(asset.type);
            var chain = underscore.chain(guidelines).filter(function(item) {
                return (assetLandUse.indexOf(item.assetClass) !== -1);
            });

            if (asset.type === 'cropland') {
                chain = chain.filter(function (item) {
                    return (field.irrigated ?
                        (asset.data.waterSource ? (item.waterSource && item.waterSource.indexOf(asset.data.waterSource) !== -1) : item.category === 'Potential Irrigable Land') :
                        (item.assetClass === 'Cropland' && (item.soilPotential === undefined || item.soilPotential === field.croppingPotential)));
                });
            } else if (asset.type === 'pasture' || asset.type === 'wasteland') {
                chain = chain.where({assetClass: field.landUse}).filter(function (item) {
                    return ((asset.data.crop === undefined && item.crop === undefined) || (item.crop !== undefined && item.crop.indexOf(asset.data.crop) !== -1)) &&
                        ((field.terrain === undefined && item.terrain === undefined) || item.terrain === field.terrain);
                });
            } else if (asset.type === 'permanent crop') {
                var establishedDate = moment(asset.data.establishedDate);
                var monthsFromEstablished = moment().diff(establishedDate, 'months');

                chain = chain.filter(function (item) {
                    return (item.crop && item.crop.indexOf(asset.data.crop) !== -1) &&
                        (!asset.data.irrigation || item.irrigationType === undefined ||
                            item.irrigationType.indexOf(asset.data.irrigation) !== -1) &&
                        (item.minAge === undefined || monthsFromEstablished >= item.minAge) &&
                        (item.maxAge === undefined || monthsFromEstablished < item.maxAge);
                });
            } else if (asset.type === 'plantation') {
                chain = chain.filter(function (item) {
                    return (item.crop === undefined || item.crop.indexOf(asset.data.crop) !== -1);
                });
            } else if (asset.type === 'water right') {
                chain = chain.filter(function (item) {
                    return (item.waterSource === undefined || item.waterSource.indexOf(asset.data.waterSource) !== -1);
                });
            }

            return chain.value();
        }
    }
}]);
