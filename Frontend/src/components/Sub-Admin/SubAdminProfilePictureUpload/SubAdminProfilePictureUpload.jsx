import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import { uploadToCloudinary } from '../../../services/cloudinaryConfig';

const ProfilePictureUpload = ({ currentImage, onImageChange }) => {
  const [previewUrl, setPreviewUrl] = useState(currentImage);
  const [isHovered, setIsHovered] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file type
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
      }
      
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image must be less than 5MB');
        return;
      }

      try {
        setIsUploading(true);
        
        // Upload to Cloudinary
        const cloudinaryResponse = await uploadToCloudinary(file);
        console.log('Cloudinary upload response in subadminprofilepicture.jsx:', cloudinaryResponse);
        
        
        // Update preview
        setPreviewUrl(cloudinaryResponse.url);
        
        // Call parent component's image change handler with Cloudinary URL
        onImageChange({
          file: file,
          cloudinaryUrl: cloudinaryResponse.url,
          cloudinaryPublicId: cloudinaryResponse.public_id
        });
      } catch (error) {
        console.error('Upload failed', error);
        alert('Image upload failed');
      } finally {
        setIsUploading(false);
      }
    }
  };

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-teal-500">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Profile"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <Upload className="text-gray-400" size={32} />
          </div>
        )}
      </div>
      
      {/* Overlay for upload button */}
      <div 
        className={`absolute inset-0 rounded-full bg-black bg-opacity-50 flex items-center justify-center transition-opacity duration-200 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <label className="cursor-pointer">
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={isUploading}
          />
          <div className="text-white text-center">
            {isUploading ? (
              <span className="text-sm">Uploading...</span>
            ) : (
              <>
                <Upload className="mx-auto mb-1" size={24} />
                <span className="text-sm">Change</span>
              </>
            )}
          </div>
        </label>
      </div>
    </div>
  );
};

export default ProfilePictureUpload;