import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const connectDb=async ()=>{

    try{
        await mongoose.connect(process.env.MONGO_URL)
        console.log("MonogoDB is connected")
        return "connected"
    }catch(error){
        console.log("Connection failed in MonogoDB :---- ",error)
    }

}

export default connectDb;