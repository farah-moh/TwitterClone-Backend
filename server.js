const dotenv = require('dotenv') 
dotenv.config({ path: '.env' }) 
const app = require('./app')
const mongoose = require('mongoose')

process.on('uncaughtException', err => {
  console.log('UNCAUGHT EXCEPTION! Shutting down...')
  console.log(err.name, err.message)
  process.exit(1)
})

//Database connection
mongoose.connect(process.env.DATABASE_LOCAL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(con => {
  // console.log(con.connections);
  console.log('DB is connected successfuly!')
})

//Hosting the server
const server = app.listen(process.env.PORT, () => {
  console.log(`App is running on port ${process.env.PORT}`)
})

process.on('unhandledRejection', err => {
  console.log('UNHANDLED REJECTION!  Shutting down...')
  console.log(err.name, err.message)
  server.close(() => {
    process.exit(1)
  })
})