'use strict';

define(['app'], function (app) {
    app.lazyLoader.controller('ActivitiesController', ['$rootScope', '$scope', 'navigationService', function($rootScope, $scope, navigationService) {
        $scope.items = [{
            id: 1,
            title: "Learn this template!",
            description: "This is a list-detail template. Learn more about it at its project page!",
            date: new Date(2013, 1, 3)
        }, {
            id: 2,
            title: "Make things",
            description: "Make this look like that",
            date: new Date(2013, 1, 1)
        }, {
            id: 3,
            title: "Move stuff",
            description: "Move this over there",
            date: new Date(2012, 11, 9)
        }, {
            id: 4,
            title: "Move stuff",
            description: "Move this over there",
            date: new Date(2012, 11, 9)
        }, {
            id: 5,
            title: "Move stuff",
            description: "Move this over there",
            date: new Date(2012, 11, 9)
        }, {
            id: 6,
            title: "Move stuff",
            description: "Move this over there",
            date: new Date(2012, 11, 9)
        }, {
            id: 7,
            title: "Move stuff",
            description: "Move this over there",
            date: new Date(2012, 11, 9)
        }, {
            id: 8,
            title: "Move stuff",
            description: "Move this over there",
            date: new Date(2012, 11, 9)
        }, {
            id: 9,
            title: "Move stuff",
            description: "Move this over there",
            date: new Date(2012, 11, 9)
        }, {
            id: 10,
            title: "Move stuff",
            description: "Move this over there",
            date: new Date(2012, 11, 9)
        }, {
            id: 11,
            title: "Move stuff",
            description: "Move this over there",
            date: new Date(2012, 11, 9)
        }, {
            id: 12,
            title: "Move stuff",
            description: "Move this over there",
            date: new Date(2012, 11, 9)
        }, {
            id: 13,
            title: "Move stuff",
            description: "Move this over there",
            date: new Date(2012, 11, 9)
        }, {
            id: 14,
            title: "Move stuff",
            description: "Move this over there",
            date: new Date(2012, 11, 9)
        }, {
            id: 15,
            title: "Move stuff",
            description: "Move this over there",
            date: new Date(2012, 11, 9)
        }, {
            id: 16,
            title: "Move stuff",
            description: "Move this over there",
            date: new Date(2012, 11, 9)
        }, {
            id: 17,
            title: "Move stuff",
            description: "Move this over there",
            date: new Date(2012, 11, 9)
        }, {
            id: 18,
            title: "Move stuff",
            description: "Move this over there",
            date: new Date(2012, 11, 9)
        }, {
            id: 19,
            title: "Move stuff",
            description: "Move this over there",
            date: new Date(2012, 11, 9)
        }, {
            id: 20,
            title: "Move stuff",
            description: "Move this over there",
            date: new Date(2012, 11, 9)
        }, {
            id: 21,
            title: "Move stuff",
            description: "Move this over there",
            date: new Date(2012, 11, 9)
        }];


        // Navigation
        $scope.navbar = {
            title: 'Activities',

            navigateRight: function() {
                navigationService.go('/tasks', 'slide');
            }
        };

        $scope.showItem = function(id) {
            navigationService.go('/tasks', 'modal');
        };
    }]);
});
