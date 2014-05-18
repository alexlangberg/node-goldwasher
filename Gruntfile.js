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
				tasks: ['clear', 'jshint', 'mochacov:test']
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
	    coverage: {
	      options: {
	        coveralls: true
	      }
	    },
	    test: {
		    options: {
		      reporter: 'spec',
		      require: ['chai']
		    }
	    },
	    options: {
	    	files: 'test/*.js'
	    }
	  }
	});

	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-clear');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-mocha-cov');

	grunt.registerTask('default', ['jshint', 'mochacov:coverage']);
	grunt.registerTask('travis', ['mochacov:coverage']);
	grunt.registerTask('test', ['mochacov:test']);
};