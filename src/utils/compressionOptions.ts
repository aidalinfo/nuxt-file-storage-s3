import defu from 'defu'
import type {
	DeepPartial,
	FileCompressionOptions,
	ModuleCompressionOptions,
	ServerFileCompressionOptions,
} from '../types'

export const DEFAULT_COMPRESSION_OPTIONS: FileCompressionOptions = {
	enabled: false,
	image: {
		enabled: true,
		quality: 0.8,
		maxWidth: 1920,
		maxHeight: 1920,
	},
	pdf: {
		enabled: true,
	},
}

export const DEFAULT_SERVER_COMPRESSION_OPTIONS: ServerFileCompressionOptions = {
	enabled: false,
	pdf: {
		enabled: true,
	},
}

type ResolvedModuleCompressionOptions = {
	client: FileCompressionOptions
	server: ServerFileCompressionOptions
}

const toLegacyClientCompression = (
	compression?: ModuleCompressionOptions,
): DeepPartial<FileCompressionOptions> => {
	if (!compression) {
		return {}
	}

	return {
		enabled: compression.enabled,
		image: compression.image,
		pdf: compression.pdf,
	}
}

export const resolveModuleCompressionOptions = (
	compression?: ModuleCompressionOptions,
): ResolvedModuleCompressionOptions => {
	const legacyClientCompression = toLegacyClientCompression(compression)

	return {
		client: defu(
			compression?.client,
			legacyClientCompression,
			DEFAULT_COMPRESSION_OPTIONS,
		) as FileCompressionOptions,
		server: defu(
			compression?.server,
			DEFAULT_SERVER_COMPRESSION_OPTIONS,
		) as ServerFileCompressionOptions,
	}
}
