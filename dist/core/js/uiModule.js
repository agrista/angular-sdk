'use strict';

define(['angular'], function () {
    var module = angular.module('uiModule', []);

    module.directive('multiSelect', function() {
        var linkFn = function (scope, element, attrs) {
            var _items = {};

            var watchData = function () {
                _items = {};

                if (scope.options !== undefined) {
                    for (var i = 0; i < scope.options.length; i++) {
                        _items[scope.options[i]] = false;
                    }
                }

                if (scope.value !== undefined) {
                    for (var i = 0; i < scope.value.length; i++) {
                        _items[scope.value[i]] = true;
                    }
                }
            };

            scope.$watch('value', watchData);
            scope.$watch('options', watchData);

            scope.isSelected = function (index) {
                return _items[scope.options[index]];
            }

            scope.itemClicked = function(index) {
                if (scope.ngDisabled !== true) {
                    _items[scope.options[index]] = !_items[scope.options[index]];

                    var _selected = [];

                    for (var itemKey in _items) {
                        if (_items.hasOwnProperty(itemKey) && _items[itemKey] === true) {
                            _selected.push(itemKey);
                        }
                    }

                    scope.value = _selected;
                }
            };
        };

        return {
            restrict: 'E',
            replace: true,
            scope: {
                value: '=',
                options: '=',
                ngDisabled: '='
            },
            template: '<div class="multi-select row" ng-class="{disabled: ngDisabled}">\n    <div class="multi-select-item col-sm-4 col-md-3 col-lg-2" ng-repeat="item in options">\n        <div class="multi-select-btn" ng-click="itemClicked($index)" ng-class="{active: isSelected($index)}">{{ item }}</div>\n    </div>\n</div>',
            link: linkFn
        }
    });

    module.directive("locationFormatter", ['$filter', function ($filter) {
        return {
            restrict: 'A',
            require: 'ngModel',
            link: function (scope, element, attrs, ngModel) {
                ngModel.$formatters.push(function (value) {
                    var viewValue = '';
                    if (value !== undefined) {
                        viewValue = $filter('number')(value.geometry.coordinates[0], 3) + ', ' + $filter('number')(value.geometry.coordinates[1], 3) + ' at ' + $filter('number')(value.properties.accuracy, 2) + 'm';

                        if (attrs.ngChange) {
                            scope.$eval(attrs.ngChange);
                        }
                    }

                    return viewValue;
                });
            }
        };
    }]);

    module.directive("dateFormatter", ['$filter', function ($filter) {
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

    module.directive("dateParser", ['$filter', function ($filter) {
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

    module.directive('preValidate', function () {
        return {
            restrict: 'A',
            require: 'form',
            link: function (scope, element, attrs) {
                scope.$watch(attrs.name + '.$valid', function () {
                    scope.$eval(attrs.preValidate)
                });
            }
        };
    });
});
