'use strict';

define(['angular', 'angular-animate', 'core/utilityModule'], function () {
    var module = angular.module('navigationModule', ['ngAnimate', 'utilityModule']);

    module.service('navigationService', ['$rootScope', '$location', function ($rootScope, $location) {
        var _transition = undefined;
        var _menuItems = [];

        return {
            menu: function(items) {
                if (items instanceof Array === true) {
                    _menuItems = items;
                }

                return _menuItems;
            },
            go: function (url, type, pop) {
                _transition = {
                    url: url,
                    type: type,
                    push: !pop
                };

                $rootScope.$broadcast('navigation', _transition);

                $location.url(url);
            }
        }
    }]);

    module.directive('pageMenu', function () {
        return {
            restrict: 'E',
            replace: true,
            template: '<div class="sidebar" ng-class="{\'show-menu\': menu.show === true}">\n    <div class="navbar">\n        <div class="container">\n            <p class="navbar-text">{{ menu.title }}</p>\n        </div>\n    </div>\n    <nav class="list-container">\n        <div ng-repeat="section in menu.items">\n        <div class="section-header">{{ section.title }}</div>\n        <ul class="nav">\n            <li ng-repeat="item in section.items">\n                <a ng-click="menu.click($parent.$index, $index)" ng-class="{active: item.active}" stop-propagation>\n                    <span class="glyphicons {{ item.icon }}"></span>\n                    {{ item.title }}\n                </a>\n            </li>\n        </ul>\n        </div>\n    </nav>\n</div>\n'
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
            template: '<div class="page-container" ng-transclude></div>'
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
     *         left-button="{icon: 'remove'}"
     *         navigate-left="navigateLeftFunction"
     *         right-button="{icon: 'ok', title: 'Save'}"
     *         navigate-right="navigateRightFunction"></page-navbar>
     *
     * @param title {string} The navigation bar title
     * @param left-button {object} Left button chrome settings {icon: string, title: string}
     * @param right-button {object} Right button chrome settings {icon: string, title: string}
     * @param navigate-left {function} Function to call on left button click
     * @param navigate-right {function} Function to call on right button click
     */
    module.directive('pageNavbar', function () {
        return {
            restrict: 'E',
            scope: {
                title: '=',
                menuShown: '=',
                leftButton: '=',
                rightButton: '=',
                navigateLeft: '=',
                navigateRight: '='
            },
            replace: true,
            transclude: true,
            template: '<div class="navbar navbar-inverse page-slide">\n    <div class="container">\n        <div class="pull-left" ng-show="showLeftButton()">\n            <div class="btn navbar-btn btn-clear" ng-click="triggerLeftNav()">\n                <i class="glyphicon glyphicon-{{leftButton.icon}}" ng-show="leftButton.icon"></i>\n                <span ng-show="leftButton.title">&nbsp;{{leftButton.title}}</span>\n            </div>\n        </div>\n        <div class="navbar-title"><p class="navbar-text">{{ title }}</p></div>\n        <div class="pull-right" ng-show="showRightButton()">\n            <div class="btn navbar-btn btn-primary" ng-click="triggerRightNav()">\n                <i class="glyphicon glyphicon-{{rightButton.icon}}" ng-show="rightButton.icon"></i>\n                <span ng-show="rightButton.title">&nbsp;{{rightButton.title}}</span>\n            </div>\n        </div>\n    </div>\n</div>\n',
            controller: ['$scope', '$element', '$attrs', function ($scope, $element, $attrs) {
                $scope.triggerLeftNav = function() {
                    $scope.navigateLeft();

                    return true;
                };

                $scope.triggerRightNav = function() {
                    $scope.navigateRight();

                    return true;
                };

                $scope.showLeftButton = function () {
                    return (typeof $attrs.navigateLeft === 'string' && typeof $scope.leftButton === 'object');
                };

                $scope.showRightButton = function () {
                    return (typeof $attrs.navigateRight === 'string' && typeof $scope.rightButton === 'object');
                };
            }]
        };
    })

});
