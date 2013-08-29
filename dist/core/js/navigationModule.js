'use strict';

define(['angular', 'core/utilityModule'], function () {
    var module = angular.module('navigationModule', ['utilityModule']);

    module.controller('NavigationController', ['$scope', 'navigationService', function ($scope, navigationService) {
        $scope.getTransition = navigationService.getCurrentTransition;

        $scope.menu = {
            show: false,
            toggle: function () {
                $scope.menu.show = !$scope.menu.show;

                if($scope.menu.show === true) {
                    $scope.menu.items = navigationService.menu();
                }
            },
            title: 'Agrista',
            click: function(index) {
                $scope.menu.show = false;

                var item = $scope.menu.items[index];

                if (typeof item.click === 'function') {
                    item.click();
                }
            }
        };
    }]);

    module.service('navigationService', ['$location', function ($location) {
        var _transitions = {
            slide: {
                transitionIn: {enter: 'animate slide-enter', leave: 'animate slide-leave'},
                transitionOut: {enter: 'animate slide-reverse-enter', leave: 'animate slide-reverse-leave'}
            },
            modal: {
                transitionIn: {enter: 'animate modal-enter', leave: 'animate modal-leave'},
                transitionOut: {enter: 'animate modal-reverse-enter', leave: 'animate modal-reverse-leave'}
            }
        }

        var _transition = undefined;
        var _menu = [];

        return {
            addTransition: function (name, data) {
                _transitions[name] = data;
            },
            getCurrentTransition: function () {
                return _transition;
            },
            go: function (url, type, reverse) {
                type = type || 'slide';

                _transition = (reverse !== true ? _transitions[type].transitionIn : _transitions[type].transitionOut);

                $location.path(url);
            },
            menu: function(items) {
                if(items !== undefined) {
                    _menu = items;
                }

                return _menu;
            }
        }
    }]);

    module.directive('navigationMenu', function () {
        return {
            restrict: 'E',
            replace: true,
            template: '<div id="nav-menu" ng-class="{\'show-menu\': menu.show === true}">\n    <div class="navbar">\n        <div class="container">\n            <p class="navbar-text">{{ menu.title }}</p>\n        </div>\n    </div>\n    <nav class="list-container">\n        <ul class="nav">\n            <li ng-repeat="item in menu.items">\n                <a ng-click="menu.click($index)" ng-class="{active: item.active}" stop-propagation>{{ item.title }}</a>\n            </li>\n        </ul>\n    </nav>\n</div>'
        };
    });

    module.directive('navigationPage', function () {
        return {
            restrict: 'E',
            replace: true,
            template: '<div id="nav-page" class="page-slide" ng-class="{\'show-menu\': menu.show === true}">\n    <div class="container" ng-transclude></div>\n</div>',
            transclude: true,
            controller: function($scope) {
                window.$scope = $scope;
            }
        };
    });

    module.directive('toolBar', function () {
        return {
            restrict: 'E',
            replace: true,
            template: '<div class="toolbar page-slide" ng-class="{\'show-menu\': menu.show === true}">\n    <div class="container" ng-transclude></div>\n</div>',
            transclude: true
        };
    });

    /**
     * Setup the navigation-bar directive. Directive injects the navigation-bar template and provides a button interface.
     * When no navigate-left or navigate-right function is provided then the button is hidden.
     * <navigation-bar title="Navbar title"
     *         left-button="{icon: 'remove'}"
     *         navigate-left="navigateLeftFunction"
     *         right-button="{icon: 'ok', title: 'Save'}"
     *         navigate-right="navigateRightFunction"></navigation-bar>
     *
     * @param title {string} The navigation bar title
     * @param left-button {object} Left button chrome settings {icon: string, title: string}
     * @param right-button {object} Right button chrome settings {icon: string, title: string}
     * @param navigate-left {function} Function to call on left button click
     * @param navigate-right {function} Function to call on right button click
     */
    module.directive('navigationBar', function () {
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
            template: '<div class="navbar navbar-inverse page-slide" ng-class="{\'show-menu\': menuShown === true}" ng-transclude>\n    <div class="container">\n        <div class="pull-left" ng-show="showLeftButton()">\n            <div class="btn navbar-btn btn-clear" ng-click="triggerLeftNav()">\n                <i class="glyphicon glyphicon-{{leftButton.icon}}" ng-show="leftButton.icon"></i>\n                <span ng-show="leftButton.title">&nbsp;{{leftButton.title}}</span>\n            </div>\n        </div>\n        <p class="navbar-text">{{ title }}</p>\n        <div class="pull-right" ng-show="showRightButton()">\n            <div class="btn navbar-btn btn-primary" ng-click="triggerRightNav()">\n                <i class="glyphicon glyphicon-{{rightButton.icon}}" ng-show="rightButton.icon"></i>\n                <span ng-show="rightButton.title">&nbsp;{{rightButton.title}}</span>\n            </div>\n        </div>\n    </div>\n</div>\n',
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
                    return (typeof $scope.leftButton !== undefined);
                };

                $scope.showRightButton = function () {
                    return (typeof $scope.rightButton !== undefined);
                };
            }]
        };
    })

});
