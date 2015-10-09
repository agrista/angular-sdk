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
                    startDate: '2015-10-10T10:20:00',
                    legalEntities: [{
                        contactName: "Dave Steen",
                        createdAt: "2015-01-16T09:53:23.520+0000",
                        createdBy: "rsavage",
                        email: "dave.steen@mailinator.com",
                        id: 1,
                        isActive: true,
                        isPrimary: true,
                        name: "Dave Steen",
                        organizationId: 8605,
                        type: "Individual",
                        uuid: "952ba751-af48-4dbd-a373-67d99d8c3716"
                    }]
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

            businessPlan.addLiability({
                uuid: '18F6C327-FBE5-4693-AE31-A89DD6BD9D0B',
                type: 'short-term',
                installmentPayment: 10000,
                interestRate: 1,
                legalEntityId: 2,
                amount: 500000,
                merchantUuid: '1E109A6C-625B-4FE2-AD23-35D082754914',
                frequency: 'monthly',
                startDate: '2015-10-10T10:20:00'
            });
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
                    liabilities: [{
                        id: 7,
                        uuid: '75A91F7C-3F92-4A5E-A727-E74BD029364B',
                        type: 'medium-term',
                        installmentPayment: 10000,
                        interestRate: 1,
                        legalEntityId: 2,
                        openingBalance: 100000,
                        merchantUuid: '18F6C327-FBE5-4693-AE31-A89DD6BD9D0B',
                        frequency: 'monthly',
                        startDate: '2015-10-10T10:20:00'
                    }, {
                        id: 8,
                        uuid: 'A2CDB65E-7D5C-4921-8F7E-02B879EDD6DB',
                        type: 'long-term',
                        installmentPayment: 10000,
                        interestRate: 1,
                        legalEntityId: 2,
                        openingBalance: 500000,
                        merchantUuid: '18F6C327-FBE5-4693-AE31-A89DD6BD9D0B',
                        frequency: 'monthly',
                        startDate: '2015-10-10T10:20:00'
                    }, {
                        id: 9,
                        uuid: '9D3F3850-590C-46FC-A3E2-0F94997F06C8',
                        type: 'rent',
                        installmentPayment: 1000,
                        legalEntityId: 2,
                        merchantUuid: '18F6C327-FBE5-4693-AE31-A89DD6BD9D0B',
                        frequency: 'quarterly',
                        startDate: '2015-10-10T10:20:00',
                        endDate: '2016-10-10T10:20:00'
                    }],
                    assets: [{
                        id: 3,
                        legalEntityId: 2,
                        assetKey: 'CBAAFB3B-B0C3-4CD2-9091-0943578BC5AC',
                        type: 'improvement',
                        data: {
                            name: 'Barn',
                            category: 'Farm Buildings'
                        }
                    }, {
                        id: 4,
                        legalEntityId: 2,
                        assetKey: '3D7C250A-A9D0-455B-97C0-F9499B7C079B',
                        type: 'improvement',
                        data: {
                            name: 'Office',
                            category: 'Office Buildings'
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
                            portionLabel: 'Portion 1 of farm'
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

            expect(businessPlan.monthlyStatement.length).toBe(7);

            expect(businessPlan.monthlyStatement[0]).toEqual({
                uuid: 'CBAAFB3B-B0C3-4CD2-9091-0943578BC5AC',
                legalEntityUuid: '19CD56FC-DFD6-4338-88E5-00571685F707',
                name: 'Barn',
                description: 'Farm Buildings',
                type: 'asset',
                subtype: 'improvement',
                source: 'legal entity',
                value: 0
            });

            expect(businessPlan.monthlyStatement[1]).toEqual({
                uuid: '3D7C250A-A9D0-455B-97C0-F9499B7C079B',
                legalEntityUuid: '19CD56FC-DFD6-4338-88E5-00571685F707',
                name: 'Office',
                description: 'Office Buildings',
                type: 'asset',
                subtype: 'improvement',
                source: 'legal entity',
                value: 0
            });

            expect(businessPlan.monthlyStatement[4]).toEqual({
                uuid : '75A91F7C-3F92-4A5E-A727-E74BD029364B',
                legalEntityUuid: '19CD56FC-DFD6-4338-88E5-00571685F707',
                name: 'Medium Term',
                type: 'liability',
                subtype: 'medium-term',
                source: 'legal entity',
                liability: [
                    { opening : 100000, repayment : 10000, withdrawal : 0, balance : 90000, interest : 75, closing : 90075 },
                    { opening : 90075, repayment : 10000, withdrawal : 0, balance : 80075, interest : 66.729166666667, closing : 80141.72916666667 },
                    { opening : 80141.72916666667, repayment : 10000, withdrawal : 0, balance : 70141.72916666667, interest : 58.451440972222, closing : 70200.18060763889 },
                    { opening : 70200.18060763889, repayment : 10000, withdrawal : 0, balance : 60200.18060763889, interest : 50.166817173031994, closing : 60250.347424811924 },
                    { opening : 60250.347424811924, repayment : 10000, withdrawal : 0, balance : 50250.347424811924, interest : 41.875289520677, closing : 50292.2227143326 },
                    { opening : 50292.2227143326, repayment : 10000, withdrawal : 0, balance : 40292.2227143326, interest : 33.576852261944, closing : 40325.79956659455 },
                    { opening : 40325.79956659455, repayment : 10000, withdrawal : 0, balance : 30325.79956659455, interest : 25.271499638829, closing : 30351.071066233377 },
                    { opening : 30351.071066233377, repayment : 10000, withdrawal : 0, balance : 20351.071066233377, interest : 16.959225888528, closing : 20368.030292121904 },
                    { opening : 20368.030292121904, repayment : 10000, withdrawal : 0, balance : 10368.030292121904, interest : 8.640025243435, closing : 10376.670317365339 },
                    { opening : 10376.670317365339, repayment : 10000, withdrawal : 0, balance : 376.67031736533863, interest : 0.313891931138, closing : 376.98420929647665 },
                    { opening : 376.98420929647665, repayment : 376.98420929647665, withdrawal : 0, balance : 0, interest : 0, closing : 0 },
                    { opening : 0, repayment : 0, withdrawal : 0, balance : 0, interest : 0, closing : 0 },
                    { opening : 0, repayment : 0, withdrawal : 0, balance : 0, interest : 0, closing : 0 },
                    { opening : 0, repayment : 0, withdrawal : 0, balance : 0, interest : 0, closing : 0 },
                    { opening : 0, repayment : 0, withdrawal : 0, balance : 0, interest : 0, closing : 0 },
                    { opening : 0, repayment : 0, withdrawal : 0, balance : 0, interest : 0, closing : 0 },
                    { opening : 0, repayment : 0, withdrawal : 0, balance : 0, interest : 0, closing : 0 },
                    { opening : 0, repayment : 0, withdrawal : 0, balance : 0, interest : 0, closing : 0 },
                    { opening : 0, repayment : 0, withdrawal : 0, balance : 0, interest : 0, closing : 0 },
                    { opening : 0, repayment : 0, withdrawal : 0, balance : 0, interest : 0, closing : 0 },
                    { opening : 0, repayment : 0, withdrawal : 0, balance : 0, interest : 0, closing : 0 },
                    { opening : 0, repayment : 0, withdrawal : 0, balance : 0, interest : 0, closing : 0 },
                    { opening : 0, repayment : 0, withdrawal : 0, balance : 0, interest : 0, closing : 0 },
                    { opening : 0, repayment : 0, withdrawal : 0, balance : 0, interest : 0, closing : 0 }
                ]
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

            expect(businessPlan.monthlyStatement.length).toBe(7);

            expect(businessPlan.monthlyStatement[0]).toEqual({
                uuid: 'CBAAFB3B-B0C3-4CD2-9091-0943578BC5AC',
                legalEntityUuid: '19CD56FC-DFD6-4338-88E5-00571685F707',
                name: 'Barn',
                description: 'Farm Buildings',
                type: 'asset',
                subtype: 'improvement',
                source: 'farm valuation',
                value: 100000
            });

            expect(businessPlan.monthlyStatement[1]).toEqual({
                uuid: '3D7C250A-A9D0-455B-97C0-F9499B7C079B',
                legalEntityUuid: '19CD56FC-DFD6-4338-88E5-00571685F707',
                name: 'Office',
                description: 'Office Buildings',
                type: 'asset',
                subtype: 'improvement',
                source: 'legal entity',
                value: 0
            });

            expect(businessPlan.monthlyStatement[4]).toEqual({
                uuid : '75A91F7C-3F92-4A5E-A727-E74BD029364B',
                legalEntityUuid: '19CD56FC-DFD6-4338-88E5-00571685F707',
                name: 'Medium Term',
                type: 'liability',
                subtype: 'medium-term',
                source: 'legal entity',
                liability: [
                    { opening : 100000, repayment : 10000, withdrawal : 0, balance : 90000, interest : 75, closing : 90075 },
                    { opening : 90075, repayment : 10000, withdrawal : 0, balance : 80075, interest : 66.729166666667, closing : 80141.72916666667 },
                    { opening : 80141.72916666667, repayment : 10000, withdrawal : 0, balance : 70141.72916666667, interest : 58.451440972222, closing : 70200.18060763889 },
                    { opening : 70200.18060763889, repayment : 10000, withdrawal : 0, balance : 60200.18060763889, interest : 50.166817173031994, closing : 60250.347424811924 },
                    { opening : 60250.347424811924, repayment : 10000, withdrawal : 0, balance : 50250.347424811924, interest : 41.875289520677, closing : 50292.2227143326 },
                    { opening : 50292.2227143326, repayment : 10000, withdrawal : 0, balance : 40292.2227143326, interest : 33.576852261944, closing : 40325.79956659455 },
                    { opening : 40325.79956659455, repayment : 10000, withdrawal : 0, balance : 30325.79956659455, interest : 25.271499638829, closing : 30351.071066233377 },
                    { opening : 30351.071066233377, repayment : 10000, withdrawal : 0, balance : 20351.071066233377, interest : 16.959225888528, closing : 20368.030292121904 },
                    { opening : 20368.030292121904, repayment : 10000, withdrawal : 0, balance : 10368.030292121904, interest : 8.640025243435, closing : 10376.670317365339 },
                    { opening : 10376.670317365339, repayment : 10000, withdrawal : 0, balance : 376.67031736533863, interest : 0.313891931138, closing : 376.98420929647665 },
                    { opening : 376.98420929647665, repayment : 376.98420929647665, withdrawal : 0, balance : 0, interest : 0, closing : 0 },
                    { opening : 0, repayment : 0, withdrawal : 0, balance : 0, interest : 0, closing : 0 },
                    { opening : 0, repayment : 0, withdrawal : 0, balance : 0, interest : 0, closing : 0 },
                    { opening : 0, repayment : 0, withdrawal : 0, balance : 0, interest : 0, closing : 0 },
                    { opening : 0, repayment : 0, withdrawal : 0, balance : 0, interest : 0, closing : 0 },
                    { opening : 0, repayment : 0, withdrawal : 0, balance : 0, interest : 0, closing : 0 },
                    { opening : 0, repayment : 0, withdrawal : 0, balance : 0, interest : 0, closing : 0 },
                    { opening : 0, repayment : 0, withdrawal : 0, balance : 0, interest : 0, closing : 0 },
                    { opening : 0, repayment : 0, withdrawal : 0, balance : 0, interest : 0, closing : 0 },
                    { opening : 0, repayment : 0, withdrawal : 0, balance : 0, interest : 0, closing : 0 },
                    { opening : 0, repayment : 0, withdrawal : 0, balance : 0, interest : 0, closing : 0 },
                    { opening : 0, repayment : 0, withdrawal : 0, balance : 0, interest : 0, closing : 0 },
                    { opening : 0, repayment : 0, withdrawal : 0, balance : 0, interest : 0, closing : 0 },
                    { opening : 0, repayment : 0, withdrawal : 0, balance : 0, interest : 0, closing : 0 }
                ]
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

            expect(businessPlan.monthlyStatement.length).toBe(7);

            expect(businessPlan.monthlyStatement[0]).toEqual({
                uuid: 'CBAAFB3B-B0C3-4CD2-9091-0943578BC5AC',
                legalEntityUuid: '19CD56FC-DFD6-4338-88E5-00571685F707',
                name: 'Barn',
                description: 'Farm Buildings',
                type: 'asset',
                subtype: 'improvement',
                source: 'farm valuation',
                value: 100000
            });

            expect(businessPlan.monthlyStatement[1]).toEqual({
                uuid: '3D7C250A-A9D0-455B-97C0-F9499B7C079B',
                legalEntityUuid: '19CD56FC-DFD6-4338-88E5-00571685F707',
                name: 'Office',
                description: 'Office Buildings',
                type: 'asset',
                subtype: 'improvement',
                source: 'legal entity',
                value: 0
            });

            expect(businessPlan.monthlyStatement[4]).toEqual({
                uuid : '75A91F7C-3F92-4A5E-A727-E74BD029364B',
                legalEntityUuid: '19CD56FC-DFD6-4338-88E5-00571685F707',
                name: 'Medium Term',
                type: 'liability',
                subtype: 'medium-term',
                source: 'legal entity',
                liability: [
                    { opening : 100000, repayment : 10000, withdrawal : 0, balance : 90000, interest : 75, closing : 90075 },
                    { opening : 90075, repayment : 10000, withdrawal : 0, balance : 80075, interest : 66.729166666667, closing : 80141.72916666667 },
                    { opening : 80141.72916666667, repayment : 10000, withdrawal : 0, balance : 70141.72916666667, interest : 58.451440972222, closing : 70200.18060763889 },
                    { opening : 70200.18060763889, repayment : 10000, withdrawal : 0, balance : 60200.18060763889, interest : 50.166817173031994, closing : 60250.347424811924 },
                    { opening : 60250.347424811924, repayment : 10000, withdrawal : 0, balance : 50250.347424811924, interest : 41.875289520677, closing : 50292.2227143326 },
                    { opening : 50292.2227143326, repayment : 10000, withdrawal : 0, balance : 40292.2227143326, interest : 33.576852261944, closing : 40325.79956659455 },
                    { opening : 40325.79956659455, repayment : 10000, withdrawal : 0, balance : 30325.79956659455, interest : 25.271499638829, closing : 30351.071066233377 },
                    { opening : 30351.071066233377, repayment : 10000, withdrawal : 0, balance : 20351.071066233377, interest : 16.959225888528, closing : 20368.030292121904 },
                    { opening : 20368.030292121904, repayment : 10000, withdrawal : 0, balance : 10368.030292121904, interest : 8.640025243435, closing : 10376.670317365339 },
                    { opening : 10376.670317365339, repayment : 10000, withdrawal : 0, balance : 376.67031736533863, interest : 0.313891931138, closing : 376.98420929647665 },
                    { opening : 376.98420929647665, repayment : 376.98420929647665, withdrawal : 0, balance : 0, interest : 0, closing : 0 },
                    { opening : 0, repayment : 0, withdrawal : 0, balance : 0, interest : 0, closing : 0 },
                    { opening : 0, repayment : 0, withdrawal : 0, balance : 0, interest : 0, closing : 0 },
                    { opening : 0, repayment : 0, withdrawal : 0, balance : 0, interest : 0, closing : 0 },
                    { opening : 0, repayment : 0, withdrawal : 0, balance : 0, interest : 0, closing : 0 },
                    { opening : 0, repayment : 0, withdrawal : 0, balance : 0, interest : 0, closing : 0 },
                    { opening : 0, repayment : 0, withdrawal : 0, balance : 0, interest : 0, closing : 0 },
                    { opening : 0, repayment : 0, withdrawal : 0, balance : 0, interest : 0, closing : 0 },
                    { opening : 0, repayment : 0, withdrawal : 0, balance : 0, interest : 0, closing : 0 },
                    { opening : 0, repayment : 0, withdrawal : 0, balance : 0, interest : 0, closing : 0 },
                    { opening : 0, repayment : 0, withdrawal : 0, balance : 0, interest : 0, closing : 0 },
                    { opening : 0, repayment : 0, withdrawal : 0, balance : 0, interest : 0, closing : 0 },
                    { opening : 0, repayment : 0, withdrawal : 0, balance : 0, interest : 0, closing : 0 },
                    { opening : 0, repayment : 0, withdrawal : 0, balance : 0, interest : 0, closing : 0 }
                ]
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
                                area: 100,
                                valuePerHa: 1000
                            }, {
                                name: 'High Potential',
                                area: 100,
                                valuePerHa: 1500
                            }],
                            'Grazing': [{
                                name: 'Planted pastures',
                                area: 100,
                                valuePerHa: 2500
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

            expect(businessPlan.monthlyStatement.length).toBe(10);

            expect(businessPlan.monthlyStatement[7]).toEqual({
                uuid: 'Dry Land-Medium Potential',
                legalEntityUuid: '19CD56FC-DFD6-4338-88E5-00571685F707',
                name: 'Dry Land',
                description: 'Medium Potential',
                type: 'asset',
                subtype: 'land use',
                source: 'farm valuation',
                value: 100000
            });

            expect(businessPlan.monthlyStatement[8]).toEqual({
                uuid: 'Dry Land-High Potential',
                legalEntityUuid: '19CD56FC-DFD6-4338-88E5-00571685F707',
                name: 'Dry Land',
                description: 'High Potential',
                type: 'asset',
                subtype: 'land use',
                source: 'farm valuation',
                value: 150000
            });

            expect(businessPlan.monthlyStatement[9]).toEqual({
                uuid: 'Grazing-Planted pastures',
                legalEntityUuid: '19CD56FC-DFD6-4338-88E5-00571685F707',
                name: 'Grazing',
                description: 'Planted pastures',
                type: 'asset',
                subtype: 'land use',
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
                                area: 100,
                                valuePerHa: 2500
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
                                area: 100,
                                valuePerHa: 3500
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

            expect(businessPlan.monthlyStatement.length).toBe(8);

            expect(businessPlan.monthlyStatement[7]).toEqual({
                uuid: 'Grazing-Planted pastures',
                legalEntityUuid: '19CD56FC-DFD6-4338-88E5-00571685F707',
                name: 'Grazing',
                description: 'Planted pastures',
                type: 'asset',
                subtype: 'land use',
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

            expect(businessPlan.monthlyStatement.length).toBe(7);

            businessPlan.addAsset({
                id: 7,
                legalEntityId: 2,
                assetKey: '510B25A6-DE4E-48E1-B2B0-A441D4127BB9',
                type: 'vme',
                data: {
                    category: 'Vehicle',
                    model: 'Toyota D'
                }
            });

            expect(businessPlan.monthlyStatement.length).toBe(8);

            expect(businessPlan.monthlyStatement[7]).toEqual({
                uuid: '510B25A6-DE4E-48E1-B2B0-A441D4127BB9',
                legalEntityUuid: '19CD56FC-DFD6-4338-88E5-00571685F707',
                name: 'Vehicle model Toyota D',
                description: '',
                type: 'asset',
                subtype: 'vme',
                source: 'asset',
                value: 0
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

            expect(businessPlan.monthlyStatement.length).toBe(7);

            businessPlan.addAsset({
                legalEntityId: 2,
                assetKey: 'A7C803F5-F2CB-4FE1-A6FC-BAAD50D4AAB4',
                type: 'other',
                data: {
                    name: 'Life Insurance',
                    description: 'Its for life',
                    assetValue: 300000
                }
            });

            expect(businessPlan.monthlyStatement.length).toBe(8);

            expect(businessPlan.monthlyStatement[7]).toEqual({
                uuid: 'A7C803F5-F2CB-4FE1-A6FC-BAAD50D4AAB4',
                legalEntityUuid: '19CD56FC-DFD6-4338-88E5-00571685F707',
                name: 'Life Insurance',
                description: 'Its for life',
                type: 'asset',
                subtype: 'other',
                source: 'asset',
                value: 300000
            });
        });
    });
});
