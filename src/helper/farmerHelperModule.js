var sdkHelperFarmerApp = angular.module('ag.sdk.helper.farmer', ['ag.sdk.geospatial', 'ag.sdk.library', 'ag.sdk.interface.map', 'ag.sdk.helper.attachment']);

sdkHelperFarmerApp.factory('farmerHelper', ['attachmentHelper', 'geoJSONHelper', 'underscore', function(attachmentHelper, geoJSONHelper, underscore) {
    var _listServiceMap = function (item) {
        var tagMap = {
            'danger': ['Duplicate Farmland', 'Duplicate Legal Entities'],
            'warning': ['No CIF', 'No Farmland', 'No Homestead', 'No Segmentation']
        };

        return {
            id: item.id || item.$id,
            title: item.name,
            subtitle: item.customerId,
            thumbnailUrl: attachmentHelper.findSize(item, 'thumb', 'img/profile-business.png'),
            searchingIndex: searchingIndex(item),
            pills: underscore.chain(tagMap)
                .mapObject(function (values) {
                    return underscore.chain(item.tags)
                        .pluck('name')
                        .filter(function (tag) {
                            return underscore.contains(values, tag);
                        })
                        .value();
                })
                .omit(function (values) {
                    return underscore.isEmpty(values);
                })
                .value()
        };

        function searchingIndex (item) {
            return underscore.chain(item.legalEntities)
                .map(function (entity) {
                    return underscore.compact([entity.cifKey, entity.name, entity.registrationNumber]);
                })
                .flatten()
                .uniq()
                .value()
        }
    };

    return {
        listServiceMap: function() {
            return _listServiceMap;
        },
        getFarmerLocation: function(farmer) {
            if (farmer) {
                if (farmer.data && farmer.data.loc) {
                    return (farmer.data.loc.geometry ? farmer.data.loc.geometry.coordinates : farmer.data.loc.coordinates);
                } else if (farmer.legalEntities) {
                    var geojson = geoJSONHelper();

                    angular.forEach(farmer.legalEntities, function (entity) {
                        if (entity.assets) {
                            angular.forEach(entity.assets, function (asset) {
                                geojson.addGeometry(asset.data.loc);
                            });
                        }
                    });

                    var coord = geojson.getCenter();

                    return (coord ? coord.reverse() : coord);
                }
            }

            return null;
        }
    }
}]);

sdkHelperFarmerApp.factory('legalEntityHelper', ['attachmentHelper', 'underscore', function (attachmentHelper, underscore) {
    var _listServiceMap = function(item) {
        var map = {
            id: item.id || item.$id,
            title: item.name,
            subtitle: item.type
        };

        map.thumbnailUrl = attachmentHelper.findSize(item, 'thumb', 'img/profile-user.png');

        return map;
    };

    var _legalEntityTypes = ['Individual', 'Sole Proprietary', 'Joint account', 'Partnership', 'Close Corporation', 'Private Company', 'Public Company', 'Trust', 'Non-Profitable companies', 'Cooperatives', 'In- Cooperatives', 'Other Financial Intermediaries'];

    // When updating, also update the _commodities list in the enterpriseBudgetHelper
    var _enterpriseTypes = {
        'Field Crops': [
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
            'Peanut',
            'Pearl Millet',
            'Potato',
            'Rapeseed',
            'Rice',
            'Rye',
            'Soya Bean',
            'Sunflower',
            'Sweet Corn',
            'Sweet Potato',
            'Tobacco',
            'Triticale',
            'Turnip',
            'Wheat',
            'Wheat (Durum)'],
        'Grazing': [
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
            'Weeping Lovegrass'],
        'Horticulture': [
            'Almond',
            'Apple',
            'Apricot',
            'Asparagus',
            'Avocado',
            'Banana',
            'Barberry',
            'Beet',
            'Beetroot',
            'Berry',
            'Bilberry',
            'Blackberry',
            'Blueberry',
            'Borecole',
            'Brinjal',
            'Broccoli',
            'Brussel Sprout',
            'Butternut',
            'Cabbage',
            'Cabbage (Chinese)',
            'Cabbage (Savoy)',
            'Cactus Pear',
            'Carrot',
            'Cauliflower',
            'Celery',
            'Cherry',
            'Chicory',
            'Chili',
            'Cloudberry',
            'Coconut',
            'Coffee',
            'Cucumber',
            'Cucurbit',
            'Date',
            'Fig',
            'Garlic',
            'Ginger',
            'Gooseberry',
            'Granadilla',
            'Grape',
            'Grape (Bush Vine)',
            'Grape (Red)',
            'Grape (Table)',
            'Grape (White)',
            'Grapefruit',
            'Guava',
            'Kale',
            'Kiwi Fruit',
            'Kohlrabi',
            'Kumquat',
            'Leek',
            'Lemon',
            'Lentil',
            'Lespedeza',
            'Lettuce',
            'Litchi',
            'Lime',
            'Macadamia Nut',
            'Makataan',
            'Mandarin',
            'Mango',
            'Mustard',
            'Mustard (White)',
            'Nectarine',
            'Olive',
            'Onion',
            'Orange',
            'Papaya',
            'Paprika',
            'Parsley',
            'Parsnip',
            'Pea',
            'Pea (Dry)',
            'Peach',
            'Pear',
            'Pecan Nut',
            'Pepper',
            'Persimmon',
            'Pistachio Nut',
            'Plum',
            'Pomegranate',
            'Prickly Pear',
            'Protea',
            'Pumpkin',
            'Quince',
            'Radish',
            'Rapeseed',
            'Raspberry',
            'Rooibos',
            'Roses',
            'Squash',
            'Strawberry',
            'Sugarcane',
            'Swede',
            'Sweet Melon',
            'Swiss Chard',
            'Tomato',
            'Vetch (Common)',
            'Vetch (Hairy)',
            'Walnut',
            'Watermelon',
            'Wineberry',
            'Youngberry'],
        'Livestock': [
            'Cattle (Extensive)',
            'Cattle (Feedlot)',
            'Cattle (Stud)',
            'Chicken (Broilers)',
            'Chicken (Layers)',
            'Dairy',
            'Game',
            'Goats',
            'Horses',
            'Ostrich',
            'Pigs',
            'Rabbits',
            'Sheep (Extensive)',
            'Sheep (Feedlot)',
            'Sheep (Stud)'],
        'Plantation': [
            'Aloe',
            'Bluegum',
            'Hops',
            'Pine',
            'Pineapple',
            'Tea',
            'Sisal',
            'Wattle']
    };

    /**
     * @name EnterpriseEditor
     * @param enterprises
     * @constructor
     */
    function EnterpriseEditor (enterprises) {
        this.enterprises = underscore.map(enterprises || [], function (item) {
            return (item.name ? item.name : item);
        });

        this.selection = {
            category: undefined,
            item: undefined
        }
    }

    EnterpriseEditor.prototype.addEnterprise = function (enterprise) {
        enterprise = enterprise || this.selection.item;

        if (!underscore.isUndefined(enterprise) && this.enterprises.indexOf(enterprise) === -1) {
            this.enterprises.push(enterprise);
            this.selection.item = undefined;
        }
    };

    EnterpriseEditor.prototype.removeEnterprise = function (item) {
        if (underscore.isString(item)) {
            item = this.enterprises.indexOf(item);
        }

        if (item !== -1) {
            this.enterprises.splice(item, 1);
        }
    };

    return {
        listServiceMap: function() {
            return _listServiceMap;
        },
        legalEntityTypes: function() {
            return _legalEntityTypes;
        },
        enterpriseTypes: function () {
            return _enterpriseTypes;
        },

        enterpriseEditor: function (enterprises) {
            return new EnterpriseEditor(enterprises);
        }
    }
}]);

