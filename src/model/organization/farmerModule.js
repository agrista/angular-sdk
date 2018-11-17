var sdkModelFarmer = angular.module('ag.sdk.model.farmer', ['ag.sdk.model.organization']);

sdkModelFarmer.factory('Farmer', ['Organization', 'Base', 'computedProperty', 'inheritModel', 'privateProperty', 'readOnlyProperty', 'underscore',
    function (Organization, Base, computedProperty, inheritModel, privateProperty, readOnlyProperty, underscore) {
        function Farmer (attrs) {
            Organization.apply(this, arguments);

            computedProperty(this, 'isActive', function () {
                return this.status === 'active';
            });

            Base.initializeObject(this.data, 'enterprises', []);

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.activeFlags = attrs.activeFlags;
            this.customerId = attrs.customerId;
            this.customerNumber = attrs.customerNumber;
            this.farms = attrs.farms || [];
            this.legalEntities = attrs.legalEntities || [];
            this.operationType = attrs.operationType;
            this.productionRegion = attrs.productionRegion;
            this.subscriptionPlan = attrs.subscriptionPlan;
            this.tags = attrs.tags || [];
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

        Farmer.validates({
            country: {
                required: true,
                length: {
                    min: 1,
                    max: 64
                }
            },
            email: {
                required: true,
                format: {
                    email: true
                }
            },
            name: {
                required: true,
                length: {
                    min: 1,
                    max: 255
                }
            },
            organizationId: {
                required: true,
                numeric: true
            }
        });

        return Farmer;
    }]);
