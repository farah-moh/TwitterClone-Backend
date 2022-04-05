const mongoose=require ('mongoose')
const Schema=mongoose.Schema()
const messageSchema=new Schema({

    text: {
        type: String,
        minLength: 1,
        trim: true
        //required
    },

    media: {
        type: String,
        default: null
    },

    sender: {
        type: Schema.ObjectId,
        ref: "user",
        required: true
     },

    receiver: {
        type: Schema.ObjectId,
        ref: "user",
        required: true
     },

    createdAt: {
        type: Date,
        default: Date.now(),
        required: true

     }
})

const message=mongoose.model('message',messageSchema)

module.exports = message;