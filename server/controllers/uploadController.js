const { HeadBucketCommand } = require('@aws-sdk/client-s3');
const { s3Client, S3_BUCKET } = require('../config/s3');
const { uploadToS3, deleteFromS3, getKeyFromUrl } = require('../services/uploadService');

/**
 * Upload a single image
 * POST /api/v1/uploads/image
 *
 * Expects multipart/form-data with:
 *   - file: the image file
 *   - folder (optional): destination folder in S3 (default: 'uploads')
 */
const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file provided',
      });
    }

    const folder = req.body.folder || 'uploads';

    const { url, key } = await uploadToS3(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      folder
    );

    res.status(201).json({
      success: true,
      data: {
        url,
        key,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
      },
    });
  } catch (error) {
    console.error('Upload image error:', error);

    // Return user-friendly messages for validation errors
    if (error.message.includes('Invalid file type') || error.message.includes('File too large')) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to upload image',
    });
  }
};

/**
 * Delete an uploaded file by its URL
 * DELETE /api/v1/uploads
 *
 * Body: { url: "https://..." }
 */
const deleteImage = async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required',
      });
    }

    const key = getKeyFromUrl(url);

    if (!key) {
      return res.status(400).json({
        success: false,
        error: 'Invalid URL format',
      });
    }

    await deleteFromS3(key);

    res.json({
      success: true,
      data: { message: 'File deleted successfully' },
    });
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete image',
    });
  }
};

/**
 * S3 health check — verify credentials and bucket access
 * GET /api/upload/health
 */
const s3Health = async (_req, res) => {
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: S3_BUCKET }));

    res.json({
      success: true,
      data: {
        status: 'connected',
        bucket: S3_BUCKET,
        region: process.env.AWS_REGION || 'us-east-1',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('S3 health check error:', error);

    let detail = 'Unknown error';
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      detail = 'Bucket not found';
    } else if (error.name === 'CredentialsProviderError' || error.$metadata?.httpStatusCode === 403) {
      detail = 'Invalid credentials or insufficient permissions';
    } else if (error.code === 'ENOTFOUND' || error.code === 'ERR_INVALID_URL') {
      detail = 'Could not reach AWS — check region and network';
    }

    res.status(503).json({
      success: false,
      error: 'S3 connection failed',
      detail,
      bucket: S3_BUCKET,
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Test upload — send a real file to S3 and return the URL
 * POST /api/upload/test
 */
const testUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file provided. Send a multipart/form-data request with a "file" field.',
      });
    }

    const { url, key } = await uploadToS3(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      'test'
    );

    res.status(201).json({
      success: true,
      data: {
        message: 'Test upload successful',
        url,
        key,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
      },
    });
  } catch (error) {
    console.error('Test upload error:', error);

    if (error.message.includes('Invalid file type') || error.message.includes('File too large')) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: 'Test upload failed',
      detail: error.message,
    });
  }
};

module.exports = {
  uploadImage,
  deleteImage,
  s3Health,
  testUpload,
};
