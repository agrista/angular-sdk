var sdkModelFinancial = angular.module('ag.sdk.model.financial', ['ag.sdk.library', 'ag.sdk.model.base']);

sdkModelFinancial.factory('Financial', ['inheritModel', 'Model', 'underscore',
    function (inheritModel, Model, underscore) {
        function Financial (attrs) {
            Model.Base.apply(this, arguments);

            this.data = (attrs && attrs.data) || {};

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.year = attrs.year;
            this.id = attrs.id || attrs.$id;
            this.organizationId = attrs.organizationId;

            // Models
            this.organization = attrs.organization;
        }

        inheritModel(Financial, Model.Base);

        Financial.validates({
            organizationId: {
                required: true,
                numeric: true
            },
            year: {
                numeric: true,
                range: {
                    from: 1000,
                    to: 9999
                }
            }
        });

        return Financial;
    }]);
