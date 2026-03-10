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

export interface ModuleOptions {
	mount: string
	version: string
	s3?: S3Options
}
