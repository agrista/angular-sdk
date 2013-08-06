'use strict';

define(['angular', 'core/authorizationModule', 'core/dataModule', 'core/utilityModule', 'core/navigationModule', 'core/lazyLoaderModule'], function () {
    var app = angular.module('app', ['ngMobile', 'authorizationModule', 'dataModule', 'utilityModule', 'navigationModule', 'lazyLoaderModule']);

    app.config(['$provide', '$routeProvider', 'lazyLoaderProvider', 'authorizationProvider', 'dataStoreProvider',
        function ($provide, $routeProvider, lazyLoaderProvider, authorizationProvider, dataStoreProvider) {

            // WORKAROUND: https://github.com/angular/angular.js/issues/2931
            $provide.decorator('$sniffer', ['$delegate', function ($delegate) {
                if (!$delegate.transitions || !$delegate.animations) {
                    $delegate.transitions = (typeof document.body.style.webkitTransition === 'string');
                    $delegate.animations = (typeof document.body.style.webkitAnimation === 'string');
                }
                return $delegate;
            }]);

            $routeProvider
                .when('/', {
                    templateUrl: 'partials/routes/activities.html',
                    controller: 'ActivitiesController',
                    authorization: authorizationProvider.accessLevel.open,
                    resolve: {
                        require: lazyLoaderProvider.inject(['activitiesModule'], {path: 'routes'})
                    }
                })
                .when('/login', {
                    templateUrl: 'partials/routes/login.html',
                    controller: 'LoginController',
                    authorization: authorizationProvider.accessLevel.open,
                    resolve: {
                        require: lazyLoaderProvider.inject(['loginModule'], {path: 'routes'})
                    }
                })
                .when('/tasks', {
                    templateUrl: 'partials/routes/tasks.html',
                    controller: 'TasksController',
                    authorization: authorizationProvider.accessLevel.user,
                    resolve: {
                        require: lazyLoaderProvider.inject(['tasksModule'], {path: 'routes'})
                    }
                })
                .otherwise({redirectTo: '/'});

            authorizationProvider.config({url: 'http://localhost:3006/'});
            dataStoreProvider.config('http://localhost:3006/api/');
        }]);

    app.run(['lazyLoader', function (lazyLoader) {
        app.lazyLoader = lazyLoader;
    }]);

    return app;
});
