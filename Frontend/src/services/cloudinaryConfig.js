import { Cloudinary } from 'cloudinary-core';

const cloudinaryConfig = {
    cloud_name: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
    upload_preset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
  };
  

export const uploadToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', cloudinaryConfig.upload_preset);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloud_name}/image/upload`, 
      {
        method: 'POST',
        body: formData
      }
    );

    const data = await response.json();
    console.log('Cloudinary upload response:', data);
    
    return {
      url: data.secure_url,
      public_id: data.public_id
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

export default cloudinaryConfig;