/**
 * Checklist Template Renderer
 * 
 * Loads static HTML/CSS/JS templates and injects dynamic data
 * Replaces the 1,300+ lines of inline HTML in checklist-generator.ts
 */

import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

// Get template directory
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const TEMPLATE_DIR = __dirname

/**
 * Template data interface
 */
export interface ChecklistTemplateData {
  projectName: string
  framework: string
  timestamp: string
  modelCount: number
  routeCount: number
  sections: string  // Pre-rendered HTML for checklist sections
}

/**
 * Load template files from disk
 */
function loadTemplates(): {
  html: string
  css: string
  js: string
} {
  return {
    html: readFileSync(join(TEMPLATE_DIR, 'template.html'), 'utf-8'),
    css: readFileSync(join(TEMPLATE_DIR, 'styles.css'), 'utf-8'),
    js: readFileSync(join(TEMPLATE_DIR, 'script.js'), 'utf-8')
  }
}

/**
 * Simple template renderer (replaces {{key}} with data[key])
 */
function renderTemplate(template: string, data: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] !== undefined ? String(data[key]) : match
  })
}

/**
 * Render checklist HTML with data
 */
export function renderChecklistHTML(data: ChecklistTemplateData): string {
  const templates = loadTemplates()
  
  // Prepare template data
  const templateData = {
    projectName: data.projectName,
    framework: data.framework,
    timestamp: data.timestamp,
    modelCount: data.modelCount,
    routeCount: data.routeCount,
    sections: data.sections,
    styles: templates.css,
    script: templates.js
  }
  
  // Render HTML with all data
  return renderTemplate(templates.html, templateData as any)
}

/**
 * Generate a checklist section
 */
export function renderSection(options: {
  title: string
  emoji: string
  items: Array<{
    title: string
    description?: string
    command?: string
  }>
  collapsible?: boolean
}): string {
  const { title, emoji, items, collapsible = true } = options
  
  const itemsHTML = items.map((item, index) => `
    <li class="checklist-item" data-index="${index}">
      <div class="checkbox"></div>
      <div class="item-content">
        <div class="item-title">${item.title}</div>
        ${item.description ? `<div class="item-description">${item.description}</div>` : ''}
        ${item.command ? `<div class="item-command">${escapeHTML(item.command)}</div>` : ''}
      </div>
    </li>
  `).join('')
  
  return `
    <div class="section">
      <div class="section-header">
        <div class="section-title">
          <span class="emoji">${emoji}</span>
          ${title}
          ${collapsible ? '<span class="collapse-icon">▼</span>' : ''}
        </div>
        <span class="section-badge badge-info">Pending</span>
      </div>
      <div class="section-content${collapsible ? '' : ' no-collapse'}">
        <ul class="checklist">
          ${itemsHTML}
        </ul>
      </div>
    </div>
  `
}

/**
 * Escape HTML special characters
 */
function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

