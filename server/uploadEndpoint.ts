import { Router, Request, Response } from 'express';
import multer from 'multer';
import { storagePut } from './storage';
import { sdk } from './_core/sdk';

// Configure multer for video uploads
const uploadVideo = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept video files only
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'));
    }
  },
});

// Configure multer for thumbnail uploads
const uploadThumbnail = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for thumbnails
  },
  fileFilter: (req, file, cb) => {
    // Accept image files only
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

export function createUploadRouter() {
  const router = Router();

  // Video upload endpoint
  router.post('/upload-video', uploadVideo.single('video'), async (req: Request, res: Response) => {
    try {
      // Verify authentication using SDK
      let user;
      try {
        user = await sdk.authenticateRequest(req);
        if (!user) {
          return res.status(401).json({ error: 'Unauthorized' });
        }
      } catch (error) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Generate unique file key
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(7);
      const fileExtension = req.file.originalname.split('.').pop();
      const fileKey = `videos/${user.id}/${timestamp}-${randomSuffix}.${fileExtension}`;

      // Upload to S3
      const { url } = await storagePut(
        fileKey,
        req.file.buffer,
        req.file.mimetype
      );

      res.json({
        success: true,
        fileKey,
        url,
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ 
        error: 'Upload failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Thumbnail upload endpoint
  router.post('/upload-thumbnail', uploadThumbnail.single('thumbnail'), async (req: Request, res: Response) => {
    try {
      // Verify authentication using SDK
      let user;
      try {
        user = await sdk.authenticateRequest(req);
        if (!user) {
          return res.status(401).json({ error: 'Unauthorized' });
        }
      } catch (error) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Generate unique file key
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(7);
      const fileKey = `thumbnails/${user.id}/${timestamp}-${randomSuffix}.jpg`;

      // Upload to S3
      const { url } = await storagePut(
        fileKey,
        req.file.buffer,
        'image/jpeg'
      );

      res.json({
        success: true,
        fileKey,
        url,
      });
    } catch (error) {
      console.error('Thumbnail upload error:', error);
      res.status(500).json({ 
        error: 'Thumbnail upload failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  return router;
}
