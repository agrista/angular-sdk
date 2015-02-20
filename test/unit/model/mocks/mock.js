angular.module('ag.test.model.mocks', ['ag.sdk.model.base'])
    .factory('mocks', ['Document', 'Farm', 'Farmer', function (Document, Farm, Farmer) {
        return {
            Document: Document,
            Farmer: Farmer,
            Farm: Farm
        };
    }]);
