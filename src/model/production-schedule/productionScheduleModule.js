var sdkModelProductionSchedule = angular.module('ag.sdk.model.production-schedule', ['ag.sdk.library', 'ag.sdk.utilities', 'ag.sdk.model']);

sdkModelProductionSchedule.factory('ProductionSchedule', ['AssetFactory', 'Base', 'computedProperty', 'EnterpriseBudget', 'EnterpriseBudgetBase', 'Field', 'inheritModel', 'Livestock', 'moment', 'privateProperty', 'promiseService', 'readOnlyProperty', 'safeArrayMath', 'safeMath', 'underscore',
    function (AssetFactory, Base, computedProperty, EnterpriseBudget, EnterpriseBudgetBase, Field, inheritModel, Livestock, moment, privateProperty, promiseService, readOnlyProperty, safeArrayMath, safeMath, underscore) {
        function ProductionSchedule (attrs) {
            EnterpriseBudgetBase.apply(this, arguments);

            Base.initializeObject(this.data, 'details', {});

            computedProperty(this, 'costStage', function () {
                return (this.type !== 'horticulture' || this.data.details.assetAge !== 0 ? this.defaultCostStage : underscore.first(ProductionSchedule.costStages));
            });

            privateProperty(this, 'setDate', function (startDate) {
                startDate = moment(startDate).date(1);

                this.startDate = startDate.format('YYYY-MM-DD');

                var monthsPerCycle = 12 / Math.floor(12 / this.numberOfAllocatedMonths),
                    nearestAllocationMonth = (this.budget ? ((monthsPerCycle * Math.floor((startDate.month() - this.budget.cycleStart) / monthsPerCycle)) + this.budget.cycleStart) : startDate.month()),
                    allocationDate = moment([startDate.year()]).add(nearestAllocationMonth, 'M');

                this.startDate = allocationDate.format('YYYY-MM-DD');
                this.endDate = allocationDate.add(1, 'y').format('YYYY-MM-DD');

                if (this.type === 'horticulture') {
                    startDate = moment(this.startDate);

                    this.data.details.establishedDate = (!underscore.isUndefined(this.data.details.establishedDate) ?
                        this.data.details.establishedDate :
                        underscore.chain(this.assets)
                            .map(function (asset) {
                                return asset.data.establishedDate;
                            })
                            .union([this.startDate])
                            .compact()
                            .first()
                            .value());
                    var assetAge = (startDate.isAfter(this.data.details.establishedDate) ? startDate.diff(this.data.details.establishedDate, 'years') : 0);

                    if (assetAge !== this.data.details.assetAge) {
                        this.data.details.assetAge = assetAge;

                        this.recalculate();
                    }
                }
            });

            privateProperty(this, 'addAsset', function (asset) {
                asset = AssetFactory.new(asset);
                asset.$local = true;

                this.assets = underscore.chain(this.assets)
                    .reject(underscore.identity({assetKey: asset.assetKey}))
                    .union([asset])
                    .value();

                if (underscore.size(this.assets) === 1) {
                    setDetails(this, asset);
                }

                this.recalculateSize();
            });

            privateProperty(this, 'removeAsset', function (asset) {
                asset.$delete = true;

                this.recalculateSize();
            });
            
            privateProperty(this, 'setBudget', function (budget) {
                this.budget = EnterpriseBudget.new(underscore.omit(budget, ['followers', 'organization', 'region', 'user', 'userData']));
                this.budgetUuid = this.budget.uuid;
                this.type = this.budget.assetType;

                this.data.budget = this.budget;
                this.data.details = underscore.extend(this.data.details, {
                    commodity: this.budget.commodityType,
                    grossProfit: 0
                });

                if (this.type === 'livestock') {
                    this.data.details = underscore.defaults(this.data.details, {
                        calculatedLSU: 0,
                        grossProfitPerLSU: 0,
                        herdSize: this.budget.data.details.herdSize || 0,
                        stockingDensity: 0,
                        multiplicationFactor: 0
                    });
                } else {
                    this.data.details = underscore.extend(this.data.details, underscore.pick(this.budget.data.details,
                        (this.type === 'horticulture' ? ['maturityFactor', 'cultivar', 'seedProvider'] : ['cultivar', 'seedProvider'])));
                }

                if (this.data.details.pastureType && this.budget.data.details.stockingDensity) {
                    this.setLivestockStockingDensity(this.budget.data.details.stockingDensity[this.data.details.pastureType]);
                }

                this.recalculate();

                if (this.startDate) {
                    this.setDate(this.startDate);
                }
            });

            privateProperty(this, 'setLivestockStockingDensity', function (stockingDensity) {
                if (this.type === 'livestock' && this.data.details.stockingDensity !== stockingDensity) {
                    this.data.details.stockingDensity = stockingDensity;

                    this.setSize(this.allocatedSize);
                }
            });

            privateProperty(this, 'setSize', function (size) {
                this.data.details.size = size;

                if (this.type === 'livestock') {
                    this.data.details.calculatedLSU = safeMath.dividedBy(this.allocatedSize, this.data.details.stockingDensity);

                    if (this.budget) {
                        this.data.details.multiplicationFactor = (this.budget.data.details.herdSize ? safeMath.dividedBy(this.data.details.herdSize, this.budget.data.details.herdSize) : 1);
                        this.data.details.grossProfit = safeMath.times(this.budget.data.details.grossProfit, this.data.details.multiplicationFactor);
                        this.data.details.grossProfitPerLSU = (this.data.details.calculatedLSU ? safeMath.dividedBy(this.data.details.grossProfit, this.data.details.calculatedLSU) : 0);
                    }
                } else if (this.budget) {
                    this.data.details.grossProfit = safeMath.times(this.budget.data.details.grossProfit, this.data.details.size);
                }

                this.recalculate();
            });

            privateProperty(this, 'adjustCategory', function (sectionCode, categoryQuery, costStage, property) {
                return adjustCategory(this, sectionCode, categoryQuery, costStage, property);
            });

            privateProperty(this, 'extractStock', function (stockPickerFn) {
                return extractStock(this, stockPickerFn);
            });

            privateProperty(this, 'updateCategoryStock', function (sectionCode, categoryCode, stock, overwrite) {
                updateCategoryStock(this, sectionCode, categoryCode, stock, overwrite);
            });

            privateProperty(this, 'applyMaturityFactor', function (sectionCode, value) {
                var factor = (this.type === 'horticulture' && this.costStage === 'Yearly' && this.data.details.maturityFactor && this.data.details.maturityFactor[sectionCode] ?
                    (this.data.details.maturityFactor[sectionCode][this.data.details.assetAge - 1] || 0) : 100);

                return safeMath.chain(value)
                    .times(factor)
                    .dividedBy(100)
                    .toNumber();
            });

            privateProperty(this, 'reverseMaturityFactor', function (sectionCode, value) {
                var factor = (this.type === 'horticulture' && this.costStage === 'Yearly' && this.data.details.maturityFactor && this.data.details.maturityFactor[sectionCode] ?
                    (this.data.details.maturityFactor[sectionCode][this.data.details.assetAge - 1] || 0) : 100);

                return safeMath.chain(value)
                    .times(100)
                    .dividedBy(factor)
                    .toNumber();
            });

            privateProperty(this, 'recalculate', function () {
                recalculateProductionSchedule(this);
            });

            privateProperty(this, 'recalculateCategory', function (categoryCode) {
                recalculateProductionScheduleCategory(this, categoryCode);
            });

            privateProperty(this, 'recalculateSize', function () {
                var size = safeMath.round(underscore.chain(this.assets)
                    .reject({'$delete': true})
                    .reduce(function (total, asset) {
                        return safeMath.plus(total, asset.data.plantedArea || asset.data.size);
                    }, 0)
                    .value(), 2);

                if (size !== this.data.details.size) {
                    this.setSize(size);
                    this.$dirty = true;
                }
            });

            computedProperty(this, 'scheduleKey', function () {
                return (this.budgetUuid ? this.budgetUuid + '-' : '') +
                    (this.startDate ? moment(this.startDate).unix() + '-' : '') +
                    (this.endDate ? moment(this.endDate).unix() : '');
            }, {
                enumerable: true
            });

            computedProperty(this, 'assetType', function () {
                return (this.budget ? this.budget.assetType : this.type);
            });

            computedProperty(this, 'commodityType', function () {
                return (this.budget ? this.budget.commodityType : this.data.details.commodity);
            });
            
            computedProperty(this, 'allocatedSize', function () {
                return safeMath.round(this.data.details.size, 2);
            });

            computedProperty(this, 'title', function () {
                return this.allocatedSize + 'ha ' + (this.commodityType ? 'of ' + this.commodityType : '') + (this.startDate ? ' starting ' + moment(this.startDate).format('MMM YYYY') : '');
            });

            computedProperty(this, 'numberOfMonths', function () {
                return moment(this.endDate).diff(this.startDate, 'months');
            });

            privateProperty(this, 'getAllocationIndex', function (sectionCode, costStage) {
                return (this.budget ? this.budget.getAllocationIndex(sectionCode, costStage) : 0);
            });

            privateProperty(this, 'getLastAllocationIndex', function (sectionCode, costStage) {
                return (this.budget ? this.budget.getLastAllocationIndex(sectionCode, costStage) : this.numberOfMonths);
            });

            privateProperty(this, 'getAllocationMonth', function (sectionCode, costStage) {
                return moment(this.startDate).add(this.getAllocationIndex(sectionCode, costStage), 'M');
            });

            privateProperty(this, 'getLastAllocationMonth', function (sectionCode, costStage) {
                return moment(this.startDate).add(this.getLastAllocationIndex(sectionCode, costStage), 'M');
            });

            computedProperty(this, 'numberOfAllocatedMonths', function () {
                return (this.budget ? this.budget.numberOfAllocatedMonths : this.numberOfMonths);
            });

            privateProperty(this, 'inDateRange', function (rangeStart, rangeEnd) {
                rangeStart = moment(rangeStart);
                rangeEnd = moment(rangeEnd);

                var scheduleStart = moment(this.startDate),
                    scheduleEnd = moment(this.endDate);

                return (scheduleStart.isSame(rangeStart) && scheduleEnd.isSame(rangeEnd)) ||
                    (scheduleStart.isSameOrAfter(rangeStart) && scheduleStart.isBefore(rangeEnd)) ||
                    (scheduleEnd.isAfter(rangeStart) && scheduleEnd.isSameOrBefore(rangeEnd));
            });

            computedProperty(this, 'income', function () {
                return underscore.findWhere(this.data.sections, {code: 'INC', costStage: this.costStage});
            });

            computedProperty(this, 'expenses', function () {
                return underscore.findWhere(this.data.sections, {code: 'EXP', costStage: this.costStage});
            });

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            Base.initializeObject(this.data, 'budget', attrs.budget);

            this.id = attrs.id || attrs.$id;
            this.assets = underscore.map(attrs.assets || [], AssetFactory.new);
            this.budgetUuid = attrs.budgetUuid;
            this.endDate = attrs.endDate && moment(attrs.endDate).format('YYYY-MM-DD');
            this.organization = attrs.organization;
            this.organizationId = attrs.organizationId;
            this.startDate = attrs.startDate && moment(attrs.startDate).format('YYYY-MM-DD');
            this.type = attrs.type;

            if (this.data.budget) {
                this.budget = EnterpriseBudget.new(this.data.budget);
            }
        }

        function setDetails (instance, asset) {
            instance.type = ProductionSchedule.typeByAsset[asset.type];
            instance.data.details.irrigated = (asset.data.irrigated === true);

            if (asset.data.crop && instance.type !== 'livestock') {
                instance.data.details.commodity = asset.data.crop;
            }

            if (instance.type === 'horticulture') {
                var startDate = moment(instance.startDate);

                instance.data.details.establishedDate = asset.data.establishedDate || instance.startDate;
                instance.data.details.assetAge = (startDate.isAfter(instance.data.details.establishedDate) ?
                    startDate.diff(instance.data.details.establishedDate, 'years') : 0);
            } else if (instance.type === 'livestock') {
                instance.data.details.pastureType = (asset.data.intensified ? 'pasture' : 'grazing');

                if (instance.budget && instance.budget.data.details.stockingDensity) {
                    instance.setLivestockStockingDensity(instance.budget.data.details.stockingDensity[instance.data.details.pastureType]);
                }
            }
        }

        function adjustCategory (instance, sectionCode, categoryQuery, costStage, property) {
            var categoryCode = (underscore.isObject(categoryQuery) ? categoryQuery.code : categoryQuery),
                productionCategory = instance.getCategory(sectionCode, categoryCode, costStage),
                budgetCategory = instance.budget.getCategory(sectionCode, categoryCode, costStage),
                budgetProperty = property;

            if (productionCategory && budgetCategory) {
                switch (property) {
                    case 'pricePerUnit':
                        budgetCategory.pricePerUnit = productionCategory.pricePerUnit;
                        break;
                    case 'quantity':
                        budgetCategory.quantity = safeMath.dividedBy(instance.reverseMaturityFactor(sectionCode, productionCategory.quantity), (instance.type === 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize));
                        break;
                    case 'quantityPerHa':
                        budgetCategory.quantity = instance.reverseMaturityFactor(sectionCode, productionCategory.quantityPerHa);
                        budgetProperty = 'quantity';
                        break;
                    case 'quantityPerLSU':
                        budgetCategory.quantityPerLSU = productionCategory.quantityPerLSU;
                        break;
                    case 'stock':
                        var assetType = (s.include(categoryCode, 'INC-LSS') ? 'livestock' : 'stock'),
                            stock = instance.findStock(assetType, productionCategory.name, instance.commodityType),
                            reference = [instance.scheduleKey, (sectionCode === 'INC' ? 'Sale' : 'Consumption')].join('/'),
                            ignoredKeys = ['quantity', 'quantityPerMonth'];

                        underscore.extend(budgetCategory, underscore.chain(stock.inventoryInRange(instance.startDate, instance.endDate))
                            .reduce(function (resultCategory, monthly, index) {
                                underscore.chain(monthly.entries)
                                    .filter(function (entry) {
                                        return s.include(entry.reference, reference);
                                    })
                                    .each(function (entry) {
                                        if (budgetCategory.supplyUnit && entry.quantityUnit === budgetCategory.supplyUnit) {
                                            resultCategory.supply = safeMath.plus(resultCategory.supply, entry.quantity);
                                            resultCategory.quantity = safeMath.plus(resultCategory.quantity, entry.rate);
                                        }

                                        resultCategory.valuePerMonth[index] = safeMath.plus(resultCategory.valuePerMonth[index], entry.value);
                                    });

                                return resultCategory;
                            }, {
                                valuePerMonth: Base.initializeArray(instance.budget.numberOfMonths)
                            })
                            .mapObject(function (value, key) {
                                return (underscore.contains(ignoredKeys, key) ? value : (underscore.isArray(value) ? instance.budget.unshiftMonthlyArray(underscore.map(value, function (monthValue) {
                                    return safeMath.dividedBy(instance.reverseMaturityFactor(sectionCode, monthValue), (instance.type === 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize));
                                })) : safeMath.dividedBy(instance.reverseMaturityFactor(sectionCode, value), (instance.type === 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize))));
                            })
                            .value());

                        budgetProperty = 'valuePerMonth';
                        break;
                    case 'supply':
                        budgetCategory.supply = safeMath.dividedBy(productionCategory.supply, (instance.type === 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize));
                        break;
                    case 'value':
                        budgetCategory.value = safeMath.dividedBy(instance.reverseMaturityFactor(sectionCode, productionCategory.value), (instance.type === 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize));
                        break;
                    case 'valuePerHa':
                        budgetCategory.value = instance.reverseMaturityFactor(sectionCode, productionCategory.valuePerHa);
                        budgetProperty = 'value';
                        break;
                    case 'valuePerLSU':
                        budgetCategory.valuePerLSU = productionCategory.valuePerLSU;
                        break;
                    case 'valuePerMonth':
                        var totalFilled = safeArrayMath.count(productionCategory.valuePerMonth),
                            countFilled = 0;

                        budgetCategory.value = safeMath.round(safeMath.dividedBy(instance.reverseMaturityFactor(sectionCode, safeArrayMath.reduce(productionCategory.valuePerMonth)), (instance.type === 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize)), 4);
                        budgetCategory.valuePerMonth = instance.budget.unshiftMonthlyArray(underscore.reduce(productionCategory.valuePerMonth, function (totals, value, index) {
                            if (value > 0) {
                                totals[index] = (index === totals.length - 1 || countFilled === totalFilled - 1 ?
                                    safeMath.minus(budgetCategory.value, safeArrayMath.reduce(totals)) :
                                    safeMath.round(safeMath.dividedBy(instance.reverseMaturityFactor(sectionCode, value), (instance.type === 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize)), 4));
                                countFilled++;
                            }
                            return totals;
                        }, Base.initializeArray(instance.budget.numberOfMonths)));
                        break;
                    default:
                        budgetCategory[property] = productionCategory[property];
                }

                instance.budget.adjustCategory(sectionCode, categoryCode, costStage, budgetProperty);

                recalculateProductionScheduleCategory(instance, categoryCode);

                if (property !== 'stock') {
                    updateCategoryStock(instance, sectionCode, categoryCode);
                }

                instance.$dirty = true;

                return productionCategory[property];
            }
        }

        function extractStock (instance, stockPickerFn) {
            return promiseService.wrap(function (promise) {
                var startDate = moment(instance.startDate);

                if (underscore.isFunction(stockPickerFn)) {
                    underscore.each(instance.data.sections, function (section) {
                        underscore.each(section.productCategoryGroups, function (group) {
                            underscore.each(group.productCategories, function (category) {
                                if (underscore.contains(EnterpriseBudget.stockableCategoryCodes, category.code)) {
                                    var assetType = (group.code === 'INC-LSS' ? 'livestock' : 'stock'),
                                        priceUnit = (category.unit === 'Total' ? undefined : category.unit),
                                        stockType = (section.code === 'INC' ? instance.commodityType : undefined),
                                        stock = stockPickerFn(assetType, stockType, category.name, priceUnit, category.supplyUnit);

                                    if (assetType === 'livestock' && category.value && underscore.isUndefined(stock.data.pricePerUnit)) {
                                        stock.data.pricePerUnit = safeMath.dividedBy(category.value, category.supply || 1);
                                        stock.$dirty = true;
                                    }

                                    instance.updateCategoryStock(section.code, category.code, stock);
                                    instance.addStock(stock);
                                }
                            });

                            if (group.code === 'INC-LSS') {
                                // Representative Animal
                                var representativeAnimal = instance.getRepresentativeAnimal(),
                                    representativeCategory = underscore.findWhere(instance.getGroupCategoryOptions('INC', 'Livestock Sales'), {name: representativeAnimal});

                                // Birth/Weaned Animals
                                var birthAnimal = instance.birthAnimal,
                                    birthCategory = underscore.findWhere(instance.getGroupCategoryOptions('INC', 'Livestock Sales'), {name: birthAnimal}),
                                    weanedCategory = underscore.findWhere(instance.getGroupCategoryOptions('INC', 'Livestock Sales'), {name: Livestock.getWeanedAnimal(instance.commodityType)});

                                if (!underscore.isUndefined(representativeCategory) && !underscore.isUndefined(birthCategory) && !underscore.isUndefined(weanedCategory)) {
                                    var representativeLivestock = stockPickerFn('livestock', instance.commodityType, representativeAnimal, representativeCategory.unit, representativeCategory.supplyUnit),
                                        birthLivestock = stockPickerFn('livestock', instance.commodityType, birthAnimal, birthCategory.unit, birthCategory.supplyUnit),
                                        weanedLivestock = stockPickerFn('livestock', instance.commodityType, weanedCategory.name, weanedCategory.unit, weanedCategory.supplyUnit);

                                    var firstBirthLedgerEntry = underscore.first(birthLivestock.data.ledger),
                                        retainLivestockMap = {
                                            'Retain': birthLivestock,
                                            'Retained': weanedLivestock
                                        };

                                    if (representativeLivestock.data.openingBalance !== instance.data.details.herdSize &&
                                        (underscore.isUndefined(firstBirthLedgerEntry) || moment(instance.startDate).isSameOrBefore(firstBirthLedgerEntry.date))) {
                                        representativeLivestock.data.openingBalance = instance.data.details.herdSize;
                                        representativeLivestock.$dirty = true;
                                    }

                                    instance.budget.addCategory('INC', 'Livestock Sales', representativeCategory.code, instance.costStage);
                                    instance.budget.addCategory('INC', 'Livestock Sales', birthCategory.code, instance.costStage);
                                    instance.budget.addCategory('INC', 'Livestock Sales', weanedCategory.code, instance.costStage);

                                    underscore.each(underscore.keys(instance.budget.data.events).sort(), function (action) {
                                        var shiftedSchedule = instance.budget.shiftMonthlyArray(instance.budget.data.events[action]);

                                        underscore.each(shiftedSchedule, function (rate, index) {
                                            if (rate > 0) {
                                                var formattedDate = moment(startDate).add(index, 'M').format('YYYY-MM-DD'),
                                                    representativeLivestockInventory = representativeLivestock.inventoryBefore(formattedDate),
                                                    ledgerEntry = birthLivestock.findLedgerEntry({
                                                        date: formattedDate,
                                                        action: action,
                                                        reference: instance.scheduleKey
                                                    }),
                                                    actionReference = [instance.scheduleKey, action, formattedDate].join('/'),
                                                    quantity = Math.floor(safeMath.chain(rate)
                                                        .times(representativeLivestockInventory.closing.quantity)
                                                        .dividedBy(100)
                                                        .toNumber()),
                                                    value = safeMath.times(quantity, birthLivestock.data.pricePerUnit);

                                                if (underscore.isUndefined(ledgerEntry)) {
                                                    birthLivestock.addLedgerEntry({
                                                        action: action,
                                                        commodity: instance.commodityType,
                                                        date: formattedDate,
                                                        price: birthLivestock.data.pricePerUnit,
                                                        priceUnit: birthLivestock.data.quantityUnit,
                                                        quantity: quantity,
                                                        quantityUnit: birthLivestock.data.quantityUnit,
                                                        reference: actionReference,
                                                        value: value
                                                    });
                                                } else {
                                                    birthLivestock.setLedgerEntry(ledgerEntry, {
                                                        commodity: instance.commodityType,
                                                        price: birthLivestock.data.pricePerUnit,
                                                        priceUnit: birthLivestock.data.quantityUnit,
                                                        quantity: quantity,
                                                        quantityUnit: birthLivestock.data.quantityUnit,
                                                        reference: actionReference,
                                                        value: value
                                                    });
                                                }

                                                if (action === 'Death') {
                                                    var retainReference = [instance.scheduleKey, 'Retain:' + birthAnimal, formattedDate].join('/');

                                                    // Removed already included retained entries, as it affects the inventory balance
                                                    birthLivestock.removeLedgerEntriesByReference(retainReference);

                                                    // Retains birth animal as weaned animal
                                                    var inventory = birthLivestock.inventoryBefore(formattedDate);

                                                    underscore.each(underscore.keys(retainLivestockMap), function (retainAction) {
                                                        var retainLivestock = retainLivestockMap[retainAction],
                                                            retainLedgerEntry = retainLivestock.findLedgerEntry(retainReference),
                                                            value = inventory.closing.value || safeMath.times(retainLivestock.data.pricePerUnit, inventory.closing.quantity);

                                                        if (underscore.isUndefined(retainLedgerEntry)) {
                                                            retainLivestock.addLedgerEntry({
                                                                action: retainAction + ':' + birthAnimal,
                                                                commodity: instance.commodityType,
                                                                date: formattedDate,
                                                                price: retainLivestock.data.pricePerUnit,
                                                                priceUnit: retainLivestock.data.quantityUnit,
                                                                quantity: inventory.closing.quantity,
                                                                quantityUnit: retainLivestock.data.quantityUnit,
                                                                reference: retainReference,
                                                                value: value
                                                            });
                                                        } else {
                                                            birthLivestock.setLedgerEntry(retainLedgerEntry, {
                                                                commodity: instance.commodityType,
                                                                price: retainLivestock.data.pricePerUnit,
                                                                priceUnit: retainLivestock.data.quantityUnit,
                                                                quantity: inventory.closing.quantity,
                                                                quantityUnit: retainLivestock.data.quantityUnit,
                                                                reference: retainReference,
                                                                value: value
                                                            });
                                                        }
                                                    });
                                                }
                                            }
                                        });
                                    });

                                    instance.addStock(representativeLivestock);
                                    instance.addStock(birthLivestock);
                                    instance.addStock(weanedLivestock);
                                }
                            }
                        });
                    });
                }

                promise.resolve(instance.stock);
            });
        }

        function updateStockLedgerEntry (instance, stock, ledgerEntry, formattedDate, action, category, index, options) {
            var reference = [instance.scheduleKey, action, formattedDate].join('/');

            options = underscore.defaults(options || {}, {
                overwrite: false
            });

            if (underscore.isUndefined(ledgerEntry)) {
                ledgerEntry = underscore.extend({
                    action: action,
                    date: formattedDate,
                    commodity: instance.commodityType,
                    reference: reference,
                    value: category.valuePerMonth[index]
                }, (category.unit === 'Total' ? {} :
                    underscore.extend({
                        price: category.pricePerUnit,
                        priceUnit: category.unit
                    }, (underscore.isUndefined(category.supplyPerMonth) ? {
                        quantity: category.quantityPerMonth[index],
                        quantityUnit: category.unit
                    } : {
                        quantity: category.supplyPerMonth[index],
                        quantityUnit: category.supplyUnit,
                        rate: category.quantity
                    }))));

                stock.addLedgerEntry(ledgerEntry, options);
            } else if (!ledgerEntry.edited || options.overwrite) {
                stock.setLedgerEntry(ledgerEntry, underscore.extend({
                    commodity: instance.commodityType,
                    reference: reference,
                    value: category.valuePerMonth[index]
                }, (category.unit === 'Total' ? {} :
                    underscore.extend({
                        price: category.pricePerUnit,
                        priceUnit: category.unit
                    }, (underscore.isUndefined(category.supplyPerMonth) ? {
                        quantity: category.quantityPerMonth[index],
                        quantityUnit: category.unit
                    } : {
                        quantity: category.supplyPerMonth[index],
                        quantityUnit: category.supplyUnit,
                        rate: category.quantity
                    })))), options);

                if (ledgerEntry.liabilityUuid) {
                    var liability = underscore.findWhere(stock.liabilities, {uuid: ledgerEntry.liabilityUuid});

                    updateLedgerEntryLiability(liability, category.name, formattedDate, action, category.valuePerMonth[index]);
                }
            }

            return ledgerEntry;
        }

        function updateCategoryStock (instance, sectionCode, categoryCode, stock, overwrite) {
            var category = instance.getCategory(sectionCode, categoryCode, instance.costStage),
                assetType = (s.include(categoryCode, 'INC-LSS') ? 'livestock' : 'stock'),
                updateOptions = {
                    overwrite: overwrite === true,
                    recalculate: false
                };

            if (category) {
                stock = stock || instance.findStock(assetType, category.name, instance.commodityType);

                if (stock) {
                    var inputAction = (sectionCode === 'INC' ? 'Production' : 'Purchase'),
                        deliveryAction = 'Deliver',
                        outputAction = (sectionCode === 'INC' ? 'Sale' : 'Consumption');

                    // Remove entries
                    var unassignedLiabilities = underscore.chain(category.valuePerMonth)
                        .reduce(function (results, value, index) {
                            if (value === 0) {
                                var formattedDate = moment(instance.startDate).add(index, 'M').format('YYYY-MM-DD'),
                                    inputLedgerEntry = stock.findLedgerEntry({date: formattedDate, action: inputAction, reference: instance.scheduleKey}),
                                    deliveryLedgerEntry = stock.findLedgerEntry({date: formattedDate, action: deliveryAction, reference: instance.scheduleKey}),
                                    outputLedgerEntry = stock.findLedgerEntry({date: formattedDate, action: outputAction, reference: instance.scheduleKey});

                                if (inputLedgerEntry && inputLedgerEntry.liabilityUuid) {
                                    results.push(underscore.findWhere(stock.liabilities, {uuid: inputLedgerEntry.liabilityUuid}));
                                }

                                stock.removeLedgerEntry(inputLedgerEntry, updateOptions);
                                stock.removeLedgerEntry(deliveryLedgerEntry, updateOptions);
                                stock.removeLedgerEntry(outputLedgerEntry, updateOptions);
                            }

                            return results;
                        }, [])
                        .compact()
                        .value();

                    stock.recalculateLedger();

                    // Add entries
                    underscore.each(category.valuePerMonth, function (value, index) {
                        if (value > 0) {
                            var formattedDate = moment(instance.startDate).add(index, 'M').format('YYYY-MM-DD'),
                                inputLedgerEntry = stock.findLedgerEntry({date: formattedDate, action: inputAction, reference: instance.scheduleKey}),
                                outputLedgerEntry = stock.findLedgerEntry({date: formattedDate, action: outputAction, reference: instance.scheduleKey});

                            if (sectionCode === 'INC') {
                                var deliveryLedgerEntry = stock.findLedgerEntry({date: formattedDate, action: deliveryAction, reference: instance.scheduleKey});

                                updateStockLedgerEntry(instance, stock, deliveryLedgerEntry, formattedDate, deliveryAction, category, index, updateOptions);
                            }

                            if (sectionCode === 'EXP' || instance.assetType !== 'livestock') {
                                inputLedgerEntry = updateStockLedgerEntry(instance, stock, inputLedgerEntry, formattedDate, inputAction, category, index, updateOptions);

                                if (underscore.size(unassignedLiabilities) > 0 && underscore.isUndefined(inputLedgerEntry.liabilityUuid) && inputAction === 'Purchase') {
                                    var liability = unassignedLiabilities.shift();

                                    updateLedgerEntryLiability(liability, category.name, formattedDate, inputAction, value);

                                    inputLedgerEntry.liabilityUuid = liability.uuid;
                                }
                            }

                            updateStockLedgerEntry(instance, stock, outputLedgerEntry, formattedDate, outputAction, category, index, updateOptions);
                        }
                    });

                    stock.recalculateLedger({checkEntries: true});
                }
            }
        }

        function updateLedgerEntryLiability (liability, name, formattedDate, inputAction, value) {
            var liabilityName = name + ' ' + inputAction + ' ' + formattedDate;

            if (liability && (liability.name !== liabilityName || liability.creditLimit !== value || liability.openingDate !== formattedDate)) {
                liability.name = liabilityName;
                liability.creditLimit = value;
                liability.openingDate = formattedDate;
                liability.startDate = formattedDate;

                liability.resetWithdrawals();
                liability.setWithdrawalInMonth(value, formattedDate);
                liability.$dirty = true;
            }
        }

        function recalculateProductionSchedule (instance) {
            if (instance.budget) {
                instance.budget.recalculate();

                instance.data.sections = [];
                instance.clearCache();

                underscore.each(instance.budget.data.sections, function (section) {
                    if (section.costStage === instance.costStage) {
                        underscore.each(section.productCategoryGroups, function (group) {
                            underscore.each(group.productCategories, function (category) {
                                recalculateCategory(instance, section, group, category);
                            });

                            recalculateGroup(instance, section, group);
                        });

                        recalculateSection(instance, section);
                    }
                });

                instance.sortSections();

                recalculateGrossProfit(instance);
            }
        }

        function recalculateProductionScheduleCategory (instance, categoryCode) {
            if (instance.budget) {
                instance.budget.recalculateCategory(categoryCode);

                underscore.each(instance.budget.data.sections, function (section) {
                    if (section.costStage === instance.costStage) {
                        underscore.each(section.productCategoryGroups, function (group) {
                            underscore.each(group.productCategories, function (category) {
                                if (category.code === categoryCode) {
                                    instance.resetCache([category.code, section.costStage]);
                                    instance.resetCache([group.name, section.costStage]);
                                    instance.resetCache([section.code, section.costStage]);

                                    recalculateCategory(instance, section, group, category);
                                    recalculateGroup(instance, section, group);
                                    recalculateSection(instance, section);
                                }
                            });
                        });
                    }
                });

                recalculateGrossProfit(instance);
            }
        }

        function recalculateGrossProfit (instance) {
            instance.data.details.grossProfit = underscore.reduce(instance.data.sections, function (total, section) {
                return (section.code === 'INC' ? safeMath.plus(total, section.total.value) : safeMath.minus(total, section.total.value));
            }, 0);

            if (instance.type === 'livestock') {
                instance.data.details.grossProfitPerLSU = safeMath.dividedBy(instance.data.details.grossProfit, instance.data.details.calculatedLSU);
            }
        }

        function recalculateSection (instance, section) {
            var productionSection = instance.getSection(section.code, section.costStage);

            if (productionSection) {
                productionSection.total.value = underscore.reduce(productionSection.productCategoryGroups, function (total, group) {
                    return safeMath.plus(total, group.total.value);
                }, 0);

                productionSection.total.valuePerMonth = underscore
                    .chain(productionSection.productCategoryGroups)
                    .pluck('total')
                    .pluck('valuePerMonth')
                    .reduce(function (total, valuePerMonth) {
                        return (total ? underscore.map(valuePerMonth, function (value, index) {
                            return safeMath.plus(total[index], value);
                        }) : angular.copy(valuePerMonth));
                    })
                    .value();

                productionSection.total.quantityPerMonth = underscore
                    .chain(productionSection.productCategoryGroups)
                    .pluck('total')
                    .pluck('quantityPerMonth')
                    .reduce(function (total, quantityPerMonth) {
                        return (total ? underscore.map(quantityPerMonth, function (value, index) {
                            return safeMath.plus(total[index], value);
                        }) : angular.copy(quantityPerMonth));
                    })
                    .value();

                if (instance.type === 'livestock') {
                    productionSection.total.valuePerLSU = underscore.reduce(productionSection.productCategoryGroups, function (total, group) {
                        return safeMath.plus(total, group.total.valuePerLSU);
                    }, 0);
                }
            }
        }

        function recalculateGroup (instance, section, group) {
            var productionGroup = instance.getGroup(section.code, group.name, section.costStage);

            if (productionGroup) {
                productionGroup.total.value = underscore.reduce(productionGroup.productCategories, function (total, category) {
                    return safeMath.plus(total, category.value);
                }, 0);

                productionGroup.total.valuePerMonth = underscore
                    .chain(productionGroup.productCategories)
                    .pluck('valuePerMonth')
                    .reduce(function (total, valuePerMonth) {
                        return (total ? underscore.map(valuePerMonth, function (value, index) {
                            return safeMath.plus(total[index], value);
                        }) : angular.copy(valuePerMonth));
                    })
                    .value();

                productionGroup.total.quantityPerMonth = underscore
                    .chain(productionGroup.productCategories)
                    .pluck('quantityPerMonth')
                    .reduce(function (total, quantityPerMonth) {
                        return (total ? underscore.map(quantityPerMonth, function (value, index) {
                            return safeMath.plus(total[index], value);
                        }) : angular.copy(quantityPerMonth));
                    })
                    .value();

                if (instance.type === 'livestock') {
                    productionGroup.total.valuePerLSU = underscore.reduce(productionGroup.productCategories, function (total, category) {
                        return safeMath.plus(total, category.valuePerLSU);
                    }, 0);
                }
            }
        }

        function recalculateCategory (instance, section, group, category) {
            var productionCategory = instance.addCategory(section.code, group.name, category.code, section.costStage);

            productionCategory.name = category.name;
            productionCategory.pricePerUnit = category.pricePerUnit;

            if (instance.type === 'livestock') {
                productionCategory.valuePerLSU = safeMath.plus(productionCategory.valuePerLSU, safeMath.times(category.valuePerLSU, instance.data.details.multiplicationFactor));
                productionCategory.quantityPerLSU = category.quantity;

                if (group.code === 'INC-LSS') {
                    productionCategory.stock = (!underscore.isUndefined(category.stock) ? category.stock : (category.name === instance.getRepresentativeAnimal() ? instance.data.details.herdSize : 0));
                    productionCategory.stockPrice = (!underscore.isUndefined(category.stockPrice) ? category.stockPrice : category.pricePerUnit);
                }
            } else {
                productionCategory.quantityPerHa = instance.applyMaturityFactor(section.code, category.quantity);

                if (section.code === 'EXP') {
                    productionCategory.valuePerHa = instance.applyMaturityFactor(section.code, category.value);
                }
            }

            if (section.code === 'INC' && productionCategory.supplyUnit && productionCategory.unit !== category.unit) {
                category.supplyUnit = productionCategory.supplyUnit;
                category.supply = category.quantity;
                category.quantity = 1;
                category.unit = productionCategory.unit;
            }

            if (!underscore.isUndefined(category.supplyPerMonth)) {
                productionCategory.supply = safeMath.times(category.supply, (instance.type === 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize));

                productionCategory.quantityPerMonth = underscore.map(instance.budget.shiftMonthlyArray(category.quantityPerMonth), function (value) {
                    return safeMath.round(instance.applyMaturityFactor(section.code, value), 2);
                });

                productionCategory.supplyPerMonth = underscore.map(instance.budget.shiftMonthlyArray(category.supplyPerMonth), function (value) {
                    var productionValue = safeMath.times(instance.applyMaturityFactor(section.code, value), (instance.type === 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize));

                    return (category.supplyUnit === 'hd' ? Math.round(productionValue) : productionValue);
                });
            } else {
                productionCategory.quantityPerMonth = underscore.map(instance.budget.shiftMonthlyArray(category.quantityPerMonth), function (value) {
                    return safeMath.round(safeMath.times(instance.applyMaturityFactor(section.code, value), (instance.type === 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize)), 2);
                });
            }

            productionCategory.quantity = safeArrayMath.reduce(productionCategory.quantityPerMonth);

            productionCategory.valuePerMonth = underscore.map(instance.budget.shiftMonthlyArray(category.valuePerMonth), function (value) {
                return safeMath.round(safeMath.times(instance.applyMaturityFactor(section.code, value), (instance.type === 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize)), 2);
            });

            productionCategory.value = safeArrayMath.reduce(productionCategory.valuePerMonth);
        }

        inheritModel(ProductionSchedule, EnterpriseBudgetBase);

        readOnlyProperty(ProductionSchedule, 'productionScheduleTypes', {
            crop: 'Crop',
            horticulture: 'Horticulture',
            livestock: 'Livestock'
        });

        readOnlyProperty(ProductionSchedule, 'allowedLandUse', underscore.difference(Field.landClasses, [
            'Building',
            'Built-up',
            'Erosion',
            'Forest',
            'Homestead',
            'Mining',
            'Non-vegetated',
            'Water',
            'Water (Seasonal)',
            'Wetland']));

        readOnlyProperty(ProductionSchedule, 'allowedAssets', ['crop', 'cropland', 'pasture', 'permanent crop']);

        readOnlyProperty(ProductionSchedule, 'typeByAsset', {
            'crop': 'crop',
            'cropland': 'crop',
            'pasture': 'livestock',
            'permanent crop': 'horticulture'
        });

        readOnlyProperty(ProductionSchedule, 'assetByType', underscore.chain(ProductionSchedule.typeByAsset)
            .omit('cropland')
            .invert()
            .value());

        privateProperty(ProductionSchedule, 'getTypeTitle', function (type) {
            return ProductionSchedule.productionScheduleTypes[type] || '';
        });

        ProductionSchedule.validates({
            budget: {
                required: true,
                object: true
            },
            budgetUuid: {
                required: true,
                format: {
                    uuid: true
                }
            },
            data: {
                required: true,
                object: true
            },
            endDate: {
                required: true,
                format: {
                    date: true
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
            }
        });

        return ProductionSchedule;
    }]);
