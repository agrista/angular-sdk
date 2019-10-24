var sdkModelAssetFactory = angular.module('ag.sdk.model.asset-factory', []);

sdkModelAssetFactory.provider('AssetFactory', function () {
    var instances = {};

    this.add = function (type, modelName) {
        instances[type] = modelName;
    };

    this.$get = ['$injector', function ($injector) {
        function apply (attrs, fnName) {
            if (instances[attrs.type]) {
                inject(attrs.type);

                return instances[attrs.type][fnName](attrs);
            }

            return null;
        }

        function inject (type) {
            if (instances[type] && typeof instances[type] === 'string') {
                instances[type] = $injector.get(instances[type]);
            }
        }

        return {
            isInstanceOf: function (asset) {
                if (asset) {
                    inject(asset.type);

                    return (instances[asset.type] && asset instanceof instances[asset.type]);
                }

                return false;
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

