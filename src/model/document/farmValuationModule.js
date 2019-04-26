var sdkModelFarmValuationDocument = angular.module('ag.sdk.model.farm-valuation', ['ag.sdk.model.asset', 'ag.sdk.model.document']);

sdkModelFarmValuationDocument.provider('FarmValuation', ['DocumentFactoryProvider', function (DocumentFactoryProvider) {
    this.$get = ['Base', 'Document', 'inheritModel', 'privateProperty', 'safeMath', 'underscore',
        function (Base, Document, inheritModel, privateProperty, safeMath, underscore) {
            function FarmValuation (attrs) {
                Document.apply(this, arguments);

                privateProperty(this, 'asComparable', function () {
                    return {
                        attachmentIds: underscore.chain(this.data.attachments)
                            .filter(function (attachment) {
                                return attachment.type === 'cover photo' || s.include(attachment.mimeType, 'image');
                            })
                            .sortBy(function (attachment, index) {
                                return (attachment.type === 'cover photo' ? -1 : index);
                            })
                            .first(1)
                            .map(function (attachment) {
                                return attachment.key;
                            })
                            .value(),
                        authorData: underscore.chain(this.data.report.completedBy || {})
                            .pick(['email', 'mobile', 'name', 'position', 'telephone'])
                            .extend({
                                company: this.data.request.merchant.name
                            })
                            .value(),
                        documentId: this.id,
                        depreciatedImprovements: this.data.report.improvementsValue.depreciatedValue,
                        improvedRatePerHa: safeMath.dividedBy(this.data.report.totalRoundedValue, this.data.report.summary.totalArea),
                        improvements: this.data.report.improvements,
                        knowledgeOfProperty: this.data.report.knowledgeOfProperty,
                        landUse: underscore.chain(this.data.report.landUseComponents)
                            .values()
                            .flatten()
                            .map(function (landComponent) {
                                return {
                                    area: landComponent.area,
                                    assetValue: landComponent.totalValue,
                                    type: landComponent.title,
                                    unitValue: landComponent.valuePerHa
                                }
                            })
                            .sortBy('type')
                            .value(),
                        purchasePrice: this.data.report.totalRoundedValue,
                        vacantLandValue: safeMath.dividedBy(this.data.report.landUseValue.land, this.data.report.summary.totalArea),
                        valuationDate: this.data.report.completionDate,
                        valueMinusImprovements: safeMath.minus(this.data.report.totalRoundedValue, this.data.report.improvementsValue.depreciatedValue)
                    }
                });

                Base.initializeObject(this.data, 'request', {});
                Base.initializeObject(this.data.request, 'farmland', []);
                Base.initializeObject(this.data, 'report', {});
                Base.initializeObject(this.data.report, 'description', {});
                Base.initializeObject(this.data.report, 'improvements', []);
                Base.initializeObject(this.data.report, 'improvementsValue', {});
                Base.initializeObject(this.data.report, 'landUseComponents', {});
                Base.initializeObject(this.data.report, 'landUseValue', {});
                Base.initializeObject(this.data.report, 'location', {});
                Base.initializeObject(this.data.report, 'research', []);
                Base.initializeObject(this.data.report, 'services', {});
                Base.initializeObject(this.data.report, 'summary', {});
                Base.initializeObject(this.data.report, 'template', 'default');

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
