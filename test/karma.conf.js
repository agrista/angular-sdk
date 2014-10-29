module.exports = function(config) {
    config.set({
        basePath: '../',
        files: [
            'examples/components/angular/angular.js',
            'examples/components/angular-cookies/angular-cookies.js',
            'examples/components/angular-mocks/angular-mocks.js',
            'examples/components/angular-route/angular-route.js',
            'src/**/*.js',
            'test/unit/**/*.js'
        ],
        autoWatch: true,
        frameworks: ['jasmine'],
        browsers: ['Chrome'],
        plugins: [
            'karma-chrome-launcher',
            'karma-firefox-launcher',
            'karma-jasmine',
            'karma-junit-reporter'
        ],
        junitReporter: {
            outputFile: 'results/unit.xml',
            suite: 'unit'
        }
    });
};