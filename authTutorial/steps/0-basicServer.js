// curl -X GET http://localhost:3001 -v

import express from 'express'

const app = express();

app.get('/', (req,res) => {
    console.log('Inside the homepage callback function')
    res.send(`You have hit the home page.\n`)
})

app.listen(3001, () => { console.log('Listening on localhost:3001')})