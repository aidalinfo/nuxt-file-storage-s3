import { describe, expect, it } from 'vitest'
import { resolveModuleCompressionOptions } from '../../src/utils/compressionOptions'

describe('resolveModuleCompressionOptions', () => {
	it('returns full default client and server compression options', () => {
		const resolved = resolveModuleCompressionOptions()

		expect(resolved).toEqual({
			client: {
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
			},
			server: {
				enabled: false,
				pdf: {
					enabled: true,
				},
			},
		})
	})

	it('supports legacy flat client compression configuration', () => {
		const resolved = resolveModuleCompressionOptions({
			enabled: true,
			image: {
				quality: 0.6,
			},
			pdf: {
				enabled: false,
			},
		})

		expect(resolved.client.enabled).toBe(true)
		expect(resolved.client.image.quality).toBe(0.6)
		expect(resolved.client.image.maxWidth).toBe(1920)
		expect(resolved.client.pdf.enabled).toBe(false)
		expect(resolved.server.enabled).toBe(false)
	})

	it('prefers nested client/server configuration over legacy fields', () => {
		const resolved = resolveModuleCompressionOptions({
			enabled: false,
			client: {
				enabled: true,
			},
			server: {
				enabled: true,
				pdf: {
					enabled: false,
				},
			},
		})

		expect(resolved.client.enabled).toBe(true)
		expect(resolved.server.enabled).toBe(true)
		expect(resolved.server.pdf.enabled).toBe(false)
	})
})
