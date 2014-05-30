var sdkMonitorApp = angular.module('ag.sdk.monitor', ['ag.sdk.utilities']);

sdkMonitorApp.factory('queueService', ['$log', '$q', 'promiseService', function ($log, $q, promiseService) {
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

            $log.debug('QUEUE TOTAL: ' + _progress.total + ' COMPLETE: ' + _progress.complete + ' PERCENT: ' + (100.0 / _progress.total) * _progress.complete);

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

sdkMonitorApp.factory('promiseMonitor', ['$log', 'safeApply', function ($log, safeApply) {
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

        var _completePromise = function () {
            _stats.complete++;
            _stats.percent = (100.0 / _stats.total) * _stats.complete;

            $log.debug('MONITOR TOTAL: ' + _stats.total + ' COMPLETE: ' + _stats.complete + ' PERCENT: ' + _stats.percent);

            safeApply(function () {
                if (_stats.complete == _stats.total) {
                    callback({type: 'complete', percent: _stats.percent, stats: _stats});
                } else {
                    callback({type: 'progress', percent: _stats.percent, stats: _stats});
                }
            });
        };

        return {
            stats: function () {
                return _stats;
            },
            clear: function () {
                _stats = {
                    total: 0,
                    complete: 0,
                    resolved: 0,
                    rejected: 0,
                    percent: 0
                };
            },
            add: function (promise) {
                _stats.total++;

                promise.then(function (res) {
                    _stats.resolved++;

                    _completePromise();
                }, function (err) {
                    _stats.rejected++;

                    safeApply(function () {
                        callback({type: 'error'}, err);
                    });

                    _completePromise();
                });

                return promise;
            }
        };
    }

    return function (callback) {
        return new PromiseMonitor(callback);
    }
}]);
