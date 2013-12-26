// AngularDevise
// -------------------
// v0.0.1
//
// Copyright (c)2013 Justin Ridgewell
// Distributed under MIT license
//
// https://github.com/cloudspace/angular_devise

"use strict";!function(a){var b=a.module("Devise",[]);b.config(["$httpProvider",function(b){b.interceptors.push(function(a,b){return{responseError:function(c){return 401===c.status?(a.path("/users/login"),c):b.reject(c)}}}),b.defaults.headers.common["X-CSRF-Token"]=a.element(document.querySelector("meta[name=csrf-token]")).attr("content")}]),b.factory("Auth",["$q","$location","$http",function(a,b,c){function d(a){null!=a&&(a=a||"/",b.path(a))}function e(a){for(var b,c={},d=f.call(arguments,1),e=d.length;e--;)b=d[e],c[b]=a[b];return c}var f=Array.prototype.slice,g={currentUser:null,login:function(a){a||(a={});var b=e(a,"email","password");return c.post("/users/sign_in.json",{user:b}).then(function(b){return g.currentUser=b.data,d(a.redirect),g.requestCurrentUser()})},logout:function(a){a||(a={}),c.delete("/users/sign_out.json").then(function(){g.currentUser=null,d(a.redirect)})},register:function(a){a||(a={});var b=e(a,"email","password","password_confirmation");return b.password_confirmation||(b.password_confirmation=b.password),c.post("/users.json",{user:b}).then(function(b){g.currentUser=b.data,d(a.redirect)})},requestCurrentUser:function(){return g.isAuthenticated()?a.when(g.currentUser):g.login()},isAuthenticated:function(){return!!g.currentUser}};return g}])}(angular);