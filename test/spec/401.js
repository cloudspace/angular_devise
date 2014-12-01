'use strict';

describe('Service: Devise.401', function () {

    // load the service's module
    beforeEach(module('Devise'));
    var AuthInterceptProvider;
    // load the service's module
    beforeEach(module('Devise', function(_AuthInterceptProvider_) {
        AuthInterceptProvider = _AuthInterceptProvider_;
    }));

    var $http, $httpBackend;
    beforeEach(inject(function(_$http_, _$httpBackend_) {
        $http = _$http_;
        $httpBackend = _$httpBackend_;
    }));

    describe('responseError', function() {
        beforeEach(function() {
            $httpBackend.expect('GET', '/foo').respond(401);
        });

        describe('when interceptAuth is true', function() {
            beforeEach(function() {
                AuthInterceptProvider.interceptAuth();
            });
            afterEach(function() {
                AuthInterceptProvider.interceptAuth(false);
            });

            it('can be disabled per request', inject(function ($rootScope) {
                var callback = jasmine.createSpy('callback');
                $rootScope.$on('devise:unauthorized', callback);
                $http.get('/foo', { interceptAuth: false });
                $httpBackend.flush();
                expect(callback).not.toHaveBeenCalled();
            }));

            it('broadcasts "devise:unauthorized" on 401 error', inject(function ($rootScope) {
                var callback = jasmine.createSpy('callback');
                $rootScope.$on('devise:unauthorized', callback);
                $http.get('/foo');
                $httpBackend.flush();
                expect(callback).toHaveBeenCalled();
            }));

            it('passes response to broadcast', inject(function ($rootScope) {
                var response;
                $rootScope.$on('devise:unauthorized', function(event, resp) {
                    response = resp;
                });

                $http.get('/foo');
                $httpBackend.flush();

                expect(response.status).toBe(401);
            }));

            it('passes a deferred to broadcast', inject(function ($rootScope) {
                var deferred;
                $rootScope.$on('devise:unauthorized', function(event, resp, d) {
                    deferred = d;
                });

                $http.get('/foo');
                $httpBackend.flush();

                expect(typeof deferred.resolve).toBe('function');
                expect(typeof deferred.reject).toBe('function');
            }));

            it("returns deferred's promise", inject(function ($rootScope) {
                var data = {};
                $rootScope.$on('devise:unauthorized', function(event, response, deferred) {
                    deferred.resolve(data);
                });

                var ret;
                $http.get('/foo').then(function(data) {
                    ret = data;
                });
                $httpBackend.flush();

                expect(ret).toBe(data);
            }));
        });

        describe('when interceptAuth is false (default)', function() {
            it('returns rejected promise on 401', function () {
                var callback = jasmine.createSpy('callback');
                $http.get('/foo').catch(callback);
                $httpBackend.flush();
                expect(callback).toHaveBeenCalled();
            });

            it('can be enabled per request', inject(function ($rootScope) {
                var callback = jasmine.createSpy('callback');
                $rootScope.$on('devise:unauthorized', callback);
                $http.get('/foo', { interceptAuth: true });
                $httpBackend.flush();
                expect(callback).toHaveBeenCalled();
            }));

        });
    });

});
