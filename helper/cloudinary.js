import { v2 as cloudinary } from 'cloudinary';

export const getCloudinary = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUDNAME,
    api_key: process.env.CLOUDINARY_APIKEY,
    api_secret: process.env.CLOUDINARY_APISECRET,
  });
  return cloudinary;
};

export const streamUpload = (buffer) => {
  const cloudinary = getCloudinary();

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream((error, result) => {
      if (result) resolve(result);
      else reject(error);
    });
    stream.end(buffer);
  });
};

export const uploadGoogleImg = async (url) => {
  const cloudinary = getCloudinary();
  const validUrl = url.replace('=s96-c', '=s400-c');

  try {
    const response = await cloudinary.uploader.upload(validUrl);
    return response.secure_url;
    
  } catch (err) {
    return url;
  }
};
