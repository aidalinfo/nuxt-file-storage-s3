export default defineNuxtConfig({
	modules: ['../src/module'],

	fileStorage: {
		// mount: process.env.mount || 'uploads',
		compression: {
			client: {
				enabled: true,
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
				enabled: true,
				pdf: {
					enabled: true,
				},
			},
		},
		// S3 configuration example (recommended multi-bucket mode)
		s3: {
			accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
			secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
			region: process.env.AWS_REGION || 'garage',
			defaultBucketName: 'private',
			buckets: {
				private: { bucket: process.env.AWS_S3_PRIVATE_BUCKET || 'my-private-bucket' },
				public: { bucket: process.env.AWS_S3_PUBLIC_BUCKET || 'my-public-bucket' },
			},
			// Legacy mode remains supported:
			// bucket: process.env.AWS_S3_BUCKET || 'my-bucket',
			endpoint: process.env.AWS_ENDPOINT,
			forcePathStyle: true,
		},
	},

	devtools: { enabled: true },
	compatibilityDate: '2025-02-27',
})
