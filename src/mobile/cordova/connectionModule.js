var cordovaConnectionApp = angular.module('ag.mobile-sdk.cordova.connection', ['ag.sdk.library']);

cordovaConnectionApp.factory('connectionService', ['$timeout', 'underscore', function ($timeout, underscore) {
    var _watchConnectionList = [];
    var _lastConnectionType = undefined;
    var _timeout = undefined;

    var _updateConnection = function () {
        $timeout.cancel(_timeout);

        if (navigator.connection && _lastConnectionType !== navigator.connection.type) {
            _lastConnectionType = navigator.connection.type;

            angular.forEach(_watchConnectionList, function (watcher) {
                watcher(_lastConnectionType);
            });
        }

        _timeout = $timeout(_updateConnection, 10000);
    };

    return {
        watchConnection: function (callback) {
            if (typeof callback === 'function') {
                _watchConnectionList.push(callback);

                callback(_lastConnectionType);
                _updateConnection();
            }

            return {
                cancel: function () {
                    _watchConnectionList = underscore.without(_watchConnectionList, callback);

                    if (_watchConnectionList.length == 0) {
                        $timeout.cancel(_timeout);
                    }
                }
            }
        },
        isOnline: function () {
            return (navigator.connection && navigator.connection.type !== Connection.NONE);
        },
        isMobile: function () {
            return navigator.connection && (navigator.connection.type === Connection.CELL ||
                navigator.connection.type === Connection.CELL_2G ||
                navigator.connection.type === Connection.CELL_3G ||
                navigator.connection.type === Connection.CELL_4G);
        }
    };
}]);
