'use strict';
var gulp = require('gulp');
var jshint = require('gulp-jshint');
var istanbul = require('gulp-istanbul');
var coveralls = require('gulp-coveralls');
var mocha = require('gulp-spawn-mocha');
var batch = require('gulp-batch');
var jsPaths = ['*.js', 'lib/**/*.js', 'test/**/*.js'];

var test = function(cb) {
  return gulp.src(['lib/**/*.js', 'index.js'])
    .pipe(istanbul())
    .on('finish', function () {
      gulp.src(['test/*.js'])
        .pipe(mocha({reporter: 'spec', istanbul: true}))
        .on('end', cb);
    });
};

var lint = function() {
  return gulp.src(jsPaths)
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'))
    .pipe(jshint.reporter('fail'));
};

gulp.task('default', ['lint', 'test']);

gulp.task('ci', ['lint', 'test', 'coveralls']);

gulp.task('watch', function () {
  gulp.watch(jsPaths, batch(function (events, cb) {
    lint();
    test(function() { cb(); });
  }));
});

gulp.task('lint', function () {
  lint();
});

gulp.task('test', function (cb) {
  test(function() { cb(); });
});

gulp.task('coveralls', ['test'], function () {
  return gulp.src('coverage/lcov.info').pipe(coveralls());
});
