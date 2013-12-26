devise.factory('Auth', function($q, $location, $http) {
    var slice = Array.prototype.slice;
    function redirect(url) {
        if (url == null) { return; }
        url = url || '/';
        $location.path(url);
    }
    function pick(old) {
        var obj = {};
        var props = slice.call(arguments, 1);
        var l = props.length;
        var prop;
        while (l--) {
            prop = props[l];
            obj[prop] = old[prop];
        }
        return obj;
    }

    var service = {
        currentUser: null,
        login: function(opts) {
            if (!opts) { opts = {}; }
            var user = pick(opts, 'email', 'password');
            return $http.post('/users/sign_in.json', {user: user}).then(function(response) {
                service.currentUser = response.data;
                redirect(opts.redirect);
                return service.requestCurrentUser();
            });
        },
        logout: function(opts) {
            if (!opts) { opts = {}; }
            $http.delete('/users/sign_out.json').then(function() {
                service.currentUser = null;
                redirect(opts.redirect);
            });
        },
        register: function(opts) {
            if (!opts) { opts = {}; }
            var user = pick(opts, 'email', 'password', 'password_confirmation');
            if (!user.password_confirmation) {
                user.password_confirmation = user.password;
            }
            return $http.post('/users.json', {user: user}).then(function(response) {
                service.currentUser = response.data;
                redirect(opts.redirect);
            });
        },
        requestCurrentUser: function() {
            if (service.isAuthenticated()) {
                return $q.when(service.currentUser);
            }
            return service.login();
        },
        isAuthenticated: function(){
            return !!service.currentUser;
        }
    };

    return service;
});
