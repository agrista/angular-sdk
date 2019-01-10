var sdkModelDocument = angular.module('ag.sdk.model.document', ['ag.sdk.library', 'ag.sdk.model.base']);

sdkModelDocument.factory('Document', ['inheritModel', 'Model', 'privateProperty', 'readOnlyProperty', 'underscore',
    function (inheritModel, Model, privateProperty, readOnlyProperty, underscore) {
        function Document (attrs, organization) {
            Model.Base.apply(this, arguments);

            this.data = (attrs && attrs.data) || {};

            privateProperty(this, 'updateRegister', function (organization) {
                this.organization = organization;
                this.organizationId = organization.id;
                this.data = underscore.extend(this.data, {
                    farmer: underscore.omit(organization, ['activeFlags', 'farms', 'legalEntities', 'primaryContact', 'teams']),
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
            this.originUuid = attrs.originUuid;
            this.origin = attrs.origin;
            this.title = attrs.title;

            this.organization = attrs.organization;
            this.tasks = attrs.tasks;
        }

        inheritModel(Document, Model.Base);

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

        return Document;
    }]);

sdkModelDocument.factory('DocumentFactory', ['BusinessPlan', 'CropInspection', 'DesktopValuation', 'Document', 'FarmValuation',
    function (BusinessPlan, CropInspection, DesktopValuation, Document, FarmValuation) {
        var instances = {
            'desktop valuation': DesktopValuation,
            'emergence inspection': CropInspection,
            'farm valuation': FarmValuation,
            'financial business plan': BusinessPlan,
            'hail inspection': CropInspection,
            'harvest inspection': CropInspection,
            'preharvest inspection': CropInspection,
            'progress inspection': CropInspection
        };

        function apply (attrs, fnName) {
            if (instances[attrs.type]) {
                return instances[attrs.type][fnName](attrs);
            }

            return Document[fnName](attrs);
        }

        return {
            isInstanceOf: function (asset) {
                return (asset ?
                    (instances[asset.type] ?
                        asset instanceof instances[asset.type] :
                        asset instanceof Document) :
                    false);
            },
            new: function (attrs) {
                return apply(attrs, 'new');
            },
            newCopy: function (attrs) {
                return apply(attrs, 'newCopy');
            }
        }
    }]);