sdkHelperFarmerApp.factory('landUseHelper', ['underscore', function (underscore) {
    var _croppingPotentialTypes = ['High', 'Medium', 'Low'];
    var _effectiveDepthTypes = ['0 - 30cm', '30 - 60cm', '60 - 90cm', '90 - 120cm', '120cm +'];
    var _irrigationTypes = ['Centre-Pivot', 'Flood', 'Micro', 'Sub-drainage', 'Sprinkler', 'Drip'];
    var _landUseTypes = ['Cropland', 'Grazing', 'Horticulture (Intensive)', 'Horticulture (Perennial)', 'Horticulture (Seasonal)', 'Housing', 'Plantation', 'Planted Pastures', 'Structures (Handling)', 'Structures (Processing)', 'Structures (Storage)', 'Utilities', 'Wasteland', 'Conservation'];
    var _soilTextureTypes = ['Sand', 'Loamy Sand', 'Clay Sand', 'Sandy Loam', 'Fine Sandy Loam', 'Loam', 'Silty Loam', 'Sandy Clay Loam', 'Clay Loam', 'Clay', 'Gravel', 'Other', 'Fine Sandy Clay', 'Medium Sandy Clay Loam', 'Fine Sandy Clay Loam', 'Loamy Medium Sand', 'Medium Sandy Loam', 'Coarse Sandy Clay Loam', 'Coarse Sand', 'Loamy Fine Sand', 'Loamy Coarse Sand', 'Fine Sand', 'Silty Clay', 'Coarse Sandy Loam', 'Medium Sand', 'Medium Sandy Clay', 'Coarse Sandy Clay', 'Sandy Clay'];
    var _terrainTypes = ['Plains', 'Mountains'];
    var _waterSourceTypes = ['Irrigation Scheme', 'River', 'Dam', 'Borehole'];

    return {
        croppingPotentialTypes: function () {
            return _croppingPotentialTypes;
        },
        effectiveDepthTypes: function () {
            return _effectiveDepthTypes;
        },
        irrigationTypes: function () {
            return _irrigationTypes;
        },
        landUseTypes: function () {
            return _landUseTypes;
        },
        soilTextureTypes: function () {
            return _soilTextureTypes;
        },
        terrainTypes: function () {
            return _terrainTypes;
        },
        waterSourceTypes: function () {
            return _waterSourceTypes;
        },
        isCroppingPotentialRequired: function (landUse) {
            return s.include(landUse, 'Cropland');
        },
        isEstablishedDateRequired: function (landUse) {
            return (landUse == 'Horticulture (Perennial)');
        },
        isTerrainRequired: function (landUse) {
            return s.include(landUse, 'Grazing');
        }
    }
}]);
