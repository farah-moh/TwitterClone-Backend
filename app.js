const express = require('express')
const app = express()
require('dotenv').config();
app.use(express.json()) 
const AppError = require('./utils/appError')
const authenticationRoute = require('./routes/authenticationRoute')
const messagesRoute= require("./routes/messagesRoute");
const settingsRoute = require('./routes/settingsRoute');
const homePage = require('./routes/postHomePage')
const userRoute = require('./routes/userRoute')

app.use('/', authenticationRoute);
app.use('/home', homePage);
app.use('/settings', settingsRoute);
app.use('/:username',userRoute)
app.use('/messages/:receiver_id', messagesRoute);

app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404))
})

module.exports = app;

// app.listen(3000,()=>{
//     console.log('On port 3000 ....!')
// })