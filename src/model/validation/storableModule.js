var sdkModelStore = angular.module('ag.sdk.model.store', ['ag.sdk.library', 'ag.sdk.model.base']);

sdkModelStore.factory('Storable', ['computedProperty', 'privateProperty',
    function (computedProperty, privateProperty) {
        var booleanProps = ['$complete', '$delete', '$dirty', '$local', '$offline', '$saved'],
            otherProps = ['$id', '$uri'];

        function Storable () {
            var _storable = {};

            privateProperty(_storable, 'set', function (inst, attrs) {
                if (attrs) {
                    angular.forEach(otherProps, function (prop) {
                        privateProperty(inst, prop, attrs[prop]);
                    });

                    angular.forEach(booleanProps, function (prop) {
                        privateProperty(inst, prop, attrs[prop] === true);
                    });
                }
            });

            privateProperty(this, 'storable', function (attrs) {
                _storable.set(this, attrs);
            });
        }

        return Storable;
    }]);