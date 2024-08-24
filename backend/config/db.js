const mongoose = require("mongoose")

async function connectDB(){
    try{
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 30000,
        });

        console.log("Connected to DB");
    }catch(err){
        console.error("Error connecting to DB:", err);
        process.exit(1);
    }
}

module.exports = connectDB