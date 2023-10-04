const catchAsyncError = require('../middleware/catchAsyncError');
const Product = require('../models/productModel');
const ErrorHandler = require('../utils/errorhandler');
const ApiFeatures = require('../utils/apifeatures');
const cloudinary = require("cloudinary")

exports.createProduct= catchAsyncError(async (req,res,next)=>{

    let images= [];

    if(typeof req.body.images === "string"){
        images.push(req.body.images);
    }else{
        images=req.body.images;
    }

    const imagesLinks = [];

    for (let index = 0; index < images.length; index++) {
        const result = await cloudinary.v2.uploader.upload(images[index],
            {folders:"products"}   
            );

            imagesLinks.push({
                public_id:result.public_id,
                url:result.secure_url
            })
    }

    req.body.images= imagesLinks
    req.body.user = req.user.id;
    const product = await Product.create(req.body);

    res.status(201).json({
        success:true,
        product
    })
})

exports.getAllProducts = catchAsyncError( async (req,res,next)=>{
    const resultPerPage= 8;
    let apiFeature= new ApiFeatures(Product.find(),req.query).search().filter();
    let products = await apiFeature.query;
    const filteredProductsCount= products.length;
     apiFeature= new ApiFeatures(Product.find(),req.query).search().filter().pagination(resultPerPage);
    const productsCount= await Product.countDocuments();
    products = await apiFeature.query;
    
    // console.log('filteredProductsCount', filteredProductsCount)

    res.status(200).json({
        success:true,
        products,
        productsCount,
        filteredProductsCount,
        resultPerPage
    })
})

exports.getAdminProducts = catchAsyncError( async (req,res,next)=>{
    const products= await Product.find();

    res.status(200).json({
        success:true,
        products,
    })
})

// exports.getAllProducts = catchAsyncError(async (req, res, next) => {
//     const resultPerPage = 8;
//     const productsCount = await Product.countDocuments();
//     console.log("productscount",productsCount)
  
//     const apiFeature = new ApiFeatures(Product.find(), req.query)
//       .search()
//       .filter();
  
//     let products = await apiFeature.query;
//     console.log("products",products)
//     let filteredProductsCount = products.length;
//     console.log('filteredProductsCount', filteredProductsCount)
  
//     apiFeature.pagination(resultPerPage);
  
//     // products = await apiFeature.query;
  
//     res.status(200).json({
//       success: true,
//       products,
//       productsCount,
//       resultPerPage,
//       filteredProductsCount,
//     });
//   });

exports.getProductDetails= catchAsyncError( async (req,res,next)=>{
    let product = await Product.findById(req.params.id);
 
    if(!product){
        return next(new ErrorHandler('Product not found',404)) 
        //  res.status(500).json({
        //     success:false, 
        //     message:"Product not found"
        // })
    }

    res.status(200).json({
        success:true,
        product
    })
})

exports.updateProduct= catchAsyncError( async (req,res,next)=>{
    let product = await Product.findById(req.params.id);

    if(!product){
        return next(new ErrorHandler('Product not found',404)) 
    }

    let images= [];
    if(typeof req.body.images === "string"){
        images.push(req.body.images);
    }else{
        images=req.body.images;
    }

    if(images !== undefined){
        for (let index = 0; index < product.images.length; index++) {
            await cloudinary.v2.uploader.destroy(product.images[index].public_id)
        }

        const imagesLinks = [];

    for (let index = 0; index < images.length; index++) {
        const result = await cloudinary.v2.uploader.upload(images[index],
            {folders:"products"}   
            );

            imagesLinks.push({
                public_id:result.public_id,
                url:result.secure_url
            })
    }
    req.body.images = imagesLinks;
    }

    product= await Product.findByIdAndUpdate(req.params.id,req.body,{
        new:true,
        runValidators:true,
        useFindAndModify:false
    })

    res.status(200).json({
        success:true,
        product
    })
})

exports.deleteProduct= catchAsyncError( async (req,res,next)=>{
    const product = await Product.findById(req.params.id);

    if(!product){
        return next(new ErrorHandler('Product not found',404)) 
    }

    for (let index = 0; index < product.images.length; index++) {
        await cloudinary.v2.uploader.destroy(product.images[index].public_id)
    }
     await product.deleteOne();

    res.status(200).json({
        success:true,
        message:"Product Delete Successfully" 
    })
})
