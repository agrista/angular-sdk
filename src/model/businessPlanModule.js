var sdkModelBusinessPlanDocument = angular.module('ag.sdk.model.business-plan', ['ag.sdk.model.asset', 'ag.sdk.model.legal-entity', 'ag.sdk.model.document', 'ag.sdk.model.production-plan', 'ag.sdk.model.farm-valuation']);

sdkModelBusinessPlanDocument.factory('BusinessPlan', ['Asset', 'computedProperty', 'Document', 'FarmValuation', 'inheritModel', 'LegalEntity', 'privateProperty', 'ProductionPlan', 'underscore',
    function (Asset, computedProperty, Document, FarmValuation, inheritModel, LegalEntity, privateProperty, ProductionPlan, underscore) {
        function BusinessPlan (attrs) {
            Document.apply(this, arguments);

            this.docType = 'business plan';

            this.data.includedModels = this.data.includedModels || {
                farmValuations: [],
                legalEntities: [],
                productionPlans: []
            };

            /**
             * Legal Entities handling
             */
            privateProperty(this, 'addLegalEntity', function (legalEntity) {
                var dupLegalEntity = underscore.findWhere(this.models.legalEntities, {uuid: legalEntity.uuid});

                if (underscore.isUndefined(dupLegalEntity) && LegalEntity.new(legalEntity).validate()) {
                    this.models.legalEntities.push(legalEntity);

                    // TODO: use legalEntities to get relevent data from valuations & plans
                    reEvaluateFarmValuations(this);
                }
            });

            privateProperty(this, 'removeLegalEntity', function (legalEntity) {
                this.models.legalEntities = underscore.reject(this.models.legalEntities, function (entity) {
                    return entity.id === legalEntity.id;
                });

                // TODO: use legalEntities to get relevent data from valuations & plans
                reEvaluateFarmValuations(this);
            });

            /**
             * Production Plans handling
             */
            privateProperty(this, 'addProductionPlan', function (productionPlan) {
                var dupProductionPlan = underscore.findWhere(this.models.productionPlans, {documentId: productionPlan.documentId});

                if (underscore.isUndefined(dupProductionPlan) && ProductionPlan.new(productionPlan).validate()) {
                    this.models.productionPlans.push(productionPlan);

                    // TODO: revalidate & recalculate
                }
            });

            privateProperty(this, 'removeProductionPlan', function (productionPlan) {
                this.models.productionPlans = underscore.reject(this.models.productionPlans, function (plan) {
                    return plan.id === productionPlan.id;
                });

                // TODO: revalidate & recalculate
            });

            /**
             * Farm Valuations handling
             */
            privateProperty(this, 'addFarmValuation', function (farmValuation) {
                var dupFarmValuation = underscore.findWhere(this.models.farmValuations, {documentId: farmValuation.documentId});

                if (underscore.isUndefined(dupFarmValuation) && FarmValuation.new(farmValuation).validate()) {
                    this.models.farmValuations.push(farmValuation);

                    // TODO: revalidate & recalculate
                }
            });

            privateProperty(this, 'removeFarmValuation', function (farmValuation) {
                this.models.farmValuations = underscore.reject(this.models.farmValuations, function (valuation) {
                    return valuation.id === farmValuation.id;
                });

                // TODO: revalidate & recalculate
            });

            function reEvaluateFarmValuations (instance) {
                underscore.each(instance.models.farmValuations, function (item) {
                    var farmValuation = FarmValuation.new(item);
                });
            }

            // Add Assets & Liabilities
            privateProperty(this, 'addAsset', function (asset) {
                this.data.plannedAssets = this.data.plannedAssets || [];

                if (Asset.new(asset).validate()) {
                    this.data.plannedAssets.push(asset);
                }
            });

            privateProperty(this, 'addLiability', function (liability) {
                this.data.plannedLiabilities = this.data.plannedLiabilities || [];
                this.data.plannedLiabilities.push(liability);
            });

            // View added Assets & Liabilities
            computedProperty(this, 'startDate', function () {
                return this.data.startDate;
            });

            computedProperty(this, 'models', function () {
                return this.data.includedModels;
            });

            computedProperty(this, 'plannedAssets', function () {
                return this.data.plannedAssets;
            });

            computedProperty(this, 'plannedLiabilities', function () {
                return this.data.plannedLiabilities;
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
