import crypto from 'node:crypto'
import { promisify } from 'node:util'

const scrypt = promisify(crypto.scrypt)
const randomBytes = promisify(crypto.randomBytes)

// Configuration
const SALT_LENGTH = 32
const KEY_LENGTH = 64
const SCRYPT_OPTIONS = {
  N: 16384, // CPU/memory cost (2^14)
  r: 8,     // Block size
  p: 1,     // Parallelization
}

/**
 * Hash a password using scrypt
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters')
  }

  // Generate random salt
  const salt = await randomBytes(SALT_LENGTH)

  // Hash password
  const derivedKey = (await scrypt(
    password,
    salt,
    KEY_LENGTH,
    SCRYPT_OPTIONS
  )) as Buffer

  // Combine salt and hash
  return `${salt.toString('hex')}:${derivedKey.toString('hex')}`
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  try {
    // Split salt and hash
    const [saltHex, keyHex] = hash.split(':')
    if (!saltHex || !keyHex) {
      return false
    }

    const salt = Buffer.from(saltHex, 'hex')
    const originalKey = Buffer.from(keyHex, 'hex')

    // Hash provided password with same salt
    const derivedKey = (await scrypt(
      password,
      salt,
      KEY_LENGTH,
      SCRYPT_OPTIONS
    )) as Buffer

    // Timing-safe comparison
    return crypto.timingSafeEqual(originalKey, derivedKey)
  } catch {
    return false
  }
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters')
  }

  if (password.length > 128) {
    errors.push('Password must not exceed 128 characters')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  if (!/[^a-zA-Z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }

  // Check for common passwords
  const commonPasswords = [
    'password',
    '12345678',
    'qwerty',
    'admin',
    'letmein',
  ]
  if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
    errors.push('Password is too common')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Generate a secure random password
 */
export async function generateSecurePassword(length: number = 16): Promise<string> {
  if (length < 12) {
    throw new Error('Password length must be at least 12 characters')
  }

  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const numbers = '0123456789'
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?'
  const all = lowercase + uppercase + numbers + special

  let password = ''
  
  // Ensure at least one of each type
  password += lowercase[crypto.randomInt(lowercase.length)]
  password += uppercase[crypto.randomInt(uppercase.length)]
  password += numbers[crypto.randomInt(numbers.length)]
  password += special[crypto.randomInt(special.length)]

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += all[crypto.randomInt(all.length)]
  }

  // Shuffle the password
  return password
    .split('')
    .sort(() => crypto.randomInt(3) - 1)
    .join('')
}

