import defu from 'defu'
import type {
	DeepPartial,
	FileCompressionOptions,
	HandleFileInputOptions,
	UseFileStorageOptions,
} from '../../../types'
import { DEFAULT_COMPRESSION_OPTIONS } from '../../../utils/compressionOptions'

export type ResolvedHandleFileInputOptions = {
	clearOldFiles: boolean
	compression: FileCompressionOptions
}

const DEFAULT_CLEAR_OLD_FILES = true

export const resolveCompressionOptions = (
	override?: DeepPartial<FileCompressionOptions>,
	useFileStorageOptions?: DeepPartial<FileCompressionOptions>,
	globalCompression?: DeepPartial<FileCompressionOptions>,
): FileCompressionOptions => {
	return defu(
		override,
		useFileStorageOptions,
		globalCompression,
		DEFAULT_COMPRESSION_OPTIONS,
	) as FileCompressionOptions
}

export const resolveHandleFileInputOptions = (
	inputOptions: HandleFileInputOptions | undefined,
	useOptions: UseFileStorageOptions | undefined,
	globalCompression: DeepPartial<FileCompressionOptions> | undefined,
): ResolvedHandleFileInputOptions => {
	const clearOldFiles =
		inputOptions?.clearOldFiles
		?? useOptions?.clearOldFiles
		?? DEFAULT_CLEAR_OLD_FILES

	const compression = resolveCompressionOptions(
		inputOptions?.compression,
		useOptions?.compression,
		globalCompression,
	)

	return {
		clearOldFiles,
		compression,
	}
}
