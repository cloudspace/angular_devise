'use strict';

describe('Service: Devise.401', function () {

    // load the service's module
    beforeEach(module('Devise'));

    var $http, $httpBackend;
    beforeEach(inject(function(_$http_, _$httpBackend_) {
        $http = _$http_;
        $httpBackend = _$httpBackend_;
    }));

    describe('responseError', function() {
        beforeEach(function() {
            $httpBackend.expect('GET', '/foo').respond(401);
        });

        describe('when ignoreAuth is true', function() {
            beforeEach(function() {
                var get = $http.get;
                $http.get = function(url, config) {
                    if (!config) { config = {}; }
                    config.ignoreAuth = true;
                    return get.call($http, url, config);
                };
            });

            it('returns rejected promise on 401', function () {
                var callback = jasmine.createSpy('callback');
                $http.get('/foo').catch(function() {
                    callback();
                });
                $httpBackend.flush();
                expect(callback).toHaveBeenCalled();
            });
        });

        describe('when ignoreAuth is false (default)', function() {
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
    });

});
