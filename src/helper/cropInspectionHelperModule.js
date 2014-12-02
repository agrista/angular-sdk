var sdkHelperCropInspectionApp = angular.module('ag.sdk.helper.crop-inspection', ['ag.sdk.helper.document', 'ag.sdk.library']);

sdkHelperCropInspectionApp.factory('cropInspectionHelper', ['documentHelper', 'underscore', function(documentHelper, underscore) {
    var _approvalTypes = ['Approved', 'Not Approved', 'Not Planted'];

    var _commentTypes = ['Crop amendment', 'Crop re-plant', 'Insurance coverage discontinued', 'Multi-insured', 'Other', 'Without prejudice', 'Wrongfully reported'];

    var _growthStageTable = [
        ['V0', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9', 'V10', 'V11', 'V12', 'V13', 'V14', 'V15', 'V16', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8', 'R9', 'R10', 'R11', 'R12', 'R13', 'R14'],
        ['V0', 'V1', 'V2', 'V3', 'V4', 'V5', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6'],
        ['V0', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9', 'V10', 'V11', 'V12', 'V13', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8', 'R9'],
        ['V0', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9', 'V10', 'V11', 'V12', 'V13', 'V14', 'V15', 'V16', 'V17', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8', 'R9', 'R10', 'R11', 'R12'],
        ['V0', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9', 'V10', 'V11', 'V12', 'V13', 'V14', 'V15', 'V16', 'V17', 'V18', 'V19', 'V20', 'V21', 'V22', 'V23', 'V24', 'V25', 'V26', 'V27', 'V28', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8'],
        ['V0', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8', 'R9'],
        ['V0', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8', 'R9', 'R10', 'R11', 'R12', 'R13', 'R14', 'R15', 'R16', 'R17', 'R18'],
        ['V0', 'V1', 'V2', 'V3', 'V4', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6'],
        ['V0', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6']
    ];

    var _growthStageCrops = {
        'Barley': _growthStageTable[1],
        'Bean': _growthStageTable[5],
        'Bean (Broad)': _growthStageTable[5],
        'Bean (Dry)': _growthStageTable[5],
        'Bean (Sugar)': _growthStageTable[5],
        'Bean (Green)': _growthStageTable[5],
        'Bean (Kidney)': _growthStageTable[5],
        'Canola': _growthStageTable[7],
        'Cotton': _growthStageTable[6],
        'Grain Sorghum': _growthStageTable[3],
        'Maize': _growthStageTable[0],
        'Maize (White)': _growthStageTable[0],
        'Maize (Yellow)': _growthStageTable[0],
        'Soya Bean': _growthStageTable[2],
        'Sunflower': _growthStageTable[4],
        'Wheat': _growthStageTable[1],
        'Wheat (Durum)': _growthStageTable[1]
    };

    var _inspectionTypes = {
        'emergence inspection': 'Emergence Inspection',
        'hail inspection': 'Hail Inspection',
        'harvest inspection': 'Harvest Inspection',
        'preharvest inspection': 'Pre Harvest Inspection',
        'progress inspection': 'Progress Inspection'
    };

    var _moistureStatusTypes = ['Dry', 'Moist', 'Wet'];

    var _seedTypeTable = [
        ['Maize Commodity', 'Maize Hybrid', 'Maize Silo Fodder']
    ];

    var _seedTypes = {
        'Maize': _seedTypeTable[0],
        'Maize (White)': _seedTypeTable[0],
        'Maize (Yellow)': _seedTypeTable[0]
    };

    var _policyTypes = ['Hail', 'Multi Peril'];

    var _policyInspections = {
        'Hail': ['hail inspection'],
        'Multi Peril': underscore.keys(_inspectionTypes)
    };

    var _problemTypes = {
        disease: 'Disease',
        fading: 'Fading',
        uneven: 'Uneven',
        other: 'Other',
        root: 'Root',
        shortage: 'Shortage',
        weed: 'Weed'
    };

    var _flowerTypes = {
        'Dry Bean': 'pod',
        'Grain Sorghum': 'panicle',
        'Maize (White)': 'ear',
        'Maize (Yellow)': 'ear',
        'Sunflower': 'flower',
        'Wheat': 'spikelet',
        'Soya Bean': 'pod'
    };

    return {
        approvalTypes: function () {
            return _approvalTypes;
        },
        commentTypes: function () {
            return _commentTypes;
        },
        inspectionTitles: function () {
            return _inspectionTypes;
        },
        inspectionTypes: function () {
            return underscore.keys(_inspectionTypes);
        },
        moistureStatusTypes: function () {
            return _moistureStatusTypes;
        },
        policyTypes: function () {
            return _policyTypes;
        },
        policyInspectionTypes: function (policyType) {
            return _policyInspections[policyType] || [];
        },
        problemTypes: function () {
            return _problemTypes;
        },

        getFlowerType: function (crop) {
            return _flowerTypes[crop] || '';
        },
        getGrowthStages: function (crop) {
            return _growthStageCrops[crop] || _growthStageTable[0];
        },
        getSeedTypes:function (crop) {
            return _seedTypes[crop];
        },
        getInspectionTitle: function (type) {
            return _inspectionTypes[type] || '';
        },
        getProblemTitle: function (type) {
            return _problemTypes[type] || '';
        },
        getSampleArea: function (asset, zone) {
            return (_flowerTypes[asset.data.crop] === 'spikelet' ?
                (zone && zone.plantedInRows === true ? '3m' : 'm²') :
                (_flowerTypes[asset.data.crop] === 'pod' ? '3m' : '10m'));
        },

        hasSeedTypes: function (crop) {
            return _seedTypes[crop] !== undefined;
        },

        calculateProgressYield: function (asset, samples, pitWeight, realization) {
            pitWeight = pitWeight || 0;
            realization = (realization === undefined ? 100 : realization);

            var reduceSamples = function (samples, prop) {
                return (underscore.reduce(samples, function (total, sample) {
                    return (sample[prop] ? total + sample[prop] : total);
                }, 0) / samples.length) || 0
            };

            var zoneYields = underscore.map(asset.data.zones, function (zone, index) {
                var zoneSamples = underscore.where(samples, {zone: index});
                var total = {
                    coverage: (zone.size / asset.data.plantedArea),
                    heads: reduceSamples(zoneSamples, 'heads'),
                    weight: reduceSamples(zoneSamples, 'weight')
                };

                if (_flowerTypes[asset.data.crop] === 'spikelet') {
                    total.yield = (total.weight * total.heads) / ((asset.data.irrigated ? 3000 : 3500) * (zone.plantedInRows ? zone.rowWidth * 3 : 1));
                } else if (_flowerTypes[asset.data.crop] === 'pod') {
                    total.pods = reduceSamples(zoneSamples, 'pods');
                    total.seeds = reduceSamples(zoneSamples, 'seeds');
                    total.yield = (pitWeight * total.seeds * total.pods * total.heads) / (zone.rowWidth * 300);
                } else {
                    total.yield = (total.weight * total.heads) / (zone.rowWidth * 1000);
                }

                total.yield *= (realization / 100);

                return total;
            });

            return {
                zones: zoneYields,
                yield: underscore.reduce(zoneYields, function (total, item) {
                    return total + (item.coverage * item.yield);
                }, 0)
            };
        }
    }
}]);

sdkHelperCropInspectionApp.factory('cultivarHelper', ['underscore', function (underscore) {
    var _providerCultivars = {
        'Barley': {
            'Agricol': [
                'Other',
                'SKG 9',
                'SVG 13'
            ],
            'Other': [
                'Clipper',
                'Cocktail',
                'Other',
                'Puma',
                'SabbiErica',
                'SabbiNemesia',
                'SSG 564',
                'SSG 585'
            ]
        },
        'Bean (Dry)': {
            'Capstone': [
                'CAP 2000',
                'CAP 2001',
                'CAP 2008',
                'Other'
            ],
            'Dry Bean Seed Pty (Ltd)': [
                'DBS 310',
                'DBS 360',
                'DBS 830',
                'DBS 840',
                'Kranskop HR1',
                'OPS RS1',
                'OPS RS2',
                'OPS RS4',
                'OPS-KW1',
                'Other',
                'RS 5',
                'RS 6',
                'RS 7'
            ],
            'Pannar': [
                'Other',
                'PAN 116',
                'PAN 123',
                'PAN 128',
                'PAN 135',
                'PAN 139',
                'PAN 146',
                'PAN 148',
                'PAN 148 Plus',
                'PAN 9213',
                'PAN 9216',
                'PAN 9225',
                'PAN 9249',
                'PAN 9280',
                'PAN 9281',
                'PAN 9292',
                'PAN 9298'
            ],
            'Other': [
                'AFG 470',
                'AFG 471',
                'BONUS',
                'CALEDON',
                'CARDINAL',
                'CERRILLOS',
                'DONGARA',
                'DPO 820',
                'JENNY',
                'KAMIESBERG',
                'KOMATI',
                'KRANSKOP',
                'MAJUBA',
                'MASKAM',
                'MINERVA',
                'MKONDENI',
                'MKUZI',
                'Other',
                'RUBY',
                'SC Silk',
                'SC Superior',
                'SEDERBERG',
                'SSB 20',
                'STORMBERG',
                'TEEBUS',
                'TEEBUS-RCR2',
                'TEEBUS-RR1',
                'TYGERBERG',
                'UKULINGA',
                'UMTATA',
                'WERNA'
            ]
        },
        'Canola': {
            'Agricol': [
                'Aga Max',
                'AV Garnet',
                'CB Jardee HT',
                'Cobbler',
                'Other',
                'Tawriffic'
            ],
            'Klein Karoo': [
                'Hyola 61',
                'Other',
                'Rocket CL',
                'Thunder TT',
                'Varola 54'
            ],
            'Other': [
                'Other'
            ]
        },
        'Grain Sorghum': {
            'Agricol': [
                'AVENGER GH',
                'DOMINATOR GM',
                'ENFORCER GM',
                'MAXIMIZER',
                'Other',
                'PREMIUM 4065 T GH',
                'PREMIUM 100',
                'NS 5511 GH',
                'NS 5540',
                'NS 5555',
                'NS 5655 GM',
                'NS 5751',
                'NS 5832',
                'TIGER GM'
            ],
            'Capstone': [
                'CAP 1002',
                'CAP 1003',
                'CAP 1004',
                'Other'
            ],
            'Klein Karoo Saad': [
                'MR 32 GL',
                'MR 43 GL',
                'MR BUSTER GL',
                'MR PACER',
                'Other'
            ],
            'Pannar': [
                'PAN 8625 GH',
                'PAN 8816 GM',
                'PAN 8906 GM',
                'PAN 8909 GM',
                'PAN 8006 T',
                'PAN 8507',
                'PAN 8609',
                'PAN 8648',
                'PAN 8706',
                'PAN 8806',
                'PAN 8901',
                'PAN 8902',
                'PAN 8903',
                'PAN 8904',
                'PAN 8905',
                'PAN 8906',
                'PAN 8907',
                'PAN 8908',
                'PAN 8909',
                'PAN 8911',
                'PAN 8912',
                'PAN 8913',
                'PAN 8914',
                'PAN 8915',
                'PAN 8916',
                'PAN 8918',
                'PAN 8919',
                'PAN 8920',
                'PAN 8921',
                'PAN 8922',
                'PAN 8923',
                'PAN 8924',
                'PAN 8925',
                'PAN 8926',
                'PAN 8927',
                'PAN 8928',
                'PAN 8929',
                'PAN 8930',
                'PAN 8931',
                'PAN 8932',
                'PAN 8933',
                'PAN 8936',
                'PAN 8937',
                'PAN 8938',
                'PAN 8939',
                'PAN 8940',
                'PAN 8966',
                'Other'
            ],
            'Other': [
                'APN 881',
                'MACIA-SA',
                'NK 8830',
                'Other',
                'OVERFLOW',
                'SA 1302-M27',
                'TITAN',
                'X868'
            ]
        },
        'Maize (Yellow)': {
            'Afgri': [
                'AFG 4222 B',
                'AFG 4244',
                'AFG 4270 B',
                'AFG 4410',
                'AFG 4412 B',
                'AFG 4414',
                'AFG 4416 B',
                'AFG 4434 R',
                'AFG 4440',
                'AFG 4448',
                'AFG 4452 B',
                'AFG 4474 R',
                'AFG 4476',
                'AFG 4478 BR',
                'AFG 4512',
                'AFG 4520',
                'AFG 4522 B',
                'AFG 4530',
                'AFG 4540',
                'AFG 4546',
                'AFG 4548',
                'AFG 4566 B',
                'AFG 4572 R',
                'AFG 4660',
                'AFG 4664',
                'DK 618',
                'Other'
            ],
            'Agricol': [
                'IMP 50-90 BR',
                'IMP 51-22 B',
                'IMP 51-92',
                'IMP 51-92 R',
                'Other',
                'QS 7646',
                'SC 602',
                'SC 608'
            ],
            'Capstone Seeds': [
                'CAP 121-30',
                'CAP 122-60',
                'CAP 130-120',
                'CAP 130-140',
                'CAP 444 NG',
                'CAP 766 NG',
                'CAP 9004',
                'CAP 9444 NG',
                'Other'
            ],
            'Dekalb (Monsanto)': [
                'DKC 61-90',
                'DKC 62-80 BR',
                'DKC 62-80 BR GEN',
                'DKC 62-84 R',
                'DKC 64-78 BR',
                'DKC 64-78 BR GEN',
                'DKC 66-32 B',
                'DKC 66-36 R',
                'DKC 66-60 BR',
                'DKC 73-70 B GEN',
                'DKC 73-72',
                'DKC 73-74 BR GEN',
                'DKC 73-76 R',
                'DKC 80-10',
                'DKC 80-12 B GEN',
                'DKC 80-30 R',
                'DKC 80-40 BR GEN',
                'Other'
            ],
            'Delta Seed': [
                'Amber',
                'DE 2004',
                'DE 2006',
                'DE 2016',
                'DE 222',
                'Other'
            ],
            'Klein Karoo Saad': [
                'Helen',
                'KKS 8202',
                'KKS 8204 B',
                'KKS 8400',
                'KKS 8402',
                'Other'
            ],
            'Linksaad': [
                'LS 8518',
                'LS 8524 R',
                'LS 8526',
                'LS 8528 R',
                'LS 8532 B',
                'LS 8536 B',
                'Other'
            ],
            'Pannar': [
                'BG 3268',
                'BG 3292',
                'BG 3492BR',
                'BG 3568R',
                'BG 3592R',
                'BG 3768BR',
                'BG 4296',
                'BG 6308B',
                'Other',
                'PAN 14',
                'PAN 3D-736 BR',
                'PAN 3P-502 R',
                'PAN 3P-730 BR',
                'PAN 3Q-222',
                'PAN 3Q-240',
                'PAN 3Q-740 BR',
                'PAN 3R-644 R',
                'PAN 4P-228',
                'PAN 4P-716 BR',
                'PAN 6126 ',
                'PAN 66',
                'PAN 6616',
                'PAN 6P-110',
                'PAN 6P110',
                'PAN 6Q-408B',
                'PAN 6Q-508 R',
                'PAN 6Q-708 BR'
            ],
            'Pioneer': [
                'Other',
                'P 1615 R',
                'P 2048',
                'Phb 31D21 B',
                'Phb 31D24',
                'Phb 31D46 BR',
                'Phb 31D48 B',
                'Phb 31G54 BR',
                'Phb 31G56 R',
                'Phb 31K58 B',
                'Phb 32D95 BR',
                'Phb 32D96 B',
                'Phb 32D99',
                'Phb 32P68 R',
                'Phb 32T50',
                'Phb 32W71',
                'Phb 32W72 B',
                'Phb 33A14 B',
                'Phb 33H52 B',
                'Phb 33H56',
                'Phb 33Y72 B',
                'Phb 33Y74',
                'Phb 3442',
                'Phb 34N44 B',
                'Phb 34N45 BR',
                'Phb 35T05 R'
            ],
            'Sensako (Monsanto)': [
                'Other',
                'SNK 2472',
                'SNK 2682',
                'SNK 2778',
                'SNK 2900',
                'SNK 2942',
                'SNK 2972',
                'SNK 6326 B',
                'SNK 7510 Y',
                'SNK 8520'
            ],
            'Other': [
                'Brasco',
                'Cobber Flint',
                'Cumbre',
                'Energy',
                'Gold Finger',
                'High Flyer',
                'IMP 50-10 R',
                'IMP 51-22',
                'IMP 52-12',
                'MEH 114',
                'MMH 1765',
                'MMH 8825',
                'Maverik',
                'NK Arma',
                'NK MAYOR B',
                'NS 5000',
                'NS 5004',
                'NS 5066',
                'NS 5914',
                'NS 5916',
                'NS 5918',
                'NS 5920',
                'Other',
                'Premium Flex',
                'QS 7608',
                'RO 430',
                'SA 24',
                'SABI 7004',
                'SABI 7200',
                'Silmaster',
                'Syncerus',
                'US 9570',
                'US 9580',
                'US 9600',
                'US 9610',
                'US 9620',
                'US 9770',
                'US 9772',
                'Woodriver'
            ]
        },
        'Maize (White)': {
            'Afgri': [
                'AFG 4211',
                'AFG 4321',
                'AFG 4331',
                'AFG 4333',
                'AFG 4361',
                'AFG 4383',
                'AFG 4411',
                'AFG 4445',
                'AFG 4447',
                'AFG 4471',
                'AFG 4475 B',
                'AFG 4477',
                'AFG 4479 R',
                'AFG 4501',
                'AFG 4517',
                'AFG 4555',
                'AFG 4571 B',
                'AFG 4573 B',
                'AFG 4575',
                'AFG 4577 B',
                'AFG 4579 B',
                'AFG 4581 BR',
                'AFG 4611',
                'AFG 4663',
                'AFRIC 1',
                'Other'
            ],
            'Agricol': [
                'IMP 52-11',
                'Other',
                'SC 701',
                'SC 709'
            ],
            'Capstone Seeds': [
                'CAP 341 NG',
                'CAP 341 T NG',
                'CAP 441 NG',
                'CAP 775 NG',
                'CAP 9001',
                'CAP 9013',
                'CAP 9421',
                'Other'
            ],
            'Dekalb (Monsanto)': [
                'CRN 3505',
                'CRN 4141',
                'DKC 77-61 B',
                'DKC 77-85 B GEN',
                'DKC 78-15 B',
                'DKC 78-17 B',
                'DKC 78-35 R',
                'DKC 78-45 BR',
                'DKC 78-45 BR GEN',
                'DKC 79-05',
                'Other'
            ],
            'Delta Seed': [
                'DE 111',
                'DE 303',
                'Other'
            ],
            'Klein Karoo Saad': [
                'KKS 4383',
                'KKS 4445',
                'KKS 4447',
                'KKS 4471',
                'KKS 4473',
                'KKS 4477',
                'KKS 4479 R',
                'KKS 4485',
                'KKS 4501',
                'KKS 4517',
                'KKS 4519',
                'KKS 4555',
                'KKS 4575',
                'KKS 4581 BR',
                'KKS 8401',
                'Other'
            ],
            'Linksaad': [
                'LS 8519',
                'LS 8529',
                'LS 8533 R',
                'LS 8535 B',
                'LS 8537',
                'LS 8539 B',
                'Other'
            ],
            'Pannar': [
                'BG 5485B',
                'BG 5685R',
                'BG4201',
                'BG4401B',
                'BG5285',
                'BG5785BR',
                'BG6683R',
                'Other',
                'PAN 413',
                'PAN 4P-767BR',
                'PAN 53',
                'PAN 5Q-649 R',
                'PAN 5Q-749 BR',
                'PAN 5Q-751BR',
                'PAN 6227',
                'PAN 6479',
                'PAN 6611',
                'PAN 6671',
                'PAN 67',
                'PAN 6777',
                'PAN 69',
                'PAN 6Q-745BR',
                'PAN 93',
                'PAN413',
                'PAN53',
                'PAN6Q245',
                'PAN6Q345CB',
                'SC 701 (Green mealie)'
            ],
            'Pioneer': [
                'Other',
                'P 2369 W',
                'P 2653 WB',
                'P 2823 WB',
                'P 2961 W',
                'Phb 30B95 B',
                'Phb 30B97 BR',
                'Phb 30D04 R',
                'Phb 30D07 B',
                'Phb 30D09 BR',
                'Phb 30Y79 B',
                'Phb 30Y81 R',
                'Phb 30Y83',
                'Phb 31M09',
                'Phb 31M84 BR',
                'Phb 31T91',
                'Phb 31V31',
                'Phb 3210B',
                'Phb 32A05 B',
                'Phb 32B07 BR',
                'Phb 32Y85',
                'Phb 32Y87 B'
            ],
            'Sensako (Monsanto)': [
                'SNK 2021',
                'SNK 2147',
                'SNK 2401',
                'SNK 2551',
                'SNK 2721',
                'SNK 2911',
                'SNK 2969',
                'SNK 6025',
                'SNK 7811 B'
            ],
            'Other': [
                'CG 4141',
                'GM 2000',
                'KGALAGADI',
                'MRI 514',
                'MRI 624',
                'NG 761',
                'NS 5913',
                'NS 5917',
                'NS 5919',
                'Other',
                'PGS 7053',
                'PGS 7061',
                'PGS 7071',
                'PLATINUM',
                'Panthera',
                'QS 7707',
                'RO 413',
                'RO 413',
                'RO 419',
                'SAFFIER',
                'SC 401',
                'SC 403',
                'SC 405',
                'SC 407',
                'SC 513',
                'SC 627',
                'SC 631',
                'SC 633',
                'SC 713',
                'SC 715',
                'Scout'
            ]
        },
        'Oats': {
            'Agricol': [
                'Magnifico',
                'Maida',
                'Nugene',
                'Other',
                'Overberg',
                'Pallinup',
                'Saia',
                'SWK001'
            ],
            'Sensako (Monsanto)': [
                'Other',
                'SSH 39W',
                'SSH 405',
                'SSH 421',
                'SSH 423',
                'SSH 491'
            ],
            'Other': [
                'Drakensberg',
                'H06/19',
                'H06/20',
                'H07/04',
                'H07/05',
                'Heros',
                'Kompasberg',
                'Le Tucana',
                'Maluti',
                'Other',
                'Potoroo',
                'Witteberg'
            ]
        },
        'Peanut': {
            'Other': [
                'Other'
            ]
        },
        'Soya Bean': {
            'Agriocare': [
                'AGC 58007 R',
                'AGC 60104 R',
                'AGC 64107 R',
                'AS 4801 R',
                'Other'
            ],
            'Linksaad': [
                'LS 6146 R',
                'LS 6150 R',
                'LS 6161 R',
                'LS 6164 R',
                'LS 6248 R',
                'LS 6261 R',
                'LS 6444 R',
                'LS 6466 R',
                'Other'
            ],
            'Pannar': [
                'A 5409 RG',
                'Other',
                'PAN 1454 R',
                'PAN 1583 R',
                'PAN 1664 R',
                'PAN 1666 R'
            ],
            'Pioneer': [
                'Other',
                'Phb 94Y80 R',
                'Phb 95B53 R',
                'Phb 95Y20 R',
                'Phb 95Y40 R'
            ],
            'Other': [
                'AG 5601',
                'AMSTEL NO 1',
                'DUMELA',
                'DUNDEE',
                'EGRET',
                'HERON',
                'HIGHVELD TOP',
                'IBIS 2000',
                'JF 91',
                'JIMMY',
                'KIAAT',
                'KNAP',
                'LEX 1233 R',
                'LEX 1235 R',
                'LEX 2257 R',
                'LEX 2685 R',
                'LIGHTNING',
                'MARULA',
                'MARUTI',
                'MOPANIE',
                'MPIMBO',
                'MUKWA',
                'NQUTU',
                'OCTA',
                'Other',
                'SONOP',
                'SPITFIRE',
                'STORK',
                'TAMBOTIE',
                'WENNER'
            ]
        },
        'Sugarcane': {
            'Other': [
                'ACRUNCH',
                'BONITA',
                'CHIEFTAIN',
                'EARLISWEET',
                'GLADIATOR',
                'GSS 9299',
                'HOLLYWOOD',
                'HONEYMOON',
                'INFERNO',
                'JUBILEE',
                'MADHUR',
                'MAJESTY',
                'MANTRA',
                'MATADOR',
                'MAX',
                'MEGATON',
                'MMZ 9903',
                'ORLA',
                'OSCAR',
                'Other',
                'OVERLAND',
                'PRIMEPLUS',
                'RUSALTER',
                'RUSTICO',
                'RUSTLER',
                'SENTINEL',
                'SHIMMER',
                'STAR 7708',
                'STAR 7713',
                'STAR 7714',
                'STAR 7715',
                'STAR 7717',
                'STAR 7718',
                'STAR 7719',
                'STETSON',
                'SWEET SUCCESS',
                'SWEET SURPRISE',
                'SWEET TALK',
                'TENDER TREAT',
                'WINSTAR'
            ]
        },
        'Sunflower': {
            'Agricol': [
                'AGSUN 5161 CL',
                'AGSUN 5182 CL',
                'Agsun 5264',
                'Agsun 5671',
                'Agsun 8251',
                'Nonjana',
                'Other',
                'SUNSTRIPE'
            ],
            'Klein Karoo Saad': [
                'AFG 271',
                'HYSUN 333',
                'KKS 318',
                'NK ADAGIO',
                'NK Armoni',
                'NK FERTI',
                'Other',
                'Sirena',
                'Sunbird'
            ],
            'Pannar': [
                'Other',
                'PAN 7033',
                'PAN 7049',
                'PAN 7050',
                'PAN 7057',
                'PAN 7063 CL',
                'PAN 7080',
                'PAN 7086 HO',
                'PAN 7095 CL',
                'PAN 7351'
            ],
            'Other': [
                'Ella',
                'Grainco Sunstripe',
                'HV 3037',
                'HYSUN 334',
                'HYSUN 338',
                'HYSUN 346',
                'HYSUN 350',
                'Jade Emperor',
                'Marica-2',
                'NK Adagio CL',
                'Nallimi CL',
                'Other',
                'SEA 2088 CL AO',
                'SY 4045',
                'SY 4200',
                'Sikllos CL',
                'WBS 3100'
            ]
        },
        'Triticale': {
            'Agricol': [
                'AG Beacon',
                'Other',
                'Rex'
            ],
            'Pannar': [
                'PAN 248',
                'PAN 299',
                'Other'
            ],
            'Other': [
                'Bacchus',
                'Cloc 1',
                'Cultivars',
                'Falcon',
                'Ibis',
                'Kiewiet',
                'Korhaan',
                'Other',
                'Tobie',
                'US 2009',
                'US 2010',
                'US2007'
            ]
        },
        'Wheat': {
            'Afgri': [
                'AFG 554-8',
                'AFG 75-3',
                'Other'
            ],
            'All-Grow Seed': [
                'BUFFELS',
                'DUZI',
                'KARIEGA',
                'KROKODIL',
                'Other',
                'SABIE',
                'STEENBRAS'
            ],
            'Klein Karoo Saad': [
                'HARTBEES',
                'KOMATI',
                'KOONAP',
                'MATLABAS',
                'Other',
                'SELATI',
                'SENQU'
            ],
            'Sensako': [
                'CRN 826',
                'ELANDS',
                'Other',
                'SST 015',
                'SST 026',
                'SST 027',
                'SST 035',
                'SST 036',
                'SST 037',
                'SST 039',
                'SST 047',
                'SST 056',
                'SST 057',
                'SST 065',
                'SST 077',
                'SST 087',
                'SST 088',
                'SST 094',
                'SST 096',
                'SST 107',
                'SST 124',
                'SST 308',
                'SST 316',
                'SST 317',
                'SST 319',
                'SST 322',
                'SST 333',
                'SST 334',
                'SST 347',
                'SST 356',
                'SST 363',
                'SST 366',
                'SST 367',
                'SST 374',
                'SST 387',
                'SST 398',
                'SST 399',
                'SST 802',
                'SST 805',
                'SST 806',
                'SST 807',
                'SST 815',
                'SST 816',
                'SST 822',
                'SST 825',
                'SST 835',
                'SST 843',
                'SST 866',
                'SST 867',
                'SST 875',
                'SST 876',
                'SST 877',
                'SST 878',
                'SST 884',
                'SST 885',
                'SST 886',
                'SST 895',
                'SST 896',
                'SST 935',
                'SST 936',
                'SST 946',
                'SST 954',
                'SST 963',
                'SST 964',
                'SST 966',
                'SST 972',
                'SST 983',
                'SST 0127',
                'SST 1327',
                'SST 3137',
                'SST 8125',
                'SST 8126',
                'SST 8134',
                'SST 8135',
                'SST 8136'
            ],
            'Pannar': [
                'Other',
                'PAN 3118',
                'PAN 3120',
                'PAN 3122',
                'PAN 3144',
                'PAN 3161',
                'PAN 3172',
                'PAN 3195',
                'PAN 3198',
                'PAN 3355',
                'PAN 3364',
                'PAN 3368',
                'PAN 3369',
                'PAN 3377',
                'PAN 3378',
                'PAN 3379',
                'PAN 3394',
                'PAN 3400',
                'PAN 3404',
                'PAN 3405',
                'PAN 3408',
                'PAN 3434',
                'PAN 3471',
                'PAN 3478',
                'PAN 3489',
                'PAN 3490',
                'PAN 3492',
                'PAN 3497',
                'PAN 3111',
                'PAN 3349',
                'PAN 3515',
                'PAN 3623'
            ],
            'Other': [
                'BAVIAANS',
                'BELINDA',
                'BETTA-DN',
                'BIEDOU',
                'CALEDON',
                'CARINA',
                'CAROL',
                'GARIEP',
                'HUGENOOT',
                'INIA',
                'KOUGA',
                'KWARTEL',
                'LIMPOPO',
                'MacB',
                'MARICO',
                'NOSSOB',
                'OLIFANTS',
                'Other',
                'SNACK',
                'TAMBOTI',
                'TANKWA',
                'TARKA',
                'TIMBAVATI',
                'TUGELA-DN',
                'UMLAZI',
                'RATEL'
            ]
        }
    };

    // Create Maize from Maize (Yellow) and Maize (White)
    _providerCultivars['Maize'] = angular.copy(_providerCultivars['Maize (Yellow)']);

    angular.forEach(_providerCultivars['Maize (White)'], function (cultivars, seedProvider) {
        _providerCultivars['Maize'][seedProvider] = _.chain(_providerCultivars['Maize'][seedProvider] || [])
            .union(cultivars)
            .compact()
            .uniq()
            .sortBy(function (cultivar) {
                return cultivar;
            })
            .value();
    });

    var _cultivarLeafTable = {
        'Phb 30F40': 23,
        'Phb 31G54 BR': 19,
        'Phb 31G58': 21,
        'Phb 32D95BR': 18,
        'Phb 32D96 B': 18,
        'Phb 32P68 R': 20,
        'Phb 32T50': 18,
        'Phb 32W71': 21,
        'Phb 32W72 B': 20,
        'Phb 33A14 B': 19,
        'Phb 33H56': 20,
        'Phb 33R78 B': 21,
        'Phb 33Y72B': 17,
        'Phb 3442': 21,
        'Phb 30B95 B': 23,
        'Phb 30B97 BR': 23,
        'Phb 30D09 BR': 20,
        'Phb 31M09': 18,
        'Phb 32A05 B': 19,
        'Phb 32B10': 18,
        'Phb 32Y85': 21,
        'Phb 31D48 BR': 21,
        'Phb 32D91 R': 20,
        'Phb 32D99': 20,
        'Phb 32Y68': 20,
        'Phb 3394': 19,
        'Phb 33A13': 19,
        'Phb 33H52 B': 19,
        'Phb 33H54 BR': 19,
        'Phb 33P34': 20,
        'Phb 33P66': 20,
        'Phb 33P67': 20,
        'X 70200 T': 23,
        'X 7268 TR': 21,
        'Phb 30N35': 23,
        'Phb 32A03': 19,
        'Phb 32Y52': 19,
        'Phb 32Y53': 20,
        'Phb 33A03': 19,
        'Phb 30H22': 21,
        'Phb 32P75': 20,
        'Phb 3335': 20,
        'DKC62-74R': 20,
        'DKC62-80BR': 18,
        'DKC64-78BR': 17,
        'DKC66-32B': 21,
        'DKC66-36R': 19,
        'DKC73-70BGEN': 20,
        'DKC73-74BR': 20,
        'DKC73-74BRGEN': 20,
        'DKC73-76R': 20,
        'DKC80-10': 20,
        'DKC80-12B': 20,
        'DKC80-30R': 20,
        'DKC80-40BR': 19,
        'DKC80-40BRGEN': 21,
        'CRN3505': 21,
        'DKC77-61B': 20,
        'DKC77-71R': 20,
        'DKC77-85B': 21,
        'DKC78-15B': 20,
        'DKC78-35BR': 21,
        'DKC78-45BRGEN': 21,
        'DKC 78-79 BR': 21,
        'CRN 3604': 21,
        'CRN 37-60': 20,
        'CRN 4760 B': 23,
        'DKC 63-20': 20,
        'DKC 66-21': 21,
        'DKC 66-38 B': 21,
        'DKC 63-28 R': 21,
        'CRN 3549': 21,
        'DKC 71-21': 20,
        'SNK 2472': 23,
        'SNK 2682': 23,
        'SNK 2778': 23,
        'SNK 2900': 20,
        'SNK 2942': 24,
        'SNK 2972': 21,
        'SNK 6326 B': 21,
        'SNK 8520': 24,
        'SNK 2911': 21,
        'SNK 6025': 18,
        'LS 8504': 20,
        'LS 8512': 20,
        'LS 8518': 19,
        'LS 8522 R': 19,
        'LS 8511': 19,
        'LS 8513': 19,
        'LS 8519': 19,
        'LS 8521 B': 19,
        'LS 8523 B': 19,
        'LS 8527 BR': 19,
        'LS 8506': 21,
        'LS 8508': 20,
        'LS 8524 R': 20,
        'LEX 800': 23,
        'LS 8509': 21,
        'LS 8517': 23,
        'LS 8525': 21,
        'LS 8529': 21,
        'LS 8533 R': 21,
        'LS 8536 B': 19,
        'PAN 3D-432Bt ': 18,
        'PAN 3D-736BR': 18,
        'PAN 3P-502RR': 19,
        'PAN 3P-730BR': 18,
        'PAN 3Q-422B': 18,
        'PAN 3Q-740BR': 19,
        'PAN 3R-644R': 18,
        'PAN 4P-116': 19,
        'PAN 4P-316Bt': 19,
        'PAN 4P-516RR': 20,
        'PAN 4P-716BR': 19,
        'PAN 6114': 19,
        'PAN 6126': 18,
        'PAN 6146': 24,
        'PAN 6236Bt': 18,
        'PAN 6238RR': 18,
        'PAN 6480': 23,
        'PAN 6616': 23,
        'PAN 6724Bt': 25,
        'PAN 6734': 23,
        'PAN 6P-110': 21,
        'PAN 6Q-308 B': 21,
        'PAN 6Q-308 Bt': 21,
        'PAN 6Q-408 CB': 21,
        'PAN 6Q-508R': 21,
        'PAN 6Q-508RR': 20,
        'PAN 4P-767BR': 19,
        'PAN 5Q-433Bt *': 20,
        'PAN 5R-541RR': 19,
        'PAN 6013Bt': 23,
        'PAN 6017': 21,
        'PAN 6043': 23,
        'PAN 6053': 23,
        'PAN 6223Bt': 21,
        'PAN 6479': 23,
        'PAN 6611': 23,
        'PAN 6723': 23,
        'PAN 6777': 25,
        'PAN 6Q-419B': 20,
        'PAN 6Q-445Bt': 21,
        'PAN 6000 Bt': 19,
        'PAN 6012 Bt': 21,
        'PAN 6118': 19,
        'PAN 6124 Bt': 19,
        'PAN 6128 RR': 19,
        'PAN 6256': 24,
        'PAN 6310': 24,
        'PAN 6316': 25,
        'PAN 6320': 25,
        'PAN 6432 B': 23,
        'PAN 6568': 23,
        'PAN 6622': 25,
        'PAN 6710': 21,
        'PAN 6804': 20,
        'PAN 6844': 25,
        'PAN 6994 Bt': 24,
        'PAN 5Q-749 BR': 23,
        'PAN 6243': 24,
        'PAN 6335': 23,
        'PAN 6573': 23,
        'PAN 6633': 23,
        'PAN 6757': 25,
        'PAN 6839': 23,
        'PAN 6Q-321 B': 23,
        'PAN 6Q-345 CB': 21,
        'AFG 4270B': 18,
        'AFG 4412B': 19,
        'AFG 4434R': 20,
        'AFG 4522B': 20,
        'AFG 4530': 19,
        'AFG 4222 B': 19,
        'AFG 4244': 19,
        'AFG 4410': 19,
        'AFG 4414': 20,
        'AFG 4416 B': 20,
        'AFG 4448': 20,
        'AFG 4474 R': 19,
        'AFG 4476': 20,
        'AFG 4512': 23,
        'AFG 4520': 20,
        'AFG 4540': 20,
        'DK 618': 21,
        'EXPG 5002': 20,
        'EXP Stack': 20,
        'AFG 4321': 19,
        'AFG 4331': 20,
        'AFG 4333': 20,
        'AFG 4411': 21,
        'AFG 4445': 21,
        'AFG 4447': 21,
        'AFG 4471': 23,
        'AFG 4475 B': 21,
        'AFG 4477': 20,
        'AFG 4479 R': 21,
        'AFG 4573 B': 21,
        'AFG 4577 B': 21,
        'AFG 4611': 23,
        'KKS 8204B': 15,
        'KKS 4581 BR': 21,
        'KKS 8301': 19,
        'IMP 50 - 90BR': 18,
        'IMP 51 - 22': 19,
        'IMP 51-92': 19,
        'IMP 52-12': 20,
        'NS 5920': 20,
        'QS 7646': 20,
        'BG 5485 B': 23,
        'BG 8285': 23,
        'Brasco': 19,
        'Energy': 18,
        'Gold Finger': 19,
        'Helen': 17,
        'High Flyer': 17,
        'Maverik': 19,
        'NK Arma': 18,
        'QS 7608': 23,
        'SC 506': 19,
        'SC 602': 21,
        'Woodriver': 18,
        'P 1615 R': 19,
        'P 1973 Y': 19,
        'P 2653 WB': 20,
        'P 2048': 20,
        'IMP 52-11 B': 18,
        'Panthera': 21,
        'QS 7707': 23,
        'SC 401': 18,
        'SC 403': 20,
        'SC 405': 20,
        'SC 407': 20,
        'SC 533': 21,
        'SC 719': 24,
        'Scout': 20
    };

    return {
        getCultivars: function (crop, seedProvider) {
            return (_providerCultivars[crop] && _providerCultivars[crop][seedProvider] ? _providerCultivars[crop][seedProvider] : []);
        },
        getCultivarLeafCount: function (cultivar) {
            return _cultivarLeafTable[cultivar] || 22;
        },
        getSeedProviders: function (crop) {
            return (_providerCultivars[crop] ? underscore.keys(_providerCultivars[crop]) : []);
        }
    }
}]);
