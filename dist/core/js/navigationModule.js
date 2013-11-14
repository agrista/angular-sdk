'use strict';

define(['angular', 'angular-animate', 'core/utilityModule'], function () {
    var module = angular.module('navigationModule', ['ngAnimate', 'utilityModule']);

    module.service('navigationService', ['$rootScope', '$location', function ($rootScope, $location) {
        var _stack = [];
        var _item = {};

        return {
            go: function (url, mode, pop) {
                $rootScope.$broadcast('navigation', {
                    url: url,
                    mode: mode,
                    push: !pop
                });

                $location.url(url);
            },
            push: function(url, state, mode) {
                if (typeof state !== 'object') {
                    mode = state;
                    state = undefined;
                }

                _stack.push({
                    url: $location.url(),
                    state: state,
                    mode: mode,
                    push: false
                });

                _item = {
                    url: url,
                    mode: mode,
                    push: true
                };

                $rootScope.$broadcast('navigation', _item);
                $location.url(_item.url);
            },
            pop: function(number) {
                number = number || 1;
                _item = {url: '/'};

                while (number > 0 && _stack.length > 0) {
                    _item = _stack.pop();
                    number--;
                }

                $rootScope.$broadcast('navigation', _item);
                $location.url(_item.url);
            },
            state: function() {
                return _item.state;
            }
        }
    }]);

    module.directive('pageMenu', function () {
        return {
            restrict: 'E',
            replace: true,
            template: '<div class="sidebar">\n    <div class="navbar">\n        <div class="container">\n\n                <p class="navbar-text">{{ menu.title }}</p>\n\n        </div>\n    </div>\n    <nav class="list-container">\n        <div ng-repeat="section in menu.sections">\n            <div ng-hide="section.hidden">\n                <div class="section-header">{{ section.title }}</div>\n                <ul class="nav">\n                    <li ng-repeat="item in section.items">\n                        <a ng-click="menu.click($parent.$index, $index)" ng-class="{active: item.active}"\n                           stop-propagation>\n                            <span class="glyphicons {{ item.icon }}"></span>\n                            {{ item.title }}\n                        </a>\n                    </li>\n                </ul>\n            </div>\n        </div>\n    </nav>\n</div>\n'
        };
    });

    module.directive('pageToolbar', function () {
        return {
            restrict: 'E',
            replace: true,
            transclude: true,
            template: '<div class="toolbar">\n    <div class="container" ng-transclude></div>\n</div>'
        };
    });

    module.directive('pageContainer', function () {
        return {
            restrict: 'E',
            replace: true,
            transclude: true,
            template: '<div class="page-container" ng-class="{\'show-menu\': menu.show === true}" ng-transclude></div>'
        };
    });

    module.directive('pageContent', function () {
        return {
            restrict: 'E',
            replace: true,
            transclude: true,
            template: '<div class="page-content" ng-transclude></div>'
        };
    });

    /**
     * Setup the page-navbar directive. Directive injects the page-navbar template and provides a button interface.
     * When no navigate-left or navigate-right function is provided then the button is hidden.
     * <page-navbar title="Navbar title"
     *         back-button="{icon: 'remove'}"
     *         navigate-back="navigateLeftFunction"
     *         primary-button="{icon: 'ok', title: 'Save'}"
     *         navigate-primary="navigateRightFunction"></page-navbar>
     *
     * @param title {string} The navigation bar title
     * @param back-button {object} Back button chrome settings {icon: string, title: string}
     * @param primary-button {object} Primary button chrome settings {icon: string, title: string}
     * @param secondary-button {object} Secondary button chrome settings {icon: string, title: string}
     * @param navigate-back {function} Function to call on back button click
     * @param navigate-primary {function} Function to call on primary button click
     * @param navigate-secondary {function} Function to call on secondary button click
     */
    module.directive('pageNavbar', function () {
        return {
            restrict: 'E',
            scope: {
                title: '=',
                backButton: '=',
                primaryButton: '=',
                secondaryButton: '=',
                navigateBack: '=',
                navigatePrimary: '=',
                navigateSecondary: '='
            },
            replace: true,
            transclude: true,
            template: '<div class="navbar navbar-inverse page-slide">\n    <div class="container row">\n        <div class="col-xs-3 col-sm-3 col-md-2 col-lg-2 no-pad">\n            <div class="btn navbar-btn btn-clear pull-left" ng-show="showBackButton()" ng-click="navigateBack()">\n                <i class="glyphicons {{backButton.icon}}" ng-show="backButton.icon"></i>\n                <span ng-show="backButton.title">&nbsp;{{backButton.title}}</span>\n            </div>\n        </div>\n        <div class="col-xs-6 col-sm-6 col-md-8 col-lg-8 navbar-text">{{ title }}</div>\n        <div class="col-xs-3 col-sm-3 col-md-2 col-lg-2 no-pad">\n            <div class="btn navbar-btn btn-clear pull-right" ng-show="showSecondaryButton()" ng-click="navigateSecondary()">\n                <i class="glyphicons {{secondaryButton.icon}}" ng-show="secondaryButton.icon"></i>\n                <span ng-show="secondaryButton.title">&nbsp;{{secondaryButton.title}}</span>\n            </div>\n            <div class="btn navbar-btn btn-primary pull-right" style="margin-left: 4px;" ng-show="showPrimaryButton()" ng-click="navigatePrimary()">\n                <i class="glyphicons {{primaryButton.icon}}" ng-show="primaryButton.icon"></i>\n                <span ng-show="primaryButton.title">&nbsp;{{primaryButton.title}}</span>\n            </div>\n        </div>\n    </div>\n</div>\n\n',
            controller: ['$scope', '$element', '$attrs', function ($scope, $element, $attrs) {
                $scope.showBackButton = function () {
                    return (typeof $attrs.navigateBack === 'string' && typeof $scope.backButton === 'object');
                };

                $scope.showPrimaryButton = function () {
                    return (typeof $attrs.navigatePrimary === 'string' && typeof $scope.primaryButton === 'object');
                };

                $scope.showSecondaryButton = function () {
                    return (typeof $attrs.navigateSecondary === 'string' && typeof $scope.secondaryButton === 'object');
                };
            }]
        };
    })

});
