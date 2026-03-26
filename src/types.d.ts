export interface ServerFile {
	name: string
	content: string
	size: string
	type: string
	lastModified: string
}

export interface ClientFile extends Blob {
	content: string | ArrayBuffer | null | undefined
	name: string
	lastModified: number
}

export interface S3Options {
	accessKeyId: string
	secretAccessKey: string
	region: string
	bucket?: string
	defaultBucketName?: string
	buckets?: Record<string, { bucket: string }>
	endpoint?: string
	forcePathStyle?: boolean
}

export type DeepPartial<T> = {
	[K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K]
}

export interface FileCompressionOptions {
	enabled: boolean
	image: {
		enabled: boolean
		quality: number
		maxWidth: number
		maxHeight: number
	}
	pdf: {
		enabled: boolean
	}
}

export interface ServerFileCompressionOptions {
	enabled: boolean
	pdf: {
		enabled: boolean
	}
}

export type ModuleCompressionOptions = DeepPartial<FileCompressionOptions> & {
	client?: DeepPartial<FileCompressionOptions>
	server?: DeepPartial<ServerFileCompressionOptions>
}

export interface UseFileStorageOptions {
	clearOldFiles?: boolean
	compression?: DeepPartial<FileCompressionOptions>
}

export interface HandleFileInputOptions {
	clearOldFiles?: boolean
	compression?: DeepPartial<FileCompressionOptions>
}

export interface ModuleOptions {
	mount: string
	version: string
	s3?: S3Options
	compression?: ModuleCompressionOptions
}
