import {v2 as cloudinary} from "cloudinary"
import fs from "fs"

cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET
     
});


const uploadOnCloudinary=async (localFilePath)=>{
    try{
      if(!localFilePath)return null
      //upload the file on cloudinary
      const respone= await cloudinary.uploader.upload(localFilePath,{
        resource_type:"auto"
      })

      //file has been uploaded successfull
      console.log("file is uplosded on cloudinary",respone.ulr);
      return respone;
    }catch(error){
        fs.unlinkSync(localFilePath)//remove the locally saved temporray file as teh upload operation got failed
        return null;
    }

}

export {uploadOnCloudinary};