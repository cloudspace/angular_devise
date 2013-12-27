'use strict';
(function (angular) {
  var devise = angular.module('Devise', []);
  devise.factory('deviseInterceptor401', [
    '$rootScope',
    '$q',
    function ($rootScope, $q) {
      return {
        responseError: function (response) {
          if (response.status === 401) {
            $rootScope.$broadcast('devise:unauthorized');
          }
          return $q.reject(response);
        }
      };
    }
  ]).config([
    '$httpProvider',
    function ($httpProvider) {
      $httpProvider.interceptors.push('deviseInterceptor401');
    }
  ]);
  devise.provider('Auth', function AuthProvider() {
    var slice = Array.prototype.slice;
    function pick(old) {
      var obj = {};
      if (!old) {
        return obj;
      }
      var props = slice.call(arguments, 1);
      var l = props.length;
      var prop;
      while (prop = props[--l]) {
        if (prop in old) {
          obj[prop] = old[prop];
        }
      }
      return obj;
    }
    var paths = {
        login: '/users/sign_in.json',
        logout: '/users/sign_out.json',
        register: '/users.json'
      };
    var methods = {
        login: 'POST',
        logout: 'DELETE',
        register: 'POST'
      };
    function method(action) {
      return methods[action].toLowerCase();
    }
    function path(action) {
      return paths[action];
    }
    function configure(obj, suffix) {
      angular.forEach(obj, function (v, action) {
        this[action + suffix] = function (param) {
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
    this.$get = [
      '$q',
      '$http',
      function ($q, $http) {
        var service = {
            currentUser: null,
            login: function (opts) {
              var user = pick(opts, 'email', 'password');
              return $http[method('login')](path('login'), { user: user }).then(function (response) {
                service.currentUser = response.data;
                return service.requestCurrentUser();
              });
            },
            logout: function () {
              return $http[method('logout')](path('logout')).then(function () {
                var oldUser = service.currentUser;
                service.currentUser = null;
                return oldUser;
              });
            },
            register: function (opts) {
              var user = pick(opts, 'email', 'password', 'password_confirmation');
              if (!user.password_confirmation) {
                user.password_confirmation = user.password;
              }
              return $http[method('register')](path('register'), { user: user }).then(function (response) {
                service.currentUser = response.data;
                return service.requestCurrentUser();
              });
            },
            requestCurrentUser: function () {
              if (service.isAuthenticated()) {
                return $q.when(service.currentUser);
              }
              return service.login();
            },
            isAuthenticated: function () {
              return !!service.currentUser;
            }
          };
        return service;
      }
    ];
  });
}(angular));