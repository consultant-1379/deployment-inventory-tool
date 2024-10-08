'use strict';

var fs = require('fs');
var _ = require('lodash');
var chalk = require('chalk');
var winston = require('winston');
const { format } = winston;
var config = require('../config');

// list of valid formats for the logging
var validFormats = ['combined', 'common', 'dev', 'short', 'tiny'];

// Instantiating the default winston application logger with the Console
// transport
var logger = winston.createLogger({
  transports: [
    new winston.transports.Console({
      level: 'info',
      format: format.combine(
        format.colorize(),
        format.printf((info) => {
          return `${info.level}: ${info.message}`;
        })
      ),
      handleExceptions: true
    })
  ],
  exitOnError: false
});

// A stream object with a write function that will call the built-in winston
// logger.info() function.
// Useful for integrating with stream-related mechanism like Morgan's stream
// option to log all HTTP requests to a file
logger.stream = {
  write: function (msg) {
    logger.info(msg);
  }
};

/**
 * Instantiate a winston's File transport for disk file logging
 *
 */
logger.setupFileLogger = function setupFileLogger() {
  var fileLoggerTransport = this.getLogOptions();
  if (!fileLoggerTransport) {
    return false;
  }

  try {
    // Check first if the configured path is writable and only then
    // instantiate the file logging transport
    if (fs.openSync(fileLoggerTransport.filename, 'a+')) {
      logger.add(new winston.transports.File(fileLoggerTransport));
    }

    return true;
  } catch (err) {
    if (process.env.NODE_ENV !== 'test') {
      console.log(chalk.red('An error has occured during the creation of the File transport logger.')); // eslint-disable-line no-console
      console.log(chalk.red(err)); // eslint-disable-line no-console
    }

    return false;
  }
};

/**
 * The options to use with winston logger
 *
 * Returns a Winston object for logging with the File transport
 */
logger.getLogOptions = function getLogOptions() {
  var _config = _.clone(config, true);
  var configFileLogger = _config.log.fileLogger;

  if (!_.has(_config, 'log.fileLogger.directoryPath') || !_.has(_config, 'log.fileLogger.fileName')) {
    console.log('unable to find logging file configuration'); // eslint-disable-line no-console
    return false;
  }

  var logPath = configFileLogger.directoryPath + '/' + configFileLogger.fileName;

  return {
    level: 'debug',
    format: format.combine(
      format.timestamp(),
      format.printf((info) => {
        return `${info.timestamp} - ${info.level} - ${info.message}`;
      })
    ),
    filename: logPath,
    maxsize: configFileLogger.maxsize ? configFileLogger.maxsize : 10485760,
    maxFiles: configFileLogger.maxFiles ? configFileLogger.maxFiles : 2,
    eol: '\n',
    tailable: true,
    handleExceptions: true
  };
};

/**
 * The options to use with morgan logger
 *
 * Returns a log.options object with a writable stream based on winston
 * file logging transport (if available)
 */
logger.getMorganOptions = function getMorganOptions() {
  return {
    stream: logger.stream
  };
};

/**
 * The format to use with the logger
 *
 * Returns the log.format option set in the current environment configuration
 */
logger.getLogFormat = function getLogFormat() {
  var format = config.log && config.log.format ? config.log.format.toString() : 'combined';

  // make sure we have a valid format
  if (!_.includes(validFormats, format)) {
    format = 'combined';

    if (process.env.NODE_ENV !== 'test') {
      console.log(chalk.yellow('Warning: An invalid format was provided.' + // eslint-disable-line no-console
      ' The logger will use the default format of "' + format + '"'));
    }
  }

  return format;
};

logger.setupFileLogger();

module.exports = logger;
