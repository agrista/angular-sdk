var shared = {};
shared.plugins = [
    'karma-mocha',
    'karma-ng-scenario',
    'karma-chrome-launcher',
    'karma-firefox-launcher',
    'karma-safari-launcher',
    'karma-requirejs'
];

shared.frameworks = ['mocha', 'requirejs'];
shared.basePath  = '../';
shared.singleRun = false
shared.autoWatch = true
shared.colors    = true

shared.reporters = ['progress'];
shared.browsers = ['Chrome'];

shared.files = [
    'test/mocha.conf.js',

    //3rd Party Code
    'www/components/angularjs/index.js',

    //App-specific Code
    {
        pattern: 'www/js/app.js',
        included: false
    },
    {
        pattern: 'www/js/**/*.js',
        included: false
    },

    //Test-Specific Code
    'test/test-config.js'
];

shared.exclude = [
    'www/js/config.js'
];

exports.shared = shared;
