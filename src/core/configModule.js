var sdkConfigApp = angular.module('ag.sdk.config', []);

/**
 * @name configurationProvider / configuration
 * @description Provider to define the configuration of servers
 */
sdkConfigApp.provider('configuration', [
    '$httpProvider',
    function($httpProvider) {
        var _version = '';
        var _host = 'local';

        var _modules = [];
        var _servers = {
            local: 'http://localhost:9000/',
            staging: 'https://stage-api.agrista.com/',
            production: 'https://api.agrista.com/'
        };

        var _hasModule = function(name) {
            return _modules.indexOf(name) !== -1;
        };

        var _addModule = function(name) {
            if (_hasModule(name) == false) {
                _modules.push(name);
            }
        };

        var _getServer = function(stripTrailingSlash) {
            var server = _servers[_host];

            if (
                stripTrailingSlash &&
                server.lastIndexOf('/') === server.length - 1
            ) {
                server = server.substr(0, server.length - 1);
            }

            return server;
        };

        return {
            addModule: _addModule,
            hasModule: _hasModule,

            setServers: function(servers) {
                angular.forEach(servers, function(host, name) {
                    if (host.lastIndexOf('/') !== host.length - 1) {
                        host += '/';
                    }

                    _servers[name] = host;
                });

                this.useHost(_host, _version);
            },
            setVersion: function(version) {
                if (version) {
                    _version = version;
                }
            },
            getServer: _getServer,
            useHost: function(host, version, cCallback) {
                if (typeof version === 'function') {
                    cCallback = version;
                    version = _version;
                }

                _version = version || _version;

                if (_servers[host] !== undefined) {
                    _host = host;

                    // Enable cross domain
                    $httpProvider.defaults.useXDomain = true;
                    delete $httpProvider.defaults.headers.common[
                        'X-Requested-With'
                    ];
                }

                if (typeof cCallback === 'function') {
                    cCallback(_servers[_host]);
                }
            },
            $get: function() {
                return {
                    addModule: _addModule,
                    hasModule: _hasModule,

                    getVersion: function() {
                        return _version;
                    },
                    getHost: function() {
                        return _host;
                    },
                    getServer: _getServer
                };
            }
        };
    }
]);
