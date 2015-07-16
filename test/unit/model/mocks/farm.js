angular.module('ag.test.model.mocks')
    .factory('Farm', ['Model', 'inheritModel', function (Model, inheritModel) {
        function Farm (attrs) {
            this.id = attrs.id;
            this.name = attrs.name;
        }

        inheritModel(Farm, Model.Base);

        return Farm;
    }]);
