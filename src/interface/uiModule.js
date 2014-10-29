var sdkInterfaceUiApp = angular.module('ag.sdk.interface.ui', []);

sdkInterfaceUiApp.directive('dynamicName', function() {
    return {
        restrict: 'A',
        require: '?form',
        link: function(scope, element, attrs, controller) {
            var formCtrl = (controller != null) ? controller :  element.parent().controller('form');
            var currentElementCtrl = formCtrl[element.attr('name')];

            element.attr('name', attrs.name);
            formCtrl.$removeControl(currentElementCtrl);
            currentElementCtrl.$name = attrs.name;
            formCtrl.$addControl(currentElementCtrl);
        }
    }
});

sdkInterfaceUiApp.directive('defaultSrc', [function () {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            element.bind('error', function() {
                element.attr("src", attrs.defaultSrc);
            });
        }
    };
}]);

sdkInterfaceUiApp.filter('location', ['$filter', function ($filter) {
    return function (value) {
        return ((value && value.geometry ? $filter('number')(value.geometry.coordinates[0], 3) + ', ' + $filter('number')(value.geometry.coordinates[1], 3) : '') + (value && value.properties && value.properties.accuracy ? ' at ' + $filter('number')(value.properties.accuracy, 2) + 'm' : ''));
    };
}]);

sdkInterfaceUiApp.directive('locationFormatter', ['$filter', function ($filter) {
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

sdkInterfaceUiApp.directive('dateFormatter', ['$filter', function ($filter) {
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

sdkInterfaceUiApp.directive('dateParser', ['$filter', function ($filter) {
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

sdkInterfaceUiApp.directive('inputNumber', ['$filter', function ($filter) {
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