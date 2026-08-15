import mongoose, { Schema } from "mongoose"

const playlistSchema = new Schema(
  {
    name: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    vedios: [
      {
        type: Schema.Types.ObjectId,
        ref: "Vedio"
      }
    ],
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User"
    }
  },
  {timeStamps: true}
)

export const Playlist = mongoose.model("Playlist", playlistSchema)