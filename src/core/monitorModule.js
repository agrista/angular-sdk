var sdkMonitorApp = angular.module('ag.sdk.monitor', ['ag.sdk.utilities']);

sdkMonitorApp.config(['$provide', function ($provide) {
    $provide.decorator('$log', ['$delegate', '$filter', 'logStore', 'moment', 'underscore', function ($delegate, $filter, logStore, moment, underscore) {
        function prepareLogLevelFunction (log, level) {
            var levelFunction = log[level];

            log[level] = function () {
                var args = [].slice.call(arguments),
                    caller = (arguments.callee && arguments.callee.caller && arguments.callee.caller.name.length > 0 ? arguments.callee.caller.name + ' :: ' : ''),
                    output = (underscore.isObject(args[0]) ? (typeof args[0].toString === 'function' ? args[0].toString() : '\n' + $filter('json')(args[0])) : args[0]);

                args[0] = moment().format('YYYY-MM-DDTHH:mm:ss.SSS') + underscore.lpad(' [' + level.toUpperCase() + '] ', 7, ' ') +  caller + output;

                logStore.log(level, args[0]);
                levelFunction.apply(null, args);
            };
        }

        prepareLogLevelFunction($delegate, 'log');
        prepareLogLevelFunction($delegate, 'info');
        prepareLogLevelFunction($delegate, 'warn');
        prepareLogLevelFunction($delegate, 'debug');
        prepareLogLevelFunction($delegate, 'error');

        return $delegate;
    }]);
}]);

sdkMonitorApp.provider('logStore', [function () {
    var _items = [],
        _defaultConfig = {
            maxItems: 1000
        },
        _config = _defaultConfig;

    return {
        config: function (config) {
            _config = config;
        },
        $get: ['underscore', function (underscore) {
            _config = underscore.defaults(_config, _defaultConfig);

            return {
                log: function (level, entry) {
                    var item = {
                        level: level,
                        entry: entry
                    };

                    _items.splice(0, 0, item);

                    if (_items.length > _config.maxItems) {
                        _items.pop();
                    }
                },
                clear: function () {
                    _items = [];
                },
                list: function () {
                    return _items;
                }
            }
        }]
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
