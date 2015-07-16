var sdkModelStore = angular.module('ag.sdk.model.store', ['ag.sdk.library', 'ag.sdk.model.base']);

sdkModelStore.factory('Storable', ['computedProperty', 'privateProperty',
    function (computedProperty, privateProperty) {
        function Storable () {
            var _storable = {};

            privateProperty(_storable, 'set', function (inst, attrs) {
                if (attrs) {
                    inst.$complete = attrs.$complete;
                    inst.$dirty = attrs.$dirty;
                    inst.$id = attrs.$id;
                    inst.$local = attrs.$local;
                    inst.$saved = attrs.$saved;
                    inst.$uri = attrs.$uri;
                }
            });

            privateProperty(this, 'storable', function (attrs) {
                _storable.set(this, attrs);
            });
        }

        return Storable;
    }]);