import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { User } from "../models/user.model.js"
import { uploadCloudinary } from "../utils/cloudinary.js"

const registerUser = asyncHandler( async (req, res) => { 
  // - get user details from frontend
  // - validation - not empty
  // - check if user already exists : username , email
  // - check for images, avatar
  // - upload them to cloudinary, avatar
  // - create user object - create entry in db
  // - remove password and refresh token from response 
  // - check for user creation 
  // - return response
 
  // get deatails
  const {fullName, email, username, password} = req.body
  console.log("email  :", email)

  // validation 
  if(
    [fullName, username, password, email].some((feild) => feild?.trim === "")
  ){
    throw new ApiError(400, "All feilds are required")
  }

  // already exists 
  const existedUser = User.findOne({
    $or : [{ username }, { email }]
  })
  if(existedUser){
    throw new ApiError(409, "User with email or username already exists")
  }

  // files (images)
  const avatarLocalPath = req.files?.avatar[0]?.path
  const coverImageLocalPath = req.files?.coverImage[0]?.path

  if(!avatarLocalPath) throw new ApiError(400, "Avatar file is required")
  
  // upload them to cloudinary and check
  const avatar = await uploadCloudinary(avatarLocalPath)
  const coverImage = await uploadCloudinary(coverImageLocalPath)

  if(!avatar) throw new ApiError(400, "Avatar file is required")

  // create a user in db
  const user = await User.create({
    username: username.toLowerCase(),
    fullName,
    avatar: avatar,
    coverImage: coverImage?.url || "",
    email,
    password
  })

  const createdUser = await User.findById(User._id).select(
    "-password -refreshToken"
  )

  if(!createdUser) throw new ApiError(500, "Something went wrong while registering the user")

  // response
  return res.status(201).json(
    new ApiResponse(200, createdUser, "User registered Successfully")
  )
})


export { registerUser }