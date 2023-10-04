const catchAsyncError = require('../middleware/catchAsyncError');
const ErrorHandler = require('../utils/errorhandler');
const User = require('../models/userModel');
const sendToken = require('../utils/jwtToken');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');
const Product = require('../models/productModel');
const cloudinary = require('cloudinary')

exports.registerUser = catchAsyncError( async(req,res, next)=>{
    const myCloud = await cloudinary.v2.uploader.upload(req.body.avtar,{
        folder:"avtars",
        width:150,
        crop:"scale"
    })


    const {name,email, password } = req.body;

    const user = await User.create({
        name,
        email,
        password,
        avtar:{
            public_id:myCloud.public_id,
            url:myCloud.secure_url 
        }
    })

    sendToken(user,200,res)
})

exports.loginUser = catchAsyncError( async(req,res, next)=>{
    const {email, password } = req.body; 
    if( !email || !password){
        return next(new ErrorHandler("Please Enter email and Password ", 400))
    }

    const user = await User.findOne({email}).select("+password");

    if(!user){
        return next(new ErrorHandler("Invalid email and Password ", 401));
    }

    const isPasswordMatched =await user.comparePassword(password);
    if(!isPasswordMatched){
        return next(new ErrorHandler("Invalid email and Password ", 401));
    }

    sendToken(user,201,res)
})

exports.logout = catchAsyncError( async(req,res, next)=>{
    res.cookie("token",null,{
        expires:new Date(Date.now()),
        httpOnly:true
    });

    res.status(200).json({
        success:true,
        message:"Logged Out"
    })
})


exports.forgotPassword = catchAsyncError( async(req,res, next)=>{
    const user = await User.findOne({email:req.body.email})

    if(!user){
        return next(new ErrorHandler("User not found",404))
    }

    const resetToken=user.getResetPasswordToken();
    await user.save({validateBeforeSave:false});

    // const resetPasswordUrl= `${req.protocol}://${req.get("host")}/api/v1/password/reset/${resetToken}`;
    const resetPasswordUrl= `${process.env.FRONTEND_URL}/password/reset/${resetToken}`;
    const message = `Your reset Password token is :- \n\n ${resetPasswordUrl} \n\n If you have not requested this email then please ignore it`;

    try{
        await sendEmail({
            email:user.email,
            subject:"Ecommerce password Recovery",
            message,
        })

        res.status(200).json({
            success:true,
            message:`Email sent to ${user.email} successfully `
        })
    }
    catch(error){
        user.resetPasswordToken=undefined,
        user.resetPasswordExpire=undefined
        await user.save({validateBeforeSave:false});

        return next(new ErrorHandler(error.message,404))
    }
})

exports.resetPassword = catchAsyncError( async(req,res, next)=>{
    const resetPasswordToken=crypto.createHash("sha256").update(req.params.token).digest("hex");

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire:{$gt:Date.now()}
    })

    if(!user){
        return next(new ErrorHandler("Reset password token is invalid or has been expired",404))
    }

    if(req.body.password !==req.body.confirmPassword){
        return next(new ErrorHandler("Password does not match",404))
    }

    user.password = req.body.password;
    user.resetPasswordToken=undefined;
    user.resetPasswordExpire=undefined;
    await user.save();

    sendToken(user,200,res);
})

exports.getUserDetails = catchAsyncError( async(req,res, next)=>{
    const user= await User.findById(req.user.id);

    res.status(200).json({
        success:true,
        user
    })
})

exports.updatePassword = catchAsyncError( async(req,res, next)=>{
    const user= await User.findById(req.user.id).select("+password");

    const isPasswordMatched =await user.comparePassword(req.body.oldPassword);
    if(!isPasswordMatched){
        return next(new ErrorHandler("Old Password is Incorrect", 400));
    }
    if(req.body.newPassword !== req.body.confirmPassword){
        return next(new ErrorHandler("Password does not match", 400));
    }

    user.password = req.body.newPassword;
    await user.save();

    sendToken(user,200,res)  
})

