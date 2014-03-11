var sdkConfigApp = angular.module('ag.sdk.core.config', []);

/**
 * @name configurationProvider / configuration
 * @description Provider to define the configuration of servers
 */
sdkConfigApp.provider('configuration', ['$httpProvider', '$locationProvider', function($httpProvider, $locationProvider) {
    var _version = '';
    var _host = 'local';

    var _servers = {
        local: '/',
        alpha: 'http://staging.farmer.agrista.net/',
        beta: 'http://farmer.agrista.net/'
    };

    return {
        setServers: function(servers) {
            angular.forEach(servers, function (host, name) {
                if (host.lastIndexOf('/') !== host.length - 1) {
                    host += '/';
                }

                _servers[name] = host;
            });

            this.useHost(_host, _version);
        },
        useHost: function(host, version, cCallback) {
            if (typeof version === 'function') {
                cCallback = version;
                version = '';
            }

            _version = version || '';

            if (_servers[host] !== undefined && host !== 'local') {
                _host = host;

                // Enable cross domain
                $httpProvider.defaults.useXDomain = (_servers[_host].indexOf($locationProvider.host()) === -1);
            }

            if (typeof cCallback === 'function') {
                cCallback(_servers[_host]);
            }
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