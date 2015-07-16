angular.module('ag.test.model.mocks')
    .factory('Document', ['inheritModel', 'Model', 'readOnlyProperty', 'underscore',
        function (inheritModel, Model, readOnlyProperty, underscore) {
            function Document (attrs) {
                this.id = attrs.id;
                this.author = attrs.author;

                readOnlyProperty(this, 'docTypes', {
                    'asset register': 'Asset Register'
                });
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
                    inclusion: {
                        in: underscore.keys(Document.docTypes)
                    }
                }
            });

            return Document;
        }]);
