var sdkModelBusinessPlanDocument = angular.module('ag.sdk.model.business-plan', ['ag.sdk.id', 'ag.sdk.helper.enterprise-budget', 'ag.sdk.model.asset', 'ag.sdk.model.document', 'ag.sdk.model.legal-entity', 'ag.sdk.model.liability', 'ag.sdk.model.farm-valuation', 'ag.sdk.model.production-schedule']);

sdkModelBusinessPlanDocument.factory('BusinessPlan', ['Asset', 'computedProperty', 'Document', 'enterpriseBudgetHelper', 'FarmValuation', 'generateUUID', 'inheritModel', 'LegalEntity', 'Liability', 'privateProperty', 'ProductionSchedule', 'underscore',
    function (Asset, computedProperty, Document, enterpriseBudgetHelper, FarmValuation, generateUUID, inheritModel, LegalEntity, Liability, privateProperty, ProductionSchedule, underscore) {
        function BusinessPlan (attrs) {
            Document.apply(this, arguments);

            this.docType = 'business plan';

            this.data.account = this.data.account || {
                monthly: [],
                yearly: [],
                openingBalance: 0,
                interestRateCredit: 0,
                interestRateDebit: 0,
                depreciationRate: 0
            };

            this.data.models = this.data.models || {
                assets: [],
                farmValuations: [],
                legalEntities: [],
                liabilities: [],
                productionSchedules: []
            };

            this.data.monthlyStatement = this.data.monthlyStatement || [];
            this.data.adjustmentFactors = this.data.adjustmentFactors || {};
            this.data.livestockValues = this.data.livestockValues || {
                breeding: {
                    stockSales: initializeArray(12),
                    stockPurchases: initializeArray(12)
                },
                marketable: {}
            };

            function reEvaluateBusinessPlan (instance) {
                // Re-evaluate all included models
                reEvaluateLegalEntities(instance);
                reEvaluateFarmValuations(instance);
                reEvaluateProductionSchedules(instance);
                reEvaluateAssetsAndLiabilities(instance);

                recalculate(instance);
            }

            function recalculate (instance) {
                // Re-calculate summary, account & ratio data
                recalculateSummary(instance);
                recalculatePrimaryAccount(instance);
                recalculateRatios(instance);
            }

            /**
             * Helper functions
             */
            function initializeArray(length) {
                return underscore.range(length).map(function () {
                    return 0;
                });
            }

            function infinityToZero(value) {
                return (isFinite(value) ? value : 0);
            }

            function sumCollectionProperty(collection, property) {
                return underscore.chain(collection)
                    .pluck(property)
                    .reduce(function(total, value) {
                        return total + value;
                    }, 0)
                    .value();
            }

            function divideArrayValues (numeratorValues, denominatorValues) {
                if (numeratorValues.length != denominatorValues.length) {
                    return [];
                }

                return underscore.reduce(denominatorValues, function(result, value, index) {
                    result[index] = infinityToZero(result[index] / value);
                    return result;
                }, numeratorValues);
            }

            function addArrayValues (array1, array2) {
                if (!array1 || !array2 || array1.length != array2.length) {
                    return [];
                }

                return underscore.reduce(array1, function(result, value, index) {
                    result[index] += value;
                    return result;
                }, array2);
            }

            function negateArrayValues (array) {
                return underscore.map(array, function(value) {
                    return value * -1;
                });
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
                recalculate(this);
            });

            function initializeCategoryValues(instance, section, category, months) {
                instance.data[section] = instance.data[section] || {};
                instance.data[section][category] = instance.data[section][category] || underscore.range(months).map(function () {
                    return 0;
                });
            }

            function getLowerIndexBound (scheduleArray, offset) {
                return (scheduleArray ? Math.min(scheduleArray.length, Math.abs(Math.min(0, offset))) : 0);
            }

            function getUpperIndexBound (scheduleArray, offset, numberOfMonths) {
                return (scheduleArray ? Math.min(numberOfMonths, offset + scheduleArray.length) - offset : 0);
            }

            function extractGroupCategories(instance, schedule, code, type, startMonth, numberOfMonths) {
                var section = underscore.findWhere(schedule.data.sections, {code: code}),
                // TODO: Fix time zone errors. Temporarily added one day to startDate to ensure it falls in the appropriate month.
                    scheduleStart = moment(schedule.startDate).add(1, 'days');

                if (section) {
                    var offset = scheduleStart.diff(startMonth, 'months');

                    angular.forEach(section.productCategoryGroups, function (group) {
                        angular.forEach(group.productCategories, function (category) {
                            var categoryName = (schedule.type !== 'livestock' && type === 'productionIncome' ? schedule.data.details.commodity : category.name);

                            instance.data[type][categoryName] = instance.data[type][categoryName] || underscore.range(numberOfMonths).map(function () {
                                return 0;
                            });

                            var minIndex = getLowerIndexBound(category.valuePerMonth, offset);
                            var maxIndex = getUpperIndexBound(category.valuePerMonth, offset, numberOfMonths);
                            for (var i = minIndex; i < maxIndex; i++) {
                                instance.data[type][categoryName][i + offset] += (category.valuePerMonth[i] || 0);
                            }
                        });
                    });
                }
            }

            function calculateIncomeComposition(instance, schedule, startMonth, numberOfMonths) {
                var section = underscore.findWhere(schedule.data.sections, {code: 'INC'}),
                // TODO: Fix time zone errors. Temporarily added one day to startDate to ensure it falls in the appropriate month.
                    scheduleStart = moment(schedule.startDate).add(1, 'days');

                if (section) {
                    var numberOfYears = Math.ceil(numberOfMonths / 12);

                    while (instance.data.productionIncomeComposition.length < numberOfYears) {
                        instance.data.productionIncomeComposition.push({});
                    }

                    for (var year = 0; year < numberOfYears; year++) {
                        var monthsInYear = Math.min(12, numberOfMonths - (year * 12));
                        var offset = scheduleStart.diff(moment(startMonth).add(year, 'years'), 'months');

                        angular.forEach(section.productCategoryGroups, function (group) {
                            angular.forEach(group.productCategories, function (category) {
                                var categoryName = (schedule.type !== 'livestock' ? schedule.data.details.commodity : category.name);

                                var compositionCategory = instance.data.productionIncomeComposition[year][categoryName] ||
                                {
                                    unit: category.unit,
                                    pricePerUnit: 0,
                                    quantity: 0,
                                    value: 0
                                };

                                var minIndex = getLowerIndexBound(category.valuePerMonth, offset);
                                var maxIndex = getUpperIndexBound(category.valuePerMonth, offset, monthsInYear);
                                for (var i = minIndex; i < maxIndex; i++) {
                                    compositionCategory.value += category.valuePerMonth[i];
                                }

                                minIndex = getLowerIndexBound(category.quantityPerMonth, offset);
                                maxIndex = getUpperIndexBound(category.quantityPerMonth, offset, monthsInYear);
                                for (i = minIndex; i < maxIndex; i++) {
                                    compositionCategory.quantity += category.quantityPerMonth[i];
                                }

                                compositionCategory.pricePerUnit = ((!compositionCategory.pricePerUnit && category.pricePerUnit) ?
                                    category.pricePerUnit : infinityToZero(compositionCategory.value / compositionCategory.quantity));

                                instance.data.productionIncomeComposition[year][categoryName] = compositionCategory;
                            });
                        });

                        var totalValue = underscore.chain(instance.data.productionIncomeComposition[year])
                            .values()
                            .pluck('value')
                            .reduce(function(total, value) { return total + value; }, 0)
                            .value();

                        for (var categoryName in instance.data.productionIncomeComposition[year]) {
                            if (instance.data.productionIncomeComposition[year].hasOwnProperty(categoryName) && categoryName != 'total') {
                                instance.data.productionIncomeComposition[year][categoryName].contributionPercent =
                                    infinityToZero(instance.data.productionIncomeComposition[year][categoryName].value / totalValue) * 100;
                            }
                        }
                        instance.data.productionIncomeComposition[year].total = {value: totalValue};
                    }
                }
            }

            function reEvaluateProductionSchedules (instance) {
                var startMonth = moment(instance.startDate),
                    endMonth = moment(instance.endDate),
                    numberOfMonths = endMonth.diff(startMonth, 'months');

                instance.data.productionIncome = {};
                instance.data.productionExpenditure = {};
                instance.data.productionIncomeComposition = [];

                angular.forEach(instance.models.productionSchedules, function (productionSchedule) {
                    var schedule = ProductionSchedule.new(productionSchedule);

                    extractGroupCategories(instance, schedule, 'INC', 'productionIncome', startMonth, numberOfMonths);
                    extractGroupCategories(instance, schedule,  'EXP', 'productionExpenditure', startMonth, numberOfMonths);
                    calculateIncomeComposition(instance, schedule, startMonth, numberOfMonths);
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
                    recalculate(this);
                }
            });

            privateProperty(this, 'removeFarmValuation', function (farmValuation) {
                this.models.farmValuations = underscore.reject(this.models.farmValuations, function (valuation) {
                    return valuation.id === farmValuation.id;
                });

                reEvaluateFarmValuations(this);
                recalculate(this);
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

            /**
             *   Assets & Liabilities Handling
             */

            privateProperty(this, 'updateLivestockValues', function() {

            });

            privateProperty(this, 'addAsset', function (asset) {
                if (Asset.new(asset).validate()) {
                    this.models.assets = underscore.reject(this.models.assets, function (item) {
                        return item.assetKey === asset.assetKey;
                    });

                    this.models.assets.push(asset instanceof Asset ? asset.asJSON() : asset);

                    reEvaluateAssetsAndLiabilities(this);
                    recalculate(this);
                }
            });

            privateProperty(this, 'removeAsset', function (asset) {
                this.models.assets = underscore.reject(this.models.assets, function (item) {
                    return item.assetKey === asset.assetKey;
                });

                reEvaluateAssetsAndLiabilities(this);
                recalculate(this);
            });

            privateProperty(this, 'addLiability', function (liability) {
                if (Liability.new(liability).validate()) {
                    this.models.liabilities = underscore.reject(this.models.liabilities, function (item) {
                        return item.uuid === liability.uuid;
                    });

                    this.models.liabilities.push(liability instanceof Liability ? liability.asJSON() : liability);

                    reEvaluateAssetsAndLiabilities(this);
                    recalculate(this);
                }
            });

            privateProperty(this, 'removeLiability', function (liability) {
                this.models.liabilities = underscore.reject(this.models.liabilities, function (item) {
                    return item.uuid === liability.uuid;
                });

                reEvaluateAssetsAndLiabilities(this);
                recalculate(this);
            });

            function updateAssetStatementCategory(instance, category, itemName, asset) {
                instance.data.assetStatement[category] = instance.data.assetStatement[category] || [];

                var index = underscore.findIndex(instance.data.assetStatement[category], function(statementObj) { return statementObj.name == itemName; });
                var assetCategory = (index !== -1 ? instance.data.assetStatement[category].splice(index, 1) : {
                    name: itemName,
                    estimatedValue: 0,
                    currentRMV: 0,
                    yearlyRMV: [],
                    assets: []
                });

                if (!underscore.findWhere(assetCategory.assets, { assetKey: asset.assetKey })) {
                    assetCategory.assets.push(asset);
                }
                assetCategory.estimatedValue += asset.data.assetValue || 0;
                instance.data.assetStatement[category].push(assetCategory);
            }

            function updateLiabilityStatementCategory(instance, liability) {
                var category = (liability.type == 'production-credit' || liability.type == 'rent' ? 'short-term' : liability.type),
                    itemName = (liability.type == 'rent' ? 'Rent overdue' : liability.name),
                    index = underscore.findIndex(instance.data.liabilityStatement[category], function(statementObj) { return statementObj.name == itemName; }),
                    numberOfYears = Math.ceil(moment(instance.endDate).diff(moment(instance.startDate)) / 12),
                    liabilityCategory = (index !== -1 ? instance.data.liabilityStatement[category].splice(index, 1) : {
                        name: itemName,
                        currentValue: 0,
                        yearlyValues: initializeArray(numberOfYears),
                        liabilities: []
                    });

                instance.data.liabilityStatement[category] = instance.data.liabilityStatement[category] || [];

                liabilityCategory.currentValue +=  liability.liabilityInMonth(instance.startDate).opening;

                // Calculate total year-end values for liability category
                for (var year = 0; year < numberOfYears; year++) {
                    var yearEnd = moment.min(moment(instance.endDate), moment(instance.startDate).add(year, 'years').add(11, 'months'));
                    liabilityCategory.yearlyValues[year] += liability.liabilityInMonth(yearEnd).closing;
                }

                if (!underscore.findWhere(liabilityCategory.liabilities, { uuid: liability.uuid })) {
                    liabilityCategory.liabilities.push(liability);
                }
                instance.data.liabilityStatement[category].push(liabilityCategory);
            }

            function calculateAssetStatementRMV(instance) {

            }

            function totalAssetsAndLiabilities(instance) {
                var numberOfYears = Math.ceil(moment(instance.endDate).diff(moment(instance.startDate)) / 12);

                instance.data.assetStatement.total = underscore.chain(instance.data.assetStatement)
                    .values()
                    .flatten(true)
                    .reduce(function(result, asset) {
                        result.estimatedValue += asset.estimatedValue;
                        result.currentRMV += asset.currentRMV;
                        result.yearlyRMV = addArrayValues(result.yearlyRMV, asset.yearlyRMV);
                    }, {
                        estimatedValue: 0,
                        currentRMV: 0,
                        yearlyRMV: initializeArray(numberOfYears)
                    })
                    .value();

                instance.data.liabilityStatement.total = underscore.chain(instance.data.liabilityStatement)
                    .values()
                    .flatten(true)
                    .reduce(function(result, liability) {
                        result.currentValue += liability.currentValue;
                        result.yearlyValues = addArrayValues(result.yearlyValues, liability.yearlyValues);
                    }, {
                        currentValue: 0,
                        yearlyValues: initializeArray(numberOfYears)
                    })
                    .value();
            }

            function reEvaluateAssetsAndLiabilities (instance) {
                var startMonth = moment(instance.startDate),
                    endMonth = moment(instance.endDate),
                    numberOfMonths = endMonth.diff(startMonth, 'months');

                instance.data.monthlyStatement = underscore.reject(instance.data.monthlyStatement, function (item) {
                    return underscore.contains(['asset', 'liability'], item.source);
                });

                instance.data.capitalIncome = {};
                instance.data.capitalExpenditure = {};
                instance.data.otherIncome = {};
                instance.data.otherExpenditure = {};
                instance.data.debtRedemption = {};
                instance.data.assetStatement = {};
                instance.data.liabilityStatement = {};

                underscore.each(instance.models.assets, function (asset) {
                    asset = Asset.new(asset);

                    var registerLegalEntity = underscore.findWhere(instance.data.legalEntities, {id: asset.legalEntityId}),
                        statementAsset = underscore.findWhere(instance.data.monthlyStatement, {uuid: asset.assetKey});

                    // Check asset is not already added
                    if (registerLegalEntity && underscore.isUndefined(statementAsset)) {
                        var acquisitionDate = moment(asset.data.acquisitionDate),
                            soldDate = moment(asset.data.soldDate);

                        // VME
                        if (asset.type === 'vme') {

                            if (asset.data.type === 'Vehicles') {
                                if (asset.data.assetValue && acquisitionDate.isBetween(startMonth, endMonth)) {
                                    initializeCategoryValues(instance, 'capitalIncome', 'Vehicle Purchases', numberOfMonths);

                                    instance.data.capitalIncome['Vehicle Purchases'][startMonth.diff(acquisitionDate, 'months')] += asset.data.assetValue;
                                }

                                if (asset.data.sold && asset.data.salePrice && soldDate.isBetween(startMonth, endMonth)) {
                                    initializeCategoryValues(instance, 'capitalExpenditure', 'Vehicle Sales', numberOfMonths);

                                    instance.data.capitalExpenditure['Vehicle Sales'][startMonth.diff(soldDate, 'months')] += asset.data.salePrice;
                                }

                            } else if (asset.data.type === 'Machinery') {
                                if (asset.data.assetValue && acquisitionDate.isBetween(startMonth, endMonth)) {
                                    initializeCategoryValues(instance, 'capitalIncome', 'Machinery & Plant Purchases', numberOfMonths);

                                    instance.data.capitalIncome['Machinery & Plant Purchases'][startMonth.diff(acquisitionDate, 'months')] += asset.data.assetValue;
                                }

                                if (asset.data.sold && asset.data.salePrice && soldDate.isBetween(startMonth, endMonth)) {
                                    initializeCategoryValues(instance, 'capitalExpenditure', 'Machinery & Plant Sales', numberOfMonths);

                                    instance.data.capitalExpenditure['Machinery & Plant Sales'][startMonth.diff(soldDate, 'months')] += asset.data.salePrice;
                                }
                            }
                        }

                        if (asset.data.assetValue && !(asset.data.sold && soldDate.isBefore(startMonth))) {
                            switch(asset.type) {
                                case 'improvement':
                                case 'farmland':
                                    updateAssetStatementCategory(instance, 'long-term', 'Land and fixed improvements', asset);
                                    break;
                                case 'vme':
                                    updateAssetStatementCategory(instance, 'medium-term', asset.data.type, asset);
                                    break;
                                case 'other':
                                    updateAssetStatementCategory(instance, asset.data.liquidityType, asset.data.name, asset);
                                    break;
                            }
                        }

                        angular.forEach(asset.liabilities, function (liability) {
                            var section = (liability.type === 'rent' ? 'capitalExpenditure' : 'debtRedemption'),
                                typeTitle = (liability.type !== 'other' ? Liability.getTypeTitle(liability.type) : liability.name),
                                liabilityMonths = liability.liabilityInRange(instance.startDate, instance.endDate);

                            initializeCategoryValues(instance, section, typeTitle, numberOfMonths);

                            instance.data[section][typeTitle] = underscore.map(liabilityMonths, function (month, index) {
                                return (month.repayment || 0) + (instance.data[section][typeTitle][index] || 0);
                            });

                            // TODO: deal with missing liquidityType for 'Other' liabilities
                            updateLiabilityStatementCategory(instance, liability)
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
                        var section = (liability.type === 'rent' ? 'capitalExpenditure' : 'debtRedemption'),
                            typeTitle = (liability.type !== 'other' ? Liability.getTypeTitle(liability.type) : liability.name),
                            liabilityMonths = liability.liabilityInRange(instance.startDate, instance.endDate);

                        initializeCategoryValues(instance, section, typeTitle, numberOfMonths);

                        instance.data[section][typeTitle] = underscore.map(liabilityMonths, function (month, index) {
                            return (month.repayment || 0) + (instance.data[section][typeTitle][index] || 0);
                        });

                        // TODO: deal with missing liquidityType for 'Other' liabilities
                        updateLiabilityStatementCategory(instance, liability);

                        // Add liability
                        instance.data.monthlyStatement.push({
                            uuid: liability.uuid,
                            legalEntityUuid: registerLegalEntity.uuid,
                            name: liability.name || '',
                            description: liability.description || '',
                            type: 'liability',
                            subtype: 'other',
                            source: 'liability',
                            liability: liabilityMonths
                        });
                    }
                });

                calculateAssetStatementRMV(instance);
                totalAssetsAndLiabilities(instance);
            }

            /**
             * Recalculate summary & ratio data
             */
            function calculateYearlyTotal (monthlyTotals, year) {
                return underscore.reduce(monthlyTotals.slice((year - 1) * 12, year * 12), function (total, value) {
                    return total + (value || 0);
                }, 0);
            }

            function calculateYearlyInterest (instance, liabilityTypes, startMonth, endMonth, year) {
                return underscore.chain(instance.models.liabilities)
                    .filter(function(liability) {
                        if (!liabilityTypes || liabilityTypes.length == 0) return true;

                        return liabilityTypes.indexOf(liability.type) != -1;
                    })
                    .reduce(function(total, liability) {
                        return total + (underscore.chain(liability.liabilityInRange(startMonth, endMonth).slice((year - 1) * 12, year * 12))
                            .pluck('interest')
                            .reduce(function(total, monthlyInterest) { return total + monthlyInterest; }, 0)
                            .value() || 0);
                    }, 0)
                    .value();
            }

            function calculateYearlyLiabilitiesTotal(instance, liabilityTypes, startMonth, endMonth, year) {
                return underscore.chain(instance.models.liabilities)
                    .filter(function(liability) {
                        if (!liabilityTypes || liabilityTypes.length == 0) return true;

                        return liabilityTypes.indexOf(liability.type) != -1;
                    })
                    .reduce(function(total, l) {
                        var liability = l.liabilityInRange(startMonth, endMonth).slice((year - 1) * 12, year * 12);
                        return total + (liability.length ? liability[liability.length - 1].closing || 0 : 0);
                    }, 0)
                    .value();
            }

            function calculateMonthlyCategoriesTotal (categories, results) {
                underscore.reduce(categories, function (currentTotals, category) {
                    underscore.each(category, function (month, index) {
                        currentTotals[index] += month;
                    });
                }, results);

                return results;
            }

            function calculateMonthlySectionsTotal (sections, results) {
                return underscore.reduce(sections, function (sectionTotals, section) {
                    return calculateMonthlyCategoriesTotal(section, sectionTotals);
                }, results);
            }

            function recalculateSummary (instance) {
                var startMonth = moment(instance.startDate),
                    endMonth = moment(instance.endDate),
                    numberOfMonths = endMonth.diff(startMonth, 'months');

                // Summary of year 1 & year 2 for each category
                instance.data.summary = {};
                instance.data.summary.monthly = {
                    unallocatedProductionIncome: calculateMonthlySectionsTotal([instance.data.unallocatedProductionIncome], initializeArray(numberOfMonths)),
                    unallocatedProductionExpenditure: calculateMonthlySectionsTotal([instance.data.unallocatedProductionExpenditure], initializeArray(numberOfMonths)),
                    capitalIncome: calculateMonthlySectionsTotal([instance.data.capitalIncome], initializeArray(numberOfMonths)),
                    capitalExpenditure: calculateMonthlySectionsTotal([instance.data.capitalExpenditure], initializeArray(numberOfMonths)),
                    otherIncome: calculateMonthlySectionsTotal([instance.data.otherIncome], initializeArray(numberOfMonths)),
                    otherExpenditure: calculateMonthlySectionsTotal([instance.data.otherExpenditure], initializeArray(numberOfMonths)),
                    debtRedemption: calculateMonthlySectionsTotal([instance.data.debtRedemption], initializeArray(numberOfMonths)),
                    totalIncome: calculateMonthlySectionsTotal([instance.data.capitalIncome, instance.data.unallocatedProductionIncome, instance.data.otherIncome], initializeArray(numberOfMonths)),
                    totalExpenditure: calculateMonthlySectionsTotal([instance.data.capitalExpenditure, instance.data.unallocatedProductionExpenditure, instance.data.debtRedemption, instance.data.otherExpenditure], initializeArray(numberOfMonths))
                };

                instance.data.summary.yearly = {
                    unallocatedProductionIncome: [calculateYearlyTotal(instance.data.summary.monthly.unallocatedProductionIncome, 1), calculateYearlyTotal(instance.data.summary.monthly.unallocatedProductionIncome, 2)],
                    unallocatedProductionExpenditure: [calculateYearlyTotal(instance.data.summary.monthly.unallocatedProductionExpenditure, 1), calculateYearlyTotal(instance.data.summary.monthly.unallocatedProductionExpenditure, 2)],
                    capitalIncome: [calculateYearlyTotal(instance.data.summary.monthly.capitalIncome, 1), calculateYearlyTotal(instance.data.summary.monthly.capitalIncome, 2)],
                    capitalExpenditure: [calculateYearlyTotal(instance.data.summary.monthly.capitalExpenditure, 1), calculateYearlyTotal(instance.data.summary.monthly.capitalExpenditure, 2)],
                    otherIncome: [calculateYearlyTotal(instance.data.summary.monthly.otherIncome, 1), calculateYearlyTotal(instance.data.summary.monthly.otherIncome, 2)],
                    otherExpenditure: [calculateYearlyTotal(instance.data.summary.monthly.otherExpenditure, 1), calculateYearlyTotal(instance.data.summary.monthly.otherExpenditure, 2)],
                    debtRedemption: [calculateYearlyTotal(instance.data.summary.monthly.debtRedemption, 1), calculateYearlyTotal(instance.data.summary.monthly.debtRedemption, 2)],
                    totalIncome: [calculateYearlyTotal(instance.data.summary.monthly.totalIncome, 1), calculateYearlyTotal(instance.data.summary.monthly.totalIncome, 2)],
                    totalExpenditure: [calculateYearlyTotal(instance.data.summary.monthly.totalExpenditure, 1), calculateYearlyTotal(instance.data.summary.monthly.totalExpenditure, 2)],
                    productionCapitalInterest: [calculateYearlyInterest(instance, ['short-term', 'production-credit'], startMonth, endMonth, 1), calculateYearlyInterest(instance, ['short-term', 'production-credit'], startMonth, endMonth, 2)],
                    mediumTermInterest: [calculateYearlyInterest(instance, ['medium-term'], startMonth, endMonth, 1), calculateYearlyInterest(instance, ['medium-term'], startMonth, endMonth, 2)],
                    longTermInterest: [calculateYearlyInterest(instance, ['long-term'], startMonth, endMonth, 1), calculateYearlyInterest(instance, ['long-term'], startMonth, endMonth, 2)],
                    totalInterest: [calculateYearlyInterest(instance, [], startMonth, endMonth, 1), calculateYearlyInterest(instance, [], startMonth, endMonth, 2)],
                    currentLiabilities: [calculateYearlyLiabilitiesTotal(instance, ['short-term', 'production-credit'], startMonth, endMonth, 1), calculateYearlyLiabilitiesTotal(instance, ['short-term', 'production-credit'], startMonth, endMonth, 2)],
                    mediumLiabilities: [calculateYearlyLiabilitiesTotal(instance, ['medium-term'], startMonth, endMonth, 1), calculateYearlyLiabilitiesTotal(instance, ['medium-term'], startMonth, endMonth, 2)],
                    longLiabilities: [calculateYearlyLiabilitiesTotal(instance, ['long-term'], startMonth, endMonth, 1), calculateYearlyLiabilitiesTotal(instance, ['long-term'], startMonth, endMonth, 2)],
                    totalLiabilities: [calculateYearlyLiabilitiesTotal(instance, [], startMonth, endMonth, 1), calculateYearlyLiabilitiesTotal(instance, [], startMonth, endMonth, 2)]
                };
            }

            /**
             * Primary Account Handling
             */
            function recalculatePrimaryAccount(instance) {
                var startMonth = moment(instance.startDate),
                    endMonth = moment(instance.endDate),
                    numberOfMonths = endMonth.diff(startMonth, 'months'),
                    numberOfYears = Math.ceil(endMonth.diff(startMonth, 'years', true)),
                    defaultMonthObj = {
                        opening: 0,
                        inflow: 0,
                        outflow: 0,
                        balance: 0,
                        interestPayable: 0,
                        interestReceivable: 0,
                        closing: 0
                    };

                while (instance.account.monthly.length < numberOfMonths) {
                    instance.account.monthly.push(defaultMonthObj);
                }
                while (instance.account.yearly.length < numberOfYears) {
                    instance.account.yearly.push(underscore.extend(defaultMonthObj, { worstBalance: 0, bestBalance: 0, openingMonth: null, closingMonth: null }));
                }

                underscore.each(instance.account.monthly, function (month, index) {
                    month.opening = (index === 0 ? instance.account.openingBalance : instance.account.monthly[index - 1].closing);
                    month.inflow = instance.data.summary.monthly.totalIncome[index];
                    month.outflow = instance.data.summary.monthly.totalExpenditure[index];
                    month.balance = month.opening + month.inflow - month.outflow;
                    month.interestPayable = (month.balance < 0 && instance.account.interestRateCredit ? ((month.opening + month.balance) / 2) * (instance.account.interestRateCredit * 100 / 12) : 0 );
                    month.interestReceivable = (month.balance > 0 && instance.account.interestRateDebit ? ((month.opening + month.balance) / 2) * (instance.account.interestRateDebit * 100 / 12) : 0 );
                    month.closing = month.balance + month.interestPayable + month.interestReceivable;
                });

                underscore.each(instance.account.yearly, function(year, index) {
                    var months = instance.account.monthly.slice(index * 12, (index + 1) * 12);
                    year.opening = months[0].opening;
                    year.inflow = sumCollectionProperty(months, 'inflow');
                    year.outflow = sumCollectionProperty(months, 'outflow');
                    year.balance = year.opening + year.inflow - year.outflow;
                    year.interestPayable = sumCollectionProperty(months, 'interestPayable');
                    year.interestReceivable = sumCollectionProperty(months, 'interestReceivable');
                    year.closing = year.balance + year.interestPayable + year.interestReceivable;
                    year.openingMonth = moment(startMonth).add(index, 'years');
                    year.closingMonth = moment(startMonth).add(index, 'years').add(months.length - 1, 'months').format('MMM-YY');

                    var bestBalance = underscore.max(months, function (month) { return month.closing; }),
                        worstBalance = underscore.min(months, function (month) { return month.closing; });
                    year.bestBalance = {
                        balance: bestBalance.closing,
                        month: moment(year.openingMonth).add(months.indexOf(bestBalance), 'months').format('MMM-YY')
                    };
                    year.worstBalance = {
                        balance: worstBalance.closing,
                        month: moment(year.openingMonth).add(months.indexOf(worstBalance), 'months').format('MMM-YY')
                    };
                    year.openingMonth.format('MMM-YY');

                    if (year < 2) {
                        instance.data.summary.yearly.productionCapitalInterest[year] += -year.interestPayable;
                        instance.data.summary.yearly.totalInterest[year] += -year.interestPayable;
                    }
                });

            }

            function recalculateRatios (instance) {
                instance.data.ratios = {
                    productionCost: calculateRatio(instance, 'totalExpenditure', 'totalIncome'),
                    netCapital: calculateRatio(instance, 'totalAssets', 'totalLiabilities'),
                    gearing: calculateRatio(instance, 'totalLiabilities', ['totalAssets', '-totalLiabilities']),
                    debt: calculateRatio(instance, 'totalLiabilities', 'totalAssets'),
                    //TODO:
                    cashFlowBank: null,
                    cashFlowFarming: null
                };
            }

            function calculateRatio(instance, numeratorProperties, denominatorProperties) {
                if (!underscore.isArray(numeratorProperties)) {
                    numeratorProperties = [numeratorProperties];
                }
                if (!underscore.isArray(denominatorProperties)) {
                    denominatorProperties = [denominatorProperties];
                }

                function fetchPropertiesForInterval (propertyList, interval) {
                    if (!instance.data.summary[interval]) {
                        return [];
                    }

                    return underscore.map(propertyList, function(propertyName) {
                        if (propertyName.charAt(0) === '-') {
                            propertyName = propertyName.substr(1);
                            return negateArrayValues(instance.data.summary[interval][propertyName]);
                        }
                        return instance.data.summary[interval][propertyName];
                    });
                }

                return {
                    monthly: divideArrayValues(addArrayValues(fetchPropertiesForInterval(numeratorProperties, 'monthly')), addArrayValues(fetchPropertiesForInterval(denominatorProperties, 'monthly'))),
                    yearly: divideArrayValues(addArrayValues(fetchPropertiesForInterval(numeratorProperties, 'yearly')), addArrayValues(fetchPropertiesForInterval(denominatorProperties, 'yearly')))
                }
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

            computedProperty(this, 'account', function () {
                return this.data.account;
            });

            computedProperty(this, 'adjustmentFactors', function () {
                return this.data.adjustmentFactors;
            });

            computedProperty(this, 'models', function () {
                return this.data.models;
            });

            computedProperty(this, 'monthlyStatement', function () {
                return this.data.monthlyStatement;
            });

            //TODO: remove this later
            privateProperty(this, 'recalculateModel', function() {
                reEvaluateBusinessPlan(this);
            })
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
