'use strict';

describe('Service: Devise.401', function () {

    // load the service's module
    beforeEach(module('Devise'));

    // instantiate service
    var interceptor, promise, wrappedPromise;
    var $http, $httpBackend;
    beforeEach(inject(function (_deviseInterceptor401_) {
        interceptor = _deviseInterceptor401_;
        wrappedPromise = {};
        promise = {
            then: jasmine.createSpy('then').andReturn(wrappedPromise)
        };
    }));
    beforeEach(inject(function(_$http_, _$httpBackend_) {
        $http = _$http_;
        $httpBackend = _$httpBackend_;
    }));

    describe('responseError', function() {
        beforeEach(function() {
            interceptor = interceptor.responseError;
            $httpBackend.expect('GET', '/foo').respond(401);
        });

        it('returns rejected promise on 401', function () {
            var callback = jasmine.createSpy('callback');
            $http.get('/foo').catch(function() {
                callback();
            });
            $httpBackend.flush();
            expect(callback).toHaveBeenCalled();
        });

        it('broadcasts "devise:unauthorized" on 401 error', inject(function ($rootScope) {
            var callback = jasmine.createSpy('callback');
            $rootScope.$on('devise:unauthorized', callback);
            $http.get('/foo');
            $httpBackend.flush();
            expect(callback).toHaveBeenCalled();
        }));

        it('passes response to broadcast', inject(function ($rootScope) {
            var callback = jasmine.createSpy('callback');
            $rootScope.$on('devise:unauthorized', callback);

            $http.get('/foo');
            $httpBackend.flush();

            expect(callback.calls[0].args[1].status).toBe(401);
        }));
    });

});
