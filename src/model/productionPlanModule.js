var sdkModelProductionPlanDocument = angular.module('ag.sdk.model.production-plan', ['ag.sdk.model.asset', 'ag.sdk.model.document']);

sdkModelProductionPlanDocument.factory('ProductionPlan', ['Asset', 'computedProperty', 'Document', 'inheritModel', 'privateProperty',
    function (Asset, computedProperty, Document, inheritModel, privateProperty) {
        function ProductionPlan (attrs) {
            Document.apply(this, arguments);

            this.docType = 'production plan';
        }

        inheritModel(ProductionPlan, Document);

        ProductionPlan.validates({
            author: {
                required: true,
                length: {
                    min: 1,
                    max: 255
                }
            },
            docType: {
                required: true,
                equal: {
                    to: 'production plan'
                }
            },
            organizationId: {
                required: true,
                numeric: true
            },
            title: {
                required: true,
                length: {
                    min: 1,
                    max: 255
                }
            }
        });

        return ProductionPlan;
    }]);
