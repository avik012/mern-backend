const app = require('./app');
const dotenv = require('dotenv')
const cloudinary = require('cloudinary')
const connectDataBase = require('./config/database')

process.on('uncaughtException',(err)=>{
    console.log(`Error: ${err.message}`)
    console.log('Shutting down server due to the uncaught Exception');
    process.exit(1);
})

dotenv.config({path:"backend/config/config.env"});

connectDataBase();  

cloudinary.config({
    cloud_name:process.env.CLOUDINARY_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET
})


const server = app.listen(process.env.PORT,()=>{
    console.log(`first port ${process.env.PORT}`)
})

process.on('unhandledRejection',(err)=>{
    console.log(`Error: ${err.message}`)
    console.log('Shutting down server due to the unhandled promise Rejection');

    server.close(()=>{
        process.exit(1);
    })
})