var gulp = require("gulp");
var sass = require("gulp-sass");
var browserSync = require("browser-sync").create();
var gulpIf = require('gulp-if');
var terser = require('gulp-terser');
var cssminify = require('gulp-clean-css');
var htmlmin = require('gulp-htmlmin');
var rename = require('gulp-rename');
var del = require('del');
var wait = require('gulp-wait');

gulp.task('hello', function() {
 return console.log('gulp is running');
});
gulp.task("sass", function(callback) {
  return gulp
    .src("src/public/css/sass/themes/*.scss") // compile sass
    .pipe(wait(300))
    .pipe(sass())
    .pipe(gulp.dest("src/public/css"))        // destination
    .pipe(cssminify({zindex: false}))         // min css
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest("src/public/css"))        // destination
    .pipe(gulp.dest("src/public/dist/css"));  // destination
});

gulp.task("browserSync", function(callback) {
  browserSync.init({
    server: {
      baseDir: "src/resources/views/me"
    },
    startPath: "Blank.Page.hbs"
  });
  callback();
});

gulp.task("watch", function(callback) {
  gulp.watch("src/public/css/sass/**/*.scss", gulp.series("sass", "reload"));
  gulp.watch("src/public/js/**/*.js", gulp.series("reload"));
  // gulp.watch("src/public/*.html", gulp.series("reload"));
  callback();
});

gulp.task("reload", function(callback) {
  browserSync.reload();
  callback();
});


gulp.task("minifyjs", function(callback) {
  return gulp.src('src/public/js/**/*')
  .pipe(gulpIf('*.js', terser()))
  .pipe(gulp.dest('src/public/dist/js'))
});

gulp.task("minifycss", function(callback) {
  return gulp.src('src/css/**/*')
  .pipe(gulpIf('*.css', cssminify({zindex: false})))
  .pipe(gulp.dest('dist/css'))
});

gulp.task("minifyhtml", function(callback) {
  return gulp.src('src/*.html')
  .pipe(htmlmin({ collapseWhitespace: true }))
  .pipe(gulp.dest('dist'))
});

gulp.task('images', function(callback){
  return gulp.src('src/img/**/*.+(png|jpg|gif|svg)')
  .pipe(gulp.dest('dist/img'))
});

gulp.task('font', function(callback) {
  return gulp.src('src/font/**/*')
  .pipe(gulp.dest('dist/font'))
});

gulp.task('clean:dist', function(callback) {
  return del('dist');
})

// gulp.task('default', function (callback) {
//   runSequence(['sass','browserSync', 'watch'],
//     callback
//   )
// })

// gulp.task('build', function (callback) {
//   runSequence('clean:dist', 'sass',
//     ["minifyjs", "minifycss", "minifyhtml", "images", 'font'],
//     callback
//   )
// })

gulp.task('default', gulp.series('sass', gulp.parallel('browserSync', 'watch')));
gulp.task('build', gulp.series('clean:dist', 'sass', gulp.parallel('minifyjs', "minifycss", "minifyhtml", "images", 'font')));
