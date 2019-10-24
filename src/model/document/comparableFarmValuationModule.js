var sdkModelComparableFarmValuationDocument = angular.module('ag.sdk.model.comparable-farm-valuation', ['ag.sdk.model.farm-valuation']);

sdkModelComparableFarmValuationDocument.provider('ComparableFarmValuation', ['DocumentFactoryProvider', function (DocumentFactoryProvider) {
    this.$get = ['FarmValuation', 'inheritModel', 'underscore',
        function (FarmValuation, inheritModel, underscore) {
            function ComparableFarmValuation (attrs) {
                FarmValuation.apply(this, arguments);

                this.docType = 'comparable farm valuation';
            }

            inheritModel(ComparableFarmValuation, FarmValuation);

            ComparableFarmValuation.validates(underscore.defaults({
                docType: {
                    required: true,
                    equal: {
                        to: 'comparable farm valuation'
                    }
                }
            }, FarmValuation.validations));

            return ComparableFarmValuation;
        }];

    DocumentFactoryProvider.add('comparable farm valuation', 'ComparableFarmValuation');
}]);
