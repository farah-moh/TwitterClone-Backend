const mongoose = require('mongoose')

const connectDB = async () => {

    const mongoDB = process.env.DATABASE_LOCAL
    mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true })

    const db = mongoose.connection
    db.once('open', url => {
      console.log('Database connected')
    })

    db.on('error', err => {
      console.error('connection error:', err)
    })
}
exports.connectDB = connectDB;