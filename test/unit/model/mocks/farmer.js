angular.module('ag.test.model.mocks')
    .factory('Farmer', ['Model', 'inheritModel', function (Model, inheritModel) {
        function Farmer (attrs) {
            this.id = attrs.id;
            this.name = attrs.name;
            this.email = attrs.email;
            this.telephone = attrs.telephone;
        }

        inheritModel(Farmer, Model.Base);

        return Farmer;
    }]);
