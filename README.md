AngularDevise [![Build Status](https://travis-ci.org/cloudspace/angular_devise.png)](http://travis-ci.org/cloudspace/angular_devise)
=============

A small AngularJS Service to interact with Devise Authentication.


Requirements
------------

This service requires Devise to respond to JSON. To do that, simply add

```ruby
# config/application.rb
module RailsApp
  class Application < Rails::Application
    # ...

    config.to_prepare do
      DeviseController.respond_to :html, :json
    end
  end
end
```

Aditionally, if you have [CSRF Forgery
Protection](http://api.rubyonrails.org/classes/ActionController/RequestForgeryProtection/ClassMethods.html)
enabled for your controller actions, you will also need to include the
`X-CSRF-TOKEN` header with the token provided by rails. The easiest way
to include this is to follow this post:

[angular_rails_csrf](http://stackoverflow.com/questions/14734243/rails-csrf-protection-angular-js-protect-from-forgery-makes-me-to-log-out-on).

Downloading
-----------

AngularDevise is registered as `angular-devise` in
[bower](http://sindresorhus.com/bower-components/#!/search/angular-devise).

```bash
bower install --save angular-devise
```

You can then use the main file at `angular-devise/lib/devise-min.js`.

Rails Assets
------------

To get AngularDevise via [Rails Assets](https://rails-assets.org/) add to your Gemfile:

```ruby
source "https://rails-assets.org" do
  gem "rails-assets-angular-devise"
end
```

Then `bundle`. Finally, to require the JS:

```js
//= require angular-devise
```

Usage
-----

Just register `Devise` as a dependency for your module. Then, the `Auth`
service will be available for use.

```javascript
angular.module('myModule', ['Devise']).
    config(function(AuthProvider) {
        // Configure Auth service with AuthProvider
    }).
    controller('myCtrl', function(Auth) {
        // Use your configured Auth service.
    });
```

### Auth.currentUser()

`Auth.currentUser()` returns a promise that will be resolved into the
currentUser. There are three possible outcomes:

 1. Auth has authenticated a user, and will resolve with that user.
 2. Auth has not authenticated a user but the server has a previously
    authenticated session, Auth will attempt to retrieve that session
    and resolve with its user. Then, a `devise:new-session` event will
    be broadcast with the current user as the argument.
 3. Neither Auth nor the server has an authenticated session, and a
    rejected promise will be returned. (see [Interceptor](#interceptor)
    for for custom handling.)

```javascript
angular.module('myModule', ['Devise']).
    controller('myCtrl', function(Auth) {
        Auth.currentUser().then(function(user) {
            // User was logged in, or Devise returned
            // previously authenticated session.
            console.log(user); // => {id: 1, ect: '...'}
        }, function(error) {
            // unauthenticated error
        });
    });
```

#### Auth._currentUser

`Auth._currentUser` will be either `null` or the currentUser's object
representation. It is not recommended to directly access
`Auth._currentUser`, but instead use
[Auth.currentUser()](#authcurrentuser).

```javascript
angular.module('myModule', ['Devise']).
    controller('myCtrl', function(Auth) {
        console.log(Auth._currentUser); // => null

        // Log in user...

        console.log(Auth._currentUser); // => {id: 1, ect: '...'}
    });
```


### Auth.isAuthenticated()

`Auth.isAuthenticated()` is a helper method to determine if a
currentUser is logged in with Auth.

```javascript
angular.module('myModule', ['Devise']).
    controller('myCtrl', function(Auth) {
        console.log(Auth.isAuthenticated()); // => false

        // Log in user...

        console.log(Auth.isAuthenticated()); // => true
    });
```

### Auth.login(creds, config)

Use `Auth.login()` to authenticate with the server. Keep in mind,
credentials are sent in plaintext; use a SSL connection to secure them.
`creds` is an object which should contain any credentials needed to
authenticate with the server. `Auth.login()` will return a promise that
will resolve to the logged-in user. See
[Auth.parse(response)](#authparseresponse) to customize how the response
is parsed into a user.

Upon a successful login, two events will be broadcast, `devise:login` and
`devise:new-session`, both with the currentUser as the argument. New-Session will only
be broadcast if the user was logged in by `Auth.login({...})`. If the server
has a previously authenticated session, only the login event will be broadcast.

Pass any additional config options you need to provide to `$http` with
`config`.

```javascript
angular.module('myModule', ['Devise']).
    controller('myCtrl', function(Auth) {
        var credentials = {
            email: 'user@domain.com',
            password: 'password1'
        };
        var config = {
            headers: {
                'X-HTTP-Method-Override': 'POST'
            }
        };

        Auth.login(credentials, config).then(function(user) {
            console.log(user); // => {id: 1, ect: '...'}
        }, function(error) {
            // Authentication failed...
        });

        $scope.$on('devise:login', function(event, currentUser) {
            // after a login, a hard refresh, a new tab
        });

        $scope.$on('devise:new-session', function(event, currentUser) {
            // user logged in by Auth.login({...})
        });
    });
```

By default, `login` will POST to '/users/sign_in.json' using the
resource name `user`. The path, HTTP method, and resource name used to
login are configurable using:

```javascript
angular.module('myModule', ['Devise']).
    config(function(AuthProvider) {
        AuthProvider.loginPath('path/on/server.json');
        AuthProvider.loginMethod('GET');
        AuthProvider.resourceName('customer');
    });
```

### Auth.logout()

Use `Auth.logout()` to de-authenticate from the server. `Auth.logout()`
returns a promise that will be resolved to the old currentUser. Then a
`devise:logout` event will be broadcast with the old currentUser as the argument.

Pass any additional config options you need to provide to `$http` with
`config`.

```javascript
angular.module('myModule', ['Devise']).
    controller('myCtrl', function(Auth) {
        var config = {
            headers: {
                'X-HTTP-Method-Override': 'DELETE'
            }
        };
        // Log in user...
        // ...
        Auth.logout(config).then(function(oldUser) {
            // alert(oldUser.name + "you're signed out now.");
        }, function(error) {
            // An error occurred logging out.
        });

        $scope.$on('devise:logout', function(event, oldCurrentUser) {
            // ...
        });
    });
```

By default, `logout` will DELETE to '/users/sign_out.json'. The path and
HTTP method used to logout are configurable using:

```javascript
angular.module('myModule', ['Devise']).
    config(function(AuthProvider) {
        AuthProvider.logoutPath('path/on/server.json');
        AuthProvider.logoutMethod('GET');
    });
```

### Auth.parse(response)

This is the method used to parse the `$http` response into the appropriate
user object. By default, it simply returns `response.data`. This can be
customized either by specifying a parse function during configuration:

```javascript
angular.module('myModule', ['Devise']).
    config(function(AuthProvider) {
        // Customize user parsing
        // NOTE: **MUST** return a truth-y expression
        AuthProvider.parse(function(response) {
            return response.data.user;
        });
    });
```

or by directly overwriting it, perhaps when writing a custom version of
the Auth service which depends on another service:

```javascript
angular.module('myModule', ['Devise']).
  factory('User', function() {
    // Custom user factory
  }).
  factory('CustomAuth', function(Auth, User) {
    Auth['parse'] = function(response) {
      return new User(response.data);
    };
    return Auth;
  });
```

### Auth.register(creds)

Use `Auth.register()` to register and authenticate with the server. Keep
in mind, credentials are sent in plaintext; use a SSL connection to
secure them. `creds` is an object that should contain any credentials
needed to register with the server. `Auth.register()` will return a
promise that will resolve to the registered user. See
[Auth.parse(response)](#authparseresponse) to customize how the response
is parsed into a user. Then a `devise:new-registration` event will be
broadcast with the user object as the argument.

Pass any additional config options you need to provide to `$http` with
`config`.

```javascript
angular.module('myModule', ['Devise']).
    controller('myCtrl', function(Auth) {
        var credentials = {
            email: 'user@domain.com',
            password: 'password1',
            password_confirmation: 'password1'
        };
        var config = {
            headers: {
                'X-HTTP-Method-Override': 'POST'
            }
        };

        Auth.register(credentials, config).then(function(registeredUser) {
            console.log(registeredUser); // => {id: 1, ect: '...'}
        }, function(error) {
            // Registration failed...
        });

        $scope.$on('devise:new-registration', function(event, user) {
            // ...
        });
    });
```

By default, `register` will POST to '/users.json' using the resource
name `user`. The path, HTTP method, and resource name used to register
are configurable using:

```javascript
angular.module('myModule', ['Devise']).
    config(function(AuthProvider) {
        AuthProvider.registerPath('path/on/server.json');
        AuthProvider.registerMethod('GET');
        AuthProvider.resourceName('customer');
    });
```


### Auth.sendResetPasswordInstructions(creds)

Use `Auth.sendResetPasswordInstructions()` to send reset password mail to user. Keep
in mind, credentials are sent in plaintext; use a SSL connection to
secure them. `creds` is an object that should contain the email associated with the user.
`Auth.sendResetPasswordInstructions()` will return a promise with no params.
Then a `devise:send-reset-password-instructions-successfully` event will be broadcast.

```javascript
angular.module('myModule', ['Devise']).
    controller('myCtrl', function(Auth) {
        var parameters = {
            email: 'user@domain.com'
        };

        Auth.sendResetPasswordInstructions(parameters).then(function() {
            // Sended email if user found otherwise email not sended...
        });

        $scope.$on('devise:send-reset-password-instructions-successfully', function(event) {
            // ...
        });
    });
```

By default, `sendResetPasswordInstructions` will POST to '/users/password.json'. The path and HTTP
method used to send the reset password instructions are configurable using:

```javascript
angular.module('myModule', ['Devise']).
    config(function(AuthProvider) {
        AuthProvider.sendResetPasswordInstructionsPath('path/on/server.json');
        AuthProvider.sendResetPasswordInstructionsMethod('POST');
    });
```

### Auth.resetPassword(creds)

Use `Auth.resetPassword()` to reset user password. Keep
in mind, credentials are sent in plaintext; use a SSL connection to
secure them. `creds` is an object that should contain password, password_confirmation and reset_password_token.
`Auth.resetPassword()` will return a
promise that will resolve to the new user data. See
[Auth.parse(response)](#authparseresponse) to customize how the response
is parsed into a user. Then a `devise:reset-password-successfully` event will be broadcast.

```javascript
angular.module('myModule', ['Devise']).
    controller('myCtrl', function(Auth) {
        var parameters = {
            password: 'new_password',
            password_confirmation: 'new_password',
            reset_password_token: 'reset_token',
        };

        Auth.resetPassword(parameters).then(function(new_data) {
            console.log(new_data); // => {id: 1, ect: '...'}
        }, function(error) {
            // Reset password failed...
        });

        $scope.$on('devise:reset-password-successfully', function(event) {
            // ...
        });
    });
```

By default, `resetPassword` will PUT to '/users/password.json'. The path and HTTP
method used to reset password are configurable using:

```javascript
angular.module('myModule', ['Devise']).
    config(function(AuthProvider) {
        AuthProvider.resetPasswordPath('path/on/server.json');
        AuthProvider.resetPasswordMethod('PUT');
    });
```


Interceptor
-----------

AngularDevise comes with a [$http
Interceptor](http://docs.angularjs.org/api/ng.$http#description_interceptors)
that may be enabled using the `interceptAuth` config. Its purpose is to
listen for `401 Unauthorized` responses and give you the ability to
seamlessly recover. When it catches a 401, it will:
 1. create a deferred
 2. broadcast a `devise:unauthorized` event passing:
    - the ajax response
    - the deferred
 3. return the deferred's promise

Since the deferred is passed to the `devise:unauthorized` event, you are
free to resolve it (and the request) inside of the event listener. For
instance:

```javascript
angular.module('myModule', []).
    controller('myCtrl', function($scope, Auth, $http) {
        // Guest user

        // Catch unauthorized requests and recover.
        $scope.$on('devise:unauthorized', function(event, xhr, deferred) {
            // Disable interceptor on _this_ login request,
            // so that it too isn't caught by the interceptor
            // on a failed login.
            var config = {
                interceptAuth: false
            };

            // Ask user for login credentials
            Auth.login(credentials, config).then(function() {
                // Successfully logged in.
                // Redo the original request.
                return $http(xhr.config);
            }).then(function(response) {
                // Successfully recovered from unauthorized error.
                // Resolve the original request's promise.
                deferred.resolve(response);
            }, function(error) {
                // There was an error logging in.
                // Reject the original request's promise.
                deferred.reject(error);
            });
        });

        // Request requires authorization
        // Will cause a `401 Unauthorized` response,
        // that will be recovered by our listener above.
        $http.delete('/users/1', {
            interceptAuth: true
        }).then(function(response) {
            // Deleted user 1
        }, function(error) {
            // Something went wrong.
        });
    });
```

The Interceptor can be enabled globally or on a per-request basis using the
`interceptAuth` setting on the AuthIntercept provider.

```javascript
angular.module('myModule', ['Devise']).
    config(function(AuthInterceptProvider) {
        // Intercept 401 Unauthorized everywhere
        AuthInterceptProvider.interceptAuth(true);
    }).
    controller('myCtrl', function($http) {
        // Disable per-request
        $http({
            url: '/',
            interceptAuth: false,
            // ...
        });
    });
```


AuthProvider
------------

By default, AngularDevise uses the following HTTP methods/paths:

| Method   | HTTP Method | HTTP Path            |
| -------- | ----------- | -------------------- |
| login    | POST        | /users/sign_in.json  |
| logout   | DELETE      | /users/sign_out.json |
| register | POST        | /users.json          |
| sendResetPasswordInstructions | POST | /users/password.json |
| resetPassword | POST   | /users/password.json |

All credentials will be under the `users` namespace, and the following
parse function will be used to parse the response:

```javascript
function(response) {
    return response.data;
};
```

All of these can be configured using a `.config` block in your module.

```javascript
angular.module('myModule', ['Devise']).
    config(function(AuthProvider, AuthInterceptProvider) {
        // Customize login
        AuthProvider.loginMethod('GET');
        AuthProvider.loginPath('/admins/login.json');

        // Customize logout
        AuthProvider.logoutMethod('POST');
        AuthProvider.logoutPath('/user/logout.json');

        // Customize register
        AuthProvider.registerMethod('PATCH');
        AuthProvider.registerPath('/user/sign_up.json');

        // Customize the resource name data use namespaced under
        // Pass false to disable the namespace altogether.
        AuthProvider.resourceName('customer');

        // Also you can change host URL for backend calls
        // (for example if it's on another server than your angular app)
        AuthProvider.baseUrl('http://localhost:3000');

        // Customize user parsing
        // NOTE: **MUST** return a truth-y expression
        AuthProvider.parse(function(response) {
            return response.data.user;
        });

        // Intercept 401 Unauthorized everywhere
        // Enables `devise:unauthorized` interceptor
        AuthInterceptProvider.interceptAuth(true);
    });
```


Credits
-------

[![Cloudspace](http://cloudspace.com/assets/images/logo.png)](http://cloudspace.com/)

AngularDevise is maintained by [Cloudspace](http://cloudspace.com/), and
is distributed under the [MIT License](/LICENSE.md).
