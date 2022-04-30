'use strict';

// node modules
const path = require('path');
const gulp = require('gulp');
const criticalCSS = require('postcss-critical-css');
const mqpacker = require('css-mquery-packer');
const insert = require('gulp-insert');

// gulp modules
const sass = require("gulp-sass")(require('sass'));
const spritesmith = require('gulp.spritesmith');
const postcss = require('gulp-postcss');
const imagemin  = require( 'gulp-imagemin');
const buffer = require('vinyl-buffer');
const browserSync = require('browser-sync');
const cleanCSS = require('gulp-clean-css');
const autoprefixer = require('gulp-autoprefixer');

const paths = {
    root: './',
    build: './dest',
    src: './src/',
    scss_src: './src/scss',
    css_src: './src/css',
    sprites_src: './src/sprites',
    scss_import: './src/scss/import'
}
const config = {
    browserSync: true
}

const date = new Date();

const devTask = exports.dev = gulp.series(makeSprite, runSass, minifyCSS);
exports.sprite = makeSprite;
exports.sass = runSass;
exports.minify = minifyCSS;
exports.watch = gulp.series(devTask, gulp.parallel(watch, runBrowserSync));
exports.default = gulp.series(devTask, gulp.parallel(watch, runBrowserSync));

function watch () {
	gulp.watch('**/*', {cwd: paths.scss_src}, gulp.series(runSass, minifyCSS));
	gulp.watch('**/*', {cwd: paths.sprites_src}, makeSprite);
}

function runBrowserSync (cb) {
	var options = {
		browserSync: {
			server: {
				baseDir: paths.root,
				directory: true
			},
			open: 'external',
		},
	};

	if (config.browserSync) {
		browserSync.init(options.browserSync);
		gulp.watch(paths.src+'**/*.html').on('change',browserSync.reload);
        gulp.watch(paths.scss_src+'**/*.scss').on('change', browserSync.reload);
        gulp.watch(paths.sprites_src+'**/*.png').on('change', browserSync.reload);
	} else {
		cb(null);
	}
}

function runSass() {
    var options = {
        criticalCSS: function () {
            const cssPath = paths.css_src,
                cssName = 'index';
            return {
                outputPath: cssPath,
                outputDest: `${cssName}_dark.css`,
                preserve: false,
                minify: false
            }
        },
    }
    let gulpPipe = gulp.src(path.join(paths.src, 'scss', '*.scss'));

    const makeDarkCSS = (file) => {
		return {
			plugins: [
				criticalCSS(options.criticalCSS()),
			]
		}
	}

    return gulpPipe
        .pipe(sass())
        .pipe(autoprefixer())
        .pipe(postcss(makeDarkCSS))
        .pipe(gulp.dest(path.join(paths.src, 'css')));
}

function makeSprite() {
    var spriteData = gulp.src(path.join(paths.src, 'sprites', '*.png'))
    .pipe(spritesmith({
        imgName: 'sprite.png',
        cssName: '_sprite.scss',
        cssFormat: 'scss',
        padding: 4,
        imgPath: path.join(paths.src, 'img', 'sprite.png')
    }));
    var imgStream = new Promise(function(resolve) {
        spriteData.img
            .pipe(buffer())
            .pipe(imagemin())
            .pipe(gulp.dest(path.join(paths.src, 'img')))
            .on('end',resolve);
    });
    var cssStream = new Promise(function(resolve) {
        spriteData.css
            .pipe(gulp.dest(path.join(paths.src, 'scss', 'sprites')))
            .on('end',resolve);
    });

    return Promise.all([imgStream, cssStream]);
}

function minifyCSS() {
    var options = {
		cleanCSS: {
			'rebase' : false,
			'advanced' : false,           // 속성 병합 false
			'aggressiveMerging': false,   // 속성 병합 false
			'restructuring': false,       // 선택자의 순서 변경 false
			'mediaMerging': false,        // media query 병합 false
			'compatibility': 'ie7,ie8,ie9,*', // IE 핵 남김
		},
		postcss: {
			plugins: [
				mqpacker(),
			]
		}
	};
	return gulp.src(path.join(paths.css_src, '*.css'))
		.pipe(postcss(options.postcss.plugins))
		.pipe(cleanCSS(options.cleanCSS))
		.pipe(insert.append('/* EOF */'))
		.pipe(gulp.dest(path.join(paths.css_src)));
}