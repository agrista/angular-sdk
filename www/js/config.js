console.log('RequireJS started');

requirejs.config({
    shim: {
        angular: {
            exports: 'angular'
        }
    },
    paths: {
        'cordova': '../cordova',
        'angular': '../components/angularjs/index',
        'utilServices': 'utilServices',
        'interfaceServices': 'phonegapServices'
    },
    baseUrl: 'js/'
});

requirejs(['cordova', 'angular', 'app'], function () {
    console.log('RequireJS loaded');
    /* Phonegap Bootstrap loader */

    document.addEventListener('deviceready', function () {
        console.log('Bootstrap angular');
        angular.bootstrap(document, ['app']);
    }, false);

});
