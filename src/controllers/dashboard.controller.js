import mongoose from "mongoose"
import { Video } from "../models/video.model.js"
import { Subscription } from "../models/subscription.model.js"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
  const channelId = req.user._id

  const stats = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(channelId)
      }
    },
    {
      $group: {
        _id: null,
        totalVideos: {
          $sum: 1
        },
        totalViews: {
          $sum: "$views"
        }
      }
    }
  ])

  const totalSubscribers = await Subscription.countDocuments({
    channel: channelId
  })

  const totalLikes = await Like.countDocuments({
    video: {
      $in: await Video.find({
        owner: channelId
      }).distinct("_id")
    }
  })

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {
          totalVideos: stats[0]?.totalVideos || 0,
          totalViews: stats[0]?.totalViews || 0,
          totalSubscribers,
          totalLikes
        },
        "Channel stats fetched successfully"
      )
    )
})

const getChannelVideos = asyncHandler(async (req, res) => {
  const channelId = req.user._id

  const videos = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(channelId)
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner"
      }
    },
    {
      $addFields: {
        owner: {
          $first: "$owner"
        }
      }
    },
    {
      $project: {
        title: 1,
        description: 1,
        thumbnail: 1,
        videoFile: 1,
        duration: 1,
        views: 1,
        isPublished: 1,
        createdAt: 1,

        "owner.username": 1,
        "owner.fullName": 1,
        "owner.avatar": 1
      }
    }
  ])

  return res
  .status(200)
  .json(
    new ApiResponse(
      200,
      videos,
      "Channel videos fetched successfully"
    )
  )
})

export {
  getChannelStats,
  getChannelVideos
}