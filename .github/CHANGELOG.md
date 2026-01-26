# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-26

### Added

- Initial release of imagemagick-nodejs
- High-level fluent API for image manipulation
- Command wrappers for ImageMagick CLI tools:
  - `convert` - Image conversion and transformation
  - `identify` - Image information extraction
  - `mogrify` - Batch in-place transformations
  - `composite` - Image composition and watermarking
  - `montage` - Contact sheet and thumbnail gallery creation
  - `compare` - Image comparison and diff generation
  - `animate` - Animated GIF and WebP creation
- Batch processing utilities with progress tracking
- Cross-platform binary management (Windows, macOS, Linux)
- Automatic binary download on installation
- Full TypeScript support with comprehensive type definitions
- Dual module support (ESM and CommonJS)
- Stream support for efficient memory usage
- 47 unit tests with comprehensive coverage
- Extensive documentation and examples

### Features

- Zero configuration setup with bundled binaries
- Type-safe chainable API
- Parallel batch processing
- Custom binary path configuration
- Support for all major image formats (JPEG, PNG, WebP, AVIF, HEIC, etc.)
- Error handling with custom error types
- Progress tracking for batch operations
- Image format validation
- Path traversal protection

[1.0.0]: https://github.com/iqbal-rashed/imagemagick-nodejs/releases/tag/v1.0.0
