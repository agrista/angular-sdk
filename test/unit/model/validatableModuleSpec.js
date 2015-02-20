describe('ag.sdk.model.validation', function () {
    var Validatable, Validator, Validation;
    beforeEach(module('ag.sdk.model.validation'));
    beforeEach(inject(['Validatable', 'Validatable.Validator', 'Validatable.Validation', function(_Validatable_, _Validator_, _Validation_) {
        Validatable = _Validatable_;
        Validator = _Validator_;
        Validation = _Validation_;
    }]));

    describe('Validators that receive values', function () {
        var minValidator, configuredMinFn;

        beforeEach(function () {
            function minimum (value) {
                return value.length >= this.minimum;
            }

            minimum.message = function () {
                return 'Must be greater than ' + this.minimum;
            };

            minValidator = new Validator(minimum);
            configuredMinFn = minValidator.configure(5);
        });

        it('curries in the configured values to the validationFn', function () {
            expect(configuredMinFn('hello')).toEqual(true);
            expect(configuredMinFn('hi')).toEqual(false);
        });

        it('configures the message', function () {
            expect(configuredMinFn.message).toEqual('Must be greater than 5');
        });
    });

    describe('Validators with special options', function() {
        var numericalityValidator, configuredNumericalityFn;
        beforeEach(function() {
            function numericality(value) {
                if (this.ignore) value = value.replace(this.ignore, '');
                return !(isNaN(value))
            }

            numericality.message = function() {
                return 'Must be a number';
            };

            var validationConfiguration = {
                ignore: /^\$/,
                message: function() {
                    return 'Must be a number. Can include ' + String(this.ignore);
                }
            };

            numericalityValidator    = new Validator(numericality);
            configuredNumericalityFn = numericalityValidator.configure(validationConfiguration);
        });

        it('passes custom configuration options into the validationFn', function() {
            expect(configuredNumericalityFn('$5.00')).toBe(true);
            expect(configuredNumericalityFn('€5.00')).toBe(false);
        });

        it('passes custom configuration options into the message', function() {
            expect(configuredNumericalityFn.message).toBe('Must be a number. Can include /^\\\$/');
        });
    });
    
    describe('Validators with children', function() {
        var lengthValidator, minValidator, maxValidator, configuredLengthFunctions, configuredMinFn, configuredMaxFn;

        beforeEach(function() {
            function minimum(value) {
                return value.length >= this.minimum;
            }

            minimum.message = function() {
                return 'Must be more than ' + this.minimum;
            };

            minValidator = new Validator(minimum);

            function maximum(value) {
                return value.length <= this.maximum;
            }

            maximum.message = function() {
                return 'Must be less than ' + this.maximum;
            };

            maxValidator = new Validator(maximum);

            function len() {}

            len.message = 'is not the correct length.';

            len.options = {
                minimum: minValidator,
                maximum: maxValidator
            };

            lengthValidator = new Validator(len);

            configuredLengthFunctions = lengthValidator.configure({minimum: 5, maximum: 10});
            configuredMinFn = configuredLengthFunctions[0];
            configuredMaxFn = configuredLengthFunctions[1];
        });

        it('configures each child validator', function() {
            expect(configuredMinFn('hi')).toBe(false);
            expect(configuredMaxFn('hello')).toBe(true);
        });

        it('configures the default message for each child validation if no configuration is set', function() {
            expect(configuredMinFn.message).toBe('Must be more than 5');
            expect(configuredMaxFn.message).toBe('Must be less than 10');
        });

        it('uses configuration options to override the default message', function() {
            var lengthConfiguration = {
                minimum: {
                    value: 5, 
                    message: 'Must be longer than that.'
                },
                maximum: {
                    value: 10, 
                    message: function() {
                        return 'I just like the number ' + this.maximum;
                    }
                }
            };

            var configuredLengthFunctions = lengthValidator.configure(lengthConfiguration),
                configuredMinFn = configuredLengthFunctions[0],
                configuredMaxFn = configuredLengthFunctions[1];

            expect(configuredMinFn.message).toBe('Must be longer than that.');
            expect(configuredMaxFn.message).toBe('I just like the number 10');
        });
    });

    describe('Validations', function() {
        var minValidator, minValidation, configuredMinValidationFn, user;
        beforeEach(function() {
            function minimum(value) {
                return value.length >= this.minimum;
            }

            minimum.message = function() {
                return 'Must be more than ' + this.minimum;
            };

            minValidator = new Validator(minimum);
            configuredMinValidationFn = minValidator.configure(5);
            minValidation = new Validation('name', configuredMinValidationFn);
            user = {
                name: 'Brett'
            };
        });

        it('uses the validation function on a particular field', function() {
            expect(minValidation.validate(user)).toBe(true);
            user.name = '';
            expect(minValidation.validate(user)).toBe(false);
        });

        it('exposes the message of the configured validation', function() {
            expect(minValidation.message).toBe('Must be more than 5');
        });
    });
});
