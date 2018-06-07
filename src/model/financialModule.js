var sdkModelFinancial = angular.module('ag.sdk.model.financial', ['ag.sdk.library', 'ag.sdk.model.base', 'ag.sdk.utilities']);

sdkModelFinancial.factory('FinancialBase', ['Base', 'inheritModel', 'Model', 'privateProperty', 'safeMath', 'underscore',
    function (Base, inheritModel, Model, privateProperty, safeMath, underscore) {
        function FinancialBase (attrs) {
            Model.Base.apply(this, arguments);

            this.data = (attrs && attrs.data) || {};
            Base.initializeObject(this.data, 'assets', {});
            Base.initializeObject(this.data, 'liabilities', {});
            Base.initializeObject(this.data, 'ratios', {});

            privateProperty(this, 'recalculate', function () {
                return recalculate(this);
            });

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.id = attrs.id || attrs.$id;
            this.grossProfit = attrs.grossProfit;
            this.netProfit = attrs.netProfit;
            this.netWorth = attrs.netWorth;
            this.year = attrs.year;

            convert(this);
        }

        function convert(instance) {
            underscore.each(['assets', 'liabilities'], function (group) {
                instance.data[group] = underscore.chain(instance.data[group])
                    .omit('undefined')
                    .mapObject(function (categories, type) {
                        return (!underscore.isArray(categories) ?
                            categories :
                            underscore.chain(categories)
                                .map(function (category) {
                                    return [category.name, category.estimatedValue];
                                })
                                .object()
                                .value());
                    })
                    .value();
            });
        }

        inheritModel(FinancialBase, Model.Base);

        function calculateRatio (numeratorProperties, denominatorProperties) {
            numeratorProperties = (underscore.isArray(numeratorProperties) ? numeratorProperties : [numeratorProperties]);
            denominatorProperties = (underscore.isArray(denominatorProperties) ? denominatorProperties : [denominatorProperties]);

            var numerator = underscore.reduce(numeratorProperties, function (total, value) {
                    return safeMath.plus(total, value);
                }, 0),
                denominator = underscore.reduce(denominatorProperties, function (total, value) {
                    return safeMath.plus(total, value);
                }, 0);

            return safeMath.round(safeMath.dividedBy(numerator, denominator), 2);
        }

        function recalculate (instance) {
            instance.data.totalAssets = safeMath.round(underscore.chain(instance.data.assets)
                .values()
                .reduce(function (total, categories) {
                    return underscore.reduce(categories, function (total, value) {
                        return safeMath.plus(total, value);
                    }, total);
                }, 0)
                .value());
            instance.data.totalLiabilities = safeMath.round(underscore.chain(instance.data.liabilities)
                .values()
                .reduce(function (total, categories) {
                    return underscore.reduce(categories, function (total, value) {
                        return safeMath.plus(total, value);
                    }, total);
                }, 0)
                .value());

            instance.netWorth = safeMath.round(safeMath.minus(instance.data.totalAssets, instance.data.totalLiabilities), 2);
            instance.grossProfit = safeMath.round(safeMath.minus(instance.data.productionIncome, instance.data.productionExpenditure), 2);

            instance.data.ebitda = safeMath.round(safeMath.minus(safeMath.plus(instance.grossProfit, instance.data.otherIncome), instance.data.otherExpenditure), 2);
            instance.data.ebit = safeMath.round(safeMath.minus(instance.data.ebitda, instance.data.depreciationAmortization), 2);
            instance.data.ebt = safeMath.round(safeMath.minus(instance.data.ebit, instance.data.interestPaid), 2);

            instance.netProfit = safeMath.round(safeMath.minus(instance.data.ebt, instance.data.taxPaid), 2);

            instance.data.ratios = {
                debt: calculateRatio(instance.data.totalLiabilities, instance.data.totalAssets),
                debtToTurnover: calculateRatio(instance.data.totalLiabilities, [instance.data.productionIncome, instance.data.otherIncome]),
                gearing: calculateRatio(instance.data.totalLiabilities, instance.netWorth),
                inputOutput: calculateRatio(instance.data.productionIncome, instance.data.productionExpenditure),
                interestCover: calculateRatio(instance.grossProfit, instance.data.interestPaid),
                interestToTurnover: calculateRatio(instance.data.interestPaid, [instance.data.productionIncome, instance.data.otherIncome]),
                productionCost: calculateRatio(instance.data.productionExpenditure, instance.data.productionIncome),
                returnOnInvestment: calculateRatio(instance.grossProfit, instance.data.totalAssets)
            };

            instance.$dirty = true;
        }

        FinancialBase.validates({
            year: {
                numeric: true,
                range: {
                    from: 1000,
                    to: 9999
                }
            }
        });

        return FinancialBase;
    }]);

sdkModelFinancial.factory('Financial', ['inheritModel', 'FinancialBase', 'underscore',
    function (inheritModel, FinancialBase, underscore) {
        function Financial (attrs) {
            FinancialBase.apply(this, arguments);

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.legalEntityId = attrs.legalEntityId;

            // Models
            this.legalEntity = attrs.legalEntity;
        }

        inheritModel(Financial, FinancialBase);

        Financial.validates({
            legalEntityId: {
                required: true,
                numeric: true
            },
            year: {
                numeric: true,
                range: {
                    from: 1000,
                    to: 9999
                }
            }
        });

        return Financial;
    }]);


sdkModelFinancial.factory('FinancialGroup', ['inheritModel', 'Financial', 'FinancialBase', 'privateProperty', 'safeMath', 'underscore',
    function (inheritModel, Financial, FinancialBase, privateProperty, safeMath, underscore) {
        function FinancialGroup (attrs) {
            FinancialBase.apply(this, arguments);

            privateProperty(this, 'addFinancial', function (financial) {
                addFinancial(this, financial);
            });

            this.financials = [];

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            underscore.each(attrs.financials, this.addFinancial, this);
        }

        inheritModel(FinancialGroup, FinancialBase);

        function addFinancial (instance, financial) {
            financial = (financial instanceof Financial ? financial : Financial.new(financial));

            instance.year = financial.year;

            instance.financials = underscore.chain(instance.financials)
                .reject(function (item) {
                    return item.legalEntityId === financial.legalEntityId && item.year === financial.year;
                })
                .union([financial])
                .value();

            instance.data = underscore.chain(instance.financials)
                .reduce(function (data, financial) {
                    underscore.each(['assets', 'liabilities'], function (group) {
                        underscore.each(financial.data[group], function (categories, type) {
                            data[group][type] = underscore.reduce(categories, function (result, value, category) {
                                result[category] = safeMath.plus(result[category], value);

                                return result;
                            }, data[group][type] || {});
                        });
                    });

                    return data;
                }, {
                    assets: {},
                    liabilities: {},
                    ratios: {}
                })
                .extend(underscore.chain(['productionIncome', 'productionExpenditure', 'otherIncome', 'otherExpenditure', 'depreciationAmortization', 'interestPaid', 'taxPaid'])
                    .map(function (key) {
                        return [key, underscore.chain(instance.financials)
                            .pluck('data')
                            .pluck(key)
                            .reduce(function(total, value) {
                                return safeMath.plus(total, value);
                            }, 0)
                            .value()];
                    })
                    .object()
                    .value())
                .value();

            instance.recalculate();
        }

        FinancialGroup.validates({
            year: {
                numeric: true,
                range: {
                    from: 1000,
                    to: 9999
                }
            }
        });

        return FinancialGroup;
    }]);