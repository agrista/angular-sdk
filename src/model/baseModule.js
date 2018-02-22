angular.module('ag.sdk.model.base', ['ag.sdk.library', 'ag.sdk.model.validation', 'ag.sdk.model.errors', 'ag.sdk.model.store'])
    .factory('Model', ['Base', function (Base) {
        var Model = {};
        Model.Base = Base;
        return Model;
    }])
    .factory('Base', ['Errorable', 'privateProperty', 'Storable', 'underscore', 'Validatable', function (Errorable, privateProperty, Storable, underscore, Validatable) {
        function Base () {
            var _constructor = this;
            var _prototype = _constructor.prototype;

            _constructor.new = function (attrs, options) {
                var inst = new _constructor(attrs, options);

                if (typeof inst.storable == 'function') {
                    inst.storable(attrs);
                }

                return inst;
            };

            _constructor.newCopy = function (attrs, options) {
                return _constructor.new(JSON.parse(JSON.stringify(attrs)), options);
            };

            _constructor.asJSON = function () {
                return underscore.omit(JSON.parse(JSON.stringify(this)), ['$complete', '$dirty', '$id', '$local', '$saved', '$uri']);
            };

            _constructor.copy = function () {
                var original = this,
                    copy = {},
                    propertyNames = Object.getOwnPropertyNames(original);

                underscore.each(propertyNames, function (propertyName) {
                    Object.defineProperty(copy, propertyName, Object.getOwnPropertyDescriptor(original, propertyName));
                });

                return copy;
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
            _constructor.extend(Storable);
            _constructor.include(Validatable);
            _constructor.include(Errorable);
            _constructor.include(Storable);
        }

        privateProperty(Base, 'initializeArray', function (length, defaultValue) {
            return underscore.range(length).map(function () {
                return defaultValue || 0;
            });
        });

        privateProperty(Base, 'initializeObject', function (object, property, defaultValue) {
            object[property] = (object[property] && Object.prototype.toString.call(object[property]) == Object.prototype.toString.call(defaultValue))
                ? object[property]
                : defaultValue;
        });

        privateProperty(Base, 'jsonValue', function (object) {
            return (object && typeof object.asJSON === 'function' ? object.asJSON() : object);
        });

        return Base;
    }])
    .factory('computedProperty', ['underscore', function (underscore) {
        return function (object, name, value, config) {
            Object.defineProperty(object, name, underscore.defaults(config || {}, {
                get: value
            }));
        }
    }])
    .factory('readOnlyProperty', ['underscore', function (underscore) {
        return function (object, name, value, config) {
            Object.defineProperty(object, name, underscore.defaults(config || {}, {
                writable: false,
                value: value
            }));
        }
    }])
    .factory('inheritModel', ['underscore', function (underscore) {
        return function (object, base) {
            base.apply(object);

            // Apply defined properties to extended object
            underscore.each(Object.getOwnPropertyNames(base), function (name) {
                var descriptor = Object.getOwnPropertyDescriptor(base, name);

                if (underscore.isUndefined(object[name]) && descriptor) {
                    Object.defineProperty(object, name, descriptor);
                }
            });
        }
    }])
    .factory('privateProperty', ['underscore', function (underscore) {
        return function (object, name, value, config) {
            var val;

            Object.defineProperty(object, name, underscore.defaults(config || {}, {
                enumerable: false,
                configurable: false,
                get: function () {
                    return val;
                },
                set: function (newVal) {
                    val = newVal;
                }
            }));

            if (value !== undefined) {
                object[name] = value;
            }
        }
    }])
    .factory('interfaceProperty', ['underscore', function (underscore) {
        return function (object, name, value, config) {
            var val;

            Object.defineProperty(object, name, underscore.defaults(config || {}, {
                enumerable: false,
                configurable: true,
                get: function () {
                    return val;
                },
                set: function (newVal) {
                    val = newVal;
                }
            }));

            if (value !== undefined) {
                object[name] = value;
            }
        }
    }]);