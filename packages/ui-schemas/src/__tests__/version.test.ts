import { describe, it, expect } from 'vitest'
import { 
  parseSemVer, 
  parseSemVerRange, 
  compareVersions, 
  satisfiesRange,
  checkVersionCompatibility 
} from '../version.js'

describe('Version Validation', () => {
  describe('parseSemVer', () => {
    it('should parse valid semver', () => {
      expect(parseSemVer('3.2.1')).toEqual({ major: 3, minor: 2, patch: 1 })
      expect(parseSemVer('1.0.0')).toEqual({ major: 1, minor: 0, patch: 0 })
    })
    
    it('should return null for invalid semver', () => {
      expect(parseSemVer('invalid')).toBeNull()
      expect(parseSemVer('1.0')).toBeNull()
    })
  })
  
  describe('parseSemVerRange', () => {
    it('should parse caret range', () => {
      const result = parseSemVerRange('^3.0.0')
      expect(result?.operator).toBe('^')
      expect(result?.version).toEqual({ major: 3, minor: 0, patch: 0 })
    })
    
    it('should parse exact version', () => {
      const result = parseSemVerRange('3.0.0')
      expect(result?.operator).toBeNull()
      expect(result?.version).toEqual({ major: 3, minor: 0, patch: 0 })
    })
  })
  
  describe('compareVersions', () => {
    it('should compare major versions', () => {
      const v3 = { major: 3, minor: 0, patch: 0 }
      const v4 = { major: 4, minor: 0, patch: 0 }
      expect(compareVersions(v3, v4)).toBeLessThan(0)
      expect(compareVersions(v4, v3)).toBeGreaterThan(0)
    })
    
    it('should compare minor versions', () => {
      const v30 = { major: 3, minor: 0, patch: 0 }
      const v31 = { major: 3, minor: 1, patch: 0 }
      expect(compareVersions(v30, v31)).toBeLessThan(0)
      expect(compareVersions(v31, v30)).toBeGreaterThan(0)
    })
  })
  
  describe('satisfiesRange', () => {
    it('should satisfy caret range', () => {
      const v320 = { major: 3, minor: 2, patch: 0 }
      expect(satisfiesRange(v320, '^3.0.0')).toBe(true)  // Same major, higher minor
      expect(satisfiesRange(v320, '^3.2.0')).toBe(true)  // Same major.minor
      expect(satisfiesRange(v320, '^3.3.0')).toBe(false) // Lower minor
      expect(satisfiesRange(v320, '^4.0.0')).toBe(false) // Different major
    })
  })
  
  describe('checkVersionCompatibility', () => {
    it('should pass for compatible versions', () => {
      const result = checkVersionCompatibility('3.2.0', '^3.0.0')
      expect(result.compatible).toBe(true)
      expect(result.level).toBe('ok')
    })
    
    it('should fail for major version mismatch', () => {
      const result = checkVersionCompatibility('3.2.0', '^4.0.0')
      expect(result.compatible).toBe(false)
      expect(result.level).toBe('error')
      expect(result.message).toContain('INCOMPATIBLE')
      expect(result.message).toContain('Upgrade runtime')
    })
    
    it('should warn for minor version mismatch', () => {
      const result = checkVersionCompatibility('3.1.0', '^3.2.0')
      expect(result.compatible).toBe(false)
      expect(result.level).toBe('warning')
      expect(result.message).toContain('VERSION MISMATCH')
    })
  })
})

