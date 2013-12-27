// AngularDevise
// -------------------
// v0.0.2
//
// Copyright (c)2013 Justin Ridgewell
// Distributed under MIT license
//
// https://github.com/cloudspace/angular_devise

"use strict";!function(a){var b=a.module("Devise",[]);b.factory("deviseInterceptor401",["$rootScope","$q",function(a,b){return{responseError:function(c){return 401===c.status&&a.$broadcast("devise:unauthorized"),b.reject(c)}}}]).config(["$httpProvider",function(a){a.interceptors.push("deviseInterceptor401")}]),b.provider("Auth",function(){function b(a){var b={};if(!a)return b;for(var c,d=f.call(arguments,1),e=d.length;c=d[--e];)c in a&&(b[c]=a[c]);return b}function c(a){return h[a].toLowerCase()}function d(a){return g[a]}function e(b,c){a.forEach(b,function(a,d){this[d+c]=function(a){return void 0===a?b[d]:(b[d]=a,this)}},this)}var f=Array.prototype.slice,g={login:"/users/sign_in.json",logout:"/users/sign_out.json",register:"/users.json"},h={login:"POST",logout:"DELETE",register:"POST"};e.call(this,h,"Method"),e.call(this,g,"Path"),this.$get=["$q","$http",function(a,e){var f={currentUser:null,login:function(a){var g=b(a,"email","password");return e[c("login")](d("login"),{user:g}).then(function(a){return f.currentUser=a.data,f.requestCurrentUser()})},logout:function(){return e[c("logout")](d("logout")).then(function(){var a=f.currentUser;return f.currentUser=null,a})},register:function(a){var g=b(a,"email","password","password_confirmation");return g.password_confirmation||(g.password_confirmation=g.password),e[c("register")](d("register"),{user:g}).then(function(a){return f.currentUser=a.data,f.requestCurrentUser()})},requestCurrentUser:function(){return f.isAuthenticated()?a.when(f.currentUser):f.login()},isAuthenticated:function(){return!!f.currentUser}};return f}]})}(angular);