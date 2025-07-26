import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from '../utils/ApiError.js';
import {User} from '../models/user.model.js';
import {uploadOnCloudinary} from '../utils/cloudinary.js';
import {ApiResponse} from '../utils/ApiResponse.js';
import jwt from "jsonwebtoken"


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

const refreshAccessToken = asyncHandler(async(req,res)=>{
    const incomingTefreshToken = req.cookies.refreshAccessToken || req.body.refreshToken

    if(!incomingTefreshToken){
        throw new ApiError(401,"unauthorized request ")
    }
   try {
     const decodedToken=jwt.verify(incomingTefreshToken,process.env.REFRESH_TOKEN_SECRET)
     const user = User.findById(decodedToken?._id)
       if(incomingTefreshToken){
         throw new ApiError(401,"Invalid refresh token")
     }
 
     if(incomingTefreshToken !==user?.refreshToken){
         throw new ApiError(401,"Refresh token is expired or used")
     }
     const options ={
         httpOnly:true,
         secure:true
     }
     const {accessToken,newrefreshToken}= await generateAccessAndrefreshTokens(user._id)
   
     return res
     .status(200)
     .cookie("aaccessTokekn",accessToken,options)
     .cookie("refreshToken",newrefreshToken,options)
     .json(
         new ApiResponse(200,{accessToken,refreshAccessToken:newrefreshToken}
             ,"Access token refreshed"
         )
     )
   } catch (error) {
    throw new ApiError(401,error?.message || "Invalid refresh token")
    
   }
})

const changecurrentPassword = asyncHandler( async (req,res)=>{
    const {oldPassword,newPassword}=req.body

    const user=await User.findById(req.user?.id)
    const isPasswordCorrect= await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400,"Invalid old Password")
    }

    user.password =  newPassword 
    await user.save({validateBeforeSave:false})

    return res.status(200)
    .json( new ApiResponse(200,{},"Password changed successfully"))


})


const getCuurenUser=asyncHandler(async (req,res)=>{
    return res
    .status(200)
    .json(200,req.user,"current user fetched successfully")
})

const updateAccoundDetails= asyncHandler(async(req,res)=>{
    const {fullName,email} =req.body

    if(!fullName || !email){

        throw new ApiError(400, "All fields are required")

    }

    User.findByIdAndUpdate(req.user?._id,
        {
            $set:{
                fullName:fullName,
                email:email,

            }
        },
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,user,"Account details updated successfully"))
})


const updateUserAvatar = asyncHandler(async(req,res)=>{
    const avatorLocalPath=req.file?.path

    if(!avatorLocalPath){
        throw new ApiError(400,"Aavatar file is missing ")

    }

    const avatar= await uploadOnCloudinary (avatorLocalPath)

    if(!avatar.url){
        throw new  ApiError(400,"Error while uploading on avatar ")
    }

    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar:avatar.url
            }
        },{
            new:true
        }
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200,user," avatar image updated  successfully ")
    )

})

export  {registerUser,loginUser,logoutUser,refreshAccessToken,changecurrentPassword,getCuurenUser,updateAccoundDetails,updateUserAvatar};


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
