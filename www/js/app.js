'use strict';

define(['angular', 'core/dataModule', 'core/utilityModule', 'core/navigationModule', 'core/lazyLoaderModule', 'phone/cameraModule'], function() {
    var app = angular.module('app', ['ngResource', 'dataModule', 'utilityModule', 'navigationModule', 'lazyLoaderModule', 'cameraModule']);

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

    app.run(['lazyLoader', 'dataStore', function(lazyLoader, dataStore) {
        app.lazyLoader = lazyLoader;

        var valuationsStore = dataStore('farm-valuations', {
            api: {
                template: 'farm-valuations/:farmid',
                schema: {farmid: '@id'}
            }
        }, function() {
            var valuations = valuationsStore.read({farmid: '5182833c44e28913bea4619f'}, {limit: 50}, function(res, err) {
                console.log('Data length: ' + res.length);
            });
        });
    }]);

    return app;
});
