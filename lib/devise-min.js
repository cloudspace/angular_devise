// AngularDevise
// -------------------
// v0.2.1
//
// Copyright (c)2014 Justin Ridgewell
// Distributed under MIT license
//
// https://github.com/cloudspace/angular_devise

"use strict";!function(a){var b=a.module("Devise",[]);b.factory("deviseInterceptor401",["$rootScope","$q",function(a,b){return{responseError:function(c){if(401===c.status&&!c.config.ignoreAuth){var d=b.defer();return a.$broadcast("devise:unauthorized",c,d),d.promise}return b.reject(c)}}}]).config(["$httpProvider",function(a){a.interceptors.push("deviseInterceptor401")}]),b.provider("Auth",function(){function b(a){return h[a].toLowerCase()}function c(a){return g[a]}function d(a,d){var e={method:b(a),url:c(a),ignoreAuth:i};return"undefined"!=typeof d&&null!==d&&(e.data=d),e}function e(b,c){a.forEach(b,function(a,d){this[d+c]=function(a){return void 0===a?b[d]:(b[d]=a,this)}},this)}function f(a){return function(){return a}}var g={login:"/users/sign_in.json",logout:"/users/sign_out.json",register:"/users.json"},h={login:"POST",logout:"DELETE",register:"POST"},i=!1,j=function(a){return a.data};e.call(this,h,"Method"),e.call(this,g,"Path"),this.ignoreAuth=function(a){i=a},this.parse=function(a){return"function"!=typeof a?j:(j=a,this)},this.$get=["$q","$http",function(a,b){function c(a){return g._currentUser=a,a}function e(){c(null)}var g={_currentUser:null,login:function(a){return a=a||{},b(d("login",{user:a})).then(j).then(c)},logout:function(){var a=f(g._currentUser);return b(d("logout")).then(e).then(a)},register:function(a){return a=a||{},b(d("register",{user:a})).then(j).then(c)},currentUser:function(){return g.isAuthenticated()?a.when(g._currentUser):g.login()},isAuthenticated:function(){return!!g._currentUser}};return g}]})}(angular);