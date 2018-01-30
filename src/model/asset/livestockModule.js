var sdkModelLivestock = angular.module('ag.sdk.model.livestock', ['ag.sdk.model.asset', 'ag.sdk.model.stock']);

sdkModelLivestock.factory('Livestock', ['inheritModel', 'privateProperty', 'readOnlyProperty', 'safeMath', 'Stock', 'underscore',
    function (inheritModel, privateProperty, readOnlyProperty, safeMath, Stock, underscore) {
        function Livestock (attrs) {
            Stock.apply(this, arguments);

            readOnlyProperty(this, 'actions', {
                'credit': [
                    'Birth',
                    'Purchase'],
                'debit': [
                    'Death',
                    'Household',
                    'Labour',
                    'Sale']
            });

            readOnlyProperty(this, 'actionTitles', {
                'Birth': 'Register Births',
                'Death': 'Register Deaths',
                'Purchase': 'Purchase Livestock',
                'Household': 'Household Consumption',
                'Labour': 'Labour Consumption',
                'Sale': 'Sell Livestock'
            });

            this.type = 'livestock';
        }

        inheritModel(Livestock, Stock);

        Livestock.validates({
            assetKey: {
                required: true
            },
            data: {
                required: true,
                object: true
            },
            legalEntityId: {
                required: true,
                numeric: true
            },
            type: {
                required: true,
                equal: {
                    to: 'livestock'
                }
            }
        });

        return Livestock;
    }]);
