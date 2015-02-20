var sdkModalValidators = angular.module('ag.sdk.model.validators', ['ag.sdk.library', 'ag.sdk.model.validation']);

/**
 * Required Validators
 */
sdkModalValidators.factory('Validator.required', ['underscore', 'Validatable.Validator',
    function (underscore, Validator) {
        function required (value, instance, field) {
            if (underscore.isUndefined(value) || underscore.isNull(value)) {
                return false;
            }

            if (value.constructor.name === 'String') {
                return !!(value && value.length || typeof value == 'object');
            }

            return value !== undefined;
        }

        required.message = 'cannot be blank';

        return new Validator(required);
    }]);

/**
 * Length Validators
 */
sdkModalValidators.factory('Validator.length', ['Validatable.Validator', 'Validator.length.min', 'Validator.length.max',
    function (Validator, min, max) {
        function length () {}

        length.message = 'does not meet the length requirement';

        length.options = {
            min: min,
            max: max
        };

        return new Validator(length);
    }]);

sdkModalValidators.factory('Validator.length.min', ['underscore', 'Validatable.Validator',
    function (underscore, Validator) {
        function min (value, instance, field) {
            if (underscore.isUndefined(value) || underscore.isNull(value) || value === '') {
                return true;
            }

            return value.length >= this.min;
        }

        min.message = function () {
            return 'Must be at least ' + this.min + ' characters';
        };

        return new Validator(min);
    }]);

sdkModalValidators.factory('Validator.length.max', ['underscore', 'Validatable.Validator',
    function (underscore, Validator) {
        function max (value, instance, field) {
            if (underscore.isUndefined(value) || underscore.isNull(value) || value === '') {
                return true;
            }

            return value.length <= this.max;
        }

        max.message = function () {
            return 'Must be no more than ' + this.max + ' characters';
        };

        return new Validator(max);
    }]);

/**
 * Number Validator
 */

sdkModalValidators.factory('Validator.numberical', ['underscore', 'Validatable.Validator',
    function (underscore, Validator) {
        function numberical (value, instance, field) {
            if (this.ignore) {
                value = value.replace(this.ignore, '');
            }

            return underscore.inNumber(value) === false;
        }

        numberical.message = function () {
            return 'Must be a number. Can include ' + String(this.ignore);
        };

        return new Validator(numberical);
    }]);