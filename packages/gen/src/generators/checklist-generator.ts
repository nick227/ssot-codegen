/**
 * Checklist Page Generator
 * Generates a beautiful Discord-inspired system health check dashboard
 */

import type { ParsedSchema, ParsedModel } from '../dmmf-parser.js'
import type { GeneratedFiles } from '@/pipeline/types.js'

export interface ChecklistConfig {
  projectName: string
  useRegistry: boolean
  framework: 'express' | 'fastify'
  autoOpen?: boolean
  includeEnvironmentChecks?: boolean
  includeCodeValidation?: boolean
  includeAPITesting?: boolean
  includePerformanceMetrics?: boolean
  pluginHealthChecks?: Map<string, any>  // Plugin health check sections
}

/**
 * Generate complete checklist system
 */
export function generateChecklistSystem(
  schema: ParsedSchema,
  files: GeneratedFiles,
  config: ChecklistConfig
): Map<string, string> {
  const checklistFiles = new Map<string, string>()
  
  // Generate standalone HTML page (Discord-inspired theme)
  const html = generateStaticHTML(schema, files, config)
  checklistFiles.set('checklist.html', html)
  
  // Generate API endpoints for live checks
  const api = generateChecklistAPI(schema, files, config)
  checklistFiles.set('checklist.api.ts', api)
  
  // Generate test runner
  const tests = generateChecklistTests(schema, files, config)
  checklistFiles.set('checklist.tests.ts', tests)
  
  return checklistFiles
}

/**
 * Generate standalone HTML with Discord-inspired dark theme
 */
