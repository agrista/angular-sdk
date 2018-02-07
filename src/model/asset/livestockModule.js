var sdkModelLivestock = angular.module('ag.sdk.model.livestock', ['ag.sdk.model.asset', 'ag.sdk.model.stock']);

sdkModelLivestock.factory('Livestock', ['computedProperty', 'inheritModel', 'privateProperty', 'readOnlyProperty', 'Stock', 'underscore',
    function (computedProperty, inheritModel, privateProperty, readOnlyProperty, Stock, underscore) {
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

            computedProperty(this, 'actionTitles', function () {
                return (this.birthAnimal === this.data.category ? actionTitles : underscore.omit(actionTitles, ['Birth', 'Death']));
            });

            computedProperty(this, 'baseAnimal', function () {
                return baseAnimal[this.data.type] || this.data.type;
            });

            computedProperty(this, 'birthAnimal', function () {
                return birthAnimal[this.baseAnimal];
            });

            privateProperty(this, 'conversionRate', function () {
                return conversionRate[this.baseAnimal] && (conversionRate[this.baseAnimal][this.data.category] || conversionRate[this.baseAnimal][representativeAnimal[this.baseAnimal]]);
            });

            computedProperty(this, 'representativeAnimal', function () {
                return representativeAnimal[this.baseAnimal];
            });

            this.type = 'livestock';
        }

        inheritModel(Livestock, Stock);

        var actionTitles = {
            'Birth': 'Register Births',
            'Death': 'Register Deaths',
            'Purchase': 'Purchase Livestock',
            'Household': 'Household Consumption',
            'Labour': 'Labour Consumption',
            'Sale': 'Sell Livestock'
        };

        var baseAnimal = {
            'Cattle (Extensive)': 'Cattle',
            'Cattle (Feedlot)': 'Cattle',
            'Cattle (Stud)': 'Cattle',
            'Sheep (Extensive)': 'Sheep',
            'Sheep (Feedlot)': 'Sheep',
            'Sheep (Stud)': 'Sheep'
        };

        var birthAnimal = {
            Cattle: 'Calf',
            Game: 'Calf',
            Goats: 'Kid',
            Rabbits: 'Kit',
            Sheep: 'Lamb'
        };

        var representativeAnimal = {
            Cattle: 'Cow',
            Game: 'Cow',
            Goats: 'Ewe (2-tooth plus)',
            Rabbits: 'Doe',
            Sheep: 'Ewe'
        };

        var conversionRate = {
            Cattle: {
                'Calf': 0.32,
                'Weaner calf': 0.44,
                'Cow': 1.1,
                'Heifer': 1.1,
                'Steer (18 months plus)': 0.75,
                'Steer (3 years plus)': 1.1,
                'Bull (3 years plus)': 1.36
            },
            Game: {
                'Calf': 0.32,
                'Weaner calf': 0.44,
                'Cow': 1.1,
                'Heifer': 1.1,
                'Steer (18 months plus)': 0.75,
                'Steer (3 years plus)': 1.1,
                'Bull (3 years plus)': 1.36
            },
            Goats: {
                'Kid': 0.08,
                'Weaner kid': 0.12,
                'Ewe (2-tooth plus)': 0.17,
                'Castrate (2-tooth plus)': 0.17,
                'Ram (2-tooth plus)': 0.22
            },
            Rabbits: {
                'Kit': 0.08,
                'Weaner kit': 0.12,
                'Doe': 0.17,
                'Lapin': 0.17,
                'Buck': 0.22
            },
            Sheep: {
                'Lamb': 0.08,
                'Weaner lamb': 0.11,
                'Ewe': 0.16,
                'Wether (2-tooth plus)': 0.16,
                'Ram (2-tooth plus)': 0.23
            }
        };

        privateProperty(Livestock, 'getBaseAnimal', function (type) {
            return baseAnimal[type] || type;
        });

        privateProperty(Livestock, 'getBirthingAnimal', function (type) {
            return baseAnimal[type] && birthAnimal[baseAnimal[type]] || type;
        });

        privateProperty(Livestock, 'getConversionRate', function (type, category) {
            return baseAnimal[type] && conversionRate[baseAnimal[type]] && (conversionRate[baseAnimal[type]][category] || conversionRate[baseAnimal[type]][representativeAnimal[baseAnimal[type]]]);
        });

        privateProperty(Livestock, 'getConversionRates', function (type) {
            return baseAnimal[type] && conversionRate[baseAnimal[type]] || {};
        });

        privateProperty(Livestock, 'getRepresentativeAnimal', function (type) {
            return baseAnimal[type] && representativeAnimal[baseAnimal[type]] || type;
        });

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
