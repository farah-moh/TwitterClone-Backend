const mongoose=require ('mongoose');
const user = require('../models/user');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const suggestedAccounts= async(id)=> {
    const User = await user.findById(id);
    const suggested = await user.find({ 
        $and:
         [
             {_id: {$nin: User.followers}},
             {_id: {$nin: User.following}},
             {_id: {$ne: User.id}}
         ]
    }).select('name username image bio');
    return suggested; 
}

exports.whoToFollow = catchAsync(async (req, res, next) => {
    try {
        const accounts = await suggestedAccounts(req.user.id);

        if(accounts.length==0)
        {
            return res.status(404).json({
                status: 'No accounts to show',
            });
        }
        
        return res.status(200).json({status: 'Success', success: true, accounts});
        }
        catch (err) {
            throw new AppError(
                `Something went wrong`,
                500
              );
          }
});