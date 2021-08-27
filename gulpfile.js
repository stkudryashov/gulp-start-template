let project_folder = 'dist';
let source_folder = 'src';

let path = {
    build: {
        js: project_folder + '/js/',
        css: project_folder + '/css/',
        img: project_folder + '/img/',
        html: project_folder + '/',
        fonts: project_folder + '/fonts',
    },
    src: {
        js: source_folder + '/js/script.js',
        css: source_folder + '/scss/style.scss',
        img: source_folder + '/img/**/*.{jpg, png, svg, gif, ico, webp}',
        html: [source_folder + '/*.html', '!' + source_folder + '/_*.html'],
        fonts: source_folder + '/fonts/*.ttf',
    },
    watch: {
        js: source_folder + '/js/**/*.js',
        css: source_folder + '/scss/**/*.scss',
        img: source_folder + '/img/**/*.{jpg, png, svg, gif, ico, webp}',
        html: source_folder + '/**/*.html',
        fonts: source_folder + '/fonts/*.ttf',
    },
    clean: './' + project_folder + '/'
}

let { src, dest } = require('gulp'),
    gulp = require('gulp'),
    browsersync = require('browser-sync').create(),
    fileinclude = require('gulp-file-include'),
    del = require('del'),
    scss = require('gulp-sass')(require('sass')),
    autoprefixer = require('gulp-autoprefixer'),
    group_media = require('gulp-group-css-media-queries'),
    clean_css = require('gulp-clean-css'),
    rename = require('gulp-rename'),
    uglify = require('gulp-uglify-es').default,
    imagemin = require('gulp-imagemin'),
    webp = require('gulp-webp'),
    webphtml = require('gulp-webp-html'),
    webpcss = require('gulp-webpcss'),
    svgsprite = require('gulp-svg-sprite'),
    ttf2woff = require('gulp-ttf2woff'),
    ttf2woff2 = require('gulp-ttf2woff2');

let fs = require('fs')

function browserSync(params) {
    browsersync.init({
        server: {
            baseDir: './' + project_folder + '/'
        },
        port: 3000,
        notify: false
    })
}

function js() {
    return src(path.src.js)
        .pipe(fileinclude())
        .pipe(dest(path.build.js))
        .pipe(uglify())
        .pipe(
            rename({
                extname: '.min.js'
            })
        )
        .pipe(dest(path.build.js))
        .pipe(browsersync.stream())
}

function css() {
    return src(path.src.css)
        .pipe(
            scss({
                outputStyle: 'expanded'
            })
        )
        .pipe(group_media())
        .pipe(
            autoprefixer({
                overrideBrowserslist: ['last 5 versions'],
                cascade: true
            })
        )
        .pipe(webpcss())
        .pipe(dest(path.build.css))
        .pipe(clean_css())
        .pipe(
            rename({
                extname: '.min.css'
            })
        )
        .pipe(dest(path.build.css))
        .pipe(browsersync.stream())
}

function img() {
    return src(path.src.img)
        .pipe(
            webp({
                quality: 70
            })
        )
        .pipe(dest(path.build.img))
        .pipe(src(path.src.img))
        .pipe(
            imagemin({
                progressive: true,
                svgoPlugins: [{ removeViewBox: false }],
                interlaced: true,
                optimizationLevel: 3
            })
        )
        .pipe(dest(path.build.img))
        .pipe(browsersync.stream())
}

function html() {
    return src(path.src.html)
        .pipe(fileinclude())
        .pipe(webphtml())
        .pipe(dest(path.build.html))
        .pipe(browsersync.stream())
}

function fonts(params) {
    src(path.src.fonts)
        .pipe(ttf2woff())
        .pipe(dest(path.build.fonts))
    return src(path.src.fonts)
        .pipe(ttf2woff2())
        .pipe(dest(path.build.fonts))
}

gulp.task('svgsprite', function () {
    return gulp.src([source_folder + '/icons/*.svg'])
        .pipe(svgsprite({
            mode: {
                stack: {
                    sprite: '../icons/icons.svg'
                }
            }
        }))
        .pipe(dest(path.build.img))
})

function fontsStyle(params) {
    let file_content = fs.readFileSync(source_folder + '/scss/fonts.scss');
    if (file_content == '') {
        fs.writeFile(source_folder + '/scss/fonts.scss', '', callback);
        return fs.readdir(path.build.fonts, function (err, items) {
            if (items) {
                let c_fontname;
                for (var i = 0; i < items.length; i++) {
                    let fontname = items[i].split('.');
                    fontname = fontname[0];
                    if (c_fontname != fontname) {
                        fs.appendFile(
                            source_folder + '/scss/fonts.scss',
                            '@include font("' + fontname + '", "' + fontname
                            + '", "400", "normal");\r\n', callback);
                    }
                    c_fontname = fontname;
                }
            }
        })
    }
}

function callback() { }

function watchFiles(params) {
    gulp.watch([path.watch.js], js);
    gulp.watch([path.watch.css], css);
    gulp.watch([path.watch.img], img);
    gulp.watch([path.watch.html], html);
}

function clean(params) {
    return del(path.clean)
}

let build = gulp.series(clean, gulp.parallel(js, css, img, html, fonts), fontsStyle);
let watch = gulp.parallel(build, watchFiles, browserSync);

exports.js = js;
exports.css = css;
exports.img = img;
exports.html = html;
exports.fonts = fonts;

exports.fontsStyle = fontsStyle

exports.build = build;
exports.watch = watch;
exports.default = watch;
