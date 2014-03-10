module.exports = function(grunt) {
    grunt.initConfig({
        concat: {
            sdk: {
                src: ['src/core/*.js', 'src/helper/*.js', 'src/interface/*.js', 'src/sdk.js'],
                dest: 'dist/agrista-sdk.js'
            },
            mobilesdk: {
                src: ['src/*/*.js', '!src/core/apiModule.js', 'src/mobile/*/*.js', 'src/mobile-sdk.js'],
                dest: 'dist/agrista-mobile-sdk.js'
            }
        },
        uglify: {
            dist: {
                files: {
                    'dist/agrista-sdk.min.js': ['dist/agrista-sdk.js'],
                    'dist/agrista-mobile-sdk.min.js': ['dist/agrista-mobile-sdk.js']
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');

    grunt.registerTask('default', ['concat', 'uglify']);

};