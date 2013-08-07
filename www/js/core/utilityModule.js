'use strict';

define(['angular'], function () {
    var module = angular.module('utilityModule', []);

    module.directive('stopPropagation', function() {
        return function(scope, element, attrs) {
            element.bind('click', function(event) {
                console.log('click');
                event.stopPropagation();
            });
        }
    })

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
