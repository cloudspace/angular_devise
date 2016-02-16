module.exports = function(config) {
    config.set({
        // base path, that will be used to resolve files and exclude
        basePath: '',

        // testing framework to use (jasmine/mocha/qunit/...)
        frameworks: ['jasmine'],

        plugins : ['karma-jasmine', 'karma-phantomjs-launcher'],

        // list of files / patterns to load in the browser
        files: [
            'test/support/angular/angular.js',
            'test/support/angular-mocks/angular-mocks.js',
            'test/devise.js',
            'src/*.js',
            'test/mock/**/*.js',
            'test/spec/**/*.js'
        ],

        // list of files / patterns to exclude
        exclude: [],

        // web server port
        port: 8080,

        // level of logging
        // possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
        logLevel: config.LOG_INFO,


        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: true,


        browsers: ['Chrome'],

        singleRun: true
    });
};
