import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { User } from "../models/user.model.js"
import { uploadCloudinary } from "../utils/cloudinary.js"


const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId)
    const accessToken = await user.generateAccessToken()
    const refreshToken = await user.generateRefreshToken()

    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave : false })

    return {accessToken, refreshToken}
  } catch (error) {
    throw new ApiError(500, "Something went wrong in token generation")
  }
}


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
  // console.log("email  :", email)

  // validation 
  if(
    [fullName, username, password, email].some((feild) => feild?.trim() === "")
  ){
    throw new ApiError(400, "All feilds are required")
  }

  // already exists 
  const user = await User.findOne({
    $or : [{ username }, { email }]
  })
  if(user){
    throw new ApiError(409, "User with email or username already exists")
  }

  // files (images)
  const avatarLocalPath = req.files?.avatar[0]?.path
  // const coverImageLocalPath = req.files?.coverImage[0]?.path

  let coverImageLocalPath ;
  if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
    coverImageLocalPath = req.files.coverImage[0].path
  }

  if(!avatarLocalPath) throw new ApiError(400, "Avatar file is required")
  
  // upload them to cloudinary and check
  const avatar = await uploadCloudinary(avatarLocalPath)
  const coverImage = await uploadCloudinary(coverImageLocalPath)

  if(!avatar) throw new ApiError(400, "Avatar file is required")

  // create a user in db
  const user = await User.create({
    username: username.toLowerCase(),
    fullName,
    avatar: avatar.secure_url,
    coverImage: coverImage?.url || "",
    email,
    password
  })

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  )

  if(!createdUser) throw new ApiError(500, "Something went wrong while registering the user")

  // response
  return res.status(201).json(
    new ApiResponse(200, createdUser, "User registered Successfully")
  )
})

const loginUser = asyncHandler( async (req, res) => {
  // req body - data
  // username or email
  // find the user
  // password check
  // generate refresh token and access token
  // send cookies
  
  const {email, username, password} = req.body

  if(!username || !email){
    throw new ApiError(400, "username or email is required")
  }

  const user = await User.findOne({
    $or : [{username}, {email}]
  })
  if(!user){
    throw new ApiError(404, "User does not exist")
  }

  const isPasswordValid = await user.isPasswordCorrect(password)
  if(!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials")
  }

  const {accessToken, refreshToken}  = await generateAccessAndRefreshTokens(user._id) 

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

  const options = {
    httpOnly : true,
    secure: true
  }

  return res
  .status(200)
  .cookie("refreshToken", refreshToken, options)
  .cookie("accessToken", accessToken, options)
  .json(
    new ApiResponse(
      200,
      {
        user: loggedInUser, accesssToken, refreshToken
      },
      "User logged in Successfully"
    )
  )

})

const logoutUser = asyncHandler( async (req, res) => {

  await User.findByIdAndUpdate(
    user.req._id ,
    {
      $set: {
        refreshToken: undefined
      }
    },
    {
      new : true
    }
  )

  const options = {
    httpOnly : true,
    secure: true
  }
  return res
  .status(200)
  .clearCookie("accessToken", options)
  .clearCookie("refreshToken", options)
  .json(new ApiResponse(200, {}, "User logged out successfully"))
}) 

export { registerUser, loginUser, logoutUser }