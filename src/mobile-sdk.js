var mobileSdkApp = angular.module('ag.mobile-sdk', ['ag.sdk.core.authorization', 'ag.sdk.core.id', 'ag.sdk.core.utilities', 'ag.sdk.core.monitor', 'ag.sdk.interface.map', 'ag.sdk.helper', 'ag.mobile-sdk.helper', 'ag.mobile-sdk.api', 'ag.mobile-sdk.data']);

/**
 * @name routeResolverProvider / routeResolver
 * @description Provider to define and resolve the data required for a route
 */
mobileSdkApp.provider('routeResolver', function () {
    var _routeTable = {};

    this.when = function (routePath, resolverInjection) {
        if (routePath instanceof Array) {
            angular.forEach(routePath, function (route) {
                _routeTable[route] = resolverInjection;
            })
        } else {
            _routeTable[routePath] = resolverInjection;
        }

        return this;
    };

    this.resolver = function () {
        return {
            data: ['routeResolver', function (routeResolver) {
                return routeResolver.getData();
            }]
        }
    };

    this.$get = ['$route', '$injector', function ($route, $injector) {
        return {
            getData: function () {
                var resolverInjection = ($route.current && $route.current.$$route ? _routeTable[$route.current.$$route.originalPath] : undefined);

                return (resolverInjection ? $injector.invoke(resolverInjection) : undefined);
            },
            getRoute: function (route, params) {
                params = params || {};

                angular.forEach(params, function (value, param) {
                    route = route.replace(':' + param, value);
                });

                return route;
            }
        }
    }];
});

/**
 * @name configurationProvider / configuration
 * @description Provider to define the configuration of servers
 */
mobileSdkApp.provider('configuration', [function() {
    var _version = '';
    var _host = 'alpha';

    var _servers = {
        local: 'http://localhost:3005/',
        alpha: 'http://staging.farmer.agrista.net/',
        beta: 'http://farmer.agrista.net/'
    };

    return {
        setServers: function(servers) {
            _servers = servers;
        },
        config: function(version, host, cCallback) {
            if (_servers[host] !== undefined) {
                _host = host;
            }

            _version = version;

            cCallback(_servers[_host]);
        },
        $get: function() {
            return {
                getVersion: function() {
                    return _version;
                },
                getHost: function() {
                    return _host;
                },
                getServer: function() {
                    return _servers[_host];
                }
            }
        }
    }
}]);