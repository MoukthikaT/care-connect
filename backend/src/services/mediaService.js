import cloudinary from '../config/cloudinary.js';

export const uploadToCloudinary = (buffer, folder = 'careconnect_documents') => new Promise((resolve, reject) => {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    return reject(new Error('Document uploads are unavailable because Cloudinary is not configured.'));
  }

  const uploadStream = cloudinary.uploader.upload_stream({ folder: `careconnect/${folder}`, resource_type: 'auto' }, (error, result) => {
    if (error) return reject(new Error(`Document upload failed: ${error.message}`));
    if (!result?.secure_url || !result?.public_id) return reject(new Error('Document upload did not return a valid file reference.'));
    resolve({ url: result.secure_url, cloudinaryId: result.public_id });
  });
  uploadStream.end(buffer);
});
