module.exports = function(grunt) {
    grunt.initConfig({
        concat: {
            sdk: {
                src: ['src/api/*.js', 'src/core/*.js', 'src/helper/*.js', 'src/interface/*.js', 'src/model/**/*.js', 'src/test/*.js', 'src/sdk.js'],
                dest: 'dist/agrista-sdk.js'
            },
            mobilesdk: {
                src: ['src/*/*.js', '!src/core/apiModule.js', 'src/mobile/**/*.js', 'src/model/**/*.js', 'src/mobile-sdk.js'],
                dest: 'dist/agrista-mobile-sdk.js'
            }
        },
        karma: {
            single: {
                configFile: 'test/karma.conf.js',
                singleRun: true
            },
            continuous: {
                configFile: 'test/karma.conf.js',
                autoWatch: true,
                browsers: ['PhantomJS']
            }
        },
        uglify: {
            dist: {
                files: {
                    'dist/agrista-sdk.min.js': ['dist/agrista-sdk.js'],
                    'dist/agrista-mobile-sdk.min.js': ['dist/agrista-mobile-sdk.js']
                }
            }
        },
        obfuscator: {
            build: {
                options: {
                    stringArrayEncoding: true
                },
                files: {
                    'dist/agrista-sdk.obj.js': ['dist/agrista-sdk.min.js'],
                    'dist/agrista-mobile-sdk.obj.js': ['dist/agrista-mobile-sdk.min.js']
                }
            }
        },
        sloc: {
            client: {
                options: {
                    torelant: true
                },
                files: {
                    'dist': ['agrista-sdk.js']
                }
            },
            mobile: {
                options: {
                    torelant: true
                },
                files: {
                    'dist': ['agrista-mobile-sdk.js']
                }
            }
        },
        watch: {
            testbuild: {
                files: ['src/**/*.js', 'test/unit/**/*.js'],
                tasks: ['karma:single', 'concat', 'uglify']
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-obfuscator');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-karma');
    grunt.loadNpmTasks('grunt-sloc');

    grunt.registerTask('build', ['build-min', 'obfuscator']);
    grunt.registerTask('build-min', ['concat', 'uglify']);
    grunt.registerTask('default', ['karma:single','build']);
    grunt.registerTask('unit-test', ['karma:single']);
};