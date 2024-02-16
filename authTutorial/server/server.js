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
                // if (password != user.password){
                //     console.log('Invalid credentials')
                //     return done(null, false, {message: 'Invalid credentials.\n'})
                // }
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
        res.send('You are authenticated on this endpoint\n')
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

