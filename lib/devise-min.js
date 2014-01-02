// AngularDevise
// -------------------
// v0.2.1
//
// Copyright (c)2014 Justin Ridgewell
// Distributed under MIT license
//
// https://github.com/cloudspace/angular_devise

"use strict";!function(a){var b=a.module("Devise",[]);b.factory("deviseInterceptor401",["$rootScope","$q",function(a,b){return{responseError:function(c){if(401===c.status&&!c.config.ignoreAuth){var d=b.defer();return a.$broadcast("devise:unauthorized",c,d),d.promise}return b.reject(c)}}}]).config(["$httpProvider",function(a){a.interceptors.push("deviseInterceptor401")}]),b.provider("Auth",function(){function b(a){return g[a].toLowerCase()}function c(a){return f[a]}function d(b,c){a.forEach(b,function(a,d){this[d+c]=function(a){return void 0===a?b[d]:(b[d]=a,this)}},this)}function e(a){return function(){return a}}var f={login:"/users/sign_in.json",logout:"/users/sign_out.json",register:"/users.json"},g={login:"POST",logout:"DELETE",register:"POST"},h=function(a){return a.data};d.call(this,g,"Method"),d.call(this,f,"Path"),this.parse=function(a){return"function"!=typeof a?h:(h=a,this)},this.$get=["$q","$http",function(a,d){function f(a){return i._currentUser=a,a}function g(){f(null)}var i={_currentUser:null,login:function(a){return a=a||{},d[b("login")](c("login"),{user:a}).then(h).then(f)},logout:function(){var a=e(i._currentUser);return d[b("logout")](c("logout")).then(g).then(a)},register:function(a){return a=a||{},d[b("register")](c("register"),{user:a}).then(h).then(f)},currentUser:function(){return i.isAuthenticated()?a.when(i._currentUser):i.login()},isAuthenticated:function(){return!!i._currentUser}};return i}]})}(angular);