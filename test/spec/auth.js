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
            inject(function($q, $http, $rootScope) {
                Auth = new AuthProvider.$get($q, $http, $rootScope);
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
                expect(user instanceof User).toBe(true);
                expect(user.params).toEqual(params);
                ++callCount;
            };
            $httpBackend.expect('POST', '/users/sign_in.json').respond(params);

            Auth.login().then(callback);
            $httpBackend.flush();

            expect(callCount).toBe(1);
        });

        describe('.resourceName', function() {
            var credentials = {test: 'test'};
            afterEach(function() {
                $httpBackend.verifyNoOutstandingExpectation();
                $httpBackend.verifyNoOutstandingRequest();
            });

            describe('truthy resourceName', function() {
                it('.login', function() {
                    initService(function() {
                        AuthProvider.resourceName('test');
                    });
                    $httpBackend.expect('POST', '/users/sign_in.json', {test: credentials}).respond({});

                    Auth.login({test: 'test'});
                    $httpBackend.flush();
                });

                it('.register', function() {
                    initService(function() {
                        AuthProvider.resourceName('test');
                    });
                    $httpBackend.expect('POST', '/users.json', {test: credentials}).respond({});

                    Auth.register({test: 'test'});
                    $httpBackend.flush();
                });
            });

            describe('falsey resourceName', function() {
                it('.login', function() {
                    initService(function() {
                        AuthProvider.resourceName(false);
                    });
                    $httpBackend.expect('POST', '/users/sign_in.json', credentials).respond({});

                    Auth.login({test: 'test'});
                    $httpBackend.flush();
                });

                it('.register', function() {
                    initService(function() {
                        AuthProvider.resourceName(false);
                    });
                    $httpBackend.expect('POST', '/users.json', credentials).respond({});

                    Auth.register({test: 'test'});
                    $httpBackend.flush();
                });
            });
        });

    });

    describe('.login', function() {
        var user;
        var creds = {email: 'test', blah: true};
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
            postCallback = function(data) {
                return jsonEquals(data.user, creds);
            };
            Auth.login(creds);
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

        it('broadcasts the session event and login events', function() {
            var loginCallback = jasmine.createSpy('login callback');
            var sessionCallback = jasmine.createSpy('session callback');
            $rootScope.$on('devise:new-session', sessionCallback);
            $rootScope.$on('devise:login', loginCallback);

            Auth.login(creds);
            $httpBackend.flush();

            expect(loginCallback).toHaveBeenCalledWith(jasmine.any(Object), user);
            expect(sessionCallback).toHaveBeenCalledWith(jasmine.any(Object), user);
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

        it('broadcasts the logout event', function() {
            var callback = jasmine.createSpy('logout callback');
            $rootScope.$on('devise:logout', callback);

            Auth.logout();
            $httpBackend.flush();

            expect(callback).toHaveBeenCalled();
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

        it('broadcasts the new-registration event after a sucessful registration', function() {
            var callback = jasmine.createSpy('callback');
            $rootScope.$on('devise:new-registration', callback);

            Auth.register();
            $httpBackend.flush();

            expect(callback).toHaveBeenCalledWith(jasmine.any(Object), user);
        });
    });

    describe('.parse', function() {
        beforeEach(function() {
            var response = {id: 1, name: 'test', email: 'test@email.com'};
            $httpBackend.when('POST', '/users/sign_in.json').respond(response);
        });
        afterEach(function() {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });

        it('can be customized', function() {
            var User = function(params) {
                this.params = params;
            };
            var callCount = 0;

            Auth.login().then(function(user){
                expect(user instanceof User).toBe(false);
                ++callCount;
            });
            Auth.parse = function(response) {
                return new User(response.data);
            };
            Auth.login().then(function(user){
                expect(user instanceof User).toBe(true);
                ++callCount;
            });
            $httpBackend.flush();

            expect(callCount).toBe(2);
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

            it('does not broadcasts any events', function() {
                var callback = jasmine.createSpy('any callback');
                $rootScope.$on('devise:new-session', callback);
                $rootScope.$on('devise:login', callback);
                Auth.currentUser();
                $rootScope.$apply();

                expect(callback).not.toHaveBeenCalled();
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

                it('broadcasts the session event but not the login event', function() {
                    var loginCallback = jasmine.createSpy('login callback');
                    var sessionCallback = jasmine.createSpy('new-session callback');
                    $rootScope.$on('devise:new-session', sessionCallback);
                    $rootScope.$on('devise:login', loginCallback);

                    Auth.currentUser();
                    $httpBackend.flush();

                    expect(sessionCallback).not.toHaveBeenCalled();
                    expect(loginCallback).toHaveBeenCalledWith(jasmine.any(Object), user);
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
