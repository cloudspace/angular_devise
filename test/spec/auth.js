'use strict';

describe('Provider: Devise.Auth', function () {

    var AuthProvider;
    // load the service's module
    beforeEach(module('Devise', function(_AuthProvider_) {
        AuthProvider = _AuthProvider_;
    }));

    // instantiate service
    var Auth, $rootScope, $http, $httpBackend;
    beforeEach(inject(function (_Auth_, _$rootScope_, _$http_, _$httpBackend_) {
        Auth = _Auth_;
        $rootScope = _$rootScope_;
        $http = _$http_;
        $httpBackend = _$httpBackend_;
    }));
    function forceSignIn(Auth, user) {
        user = (user === undefined) ? {} : user;
        Auth._currentUser = user;
        return user;
    }
    function jsonEquals(obj, other) {
        return JSON.stringify(obj) === JSON.stringify(other);
    }

    describe('can configure', function() {
        function initService(fn) {
            fn();
            inject(function($q, $http) {
                Auth = new AuthProvider.$get($q, $http);
            });
        }
        function testPathConfigure(action, method, overrideMethod) {
            initService(function() {
                if (overrideMethod) {
                    AuthProvider[action + 'Method'](method);
                }
                AuthProvider[action + 'Path']('/test/test');
            });
            $httpBackend.expect(method, '/test/test').respond({});
            Auth[action]();
            $httpBackend.flush();
        }
        afterEach(function() {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });

        it('.loginPath', function() {
            testPathConfigure('login', 'POST');
        });

        it('.logoutPath', function() {
            testPathConfigure('logout', 'DELETE');
        });

        it('.registerPath', function() {
            testPathConfigure('register', 'POST');
        });

        it('.loginMethod', function() {
            testPathConfigure('login', 'GET', true);
        });

        it('.logoutMethod', function() {
            testPathConfigure('logout', 'GET', true);
        });

        it('.registerMethod', function() {
            testPathConfigure('register', 'GET', true);
        });

        it('.parse', function() {
            initService(function() {
                AuthProvider.parse(function(response) {
                    return new User(response.data);
                });
            });
            var User = function(params) {
                this.params = params;
            };
            var params = {id: 1, name: 'test', email: 'test@email.com', password: 'password'};
            var callCount = 0;
            var callback = function(user) {
                ++callCount;
                expect(user instanceof User).toBe(true);
                expect(user.params).toEqual(params);
            };
            $httpBackend.expect('POST', '/users/sign_in.json').respond(params);

            Auth.login().then(callback);
            $httpBackend.flush();

            expect(callCount).toBe(1);
        });
        
        it('.ignoreAuth', function() {
            initService(function() {
                AuthProvider['ignoreAuth'](true);
            });
            var callback = jasmine.createSpy('callback');
            $httpBackend.expect('POST', '/users/sign_in.json').respond(401);
            Auth['login']().catch(function(error) {
                callback();
            });
            $httpBackend.flush();
            expect(callback).toHaveBeenCalled();
        });
    });

    describe('.login', function() {
        var user;
        var postCallback;
        function constantTrue() {
            return true;
        }
        function callbackWraper(data) {
            data = JSON.parse(data);
            return postCallback(data);
        }

        beforeEach(function() {
            postCallback = constantTrue;
            user = {id: 1, name: 'test', email: 'test@email.com', password: 'password'};
            $httpBackend.expect('POST', '/users/sign_in.json', callbackWraper).respond(user);
        });
        afterEach(function() {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });

        it('POSTs to /users/sign_in.json', function() {
            Auth.login();
            $httpBackend.flush();
        });

        it('POSTS credential data', function() {
            var u = {email: 'test', blah: true};
            postCallback = function(data) {
                return jsonEquals(data.user, u);
            };
            Auth.login(u);
            $httpBackend.flush();
        });

        it('returns a promise', function() {
            expect(Auth.login().then).toBeDefined();
            $httpBackend.flush();
        });

        it('resolves promise to currentUser', function() {
            var callback = jasmine.createSpy('callback');
            Auth.login().then(callback);

            $httpBackend.flush();

            expect(callback).toHaveBeenCalledWith(user);
        });
    });

    describe('.logout', function() {
        beforeEach(function() {
            $httpBackend.expect('DELETE', '/users/sign_out.json').respond({});
        });
        afterEach(function() {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });

        it('DELETEs to /users/sign_out.json', function() {
            Auth.logout();
            $httpBackend.flush();
        });

        it('returns a promise', function() {
            expect(Auth.logout().then).toBeDefined();
            $httpBackend.flush();
        });

        it('resolves promise to old currentUser', function() {
            var user = forceSignIn(Auth, {id: 0});
            var callback = jasmine.createSpy('callback');
            Auth.logout().then(callback);

            $httpBackend.flush();

            expect(callback).toHaveBeenCalledWith(user);
        });
    });

    describe('.register', function() {
        var user;
        var postCallback;
        function constantTrue() {
            return true;
        }
        function callbackWraper(data) {
            data = JSON.parse(data);
            return postCallback(data);
        }

        beforeEach(function() {
            postCallback = constantTrue;
            user = {id: 1, name: 'test', email: 'test@email.com', password: 'password'};
            $httpBackend.expect('POST', '/users.json', callbackWraper).respond(user);
        });
        afterEach(function() {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });

        it('POSTs to /users.json', function() {
            Auth.register();
            $httpBackend.flush();
        });

        it('POSTS credential data', function() {
            var u = {email: 'test', blah: true};
            postCallback = function(data) {
                return jsonEquals(data.user, u);
            };
            Auth.register(u);
            $httpBackend.flush();
        });

        it('returns a promise', function() {
            expect(Auth.register().then).toBeDefined();
            $httpBackend.flush();
        });

        it('resolves promise to currentUser', function() {
            var callback = jasmine.createSpy('callback');
            Auth.register().then(callback);

            $httpBackend.flush();

            expect(callback).toHaveBeenCalledWith(user);
        });
    });

    describe('.currentUser', function() {
        describe('when authenticated', function() {
            var user;
            beforeEach(function() {
                user = forceSignIn(Auth);
            });

            it('returns a promise', function() {
                var callback = jasmine.createSpy('callback');

                Auth.currentUser().then(callback);
                // use #$apply to have the promise resolve.
                $rootScope.$apply();

                expect(callback).toHaveBeenCalled();
            });

            it('resolves the promise with the currentUser', function() {
                var callback = jasmine.createSpy('callback');

                Auth.currentUser().then(callback);
                // use #$apply to have the promise resolve.
                $rootScope.$apply();

                expect(callback).toHaveBeenCalledWith(user);
            });
        });

        describe('when unauthenticated', function() {
            describe('when user is logged in on server', function() {
                var user = {};
                beforeEach(function() {
                    $httpBackend.expect('POST', '/users/sign_in.json').respond(user);
                });

                it('fetches user from server', function() {
                    Auth.currentUser();
                    $httpBackend.flush();
                    $httpBackend.verifyNoOutstandingExpectation();
                    $httpBackend.verifyNoOutstandingRequest();
                });

                it('resolves promise with fetched user', function() {
                    var callback = jasmine.createSpy('callback');
                    Auth.currentUser().then(callback);
                    $httpBackend.flush();

                    expect(callback).toHaveBeenCalledWith(user);
                });
            });

            describe('when user is not logged in on server', function() {
                var error = {error: 'unauthorized'};
                beforeEach(function() {
                    $httpBackend.expect('POST', '/users/sign_in.json').respond(401, error);
                });

                it('does not resolve promise', function() {
                    var callback = jasmine.createSpy('callback');
                    Auth.currentUser().then(callback);
                    $httpBackend.flush();

                    expect(callback).not.toHaveBeenCalled();
                });
            });
        });
    });

    describe('.isAuthenticated', function() {
        it('returns false if no currentUser', function() {
            forceSignIn(Auth, null);
            expect(Auth.isAuthenticated()).toBe(false);
        });

        it('returns true if a currentUser', function() {
            forceSignIn(Auth);
            expect(Auth.isAuthenticated()).toBe(true);
        });
    });
});
