import  express from 'express';
import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from '../utils/ApiError.js';
import {User} from '../models/user.model.js';
import {uploadOnCloudinary} from '../utils/cloudinary.js';
import {ApiResponse} from '../utils/ApiResponse.js';



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


})

export  {registerUser,loginUser};


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
