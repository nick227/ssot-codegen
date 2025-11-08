/**
 * Field helper utilities tests
 */

import { describe, it, expect } from 'vitest'
import { parseDMMF } from '../parsing/core.js'
import { getField, getRelationTarget, isOptionalForCreate, isNullable } from '../utils/field-helpers.js'
import { simpleUserDMMF, relatedModelsDMMF } from './fixtures.js'

describe('Field Helper Utilities', () => {
  describe('getField', () => {
    it('should find field by name', () => {
      const schema = parseDMMF(simpleUserDMMF)
      const user = schema.models[0]
      
      const emailField = getField(user, 'email')
      expect(emailField).toBeDefined()
      expect(emailField?.name).toBe('email')
    })

    it('should return undefined for non-existent field', () => {
      const schema = parseDMMF(simpleUserDMMF)
      const user = schema.models[0]
      
      const field = getField(user, 'nonExistent')
      expect(field).toBeUndefined()
    })

    it('should find ID field', () => {
      const schema = parseDMMF(simpleUserDMMF)
      const user = schema.models[0]
      
      const idField = getField(user, 'id')
      expect(idField?.isId).toBe(true)
    })
  })

  describe('getRelationTarget', () => {
    it('should return target model for relation field', () => {
      const schema = parseDMMF(relatedModelsDMMF)
      const post = schema.models.find(m => m.name === 'Post')!
      const authorField = post.relationFields.find(f => f.name === 'author')!
      
      const target = getRelationTarget(authorField, schema.modelMap)
      expect(target).toBeDefined()
      expect(target?.name).toBe('User')
    })

    it('should return undefined for scalar field', () => {
      const schema = parseDMMF(simpleUserDMMF)
      const user = schema.models[0]
      const emailField = user.fields.find(f => f.name === 'email')!
      
      const target = getRelationTarget(emailField, schema.modelMap)
      expect(target).toBeUndefined()
    })

    it('should return undefined for non-existent target', () => {
      const schema = parseDMMF(simpleUserDMMF)
      const user = schema.models[0]
      
      // Create fake relation field with non-existent target
      const fakeField = {
        ...user.fields[0],
        kind: 'object' as const,
        type: 'NonExistentModel'
      }
      
      const target = getRelationTarget(fakeField, schema.modelMap)
      expect(target).toBeUndefined()
    })
  })

  describe('isOptionalForCreate', () => {
    it('should return true for nullable fields', () => {
      const schema = parseDMMF(simpleUserDMMF)
      const user = schema.models[0]
      const nameField = getField(user, 'name')!
      
      expect(isOptionalForCreate(nameField)).toBe(true)
    })

    it('should return true for fields with defaults', () => {
      const schema = parseDMMF(simpleUserDMMF)
      const user = schema.models[0]
      const idField = getField(user, 'id')!
      
      expect(isOptionalForCreate(idField)).toBe(true)
    })

    it('should return false for required fields without defaults', () => {
      const schema = parseDMMF(simpleUserDMMF)
      const user = schema.models[0]
      const emailField = getField(user, 'email')!
      
      expect(isOptionalForCreate(emailField)).toBe(false)
    })
  })

  describe('isNullable', () => {
    it('should return true for nullable fields', () => {
      const schema = parseDMMF(simpleUserDMMF)
      const user = schema.models[0]
      const nameField = getField(user, 'name')!
      
      expect(isNullable(nameField)).toBe(true)
    })

    it('should return false for required fields', () => {
      const schema = parseDMMF(simpleUserDMMF)
      const user = schema.models[0]
      const emailField = getField(user, 'email')!
      
      expect(isNullable(emailField)).toBe(false)
    })
  })
})

