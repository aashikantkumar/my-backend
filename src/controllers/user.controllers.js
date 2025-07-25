import  express from 'express';
import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from '../utils/ApiError.js';
import {User} from '../models/user.model.js';
import {uploadOnCloudinary} from '../utils/cloudinary.js';
import {ApiResponse} from '../utils/ApiResponse.js';


const generateAccessAndrefreshTokens =async(userId)=>{
    try{
       const user= await User.findById(userId)
       const accessToken=user.generateAccesToken()
       const refreshToken=user.generateRefreshToken()


       user.refreshToken=refreshToken
      await  user.save({validdateBeforeSave:false})

      return {accessToken,refreshToken}

    }catch (error){
        throw new ApiError(500,"something went wrong while  generating referesh and access token")
    }
}


const registerUser = asyncHandler(async (req, res) =>{


   const{fullName ,email, username, password} =req.body 
   console.log("email:",email);

   if([fullName, email, username, password].some((field)=>field?.trim()==="")){

    throw new ApiError(400,"All fields are required");

   }

   const existedUser = await User.findOne({
    $or:[{username}, {email}]
   })

   if(existedUser){
    throw new ApiError(409,"User already exists with this username or email");
   }

   const avatarLocalPath = req.files?.avatar[0]?.path;//

   //const coverImageLocalPath = req.files?.coverImage[0]?.path;
 
      let coverImageLocalPath;
      if(req.files&& Array.isArray(req.files.coverImage)&& req.files.coverImage.length>0){
        coverImageLocalPath = req.files.coverImage[0].path;
      }


   if(!avatarLocalPath){

    throw new ApiError(400,"Avatar  file is required")
   }

   const avatar = await uploadOnCloudinary(avatarLocalPath);
   const coverImage = await uploadOnCloudinary(coverImageLocalPath);
   if(!avatar){
    throw new ApiError(400,"Failed to upload avatar image");
   }



   const user = await User.create({
    fullName,
    avatar:avatar.url,
    coverImage:coverImage?.url||" ",
    username: username.toLowerCase(),
    password,
    email,

   })

   const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
   );

    if(!createdUser){
        throw new ApiError(500,"User creation failed");
    }
  


    return res.status(201).json(
        new ApiResponse(201,"User created successfully")
    )

})

const  loginUser= asyncHandler(async(req,res)=>{
     // req body->data
     //username or email
     //password check
     //access and refresh token
     //send cookie

     const{email,username,password}=req.body
     

     if(!(username || email)){
        throw new ApiError(400,"username 0r email is required")
     }
      const user =await User.findOne({
        $or:[{username},{email}]
      })

      if(!user){
        throw new ApiError(404,"User does not exist")
      }
      const isPasswordVaid= await user.isPasswordCorrect(password)
      
      if(!isPasswordVaid){
        throw new ApiError(401,"Invalid credentials")
      }

     const  {accessToken,refreshToken  }=await  generateAccessAndrefreshTokens(user._id)
      
     const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

     const options ={
        httpOnly:true,
        secure:true
     }
     return res
     .status(200)
     .cookie( "accessToken",accessToken,options)
     .cookie("refreshToken",refreshToken,options)
     .json(
        new ApiResponse(
            200,
            {
                user:loggedInUser,accessToken,refreshToken
            },"User logged in Successfully"
        )
     )
})

const logoutUser= asyncHandler( async(req,res)=>{
   await  User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{refreshToken:undefined}
        },
        {
            new:true
        }
    )
    const options={
        httpOnly:true,
        secure:true
    }
   return res
   .status(200)
   .clearCookie("accessToken",options)
   .clearCookie("refreshToken",options)
   .json(new ApiResponse(200,{},"User logged out"))

})

export  {registerUser,loginUser,logoutUser};


//get user details from frontend 
//validate the details
//check if usser already exists:username or email
//check for images ,check for avatar
//upload avatar to cloudinary,avator
// create user  object -create entry in db 
//remove password from refresh token  field from response
//check for user creation 
//return res 

// enter following details 
// 1.Name
// 2.Email
// 3.Password 
//4.confirm password
