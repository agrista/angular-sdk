var sdkModelDocument = angular.module('ag.sdk.model.document', ['ag.sdk.library', 'ag.sdk.model.base']);

sdkModelDocument.provider('Document', ['listServiceMapProvider', function (listServiceMapProvider) {
    this.$get = ['asJson', 'Base', 'computedProperty', 'inheritModel', 'Model', 'privateProperty', 'readOnlyProperty', 'underscore',
        function (asJson, Base, computedProperty, inheritModel, Model, privateProperty, readOnlyProperty, underscore) {
            function Document (attrs, organization) {
                Model.Base.apply(this, arguments);

                this.data = (attrs && attrs.data) || {};
                Base.initializeObject(this.data, 'attachments', []);

                /**
                 * Asset Register
                 */
                privateProperty(this, 'updateRegister', function (organization) {
                    var organizationJson = asJson(organization);

                    this.organization = organization;
                    this.organizationId = organization.id;
                    this.data = underscore.extend(this.data, {
                        organization: underscore.omit(organizationJson, ['farms', 'legalEntities', 'pointsOfInterest', 'primaryContact', 'teams']),
                        farmer: underscore.omit(organizationJson, ['farms', 'legalEntities', 'pointsOfInterest', 'primaryContact', 'teams']),
                        farms : organizationJson.farms,
                        legalEntities: underscore.map(organizationJson.legalEntities, function (entity) {
                            return underscore.omit(entity, ['assets', 'farms']);
                        }),
                        activities: underscore.chain(organizationJson.legalEntities)
                            .pluck('assets')
                            .flatten().compact()
                            .pluck('activities')
                            .flatten().compact()
                            .map(function (activity) {
                                return underscore.chain(activity)
                                    .extend(underscore.isUndefined(activity.asset) ? {} : {
                                        asset: underscore.pick(activity.asset, ['id', 'farmId', 'legalEntityId', 'productId', 'assetKey'])
                                    })
                                    .extend({
                                        assets: underscore.map(activity.assets, function (asset) {
                                            return underscore.pick(asset, ['id', 'farmId', 'legalEntityId', 'productId', 'assetKey']);
                                        })
                                    })
                                    .value();
                            })
                            .value(),
                        assets: underscore.chain(organizationJson.legalEntities)
                            .pluck('assets')
                            .flatten().compact()
                            .map(function (asset) {
                                return underscore.omit(asset, ['activities']);
                            })
                            .groupBy('type')
                            .value(),
                        liabilities: underscore.chain(organizationJson.legalEntities)
                            .pluck('liabilities')
                            .flatten().compact()
                            .value(),
                        pointsOfInterest: underscore.map(organizationJson.pointsOfInterest, function (pointOfInterest) {
                            return underscore.omit(pointOfInterest, ['organization']);
                        }),
                        productionSchedules: underscore.map(organizationJson.productionSchedules, function (productionSchedule) {
                            return underscore.omit(productionSchedule, ['organization']);
                        })
                    });
                });

                /**
                 * Attachment Handling
                 */
                computedProperty(this, 'attachments', function () {
                    return this.data.attachments;
                });

                privateProperty(this, 'addAttachment', function (attachment) {
                    this.removeAttachment(attachment);

                    this.data.attachments.push(attachment);
                });

                privateProperty(this, 'removeAttachment', function (attachment) {
                    this.data.attachments = underscore.reject(this.data.attachments, function (item) {
                        return item.key === attachment.key;
                    });
                });

                privateProperty(this, 'removeNewAttachments', function () {
                    var attachments = this.data.attachments;

                    this.data.attachments = underscore.reject(attachments, function (attachment) {
                        return underscore.isObject(attachment.archive);
                    });

                    return underscore.difference(attachments, this.data.attachments);
                });

                if (underscore.isUndefined(attrs) || arguments.length === 0) return;

                this.author = attrs.author;
                this.createdAt = attrs.createdAt;
                this.docType = attrs.docType;
                this.documentId = attrs.documentId;
                this.id = attrs.id || attrs.$id;
                this.organizationId = attrs.organizationId;
                this.originUuid = attrs.originUuid;
                this.origin = attrs.origin;
                this.title = attrs.title;

                this.organization = attrs.organization;
                this.permissions = attrs.permissions;
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

sdkModelDocument.provider('DocumentPermission', [function () {
    this.$get = ['inheritModel', 'Model', 'underscore', function (inheritModel, Model, underscore) {
        function DocumentPermission (attrs) {
            Model.Base.apply(this, arguments);

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.id = attrs.id || attrs.$id;
            this.accessImport = attrs.accessImport;
            this.accessRead = attrs.accessRead;
            this.accessShare = attrs.accessShare;
            this.accessWrite = attrs.accessWrite;
            this.documentId = attrs.documentId;
            this.email = attrs.email;
            this.name = attrs.name;
            this.reason = attrs.reason;
            this.userId = attrs.userId;

            this.document = attrs.document;
            this.user = attrs.user;
        }

        inheritModel(DocumentPermission, Model.Base);

        DocumentPermission.validates({
            documentId: {
                required: true,
                numeric: true
            },
            email: {
                required: true,
                format: {
                    email: true
                }
            },
            name: {
                required: true,
                length: {
                    min: 1,
                    max: 255
                }
            }
        });

        return DocumentPermission;
    }];
}]);
