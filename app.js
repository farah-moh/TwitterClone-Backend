const express = require('express')
const app = express()
app.use(express.json()) 
const AppError = require('./utils/appError')
const authenticationRoute = require('./routes/authenticationRoute')
const messagesRoute= require("./routes/messagesRoute");
require('dotenv').config();
const homePage = require('./routes/postHomePage')

app.use('/', authenticationRoute);
app.use('/home', homePage);


app.use('/', authenticationRoute);
app.use('/messages/:receiver_id', messagesRoute);

app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404))
})

module.exports = app;

// app.listen(3000,()=>{
//     console.log('On port 3000 ....!')
// })