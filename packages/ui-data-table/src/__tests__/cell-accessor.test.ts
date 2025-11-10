/**
 * Tests for cell accessor utilities
 */

import { describe, it, expect } from 'vitest'
import { getNestedValue, isRelationPath, getRelationName, formatFieldLabel } from '../utils/cell-accessor'

describe('getNestedValue', () => {
  it('should get simple property', () => {
    const obj = { title: 'Hello' }
    expect(getNestedValue(obj, 'title')).toBe('Hello')
  })
  
  it('should get nested property', () => {
    const obj = { author: { name: 'John' } }
    expect(getNestedValue(obj, 'author.name')).toBe('John')
  })
  
  it('should get deeply nested property', () => {
    const obj = { post: { author: { profile: { name: 'John' } } } }
    expect(getNestedValue(obj, 'post.author.profile.name')).toBe('John')
  })
  
  it('should return undefined for missing property', () => {
    const obj = { title: 'Hello' }
    expect(getNestedValue(obj, 'author.name')).toBeUndefined()
  })
  
  it('should return undefined for null/undefined object', () => {
    expect(getNestedValue(null, 'title')).toBeUndefined()
    expect(getNestedValue(undefined, 'title')).toBeUndefined()
  })
  
  it('should handle null in path', () => {
    const obj = { author: null }
    expect(getNestedValue(obj, 'author.name')).toBeUndefined()
  })
})

describe('isRelationPath', () => {
  it('should return true for nested path', () => {
    expect(isRelationPath('author.name')).toBe(true)
    expect(isRelationPath('post.author.name')).toBe(true)
  })
  
  it('should return false for simple path', () => {
    expect(isRelationPath('title')).toBe(false)
    expect(isRelationPath('published')).toBe(false)
  })
})

describe('getRelationName', () => {
  it('should extract relation name', () => {
    expect(getRelationName('author.name')).toBe('author')
    expect(getRelationName('post.author.name')).toBe('post')
  })
  
  it('should return null for simple path', () => {
    expect(getRelationName('title')).toBeNull()
  })
})

describe('formatFieldLabel', () => {
  it('should format camelCase', () => {
    expect(formatFieldLabel('createdAt')).toBe('Created At')
    expect(formatFieldLabel('firstName')).toBe('First Name')
  })
  
  it('should format snake_case', () => {
    expect(formatFieldLabel('created_at')).toBe('Created At')
    expect(formatFieldLabel('first_name')).toBe('First Name')
  })
  
  it('should capitalize first letter', () => {
    expect(formatFieldLabel('title')).toBe('Title')
    expect(formatFieldLabel('name')).toBe('Name')
  })
  
  it('should handle already formatted strings', () => {
    expect(formatFieldLabel('Title')).toBe('Title')
  })
})

