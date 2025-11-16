const cloudinary = require('cloudinary').v2;

// Configure Cloudinary for image uploads
// Images are stored in the cloud and URLs are returned for Firestore storage
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadToCloudinary = async (file, folder = 'produce') => {
  try {
    // Upload buffer to Cloudinary with optimization settings for low-bandwidth users
    const result = await cloudinary.uploader.upload(file.path || `data:${file.mimetype};base64,${file.buffer.toString('base64')}`, {
      folder: `farmers-market/${folder}`,
      transformation: [
        { width: 800, height: 800, crop: 'limit' },
        { quality: 'auto:low' },
        { fetch_format: 'auto' },
      ],
      resource_type: 'auto',
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      thumbnail: cloudinary.url(result.public_id, {
        transformation: [
          { width: 200, height: 200, crop: 'fill' },
          { quality: 'auto:low' },
        ],
      }),
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload image to Cloudinary');
  }
};

const deleteFromCloudinary = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return false;
  }
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
  deleteFromCloudinary,
};
