# Cloudinary Setup Guide

## Why Cloudinary?

✅ **Free tier**: 25GB storage, 25GB bandwidth/month
✅ **Automatic optimization**: Images compressed automatically
✅ **Transformations**: Resize, crop, format conversion on-the-fly
✅ **CDN delivery**: Fast global image delivery
✅ **No size limits**: Upload images up to 10MB (or more)

## Setup Steps

### 1. Create Cloudinary Account

1. Go to https://cloudinary.com/users/register/free
2. Sign up for free account
3. Verify your email

### 2. Get Your Credentials

After logging in:

1. Go to **Dashboard**
2. Find your **Cloud Name** (e.g., `dxyz123abc`)
3. Note it down

### 3. Create Upload Preset

1. Go to **Settings** → **Upload**
2. Scroll to **Upload presets**
3. Click **Add upload preset**
4. Configure:
   - **Preset name**: `farmers-market` (or any name)
   - **Signing Mode**: **Unsigned** (important!)
   - **Folder**: `farmers-market` (optional)
   - **Allowed formats**: `jpg, png, webp, jpeg`
   - **Max file size**: `10485760` (10MB)
   - **Transformation**: Add if you want auto-resize
5. Click **Save**
6. Copy the **preset name**

### 4. Update Frontend .env

Add to `frontend/.env`:

```env
REACT_APP_CLOUDINARY_CLOUD_NAME=your-cloud-name
REACT_APP_CLOUDINARY_UPLOAD_PRESET=farmers-market
```

Replace:
- `your-cloud-name` with your Cloud Name from dashboard
- `farmers-market` with your upload preset name

### 5. Test Upload

1. Run the app: `npm start`
2. Register as farmer
3. Create listing
4. Upload an image
5. Check Cloudinary dashboard → Media Library

## Configuration Examples

### Basic Upload Preset
```
Preset name: farmers-market
Signing mode: Unsigned
Folder: farmers-market
```

### With Auto-Optimization
```
Preset name: farmers-market-optimized
Signing mode: Unsigned
Folder: farmers-market
Transformation:
  - Quality: auto
  - Format: auto
  - Width: 1200
  - Crop: limit
```

### With Watermark
```
Preset name: farmers-market-branded
Signing mode: Unsigned
Folder: farmers-market
Overlay:
  - Type: text
  - Text: "Farmers Market"
  - Position: bottom-right
```

## Image Transformations

Cloudinary automatically creates thumbnails in the code:

```javascript
// Original
https://res.cloudinary.com/demo/image/upload/v1234/farmers-market/image.jpg

// Thumbnail (200x200)
https://res.cloudinary.com/demo/image/upload/w_200,h_200,c_fill/v1234/farmers-market/image.jpg
```

### Common Transformations

```
w_200,h_200,c_fill     - 200x200 thumbnail, cropped
w_800,h_800,c_limit    - Max 800x800, maintain aspect ratio
q_auto                 - Auto quality optimization
f_auto                 - Auto format (WebP for supported browsers)
```

## Free Tier Limits

**Cloudinary Free Plan:**
- 25GB storage
- 25GB bandwidth/month
- 25 credits/month (transformations)
- Unlimited images
- Unlimited transformations (within credits)

**Estimate:**
- Average image: 2MB
- **~12,500 images** fit in 25GB
- **~12,500 views/month** at 2MB each

Perfect for MVP and small-scale production!

## Security

### Unsigned Uploads (Current Setup)
✅ Easy to implement
✅ No backend needed
⚠️ Anyone can upload to your preset
⚠️ Set upload limits in preset

### Signed Uploads (Production)
✅ Secure - requires API secret
✅ Full control over uploads
⚠️ Requires backend or Cloud Function

To upgrade to signed uploads later:
1. Change preset to "Signed"
2. Add Cloud Function to generate signature
3. Update frontend to request signature

## Monitoring

### Check Usage
1. Go to Cloudinary Dashboard
2. View **Usage** tab
3. Monitor:
   - Storage used
   - Bandwidth used
   - Transformations used

### Set Alerts
1. Go to **Settings** → **Notifications**
2. Enable email alerts for:
   - 80% storage used
   - 80% bandwidth used

## Troubleshooting

### Upload fails with "Invalid preset"
- Check preset name matches `.env`
- Ensure preset is **Unsigned**
- Verify preset is saved

### Upload fails with "Unauthorized"
- Check cloud name is correct
- Ensure preset exists
- Try creating new unsigned preset

### Images not displaying
- Check browser console for errors
- Verify Cloudinary URL is accessible
- Check CORS settings (usually not needed)

### Slow uploads
- Check internet connection
- Try smaller images
- Check Cloudinary status page

## Best Practices

### For Development
1. Use unsigned preset
2. Set folder to organize images
3. Enable auto-optimization
4. Set reasonable size limits

### For Production
1. Consider signed uploads
2. Set up monitoring alerts
3. Enable auto-backup
4. Use CDN for faster delivery

### Image Guidelines
1. Max 10MB per image
2. Recommended: 2-5MB
3. Formats: JPG, PNG, WebP
4. Dimensions: Up to 4000x4000px

## Migration from Base64

If you had base64 images in Firestore:

1. Keep old listings as-is
2. New listings use Cloudinary
3. Gradually migrate old images:
   - Download base64
   - Upload to Cloudinary
   - Update Firestore document

## Advanced Features

### Lazy Loading
```javascript
<img 
  src={listing.image.thumbnail} 
  data-src={listing.image.url}
  loading="lazy"
/>
```

### Responsive Images
```javascript
const getResponsiveUrl = (url, width) => {
  return url.replace('/upload/', `/upload/w_${width},c_limit/`);
};

// Use in srcset
<img 
  src={listing.image.url}
  srcset={`
    ${getResponsiveUrl(listing.image.url, 400)} 400w,
    ${getResponsiveUrl(listing.image.url, 800)} 800w,
    ${getResponsiveUrl(listing.image.url, 1200)} 1200w
  `}
/>
```

### Video Support
Cloudinary also supports videos:
```javascript
// Upload video
formData.append('resource_type', 'video');

// Video URL
https://res.cloudinary.com/demo/video/upload/v1234/farmers-market/video.mp4
```

## Cost Optimization

### Tips to Stay in Free Tier
1. Enable auto-format (WebP saves 30%)
2. Enable auto-quality
3. Set max dimensions in preset
4. Delete unused images regularly
5. Use thumbnails for listings

### When to Upgrade
Upgrade to paid plan when:
- Storage > 25GB
- Bandwidth > 25GB/month
- Need advanced features
- Need signed uploads

**Paid plans start at $89/month**

## Support

- Cloudinary Docs: https://cloudinary.com/documentation
- Upload API: https://cloudinary.com/documentation/upload_images
- Transformations: https://cloudinary.com/documentation/image_transformations
- Support: https://support.cloudinary.com

## Summary

✅ **Easy setup**: 5 minutes
✅ **Free tier**: 25GB storage
✅ **Auto-optimization**: Images compressed automatically
✅ **CDN delivery**: Fast worldwide
✅ **No backend needed**: Unsigned uploads

Perfect for your farmers marketplace! 🎉

---

**Ready to upload!** Just add your credentials to `.env` and start uploading images.
