var sdkModelBusinessPlanDocument = angular.module('ag.sdk.model.business-plan', ['ag.sdk.id', 'ag.sdk.helper.enterprise-budget', 'ag.sdk.model.asset', 'ag.sdk.model.document', 'ag.sdk.model.legal-entity', 'ag.sdk.model.liability', 'ag.sdk.model.farm-valuation', 'ag.sdk.model.production-schedule']);

sdkModelBusinessPlanDocument.factory('BusinessPlan', ['Asset', 'computedProperty', 'Document', 'enterpriseBudgetHelper', 'FarmValuation', 'generateUUID', 'inheritModel', 'LegalEntity', 'Liability', 'privateProperty', 'ProductionSchedule', 'underscore',
    function (Asset, computedProperty, Document, enterpriseBudgetHelper, FarmValuation, generateUUID, inheritModel, LegalEntity, Liability, privateProperty, ProductionSchedule, underscore) {
        function BusinessPlan (attrs) {
            Document.apply(this, arguments);

            this.docType = 'business plan';

            this.data.models = this.data.models || {
                assets: [],
                farmValuations: [],
                legalEntities: [],
                liabilities: [],
                productionSchedules: [],
                income: [],
                expenses: []
            };

            this.data.monthlyStatement = this.data.monthlyStatement || [];

            function reEvaluateBusinessPlan (instance) {
                // Re-evaluate all included models
                reEvaluateLegalEntities(instance);
                reEvaluateFarmValuations(instance);
                reEvaluateProductionSchedules(instance);
                reEvaluateAssetsAndLiabilities(instance);
                reEvaluateIncomeAndExpenses(instance);
            }

            /**
             * Legal Entities handling
             */
            privateProperty(this, 'addLegalEntity', function (legalEntity) {
                var instance = this,
                    dupLegalEntity = underscore.findWhere(this.models.legalEntities, {uuid: legalEntity.uuid});

                if (underscore.isUndefined(dupLegalEntity) && LegalEntity.new(legalEntity).validate()) {
                    this.models.legalEntities.push(legalEntity);

                    angular.forEach(legalEntity.assets, function(asset) {
                        instance.addAsset(asset);
                    });

                    reEvaluateBusinessPlan(this);
                }
            });

            privateProperty(this, 'removeLegalEntity', function (legalEntity) {
                this.models.legalEntities = underscore.reject(this.models.legalEntities, function (entity) {
                    return entity.id === legalEntity.id;
                });

                this.models.assets = underscore.reject(this.models.assets, function (asset) {
                    return asset.legalEntityId === legalEntity.id;
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
                            .value(),
                        registerLiabilities = underscore
                            .chain(instance.data.liabilities)
                            .where({legalEntityId: legalEntity.id})
                            .value();

                    underscore.each(registerAssets, function (asset) {
                        var statementAsset = underscore.findWhere(instance.data.monthlyStatement, {uuid: asset.assetKey});

                        if (underscore.isUndefined(statementAsset)) {
                            asset = Asset.new(asset);

                            instance.data.monthlyStatement.push({
                                uuid: asset.assetKey,
                                legalEntityUuid: legalEntity.uuid,
                                name: asset.title,
                                description: (asset.type === 'improvement' ? asset.data.category : asset.description),
                                type: 'asset',
                                subtype: asset.type,
                                source: 'legal entity',
                                value: asset.data.assetValue || 0
                            });
                        }
                    });

                    underscore.each(registerLiabilities, function (liability) {
                        var statementLiability = underscore.findWhere(instance.data.monthlyStatement, {uuid: liability.uuid});

                        if (underscore.isUndefined(statementLiability)) {
                            liability = Liability.new(liability);

                            instance.data.monthlyStatement.push({
                                uuid: liability.uuid,
                                legalEntityUuid: legalEntity.uuid,
                                name: Liability.getTypeTitle(liability.type),
                                type: 'liability',
                                subtype: liability.type,
                                source: 'legal entity',
                                liability: liability.liabilityInRange(instance.startDate, instance.endDate)
                            });
                        }
                    });

                });
            }

            /**
             * Production Schedule handling
             */
            privateProperty(this, 'updateProductionSchedules', function (schedules) {
                var startMonth = moment(this.startDate),
                    endMonth = moment(this.endDate);

                this.models.productionSchedules = [];

                angular.forEach(schedules, function (schedule) {
                    if (schedule && ProductionSchedule.new(schedule).validate() &&
                        (startMonth.isBetween(schedule.startDate, schedule.endDate) ||
                        (startMonth.isBefore(schedule.endDate) && endMonth.isAfter(schedule.startDate)))) {
                        // Add valid production schedule if between business plan dates
                        this.models.productionSchedules.push(schedule);
                    }
                }, this);

                reEvaluateProductionSchedules(this);
            });

            function initializeCategoryValues(instance, section, category, months) {
                instance.data[section] = instance.data[section] || {};
                instance.data[section][category] = instance.data[section][category] || underscore.range(months).map(function () {
                    return 0;
                });
            }

            function extractGroupCategories(instance, schedule, code, type, startMonth, numberOfMonths) {
                var section = underscore.findWhere(schedule.data.sections, {code: code}),
                    scheduleStart = moment(schedule.startDate);

                if (section) {
                    var offset = startMonth.diff(scheduleStart, 'months');

                    angular.forEach(section.productCategoryGroups, function (group) {
                        angular.forEach(group.productCategories, function (category) {
                            var categoryName = (schedule.type !== 'livestock' && type === 'productionIncome' ? schedule.data.details.commodity : category.name);

                            instance.data[type][categoryName] = instance.data[type][categoryName] || underscore.range(numberOfMonths).map(function () {
                                return 0;
                            });

                            for (var i = 0; i < numberOfMonths; i++) {
                                instance.data[type][categoryName][i] += (category.valuePerMonth[i + offset] || 0);
                            }
                        });
                    });
                }
            }

            function reEvaluateProductionSchedules (instance) {
                var startMonth = moment(instance.startDate),
                    endMonth = moment(instance.endDate),
                    numberOfMonths = endMonth.diff(startMonth, 'months');

                instance.data.productionIncome = {};
                instance.data.productionExpenditure = {};

                angular.forEach(instance.models.productionSchedules, function (productionSchedule) {
                    var schedule = ProductionSchedule.new(productionSchedule);

                    extractGroupCategories(instance, schedule, 'INC', 'productionIncome', startMonth, numberOfMonths);
                    extractGroupCategories(instance, schedule,  'EXP', 'productionExpenditure', startMonth, numberOfMonths);
                });
            }

            /**
             * Income & Expenses handling
             */
            privateProperty(this, 'addIncome', function (income) {
                this.models.income = underscore.reject(this.models.income, function (item) {
                    return item.uuid === income.uuid;
                });

                this.models.income.push(income);

                reEvaluateIncomeAndExpenses(this);
            });

            privateProperty(this, 'removeIncome', function (income) {
                this.models.income = underscore.reject(this.models.income, function (item) {
                    return item.uuid === income.uuid;
                });

                reEvaluateIncomeAndExpenses(this);
            });

            privateProperty(this, 'addExpense', function (expense) {
                this.models.expenses = underscore.reject(this.models.expenses, function (item) {
                    return item.uuid === expense.uuid;
                });

                this.models.expenses.push(expense);

                reEvaluateIncomeAndExpenses(this);
            });

            privateProperty(this, 'removeExpense', function (expense) {
                this.models.expenses = underscore.reject(this.models.expenses, function (item) {
                    return item.uuid === expense.uuid;
                });

                reEvaluateIncomeAndExpenses(this);
            });

            function reEvaluateIncomeAndExpenses (instance) {
                var startMonth = moment(instance.startDate),
                    endMonth = moment(instance.endDate),
                    numberOfMonths = endMonth.diff(startMonth, 'months');

                instance.data.otherIncome = {};
                instance.data.otherExpenditure = {};

                // Handle other assets
                underscore.each(instance.models.assets, function (asset) {
                    asset = Asset.new(asset);

                    if (asset.type === 'other') {
                        var registerLegalEntity = underscore.findWhere(instance.data.legalEntities, {id: asset.legalEntityId}),
                            statementAsset = underscore.findWhere(instance.data.monthlyStatement, {uuid: asset.assetKey});

                        // Check asset is not already added
                        if (registerLegalEntity && underscore.isUndefined(statementAsset)) {
                            var acquisitionDate = moment(asset.data.acquisitionDate),
                                soldDate = moment(asset.data.soldDate);

                            if (asset.data.assetValue && acquisitionDate.isBetween(startMonth, endMonth)) {
                                initializeCategoryValues(instance, 'otherIncome', asset.data.name, numberOfMonths);

                                instance.data.otherIncome[asset.data.name][startMonth.diff(acquisitionDate, 'months')] += asset.data.assetValue;
                            }

                            if (asset.data.sold && asset.data.salePrice && soldDate.isBetween(startMonth, endMonth)) {
                                initializeCategoryValues(instance, 'otherExpenditure', asset.data.name, numberOfMonths);

                                instance.data.otherExpenditure[asset.data.name][startMonth.diff(soldDate, 'months')] += asset.data.salePrice;
                            }
                        }
                    }
                });

                underscore.each(instance.models.income, function (income) {
                    var registerLegalEntity = underscore.findWhere(instance.data.legalEntities, {id: income.legalEntityId}),
                        statementIncome = underscore.findWhere(instance.data.monthlyStatement, {uuid: income.uuid});

                    // Check income is not already added
                    if (registerLegalEntity && underscore.isUndefined(statementIncome)) {
                        initializeCategoryValues(instance, 'otherIncome', income.name, numberOfMonths);

                        instance.data.otherIncome[income.name] = underscore.map(income.months, function (monthValue, index) {
                            return (monthValue || 0) + (instance.data.otherIncome[income.name][index] || 0);
                        });
                    }
                });

                underscore.each(instance.models.expenses, function (expense) {
                    var registerLegalEntity = underscore.findWhere(instance.data.legalEntities, {id: expense.legalEntityId}),
                        statementExpense = underscore.findWhere(instance.data.monthlyStatement, {uuid: expense.uuid});

                    // Check expense is not already added
                    if (registerLegalEntity && underscore.isUndefined(statementExpense)) {
                        initializeCategoryValues(instance, 'otherExpenditure', expense.name, numberOfMonths);

                        instance.data.otherExpenditure[expense.name] = underscore.map(expense.months, function (monthValue, index) {
                            return (monthValue || 0) + (instance.data.otherExpenditure[expense.name][index] || 0);
                        });
                    }
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
                                            instance.data.monthlyStatement.push({
                                                uuid: landUse + '-' + category.name,
                                                legalEntityUuid: legalEntity.uuid,
                                                name: landUse,
                                                description: category.name,
                                                type: 'asset',
                                                subtype: 'land use',
                                                source: 'farm valuation',
                                                value: (category.area * category.valuePerHa)
                                            });
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
                                        statementImprovement = underscore.findWhere(instance.data.monthlyStatement, {uuid: improvement.assetKey, type: 'asset'}),
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

                                                // Add asset
                                                instance.data.monthlyStatement.push({
                                                    uuid: improvement.assetKey,
                                                    legalEntityUuid: registerLegalEntity.uuid,
                                                    name: improvement.title,
                                                    description: improvement.description,
                                                    type: 'asset',
                                                    subtype: improvement.type,
                                                    source: 'farm valuation',
                                                    value: improvement.data.assetValue || 0
                                                });
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
                if (Asset.new(asset).validate()) {
                    this.models.assets = underscore.reject(this.models.assets, function (item) {
                        return item.assetKey === asset.assetKey;
                    });

                    this.models.assets.push(asset instanceof Asset ? asset.asJSON() : asset);

                    reEvaluateAssetsAndLiabilities(this);
                }
            });

            privateProperty(this, 'removeAsset', function (asset) {
                this.models.assets = underscore.reject(this.models.assets, function (item) {
                    return item.assetKey === asset.assetKey;
                });

                reEvaluateAssetsAndLiabilities(this);
            });

            privateProperty(this, 'addLiability', function (liability) {
                if (Liability.new(liability).validate()) {
                    this.models.liabilities = underscore.reject(this.models.liabilities, function (item) {
                        return item.uuid === liability.uuid;
                    });

                    this.models.liabilities.push(liability instanceof Liability ? liability.asJSON() : liability);

                    reEvaluateAssetsAndLiabilities(this);
                }
            });

            privateProperty(this, 'removeLiability', function (liability) {
                this.models.liabilities = underscore.reject(this.models.liabilities, function (item) {
                    return item.uuid === liability.uuid;
                });

                reEvaluateAssetsAndLiabilities(this);
            });

            function reEvaluateAssetsAndLiabilities (instance) {
                var startMonth = moment(instance.startDate),
                    endMonth = moment(instance.endDate),
                    numberOfMonths = endMonth.diff(startMonth, 'months');

                instance.data.monthlyStatement = underscore.reject(instance.data.monthlyStatement, function (item) {
                    return underscore.contains(['asset', 'liability'], item.source);
                });

                instance.data.capitalIncome = {};
                instance.data.capitalExpenditure = {};
                instance.data.debtRedemption = {};

                underscore.each(instance.models.assets, function (asset) {
                    asset = Asset.new(asset);

                    var registerLegalEntity = underscore.findWhere(instance.data.legalEntities, {id: asset.legalEntityId}),
                        statementAsset = underscore.findWhere(instance.data.monthlyStatement, {uuid: asset.assetKey});

                    // Check asset is not already added
                    if (asset.type !== 'other' && registerLegalEntity && underscore.isUndefined(statementAsset)) {
                        // VME
                        if (asset.type === 'vme') {
                            var acquisitionDate = moment(asset.data.acquisitionDate),
                                soldDate = moment(asset.data.soldDate);

                            if (asset.data.subtype === 'Vehicles') {
                                if (asset.data.assetValue && acquisitionDate.isBetween(startMonth, endMonth)) {
                                    initializeCategoryValues(instance, 'capitalIncome', 'Vehicle Purchases', numberOfMonths);

                                    instance.data.capitalIncome['Vehicle Purchases'][startMonth.diff(acquisitionDate, 'months')] += asset.data.assetValue;
                                }

                                if (asset.data.sold && asset.data.salePrice && soldDate.isBetween(startMonth, endMonth)) {
                                    initializeCategoryValues(instance, 'capitalExpenditure', 'Vehicle Sales', numberOfMonths);

                                    instance.data.capitalExpenditure['Vehicle Sales'][startMonth.diff(soldDate, 'months')] += asset.data.salePrice;
                                }
                            } else {
                                if (asset.data.assetValue && acquisitionDate.isBetween(startMonth, endMonth)) {
                                    initializeCategoryValues(instance, 'capitalIncome', 'Machinery & Equipment Purchases', numberOfMonths);

                                    instance.data.capitalIncome['Machinery & Equipment Purchases'][startMonth.diff(acquisitionDate, 'Machinery & Equipment Purchases')] += asset.data.assetValue;
                                }

                                if (asset.data.sold && asset.data.salePrice && soldDate.isBetween(startMonth, endMonth)) {
                                    initializeCategoryValues(instance, 'capitalExpenditure', 'Machinery & Equipment Sales', numberOfMonths);

                                    instance.data.capitalExpenditure['Machinery & Equipment Sales'][startMonth.diff(soldDate, 'months')] += asset.data.salePrice;
                                }
                            }
                        }

                        angular.forEach(asset.liabilities, function (liability) {
                            var section = (liability.type === 'rent' ? 'capitalExpenditure' : 'debtRedemption'),
                                typeTitle = (liability.type !== 'other' ? Liability.getTypeTitle(liability.type) : liability.name),
                                liabilityMonths = liability.liabilityInRange(instance.startDate, instance.endDate);

                            initializeCategoryValues(instance, section, typeTitle, numberOfMonths);

                            instance.data[section][typeTitle] = underscore.map(liabilityMonths, function (monthValue, index) {
                                return (monthValue || 0) + (instance.data[section][typeTitle][index] || 0);
                            });
                        });

                        // Add asset
                        instance.data.monthlyStatement.push({
                            uuid: asset.assetKey,
                            legalEntityUuid: registerLegalEntity.uuid,
                            name: asset.title,
                            description: asset.description,
                            type: 'asset',
                            subtype: asset.type,
                            source: 'asset',
                            value: asset.data.assetValue || 0
                        });
                    }
                });

                underscore.each(instance.models.liabilities, function (liability) {
                    liability = Liability.new(liability);

                    var registerLegalEntity = underscore.findWhere(instance.data.legalEntities, {id: liability.legalEntityId}),
                        statementLiability = underscore.findWhere(instance.data.monthlyStatement, {uuid: liability.uuid});

                    // Check asset is not already added
                    if (registerLegalEntity && underscore.isUndefined(statementLiability)) {
                        var section = (liability.type === 'rent' || liability.type === 'other' ? 'capitalExpenditure' : 'debtRedemption'),
                            typeTitle = (liability.type !== 'other' ? Liability.getTypeTitle(liability.type) : liability.name),
                            liabilityMonths = liability.liabilityInRange(instance.startDate, instance.endDate);

                        initializeCategoryValues(instance, section, typeTitle, numberOfMonths);

                        instance.data[section][typeTitle] = underscore.map(liabilityMonths, function (monthValue, index) {
                            return (monthValue || 0) + (instance.data[section][typeTitle][index] || 0);
                        });

                        // Add liability
                        instance.data.monthlyStatement.push({
                            uuid: liability.uuid,
                            legalEntityUuid: registerLegalEntity.uuid,
                            name: liability.name || '',
                            description: liability.description || '',
                            type: 'liability',
                            subtype: 'other',
                            source: 'liability',
                            liability: liability.liabilityInRange(instance.startDate, instance.endDate)
                        });
                    }
                });
            }

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
