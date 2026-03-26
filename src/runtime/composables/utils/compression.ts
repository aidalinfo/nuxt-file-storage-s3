import type { FileCompressionOptions } from '../../../types'

const isImageFile = (file: File): boolean => file.type.startsWith('image/')
const isPdfFile = (file: File): boolean => file.type === 'application/pdf'

const getTargetDimensions = (
	width: number,
	height: number,
	maxWidth: number,
	maxHeight: number,
) => {
	if (!width || !height) {
		return { width, height }
	}

	const scale = Math.min(maxWidth / width, maxHeight / height, 1)
	return {
		width: Math.max(1, Math.floor(width * scale)),
		height: Math.max(1, Math.floor(height * scale)),
	}
}

const drawImageToCanvas = async (file: File, width: number, height: number): Promise<HTMLCanvasElement> => {
	if (typeof document === 'undefined') {
		throw new Error('Document API unavailable')
	}

	const objectUrl = URL.createObjectURL(file)
	try {
		const image = await loadImage(objectUrl)
		const canvas = document.createElement('canvas')
		canvas.width = width
		canvas.height = height

		const context = canvas.getContext('2d')
		if (!context) {
			throw new Error('Unable to initialize canvas context')
		}

		context.drawImage(image, 0, 0, width, height)
		return canvas
	}
	finally {
		URL.revokeObjectURL(objectUrl)
	}
}

const loadImage = (src: string): Promise<HTMLImageElement> => {
	return new Promise((resolve, reject) => {
		const image = new Image()
		image.onload = () => resolve(image)
		image.onerror = () => reject(new Error('Unable to load image for compression'))
		image.src = src
	})
}

const canvasToBlob = (
	canvas: HTMLCanvasElement,
	mimeType: string,
	quality: number,
): Promise<Blob> => {
	return new Promise((resolve, reject) => {
		canvas.toBlob((blob) => {
			if (!blob) {
				reject(new Error('Canvas export failed'))
				return
			}
			resolve(blob)
		}, mimeType, quality)
	})
}

const fileImageDimensions = async (file: File): Promise<{ width: number, height: number }> => {
	if (typeof createImageBitmap === 'function') {
		const bitmap = await createImageBitmap(file)
		try {
			return { width: bitmap.width, height: bitmap.height }
		}
		finally {
			bitmap.close()
		}
	}

	const objectUrl = URL.createObjectURL(file)
	try {
		const image = await loadImage(objectUrl)
		return { width: image.naturalWidth, height: image.naturalHeight }
	}
	finally {
		URL.revokeObjectURL(objectUrl)
	}
}

const compressPdfFile = async (file: File): Promise<File> => {
	// V1: no browser-native PDF recompression that is reliable and format-safe.
	// Keep the strategy entry-point for future implementations without API breaks.
	return file
}

const compressImageFile = async (file: File, options: FileCompressionOptions): Promise<File> => {
	const { width, height } = await fileImageDimensions(file)
	const { width: targetWidth, height: targetHeight } = getTargetDimensions(
		width,
		height,
		options.image.maxWidth,
		options.image.maxHeight,
	)

	const canvas = await drawImageToCanvas(file, targetWidth, targetHeight)
	const blob = await canvasToBlob(canvas, file.type, options.image.quality)

	if (blob.type && blob.type !== file.type) {
		return file
	}

	if (blob.size >= file.size) {
		return file
	}

	return new File([blob], file.name, {
		type: file.type,
		lastModified: file.lastModified,
	})
}

export const compressFile = async (
	file: File,
	options: FileCompressionOptions,
): Promise<File> => {
	if (!options.enabled) {
		return file
	}

	if (isImageFile(file) && options.image.enabled) {
		try {
			return await compressImageFile(file, options)
		}
		catch {
			return file
		}
	}

	if (isPdfFile(file) && options.pdf.enabled) {
		try {
			return await compressPdfFile(file)
		}
		catch {
			return file
		}
	}

	return file
}
