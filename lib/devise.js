(function(angular) {
    'use strict';
    var devise = angular.module('Devise', []);

    devise.provider('AuthIntercept', function AuthInterceptProvider() {
    /**
     * Set to true to intercept 401 Unauthorized responses
     */
    var interceptAuth = false;

    // The interceptAuth config function
    this.interceptAuth = function(value) {
        interceptAuth = !!value || value === void 0;
        return this;
    };

    this.$get = ['$rootScope', '$q', function($rootScope, $q) {
        // Only for intercepting 401 requests.
        return {
            responseError: function(response) {
                // Determine if the response is specifically disabling the interceptor.
                var intercept = response.config.interceptAuth;
                intercept = !!intercept || (interceptAuth && intercept === void 0);

                if (intercept && response.status === 401) {
                    var deferred = $q.defer();
                    $rootScope.$broadcast('devise:unauthorized', response, deferred);
                    deferred.reject(response);
                    return deferred.promise;
                }

                return $q.reject(response);
            }
        };
    }];
}).config(['$httpProvider', function($httpProvider) {
    $httpProvider.interceptors.push('AuthIntercept');
}]);

    devise.provider('Auth', function AuthProvider() {
    /**
     * The default paths.
     */
    var paths = {
        login: '/users/sign_in.json',
        logout: '/users/sign_out.json',
        register: '/users.json',
        sendResetPasswordInstructions: '/users/password.json',
        resetPassword: '/users/password.json'
    };

    /**
     * The default HTTP methods to use.
     */
    var methods = {
        login: 'POST',
        logout: 'DELETE',
        register: 'POST',
        sendResetPasswordInstructions: 'POST',
        resetPassword: 'PUT'
    };

    /**
     * The default host URL.
     */
    var baseUrl = '';

    /**
     * Default devise resource_name is 'user', can be set to any string.
     * If it's falsey, it will not namespace the data.
     */
    var resourceName = 'user';

    /**
     * The parsing function used to turn a $http
     * response into a "user".
     *
     * Can be swapped with another parsing function
     * using
     *
     *  angular.module('myModule', ['Devise']).
     *  config(function(AuthProvider) {
     *      AuthProvider.parse(function(response) {
     *          return new User(response.data);
     *      });
     *  });
     */
    var _parse = function(response) {
        return response.data;
    };

    // A helper function that will setup the ajax config
    // and merge the data key if provided
    function httpConfig(action, data, additionalConfig) {
        var config = {
            method: methods[action].toLowerCase(),
            url: paths[action]
        };

        if (data) {
            if (resourceName) {
                config.data = {};
                config.data[resourceName] = data;
            } else {
                config.data = data;
            }
        }

        angular.extend(config, additionalConfig);
        return config;
    }

    // A helper function to define our configure functions.
    // Loops over all properties in obj, and creates a get/set
    // method for [key + suffix] to set that property on obj.
    function configure(obj, suffix) {
        angular.forEach(obj, function(v, action) {
            this[action + suffix] = function(param) {
                if (param === undefined) {
                    return obj[action];
                }
                obj[action] = param;
                return this;
            };
        }, this);
    }
    configure.call(this, methods, 'Method');
    configure.call(this, paths, 'Path');

    // The baseUrl config function
    this.baseUrl = function(value) {
        if (value === undefined) {
            return baseUrl;
        }
        baseUrl = value;
        return this;
    };

    // The resourceName config function
    this.resourceName = function(value) {
        if (value === undefined) {
            return resourceName;
        }
        resourceName = value;
        return this;
    };

    // The parse configure function.
    this.parse = function(fn) {
        if (typeof fn !== 'function') {
            return _parse;
        }
        _parse = fn;
        return this;
    };

    // Creates a function that always
    // returns a given arg.
    function constant(arg) {
        return function() {
            return arg;
        };
    }

    this.$get = ['$q', '$http', '$rootScope', function($q, $http, $rootScope) {
        // Our shared save function, called
        // by `then`s.
        function save(user) {
            service._currentUser = user;
            return user;
        }
        // A reset that saves null for currentUser
        function reset() {
            save(null);
            service._promise = null;
        }

        function broadcast(name) {
            return function(data) {
                $rootScope.$broadcast('devise:' + name, data);
                return data;
            };
        }

        var service = {
            /**
             * The Auth service's current user.
             * This is shared between all instances of Auth
             * on the scope.
             */
            _currentUser: null,

            /**
             * The Auth service's parsing function.
             * Defaults to the parsing function set in the provider,
             * but may also be overwritten directly on the service.
             */
            parse: _parse,

            /**
             * The Auth service's current promise
             * This is shared between all instances of Auth
             * on the scope.
             */
            _promise: null,

            /* reset promise and current_user, after call this method all
             * xhr request will be reprocessed when they will be call
             */
            reset: function(){
                reset();
                service.currentUser();
            },

            /**
             * A login function to authenticate with the server.
             * Keep in mind, credentials are sent in plaintext;
             * use a SSL connection to secure them. By default,
             * `login` will POST to '/users/sign_in.json'.
             *
             * The path and HTTP method used to login are configurable
             * using
             *
             *  angular.module('myModule', ['Devise']).
             *  config(function(AuthProvider) {
             *      AuthProvider.loginPath('path/on/server.json');
             *      AuthProvider.loginMethod('GET');
             *  });
             *
             * @param {Object} [creds] A hash of user credentials.
             * @param {Object} [config] Optional, additional config which
             *                  will be added to http config for underlying
             *                  $http.
             * @returns {Promise} A $http promise that will be resolved or
             *                  rejected by the server.
             */
            login: function(creds, config) {
                var withCredentials = arguments.length > 0,
                    loggedIn = service.isAuthenticated();

                creds = creds || {};
                return $http(httpConfig('login', creds, config))
                    .then(service.parse)
                    .then(save)
                    .then(function(user) {
                        if (withCredentials && !loggedIn) {
                            return broadcast('new-session')(user);
                        }
                        return user;
                    })
                    .then(broadcast('login'));
            },

            /**
             * A logout function to de-authenticate from the server.
             * By default, `logout` will DELETE to '/users/sign_out.json'.
             *
             * The path and HTTP method used to logout are configurable
             * using
             *
             *  angular.module('myModule', ['Devise']).
             *  config(function(AuthProvider) {
             *      AuthProvider.logoutPath('path/on/server.json');
             *      AuthProvider.logoutMethod('GET');
             *  });
             * @param {Object} [config] Optional, additional config which
             *                  will be added to http config for underlying
             *                  $http.
             * @returns {Promise} A $http promise that will be resolved or
             *                  rejected by the server.
             */
            logout: function(config) {
                var returnOldUser = constant(service._currentUser);
                return $http(httpConfig('logout', undefined, config))
                    .then(reset)
                    .then(returnOldUser)
                    .then(broadcast('logout'));
            },

            /**
             * A register function to register and authenticate
             * with the server. Keep in mind, credentials are sent
             * in plaintext; use a SSL connection to secure them.
             * By default, `register` will POST to '/users.json'.
             *
             * The path and HTTP method used to login are configurable
             * using
             *
             *  angular.module('myModule', ['Devise']).
             *  config(function(AuthProvider) {
             *      AuthProvider.registerPath('path/on/server.json');
             *      AuthProvider.registerMethod('GET');
             *  });
             *
             * @param {Object} [creds] A hash of user credentials.
             * @param {Object} [config] Optional, additional config which
             *                  will be added to http config for underlying
             *                  $http.
             * @returns {Promise} A $http promise that will be resolved or
             *                  rejected by the server.
             */
            register: function(creds, config) {
                creds = creds || {};
                return $http(httpConfig('register', creds, config))
                    .then(service.parse)
                    .then(save)
                    .then(broadcast('new-registration'));
            },

            /**
             * A function to send the reset password instructions to the
             * user email.
             * By default, `sendResetPasswordInstructions` will POST to '/users/password.json'.
             *
             * The path and HTTP method used to send instructions are configurable
             * using
             *
             *  angular.module('myModule', ['Devise']).
             *  config(function(AuthProvider) {
             *      AuthProvider.sendResetPasswordInstructionsPath('path/on/server.json');
             *      AuthProvider.sendResetPasswordInstructionsMethod('POST');
             *  });
             *
             * @param {Object} [creds] A hash containing user email.
             * @returns {Promise} A $http promise that will be resolved or
             *                  rejected by the server.
             */
            sendResetPasswordInstructions: function(creds) {
                creds = creds || {};
                return $http(httpConfig('sendResetPasswordInstructions', creds))
                    .then(service.parse)
                    .then(broadcast('send-reset-password-instructions-successfully'));
            },

            /**
             * A reset function to reset user password.
             * By default, `resetPassword` will PUT to '/users/password.json'.
             *
             * The path and HTTP method used to reset password are configurable
             * using
             *
             *  angular.module('myModule', ['Devise']).
             *  config(function(AuthProvider) {
             *      AuthProvider.resetPasswordPath('path/on/server.json');
             *      AuthProvider.resetPasswordMethod('POST');
             *  });
             *
             * @param {Object} [creds] A hash containing password, password_confirmation and reset_password_token.
             * @returns {Promise} A $http promise that will be resolved or
             *                  rejected by the server.
             */
            resetPassword: function(creds) {
                creds = creds || {};
                return $http(httpConfig('resetPassword', creds))
                    .then(service.parse)
                    .then(save)
                    .then(broadcast('reset-password-successfully'));
            },

            /**
             * A helper function that will return a promise with the currentUser.
             * Three different outcomes can happen:
             *  1. Auth has authenticated a user, and will resolve with it
             *  2. Auth has not authenticated a user but the server has an
             *      authenticated session, Auth will attempt to retrieve that
             *      session and resolve with its user.
             *  3. Neither Auth nor the server has an authenticated session,
             *      and will reject with an unauthenticated error.
             *
             * @returns {Promise} A $http promise that will be resolved or
             *                  rejected by the server.
             */
            currentUser: function() {
                if (service.isAuthenticated()) {
                    return $q.when(service._currentUser);
                }
                if(service._promise === null){
                    service._promise = service.login();
                }
                return service._promise;
            },

            /**
             * A helper function to determine if a currentUser is present.
             *
             * @returns Boolean
             */
            isAuthenticated: function(){
                return !!service._currentUser;
            }
        };

        return service;
    }];
});

})(angular);
