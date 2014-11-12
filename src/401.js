devise.factory('deviseInterceptor401', function($rootScope, $q) {
    // Only for intercepting 401 requests.
    return {
        responseError: function(response) {
            if (response.status === 401 && response.config.interceptAuth) {
                var deferred = $q.defer();
                $rootScope.$broadcast('devise:unauthorized', response, deferred);
                return deferred.promise;
            }
            return $q.reject(response);
        }
    };
}).config(function($httpProvider) {
    $httpProvider.interceptors.push('deviseInterceptor401');
});
