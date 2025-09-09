import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { useRuntimeConfig } from '#imports'
import type { ServerFile, S3Options } from '../../../types'
import { parseDataUrl } from './storage'

let s3Client: S3Client | null = null

/**
 * Initialize S3 client with configuration
 */
const getS3Client = (): S3Client => {
	if (!s3Client) {
		const config = useRuntimeConfig().public.fileStorage.s3 as S3Options
		
		if (!config) {
			throw new Error('S3 configuration not found. Please configure S3 options in your nuxt.config.ts')
		}

		s3Client = new S3Client({
			credentials: {
				accessKeyId: config.accessKeyId,
				secretAccessKey: config.secretAccessKey,
			},
			region: config.region,
			endpoint: config.endpoint,
			forcePathStyle: config.forcePathStyle || false,
		})
	}
	return s3Client
}

/**
 * @description Will store the file in S3 bucket
 * @param file provide the file object
 * @param fileNameOrIdLength you can pass a string or a number, if you enter a string it will be the file name, if you enter a number it will generate a unique ID
 * @param filelocation provide the folder you wish to locate the file in S3 (acts as key prefix)
 * @returns file key: `${filelocation}/${filename}.${fileExtension}`
 *
 * @example
 * ```ts
 * import { ServerFile } from "nuxt-file-storage";
 *
 * const { file } = await readBody<{ files: ServerFile }>(event)
 * 
 * await storeFileToS3( file, 8, 'userFiles' )
 * ```
 */
export const storeFileToS3 = async (
	file: ServerFile,
	fileNameOrIdLength: string | number,
	filelocation: string = '',
): Promise<string> => {
	const client = getS3Client()
	const config = useRuntimeConfig().public.fileStorage.s3 as S3Options
	const { binaryString, ext } = parseDataUrl(file.content)

	const originalExt = file.name.toString().split('.').pop() || ext
	const filename = 
		typeof fileNameOrIdLength == 'number'
			? `${generateRandomId(fileNameOrIdLength)}.${originalExt}`
			: `${fileNameOrIdLength}.${originalExt}`

	const key = filelocation 
		? `${filelocation.replace(/^\//, '').replace(/\/$/, '')}/${filename}`
		: filename

	const command = new PutObjectCommand({
		Bucket: config.bucket,
		Key: key,
		Body: binaryString,
		ContentType: file.type,
	})

	await client.send(command)
	return key
}

/**
 * @description Get a signed URL for file in S3 bucket
 * @param fileKey the S3 object key (return value of storeFileToS3)
 * @param expiresIn expiration time in seconds (default: 3600 = 1 hour)
 * @returns signed URL for the file
 */
export const getFileFromS3 = async (fileKey: string, expiresIn: number = 3600): Promise<string> => {
	const client = getS3Client()
	const config = useRuntimeConfig().public.fileStorage.s3 as S3Options

	const command = new GetObjectCommand({
		Bucket: config.bucket,
		Key: fileKey,
	})

	return await getSignedUrl(client, command, { expiresIn })
}

/**
 * @description Get file stream from S3 bucket
 * @param fileKey the S3 object key
 * @returns ReadableStream of the file
 */
export const getFileStreamFromS3 = async (fileKey: string): Promise<ReadableStream | undefined> => {
	const client = getS3Client()
	const config = useRuntimeConfig().public.fileStorage.s3 as S3Options

	const command = new GetObjectCommand({
		Bucket: config.bucket,
		Key: fileKey,
	})

	const response = await client.send(command)
	return response.Body?.transformToWebStream()
}

/**
 * @description Delete a file from S3 bucket
 * @param fileKey the S3 object key to delete
 */
export const deleteFileFromS3 = async (fileKey: string): Promise<void> => {
	const client = getS3Client()
	const config = useRuntimeConfig().public.fileStorage.s3 as S3Options

	const command = new DeleteObjectCommand({
		Bucket: config.bucket,
		Key: fileKey,
	})

	await client.send(command)
}

/**
 * @description List all files in a S3 bucket folder
 * @param prefix the folder prefix to list files from
 * @param maxKeys maximum number of files to return (default: 1000)
 * @returns array of S3 object keys
 */
export const listFilesFromS3 = async (prefix: string = '', maxKeys: number = 1000): Promise<string[]> => {
	const client = getS3Client()
	const config = useRuntimeConfig().public.fileStorage.s3 as S3Options

	const normalizedPrefix = prefix.replace(/^\//, '').replace(/\/$/, '')
	const finalPrefix = normalizedPrefix ? `${normalizedPrefix}/` : ''

	const command = new ListObjectsV2Command({
		Bucket: config.bucket,
		Prefix: finalPrefix,
		MaxKeys: maxKeys,
	})

	const response = await client.send(command)
	return response.Contents?.map(obj => obj.Key || '') || []
}

/**
 * @description generates a random ID with the specified length
 * @param length the length of the random ID
 * @returns a random ID with the specified length
 */
const generateRandomId = (length: number): string => {
	const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
	let randomId = ''
	for (let i = 0; i < length; i++) {
		randomId += characters.charAt(Math.floor(Math.random() * characters.length))
	}
	return randomId
}