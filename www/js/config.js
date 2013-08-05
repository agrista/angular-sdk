console.log('RequireJS started');

requirejs.config({
    shim: {
        'angular': {exports: 'angular'},
        'angular-resource': {deps: ['angular']},
        'angular-mobile': {deps: ['angular']},
        'underscore': {exports: '_'},
        'pouchdb': {exports: 'Pouch'}
    },
    paths: {
        'cordova': '../cordova',
        'angular': '../lib/angularjs/1.1.5/angular',
        'angular-resource': '../lib/angularjs/1.1.5/angular-resource',
        'angular-mobile': '../lib/angularjs/1.1.5/angular-mobile',
        'underscore': '../components/underscore/underscore',
        'watch': '../components/watchjs/src/watch'
    },
    baseUrl: 'js/'
});

requirejs(['cordova', 'angular', 'angular-resource', 'angular-mobile', 'app'], function () {
    console.log('RequireJS loaded');
    /* Phonegap Bootstrap loader */

    document.addEventListener('deviceready', function () {
        console.log('Bootstrap angular');
        angular.bootstrap(document, ['app']);
    }, false);

});
