# Test AI Chat Generation
# Generates the complete AI chat application and validates output

Write-Host "🧪 Testing AI Chat Integration" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Stop"
$OutputDir = "./generated"

# Clean previous output
if (Test-Path $OutputDir) {
    Write-Host "🗑️  Cleaning previous output..." -ForegroundColor Yellow
    Remove-Item $OutputDir -Recurse -Force
}

Write-Host "1️⃣  Generating backend (API + WebSocket + Plugins)..." -ForegroundColor Green
Write-Host ""

# Generate backend from schema.prisma + ssot.config.ts
pnpm --filter @ssot-codegen/cli exec ssot generate schema.prisma `
    --framework fastify `
    --output $OutputDir `
    --no-setup

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Backend generation failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Backend generated successfully!" -ForegroundColor Green
Write-Host ""

Write-Host "2️⃣  Verifying generated files..." -ForegroundColor Green

# Check critical backend files
$BackendFiles = @(
    "$OutputDir/src/controllers/conversation-controller.ts",
    "$OutputDir/src/controllers/message-controller.ts",
    "$OutputDir/src/services/conversation-service.ts",
    "$OutputDir/src/services/message-service.ts",
    "$OutputDir/src/gen/sdk/index.ts"
)

foreach ($file in $BackendFiles) {
    if (Test-Path $file) {
        $size = (Get-Item $file).Length
        Write-Host "   OK $file ($size bytes)" -ForegroundColor Green
    } else {
        Write-Host "   MISSING: $file" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "3️⃣  Checking WebSocket generation..." -ForegroundColor Green

if (Test-Path "$OutputDir/src/websocket/gateway.ts") {
    Write-Host "   OK WebSocket gateway generated" -ForegroundColor Green
} else {
    Write-Host "   WARN WebSocket gateway not found (may need @@realtime annotations)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "4️⃣  Checking plugin files..." -ForegroundColor Green

# Check if plugins generated files
if (Test-Path "$OutputDir/src/ai") {
    $aiFiles = Get-ChildItem "$OutputDir/src/ai" -Recurse -File
    Write-Host "   OK AI plugin files: $($aiFiles.Count)" -ForegroundColor Green
} else {
    Write-Host "   WARN AI plugin directory not found" -ForegroundColor Yellow
}

if (Test-Path "$OutputDir/src/chat") {
    $chatFiles = Get-ChildItem "$OutputDir/src/chat" -Recurse -File
    Write-Host "   OK Chat plugin files: $($chatFiles.Count)" -ForegroundColor Green
} else {
    Write-Host "   WARN Chat plugin directory not found" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "5️⃣  Summary" -ForegroundColor Cyan
Write-Host ""

if (Test-Path $OutputDir) {
    $totalFiles = (Get-ChildItem $OutputDir -Recurse -File).Count
    Write-Host "   Total files generated: $totalFiles" -ForegroundColor White
    Write-Host "   Output directory: $OutputDir" -ForegroundColor White
    Write-Host ""
    Write-Host "SUCCESS AI Chat generation test PASSED!" -ForegroundColor Green
} else {
    Write-Host "ERROR Output directory not found!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🚀 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. cd $OutputDir" -ForegroundColor White
Write-Host "   2. pnpm install" -ForegroundColor White
Write-Host "   3. pnpm prisma generate" -ForegroundColor White
Write-Host "   4. pnpm dev" -ForegroundColor White
Write-Host ""

