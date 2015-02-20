var sdkModalValidation = angular.module('ag.sdk.model.validation', ['ag.sdk.library', 'ag.sdk.model.base', 'ag.sdk.model.validators']);

sdkModalValidation.factory('Validatable', ['computedProperty', 'privateProperty', 'underscore', 'Validatable.Field', 'Validator.required', 'Validator.length', 'Validator.length.min', 'Validator.length.min',
    function (computedProperty, privateProperty, underscore, Field) {
        function Validatable () {
            var _validations = {};

            privateProperty(_validations, 'add', function (validationSpec) {
                underscore.each(validationSpec, function (validationSet, fieldName) {
                    if (_validations[fieldName]) {
                        _validations[fieldName].addValidators(validationSet);
                    } else {
                        _validations[fieldName] = new Field(fieldName, validationSet);
                    }
                });
            });

            privateProperty(_validations, 'validate', function (instance, fieldName) {
                var toValidate = getFieldsToValidate(fieldName);

                underscore.each(toValidate, function (validation) {
                    validateField(instance, validation);
                });

                return instance.$errors.countFor(fieldName) === 0;
            });

            function validateField (instance, validation) {
                if (validation.validate(instance) === false) {
                    instance.$errors.add(validation.field, validation.message);
                } else {
                    instance.$errors.clear(validation.field, validation.message);
                }
            }

            function getFieldsToValidate (fieldName) {
                if (fieldName && _validations[fieldName]) {
                    return _validations[fieldName];
                }

                return underscore.chain(_validations)
                    .map(function (validations) {
                        return validations;
                    })
                    .flatten()
                    .value();
            }

            this.validations = _validations;
            this.validates   = _validations.add;

            this.__validate = function (fieldName) {
                return this.constructor.validations.validate(this, fieldName);
            };

            computedProperty(this, '__$valid', function () {
                return this.constructor.validations.validate(this);
            });

            computedProperty(this, '__$invalid', function () {
                return !this.constructor.validations.validate(this);
            });
        }

        return Validatable;
    }]);

sdkModalValidation.factory('Validatable.DuplicateValidatorError', [function () {
    function DuplicateValidatorError() {
        this.name = 'DuplicateValidatorError';
        this.message = 'A validator by the name ' + name + ' is already registered';
    }

    DuplicateValidatorError.prototype = Error.prototype;

    return DuplicateValidatorError;
}]);

sdkModalValidation.factory('Validatable.ValidationMessageNotFoundError', [function() {
    function ValidationMessageNotFoundError(validatorName, fieldName) {
        this.name    = 'ValidationMessageNotFound';
        this.message = 'Validation message not found for validator ' + validatorName + ' on the field ' + fieldName + '. Validation messages must be added to validators in order to provide your users with useful error messages.';
    }

    ValidationMessageNotFoundError.prototype = Error.prototype;

    return ValidationMessageNotFoundError;
}]);

sdkModalValidation.factory('Validatable.Field', ['privateProperty', 'underscore', 'Validatable.Validation', 'Validatable.ValidationMessageNotFoundError', 'Validatable.Validator', 'Validatable.validators',
    function (privateProperty, underscore, Validation, ValidationMessageNotFoundError, Validator, validators) {
        function Field (name, validationSet) {
            var field = [];

            privateProperty(field, 'addValidator', function (options, validationName) {
                var validator = validators.find(validationName) || new Validator(options, validationName),
                    configuredFunctions = underscore.flatten([validator.configure(options)]);

                if (underscore.isUndefined(validator.message)) {
                    throw new ValidationMessageNotFoundError(validationName, name);
                }

                underscore.each(configuredFunctions, function (configuredFunction) {
                    field.push(new Validation(name, configuredFunction));
                })
            });

            privateProperty(field, 'addValidators', function (validationSet) {
                underscore.each(validationSet, field.addValidator);
            });

            field.addValidators(validationSet);

            return field;
        }

        return Field;
    }]);

