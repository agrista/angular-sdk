var tests = Object.keys(window.__karma__.files).filter(function (file) {
    return /\.spec\.js$/.test(file);
});

console.log(tests);

requirejs.config({
    // Karma serves files from '/base'
    baseUrl: '/base/www/js',

    shim: {
        'angular': {
            exports: 'angular'
        }
    },

    paths: {
        'cordova': '../cordova',
        'angular': '../components/angularjs/index'
    },

    // ask Require.js to load these files (all our tests)
    deps: tests,

    // start test run, once Require.js is done
    callback: window.__karma__.start
});