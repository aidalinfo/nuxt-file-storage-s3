import { useRuntimeConfig } from '#imports'
import type { ServerFile } from '../../../types'
import {
	prepareFileForStorageWithOptions,
	resolveServerCompressionOptions,
} from './fileCompressionPipeline'

export const prepareFileForStorage = async (file: ServerFile): Promise<ServerFile> => {
	const runtimeCompression = (useRuntimeConfig() as any).fileStorage?.compression?.server
	const compression = resolveServerCompressionOptions(runtimeCompression)
	return prepareFileForStorageWithOptions(file, compression)
}
