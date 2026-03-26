import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ServerFile } from '../../src/types'

const {
	useRuntimeConfigMock,
	prepareFileForStorageMock,
	storeFileLocallyMock,
	storeFileToS3Mock,
} = vi.hoisted(() => {
	return {
		useRuntimeConfigMock: vi.fn(),
		prepareFileForStorageMock: vi.fn(),
		storeFileLocallyMock: vi.fn(),
		storeFileToS3Mock: vi.fn(),
	}
})

vi.mock('#imports', () => ({
	useRuntimeConfig: useRuntimeConfigMock,
}))

vi.mock('../../src/runtime/server/utils/fileCompression', () => ({
	prepareFileForStorage: prepareFileForStorageMock,
}))

vi.mock('../../src/runtime/server/utils/storage', () => ({
	storeFileLocally: storeFileLocallyMock,
	getFileLocally: vi.fn(),
	getFilesLocally: vi.fn(),
	deleteFile: vi.fn(),
}))

vi.mock('../../src/runtime/server/utils/s3Storage', () => ({
	storeFileToS3: storeFileToS3Mock,
	getFileFromS3: vi.fn(),
	listFilesFromS3: vi.fn(),
	deleteFileFromS3: vi.fn(),
}))

import { storeFile } from '../../src/runtime/server/utils/fileStorage'

const createServerFile = (): ServerFile => ({
	name: 'test.pdf',
	content: 'data:application/pdf;base64,SGVsbG8=',
	size: '5',
	type: 'application/pdf',
	lastModified: String(Date.now()),
})

describe('storeFile', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('prepares file then stores locally when S3 is not configured', async () => {
		const file = createServerFile()
		const prepared = { ...file, size: '3' }

		useRuntimeConfigMock.mockReturnValue({
			public: {
				fileStorage: {
					s3: undefined,
				},
			},
		})
		prepareFileForStorageMock.mockResolvedValue(prepared)
		storeFileLocallyMock.mockResolvedValue('local-file.pdf')

		const result = await storeFile(file, 12, 'uploads')

		expect(prepareFileForStorageMock).toHaveBeenCalledWith(file)
		expect(storeFileLocallyMock).toHaveBeenCalledWith(prepared, 12, 'uploads')
		expect(storeFileToS3Mock).not.toHaveBeenCalled()
		expect(result).toBe('local-file.pdf')
	})

	it('prepares file then stores to S3 when S3 is configured', async () => {
		const file = createServerFile()
		const prepared = { ...file, size: '4' }

		useRuntimeConfigMock.mockReturnValue({
			public: {
				fileStorage: {
					s3: { accessKeyId: 'a', secretAccessKey: 'b', region: 'c' },
				},
			},
		})
		prepareFileForStorageMock.mockResolvedValue(prepared)
		storeFileToS3Mock.mockResolvedValue('uploads/s3-file.pdf')

		const result = await storeFile(file, 'avatar', 'uploads', 'public')

		expect(prepareFileForStorageMock).toHaveBeenCalledWith(file)
		expect(storeFileToS3Mock).toHaveBeenCalledWith(
			prepared,
			'avatar',
			'uploads',
			'public',
		)
		expect(storeFileLocallyMock).not.toHaveBeenCalled()
		expect(result).toBe('uploads/s3-file.pdf')
	})
})
