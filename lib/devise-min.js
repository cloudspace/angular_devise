// AngularDevise
// -------------------
// v0.3.0
//
// Copyright (c)2014 Justin Ridgewell
// Distributed under MIT license
//
// https://github.com/cloudspace/angular_devise

"use strict";!function(a){var b=a.module("Devise",[]);b.factory("deviseInterceptor401",["$rootScope","$q",function(a,b){return{responseError:function(c){if(401===c.status&&!c.config.ignoreAuth){var d=b.defer();return a.$broadcast("devise:unauthorized",c,d),d.promise}return b.reject(c)}}}]).config(["$httpProvider",function(a){a.interceptors.push("deviseInterceptor401")}]),b.provider("Auth",function(){function b(a,b){var c={method:f[a].toLowerCase(),url:e[a],ignoreAuth:g};return b&&(c.data=b),c}function c(b,c){a.forEach(b,function(a,d){this[d+c]=function(a){return void 0===a?b[d]:(b[d]=a,this)}},this)}function d(a){return function(){return a}}var e={login:"/users/sign_in.json",logout:"/users/sign_out.json",register:"/users.json"},f={login:"POST",logout:"DELETE",register:"POST"},g=!1,h=function(a){return a.data};c.call(this,f,"Method"),c.call(this,e,"Path"),this.ignoreAuth=function(a){return void 0===a?g:(g=!!a,this)},this.parse=function(a){return"function"!=typeof a?h:(h=a,this)},this.$get=["$q","$http",function(a,c){function e(a){return g._currentUser=a,a}function f(){e(null)}var g={_currentUser:null,login:function(a){return a=a||{},c(b("login",{user:a})).then(h).then(e)},logout:function(){var a=d(g._currentUser);return c(b("logout")).then(f).then(a)},register:function(a){return a=a||{},c(b("register",{user:a})).then(h).then(e)},currentUser:function(){return g.isAuthenticated()?a.when(g._currentUser):g.login()},isAuthenticated:function(){return!!g._currentUser}};return g}]})}(angular);