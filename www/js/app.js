'use strict';

define(['angular', 'core/dataModule', 'core/utilityModule', 'core/navigationModule', 'core/lazyLoaderModule', 'phone/cameraModule'], function () {
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

    app.run(['lazyLoader', 'dataStore', function (lazyLoader, dataStore) {
        app.lazyLoader = lazyLoader;

        var valuationsStore = dataStore('farm-valuations', {
            api: {
                template: 'farm-valuations/:id',
                schema: {id: '@id'}
            }
        }, function () {
            var valuations = valuationsStore.read({id: '5182833c44e28913bea4619f'}, {limit: 50}, function (res, err) {

                if (res !== null) {
                    console.log('Data length: ' + res.length);

                    if (res.length > 0) {
                        var dataItem = res[0];

                        console.log(dataItem);

                        dataItem.data.farm_name = "Savage Farm";
                        console.log(dataItem.data.farm_name);


                        dataItem.data.farm_name = "Savage Farm 2";
                        console.log(dataItem.data.farm_name);
                    }
                }
            });
        });
    }]);

    return app;
});
