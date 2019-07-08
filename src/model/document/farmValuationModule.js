var sdkModelFarmValuationDocument = angular.module('ag.sdk.model.farm-valuation', ['ag.sdk.model.asset', 'ag.sdk.model.document']);

sdkModelFarmValuationDocument.provider('FarmValuation', ['DocumentFactoryProvider', function (DocumentFactoryProvider) {
    this.$get = ['Asset', 'computedProperty', 'Document', 'inheritModel', 'underscore',
        function (Asset, computedProperty, Document, inheritModel, underscore) {
            function FarmValuation (attrs) {
                Document.apply(this, arguments);

                this.docType = 'farm valuation';
            }

            inheritModel(FarmValuation, Document);

            FarmValuation.validates(underscore.defaults({
                docType: {
                    required: true,
                    equal: {
                        to: 'farm valuation'
                    }
                }
            }, Document.validations));

            return FarmValuation;
        }];

    DocumentFactoryProvider.add('farm valuation', 'FarmValuation');
}]);
