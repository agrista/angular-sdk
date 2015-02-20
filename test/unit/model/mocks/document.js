angular.module('ag.test.model.mocks')
    .factory('Document', ['Model', 'inheritModel', function (Model, inheritModel) {
        function Document (attrs) {
            this.id = attrs.id;
        }

        inheritModel(Document, Model.Base);

        return Document;
    }]);
