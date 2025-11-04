/**
 * Extended File Storage Controller
 * 
 * Adds multipart form data handling to the generated controller
 */

import type { Response } from 'express'
import type { AuthRequest } from '../auth/jwt.js'
import { fileStorageService } from '../services/file-storage.service.js'
import { logger } from '../logger.js'
import multer from 'multer'

// Configure multer for memory storage (files stored in RAM as Buffer)
const storage = multer.memoryStorage()

// File filter for allowed types
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'text/plain', 'text/markdown',
    'application/json'
  ]
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`))
  }
}

// Multer instance with configuration
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1 // Only 1 file at a time
  }
})

/**
 * Upload file handler (extends generated controller)
 * 
 * This adds multipart form data handling on top of the service integration
 */
export const uploadFileWithMultipart = async (req: AuthRequest, res: Response) => {
  try {
    // Extract user ID
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' })
    }
    
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided. Use multipart/form-data with field name "file"' })
    }
    
    // Extract optional metadata from form fields
    const metadata: Record<string, any> = {}
    if (req.body.description) metadata.description = req.body.description
    if (req.body.tags) metadata.tags = req.body.tags.split(',').map((t: string) => t.trim())
    
    // Call service with file buffer
    const result = await fileStorageService.uploadFile(userId, {
      buffer: req.file.buffer,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      metadata
    })
    
    logger.info({ userId, fileId: result.id, filename: result.filename }, 'File uploaded successfully')
    
    return res.status(201).json(result)
  } catch (error: any) {
    logger.error({ error: error.message, userId: req.user?.userId }, 'Error in uploadFile')
    
    // Handle specific errors
    if (error.message?.includes('File size exceeds')) {
      return res.status(413).json({ error: error.message })
    }
    
    if (error.message?.includes('File type') && error.message?.includes('not allowed')) {
      return res.status(415).json({ error: error.message })
    }
    
    return res.status(500).json({ 
      error: 'Upload failed',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

/**
 * Get signed URL handler (query string parameters)
 */
export const getSignedUrlHandler = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' })
    }
    
    const fileId = parseInt(req.query.fileId as string)
    const expiresIn = req.query.expiresIn ? parseInt(req.query.expiresIn as string) : undefined
    
    if (!fileId || isNaN(fileId)) {
      return res.status(400).json({ error: 'Valid fileId is required' })
    }
    
    const result = await fileStorageService.getSignedUrl(userId, { fileId, expiresIn })
    
    logger.info({ userId, fileId }, 'Signed URL generated')
    
    return res.json(result)
  } catch (error: any) {
    logger.error({ error: error.message, userId: req.user?.userId }, 'Error in getSignedUrl')
    
    if (error.message?.includes('not found')) {
      return res.status(404).json({ error: error.message })
    }
    
    if (error.message?.includes('Access denied')) {
      return res.status(403).json({ error: error.message })
    }
    
    return res.status(500).json({ 
      error: 'Failed to generate signed URL',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

/**
 * Delete file handler (query string parameter)
 */
export const deleteFileHandler = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' })
    }
    
    const fileId = parseInt(req.query.fileId as string)
    
    if (!fileId || isNaN(fileId)) {
      return res.status(400).json({ error: 'Valid fileId is required' })
    }
    
    const result = await fileStorageService.deleteFile(userId, { fileId })
    
    logger.info({ userId, fileId }, 'File deleted')
    
    return res.json(result)
  } catch (error: any) {
    logger.error({ error: error.message, userId: req.user?.userId }, 'Error in deleteFile')
    
    if (error.message?.includes('not found')) {
      return res.status(404).json({ error: error.message })
    }
    
    if (error.message?.includes('Access denied')) {
      return res.status(403).json({ error: error.message })
    }
    
    return res.status(500).json({ 
      error: 'Failed to delete file',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

/**
 * List user files handler (query string parameters)
 */
export const listUserFilesHandler = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' })
    }
    
    const skip = req.query.skip ? parseInt(req.query.skip as string) : undefined
    const take = req.query.take ? parseInt(req.query.take as string) : undefined
    const status = req.query.status as any
    
    const result = await fileStorageService.listUserFiles(userId, { skip, take, status })
    
    logger.info({ userId, total: result.meta.total }, 'Files listed')
    
    return res.json(result)
  } catch (error: any) {
    logger.error({ error: error.message, userId: req.user?.userId }, 'Error in listUserFiles')
    
    return res.status(500).json({ 
      error: 'Failed to list files',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

