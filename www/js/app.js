'use strict';

define(['angular', 'core/utilityModule', 'core/navigationModule', 'core/lazyLoaderModule'], function() {
    var app = angular.module('app', ['utilityModule', 'navigationModule', 'lazyLoaderModule']);

    app.config(['$routeProvider', 'lazyLoaderProvider', function ($routeProvider, lazyLoaderProvider) {
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
    }]);

    app.run(['lazyLoader', function(lazyLoader) {
        app.lazyLoader = lazyLoader;
    }]);

    return app;
});
