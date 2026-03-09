import { useRuntimeConfig } from '#imports'
import type { ServerFile } from '../../../types'
import { storeFileLocally, getFileLocally, getFilesLocally, deleteFile as deleteFileLocally } from './storage'
import { storeFileToS3, getFileFromS3, listFilesFromS3, deleteFileFromS3 } from './s3Storage'

const isS3Configured = () => {
	return !!useRuntimeConfig().public.fileStorage.s3
}

/**
 * @description Store a file using either S3 or local storage depending on configuration.
 * @param file the file object
 * @param fileNameOrIdLength a string for a fixed name, or a number to generate a random ID of that length
 * @param filelocation folder path (e.g. `'avatars'`)
 * @returns file key (S3) or filename (local)
 */
export const storeFile = async (
	file: ServerFile,
	fileNameOrIdLength: string | number,
	filelocation: string = '',
): Promise<string> => {
	if (isS3Configured()) {
		return storeFileToS3(file, fileNameOrIdLength, filelocation)
	}
	return storeFileLocally(file, fileNameOrIdLength, filelocation)
}

/**
 * @description Get a file reference using either S3 (signed URL) or local path depending on configuration.
 * @param fileKey the file key (return value of storeFile)
 * @param expiresIn S3 only — signed URL expiration in seconds (default: 3600)
 * @returns signed URL (S3) or local file path
 */
export const getFile = async (fileKey: string, expiresIn: number = 3600): Promise<string> => {
	if (isS3Configured()) {
		return getFileFromS3(fileKey, expiresIn)
	}
	return getFileLocally(fileKey)
}

/**
 * @description List files in a folder using either S3 or local storage depending on configuration.
 * @param filelocation folder path
 * @returns array of file keys or filenames
 */
export const listFiles = async (filelocation: string = ''): Promise<string[]> => {
	if (isS3Configured()) {
		return listFilesFromS3(filelocation)
	}
	return getFilesLocally(filelocation)
}

/**
 * @description Delete a file using either S3 or local storage depending on configuration.
 * @param fileKey the file key or filename (return value of storeFile)
 */
export const removeFile = async (fileKey: string): Promise<void> => {
	if (isS3Configured()) {
		return deleteFileFromS3(fileKey)
	}
	// For local storage, split the key into folder and filename
	const lastSlash = fileKey.lastIndexOf('/')
	if (lastSlash === -1) {
		return deleteFileLocally(fileKey)
	}
	return deleteFileLocally(fileKey.slice(lastSlash + 1), fileKey.slice(0, lastSlash))
}
