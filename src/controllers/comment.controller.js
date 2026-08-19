import mongoose from "mongoose"
import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getVedioComments = asyncHandler(async (req, res) => {
  const { vedioId } = req.params
  const { page = 1, limit = 10 } = req.query

  if (!mongoose.Types.ObjectId.isValid(vedioId)) {
    throw new ApiError(400, "Invalid vedioId")
  }

  const pageNumber = Number(page)
  const limitNumber = Number(limit)

  const skip = (pageNumber - 1) * limitNumber

  const comments = await Comment.find({
    vedio: vedioId
  })
    .populate("owner", "username avatar")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNumber)

  const totalComments = await Comment.countDocuments({
    vedio: vedioId
  })
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {
          comments,
          currentPage: pageNumber,
          totalPages: Math.ceil(totalComments / limitNumber),
          totalComments
        },
        "Comments fetched successfully"
      )
    )
})

const addComment = asyncHandler(async (req, res) => {
  const { vedioId } = req.params
  const { content } = req.body

  if (!mongoose.Types.ObjectId.isValid(vedioId)) {
    throw new ApiError(400, "Invalid vedioId")
  }

  if (!content || content.trim() === "") {
    throw new ApiError(400, "Comment content is required")
  }

  const comment = await Comment.create({
    content: content.trim(),
    owner: req.user._id,
    vedio: vedioId
  })

  const createdComment = await Comment.findById(comment._id).populate("owner", "username avatar")

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        createdComment,
        "Comment added successfully"
      )
    )
})


const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params
  const { content } = req.body

  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    throw new ApiError(400, "Invalid comment ID")
  }

  if (!content || content.trim() === "") {
    throw new ApiError(400, "Comment content is required")
  }

  const comment = await Comment.findById(commentId)

  if (!comment) {
    throw new ApiError(404, "Comment not found")
  }

  if (comment.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not allowed to update this comment")
  }

  comment.content = content.trim()

  await comment.save()

  const updatedComment = await Comment.findById(comment._id).populate("owner", "username avatar")

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedComment,
        "Comment updated successfully"
      )
    )

})

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params

  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    throw new ApiError(400, "Invalid comment ID")
  }

  const comment = await Comment.findById(commentId)

  if (!comment) {
    throw new ApiError(404, "Comment not found")
  }

  if (comment.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(
      403,
      "You are not allowed to delete this comment"
    )
  }

  await Comment.findByIdAndDelete(commentId)

  return res
  .status(200)
  .json(
    new ApiResponse(
      200, 
      null,
      "Comment deleted successfully"
    )
  )

})


export {
  getVedioComments,
  addComment,
  updateComment,
  deleteComment
}