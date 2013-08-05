'use strict';

define(['angular'], function () {
    var module = angular.module('utilityModule', []);

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
