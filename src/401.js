devise.config(function($httpProvider) {
    $httpProvider.interceptors.push(function($location, $q) {
        /* Only for intercepting 401 requests. */
        return {
            responseError: function(response) {
                if (response.status === 401) {
                    $location.path('/users/login');
                    return response;
                }
                return $q.reject(response);
            }
        };
    });
    $httpProvider.defaults.headers.common['X-CSRF-Token'] = angular.element(document.querySelector('meta[name=csrf-token]')).attr('content');
});
