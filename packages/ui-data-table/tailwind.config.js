/**
 * Tailwind configuration for @ssot-ui/data-table
 * Uses tokens from @ssot-ui/tokens
 */

const tokenConfig = require('@ssot-ui/tokens/tailwind')

module.exports = {
  ...tokenConfig,
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './stories/**/*.{js,ts,jsx,tsx}'
  ]
}

