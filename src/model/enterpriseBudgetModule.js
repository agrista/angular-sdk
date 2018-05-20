var sdkModelEnterpriseBudget = angular.module('ag.sdk.model.enterprise-budget', ['ag.sdk.library', 'ag.sdk.utilities', 'ag.sdk.model.base']);

sdkModelEnterpriseBudget.factory('EnterpriseBudgetBase', ['Base', 'computedProperty', 'inheritModel', 'interfaceProperty', 'Model', 'privateProperty', 'readOnlyProperty', 'underscore',
    function (Base, computedProperty, inheritModel, interfaceProperty, Model, privateProperty, readOnlyProperty, underscore) {
        function EnterpriseBudgetBase(attrs) {
            Model.Base.apply(this, arguments);

            computedProperty(this, 'defaultCostStage', function () {
                return underscore.last(EnterpriseBudgetBase.costStages);
            });

            // Sections
            privateProperty(this, 'getSections', function (sectionCode, costStage) {
                var sections = underscore.where(this.data.sections, {code: sectionCode, costStage: costStage || this.defaultCostStage});

                return (sections.length > 0 ? sections : underscore.filter(this.data.sections, function (section) {
                    return section.code === sectionCode && underscore.isUndefined(section.costStage);
                }));
            });

            privateProperty(this, 'sortSections', function () {
                this.data.sections = underscore.chain(this.data.sections)
                    .sortBy('name')
                    .reverse()
                    .value();
            });

            privateProperty(this, 'hasSection', function (sectionCode, costStage) {
                return !underscore.isEmpty(this.getSections(sectionCode, costStage));
            });

            privateProperty(this, 'getSection', function (sectionCode, costStage) {
                return underscore.first(this.getSections(sectionCode, costStage));
            });

            privateProperty(this, 'getSectionTitle', function (sectionCode) {
                return (EnterpriseBudgetBase.sections[sectionCode] ? EnterpriseBudgetBase.sections[sectionCode].name : '');
            });

            privateProperty(this, 'addSection', function (sectionCode, costStage) {
                var section = this.getSection(sectionCode, costStage);

                if (underscore.isUndefined(section)) {
                    section = underscore.extend({
                        productCategoryGroups: [],
                        total: {
                            value: 0
                        }
                    }, EnterpriseBudgetBase.sections[sectionCode]);

                    if (this.assetType === 'livestock') {
                        section.total.valuePerLSU = 0;
                    }

                    if (costStage) {
                        section.costStage = costStage;
                    }

                    this.data.sections.push(section);
                    this.sortSections();
                }

                return section;
            });

            // Groups
            privateProperty(this, 'getGroup', function (sectionCode, groupName, costStage) {
                return underscore.chain(this.getSections(sectionCode, costStage))
                    .pluck('productCategoryGroups')
                    .flatten()
                    .findWhere({name: groupName})
                    .value();
            });

            privateProperty(this, 'findGroupNameByCategory', function (sectionCode, groupName, categoryCode) {
                return (groupName ? groupName : underscore.chain(this.getCategoryOptions(sectionCode))
                    .map(function (categoryGroup, categoryGroupName) {
                        return (underscore.where(categoryGroup, {code: categoryCode}).length > 0 ? categoryGroupName : undefined);
                    })
                    .compact()
                    .first()
                    .value());
            });

            privateProperty(this, 'addGroup', function (sectionCode, groupName, costStage) {
                var group = this.getGroup(sectionCode, groupName, costStage);

                if (underscore.isUndefined(group)) {
                    var section = this.addSection(sectionCode, costStage);

                    group = underscore.extend({
                        productCategories: [],
                        total: {
                            value: 0
                        }
                    }, EnterpriseBudgetBase.groups[groupName]);

                    if (this.assetType === 'livestock') {
                        group.total.valuePerLSU = 0;
                    }

                    section.productCategoryGroups.push(group);
                }

                return group;
            });

            privateProperty(this, 'removeGroup', function (sectionCode, groupName, costStage) {
                var section = this.getSection(sectionCode, costStage);

                if (section) {
                    section.productCategoryGroups = underscore.reject(section.productCategoryGroups, function (group) {
                        return group.name === groupName;
                    });
                }

                this.recalculate();
            });

            // Categories
            privateProperty(this, 'groupAndCategoryAllowed', function (sectionCode, groupName, categoryCode) {
                var categoryOptions = getCategoryOptions(sectionCode, this.assetType, this.baseAnimal);

                return categoryOptions[groupName] && underscore.findWhere(categoryOptions[groupName], {code: categoryCode});
            });

            interfaceProperty(this, 'getCategory', function (sectionCode, categoryCode, costStage) {
                return underscore.chain(this.getSections(sectionCode, costStage))
                    .pluck('productCategoryGroups')
                    .flatten()
                    .pluck('productCategories')
                    .flatten()
                    .findWhere({code: categoryCode})
                    .value();
            });

            interfaceProperty(this, 'getCategoryOptions', function (sectionCode) {
                return getCategoryOptions(sectionCode, this.assetType, this.baseAnimal);
            });

            interfaceProperty(this, 'getGroupCategoryOptions', function (sectionCode, groupName) {
                return getGroupCategories(sectionCode, this.assetType, this.baseAnimal, groupName);
            });

            privateProperty(this, 'getAvailableGroupCategories', function (sectionCode, groupName, costStage) {
                var group = this.getGroup(sectionCode, groupName, costStage);

                return getAvailableGroupCategories(this, sectionCode, (group ? group.productCategories : []), groupName);
            });

            privateProperty(this, 'getAvailableCategories', function (sectionCode, costStage) {
                var sectionCategories = underscore.chain(this.getSections(sectionCode, costStage))
                    .pluck('productCategoryGroups')
                    .flatten()
                    .pluck('productCategories')
                    .flatten()
                    .value();

                return getAvailableGroupCategories(this, sectionCode, sectionCategories);
            });

            interfaceProperty(this, 'addCategory', function (sectionCode, groupName, categoryCode, costStage) {
                var category = this.getCategory(sectionCode, categoryCode, costStage);

                if (underscore.isUndefined(category) && !underscore.isUndefined(categoryCode)) {
                    var group = this.addGroup(sectionCode, this.findGroupNameByCategory(sectionCode, groupName, categoryCode), costStage);

                    category = underscore.extend({
                        quantity: 0,
                        value: 0
                    }, EnterpriseBudgetBase.categories[categoryCode]);

                    // WA: Modify enterprise budget model to specify input costs as "per ha"
                    if (sectionCode === 'EXP') {
                        category.unit = 'Total'
                    }

                    category.per = (this.assetType === 'livestock' ? 'LSU' : 'ha');

                    if (this.assetType === 'livestock') {
                        var conversionRate = this.getConversionRate(category.name);

                        if (conversionRate) {
                            category.conversionRate = conversionRate;
                        }

                        category.valuePerLSU = 0;
                    }

                    group.productCategories.push(category);
                }

                return category;
            });

            privateProperty(this, 'setCategory', function (sectionCode, groupName, category, costStage) {
                var group = this.addGroup(sectionCode, this.findGroupNameByCategory(sectionCode, groupName, category.code), costStage);

                if (group) {
                    group.productCategories = underscore.chain(group.productCategories)
                        .reject(function (groupCategory) {
                            return groupCategory.code === category.code;
                        })
                        .union([category])
                        .value();
                }

                return category;
            });

            privateProperty(this, 'removeCategory', function (sectionCode, groupName, categoryCode, costStage) {
                groupName = this.findGroupNameByCategory(sectionCode, groupName, categoryCode);

                var group = this.getGroup(sectionCode, groupName, costStage);

                if (group) {
                    group.productCategories = underscore.reject(group.productCategories, function (category) {
                        return category.code === categoryCode;
                    });

                    if (group.productCategories.length === 0) {
                        this.removeGroup(sectionCode, groupName, costStage);
                    }
                }

                this.recalculate();
            });

            privateProperty(this, 'getStockAssets', function () {
                return (this.assetType !== 'livestock' || underscore.isUndefined(conversionRate[this.baseAnimal]) ? [this.commodityType] : underscore.keys(conversionRate[this.baseAnimal]));
            });

            interfaceProperty(this, 'recalculate', function () {});

            // Livestock
            computedProperty(this, 'baseAnimal', function () {
                return baseAnimal[this.commodityType] || this.commodityType;
            });

            computedProperty(this, 'birthAnimal', function () {
                return birthAnimal[this.baseAnimal];
            });

            privateProperty(this, 'getBaseAnimal', function () {
                return this.baseAnimal;
            });

            privateProperty(this, 'getRepresentativeAnimal', function() {
                return representativeAnimal[this.baseAnimal];
            });

            privateProperty(this, 'getConversionRate', function(animal) {
                return conversionRate[this.baseAnimal] && (conversionRate[this.baseAnimal][animal] || conversionRate[this.baseAnimal][representativeAnimal[this.baseAnimal]]);
            });

            privateProperty(this, 'getConversionRates', function() {
                return conversionRate[this.baseAnimal];
            });

            privateProperty(this, 'getUnitAbbreviation', function (unit) {
                return unitAbbreviations[unit] || unit;
            });

            // Properties
            this.assetType = attrs && attrs.assetType;
            this.data = (attrs && attrs.data ? attrs.data : {});
            Base.initializeObject(this.data, 'sections', []);

            this.sortSections();

        }

        inheritModel(EnterpriseBudgetBase, Model.Base);

        readOnlyProperty(EnterpriseBudgetBase, 'sections', underscore.indexBy([
            {
                code: 'EXP',
                name: 'Expenses'
            }, {
                code: 'INC',
                name: 'Income'
            }
        ], 'code'));

        readOnlyProperty(EnterpriseBudgetBase, 'groups', underscore.indexBy([
            {
                code: 'INC-CPS',
                name: 'Crop Sales'
            }, {
                code: 'INC-FRS',
                name: 'Fruit Sales'
            }, {
                code: 'EST',
                name: 'Establishment'
            }, {
                code: 'HVT',
                name: 'Harvest'
            }, {
                code: 'HVP',
                name: 'Preharvest'
            }, {
                code: 'INC-LSS',
                name: 'Livestock Sales'
            }, {
                code: 'INC-LSP',
                name: 'Product Sales'
            }, {
                code: 'EXP-AMF',
                name: 'Animal Feed'
            }, {
                code: 'HBD',
                name: 'Husbandry'
            }, {
                code: 'IDR',
                name: 'Indirect Costs'
            }, {
                code: 'MRK',
                name: 'Marketing'
            }, {
                code: 'RPM',
                name: 'Replacements'
            }
        ], 'name'));

        readOnlyProperty(EnterpriseBudgetBase, 'categories', underscore.indexBy([
            //*********** Income *********
            // livestock sales
            // Sheep
            {
                code: 'INC-LSS-SLAMB',
                name: 'Lamb',
                supplyUnit: 'hd',
                unit: 'kg'
            }, {
                code: 'INC-LSS-SWEAN',
                name: 'Weaner lamb',
                supplyUnit: 'hd',
                unit: 'kg'
            }, {
                code: 'INC-LSS-SEWE',
                name: 'Ewe',
                supplyUnit: 'hd',
                unit: 'kg'
            }, {
                code: 'INC-LSS-SWTH',
                name: 'Wether (2-tooth plus)',
                supplyUnit: 'hd',
                unit: 'kg'
            }, {
                code: 'INC-LSS-SRAM',
                name: 'Ram (2-tooth plus)',
                supplyUnit: 'hd',
                unit: 'kg'
            },

            // Cattle
            {
                code: 'INC-LSS-CCALV',
                name: 'Calf',
                supplyUnit: 'hd',
                unit: 'kg'
            }, {
                code: 'INC-LSS-CWEN',
                name: 'Weaner calf',
                supplyUnit: 'hd',
                unit: 'kg'
            }, {
                code: 'INC-LSS-CCOW',
                name: 'Cow',
                supplyUnit: 'hd',
                unit: 'kg'
            }, {
                code: 'INC-LSS-CHEI',
                name: 'Heifer',
                supplyUnit: 'hd',
                unit: 'kg'
            }, {
                code: 'INC-LSS-CST18',
                name: 'Steer (18 months plus)',
                supplyUnit: 'hd',
                unit: 'kg'
            }, {
                code: 'INC-LSS-CST36',
                name: 'Steer (3 years plus)',
                supplyUnit: 'hd',
                unit: 'kg'
            }, {
                code: 'INC-LSS-CBULL',
                name: 'Bull (3 years plus)',
                supplyUnit: 'hd',
                unit: 'kg'
            },

            //Goats
            {
                code: 'INC-LSS-GKID',
                name: 'Kid',
                supplyUnit: 'hd',
                unit: 'kg'
            }, {
                code: 'INC-LSS-GWEAN',
                name: 'Weaner kid',
                supplyUnit: 'hd',
                unit: 'kg'
            }, {
                code: 'INC-LSS-GEWE',
                name: 'Ewe (2-tooth plus)',
                supplyUnit: 'hd',
                unit: 'kg'
            }, {
                code: 'INC-LSS-GCAST',
                name: 'Castrate (2-tooth plus)',
                supplyUnit: 'hd',
                unit: 'kg'
            }, {
                code: 'INC-LSS-GRAM',
                name: 'Ram (2-tooth plus)',
                supplyUnit: 'hd',
                unit: 'kg'
            },

            //Rabbits
            {
                code: 'INC-LSS-RKIT',
                name: 'Kit',
                supplyUnit: 'hd',
                unit: 'kg'
            }, {
                code: 'INC-LSS-RWEN',
                name: 'Weaner kit',
                supplyUnit: 'hd',
                unit: 'kg'
            }, {
                code: 'INC-LSS-RDOE',
                name: 'Doe',
                supplyUnit: 'hd',
                unit: 'kg'
            }, {
                code: 'INC-LSS-RLAP',
                name: 'Lapin',
                supplyUnit: 'hd',
                unit: 'kg'
            }, {
                code: 'INC-LSS-RBUC',
                name: 'Buck',
                supplyUnit: 'hd',
                unit: 'kg'
            },

            // livestock product sales
            {
                code: 'INC-LSP-MILK',
                name: 'Milk',
                unit: 'l'
            }, {
                code: 'INC-LSP-WOOL',
                name: 'Wool',
                unit: 'kg'
            }, {
                code: 'INC-LSP-LFUR',
                name: 'Fur',
                unit: 'kg'
            },

            //Crops
            {
                code: 'INC-HVT-CROP',
                name: 'Crop',
                unit: 't'
            },
            //Horticulture (non-perennial)
            {
                code: 'INC-HVT-FRUT',
                name: 'Fruit',
                unit: 't'
            },
            //*********** Expenses *********
            // Establishment
            {
                code: 'EXP-EST-DRAN',
                name: 'Drainage',
                unit: 'Total'
            }, {
                code: 'EXP-EST-IRRG',
                name: 'Irrigation',
                unit: 'Total'
            }, {
                code: 'EXP-EST-LPRP',
                name: 'Land preparation',
                unit: 'Total'
            }, {
                code: 'EXP-EST-TRLL',
                name: 'Trellising',
                unit: 'Total'
            },
            // Preharvest
            {
                code: 'EXP-HVP-CONS',
                name: 'Consultants',
                unit: 'Total'
            }, {
                code: 'EXP-HVP-SEED',
                name: 'Seed',
                unit: 'kg'
            }, {
                code: 'EXP-HVP-PLTM',
                name: 'Plant Material',
                unit: 'each'
            }, {
                code: 'EXP-HVP-ELEC',
                name: 'Electricity',
                unit: 'Total'
            }, {
                code: 'EXP-HVP-FERT',
                name: 'Fertiliser',
                unit: 't'
            }, {
                code: 'EXP-HVP-FUEL',
                name: 'Fuel',
                unit: 'l'
            }, {
                code: 'EXP-HVP-FUNG',
                name: 'Fungicides',
                unit: 'Total'
            }, {
                code: 'EXP-HVP-GENL',
                name: 'General',
                unit: 'Total'
            }, {
                code: 'EXP-HVP-LIME',
                name: 'Lime',
                unit: 't'
            }, {
                code: 'EXP-HVP-HERB',
                name: 'Herbicides',
                unit: 'l'
            }, {
                code: 'EXP-HVP-PEST',
                name: 'Pesticides',
                unit: 'l'
            }, {
                code: 'EXP-HVP-PGRG',
                name: 'Plant growth regulators',
                unit: 'Total'
            }, {
                code: 'EXP-HVP-POLL',
                name: 'Pollination',
                unit: 'ha'
            }, {
                code: 'EXP-HVP-SPYA',
                name: 'Aerial spraying',
                unit: 'ha'
            }, {
                code: 'EXP-HVP-INSH',
                name: 'Hail insurance',
                unit: 't'
            }, {
                code: 'EXP-HVP-INSM',
                name: 'Yield insurance',
                unit: 't'
            }, {
                code: 'EXP-HVP-HEDG',
                name: 'Hedging cost',
                unit: 't'
            }, {
                code: 'EXP-HVP-REPP',
                name: 'Repairs & maintenance',
                unit: 'Total'
            }, {
                code: 'EXP-HVP-SLAB',
                name: 'Seasonal labour',
                unit: 'ha'
            },
            //Harvest
            {
                code: 'EXP-HVT-FUEL',
                name: 'Fuel',
                unit: 'l'
            }, {
                code: 'EXP-HVT-LABC',
                name: 'Harvest labour',
                unit: 'ha'
            }, {
                code: 'EXP-HVT-HVTT',
                name: 'Harvest transport',
                unit: 'Total'
            }, {
                code: 'EXP-HVT-HVTC',
                name: 'Harvesting cost',
                unit: 'Total'
            }, {
                code: 'EXP-HVT-REPP',
                name: 'Repairs & maintenance',
                unit: 'Total'
            }, {
                code: 'EXP-HVT-STOR',
                name: 'Storage',
                unit: 'days'
            }, {
                code: 'EXP-HVT-PAKM',
                name: 'Packaging material',
                unit: 'each'
            }, {
                code: 'EXP-HVT-DYCL',
                name: 'Drying and cleaning',
                unit: 't'
            }, {
                code: 'EXP-HVT-PAKC',
                name: 'Packing cost',
                unit: 'each'
            },
            //Indirect
            {
                code: 'EXP-IDR-ODEP',
                name: 'Depreciation on orchards',
                unit: 'Total'
            }, {
                code: 'EXP-IDR-FUEL',
                name: 'Fuel',
                unit: 'l'
            }, {
                code: 'EXP-IDR-REPP',
                name: 'Repairs & maintenance',
                unit: 'Total'
            }, {
                code: 'EXP-IDR-ELEC',
                name: 'Electricity',
                unit: 'Total'
            }, {
                code: 'EXP-IDR-INTR',
                name: 'Interest on loans',
                unit: 'Total'
            }, {
                code: 'EXP-IDR-WATR',
                name: 'Water',
                unit: 'Total'
            }, {
                code: 'EXP-IDR-LABP',
                name: 'Permanent labour',
                unit: 'Total'
            }, {
                code: 'EXP-IDR-SCHED',
                name: 'Scheduling',
                unit: 'Total'
            }, {
                code: 'EXP-IDR-LICS',
                name: 'License',
                unit: 'Total'
            }, {
                code: 'EXP-IDR-INSA',
                name: 'Insurance assets',
                unit: 'Total'
            }, {
                code: 'EXP-IDR-OTHER',
                name: 'Other overheads',
                unit: 'Total'
            },
            //Replacements
            // Sheep
            {
                code: 'EXP-RPM-SLAMB',
                name: 'Lamb',
                unit: 'head'
            }, {
                code: 'EXP-RPM-SWEAN',
                name: 'Weaner lamb',
                unit: 'head'
            }, {
                code: 'EXP-RPM-SEWE',
                name: 'Ewe',
                unit: 'head'
            }, {
                code: 'EXP-RPM-SWTH',
                name: 'Wether (2-tooth plus)',
                unit: 'head'
            }, {
                code: 'EXP-RPM-SRAM',
                name: 'Ram (2-tooth plus)',
                unit: 'head'
            },

            // Cattle
            {
                code: 'EXP-RPM-CCALV',
                name: 'Calf',
                unit: 'head'
            }, {
                code: 'EXP-RPM-CWEN',
                name: 'Weaner calf',
                unit: 'head'
            }, {
                code: 'EXP-RPM-CCOW',
                name: 'Cow',
                unit: 'head'
            }, {
                code: 'EXP-RPM-CHEI',
                name: 'Heifer',
                unit: 'head'
            }, {
                code: 'EXP-RPM-CST18',
                name: 'Steer (18 months plus)',
                unit: 'head'
            }, {
                code: 'EXP-RPM-CST36',
                name: 'Steer (3 years plus)',
                unit: 'head'
            }, {
                code: 'EXP-RPM-CBULL',
                name: 'Bull (3 years plus)',
                unit: 'head'
            },

            //Goats
            {
                code: 'EXP-RPM-GKID',
                name: 'Kid',
                unit: 'head'
            }, {
                code: 'EXP-RPM-GWEAN',
                name: 'Weaner kid',
                unit: 'head'
            }, {
                code: 'EXP-RPM-GEWE',
                name: 'Ewe (2-tooth plus)',
                unit: 'head'
            }, {
                code: 'EXP-RPM-GCAST',
                name: 'Castrate (2-tooth plus)',
                unit: 'head'
            }, {
                code: 'EXP-RPM-GRAM',
                name: 'Ram (2-tooth plus)',
                unit: 'head'
            },
            //Rabbits
            {
                code: 'EXP-RPM-RKIT',
                name: 'Kit',
                unit: 'head'
            }, {
                code: 'EXP-RPM-RWEN',
                name: 'Weaner kit',
                unit: 'head'
            }, {
                code: 'EXP-RPM-RDOE',
                name: 'Doe',
                unit: 'head'
            }, {
                code: 'EXP-RPM-RLAP',
                name: 'Lapin',
                unit: 'head'
            }, {
                code: 'EXP-RPM-RBUC',
                name: 'Buck',
                unit: 'head'
            },
            //Animal feed
            {
                code: 'EXP-AMF-LICK',
                name: 'Lick',
                unit: 'kg'
            },
            //Husbandry
            {
                code: 'EXP-HBD-VACC',
                name: 'Drenching & vaccination',
                unit: 'head'
            }, {
                code: 'EXP-HBD-DIPP',
                name: 'Dipping & jetting',
                unit: 'head'
            }, {
                code: 'EXP-HBD-VETY',
                name: 'Veterinary',
                unit: 'head'
            }, {
                code: 'EXP-HBD-SHER',
                name: 'Shearing',
                unit: 'head'
            }, {
                code: 'EXP-HBD-CRCH',
                name: 'Crutching',
                unit: 'head'
            }, {
                code: 'EXP-MRK-LSSF',
                name: 'Livestock sales marketing fees',
                unit: 't'
            }, {
                code: 'EXP-MRK-LSPF',
                name: 'Livestock products marketing fees',
                unit: 't'
            }, {
                code: 'EXP-MRK-HOTF',
                name: 'Horticulture marketing fees',
                unit: 't'
            }, {
                code: 'EXP-MRK-CRPF',
                name: 'Crop marketing fees',
                unit: 't'
            }, {
                code: 'EXP-MRK-LSTP',
                name: 'Livestock transport',
                unit: 'head'
            }, {
                code: 'EXP-MRK-HOTT',
                name: 'Fruit transport',
                unit: 't'
            }, {
                code: 'EXP-MRK-CRPT',
                name: 'Crop transport',
                unit: 't'
            }
        ], 'code'));


        readOnlyProperty(EnterpriseBudgetBase, 'stockableCategoryCodes', [
            'INC-LSS-SLAMB',
            'INC-LSS-SWEAN',
            'INC-LSS-SEWE',
            'INC-LSS-SWTH',
            'INC-LSS-SRAM',
            'INC-LSS-CCALV',
            'INC-LSS-CWEN',
            'INC-LSS-CCOW',
            'INC-LSS-CHEI',
            'INC-LSS-CST18',
            'INC-LSS-CST36',
            'INC-LSS-CBULL',
            'INC-LSS-GKID',
            'INC-LSS-GWEAN',
            'INC-LSS-GEWE',
            'INC-LSS-GCAST',
            'INC-LSS-GRAM',
            'INC-LSS-RKIT',
            'INC-LSS-RWEN',
            'INC-LSS-RDOE',
            'INC-LSS-RLAP',
            'INC-LSS-RBUC',
            'INC-LSP-MILK',
            'INC-LSP-WOOL',
            'INC-LSP-LFUR',
            'INC-HVT-CROP',
            'INC-HVT-FRUT',
            'EXP-HVP-SEED',
            'EXP-HVP-PLTM',
            'EXP-HVP-FERT',
            'EXP-HVP-FUEL',
            'EXP-HVP-FUNG',
            'EXP-HVP-LIME',
            'EXP-HVP-HERB',
            'EXP-HVP-PEST',
            'EXP-HVP-PGRG',
            'EXP-HVT-FUEL',
            'EXP-IDR-FUEL',
            'EXP-IDR-WATR',
            'EXP-AMF-LICK'
        ]);

        readOnlyProperty(EnterpriseBudgetBase, 'categoryOptions', {
            crop: {
                INC: {
                    'Crop Sales': getCategoryArray(['INC-HVT-CROP'])
                },
                EXP: {
                    'Preharvest': getCategoryArray(['EXP-HVP-FERT', 'EXP-HVP-FUNG', 'EXP-HVP-HEDG', 'EXP-HVP-HERB', 'EXP-HVP-INSH', 'EXP-HVP-INSM', 'EXP-HVP-LIME', 'EXP-HVP-PEST', 'EXP-HVP-SEED', 'EXP-HVP-SPYA']),
                    'Harvest': getCategoryArray(['EXP-HVT-LABC', 'EXP-HVT-HVTC']),
                    'Marketing': getCategoryArray(['EXP-MRK-CRPF', 'EXP-MRK-CRPT']),
                    'Indirect Costs': getCategoryArray(['EXP-IDR-FUEL', 'EXP-IDR-REPP', 'EXP-IDR-ELEC', 'EXP-IDR-WATR', 'EXP-IDR-LABP', 'EXP-IDR-SCHED', 'EXP-IDR-OTHER'])
                }
            },
            horticulture: {
                INC: {
                    'Fruit Sales': getCategoryArray(['INC-HVT-FRUT'])
                },
                EXP: {
                    'Establishment': getCategoryArray(['EXP-EST-DRAN', 'EXP-EST-IRRG', 'EXP-EST-LPRP', 'EXP-EST-TRLL']),
                    'Preharvest': getCategoryArray(['EXP-HVP-CONS', 'EXP-HVP-ELEC', 'EXP-HVP-FERT', 'EXP-HVP-FUEL', 'EXP-HVP-FUNG', 'EXP-HVP-GENL', 'EXP-HVP-LIME', 'EXP-HVP-HERB', 'EXP-HVP-INSH', 'EXP-HVP-INSM', 'EXP-HVP-PEST', 'EXP-HVP-PGRG', 'EXP-HVP-PLTM', 'EXP-HVP-POLL', 'EXP-HVP-REPP', 'EXP-HVP-SLAB', 'EXP-HVP-SPYA']),
                    'Harvest': getCategoryArray(['EXP-HVT-FUEL', 'EXP-HVT-DYCL', 'EXP-HVT-LABC', 'EXP-HVT-HVTT', 'EXP-HVT-PAKC', 'EXP-HVT-PAKM', 'EXP-HVT-REPP', 'EXP-HVT-STOR']),
                    'Marketing': getCategoryArray(['EXP-MRK-HOTF', 'EXP-MRK-HOTT']),
                    'Indirect Costs': getCategoryArray(['EXP-IDR-ODEP', 'EXP-IDR-FUEL', 'EXP-IDR-REPP', 'EXP-IDR-ELEC', 'EXP-IDR-WATR', 'EXP-IDR-LABP', 'EXP-IDR-SCHED', 'EXP-IDR-LICS', 'EXP-IDR-INSA', 'EXP-IDR-OTHER'])
                }
            },
            livestock: {
                Cattle: {
                    INC: {
                        'Livestock Sales': getCategoryArray(['INC-LSS-CCALV', 'INC-LSS-CWEN', 'INC-LSS-CCOW', 'INC-LSS-CHEI', 'INC-LSS-CST18', 'INC-LSS-CST36', 'INC-LSS-CBULL']),
                        'Product Sales': getCategoryArray(['INC-LSP-MILK'])
                    },
                    EXP: {
                        'Replacements': getCategoryArray(['EXP-RPM-CCALV', 'EXP-RPM-CWEN', 'EXP-RPM-CCOW', 'EXP-RPM-CHEI', 'EXP-RPM-CST18', 'EXP-RPM-CST36', 'EXP-RPM-CBULL']),
                        'Animal Feed': getCategoryArray(['EXP-AMF-LICK']),
                        'Husbandry': getCategoryArray(['EXP-HBD-VACC', 'EXP-HBD-DIPP', 'EXP-HBD-VETY']),
                        'Marketing': getCategoryArray(['EXP-MRK-LSSF', 'EXP-MRK-LSPF', 'EXP-MRK-LSTP']),
                        'Indirect Costs': getCategoryArray(['EXP-IDR-FUEL', 'EXP-IDR-REPP', 'EXP-IDR-ELEC', 'EXP-IDR-WATR', 'EXP-IDR-LABP', 'EXP-IDR-LICS', 'EXP-IDR-INSA', 'EXP-IDR-OTHER'])
                    }
                },
                Game: {
                    INC: {
                        'Livestock Sales': getCategoryArray(['INC-LSS-CCALV', 'INC-LSS-CWEN', 'INC-LSS-CCOW', 'INC-LSS-CHEI', 'INC-LSS-CST18', 'INC-LSS-CST36', 'INC-LSS-CBULL']),
                        'Product Sales': getCategoryArray(['INC-LSP-WOOL', 'INC-LSP-LFUR'])
                    },
                    EXP: {
                        'Replacements': getCategoryArray(['EXP-RPM-CCALV', 'EXP-RPM-CWEN', 'EXP-RPM-CCOW', 'EXP-RPM-CHEI', 'EXP-RPM-CST18', 'EXP-RPM-CST36', 'EXP-RPM-CBULL']),
                        'Animal Feed': getCategoryArray(['EXP-AMF-LICK']),
                        'Husbandry': getCategoryArray(['EXP-HBD-VACC', 'EXP-HBD-DIPP', 'EXP-HBD-VETY']),
                        'Marketing': getCategoryArray(['EXP-MRK-LSSF', 'EXP-MRK-LSPF', 'EXP-MRK-LSTP']),
                        'Indirect Costs': getCategoryArray(['EXP-IDR-FUEL', 'EXP-IDR-REPP', 'EXP-IDR-ELEC', 'EXP-IDR-WATR', 'EXP-IDR-LABP', 'EXP-IDR-LICS', 'EXP-IDR-INSA', 'EXP-IDR-OTHER'])
                    }
                },
                Goats: {
                    INC: {
                        'Livestock Sales': getCategoryArray(['INC-LSS-GKID', 'INC-LSS-GWEAN', 'INC-LSS-GEWE', 'INC-LSS-GCAST', 'INC-LSS-GRAM']),
                        'Product Sales': getCategoryArray(['INC-LSP-WOOL', 'INC-LSP-MILK'])
                    },
                    EXP: {
                        'Replacements': getCategoryArray(['EXP-RPM-GKID', 'EXP-RPM-GWEAN', 'EXP-RPM-GEWE', 'EXP-RPM-GCAST', 'EXP-RPM-GRAM']),
                        'Animal Feed': getCategoryArray(['EXP-AMF-LICK']),
                        'Husbandry': getCategoryArray(['EXP-HBD-VACC', 'EXP-HBD-DIPP', 'EXP-HBD-VETY', 'EXP-HBD-SHER', 'EXP-HBD-CRCH']),
                        'Marketing': getCategoryArray(['EXP-MRK-LSSF', 'EXP-MRK-LSPF', 'EXP-MRK-LSTP']),
                        'Indirect Costs': getCategoryArray(['EXP-IDR-FUEL', 'EXP-IDR-REPP', 'EXP-IDR-ELEC', 'EXP-IDR-WATR', 'EXP-IDR-LABP', 'EXP-IDR-LICS', 'EXP-IDR-INSA', 'EXP-IDR-OTHER'])
                    }
                },
                Rabbits: {
                    INC: {
                        'Livestock Sales': getCategoryArray(['INC-LSS-RKIT', 'INC-LSS-RWEN', 'INC-LSS-RDOE', 'INC-LSS-RLUP', 'INC-LSS-RBUC']),
                        'Product Sales': getCategoryArray(['INC-LSP-WOOL', 'INC-LSP-LFUR'])
                    },
                    EXP: {
                        'Replacements': getCategoryArray(['EXP-RPM-RKIT', 'EXP-RPM-RWEN', 'EXP-RPM-RDOE', 'EXP-RPM-RLUP', 'EXP-RPM-RBUC']),
                        'Husbandry': getCategoryArray(['EXP-HBD-VACC', 'EXP-HBD-DIPP', 'EXP-HBD-VETY', 'EXP-HBD-SHER', 'EXP-HBD-CRCH']),
                        'Marketing': getCategoryArray(['EXP-MRK-LSSF', 'EXP-MRK-LSPF', 'EXP-MRK-LSTP']),
                        'Indirect Costs': getCategoryArray(['EXP-IDR-FUEL', 'EXP-IDR-REPP', 'EXP-IDR-ELEC', 'EXP-IDR-WATR', 'EXP-IDR-LABP', 'EXP-IDR-LICS', 'EXP-IDR-INSA', 'EXP-IDR-OTHER'])
                    }
                },
                Sheep: {
                    INC: {
                        'Livestock Sales': getCategoryArray(['INC-LSS-SLAMB', 'INC-LSS-SWEAN', 'INC-LSS-SEWE', 'INC-LSS-SWTH', 'INC-LSS-SRAM']),
                        'Product Sales': getCategoryArray(['INC-LSP-WOOL', 'INC-LSP-MILK'])
                    },
                    EXP: {
                        'Replacements': getCategoryArray(['EXP-RPM-SLAMB', 'EXP-RPM-SWEAN', 'EXP-RPM-SEWE', 'EXP-RPM-SWTH', 'EXP-RPM-SRAM']),
                        'Animal Feed': getCategoryArray(['EXP-AMF-LICK']),
                        'Husbandry': getCategoryArray(['EXP-HBD-VACC', 'EXP-HBD-DIPP', 'EXP-HBD-VETY', 'EXP-HBD-SHER', 'EXP-HBD-CRCH']),
                        'Marketing': getCategoryArray(['EXP-MRK-LSSF', 'EXP-MRK-LSPF', 'EXP-MRK-LSTP']),
                        'Indirect Costs': getCategoryArray(['EXP-IDR-FUEL', 'EXP-IDR-REPP', 'EXP-IDR-ELEC', 'EXP-IDR-WATR', 'EXP-IDR-LABP', 'EXP-IDR-LICS', 'EXP-IDR-INSA', 'EXP-IDR-OTHER'])
                    }
                }
            }
        });

        privateProperty(EnterpriseBudgetBase, 'getBaseCategory', function (categoryCode) {
            return EnterpriseBudgetBase.categories[categoryCode];
        });

        privateProperty(EnterpriseBudgetBase, 'getGroupCategories', function (assetType, commodityType, sectionCode, groupName) {
            return getGroupCategories(sectionCode, assetType, baseAnimal[commodityType], groupName);
        });

        function getCategoryOptions (sectionCode, assetType, baseAnimal) {
            return (assetType && EnterpriseBudgetBase.categoryOptions[assetType] ?
                (assetType === 'livestock'
                    ? (baseAnimal ? EnterpriseBudgetBase.categoryOptions[assetType][baseAnimal][sectionCode] : {})
                    : EnterpriseBudgetBase.categoryOptions[assetType][sectionCode])
                : {});
        }

        function getGroupCategories (sectionCode, assetType, baseAnimal, groupName) {
            var sectionGroupCategories = getCategoryOptions(sectionCode, assetType, baseAnimal);

            return (sectionGroupCategories && sectionGroupCategories[groupName] ? sectionGroupCategories[groupName] : []);
        }

        function getCategoryArray (categoryCodes) {
            return underscore.chain(categoryCodes)
                .map(function (code) {
                    return EnterpriseBudgetBase.categories[code];
                })
                .compact()
                .sortBy('name')
                .value();
        }

        function getAvailableGroupCategories (instance, sectionCode, usedCategories, groupName) {
            return underscore.chain(instance.getCategoryOptions(sectionCode))
                .map(function (categoryGroup, categoryGroupName) {
                    return underscore.chain(categoryGroup)
                        .reject(function (category) {
                            return (groupName && categoryGroupName !== groupName) ||
                                underscore.findWhere(usedCategories, {code: category.code});
                        })
                        .map(function (category) {
                            return underscore.extend(category, {
                                groupBy: categoryGroupName
                            });
                        })
                        .value();
                })
                .values()
                .flatten()
                .value();
        }

        readOnlyProperty(EnterpriseBudgetBase, 'costStages', ['Establishment', 'Yearly']);

        var unitAbbreviations = {
            head: 'hd',
            each: 'ea.'
        };

        // Livestock
        var representativeAnimal = {
            Cattle: 'Cow',
            Game: 'Cow',
            Goats: 'Ewe (2-tooth plus)',
            Rabbits: 'Doe',
            Sheep: 'Ewe'
        };

        var baseAnimal = {
            'Cattle (Extensive)': 'Cattle',
            'Cattle (Feedlot)': 'Cattle',
            'Cattle (Stud)': 'Cattle',
            'Sheep (Extensive)': 'Sheep',
            'Sheep (Feedlot)': 'Sheep',
            'Sheep (Stud)': 'Sheep'
        };

        var birthAnimal = {
            Cattle: 'Calf',
            Game: 'Calf',
            Goats: 'Kid',
            Rabbits: 'Kit',
            Sheep: 'Lamb'
        };

        var conversionRate = {
            Cattle: {
                'Calf': 0.32,
                'Weaner calf': 0.44,
                'Cow': 1.1,
                'Heifer': 1.1,
                'Steer (18 months plus)': 0.75,
                'Steer (3 years plus)': 1.1,
                'Bull (3 years plus)': 1.36
            },
            Game: {
                'Calf': 0.32,
                'Weaner calf': 0.44,
                'Cow': 1.1,
                'Heifer': 1.1,
                'Steer (18 months plus)': 0.75,
                'Steer (3 years plus)': 1.1,
                'Bull (3 years plus)': 1.36
            },
            Goats: {
                'Kid': 0.08,
                'Weaner kid': 0.12,
                'Ewe (2-tooth plus)': 0.17,
                'Castrate (2-tooth plus)': 0.17,
                'Ram (2-tooth plus)': 0.22
            },
            Rabbits: {
                'Kit': 0.08,
                'Weaner kit': 0.12,
                'Doe': 0.17,
                'Lapin': 0.17,
                'Buck': 0.22
            },
            Sheep: {
                'Lamb': 0.08,
                'Weaner lamb': 0.11,
                'Ewe': 0.16,
                'Wether (2-tooth plus)': 0.16,
                'Ram (2-tooth plus)': 0.23
            }
        };

        privateProperty(EnterpriseBudgetBase, 'getBirthingAnimal', function (commodityType) {
            return baseAnimal[commodityType] && birthAnimal[baseAnimal[commodityType]] || commodityType;
        });

        interfaceProperty(EnterpriseBudgetBase, 'getAssetTypeForLandUse', function (landUse) {
            return (s.include(landUse, 'Cropland') ? 'crop' :
                (s.include(landUse, 'Cropland') ? 'horticulture' : 'livestock'));
        });

        EnterpriseBudgetBase.validates({
            data: {
                required: true,
                object: true
            }
        });

        return EnterpriseBudgetBase;
    }]);

