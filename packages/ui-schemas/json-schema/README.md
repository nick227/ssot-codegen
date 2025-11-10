# SSOT UI JSON Schemas

These JSON Schema files provide IDE autocomplete and validation for SSOT UI template files.

## Usage in VS Code

Add to your JSON file:

```json
{
  "$schema": "https://ssot-ui.dev/schemas/v3/template.json",
  "version": "1.0.0",
  ...
}
```

## Available Schemas

- `template.json`
- `page.json`
- `list-page.json`
- `detail-page.json`
- `form-page.json`
- `data-contract.json`
- `capabilities.json`
- `mappings.json`
- `models.json`
- `theme.json`
- `i18n.json`

## Local Development

Point to local schema files:

```json
{
  "$schema": "./node_modules/@ssot-ui/schemas/json-schema/template.json"
}
```
