var sdkInterfaceNavigiationApp = angular.module('ag.sdk.interface.navigation', []);

sdkInterfaceNavigiationApp.provider('navigationService', function() {
    var _registeredApps = {};
    var _groupedApps = [];

    var _groupOrder = {
        'Favourites': 1,
        'Assets': 2,
        'Apps': 3,
        'Administration': 4
    };

    var _sortItems = function (a, b) {
        return a.order - b.order;
    };

    var _registerApps = this.registerApps = function(apps) {
        apps = (apps instanceof Array ? apps : [apps]);

        angular.forEach(apps, function (app) {
            app = _.defaults(app, {
                order: 100,
                group: 'Apps'
            });

            if (app.title && app.state) {
                _registeredApps[app.title] = app;
            }
        });
    };

    this.$get = ['$rootScope', '$state', function($rootScope, $state) {
        var _slim = false;
        var _footerText = '';

        $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
            for (var i = 0; i < _groupedApps.length; i++) {
                var group = _groupedApps[i];

                for (var j = 0; j < group.items.length; j++) {
                    group.items[j].active = $state.includes(group.items[j].state);
                }
            }
        });

        $rootScope.$on('navigation::item__selected', function(event, args) {
            console.log(args);
            $state.go(args);
        });

        var _allowApp = function (appName) {
            var app = _registeredApps[appName];

            if (app) {
                var group = _.findWhere(_groupedApps, {title: app.group});

                // Find if the group exists
                if (group === undefined) {
                    // Add the group
                    group = {
                        title: app.group,
                        order: _groupOrder[app.group] || 100,
                        items: []
                    };

                    _groupedApps.push(group);
                    _groupedApps = _groupedApps.sort(_sortItems);
                }

                // Find if the app exists in the group
                var groupItem = _.findWhere(group.items, {title: app.title});

                if (groupItem === undefined) {
                    // Add the app to the group
                    app.active = $state.includes(app.state);

                    group.items.push(app);
                    group.items = group.items.sort(_sortItems);

                    $rootScope.$broadcast('navigation::items__changed', _groupedApps);
                    $rootScope.$broadcast('navigation::app__allowed', app);
                }
            }
        };

        return {
            getGroupedApps: function () {
                return _groupedApps;
            },
            /*
             * App registration
             */
            registerApps: function (apps) {
                _registerApps(apps);
            },
            unregisterApps: function () {
                _registeredApps = {};
                _groupedApps = [];
            },
            /*
             * Permission control
             */
            allowApp: function (appName) {
                _allowApp(appName);
            },
            revokeAllApps: function () {
                _groupedApps = [];

                $rootScope.$broadcast('navigation::items__changed', _groupedApps);
            },
            /*
             * Control slim toggle
             */
            toggleSlim: function () {
                _slim = !_slim;

                $rootScope.$broadcast('navigation::slim__changed', _slim);
            },
            isSlim: function () {
                return _slim;
            },
            /*
             * Setting navigation sidebar footer
             */
            footerText: function (text) {
                if (text !== undefined) {
                    _footerText = text;

                    $rootScope.$broadcast('navigation::footerText', _footerText);
                }

                return _footerText;
            }
        }
    }];
});
