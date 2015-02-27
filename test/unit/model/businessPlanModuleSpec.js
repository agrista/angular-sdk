describe('ag.sdk.model.business-plan', function () {
    var Mocks, Model, BusinessPlan;
    beforeEach(module('ag.sdk.model.base'));
    beforeEach(module('ag.test.model.mocks'));
    beforeEach(module('ag.sdk.model.business-plan'));
    beforeEach(inject(['BusinessPlan', 'Model', 'mocks', function(_BusinessPlan_, _Model_, _mocks_) {
        Model = _Model_;
        Mocks = _mocks_;
        BusinessPlan = _BusinessPlan_;
    }]));

    describe('initialization', function () {
        var businessPlan;

        beforeEach(function () {
            businessPlan = BusinessPlan.new({
                author: 'Agrista',
                title: 'Business Time',
                organizationId: 1,
                data: {
                    startDate: '2015-10-10T10:20:00'
                }
            });
        });

        it('adds docTypes to the class', function () {
            expect(BusinessPlan.docTypes).toBeDefined(true);
        });

        it('validates the author length', function () {
            expect(businessPlan.validate()).toBe(true);

            businessPlan.author = '';
            expect(businessPlan.validate()).toBe(false);

            businessPlan.author = 'Lorem ipsum dolor sit amet, consectetur adiepiscing elit. Vivamus sit amet sollicitudin tellus. Nulla facilisi. Vestibulum erat urna, euismod at posuere ullamcorper, ultrices in lacus. Aenean molestie odio ac vestibulum molestie. Quisque id fringilla amet.';
            expect(businessPlan.validate()).toBe(false);
        });

        it('validates the title length', function () {
            expect(businessPlan.validate()).toBe(true);

            businessPlan.title = '';
            expect(businessPlan.validate()).toBe(false);

            businessPlan.title = 'Lorem ipsum dolor sit amet, consectetur adiepiscing elit. Vivamus sit amet sollicitudin tellus. Nulla facilisi. Vestibulum erat urna, euismod at posuere ullamcorper, ultrices in lacus. Aenean molestie odio ac vestibulum molestie. Quisque id fringilla amet.';
            expect(businessPlan.validate()).toBe(false);
        });

        it('validates the docType is set automatically', function () {
            expect(businessPlan.validate()).toBe(true);
            businessPlan.docType = 'not a docType';
            expect(businessPlan.validate()).toBe(false);
        });

        it('validates the organizationId', function () {
            expect(businessPlan.validate()).toBe(true);

            businessPlan.organizationId = 'Not a number';
            expect(businessPlan.validate()).toBe(false);

            businessPlan.organizationId = undefined;
            expect(businessPlan.validate()).toBe(false);
        });

        it('adds productionPlan on the instance', function () {
            expect(businessPlan.productionPlan).toBeUndefined();

            var productionPlan = {
                docType: 'production plan'
            };

            businessPlan.productionPlan = productionPlan;

            expect(businessPlan.productionPlan).toEqual(productionPlan);
        });

        it('validates startDate as a date', function () {
            expect(businessPlan.validate()).toBe(true);

            businessPlan.data.startDate = 'this is not a date';
            expect(businessPlan.validate()).toBe(false);
        });

        it('validates endDate as a date', function () {
            expect(businessPlan.endDate).toEqual('2017-10-10T10:20:00+02:00');

            businessPlan.data.startDate = '2017-10-10T10:20:00';
            expect(businessPlan.endDate).toEqual('2019-10-10T10:20:00+02:00');
        });

        it('does not add plannedAssets on the instance', function () {
            expect(businessPlan.models.assets).toEqual([]);
        });

        it('does not add an invalid asset', function () {
            expect(businessPlan.models.assets).toEqual([]);

            businessPlan.addAsset({});
            expect(businessPlan.models.assets.length).toBe(0);
        });

        it('adds a valid asset', function () {
            businessPlan.addAsset({
                assetKey: 'asset key',
                legalEntityId: 1,
                type: 'crop'
            });
            expect(businessPlan.models.assets.length).toBe(1);
        });

        it('adds plannedLiabilities on the instance', function () {
            expect(businessPlan.models.liabilities).toEqual([]);

            businessPlan.addLiability({});
            expect(businessPlan.models.liabilities.length).toBe(1);
        });
    });

    describe('adding models', function () {
        var businessPlan;

        beforeEach(function () {
            businessPlan = BusinessPlan.new({
                author: 'Agrista',
                title: 'Business Time',
                organizationId: 1,
                data: {
                    startDate: '2015-10-10T10:20:00'
                }
            });

            businessPlan.updateRegister({
                id: 1,
                name: 'Dave Roundtree Farms',
                legalEntities: [{
                    id: 2,
                    uuid: '19CD56FC-DFD6-4338-88E5-00571685F707',
                    assets: [{
                        id: 3,
                        legalEntityId: 2,
                        assetKey: 'CBAAFB3B-B0C3-4CD2-9091-0943578BC5AC',
                        type: 'improvement',
                        data: {
                            name: 'Barn',
                            category: 'Farm Buildings',
                            financing: {
                                financed: true,
                                installment: 10000,
                                interestRate: 1,
                                legalEntityId: 2,
                                openingBalance: 100000,
                                organizationName: 'John Vickers',
                                paymentFrequency: 'Monthly',
                                paymentStart: '2015-10-10T10:20:00'
                            }
                        }
                    }, {
                        id: 4,
                        legalEntityId: 2,
                        assetKey: '3D7C250A-A9D0-455B-97C0-F9499B7C079B',
                        type: 'improvement',
                        data: {
                            name: 'Office',
                            category: 'Office Buildings',
                            financing: {
                                financed: true,
                                installment: 10000,
                                interestRate: 1,
                                legalEntityId: 2,
                                openingBalance: 500000,
                                organizationName: 'John Vickers',
                                paymentFrequency: 'Monthly',
                                paymentStart: '2015-10-10T10:20:00'
                            }
                        }
                    }, {
                        id: 5,
                        legalEntityId: 2,
                        assetKey: '198ADC5C-9176-4DE3-B55A-49AF861D9FE1',
                        type: 'farmland',
                        data: {
                            portionLabel: 'Portion 1 of farm'
                        }
                    }, {
                        id: 6,
                        legalEntityId: 2,
                        assetKey: 'A2F74C88-DAFE-4704-9A74-A5FB9309C2D4',
                        type: 'farmland',
                        data: {
                            portionLabel: 'Portion 1 of farm',
                            financing: {
                                leased: true,
                                installment: 1000,
                                legalEntityId: 2,
                                rentalOwner: 'John Vickers',
                                paymentFrequency: 'Quarterly',
                                paymentStart: '2015-10-10T10:20:00'
                            }
                        }
                    }]
                }]
            });
        });

        it('does not add a farm valuation improvement with no legal entity', function () {
            businessPlan.addFarmValuation({
                id: 4,
                author: 'Spectrum',
                organizationId: 1,
                type: 'farm valuation',
                data: {
                    request: {
                        legalEntity: {
                            uuid: '19CD56FC-DFD6-4338-88E5-00571685F707'
                        }
                    },
                    report: {
                        improvements: [{
                            id: 3,
                            legalEntityId: 2,
                            assetKey: 'CBAAFB3B-B0C3-4CD2-9091-0943578BC5AC',
                            type: 'improvement',
                            data: {
                                name: 'Barn',
                                category: 'Farm Buildings',
                                assetValue: 100000,
                                valuation: {}
                            }
                        }]
                    }
                }
            });

            expect(businessPlan.monthlyStatement.length).toBe(0);
        });

        it('adds and removes legal entities', function () {
            var legalEntity = {
                id: 2,
                email: 'dave@roundtree.com',
                name: 'Dave Roundtree',
                type: 'Individual',
                organizationId: 1,
                uuid: '19CD56FC-DFD6-4338-88E5-00571685F707'
            };

            businessPlan.addLegalEntity(legalEntity);

            expect(businessPlan.monthlyStatement.length).toBe(3);

            expect(businessPlan.monthlyStatement[0]).toEqual({
                uuid: 'CBAAFB3B-B0C3-4CD2-9091-0943578BC5AC',
                legalEntityUuid: '19CD56FC-DFD6-4338-88E5-00571685F707',
                name: 'Barn',
                description: 'Farm Buildings',
                type: 'improvement',
                source: 'legal entity',
                value: 0,
                liability: [10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 460.6307380880098, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
            });

            expect(businessPlan.monthlyStatement[1]).toEqual({
                uuid: '3D7C250A-A9D0-455B-97C0-F9499B7C079B',
                legalEntityUuid: '19CD56FC-DFD6-4338-88E5-00571685F707',
                name: 'Office',
                description: 'Office Buildings',
                type: 'improvement',
                source: 'legal entity',
                value: 0,
                liability: [10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000]
            });

            businessPlan.removeLegalEntity(legalEntity);

            expect(businessPlan.monthlyStatement.length).toBe(0);
        });

        it('adds a legal entity, farm valuation improvement', function () {
            businessPlan.addLegalEntity({
                id: 2,
                email: 'dave@roundtree.com',
                name: 'Dave Roundtree',
                type: 'Individual',
                organizationId: 1,
                uuid: '19CD56FC-DFD6-4338-88E5-00571685F707'
            });

            businessPlan.addFarmValuation({
                id: 4,
                author: 'Spectrum',
                organizationId: 1,
                type: 'farm valuation',
                data: {
                    request: {
                        legalEntity: {
                            uuid: '19CD56FC-DFD6-4338-88E5-00571685F707'
                        }
                    },
                    report: {
                        improvements: [{
                            id: 3,
                            legalEntityId: 2,
                            assetKey: 'CBAAFB3B-B0C3-4CD2-9091-0943578BC5AC',
                            type: 'improvement',
                            data: {
                                name: 'Barn',
                                category: 'Farm Buildings',
                                assetValue: 100000,
                                valuation: {}
                            }
                        }]
                    }
                }
            });

            expect(businessPlan.monthlyStatement.length).toBe(3);

            expect(businessPlan.monthlyStatement[0]).toEqual({
                uuid: 'CBAAFB3B-B0C3-4CD2-9091-0943578BC5AC',
                legalEntityUuid: '19CD56FC-DFD6-4338-88E5-00571685F707',
                name: 'Barn',
                description: 'Farm Buildings',
                type: 'improvement',
                source: 'farm valuation',
                value: 100000,
                liability: [10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 460.6307380880098, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
            });

            expect(businessPlan.monthlyStatement[1]).toEqual({
                uuid: '3D7C250A-A9D0-455B-97C0-F9499B7C079B',
                legalEntityUuid: '19CD56FC-DFD6-4338-88E5-00571685F707',
                name: 'Office',
                description: 'Office Buildings',
                type: 'improvement',
                source: 'legal entity',
                value: 0,
                liability: [10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000]
            });
        });

        it('adds a farm valuation improvement, legal entity', function () {
            businessPlan.addFarmValuation({
                id: 4,
                author: 'Spectrum',
                organizationId: 1,
                type: 'farm valuation',
                data: {
                    request: {
                        legalEntity: {
                            uuid: '19CD56FC-DFD6-4338-88E5-00571685F707'
                        }
                    },
                    report: {
                        improvements: [{
                            id: 3,
                            legalEntityId: 2,
                            assetKey: 'CBAAFB3B-B0C3-4CD2-9091-0943578BC5AC',
                            type: 'improvement',
                            data: {
                                name: 'Barn',
                                category: 'Farm Buildings',
                                assetValue: 100000,
                                valuation: {}
                            }
                        }]
                    }
                }
            });

            businessPlan.addLegalEntity({
                id: 2,
                email: 'dave@roundtree.com',
                name: 'Dave Roundtree',
                type: 'Individual',
                organizationId: 1,
                uuid: '19CD56FC-DFD6-4338-88E5-00571685F707'
            });

            expect(businessPlan.monthlyStatement.length).toBe(3);

            expect(businessPlan.monthlyStatement[0]).toEqual({
                uuid: 'CBAAFB3B-B0C3-4CD2-9091-0943578BC5AC',
                legalEntityUuid: '19CD56FC-DFD6-4338-88E5-00571685F707',
                name: 'Barn',
                description: 'Farm Buildings',
                type: 'improvement',
                source: 'farm valuation',
                value: 100000,
                liability: [10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 460.6307380880098, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
            });

            expect(businessPlan.monthlyStatement[1]).toEqual({
                uuid: '3D7C250A-A9D0-455B-97C0-F9499B7C079B',
                legalEntityUuid: '19CD56FC-DFD6-4338-88E5-00571685F707',
                name: 'Office',
                description: 'Office Buildings',
                type: 'improvement',
                source: 'legal entity',
                value: 0,
                liability: [10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000]
            });
        });

        it('adds a farm valuation improvement and land use, legal entity', function () {
            businessPlan.addFarmValuation({
                id: 4,
                author: 'Spectrum',
                organizationId: 1,
                type: 'farm valuation',
                data: {
                    request: {
                        legalEntity: {
                            uuid: '19CD56FC-DFD6-4338-88E5-00571685F707'
                        }
                    },
                    report: {
                        landUseComponents: {
                            'Dry Land': [{
                                name: 'Medium Potential',
                                totalValue: 100000
                            }, {
                                name: 'High Potential',
                                totalValue: 150000
                            }],
                            'Grazing': [{
                                name: 'Planted pastures',
                                totalValue: 250000
                            }]
                        },
                        improvements: [{
                            id: 3,
                            legalEntityId: 2,
                            assetKey: 'CBAAFB3B-B0C3-4CD2-9091-0943578BC5AC',
                            type: 'improvement',
                            data: {
                                name: 'Barn',
                                category: 'Farm Buildings',
                                assetValue: 100000,
                                valuation: {}
                            }
                        }]
                    }
                }
            });

            businessPlan.addLegalEntity({
                id: 2,
                email: 'dave@roundtree.com',
                name: 'Dave Roundtree',
                type: 'Individual',
                organizationId: 1,
                uuid: '19CD56FC-DFD6-4338-88E5-00571685F707'
            });

            expect(businessPlan.monthlyStatement.length).toBe(6);

            expect(businessPlan.monthlyStatement[3]).toEqual({
                uuid: 'Dry Land-Medium Potential',
                legalEntityUuid: '19CD56FC-DFD6-4338-88E5-00571685F707',
                name: 'Dry Land',
                description: 'Medium Potential',
                type: 'land use',
                source: 'farm valuation',
                value: 100000
            });

            expect(businessPlan.monthlyStatement[4]).toEqual({
                uuid: 'Dry Land-High Potential',
                legalEntityUuid: '19CD56FC-DFD6-4338-88E5-00571685F707',
                name: 'Dry Land',
                description: 'High Potential',
                type: 'land use',
                source: 'farm valuation',
                value: 150000
            });

            expect(businessPlan.monthlyStatement[5]).toEqual({
                uuid: 'Grazing-Planted pastures',
                legalEntityUuid: '19CD56FC-DFD6-4338-88E5-00571685F707',
                name: 'Grazing',
                description: 'Planted pastures',
                type: 'land use',
                source: 'farm valuation',
                value: 250000
            });
        });

        it('adds two farm valuations, sums land categories', function () {
            businessPlan.addFarmValuation({
                id: 4,
                author: 'Spectrum',
                organizationId: 1,
                type: 'farm valuation',
                data: {
                    request: {
                        legalEntity: {
                            uuid: '19CD56FC-DFD6-4338-88E5-00571685F707'
                        }
                    },
                    report: {
                        landUseComponents: {
                            'Grazing': [{
                                name: 'Planted pastures',
                                totalValue: 250000
                            }]
                        },
                        improvements: [{
                            id: 3,
                            legalEntityId: 2,
                            assetKey: 'CBAAFB3B-B0C3-4CD2-9091-0943578BC5AC',
                            type: 'improvement',
                            data: {
                                name: 'Barn',
                                category: 'Farm Buildings',
                                assetValue: 100000,
                                valuation: {}
                            }
                        }]
                    }
                }
            });

            businessPlan.addFarmValuation({
                id: 5,
                author: 'Spectrum',
                organizationId: 1,
                type: 'farm valuation',
                data: {
                    request: {
                        legalEntity: {
                            uuid: '19CD56FC-DFD6-4338-88E5-00571685F707'
                        }
                    },
                    report: {
                        landUseComponents: {
                            'Grazing': [{
                                name: 'Planted pastures',
                                totalValue: 350000
                            }]
                        },
                        improvements: []
                    }
                }
            });

            businessPlan.addLegalEntity({
                id: 2,
                email: 'dave@roundtree.com',
                name: 'Dave Roundtree',
                type: 'Individual',
                organizationId: 1,
                uuid: '19CD56FC-DFD6-4338-88E5-00571685F707'
            });

            expect(businessPlan.monthlyStatement.length).toBe(4);

            expect(businessPlan.monthlyStatement[3]).toEqual({
                uuid: 'Grazing-Planted pastures',
                legalEntityUuid: '19CD56FC-DFD6-4338-88E5-00571685F707',
                name: 'Grazing',
                description: 'Planted pastures',
                type: 'land use',
                source: 'farm valuation',
                value: 600000
            });
        });

        it('adds an asset', function () {
            businessPlan.addLegalEntity({
                id: 2,
                email: 'dave@roundtree.com',
                name: 'Dave Roundtree',
                type: 'Individual',
                organizationId: 1,
                uuid: '19CD56FC-DFD6-4338-88E5-00571685F707'
            });

            expect(businessPlan.monthlyStatement.length).toBe(3);

            businessPlan.addAsset({
                id: 7,
                legalEntityId: 2,
                assetKey: '510B25A6-DE4E-48E1-B2B0-A441D4127BB9',
                type: 'vme',
                data: {
                    category: 'Vehicle',
                    model: 'Toyota D',
                    financing: {
                        leased: true,
                        installment: 1000,
                        legalEntityId: 2,
                        rentalOwner: 'John Vickers',
                        paymentFrequency: 'Monthly',
                        paymentStart: '2015-10-10T10:20:00'
                    }
                }
            });

            expect(businessPlan.monthlyStatement.length).toBe(4);

            expect(businessPlan.monthlyStatement[3]).toEqual({
                uuid: '510B25A6-DE4E-48E1-B2B0-A441D4127BB9',
                legalEntityUuid: '19CD56FC-DFD6-4338-88E5-00571685F707',
                name: 'Vehicle model Toyota D',
                description: '',
                type: 'vme',
                source: 'asset',
                value: 0,
                liability: [1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000]
            });
        });

        it('adds a custom asset', function () {
            businessPlan.addLegalEntity({
                id: 2,
                email: 'dave@roundtree.com',
                name: 'Dave Roundtree',
                type: 'Individual',
                organizationId: 1,
                uuid: '19CD56FC-DFD6-4338-88E5-00571685F707'
            });

            expect(businessPlan.monthlyStatement.length).toBe(3);

            businessPlan.addAsset({
                legalEntityId: 2,
                assetKey: 'A7C803F5-F2CB-4FE1-A6FC-BAAD50D4AAB4',
                type: 'custom',
                data: {
                    name: 'Life Insurance',
                    description: 'Its for life',
                    assetValue: 300000
                }
            });

            expect(businessPlan.monthlyStatement.length).toBe(4);

            expect(businessPlan.monthlyStatement[3]).toEqual({
                uuid: 'A7C803F5-F2CB-4FE1-A6FC-BAAD50D4AAB4',
                legalEntityUuid: '19CD56FC-DFD6-4338-88E5-00571685F707',
                name: 'Life Insurance',
                description: 'Its for life',
                type: 'custom',
                source: 'asset',
                value: 300000,
                liability: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
            });
        });

        it('adds a liability', function () {
            businessPlan.addLegalEntity({
                id: 2,
                email: 'dave@roundtree.com',
                name: 'Dave Roundtree',
                type: 'Individual',
                organizationId: 1,
                uuid: '19CD56FC-DFD6-4338-88E5-00571685F707'
            });

            expect(businessPlan.monthlyStatement.length).toBe(3);

            businessPlan.addLiability({
                financed: true,
                name: 'Livestock Loan',
                installment: 10000,
                interestRate: 1,
                legalEntityId: 2,
                openingBalance: 500000,
                organizationName: 'John Vickers',
                paymentFrequency: 'Monthly',
                paymentStart: '2015-10-10T10:20:00'
            });

            expect(businessPlan.monthlyStatement.length).toBe(4);

            expect(businessPlan.monthlyStatement[3]).toEqual({
                legalEntityUuid: '19CD56FC-DFD6-4338-88E5-00571685F707',
                name: 'Livestock Loan',
                description: '',
                source: 'liability',
                liability: [10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000]
            });
        });
    });
});
