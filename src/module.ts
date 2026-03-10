import {
	defineNuxtModule,
	createResolver,
	addImportsDir,
	addServerScanDir,
	logger,
} from '@nuxt/kit'
// import { $fetch } from 'ofetch'
import defu from 'defu'
// import { version } from '../package.json'

import type { ModuleOptions } from './types'
export type * from './types'

export default defineNuxtModule<ModuleOptions>({
	meta: {
		name: '@aidalinfo/nuxt-file-storage-s3',
		configKey: 'fileStorage',
	},
	//? Default configuration options of the Nuxt module
	//! no defaults for now
	// defaults: {
	// 	version: '0.0.0',
	// },
	setup(options, nuxt) {
		const config = nuxt.options.runtimeConfig as any
		config.public.fileStorage = defu(config.public.fileStorage, {
			...options,
		})

		if (!config.public.fileStorage.mount && !config.public.fileStorage.s3) {
			logger.error(
				'Please provide either a mount path or S3 configuration for the file storage module in your nuxt.config.js',
			)
		} else {
			const storageType = config.public.fileStorage.s3 ? 'S3' : 'local'
			logger.ready(
				`Nuxt File Storage has mounted successfully with ${storageType} storage`,
			)
		}

		// Validate S3 configuration if provided
		if (config.public.fileStorage.s3) {
			const s3Config = config.public.fileStorage.s3
			const requiredFields = ['accessKeyId', 'secretAccessKey', 'region']
			const missingFields = requiredFields.filter(field => !s3Config[field])

			if (missingFields.length > 0) {
				logger.error(
					`Missing required S3 configuration fields: ${missingFields.join(', ')}`,
				)
			}

			const hasLegacyBucket = !!s3Config.bucket
			const hasDefaultBucketName = !!s3Config.defaultBucketName
			const hasBuckets = !!s3Config.buckets && Object.keys(s3Config.buckets).length > 0
			const hasMultiBucketMode = hasDefaultBucketName || hasBuckets

			if (!hasLegacyBucket && !hasMultiBucketMode) {
				logger.error(
					'Invalid S3 bucket configuration: provide legacy s3.bucket or multi-bucket mode (s3.defaultBucketName + s3.buckets)',
				)
			}

			if (hasMultiBucketMode) {
				if (!hasDefaultBucketName || !hasBuckets) {
					logger.error(
						'Invalid multi-bucket S3 configuration: both s3.defaultBucketName and a non-empty s3.buckets mapping are required',
					)
				} else if (!s3Config.buckets[s3Config.defaultBucketName]?.bucket) {
					logger.error(
						`Invalid multi-bucket S3 configuration: defaultBucketName "${s3Config.defaultBucketName}" is missing from s3.buckets`,
					)
				} else {
					logger.info(
						`S3 multi-bucket mode enabled (default: ${s3Config.defaultBucketName})`,
					)
				}
			} else if (hasLegacyBucket) {
				logger.info('S3 legacy bucket mode enabled (s3.bucket)')
			}
		}

		// if (nuxt.options.dev) {
		// 	// $fetch('https://registry.npmjs.org/nuxt-file-storage/latest')
		// 	// 	.then((release: any) => {
		// 	// 		if (release.version > version)
		// 	// 			logger.info(
		// 	// 				`A new version of Nuxt File Storage (v${release.version}) is available: https://github.com/nyllre/nuxt-file-storage/releases/latest`,
		// 	// 			)
		// 	// 	})
		// 	// 	.catch(() => {})
		// }

		const resolve = createResolver(import.meta.url).resolve

		addImportsDir(resolve('runtime/composables'))
		addServerScanDir(resolve('./runtime/server'))
	},
})
