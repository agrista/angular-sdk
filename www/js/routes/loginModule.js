'use strict';

define(['app', 'core/authorizationModule'], function (app) {
    app.lazyLoader.controller('LoginController', ['$scope', 'authorization', 'navigationService',
        function ($scope, authorization, navigationService) {
            $scope.user = {
                email: 'ross.savage@agrista.com', //authorization.currentUser.email,
                password: 'changeme'
            };

            $scope.error = {
                submission: false,
                authorization: false,
                message: 'Invalid username and/or password. Please try again'
            }

            $scope.navbar = {
                title: 'Agrista',
                rightButton: {icon: 'check', title: 'Sign in'},
                navigateRight: function () {
                    if($scope.user.email.length > 0 && $scope.user.password.length > 0) {

                        authorization.login($scope.user.email, $scope.user.password).then(function(res) {
                            navigationService.go('/', 'modal', true);
                        }, function(err) {
                            $scope.user.password = '';
                            $scope.error.authorization = true;
                        });

                    } else {
                        $scope.error.submission = true;
                    }
                }
            }
        }]);
});
