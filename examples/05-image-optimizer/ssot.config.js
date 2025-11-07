/**
 * SSOT-Codegen Configuration
 * Image Conversion & Optimization API
 * 
 * This configuration enables FFmpeg/media processing plugins
 * for image format conversion and optimization.
 */

module.exports = {
  // Project metadata
  projectName: 'image-optimizer-api',
  version: '1.0.0',
  description: 'Image conversion and optimization API with FFmpeg',
  
  // Server configuration
  server: {
    port: process.env.PORT || 3000,
    corsEnabled: true,
    rateLimit: {
      enabled: true,
      windowMs: 60000,        // 1 minute
      max: 100,               // 100 requests per minute
      skipSuccessfulRequests: false
    }
  },
  
  // Database
  database: {
    provider: 'mysql',
    url: process.env.DATABASE_URL
  },
  
  // Authentication
  auth: {
    apiKey: {
      enabled: true,
      headerName: 'X-API-Key',
      fieldName: 'apiKey'
    }
  },
  
  // Media Processing Features
  features: {
    // Core FFmpeg functionality
    ffmpegCore: {
      enabled: true,
      ffmpegPath: process.env.FFMPEG_PATH || '/usr/bin/ffmpeg',
      ffprobePath: process.env.FFPROBE_PATH || '/usr/bin/ffprobe',
      tempDir: process.env.TEMP_DIR || '/tmp/image-processing',
      maxConcurrent: 3,       // Max parallel conversions
      timeout: 60000,         // 60 seconds timeout
      
      // Hardware acceleration (optional)
      hardware: {
        acceleration: process.env.HW_ACCEL || 'auto',  // auto, cuda, vaapi, qsv
        devices: process.env.GPU_DEVICES || '0'
      }
    },
    
    // Image format conversion
    imageEncode: {
      enabled: true,
      formats: ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif', 'bmp', 'tiff'],
      
      // Format-specific settings
      jpg: {
        defaultQuality: 90,
        progressive: true,
        optimize: true
      },
      
      png: {
        compressionLevel: 9,
        filter: 'adaptive'
      },
      
      webp: {
        defaultQuality: 85,
        method: 6,              // 0-6, higher = slower but better
        lossless: false
      },
      
      avif: {
        defaultQuality: 85,
        speed: 4,               // 0-10, higher = faster but worse compression
        lossless: false
      }
    },
    
    // Image optimization
    imageOptimize: {
      enabled: true,
      
      // Default settings
      defaultQuality: 85,
      stripMetadata: true,
      progressive: true,
      
      // Optimization levels
      levels: {
        low: {
          quality: 95,
          effort: 'low'
        },
        medium: {
          quality: 85,
          effort: 'medium'
        },
        high: {
          quality: 75,
          effort: 'high'
        },
        lossless: {
          quality: 100,
          effort: 'high',
          lossless: true
        }
      }
    },
    
    // Image resizing
    imageResize: {
      enabled: true,
      maxWidth: 4096,
      maxHeight: 4096,
      defaultMaintainAspect: true,
      
      // Scaling algorithms
      algorithm: 'lanczos',   // lanczos, bicubic, bilinear, nearest
      
      // Common presets
      presets: {
        thumbnail: { width: 150, height: 150 },
        small: { width: 320, height: 240 },
        medium: { width: 640, height: 480 },
        large: { width: 1280, height: 720 },
        xlarge: { width: 1920, height: 1080 }
      }
    }
  },
  
  // Storage configuration
  storage: {
    // Local storage (development)
    local: {
      enabled: !process.env.S3_BUCKET && !process.env.R2_BUCKET,
      uploadsDir: process.env.UPLOADS_DIR || './uploads',
      servePublic: true,
      publicPath: '/uploads',
      maxFileSize: 10 * 1024 * 1024  // 10MB
    },
    
    // AWS S3 (production)
    s3: {
      enabled: !!process.env.S3_BUCKET,
      bucket: process.env.S3_BUCKET,
      region: process.env.S3_REGION || 'us-east-1',
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      publicUrl: process.env.S3_PUBLIC_URL,
      acl: 'public-read'
    },
    
    // Cloudflare R2 (production - no egress fees!)
    r2: {
      enabled: !!process.env.R2_BUCKET,
      accountId: process.env.CF_ACCOUNT_ID,
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      bucket: process.env.R2_BUCKET,
      publicUrl: process.env.R2_PUBLIC_URL
    }
  },
  
  // File upload configuration
  upload: {
    maxFileSize: 10 * 1024 * 1024,  // 10MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/bmp',
      'image/tiff',
      'image/avif'
    ],
    
    // Validate file content, not just extension
    validateContent: true,
    
    // Generate checksums
    generateChecksum: true,
    checksumAlgorithm: 'sha256'
  },
  
  // Job queue configuration
  queue: {
    enabled: true,
    
    // Retry failed jobs
    retry: {
      enabled: true,
      maxAttempts: 3,
      backoff: 'exponential',
      initialDelay: 1000
    },
    
    // Job cleanup
    cleanup: {
      enabled: true,
      completedJobRetention: 7 * 24 * 60 * 60 * 1000,  // 7 days
      failedJobRetention: 30 * 24 * 60 * 60 * 1000     // 30 days
    }
  },
  
  // Webhooks for job completion (optional)
  webhooks: {
    enabled: process.env.WEBHOOK_URL ? true : false,
    url: process.env.WEBHOOK_URL,
    events: ['job.completed', 'job.failed', 'batch.completed'],
    
    // Retry webhook delivery
    retry: {
      enabled: true,
      maxAttempts: 3
    }
  },
  
  // Monitoring and logging
  monitoring: {
    // Track metrics
    metrics: {
      enabled: true,
      trackConversions: true,
      trackSavings: true,
      trackPerformance: true
    },
    
    // Logging
    logging: {
      level: process.env.LOG_LEVEL || 'info',
      format: 'json',
      logFFmpegCommands: process.env.NODE_ENV === 'development'
    }
  },
  
  // API documentation
  docs: {
    enabled: true,
    path: '/docs',
    title: 'Image Optimizer API',
    description: 'Convert and optimize images with ease',
    version: '1.0.0'
  },
  
  // Health check
  healthCheck: {
    enabled: true,
    path: '/health',
    
    checks: {
      database: true,
      ffmpeg: true,
      storage: true,
      memory: true
    }
  }
};

