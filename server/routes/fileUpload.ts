import express from 'express';
import multer from 'multer';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3 } from '../r2.js';
import { v4 as uuid } from 'uuid';

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

router.post('/', upload.single('image'), async (req, res) => {
  const file = req.file;

  if (!file) {
    console.log('ERROR: No file uploaded');
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const key = `uploads/${uuid()}-${file.originalname}`;

  try {
    const uploadParams = {
      Bucket: process.env.R2_BUCKET ?? '',
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    await s3.send(new PutObjectCommand(uploadParams));

    const publicUrl = `https://${process.env.R2_BUCKET_ID}/${key}`;

    res.json({ url: publicUrl });
  } catch (err: any) {
    res.status(500).json({
      error: 'Upload failed',
      details: err.message,
      code: err.code,
    });
  }
});

export default router;
