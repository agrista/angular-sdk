var sdkHelperEnterpriseBudgetApp = angular.module('ag.sdk.helper.enterprise-budget', ['ag.sdk.library']);

sdkHelperEnterpriseBudgetApp.factory('enterpriseBudgetHelper', ['underscore', function(underscore) {
    var _listServiceMap = function (item) {
        return {
            id: item.id || item.__id,
            title: item.name,
            subtitle: item.commodityType + (item.region && item.region.properties ? ' in ' + item.region.properties.name : '')
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

    var _groups = {
        'Crop Sales': {
            code: 'INC-CPS',
            name: 'Crop Sales'
        },
        'Fruit Sales': {
            code: 'INC-FRS',
            name: 'Fruit Sales'
        },
        'Harvest': {
            code: 'HVT',
            name: 'Harvest'
        },
        'Preharvest': {
            code: 'HVP',
            name: 'Preharvest'
        },


        'Livestock Sales': {
            code: 'INC-LSS',
            name: 'Livestock Sales'
        },
        'Product Sales': {
            code: 'INC-LSP',
            name: 'Product Sales'
        },
        'Animal Feed': {
            code: 'EXP-AMF',
            name: 'Animal Feed'
        },
        'Husbandry': {
            code: 'HBD',
            name: 'Husbandry'
        },
        'Indirect Costs': {
            code: 'IDR',
            name: 'Indirect Costs'
        },
        'Marketing': {
            code: 'MRK',
            name: 'Marketing'
        },
        'Replacements': {
            code: 'RPM',
            name: 'Replacements'
        }
    };

    var _categories = {
        //*********** Income *********
        // livestock sales
        // Sheep
        'INC-LSS-SLAMB': {
            code: 'INC-LSS-SLAMB',
            name: 'Lamb',
            unit: 'head'
        },
        'INC-LSS-SWEAN': {
            code: 'INC-LSS-SWEAN',
            name: 'Weaner lambs',
            unit: 'head'
        },
        'INC-LSS-SEWE': {
            code: 'INC-LSS-SEWE',
            name: 'Ewe',
            unit: 'head'
        },
        'INC-LSS-SWTH': {
            code: 'INC-LSS-SWTH',
            name: 'Wether (2-tooth plus)',
            unit: 'head'
        },
        'INC-LSS-SRAM': {
            code: 'INC-LSS-SRAM',
            name: 'Ram',
            unit: 'head'
        },

        // Cattle
        'INC-LSS-CCALV':{
            code: 'INC-LSS-CCALV',
            name: 'Calf',
            unit: 'head'
        },
        'INC-LSS-CWEN':{
            code: 'INC-LSS-CWEN',
            name: 'Weaner calves',
            unit: 'head'
        },
        'INC-LSS-CCOW':{
            code: 'INC-LSS-CCOW',
            name: 'Cow or heifer',
            unit: 'head'
        },
        'INC-LSS-CST18':{
            code: 'INC-LSS-CST18',
            name: 'Steer (18 moths plus)',
            unit: 'head'
        },
        'INC-LSS-CST36':{
            code: 'INC-LSS-CST36',
            name: 'Steer (3 years plus)',
            unit: 'head'
        },
        'INC-LSS-CBULL':{
            code: 'INC-LSS-CBULL',
            name: 'Bull (3 years plus)',
            unit: 'head'
        },

        //Goats
        'INC-LSS-GKID':{
            code: 'INC-LSS-GKID',
            name: 'Kid',
            unit: 'head'
        },
        'INC-LSS-GWEAN':{
            code: 'INC-LSS-GWEAN',
            name: 'Weaner kids',
            unit: 'head'
        },
        'INC-LSS-GEWE':{
            code: 'INC-LSS-GEWE',
            name: 'Ewe (2-tooth plus)',
            unit: 'head'
        },
        'INC-LSS-GCAST':{
            code: 'INC-LSS-GCAST',
            name: 'Castrate (2-tooth plus)',
            unit: 'head'
        },
        'INC-LSS-GRAM':{
            code: 'INC-LSS-GRAM',
            name: 'Ram (2-tooth plus)',
            unit: 'head'
        },

        // livestock product sales
        'INC-LSP-MILK': {
            code: 'INC-LSP-MILK',
            name: 'Milk',
            unit: 'l'
        },
        'INC-LSP-WOOL': {
            code: 'INC-LSP-WOOL',
            name: 'Wool',
            unit: 'kg'
        },

        //Crops
        'INC-HVT-CROP': {
            code: 'INC-HVT-CROP',
            name: 'Crop',
            unit: 't'
        },
        //Horticulture (non-perennial)
        'INC-HVT-FRUT': {
            code: 'INC-HVT-FRUT',
            name: 'Fruit',
            unit: 't'
        },
        //*********** Expenses *********
        // Preharvest
        'EXP-HVP-SEED': {
            code: 'EXP-HVP-SEED',
            name: 'Seed',
            unit: 'kg'
        },
        'EXP-HVP-PLTM': {
            code: 'EXP-HVP-PLTM',
            name: 'Plant Material',
            unit: 'each'
        },
        'EXP-HVP-FERT': {
            code: 'EXP-HVP-FERT',
            name: 'Fertiliser',
            unit: 't'
        },
        'EXP-HVP-LIME': {
            code: 'EXP-HVP-LIME',
            name: 'Lime',
            unit: 't'
        },
        'EXP-HVP-HERB': {
            code: 'EXP-HVP-HERB',
            name: 'Herbicides',
            unit: 'l'
        },
        'EXP-HVP-PEST': {
            code: 'EXP-HVP-PEST',
            name: 'Pesticides',
            unit: 'l'
        },
        'EXP-HVP-SPYA': {
            code: 'EXP-HVP-SPYA',
            name: 'Aerial spraying',
            unit: 'ha'
        },
        'EXP-HVP-INSH': {
            code: 'EXP-HVP-INSH',
            name: 'Crop Insurance (Hail)',
            unit: 't'
        },
        'EXP-HVP-INSM': {
            code: 'EXP-HVP-INSM',
            name: 'Crop Insurance (Multiperil)',
            unit: 't'
        },
        'EXP-HVP-HEDG': {
            code: 'EXP-HVP-HEDG',
            name: 'Hedging cost',
            unit: 't'
        },
        //Harvest
        'EXP-HVT-LABC': {
            code: 'EXP-HVT-LABC',
            name: 'Contract work (Harvest)',
            unit: 'ha'
        },
        'EXP-HVT-STOR': {
            code: 'EXP-HVT-STOR',
            name: 'Storage',
            unit: 'days'
        },
        'EXP-HVT-PAKM': {
            code: 'EXP-HVT-PAKM',
            name: 'Packaging material',
            unit: 'each'
        },
        'EXP-HVT-DYCL': {
            code: 'EXP-HVT-DYCL',
            name: 'Drying and cleaning',
            unit: 't'
        },
        'EXP-HVT-PAKC': {
            code: 'EXP-HVT-PAKC',
            name: 'Packing cost',
            unit: 'each'
        },
        //Indirect
        'EXP-IDR-FUEL': {
            code: 'EXP-IDR-FUEL',
            name: 'Fuel',
            unit: 'l'
        },
        'EXP-IDR-REPP': {
            code: 'EXP-IDR-REPP',
            name: 'Repairs & parts',
            unit: 'Total'
        },
        'EXP-IDR-ELEC': {
            code: 'EXP-IDR-ELEC',
            name: 'Electricity',
            unit: 'Total'
        },
        'EXP-IDR-WATR': {
            code: 'EXP-IDR-WATR',
            name: 'Water',
            unit: 'Total'
        },
        'EXP-IDR-LABP': {
            code: 'EXP-IDR-LABP',
            name: 'Permanent labour',
            unit: 'Total'
        },
        'EXP-IDR-SCHED': {
            code: 'EXP-IDR-SCHED',
            name: 'Scheduling',
            unit: 'Total'
        },
        'EXP-IDR-LICS': {
            code: 'EXP-IDR-LICS',
            name: 'License',
            unit: 'Total'
        },
        'EXP-IDR-INSA': {
            code: 'EXP-IDR-INSA',
            name: 'Insurance assets',
            unit: 'Total'
        },
        'EXP-IDR-OTHER': {
            code: 'EXP-IDR-OTHER',
            name: 'Other costs',
            unit: 'Total'
        },
        //Replacements
        // Sheep
        'EXP-RPM-SLAMB': {
            code: 'EXP-RPM-SLAMB',
            name: 'Lamb',
            unit: 'head'
        },
        'EXP-RPM-SWEAN': {
            code: 'EXP-RPM-SWEAN',
            name: 'Weaner lambs',
            unit: 'head'
        },
        'EXP-RPM-SEWE': {
            code: 'EXP-RPM-SEWE',
            name: 'Ewe',
            unit: 'head'
        },
        'EXP-RPM-SWTH': {
            code: 'EXP-RPM-SWTH',
            name: 'Wether (2-tooth plus)',
            unit: 'head'
        },
        'EXP-RPM-SRAM': {
            code: 'EXP-RPM-SRAM',
            name: 'Ram',
            unit: 'head'
        },

        // Cattle
        'EXP-RPM-CCALV':{
            code: 'EXP-RPM-CCALV',
            name: 'Calf',
            unit: 'head'
        },
        'EXP-RPM-CWEN':{
            code: 'EXP-RPM-CWEN',
            name: 'Weaner calves',
            unit: 'head'
        },
        'EXP-RPM-CCOW':{
            code: 'EXP-RPM-CCOW',
            name: 'Cow or heifer',
            unit: 'head'
        },
        'EXP-RPM-CST18':{
            code: 'EXP-RPM-CST18',
            name: 'Steer (18 moths plus)',
            unit: 'head'
        },
        'EXP-RPM-CST36':{
            code: 'EXP-RPM-CST36',
            name: 'Steer (3 years plus)',
            unit: 'head'
        },
        'EXP-RPM-CBULL':{
            code: 'EXP-RPM-CBULL',
            name: 'Bull (3 years plus)',
            unit: 'head'
        },

        //Goats
        'EXP-RPM-GKID':{
            code: 'EXP-RPM-GKID',
            name: 'Kid',
            unit: 'head'
        },
        'EXP-RPM-GWEAN':{
            code: 'EXP-RPM-GWEAN',
            name: 'Weaner kids',
            unit: 'head'
        },
        'EXP-RPM-GEWE':{
            code: 'EXP-RPM-GEWE',
            name: 'Ewe (2-tooth plus)',
            unit: 'head'
        },
        'EXP-RPM-GCAST':{
            code: 'EXP-RPM-GCAST',
            name: 'Castrate (2-tooth plus)',
            unit: 'head'
        },
        'EXP-RPM-GRAM':{
            code: 'EXP-RPM-GRAM',
            name: 'Ram (2-tooth plus)',
            unit: 'head'
        },
        //Animal feed
        'EXP-AMF-LICK': {
            code: 'EXP-AMF-LICK',
            name: 'Lick',
            unit: 'kg'
        },
        //Husbandry
        'EXP-HBD-VACC': {
            code: 'EXP-HBD-VACC',
            name: 'Drenching & vaccination',
            unit: 'head'
        },
        'EXP-HBD-DIPP': {
            code: 'EXP-HBD-DIPP',
            name: 'Dipping & jetting',
            unit: 'head'
        },
        'EXP-HBD-VETY': {
            code: 'EXP-HBD-VETY',
            name: 'Veterinary',
            unit: 'head'
        },
        'EXP-HBD-SHER': {
            code: 'EXP-HBD-SHER',
            name: 'Shearing',
            unit: 'head'
        },
        'EXP-HBD-CRCH': {
            code: 'EXP-HBD-CRCH',
            name: 'Crutching',
            unit: 'head'
        },
        'EXP-MRK-LSSF': {
            code: 'EXP-MRK-LSSF',
            name: 'Livestock sales marketing fees',
            calculationFactor: 'Livestock Sales',
            unit: '%'
        },
        'EXP-MRK-LSPF': {
            code: 'EXP-MRK-LSPF',
            name: 'Livestock products marketing fees',
            calculationFactor: 'Product Sales',
            unit: '%'
        },
        'EXP-MRK-HOTF': {
            code: 'EXP-MRK-HOTF',
            name: 'Horticulture marketing fees',
            calculationFactor: 'Fruit Sales',
            unit: '%'
        },
        'EXP-MRK-CRPF': {
            code: 'EXP-MRK-CRPF',
            name: 'Crop marketing fees',
            calculationFactor: 'Crop Sales',
            unit: '%'
        },
        'EXP-MRK-LSTP': {
            code: 'EXP-MRK-LSTP',
            name: 'Livestock transport',
            unit: 'head'
        },
        'EXP-MRK-HOTT': {
            code: 'EXP-MRK-HOTT',
            name: 'Horticulture transport',
            unit: 't'
        },
        'EXP-MRK-CRPT': {
            code: 'EXP-MRK-CRPT',
            name: 'Crop transport',
            unit: 't'
        }
    };

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
                        _categories['EXP-RPM-GID'],
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
            'Wether (2-tooth plus)': 0.23,
            'Ram (2-tooth plus)': 0.23
        },
        Goats: {
            'Kid': 0.12,
            'Weaner kids': 0.12,
            'Ewe (2-tooth plus)': 0.17,
            'Castrate (2-tooth plus)': 0.17,
            'Ram (2-tooth plus)': 0.12
        }
    };

    var _horticultureStages = {
        'Pears': ['1-7 years', '7-12 years', '12-20 years', '20+ years'],
        'Apples': ['1-7 years', '7-12 years', '12-20 years', '20+ years'],
        'Olives': ['2-3 years', '5-7 years', '9-19 years', '21-25 years', '25+ years'],
        'Pecan nuts': ['1-2 years', '4-5 years', '6-8 years', '8+ years'],
        'Peaches': ['1-2 years', '3-5 years', '5-8 years', '8+ years'],
        'Stone Fruit': ['2-3 years', '5-7 years', '9-19 years', '21-25 years', '25+ years'],
        'Grapes': ['0-1 years', '1-2 years', '2-3 years', '3+ years'],
        'Citrus': ['2-3 years', '5-7 years', '9-19 years', '21-25 years', '25+ years'],
        'Macadamia': ['0-1 years', '2-3 years', '4-6 years', '7-9 years','10+ years']
    }

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
    }

    return {
        listServiceMap: function () {
            return _listServiceMap;
        },
        getRepresentativeAnimal: function(commodityType) {
            return _representativeAnimal[commodityType];
        },
        getConversionRate: function(commodityType) {
            return _conversionRate[commodityType][_representativeAnimal[commodityType]];
        },
        getConversionRates: function(commodityType) {
            return _conversionRate[commodityType];
        },
        getHorticultureStages: function(commodityType) {
            return _horticultureStages[commodityType] || [];
        },
        getCategories: function (budget, assetType, commodityType, sectionType, horticultureStage) {
            var categories = {};

            if(assetType == 'livestock' && _categoryOptions[assetType][commodityType]) {
                categories = angular.copy(_categoryOptions[assetType][commodityType][sectionType]) || {};
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

        validateBudgetData: function (budget) {
            checkBudgetTemplate(budget);
            return this.calculateTotals(budget);
        },
        initNewSections: function (budget, stage) {
            var needNewSections = true;
            budget.data.sections.forEach(function(section, i) {
                if(section.horticultureStage == stage) {
                    needNewSections = false;
                }
            });
            if(needNewSections) {
                var incomeSection = {
                    code: 'INC',
                    horticultureStage: stage,
                    name: "Income",
                    productCategoryGroups: [],
                    total: {
                        value: 0
                    }
                };
                var expensesSection = {
                    code: 'EXP',
                    horticultureStage: stage,
                    name: "Expenses",
                    productCategoryGroups: [],
                    total: {
                        value: 0
                    }
                };
                budget.data.sections.push(incomeSection);
                budget.data.sections.push(expensesSection);
            }
            return budget;
        },
        addCategoryToBudget: function (budget, sectionName, groupName,  categoryCode, horticultureStage) {
            var category = angular.copy(_categories[categoryCode]);
            category.quantity = 0;
            category.pricePerUnit = 0;
            category.value = 0;
            
            if(budget.assetType == 'livestock') {
                category.valuePerLSU = 0;
                if(_conversionRate[budget.commodityType][category.name]) {
                    category.conversionRate = _conversionRate[budget.commodityType][category.name];
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
                budget.data.details.calculatedLSU = budget.data.details.herdSize * _conversionRate[budget.commodityType][_representativeAnimal[budget.commodityType]];
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
                            var groupSum = 0;

                            angular.forEach(budget.data.sections, function(cSection, x) {
                                angular.forEach(cSection.productCategoryGroups, function(cGroup, y) {
                                    if(cGroup.name == category.calculationFactor) {
                                        groupSum = cGroup.total.value;
                                    }
                                });
                            });

                            category.value = category.pricePerUnit * groupSum / 100;

                            if(budget.assetType == 'livestock') {
                                category.valuePerLSU = category.pricePerUnit / _conversionRate[budget.commodityType][category.name];
                            }
                        } else {
                            if(category.unit == 'Total') {
                                category.quantity = 1;
                            }

                            category.value = category.pricePerUnit * category.quantity;

                            if(budget.assetType == 'livestock') {
                                category.valuePerLSU = category.pricePerUnit / _conversionRate[budget.commodityType][category.name];
                            }
                        }

                        group.total.value += category.value;

                        if(budget.assetType == 'livestock') {
                            group.total.valuePerLSU += category.valuePerLSU;
                        }
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

                angular.forEach(_horticultureStages[budget.commodityType], function(stage, i) {
                    var stageIncome = 0;
                    var stageCosts = 0;

                    angular.forEach(budget.data.sections, function(section, j) {
                        if(section.horticultureStage == stage && section.name == 'Income') {
                            stageIncome = section.total.value;
                        }
                        if(section.horticultureStage == stage && section.name == 'Expenses') {
                            stageCosts = section.total.value;
                        }
                    });

                    budget.data.details.grossProfitByStage[stage] = stageIncome - stageCosts;
                });
            }

            if(budget.assetType == 'livestock') {
                budget.data.details.grossProfitPerLSU = budget.data.details.grossProfit / budget.data.details.calculatedLSU;
            }

            return budget;
        }
    }
}]);