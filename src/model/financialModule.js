var sdkModelFinancial = angular.module('ag.sdk.model.financial', ['ag.sdk.library', 'ag.sdk.model.base', 'ag.sdk.utilities']);

sdkModelFinancial.factory('Financial', ['$filter', 'inheritModel', 'Model', 'privateProperty', 'underscore',
    function ($filter, inheritModel, Model, privateProperty, underscore) {
        function Financial (attrs) {
            Model.Base.apply(this, arguments);

            this.data = (attrs && attrs.data) || {};
            this.data.assets = this.data.assets || {};
            this.data.liabilities = this.data.liabilities || {};
            this.data.ratios = this.data.ratios || {};

            privateProperty(this, 'recalculate', function () {
                return recalculate(this);
            });

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.month = attrs.month;
            this.year = attrs.year;
            this.id = attrs.id || attrs.$id;
            this.organizationId = attrs.organizationId;

            // Models
            this.organization = attrs.organization;
        }

        inheritModel(Financial, Model.Base);

        var roundValue = $filter('round');

        function calculateRatio (numeratorProperties, denominatorProperties) {
            numeratorProperties = (underscore.isArray(numeratorProperties) ? numeratorProperties : [numeratorProperties]);
            denominatorProperties = (underscore.isArray(denominatorProperties) ? denominatorProperties : [denominatorProperties]);

            var numerator = underscore.reduce(numeratorProperties, function (total, value) {
                    return total + (value || 0);
                }, 0),
                denominator = underscore.reduce(denominatorProperties, function (total, value) {
                    return total + (value || 0);
                }, 0);

            return (denominator ? roundValue(numerator / denominator) : 0);
        }

        function recalculate (instance) {
            instance.data.totalAssets = roundValue(underscore.chain(instance.data.assets)
                .values()
                .flatten()
                .reduce(function (total, asset) {
                    return total + (asset.estimatedValue || 0);
                }, 0)
                .value());
            instance.data.totalLiabilities = roundValue(underscore.chain(instance.data.liabilities)
                .values()
                .flatten()
                .reduce(function (total, liability) {
                    return total + (liability.estimatedValue || 0);
                }, 0)
                .value());

            instance.netWorth = roundValue(instance.data.totalAssets - instance.data.totalLiabilities);
            instance.grossProfit = roundValue((instance.data.productionIncome || 0) - (instance.data.productionExpenditure || 0));

            instance.data.ebitda = roundValue(instance.grossProfit + (instance.data.otherIncome || 0) - (instance.data.otherExpenditure || 0));
            instance.data.ebit = roundValue(instance.data.ebitda - (instance.data.depreciationAmortization || 0));
            instance.data.ebt = roundValue(instance.data.ebit - (instance.data.interestPaid || 0));

            instance.netProfit = roundValue(instance.data.ebt - (instance.data.taxPaid || 0));

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

        Financial.validates({
            organizationId: {
                required: true,
                numeric: true
            },
            month: {
                numeric: true,
                range: {
                    from: 1,
                    to: 12
                }
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
