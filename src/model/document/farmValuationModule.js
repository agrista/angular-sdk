var sdkModelFarmValuationDocument = angular.module('ag.sdk.model.farm-valuation', ['ag.sdk.model.asset', 'ag.sdk.model.document']);

sdkModelFarmValuationDocument.factory('FarmValuation', ['Asset', 'computedProperty', 'Document', 'inheritModel', 'privateProperty',
    function (Asset, computedProperty, Document, inheritModel, privateProperty) {
        function FarmValuation (attrs) {
            Document.apply(this, arguments);

            this.docType = 'farm valuation';
        }

        inheritModel(FarmValuation, Document);

        FarmValuation.validates({
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
                    to: 'farm valuation'
                }
            },
            organizationId: {
                required: true,
                numeric: true
            }
        });

        return FarmValuation;
    }]);
