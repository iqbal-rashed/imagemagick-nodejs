> **⚠️ Notice** — This package is currently in beta. APIs may change before the stable release. Please report any issues you encounter on [GitHub](https://github.com/iqbal-rashed/imagemagick-nodejs/issues).

<div align="center">

  <!-- Logo/Icon -->
  <!-- <img src="https://imagemagick.org/image/logo.svg" alt="ImageMagick" width="120" height="120"> -->

# ImageMagick Node.js

**A comprehensive, type-safe Node.js wrapper for ImageMagick CLI**

[![npm version](https://badge.fury.io/js/imagemagick-nodejs.svg)](https://www.npmjs.com/package/imagemagick-nodejs)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/imagemagick-nodejs.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)

[Features](#-features) • [Installation](#-installation) • [Quick Start](#-quick-start) • [API Reference](#-api-reference) • [Error Handling](#️-error-handling) • [Contributing](#-contributing)

</div>

---

## ✨ Features

- **📥 Zero Configuration** — Bundled ImageMagick binaries, automatically downloaded on install
- **🔒 Full TypeScript Support** — Comprehensive type definitions and type-safe APIs
- **⚡ Dual Module Support** — ESM and CommonJS compatibility via tsup
- **🎨 High-Level Fluent API** — Chainable methods for intuitive image processing
- **🔧 Low-Level Command Wrappers** — Direct access to all ImageMagick tools
- **📦 Batch Processing** — Process multiple images with built-in progress tracking
- **🌊 Stream Support** — Efficient memory usage with streaming operations
- **🌍 Cross-Platform** — Windows, macOS, and Linux (glibc & musl)

## 📦 Installation

```bash
npm install imagemagick-nodejs
```

**That's it!** ImageMagick binaries are automatically downloaded during installation.

### Supported Platforms

| Platform | Architectures | Notes                            |
| -------- | ------------- | -------------------------------- |
| Windows  | x64, x86      | Portable static build            |
| macOS    | arm64, x64    | Bundled with dylibs              |
| Linux    | amd64, arm64  | glibc and musl (Alpine) variants |

### Using System ImageMagick

To skip the bundled binary and use your system's ImageMagick instead:

```bash
IMAGEMAGICK_SKIP_DOWNLOAD=1 npm install imagemagick-nodejs
```

---

## 🚀 Quick Start

```typescript
import { imageMagick, identify, convert } from 'imagemagick-nodejs';

// High-level fluent API
await imageMagick('input.jpg').resize(800, 600).quality(85).blur(2).toFile('output.webp');

// Get image information
const info = await identify('image.jpg');
console.log(`${info.width}x${info.height} ${info.format}`);

// Low-level command builder
await convert('input.png')
  .resize(1200)
  .sharpen({ sigma: 1.5 })
  .quality(90)
  .strip()
  .output('output.jpg')
  .run();
```

---

## 📚 API Reference

### High-Level Fluent API

```typescript
import { imageMagick } from 'imagemagick-nodejs';

const image = imageMagick('input.jpg');

// Chain operations
await image
  .resize(800, 600, { fit: 'cover' })
  .crop(800, 600)
  .rotate(45, 'white')
  .blur(3)
  .sharpen(1)
  .quality(85)
  .strip()
  .toFile('output.jpg');

// Output options
await image.toFile('output.jpg'); // Write to file
const buffer = await image.toBuffer(); // Get as Buffer
const stream = await image.toStream(); // Get as stream
```

### Command Wrappers

#### Convert

```typescript
import { convert, runConvert, convertImage } from 'imagemagick-nodejs';

// Builder pattern
const builder = convert('input.jpg').resize(800, 600).quality(85).output('output.webp');

await runConvert(builder);

// Simple conversion
await convertImage('input.jpg', 'output.webp', {
  resize: { width: 800 },
  quality: 85,
  strip: true,
});
```

#### Identify

```typescript
import { identify, getDimensions, getFormat } from 'imagemagick-nodejs';

// Full image info
const info = await identify('image.jpg');
console.log(info.format); // 'JPEG'
console.log(info.width); // 1920
console.log(info.height); // 1080
console.log(info.depth); // 8
console.log(info.colorspace); // 'sRGB'

// Quick helpers
const dims = await getDimensions('image.jpg');
const format = await getFormat('image.jpg');
```

#### Mogrify (Batch In-Place)

```typescript
import { mogrify, batchResize, batchOptimize } from 'imagemagick-nodejs';

// Batch resize all JPGs in place
await batchResize('*.jpg', 800);

// Batch optimize for web
await batchOptimize('images/*.png');
```

#### Composite

```typescript
import { composite, overlayImage, addWatermark } from 'imagemagick-nodejs';

// Add watermark
await addWatermark('watermark.png', 'photo.jpg', 'output.jpg', {
  gravity: 'SouthEast',
  opacity: 50,
});

// Blend images
await blendImages('image1.jpg', 'image2.jpg', 'blended.jpg', 50);
```

#### Montage

```typescript
import { createContactSheet, createThumbnailGallery } from 'imagemagick-nodejs';

// Create contact sheet
await createContactSheet(['img1.jpg', 'img2.jpg', 'img3.jpg'], 'sheet.jpg', {
  columns: 3,
  tileSize: 200,
  label: true,
});
```

#### Compare

```typescript
import { compareImages, areIdentical, getSSIM } from 'imagemagick-nodejs';

// Check if identical
const identical = await areIdentical('img1.jpg', 'img2.jpg');

// Get similarity score
const ssim = await getSSIM('img1.jpg', 'img2.jpg');

// Create diff image
await createDiffImage('img1.jpg', 'img2.jpg', 'diff.png');
```

#### Animate

```typescript
import { createGif, createWebP, extractFrames } from 'imagemagick-nodejs';

// Create animated GIF
await createGif(['frame1.png', 'frame2.png', 'frame3.png'], 'animation.gif', {
  delay: 50,
  loop: 0,
});

// Extract frames from GIF
await extractFrames('animation.gif', 'frame-%03d.png');
```

### Batch Processing

```typescript
import { processBatch, findImages, batchOptimizeFiles } from 'imagemagick-nodejs';

// Find all images
const images = await findImages('./photos', {
  extensions: ['.jpg', '.png'],
  recursive: true,
});

// Process with progress tracking
await processBatch(
  images,
  (file) => ['convert', file, '-resize', '800x600', `output/${path.basename(file)}`],
  {
    parallel: 4,
    onProgress: ({ current, percentage }) => {
      console.log(`${percentage}% - ${current}`);
    },
  }
);
```

### Utilities

```typescript
import { isFormatSupported, getMimeType, detectFormat, extractPalette } from 'imagemagick-nodejs';

// Check format support
const supported = await isFormatSupported('webp');

// Get MIME type
const mime = getMimeType('png'); // 'image/png'

// Detect actual format (from content)
const format = await detectFormat('unknown-file');

// Extract color palette
const colors = await extractPalette('image.jpg', 8);
```

### Binary Management

```typescript
import {
  findBinary,
  setBinaryPath,
  addBinarySearchPath,
  getVersion,
  isAvailable,
  getSupportedFormats,
} from 'imagemagick-nodejs';

// Check availability
if (await isAvailable()) {
  const version = await getVersion();
  console.log(`ImageMagick ${version.version}`);
}

// Set explicit binary path (highest priority)
setBinaryPath('/custom/path/to/magick');

// Add additional search paths (checked after bundled binary)
addBinarySearchPath('/opt/imagemagick/bin/magick');

// List supported formats
const formats = await getSupportedFormats();
```

#### Binary Search Order

1. Custom path set via `setBinaryPath()`
2. Bundled binary in `bin/` (downloaded during install)
3. System PATH
4. Common installation paths + paths added via `addBinarySearchPath()`

---

## 🛠️ Error Handling

```typescript
import { ImageMagickError, BinaryNotFoundError, ExecutionError } from 'imagemagick-nodejs';

try {
  await convertImage('input.jpg', 'output.webp');
} catch (error) {
  if (error instanceof BinaryNotFoundError) {
    console.error('ImageMagick not found. Please install it.');
  } else if (error instanceof ExecutionError) {
    console.error(`Command failed: ${error.stderr}`);
  }
}
```

---

## 🤝 Contributing

We welcome contributions! Please see [**CONTRIBUTING.md**](docs/CONTRIB.md) for details on:

- Development setup and workflow
- Coding standards and conventions
- Testing guidelines
- Pull request process

---

## 🙏 Acknowledgments

Built on top of [ImageMagick](https://imagemagick.org/) — a powerful suite of image manipulation tools.
