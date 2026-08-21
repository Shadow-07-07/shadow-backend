import { isValidObjectId } from "mongoose"
import { Playlist } from "../models/playlist.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body

  if (!name || name.trim() === "") {
    throw new ApiError(400, "Playlist name is required")
  }

  const playlist = await Playlist.create({
    name: name.trim(),
    description: description?.trim() || "",
    owner: req.user._id
  })

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        playlist,
        "Playlist created successfully"
      )
    )
})

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user ID")
  }

  const playlists = await Playlist.find({
    owner: userId
  }).populate("owner", "username fullName avatar")
    .sort({ createdAt: -1 })

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        playlists,
        "Playlists fetched successfully"
      )
    )
})

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid Playlist ID")
  }

  const playlist = await Playlist.findById(playlistId).populate({
    path: "videos",
    select: "title description thumbnail videoFile duration views",
    populate: {
      path: "owner",
      select: "username fullName avatar"
    }
  }).populate("owner", "username fullName avatar")

  if (!playlist) {
    throw new ApiError(404, "Playlist not found")
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        playlist,
        "Playlist fetched successfully"
      )
    )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist ID")
  }

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID")
  }

  const playlist = await Playlist.findById(playlistId)

  if (!playlist) {
    throw new ApiError(404, "Playlist not found")
  }

  if (playlist.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not allowed to modify the playlist")
  }

  const video = await Video.findById(videoId)

  if (!video) {
    throw new ApiError(404, "Video not found")
  }

  const alreadyExists = playlist.videos.some(
    (video) => video.toString() === videoId
  )

  if (alreadyExists) {
    throw new ApiError(400, "Video already exists in playlist")
  }

  playlist.videos.push(videoId)

  await playlist.save()

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        playlist,
        "Video added to playlist successfully"
      )
    )
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist ID")
  }

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID")
  }

  const playlist = await Playlist.findById(playlistId)

  if (!playlist) {
    throw new ApiError(404, "Playlist not found")
  }

  if (playlist.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are allowed to modify the playlist")
  }

  const videoExists = playlist.videos.some(
    (video) => video.toString() === videoId
  )

  if (!videoExists) {
    throw new ApiError(404, "video not found in playlist")
  }

  playlist.videos = playlist.videos.filter(
    (video) => video.toString() !== videoId
  )

  await playlist.save()

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        playlist,
        "Video removed from playlist successfully"
      )
    )
})

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist ID")
  }

  const playlist = await Playlist.findById(playlistId)

  if (!playlist) {
    throw new ApiError(404, "Playlist not found")
  }

  if (playlist.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not allowed to delete this playlist")
  }

  await Playlist.findByIdAndDelete(playlistId)

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        null,
        "Playlist deleted successfully"
      )
    )
})

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params
  const { name, description } = req.body

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid Playlist ID")
  }

  if (!name && description === undefined) {
    throw new ApiError(400, "Name or Description is required")
  }

  const playlist = await Playlist.findById(playlistId)

  if (!playlist) {
    throw new ApiError(404, "Playlist not found")
  }

  if (playlist.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not allowed to update this playlist")
  }

  if (name !== undefined) {
    if (name.trim() === "") {
      throw new ApiError(400, "Playlist name can't be empty")
    }

    playlist.name = name.trim()
  }

  playlist.description = description?.trim() || ""

  await playlist.save()

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        playlist,
        "Playlist updated successfully"
      )
    )
})

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist
}