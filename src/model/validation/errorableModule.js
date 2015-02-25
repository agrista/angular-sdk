var sdkModelErrors = angular.module('ag.sdk.model.errors', ['ag.sdk.library', 'ag.sdk.model.base']);

sdkModelErrors.factory('Errorable', ['privateProperty', 'underscore',
    function (privateProperty, underscore) {
        function Errorable () {
            var _$errors = {};

            privateProperty(_$errors, 'count', 0);

            privateProperty(_$errors, 'countFor', function (fieldName) {
                if (underscore.isUndefined(fieldName)) {
                    return _$errors.count;
                }

                return (_$errors[fieldName] ? _$errors[fieldName].length : 0);
            });

            privateProperty(_$errors, 'add', function (fieldName, errorMessage) {
                if (underscore.isUndefined(_$errors[fieldName])) {
                    _$errors[fieldName] = [];
                }

                if (underscore.contains(_$errors[fieldName], errorMessage) === false) {
                    _$errors[fieldName].push(errorMessage);
                    _$errors.count++;
                }
            });

            privateProperty(_$errors, 'clear', function (fieldName, errorMessage) {
                if (underscore.isUndefined(errorMessage) === false) {
                    if (underscore.contains(_$errors[fieldName], errorMessage)) {
                        _$errors[fieldName] = underscore.without(_$errors[fieldName], errorMessage);
                        _$errors.count--;

                        if(_$errors[fieldName].length === 0) {
                            delete _$errors[fieldName];
                        }
                    }
                } else {
                    var toClear = [];

                    if (underscore.isArray(fieldName)) {
                        toClear = fieldName;
                    }

                    if (underscore.isString(fieldName)) {
                        toClear.push(fieldName);
                    }

                    if (underscore.isUndefined(fieldName)) {
                        toClear = underscore.keys(_$errors);
                    }

                    underscore.each(toClear, function (fieldName) {
                        if (underscore.isUndefined(_$errors[fieldName]) === false) {
                            var count = _$errors[fieldName].length;
                            delete _$errors[fieldName];
                            _$errors.count -= count;
                        }
                    });
                }
            });

            this.__$errors = _$errors;
        }

        return Errorable;
    }]);