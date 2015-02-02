var sdkHelperEnterpriseBudgetApp = angular.module('ag.sdk.helper.enterprise-budget', ['ag.sdk.library']);

sdkHelperEnterpriseBudgetApp.factory('enterpriseBudgetHelper', ['underscore', function(underscore) {
    var _listServiceMap = function (item) {
        return {
            id: item.id || item.__id,
            title: item.name,
            subtitle: item.commodityType + (item.regionName? ' in ' + item.regionName : ''),
            status: (item.published ? {text: 'published', label: 'label-success'} : false)
        }
    };

    var _modelTypes = {
        crop: 'Field Crop',
        livestock: 'Livestock',
        horticulture: 'Horticulture'
    };

    var _sections = {
        expenses: {
            code: 'EXP',
            name: 'Expenses'
        },
        income: {
            code: 'INC',
            name: 'Income'
        }
    };

    var _groups = underscore.indexBy([
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
    ], 'name');

    var _categories = underscore.indexBy([
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
            name: 'Steer (18 moths plus)',
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
    ], 'code');

    // todo: extend the categories with products for future features.
//    var _productsMap = {
//        'INC-PDS-MILK': {
//            code: 'INC-PDS-MILK-M13',
//            name: 'Cow Milk',
//            unit: 'l'
//        }
//    }

    var _categoryOptions = {
        crop: {
            income: {
                'Crop Sales': [
                    _categories['INC-HVT-CROP']
                ]
            },
            expenses: {
                'Preharvest': [
                    _categories['EXP-HVP-SEED'],
                    _categories['EXP-HVP-FERT'],
                    _categories['EXP-HVP-LIME'],
                    _categories['EXP-HVP-HERB'],
                    _categories['EXP-HVP-PEST'],
                    _categories['EXP-HVP-SPYA'],
                    _categories['EXP-HVP-INSH'],
                    _categories['EXP-HVP-INSM'],
                    _categories['EXP-HVP-HEDG']
                ],
                'Harvest': [
                    _categories['EXP-HVT-LABC']
                ],
                'Marketing': [
                    _categories['EXP-MRK-CRPF'],
                    _categories['EXP-MRK-CRPT']
                ],
                'Indirect Costs': [
                    _categories['EXP-IDR-FUEL'],
                    _categories['EXP-IDR-REPP'],
                    _categories['EXP-IDR-ELEC'],
                    _categories['EXP-IDR-WATR'],
                    _categories['EXP-IDR-LABP'],
                    _categories['EXP-IDR-SCHED'],
                    _categories['EXP-IDR-OTHER']
                ]
            }
        },
        horticulture: {
            income: {
                'Fruit Sales': [
                    _categories['INC-HVT-FRUT']
                ]
            },
            expenses: {
                'Preharvest': [
                    _categories['EXP-HVP-PLTM'],
                    _categories['EXP-HVP-FERT'],
                    _categories['EXP-HVP-LIME'],
                    _categories['EXP-HVP-HERB'],
                    _categories['EXP-HVP-PEST'],
                    _categories['EXP-HVP-SPYA'],
                    _categories['EXP-HVP-INSH'],
                    _categories['EXP-HVP-INSM']
                ],
                'Harvest': [
                    _categories['EXP-HVT-LABC'],
                    _categories['EXP-HVT-STOR'],
                    _categories['EXP-HVT-PAKM'],
                    _categories['EXP-HVT-DYCL'],
                    _categories['EXP-HVT-PAKC']
                ],
                'Marketing': [
                    _categories['EXP-MRK-HOTF'],
                    _categories['EXP-MRK-HOTT']
                ],
                'Indirect Costs': [
                    _categories['EXP-IDR-FUEL'],
                    _categories['EXP-IDR-REPP'],
                    _categories['EXP-IDR-ELEC'],
                    _categories['EXP-IDR-WATR'],
                    _categories['EXP-IDR-LABP'],
                    _categories['EXP-IDR-SCHED'],
                    _categories['EXP-IDR-LICS'],
                    _categories['EXP-IDR-INSA'],
                    _categories['EXP-IDR-OTHER']
                ]
            }
        },
        livestock: {
            Cattle: {
                income: {
                    'Livestock Sales': [
                        _categories['INC-LSS-CCALV'],
                        _categories['INC-LSS-CWEN'],
                        _categories['INC-LSS-CCOW'],
                        _categories['INC-LSS-CST18'],
                        _categories['INC-LSS-CST36'],
                        _categories['INC-LSS-CBULL']
                    ],
                    'Product Sales': [
                        _categories['INC-LSP-MILK']
                    ]
                },
                expenses: {
                    'Replacements': [
                        _categories['EXP-RPM-CCALV'],
                        _categories['EXP-RPM-CWEN'],
                        _categories['EXP-RPM-CCOW'],
                        _categories['EXP-RPM-CST18'],
                        _categories['EXP-RPM-CST36'],
                        _categories['EXP-RPM-CBULL']
                    ],
                    'Animal Feed': [
                        _categories['EXP-AMF-LICK']
                    ],
                    'Husbandry': [
                        _categories['EXP-HBD-VACC'],
                        _categories['EXP-HBD-DIPP'],
                        _categories['EXP-HBD-VETY']
                    ],
                    'Marketing': [
                        _categories['EXP-MRK-LSSF'],
                        _categories['EXP-MRK-LSPF'],
                        _categories['EXP-MRK-LSTP']
                    ],
                    'Indirect Costs': [
                        _categories['EXP-IDR-FUEL'],
                        _categories['EXP-IDR-REPP'],
                        _categories['EXP-IDR-ELEC'],
                        _categories['EXP-IDR-WATR'],
                        _categories['EXP-IDR-LABP'],
                        _categories['EXP-IDR-LICS'],
                        _categories['EXP-IDR-INSA'],
                        _categories['EXP-IDR-OTHER']
                    ]
                }
            },
            Goats: {
                income: {
                    'Livestock Sales': [
                        _categories['INC-LSS-GKID'],
                        _categories['INC-LSS-GWEAN'],
                        _categories['INC-LSS-GEWE'],
                        _categories['INC-LSS-GCAST'],
                        _categories['INC-LSS-GRAM']
                    ],
                    'Product Sales': [
                        _categories['INC-LSP-WOOL'],
                        _categories['INC-LSP-MILK']
                    ]
                },
                expenses: {
                    'Replacements': [
                        _categories['EXP-RPM-GKID'],
                        _categories['EXP-RPM-GWEAN'],
                        _categories['EXP-RPM-GEWE'],
                        _categories['EXP-RPM-GCAST'],
                        _categories['EXP-RPM-GRAM']
                    ],
                    'Animal Feed': [
                        _categories['EXP-AMF-LICK']
                    ],
                    'Husbandry': [
                        _categories['EXP-HBD-VACC'],
                        _categories['EXP-HBD-DIPP'],
                        _categories['EXP-HBD-VETY'],
                        _categories['EXP-HBD-SHER'],
                        _categories['EXP-HBD-CRCH']
                    ],
                    'Marketing': [
                        _categories['EXP-MRK-LSSF'],
                        _categories['EXP-MRK-LSPF'],
                        _categories['EXP-MRK-LSTP']
                    ],
                    'Indirect Costs': [
                        _categories['EXP-IDR-FUEL'],
                        _categories['EXP-IDR-REPP'],
                        _categories['EXP-IDR-ELEC'],
                        _categories['EXP-IDR-WATR'],
                        _categories['EXP-IDR-LABP'],
                        _categories['EXP-IDR-LICS'],
                        _categories['EXP-IDR-INSA'],
                        _categories['EXP-IDR-OTHER']
                    ]
                }
            },
            Sheep: {
                income: {
                    'Livestock Sales': [
                        _categories['INC-LSS-SLAMB'],
                        _categories['INC-LSS-SWEAN'],
                        _categories['INC-LSS-SEWE'],
                        _categories['INC-LSS-SWTH'],
                        _categories['INC-LSS-SRAM']
                    ],
                    'Product Sales': [
                        _categories['INC-LSP-WOOL'],
                        _categories['INC-LSP-MILK']
                    ]
                },
                expenses: {
                    'Replacements': [
                        _categories['EXP-RPM-SLAMB'],
                        _categories['EXP-RPM-SWEAN'],
                        _categories['EXP-RPM-SEWE'],
                        _categories['EXP-RPM-SWTH'],
                        _categories['EXP-RPM-SRAM']
                    ],
                    'Animal Feed': [
                        _categories['EXP-AMF-LICK']
                    ],
                    'Husbandry': [
                        _categories['EXP-HBD-VACC'],
                        _categories['EXP-HBD-DIPP'],
                        _categories['EXP-HBD-VETY'],
                        _categories['EXP-HBD-SHER'],
                        _categories['EXP-HBD-CRCH']
                    ],
                    'Marketing': [
                        _categories['EXP-MRK-LSSF'],
                        _categories['EXP-MRK-LSPF'],
                        _categories['EXP-MRK-LSTP']
                    ],
                    'Indirect Costs': [
                        _categories['EXP-IDR-FUEL'],
                        _categories['EXP-IDR-REPP'],
                        _categories['EXP-IDR-ELEC'],
                        _categories['EXP-IDR-WATR'],
                        _categories['EXP-IDR-LABP'],
                        _categories['EXP-IDR-LICS'],
                        _categories['EXP-IDR-INSA'],
                        _categories['EXP-IDR-OTHER']
                    ]
                }
            }
        }
    };

    var _representativeAnimal = {
        Cattle: 'Cow or heifer',
        Sheep: 'Ewe',
        Goats: 'Ewe (2-tooth plus)'
    };

    var _baseAnimal = {
        'Cattle (Extensive)': 'Cattle',
        'Cattle (Feedlot)': 'Cattle',
        'Cattle (Stud)': 'Cattle',
        'Sheep (Extensive)': 'Sheep',
        'Sheep (Feedlot)': 'Sheep',
        'Sheep (Stud)': 'Sheep'
    };

    var _conversionRate = {
        Cattle: {
            'Calf': 0.32,
            'Weaner calves': 0.44,
            'Cow or heifer': 1.1,
            'Steer (18  months plus)': 0.75,
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

    var _commodityTypes = {
        crop: 'Field Crops',
        horticulture: 'Horticulture',
        livestock: 'Livestock'
    };

    // When updating, also update the _enterpriseTypes list in the legalEntityHelper (farmerHelperModule.js)
    var _commodities = {
        crop: ['Barley', 'Bean (Dry)', 'Bean (Green)', 'Canola', 'Cotton', 'Cowpea', 'Grain Sorghum', 'Groundnut', 'Lucerne', 'Maize (Fodder)', 'Maize (Green)', 'Maize (Seed)', 'Maize (White)', 'Maize (Yellow)', 'Oats', 'Potato', 'Rye', 'Soya Bean', 'Sunflower', 'Sweet Corn', 'Tobacco', 'Triticale', 'Wheat'],
        horticulture: ['Almond', 'Apple', 'Apricot', 'Avocado', 'Banana', 'Blueberry', 'Cherry', 'Chicory', 'Chili', 'Citrus (Hardpeel)', 'Citrus (Softpeel)', 'Coffee', 'Fig', 'Garlic', 'Grape (Table)', 'Grape (Wine)', 'Guava', 'Hops', 'Kiwi', 'Lemon', 'Lentil', 'Macadamia Nut', 'Mango', 'Melon', 'Nectarine', 'Olive', 'Onion', 'Orange', 'Papaya', 'Pea', 'Peach', 'Peanut', 'Pear', 'Pecan Nut', 'Persimmon', 'Pineapple', 'Pistachio Nut', 'Plum', 'Pomegranate', 'Prune', 'Pumpkin', 'Quince', 'Rooibos', 'Strawberry', 'Sugarcane', 'Tomato', 'Watermelon'],
        livestock: ['Cattle (Extensive)', 'Cattle (Feedlot)', 'Cattle (Stud)', 'Chicken (Broilers)', 'Chicken (Layers)', 'Dairy', 'Game', 'Goats', 'Horses', 'Ostrich', 'Pigs', 'Sheep (Extensive)', 'Sheep (Feedlot)', 'Sheep (Stud)']
};

    var _horticultureStages = {
        'Apple': ['0-3 years', '3-10 years', '10-15 years', '15-25 years', '25+ years'],
        'Apricot': ['0-2 years', '2-5 years', '5-15 years', '15-18 years', '18+ years'],
        'Avocado': ['0-1 years', '1-3 years', '3-5 years', '5-8 years', '8+ years'],
        'Blueberry': ['0-1 years', '1-3 years', '3-5 years', '5-8 years', '8+ years'],
        'Citrus (Hardpeel)': ['0-1 years', '1-4 years', '4-8 years', '8-20 years', '20-25 years', '25+ years'],
        'Citrus (Softpeel)': ['0-1 years', '1-4 years', '4-8 years', '8-20 years', '20-25 years', '25+ years'],
        'Fig': ['0-1 years', '1-3 years', '3-6 years', '6-18 years', '18-30 years', '30+ years'],
        'Grape (Table)': ['0-3 years', '3-10 years', '10-15 years', '15-25 years', '25+ years'],
        'Grape (Wine)': ['0-3 years', '3-10 years', '10-15 years', '15-25 years', '25+ years'],
        'Macadamia Nut': ['0-1 years', '1-3 years', '3-6 years', '6-9 years','10+ years'],
        'Mango': ['0-1 years', '1-3 years', '3-5 years', '5-18 years', '18-30 years', '30+ years'],
        'Nectarine': ['0-2 years', '2-5 years', '5-15 years', '15-18 years', '18+ years'],
        'Olive': ['0-1 years', '1-3 years', '3-5 years', '5-10 years', '10+ years'],
        'Orange': ['0-1 years', '1-4 years', '4-8 years', '8-20 years', '20-25 years', '25+ years'],
        'Pecan Nut': ['0-1 years', '1-3 years', '3-7 years', '7-10 years', '10+ years'],
        'Peach': ['0-2 years', '2-5 years', '5-15 years', '15-18 years', '18+ years'],
        'Pear': ['0-3 years', '3-10 years', '10-15 years', '15-25 years', '25+ years'],
        'Persimmon': ['0-1 years', '1-4 years', '4-12 years', '12-20 years', '20+ years'],
        'Plum': ['0-2 years', '2-5 years', '5-15 years', '15-18 years', '18+ years'],
        'Pomegranate': ['0-1 years', '1-3 years', '3-5 years', '5-18 years', '18-30 years', '30+ years'],
        'Rooibos': ['0-1 years', '1-2 years', '2-4 years', '4-5 years', '5+ years']
    };

    /*
     * Extended Budgets
     */
    var _cycleMonths = [
        {
            id: 0,
            name: 'January',
            shortname: 'Jan'
        }, {
            id: 1,
            name: 'February',
            shortname: 'Feb'
        }, {
            id: 2,
            name: 'March',
            shortname: 'Mar'
        }, {
            id: 3,
            name: 'April',
            shortname: 'Apr'
        }, {
            id: 4,
            name: 'May',
            shortname: 'May'
        }, {
            id: 5,
            name: 'June',
            shortname: 'Jun'
        }, {
            id: 6,
            name: 'July',
            shortname: 'Jul'
        }, {
            id: 7,
            name: 'August',
            shortname: 'Aug'
        }, {
            id: 8,
            name: 'September',
            shortname: 'Sep'
        }, {
            id: 9,
            name: 'October',
            shortname: 'Oct'
        }, {
            id: 10,
            name: 'November',
            shortname: 'Nov'
        }, {
            id: 11,
            name: 'December',
            shortname: 'Dec'
        }];

    var _productsMap = {
        'INC-PDS-MILK': {
            code: 'INC-PDS-MILK-M13',
            name: 'Cow Milk',
            unit: 'Litre'
        }
    };

    function checkBudgetTemplate (budget) {
        budget.data = budget.data || {};
        budget.data.details = budget.data.details || {};
        budget.data.sections = budget.data.sections || [];
        budget.data.schedules = budget.data.schedules || {
            Monthly: [true, true, true, true, true, true, true, true, true, true, true, true]
        };
    }

    function getBaseAnimal (commodityType) {
        return _baseAnimal[commodityType] || commodityType;
    }

    function checkBudgetSection (budget, stage) {
        angular.forEach(['income', 'expenses'], function (section) {
            var foundSection = underscore.findWhere(budget.data.sections,
                (stage === undefined ? {code: _sections[section].code} : {code: _sections[section].code, horticultureStage: stage}));

            if (foundSection === undefined) {
                foundSection = {
                    code: _sections[section].code,
                    name: _sections[section].name,
                    productCategoryGroups: [],
                    total: {
                        value: 0
                    }
                };

                if (stage !== undefined) {
                    foundSection.horticultureStage = stage;
                }

                budget.data.sections.push(foundSection);
            }
        });

        return budget;
    }

    return {
        listServiceMap: function () {
            return _listServiceMap;
        },
        commodityTypes: function() {
            return _commodityTypes;
        },
        commodities: function() {
            return _commodities;
        },
        cycleMonths: function () {
            return _cycleMonths;
        },
        getRepresentativeAnimal: function(commodityType) {
            return _representativeAnimal[getBaseAnimal(commodityType)];
        },
        getConversionRate: function(commodityType) {
            return _conversionRate[getBaseAnimal(commodityType)][_representativeAnimal[getBaseAnimal(commodityType)]];
        },
        getConversionRates: function(commodityType) {
            return _conversionRate[getBaseAnimal(commodityType)];
        },
        getCommodities: function (type) {
            return _commodities[type] || '';
        },
        getHorticultureStages: function(commodityType) {
            return _horticultureStages[commodityType] || [];
        },
        getHorticultureStage: function (commodityType, asset) {
            var stages = this.getHorticultureStages(commodityType),
                result = (stages.length > 0 ? stages[0] : undefined);

            if (asset && asset.data.establishedDate) {
                var assetAge = moment().diff(asset.data.establishedDate, 'years', true);

                angular.forEach(stages, function (stage) {
                    var matchYears = stage.match(/\d+/g);

                    if ((matchYears.length == 1 && matchYears[0] <= assetAge) || (matchYears.length == 2 && matchYears[0] <= assetAge && matchYears[1] >= assetAge)) {
                        result = stage;
                    }
                });
            }

            return result;
        },
        getCategories: function (budget, assetType, commodityType, sectionType, horticultureStage) {
            var categories = {};

            if(assetType == 'livestock' && _categoryOptions[assetType][getBaseAnimal(commodityType)]) {
                categories = angular.copy(_categoryOptions[assetType][getBaseAnimal(commodityType)][sectionType]) || {};
            }

            if(assetType == 'crop' && _categoryOptions[assetType][sectionType]) {
                categories = angular.copy(_categoryOptions[assetType][sectionType]) || {};
            }

            if(assetType == 'horticulture' && _categoryOptions[assetType][sectionType]) {
                categories = angular.copy(_categoryOptions[assetType][sectionType]) || {};
            }

            // remove the income / expense items which exists in the budget, from the categories
            angular.forEach(budget.data.sections, function(section, i) {
                if(section.name.toLowerCase().indexOf(sectionType) > -1) {
                    if(budget.assetType != 'horticulture' || (budget.assetType == 'horticulture' && section.horticultureStage == horticultureStage)) {
                        angular.forEach(section.productCategoryGroups, function(group, j) {
                            angular.forEach(group.productCategories, function(category, k) {
                                angular.forEach(categories[group.name], function(option, l) {
                                    if(option.code == category.code) {
                                        categories[group.name].splice(l, 1);
                                    }
                                });
                            });
                        });
                    }
                }
            });

            var result = [];

            for(var label in categories) {
                categories[label].forEach(function(option, i) {
                    option.groupBy = label;
                    result.push(option);
                });
            }

            return result;
        },
        getModelType: function (type) {
            return _modelTypes[type] || '';
        },

        validateBudgetData: function (budget, stage) {
            checkBudgetTemplate(budget);
            checkBudgetSection(budget, stage);
            return this.calculateTotals(budget);
        },
        initNewSections: function (budget, stage) {
            return checkBudgetSection(budget, stage);
        },
        addCategoryToBudget: function (budget, sectionName, groupName,  categoryCode, horticultureStage) {
            var category = angular.copy(_categories[categoryCode]);
            category.quantity = 0;
            category.pricePerUnit = 0;
            category.value = 0;

            if(budget.assetType == 'livestock') {
                category.valuePerLSU = 0;
                if(_conversionRate[getBaseAnimal(budget.commodityType)][category.name]) {
                    category.conversionRate = _conversionRate[getBaseAnimal(budget.commodityType)][category.name];
                }
            }

            var noSuchSection = true;
            var noSuchGroup = true;
            var sectionIndex = -1;
            var groupIndex = -1;
            var targetSection = angular.copy(_sections[sectionName]);
            var targetGroup = angular.copy(_groups[groupName]);

            targetSection.productCategoryGroups = [];
            targetGroup.productCategories = [];

            angular.forEach(budget.data.sections, function(section, i) {
                if((budget.assetType != 'horticulture' && section.name == targetSection.name) || (budget.assetType == 'horticulture' && section.name == targetSection.name && section.horticultureStage == horticultureStage)) {
                    noSuchSection = false;
                    sectionIndex = i;
                    targetSection = section;
                    section.productCategoryGroups.forEach(function(group, j) {
                        if(group.name == groupName) {
                            noSuchGroup = false;
                            groupIndex = j;
                            targetGroup = group;
                        }
                    });
                }
            });

            // add new section and/or new group
            if(noSuchSection) {
                if(budget.assetType == 'horticulture' && horticultureStage) {
                    targetSection.horticultureStage = horticultureStage;
                }

                budget.data.sections.push(targetSection);
                sectionIndex = budget.data.sections.length - 1;
            }

            if(noSuchGroup) {
                budget.data.sections[sectionIndex].productCategoryGroups.push(targetGroup);
                groupIndex = budget.data.sections[sectionIndex].productCategoryGroups.length - 1;
            }

            budget.data.sections[sectionIndex].productCategoryGroups[groupIndex].productCategories.push(category);

            return budget;
        },
        calculateTotals: function (budget) {
            checkBudgetTemplate(budget);

            if(budget.assetType == 'livestock') {
                budget.data.details.calculatedLSU = budget.data.details.herdSize *
                    _conversionRate[getBaseAnimal(budget.commodityType)][_representativeAnimal[getBaseAnimal(budget.commodityType)]];
            }

            var income = 0;
            var costs = 0;
            budget.data.sections.forEach(function(section, i) {
                section.total = {
                    value: 0
                };

                if(budget.assetType == 'livestock') {
                    section.total.valuePerLSU = 0;
                }

                section.productCategoryGroups.forEach(function(group, j) {
                    group.total = {
                        value: 0
                    };

                    if(budget.assetType == 'livestock') {
                        group.total.valuePerLSU = 0;
                    }

                    group.productCategories.forEach(function(category, k) {
                        if(category.unit == '%') {
                            var groupSum = underscore
                                .chain(budget.data.sections)
                                .pluck('productCategoryGroups')
                                .flatten()
                                .reduce(function(total, group) {
                                    return (group.name == category.incomeGroup && group.total !== undefined ? total + group.total.value : total);
                                }, 0)
                                .value();

                            category.value = (category.pricePerUnit || 0) * groupSum / 100;
                        } else {
                            category.quantity = (category.unit == 'Total' ? 1 : category.quantity);
                            category.value = (category.pricePerUnit || 0) * (category.quantity || 0);
                        }

                        if (category.schedule !== undefined && budget.data.schedules[category.schedule] !== undefined) {
                            var schedule = budget.data.schedules[category.schedule];
                            var valuePerMonth = category.value / underscore.reduce(schedule, function (total, value) {
                                return (value ? total + 1 : total);
                            }, 0);

                            category.valuePerMonth = underscore.map(schedule, function (value) {
                                return (value ? valuePerMonth : 0);
                            });
                        } else {
                            delete category.valuePerMonth;
                        }

                        if(budget.assetType == 'livestock') {
                            category.valuePerLSU = (category.pricePerUnit || 0) / _conversionRate[getBaseAnimal(budget.commodityType)][category.name];
                            group.total.valuePerLSU += category.valuePerLSU;
                        }

                        group.total.value += category.value;
                    });

                    section.total.value += group.total.value;

                    if(budget.assetType == 'livestock') {
                        section.total.valuePerLSU += group.total.valuePerLSU;
                    }
                });

                if(section.name == 'Income') {
                    income = section.total.value;
                } else {
                    costs += section.total.value;
                }
            });

            budget.data.details.grossProfit = income - costs;

            if(budget.assetType == 'horticulture') {
                budget.data.details.grossProfitByStage = {};

                angular.forEach(_horticultureStages[budget.commodityType], function(stage) {
                    budget.data.details.grossProfitByStage[stage] = underscore
                        .chain(budget.data.sections)
                        .where({horticultureStage: stage})
                        .reduce(function (total, section) {
                            return (section.name === 'Income' ? total + section.total.value :
                                (section.name === 'Expenses' ? total - section.total.value : total));
                        }, 0)
                        .value();
                });
            }

            if(budget.assetType == 'livestock') {
                budget.data.details.grossProfitPerLSU = budget.data.details.grossProfit / budget.data.details.calculatedLSU;
            }

            return budget;
        }
    }
}]);