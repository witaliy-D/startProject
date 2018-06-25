'use strict';

const gulp = require('gulp'),
      sass = require('gulp-sass'),
      autoprefixer = require('gulp-autoprefixer'),
      cssnano = require('gulp-cssnano'),
      rename = require('gulp-rename'),
      uglify = require('gulp-uglify'),
      imagemin = require('gulp-imagemin'),
      del = require('del'),
      mqpacker = require('css-mqpacker'),
      postcss = require('gulp-postcss'),
      server = require('browser-sync').create(),
      run = require('run-sequence'),
      plumber = require('gulp-plumber'),
      base64 = require('gulp-inline-base64'),
      spritesmith = require('gulp.spritesmith'),
      merge = require('merge-stream'),
      svgstore = require('gulp-svgstore'),
      pngquant = require('imagemin-pngquant'),
      webstream = require('webpack-stream'),
      responsive = require('gulp-responsive-images'),
      webpack = require('webpack'),
      cheerio = require('gulp-cheerio'),
      replace = require('gulp-replace'),
      svgmin = require ('gulp-svgmin'),
      cache = require('gulp-cache');

gulp.task('clean', function() {
  return del('dist');
});

gulp.task('html', function() {
  return gulp.src('src/*.html')
  .pipe(plumber())
  .pipe(gulp.dest('dist'))
  .pipe(server.stream());
});

gulp.task('sass', function() {
  return gulp.src('src/scss/style.scss')
  .pipe(plumber())
  .pipe(sass({
    includePaths: require('node-normalize-scss').includePaths
  }))
   // .pipe(base64({                  //
   //     baseDir: 'src/scss/',        //
   //     maxSize: 10 * 1024,         //    sprite!!!
   //    debug: true                 //
   // }))                             //
  .pipe(autoprefixer({
    browsers: ['last 2 versions'],
  }))
  .pipe(postcss([
    mqpacker({
      sort: true
    })
  ]))
  .pipe(gulp.dest('dist/css'))
  .pipe(cssnano())
  .pipe(rename('style.min.css'))
  .pipe(gulp.dest('dist/css'))
  .pipe(server.stream());
});

gulp.task('fonts', function () {
  return gulp.src(['src/fonts/**/*'], {base: 'src'})
  .pipe(gulp.dest('dist'))
  .pipe(server.stream());
});

gulp.task('scripts', function() {
  return gulp.src('src/js/*.js')
  .pipe(plumber())
  .pipe(gulp.dest('dist/js'))
  .pipe(uglify())
  .pipe(rename({ suffix: '.min' }))
  .pipe(gulp.dest('dist/js'))
  .pipe(server.stream());
});                                //cdn

gulp.task('webStream', function() {
  return gulp.src('src/js/app.js')
  .pipe(webstream(require('./webpack.config.js'), webpack))
  .pipe(gulp.dest('dist/js'))
  .pipe(uglify())
  .pipe(rename({ suffix: '.min' }))
  .pipe(gulp.dest('dist/js'))
  .pipe(server.stream());
});

gulp.task('sprite', function () {
  const spriteData = gulp.src('src/img/sprite/*')
  .pipe(imagemin([
    imagemin.jpegtran({progressive: true}),
    pngquant()
  ]))
  .pipe(spritesmith({
    imgName: 'sprite.png',
    cssName: 'sprite.scss',
    imgPath: '../img/sprite.png',
    padding: 1
  }))
  const imgStream = spriteData.img
  .pipe(gulp.dest('dist/img'))
  .pipe(gulp.dest('src/img'));
  const cssStream = spriteData.css
  .pipe(gulp.dest('src/scss'));
  return merge(imgStream, cssStream);
});

gulp.task('imgs', function() {
  return gulp.src(['src/img/*.{png,jpg,jpeg}', '!src/img/sprite.png'])
  .pipe(imagemin([
    imagemin.jpegtran({progressive: true}),
    pngquant()
  ]))
  .pipe(gulp.dest('dist/img'))
});

gulp.task('svg', function() {
  return gulp.src(['src/img/*.svg', '!src/img/symbols.svg'])
  .pipe(svgmin({
    plugins: [
      {removeDimensions: true}
    ]
  }))
  .pipe(gulp.dest('dist/img'))
});

gulp.task('bgSvg', function() {
  return gulp.src('src/img/bg-svg/*.svg')
  .pipe(imagemin([
  imagemin.svgo({
      plugins: [
        {removeViewBox: true},
        {removeTitle: false},
      ]
    })
  ]))
  .pipe(gulp.dest('dist/img/bg-svg'))
});

gulp.task('symbols', function() {
  return gulp.src('src/img/symbols/*.svg')
  .pipe(svgmin())
  .pipe(svgstore({
    inlineSvg: true
  }))
  .pipe(cheerio({
    run: function ($) {
      $('[fill]').removeAttr('fill');
      $('[stroke]').removeAttr('stroke');
      $('[style]').removeAttr('style');
      $('svg').attr('style', 'display:none');
    },
    parserOptions: {xmlMode: true}
  }))
  .pipe(replace('&gt;', '>'))
  .pipe(rename('symbols.svg'))
  .pipe(gulp.dest('dist/img'));
});

gulp.task('copySymbols', function() {
  return gulp.src('src/img/symbols/*.svg')
  .pipe(svgmin({
    js2svg: {
      pretty: true
    }
  }))
  .pipe(svgstore({
    inlineSvg: true
  }))
  .pipe(cheerio({
    run: function ($) {
      $('[fill]').removeAttr('fill');
      $('[stroke]').removeAttr('stroke');
      $('[style]').removeAttr('style');
      $('svg').attr('style', 'display:none');
    },
    parserOptions: {xmlMode: true}
  }))
  .pipe(replace('&gt;', '>'))
  .pipe(rename('symbols.svg'))
  .pipe(gulp.dest('src/img'));
});

gulp.task('cleanImgs', function() {
  return del('dist/img');
});

gulp.task('allImages', function (done) {
  run('cleanImgs', 'symbols', 'copySymbols', 'svg', 'bgSvg', 'imgs', 'sprite', done)
});

gulp.task('imagesWatch', ['allImages'], function (done) {
    server.reload();
    done();
});

//таск для очистки кэша при проблемах с картинками, запуск вручную
gulp.task('clear', function () {
  return cache.clearAll();
});

gulp.task('serve', function() {
	server.init({
    server: 'dist'
  });
  gulp.watch('src/scss/**/*.scss', ['sass']);
  gulp.watch('src/*.html', ['html']);
  //gulp.watch('src/js/*.js', ['scripts']);
  gulp.watch('src/js/*.js', ['webStream']);
  gulp.watch(['src/img/**/*', '!src/img/symbols.svg', '!src/img/sprite.png'], ['imagesWatch']);
  gulp.watch('src/fonts/**/*', ['fonts']);
});


gulp.task('responsive', function () {          //запуск вручную
  gulp.src('src/images/*.{png,jreg,jpg}')
  .pipe(responsive(require('./responsiveConfig.js')))
  .pipe(gulp.dest('src/img'));
});


gulp.task('build', function (done) {
	run('clean', 'fonts', 'sprite', 'symbols', 'copySymbols', 'html', 'sass', 'webStream', 'imgs', 'svg', 'bgSvg', done);
  //run('clean', 'fonts', 'sprite', 'symbols', 'copySymbols', 'html', 'sass', 'scripts', 'imgs', 'svg', 'bgSvg', done);
});

