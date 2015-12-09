module.exports = function(config) {
    config.set({
        basePath: '../',
        files: [
            'examples/components/angular/angular.js',
            'examples/components/angular-cookies/angular-cookies.js',
            'examples/components/angular-mocks/angular-mocks.js',
            'examples/components/angular-route/angular-route.js',
            'examples/components/geojson-js-utils/geojson-utils.js',
            'examples/components/moment/moment.js',
            'examples/components/underscore/underscore.js',
            'src/**/*.js',
            'test/unit/**/mocks/mock.js',
            'test/unit/**/mocks/*.js',
            //'test/unit/**/*.js'
            'test/unit/model/frpCalculationModuleSpec.js'
        ],
        autoWatch: true,
        frameworks: ['jasmine'],
        browsers: ['Chrome'],
        plugins: [
            'karma-chrome-launcher',
            //'karma-firefox-launcher',
            'karma-jasmine',
            'karma-junit-reporter',
            'karma-phantomjs-launcher'
        ],
        junitReporter: {
            outputFile: 'results/unit.xml',
            suite: 'unit'
        }
    });
};