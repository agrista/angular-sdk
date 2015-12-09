describe('FRP Calculation', function() {
    var Mocks, Model, Asset, BusinessPlan, Liability;
    beforeEach(module('ag.sdk.model.base'));
    beforeEach(module('ag.test.model.mocks'));
    beforeEach(module('ag.sdk.model.asset'));
    beforeEach(module('ag.sdk.model.business-plan'));
    beforeEach(inject(['Asset', 'BusinessPlan', 'Model', 'mocks', 'Liability', function(_Asset_, _BusinessPlan_, _Model_, _mocks_, _Liability_) {
        Model = _Model_;
        Mocks = _mocks_;
        Asset = _Asset_;
        BusinessPlan = _BusinessPlan_;
        Liability = _Liability_;
    }]));

    /************** SAMPLE DATA *************/
    var businessPlan;
    var productionSchedules;
    var liability;
    beforeEach(function () {
        businessPlan = BusinessPlan.new({
            id: 2818,
            author: 'Absa',
            title: 'AFRP TEST 3',
            data: {
                "account": {
                    "monthly": [{
                        "opening": 0,
                        "inflow": 416.6666666666667,
                        "outflow": 0,
                        "balance": 416.6666666666667,
                        "interestPayable": 0,
                        "interestReceivable": 0,
                        "closing": 416.6666666666667,
                        "worstBalance": {
                            "balance": 0,
                            "month": "Dec-16"
                        },
                        "bestBalance": {
                            "balance": 0,
                            "month": "Dec-16"
                        },
                        "openingMonth": "2016-12-01T00:00:00.000Z",
                        "closingMonth": "Nov-17"
                    }, {
                        "opening": 416.6666666666667,
                        "inflow": 416.6666666666667,
                        "outflow": 0,
                        "balance": 833.3333333333334,
                        "interestPayable": 0,
                        "interestReceivable": 0,
                        "closing": 833.3333333333334,
                        "worstBalance": {
                            "balance": 0,
                            "month": "Dec-16"
                        },
                        "bestBalance": {
                            "balance": 0,
                            "month": "Dec-16"
                        },
                        "openingMonth": "2016-12-01T00:00:00.000Z",
                        "closingMonth": "Nov-17"
                    }, {
                        "opening": 833.3333333333334,
                        "inflow": 416.6666666666667,
                        "outflow": 0,
                        "balance": 1250,
                        "interestPayable": 0,
                        "interestReceivable": 0,
                        "closing": 1250,
                        "worstBalance": {
                            "balance": 0,
                            "month": "Dec-16"
                        },
                        "bestBalance": {
                            "balance": 0,
                            "month": "Dec-16"
                        },
                        "openingMonth": "2016-12-01T00:00:00.000Z",
                        "closingMonth": "Nov-17"
                    }, {
                        "opening": 1250,
                        "inflow": 416.6666666666667,
                        "outflow": 0,
                        "balance": 1666.6666666666667,
                        "interestPayable": 0,
                        "interestReceivable": 0,
                        "closing": 1666.6666666666667,
                        "worstBalance": {
                            "balance": 0,
                            "month": "Dec-16"
                        },
                        "bestBalance": {
                            "balance": 0,
                            "month": "Dec-16"
                        },
                        "openingMonth": "2016-12-01T00:00:00.000Z",
                        "closingMonth": "Nov-17"
                    }, {
                        "opening": 1666.6666666666667,
                        "inflow": 416.6666666666667,
                        "outflow": 0,
                        "balance": 2083.3333333333335,
                        "interestPayable": 0,
                        "interestReceivable": 0,
                        "closing": 2083.3333333333335,
                        "worstBalance": {
                            "balance": 0,
                            "month": "Dec-16"
                        },
                        "bestBalance": {
                            "balance": 0,
                            "month": "Dec-16"
                        },
                        "openingMonth": "2016-12-01T00:00:00.000Z",
                        "closingMonth": "Nov-17"
                    }, {
                        "opening": 2083.3333333333335,
                        "inflow": 416.6666666666667,
                        "outflow": 0,
                        "balance": 2500,
                        "interestPayable": 0,
                        "interestReceivable": 0,
                        "closing": 2500,
                        "worstBalance": {
                            "balance": 0,
                            "month": "Dec-16"
                        },
                        "bestBalance": {
                            "balance": 0,
                            "month": "Dec-16"
                        },
                        "openingMonth": "2016-12-01T00:00:00.000Z",
                        "closingMonth": "Nov-17"
                    }, {
                        "opening": 2500,
                        "inflow": 416.6666666666667,
                        "outflow": 0,
                        "balance": 2916.6666666666665,
                        "interestPayable": 0,
                        "interestReceivable": 0,
                        "closing": 2916.6666666666665,
                        "worstBalance": {
                            "balance": 0,
                            "month": "Dec-16"
                        },
                        "bestBalance": {
                            "balance": 0,
                            "month": "Dec-16"
                        },
                        "openingMonth": "2016-12-01T00:00:00.000Z",
                        "closingMonth": "Nov-17"
                    }, {
                        "opening": 2916.6666666666665,
                        "inflow": 416.6666666666667,
                        "outflow": 0,
                        "balance": 3333.333333333333,
                        "interestPayable": 0,
                        "interestReceivable": 0,
                        "closing": 3333.333333333333,
                        "worstBalance": {
                            "balance": 0,
                            "month": "Dec-16"
                        },
                        "bestBalance": {
                            "balance": 0,
                            "month": "Dec-16"
                        },
                        "openingMonth": "2016-12-01T00:00:00.000Z",
                        "closingMonth": "Nov-17"
                    }, {
                        "opening": 3333.333333333333,
                        "inflow": 416.6666666666667,
                        "outflow": 0,
                        "balance": 3749.9999999999995,
                        "interestPayable": 0,
                        "interestReceivable": 0,
                        "closing": 3749.9999999999995,
                        "worstBalance": {
                            "balance": 0,
                            "month": "Dec-16"
                        },
                        "bestBalance": {
                            "balance": 0,
                            "month": "Dec-16"
                        },
                        "openingMonth": "2016-12-01T00:00:00.000Z",
                        "closingMonth": "Nov-17"
                    }, {
                        "opening": 3749.9999999999995,
                        "inflow": 416.6666666666667,
                        "outflow": 0,
                        "balance": 4166.666666666666,
                        "interestPayable": 0,
                        "interestReceivable": 0,
                        "closing": 4166.666666666666,
                        "worstBalance": {
                            "balance": 0,
                            "month": "Dec-16"
                        },
                        "bestBalance": {
                            "balance": 0,
                            "month": "Dec-16"
                        },
                        "openingMonth": "2016-12-01T00:00:00.000Z",
                        "closingMonth": "Nov-17"
                    }, {
                        "opening": 4166.666666666666,
                        "inflow": 416.6666666666667,
                        "outflow": 0,
                        "balance": 4583.333333333333,
                        "interestPayable": 0,
                        "interestReceivable": 0,
                        "closing": 4583.333333333333,
                        "worstBalance": {
                            "balance": 0,
                            "month": "Dec-16"
                        },
                        "bestBalance": {
                            "balance": 0,
                            "month": "Dec-16"
                        },
                        "openingMonth": "2016-12-01T00:00:00.000Z",
                        "closingMonth": "Nov-17"
                    }, {
                        "opening": 4583.333333333333,
                        "inflow": 416.6666666666667,
                        "outflow": 0,
                        "balance": 5000,
                        "interestPayable": 0,
                        "interestReceivable": 0,
                        "closing": 5000,
                        "worstBalance": {
                            "balance": 0,
                            "month": "Dec-16"
                        },
                        "bestBalance": {
                            "balance": 0,
                            "month": "Dec-16"
                        },
                        "openingMonth": "2016-12-01T00:00:00.000Z",
                        "closingMonth": "Nov-17"
                    }, {
                        "opening": 5000,
                        "inflow": 0,
                        "outflow": 0,
                        "balance": 5000,
                        "interestPayable": 0,
                        "interestReceivable": 0,
                        "closing": 5000,
                        "worstBalance": {
                            "balance": 0,
                            "month": "Dec-16"
                        },
                        "bestBalance": {
                            "balance": 0,
                            "month": "Dec-16"
                        },
                        "openingMonth": "2016-12-01T00:00:00.000Z",
                        "closingMonth": "Nov-17"
                    }, {
                        "opening": 5000,
                        "inflow": 0,
                        "outflow": 0,
                        "balance": 5000,
                        "interestPayable": 0,
                        "interestReceivable": 0,
                        "closing": 5000,
                        "worstBalance": {
                            "balance": 0,
                            "month": "Dec-16"
                        },
                        "bestBalance": {
                            "balance": 0,
                            "month": "Dec-16"
                        },
                        "openingMonth": "2016-12-01T00:00:00.000Z",
                        "closingMonth": "Nov-17"
                    }, {
                        "opening": 5000,
                        "inflow": 0,
                        "outflow": 0,
                        "balance": 5000,
                        "interestPayable": 0,
                        "interestReceivable": 0,
                        "closing": 5000,
                        "worstBalance": {
                            "balance": 0,
                            "month": "Dec-16"
                        },
                        "bestBalance": {
                            "balance": 0,
                            "month": "Dec-16"
                        },
                        "openingMonth": "2016-12-01T00:00:00.000Z",
                        "closingMonth": "Nov-17"
                    }, {
                        "opening": 5000,
                        "inflow": 0,
                        "outflow": 0,
                        "balance": 5000,
                        "interestPayable": 0,
                        "interestReceivable": 0,
                        "closing": 5000,
                        "worstBalance": {
                            "balance": 0,
                            "month": "Dec-16"
                        },
                        "bestBalance": {
                            "balance": 0,
                            "month": "Dec-16"
                        },
                        "openingMonth": "2016-12-01T00:00:00.000Z",
                        "closingMonth": "Nov-17"
                    }, {
                        "opening": 5000,
                        "inflow": 0,
                        "outflow": 0,
                        "balance": 5000,
                        "interestPayable": 0,
                        "interestReceivable": 0,
                        "closing": 5000,
                        "worstBalance": {
                            "balance": 0,
                            "month": "Dec-16"
                        },
                        "bestBalance": {
                            "balance": 0,
                            "month": "Dec-16"
                        },
                        "openingMonth": "2016-12-01T00:00:00.000Z",
                        "closingMonth": "Nov-17"
                    }, {
                        "opening": 5000,
                        "inflow": 0,
                        "outflow": 0,
                        "balance": 5000,
                        "interestPayable": 0,
                        "interestReceivable": 0,
                        "closing": 5000,
                        "worstBalance": {
                            "balance": 0,
                            "month": "Dec-16"
                        },
                        "bestBalance": {
                            "balance": 0,
                            "month": "Dec-16"
                        },
                        "openingMonth": "2016-12-01T00:00:00.000Z",
                        "closingMonth": "Nov-17"
                    }, {
                        "opening": 5000,
                        "inflow": 0,
                        "outflow": 0,
                        "balance": 5000,
                        "interestPayable": 0,
                        "interestReceivable": 0,
                        "closing": 5000,
                        "worstBalance": {
                            "balance": 0,
                            "month": "Dec-16"
                        },
                        "bestBalance": {
                            "balance": 0,
                            "month": "Dec-16"
                        },
                        "openingMonth": "2016-12-01T00:00:00.000Z",
                        "closingMonth": "Nov-17"
                    }, {
                        "opening": 5000,
                        "inflow": 0,
                        "outflow": 0,
                        "balance": 5000,
                        "interestPayable": 0,
                        "interestReceivable": 0,
                        "closing": 5000,
                        "worstBalance": {
                            "balance": 0,
                            "month": "Dec-16"
                        },
                        "bestBalance": {
                            "balance": 0,
                            "month": "Dec-16"
                        },
                        "openingMonth": "2016-12-01T00:00:00.000Z",
                        "closingMonth": "Nov-17"
                    }, {
                        "opening": 5000,
                        "inflow": 0,
                        "outflow": 0,
                        "balance": 5000,
                        "interestPayable": 0,
                        "interestReceivable": 0,
                        "closing": 5000,
                        "worstBalance": {
                            "balance": 0,
                            "month": "Dec-16"
                        },
                        "bestBalance": {
                            "balance": 0,
                            "month": "Dec-16"
                        },
                        "openingMonth": "2016-12-01T00:00:00.000Z",
                        "closingMonth": "Nov-17"
                    }, {
                        "opening": 5000,
                        "inflow": 0,
                        "outflow": 0,
                        "balance": 5000,
                        "interestPayable": 0,
                        "interestReceivable": 0,
                        "closing": 5000,
                        "worstBalance": {
                            "balance": 0,
                            "month": "Dec-16"
                        },
                        "bestBalance": {
                            "balance": 0,
                            "month": "Dec-16"
                        },
                        "openingMonth": "2016-12-01T00:00:00.000Z",
                        "closingMonth": "Nov-17"
                    }, {
                        "opening": 5000,
                        "inflow": 0,
                        "outflow": 0,
                        "balance": 5000,
                        "interestPayable": 0,
                        "interestReceivable": 0,
                        "closing": 5000,
                        "worstBalance": {
                            "balance": 0,
                            "month": "Dec-16"
                        },
                        "bestBalance": {
                            "balance": 0,
                            "month": "Dec-16"
                        },
                        "openingMonth": "2016-12-01T00:00:00.000Z",
                        "closingMonth": "Nov-17"
                    }, {
                        "opening": 5000,
                        "inflow": 0,
                        "outflow": 0,
                        "balance": 5000,
                        "interestPayable": 0,
                        "interestReceivable": 0,
                        "closing": 5000,
                        "worstBalance": {
                            "balance": 0,
                            "month": "Dec-16"
                        },
                        "bestBalance": {
                            "balance": 0,
                            "month": "Dec-16"
                        },
                        "openingMonth": "2016-12-01T00:00:00.000Z",
                        "closingMonth": "Nov-17"
                    }],
                    "yearly": [{
                        "opening": 0,
                        "inflow": 5000,
                        "outflow": 0,
                        "balance": 5000,
                        "interestPayable": 0,
                        "interestReceivable": 0,
                        "closing": 5000,
                        "worstBalance": {
                            "balance": 416.6666666666667,
                            "month": "Dec-15"
                        },
                        "bestBalance": {
                            "balance": 5000,
                            "month": "Nov-16"
                        },
                        "openingMonth": "2015-12-01T00:00:00.000Z",
                        "closingMonth": "Nov-16"
                    }, {
                        "opening": 5000,
                        "inflow": 0,
                        "outflow": 0,
                        "balance": 5000,
                        "interestPayable": 0,
                        "interestReceivable": 0,
                        "closing": 5000,
                        "worstBalance": {
                            "balance": 5000,
                            "month": "Dec-16"
                        },
                        "bestBalance": {
                            "balance": 5000,
                            "month": "Dec-16"
                        },
                        "openingMonth": "2016-12-01T00:00:00.000Z",
                        "closingMonth": "Nov-17"
                    }],
                    "openingBalance": 0,
                    "interestRateCredit": 0,
                    "interestRateDebit": 0,
                    "depreciationRate": 0,
                    "currentLimit": 0
                },
                "models": {
                    "assets": [{
                        "id": 3860,
                        "assetKey": "entity.bca64631-abae-4a2b-a373-2da1299a0c09-F00300000000053100003",
                        "farmId": 2865,
                        "legalEntityId": 2945,
                        "liabilities": [],
                        "productionSchedules": [],
                        "type": "farmland",
                        "data": {
                            "source": "cadastral",
                            "portionNumber": 3,
                            "remainder": false,
                            "officialFarmName": "FAIRVIEW",
                            "farmNumber": "531",
                            "province": "Free State",
                            "area": 135.9662634669449,
                            "sgKey": "F00300000000053100003",
                            "loc": {
                                "type": "MultiPolygon",
                                "coordinates": [
                                    [
                                        [
                                            [
                                                26.367685, -29.182967
                                            ],
                                            [
                                                26.370365, -29.184362
                                            ],
                                            [
                                                26.375687, -29.187987
                                            ],
                                            [
                                                26.374835, -29.190462
                                            ],
                                            [
                                                26.37157, -29.199957
                                            ],
                                            [
                                                26.370005, -29.199412
                                            ],
                                            [
                                                26.363781, -29.197247
                                            ],
                                            [
                                                26.363021, -29.196983
                                            ],
                                            [
                                                26.363372, -29.195929
                                            ],
                                            [
                                                26.364339, -29.193023
                                            ],
                                            [
                                                26.365108, -29.190709
                                            ],
                                            [
                                                26.365973, -29.188109
                                            ],
                                            [
                                                26.366793, -29.185644
                                            ],
                                            [
                                                26.367613, -29.183181
                                            ],
                                            [
                                                26.367685, -29.182967
                                            ]
                                        ]
                                    ]
                                ]
                            },
                            "label": "Ptn. 3 of farm Fairview 531",
                            "farmLabel": "Fairview 531",
                            "portionLabel": "Ptn. 3",
                            "geocledianId": 4682
                        }
                    }],
                    "farmValuations": [],
                    "legalEntities": [],
                    "liabilities": [],
                    "productionSchedules": [{
                        "id": 127,
                        "assetId": 3861,
                        "organizationId": 2858,
                        "budgetUuid": "1de6447f-475d-4682-8d64-10d49c612535",
                        "type": "crop",
                        "startDate": "2015-11-30T23:00:00.000+0000",
                        "endDate": "2016-11-30T23:00:00.000+0000",
                        "data": {
                            "details": {
                                "budgetName": "FRP BARLEY 3",
                                "commodity": "Barley",
                                "fieldName": "Crop Field 1",
                                "grossProfit": 5000,
                                "size": 10
                            },
                            "sections": [{
                                "code": "INC",
                                "name": "Income",
                                "productCategoryGroups": [{
                                    "code": "INC-CPS",
                                    "name": "Crop Sales",
                                    "productCategories": [{
                                        "code": "INC-HVT-CROP",
                                        "name": "Crop",
                                        "unit": "t",
                                        "pricePerUnit": 500,
                                        "quantity": 10,
                                        "value": 5000,
                                        "valuePerMonth": [
                                            416.6666666666667,
                                            416.6666666666667,
                                            416.6666666666667,
                                            416.6666666666667,
                                            416.6666666666667,
                                            416.6666666666667,
                                            416.6666666666667,
                                            416.6666666666667,
                                            416.6666666666667,
                                            416.6666666666667,
                                            416.6666666666667,
                                            416.6666666666667
                                        ],
                                        "quantityPerMonth": [
                                            0.8333333333333335,
                                            0.8333333333333335,
                                            0.8333333333333335,
                                            0.8333333333333335,
                                            0.8333333333333335,
                                            0.8333333333333335,
                                            0.8333333333333335,
                                            0.8333333333333335,
                                            0.8333333333333335,
                                            0.8333333333333335,
                                            0.8333333333333335,
                                            0.8333333333333335
                                        ]
                                    }],
                                    "total": {
                                        "value": 5000,
                                        "valuePerMonth": [
                                            416.6666666666667,
                                            416.6666666666667,
                                            416.6666666666667,
                                            416.6666666666667,
                                            416.6666666666667,
                                            416.6666666666667,
                                            416.6666666666667,
                                            416.6666666666667,
                                            416.6666666666667,
                                            416.6666666666667,
                                            416.6666666666667,
                                            416.6666666666667
                                        ],
                                        "quantityPerMonth": [
                                            0.8333333333333335,
                                            0.8333333333333335,
                                            0.8333333333333335,
                                            0.8333333333333335,
                                            0.8333333333333335,
                                            0.8333333333333335,
                                            0.8333333333333335,
                                            0.8333333333333335,
                                            0.8333333333333335,
                                            0.8333333333333335,
                                            0.8333333333333335,
                                            0.8333333333333335
                                        ]
                                    }
                                }],
                                "total": {
                                    "value": 5000,
                                    "valuePerMonth": [
                                        416.6666666666667,
                                        416.6666666666667,
                                        416.6666666666667,
                                        416.6666666666667,
                                        416.6666666666667,
                                        416.6666666666667,
                                        416.6666666666667,
                                        416.6666666666667,
                                        416.6666666666667,
                                        416.6666666666667,
                                        416.6666666666667,
                                        416.6666666666667
                                    ],
                                    "quantityPerMonth": [
                                        0.8333333333333335,
                                        0.8333333333333335,
                                        0.8333333333333335,
                                        0.8333333333333335,
                                        0.8333333333333335,
                                        0.8333333333333335,
                                        0.8333333333333335,
                                        0.8333333333333335,
                                        0.8333333333333335,
                                        0.8333333333333335,
                                        0.8333333333333335,
                                        0.8333333333333335
                                    ]
                                }
                            }, {
                                "code": "EXP",
                                "name": "Expenses",
                                "productCategoryGroups": [],
                                "total": {
                                    "value": 0
                                }
                            }]
                        },
                        "createdAt": "2015-12-03T11:51:24.338+0000",
                        "createdBy": "wlee",
                        "updatedAt": "2015-12-03T11:51:24.338+0000",
                        "updatedBy": "wlee",
                        "$id": 127,
                        "$uri": "production-schedules/3861",
                        "$complete": true,
                        "$dirty": false,
                        "$local": false,
                        "$saved": true
                    }]
                },
                "monthlyStatement": [],
                "assetStatement": {
                    "medium-term": [{
                        "name": "Breeding Stock",
                        "estimatedValue": 0,
                        "currentRMV": 0,
                        "yearlyRMV": [
                            0,
                            0
                        ],
                        "assets": [{
                            "data": {
                                "name": "Breeding Stock",
                                "liquidityType": "medium-term"
                            }
                        }]
                    }],
                    "short-term": [{
                        "name": "Marketable Livestock",
                        "estimatedValue": 0,
                        "currentRMV": 0,
                        "yearlyRMV": [
                            0,
                            0
                        ],
                        "assets": [{
                            "data": {
                                "name": "Marketable Livestock",
                                "liquidityType": "short-term"
                            }
                        }]
                    }],
                    "total": {
                        "estimatedValue": 0,
                        "currentRMV": 0,
                        "yearlyRMV": [
                            0,
                            0
                        ]
                    }
                },
                "liabilityStatement": {
                    "total": {
                        "currentValue": 0,
                        "yearlyValues": [
                            0,
                            0
                        ]
                    }
                },
                "adjustmentFactors": {},
                "livestockValues": {
                    "breeding": {
                        "stockSales": [
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0
                        ],
                        "stockPurchases": [
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0
                        ]
                    },
                    "marketable": {}
                },
                "startDate": "2015-12",
                "farmer": {
                    "id": 2858,
                    "email": "at3@mailinator.com",
                    "name": "AFRP TEST 3",
                    "hostUrl": "https://test-service-farmer.agrista.com",
                    "registered": false,
                    "authorised": false,
                    "status": "active",
                    "uuid": "60b3fbdd-c0be-489b-9624-6d65bddadcb4",
                    "operationType": "Commercial",
                    "organizationId": 1,
                    "createdAt": "2015-12-03T11:38:59.829+0000",
                    "data": {
                        "enterprises": [
                            "Barley"
                        ],
                        "profileCompletion": {
                            "Capture homestead location": true,
                            "Locate farm portions": true,
                            "Capture customer segmentation": true,
                            "Link legal entities to CIF": false
                        },
                        "mapImage": {
                            "upToDate": false
                        },
                        "loc": {
                            "type": "Point",
                            "coordinates": [
                                26.371479034423828, -29.196751868636866
                            ]
                        }
                    },
                    "activeFlags": [{
                        "id": 251,
                        "referenceId": 2858,
                        "status": "open",
                        "data": {
                            "linkIds": []
                        },
                        "createdAt": "2015-12-03T11:38:59.858+0000",
                        "updatedAt": "2015-12-03T11:38:59.858+0000",
                        "createdBy": "wlee",
                        "updatedBy": "wlee",
                        "flag": {
                            "id": 4,
                            "name": "incomplete customer portfolio",
                            "organizationId": 1,
                            "type": "warning",
                            "referenceType": "organization",
                            "createdAt": "2015-08-12T15:02:20.887+0000",
                            "updatedAt": "2015-08-12T15:02:20.887+0000",
                            "createdBy": "unknown",
                            "updatedBy": "unknown"
                        }
                    }],
                    "$id": 2858,
                    "$uri": "farmers",
                    "$complete": true,
                    "$dirty": false,
                    "$local": false,
                    "$saved": true,
                    "activities": [{
                        "id": 4453,
                        "date": "2015-12-03T11:51:26.556+0000",
                        "action": "create",
                        "referenceType": "document",
                        "organization": {
                            "id": 2858,
                            "email": "at3@mailinator.com",
                            "name": "AFRP TEST 3",
                            "hostUrl": "https://test-service-farmer.agrista.com",
                            "registered": false,
                            "status": "active",
                            "uuid": "60b3fbdd-c0be-489b-9624-6d65bddadcb4",
                            "operationType": "Commercial",
                            "organizationId": 1,
                            "createdAt": "2015-12-03T11:38:59.829+0000"
                        },
                        "document": {
                            "id": 2818,
                            "author": "Absa",
                            "title": "AFRP TEST 3",
                            "createdAt": "2015-12-03T11:51:26.550+0000",
                            "docType": "financial resource plan",
                            "organizationId": 2858,
                            "documentId": "FRP-15-002818"
                        },
                        "actor": {
                            "id": 11,
                            "email": "william.lee@agrista.com",
                            "firstName": "William",
                            "lastName": "Lee",
                            "username": "wlee",
                            "position": "Developer",
                            "uid": "wlee",
                            "displayName": "William Lee",
                            "company": "Absa"
                        },
                        "organizationId": 2858,
                        "documentId": 2818,
                        "$id": 4453,
                        "$uri": "activities/2858",
                        "$complete": true,
                        "$dirty": false,
                        "$local": false,
                        "$saved": true
                    }, {
                        "id": 4452,
                        "date": "2015-12-03T11:38:59.835+0000",
                        "action": "create",
                        "referenceType": "farmer",
                        "organization": {
                            "id": 2858,
                            "email": "at3@mailinator.com",
                            "name": "AFRP TEST 3",
                            "hostUrl": "https://test-service-farmer.agrista.com",
                            "registered": false,
                            "status": "active",
                            "uuid": "60b3fbdd-c0be-489b-9624-6d65bddadcb4",
                            "operationType": "Commercial",
                            "organizationId": 1,
                            "createdAt": "2015-12-03T11:38:59.829+0000"
                        },
                        "actor": {
                            "id": 11,
                            "email": "william.lee@agrista.com",
                            "firstName": "William",
                            "lastName": "Lee",
                            "username": "wlee",
                            "position": "Developer",
                            "uid": "wlee",
                            "displayName": "William Lee",
                            "company": "Absa"
                        },
                        "organizationId": 2858,
                        "$id": 4452,
                        "$uri": "activities/2858",
                        "$complete": true,
                        "$dirty": false,
                        "$local": false,
                        "$saved": true
                    }]
                },
                "farms": [{
                    "id": 2865,
                    "farmerId": 2858,
                    "name": "Fairview 531",
                    "data": {
                        "fields": [{
                            "irrigated": false,
                            "source": "cadastral",
                            "size": 10,
                            "sgKey": 656035,
                            "loc": {
                                "type": "MultiPolygon",
                                "coordinates": [
                                    [
                                        [
                                            [
                                                26.3748107382023, -29.1905243660902
                                            ],
                                            [
                                                26.3733615713528, -29.1945155776026
                                            ],
                                            [
                                                26.3708353831752, -29.193102672462
                                            ],
                                            [
                                                26.3711049779362, -29.192405451009
                                            ],
                                            [
                                                26.3697211355055, -29.1917362800767
                                            ],
                                            [
                                                26.3707809638645, -29.1886428579093
                                            ],
                                            [
                                                26.3748107382023, -29.1905243660902
                                            ]
                                        ]
                                    ]
                                ]
                            },
                            "farmName": "Fairview 531",
                            "fieldName": "Crop Field 1",
                            "soilTexture": "Loamy Sand",
                            "effectiveDepth": "30 - 60cm",
                            "landUse": "Cropland",
                            "croppingPotential": "Medium"
                        }]
                    },
                    "$id": 2865,
                    "$uri": "farms/2858",
                    "$complete": true,
                    "$dirty": false,
                    "$local": false,
                    "$saved": true
                }],
                "legalEntities": [{
                    "id": 2945,
                    "createdAt": "2015-12-03T11:38:59.833+0000",
                    "createdBy": "wlee",
                    "organizationId": 2858,
                    "name": "AT3",
                    "email": "at3@mailinator.com",
                    "contactName": "AT3",
                    "uuid": "bca64631-abae-4a2b-a373-2da1299a0c09",
                    "isPrimary": true,
                    "isActive": true,
                    "$id": 2945,
                    "$uri": "legalentities/2858",
                    "$complete": true,
                    "$dirty": false,
                    "$local": false,
                    "$saved": true,
                    "liabilities": []
                }],
                "assets": {
                    "farmland": [{
                        "id": 3860,
                        "legalEntityId": 2945,
                        "farmId": 2865,
                        "assetKey": "entity.bca64631-abae-4a2b-a373-2da1299a0c09-F00300000000053100003",
                        "data": {
                            "source": "cadastral",
                            "portionNumber": 3,
                            "remainder": false,
                            "officialFarmName": "FAIRVIEW",
                            "farmNumber": "531",
                            "province": "Free State",
                            "area": 135.9662634669449,
                            "sgKey": "F00300000000053100003",
                            "loc": {
                                "type": "MultiPolygon",
                                "coordinates": [
                                    [
                                        [
                                            [
                                                26.367685, -29.182967
                                            ],
                                            [
                                                26.370365, -29.184362
                                            ],
                                            [
                                                26.375687, -29.187987
                                            ],
                                            [
                                                26.374835, -29.190462
                                            ],
                                            [
                                                26.37157, -29.199957
                                            ],
                                            [
                                                26.370005, -29.199412
                                            ],
                                            [
                                                26.363781, -29.197247
                                            ],
                                            [
                                                26.363021, -29.196983
                                            ],
                                            [
                                                26.363372, -29.195929
                                            ],
                                            [
                                                26.364339, -29.193023
                                            ],
                                            [
                                                26.365108, -29.190709
                                            ],
                                            [
                                                26.365973, -29.188109
                                            ],
                                            [
                                                26.366793, -29.185644
                                            ],
                                            [
                                                26.367613, -29.183181
                                            ],
                                            [
                                                26.367685, -29.182967
                                            ]
                                        ]
                                    ]
                                ]
                            },
                            "label": "Ptn. 3 of farm Fairview 531",
                            "farmLabel": "Fairview 531",
                            "portionLabel": "Ptn. 3",
                            "geocledianId": 4682
                        },
                        "type": "farmland",
                        "$id": 3860,
                        "$uri": "assets/2945",
                        "$complete": true,
                        "$dirty": false,
                        "$local": false,
                        "$saved": true,
                        "liabilities": [],
                        "productionSchedules": []
                    }],
                    "cropland": [{
                        "id": 3861,
                        "legalEntityId": 2945,
                        "farmId": 2865,
                        "assetKey": "entity.bca64631-abae-4a2b-a373-2da1299a0c09-f.Fairview 531-fi.Crop Field 1",
                        "data": {
                            "attachments": [],
                            "zones": [],
                            "fieldName": "Crop Field 1",
                            "irrigated": false,
                            "size": 10,
                            "loc": {
                                "type": "MultiPolygon",
                                "coordinates": [
                                    [
                                        [
                                            [
                                                26.3748107382023, -29.1905243660902
                                            ],
                                            [
                                                26.3733615713528, -29.1945155776026
                                            ],
                                            [
                                                26.3708353831752, -29.193102672462
                                            ],
                                            [
                                                26.3711049779362, -29.192405451009
                                            ],
                                            [
                                                26.3697211355055, -29.1917362800767
                                            ],
                                            [
                                                26.3707809638645, -29.1886428579093
                                            ],
                                            [
                                                26.3748107382023, -29.1905243660902
                                            ]
                                        ]
                                    ]
                                ]
                            },
                            "equipped": false
                        },
                        "type": "cropland",
                        "$id": 3861,
                        "$uri": "assets/2945",
                        "$complete": true,
                        "$dirty": false,
                        "$local": false,
                        "$saved": true,
                        "liabilities": [],
                        "productionSchedules": [{
                            "id": 127,
                            "assetId": 3861,
                            "organizationId": 2858,
                            "budgetUuid": "1de6447f-475d-4682-8d64-10d49c612535",
                            "type": "crop",
                            "startDate": "2015-11-30T23:00:00.000+0000",
                            "endDate": "2016-11-30T23:00:00.000+0000",
                            "data": {
                                "details": {
                                    "budgetName": "FRP BARLEY 3",
                                    "commodity": "Barley",
                                    "fieldName": "Crop Field 1",
                                    "grossProfit": 5000,
                                    "size": 10
                                },
                                "sections": [{
                                    "code": "INC",
                                    "name": "Income",
                                    "productCategoryGroups": [{
                                        "code": "INC-CPS",
                                        "name": "Crop Sales",
                                        "productCategories": [{
                                            "code": "INC-HVT-CROP",
                                            "name": "Crop",
                                            "unit": "t",
                                            "pricePerUnit": 500,
                                            "quantity": 10,
                                            "value": 5000,
                                            "valuePerMonth": [
                                                416.6666666666667,
                                                416.6666666666667,
                                                416.6666666666667,
                                                416.6666666666667,
                                                416.6666666666667,
                                                416.6666666666667,
                                                416.6666666666667,
                                                416.6666666666667,
                                                416.6666666666667,
                                                416.6666666666667,
                                                416.6666666666667,
                                                416.6666666666667
                                            ],
                                            "quantityPerMonth": [
                                                0.8333333333333335,
                                                0.8333333333333335,
                                                0.8333333333333335,
                                                0.8333333333333335,
                                                0.8333333333333335,
                                                0.8333333333333335,
                                                0.8333333333333335,
                                                0.8333333333333335,
                                                0.8333333333333335,
                                                0.8333333333333335,
                                                0.8333333333333335,
                                                0.8333333333333335
                                            ]
                                        }],
                                        "total": {
                                            "value": 5000,
                                            "valuePerMonth": [
                                                416.6666666666667,
                                                416.6666666666667,
                                                416.6666666666667,
                                                416.6666666666667,
                                                416.6666666666667,
                                                416.6666666666667,
                                                416.6666666666667,
                                                416.6666666666667,
                                                416.6666666666667,
                                                416.6666666666667,
                                                416.6666666666667,
                                                416.6666666666667
                                            ],
                                            "quantityPerMonth": [
                                                0.8333333333333335,
                                                0.8333333333333335,
                                                0.8333333333333335,
                                                0.8333333333333335,
                                                0.8333333333333335,
                                                0.8333333333333335,
                                                0.8333333333333335,
                                                0.8333333333333335,
                                                0.8333333333333335,
                                                0.8333333333333335,
                                                0.8333333333333335,
                                                0.8333333333333335
                                            ]
                                        }
                                    }],
                                    "total": {
                                        "value": 5000,
                                        "valuePerMonth": [
                                            416.6666666666667,
                                            416.6666666666667,
                                            416.6666666666667,
                                            416.6666666666667,
                                            416.6666666666667,
                                            416.6666666666667,
                                            416.6666666666667,
                                            416.6666666666667,
                                            416.6666666666667,
                                            416.6666666666667,
                                            416.6666666666667,
                                            416.6666666666667
                                        ],
                                        "quantityPerMonth": [
                                            0.8333333333333335,
                                            0.8333333333333335,
                                            0.8333333333333335,
                                            0.8333333333333335,
                                            0.8333333333333335,
                                            0.8333333333333335,
                                            0.8333333333333335,
                                            0.8333333333333335,
                                            0.8333333333333335,
                                            0.8333333333333335,
                                            0.8333333333333335,
                                            0.8333333333333335
                                        ]
                                    }
                                }, {
                                    "code": "EXP",
                                    "name": "Expenses",
                                    "productCategoryGroups": [],
                                    "total": {
                                        "value": 0
                                    }
                                }]
                            },
                            "createdAt": "2015-12-03T11:51:24.338+0000",
                            "createdBy": "wlee",
                            "updatedAt": "2015-12-03T11:51:24.338+0000",
                            "updatedBy": "wlee",
                            "$id": 127,
                            "$uri": "production-schedules/3861",
                            "$complete": true,
                            "$dirty": false,
                            "$local": false,
                            "$saved": true
                        }]
                    }]
                },
                "liabilities": [],
                "endDate": "2017-12-01T01:00:00+01:00",
                "productionIncome": {
                    "Barley": [
                        416.6666666666667,
                        416.6666666666667,
                        416.6666666666667,
                        416.6666666666667,
                        416.6666666666667,
                        416.6666666666667,
                        416.6666666666667,
                        416.6666666666667,
                        416.6666666666667,
                        416.6666666666667,
                        416.6666666666667,
                        416.6666666666667,
                        0,
                        0,
                        0,
                        0,
                        0,
                        0,
                        0,
                        0,
                        0,
                        0,
                        0,
                        0
                    ]
                },
                "productionExpenditure": {},
                "productionIncomeComposition": [{
                    "Barley": {
                        "unit": "t",
                        "pricePerUnit": 500,
                        "quantity": 10.000000000000005,
                        "value": 5000,
                        "contributionPercent": 100
                    },
                    "total": {
                        "value": 5000
                    }
                }, {
                    "Barley": {
                        "unit": "t",
                        "pricePerUnit": 500,
                        "quantity": 0.8333333333333335,
                        "value": 416.6666666666667,
                        "contributionPercent": 100
                    },
                    "total": {
                        "value": 416.6666666666667
                    }
                }],
                "summary": {
                    "monthly": {
                        "unallocatedProductionIncome": [
                            416.6666666666667,
                            416.6666666666667,
                            416.6666666666667,
                            416.6666666666667,
                            416.6666666666667,
                            416.6666666666667,
                            416.6666666666667,
                            416.6666666666667,
                            416.6666666666667,
                            416.6666666666667,
                            416.6666666666667,
                            416.6666666666667,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0
                        ],
                        "productionIncome": [
                            416.6666666666667,
                            416.6666666666667,
                            416.6666666666667,
                            416.6666666666667,
                            416.6666666666667,
                            416.6666666666667,
                            416.6666666666667,
                            416.6666666666667,
                            416.6666666666667,
                            416.6666666666667,
                            416.6666666666667,
                            416.6666666666667,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0
                        ],
                        "capitalIncome": [
                            416.6666666666667,
                            416.6666666666667,
                            416.6666666666667,
                            416.6666666666667,
                            416.6666666666667,
                            416.6666666666667,
                            416.6666666666667,
                            416.6666666666667,
                            416.6666666666667,
                            416.6666666666667,
                            416.6666666666667,
                            416.6666666666667,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0
                        ],
                        "otherIncome": [
                            833.3333333333334,
                            833.3333333333334,
                            833.3333333333334,
                            833.3333333333334,
                            833.3333333333334,
                            833.3333333333334,
                            833.3333333333334,
                            833.3333333333334,
                            833.3333333333334,
                            833.3333333333334,
                            833.3333333333334,
                            833.3333333333334,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0
                        ],
                        "totalIncome": [
                            416.6666666666667,
                            416.6666666666667,
                            416.6666666666667,
                            416.6666666666667,
                            416.6666666666667,
                            416.6666666666667,
                            416.6666666666667,
                            416.6666666666667,
                            416.6666666666667,
                            416.6666666666667,
                            416.6666666666667,
                            416.6666666666667,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0
                        ],
                        "unallocatedProductionExpenditure": [
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0
                        ],
                        "productionExpenditure": [
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0
                        ],
                        "capitalExpenditure": [
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0
                        ],
                        "otherExpenditure": [
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0
                        ],
                        "debtRedemption": [
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0
                        ],
                        "totalExpenditure": [
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0
                        ],
                        "primaryAccountInterest": [
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0
                        ],
                        "productionCreditInterest": [
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0
                        ],
                        "mediumTermInterest": [
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0
                        ],
                        "longTermInterest": [
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0
                        ],
                        "totalInterest": [
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0
                        ],
                        "currentLiabilities": [
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0
                        ],
                        "mediumLiabilities": [
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0
                        ],
                        "longLiabilities": [
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0
                        ],
                        "totalLiabilities": [
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0
                        ],
                        "totalRent": [
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0
                        ]
                    },
                    "yearly": {
                        "unallocatedProductionIncome": [
                            5000,
                            0
                        ],
                        "productionIncome": [
                            5000,
                            0
                        ],
                        "capitalIncome": [
                            5000,
                            0
                        ],
                        "otherIncome": [
                            10000,
                            0
                        ],
                        "totalIncome": [
                            5000,
                            0
                        ],
                        "unallocatedProductionExpenditure": [
                            0,
                            0
                        ],
                        "productionExpenditure": [
                            0,
                            0
                        ],
                        "capitalExpenditure": [
                            0,
                            0
                        ],
                        "otherExpenditure": [
                            0,
                            0
                        ],
                        "debtRedemption": [
                            0,
                            0
                        ],
                        "totalExpenditure": [
                            0,
                            0
                        ],
                        "primaryAccountInterest": [
                            0,
                            0
                        ],
                        "productionCreditInterest": [
                            0,
                            0
                        ],
                        "mediumTermInterest": [
                            0,
                            0
                        ],
                        "longTermInterest": [
                            0,
                            0
                        ],
                        "totalInterest": [
                            0,
                            0
                        ],
                        "currentLiabilities": {
                            "currentValue": 0,
                            "yearlyValues": [
                                0,
                                0
                            ]
                        },
                        "mediumLiabilities": {
                            "currentValue": 0,
                            "yearlyValues": [
                                0,
                                0
                            ]
                        },
                        "longLiabilities": {
                            "currentValue": 0,
                            "yearlyValues": [
                                0,
                                0
                            ]
                        },
                        "totalLiabilities": [
                            0,
                            0
                        ],
                        "totalRent": [
                            0,
                            0
                        ],
                        "currentAssets": {
                            "estimatedValue": 0,
                            "currentRMV": 0,
                            "yearlyRMV": [
                                0,
                                0
                            ]
                        },
                        "movableAssets": {
                            "estimatedValue": 0,
                            "currentRMV": 0,
                            "yearlyRMV": [
                                0,
                                0
                            ]
                        },
                        "fixedAssets": {
                            "estimatedValue": 0,
                            "currentRMV": 0,
                            "yearlyRMV": [
                                0,
                                0
                            ]
                        },
                        "totalAssets": [
                            0,
                            0
                        ],
                        "depreciation": [
                            0,
                            0
                        ],
                        "netFarmIncome": [
                            5000,
                            0
                        ],
                        "farmingProfitOrLoss": [
                            5000,
                            0
                        ]
                    }
                },
                "ratios": {
                    "interestCover": {
                        "monthly": [],
                        "yearly": [
                            0,
                            0
                        ]
                    },
                    "inputOutput": {
                        "monthly": [
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0
                        ],
                        "yearly": [
                            0,
                            0
                        ]
                    },
                    "productionCost": {
                        "monthly": [
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0
                        ],
                        "yearly": [
                            0,
                            0
                        ]
                    },
                    "cashFlowBank": {
                        "monthly": [
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0
                        ],
                        "yearly": [
                            0,
                            0
                        ]
                    },
                    "cashFlowFarming": {
                        "monthly": [
                            833.3333333333334,
                            833.3333333333334,
                            833.3333333333334,
                            833.3333333333334,
                            833.3333333333334,
                            833.3333333333334,
                            833.3333333333334,
                            833.3333333333334,
                            833.3333333333334,
                            833.3333333333334,
                            833.3333333333334,
                            833.3333333333334,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0
                        ],
                        "yearly": [
                            10000,
                            0
                        ]
                    },
                    "debtToTurnover": {
                        "monthly": [
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0
                        ],
                        "yearly": [
                            0,
                            0
                        ]
                    },
                    "interestToTurnover": {
                        "monthly": [
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0
                        ],
                        "yearly": [
                            0,
                            0
                        ]
                    },
                    "returnOnInvestment": {
                        "monthly": [],
                        "yearly": [
                            0,
                            0
                        ]
                    },
                    "netCapital": {
                        "yearly": [
                            0,
                            0
                        ],
                        "currentRMV": 0,
                        "estimatedValue": 0
                    },
                    "gearing": {
                        "yearly": [
                            0,
                            0
                        ],
                        "currentRMV": 0,
                        "estimatedValue": 0
                    },
                    "debt": {
                        "yearly": [
                            0,
                            0
                        ],
                        "currentRMV": 0,
                        "estimatedValue": 0
                    }
                },
                "attachments": [],
                "unallocatedProductionIncome": {
                    "Barley": [
                        416.6666666666667,
                        416.6666666666667,
                        416.6666666666667,
                        416.6666666666667,
                        416.6666666666667,
                        416.6666666666667,
                        416.6666666666667,
                        416.6666666666667,
                        416.6666666666667,
                        416.6666666666667,
                        416.6666666666667,
                        416.6666666666667,
                        0,
                        0,
                        0,
                        0,
                        0,
                        0,
                        0,
                        0,
                        0,
                        0,
                        0,
                        0
                    ]
                },
                "unallocatedProductionExpenditure": {},
                "capitalIncome": {
                    "Livestock Sales": [
                        0,
                        0,
                        0,
                        0,
                        0,
                        0,
                        0,
                        0,
                        0,
                        0,
                        0,
                        0,
                        0,
                        0,
                        0,
                        0,
                        0,
                        0,
                        0,
                        0,
                        0,
                        0,
                        0,
                        0
                    ]
                },
                "capitalExpenditure": {
                    "Livestock Purchases": [
                        0,
                        0,
                        0,
                        0,
                        0,
                        0,
                        0,
                        0,
                        0,
                        0,
                        0,
                        0,
                        0,
                        0,
                        0,
                        0,
                        0,
                        0,
                        0,
                        0,
                        0,
                        0,
                        0,
                        0
                    ]
                },
                "otherIncome": {},
                "otherExpenditure": {},
                "debtRedemption": {}
            },
            docType: 'financial resource plan',
            organizationId: 2858,
            documentId: 'FRP-15-002818'
        });

        productionSchedules = [
            {
                "id": 127,
                "assetId": 3861,
                "organizationId": 2858,
                "budgetUuid": "1de6447f-475d-4682-8d64-10d49c612535",
                "type": "crop",
                "startDate": "2015-11-30T23:00:00.000+0000",
                "endDate": "2016-11-30T23:00:00.000+0000",
                "data": {
                    "details": {
                        "budgetName": "FRP BARLEY 3",
                        "commodity": "Barley",
                        "fieldName": "Crop Field 1",
                        "grossProfit": 5000,
                        "size": 10
                    },
                    "sections": [
                        {
                            "code": "INC",
                            "name": "Income",
                            "productCategoryGroups": [
                                {
                                    "code": "INC-CPS",
                                    "name": "Crop Sales",
                                    "productCategories": [
                                        {
                                            "code": "INC-HVT-CROP",
                                            "name": "Crop",
                                            "unit": "t",
                                            "pricePerUnit": 500,
                                            "quantity": 10,
                                            "value": 5000,
                                            "valuePerMonth": [
                                                416.6666666666667,
                                                416.6666666666667,
                                                416.6666666666667,
                                                416.6666666666667,
                                                416.6666666666667,
                                                416.6666666666667,
                                                416.6666666666667,
                                                416.6666666666667,
                                                416.6666666666667,
                                                416.6666666666667,
                                                416.6666666666667,
                                                416.6666666666667
                                            ],
                                            "quantityPerMonth": [
                                                0.8333333333333335,
                                                0.8333333333333335,
                                                0.8333333333333335,
                                                0.8333333333333335,
                                                0.8333333333333335,
                                                0.8333333333333335,
                                                0.8333333333333335,
                                                0.8333333333333335,
                                                0.8333333333333335,
                                                0.8333333333333335,
                                                0.8333333333333335,
                                                0.8333333333333335
                                            ]
                                        }
                                    ],
                                    "total": {
                                        "value": 5000,
                                        "valuePerMonth": [
                                            416.6666666666667,
                                            416.6666666666667,
                                            416.6666666666667,
                                            416.6666666666667,
                                            416.6666666666667,
                                            416.6666666666667,
                                            416.6666666666667,
                                            416.6666666666667,
                                            416.6666666666667,
                                            416.6666666666667,
                                            416.6666666666667,
                                            416.6666666666667
                                        ],
                                        "quantityPerMonth": [
                                            0.8333333333333335,
                                            0.8333333333333335,
                                            0.8333333333333335,
                                            0.8333333333333335,
                                            0.8333333333333335,
                                            0.8333333333333335,
                                            0.8333333333333335,
                                            0.8333333333333335,
                                            0.8333333333333335,
                                            0.8333333333333335,
                                            0.8333333333333335,
                                            0.8333333333333335
                                        ]
                                    }
                                }
                            ],
                            "total": {
                                "value": 5000,
                                "valuePerMonth": [
                                    416.6666666666667,
                                    416.6666666666667,
                                    416.6666666666667,
                                    416.6666666666667,
                                    416.6666666666667,
                                    416.6666666666667,
                                    416.6666666666667,
                                    416.6666666666667,
                                    416.6666666666667,
                                    416.6666666666667,
                                    416.6666666666667,
                                    416.6666666666667
                                ],
                                "quantityPerMonth": [
                                    0.8333333333333335,
                                    0.8333333333333335,
                                    0.8333333333333335,
                                    0.8333333333333335,
                                    0.8333333333333335,
                                    0.8333333333333335,
                                    0.8333333333333335,
                                    0.8333333333333335,
                                    0.8333333333333335,
                                    0.8333333333333335,
                                    0.8333333333333335,
                                    0.8333333333333335
                                ]
                            }
                        },
                        {
                            "code": "EXP",
                            "name": "Expenses",
                            "productCategoryGroups": [],
                            "total": {
                                "value": 0
                            }
                        }
                    ]
                },
                "createdAt": "2015-12-03T11:51:24.338+0000",
                "createdBy": "wlee",
                "updatedAt": "2015-12-03T11:51:24.338+0000",
                "updatedBy": "wlee",
                "$id": 127,
                "$uri": "production-schedules/3861",
                "$complete": true,
                "$dirty": false,
                "$local": false,
                "$saved": true
            }
        ];

        liability = {
            "id": 61,
            "uuid": "a8411b84-d178-4901-d59d-0ed0a6b067cf",
            "merchantUuid": "dc765027-e592-42a1-b6c6-601971074855",
            "type": "production-credit",
            "openingBalance": 0,
            "creditLimit": 500,
            "interestRate": 0,
            "frequency": "custom",
            "startDate": "2015-12-01T00:00:00.000+0000",
            "data": {
                "subtype": "off-taker",
                "legalEntityId": 2945,
                "customRepayments": {},
                "commodities": ["Barley"],
                "inputs": ["Seed"],
                "monthly": [{
                    "opening": 0,
                    "repayment": {
                        "production": 0
                    },
                    "withdrawal": 0,
                    "balance": 0,
                    "interest": 0,
                    "closing": 0
                }, {
                    "opening": 0,
                    "repayment": {
                        "production": 0,
                        "bank": 0
                    },
                    "withdrawal": 0,
                    "balance": 0,
                    "interest": 0,
                    "closing": 0
                }, {
                    "opening": 0,
                    "repayment": {
                        "production": 0
                    },
                    "withdrawal": 0,
                    "balance": 0,
                    "interest": 0,
                    "closing": 0
                }, {
                    "opening": 0,
                    "repayment": {
                        "production": 0
                    },
                    "withdrawal": 0,
                    "balance": 0,
                    "interest": 0,
                    "closing": 0
                }, {
                    "opening": 0,
                    "repayment": {
                        "production": 0
                    },
                    "withdrawal": 0,
                    "balance": 0,
                    "interest": 0,
                    "closing": 0
                }, {
                    "opening": 0,
                    "repayment": {
                        "production": 0
                    },
                    "withdrawal": 0,
                    "balance": 0,
                    "interest": 0,
                    "closing": 0
                }, {
                    "opening": 0,
                    "repayment": {
                        "production": 0
                    },
                    "withdrawal": 0,
                    "balance": 0,
                    "interest": 0,
                    "closing": 0
                }, {
                    "opening": 0,
                    "repayment": {
                        "production": 0
                    },
                    "withdrawal": 0,
                    "balance": 0,
                    "interest": 0,
                    "closing": 0
                }, {
                    "opening": 0,
                    "repayment": {
                        "production": 0
                    },
                    "withdrawal": 0,
                    "balance": 0,
                    "interest": 0,
                    "closing": 0
                }, {
                    "opening": 0,
                    "repayment": {
                        "production": 0
                    },
                    "withdrawal": 0,
                    "balance": 0,
                    "interest": 0,
                    "closing": 0
                }, {
                    "opening": 0,
                    "repayment": {
                        "production": 0
                    },
                    "withdrawal": 0,
                    "balance": 0,
                    "interest": 0,
                    "closing": 0
                }, {
                    "opening": 0,
                    "repayment": {
                        "production": 0
                    },
                    "withdrawal": 0,
                    "balance": 0,
                    "interest": 0,
                    "closing": 0
                }]
            },
            "createdAt": "2015-12-08T09:36:48.102+0000",
            "createdBy": "wlee",
            "updatedAt": "2015-12-08T09:36:48.102+0000",
            "updatedBy": "wlee",
            "merchant": {
                "id": 3,
                "email": "danie.ca@telkomsa.net",
                "name": "Cillie and Associates CC",
                "registered": true,
                "uuid": "dc765027-e592-42a1-b6c6-601971074855",
                "organizationId": 1,
                "services": [{
                    "id": 1,
                    "serviceType": "Valuation"
                }],
                "partnerType": "benefit"
            }
        }

    });

    describe('production credit module', function() {
        it('recalculates with new liabilities', function() {
            businessPlan.addLiability(liability);
            expect(businessPlan.models.liabilities instanceof Array).toBe(true);
            expect(businessPlan.models.liabilities.length).toBe(1);

            var addLiability = businessPlan.models.liabilities[0];
            expect(addLiability).not.toBeUndefined(true);
            expect(addLiability.data).not.toBeUndefined(true);
            expect(addLiability.data.commodities).toEqual(['Barley']);
            expect(addLiability.data.inputs).toEqual(['Seed']);
            expect(addLiability.data.monthly instanceof Array).toBe(true);
            expect(addLiability.data.monthly.length).toBe(12);
            //expect(addLiability.data.monthly[0].opening).toBe(500);
            //expect(Math.round(addLiability.data.monthly[0].repayment.production)).toBe(416);

        })
    });
});