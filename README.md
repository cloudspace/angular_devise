AngularDevise
=============

A small AngularJS Service to interact with Devise Authentication.


Requirements
------------

This service requires Devise to respond to JSON. To do that, simply add

```ruby
# app/controllers/application_controller.rb
class ApplicationController < ActionController::Base
  respond_to :html, :json
  # ...
end
```


Downloading
-----------

AngularDevise is registered as `angular-devise` in
[bower](http://sindresorhus.com/bower-components/#!/search/angular-devise).
Use either `angular-devise/lib/devise.js` or `angular-devise/lib/devise-min.js`

```bash
bower install --save angular-devise
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

### Auth._currentUser

`Auth._currentUser` will be either `null` or the currentUser's
object representation. It is not recommended to directly access
`Auth._currentUser`, but instead use
[Auth.currentUser()](authcurrentuser).

```javascript
angular.module('myModule', ['Devise']).
    controller('myCtrl', function(Auth) {
        console.log(Auth._currentUser); // => null

        // Log in user...

        console.log(Auth._currentUser); // => {id: 1, ect: '...'}
    });
```

### Auth.currentUser()

`Auth.currentUser()` returns a promise that will be resolved into
the currentUser. There are three possible outcomes:

 1. Auth has authenticated a user, and will resolve with it
 2. Auth has not authenticated a user but the server has a previously
    authenticated session, Auth will attempt to retrieve that
    session and resolve with its user.
 3. Neither Auth nor the server has an authenticated session,
    and will reject with an unauthenticated error.

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

### Auth.login(opts)

Use `Auth.login()` to authenticate with the server. Keep in mind,
credentials are sent in plaintext; use a SSL connection to secure them.
`opts` is an object which should contain the email and password of the
user trying to login. `Auth.login()` will return a promise that will resolve
to the logged-in user.

```javascript
angular.module('myModule', ['Devise']).
    controller('myCtrl', function(Auth) {
        var credentials = {
            email: 'user@domain.com',
            password: 'password1'
        };

        Auth.login(credentials).then(function(user) {
            // You have a user!
        }, function(error) {
            // Authentication failed...
        });
    });
```

By default, `login` will POST to '/users/sign_in.json'. The path and
HTTP method used to login are configurable using:

```javascript
angular.module('myModule', ['Devise']).
    config(function(AuthProvider) {
        AuthProvider.loginPath('path/on/server.json');
        AuthProvider.loginMethod('GET');
    });
```

### Auth.logout()

Use `Auth.logout()` to de-authenticate from the server. `Auth.logout()`
returns a promise that will be resolved to the old currentUser.

```javascript
angular.module('myModule', ['Devise']).
    controller('myCtrl', function(Auth) {
        // Log in user...
        // ...
        Auth.logout().then(function(oldUser) {
            // alert(oldUser.name + "you're signed out now.");
        });
    });
```

By default, `logout` will DELETE to '/users/sign_out.json'. The path
and HTTP method used to logout are configurable using:

```javascript
angular.module('myModule', ['Devise']).
    config(function(AuthProvider) {
        AuthProvider.logoutPath('path/on/server.json');
        AuthProvider.logoutMethod('GET');
    });
```

### Auth.register(opts)

Use `Auth.register()` to register and authenticate with the server. Keep
in mind, credentials are sent in plaintext; use a SSL connection to
secure them. `opts` is an object that should contain at least an email
and password. Additionally, `opts.password_confirmation` may be
provided, though it will default to `opts.password` if it is not.
`Auth.register()` will return a promise that will resolve to the
registered user.

```javascript
angular.module('myModule', ['Devise']).
    controller('myCtrl', function(Auth) {
        var credentials = {
            email: 'user@domain.com',
            password: 'password1',
            password_confirmation: 'password1' // though it will default
                                               // to credentials.password
        };

        Auth.register(credentials).then(function(registeredUser) {
            // Registration successful!
        }, function(error) {
            // Registration failed...
        });
    });
```

By default, `register` will POST to '/users.json'. The path and HTTP
method used to login are configurable using

```javascript
angular.module('myModule', ['Devise']).
    config(function(AuthProvider) {
        AuthProvider.registerPath('path/on/server.json');
        AuthProvider.registerMethod('GET');
    });
```


Configuration
-------------

By default, AngularDevise uses the following HTTP methods/paths:
 - **login**: POST /users/sign_in.json
 - **logout**: DELETE /users/sign_out.json
 - **register**: POST /users.json

All of these can be configured using a `.config` block in your module.

```javascript
angular.module('myModule', ['Devise']).
    config(function(AuthProvider) {
        // Customise login
        AuthProvider.loginMethod('GET');
        AuthProvider.loginPath('/admins/login.json');

        // Customise logout
        AuthProvider.logoutMethod('POST');
        AuthProvider.logoutPath('/user/logout.json');

        // Customise register
        AuthProvider.registerMethod('PATCH');
        AuthProvider.registerPath('/user/sign_up.json');
    });
```
