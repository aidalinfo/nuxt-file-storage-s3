![Nuxt File Storage Banner](./playground/public/nuxt-file-storage-banner.svg)

# @aidalinfo/nuxt-file-storage-s3

[![Nuxt][nuxt-src]][nuxt-href]

Easy solution to store files in your Nuxt apps — supports **local storage** and **S3-compatible storage** (AWS S3, Garage, MinIO, DigitalOcean Spaces…).

## Features

- 📁 &nbsp;Handle file inputs on the frontend and serialize them for the backend
- 🖴 &nbsp;Store files locally via Nitro server engine
- ☁️ &nbsp;Store files on S3 or any S3-compatible service
- 🔀 &nbsp;Unified API — same functions work for both local and S3, automatically detected from config

## Quick Setup

```bash
npm install @aidalinfo/nuxt-file-storage-s3
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@aidalinfo/nuxt-file-storage-s3'],
  fileStorage: {
    mount: './uploads', // local storage
  },
})
```

## Configuration

### Local storage

```ts
fileStorage: {
  mount: process.env.mount || './uploads',
}
```

### S3 / S3-compatible

```ts
fileStorage: {
  s3: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    region: process.env.AWS_REGION || 'us-east-1',
    bucket: process.env.AWS_S3_BUCKET || 'my-bucket',
    endpoint: process.env.AWS_ENDPOINT,  // optional, for S3-compatible services
    forcePathStyle: true,                // required for most S3-compatible services
  },
}
```

If `s3` is configured, all server utilities will automatically use S3. Otherwise they fall back to local storage.

---

## Usage

### Frontend — `useFileStorage()`

```vue
<script setup>
const { files, handleFileInput } = useFileStorage({ clearOldFiles: true })

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

**Multiple file inputs:** create a new instance per input.

```vue
<script setup>
const { handleFileInput: handleAvatar, files: avatar } = useFileStorage()
const { handleFileInput: handleBanner, files: banner } = useFileStorage()
</script>
```

---

### Backend — server utilities

All functions are auto-imported in server routes (`server/api/`, `server/routes/`…).

#### Unified functions (recommended)

Automatically use S3 or local storage based on your config.

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

| Function | Description |
|---|---|
| `storeFile(file, name, folder?)` | Store a file. `name` can be a string (fixed name) or number (random ID length). Returns the file key. |
| `getFile(key, expiresIn?)` | Returns a signed URL (S3) or local path. `expiresIn` defaults to 3600s. |
| `listFiles(folder?)` | List all files in a folder / S3 prefix. |
| `removeFile(key)` | Delete a file. |

#### S3-specific functions

```ts
storeFileToS3(file, name, folder?)     // → key
getFileFromS3(key, expiresIn?)         // → signed URL
getFileStreamFromS3(key)               // → ReadableStream
listFilesFromS3(prefix?, maxKeys?)     // → string[]
deleteFileFromS3(key)
```

#### Local-specific functions

```ts
storeFileLocally(file, name, folder?)  // → filename
getFileLocally(filename, folder?)      // → path
getFilesLocally(folder?)               // → string[]
deleteFile(filename, folder?)
```

---

## Local dev with Garage (S3-compatible)

[Garage](https://garagehq.deuxfleurs.fr) is a lightweight self-hosted S3-compatible storage server, great for local development.

A `docker-compose.yml` is included at the root of this repo. Start it with:

```bash
docker compose up -d
./docker/init-garage.sh
```

The init script creates a bucket and an access key, and prints the credentials to use in your `.env`:

```env
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=garage
AWS_S3_BUCKET=my-bucket
AWS_ENDPOINT=http://localhost:3900
```

A web UI (s3manager) is also available at **http://localhost:8080**.

---

## Contribution

Run into a problem? Open a [new issue](https://github.com/aidalinfo/nuxt-file-storage-s3/issues/new).

Want to add a feature? PRs are welcome!

```bash
git clone https://github.com/aidalinfo/nuxt-file-storage-s3 && cd nuxt-file-storage-s3
npm i
npm run dev:prepare
npm run dev
```

<!-- Badges -->

[nuxt-src]: https://img.shields.io/badge/Nuxt-18181B?logo=nuxt.js
[nuxt-href]: https://nuxt.com
