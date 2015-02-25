var sdkModelBusinessPlanDocument = angular.module('ag.sdk.model.business-plan', ['ag.sdk.model.asset', 'ag.sdk.model.document']);

sdkModelBusinessPlanDocument.factory('BusinessPlan', ['Asset', 'computedProperty', 'Document', 'inheritModel', 'privateProperty', 'readOnlyProperty', 'underscore',
    function (Asset, computedProperty, Document, inheritModel, privateProperty, readOnlyProperty, underscore) {
        function BusinessPlan (attrs) {
            Document.apply(this, arguments);

            this.docType = 'business plan';

            // Add Assets & Liabilities
            privateProperty(this, 'addAsset', function (asset) {
                this.data.plannedAssets = this.data.plannedAssets || [];

                if (Asset.new(asset).validate()) {
                    this.data.plannedAssets.push(asset);
                }
            });

            privateProperty(this, 'addLiability', function (liability) {
                this.data.plannedLiabilities = this.data.plannedLiabilities || [];
                this.data.plannedLiabilities.push(liability);
            });

            // View added Assets & Liabilities
            computedProperty(this, 'startDate', function () {
                return this.data.startDate;
            });

            computedProperty(this, 'plannedAssets', function () {
                return this.data.plannedAssets;
            });

            computedProperty(this, 'plannedLiabilities', function () {
                return this.data.plannedLiabilities;
            });
        }

        inheritModel(BusinessPlan, Document);

        BusinessPlan.validates({
            author: {
                required: true,
                length: {
                    min: 1,
                    max: 255
                }
            },
            docType: {
                required: true,
                equal: {
                    to: 'business plan'
                }
            },
            organizationId: {
                required: true,
                numeric: true
            },
            startDate: {
                required: true,
                format: {
                    date: true
                }
            },
            title: {
                required: true,
                length: {
                    min: 1,
                    max: 255
                }
            }
        });

        return BusinessPlan;
    }]);