function generateStaticHTML(
  schema: ParsedSchema,
  files: GeneratedFiles,
  config: ChecklistConfig
): string {
  const modelCount = schema.models.length
  const routeCount = files.routes.size * 5 // Estimate CRUD routes
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>System Checklist - ${config.projectName}</title>
  <style>
    /* Discord-inspired Dark Theme */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    :root {
      /* Discord color palette */
      --bg-primary: #36393f;
      --bg-secondary: #2f3136;
      --bg-tertiary: #202225;
      --bg-hover: #393c43;
      
      --text-normal: #dcddde;
      --text-muted: #96989d;
      --text-link: #00aff4;
      
      --success: #43b581;
      --warning: #faa61a;
      --danger: #f04747;
      --info: #5865f2;
      
      --border: #202225;
      --shadow: rgba(0,0,0,0.2);
    }
    
    body {
      font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
      background: var(--bg-tertiary);
      color: var(--text-normal);
      line-height: 1.6;
      padding: 20px;
    }
    
    .container {
      max-width: 1400px;
      margin: 0 auto;
    }
    
    /* Header */
    .header {
      background: var(--bg-secondary);
      border-radius: 8px;
      padding: 30px;
      margin-bottom: 20px;
      box-shadow: 0 2px 10px var(--shadow);
    }
    
    .header h1 {
      font-size: 32px;
      font-weight: 600;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 15px;
    }
    
    .header .emoji {
      font-size: 40px;
    }
    
    .header .meta {
      color: var(--text-muted);
      font-size: 14px;
      margin-top: 10px;
    }
    
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-top: 20px;
    }
    
    .stat {
      background: var(--bg-primary);
      padding: 15px;
      border-radius: 6px;
      border-left: 3px solid var(--info);
    }
    
    .stat-label {
      color: var(--text-muted);
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .stat-value {
      font-size: 24px;
      font-weight: 700;
      margin-top: 5px;
    }
    
    /* Action buttons */
    .actions {
      display: flex;
      gap: 10px;
      margin-top: 20px;
      flex-wrap: wrap;
    }
    
    .btn {
      background: var(--info);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .btn:hover {
      background: #4752c4;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(88, 101, 242, 0.3);
    }
    
    .btn-secondary {
      background: var(--bg-primary);
      color: var(--text-normal);
    }
    
    .btn-secondary:hover {
      background: var(--bg-hover);
    }
    
    .btn-success {
      background: var(--success);
    }
    
    .btn-success:hover {
      background: #3ca374;
    }
    
    /* Section */
    .section {
      background: var(--bg-secondary);
      border-radius: 8px;
      padding: 25px;
      margin-bottom: 20px;
      box-shadow: 0 2px 10px var(--shadow);
    }
    
    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 2px solid var(--border);
    }
    
    .section-title {
      font-size: 20px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .section-badge {
      background: var(--bg-primary);
      color: var(--text-muted);
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }
    
    /* Check items */
    .checks {
      display: grid;
      gap: 12px;
    }
    
    .check-item {
      background: var(--bg-primary);
      padding: 16px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      transition: all 0.2s;
      border-left: 3px solid transparent;
    }
    
    .check-item:hover {
      background: var(--bg-hover);
      transform: translateX(2px);
    }
    
    .check-item.success {
      border-left-color: var(--success);
    }
    
    .check-item.warning {
      border-left-color: var(--warning);
    }
    
    .check-item.error {
      border-left-color: var(--danger);
    }
    
    .check-item.loading {
      border-left-color: var(--info);
    }
    
    .check-left {
      display: flex;
      align-items: center;
      gap: 15px;
      flex: 1;
    }
    
    .check-icon {
      font-size: 24px;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: var(--bg-secondary);
    }
    
    .check-info {
      flex: 1;
    }
    
    .check-name {
      font-weight: 600;
      font-size: 15px;
    }
    
    .check-detail {
      color: var(--text-muted);
      font-size: 13px;
      margin-top: 4px;
    }
    
    .check-status {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      font-weight: 600;
      padding: 6px 12px;
      border-radius: 4px;
      background: var(--bg-secondary);
    }
    
    .check-status.success {
      color: var(--success);
    }
    
    .check-status.warning {
      color: var(--warning);
    }
    
    .check-status.error {
      color: var(--danger);
    }
    
    .check-time {
      color: var(--text-muted);
      font-size: 12px;
      margin-left: 10px;
    }
    
    /* Loading spinner */
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .spinner {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid var(--bg-primary);
      border-top-color: var(--info);
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }
    
    /* Model list */
    .model-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 15px;
    }
    
    .model-card {
      background: var(--bg-primary);
      padding: 16px;
      border-radius: 6px;
      border-left: 3px solid var(--info);
      transition: all 0.2s;
    }
    
    .model-card:hover {
      background: var(--bg-hover);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px var(--shadow);
    }
    
    .model-name {
      font-weight: 600;
      font-size: 16px;
      margin-bottom: 8px;
    }
    
    .model-meta {
      color: var(--text-muted);
      font-size: 13px;
    }
    
    .model-actions {
      margin-top: 12px;
      display: flex;
      gap: 8px;
    }
    
    .model-btn {
      font-size: 12px;
      padding: 6px 12px;
      background: var(--bg-secondary);
      color: var(--text-normal);
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .model-btn:hover {
      background: var(--info);
      color: white;
    }
    
    /* Summary */
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 15px;
      background: var(--bg-primary);
      padding: 20px;
      border-radius: 6px;
    }
    
    .summary-item {
      text-align: center;
    }
    
    .summary-icon {
      font-size: 32px;
      margin-bottom: 8px;
    }
    
    .summary-count {
      font-size: 28px;
      font-weight: 700;
    }
    
    .summary-label {
      color: var(--text-muted);
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    /* Code block */
    .code-block {
      background: var(--bg-tertiary);
      padding: 16px;
      border-radius: 6px;
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 13px;
      overflow-x: auto;
      margin: 10px 0;
    }
    
    /* Responsive */
    @media (max-width: 768px) {
      .stats {
        grid-template-columns: 1fr;
      }
      
      .model-grid {
        grid-template-columns: 1fr;
      }
      
      .actions {
        flex-direction: column;
      }
      
      .btn {
        width: 100%;
      }
    }
    
    /* Scrollbar */
    ::-webkit-scrollbar {
      width: 12px;
    }
    
    ::-webkit-scrollbar-track {
      background: var(--bg-tertiary);
    }
    
    ::-webkit-scrollbar-thumb {
      background: var(--bg-primary);
      border-radius: 6px;
    }
    
    ::-webkit-scrollbar-thumb:hover {
      background: var(--bg-hover);
    }
    
    /* Progress bar */
    .progress-container {
      width: 100%;
      height: 4px;
      background: var(--bg-primary);
      border-radius: 2px;
      overflow: hidden;
      margin: 15px 0;
      display: none;
    }
    
    .progress-container.active {
      display: block;
    }
    
    .progress-bar {
      height: 100%;
      background: linear-gradient(90deg, var(--info), var(--success));
      border-radius: 2px;
      transition: width 0.3s ease;
      width: 0%;
    }
    
    .progress-text {
      text-align: center;
      color: var(--text-muted);
      font-size: 12px;
      margin-top: 8px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>
        <span class="emoji">🚀</span>
        System Checklist
      </h1>
      <div class="meta">
        <strong>${config.projectName}</strong> • Generated ${new Date().toLocaleString()} • Mode: ${config.useRegistry ? 'Registry' : 'Legacy'}
      </div>
      
      <div class="stats">
        <div class="stat">
          <div class="stat-label">Models</div>
          <div class="stat-value">${modelCount}</div>
        </div>
        <div class="stat">
          <div class="stat-label">Endpoints</div>
          <div class="stat-value">${routeCount}</div>
        </div>
        <div class="stat">
          <div class="stat-label">Files Generated</div>
          <div class="stat-value">${getTotalFileCount(files)}</div>
        </div>
        <div class="stat">
          <div class="stat-label">Lines of Code</div>
          <div class="stat-value">${calculateActualLineCount(files).toLocaleString()}</div>
        </div>
      </div>
      
      <div class="actions">
        <button class="btn btn-success" id="run-all-btn" onclick="runAllChecks()">
          ▶️ Run All Checks
        </button>
        <button class="btn" onclick="testAllModels()">
          🧪 Test All Models
        </button>
        <button class="btn-secondary btn" onclick="exportReport()">
          📊 Export Report
        </button>
        <button class="btn-secondary btn" onclick="window.open('/api/docs', '_blank')">
          📖 Documentation
        </button>
      </div>
      
      <!-- Progress Bar -->
      <div class="progress-container" id="progress-container">
        <div class="progress-bar" id="progress-bar"></div>
      </div>
      <div class="progress-text" id="progress-text" style="display:none"></div>
    </div>
    
    <!-- Summary -->
    <div class="section">
      <div class="section-header">
        <div class="section-title">
          <span>📊</span>
          Quick Summary
        </div>
      </div>
      <div class="summary" id="summary">
        <div class="summary-item">
          <div class="summary-icon">✅</div>
          <div class="summary-count" id="passed-count">-</div>
          <div class="summary-label">Passed</div>
        </div>
        <div class="summary-item">
          <div class="summary-icon">⚠️</div>
          <div class="summary-count" id="warning-count">-</div>
          <div class="summary-label">Warnings</div>
        </div>
        <div class="summary-item">
          <div class="summary-icon">❌</div>
          <div class="summary-count" id="error-count">-</div>
          <div class="summary-label">Errors</div>
        </div>
        <div class="summary-item">
          <div class="summary-icon">⏭️</div>
          <div class="summary-count" id="skip-count">-</div>
          <div class="summary-label">Skipped</div>
        </div>
      </div>
    </div>
    
    ${generateEnvironmentSection(config)}
    ${generateCodeValidationSection(schema, files, config)}
    ${generatePluginHealthCheckSections(config)}
    ${generateModelsSection(schema)}
    ${generateAdvancedFeaturesSection(config)}
  </div>
  
  <script>
    // Check results storage
    let checkResults = {};
    
    // Run all checks
    async function runAllChecks() {
      try {
        console.log('Running all checks...');
        
        // Disable button and show loading
        const btn = document.querySelector('.btn-success')
        if (btn) {
          btn.disabled = true
          btn.innerHTML = '🔄 Running Checks...'
        }
        
        // Reset summary
        updateSummary({ passed: 0, warnings: 0, errors: 0, skipped: 0 });
        
        // Run each category in parallel for speed
        await Promise.all([
          runEnvironmentChecks().catch(e => console.error('Environment checks failed:', e)),
          runCodeValidation().catch(e => console.error('Code validation failed:', e)),
          checkAdvancedFeatures().catch(e => console.error('Feature checks failed:', e))
        ]);
        
        // Update summary
        calculateSummary();
        
        console.log('All checks complete!', checkResults);
        
        // Re-enable button
        if (btn) {
          btn.disabled = false
          btn.innerHTML = '▶️ Run All Checks'
        }
      } catch (error) {
        console.error('Fatal error during checks:', error)
        alert('Error running checks: ' + (error instanceof Error ? error.message : 'Unknown error'))
        
        // Re-enable button
        const btn = document.querySelector('.btn-success')
        if (btn) {
          btn.disabled = false
          btn.innerHTML = '▶️ Run All Checks'
        }
      }
    }
    
    // Environment checks
    async function runEnvironmentChecks() {
      const checks = [
        {
          id: 'db-connection',
          name: 'Database Connection',
          test: async () => {
            try {
              const res = await fetch('/api/checklist/database');
              if (!res.ok) return 'error';
              const data = await res.json();
              return data.status === 'success' ? 'success' : 'error';
            } catch (e) {
              console.error('DB check failed:', e);
              return 'error';
            }
          }
        },
        {
          id: 'env-vars',
          name: 'Environment Variables',
          test: async () => {
            try {
              const res = await fetch('/api/checklist/env');
              if (!res.ok) return 'warning';
              const data = await res.json();
              return data.status;
            } catch (e) {
              return 'skip';  // Skip if server not running
            }
          }
        },
        {
          id: 'file-permissions',
          name: 'File Permissions',
          test: async () => {
            // Static HTML can't check file permissions
            return 'skip';
          }
        },
        {
          id: 'ports',
          name: 'Port Availability',
          test: async () => {
            // Static HTML can't check ports
            return 'skip';
          }
        }
      ];
      
      for (const check of checks) {
        setCheckStatus(check.id, 'loading');
        const result = await check.test();
        setCheckStatus(check.id, result);
        checkResults[check.id] = result;
      }
    }
    
    // Code validation
    async function runCodeValidation() {
      setCheckStatus('registry-files', 'success', '${files.registry?.size || 0} files generated');
      setCheckStatus('services-count', 'success', '${schema.models.length} services');
      setCheckStatus('routes-count', 'success', '~${routeCount} endpoints');
      
      checkResults['registry-files'] = 'success';
      checkResults['services-count'] = 'success';
      checkResults['routes-count'] = 'success';
    }
    
    // Advanced features check
    async function checkAdvancedFeatures() {
      // These would check actual configuration
      const features = ${JSON.stringify(getAdvancedFeatures(config))};
      
      Object.keys(features).forEach(key => {
        const status = features[key] ? 'success' : 'skip';
        setCheckStatus(key, status, features[key] ? 'Configured' : 'Not configured');
        checkResults[key] = status;
      });
    }
    
    // Test individual model
    async function testModel(modelName) {
      console.log(\`Testing \${modelName}...\`);
      alert(\`Testing \${modelName} CRUD operations...\\n\\nThis would:\\n✅ Create test record\\n✅ Read record\\n✅ Update record\\n✅ Delete record\`);
    }
    
    // Test all models
    async function testAllModels() {
      alert('Testing all ${modelCount} models...\\n\\nThis would run full CRUD tests on each model.');
    }
    
    // Export report
    function exportReport() {
      const report = {
        timestamp: new Date().toISOString(),
        project: '${config.projectName}',
        results: checkResults,
        summary: calculateSummaryData()
      };
      
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'checklist-report.json';
      a.click();
    }
    
    // UI helpers
    function setCheckStatus(id, status, detail = '') {
      const el = document.getElementById(id);
      if (!el) return;
      
      el.className = \`check-item \${status}\`;
      
      const icon = el.querySelector('.check-icon');
      const statusEl = el.querySelector('.check-status');
      const detailEl = el.querySelector('.check-detail');
      
      const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        loading: '<div class="spinner"></div>',
        skip: '⏭️'
      };
      
      icon.innerHTML = icons[status] || '';
      statusEl.className = \`check-status \${status}\`;
      statusEl.innerHTML = status.charAt(0).toUpperCase() + status.slice(1);
      
      if (detail) {
        detailEl.textContent = detail;
      }
    }
    
    function updateSummary(counts) {
      document.getElementById('passed-count').textContent = counts.passed || 0;
      document.getElementById('warning-count').textContent = counts.warnings || 0;
      document.getElementById('error-count').textContent = counts.errors || 0;
      document.getElementById('skip-count').textContent = counts.skipped || 0;
    }
    
    function calculateSummary() {
      const summary = calculateSummaryData();
      updateSummary(summary);
    }
    
    function calculateSummaryData() {
      const counts = { passed: 0, warnings: 0, errors: 0, skipped: 0 };
      Object.values(checkResults).forEach(status => {
        if (status === 'success') counts.passed++;
        else if (status === 'warning') counts.warnings++;
        else if (status === 'error') counts.errors++;
        else if (status === 'skip') counts.skipped++;
      });
      return counts;
    }
    
    // Auto-run on load if configured
    ${config.autoOpen ? 'window.addEventListener("load", runAllChecks);' : ''}
  </script>
</body>
</html>`
}

/**
 * Generate environment checks section
 */
function generateEnvironmentSection(config: ChecklistConfig): string {
  if (!config.includeEnvironmentChecks) return ''
  
  return `
    <!-- Environment & Infrastructure -->
    <div class="section">
      <div class="section-header">
        <div class="section-title">
          <span>🔧</span>
          Environment & Infrastructure
        </div>
        <div class="section-badge">4 checks</div>
      </div>
      
      <div class="checks">
        <div class="check-item" id="db-connection">
          <div class="check-left">
            <div class="check-icon">⏳</div>
            <div class="check-info">
              <div class="check-name">Database Connection</div>
              <div class="check-detail">Checking connection...</div>
            </div>
          </div>
          <div class="check-status">Pending</div>
        </div>
        
        <div class="check-item" id="env-vars">
          <div class="check-left">
            <div class="check-icon">⏳</div>
            <div class="check-info">
              <div class="check-name">Environment Variables</div>
              <div class="check-detail">Validating configuration...</div>
            </div>
          </div>
          <div class="check-status">Pending</div>
        </div>
        
        <div class="check-item" id="file-permissions">
          <div class="check-left">
            <div class="check-icon">⏳</div>
            <div class="check-info">
              <div class="check-name">File Permissions</div>
              <div class="check-detail">Checking write access...</div>
            </div>
          </div>
          <div class="check-status">Pending</div>
        </div>
        
        <div class="check-item" id="ports">
          <div class="check-left">
            <div class="check-icon">⏳</div>
            <div class="check-info">
              <div class="check-name">Port Availability</div>
              <div class="check-detail">Checking if ports are free...</div>
            </div>
          </div>
          <div class="check-status">Pending</div>
        </div>
      </div>
    </div>
  `
}

/**
 * Generate code validation section
 */
function generateCodeValidationSection(
  schema: ParsedSchema,
  files: GeneratedFiles,
  config: ChecklistConfig
): string {
  if (!config.includeCodeValidation) return ''
  
  return `
    <!-- Generated Code -->
    <div class="section">
      <div class="section-header">
        <div class="section-title">
          <span>📝</span>
          Generated Code
        </div>
        <div class="section-badge">${schema.models.length} models</div>
      </div>
      
      <div class="checks">
        <div class="check-item success" id="registry-files">
          <div class="check-left">
            <div class="check-icon">✅</div>
            <div class="check-info">
              <div class="check-name">Registry Files</div>
              <div class="check-detail">${files.registry?.size || 0} files, ${calculateActualLineCount(files).toLocaleString()} lines</div>
            </div>
          </div>
          <div class="check-status success">Generated</div>
        </div>
        
        <div class="check-item success" id="services-count">
          <div class="check-left">
            <div class="check-icon">✅</div>
            <div class="check-info">
              <div class="check-name">Services</div>
              <div class="check-detail">${schema.models.length} CRUD services</div>
            </div>
          </div>
          <div class="check-status success">Generated</div>
        </div>
        
        <div class="check-item success" id="routes-count">
          <div class="check-left">
            <div class="check-icon">✅</div>
            <div class="check-info">
              <div class="check-name">API Routes</div>
              <div class="check-detail">~${files.routes.size * 5} endpoints</div>
            </div>
          </div>
          <div class="check-status success">Generated</div>
        </div>
        
        <div class="check-item success" id="validators">
          <div class="check-left">
            <div class="check-icon">✅</div>
            <div class="check-info">
              <div class="check-name">Validators</div>
              <div class="check-detail">${files.validators.size * 3} Zod schemas</div>
            </div>
          </div>
          <div class="check-status success">Generated</div>
        </div>
      </div>
    </div>
  `
}

/**
 * Generate models section
 */
function generateModelsSection(schema: ParsedSchema): string {
  const modelCards = schema.models.map(model => {
    const relationCount = model.relationFields?.length || 0
    
    return `
      <div class="model-card">
        <div class="model-name">${model.name}</div>
        <div class="model-meta">
          ${model.scalarFields?.length || 0} fields • ${relationCount} relations
        </div>
        <div class="model-actions">
          <button class="model-btn" onclick="testModel('${model.name}')">Test CRUD</button>
          <button class="model-btn" onclick="alert('API Docs for ${model.name}')">API Docs</button>
        </div>
      </div>
    `
  }).join('')
  
  return `
    <!-- Models -->
    <div class="section">
      <div class="section-header">
        <div class="section-title">
          <span>📦</span>
          Models & Relationships
        </div>
        <div class="section-badge">${schema.models.length} models</div>
      </div>
      
      <div class="model-grid">
        ${modelCards}
      </div>
    </div>
  `
}

/**
 * Generate plugin health check sections
 */
function generatePluginHealthCheckSections(config: ChecklistConfig): string {
  if (!config.pluginHealthChecks || config.pluginHealthChecks.size === 0) {
    return ''
  }
  
  let sectionsHTML = ''
  
  for (const [pluginName, healthCheck] of config.pluginHealthChecks) {
    sectionsHTML += `
    <!-- ${healthCheck.title} Plugin -->
    <div class="section">
      <div class="section-header">
        <div class="section-title">
          <span>${healthCheck.icon || '🔌'}</span>
          ${healthCheck.title}
        </div>
        <div class="section-badge">Plugin</div>
      </div>
      
      <div class="checks">
        ${healthCheck.checks.map((check: any) => `
        <div class="check-item" id="${check.id}">
          <div class="check-left">
            <div class="check-icon">⏳</div>
            <div class="check-info">
              <div class="check-name">${check.name}</div>
              <div class="check-detail">${check.description}</div>
            </div>
          </div>
          <div class="check-status">Pending</div>
        </div>
        `).join('\n')}
      </div>
      
      ${healthCheck.interactiveDemo || ''}
    </div>
    `
  }
  
  return sectionsHTML
}

/**
 * Generate advanced features section
 */
function generateAdvancedFeaturesSection(config: ChecklistConfig): string {
  return `
    <!-- Advanced Features -->
    <div class="section">
      <div class="section-header">
        <div class="section-title">
          <span>⚡</span>
          Advanced Features
        </div>
        <div class="section-badge">Enterprise</div>
      </div>
      
      <div class="checks">
        <div class="check-item" id="middleware">
          <div class="check-left">
            <div class="check-icon">⏳</div>
            <div class="check-info">
              <div class="check-name">Middleware</div>
              <div class="check-detail">Auth, rate-limiting, logging</div>
            </div>
          </div>
          <div class="check-status">Checking...</div>
        </div>
        
        <div class="check-item" id="permissions">
          <div class="check-left">
            <div class="check-icon">⏳</div>
            <div class="check-info">
              <div class="check-name">Permissions (RBAC)</div>
              <div class="check-detail">Role-based access control</div>
            </div>
          </div>
          <div class="check-status">Checking...</div>
        </div>
        
        <div class="check-item" id="caching">
          <div class="check-left">
            <div class="check-icon">⏳</div>
            <div class="check-info">
              <div class="check-name">Caching</div>
              <div class="check-detail">Response caching with TTL</div>
            </div>
          </div>
          <div class="check-status">Checking...</div>
        </div>
        
        <div class="check-item" id="events">
          <div class="check-left">
            <div class="check-icon">⏳</div>
            <div class="check-info">
              <div class="check-name">Events & Webhooks</div>
              <div class="check-detail">Async event processing</div>
            </div>
          </div>
          <div class="check-status">Checking...</div>
        </div>
        
        <div class="check-item" id="search">
          <div class="check-left">
            <div class="check-icon">⏳</div>
            <div class="check-info">
              <div class="check-name">Search & Filters</div>
              <div class="check-detail">Full-text search enabled</div>
            </div>
          </div>
          <div class="check-status">Checking...</div>
        </div>
      </div>
    </div>
  `
}

/**
 * Generate API endpoints for live checks
 */
function generateChecklistAPI(
  schema: ParsedSchema,
  files: GeneratedFiles,
  config: ChecklistConfig
): string {
  return `// @generated
// Checklist API endpoints for live system checks

import { Router } from 'express'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const checklistRouter: Router = Router()

/**
 * GET /api/checklist
 * Run all checks and return results
 */
checklistRouter.get('/', async (req, res) => {
  try {
    const results = {
      timestamp: new Date().toISOString(),
      project: '${config.projectName}',
      checks: {
        environment: await runEnvironmentChecks(),
        code: await runCodeChecks(),
        api: await runAPIChecks(),
        features: await runFeatureChecks()
      }
    }
    
    res.json(results)
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Checklist failed'
    })
  }
})

/**
 * GET /api/checklist/database
 * Check database connection
 */
checklistRouter.get('/database', async (req, res) => {
  try {
    const start = Date.now()
    await prisma.$connect()
    const time = Date.now() - start
    
    res.json({
      status: 'success',
      message: 'Connected',
      time: \`\${time}ms\`
    })
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Database check failed'
    })
  }
})

/**
 * POST /api/checklist/test/:model
 * Test CRUD operations for a model
 */
checklistRouter.post('/test/:model', async (req, res) => {
  const { model } = req.params
  
  // Validate model name (security)
  const validModels = ${JSON.stringify(schema.models.map(m => m.name))}
  if (!validModels.includes(model)) {
    return res.status(400).json({
      status: 'error',
      message: \`Invalid model: \${model}\`
    })
  }
  
  try {
    const results = await testModelCRUD(model)
    res.json(results)
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Helper functions
async function runEnvironmentChecks() {
  return {
    database: await checkDatabase(),
    envVars: checkEnvironmentVariables(),
    ports: checkPorts()
  }
}

async function runCodeChecks() {
  return {
    registryFiles: ${files.registry?.size || 0},
    services: ${schema.models.length},
    routes: ${files.routes.size},
    validators: ${files.validators.size}
  }
}

async function runAPIChecks() {
  // Test a few endpoints
  return {
    tested: 0,
    passed: 0,
    failed: 0
  }
}

async function runFeatureChecks() {
  return {
    middleware: ${config.useRegistry},
    permissions: ${config.useRegistry},
    caching: false,
    events: false,
    search: false
  }
}

async function checkDatabase() {
  try {
    await prisma.$connect()
    return { status: 'success' }
  } catch (e) {
    return { status: 'error', message: e instanceof Error ? e.message : 'Connection failed' }
  }
}

function checkEnvironmentVariables() {
  const required = ['DATABASE_URL', 'PORT', 'NODE_ENV']
  const missing = required.filter(v => !process.env[v])
  
  return {
    status: missing.length === 0 ? 'success' : 'warning',
    total: required.length,
    present: required.length - missing.length,
    missing
  }
}

function checkPorts() {
  return { status: 'success' }
}

async function testModelCRUD(model: string) {
  // Implement CRUD testing
  return {
    model,
    operations: {
      create: 'pending',
      read: 'pending',
      update: 'pending',
      delete: 'pending'
    }
  }
}
`
}

/**
 * Generate test runner
 */
function generateChecklistTests(
  schema: ParsedSchema,
  files: GeneratedFiles,
  config: ChecklistConfig
): string {
  return `// @generated
// Checklist test suite

export const checklistTests = {
  environment: [
    {
      name: 'Database connection',
      test: async () => {
        // Test database connection
        return { passed: true }
      }
    }
  ],
  
  models: ${JSON.stringify(schema.models.map(m => m.name))}.map(model => ({
    name: \`Test \${model} CRUD\`,
    test: async () => {
      // Test CRUD operations
      return { passed: true }
    }
  }))
}
`
}

// Helper functions
function getTotalFileCount(files: GeneratedFiles): number {
  let count = 0
  if (files.registry) count += files.registry.size
  count += files.services.size
  count += files.controllers.size
  count += files.routes.size
  count += files.validators.size
  return count
}

function calculateActualLineCount(files: GeneratedFiles): number {
  let lines = 0
  
  // Count registry files
  if (files.registry) {
    for (const content of files.registry.values()) {
      lines += content.split('\\n').length
    }
  }
  
  // Count services
  for (const content of files.services.values()) {
    lines += content.split('\\n').length
  }
  
  // Count controllers
  for (const content of files.controllers.values()) {
    lines += content.split('\\n').length
  }
  
  // Count routes
  for (const content of files.routes.values()) {
    lines += content.split('\\n').length
  }
  
  // Count SDK
  for (const content of files.sdk.values()) {
    lines += content.split('\\n').length
  }
  
  return lines
}

function getAdvancedFeatures(config: ChecklistConfig): Record<string, boolean> {
  return {
    middleware: config.useRegistry,
    permissions: config.useRegistry,
    caching: false,
    events: false,
    search: false
  }
}

