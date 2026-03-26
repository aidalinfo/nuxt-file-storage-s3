import type {
	DeepPartial,
	ServerFile,
	ServerFileCompressionOptions,
} from '../../../types'
import { compressPdfServerFile } from './pdfCompression'

const DEFAULT_SERVER_COMPRESSION_OPTIONS: ServerFileCompressionOptions = {
	enabled: false,
	pdf: {
		enabled: true,
	},
}

export const resolveServerCompressionOptions = (
	runtimeCompression?: DeepPartial<ServerFileCompressionOptions>,
): ServerFileCompressionOptions => {
	return {
		enabled:
			typeof runtimeCompression?.enabled === 'boolean'
				? runtimeCompression.enabled
				: DEFAULT_SERVER_COMPRESSION_OPTIONS.enabled,
		pdf: {
			enabled:
				typeof runtimeCompression?.pdf?.enabled === 'boolean'
					? runtimeCompression.pdf.enabled
					: DEFAULT_SERVER_COMPRESSION_OPTIONS.pdf.enabled,
		},
	}
}

export const prepareFileForStorageWithOptions = async (
	file: ServerFile,
	compression: ServerFileCompressionOptions,
): Promise<ServerFile> => {
	if (!compression.enabled) {
		return file
	}

	if (compression.pdf.enabled) {
		return compressPdfServerFile(file)
	}

	return file
}
