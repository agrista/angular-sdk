angular.module('ag.sdk.model.base', ['ag.sdk.library', 'ag.sdk.model.validation', 'ag.sdk.model.errors'])
    .factory('Model', ['Base', function (Base) {
        var Model = {};
        Model.Base = Base;
        return Model;
    }])
    .factory('Base', ['Errorable', 'underscore', 'Validatable', function (Errorable, underscore, Validatable) {
        function Base () {
            var _constructor = this;
            var _prototype = _constructor.prototype;

            _constructor.new = function (attrs) {
                var inst = new _constructor(attrs);
                return inst;
            };

            _constructor.extend = function (Module) {
                var properties = new Module(),
                    propertyNames = Object.getOwnPropertyNames(properties),
                    classPropertyNames = underscore.filter(propertyNames, function (propertyName) {
                        return propertyName.slice(0, 2) !== '__';
                    });

                underscore.each(classPropertyNames, function (classPropertyName) {
                    Object.defineProperty(this, classPropertyName, Object.getOwnPropertyDescriptor(properties, classPropertyName));
                }, this);
            };

            _constructor.include = function (Module) {
                var methods = new Module(),
                    propertyNames = Object.getOwnPropertyNames(methods),
                    instancePropertyNames = underscore.filter(propertyNames, function (propertyName) {
                        return propertyName.slice(0, 2) == '__';
                    }),
                    oldConstructor = this.new;

                this.new = function () {
                    var instance = oldConstructor.apply(this, arguments);

                    underscore.each(instancePropertyNames, function (instancePropertyName) {
                        Object.defineProperty(instance, instancePropertyName.slice(2), Object.getOwnPropertyDescriptor(methods, instancePropertyName));
                    });

                    return instance;
                };
            };

            _constructor.extend(Validatable);
            _constructor.include(Validatable);
            _constructor.include(Errorable);
        }

        return Base;
    }])
    .factory('computedProperty', [function () {
        return function (object, name, value) {
            Object.defineProperty(object, name, {
                get: value
            });
        }
    }])
    .factory('inheritModel', [function () {
        return function (object, base) {
            var _constructor = object;
            _constructor = base.apply(_constructor);
        }
    }])
    .factory('privateProperty', [function () {
        return function (object, name, value) {
            var val;

            Object.defineProperty(object, name, {
                enumerable: false,
                configurable: false,
                get: function () {
                    return val;
                },
                set: function (newVal) {
                    val = newVal;
                }
            });

            if (value !== undefined) {
                object[name] = value;
            }
        }
    }]);