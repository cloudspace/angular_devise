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
            currentUser: null,

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
                creds = creds || {};
                return $http[method('login')](path('login'), {user: creds}).then(function(response) {
                    service.currentUser = response.data;
                    return service.requestCurrentUser();
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
                    var oldUser = service.currentUser;
                    service.currentUser = null;
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
             * @param {Object} [creds] A hash of user credentials.
             * @returns {Promise} A $http promise that will be resolved or
             *                  rejected by the server.
             */
            register: function(creds) {
                creds = creds || {};
                return $http[method('register')](path('register'), {user: creds}).then(function(response) {
                    service.currentUser = response.data;
                    return service.requestCurrentUser();
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
            requestCurrentUser: function() {
                if (service.isAuthenticated()) {
                    return $q.when(service.currentUser);
                }
                return service.login();
            },

            /**
             * A helper function to determine if a currentUser is present.
             *
             * @returns Boolean
             */
            isAuthenticated: function(){
                return !!service.currentUser;
            }
        };

        return service;
    };
});
