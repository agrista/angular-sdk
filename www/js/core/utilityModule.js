'use strict';

define(['angular'], function () {
    var module = angular.module('utilityModule', []);

    module.directive('ngTap', function() {
        var isTouch = !!('ontouchstart' in window);

        return function(scope, elm, attrs) {
            // if there is no touch available, we'll fall back to click
            if (isTouch) {
                var tapping = false;
                elm.bind('touchstart', function() {
                    tapping = true;
                });
                // prevent firing when someone is f.e. dragging
                elm.bind('touchmove', function() {
                    tapping = false;
                });
                elm.bind('touchend', function() {
                    tapping && scope.$apply(attrs.ngTap);
                });
            }
            else {
                elm.bind('click', function() {
                    scope.$apply(attrs.ngTap);
                });
            }
        };
    });

    module.factory('promiseService', ['$q', '$rootScope', function ($q, $rootScope) {
        return {
            defer: function () {
                return $q.defer();
            },
            resolve: function (defer, response) {
                if (!$rootScope.$root.$$phase) {
                    $rootScope.$apply(function () {
                        defer.resolve(response);
                    });
                } else {
                    defer.resolve(response);
                }
            },
            reject: function (defer, response) {
                if (!$rootScope.$root.$$phase) {
                    $rootScope.$apply(function () {
                        defer.reject(response);
                    });
                } else {
                    defer.reject(response);
                }
            }
        };
    }]);
});
