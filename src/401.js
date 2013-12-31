devise.factory('deviseInterceptor401', function($rootScope, $q) {
    // Only for intercepting 401 requests. 
    return {
        responseError: function(response) {
            if (response.status === 401) {
                $rootScope.$broadcast('devise:unauthorized', response);
            }
            return $q.reject(response);
        }
    };
}).config(function($httpProvider) {
    $httpProvider.interceptors.push('deviseInterceptor401');
    // $httpProvider.defaults.headers.common['X-CSRF-Token'] = angular.element(document.querySelector('meta[name=csrf-token]')).attr('content');
});
