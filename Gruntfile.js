'use strict';

module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		watch: {
			scripts: {
				files: [
					'*.js',
					'tests/**/*.feature',
					'tests/**/*.js',
					'**/*.js' 
				],
				tasks: ['clear', 'jshint', 'mochacov:unit', 'mochacov:coverage']
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
    mochacov: {
      unit: {
        options: {
          reporter: 'spec'
        }
      },
      coverage: {
        options: {
          reporter: 'mocha-term-cov-reporter',
          coverage: true
        }
      },
      coveralls: {
        options: {
          coveralls: {
            serviceName: 'travis-ci'
          }
        }
      },
      options: {
        files: 'test/*.js',
        ui: 'bdd',
        colors: true
      }
    }
	}); 

	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-clear');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-mocha-cov');

	grunt.registerTask('test', [
		'jshint', 
		'mochacov:unit', 
		'mochacov:coverage'
	]);
	grunt.registerTask('travis', [
		'jshint', 
		'mochacov:unit', 
		'mochacov:coverage', 
		'mochacov:coveralls'
	]);
	grunt.registerTask('default', 'test');
};