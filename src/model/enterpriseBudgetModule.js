var sdkModelEnterpriseBudget = angular.module('ag.sdk.model.enterprise-budget', ['ag.sdk.library', 'ag.sdk.model.base']);

sdkModelEnterpriseBudget.factory('EnterpriseBudgetBase', ['computedProperty', 'inheritModel', 'interfaceProperty', 'Model', 'privateProperty', 'readOnlyProperty', 'underscore',
    function (computedProperty, inheritModel, interfaceProperty, Model, privateProperty, readOnlyProperty, underscore) {
        function EnterpriseBudgetBase(attrs) {
            Model.Base.apply(this, arguments);

            this.data = (attrs && attrs.data ? attrs.data : {});
            this.data.sections = this.data.sections || [];

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

            privateProperty(this, 'getSection', function (sectionCode, costStage) {
                return underscore.first(this.getSections(sectionCode, costStage));
            });

            privateProperty(this, 'addSection', function (sectionCode, costStage) {
                var section = this.getSection(sectionCode, costStage);

                if (underscore.isUndefined(section)) {
                    section = underscore.extend(angular.copy(EnterpriseBudgetBase.sections[sectionCode]), {
                        productCategoryGroups: [],
                        total: {
                            value: 0
                        }
                    });

                    if (this.assetType == 'livestock') {
                        section.total.valuePerLSU = 0;
                    }

                    if (costStage) {
                        section.costStage = costStage;
                    }

                    this.data.sections.push(section);
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

            privateProperty(this, 'addGroup', function (sectionCode, groupName, costStage) {
                var group = this.getGroup(sectionCode, groupName, costStage);

                if (underscore.isUndefined(group)) {
                    var section = this.addSection(sectionCode, costStage);

                    group = underscore.extend(angular.copy(EnterpriseBudgetBase.groups[groupName]), {
                        productCategories: [],
                        total: {
                            value: 0
                        }
                    });

                    if (this.assetType == 'livestock') {
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
            privateProperty(this, 'getCategory', function (sectionCode, categoryCode, costStage) {
                return underscore.chain(this.getSections(sectionCode, costStage))
                    .pluck('productCategoryGroups')
                    .flatten()
                    .pluck('productCategories')
                    .flatten()
                    .findWhere({code: categoryCode})
                    .value();
            });

            privateProperty(this, 'getAvailableCategories', function (sectionCode, costStage) {
                var sectionCategories = underscore.chain(this.getSections(sectionCode, costStage))
                    .pluck('productCategoryGroups')
                    .flatten()
                    .pluck('productCategories')
                    .flatten()
                    .value();

                return underscore
                    .chain(this.assetType == 'livestock' ? EnterpriseBudgetBase.categoryOptions[this.assetType][this.baseAnimal][sectionCode] : EnterpriseBudgetBase.categoryOptions[this.assetType][sectionCode])
                    .map(function (categoryGroup, categoryGroupName) {
                        return underscore.chain(categoryGroup)
                            .reject(function (category) {
                                return underscore.findWhere(sectionCategories, {code: category.code});
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
            });

            privateProperty(this, 'addCategory', function (sectionCode, groupName, categoryCode, costStage) {
                var category = this.getCategory(sectionCode, categoryCode, costStage);

                if (underscore.isUndefined(category)) {
                    var group = this.addGroup(sectionCode, groupName, costStage);

                    category = underscore.extend(angular.copy(EnterpriseBudgetBase.categories[categoryCode]), {
                        quantity: 0,
                        value: 0
                    });

                    if (this.assetType == 'livestock') {
                        category = underscore.extend(category, {
                            conversionRate: this.getConversionRate(category.name),
                            valuePerLSU: 0,
                            per: 'LSU'
                        });
                    } else {
                        category.per = 'ha';
                    }

                    group.productCategories.push(category);
                }

                return category;
            });

            privateProperty(this, 'removeCategory', function (sectionCode, groupName, categoryCode, costStage) {
                var group = this.getGroup(sectionCode, groupName, costStage);

                if (group) {
                    group.productCategories = underscore.reject(group.productCategories, function (category) {
                        return category.code === categoryCode;
                    });

                    if (group.productCategories.length == 0) {
                        this.removeGroup(sectionCode, groupName, costStage);
                    }
                }

                this.recalculate();
            });

            interfaceProperty(this, 'recalculate', function () {});

            // Livestock
            computedProperty(this, 'baseAnimal', function () {
                return baseAnimal[this.commodityType] || this.commodityType;
            });

            privateProperty(this, 'getBaseAnimal', function () {
                return this.baseAnimal;
            });

            privateProperty(this, 'getRepresentativeAnimal', function() {
                return representativeAnimal[this.baseAnimal];
            });

            privateProperty(this, 'getConversionRate', function(animal) {
                return conversionRate[this.baseAnimal][animal] || conversionRate[this.baseAnimal][representativeAnimal[this.baseAnimal]];
            });

            privateProperty(this, 'getConversionRates', function() {
                return conversionRate[this.baseAnimal];
            });
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
                unit: 'head'
            }, {
                code: 'INC-LSS-SWEAN',
                name: 'Weaner lambs',
                unit: 'head'
            }, {
                code: 'INC-LSS-SEWE',
                name: 'Ewe',
                unit: 'head'
            }, {
                code: 'INC-LSS-SWTH',
                name: 'Wether (2-tooth plus)',
                unit: 'head'
            }, {
                code: 'INC-LSS-SRAM',
                name: 'Ram',
                unit: 'head'
            },

            // Cattle
            {
                code: 'INC-LSS-CCALV',
                name: 'Calf',
                unit: 'head'
            }, {
                code: 'INC-LSS-CWEN',
                name: 'Weaner calves',
                unit: 'head'
            }, {
                code: 'INC-LSS-CCOW',
                name: 'Cow or heifer',
                unit: 'head'
            }, {
                code: 'INC-LSS-CST18',
                name: 'Steer (18 months plus)',
                unit: 'head'
            }, {
                code: 'INC-LSS-CST36',
                name: 'Steer (3 years plus)',
                unit: 'head'
            }, {
                code: 'INC-LSS-CBULL',
                name: 'Bull (3 years plus)',
                unit: 'head'
            },

            //Goats
            {
                code: 'INC-LSS-GKID',
                name: 'Kid',
                unit: 'head'
            }, {
                code: 'INC-LSS-GWEAN',
                name: 'Weaner kids',
                unit: 'head'
            }, {
                code: 'INC-LSS-GEWE',
                name: 'Ewe (2-tooth plus)',
                unit: 'head'
            }, {
                code: 'INC-LSS-GCAST',
                name: 'Castrate (2-tooth plus)',
                unit: 'head'
            }, {
                code: 'INC-LSS-GRAM',
                name: 'Ram (2-tooth plus)',
                unit: 'head'
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
            // Preharvest
            {
                code: 'EXP-HVP-SEED',
                name: 'Seed',
                unit: 'kg'
            }, {
                code: 'EXP-HVP-PLTM',
                name: 'Plant Material',
                unit: 'each'
            }, {
                code: 'EXP-HVP-FERT',
                name: 'Fertiliser',
                unit: 't'
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
                code: 'EXP-HVP-SPYA',
                name: 'Aerial spraying',
                unit: 'ha'
            }, {
                code: 'EXP-HVP-INSH',
                name: 'Crop Insurance (Hail)',
                unit: 't'
            }, {
                code: 'EXP-HVP-INSM',
                name: 'Crop Insurance (Multiperil)',
                unit: 't'
            }, {
                code: 'EXP-HVP-HEDG',
                name: 'Hedging cost',
                unit: 't'
            },
            //Harvest
            {
                code: 'EXP-HVT-LABC',
                name: 'Contract work (Harvest)',
                unit: 'ha'
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
                code: 'EXP-IDR-FUEL',
                name: 'Fuel',
                unit: 'l'
            }, {
                code: 'EXP-IDR-REPP',
                name: 'Repairs & parts',
                unit: 'Total'
            }, {
                code: 'EXP-IDR-ELEC',
                name: 'Electricity',
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
                name: 'Other costs',
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
                name: 'Weaner lambs',
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
                name: 'Ram',
                unit: 'head'
            },

            // Cattle
            {
                code: 'EXP-RPM-CCALV',
                name: 'Calf',
                unit: 'head'
            }, {
                code: 'EXP-RPM-CWEN',
                name: 'Weaner calves',
                unit: 'head'
            }, {
                code: 'EXP-RPM-CCOW',
                name: 'Cow or heifer',
                unit: 'head'
            }, {
                code: 'EXP-RPM-CST18',
                name: 'Steer (18 moths plus)',
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
                name: 'Weaner kids',
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
                incomeGroup: 'Livestock Sales',
                unit: '%'
            }, {
                code: 'EXP-MRK-LSPF',
                name: 'Livestock products marketing fees',
                incomeGroup: 'Product Sales',
                unit: '%'
            }, {
                code: 'EXP-MRK-HOTF',
                name: 'Horticulture marketing fees',
                incomeGroup: 'Fruit Sales',
                unit: '%'
            }, {
                code: 'EXP-MRK-CRPF',
                name: 'Crop marketing fees',
                incomeGroup: 'Crop Sales',
                unit: '%'
            }, {
                code: 'EXP-MRK-LSTP',
                name: 'Livestock transport',
                unit: 'head'
            }, {
                code: 'EXP-MRK-HOTT',
                name: 'Horticulture transport',
                unit: 't'
            }, {
                code: 'EXP-MRK-CRPT',
                name: 'Crop transport',
                unit: 't'
            }
        ], 'code'));

        readOnlyProperty(EnterpriseBudgetBase, 'categoryOptions', {
            crop: {
                INC: {
                    'Crop Sales': getCategoryArray(['INC-HVT-CROP'])
                },
                EXP: {
                    'Preharvest': getCategoryArray(['EXP-HVP-SEED', 'EXP-HVP-FERT', 'EXP-HVP-LIME', 'EXP-HVP-HERB', 'EXP-HVP-PEST', 'EXP-HVP-SPYA', 'EXP-HVP-INSH', 'EXP-HVP-INSM', 'EXP-HVP-HEDG']),
                    'Harvest': getCategoryArray(['EXP-HVT-LABC']),
                    'Marketing': getCategoryArray(['EXP-MRK-CRPF', 'EXP-MRK-CRPT']),
                    'Indirect Costs': getCategoryArray(['EXP-IDR-FUEL', 'EXP-IDR-REPP', 'EXP-IDR-ELEC', 'EXP-IDR-WATR', 'EXP-IDR-LABP', 'EXP-IDR-SCHED', 'EXP-IDR-OTHER'])
                }
            },
            horticulture: {
                INC: {
                    'Fruit Sales': getCategoryArray(['INC-HVT-FRUT'])
                },
                EXP: {
                    'Preharvest': getCategoryArray(['EXP-HVP-PLTM', 'EXP-HVP-FERT', 'EXP-HVP-LIME', 'EXP-HVP-HERB', 'EXP-HVP-PEST', 'EXP-HVP-SPYA', 'EXP-HVP-INSH', 'EXP-HVP-INSM']),
                    'Harvest': getCategoryArray(['EXP-HVT-LABC', 'EXP-HVT-STOR', 'EXP-HVT-PAKM', 'EXP-HVT-DYCL', 'EXP-HVT-PAKC']),
                    'Marketing': getCategoryArray(['EXP-MRK-HOTF', 'EXP-MRK-HOTT']),
                    'Indirect Costs': getCategoryArray(['EXP-IDR-FUEL', 'EXP-IDR-REPP', 'EXP-IDR-ELEC', 'EXP-IDR-WATR', 'EXP-IDR-LABP', 'EXP-IDR-SCHED', 'EXP-IDR-LICS', 'EXP-IDR-INSA', 'EXP-IDR-OTHER'])
                }
            },
            livestock: {
                Cattle: {
                    INC: {
                        'Livestock Sales': getCategoryArray(['INC-LSS-CCALV', 'INC-LSS-CWEN', 'INC-LSS-CCOW', 'INC-LSS-CST18', 'INC-LSS-CST36', 'INC-LSS-CBULL']),
                        'Product Sales': getCategoryArray(['INC-LSP-MILK'])
                    },
                    EXP: {
                        'Replacements': getCategoryArray(['EXP-RPM-CCALV', 'EXP-RPM-CWEN', 'EXP-RPM-CCOW', 'EXP-RPM-CST18', 'EXP-RPM-CST36', 'EXP-RPM-CBULL']),
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

        function getCategoryArray (categoryCodes) {
            return underscore.chain(categoryCodes)
                .map(function (code) {
                    return EnterpriseBudgetBase.categories[code]
                })
                .compact()
                .value();
        }

        readOnlyProperty(EnterpriseBudgetBase, 'costStages', ['Establishment', 'Yearly']);

        // Livestock
        var representativeAnimal = {
            Cattle: 'Cow or heifer',
            Sheep: 'Ewe',
            Goats: 'Ewe (2-tooth plus)'
        };

        var baseAnimal = {
            'Cattle (Extensive)': 'Cattle',
            'Cattle (Feedlot)': 'Cattle',
            'Cattle (Stud)': 'Cattle',
            'Sheep (Extensive)': 'Sheep',
            'Sheep (Feedlot)': 'Sheep',
            'Sheep (Stud)': 'Sheep'
        };

        var conversionRate = {
            Cattle: {
                'Calf': 0.32,
                'Weaner calves': 0.44,
                'Cow or heifer': 1.1,
                'Steer (18 months plus)': 0.75,
                'Steer (18 moths plus)': 0.75,
                'Steer (3 years plus)': 1.1,
                'Bull (3 years plus)': 1.36
            },
            Sheep: {
                'Lamb': 0.08,
                'Weaner Lambs': 0.11,
                'Ewe': 0.16,
                'Wether (2-tooth plus)': 0.16,
                'Ram (2-tooth plus)': 0.23
            },
            Goats: {
                'Kid': 0.08,
                'Weaner kids': 0.12,
                'Ewe (2-tooth plus)': 0.17,
                'Castrate (2-tooth plus)': 0.17,
                'Ram (2-tooth plus)': 0.22
            }
        };

        EnterpriseBudgetBase.validates({
            data: {
                required: true,
                object: true
            }
        });

        return EnterpriseBudgetBase;
    }]);

sdkModelEnterpriseBudget.factory('EnterpriseBudget', ['computedProperty', 'EnterpriseBudgetBase', 'enterpriseBudgetHelper', 'inheritModel', 'moment', 'naturalSort', 'privateProperty', 'readOnlyProperty', 'underscore',
    function (computedProperty, EnterpriseBudgetBase, enterpriseBudgetHelper, inheritModel, moment, naturalSort, privateProperty, readOnlyProperty, underscore) {
        function EnterpriseBudget(attrs) {
            EnterpriseBudgetBase.apply(this, arguments);

            this.data = (attrs && attrs.data ? attrs.data : {});
            this.data.details = this.data.details || {};
            this.data.details.cycleStart = this.data.details.cycleStart || 0;
            this.data.details.productionArea = this.data.details.productionArea || '1 Hectare';

            this.data.schedules = this.data.schedules || {};

            computedProperty(this, 'commodityTitle', function () {
                return getCommodityTitle(this.assetType);
            });

            privateProperty(this, 'getCommodities', function () {
                return getAssetCommodities(this.assetType);
            });

            privateProperty(this, 'getShiftedCycle', function () {
                return getShiftedCycle(this);
            });

            privateProperty(this, 'getScheduleTypes', function () {
                return underscore.chain(scheduleTypes[this.assetType] ? scheduleTypes[this.assetType] : scheduleTypes.default)
                    .union(getScheduleBirthing(this))
                    .compact()
                    .value()
                    .sort(function (a, b) {
                        return naturalSort(a, b);
                    });
            });

            privateProperty(this, 'getSchedule', function (scheduleName) {
                return (scheduleName && this.data.schedules[scheduleName] ? this.data.schedules[scheduleName] : underscore.range(12).map(function () {
                    return 100 / 12;
                }));
            });

            privateProperty(this, 'getShiftedSchedule', function (scheduleName) {
                var schedule = this.getSchedule(scheduleName);

                return underscore.rest(schedule, this.data.details.cycleStart).concat(
                    underscore.first(schedule, this.data.details.cycleStart)
                );
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

            privateProperty(this, 'recalculate', function () {
                return recalculateEnterpriseBudget(this);
            });

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.assetType = attrs.assetType;
            this.averaged = attrs.averaged || false;
            this.cloneCount = attrs.cloneCount || 0;
            this.createdAt = attrs.createdAt;
            this.createdBy = attrs.createdBy;
            this.commodityType = attrs.commodityType;
            this.favoriteCount = attrs.favoriteCount || 0;
            this.favorited = attrs.favorited || false;
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
            } else if (this.assetType === 'horticulture') {
                this.data.details.yearsToMaturity = this.data.details.yearsToMaturity || getYearsToMaturity(this);
                this.data.details.maturityFactor = this.data.details.maturityFactor || [];
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
            crop: ['Barley', 'Bean (Dry)', 'Bean (Green)', 'Canola', 'Cotton', 'Cowpea', 'Grain Sorghum', 'Groundnut', 'Lucerne', 'Lupin', 'Maize (Fodder)', 'Maize (Green)', 'Maize (Seed)', 'Maize (White)', 'Maize (Yellow)', 'Oats', 'Potato', 'Rye', 'Soya Bean', 'Sunflower', 'Sweet Corn', 'Tobacco', 'Triticale', 'Wheat'],
            horticulture: ['Almond', 'Apple', 'Apricot', 'Avocado', 'Banana', 'Blueberry', 'Cherry', 'Chicory', 'Chili', 'Citrus (Hardpeel)', 'Citrus (Softpeel)', 'Coffee', 'Fig', 'Garlic', 'Grape (Table)', 'Grape (Wine)', 'Guava', 'Hops', 'Kiwi', 'Lemon', 'Lentil', 'Macadamia Nut', 'Mango', 'Melon', 'Nectarine', 'Olive', 'Onion', 'Orange', 'Papaya', 'Pea', 'Peach', 'Peanut', 'Pear', 'Pecan Nut', 'Persimmon', 'Pineapple', 'Pistachio Nut', 'Plum', 'Pomegranate', 'Prune', 'Pumpkin', 'Quince', 'Rooibos', 'Strawberry', 'Sugarcane', 'Tomato', 'Watermelon'],
            livestock: ['Cattle (Extensive)', 'Cattle (Feedlot)', 'Cattle (Stud)', 'Chicken (Broilers)', 'Chicken (Layers)', 'Dairy', 'Game', 'Goats', 'Horses', 'Ostrich', 'Pigs', 'Sheep (Extensive)', 'Sheep (Feedlot)', 'Sheep (Stud)']
        });

        function getCommodityTitle (assetType) {
            return EnterpriseBudget.commodityTypes[assetType] || '';
        }

        function getAssetCommodities (assetType) {
            return EnterpriseBudget.assetCommodities[assetType] || [];
        }

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

        // Horticulture
        var yearsToMaturity = {
            'Apple': 25,
            'Apricot': 18,
            'Avocado': 8,
            'Blueberry': 8,
            'Citrus (Hardpeel)': 25,
            'Citrus (Softpeel)': 25,
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
                    }

                    budgetSection.costStage = EnterpriseBudget.costStages[i];
                }
            });

            // Validate maturity
            if (instance.assetType == 'horticulture' && instance.data.details.yearsToMaturity) {
                while (instance.data.details.maturityFactor.length < instance.data.details.yearsToMaturity) {
                    instance.data.details.maturityFactor.push(Math.floor((100 / instance.data.details.yearsToMaturity) * (instance.data.details.maturityFactor.length + 1)));
                }

                instance.data.details.maturityFactor = instance.data.details.maturityFactor.slice(0, instance.data.details.yearsToMaturity);
            }
        }

        function roundValue (value, precision) {
            precision = Math.pow(10, precision || 0);

            return Math.round(value * precision) / precision;
        }

        function recalculateEnterpriseBudget (instance) {
            validateEnterpriseBudget(instance);

            if(instance.assetType == 'livestock') {
                instance.data.details.calculatedLSU = instance.data.details.herdSize * instance.getConversionRate();
            }

            instance.data.sections.forEach(function(section, i) {
                section.total = {
                    value: 0
                };

                if(instance.assetType == 'livestock') {
                    section.total.valuePerLSU = 0;
                }

                section.productCategoryGroups.forEach(function(group, j) {
                    group.total = {
                        value: 0
                    };

                    if(instance.assetType == 'livestock') {
                        group.total.valuePerLSU = 0;
                    }

                    group.productCategories.forEach(function(category, k) {
                        if(category.unit == '%') {
                            var groupSum = underscore
                                .chain(instance.data.sections)
                                .filter(function (groupingSection) {
                                    return (groupingSection.costStage === section.costStage);
                                })
                                .pluck('productCategoryGroups')
                                .flatten()
                                .reduce(function(total, group) {
                                    return (group.name == category.incomeGroup && group.total !== undefined ? total + group.total.value : total);
                                }, 0)
                                .value();

                            category.value = roundValue((category.pricePerUnit || 0) * groupSum / 100, 2);
                        } else {
                            category.quantity = (category.unit == 'Total' ? 1 : category.quantity);
                            category.value = roundValue((category.pricePerUnit || 0) * (category.quantity || 0), 2);
                        }

                        if(instance.assetType == 'livestock') {
                            category.valuePerLSU = roundValue((category.pricePerUnit || 0) / instance.getConversionRate(category.name), 2);
                            group.total.valuePerLSU += category.valuePerLSU;
                        }

                        var schedule = (category.schedule && instance.data.schedules[category.schedule] ?
                            instance.data.schedules[category.schedule] :
                            underscore.range(12).map(function () {
                                return 100 / 12;
                            }));

                        category.valuePerMonth = underscore.map(schedule, function (month) {
                            return (month / 100) * category.value;
                        });

                        group.total.value += category.value;
                        group.total.valuePerMonth = (group.total.valuePerMonth ?
                            underscore.map(group.total.valuePerMonth, function (month, i) {
                                return month + category.valuePerMonth[i];
                            }) : angular.copy(category.valuePerMonth));
                    });

                    section.total.value += group.total.value;
                    section.total.valuePerMonth = (section.total.valuePerMonth ?
                        underscore.map(section.total.valuePerMonth, function (month, i) {
                            return month + group.total.valuePerMonth[i];
                        }) : angular.copy(group.total.valuePerMonth));

                    if(instance.assetType == 'livestock') {
                        section.total.valuePerLSU += group.total.valuePerLSU;
                    }
                });
            });

            instance.data.details.grossProfitByStage = underscore.object(EnterpriseBudget.costStages,
                underscore.map(EnterpriseBudget.costStages, function (stage) {
                    return underscore
                        .chain(instance.data.sections)
                        .where({costStage: stage})
                        .reduce(function (total, section) {
                            return (section.code === 'INC' ? total + section.total.value :
                                (section.code === 'EXP' ? total - section.total.value : total));
                        }, 0)
                        .value();
                }));

            instance.data.details.grossProfit = instance.data.details.grossProfitByStage[instance.defaultCostStage];

            if(instance.assetType == 'livestock') {
                instance.data.details.grossProfitPerLSU = instance.data.details.grossProfit / instance.data.details.calculatedLSU;
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