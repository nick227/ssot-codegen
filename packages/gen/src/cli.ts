#!/usr/bin/env node
import { generateFromSchema } from './index-new.js'
import type { LogLevel } from './utils/cli-logger.js'

interface CLIArgs {
  schema: string
  output: string
  framework: 'express' | 'fastify'
  verbosity: LogLevel
  colors: boolean
  timestamps: boolean
  help: boolean
}

/**
 * Parse CLI arguments
 */
function parseArgs(): CLIArgs {
  const args = process.argv.slice(2)
  
  const config: CLIArgs = {
    schema: './prisma/schema.prisma',
    output: './gen',
    framework: 'express',
    verbosity: 'normal',
    colors: true,
    timestamps: false,
    help: false
  }
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    
    switch (arg) {
      // Verbosity
      case '--silent':
        config.verbosity = 'silent'
        break
      case '--minimal':
        config.verbosity = 'minimal'
        break
      case '--verbose':
      case '-v':
        config.verbosity = 'verbose'
        break
      case '--debug':
        config.verbosity = 'debug'
        break
      
      // Display options
      case '--no-color':
      case '--no-colors':
        config.colors = false
        break
      case '--timestamps':
        config.timestamps = true
        break
      
      // Paths
      case '--schema':
      case '-s':
        config.schema = args[++i]
        break
      case '--output':
      case '-o':
        config.output = args[++i]
        break
      
      // Framework
      case '--framework':
      case '-f':
        const fw = args[++i]
        if (fw !== 'express' && fw !== 'fastify') {
          console.error(`Invalid framework: ${fw}. Use 'express' or 'fastify'`)
          process.exit(1)
        }
        config.framework = fw
        break
      
      // Help
      case '--help':
      case '-h':
        config.help = true
        break
      
      default:
        console.error(`Unknown option: ${arg}`)
        console.error(`Use --help for usage information`)
        process.exit(1)
    }
  }
  
  return config
}

/**
 * Print help message
 */
function printHelp(): void {
  console.log(`
╭─────────────────────────────────────────────╮
│   🚀 SSOT Code Generator CLI                │
╰─────────────────────────────────────────────╯

Usage: ssot-codegen [options]

Options:
  -s, --schema <path>        Path to Prisma schema file (default: ./prisma/schema.prisma)
  -o, --output <path>        Output directory (default: ./gen)
  -f, --framework <name>     Framework: express or fastify (default: express)

Verbosity:
  --silent                   No output except errors
  --minimal                  Minimal output (CI-friendly)
  (default)                  Normal output with progress
  -v, --verbose              Detailed output with per-model timing
  --debug                    Debug output with internal details

Display:
  --no-color                 Disable colored output
  --timestamps               Show timestamps in output

Help:
  -h, --help                 Show this help message

Examples:
  ssot-codegen                                      # Generate with defaults
  ssot-codegen --verbose                            # Verbose output
  ssot-codegen --schema ./db/schema.prisma          # Custom schema path
  ssot-codegen -o ./api -f fastify                  # Custom output + Fastify
  ssot-codegen --silent --no-color                  # CI mode
  ssot-codegen --debug --timestamps                 # Full debug mode

Environment Variables:
  CI=true                    Auto-enables minimal mode and disables colors

Version: 0.5.0
`)
}

/**
 * Main CLI entry point
 */
async function main() {
  const config = parseArgs()
  
  if (config.help) {
    printHelp()
    process.exit(0)
  }
  
  try {
    await generateFromSchema({
      schemaPath: config.schema,
      output: config.output,
      framework: config.framework,
      verbosity: config.verbosity,
      colors: config.colors,
      timestamps: config.timestamps
    })
    
    process.exit(0)
  } catch (error) {
    if (config.verbosity !== 'silent') {
      console.error(`\n❌ Generation failed:`, (error as Error).message)
      
      if (config.verbosity === 'debug') {
        console.error((error as Error).stack)
      }
    }
    
    process.exit(1)
  }
}

main()
