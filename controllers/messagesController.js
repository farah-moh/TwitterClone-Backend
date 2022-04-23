const mongoose=require ('mongoose');
const message=require("../models/messages");
const user = require('../models/user');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');


const createMessage= async (body,receiverId)=> {
    const newMessage= await message.create({
    text: body.text,
    media: body.media,
    sender: body.sender,
    receiver: receiverId,
    createdAt: body.createdAt
});
return newMessage;
}

const loadChat= async (body,receiverId)=> {
    
     const chat= await message.find({
     $or:[
     {sender: body.sender,
      receiver: receiverId},
     {sender: receiverId,
      receiver: body.sender}
     ]
     });
return chat;
}

//TODO: Create notification


exports.sendMessage= catchAsync(async (req, res, next) => {

    const {text,media} = req.body;
    if (!text && !media)
    {
        return next(new AppError('Cannot send empty message', 422));
    }

    try {
        const receiver = await user.findById(req.params.receiver_id);
        if (!receiver) {
            return next(new AppError('User not found', 404));
        }

    const newMessage= await createMessage(req.body,req.params.receiver_id);
    res.status(200).json({status: 'Success', success: true});
    await newMessage.save();
    }

    catch (err) {
        console.log(err)
        return res.status(500).json({error:"Something went wrong"})
      }
});

exports.chat= catchAsync(async (req, res, next) => {
    
    try {
        const receiver = await user.findById(req.params.receiver_id);
        if (!receiver) {
            return next(new AppError('User not found', 404));
        }
        
    const chat= await loadChat(req.body, req.params.receiver_id);
    res.status(200).json({status: 'Success', success: true, chat});
    }

    catch (err) {
        console.log(err)
        return res.status(500).json({error:"Something went wrong"})
    }
});

exports.deleteMessage= catchAsync(async (req, res, next) => {
    await message.findByIdAndRemove ( req.body._id);
    res.status(200).json({status: 'Success', success: true});
});