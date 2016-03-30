var sdkModelProductionSchedule = angular.module('ag.sdk.model.production-schedule', ['ag.sdk.library', 'ag.sdk.model.base']);

sdkModelProductionSchedule.factory('ProductionSchedule', ['computedProperty', 'enterpriseBudgetHelper', 'inheritModel', 'Model', 'moment', 'privateProperty', 'readOnlyProperty', 'underscore',
    function (computedProperty, enterpriseBudgetHelper, inheritModel, Model, moment, privateProperty, readOnlyProperty, underscore) {
        function ProductionSchedule (attrs) {
            Model.Base.apply(this, arguments);

            this.data = (attrs && attrs.data) || {};
            this.data.details = this.data.details || {};

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.assetId = attrs.assetId;
            this.budgetUuid = attrs.budgetUuid;
            this.type = attrs.type;
            this.endDate = attrs.endDate;
            this.id = attrs.id || attrs.$id;
            this.organizationId = attrs.organizationId;
            this.startDate = attrs.startDate;

            this.asset = attrs.asset;
            this.budget = attrs.budget;
            this.organization = attrs.organization;

            privateProperty(this, 'setDate', function (startDate) {
                startDate = moment(startDate);

                var startCycle = this.data.details.cycleStart || startDate.month(),
                    allocationDate = moment([(startDate.month() < startCycle ? startDate.year() - 1 : startDate.year()), startCycle]);

                this.startDate = allocationDate.format();
                this.endDate = allocationDate.add(1, 'y').format();
            });

            privateProperty(this, 'setAsset', function (asset) {
                this.asset = asset;
                this.assetId = asset.id || asset.$id;
                this.data.details.fieldName = asset.data.fieldName;

                if (this.type === 'livestock') {
                    this.data.details.pastureType = (asset.data.irrigated ? 'pasture' : 'grazing');

                    if (this.budget && this.budget.data.details.stockingDensity) {
                        this.setLivestockStockingDensity(this.budget.data.details.stockingDensity[this.data.details.pastureType]);
                    }
                }
                
                if (this.type === 'horticulture') {
                    this.data.details.horticultureStage = enterpriseBudgetHelper.getHorticultureStage(this.data.details.commodity, asset);
                }
                
                this.setSize(asset.data.size);
            });
            
            privateProperty(this, 'setBudget', function (budget) {
                this.budget = budget;
                this.budgetUuid = budget.uuid;
                this.type = budget.assetType;
                this.data = {
                    details: underscore.extend(this.data.details, {
                        budgetName: budget.name,
                        commodity: budget.commodityType,
                        budgetGrossProfit: budget.data.details.grossProfit,
                        grossProfit: 0,
                        regionName: budget.data.details.regionName,
                        cycleStart: budget.data.details.cycleStart
                    }),
                    sections: [],
                    // *NOTE: schedule arrays begin at January, unlike category valuePerMonth arrays
                    schedules: budget.data.schedules || {}
                };

                this.data.details = underscore.extend(this.data.details, (budget.assetType === 'livestock' ? {
                    budgetLSU: budget.data.details.calculatedLSU,
                    calculatedLSU: 0,
                    grossProfitPerLSU: 0,
                    budgetHerdSize: budget.data.details.herdSize || 0,
                    herdSize: budget.data.details.herdSize || 0,
                    stockingDensity: 0,
                    multiplicationFactor: 0
                } : {
                    irrigation: budget.data.details.irrigation,
                    gmo: budget.data.details.gmo || false
                }));

                if (this.data.details.pastureType && this.budget.data.details.stockingDensity) {
                    this.setLivestockStockingDensity(this.budget.data.details.stockingDensity[this.data.details.pastureType]);
                }

                recalculateProductionSchedule(this);
            });

            privateProperty(this, 'setLivestockStockingDensity', function (stockingDensity) {
                if (this.type == 'livestock') {
                    this.data.details.stockingDensity = stockingDensity;

                    this.setSize(this.allocatedSize);
                }
            });

            privateProperty(this, 'setSize', function (size) {
                this.data.details.size = size;

                if (this.type == 'livestock') {
                    this.data.details.calculatedLSU = (this.data.details.stockingDensity ? this.allocatedSize / this.data.details.stockingDensity : 0);
                    this.data.details.multiplicationFactor = (this.data.details.calculatedLSU ? (this.data.details.stockingDensity ? this.allocatedSize / this.data.details.stockingDensity : 0) / this.data.details.calculatedLSU : 0);
                    this.data.details.herdSize = this.data.details.budgetHerdSize * this.data.details.multiplicationFactor;
                    this.data.details.grossProfit = this.data.details.budgetGrossProfit * this.data.details.multiplicationFactor;
                    this.data.details.grossProfitPerLSU = (this.data.details.calculatedLSU ? this.data.details.grossProfit / this.data.details.calculatedLSU : 0);
                } else {
                    this.data.details.grossProfit = this.data.details.budgetGrossProfit * this.data.details.size;
                }

                recalculateProductionSchedule(this);
            });
            
            computedProperty(this, 'allocatedSize', function () {
                return this.data.details.size || 0;
            });

            computedProperty(this, 'income', function () {
                return underscore.findWhere(this.data.sections, {code: 'INC'});
            });

            computedProperty(this, 'expenses', function () {
                return underscore.findWhere(this.data.sections, {code: 'EXP'});
            });
        }

        function recalculateProductionSchedule (instance) {
            if (instance.budget && instance.budget.data.sections) {
                instance.data.sections = [];
                instance.data.details.grossProfit = 0;
                
                angular.forEach(instance.budget.data.sections, function (section) {
                    if (!instance.data.details.horticultureStage || section.horticultureStage === instance.data.details.horticultureStage) {
                        var scheduleSection = underscore
                            .chain(section)
                            .pick('code', 'name')
                            .defaults({
                                productCategoryGroups: [],
                                total: (instance.type == 'livestock' ? {
                                    value: 0,
                                    valuePerLSU: 0
                                } : {value: 0})
                            })
                            .value();

                        instance.data.sections.push(scheduleSection);

                        section.productCategoryGroups.forEach(function (group) {
                            var scheduleGroup = underscore
                                .chain(group)
                                .pick('code', 'name')
                                .defaults({
                                    productCategories: [],
                                    total: (instance.type == 'livestock' ? {
                                        value: 0,
                                        valuePerLSU: 0
                                    } : {value: 0})
                                })
                                .value();

                            scheduleSection.productCategoryGroups.push(scheduleGroup);

                            group.productCategories.forEach(function (category) {
                                var scheduleCategory = underscore
                                    .chain(category)
                                    .pick('code', 'name', 'unit', 'pricePerUnit', 'incomeGroup', 'schedule', 'conversionRate')
                                    .defaults(instance.type == 'livestock' ? {
                                        quantity: 0,
                                        value: 0,
                                        valuePerLSU: 0
                                    } : {
                                        quantity: 0,
                                        value: 0
                                    })
                                    .value();

                                scheduleGroup.productCategories.push(scheduleCategory);

                                if (instance.type == 'livestock') {
                                    scheduleCategory.valuePerLSU = category.valuePerLSU * instance.data.details.multiplicationFactor;
                                    scheduleCategory.quantity = category.quantity * instance.data.details.multiplicationFactor;
                                    scheduleCategory.value = category.value * instance.data.details.multiplicationFactor;

                                    scheduleGroup.total.valuePerLSU += scheduleCategory.valuePerLSU;
                                } else {
                                    scheduleCategory.quantity = category.quantity * instance.allocatedSize;
                                    scheduleCategory.value = category.value * instance.allocatedSize;
                                }

                                var costSchedule = (category.schedule && instance.budget.data.schedules[category.schedule] ?
                                    instance.budget.data.schedules[category.schedule] :
                                    underscore.range(12).map(function () {
                                        return 100 / 12;
                                    }));

                                if (instance.data.details.cycleStart) {
                                    costSchedule = underscore.rest(costSchedule, instance.data.details.cycleStart).concat(
                                        underscore.first(costSchedule, instance.data.details.cycleStart)
                                    );
                                }

                                scheduleCategory.valuePerMonth = underscore.map(costSchedule, function (month) {
                                    return (month / 100) * scheduleCategory.value;
                                });

                                scheduleCategory.quantityPerMonth = underscore.map(costSchedule, function (month) {
                                    return (month / 100) * scheduleCategory.quantity;
                                });

                                scheduleGroup.total.value += scheduleCategory.value;
                                scheduleGroup.total.valuePerMonth = (scheduleGroup.total.valuePerMonth ?
                                    underscore.map(scheduleGroup.total.valuePerMonth, function (month, i) {
                                        return month + scheduleCategory.valuePerMonth[i];
                                    }) : scheduleCategory.valuePerMonth);

                                scheduleGroup.total.quantityPerMonth = (scheduleGroup.total.quantityPerMonth ?
                                    underscore.map(scheduleGroup.total.quantityPerMonth, function (month, i) {
                                        return month + scheduleCategory.quantityPerMonth[i];
                                    }) : scheduleCategory.quantityPerMonth);
                            });

                            scheduleSection.total.value += scheduleGroup.total.value;
                            scheduleSection.total.valuePerMonth = (scheduleSection.total.valuePerMonth ?
                                underscore.map(scheduleSection.total.valuePerMonth, function (month, i) {
                                    return month + scheduleGroup.total.valuePerMonth[i];
                                }) : scheduleGroup.total.valuePerMonth);

                            scheduleSection.total.quantityPerMonth = (scheduleSection.total.quantityPerMonth ?
                                underscore.map(scheduleSection.total.quantityPerMonth, function (month, i) {
                                    return month + scheduleGroup.total.quantityPerMonth[i];
                                }) : scheduleGroup.total.quantityPerMonth);

                            if (instance.type == 'livestock') {
                                scheduleSection.total.valuePerLSU += scheduleGroup.total.valuePerLSU;
                            }
                        });

                        instance.data.details.grossProfit = (scheduleSection.code == 'INC' ?
                            (instance.data.details.grossProfit + scheduleSection.total.value) :
                            (instance.data.details.grossProfit - scheduleSection.total.value));
                    }
                });

                if (instance.type == 'livestock') {
                    instance.data.details.grossProfitPerLSU = (instance.data.details.calculatedLSU ? instance.data.details.grossProfit / instance.data.details.calculatedLSU : 0);
                }
            }
        }

        inheritModel(ProductionSchedule, Model.Base);

        readOnlyProperty(ProductionSchedule, 'productionScheduleTypes', {
            crop: 'Crop',
            horticulture: 'Horticulture',
            livestock: 'Livestock'
        });

        readOnlyProperty(ProductionSchedule, 'allowedLandUse', ['Conservation', 'Cropland', 'Grazing', 'Horticulture (Perennial)', 'Irrigated Cropland', 'Planted Pastures']);

        readOnlyProperty(ProductionSchedule, 'allowedAssets', ['cropland', 'pasture', 'permanent crop']);

        privateProperty(ProductionSchedule, 'getTypeTitle', function (type) {
            return ProductionSchedule.productionScheduleTypes[type] || '';
        });

        ProductionSchedule.validates({
            assetId: {
                required: true,
                numeric: true
            },
            budgetUuid: {
                required: true,
                format: {
                    uuid: true
                }
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
