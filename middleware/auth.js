const catchAsyncError = require("./catchAsyncError");
const jwt = require("jsonwebtoken")
const ErrorHandler = require('../utils/errorhandler');
const User = require('../models/userModel');

exports.isAuthenticatedUser = catchAsyncError( async(req, res, next)=>{
    const {token}= req.cookies;
    // const token= req.header('token');
    // console.log('request',req.cookies,token)
    // const token= req.cookies;

    // console.log('token', token)
    if(!token){
        return next(new ErrorHandler("Please login to access this resource",401)) 
    }

    const decodedData = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decodedData.id);
    next();
})

exports.authorizeRoles = (...roles)=>{
    return (req, res,next )=>{
        if(!roles.includes(req.user.role)){
            return next(
                new ErrorHandler(`Role : ${req.user.role} is not allowed to access this resource`,403)
            );
        }
        next();
    }
}