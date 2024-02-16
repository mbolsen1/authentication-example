Steps:
- Build a basic server
- Create a unique id for a user and print that out
- Add session middleware and create that cookie for the client.  This goes in before the route.
- Add a file store for the session manager
- add GET and POST /login routes.  Add middleware to parse json body
- add passport middleware to help with authentication.  call it in the /login POST route
- Deseriaize the user from the session id, create a /authrequired route that will use isAuthenticated(), update login flow
- Hook up a database and handle incorrect credentials
- Handle encrypted passwords
- add an expiration to the cookie


Ideas for where to keep going with this:
- logout - req.session.destroy()
- add a readme
- explain cookies are stored on the client and sessions are stored on the server.
- store secrets in the .env file
- make a script to go get the secrets stored somewhere else before the server is started
- register endpoint
- password reset endpoint
- folder cleanup
- Terraform a server
- Terraforma  database
- make an actual frontend page for each route
- Hook up a real database to the session store
- hook up a real db for the users table
- authorization to see content (permission levels)

https://www.youtube.com/watch?v=IPAvfcodcI8

