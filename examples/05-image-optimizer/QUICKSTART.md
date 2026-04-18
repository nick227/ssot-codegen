# 🚀 Quick Start - Image Optimizer

Get your image processing API running in **5 minutes**!

---

## Prerequisites

### 1. Install FFmpeg

**macOS:**
```bash
brew install ffmpeg
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install ffmpeg
```

**Windows:**
```bash
# Using chocolatey
choco install ffmpeg

# Or download from https://ffmpeg.org/download.html
```

**Verify Installation:**
```bash
ffmpeg -version
# Should show version 4.0+ or higher
```

### 2. Database

You need MySQL running:

```bash
# Using Docker (easiest)
docker run --name mysql -e MYSQL_ROOT_PASSWORD=password -e MYSQL_DATABASE=image_optimizer -p 3306:3306 -d mysql:8

# Or install locally
# macOS: brew install mysql
# Ubuntu: sudo apt install mysql-server
```

---

## Step-by-Step Setup

### 1. Clone and Navigate

```bash
cd examples/05-image-optimizer
```

### 2. Set Environment Variables

Create `.env` file:

```bash
# Required
DATABASE_URL="mysql://root:password@localhost:3306/image_optimizer"
FFMPEG_PATH="/usr/bin/ffmpeg"
FFPROBE_PATH="/usr/bin/ffprobe"

# Optional
PORT=3000
TEMP_DIR="/tmp/image-processing"
```

### 3. Generate Backend

```bash
pnpm ssot generate schema.prisma
```

### 4. Install Dependencies

```bash
cd generated/image-optimizer-api-1
pnpm install
```

### 5. Run Migrations

```bash
pnpm db:migrate
```

### 6. Start Server

```bash
pnpm dev
```

**Your API is now running at `http://localhost:3000`!** 🎉

---

## Quick Test

### Upload and Convert an Image

```bash
# 1. Upload an image
curl -X POST http://localhost:3000/api/images \
  -H "X-API-Key: test-api-key-12345" \
  -F "file=@/path/to/image.png"

# Response:
# {
#   "id": "clx123abc",
#   "originalFormat": "PNG",
#   "originalSize": 2048576
# }

# 2. Convert to JPG
curl -X POST http://localhost:3000/api/images/clx123abc/convert \
  -H "X-API-Key: test-api-key-12345" \
  -H "Content-Type: application/json" \
  -d '{
    "outputFormat": "JPG",
    "quality": 90
  }'

# Response:
# {
#   "jobId": "job456",
#   "status": "PROCESSING"
# }

# 3. Check job status
curl http://localhost:3000/api/jobs/job456 \
  -H "X-API-Key: test-api-key-12345"

# Response:
# {
#   "status": "COMPLETED",
#   "resultUrl": "https://cdn.example.com/converted/image.jpg"
# }
```

---

## Run Automated Tests

```bash
# Run comprehensive test suite
node test-api.js /path/to/test-image.png
```

This will automatically test:
- ✅ Image upload
- ✅ PNG → JPG conversion
- ✅ JPG → PNG conversion
- ✅ Image optimization
- ✅ Modern formats (WebP, AVIF)
- ✅ Presets
- ✅ Batch processing
- ✅ Statistics

---

## Common Issues

### FFmpeg not found

```bash
# Check FFmpeg path
which ffmpeg

# Update .env with correct path
FFMPEG_PATH="/usr/local/bin/ffmpeg"
```

### Database connection failed

```bash
# Check MySQL is running
mysql -u root -p -e "SELECT VERSION();"

# Update DATABASE_URL in .env
```

### Upload fails

```bash
# Check temp directory exists and is writable
mkdir -p /tmp/image-processing
chmod 755 /tmp/image-processing
```

---

## Next Steps

1. **Explore API:** Check full documentation in [README.md](./README.md)
2. **Try Examples:** See [usage examples](./README.md#-usage-examples)
3. **Configure Storage:** Set up [S3 or R2](./README.md#storage-integration)
4. **Deploy:** Follow [deployment guide](./README.md#-deployment)

---

## Getting Help

- 📖 Read the [full README](./README.md)
- 🐛 Check [common issues](#common-issues)
- 💬 Ask on Discord
- 🔍 Browse [other examples](../README.md)

---

**Happy Image Processing! 🎨**

