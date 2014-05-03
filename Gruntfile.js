'use strict';

module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		watch: {
			scripts: {
				files: [
					'*.js',
					'tests/**/*.feature',
					'tests/**/*.js'
				],
				tasks: ['clear', 'jshint', 'cucumberjs']
			}
		},
		jshint: {
			options: {
				jshintrc: '.jshintrc'
			},
			target: {
				src: '*.js'
			}
		},
		cucumberjs: {
			src: 'tests/features',
			options: {
				steps: 'tests/features/step_definitions'
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-clear');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-cucumber');

	grunt.registerTask('default', ['jshint', 'cucumberjs']);
};