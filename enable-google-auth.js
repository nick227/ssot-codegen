/**
 * Enable Google Auth Plugin and Regenerate
 */

import fs from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

console.log('🔐 Enabling Google Auth Plugin...\n')

// Read .env file
const envPath = join(__dirname, '.env')

if (!fs.existsSync(envPath)) {
  console.log('❌ .env file not found! Please create one first.')
  process.exit(1)
}

let envContent = fs.readFileSync(envPath, 'utf-8')

// Check if ENABLE_GOOGLE_AUTH already exists
if (envContent.includes('ENABLE_GOOGLE_AUTH')) {
  console.log('✅ ENABLE_GOOGLE_AUTH already set in .env')
  
  // Update it to true if it's false
  envContent = envContent.replace(/ENABLE_GOOGLE_AUTH=false/g, 'ENABLE_GOOGLE_AUTH=true')
} else {
  // Add it after GOOGLE_CLIENT_SECRET or at the end of auth section
  if (envContent.includes('GOOGLE_CLIENT_SECRET')) {
    envContent = envContent.replace(
      /(GOOGLE_CLIENT_SECRET=.+)/,
      `ENABLE_GOOGLE_AUTH=true\n$1`
    )
    console.log('✅ Added ENABLE_GOOGLE_AUTH=true to .env')
  } else {
    console.log('⚠️  Google credentials not found in .env')
    console.log('   Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET first')
    process.exit(1)
  }
}

// Add AUTH_STRATEGY if not present
if (!envContent.includes('AUTH_STRATEGY')) {
  envContent = envContent.replace(
    /(GOOGLE_CALLBACK_URL=.+)/,
    `$1\nAUTH_STRATEGY="jwt"\nAUTH_USER_MODEL="User"`
  )
  console.log('✅ Added AUTH_STRATEGY and AUTH_USER_MODEL to .env')
}

// Write back
fs.writeFileSync(envPath, envContent)

console.log('\n✅ Google Auth plugin enabled!')
console.log('\n📋 Your .env now includes:')
console.log('   ENABLE_GOOGLE_AUTH=true')
console.log('   AUTH_STRATEGY="jwt"')
console.log('   AUTH_USER_MODEL="User"')
console.log('\n🚀 Now run: node test-google-auth.js')

