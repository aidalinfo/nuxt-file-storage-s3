# Nuxt File Storage — Usage

## Installation

```bash
npm install @aidalinfo/nuxt-file-storage-s3
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@aidalinfo/nuxt-file-storage-s3'],
})
```

---

## Configuration

### Local storage

```ts
fileStorage: {
  mount: './uploads', // folder where files are stored
}
```

### S3 / S3-compatible (Garage, MinIO, DigitalOcean Spaces…)

Recommended multi-bucket configuration:

```ts
fileStorage: {
  s3: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    region: process.env.AWS_REGION || 'us-east-1',
    defaultBucketName: 'private',
    buckets: {
      private: { bucket: process.env.AWS_S3_PRIVATE_BUCKET || 'my-private-bucket' },
      public: { bucket: process.env.AWS_S3_PUBLIC_BUCKET || 'my-public-bucket' },
    },
    endpoint: process.env.AWS_ENDPOINT,   // optional, for S3-compatible services
    forcePathStyle: true,                 // required for most S3-compatible services
  },
}
```

Bucket resolution order is: explicit `bucketName` argument -> `defaultBucketName` -> legacy `s3.bucket`.
By default, server utilities use `defaultBucketName` when no explicit `bucketName` is passed.

Legacy single-bucket mode is still supported:

```ts
fileStorage: {
  s3: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    region: process.env.AWS_REGION || 'us-east-1',
    bucket: process.env.AWS_S3_BUCKET || 'my-bucket',
  },
}
```

If `s3` is configured, all server utilities will use S3. Otherwise they fall back to local storage.

---

## Client-side — `useFileStorage()`

Composable to handle file inputs and serialize files before sending them to the server.

```vue
<script setup lang="ts">
const { files, handleFileInput, clearFiles } = useFileStorage({ clearOldFiles: true })

const submit = async () => {
  await $fetch('/api/upload', {
    method: 'POST',
    body: { files: files.value },
  })
}
</script>

<template>
  <input type="file" multiple @input="handleFileInput" />
  <button @click="submit">Upload</button>
</template>
```

### Options

| Option | Type | Default | Description |
|---|---|---|---|
| `clearOldFiles` | `boolean` | `true` | Clear previously selected files on new selection |

### Returns

| Value | Type | Description |
|---|---|---|
| `files` | `Ref<ClientFile[]>` | Serialized files ready to send |
| `handleFileInput` | `(event) => void` | Bind to `@input` on a file input |
| `clearFiles` | `() => void` | Manually clear the file list |

---

## Server-side utilities

All functions are auto-imported in server routes.

### Unified (recommended)

These functions automatically use S3 or local storage based on your configuration.

#### `storeFile(file, fileNameOrIdLength, folder?, bucketName?)`

```ts
// Generate a random 12-char filename, store in 'avatars/' prefix
const key = await storeFile(file, 12, 'avatars')

// Use a fixed filename
const key = await storeFile(file, 'profile', 'avatars')

// Store explicitly in logical "public" bucket
const key = await storeFile(file, 12, 'avatars', 'public')
```

| Param | Type | Description |
|---|---|---|
| `file` | `ServerFile` | File object from `readBody` |
| `fileNameOrIdLength` | `string \| number` | Fixed name or random ID length |
| `folder` | `string` | Subfolder / S3 prefix (optional) |
| `bucketName` | `string` | Optional logical bucket name (`public`, `private`, ...) |

Returns the file key (use it to retrieve or delete the file later).

#### `getFile(key, expiresIn?, bucketName?)`

```ts
const url = await getFile('avatars/AbCdEf123456.png')
// S3: returns a signed URL (valid 1 hour by default)
// Local: returns the file path
```

| Param | Type | Default | Description |
|---|---|---|---|
| `key` | `string` | | File key returned by `storeFile` |
| `expiresIn` | `number` | `3600` | S3 only — signed URL TTL in seconds |

#### `listFiles(folder?, bucketName?)`

```ts
const keys = await listFiles('avatars')

const publicKeys = await listFiles('avatars', 'public')
```

#### `removeFile(key, bucketName?)`

```ts
await removeFile('avatars/AbCdEf123456.png')

await removeFile('avatars/AbCdEf123456.png', 'public')
```

---

### S3-specific

```ts
storeFileToS3(file, fileNameOrIdLength, folder?, bucketName?)   // → key
getFileFromS3(key, expiresIn?, bucketName?)                     // → signed URL
getFileStreamFromS3(key, bucketName?)                           // → ReadableStream
listFilesFromS3(prefix?, maxKeys?, bucketName?)                 // → string[]
deleteFileFromS3(key, bucketName?)
```

### Local-specific

```ts
storeFileLocally(file, fileNameOrIdLength, folder?) // → filename
getFileLocally(filename, folder?)                   // → path
getFilesLocally(folder?)                            // → string[]
deleteFile(filename, folder?)
```

---

## Full example — server route

```ts
// server/api/upload.post.ts
import type { ServerFile } from '@aidalinfo/nuxt-file-storage-s3'

export default defineEventHandler(async (event) => {
  const { files } = await readBody<{ files: ServerFile[] }>(event)

  const keys = await Promise.all(
    files.map(file => storeFile(file, 12, 'uploads'))
  )

  return keys
})
```

## Full example — retrieve a file

```ts
// server/api/files/[key].get.ts
export default defineEventHandler(async (event) => {
  const key = getRouterParam(event, 'key')!
  const url = await getFile(key)
  return { url }
})
```
