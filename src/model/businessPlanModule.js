var sdkModelBusinessPlanDocument = angular.module('ag.sdk.model.business-plan', ['ag.sdk.model.asset', 'ag.sdk.model.legal-entity', 'ag.sdk.model.document', 'ag.sdk.model.production-plan', 'ag.sdk.model.farm-valuation']);

sdkModelBusinessPlanDocument.factory('BusinessPlan', ['Asset', 'computedProperty', 'Document', 'FarmValuation', 'inheritModel', 'LegalEntity', 'Liability', 'privateProperty', 'ProductionPlan', 'underscore',
    function (Asset, computedProperty, Document, FarmValuation, inheritModel, LegalEntity, Liability, privateProperty, ProductionPlan, underscore) {
        function BusinessPlan (attrs) {
            Document.apply(this, arguments);

            this.docType = 'business plan';

            this.data.models = this.data.models || {
                assets: [],
                farmValuations: [],
                legalEntities: [],
                liabilities: [],
                productionPlans: []
            };

            this.data.monthlyStatement = this.data.monthlyStatement || [];

            function reEvaluateBusinessPlan (instance) {
                // Re-evaluate all included models
                reEvaluateLegalEntities(instance);
                reEvaluateFarmValuations(instance);
                reEvaluateProductionPlans(instance);
                reEvaluateAssetsAndLiabilities(instance);
            }

            /**
             * Legal Entities handling
             */
            privateProperty(this, 'addLegalEntity', function (legalEntity) {
                var dupLegalEntity = underscore.findWhere(this.models.legalEntities, {uuid: legalEntity.uuid});

                if (underscore.isUndefined(dupLegalEntity) && LegalEntity.new(legalEntity).validate()) {
                    this.models.legalEntities.push(legalEntity);

                    reEvaluateBusinessPlan(this);
                }
            });

            privateProperty(this, 'removeLegalEntity', function (legalEntity) {
                this.models.legalEntities = underscore.reject(this.models.legalEntities, function (entity) {
                    return entity.id === legalEntity.id;
                });

                reEvaluateBusinessPlan(this);
            });

            function reEvaluateLegalEntities (instance) {
                instance.data.monthlyStatement = underscore.reject(instance.data.monthlyStatement, function (item) {
                    return item.source === 'legal entity';
                });

                underscore.each(instance.models.legalEntities, function (item) {
                    var legalEntity = LegalEntity.new(item),
                        registerAssets = underscore
                            .chain(instance.data.assets)
                            .values()
                            .flatten()
                            .where({legalEntityId: legalEntity.id})
                            .value();

                    underscore.each(registerAssets, function (asset) {
                        var statementAsset = underscore.findWhere(instance.data.monthlyStatement, {uuid: asset.assetKey});

                        if (underscore.isUndefined(statementAsset)) {
                            asset = Asset.new(asset);

                            if (asset.liability.hasLiabilities) {
                                var statement = {
                                    uuid: asset.assetKey,
                                    legalEntityUuid: legalEntity.uuid,
                                    name: asset.title,
                                    description: (asset.type === 'improvement' ? asset.data.category : asset.description),
                                    type: asset.type,
                                    source: 'legal entity',
                                    value: asset.data.assetValue || 0,
                                    liability: asset.liability.liabilityInRange(instance.startDate, instance.endDate)
                                };

                                instance.data.monthlyStatement.push(statement);
                            }
                        }
                    });
                });
            }

            /**
             * Production Plans handling
             */
            privateProperty(this, 'addProductionPlan', function (productionPlan) {
                var dupProductionPlan = underscore.findWhere(this.models.productionPlans, {documentId: productionPlan.documentId});

                if (underscore.isUndefined(dupProductionPlan) && ProductionPlan.new(productionPlan).validate()) {
                    this.models.productionPlans.push(productionPlan);

                    reEvaluateProductionPlans(this);
                }
            });

            privateProperty(this, 'removeProductionPlan', function (productionPlan) {
                this.models.productionPlans = underscore.reject(this.models.productionPlans, function (plan) {
                    return plan.id === productionPlan.id;
                });

                reEvaluateProductionPlans(this);
            });

            function reEvaluateProductionPlans (instance) {
                instance.data.monthlyStatement = underscore.reject(instance.data.monthlyStatement, function (item) {
                    return item.source === 'production plan';
                });

                underscore.each(instance.models.productionPlans, function (item) {
                    var productionPlan = ProductionPlan.new(item);
                });
            }

            /**
             * Farm Valuations handling
             */
            privateProperty(this, 'addFarmValuation', function (farmValuation) {
                var dupFarmValuation = underscore.findWhere(this.models.farmValuations, {documentId: farmValuation.documentId});

                if (underscore.isUndefined(dupFarmValuation) && FarmValuation.new(farmValuation).validate()) {
                    this.models.farmValuations.push(farmValuation);

                    reEvaluateFarmValuations(this);
                }
            });

            privateProperty(this, 'removeFarmValuation', function (farmValuation) {
                this.models.farmValuations = underscore.reject(this.models.farmValuations, function (valuation) {
                    return valuation.id === farmValuation.id;
                });

                reEvaluateFarmValuations(this);
            });

            function reEvaluateFarmValuations (instance) {
                // Remove all statements from farm valuation source
                instance.data.monthlyStatement = underscore.reject(instance.data.monthlyStatement, function (item) {
                    return item.source === 'farm valuation';
                });

                underscore.each(instance.models.farmValuations, function (valuationItem) {
                    var farmValuation = FarmValuation.new(valuationItem);

                    if (farmValuation.data.request && farmValuation.data.report) {
                        var legalEntity = farmValuation.data.request.legalEntity;

                        // Check legal entity model for farm valuation is included
                        if (underscore.some(instance.models.legalEntities, function (entity) {
                                return entity.uuid === legalEntity.uuid;
                            })) {
                            // Farm valuation contains a completed report landUseComponents
                            if (farmValuation.data.report.landUseComponents) {
                                underscore.each(farmValuation.data.report.landUseComponents, function (landUseComponent, landUse) {
                                    underscore.each(landUseComponent, function (category) {
                                        var statementCategory = underscore.findWhere(instance.data.monthlyStatement, {uuid: landUse + '-' + category.name})

                                        if (underscore.isUndefined(statementCategory)) {
                                            // Add new land use component
                                            var statement = {
                                                uuid: landUse + '-' + category.name,
                                                legalEntityUuid: legalEntity.uuid,
                                                name: landUse,
                                                description: category.name,
                                                type: 'land use',
                                                source: 'farm valuation',
                                                value: (category.area * category.valuePerHa)
                                            };

                                            instance.data.monthlyStatement.push(statement);
                                        } else {
                                            // Sum two components together
                                            statementCategory.value += (category.area * category.valuePerHa);
                                        }
                                    });
                                });
                            }

                            // Farm valuation contains a completed report improvements
                            if (farmValuation.data.report.improvements) {
                                // Loop through the valued improvements
                                underscore.each(farmValuation.data.report.improvements, function (improvementItem) {
                                    var improvement = Asset.new(improvementItem),
                                        statementImprovement = underscore.findWhere(instance.data.monthlyStatement, {uuid: improvement.assetKey}),
                                        registerImprovement = underscore.findWhere(instance.data.assets.improvement, {assetKey: improvement.assetKey});

                                    if (underscore.isUndefined(statementImprovement)) {
                                        // Improvement is still valid
                                        if (registerImprovement && improvement.validate()) {
                                            // Find asset in document's asset register
                                            var registerLegalEntity = underscore.findWhere(instance.data.legalEntities, {id: registerImprovement.legalEntityId});

                                            if (underscore.some(instance.models.legalEntities, function (entity) {
                                                    return entity.uuid === registerLegalEntity.uuid;
                                                })) {
                                                // Legal Entity for this improvement is an included Legal Entity
                                                // improvement model has the valuation data, but registerImprovement has the financing, merge the two
                                                improvement.data.financing = Liability.new(registerImprovement.data.financing);

                                                // If the asset has ongoing leases or financing
                                                if (improvement.liability.hasLiabilities) {
                                                    var statement = {
                                                        uuid: improvement.assetKey,
                                                        legalEntityUuid: registerLegalEntity.uuid,
                                                        name: improvement.title,
                                                        description: improvement.data.category,
                                                        type: 'improvement',
                                                        source: 'farm valuation',
                                                        value: improvement.data.assetValue || 0,
                                                        liability: improvement.liability.liabilityInRange(instance.startDate, instance.endDate)
                                                    };

                                                    instance.data.monthlyStatement.push(statement);
                                                }
                                            }
                                        }
                                    } else {
                                        // Add valuation to improvement
                                        statementImprovement.source = 'farm valuation';
                                        statementImprovement.value = improvement.data.assetValue;
                                    }
                                });
                            }
                        }
                    }
                });
            }

            // Add Assets & Liabilities
            privateProperty(this, 'addAsset', function (asset) {
                if (asset.type === 'custom' || Asset.new(asset).validate()) {
                    this.models.assets.push(asset);

                    reEvaluateAssetsAndLiabilities(this);
                }
            });

            privateProperty(this, 'removeAsset', function (index) {
                this.models.assets = this.models.assets.splice(index, 1);

                reEvaluateAssetsAndLiabilities(this);
            });

            privateProperty(this, 'addLiability', function (liability) {
                if (Liability.new(liability).validate()) {
                    this.models.liabilities.push(liability);

                    reEvaluateAssetsAndLiabilities(this);
                }
            });

            privateProperty(this, 'removeLiability', function (index) {
                this.models.liabilities = this.models.liabilities.splice(index, 1);

                reEvaluateAssetsAndLiabilities(this);
            });

            function reEvaluateAssetsAndLiabilities (instance) {
                instance.data.monthlyStatement = underscore.reject(instance.data.monthlyStatement, function (item) {
                    return underscore.contains(['asset', 'liability'], item.source);
                });

                underscore.each(instance.models.assets, function (asset) {
                    asset = Asset.new(asset);

                    var registerLegalEntity = underscore.findWhere(instance.data.legalEntities, {id: asset.legalEntityId}),
                        statementAsset = underscore.findWhere(instance.data.monthlyStatement, {uuid: asset.assetKey});

                    // Check asset is not already added and legal entity model is included
                    if (underscore.isUndefined(statementAsset) && underscore.some(instance.models.legalEntities, function (entity) {
                            return entity.uuid === registerLegalEntity.uuid;
                        })) {

                        // Add asset
                        var statement = {
                            uuid: asset.assetKey,
                            legalEntityUuid: registerLegalEntity.uuid,
                            name: asset.title,
                            description: asset.description,
                            type: asset.type,
                            source: 'asset',
                            value: asset.data.assetValue || 0,
                            liability: asset.liability.liabilityInRange(instance.startDate, instance.endDate)
                        };

                        instance.data.monthlyStatement.push(statement);
                    }
                });

                underscore.each(instance.models.liabilities, function (liability) {
                    liability = Liability.new(liability);

                    var registerLegalEntity = underscore.findWhere(instance.data.legalEntities, {id: liability.legalEntityId});

                    // Check legal entity model is included
                    if (underscore.some(instance.models.legalEntities, function (entity) {
                            return entity.uuid === registerLegalEntity.uuid;
                        })) {
                        // Add asset
                        var statement = {
                            legalEntityUuid: registerLegalEntity.uuid,
                            name: liability.name || '',
                            description: liability.description || '',
                            source: 'liability',
                            liability: liability.liabilityInRange(instance.startDate, instance.endDate)
                        };

                        instance.data.monthlyStatement.push(statement);
                    }
                });
            }

            // View added Assets & Liabilities
            computedProperty(this, 'startDate', function () {
                return this.data.startDate;
            });

            computedProperty(this, 'endDate', function () {
                this.data.endDate = (this.data.startDate ?
                    moment(this.data.startDate).add(2, 'y').format() :
                    this.data.endDate);

                return this.data.endDate;
            });

            computedProperty(this, 'models', function () {
                return this.data.models;
            });

            computedProperty(this, 'monthlyStatement', function () {
                return this.data.monthlyStatement;
            });
        }

        inheritModel(BusinessPlan, Document);

        BusinessPlan.validates({
            author: {
                required: true,
                length: {
                    min: 1,
                    max: 255
                }
            },
            docType: {
                required: true,
                equal: {
                    to: 'business plan'
                }
            },
            organizationId: {
                required: true,
                numeric: true
            },
            startDate: {
                required: true,
                format: {
                    date: true
                }
            },
            title: {
                required: true,
                length: {
                    min: 1,
                    max: 255
                }
            }
        });

        return BusinessPlan;
    }]);
