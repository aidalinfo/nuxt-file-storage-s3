export default defineNuxtConfig({
	modules: ['../src/module'],

	fileStorage: {
		mount: process.env.mount || 'uploads',
		// S3 configuration example (uncomment to use S3)
		// s3: {
		// 	accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
		// 	secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
		// 	region: process.env.AWS_REGION || 'us-east-1',
		// 	bucket: process.env.AWS_S3_BUCKET || 'my-bucket',
		// 	// Optional: for S3-compatible services like MinIO
		// 	endpoint: process.env.AWS_ENDPOINT,
		// 	forcePathStyle: true,
		// },
	},

	devtools: { enabled: true },
	compatibilityDate: '2025-02-27',
})
