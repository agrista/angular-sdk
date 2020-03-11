var sdkInterfaceUiApp = angular.module('ag.sdk.interface.ui', []);

sdkInterfaceUiApp.directive('busy', [function() {
    return {
        restrict: 'A',
        template: '<button ng-click="onClick($event)" ng-disabled="disabled() || isBusy" ng-class="getBusyClass()">\n    <span ng-if="isBusy">\n        <span class="spinner"><i ng-show="icon" ng-class="icon"></i></span> {{ text }}\n    </span>\n    <span ng-if="!isBusy" ng-transclude></span>\n</button>',
        replace: true,
        transclude: true,
        scope: {
            busy: '&',
            busyIcon: '@',
            busyText: '@',
            busyClass: '@',
            busyDisabled: '&'
        },
        link: function(scope, element, attrs) {
            scope.isBusy = false;
            scope.icon = scope.busyIcon || 'glyphicon glyphicon-refresh';
            scope.text = (attrs.busyText !== undefined ? scope.busyText : 'Saving');
            scope.disabled = scope.busyDisabled || function () {
                return false;
            };

            scope.getBusyClass = function () {
                return (scope.isBusy && scope.icon ? 'has-spinner active' : '') + (scope.isBusy && scope.busyClass ? ' ' + scope.busyClass : '');
            };

            scope.onClick = function (event) {
                var pendingRequests = 0;
                var promise = scope.busy();

                event.preventDefault();
                event.stopPropagation();

                scope.isBusy = true;

                if (typeof promise === 'object' && typeof promise.finally === 'function') {
                    promise.finally(function () {
                        scope.isBusy = false;
                    });
                } else {
                    var deregister = scope.$on('http-intercepted', function (event, args) {
                        pendingRequests = (args == 'request' ? pendingRequests + 1 : pendingRequests - 1);
                        if (scope.isBusy && pendingRequests == 0) {
                            deregister();
                            scope.isBusy = false;
                        }
                    });
                }
            };
        }
    }
}]);

