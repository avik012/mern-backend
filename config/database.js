const mongoose = require('mongoose');
 
const connectDataBase = ()=>{
    mongoose.connect(process.env.DB_URI,{useNewUrlParser:true}).then(
        (data)=>{
            console.log(`Mongodb connected with server ${data.connection.host}`); 
        }
    )
    // .catch((err)=>{
    //     console.log(err)
    // })
}

module.exports = connectDataBase