/**
 * This is where we add passport, which is a middleware that will help with authentication.
 * 
 * 1. Add passport and passport local strategy
 * 
 * When a user POSTs their login information to the /login route, passport.authenticate(<strategy>, <callback function>)
 * - The strategy is which 'style' of passport you are using.  Local is doing everything manual.  Google, Twitter, etc will use external OAuth systems.
 * - The callback function will give us access to the user object if authentication is successful and an error if it is not.
 * 
 * cd client
 * curl -X POST  http://localhost:3001/login -c cookie-file.txt -H 'Content-Type: application/json' -d '{"email":"test@test.com", "password":"password"}'
 * 
 * Note: that the req.session.passport and req.user are undefined and then later they are defined in the req.login function
 */

import express from 'express'
import {v4 as uuidv4} from 'uuid'
import session from 'express-session'
import expressSession from 'express-session'
import sessionFileStore from 'session-file-store'
import bodyParser from 'body-parser'
import passport from 'passport' // import
import passportLocal from 'passport-local' //import

const FileStore = sessionFileStore(expressSession) // convert to be used in the module
const LocalStrategy = passportLocal.Strategy

const users = [{id: '2f24vvg', email: 'test@test.com', password: 'password'}] // hard code the users - later this will be out into a database

// Configure passport to use the local strategy
passport.use(new LocalStrategy(
    {usernameField: 'email'},
    (email, password, done) => {
        console.log('Inside local strategy callback')
        // This is where we would make a call to the db to figure out if this user with this password exists
        const user = users[0] // for now we are assuming there is a match and it returns the user information
        if(email === user.email && password === user.password){
            console.log('Local strategy returned true')
            return done(null, user)  // done(<error>, <success>)
        }
    }
))

// tell passport to serialize the user
// this will save
passport.serializeUser((user, done) => {
    console.log('Inside serializeUser callback.  User id is saved to the session file store here')
    done(null, user.id);
})

const app = express();

// add & configure the middleware
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())
app.use(session({
    genid: (req) => {
        console.log('Inside the session middleware')
        console.log(req.sessionId)
        return uuidv4()
    },
    store: new FileStore(),
    secret: 'matt is the coolest',
    resave: false,
    saveUninitialized: true
}))
app.use(passport.initialize())  // initialize passport as middleware
app.use(passport.session()) //

app.get('/', (req,res) => {
    console.log('Inside the homepage callback function')
    res.send(`You have hit the home page.\n`)
})

app.get('/login',(req,res)=>{
    console.log('Inside GET /login callback function')
    console.log(req.sessionId)
    res.send(`You got the login page!\n`)
})

app.post('/login', (req, res, next)=>{
    console.log('Inside the POST /login callback function')
    passport.authenticate('local', (err, user, info) => { // tell passport to use the 'local' strategy that is configured above
        console.log('Inside passport.authenticate() callback')
        console.log(`req.session.passport: ${JSON.stringify(req.session.passport)}`)
        console.log(`req.user: ${JSON.stringify(req.user)}`)
        req.login(user, (err) => { 
            // Call the serializeUser.  It will save the user id in the session-file-store, save the user id in the req object as req.session.passport, and add the user object to the req object as req.user
            // On subsequent requests to authorized routes we can retrieve the user object without having them login again
            console.log('Inside req.login() callback')
            console.log(`req.session.passport:  ${JSON.stringify(req.session.passport)}`)
            console.log(`req.user: ${JSON.stringify(req.user)}`)
            return res.send('You were authenticated & logged in!\n')
        })
    })(req, res, next);
})

app.listen(3001, () => { console.log('Listening on localhost:3001')})