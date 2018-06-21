"use strict";

var gulp = require("gulp");
var sass = require("gulp-sass");
var autoprefixer = require("gulp-autoprefixer");
var cssnano = require("gulp-cssnano");
var rename = require("gulp-rename");
var uglify = require("gulp-uglify");
var imagemin = require('gulp-imagemin');
var del = require("del");
var mqpacker = require("css-mqpacker");
var postcss = require("gulp-postcss");
var server = require("browser-sync").create();
var run = require("run-sequence");
var plumber = require("gulp-plumber");
var cache = require('gulp-cache');
var base64 = require('gulp-inline-base64');
var spritesmith = require('gulp.spritesmith');
var merge = require('merge-stream');
var svgstore = require("gulp-svgstore");
var svgmin = require("gulp-svgmin");
var pngquant = require('imagemin-pngquant');
var webstream = require('webpack-stream');
var responsive = require('gulp-responsive-images');
var webpack = require('webpack');


gulp.task("html", function() {
  return gulp.src("src/*.html")
  .pipe(plumber())
  .pipe(gulp.dest("dist"))
  .pipe(server.stream());
});

gulp.task("sass", function() {
  return gulp.src("src/scss/style.scss")
  .pipe(plumber())
  .pipe(sass({
    includePaths: require('node-normalize-scss').includePaths
  }))
   // .pipe(base64({                  //
   //     baseDir: "src/scss/",        //
   //     maxSize: 10 * 1024,         //    sprite!!!
   //    debug: true                 //
   // }))                             //
   .pipe(autoprefixer({
    browsers: ['last 1 version'],
  }))
   .pipe(postcss([
    mqpacker({
      sort: true
    })
    ]))
   .pipe(gulp.dest("dist/css"))
   .pipe(cssnano())
   .pipe(rename("style.min.css"))
   .pipe(gulp.dest("dist/css"))
   .pipe(server.stream());
 });

gulp.task("scripts", function() {
  return gulp.src("src/js/*.js")
  .pipe(plumber())
  .pipe(gulp.dest("dist/js"))
  .pipe(uglify())
  .pipe(rename({ suffix: '.min' }))
  .pipe(gulp.dest("dist/js"))
  .pipe(server.stream());
});

gulp.task("webstream", function() {
  return gulp.src("src/js/app.js")
  .pipe(webstream(require('./webpack.config.js'), webpack))
  .pipe(gulp.dest("dist/js"))
  .pipe(uglify())
  .pipe(rename({ suffix: '.min' }))
  .pipe(gulp.dest("dist/js"))
  .pipe(server.stream());
});

gulp.task("imgs", function() {
  return gulp.src("src/img/*.{jpg,jpeg,png,gif}")
  .pipe(cache(imagemin({
    progressive: true,
    interlaced: true,
    use: [
      pngquant()
    ]
  })))
  .pipe(gulp.dest("dist/img"))
  .pipe(server.stream());
});

gulp.task("svg", function() {
  return gulp.src("src/img/*.svg")
  .pipe(svgmin())
  .pipe(gulp.dest("dist/img"))
  .pipe(server.stream());
});

gulp.task('sprite', function () {
  var spriteData = gulp.src("src/img/sprite/*")
  .pipe(spritesmith({
    imgName: 'sprite.png',
    cssName: 'sprite.scss',
    imgPath: '../img/sprite.png',
  }))
  var imgStream = spriteData.img
  .pipe(gulp.dest('src/img'));
  var cssStream = spriteData.css
  .pipe(gulp.dest('src/scss'));
  return merge(imgStream, cssStream);
});

gulp.task("symbols", function() {
  return gulp.src("src/img/svg/*.svg")
  .pipe(svgmin())
  .pipe(svgstore({
    inlineSvg: true
  }))
  .pipe(rename("symbols.svg"))
  .pipe(gulp.dest("dist/img"));
});

gulp.task("clean", function() {
  return del("dist");
});

gulp.task("copy", function () {
  return gulp.src([
    "src/fonts/**/*",
    ], {
      base: "src"
    })
  .pipe(gulp.dest("dist"))
  .pipe(server.stream());
});

gulp.task("serve", function() {
	server.init({
    server: "dist"
  });
  gulp.watch("src/scss/**/*.scss", ["sass"]);
  gulp.watch("src/*.html", ["html"]);
  //gulp.watch("src/js/*.js", ["scripts"]);  //cdn
  gulp.watch("src/js/*.js", ["webstream"]);
  gulp.watch("src/img/*.{jpg,jpeg,png,gif}", ["imgs"]);
  gulp.watch("src/img/*.svg", ["svg"]);
  gulp.watch("src/fonts/**/*", ["copy"]);
});


gulp.task('responsive', function () {          //запуск вручную
  gulp.src('src/images/*.{png,jreg,jpg}')
  .pipe(responsive({
    '*': [
      {
        width: '50%',
        suffix: '@1x'
      },{
        width: '100%',
        suffix: '@2x'
      }
    ]
  }))
  .pipe(gulp.dest('src/img'));
});


gulp.task("build", function (done) {
	run( "clean", "copy", "html", "sass", "webstream", "imgs", "svg", done);
  //run( "clean", "copy", "html", "sass", "scripts", "imgs", "svg", done); cdn
});

