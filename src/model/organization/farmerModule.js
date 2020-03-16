var sdkModelFarmer = angular.module('ag.sdk.model.farmer', ['ag.sdk.model.organization']);

sdkModelFarmer.provider('Farmer', ['OrganizationFactoryProvider', function (OrganizationFactoryProvider) {
    this.$get = ['Organization', 'Base', 'computedProperty', 'inheritModel', 'privateProperty', 'ProductionSchedule', 'readOnlyProperty', 'underscore',
        function (Organization, Base, computedProperty, inheritModel, privateProperty, ProductionSchedule, readOnlyProperty, underscore) {
            function Farmer (attrs) {
                Organization.apply(this, arguments);

                computedProperty(this, 'operationTypeDescription', function () {
                    return Farmer.operationTypeDescriptions[this.type] || '';
                });

                Base.initializeObject(this.data, 'enterprises', []);

                if (underscore.isUndefined(attrs) || arguments.length === 0) return;

                this.operationType = attrs.operationType;

                this.productionSchedules = underscore.map(attrs.productionSchedules, ProductionSchedule.newCopy);
            }

            inheritModel(Farmer, Organization);

            readOnlyProperty(Farmer, 'operationTypes', [
                'Unknown',
                'Commercial',
                'Recreational',
                'Smallholder'
            ]);

            readOnlyProperty(Farmer, 'operationTypeDescriptions', {
                Unknown: 'No farming production information available',
                Commercial: 'Large scale agricultural production',
                Recreational: 'Leisure or hobby farming',
                Smallholder: 'Small farm, limited production'
            });

            privateProperty(Farmer, 'getOperationTypeDescription', function (type) {
                return Farmer.operationTypeDescriptions[type] || '';
            });

            Farmer.validates(underscore.defaults({
                type: {
                    required: true,
                    equal: {
                        to: 'farmer'
                    }
                }
            }, Organization.validations));

            return Farmer;
        }];

    OrganizationFactoryProvider.add('farmer', 'Farmer');
}]);
