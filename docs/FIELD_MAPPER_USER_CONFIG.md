# Field Mapper User Configuration

## 🎯 The System

**Smart Defaults** + **User Overrides** = Flexible Field Mapping

The field mapper provides intelligent automatic detection, but users can:
1. ✅ **Override** incorrect mappings
2. ✅ **Extend** the library with custom patterns
3. ✅ ✅ **Set explicit** mappings for specific fields

---

## 📝 Configuration in `ssot.config.ts`

### New Config Section: `fieldMappings`

```typescript
// ssot.config.ts
export default {
  // Existing config...
  framework: 'express',
  useRegistry: false,
  
  // NEW: Field mapping configuration
  fieldMappings: {
    // 1. Extend the pattern library
    customPatterns: {
      'identity.customId': {
        patterns: ['reference', 'refId', 'externalId'],
        confidence: 90
      },
      'status.archived': {
        patterns: ['archived', 'isArchived', 'deleted', 'isDeleted'],
        confidence: 95
      }
    },
    
    // 2. Override specific model fields
    overrides: {
      Post: {
        heading: 'display.title',        // Force this mapping
        bodyText: 'content.description',
        isLive: 'status.published'
      },
      Product: {
        sku: 'identity.sku',
        price: 'quantitative.price',
        inStock: 'status.available'
      }
    },
    
    // 3. Global field overrides (any model)
    globalOverrides: {
      companyName: 'display.title',
      organizationId: 'identity.organization'
    },
    
    // 4. Ignore specific fields (never map)
    ignore: [
      'internalNotes',
      'debugInfo',
      'legacyField'
    ],
    
    // 5. Confidence threshold
    minConfidence: 70  // Only accept mappings with 70%+ confidence
  }
}
```

---

## 🔧 How It Works

### 1. Priority Order (Highest to Lowest)

```typescript
function resolveFieldMapping(field: ParsedField, model: ParsedModel): FieldMapping {
  // 1. Check model-specific overrides (HIGHEST PRIORITY)
  if (config.fieldMappings.overrides?.[model.name]?.[field.name]) {
    return {
      concept: config.fieldMappings.overrides[model.name][field.name],
      confidence: 100,
      source: 'user-override'
    }
  }
  
  // 2. Check global overrides
  if (config.fieldMappings.globalOverrides?.[field.name]) {
    return {
      concept: config.fieldMappings.globalOverrides[field.name],
      confidence: 100,
      source: 'global-override'
    }
  }
  
  // 3. Check ignore list
  if (config.fieldMappings.ignore?.includes(field.name)) {
    return {
      concept: 'metadata.ignored',
      confidence: 100,
      source: 'user-ignore'
    }
  }
  
  // 4. Try auto-detection with extended patterns
  const matcher = new FieldMatcher({
    customPatterns: config.fieldMappings.customPatterns
  })
  
  const match = matcher.match(field, { modelName: model.name })
  
  // 5. Apply confidence threshold
  if (match && match.confidence >= (config.fieldMappings.minConfidence || 70)) {
    return {
      concept: match.concept.id,
      confidence: match.confidence,
      source: 'auto-detected'
    }
  }
  
  // 6. Fallback to generic
  return {
    concept: determineGenericConcept(field),
    confidence: 50,
    source: 'fallback'
  }
}
```

---

## 📚 Configuration Examples

### Example 1: E-commerce App

```typescript
// ssot.config.ts
export default {
  fieldMappings: {
    // Custom patterns for e-commerce
    customPatterns: {
      'identity.sku': {
        patterns: ['sku', 'productCode', 'itemNumber', 'partNumber'],
        confidence: 95
      },
      'quantitative.price': {
        patterns: ['price', 'cost', 'amount', 'unitPrice'],
        confidence: 90
      },
      'status.inStock': {
        patterns: ['inStock', 'available', 'inventory', 'stock'],
        confidence: 85
      }
    },
    
    // Override Product model fields
    overrides: {
      Product: {
        name: 'display.title',
        description: 'content.description',
        sku: 'identity.sku',
        price: 'quantitative.price',
        inStock: 'status.inStock',
        imageUrl: 'media.image',
        category: 'relational.category'
      }
    }
  }
}
```

### Example 2: Multi-tenant SaaS

