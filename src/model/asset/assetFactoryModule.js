var sdkModelAssetFactory = angular.module('ag.sdk.model.asset-factory', []);

sdkModelAssetFactory.provider('AssetFactory', function () {
    var instances = {};

    this.add = function (type, modelName) {
        instances[type] = modelName;
    };

    this.$get = ['$injector', function ($injector) {
        function apply (attrs, fnName) {
            if (instances[attrs.type]) {
                if (typeof instances[attrs.type] === 'string') {
                    instances[attrs.type] = $injector.get(instances[attrs.type]);
                }

                return instances[attrs.type][fnName](attrs);
            }

            return null;
        }

        return {
            isInstanceOf: function (asset) {
                return (asset && instances[asset.type] && asset instanceof instances[asset.type]);
            },
            new: function (attrs) {
                return apply(attrs, 'new');
            },
            newCopy: function (attrs) {
                return apply(attrs, 'newCopy');
            }
        }
    }];
});

