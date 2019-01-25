var sdkModelPointOfInterest = angular.module('ag.sdk.model.point-of-interest', ['ag.sdk.library', 'ag.sdk.model.base']);

sdkModelPointOfInterest.provider('PointOfInterest', ['listServiceMapProvider', function (listServiceMapProvider) {
    this.$get = ['inheritModel', 'Model', 'privateProperty', 'readOnlyProperty', 'underscore',
        function (inheritModel, Model, privateProperty, readOnlyProperty, underscore) {
            function PointOfInterest (attrs) {
                Model.Base.apply(this, arguments);

                if (underscore.isUndefined(attrs) || arguments.length === 0) return;

                this.id = attrs.id || attrs.$id;
                this.accessAir = attrs.accessAir;
                this.accessRail = attrs.accessRail;
                this.accessRoad = attrs.accessRoad;
                this.accessSea = attrs.accessSea;
                this.addressCity = attrs.addressCity;
                this.addressCode = attrs.addressCode;
                this.addressDistrict = attrs.addressDistrict;
                this.addressStreet1 = attrs.addressStreet1;
                this.addressStreet2 = attrs.addressStreet2;
                this.location = attrs.location;
                this.name = attrs.name;
                this.organization = attrs.organization;
                this.organizationId = attrs.organizationId;
                this.poiKey = attrs.poiKey;
                this.type = attrs.type;
            }

            inheritModel(PointOfInterest, Model.Base);

            var BRANCH = 'Branch',
                DEPOT = 'Depot',
                FARM_GATE = 'Farm Gate',
                GINNERY = 'Ginnery',
                GRAIN_MILL = 'Grain Mill',
                HEAD_OFFICE = 'Head Office',
                HOMESTEAD = 'Homestead',
                MARKET = 'Market',
                PACKHOUSE = 'Packhouse',
                SHED = 'Shed',
                SILO = 'Silo',
                SUGAR_MILL = 'Sugar Mill',
                TANK = 'Tank';

            readOnlyProperty(PointOfInterest, 'types', [
                BRANCH,
                DEPOT,
                FARM_GATE,
                GINNERY,
                GRAIN_MILL,
                HEAD_OFFICE,
                HOMESTEAD,
                MARKET,
                PACKHOUSE,
                SHED,
                SILO,
                SUGAR_MILL,
                TANK]);

            readOnlyProperty(PointOfInterest, 'organizationTypes', {
                farmer: [
                    FARM_GATE,
                    HOMESTEAD,
                    SHED,
                    TANK],
                merchant: [
                    BRANCH,
                    DEPOT,
                    GINNERY,
                    GRAIN_MILL,
                    HEAD_OFFICE,
                    MARKET,
                    PACKHOUSE,
                    SILO,
                    SUGAR_MILL]
            });

            privateProperty(PointOfInterest, 'getOrganizationTypes', function (type) {
                return PointOfInterest.organizationTypes[type] || PointOfInterest.organizationTypes['merchant'];
            });

            PointOfInterest.validates({
                addressCity: {
                    length: {
                        min: 1,
                        max: 255
                    }
                },
                addressCode: {
                    length: {
                        min: 1,
                        max: 255
                    }
                },
                addressDistrict: {
                    length: {
                        min: 1,
                        max: 255
                    }
                },
                addressStreet1: {
                    length: {
                        min: 1,
                        max: 255
                    }
                },
                addressStreet2: {
                    length: {
                        min: 1,
                        max: 255
                    }
                },
                location: {
                    required: false,
                    object: true
                },
                name: {
                    required: true,
                    length: {
                        min: 1,
                        max: 255
                    }
                },
                type: {
                    required: true,
                    inclusion: {
                        in: PointOfInterest.types
                    }
                }
            });

            return PointOfInterest;
        }];

    listServiceMapProvider.add('point of interest', [function () {
        return function (item) {
            return {
                id: item.id || item.$id,
                title: item.name,
                subtitle: item.type
            };
        };
    }]);
}]);
