console.log('RequireJS started');

requirejs.config({
    shim: {
        'angular': {exports: 'angular'},
        'angular-resource': {deps: ['angular']},
        'underscore': {exports: '_'},
        'pouchdb': {exports: 'Pouch'}
    },
    paths: {
        'cordova': '../cordova',
        'angular': '../components/angularjs/index',
        'angular-resource': '../lib/angularjs/1.1.5/angular-resource',
        'underscore': '../components/underscore/underscore',
        'pouchdb': '../components/pouchdb/dist/pouchdb-nightly'
    },
    baseUrl: 'js/'
});

requirejs(['cordova', 'angular', 'angular-resource', 'app'], function () {
    console.log('RequireJS loaded');
    /* Phonegap Bootstrap loader */

    document.addEventListener('deviceready', function () {
        console.log('Bootstrap angular');
        angular.bootstrap(document, ['app']);
    }, false);

});
