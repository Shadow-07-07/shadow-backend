import { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweet.model.js" 
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body

  if (!content || content.trim() === "") {
    throw new ApiError(400, "Tweet content is required")
  }

  const tweet = await Tweet.create({
    content: content.trim(),
    owner: req.user._id
  })

  const createdTweet = await Tweet.findById(tweet._id).populate("owner", "username fullName avatar")

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        createdTweet,
        "Tweet created successfully"
      )
    )
})

const getUserTweets = asyncHandler(async (req, res) => {
  const { userId } = req.params

  const { page = 1, limit = 10 } = req.query

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user ID")
  }

  const pageNumber = Number(page)
  const limitNumber = Number(limit)

  if (pageNumber < 1 || limitNumber < 1) {
    throw new ApiError(400, "Invalid page or limit")
  }

  const skip = (pageNumber - 1) * limitNumber

  const tweets = await Tweet.find({
    owner: userId
  }).populate("owner", "username fullName avatar")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNumber)

  const totalTweets = await Tweet.countDocuments({
    owner: userId
  })

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {
          tweets,
          currentPage: pageNumber,
          totalPages: Math.ceil(totalTweets / limitNumber),
          totalTweets
        },
        "Tweets fetched successfully"
      )
    )
})

const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params
  const { content } = req.body

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet ID")
  }

  if (!content || content.trim() === "") {
    throw new ApiError(400, "Tweet content is required")
  }

  const tweet = await Tweet.findById(tweetId)

  if (!tweet) {
    throw new ApiError(404, "Tweet not found")
  }

  if(tweet.owner.toString() !== req.user._id.toString()){
    throw new ApiError(403, "You are not allowed to update the tweet")
  }

  tweet.content = content.trim()

  await tweet.save()

  const updatedTweet = await Tweet.findById(tweet._id).populate("owner", "username fullName avatar")

  return res
  .status(200)
  .json(
    new ApiResponse(
      200,
      updatedTweet,
      "Tweet updated successfully"
    )
  )
})

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params

  if(!isValidObjectId(tweetId)){
    throw new ApiError(400, "Invalid tweet ID")
  }

  const tweet = await Tweet.findById(tweetId)

  if(!tweet){
    throw new ApiError(404, "Tweet not found")
  }

  if(tweet.owner.toString() !== req.user._id.toString()){
    throw new ApiError(403, "You are not allowed to delete this Tweet")
  }

  await Tweet.findByIdAndDelete(tweetId)

  return res
  .status(200)
  .json(
    new ApiResponse(
      200,
      null,
      "Tweet deleted successfully"
    )
  )
})

export {
  createTweet,
  getUserTweets,
  updateTweet,
  deleteTweet
}