import type { ServerFile } from '../../../src/types'
import { storeFile } from '../../../src/runtime/server/utils/fileStorage'

export default defineEventHandler(async (event) => {
	const { files } = await readBody<{ files: ServerFile[] }>(event)
	const fileNames: string[] = []
	for (const file of files) {
		fileNames.push(await storeFile(file, 12, 'playground', 'public'))
	}
	return fileNames
})
