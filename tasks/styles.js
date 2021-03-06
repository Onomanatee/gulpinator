const gulp          = require('gulp'),
      gutil         = require('gulp-util'),
      sourcemaps    = require('gulp-sourcemaps'),
      sass          = require('gulp-sass'),
      concat        = require('gulp-concat'),
      rename        = require('gulp-rename'),
      autoprefixer  = require('gulp-autoprefixer'),
      cleanCSS      = require('gulp-clean-css'),
      gulpif        = require('gulp-if'),
      browsersync   = require('browser-sync'),
      config        = require('../utilities/getConfig').getConfig(),
      utility       = require('../utilities/utility');

const NAME = require('../utilities/taskNames').styles;
const defaultOptions = {
  sourcemaps: false,
  hash: ''
};



const createSassStreamConfig = function(file) {
  // Either get the options for the file as defined in the config, or use
  // the default.
  let options = defaultOptions;
  if (file.options) {
    options = Object.create(file.options);
  }

  options.dest = utility.getCorrectDest(file);

  // Add a suffix to the resulting file, depending on cache busting.
  options.suffix = options.hash ? '.' + options.hash : '';

  gutil.log(gutil.colors.blue(options.dest));
  return options;
};

/**
 * createCompileSassStream
 * Creates a gulp stream for bundling css files.
 * This stream handles:
 * - compilation of sass to .css
 * - autoprefixing css properties to be compliant with the top browsers.
 * Top browsers are browsers with more then 5% of the total userbase.
 * - cleanup CSS, with a minimum compatibility of IE9, that harlot
 * - optionally write sourcemaps
 * - optionally add cache busting hashes.
 *
 * @param file: {Object} a file object as defined in the files array
 *  of gulpinator.config.js. Each file has at least a target property.
 *  This property is a String or an array of Strings, defining relative
 *  paths or glob patterns. Additionally, each file object has a String
 *  reference to the task itself (in this case 'compile-sass'), and an
 *  optional Options object.
 * @returns {Stream} A standard gulp stream, to be activated when necessary.
 */
const createCompileSassStream = function(file) {
  let options = createSassStreamConfig(file);

  return gulp.src(file.target)
    .pipe(gulpif(options.sourcemaps, sourcemaps.init({ loadMaps: true })))
      .pipe(gulpif(config.options.verbose, rename(function(path) {
        if (path.basename[0] !== '_') {
          path.basename += options.suffix;

          utility.printTaskDetails(
            file.target, NAME, options.dest + '/' + path.basename + path.extname
          );
        }
      })))
      .pipe(sass({includePaths: options.includePaths }))
      .pipe(autoprefixer('> 5%'))
      .pipe(cleanCSS({ compatibility: 'ie9' }))
    .pipe(gulpif(options.sourcemaps, sourcemaps.write('./')))
    .pipe(gulp.dest(options.dest));
};

const createServeSassStream = function(file) {
  return createCompileSassStream(file).pipe(browsersync.reload({ stream: true }));
};

module.exports = {
  name: NAME,
  getStream: createCompileSassStream,
  getServeStream: createServeSassStream
};
