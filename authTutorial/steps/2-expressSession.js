// curl -X GET http://localhost:3001 -v
// notice the 'set-cookie:...' is now present.

// if we were using a browser it would save the cookie automatically, but since we are using curl we need to tell it to save the cookie
// cd client 
// curl -X GET http://localhost:3001 -c cookie-file.txt
// - this will create a file and save the cookie there
// curl -X GET http://localhost:3000 -b cookie-file.txt
// - this will send the cookie in the request

/**
 * Now the problem is that the server is saving that session 'locally' and if our server went down then that session store would be lost. 
 * We need to provide a session store for the server so that sessions keep working after restarts
 *  
 * */  

import express from 'express'
import {v4 as uuidv4} from 'uuid'
import session from 'express-session'; // session middleware

const app = express();

app.use(session({
    genid: (req) => {
        console.log('Inside the session middleware')
        console.log(req.sessionId)
        return uuidv4()
    },
    secret: 'matt is the coolest', // this should be randomly generated and stored in the .env file
    resave: false, // force the session to be saved back to the session store even if there was no modification made
    saveUninitialized: true // if a session is 'uninitialized' (new) then save it to the store.  In the future false will be default because some laws require people to accept saving cookies.
}))

app.get('/', (req,res) => {
    console.log('Inside the homepage callback function')
    // const uniqueId = uuidv4();
    // res.send(`You have hit the home page. UniqueId: ${uniqueId}\n`)
    res.send(`You have hit the home page.\n`)
})

app.listen(3001, () => { console.log('Listening on localhost:3001')})