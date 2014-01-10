var phoneConnectionApp = angular.module('ag.phone.connection', []);

phoneConnectionApp.factory('connectionService', ['$timeout', function ($timeout) {
    var _onConnectionChangeList = [];
    var _lastConnectionType = undefined;

    var _updateConnection = function () {
        if (_lastConnectionType !== navigator.connection.type) {
            _lastConnectionType = navigator.connection.type;

            for (var i = _onConnectionChangeList.length - 1; i >= 0; i--) {
                if (_onConnectionChangeList[i] !== undefined) {
                    _onConnectionChangeList[i](_lastConnectionType);
                } else {
                    _onConnectionChangeList.splice(i, 1);
                }
            }
        }

        $timeout(_updateConnection, 10000);
    };

    _updateConnection();

    return {
        onConnectionChange: function (onChangeCb) {
            if (typeof onChangeCb === 'function') {
                _onConnectionChangeList.push(onChangeCb);
            }
        },
        isOnline: function () {
            return (navigator.connection.type !== Connection.NONE);
        },
        isMobile: function () {
            return (navigator.connection.type === Connection.CELL ||
                navigator.connection.type === Connection.CELL_2G ||
                navigator.connection.type === Connection.CELL_3G ||
                navigator.connection.type === Connection.CELL_4G);
        }
    };
}]);
