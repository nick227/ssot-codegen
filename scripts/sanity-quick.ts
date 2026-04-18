import { Command } from 'commander'
import { registerUiCommand } from '../packages/cli/src/commands/generate-ui.ts'
import { generateUI } from '../packages/gen/src/generators/ui/ui-generator.ts'
import { generatePrismaSchema } from '../packages/create-ssot-app/src/templates/prisma-schema.ts'
import type { ProjectConfig } from '../packages/create-ssot-app/src/prompts.ts'

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message)
  }
}

function run(): void {
  const program = new Command()
  registerUiCommand(program)
  assert(
    program.commands.some((cmd) => cmd.name() === 'ui'),
    'Expected "ui" command to be registered'
  )

  const schema = {
    models: [
      {
        name: 'User',
        fields: [{ name: 'id', kind: 'scalar' }]
      }
    ],
    enums: []
  }

  const uiResult = generateUI(schema, {
    outputDir: 'src',
    generateComponents: false,
    generatePages: true
  })
  assert(uiResult.files.size > 0, 'Expected generateUI to create files')

  const config: ProjectConfig = {
    projectName: 'sanity-app',
    framework: 'express',
    database: 'postgresql',
    includeExamples: false,
    selectedPlugins: [],
    packageManager: 'pnpm',
    generateUI: false
  }
  const prismaSchema = generatePrismaSchema(config)
  assert(prismaSchema.includes('datasource db'), 'Expected Prisma schema output')

  console.log('sanity: ok')
}

run()
