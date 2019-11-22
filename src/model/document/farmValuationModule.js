var sdkModelFarmValuationDocument = angular.module('ag.sdk.model.farm-valuation', ['ag.sdk.model.asset', 'ag.sdk.model.document']);

sdkModelFarmValuationDocument.provider('FarmValuation', ['DocumentFactoryProvider', function (DocumentFactoryProvider) {
    this.$get = ['$filter', 'Asset', 'Base', 'Document', 'Field', 'inheritModel', 'privateProperty', 'readOnlyProperty', 'safeMath', 'underscore',
        function ($filter, Asset, Base, Document, Field, inheritModel, privateProperty, readOnlyProperty, safeMath, underscore) {
            function FarmValuation (attrs) {
                Document.apply(this, arguments);

                privateProperty(this, 'asComparable', function () {
                    var instance = this;

                    return {
                        attachmentIds: underscore.chain(instance.data.attachments)
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
                        authorData: underscore.chain(instance.data.report.completedBy || {})
                            .pick(['email', 'mobile', 'name', 'position', 'telephone'])
                            .extend({
                                company: instance.data.request.merchant.name
                            })
                            .value(),
                        documentId: instance.id,
                        depreciatedImprovements: instance.data.report.improvementsValue.depreciatedValue,
                        improvedRatePerHa: safeMath.dividedBy(instance.data.report.totalRoundedValue, instance.data.report.summary.totalArea),
                        improvements: underscore.chain(instance.data.report.improvements)
                            .map(function (asset) {
                                asset.data.landUse = asset.data.landUse || Asset.getImprovementLandClass(asset);

                                return {
                                    area: asset.data.size,
                                    assetValue: asset.data.assetValue,
                                    constructionDate: asset.data.constructionDate,
                                    subType: getLandUseTitle(asset, {
                                        field: asset.data
                                    }),
                                    type: asset.data.landUse,
                                    unit: 'sm',
                                    unitValue: safeMath.dividedBy(asset.data.assetValue, asset.data.size)
                                }
                            })
                            .value(),
                        knowledgeOfProperty: instance.data.report.knowledgeOfProperty,
                        landUse: underscore.chain(instance.data.report.landUseComponents)
                            .values()
                            .flatten()
                            .map(function (landComponent) {
                                return underscore.map(landComponent.assets, function (asset) {
                                    var field = getAssetField(instance, asset);

                                    return {
                                        area: asset.data.size,
                                        assetValue: safeMath.times(landComponent.valuePerHa, asset.data.size),
                                        type: (field ? field.landUse :
                                            (Field.isLandUse(asset.data.landUse) ? asset.data.landUse : landComponent.name)),
                                        subType: getLandUseTitle(asset, {
                                            asOfDate: instance.data.report.completionDate,
                                            field: field || asset.data
                                        }),
                                        unit: 'ha',
                                        unitValue: landComponent.valuePerHa
                                    }
                                });
                            })
                            .flatten()
                            .sortBy('subType')
                            .value(),
                        purchasePrice: instance.data.report.totalRoundedValue,
                        vacantLandValue: safeMath.dividedBy(instance.data.report.landUseValue.land, instance.data.report.summary.totalArea),
                        valuationDate: instance.data.report.completionDate,
                        valueMinusImprovements: safeMath.minus(instance.data.report.totalRoundedValue, instance.data.report.improvementsValue.depreciatedValue)
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

            var parenthesizeProps = $filter('parenthesizeProps');

            function getLandUseTitle (asset, options) {
                var assetProps = [Asset.getCustomTitle(asset, (asset.type === 'improvement' ?
                    ['type', 'category'] :
                    ['crop', 'age', 'croppingPotential', 'irrigation', 'terrain', 'waterSource']), options)];

                return parenthesizeProps(Asset.getCustomTitle(asset, [['landUse', (asset.type === 'improvement' ? 'name' : 'typeTitle')]], options), assetProps);
            }

            function getAssetField (instance, asset) {
                return underscore.chain(instance.data.farms)
                    .where({id: asset.farmId})
                    .pluck('data')
                    .pluck('fields')
                    .flatten()
                    .where({fieldName: asset.data.fieldName})
                    .map(Field.newCopy)
                    .first()
                    .value();
            }

            readOnlyProperty(FarmValuation, 'priorities', {
                'Priority 1': 1,
                'Priority 2': 2,
                'Priority 3': 3
            });

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
