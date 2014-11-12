devise.provider('Auth', function AuthProvider() {
    /**
     * The default paths.
     */
    var paths = {
        login: '/users/sign_in.json',
        logout: '/users/sign_out.json',
        register: '/users.json'
    };

    /**
     * The default HTTP methods to use.
     */
    var methods = {
        login: 'POST',
        logout: 'DELETE',
        register: 'POST'
    };

    /**
     * Set to true if 401 interception of the provider is not desired
     */
    var interceptAuth = false;

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
    function httpConfig(action, data) {
        var config = {
            method: methods[action].toLowerCase(),
            url: paths[action],
            interceptAuth: interceptAuth
        };

        if (data) {
            if (resourceName) {
                config.data = {};
                config.data[resourceName] = data;
            } else {
                config.data = data;
            }
        }

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

    // The interceptAuth config function
    this.interceptAuth = function(value) {
        if (value === undefined) {
            return interceptAuth;
        }
        interceptAuth = !!value;
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

    this.$get = function($q, $http, $rootScope) {
        // Our shared save function, called
        // by `then`s.
        function save(user) {
            service._currentUser = user;
            return user;
        }
        // A reset that saves null for currentUser
        function reset() {
            save(null);
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
             * @returns {Promise} A $http promise that will be resolved or
             *                  rejected by the server.
             */
            login: function(creds) {
                var withCredentials = arguments.length > 0,
                    loggedIn = service.isAuthenticated();

                creds = creds || {};
                return $http(httpConfig('login', creds))
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
             * @returns {Promise} A $http promise that will be resolved or
             *                  rejected by the server.
             */
            logout: function() {
                var returnOldUser = constant(service._currentUser);
                return $http(httpConfig('logout'))
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
             * @returns {Promise} A $http promise that will be resolved or
             *                  rejected by the server.
             */
            register: function(creds) {
                creds = creds || {};
                return $http(httpConfig('register', creds))
                    .then(service.parse)
                    .then(save)
                    .then(broadcast('new-registration'));
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
                return service.login();
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
    };
});
