/**
 * Fixture Builders
 * Fluent API for building test data
 */

import type { ParsedModel, ParsedField } from '../dmmf-parser.js'

/**
 * Field Builder - Fluent API for creating test fields
 */
export class FieldBuilder {
  private field: Partial<ParsedField> = {
    kind: 'scalar',
    isList: false,
    isRequired: true,
    isUnique: false,
    isId: false,
    isReadOnly: false,
    isUpdatedAt: false,
    hasDefaultValue: false
  }

  name(name: string): this {
    this.field.name = name
    return this
  }

  type(type: string): this {
    this.field.type = type
    return this
  }

  scalar(): this {
    this.field.kind = 'scalar'
    return this
  }

  enum(): this {
    this.field.kind = 'enum'
    return this
  }

  relation(): this {
    this.field.kind = 'object'
    return this
  }

  id(): this {
    this.field.isId = true
    return this
  }

  unique(): this {
    this.field.isUnique = true
    return this
  }

  optional(): this {
    this.field.isRequired = false
    return this
  }

  required(): this {
    this.field.isRequired = true
    return this
  }

  list(): this {
    this.field.isList = true
    return this
  }

  defaultValue(value: unknown): this {
    this.field.hasDefaultValue = true
    this.field.default = value
    return this
  }

  readonly(): this {
    this.field.isReadOnly = true
    return this
  }

  updatedAt(): this {
    this.field.isUpdatedAt = true
    this.field.isReadOnly = true
    return this
  }

  build(): ParsedField {
    if (!this.field.name || !this.field.type) {
      throw new Error('Field must have name and type')
    }
    return this.field as ParsedField
  }
}

/**
 * Model Builder - Fluent API for creating test models
 */
export class ModelBuilder {
  private model: Partial<ParsedModel> = {
    uniqueFields: [],
    primaryKey: { fields: [] }
  }
  private fields: ParsedField[] = []

  name(name: string): this {
    this.model.name = name
    return this
  }

  addField(field: ParsedField): this {
    this.fields.push(field)
    return this
  }

  withIntId(): this {
    return this.addField(
      new FieldBuilder()
        .name('id')
        .type('Int')
        .scalar()
        .id()
        .build()
    )
  }

  withStringId(): this {
    return this.addField(
      new FieldBuilder()
        .name('id')
        .type('String')
        .scalar()
        .id()
        .defaultValue({ name: 'uuid', args: [] })
        .build()
    )
  }

  withTimestamps(): this {
    this.addField(
      new FieldBuilder()
        .name('createdAt')
        .type('DateTime')
        .scalar()
        .defaultValue({ name: 'now', args: [] })
        .build()
    )
    this.addField(
      new FieldBuilder()
        .name('updatedAt')
        .type('DateTime')
        .scalar()
        .updatedAt()
        .build()
    )
    return this
  }

  build(): ParsedModel {
    if (!this.model.name) {
      throw new Error('Model must have name')
    }

    this.model.fields = this.fields
    this.model.idField = this.fields.find(f => f.isId)
    this.model.scalarFields = this.fields.filter(f => f.kind !== 'object')
    this.model.relationFields = this.fields.filter(f => f.kind === 'object')
    this.model.createFields = this.fields.filter(
      f => !f.isId && !f.isReadOnly && !f.isUpdatedAt && f.kind !== 'object'
    )
    this.model.updateFields = this.model.createFields
    this.model.readFields = this.model.scalarFields

    if (this.model.idField) {
      this.model.primaryKey = { fields: [this.model.idField.name] }
    }

    return this.model as ParsedModel
  }
}

/**
 * Quick field creation helpers
 */
export const field = {
  id: (type: 'Int' | 'String' = 'Int') =>
    new FieldBuilder().name('id').type(type).scalar().id().build(),

  string: (name: string, required = true) =>
    new FieldBuilder()
      .name(name)
      .type('String')
      .scalar()
      [required ? 'required' : 'optional']()
      .build(),

  int: (name: string, required = true) =>
    new FieldBuilder()
      .name(name)
      .type('Int')
      .scalar()
      [required ? 'required' : 'optional']()
      .build(),

  boolean: (name: string, defaultValue?: boolean) => {
    const builder = new FieldBuilder()
      .name(name)
      .type('Boolean')
      .scalar()
      .required()
    
    if (defaultValue !== undefined) {
      builder.defaultValue(defaultValue)
    }
    
    return builder.build()
  },

  datetime: (name: string, autoNow = false) => {
    const builder = new FieldBuilder()
      .name(name)
      .type('DateTime')
      .scalar()
    
    if (autoNow) {
      builder.defaultValue({ name: 'now', args: [] })
    }
    
    return builder.build()
  },

  relation: (name: string, type: string, isList = false) =>
    new FieldBuilder()
      .name(name)
      .type(type)
      .relation()
      [isList ? 'list' : 'required']()
      .build()
}

/**
 * Common model templates
 */
export const models = {
  todo: () =>
    new ModelBuilder()
      .name('Todo')
      .withIntId()
      .addField(field.string('title'))
      .addField(field.boolean('completed', false))
      .addField(field.string('description', false))
      .withTimestamps()
      .build(),

  user: () =>
    new ModelBuilder()
      .name('User')
      .withStringId()
      .addField(field.string('email'))
      .addField(field.string('name'))
      .withTimestamps()
      .build(),

  post: () =>
    new ModelBuilder()
      .name('Post')
      .withIntId()
      .addField(field.string('title'))
      .addField(field.string('content', false))
      .addField(field.boolean('published', false))
      .addField(field.string('authorId'))
      .addField(field.relation('author', 'User', false))
      .withTimestamps()
      .build()
}

