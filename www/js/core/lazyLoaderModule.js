'use strict';

define(['angular'], function() {
    var module = angular.module('lazyLoaderModule', []);

    module.provider('lazyLoader', ['$controllerProvider', '$compileProvider', '$filterProvider', '$provide',
        function ($controllerProvider, $compileProvider, $filterProvider, $provide) {
            function joinPaths(base, urls) {
                console.log('LAZY: ' + base);
                base = base.split('/');
                console.log(base);

                for(var i = 0; i < urls.length; i++) {
                    urls[i] = base.concat(urls[i].split('/')).join('/');
                    console.log('LAZY: ' + urls[i]);
                }

                return urls;
            };

            this.inject = function (dependencies, options) {
                if(typeof dependencies === 'string') dependencies = dependencies.split(',');

                console.log(dependencies);

                if(options.path) {
                    console.log(options.path);
                    dependencies = joinPaths(options.path, dependencies);
                }

                console.log(dependencies);

                return ['$q', '$rootScope', function ($q, $rootScope) {
                    var defer = $q.defer();

                    requirejs(dependencies, function () {
                        $rootScope.$apply(function () {
                            defer.resolve(defer, arguments);
                        });
                    });

                    return defer.promise;
                }];
            };

            this.$get = function () {
                return {
                    controller: function (name, controller) {
                        $controllerProvider.register(name, controller);
                    },
                    directive: function (name, directive) {
                        $compileProvider.directive(name, directive);
                    },
                    filter: function (name, filter) {
                        $filterProvider.register(name, filter);
                    },
                    service: function (name, service) {
                        $provide.service(name, service);
                    },
                    factory: function (name, factory) {
                        $provide.factory(name, factory);
                    }
                }
            }
        }]);
});
