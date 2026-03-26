import { afterEach, describe, expect, it, vi } from 'vitest'
import { PDFDocument } from 'pdf-lib'
import type { ServerFile } from '../../src/types'
import { compressPdfServerFile } from '../../src/runtime/server/utils/pdfCompression'

const toPdfDataUrl = (binary: Buffer): string => {
	return `data:application/pdf;base64,${binary.toString('base64')}`
}

const createServerFile = (content: string, type = 'application/pdf', size = 12): ServerFile => ({
	name: 'test.pdf',
	content,
	size: String(size),
	type,
	lastModified: String(Date.now()),
})

describe('compressPdfServerFile', () => {
	afterEach(() => {
		vi.restoreAllMocks()
	})

	it('returns original file for non-PDF files', async () => {
		const file = createServerFile('data:text/plain;base64,SGVsbG8=', 'text/plain', 5)

		const result = await compressPdfServerFile(file)

		expect(result).toBe(file)
	})

	it('falls back to original file when compression throws', async () => {
		const loadSpy = vi.spyOn(PDFDocument, 'load').mockRejectedValue(new Error('broken-pdf'))
		const file = createServerFile(toPdfDataUrl(Buffer.from('not-a-real-pdf')))

		const result = await compressPdfServerFile(file)

		expect(loadSpy).toHaveBeenCalledOnce()
		expect(result).toBe(file)
	})

	it('falls back to original file when optimized PDF validation fails', async () => {
		vi.spyOn(PDFDocument, 'load')
			.mockResolvedValueOnce({
				getPageCount: () => 1,
				save: async () => Uint8Array.from([1, 2, 3]),
			} as any)
			.mockResolvedValueOnce({
				getPageCount: () => 2,
			} as any)

		const file = createServerFile(toPdfDataUrl(Buffer.from('aaaaaaaaaa')))
		const result = await compressPdfServerFile(file)

		expect(result).toBe(file)
	})

	it('falls back to original file when optimized size is not smaller', async () => {
		vi.spyOn(PDFDocument, 'load')
			.mockResolvedValueOnce({
				getPageCount: () => 1,
				save: async () => Uint8Array.from([1, 2, 3, 4, 5, 6, 7, 8]),
			} as any)
			.mockResolvedValueOnce({
				getPageCount: () => 1,
			} as any)

		const original = Buffer.from([9, 8, 7, 6, 5, 4, 3, 2])
		const file = createServerFile(toPdfDataUrl(original), 'application/pdf', original.length)

		const result = await compressPdfServerFile(file)

		expect(result).toBe(file)
	})

	it('returns optimized server file when compression produces a smaller valid PDF', async () => {
		vi.spyOn(PDFDocument, 'load')
			.mockResolvedValueOnce({
				getPageCount: () => 1,
				save: async () => Uint8Array.from([1, 2, 3, 4]),
			} as any)
			.mockResolvedValueOnce({
				getPageCount: () => 1,
			} as any)

		const original = Buffer.from([9, 8, 7, 6, 5, 4, 3, 2, 1])
		const file = createServerFile(toPdfDataUrl(original), 'application/pdf', original.length)

		const result = await compressPdfServerFile(file)

		expect(result).not.toBe(file)
		expect(result.type).toBe('application/pdf')
		expect(result.size).toBe('4')
		expect(result.content).toBe(toPdfDataUrl(Buffer.from([1, 2, 3, 4])))
	})
})
