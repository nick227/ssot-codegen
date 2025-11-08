/**
 * Shared DTO and validator generation logic
 * Eliminates duplicate code between registry and legacy modes
 */

import type { ParsedModel } from '../dmmf-parser.js'
import { toKebabCase } from '../utils/naming.js'
import { generateAllDTOs } from '../generators/dto-generator.js'
import { generateAllValidators } from '../generators/validator-generator.js'
import type { GeneratedFilesBuilder } from './generated-files-builder.js'

/**
 * Generates DTOs and validators for a model
 * Uses FileBuilder for validation and deduplication
 * 
 * Used by both registry and legacy generation modes to eliminate duplicate logic
 */
export class DTOValidatorGenerator {
  /**
   * Generate DTOs and validators for a model
   * @returns true if all files generated successfully
   */
  static generateForModel(
    model: ParsedModel,
    filesBuilder: GeneratedFilesBuilder
  ): boolean {
    const modelKebab = toKebabCase(model.name)
    let allSuccess = true
    
    // Generate DTOs
    const dtos = generateAllDTOs(model)
    const dtoBuilder = filesBuilder.getDTOBuilder(model.name)
    
    allSuccess = dtoBuilder.addFile(`${modelKebab}.create.dto.ts`, dtos.create, model.name) && allSuccess
    allSuccess = dtoBuilder.addFile(`${modelKebab}.update.dto.ts`, dtos.update, model.name) && allSuccess
    allSuccess = dtoBuilder.addFile(`${modelKebab}.read.dto.ts`, dtos.read, model.name) && allSuccess
    allSuccess = dtoBuilder.addFile(`${modelKebab}.query.dto.ts`, dtos.query, model.name) && allSuccess
    
    // Generate validators
    const validators = generateAllValidators(model)
    const validatorBuilder = filesBuilder.getValidatorBuilder(model.name)
    
    allSuccess = validatorBuilder.addFile(`${modelKebab}.create.zod.ts`, validators.create, model.name) && allSuccess
    allSuccess = validatorBuilder.addFile(`${modelKebab}.update.zod.ts`, validators.update, model.name) && allSuccess
    allSuccess = validatorBuilder.addFile(`${modelKebab}.query.zod.ts`, validators.query, model.name) && allSuccess
    
    return allSuccess
  }
}

