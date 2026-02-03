const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const path = require('path');
const crypto = require('crypto');
const { s3Client, S3_BUCKET } = require('../config/s3');

// Allowed MIME types for image uploads
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

// Max file size: 5 MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Upload a file buffer to S3
 *
 * @param {Buffer} fileBuffer  - The file content
 * @param {string} originalName - Original filename (used for extension)
 * @param {string} mimetype     - MIME type of the file
 * @param {string} folder       - S3 key prefix / folder (e.g. 'children', 'gallery')
 * @returns {Promise<{ url: string, key: string }>}
 */
const uploadToS3 = async (fileBuffer, originalName, mimetype, folder = 'uploads') => {
  // Validate MIME type
  if (!ALLOWED_IMAGE_TYPES.includes(mimetype)) {
    throw new Error(
      `Invalid file type: ${mimetype}. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`
    );
  }

  // Validate file size
  if (fileBuffer.length > MAX_FILE_SIZE) {
    throw new Error(
      `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`
    );
  }

  // Build a unique key:  folder/timestamp-random.ext
  const ext = path.extname(originalName).toLowerCase() || '.jpg';
  const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
  const key = `${folder}/${uniqueName}`;

  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    Body: fileBuffer,
    ContentType: mimetype,
  });

  await s3Client.send(command);

  // Build the public URL
  const url = `https://${S3_BUCKET}.s3.amazonaws.com/${key}`;

  return { url, key };
};

/**
 * Delete a file from S3 by its key
 *
 * @param {string} key - The S3 object key to delete
 * @returns {Promise<void>}
 */
const deleteFromS3 = async (key) => {
  if (!key) return;

  const command = new DeleteObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
  });

  await s3Client.send(command);
};

/**
 * Extract the S3 key from a full S3 URL
 * e.g. "https://amz-scrib-sl3.s3.amazonaws.com/children/abc.jpg" => "children/abc.jpg"
 *
 * @param {string} url - The full S3 URL
 * @returns {string|null}
 */
const getKeyFromUrl = (url) => {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    // Remove leading slash
    return parsed.pathname.replace(/^\//, '');
  } catch {
    return null;
  }
};

module.exports = {
  uploadToS3,
  deleteFromS3,
  getKeyFromUrl,
  ALLOWED_IMAGE_TYPES,
  MAX_FILE_SIZE,
};
