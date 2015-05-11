var cordovaToasterApp = angular.module('ag.mobile-sdk.cordova.toaster', []);

cordovaToasterApp.factory('toasterService', [function () {
    var _show = function (message, duration, position) {
        var _toaster = (window.plugins && window.plugins.toast ? window.plugins.toast : undefined);

        if (_toaster !== undefined) {
            _toaster.show(message, duration, position);
        }
    };

    return {
        show: function (message, duration, position) {
            _show(message, duration, position);
        },
        showLongBottom: function (message) {
            _show(message, 'long', 'bottom');
        }
    };
}]);