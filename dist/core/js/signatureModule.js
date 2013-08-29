'use strict';

define(['angular'], function () {
    var module = angular.module('signatureModule', []);

    module.directive('signatureDiv', function () {
        return {
            restrict: 'E',
            scope: {
                signed: '='
            },
            replace: true,
            transclude: true,
            template: '<div><h4>Signature from Farmer</h4><div id="signatureFarmer"></div> <br> <div class="btn" ng-click="resetFarmer()">Reset</div> <h4>Signature from Assessor</h4><div id="signatureAssessor"></div> <br> <div class="btn" ng-click="resetAssessor()">Reset</div> <br> <div class="btn btn-primary" ng-click="submit()">Submit</div></div>',
            controller: ['$scope', '$element', '$attrs', function ($scope, $element, $attrs) {
                $scope.farmerDiv = $('#signatureFarmer');
                $scope.assessorDiv = $('#signatureAssessor');

                $scope.farmerDiv.jSignature({ 'height': 300, 'width': 700, 'UndoButton': false });
                $scope.assessorDiv.jSignature({ 'height': 300, 'width': 700, 'UndoButton': false });

                $scope.resetFarmer = function() {
                    $scope.farmerDiv.jSignature('reset');
                };
                $scope.resetAssessor = function() {
                    $scope.assessorDiv.jSignature('reset');
                };

                $scope.submit = function() {
                    var farmerSignatureData = $scope.farmerDiv.jSignature('getData', 'svgbase64');
                    var assessorSignatureData = $scope.assessorDiv.jSignature('getData', 'svgbase64');
                    $scope.signed(farmerSignatureData, assessorSignatureData);
                };
            }]
        };
    })

});
