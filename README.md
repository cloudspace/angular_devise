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
Use either `angular-devise/lib/devise.js` or
`angular-devise/lib/devise-min.js`

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

### Auth.currentUser()

`Auth.currentUser()` returns a promise that will be resolved into the
currentUser. There are three possible outcomes:

 1. Auth has authenticated a user, and will resolve with it
 2. Auth has not authenticated a user but the server has a previously
    authenticated session, Auth will attempt to retrieve that session
    and resolve with its user.
 3. Neither Auth nor the server has an authenticated session, and will
    reject with an unauthenticated error.

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

### Auth.login(creds)

Use `Auth.login()` to authenticate with the server. Keep in mind,
credentials are sent in plaintext; use a SSL connection to secure them.
`creds` is an object which should contain any credentials needed to
authenticate with the server. `Auth.login()` will return a promise that
will resolve to the logged-in user. See
[AuthProvider.parse()](#authprovider) for parsing the user into a usable
object.

```javascript
angular.module('myModule', ['Devise']).
    controller('myCtrl', function(Auth) {
        var credentials = {
            email: 'user@domain.com',
            password: 'password1'
        };

        Auth.login(credentials).then(function(user) {
            console.log(user); // => {id: 1, ect: '...'}
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
        }, function(error) {
            // An error occurred logging out.
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

### Auth.register(creds)

Use `Auth.register()` to register and authenticate with the server. Keep
in mind, credentials are sent in plaintext; use a SSL connection to
secure them. `creds` is an object that should contain any credentials
needed to register with the server. `Auth.register()` will return a
promise that will resolve to the registered user. See
[AuthProvider.parse()](#authproviderparse) for parsing the user into a
usable object.

```javascript
angular.module('myModule', ['Devise']).
    controller('myCtrl', function(Auth) {
        var credentials = {
            email: 'user@domain.com',
            password: 'password1',
            password_confirmation: 'password1'
        };

        Auth.register(credentials).then(function(registeredUser) {
            console.log(registeredUser); // => {id: 1, ect: '...'}
        }, function(error) {
            // Registration failed...
        });
    });
```

By default, `register` will POST to '/users.json'. The path and HTTP
method used to register are configurable using:

```javascript
angular.module('myModule', ['Devise']).
    config(function(AuthProvider) {
        AuthProvider.registerPath('path/on/server.json');
        AuthProvider.registerMethod('GET');
    });
```


AuthProvider
------------

By default, AngularDevise uses the following HTTP methods/paths:
 - **login**: POST /users/sign_in.json
 - **logout**: DELETE /users/sign_out.json
 - **register**: POST /users.json

And the following parse function:

```javascript
function parse(response) {
    var user = response.data;
    return user;
}
```

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

        // Customize user parsing
        // NOTE: **MUST** return a truth-y expression
        AuthProvider.parse(function(response) {
            return new User(response.data);
        });
    });
```
