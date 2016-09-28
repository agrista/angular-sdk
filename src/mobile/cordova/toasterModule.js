var cordovaToasterApp = angular.module('ag.mobile-sdk.cordova.toaster', []);

cordovaToasterApp.factory('toasterService', [function () {
    var _show = function (message, duration, position) {
        var _toaster = (window.plugins && window.plugins.toast ? window.plugins.toast : undefined);

        if (_toaster && typeof _toaster.show == 'function') {
            _toaster.show(message, duration || 'long', position || 'bottom');
        }
    };

    var _hide = function () {
        var _toaster = (window.plugins && window.plugins.toast ? window.plugins.toast : undefined);

        if (_toaster && typeof _toaster.hide == 'function') {
            _toaster.hide();
        }
    }

    return {
        show: function (message, duration, position) {
            _show(message, duration, position);
        },
        showLongBottom: function (message) {
            _show(message);
        },
        hide: function () {
            _hide();
        }
    };
}]);
