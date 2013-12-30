// AngularDevise
// -------------------
// v0.1.0
//
// Copyright (c)2013 Justin Ridgewell
// Distributed under MIT license
//
// https://github.com/cloudspace/angular_devise

"use strict";!function(a){var b=a.module("Devise",[]);b.factory("deviseInterceptor401",["$rootScope","$q",function(a,b){return{responseError:function(c){return 401===c.status&&a.$broadcast("devise:unauthorized"),b.reject(c)}}}]).config(["$httpProvider",function(a){a.interceptors.push("deviseInterceptor401")}]),b.provider("Auth",function(){function b(a){return h[a].toLowerCase()}function c(a){return g[a]}function d(b,c){a.forEach(b,function(a,d){this[d+c]=function(a){return void 0===a?b[d]:(b[d]=a,this)}},this)}function e(a){var b=j.call(arguments,1);return function(){return a.apply(this,b)}}function f(a){return function(){return a}}var g={login:"/users/sign_in.json",logout:"/users/sign_out.json",register:"/users.json"},h={login:"POST",logout:"DELETE",register:"POST"},i=function(a){return a.data};d.call(this,h,"Method"),d.call(this,g,"Path"),this.parse=function(a){return"function"!=typeof a?i:(i=a,this)};var j=Array.prototype.slice;this.$get=["$q","$http",function(a,d){function g(a){return h._currentUser=a,a}var h={_currentUser:null,login:function(a){return a=a||{},d[b("login")](c("login"),{user:a}).then(i).then(g)},logout:function(){var a=f(h._currentUser);return d[b("logout")](c("logout")).then(e(g,null)).then(a)},register:function(a){return a=a||{},d[b("register")](c("register"),{user:a}).then(i).then(g)},currentUser:function(){return h.isAuthenticated()?a.when(h._currentUser):h.login()},isAuthenticated:function(){return!!h._currentUser}};return h}]})}(angular);