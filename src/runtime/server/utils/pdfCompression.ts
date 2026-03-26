import { PDFDocument } from 'pdf-lib'
import type { ServerFile } from '../../../types'
import { parseDataUrl, toDataUrl } from './dataUrl'

const PDF_MIME_TYPE = 'application/pdf'

const isPdfServerFile = (file: ServerFile): boolean => {
	return file.type === PDF_MIME_TYPE || file.content.startsWith(`data:${PDF_MIME_TYPE};`)
}

const rewritePdf = async (originalBinary: Buffer): Promise<Buffer> => {
	const originalDocument = await PDFDocument.load(originalBinary, {
		updateMetadata: false,
	})
	const originalPageCount = originalDocument.getPageCount()

	const optimizedBinary = Buffer.from(
		await originalDocument.save({
			useObjectStreams: true,
			addDefaultPage: false,
			updateFieldAppearances: false,
		}),
	)

	const optimizedDocument = await PDFDocument.load(optimizedBinary, {
		updateMetadata: false,
	})
	if (optimizedDocument.getPageCount() !== originalPageCount) {
		throw new Error('Optimized PDF validation failed: page count mismatch')
	}

	return optimizedBinary
}

export const compressPdfServerFile = async (file: ServerFile): Promise<ServerFile> => {
	if (!isPdfServerFile(file)) {
		return file
	}

	try {
		const { binaryString, ext } = parseDataUrl(file.content)
		if (ext !== 'pdf') {
			return file
		}

		const optimizedBinary = await rewritePdf(binaryString)
		if (optimizedBinary.byteLength >= binaryString.byteLength) {
			return file
		}

		return {
			...file,
			size: String(optimizedBinary.byteLength),
			content: toDataUrl(optimizedBinary, PDF_MIME_TYPE),
			type: PDF_MIME_TYPE,
		}
	}
	catch {
		return file
	}
}
