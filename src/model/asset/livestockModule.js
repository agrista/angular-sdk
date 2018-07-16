var sdkModelLivestock = angular.module('ag.sdk.model.livestock', ['ag.sdk.model.asset', 'ag.sdk.model.stock']);

sdkModelLivestock.factory('Livestock', ['computedProperty', 'inheritModel', 'privateProperty', 'readOnlyProperty', 'Stock', 'underscore',
    function (computedProperty, inheritModel, privateProperty, readOnlyProperty, Stock, underscore) {
        function Livestock (attrs) {
            Stock.apply(this, arguments);

            readOnlyProperty(this, 'actions', {
                'credit': [
                    'Birth',
                    'Retained',
                    'Purchase'],
                'debit': [
                    'Death',
                    'Household',
                    'Labour',
                    'Retain',
                    'Sale']
            });

            computedProperty(this, 'actionTitles', function () {
                return getActionTitles(this);
            });

            privateProperty(this, 'getActionTitle', function (action) {
                var splitAction = action.split(':', 2);

                if (splitAction.length === 2) {
                    switch (splitAction[0]) {
                        case 'Retain':
                            return (this.birthAnimal === this.data.category ? 'Wean Livestock' : 'Retain ' + splitAction[1]);
                        case 'Retained':
                            return (this.weanedAnimal === this.data.category ? 'Weaned Livestock' : 'Retained ' + splitAction[1]);
                        default:
                            return splitAction[0];
                    }
                }

                return this.actionTitles[action];
            });

            computedProperty(this, 'baseAnimal', function () {
                return baseAnimals[this.data.type] || this.data.type;
            });

            computedProperty(this, 'birthAnimal', function () {
                return getBirthingAnimal(this.data.type);
            });

            computedProperty(this, 'weanedAnimal', function () {
                return getWeanedAnimal(this.data.type);
            });

            privateProperty(this, 'conversionRate', function () {
                return conversionRate[this.baseAnimal] && (conversionRate[this.baseAnimal][this.data.category] || conversionRate[this.baseAnimal][representativeAnimals[this.baseAnimal]]);
            });

            computedProperty(this, 'representativeAnimal', function () {
                return representativeAnimals[this.baseAnimal];
            });

            this.type = 'livestock';
        }

        inheritModel(Livestock, Stock);

        function getActionTitles (instance) {
            return underscore.chain(actionTitles)
                .pairs()
                .union(underscore.map(animalGrowthStages[instance.baseAnimal][instance.data.category], function (category) {
                    return ['Retain:' + category, (instance.birthAnimal === instance.data.category ? 'Wean Livestock' : 'Retain ' + category)];
                }))
                .sortBy(function (pair) {
                    return pair[0];
                })
                .object()
                .omit(instance.birthAnimal === instance.data.category ? [] : ['Birth', 'Death'])
                .value();
        }

        var actionTitles = {
            'Birth': 'Register Births',
            'Death': 'Register Deaths',
            'Purchase': 'Purchase Livestock',
            'Household': 'Household Consumption',
            'Labour': 'Labour Consumption',
            'Sale': 'Sell Livestock'
        };

        var baseAnimals = {
            'Cattle (Extensive)': 'Cattle',
            'Cattle (Feedlot)': 'Cattle',
            'Cattle (Stud)': 'Cattle',
            'Sheep (Extensive)': 'Sheep',
            'Sheep (Feedlot)': 'Sheep',
            'Sheep (Stud)': 'Sheep'
        };

        var birthAnimals = {
            Cattle: 'Calf',
            Game: 'Calf',
            Goats: 'Kid',
            Rabbits: 'Kit',
            Sheep: 'Lamb'
        };

        var representativeAnimals = {
            Cattle: 'Cow',
            Game: 'Cow',
            Goats: 'Ewe',
            Rabbits: 'Doe',
            Sheep: 'Ewe'
        };

        var animalGrowthStages = {
            Cattle: {
                'Calf': ['Weaner Calf'],
                'Weaner Calf': ['Bull', 'Heifer', 'Steer'],
                'Heifer': ['Cow'],
                'Cow': [],
                'Steer': ['Ox'],
                'Ox': [],
                'Bull': []
            },
            Game: {
                'Calf': ['Weaner Calf'],
                'Weaner Calf': ['Heifer', 'Steer', 'Bull'],
                'Heifer': ['Cow'],
                'Cow': [],
                'Steer': ['Ox'],
                'Ox': [],
                'Bull': []
            },
            Goats: {
                'Kid': ['Weaner Kid'],
                'Weaner Kid': ['Ewe', 'Castrate', 'Ram'],
                'Ewe': [],
                'Castrate': [],
                'Ram': []
            },
            Rabbits: {
                'Kit': ['Weaner Kit'],
                'Weaner Kit': ['Doe', 'Lapin', 'Buck'],
                'Doe': [],
                'Lapin': [],
                'Buck': []
            },
            Sheep: {
                'Lamb': ['Weaner Lamb'],
                'Weaner Lamb': ['Ewe', 'Wether', 'Ram'],
                'Ewe': [],
                'Wether': [],
                'Ram': []
            }
        };

        var conversionRate = {
            Cattle: {
                'Calf': 0.32,
                'Weaner Calf': 0.44,
                'Cow': 1.1,
                'Heifer': 1.1,
                'Steer': 0.75,
                'Ox': 1.1,
                'Bull': 1.36
            },
            Game: {
                'Calf': 0.32,
                'Weaner Calf': 0.44,
                'Cow': 1.1,
                'Heifer': 1.1,
                'Steer': 0.75,
                'Ox': 1.1,
                'Bull': 1.36
            },
            Goats: {
                'Kid': 0.08,
                'Weaner Kid': 0.12,
                'Ewe': 0.17,
                'Castrate': 0.17,
                'Ram': 0.22
            },
            Rabbits: {
                'Kit': 0.08,
                'Weaner Kit': 0.12,
                'Doe': 0.17,
                'Lapin': 0.17,
                'Buck': 0.22
            },
            Sheep: {
                'Lamb': 0.08,
                'Weaner Lamb': 0.11,
                'Ewe': 0.16,
                'Wether': 0.16,
                'Ram': 0.23
            }
        };

        privateProperty(Livestock, 'getBaseAnimal', function (type) {
            return baseAnimals[type] || type;
        });

        function getBirthingAnimal (type) {
            var baseAnimal = baseAnimals[type] || type;

            return baseAnimal && birthAnimals[baseAnimal];
        }

        privateProperty(Livestock, 'getBirthingAnimal', function (type) {
            return getBirthingAnimal(type);
        });

        function getWeanedAnimal (type) {
            var baseAnimal = baseAnimals[type] || type,
                birthAnimal = birthAnimals[baseAnimal];

            return birthAnimal && animalGrowthStages[baseAnimal] && underscore.first(animalGrowthStages[baseAnimal][birthAnimal]);
        }

        privateProperty(Livestock, 'getWeanedAnimal', function (type) {
            return getWeanedAnimal(type);
        });

        privateProperty(Livestock, 'getAnimalGrowthStages', function (type) {
            var baseAnimal = baseAnimals[type] || type;

            return baseAnimal && animalGrowthStages[baseAnimal] || [];
        });

        privateProperty(Livestock, 'getConversionRate', function (type, category) {
            var baseAnimal = baseAnimals[type] || type;

            return baseAnimal && conversionRate[baseAnimal] && (conversionRate[baseAnimal][category] || conversionRate[baseAnimal][representativeAnimals[baseAnimal]]);
        });

        privateProperty(Livestock, 'getConversionRates', function (type) {
            var baseAnimal = baseAnimals[type] || type;

            return baseAnimal && conversionRate[baseAnimal] || {};
        });

        privateProperty(Livestock, 'getRepresentativeAnimal', function (type) {
            var baseAnimal = baseAnimals[type] || type;

            return baseAnimal && representativeAnimals[baseAnimal];
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
