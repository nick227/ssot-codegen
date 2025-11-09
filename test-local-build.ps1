# Automated test script for local build and generation

Write-Host "`n=== Step 1: Building ssot-codegen ===" -ForegroundColor Cyan
cd C:\wamp64\www\ssot-codegen
pnpm build

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ Build succeeded`n" -ForegroundColor Green

Write-Host "=== Step 2: Testing generation ===" -ForegroundColor Cyan
cd C:\wamp64\www\test-ssot\my-test-api

Write-Host "Running: node C:\wamp64\www\ssot-codegen\packages\cli\dist\cli.js generate prisma/schema.prisma`n"
node C:\wamp64\www\ssot-codegen\packages\cli\dist\cli.js generate prisma/schema.prisma

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Generation succeeded!" -ForegroundColor Green
    Write-Host "`n=== Generated files ===" -ForegroundColor Cyan
    if (Test-Path "generated") {
        Get-ChildItem -Path generated -Recurse -File | Select-Object FullName
    }
} else {
    Write-Host "`n❌ Generation failed!" -ForegroundColor Red
    exit 1
}

