import {v2 as cloudinary} from "cloudinary"
import fs from "fs"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME ,
  api_key:   process.env.CLOUDINARY_API_KEY ,
  api_secret: process.env.CLOUDINARY_API_SECRET  , 
})

const uploadCloudinary = async (localFilePath) => {
  try {
    if(!localFilePath) return null
    // upload the file into clooudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto"
    })

    // console.log('file is uploaded in cloudinary', response.url)
    fs.unlinkSync(localFilePath)
    return response
  } catch (error) {
    console.log("Cloudinary error : ", error)

    if(fs.existsSync(localFilePath)){
      fs.unlinkSync(localFilePath)
    }
    // unlink or remove  the locally saved temporary file as upload failed
    return null
  }
}
 
export { uploadCloudinary }