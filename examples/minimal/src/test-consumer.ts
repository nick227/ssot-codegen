// Test consumer file to verify @gen imports work
import type { UserCreateDTO } from '@gen/contracts/user'
import { createUser } from '@gen/controllers/user'
import { userRoutes } from '@gen/routes/user'

const testDto: UserCreateDTO = { /* fields */ }
const result = createUser(testDto)

console.log('Import test successful:', { userRoutes, result })

