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

    this.$get = function($rootScope, $q) {
        // Only for intercepting 401 requests.
        return {
            responseError: function(response) {
                var intercept;
                // Determine if the response is specifically disabling the interceptor.
                if (response.config) {
                    intercept = response.config.interceptAuth;
                }
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
    };
}).config(function($httpProvider) {
    $httpProvider.interceptors.push('AuthIntercept');
});