sdkInterfaceUiApp.directive('dynamicName', function() {
    return {
        restrict: 'A',
        require: '?form',
        link: function(scope, element, attrs, controller) {
            var formCtrl = (controller != null) ? controller :  element.parent().controller('form');
            var currentElementCtrl = formCtrl[element.attr('name')];

            if (formCtrl && currentElementCtrl) {
                element.attr('name', attrs.name);
                formCtrl.$removeControl(currentElementCtrl);
                currentElementCtrl.$name = attrs.name;
                formCtrl.$addControl(currentElementCtrl);
            }
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
    return function (value, abs) {
        var geometry = value && value.geometry || value,
            coords = (geometry && geometry.coordinates ? {lng: geometry.coordinates[0], lat: geometry.coordinates[1]} : geometry);

        return ((coords ? ($filter('number')(abs ? Math.abs(coords.lat) : coords.lng, 3) + (abs ? '° ' + (coords.lat >= 0 ? 'N' : 'S') : '') + ', '
        + $filter('number')(abs ? Math.abs(coords.lng) : coords.lat, 3) + (abs ? '° ' + (coords.lng <= 0 ? 'W' : 'E') : '')) : '')
        + (value && value.properties && value.properties.accuracy ? ' at ' + $filter('number')(value.properties.accuracy, 2) + 'm' : ''));
    };
}]);

sdkInterfaceUiApp.filter('floor', ['$filter', function ($filter) {
    return function (value) {
        return $filter('number')(Math.floor(value), 0);
    };
}]);

sdkInterfaceUiApp.filter('htmlEncode', [function () {
    return function (text) {
        return (text || '').replace(/[\u00A0-\u9999<>&'"]/gim, function (i) {
            return '&#' + i.charCodeAt(0) + ';';
        });
    }
}]);

sdkInterfaceUiApp.filter('newlines', ['$filter', '$sce', function ($filter, $sce) {
    return function(msg, isXHTML) {
        return $sce.trustAsHtml($filter('htmlEncode')(msg).replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1'+ (isXHTML === undefined || isXHTML ? '<br />' : '<br>') +'$2'));
    }
}]);

sdkInterfaceUiApp.filter('unsafe', ['$sce', function ($sce) {
    return function (input) {
        return $sce.trustAsHtml(input);
    }
}]);

sdkInterfaceUiApp.directive('locationFormatter', ['$filter', function ($filter) {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function (scope, element, attrs, ngModel) {
            ngModel.$formatters.push(function (value) {
                var viewValue = '';
                if (value !== undefined) {
                    viewValue = $filter('location')(value, (attrs.locationFormatter === 'true'));

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
                var isNan = isNaN(value) || isNaN(parseFloat(value));

                ngModel.$setValidity('number', isNan === false);

                if (isNan === false) {
                    var float = parseFloat(value);

                    ngModel.$setValidity('range', (_min === false || float >= _min) && (_max === false || float <= _max));
                    return float;
                } else {
                    return undefined;
                }
            });
        }
    };
}]);

sdkInterfaceUiApp.directive('inputDate', ['moment', function (moment) {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function (scope, element, attrs, ngModel) {
            var format = attrs.dateFormat || 'YYYY-MM-DD';

            ngModel.$formatters.length = 0;
            ngModel.$parsers.length = 0;

            ngModel.$formatters.push(function (modelValue) {
                if (modelValue) {
                    return moment(modelValue).format(format);
                } else {
                    return modelValue;
                }
            });

            ngModel.$parsers.push(function (value) {
                if (value) {
                    var date = (typeof value == 'string' ? moment(value, ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'], true) : moment(value));

                    if (date && typeof date.isValid == 'function' && date.isValid()) {
                        ngModel.$setValidity('date-format', true);
                        return (typeof value == 'string' ? date.format('YYYY-MM-DD') : date);
                    } else {
                        ngModel.$setValidity('date-format', false);
                        return value;
                    }
                }
            });
        }
    };
}]);

sdkInterfaceUiApp.directive('sparkline', ['$window', 'underscore', function ($window, underscore) {
    return {
        restrict: 'A',
        template: '<div class="sparkline"></div>',
        replace: true,
        scope: {
            sparkline: '=',
            sparklineText: '='
        },
        link: function ($scope, $element, $attrs) {
            var d3 = $window.d3,
                element = $element[0],
                width = $attrs.width || element.clientWidth,
                xExtent = $attrs.xExtent,
                height = $attrs.height || element.clientHeight,
                yExtent = $attrs.yExtent || 100,
                interpolate = $attrs.interpolate || 'step-before',
                svg = d3.select(element).append('svg').attr('width', width).attr('height', height),
                text = svg.append('text').attr('class', 'sparkline-text').attr('x', width / 2).attr('y', (height / 2) + 5),
                area = svg.append('path').attr('class', 'sparkline-area'),
                line = svg.append('path').attr('class', 'sparkline-line');

            var xFn = d3.scale.linear().range([0, width]),
                yFn = d3.scale.linear().range([height, 0]);

            var areaFn = d3.svg.area()
                .interpolate(interpolate)
                .x(getDimension(xFn, 'x'))
                .y0(height)
                .y1(getDimension(yFn, 'y'));

            var lineFn = d3.svg.line()
                .interpolate(interpolate)
                .x(getDimension(xFn, 'x'))
                .y(getDimension(yFn, 'y'));

            $scope.$watchCollection('sparkline', function () {
                renderChart();
            });

            $scope.$watch('sparklineText', function () {
                text.text(function () {
                    return $scope.sparklineText;
                });
            });

            function getDimension (fn, field) {
                return function (d) {
                    return fn(d[field]);
                }
            }

            function renderChart () {
                $scope.data = underscore.map($scope.sparkline, function (data) {
                    return (underscore.isArray(data) ? {
                        x: (underscore.isNumber(data[0]) ? data[0] : 0),
                        y: (underscore.isNumber(data[1]) ? data[1] : 0)
                    } : {
                        x: (underscore.isNumber(data.x) ? data.x : 0),
                        y: (underscore.isNumber(data.y) ? data.y : 0)
                    });
                });

                // Pad first element
                $scope.data.unshift({x: -1, y: underscore.first($scope.data).y});

                xFn.domain(xExtent && xExtent != 0 ? [0, xExtent] : d3.extent($scope.data, function (d) {
                    return d.x;
                }));

                yFn.domain(yExtent && yExtent != 0 ? [0, yExtent] : [0, d3.max($scope.data, function (d) {
                    return d.y;
                })]);

                area.attr('d', areaFn($scope.data));
                line.attr('d', lineFn($scope.data));
            }
        }
    }
}]);

sdkInterfaceUiApp.directive('validator', ['$timeout', '$q', 'underscore', function ($timeout, $q, underscore) {
    return {
        restrict: 'A',
        require: 'ngModel',
        scope: {
            validate: '&validator',
            validateWatch: '&validatorWatch',
            validateAsync: '=validatorAsync',
            validateAsyncWait: '=validatorAsyncWait'
        },
        link: function (scope, element, attrs, ngModel) {
            if (typeof scope.validate == 'function') {
                var validator = scope.validate(),
                    waitPeriod = scope.validateAsyncWait || 0;

                function setTouched() {
                    if (typeof ngModel.$setTouched === 'function' && ngModel.$viewValue !== ngModel.$modelValue) {
                        ngModel.$setTouched();
                    }
                }

                if (scope.validateAsync) {
                    ngModel.$asyncValidators.validator = function (value) {
                        if (scope.waitTimer) {
                            $timeout.cancel(scope.waitTimer);
                            scope.deferredResult.reject();
                        }

                        scope.deferredResult = $q.defer();
                        scope.deferredResult.promise.finally(setTouched);

                        if (underscore.size(value) > 0) {
                            scope.waitTimer = $timeout(function () {
                                delete scope.waitTimer;

                                validator(ngModel.$name, value).then(scope.deferredResult.resolve, scope.deferredResult.reject);
                            }, waitPeriod);
                        } else if (attrs.required) {
                            scope.deferredResult.reject();
                        } else {
                            scope.deferredResult.resolve();
                        }

                        return scope.deferredResult.promise;
                    }
                } else {
                    ngModel.$validators.validator = function (value) {
                        setTouched();

                        return validator(ngModel.$name, value) === true;
                    }
                }
            }

            if (typeof scope.validateWatch == 'function') {
                if (scope.validateWatch()) {
                    scope.$watch(scope.validateWatch(), function () {
                        ngModel.$setDirty();
                        ngModel.$validate();
                    });
                }
            }
        }
    };
}]);
