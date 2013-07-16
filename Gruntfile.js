'use strict';
var cordova = require('cordova');
var util = require('./test/lib/karma-util.js');

module.exports = function (grunt) {
    // load all grunt tasks
    require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

    // configurable paths
    var yeomanConfig = {
        app: 'www'
    };

    try {
        yeomanConfig.app = require('./component.json').appPath || yeomanConfig.app;
    } catch (e) {
    }

    var device = {
        platform: grunt.option('platform') || 'all',
        family: grunt.option('family') || 'default',
        target: grunt.option('target') || 'emulator'
    };

    grunt.initConfig({
        yeoman: yeomanConfig,
        test: {
            unit: './test/karma-unit.conf.js',
            midway: './test/karma-midway.conf.js',
            e2e: './test/karma-e2e.conf.js'
        },
        watchfiles: {
            all: [
                'www/*.*',
                'www/partials/{,*/}*.html',
                'www/js/{,*/,*/}*.js',
                'www/css/{,*/}*.css',
                'www/lib/{,**/,*/}css/*.css',
                'www/lib/{,**/,*/}less/*.less',
                'www/img/{,*/}*.{png,jpg,jpeg,gif,webp,svg}'
            ]
        },
        jshint: {
            gruntfile: ['Gruntfile.js'],
            files: ['www/**/*.js', 'test/**/*.js'],
            options: {
                // options here to override JSHint defaults
                globals: {
                    console: true,
                    module: true
                }
            }
        },
        watch: {
            less: {
                files: ['www/lib/{,**/,*/}less/*.less'],
                tasks: ['less']
            },
            liveserve: {
                options: {
                    livereload: true
                },
                files: ['<%=watchfiles.all %>'],
                tasks: ['less', 'cordova-prepare']
            },
            liveripple: {
                options: {
                    livereload: true
                },
                files: ['<%=watchfiles.all %>'],
                tasks: ['less', 'cordova-prepare']
            },
            liveemulate: {
                files: ['<%=watchfiles.all %>'],
                tasks: ['cordova-emulate-end', 'less', 'cordova-buildemulate']
            }
        },
        less: {
            development: {
                files: {
                    'www/lib/bootstrap/3.0.0/css/bootstrap.css': "www/lib/bootstrap/3.0.0/less/bootstrap.less",
                    'www/lib/bootstrap-glyphicons/css/bootstrap-glyphicons.css': "www/lib/bootstrap-glyphicons/less/bootstrap-glyphicons.less"
                }
            }
        },
        shell: {
            iossimstart: {
                command: 'ios-sim launch platforms/ios/build/AgristaCore.app --exit' + (device.family !== 'default' ? ' --family ' + device.family : ''),
                options: {
                    stdout: true
                }
            },
            iossimend: {
                command: 'killall -9 "iPhone Simulator"'
            },
            serveend: {
                command: 'killall -9 "cordova serve"'
            },
            rippleend: {
                command: 'killall -9 "cordova ripple"'
            }
        }
    });


    // Testing Tasks
    grunt.registerMultiTask('test', 'Run and watch the unit tests with Karma', function() {
        util.startKarma.call(util, this.data, true, this.async());
    });


    // Cordova Tasks
    grunt.registerTask('cordova-prepare', 'Cordova prepare tasks', function () {
        var done = this.async();

        if (device.platform === 'all') {
            // Prepare all platforms
            cordova.prepare(done);
        } else {
            cordova.prepare(device.platform, done);
        }
    });

    grunt.registerTask('cordova-build', 'Cordova building tasks', function () {
        var done = this.async();

        if (device.platform === 'all') {
            // Build all platforms
            cordova.build(done);
        } else {
            cordova.build(device.platform, done);
        }
    });

    grunt.registerTask('cordova-emulate', 'Cordova emulation tasks', function () {
        var done = this.async();

        if (device.platform === 'all') {
            // Emulate all platforms
            cordova.emulate();
        } else {
            if (device.platform === 'ios') {
                grunt.task.run('shell:iossimstart');
            } else {
                cordova.emulate(device.platform, function() {
                    grunt.task.run('cordova-emulate-end');
                });
            }
        }

        done();
    });

    grunt.registerTask('cordova-serve', 'Cordova serve tasks', function () {
        var done = this.async();

        if (device.platform === 'all') {
            // Emulate all platforms
            grunt.fatal("Platform required. Eg. ` --platform=ios`");
        } else {
            cordova.serve(device.platform);
            done();
        }
    });

    grunt.registerTask('cordova-ripple', 'Cordova ripple tasks', function () {
        var done = this.async();

        if (device.platform === 'all') {
            // Emulate all platforms
            grunt.fatal("Platform required. Eg. ` --platform=ios`");
        } else {
            cordova.ripple(device.platform);
            done();
        }
    });

    grunt.registerTask('cordova-emulate-end', 'Cordova emulation tasks', function () {
        if (device.platform === 'all' || device.platform === 'ios') {
            grunt.task.run('shell:iossimend');
        }
    });

    grunt.registerTask('cordova-buildemulate', [
        'cordova-build',
        'cordova-emulate'
    ]);

    grunt.registerTask('cordova-prepareserve', [
        'cordova-prepare',
        'cordova-serve'
    ]);

    grunt.registerTask('serve', ['cordova-prepareserve', 'watch:liveserve'])
    grunt.registerTask('ripple', ['cordova-prepare', 'cordova-ripple', 'watch:liveripple'])
    grunt.registerTask('emulate', ['cordova-buildemulate']);
    grunt.registerTask('liveemulate', ['cordova-buildemulate', 'watch:liveemulate'])

    grunt.registerTask('default', ['test']);
};