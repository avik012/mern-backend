const express = require('express');

const app = express();
const errorMiddleWare = require('./middleware/error')
const cookieParser= require("cookie-parser")
const bodyParser= require("body-parser")
const fileUpload= require("express-fileupload")
const dotenv = require('dotenv')
const cors = require("cors")


dotenv.config({path:"backend/config/config.env"});

app.use(cors({origin: 'https://avi-ecommerce.netlify.app', credentials: true}));  // when credentials on or authentication purpose then we must need to specify origin 
// app.use(cors()); // Allow all origins
// app.use(cors({
//     origin: '*', // Allow all origins
//     methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Allowed methods
//     allowedHeaders: 'Origin, X-Requested-With, Content-Type, Accept, Authorization', // Allowed headers
//     credentials: true, // Allow credentials (cookies)
// }));
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended:true }));
// app.use(bodyParser.json());
app.use(fileUpload());

const product = require("./routes/productRoute");
const user = require("./routes/userRoute");
const order = require("./routes/orderRoute");
const payment = require("./routes/paymentRoute");


app.use("/api/v1", product);
app.use("/api/v1", user);
app.use("/api/v1", order);
app.use("/api/v1", payment);

app.use(errorMiddleWare);

module.exports = app