'use strict';
(function (angular) {
  var devise = angular.module('Devise', []);
  devise.factory('deviseInterceptor401', [
    '$rootScope',
    '$q',
    function ($rootScope, $q) {
      return {
        responseError: function (response) {
          if (response.status === 401 && !response.config.ignoreAuth) {
            var deferred = $q.defer();
            $rootScope.$broadcast('devise:unauthorized', response, deferred);
            return deferred.promise;
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
    var parse = function (response) {
      return response.data;
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
    this.parse = function (fn) {
      if (typeof fn !== 'function') {
        return parse;
      }
      parse = fn;
      return this;
    };
    function constant(arg) {
      return function () {
        return arg;
      };
    }
    this.$get = [
      '$q',
      '$http',
      function ($q, $http) {
        function save(user) {
          service._currentUser = user;
          return user;
        }
        function reset() {
          save(null);
        }
        var service = {
            _currentUser: null,
            login: function (creds) {
              creds = creds || {};
              return $http[method('login')](path('login'), { user: creds }).then(parse).then(save);
            },
            logout: function () {
              var returnOldUser = constant(service._currentUser);
              return $http[method('logout')](path('logout')).then(reset).then(returnOldUser);
            },
            register: function (creds) {
              creds = creds || {};
              return $http[method('register')](path('register'), { user: creds }).then(parse).then(save);
            },
            currentUser: function () {
              if (service.isAuthenticated()) {
                return $q.when(service._currentUser);
              }
              return service.login();
            },
            isAuthenticated: function () {
              return !!service._currentUser;
            }
          };
        return service;
      }
    ];
  });
}(angular));