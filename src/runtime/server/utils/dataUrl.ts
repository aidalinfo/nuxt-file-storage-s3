export const parseDataUrl = (file: string): { binaryString: Buffer, ext: string } => {
	const arr: string[] = file.split(',')
	if (arr.length < 2 || !arr[0] || !arr[1]) {
		throw new Error('Invalid data URL')
	}

	const mimeMatch = arr[0].match(/:(.*?);/)
	if (!mimeMatch) {
		throw new Error('Invalid data URL')
	}

	const mime: string = mimeMatch[1] || ''
	const base64String: string = arr[1]
	const binaryString: Buffer = Buffer.from(base64String, 'base64')
	const ext = mime.split('/')[1] || ''

	return { binaryString, ext }
}

export const toDataUrl = (binary: Buffer, mimeType: string): string => {
	return `data:${mimeType};base64,${binary.toString('base64')}`
}
