// curl -X GET http://localhost:3001 -v
// notice the uuid being logged

import express from 'express'
import {v4 as uuidv4} from 'uuid' // package to create a unique id

const app = express();

app.get('/', (req,res) => {
    console.log('Inside the homepage callback function')
    const uniqueId = uuidv4();
    res.send(`You have hit the home page. UniqueId: ${uniqueId}\n`)
})

app.listen(3001, () => { console.log('Listening on localhost:3001')})