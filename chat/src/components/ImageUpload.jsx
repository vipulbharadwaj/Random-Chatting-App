import axios from "axios";

const CLOUD_NAME ='dpb3rr7qn';
const UPLOAD_PRESET =  'vi-chat';
export const uploadImageToCloudinary = async (file) => {
    const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
  
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);
  
    try {
      const res = await axios.post(url, formData);
      return res.data.secure_url; 
    } catch (err) {
      console.error("Cloudinary upload error:", err);
      throw err;
    }
  };