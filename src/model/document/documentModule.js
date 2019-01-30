var sdkModelDocument = angular.module('ag.sdk.model.document', ['ag.sdk.library', 'ag.sdk.model.base']);

sdkModelDocument.provider('Document', ['listServiceMapProvider', function (listServiceMapProvider) {
    this.$get = ['inheritModel', 'Model', 'privateProperty', 'readOnlyProperty', 'underscore',
        function (inheritModel, Model, privateProperty, readOnlyProperty, underscore) {
            function Document (attrs, organization) {
                Model.Base.apply(this, arguments);

                this.data = (attrs && attrs.data) || {};

                privateProperty(this, 'updateRegister', function (organization) {
                    this.organization = organization;
                    this.organizationId = organization.id;
                    this.data = underscore.extend(this.data, {
                        organization: underscore.omit(organization, ['activeFlags', 'farms', 'legalEntities', 'primaryContact', 'teams']),
                        farmer: underscore.omit(organization, ['activeFlags', 'farms', 'legalEntities', 'primaryContact', 'teams']),
                        farms : organization.farms,
                        legalEntities: underscore.map(organization.legalEntities, function (entity) {
                            return underscore.omit(entity, ['assets', 'farms']);
                        }),
                        assets: underscore.chain(organization.legalEntities)
                            .pluck('assets')
                            .flatten()
                            .compact()
                            .groupBy('type')
                            .value(),
                        liabilities: underscore.chain(organization.legalEntities)
                            .pluck('liabilities')
                            .flatten()
                            .compact()
                            .value(),
                        pointsOfInterest: underscore.map(organization.pointsOfInterest, function (pointOfInterest) {
                            return underscore.omit(pointOfInterest, ['organization']);
                        })
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
        }];

    listServiceMapProvider.add('document', ['documentRegistry', 'moment', function (documentRegistry, moment) {
        return function (item) {
            var group = documentRegistry.getProperty(item.docType, 'title'),
                subtitle = (item.organization && item.organization.name ?
                    item.organization.name :
                    'Created ' + moment(item.createdAt).format('YYYY-MM-DD'));

            return {
                id: item.id || item.$id,
                title: (item.documentId ? item.documentId : ''),
                subtitle: subtitle,
                docType: item.docType,
                group: (group ? group : item.docType)
            };
        };
    }]);
}]);

sdkModelDocument.provider('DocumentFactory', function () {
    var instances = {};

    this.add = function (docType, modelName) {
        instances[docType] = modelName;
    };

    this.$get = ['$injector', 'Document', function ($injector, Document) {
        function apply (attrs, fnName) {
            if (instances[attrs.docType]) {
                if (typeof instances[attrs.docType] === 'string') {
                    instances[attrs.docType] = $injector.get(instances[attrs.docType]);
                }

                return instances[attrs.docType][fnName](attrs);
            }

            return Document[fnName](attrs);
        }

        return {
            isInstanceOf: function (document) {
                return (document ?
                    (instances[document.docType] ?
                        document instanceof instances[document.docType] :
                        document instanceof Document) :
                    false);
            },
            new: function (attrs) {
                return apply(attrs, 'new');
            },
            newCopy: function (attrs) {
                return apply(attrs, 'newCopy');
            }
        }
    }];
});
