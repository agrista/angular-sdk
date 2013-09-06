'use strict';

define(['angular'], function () {
    var module = angular.module('signatureModule', []);

    module.directive('signature', ['$compile', function ($compile) {
        return {
            restrict: 'E',
            replace: true,
            template: '<div class="panel panel-default signature"><div class="panel-heading">{{ title }}<div class="btn btn-default btn-sm pull-right" ng-click="reset()">Clear</div></div></div>',
            scope: {
                signed: '=',
                title: '@'
            },
            link: function (scope, element, attrs) {
                var sigElement = $compile('<div class="panel-body"></div>')(scope);

                element.append(sigElement);

                scope.reset = function() {
                    sigElement.jSignature('reset');

                    scope.signed(attrs.id, null);
                };

                sigElement.jSignature({
                    'width': attrs.width,
                    'height': attrs.height,
                    'showUndoButton': false});

                sigElement.bind('change', function() {
                    scope.signed(attrs.id, sigElement.jSignature('getData', 'svgbase64'));
                });
            }
        };
    }]);
});
