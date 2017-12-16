var sdkModelLivestock = angular.module('ag.sdk.model.livestock', ['ag.sdk.model.asset', 'ag.sdk.model.stock']);

sdkModelLivestock.factory('Livestock', ['inheritModel', 'readOnlyProperty', 'Stock',
    function (inheritModel, readOnlyProperty, Stock) {
        function Livestock (attrs) {
            Stock.apply(this, arguments);

            readOnlyProperty(this, 'actions', {
                'credit': [
                    'Birth',
                    'Purchase'],
                'debit': [
                    'Death',
                    'Household Consumption',
                    'Labour Consumption',
                    'Sale',
                    'Slaughter']
            });

            readOnlyProperty(this, 'actionTitles', {
                'Birth': 'Register Births',
                'Purchase': 'Buy Livestock',
                'Death': 'Register Deaths',
                'Household Consumption': 'Household Consumption',
                'Labour Consumption': 'Labour Consumption',
                'Sale': 'Sell Livestock',
                'Slaughter': 'Slaughter For Sale'
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