```typescript
// ssot.config.ts
export default {
  fieldMappings: {
    // Global overrides for tenant fields
    globalOverrides: {
      tenantId: 'identity.tenant',
      organizationId: 'identity.organization',
      workspaceId: 'identity.workspace'
    },
    
    // Custom patterns
    customPatterns: {
      'identity.tenant': {
        patterns: ['tenantId', 'tenant', 'organization', 'workspace'],
        confidence: 100
      }
    },
    
    // Ignore internal fields
    ignore: [
      'internalFlags',
      'debugMode',
      'testData'
    ]
  }
}
```

### Example 3: Healthcare App (HIPAA Compliance)

```typescript
// ssot.config.ts
export default {
  fieldMappings: {
    // Mark sensitive fields as security
    overrides: {
      Patient: {
        ssn: 'security.sensitive',
        medicalRecordNumber: 'security.sensitive',
        diagnosis: 'security.sensitive'
      },
      Appointment: {
        notes: 'security.sensitive'
      }
    },
    
    // Custom patterns for healthcare
    customPatterns: {
      'identity.mrn': {
        patterns: ['mrn', 'medicalRecordNumber', 'patientId'],
        confidence: 100
      }
    },
    
    // Never show these fields in admin panel
    ignore: [
      'ssn',
      'insuranceNumber',
      'billingDetails'
    ],
    
    // High confidence threshold for security
    minConfidence: 90
  }
}
```

### Example 4: Fixing Bad Auto-Detection

```typescript
// ssot.config.ts
export default {
  fieldMappings: {
    // The mapper incorrectly detected these fields
    overrides: {
      Post: {
        // Mapper thought "summary" was subtitle, but it's actually the main content
        summary: 'content.description',  // Fix: Not subtitle
        
        // Mapper thought "author" was the author field, but it's actually a string
        author: 'display.subtitle',  // Fix: Not a relation
        
        // Mapper missed this one
        isHidden: 'status.published'  // Fix: Add mapping
      }
    }
  }
}
```

---

## 🎨 Admin Panel Integration

### Configuration UI in Admin Panel

```tsx
// Admin panel can show mapping sources
<FieldMappingDebugger>
  <Field name="title">
    <ConceptBadge>display.title</ConceptBadge>
    <SourceBadge>auto-detected (95%)</SourceBadge>
    <OverrideButton onClick={openMappingEditor} />
  </Field>
  
  <Field name="heading">
    <ConceptBadge>display.title</ConceptBadge>
    <SourceBadge variant="success">user-override (100%)</SourceBadge>
    <EditButton onClick={openMappingEditor} />
  </Field>
</FieldMappingDebugger>
```

### Mapping Editor

```tsx
// Click "Override" button to edit mapping
<MappingEditor field="heading" model="Post">
  <Label>Map "heading" to:</Label>
  <Select value="display.title" onChange={updateMapping}>
    <option value="display.title">Primary Title</option>
    <option value="display.subtitle">Subtitle</option>
    <option value="content.description">Description</option>
    <option value="metadata.ignored">Ignore (Hide)</option>
  </Select>
  
  <SaveButton onClick={() => {
    // Saves to ssot.config.ts
    saveOverride('Post', 'heading', 'display.title')
  }} />
</MappingEditor>
```

---

## 📝 Config Schema

```typescript
// packages/gen/src/code-generator.ts

export interface CodeGeneratorConfig {
  // ... existing config ...
  
  /**
   * Field mapping configuration for dynamic UI generation
   */
  fieldMappings?: FieldMappingConfig
}

export interface FieldMappingConfig {
  /**
   * Custom pattern definitions to extend the library
   */
  customPatterns?: Record<string, CustomPatternDef>
  
  /**
   * Model-specific field overrides
   */
  overrides?: Record<string, Record<string, string>>
  
  /**
   * Global field overrides (apply to any model)
   */
  globalOverrides?: Record<string, string>
  
  /**
   * Fields to ignore (never map)
   */
  ignore?: string[]
  
  /**
   * Minimum confidence threshold (0-100)
   */
  minConfidence?: number
}

export interface CustomPatternDef {
  /**
   * Field name patterns to match
   */
  patterns: string[]
  
  /**
   * Base confidence score
   */
  confidence: number
  
  /**
   * Optional: only apply in specific model contexts
   */
  strongIn?: string[]
}
```

---

## 🔄 Migration/Upgrade Path

### Discovering Needed Overrides

