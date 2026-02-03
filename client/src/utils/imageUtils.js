/**
 * Compress and resize an image file before uploading.
 * Uses a canvas to resize and re-encode the image.
 *
 * @param {File} file - The original File object from an <input type="file">
 * @param {object} options
 * @param {number} [options.maxWidth=800]   - Maximum width in pixels
 * @param {number} [options.maxHeight=800]  - Maximum height in pixels
 * @param {number} [options.quality=0.8]    - JPEG/WebP quality 0-1
 * @param {number} [options.maxSizeMB=2]    - Target max file size in MB
 * @returns {Promise<File>} A new File object (compressed)
 */
export const compressImage = (file, options = {}) => {
  const {
    maxWidth = 800,
    maxHeight = 800,
    quality = 0.8,
    maxSizeMB = 2,
  } = options;

  return new Promise((resolve, reject) => {
    // If file is already small enough and an accepted type, return as-is
    if (file.size <= maxSizeMB * 1024 * 1024 && file.size < 500 * 1024) {
      return resolve(file);
    }

    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target.result;
    };

    reader.onerror = () => reject(new Error('Failed to read image file'));

    img.onload = () => {
      let { width, height } = img;

      // Calculate new dimensions maintaining aspect ratio
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // Determine output type – use JPEG for best compression, unless original is PNG with transparency
      const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            return reject(new Error('Failed to compress image'));
          }

          // Build a new File with the same name but compressed content
          const ext = outputType === 'image/png' ? '.png' : '.jpg';
          const baseName = file.name.replace(/\.[^.]+$/, '');
          const compressedFile = new File([blob], `${baseName}${ext}`, {
            type: outputType,
            lastModified: Date.now(),
          });

          resolve(compressedFile);
        },
        outputType,
        quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));

    reader.readAsDataURL(file);
  });
};

/**
 * Accepted image MIME types for child photo uploads.
 */
export const ACCEPTED_IMAGE_TYPES = 'image/jpeg,image/png,image/webp';

/**
 * Validate that a file is an acceptable image.
 * @param {File} file
 * @returns {{ valid: boolean, error?: string }}
 */
export const validateImageFile = (file) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Please select a JPG, PNG, or WebP image.' };
  }
  // 10 MB hard limit before compression
  if (file.size > 10 * 1024 * 1024) {
    return { valid: false, error: 'Image must be smaller than 10MB.' };
  }
  return { valid: true };
};
