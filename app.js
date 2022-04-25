const express = require('express')
const cors = require('cors');

const app = express()
require('dotenv').config();
app.use(express.json()) 
const AppError = require('./utils/appError')
const authenticationRoute = require('./routes/authenticationRoute')
const messagesRoute= require("./routes/messagesRoute");
const settingsRoute = require('./routes/settingsRoute');
const homePage = require('./routes/postHomePage')
const userRoute = require('./routes/userRoute')

const corsOptions = {
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Token,Content-Type,Authorization,X-Forwarded-For',
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
  };
  app.use(cors(corsOptions));
  app.get('/cors', (req, res) => {
      res.set('Access-Control-Allow-Origin', true);
      res.header("Access-Control-Allow-Origin", "*")
      res.send({ "msg": "This has CORS enabled 🎈" })
      });
  app.enable('trust proxy');

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