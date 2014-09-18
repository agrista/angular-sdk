var sdkInterfaceInputApp = angular.module('ag.sdk.interface.input', []);

sdkInterfaceInputApp.filter('location', ['$filter', function ($filter) {
    return function (value) {
        return ((value && value.geometry ? $filter('number')(value.geometry.coordinates[0], 3) + ', ' + $filter('number')(value.geometry.coordinates[1], 3) : '') + (value && value.properties ? ' at ' + $filter('number')(value.properties.accuracy, 2) + 'm' : ''));
    };
}]);

sdkInterfaceInputApp.directive('locationFormatter', ['$filter', function ($filter) {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function (scope, element, attrs, ngModel) {
            ngModel.$formatters.push(function (value) {
                var viewValue = '';
                if (value !== undefined) {
                    viewValue = $filter('location')(value);

                    if (attrs.ngChange) {
                        scope.$eval(attrs.ngChange);
                    }
                }

                return viewValue;
            });
        }
    };
}]);

sdkInterfaceInputApp.directive('dateFormatter', ['$filter', function ($filter) {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function (scope, element, attrs, ngModel) {
            ngModel.$formatters.push(function (value) {
                return (value !== undefined ? $filter('date')(new Date(value), attrs['dateFormat'] || 'yyyy-MM-dd') : '');
            });
        }
    };
}]);

sdkInterfaceInputApp.directive('dateParser', ['$filter', function ($filter) {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function (scope, element, attrs, ngModel) {
            ngModel.$parsers.push(function (value) {
                return (value !== undefined ? $filter('date')(new Date(value), attrs['dateFormat'] || 'yyyy-MM-dd') : '');
            });
        }
    };
}]);

sdkInterfaceInputApp.directive('inputNumber', ['$filter', function ($filter) {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function (scope, element, attrs, ngModel) {
            var _max = (attrs.max ? parseFloat(attrs.max) : false);
            var _min = (attrs.min ? parseFloat(attrs.min) : false);
            var _round = (attrs.round ? parseInt(attrs.round) : false);

            ngModel.$formatters.push(function (value) {
                return (_round === false ? value : $filter('number')(value, _round));
            });

            ngModel.$parsers.push(function (value) {
                var isNan = isNaN(value);

                ngModel.$setValidity('number', isNan === false);

                if (isNan === false) {
                    var float = parseFloat(value);

                    ngModel.$setValidity('range', (_min === false || float >= _min) && (_max === false || float <= _max));
                    return float;
                } else {
                    return value;
                }
            });
        }
    };
}]);