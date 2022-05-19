const express = require('express')
var bodyParser = require('body-parser')
const mongoose = require('mongoose')
const route = require('./routes/route')

const app = express()


app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }));


mongoose.connect("mongodb+srv://AAbhishek2022:1ESrG6kzyaqzUE3p@cluster0.am17a.mongodb.net/Project-4-group95Database", {
    useNewUrlParser: true
})
    .then(() => console.log("MongoDb is connected"))
    .catch(err => console.log(err))
app.use('/', route)



app.listen(process.env.PORT || 3000, function () {

    console.log("Express app running on port 3000" + (process.env.PORT || 3000))
})