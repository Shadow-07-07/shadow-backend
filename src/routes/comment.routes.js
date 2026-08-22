import { Router } from "express"
import {
  getvideoComments,
  addComment,
  updateComment,
  deleteComment
} from "../controllers/comment.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()

router.use(verifyJWT)

router.route("/:videoId").get(getvideoComments).post(addComment)

router.route("/c/:commentId").delete(deleteComment).patch(updateComment)

export default router