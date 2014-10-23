var cordovaConnectionApp = angular.module('ag.mobile-sdk.cordova.connection', []);

cordovaConnectionApp.factory('connectionService', ['$timeout', function ($timeout) {
    var _watchConnectionList = [];
    var _lastConnectionType = undefined;

    var _updateConnection = function () {
        if (_lastConnectionType !== navigator.connection.type) {
            _lastConnectionType = navigator.connection.type;

            angular.forEach(_watchConnectionList, function (watcher) {
                watcher(_lastConnectionType);
            });
        }

        $timeout(_updateConnection, 10000);
    };

    _updateConnection();

    return {
        watchConnection: function (callback) {
            if (typeof callback === 'function') {
                _watchConnectionList.push(callback);
            }
        },
        isOnline: function () {
            return (navigator.connection.type !== Connection.NONE && navigator.connection.type !== Connection.UNKNOWN);
        },
        isMobile: function () {
            return (navigator.connection.type === Connection.CELL ||
                navigator.connection.type === Connection.CELL_2G ||
                navigator.connection.type === Connection.CELL_3G ||
                navigator.connection.type === Connection.CELL_4G);
        }
    };
}]);
