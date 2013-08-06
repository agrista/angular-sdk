'use strict';

define(['angular'], function () {
    var module = angular.module('navigationModule', []);

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
            title: 'Menu',
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
            templateUrl: 'partials/core/navigationMenu.html'
        };
    });

    module.directive('navigationPage', function () {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: 'partials/core/navigationPage.html',
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
                title: '@',
                menuShown: '=',
                leftButton: '&',
                rightButton: '&',
                navigateLeft: '=',
                navigateRight: '='
            },
            replace: true,
            templateUrl: 'partials/core/navigationBar.html',
            controller: ['$scope', '$element', '$attrs', function ($scope, $element, $attrs) {
                $scope.leftButton = $scope.leftButton();
                $scope.rightButton = $scope.rightButton();

                $scope.showLeftButton = function () {
                    return (typeof $attrs.navigateLeft === 'string');
                }

                $scope.showRightButton = function () {
                    return (typeof $attrs.navigateRight === 'string');
                }
            }]
        };
    })

});
