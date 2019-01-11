var sdkModelExpense = angular.module('ag.sdk.model.expense', ['ag.sdk.library', 'ag.sdk.model.base']);

sdkModelExpense.factory('Expense', ['inheritModel', 'Model', 'readOnlyProperty', 'underscore',
    function (inheritModel, Model, readOnlyProperty, underscore) {
        function Expense (attrs) {
            Model.Base.apply(this, arguments);

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.id = attrs.id || attrs.$id;
            this.createdAt = attrs.createdAt;
            this.createdBy = attrs.createdBy;
            this.description = attrs.description;
            this.documentId = attrs.documentId;
            this.organizationId = attrs.organizationId;
            this.quantity = attrs.quantity;
            this.unit = attrs.unit;
            this.userId = attrs.userId;
            this.reconciled = attrs.reconciled;
            this.reconciledAt = attrs.reconciledAt;
            this.reconciledBy = attrs.reconciledBy;

            this.document = attrs.document;
            this.organization = attrs.organization;
            this.user = attrs.user;
        }

        inheritModel(Expense, Model.Base);

        readOnlyProperty(Expense, 'units', [
            'ha',
            'km',
            'h']);

        Expense.validates({
            description: {
                required: false,
                length: {
                    min: 0,
                    max: 255
                }
            },
            quantity: {
                required: true,
                numeric: true
            },
            unit: {
                required: true,
                inclusion: {
                    in: Expense.units
                }
            }
        });

        return Expense;
    }]);
