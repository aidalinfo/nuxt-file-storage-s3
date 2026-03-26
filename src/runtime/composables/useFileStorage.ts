import { ref } from 'vue'
import { useRuntimeConfig } from '#imports'
import type {
	ClientFile,
	DeepPartial,
	FileCompressionOptions,
	HandleFileInputOptions,
	UseFileStorageOptions,
} from '../../types'
import { compressFile } from './utils/compression'
import { resolveHandleFileInputOptions } from './utils/options'

const getEventFiles = (event: any): File[] => {
	const inputFiles = event?.target?.files
	if (!inputFiles) {
		return []
	}

	return Array.from(inputFiles) as File[]
}

export default function (options: UseFileStorageOptions = { clearOldFiles: true }) {
	const files = ref<ClientFile[]>([])
	const runtimeConfig = useRuntimeConfig()
	const globalCompression = runtimeConfig.public.fileStorage?.compression as DeepPartial<FileCompressionOptions> | undefined

	const serializeFile = (file: File): Promise<void> => {
		return new Promise<void>((resolve, reject) => {
			const reader = new FileReader()
			reader.onload = (e: ProgressEvent<FileReader>) => {
				files.value.push({
					...(file as unknown as ClientFile),
					name: file.name,
					size: file.size,
					type: file.type,
					lastModified: file.lastModified,
					content: e.target?.result,
				})
				resolve()
			}
			reader.onerror = (error) => {
				reject(error)
			}
			reader.readAsDataURL(file)
		})
	}

	const clearFiles = () => {
		files.value.splice(0, files.value.length)
	}

	const handleFileInput = async (event: any, inputOptions?: HandleFileInputOptions) => {
		const resolvedOptions = resolveHandleFileInputOptions(inputOptions, options, globalCompression)

		if (resolvedOptions.clearOldFiles) {
			clearFiles()
		}

		const promises = []
		for (const file of getEventFiles(event)) {
			promises.push(
				compressFile(file, resolvedOptions.compression)
					.then(processedFile => serializeFile(processedFile))
					.catch(() => serializeFile(file)),
			)
		}

		await Promise.all(promises)
	}

	return {
		files,
		handleFileInput,
		clearFiles,
	}
}
