'use strict';

define(['angular', 'core/dataModule', 'core/utilityModule', 'core/navigationModule', 'core/lazyLoaderModule'], function () {
    var app = angular.module('app', ['ngMobile', 'ngResource', 'dataModule', 'utilityModule', 'navigationModule', 'lazyLoaderModule']);

    app.config(['$routeProvider', 'lazyLoaderProvider', 'dataStoreProvider', function ($routeProvider, lazyLoaderProvider, dataStoreProvider) {
        $routeProvider
            .when('/activities', {
                templateUrl: 'partials/routes/activities.html',
                controller: 'ActivitiesController',
                resolve: {
                    require: lazyLoaderProvider.inject(['activitiesModule'], {path: 'routes'})
                }
            })
            .when('/tasks', {
                templateUrl: 'partials/routes/tasks.html',
                controller: 'TasksController',
                resolve: {
                    require: lazyLoaderProvider.inject(['tasksModule'], {path: 'routes'})
                }
            })
            .otherwise({redirectTo: '/activities'});


        dataStoreProvider.config('http://localhost:3006/api/');
    }]);

    app.run(['lazyLoader', function (lazyLoader) {
        app.lazyLoader = lazyLoader;
    }]);

    return app;
});
