var sdkModelDocument = angular.module('ag.sdk.model.document', ['ag.sdk.library', 'ag.sdk.model.base']);

sdkModelDocument.factory('Document', ['inheritModel', 'Model', 'privateProperty', 'readOnlyProperty', 'underscore',
        function (inheritModel, Model, privateProperty, readOnlyProperty, underscore) {
            function Document (attrs, organization) {
                Model.Base.apply(this, arguments);

                this.data = (attrs && attrs.data) || {};

                privateProperty(this, 'updateRegister', function (organization) {
                    this.data = underscore.extend(this.data, {
                        farmer: underscore.omit(organization, ['farms', 'legalEntities', 'primaryContact', 'teams']),
                        farms : organization.farms,
                        legalEntities: underscore
                            .map(organization.legalEntities, function (entity) {
                                return underscore.omit(entity, ['assets', 'farms']);
                            }),
                        assets: underscore
                            .chain(organization.legalEntities)
                            .pluck('assets')
                            .flatten()
                            .compact()
                            .groupBy('type')
                            .value(),
                        liabilities: underscore
                            .chain(organization.legalEntities)
                            .pluck('liabilities')
                            .flatten()
                            .compact()
                            .value()
                    });
                });

                if (underscore.isUndefined(attrs) || arguments.length === 0) return;

                this.author = attrs.author;
                this.docType = attrs.docType;
                this.documentId = attrs.documentId;
                this.id = attrs.id || attrs.$id;
                this.organizationId = attrs.organizationId;
                this.title = attrs.title;
            }

            inheritModel(Document, Model.Base);

            readOnlyProperty(Document, 'docTypes', {
                'asset register': 'Asset Register',
                'business plan': 'Business Plan',
                'emergence report': 'Emergence Report',
                'farm valuation': 'Farm Valuation',
                'insurance policy': 'Insurance Policy',
                'production plan': 'Production Plan',
                'progress report': 'Progress Report'
            });

            Document.validates({
                author: {
                    required: true,
                    length: {
                        min: 1,
                        max: 255
                    }
                },
                docType: {
                    required: true,
                    inclusion: {
                        in: underscore.keys(Document.docTypes)
                    }
                },
                organizationId: {
                    required: true,
                    numeric: true
                }
            });

            return Document;
        }]);