'use strict';

define(['angular'], function () {
    var module = angular.module('utilityModule', []);

    module.directive('stopPropagation', function () {
        return function (scope, element, attrs) {
            element.bind('click', function (event) {
                console.log('click');
                event.stopPropagation();
            });
        }
    });

    module.directive('preValidate', function () {
        return {
            restrict: 'A',
            require: 'form',
            link: function (scope, formElement, attributes, formController) {
                scope.$watch(formController.$valid, function () {
                    console.log('validation ' + formController.$valid);
                    scope.$eval(attributes.preValidate)
                });
            }
        };
    });

    module.factory('safeApply', ['$rootScope', function ($rootScope) {
        return function (fn) {
            if ($rootScope.$$phase) {
                fn();
            } else {
                $rootScope.$apply(fn);
            }
        };
    }]);

    module.factory('queueService', ['$q', 'promiseService', function ($q, promiseService) {
        function QueueService(options, callback) {
            // Check if instance of QueueService
            if (!(this instanceof QueueService)) {
                return new QueueService(options, callback);
            }

            // Validate parameters
            if (typeof options === 'function') {
                callback = options;
                options = {
                    limit: 1
                }
            }

            var _queue = [];
            var _limit = options.limit || 1;
            var _progress = {
                total: 0,
                complete: 0
            };

            // Private Functions
            var _next = function () {
                _limit++;

                if (_progress.complete < _progress.total) {
                    _progress.complete++;
                }

                pop();
            };

            var _success = _next;
            var _error = function () {
                callback({type: 'error'});

                _next();
            };

            // Public Functions
            var push = function (todo, context, args) {
                _progress.total++;
                _queue.push([todo, context, args]);

                pop();
            };

            var pop = function () {
                callback({type: 'progress', percent: (100.0 / _progress.total) * _progress.complete});

                console.log('TOTAL: ' + _progress.total + ' COMPLETE: ' + _progress.complete + ' PERCENT: ' + (100.0 / _progress.total) * _progress.complete);

                if (_queue.length === 0 && _progress.total === _progress.complete) {
                    _progress.total = 0;
                    _progress.complete = 0;

                    callback({type: 'complete'});
                }

                if (_limit <= 0 || _queue.length === 0) {
                    return;
                }

                _limit--;

                var buf = _queue.shift(),
                    todo = buf[0],
                    context = buf[1] || null,
                    args = buf[2] || null;

                $q.when(todo.apply(context, args)).then(_success, _error);
            };

            var clear = function () {
                _progress.total = 0;
                _progress.complete = 0;
                _queue.length = 0;
            };

            var pushPromise = function (todo, context, args) {
                push(function () {
                    var defer = promiseService.defer();

                    todo(defer);

                    return defer.promise;
                }, context, args);
            };

            return {
                pushPromise: pushPromise,
                push: push,
                pop: pop,
                clear: clear
            }
        }

        return function (options, callback) {
            return new QueueService(options, callback);
        };
    }]);

    module.factory('promiseService', ['$q', '$rootScope', function ($q, $rootScope) {
        function _safeApply(fn) {
            ($rootScope.$root.$$phase) ? fn() : $rootScope.$apply(fn);
        }

        return {
            all: function (promises) {
                return $q.all(promises);
            },
            defer: function () {
                var _defer = $q.defer();

                return {
                    resolve: function (response) {
                        _safeApply(function () {
                            _defer.resolve(response);
                        });

                    },
                    reject: function (response) {
                        _safeApply(function () {
                            _defer.reject(response);
                        });

                    },
                    promise: _defer.promise
                }
            }
        }
    }]);
});
