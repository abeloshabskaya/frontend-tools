/**
 * Gulp configuration
 */

import gulp from 'gulp';
import imagemin from 'gulp-imagemin';
import changed from 'gulp-changed';
import less from 'gulp-less';
import sourcemaps from 'gulp-sourcemaps';
import plumber from 'gulp-plumber';
import notifier from 'gulp-notifier';
import data from 'gulp-data';
import nunjucks from 'gulp-nunjucks-render';
import webpackStream from 'webpack-stream';


/**
 * Other plugins
 */

import fs from 'fs';
import del from 'del';
import path from 'path';
import {create as bsCreate} from 'browser-sync';

/**
 * Gulp methods
 */

const {dest, series, parallel} = gulp
const bs = bsCreate();

/**
 * Set paths
 */

const DIRS = {
    ROOT : './',
    SRC  : './src',
    DIST : './dist'
}

const PATH = {
    IMAGES : {
        SRC  : `${DIRS.SRC}/images/**/*`,
        DIST : `${DIRS.DIST}/images/`
    },
    CSS : {
        SRC  : `${DIRS.SRC}/css/**/*.css`,
        DIST : `${DIRS.DIST}/css/`
    },
    LESS : {
        SRC : `${DIRS.SRC}/css/**/*.less`,
        ENTRY : `${DIRS.SRC}/css/style.less`
    },
    NJK : {
        JSON : `${DIRS.SRC}/templates/_data/data.json`,
        ENTRY : `${DIRS.SRC}/templates/_templates/`,
        TEMPLATES : `${DIRS.SRC}/templates/_templates/**/*.njk`,
        PAGES : `${DIRS.SRC}/templates/_pages/**/*.njk`,
        DIST : `${DIRS.SRC}`
    },
    // JS : {
    //     SRC  : `${DIRS.SRC}/js/**/*.js`,
    //     DIST : `${DIRS.DIST}/js/`
    // },
    WP : {
        SRC  : `${DIRS.SRC}/js/script.js`,
        DIST : `${DIRS.DIST}/js/`
    }
}

/**
 * Set plugins configuration 
 */

const CONFIG = {
    SERVER : {
        // https://browsersync.io/docs/options
        port: 3333,
        server: {
            baseDir: DIRS.DIST,
            // index: 'login.html', 
            // index: 'main.html',
            index: 'about.html'
        },
        open: false,
        notify: false
    },
    LESS : {
        // https://lesscss.org/usage/#less-options
        rootpath: './',
        relativeUrls: true
    },
    PLUMBER : {
        errorHandler: notifier.error
    },
    NJK : {
        // https://mozilla.github.io/nunjucks/api.html#configure
        path: PATH.NJK.ENTRY,
        envOptions: {
            watch: false,
            trimBlocks: true,
            lstripBlocks: true
        }
    },
    WP : {
        mode: 'development',
        entry : './src/js/script.js',
        output : {
            filename : 'bundle.js',
            path : path.resolve(DIRS.ROOT, './dist/js/')
        }
    }
}

/**
 * Gulp tasks 
 */

// export const example = () => {
//     return gulp
//         .src()
//         .pipe(dest())
// }

export const html = () => {
    return gulp
        .src(PATH.NJK.PAGES)
        .pipe(changed(PATH.NJK.DIST))
        .pipe(plumber(CONFIG.PLUMBER))
        .pipe(data(() => {
            return JSON.parse(fs.readFileSync(PATH.NJK.JSON, 'utf-8'))
        }))
        .pipe(nunjucks(CONFIG.NJK))
        .pipe(dest('./dist'))
}

export const css = () => {
    return gulp
        .src(`${DIRS.SRC}/**/*.css`)
        .pipe(changed('./dist/css'))
        .pipe(dest('./dist'))
}

export const less_css = () => {
    return gulp
        .src(PATH.LESS.ENTRY)
        .pipe(changed(PATH.CSS.DIST))
        .pipe(plumber(CONFIG.PLUMBER))
        .pipe(sourcemaps.init())
        .pipe(less(CONFIG.LESS))
        .pipe(sourcemaps.write())
        .pipe(dest(PATH.CSS.DIST))
}

export const styles = parallel(css, less_css)

export const images = () => {
    return gulp 
        .src(PATH.IMAGES.SRC)
        .pipe(changed(PATH.IMAGES.DIST))
        .pipe(imagemin())
        .pipe(dest(PATH.IMAGES.DIST))
}

// export const js = () => {
//     return gulp
//         .src(PATH.JS.SRC)
//         .pipe(changed(PATH.JS.DIST))
//         .pipe(dest(PATH.JS.DIST))
// }

export const webpack = () => {
    return gulp
        .src(PATH.WP.SRC)
        .pipe(webpackStream(CONFIG.WP))
        .pipe(dest(PATH.WP.DIST));
}

export const build = parallel(
    html,
    styles,
    images,
    // js,
    webpack
)

export const watch = () => {
    bs.init(CONFIG.SERVER);

    gulp.watch([PATH.NJK.TEMPLATES, PATH.NJK.PAGES], html)
        .on('change', bs.reload)

    gulp.watch([PATH.CSS.SRC, PATH.LESS.SRC], styles)
        .on('change', bs.reload)

    gulp.watch([PATH.IMAGES.SRC], images)
        .on('change', bs.reload)

    // gulp.watch([PATH.JS.SRC], js)
    //     .on('change', bs.reload)
    
    gulp.watch([PATH.WP.SRC], webpack)
        .on('change', bs.reload)
}

export const clean = () => {
    return del(`${DIRS.DIST}/*`)
}

export default series(build, watch);