import { isValidObjectId } from "mongoose"
import { Subscription } from "../models/subscription.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel ID")
  }

  if (channelId === req.user._id.toString()) {
    throw new ApiError(400, "You cannot subscribe to your own channel")
  }

  const channel = await User.findById(channelId)

  if (!channel) {
    throw new ApiError(404, "Channel not found")
  }

  const existingSubscription = await Subscription.findOne({
    subscriber: req.user._id,
    channel: channelId
  })

  if (existingSubscription) {
    await Subscription.findByIdAndDelete(existingSubscription._id)

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          {
            isSubscribed: false
          },
          "Unsubscribed successfully"
        )
      )
  }

  const subscription = await Subscription.create({
    subscriber: req.user._id,
    channel: channelId
  })

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        {
          subscription,
          isSubscribed: true
        },
        "Subscribed successfully"
      )
    )

})

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params 

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel ID")
  }

  const channel = await User.findById(channelId)

  if (!channel) {
    throw new ApiError(404, "Channel not found")
  }

  const subscribers = await Subscription.find({
    channel: channelId
  }).populate(
    "subscriber",
    "username fullName avatar"
  ).sort({ createdAt: -1 })

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscribers,
        "Subscribers fetched successfully"
      )
    )
})

const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params

  if(!isValidObjectId(subscriberId)){
    throw new ApiError(400, "Invalid subscriber ID")
  }

  const user = await User.findById(subscriberId)

  if(!user){
    throw new ApiError(404, "User not found")
  }

  const subscribedChannels = await Subscription.find({
    subscriber: subscriberId
  }).populate(
    "channel",
    "username fullName avatar"
  ).sort({ createdAt: -1 })

  return res
  .status(200)
  .json(
    new ApiResponse(
      200,
      subscribedChannels,
      "Subscribed channels fetched successfully"
    )
  )
})

export {
  toggleSubscription,
  getUserChannelSubscribers,
  getSubscribedChannels
}