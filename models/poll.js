const mongoose = require('mongoose');
const validator = require('validator');
const Schema = mongoose.Schema;

const pollSchema = new Schema({
    choice1:{
        type: String
    },
    choice2:{
        type: String
    },
    choice3:{
        type: String
    },
    choice4:{
        type: String
    },
    choice1Statistics:[{
        type: Schema.ObjectId,
        ref: 'user'
    }],
    choice2Statistics:[{
        type: Schema.ObjectId,
        ref: 'user'
    }],
    choice3Statistics:[{
        type: Schema.ObjectId,
        ref: 'user'
    }],
    choice4Statistics:[{
        type: Schema.ObjectId,
        ref: 'user'
    }],
    createdAt:{
        type: Date,
        default: Date.now
    }

},
    {timestamps: false},
)



const poll = mongoose.model('poll', pollSchema);



module.exports = poll;