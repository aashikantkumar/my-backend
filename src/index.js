import dotenv from "dotenv"
import connectDB from "./db/index.js"
import { app } from "./app.js";
dotenv.config({
    path:'./env'
})


connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000 ,()=>{
        console.log(`Server is runnuing at port :${process.env.PORT}`)
    })

    app.on("error",(error)=>{console.log("ERRR:",error);
        throw error
    })
})
.catch((err)=>{
    console.log("Mongo db connection failed !!! ",err);
})
















/*

first way to connect to mongodb
import exprees from "express";

const app = exprees();



(async()=>{
    try{
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error",(error)=>{console.log("Error in app:", error)
            throw error
        })

        app.listen(process.env.PORT, () => {
            console.log(`Server is running on port ${process.env.PORT}`);
        });
    }catch(error){
        console.error("Error connecting to MongoDB:", error);
        throw error;
    }
})()*/



