var sdkModelDocument = angular.module('ag.sdk.model.document', ['ag.sdk.library', 'ag.sdk.model.base']);

sdkModelDocument.factory('Document', ['inheritModel', 'Model', 'readOnlyProperty', 'underscore',
        function (inheritModel, Model, readOnlyProperty, underscore) {
            function Document (attrs) {
                Model.Base.apply(this, arguments);

                if (arguments.length === 0) return;

                this.id = attrs.id;
                this.author = attrs.author;
                this.docType = attrs.docType;
                this.organizationId = attrs.organizationId;
                this.title = attrs.title;

                this.data = attrs.data || {};
            }

            inheritModel(Document, Model.Base);

            readOnlyProperty(Document, 'docTypes', {
                'asset register': 'Asset Register'
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
