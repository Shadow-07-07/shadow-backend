import mongoose, { Schema } from "mongoose"

const likeSchema = new Schema(
  {
    comment: {
      type: Schema.Types.ObjectId,
      ref: "Comment"
    },
    vedio: {
      type: Schema.Types.ObjectId,
      ref: "Vedio"
    },
    tweet: {
      type: Schema.Types.ObjectId,
      ref: "Tweet"
    },
    likedBy: {
      type: Schema.Types.ObjectId,
      ref: "User"
    }
  },
  {timeStamps: true}
)

export const Like = mongoose.model("Like", likeSchema)