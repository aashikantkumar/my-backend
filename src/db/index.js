import mongoose from 'mongoose';
import { DB_NAME } from '../constants.js';




const connectDB = async ()=>{
    try{
          const connectionIntance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`, )
             
       console.log(`MongoDB connected: ${connectionIntance.connection.host}`);
        
        // You can add additional logic here if needed, such as initializing models or running migrations.

    }catch(error){
        console.error("Error connecting to MongoDB:", error);
        process.exit(1); // Exit the process with failure
    }

    
} 

export default connectDB;