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
