/**
 * We added a /login GET and POST route 
 * the GET will serve the page
 * the POST will do the loggin in
 * 
 * We also added the bodyParser so the body of our curl will be parsed
 * 
 * curl -X POST http://localhost:3001/login -b cookie-file.txt -H 'Content-Type: application/json' -d '{"email":"test@test.com", "password":"password"}'
 */
import express from 'express'
import {v4 as uuidv4} from 'uuid'
import session from 'express-session';
import expressSession from 'express-session';
import bodyParser from 'body-parser'

import sessionFileStore from 'session-file-store';

const FileStore = sessionFileStore(expressSession)

const app = express();

// add & configure the middleware
app.use(bodyParser.urlencoded({extended: false})) // this will parse urlencoded body.  This is more likely once an actual frontend exists.
app.use(bodyParser.json()) // parse json sent in the body
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

app.get('/', (req,res) => {
    console.log('Inside the homepage callback function')
    res.send(`You have hit the home page.\n`)
})

//create the login GET and POST routes
app.get('/login',(req,res)=>{
    console.log('Inside GET /login callback function')
    console.log(req.sessionId)
    res.send(`You got the login page!\n`)
})

app.post('/login', (req, res)=>{
    console.log('Inside the POST /login callback function')
    console.log(req.body)
    res.send(`You posted to the login page\n`)
})

app.listen(3001, () => { console.log('Listening on localhost:3001')})


