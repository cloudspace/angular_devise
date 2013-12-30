devise.provider('Auth', function AuthProvider() {
    // Cache a reference to slice.
    var slice = Array.prototype.slice;

    /**
     * Picks properties out of an object.
     * @param {Object} obj The object to pick out of.
     * @param {...String} props The properties to pick out.
     */
    function pick(old) {
        var obj = {};
        if (!old) { return obj; }
        var props = slice.call(arguments, 1);
        var l = props.length;
        var prop;
        while ((prop = props[--l])) {
            if (prop in old) { obj[prop] = old[prop]; }
        }
        return obj;
    }

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

    // A helper function that will get the
    // proper method.
    function method(action) {
        return methods[action].toLowerCase();
    }
    // A helper function that will get the
    // proper path and append the path extension.
    function path(action) {
        return paths[action];
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

    this.$get = function($q, $http) {
        var service = {
            /**
             * The Auth service's current user.
             * This is shared between all instances of Auth
             * on the scope.
             */
            _currentUser: null,

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
             * @param {Object} [opts] A hash of user credentials.
             * @param {String} [opts.email] The email of the user
             * @param {String} [opts.password] The password of the user
             * @returns {Promise} A $http promise that will be resolved or
             *                  rejected by the server.
             */
            login: function(opts) {
                var user = pick(opts, 'email', 'password');
                return $http[method('login')](path('login'), {user: user}).then(function(response) {
                    service._currentUser = response.data;
                    return service.currentUser();
                });
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
                return $http[method('logout')](path('logout')).then(function() {
                    var oldUser = service._currentUser;
                    service._currentUser = null;
                    return oldUser;
                });
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
             * @param {Object} [opts] A hash of user credentials.
             * @param {String} [opts.email] The email of the user
             * @param {String} [opts.password] The password of the user
             * @param {String} [opts.password_confirmation] The retyped password.
             *                  Will default to opts.password if none is given.
             * @returns {Promise} A $http promise that will be resolved or
             *                  rejected by the server.
             */
            register: function(opts) {
                var user = pick(opts, 'email', 'password', 'password_confirmation');
                if (!user.password_confirmation) {
                    user.password_confirmation = user.password;
                }
                return $http[method('register')](path('register'), {user: user}).then(function(response) {
                    service._currentUser = response.data;
                    return service.currentUser();
                });
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
