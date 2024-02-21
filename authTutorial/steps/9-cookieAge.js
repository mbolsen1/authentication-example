/**
 * Adding a maxAge to the session
 * 
 * by adding the cookie: {maxAge: <milleseconds>} session initializer/creator.
 * 
 * In this example we add an expiration of 10 seconds (10000 milleseconds) and then console.log that on the return.
 * 
 * delete the client cookie file and the session store
 * curl http://localhost:3001/login -c cookie-file.txt -H 'Content-Type: application/json' -d '{"email":"test@test.com", "password":"password"}' -L
 * -> this will output about ~9.988 seconds left to expire on the cookie
 * 
 * curl -X GET http://localhost:3001/authrequired -b cookie-file.txt -L
 * -> If it was done within 10 seconds then it will return the authrequired route with the age left on the session.
 * -> If done after 10 seconds the session has expired, so it will redirect to the home.
 * 
 */

/**
 * Handle encrypted passwords
 * Saving un-hashed passwords is a bad idea.  We as the admin of this login system should never really be able to tell the passwords of our users.
 * 
 * `yarn add bcrypt-nodejs`
 * 
 * 1. A user will send their password as plaintext
 * 2. This will be hashed and compared to what we have in the database
 * 3. add hashed passwords to the db (see documentation on salting passwords)
 * 
 * try logging in again and it should succeed
 * curl http://localhost:3001/login -c cookie-file.txt -H 'Content-Type: application/json' -d '{"email":"test@test.com", "password":"password"}' -L
 * 
 * To create text that is hashed go to the play endpoint /hashthis
 * curl http://localhost:3001/saltthis -H 'Content-Type: application/json' -d '{"text": "mattIsReallyCool"}'
 */

import express from 'express'
import {v4 as uuidv4} from 'uuid'
import session from 'express-session'
import expressSession from 'express-session'
import sessionFileStore from 'session-file-store'
import bodyParser from 'body-parser'
import passport from 'passport'
import passportLocal from 'passport-local'
import axios from 'axios'
import bcrypt from 'bcrypt'

const FileStore = sessionFileStore(expressSession) 
const LocalStrategy = passportLocal.Strategy

const users = [{id: '2f24vvg', email: 'test@test.com', password: 'password'}]

passport.use(new LocalStrategy(
    {usernameField: 'email'},
    (email, password, done) => {
        console.log('Inside local strategy callback')
        console.log('fetch user with this email', email)
        axios
            .get(`http://localhost:5000/users?email=${email}`)
            .then(res=> {
                const user = res.data[0]
                if (!user){
                    console.log('No user found with that Id')
                    return done(null, false, {message: 'Invalid credentials.\n'})
                }
                if (!bcrypt.compareSync(password, user.password)){
                    console.log('Invalid credentials')
                    return done(null, false, {message: 'Invalid credentials.\n'})
                }
                console.log('User found - email and password match')
                return done(null, user)
            })
        .catch(eror => done(error))
    }
))

passport.serializeUser((user, done) => {
    console.log('Inside serializeUser callback.  User id is saved to the session file store here')
    done(null, user.id);
})

passport.deserializeUser((id,done)=>{
    console.log('Inside deserialize callback')
    axios
        .get(`http://localhost:5000/users/${id}`)
        .then(res=> done(null, res.data))
        .catch(error => done(error, false))
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
    cookie: { maxAge: 10000}, //milliseconds fo the cookie to live.
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
        if (info) { return res.send(info.message) }
        if (err) { return next(err) }
        if (!user) { return res.redirect('/login') }
        req.login(user, (err) => { 
            if (err) {return next(err)}
            return res.redirect('/authrequired')
        })
    })(req, res, next);
})

app.get('/authrequired', (req,res) => {
    console.log('Inside GET /authrequired callback')
    console.log(`User authenticated? ${req.isAuthenticated()}`)
    if(req.isAuthenticated()){
        // If someone is browsing the site then it would be pretty annoying to have the session expire on them. Here are two things to consider with that.
        // req.session.cookie.maxAge = 10000 // <- This is possible if you want to extend the age of the cookie
        // req.session.touch() // This will reset the maxAge to its original value
        res.send(`You are authenticated on this endpoint.  Cookie will expire in ${req.session.cookie.maxAge / 1000} seconds\n`)
    } else {
        res.redirect('/')
    }
})

// Example of converting to a hash
app.post('/saltthis', (req, res)=> {
    const saltRounds = 10
    const {text} = req.body
    bcrypt.hash(text, saltRounds, (err, hash) => {
        res.status(200).json({message: `salted text: ${hash}`})
    })
})

app.listen(3001, () => { console.log('Listening on localhost:3001')})