exports.updateProfile = catchAsyncError( async(req,res, next)=>{
    const newUserData= {
        name:req.body.name,
        email:req.body.email
    }

    if(req.body.avtar !== ""){
        const user = await User.findById(req.user.id);

        const imageId= user.avtar.public_id;

        await cloudinary.v2.uploader.destroy(imageId)

        const myCloud = await cloudinary.v2.uploader.upload(req.body.avtar,{
            folder:"avtars",
            width:150,
            crop:"scale"
        })
        
        newUserData.avtar ={
            public_id:myCloud.public_id,
            url:myCloud.secure_url
        }
    }

    const user= await User.findByIdAndUpdate(req.user.id,newUserData,{
        new:true,
        runValidators:true,
        useFindAndModify:false,
    });

    res.status(200).json({
        success:true,
        message:"Profile Update successfully"
    })
    
})

exports.getAllUsers = catchAsyncError( async(req,res, next)=>{
    const users = await User.find();

    res.status(200).json({
        success:true,
        users
    })
})

exports.getSingleUser = catchAsyncError( async(req,res, next)=>{
    const user = await User.findById(req.params.id);

    if(!user){
        return next(new ErrorHandler(`User does not exist with id ${req.params.id}`))
    }
    res.status(200).json({
        success:true,
        user
    })
})

exports.updateUserRole = catchAsyncError( async(req,res, next)=>{
    const newUserData= {
        name:req.body.name,
        email:req.body.email,
        role:req.body.role
    }
    const user= await User.findByIdAndUpdate(req.params.id,newUserData,{
        new:true,
        runValidators:true,
        useFindAndModify:false,
    });

    res.status(200).json({
        success:true,
        message:"User Role Update successfully"
    })
})

exports.deleteUser = catchAsyncError( async(req,res, next)=>{
    
    const user= await User.findById(req.params.id);
    if(!user){
        return next(new ErrorHandler(`User does not exist with id ${req.params.id}`))
    }

    const imageId= user.avtar.public_id;

    await cloudinary.v2.uploader.destroy(imageId);

    await user.deleteOne();
    res.status(200).json({
        success:true,
        message:"User Deleted successfully"
    })
})

exports.createProductReview = catchAsyncError( async(req,res, next)=>{
    const {rating,comment, productId}=req.body;

    const review={
        user:req.user._id,
        name:req.user.name,
        rating:Number(rating),
        comment,
    }

    const product = await Product.findById(productId);

    const isReviewed = product.reviews.find(rev=> rev.user.toString()===req.user._id.toString());

    if(isReviewed){
        product.reviews.forEach(rev => {
            if(rev.user.toString()===req.user._id.toString()){
                rev.rating=rating,
                rev.comment=comment
            }
        });
    }
    else {
        product.reviews.push(review);
        product.numOfReviews = product.reviews.length;
    }

    let avg = 0;
    product.reviews.forEach(rev=>avg+=rev.rating)
    product.ratings=avg/product.reviews.length;

    await product.save({validateBeforeSave:false})
    const hlk=product.reviews;
    res.status(200).json(
        {success:true,
           reviews: product.reviews
        }
    )

})

exports.getProductReview = catchAsyncError( async(req,res, next)=>{
    const product =await Product.findById(req.query.productId)

    if(!product){
        return next(new ErrorHandler(`Product not found`,404))
    }

    res.status(200).json({
        success:true,
        reviews : product.reviews
    })
})

exports.deleteProductReview = catchAsyncError( async(req,res, next)=>{
    const product =await Product.findById(req.query.productId)

    if(!product){
        return next(new ErrorHandler(`Product not found`,404))
    }

    const reviews = product.reviews.filter(rev => rev._id.toString() !== req.query.id.toString());
    let avg = 0;
    let ratings=0
    reviews.forEach(rev=>avg+=rev.rating)

    if(reviews.length === 0){
        ratings=0;
    }else{
        ratings=avg/reviews.length;
    }
    const numOfReviews=reviews.length;

    await Product.findByIdAndUpdate(req.query.productId,{
        reviews,
        ratings,
        numOfReviews
    },
    {
        new:true,
        runValidators:true,
        useFindAndModify:false
    })

    res.status(200).json({
        success:true,
        reviews:product.reviews
    })
})