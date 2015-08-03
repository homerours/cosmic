var gulp = require('gulp');
var gutil = require('gulp-util');
var bower = require('bower');
var concat = require('gulp-concat');
var sass = require('gulp-sass');
var minifyCss = require('gulp-minify-css');
var rename = require('gulp-rename');
var sh = require('shelljs');
var inject = require('gulp-inject');
var templateCache = require('gulp-angular-templatecache');

var paths = {
    sass: ['./scss/**/*.scss'],
    javascript:[
        './www/js/**/*.js']
};

gulp.task('default', ['sass','injection','generate:cache']);

// Javascript includes
gulp.task('injection',function(){
    return gulp.src('./www/index.html')
    .pipe(inject(gulp.src(paths.javascript, {read: false}), {relative: true}))
    .pipe(gulp.dest('./www'));
});

// Template Cache
gulp.task('generate:cache', function () {
    gulp.src('www/templates/**/*.html')
    .pipe(templateCache({
        module: 'cosmic',
        root: 'templates/'
    }))
    .pipe(gulp.dest('www/js'));
});

// SASS compilation
gulp.task('sass', function(done) {
    gulp.src('./scss/ionic.app.scss')
    .pipe(sass({
        errLogToConsole: true
    }))
    .pipe(gulp.dest('./www/css/'))
    .pipe(minifyCss({
        keepSpecialComments: 0
    }))
    .pipe(rename({ extname: '.min.css' }))
    .pipe(gulp.dest('./www/css/'))
    .on('end', done);
});

gulp.task('watch', function() {
    gulp.watch(paths.sass, ['sass']);
    gulp.watch('./www/templates/**/*.html', ['generate:cache']);
});

gulp.task('install', ['git-check'], function() {
    return bower.commands.install()
    .on('log', function(data) {
        gutil.log('bower', gutil.colors.cyan(data.id), data.message);
    });
});

gulp.task('git-check', function(done) {
    if (!sh.which('git')) {
        console.log(
            '  ' + gutil.colors.red('Git is not installed.'),
            '\n  Git, the version control system, is required to download Ionic.',
            '\n  Download git here:', gutil.colors.cyan('http://git-scm.com/downloads') + '.',
            '\n  Once git is installed, run \'' + gutil.colors.cyan('gulp install') + '\' again.'
        );
        process.exit(1);
    }
    done();
});
