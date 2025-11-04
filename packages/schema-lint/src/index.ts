export interface LintIssue { path: string; message: string; severity: 'error'|'warn' }
export const lintSchema = (schemaText: string): LintIssue[] => {
  const issues: LintIssue[] = []
  if (!schemaText.includes('model')) issues.push({ path: 'schema', message: 'No models defined', severity: 'error' })
  return issues
}
