import { describe, expect, it, vi } from 'vitest'
import type { ServerFile } from '../../src/types'
import * as pdfCompression from '../../src/runtime/server/utils/pdfCompression'
import {
	prepareFileForStorageWithOptions,
	resolveServerCompressionOptions,
} from '../../src/runtime/server/utils/fileCompressionPipeline'

const createServerFile = (): ServerFile => ({
	name: 'sample.pdf',
	content: 'data:application/pdf;base64,SGVsbG8=',
	size: '5',
	type: 'application/pdf',
	lastModified: String(Date.now()),
})

describe('resolveServerCompressionOptions', () => {
	it('returns default options when runtime config is missing', () => {
		expect(resolveServerCompressionOptions()).toEqual({
			enabled: false,
			pdf: {
				enabled: true,
			},
		})
	})

	it('applies runtime overrides with defaults', () => {
		expect(resolveServerCompressionOptions({ enabled: true })).toEqual({
			enabled: true,
			pdf: {
				enabled: true,
			},
		})

		expect(resolveServerCompressionOptions({ pdf: { enabled: false } })).toEqual({
			enabled: false,
			pdf: {
				enabled: false,
			},
		})
	})
})

describe('prepareFileForStorageWithOptions', () => {
	it('returns original file when server compression is disabled', async () => {
		const file = createServerFile()
		const spy = vi.spyOn(pdfCompression, 'compressPdfServerFile')

		const result = await prepareFileForStorageWithOptions(file, {
			enabled: false,
			pdf: { enabled: true },
		})

		expect(result).toBe(file)
		expect(spy).not.toHaveBeenCalled()
	})

	it('returns original file when PDF compression is disabled', async () => {
		const file = createServerFile()
		const spy = vi.spyOn(pdfCompression, 'compressPdfServerFile')

		const result = await prepareFileForStorageWithOptions(file, {
			enabled: true,
			pdf: { enabled: false },
		})

		expect(result).toBe(file)
		expect(spy).not.toHaveBeenCalled()
	})

	it('delegates to PDF strategy when compression is enabled', async () => {
		const file = createServerFile()
		const compressed = { ...file, size: '3' }
		const spy = vi
			.spyOn(pdfCompression, 'compressPdfServerFile')
			.mockResolvedValueOnce(compressed)

		const result = await prepareFileForStorageWithOptions(file, {
			enabled: true,
			pdf: { enabled: true },
		})

		expect(spy).toHaveBeenCalledWith(file)
		expect(result).toBe(compressed)
	})
})
