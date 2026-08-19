import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadCloudinary } from "../utils/cloudinary.js"
import { upload } from "../middlewares/multer.middleware.js"

const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query,
    sortBy = "createdAt",
    sortType = "desc",
    userId
  } = req.query

  const pageNumber = Number(page)
  const limitNumber = Number(limit)

  if (pageNumber < 1 || limitNumber < 1) {
    throw new ApiError(400, "Invalic page or limit")
  }

  const matchStage = {
    isPublished: true
  }

  if (query) {
    matchStage.$or = [
      {
        title: {
          $regex: query,
          $options: "i"
        }
      },
      {
        description: {
          $regex: query,
          $options: "i"
        }
      }
    ]
  }

  if (userId) {
    if (!isValidObjectId(userId)) {
      throw new ApiError(400, "Invalid user Id")
    }

    matchStage.owner = new mongoose.Types.ObjectId(userId)
  }

  const sortOrder = sortType === "asc" ? 1 : -1

  const videos = await Video.aggregate([
    {
      $match: matchStage
    },
    {
      $sort: {
        [sortBy]: sortOrder
      }
    },
    {
      $skip: (pageNumber - 1) * limitNumber
    },
    {
      $limit: limitNumber
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner"
      },
    },
    {
      $unwind: "$owner"
    },
    {
      $project: {
        videoFile: 1,
        thumbnail: 1,
        title: 1,
        description: 1,
        duration: 1,
        views: 1,
        isPublished: 1,
        createdAt: 1,
        owner: {
          _id: 1,
          username: 1,
          fullName: 1,
          avatar: 1
        }
      }
    }
  ])

  const totalVideos = await Video.countDocuments(matchStage)

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {
          videos,
          currentPage: pageNumber,
          totalPages: Math.ceil(totalVideos / limitNumber),
          totalVideos
        },
        "Videos fetched successfully"
      )
    )
})

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body

  if (!title?.trim()) {
    throw new ApiError(400, "title is required")
  }
  if (!description?.trim()) {
    throw new ApiError(400, "description is required")
  }

  const videoLocalPath = req.files?.videoFile?.[0]?.path
  const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path

  if (!videoLocalPath) {
    throw new ApiError(400, " video file is required")
  }
  if (!thumbnailLocalPath) {
    throw new ApiError(400, "thumbnail  is required")
  }

  const videoFile = await uploadCloudinary(videoLocalPath)

  if (!videoFile) {
    throw new ApiError(500, "video upload failed")
  }

  const thumbnail = await uploadCloudinary(thumbnailLocalPath)

  if (!thumbnail) {
    throw new ApiError(500, "thumbnail upload failed")
  }

  const video = await Video.create({
    videofile: videoFile.url,
    thumbnail: thumbnail.url,
    title: title.trim(),
    description: description.trim(),
    duration: videoFile.duration,
    owner: req.user._id,
    isPublished: true
  })

  const createdVideo = await Video.findById(video._id).populate("owner", "username fullname avatar")

  return res
    .status(200)
    .json(
      new ApiResponse(
        201,
        createdVideo,
        "video published successfully"
      )
    )
})

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID")
  }

  const video = await Video.findById(videoId).populate("owner", "username fullname avatar")

  if (!video) {
    throw new ApiError(404, "Video not found")
  }

  video.views += 1
  await video.save()

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        video,
        "Video fetched successfully"
      )
    )
})

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params
  const { title, description } = req.body

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID")
  }

  const video = await Video.findById(videoId)

  if (!video) {
    throw new ApiError(404, "video not found")
  }

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not allowed to update this video")
  }

  if (title !== undefined) {
    if (!title.trim()) {
      throw new ApiError(400, "Title cannot be empty")
    }

    video.title = title.trim()
  }

  if (description !== undefined) {
    video.description = description.trim()
  }

  const thumbnailLocalPath = req.file?.path

  if (thumbnailLocalPath) {
    const thumbnail = await uploadCloudinary(thumbnailLocalPath)

    if (!thumbnail) {
      throw new ApiError(500, "Thumbnail upload failed")
    }

    video.thumbnail = thumbnail.url
  }

  await video.save()

  const updatedVideo = await Video.findById(video._id).populate("owner", "username fullname avatar")

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedVideo,
        "Video updated successfully"
      )
    )
})


const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID")
  }

  const video = await Video.findById(videoId)

  if (!video) {
    throw new ApiError(404, "Video not found")
  }

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not allowed to delete this video")
  }

  await Video.findByIdAndDelete(videoId)

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        null,
        "Video deleted successfully"
      )
    )
})

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID")
  }

  const video = await Video.findById(videoId)

  if (!video) {
    throw new ApiError(404, "Video not found")
  }

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not allowed to change this video")
  }

  video.isPublished = !video.isPublished

  await video.save()

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        video,
        `Video ${video.ispublished ? "Published" : "unPublished"} successfully`
      )
    )
})

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus
}
