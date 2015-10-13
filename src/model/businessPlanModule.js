var sdkModelBusinessPlanDocument = angular.module('ag.sdk.model.business-plan', ['ag.sdk.id', 'ag.sdk.helper.enterprise-budget', 'ag.sdk.model.asset', 'ag.sdk.model.document', 'ag.sdk.model.legal-entity', 'ag.sdk.model.liability', 'ag.sdk.model.farm-valuation', 'ag.sdk.model.production-schedule']);

sdkModelBusinessPlanDocument.factory('BusinessPlan', ['Asset', 'computedProperty', 'Document', 'enterpriseBudgetHelper', 'FarmValuation', 'generateUUID', 'inheritModel', 'LegalEntity', 'Liability', 'privateProperty', 'ProductionSchedule', 'underscore',
    function (Asset, computedProperty, Document, enterpriseBudgetHelper, FarmValuation, generateUUID, inheritModel, LegalEntity, Liability, privateProperty, ProductionSchedule, underscore) {

        var _assetYearEndValueAdjustments = {
            'Land and fixed improvements': [
                {
                    operation: '+',
                    category: 'capitalIncome',
                    item: 'Land Sales'
                },
                {
                    operation: '-',
                    category: 'capitalExpenditure',
                    item: 'Land Purchases'
                },
                {
                    operation: '-',
                    category: 'capitalExpenditure',
                    item: 'Development'
                }
            ],
            'Vehicles': [
                {
                    operation: '+',
                    category: 'capitalIncome',
                    item: 'Vehicle Sales'
                },
                {
                    operation: '-',
                    category: 'capitalExpenditure',
                    item: 'Vehicle Purchases'
                }
            ],
            'Machinery': [
                {
                    operation: '+',
                    category: 'capitalIncome',
                    item: 'Machinery & Plant Sales'
                },
                {
                    operation: '-',
                    category: 'capitalExpenditure',
                    item: 'Machinery & Plant Purchases'
                }
            ],
            'Breeding Stock': [
                {
                    operation: '+',
                    category: 'capitalIncome',
                    item: 'Breeding Stock Sales'
                },
                {
                    operation: '-',
                    category: 'capitalExpenditure',
                    item: 'Breeding Stock Purchases'
                }
            ]
        };

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
            this.data.assetStatement = this.data.assetStatement || { total: {}};
            this.data.liabilityStatement = this.data.liabilityStatement || { total: {} };
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
                if (!numeratorValues || !denominatorValues || numeratorValues.length != denominatorValues.length) {
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

            function subtractArrayValues (array1, array2) {
                return addArrayValues(array1, negateArrayValues(array2));
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
                            .omit('total')
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
                    endMonth = moment(instance.endDate);

                instance.data.productionIncome = {};
                instance.data.productionExpenditure = {};
                instance.data.productionIncomeComposition = [];

                angular.forEach(instance.models.productionSchedules, function (productionSchedule) {
                    var schedule = ProductionSchedule.new(productionSchedule);

                    extractGroupCategories(instance, schedule, 'INC', 'productionIncome', startMonth, instance.numberOfMonths);
                    extractGroupCategories(instance, schedule,  'EXP', 'productionExpenditure', startMonth, instance.numberOfMonths);
                    calculateIncomeComposition(instance, schedule, startMonth, instance.numberOfMonths);
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

            function updateLivestockValues (instance) {
                initializeCategoryValues(instance, 'capitalExpenditure', 'Livestock Purchases', instance.numberOfMonths);

                for (var i = 0; i < instance.data.capitalExpenditure['Livestock Purchases'].length; i++) {
                    instance.data.capitalExpenditure['Livestock Purchases'][i] = instance.data.livestockValues.breeding.stockPurchases[i % 12];
                }

                initializeCategoryValues(instance, 'capitalIncome', 'Livestock Sales', instance.numberOfMonths);

                for (i = 0; i < instance.data.capitalIncome['Livestock Sales'].length; i++) {
                    instance.data.capitalIncome['Livestock Sales'][i] = instance.data.livestockValues.breeding.stockSales[i % 12];
                }

                updateAssetStatementCategory(instance, 'medium-term', 'Breeding Stock', { data: { name: 'Breeding Stock', liquidityType: 'medium-term', assetValue: instance.data.livestockValues.breeding.currentValue } });
                updateAssetStatementCategory(instance, 'short-term', 'Marketable Livestock', { data: { name: 'Marketable Livestock', liquidityType: 'short-term', assetValue: instance.data.livestockValues.marketable.currentValue } });

                calculateAssetStatementRMV(instance);

                updateLivestockRMV('breeding', 'medium-term', 'Breeding Stock');
                updateLivestockRMV('marketable', 'short-term', 'Marketable Livestock');

                function updateLivestockRMV (livestockType, liquidityType, statementItem) {
                    var yearChange = instance.data.livestockValues[livestockType].yearEndValue - instance.data.livestockValues[livestockType].currentValue,
                        itemIndex = underscore.findIndex(instance.data.assetStatement[liquidityType], function(item) { return item.name == statementItem; }),
                        rmvArray = (itemIndex !== -1 ? instance.data.assetStatement[liquidityType][itemIndex].yearlyRMV || [] : []);

                    for (var year = 0; year < rmvArray.length; year++) {
                        instance.data.assetStatement[liquidityType][itemIndex].yearlyRMV[year] = (year == 0 ? instance.data.assetStatement[liquidityType][itemIndex].currentRMV : instance.data.assetStatement[liquidityType][itemIndex].yearlyRMV[year - 1]);
                        instance.data.assetStatement[liquidityType][itemIndex].yearlyRMV[year] += yearChange;
                        instance.data.assetStatement[liquidityType][itemIndex].yearlyRMV[year] *= instance.data.adjustmentFactors[statementItem] || 1;
                    }
                }
            }

            privateProperty(this, 'updateLivestockValues', function() {
                updateLivestockValues(this);
            });

            privateProperty(this, 'addAsset', function (asset) {
                var instance = this;

                asset = Asset.new(asset);

                if (asset.validate()) {
                    instance.models.assets = underscore.reject(instance.models.assets, function (item) {
                        return item.assetKey === asset.assetKey;
                    });

                    asset.liabilities = underscore.chain(asset.liabilities)
                        .map(function (liability) {
                            if (liability.validate()) {
                                instance.models.liabilities = underscore.reject(instance.models.liabilities, function (item) {
                                    return item.uuid === liability.uuid;
                                });

                                instance.models.liabilities.push(liability.asJSON());
                            }

                            return liability.asJSON();
                        })
                        .value();

                    instance.models.assets.push(asset.asJSON());

                    reEvaluateAssetsAndLiabilities(instance);
                    recalculate(instance);
                }
            });

            privateProperty(this, 'removeAsset', function (asset) {
                var instance = this;

                instance.models.assets = underscore.reject(instance.models.assets, function (item) {
                    return item.assetKey === asset.assetKey;
                });

                underscore.each(asset.liabilities, function (liability) {
                    instance.models.liabilities = underscore.reject(instance.models.liabilities, function (item) {
                        return item.uuid === liability.uuid;
                    });
                });

                reEvaluateAssetsAndLiabilities(instance);
                recalculate(instance);

            });

            privateProperty(this, 'addLiability', function (liability) {
                liability = Liability.new(liability);

                if (liability.validate()) {
                    this.models.liabilities = underscore.reject(this.models.liabilities, function (item) {
                        return item.uuid === liability.uuid;
                    });

                    this.models.liabilities.push(liability.asJSON());

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

                var index = underscore.findIndex(instance.data.assetStatement[category], function(statementObj) { return statementObj.name == itemName; }),
                    numberOfYears = Math.ceil(moment(instance.endDate).diff(moment(instance.startDate), 'years', true)),
                    assetCategory = (index !== -1 ? instance.data.assetStatement[category].splice(index, 1)[0] : {
                        name: itemName,
                        estimatedValue: 0,
                        currentRMV: 0,
                        yearlyRMV: initializeArray(numberOfYears),
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
                    numberOfYears = Math.ceil(moment(instance.endDate).diff(moment(instance.startDate), 'years', true)),
                    liabilityCategory = (index !== -1 ? instance.data.liabilityStatement[category].splice(index, 1)[0] : {
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
                angular.forEach(instance.data.assetStatement, function(statementItems) {
                    angular.forEach(statementItems, function(item) {
                        var adjustmentFactor = instance.data.adjustmentFactors[item.name] || 1;
                        item.currentRMV = (item.estimatedValue || 0) * adjustmentFactor;

                        for (var year = 0; year < item.yearlyRMV.length; year++) {
                            var rmv = item.currentRMV;
                            angular.forEach(_assetYearEndValueAdjustments[item.name], function(adjustment) {
                                if (instance.data[adjustment.category][adjustment.item]) {
                                    var value = underscore.reduce(instance.data[adjustment.category][adjustment.item].slice(year * 12, (year + 1) * 12), function(total, value) {
                                        return total + (value || 0);
                                    }, 0);
                                    rmv = (['+', '-'].indexOf(adjustment.operation) != -1 ? eval( rmv + adjustment.operation + value ) : rmv);
                                }
                            });
                            item.yearlyRMV[year] = rmv * adjustmentFactor;
                        }
                    });
                });
            }

            function totalAssetsAndLiabilities(instance) {
                var numberOfYears = Math.ceil(moment(instance.endDate).diff(moment(instance.startDate), 'years', true));

                instance.data.assetStatement.total = underscore.chain(instance.data.assetStatement)
                    .values()
                    .flatten(true)
                    .reduce(function(result, asset) {
                        result.estimatedValue += asset.estimatedValue;
                        result.currentRMV += asset.currentRMV;
                        result.yearlyRMV = addArrayValues(result.yearlyRMV, asset.yearlyRMV);
                        return result;
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
                        return result;
                    }, {
                        currentValue: 0,
                        yearlyValues: initializeArray(numberOfYears)
                    })
                    .value();

                recalculate(instance);
            }

            function reEvaluateAssetsAndLiabilities (instance) {
                var startMonth = moment(instance.startDate),
                    endMonth = moment(instance.endDate),
                    numberOfMonths = endMonth.diff(startMonth, 'months'),
                    evaluatedModels = [];

                instance.data.capitalIncome = {};
                instance.data.capitalExpenditure = {};
                instance.data.otherIncome = {};
                instance.data.otherExpenditure = {};
                instance.data.debtRedemption = {};
                instance.data.assetStatement = {};
                instance.data.liabilityStatement = {};

                underscore.each(instance.models.assets, function (asset) {
                    var registerLegalEntity = underscore.findWhere(instance.data.legalEntities, {id: asset.legalEntityId}),
                        evaluatedAsset = underscore.findWhere(evaluatedModels, {assetKey: asset.assetKey});

                    // Check asset is not already added
                    if (registerLegalEntity && underscore.isUndefined(evaluatedAsset)) {
                        evaluatedModels.push(asset);

                        asset = Asset.new(asset);

                        var acquisitionDate = (asset.data.acquisitionDate ? moment(asset.data.acquisitionDate) : undefined),
                            soldDate = (asset.data.soldDate ? moment(asset.data.soldDate) : undefined),
                            constructionDate = (asset.data.constructionDate ? moment(asset.data.constructionDate) : undefined),
                            demolitionDate = (asset.data.demolitionDate ? moment(asset.data.demolitionDate) : undefined);

                        // VME
                        if (asset.type === 'vme') {
                            if (asset.data.type === 'Vehicles') {
                                if (asset.data.assetValue && acquisitionDate && acquisitionDate.isBetween(startMonth, endMonth)) {
                                    initializeCategoryValues(instance, 'capitalExpenditure', 'Vehicle Purchases', numberOfMonths);

                                    instance.data.capitalExpenditure['Vehicle Purchases'][acquisitionDate.diff(startMonth, 'months')] += asset.data.assetValue;
                                }

                                if (asset.data.sold && asset.data.salePrice && soldDate && soldDate.isBetween(startMonth, endMonth)) {
                                    initializeCategoryValues(instance, 'capitalIncome', 'Vehicle Sales', numberOfMonths);

                                    instance.data.capitalIncome['Vehicle Sales'][soldDate.diff(startMonth, 'months')] += asset.data.salePrice;
                                }

                            } else if (asset.data.type === 'Machinery') {
                                if (asset.data.assetValue && acquisitionDate && acquisitionDate.isBetween(startMonth, endMonth)) {
                                    initializeCategoryValues(instance, 'capitalExpenditure', 'Machinery & Plant Purchases', numberOfMonths);

                                    instance.data.capitalExpenditure['Machinery & Plant Purchases'][acquisitionDate.diff(startMonth, 'months')] += asset.data.assetValue;
                                }

                                if (asset.data.sold && asset.data.salePrice && soldDate && soldDate.isBetween(startMonth, endMonth)) {
                                    initializeCategoryValues(instance, 'capitalIncome', 'Machinery & Plant Sales', numberOfMonths);

                                    instance.data.capitalIncome['Machinery & Plant Sales'][soldDate.diff(startMonth, 'months')] += asset.data.salePrice;
                                }
                            }
                        } else if (asset.type === 'improvement' && asset.data.assetValue && constructionDate && constructionDate.isBetween(startMonth, endMonth)) {
                            initializeCategoryValues(instance, 'capitalExpenditure', 'Development', numberOfMonths);

                            instance.data.capitalExpenditure['Development'][constructionDate.diff(startMonth, 'months')] += asset.data.assetValue;
                        }

                        if (asset.data.assetValue && !(asset.data.sold && soldDate && soldDate.isBefore(startMonth)) && !(asset.data.demolished && demolitionDate && demolitionDate.isBefore(startMonth))) {
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
                            // Check liability is not already added
                            if (underscore.findWhere(evaluatedModels, {uuid: liability.uuid}) === undefined) {
                                evaluatedModels.push(liability);

                                var section = (liability.type === 'rent' ? 'capitalExpenditure' : 'debtRedemption'),
                                    typeTitle = (liability.type !== 'other' ? Liability.getTypeTitle(liability.type) : liability.name),
                                    liabilityMonths = liability.liabilityInRange(instance.startDate, instance.endDate);

                                if (asset.type == 'farmland' && liability.type !== 'rent' && moment(liability.startDate).isBetween(startMonth, endMonth)) {
                                    initializeCategoryValues(instance, 'capitalExpenditure', 'Land Purchases', numberOfMonths);

                                    instance.data.capitalExpenditure['Land Purchases'][moment(liability.startDate).diff(startMonth, 'months')] += liability.openingBalance;
                                }

                                initializeCategoryValues(instance, section, typeTitle, numberOfMonths);

                                instance.data[section][typeTitle] = underscore.map(liabilityMonths, function (month, index) {
                                    return (month.repayment || 0) + (instance.data[section][typeTitle][index] || 0);
                                });

                                // TODO: deal with missing liquidityType for 'Other' liabilities
                                updateLiabilityStatementCategory(instance, liability)
                            }
                        });
                    }
                });

                underscore.each(instance.models.liabilities, function (liability) {
                    // Check liability is not already added
                    if (underscore.findWhere(evaluatedModels, {uuid: liability.uuid}) === undefined) {
                        evaluatedModels.push(liability);

                        liability = Liability.new(liability);

                        var section = (liability.type === 'rent' ? 'capitalExpenditure' : 'debtRedemption'),
                            typeTitle = (liability.type !== 'other' ? Liability.getTypeTitle(liability.type) : liability.name),
                            liabilityMonths = liability.liabilityInRange(instance.startDate, instance.endDate);

                        initializeCategoryValues(instance, section, typeTitle, numberOfMonths);

                        instance.data[section][typeTitle] = underscore.map(liabilityMonths, function (month, index) {
                            return (month.repayment || 0) + (instance.data[section][typeTitle][index] || 0);
                        });

                        // TODO: deal with missing liquidityType for 'Other' liabilities
                        updateLiabilityStatementCategory(instance, liability);
                    }
                });

                updateLivestockValues(instance);
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

            function calculateYearlEndLiabilityBalance(monthlyTotals, year) {
                var yearSlice = monthlyTotals.slice((year - 1) * 12, year * 12);
                return yearSlice[yearSlice.length - 1];
            }

            function calculateMonthlyLiabilityPropertyTotal (instance, liabilityTypes, property, startMonth, endMonth) {
                var liabilities = underscore.filter(instance.models.liabilities, function(liability) {
                        if (!liabilityTypes || liabilityTypes.length == 0) return true;

                        return liabilityTypes.indexOf(liability.type) != -1;
                    });

                if (liabilities.length == 0) return initializeArray(instance.numberOfMonths);

                return underscore.chain(liabilities)
                    .map(function(liability) {
                        var l = new Liability(liability).liabilityInRange(startMonth, endMonth);
                        return underscore.pluck(l, property);
                    })
                    .unzip()
                    .map(function(monthArray) {
                            return underscore.reduce(monthArray, function(total, value) { return total + (value || 0); }, 0);
                        })
                    .value();
            }

            function calculateMonthlyCategoriesTotal (categories, results) {
                underscore.reduce(categories, function (currentTotals, category) {
                    underscore.each(category, function (month, index) {
                        currentTotals[index] += month;
                    });
                    return currentTotals;
                }, results);

                return results;
            }

            function calculateMonthlySectionsTotal (sections, results) {
                return underscore.reduce(sections, function (sectionTotals, section) {
                    return calculateMonthlyCategoriesTotal(section, sectionTotals);
                }, results);
            }

            function getDepreciation(instance) {
                var yearlyDepreciation = underscore.chain(instance.data.assetStatement['medium-term'])
                    .filter(function(item) {
                        return underscore.contains(['Vehicle', 'Machinery', 'Equipment'], item.name);
                    })
                    .map(function(item) {
                        var adjustmentFactor = instance.data.adjustmentFactors[item.name] || 1;
                        for (var i = 0; i < item.yearlyRMV.length; i++) {
                            item.yearlyRMV[i] = (item.yearlyRMV[i] / adjustmentFactor) * (1 - (instance.data.account.depreciationRate || 0));
                        }
                        return item;
                    })
                    .pluck('yearlyRMV')
                    .reduce(function(result, rmvArray) {
                        if (result.length == 0) {
                            result = initializeArray(rmvArray.length);
                        }
                        return addArrayValues(result, rmvArray);
                    }, [])
                    .value();
                return (yearlyDepreciation.length == 0 ? [0,0] : yearlyDepreciation);
            }

            function recalculateSummary (instance) {
                var startMonth = moment(instance.startDate),
                    endMonth = moment(instance.endDate),
                    numberOfMonths = endMonth.diff(startMonth, 'months');

                // Summary of year 1 & year 2 for each category
                instance.data.summary = {};
                instance.data.summary.monthly = {
                    // Income
                    unallocatedProductionIncome: calculateMonthlySectionsTotal([instance.data.unallocatedProductionIncome], initializeArray(numberOfMonths)),
                    productionIncome: calculateMonthlySectionsTotal([instance.data.productionIncome], initializeArray(numberOfMonths)),
                    capitalIncome: calculateMonthlySectionsTotal([instance.data.capitalIncome], initializeArray(numberOfMonths)),
                    otherIncome: calculateMonthlySectionsTotal([instance.data.otherIncome], initializeArray(numberOfMonths)),
                    totalIncome: calculateMonthlySectionsTotal([instance.data.capitalIncome, instance.data.unallocatedProductionIncome, instance.data.otherIncome], initializeArray(numberOfMonths)),

                    // Expenses
                    unallocatedProductionExpenditure: calculateMonthlySectionsTotal([instance.data.unallocatedProductionExpenditure], initializeArray(numberOfMonths)),
                    productionExpenditure: calculateMonthlySectionsTotal([instance.data.productionExpenditure], initializeArray(numberOfMonths)),
                    capitalExpenditure: calculateMonthlySectionsTotal([instance.data.capitalExpenditure], initializeArray(numberOfMonths)),
                    otherExpenditure: calculateMonthlySectionsTotal([instance.data.otherExpenditure], initializeArray(numberOfMonths)),
                    debtRedemption: calculateMonthlySectionsTotal([instance.data.debtRedemption], initializeArray(numberOfMonths)),
                    totalExpenditure: calculateMonthlySectionsTotal([instance.data.capitalExpenditure, instance.data.unallocatedProductionExpenditure, instance.data.debtRedemption, instance.data.otherExpenditure], initializeArray(numberOfMonths)),

                    // Interest
                    primaryAccountInterest: initializeArray(numberOfMonths), //Calculated when primary account is recalculated
                    productionCreditInterest: calculateMonthlyLiabilityPropertyTotal(instance, ['short-term', 'production-credit'], 'interest', startMonth, endMonth),
                    mediumTermInterest: calculateMonthlyLiabilityPropertyTotal(instance, ['medium-term'], 'interest', startMonth, endMonth),
                    longTermInterest: calculateMonthlyLiabilityPropertyTotal(instance, ['long-term'], 'interest', startMonth, endMonth),
                    totalInterest: initializeArray(numberOfMonths), //Calculated when primary account is recalculated

                    // Liabilities
                    currentLiabilities: calculateMonthlyLiabilityPropertyTotal(instance, ['short-term', 'production-credit'], 'closing', startMonth, endMonth),
                    mediumLiabilities: calculateMonthlyLiabilityPropertyTotal(instance, ['medium-term'], 'closing', startMonth, endMonth),
                    longLiabilities: calculateMonthlyLiabilityPropertyTotal(instance, ['long-term'], 'closing', startMonth, endMonth),
                    totalLiabilities: calculateMonthlyLiabilityPropertyTotal(instance, [], 'closing', startMonth, endMonth),
                    totalRent: calculateMonthlyLiabilityPropertyTotal(instance, ['rent'], 'rent', startMonth, endMonth)
                };

                instance.data.summary.yearly = {
                    // Income
                    unallocatedProductionIncome: [calculateYearlyTotal(instance.data.summary.monthly.unallocatedProductionIncome, 1), calculateYearlyTotal(instance.data.summary.monthly.unallocatedProductionIncome, 2)],
                    productionIncome: [calculateYearlyTotal(instance.data.summary.monthly.productionIncome, 1), calculateYearlyTotal(instance.data.summary.monthly.productionIncome, 2)],
                    capitalIncome: [calculateYearlyTotal(instance.data.summary.monthly.capitalIncome, 1), calculateYearlyTotal(instance.data.summary.monthly.capitalIncome, 2)],
                    otherIncome: [calculateYearlyTotal(instance.data.summary.monthly.otherIncome, 1), calculateYearlyTotal(instance.data.summary.monthly.otherIncome, 2)],
                    totalIncome: [calculateYearlyTotal(instance.data.summary.monthly.totalIncome, 1), calculateYearlyTotal(instance.data.summary.monthly.totalIncome, 2)],

                    // Expenses
                    unallocatedProductionExpenditure: [calculateYearlyTotal(instance.data.summary.monthly.unallocatedProductionExpenditure, 1), calculateYearlyTotal(instance.data.summary.monthly.unallocatedProductionExpenditure, 2)],
                    productionExpenditure: [calculateYearlyTotal(instance.data.summary.monthly.productionExpenditure, 1), calculateYearlyTotal(instance.data.summary.monthly.productionExpenditure, 2)],
                    capitalExpenditure: [calculateYearlyTotal(instance.data.summary.monthly.capitalExpenditure, 1), calculateYearlyTotal(instance.data.summary.monthly.capitalExpenditure, 2)],
                    otherExpenditure: [calculateYearlyTotal(instance.data.summary.monthly.otherExpenditure, 1), calculateYearlyTotal(instance.data.summary.monthly.otherExpenditure, 2)],
                    debtRedemption: [calculateYearlyTotal(instance.data.summary.monthly.debtRedemption, 1), calculateYearlyTotal(instance.data.summary.monthly.debtRedemption, 2)],
                    totalExpenditure: [calculateYearlyTotal(instance.data.summary.monthly.totalExpenditure, 1), calculateYearlyTotal(instance.data.summary.monthly.totalExpenditure, 2)],

                    // Interest
                    primaryAccountInterest: initializeArray(2),
                    productionCreditInterest: [calculateYearlyTotal(instance.data.summary.monthly.productionCreditInterest, 1), calculateYearlyTotal(instance.data.summary.monthly.productionCreditInterest, 2)],
                    mediumTermInterest: [calculateYearlyTotal(instance.data.summary.monthly.mediumTermInterest, 1), calculateYearlyTotal(instance.data.summary.monthly.mediumTermInterest, 2)],
                    longTermInterest: [calculateYearlyTotal(instance.data.summary.monthly.longTermInterest, 1), calculateYearlyTotal(instance.data.summary.monthly.longTermInterest, 2)],
                    totalInterest: initializeArray(2),

                    // Liabilities
                    currentLiabilities: [calculateYearlEndLiabilityBalance(instance.data.summary.monthly.currentLiabilities, 1), calculateYearlEndLiabilityBalance(instance.data.summary.monthly.currentLiabilities, 2)],
                    mediumLiabilities: [calculateYearlEndLiabilityBalance(instance.data.summary.monthly.mediumLiabilities, 1), calculateYearlEndLiabilityBalance(instance.data.summary.monthly.mediumLiabilities, 2)],
                    longLiabilities: [calculateYearlEndLiabilityBalance(instance.data.summary.monthly.longLiabilities, 1), calculateYearlEndLiabilityBalance(instance.data.summary.monthly.longLiabilities, 2)],
                    totalLiabilities: [calculateYearlEndLiabilityBalance(instance.data.summary.monthly.totalLiabilities, 1), calculateYearlEndLiabilityBalance(instance.data.summary.monthly.totalLiabilities, 2)],
                    totalRent: [calculateYearlyTotal(instance.data.summary.monthly.totalRent, 1), calculateYearlyTotal(instance.data.summary.monthly.totalRent, 2)],

                    totalAssets: instance.data.assetStatement.total.yearlyRMV || initializeArray(2),
                    depreciation: getDepreciation(instance)
                };

                instance.data.summary.yearly.netFarmIncome = subtractArrayValues(instance.data.summary.yearly.productionIncome, addArrayValues(instance.data.summary.yearly.productionExpenditure, instance.data.summary.yearly.depreciation));
                instance.data.summary.yearly.farmingProfitOrLoss = subtractArrayValues(instance.data.summary.yearly.netFarmIncome, addArrayValues(instance.data.summary.yearly.totalRent, instance.data.summary.yearly.totalInterest));
            }

            /**
             * Primary Account Handling
             */
            function recalculatePrimaryAccount(instance) {
                var startMonth = moment(instance.startDate),
                    endMonth = moment(instance.endDate),
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

                while (instance.account.monthly.length < instance.numberOfMonths) {
                    instance.account.monthly.push(defaultMonthObj);
                }
                while (instance.account.yearly.length < numberOfYears) {
                    instance.account.yearly.push(underscore.extend(defaultMonthObj, { worstBalance: 0, bestBalance: 0, openingMonth: null, closingMonth: null }));
                }

                instance.data.summary.monthly.primaryAccountInterest = initializeArray(instance.numberOfMonths);
                instance.data.summary.monthly.totalInterest = calculateMonthlyLiabilityPropertyTotal(instance, [], 'interest', startMonth, endMonth);

                underscore.each(instance.account.monthly, function (month, index) {
                    month.opening = (index === 0 ? instance.account.openingBalance : instance.account.monthly[index - 1].closing);
                    month.inflow = instance.data.summary.monthly.totalIncome[index];
                    month.outflow = instance.data.summary.monthly.totalExpenditure[index];
                    month.balance = month.opening + month.inflow - month.outflow;
                    month.interestPayable = (month.balance < 0 && instance.account.interestRateCredit ? ((month.opening + month.balance) / 2) * (instance.account.interestRateCredit / 100 / 12) : 0 );
                    month.interestReceivable = (month.balance > 0 && instance.account.interestRateDebit ? ((month.opening + month.balance) / 2) * (instance.account.interestRateDebit / 100 / 12) : 0 );
                    month.closing = month.balance + month.interestPayable + month.interestReceivable;

                    instance.data.summary.monthly.totalInterest[index] += -month.interestPayable;
                    instance.data.summary.monthly.primaryAccountInterest[index] += -month.interestPayable;
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
                });

                instance.data.summary.yearly.primaryAccountInterest = [calculateYearlyTotal(instance.data.summary.monthly.primaryAccountInterest, 1), calculateYearlyTotal(instance.data.summary.monthly.primaryAccountInterest, 2)];
                instance.data.summary.yearly.totalInterest = [calculateYearlyTotal(instance.data.summary.monthly.totalInterest, 1), calculateYearlyTotal(instance.data.summary.monthly.totalInterest, 2)];
            }

            function recalculateRatios (instance) {
                instance.data.ratios = {
                    interestCover: calculateRatio(instance, 'netFarmIncome', 'totalInterest'),
                    inputOutput: calculateRatio(instance, 'productionIncome', ['productionExpenditure', 'productionCreditInterest', 'primaryAccountInterest']),
                    productionCost: calculateRatio(instance, 'productionExpenditure', 'productionIncome'),
                    cashFlowBank: calculateRatio(instance, 'unallocatedProductionIncome', ['unallocatedProductionExpenditure', 'primaryAccountInterest']),
                    //TODO: add payments to co-ops with crop deliveries to cashFlowFarming denominator
                    cashFlowFarming: calculateRatio(instance, ['productionIncome', 'capitalIncome', 'otherIncome'], ['totalExpenditure', 'primaryAccountInterest']),
                    debtToTurnover: calculateRatio(instance, 'totalLiabilities', ['productionIncome', 'otherIncome']),
                    interestToTurnover: calculateRatio(instance, 'totalInterest', ['productionIncome', 'otherIncome']),
                    //TODO: change denominator to total asset value used for farming
                    returnOnInvestment: calculateRatio(instance, 'netFarmIncome', 'totalAssets')
                };

                calculateAssetRatios(instance);
            }

            function calculateAssetRatios (instance) {
                var defaultObj = { yearly: [], currentRMV: 0, estimatedValue: 0 };

                instance.data.ratios = underscore.extend(instance.data.ratios, {
                    netCapital: defaultObj,
                    gearing: defaultObj,
                    debt: defaultObj
                });

                instance.data.ratios.netCapital = underscore.mapObject(instance.data.ratios.netCapital, function(value, key) {
                    if (underscore.contains(['currentRMV', 'estimatedValue'], key)) {
                        return infinityToZero(instance.data.assetStatement.total[key] / instance.data.liabilityStatement.total.currentValue);
                    } else if (key === 'yearly') {
                        return divideArrayValues(instance.data.assetStatement.total.yearlyRMV / instance.data.liabilityStatement.total.yearlyValues);
                    }
                });

                instance.data.ratios.debt = underscore.mapObject(instance.data.ratios.debt, function(value, key) {
                    if (underscore.contains(['currentRMV', 'estimatedValue'], key)) {
                        return infinityToZero(instance.data.liabilityStatement.total.currentValue / instance.data.assetStatement.total[key]);
                    } else if (key === 'yearly') {
                        return divideArrayValues(instance.data.liabilityStatement.total.yearlyValues / instance.data.assetStatement.total.yearlyRMV);
                    }
                });

                instance.data.ratios.gearing = underscore.mapObject(instance.data.ratios.gearing, function(value, key) {
                    if (underscore.contains(['currentRMV', 'estimatedValue'], key)) {
                        return infinityToZero(instance.data.liabilityStatement.total.currentValue / (instance.data.assetStatement.total[key] - instance.data.liabilityStatement.total.currentValue));
                    } else if (key === 'yearly') {
                        return divideArrayValues(instance.data.liabilityStatement.total.yearlyValues / subtractArrayValues(instance.data.assetStatement.total.yearlyRMV, instance.data.liabilityStatement.total.yearlyValues));
                    }
                });
            }

            function calculateRatio(instance, numeratorProperties, denominatorProperties) {
                if (!underscore.isArray(numeratorProperties)) {
                    numeratorProperties = [numeratorProperties];
                }
                if (!underscore.isArray(denominatorProperties)) {
                    denominatorProperties = [denominatorProperties];
                }

                function sumPropertyValuesForInterval (propertyList, interval) {
                    if (!instance.data.summary[interval]) {
                        return [];
                    }

                    var valueArrays = underscore.chain(propertyList)
                        .map(function(propertyName) {
                            if (propertyName.charAt(0) === '-') {
                                propertyName = propertyName.substr(1);
                                return negateArrayValues(instance.data.summary[interval][propertyName]);
                            }
                            return instance.data.summary[interval][propertyName];
                        })
                        .compact()
                        .value();

                    return underscore.reduce(valueArrays.slice(1), function(result, array) {
                        return addArrayValues(result, array);
                    }, angular.copy(valueArrays[0]) || []);
                }

                return {
                    monthly: divideArrayValues(sumPropertyValuesForInterval(numeratorProperties, 'monthly'), sumPropertyValuesForInterval(denominatorProperties, 'monthly')),
                    yearly: divideArrayValues(sumPropertyValuesForInterval(numeratorProperties, 'yearly'), sumPropertyValuesForInterval(denominatorProperties, 'yearly'))
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

            computedProperty(this, 'numberOfMonths', function () {
                return moment(this.endDate).diff(this.startDate, 'months');
            });

            computedProperty(this, 'models', function () {
                return this.data.models;
            });

            computedProperty(this, 'monthlyStatement', function () {
                return this.data.monthlyStatement;
            });

            privateProperty(this, 'recalculateAccount', function() {
                recalculatePrimaryAccount(this);
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
