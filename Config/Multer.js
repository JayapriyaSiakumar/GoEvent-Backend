import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "./cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "GoEventsApp",
    allowedFormats: ["jpg", "png", "jpeg"],
  },
});

//console.log("multer", storage);
const upload = multer({ storage: storage });

export default upload;
