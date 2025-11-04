/**
 * Extended File Storage Routes
 * 
 * Replaces generated routes with custom implementation for multipart form data
 */

import { Router } from 'express'
import type { Router as RouterType } from 'express'
import { authenticate } from '../auth/jwt.js'
import { rateLimit } from 'express-rate-limit'
import {
  upload,
  uploadFileWithMultipart,
  getSignedUrlHandler,
  deleteFileHandler,
  listUserFilesHandler
} from '../controllers/file-storage.controller.ext.js'

export const fileStorageExtRouter: RouterType = Router()

// Rate limiting: 50/minute (from schema annotation)
const fileStorageLimiter = rateLimit({
  windowMs: 60000,
  max: 50,
  message: 'Too many file operations, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
})

/**
 * POST /upload-file
 * Upload a file using multipart/form-data
 * 
 * Usage:
 *   curl -X POST http://localhost:3003/api/file-storage/upload-file \
 *     -H "Authorization: Bearer YOUR_TOKEN" \
 *     -F "file=@/path/to/file.jpg" \
 *     -F "description=My awesome file" \
 *     -F "tags=important,work"
 */
fileStorageExtRouter.post(
  '/upload-file',
  authenticate,
  fileStorageLimiter,
  upload.single('file'), // Multer middleware
  uploadFileWithMultipart
)

/**
 * GET /signed-url?fileId=123&expiresIn=3600
 * Generate presigned URL for file download
 * 
 * Query Parameters:
 *   - fileId (required): File ID
 *   - expiresIn (optional): URL expiration in seconds (default: 3600)
 * 
 * Usage:
 *   curl http://localhost:3003/api/file-storage/signed-url?fileId=123 \
 *     -H "Authorization: Bearer YOUR_TOKEN"
 */
fileStorageExtRouter.get(
  '/signed-url',
  authenticate,
  fileStorageLimiter,
  getSignedUrlHandler
)

/**
 * DELETE /file?fileId=123
 * Delete a file
 * 
 * Query Parameters:
 *   - fileId (required): File ID to delete
 * 
 * Usage:
 *   curl -X DELETE http://localhost:3003/api/file-storage/file?fileId=123 \
 *     -H "Authorization: Bearer YOUR_TOKEN"
 */
fileStorageExtRouter.delete(
  '/file',
  authenticate,
  fileStorageLimiter,
  deleteFileHandler
)

/**
 * GET /user-files?skip=0&take=20&status=UPLOADED
 * List user's uploaded files
 * 
 * Query Parameters:
 *   - skip (optional): Number of records to skip (default: 0)
 *   - take (optional): Number of records to return (default: 20)
 *   - status (optional): Filter by status (UPLOADED, PROCESSING, READY, DELETED, FAILED)
 * 
 * Usage:
 *   curl http://localhost:3003/api/file-storage/user-files?take=10 \
 *     -H "Authorization: Bearer YOUR_TOKEN"
 */
fileStorageExtRouter.get(
  '/user-files',
  authenticate,
  fileStorageLimiter,
  listUserFilesHandler
)

// Metadata for route registration
;(fileStorageExtRouter as any).__meta = {
  basePath: '/file-storage',
  priority: 20,
  description: 'File storage service with Cloudflare R2 (extended with multipart support)'
}

