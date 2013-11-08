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
                options = { limit: 1 };
            }
            if (typeof options !== 'object') options = { limit: 1 };
            if (typeof callback !== 'function') callback = angular.noop;

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
            var push = function (action, deferred) {
                _progress.total++;
                _queue.push([action, deferred]);

                pop();
            };

            var pop = function () {
                callback({type: 'progress', percent: (100.0 / _progress.total) * _progress.complete});

                console.log('QUEUE TOTAL: ' + _progress.total + ' COMPLETE: ' + _progress.complete + ' PERCENT: ' + (100.0 / _progress.total) * _progress.complete);

                if (_queue.length === 0 && _progress.total === _progress.complete) {
                    _progress.total = 0;
                    _progress.complete = 0;

                    callback({type: 'complete'});
                }

                if (_limit <= 0 || _queue.length === 0) {
                    return;
                }

                _limit--;

                var buffer = _queue.shift(),
                    action = buffer[0],
                    deferred = buffer[1];

                deferred.promise.then(_success, _error);

                action(deferred);
            };

            var clear = function () {
                _progress.total = 0;
                _progress.complete = 0;
                _queue.length = 0;
            };

            var wrapPush = function (action) {
                var deferred = promiseService.defer();

                push(action, deferred);

                return deferred.promise;
            };

            return {
                wrapPush: wrapPush,
                push: push,
                pop: pop,
                clear: clear
            }
        }

        return function (options, callback) {
            return new QueueService(options, callback);
        };
    }]);

    module.factory('objectId', function() {
        /*
         *
         * Copyright (c) 2011 Justin Dearing (zippy1981@gmail.com)
         * Dual licensed under the MIT (http://www.opensource.org/licenses/mit-license.php)
         * and GPL (http://www.opensource.org/licenses/gpl-license.php) version 2 licenses.
         * This software is not distributed under version 3 or later of the GPL.
         *
         * Version 1.0.1-dev
         *
         */

        /**
         * Javascript class that mimics how WCF serializes a object of type MongoDB.Bson.ObjectId
         * and converts between that format and the standard 24 character representation.
         */
        var ObjectId = (function () {
            var increment = 0;
            var pid = Math.floor(Math.random() * (32767));
            var machine = Math.floor(Math.random() * (16777216));

            // Get local stored machine id
            var mongoMachineId = parseInt(window.localStorage['mongoMachineId']);

            if (mongoMachineId >= 0 && mongoMachineId <= 16777215) {
                machine = Math.floor(window.localStorage['mongoMachineId']);
            }

            // Just always stick the value in.
            window.localStorage['mongoMachineId'] = machine;

            function ObjId() {
                if (!(this instanceof ObjectId)) {
                    return new ObjectId(arguments[0], arguments[1], arguments[2], arguments[3]).toString();
                }

                if (typeof (arguments[0]) == 'object') {
                    this.timestamp = arguments[0].timestamp;
                    this.machine = arguments[0].machine;
                    this.pid = arguments[0].pid;
                    this.increment = arguments[0].increment;
                }
                else if (typeof (arguments[0]) == 'string' && arguments[0].length == 24) {
                    this.timestamp = Number('0x' + arguments[0].substr(0, 8)),
                        this.machine = Number('0x' + arguments[0].substr(8, 6)),
                        this.pid = Number('0x' + arguments[0].substr(14, 4)),
                        this.increment = Number('0x' + arguments[0].substr(18, 6))
                }
                else if (arguments.length == 4 && arguments[0] != null) {
                    this.timestamp = arguments[0];
                    this.machine = arguments[1];
                    this.pid = arguments[2];
                    this.increment = arguments[3];
                }
                else {
                    this.timestamp = Math.floor(new Date().valueOf() / 1000);
                    this.machine = machine;
                    this.pid = pid;
                    this.increment = increment++;
                    if (increment > 0xffffff) {
                        increment = 0;
                    }
                }
            };
            return ObjId;
        })();

        ObjectId.prototype.getDate = function () {
            return new Date(this.timestamp * 1000);
        };

        ObjectId.prototype.toArray = function () {
            var strOid = this.toString();
            var array = [];
            var i;
            for(i = 0; i < 12; i++) {
                array[i] = parseInt(strOid.slice(i*2, i*2+2), 16);
            }
            return array;
        };

        /**
         * Turns a WCF representation of a BSON ObjectId into a 24 character string representation.
         */
        ObjectId.prototype.toString = function () {
            var timestamp = this.timestamp.toString(16);
            var machine = this.machine.toString(16);
            var pid = this.pid.toString(16);
            var increment = this.increment.toString(16);
            return '00000000'.substr(0, 8 - timestamp.length) + timestamp +
                '000000'.substr(0, 6 - machine.length) + machine +
                '0000'.substr(0, 4 - pid.length) + pid +
                '000000'.substr(0, 6 - increment.length) + increment;
        };

        ObjectId.prototype.toBase64String = function() {
            return window.btoa(this.toString());
        };

        return function() {
            return new ObjectId();
        };
    });

    module.factory('promiseMonitor', function() {
        function PromiseMonitor(callback) {
            if (!(this instanceof PromiseMonitor)) {
                return new PromiseMonitor(callback);
            }

            var _stats = {
                total: 0,
                complete: 0,
                resolved: 0,
                rejected: 0,
                percent: 0
            };

            var _completePromise = function() {
                _stats.complete++;
                _stats.percent = (100.0 / _stats.total) * _stats.complete;

                console.log('MONITOR TOTAL: ' + _stats.total + ' COMPLETE: ' + _stats.complete + ' PERCENT: ' + _stats.percent);

                if (_stats.complete == _stats.total) {
                    callback({type: 'complete', percent: _stats.percent, stats: _stats});
                } else {
                    callback({type: 'progress', percent: _stats.percent, stats: _stats});
                }
            };

            return {
                stats: function() {
                    return _stats;
                },
                add: function(promise) {
                    _stats.total++;

                    promise.then(function(res) {
                        _stats.resolved++;

                        _completePromise();
                    }, function(err) {
                        _stats.rejected++;

                        callback({type: 'error'}, err);
                        _completePromise();
                    });

                    return promise;
                }
            };
        }

        return function(callback) {
            return new PromiseMonitor(callback);
        }
    });

    module.factory('promiseService', ['$q', '$rootScope', 'safeApply', function ($q, $rootScope, safeApply) {
        var _defer = function() {
            var deferred = $q.defer();

            return {
                resolve: function (response) {
                    safeApply(function () {
                        deferred.resolve(response);
                    });

                },
                reject: function (response) {
                    safeApply(function () {
                        deferred.reject(response);
                    });

                },
                promise: deferred.promise
            }
        };

        return {
            all: function (promises) {
                return $q.all(promises);
            },
            wrap: function(action) {
                var deferred = _defer();

                action(deferred);

                return deferred.promise;
            },
            wrapAll: function(action) {
                var list = [];

                action(list);

                return $q.all(list);
            },
            defer: _defer
        }
    }]);
});
