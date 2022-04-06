const mongoose = require ('mongoose');
const Schema = mongoose.Schema;
const messageSchema = new Schema({

    text: {
        type: String,
        minLength: 1,
        trim: true
    },

    media: {
        type: String,
        default: null
    },

    sender: {
        type: Schema.Types.ObjectId,
        ref: "user",
        required: true
     },

    receiver: {
        type: Schema.Types.ObjectId,
        ref: "user",
        required: true
     },

    createdAt: {
        type: Date,
        default: Date.now(),

     }
},
    {timestamps: true},
);

const messages=mongoose.model('message',messageSchema);

module.exports = messages;