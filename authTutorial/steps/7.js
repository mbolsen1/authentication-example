import express from 'express'
import {v4 as uuidv4} from 'uuid'
import session from 'express-session'
import expressSession from 'express-session'
import sessionFileStore from 'session-file-store'
import bodyParser from 'body-parser'
import passport from 'passport'
import passportLocal from 'passport-local'
import axios from 'axios'

const FileStore = sessionFileStore(expressSession) 
const LocalStrategy = passportLocal.Strategy

const users = [{id: '2f24vvg', email: 'test@test.com', password: 'password'}]

passport.use(new LocalStrategy(
    {usernameField: 'email'},
    (email, password, done) => {
        console.log('Inside local strategy callback')
        // const user = users[0] 
        // if(email === user.email && password === user.password){
        //     console.log('Local strategy returned true')
        //     return done(null, user)
        // }
        console.log('fetch user with this email', email)
        axios
            .get(`http://localhost:5000/users?email=${email}`) // We call the database and get and user with the email we are loking for
            .then(res=> {
                const user = res.data[0]
                if (!user){ // If there isn't any users, then send backa failing message
                    console.log('No user found with that Id')
                    return done(null, false, {message: 'Invalid credentials.\n'})
                }
                if (password != user.password){ // If the password doesn't match the user then send back a fail
                    console.log('Invalid credentials')
                    return done(null, false, {message: 'Invalid credentials.\n'})
                }
                console.log('User found - email and password match')
                return done(null, user) // A user was found and it has the correct password
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
    // console.log(`The user id passport saved in the session file store is: ${id}`)
    // const user = users[0].id === id ? users[0] : false; 
    // done(null, user);
    axios
        .get(`http://localhost:5000/users/${id}`) // Get the user from the db with this id
        .then(res=> done(null, res.data))   // return that user if a match is found
        .catch(error => done(error, false)) // no match, so return the error
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
        // console.log('Inside passport.authenticate() callback')
        // console.log(`req.session.passport: ${JSON.stringify(req.session.passport)}`)
        // console.log(`req.user: ${JSON.stringify(req.user)}`)
        if (info) { return res.send(info.message) } // from the local startegy if there is a message (i.e. bad credentials) then send that
        if (err) { return next(err) } // if there is an error, then forward that error to the next function
        if (!user) { return res.redirect('/login') } // if there is no user then go to the login page
        req.login(user, (err) => { 
            // console.log('Inside req.login() callback')
            // console.log(`req.session.passport:  ${JSON.stringify(req.session.passport)}`)
            // console.log(`req.user: ${JSON.stringify(req.user)}`)
            // return res.send('You were authenticated & logged in!\n')
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

app.listen(3001, () => { console.log('Listening on localhost:3001')})




/**
 * Hook up a database and handle incorrect credentials
 * 
 * 1. Create a new database folder at the same level as the server and client folders
 * 2. Initialize npm or yarn
 * 3. `yarn add json-server` <- This package will allow us to use a json file as a db and we can use REST to communicate with it!
 * 4. `touch db.json` and put some sample data into that file.  id, email, password.  Pretty cool.  Go to the suggested url and explore
 * 
 * 5. `yarn add axios` to the server
 * 6. Lets add some database calls within out Local Strategy and the deserialize user.
 * 7. fix up the POST /login route to handle the new messages from the local authenticate strategy and the deserialize user
 * 
 * curl http://localhost:3001/login -c cookie-file.txt -H 'Content-Type: application/json' -d '{"email":"test@test.com", "password":"password"}' -L
 * 
 */