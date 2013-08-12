'use strict';

define(['angular', 'core/agristaModule', 'core/authorizationModule', 'core/utilityModule', 'core/navigationModule', 'core/lazyLoaderModule', 'phone/geolocationModule'], function () {
    var app = angular.module('app', ['ngMobile', 'agristaModule', 'authorizationModule', 'utilityModule', 'navigationModule', 'lazyLoaderModule', 'geolocationModule']);

    app.config(['$provide', '$routeProvider', 'lazyLoaderProvider', 'authorizationProvider',
        function ($provide, $routeProvider, lazyLoaderProvider, authorizationProvider) {

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
                    templateUrl: 'partials/routes/customers.html',
                    controller: 'CustomerListController',
                    authorization: authorizationProvider.accessLevel.user,
                    resolve: {
                        require: lazyLoaderProvider.inject(['customersModule'], {path: 'routes'})
                    }
                })
                .when('/customers', {
                    templateUrl: 'partials/routes/customers.html',
                    controller: 'CustomerListController',
                    authorization: authorizationProvider.accessLevel.user,
                    resolve: {
                        require: lazyLoaderProvider.inject(['customersModule'], {path: 'routes'})
                    }
                })
                .when('/customer/:id', {
                    templateUrl: 'partials/routes/customer.html',
                    controller: 'CustomerDetailController',
                    authorization: authorizationProvider.accessLevel.user,
                    resolve: {
                        require: lazyLoaderProvider.inject(['customersModule'], {path: 'routes'})
                    }
                })
                .when('/customer/:id/enterprises', {
                    templateUrl: 'partials/routes/enterprises.html',
                    controller: 'CustomerEnterpriseController',
                    authorization: authorizationProvider.accessLevel.user,
                    resolve: {
                        require: lazyLoaderProvider.inject(['customersModule'], {path: 'routes'})
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
        }]);

    app.run(['lazyLoader', function (lazyLoader) {
        app.lazyLoader = lazyLoader;
    }]);

    return app;
});