sdkModalValidation.factory('Validatable.Validation', ['privateProperty', function (privateProperty) {
    function Validation (field, validationFunction) {
        privateProperty(this, 'field', field);
        privateProperty(this, 'message', validationFunction.message);
        privateProperty(this, 'validate', function (instance) {
            return validationFunction(instance[field], instance, field);
        });
    }

    return Validation;
}]);

sdkModalValidation.factory('Validatable.ValidationFunction', ['underscore', function (underscore) {
    function ValidationFunction (validationFunction, options) {
        var boundFunction = underscore.bind(validationFunction, options);
        boundFunction.message = configureMessage();

        function configureMessage () {
            if (underscore.isString(options.message)) {
                return options.message;
            }

            if (underscore.isFunction(options.message)) {
                return options.message.apply(options);
            }
        }

        return boundFunction;
    }

    return ValidationFunction;
}]);

sdkModalValidation.factory('Validatable.ValidatorNotFoundError', [function() {
    function ValidatorNotFoundError(name) {
        this.name    = 'ValidatorNotFoundError';
        this.message = 'No validator found by the name of ' + name + '. Custom validators must define a validator key containing the custom validation function';
    }

    ValidatorNotFoundError.prototype = Error.prototype;

    return ValidatorNotFoundError;
}]);

sdkModalValidation.factory('Validatable.Validator', ['privateProperty', 'underscore', 'Validatable.ValidationFunction', 'Validatable.ValidatorNotFoundError', 'Validatable.validators',
    function (privateProperty, underscore, ValidationFunction, ValidatorNotFoundError, validators) {
        function AnonymousValidator(options, name) {
            if (underscore.isFunction(options.validator)) {
                if (options.message) {
                    options.validator.message = options.message;
                }

                return new Validator(options.validator, name);
            }
        }

        function Validator (validationFunction, name) {
            if (validationFunction.validator) {
                return new AnonymousValidator(validationFunction, name);
            }

            if (underscore.isFunction(validationFunction) === false) {
                throw new ValidatorNotFoundError(name);
            }

            var validator = this;

            privateProperty(validator, 'name', validationFunction.name);
            privateProperty(validator, 'message', validationFunction.message);
            privateProperty(validator, 'childValidators', {});
            privateProperty(validator, 'configure', function (options) {
                options = defaultOptions(options);

                if (underscore.size(validator.childValidators) > 0) {
                    return configuredChildren(options);
                }

                return new ValidationFunction(validationFunction, underscore.defaults(options, this));
            });

            addChildValidators(validationFunction.options);
            validators.register(validator);

            function addChildValidators (options) {
                underscore.each(options, function (value, key) {
                    if (value.constructor.name === 'Validator') {
                        validator.childValidators[key] = value;
                    }
                });
            }

            function configuredChildren (options) {
                return underscore.chain(validator.childValidators)
                    .map(function (childValidator, name) {
                        if (options[name]) {
                            return childValidator.configure(options[name]);
                        }
                    })
                    .compact()
                    .value();
            }

            function defaultOptions (options) {
                if (underscore.isObject(options) === false) {
                    options = {
                        value: options,
                        message: validator.message
                    };
                }

                if (underscore.isUndefined(validationFunction.name) == false) {
                    options[validationFunction.name] = options.value;
                }

                return options;
            }
        }

        return Validator;
    }]);

sdkModalValidation.factory('Validatable.validators', ['Validatable.DuplicateValidatorError', 'privateProperty', 'underscore',
    function (DuplicateValidatorError, privateProperty, underscore) {
        var validators = {};

        privateProperty(validators, 'register', function (validator) {
            if (underscore.isUndefined(validators[validator.name])) {
                validators[validator.name] = validator;
            } else {
                throw new DuplicateValidatorError(validator.name);
            }
        });

        privateProperty(validators, 'find', function (validatorName) {
            return validators[validatorName];
        });

        return validators;
    }]);
