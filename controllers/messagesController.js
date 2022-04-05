const mongoose=require ('mongoose');
const message=require("../models/messages");
const catchAsync = require('../utils/catchAsync');


const createMessage= async (body,id)=> {
    const newMessage= await message.create({
    text: body.text,
    media: body.media,
    sender: id,
    receiver: body.receiver,
    createdAt: body.createdAt
});
return newMessage;
}

const loadChat= async (body,id)=> {
     const chat= await message.find({
     sender: id,
     receiver: body.receiver
     });
return chat;
}

exports.sendMessage= catchAsync(async (req, res, next) => {
    const newMessage= await createMessage(req.body,req.user.id);
    res.status(200).json({status: 'Success', success: true});
    await newMessage.save();
});

exports.chat= catchAsync(async (req, res, next) => {
    const chat= await loadChat(req.body,req.user.id);
    res.status(200).json({status: 'Success', success: true, chat});
});

exports.deleteMessage= catchAsync(async (req, res, next) => {
    await message.deleteOne({_id: req.body._id});
    res.status(200).json({status: 'Success', success: true});
});