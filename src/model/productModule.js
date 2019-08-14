var sdkModelProduct = angular.module('ag.sdk.model.product', ['ag.sdk.library', 'ag.sdk.model.base']);

sdkModelProduct.provider('Product', ['listServiceMapProvider', function (listServiceMapProvider) {
    this.$get = ['inheritModel', 'Model', 'readOnlyProperty', 'underscore',
        function (inheritModel, Model, readOnlyProperty, underscore) {
            function Product (attrs) {
                Model.Base.apply(this, arguments);

                if (underscore.isUndefined(attrs) || arguments.length === 0) return;

                this.id = attrs.id || attrs.$id;
                this.categories = attrs.categories || [];
                this.description = attrs.description;
                this.ingredients = attrs.ingredients || [];
                this.name = attrs.name;
                this.organization = attrs.organization;
                this.organizationId = attrs.organizationId;
                this.published = attrs.published;
                this.registrationNumber = attrs.registrationNumber;
                this.sku = attrs.sku;
                this.tags = attrs.tags || [];
                this.type = attrs.type;
                this.quantity = attrs.quantity;
                this.quantityUnit = attrs.quantityUnit;
            }

            inheritModel(Product, Model.Base);

            readOnlyProperty(Product, 'types', [
                'Digital',
                'Services',
                'Stock']);

            Product.validates({
                description: {
                    required: false,
                    length: {
                        max: 1024
                    }
                },
                name: {
                    required: true,
                    length: {
                        min: 1,
                        max: 255
                    }
                },
                organizationId: {
                    required: true,
                    numeric: true
                },
                pieces: {
                    required: false,
                    numeric: true
                },
                registrationNumber: {
                    required: false,
                    length: {
                        max: 32
                    }
                },
                sku: {
                    required: true,
                    length: {
                        max: 32
                    }
                },
                type: {
                    required: true,
                    inclusion: {
                        in: Product.types
                    }
                },
                quantity: {
                    required: true,
                    numeric: true
                },
                quantityUnit: {
                    required: true,
                    length: {
                        min: 1,
                        max: 8
                    }
                }
            });

            return Product;
        }];

    listServiceMapProvider.add('product', [function () {
        return function (item) {
            return {
                id: item.id || item.$id,
                title: item.name,
                subtitle: item.description
            };
        };
    }]);
}]);