```typescript
// CLI command to analyze mappings
pnpm ssot analyze-mappings

// Output:
// ✓ Post.title → display.title (95% confidence)
// ✓ Post.content → content.description (90% confidence)
// ⚠ Post.heading → display.subtitle (65% confidence) LOW CONFIDENCE
// ⚠ Post.author → relational.author (60% confidence) LOW CONFIDENCE
// ✗ Post.customField → unknown (no match)
//
// Suggestions:
//   Add to ssot.config.ts:
//   fieldMappings: {
//     overrides: {
//       Post: {
//         heading: 'display.title',  // Recommended
//         author: 'display.subtitle', // Or 'relational.author'?
//         customField: 'metadata.ignored'
//       }
//     }
//   }
```

### Auto-generate Config from Review

```typescript
// Interactive CLI
pnpm ssot configure-mappings

// Prompts:
// Post.heading is mapped to "display.subtitle" with 65% confidence
//   [1] Accept (display.subtitle)
//   [2] Change to display.title
//   [3] Change to content.description
//   [4] Ignore this field
// > 2

// Generates config:
// fieldMappings: {
//   overrides: {
//     Post: {
//       heading: 'display.title'
//     }
//   }
// }
```

---

## 🎯 Benefits

### 1. **Smart Defaults**
- Works out of the box with zero config
- Handles 80-90% of cases automatically

### 2. **User Control**
- Override anything that's wrong
- Add domain-specific patterns
- Hide sensitive fields

### 3. **Confidence Visibility**
- See how fields were mapped
- Know which ones need attention
- Set thresholds for quality

### 4. **Iterative Refinement**
- Start with auto-detection
- Override as needed
- Build up custom patterns over time

### 5. **Team Sharing**
- Config checked into git
- Everyone uses same mappings
- Document domain knowledge

---

## 📊 Mapping Source Indicators

In the admin panel UI, show where each mapping came from:

```tsx
// Visual indicators
<Field name="title">
  <Badge color="green">auto (95%)</Badge>
  // Green = high confidence auto-detection
</Field>

<Field name="heading">
  <Badge color="blue">override</Badge>
  // Blue = user override (explicit)
</Field>

<Field name="customId">
  <Badge color="purple">custom</Badge>
  // Purple = custom pattern match
</Field>

<Field name="internal">
  <Badge color="gray">ignored</Badge>
  // Gray = user explicitly ignored
</Field>

<Field name="unknown">
  <Badge color="yellow">fallback (50%)</Badge>
  // Yellow = low confidence, needs review
</Field>
```

---

## 🚀 Implementation

### Updated Field Matcher

```typescript
// packages/ui-core/src/field-library/matcher.ts

export class FieldMatcher {
  constructor(
    private config?: FieldMappingConfig
  ) {
    this.loadLibrary()
    this.loadCustomPatterns(config?.customPatterns)
  }
  
  match(field: ParsedField, context: MatchContext): MatchResult | null {
    // Check overrides first
    const override = this.checkOverrides(field, context)
    if (override) return override
    
    // Check ignore list
    if (this.isIgnored(field)) return null
    
    // Auto-detect with custom patterns
    const match = this.autoDetect(field, context)
    
    // Apply confidence threshold
    const minConfidence = this.config?.minConfidence || 70
    if (match && match.confidence >= minConfidence) {
      return match
    }
    
    return null
  }
  
  private checkOverrides(field: ParsedField, context: MatchContext): MatchResult | null {
    // Model-specific override
    if (context.modelName && this.config?.overrides?.[context.modelName]?.[field.name]) {
      return {
        concept: this.conceptIndex.get(this.config.overrides[context.modelName][field.name])!,
        confidence: 100,
        source: 'user-override',
        matchedPattern: { value: field.name, type: 'exact', confidence: 100 },
        reasons: ['User override in ssot.config.ts']
      }
    }
    
    // Global override
    if (this.config?.globalOverrides?.[field.name]) {
      return {
        concept: this.conceptIndex.get(this.config.globalOverrides[field.name])!,
        confidence: 100,
        source: 'global-override',
        matchedPattern: { value: field.name, type: 'exact', confidence: 100 },
        reasons: ['Global override in ssot.config.ts']
      }
    }
    
    return null
  }
  
  private isIgnored(field: ParsedField): boolean {
    return this.config?.ignore?.includes(field.name) || false
  }
}
```

---

## 🎯 Summary

**Field Mapper = Smart Defaults + User Control**

Users can:
1. ✅ Let it auto-detect (80-90% accuracy)
2. ✅ Override wrong detections
3. ✅ Add custom patterns for their domain
4. ✅ Set explicit mappings for critical fields
5. ✅ Ignore sensitive/internal fields
6. ✅ Set confidence thresholds

All via `fieldMappings` in `ssot.config.ts`!

---

**Does this capture the user control layer you had in mind?** 🎯

