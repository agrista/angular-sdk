var sdkModelMerchant = angular.module('ag.sdk.model.merchant', ['ag.sdk.model.organization']);

sdkModelMerchant.provider('Merchant', ['OrganizationFactoryProvider', function (OrganizationFactoryProvider) {
    this.$get = ['Organization', 'Base', 'computedProperty', 'inheritModel', 'privateProperty', 'readOnlyProperty', 'underscore',
        function (Organization, Base, computedProperty, inheritModel, privateProperty, readOnlyProperty, underscore) {
            function Merchant (attrs) {
                Organization.apply(this, arguments);

                computedProperty(this, 'partnerTitle', function () {
                    return getPartnerTitle(this.partnerType);
                });

                computedProperty(this, 'subscriptionPlanTitle', function () {
                    return getSubscriptionPlanTitle(this.subscriptionPlan);
                });

                if (underscore.isUndefined(attrs) || arguments.length === 0) return;

                this.partnerType = attrs.partnerType;
                this.services = attrs.services || [];
            }

            function getPartnerTitle (type) {
                return Merchant.partnerTypes[type] || '';
            }

            function getSubscriptionPlanTitle (type) {
                return Merchant.subscriptionPlanTypes[type] || '';
            }

            inheritModel(Merchant, Organization);

            readOnlyProperty(Merchant, 'partnerTypes', {
                benefit: 'Benefit',
                standard: 'Standard'
            });

            readOnlyProperty(Merchant, 'subscriptionPlanTypes', {
                small: 'Small',
                medium: 'Medium',
                large: 'Large',
                association: 'Association'
            });

            privateProperty(Merchant, 'getPartnerTitle' , function (type) {
                return getPartnerTitle(type);
            });

            privateProperty(Merchant, 'getSubscriptionPlanTitle' , function (type) {
                return getSubscriptionPlanTitle(type);
            });

            Merchant.validates(underscore.defaults({
                partnerType: {
                    required: false,
                    inclusion: {
                        in: underscore.keys(Merchant.partnerTypes)
                    }
                },
                services: {
                    required: true,
                    length: {
                        min: 1
                    }
                },
                subscriptionPlan: {
                    required: false,
                    inclusion: {
                        in: underscore.keys(Merchant.subscriptionPlanTypes)
                    }
                },
                type: {
                    required: true,
                    equal: {
                        to: 'merchant'
                    }
                }
            }, Organization.validations));

            return Merchant;
        }];

    OrganizationFactoryProvider.add('merchant', 'Merchant');
}]);