sdkModelEnterpriseBudget.factory('EnterpriseBudget', ['$filter', 'Base', 'computedProperty', 'EnterpriseBudgetBase', 'inheritModel', 'moment', 'naturalSort', 'privateProperty', 'readOnlyProperty', 'safeMath', 'underscore',
    function ($filter, Base, computedProperty, EnterpriseBudgetBase, inheritModel, moment, naturalSort, privateProperty, readOnlyProperty, safeMath, underscore) {
        function EnterpriseBudget(attrs) {
            EnterpriseBudgetBase.apply(this, arguments);

            Base.initializeObject(this.data, 'details', {});
            Base.initializeObject(this.data, 'events', {});
            Base.initializeObject(this.data, 'schedules', {});
            Base.initializeObject(this.data.details, 'cycleStart', 0);
            Base.initializeObject(this.data.details, 'productionArea', '1 Hectare');

            computedProperty(this, 'commodityTitle', function () {
                return getCommodityTitle(this.assetType);
            });

            privateProperty(this, 'getCommodities', function () {
                return getAssetCommodities(this.assetType);
            });

            privateProperty(this, 'getShiftedCycle', function () {
                return getShiftedCycle(this);
            });

            privateProperty(this, 'getEventTypes', function () {
                return eventTypes[this.assetType] ? eventTypes[this.assetType] : eventTypes.default;
            });

            privateProperty(this, 'getScheduleTypes', function () {
                return underscore.chain(scheduleTypes[this.assetType] ? scheduleTypes[this.assetType] : scheduleTypes.default)
                    .union(getScheduleBirthing(this))
                    .compact()
                    .value()
                    .sort(naturalSort);
            });

            privateProperty(this, 'getSchedule', function (scheduleName, defaultValue) {
                return (scheduleName && this.data.schedules[scheduleName] ?
                    this.data.schedules[scheduleName] :
                    (underscore.isUndefined(defaultValue) ? angular.copy(monthlyPercent) : underscore.range(12).map(function () {
                        return 0;
                    })));
            });

            privateProperty(this, 'shiftMonthlyArray', function (array) {
                return (array ? underscore.rest(array, this.data.details.cycleStart).concat(
                    underscore.first(array, this.data.details.cycleStart)
                ) : array);
            });

            privateProperty(this, 'unshiftMonthlyArray', function (array) {
                return (array ? underscore.rest(array, array.length -this.data.details.cycleStart).concat(
                    underscore.first(array, array.length - this.data.details.cycleStart)
                ) : array);
            });

            privateProperty(this, 'getShiftedSchedule', function (schedule) {
                return (underscore.isArray(schedule) ?
                    this.shiftMonthlyArray(schedule) :
                    this.shiftMonthlyArray(this.getSchedule(schedule)));
            });

            privateProperty(this, 'getAvailableSchedules', function (includeSchedule) {
                return getAvailableSchedules(this, includeSchedule);
            });

            computedProperty(this, 'cycleStart', function () {
                return this.data.details.cycleStart;
            });

            computedProperty(this, 'cycleStartMonth', function () {
                return EnterpriseBudget.cycleMonths[this.data.details.cycleStart].name;
            });

            privateProperty(this, 'getAllocationIndex', function (sectionCode, costStage) {
                var section = this.getSection(sectionCode, costStage),
                    monthIndex = (section && section.total ? underscore.findIndex(this.shiftMonthlyArray(section.total.valuePerMonth), function (value) {
                    return value !== 0;
                }) : -1);

                return (monthIndex !== -1 ? monthIndex : 0);
            });

            privateProperty(this, 'getLastAllocationIndex', function (sectionCode, costStage) {
                var section = this.getSection(sectionCode, costStage),
                    monthIndex = (section && section.total ? underscore.findLastIndex(this.shiftMonthlyArray(section.total.valuePerMonth), function (value) {
                        return value !== 0;
                    }) : -1);

                return (monthIndex !== -1 ? monthIndex + 1 : 12);
            });

            computedProperty(this, 'numberOfAllocatedMonths', function () {
                return this.getLastAllocationIndex('INC') - this.getAllocationIndex('EXP');
            });

            privateProperty(this, 'recalculate', function () {
                return recalculateEnterpriseBudget(this);
            });

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.averaged = attrs.averaged || false;
            this.cloneCount = attrs.cloneCount || 0;
            this.createdAt = attrs.createdAt;
            this.createdBy = attrs.createdBy;
            this.commodityType = attrs.commodityType;
            this.favoriteCount = attrs.favoriteCount || 0;
            this.favorited = attrs.favorited || false;
            this.followers = attrs.followers || [];
            this.id = attrs.id || attrs.$id;
            this.internallyPublished = attrs.internallyPublished || false;
            this.name = attrs.name;
            this.organization = attrs.organization;
            this.organizationUuid = attrs.organizationUuid;
            this.published = attrs.published || false;
            this.region = attrs.region;
            this.sourceUuid = attrs.sourceUuid;
            this.useCount = attrs.useCount || 0;
            this.updatedAt = attrs.updatedAt;
            this.updatedBy = attrs.updatedBy;
            this.user = attrs.user;
            this.userData = attrs.userData;
            this.userId = attrs.userId;
            this.uuid = attrs.uuid;

            if (this.assetType === 'livestock') {
                this.data.details.representativeAnimal = this.getRepresentativeAnimal();
                this.data.details.conversions = this.getConversionRates();
                this.data.details.budgetUnit = 'LSU';

                underscore.each(this.getEventTypes(), function (event) {
                    Base.initializeObject(this.data.events, event, Base.initializeArray(12));
                }, this);
            } else if (this.assetType === 'horticulture') {
                if (this.data.details.maturityFactor instanceof Array) {
                    this.data.details.maturityFactor = {
                        'INC': this.data.details.maturityFactor
                    };
                }

                Base.initializeObject(this.data.details, 'yearsToMaturity', getYearsToMaturity(this));
                Base.initializeObject(this.data.details, 'maturityFactor', {});
                Base.initializeObject(this.data.details.maturityFactor, 'INC', []);
                Base.initializeObject(this.data.details.maturityFactor, 'EXP', []);
            }

            this.recalculate();
        }

        inheritModel(EnterpriseBudget, EnterpriseBudgetBase);

        // Commodities
        readOnlyProperty(EnterpriseBudget, 'commodityTypes', {
            crop: 'Field Crops',
            horticulture: 'Horticulture',
            livestock: 'Livestock'
        });

        readOnlyProperty(EnterpriseBudget, 'assetCommodities', {
            crop: [
                'Barley',
                'Bean (Dry)',
                'Bean (Green)',
                'Beet',
                'Broccoli',
                'Butternut',
                'Cabbage',
                'Canola',
                'Carrot',
                'Cauliflower',
                'Cotton',
                'Cowpea',
                'Grain Sorghum',
                'Groundnut',
                'Leek',
                'Lucerne',
                'Lupin',
                'Maize',
                'Maize (Fodder)',
                'Maize (Green)',
                'Maize (Irrigated)',
                'Maize (Seed)',
                'Maize (White)',
                'Maize (Yellow)',
                'Multispecies Pasture',
                'Oats',
                'Onion',
                'Potato',
                'Pumpkin',
                'Rapeseed',
                'Rye',
                'Soya Bean',
                'Soya Bean (Irrigated)',
                'Sunflower',
                'Sweet Corn',
                'Teff',
                'Teff (Irrigated)',
                'Tobacco',
                'Triticale',
                'Turnip',
                'Wheat',
                'Wheat (Irrigated)'
            ],
            horticulture: [
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
                'Chicory',
                'Chili',
                'Cloudberry',
                'Citrus (Hardpeel)',
                'Citrus (Softpeel)',
                'Coffee',
                'Date',
                'Fig',
                'Garlic',
                'Gooseberry',
                'Grape (Bush Vine)',
                'Grape (Table)',
                'Grape (Wine)',
                'Guava',
                'Hazelnut',
                'Hops',
                'Kiwi',
                'Kumquat',
                'Lemon',
                'Lentil',
                'Lime',
                'Macadamia Nut',
                'Mandarin',
                'Mango',
                'Melon',
                'Mulberry',
                'Nectarine',
                'Olive',
                'Orange',
                'Papaya',
                'Pea',
                'Peach',
                'Peanut',
                'Pear',
                'Prickly Pear',
                'Pecan Nut',
                'Persimmon',
                'Pineapple',
                'Pistachio Nut',
                'Plum',
                'Pomegranate',
                'Protea',
                'Prune',
                'Quince',
                'Raspberry',
                'Rooibos',
                'Strawberry',
                'Sugarcane',
                'Tea',
                'Tomato',
                'Watermelon',
                'Wineberry'
            ],
            livestock: [
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
                'Sheep (Stud)'
            ]
        });

        function getCommodityTitle (assetType) {
            return EnterpriseBudget.commodityTypes[assetType] || '';
        }

        function getAssetCommodities (assetType) {
            return EnterpriseBudget.assetCommodities[assetType] || [];
        }

        var eventTypes = {
            'default': [],
            'livestock': ['Birth', 'Death']
        };

        var scheduleTypes = {
            'default': ['Fertilise', 'Harvest', 'Plant/Seed', 'Plough', 'Spray'],
            'livestock': ['Lick', 'Sales', 'Shearing', 'Vaccination']
        };

        readOnlyProperty(EnterpriseBudget, 'cycleMonths', underscore.map([
                'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'
            ],
            function (month, index) {
                return {
                    id: index,
                    name: month,
                    shortname: month.substring(0, 3)
                }
            }));

        privateProperty(EnterpriseBudget, 'getCycleMonth', function (month) {
            return EnterpriseBudget.cycleMonths[month % 12];
        });

        function getShiftedCycle (instance) {
            return underscore.sortBy(EnterpriseBudget.cycleMonths, function (monthCycle) {
                return (monthCycle.id < instance.data.details.cycleStart ? monthCycle.id + 12 : monthCycle.id);
            });
        }

        var monthlyPercent = [8.33, 8.33, 8.34, 8.33, 8.33, 8.34, 8.33, 8.33, 8.34, 8.33, 8.33, 8.34];

        // Horticulture
        var yearsToMaturity = {
            'Apple': 25,
            'Apricot': 18,
            'Avocado': 8,
            'Blueberry': 8,
            'Citrus (Hardpeel)': 25,
            'Citrus (Softpeel)': 25,
            'Date': 12,
            'Fig': 30,
            'Grape (Table)': 25,
            'Grape (Wine)': 25,
            'Macadamia Nut': 10,
            'Mango': 30,
            'Nectarine': 18,
            'Olive': 10,
            'Orange': 25,
            'Pecan Nut': 10,
            'Peach': 18,
            'Pear': 25,
            'Persimmon': 20,
            'Plum': 18,
            'Pomegranate': 30,
            'Rooibos': 5
        };

        function getYearsToMaturity (instance) {
            return yearsToMaturity[instance.commodityType];
        }

        // Schedules
        var scheduleBirthing = {
            'Calving': ['Cattle (Extensive)', 'Cattle (Feedlot)', 'Cattle (Stud)', 'Dairy'],
            'Hatching': ['Chicken (Broilers)', 'Chicken (Layers)', 'Ostrich'],
            'Kidding': ['Game', 'Goats'],
            'Foaling': ['Horses'],
            'Farrowing': ['Pigs'],
            'Lambing': ['Sheep (Extensive)', 'Sheep (Feedlot)', 'Sheep (Stud)']
        };

        function getScheduleBirthing (instance) {
            return underscore.chain(scheduleBirthing)
                .keys()
                .filter(function (key) {
                    return underscore.contains(scheduleBirthing[key], instance.commodityType);
                })
                .value();
        }

        function getAvailableSchedules(instance, includeSchedule) {
            return underscore.reject(instance.getScheduleTypes(), function (schedule) {
                return ((includeSchedule === undefined || schedule !== includeSchedule) && instance.data.schedules[schedule] !== undefined);
            })
        }

        // Calculation
        function validateEnterpriseBudget (instance) {
            // Validate sections
            underscore.each(EnterpriseBudget.sections, function (section) {
                for (var i = EnterpriseBudget.costStages.length - 1; i >= 0; i--) {
                    var budgetSection = instance.getSection(section.code, EnterpriseBudget.costStages[i]);

                    if (underscore.isUndefined(budgetSection)) {
                        budgetSection = angular.copy(section);
                        budgetSection.productCategoryGroups = [];

                        instance.data.sections.push(budgetSection);
                        instance.sortSections();
                    }

                    budgetSection.costStage = EnterpriseBudget.costStages[i];
                }
            });

            // Validate maturity
            if (instance.assetType === 'horticulture' && instance.data.details.yearsToMaturity) {
                var yearsToMaturity = instance.data.details.yearsToMaturity;

                instance.data.details.maturityFactor = underscore.mapObject(instance.data.details.maturityFactor, function (maturityFactor) {
                    return underscore.first(maturityFactor.concat(underscore.range(maturityFactor.length < yearsToMaturity ? (yearsToMaturity - maturityFactor.length) : 0)
                        .map(function () {
                            return 100;
                        })), yearsToMaturity);
                });
            }
        }

        function recalculateEnterpriseBudget (instance) {
            validateEnterpriseBudget(instance);

            if (instance.assetType === 'livestock' && instance.getConversionRate()) {
                instance.data.details.calculatedLSU = safeMath.times(instance.data.details.herdSize, instance.getConversionRate());
            }

            angular.forEach(instance.data.sections, function(section) {
                section.total = {
                    value: 0
                };

                if (instance.assetType === 'livestock') {
                    section.total.valuePerLSU = 0;
                }

                angular.forEach(section.productCategoryGroups, function(group) {
                    group.total = {
                        value: 0
                    };

                    if (instance.assetType === 'livestock') {
                        group.total.valuePerLSU = 0;
                    }

                    angular.forEach(group.productCategories, function(category) {
                        if (category.unit === '%') {
                            // Convert percentage to total
                            category.unit = 'Total';
                            category.pricePerUnit = category.quantity;
                            category.quantity = 1;
                        } else {
                            category.quantity = (category.unit === 'Total' ? 1 : category.quantity);
                        }

                        if (underscore.contains(['INC-HVT-CROP', 'INC-HVT-FRUT'], category.code)) {
                            category.name = instance.commodityType;
                        }

                        var schedule = (underscore.isArray(category.schedule) ? category.schedule : instance.getSchedule(category.schedule)),
                            scheduleTotalAllocation = underscore.reduce(schedule, function (total, value) {
                                return safeMath.plus(total, value);
                            }, 0);

                        category.value = safeMath.chain(underscore.isUndefined(category.supply) ? 1 : category.supply)
                            .times(category.quantity || 0)
                            .times(category.pricePerUnit || 0)
                            .times(scheduleTotalAllocation)
                            .dividedBy(100)
                            .toNumber();

                        if (instance.assetType === 'livestock' && instance.getConversionRate(category.name)) {
                            category.quantityPerLSU = safeMath.times(category.quantity, instance.getConversionRate(category.name));
                            category.valuePerLSU = safeMath.times(category.value, instance.getConversionRate(category.name));

                            group.total.quantityPerLSU = safeMath.plus(group.total.quantityPerLSU, category.quantityPerLSU);
                            group.total.valuePerLSU = safeMath.plus(group.total.valuePerLSU, category.valuePerLSU);
                        }

                        category.valuePerMonth = underscore.map(schedule, function (allocation) {
                            return safeMath.chain(category.value)
                                .times(allocation)
                                .dividedBy(100)
                                .toNumber();
                        });

                        category.quantityPerMonth = underscore.map(schedule, function (allocation) {
                            return safeMath.chain(category.quantity)
                                .times(allocation)
                                .dividedBy(100)
                                .toNumber();
                        });

                        group.total.value = safeMath.plus(group.total.value, category.value);
                        group.total.valuePerMonth = (group.total.valuePerMonth ?
                            underscore.map(group.total.valuePerMonth, function (value, index) {
                                return safeMath.plus(value, category.valuePerMonth[index]);
                            }) : angular.copy(category.valuePerMonth));
                    });

                    section.total.value = safeMath.plus(section.total.value, group.total.value);
                    section.total.valuePerMonth = (section.total.valuePerMonth ?
                        underscore.map(section.total.valuePerMonth, function (value, index) {
                            return safeMath.plus(value, group.total.valuePerMonth[index]);
                        }) : angular.copy(group.total.valuePerMonth));

                    if (instance.assetType === 'livestock') {
                        section.total.quantityPerLSU = safeMath.plus(section.total.quantityPerLSU, group.total.quantityPerLSU);
                        section.total.valuePerLSU = safeMath.plus(section.total.valuePerLSU, group.total.valuePerLSU);
                    }
                });
            });

            instance.data.details.grossProfitByStage = underscore.object(EnterpriseBudget.costStages,
                underscore.map(EnterpriseBudget.costStages, function (stage) {
                    return underscore
                        .chain(instance.data.sections)
                        .where({costStage: stage})
                        .reduce(function (total, section) {
                            return (section.code === 'INC' ? safeMath.plus(total, section.total.value) :
                                (section.code === 'EXP' ? safeMath.minus(total, section.total.value) : total));
                        }, 0)
                        .value();
                }));

            instance.data.details.grossProfit = instance.data.details.grossProfitByStage[instance.defaultCostStage];

            if (instance.assetType === 'livestock') {
                instance.data.details.grossProfitPerLSU = safeMath.dividedBy(instance.data.details.grossProfit, instance.data.details.calculatedLSU);
            }
        }

        // Validation
        EnterpriseBudget.validates({
            assetType: {
                required: true,
                inclusion: {
                    in: underscore.keys(EnterpriseBudget.assetCommodities)
                }
            },
            commodityType: {
                required: true,
                inclusion: {
                    in: function (value, instance, field) {
                        return getAssetCommodities(instance.assetType);
                    }
                }
            },
            data: {
                required: true,
                object: true
            },
            name: {
                required: true,
                length: {
                    min: 1,
                    max: 255
                }
            },
            region: {
                required: true,
                object: true
            }
        });

        return EnterpriseBudget;
    }]);
