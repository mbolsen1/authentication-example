import express from 'express'
import {v4 as uuidv4} from 'uuid'
import session from 'express-session'
import expressSession from 'express-session'
import sessionFileStore from 'session-file-store'
import bodyParser from 'body-parser'
import passport from 'passport'
import passportLocal from 'passport-local'

const FileStore = sessionFileStore(expressSession) 
const LocalStrategy = passportLocal.Strategy

const users = [{id: '2f24vvg', email: 'test@test.com', password: 'password'}]

passport.use(new LocalStrategy(
    {usernameField: 'email'},
    (email, password, done) => {
        console.log('Inside local strategy callback')
        const user = users[0] 
        if(email === user.email && password === user.password){
            console.log('Local strategy returned true')
            return done(null, user)
        }
    }
))

passport.serializeUser((user, done) => {
    console.log('Inside serializeUser callback.  User id is saved to the session file store here')
    done(null, user.id);
})

// deconstruct the user
passport.deserializeUser((id,done)=>{
    console.log('Inside deserialize callback')
    console.log(`The user id passport saved in the session file store is: ${id}`)
    const user = users[0].id === id ? users[0] : false;  // we would normally do a db lookup here too.
    done(null, user);
})

const app = express();

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
app.use(passport.initialize())
app.use(passport.session())

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
    passport.authenticate('local', (err, user, info) => {
        console.log('Inside passport.authenticate() callback')
        console.log(`req.session.passport: ${JSON.stringify(req.session.passport)}`)
        console.log(`req.user: ${JSON.stringify(req.user)}`)
        req.login(user, (err) => { 
            console.log('Inside req.login() callback')
            console.log(`req.session.passport:  ${JSON.stringify(req.session.passport)}`)
            console.log(`req.user: ${JSON.stringify(req.user)}`)
            return res.send('You were authenticated & logged in!\n')
        })
    })(req, res, next);
})

app.get('/authrequired', (req,res) => {
    console.log('Inside GET /authrequired callback')
    console.log(`User authenticated? ${req.isAuthenticated()}`)  // check to see if isAuthenticated is true.  This request function was added by passport to the req object.
    if(req.isAuthenticated()){
        res.send('You are authenticated on this endpoint\n') // The user has been authenticated
    } else {
        res.redirect('/') // if the user is not authorized then send them to the homepage
    }
})

app.listen(3001, () => { console.log('Listening on localhost:3001')})



/**
 * 
 * Lets start by just going to the homepage
 * curl -X GET http://localhost:3001 -c cookie-file.txt
 * 
 * Lets go to the authrequired route (-L means to follow redirects)
 * curl -X GET http://localhost:3001/authrequired -b cookie-file.txt -L
 * 
 * login did not work, so lets login
 * 
 * curl -X POST http://localhost:3001/login -c cookie-file.txt -H 'Content-Type: application/json' -d '{"email":"test@test.com", "password":"password"}'
 * -> successfully logged in
 * 
 * Now try the authrequired route again
 * curl -X GET http://localhost:3001/authrequired -b cookie-file.txt -L
 * Horray successful at getting to this endpoint
 * 
 * The deserializeUser callback function was able to match our session id to the session-file-store adn retrieve the user id
 */