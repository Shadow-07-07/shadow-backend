import { Router } from "express"
import {
  getVedioComments,
  addComment,
  updateComment,
  deleteComment
} from "../controllers/comment.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()

router.use(verifyJWT)

router.route("/:vedioId").get(getVedioComments).post(addComment)

router.route("/c/:commentId").delete(deleteComment).patch(updateComment)

export default router