/**
 * This step we add the file store to the session manager
 * 
 * cd client
 * curl -X GET http://localhost:3001 -b cookie-file.txt -v
 */
import express from 'express'
import {v4 as uuidv4} from 'uuid'
import session from 'express-session';
import expressSession from 'express-session';

import sessionFileStore from 'session-file-store'; // add a simple file store system

const FileStore = sessionFileStore(expressSession)

const app = express();

app.use(session({
    genid: (req) => {
        console.log('Inside the session middleware')
        console.log(req.sessionId)
        return uuidv4()
    },
    store: new FileStore(), // this is the place we tell express-session where the session file store is.
    secret: 'matt is the coolest',
    resave: false,
    saveUninitialized: true
}))

app.get('/', (req,res) => {
    console.log('Inside the homepage callback function')
    res.send(`You have hit the home page.\n`)
})

app.listen(3001, () => { console.log('Listening on localhost:3001')})
