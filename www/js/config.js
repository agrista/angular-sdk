console.log('RequireJS started');

requirejs.config({
    shim: {
        'angular': {exports: 'angular'},
        'angular-mobile': {deps: ['angular']},
        'underscore': {exports: '_'}
    },
    paths: {
        'cordova': '../cordova',
        'angular': '../lib/angularjs/1.1.5/angular',
        'angular-resource': '../lib/angularjs/1.1.5/angular-resource',
        'angular-mobile': '../lib/angularjs/1.1.5/angular-mobile',
        'underscore': '../components/underscore/underscore'
    },
    baseUrl: 'js/'
});

requirejs(['cordova', 'angular', 'angular-mobile', 'app'], function () {
    console.log('RequireJS loaded');
    /* Phonegap Bootstrap loader */

    document.addEventListener('deviceready', function () {
        console.log('Bootstrap angular');
        angular.bootstrap(document, ['app']);
    }, false);

});
